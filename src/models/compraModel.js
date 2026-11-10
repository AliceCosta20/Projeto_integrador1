const CompraModel = require('../models/compraModel');
/// POST /api/finalizar-compra - Processa pedido, baixa estoque e gera Nota Fiscal
app.post('/api/finalizar-compra', async (req, res) => {
    const { id_cliente, metodo_pagamento } = req.body;
    let conn;

    if (!id_cliente || !metodo_pagamento) {
        return res.status(400).json({ error: 'id_cliente e metodo_pagamento são obrigatórios.' });
    }

    try {
        conn = await conexao.getConnection();
        await conn.beginTransaction();

        // 1. Busca os itens do carrinho
        const carrinho = await conn.query(
            `SELECT c.id_produto, c.quantidade, p.preco, p.estoque 
             FROM carrinho_de_compra c 
             INNER JOIN produto p ON c.id_produto = p.id_produto 
             WHERE c.id_cliente = ?`,
            [id_cliente]
        );

        if (carrinho.length === 0) {
            await conn.rollback();
            return res.status(400).json({ message: 'O carrinho está vazio.' });
        }

        // 2. Valida estoque e calcula total
        let valor_total = 0;
        for (const item of carrinho) {
            if (item.estoque < item.quantidade) {
                await conn.rollback();
                return res.status(400).json({ message: 'Estoque insuficiente para um dos itens do carrinho.' });
            }
            valor_total += Number(item.preco) * item.quantidade;
        }

        // 3. Registra a compra
        const resCompra = await conn.query(
            `INSERT INTO compra (id_cliente, valor_total, metodo_pagamento, status_compra) VALUES (?, ?, ?, 'PAGO')`,
            [id_cliente, valor_total, metodo_pagamento]
        );
        const id_compra = Number(resCompra.insertId);

        // 4. Abate estoque dos produtos
        for (const item of carrinho) {
            await conn.query(
                `UPDATE produto SET estoque = estoque - ? WHERE id_produto = ?`,
                [item.quantidade, item.id_produto]
            );
        }

        // 5. Emite Nota Fiscal
        const chave_acesso = '3526' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 10)).join('');
        const valor_imposto = Number((valor_total * 0.18).toFixed(2));

        await conn.query(
            `INSERT INTO nota_fiscal (id_compra, chave_acesso, valor_imposto) VALUES (?, ?, ?)`,
            [id_compra, chave_acesso, valor_imposto]
        );

        // 6. Limpa o carrinho
        await conn.query(`DELETE FROM carrinho_de_compra WHERE id_cliente = ?`, [id_cliente]);

        await conn.commit();

        console.log(`[CHECKOUT] Compra #${id_compra} finalizada para o Cliente ID: ${id_cliente}`);

        res.status(200).json({
            message: 'Compra finalizada com sucesso e Nota Fiscal emitida!',
            id_compra,
            chave_acesso,
            valor_total,
            valor_imposto
        });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Erro ao finalizar compra:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = CompraModel;