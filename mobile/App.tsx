import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ERROR_TEXT, requestReply } from "./conversation/api";
import ConversationScreen from "./screens/ConversationScreen";
import SplashScreen from "./screens/SplashScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import { colors, fonts } from "./theme";
import { ChatMessage, ConversationState, EntryMode, JourneyTitle, MAX_CHAT_IMAGES } from "./types";

const SPLASH_MS = 1600;

let sequence = 0;

function nextId() {
  sequence += 1;
  return `m${sequence}`;
}

function userMessage(text: string, images?: string[] | string | null): ChatMessage {
  const message: ChatMessage = { id: nextId(), role: "user", text };
  const uris = (Array.isArray(images) ? images : images ? [images] : [])
    .filter(Boolean)
    .slice(0, MAX_CHAT_IMAGES);
  if (uris.length) {
    message.images = uris;
    message.image = uris[0];
  }
  return message;
}

function assistantMessage(text: string, chips: string[] = [], meal?: ChatMessage["meal"]): ChatMessage {
  const message: ChatMessage = { id: nextId(), role: "assistant", text };
  if (chips.length) message.chips = chips;
  if (meal) message.meal = meal;
  return message;
}

function statusMessage(): ChatMessage {
  return { id: nextId(), role: "status", text: "" };
}

function spokenMessages(messages: ChatMessage[]) {
  return messages.filter((message) => message.role === "user" || message.role === "assistant");
}

function toggleRecipe(state: ConversationState, messageId: string): ConversationState {
  return {
    ...state,
    messages: state.messages.map((message) =>
      message.id === messageId ? { ...message, recipeOpen: !message.recipeOpen } : message,
    ),
  };
}

function withChipSelected(messages: ChatMessage[], label: string) {
  let marked = false;
  return [...messages]
    .reverse()
    .map((message) => {
      if (!marked && message.chips && !message.chipSelected) {
        marked = true;
        return { ...message, chipSelected: label };
      }
      return message;
    })
    .reverse();
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    [fonts.wordmark]: require("./assets/fonts/Lora-Bold.ttf"),
  });
  const [view, setView] = useState<"splash" | "welcome" | "conversation">("splash");
  const [conversation, setConversation] = useState<ConversationState>({
    phase: "ready",
    entry: null,
    messages: [],
  });
  const [draft, setDraft] = useState("");
  const conversationRef = useRef(conversation);
  const requestRef = useRef(0);
  conversationRef.current = conversation;

  useEffect(() => {
    const fallback = setTimeout(() => {
      setView((current) => (current === "splash" ? "welcome" : current));
    }, 4000);
    return () => clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    const timer = setTimeout(() => {
      setView((current) => (current === "splash" ? "welcome" : current));
    }, SPLASH_MS);
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  function ask(entry: EntryMode, messages: ChatMessage[]) {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const loading: ConversationState = {
      phase: "loading",
      entry,
      messages: [...messages, statusMessage()],
    };
    conversationRef.current = loading;
    setConversation(loading);
    requestReply({ entry, messages })
      .then((reply) => {
        if (requestRef.current !== requestId) return;
        const next: ConversationState = {
          phase: "ready",
          entry,
          messages: [...messages, assistantMessage(reply.text, reply.chips, reply.meal ?? undefined)],
        };
        conversationRef.current = next;
        setConversation(next);
      })
      .catch(() => {
        if (requestRef.current !== requestId) return;
        const next: ConversationState = {
          phase: "ready",
          entry,
          messages: [...messages, assistantMessage(ERROR_TEXT)],
        };
        conversationRef.current = next;
        setConversation(next);
      });
  }

  function openJourney(title: JourneyTitle) {
    setView("conversation");
    const current = conversationRef.current;
    if (current.entry === title && spokenMessages(current.messages).length > 0) return;
    ask(title, [userMessage(title)]);
  }

  function sendMessage(text: string, imageUris: string[] = []) {
    const trimmed = text.trim();
    const images = imageUris.filter(Boolean).slice(0, MAX_CHAT_IMAGES);
    const current = conversationRef.current;
    if ((!trimmed && !images.length) || current.phase === "loading") return;
    setDraft("");
    setView("conversation");
    const nextUser = userMessage(trimmed, images);
    const history =
      view === "welcome" ? [nextUser] : [...spokenMessages(current.messages), nextUser];
    ask(view === "welcome" ? null : current.entry, history);
  }

  function chooseChip(label: string) {
    const current = conversationRef.current;
    if (current.phase === "loading") return;
    const messages = withChipSelected(spokenMessages(current.messages), label);
    ask(current.entry, [...messages, userMessage(label)]);
  }

  function changeMeal() {
    const current = conversationRef.current;
    if (current.phase === "loading") return;
    const messages = spokenMessages(current.messages);
    if (!messages.some((message) => message.meal)) return;
    ask(current.entry, [...messages, userMessage("Change meal")]);
  }

  function toggleMessageRecipe(messageId: string) {
    const next = toggleRecipe(conversationRef.current, messageId);
    conversationRef.current = next;
    setConversation(next);
  }

  return (
    <SafeAreaProvider>
      <View style={styles.screen}>
        <StatusBar style="dark" hidden={false} verticalBarBehaviorIOS="disabled" />
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {view === "splash" ? (
            fontsLoaded || fontError ? <SplashScreen /> : <View style={styles.screen} />
          ) : view === "welcome" ? (
            <WelcomeScreen
              draft={draft}
              onDraftChange={setDraft}
              onSend={sendMessage}
              onChoose={openJourney}
            />
          ) : (
            <ConversationScreen
              messages={conversation.messages}
              phase={conversation.phase}
              draft={draft}
              onDraftChange={setDraft}
              onSend={sendMessage}
              onChip={chooseChip}
              onChangeMeal={changeMeal}
              onToggleRecipe={toggleMessageRecipe}
              onBack={() => setView("welcome")}
            />
          )}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceBase,
  },
});
