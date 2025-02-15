const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

// Rota para obter todos os tipos de consulta
router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_consultation_types
            WHERE is_active = 1
            ORDER BY nm_type ASC;
        `;
        const results = await queryDb(SQL);
        
        // Criar dois arrays: um para cd_sequence e outro para nm_type (nomes dos tipos de consulta)
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_type);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter os tipos de consulta. Tente novamente mais tarde." });
    }
});

// Rota para listar todos os tipos de consultas
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_consultation_types
            WHERE is_active = 1
            ORDER BY nm_type ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os tipos de consulta. Tente novamente mais tarde." });
    }
});

// Rota para buscar um tipo de consulta por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do tipo de consulta é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_consultation_types
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Tipo de consulta não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o tipo de consulta. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo tipo de consulta
router.post('/create', async (req, res) => {
    try {
        const { nmType, dsDescription } = req.body;

        if (!nmType) {
            return res.status(422).json({ message: 'O nome do tipo de consulta é obrigatório!' });
        }

        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_consultation_types WHERE LOWER(nm_type) = LOWER($1) AND is_active = 1`,
            [nmType]
        );

        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este tipo de consulta já está cadastrado!' });
        }

        const SQL = `
            INSERT INTO tb_seg_consultation_types (nm_type, ds_description, is_active)
            VALUES ($1, $2, $3);
        `;
        await queryDb(SQL, [nmType, dsDescription || null,1]);
        return res.status(201).json({ message: 'Tipo de consulta criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao criar o tipo de consulta. Tente novamente mais tarde." });
    }
});

// Rota para atualizar um tipo de consulta
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, nmType, dsDescription, isActive } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de consulta é obrigatório!' });
        }

        if (!nmType) {
            return res.status(422).json({ message: 'O nome do tipo de consulta é obrigatório!' });
        }

        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_consultation_types WHERE LOWER(nm_type) = LOWER($1) AND cd_sequence != $2 AND is_active = 1`,
            [nmType, cdSequence]
        );

        if (typeExists.length > 0) {
            return res.status(422).json({ message: 'Este nome de tipo de consulta já está sendo utilizado!' });
        }

        const SQL = `
            UPDATE tb_seg_consultation_types
            SET 
                nm_type = COALESCE($1, nm_type),
                ds_description = COALESCE($2, ds_description),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $3;
        `;
        const result = await queryDb(SQL, [nmType, dsDescription || null,cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Tipo de consulta não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Tipo de consulta atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao atualizar o tipo de consulta. Tente novamente mais tarde." });
    }
});

// Rota para excluir um tipo de consulta
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de consulta é obrigatório!' });
        }
        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_consultation_types WHERE cd_sequence = $1 AND is_active = 1`,
            [cdSequence]
        );

        if (typeExists.length == 0) {
            return res.status(422).json({ message: 'O código do tipo de consulta nao encontrado!' });
        }

        const SQL = `
            UPDATE tb_seg_consultation_types
            SET 
                is_active = 0,
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $1;
        `;
        await queryDb(SQL, [cdSequence]);

        return res.status(200).json({ message: 'Tipo de consulta excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir o tipo de consulta. Tente novamente mais tarde." });
    }
});

module.exports = router;
