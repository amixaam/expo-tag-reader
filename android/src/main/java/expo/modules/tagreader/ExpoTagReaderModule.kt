package expo.modules.tagreader

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Environment
import android.util.Base64
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.jaudiotagger.audio.AudioFileIO
import org.jaudiotagger.tag.FieldKey
import java.io.ByteArrayOutputStream
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Coroutine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.withContext
import java.util.concurrent.Executors
import java.util.stream.Collectors
import kotlinx.coroutines.*
import java.security.MessageDigest

class ExpoTagReaderModule : Module() {
    private val dispatcher = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors()).asCoroutineDispatcher()

    override fun definition() = ModuleDefinition {
        Name("ExpoTagReader")

        Function("readTags") { uri: String, disableTags: Map<String, Boolean>? ->
            Log.d("ExpoTagReader", "Im here!")

            try {
                readTags(uri, disableTags)
            } catch (e: Exception) {
                throw Exception("Error reading tags: ${e.message}")
            }
        }

        AsyncFunction("readAudioFiles") { dirPaths: List<String>?, disableTags: Map<String, Boolean>?, pageSize: Int, pageNumber: Int, promise: Promise ->
            try {
                val directories = getAudioDirectories(dirPaths)

                val audioFiles = directories.flatMap { directory ->
                    if (!directory.exists() || !directory.isDirectory) {
                        Log.w("ExpoTagReader", "Invalid directory path: ${directory.absolutePath}")
                        emptyList()
                    } else {
                        directory.walkTopDown()
                            .filter { it.isFile&& it.extension.lowercase() in supportedAudioExtensions }
                            .toList()
                    }
                }.parallelStream()
                    .skip(pageSize * (pageNumber - 1).toLong())
                    .map { file: File -> processAudioFile(file, disableTags) }
                    .collect(Collectors.toList())

                Log.d("ExpoTagReader", "Total audio files processed: ${audioFiles.size}")

                promise.resolve(audioFiles)

            } catch (e: Exception) {
                Log.e("ExpoTagReader", "Error reading audio files", e)
                promise.reject("ERR_READ_AUDIO_FILES", e.message, e)
            }
        }
    }

    private val supportedAudioExtensions = listOf("mp3", "wav", "ogg", "flac", "m4a", "opus")

    private fun getAudioDirectories(dirPaths: List<String>?): List<File> {
        val directories = mutableListOf<File>()
        directories.add(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC))
        directories.add(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS))
        dirPaths?.forEach { path -> directories.add(File(path)) }
        return directories
    }

    private fun processAudioFile(file: File, disableTags: Map<String, Boolean>?): Map<String, Any?>? {
        return try {
            Log.d("ExpoTagReader", "Processing audio file: ${file.absolutePath}")
            val uri = Uri.fromFile(file).toString()
            val tags = readTags(uri, disableTags)
            mapOf(
                "extension" to file.extension.lowercase(),
                "uri" to uri,
                "fileName" to file.name,
                "duration" to getDuration(uri),
                "creationDate" to getCreationDate(file),
                "tags" to tags,
                "internalId" to generateInternalId(file)
            )
        } catch (e: Exception) {
            Log.e("ExpoTagReader", "Error processing file ${file.absolutePath}", e)
            null
        }
    }

    private fun generateInternalId(file: File): String {
        val input = file.absolutePath + file.lastModified().toString()
        val md = MessageDigest.getInstance("SHA-256")
        val hashBytes = md.digest(input.toByteArray())
        return hashBytes.joinToString("") { "%02x".format(it) }
    }

    private fun readTags(uri: String, disableTags: Map<String, Boolean>?): Map<String, String> {
        val parsedUri = Uri.parse(uri)
        val file = File(parsedUri.path!!)
        val extension = file.extension.lowercase()


        val tags = if (extension != "opus") {
            readJAudioTaggerTags(file, disableTags)
        } else {
            readMediaMetadata(parsedUri, disableTags)
        }

        // Add duration and creation date
        tags["duration"] = getDuration(uri)
        tags["creationDate"] = getCreationDate(file)

        return tags
    }

    private fun readJAudioTaggerTags(file: File, disableTags: Map<String, Boolean>?): MutableMap<String, String> {
        val tags = mutableMapOf<String, String>()

        try {val audioFile = AudioFileIO.read(file)
            val tag = audioFile.tag

            val tagFields = mapOf(
                "title" to FieldKey.TITLE,
                "artist" to FieldKey.ARTIST,
                "album" to FieldKey.ALBUM,
                "year" to FieldKey.YEAR,
                "genre" to FieldKey.GENRE,
                "track" to FieldKey.TRACK,
                "comment" to FieldKey.COMMENT
            )

            for ((tagName, fieldKey) in tagFields) {tags[tagName] = if (disableTags?.get(tagName) != true) {
                tag.getFirst(fieldKey) ?: ""
            } else {
                ""
            }
            }

            if (disableTags?.get("albumArt") != true) {
                tags["albumArt"] = tag.firstArtwork?.let { artwork ->
                    Base64.encodeToString(artwork.binaryData, Base64.DEFAULT)
                } ?: ""
            }
        } catch (e: Exception) {
            // Handle exceptions appropriately, e.g., log or re-throw
            Log.e("readJAudioTaggerTags", "Error reading tags: ${e.message}")
        }

        return tags
    }

    private fun readMediaMetadata(uri: Uri, disableTags: Map<String, Boolean>?): MutableMap<String, String> {
        val metadata = mutableMapOf<String, String>()

        try {
            MediaMetadataRetriever().use { retriever ->
                retriever.setDataSource(appContext.reactContext, uri)

                val tagsToExtract = listOf(
                    "title" to MediaMetadataRetriever.METADATA_KEY_TITLE,
                    "artist" to MediaMetadataRetriever.METADATA_KEY_ARTIST,
                    "album" to MediaMetadataRetriever.METADATA_KEY_ALBUM,
                    "year" to MediaMetadataRetriever.METADATA_KEY_YEAR,
                    "genre" to MediaMetadataRetriever.METADATA_KEY_GENRE,
                    "track" to MediaMetadataRetriever.METADATA_KEY_CD_TRACK_NUMBER,
                    "comment" to null // Special case for comment, as it's not extracted
                )

                for ((tagName, metadataKey) in tagsToExtract) {
                    if (disableTags?.get(tagName) != true) {
                        metadata[tagName] = if (metadataKey != null) {
                            retriever.extractMetadata(metadataKey) ?: ""
                        } else {
                            "" // For comment, which is set to empty string
                        }
                    }
                }

                if (disableTags?.get("albumArt") != true) {
                    retriever.embeddedPicture?.let { albumArtBytes ->
                        BitmapFactory.decodeByteArray(albumArtBytes, 0, albumArtBytes.size).also { bitmap ->
                            ByteArrayOutputStream().use { outputStream ->
                                bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
                                metadata["albumArt"] = Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT)
                            }
                        }
                    } ?: run { metadata["albumArt"] = "" }
                }
            }
        } catch (e: Exception) {
            throw Exception("Error reading tags: ${e.message}")
        }

        return metadata
    }

    private fun getDuration(uri: String): String {
        val retriever = MediaMetadataRetriever()
        try {
            retriever.setDataSource(appContext.reactContext, Uri.parse(uri))
            val durationMs = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLong() ?: 0
            return durationMs.toString()
        } catch (e: Exception) {
            return "0"
        } finally {
            retriever.release()
        }
    }

    private fun getCreationDate(file: File): String {
        val date = Date(file.lastModified())
        val formatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        return formatter.format(date)
    }
}