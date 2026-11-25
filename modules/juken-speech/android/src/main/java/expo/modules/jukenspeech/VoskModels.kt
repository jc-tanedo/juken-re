package expo.modules.jukenspeech

import java.io.File
import java.net.URL
import java.security.DigestInputStream
import java.security.MessageDigest
import java.util.zip.ZipInputStream

internal object VoskModels {
  private data class Pack(val name: String, val sha256: String)
  private val packs = mapOf(
    "en-US" to Pack("vosk-model-small-en-us-0.15", "30f26242c4eb449f948e42cb302dd7a686cb29a3423a8367f99ff41780942498"),
    "ja-JP" to Pack("vosk-model-small-ja-0.22", "efa092d280153a77615e9e0c7d7283e93e600de3d19d3bec686c57ef19d52eac")
  )

  fun installed(root: File, locale: String): File? =
    packs[locale]?.let { File(root, it.name).takeIf(File::isDirectory) }

  @Synchronized
  fun install(root: File, locale: String) {
    val pack = requireNotNull(packs[locale])
    if (installed(root, locale) != null) return
    root.mkdirs()
    val stage = File(root, pack.name + ".install")
    stage.deleteRecursively()
    check(stage.mkdir())
    try {
      val archive = File(stage, "model.zip")
      val digest = MessageDigest.getInstance("SHA-256")
      val connection = URL("https://alphacephei.com/vosk/models/${pack.name}.zip").openConnection()
      connection.connectTimeout = 15000
      connection.readTimeout = 30000
      DigestInputStream(connection.getInputStream().buffered(), digest).use { input ->
        archive.outputStream().use { output -> input.copyTo(output) }
      }
      check(digest.digest().joinToString("") { "%02x".format(it) } == pack.sha256) { "Incomplete or unexpected model download" }
      ZipInputStream(archive.inputStream().buffered()).use { zip ->
        var entry = zip.nextEntry
        while (entry != null) {
          val target = File(stage, entry.name).canonicalFile
          check(target.path.startsWith(stage.canonicalPath + File.separator))
          if (entry.isDirectory) target.mkdirs() else {
            target.parentFile?.mkdirs()
            target.outputStream().buffered().use { zip.copyTo(it) }
          }
          entry = zip.nextEntry
        }
      }
      val model = File(stage, pack.name)
      check(File(model, "am/final.mdl").isFile && model.renameTo(File(root, pack.name)))
    } finally {
      stage.deleteRecursively()
    }
  }
}
