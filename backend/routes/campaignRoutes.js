const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// Campaign endpoints
router.post('/', campaignController.createCampaign);
router.get('/', campaignController.getAllCampaigns);
router.get('/totals', campaignController.getCampaignTotals); // This must be registered BEFORE /:id so it's not matched as an ID
router.get('/stats', campaignController.getGlobalStats);
router.get('/:id', campaignController.getCampaignById);

module.exports = router;
