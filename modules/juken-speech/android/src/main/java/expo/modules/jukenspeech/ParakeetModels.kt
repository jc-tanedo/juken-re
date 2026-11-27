package expo.modules.jukenspeech

import com.k2fsa.sherpa.onnx.OfflineModelConfig
import com.k2fsa.sherpa.onnx.OfflineNemoEncDecCtcModelConfig
import com.k2fsa.sherpa.onnx.OfflineTransducerModelConfig
import java.io.BufferedInputStream
import java.io.EOFException
import java.io.File
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.DigestInputStream
import java.security.MessageDigest
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream

internal object ParakeetModels {
  private const val downloadBase = "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models"
  private const val vadFileName = "silero_vad.int8.onnx"
  private const val vadSha256 = "c36d490aff5ab924ca6c7aeec4d8f6bd3d22db6fa17611b9c5b17eae58ac3a20"

  enum class Architecture {
    NEMO_TRANSDUCER,
    NEMO_CTC,
  }

  data class Pack(
    val name: String,
    val archive: String,
    val sha256: String,
    val architecture: Architecture,
    val files: Set<String>,
  )

  data class InstalledModel(
    val pack: Pack,
    val dir: File,
    val vadFile: File,
  )

  private val packs = mapOf(
    "en-US" to Pack(
      name = "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8",
      archive = "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8.tar.bz2",
      sha256 = "6fc4426b54aa549a0019b8a75b8dea59164e71790a37ac56a045ad57f915f714",
      architecture = Architecture.NEMO_TRANSDUCER,
      files = setOf("encoder.int8.onnx", "decoder.int8.onnx", "joiner.int8.onnx", "tokens.txt"),
    ),
    "ja-JP" to Pack(
      name = "sherpa-onnx-nemo-parakeet-tdt_ctc-0.6b-ja-35000-int8",
      archive = "sherpa-onnx-nemo-parakeet-tdt_ctc-0.6b-ja-35000-int8.tar.bz2",
      sha256 = "4b0a800ef29f4f4c8667339bf6f60d5bfdc2852ddc9dc5741aea65b6f8d1306b",
      architecture = Architecture.NEMO_CTC,
      files = setOf("model.int8.onnx", "tokens.txt"),
    ),
  )

  fun installed(root: File, locale: String): InstalledModel? {
    val pack = packs[locale] ?: return null
    val vadFile = File(root, vadFileName)
    if (!vadFile.isFile) return null
    val dir = File(root, pack.name)
    if (!dir.isDirectory) return null
    if (!pack.files.all { File(dir, it).isFile }) return null
    return InstalledModel(pack, dir, vadFile)
  }

  @Synchronized
  fun install(root: File, locale: String) {
    val pack = requireNotNull(packs[locale])
    if (installed(root, locale) != null) return
    root.mkdirs()

    ensureVad(root)

    val finalDir = File(root, pack.name)
    if (finalDir.isDirectory && pack.files.all { File(finalDir, it).isFile }) return

    val stage = File(root, "${pack.name}.install")
    stage.deleteRecursively()
    check(stage.mkdirs()) { "Unable to create staging directory for ${pack.name}" }
    try {
      val archive = File(stage, "model.tar.bz2")
      downloadAndVerify("$downloadBase/${pack.archive}", archive, pack.sha256)
      extractAllowlistedTarBz2(archive, stage, pack.name, pack.files)
      archive.delete()

      val stagedModelDir = File(stage, pack.name)
      check(pack.files.all { File(stagedModelDir, it).isFile }) { "Extracted archive missing required files for ${pack.name}" }
      finalDir.deleteRecursively()
      check(stagedModelDir.renameTo(finalDir)) { "Unable to install ${pack.name}" }
    } finally {
      stage.deleteRecursively()
    }
  }

