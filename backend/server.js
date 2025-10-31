const express = require('express');
const mysql = require('mysql2/promise'); 
const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors()); 
app.use(express.json()); 


const dbConfig = {
    host: 'localhost',
    user: 'root', 
    password: 'SenhaGenerica', // Coloque a senha do MySql aqui
    database: 'meu_tcc_db'        
};

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
});


app.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [rows] = await connection.execute(
            'SELECT * FROM Users WHERE email = ? AND BINARY password = ? AND role = ?',
            [email, password, role]
        );


        await connection.end();

        if (rows.length > 0) {
            const user = rows[0];
            delete user.password;
            res.json({ success: true, user: user });
        } else {
            res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
        }
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

app.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos os campos (nome, email, senha, perfil) são obrigatórios.' 
        });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [existing] = await connection.execute(
            'SELECT id FROM Users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            await connection.end();
            return res.status(409).json({ success: false, message: 'Este email já está cadastrado.' });
        }

        const [result] = await connection.execute(
            'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
        );
        
        await connection.end();

        res.json({ success: true, userId: result.insertId, message: 'Usuário cadastrado com sucesso!' });

    } catch (error) {
        console.error("Erro no cadastro:", error);
        
        if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
             return res.status(400).json({ success: false, message: 'Perfil (role) inválido. Use "usuario" ou "analista".' });
        }

        res.status(500).json({ success: false, message: 'Erro interno no servidor ao tentar cadastrar.' });
    }
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [rows] = await connection.execute(
            'SELECT * FROM Users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            // Não informe que o email não existe (por segurança)
            await connection.end();
            console.log("Solicitação (falha-segura) de redefinição para:", email);
            return res.json({ success: true, message: 'Se um usuário com este email existir, um link de redefinição será enviado.' });
        }

        const user = rows[0];

        // 1. Gerar Token
        const token = crypto.randomBytes(20).toString('hex');

        // 2. Definir tempo de expiração (1 hora)
        const expires = new Date(Date.now() + 3600000); // 1 hora em ms

        // 3. Salvar token e expiração no banco
        await connection.execute(
            'UPDATE Users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?',
            [token, expires, user.id]
        );
        
        await connection.end();

        // 4. Criar o link de redefinição
        // !! IMPORTANTE: Altere 'http://127.0.0.1:5500' para o endereço ONDE SEU FRONTEND RODA !!
        // Se você usa o Live Server do VSCode, é provável que seja essa a porta.
        const resetLink = `http://127.0.0.1:5500/reset-password.html?token=${token}`;

        // 5. Configurar o email
        const mailOptions = {
            from: `"Sistema TCC" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Redefinição de Senha - Sistema de Chamados',
            html: `
                <p>Olá ${user.name},</p>
                <p>Você solicitou a redefinição da sua senha.</p>
                <p>Clique no link abaixo para criar uma nova senha:</p>
                <a href="${resetLink}" target="_blank">${resetLink}</a>
                <p>Este link expira em 1 hora.</p>
                <p>Se você não solicitou isso, por favor, ignore este email.</p>
            `
        };

        // 6. Enviar o email
        await transporter.sendMail(mailOptions);
        
        res.json({ success: true, message: 'Se um usuário com este email existir, um link de redefinição será enviado.' });

    } catch (error) {
        console.error("Erro em /forgot-password:", error);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});


// ROTA 2: Redefinir a senha (salvando em texto puro)
app.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Token e nova senha são obrigatórios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        // 1. Encontrar o usuário pelo token E verificar se não expirou
        const [rows] = await connection.execute(
            'SELECT * FROM Users WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()',
            [token]
        );

        if (rows.length === 0) {
            await connection.end();
            return res.status(400).json({ success: false, message: 'Token inválido ou expirado.' });
        }

        const user = rows[0];

        // 2. Atualizar a senha (em TEXTO PURO) e limpar o token
        await connection.execute(
            'UPDATE Users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?',
            [password, user.id] // Salva a nova senha em texto puro
        );
        
        await connection.end();

        res.json({ success: true, message: 'Senha redefinida com sucesso!' });

    } catch (error) {
        console.error("Erro em /reset-password:", error);
        res.status(500).json({ success: false, message: 'Erro no servidor ao redefinir a senha.' });
    }
});

app.get('/api/tickets/analyst', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [tickets] = await connection.execute(
            'SELECT t.*, u.name as user_name FROM Tickets t JOIN Users u ON t.user_id = u.id ORDER BY t.created_at DESC'
        );
        await connection.end();

        const formattedTickets = tickets.map(t => ({
            id: t.id,
            user: t.user_name,
            title: t.title,
            cat: t.category,
            urg: t.urgency_ia,
            iaConf: t.ia_confidence,
            status: t.status,
            updated: new Date(t.updated_at).toISOString().slice(0, 10),
            desc: t.description
        }));
        res.json(formattedTickets);
    } catch (error) {
        console.error("Erro ao buscar chamados do analista:", error);
        res.status(500).json([]);
    }
});

app.get('/api/tickets/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ message: 'ID do usuário não fornecido.' });
        }

        const connection = await mysql.createConnection(dbConfig);
        const [tickets] = await connection.execute(
            'SELECT * FROM Tickets WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        await connection.end();

        const formattedTickets = tickets.map(t => ({
            id: t.id,
            titulo: t.title,         
            categoria: t.category,    
            urg: t.urgency_ia,        
            status: t.status,
            updated: new Date(t.updated_at).toISOString().slice(0, 10),
            desc: t.description      
        }));

        res.json(formattedTickets);

    } catch (error) {
        console.error("Erro ao buscar chamados do usuário:", error);
        res.status(500).json([]);
    }
});

app.post('/api/tickets', async (req, res) => {
    const { titulo, descricao, categoria, urg, userId } = req.body; 

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO Tickets (title, description, category, urgency_ia, user_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            [titulo, descricao, categoria, urg, userId, 'Aberto'] 
        );
        await connection.end();

        res.json({ success: true, newId: result.insertId });
    } catch (error) {
        console.error("Erro ao criar chamado:", error);
        res.status(500).json({ success: false, message: 'Erro ao criar chamado.' });
    }
});

app.put('/api/tickets/:ticketId/status', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { newStatus } = req.body; 

        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE Tickets SET status = ? WHERE id = ?',
            [newStatus, ticketId]
        );
        await connection.end();

        res.json({ success: true, message: 'Status atualizado!' });
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

app.post('/api/tickets/:ticketId/reply', async (req, res) => {
    try {
        const { ticketId } = req.params;

        const { analyst_id, comment } = req.body; 
        const userId = analyst_id;

        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO TicketHistory (ticket_id, user_id, comment) VALUES (?, ?, ?)',
            [ticketId, userId, comment]
        );
        await connection.end();

        res.json({ success: true, message: 'Resposta enviada!' });
    } catch (error) {
        console.error("Erro ao enviar resposta:", error);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

app.get('/api/tickets/:ticketId/history', async (req, res) => {
    try {
        const { ticketId } = req.params;

        const connection = await mysql.createConnection(dbConfig);
        const [history] = await connection.execute(
            `SELECT th.*, u.name as author_name, u.role as author_role 
             FROM TicketHistory th 
             JOIN Users u ON th.user_id = u.id 
             WHERE th.ticket_id = ? 
             ORDER BY th.created_at ASC`,
            [ticketId]
        );
        await connection.end();

        res.json(history); 
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        res.status(500).json([]);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
    console.log('Aguardando conexões e requisições do front-end...');
});