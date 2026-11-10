const CompraModel = require('../models/compraModel');

const compraController = {
    finalizar: async (req, res) => {
        const { id_cliente, metodo_pagamento } = req.body;

        if (!id_cliente || !metodo_pagamento) {
            return res.status(400).json({ error: 'id_cliente e metodo_pagamento são obrigatórios.' });
        }

        try {
            const resultado = await CompraModel.finalizarCompra(id_cliente, metodo_pagamento);
            console.log(`[CHECKOUT] Compra #${resultado.id_compra} finalizada para o Cliente ID: ${id_cliente}`);

            res.status(200).json({
                message: 'Compra finalizada com sucesso e Nota Fiscal emitida!',
                ...resultado
            });
        } catch (err) {
            console.error("Erro ao finalizar compra:", err.message);
            res.status(400).json({ error: err.message });
        }
    }
};

module.exports = compraController;