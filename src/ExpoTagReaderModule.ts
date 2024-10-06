import { requireNativeModule } from "expo-modules-core";

export type AudioTags = {
    title: string;
    artist: string;
    album: string;
    year: string;
    genre: string;
    track: string;
    comment: string;
    albumArt: string; // Base64 encoded
};

export type AudioFile = {
    extension: string;
    uri: string;
    fileName: string;
    tags: AudioTags;
    duration: string; // in ms
    creationDate: string; // in "dd-MM-yyyy"
};

interface ExpoTagReaderInterface {
    readTags(fileUri: string): Promise<AudioTags>;
    readAudioFiles(directoryPaths?: string[]): Promise<AudioFile[]>;
}

export default requireNativeModule("ExpoTagReader") as ExpoTagReaderInterface;
