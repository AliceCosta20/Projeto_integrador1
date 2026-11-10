const CarrinhoModel = require('../models/carrinhoModel');
// GET /api/carrinho/:id_cliente - Visualizar carrinho com total
app.get('/api/carrinho/:id_cliente', async (req, res) => {
    const { id_cliente } = req.params;
    let conn;

    try {
        conn = await conexao.getConnection();
        const sql = `
            SELECT 
                c.id_carrinho,
                p.id_produto,
                p.nome,
                p.preco,
                c.quantidade,
                (p.preco * c.quantidade) AS subtotal
            FROM carrinho_de_compra c
            JOIN produto p ON c.id_produto = p.id_produto
            WHERE c.id_cliente = ?;
        `;
        
        const itens = await conn.query(sql, [id_cliente]);
        res.status(200).json(itens);
    } catch (err) {
        console.error("Erro ao procurar carrinho:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});


// DELETE /api/carrinho/:id_carrinho - Remover do carrinho
app.delete('/api/carrinho/:id_carrinho', async (req, res) => {
    const { id_carrinho } = req.params;
    let conn;
    try {
        conn = await conexao.getConnection();
        await conn.query('DELETE FROM carrinho_de_compra WHERE id_carrinho = ?', [id_carrinho]);
        res.json({ message: 'Item removido do carrinho.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});
module.exports = CarrinhoModel;