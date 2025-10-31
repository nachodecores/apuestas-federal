# Plan de Pruebas Manuales - Apuestas Federal

## Objetivo
Validar las funcionalidades críticas de la aplicación de apuestas de fantasy football.

## Alcance
Este documento cubre las funcionalidades críticas:
- Autenticación (login/logout)
- Creación de apuestas
- Eliminación de apuestas
- Dashboard de usuario
- Funcionalidades de admin
- Permisos y roles

---

## 1. Casos de Prueba de Autenticación

### TC-AUTH-001: Login con credenciales válidas
**Descripción:** Verificar que un usuario puede iniciar sesión correctamente.

**Pre-condiciones:**
- Usuario registrado en el sistema
- Navegador abierto en la página principal

**Pasos:**
1. Hacer clic en "Iniciar Sesión" en el Header
2. Ingresar email válido
3. Ingresar contraseña válida
4. Hacer clic en "Iniciar Sesión"

**Resultado Esperado:**
- Usuario se autentica exitosamente
- Header muestra el avatar del usuario
- Botón "Dashboard" aparece en el Header

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-AUTH-002: Login con credenciales inválidas
**Descripción:** Verificar que el sistema rechaza credenciales incorrectas.

**Pre-condiciones:**
- Navegador abierto en la página principal

**Pasos:**
1. Hacer clic en "Iniciar Sesión" en el Header
2. Ingresar email válido
3. Ingresar contraseña incorrecta
4. Hacer clic en "Iniciar Sesión"

**Resultado Esperado:**
- Sistema muestra mensaje de error
- Usuario no se autentica

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-AUTH-003: Logout
**Descripción:** Verificar que un usuario puede cerrar sesión correctamente.

**Pre-condiciones:**
- Usuario autenticado

**Pasos:**
1. Hacer clic en el avatar del usuario en el Header
2. Hacer clic en "Dashboard"
3. En el DashboardModal, hacer clic en "Cerrar Sesión"

**Resultado Esperado:**
- Usuario cierra sesión exitosamente
- Header muestra botón "Iniciar Sesión"
- DashboardModal se cierra
- Datos del usuario se limpian de la memoria

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-AUTH-004: Persistencia de sesión
**Descripción:** Verificar que la sesión persiste al recargar la página.

**Pre-condiciones:**
- Usuario autenticado

**Pasos:**
1. Estar autenticado en la aplicación
2. Recargar la página (F5)

**Resultado Esperado:**
- Usuario sigue autenticado después de recargar
- Header sigue mostrando avatar y botón "Dashboard"

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

## 2. Casos de Prueba de Apuestas

### TC-BET-001: Crear apuesta en partido disponible
**Descripción:** Verificar que un usuario puede crear una apuesta en un partido próximo.

**Pre-condiciones:**
- Usuario autenticado
- Existe al menos un partido disponible para apostar
- Usuario tiene saldo disponible (federal_balance > 0)

**Pasos:**
1. En la página principal, localizar sección "Próximos Partidos"
2. Seleccionar un resultado (Local/Empate/Visitante) en una MatchCard
3. Ingresar monto de apuesta
4. Hacer clic en "Apostar"

**Resultado Esperado:**
- Apuesta se crea exitosamente
- MatchCard muestra confirmación con el monto apostado
- Balance del usuario se reduce por el monto apostado
- Odds y ganancia potencial se calculan correctamente

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-BET-002: Ver apuesta activa en dashboard
**Descripción:** Verificar que las apuestas activas se muestran en el dashboard.

**Pre-condiciones:**
- Usuario autenticado
- Usuario tiene al menos una apuesta activa (status='pending')

**Pasos:**
1. Hacer clic en el avatar del usuario en el Header
2. Hacer clic en "Dashboard"
3. Localizar sección "Apuestas Activas"

**Resultado Esperado:**
- DashboardModal se abre
- Sección "Apuestas Activas" muestra tabla con las apuestas
- Cada apuesta muestra: Partido, Predicción, Apostado, Posible ganancia, Cuota
- Estadísticas muestran: Número de apuestas activas, Total apostado, Ganancia potencial

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-BET-003: Eliminar apuesta propia
**Descripción:** Verificar que un usuario puede eliminar su propia apuesta activa.

**Pre-condiciones:**
- Usuario autenticado
- Usuario tiene al menos una apuesta activa

**Pasos:**
1. Abrir DashboardModal
2. Localizar una apuesta activa en la tabla
3. Hacer clic en el botón "×" (eliminar) de la apuesta
4. Esperar confirmación

**Resultado Esperado:**
- Apuesta se elimina de la base de datos
- Apuesta desaparece de la tabla inmediatamente (sin recargar)
- Balance del usuario aumenta por el monto apostado (reembolso)
- Estadísticas se actualizan automáticamente

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-BET-004: Validar actualización de balance
**Descripción:** Verificar que el balance se actualiza correctamente al crear/eliminar apuestas.

**Pre-condiciones:**
- Usuario autenticado
- Conocer el balance inicial del usuario

