import { useRef, useState } from "react";
import { confirmMeal, toggleRecipe } from "./conversation/mock";
import { requestReply } from "./conversation/api";
import ConversationScreen from "./screens/ConversationScreen";
import WelcomeScreen from "./screens/WelcomeScreen";

const STATUS_TEXT = "Updating the change";
const ERROR_TEXT = "I couldn’t reach Lumo just now. Send that again.";

let sequence = 0;

function nextId() {
  sequence += 1;
  return `m${sequence}`;
}

function userMessage(text) {
  return { id: nextId(), role: "user", text };
}

function assistantMessage(text, chips = [], meal = null) {
  const message = { id: nextId(), role: "assistant", text };
  if (chips.length) message.chips = chips;
  if (meal) message.meal = meal;
  return message;
}

function statusMessage() {
  return { id: nextId(), role: "status", text: STATUS_TEXT };
}

function spokenMessages(messages) {
  return messages.filter((message) => message.role === "user" || message.role === "assistant");
}

function withChipSelected(messages, label) {
  let marked = false;
  return [...messages].reverse().map((message) => {
    if (!marked && message.chips && !message.chipSelected) {
      marked = true;
      return { ...message, chipSelected: label };
    }
    return message;
  }).reverse();
}

export default function App() {
  const [view, setView] = useState("welcome");
  const [conversation, setConversation] = useState({
    phase: "ready",
    entry: null,
    messages: [],
  });
  const [draft, setDraft] = useState("");
  const conversationRef = useRef(conversation);
  const requestRef = useRef(0);
  conversationRef.current = conversation;

  function ask(entry, messages) {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const loading = {
      phase: "loading",
      entry,
      messages: [...messages, statusMessage()],
    };
    conversationRef.current = loading;
    setConversation(loading);
    requestReply({ entry, messages })
      .then((reply) => {
        if (requestRef.current !== requestId) return;
        const next = {
          phase: "ready",
          entry,
          messages: [...messages, assistantMessage(reply.text, reply.chips, reply.meal)],
        };
        conversationRef.current = next;
        setConversation(next);
      })
      .catch(() => {
        if (requestRef.current !== requestId) return;
        const next = {
          phase: "ready",
          entry,
          messages: [...messages, assistantMessage(ERROR_TEXT)],
        };
        conversationRef.current = next;
        setConversation(next);
      });
  }

  function openConversation(title) {
    setView("conversation");
    const current = conversationRef.current;
    if (current.entry === title && spokenMessages(current.messages).length > 0) return;
    ask(title, [userMessage(title)]);
  }

  function sendMessage(text) {
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

  function chooseChip(label) {
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

  return (
    <main className="screen">
      {view === "welcome" ? (
        <WelcomeScreen
          draft={draft}
          onDraftChange={setDraft}
          onSend={sendMessage}
          onChoose={openConversation}
        />
      ) : (
        <ConversationScreen
          messages={conversation.messages}
          phase={conversation.phase}
          draft={draft}
          onDraftChange={setDraft}
          onSend={sendMessage}
          onBack={() => setView("welcome")}
          onChip={chooseChip}
          onSomethingElse={changeMeal}
          onAccept={() => setConversation((current) => confirmMeal(current))}
          onToggleRecipe={(messageId) =>
            setConversation((current) => toggleRecipe(current, messageId))
          }
        />
      )}
    </main>
  );
}
