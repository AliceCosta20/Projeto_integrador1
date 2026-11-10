const ClienteModel = require('../models/clienteModel');
const CadastroModel = require('../models/cadastroModel');

const clienteController = {
    buscarPerfil: async (req, res) => {
        try {
            const cliente = await ClienteModel.buscarPorId(req.params.id);
            if (!cliente) return res.status(404).json({ message: 'Cliente não encontrado.' });
            
            const endereco = await CadastroModel.buscarPorCliente(req.params.id);
            res.json({ ...cliente, endereco });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    salvarEndereco: async (req, res) => {
        try {
            await CadastroModel.salvarEndereco(req.body);
            res.json({ message: 'Endereço atualizado com sucesso!' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = clienteController;