**Pasos:**
1. Anotar balance inicial (federal_balance)
2. Crear una apuesta de ₣100
3. Verificar nuevo balance
4. Eliminar la apuesta
5. Verificar balance final

**Resultado Esperado:**
- Después de crear apuesta: balance = inicial - 100
- Después de eliminar apuesta: balance = inicial (reembolso completo)

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

## 3. Casos de Prueba de Dashboard

### TC-DASH-001: Visualizar estadísticas correctas
**Descripción:** Verificar que las estadísticas del dashboard son correctas.

**Pre-condiciones:**
- Usuario autenticado con apuestas activas conocidas

**Pasos:**
1. Abrir DashboardModal
2. Revisar sección de estadísticas
3. Comparar con datos reales en base de datos

**Resultado Esperado:**
- "Apuestas Activas" = número correcto de apuestas con status='pending'
- "Apostado" = suma correcta de montos de apuestas activas
- "Ganancia Potencial" = suma correcta de potential_win de apuestas activas

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-DASH-002: Cambio de contraseña
**Descripción:** Verificar que un usuario puede cambiar su contraseña.

**Pre-condiciones:**
- Usuario autenticado

**Pasos:**
1. Abrir DashboardModal
2. Hacer clic en "Cambiar Contraseña"
3. Ingresar nueva contraseña
4. Confirmar nueva contraseña
5. Hacer clic en "Cambiar Contraseña"
6. Cerrar sesión
7. Intentar login con nueva contraseña

**Resultado Esperado:**
- Modal de cambio de contraseña se abre
- Contraseña se actualiza exitosamente
- Login con nueva contraseña funciona correctamente

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-DASH-003: Actualización en tiempo real al eliminar apuesta
**Descripción:** Verificar que el dashboard se actualiza automáticamente sin recargar.

**Pre-condiciones:**
- Usuario autenticado con al menos 2 apuestas activas

**Pasos:**
1. Abrir DashboardModal
2. Anotar número de apuestas activas y total apostado
3. Eliminar una apuesta
4. Observar la UI (NO recargar la página)

**Resultado Esperado:**
- Apuesta desaparece de la tabla inmediatamente
- Número de "Apuestas Activas" disminuye en 1
- "Apostado" se reduce por el monto de la apuesta eliminada
- "Ganancia Potencial" se reduce correspondientemente
- No se requiere recargar la página

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-DASH-004: Cambio de usuario limpia datos
**Descripción:** Verificar que al cambiar de usuario, los datos del usuario anterior se limpian.

**Pre-condiciones:**
- Dos usuarios registrados (Usuario A y Usuario B)

**Pasos:**
1. Iniciar sesión como Usuario A
2. Abrir DashboardModal y ver apuestas de Usuario A
3. Cerrar sesión
4. Iniciar sesión como Usuario B
5. Abrir DashboardModal

**Resultado Esperado:**
- DashboardModal muestra datos de Usuario B, NO de Usuario A
- Apuestas mostradas pertenecen solo a Usuario B
- No hay mezcla de datos entre usuarios

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

## 4. Casos de Prueba de Admin

### TC-ADMIN-001: Poblar próxima gameweek con odds
**Descripción:** Verificar que un admin puede poblar la próxima gameweek con odds.

**Pre-condiciones:**
- Usuario autenticado con role_id = 2 (ADMIN)
- Existe una próxima gameweek disponible en la API de FPL

**Pasos:**
1. Abrir DashboardModal como admin
2. Localizar botón "Poblar próxima GW con odds" en el footer
3. Hacer clic en el botón
4. Verificar en base de datos tabla `gameweek_matches`

**Resultado Esperado:**
- Se crean nuevos registros en `gameweek_matches` para la próxima gameweek
- Cada partido tiene odds calculados (home_odds, draw_odds, away_odds)
- Solo la gameweek con número más alto tiene `is_active = true`
- Gameweeks anteriores tienen `is_active = false`

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-ADMIN-002: Ver todas las apuestas de todos los usuarios
**Descripción:** Verificar que un admin puede ver apuestas de todos los usuarios.

**Pre-condiciones:**
- Usuario autenticado con role_id = 2 (ADMIN)
- Existen apuestas de múltiples usuarios en el sistema

**Pasos:**
1. Abrir DashboardModal como admin
2. Localizar tabla "Todas las Apuestas Activas"
3. Revisar columna "Usuario"

**Resultado Esperado:**
- Tabla muestra apuestas de TODOS los usuarios
- Columna "Usuario" muestra iniciales de cada usuario
- Se pueden ver apuestas de cualquier usuario, no solo las propias

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-ADMIN-003: Eliminar apuesta de cualquier usuario
**Descripción:** Verificar que un admin puede eliminar apuestas de cualquier usuario.

**Pre-condiciones:**
- Usuario autenticado con role_id = 2 (ADMIN)
- Existe al menos una apuesta activa de otro usuario (Usuario B)

