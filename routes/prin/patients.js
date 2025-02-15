const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT 
                cd_sequence,
                nm_full
            FROM 
                tb_prin_patients
           ORDER BY 
                nm_full ASC;
        `;
        const results = await queryDb(SQL);

        const cdPatientArray = results.map(item => item.cd_sequence);
        const nmPatientArray = results.map(item => item.nm_full);

        return res.status(200).json({
            cdPatientArray,
            nmPatientArray,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os dados dos pacientes. Tente novamente mais tarde." });
    }
});

// Rota para obter todos os pacientes
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT *
            FROM 
                tb_prin_patients
            ORDER BY 
                nm_full ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter pacientes. Tente novamente mais tarde." });
    }
});
// Rota para buscar pacientes por cdHealthUnit
router.post('/by-health-unit', async (req, res) => {
    try {
        const { cdHealthUnit } = req.body;
        if (!cdHealthUnit) {
            return res.status(422).json({ message: 'O código da unidade de saúde é obrigatório!' });
        }

        const SQL = `
            SELECT * 
            FROM tb_prin_patients
            WHERE cd_health_unit = $1
            ORDER BY nm_full ASC;
        `;

        const results = await queryDb(SQL, [cdHealthUnit]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Nenhum paciente encontrado para esta unidade de saúde.' });
        }

        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar pacientes. Tente novamente mais tarde." });
    }
});

// Rota para obter um paciente por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do paciente é obrigatório!' });
    }
    try {
        const SQL = `SELECT * FROM tb_prin_patients WHERE cd_sequence = $1;`;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Paciente não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o paciente. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo paciente
router.post('/create', async (req, res) => {
    try {
        const {
            nmFull, nmSocial, nrCpf, dtBirth, nrRg, nrCnh, nmOrgan,
            password, nrPhone, email, nmMother, nmFather, dsProfession, dsNationality, dsMaritalStatus,
            sgUfOfBirth, dsUfOfBirth, dsCityOfBirth, cdRace, cdEthnicity, cdEducationLevel, cdFamily,
            nrCns, tpGender // Incluindo nrCns e tpGender aqui
        } = req.body;

        const cdUserRegistered = req.user?.cdSequence || null;

        if (!cdUserRegistered) {
            return res.status(401).json({ message: 'Usuário não autorizado' });
        }

        // Verificando se os campos obrigatórios estão presentes
        if (!nmFull) {
            return res.status(422).json({ message: 'Campo "nmFull" é obrigatório!' });
        }

        if (!nrCpf) {
            return res.status(422).json({ message: 'Campo "nrCpf" é obrigatório!' });
        }

        if (!dtBirth) {
            return res.status(422).json({ message: 'Campo "dtBirth" é obrigatório!' });
        }

        // Definindo o cdHealthUnit de acordo com a permissão
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        let finalCdHealthUnit = null;

        if (cd_permission === 1) {
            // Permissão 1 pode usar o cdHealthUnit fornecido
            finalCdHealthUnit = req.body.cdHealthUnit;
        } else if (cd_permission === 2) {
            // Permissão 2 usa o cdHealthUnit do próprio usuário
            finalCdHealthUnit = cd_health_unit;
        }

        if (!finalCdHealthUnit) {
            return res.status(422).json({ message: 'Campo "cdHealthUnit" é obrigatório!' });
        }

        const SQL = `
            INSERT INTO tb_prin_patients (
                cd_user_registered, cd_health_unit, cd_race, cd_ethnicity, cd_education_level, 
                cd_family, nr_cns, tp_gender, nm_full, nm_social, nr_cpf, dt_birth, nr_rg, nr_cnh,
                nm_organ, password, nr_phone, email, nm_mother, nm_father, ds_profession, ds_nationality,
                ds_marital_status, sg_uf_of_birth, ds_uf_of_birth, ds_city_of_birth
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25 , $26);
        `;

        // Inserindo dados no banco de dados
        await queryDb(SQL, [
            cdUserRegistered, finalCdHealthUnit, cdRace, cdEthnicity, cdEducationLevel, cdFamily,
            nrCns, tpGender, nmFull, nmSocial, nrCpf, dtBirth, nrRg, nrCnh,
            nmOrgan, password, nrPhone, email, nmMother, nmFather, dsProfession, dsNationality,
            dsMaritalStatus, sgUfOfBirth, dsUfOfBirth, dsCityOfBirth
        ]);

        return res.status(201).json({ message: 'Paciente criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o paciente. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar os dados de um paciente
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, nmFull, nmSocial, nrCpf, dtBirth, nrRg, nrCnh, nmOrgan,
            nrPhone, email, nmMother, nmFather, dsProfession, dsNationality, dsMaritalStatus,
            sgUfOfBirth, dsUfOfBirth, dsCityOfBirth, cdRace, cdEthnicity, cdEducationLevel, cdFamily } = req.body;

        const cdUserUpdate = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do paciente é obrigatório!' });
        }

        const SQL = `
            UPDATE 
                tb_prin_patients
            SET 
                nm_full = COALESCE($1, nm_full),
                nm_social = COALESCE($2, nm_social),
                nr_cpf = COALESCE($3, nr_cpf),
                dt_birth = COALESCE($4, dt_birth),
                nr_rg = COALESCE($5, nr_rg),
                nr_cnh = COALESCE($6, nr_cnh),
                nm_organ = COALESCE($7, nm_organ),
                nr_phone = COALESCE($8, nr_phone),
                email = COALESCE($9, email),
                nm_mother = COALESCE($10, nm_mother),
                nm_father = COALESCE($11, nm_father),
                ds_profession = COALESCE($12, ds_profession),
                ds_nationality = COALESCE($13, ds_nationality),
                ds_marital_status = COALESCE($14, ds_marital_status),
                sg_uf_of_birth = COALESCE($15, sg_uf_of_birth),
                ds_uf_of_birth = COALESCE($16, ds_uf_of_birth),
                ds_city_of_birth = COALESCE($17, ds_city_of_birth),
                cd_race = COALESCE($18, cd_race),
                cd_ethnicity = COALESCE($19, cd_ethnicity),
                cd_education_level = COALESCE($20, cd_education_level),
                cd_family = COALESCE($21, cd_family),
                cd_user_update = COALESCE($22, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $23
        `;

        const result = await queryDb(SQL, [
            nmFull, nmSocial, nrCpf, dtBirth, nrRg, nrCnh, nmOrgan, nrPhone, email, nmMother, nmFather,
            dsProfession, dsNationality, dsMaritalStatus, sgUfOfBirth, dsUfOfBirth, dsCityOfBirth,
            cdRace, cdEthnicity, cdEducationLevel, cdFamily, cdUserUpdate, cdSequence
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Paciente não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Paciente atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o paciente. Tente novamente mais tarde.' });
    }
});

// Rota para excluir (desativar) um paciente
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;

    const cdUserRegistered = req.user?.cdSequence || null;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do paciente é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE 
                tb_prin_patients
            SET 
                is_active = 0,
                cd_user_update = COALESCE($1, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2;
        `;
        await queryDb(SQL, [cdUserRegistered, cdSequence]);

        return res.status(200).json({ message: 'Paciente excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir paciente.' });
    }
});

module.exports = router;
