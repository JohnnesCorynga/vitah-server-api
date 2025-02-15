const { getUserPermissions } = require('../functions/functionsAll');
const { queryDb } = require('../models/db');

// Middleware para verificar se o usuário tem acesso ao módulo e à unidade de saúde
async function checkAccess(req, res, next) {
    const cdUser = req.user.cd_sequence; // ID do usuário autenticado

    const requestedPermission = req.resulCheck.cd_permission; // Módulo da rota solicitada
    const requestedModule = req.resulCheck.cd_module; // Módulo da rota solicitada
    const requestedHealthUnit = req.resulCheck.cd_health_unit; // Unidade de saúde da rota solicitada

    // Buscar permissões do usuário (módulo, unidade de saúde, etc.)
    const { cd_permission, cd_module, cd_health_unit } = await getUserPermissions(cdUser)
       
            // 1. Verificar se o usuário é admin-master, admin ou manager
            // if (cd_permission === 'admin-master') {
            if (cd_permission === 1) {
                return next(); // Admin-Master tem acesso completo
            }

            // 2. Verificar se o usuário é admin
            if (cd_permission === 2) {
                if (cd_health_unit === requestedHealthUnit) {
                    return next(); // Admin pode acessar qualquer módulo na sua unidade
                } else {
                    return res.status(403).json({ error: 'Acesso negado à unidade de saúde.' });
                }
            }

            // 3. Verificar se o usuário é manager
            if (cd_permission === 3) {
                if (cd_module === requestedModule && cd_health_unit === requestedHealthUnit) {
                    return next(); // Manager pode acessar apenas o módulo dentro da sua unidade
                } else {
                    return res.status(403).json({ error: 'Acesso negado ao módulo ou unidade de saúde.' });
                }
            }

            // 4. Caso contrário, negar acesso
            return res.status(403).json({ error: 'Acesso negado.' });
}

module.exports = checkAccess;
