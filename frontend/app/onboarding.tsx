import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { saveProfile, PET_NAME } from "../src/lib/pet";
import {
  requestNotificationPermissions,
  scheduleDailyCheckIns,
} from "../src/lib/notifications";

const NEUTRAL_IMG =
  "https://static.prod-images.emergentagent.com/jobs/4cbb8c95-cc7d-4c23-bde9-366f16efbc08/images/8292be1fcb1728737ac4c08636632b6f9f11e7521e49bb3fe1b60ee8781489fd.png";

const HOBBY_OPTIONS = [
  { id: "draw", label: "Dibujar", icon: "color-palette" as const },
  { id: "read", label: "Leer", icon: "book" as const },
  { id: "music", label: "Música", icon: "musical-notes" as const },
  { id: "sport", label: "Deportes", icon: "football" as const },
  { id: "games", label: "Videojuegos", icon: "game-controller" as const },
  { id: "cook", label: "Cocinar", icon: "restaurant" as const },
  { id: "nature", label: "Naturaleza", icon: "leaf" as const },
  { id: "movies", label: "Películas", icon: "film" as const },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);

  const toggleHobby = (id: string) => {
    setHobbies((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
    );
  };

  const next = () => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert("Falta tu nombre", "Cuéntale a Lumi cómo te llamas ♡");
        return;
      }
    }
    if (step === 2) {
      const a = parseInt(age, 10);
      if (!a || a < 3 || a > 99) {
        Alert.alert("Edad", "Ingresa una edad válida (3-99).");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const finish = async () => {
    const a = parseInt(age, 10);
    const labels = hobbies.map(
      (id) => HOBBY_OPTIONS.find((h) => h.id === id)?.label ?? id,
    );
    await saveProfile({
      name: name.trim(),
      age: a,
      hobbies: labels,
      createdAt: new Date().toISOString(),
    });
    const granted = await requestNotificationPermissions();
    if (granted) {
      await scheduleDailyCheckIns(name.trim());
    }
    router.replace("/home");
  };

  return (
    <LinearGradient
      colors={["#FEF3C7", "#FDFBF7"]}
      style={styles.bg}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.characterWrap}>
            <Image
              source={NEUTRAL_IMG}
              style={styles.character}
              contentFit="contain"
              transition={400}
            />
          </View>

          {step === 0 && (
            <View style={styles.card} testID="onboarding-welcome">
              <Text style={styles.bubble}>blup… tika moa! ✨</Text>
              <Text style={styles.h1}>Hola, soy {PET_NAME}</Text>
              <Text style={styles.body}>
                Vengo de un lugar muy lejano y aún no sé hablar tu idioma.
                ¿Me ayudas a aprender? Mientras más me hables, más palabras
                aprenderé contigo.
              </Text>
              <PrimaryButton
                label="Quiero conocerte"
                onPress={next}
                testID="btn-start"
              />
            </View>
          )}

          {step === 1 && (
            <View style={styles.card} testID="onboarding-name">
              <Text style={styles.bubble}>nuni? ¿tu… nombre?</Text>
              <Text style={styles.h1}>¿Cómo te llamas?</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                testID="input-name"
                autoFocus
                returnKeyType="next"
                onSubmitEditing={next}
              />
              <PrimaryButton
                label="Continuar"
                onPress={next}
                testID="btn-name-next"
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.card} testID="onboarding-age">
              <Text style={styles.bubble}>¿edad… edad?</Text>
              <Text style={styles.h1}>¿Cuántos años tienes, {name}?</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                placeholder="Edad"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                style={styles.input}
                testID="input-age"
                maxLength={2}
                returnKeyType="next"
                onSubmitEditing={next}
              />
              <PrimaryButton
                label="Continuar"
                onPress={next}
                testID="btn-age-next"
              />
            </View>
          )}

          {step === 3 && (
            <View style={styles.card} testID="onboarding-hobbies">
              <Text style={styles.bubble}>¿qué… te gusta?</Text>
              <Text style={styles.h1}>¿Qué te gusta hacer?</Text>
              <Text style={styles.body}>Elige los que quieras</Text>
              <View style={styles.hobbiesGrid}>
                {HOBBY_OPTIONS.map((h) => {
                  const selected = hobbies.includes(h.id);
                  return (
                    <TouchableOpacity
                      key={h.id}
                      onPress={() => toggleHobby(h.id)}
                      style={[
                        styles.hobbyPill,
                        selected && styles.hobbyPillSelected,
                      ]}
                      testID={`hobby-${h.id}`}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={h.icon}
                        size={18}
                        color={selected ? "#FFF" : "#1F2937"}
                      />
                      <Text
                        style={[
                          styles.hobbyText,
                          selected && styles.hobbyTextSelected,
                        ]}
                      >
                        {h.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <PrimaryButton
                label="¡Empezar aventura!"
                onPress={finish}
                testID="btn-finish-onboarding"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function PrimaryButton({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.primaryBtn}
      activeOpacity={0.85}
      testID={testID}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  characterWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  character: {
    width: 200,
    height: 200,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#00000010",
  },
  bubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    color: "#1F2937",
    fontWeight: "700",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  h1: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 18,
    fontWeight: "600",
  },
  input: {
    borderWidth: 2,
    borderColor: "#FF7A59",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: "#1F2937",
    fontWeight: "700",
    backgroundColor: "#FDFBF7",
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#FF7A59",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#E06548",
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 0,
    elevation: 2,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  hobbiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  hobbyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FDFBF7",
    borderWidth: 2,
    borderColor: "#00000015",
  },
  hobbyPillSelected: {
    backgroundColor: "#34D399",
    borderColor: "#059669",
  },
  hobbyText: {
    color: "#1F2937",
    fontWeight: "700",
    fontSize: 14,
  },
  hobbyTextSelected: {
    color: "#FFF",
  },
});
