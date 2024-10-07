import { readAudioFiles } from ".";

export type AudioTags = {
    title: string;
    artist: string;
    album: string;
    year: string;
    genre: string;
    track: string;
    comment: string;
    albumArt: string; // Base64
};

// add the ones you don't want
export type DisableAudioTags = {
    title?: boolean;
    artist?: boolean;
    album?: boolean;
    year?: boolean;
    genre?: boolean;
    track?: boolean;
    comment?: boolean;
    albumArt?: boolean;
};

export type AudioFile = {
    extension: string;
    uri: string;
    fileName: string;
    tags: AudioTags;
    duration: string; // in ms
    creationDate: string; // in "dd-MM-yyyy"
    internalId: string;
};
