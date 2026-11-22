import { useEffect, useRef, useState } from "react";
import iconBack from "../assets/icon-back.svg";
import iconMore from "../assets/icon-more.svg";
import ChatMenu from "../components/ChatMenu";
import Composer from "../components/Composer";
import Loader from "../components/Loader";
import QuestionChips from "../components/QuestionChips";
import RecommendationCard from "../components/RecommendationCard";

const seenAiIds = new Set();

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const CHAR_INTERVAL_MS = 25;

function RevealedAiText({ id, text, onTick, onDone }) {
  const replay = seenAiIds.has(id) || prefersReducedMotion();
  const [shown, setShown] = useState(replay ? text : "");
  const [cursor, setCursor] = useState(!replay);

  useEffect(() => {
    if (replay) {
      seenAiIds.add(id);
      onDone();
      return undefined;
    }
    seenAiIds.add(id);
    let index = 0;
    let timer = 0;
    function step() {
      index += 1;
      setShown(text.slice(0, index));
      onTick();
      if (index < text.length) {
        timer = window.setTimeout(step, CHAR_INTERVAL_MS);
        return;
      }
      setShown(text);
      setCursor(false);
      onDone();
    }
    timer = window.setTimeout(step, CHAR_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [id, text]);

  return (
    <p className="ai-text">
      {shown}
      {cursor ? <span className="ai-cursor" aria-hidden="true" /> : null}
    </p>
  );
}

function AssistantTurn({
  message,
  latestChipId,
  phase,
  onChip,
  onSomethingElse,
  onAccept,
  onToggleRecipe,
  onTick,
}) {
  const [ready, setReady] = useState(seenAiIds.has(message.id));

  return (
    <div className="ai-turn">
      <RevealedAiText
        id={message.id}
        text={message.text}
        onTick={onTick}
        onDone={() => {
          setReady(true);
          onTick();
        }}
      />
      {ready && message.chips ? (
        <QuestionChips
          options={message.chips}
          selected={message.chipSelected}
          disabled={
            phase === "loading" || Boolean(message.chipSelected) || message.id !== latestChipId
          }
          onSelect={onChip}
        />
      ) : null}
      {ready && (message.card || message.meal) ? (
        <RecommendationCard
          cardKey={message.card}
          meal={message.meal}
          recipeOpen={Boolean(message.recipeOpen)}
          onToggleRecipe={() => onToggleRecipe(message.id)}
          onSomethingElse={onSomethingElse}
          onAccept={onAccept}
          acceptDisabled={phase === "confirmed"}
        />
      ) : null}
    </div>
  );
}

export default function ConversationScreen({
  messages,
  phase,
  draft,
  onDraftChange,
  onSend,
  onBack,
  onChip,
  onSomethingElse,
  onAccept,
  onToggleRecipe,
}) {
  const endRef = useRef(null);
  const threadRef = useRef(null);
  const stickToEnd = useRef(true);

  function scrollToLatest() {
    if (!stickToEnd.current) return;
    endRef.current?.scrollIntoView({ block: "end" });
  }

  useEffect(() => {
    scrollToLatest();
  }, [messages, phase]);

  const latestChipId = [...messages].reverse().find((message) => message.chips)?.id;

  return (
    <>
      <header className="chat-header">
        <button type="button" className="header-button" onClick={onBack} aria-label="Back">
          <img src={iconBack} alt="" />
        </button>
        <div className="header-more">
          <button type="button" className="header-button" aria-label="More" aria-haspopup="menu">
            <img src={iconMore} alt="" />
          </button>
          <ChatMenu />
        </div>
      </header>
      <div
        className="thread"
        ref={threadRef}
        onScroll={() => {
          const thread = threadRef.current;
          if (!thread) return;
          stickToEnd.current = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 48;
        }}
      >
        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <div key={message.id} className="turn-user">
                <p className="user-bubble">{message.text}</p>
              </div>
            );
          }
          if (message.role === "status") {
            return (
              <p key={message.id} className="status" role="status">
                <Loader />
                {message.text}
              </p>
            );
          }
          return (
            <AssistantTurn
              key={message.id}
              message={message}
              latestChipId={latestChipId}
              phase={phase}
              onChip={onChip}
              onSomethingElse={onSomethingElse}
              onAccept={onAccept}
              onToggleRecipe={onToggleRecipe}
              onTick={scrollToLatest}
            />
          );
        })}
        <div ref={endRef} />
      </div>
      <Composer
        tray
        value={draft}
        onChange={onDraftChange}
        onSubmit={onSend}
        disabled={phase === "loading"}
      />
    </>
  );
}
