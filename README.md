# 📖 Guía de Ejecución y Documentación del Proyecto

Este proyecto es una plataforma completa de gestión de campañas de donación y transferencias atómicas de fondos, diseñada bajo el patrón de arquitectura **MVC (Modelo-Vista-Controlador)**. Está desarrollado con **React** para el frontend, **Node.js con Express** para la API, y **SQLite con Sequelize ORM** para el motor de base de datos.

Cumple con todos los requerimientos técnicos y de base de datos de la cátedra de **Base de Datos II**.

---

## 🚀 Guía Rápida de Ejecución

Para iniciar todo el sistema con un solo comando, hemos creado el script automatizado **`start.sh`** en la raíz del proyecto.

### Paso 1: Abrir la terminal
Asegúrate de estar ubicado en la raíz del proyecto:
```bash
cd /home/lisandro/Documentos/BDD-Competencia
```

### Paso 2: Otorgar permisos de ejecución (solo la primera vez)
Si es la primera vez que vas a usar el script, dale permisos de ejecución con:
```bash
chmod +x start.sh
```

### Paso 3: Iniciar el script
Ejecuta el script:
```bash
./start.sh
```

Una vez ejecutado, verás en pantalla que se levantan ambos servidores de forma paralela. Abre tu navegador en:
* 🌐 **Cliente React**: [http://localhost:5173](http://localhost:5173)
* ⚙️ **Servidor API**: [http://localhost:5000](http://localhost:5000)

---

## 🛠️ ¿Cómo funciona el script `start.sh`?

El archivo [start.sh](file:///home/lisandro/Documentos/BDD-Competencia/start.sh) está diseñado en Bash para automatizar las tareas del desarrollador y del usuario final. Sus funciones clave son:

1. **Limpieza de Puertos Ocupados**:
   Antes de iniciar, ejecuta `fuser -k 5000/tcp` y `fuser -k 5173/tcp`. Esto apaga inmediatamente cualquier proceso colgado que haya quedado usando esos puertos en ejecuciones anteriores, evitando el clásico error *"Address already in use"*.
2. **Ejecución Concurrente**:
   Levanta en segundo plano (`&`) el servidor backend de Node.js en el puerto `5000` y el cliente React de Vite en el puerto `5173`.
3. **Cierre Controlado (`Trap` de señales)**:
   Utiliza la instrucción de Bash `trap cleanup SIGINT SIGTERM EXIT`. Al presionar **`Ctrl + C`** en la terminal, el script ejecuta una función que apaga de forma limpia y ordenada tanto el servidor de React como el de Express, asegurando que ningún puerto quede bloqueado tras cerrar la consola.
4. **Sembrado Automático (Seed)**:
   Al iniciar, el backend verifica si la base de datos SQLite tiene datos. Si está vacía, genera automáticamente campañas y transacciones de prueba para que la plataforma tenga datos visibles desde el primer segundo.

---

## 💾 Detalles del Motor de Base de Datos y Mapeo SQL

### 1. Ubicación del archivo de la Base de Datos
* La base de datos es un archivo físico local ubicado en:
  `[raiz-proyecto]/backend/database.sqlite`
* Puedes abrir este archivo directamente en **DBeaver** creando una conexión de tipo **SQLite** y seleccionando dicha ruta.

### 2. Vista SQL Agregada: `CampaignTotals`
* **Implementación**: Definida mediante código SQL puro e inicializada durante el inicio en [backend/models/index.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/models/index.js).
* **Funcionalidad**: Utiliza funciones agregadas como `SUM(amount)` y `COUNT(id)` agrupadas por campaña para resolver el balance neto actual (`current_balance = total_donations - total_transfers_sent + total_transfers_received`) directamente en el motor de base de datos.
* **Mapeo ORM**: Node.js utiliza el modelo de solo lectura [CampaignTotals.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/models/CampaignTotals.js) para hacer consultas directas a la vista mediante Sequelize.

### 3. Transacciones SQL Atómicas (ACID)
* Al realizar una transferencia de dinero de una campaña a otra (ej. en [backend/controllers/transferController.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/controllers/transferController.js)), se ejecuta una **transacción SQL explícita**.
* El sistema lee los saldos consolidados dentro de la transacción, verifica que la campaña de origen posea el monto disponible, realiza la operación y aplica un `commit`. Si falla la validación de fondos, la transacción ejecuta un `rollback` impidiendo inconsistencias en los balances.

---

## 📁 Estructura del Código Fuente

* **`backend/`**:
  * [server.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/server.js) — Punto de entrada Express y alimentación de datos.
  * [config/database.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/config/database.js) — Conexión SQLite con Sequelize.
  * `models/` — Modelos del ORM (Campaign, Donation, Transfer) y la vista agregada (CampaignTotals).
  * `controllers/` — Controladores de negocio que resuelven las peticiones y transacciones.
  * `routes/` — Definición de los endpoints de la API.
* **`frontend/`**:
  * [src/App.jsx](file:///home/lisandro/Documentos/BDD-Competencia/frontend/src/App.jsx) — Interfaz de React, Dashboard interactivo con gráficos SVG y modales de operación.
  * [src/index.css](file:///home/lisandro/Documentos/BDD-Competencia/frontend/src/index.css) — Estética modo oscuro con glassmorphism nativo.
