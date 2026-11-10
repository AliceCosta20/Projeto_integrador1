const conexao = require('../db');

const ConsultaModel = {
    criar: async (dados) => {
        const { id_cliente, assunto, mensagem } = dados;
        let conn;
        try {
            conn = await conexao.getConnection();
            const result = await conn.query(
                'INSERT INTO consulta (id_cliente, assunto, mensagem) VALUES (?, ?, ?)',
                [id_cliente, assunto, mensagem]
            );
            return Number(result.insertId);
        } finally {
            if (conn) conn.release();
        }
    },

    listarPorCliente: async (id_cliente) => {
        let conn;
        try {
            conn = await conexao.getConnection();
            return await conn.query('SELECT * FROM consulta WHERE id_cliente = ?', [id_cliente]);
        } finally {
            if (conn) conn.release();
        }
    }
};

module.exports = ConsultaModel;