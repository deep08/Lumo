import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space } from "../theme";
import { MealCard } from "../types";

const MEAL_LABELS = {
  improvement: "Quick meal",
  complete_meal: "Complete meal",
} as const;

type RecommendationCardProps = {
  meal: MealCard;
  recipeOpen: boolean;
  onToggleRecipe: () => void;
  onChangeMeal: () => void;
};

function shareMessageFor(meal: MealCard) {
  const name = meal.title.trim().replace(/\.+$/, "");
  return `Please make ${name || "this meal"}.`;
}

async function shareMeal(meal: MealCard) {
  try {
    await Share.share({ message: shareMessageFor(meal) });
  } catch {
    return;
  }
}

function EyebrowDot() {
  return (
    <View style={styles.dotSlot}>
      <View style={styles.dot} />
    </View>
  );
}

function TimeIcon() {
  return (
    <View style={styles.clock}>
      <View style={styles.clockFace}>
        <View style={styles.clockHour} />
        <View style={styles.clockMinute} />
      </View>
    </View>
  );
}

function Chevron({ up }: { up: boolean }) {
  return (
    <View style={styles.chevronHit}>
      <View style={[styles.chevron, up && styles.chevronUp]} />
    </View>
  );
}

export default function RecommendationCard({
  meal,
  recipeOpen,
  onToggleRecipe,
  onChangeMeal,
}: RecommendationCardProps) {
  const recipe = meal.recipe;
  const hasRecipe = Boolean(recipe?.ingredients.length && recipe?.steps.length);
  const recipes =
    recipe && hasRecipe
      ? [{ chip: meal.title, need: recipe.ingredients.join(", "), steps: recipe.steps }]
      : [];

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.body}>
          <View style={styles.eyebrow}>
            <EyebrowDot />
            <Text style={styles.eyebrowLabel}>{MEAL_LABELS[meal.type]}</Text>
          </View>
          <Text style={styles.title}>{meal.title}</Text>
          <View style={styles.timeRow}>
            <TimeIcon />
            <Text style={styles.time}>{meal.time}</Text>
          </View>
          <Text style={styles.benefit}>{meal.benefit}</Text>
          <View style={styles.divider} />
        </View>
        {hasRecipe ? (
          <View style={recipeOpen ? styles.recipeBlock : null}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={recipeOpen ? "Hide recipe" : "View recipe"}
              onPress={onToggleRecipe}
              style={styles.toggle}
            >
              <Text style={styles.toggleLabel}>{recipeOpen ? "Hide recipe" : "View recipe"}</Text>
              <Chevron up={recipeOpen} />
            </Pressable>
            {recipeOpen ? (
              <View style={styles.recipeList}>
                {recipes.map((recipe) => (
                  <View key={recipe.chip} style={styles.recipeCard}>
                    <View style={styles.ingredientChip}>
                      <Text style={styles.ingredientChipLabel}>{recipe.chip}</Text>
                    </View>
                    <View style={styles.recipeSection}>
                      <Text style={styles.recipeHeading}>What you will need</Text>
                      <Text style={styles.recipeBody}>{recipe.need}</Text>
                    </View>
                    <View style={styles.recipeSection}>
                      <Text style={styles.recipeHeading}>How to make it</Text>
                      <View style={styles.steps}>
                        {recipe.steps.map((step, index) => (
                          <View key={`${recipe.chip}-${index}`} style={styles.stepRow}>
                            <Text style={[styles.recipeBody, styles.stepIndex]}>{index + 1}.</Text>
                            <Text style={[styles.recipeBody, styles.stepText]}>{step}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change meal"
          onPress={onChangeMeal}
          style={({ pressed }) => [styles.button, styles.buttonSecondary, pressed && styles.buttonSecondaryPressed]}
        >
          <Text style={styles.buttonSecondaryLabel}>Change meal</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share"
          onPress={() => {
            void shareMeal(meal);
          }}
          style={({ pressed }) => [styles.button, styles.buttonPrimary, pressed && styles.buttonPrimaryPressed]}
        >
          <Text style={styles.buttonPrimaryLabel}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 304,
    maxWidth: "100%",
    paddingVertical: space[12],
    gap: space[12],
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceBase,
  },
  top: {
    gap: space[4],
  },
  body: {
    gap: space[12],
    paddingHorizontal: space[16],
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space[4],
  },
  dotSlot: {
    width: 8,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.contentOnBrand,
  },
  eyebrowLabel: {
    color: colors.contentOnBrand,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  title: {
    color: colors.contentPrimary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space[4],
  },
  clock: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  clockFace: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.2,
    borderColor: colors.contentPrimary,
  },
  clockHour: {
    position: "absolute",
    top: 2,
    left: 5.9,
    width: 1.2,
    height: 5,
    borderRadius: 1,
    backgroundColor: colors.contentPrimary,
  },
  clockMinute: {
    position: "absolute",
    top: 6,
    left: 6.4,
    width: 4,
    height: 1.2,
    borderRadius: 1,
    backgroundColor: colors.contentPrimary,
  },
  time: {
    color: colors.contentPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  benefit: {
    color: colors.contentSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    borderRadius: 2,
    backgroundColor: colors.borderDivider,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    paddingVertical: 4,
    paddingHorizontal: space[16],
  },
  toggleLabel: {
    flex: 1,
    color: colors.contentPrimary,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  chevronHit: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  chevron: {
    width: 10,
    height: 10,
    marginTop: -3,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.contentSecondary,
    transform: [{ rotate: "45deg" }],
  },
  chevronUp: {
    marginTop: 3,
    transform: [{ rotate: "-135deg" }],
  },
  recipeBlock: {
    gap: space[8],
  },
  recipeList: {
    gap: space[8],
    paddingHorizontal: space[16],
  },
  recipeCard: {
    gap: space[8],
    width: "100%",
    padding: space[12],
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRecipe,
  },
  ingredientChip: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: space[8],
    borderRadius: radius.md,
    backgroundColor: colors.buttonDisabled,
  },
  ingredientChipLabel: {
    color: colors.contentTertiary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  recipeSection: {
    gap: space[4],
  },
  recipeHeading: {
    color: colors.contentPrimary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  recipeBody: {
    color: colors.contentTertiary,
    fontSize: 14,
    lineHeight: 20,
  },
  steps: {
    gap: space[8],
    paddingLeft: 21,
  },
  stepIndex: {
    marginLeft: -21,
    width: 21,
  },
  stepRow: {
    flexDirection: "row",
    gap: space[8],
  },
  stepText: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[12],
    paddingHorizontal: space[12],
  },
  button: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: space[12],
    paddingHorizontal: space[16],
    borderRadius: radius.md,
  },
  buttonSecondary: {
    minHeight: 50,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderButton,
    backgroundColor: "transparent",
    shadowColor: "#e9e3d6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  buttonSecondaryPressed: {
    backgroundColor: colors.buttonDisabled,
  },
  buttonSecondaryLabel: {
    color: colors.contentPrimary,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
  },
  buttonPrimary: {
    minHeight: 48,
    borderWidth: 0,
    backgroundColor: colors.buttonPrimary,
    shadowColor: "#d9770c",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  buttonPrimaryPressed: {
    backgroundColor: colors.buttonPressed,
  },
  buttonPrimaryLabel: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
  },
});
