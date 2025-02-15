const express = require('express');
const { queryDb } = require('../../models/db'); // Ajuste conforme necessário para sua conexão PostgreSQL
const router = express.Router();


router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_departments
            WHERE is_active = 1 
            ORDER BY nm_department ASC;
        `;
        const results = await queryDb(SQL);

        // Criar arrays separados para os campos solicitados
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_department);
        // const typesArray = results.map(item => item.tp_module);

        // Retornar todos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray,
            // typesArray
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os tipos de módulos. Tente novamente mais tarde." });
    }
});

// Rota para obter nomes e tipos de permissões
router.post('/all', async (req, res) => {
    try {
        const SQL = "SELECT * FROM tb_prin_departments WHERE is_active = 1";
        const results = await queryDb(SQL);
        // console.log("RESULTS", results)
        return res.status(200).json(results);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});


// Rota para buscar um departamento específico
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do departamento é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_departments
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Departamento não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao buscar o departamento.' });
    }
});

// Rota para criar um novo departamento
router.post('/create', async (req, res) => {
    try {
        const { nmDepartment, dsDepartment, dsLocation } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;
        
        if (!nmDepartment) {
            return res.status(422).json({ message: 'O nome do departamento é obrigatório!' });
        }

        const deptExists = await queryDb(
            `SELECT * FROM tb_prin_departments WHERE LOWER(nm_department) = LOWER($1) AND is_active = 1`,
            [nmDepartment]
        );

        if (deptExists.length > 0) {
            return res.status(422).json({ message: 'Este departamento já está cadastrado!' });
        }

        const SQL = `
            INSERT INTO
                tb_prin_departments (nm_department, ds_department, ds_location,cd_user_registered)
                
            VALUES ($1, $2, $3,$4)
        `;
        await queryDb(SQL, [nmDepartment, dsDepartment, dsLocation,cdUserRegistered]);

        return res.status(201).json({ message: 'Departamento criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o departamento.' });
    }
});

// Rota para atualizar um departamento
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, nmDepartment, dsDepartment, dsLocation, } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;
        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do departamento é obrigatório!' });
        }

        if (!nmDepartment) {
            return res.status(422).json({ message: 'O nome do departamento é obrigatório!' });
        }
        
        const deptExists = await queryDb(
            `SELECT * FROM tb_prin_departments WHERE LOWER(nm_department) = LOWER($1) AND is_active = 1`,
            [nmDepartment]
        );

        if (deptExists.length > 0) {
            return res.status(422).json({ message: 'Este departamento já está cadastrado!' });
        }
        
        const SQL = `
            UPDATE tb_prin_departments
            SET 
                nm_department = COALESCE($1, nm_department),
                ds_department = COALESCE($2, ds_department),
                ds_location = COALESCE($3, ds_location),
                cd_user_update = COALESCE($4, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $5
        `;
        const result = await queryDb(SQL, [nmDepartment, dsDepartment, dsLocation,cdUserRegistered, cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Departamento não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Departamento atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o departamento.' });
    }
});

// Rota para excluir um departamento
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do departamento é obrigatório!' });
        }


        const SQL = `
            UPDATE tb_prin_departments
            SET
                is_active = 0,
                is_deleted = 1,
                cd_user_update = COALESCE($1, cd_user_update),
            WHERE cd_sequence = $2;
        `;

        await queryDb(SQL, [cdUserRegistered,cdSequence]);

        return res.status(200).json({ message: 'Departamento excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir o departamento.' });
    }
});

module.exports = router;

