const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();


// Rota para obter o mapa de endereços dos funcionários
router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT 
                cd_employee,
                cd_sequence, 
                ds_city, 
                ds_neighborhood, 
                ds_street, 
                cd_cep, 
                nr_address
            FROM 
                tb_prin_address_employees
            WHERE 
                AND is_active = 1
                is_deleted = 0
            ORDER BY 
                ds_city ASC;
        `;
        const results = await queryDb(SQL);

        const cdSequenceArray = results.map(item => item.cd_sequence);
        const cdEmployee = results.map(item => item.cd_employee);
        const addressesArray = results.map(item => `${item.ds_street}, ${item.nr_address}, ${item.ds_neighborhood}, ${item.ds_city} - ${item.cd_cep}`);

        return res.status(200).json({
            cdSequenceArray,
            cdEmployee,
            addressesArray,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os endereços. Tente novamente mais tarde." });
    }
});

// Rota para obter todos os endereços
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT 
                a.*, 
                u_registered.nm_user AS nm_user_registered, 
                u_updated.nm_user AS nm_user_update, 
            FROM 
                tb_prin_address_employees a
            LEFT JOIN 
                tb_prin_users u_registered ON u_registered.cd_sequence = a.cd_user_registered
            LEFT JOIN 
                tb_prin_users u_updated ON u_updated.cd_sequence = a.cd_user_update
            WHERE 
                AND is_active = 1
                is_deleted = 0
            ORDER BY 
                a.dt_create DESC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os endereços. Tente novamente mais tarde." });
    }
});

// Rota para obter um endereço por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do endereço é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * FROM tb_prin_address_employees WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Endereço não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o endereço. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo endereço
router.post('/create', async (req, res) => {
    try {
        const { cdEmployee, sgUf, dsUf, dsZone, dsCity, dsNeighborhood, dsStreet, cdCep, nrAddress } = req.body;

        const cdUserRegistered = req.user?.cdSequence || null;

        if (!cdEmployee) {
            return res.status(422).json({ message: 'O campo cdEmployee (ID do funcionário) é obrigatório!' });
        }
        
        if (!cdUserRegistered) {
            return res.status(422).json({ message: 'O campo cdUserRegistered (ID do usuário que registrou) é obrigatório!' });
        }
        
        if (!dsZone) {
            return res.status(422).json({ message: 'O campo dsZone (Zona de localização) é obrigatório!' });
        }
        

        const SQL = `
            INSERT INTO tb_prin_address_employees (cd_employee, cd_user_registered, sg_uf, ds_uf, ds_zone, ds_city, ds_neighborhood, ds_street, cd_cep, nr_address)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        await queryDb(SQL, [cdEmployee, cdUserRegistered, sgUf, dsUf, dsZone, dsCity, dsNeighborhood, dsStreet, cdCep, nrAddress]);

        return res.status(201).json({ message: 'Endereço criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o endereço. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar um endereço
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, sgUf, dsUf, dsZone, dsCity, dsNeighborhood, dsStreet, cdCep, nrAddress} = req.body;

        const cdUserUpdate = req.user?.cdSequence || null;
        
        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do endereço é obrigatório!' });
        }

        const SQL = `
            UPDATE tb_prin_address_employees
            SET 
                sg_uf = COALESCE($1, sg_uf),
                ds_uf = COALESCE($2, ds_uf),
                ds_zone = COALESCE($3, ds_zone),
                ds_city = COALESCE($4, ds_city),
                ds_neighborhood = COALESCE($5, ds_neighborhood),
                ds_street = COALESCE($6, ds_street),
                cd_cep = COALESCE($7, cd_cep),
                nr_address = COALESCE($8, nr_address),
                cd_user_update = COALESCE($9, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $10
        `;
        const result = await queryDb(SQL, [sgUf, dsUf, dsZone, dsCity, dsNeighborhood, dsStreet, cdCep, nrAddress, cdUserUpdate, cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Endereço não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Endereço atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o endereço. Tente novamente mais tarde.' });
    }
});

// Rota para excluir (desativar) um endereço
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;
        const cdUserUpdate = req.user?.cdSequence || null;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do endereço é obrigatório!' });
        }

        const SQL = `
            UPDATE tb_prin_address_employees
            SET
                is_active = 0,
                is_deleted = 1,
                cd_user_update = COALESCE($1, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2
        `;
        await queryDb(SQL, [cdUserUpdate, cdSequence]);

        return res.status(200).json({ message: "Endereço excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir o endereço. Tente novamente mais tarde." });
    }
});

module.exports = router;
