const express = require('express');
const { queryDb } = require('../../models/db');
const { getUserCodes } = require('../../functions/functionsAll');
const router = express.Router();

// Rota para o endpoint /map
router.post('/map', async (req, res) => {
    const cdUserRegistered = req.user?.cdSequence || null;

    try {
        // Recupera as permissões do usuário autenticado
        const { cd_permission, cd_module, cd_health_unit } = await getUserCodes(cdUserRegistered);

        if (!cdUserRegistered) {
            return res.status(403).json({ message: 'Você não possui permissão para acessar o mapeamento das equipes de saúde!' });
        }

        let SQL = `
            SELECT cd_sequence, nm_team 
            FROM tb_prin_health_teams
            WHERE is_active = 1
        `;

        // Adiciona filtros com base no nível de permissão do usuário
        if (cd_permission === 1) { // Acesso total (administrador)
            const { cdHealthUnit } = req.body;
            if (!cdHealthUnit) {
                return res.status(400).json({ message: 'A unidade de saúde é obrigatória!' });
            }
            SQL += ` AND cd_health_unit = ${cdHealthUnit}`;
        } else if (cd_permission === 2) { // Acesso restrito por unidade de saúde
            SQL += ` AND cd_health_unit = ${cd_health_unit}`;
        } else if (cd_permission === 3) { // Acesso restrito por unidade e módulo
            SQL += ` AND cd_health_unit = ${cd_health_unit} AND cd_module = ${cd_module}`;
        } else {
            return res.status(403).json({ message: 'Você não possui permissão para acessar o mapeamento das equipes de saúde!' });
        }

        // Adiciona ordenação
        SQL += ' ORDER BY nm_team ASC';

        // Executa a consulta no banco de dados
        const results = await queryDb(SQL);

        // Cria os arrays para os resultados
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_team);

        // Retorna os arrays no formato JSON
        return res.status(200).json({
            cdSequenceArray,
            labelsArray,
        });
    } catch (error) {
        console.error("Erro ao processar o mapeamento das equipes de saúde:", error);
        return res.status(500).json({ message: "Erro ao obter o mapeamento das equipes de saúde. Tente novamente mais tarde." });
    }
});


// Rota para obter todas as equipes de saúde
router.post('/all', async (req, res) => {
    const cdUserRegistered = req.user?.cdSequence || null;

    try {
        const { cd_permission, cd_module, cd_health_unit } = await getUserCodes(cdUserRegistered);

        // Verifica se o usuário tem permissão para acessar
        if (!cdUserRegistered) {
            return res.status(403).json({ message: 'Você não possui permissão para acessar as equipes de saúde!' });
        }

        const { cdHealthUnit } = req.body;

        // Verifica se a unidade de saúde é necessária para permissão 1
        if (cd_permission === 1 && !cdHealthUnit) {
            return res.status(400).json({ message: 'A unidade de saúde é obrigatória!' });
        }

        // Base da consulta SQL
        let SQL = `
            SELECT 
                ht.*, 
                hu.nm_unit AS nm_health_unit,
                u_responsible.nm_user AS nm_user_responsible,
                u_registered.nm_user AS nm_user_registered,
                u_update.nm_user AS nm_user_update
            FROM 
                tb_prin_health_teams ht
            LEFT JOIN 
                tb_prin_health_units hu ON hu.cd_sequence = ht.cd_health_unit
            LEFT JOIN 
                tb_prin_users u_responsible ON u_responsible.cd_sequence = ht.cd_user_responsible
            LEFT JOIN 
                tb_prin_users u_registered ON u_registered.cd_sequence = ht.cd_user_registered
            LEFT JOIN 
                tb_prin_users u_update ON u_update.cd_sequence = ht.cd_user_update
            WHERE 
                ht.is_active = 1
        `;

        // Adiciona filtros conforme a permissão do usuário
        if (cd_permission === 1) {
            // Acesso total (pergunta pela unidade de saúde)
            SQL += ` AND ht.cd_health_unit = ${cdHealthUnit}`;
        } else if (cd_permission === 2) {
            // Restrito por unidade de saúde
            SQL += ` AND ht.cd_health_unit = ${cd_health_unit}`;
        } else if (cd_permission === 3) {
            // Restrito por unidade e módulo
            SQL += ` AND ht.cd_health_unit = ${cd_health_unit} AND ht.cd_module = ${cd_module}`;
        } else {
            return res.status(403).json({ message: 'Você não possui permissão para acessar as equipes de saúde!' });
        }

        // Finaliza a consulta com ordenação
        SQL += ` ORDER BY ht.nm_team ASC`;

        const results = await queryDb(SQL);
        return res.status(200).json(results);

    } catch (error) {
        console.error("Erro ao obter as equipes de saúde:", error);
        return res.status(500).json({ message: 'Erro ao obter as equipes de saúde. Tente novamente mais tarde.' });
    }
});


