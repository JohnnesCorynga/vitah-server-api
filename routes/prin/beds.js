const express = require('express');
const { queryDb } = require('../../models/db');
const { getUserCodes } = require('../../functions/functionsAll');
const router = express.Router();

// Rota para mapear leitos de um apartamento
router.post('/map', async (req, res) => {
    const { cdApartment } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;

    if (!cdApartment) {
        return res.status(422).json({ message: 'O apartamento é obrigatório!' });
    }

    try {
        const SQL = `
            SELECT 
                cd_sequence,
                nm_bed
            FROM 
                tb_prin_beds
            WHERE 
                cd_apartment = $1
                AND is_active = 1 
                AND is_deleted = 0
            ORDER BY 
                nm_bed ASC;
        `;

        const results = await queryDb(SQL, [cdApartment]);

        const cdBedArray = results.map(item => item.cd_sequence);
        const nmBedArray = results.map(item => item.nm_bed);

        return res.status(200).json({cdBedArray, nmBedArray});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os leitos. Tente novamente mais tarde." });
    }
});

// Rota para buscar todos os Beds (Leitos) da unidade de saúde
router.post('/all', async (req, res) => {
    try {
        const { cdHealthUnit } = req.body;  // Recebe o código da unidade de saúde (Health Unit)
        const cdUserRegistered = req.user?.cdSequence || null;

        // Busca as permissões do usuário
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        if (cd_permission === 1 && !cdHealthUnit) {
            return res.status(422).json({ message: 'A unidade de saúde é obrigatória!' });
        }

        let querySQL = `
            SELECT * 
            FROM tb_prin_beds 
            WHERE is_deleted = 0  -- Filtro para não trazer leitos deletados
            AND cd_apartment IN 
                (
                    SELECT cd_sequence FROM tb_prin_apartments WHERE cd_block IN (
                        SELECT cd_sequence FROM tb_prin_blocks WHERE cd_ward IN (
                            SELECT cd_sequence FROM tb_prin_wards WHERE cd_health_unit = $1
                        )
                    )
                );
        `;
        let params = [];

        // Se o usuário tem permissão 1, ele pode ver todos os beds da unidade de saúde
        if (cd_permission === 1) {
            params = [cdHealthUnit];  // Filtra beds pela unidade de saúde
        } else if (cd_permission === 2) {
            // Se o usuário tem permissão 2, ele verá apenas os beds da sua unidade de saúde
            params = [cd_health_unit]; // Filtra wards pela unidade de saúde
        }

        // Executa a consulta SQL
        const beds = await queryDb(querySQL, params);

        return res.status(200).json(beds); // Retorna os leitos encontrados
    } catch (error) {
        console.error('Erro ao buscar beds:', error);
        return res.status(500).json({ message: 'Erro ao buscar beds. Tente novamente mais tarde.' });
    }
});

// Rota para buscar todos os Beds (Leitos) de um Apartamento específico
router.post('/by-apartment', async (req, res) => {
    try {
        const { cdApartment } = req.body;  // Recebe o código do apartamento (Apartment) para filtrar os beds
        const cdUserRegistered = req.user?.cdSequence || null;

        if (!cdApartment) {
            return res.status(422).json({ message: 'O Apartamento é obrigatório!' });
        }

        // Busca as permissões do usuário
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        let querySQL = `
            SELECT * 
            FROM tb_prin_beds 
            WHERE is_deleted = 0  -- Filtro para não trazer leitos deletados
            AND cd_apartment = $1
        `;
        let params = [cdApartment];

        if (cd_permission === 2) {
            // Se o usuário tem permissão 2, verifica se o apartamento pertence à mesma unidade de saúde do usuário
            querySQL += `
                AND cd_apartment IN (
                    SELECT cd_sequence FROM tb_prin_apartments WHERE cd_block IN (
                        SELECT cd_sequence FROM tb_prin_blocks WHERE cd_ward IN (
                            SELECT cd_sequence FROM tb_prin_wards WHERE cd_health_unit = $2
                        )
                    )
                )
            `;
            params.push(cd_health_unit);  // Passa a unidade de saúde do usuário como parâmetro
        }

        // Executa a consulta SQL
        const beds = await queryDb(querySQL, params);

        return res.status(200).json(beds); // Retorna os leitos encontrados
    } catch (error) {
        console.error('Erro ao buscar beds por apartamento:', error);
        return res.status(500).json({ message: 'Erro ao buscar beds. Tente novamente mais tarde.' });
    }
});

