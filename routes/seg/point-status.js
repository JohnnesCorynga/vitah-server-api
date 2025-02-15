const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

// Rota para mapear tipos de status de ponto
router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_point_status
            WHERE is_active = 1
            ORDER BY tp_status ASC;
        `;
        const results = await queryDb(SQL);
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.tp_status);
        return res.status(200).json({ cdSequenceArray, labelsArray });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao obter os tipos de status de ponto.' });
    }
});

// Rota para obter todos os tipos de status de ponto
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_point_status
            WHERE is_active = 1
            ORDER BY tp_status ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao obter os tipos de status de ponto.' });
    }
});

// Rota para obter um tipo de status de ponto por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do tipo de status de ponto é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_point_status
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Tipo de status de ponto não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o tipo de status de ponto." });
    }
});

// Rota para criar um novo tipo de status de ponto
router.post('/create', async (req, res) => {
    try {
        const { tpStatus, dsStatus } = req.body;
        
        if (!tpStatus) {
            return res.status(422).json({ message: 'O nome do status é obrigatório!' });
        }
        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_point_status WHERE LOWER(tp_status) = LOWER($1) AND is_active = 1`,
            [tpStatus]
        );

        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este Tipo de status de ponto já está cadastrado!' });
        }
        const SQL = `
            INSERT INTO tb_seg_point_status (tp_status, ds_status, is_active)
            VALUES ($1, $2, $3)
        `;
        await queryDb(SQL, [tpStatus, dsStatus,1]);
        return res.status(201).json({ message: 'Tipo de status de ponto criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o tipo de status de ponto.' });
    }
});

// Rota para atualizar um tipo de status de ponto
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, tpStatus, dsStatus, isActive } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de status de ponto é obrigatório!' });
        }

        if (!tpStatus) {
            return res.status(422).json({ message: 'O nome do status é obrigatório!' });
        }
        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_point_status WHERE LOWER(tp_status) = LOWER($1) AND cd_sequence != $2  AND is_active = 1`,
            [tpStatus,cdSequence]
        );
        console.log(typeExists);
        
        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este Tipo de status de ponto já está cadastrado!' });
        }
        const SQL = `
            UPDATE tb_seg_point_status
            SET 
                tp_status = COALESCE($1, tp_status),
                ds_status = COALESCE($2, ds_status),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $3
        `;
        await queryDb(SQL, [tpStatus, dsStatus,cdSequence]);
       

        return res.status(200).json({ message: 'Tipo de status de ponto atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o tipo de status de ponto.' });
    }
});

// Rota para excluir um tipo de status de ponto
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de status de ponto é obrigatório!' });
        }
        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_point_status WHERE cd_sequence = $1 AND is_active = 1`,
            [cdSequence]
        );

        if (typeExists.length == 0) {
            return res.status(422).json({ message: 'O tipo de status de ponto nao encontrado!' });
        }
        const SQL = `
            UPDATE tb_seg_point_status
            SET is_active = 0,
            dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $1;
        `;
        await queryDb(SQL, [cdSequence]);

        return res.status(200).json({ message: "Tipo de status de ponto excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir o tipo de status de ponto.' });
    }
});
module.exports = router;
