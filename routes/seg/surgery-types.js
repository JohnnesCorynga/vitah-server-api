const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

// Rota para o endpoint /map
router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT cd_sequence, nm_surgery_type 
            FROM tb_seg_surgery_types
            WHERE is_active = 1
            ORDER BY nm_surgery_type ASC;
        `;
        const results = await queryDb(SQL);
        
        // Criar dois arrays: um para cd_sequence e outro para nm_surgery_type
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_surgery_type);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os tipos de cirurgia. Tente novamente mais tarde." });
    }
});
// Rota para obter todos os tipos de cirurgia
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_surgery_types
            WHERE is_active = 1
            ORDER BY nm_surgery_type ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os tipos de cirurgia. Tente novamente mais tarde." });
    }
});

// Rota para obter um tipo de cirurgia por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do tipo de cirurgia é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_surgery_types
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Tipo de cirurgia não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o tipo de cirurgia. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo tipo de cirurgia
router.post('/create', async (req, res) => {
    try {
        const { nmSurgeryType, dsSurgeryType } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;
        if (!nmSurgeryType) {
            return res.status(422).json({ message: 'O nome do tipo de cirurgia é obrigatório!' });
        }

        // Verifica se o tipo de cirurgia já existe
        const surgeryExists = await queryDb(
            `SELECT * FROM tb_seg_surgery_types WHERE LOWER(nm_surgery_type) = LOWER($1) AND is_active = 1`,
            [nmSurgeryType]
        );

        if (surgeryExists.length > 0) {
            return res.status(422).json({ message: 'Este tipo de cirurgia já está cadastrado!' });
        }

        // Inserir o novo tipo de cirurgia
        const SQL = `
            INSERT INTO tb_seg_surgery_types (nm_surgery_type, ds_surgery_type, cd_user_registered)
            VALUES ($1, $2, $3)
        `;
        await queryDb(SQL, [nmSurgeryType, dsSurgeryType ,cdUserRegistered]);

        return res.status(201).json({ message: 'Tipo de cirurgia criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ocorreu um erro no servidor, tente novamente mais tarde.' });
    }
});

// Rota para atualizar um tipo de cirurgia
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, nmSurgeryType, dsSurgeryType } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;
        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de cirurgia é obrigatório!' });
        }
        if (!nmSurgeryType) {
            return res.status(422).json({ message: 'O nome do tipo de cirurgia é obrigatório!' });
        }

        // Verifica se o tipo de cirurgia já existe (exceto a própria)
        const surgeryExists = await queryDb(
            `SELECT * FROM tb_seg_surgery_types WHERE LOWER(nm_surgery_type) = LOWER($1) AND cd_sequence != $2 AND is_active = 1`,
            [nmSurgeryType, cdSequence]
        );

        if (surgeryExists.length > 0) {
            return res.status(422).json({ message: 'Este nome de tipo de cirurgia já está sendo utilizado!' });
        }

        // Atualizar o tipo de cirurgia
        const SQL = `
            UPDATE tb_seg_surgery_types
            SET 
                nm_surgery_type = COALESCE($1, nm_surgery_type),
                ds_surgery_type = COALESCE($2, ds_surgery_type),
                cd_user_update = COALESCE($3, cd_user_update),
                dt_updated = CURRENT_TIMESTAMP
            WHERE cd_sequence = $4
        `;
        const result = await queryDb(SQL, [nmSurgeryType, dsSurgeryType,cdUserRegistered, cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Tipo de cirurgia não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Tipo de cirurgia atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ocorreu um erro no servidor, tente novamente mais tarde.' });
    }
});

// Rota para excluir (desativar) um tipo de cirurgia
router.post('/delete', async (req, res) => {

    try {
        const { cdSequence } = req.body;

        const cdUserRegistered = req.user?.cdSequence || null;
         console.log(cdUserRegistered);
        
        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de cirurgia é obrigatório!' });
        }

        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_surgery_types WHERE cd_sequence = $1 AND is_active = 1`,
            [cdSequence]
        );

        if (typeExists.length === 0) {
            return res.status(404).json({ message: 'Tipo de cirurgia não encontrado!' });
        }

        const SQL = `
            UPDATE tb_seg_surgery_types
            SET 
                is_active = 0,
                cd_user_update = COALESCE($2, cd_user_update),
                dt_updated = CURRENT_TIMESTAMP
            WHERE cd_sequence = $1
        `;
        await queryDb(SQL, [cdSequence,cdUserRegistered]);

        return res.status(200).json({ message: "Tipo de cirurgia excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir o tipo de cirurgia. Tente novamente mais tarde." });
    }

});

module.exports = router;
