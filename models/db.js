require('dotenv').config(); // Utilizar variáveis de ambiente
const { Pool } = require('pg');

let { DATABASE_URL, DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, NODE_ENV } = process.env
// Configuração da conexão com o PostgreSQL
const pool = new Pool({
    // connectionString: DATABASE_URL, // Assumindo que você colocará a URL no .env
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: DB_PORT,
    // ssl: NODE_ENV == 'production' ? { rejectUnauthorized: false } : false, // Habilita SSL apenas em produção

    // idleTimeoutMillis: 30000, // Aumente o tempo de espera inativo
    // connectionTimeoutMillis: 2000, // Aumente o tempo de espera para conexãoF
});

// Função para realizar consultas no banco de dados
async function queryDb(sql, params) {
    const client = await pool.connect(); // Obtém uma conexão do pool
    try {
        const result = await client.query(sql, params); // Executa a consulta
        return result.rows; // Retorna as linhas do resultado
    } catch (error) {
        throw error; // Lança o erro para ser tratado pelo chamador
    } finally {
        client.release(); // Libera a conexão de volta ao pool
    }
}
// Função para obter a versão do PostgreSQL
async function getPgVersion() {
    try {
        const result = await queryDb('SELECT version()'); // Corrige a chamada para o SQL
        console.log(result[0].version); // Exibe a versão do PostgreSQL no console
    } catch (error) {
        console.error('Erro ao obter versão do PostgreSQL:', error);
    }
}
getPgVersion();
module.exports = {
    pool,
    queryDb
};
