package expo.modules.tagreader

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import android.net.Uri
import java.io.File

import org.jaudiotagger.audio.AudioFileIO
import org.jaudiotagger.tag.FieldKey
import org.jaudiotagger.tag.Tag
import org.jaudiotagger.tag.images.Artwork

import android.media.MediaMetadataRetriever
import android.os.Environment
import android.util.Log
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.*

class ExpoTagReaderModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoTagReader")

        Function("readTags") { uri: String ->
            try {
                readTags(uri)
            } catch (e: Exception) {
                throw Exception("Error reading tags: ${e.message}")
            }
        }

        Function("readAudioFiles") { dirPaths: List<String>? ->
            try {
                val directories = mutableListOf<File>()

                // Add user-specified directories
                dirPaths?.forEach { path ->
                    directories.add(File(path))
                }

                // Always include these default directories
                directories.add(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC))
                directories.add(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS))

                Log.d("ExpoTagReader", "Searching directories: ${directories.map { it.absolutePath }}")

                val audioFiles = directories.flatMap { directory ->
                    if (!directory.exists() || !directory.isDirectory) {
                        Log.w("ExpoTagReader", "Invalid directory path: ${directory.absolutePath}")
                        emptyList()
                    } else {
                        directory.walkTopDown()
                            .filter { it.isFile && it.extension.lowercase() in listOf("mp3", "wav", "ogg", "flac", "m4a", "opus") }
                            .map { file ->
                                Log.d("ExpoTagReader", "Found audio file: ${file.absolutePath}")
                                val uri = Uri.fromFile(file).toString()
                                val tags = readTags(uri)
                                mapOf(
                                    "extension" to file.extension.lowercase(),
                                    "uri" to uri,
                                    "fileName" to file.name,
                                    "duration" to getDuration(uri),
                                    "creationDate" to getCreationDate(file),
                                    "tags" to tags,
                                )
                            }
                            .toList()
                    }
                }

                Log.d("ExpoTagReader", "Total audio files found: ${audioFiles.size}")
                audioFiles
            } catch (e: Exception) {
                Log.e("ExpoTagReader", "Error reading audio files", e)
                throw Exception("Error reading audio files: ${e.message}")
            }
        }
    }

    private fun readTags(uri: String): Map<String, String> {
        val parsedUri = Uri.parse(uri)
        val file = File(parsedUri.path!!)
        val extension = file.extension.lowercase()

        val tags = if (extension != "opus") {
            readJAudioTaggerTags(file)
        } else {
            readMediaMetadata(parsedUri)
        }

        // Add duration and creation date
        tags["duration"] = getDuration(uri)
        tags["creationDate"] = getCreationDate(file)

        return tags
    }

    private fun readJAudioTaggerTags(file: File): MutableMap<String, String> {
        val audioFile = AudioFileIO.read(file)
        val tag: Tag = audioFile.tag

        val artworkBase64 = tag.firstArtwork?.let { artwork ->
            val imageData = artwork.binaryData
            Base64.encodeToString(imageData, Base64.DEFAULT)
        } ?: ""

        return mutableMapOf(
            "title" to tag.getFirst(FieldKey.TITLE),
            "artist" to tag.getFirst(FieldKey.ARTIST),
            "album" to tag.getFirst(FieldKey.ALBUM),
            "year" to tag.getFirst(FieldKey.YEAR),
            "genre" to tag.getFirst(FieldKey.GENRE),
            "track" to tag.getFirst(FieldKey.TRACK),
            "comment" to tag.getFirst(FieldKey.COMMENT),
            "albumArt" to artworkBase64
        )
    }

    private fun readMediaMetadata(uri: Uri): MutableMap<String, String> {
        val retriever = MediaMetadataRetriever()
        val metadata = mutableMapOf<String, String>()

        try {
            retriever.setDataSource(appContext.reactContext, uri)

            metadata["title"] = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE) ?: ""
            metadata["artist"] = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST) ?: ""
            metadata["album"] = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM) ?: ""
            metadata["year"] = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_YEAR) ?: ""
            metadata["genre"] = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_GENRE) ?: ""
            metadata["track"] = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_CD_TRACK_NUMBER) ?: ""
            metadata["comment"] = ""

            // Extract album art
            val albumArtBytes = retriever.embeddedPicture
            if (albumArtBytes != null) {
                val bitmap = BitmapFactory.decodeByteArray(albumArtBytes, 0, albumArtBytes.size)
                val outputStream = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
                val base64AlbumArt = Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT)
                metadata["albumArt"] = base64AlbumArt
            } else {
                metadata["albumArt"] = ""
            }

            retriever.release()

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