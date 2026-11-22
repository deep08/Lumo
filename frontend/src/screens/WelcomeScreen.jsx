import Composer from "../components/Composer";
import EntryCard from "../components/EntryCard";
import mascot from "../assets/mascot.svg";

const entries = [
  {
    id: "healthier",
    art: "warm",
    title: "Make my meals healthier",
    detail: "Get simple ways to improve what you already eat.",
  },
  {
    id: "ingredients",
    art: "fresh",
    title: "Cook with my ingredients",
    detail: "Find quick, healthier meals using what you have.",
  },
];

export default function WelcomeScreen({ draft, onDraftChange, onSend, onChoose }) {
  return (
    <>
      <div className="stage">
        <div className="stage-inner">
          <section className="intro">
            <div className="mascot">
              <div className="mascot-frame">
                <img src={mascot} alt="" />
              </div>
            </div>
            <div className="intro-copy">
              <h1 className="intro-title">Hi, I’m Lumo!</h1>
              <p className="intro-support">What would you like help with?</p>
            </div>
          </section>
          <div className="entry-row">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                art={entry.art}
                title={entry.title}
                detail={entry.detail}
                onClick={() => onChoose(entry.title)}
              />
            ))}
          </div>
        </div>
      </div>
      <Composer value={draft} onChange={onDraftChange} onSubmit={onSend} />
    </>
  );
}
