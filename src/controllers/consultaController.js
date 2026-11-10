const ConsultaModel = require('../models/consultaModel');

const consultaController = {
    enviarMensagem: async (req, res) => {
        try {
            const id_consulta = await ConsultaModel.criar(req.body);
            res.status(201).json({ message: 'Consulta enviada com sucesso!', id_consulta });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    listar: async (req, res) => {
        try {
            const consultas = await ConsultaModel.listarPorCliente(req.params.id_cliente);
            res.json(consultas);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = consultaController;