  fun modelConfig(installed: InstalledModel, numThreads: Int): OfflineModelConfig {
    val dirPath = installed.dir.path
    return when (installed.pack.architecture) {
      Architecture.NEMO_TRANSDUCER -> OfflineModelConfig(
        transducer = OfflineTransducerModelConfig(
          encoder = "$dirPath/encoder.int8.onnx",
          decoder = "$dirPath/decoder.int8.onnx",
          joiner = "$dirPath/joiner.int8.onnx",
        ),
        tokens = "$dirPath/tokens.txt",
        modelType = "nemo_transducer",
        numThreads = numThreads,
        provider = "cpu",
      )
      Architecture.NEMO_CTC -> OfflineModelConfig(
        nemo = OfflineNemoEncDecCtcModelConfig(
          model = "$dirPath/model.int8.onnx",
        ),
        tokens = "$dirPath/tokens.txt",
        numThreads = numThreads,
        provider = "cpu",
      )
    }
  }

  private fun ensureVad(root: File) {
    val vadFile = File(root, vadFileName)
    if (vadFile.isFile) return
    val stageVad = File(root, "$vadFileName.install")
    stageVad.delete()
    try {
      downloadAndVerify("$downloadBase/$vadFileName", stageVad, vadSha256)
      check(stageVad.renameTo(vadFile)) { "Unable to install $vadFileName" }
    } finally {
      stageVad.delete()
    }
  }

  private fun downloadAndVerify(urlString: String, target: File, expectedSha256: String) {
    val digest = MessageDigest.getInstance("SHA-256")
    val connection = (URL(urlString).openConnection() as HttpURLConnection).apply {
      connectTimeout = 15000
      readTimeout = 60000
      instanceFollowRedirects = true
    }
    try {
      val code = connection.responseCode
      check(code in 200..299) { "HTTP $code downloading $urlString" }
      DigestInputStream(connection.inputStream.buffered(), digest).use { input ->
        target.outputStream().buffered().use { output -> input.copyTo(output) }
      }
      val actualSha256 = digest.digest().joinToString("") { "%02x".format(it) }
      check(actualSha256 == expectedSha256) { "Incomplete or unexpected model download" }
    } finally {
      connection.disconnect()
    }
  }

  private fun extractAllowlistedTarBz2(archive: File, stage: File, modelDirName: String, allowlist: Set<String>) {
    val allowedPaths = allowlist.associateBy { "$modelDirName/$it" }
    val stagePrefix = stage.canonicalPath + File.separator
    val buffer = ByteArray(64 * 1024)
    val header = ByteArray(512)

    BZip2CompressorInputStream(BufferedInputStream(archive.inputStream()), true).use { tar ->
      var nextLongName: String? = null
      var nextPaxPath: String? = null
      var nextPaxSize: Long? = null

      while (true) {
        val read = readFullOrEof(tar, header)
        if (read == 0 || header.all { it == 0.toByte() }) break
        check(read == 512) { "Truncated tar header" }

        val typeFlag = header[156].toInt().toChar()
        val rawSize = parseTarSize(header, 124, 12)
        val entrySize = if (typeFlag != 'L' && typeFlag != 'x' && typeFlag != 'g') nextPaxSize ?: rawSize else rawSize

        val headerName = parseCString(header, 0, 100)
        val headerPrefix = parseCString(header, 345, 155)
        val ustarPath = if (headerPrefix.isNotEmpty()) "$headerPrefix/$headerName" else headerName

        if (typeFlag == 'L') {
          val bytes = readExactBytes(tar, rawSize)
          skipPadding(tar, rawSize)
          nextLongName = bytes.toString(Charsets.UTF_8).trimEnd('\u0000')
          continue
        }
        if (typeFlag == 'x') {
          val bytes = readExactBytes(tar, rawSize)
          skipPadding(tar, rawSize)
          val pax = parsePaxHeaders(bytes)
          nextPaxPath = pax["path"] ?: nextPaxPath
          nextPaxSize = pax["size"]?.toLongOrNull() ?: nextPaxSize
          continue
        }
        if (typeFlag == 'g') {
          skipFully(tar, rawSize)
          skipPadding(tar, rawSize)
          continue
        }

        val rawPath = nextPaxPath ?: nextLongName ?: ustarPath
        nextLongName = null
        nextPaxPath = null
        nextPaxSize = null

        val normalizedPath = normalizeEntryPath(rawPath)
        val isRegularFile = typeFlag == '0' || typeFlag == '\u0000'
        val matchedFile = if (isRegularFile) allowedPaths[normalizedPath] else null

        if (matchedFile != null) {
          val outFile = File(File(stage, modelDirName), matchedFile).canonicalFile
          check(outFile.path.startsWith(stagePrefix)) { "Unsafe archive path: $rawPath" }
          outFile.parentFile?.mkdirs()
          outFile.outputStream().buffered().use { output ->
            var remaining = entrySize
            while (remaining > 0) {
              val chunk = tar.read(buffer, 0, minOf(buffer.size.toLong(), remaining).toInt())
              if (chunk <= 0) throw EOFException("Unexpected EOF in tar entry $rawPath")
              output.write(buffer, 0, chunk)
              remaining -= chunk
            }
          }
        } else {
          skipFully(tar, entrySize)
        }
        skipPadding(tar, entrySize)
      }
    }
  }

