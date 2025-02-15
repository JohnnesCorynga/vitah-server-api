const express = require('express');
const { queryDb } = require('../../models/db');
const { getUserCodes } = require('../../functions/functionsAll');
const router = express.Router();

router.post('/map', async (req, res) => {
    const cdUserRegistered = req.user?.cdSequence || null;

    try {
        const { cd_permission, cd_module, cd_health_unit } = await getUserCodes(cdUserRegistered);

        if (!cdUserRegistered) {
            return res.status(403).json({ message: 'Você não possui permissão para acessar os médicos!' });
        }
        let SQL;

        if (cd_permission === 1) { // Acesso total
            const { cdHealthUnit } = req.body;
            if (!cdHealthUnit) {
                return res.status(400).json({ message: 'A unidade de saúde é obrigatório!' });
            }
            SQL = `
                SELECT 
                    d.cd_sequence, 
                    e.nm_full,
                    d.cd_specialty, 
                    s.nm_specialty, 
                    d.nr_crm
                FROM 
                    tb_prin_doctors d
                JOIN 
                    tb_prin_employees e ON e.cd_sequence = d.cd_employee
                JOIN 
                    tb_seg_specialty s ON s.cd_sequence = d.cd_specialty
                JOIN 
                    tb_prin_users u ON u.cd_sequence = d.cd_user_registered
                WHERE 
                    d.is_active = 1
                    AND e.cd_health_unit = ${cdHealthUnit}
                ORDER BY 
                    e.nm_full ASC;
            `;
        } else if (cd_permission === 2) { // Restrito por unidade de saúde
            SQL = `
                SELECT 
                    d.cd_sequence, 
                    e.nm_full,
                    d.cd_specialty, 
                    s.nm_specialty, 
                    d.nr_crm
                FROM 
                    tb_prin_doctors d
                JOIN 
                    tb_prin_employees e ON e.cd_sequence = d.cd_employee
                JOIN 
                    tb_seg_specialty s ON s.cd_sequence = d.cd_specialty
                JOIN 
                    tb_prin_users u ON u.cd_sequence = d.cd_user_registered
                WHERE 
                    d.is_active = 1
                    AND e.cd_health_unit = ${cd_health_unit}
                ORDER BY 
                    e.nm_full ASC;
            `;
        } else if (cd_permission === 3) { // Restrito por unidade e módulo
            SQL = `
                SELECT 
                    d.cd_sequence, 
                    e.nm_full,
                    d.cd_specialty, 
                    s.nm_specialty, 
                    d.nr_crm
                FROM 
                    tb_prin_doctors d
                JOIN 
                    tb_prin_employees e ON e.cd_sequence = d.cd_employee
                JOIN 
                    tb_seg_specialty s ON s.cd_sequence = d.cd_specialty
                JOIN 
                    tb_prin_users u ON u.cd_sequence = d.cd_user_registered
                WHERE 
                    d.is_active = 1
                    AND e.cd_health_unit = ${cd_health_unit}
                    AND e.cd_module = ${cd_module}
                ORDER BY 
                    e.nm_full ASC;
            `;
        } else {
            return res.status(403).json({ message: 'Você não possui permissão para acessar os médicos!' });
        }

        const results = await queryDb(SQL);

        // Organizar os dados de resposta
        const doctorMap = results.map(item => ({
            cdSequenceArray: item.cd_sequence,
            labelsNamesArray: item.nm_full,
            cdSequenceSpecialtyArray: item.cd_specialty,
            labelsNamesSpecialtyArray: item.nm_specialty,
            crm: item.nr_crm
        }));

        return res.status(200).json({
            doctorMap
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter a lista de médicos. Tente novamente mais tarde." });
    }
});

// Rota para listar todos os médicos
router.post('/all', async (req, res) => {
    const cdUserRegistered = req.user?.cdSequence || null;
    try {
        const { cd_permission, cd_module, cd_health_unit } = await getUserCodes(cdUserRegistered);
        
        // Verifica se o usuário tem permissão para acessar
        if (!cdUserRegistered) {
            return res.status(403).json({ message: 'Você não possui permissão para acessar os médicos!' });
        }

        const { cdHealthUnit } = req.body;

        // Verifica se a unidade de saúde é necessária
        if (cd_permission === 1 && !cdHealthUnit) {
            return res.status(400).json({ message: 'A unidade de saúde é obrigatória!' });
        }

        // Base da consulta SQL
        let SQL = `
            SELECT 
                d.*, 
                e.*,
                s.nm_specialty, 

                u_register.nm_user AS nm_user_registered,
                u_update.nm_user       AS nm_user_update

            FROM 
                tb_prin_doctors d
            LEFT JOIN 
                tb_prin_employees e ON e.cd_sequence = d.cd_employee
            LEFT JOIN 
                tb_seg_specialty s ON s.cd_sequence = d.cd_specialty
            LEFT JOIN 
                tb_prin_users u_register ON u_register.cd_sequence = d.cd_user_registered
            LEFT JOIN 
                tb_prin_users u_update ON u_update.cd_sequence = d.cd_user_update
            
            WHERE 
                d.is_active = 1
        `;
        
        // Adiciona filtros com base na permissão do usuário
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
            return res.status(403).json({ message: 'Você não possui permissão para acessar os médicos!' });
        }

        // Finaliza a consulta com ordenação
        SQL += ` ORDER BY e.nm_full ASC`;

        const results = await queryDb(SQL);
        return res.status(200).json(results);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao listar médicos. Tente novamente mais tarde.' });
    }
});

// Rota para buscar médico por ID (cd_sequence)
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do médico é obrigatório!' });
    }

    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_doctors
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Médico não encontrado!' });
        }

        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao buscar médico. Tente novamente mais tarde.' });
    }
});
// Rota para criar um novo médico
router.post('/create', async (req, res) => {

    const {
        cdEmployee,
        cdSpecialty,
        nrCrm,
        passDoctor,
        daysAvailability,
      
    } = req.body;

    const cdUserRegistered = req.user?.cdSequence || null;

    if (!cdEmployee) {
        return res.status(422).json({ message: 'O campo cdEmployee (identificador do funcionário) é obrigatório!' });
    }

    if (!cdSpecialty) {
        return res.status(422).json({ message: 'O campo cdSpecialty (especialidade do médico) é obrigatório!' });
    }

    if (!cdUserRegistered) {
        return res.status(422).json({ message: 'O campo cdUserRegistered (usuário responsável pelo registro) é obrigatório!' });
    }

    if (!nrCrm) {
        return res.status(422).json({ message: 'O campo nrCrm (CRM do médico) é obrigatório!' });
    }

    if (!passDoctor) {
        return res.status(422).json({ message: 'O campo passDoctor (senha do médico) é obrigatório!' });
    }


    try {
        const SQL = `
            INSERT INTO tb_prin_doctors (
                cd_employee, 
                cd_specialty, 
                cd_user_update = COALESCE($14, cd_user_update),
                nr_crm, 
                pass_doctor, 
                days_availability
                
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await queryDb(SQL, [
            cdEmployee,
            cdSpecialty,
            cdUserRegistered,
            nrCrm,
            passDoctor,
            daysAvailability,
            
        ]);

        return res.status(201).json({ message: 'Médico criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar médico. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar informações de um médico
router.post('/update', async (req, res) => {
    const {
        cdSequence,
        cdEmployee,
        cdSpecialty,
        nrCrm,
        passDoctor,
        daysAvailability,
        isActive,
    } = req.body;

    const cdUserRegistered = req.user?.cdSequence || null;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do médico é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE tb_prin_doctors
            SET 
                cd_employee = COALESCE($1, cd_employee),
                cd_specialty = COALESCE($2, cd_specialty),
                nr_crm = COALESCE($3, nr_crm),
                pass_doctor = COALESCE($4, pass_doctor),
                days_availability = COALESCE($5, days_availability),
                is_active = COALESCE($6, is_active),
                cd_user_update = COALESCE($7, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE 
                cd_sequence = $8;
        `;

        const result = await queryDb(SQL, [
            cdEmployee,
            cdSpecialty,
            nrCrm,
            passDoctor,
            daysAvailability,
            isActive,
            cdUserRegistered,
            cdSequence
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Médico não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Médico atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar médico. Tente novamente mais tarde.' });
    }
});

// Rota para desativar (excluir logicamente) um médico
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do médico é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE tb_prin_doctors
            SET 
                is_active = 0,
                is_deleted = 1,
                cd_user_update = $1,
                dt_update = CURRENT_TIMESTAMP
            WHERE 
                cd_sequence = $2;
        `;

        const result = await queryDb(SQL, [cdUserRegistered, cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Médico não encontrado ou já desativado.' });
        }

        return res.status(200).json({ message: 'Médico desativado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao desativar médico. Tente novamente mais tarde.' });
    }
});

module.exports = router;
