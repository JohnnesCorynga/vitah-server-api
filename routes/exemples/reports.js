const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

// Definição de consultas SQL para relatórios
const REPORT_QUERIES = {
    'clients_by_service': `
        SELECT 
            MAIN_SERVICE AS service_type, 
            COUNT(*) AS total_clients
        FROM 
            tb_clients
        WHERE 
            IS_ACTIVE = 1
        GROUP BY 
            MAIN_SERVICE
        ORDER BY 
            total_clients ASC;
    `,
    'values_by_year': `
        SELECT 
            EXTRACT(YEAR FROM DT_SERVICE_START) AS year,
            SUM(AMOUNT_DUE) AS total_due,
            SUM(AMOUNT_PAID) AS total_paid,
            SUM(AMOUNT_DUE - AMOUNT_PAID) AS total_receivable
        FROM 
            tb_services_provided
        GROUP BY 
            EXTRACT(YEAR FROM DT_SERVICE_START)
        ORDER BY 
            year ASC;
    `,
    'values_by_month': `
        SELECT 
            EXTRACT(YEAR FROM DT_SERVICE_START) AS year,
            EXTRACT(MONTH FROM DT_SERVICE_START) AS month,
            SUM(AMOUNT_DUE) AS total_due,
            SUM(AMOUNT_PAID) AS total_paid,
            SUM(AMOUNT_DUE - AMOUNT_PAID) AS total_receivable
        FROM 
            tb_services_provided
        GROUP BY 
            EXTRACT(YEAR FROM DT_SERVICE_START), 
            EXTRACT(MONTH FROM DT_SERVICE_START)
        ORDER BY 
            year ASC, month ASC;
    `,
    'clients_defaulting': `
        SELECT 
            c.NM_CLIENT AS client_name,
            c.MAIN_SERVICE AS service_type,
            s.AMOUNT_DUE,
            s.AMOUNT_PAID,
            (s.AMOUNT_DUE - s.AMOUNT_PAID) AS amount_pending
        FROM 
            tb_clients c
        JOIN 
            tb_services_provided s
        ON 
            c.CD_SEQUENCE = s.CD_CLIENT
        WHERE 
            (s.AMOUNT_DUE - s.AMOUNT_PAID) > 0
        ORDER BY 
            amount_pending ASC;
    `,
    'top_services': `
        SELECT 
            st.NM_SERVICE AS service_name,
            COUNT(sp.CD_SEQUENCE) AS total_contracted,
            SUM(sp.AMOUNT_DUE) AS total_revenue
        FROM 
            tb_seg_services_types st
        LEFT JOIN 
            tb_services_provided sp
        ON 
            st.CD_SEQUENCE = sp.CD_SERVICE
        GROUP BY 
            st.NM_SERVICE
        ORDER BY 
            total_contracted ASC, total_revenue ASC;
    `,
    'new_clients': `
        SELECT 
            EXTRACT(YEAR FROM DT_CREATE) AS year,
            EXTRACT(MONTH FROM DT_CREATE) AS month,
            COUNT(*) AS new_clients
        FROM 
            tb_clients
        GROUP BY
            EXTRACT(YEAR FROM DT_CREATE), 
            EXTRACT(MONTH FROM DT_CREATE)
        ORDER BY 
            year ASC, month ASC;
    `,
    'services_by_type': `
        SELECT  
            st.TP_SERVICE AS service_type,
            COALESCE(SUM(sp.qt_service), 0) AS total_quantity, -- Quantidade total de serviços
            SUM(sp.AMOUNT_DUE) AS total_due,  -- Total devido
            SUM(sp.AMOUNT_PAID) AS total_paid,  -- Total pago
            SUM(sp.AMOUNT_DUE) - SUM(sp.AMOUNT_PAID) AS total_receivable,  -- Total a receber
            COUNT(*) AS total_records  -- Total de registros (mantido para clareza, mas pode ser redundante)
        FROM 
            TB_SERVICES_PROVIDED sp
        JOIN 
            TB_SEG_SERVICES_TYPES st 
        ON 
            sp.CD_SERVICE = st.CD_SEQUENCE
        GROUP BY 
            st.TP_SERVICE
        ORDER BY 
            total_records ASC;
    `,
    'pending_payments': `
        SELECT 
            sp.CD_SEQUENCE AS service_id,
            sp.CD_CLIENT AS client_id,
            st.NM_SERVICE AS service_name,
            sp.AMOUNT_DUE AS total_due,
            sp.AMOUNT_PAID AS total_paid,
            (sp.AMOUNT_DUE - sp.AMOUNT_PAID) AS total_pending
        FROM 
            TB_SERVICES_PROVIDED sp
        JOIN 
            TB_SEG_SERVICES_TYPES st ON sp.CD_SERVICE = st.CD_SEQUENCE
        WHERE 
            sp.AMOUNT_DUE > sp.AMOUNT_PAID
        ORDER BY 
            total_pending ASC;
    `,
    'revenue_by_period': `
        SELECT 
            EXTRACT(YEAR FROM sp.DT_SERVICE_START) AS year,
            EXTRACT(MONTH FROM sp.DT_SERVICE_START) AS month,
            SUM(sp.AMOUNT_PAID) AS total_revenue,
            SUM(sp.AMOUNT_DUE) AS total_due
        FROM 
            TB_SERVICES_PROVIDED sp
        -- WHERE  sp.AMOUNT_PAID >= sp.AMOUNT_DUE 
        GROUP BY 
            EXTRACT(YEAR FROM sp.DT_SERVICE_START), 
            EXTRACT(MONTH FROM sp.DT_SERVICE_START)
        ORDER BY 
            year ASC, month ASC;
    `,
    'services_by_payment_method': `
        SELECT 
            sp.METHOD_PAID AS payment_method,
            COUNT(sp.CD_SEQUENCE) AS total_services,
            SUM(sp.AMOUNT_PAID) AS total_paid
        FROM 
            TB_SERVICES_PROVIDED sp
        WHERE (sp.AMOUNT_DUE - sp.AMOUNT_PAID) <= 0  
        GROUP BY 
            sp.METHOD_PAID
        ORDER BY 
            total_services ASC;
    `,
};

