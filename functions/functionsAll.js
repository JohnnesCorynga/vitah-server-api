const bcrypt = require('bcrypt');
const { queryDb } = require('../models/db');

// Função para buscar permissões do usuário
async function getUserCodes(cdUser) {
    const SQL = `
        SELECT u.cd_permission, u.cd_module, e.cd_health_unit
        FROM tb_prin_users u
        JOIN tb_prin_employees e ON u.cd_employee = e.cd_sequence
        WHERE u.cd_sequence = $1;
    `;

    try {
        const res = await queryDb(SQL, [cdUser]);
        console.log(res)
        if (res.length > 0) {
            return res[0]; // Retorna as permissões do usuário
        } else {
            throw new Error('Usuário não encontrado.');
        }
    } catch (error) {
        throw new Error(`Erro ao obter permissões: ${error.message}`);
    }
}

const getPermissions = async () => {
    try {
        const SQL = 'SELECT * FROM tb_prin_permissions';
        const results = await queryDb(SQL);

        const permissions = {};

        // Iterar diretamente sobre results
        for (const row of results) {
            const permissionList = row.tp_permission.split(', ').map(permission => permission.trim());
            permissions[row.cd_sequence] = permissionList;
        }

        console.log('Permissões formatadas:', permissions);

        return permissions;
    } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        throw new Error('Não foi possível obter permissões do banco de dados.');
    }
};







async function getEmployeeExist(cdEmployee) {

    // Se cd_sequence for fornecido, verifica a existência excluindo o próprio registro
    const SQL = "SELECT * FROM tb_prin_employees WHERE cd_sequence = $1 AND is_active != 0 AND is_deleted != 1";
    
    const results = await queryDb(SQL, [cdEmployee]);
    return results[0]
}

async function generateHash(password) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    return passwordHash;
}

// Função para verificar se a senha corresponde ao hash
async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

// Função para verificar se a matricula já existe excluindo o próprio registro
async function checkNrRegistrationExist(nrRegistration, cdSequence) {
    let SQL;
    let params;
    if (cdSequence) {
        // Se cd_sequence for fornecido, verifica a existência excluindo o próprio registro
        SQL = "SELECT COUNT(*) AS count FROM tb_prin_employees WHERE cd_sequence <> $1 AND nr_registration = $2 ";
        params = [cdSequence, nrRegistration];
    } else {
        // Se cd_sequence não for fornecido, verifica a existência sem excluir nenhum registro
        SQL = "SELECT COUNT(*) AS count FROM tb_prin_employees WHERE nr_registration = $1 ";
        params = [nrRegistration];
    }
    const results = await queryDb(SQL, params);
    return results[0].count > 0;
}
// Função para verificar se o email já existe excluindo o próprio registro
async function checkUserExists(cdEmployee, cdSequence) {
    let SQL;
    let params;
    if (cdSequence) {
        // Se cd_sequence for fornecido, verifica a existência excluindo o próprio registro
        SQL = "SELECT COUNT(*) AS count FROM tb_prin_users WHERE cd_sequence <> $1 AND cd_employee = $2 ";
        params = [cdSequence, cdEmployee];
    } else {
        // Se cd_sequence não for fornecido, verifica a existência sem excluir nenhum registro
        SQL = "SELECT COUNT(*) AS count FROM tb_prin_users WHERE cd_employee = $1 ";
        params = [cdEmployee];
    }
    const results = await queryDb(SQL, params);
    return results[0].count > 0;
}
// Função para verificar se o email já existe excluindo o próprio registro
async function checkEmailExists(email, cdSequence) {
    let SQL;
    let params;
    if (cdSequence) {
        // Se cd_sequence for fornecido, verifica a existência excluindo o próprio registro
        SQL = "SELECT COUNT(*) AS count FROM tb_prin_employees WHERE cd_sequence <> $1 AND email = $2 ";
        params = [cdSequence, email];
    } else {
        // Se cd_sequence não for fornecido, verifica a existência sem excluir nenhum registro
        SQL = "SELECT COUNT(*) AS count FROM tb_prin_employees WHERE email = $1 ";
        params = [email];
    }
    const results = await queryDb(SQL, params);
    return results[0].count > 0;
}

