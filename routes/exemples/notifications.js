const express = require('express');
const { queryDb } = require('../../models/db'); // Ajuste conforme necessário para sua conexão PostgreSQL
const { checkPermission } = require('../../middleware/checked');
const router = express.Router();

// Rota para obter todas as notificações para um usuário específico

router.post('/all', async (req, res) => {
    const cdUser = req.user?.cdSequence || null; // ID do usuário
    const { page = 1, limit = 1000 } = req.body; // Paginação

    const offset = (page - 1) * limit;

    try {
        // Verifica se o usuário tem permissão "ADMIN"
        const userPermissionQuery = `
            SELECT CD_PERMISSION 
            FROM TB_USERS 
            WHERE CD_SEQUENCE = $1
        `;
        const userPermissionResult = await queryDb(userPermissionQuery, [cdUser]);

        const isAdmin = userPermissionResult[0]?.cd_permission == '1';

        let SQL;
        let params;

        if (isAdmin) {
            SQL = `
                SELECT * FROM TB_NOTIFICATIONS 
                ORDER BY DT_CREATE DESC
                LIMIT $1 OFFSET $2
            `;
            params = [limit, offset];
        } else {
            SQL = `
                SELECT * FROM TB_NOTIFICATIONS 
                ORDER BY DT_CREATE DESC
                LIMIT $1 OFFSET $2
            `;
                // AND (IS_PRIVATE = 1 OR IS_PRIVATE IS NOT NULL)
                // WHERE CD_USER = $1 
            // params = [cdUser, limit, offset];
            params = [limit, offset];
        }

        const results = await queryDb(SQL, params);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Rota para pegar todas as notificações não lidas
router.post('/notification-unread', async (req, res) => {
    const cdUser = req.user?.cdSequence || null; // ID do usuário

    try {
        // Verifica se o usuário tem permissão "ADMIN"
        const userPermissionQuery = `
            SELECT CD_PERMISSION 
            FROM TB_USERS 
            WHERE CD_SEQUENCE = $1
        `;
        const userPermissionResult = await queryDb(userPermissionQuery, [cdUser]);

        const isAdmin = userPermissionResult[0]?.cd_permission== '1';

        let SQL;
        let params;

        if (isAdmin) {
            // Se o usuário for admin, contar todas as notificações não lidas
            SQL = `
                SELECT COUNT(*) AS total_unread
                FROM TB_NOTIFICATIONS
                WHERE IS_READ = 0;
            `;
            params = [];
        } else {
            // Se for usuário (não cliente), contar todas as notificações não lidas do usuário e as que não são privadas
            SQL = `
                SELECT COUNT(*) AS total_unread
                FROM TB_NOTIFICATIONS
                WHERE IS_READ = 0
                `;
                // AND (CD_USER = $1 
                //     AND (IS_PRIVATE = 1 OR IS_PRIVATE IS NOT NULL));
            // params = [cdUser];
            params = [];
        }

        const results = await queryDb(SQL, params);

        // Retorna o total de notificações não lidas
        return res.status(200).json({
            totalUnread: results[0].total_unread
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Rota para obter uma notificação específica por CD_SEQUENCE
router.post('/notification-unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código da notificação é obrigatório!' });
    }
    try {
        const SQL = "SELECT * FROM TB_NOTIFICATIONS WHERE CD_SEQUENCE = $1";
        const results = await queryDb(SQL, [cdSequence]);
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Rota para criar uma nova notificação
router.post('/notification-create', async (req, res) => {
    const {
        cdUser, 
        cdClient, 
        title,
        tpNotification, 
        msgNotification, 
        actionRequired, 
        link, 
        attachment, 
        priority, 
        isPrivate,
        isRead
    } = req.body;

    try {
        // Verificações obrigatórias
        if (!title) return res.status(422).json({ message: 'O título da notificação é obrigatório!' });
        if (!tpNotification) return res.status(422).json({ message: 'O tipo de notificação é obrigatório!' });
        if (!msgNotification) return res.status(422).json({ message: 'A mensagem da notificação é obrigatória!' });
       
        // Query SQL para inserir a notificação
        const SQL = `
            INSERT INTO TB_NOTIFICATIONS (
                CD_USER, 
                CD_CLIENT, 
                TITLE,
                TP_NOTIFICATION, 
                MSG_NOTIFICATION, 
                ACTION_REQUIRED, 
                LINK, 
                ATTACHMENT, 
                PRIORITY, 
                IS_PRIVATE, 
                IS_READ
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING CD_SEQUENCE
        `;
        
        const values = [
            cdUser, 
            cdClient, 
            title,
            tpNotification, 
            msgNotification, 
            actionRequired || 0, 
            link || null, 
            attachment || null,
            priority || 4, 
            isPrivate || 0, 
            isRead || 0
        ];
        
        const results = await queryDb(SQL, values);

        // Resposta de sucesso
        return res.status(201).json({ 
            message: "Notificação criada com sucesso!", 
            cdSequence: results[0].cd_sequence 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Rota para atualizar o status de leitura de uma notificação
router.post('/notification-read', async (req, res) => {
    const { cdSequence} = req.body;
    console.log(cdSequence)
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código da notificação é obrigatório!' });
    }
    try {
        const SQL = `UPDATE TB_NOTIFICATIONS SET 
                IS_READ = 1,
                DT_READ = CURRENT_TIMESTAMP
            WHERE CD_SEQUENCE = $1`;

        await queryDb(SQL, [cdSequence]);
        return res.status(200).json({ message: "Notificação atualizada com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Rota para deletar uma notificação
router.post('/notification-delete', checkPermission(['ALL']), async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código da notificação é obrigatório!' });
    }
    try {
        const SQL = "DELETE FROM TB_NOTIFICATIONS WHERE CD_SEQUENCE = $1";
        await queryDb(SQL, [cdSequence]);
        return res.status(200).json({ message: "Notificação deletada com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});

module.exports = router;
