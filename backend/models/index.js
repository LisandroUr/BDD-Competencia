const sequelize = require('../config/database');
const Campaign = require('./Campaign');
const Donation = require('./Donation');
const Transfer = require('./Transfer');
const CampaignTotals = require('./CampaignTotals');

// Define associations
Campaign.hasMany(Donation, { foreignKey: 'campaignId', as: 'donations' });
Donation.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

Campaign.hasMany(Transfer, { foreignKey: 'sourceCampaignId', as: 'sentTransfers' });
Campaign.hasMany(Transfer, { foreignKey: 'targetCampaignId', as: 'receivedTransfers' });

Transfer.belongsTo(Campaign, { foreignKey: 'sourceCampaignId', as: 'sourceCampaign' });
Transfer.belongsTo(Campaign, { foreignKey: 'targetCampaignId', as: 'targetCampaign' });

// Function to initialize database and create the View
const initDatabase = async (force = false) => {
  try {
    // Drop view first if it exists to avoid conflicts during sync
    await sequelize.query('DROP VIEW IF EXISTS CampaignTotals;');
    
    // Sync tables
    await sequelize.sync({ force });
    console.log('Database tables synchronized successfully.');

    // Drop the table that Sequelize automatically created for the CampaignTotals model
    await sequelize.query('DROP TABLE IF EXISTS CampaignTotals;');

    // Create CampaignTotals view
    await sequelize.query(`
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
    `);
    
    console.log('Database VIEW "CampaignTotals" created successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  Campaign,
  Donation,
  Transfer,
  CampaignTotals,
  initDatabase,
};
