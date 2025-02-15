const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();
const { generateHash, checkEmailExists, checkCPFExists, checkCdSequenceExists } = require('../../functions/functionsAll');
const { convertDateToDB } = require('../../utils/dateConverte');
const { checkPermission } = require('../../middleware/checked');
const { generateUserNmUser } = require('../../utils/functions');

// Rota para obter todos os usuários
router.post('/all', async (req, res, next) => {
    try {
        // const { page = 1, limit = 1000 } = req.body;
        // const offset = (page - 1) * limit;
        // const SQL = "SELECT * FROM TB_USERS LIMIT $1 OFFSET $2";
        // const results = await queryDb(SQL, [limit, offset]);
        const cdUserRegistered = req.user.cdSequence || 19802450

        const SQL = `
            SELECT 
                *
            FROM 
                TB_USERS 
            WHERE CD_PERMISSI
            ORDER BY 
               tu.is_active DESC, tu.nm_user ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error); // Adicionando log de erro para depuração
        return res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
// Rota para obter um usuário por CD_SEQUENCE
router.post('/user-unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do usuário é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT 
                tu.*,
                tp.nm_permission 
            FROM 
                TB_USERS AS tu
            LEFT JOIN 
                TB_PERMISSIONS AS tp 
            ON 
                tu.cd_permission = tp.cd_sequence
            WHERE tu.cd_sequence = $1
        `;
        const results = await queryDb(SQL, [cdSequence]); // Passa cdSequence como parâmetro
        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado!' });
        }
        return res.status(200).json(results[0]); // Retorna o usuário encontrado
    } catch (error) {
        console.error(error); // Log do erro para depuração
        return res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});

