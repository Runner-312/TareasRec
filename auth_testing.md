# Auth Testing — TareasREC (PIN de 4 dígitos)

Esta app NO usa email/password. El login es solo un código PIN de 4 dígitos:

- Admin fijo: código `1209` (Wuilber), creado por seed en startup.
- Empleadas: códigos creados por el admin en POST /api/admin/workers.

## Pruebas API

```bash
# Login admin
curl -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"code":"1209"}'
# → {"token": "...", "user": {"id": "...", "name": "Wuilber", "role": "admin"}}

# Token inválido
curl -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"code":"0000"}'
# → 401

# Código mal formado
curl -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"code":"12"}'
# → 400

# /auth/me con Bearer
curl $API/api/auth/me -H "Authorization: Bearer <token>"

# Crear empleada (admin)
curl -X POST $API/api/admin/workers -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"name":"Prueba","code":"4321"}'

# Login empleada
curl -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"code":"4321"}'

# Empleada NO puede acceder a rutas admin (esperar 403)
curl $API/api/admin/workers -H "Authorization: Bearer <token_empleada>"
```

## Flujo clave a verificar
1. Login admin → crear empleada con código → login empleada → registrar minutos + captura (multipart POST /api/entries) → intento de segundo registro el mismo día debe dar 409.
2. Semana = Miércoles a Martes. Pago: >10 h/semana → horas × $0.30; si no, $0. Bonos ranking: #1 +30%, #2 +20%, #3 +10%.
3. Admin marca pago → desaparece de pendientes y suma al total pagado.
