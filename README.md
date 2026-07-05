# FinanzARC - Proyecto de Tesis

FinanzARC es una plataforma web para gestion financiera personal con planes de suscripcion, carga de ingresos/gastos, comprobantes, comparativas y dashboard administrador.

## Estructura

- `frontend/`: aplicacion React + Vite.
- `api/`: API ASP.NET Web API .NET Framework.
- `docs/`: notas de instalacion y base de datos.

## Requisitos

- Node.js y npm.
- Visual Studio 2022 con .NET Framework 4.8.
- SQL Server o base MSSQL online.

## Levantar frontend

```bash
cd frontend
npm install
npm run dev
```

Para compilar:

```bash
npm run build
```

## Levantar API

1. Abrir `api/WebApi.sln` en Visual Studio.
2. Restaurar paquetes NuGet si Visual Studio lo solicita.
3. Configurar `api/Web.config`:
   - `JwtSecret`
   - `FinanzasDBEntities`
4. Ejecutar la API desde Visual Studio.

## Configuracion importante

El archivo `api/Web.config` de este repositorio tiene valores de ejemplo. Reemplazar:

- `TU_SERVIDOR_SQL`
- `TU_BASE`
- `TU_USUARIO`
- `TU_PASSWORD`
- `CAMBIAR_POR_UNA_CLAVE_SEGURA_DE_AL_MENOS_32_CARACTERES`

## Usuario administrador

Para que un usuario vea el dashboard administrador, su `IdRol` debe ser `4`.

```sql
UPDATE dbo.Usuario
SET IdRol = 4
WHERE NombreUsuario = 'NOMBRE_USUARIO_ADMIN';
```

## Rutas principales

- `/`: inicio publico
- `/crear-cuenta`: registro
- `/principal`: dashboard usuario
- `/planes`: suscripciones
- `/archivos`: comprobantes
- `/admin`: dashboard administrador

## Dashboard administrador

Incluye:

- metricas de usuarios y suscripciones
- filtros por mes, anio, usuario, plan, estado y tipo de movimiento
- baja/reactivacion de usuarios
- cambio de plan/rol
- edicion y eliminacion de ingresos/gastos

