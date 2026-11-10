module.exports = {
    validarDadosCliente: (req, res, next) => {
        const { nome, cpf_cnpj } = req.body;

        if (!nome || !cpf_cnpj) {
            return res.status(400).json({ 
                error: 'Nome e CPF/CNPJ são campos obrigatórios.' 
            });
        }

        next();
    },

    validarEndereco: (req, res, next) => {
        const { id_cliente, endereco, cidade, estado, cep } = req.body;

        if (!id_cliente || !endereco || !cidade || !estado || !cep) {
            return res.status(400).json({ 
                error: 'Campos de endereço incompletos. Verifique os dados enviados.' 
            });
        }

        next();
    }
};