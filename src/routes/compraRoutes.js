const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

router.post('/finalizar-compra', compraController.finalizar);

module.exports = router;