import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  loadMemory,
  loadProfile,
  saveMemory,
  learnFromUserText,
  generatePetReply,
  vocabularySize,
  fluency,
  moodFromReply,
  PET_NAME,
  type PetMemory,
  type UserProfile,
} from "../src/lib/pet";

const IMG_NEUTRAL =
  "https://static.prod-images.emergentagent.com/jobs/4cbb8c95-cc7d-4c23-bde9-366f16efbc08/images/8292be1fcb1728737ac4c08636632b6f9f11e7521e49bb3fe1b60ee8781489fd.png";
const IMG_CONFUSED =
  "https://static.prod-images.emergentagent.com/jobs/4cbb8c95-cc7d-4c23-bde9-366f16efbc08/images/3e343a11409287f37b0618b2e1d7ec79e9449b25f5712256d3b3ac245dbcd8b5.png";
const IMG_HAPPY =
  "https://static.prod-images.emergentagent.com/jobs/4cbb8c95-cc7d-4c23-bde9-366f16efbc08/images/40b20f759cebf2145f80b666d268556fa347a366fd6a26f8f8bb1bd226264d3d.png";
const IMG_BG =
  "https://static.prod-images.emergentagent.com/jobs/4cbb8c95-cc7d-4c23-bde9-366f16efbc08/images/bd70ca6f31dd4f89fce61803c74ba0c67922fde1e696bcf7cb7192cb8e7c3681.png";

type Mood = "neutral" | "happy" | "confused" | "sleepy";

