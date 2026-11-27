package expo.modules.jukenspeech

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import com.k2fsa.sherpa.onnx.FeatureConfig
import com.k2fsa.sherpa.onnx.OfflineRecognizer
import com.k2fsa.sherpa.onnx.OfflineRecognizerConfig
import com.k2fsa.sherpa.onnx.SileroVadModelConfig
import com.k2fsa.sherpa.onnx.Vad
import com.k2fsa.sherpa.onnx.VadModelConfig
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicLong
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class JukenParakeetModule : Module() {
  private val worker = Executors.newSingleThreadExecutor()
  private val generation = AtomicLong()
  private val root: File get() = File(requireNotNull(appContext.reactContext).noBackupFilesDir, "parakeet")
  private val rate = 16000
  private val vadWindowSamples = 512

  // Model operations all run on worker. Keep at most one recognizer and VAD warm.
  private var loadedRecognizer: OfflineRecognizer? = null
  private var loadedPath: File? = null
  private var loadedVad: Vad? = null
  private var loadedVadPath: File? = null
  private val main = Handler(Looper.getMainLooper())
  private val evict = Runnable { if (!worker.isShutdown) worker.execute { releaseModels() } }

  private fun releaseModels() {
    loadedRecognizer?.release()
    loadedRecognizer = null
    loadedPath = null
    loadedVad?.release()
    loadedVad = null
    loadedVadPath = null
  }

  private fun recognizerFor(installed: ParakeetModels.InstalledModel): OfflineRecognizer {
    if (installed.dir != loadedPath) {
      loadedRecognizer?.release()
      loadedRecognizer = null
      loadedPath = null
      val threads = Runtime.getRuntime().availableProcessors().coerceIn(2, 4)
      val config = OfflineRecognizerConfig(
        featConfig = FeatureConfig(sampleRate = rate, featureDim = 80),
        modelConfig = ParakeetModels.modelConfig(installed, threads),
      )
      loadedRecognizer = OfflineRecognizer(assetManager = null, config = config)
      loadedPath = installed.dir
    }
    return requireNotNull(loadedRecognizer)
  }

  private fun vadFor(vadFile: File): Vad {
    if (vadFile != loadedVadPath) {
      loadedVad?.release()
      loadedVad = null
      loadedVadPath = null
      val config = VadModelConfig(
        sileroVadModelConfig = SileroVadModelConfig(
          model = vadFile.path,
          threshold = 0.45f,
          minSilenceDuration = 0.5f,
          minSpeechDuration = 0.1f,
          windowSize = vadWindowSamples,
          maxSpeechDuration = 10.0f,
        ),
        sampleRate = rate,
        numThreads = 1,
        provider = "cpu",
      )
      loadedVad = Vad(assetManager = null, config = config)
      loadedVadPath = vadFile
    }
    return requireNotNull(loadedVad)
  }

  override fun definition() = ModuleDefinition {
    Name("JukenParakeet")
    Events("speechActivity")

    AsyncFunction("installed") { locale: String -> ParakeetModels.installed(root, locale) != null }
    AsyncFunction("install").SuspendBody { locale: String ->
      withContext(Dispatchers.IO) { ParakeetModels.install(root, locale) }
      true
    }
    AsyncFunction("listen") { locale: String, requestId: Int, shareAudio: Boolean, promise: Promise ->
      val token = generation.incrementAndGet()
      main.removeCallbacks(evict)
      val installed = ParakeetModels.installed(root, locale)
      worker.execute {
        val result = try {
          if (installed == null) mapOf("status" to "unavailable")
          else if (token != generation.get()) mapOf("status" to "cancelled")
          else capture(installed, token, requestId, shareAudio)
        } catch (_: SecurityException) {
          mapOf("status" to "permission")
        } catch (_: Exception) {
          mapOf("status" to "unavailable")
        } catch (_: LinkageError) {
          mapOf("status" to "unavailable")
        } catch (_: OutOfMemoryError) {
          releaseModels()
          mapOf("status" to "unavailable")
        }
        main.removeCallbacks(evict)
        main.postDelayed(evict, 30000)
        promise.resolve(if (token == generation.get()) result else mapOf("status" to "cancelled"))
      }
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("cancel") { promise: Promise ->
      generation.incrementAndGet()
      // Resolve only after the previous capture has released the microphone.
      worker.execute { promise.resolve(null) }
    }.runOnQueue(Queues.MAIN)
    OnActivityEntersBackground {
      generation.incrementAndGet()
      main.removeCallbacks(evict)
      worker.execute { releaseModels() }
    }
    OnDestroy {
      generation.incrementAndGet()
      main.removeCallbacks(evict)
      worker.execute { releaseModels() }
      worker.shutdown()
    }
  }

  @SuppressLint("MissingPermission")
  private fun capture(
    installed: ParakeetModels.InstalledModel,
    token: Long,
    requestId: Int,
    shareAudio: Boolean,
  ): Map<String, Any> {
    fun active() = generation.get() == token
    fun activity(stage: String, text: String = "") {
      if (active()) sendEvent("speechActivity", mapOf("requestId" to requestId, "stage" to stage, "text" to text))
    }

    if (!active()) return mapOf("status" to "cancelled")
    val recognizer = recognizerFor(installed)
    val vad = vadFor(installed.vadFile)
    vad.reset()

    val channel = AudioFormat.CHANNEL_IN_MONO
    val format = AudioFormat.ENCODING_PCM_16BIT
    val minimum = AudioRecord.getMinBufferSize(rate, channel, format)
    check(minimum > 0)
    val readShorts = ShortArray(vadWindowSamples * 2)
    val byteScratch = if (shareAudio) ByteArray(readShorts.size * 2) else null
    val audio = if (shareAudio) ByteArrayOutputStream() else null
    val vadWindow = FloatArray(vadWindowSamples)
    var vadFill = 0

    val recorder = AudioRecord(
      MediaRecorder.AudioSource.VOICE_RECOGNITION,
      rate,
      channel,
      format,
      maxOf(minimum, readShorts.size * 2 * 4),
    )

    var segmentSamples: FloatArray? = null
    try {
      check(recorder.state == AudioRecord.STATE_INITIALIZED)
      recorder.startRecording()
      check(recorder.recordingState == AudioRecord.RECORDSTATE_RECORDING)
      activity("ready")
      var speakingNotified = false
      val deadline = SystemClock.elapsedRealtime() + 15000

      while (active() && SystemClock.elapsedRealtime() < deadline) {
        val count = recorder.read(readShorts, 0, readShorts.size)
        check(count >= 0)
        if (count == 0) continue

        if (audio != null && byteScratch != null) {
          for (i in 0 until count) {
            val sample = readShorts[i].toInt()
            byteScratch[i * 2] = (sample and 0xff).toByte()
            byteScratch[i * 2 + 1] = ((sample ushr 8) and 0xff).toByte()
          }
          audio.write(byteScratch, 0, count * 2)
        }

        for (i in 0 until count) {
          vadWindow[vadFill++] = readShorts[i] / 32768.0f
          if (vadFill == vadWindowSamples) {
            vad.acceptWaveform(vadWindow)
            vadFill = 0
            if (!speakingNotified && vad.isSpeechDetected()) {
              speakingNotified = true
              activity("speaking")
            }
            if (!vad.empty()) {
              val segment = vad.front()
              vad.pop()
              segmentSamples = segment.samples
              break
            }
          }
        }
        if (segmentSamples != null) break
      }

      if (active() && segmentSamples == null) {
        vad.flush()
        if (!vad.empty()) {
          val segment = vad.front()
          vad.pop()
          segmentSamples = segment.samples
        }
      }
    } finally {
      try {
        if (recorder.recordingState == AudioRecord.RECORDSTATE_RECORDING) recorder.stop()
      } finally {
        recorder.release()
      }
    }

    if (!active()) return mapOf("status" to "cancelled")
    val samples = segmentSamples
    if (samples == null || samples.isEmpty()) {
      return buildMap {
        put("status", "silence")
        put("text", "")
        if (audio != null && audio.size() > 0) put("audio", audio.toByteArray())
      }
    }

    activity("processing")
    val stream = recognizer.createStream()
    val finalText = try {
      stream.acceptWaveform(samples, rate)
      recognizer.decode(stream)
      recognizer.getResult(stream).text.trim()
    } finally {
      stream.release()
    }
    if (!active()) return mapOf("status" to "cancelled")

    return buildMap {
      put("status", if (finalText.isBlank()) "silence" else "result")
      put("text", finalText)
      if (audio != null && audio.size() > 0) put("audio", audio.toByteArray())
    }
  }
}
