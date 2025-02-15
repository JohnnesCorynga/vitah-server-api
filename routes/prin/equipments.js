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

        // Ajuste a query para retornar apenas os campos necessários
        const SQL = `
            SELECT 
                cd_sequence,
                nm_equipment
            FROM 
                tb_prin_equipments
            WHERE 
                cd_health_unit = $1
                AND is_active = 1
                AND is_deleted = 0
            ORDER BY 
                nm_equipment ASC;
        `;
        
        const results = await queryDb(SQL, values);

        // Mapeamento dos resultados para as variáveis correspondentes
        const cdEquipmentArray = results.map(item => item.cd_sequence);
        const nmEquipmentArray = results.map(item => item.nm_equipment);

        // Retorno dos dados para o cliente em formato JSON
        return res.status(200).json({
            nmEquipmentArray,
            cdEquipmentArray,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os dados dos equipamentos. Tente novamente mais tarde." });
    }
});

// Rota para listar todos os equipamentos
router.post('/all', async (req, res) => {
    try {
        const { cdHealthUnit } = req.body;  // Recebe o código da unidade de saúde, mas não é obrigatório
        const cdUserRegistered = req.user?.cdSequence || null;

        // Busca as permissões do usuário
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        // Inicializa a consulta SQL
        let querySQL = `
            SELECT * 
            FROM tb_prin_equipments
            WHERE is_deleted = 0  -- Filtro para não trazer equipamentos deletados
        `;
        let params = [];

        // Se o usuário tem permissão 1, ele pode ver todos os equipamentos
        if (cd_permission === 1) {
            // Se cdHealthUnit for fornecido, aplica o filtro
            if (cdHealthUnit) {
                querySQL += ` AND cd_health_unit = $1`;
                params.push(cdHealthUnit);
            }
        } else if (cd_permission === 2) {
            // Se o usuário tem permissão 2, ele verá apenas os equipamentos da sua unidade de saúde
            querySQL += ` AND cd_health_unit = $1`;
            params.push(cd_health_unit); // Usa a unidade de saúde associada ao usuário
        }

        // Ordena pela data de criação de forma decrescente
        querySQL += ` ORDER BY dt_create DESC`;

        // Executa a consulta SQL
        const results = await queryDb(querySQL, params);
        
        return res.status(200).json(results);  // Retorna os resultados
    } catch (error) {
        console.error('Erro ao obter os equipamentos:', error);
        return res.status(500).json({ message: "Erro ao obter os equipamentos. Tente novamente mais tarde." });
    }
});

