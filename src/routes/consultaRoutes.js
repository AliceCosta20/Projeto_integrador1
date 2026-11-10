const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');

router.post('/consultas', consultaController.enviarMensagem);
router.get('/consultas/:id_cliente', consultaController.listar);

module.exports = router;