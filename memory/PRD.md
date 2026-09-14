
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
