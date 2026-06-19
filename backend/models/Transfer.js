const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transfer = sequelize.define('Transfer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sourceCampaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  targetCampaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0.01,
    },
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Transferencia entre campañas',
  },
}, {
  timestamps: true,
});

module.exports = Transfer;
