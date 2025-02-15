const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

const { checkEmailExistsClients, checkCPFExistsClients } = require('../../functions/functionsAll');
const { convertDateToDB } = require('../../utils/dateConverte');
const { formatInNumber, isValidCPF, isValidNIS, isValidTitle } = require('../../utils/functions');

// Rota para obter todos os clientes
router.post('/all', async (req, res) => {
    try {
         // const { page = 1, limit = 1000 } = req.body;
        // const offset = (page - 1) * limit;
        // const SQL = "SELECT * FROM TB_SERVICES_PROVIDED LIMIT $1 OFFSET $2";
        // const results = await queryDb(SQL, [limit, offset]);

        const SQL = `
            SELECT 
                tc.*,
                us.NM_USER
            FROM tb_clients tc 
            LEFT JOIN 
                TB_USERS us ON tc.USER_REGISTERED = us.CD_SEQUENCE
            ORDER BY 
                tc.is_active DESC, tc.PRIORITY ASC, tc.nm_client ASC`;
        const results = await queryDb(SQL);
        return res.status(200).json({ clients: results });
    } catch (error) {
        console.error('Erro ao obter clientes:', error);
        return res.status(500).json({ message: 'Aconteceu um erro no servidor, tente novamente mais tarde.' });
    }
});
// Rota para obter um cliente por CD_SEQUENCE
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body; // Mudando para req.query para seguir as práticas RESTful

    if (!cdSequence) {
        return res.status(400).json({ message: 'CD_SEQUENCE é obrigatório.' });
    }

    try {
        const SQL = `
            SELECT 
                tc.*,
                us.NM_USER
            FROM tb_clients tc 
            LEFT JOIN 
                TB_USERS us ON tc.USER_REGISTERED = us.CD_SEQUENCE
            WHERE tc.CD_SEQUENCE = $1
        `; // Usando parâmetro para evitar SQL Injection
        const results = await queryDb(SQL, [cdSequence]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }

        return res.status(200).json(results[0]); // Retorna o cliente encontrado
    } catch (error) {
        console.error('Erro ao obter cliente:', error);
        return res.status(500).json({ message: 'Aconteceu um erro no servidor, tente novamente mais tarde.' });
    }
});
// Rota para criar um novo cliente
router.post('/create', async (req, res) => {
    try {
        const {
            nmClient,
            dtBirth,
            nrCpf,
            nrTitle,
            nrNis,
            pwGov,
            gender,
            profession,
            email,
            telephone,
            nmBanco,
            nrAgency,
            nrAccount,
            mainService,
            havePixCpf,
            isActive,
            priority,
            validPwGov,
            statusProcessing,
            addInfo
        } = req.body;
        console.log(req.body)
        const userRegisterCdSequence = req.user?.cdSequence || null;

        // Verificar se os campos obrigatórios foram fornecidos
        if (!nmClient) return res.status(422).json({ message: 'O nome do cliente é obrigatório!' });
        if (!nrCpf) return res.status(422).json({ message: 'O CPF é obrigatório!' });
        if (!pwGov) return res.status(422).json({ message: 'A senha é obrigatória!' });

        // Formatando e verificando o CPF
        const formattedCPF = formatInNumber(nrCpf);
        if (nrCpf && !isValidCPF(formattedCPF)) {
            return res.status(422).json({ message: 'CPF inválido!' });
        }

        // Verificar se o CPF já existe
        const cpfExists = await checkCPFExistsClients(formattedCPF);
        if (cpfExists) {
            return res.status(422).json({ message: 'Este CPF já está sendo utilizado por outro usuário!' });
        }

        // Formatando e verificando o NIS (opcional, se necessário)
        // const formattedNIS = nrNis;
        // if (nrNis && !isValidNIS(formattedNIS)) {
        //     return res.status(422).json({ message: 'NIS inválido!' });
        // }

        // Formatando e verificando o título de eleitor (opcional, se necessário)
        // const formattedTitle = formatInNumber(nrTitle);
        // if (nrTitle && !isValidTitle(formattedTitle)) {
        //     return res.status(422).json({ message: 'Título de eleitor inválido!' });
        // }

        // Verificar se o email já está sendo utilizado
        const emailExists = await checkEmailExistsClients(email);
        if (email && emailExists) {
            return res.status(422).json({ message: 'Este email já está sendo utilizado por outro usuário!' });
        }

        // Converter a data para o formato do banco de dados
        const dtBirthConvertDB = dtBirth ? dtBirth : null;
        const formatNrAgency = formatInNumber(nrAgency);
        const formatNrAccount = formatInNumber(nrAccount);

        // Consulta SQL para inserção
        const SQL = `
            INSERT INTO 
                TB_CLIENTS ( 
                    NM_CLIENT, DT_BIRTH, 
                    NR_CPF, NR_TITLE, 
                    NR_NIS, PW_GOV, 
                    GENDER, PROFESSION, 
                    EMAIL, TELEPHONE, 
                    NM_BANCO, NR_AGENCY, 
                    NR_ACCOUNT, MAIN_SERVICE, HAVE_PIX_CPF, 
                    IS_ACTIVE, PRIORITY, 
                    VALID_PW_GOV, STATUS_PROCESSING, 
                    USER_REGISTERED, ADD_INFO
                ) 
            VALUES (
                $1, $2, $3, $4, $5, $6, 
                $7, $8, $9, $10, $11, $12, 
                $13, $14, COALESCE($15, 0), 
                COALESCE($16, 0), $17, 
                COALESCE($18, 0), $19, $20, $21
            )
        `;

        const results = await queryDb(SQL, [
            nmClient, dtBirthConvertDB,
            formattedCPF, nrTitle,
            nrNis, pwGov,
            gender, profession,
            email, telephone,
            nmBanco, formatNrAgency,
            formatNrAccount, mainService, havePixCpf,
            isActive, priority || 4,
            validPwGov, statusProcessing,
            userRegisterCdSequence, addInfo
        ]);

        return res.status(201).json({ message: "Cliente criado com sucesso!" });
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        return res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde." });
    }
});

