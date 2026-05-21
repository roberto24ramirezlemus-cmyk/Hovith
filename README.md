# 🌟 Lumi — Amigo que aprende

App móvil (Expo / React Native) con un personaje 2D animado que **no sabe hablar
tu idioma al inicio** y aprende español poco a poco según interactúas con él.
Recuerda tu nombre, edad y gustos para hablarte de forma personal, y te enseña
contenido por edad (colores, animales, matemáticas, inglés).

> 100% local-first. Toda tu información se guarda en el dispositivo. El servidor
> solo envía contenido de lecciones — nunca recibe tus datos.

---

## ✨ Características

- **Personaje 2D animado "Lumi"** con expresiones (neutral, feliz, confundido)
- **Motor de progresión de idioma**: empieza balbuceando ("blup tika moa") y
  mezcla cada vez más palabras que aprende de ti
- **Memoria persistente local** (AsyncStorage): nombre, edad, gustos, vocabulario,
  nivel de cariño
- **Voz tierna** con `expo-speech` (pitch alto, sin nube)
- **Lecciones descargables por edad** desde un backend FastAPI (colores,
  animales, sumas, álgebra, inglés básico/intermedio)
- **Notificaciones programadas** 3 veces al día para que Lumi te extrañe
- **UI estilo "clay toy"** cálida y juguetona

---

## 🧱 Arquitectura

```
/app
├── backend/                FastAPI + MongoDB (download-only content server)
│   ├── server.py
│   ├── requirements.txt
│   └── .env                MONGO_URL, DB_NAME
└── frontend/               Expo SDK 54 (React Native + expo-router)
    ├── app/                Rutas (file-based)
    │   ├── _layout.tsx
    │   ├── index.tsx       Splash → redirige
    │   ├── onboarding.tsx  Captura nombre/edad/gustos
    │   ├── home.tsx        Personaje + chat + HUD vocabulario
    │   ├── lessons.tsx     Lista lecciones del backend
    │   └── profile.tsx     Memoria de Lumi sobre ti
    ├── src/
    │   ├── lib/
    │   │   ├── pet.ts            Motor del personaje + memoria
    │   │   └── notifications.ts  Notificaciones programadas
    │   └── utils/storage/        Wrapper de AsyncStorage
    ├── app.json            Permisos iOS/Android, plugins
    └── package.json
```

---

## 🚀 Cómo correrlo localmente

### Requisitos
- **Node.js 20+** y **Yarn 1.x**
- **Python 3.11+** y **pip**
- **MongoDB** corriendo localmente (`mongod`) o un cluster de MongoDB Atlas
- Para probar en tu celular: app **Expo Go** (iOS / Android)

### 1. Backend (FastAPI)

```bash
cd backend
cp .env.example .env       # Edita MONGO_URL si no usas localhost
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Verifica: `curl http://localhost:8001/api/health` → `{"status":"ok"}`

### 2. Frontend (Expo)

```bash
cd frontend
cp .env.example .env
# Edita EXPO_PUBLIC_BACKEND_URL con la IP de tu LAN, por ejemplo:
#   EXPO_PUBLIC_BACKEND_URL=http://192.168.1.50:8001
# (localhost NO funciona desde el celular)

yarn install
yarn start                 # Abre Metro + muestra QR
```

Escanea el QR con la app **Expo Go** desde tu celular (debe estar en la misma
red Wi-Fi que tu computadora).

> ℹ️ Para usar el simulador iOS: `yarn ios`  
> Para emulador Android: `yarn android`  
> Para probar en navegador (algunas APIs no funcionan): `yarn web`

---

## 🔐 Variables de entorno

### `backend/.env`
| Variable     | Descripción                    | Ejemplo                          |
|--------------|--------------------------------|----------------------------------|
| `MONGO_URL`  | Cadena de conexión MongoDB     | `mongodb://localhost:27017`      |
| `DB_NAME`    | Nombre de la base de datos     | `lumi_pet`                       |

### `frontend/.env`
| Variable                    | Descripción                            | Ejemplo                          |
|-----------------------------|----------------------------------------|----------------------------------|
| `EXPO_PUBLIC_BACKEND_URL`   | URL pública del backend (sin / final) | `https://api.tudominio.com`      |

---

## 📡 API del backend

Todas las rutas con prefijo `/api`:

| Método | Ruta                       | Descripción                                |
|--------|----------------------------|--------------------------------------------|
| GET    | `/api/`                    | Health/greeting                            |
| GET    | `/api/health`              | Ping de MongoDB                            |
| GET    | `/api/lessons?age=N`       | Lecciones filtradas por edad               |
| GET    | `/api/lessons/{id}`        | Detalle de una lección                     |
| GET    | `/api/pet/phrase`          | Frase aleatoria que Lumi puede decir       |
| GET    | `/api/pet/gibberish?length=N` | N tokens de balbuceo del personaje      |

---

## 🏗️ Build para producción

### APK / IPA
Usa el botón **Publish** en Emergent (recomendado) — Emergent maneja el build
EAS, la firma y la entrega del APK/IPA.

### Despliegue del backend
- Cualquier servicio que corra Python + acceso a MongoDB (Railway, Render, Fly.io, etc.)
- O usa el botón **Deploy** de Emergent para hosting administrado

---

## 🎯 Próximos pasos sugeridos

- [ ] Voz por micrófono real con `expo-speech-recognition` (requiere development build)
- [ ] Export / import de memoria como archivo (para llevar a otro celular como pediste)
- [ ] Más packs de lecciones (geografía, ciencia, lectura)
- [ ] Mini-juegos para subir el cariño de Lumi
- [ ] Animaciones Lottie para reacciones más expresivas

---

## 📄 Licencia

Tu proyecto, tus reglas. ¡Disfruta a Lumi! 💛
