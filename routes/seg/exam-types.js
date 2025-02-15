const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

// Rota para mapear tipos de exames
router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_exam_types
            WHERE is_active = 1
            ORDER BY tp_exam ASC;
        `;
        const results = await queryDb(SQL);
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.tp_exam);
        return res.status(200).json({ cdSequenceArray, labelsArray });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao obter os tipos de exames.' });
    }
});

// Rota para obter todos os tipos de exames
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_exam_types
            WHERE is_active = 1
            ORDER BY tp_exam ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao obter os tipos de exames.' });
    }
});

// Rota para obter um tipo de exame por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do tipo de exame é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_exam_types
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Tipo de exame não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao buscar o tipo de exame.' });
    }
});

// Rota para criar um novo tipo de exame
router.post('/create', async (req, res) => {
    try {
        const { tpExam, dsExam} = req.body;
        
        if (!tpExam ) {
            return res.status(422).json({ message: 'Todos os campos são obrigatórios!' });
        }
        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_exam_types WHERE LOWER(tp_exam) = LOWER($1) AND is_active = 1`,
            [tpExam]
        );

        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este Tipo de status de ponto já está cadastrado!' });
        }
        const SQL = `
            INSERT INTO tb_seg_exam_types (tp_exam, ds_exam, is_active)
            VALUES ($1, $2, $3)
        `;
        await queryDb(SQL, [tpExam, dsExam,1]);
        return res.status(201).json({ message: 'Tipo de exame criado com sucesso!' });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o tipo de exame.' });
    }

});

// Rota para atualizar um tipo de exame
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, tpExam, dsExam } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de exame é obrigatório!' });
        }

        if (!tpExam || !dsExam) {
            return res.status(422).json({ message: 'Todos os campos são obrigatórios!' });
        }
        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_exam_types WHERE LOWER(tp_exam) = LOWER($1) AND is_active = 1`,
            [tpExam]
        );

        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este Tipo de status de ponto já está cadastrado!' });
        }
        const SQL = `
            UPDATE tb_seg_exam_types
            SET 
                tp_exam = COALESCE($1, tp_exam),
                ds_exam = COALESCE($2, ds_exam),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $3
        `;
        const result = await queryDb(SQL, [tpExam, dsExam, cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Tipo de exame não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Tipo de exame atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o tipo de exame.' });
    }
});

// Rota para excluir um tipo de exame
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de exame é obrigatório!' });
        }

        const SQL = `
            UPDATE tb_seg_exam_types
            SET is_active = 0
            WHERE cd_sequence = $1;
        `;
        await queryDb(SQL, [cdSequence]);

        return res.status(200).json({ message: "Tipo de exame excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir o tipo de exame.' });
    }
});
module.exports = router;
