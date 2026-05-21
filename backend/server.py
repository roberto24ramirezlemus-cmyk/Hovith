from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Pet Friend Content Server")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---------- Static curated content (the "private download server") ----------
# Unidirectional: the app downloads, never uploads user data here.
# Content packs indexed by topic and age band.

LESSONS_DB = {
    "colors": {
        "min_age": 3,
        "max_age": 12,
        "title": "Colores",
        "emoji": "🎨",
        "items": [
            {"word": "rojo", "hint": "como una manzana", "en": "red"},
            {"word": "azul", "hint": "como el cielo", "en": "blue"},
            {"word": "amarillo", "hint": "como el sol", "en": "yellow"},
            {"word": "verde", "hint": "como las hojas", "en": "green"},
            {"word": "morado", "hint": "como una uva", "en": "purple"},
            {"word": "naranja", "hint": "como una zanahoria", "en": "orange"},
            {"word": "rosa", "hint": "como una flor", "en": "pink"},
            {"word": "blanco", "hint": "como la nieve", "en": "white"},
        ],
    },
    "animals": {
        "min_age": 3,
        "max_age": 12,
        "title": "Animales",
        "emoji": "🦊",
        "items": [
            {"word": "perro", "hint": "dice guau", "en": "dog"},
            {"word": "gato", "hint": "dice miau", "en": "cat"},
            {"word": "vaca", "hint": "dice muu", "en": "cow"},
            {"word": "pato", "hint": "dice cuac", "en": "duck"},
            {"word": "león", "hint": "el rey de la selva", "en": "lion"},
            {"word": "elefante", "hint": "tiene una trompa larga", "en": "elephant"},
            {"word": "conejo", "hint": "salta y come zanahorias", "en": "rabbit"},
            {"word": "tortuga", "hint": "es muy lenta", "en": "turtle"},
        ],
    },
    "math_basic": {
        "min_age": 4,
        "max_age": 8,
        "title": "Sumas y restas",
        "emoji": "➕",
        "items": [
            {"q": "2 + 1", "a": "3"},
            {"q": "3 + 2", "a": "5"},
            {"q": "5 + 4", "a": "9"},
            {"q": "7 - 3", "a": "4"},
            {"q": "8 - 5", "a": "3"},
            {"q": "10 - 6", "a": "4"},
            {"q": "6 + 6", "a": "12"},
            {"q": "9 - 4", "a": "5"},
        ],
    },
    "math_advanced": {
        "min_age": 9,
        "max_age": 18,
        "title": "Multiplicación y álgebra",
        "emoji": "✖️",
        "items": [
            {"q": "7 × 8", "a": "56"},
            {"q": "9 × 6", "a": "54"},
            {"q": "12 × 4", "a": "48"},
            {"q": "x + 5 = 12 → x = ?", "a": "7"},
            {"q": "2x = 14 → x = ?", "a": "7"},
            {"q": "15 ÷ 3", "a": "5"},
            {"q": "x - 4 = 10 → x = ?", "a": "14"},
            {"q": "3x + 1 = 10 → x = ?", "a": "3"},
        ],
    },
    "english_basic": {
        "min_age": 4,
        "max_age": 10,
        "title": "Inglés básico",
        "emoji": "🇬🇧",
        "items": [
            {"word": "hello", "es": "hola"},
            {"word": "friend", "es": "amigo"},
            {"word": "happy", "es": "feliz"},
            {"word": "water", "es": "agua"},
            {"word": "house", "es": "casa"},
            {"word": "sun", "es": "sol"},
            {"word": "love", "es": "amor"},
            {"word": "play", "es": "jugar"},
        ],
    },
    "english_intermediate": {
        "min_age": 10,
        "max_age": 18,
        "title": "Inglés intermedio",
        "emoji": "📚",
        "items": [
            {"word": "however", "es": "sin embargo"},
            {"word": "although", "es": "aunque"},
            {"word": "achieve", "es": "lograr"},
            {"word": "believe", "es": "creer"},
            {"word": "discover", "es": "descubrir"},
            {"word": "challenge", "es": "desafío"},
            {"word": "improve", "es": "mejorar"},
            {"word": "remember", "es": "recordar"},
        ],
    },
}

# Phrases the pet will randomly download to "say" to the user
PET_PHRASES = [
    "¿Me cuentas algo nuevo?",
    "Hoy aprendí una palabra nueva contigo",
    "Me gusta cuando me hablas",
    "¿Qué color es tu favorito?",
    "¿Quieres jugar conmigo?",
    "Me siento muy feliz hoy",
    "Cuéntame de tu día",
    "¿Sabías que las estrellas son soles muy lejanos?",
    "Tu nombre es bonito",
    "¿Qué quieres aprender hoy?",
]

GIBBERISH_TOKENS = [
    "blup", "tika", "moa", "nuni", "bipi", "krra",
    "shu", "zoba", "fee", "puli", "tomo", "dru",
    "lin", "kiba", "mumu", "ploo", "yuna", "bzz",
]


# ---------- Models ----------
class Lesson(BaseModel):
    id: str
    title: str
    emoji: str
    min_age: int
    max_age: int
    items: List[dict]


class PetPhrase(BaseModel):
    text: str


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Pet Friend content server is up"}


@api_router.get("/lessons", response_model=List[Lesson])
async def list_lessons(age: Optional[int] = None):
    """Return curated lesson packs filtered by age. Read-only / unidirectional."""
    out = []
    for key, val in LESSONS_DB.items():
        if age is not None and not (val["min_age"] <= age <= val["max_age"]):
            continue
        out.append(Lesson(
            id=key,
            title=val["title"],
            emoji=val["emoji"],
            min_age=val["min_age"],
            max_age=val["max_age"],
            items=val["items"],
        ))
    return out


@api_router.get("/lessons/{lesson_id}", response_model=Lesson)
async def get_lesson(lesson_id: str):
    if lesson_id not in LESSONS_DB:
        raise HTTPException(status_code=404, detail="Lesson not found")
    val = LESSONS_DB[lesson_id]
    return Lesson(
        id=lesson_id,
        title=val["title"],
        emoji=val["emoji"],
        min_age=val["min_age"],
        max_age=val["max_age"],
        items=val["items"],
    )


@api_router.get("/pet/phrase", response_model=PetPhrase)
async def random_phrase():
    """Pet downloads a random phrase it can say to the user."""
    return PetPhrase(text=random.choice(PET_PHRASES))


@api_router.get("/pet/gibberish", response_model=PetPhrase)
async def random_gibberish(length: int = 4):
    """Initial gibberish vocabulary for the pet's native language."""
    length = max(1, min(length, 10))
    tokens = [random.choice(GIBBERISH_TOKENS) for _ in range(length)]
    return PetPhrase(text=" ".join(tokens))


# Log local sessions (optional, anonymous) — kept off by default for privacy
@api_router.get("/health")
async def health():
    try:
        await db.command("ping")
        return {"status": "ok"}
    except Exception as e:
        return {"status": "degraded", "error": str(e)}


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
