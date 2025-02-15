const express = require('express');
const { queryDb } = require('../../models/db');
const { getUserCodes } = require('../../functions/functionsAll');
const router = express.Router();

// 🔹 Rota: /map → Obtém mapeamento das ordens de serviço
router.post('/map', async (req, res) => {

    try {

        const { cdHealthUnit } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;

        // Obtém permissões do usuário autenticado
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);
        let values = [];

        // 🔹 Definição de cdHealthUnit com base na permissão
        if (cd_permission === 1) {

            if (!cdHealthUnit) {
                return res.status(422).json({ message: 'A unidade de saúde é obrigatória!' });
            }
            values = [cdHealthUnit];

        } else if (cd_permission === 2) {
            values = [cd_health_unit];
        } else {
            return res.status(403).json({ message: 'Você não possui permissão para ver as ordens de serviço!' });
        }

        // 🔹 Query para obter as ordens de serviço da unidade de saúde correspondente
        const SQL = `
            SELECT 
                cd_sequence, nr_order, cd_status
            FROM 
                tb_prin_service_orders
            WHERE 
                cd_health_unit = $1
                AND is_deleted = 0
            ORDER BY 
                dt_create DESC;
        `;

        const results = await queryDb(SQL, values);

        // Retorno no formato JSON
        return res.status(200).json(results);
    } catch (error) {
        console.error("Erro ao obter mapeamento das ordens de serviço:", error);
        return res.status(500).json({ message: "Erro ao obter mapeamento. Tente novamente mais tarde." });
    }
});

