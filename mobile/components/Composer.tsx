import { useEffect, useRef, useState, type ElementRef } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
  type TextInputContentSizeChangeEvent,
} from "react-native";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, space } from "../theme";
import { MAX_CHAT_IMAGES } from "../types";
import { AddIcon, CameraIcon, GalleryIcon, SendIcon } from "./Icons";

const LINE_HEIGHT = 24;
const MAX_CONTENT_HEIGHT = 144;
const CONTENT_PAD_Y = space[4];
const MAX_TEXT_HEIGHT = MAX_CONTENT_HEIGHT - CONTENT_PAD_Y * 2;
const GLASS_BLUR_INTENSITY = 24;
const MENU_GLASS_BLUR_INTENSITY = 20;
const PICKER_DELAY = 300;
const IMAGE_LIMIT_MESSAGE = "You can attach up to 5 photos.";
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: false,
  quality: 0.7,
  preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
};

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string, imageUris?: string[]) => void;
  tray?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
};

function clampedTextHeight(height: number) {
  return Math.min(Math.max(Math.ceil(height), LINE_HEIGHT), MAX_TEXT_HEIGHT);
}

function ComposerGlass() {
  return (
    <>
      {Platform.OS === "ios" ? (
        <BlurView
          pointerEvents="none"
          tint="light"
          intensity={GLASS_BLUR_INTENSITY}
          style={styles.glassBlur}
        />
      ) : null}
      <View pointerEvents="none" style={styles.glassFill} />
    </>
  );
}

function MenuGlass() {
  return (
    <>
      {Platform.OS === "ios" ? (
        <BlurView
          pointerEvents="none"
          tint="light"
          intensity={MENU_GLASS_BLUR_INTENSITY}
          style={styles.menuGlassBlur}
        />
      ) : null}
      <View pointerEvents="none" style={styles.menuGlassFill} />
    </>
  );
}

