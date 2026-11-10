module.exports = (req, res, next) => {
    const { nome, preco, estoque, categoria } = req.body;

    // Validação apenas para métodos POST e PUT
    if (req.method === 'POST' || req.method === 'PUT') {
        if (!nome || preco === undefined || estoque === undefined || !categoria) {
            return res.status(400).json({ 
                error: 'Nome, preço, estoque e categoria são obrigatórios.' 
            });
        }

        if (Number(preco) <= 0) {
            return res.status(400).json({ 
                error: 'O preço do produto deve ser maior que zero.' 
            });
        }

        if (Number(estoque) < 0) {
            return res.status(400).json({ 
                error: 'O estoque não pode ser um valor negativo.' 
            });
        }
    }

    next();
};