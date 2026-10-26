# CHΔNCE · Frontend

[![CI](https://github.com/pabmatang/strength-biomechanics-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/pabmatang/strength-biomechanics-engine/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-66%20tests-6E9F18?style=flat-square&logo=vitest&logoColor=white)

Interfaz React + TypeScript para registrar entrenamientos de fuerza, calcular volumen/sobrecarga y consumir la API de biomecánica del backend Spring Boot.

Es la mitad visual de [strength-biomechanics-engine](https://github.com/pabmatang/strength-biomechanics-engine). El flujo de autenticación y las llamadas de IA van al backend real; no hay contraseñas ni respuestas de IA simuladas en el camino principal.

---

## Qué hace

- **Cuenta real**: registro/login contra `POST /api/v1/auth/*`, JWT en `localStorage`, perfil cacheado para la sesión. Logout limpia el token.
- **Modo invitado explícito**: sesión sin cuenta que solo guarda datos en este navegador (marcada como local en la UI).
- **Escaneo de máquinas**: sube una foto o usa las muestras de `public/machines/`; la imagen se envía a `POST /api/v1/exercises/scan`.
- **Sustitución biomecánica**: consulta `POST /api/v1/biomechanics/substitute` y muestra la similitud y la justificación devueltas por la API.
- **Entrenamiento**: rutinas, series, RPE, 1RM estimado, volumen semanal, cardio, nutrición y medidas. El snapshot se persiste en `localStorage` (local-first); no se presenta como backup en la nube.
- **Ejemplos ilustrativos**: si el backend/Ollama no está disponible, el modal de IA permite cargar datos de ejemplo con un aviso visible de que no proceden de la API. El selector de comidas solo carga recetas de ejemplo (macros fijos); no analiza fotos propias. Los pasos se registran a mano: no hay integración con Health Connect/Apple Health ni datos simulados.
- **Historial inicial de ejemplo**: peso, nutrición, medidas y comunidad arrancan con datos de ejemplo editables; no son de una cuenta real.

---

## Desarrollo

Requisitos: Node 22+ y el backend en `http://localhost:8080`.

```bash
npm ci
npm run dev        # http://localhost:5173
```

Vite hace proxy de `/api` a `http://localhost:8080` (ver `vite.config.ts`), por lo que no hace falta configurar CORS en desarrollo. Para apuntar a otra URL:

```bash
VITE_API_BASE_URL=https://mi-api.example.com/api/v1 npm run dev
```

### Scripts

| Comando | Qué hace |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo con proxy a la API |
| `npm run build` | `tsc -b` + bundle de producción en `dist/` |
| `npm test` | 66 tests de Vitest |
| `npm run lint` | oxlint (warnings actuales, sin errores) |
| `npm run preview` | Sirve el bundle con el mismo proxy |

### Tests

```bash
npm test
```

Los tests cubren cálculos de entrenamiento (1RM, volumen, RPE), nutrición, recuperación muscular, física biomecánica y el cliente de autenticación (`src/__tests__/auth.test.ts`, con `fetch` mockeado para verificar registro, login, errores 401/409, red caída y logout).

---

## Estructura

```
src/
├── components/
│   ├── AuthScreen.tsx           # Login/registro contra la API
│   ├── AiBiomechanicsModal.tsx  # Escaneo y sustitución (llamadas reales)
│   └── ...
├── utils/
│   ├── api.ts                   # Cliente tipado, JWT, ApiError
│   └── cloudSync.ts             # Sesión + snapshot local-first
├── data/                        # Catálogo de ejercicios y rutinas
├── types/workout.ts             # Modelo de dominio del frontend
└── __tests__/                   # 66 tests
```

---

## Limitaciones

- El snapshot completo (rutinas, historial, medidas) no se sincroniza con PostgreSQL; solo vive en el navegador. La tabla `workouts` del backend se usa para los endpoints analíticos.
- El JWT no se refresca: al caducar (24 h por defecto) hay que volver a iniciar sesión.
- El bundle es un único chunk de ~1,1 MB; no hay code splitting.
- Sin backend, el escaneo y la sustitución muestran un error explicativo (y el ejemplo claramente etiquetado), no resultados falsos.

---

## Autor

**Pablo Mateos Angulo** — [@pabmatang](https://github.com/pabmatang)

Licencia MIT.
