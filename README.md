# expo-tag-reader

[![wakatime](https://wakatime.com/badge/user/b9ae0171-376e-4d7d-9ceb-ea72185e2c2e/project/3cbe9108-00d2-4504-b2db-cee7add20172.svg)](https://wakatime.com/badge/user/b9ae0171-376e-4d7d-9ceb-ea72185e2c2e/project/3cbe9108-00d2-4504-b2db-cee7add20172)

expo-tag-reader is an Android only Expo module that allows you to read audio file tags and metadata from your React Native Expo application. It provides simple functions to read tags from individual audio files or to scan directories for audio files and retrieve their metadata.

This was created for use in my project "Flora".

## Installation

```bash
bunx expo install expo-tag-reader
```

## Usage

First, import the functions you need from the package:

```javascript
import { readTags, readAudioFiles, ... or other functions } from "expo-tag-reader";
```

### Reading tags from a single audio file

```javascript
const fileUri = "file:///path/to/your/audio/file.mp3";
try {
    const tags = readTags(fileUri);
    console.log(tags);
} catch (error) {
    console.error("Error reading tags:", error);
}
```

### Scanning directories for audio files

```javascript
try {
    // REQUEST READ PERMISSIONS FIRST
    const pageSize = 5;
    let pageNumber = 1;
    let currentPage;

    do {
        currentPage = await readAudioFiles(pageSize, pageNumber);
        pageNumber++;
        console.log(currentPage); // current page files
    } while (currentPage.length === pageSize);
} catch (error) {
    console.error("Error reading audio files:", error);
}
```

## API Reference

### `readTags()`

Reads the tags from the audio file at the given URI.

-   `fileUri`: The URI of the audio file to read tags from.
-   `disableTags` (optional): Add any of the `AudioFile` properties to ignore.
-   `cacheImages` (optional): Whether to cache album art images. Defaults to `true`. If caching is enabled, the artwork property of `AudioTags` will be a URI, otherwise it will be Base64.
-   Returns: An object of type `AudioTags`.

### `readAudioFiles()`

Reads all audio files from the `Music` and `Downloads` directory.

-   `pageSize` (optional): The number of audio files to return per page. Defaults to `10`.
-   `pageNumber`: The page number to return. Defaults to `1`.
-   `cacheImages` (optional): Whether to cache album art images. Defaults to `true`.
-   `disableTags` (optional): Add any of the `AudioFile` properties to ignore.
-   Returns: A `Promise` that resolves with an array of objects of type `AudioFile`.

### `setCustomDirectories()`

Sets the custom directories to read audio files from.

-   `dirPaths`: An array of paths to directories that contain audio files.
-   Returns: A `Promise` that resolves when the operation is complete.

### `readNewAudioFiles()`

Finds and returns new audio files by comparing IDs.

-   `songIds`: The IDs of the songs to read new files from.
-   `pageSize` (optional): The number of audio files to return per page. Defaults to `10`.
-   `pageNumber`: The page number to return. Defaults to `1`.
-   `cacheImages` (optional): Whether to cache album art images. Defaults to `true`.
-   `disableTags` (optional): Add any of the `AudioFile` properties to ignore.
-   Returns: A `Promise` that resolves with an array of objects of type `AudioFile`.

### `getRemovedAudioFiles()`

Finds and returns the removed audio files by comparing IDs.

-   `songIds`: The IDs of the songs to find removed files from.
-   Returns: A `Promise` that resolves with an array of strings of removed file IDs.

## Types

### AudioTags

```typescript
type AudioTags = {
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
```

### AudioFile

```typescript
type AudioFile = {
    extension: string;
    uri: string;
    fileName: string;
    tags: AudioTags;
    creationDate: string; // in "dd-MM-yyyy"
    internalId: string; // unique identifier for the audio file
};
```

## Supported File Formats

The module supports reading tags from the following audio file formats:

-   MP3
-   WAV
-   OGG
-   FLAC
-   M4A
-   OPUS
-   AIF
-   DSF
-   WMA

## Platform Support

This module is currently implemented for Android only.

## Important Notes

-   Remember to request read permissions before calling any of the audio file reading functions.
-   Caching images is faster than using base64 images on subsequent reads.
-   The `internalId` property in the `AudioFile` type is essential for tracking new and removed files.
