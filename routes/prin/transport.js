const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();
const { getUserCodes } = require('../../functions/functionsAll');

// Rota para obter os dados de transportes
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
            return res.status(403).json({ message: 'Você não possui permissão para ver os transportes!' });
        }

        // Consulta para buscar os dados de transportes
        const SQL = `
            SELECT 
                cd_sequence,
                nm_vehicle
            FROM 
                tb_prin_transport 
            WHERE 
                cd_health_unit = $1
                AND is_active = 1
            ORDER BY 
                nm_vehicle ASC;
        `;
        const results = await queryDb(SQL, values);

        const cdVehicleArray = results.map(item => item.cd_sequence);
        const nmVehicleArray = results.map(item => item.nm_vehicle);

        return res.status(200).json({
            cdVehicleArray,
            nmVehicleArray
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os dados dos transportes. Tente novamente mais tarde." });
    }
});

// Rota para obter todos os transportes
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT 
                transport.cd_sequence,
                transport.cd_status,
                transport.cd_user_registered,
                transport.nm_vehicle,
                transport.nr_plate,
                transport.nm_driver,
                transport.nr_driver_phone,
                transport.cd_health_unit,
                transport.dt_create,
                transport.dt_update,
                user_registered.nm_user AS registered_by,
                user_update.nm_user AS updated_by
            FROM 
                tb_prin_transport transport
            LEFT JOIN 
                tb_prin_users user_registered ON transport.cd_user_registered = user_registered.cd_sequence
            LEFT JOIN 
                tb_prin_users user_update ON transport.cd_user_update = user_update.cd_sequence
            ORDER BY 
                transport.dt_create DESC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os transportes. Tente novamente mais tarde." });
    }
});

// Rota para obter um transporte por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do transporte é obrigatório!' });
    }
    try {
        const SQL = `SELECT * FROM tb_prin_transport WHERE cd_sequence = $1;`;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Transporte não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o transporte. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo transporte
router.post('/create', async (req, res) => {
    try {
        const { cdStatus, nmVehicle, nrPlate, nmDriver, nrDriverPhone, cdHealthUnit } = req.body;

        const cdUserRegistered = req.user?.cdSequence || null;

        if (!cdStatus) {
            return res.status(422).json({ message: 'O campo cdStatus é obrigatório!' });
        }
        if (!nmVehicle) {
            return res.status(422).json({ message: 'O campo nmVehicle (nome do veículo) é obrigatório!' });
        }
        if (!cdHealthUnit) {
            return res.status(422).json({ message: 'O campo cdHealthUnit (unidade de saúde) é obrigatório!' });
        }

        const SQL = `
            INSERT INTO tb_prin_transport (cd_status, cd_user_registered, nm_vehicle, nr_plate, nm_driver, nr_driver_phone, cd_health_unit)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await queryDb(SQL, [cdStatus, cdUserRegistered, nmVehicle, nrPlate, nmDriver, nrDriverPhone, cdHealthUnit]);

        return res.status(201).json({ message: 'Transporte criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o transporte. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar um transporte
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, nmVehicle, nrPlate, nmDriver, nrDriverPhone, cdStatus } = req.body;

        const cdUserUpdate = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do transporte é obrigatório!' });
        }

        const SQL = `
            UPDATE 
                tb_prin_transport
            SET 
                nm_vehicle = COALESCE($1, nm_vehicle),
                nr_plate = COALESCE($2, nr_plate),
                nm_driver = COALESCE($3, nm_driver),
                nr_driver_phone = COALESCE($4, nr_driver_phone),
                cd_status = COALESCE($5, cd_status),
                cd_user_update = COALESCE($6, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE 
                cd_sequence = $7
        `;
        const result = await queryDb(SQL, [nmVehicle, nrPlate, nmDriver, nrDriverPhone, cdStatus, cdUserUpdate, cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Transporte não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Transporte atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o transporte. Tente novamente mais tarde.' });
    }

});

// Rota para excluir um transporte
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;

    const cdUserRegistered = req.user?.cdSequence || null;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do transporte é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE 
                tb_prin_transport
            SET 
                is_active = 0, 
                is_deleted = 1, -- Marcando como inativo ou excluído
                cd_user_update = COALESCE($1, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE 
                cd_sequence = $2;
        `;
        await queryDb(SQL, [cdUserRegistered, cdSequence]);

        return res.status(200).json({ message: 'Transporte excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir o transporte. Tente novamente mais tarde.' });
    }
});

module.exports = router;
