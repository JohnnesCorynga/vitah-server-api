const express = require('express');
const { queryDb } = require('../../models/db'); // Ajuste conforme necessário para sua conexão PostgreSQL
const router = express.Router();


router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT *
            FROM tb_z_system_modules
            WHERE is_active = 1 
            ORDER BY nm_module ASC;
        `;
        const results = await queryDb(SQL);

        // Criar arrays separados para os campos solicitados
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_module);
        // const typesArray = results.map(item => item.tp_module);

        // Retornar todos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray,
            // typesArray
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os tipos de módulos. Tente novamente mais tarde." });
    }
});

// Rota para obter nomes e tipos de permissões
router.post('/all', async (req, res) => {
    try {
        const SQL = "SELECT * FROM tb_z_system_modules";
        const results = await queryDb(SQL);
        // console.log("RESULTS", results)
        return res.status(200).json(results);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});

module.exports = router;
