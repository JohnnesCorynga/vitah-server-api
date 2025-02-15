const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();


// Rota para o endpoint /map
router.post('/map', async (req, res) => {
    try {
        // Query SQL para pegar todos os procedimentos ativos
        const SQL = `
            SELECT cd_procedure, ds_procedure
            FROM tb_prin_sigtap
            WHERE is_active = 1
            ORDER BY ds_procedure ASC;
        `;
        
        const results = await queryDb(SQL);

        // Criar dois arrays: um para cd_procedure e outro para ds_procedure
        const cdProcedureArray = results.map(item => item.cd_procedure);
        const descriptionArray = results.map(item => item.ds_procedure);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdProcedureArray,
            descriptionArray
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os procedimentos. Tente novamente mais tarde." });
    }
});

// Rota para obter todos os procedimentos
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_sigtap
            ORDER BY ds_procedure ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os procedimentos. Tente novamente mais tarde." });
    }
});

// Rota para obter um procedimento específico por código
router.post('/unic', async (req, res) => {
    const { cdProcedure } = req.body;
    if (!cdProcedure) {
        return res.status(422).json({ message: 'O código do procedimento é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_sigtap
            WHERE cd_procedure = $1;
        `;
        const results = await queryDb(SQL, [cdProcedure]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Procedimento não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o procedimento. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo procedimento
router.post('/create', async (req, res) => {
    try {
        const { cdProcedure, dsProcedure, dsComplexity, fundingType, procedureCost } = req.body;
        
        const cdUserRegistered = req.user?.cdSequence || null;
        
        if (!cdProcedure || !dsProcedure) {
            return res.status(422).json({ message: 'Código e descrição do procedimento são obrigatórios!' });
        }

        // Verifica se o procedimento já existe
        const procedureExists = await queryDb(
            `SELECT * FROM tb_prin_sigtap WHERE cd_procedure = $1`,
            [cdProcedure]
        );

        if (procedureExists.length > 0) {
            return res.status(422).json({ message: 'Este procedimento já está cadastrado!' });
        }

        // Inserir novo procedimento
        const SQL = `
            INSERT INTO tb_prin_sigtap 
            (cd_procedure, ds_procedure, ds_complexity, funding_type, procedure_cost, cd_user_registered)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await queryDb(SQL, [cdProcedure, dsProcedure, dsComplexity, fundingType, procedureCost, cdUserRegistered]);

        return res.status(201).json({ message: 'Procedimento criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ocorreu um erro no servidor, tente novamente mais tarde.' });
    }
});

// Rota para atualizar um procedimento
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, cdProcedure, dsProcedure, dsComplexity, fundingType, procedureCost } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;
        
        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do procedimento é obrigatório!' });
        }

        const SQL = `
            UPDATE tb_prin_sigtap
            SET 
                cd_procedure = COALESCE($1, cd_procedure),
                ds_procedure = COALESCE($2, ds_procedure),
                ds_complexity = COALESCE($3, ds_complexity),
                funding_type = COALESCE($4, funding_type),
                procedure_cost = COALESCE($5, procedure_cost),
                cd_user_update = COALESCE($6, cd_user_update),
                dt_updated = CURRENT_TIMESTAMP
            WHERE cd_sequence = $7
        `;
        const result = await queryDb(SQL, [cdProcedure, dsProcedure, dsComplexity, fundingType, procedureCost, cdUserRegistered, cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Procedimento não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Procedimento atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ocorreu um erro no servidor, tente novamente mais tarde.' });
    }
});

// Rota para excluir (desativar) um procedimento
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do procedimento é obrigatório!' });
        }

        const procedureExists = await queryDb(
            `SELECT * FROM tb_prin_sigtap WHERE cd_sequence = $1`,
            [cdSequence]
        );

        if (procedureExists.length === 0) {
            return res.status(404).json({ message: 'Procedimento não encontrado!' });
        }

        const SQL = `
            UPDATE tb_prin_sigtap
            SET 
                is_active = 0,
                is_deleted = 1,
                cd_user_update = $2,
                dt_updated = CURRENT_TIMESTAMP
            WHERE cd_sequence = $1
        `;
        await queryDb(SQL, [cdSequence, req.user?.cdSequence]);

        return res.status(200).json({ message: "Procedimento excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir o procedimento. Tente novamente mais tarde." });
    }
});

module.exports = router;