// 🔹 Rota: /all → Obtém todas as ordens de serviço
router.post('/all', async (req, res) => {
    try {
        const { cdHealthUnit } = req.body;
        const cdUserRegistered = req.user?.cdSequence || null;

        // Obtém permissões do usuário autenticado
        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        let values = [];

        // 🔹 Definição do filtro cdHealthUnit com base na permissão
        if (cd_permission === 1) {
            if (!cdHealthUnit) {
                return res.status(422).json({ message: 'A unidade de saúde é obrigatória!' });
            }
            values = [cdHealthUnit];
        } else if (cd_permission === 2) {
            values = [cd_health_unit];
        } else {
            return res.status(403).json({ message: 'Você não possui permissão para ver as ordens de serviço!' });
        }

        // 🔹 Query ajustada para filtrar apenas as ordens de serviço da unidade de saúde correspondente e incluir cd_user_registered e cd_user_update
        const SQL = `
            SELECT 
                so.*, 
                hu.nm_unit AS health_unit, 
                s.nm_supplier AS supplier, 
                e.nm_equipment AS equipment, 
                t.nm_vehicle AS transport, 
                p.tp_priority AS priority, 
                st.tp_status AS status,

                employees.nm_full AS nm_user_responsible,
                u_register.nm_user AS nm_user_registered,
                u_update.nm_user       AS nm_user_update
                
            FROM 
                tb_prin_service_orders so
            LEFT JOIN tb_prin_health_units hu ON hu.cd_sequence = so.cd_health_unit
            LEFT JOIN tb_prin_suppliers s ON s.cd_sequence = so.cd_supplier
            LEFT JOIN tb_prin_equipments e ON e.cd_sequence = so.cd_equipment
            LEFT JOIN tb_prin_transport t ON t.cd_sequence = so.cd_transport
            LEFT JOIN tb_terc_priority p ON p.cd_sequence = so.cd_priority
            LEFT JOIN tb_terc_status_os st ON st.cd_sequence = so.cd_status

            LEFT JOIN tb_prin_employees employees ON employees.cd_sequence = so.cd_user_responsible
            LEFT JOIN tb_prin_users u_register ON u_register.cd_sequence = so.cd_user_registered
            LEFT JOIN tb_prin_users u_update ON u_update.cd_sequence = so.cd_user_update
            
            WHERE 
                so.is_deleted = 0
                AND so.cd_health_unit = $1
            ORDER BY so.dt_create DESC;
        `;

        const results = await queryDb(SQL, values);

        return res.status(200).json(results);

    } catch (error) {
        console.error("Erro ao obter todas as ordens de serviço:", error);
        return res.status(500).json({ message: "Erro ao obter as ordens. Tente novamente mais tarde." });
    }
});
router.get('/unic', async (req, res) => {

    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do equipamento é obrigatório!' });
    }
    try {
        const SQL = `SELECT * FROM tb_prin_service_orders  WHERE so.cd_sequence = ? AND so.is_deleted = 0;`;

        const results = await queryDb(SQL, [cdSequence]);

        if (results.length === 0) {
            return res.status(404).json({ message: "Ordem de serviço não encontrada!" });
        }

        return res.status(200).json(results[0]);
    } catch (error) {
        console.error("Erro ao obter a ordem de serviço:", error);
        return res.status(500).json({ message: "Erro ao buscar a ordem. Tente novamente mais tarde." });
    }

});
// 🔹 Rota: /create → Cria uma nova ordem de serviço
router.post('/create', async (req, res) => {
    try {
        const {
            cdUserResponsible, cdSupplier, cdEquipment, cdTransport,
            cdPriority, cdStatus, cdHealthUnit, tpMaintenance, dsTags, dsMaintenance,
            nrSerial, nrOrder, dtStart, dtEnd  
        } = req.body;

        const cdUserRegistered = req.user?.cdSequence || null;

        if (!cdUserRegistered) {
            return res.status(403).json({ message: 'Usuário não autenticado.' });
        }

        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        // 🔹 Definir cdHealthUnit com base na permissão
        let cdHealthUnitPermission;
        if (cd_permission === 1) {
            if (!cdHealthUnit) {
                return res.status(422).json({ message: 'O campo cdHealthUnit (Unidade de Saúde) é obrigatório!' });
            }
            cdHealthUnitPermission = cdHealthUnit;

        } else if (cd_permission === 2) {
            cdHealthUnitPermission = cd_health_unit;

        } else {
            return res.status(403).json({ message: 'Permissão insuficiente para esta ação.' });
        }

        // 🔹 Verificar se já existe uma ordem com o mesmo nrSerial ou nrOrder
        const checkSQL = `
            SELECT 1 FROM tb_prin_service_orders 
            WHERE nr_serial = $1 OR nr_order = $2 AND is_deleted = 0
        `;

        const checkValues = [nrSerial, nrOrder];
        const checkResult = await queryDb(checkSQL, checkValues);

        if (checkResult.length > 0) {
            return res.status(400).json({ message: 'Já existe uma ordem de serviço com o mesmo número de série ou número de ordem.' });
        }

        // 🔹 Query segura para PostgreSQL com placeholders
        const SQL = `
            INSERT INTO tb_prin_service_orders 
                (cd_user_responsible, cd_user_registered, cd_supplier, cd_equipment, cd_transport, 
                cd_priority, cd_status, cd_health_unit, tp_maintenance, ds_tags, ds_maintenance, 
                nr_serial, nr_order, dt_start, dt_end)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING cd_sequence;
        `;

        // 🔹 Preparação de valores opcionais
        const values = [
            cdUserResponsible, cdUserRegistered, cdSupplier, cdEquipment || null, cdTransport || null,
            cdPriority || null, cdStatus || null, cdHealthUnitPermission, tpMaintenance || null, dsTags || null, dsMaintenance || null,
            nrSerial || null, nrOrder || null, dtStart || null, dtEnd || null
        ];

        // 🔹 Executar query
        const result = await queryDb(SQL, values);

        return res.status(201).json({ 
            message: "Ordem de serviço criada com sucesso!", 
            cdSequence: result[0].cd_sequence 
        });

    } catch (error) {
        console.error("Erro ao criar a ordem de serviço:", error);
        return res.status(500).json({ message: "Erro ao criar a ordem. Tente novamente mais tarde." });
    }
});

