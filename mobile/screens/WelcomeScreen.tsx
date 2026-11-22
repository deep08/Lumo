import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Composer from "../components/Composer";
import EntryCard from "../components/EntryCard";
import { colors, fonts, space } from "../theme";
import { JOURNEYS, JourneyTitle } from "../types";

const mascot = require("../assets/mascot.png");

const entries = [
  {
    id: "healthier",
    art: "warm" as const,
    title: JOURNEYS.healthier,
    detail: "Get simple ways to improve what you already eat.",
  },
  {
    id: "ingredients",
    art: "fresh" as const,
    title: JOURNEYS.ingredients,
    detail: "Find quick, healthier meals using what you have.",
  },
];

type WelcomeScreenProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (value: string, imageUri?: string | null) => void;
  onChoose: (title: JourneyTitle) => void;
};

export default function WelcomeScreen({
  draft,
  onDraftChange,
  onSend,
  onChoose,
}: WelcomeScreenProps) {
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.stage} edges={["top"]}>
        <View style={styles.hero}>
          <View style={styles.mascot}>
            <Image
              source={mascot}
              style={styles.mascotImage}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>Hi, I’m Lumo!</Text>
            <Text style={styles.support}>What would you like help with?</Text>
          </View>
        </View>
        <View style={styles.entryRow}>
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              art={entry.art}
              title={entry.title}
              detail={entry.detail}
              onPress={() => onChoose(entry.title)}
            />
          ))}
        </View>
      </SafeAreaView>
      <Composer value={draft} onChange={onDraftChange} onSubmit={onSend} />
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
    justifyContent: "center",
    gap: 26,
  },
  hero: {
    alignItems: "center",
    alignSelf: "center",
    gap: space[12],
    width: 292,
    maxWidth: "100%",
  },
  mascot: {
    width: 113,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  mascotImage: {
    width: 113,
    height: 82,
  },
  copy: {
    alignItems: "center",
    gap: 4,
    width: "100%",
  },
  title: {
    color: colors.contentPrimary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  support: {
    width: 272,
    maxWidth: "100%",
    color: colors.contentSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: space[12],
    paddingHorizontal: space[16],
    paddingVertical: space[12],
  },
});
