const conexao = require('../db');

const CadastroModel = {
    buscarPorCliente: async (id_cliente) => {
        let conn;
        try {
            conn = await conexao.getConnection();
            const rows = await conn.query('SELECT * FROM cadastro WHERE id_cliente = ?', [id_cliente]);
            return rows[0];
        } finally {
            if (conn) conn.release();
        }
    },

    salvarEndereco: async (dados) => {
        const { id_cliente, endereco, numero, bairro, cidade, estado, cep, data_nascimento } = dados;
        let conn;
        try {
            conn = await conexao.getConnection();
            const sql = `
                INSERT INTO cadastro (id_cliente, endereco, numero, bairro, cidade, estado, cep, data_nascimento)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    endereco=VALUES(endereco), numero=VALUES(numero), bairro=VALUES(bairro), 
                    cidade=VALUES(cidade), estado=VALUES(estado), cep=VALUES(cep);
            `;
            await conn.query(sql, [id_cliente, endereco, numero, bairro, cidade, estado, cep, data_nascimento]);
        } finally {
            if (conn) conn.release();
        }
    }
};

module.exports = CadastroModel;