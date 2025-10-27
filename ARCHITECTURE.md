# Arquitectura de Apuestas Federal

## Descripción General

Apuestas Federal es una aplicación de apuestas para una liga de fantasy football, construida con Next.js 15 y Supabase. Los usuarios pueden apostar en partidos de su liga privada usando un balance virtual (₣ Federal).

---

## Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estilos**: Tailwind CSS con gradientes personalizados
- **Lenguaje**: TypeScript
- **State Management**: React Context API

---

## Estructura del Proyecto

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/                # Endpoints de administración
│   │   │   └── populate-gw/      # Poblar gameweeks con partidos y odds
│   │   ├── bets/                 # Endpoints de apuestas
│   │   │   ├── create/           # Crear nueva apuesta
│   │   │   ├── delete/           # Eliminar apuesta (solo pending)
│   │   │   ├── resolve/          # Resolver apuestas de un gameweek
│   │   │   └── user-bet/         # Obtener apuesta del usuario para un partido
│   │   ├── auth/                 # Autenticación
│   │   │   └── signout/          # Cerrar sesión
│   │   ├── league/               # Datos de la liga (equipos, partidos, standings)
│   │   ├── participants/         # Participantes de la liga
│   │   └── stats/                # Estadísticas globales (pools, apuestas)
│   ├── page.tsx                  # Página principal
│   ├── layout.tsx                # Layout raíz
│   └── globals.css               # Estilos globales
│
├── components/                   # Componentes React
│   ├── dashboard/                # Sub-componentes del dashboard
│   │   ├── DashboardHeader.tsx   # Avatar, nombre y equipo del usuario
│   │   ├── DashboardStats.tsx    # Tarjeta con estadísticas principales
│   │   ├── ActiveBetsTable.tsx   # Tabla de apuestas activas
│   │   ├── ChangePasswordModal.tsx # Modal para cambiar contraseña
│   │   ├── DashboardFooter.tsx   # Botones de acción (logout, admin)
│   │   └── index.ts              # Barrel export
│   ├── DashboardModal.tsx        # Modal principal del usuario/admin (orquestador)
│   ├── DeleteBetButton.tsx       # Botón para eliminar apuestas
│   ├── Footer.tsx                # Footer de la app
│   ├── Header.tsx                # Header con navegación
│   ├── Hero.tsx                  # Sección hero con pools y stats
│   ├── MatchCard.tsx             # Card de partido con odds y apuesta
│   ├── StandingsTable.tsx        # Tabla de posiciones
│   ├── UpcomingMatches.tsx       # Lista de próximos partidos
│   └── index.ts                  # Barrel export
│
├── contexts/                     # React Contexts
│   └── LeagueContext.tsx         # Context global para datos de liga
│
├── hooks/                        # Custom React Hooks
│   ├── useDashboardData.ts       # Hook para cargar datos del dashboard
│   ├── useUserStats.ts           # Hook para calcular estadísticas de usuario
│   ├── useTeamMapping.ts         # Hook para mapear IDs a nombres de equipos
│   └── index.ts                  # Barrel export
│
│
├── lib/                          # Lógica de negocio y utilidades
│   ├── api/                      # Utilidades para API routes
│   │   ├── auth.ts               # Helpers de autenticación
│   │   ├── responses.ts          # Helpers para respuestas HTTP
│   │   ├── validation.ts         # Validación de datos
│   │   └── index.ts              # Barrel export
│   ├── bets/                     # Lógica de apuestas
│   │   └── resolver.ts           # Resolver apuestas comparando con resultados FPL
│   ├── odds/                     # Cálculo de odds
│   │   ├── calculator.ts         # Lógica pura de cálculo de odds
│   │   └── gameweek-odds.ts      # Wrapper para calcular y persistir odds
│   └── supabase/                 # Clientes de Supabase
│       ├── client.ts             # Cliente para uso client-side
│       └── server.ts             # Cliente para uso server-side
│
├── types/                        # Definiciones de tipos TypeScript
│   ├── betting.ts                # Tipos relacionados con apuestas
│   ├── index.ts                  # Tipos generales
│   ├── league.ts                 # Tipos de liga y equipos
│   └── user.ts                   # Tipos de usuario
│
├── constants/                    # Constantes de la aplicación
│   └── roles.ts                  # Definición de roles (USER=1, ADMIN=2)
│
└── middleware.ts                 # Middleware de Next.js (autenticación)
```

---

## Flujo de Datos

### 1. Carga Inicial de Datos de Liga

```
FPL API (draft.premierleague.com)
    ↓
