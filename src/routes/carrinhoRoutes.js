const express = require('express');
const router = express.Router();
const carrinhoController = require('../controllers/carrinhoController');

router.get('/carrinho/:id_cliente', carrinhoController.buscar);
router.post('/carrinho', carrinhoController.adicionar);
router.delete('/carrinho/:id_carrinho', carrinhoController.remover);

module.exports = router;