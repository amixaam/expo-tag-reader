import { AudioFile, AudioTags, DisableAudioTags } from "./ExpoTagReader.types";
import ExpoTagReaderModule from "./ExpoTagReaderModule";

/**
 * Reads the tags from the audio file at the given URI.
 *
 * @param {string} fileUri The URI of the audio file to read tags from.
 * @param {DisableAudioTags} disableTags Add any of the `AudioFile` properties to ignore.
 * @param {boolean} cacheImages Whether to cache album art images. Defaults to `true`. if caching is enabled, artwork property of `AudioTags` will be an URI, otherwise it will be Base64
 * @returns {AudioTags} Resolves with an object of type `AudioTags`.
 */
export function readTags(
    fileUri: string,
    disableTags?: DisableAudioTags,
    cacheImages: boolean = true
): AudioTags {
    return ExpoTagReaderModule.readTags(fileUri, disableTags, cacheImages);
}

/**
 * Reads all audio files from the default and given directory paths.
 * Default directories, that are always checked are the `music` directory and the `downloads` directory.
 *
 * Remember to ask for read permissions before calling this function.
 *
 * @param {string[]} dirPath Paths to other directories that contain audio files.
 * @param pageSize The number of audio files to return per page. Defaults to `10`.
 * @param pageNumber The page number to return. Defaults to `1`.
 * @param {DisableAudioTags} disableTags Add any of the `AudioFile` properties to ignore.
 * @param {boolean} cacheImages Whether to cache album art images. Defaults to `true`. if caching is enabled, artwork property of `AudioTags` will be an URI, otherwise it will be Base64
 * @returns {Promise<AudioFile[]>} Resolves with an array of objects of type `AudioFile`.
 */
export async function readAudioFiles(
    dirPath?: string[],
    pageSize: number = 10,
    pageNumber: number = 1,
    disableTags?: DisableAudioTags,
    cacheImages: boolean = true
): Promise<AudioFile[]> {
    return await ExpoTagReaderModule.readAudioFiles(
        dirPath,
        disableTags,
        pageSize,
        pageNumber,
        cacheImages
    );
}
