const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
  // Si existe DATABASE_URL (ej. en Render PostgreSQL), conectarse usando Postgres con SSL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Requerido para conexiones seguras en Render
      }
    },
    logging: false
  });
} else {
  // Por defecto, usar SQLite con la ruta provista en DATABASE_STORAGE o la local
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DATABASE_STORAGE || path.join(__dirname, '../database.sqlite'),
    logging: false
  });
}

module.exports = sequelize;

