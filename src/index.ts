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
 * Reads all audio files from the `Music` and `Downloads` directory.
 *
 * Remember to ask for read permissions before calling this function.
 *
 * @param pageSize The number of audio files to return per page. Defaults to `10`.
 * @param pageNumber The page number to return. Defaults to `1`.
 * @param {DisableAudioTags} disableTags Add any of the `AudioFile` properties to ignore.
 * @param {boolean} cacheImages Whether to cache album art images. Defaults to `true`. if caching is enabled, artwork property of `AudioTags` will be an URI, otherwise it will be Base64
 * @returns {Promise<AudioFile[]>} Resolves with an array of objects of type `AudioFile`.
 */
export async function readAudioFiles(
    pageSize: number = 10,
    pageNumber: number = 1,
    cacheImages: boolean = true,
    disableTags?: DisableAudioTags
): Promise<AudioFile[]> {
    return await ExpoTagReaderModule.readAudioFiles(
        pageSize,
        pageNumber,
        cacheImages,
        disableTags
    );
}

/**
 * Sets the custom directories to read audio files from.
 *
 * @param {string[]} dirPaths The paths of the directories to read from.
 */
export async function setCustomDirectories(dirPaths: string[]): Promise<void> {
    return await ExpoTagReaderModule.setCustomDirectories(dirPaths);
}

/**
 * Finds and returns new audio files in the `Music` and `Downloads` directory by comparing ID's.
 *
 * @param songIds The IDs of the songs to read new files from. ID's are from type `AudioFile` `internalId` property.
 * @param pageSize The number of audio files to return per page. Defaults to `10`.
 * @param pageNumber The page number to return. Defaults to `1`.
 * @param {boolean} cacheImages Whether to cache album art images. Defaults to `true`. if caching is enabled, artwork property of `AudioTags` will be an URI, otherwise it will be Base64
 * @param {DisableAudioTags} disableTags Add any of the `AudioFile` properties to ignore.
 * @returns {Promise<AudioFile[]>} Resolves with an array of objects of type `AudioFile`.
 */
export async function readNewAudioFiles(
    songIds: string[],
    pageSize: number = 10,
    pageNumber: number = 1,
    cacheImages: boolean = true,
    disableTags?: DisableAudioTags
): Promise<AudioFile[]> {
    return await ExpoTagReaderModule.readNewAudioFiles(
        songIds,
        pageSize,
        pageNumber,
        cacheImages,
        disableTags
    );
}

/**
 * Finds and returns the removed audio files by comparing ID's.
 *
 * @param songIds The IDs of the songs to find removed files from. ID's are from type `AudioFile` `internalId` property.
 * @returns {Promise<string[]>} Resolves with an array of strings of removed file IDs.
 */
export async function getRemovedAudioFiles(
    songIds: string[]
): Promise<string[]> {
    return await ExpoTagReaderModule.getRemovedAudioFiles(songIds);
}
