import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, space } from "../theme";

const closeSrc = require("../assets/icon-close.png");

type ImageViewerProps = {
  uri: string | null;
  onClose: () => void;
};

export default function ImageViewer({ uri, onClose }: ImageViewerProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <Modal
      visible={Boolean(uri)}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {uri ? (
          <ScrollView
            key={uri}
            style={styles.zoom}
            contentContainerStyle={[styles.zoomContent, { width, height }]}
            maximumZoomScale={4}
            minimumZoomScale={1}
            bouncesZoom
            centerContent
            pinchGestureEnabled
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={{ uri }}
              style={{ width, height }}
              resizeMode="contain"
              accessibilityLabel="Photo"
            />
          </ScrollView>
        ) : null}
        <Pressable
          accessibilityLabel="Close photo"
          onPress={onClose}
          style={[styles.close, { top: insets.top + space[8], right: space[16] }]}
        >
          <View style={styles.closeIcon}>
            <Image
              source={closeSrc}
              style={styles.closeGlyph}
              accessibilityIgnoresInvertColors
            />
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
  },
  zoom: {
    flex: 1,
  },
  zoomContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    position: "absolute",
    zIndex: 2,
    width: 40,
    height: 40,
    padding: space[8],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceBase,
    borderRadius: 20,
  },
  closeIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
  },
  closeGlyph: {
    width: 14,
    height: 14,
  },
});
