const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

// Rota para mapear tipos de manutenção (retorna os cd_sequence e tp_maintenance)
router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_maintenance_types
            WHERE is_active = 1
            ORDER BY tp_maintenance ASC;
        `;
        const results = await queryDb(SQL);

        // Criar dois arrays: um para cd_sequence e outro para tp_maintenance
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.tp_maintenance);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter os tipos de manutenção. Tente novamente mais tarde." });
    }
});

// Rota para obter todos os tipos de manutenção
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_maintenance_types
            WHERE is_active = 1
            ORDER BY tp_maintenance ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter os tipos de manutenção. Tente novamente mais tarde." });
    }
});

// Rota para obter um tipo de manutenção por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do tipo de manutenção é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_maintenance_types
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Tipo de manutenção não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o tipo de manutenção. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo tipo de manutenção
router.post('/create', async (req, res) => {
    try {
        const { tpMaintenance } = req.body;

        if (!tpMaintenance) {
            return res.status(422).json({ message: 'A descrição do tipo de manutenção é obrigatória!' });
        }

        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_maintenance_types WHERE LOWER(tp_maintenance) = LOWER($1) AND is_active = 1`,
            [tpMaintenance]
        );

        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este tipo de manutenção já está cadastrado!' });
        }

        const SQL = `
            INSERT INTO tb_seg_maintenance_types (tp_maintenance, is_active)
            VALUES ($1, $2)
        `;
        await queryDb(SQL, [tpMaintenance,1]);
        return res.status(201).json({ message: 'Tipo de manutenção criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o tipo de manutenção. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar um tipo de manutenção
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, tpMaintenance, isActive } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de manutenção é obrigatório!' });
        }

        if (!tpMaintenance) {
            return res.status(422).json({ message: 'A descrição do tipo de manutenção é obrigatória!' });
        }

        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_maintenance_types WHERE LOWER(tp_maintenance) = LOWER($1) AND cd_sequence != $2 AND is_active = 1`,
            [tpMaintenance, cdSequence]
        );

        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este nome de tipo de manutenção já está sendo utilizado!' });
        }

        const SQL = `
            UPDATE tb_seg_maintenance_types
            SET 
                tp_maintenance = COALESCE($1, tp_maintenance),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2
        `;
        const result = await queryDb(SQL, [tpMaintenance,cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Tipo de manutenção não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Tipo de manutenção atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o tipo de manutenção. Tente novamente mais tarde.' });
    }
});

// Rota para excluir um tipo de manutenção
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de manutenção é obrigatório!' });
        }
        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_maintenance_types WHERE cd_sequence = $1 AND is_active = 1`,
            [cdSequence]
        );

        if (typeExists.length == 0) {
            return res.status(422).json({ message: 'Este tipo de manutenção não encontrado!' });
        }
        const SQL = `
            UPDATE tb_seg_maintenance_types
            SET is_active = 0
            WHERE cd_sequence = $1;
        `;
        await queryDb(SQL, [cdSequence]);
        return res.status(200).json({ message: "Tipo de manutenção excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir o tipo de manutenção. Tente novamente mais tarde." });
    }
});

module.exports = router;
