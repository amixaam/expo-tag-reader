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
    const [tags, setTags] = useState<AudioTags>({
        title: "",
        artist: "",
        album: "",
        year: "",
        genre: "",
        track: "",
        comment: "",
        albumArt: "",
    });

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
                const fileTags = await ExpoTagReader.readTags(
                    result.assets[0].uri
                );
                setTags(fileTags);
            }
        } catch (err) {
            console.error("Failed to pick audio file", err);
        }
    };

    const readAudioFiles = async () => {
        if (!hasPermission) {
            console.log("Permission not granted");
            return;
        }

        try {
            const files = await ExpoTagReader.readAudioFiles(customDirectories);
            setAudioFiles(files);
            console.log("Files found:", files.length);
        } catch (err) {
            console.error("Failed to find audio files", err);
            if (err instanceof Error) {
                console.error("Error message:", err.message);
            }
        }
    };

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
                        uri: `data:image/jpeg;base64,${item.tags.albumArt}`,
                    }}
                    style={styles.albumArt}
                />
            ) : (
                <View style={styles.noAlbumArt}>
                    <Text>No Album Art</Text>
                </View>
            )}
            <View>
                <Text>File: {item.fileName}</Text>
                <Text>Title: {item.tags.title}</Text>
                <Text>Artist: {item.tags.artist}</Text>
                <Text>Album: {item.tags.album}</Text>
                <Text>Duration: {FormatMillis(item.duration)}</Text>
                <Text>Created: {item.creationDate}</Text>
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
                <Button title="Find Audio Files" onPress={readAudioFiles} />
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
                                uri: `data:image/jpeg;base64,${tags.albumArt}`,
                            }}
                            style={styles.albumArt}
                        />
                    ) : (
                        <View style={styles.noAlbumArt}>
                            <Text>No Album Art</Text>
                        </View>
                    )}
                    <Text>Title: {tags.title}</Text>
                    <Text>Artist: {tags.artist}</Text>
                    <Text>Album: {tags.album}</Text>
                    <Text>Year: {tags.year}</Text>
                    <Text>Genre: {tags.genre}</Text>
                    <Text>Track: {tags.track}</Text>
                    <Text>Comment: {tags.comment}</Text>
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
