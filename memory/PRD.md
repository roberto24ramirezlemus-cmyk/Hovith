# Lumi - Amigo que aprende (PRD)

## Overview
Mobile app (Expo / React Native) where a cute 2D animated creature called **Lumi**
arrives without knowing the user's language and learns it progressively by talking
with the user. The pet remembers the user's name, age, and hobbies, and addresses
them personally.

## Core Features (MVP)
1. **Onboarding** – 4-step flow capturing name, age, hobbies (interest pills).
2. **Home / Pet screen** – Animated character (floating bob), speech bubbles,
   progress HUD (vocabulary words + fluency %), quick-phrase chips, text input
   (microphone-styled send button) for chatting with Lumi.
3. **Language progression engine** – At start the pet babbles only gibberish
   ("blup tika moa"). Each user message contributes words to a local
   vocabulary. As vocabulary grows, Lumi mixes more learned Spanish words into
   its replies, eventually addressing the user by name.
4. **Lessons screen** – Downloads age-appropriate lessons from the private
   FastAPI backend (colors, animals, basic/advanced math, basic/intermediate
   English). Tapping an item teaches Lumi the word and speaks it via TTS.
5. **Profile screen** – Shows what Lumi remembers (name, age, hobbies, top
   learned words, bond level, fluency, total interactions). Reset memory option.
6. **Cute voice** – `expo-speech` with high pitch (1.6) and Spanish locale, no
   cloud TTS — fully on-device.
7. **Scheduled notifications** – Three daily check-ins (10am, 3pm, 8pm) where
   Lumi pings the user.

## Architecture
- **Local-first**: All user data (`pet_user_profile`, `pet_memory`) is in
  AsyncStorage via `@/src/utils/storage`. Vocabulary capped at 500 entries with
  LRU-style eviction (least-heard words dropped).
- **Backend (FastAPI)**: download-only content endpoints
  - `GET /api/lessons?age=N` – returns age-filtered lesson packs
  - `GET /api/lessons/{id}` – specific lesson
  - `GET /api/pet/phrase` – random pet-spoken phrase
  - `GET /api/pet/gibberish?length=N` – random gibberish token string
  - `GET /api/health` – liveness
- **No upload of user data** to the server (privacy by design).

## Out-of-Scope (explained to user)
- True speech-to-text without cloud / heavy on-device model — substituted with
  text input + cute TTS output and a microphone-styled CTA.
- "Reacts while phone is off" – impossible per OS rules; substituted with
  scheduled notifications and in-app foreground reactivity.

## Future Enhancements
- Press-and-hold mic with `expo-speech-recognition` (requires dev build).
- Tablet-tier overlay on Android via `SYSTEM_ALERT_WINDOW` (native module).
- Export memory backup file (acts as the "SD card backup" the user described).
