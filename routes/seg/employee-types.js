const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_employee_types
            WHERE is_active = 1
            ORDER BY tp_employee ASC;
        `;
        const results = await queryDb(SQL);

        // Criar dois arrays: um para cd_sequence e outro para tp_employee
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.tp_employee);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter os tipos de servidores. Tente novamente mais tarde." });
    }
});

// Rota para obter todos os tipos de funcionários
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_employee_types
            WHERE is_active = 1
            ORDER BY tp_employee ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter os tipos de funcionários. Tente novamente mais tarde." });
    }
});

// Rota para obter um tipo de funcionário por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do tipo de funcionário é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_employee_types
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Tipo de funcionário não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o tipo de funcionário. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo tipo de funcionário
router.post('/create', async (req, res) => {
    try {
        const { tpEmployee,  } = req.body;

        if (!tpEmployee) {
            return res.status(422).json({ message: 'O nome do tipo de funcionário é obrigatório!' });
        }

        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_employee_types WHERE LOWER(tp_employee) = LOWER($1) AND is_active = 1`,
            [tpEmployee]
        );

        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este tipo de funcionário já está cadastrado!' });
        }

        const SQL = `
            INSERT INTO tb_seg_employee_types (tp_employee, is_active)
            VALUES ($1, $2)
        `;
        await queryDb(SQL, [tpEmployee, 1]);
        return res.status(201).json({ message: 'Tipo de funcionário criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o tipo de funcionário. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar um tipo de funcionário
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, tpEmployee } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de funcionário é obrigatório!' });
        }

        if (!tpEmployee) {
            return res.status(422).json({ message: 'O nome do tipo de funcionário é obrigatório!' });
        }

        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_employee_types WHERE LOWER(tp_employee) = LOWER($1) AND cd_sequence != $2 AND is_active = 1`,
            [tpEmployee, cdSequence]
        );

        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este tipo de funcionário já está sendo utilizado!' });
        }

        const SQL = `
            UPDATE tb_seg_employee_types
            SET 
                tp_employee = COALESCE($1, tp_employee),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2
        `;
        const result = await queryDb(SQL, [tpEmployee,cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Tipo de funcionário não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Tipo de funcionário atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o tipo de funcionário. Tente novamente mais tarde.' });
    }
});

// Rota para excluir um tipo de funcionário
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de funcionário é obrigatório!' });
        }
        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_employee_types WHERE cd_sequence = $1 AND is_active = 1`,
            [cdSequence]
        );

        if (typeExists.length == 0) {
            return res.status(422).json({ message: 'Este tipo de funcionário não encontrado!' });
        }
        const SQL = `
            UPDATE tb_seg_employee_types
            SET is_active = 0
            WHERE cd_sequence = $1;
        `;
        await queryDb(SQL, [cdSequence]);
        return res.status(200).json({ message: "Tipo de funcionário excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir o tipo de funcionário. Tente novamente mais tarde." });
    }
});

module.exports = router;
