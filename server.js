const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');
require('dotenv').config();

const app = express();


app.use(cors());
app.use(express.json());


// POST /api/login - Validação de login e senha
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    let conn;

    try {
        conn = await pool.getConnection();

        // Consulta usando INNER JOIN entre login e cliente
        const rows = await conn.query(
            `SELECT l.id_login, l.id_cliente, l.senha, l.ativo, c.nome 
             FROM login l 
             INNER JOIN cliente c ON l.id_cliente = c.id_cliente 
             WHERE l.email = ?`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
        }

        const usuario = rows[0];

        if (!usuario.ativo) {
            return res.status(403).json({ message: 'Conta de usuário inativa.' });
        }

        if (usuario.senha !== senha) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
        }

        // Atualiza a data do último acesso
        await conn.query('UPDATE login SET ultimo_acesso = NOW() WHERE id_login = ?', [usuario.id_login]);

        res.status(200).json({
            message: 'Login realizado com sucesso!',
            id_cliente: usuario.id_cliente,
            nome: usuario.nome
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// GET /api/clientes - Listar clientes cadastrados
app.get('/api/clientes', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            `SELECT c.id_cliente, c.nome, c.cpf_cnpj, c.telefone, l.email 
             FROM cliente c 
             LEFT JOIN login l ON c.id_cliente = l.id_cliente`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});


// GET /api/produtos - Listar todos os biocosméticos
app.get('/api/produtos', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const produtos = await conn.query('SELECT * FROM produto');
        res.json(produtos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/produtos - Cadastrar novo produto
app.post('/api/produtos', async (req, res) => {
    const { nome, descricao, preco, estoque, categoria, is_organico, is_vegano } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
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

// PUT /api/produtos/:id - Atualizar produto ou estoque
app.put('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, estoque, categoria } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
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

// DELETE /api/produtos/:id - Deletar produto
app.delete('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('DELETE FROM produto WHERE id_produto = ?', [id]);
        res.json({ message: 'Produto removido com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});


// GET /api/carrinho/:id_cliente - Visualizar carrinho de um cliente com cálculo de totais
app.get('/api/carrinho/:id_cliente', async (req, res) => {
    const { id_cliente } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        const sql = `
            SELECT 
                car.id_carrinho,
                car.id_produto,
                p.nome,
                p.preco,
                car.quantidade,
                (p.preco * car.quantidade) AS subtotal
            FROM carrinho_de_compra car
            INNER JOIN produto p ON car.id_produto = p.id_produto
            WHERE car.id_cliente = ?`;
        const itens = await conn.query(sql, [id_cliente]);

        // Regra de Negócio: Cálculo de valor total do carrinho
        const total = itens.reduce((acc, item) => acc + Number(item.subtotal), 0);

        res.json({ itens, valor_total: total.toFixed(2) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/carrinho - Adicionar produto com validação de estoque
app.post('/api/carrinho', async (req, res) => {
    const { id_cliente, id_produto, quantidade } = req.body;
    let conn;

    try {
        conn = await pool.getConnection();

        // Regra de Negócio: Impedir adição se não houver estoque disponível
        const produto = await conn.query('SELECT estoque FROM produto WHERE id_produto = ?', [id_produto]);

        if (produto.length === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        if (produto[0].estoque < quantidade) {
            return res.status(400).json({ message: 'Estoque insuficiente para esta quantidade.' });
        }

        const sql = `
            INSERT INTO carrinho_de_compra (id_cliente, id_produto, quantidade) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE quantidade = quantidade + ?`;
            
        await conn.query(sql, [id_cliente, id_produto, quantidade, quantidade]);

        res.status(200).json({ message: 'Produto adicionado ao carrinho!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// DELETE /api/carrinho/:id_carrinho - Remover item do carrinho
app.delete('/api/carrinho/:id_carrinho', async (req, res) => {
    const { id_carrinho } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('DELETE FROM carrinho_de_compra WHERE id_carrinho = ?', [id_carrinho]);
        res.json({ message: 'Item removido do carrinho.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});


// POST /api/finalizar-compra - Efetivar a compra, abater estoque e gerar Nota Fiscal
app.post('/api/finalizar-compra', async (req, res) => {
    const { id_cliente, metodo_pagamento } = req.body;
    let conn;

    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. Busca os itens do carrinho do cliente
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

        // 2. Calcula o valor total e valida o estoque de todos os itens
        let valor_total = 0;
        for (const item of carrinho) {
            if (item.estoque < item.quantidade) {
                await conn.rollback();
                return res.status(400).json({ message: `Estoque insuficiente para um dos itens do carrinho.` });
            }
            valor_total += Number(item.preco) * item.quantidade;
        }

        // 3. Registrar na tabela 'compra'
        const resCompra = await conn.query(
            `INSERT INTO compra (id_cliente, valor_total, metodo_pagamento, status_compra) VALUES (?, ?, ?, 'PAGO')`,
            [id_cliente, valor_total, metodo_pagamento]
        );
        const id_compra = Number(resCompra.insertId);

        // 4. Abater estoque dos produtos vendidos
        for (const item of carrinho) {
            await conn.query(
                `UPDATE produto SET estoque = estoque - ? WHERE id_produto = ?`,
                [item.quantidade, item.id_produto]
            );
        }

        // 5. Gerar Nota Fiscal fictícia com chave de 44 dígitos
        const chave_acesso = '3523' + Math.floor(Math.random() * 1e16).toString().padStart(16, '0') + Math.floor(Math.random() * 1e24).toString().padStart(24, '0');
        const valor_imposto = valor_total * 0.18; // 18% de imposto fictício

        await conn.query(
            `INSERT INTO nota_fiscal (id_compra, chave_acesso, valor_imposto) VALUES (?, ?, ?)`,
            [id_compra, chave_acesso, valor_imposto]
        );

        // 6. Esvaziar o carrinho do cliente
        await conn.query(`DELETE FROM carrinho_de_compra WHERE id_cliente = ?`, [id_cliente]);

        await conn.commit();
        res.status(200).json({
            message: 'Compra finalizada com sucesso e Nota Fiscal emitida!',
            id_compra,
            chave_acesso,
            valor_total
        });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor BioCosmetics rodando em http://localhost:${PORT}`);
});