/api/league (fetch y procesa)
    ↓
LeagueContext (almacena en estado global)
    ↓
Components (Hero, StandingsTable, UpcomingMatches, MatchCard)
```

**Importante**: Los componentes NO deben hacer fetch directo a la API. Siempre usar `LeagueContext`.

### 2. Flujo de Apuestas

#### Crear Apuesta
```
Usuario selecciona resultado en MatchCard
    ↓
POST /api/bets/create
    ↓
Valida: balance suficiente, partido activo, no tiene apuesta previa
    ↓
Crea registro en tabla `bets` (status='pending')
    ↓
Descuenta del `federal_balance` del usuario
    ↓
Crea transacción en tabla `transactions` (type='bet')
    ↓
Retorna apuesta creada
```

#### Eliminar Apuesta (solo pending)
```
Usuario hace click en DeleteBetButton
    ↓
DELETE /api/bets/delete
    ↓
Valida: apuesta existe, pertenece al usuario (o es admin), status='pending'
    ↓
Elimina transacciones relacionadas (foreign key)
    ↓
Elimina apuesta
    ↓
Devuelve `amount` al `federal_balance` del usuario
    ↓
UI se actualiza
```

#### Resolver Apuestas (Admin)
```
Admin llama POST /api/bets/resolve?gameweek=X
    ↓
Fetch resultados reales de FPL API
    ↓
Para cada apuesta pending del gameweek:
    - Compara predicción con resultado real
    - Si acertó: status='won', suma `potential_win` al balance
    - Si falló: status='lost'
    - Crea transacción correspondiente
    ↓
Retorna resumen (won, lost, users_updated)
```

### 3. Flujo de Admin: Poblar Gameweeks

```
Admin hace click en "Poblar Gameweek" (DashboardModal)
    ↓
POST /api/admin/populate-gw
    ↓
Fetch datos de FPL API (standings, matches)
    ↓
Identifica próximo gameweek
    ↓
Para cada partido:
    - Calcula odds usando standings y forma reciente
    - Crea registro en `gameweek_matches`
    ↓
Desactiva gameweeks anteriores (is_active=false)
    ↓
