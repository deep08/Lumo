function recipeFrom(card) {
  const recipe = card.recipe;
  if (!recipe || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) return null;
  const ingredients = recipe.ingredients
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim())
    .slice(0, 8);
  const steps = recipe.steps
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim())
    .slice(0, 5);
  if (!ingredients.length || steps.length < 3) return null;
  return { ingredients, steps };
}

export async function requestReply({ entry, messages }) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entry,
      messages: messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({
          role: message.role,
          content: message.meal
            ? `${message.text}\nRecommendation: ${message.meal.title}. ${message.meal.time}. ${message.meal.benefit}`
            : message.text,
        })),
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data.text !== "string" || !data.text.trim()) {
    throw new Error("chat failed");
  }
  const chips = Array.isArray(data.chips)
    ? data.chips
        .filter((chip) => typeof chip === "string" && chip.trim())
        .map((chip) => chip.trim())
        .slice(0, 4)
    : [];
  const card = data.meal_card;
  const recipe = card ? recipeFrom(card) : null;
  const meal =
    card &&
    (card.type === "improvement" || card.type === "complete_meal") &&
    typeof card.title === "string" &&
    card.title.trim() &&
    typeof card.time === "string" &&
    card.time.trim() &&
    typeof card.benefit === "string" &&
    card.benefit.trim()
      ? {
          type: card.type,
          title: card.title.trim(),
          time: card.time.trim(),
          benefit: card.benefit.trim(),
          ...(recipe ? { recipe } : {}),
        }
      : null;
  return { text: data.text.trim(), chips, meal };
}
