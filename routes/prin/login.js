require('dotenv').config();
const express = require('express');
const { getUserData, verifyPassword } = require('../../functions/functionsAll.js');
const { generateToken } = require('../../auth/auth.config.js');
const { logUserAccess } = require('../../functions/access.js');
const router = express.Router();

// Login route
router.post('/', async (req, res) => {
    try {
        const { dataLogin, dataPass } = req.body;
        let changePassFlag = false;
        console.log(dataLogin, dataPass, typeof dataLogin, typeof dataPass);

        if (!dataLogin || !dataPass) {
            return res.status(422).json({ message: 'Erro: dados incompletos!' });
        }

        // Obtendo dados do usuário
        const userData = await getUserData(dataLogin);

        console.log(userData,'USER DATA LOGIN');
        
        if (!userData) {
            return res.status(401).json({ message: 'Falha na autenticação! Usuário ou senha não confere!' });
        }

        // Verificando a senha
        const passwordMatch = await verifyPassword(dataPass, userData.pass_user);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Falha na autenticação! Usuário ou senha não confere!' });
        }

        if (dataPass === userData.nr_registration) {
            changePassFlag = true;
        }

        // Se a senha corresponder, gerar token e enviar para o cliente
        const plainData = {
            cdSequence: userData.cd_user,
            name: userData.nm_user,
            email: userData.email,
            position: userData.nm_position,
        }
        const plainDataUser = {
            personalData: plainData,
            permission:{
                cdPermission: userData.cd_permission,
                nmPermision: userData.nm_permission
            },
            module:{
                cdModule: userData.cd_module,
                tpModule: userData.tp_module
            },
            healthUnit:{
                cdHealthUnit: userData.cd_health_unit,
                nmHealthUnit: userData.nm_unit,
            }
        };

        // Registrar o acesso do usuário
        await logUserAccess(userData.cd_user, 'LOGIN');

        const token = await generateToken(plainData);
        // console.log(token);

        return res.status(200).json({
            message: "Autenticado com sucesso!",
            token: token,
            user : plainDataUser,
            changePassFlag
        });
    } catch (error) {
        return res.status(401).send({ message: "Falha na autenticação! " + error });
    }

});

// Logout route for users
router.post('/logout', async (req, res) => {
    try {
        const { cd_sequence } = req.user; // Assuming you send the user ID in the request body
        if (!cd_sequence) {
            return res.status(400).json({ message: 'Error: User not identified.' });
        }

        const SQL = 'UPDATE tb_seg_user_access SET dt_close = CURRENT_TIMESTAMP WHERE cd_user = $1 AND dt_close IS NULL';
        await queryDb(SQL, [cd_sequence]);
        return res.status(200).json({ message: 'Logout successful.' });
    } catch (error) {
        return res.status(500).json({ message: 'Logout error: ' + error });
    }
});

module.exports = router;
