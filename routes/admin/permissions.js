const express = require('express');
const { queryDb } = require('../../models/db'); // Ajuste conforme necessário para sua conexão PostgreSQL
const router = express.Router();


router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_prin_permissions
           
            ORDER BY nm_permission ASC;
        `;
        const results = await queryDb(SQL);

        // Criar dois arrays: um para cd_sequence e outro para tp_employee
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_permission);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter os tipos de servidores. Tente novamente mais tarde." });
    }
});

// Rota para obter nomes e tipos de permissões
router.post('/all', async (req, res) => {
    try {
        const SQL = "SELECT * FROM tb_prin_permissions";
        const results = await queryDb(SQL);
        // console.log("RESULTS", results)
        return res.status(200).json(results);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});

module.exports = router;
