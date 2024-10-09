package expo.modules.tagreader

import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.util.Base64
import android.util.Log
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.withContext
import org.jaudiotagger.audio.AudioFileIO
import org.jaudiotagger.tag.FieldKey
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ExpoTagReaderModule : Module() {
    private lateinit var cacheDir: File
    private val cachedAlbumArts = mutableMapOf<String, String>()
    private var customDirectories: List<String> = listOf()

    override fun definition() = ModuleDefinition {
        Name("ExpoTagReader")

        OnCreate {
            cacheDir= File(appContext.cacheDirectory, "album_art").apply { mkdirs() }
        }

        Function("readTags") { uri: String, disableTags: Map<String, Boolean>?, cacheImages: Boolean ->
            try {
                readTags(uri, disableTags, cacheImages)
            } catch (e: Exception) {
                throw Exception("Error reading tags: ${e.message}")
            }
        }

        AsyncFunction("readAudioFiles") Coroutine { pageSize: Int, pageNumber: Int, cacheImages: Boolean, disableTags: Map<String, Boolean>? ->
            val startTime = System.currentTimeMillis()
            withContext(Dispatchers.Default) {
                try {
                    val audioFiles = withContext(Dispatchers.IO) {
                        val directories = getAudioDirectories()
                        val files = directories.flatMap { directory ->
                            if (!directory.exists() || !directory.isDirectory) {
                                Log.w("ExpoTagReader", "Invalid directory path: ${directory.absolutePath}")
                                emptyList()
                            } else {
                                directory.walkTopDown()
                                    .filter { it.isFile && it.extension.lowercase() in supportedAudioExtensions }
                                    .toList()
                            }
                        }
                        files
                    }

                    val startIndex = (pageNumber - 1) * pageSize
                    val endIndex = minOf(startIndex + pageSize, audioFiles.size)
                    val pageFiles = audioFiles.subList(startIndex, endIndex)

                    pageFiles.map { file ->
                        async { processAudioFile(file, disableTags, cacheImages) }
                    }.awaitAll()

                } catch (e: Exception) {
                    Log.e("ExpoTagReader", "Error reading audio files", e)
                    throw Exception("ERR_READ_AUDIO_FILES", e)
                } finally {
                    val endTime = System.currentTimeMillis()
                    val totalTime = endTime - startTime
                    Log.d("ExpoTagReader", "Total time to read audio files: $totalTime ms")
                }
            }
        }

        AsyncFunction("setCustomDirectories") Coroutine { dirPaths: List<String> ->
            customDirectories = dirPaths
        }

        AsyncFunction("readNewAudioFiles") Coroutine { songIds: List<String>, pageSize: Int, pageNumber: Int, cacheImages: Boolean, disableTags: Map<String, Boolean>? ->
            withContext(Dispatchers.Default) {
                try {
                    val startTime = System.currentTimeMillis()
                    val allAudioFiles = getAudioFiles()
                    val newFiles = allAudioFiles.filter { file ->
                        generateInternalId(file) !in songIds
                    }

                    val startIndex = (pageNumber - 1) * pageSize
                    val endIndex = minOf(startIndex + pageSize, newFiles.size)
                    val pageFiles = newFiles.subList(startIndex, endIndex)

                    val result = pageFiles.map { file ->
                        async { processAudioFile(file, disableTags, cacheImages) }
                    }.awaitAll()

                    val endTime = System.currentTimeMillis()
                    val totalTime = endTime - startTime

                    Log.i("ExpoTagReader", "readNewAudioFiles: Found ${newFiles.size} new files")
                    Log.i("ExpoTagReader", "readNewAudioFiles: Total time taken: $totalTime ms")

                    result
                } catch (e: Exception) {
                    Log.e("ExpoTagReader", "Error reading new audio files", e)
                    throw Exception("ERR_READ_NEW_AUDIO_FILES", e)
                }
            }
        }

        AsyncFunction("getRemovedAudioFiles") Coroutine { songIds: List<String> ->
            withContext(Dispatchers.Default) {
                try {
                    val startTime = System.currentTimeMillis()
                    val currentFileIds = getAudioFiles().map { generateInternalId(it) }
                    val removedIds = songIds.filter { it !in currentFileIds }

                    val endTime = System.currentTimeMillis()
                    val totalTime = endTime - startTime

                    Log.i("ExpoTagReader", "getRemovedAudioFiles: Found ${removedIds.size} removed files")
                    Log.i("ExpoTagReader", "getRemovedAudioFiles: Total time taken: $totalTime ms")

                    removedIds
                } catch (e: Exception) {
                    Log.e("ExpoTagReader", "Error getting removed audio files", e)
                    throw Exception("ERR_GET_REMOVED_AUDIO_FILES", e)
                }
            }
        }
    }

    private val supportedAudioExtensions = listOf("mp3", "wav", "ogg", "flac", "m4a", "opus", "aif", "dsf", "wma")

    private fun getAudioDirectories(): List<File> {
        val directories = mutableListOf<File>()
        directories.add(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC))
        directories.add(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS))
        customDirectories.forEach { path -> directories.add(File(path)) }
        return directories
    }

    private fun getAudioFiles(): List<File> {
        return run {
            val files = getAudioDirectories().flatMap { directory ->
                if (!directory.exists() || !directory.isDirectory) {
                    emptyList()
                } else {
                    directory.walkTopDown()
                        .filter { it.isFile && it.extension.lowercase() in supportedAudioExtensions }
                        .toList()
                }
            }
            files
        }
    }

    private fun processAudioFile(file: File, disableTags: Map<String, Boolean>?, cacheImages: Boolean): Map<String, Any?> {
        return try {
            Log.d("ExpoTagReader", "Processing audio file: ${file.absolutePath}")
            val uri = Uri.fromFile(file).toString()
            val tags = readTags(uri, disableTags, cacheImages)
            mapOf(
                "extension" to file.extension.lowercase(),
                "uri" to uri,
                "fileName" to file.name,
                "creationDate" to getCreationDate(file),
                "tags" to tags,
                "internalId" to generateInternalId(file)
            )
        } catch (e: Exception) {
            Log.e("ExpoTagReader", "Error processing file ${file.absolutePath}", e)
            mapOf("error" to e.message)
        }
    }

    private fun readTags(uri: String, disableTags: Map<String, Boolean>?, cacheImages: Boolean): Map<String, String> {
        val parsedUri = Uri.parse(uri)
        val file = File(parsedUri.path!!)

        val tags = readJAudioTaggerTags(file, disableTags, cacheImages)

        // Use MediaMetadataRetriever for bitrate and duration
        val retriever = MediaMetadataRetriever()
        try {
            retriever.setDataSource(appContext.reactContext, parsedUri)

            if (disableTags?.get("bitrate") != true) {
                tags["bitrate"] = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_BITRATE) ?: ""
            }

            if (disableTags?.get("sampleRate") != true) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    tags["sampleRate"] = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_SAMPLERATE) ?: ""
                }
                // If sampleRate is not set (i.e., API < 30), it will remain as set by JAudiotagger
            }

            tags["duration"] = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION) ?: ""
        } catch (e: Exception) {
            Log.e("readTags", "Error reading tags with MediaMetadataRetriever: ${e.message}")
        } finally {
            retriever.release()
        }

        tags["creationDate"] = getCreationDate(file)

        return tags
    }

    private fun readJAudioTaggerTags(file: File, disableTags: Map<String, Boolean>?, cacheImages: Boolean): MutableMap<String, String> {
        val tags = mutableMapOf<String, String>()
        val startTime = System.currentTimeMillis()

        try {
            val audioFile = AudioFileIO.getDefaultAudioFileIO().readFile(file)
            val tag = audioFile.tag
            val header = audioFile.audioHeader

            val tagFields = mapOf(
                "title" to FieldKey.TITLE,
                "artist" to FieldKey.ARTIST,
                "album" to FieldKey.ALBUM,
                "year" to FieldKey.YEAR,
                "genre" to FieldKey.GENRE,
                "track" to FieldKey.TRACK,
                "comment" to FieldKey.COMMENT,
            )

            for((tagName, fieldKey) in tagFields) {
                tags[tagName] = if (disableTags?.get(tagName) != true) {
                    tag.getFirst(fieldKey) ?: ""
                } else {
                    ""
                }
            }

            if (disableTags?.get("albumArt") != true) {
                tags["albumArt"] = tag.firstArtwork?.let { artwork ->
                    if (cacheImages) {
                        cacheAlbumArt(artwork.binaryData, tags["album"] ?: "", tags["artist"] ?: "")
                    } else {
                        Base64.encodeToString(artwork.binaryData, Base64.DEFAULT)
                    }
                } ?: ""
            }

            // Use JAudiotagger for sample rate only if API level < 30
            if (disableTags?.get("sampleRate") != true && Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
                tags["sampleRate"] = header.sampleRate.toString() ?: ""
            }

            if (disableTags?.get("channels") != true) {
                tags["channels"] = header.channels.toUInt().toString() ?: ""
            }

        } catch (e: Exception) {
            Log.e("readJAudioTaggerTags", "Error reading tags: ${e.message}")
        } finally {
            val endTime = System.currentTimeMillis()
            val duration = endTime - startTime
            Log.d("readJAudioTaggerTags", "Time taken: $duration ms")
        }

        return tags
    }


    private fun cacheAlbumArt(albumArtBytes: ByteArray, album: String, artist: String): String {
        val albumArtHash = MessageDigest.getInstance("MD5").digest(albumArtBytes).joinToString("") { "%02x".format(it) }
        val cacheKey = "$artist-$album-$albumArtHash"

        return cachedAlbumArts.getOrPut(cacheKey) {
            val file = File(cacheDir, "$cacheKey.jpg")
            if (!file.exists()) {
                FileOutputStream(file).use { fos ->
                    fos.write(albumArtBytes)
                }
            }
            Uri.fromFile(file).toString()
        }
    }

    private fun getCreationDate(file: File): String {
        val date = Date(file.lastModified())
        val formatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        return formatter.format(date)
    }

    private fun generateInternalId(file: File): String {
        val input = file.absolutePath + file.lastModified().toString()
        val md = MessageDigest.getInstance("SHA-256")
        val hashBytes = md.digest(input.toByteArray())
        return hashBytes.joinToString("") { "%02x".format(it) }
    }
}