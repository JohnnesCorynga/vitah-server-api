const express = require('express');
const { queryDb } = require('../../models/db');
const { getUserCodes } = require('../../functions/functionsAll');
const router = express.Router();


router.post('/map', async (req, res) => {

    const { cdHealthUnit } = req.body;

    const cdUserRegistered = req.user?.cdSequence || null;

    const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

    try {
        let values = []
        if (cd_permission == 1) {

            if (!cdHealthUnit) {
                return res.status(422).json({ message: 'A unidade de saúde é obrigatória!' });
            }

            values = [cdHealthUnit]

        } else if (cd_permission == 2) {

            values = [cd_health_unit]

        } else {
            return res.status(403).json({ message: 'Você não possui permissão para ver as alas!' });
        }

        const SQL = `
            SELECT 
                cd_sequence,
                nm_ward
            FROM 
                tb_prin_wards 
            WHERE 
                cd_health_unit = $1
                AND is_active = 1
            ORDER BY 
              nm_ward ASC;
        `;
        const results = await queryDb(SQL, values);

        const cdWardArray = results.map(item => item.cd_sequence);
        const nmWardArray = results.map(item => item.nm_ward);

        return res.status(200).json({
            cdWardArray,
            nmWardArray,

        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os dados das alas. Tente novamente mais tarde." });
    }
});

// Rota para obter todas as alas
// Rota para obter todas as alas
router.post('/all', async (req, res) => {
    const { cdHealthUnit } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;

    try {
        // Buscar as permissões do usuário
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);
        
        let values = [];
        if (cd_permission === 1) {
            // Para permissão 1, usuário pode ver alas de qualquer unidade de saúde
            if (!cdHealthUnit) {
                return res.status(422).json({ message: 'A unidade de saúde é obrigatória!' });
            }
            values = [cdHealthUnit]; // Passa a unidade de saúde especificada
        } else if (cd_permission === 2) {
            // Para permissão 2, o usuário vê apenas alas da sua própria unidade de saúde
            values = [cd_health_unit]; // Usa a unidade de saúde do usuário
        } else {
            // Caso o usuário não tenha permissão
            return res.status(403).json({ message: 'Você não possui permissão para ver as alas!' });
        }

        // Consulta SQL para buscar as alas
        const SQL = `
            SELECT 
                w.cd_sequence, 
                w.cd_health_unit, 
                w.cd_user_registered, 
                w.nm_ward, 
                w.dt_create, 
                w.dt_update, 
                u_registered.nm_user AS nm_user_registered,
                u_updated.nm_user AS nm_user_update
            FROM
                tb_prin_wards w
            LEFT JOIN 
                tb_prin_users u_registered ON u_registered.cd_sequence = w.cd_user_registered
            LEFT JOIN 
                tb_prin_users u_updated ON u_updated.cd_sequence = w.cd_user_update
            WHERE 
                w.cd_health_unit = $1 
                AND w.is_active = 1
                AND w.is_deleted = 0
            ORDER BY 
                w.dt_create DESC;
        `;

        // Executando a consulta com os parâmetros
        const results = await queryDb(SQL, values);
        return res.status(200).json(results); // Retorna os resultados das alas
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter as alas. Tente novamente mais tarde." });
    }
});

// Rota para obter uma ala por ID
router.post('/unic', async (req, res) => {

    const { cdSequence } = req.body;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código da ala é obrigatório!' });
    }
    try {
        const SQL = `SELECT * FROM tb_prin_wards WHERE cd_sequence = $1;`;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Ala não encontrada!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar a ala. Tente novamente mais tarde." });
    }
});

// Rota para criar uma nova ala
router.post('/create', async (req, res) => {
    try {
        const { cdHealthUnit, nmWard } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;

        if (!nmWard) {
            return res.status(422).json({ message: 'O nome da Ala é obrigatório!' });
        }

        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        let values = [];
        let SQL = `
            INSERT INTO tb_prin_wards (cd_health_unit, cd_user_registered, nm_ward)
            VALUES ($1, $2, $3)
        `;

        if (cd_permission == 1) {
            if (!cdHealthUnit) {
                return res.status(422).json({ message: 'A unidade de saúde é obrigatória!' });
            }
            values = [cdHealthUnit, cdUserRegistered, nmWard];
        } else if (cd_permission == 2) {
            values = [cd_health_unit, cdUserRegistered, nmWard];
        } else {
            return res.status(403).json({ message: 'Você não possui permissão para cadastrar uma ala!' });
        }

        await queryDb(SQL, values);
        return res.status(201).json({ message: 'Ala criada com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar a ala. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar uma ala
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, nmWard, cdHealthUnit } = req.body;
        const cdUserUpdate = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código da ala é obrigatório!' });
        }

        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserUpdate);

        let values = [];
        let SQL = '';

        if (cd_permission == 1) {
            if (!cdHealthUnit) {
                return res.status(422).json({ message: 'A unidade de saúde é obrigatória!' });
            }
            SQL = `
                UPDATE tb_prin_wards
                SET 
                    nm_ward = COALESCE($1, nm_ward),
                    cd_health_unit = COALESCE($2, cd_health_unit),
                    cd_user_update = COALESCE($3, cd_user_update),
                    dt_update = CURRENT_TIMESTAMP
                WHERE cd_sequence = $4
            `;
            values = [nmWard, cdHealthUnit, cdUserUpdate, cdSequence];
        } else if (cd_permission == 2) {
            SQL = `
                UPDATE tb_prin_wards
                SET 
                    nm_ward = COALESCE($1, nm_ward),
                    cd_user_update = COALESCE($2, cd_user_update),
                    dt_update = CURRENT_TIMESTAMP
                WHERE cd_sequence = $3
            `;
            values = [nmWard, cdUserUpdate, cdSequence];
        } else {
            return res.status(403).json({ message: 'Você não possui permissão para atualizar uma ala!' });
        }

        const result = await queryDb(SQL, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Ala não encontrada ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Ala atualizada com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar a Ala. Tente novamente mais tarde.' });
    }
});

// Rota para excluir uma ala
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código da Ala é obrigatório!' });
    }

    try {
        // Verificar se há blocos vinculados
        const checkBlocksSQL = `SELECT COUNT(*) AS total FROM tb_prin_blocks WHERE cd_ward = $1 AND is_active = 1`;
        const rows = await queryDb(checkBlocksSQL, [cdSequence]);

        if (rows[0].total > 0) {
            return res.status(400).json({ message: 'Não é possível excluir a Ala, pois há blocos vinculados.' });
        }

        // Exclusão lógica da ala
        const deleteSQL = `
            UPDATE tb_prin_wards
            SET 
                is_active = 0,
                is_deleted = 1, 
                cd_user_update = $1, 
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2;
        `;

        await queryDb(deleteSQL, [cdUserRegistered, cdSequence]);

        return res.status(200).json({ message: 'Ala excluída com sucesso!' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir a Ala.' });
    }
});



module.exports = router;
