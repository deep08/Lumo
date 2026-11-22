const FOOD_WORDS = [
  "palak",
  "paneer",
  "aloo",
  "onion",
  "pyaaz",
  "pyaz",
  "lauki",
  "spinach",
  "cucumber",
  "chapati",
  "roti",
  "rice",
  "dal",
  "tomato",
  "tamatar",
  "potato",
  "salad",
  "gajar",
  "carrot",
];

const MEAL_TIMES = ["Breakfast", "Lunch", "Dinner"];

export const INGREDIENT_PROMPT =
  "Tell me the ingredients that you have in your fridge or kitchen so that we can start with the recipe.";

export const INGREDIENT_FALLBACK =
  "I didn’t understand that. Tell me the ingredients you have, such as palak, paneer, or onion.";

export const MEAL_TIME_FALLBACK = "Choose Breakfast, Lunch, or Dinner.";

export const LATER_FALLBACK =
  "Tap Change meal or Send to cook. You can also type “looks good”.";

export const CONFIRMATION = "Sounds good. This meal is set.";

export const RECOMMENDATIONS = {
  complete: {
    eyebrow: "Complete meal",
    title: "Palak paneer with chapati & cucumber salad",
    time: "30-40 mins",
    benefit: "Spinach is rich in iron that can help boost haemoglobin.",
    recipes: [
      {
        chip: "Palak Paneer",
        need: "Palak, oil and salt (if available)",
        steps: [
          "Wash and chop the palak.",
          "Heat a little oil in a pan.",
          "Add palak and cook until wilted.",
          "Season and serve with your usual meal.",
        ],
      },
      {
        chip: "Salad",
        need: "Cucumber, black pepper (optional)",
        steps: ["Cut cucumber into pieces.", "Add in a bowl and sprinkle black pepper."],
      },
    ],
  },
  quick: {
    eyebrow: "Quick meal",
    title: "Paneer roll",
    time: "5-10 mins",
    benefit: "Paneer is rich in protein, helps in body repair.",
    recipes: [
      {
        chip: "Paneer roll",
        need: "Palak, oil and salt (if available)",
        steps: [
          "Wash and chop the palak.",
          "Heat a little oil in a pan.",
          "Add palak and cook until wilted.",
          "Season and serve with your usual meal.",
        ],
      },
    ],
  },
};

let sequence = 0;

function nextId() {
  sequence += 1;
  return `m${sequence}`;
}

function userMessage(text) {
  return { id: nextId(), role: "user", text };
}

function assistantMessage(text, extra = {}) {
  return { id: nextId(), role: "assistant", text, ...extra };
}

export function initialConversation() {
  return {
    phase: "welcome",
    messages: [],
  };
}

export function beginFromCard(state, title) {
  if (state.messages.length > 0) return state;
  return {
    phase: "awaitingIngredients",
    messages: [userMessage(title), assistantMessage(INGREDIENT_PROMPT)],
  };
}

function looksLikeIngredients(text) {
  const value = text.toLowerCase();
  return FOOD_WORDS.some((word) => value.includes(word));
}

function matchMealTime(text) {
  const value = text.toLowerCase();
  return MEAL_TIMES.find((meal) => value.includes(meal.toLowerCase())) ?? null;
}

function isSomethingElse(text) {
  return text.toLowerCase().includes("something else");
}

function isAccept(text) {
  const value = text.toLowerCase();
  return value.includes("looks good") || value.includes("send to cook");
}

function recommend(state, spokenText, mealTime) {
  const messages = state.messages.map((message) =>
    message.chips ? { ...message, chipSelected: mealTime } : message,
  );
  return {
    phase: "recommending",
    messages: [
      ...messages,
      userMessage(spokenText),
      assistantMessage(`You can have this for ${mealTime.toLowerCase()}`, {
        card: "complete",
        recipeOpen: false,
      }),
    ],
  };
}

export function finishLoading(state) {
  if (state.phase !== "loading") return state;
  const messages = state.messages.filter((message) => message.role !== "status");
  if (messages.some((message) => message.chips)) {
    return { phase: "awaitingMealTime", messages };
  }
  return {
    phase: "awaitingMealTime",
    messages: [
      ...messages,
      assistantMessage("When is this for?", { chips: MEAL_TIMES }),
    ],
  };
}

export function selectChip(state, label) {
  if (state.phase !== "awaitingMealTime") return state;
  const mealTime = matchMealTime(label);
  if (!mealTime) return state;
  return recommend(state, mealTime, mealTime);
}

function swapCard(messages) {
  let swapped = false;
  const next = [...messages].reverse().map((message) => {
    if (!swapped && message.card) {
      swapped = true;
      return {
        ...message,
        card: message.card === "complete" ? "quick" : "complete",
        recipeOpen: false,
      };
    }
    return message;
  });
  return next.reverse();
}

export function showAlternative(state) {
  if (state.phase !== "recommending" && state.phase !== "confirmed") return state;
  return { ...state, messages: swapCard(state.messages) };
}

export function confirmMeal(state) {
  if (state.phase !== "recommending") return state;
  return {
    phase: "confirmed",
    messages: [...state.messages, assistantMessage(CONFIRMATION)],
  };
}

export function toggleRecipe(state, messageId) {
  return {
    ...state,
    messages: state.messages.map((message) =>
      message.id === messageId ? { ...message, recipeOpen: !message.recipeOpen } : message,
    ),
  };
}

export function submitText(state, rawText) {
  const text = rawText.trim();
  if (!text || state.phase === "loading") return state;

  if (state.phase === "welcome" || state.phase === "awaitingIngredients") {
    if (!looksLikeIngredients(text)) {
      return {
        phase: "awaitingIngredients",
        messages: [
          ...state.messages,
          userMessage(text),
          assistantMessage(INGREDIENT_FALLBACK),
        ],
      };
    }
    return {
      phase: "loading",
      messages: [
        ...state.messages,
        userMessage(text),
        { id: nextId(), role: "status", text: "Updating the change" },
      ],
    };
  }

  if (state.phase === "awaitingMealTime") {
    const mealTime = matchMealTime(text);
    if (!mealTime) {
      return {
        ...state,
        messages: [...state.messages, userMessage(text), assistantMessage(MEAL_TIME_FALLBACK)],
      };
    }
    return recommend(state, text, mealTime);
  }

  const withUser = { ...state, messages: [...state.messages, userMessage(text)] };
  if (isSomethingElse(text)) return showAlternative(withUser);
  if (isAccept(text) && state.phase === "recommending") return confirmMeal(withUser);
  return {
    ...withUser,
    messages: [...withUser.messages, assistantMessage(LATER_FALLBACK)],
  };
}
