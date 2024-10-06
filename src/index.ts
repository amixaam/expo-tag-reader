import { AudioFile, AudioTags } from "./ExpoTagReader.types";
import ExpoTagReaderModule from "./ExpoTagReaderModule";

/**
 * Reads the tags from the audio file at the given URI.
 *
 * @param {string} fileUri The URI of the audio file to read tags from.
 * @returns {Promise<AudioTags>} Resolves with an object of type `AudioTags`.
 */
export function readTags(fileUri: string): Promise<AudioTags> {
    return ExpoTagReaderModule.readTags(fileUri);
}

/**
 * Reads all audio files from the default and given directory paths.
 * Default directories, that are always checked are the `music` directory and the `downloads` directory.
 *
 * @param {string[]} dirPath Paths to other directories that contain audio files.
 * @returns {Promise<AudioFile[]>} Resolves with an array of objects of type `AudioFile`.
 */
export function readAudioFiles(dirPath?: string[]): Promise<AudioFile[]> {
    return ExpoTagReaderModule.readAudioFiles(dirPath);
}
