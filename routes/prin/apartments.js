const express = require('express');
const { queryDb } = require('../../models/db');
const { getUserCodes } = require('../../functions/functionsAll');
const router = express.Router();


router.post('/map', async (req, res) => {
    const { cdBlock } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;

    const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

    try {
        
        if (!cdBlock) {
            return res.status(422).json({ message: 'Selecione um Bloco para listar os apartamentos!' });
        }
        const SQL = `
            SELECT 
                cd_sequence, 
                nm_apartment
            FROM 
                tb_prin_apartments
            WHERE 
                is_active = 1
                AND is_deleted = 0
                AND cd_block = $1
            ORDER BY 
                nm_apartment;
        `;
        const results = await queryDb(SQL, [cdBlock]);
        console.log(results);
        const cdApartmentArray = results.map(item => item.cd_sequence);
        const nmApartmentArray = results.map(item => item.nm_apartment);

        return res.status(200).json({cdApartmentArray,nmApartmentArray});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao mapear os apartamentos. Tente novamente mais tarde." });
    }
});

// Rota para buscar todos os Apartments (Apartamentos) da unidade de saúde
router.post('/all', async (req, res) => {
    try {
        const { cdHealthUnit } = req.body;  // Recebe cdHealthUnit para filtrar os apartments
        const cdUserRegistered = req.user?.cdSequence || null;

        // Busca as permissões do usuário
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        // Valida a entrada
        if (cd_permission === 1 && !cdHealthUnit) {
            return res.status(422).json({ message: 'A unidade de saúde é obrigatória!' });
        }

        // Define a query SQL com base na permissão do usuário
        let querySQL = `
            SELECT * 
            FROM tb_prin_apartments 
            WHERE is_deleted = 0  -- Filtro para não trazer registros deletados
            AND cd_block IN 
                (
                    SELECT cd_sequence FROM tb_prin_blocks WHERE cd_ward IN (
                        SELECT cd_sequence FROM tb_prin_wards WHERE cd_health_unit = $1
                    )
                );
        `;
        let params = [];

        // Se o usuário tem permissão 1, ele pode ver todos os apartments
        if (cd_permission === 1) {
            params = [cdHealthUnit]; // Filtra apartments pela unidade de saúde
        } else if (cd_permission === 2) {
            // Se o usuário tem permissão 2, ele verá apenas os apartments da sua unidade de saúde
            params = [cd_health_unit]; // Filtra wards pela unidade de saúde
        }

        // Executa a consulta SQL
        const apartments = await queryDb(querySQL, params);
        return res.status(200).json(apartments); // Retorna os apartamentos encontrados
    } catch (error) {
        console.error('Erro ao buscar apartments:', error);
        return res.status(500).json({ message: 'Erro ao buscar apartments. Tente novamente mais tarde.' });
    }
});

// Rota para buscar todos os Apartments (Apartamentos) de um Bloco específico
router.post('/by-block', async (req, res) => {
    try {
        const { cdBlock } = req.body;  // Recebe o código do bloco (Block) para filtrar os apartamentos
        const cdUserRegistered = req.user?.cdSequence || null;

        // Valida a entrada
        if (!cdBlock) {
            return res.status(422).json({ message: 'O Bloco é obrigatório!' });
        }

        // Busca as permissões do usuário
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        // Define a query SQL para buscar apartamentos do bloco
        let querySQL = `
            SELECT * 
            FROM tb_prin_apartments 
            WHERE cd_block = $1
            AND is_deleted = 0  -- Filtro para não trazer registros deletados
        `;
        let params = [cdBlock];

        // Se o usuário tem permissão 2, verifica se o bloco pertence à unidade de saúde do usuário
        if (cd_permission === 2) {
            querySQL += `
                AND cd_block IN (
                    SELECT cd_sequence FROM tb_prin_blocks WHERE cd_ward IN (
                        SELECT cd_sequence FROM tb_prin_wards WHERE cd_health_unit = $2
                    )
                )
            `;
            params.push(cd_health_unit);  // Passa a unidade de saúde do usuário como parâmetro
        }

        // Executa a consulta SQL
        const apartments = await queryDb(querySQL, params);
        return res.status(200).json(apartments); // Retorna os apartamentos encontrados
    } catch (error) {
        console.error('Erro ao buscar apartments por bloco:', error);
        return res.status(500).json({ message: 'Erro ao buscar apartments. Tente novamente mais tarde.' });
    }
});

