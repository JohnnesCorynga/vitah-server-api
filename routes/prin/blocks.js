const express = require('express');
const { queryDb } = require('../../models/db');
const { getUserCodes } = require('../../functions/functionsAll');
const router = express.Router();

// Rota para mapear blocos
router.post('/map', async (req, res) => {
    const { cdWard } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;

    const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

    try {
        
        if (!cdWard) {
            return res.status(422).json({ message: 'A ala  é obrigatória!' });
        }

        const SQL = `
            SELECT 
                cd_sequence,
                nm_block
            FROM 
                tb_prin_blocks
            WHERE 
                cd_ward= $1
                AND is_active = 1
            ORDER BY 
                nm_block ASC;
        `;

        const results = await queryDb(SQL,[cdWard]);

        const cdBlockArray = results.map(item => item.cd_sequence);
        const nmBlockArray = results.map(item => item.nm_block);

        return res.status(200).json({

            cdBlockArray,
            nmBlockArray,

        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os dados dos blocos. Tente novamente mais tarde." });
    }

});
// Rota para buscar todos os Blocks (Blocos) de uma unidade de saúde
router.post('/all', async (req, res) => {
    try {
        const { cdHealthUnit } = req.body;  // Recebe cdHealthUnit para filtrar os blocks
        const cdUserRegistered = req.user?.cdSequence || null;

        // Busca as permissões do usuário
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        // Valida a entrada
        if (cd_permission === 1 && !cdHealthUnit) {
            return res.status(422).json({ message: 'A unidade de saúde é obrigatória!' });
        }

        // Define a consulta SQL com base na permissão do usuário
        let querySQL = `
            SELECT * 
            FROM tb_prin_blocks 
            WHERE is_deleted = 0  -- Filtro para não trazer registros deletados
        `;
        let params = [];

        // Se o usuário tem permissão 1, ele pode ver todos os blocks
        if (cd_permission === 1) {
            if (cdHealthUnit) {
                querySQL += ` AND cd_ward IN (
                    SELECT cd_sequence 
                    FROM tb_prin_wards 
                    WHERE cd_health_unit = $1
                )`;
                params.push(cdHealthUnit);  // Filtra blocks pela unidade de saúde
            }
        } else if (cd_permission === 2) {
            // Se o usuário tem permissão 2, ele verá apenas os blocks da sua unidade de saúde
            querySQL += ` AND cd_ward IN (
                SELECT cd_sequence 
                FROM tb_prin_wards 
                WHERE cd_health_unit = $1
            )`;
            params.push(cd_health_unit); // Filtra blocks pela unidade de saúde do usuário
        }

        // Executa a consulta SQL
        const blocks = await queryDb(querySQL, params);
        return res.status(200).json(blocks); // Retorna os blocos encontrados
    } catch (error) {
        console.error('Erro ao buscar blocks:', error);
        return res.status(500).json({ message: 'Erro ao buscar blocks. Tente novamente mais tarde.' });
    }
});

// Rota para buscar todos os Blocks (Blocos) de uma Ala específica
router.post('/by-ward', async (req, res) => {
    try {
        const { cdWard } = req.body;  // Recebe o código da ala (Ward) para filtrar os blocks
        const cdUserRegistered = req.user?.cdSequence || null;

        // Busca as permissões do usuário
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        // Valida a entrada
        if (!cdWard) {
            return res.status(422).json({ message: 'A Ala é obrigatória!' });
        }

        // Define a consulta SQL para buscar os blocks da ala específica
        let querySQL = `
            SELECT * 
            FROM tb_prin_blocks 
            WHERE cd_ward = $1
            AND is_deleted = 0  -- Filtro para não trazer registros deletados
        `;
        let params = [cdWard];

        // Se o usuário tem permissão 2, verifica se a ala pertence à unidade de saúde do usuário
        if (cd_permission === 2) {
            querySQL += `
                AND cd_ward IN (
                    SELECT cd_sequence 
                    FROM tb_prin_wards 
                    WHERE cd_health_unit = $2
                )
            `;
            params.push(cd_health_unit);  // Passa a unidade de saúde do usuário como parâmetro
        }

        // Executa a consulta SQL
        const blocks = await queryDb(querySQL, params);
        return res.status(200).json(blocks); // Retorna os blocos encontrados
    } catch (error) {
        console.error('Erro ao buscar blocks por ala:', error);
        return res.status(500).json({ message: 'Erro ao buscar blocks. Tente novamente mais tarde.' });
    }
});

// Rota para obter um bloco por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do bloco é obrigatório!' });
    }
    try {
        const SQL = `SELECT * FROM tb_prin_blocks WHERE cd_sequence = $1;`;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Bloco não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o bloco. Tente novamente mais tarde." });
    }
});
router.post('/create', async (req, res) => {
    try {
        const { nmBlock, cdWard } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;
        console.log(cdUserRegistered,'cdUserRegistered')
        // Validações de entrada
        if (!nmBlock) {
            return res.status(422).json({ message: 'O nome do bloco é obrigatório!' });
        }
        if (!cdWard) {
            return res.status(422).json({ message: 'O código da Ala é obrigatório!' });
        }

        // Obtém os códigos do usuário
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        let values = [];
        let SQL = `
            INSERT INTO tb_prin_blocks (nm_block, cd_ward, cd_user_registered)
            VALUES ($1, $2, $3)
        `;

        if (cd_permission === 1) {
            values = [nmBlock, cdWard, cdUserRegistered];

        } else if (cd_permission === 2) {
            const verifySQL = `SELECT cd_health_unit FROM tb_prin_wards WHERE cd_sequence = $1`;
            const result = await queryDb(verifySQL, [cdWard]);

            if (!result || result.length === 0) {
                return res.status(404).json({ message: 'Unidade de saúde não encontrada!' });
            }

            const cdHealthUnit = result[0].cd_health_unit;

            if (cdHealthUnit !== cd_health_unit) {
                return res.status(403).json({ message: 'Você não tem permissão para cadastrar um bloco nesta unidade de saúde!' });
            }

            values = [nmBlock, cdWard, cdUserRegistered];

        } else {
            return res.status(403).json({ message: 'Você não tem permissão para cadastrar um bloco!' });
        }

        // Executa a inserção no banco de dados
        await queryDb(SQL, values);
        return res.status(201).json({ message: 'Bloco criado com sucesso!' });

    } catch (error) {
        console.error('Erro ao criar bloco:', error);
        return res.status(500).json({ message: 'Erro ao criar o bloco. Tente novamente mais tarde.', error: error.message });
    }
});

