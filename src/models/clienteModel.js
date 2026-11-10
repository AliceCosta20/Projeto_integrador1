const conexao = require('../db');

const ClienteModel = {
    buscarPorId: async (id_cliente) => {
        let conn;
        try {
            conn = await conexao.getConnection();
            const rows = await conn.query('SELECT * FROM cliente WHERE id_cliente = ?', [id_cliente]);
            return rows[0];
        } finally {
            if (conn) conn.release();
        }
    },

    cadastrar: async (dados) => {
        const { nome, cpf_cnpj, telefone } = dados;
        let conn;
        try {
            conn = await conexao.getConnection();
            const result = await conn.query(
                'INSERT INTO cliente (nome, cpf_cnpj, telefone) VALUES (?, ?, ?)',
                [nome, cpf_cnpj, telefone]
            );
            return Number(result.insertId);
        } finally {
            if (conn) conn.release();
        }
    }
};

module.exports = ClienteModel;