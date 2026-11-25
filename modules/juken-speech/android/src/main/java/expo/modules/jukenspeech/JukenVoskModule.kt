package expo.modules.jukenspeech

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.SystemClock
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import java.io.File
import android.os.Handler
import android.os.Looper
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicLong
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer

class JukenVoskModule : Module() {
  private val worker = Executors.newSingleThreadExecutor()
  private val generation = AtomicLong()
  private val root: File get() = File(requireNotNull(appContext.reactContext).noBackupFilesDir, "vosk")
  private val rate = 16000
  // Model operations all run on worker. Keep at most one language warm.
  private var loadedModel: Model? = null
  private var loadedPath: File? = null
  private val main = Handler(Looper.getMainLooper())
  private val evict = Runnable { if (!worker.isShutdown) worker.execute { releaseModel() } }

  private fun releaseModel() {
    loadedModel?.close()
    loadedModel = null
    loadedPath = null
  }

  private fun modelFor(path: File): Model {
    if (path != loadedPath) {
      releaseModel()
      loadedModel = Model(path.path)
      loadedPath = path
    }
    return requireNotNull(loadedModel)
  }

  override fun definition() = ModuleDefinition {
    Name("JukenVosk")
    Events("speechActivity")

    AsyncFunction("installed") { locale: String -> VoskModels.installed(root, locale) != null }
    AsyncFunction("install").SuspendBody { locale: String ->
      withContext(Dispatchers.IO) { VoskModels.install(root, locale) }
      true
    }
    AsyncFunction("listen") { locale: String, requestId: Int, shareAudio: Boolean, promise: Promise ->
      val token = generation.incrementAndGet()
      main.removeCallbacks(evict)
      val path = VoskModels.installed(root, locale)
      worker.execute {
        val result = try {
          if (path == null) mapOf("status" to "unavailable")
          else if (token != generation.get()) mapOf("status" to "cancelled")
          else Recognizer(modelFor(path), rate.toFloat()).use { capture(it, token, requestId, shareAudio) }
        } catch (e: SecurityException) {
          mapOf("status" to "permission")
        } catch (e: Exception) {
          mapOf("status" to "unavailable")
        } catch (e: LinkageError) {
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
      worker.execute { releaseModel() }
    }
    OnDestroy {
      generation.incrementAndGet()
      main.removeCallbacks(evict)
      worker.execute { releaseModel() }
      worker.shutdown()
    }
  }

  @SuppressLint("MissingPermission")
  private fun capture(recognizer: Recognizer, token: Long, requestId: Int, shareAudio: Boolean): Map<String, Any> {
    fun active() = generation.get() == token
    fun activity(stage: String, text: String = "") {
      if (active()) sendEvent("speechActivity", mapOf("requestId" to requestId, "stage" to stage, "text" to text))
    }

    if (!active()) return mapOf("status" to "cancelled")
    val channel = AudioFormat.CHANNEL_IN_MONO
    val format = AudioFormat.ENCODING_PCM_16BIT
    val minimum = AudioRecord.getMinBufferSize(rate, channel, format)
    check(minimum > 0)
    val buffer = ByteArray(rate * 2 / 10)
    val audio = if (shareAudio) ByteArrayOutputStream() else null
    val recorder = AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION, rate, channel, format,
      maxOf(minimum, buffer.size * 4))
    try {
      check(recorder.state == AudioRecord.STATE_INITIALIZED)
      recorder.startRecording()
      check(recorder.recordingState == AudioRecord.RECORDSTATE_RECORDING)
      activity("ready")
      var lastPartial = ""
      var finalText = ""
      val deadline = SystemClock.elapsedRealtime() + 15000
      while (active() && SystemClock.elapsedRealtime() < deadline) {
        val count = recorder.read(buffer, 0, buffer.size)
        check(count > 0)
        audio?.write(buffer, 0, count)
        if (recognizer.acceptWaveForm(buffer, count)) {
          finalText = JSONObject(recognizer.result).optString("text").trim()
          if (finalText.isNotEmpty()) break
        } else {
          val partial = JSONObject(recognizer.partialResult).optString("partial").trim()
          if (partial.isNotEmpty() && partial != lastPartial) {
            activity("partial", partial)
            lastPartial = partial
          }
        }
      }
      if (!active()) return mapOf("status" to "cancelled")
      activity("processing")
      if (finalText.isEmpty()) finalText = JSONObject(recognizer.finalResult).optString("text").trim()
      // Word posteriors are not calibrated utterance confidence. Keep mismatches unscored.
      return buildMap {
        put("status", if (finalText.isBlank()) "silence" else "result")
        put("text", finalText)
        if (audio != null) put("audio", audio.toByteArray())
      }
    } finally {
      try {
        if (recorder.recordingState == AudioRecord.RECORDSTATE_RECORDING) recorder.stop()
      } finally { recorder.release() }
    }
  }
}