// Rota para obter um apartamento por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do apartamento é obrigatório!' });
    }
    try {
        const SQL = `SELECT * FROM tb_prin_apartments WHERE cd_sequence = $1;`;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Apartamento não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o apartamento. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo apartamento
router.post('/create', async (req, res) => { 
    
    const { cdBlock, nmApartment } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;

    if (!cdBlock) {
        return res.status(422).json({ message: 'O campo "cdBlock" é obrigatório!' });
    }

    if (!nmApartment) {
        return res.status(422).json({ message: 'O campo "nmApartment" é obrigatório!' });
    }

    try {
        // Obtém os códigos do usuário
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        // Verifica se o usuário tem permissão para criar apartamentos
        if (cd_permission === 1) {
           
            // Cria o apartamento
            const SQL = `
                INSERT INTO tb_prin_apartments (cd_block, cd_user_registered, nm_apartment)
                VALUES ($1, $2, $3)
            `;
            await queryDb(SQL, [cdBlock, cdUserRegistered, nmApartment]);

            return res.status(201).json({ message: 'Apartamento criado com sucesso!' });
        } else if (cd_permission === 2) {

            // Permissão 2 - Verifica se o bloco pertence à unidade de saúde do usuário
            const verifySQL = `SELECT cd_ward FROM tb_prin_blocks WHERE cd_sequence = $1`;
            const searchCdWard = await queryDb(verifySQL, [cdBlock]);
            const cdWard = searchCdWard[0].cd_ward;
            if (!searchCdWard || searchCdWard.length === 0) {
                return res.status(404).json({ message: 'Bloco não encontrado!' });
            }

            const verifySQL2 = `SELECT cd_health_unit FROM tb_prin_wards WHERE cd_sequence = $1`;
            const searchCdHealtUnits = await queryDb(verifySQL2, [cdWard]);

            const cdHealthUnit = searchCdHealtUnits[0].cd_health_unit;

            if (cdHealthUnit !== cd_health_unit) {
                return res.status(403).json({ message: 'Você não tem permissão para cadastrar um apartamento neste bloco!' });
            }

            // Verifica se o apartamento já existe no bloco
            const checkApartmentSQL = `
                SELECT COUNT(*) AS count FROM tb_prin_apartments 
                WHERE cd_block = $1 AND nm_apartment = $2;
            `;
            const checkResult = await queryDb(checkApartmentSQL, [cdBlock, nmApartment]);

            if (checkResult[0].count > 0) {
                return res.status(409).json({ message: 'Já existe um apartamento com este nome neste bloco!' });
            }

            // Cria o apartamento
            const SQL = `
                INSERT INTO tb_prin_apartments (cd_block, cd_user_registered, nm_apartment)
                VALUES ($1, $2, $3)
            `;
            await queryDb(SQL, [cdBlock, cdUserRegistered, nmApartment]);

            return res.status(201).json({ message: 'Apartamento criado com sucesso!' });
        } else {
            return res.status(403).json({ message: 'Você não tem permissão para cadastrar um apartamento!' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o apartamento. Tente novamente mais tarde.' });
    }

});


// Rota para atualizar um apartamento
router.post('/update', async (req, res) => {

    const { cdSequence, cdBlock, nmApartment } = req.body;
    const cdUserUpdate = req.user?.cdSequence || null;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do apartamento é obrigatório!' });
    }

    if (!cdBlock && !nmApartment) {
        return res.status(422).json({ message: 'Pelo menos um campo deve ser fornecido para atualização!' });
    }

    try {
        // Obtém os códigos do usuário
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserUpdate);

        // Verifica se o usuário tem permissão para atualizar apartamentos
        if (cd_permission === 1) {
            // Permissão 1 - Pode atualizar apartamentos sem restrições
            const checkApartmentSQL = `
                SELECT COUNT(*) AS count FROM tb_prin_apartments
                WHERE cd_sequence = $1;
            `;
            const checkResult = await queryDb(checkApartmentSQL, [cdSequence]);

            if (checkResult[0].count === 0) {
                return res.status(404).json({ message: 'Apartamento não encontrado!' });
            }

            // Atualiza o apartamento
            const SQL = `
                UPDATE 
                    tb_prin_apartments
                SET 
                    cd_block = COALESCE($1, cd_block),
                    nm_apartment = COALESCE($2, nm_apartment),
                    cd_user_update = COALESCE($3, cd_user_update),
                    dt_update = CURRENT_TIMESTAMP
                WHERE cd_sequence = $4
            `;
            const updateResult = await queryDb(SQL, [cdBlock, nmApartment, cdUserUpdate, cdSequence]);

            if (updateResult.rowCount === 0) {
                return res.status(404).json({ message: 'Apartamento não foi possível atualizar.' });
            }

            return res.status(200).json({ message: 'Apartamento atualizado com sucesso!' });

        } else if (cd_permission === 2) {
            // Permissão 2 - Verifica se o bloco pertence à unidade de saúde do usuário
            const verifySQL = `SELECT cd_health_unit FROM tb_prin_blocks WHERE cd_sequence = $1`;
            const result = await queryDb(verifySQL, [cdBlock]);

            if (!result || result.length === 0) {
                return res.status(404).json({ message: 'Bloco não encontrado!' });
            }

            const cdHealthUnit = result[0].cd_health_unit;

            if (cdHealthUnit !== cd_health_unit) {
                return res.status(403).json({ message: 'Você não tem permissão para atualizar um apartamento neste bloco!' });
            }

            // Verifica se o apartamento existe
            const checkApartmentSQL = `
                SELECT COUNT(*) AS count FROM tb_prin_apartments
                WHERE cd_sequence = $1;
            `;
            const checkResult = await queryDb(checkApartmentSQL, [cdSequence]);

            if (checkResult[0].count === 0) {
                return res.status(404).json({ message: 'Apartamento não encontrado!' });
            }

            // Atualiza o apartamento
            const SQL = `
                UPDATE 
                    tb_prin_apartments
                SET 
                    cd_block = COALESCE($1, cd_block),
                    nm_apartment = COALESCE($2, nm_apartment),
                    cd_user_update = COALESCE($3, cd_user_update),
                    dt_update = CURRENT_TIMESTAMP
                WHERE cd_sequence = $4
            `;
            const updateResult = await queryDb(SQL, [cdBlock, nmApartment, cdUserUpdate, cdSequence]);

            if (updateResult.rowCount === 0) {
                return res.status(404).json({ message: 'Apartamento não foi possível atualizar.' });
            }

            return res.status(200).json({ message: 'Apartamento atualizado com sucesso!' });

        } else {
            return res.status(403).json({ message: 'Você não tem permissão para atualizar apartamentos!' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o apartamento. Tente novamente mais tarde.' });
    }
});

// Rota para excluir um Apartamento
router.post('/delete-apartment', async (req, res) => {
    const { cdSequence } = req.body;
    const cdUserUpdate = req.user?.cdSequence || null;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do Apartamento é obrigatório!' });
    }

    try {
        // Verificar se há leitos vinculados
        const checkBedsSQL = `SELECT COUNT(*) AS total FROM tb_prin_beds WHERE cd_apartment = $1 AND is_active = 1`;
        const rows = await queryDb(checkBedsSQL, [cdSequence]);

        if (rows[0].total > 0) {
            return res.status(400).json({ message: 'Não é possível excluir o Apartamento, pois há leitos vinculados.' });
        }

        // Exclusão lógica do apartamento
        const deleteSQL = `
            UPDATE tb_prin_apartments
            SET is_active = 0, is_deleted = 1, cd_user_update = $1, dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2;
        `;

        await queryDb(deleteSQL, [cdUserUpdate, cdSequence]);

        return res.status(200).json({ message: 'Apartamento excluído com sucesso!' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir o Apartamento.' });
    }
});



module.exports = router;