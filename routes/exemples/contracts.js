const express = require('express');
const multer = require('multer');
const path = require('path');
const { queryDb } = require('../../models/db');
const fs = require('fs');

const router = express.Router();

// Configuração do multer para salvar em "uploads/contracts/CD_CLIENT"
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const { cdClient } = req.body;
        const uploadPath = path.join(__dirname, '..', 'uploads', 'contracts', cdClient);

        // Criar a pasta caso não exista
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({ 
    storage,
    // Filtrar apenas tipos permitidos (opcional)
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Tipo de arquivo não suportado.'));
        }
        cb(null, true);
    },
});

// 2. Rota para buscar todos os contratos
router.get('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT 
                tc.*, 
                cl.NM_CLIENT AS nm_client,
                us.NM_USER, 
                srv.NM_SERVICE AS nm_service 
            FROM TB_CONTRACTS tc
            LEFT JOIN TB_USERS us ON tc.CD_USER_REGISTERED = us.CD_SEQUENCE
            LEFT JOIN TB_CLIENTS cl ON tc.CD_CLIENT = cl.CD_SEQUENCE
            LEFT JOIN TB_SEG_SERVICES_TYPES srv ON tc.CD_SERVICE = srv.CD_SEQUENCE;
        `;

        const results = await queryDb(SQL);
        return res.status(200).json({ contracts: results });
    } catch (error) {
        console.error('Erro ao buscar contratos:', error);
        return res.status(500).json({ message: 'Erro ao buscar contratos.' });
    }
});

// 3. Rota para buscar um contrato específico
router.post('/all-by-client', async (req, res) => {
    const { cdClient } = req.body;

    try {
        const SQL = `
            SELECT 
                tc.*, 
                cl.NM_CLIENT AS nm_client, 
                us.NM_USER,
                srv.NM_SERVICE AS nm_service
            FROM TB_CONTRACTS tc
            LEFT JOIN TB_USERS us ON tc.CD_USER_REGISTERED = us.CD_SEQUENCE
            LEFT JOIN TB_CLIENTS cl ON tc.CD_CLIENT = cl.CD_SEQUENCE
            LEFT JOIN TB_SEG_SERVICES_TYPES srv ON tc.CD_SERVICE = srv.CD_SEQUENCE
            WHERE tc.CD_SEQUENCE = $1;
        `;

        const results = await queryDb(SQL, [cdClient]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Contrato não encontrado.' });
        }

        return res.status(200).json({ contracts: results });
    } catch (error) {
        console.error('Erro ao buscar contrato:', error);
        return res.status(500).json({ message: 'Erro ao buscar contrato.' });
    }
});
// 3. Rota para buscar um contrato específico
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;

    try {
        const SQL = `
            SELECT 
                tc.*, 
                cl.NM_CLIENT AS nm_client, 
                us.NM_USER,
                srv.NM_SERVICE AS nm_service 
            FROM TB_CONTRACTS tc
            LEFT JOIN TB_CLIENTS cl ON tc.CD_CLIENT = cl.CD_SEQUENCE
            LEFT JOIN TB_USERS us ON tc.CD_USER_REGISTERED = us.CD_SEQUENCE
            LEFT JOIN TB_SEG_SERVICES_TYPES srv ON tc.CD_SERVICE = srv.CD_SEQUENCE
            WHERE tc.CD_SEQUENCE = $1;
        `;

        const result = await queryDb(SQL, [cdSequence]);

        if (result.length === 0) {
            return res.status(404).json({ message: 'Contrato não encontrado.' });
        }

        return res.status(200).json(result[0]);
    } catch (error) {
        console.error('Erro ao buscar contrato:', error);
        return res.status(500).json({ message: 'Erro ao buscar contrato.' });
    }
});

// 1. Rota para criar contrato
router.post('/create', upload.single('contractFile'), async (req, res) => {
    const {
        cdClient,
        cdService,
        nmContract,
        tpContract,
        dtServiceStart,
        dtServiceEnd,
    } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;
    // const contractFile = req.file?.path;
    const contractFile = req.file 
    ? path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/') 
    : null;

     // Verificar se os campos obrigatórios foram fornecidos
     if (!cdClient) return res.status(422).json({ message: 'O nome do cliente é obrigatório!' });
     if (!cdService) return res.status(422).json({ message: 'O tipo do serviço é obrigatório!' });
     if (!nmContract) return res.status(422).json({ message: 'O nome do contrato é obrigatório!' });
 
    try {
        const SQL = `
            INSERT INTO TB_CONTRACTS (
                CD_CLIENT, CD_SERVICE, NM_CONTRACT, TP_CONTRACT, CONTRACT_FILE,
                DT_SERVICE_START, DT_SERVICE_END, CD_USER_REGISTERED
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
        `;

        const result = await queryDb(SQL, [
            cdClient,
            cdService,
            nmContract,
            tpContract,
            contractFile,
            dtServiceStart,
            dtServiceEnd,
            cdUserRegistered,
        ]);

        return res.status(201).json({ message: 'Contrato criado com sucesso!', contract: result[0] });
    } catch (error) {
        console.error('Erro ao criar contrato:', error);
        return res.status(500).json({ message: 'Erro ao criar contrato.' });
    }
});

// 4. Rota para atualizar contrato
router.post('/update', upload.single('contractFile'), async (req, res) => {
    const {
        cdSequence,
        cdClient,
        cdService,
        nmContract,
        tpContract,
        dtServiceStart,
        dtServiceEnd,
    } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;
    // const contractFile = req.file?.path;
    // Obter caminho relativo do arquivo
    const contractFile = req.file 
    ? path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/') 
    : null;

     // Verificar se os campos obrigatórios foram fornecidos
     if (!cdClient) return res.status(422).json({ message: 'O nome do cliente é obrigatório!' });
     if (!cdService) return res.status(422).json({ message: 'O tipo do serviço é obrigatório!' });
     if (!nmContract) return res.status(422).json({ message: 'O nome do contrato é obrigatório!' });
 
    try {
        const SQL = `
            UPDATE TB_CONTRACTS
            SET 
                CD_CLIENT = COALESCE($1, CD_CLIENT), 
                CD_SERVICE = COALESCE($2, CD_SERVICE), 
                NM_CONTRACT = COALESCE($3, NM_CONTRACT),
                TP_CONTRACT = COALESCE($4, TP_CONTRACT),
                CONTRACT_FILE = COALESCE($5, CONTRACT_FILE),
                DT_SERVICE_START = COALESCE($6, DT_SERVICE_START),
                DT_SERVICE_END = COALESCE($7, DT_SERVICE_END),
                CD_USER_REGISTERED = $8,
                DT_UPDATE = CURRENT_TIMESTAMP
            WHERE CD_SEQUENCE = $9
            RETURNING *;
        `;

        const result = await queryDb(SQL, [
            cdClient,
            cdService,
            nmContract,
            tpContract,
            contractFile,
            dtServiceStart,
            dtServiceEnd,
            cdUserRegistered,
            cdSequence,
        ]);
        // console.log("RESULT: ",result, result.length)
        if (result.length === 0) {
            return res.status(404).json({ message: 'Contrato não encontrado.' });
        }

        return res.status(200).json({ message: 'Contrato atualizado com sucesso!', contract: result[0] });
    } catch (error) {
        console.error('Erro ao atualizar contrato:', error);
        return res.status(500).json({ message: 'Erro ao atualizar contrato.' });
    }
});

// 5. Rota para excluir contrato
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;

    try {
        const SQL = `DELETE FROM TB_CONTRACTS WHERE CD_SEQUENCE = $1 RETURNING *;`;

        const result = await queryDb(SQL, [cdSequence]);

        if (result.length === 0) {
            return res.status(404).json({ message: 'Contrato não encontrado.' });
        }

        return res.status(200).json({ message: 'Contrato excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir contrato:', error);
        return res.status(500).json({ message: 'Erro ao excluir contrato.' });
    }
});

module.exports = router;
