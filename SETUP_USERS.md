# Crear los 10 usuarios en Supabase

## Opción 1: Usar el Authentication panel (MÁS FÁCIL)

1. **Andá a** tu proyecto en Supabase
2. **Click en "Authentication"** (en el menú izquierdo)
3. **Click en "Users"**
4. **Click en "Add user"** → "Create new user"
5. **Para cada usuario, ingresá:**
   - Email: `[league_entry_id]@bolichefederal.com`
   - Password: `1234`
   - Auto Confirm User: ✅ **SÍ** (importante!)

**Lista de usuarios a crear:**

| Nombre | Email | Password |
|--------|-------|----------|
| Chacho Bonino | 6753@bolichefederal.com | 1234 |
| Marcos Arocena | 5156@bolichefederal.com | 1234 |
| Ignacio de Cores | 38904@bolichefederal.com | 1234 |
| Manuel Domenech | 44346@bolichefederal.com | 1234 |
| Juan Dehl | 54556@bolichefederal.com | 1234 |
| Juan Francisco Sienra | 5769@bolichefederal.com | 1234 |
| Felipe Migues | 5997@bolichefederal.com | 1234 |
| Joaquin Sarachaga | 6494@bolichefederal.com | 1234 |
| Javier Villaamil | 6479@bolichefederal.com | 1234 |
| Ángel Cal | 5865@bolichefederal.com | 1234 |

---

## Opción 2: SQL (MÁS RÁPIDO pero requiere Service Role Key)

Si tenés acceso a la Service Role Key de Supabase, podés ejecutar el script `init-users` desde el navegador:

1. Andá a: `http://localhost:3000/api/init-users`
2. Debería crear todos los usuarios automáticamente

(Nota: Esto requiere configurar SUPABASE_SERVICE_ROLE_KEY en .env.local)

