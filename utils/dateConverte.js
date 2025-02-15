const moment = require('moment');

function convertDateToDB(dateString) {
    return dateString ? moment(dateString, 'DD/MM/YYYY').format('YYYY-MM-DD') : null;
}

function convertDateToBR(dateString) {
    return dateString ? convertedDate = moment(dateString, 'YYYY-MM-DD').format('DD/MM/YYYY') : null;
}

module.exports = {
    convertDateToDB,
    convertDateToBR
};
