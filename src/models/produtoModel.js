const ProdutoModel = require('../models/produtoModel');

// POST /api/carrinho - Adicionar produto com validação de estoque
app.post('/api/carrinho', async (req, res) => {
    const { id_cliente, id_produto, quantidade } = req.body;
    let conn;

    if (!id_cliente || !id_produto || !quantidade) {
        return res.status(400).json({ error: 'id_cliente, id_produto e quantidade são obrigatórios.' });
    }

    try {
        conn = await conexao.getConnection();
        
        // Passamos exatamente 3 parâmetros: [id_cliente, id_produto, quantidade]
        const sql = `
            INSERT INTO carrinho_de_compra (id_cliente, id_produto, quantidade) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade);
        `;
        
        await conn.query(sql, [id_cliente, id_produto, quantidade]);

        console.log(`[CARRINHO] Item adicionado para o cliente ID: ${id_cliente}`);
        res.status(201).json({ message: 'Produto adicionado ao carrinho com sucesso!' });
    } catch (err) {
        console.error("Erro no carrinho:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});
module.exports = ProdutoModel;