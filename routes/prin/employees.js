const express = require('express');
const { queryDb } = require('../../models/db'); // Ajuste conforme necessário para sua conexão PostgreSQL
const {isValidCPF,checkEmailExists,checkCPFExists,checkNrRegistrationExist, getUserCodes} = require('../../functions/functionsAll');
const router = express.Router();

router.post('/map', async (req, res) => {
    const cdUserRegistered = req.user?.cdSequence || null;

    try {
        // Recupera as permissões do usuário autenticado
        const { cd_permission, cd_module, cd_health_unit } = await getUserCodes(cdUserRegistered);

        if (!cdUserRegistered) {
            return res.status(403).json({ message: 'Você não possui permissão para acessar o mapeamento de funcionários!' });
        }

        let SQL;

        // Define a query SQL com base no nível de permissão do usuário
        if (cd_permission === 1) { // Acesso total (administrador)
            const { cdHealthUnit } = req.body;
            if (!cdHealthUnit) {
                return res.status(400).json({ message: 'A unidade de saúde é obrigatório!' });
            }
            SQL = `
                SELECT cd_sequence, nm_full 
                FROM tb_prin_employees
                WHERE is_active = 1
                AND cd_health_unit = ${cdHealthUnit}
                ORDER BY nm_full ASC;
            `;
        } else if (cd_permission === 2) { // Acesso restrito por unidade de saúde
            SQL = `
                SELECT cd_sequence, nm_full 
                FROM tb_prin_employees
                WHERE is_active = 1 
                AND cd_health_unit = ${cd_health_unit}
                ORDER BY nm_full ASC;
            `;
        } else if (cd_permission === 3) { // Acesso restrito por unidade e módulo
            SQL = `
                SELECT cd_sequence, nm_full 
                FROM tb_prin_employees
                WHERE is_active = 1 
                AND cd_health_unit = ${cd_health_unit}
                AND cd_module = ${cd_module}
                ORDER BY nm_full ASC;
            `;
        } else {
            return res.status(403).json({ message: 'Você não possui permissão para acessar o mapeamento de funcionários!' });
        }

        // Executa a consulta no banco de dados
        const results = await queryDb(SQL);

        // Cria os arrays para os resultados
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_full);

        // Retorna os arrays no formato JSON
        return res.status(200).json({
            cdSequenceArray,
            labelsArray,
        });
    } catch (error) {
        console.error("Erro ao processar o mapeamento:", error);
        return res.status(500).json({ message: "Erro ao obter o mapeamento de funcionários. Tente novamente mais tarde." });
    }
});

// Rota para obter todos os funcionários
router.post('/all', async (req, res) => {
    const cdUserRegistered = req.user?.cdSequence || null;

    try {
        const { cd_permission, cd_module, cd_health_unit } = await getUserCodes(cdUserRegistered);

        // Verifica se o usuário tem permissão para acessar
        if (!cdUserRegistered) {
            return res.status(403).json({ message: 'Você não possui permissão para acessar os funcionários!' });
        }

        const { cdHealthUnit } = req.body;

        // Verifica se a unidade de saúde é necessária para permissão 1
        if (cd_permission === 1 && !cdHealthUnit) {
            return res.status(400).json({ message: 'A unidade de saúde é obrigatória!' });
        }

        // Base da consulta SQL
        let SQL = `
            SELECT 
                e.*, 
                hu.nm_unit,
                dep.nm_department,
                p.nm_position,
                u_register.nm_user AS nm_user_registered,
                u_update.nm_user AS nm_user_update
            FROM 
                tb_prin_employees e
            LEFT JOIN 
                tb_prin_health_units hu ON hu.cd_sequence = e.cd_health_unit
            LEFT JOIN 
                tb_prin_departments dep ON dep.cd_sequence = e.cd_department
            LEFT JOIN 
                tb_prin_positions p ON p.cd_sequence = e.cd_position
            LEFT JOIN 
                tb_prin_users u_register ON u_register.cd_sequence = e.cd_user_registered
            LEFT JOIN 
                tb_prin_users u_update ON u_update.cd_sequence = e.cd_user_update
            WHERE 
                e.is_active = 1
        `;


        // Adiciona filtros conforme a permissão do usuário
        if (cd_permission === 1) {
            // Acesso total (pergunta pela unidade de saúde)
            SQL += ` AND e.cd_health_unit = ${cdHealthUnit}`;
        } else if (cd_permission === 2) {
            // Restrito por unidade de saúde
            SQL += ` AND e.cd_health_unit = ${cd_health_unit}`;
        } else if (cd_permission === 3) {
            // Restrito por unidade e módulo
            SQL += ` AND e.cd_health_unit = ${cd_health_unit} AND e.cd_module = ${cd_module}`;
        } else {
            return res.status(403).json({ message: 'Você não possui permissão para acessar os funcionários!' });
        }

        // Finaliza a consulta com ordenação
        SQL += ` ORDER BY e.nm_full ASC`;

        const results = await queryDb(SQL);
        return res.status(200).json(results);

    } catch (error) {
        console.error("Erro ao obter funcionários:", error);
        return res.status(500).json({ message: 'Erro ao obter os funcionários. Tente novamente mais tarde.' });
    }
});


// Rota para buscar um funcionário específico
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do funcionário é obrigatório!' });
    }

    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_employees
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Funcionário não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao buscar o funcionário.' });
    }
});

