# Expo native speech module entrypoints invoked via reflection
-keep class expo.modules.jukenspeech.** { *; }

# Sherpa-ONNX JNI models, configs, and native callbacks
-keep class com.k2fsa.sherpa.onnx.** { *; }
-dontwarn com.k2fsa.sherpa.onnx.**

# Vosk + JNA native bindings
-keep class org.vosk.** { *; }
-keep class com.sun.jna.** { *; }
-keep class * implements com.sun.jna.Library { *; }
-keep class * implements com.sun.jna.Structure { *; }
-keepclassmembers class * extends com.sun.jna.Structure {
  <fields>;
}
-dontwarn com.sun.jna.**
-dontwarn java.awt.**
-dontwarn javax.naming.**

# Apache Commons Compress optional codecs and desktop/OSGi metadata not shipped on Android
-dontwarn org.apache.commons.compress.**
-dontwarn org.apache.commons.io.**
-dontwarn com.github.luben.zstd.**
-dontwarn org.tukaani.xz.**
-dontwarn org.brotli.dec.**
-dontwarn org.osgi.**