  private fun normalizeEntryPath(path: String): String {
    var clean = path.replace('\\', '/')
    while (clean.startsWith("./")) clean = clean.substring(2)
    return clean.trimStart('/')
  }

  private fun parseCString(bytes: ByteArray, offset: Int, length: Int): String {
    var end = offset
    val max = offset + length
    while (end < max && bytes[end] != 0.toByte()) end++
    return String(bytes, offset, end - offset, Charsets.UTF_8)
  }

  private fun parseTarSize(bytes: ByteArray, offset: Int, length: Int): Long {
    val first = bytes[offset].toInt() and 0xff
    if ((first and 0x80) != 0) {
      var value = 0L
      for (i in 1 until length) {
        value = (value shl 8) or (bytes[offset + i].toLong() and 0xffL)
      }
      return value
    }
    val text = parseCString(bytes, offset, length).trim()
    if (text.isEmpty()) return 0L
    return text.toLong(8)
  }

  private fun parsePaxHeaders(bytes: ByteArray): Map<String, String> {
    val map = mutableMapOf<String, String>()
    var idx = 0
    while (idx < bytes.size) {
      var space = idx
      while (space < bytes.size && bytes[space] != ' '.code.toByte()) space++
      if (space <= idx || space >= bytes.size) break
      val len = String(bytes, idx, space - idx, Charsets.US_ASCII).toIntOrNull() ?: break
      if (len <= 0) break
      val recordEnd = (idx + len).coerceAtMost(bytes.size)
      val body = String(bytes, space + 1, recordEnd - (space + 1), Charsets.UTF_8).trimEnd('\n')
      val eq = body.indexOf('=')
      if (eq > 0) map[body.substring(0, eq)] = body.substring(eq + 1)
      idx += len
    }
    return map
  }

  private fun readFullOrEof(input: InputStream, dest: ByteArray): Int {
    var total = 0
    while (total < dest.size) {
      val count = input.read(dest, total, dest.size - total)
      if (count < 0) return total
      total += count
    }
    return total
  }

  private fun readExactBytes(input: InputStream, size: Long): ByteArray {
    check(size in 0..(1024 * 1024)) { "Unsupported metadata size: $size" }
    val out = ByteArray(size.toInt())
    val read = readFullOrEof(input, out)
    if (read < out.size) throw EOFException("Unexpected EOF reading metadata")
    return out
  }

  private fun skipPadding(input: InputStream, size: Long) {
    val rem = size % 512L
    if (rem != 0L) skipFully(input, 512L - rem)
  }

  private fun skipFully(input: InputStream, count: Long) {
    var remaining = count
    val scratch = ByteArray(8192)
    while (remaining > 0) {
      val read = input.read(scratch, 0, minOf(scratch.size.toLong(), remaining).toInt())
      if (read < 0) throw EOFException("Unexpected EOF skipping tar entry")
      remaining -= read
    }
  }
}
