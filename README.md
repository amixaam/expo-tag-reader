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
import { readTags, readAudioFiles } from 'expo-tag-reader';
```

### Reading tags from a single audio file

```javascript
const fileUri = 'file:///path/to/your/audio/file.mp3';
try {
  const tags = await readTags(fileUri);
  console.log(tags);
} catch (error) {
  console.error('Error reading tags:', error);
}
```

### Scanning directories for audio files

```javascript
const additionalDirectories = ['/path/to/custom/directory'];
try {
  // REQUEST READ PERMISSIONS FIRST
  const audioFiles = await readAudioFiles(additionalDirectories);
  console.log(audioFiles);
} catch (error) {
  console.error('Error reading audio files:', error);
}
```

## API Reference

### `readTags(fileUri: string): Promise<AudioTags>`

Reads the tags from the audio file at the given URI.

- `fileUri`: The URI of the audio file to read tags from.
- Returns: A Promise that resolves with an object of type `AudioTags`.

### `readAudioFiles(dirPath?: string[]): Promise<AudioFile[]>`

Reads all audio files from the default and given directory paths. Default directories that are always checked are the `music` directory and the `downloads` directory.

- `dirPath` (optional): An array of paths to other directories that contain audio files.
- Returns: A Promise that resolves with an array of objects of type `AudioFile`.

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
  albumArt: string; // Base64 encoded album art
};
```

### AudioFile

```typescript
type AudioFile = {
  extension: string;
  uri: string;
  fileName: string;
  tags: AudioTags;
  duration: string; // in milliseconds
  creationDate: string; // in "dd-MM-yyyy" format
};
```

## Supported File Formats

The module supports reading tags from the following audio file formats:

- MP3
- WAV
- OGG
- FLAC
- M4A
- OPUS

## Platform Support

This module is currently implemented for Android. i have no way of testing iOS.

## Issues and Bug Reports

[Provide information on how users can report issues or bugs]