const MOOD_IMG: Record<Mood, string> = {
  neutral: IMG_NEUTRAL,
  happy: IMG_HAPPY,
  confused: IMG_CONFUSED,
  sleepy: IMG_NEUTRAL,
};

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memory, setMemory] = useState<PetMemory | null>(null);
  const [input, setInput] = useState("");
  const [petSays, setPetSays] = useState<string>("blup… tika moa ♡");
  const [mood, setMood] = useState<Mood>("neutral");
  const [isListening, setIsListening] = useState(false);

  // Floating animation for the character
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [float]);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.12,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isListening, pulse]);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      if (!p) {
        router.replace("/onboarding");
        return;
      }
      const m = await loadMemory();
      setProfile(p);
      setMemory(m);
      // First greeting depending on fluency
      const greeting =
        fluency(m) > 0.4 && p.name
          ? `¡Hola ${p.name}! ✨`
          : "blup… ¡tika! ♡";
      setPetSays(greeting);
      speakCute(greeting);
    })();
  }, [router]);

  const speakCute = (text: string) => {
    // Strip emojis & repeated dots for cleaner TTS
    const clean = text.replace(/[^\p{L}\p{N}\s,.!?¿¡-]/gu, "").trim();
    if (!clean) return;
    try {
      Speech.stop();
      Speech.speak(clean, {
        language: "es-ES",
        pitch: 1.6, // cute high voice
        rate: 0.95,
      });
    } catch {
      // best-effort
    }
  };

  const handleSend = async () => {
    if (!memory || !input.trim()) return;
    const userText = input.trim();
    setInput("");
    setIsListening(true);
    // Learn
    const updated = learnFromUserText(memory, userText);
    setMemory(updated);
    await saveMemory(updated);
    // Mood + Reply
    const newMood = moodFromReply(updated, userText);
    setMood(newMood);
    const reply = generatePetReply(updated, profile, userText);
    setPetSays(reply);
    speakCute(reply);
    setTimeout(() => setIsListening(false), 400);
  };

  const handleQuickPhrase = (text: string) => {
    setInput(text);
  };

  if (!profile || !memory) {
    return <View style={styles.bg} />;
  }

  const vsize = vocabularySize(memory);
  const fluencyPct = Math.round(fluency(memory) * 100);

  const floatY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  return (
    <View style={styles.root} testID="home-screen">
      <Image
        source={IMG_BG}
        style={StyleSheet.absoluteFillObject as any}
        contentFit="cover"
      />
      <LinearGradient
        colors={["rgba(253,251,247,0.0)", "rgba(253,251,247,0.85)"]}
        style={StyleSheet.absoluteFillObject as any}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          {/* HUD */}
          <View style={styles.hud}>
            <View style={styles.hudPill} testID="vocab-hud">
              <Ionicons name="sparkles" size={16} color="#FF7A59" />
              <Text style={styles.hudText}>
                {vsize} palabras · {fluencyPct}%
              </Text>
            </View>
            <TouchableOpacity
              style={styles.hudIconBtn}
              onPress={() => router.push("/profile")}
              testID="btn-profile"
            >
              <Ionicons name="person" size={18} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={styles.progressOuter} testID="progress-bar">
            <View
              style={[
                styles.progressInner,
                { width: `${Math.max(4, fluencyPct)}%` },
              ]}
            />
          </View>

          {/* Character + speech bubble */}
          <ScrollView
            contentContainerStyle={styles.middle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.bubbleContainer}>
              <View style={styles.speechBubble} testID="pet-bubble">
                <Text style={styles.speechText}>{petSays}</Text>
              </View>
              <View style={styles.bubbleTail} />
            </View>

            <Animated.View
              style={{
                transform: [{ translateY: floatY }, { scale: pulse }],
              }}
            >
              <Image
                source={MOOD_IMG[mood]}
                style={styles.character}
                contentFit="contain"
                transition={250}
              />
            </Animated.View>

            <View style={styles.quickRow}>
              <QuickChip
                label="Hola Lumi"
                onPress={() => handleQuickPhrase(`Hola ${PET_NAME}`)}
                testID="quick-hello"
              />
              <QuickChip
                label={`Me llamo ${profile.name}`}
                onPress={() =>
                  handleQuickPhrase(`Me llamo ${profile.name}`)
                }
                testID="quick-name"
              />
              <QuickChip
                label="¿Cómo estás?"
                onPress={() => handleQuickPhrase("¿Cómo estás?")}
                testID="quick-how"
              />
            </View>
          </ScrollView>

          {/* Input row */}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.sideBtn}
              onPress={() => router.push("/lessons")}
              testID="btn-lessons"
              activeOpacity={0.8}
            >
              <Ionicons name="book" size={22} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.inputWrap}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={`Habla con ${PET_NAME}…`}
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                testID="chat-input"
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
            </View>

            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <TouchableOpacity
                style={styles.micBtn}
                onPress={handleSend}
                testID="mic-button"
                activeOpacity={0.85}
              >
                <Ionicons
                  name={input.trim() ? "send" : "mic"}
                  size={26}
                  color="#FFF"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function QuickChip({
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
      style={styles.chip}
      activeOpacity={0.8}
      testID={testID}
    >
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FDFBF7" },
  bg: { flex: 1, backgroundColor: "#FDFBF7" },
  safe: { flex: 1 },
  flex: { flex: 1 },
  hud: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  hudPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  hudText: {
    color: "#1F2937",
    fontWeight: "800",
    fontSize: 13,
  },
  hudIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#00000010",
  },
  progressOuter: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  progressInner: {
    height: "100%",
    backgroundColor: "#34D399",
    borderRadius: 999,
  },
  middle: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  bubbleContainer: {
    alignItems: "center",
    marginBottom: 6,
    maxWidth: "92%",
  },
  speechBubble: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#00000010",
  },
  speechText: {
    color: "#1F2937",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
    marginTop: -1,
  },
  character: {
    width: 240,
    height: 240,
    marginVertical: 4,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#00000010",
  },
  chipText: {
    color: "#1F2937",
    fontWeight: "700",
    fontSize: 13,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 4 : 12,
    gap: 10,
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FBBF24",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D97706",
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 0,
    elevation: 2,
  },
  inputWrap: { flex: 1 },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#00000010",
  },
  micBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF7A59",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E06548",
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 0,
    elevation: 3,
  },
});
