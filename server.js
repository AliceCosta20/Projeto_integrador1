const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importa a conexão exportada do db.js
const conexao = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'JSON enviado é inválido ou mal formatado.' });
    }
    next();
});

// -----------------------------------------------------------------------------
// 1. AUTENTICAÇÃO E USUÁRIOS
// -----------------------------------------------------------------------------

// POST /api/login - Autenticação no sistema
app.post('/api/login', async (req, res) => {
    const email = req.body.email ? req.body.email.trim() : '';
    const senha = req.body.senha ? req.body.senha.trim() : '';
    let conn;

    console.log("--- TENTATIVA DE LOGIN ---");
    console.log("Recebido do cliente -> Email:", `"${email}"`, "| Senha:", `"${senha}"`);

    try {
        conn = await conexao.getConnection();

        // 1. Teste de diagnóstico: buscar tudo da tabela login
        const todosLogins = await conn.query("SELECT * FROM login");
        console.log("Registos atuais na tabela 'login':", todosLogins);

        // 2. Consulta oficial de login
        const rows = await conn.query(
            `SELECT l.id_login, l.id_cliente, l.senha, l.ativo, c.nome 
             FROM login l 
             INNER JOIN cliente c ON l.id_cliente = c.id_cliente 
             WHERE TRIM(l.email) = ?`,
            [email]
        );

        console.log("Resultado da busca pelo email:", rows);

        if (rows.length === 0) {
            console.log("MOTIVO DO ERRO: Nenhum utilizador encontrado com este email.");
            return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
        }

        const usuario = rows[0];

        if (!usuario.ativo) {
            console.log("MOTIVO DO ERRO: Utilizador inativo.");
            return res.status(403).json({ message: 'Conta de usuário inativa.' });
        }

        if (String(usuario.senha).trim() !== senha) {
            console.log("MOTIVO DO ERRO: Senha incorreta.");
            console.log("Senha no banco:", `"${usuario.senha}"`, "vs Senha enviada:", `"${senha}"`);
            return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
        }

        await conn.query('UPDATE login SET ultimo_acesso = NOW() WHERE id_login = ?', [usuario.id_login]);

        console.log("LOGIN COM SUCESSO!");
        res.status(200).json({
            message: 'Login realizado com sucesso!',
            id_cliente: usuario.id_cliente,
            nome: usuario.nome
        });
    } catch (err) {
        console.error("Erro no servidor:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// -----------------------------------------------------------------------------
// 2. CATÁLOGO DE PRODUTOS (BioCosmetics)
// -----------------------------------------------------------------------------

// GET /api/produtos - Listar catálogo
app.get('/api/produtos', async (req, res) => {
    let conn;
    try {
        conn = await conexao.getConnection();
        const produtos = await conn.query('SELECT * FROM produto');
        res.json(produtos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/produtos - Cadastrar produto
app.post('/api/produtos', async (req, res) => {
    const { nome, descricao, preco, estoque, categoria, is_organico, is_vegano } = req.body;
    let conn;
    try {
        conn = await conexao.getConnection();
        const sql = `
            INSERT INTO produto (nome, descricao, preco, estoque, categoria, is_organico, is_vegano) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const result = await conn.query(sql, [nome, descricao, preco, estoque, categoria, is_organico ?? true, is_vegano ?? true]);
        res.status(201).json({ message: 'Produto cadastrado com sucesso!', id_produto: Number(result.insertId) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// PUT /api/produtos/:id - Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, estoque, categoria } = req.body;
    let conn;
    try {
        conn = await conexao.getConnection();
        await conn.query(
            `UPDATE produto SET nome = ?, descricao = ?, preco = ?, estoque = ?, categoria = ? WHERE id_produto = ?`,
            [nome, descricao, preco, estoque, categoria, id]
        );
        res.json({ message: 'Produto atualizado com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// DELETE /api/produtos/:id - Excluir produto
app.delete('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await conexao.getConnection();
        await conn.query('DELETE FROM produto WHERE id_produto = ?', [id]);
        res.json({ message: 'Produto removido com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// -----------------------------------------------------------------------------
// 3. CARRINHO DE COMPRAS
// -----------------------------------------------------------------------------

// GET /api/carrinho/:id_cliente - Visualizar carrinho com total
// Listar itens do carrinho de um cliente
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

// -----------------------------------------------------------------------------
// 4. CHECKOUT E NOTA FISCAL
// -----------------------------------------------------------------------------

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
// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor BioCosmetics rodando em http://localhost:${PORT}`);
});