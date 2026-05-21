import { storage } from "../utils/storage";

export type UserProfile = {
  name: string;
  age: number;
  hobbies: string[];
  createdAt: string;
};

export type PetMemory = {
  vocabulary: Record<string, number>; // word -> times heard
  mood: "neutral" | "happy" | "confused" | "sleepy";
  bondLevel: number; // 0-100
  totalInteractions: number;
  lastInteraction: string;
  learnedTopics: string[]; // lesson ids the pet has been taught
};

const KEY_PROFILE = "pet_user_profile";
const KEY_MEMORY = "pet_memory";

const DEFAULT_MEMORY: PetMemory = {
  vocabulary: {},
  mood: "neutral",
  bondLevel: 0,
  totalInteractions: 0,
  lastInteraction: new Date().toISOString(),
  learnedTopics: [],
};

// Storage helpers stringify values; profile is an object so we JSON.stringify ourselves.
export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await storage.getItem<string>(KEY_PROFILE, "");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function saveProfile(p: UserProfile): Promise<void> {
  await storage.setItem(KEY_PROFILE, JSON.stringify(p));
}

export async function loadMemory(): Promise<PetMemory> {
  const raw = await storage.getItem<string>(KEY_MEMORY, "");
  if (!raw) return { ...DEFAULT_MEMORY };
  try {
    const m = JSON.parse(raw) as PetMemory;
    return { ...DEFAULT_MEMORY, ...m };
  } catch {
    return { ...DEFAULT_MEMORY };
  }
}

export async function saveMemory(m: PetMemory): Promise<void> {
  await storage.setItem(KEY_MEMORY, JSON.stringify(m));
}

export async function resetAll(): Promise<void> {
  await storage.removeItem(KEY_PROFILE);
  await storage.removeItem(KEY_MEMORY);
}

// ---------------- Language progression engine ----------------
// The pet starts knowing nothing of Spanish. As the user speaks, words get
// added to its vocabulary. Sentence generation mixes gibberish + learned words
// proportional to vocabularySize.

const GIBBERISH = [
  "blup", "tika", "moa", "nuni", "bipi", "krra",
  "shu", "zoba", "fee", "puli", "tomo", "dru",
  "lin", "kiba", "mumu", "ploo", "yuna", "bzz",
  "lalo", "wiwi",
];

const STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "y", "o", "de", "del", "que",
  "a", "en", "es", "se", "me", "te", "lo", "mi", "tu", "su", "al",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[¿?¡!.,;:"()]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

export function learnFromUserText(memory: PetMemory, text: string): PetMemory {
  const words = tokenize(text);
  const vocab = { ...memory.vocabulary };
  for (const w of words) {
    vocab[w] = (vocab[w] ?? 0) + 1;
  }
  // Cap vocabulary at 500 entries — when full, drop least-heard words
  const entries = Object.entries(vocab);
  if (entries.length > 500) {
    entries.sort((a, b) => a[1] - b[1]);
    const trimmed = entries.slice(entries.length - 500);
    const nv: Record<string, number> = {};
    for (const [k, v] of trimmed) nv[k] = v;
    return finalize(memory, nv, words.length);
  }
  return finalize(memory, vocab, words.length);
}

function finalize(memory: PetMemory, vocab: Record<string, number>, gained: number): PetMemory {
  const newBond = Math.min(100, memory.bondLevel + Math.max(1, gained));
  return {
    ...memory,
    vocabulary: vocab,
    bondLevel: newBond,
    totalInteractions: memory.totalInteractions + 1,
    lastInteraction: new Date().toISOString(),
  };
}

export function vocabularySize(m: PetMemory): number {
  return Object.keys(m.vocabulary).length;
}

// Returns 0..1 — how Spanish-fluent the pet is.
export function fluency(m: PetMemory): number {
  return Math.min(1, vocabularySize(m) / 60);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function topLearnedWords(m: PetMemory, n: number): string[] {
  return Object.entries(m.vocabulary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

// Generate what the pet "says" back, mixing gibberish with learned words.
export function generatePetReply(
  m: PetMemory,
  profile: UserProfile | null,
  userText: string,
): string {
  const f = fluency(m);
  const learned = topLearnedWords(m, 25);
  const userWords = tokenize(userText);

  // Use a learned word from the current message if available, to feel reactive
  const echo = userWords.find((w) => m.vocabulary[w]) ?? pickRandom(learned);

  const lengthTokens = 2 + Math.floor(Math.random() * 4);
  const parts: string[] = [];
  for (let i = 0; i < lengthTokens; i++) {
    // Probability of speaking a learned Spanish word grows with fluency
    if (learned.length > 0 && Math.random() < f) {
      parts.push(pickRandom(learned));
    } else {
      parts.push(pickRandom(GIBBERISH));
    }
  }
  // If pet knows the user's name and fluency > 0.3, sometimes prepend it
  if (profile?.name && f > 0.3 && Math.random() < 0.4) {
    parts.unshift(profile.name + "!");
  }
  // Echo the heard word at the end occasionally for delight
  if (echo && Math.random() < 0.5) {
    parts.push("..." + echo + "?");
  }

  // Add an emoji-like punctuation
  const enders = ["♡", "!", "~", "?"];
  return parts.join(" ") + " " + pickRandom(enders);
}

export type PetMood = PetMemory["mood"];

export function moodFromReply(
  m: PetMemory,
  userText: string,
): PetMood {
  const f = fluency(m);
  const userWords = tokenize(userText);
  const understoodAny = userWords.some((w) => m.vocabulary[w]);
  if (!understoodAny && f < 0.2) return "confused";
  if (f > 0.5 && understoodAny) return "happy";
  return "neutral";
}

// "Wake word" — checks if user said the pet's name (we use a fixed cute name).
export const PET_NAME = "Lumi";

export function isWakeWord(text: string): boolean {
  return text.toLowerCase().includes(PET_NAME.toLowerCase());
}