// Rota para obter um leito por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do leito é obrigatório!' });
    }
    try {
        const SQL = `SELECT * FROM tb_prin_beds WHERE cd_sequence = $1;`;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Leito não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o leito. Tente novamente mais tarde." });
    }
});

// Rota para criar um leito
router.post('/create', async (req, res) => {
    try {
        const { cdEquipment, cdApartment, nmBed, cdBedType, cdStatus } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;

        if (!cdEquipment) {
            return res.status(422).json({ message: 'O código do equipamento é obrigatório!' });
        }
        
        if (!cdApartment) {
            return res.status(422).json({ message: 'O código do apartamento é obrigatório!' });
        }
        
        if (!nmBed) {
            return res.status(422).json({ message: 'O nome do leito é obrigatório!' });
        }
        
        if (!cdBedType) {
            return res.status(422).json({ message: 'O tipo do leito é obrigatório!' });
        }
        
        if (!cdStatus) {
            return res.status(422).json({ message: 'O status do leito é obrigatório!' });
        }        

        // Insere o leito na tabela `tb_prin_beds`
        const insertBedSQL = `
            INSERT INTO tb_prin_beds (cd_equipment, nm_bed, cd_apartment, cd_bed_type, cd_status, cd_user_registered)
            VALUES ($1, $2, $3, $4, $5, $6);
        `;
        await queryDb(insertBedSQL, [cdEquipment, nmBed, cdApartment, cdBedType, cdStatus, cdUserRegistered]);

        return res.status(201).json({ message: 'Leito criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar leito:', error);
        return res.status(500).json({ message: 'Erro ao criar o leito. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar um leito
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, nmBed, cdBedType, cdStatus, cdApartment } = req.body;
        const cdUserUpdate = req.user?.cdSequence || null;

        // Verifica se o código do leito foi informado
        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do leito é obrigatório!' });
        }

        if (!cdUserUpdate) {
            return res.status(403).json({ message: 'Usuário não autorizado a atualizar o leito!' });
        }

        // Atualiza o leito
        const updateBedSQL = `
            UPDATE tb_prin_beds
            SET 
                nm_bed = COALESCE($1, nm_bed),
                cd_bed_type = COALESCE($2, cd_bed_type), 
                cd_status = COALESCE($3, cd_status),
                cd_apartment = COALESCE($4, cd_apartment),
                cd_user_update = $5, 
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $6;
        `;

        const result = await queryDb(updateBedSQL, [nmBed, cdBedType, cdStatus, cdApartment, cdUserUpdate, cdSequence]);

        // Verifica se o leito foi atualizado
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Leito não encontrado ou nenhum dado foi alterado!' });
        }

        return res.status(200).json({ message: 'Leito atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar leito:', error);
        return res.status(500).json({ message: 'Erro ao atualizar o leito. Tente novamente mais tarde.' });
    }
});

// Rota para excluir um leito
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;
    const cdUserUpdate = req.user?.cdSequence || null;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do leito é obrigatório!' });
    }

    try {
        const deleteSQL = `
            UPDATE tb_prin_beds
            SET 
                is_active = 0, 
                is_deleted = 1, 
                cd_user_update = $1, 
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2;
        `;
        await queryDb(deleteSQL, [cdUserUpdate, cdSequence]);

        return res.status(200).json({ message: 'Leito excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir o leito.' });
    }
});

module.exports = router;
