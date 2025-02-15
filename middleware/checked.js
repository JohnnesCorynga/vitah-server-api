const { getPermissions } = require("../functions/functionsAll");

const checkPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            const userPermissions = await getPermissions();
            console.log(userPermissions)

            const cdUserRole = req.user?.cd_permission || 1;
            console.log(cdUserRole)
            if (!cdUserRole) {
                return res.status(403).json({ message: 'Acesso negado. Tipo de usuário não definido.' });
            }

            const permissions = userPermissions[cdUserRole];
            if (!Array.isArray(requiredPermissions)) {
                return res.status(500).json({ message: 'Erro interno do servidor: requiredPermissions deve ser um array.' });
            }

            // Verifica se pelo menos uma das permissões necessárias está na lista de permissões do usuário
            const hasPermission = requiredPermissions.some(permission => 
                permissions.includes('ALL') || permissions.includes(permission)
            );

            if (hasPermission) {
                return next();
            }

            return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para acessar esta rota.' });
        } catch (error) {
            return res.status(500).json({ message: 'Erro interno do servidor ao verificar permissões.' });
        }
    };
};

module.exports = {
    checkPermission
};
