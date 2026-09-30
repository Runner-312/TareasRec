# TareasREC

App para registrar minutos diarios, calcular pagos semanales y exportar la plantilla de Binance Pay.
Stack: FastAPI + MongoDB (backend) y React (frontend).

## Variables de entorno del backend (`backend/.env`, nunca se sube al repo)
| Variable | Descripción |
|---|---|
| `MONGO_URL`, `DB_NAME` | Conexión a MongoDB |
| `JWT_SECRET` | Firma de sesiones (`openssl rand -hex 32`) |
| `PIN_PEPPER` | Protege los PIN en la base de datos (`openssl rand -hex 32`). **No cambiarlo** después de usarlo |
| `ADMIN_CODE`, `ADMIN_EMAIL` | Solo para crear el admin la primera vez (4 dígitos) |
| `CORS_ORIGINS` | Dominios del frontend, separados por coma |
| `EMERGENT_LLM_KEY`, `INTEGRATION_PROXY_URL`, `APP_NAME` | Almacenamiento de capturas |
| `TOKEN_DAYS` (opcional, 7) | Duración de la sesión |
| `TRUSTED_PROXY_HOPS` (opcional, 1) | Proxies de confianza para detectar la IP real |

## Tests
`TEST_ADMIN_CODE=<pin> REACT_APP_BACKEND_URL=<url> pytest backend/tests`
