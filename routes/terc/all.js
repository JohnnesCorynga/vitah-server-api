require('dotenv').config();
const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();
// Buscando dados de prioridade
router.post('/priority', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_priority ORDER BY cd_sequence DESC";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_priority);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching priority:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando status das ordem de serviço STATUS_OS
router.post('/status-os', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_status_os ORDER BY tp_status";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_status);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching status-os:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});

// Buscando dadosTabela de tipos deficiencies
router.post('/disabilities', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_disabilities ORDER BY tp_disability";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_disability);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching disabilities:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});


// Buscando dados -- Tabela de tipos raças
router.post('/races', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_races ORDER BY tp_races";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_races);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching races:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados  tipos etnias
router.post('/ethnicities', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_ethnicities ORDER BY ds_ethnicity";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.ds_ethnicity);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching ethnicities:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados Tabela de tipos escolaridade NOT
router.post('/education-levels', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_education_levels ORDER BY ds_education_level";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.ds_education_level);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching education-levels:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados Tabela de tipos sanguineo e RH
router.post('/blood-types', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_blood_types ORDER BY tp_blood";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_blood);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching blood-types:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados Tabela de para armazenar os tipos de notificações
router.post('/notification-types', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_notification_types ORDER BY tp_notification";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_notification);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching tp_notification:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados Tabela de Tipos de Permissões
router.post('/permissions-type', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_permissions_type ORDER BY cd_sequence";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_permissions);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching tp_permissions:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados Tabela de Status de Consultas
router.post('/status-queries', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_status_queries ORDER BY tp_status";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_status);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching tp_status:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados Tabela de Status de Comunicações
router.post('/status-communication', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_status_communication ORDER BY tp_status";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_status);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching tp_status:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados Tabela de Tipos de Via de Administração
router.post('/admin-routes', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_admin_routes ORDER BY tp_route";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_route);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching tp_route:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados Tabela de Status de Leitos/Equipamentos
router.post('/equipments-status', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_equipments_status ORDER BY tp_status";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_status);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching tp_status:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados Tabela de para Status de Cirurgia
router.post('/surgery-status', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_surgery_status ORDER BY tp_status";
        const allStatus = await queryDb(SQLAllStatus);

        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_status);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching tp_status:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados Tabela de Integrações de APIs
router.post('/integrations', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_integrations";
        const allStatus = await queryDb(SQLAllStatus);
        res.status(200).json(allStatus);
    } catch (error) {
        console.error("Error fetching races:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Buscando dados Tabela de Tipos de Unidades
router.post('/unit-types', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM tb_terc_unit_types ORDER BY tp_unit";
        const allStatus = await queryDb(SQLAllStatus);
        // Criar dois arrays: um para cd_sequence e outro para tp_unit
        const cdSequenceArray = allStatus.map(item => item.cd_sequence);
        const labelsArray = allStatus.map(item => item.tp_unit);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error("Error fetching tp_unit:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});









module.exports = router;
