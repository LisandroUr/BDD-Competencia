const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');

// Transfer endpoints
router.post('/', transferController.createTransfer);
router.get('/', transferController.getAllTransfers);

module.exports = router;
