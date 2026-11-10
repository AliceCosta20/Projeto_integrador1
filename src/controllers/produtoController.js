const ProdutoModel = require('../models/produtoModel');

const produtoController = {
    listar: async (req, res) => {
        try {
            const produtos = await ProdutoModel.listarTodos();
            res.json(produtos);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    cadastrar: async (req, res) => {
        try {
            const id_produto = await ProdutoModel.cadastrar(req.body);
            res.status(201).json({ message: 'Produto cadastrado com sucesso!', id_produto });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    atualizar: async (req, res) => {
        try {
            await ProdutoModel.atualizar(req.params.id, req.body);
            res.json({ message: 'Produto atualizado com sucesso!' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    excluir: async (req, res) => {
        try {
            await ProdutoModel.excluir(req.params.id);
            res.json({ message: 'Produto removido com sucesso!' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = produtoController;