const AuthModel = require('../models/authModel');
// POST /api/login - Autenticação no sistema
app.post('/api/login', async (req, res) => {
    const email = req.body.email ? req.body.email.trim() : ''; //Armazena o e-mail do corpo da requisição (mensagem do HTTP de dados indo direto para o cliente) e remove espaços extras com o .trim()
    const senha = req.body.senha ? req.body.senha.trim() : ''; // Armazena a senha do corpo da requisição
    let conn; // guarda a conexão do banco de dados

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
module.exports = AuthModel;