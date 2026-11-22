import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const ORANGE = "#ff841b";
const PEACH = "#fcc399";
const AMBER = "#ef934e";

const FRAMES = [
  [ORANGE, PEACH, AMBER],
  [PEACH, ORANGE, AMBER],
  [PEACH, AMBER, ORANGE],
] as const;

const EASE = Easing.bezier(0.42, 0, 0.58, 1);

export default function Loader() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(50),
        Animated.timing(progress, {
          toValue: 1,
          duration: 300,
          easing: EASE,
          useNativeDriver: false,
        }),
        Animated.delay(50),
        Animated.timing(progress, {
          toValue: 2,
          duration: 300,
          easing: EASE,
          useNativeDriver: false,
        }),
        Animated.delay(50),
        Animated.timing(progress, {
          toValue: 3,
          duration: 50,
          easing: EASE,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
      progress.stopAnimation();
    };
  }, [progress]);

  return (
    <View style={styles.row} accessibilityElementsHidden>
      {FRAMES[0].map((_, index) => (
        <View key={index} style={styles.cell}>
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: progress.interpolate({
                  inputRange: [0, 1, 2, 3],
                  outputRange: [
                    FRAMES[0][index],
                    FRAMES[1][index],
                    FRAMES[2][index],
                    FRAMES[0][index],
                  ],
                }),
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: 24,
    height: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  cell: {
    width: 8,
    height: 8,
    padding: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
