const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();


router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT 
                cd_sequence, 
                nm_supplier 
            FROM 
                tb_prin_suppliers
            WHERE 
                is_active = 1
            ORDER BY 
                nm_supplier ASC;
        `;
        const results = await queryDb(SQL);

        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_supplier);

        return res.status(200).json({
            cdSequenceArray,
            labelsArray,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os fornecedores. Tente novamente mais tarde." });
    }
});

// Rota para obter todos os fornecedores
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT 
                s.cd_sequence, 
                s.nm_supplier, 
                s.nm_contact_person, 
                s.nr_phone, 
                s.nr_cnpj, 
                s.ds_address, 
                s.ds_email, 
                s.dt_create, 
                s.dt_update, 
                u_registered.nm_user AS registered_user,
                u_updated.nm_user AS updated_user
            FROM 
                tb_prin_suppliers s
            LEFT JOIN 
                tb_prin_users u_registered ON u_registered.cd_sequence = s.cd_user_registered
            LEFT JOIN 
                tb_prin_users u_updated ON u_updated.cd_sequence = s.cd_user_update
            ORDER BY 
                s.dt_create DESC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os fornecedores. Tente novamente mais tarde." });
    }
});

// Rota para obter um fornecedor por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do fornecedor é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT 
                s.cd_sequence, 
                s.nm_supplier, 
                s.nm_contact_person, 
                s.nr_phone, 
                s.nr_cnpj, 
                s.ds_address, 
                s.ds_email, 
                s.dt_create, 
                s.dt_update, 
                u_registered.nm_user AS registered_user,
                u_updated.nm_user AS updated_user
            FROM 
                tb_prin_suppliers s
            LEFT JOIN 
                tb_prin_users u_registered ON u_registered.cd_sequence = s.cd_user_registered
            LEFT JOIN 
                tb_prin_users u_updated ON u_updated.cd_sequence = s.cd_user_update
            WHERE 
                s.cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Fornecedor não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o fornecedor. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo fornecedor
router.post('/create', async (req, res) => {
    try {
        
        const { nmSupplier, nmContactPerson, nrPhone, nrCnpj, dsAddress, dsEmail } = req.body;

        const cdUserRegistered = req.user?.cdSequence || null;

        if (!nmSupplier) {
            return res.status(422).json({ message: 'O campo "nome do fornecedor" é obrigatório!' });
        }

        if (!nrCnpj) {
            return res.status(422).json({ message: 'O campo "CNPJ" é obrigatório!' });
        }

        if (!cdUserRegistered) {
            return res.status(422).json({ message: 'O campo "usuário registrado" é obrigatório!' });
        }

        const SQL = `
            INSERT INTO tb_prin_suppliers (cd_user_registered, nm_supplier, nm_contact_person, nr_phone, nr_cnpj, ds_address, ds_email)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await queryDb(SQL, [cdUserRegistered, nmSupplier, nmContactPerson, nrPhone, nrCnpj, dsAddress, dsEmail]);

        return res.status(201).json({ message: 'Fornecedor criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o fornecedor. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar um fornecedor
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, nmSupplier, nmContactPerson, nrPhone, nrCnpj, dsAddress, dsEmail } = req.body;
        const cdUserUpdate = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do fornecedor é obrigatório!' });
        }

        const SQL = `
            UPDATE tb_prin_suppliers
            SET 
                nm_supplier = COALESCE($1, nm_supplier),
                nm_contact_person = COALESCE($2, nm_contact_person),
                nr_phone = COALESCE($3, nr_phone),
                nr_cnpj = COALESCE($4, nr_cnpj),
                ds_address = COALESCE($5, ds_address),
                ds_email = COALESCE($6, ds_email),
                cd_user_update = COALESCE($7, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $8
        `;
        const result = await queryDb(SQL, [nmSupplier, nmContactPerson, nrPhone, nrCnpj, dsAddress, dsEmail, cdUserUpdate, cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Fornecedor não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Fornecedor atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o fornecedor. Tente novamente mais tarde.' });
    }
});

// Rota para excluir (desativar) um fornecedor
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;
        const cdUserUpdate = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do fornecedor é obrigatório!' });
        }

        const supplierExists = await queryDb(
            `SELECT * FROM tb_prin_suppliers WHERE cd_sequence = $1`,
            [cdSequence]
        );

        if (supplierExists.length === 0) {
            return res.status(404).json({ message: 'Fornecedor não encontrado!' });
        }

        const SQL = `
            UPDATE tb_prin_suppliers
            SET
                is_active = 0,
                is_deleted = 1,
                cd_user_update = COALESCE($1, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2
        `;

        await queryDb(SQL, [cdUserUpdate, cdSequence]);

        return res.status(200).json({ message: "Fornecedor excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir o fornecedor. Tente novamente mais tarde." });
    }
});

module.exports = router;