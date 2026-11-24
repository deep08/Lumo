import { useEffect, useRef, useState, type ElementRef } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Composer from "../components/Composer";
import { BackIcon, MoreIcon } from "../components/Icons";
import ImageViewer from "../components/ImageViewer";
import Loader from "../components/Loader";
import RecommendationCard from "../components/RecommendationCard";
import { colors, radius, space } from "../theme";
import { ChatMessage, ConversationPhase, messageImageUris } from "../types";

const CHANGE_MEAL_CHIP = /^change meal$/i;
const COMPLETE_MEAL_CHIP = /^make it a complete meal$/i;

function visibleChips(message: ChatMessage) {
  return (message.chips ?? []).filter((label) => {
    const value = label.trim();
    if (message.meal && CHANGE_MEAL_CHIP.test(value)) return false;
    if (COMPLETE_MEAL_CHIP.test(value) && message.meal?.type === "complete_meal") return false;
    if (COMPLETE_MEAL_CHIP.test(value) && COMPLETE_MEAL_CHIP.test(message.chipSelected ?? "")) {
      return false;
    }
    return true;
  });
}

type ConversationScreenProps = {
  messages: ChatMessage[];
  phase: ConversationPhase;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (value: string, imageUris?: string[]) => void;
  onChip: (label: string) => void;
  onChangeMeal: () => void;
  onToggleRecipe: (messageId: string) => void;
  onBack: () => void;
};

export default function ConversationScreen({
  messages,
  phase,
  draft,
  onDraftChange,
  onSend,
  onChip,
  onChangeMeal,
  onToggleRecipe,
  onBack,
}: ConversationScreenProps) {
  const threadRef = useRef<ElementRef<typeof ScrollView>>(null);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const latestChipId = [...messages].reverse().find((message) => message.chips)?.id;

  useEffect(() => {
    threadRef.current?.scrollToEnd({ animated: true });
  }, [messages, phase]);

  function keepLatestMessageVisible() {
    threadRef.current?.scrollToEnd({ animated: true });
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back"
            onPress={onBack}
            style={({ pressed }) => [styles.headerButton, pressed && styles.headerPressed]}
          >
            <BackIcon />
          </Pressable>
          <Pressable
            accessibilityLabel="More"
            style={({ pressed }) => [styles.headerButton, pressed && styles.headerPressed]}
          >
            <MoreIcon />
          </Pressable>
        </View>
      </SafeAreaView>
      <ScrollView
        ref={threadRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <View key={message.id} style={styles.turnUser}>
                {messageImageUris(message).length ? (
                  <View style={styles.userImages}>
                    {messageImageUris(message).map((uri, index) => (
                      <Pressable
                        key={`${uri}-${index}`}
                        accessibilityLabel="View photo"
                        onPress={() => setViewerUri(uri)}
                        style={styles.userImageHit}
                      >
                        <Image
                          source={{ uri }}
                          style={styles.userImage}
                          resizeMode="cover"
                          accessibilityIgnoresInvertColors
                        />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {message.text ? (
                  <View style={styles.userBubble}>
                    <Text style={styles.userBubbleText}>{message.text}</Text>
                  </View>
                ) : null}
              </View>
            );
          }
          if (message.role === "status") {
            return (
              <View key={message.id} style={styles.status} accessibilityLiveRegion="polite">
                <Loader />
              </View>
            );
          }
          const chips = visibleChips(message);
          const chipsLocked =
            phase === "loading" || Boolean(message.chipSelected) || message.id !== latestChipId;
          return (
            <View key={message.id} style={styles.aiTurn}>
              <Text style={styles.aiText}>{message.text}</Text>
              {chips.length ? (
                <View style={styles.chips}>
                  {chips.map((label) => (
                    <Pressable
                      key={label}
                      disabled={chipsLocked}
                      onPress={() => onChip(label)}
                      style={[
                        styles.chip,
                        message.chipSelected === label && styles.chipSelected,
                      ]}
                    >
                      <Text style={styles.chipLabel}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {message.meal ? (
                <RecommendationCard
                  meal={message.meal}
                  recipeOpen={Boolean(message.recipeOpen)}
                  onToggleRecipe={() => onToggleRecipe(message.id)}
                  onChangeMeal={onChangeMeal}
                />
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      <Composer
        tray
        value={draft}
        onChange={onDraftChange}
        onSubmit={onSend}
        onLayout={keepLatestMessageVisible}
      />
      <ImageViewer uri={viewerUri} onClose={() => setViewerUri(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceBase,
  },
  headerSafe: {
    backgroundColor: colors.surfaceBase,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: space[8],
    backgroundColor: colors.surfaceBase,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceBase,
  },
  headerPressed: {
    backgroundColor: colors.surfaceHover,
    transform: [{ scale: 0.95 }],
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    gap: space[20],
    paddingHorizontal: space[16],
    paddingVertical: space[12],
  },
  turnUser: {
    width: "100%",
    alignItems: "flex-end",
    gap: space[8],
  },
  userImages: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: space[8],
    maxWidth: "80%",
  },
  userImageHit: {
    width: 64,
    height: 64,
  },
  userImage: {
    width: 64,
    height: 64,
    borderRadius: radius.xs,
    overflow: "hidden",
  },
  userBubble: {
    maxWidth: "80%",
    paddingVertical: space[8],
    paddingHorizontal: space[12],
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.tail,
    backgroundColor: colors.userBubble,
  },
  userBubbleText: {
    color: colors.contentPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  aiTurn: {
    alignItems: "flex-start",
    gap: space[8],
    width: "100%",
  },
  aiText: {
    maxWidth: 307,
    color: colors.contentPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[8],
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: space[8],
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: radius.md,
    backgroundColor: "transparent",
  },
  chipSelected: {
    backgroundColor: colors.userBubble,
  },
  chipLabel: {
    color: colors.contentPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  status: {
    alignItems: "flex-start",
  },
});
