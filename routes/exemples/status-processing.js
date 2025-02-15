// backend/routes/statusProcessing.js
require('dotenv').config();
const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

router.post('/all', async (req, res) => {
    try {
        // Consulta para obter todos os status com colunas completas
        const SQLAllStatus = "SELECT * FROM TB_SEG_STATUS_PROCESSING ORDER BY nm_status";
        const allStatus = await queryDb(SQLAllStatus);

        // Consulta para obter status distintos
        const SQLDistinctStatus = "SELECT DISTINCT tp_status FROM TB_SEG_STATUS_PROCESSING ORDER BY tp_status";
        const distinctStatus = await queryDb(SQLDistinctStatus);

        return res.status(200).json({ allStatus, distinctStatus });
    } catch (error) {
        console.error("Error fetching status processing:", error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});

module.exports = router;
