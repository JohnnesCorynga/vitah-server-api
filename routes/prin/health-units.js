const express = require('express');
const { queryDb } = require('../../models/db');
const { getUserCodes } = require('../../functions/functionsAll');
const router = express.Router();


// Rota para obter unidades ativas ordenadas por nome
router.post('/map', async (req, res) => {

    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_health_units
            WHERE is_active = 1 
            ORDER BY nm_unit ASC;
        `;
        const results = await queryDb(SQL);

        // Criar arrays separados para os campos solicitados
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_unit);

        // Retornar todos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter as unidades de saúde. Tente novamente mais tarde." });
    }
});

// Rota para obter todas as unidades de saúde 
router.post('/all', async (req, res) => {

    try {

        // const { cd_permission, cd_module, cd_health_unit } = await getUserCodes(1)
        // console.log("Permission:",cd_permission, cd_module, cd_health_unit );

        const SQL = "SELECT * FROM tb_prin_health_units WHERE is_active = 1";
        const results = await queryDb(SQL);

        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde." });
    }

});

// Rota para buscar uma unidade de saúde específica
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código da unidade de saúde é obrigatório!' });
    }

    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_health_units
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Unidade de saúde não encontrada!' });
        }

        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao buscar a unidade de saúde.' });
    }
});

// Rota para criar uma nova unidade de saúde
router.post('/create', async (req, res) => {
    const {
        cdUnitType,
        nmUnit,
        nrCnes,
        email,
        latitude,
        longitude,
        dsZone,
        dsUf,
        dsCity,
        dsNeighborhood,
        dsStreet,
        nrCodeResidence,
        sgUf,
        nrCep,
        nrAddress,
        nrPhone,
        isActive,
        cdSegmento,
        cdArea,
        cdMicroArea,
    } = req.body;
    
    const cdUserRegistered = req.user?.cdSequence || null;


    console.log(cdUserRegistered, cdSegmento, cdArea);
   
    if (!cdUnitType) {
        return res.status(422).json({ message: 'O campo "Tipo de Unidade" é obrigatório!' });
    }
    if (!nmUnit) {
        return res.status(422).json({ message: 'O campo "Nome da Unidade" é obrigatório!' });
    }
    if (!nrCnes) {
        return res.status(422).json({ message: 'O campo "CNES" é obrigatório!' });
    }
    if (!latitude) {
        return res.status(422).json({ message: 'O campo "Latitude" é obrigatório!' });
    }
    if (!longitude) {
        return res.status(422).json({ message: 'O campo "Longitude" é obrigatório!' });
    }
    if (!dsZone) {
        return res.status(422).json({ message: 'O campo "Zona" é obrigatório!' });
    }
    
    try {
        const existingUnit = await queryDb(
            'SELECT * FROM tb_prin_health_units WHERE nr_cnes = $1',
            [nrCnes]
        );

        if (existingUnit.length > 0) {
            return res.status(422).json({ message: 'Já existe uma unidade de saúde cadastrada com esse CNES!' });
        }

        const SQL = `
            INSERT INTO tb_prin_health_units (
                cd_user_registered, cd_unit_type, nm_unit, nr_cnes, email, 
                latitude, longitude, ds_zone, ds_uf, ds_city, 
                ds_neighborhood, ds_street, nr_code_residence, sg_uf, 
                nr_cep, nr_address, nr_phone, is_active, cd_segmento, 
                cd_area, cd_micro_area
            )
            VALUES (
                $1, $2, $3, $4, $5, 
                $6, $7, $8, $9, $10, 
                $11, $12, $13, $14, 
                $15, $16, $17, $18, $19, 
                $20, $21
            )
        `;
        await queryDb(SQL, [
            cdUserRegistered,
            cdUnitType,
            nmUnit,
            nrCnes,
            email,
            latitude,
            longitude,
            dsZone,
            dsUf,
            dsCity,
            dsNeighborhood,
            dsStreet,
            nrCodeResidence,
            sgUf,
            nrCep,
            nrAddress,
            nrPhone,
            isActive || 1,
            cdSegmento,
            cdArea,
            cdMicroArea,
        ]);

        return res.status(201).json({ message: 'Unidade de saúde criada com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar a unidade de saúde.' });
    }
});

// Rota para atualizar uma unidade de saúde
router.post('/update', async (req, res) => {
    const {
        cdSequence,
        cdUnitType,
        nmUnit,
        nrCnes,
        email,
        latitude,
        longitude,
        dsZone,
        dsUf,
        dsCity,
        dsNeighborhood,
        dsStreet,
        nrCodeResidence,
        sgUf,
        nrCep,
        nrAddress,
        nrPhone,
        isActive,
        cdSegmento,
        cdArea,
        cdMicroArea,
    } = req.body;

    const cdUserRegistered = req.user.cd_sequence || 1
   

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código da unidade de saúde é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE tb_prin_health_units
            SET 
                cd_user_update = COALESCE($1, cd_user_update),
                cd_unit_type = COALESCE($2, cd_unit_type),
                nm_unit = COALESCE($3, nm_unit),
                nr_cnes = COALESCE($4, nr_cnes),
                email = COALESCE($5, email),
                latitude = COALESCE($6, latitude),
                longitude = COALESCE($7, longitude),
                ds_zone = COALESCE($8, ds_zone),
                ds_uf = COALESCE($9, ds_uf),
                ds_city = COALESCE($10, ds_city),
                ds_neighborhood = COALESCE($11, ds_neighborhood),
                ds_street = COALESCE($12, ds_street),
                nr_code_residence = COALESCE($13, nr_code_residence),
                sg_uf = COALESCE($14, sg_uf),
                nr_cep = COALESCE($15, nr_cep),
                nr_address = COALESCE($16, nr_address),
                nr_phone = COALESCE($17, nr_phone),
                is_active = COALESCE($18, is_active),
                cd_segmento = COALESCE($19, cd_segmento),
                cd_area = COALESCE($20, cd_area),
                cd_micro_area = COALESCE($21, cd_micro_area),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $22
        `;
        const result = await queryDb(SQL, [
            cdUserRegistered,
            cdUnitType,
            nmUnit,
            nrCnes,
            email,
            latitude,
            longitude,
            dsZone,
            dsUf,
            dsCity,
            dsNeighborhood,
            dsStreet,
            nrCodeResidence,
            sgUf,
            nrCep,
            nrAddress,
            nrPhone,
            isActive,
            cdSegmento,
            cdArea,
            cdMicroArea,
            cdSequence,
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Unidade de saúde não encontrada ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Unidade de saúde atualizada com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar a unidade de saúde.' });
    }
});

// Rota para excluir uma unidade de saúde
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código da unidade de saúde é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE tb_prin_health_units
            SET 
                is_active = 0,
                is_deleted = 1,
                cd_user_update = COALESCE($1, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2;
        `;
        await queryDb(SQL, [cdUserRegistered,cdSequence]);

        return res.status(200).json({ message: 'Unidade de saúde excluída com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir a unidade de saúde.' });
    }
});

module.exports = router;
