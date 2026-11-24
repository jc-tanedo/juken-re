package expo.modules.jukenspeech

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class JukenSpeechModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private var active: Utterance? = null

  override fun definition() = ModuleDefinition {
    Name("JukenSpeech")

    AsyncFunction("listen") { locale: String, local: Boolean, promise: Promise ->
      active?.finish("cancelled")
      val context = appContext.reactContext
      if (context == null) {
        promise.resolve(mapOf("status" to "unavailable"))
        return@AsyncFunction
      }
      try {
        val recognizer = when {
          local && Build.VERSION.SDK_INT >= 31 && SpeechRecognizer.isOnDeviceRecognitionAvailable(context) ->
            SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
          !local && SpeechRecognizer.isRecognitionAvailable(context) ->
            SpeechRecognizer.createSpeechRecognizer(context)
          else -> null
        }
        if (recognizer == null) {
          promise.resolve(mapOf("status" to "unavailable"))
          return@AsyncFunction
        }
        val utterance = Utterance(recognizer, promise)
        active = utterance
        recognizer.setRecognitionListener(utterance)
        recognizer.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
          putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
          putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
          putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
        })
        main.postDelayed(utterance.timeout, 20000)
      } catch (error: RuntimeException) {
        val utterance = active
        if (utterance != null) utterance.finish("unavailable")
        else promise.resolve(mapOf("status" to "unavailable"))
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("cancel") { active?.finish("cancelled"); Unit }.runOnQueue(Queues.MAIN)
    OnActivityEntersBackground { main.post { active?.finish("cancelled") } }
    OnDestroy { main.post { active?.finish("cancelled") } }
  }

  private inner class Utterance(val recognizer: SpeechRecognizer, val promise: Promise) : RecognitionListener {
    val timeout = Runnable { finish("silence") }

    fun finish(status: String, text: String? = null, confidence: Float? = null) {
      if (active !== this) return
      active = null
      main.removeCallbacks(timeout)
      try {
        recognizer.destroy()
      } finally {
        promise.resolve(mapOf("status" to status, "text" to text, "confidence" to confidence?.toDouble()))
      }
    }

    override fun onResults(results: Bundle?) {
      val text = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()
      val score = results?.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)?.firstOrNull()
      finish(if (text.isNullOrBlank()) "silence" else "result", text, score?.takeIf { it in 0f..1f })
    }

    override fun onError(error: Int) = finish(when (error) {
      SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "silence"
      SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "permission"
      else -> "unavailable"
    })

    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onPartialResults(partialResults: Bundle?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}
  }
}
