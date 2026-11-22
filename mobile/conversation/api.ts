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

const VISION_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_LOCAL_IMAGE_BYTES = 8 * 1024 * 1024;

type PayloadImage = {
  media_type: string;
  data: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x2000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function mediaTypeFromBytes(bytes: Uint8Array, headerType: string | null) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  const fallback = (headerType ?? "").split(";")[0].trim().toLowerCase();
  if (fallback === "image/jpg") return "image/jpeg";
  return VISION_MEDIA_TYPES.has(fallback) ? fallback : null;
}

async function encodeImage(uri: string): Promise<PayloadImage> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("image read failed");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length || bytes.byteLength > MAX_LOCAL_IMAGE_BYTES) throw new Error("image too large");
  const mediaType = mediaTypeFromBytes(bytes, response.headers.get("content-type"));
  if (!mediaType) throw new Error("unsupported image");
  return { media_type: mediaType, data: bytesToBase64(bytes) };
}

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
  const spoken = messages.filter((message) => message.role === "user" || message.role === "assistant");
  const lastUserIndex = spoken.reduce(
    (found, message, index) => (message.role === "user" ? index : found),
    -1,
  );
  const payload = [];
  for (let index = 0; index < spoken.length; index += 1) {
    const message = spoken[index];
    const text =
      message.role === "assistant" && message.meal
        ? `${message.text}\nRecommendation: ${message.meal.title}. ${message.meal.time}. ${message.meal.benefit}`
        : message.text;
    const includeImage = message.role === "user" && Boolean(message.image) && index === lastUserIndex;
    if (message.role === "user" && !text.trim() && !includeImage) continue;
    if (message.role !== "user" && message.role !== "assistant") continue;
    const item: {
      role: "user" | "assistant";
      content: string;
      image?: PayloadImage;
    } = {
      role: message.role,
      content: text,
    };
    if (includeImage && message.image) {
      item.image = await encodeImage(message.image);
    }
    payload.push(item);
  }
  const response = await fetch(`${apiBaseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entry,
      messages: payload,
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
