require('dotenv').config();
const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

router.post('/all', async (req, res, next) => {
    try {
        // Consulta para obter todos os serviços com colunas completas
        const SQLAllServices = "SELECT * FROM tb_seg_services_types ORDER BY nm_service";
        const allServices = await queryDb(SQLAllServices);

        // Consulta para obter tipos de serviço distintos
        const SQLDistinctTypes = "SELECT DISTINCT tp_service FROM tb_seg_services_types ORDER BY tp_service";
        const distinctTypes = await queryDb(SQLDistinctTypes);

        return res.status(200).json({ allServices, distinctTypes });
    } catch (error) {
        console.error("Error fetching service types:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Rota para buscar um tipo de serviço específico (services-types-unic)
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;

    try {
        const SQLUnicService = `SELECT * FROM tb_seg_services_types WHERE cd_sequence = $1`;
        const unicService = await queryDb(SQLUnicService, [cdSequence]);
        if (unicService.length === 0) {
            return res.status(404).json({ message: "Tipo de serviço não encontrado" });
        }

        return res.status(200).json(unicService[0]);
    } catch (error) {
        console.error("Error fetching specific service type:", error);
        res.status(500).json({ message: "Erro no servidor, tente novamente mais tarde" });
    }
});

// Rota para criar um novo tipo de serviço (services-types-create)
router.post('/create', async (req, res) => {
    const { nmService, tpService, price, percentageDue } = req.body;
    console.log("nmService, tpService, price, percentageDue", nmService, tpService, price, percentageDue)
    try {
        const SQLCreateService = `
            INSERT INTO tb_seg_services_types (nm_service, tp_service, price, percentage_due)
            VALUES ($1, $2, $3, $4)
            RETURNING *`;
        const newService = await queryDb(SQLCreateService, [nmService, tpService, price || 0, percentageDue || 0]);

        return res.status(201).json(newService[0]);
    } catch (error) {
        console.error("Error creating service type:", error);
        res.status(500).json({ message: "Erro no servidor, tente novamente mais tarde" });
    }
});

// Rota para atualizar um tipo de serviço existente (services-types-update)
router.post('/update', async (req, res) => {
    const { cdSequence, nmService, tpService, price, percentageDue } = req.body;

    try {
        const SQLUpdateService = `
            UPDATE tb_seg_services_types
            SET nm_service = $1, tp_service = $2, price = $3, percentage_due = $4
            WHERE cd_sequence = $5
            RETURNING *`;
        const updatedService = await queryDb(SQLUpdateService, [nmService, tpService, price, percentageDue, cdSequence]);

        if (updatedService.length === 0) {
            return res.status(404).json({ message: "Tipo de serviço não encontrado para atualizar" });
        }

        return res.status(200).json(updatedService[0]);
    } catch (error) {
        console.error("Error updating service type:", error);
        res.status(500).json({ message: "Erro no servidor, tente novamente mais tarde" });
    }
});


module.exports = router;
