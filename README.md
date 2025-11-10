# LEX Altius · Suite Jurídica Corporativa para Bolivia

![LEX Altius Logo](./public/logo.svg)

**LEX Altius** es una plataforma corporativa desarrollada por [Altius Ignite](https://www.altiusignite.com) para estudios jurídicos bolivianos que necesitan centralizar expedientes con NUREJ, documentación respaldatoria y flujos de cobranza en Bolivianos. La suite combina un frontend moderno con un backend seguro sobre Supabase para garantizar trazabilidad procesal, cumplimiento normativo y colaboración con clientes y contrapartes.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-v2-green?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Primeros Pasos](#primeros-pasos)
  - [Requisitos](#requisitos)
  - [Instalación](#instalación)
  - [Configuración de Supabase](#configuración-de-supabase)
  - [Ejecutar la Aplicación](#ejecutar-la-aplicación)
- [Scripts Disponibles](#scripts-disponibles)
- [Testing](#testing)
- [Seguridad](#seguridad)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

---

## Visión General

LEX Altius nace de la necesidad de modernizar la gestión legal en Bolivia, entregando a las firmas un espacio único para coordinar equipos, clientes y contrapartes bajo los criterios del Código Civil, el Código Procesal Civil y la normativa sectorial boliviana. Desde la admisión del expediente en un Juzgado Público hasta la ejecución y cierre, cada etapa queda registrada con contexto, responsables y respaldos financieros.

El sistema se ejecuta como una aplicación altamente interactiva con soporte SSR/SSG gracias a Next.js 15. La persistencia, autenticación y almacenamiento seguro se gestionan mediante Supabase (PostgreSQL), lo que permite habilitar controles de acceso finos, auditoría continua y un despliegue compatible con infraestructuras locales o en la nube.


## Diseño de Interfaz

LEX Altius adopta la identidad visual de [Altius Ignite](https://www.altiusignite.com): gradientes en tonos navy y cyan, acentos aurora y tipografía Inter. La paleta definida en `tailwind.config.ts` (bloque `altius`) permite replicar los patrones de luz sobre fondos oscuros utilizados en el sitio oficial, manteniendo contraste AA y legibilidad en dashboards corporativos.
## Características Principales

| Característica | Descripción |
| :--- | :--- |
| **Gestión de Expedientes** | Creación, edición y seguimiento de expedientes con NUREJ, materia, juzgado, distrito judicial y contrapartes conforme a la práctica boliviana. |
| **Sistema de Roles** | Roles predefinidos (`admin_firma`, `abogado`, `cliente`) con un sistema de permisos granular basado en RLS de Supabase. |
| **Portal Cliente** | Acceso seguro para clientes a través de *magic links*, permitiéndoles ver el estado de sus casos, documentos y timeline. |
| **Timeline Procesal** | Visualización cronológica de las actuaciones bajo el Código Procesal Civil, con plantillas adaptadas a materias civil, comercial, laboral y familia bolivianas. |
| **Gestión Documental** | Carga de memoriales, proveídos, oficios y pruebas; control de versiones, visibilidad configurable y almacenamiento seguro en Supabase Storage. |
| **Notas y Colaboración** | Sistema de notas públicas y privadas por caso, con un editor de texto enriquecido para facilitar la colaboración interna. |
| **Solicitudes de Información** | Módulo para que los abogados soliciten información o documentos a los clientes, y viceversa, con seguimiento de estado. |
| **Panel Administrativo** | Dashboard con KPIs sobre carga procesal, cumplimientos y cobranza en Bolivianos, segmentado por área y responsable. |
| **Sistema de Auditoría** | Registro inmutable de todas las acciones críticas realizadas en el sistema para cumplimiento y seguridad. |
| **Notificaciones Automatizadas** | Envío de correos electrónicos para eventos importantes (nuevos casos, vencimientos, solicitudes) a través de Edge Functions. |
| **Seguridad Avanzada** | Protección contra ataques comunes (XSS, SQLi), gestión de sesiones, bloqueo de IPs y headers de seguridad. |
| **Testing Integral** | Suite de tests unitarios (Vitest) y e2e (Playwright) que garantizan la calidad y estabilidad del código. |

## Stack Tecnológico

- **Framework Frontend**: [Next.js 15](https://nextjs.org/) (con App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (modo estricto)
- **Backend & Base de Datos**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, RLS, Edge Functions)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Gestión de Formularios**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) para validación
- **Componentes UI**: [Radix UI](https://www.radix-ui.com/)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Visualización de Datos**: [Recharts](https://recharts.org/)
- **Testing Unitario**: [Vitest](https://vitest.dev/)
- **Testing E2E**: [Playwright](https://playwright.dev/)
- **Linting**: [ESLint](https://eslint.org/)
- **Formato de Código**: [Prettier](https://prettier.io/)

## Estructura del Proyecto

El proyecto sigue una estructura modular y escalable, optimizada para el App Router de Next.js.

```
/lex-altius
├── /public                 # Archivos estáticos (imágenes, fuentes)
├── /scripts                # Scripts de utilidad (ej. test.sh)
├── /src
│   ├── /app                # Rutas de la aplicación (App Router)
│   │   ├── /(auth)         # Rutas de autenticación
│   │   ├── /admin          # Rutas de administración
│   │   ├── /cases          # Rutas de gestión de casos
│   │   ├── /client-portal  # Portal del cliente
│   │   └── ...             # Otras rutas y layouts
│   ├── /components         # Componentes React reutilizables
│   │   ├── /ui             # Componentes base de shadcn/ui
│   │   └── ...             # Componentes de la aplicación
│   ├── /hooks              # Hooks personalizados de React
│   ├── /lib                # Librerías, utilidades y lógica de negocio
│   │   ├── /actions        # Server Actions
│   │   ├── /auth           # Lógica de autenticación y roles
│   │   ├── /notifications  # Lógica de notificaciones
│   │   ├── /security       # Middleware y utilidades de seguridad
│   │   ├── /supabase       # Clientes y tipos de Supabase
│   │   └── /validators     # Esquemas de validación con Zod
│   └── /styles             # Estilos globales
├── /supabase
│   ├── /functions          # Edge Functions (Deno)
│   ├── /migrations         # Migraciones de base de datos SQL
│   └── seed.sql            # Datos de prueba iniciales
├── /tests
│   ├── /e2e                # Tests End-to-End con Playwright
│   ├── /unit               # Tests unitarios con Vitest
│   └── ...                 # Archivos de configuración de tests
├── .env.example            # Plantilla de variables de entorno
├── next.config.mjs         # Configuración de Next.js
├── package.json            # Dependencias y scripts
├── tsconfig.json           # Configuración de TypeScript
└── ...                     # Otros archivos de configuración
```

## Primeros Pasos

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Requisitos

- [Node.js](https://nodejs.org/) >= 18.0.0
- [npm](https://www.npmjs.com/) >= 8.0.0
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Docker](https://www.docker.com/) (para Supabase local)

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/altiusignite/lex-altius.git
    cd lex-altius
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

### Configuración de Supabase

1.  **Inicia los servicios de Supabase localmente:**
    ```bash
    supabase start
    ```
    Al finalizar, la terminal te proporcionará las credenciales locales (URL de la API, `anon_key`, `service_role_key`).

2.  **Copia el archivo de entorno:**
    ```bash
    cp .env.example .env.local
    ```

3.  **Actualiza `.env.local`** con las credenciales proporcionadas por la Supabase CLI.

4.  **Aplica las migraciones:**
    ```bash
    supabase db reset
    ```
    El comando limpia la base de datos local y aplica todas las migraciones en orden. El archivo `seed.sql` queda disponible si necesitas agregar inserciones simples adicionales.

5.  **Carga los datos de prueba y usuarios demo:**
    ```bash
    pnpm run seed:demo
    # o, si prefieres no usar los scripts de package.json:
    npx tsx scripts/seed-auth-users.ts
    ```
    Este script utiliza la `SUPABASE_SERVICE_ROLE_KEY` configurada en tu `.env.local` para crear los usuarios de ejemplo en `auth.users` y poblar las tablas relacionadas (`profiles`, `cases`, etc.).

### Ejecutar la Aplicación

Una vez completada la instalación y configuración, puedes iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

**Credenciales de prueba (definidas para el entorno local):**
- **Admin:** `admin@altiusignite.com` / `admin123`
- **Analista:** `analista@altiusignite.com` / `analista123`
- **Abogado:** `abogado@altiusignite.com` / `password123`
- **Cliente:** `cliente@altiusignite.com` / `client123`

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia un servidor de producción.
- `npm run lint`: Ejecuta ESLint para analizar el código.
- `npm run test`: Ejecuta la suite completa de tests (unitarios y e2e).
- `npm run test:unit`: Ejecuta solo los tests unitarios.
- `npm run test:e2e`: Ejecuta solo los tests e2e.
- `pnpm run seed:demo`: Crea usuarios demo con la Service Role Key y vuelve a cargar los datos de ejemplo (puedes usar `npx tsx scripts/seed-auth-users.ts`).

Para una lista completa, consulta la sección `scripts` en `package.json`.

## Testing

El proyecto tiene una cobertura de testing exhaustiva para garantizar la calidad y la estabilidad.

- **Unit Tests**: Se utilizan para probar funciones individuales, Server Actions y validadores de forma aislada. Se ejecutan con `npm run test:unit`.
- **E2E Tests**: Simulan flujos de usuario completos en un entorno de navegador real. Se ejecutan con `npm run test:e2e`.
- **Coverage**: Para generar un reporte de cobertura de código, ejecuta `npm run test:coverage`.

## Seguridad

La seguridad es un pilar fundamental de LEX Altius. Se han implementado múltiples capas de protección:

- **Row Level Security (RLS)**: Todas las consultas a la base de datos están protegidas por políticas de RLS en Supabase, asegurando que los usuarios solo puedan acceder a los datos que les corresponden.
- **Middleware de Seguridad**: Un middleware en Next.js inspecciona las peticiones entrantes para detectar y bloquear patrones de ataques comunes.
- **Auditoría Completa**: Todas las acciones críticas quedan registradas en una tabla de auditoría inmutable.
- **Headers de Seguridad**: Se utilizan headers HTTP estándar de la industria para proteger la aplicación contra ataques de clickjacking, XSS, etc.
- **Gestión de Sesiones Segura**: Control de sesiones activas, detección de anomalías y protección contra secuestro de sesiones.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, lee el archivo `CONTRIBUTING.md` para conocer las guías de estilo de código y el proceso para enviar pull requests.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
