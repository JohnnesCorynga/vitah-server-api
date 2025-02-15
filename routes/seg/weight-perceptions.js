const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

// Rota para mapear percepções de peso (retorna os cd_sequence e tp_weight_perception)
router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_weight_perceptions
            WHERE is_active = 1
            ORDER BY tp_weight_perception ASC;
        `;
        const results = await queryDb(SQL);

        // Criar dois arrays: um para cd_sequence e outro para tp_weight_perception
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.tp_weight_perception);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter as percepções de peso. Tente novamente mais tarde." });
    }
});

// Rota para obter todas as percepções de peso
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_weight_perceptions
            WHERE is_active = 1
            ORDER BY tp_weight_perception ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter as percepções de peso. Tente novamente mais tarde." });
    }
});

// Rota para obter uma percepção de peso por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código da percepção de peso é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_weight_perceptions
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Percepção de peso não encontrada!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar a percepção de peso. Tente novamente mais tarde." });
    }
});

// Rota para criar uma nova percepção de peso
router.post('/create', async (req, res) => {
    try {
        const { tpWeightPerception, dsWeightPerception, } = req.body;

        if (!tpWeightPerception || !dsWeightPerception) {
            return res.status(422).json({ message: 'A descrição e tipo da percepção de peso são obrigatórios!' });
        }

        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_weight_perceptions WHERE LOWER(tp_weight_perception) = LOWER($1) AND is_active = 1`,
            [tpWeightPerception]
        );

        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este tipo de percepção de peso já está cadastrado!' });
        }

        const SQL = `
            INSERT INTO tb_seg_weight_perceptions (tp_weight_perception, ds_weight_perception, is_active)
            VALUES ($1, $2, $3)
        `;
        await queryDb(SQL, [tpWeightPerception, dsWeightPerception, 1]);
        return res.status(201).json({ message: 'Percepção de peso criada com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar a percepção de peso. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar uma percepção de peso
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, tpWeightPerception, dsWeightPerception, isActive } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código da percepção de peso é obrigatório!' });
        }

        if (!tpWeightPerception || !dsWeightPerception) {
            return res.status(422).json({ message: 'A descrição e tipo da percepção de peso são obrigatórios!' });
        }

        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_weight_perceptions WHERE LOWER(tp_weight_perception) = LOWER($1) AND cd_sequence != $2 AND is_active = 1`,
            [tpWeightPerception, cdSequence]
        );

        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este tipo de percepção de peso já está sendo utilizado!' });
        }

        const SQL = `
            UPDATE tb_seg_weight_perceptions
            SET 
                tp_weight_perception = COALESCE($1, tp_weight_perception),
                ds_weight_perception = COALESCE($2, ds_weight_perception),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $3
        `;
        const result = await queryDb(SQL, [tpWeightPerception, dsWeightPerception,cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Percepção de peso não encontrada ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Percepção de peso atualizada com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar a percepção de peso. Tente novamente mais tarde.' });
    }
});

// Rota para excluir uma percepção de peso
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código da percepção de peso é obrigatório!' });
        }
        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_weight_perceptions WHERE cd_sequence = $1 AND is_active = 1`,
            [cdSequence]
        );

        if (typeExists.length == 0) {
            return res.status(422).json({ message: 'Percepção de peso não encontrada!' });
        }
        const SQL = `
            UPDATE tb_seg_weight_perceptions
            SET is_active = 0
            WHERE cd_sequence = $1;
        `;
        await queryDb(SQL, [cdSequence]);
        return res.status(200).json({ message: "Percepção de peso excluída com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir a percepção de peso. Tente novamente mais tarde." });
    }
});

module.exports = router;