// Rota para criar vários clientes de uma vez
router.post('/create-massive', async (req, res) => {
    try {
        const clients = req.body.clients;
        const userRegisterCdSequence = req.user?.cdSequence || null;

        // Verificar se a matriz de clientes foi fornecida
        if (!clients || !Array.isArray(clients) || clients.length === 0) {
            return res.status(422).json({ message: 'A matriz de clientes é obrigatória e deve conter pelo menos um cliente!' });
        }

        const notInserted = []; // Armazenar os clientes que não foram inseridos
        const errors = [];      // Armazenar mensagens de erro
        let successfulInserts = 0; // Contador para inserções bem-sucedidas

        // Iterar sobre a matriz de clientes e realizar as verificações e inserções necessárias
        for (const client of clients) {
            const {
                nmClient, dtBirth,
                nrCpf, nrTitle,
                nrNis, pwGov,
                gender, profession,
                email, telephone,
                nmBanco, nrAgency,
                nrAccount, mainService, havePixCpf,
                isActive, priority,
                validPwGov, statusProcessing,
                addInfo
            } = client;

            // Verificar se os campos obrigatórios foram fornecidos
            if (!nmClient) {
                notInserted.push({ client, message: 'O nome do cliente é obrigatório!' });
                errors.push(`O nome do cliente é obrigatório para o cliente: ${JSON.stringify(client)}`);
                continue; // Ignora para o próximo cliente
            }
            if (!nrCpf) {
                notInserted.push({ client, message: 'O CPF é obrigatório!' });
                errors.push(`O CPF é obrigatório para o cliente: ${JSON.stringify(client)}`);
                continue;
            }
            if (!pwGov) {
                notInserted.push({ client, message: 'A senha é obrigatória!' });
                errors.push(`A senha é obrigatória para o cliente: ${JSON.stringify(client)}`);
                continue;
            }

            // Formatando e verificando o CPF
            let formattedCPF = formatInNumber(nrCpf);
            if (!isValidCPF(formattedCPF)) {
                notInserted.push({ client, message: `CPF ( ${nrCpf} ) inválido!` });
                errors.push(`CPF ( ${nrCpf} ) inválido para o cliente: ${JSON.stringify(client)}`);
                continue;
            }

            // Verificar se o CPF já existe
            const cpfExists = await checkCPFExistsClients(formattedCPF);
            if (cpfExists) {
                notInserted.push({ client, message: `Este CPF ( ${nrCpf} ) já está sendo utilizado por outro cliente!` });
                errors.push(`Este CPF ( ${nrCpf} ) já está sendo utilizado por outro cliente: ${JSON.stringify(client)}`);
                continue;
            }

           // Verificar e formatar o título de eleitor (NR_TITLE), se fornecido
            let formattedTitle = formatInNumber(nrTitle);
            // Se houver validação, descomente as linhas a seguir
            // if (nrTitle && !isValidTitle(formattedTitle)) {
            //     errors.push({ message: `Título ( ${nrTitle} ) de eleitor inválido!`, client });
            //     continue;
            // }

            // Verificar e formatar o NIS (NR_NIS), se fornecido
            let formattedNIS = formatInNumber(nrNis);
            // Se houver validação, descomente as linhas a seguir
            // if (nrNis && !isValidNIS(formattedNIS)) {
            //     errors.push({ message: `NIS ( ${nrNis} ) inválido! `, client });
            //     continue;
            // }
            
            // Verificar se o email já está sendo utilizado por outro cliente
            const emailExists = await checkEmailExistsClients(email);
            if (email && emailExists) {
                notInserted.push({ client, message: `Este email ( ${email} ) já está sendo utilizado por outro cliente!` });
                errors.push(`Este email ( ${email} ) já está sendo utilizado por outro cliente: ${JSON.stringify(client)}`);
                continue;
            }

            // Converter a data para o formato do banco de dados
            const dtBirthConvertDB = dtBirth// ? convertDateToDB(dtBirth) : null;
            const formatNrAgency = formatInNumber(nrAgency);
            const formatNrAccount = formatInNumber(nrAccount);

            // Preparar a consulta SQL
            let SQL = `
                INSERT INTO 
                    TB_CLIENTS (
                        NM_CLIENT, DT_BIRTH, 
                        NR_CPF, NR_TITLE, 
                        NR_NIS, PW_GOV, 
                        GENDER, PROFESSION, 
                        EMAIL, TELEPHONE, 
                        NM_BANCO, NR_AGENCY, 
                        NR_ACCOUNT, MAIN_SERVICE, HAVE_PIX_CPF, 
                        IS_ACTIVE, PRIORITY,
                        VALID_PW_GOV, STATUS_PROCESSING, 
                        USER_REGISTERED, ADD_INFO
                    ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            `;

            // Tentar inserir o cliente
            try {
                await queryDb(SQL, [
                    nmClient, dtBirthConvertDB,
                    formattedCPF, formattedTitle,
                    formattedNIS, pwGov,
                    gender, profession,
                    email, telephone,
                    nmBanco, formatNrAgency,
                    formatNrAccount, mainService, havePixCpf,
                    isActive, priority || 4,
                    validPwGov, statusProcessing,
                    userRegisterCdSequence, addInfo
                ]);
                successfulInserts++; // Incrementa o contador de inserções bem-sucedidas
            } catch (insertError) {
                console.log("ERROR INSERT: ", insertError )
                notInserted.push({ client, message: 'Erro ao inserir cliente' });
                errors.push({ message: 'Erro ao inserir cliente', client, error: insertError });
            }
        }

        // Retornar a quantidade inserida, clientes não inseridos e erros
        return res.status(200).json({
            message: `${successfulInserts} clientes criados com sucesso!`,
            notInserted,
            errors
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});

// Rota para atualizar um cliente
router.post('/update', async (req, res) => {
    try {
        const {
            cdSequence, nmClient,
            dtBirth, nrCpf,
            nrTitle, nrNis,
            pwGov, gender,
            profession, email,
            telephone, nmBanco,
            nrAgency, nrAccount, mainService,
            havePixCpf, isActive,
            priority, validPwGov,
            statusProcessing, addInfo
        } = req.body;

        if (!cdSequence) { return res.status(422).json({ message: 'O código do cliente é obrigatório!' }); }
        if (!nmClient) { return res.status(422).json({ message: 'O nome do cliente é obrigatório!' }); }
        if (!pwGov) { return res.status(422).json({ message: 'A senha é obrigatória!' }); }
        if (!nrCpf) { return res.status(422).json({ message: 'O CPF é obrigatório!' }); }

        const emailExists = await checkEmailExistsClients(email, cdSequence);
        if (email && emailExists) {
            return res.status(422).json({ message: `Este email ( ${email} ) já está sendo utilizado por outro usuário!` });
        }

        // Verificar e formatar o CPF, se fornecido
        let formattedCPF = formatInNumber(nrCpf);
        if (nrCpf && formattedCPF) {
            if (!isValidCPF(formattedCPF)) {
                return res.status(422).json({ message: 'CPF inválido!' });
            }
            // Verificar se o CPF já existe, excluindo o usuário atual
            const cpfExists = await checkCPFExistsClients(formattedCPF, cdSequence);
            if (cpfExists) {
                return res.status(422).json({ message: `Este CPF ( ${nrCpf} ) já está sendo utilizado por outro usuário!` });
            }
        }

        // Verificar e formatar o NIS, se fornecido
        let formattedNIS = formatInNumber(nrNis);
        // if (nrNis && formattedNIS) {
        //     if (!isValidNIS(formattedNIS)) {
        //         return res.status(422).json({ message: 'NIS inválido!' });
        //     }
        // }

        // Verificar e formatar o título de eleitor, se fornecido
        let formattedTitle = formatInNumber(nrTitle);
        // if (nrTitle && formattedTitle) {
        //     if (!isValidTitle(formattedTitle)) {
        //         return res.status(422).json({ message: 'Título de eleitor inválido!' });
        //     }
        // }

        // Converter a data para o formato do banco de dados
        const dtBirthConvertDB = dtBirth //? await convertDateToDB(dtBirth) : null;

        let SQL = `
            UPDATE TB_CLIENTS 
            SET NM_CLIENT = COALESCE($1, NM_CLIENT), 
                DT_BIRTH = COALESCE($2, DT_BIRTH), 
                NR_CPF = COALESCE($3, NR_CPF), 
                NR_TITLE = COALESCE($4, NR_TITLE), 
                NR_NIS = COALESCE($5, NR_NIS), 
                PW_GOV = COALESCE($6, PW_GOV), 
                GENDER = COALESCE($7, GENDER), 
                PROFESSION = COALESCE($8, PROFESSION), 
                EMAIL = COALESCE($9, EMAIL), 
                TELEPHONE = COALESCE($10, TELEPHONE), 
                NM_BANCO = COALESCE($11, NM_BANCO), 
                NR_AGENCY = COALESCE($12, NR_AGENCY), 
                NR_ACCOUNT = COALESCE($13, NR_ACCOUNT), 
                MAIN_SERVICE = COALESCE($14, MAIN_SERVICE), 
                HAVE_PIX_CPF = COALESCE($15, HAVE_PIX_CPF), 
                IS_ACTIVE = COALESCE($16, IS_ACTIVE), 
                PRIORITY = COALESCE($17, PRIORITY), 
                VALID_PW_GOV = COALESCE($18, VALID_PW_GOV), 
                STATUS_PROCESSING = COALESCE($19, STATUS_PROCESSING), 
                ADD_INFO = COALESCE($20, ADD_INFO) 
            WHERE CD_SEQUENCE = $21
        `;

        await queryDb(SQL, [
            nmClient,
            dtBirthConvertDB,
            formattedCPF,
            formattedTitle,
            formattedNIS,
            pwGov,
            gender,
            profession,
            email,
            telephone,
            nmBanco,
            nrAgency,
            nrAccount,
            mainService,
            havePixCpf,
            isActive,
            priority || 4,
            validPwGov,
            statusProcessing,
            addInfo,
            cdSequence
        ]);

        res.status(200).json({ message: 'Cliente atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar cliente.' });
    }
});

// Rota para excluir um cliente
router.post('/delete', async (req, res) => {
    const { cdSequence } = req.body;
    const userPermissionType = req.user?.permissionType || null;

    try {
        // Verificar se o usuário tem permissão de ADMIN
        if (userPermissionType !== 'ADMIN') {
            return res.status(403).json({ message: 'Você não tem permissão para excluir clientes!' });
        }

        // Verificar se o cliente existe
        const checkSQL = `SELECT COUNT(*) FROM TB_CLIENTS WHERE CD_SEQUENCE = $1`;
        const { rows } = await queryDb(checkSQL, [cdSequence]);
        const clientExists = rows[0].count > 0;

        if (!clientExists) {
            return res.status(404).json({ message: 'Cliente não encontrado!' });
        }

        // Excluir o cliente
        let SQL = `DELETE FROM TB_CLIENTS WHERE CD_SEQUENCE = $1`;
        await queryDb(SQL, [cdSequence]);

        return res.status(200).json({ message: "Cliente excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});

// Rota para criar vários clientes de uma vez
router.post('/create-massive-20', async (req, res) => {
    try {
        const clients = req.body.clients; // Dados enviados no body da requisição
        const userRegisterCdSequence = req.user?.cdSequence || null;

        // Verificar se a matriz de clientes foi fornecida
        if (!clients || !Array.isArray(clients) || clients.length === 0) {
            return res.status(422).json({ message: 'A matriz de clientes é obrigatória e deve conter pelo menos um cliente!' });
        }

        const notInserted = []; // Armazenar os clientes que não foram inseridos
        const errors = [];      // Armazenar mensagens de erro
        let successfulInserts = 0; // Contador para inserções bem-sucedidas

        // Iterar sobre a matriz de clientes e realizar as verificações e inserções necessárias
        for (const client of clients) {
            const {
                NM_CLIENT, DT_BIRTH, NR_CPF, NR_TITLE, NR_NIS,
                PW_GOV, GENDER, PROFESSION, EMAIL, TELEPHONE,
                NM_BANCO, NR_AGENCY, NR_ACCOUNT, MAIN_SERVICE, HAVE_PIX_CPF,
                IS_ACTIVE, PRIORITY, VALID_PW_GOV, STATUS_PROCESSING, ADD_INFO, USER_REGISTERED
            } = client;

            // Garantir que todos os campos obrigatórios foram fornecidos
            if (!NM_CLIENT || !NR_CPF || !PW_GOV) {
                notInserted.push({ client, message: 'Os campos NM_CLIENT, NR_CPF e PW_GOV são obrigatórios!' });
                errors.push(`Campos obrigatórios ausentes para o cliente: ${JSON.stringify(client)}`);
                continue; // Ignora para o próximo cliente
            }

            // Verificar se o CPF é válido
            const formattedCPF = formatInNumber(NR_CPF);
            if (!isValidCPF(formattedCPF)) {
                notInserted.push({ client, message: `CPF inválido!` });
                errors.push(`CPF inválido para o cliente: ${JSON.stringify(client)}`);
                continue;
            }

            // Verificar se o CPF já existe
            const cpfExists = await checkCPFExistsClients(formattedCPF);
            if (cpfExists) {
                notInserted.push({ client, message: `Este CPF já está sendo utilizado por outro cliente!` });
                errors.push(`Este CPF já está sendo utilizado por outro cliente: ${JSON.stringify(client)}`);
                continue;
            }

            // // Verificar se o email já está sendo utilizado por outro cliente, se fornecido
            // if (EMAIL) {
            //     const emailExists = await checkEmailExistsClients(EMAIL);
            //     if (emailExists) {
            //         notInserted.push({ client, message: `Este email já está sendo utilizado por outro cliente!` });
            //         errors.push(`Este email já está sendo utilizado por outro cliente: ${JSON.stringify(client)}`);
            //         continue;
            //     }
            // }

            // Preparar dados para inserção
            const dtBirthConvertDB = DT_BIRTH ? DT_BIRTH : null;
            const formattedNR_TITLE = NR_TITLE ? formatInNumber(NR_TITLE) : null;
            const formattedNR_NIS = NR_NIS ? formatInNumber(NR_NIS) : null;
            const formattedGENDER = GENDER || 'O'; // Se não for fornecido, default é 'O' (outro)

            const SQL = `
                INSERT INTO 
                    TB_CLIENTS (
                        NM_CLIENT, DT_BIRTH, NR_CPF, NR_TITLE, NR_NIS, PW_GOV, GENDER, PROFESSION, 
                        EMAIL, TELEPHONE, NM_BANCO, NR_AGENCY, NR_ACCOUNT, MAIN_SERVICE, HAVE_PIX_CPF, 
                        IS_ACTIVE, PRIORITY, VALID_PW_GOV, STATUS_PROCESSING, USER_REGISTERED, ADD_INFO
                    ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            `;

            // Tentar inserir o cliente
            try {
                await queryDb(SQL, [
                    NM_CLIENT, dtBirthConvertDB, formattedCPF, formattedNR_TITLE, formattedNR_NIS, 
                    PW_GOV, formattedGENDER, PROFESSION || null, EMAIL, TELEPHONE, 
                    NM_BANCO || null, NR_AGENCY || null, NR_ACCOUNT || null, MAIN_SERVICE || null, 
                    HAVE_PIX_CPF || 0, IS_ACTIVE || 1, PRIORITY || 0, VALID_PW_GOV || 0, 
                    STATUS_PROCESSING || null, USER_REGISTERED || null, ADD_INFO || null
                ]);
                successfulInserts++; // Incrementa o contador de inserções bem-sucedidas
            } catch (insertError) {
                console.log("ERROR INSERT: ", insertError);
                notInserted.push({ client, message: 'Erro ao inserir cliente' });
                errors.push({ message: 'Erro ao inserir cliente', client, error: insertError });
            }
        }

        // Retornar a quantidade inserida, clientes não inseridos e erros
        return res.status(200).json({
            message: `${successfulInserts} clientes criados com sucesso!`,
            notInserted,
            errors
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Aconteceu um erro no servidor, tente novamente mais tarde" });
    }
});


module.exports = router;
