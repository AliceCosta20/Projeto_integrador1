const conexao = require('../db');

const NotaFiscalModel = {
    buscarPorCompra: async (id_compra) => {
        let conn;
        try {
            conn = await conexao.getConnection();
            const rows = await conn.query('SELECT * FROM nota_fiscal WHERE id_compra = ?', [id_compra]);
            return rows[0];
        } finally {
            if (conn) conn.release();
        }
    }
};

module.exports = NotaFiscalModel;