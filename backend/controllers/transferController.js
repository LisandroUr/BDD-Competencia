const { sequelize, Transfer, Campaign, CampaignTotals } = require('../models');

// Create a new transfer between campaigns
exports.createTransfer = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { sourceCampaignId, targetCampaignId, amount, reason } = req.body;

    if (!sourceCampaignId || !targetCampaignId || !amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Las campañas de origen y destino, y un monto mayor a cero son obligatorios.' });
    }

    if (parseInt(sourceCampaignId) === parseInt(targetCampaignId)) {
      await t.rollback();
      return res.status(400).json({ error: 'No se puede transferir fondos a la misma campaña.' });
    }

    // Verify source and target campaigns exist and are active
    const sourceCampaign = await Campaign.findByPk(sourceCampaignId, { transaction: t });
    const targetCampaign = await Campaign.findByPk(targetCampaignId, { transaction: t });

    if (!sourceCampaign) {
      await t.rollback();
      return res.status(404).json({ error: 'La campaña de origen no existe.' });
    }

    if (!targetCampaign) {
      await t.rollback();
      return res.status(404).json({ error: 'La campaña de destino no existe.' });
    }

    if (sourceCampaign.status !== 'active') {
      await t.rollback();
      return res.status(400).json({ error: 'La campaña de origen no está activa.' });
    }

    if (targetCampaign.status !== 'active') {
      await t.rollback();
      return res.status(400).json({ error: 'La campaña de destino no está activa.' });
    }

    // Verify sufficient funds in source campaign
    // Querying the view inside the transaction to get latest balance
    const sourceTotals = await CampaignTotals.findByPk(sourceCampaignId, { transaction: t });
    const currentBalance = sourceTotals ? parseFloat(sourceTotals.current_balance) : 0.0;

    if (currentBalance < parseFloat(amount)) {
      await t.rollback();
      return res.status(400).json({
        error: `Fondos insuficientes en la campaña "${sourceCampaign.title}". Balance actual: $${currentBalance.toFixed(2)}, monto solicitado: $${parseFloat(amount).toFixed(2)}.`
      });
    }

    // Perform the transfer by creating a Transfer record
    // Since balances are calculated dynamically by the CampaignTotals view,
    // this single record successfully changes the balance of both campaigns atomically.
    const transfer = await Transfer.create({
      sourceCampaignId,
      targetCampaignId,
      amount,
      reason: reason || 'Transferencia de fondos',
    }, { transaction: t });

    // Commit transaction
    await t.commit();

    res.status(201).json({
      message: 'Transferencia realizada con éxito de forma atómica.',
      transfer
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al realizar transferencia:', error);
    res.status(500).json({ error: 'Error interno del servidor al realizar la transferencia.' });
  }
};

// Get all transfers
exports.getAllTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.findAll({
      include: [
        { model: Campaign, as: 'sourceCampaign', attributes: ['title'] },
        { model: Campaign, as: 'targetCampaign', attributes: ['title'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(transfers);
  } catch (error) {
    console.error('Error al obtener transferencias:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener las transferencias.' });
  }
};
