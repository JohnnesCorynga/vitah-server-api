const express = require('express');
const { queryDb } = require('../../models/db');
const { getEmployeeExist, generateHash, checkUserExists, getUserCodes } = require('../../functions/functionsAll');
const router = express.Router();


// Rota para obter um mapeamento de todos os usuários
router.post('/map', async (req, res) => {
    const cdUserRegistered = req.user?.cdSequence || null;
    try {
        // Verificar se o usuário está autenticado
        if (!cdUserRegistered) {
            return res.status(403).json({ message: 'Você não possui permissão para ver o mapeamento de usuários!' });
        }

        // Obter permissões do usuário
        const { cd_permission, cd_module, cd_health_unit } = await getUserCodes(cdUserRegistered);
        
        let sqlMap;

        // Verificar a permissão e definir a consulta conforme a lógica
        if (cd_permission === 1) { // Permissão 1: cdHealthUnit é obrigatório
            const { cdHealthUnit } = req.body;
            if (!cdHealthUnit) {
                return res.status(400).json({ message: 'A unidade de saúde é obrigatório!' });
            }
            sqlMap = `
                SELECT cd_sequence, nm_user
                FROM tb_prin_users
                WHERE is_active = 1 
                AND cd_health_unit = ${cdHealthUnit}
                ORDER BY nm_user ASC;
            `;
        } else if (cd_permission === 2) { // Permissão 2: usa o cd_health_unit do usuário
            sqlMap = `
                SELECT cd_sequence, nm_user
                FROM tb_prin_users
                WHERE is_active = 1 
                AND cd_health_unit = ${cd_health_unit}
                ORDER BY nm_user ASC;
            `;
        } else if (cd_permission === 3) { // Permissão 3: restrito por unidade e módulo
            sqlMap = `
                SELECT cd_sequence, nm_user
                FROM tb_prin_users
                WHERE is_active = 1
                AND cd_health_unit = ${cd_health_unit}
                AND cd_module = ${cd_module}
                ORDER BY nm_user ASC;
            `;
        } else {
            return res.status(403).json({ message: 'Você não possui permissão para ver o mapeamento de usuários!' });
        }

        // Executar a consulta
        const results = await queryDb(sqlMap);

        // Mapear os resultados em arrays
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.nm_user);

        // Retornar os arrays no formato JSON
        return res.status(200).json({
            cdSequenceArray,
            labelsArray,
        });
    } catch (error) {
        console.error("Erro ao processar o mapeamento:", error);
        return res.status(500).json({ message: "Erro ao obter o mapeamento de usuários. Tente novamente mais tarde." });
    }
});
// Rota para listar todos os usuários
router.post('/all', async (req, res) => {
     const cdUserRegistered = req.user?.cdSequence || null;
     try {
        const {cd_permission, cd_module,cd_health_unit} =await getUserCodes(cdUserRegistered)
        if(!cdUserRegistered){
            return res.status(403).json({message: 'Você não possui permissão para ver todos os usuários!'});
        }
        let sqlUser 
        if(cd_permission === 1){
            const { cdHealthUnit } = req.body;
            if (!cdHealthUnit) {
                return res.status(400).json({ message: 'A unidade de saúde é obrigatório!'});
            }
            sqlUser = ` 
                SELECT 
                    u.*,
                    e.*
                FROM 
                    tb_prin_users AS u
                LEFT JOIN 
                    tb_prin_employees AS e
                ON 
                    e.cd_sequence = u.cd_employee
                WHERE u.is_active = 1
                AND e.cd_health_unit = ${cdHealthUnit}
                ORDER BY u.nm_user ASC;
            `
        }else if(cd_permission === 2){
            sqlUser = ` 
                SELECT 
                    u.*,
                    e.*
                FROM 
                    tb_prin_users AS u
                LEFT JOIN 
                    tb_prin_employees AS e
                ON 
                    e.cd_sequence = u.cd_employee
                WHERE u.is_active = 1 
                AND u.cd_health_unit = ${cd_health_unit}
                ORDER BY u.nm_user ASC;
            `
        }else if(cd_permission === 3){
            sqlUser = ` 
                SELECT 
                    u.*,
                    e.*
                FROM 
                    tb_prin_users AS u
                LEFT JOIN 
                    tb_prin_employees AS e
                ON 
                    e.cd_sequence = u.cd_employee
                WHERE u.is_active = 1 
                AND u.cd_health_unit = ${cd_health_unit}
                AND u.cd_module = ${cd_module}
                ORDER BY u.nm_user ASC;
            `
        }else{
            return res.status(403).json({message: 'Você não possui permissão para ver os usuários!'});
        }
        
        const results = await queryDb(sqlUser);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao obter os usuários. Tente novamente mais tarde." });
    }
});

