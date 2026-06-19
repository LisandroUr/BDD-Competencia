# Documentación del Flujo del Sistema y Consultas SQL

Este documento resume los fundamentos de base de datos, el flujo transaccional y las consultas diseñadas durante el desarrollo de la **Plataforma de Donaciones y Campañas**.

---

## 1. Patrón Arquitectónico: MVC (Modelo-Vista-Controlador)
El sistema divide las responsabilidades utilizando el patrón **MVC**:
* **Modelo (M)**: Implementado en el Backend con **Sequelize ORM** para definir los esquemas relacionales (`Campaign`, `Donation`, `Transfer`) e interactuar con el archivo SQLite.
* **Controlador (C)**: Define las funciones que interceptan las peticiones HTTP y manejan la lógica de negocio (registro de aportes, verificación de fondos, y ejecución de transacciones atómicas).
* **Vista (V)**: Representada por la interfaz React en el frontend, la cual procesa la respuesta JSON de los controladores y muestra métricas visuales con gráficos SVG y tablas.

---

## 2. Vista SQL Agregada: `CampaignTotals`
Para evitar la realización de cálculos agregados y sumatorias del lado de Node.js (lo cual penalizaría la escalabilidad del sistema), se inyectó una vista física en la base de datos SQLite.

### Definición DDL de la Vista:
```sql
CREATE VIEW CampaignTotals AS
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
LEFT JOIN (
  SELECT sourceCampaignId, SUM(amount) AS total_sent
  FROM Transfers
  GROUP BY sourceCampaignId
) ts ON c.id = ts.sourceCampaignId
LEFT JOIN (
  SELECT targetCampaignId, SUM(amount) AS total_received
  FROM Transfers
  GROUP BY targetCampaignId
) tr ON c.id = tr.targetCampaignId;
```

### Funcionalidad en el ORM:
El modelo de solo lectura en Sequelize apunta a esta tabla virtual. Cuando el frontend solicita los totales, Node.js simplemente ejecuta un `SELECT * FROM CampaignTotals;` a través del ORM, delegando la sumatoria y el conteo de registros por completo al motor de base de datos SQL.

---

## 3. Transacciones Estables (Garantía ACID)
La transferencia de fondos entre campañas debe ser consistente y estable (si el servidor se cae a mitad del proceso, el dinero no debe desaparecer ni duplicarse).

### Flujo de Ejecución de la Transacción:
1. Se abre una transacción explícita: `const t = await sequelize.transaction();`
2. Se consulta la existencia y estado de la campaña de origen y de destino.
3. Se bloquea y lee el balance de la campaña origen consultando la vista `CampaignTotals` dentro de la transacción:
   `CampaignTotals.findByPk(sourceCampaignId, { transaction: t })`
4. **Validación de Fondos**:
   * Si `current_balance < monto_a_transferir`, la transacción se revierte con `await t.rollback()`.
   * Si es suficiente, se procede a la creación del registro en la tabla `Transfers` pasando `{ transaction: t }`.
5. Se guardan y confirman los cambios atómicamente con `await t.commit()`.

---

## 4. Consultas SQL de Utilidad (para DBeaver)

### Consulta 1: Listar todas las donaciones detalladas con nombres de campañas
```sql
SELECT 
    d.id AS "ID Donación",
    datetime(d.createdAt) AS "Fecha y Hora",
    d.donorName AS "Nombre Donante",
    d.amount AS "Monto ($)",
    c.title AS "Campaña Destino",
    d.comment AS "Comentario/Mensaje"
FROM Donations d
JOIN Campaigns c ON d.campaignId = c.id
ORDER BY d.createdAt DESC;
```

### Consulta 2: Resumen agregado de donaciones recibidas por campaña
```sql
SELECT 
    c.title AS "Campaña",
    COUNT(d.id) AS "Cantidad Donaciones",
    COALESCE(SUM(d.amount), 0) AS "Total Donado ($)"
FROM Campaigns c
LEFT JOIN Donations d ON c.id = d.campaignId
GROUP BY c.id, c.title
ORDER BY "Total Donado ($)" DESC;
```

---

## 5. El Archivo `database.sqlite`
* Es la base de datos física del sistema.
* Almacena todo el esquema DDL relacional (tablas, restricciones y relaciones de clave foránea) junto con los datos e índices en un único archivo binario portátil.
* Permite transportar la base de datos completa a cualquier servidor de desarrollo con solo copiar el archivo de base de datos.
