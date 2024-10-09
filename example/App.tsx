import * as DocumentPicker from "expo-document-picker";
import * as ExpoTagReader from "expo-tag-reader";
import { AudioTags, AudioFile } from "expo-tag-reader/ExpoTagReader.types";
import React, { useEffect, useState } from "react";
import {
    Button,
    FlatList,
    StyleSheet,
    Text,
    View,
    TextInput,
    Image,
} from "react-native";
import * as MediaLibrary from "expo-media-library";

export default function App() {
    const [tags, setTags] = useState<AudioTags>({} as AudioTags);

    const FormatMillis = (milliseconds: string) => {
        const millisecondsNum = parseInt(milliseconds);
        const minutes = Math.floor(millisecondsNum / (1000 * 60));
        const seconds = Math.floor((millisecondsNum % (1000 * 60)) / 1000);

        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    };

    const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
    const [hasPermission, setHasPermission] = useState(false);
    const [customDirectories, setCustomDirectories] = useState<string[]>([]);
    const [newDirectory, setNewDirectory] = useState("");

    useEffect(() => {
        (async () => {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setHasPermission(status === "granted");
        })();
    }, []);

    const pickAudioFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "audio/*",
            });

            if (!result.canceled) {
                const fileTags = ExpoTagReader.readTags(
                    result.assets[0].uri,
                    undefined,
                    true
                );
                setTags(fileTags);
            }
        } catch (err) {
            console.error("Failed to pick audio file", err);
        }
    };

    async function loadAllAudioFiles() {
        const pageSize = 10;
        let pageNumber = 1;
        let allAudioFiles: AudioFile[] = [];
        let currentPage: AudioFile[];

        const startTime = Date.now();

        console.log(
            await ExpoTagReader.getRemovedAudioFiles(
                audioFiles.map((audioFile) => audioFile.internalId)
            )
        );

        do {
            currentPage = await ExpoTagReader.readNewAudioFiles(
                audioFiles.map((audioFile) => audioFile.internalId),
                pageSize,
                pageNumber
            );
            pageNumber++;

            allAudioFiles = allAudioFiles.concat(currentPage);
        } while (currentPage.length === pageSize);
        setAudioFiles([...audioFiles, ...allAudioFiles]);

        const endTime = Date.now();
        console.log(
            `PAGES: ${pageNumber} // BATCHES: ${pageSize} // Read ${allAudioFiles.length} audio files in ${endTime - startTime}ms`
        );
    }

    const addCustomDirectory = () => {
        if (newDirectory && !customDirectories.includes(newDirectory)) {
            setCustomDirectories([...customDirectories, newDirectory]);
            setNewDirectory("");
        }
    };

    const renderAudioFile = ({ item }: { item: AudioFile }) => (
        <View style={styles.audioFileItem}>
            {item.tags.albumArt ? (
                <Image
                    source={{
                        uri: item.tags.albumArt.startsWith("file:///")
                            ? item.tags.albumArt
                            : `data:${item.tags.albumArt};base64,${item.tags.albumArt}`,
                    }}
                    style={styles.albumArt}
                />
            ) : (
                <View style={styles.noAlbumArt}>
                    <Text>No Album Art</Text>
                </View>
            )}
            <View>
                <Text>
                    Artwork:{" "}
                    {item.tags.albumArt.startsWith("file:///")
                        ? "URI (cached)"
                        : "base64"}
                </Text>
                <Text>File: {item.fileName}</Text>
                <Text>
                    {item.extension};{" "}
                    {Math.floor(parseInt(item.tags.bitrate) / 1000).toString()}{" "}
                    kb\s;{" "}
                    {Math.floor(
                        parseInt(item.tags.sampleRate) / 1000
                    ).toString()}{" "}
                    KHz
                </Text>
                <Text>channels: {item.tags.channels}</Text>
                <Text>Title: {item.tags.title}</Text>
                <Text>Artist: {item.tags.artist}</Text>
                <Text>Album: {item.tags.album}</Text>
                <Text>Duration: {FormatMillis(item.tags.duration)}</Text>
                <Text>Created: {item.creationDate}</Text>
                <Text>ID: {item.internalId}</Text>
            </View>
        </View>
    );

    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <Text>Permission to access media library is required.</Text>
                <Button
                    title="Request Permission"
                    onPress={async () => {
                        const { status } =
                            await MediaLibrary.requestPermissionsAsync();
                        setHasPermission(status === "granted");
                    }}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.buttonContainer}>
                <Button title="Pick Audio File" onPress={pickAudioFile} />
                <Button title="Find Audio Files" onPress={loadAllAudioFiles} />
            </View>
            <View style={styles.directoryInputContainer}>
                <TextInput
                    style={styles.input}
                    value={newDirectory}
                    onChangeText={setNewDirectory}
                    placeholder="Enter custom directory path"
                />
                <Button title="Add Directory" onPress={addCustomDirectory} />
            </View>
            <Text>Custom Directories:</Text>
            {customDirectories.map((dir, index) => (
                <Text key={index}>{dir}</Text>
            ))}
            {tags.title && (
                <View style={styles.tagsContainer}>
                    {tags.albumArt ? (
                        <Image
                            source={{
                                uri: tags.albumArt.startsWith("file:///")
                                    ? tags.albumArt
                                    : `data:${tags.albumArt};base64,${tags.albumArt}`,
                            }}
                            style={styles.albumArt}
                        />
                    ) : (
                        <View style={styles.noAlbumArt}>
                            <Text>No Album Art</Text>
                        </View>
                    )}
                    <Text>
                        Artwork:{" "}
                        {tags.albumArt.startsWith("file:///")
                            ? "URI (cached)"
                            : "base64"}
                    </Text>
                    <Text>Title: {tags.title}</Text>
                    <Text>Artist: {tags.artist}</Text>
                    <Text>Album: {tags.album}</Text>
                    <Text>Genre: {tags.genre}</Text>
                    <Text>Year: {tags.year}</Text>
                    <Text>Comment: {tags.comment}</Text>
                    <Text>Track: {tags.track}</Text>
                </View>
            )}
            <Text>Audio Files Found: {audioFiles.length}</Text>
            <FlatList
                data={audioFiles}
                renderItem={renderAudioFile}
                keyExtractor={(item) => item.uri}
                style={styles.audioFilesList}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginBottom: 20,
    },
    directoryInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        marginRight: 10,
        flex: 1,
    },
    tagsContainer: {
        marginTop: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
    },
    audioFilesList: {
        marginTop: 20,
        width: "100%",
    },
    audioFileItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        flexDirection: "row",
    },
    albumArt: {
        width: 50,
        height: 50,
        marginRight: 10,
    },
    noAlbumArt: {
        width: 50,
        height: 50,
        backgroundColor: "#ccc",
    },
});
