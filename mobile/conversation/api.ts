import { NativeModules } from "react-native";
import { ChatMessage, EntryMode, MealCard, MealRecipe } from "../types";

const API_PORT = 5001;
const ERROR_TEXT = "I couldn’t reach Lumo just now. Send that again.";

type SourceCodeModule = {
  scriptURL?: string;
  getConstants?: () => { scriptURL?: string };
};

type ChatReply = {
  text: string;
  chips: string[];
  meal: MealCard | null;
};

function metroHostname(): string | null {
  const source = NativeModules.SourceCode as SourceCodeModule | undefined;
  const scriptURL = source?.scriptURL ?? source?.getConstants?.()?.scriptURL;
  if (!scriptURL) return null;
  try {
    const { hostname } = new URL(scriptURL);
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return hostname;
    }
  } catch {
    return null;
  }
  return null;
}

export function apiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const host = metroHostname();
  if (host) return `http://${host}:${API_PORT}`;
  return `http://127.0.0.1:${API_PORT}`;
}

export { ERROR_TEXT };

function coerceTextList(raw: unknown, limit: number): string[] {
  const chunks: string[] = [];
  if (typeof raw === "string") {
    const lines = raw
      .split(/[\n;]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (lines.length === 1 && lines[0].includes(",")) {
      chunks.push(...lines[0].split(",").map((part) => part.trim()).filter(Boolean));
    } else {
      chunks.push(...lines);
    }
  } else if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string" && item.trim()) chunks.push(item.trim());
    }
  }
  return chunks
    .slice(0, limit)
    .map((item) => item.replace(/^\d+[\.)]\s*/, "").trim())
    .filter(Boolean);
}

function recipeFrom(card: {
  recipe?: { ingredients?: unknown; steps?: unknown };
}): MealRecipe | null {
  const recipe = card.recipe;
  if (!recipe) return null;
  const ingredients = coerceTextList(recipe.ingredients, 8);
  const steps = coerceTextList(recipe.steps, 5);
  if (!ingredients.length || !steps.length) return null;
  return { ingredients, steps };
}

export async function requestReply({
  entry,
  messages,
}: {
  entry: EntryMode;
  messages: ChatMessage[];
}): Promise<ChatReply> {
  const response = await fetch(`${apiBaseUrl()}/api/chat`, {
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
  const data = (await response.json().catch(() => null)) as {
    text?: unknown;
    chips?: unknown;
    meal_card?: {
      type?: unknown;
      title?: unknown;
      time?: unknown;
      benefit?: unknown;
      recipe?: { ingredients?: unknown; steps?: unknown };
    } | null;
  } | null;
  if (!response.ok || !data || typeof data.text !== "string" || !data.text.trim()) {
    throw new Error("chat failed");
  }
  const chips = Array.isArray(data.chips)
    ? data.chips
        .filter((chip): chip is string => typeof chip === "string" && Boolean(chip.trim()))
        .map((chip) => chip.trim())
        .slice(0, 4)
    : [];
  const card = data.meal_card;
  const mealType = card?.type;
  const recipe = card ? recipeFrom(card) : null;
  const meal: MealCard | null =
    card &&
    (mealType === "improvement" || mealType === "complete_meal") &&
    typeof card.title === "string" &&
    card.title.trim() &&
    typeof card.time === "string" &&
    card.time.trim() &&
    typeof card.benefit === "string" &&
    card.benefit.trim()
      ? {
          type: mealType,
          title: card.title.trim(),
          time: card.time.trim(),
          benefit: card.benefit.trim(),
          ...(recipe ? { recipe } : {}),
        }
      : null;
  return { text: data.text.trim(), chips, meal };
}
