import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  loadProfile,
  loadMemory,
  resetAll,
  vocabularySize,
  fluency,
  PET_NAME,
  type UserProfile,
  type PetMemory,
} from "../src/lib/pet";

const NEUTRAL_IMG =
  "https://static.prod-images.emergentagent.com/jobs/4cbb8c95-cc7d-4c23-bde9-366f16efbc08/images/8292be1fcb1728737ac4c08636632b6f9f11e7521e49bb3fe1b60ee8781489fd.png";

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memory, setMemory] = useState<PetMemory | null>(null);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      const m = await loadMemory();
      setProfile(p);
      setMemory(m);
    })();
  }, []);

  const handleReset = () => {
    Alert.alert(
      "¿Empezar de nuevo?",
      `${PET_NAME} olvidará todo lo que sabe sobre ti. Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, reiniciar",
          style: "destructive",
          onPress: async () => {
            await resetAll();
            router.replace("/onboarding");
          },
        },
      ],
    );
  };

  if (!profile || !memory) {
    return <View style={styles.root} />;
  }

  const vsize = vocabularySize(memory);
  const fpct = Math.round(fluency(memory) * 100);
  const topWords = Object.entries(memory.vocabulary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([w]) => w);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="btn-back-profile"
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Mi perfil</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <Image
            source={NEUTRAL_IMG}
            style={styles.avatar}
            contentFit="contain"
          />
          <Text style={styles.userName} testID="profile-name">
            {profile.name}
          </Text>
          <Text style={styles.userMeta}>
            {profile.age} años · amig@ de {PET_NAME}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lo que {PET_NAME} recuerda de ti</Text>
          <Row label="Nombre" value={profile.name} />
          <Row label="Edad" value={`${profile.age}`} />
          <Row
            label="Gustos"
            value={profile.hobbies.join(", ") || "—"}
          />
          <Row
            label="Desde"
            value={new Date(profile.createdAt).toLocaleDateString("es-ES")}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progreso de {PET_NAME}</Text>
          <Row label="Palabras aprendidas" value={`${vsize}`} />
          <Row label="Fluidez en español" value={`${fpct}%`} />
          <Row
            label="Conversaciones"
            value={`${memory.totalInteractions}`}
          />
          <Row label="Cariño" value={`${memory.bondLevel}/100`} />

          {topWords.length > 0 && (
            <>
              <Text style={styles.subTitle}>Palabras favoritas</Text>
              <View style={styles.wordWrap}>
                {topWords.map((w) => (
                  <View key={w} style={styles.wordPill}>
                    <Text style={styles.wordText}>{w}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          onPress={handleReset}
          style={styles.dangerBtn}
          testID="btn-reset"
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={styles.dangerText}>Reiniciar memoria</Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          Toda tu información se guarda solo en este dispositivo. El servidor
          solo envía contenido de lecciones — nunca recibe tus datos.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FDFBF7" },
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
  title: { fontSize: 22, fontWeight: "800", color: "#1F2937" },
  scroll: { padding: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: { width: 120, height: 120, marginBottom: 8 },
  userName: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  userMeta: {
    color: "#4B5563",
    fontWeight: "700",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#00000010",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#00000010",
    gap: 12,
  },
  rowLabel: { color: "#4B5563", fontWeight: "700", fontSize: 14 },
  rowValue: {
    color: "#1F2937",
    fontWeight: "800",
    fontSize: 14,
    flexShrink: 1,
    textAlign: "right",
  },
  wordWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  wordPill: {
    backgroundColor: "#34D399",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  wordText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 13,
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF4444",
    borderRadius: 22,
    paddingVertical: 14,
    marginTop: 4,
  },
  dangerText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 15,
  },
  footnote: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 14,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
});