router.post('/update', async (req, res) => {
    try {

        const { cdSequence, nmBlock, cdWard } = req.body;
        const cdUserUpdate = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do bloco é obrigatório!' });
        }
        if (!nmBlock) {
            return res.status(422).json({ message: 'O nome do bloco é obrigatório!' });
        }
        if (!cdWard) {
            return res.status(422).json({ message: 'O código da Ala é obrigatório!' });
        }

        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserUpdate);
        let values = [];
        let SQL;

        if (cd_permission === 1) {
            SQL = `
                UPDATE tb_prin_blocks
                SET 
                    nm_block = $1,
                    cd_ward = $2,
                    cd_user_update = $3,
                    dt_update = CURRENT_TIMESTAMP
                WHERE cd_sequence = $4
            `;
            values = [nmBlock, cdWard, cdUserUpdate, cdSequence];

        } else if (cd_permission === 2) {
            const verifySQL = `SELECT cd_health_unit FROM tb_prin_wards WHERE cd_sequence = $1`;
            const result = await queryDb(verifySQL, [cdWard]);

            if (!result || result.length === 0) {
                return res.status(404).json({ message: 'Unidade de saúde não encontrada!' });
            }

            const cdHealthUnit = result[0].cd_health_unit;

            if (cdHealthUnit !== cd_health_unit) {
                return res.status(403).json({ message: 'Você não tem permissão para atualizar um bloco nesta unidade de saúde!' });
            }

            SQL = `
                UPDATE tb_prin_blocks
                SET 
                    nm_block = $1,
                    cd_user_update = $2,
                    dt_update = CURRENT_TIMESTAMP
                WHERE cd_sequence = $3
            `;
            values = [nmBlock, cdUserUpdate, cdSequence];

        } else {
            return res.status(403).json({ message: 'Você não possui permissão para atualizar um bloco!' });
        }

        const result = await queryDb(SQL, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Bloco não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Bloco atualizado com sucesso!' });

    } catch (error) {
        console.error('Erro ao atualizar bloco:', error);
        return res.status(500).json({ message: 'Erro ao atualizar o bloco. Tente novamente mais tarde.', error: error.message });
    }
});

// Rota para excluir um bloco
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;
    const cdUserUpdate = req.user?.cdSequence || null;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do Bloco é obrigatório!' });
    }

    try {
        
        // Verificar se há apartamentos vinculados
        const checkApartmentsSQL = `SELECT COUNT(*) AS total FROM tb_prin_apartments WHERE cd_block = $1 AND is_active = 1`;
        const rows = await queryDb(checkApartmentsSQL, [cdSequence]);

        if (rows[0].total > 0) {
            return res.status(400).json({ message: 'Não é possível excluir o Bloco, pois há apartamentos vinculados.' });
        }

        // Exclusão lógica do bloco
        const deleteSQL = `
            UPDATE tb_prin_blocks
            SET is_active = 0, is_deleted = 1,cd_user_update = $1, dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2;
        `;

        await queryDb(deleteSQL, [cdUserUpdate, cdSequence]);

        return res.status(200).json({ message: 'Bloco excluído com sucesso!' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir o Bloco.' });
    }
});

module.exports = router;