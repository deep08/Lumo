import iconChevronDown from "../assets/icon-chevron-down.svg";
import iconChevronUp from "../assets/icon-chevron-up.svg";
import iconDot from "../assets/icon-dot.svg";
import iconTime from "../assets/icon-time.svg";
import { RECOMMENDATIONS } from "../conversation/mock";

const MEAL_LABELS = {
  improvement: "Improvement",
  complete_meal: "Complete meal",
};

export default function RecommendationCard({
  cardKey,
  meal,
  recipeOpen,
  onToggleRecipe,
  onSomethingElse,
  onAccept,
  acceptDisabled,
}) {
  const fallback = cardKey ? RECOMMENDATIONS[cardKey] : null;
  const card = meal
    ? {
        eyebrow: MEAL_LABELS[meal.type] || fallback?.eyebrow,
        title: meal.title,
        time: meal.time,
        benefit: meal.benefit,
        recipes: meal.recipe
          ? [
              {
                chip: meal.title,
                need: meal.recipe.ingredients.join(", "),
                steps: meal.recipe.steps,
              },
            ]
          : [],
      }
    : fallback;
  if (!card) return null;

  return (
    <article className="rec-card">
      <div className="rec-body">
        <p className="rec-eyebrow">
          <img src={iconDot} alt="" />
          <span>{card.eyebrow}</span>
        </p>
        <h2 className="rec-title">{card.title}</h2>
        <p className="rec-time">
          <img src={iconTime} alt="" />
          <span>{card.time}</span>
        </p>
        <p className="rec-benefit">{card.benefit}</p>
        <div className="rec-divider" />
      </div>
      <button type="button" className="rec-toggle" onClick={onToggleRecipe}>
        <span>{recipeOpen ? "Hide recipe" : "View recipe"}</span>
        <img className="rec-chevron" src={recipeOpen ? iconChevronUp : iconChevronDown} alt="" />
      </button>
      {recipeOpen ? (
        <div className="recipe-list">
          {card.recipes.map((recipe) => (
            <section key={recipe.chip} className="recipe-card">
              <span className="ingredient-chip">{recipe.chip}</span>
              <h3>What you will need</h3>
              <p>{recipe.need}</p>
              <h3>How to make it</h3>
              <ol>
                {recipe.steps.map((step, index) => (
                  <li key={`${recipe.chip}-${index}`}>{step}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : null}
      <div className="rec-actions">
        <button type="button" className="rec-button rec-button--secondary" onClick={onSomethingElse}>
          Change meal
        </button>
        <button
          type="button"
          className="rec-button rec-button--primary"
          onClick={onAccept}
          disabled={acceptDisabled}
        >
          Send to cook
        </button>
      </div>
    </article>
  );
}
