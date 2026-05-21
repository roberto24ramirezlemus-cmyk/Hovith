import { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { loadProfile } from "../src/lib/pet";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const profile = await loadProfile();
      // Tiny delay to avoid flash
      setTimeout(() => {
        if (profile) router.replace("/home");
        else router.replace("/onboarding");
      }, 250);
    })();
  }, [router]);

  return (
    <View style={styles.container} testID="splash-screen">
      <ActivityIndicator size="large" color="#FF7A59" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF7",
    alignItems: "center",
    justifyContent: "center",
  },
});
