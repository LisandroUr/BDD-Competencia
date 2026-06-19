const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

// Donation endpoints
router.post('/', donationController.createDonation);
router.get('/', donationController.getAllDonations);

module.exports = router;
