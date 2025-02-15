const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

// Rota para obter todas as especialidades
router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_specialty
            WHERE is_active = 1
            ORDER BY nm_specialty ASC;
        `;
        const results = await queryDb(SQL);
        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_specialty);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter as especialidades. Tente novamente mais tarde." });
    }
});
// Rota para obter todas as especialidades
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT 
                * 
            FROM 
                tb_seg_specialty
            WHERE is_active = 1
            ORDER BY 
                nm_specialty ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter as especialidades. Tente novamente mais tarde." });
    }
});

// Rota para obter uma especialidade por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código da especialidade é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT 
                * 
            FROM 
                tb_seg_specialty
            WHERE 
                cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Especialidade não encontrada!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar a especialidade. Tente novamente mais tarde." });
    }
});

// Rota para criar uma nova especialidade
router.post('/create', async (req, res) => {
    try {
        const { nmSpecialty, dsSpecialty, valueQueries, } = req.body;

        // Verificar se os campos obrigatórios foram fornecidos
        if (!nmSpecialty) {
            return res.status(422).json({ message: 'O nome da especialidade é obrigatório!' });
        }

        // Verifica se a especialidade já existe
        const specialtyExists = await queryDb(
            `SELECT * FROM tb_seg_specialty WHERE LOWER(nm_specialty) = LOWER($1) AND is_active = 1`,
            [nmSpecialty]
        );

        if (specialtyExists.length > 0) {
            return res.status(422).json({ message: 'Esta especialidade já está cadastrada!' });
        }

        // Inserir a nova especialidade
        const SQL = `
            INSERT INTO tb_seg_specialty (nm_specialty, ds_specialty, value_queries, is_active)
            VALUES ($1, $2, $3, $4)
        `;
        await queryDb(SQL, [nmSpecialty, dsSpecialty || null, valueQueries || null,1]);

        return res.status(201).json({ message: 'Especialidade criada com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ocorreu um erro no servidor, tente novamente mais tarde.' });
    }
});

// Rota para atualizar uma especialidade
router.post('/update', async (req, res) => {
    
    try {
        const { cdSequence, nmSpecialty, dsSpecialty, valueQueries, isActive } = req.body;

        // Verificar se o código da especialidade foi fornecido
        if (!cdSequence) {
            return res.status(422).json({ message: 'O código da especialidade é obrigatório!' });
        }

        // Verificar se o nome da especialidade foi fornecido
        if (!nmSpecialty) {
            return res.status(422).json({ message: 'O nome da especialidade é obrigatório!' });
        }

        // Verifica se a especialidade já existe (exceto a própria)
        const specialtyExists = await queryDb(
            `SELECT * FROM tb_seg_specialty WHERE LOWER(nm_specialty) = LOWER($1) AND cd_sequence != $2 AND is_active = 1`,
            [nmSpecialty, cdSequence]
        );

        if (specialtyExists.length > 0) {
            return res.status(422).json({ message: 'Este nome de especialidade já está sendo utilizado!' });
        }

        // Atualizar a especialidade
        const SQL = `
            UPDATE tb_seg_specialty
            SET 
                nm_specialty = COALESCE($1, nm_specialty),
                ds_specialty = COALESCE($2, ds_specialty),
                value_queries = COALESCE($3, value_queries),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $4
        `;
        const result = await queryDb(SQL, [nmSpecialty, dsSpecialty || null, valueQueries || null,cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Especialidade não encontrada ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Especialidade atualizada com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ocorreu um erro no servidor, tente novamente mais tarde.' });
    }
});

// Rota para excluir uma especialidade
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código da especialidade é obrigatório!' });
        }
        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_specialty WHERE cd_sequence = $1 AND is_active = 1`,
            [cdSequence]
        );

        if (typeExists.length == 0) {
            return res.status(422).json({ message: 'O código da especialidade nao encontrado!' });
        }
        const SQL = `
            UPDATE 
                tb_seg_specialty
            SET
                is_active = 0,
                dt_update = CURRENT_TIMESTAMP
            WHERE 
                CD_SEQUENCE = $1;
        `;
        await queryDb(SQL, [cdSequence]);
        return res.status(200).json({ message: "Especialidade excluída com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir a especialidade. Tente novamente mais tarde." });
    }
});

module.exports = router;