// Rota para criar um novo funcionário
router.post('/create', async (req, res) => {
    const {
        cdDepartment,
        cdHealthUnit,
        cdPosition,
        nrRegistration,
        nmFull,
        nmSocial,
        dsPhoto,
        nrCpf,
        nrRg,
        dtBirth,
        nrPhone,
        email,
        tpGender,
        dtAdmission,
    } = req.body;
   
    const cdUserRegistered = req.user?.cdSequence || null;

    if (!nmFull) { return res.status(422).json({ message: 'O campo "Nome Completo" é obrigatório!' }); }
    if (!nrCpf) { return res.status(422).json({ message: 'O campo "CPF" é obrigatório!' }); }
    if (!nrRegistration) { return res.status(422).json({ message: 'O campo Matricula é obrigatório!' }); }
    if (!cdHealthUnit) { return res.status(422).json({ message: 'O campo "Unidade de Saúde" é obrigatório!' }); }
    if (!cdDepartment) { return res.status(422).json({ message: 'O campo "Departamento" é obrigatório!' }); }
    if (!cdPosition) { return res.status(422).json({ message: 'O campo "Função" é obrigatório!' }); }
    if (!dtAdmission) { return res.status(422).json({ message: 'O campo "Data de Admissão" é obrigatório!' }); }

    if (!isValidCPF(nrCpf)) {
        return res.status(400).json({ message: 'CPF inválido!' });
    }

    try {
        if (await checkNrRegistrationExist(nrRegistration)) {
            return res.status(422).json({ message: 'Já existe um funcionário com esta Matricula!' });
        }
        if (await checkEmailExists(email)) {
            return res.status(422).json({ message: 'Já existe um funcionário com este email!' });
        }

        if (await checkCPFExists(nrCpf)) {
            return res.status(422).json({ message: 'Já existe um funcionário com este CPF!' });
        }

        const SQL = `
            INSERT INTO tb_prin_employees (
                cd_department,nr_registration,cd_health_unit, cd_position, nm_full, nm_social, ds_photo,
                nr_cpf, nr_rg, dt_birth, nr_phone, email, tp_gender, dt_admission, cd_user_registered
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14 ,$15)
        `;
        await queryDb(SQL, [
            cdDepartment,
            nrRegistration,
            cdHealthUnit,
            cdPosition,
            nmFull,
            nmSocial,
            dsPhoto,
            nrCpf,
            nrRg,
            dtBirth,
            nrPhone,
            email,
            tpGender,
            dtAdmission,
            cdUserRegistered
        ]);

        return res.status(201).json({ message: 'Funcionário criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o funcionário.' });
    }
});

// Rota para atualizar um funcionário
router.post('/update', async (req, res) => {
    const { cdSequence, 
        cdDepartment, 
        cdHealthUnit, 
        cdPosition, 
        nmFull, 
        nmSocial, 
        dsPhoto, 
        nrCpf, 
        nrRg, 
        dtBirth, 
        nrPhone, 
        email, 
        tpGender, 
        dtAdmission, 
    } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do funcionário é obrigatório!' });
    }
    if (!nmFull) { return res.status(422).json({ message: 'O campo "Nome Completo" é obrigatório!' }); }
    if (!nrCpf) { return res.status(422).json({ message: 'O campo "CPF" é obrigatório!' }); }
    if (!cdHealthUnit) { return res.status(422).json({ message: 'O campo "Unidade de Saúde" é obrigatório!' }); }
    if (!cdDepartment) { return res.status(422).json({ message: 'O campo "Departamento" é obrigatório!' }); }
    if (!cdPosition) { return res.status(422).json({ message: 'O campo "Função" é obrigatório!' }); }
    if (!dtAdmission) { return res.status(422).json({ message: 'O campo "Data de Admissão" é obrigatório!' }); }


    if (!isValidCPF(nrCpf)) {
        return res.status(400).json({ message: 'CPF inválido!' });
    }

    try {
        if (await checkEmailExists(email, cdSequence)) {
            return res.status(422).json({ message: 'Já existe um funcionário com este email!' });
        }

        if (await checkCPFExists(nrCpf, cdSequence)) {
            return res.status(422).json({ message: 'Já existe um funcionário com este CPF!' });
        }

        const SQL = `
            UPDATE tb_prin_employees
            SET 
                cd_department = COALESCE($1, cd_department),
                cd_health_unit = COALESCE($2, cd_health_unit),
                cd_position = COALESCE($3, cd_position),
                nm_full = COALESCE($4, nm_full),
                nm_social = COALESCE($5, nm_social),
                ds_photo = COALESCE($6, ds_photo),
                nr_cpf = COALESCE($7, nr_cpf),
                nr_rg = COALESCE($8, nr_rg),
                dt_birth = COALESCE($9, dt_birth),
                nr_phone = COALESCE($10, nr_phone),
                email = COALESCE($11, email),
                tp_gender = COALESCE($12, tp_gender),
                dt_admission = COALESCE($13, dt_admission),
                cd_user_update = COALESCE($14, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $15
        `;
        const result = await queryDb(SQL, [
            cdDepartment,
            cdHealthUnit,
            cdPosition,
            nmFull,
            nmSocial,
            dsPhoto,
            nrCpf,
            nrRg,
            dtBirth,
            nrPhone,
            email,
            tpGender,
            dtAdmission,
            cdUserRegistered,
            cdSequence,
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Funcionário não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Funcionário atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o funcionário.' });
    }
});


// Rota para excluir um funcionário
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do funcionário é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE tb_prin_employees
            SET 
                is_active = 0,
                is_deleted = 1,
                cd_user_update = COALESCE($1, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2;
        `;
        await queryDb(SQL, [cdUserRegistered,cdSequence]);

        return res.status(200).json({ message: 'Funcionário excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir o funcionário.' });
    }
});

module.exports = router;