// 🔹 Rota: /update → Atualiza uma ordem de serviço existente
router.post('/update', async (req, res) => {
    try {
        const {
            cdSequence, cdUserResponsible, cdSupplier, cdEquipment, cdTransport,
            cdPriority, cdStatus, cdHealthUnit, tpMaintenance, dsTags, dsMaintenance,
            nrSerial, nrOrder, dtStart, dtEnd
        } = req.body;

        const cdUserRegistered = req.user?.cdSequence || null;

        if (!cdUserRegistered) {
            return res.status(403).json({ message: 'Usuário não autenticado.' });
        }

        const { cd_permission, cd_health_unit } = await getUserCodes(cdUserRegistered);

        // 🔹 Verificar permissão para cdHealthUnit
        let cdHealthUnitPermission;
        if (cd_permission === 1) {
            if (!cdHealthUnit) {
                return res.status(422).json({ message: 'O campo cdHealthUnit (Unidade de Saúde) é obrigatório!' });
            }
            cdHealthUnitPermission = cdHealthUnit;
        } else if (cd_permission === 2) {
            cdHealthUnitPermission = cd_health_unit;
        } else {
            return res.status(403).json({ message: 'Permissão insuficiente para esta ação.' });
        }

        // 🔹 Validação de cdSequence obrigatório
        if (!cdSequence) {
            return res.status(400).json({ message: 'O cdSequence da ordem de serviço é obrigatório!' });
        }

        // 🔹 Verificar se já existe outra ordem com o mesmo nrSerial ou nrOrder (exceto a ordem atual)
        const checkSQL = `
            SELECT 1 FROM tb_prin_service_orders 
            WHERE (nr_serial = $1 OR nr_order = $2) 
            AND cd_sequence != $3
            AND is_deleted = 0
        `;
        const checkValues = [nrSerial, nrOrder, cdSequence];
        const checkResult = await queryDb(checkSQL, checkValues);

        // 🔹 Se encontrar outro registro com o mesmo número de série ou número de ordem, bloqueia a atualização
        if (checkResult.length > 0) {
            return res.status(400).json({ message: 'Já existe uma ordem de serviço com este número de série ou ordem de serviço.' });
        }

        // 🔹 Query para atualizar a ordem de serviço
        const SQL = `
            UPDATE tb_prin_service_orders
            SET 
                cd_user_responsible = $1,
                cd_supplier = $2,
                cd_equipment = $3,
                cd_transport = $4,
                cd_priority = $5,
                cd_status = $6,
                cd_health_unit = $7,
                tp_maintenance = $8,
                ds_tags = $9,
                ds_maintenance = $10,
                nr_serial = $11,
                nr_order = $12,
                dt_start = $13,
                dt_end = $14,
                cd_user_update = COALESCE($15, cd_user_update), 
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $16 
            AND is_deleted = 0
            RETURNING cd_sequence;
        `;

        // 🔹 Preparação de valores para atualização
        const values = [
            cdUserResponsible, cdSupplier, cdEquipment || null, cdTransport || null,
            cdPriority || null, cdStatus || null, cdHealthUnitPermission, tpMaintenance || null, dsTags || null, dsMaintenance || null,
            nrSerial || null, nrOrder || null, dtStart || null, dtEnd || null, cdUserRegistered, cdSequence
        ];

        // 🔹 Executar query de atualização
        const result = await queryDb(SQL, values);

        if (result.length === 0) {
            return res.status(404).json({ message: "Ordem de serviço não encontrada ou já excluída!" });
        }

        return res.status(200).json({ message: "Ordem de serviço atualizada com sucesso!" });

    } catch (error) {
        console.error("Erro ao atualizar a ordem de serviço:", error);
        return res.status(500).json({ message: "Erro ao atualizar. Tente novamente mais tarde." });
    }
});

// 🔹 Rota: /delete → Realiza exclusão lógica da ordem de serviço
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;

        const cdUserRegistered = req.user?.cdSequence || null;
        
        if (!cdSequence) {
            return res.status(400).json({ message: "O ID da ordem de serviço é obrigatório!" });
        }

        const SQL = `
            UPDATE tb_prin_service_orders 
            SET
                is_deleted = 1,
                cd_user_update = COALESCE($1, cd_user_update), 
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2;
        `;
        const result = await queryDb(SQL, [cdUserRegistered,cdSequence]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Ordem de serviço não encontrada ou já excluída!" });
        }

        return res.status(200).json({ message: "Ordem de serviço excluída com sucesso!" });
    } catch (error) {
        console.error("Erro ao excluir a ordem de serviço:", error);
        return res.status(500).json({ message: "Erro ao excluir. Tente novamente mais tarde." });
    }
});

module.exports = router;
