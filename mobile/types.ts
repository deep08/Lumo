export const JOURNEYS = {
  healthier: "Make my meals healthier",
  ingredients: "Cook with my ingredients",
} as const;

export type JourneyTitle = (typeof JOURNEYS)[keyof typeof JOURNEYS];
export type EntryMode = JourneyTitle | null;
export type ConversationPhase = "ready" | "loading" | "confirmed";

export type MealRecipe = {
  ingredients: string[];
  steps: string[];
};

export type MealCard = {
  type: "improvement" | "complete_meal";
  title: string;
  time: string;
  benefit: string;
  recipe?: MealRecipe;
};

export const MAX_CHAT_IMAGES = 5;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "status";
  text: string;
  image?: string;
  images?: string[];
  chips?: string[];
  chipSelected?: string;
  meal?: MealCard;
  recipeOpen?: boolean;
};

export function messageImageUris(message: ChatMessage): string[] {
  if (message.images?.length) return message.images.slice(0, MAX_CHAT_IMAGES);
  return message.image ? [message.image] : [];
}

export type ConversationState = {
  phase: ConversationPhase;
  entry: EntryMode;
  messages: ChatMessage[];
};
