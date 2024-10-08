// null values will be an empty string
export type AudioTags = {
    title: string;
    artist: string;
    album: string;
    year: string;
    genre: string;
    track: string;
    comment: string;
    albumArt: string; // URI or Base64 (default: URI)
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