// Rota para criar um novo usuário 
router.post('/user-create', async (req, res) => {
    try {
        const { 
            nmUser, nmFull, dtBirth, 
            nrCpf, passUser, passUserConfirm, 
            email, telephone, isActive, cdPermission 
        } = req.body;
        const userRegisterCdSequence = req.user?.cdSequence || null;

        // Verificar se os campos obrigatórios foram fornecidos
        if (!nmFull) {
            return res.status(422).json({ message: 'O nome completo é obrigatório!' });
        }
        if (!nrCpf) {
            return res.status(422).json({ message: 'O CPF é obrigatório!' });
        }
        if (passUser && (passUser !== passUserConfirm)) {
            return res.status(422).json({ message: 'As senhas não conferem!' });
        }
            // return res.status(422).json({ message: 'A senha é obrigatória!' });
        if (!email) {
            return res.status(422).json({ message: 'O email é obrigatório!' });
        }
        if (!cdPermission) {
            return res.status(422).json({ message: 'O tipo de permissão é obrigatório!' });
        }


        // Se nmUser não for fornecido, use os dois primeiros nomes de nmFull
        // const namesArray = nmFull.toLowerCase().split(' ');
        // const finalNmUser = nmUser || `${namesArray[0]}${namesArray[1] || ''}`.trim();
        const finalNmUser = nmUser || generateUserNmUser(nmFull)
  

        // Verifica se o email já existe
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
            return res.status(422).json({ message: 'Este email já está sendo utilizado por outro usuário!' });
        }

        // Verifica se o CPF já existe
        const cpfExists = await checkCPFExists(nrCpf);
        if (cpfExists) {
            return res.status(422).json({ message: 'Este CPF já está sendo utilizado por outro usuário!' });
        }

        const dateBirthConverting = dtBirth;
        const passwordHash = passUser ? await generateHash(passUser): await generateHash(nrCpf);
        // Consulta SQL para inserir o novo usuário
        let SQL = `INSERT INTO TB_USERS (NM_USER, NM_FULL, DT_BIRTH, NR_CPF, PASS_USER, EMAIL, TELEPHONE, CD_PERMISSION, IS_ACTIVE, USER_REGISTERED) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
        const results = await queryDb(SQL, [finalNmUser, nmFull, dateBirthConverting || null, nrCpf, passwordHash, email, telephone || null, cdPermission, isActive, userRegisterCdSequence]);

        return res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (error) {
        console.error(error); // Log do erro para depuração
        return res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});

// Rota para criar usuários em massa
router.post('/user-create-massive', async (req, res) => {
    try {
        const users = req.body.users;
        const userRegisterCdSequence = req.user?.cdSequence || null;

        // Verificar se a matriz de usuários foi fornecida
        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(422).json({ message: 'A matriz de usuários é obrigatória e deve conter pelo menos um usuário!' });
        }

        const notInserted = []; // Armazenar os usuários que não foram inseridos
        const errors = [];      // Armazenar mensagens de erro
        let insertedCount = 0;  // Contador de usuários inseridos

        // Iterar sobre a matriz de usuários e realizar as verificações e inserções necessárias
        for (const user of users) {
            const { 
                nmUser, nmFull, dtBirth, 
                nrCpf, passUser, passUserConfirm, 
                email, telephone, isActive, cdPermission 
            } = user;

            // Verificar se os campos obrigatórios foram fornecidos
            if (!nmFull) {
                notInserted.push({ user, message: 'O nome completo é obrigatório!' });
                errors.push(`O nome completo é obrigatório para o usuário com email: ${email}`);
                continue; // Continua para o próximo usuário
            }
            if (!nrCpf) {
                notInserted.push({ user, message: 'O CPF é obrigatório!' });
                errors.push(`O CPF é obrigatório para o usuário com email: ${email}`);
                continue;
            }
            if (passUser && (passUser !== passUserConfirm)) {
                notInserted.push({ user, message: 'As senhas não conferem!' });
                errors.push(`As senhas não conferem para o usuário com email: ${email}`);
                continue;
            }
            if (!email) {
                notInserted.push({ user, message: 'O email é obrigatório!' });
                errors.push(`O email é obrigatório para o usuário com email: ${email}`);
                continue;
            }
            if (!cdPermission) {
                notInserted.push({ user, message: 'O tipo de permissão é obrigatório!' });
                errors.push(`O tipo de permissão é obrigatório para o usuário com email: ${email}`);
                continue;
            }

            // // Se nmUser não for fornecido, use os dois primeiros nomes de nmFull
            // const namesArray = nmFull.toLowerCase().split(' ');
            // const finalNmUser = nmUser || `${namesArray[0]}${namesArray[1] || ''}`.trim();
            const finalNmUser = nmUser || generateUserNmUser(nmFull)
  
            // Verifica se o email já existe
            const emailExists = await checkEmailExists(email);
            if (emailExists) {
                notInserted.push({ user, message: `Este email ( ${email} ) já está sendo utilizado por outro usuário!` });
                errors.push(`Este email ( ${email} ) já está sendo utilizado por outro usuário!`);
                continue;
            }

            // Verifica se o CPF já existe
            const cpfExists = await checkCPFExists(nrCpf);
            if (cpfExists) {
                notInserted.push({ user, message: `Este CPF ( ${nrCpf} ) já está sendo utilizado por outro usuário!` });
                errors.push(`Este CPF ( ${nrCpf} ) já está sendo utilizado por outro usuário!`);
                continue;
            }

            // const passwordHash = await generateHash(passUser);
            const passwordHash = passUser ? await generateHash(passUser): await generateHash(nrCpf);

            const dateBirthConverting = dtBirth;

            // Consulta SQL para inserir o novo usuário
            let SQL = `
                INSERT INTO 
                TB_USERS (NM_USER, NM_FULL, DT_BIRTH, NR_CPF, PASS_USER, EMAIL, TELEPHONE, CD_PERMISSION, IS_ACTIVE, USER_REGISTERED) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `;
            await queryDb(SQL, [ finalNmUser, nmFull, dateBirthConverting || null, nrCpf, passwordHash, email, telephone || null, cdPermission, isActive, userRegisterCdSequence]);

            insertedCount++; // Incrementa o contador de usuários inseridos
        }

        // Retorna a quantidade inserida, usuários não inseridos e erros
        return res.status(200).json({ 
            message: `${insertedCount} usuários inseridos com sucesso!`, 
            notInserted, 
            errors 
        });
    } catch (error) {
        console.error(error); // Log do erro para depuração
        return res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});

// Rota para atualizar um usuário
router.post('/user-update', async (req, res) => {
    try {
        const { 
            cdSequence, nmUser, nmFull, dtBirth, 
            nrCpf, passUser, passUserConfirm, 
            email, telephone, cdPermission, isActive,
        } = req.body;
        const userRegisterCdSequence = req.user?.cdSequence || null;

        // Verificar se o código do usuário foi fornecido
        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do usuário é obrigatório!' });
        }
        // Verificar se o nome completo foi fornecido
        if (!nmFull) {
            return res.status(422).json({ message: 'O nome completo é obrigatório!' });
        }
        // Verificar se o CPF foi fornecido
        if (!nrCpf) {
            return res.status(422).json({ message: 'O CPF é obrigatório!' });
        }
        // Verificar se a senha foi fornecida
        if (passUser && (passUser !== passUserConfirm)) {
            return res.status(422).json({ message: 'As senhas não conferem!' });
        }
        // Verificar se o email foi fornecido
        if (!email) {
            return res.status(422).json({ message: 'O email é obrigatório!' });
        }
        // Verificar se o tipo de permissão foi fornecido
        if (!cdPermission) {
            return res.status(422).json({ message: 'O tipo de permissão é obrigatório!' });
        }

        // Gerar nome de usuário
        const finalNmUser = nmUser || generateUserNmUser(nmFull);
        console.log("finalNmUser", finalNmUser);
        
        // Verifica se o email já existe (excluindo o usuário atual)
        const emailExists = await checkEmailExists(email, cdSequence);
        if (emailExists) {
            return res.status(422).json({ message: 'Este email já está sendo utilizado por outro usuário!' });
        }

        // Verifica se o CPF já existe (excluindo o usuário atual)
        const cpfExists = await checkCPFExists(nrCpf, cdSequence);
        if (cpfExists) {
            return res.status(422).json({ message: 'Este CPF já está sendo utilizado por outro usuário!' });
        }

        // Se a senha foi fornecida, gera o hash
        let passwordHash = null;
        if (passUser) {
            passwordHash = await generateHash(passUser);
        }

        // Validar e formatar a data de nascimento
        const dateBirthConverting = dtBirth || null;

        // Consulta SQL para atualizar o usuário
        const SQL = `
            UPDATE TB_USERS 
            SET 
                NM_USER = COALESCE($1, NM_USER), 
                NM_FULL = COALESCE($2, NM_FULL), 
                DT_BIRTH = COALESCE($3, DT_BIRTH), 
                NR_CPF = COALESCE($4, NR_CPF), 
                PASS_USER = COALESCE($5, PASS_USER), 
                EMAIL = COALESCE($6, EMAIL), 
                TELEPHONE = COALESCE($7, TELEPHONE), 
                CD_PERMISSION = COALESCE($8, CD_PERMISSION), 
                IS_ACTIVE = $9,
                USER_REGISTERED = COALESCE($10, USER_REGISTERED)
            WHERE CD_SEQUENCE = $11
        `;
        
        // Executa a consulta com os valores fornecidos
        const results = await queryDb(SQL, [
            finalNmUser, nmFull, dateBirthConverting, 
            nrCpf, passwordHash, email, 
            telephone || null, cdPermission, isActive, userRegisterCdSequence, cdSequence
        ]);

        // Verifica se a atualização afetou alguma linha
        if (results.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado ou não foi possível atualizar.' });
        }

        return res.status(200).json({ message: "Usuário atualizado com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});

// Rota para alterar a senha do usuário
router.post('/change-password', async (req, res) => {
    const { cdSequence, passOld, passUser, passUserConfirm } = req.body;

    try {
        // Verificar se todos os campos necessários foram fornecidos
        if (!cdSequence || !passOld || !passUser || !passUserConfirm) {
            return res.status(422).json({ message: 'Todos os campos são obrigatórios!' });
        }

        // Verificar se a nova senha e a confirmação da nova senha coincidem
        if (passUser !== passUserConfirm) {
            return res.status(422).json({ message: 'As senhas não conferem!' });
        }

        // Verificar se a senha antiga está correta
        const userSQL = `SELECT PASS_USER FROM TB_USERS WHERE CD_SEQUENCE = $1`;
        const { rows } = await queryDb(userSQL, [cdSequence]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado!' });
        }

        const user = rows[0];
        
        // Verifica se a senha antiga está correta
        const isPasswordValid = await verifyPassword(passOld, user.PASS_USER); // Usando verifyPassword
        if (!isPasswordValid) {
            return res.status(403).json({ message: 'Senha antiga incorreta!' });
        }

        // Gerar o hash da nova senha
        const passwordHash = await generateHash(passUser); // Função para gerar hash da nova senha

        // Atualizar a senha no banco de dados
        const updateSQL = `UPDATE TB_USERS SET PASS_USER = $1, DT_UPDATE = CURRENT_TIMESTAMP WHERE CD_SEQUENCE = $2`;
        await queryDb(updateSQL, [passwordHash, cdSequence]);

        return res.status(200).json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error(error); // Log do erro para depuração
        return res.status(500).json({ message: 'Aconteceu um erro no servidor, tente novamente mais tarde' });
    }
});

// Rota para excluir um usuário
router.post('/user-delete', checkPermission("ALL"), async (req, res) => {
    const { cdSequence } = req.body;
    try {
        // Excluir o usuário
        const SQL = `DELETE FROM TB_USERS WHERE CD_SEQUENCE = $1`;
        const { rowCount } = await queryDb(SQL, [cdSequence]);
        if (rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado!' });
        }
        return res.status(200).json({ message: "Usuário excluído com sucesso!" });
    } catch (error) {
        console.error(error); // Log do erro para depuração
        return res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});
module.exports = router;
