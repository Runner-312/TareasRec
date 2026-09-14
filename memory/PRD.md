
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
