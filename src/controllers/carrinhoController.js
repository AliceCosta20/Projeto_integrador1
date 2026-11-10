const CarrinhoModel = require('../models/carrinhoModel');

const carrinhoController = {
    buscar: async (req, res) => {
        try {
            const itens = await CarrinhoModel.buscarPorCliente(req.params.id_cliente);
            res.status(200).json(itens);
        } catch (err) {
            console.error("Erro ao procurar carrinho:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    adicionar: async (req, res) => {
        const { id_cliente, id_produto, quantidade } = req.body;

        if (!id_cliente || !id_produto || !quantidade) {
            return res.status(400).json({ error: 'id_cliente, id_produto e quantidade são obrigatórios.' });
        }

        try {
            await CarrinhoModel.adicionarItem(id_cliente, id_produto, quantidade);
            console.log(`[CARRINHO] Item adicionado para o cliente ID: ${id_cliente}`);
            res.status(201).json({ message: 'Produto adicionado ao carrinho com sucesso!' });
        } catch (err) {
            console.error("Erro no carrinho:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    remover: async (req, res) => {
        try {
            await CarrinhoModel.removerItem(req.params.id_carrinho);
            res.json({ message: 'Item removido do carrinho.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = carrinhoController;