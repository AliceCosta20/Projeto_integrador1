const AuthModel = require('../models/authModel'); //Importa as funções da camada de banco de dados (AuthModel), como buscar o utilizador por e-mail e atualizar o acesso.

const authController = {
    login: async (req, res) => {
        const email = req.body.email ? req.body.email.trim() : ''; // Extrai o email env
        const senha = req.body.senha ? req.body.senha.trim() : '';

        console.log("--- TENTATIVA DE LOGIN ---");
        console.log("Recebido do cliente -> Email:", `"${email}"`, "| Senha:", `"${senha}"`);

        try {
            const rows = await AuthModel.buscarPorEmail(email);

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
                return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
            }

            await AuthModel.atualizarUltimoAcesso(usuario.id_login);

            console.log("LOGIN COM SUCESSO!");
            res.status(200).json({
                message: 'Login realizado com sucesso!',
                id_cliente: usuario.id_cliente,
                nome: usuario.nome
            });
        } catch (err) {
            console.error("Erro no servidor:", err.message);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = authController;