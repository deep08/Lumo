import { useEffect, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, space } from "../theme";
import { AddIcon, SendIcon } from "./Icons";

const LINE_HEIGHT = 20;

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  tray?: boolean;
};

export default function Composer({ value, onChange, onSubmit, tray = false }: ComposerProps) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(Keyboard.isVisible());
  const canSend = value.trim().length > 0;
  const bottomInset = keyboardVisible ? 0 : insets.bottom;

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  function handleSubmit() {
    if (!canSend) return;
    onSubmit(value);
  }

  return (
    <View style={[styles.bar, tray && styles.barTray, { paddingBottom: space[12] + bottomInset }]}>
      <View style={styles.composer}>
        <Pressable
          accessibilityLabel="Add"
          style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
        >
          <AddIcon />
        </Pressable>
        <TextInput
          multiline={false}
          scrollEnabled
          value={value}
          onChangeText={onChange}
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
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: space[12],
    paddingHorizontal: space[16],
  },
  barTray: {
    backgroundColor: colors.composerTray,
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
    height: LINE_HEIGHT,
    color: colors.contentPrimary,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: LINE_HEIGHT,
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
});
