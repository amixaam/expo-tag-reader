export type AudioTags = {
    title: string;
    artist: string;
    album: string;
    year: string;
    genre: string;
    track: string;
    comment: string;
    albumArt: string; // URI or Base64 (default: URI)
    sampleRate: string;
    bitrate: string;
    channels: string;
    duration: string; // in ms
};

export type DisableAudioTags = {
    title: boolean;
    artist: boolean;
    album: boolean;
    year: boolean;
    genre: boolean;
    track: boolean;
    comment: boolean;
    albumArt: boolean; // URI or Base64 (default: URI)
    sampleRate: boolean;
    bitrate: boolean;
    channels: boolean;
    duration: boolean; // in ms
};

export type AudioFile = {
    extension: string;
    uri: string;
    fileName: string;
    tags: AudioTags;
    creationDate: string; // in "dd-MM-yyyy"
    internalId: string;
};
