const { sequelize, Donation, Campaign } = require('../models');

// Create a new donation
exports.createDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { campaignId, amount, donorName, comment } = req.body;

    if (!campaignId || !amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'La campaña y un monto mayor a cero son obligatorios.' });
    }

    // Verify campaign exists and is active
    const campaign = await Campaign.findByPk(campaignId, { transaction: t });
    if (!campaign) {
      await t.rollback();
      return res.status(404).json({ error: 'Campaña no encontrada.' });
    }

    if (campaign.status !== 'active') {
      await t.rollback();
      return res.status(400).json({ error: 'No se pueden realizar donaciones a campañas inactivas o finalizadas.' });
    }

    const donation = await Donation.create({
      campaignId,
      amount,
      donorName: donorName || 'Anónimo',
      comment,
    }, { transaction: t });

    await t.commit();
    res.status(201).json(donation);
  } catch (error) {
    await t.rollback();
    console.error('Error al registrar donación:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar la donación.' });
  }
};

// Get all donations
exports.getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.findAll({
      include: [{ model: Campaign, as: 'campaign', attributes: ['title'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(donations);
  } catch (error) {
    console.error('Error al obtener donaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener las donaciones.' });
  }
};