export default function Composer({
  value,
  onChange,
  onSubmit,
  tray = false,
  onLayout,
}: ComposerProps) {
  const insets = useSafeAreaInsets();
  const inputFocusAt = useRef(0);
  const pendingMenuOpen = useRef(false);
  const contentScrollRef = useRef<ElementRef<typeof ScrollView>>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(Keyboard.isVisible());
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [measureWidth, setMeasureWidth] = useState(0);
  const [inputHeight, setInputHeight] = useState(LINE_HEIGHT);
  const [scrollable, setScrollable] = useState(false);
  const hasImages = imageUris.length > 0;
  const canSend = value.trim().length > 0 || hasImages;
  const stacked = expanded || hasImages;
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

  useEffect(() => {
    if (value !== "") return;
    setExpanded(false);
    setInputHeight(LINE_HEIGHT);
    setScrollable(false);
  }, [value]);

  function handleSubmit() {
    if (!canSend) return;
    onSubmit(value, imageUris);
    setImageUris([]);
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

  function handleFieldLayout(event: LayoutChangeEvent) {
    if (stacked) return;
    const width = event.nativeEvent.layout.width;
    if (width <= 0) return;
    if (Math.abs(width - measureWidth) > 0.5) setMeasureWidth(width);
  }

  function handleMeasureLayout(event: LayoutChangeEvent) {
    const height = event.nativeEvent.layout.height;
    if (value === "") {
      setExpanded(false);
      setInputHeight(LINE_HEIGHT);
      setScrollable(false);
      return;
    }
    const needsRoom = value.includes("\n") || height > LINE_HEIGHT + 1;
    setExpanded(needsRoom);
    if (!needsRoom) {
      setInputHeight(LINE_HEIGHT);
      setScrollable(false);
      return;
    }
    if (hasImages) {
      setInputHeight(Math.max(Math.ceil(height), LINE_HEIGHT));
      setScrollable(false);
      return;
    }
    setInputHeight(clampedTextHeight(height));
    setScrollable(height > MAX_TEXT_HEIGHT + 0.5);
  }

  function handleContentSizeChange(event: TextInputContentSizeChangeEvent) {
    if (!expanded) return;
    const height = event.nativeEvent.contentSize.height;
    if (hasImages) {
      setInputHeight(Math.max(Math.ceil(height), LINE_HEIGHT));
      setScrollable(false);
      return;
    }
    setInputHeight(clampedTextHeight(height));
    setScrollable(height > MAX_TEXT_HEIGHT + 0.5);
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

  function showImageLimit() {
    Alert.alert(IMAGE_LIMIT_MESSAGE);
  }

  async function applyPickerResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled) return;
    const picked = (result.assets ?? []).map((asset) => asset.uri).filter(Boolean);
    if (!picked.length) return;
    setImageUris((current) => {
      const room = MAX_CHAT_IMAGES - current.length;
      if (room <= 0) {
        showImageLimit();
        return current;
      }
      if (picked.length > room) showImageLimit();
      return [...current, ...picked.slice(0, room)];
    });
  }

  async function openCamera() {
    if (imageUris.length >= MAX_CHAT_IMAGES) {
      showImageLimit();
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchCameraAsync({
        ...PICKER_OPTIONS,
        allowsMultipleSelection: false,
      });
      await applyPickerResult(result);
    } catch {
      return;
    }
  }

  async function openLibrary() {
    if (imageUris.length >= MAX_CHAT_IMAGES) {
      showImageLimit();
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const remaining = MAX_CHAT_IMAGES - imageUris.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        ...PICKER_OPTIONS,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });
      await applyPickerResult(result);
    } catch {
      return;
    }
  }

  const addButton = (
    <Pressable
      accessibilityLabel="Add"
      onPress={handleAddPress}
      style={({ pressed }) => [
        styles.add,
        stacked && styles.addExpanded,
        pressed && styles.addPressed,
      ]}
    >
      <AddIcon />
    </Pressable>
  );

  const imagePreview = hasImages ? (
    <View style={styles.preview}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        style={styles.thumbRow}
        contentContainerStyle={styles.thumbRowContent}
      >
        {imageUris.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} />
            <Pressable
              accessibilityLabel="Remove photo"
              hitSlop={8}
              onPress={() => setImageUris((current) => current.filter((_, item) => item !== index))}
              style={styles.remove}
            >
              <Text style={styles.removeMark}>×</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  ) : null;

  const sendButton = (
    <Pressable
      accessibilityLabel="Send message"
      disabled={!canSend}
      onPress={handleSubmit}
      style={[styles.send, stacked && styles.sendExpanded, !canSend && styles.sendDisabled]}
    >
      <SendIcon disabled={!canSend} />
    </Pressable>
  );

  const contentPad = stacked && !hasImages;
  const fieldHeight = expanded ? inputHeight : LINE_HEIGHT;
  const field = (
    <View
      key="composer-field"
      onLayout={handleFieldLayout}
      style={[
        styles.field,
        stacked && styles.fieldExpanded,
        contentPad && styles.contentPad,
        contentPad ? { maxHeight: MAX_CONTENT_HEIGHT } : null,
        { height: contentPad ? fieldHeight + CONTENT_PAD_Y * 2 : fieldHeight },
      ]}
    >
      <TextInput
        multiline
        scrollEnabled={scrollable}
        value={value}
        onChangeText={onChange}
        onFocus={handleInputFocus}
        onSubmitEditing={handleSubmit}
        onContentSizeChange={handleContentSizeChange}
        placeholder="Tell Lumo about your meal…"
        placeholderTextColor={colors.contentTertiary}
        accessibilityLabel="Tell Lumo about your meal"
        selectionColor={colors.contentOnBrand}
        returnKeyType="send"
        submitBehavior="blurAndSubmit"
        underlineColorAndroid="transparent"
        style={[styles.input, { height: fieldHeight }]}
      />
    </View>
  );

  return (
    <View
      onLayout={onLayout}
      style={[styles.bar, tray && styles.barTray, { paddingBottom: space[12] + bottomInset }]}
    >
      {menuOpen ? (
        <Pressable
          accessibilityLabel="Dismiss menu"
          onPress={dismissMenuAndKeyboard}
          style={styles.screenDismiss}
        />
      ) : null}
      <View style={styles.composerWrap}>
        {menuOpen ? (
          <View style={styles.menu}>
            <View style={styles.menuSurface}>
              <MenuGlass />
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
          </View>
        ) : null}
        {measureWidth > 0 ? (
          <Text
            pointerEvents="none"
            onLayout={handleMeasureLayout}
            style={[styles.measure, { width: measureWidth }]}
          >
            {value === "" ? " " : value}
          </Text>
        ) : null}
        <View style={styles.composerShadow}>
          <View
            style={[
              styles.composer,
              stacked && styles.composerExpanded,
              hasImages && styles.composerWithImage,
            ]}
          >
            <ComposerGlass />
            {stacked ? null : addButton}
            {hasImages ? (
              <View style={styles.contentFrame}>
                <ScrollView
                  ref={contentScrollRef}
                  style={styles.combinedScroll}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() => {
                    contentScrollRef.current?.scrollToEnd({ animated: false });
                  }}
                >
                  {imagePreview}
                  {field}
                </ScrollView>
              </View>
            ) : (
              field
            )}
            {stacked ? (
              <View style={styles.actionRow}>
                {addButton}
                {sendButton}
              </View>
            ) : (
              sendButton
            )}
          </View>
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
    pointerEvents: "box-none",
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
    pointerEvents: "box-none",
  },
  barTray: {
    backgroundColor: "transparent",
  },
  preview: {
    alignItems: "flex-start",
    alignSelf: "stretch",
    paddingBottom: space[8],
  },
  thumbRow: {
    flexGrow: 0,
  },
  thumbRowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[8],
  },
  thumbWrap: {
    width: 75,
    height: 73,
    overflow: "visible",
  },
  thumb: {
    position: "absolute",
    left: 0,
    top: 4,
    width: 69,
    height: 69,
    borderRadius: radius.xs,
    overflow: "hidden",
  },
  remove: {
    position: "absolute",
    top: 0,
    right: 0,
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
  composerShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space[4],
    paddingHorizontal: space[8],
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  glassBlur: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.md,
  },
  glassFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.composerGlass,
    borderRadius: radius.md,
  },
  composerExpanded: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  composerWithImage: {
    overflow: "visible",
  },
  contentFrame: {
    maxHeight: MAX_CONTENT_HEIGHT,
    paddingVertical: space[4],
    paddingHorizontal: space[8],
    alignSelf: "stretch",
    width: "100%",
    flexGrow: 0,
    overflow: "hidden",
  },
  contentPad: {
    paddingVertical: space[4],
    paddingHorizontal: space[8],
  },
  combinedScroll: {
    maxHeight: MAX_TEXT_HEIGHT,
    alignSelf: "stretch",
    width: "100%",
    flexGrow: 0,
  },
  field: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    justifyContent: "center",
  },
  fieldExpanded: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    width: "100%",
    alignSelf: "stretch",
  },
  measure: {
    position: "absolute",
    left: -4096,
    top: 0,
    color: colors.contentPrimary,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: LINE_HEIGHT,
    includeFontPadding: false,
  },
  input: {
    width: "100%",
    margin: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    backgroundColor: "transparent",
    color: colors.contentPrimary,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: LINE_HEIGHT,
    textAlignVertical: "top",
    includeFontPadding: false,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    height: 44,
  },
  add: {
    flexShrink: 0,
    padding: space[8],
    marginRight: space[4],
    borderRadius: radius.sm,
  },
  addExpanded: {
    marginRight: 0,
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
    marginLeft: space[12],
  },
  sendExpanded: {
    marginLeft: 0,
  },
  sendDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  menu: {
    position: "absolute",
    left: -4,
    bottom: "100%",
    zIndex: 3,
    width: 176,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  menuSurface: {
    width: 176,
    padding: space[8],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
  },
  menuGlassBlur: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.sm,
  },
  menuGlassFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.glassFill,
    borderRadius: radius.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[8],
    alignSelf: "stretch",
    height: 40,
    padding: space[8],
    borderRadius: radius.md,
  },
  menuItemPressed: {
    backgroundColor: colors.surfaceElevated,
  },
  menuLabel: {
    color: colors.contentSecondary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
});
