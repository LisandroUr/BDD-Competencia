# Donis - Plataforma de Donaciones & Campañas

Este proyecto es una plataforma completa de gestión de campañas de donación y transferencias de fondos entre campañas, diseñada bajo el patrón de arquitectura **MVC (Modelo-Vista-Controlador)**. Cumple con los requerimientos técnicos y conceptuales de la cátedra de **Base de Datos II (UTN - F.R. Resistencia - Extensión Áulica Goya)**.

---

## 🛠️ Arquitectura y Tecnologías

El sistema está dividido en dos partes principales:

1. **Backend (API)**:
   - **Framework**: Node.js con Express.
   - **Base de Datos**: SQLite (SQL Relacional).
   - **ORM**: Sequelize (para el mapeo objeto-relacional, control de transacciones y vistas).
   - **Estructura**: Patrón MVC (Modelos en `backend/models`, Controladores en `backend/controllers`, Rutas en `backend/routes`).

2. **Frontend (Cliente)**:
   - **Framework**: React.js con Vite.
   - **Alineación de Estilo**: CSS Nativo personalizado con estética premium (modo oscuro radial, glassmorphism, efectos de brillo pulsante en verde esmeralda y cian, animaciones sutiles y diseño totalmente responsivo).
   - **Visualización**: Gráficos interactivos SVG nativos que comparan la meta de cada campaña frente a su balance actual en tiempo real.

---

## 📊 Conceptos Clave de Bases de Datos Implementados

### 1. Vista de Totales por Campaña (`CampaignTotals`)
Se creó una vista SQL (`VIEW`) en la base de datos para centralizar los cálculos y agregaciones por campaña. Sequelize consulta esta vista directamente como si fuese un modelo de solo lectura:
```sql
CREATE VIEW IF NOT EXISTS CampaignTotals AS
SELECT 
  c.id,
  c.title,
  c.targetAmount,
  c.status,
  c.createdAt,
  c.updatedAt,
  COALESCE(d.total_donations, 0) AS total_donations,
  COALESCE(ts.total_sent, 0) AS total_transfers_sent,
  COALESCE(tr.total_received, 0) AS total_transfers_received,
  (COALESCE(d.total_donations, 0) - COALESCE(ts.total_sent, 0) + COALESCE(tr.total_received, 0)) AS current_balance,
  COALESCE(d.donation_count, 0) AS donation_count
FROM Campaigns c
LEFT JOIN (
  SELECT campaignId, SUM(amount) AS total_donations, COUNT(id) AS donation_count
  FROM Donations
  GROUP BY campaignId
) d ON c.id = d.campaignId
...
```
* **Funciones Agregadas utilizadas**: `SUM()` para el total acumulado y `COUNT()` para contar la cantidad de donantes únicos.
* **Mapeo ORM**: Definido en [CampaignTotals.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/models/CampaignTotals.js) y consultado por el controlador [campaignController.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/controllers/campaignController.js).

### 2. Transacciones SQL Atómicas para Transferencias
Para cumplir con las propiedades **ACID** del motor de base de datos, la transferencia de dinero de una campaña origen a una campaña destino se realiza dentro de una **transacción SQL controlada**:
* Se inicia una transacción de base de datos (`sequelize.transaction()`).
* Se bloquea y valida el balance de la campaña de origen consultando la vista `CampaignTotals` dentro de la transacción.
* Si el balance de origen es inferior al monto a transferir, la transacción se aborta (`t.rollback()`) y se retorna un error explicativo (evitando balances negativos e inconsistencias).
* Si es correcto, se inserta el registro `Transfer` asociando el débito/crédito, y se confirma la transacción (`t.commit()`).
* Implementado en: [transferController.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/controllers/transferController.js).

---

## 📁 Estructura del Proyecto

* **`backend/`**:
  * [server.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/server.js) — Punto de entrada de la API Express y sembrado de datos de prueba (`seeding`).
  * `config/`
    * [database.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/config/database.js) — Configuración del dialecto y base de datos SQLite.
  * `models/`
    * [index.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/models/index.js) — Asociaciones de modelos y creación automática de la vista SQL.
    * [Campaign.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/models/Campaign.js) — Modelo de Campañas.
    * [Donation.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/models/Donation.js) — Modelo de Donaciones.
    * [Transfer.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/models/Transfer.js) — Modelo de Transferencias.
    * [CampaignTotals.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/models/CampaignTotals.js) — Modelo de lectura para la vista SQL.
  * `controllers/`
    * [campaignController.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/controllers/campaignController.js) — Operaciones de campaña y reportes.
    * [donationController.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/controllers/donationController.js) — Registro transaccional de donaciones.
    * [transferController.js](file:///home/lisandro/Documentos/BDD-Competencia/backend/controllers/transferController.js) — Transferencias atómicas transaccionales.
  * `routes/` — Mapeo de endpoints de la API REST.
* **`frontend/`**:
  * [index.html](file:///home/lisandro/Documentos/BDD-Competencia/frontend/index.html) — Contenedor web con configuración de SEO y descripción.
  * `src/`
    * [App.jsx](file:///home/lisandro/Documentos/BDD-Competencia/frontend/src/App.jsx) — Aplicación cliente React con estado y modales.
    * [index.css](file:///home/lisandro/Documentos/BDD-Competencia/frontend/src/index.css) — Hoja de estilos con variables de diseño CSS y glassmorphism.
* **`start.sh`** — Script ejecutable bash para iniciar simultáneamente backend y frontend.

---

## 🚀 Cómo Ejecutar el Proyecto

Hemos creado un script que simplifica el inicio del sistema. Sigue estos pasos en tu terminal:

1. Asegúrate de estar en el directorio raíz del proyecto: `/home/lisandro/Documentos/BDD-Competencia`.
2. Ejecuta el script de inicio:
   ```bash
   ./start.sh
   ```
3. El script limpiará cualquier puerto en conflicto e iniciará de manera paralela:
   * **El Backend (API)** en: `http://localhost:5000`
   * **El Frontend (React)** en: `http://localhost:5173`
4. Al abrir [http://localhost:5173](http://localhost:5173) en tu navegador, verás el sistema con datos de ejemplo ya cargados (Campañas de comedor comunitario, reconstrucción de escuela local con donaciones y una transferencia inicial) para que puedas interactuar con los gráficos y tablas de reportes inmediatamente.
