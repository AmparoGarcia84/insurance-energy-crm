# Insurance & Energy CRM

CRM para una correduría de seguros y energía. Gestiona clientes, pólizas, contratos de energía, pipeline de ventas, casos/incidencias y control de jornada laboral.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Base de datos | PostgreSQL 17 |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| i18n | i18next (ES / EN) |
| Tests | Vitest + React Testing Library |

## Estructura del monorepo

```
insurance-energy-crm/
├── frontend/          # React app
├── backend/           # REST API
│   ├── db_provision/  # Script de datos de demo
│   └── prisma/        # Schema y migraciones
├── shared/            # Tipos TypeScript compartidos
├── docker-compose.yml
└── Dockerfile
```

---

## Requisitos previos

- **Node.js** v20+
- **OrbStack** (recomendado en macOS) o Docker Desktop

> **Nota macOS — fallo al descargar imágenes Docker:**
> Docker Hub usa IPs de Cloudflare (`172.64.x.x`) que pueden entrar en conflicto con la red interna de la VM. Si `docker pull` falla con `context deadline exceeded`, descarga las imágenes base desde AWS ECR antes de hacer `docker compose up`:
> ```bash
> docker pull public.ecr.aws/docker/library/node:22-alpine
> docker tag public.ecr.aws/docker/library/node:22-alpine node:22-alpine
>
> docker pull public.ecr.aws/docker/library/postgres:17-alpine
> docker tag public.ecr.aws/docker/library/postgres:17-alpine postgres:17-alpine
> ```

---

## Puesta en marcha (primera vez)

**1. Instalar dependencias**

```bash
npm install
```

**2. Configurar variables de entorno del backend**

```bash
cp backend/.env.example backend/.env
```

El `.env` por defecto está listo para desarrollo local, no necesita cambios.

**3. Arrancar la base de datos**

```bash
docker compose up db -d
```

**4. Ejecutar migraciones y cargar datos de demo**

```bash
cd backend && npm run provision
```

Carga clientes, pólizas, contratos de energía, casos, jornadas y usuarios. Es idempotente: se puede ejecutar varias veces sin duplicar datos.

**5. Arrancar el backend**

```bash
cd backend && npm run dev
```

API disponible en `http://localhost:3000`.

**6. Arrancar el frontend**

```bash
cd frontend && npm run dev
```

Aplicación disponible en `http://localhost:5173`.

---

## Desarrollo del día a día

Con la BD ya levantada y los datos cargados:

```bash
docker compose up db -d          # si no está corriendo
cd backend && npm run dev        # terminal 1
cd frontend && npm run dev       # terminal 2
```

---

## Usuarios de demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `mila@crm.com` | `owner1234` | OWNER — acceso total |
| `asesor@crm.com` | `employee1234` | EMPLOYEE — sin permisos de borrado |

---

## Comandos de referencia

```bash
# Base de datos
docker compose up db -d          # arrancar BD en background
docker compose down              # parar servicios
docker compose down -v           # parar y borrar volumen (reset total de BD)

# Backend
npm run dev                      # desarrollo con hot-reload
npm run build                    # compilar TypeScript
npm run provision                # (re)cargar datos de demo
npm run seed                     # solo crear usuarios iniciales

# Frontend
npm run dev                      # desarrollo con hot-reload
npm run test                     # tests en modo watch
npm run test:run                 # tests una sola vez
npm run test:coverage            # informe de cobertura
npm run build                    # build de producción

# Docker completo (BD + backend con provisión automática)
docker compose up                # levanta BD + backend compilado
```

## Reset completo de la base de datos

```bash
docker compose down -v
docker compose up db -d
cd backend && npm run provision
```