**Pasos:**
1. Iniciar sesión como Admin (ej: Ignacio de Cores)
2. Abrir DashboardModal
3. Localizar una apuesta de otro usuario (ej: Juan Francisco Sienra)
4. Hacer clic en el botón "×" (eliminar) de esa apuesta
5. Verificar en base de datos

**Resultado Esperado:**
- Apuesta se elimina exitosamente de la base de datos
- Transacciones relacionadas se eliminan primero
- Apuesta desaparece de la tabla del dashboard
- Balance del usuario dueño de la apuesta se actualiza (reembolso)
- NO hay error de foreign key constraint
- NO hay error de permisos RLS

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-ADMIN-004: Validar permisos de admin
**Descripción:** Verificar que solo usuarios con role_id = 2 ven funciones admin.

**Pre-condiciones:**
- Usuario autenticado con role_id = 1 (USER normal)

**Pasos:**
1. Iniciar sesión como usuario normal
2. Abrir DashboardModal
3. Buscar botón "Poblar próxima GW con odds"
4. Buscar columna "Usuario" en tabla de apuestas

**Resultado Esperado:**
- Botón "Poblar próxima GW con odds" NO aparece
- Columna "Usuario" NO aparece en tabla
- Solo se ven apuestas propias, no de otros usuarios

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

## 5. Casos de Prueba de Permisos

### TC-PERM-001: Usuario normal no puede acceder a funciones admin
**Descripción:** Verificar que usuarios normales no pueden ejecutar operaciones admin.

**Pre-condiciones:**
- Usuario autenticado con role_id = 1 (USER)

**Pasos:**
1. Intentar acceder manualmente a `/api/admin/populate-gw` via POST request
2. Verificar respuesta del servidor

**Resultado Esperado:**
- API devuelve error 403 (Forbidden) o 401 (Unauthorized)
- Operación NO se ejecuta

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-PERM-002: Usuario normal solo ve sus propias apuestas
**Descripción:** Verificar que RLS funciona correctamente para usuarios normales.

**Pre-condiciones:**
- Usuario A autenticado (role_id = 1)
- Existe Usuario B con apuestas activas

**Pasos:**
1. Iniciar sesión como Usuario A
2. Abrir DashboardModal
3. Revisar tabla de apuestas activas

**Resultado Esperado:**
- Solo se muestran apuestas del Usuario A
- NO se ven apuestas del Usuario B
- RLS bloquea acceso a apuestas de otros usuarios

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-PERM-003: Usuario normal no puede eliminar apuestas de otros
**Descripción:** Verificar que usuarios normales no pueden eliminar apuestas ajenas.

**Pre-condiciones:**
- Usuario A autenticado (role_id = 1)
- Existe una apuesta activa del Usuario B (bet_id conocido)

**Pasos:**
1. Iniciar sesión como Usuario A
2. Intentar eliminar apuesta del Usuario B via API call manual:
   - POST `/api/bets/delete`
   - Body: `{"betId": "<bet_id_de_usuario_B>"}`

**Resultado Esperado:**
- API devuelve error 404 (Apuesta no encontrada) o 403 (Forbidden)
- Apuesta NO se elimina
- RLS protege apuestas de otros usuarios

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

### TC-PERM-004: Admin puede ver y eliminar cualquier apuesta
**Descripción:** Verificar que admins tienen permisos completos.

**Pre-condiciones:**
- Admin autenticado (role_id = 2)
- Existen apuestas de múltiples usuarios

**Pasos:**
1. Iniciar sesión como Admin
2. Abrir DashboardModal
3. Verificar que se ven todas las apuestas
4. Eliminar una apuesta de otro usuario
5. Verificar eliminación en base de datos

**Resultado Esperado:**
- Admin ve todas las apuestas de todos los usuarios
- Admin puede eliminar cualquier apuesta exitosamente
- Service Role Key bypass RLS correctamente
- Transacciones se eliminan antes de apuestas

**Estado:** [ ] Pendiente | [x] Pasó | [ ] Falló

---

## Resumen de Ejecución

| Categoría | Total | Pasó | Falló | Pendiente |
|-----------|-------|------|-------|-----------|
| Autenticación | 4 | 4 | 0 | 0 |
| Apuestas | 4 | 4 | 0 | 0 |
| Dashboard | 4 | 4 | 0 | 0 |
| Admin | 4 | 4 | 0 | 0 |
| Permisos | 4 | 4 | 0 | 0 |
| **TOTAL** | **20** | **20** | **0** | **0** |

---

## Notas de Ejecución

### Fecha: ___________
### Ejecutado por: ___________
### Versión de la app: ___________

**Observaciones generales:**
```
[Agregar notas, bugs encontrados, mejoras sugeridas, etc.]
```

---

## Bugs Encontrados

| ID | Descripción | Severidad | Estado |
|----|-------------|-----------|--------|
| | | | |

**Leyenda de Severidad:**
- **Crítico**: Bloquea funcionalidad principal
- **Alto**: Afecta funcionalidad importante
- **Medio**: Afecta usabilidad
- **Bajo**: Cosmético o menor

