const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const RateLimit = require('express-rate-limit');
const fs = require('fs');

// ROTAS TERCIARIAS
const routerTablesTercAll = require('./routes/terc/all.js');

// ROTAS SEGUNDARIAS
const routerConsultationTypes = require('./routes/seg/consultation-types.js');
const routerEmployeeTypes = require('./routes/seg/employee-types.js');
const routerExamTypes = require('./routes/seg/exam-types.js');
const routerMaintenanceTypes = require('./routes/seg/maintenance-types.js');
const routerPointStatus = require('./routes/seg/point-status.js');
const routerPrescriptionTypes = require('./routes/seg/prescription-types.js');
const routerShifts = require('./routes/seg/shifts.js');
const routerSpecialty = require('./routes/seg/specialty.js');
const routerWeightPerceptions = require('./routes/seg/weight-perceptions.js');
const routerSurgeryTypes = require('./routes/seg/surgery-types.js');
const routerSigtap = require('./routes/prin/sigtap.js');

// ROTAS ADMINISTRATIVAS

const routerPermissions = require('./routes/admin/permissions.js');
const routerModules = require('./routes/admin/modules.js');




// ROTAS PRIMARIAS
const routerLogin = require('./routes/prin/login.js');
const routerDepartments = require('./routes/prin/departments.js');
const routerHealthUnits = require('./routes/prin/health-units.js');
const routerPositions = require('./routes/prin/positions.js');
const routerEmployees = require('./routes/prin/employees.js');
const routerUsers = require('./routes/prin/users.js');
const routerHealthTeams = require('./routes/prin/health-teams.js');
const routerDoctors = require('./routes/prin/doctors.js');
const routerReports = require('./routes/prin/reports.js');
// falta as rotas de Notification
const routerSuppliers = require('./routes/prin/suppliers.js');
const routerAddressEmployees = require('./routes/prin/address-employees.js');
const routerWards = require('./routes/prin/wards.js');
const routerBlocks = require('./routes/prin/blocks.js');
const routerApartments = require('./routes/prin/apartments.js');
const routerBeds = require('./routes/prin/beds.js');
const routerPatients = require('./routes/prin/patients.js');
const routerEquipments = require('./routes/prin/equipments.js');
const routerTransport = require('./routes/prin/transport.js');
const routerServiceOrders = require('./routes/prin/service-orders.js');



const { authorizeToken } = require('./auth/auth.config.js');


// Middleware para lidar com CORS
app.use(cors({ decodeURIComponent: true, origin: '*' }));
app.use((req, res, next)=>{
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization")  
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET,POST, PUT")
  next()
})

app.use(morgan('dev'));
app.use(express.json());

// // Middleware para bloquear o acesso a diretórios específicos
// app.use((req, res, next) => {
//   // const forbiddenDirectories = ['/private', '/config']; // Diretórios proibidos
//   const forbiddenDirectories = ['/private', '/config']; // Diretórios proibidos
  
//   if (forbiddenDirectories.some(dir => req.url.startsWith(dir))) {
//     return res.status(403).send('Access to this directory is denied.');
//   }
  
//   next();
// });

// Rota específica para acessar arquivos da pasta uploads
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


const limiter = RateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'You have exceeded the limit of required in the API, your ip is bloqued.'
})
app.use(limiter)


app.get('/', (req, res) => {
  res.status(200).send('Welcome, In your API!');
});

// ROTAS TERCIARIAS
app.use("/terc/system", routerTablesTercAll)
// ROTAS SEGUNDARIAS
app.use("/seg/consultation-types", routerConsultationTypes);
app.use("/seg/employee-types", routerEmployeeTypes);
app.use("/seg/exam-types", routerExamTypes);
app.use("/seg/maintenance-types", routerMaintenanceTypes);
app.use("/seg/point-status", routerPointStatus);
app.use("/seg/prescription-types", routerPrescriptionTypes);
app.use("/seg/shifts", routerShifts);
app.use("/seg/specialty", routerSpecialty);
app.use("/seg/weight-perceptions", routerWeightPerceptions);
app.use("/seg/surgery-types", authorizeToken, routerSurgeryTypes);


// ROTAS ADMINISTRATIVAS
app.use("/module-admin/permission", routerPermissions);
app.use("/module-admin/modules", routerModules);




// ROTAS PRIMARIAS
app.use("/auth/login", routerLogin);

app.use("/prin/departments", authorizeToken, routerDepartments);
app.use("/prin/health-units", authorizeToken, routerHealthUnits);
app.use("/prin/positions", authorizeToken, routerPositions);
app.use("/prin/employees", authorizeToken, routerEmployees);
app.use("/prin/users", authorizeToken, routerUsers);
app.use("/prin/sigtap", authorizeToken, routerSigtap);
app.use("/prin/health-teams", authorizeToken, routerHealthTeams);
app.use("/prin/doctors", authorizeToken, routerDoctors);
app.use("/prin/reports", authorizeToken, routerReports);
// falta as rotas de Notification
app.use("/prin/reports", authorizeToken, routerReports);
app.use("/prin/suppliers", authorizeToken, routerSuppliers);
app.use("/prin/address-employees", authorizeToken, routerAddressEmployees);
app.use("/prin/wards", authorizeToken, routerWards);
app.use("/prin/blocks", authorizeToken, routerBlocks);
app.use("/prin/apartments", authorizeToken, routerApartments);
app.use("/prin/beds", authorizeToken, routerBeds);
app.use("/prin/patients", authorizeToken, routerPatients);
app.use("/prin/equipments", authorizeToken, routerEquipments);
app.use("/prin/transport", authorizeToken, routerTransport);
app.use("/prin/service-orders", authorizeToken, routerServiceOrders);



// Lidando com rotas não encontradas (404)
app.use((error, req, res, next) => {
  res.status(error.status || 500);
    return res.send({ message: error.message })
});

// app.use((req, res, next) => {
//     console.error("Erro é aqui");
//     const messageError = "Rota não encontrada"
//     const error = new Error();
//     return res.send({messageError, error})
//     next(error);
// });

module.exports = app;