Retorna gameweek poblado
```

---

## Base de Datos (Supabase)

### Tablas Principales

#### `profiles`
- `id` (UUID, FK a auth.users)
- `display_name` (TEXT)
- `fpl_entry_id` (INTEGER) - ID del equipo en FPL
- `federal_balance` (NUMERIC) - Balance virtual del usuario
- `real_balance` (NUMERIC) - Balance real (no usado actualmente)
- `role_id` (INTEGER) - 1=USER, 2=ADMIN

#### `bets`
- `id` (UUID)
- `user_id` (UUID, FK a profiles)
- `gameweek` (INTEGER)
- `match_league_entry_1` (INTEGER) - Equipo local
- `match_league_entry_2` (INTEGER) - Equipo visitante
- `predicted_result` (TEXT) - 'home', 'draw', 'away'
- `amount` (NUMERIC) - Monto apostado
- `odds` (NUMERIC) - Odds al momento de apostar
- `potential_win` (NUMERIC) - Ganancia potencial
- `status` (TEXT) - 'pending', 'won', 'lost'
- `created_at` (TIMESTAMP)

#### `transactions`
- `id` (UUID)
- `user_id` (UUID, FK a profiles)
- `type` (TEXT) - 'bet', 'win', 'refund'
- `amount` (NUMERIC)
- `related_bet_id` (UUID, FK a bets)
- `created_at` (TIMESTAMP)

#### `gameweek_matches`
- `id` (SERIAL)
- `gameweek` (INTEGER)
- `league_entry_1` (INTEGER) - Equipo local
- `league_entry_2` (INTEGER) - Equipo visitante
- `home_odds` (NUMERIC)
- `draw_odds` (NUMERIC)
- `away_odds` (NUMERIC)
- `is_active` (BOOLEAN) - Solo el gameweek actual está activo
- `calculated_at` (TIMESTAMP)

### Row Level Security (RLS)

**Políticas Activas**:

- **profiles**: 
  - Usuarios pueden leer su propio perfil
  - Admins pueden leer cualquier perfil
  
- **bets**:
  - Usuarios pueden crear sus propias apuestas
  - Usuarios pueden leer sus propias apuestas
  - Usuarios pueden eliminar sus propias apuestas (si status='pending')
  - Admins pueden leer y eliminar cualquier apuesta

- **transactions**:
  - Usuarios pueden leer sus propias transacciones
  - Usuarios pueden eliminar sus propias transacciones
  - Admins pueden leer y eliminar cualquier transacción

- **gameweek_matches**:
  - Todos pueden leer
  - Solo admins pueden insertar/actualizar

---

## Sistema de Roles

### USER (role_id = 1)
**Permisos**:
- Ver sus propias apuestas y transacciones
- Crear apuestas en partidos activos
- Eliminar sus apuestas pending
- Ver estadísticas globales y standings

### ADMIN (role_id = 2)
**Permisos adicionales**:
- Ver todas las apuestas de todos los usuarios
- Eliminar cualquier apuesta
- Poblar gameweeks con partidos y odds
- Resolver apuestas de gameweeks finalizados

**UI Admin** (en DashboardModal):
- Sección "Admin Actions" con botones para:
  - Poblar próximo gameweek
  - (Futuro: Resolver gameweeks)

---

## Cálculo de Odds

### Algoritmo

Las odds se calculan basándose en:

1. **Posición en la tabla**: Equipos más arriba tienen ventaja
2. **Puntos totales**: Diferencia de puntos acumulados
3. **Forma reciente**: Últimos 5 partidos (racha de victorias/derrotas)
4. **Factor local**: Ventaja del 10% para el equipo local

**Fórmula simplificada**:
```
strength = (rank_factor × 0.4) + (points_factor × 0.3) + (form_factor × 0.3)
home_strength = team1_strength × 1.1  // Factor local
away_strength = team2_strength

