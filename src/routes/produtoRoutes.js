const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

router.get('/produtos', produtoController.listar);
router.post('/produtos', produtoController.cadastrar);
router.put('/produtos/:id', produtoController.atualizar);
router.delete('/produtos/:id', produtoController.excluir);

module.exports = router;