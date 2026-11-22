import entryArt from "../assets/entry-art.png";

export default function EntryCard({ art, title, detail, onClick }) {
  return (
    <button
      type="button"
      className={`entry-card entry-card--${art}`}
      onClick={onClick}
    >
      <span className="entry-card-body">
        <span className={`entry-art entry-art--${art === "warm" ? "meal" : "ingredients"}`}>
          <img src={entryArt} alt="" />
        </span>
        <span className="entry-copy">
          <span className="entry-title">{title}</span>
          <span className="entry-detail">{detail}</span>
        </span>
      </span>
    </button>
  );
}
