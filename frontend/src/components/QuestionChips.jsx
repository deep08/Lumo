export default function QuestionChips({ options, selected, disabled, onSelect }) {
  return (
    <div className="chips">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="chip"
          data-selected={selected === option ? "true" : "false"}
          disabled={disabled}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
