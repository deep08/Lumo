import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space } from "../theme";

const entryArt = require("../assets/entry-art.png");

type EntryCardProps = {
  art: "warm" | "fresh";
  title: string;
  detail: string;
  onPress: () => void;
};

export default function EntryCard({ art, title, detail, onPress }: EntryCardProps) {
  const meal = art === "warm";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        meal ? styles.warm : styles.fresh,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.art, meal ? styles.artMeal : styles.artIngredients]}>
        <Image source={entryArt} style={meal ? styles.artImageMeal : styles.artImageIngredients} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    padding: space[12],
    borderRadius: radius.md,
    gap: space[8],
  },
  warm: {
    backgroundColor: colors.surfaceChoiceWarm,
  },
  fresh: {
    backgroundColor: colors.surfaceChoiceFresh,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  art: {
    height: 35,
    overflow: "hidden",
    borderRadius: radius.md,
  },
  artMeal: {
    width: 40,
  },
  artIngredients: {
    width: 43,
  },
  artImageMeal: {
    position: "absolute",
    top: -23.5,
    left: -120,
    width: 281,
    height: 187,
  },
  artImageIngredients: {
    position: "absolute",
    top: -165,
    left: -227,
    width: 466,
    height: 309,
  },
  copy: {
    gap: space[8],
  },
  title: {
    color: colors.contentPrimary,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  detail: {
    color: colors.contentTertiary,
    fontSize: 14,
    lineHeight: 20,
  },
});
