import { useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, space } from "../theme";
import { AddIcon, CameraIcon, GalleryIcon, SendIcon } from "./Icons";

const PICKER_DELAY = 300;
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: false,
  allowsMultipleSelection: false,
  quality: 0.7,
  preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
};

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string, imageUri?: string | null) => void;
  tray?: boolean;
};

export default function Composer({ value, onChange, onSubmit, tray = false }: ComposerProps) {
  const insets = useSafeAreaInsets();
  const inputFocusAt = useRef(0);
  const pendingMenuOpen = useRef(false);
  const [keyboardVisible, setKeyboardVisible] = useState(Keyboard.isVisible());
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const canSend = value.trim().length > 0 || Boolean(imageUri);
  const bottomInset = keyboardVisible ? 0 : insets.bottom;

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        if (!pendingMenuOpen.current) setMenuOpen(false);
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        if (!pendingMenuOpen.current) return;
        pendingMenuOpen.current = false;
        setMenuOpen(true);
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  function handleSubmit() {
    if (!canSend) return;
    onSubmit(value, imageUri);
    setImageUri(null);
  }

  function closeMenu() {
    pendingMenuOpen.current = false;
    setMenuOpen(false);
  }

  function handleAddPress() {
    if (Date.now() - inputFocusAt.current < 500) return;
    if (menuOpen || pendingMenuOpen.current) {
      closeMenu();
      return;
    }
    if (Keyboard.isVisible()) {
      pendingMenuOpen.current = true;
      Keyboard.dismiss();
      return;
    }
    setMenuOpen(true);
  }

  function handleInputFocus() {
    inputFocusAt.current = Date.now();
    closeMenu();
  }

  function dismissMenuAndKeyboard() {
    closeMenu();
    Keyboard.dismiss();
  }

  function pickAfterClose(picker: () => Promise<void>) {
    closeMenu();
    setTimeout(() => {
      void picker();
    }, PICKER_DELAY);
  }

  async function applyPickerResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setImageUri(result.assets[0].uri);
  }

  async function openCamera() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
      await applyPickerResult(result);
    } catch {
      return;
    }
  }

  async function openLibrary() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      await applyPickerResult(result);
    } catch {
      return;
    }
  }

  return (
    <View style={[styles.bar, tray && styles.barTray, { paddingBottom: space[12] + bottomInset }]}>
      {menuOpen ? (
        <Pressable
          accessibilityLabel="Dismiss menu"
          onPress={dismissMenuAndKeyboard}
          style={styles.screenDismiss}
        />
      ) : null}
      {imageUri ? (
        <View style={styles.preview}>
          <View style={styles.thumbWrap}>
            <Image source={{ uri: imageUri }} style={styles.thumb} />
            <Pressable
              accessibilityLabel="Remove photo"
              hitSlop={8}
              onPress={() => setImageUri(null)}
              style={styles.remove}
            >
              <Text style={styles.removeMark}>×</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <View style={styles.composerWrap}>
        {menuOpen ? (
          <View style={styles.menu}>
            <Pressable
              accessibilityLabel="Take a photo"
              onPress={() => pickAfterClose(openCamera)}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <CameraIcon />
              <Text style={styles.menuLabel}>Take a photo</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Choose from gallery"
              onPress={() => pickAfterClose(openLibrary)}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <GalleryIcon />
              <Text style={styles.menuLabel}>Choose from gallery</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.composer}>
          <Pressable
            accessibilityLabel="Add"
            onPress={handleAddPress}
            style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
          >
            <AddIcon />
          </Pressable>
          <TextInput
            multiline={false}
            scrollEnabled
            value={value}
            onChangeText={onChange}
            onFocus={handleInputFocus}
            onSubmitEditing={handleSubmit}
            placeholder="Tell Lumo about your meal…"
            placeholderTextColor={colors.contentDisabled}
            accessibilityLabel="Tell Lumo about your meal"
            selectionColor={colors.contentOnBrand}
            returnKeyType="send"
            style={styles.input}
          />
          <Pressable
            accessibilityLabel="Send message"
            disabled={!canSend}
            onPress={handleSubmit}
            style={[styles.send, !canSend && styles.sendDisabled]}
          >
            <SendIcon disabled={!canSend} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: space[12],
    paddingHorizontal: space[16],
    overflow: "visible",
    zIndex: 2,
  },
  screenDismiss: {
    position: "absolute",
    left: -space[16],
    right: -space[16],
    bottom: "100%",
    height: 8000,
    zIndex: 1,
  },
  composerWrap: {
    position: "relative",
    zIndex: 2,
    overflow: "visible",
  },
  barTray: {
    backgroundColor: colors.composerTray,
  },
  preview: {
    alignItems: "flex-start",
    paddingBottom: space[8],
  },
  thumbWrap: {
    width: 69,
    height: 69,
    overflow: "visible",
  },
  thumb: {
    width: 69,
    height: 69,
    borderRadius: radius.xs,
  },
  remove: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceDefault,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contentSecondary,
    borderRadius: radius.pill,
  },
  removeMark: {
    color: colors.contentSecondary,
    fontSize: 13,
    lineHeight: 14,
    fontWeight: "600",
    marginTop: -1,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space[8],
    paddingHorizontal: space[8],
    overflow: "hidden",
    backgroundColor: colors.surfaceDefault,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    flex: 1,
    minWidth: 0,
    margin: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    height: 24,
    color: colors.contentPrimary,
    fontSize: 14,
    fontWeight: "400",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  add: {
    flexShrink: 0,
    padding: space[8],
    marginRight: 4,
    borderRadius: radius.sm,
  },
  addPressed: {
    backgroundColor: colors.surfaceBase,
  },
  send: {
    flexShrink: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.pill,
    marginLeft: 4,
  },
  sendDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  menu: {
    position: "absolute",
    left: 0,
    bottom: "100%",
    zIndex: 3,
    width: 178,
    padding: space[8],
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceDefault,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[8],
    width: 162,
    height: 40,
    padding: space[8],
    borderRadius: radius.md,
  },
  menuItemPressed: {
    backgroundColor: colors.surfaceHover,
  },
  menuLabel: {
    color: colors.contentSecondary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
});
