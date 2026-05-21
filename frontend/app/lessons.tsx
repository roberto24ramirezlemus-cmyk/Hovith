import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import {
  loadProfile,
  loadMemory,
  saveMemory,
  learnFromUserText,
  type UserProfile,
} from "../src/lib/pet";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type Lesson = {
  id: string;
  title: string;
  emoji: string;
  min_age: number;
  max_age: number;
  items: any[];
};

export default function Lessons() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [active, setActive] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLessons = async (age: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons?age=${age}`);
      const data: Lesson[] = await res.json();
      setLessons(data);
    } catch (e) {
      console.warn("Failed to fetch lessons", e);
      setLessons([]);
    }
  };

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setProfile(p);
      if (p) await fetchLessons(p.age);
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    if (!profile) return;
    setRefreshing(true);
    await fetchLessons(profile.age);
    setRefreshing(false);
  };

  const teachPet = async (item: any) => {
    // Pet "learns" the word from the lesson (added to its vocabulary too)
    const text = item.word || item.q || "";
    const mem = await loadMemory();
    const updated = learnFromUserText(mem, text);
    await saveMemory(updated);
    try {
      Speech.stop();
      Speech.speak(text, { language: "es-ES", pitch: 1.6, rate: 0.95 });
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF7A59" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="btn-back-lessons"
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Lecciones</Text>
        <View style={{ width: 40 }} />
      </View>

      {!active ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.subtitle} testID="lessons-subtitle">
            Lecciones para {profile?.age} años, descargadas del servidor.
          </Text>
          {lessons.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No hay lecciones disponibles. Desliza para reintentar.
              </Text>
            </View>
          )}
          {lessons.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={styles.lessonCard}
              onPress={() => setActive(l)}
              testID={`lesson-${l.id}`}
              activeOpacity={0.85}
            >
              <Text style={styles.lessonEmoji}>{l.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.lessonTitle}>{l.title}</Text>
                <Text style={styles.lessonMeta}>
                  {l.items.length} cosas que aprender
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#1F2937" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity
            onPress={() => setActive(null)}
            style={styles.lessonBack}
            testID="btn-back-to-lessons"
          >
            <Ionicons name="chevron-back" size={18} color="#1F2937" />
            <Text style={styles.lessonBackText}>Otras lecciones</Text>
          </TouchableOpacity>
          <Text style={styles.activeTitle}>
            {active.emoji} {active.title}
          </Text>
          {active.items.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.itemCard}
              onPress={() => teachPet(item)}
              testID={`item-${active.id}-${idx}`}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemPrimary}>
                  {item.word || item.q}
                </Text>
                <Text style={styles.itemSecondary}>
                  {item.hint || item.es || (item.en ? `EN: ${item.en}` : "")}
                  {item.a ? `Respuesta: ${item.a}` : ""}
                </Text>
              </View>
              <Ionicons name="volume-high" size={22} color="#FF7A59" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FDFBF7" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDFBF7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#00000010",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  subtitle: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 18,
    padding: 16,
  },
  emptyText: {
    color: "#1F2937",
    fontWeight: "700",
  },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#00000010",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  lessonEmoji: { fontSize: 36 },
  lessonTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  lessonMeta: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "700",
    marginTop: 2,
  },
  lessonBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  lessonBackText: {
    color: "#1F2937",
    fontWeight: "800",
    fontSize: 14,
  },
  activeTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#00000010",
  },
  itemPrimary: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  itemSecondary: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "700",
    marginTop: 2,
  },
});
