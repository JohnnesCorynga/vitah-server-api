const { queryDb } = require("../models/db");

// Função para registrar acesso do usuário
const logUserAccess = async (userId, accessType) => {
    // Validação básica de entrada
    if (!userId || typeof userId !== 'number') {
        throw new Error('ID do usuário inválido. Deve ser um número.');
    }
    if (!accessType || typeof accessType !== 'string') {
        throw new Error('Tipo de acesso inválido. Deve ser uma string.');
    }

    const SQL = 'INSERT INTO tb_seg_user_access (cd_user, tp_access) VALUES ($1, $2)';
    try {
        await queryDb(SQL, [userId, accessType]);
        console.log('Acesso do usuário registrado com sucesso.');
        return { success: true, message: 'Acesso registrado com sucesso.' }; // Retorno de sucesso
    } catch (error) {
        console.error('Erro ao registrar acesso do usuário:', error);
        throw new Error('Falha ao registrar acesso do usuário.'); // Lança erro após registrar
    }
};

module.exports = {
    logUserAccess,
};
