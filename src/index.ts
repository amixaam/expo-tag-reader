// Import the native module. On web, it will be resolved to ExpoTagReader.web.ts
// and on native platforms to ExpoTagReader.ts
import { AudioTags } from "./ExpoTagReader.types";
import ExpoTagReaderModule from "./ExpoTagReaderModule";

export function readTags(uri: string): string {
    return ExpoTagReaderModule.readTags(uri);
}
