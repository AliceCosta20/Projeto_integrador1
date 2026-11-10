const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/clientes/:id', clienteController.buscarPerfil);
router.post('/clientes/endereco', clienteController.salvarEndereco);

module.exports = router;