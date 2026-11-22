import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

const cameraSrc = require("../assets/icon-camera.png");
const gallerySrc = require("../assets/icon-gallery.png");

export function BackIcon() {
  return <Text style={styles.back}>‹</Text>;
}

export function MoreIcon() {
  return (
    <View style={styles.more}>
      <View style={styles.dot} />
      <View style={styles.dot} />
      <View style={styles.dot} />
    </View>
  );
}

export function AddIcon() {
  return (
    <View style={styles.add}>
      <View style={styles.addH} />
      <View style={styles.addV} />
    </View>
  );
}

export function CameraIcon() {
  return (
    <View style={styles.icon}>
      <Image source={cameraSrc} style={styles.camera} accessibilityIgnoresInvertColors />
    </View>
  );
}

export function GalleryIcon() {
  return (
    <View style={styles.icon}>
      <Image source={gallerySrc} style={styles.gallery} accessibilityIgnoresInvertColors />
    </View>
  );
}

export function SendIcon({ disabled }: { disabled: boolean }) {
  return (
    <Text style={[styles.send, { color: disabled ? colors.contentDisabled : colors.sendArrow }]}>
      ↑
    </Text>
  );
}

const styles = StyleSheet.create({
  back: {
    color: "#1E2A18",
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "500",
    marginTop: -2,
  },
  more: {
    width: 24,
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A39",
  },
  add: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  addH: {
    position: "absolute",
    width: 12,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: colors.contentSecondary,
  },
  addV: {
    position: "absolute",
    width: 1.5,
    height: 12,
    borderRadius: 1,
    backgroundColor: colors.contentSecondary,
  },
  send: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "600",
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    width: 24,
    height: 24,
  },
  gallery: {
    width: 24,
    height: 22,
  },
});