// Rota universal de relatórios
router.post('/', async (req, res) => {
    const { types } = req.body; // Ex.: ["clients-by-service", "values-by-year"]

    if (!Array.isArray(types) || types.length === 0) {
        return res.status(400).json({ message: 'Tipos de relatórios inválidos.' });
    }

    const results = {};
    try {
        for (const type of types) {
            if (!REPORT_QUERIES[type]) continue; // Ignorar relatórios inválidos
            results[type] = await queryDb(REPORT_QUERIES[type]);
        }
        return res.status(200).json(results);
    } catch (error) {
        console.error('Erro ao gerar relatórios:', error);
        return res.status(500).json({ message: 'Erro ao gerar relatórios.' });
    }
});
router.post('/report-clients', async (req, res) => {
    try {
        // Relatório de Dados Gerais
        let SQL = `
            SELECT
                COUNT(*) AS total_clients, -- Quantidade total de clientes
                COUNT(CASE WHEN IS_ACTIVE = 1 THEN 1 END) AS active_clients, -- Quantidade de clientes ativos
                COUNT(CASE WHEN IS_ACTIVE = 0 THEN 1 END) AS inactive_clients, -- Quantidade de clientes inativos
                COUNT(CASE WHEN VALID_PW_GOV = 0 THEN 1 END) AS invalid_passwords -- Quantidade de senhas inválidas
            FROM
                TB_CLIENTS
        `;

        // Consulta ao banco de dados para dados gerais
        const clientStats = await queryDb(SQL);

        // Relatório por Status de Processamento
        let SQLStatus = `
            SELECT
                status_processing,
                COUNT(*) AS status_processing_count -- Quantidade de clientes por status de processamento
            FROM
                TB_CLIENTS
            GROUP BY status_processing
            ORDER BY status_processing_count DESC
        `;

        // Consulta ao banco de dados para status de processamento
        const statusProcessing = await queryDb(SQLStatus);

        // Retorna os resultados ao cliente
        return res.status(200).json({
            clientStats: clientStats[0], // Relatório de dados gerais
            statusProcessing: statusProcessing // Relatório por status de processamento
        });

    } catch (error) {
        console.error('Erro ao gerar relatório de clientes:', error);
        return res.status(500).json({ message: 'Erro ao gerar relatório de clientes.' });
    }
});

router.post('/report-values', async (req, res) => {
    const { year, month } = req.body; // Filtros opcionais

    try {
        // Construção da consulta SQL dinâmica
        let SQL = `
            SELECT 
                SUM(COALESCE(AMOUNT_DUE, 0)) AS total_due,
                SUM(COALESCE(AMOUNT_PAID, 0)) AS total_paid,
                SUM(COALESCE(AMOUNT_DUE, 0)) - SUM(COALESCE(AMOUNT_PAID, 0)) AS total_to_receive,
                COALESCE(SUM(qt_service), 0) AS total_quantity,
                COUNT(*) AS total_records,
                ROUND(AVG(COALESCE(AMOUNT_DUE, 0)), 2) AS average_due
            FROM 
                TB_SERVICES_PROVIDED;
        `;

        const conditions = [];
        const params = [];

        if (year) {
            conditions.push(`EXTRACT(YEAR FROM DT_CREATE) = $${conditions.length + 1}`);
            params.push(year);
        }
        if (month) {
            conditions.push(`EXTRACT(MONTH FROM DT_CREATE) = $${conditions.length + 1}`);
            params.push(month);
        }

        if (conditions.length > 0) {
            SQL += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Consulta ao banco de dados
        const result = await queryDb(SQL, params);

        // Retorna o resultado ao cliente
        return res.status(200).json(result[0]);
    } catch (error) {
        console.error('Erro ao obter relatório de valores:', error);
        return res.status(500).json({ message: 'Erro ao gerar relatório de valores.' });
    }
});



module.exports = router;
