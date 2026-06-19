const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CampaignTotals = sequelize.define('CampaignTotals', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
  },
  targetAmount: {
    type: DataTypes.DECIMAL(10, 2),
  },
  status: {
    type: DataTypes.STRING,
  },
  total_donations: {
    type: DataTypes.DECIMAL(10, 2),
  },
  total_transfers_sent: {
    type: DataTypes.DECIMAL(10, 2),
  },
  total_transfers_received: {
    type: DataTypes.DECIMAL(10, 2),
  },
  current_balance: {
    type: DataTypes.DECIMAL(10, 2),
  },
  donation_count: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: 'CampaignTotals',
  timestamps: false,
  // We specify that Sequelize shouldn't try to sync this table using CREATE TABLE
  // because it's a database view.
});

module.exports = CampaignTotals;