// Rota para obter um usuário por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;

    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do usuário é obrigatório!' });
    }

    try {
        const SQL = `
            SELECT *
            FROM 
                tb_prin_users
            WHERE is_active = 1 AND cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado!' });
        }

        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o usuário. Tente novamente mais tarde." });
    }
});

// Rota para criar um novo usuário
router.post('/create', async (req, res) => {
    const {
        cdEmployee, cdModule,
        nmUser, passUser, passUserConfirm
    } = req.body;
     const cdUserRegistered = req.user?.cdSequence || null;
    if (!cdEmployee) {
        return res.status(422).json({ message: 'O campo Funcionário é obrigatório!' });
    }
    
    try {
        if (await checkUserExists(cdEmployee)) {
            return res.status(422).json({ message: 'Este funcionário já possui um usuário cadastrado!' });
        }

        const sqlEmployeeExist = await getEmployeeExist(cdEmployee);
        console.log(sqlEmployeeExist);
        
        if (!sqlEmployeeExist) {
            return res.status(422).json({ message: 'Funcionário inexistente ou excluído.' });
        }


        if (!cdModule) {
            return res.status(422).json({ message: 'O campo Módulo é obrigatório!' });
        }

        if (!nmUser) {
            return res.status(422).json({ message: 'O campo Nome de Usuário é obrigatório!' });
        }

        let passwordCrypt;

        if (passUser) {
            if (passUser !== passUserConfirm) {
                return res.status(422).json({ message: 'As senhas não conferem!' });
            }
            passwordCrypt = await generateHash(passUser);
        } else {
            const { nr_registration } = sqlEmployeeExist;
            console.log(nr_registration,'nr_registration');
            
            if (!nr_registration) {
                return res.status(422).json({ message: 'Funcionário não possui matrícula válida.' });
            }
            passwordCrypt = await generateHash(nr_registration.toString());
        }

        const SQL = `
            INSERT INTO tb_prin_users (
                cd_employee, cd_module, cd_user_registered, 
                nm_user, pass_user
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING cd_sequence;
        `;

        const result = await queryDb(SQL, [
            cdEmployee, cdModule, cdUserRegistered,
            nmUser, passwordCrypt
        ]);

        return res.status(201).json({ message: 'Usuário criado com sucesso!', id: result[0].cd_sequence });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).json({ message: 'Erro ao criar o usuário. Tente novamente mais tarde.' });
    }
});

// Rota para atualizar um usuário
router.post('/update', async (req, res) => {
    const {
        cdSequence,cdModule, nmUser, passUser, passUserConfirm
    } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do usuário é obrigatório!' });
    }

    try {
        let passwordCrypt = null;

        if (passUser) {
            if (passUser !== passUserConfirm) {
                return res.status(422).json({ message: 'As senhas não conferem!' });
            }
            passwordCrypt = await generateHash(passUser);
        }

        const SQL = `
            UPDATE tb_prin_users
            SET 
                cd_module = COALESCE($1, cd_module),
                nm_user = COALESCE($2, nm_user),
                pass_user = COALESCE($3, pass_user),
                cd_user_update = COALESCE($4, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $5 AND is_active = 1;
        `;

        const result = await queryDb(SQL, [
            cdModule, nmUser, passwordCrypt, cdUserRegistered, cdSequence
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return res.status(500).json({ message: 'Erro ao atualizar o usuário. Tente novamente mais tarde.' });
    }
});
// Rota para atualizar apenas a permissão de um usuário
router.post('/update-permission', async (req, res) => {
    const { cdSequence, cdPermission } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do usuário é obrigatório!' });
    }

    if (!cdPermission) {
        return res.status(422).json({ message: 'O campo Permissão é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE tb_prin_users
            SET 
                cd_permission = $1,
                cd_user_update = COALESCE($2, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $3 AND is_active = 1;
        `;

        const result = await queryDb(SQL, [cdPermission,cdUserRegistered, cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: 'Permissão do usuário atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar permissão do usuário:', error);
        return res.status(500).json({ message: 'Erro ao atualizar a permissão do usuário. Tente novamente mais tarde.' });
    }
});

// Rota para desativar/excluir um usuário
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;
    const cdUserRegistered = req.user?.cdSequence || null;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do usuário é obrigatório!' });
    }

    try {
        const SQL = `
            UPDATE tb_prin_users
            SET 
                is_active = 0, 
                is_deleted = 1,
                cd_user_update = COALESCE($1, cd_user_update),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $2;
        `;

        const result = await queryDb(SQL, [cdUserRegistered,cdSequence]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado ou já desativado.' });
        }

        return res.status(200).json({ message: 'Usuário desativado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao desativar o usuário. Tente novamente mais tarde.' });
    }
});

module.exports = router;


