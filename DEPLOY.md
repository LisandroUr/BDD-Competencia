# Guía de Despliegue (Deploy) - Render y Vercel

Este documento explica cómo desplegar la plataforma completa: el **Backend** en **Render** y el **Frontend** en **Vercel**.

---

## 🚀 Despliegue del Backend (en Render)

Render es ideal para alojar servicios backend de Node.js. Sigue estos pasos para configurarlo:

### 1. Crear el Web Service en Render
1. Ve a tu panel de [Render](https://dashboard.render.com/) e inicia sesión.
2. Haz clic en **New** -> **Web Service**.
3. Conecta tu repositorio de GitHub `BDD-Competencia`.
4. Configura los siguientes campos:
   - **Name**: `bdd-competencia-backend` (o el nombre que prefieras).
   - **Environment**: `Node`
   - **Region**: Selecciona la más cercana (ej. `Ohio (us-east-2)` u `Oregon`).
   - **Branch**: `main`
   - **Root Directory**: `backend` *(¡Muy importante para que solo despliegue el backend!)*
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2. Base de datos SQLite y Persistencia en Render (¡IMPORTANTE!)
Por defecto, los discos de Render son **efímeros**. Si usas el archivo `database.sqlite` por defecto, **los datos se borrarán cada vez que el servidor se reinicie o se redespliegue** (lo cual ocurre al menos una vez al día).

Para evitar esto, tienes dos opciones:

#### Opción A: Usar un disco persistente en Render (Recomendado para mantener SQLite)
1. En la página de configuración del Web Service en Render, ve a la pestaña **Disks**.
2. Haz clic en **Add Disk**.
3. Configura el disco:
   - **Name**: `sqlite-storage`
   - **Mount Path**: `/data`
   - **Size**: `1 GB` (es suficiente y entra en el plan gratuito).
4. Ve a la pestaña **Environment** en Render y añade la siguiente variable de entorno:
   - `DATABASE_STORAGE` = `/data/database.sqlite`
5. *Nota*: Asegúrate de que el backend lea esta variable. El código de conexión en `backend/config/database.js` ya está adaptado (o se adaptará) para usar `process.env.DATABASE_STORAGE` si existe.

#### Opción B: Cambiar a Render PostgreSQL (Para producción real)
Si prefieres un motor SQL más robusto en lugar de SQLite:
1. Crea una base de datos PostgreSQL gratuita en Render (**New** -> **PostgreSQL**).
2. Copia la **External Database URL**.
3. En el Web Service de tu backend, agrega la variable de entorno:
   - `DATABASE_URL` = (Pega la URL de la base de datos PostgreSQL).
4. El backend deberá actualizarse en `backend/config/database.js` para usar el dialecto `postgres` cuando detecte `DATABASE_URL`.

---

## 🎨 Despliegue del Frontend (en Vercel)

Vercel está optimizado para aplicaciones de React (Vite).

### 1. Crear el Proyecto en Vercel
1. Ve al panel de [Vercel](https://vercel.com/) e inicia sesión.
2. Haz clic en **Add New** -> **Project**.
3. Importa tu repositorio `BDD-Competencia` desde tu GitHub conectado.
4. En **Configure Project**, realiza los siguientes ajustes cruciales:
   - **Framework Preset**: `Vite` (lo detectará automáticamente).
   - **Root Directory**: Haz clic en **Edit** y selecciona la carpeta **`frontend`**.
5. Despliega la sección **Build and Development Settings** (opcional, por defecto son correctas):
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Abre la sección **Environment Variables** y añade la variable para conectar con tu backend:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://tu-backend-en-render.onrender.com` (reemplaza con la URL que te dé Render para tu Web Service).
7. Haz clic en **Deploy**.

---

## ⚙️ Variables de Entorno de Producción

| Servicio | Variable de Entorno | Valor de Ejemplo | Descripción |
| :--- | :--- | :--- | :--- |
| **Render (Backend)** | `PORT` | `10000` (Render lo define automáticamente) | Puerto del servidor backend |
| **Render (Backend)** | `NODE_ENV` | `production` | Modo de Node |
| **Render (Backend)** | `DATABASE_STORAGE` | `/data/database.sqlite` | Ruta física de persistencia SQLite |
| **Vercel (Frontend)** | `VITE_API_URL` | `https://bdd-competencia-backend.onrender.com` | URL de la API del Backend |
