package expo.modules.jukenfold

import android.app.Activity
import android.os.Handler
import android.os.Looper
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

private val EMPTY_FOLD_STATE: Map<String, Any?> = mapOf(
  "hasFold" to false,
  "state" to "none",
  "orientation" to "none",
  "isSeparating" to false,
  "occlusionType" to "none",
  "hingeBounds" to null,
)

class JukenFoldModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private var trackingScope: CoroutineScope? = null
  private var trackingActivity: Activity? = null
  private var observing = false

  @Volatile
  private var latestState: Map<String, Any?> = EMPTY_FOLD_STATE

  override fun definition() = ModuleDefinition {
    Name("JukenFold")
    Events("foldChange")

    Function("getFoldState") {
      latestState
    }

    OnStartObserving {
      observing = true
      main.post { startTracking() }
    }

    OnActivityEntersForeground {
      main.post {
        if (observing) startTracking()
      }
    }

    OnActivityEntersBackground {
      main.post { stopTracking() }
    }

    OnStopObserving {
      observing = false
      main.post { stopTracking() }
    }

    OnDestroy {
      observing = false
      main.post { stopTracking() }
    }
  }

  private fun startTracking() {
    val activity = appContext.currentActivity ?: return
    if (trackingActivity === activity && trackingScope != null) return

    stopTracking()
    trackingActivity = activity
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    trackingScope = scope

    scope.launch {
      try {
        WindowInfoTracker.getOrCreate(activity)
          .windowLayoutInfo(activity)
          .collect { info ->
            updateState(mapWindowLayoutInfo(activity, info))
          }
      } catch (_: Throwable) {
        updateState(EMPTY_FOLD_STATE)
      }
    }
  }

  private fun stopTracking() {
    trackingScope?.cancel()
    trackingScope = null
    trackingActivity = null
  }

  private fun updateState(next: Map<String, Any?>) {
    if (next == latestState) return
    latestState = next
    if (observing) {
      try {
        sendEvent("foldChange", next)
      } catch (_: Throwable) {
        // Ignore if JS catalyst instance has already been torn down.
      }
    }
  }

  private fun mapWindowLayoutInfo(activity: Activity, info: WindowLayoutInfo): Map<String, Any?> {
    val feature = info.displayFeatures
      .filterIsInstance<FoldingFeature>()
      .firstOrNull() ?: return EMPTY_FOLD_STATE

    val density = activity.resources.displayMetrics.density.coerceAtLeast(1f)
    val bounds = feature.bounds
    val hingeBounds = mapOf(
      "left" to (bounds.left / density).toDouble(),
      "top" to (bounds.top / density).toDouble(),
      "right" to (bounds.right / density).toDouble(),
      "bottom" to (bounds.bottom / density).toDouble(),
      "width" to (bounds.width() / density).toDouble(),
      "height" to (bounds.height() / density).toDouble(),
    )

    val state = when (feature.state) {
      FoldingFeature.State.HALF_OPENED -> "half_opened"
      FoldingFeature.State.FLAT -> "flat"
      else -> "unknown"
    }

    val orientation = when (feature.orientation) {
      FoldingFeature.Orientation.VERTICAL -> "vertical"
      FoldingFeature.Orientation.HORIZONTAL -> "horizontal"
      else -> "none"
    }

    val occlusionType = when (feature.occlusionType) {
      FoldingFeature.OcclusionType.FULL -> "full"
      else -> "none"
    }

    return mapOf(
      "hasFold" to true,
      "state" to state,
      "orientation" to orientation,
      "isSeparating" to feature.isSeparating,
      "occlusionType" to occlusionType,
      "hingeBounds" to hingeBounds,
    )
  }
}
