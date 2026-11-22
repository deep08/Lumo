import iconHistory from "../assets/icon-history.svg";
import iconNewChat from "../assets/icon-new-chat.svg";

const moreItems = [
  { label: "New chat", icon: iconNewChat },
  { label: "History", icon: iconHistory },
];

export default function ChatMenu({ items = moreItems }) {
  return (
    <div className="chat-menu" role="menu">
      {items.map((item) => (
        <button type="button" className="chat-menu-item" role="menuitem" key={item.label}>
          <img src={item.icon} alt="" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