// Normalizar y convertir a odds decimales
```

**Implementación**: `src/lib/odds/calculator.ts`

---

## Endpoints API

### Públicos (requieren autenticación)

#### `GET /api/league`
Retorna datos completos de la liga desde FPL API.

**Response**:
```json
{
  "standings": [...],
  "matches": [...],
  "league_entries": [...]
}
```

#### `GET /api/participants`
Lista de participantes de la liga.

**Response**:
```json
{
  "participants": [
    { "entry_id": 123, "entry_name": "Team Name", "player_name": "Player Name" }
  ]
}
```

#### `GET /api/stats`
Estadísticas globales de la aplicación.

**Response**:
```json
{
  "totalRealPool": 1000,
  "totalFederalPool": 5000,
  "totalBets": 42,
  "activeBets": 12
}
```

### Apuestas

#### `POST /api/bets/create`
Crea una nueva apuesta.

**Body**:
```json
{
  "gameweek": 10,
  "match_league_entry_1": 123,
  "match_league_entry_2": 456,
  "predicted_result": "home",
  "amount": 100,
  "odds": 2.5
}
```

#### `DELETE /api/bets/delete?betId=xxx`
Elimina una apuesta pending.

#### `GET /api/bets/user-bet?gameweek=X&entry1=Y&entry2=Z`
Obtiene la apuesta del usuario para un partido específico.

#### `POST /api/bets/resolve`
Resuelve apuestas de un gameweek (admin).

**Body**:
```json
{
  "gameweek": 10
}
```

### Admin

#### `POST /api/admin/populate-gw`
Pobla el próximo gameweek con partidos y odds.

**Body** (opcional):
```json
{
  "gameweek": 11
}
```

---

## Patrones y Convenciones

### 1. Manejo de Errores
- Nunca usar `alert()` o `confirm()` - usar UI apropiada
- Siempre usar try-catch en API routes
- Retornar códigos HTTP apropiados (400, 401, 403, 404, 500)
- Loguear errores importantes con `console.error()`

### 2. Autenticación
```typescript
// En API routes (server-side)
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// En componentes (client-side)
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### 3. Verificación de Admin
```typescript
import { ROLES } from "@/constants/roles";

const { data: profile } = await supabase
  .from("profiles")
  .select("role_id")
  .eq("id", user.id)
  .single();

if (profile?.role_id !== ROLES.ADMIN) {
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}
```

### 4. Uso de Context
```typescript
// En componentes
import { useLeague } from "@/contexts/LeagueContext";

function MyComponent() {
  const { teams, matches, standings, getTeamName, isDataLoaded } = useLeague();
  
  // NO hacer fetch directo a /api/league
  // Usar los datos del context
}
```

### 5. Custom Hooks
Los hooks personalizados encapsulan lógica reutilizable:
- `useDashboardData`: Carga perfil, apuestas, detecta admin
- `useUserStats`: Calcula estadísticas de apuestas
- `useTeamMapping`: Mapea IDs de equipos a nombres

---

## Flujo de Trabajo de Desarrollo

### 1. Agregar Nueva Feature
1. Definir tipos en `src/types/`
2. Crear API endpoint en `src/app/api/`
3. Agregar lógica de negocio en `src/lib/`
4. Crear/actualizar componente en `src/components/`
5. Actualizar Context si es necesario
6. Probar con usuarios normales y admin

### 2. Modificar Base de Datos
1. Hacer cambios en Supabase Dashboard
2. Actualizar tipos en `src/types/`
3. Actualizar RLS policies si es necesario
4. Actualizar queries en API routes
5. Probar permisos con diferentes roles

### 3. Agregar Endpoint de Admin
1. Crear en `src/app/api/admin/`
2. Verificar `role_id === ROLES.ADMIN`
3. Documentar en este archivo
4. Agregar botón/acción en `DashboardModal.tsx`

---

## Testing y Debugging

### Logs Importantes
- API routes loguean operaciones importantes
- Errores se loguean con `console.error()`
- LeagueContext loguea carga de datos

### Verificar RLS
Si una query falla sin error aparente, verificar:
1. ¿El usuario está autenticado?
2. ¿Las políticas RLS permiten la operación?
3. ¿El `role_id` es correcto?

### Debugging de Apuestas
1. Verificar que `gameweek_matches` tenga el partido
2. Verificar que `is_active=true` para el gameweek
3. Verificar balance del usuario
4. Verificar que no tenga apuesta previa

---

## Próximos Pasos / TODOs

- [x] Refactorizar `DashboardModal.tsx` en sub-componentes ✅
- [ ] Agregar tests unitarios para sub-componentes del dashboard
- [ ] Agregar tests unitarios para cálculo de odds
- [ ] Implementar página de historial de apuestas en landing
- [ ] Implementar sistema de notificaciones en tiempo real
- [ ] Mejorar UI de estadísticas con gráficos
- [ ] Implementar sistema de achievements/badges
- [ ] Agregar límites de apuesta por usuario/gameweek

---

## Recursos

- **FPL API**: https://draft.premierleague.com/api/league/1651/details
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

