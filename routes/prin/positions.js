const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

// Rota para obter todos os cargos ativos
router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT * 

            FROM tb_prin_positions
            WHERE is_active = 1
            ORDER BY nm_position ASC;
        `;
        const results = await queryDb(SQL);

        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_position);

        return res.status(200).json({
            cdSequenceArray,
            labelsArray,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os cargos. Tente novamente mais tarde." });
    }
});

// Rota para obter todos os cargos
router.post('/all', async (req, res) => {
    try {
        const SQL = "SELECT * FROM tb_prin_positions WHERE is_active = 1";
        const results = await queryDb(SQL);

        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde." });
    }
});

// Rota para buscar um cargo específico
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do cargo é obrigatório!' });
    }

    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_positions
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Cargo não encontrado!' });
        }

        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao buscar o cargo.' });
    }
});

// Rota para criar um novo cargo
router.post('/create', async (req, res) => {
    const {
        cdDepartment,
        nmPosition,
        dsPosition,
        isActive
    } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;
    if (!cdDepartment || !nmPosition) {
        return res.status(422).json({ message: 'Os campos obrigatórios não foram preenchidos!' });
    }

    try {
        const SQL = `
            INSERT INTO tb_prin_positions (
                cd_department, nm_position, ds_position, is_active,cd_user_registered
            )
            VALUES (
                $1, $2, $3, $4,$5
            )
        `;
        await queryDb(SQL, [
            cdDepartment,
            nmPosition,
            dsPosition,
            isActive || 1,
            cdUserRegistered
        ]);

        return res.status(201).json({ message: 'Cargo criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o cargo.' });
    }
});

// Rota para atualizar um cargo
router.post('/update', async (req, res) => {
    const {
        cdSequence,
        cdDepartment,
        nmPosition,
        dsPosition,
        isActive
    } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do cargo é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE tb_prin_positions
            SET 
                cd_department = COALESCE($1, cd_department),
                nm_position = COALESCE($2, nm_position),
                ds_position = COALESCE($3, ds_position),
                is_active = COALESCE($4, is_active),
                cd_user_update = COALESCE($5, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $6
        `;
        const result = await queryDb(SQL, [
            cdDepartment,
            nmPosition,
            dsPosition,
            isActive,
            cdUserRegistered,
            cdSequence
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Cargo não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Cargo atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o cargo.' });
    }
});

// Rota para excluir um cargo
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;

    const cdUserRegistered = req.user?.cdSequence || null;
    
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do cargo é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE tb_prin_positions
            SET is_active = 0,
            is_deleted = 1,
            cd_user_update = COALESCE($1, cd_user_update),
            dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2;
        `;
        await queryDb(SQL, [cdUserRegistered,cdSequence]);

        return res.status(200).json({ message: 'Cargo excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir o cargo.' });
    }
});

module.exports = router;
