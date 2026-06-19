const { sequelize, Campaign, Donation, Transfer, CampaignTotals } = require('../models');

// Create a new campaign
exports.createCampaign = async (req, res) => {
  try {
    const { title, description, targetAmount, status } = req.body;
    
    if (!title || !targetAmount) {
      return res.status(400).json({ error: 'El título y el monto objetivo son obligatorios.' });
    }

    const campaign = await Campaign.create({
      title,
      description,
      targetAmount,
      status: status || 'active',
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error al crear campaña:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear la campaña.' });
  }
};

// Get all campaigns
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(campaigns);
  } catch (error) {
    console.error('Error al obtener campañas:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener las campañas.' });
  }
};

// Get campaign by ID with its details
exports.getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByPk(id, {
      include: [
        { model: Donation, as: 'donations' },
        { model: Transfer, as: 'sentTransfers', include: [{ model: Campaign, as: 'targetCampaign', attributes: ['title'] }] },
        { model: Transfer, as: 'receivedTransfers', include: [{ model: Campaign, as: 'sourceCampaign', attributes: ['title'] }] },
      ],
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada.' });
    }

    // Get totals from view
    const totals = await CampaignTotals.findByPk(id);

    res.json({
      campaign,
      totals: totals || {
        total_donations: 0,
        total_transfers_sent: 0,
        total_transfers_received: 0,
        current_balance: 0,
        donation_count: 0
      }
    });
  } catch (error) {
    console.error('Error al obtener detalle de campaña:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener el detalle.' });
  }
};

// Get campaign totals (from SQL View)
exports.getCampaignTotals = async (req, res) => {
  try {
    const totals = await CampaignTotals.findAll({
      order: [['current_balance', 'DESC']],
    });
    res.json(totals);
  } catch (error) {
    console.error('Error al obtener vista de totales:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener totales de campañas.' });
  }
};

// Get global stats aggregated directly in the SQL database
exports.getGlobalStats = async (req, res) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM Donations) AS total_donations,
        (SELECT COUNT(id) FROM Campaigns WHERE status = 'active') AS active_campaigns,
        (SELECT COALESCE(SUM(amount), 0) FROM Transfers) AS total_transfers,
        (SELECT COALESCE(SUM(targetAmount), 0) FROM Campaigns) AS overall_target,
        (SELECT COALESCE(SUM(current_balance), 0) FROM CampaignTotals) AS overall_raised
    `);
    res.json(results[0]);
  } catch (error) {
    console.error('Error al obtener estadísticas globales:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas.' });
  }
};