// Rota para obter uma equipe de saúde por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código da equipe de saúde é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_health_teams
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Equipe de saúde não encontrada!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar a equipe de saúde. Tente novamente mais tarde." });
    }
});

// Rota para criar uma nova equipe de saúde
router.post('/create', async (req, res) => {
    try {
        const { cdUserResponsible, nmTeam, dsArea, cdArea, cdSegment, cdsUserTeam } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        if (!nmTeam) {
            return res.status(422).json({ message: 'O nome da equipe de saúde é obrigatório!' });
        }

        // Verifica se o usuário tem permissão para criar a equipe de saúde
        let healthUnit;
        if (cd_permission === 1) { // Administrador - pode escolher qualquer unidade de saúde
            const { cdHealthUnit } = req.body;
            if (!cdHealthUnit) {
                return res.status(422).json({ message: 'A unidade de saúde é obrigatória!' });
            }
            healthUnit = cdHealthUnit; // Unidade fornecida pelo corpo da requisição
        } else if (cd_permission === 2 || cd_permission === 3) { // Acesso restrito
            healthUnit = cd_health_unit; // Unidade associada ao usuário com a permissão
        } else {
            return res.status(403).json({ message: 'Você não tem permissão para criar uma equipe de saúde!' });
        }

        // Inserir a nova equipe de saúde
        const SQL = `
            INSERT INTO tb_prin_health_teams (cd_health_unit, cd_user_responsible, cd_user_registered, nm_team, ds_area, cd_area, cd_segment, cds_user_team)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await queryDb(SQL, [healthUnit, cdUserResponsible, cdUserRegistered, nmTeam, dsArea, cdArea, cdSegment, cdsUserTeam]);

        return res.status(201).json({ message: 'Equipe de saúde criada com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ocorreu um erro no servidor, tente novamente mais tarde.' });
    }
});

// Rota para atualizar uma equipe de saúde
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, cdHealthUnit, cdUserResponsible, nmTeam, dsArea, cdArea, cdSegment, cdsUserTeam } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código da equipe de saúde é obrigatório!' });
        }

        // Verifica as permissões do usuário
        let healthUnit;
        if (cd_permission === 1) { // Administrador - pode escolher qualquer unidade de saúde
            if (!cdHealthUnit) {
                return res.status(422).json({ message: 'A unidade de saúde é obrigatória!' });
            }
            healthUnit = cdHealthUnit; // Unidade fornecida pelo corpo da requisição
        } else if (cd_permission === 2 || cd_permission === 3) { // Acesso restrito
            healthUnit = cd_health_unit; // Unidade associada ao usuário com a permissão
        } else {
            return res.status(403).json({ message: 'Você não tem permissão para atualizar a equipe de saúde!' });
        }

        // Atualizar a equipe de saúde
        const SQL = `
            UPDATE tb_prin_health_teams
            SET 
                cd_health_unit = COALESCE($1, cd_health_unit),
                cd_user_responsible = COALESCE($2, cd_user_responsible),
                nm_team = COALESCE($3, nm_team),
                ds_area = COALESCE($4, ds_area),
                cd_area = COALESCE($5, cd_area),
                cd_segment = COALESCE($6, cd_segment),
                cds_user_team = COALESCE($7, cds_user_team),
                cd_user_update = COALESCE($8, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $9
        `;
        const result = await queryDb(SQL, [healthUnit, cdUserResponsible, nmTeam, dsArea, cdArea, cdSegment, cdsUserTeam, cdUserRegistered, cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Equipe de saúde não encontrada ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Equipe de saúde atualizada com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ocorreu um erro no servidor, tente novamente mais tarde.' });
    }
});


// Rota para excluir (desativar) uma equipe de saúde
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código da equipe de saúde é obrigatório!' });
        }

        const teamExists = await queryDb(
            `SELECT * FROM tb_prin_health_teams WHERE cd_sequence = $1`,
            [cdSequence]
        );

        if (teamExists.length === 0) {
            return res.status(404).json({ message: 'Equipe de saúde não encontrada!' });
        }

        const SQL = `
            UPDATE tb_prin_health_teams
            SET 
                is_active = 0,
                is_deleted = 1,
                cd_user_update = COALESCE($2, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $1
        `;
        await queryDb(SQL, [cdSequence, cdUserRegistered]);

        return res.status(200).json({ message: "Equipe de saúde excluída com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir a equipe de saúde. Tente novamente mais tarde." });
    }
});

module.exports = router;