// Rota para obter um equipamento por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do equipamento é obrigatório!' });
    }
    try {
        const SQL = `SELECT * FROM tb_prin_equipments WHERE cd_sequence = $1;`;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Equipamento não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o equipamento. Tente novamente mais tarde." });
    }
});
router.post('/create', async (req, res) => {
    try {
        const { 
            nmEquipment, dsDescription, cdStatus, dsLocation, nrUnic, 
            nrSerial, nrInvoice, nrLot, nmSupplier, vlValue, dtPurchase, 
            dtLastMaintenance, dtNextMaintenance, cdDepartment, cdSupplier,
            cdHealthUnit,
        } = req.body;

        const cdUserRegistered = req.user?.cdSequence || null;
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        // Definir o cdHealthUnit com base na permissão
        let cdHealthUnitPermission;
        if (cd_permission === 1) {
            // Se for permissão 1, usar o valor de cdHealthUnit vindo do body
            if (!cdHealthUnit) {
                return res.status(422).json({ message: 'O campo (Unidade de Saúde) é obrigatório!' });
            }
            cdHealthUnitPermission = cdHealthUnit;
        } else if (cd_permission === 2) {
            // Se for permissão 2, usar o cd_health_unit do usuário
            cdHealthUnitPermission = cd_health_unit;
        } else {
            return res.status(403).json({ message: 'Permissão insuficiente para esta ação.' });
        }

        // Validação separada para cada campo obrigatório
        if (!nmEquipment) {
            return res.status(422).json({ message: 'O campo nmEquipment (Nome do Equipamento) é obrigatório!' });
        }
        if (!cdStatus) {
            return res.status(422).json({ message: 'O campo cdStatus (Status do Equipamento) é obrigatório!' });
        }
        if (!dsLocation) {
            return res.status(422).json({ message: 'O campo dsLocation (Localização do Equipamento) é obrigatório!' });
        }
        if (!nrUnic) {
            return res.status(422).json({ message: 'O campo nrUnic (Número de Patrimônio) é obrigatório!' });
        }
        if (!cdHealthUnit) {
            return res.status(422).json({ message: 'O campo cdHealthUnit (Unidade de Saúde) é obrigatório!' });
        }

        const SQL = `
            INSERT INTO tb_prin_equipments (nm_equipment, ds_description, cd_status, ds_location, nr_unic, nr_serial, nr_invoice, nr_lot, nm_supplier, vl_value, dt_purchase, dt_last_maintenance, dt_next_maintenance, cd_department, cd_supplier, cd_health_unit, cd_user_registered)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `;
        
        await queryDb(SQL, [
            nmEquipment, dsDescription || null, cdStatus, dsLocation, nrUnic, 
            nrSerial || null, nrInvoice || null, nrLot || null, nmSupplier || null,
            vlValue || null, dtPurchase || null, dtLastMaintenance || null, dtNextMaintenance || null, 
            cdDepartment, cdSupplier, cdHealthUnitPermission, cdUserRegistered
        ]);

        return res.status(201).json({ message: 'Equipamento criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o equipamento. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar um equipamento
router.post('/update', async (req, res) => {
    try {
        const { 
            cdSequence, nmEquipment, dsDescription, cdStatus, dsLocation, nrUnic, 
            nrSerial, nrInvoice, nrLot, nmSupplier, vlValue, dtPurchase, 
            dtLastMaintenance, dtNextMaintenance, cdDepartment, cdSupplier, cdHealthUnit 
        } = req.body;

        const cdUserUpdate = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do equipamento é obrigatório!' });
        }

        const SQL = `
            UPDATE tb_prin_equipments
            SET 
                nm_equipment = COALESCE($1, nm_equipment),
                ds_description = COALESCE($2, ds_description),
                cd_status = COALESCE($3, cd_status),
                ds_location = COALESCE($4, ds_location),
                nr_unic = COALESCE($5, nr_unic),
                nr_serial = COALESCE($6, nr_serial),
                nr_invoice = COALESCE($7, nr_invoice),
                nr_lot = COALESCE($8, nr_lot),
                nm_supplier = COALESCE($9, nm_supplier),
                vl_value = COALESCE($10, vl_value),
                dt_purchase = COALESCE($11, dt_purchase),
                dt_last_maintenance = COALESCE($12, dt_last_maintenance),
                dt_next_maintenance = COALESCE($13, dt_next_maintenance),
                cd_department = COALESCE($14, cd_department),
                cd_supplier = COALESCE($15, cd_supplier),
                cd_health_unit = COALESCE($16, cd_health_unit),
                cd_user_update = COALESCE($17, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $18
        `;
        const result = await queryDb(SQL, [
            nmEquipment, dsDescription || null, cdStatus, dsLocation, nrUnic,
            nrSerial || null, nrInvoice || null, nrLot || null, nmSupplier || null,
            vlValue || null, dtPurchase || null, dtLastMaintenance || null, dtNextMaintenance || null,
            cdDepartment, cdSupplier, cdHealthUnit || null, cdUserUpdate, cdSequence
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Equipamento não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Equipamento atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o equipamento. Tente novamente mais tarde.' });
    }
});

// Rota para excluir (desativar) um equipamento
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do do equipamento é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE tb_prin_equipments
            SET 
                is_active = 0,
                is_deleted = 1,
                cd_user_update = $1,
                dt_update = CURRENT_TIMESTAMP
            WHERE 
                cd_sequence = $2;
        `;

        const result = await queryDb(SQL, [cdUserRegistered, cdSequence]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Equipamento não encontrado ou já desativado.' });
        }

        return res.status(200).json({ message: 'Equipamento desativado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao desativar Eqquipamento. Tente novamente mais tarde.' });
    }
});

module.exports = router;
