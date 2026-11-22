import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ERROR_TEXT, requestReply } from "./conversation/api";
import ConversationScreen from "./screens/ConversationScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import { colors } from "./theme";
import { ChatMessage, ConversationState, EntryMode, JourneyTitle } from "./types";

const CONFIRMATION = "Sounds good. This meal is set.";

let sequence = 0;

function nextId() {
  sequence += 1;
  return `m${sequence}`;
}

function userMessage(text: string): ChatMessage {
  return { id: nextId(), role: "user", text };
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

function confirmMeal(state: ConversationState): ConversationState {
  if (state.phase === "loading" || state.phase === "confirmed") return state;
  if (!state.messages.some((message) => message.meal)) return state;
  return {
    ...state,
    phase: "confirmed",
    messages: [...state.messages, assistantMessage(CONFIRMATION)],
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
  const [view, setView] = useState<"welcome" | "conversation">("welcome");
  const [conversation, setConversation] = useState<ConversationState>({
    phase: "ready",
    entry: null,
    messages: [],
  });
  const [draft, setDraft] = useState("");
  const conversationRef = useRef(conversation);
  const requestRef = useRef(0);
  conversationRef.current = conversation;

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

  function sendMessage(text: string) {
    const trimmed = text.trim();
    const current = conversationRef.current;
    if (!trimmed || current.phase === "loading") return;
    setDraft("");
    setView("conversation");
    if (view === "welcome") {
      ask(null, [userMessage(trimmed)]);
      return;
    }
    ask(current.entry, [...spokenMessages(current.messages), userMessage(trimmed)]);
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

  function acceptMeal() {
    const current = conversationRef.current;
    const next = confirmMeal(current);
    conversationRef.current = next;
    setConversation(next);
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
          {view === "welcome" ? (
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
              onAccept={acceptMeal}
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
