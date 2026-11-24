package expo.modules.jukenspeech

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import java.util.Locale
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
    Events("speechActivity")

    AsyncFunction("listen") { locale: String, local: Boolean, requestId: Int, hints: List<String>, promise: Promise ->
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
        val utterance = Utterance(recognizer, promise, requestId)
        active = utterance
        recognizer.setRecognitionListener(utterance)
        recognizer.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
          val deviceLocale = Locale.getDefault()
          val language = if (locale == "en-US" && deviceLocale.language == "en") deviceLocale.toLanguageTag() else locale
          putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
          putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
          if (local && Build.VERSION.SDK_INT >= 33 && hints.isNotEmpty()) {
            putStringArrayListExtra(RecognizerIntent.EXTRA_BIASING_STRINGS, ArrayList(hints))
          }
          putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
          putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
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

  private inner class Utterance(val recognizer: SpeechRecognizer, val promise: Promise, val requestId: Int) : RecognitionListener {
    val timeout = Runnable { finish("silence") }

    fun finish(status: String, text: String? = null, confidence: Float? = null, alternatives: List<Map<String, Any?>> = emptyList()) {
      if (active !== this) return
      active = null
      main.removeCallbacks(timeout)
      try {
        recognizer.destroy()
      } finally {
        promise.resolve(mapOf("status" to status, "text" to text, "confidence" to confidence?.toDouble(), "alternatives" to alternatives))
      }
    }

    override fun onResults(results: Bundle?) {
      val texts = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION).orEmpty()
      val scores = results?.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)
      fun score(index: Int) = scores?.getOrNull(index)?.takeIf { it in 0f..1f }
      val alternatives = texts.take(5).mapIndexedNotNull { index, text ->
        if (index == 0 || text.isBlank()) null
        else mapOf("text" to text, "confidence" to score(index)?.toDouble())
      }
      val best = texts.firstOrNull()
      finish(if (best.isNullOrBlank()) "silence" else "result", best, score(0), alternatives)
    }

    override fun onError(error: Int) = finish(when (error) {
      SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "silence"
      SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "permission"
      else -> "unavailable"
    })

    private fun activity(stage: String, text: String? = null) {
      if (active === this) {
        sendEvent("speechActivity", mapOf("requestId" to requestId, "stage" to stage, "text" to text))
      }
    }

    override fun onReadyForSpeech(params: Bundle?) = activity("ready")
    override fun onBeginningOfSpeech() = activity("speaking")
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() = activity("processing")
    override fun onPartialResults(partialResults: Bundle?) {
      val text = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()
      if (!text.isNullOrBlank()) activity("partial", text)
    }
    override fun onEvent(eventType: Int, params: Bundle?) {}
  }
}
