
## 2026-06 — Cambio
- Selector de captura en panel de miembro ahora abre la galería (se quitó capture="environment").

## 2026-06 — Cambio
- Término "Empleada" reemplazado por "Miembro" en frontend y backend (pestaña admin ahora id "miembros").
- Panel de miembro: nuevo gráfico lineal semanal (Mié–Mar) con minutos por día; endpoint /api/me/dashboard devuelve "days".

## 2026-06 — Code review aplicado
- LoginPage: login movido de useEffect a press()+useCallback (sin closures obsoletas).
- EmployeePage dividido en subcomponentes en src/components/member/ (EntryForm, SummaryCards, GoalCard, RankSection, EntriesList).
- 'Eliminada' → 'Eliminado' en overview. Findings de variables indefinidas / 'is' eran falsos positivos. Tokens siguen en localStorage (decisión: app PIN, sin cookies httpOnly).
- testing_agent iteration_1: 18/18 backend + frontend OK.

## 2026-06 — Binance Pay + Gráfico
- Campo opcional binance_pay_id (texto libre, opcional) en crear/editar miembro (POST/PUT /api/admin/workers); visible en lista de miembros como 'Binance Pay: … / sin agregar'.
- StatsTab: eliminada tarjeta 'Horas totales'; quedan Minutos totales, Promedio diario, Miembros activos.

## 2026-06 — Eliminar registros
- DELETE /api/admin/entries/{id} (admin). Pestaña Registros: botón papelera por registro con confirmación; refresca stats/rankings/pagos.

## 2026-06 — Horas históricas
- Campo historical_hours (guardado como historical_minutes) al crear/editar miembro. Suma solo al ranking global, total del miembro (admin) y tarjeta 'Horas totales (histórico)' en panel miembro. No afecta semana, pagos ni ranking semanal.
- Textos aclaran: ranking semanal = bonos; ranking global = histórico sin premios.

## 2026-06 — Pago masivo Binance Pay
- Plantilla oficial en backend/binance_template.xlsx (openpyxl). GET /api/admin/payments/export (preview JSON), GET /api/admin/payments/export.xlsx (descarga; filas desde la 3: 'Binance ID (BUID)', ID, USDT, monto, nombre en col E Notes), POST /api/admin/payments/mark-all.
- Un miembro = una fila (suma sus semanas pendientes). Excluidos: sin Binance ID o < 0.50 USDT (se avisa en UI).
- Componente admin/PayoutExport.jsx en pestaña Resumen.

## 2026-06 — Calendario, pagos martes, dark mode
- Pago del bono (0.30/h si >10h) ahora el MARTES (ws+13); KGEN paga el LUNES (ws+12, solo informativo, verde). /me/dashboard devuelve weeks[] (status/paid/qualifies/closed, kgen_payday, bonus_payday) y day_minutes{}.
- PayCalendar: colores por semana (en curso celeste, próxima celeste punteado, lunes verde, martes amarillo, pendiente amarillo+reloj, pagado gris+check), popover al tocar día, minutos bajo la fecha, navegación por semana y por mes.
- Histórico ahora se ingresa en MINUTOS (historical_minutes) y se muestra en horas.
- Modo oscuro: ThemeToggle en login/admin/miembro, clase .dark + overrides CSS en index.css, persistido en localStorage.

## 2026-06 — Health check despliegue
- deployment_agent: PASS. ADMIN_CODE y ADMIN_EMAIL movidos a backend/.env (leídos con os.environ.get + fallback).

## 2026-06 — Racha, aviso Binance, columnas calendario
- /me/dashboard devuelve streak (días consecutivos con registro, hoy o ayer como ancla) y binance_pay_id.
- member/MemberNotices.jsx: tarjeta Racha diaria + aviso ámbar si falta Binance Pay ID.
- PayCalendar: lunes/martes ya no se colorean por celda; columnas L y M enmarcadas con borde verde (pestaña KGEN) y amarillo (pestaña BONO). Se mantienen pendiente (amarillo+reloj) y pagado (gris+check).

## 2026-06 — Filtros, revisado, colores calendario
- GET /api/admin/entries?worker_id=&week_start= (filtros); PATCH /api/admin/entries/{id}/review?reviewed=bool. Campo entries.reviewed.
- EntriesTab: selector de miembro, navegación por semana (toggle todas/semana), contador sin revisar, botón check por registro y en el diálogo de captura.
- /me/dashboard devuelve day_reviewed[]; PayCalendar muestra check minimalista junto a los minutos. Colores: semana en curso sky-500, pasadas sky-100, próxima sky-50 punteado; sin amarillo/gris en celdas.

## 2026-06 — Calendario degradado, popovers de pago, wallet BEP20
- Semana en curso: días pasados se aclaran progresivamente (rgba sky con alpha 1-0.11*días, mín 0.42); distinto de semanas pasadas (sky-100).
- Lunes/martes de pago próximos: icono Banknote; popover verde (KGEN, sin mención de 10h) / amarillo (BONO).
- Campo usdt_bep20_address en users (regex 0x+40 hex). POST /api/me/wallet (solo una vez por miembro); admin puede ver/editar en ficha. Aviso en panel miembro con input para enviarla (member/MemberNotices.jsx).
