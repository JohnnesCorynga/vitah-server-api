const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();


// Rota para o endpoint /map
router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT 
                r.cd_sequence, 
                r.nm_report, 
                r.ds_data, 
                r.dt_generation, 
                r.dt_create, 
                r.dt_update, 
                u_registered.nm_user AS registered_user,
                u_updated.nm_user AS updated_user
            FROM 
                tb_prin_reports r
            LEFT JOIN 
                tb_prin_users u_registered ON u_registered.cd_sequence = r.cd_user_registered
            LEFT JOIN 
                tb_prin_users u_updated ON u_updated.cd_sequence = r.cd_user_update
            ORDER BY 
                r.dt_generation DESC;
        `;

        const results = await queryDb(SQL);

        // Organizar os dados de resposta
        const reportMap = results.map(item => ({
            cdSequence: item.cd_sequence,
            reportName: item.nm_report,
            reportData: item.ds_data,
            generationDate: item.dt_generation,
            creationDate: item.dt_create,
            updateDate: item.dt_update,
            registeredUser: item.registered_user,
            updatedUser: item.updated_user || null,
        }));

        return res.status(200).json({
            reportMap,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os relatórios gerados. Tente novamente mais tarde." });
    }
});

// Rota para obter todos os relatórios
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_reports
            ORDER BY dt_generation DESC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os relatórios. Tente novamente mais tarde." });
    }
});

// Rota para obter um relatório por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do relatório é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_reports
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Relatório não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o relatório. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo relatório
router.post('/create', async (req, res) => {
    try {

        const { nmReport, dsData } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;

        if (!nmReport) {
            return res.status(422).json({ message: 'O campo "nome do relatório" é obrigatório!' });
        }

        if (!dsData) {
            return res.status(422).json({ message: 'O campo "dados do relatório" é obrigatório!' });
        }

        if (!cdUserRegistered) {
            return res.status(422).json({ message: 'O campo "usuário registrado" é obrigatório!' });
        }


        const SQL = `
            INSERT INTO tb_prin_reports (cd_user_registered, nm_report, ds_data)
            VALUES ($1, $2, $3)
        `;
        await queryDb(SQL, [cdUserRegistered, nmReport, dsData]);

        return res.status(201).json({ message: 'Relatório criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o relatório. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar um relatório
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, nmReport, dsData } = req.body;

        const cdUserUpdate = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do relatório é obrigatório!' });
        }

        const SQL = `
            UPDATE tb_prin_reports
            SET 
                nm_report = COALESCE($1, nm_report),
                ds_data = COALESCE($2, ds_data),
                cd_user_update = COALESCE($3, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $4
        `;
        const result = await queryDb(SQL, [nmReport, dsData, cdUserUpdate, cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Relatório não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Relatório atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o relatório. Tente novamente mais tarde.' });
    }
});

// Rota para excluir (desativar) um relatório
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;

        const cdUserUpdate = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do relatório é obrigatório!' });
        }

        const reportExists = await queryDb(
            `SELECT * FROM tb_prin_reports WHERE cd_sequence = $1`,
            [cdSequence]
        );

        if (reportExists.length === 0) {
            return res.status(404).json({ message: 'Relatório não encontrado!' });
        }

        const SQL = `
            UPDATE tb_prin_reports
            SET
                is_active = 0,
                is_deleted = 1,
                cd_user_update = COALESCE($1, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2
        `;


        await queryDb(SQL, [cdUserUpdate,cdSequence]);

        return res.status(200).json({ message: "Relatório excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir o relatório. Tente novamente mais tarde." });
    }
});

module.exports = router;