// Função para verificar se o CPF do users já existe excluindo o próprio registro
async function checkCPFExists(nrCpf, cdSequence) {
    let SQL;
    let params;
    if (cdSequence) {
        // Se cd_sequence for fornecido, verifica a existência excluindo o próprio registro
        SQL = "SELECT COUNT(*) AS count FROM tb_prin_employees WHERE cd_sequence <> $1 AND nr_cpf = $2";
        params = [cdSequence, nrCpf];
    } else {
        // Se cd_sequence não for fornecido, verifica a existência sem excluir nenhum registro
        SQL = "SELECT COUNT(*) AS count FROM tb_prin_employees WHERE nr_cpf = $1";
        params = [nrCpf];
    }

    const results = await queryDb(SQL, params);
    return results[0].count > 0;
}

function isValidCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');

    // Verifica se o CPF tem 11 dígitos ou se é uma sequência de números iguais
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false;
    }

    // Calcula os dígitos verificadores
    let sum = 0, remainder;

    // Primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf[i - 1]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    // Segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf[i - 1]) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[10])) return false;

    return true;
}

async function getUserData(value) {
    const SQL = `
        SELECT 
            u.cd_sequence AS cd_user,
            u.*,
            e.*,
            p.nm_position,
            r.cd_sequence AS cd_permission,
            r.nm_permission,
            m.cd_sequence AS cd_module,
            m.tp_module,
            h.cd_sequence AS cd_health_unit,
            h.nm_unit
        FROM 
            tb_prin_users AS u
        LEFT JOIN 
            tb_prin_employees AS e ON e.cd_sequence = u.cd_employee
        LEFT JOIN 
            tb_prin_positions AS p ON p.cd_sequence = e.cd_position
        LEFT JOIN 
            tb_prin_permissions AS r ON r.cd_sequence = u.cd_permission
        LEFT JOIN 
            tb_z_system_modules AS m ON m.cd_sequence = u.cd_module
        LEFT JOIN 
            tb_prin_health_units AS h ON h.cd_sequence = e.cd_health_unit
        WHERE 
            u.is_active != 0 
            AND u.is_deleted = 0 
            AND e.email = $1
        LIMIT 1;

        `;
        
    // WHERE email = $1 OR nr_cpf = $2 OR cd_sequence = $3

    try {
        const results = await queryDb(SQL, [value]);
        // Retorna o primeiro resultado (LIMIT 1)
        return results[0] || null;
    } catch (error) {
        throw error;
    }
}
// Função para verificar se o email já existe excluindo o próprio registro
async function checkEmailExistsClients(email, cdSequence) {
    let SQL;
    let params;
    if (cdSequence) {
        // Se cd_sequence for fornecido, verifica a existência excluindo o próprio registro
        SQL = "SELECT COUNT(*) AS count FROM tb_clients WHERE cd_sequence <> $1 AND email = $2";
        params = [cdSequence, email];
    } else {
        // Se cd_sequence não for fornecido, verifica a existência sem excluir nenhum registro
        SQL = "SELECT COUNT(*) AS count FROM tb_clients WHERE email = $1";
        params = [email];
    }
    const results = await queryDb(SQL, params);
    return results[0].count > 0;
}

// Função para verificar se o CPF do users já existe excluindo o próprio registro
async function checkCPFExistsClients(nrCpf, cdSequence) {
    let SQL;
    let params;
    if (cdSequence) {
        // Se cd_sequence for fornecido, verifica a existência excluindo o próprio registro
        SQL = "SELECT COUNT(*) AS count FROM tb_clients WHERE cd_sequence <> $1 AND nr_cpf = $2";
        params = [cdSequence, nrCpf];
    } else {
        // Se cd_sequence não for fornecido, verifica a existência sem excluir nenhum registro
        SQL = "SELECT COUNT(*) AS count FROM tb_clients WHERE nr_cpf = $1";
        params = [nrCpf];
    }

    const results = await queryDb(SQL, params);
    return results[0].count > 0;
}

module.exports = {
    getUserData,
    getPermissions,
    getEmployeeExist,
    checkNrRegistrationExist,
    checkUserExists,
    getUserCodes,
    generateHash,
    verifyPassword,
    checkCPFExists,
    isValidCPF,
    checkEmailExists,
    checkCPFExistsClients,
    checkEmailExistsClients
};
