import { StyleSheet, Text, View } from "react-native";

import * as ExpoTagReader from "expo-tag-reader";

export default function App() {
    const tags = ExpoTagReader.readTags("example URI");
    return (
        <View style={styles.container}>
            <Text>{JSON.stringify(tags)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
});
