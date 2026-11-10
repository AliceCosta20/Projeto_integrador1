// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const conexao = require("./db.js");

import "dotenv/config";
import express from "express";
import cors from "cors";
import conexao from "./db.js";

const express = require('express'); // importa a biblioteca Express, principal framework para a criação de servidores do HTTP no Node.js
const cors = require('cors'); // Importa o cors, permitindo que sua API seja acessada por front-end
require('dotenv').config(); // Serve para carregar as variáveis de lugares definidos do arquivo (portas, credenciais)

// Importa a conexão exportada do db.js com as informações de banco de dados (MySQL)
const conexao = require('./db');

const app = express(); //inicia o CORS para todas as rotas

app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => { // trata dos erros durante o processo de análise sintática (a forma de ler os caracteres, texto, string)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'JSON enviado é inválido ou mal formatado.' });
    } // verifica se o erro gerado foi uma falha de sintaxe (regras, símbolo, etc)
    next(); // Passa para a próxima rota
});



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






const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor BioCosmetics rodando em http://localhost:${PORT}`);
});