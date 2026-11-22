import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "../theme";

const mascot = require("../assets/mascot-splash.png");

export default function SplashScreen() {
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.stage} edges={["top", "bottom"]}>
        <View style={styles.mark}>
          <Image
            source={mascot}
            style={styles.mascot}
            resizeMode="contain"
            accessibilityLabel="Lumo"
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.wordmark}>lumoStep</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceBase,
  },
  stage: {
    flex: 1,
  },
  mark: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  mascot: {
    width: 123,
    height: 91,
  },
  wordmark: {
    color: colors.contentOnBrand,
    fontFamily: fonts.wordmark,
    fontSize: 40,
    lineHeight: 40,
    textAlign: "center",
  },
});
