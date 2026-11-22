import { useLayoutEffect, useRef, useState } from "react";
import iconAdd from "../assets/icon-add.svg";
import iconCamera from "../assets/icon-camera.svg";
import iconGallery from "../assets/icon-gallery.svg";
import iconSend from "../assets/icon-send.svg";
import iconSendDisabled from "../assets/icon-send-disabled.svg";
import ChatMenu from "./ChatMenu";

const addItems = [
  { label: "Take a photo", icon: iconCamera },
  { label: "Choose from gallery", icon: iconGallery },
];

const LINE_HEIGHT = 20;
const MAX_LINES = 4;

function textNeedsAnotherLine(text, font, width) {
  if (!text || width <= 0) return false;
  if (text.includes("\n")) return true;
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return false;
  context.font = font;
  return context.measureText(text).width > width;
}

export default function Composer({ value, onChange, onSubmit, disabled = false, tray = false }) {
  const fieldRef = useRef(null);
  const singleLineWidth = useRef(0);
  const [expanded, setExpanded] = useState(false);
  const canSend = value.trim().length > 0 && !disabled;

  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    if (!expanded) singleLineWidth.current = field.clientWidth;

    const style = getComputedStyle(field);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const needsRoom =
      textNeedsAnotherLine(value, font, singleLineWidth.current) ||
      (!expanded && field.scrollHeight > LINE_HEIGHT + 1);
    if (needsRoom !== expanded) setExpanded(needsRoom);

    const maxHeight = LINE_HEIGHT * MAX_LINES;
    field.style.height = "auto";
    const contentHeight = field.scrollHeight;
    field.style.height = `${Math.min(Math.max(contentHeight, LINE_HEIGHT), maxHeight)}px`;
    field.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
  }, [value, expanded]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSend) return;
    onSubmit(value);
  }

  function handleKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!canSend) return;
    onSubmit(value);
  }

  return (
    <form
      className={tray ? "composer-bar composer-bar--thread" : "composer-bar"}
      onSubmit={handleSubmit}
    >
      <div className={expanded ? "composer composer--expanded" : "composer"}>
        <div className="composer-add-wrap">
          <button type="button" className="composer-add" aria-label="Add" aria-haspopup="menu">
            <img src={iconAdd} alt="" />
          </button>
          <ChatMenu items={addItems} />
        </div>
        <textarea
          ref={fieldRef}
          className="composer-input"
          value={value}
          rows={1}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tell Lumo about your meal…"
          aria-label="Tell Lumo about your meal"
          enterKeyHint="send"
        />
        <button
          className="composer-send"
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
        >
          <img src={canSend ? iconSend : iconSendDisabled} alt="" />
        </button>
      </div>
    </form>
  );
}
