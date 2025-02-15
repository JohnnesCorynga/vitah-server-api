function formatInNumber(identifierNumber) {
    return String(identifierNumber).replace(/\D/g, '') || null; // Remove todos os caracteres que não são dígitos
}
// Função para verificar se é um CPF válido
function isValidCPF(cpf) {
    cpf = String(cpf).replace(/[^\d]+/g,'');
    if(cpf === '') return false;
    // Elimina CPFs invalidos conhecidos
    if (cpf.length !== 11 ||
        cpf === '00000000000' ||
        cpf === '11111111111' ||
        cpf === '22222222222' ||
        cpf === '33333333333' ||
        cpf === '44444444444' ||
        cpf === '55555555555' ||
        cpf === '66666666666' ||
        cpf === '77777777777' ||
        cpf === '88888888888' ||
        cpf === '99999999999') {
        return false;
    }
    // Valida 1o digito
    let add = 0;
    for (let i=0; i < 9; i ++) {
        add += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    // Valida 2o digito
    add = 0;
    for (let i = 0; i < 10; i ++) {
        add += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    return true;
};
function isValidCNPJ(cnpj) {
    cnpj = String(cnpj).replace(/[^\d]+/g,'');

    if(cnpj === '') return false;
    if (cnpj.length !== 14) return false;

    // Elimina CNPJs invalidos conhecidos
    if (cnpj === '00000000000000' ||
        cnpj === '11111111111111' ||
        cnpj === '22222222222222' ||
        cnpj === '33333333333333' ||
        cnpj === '44444444444444' ||
        cnpj === '55555555555555' ||
        cnpj === '66666666666666' ||
        cnpj === '77777777777777' ||
        cnpj === '88888888888888' ||
        cnpj === '99999999999999') {
        return false;
    }

    // Valida DVs
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0,tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0,tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(1))) return false;

    return true;
};
function isValidNIS(nis) {
    // Remove caracteres não numéricos
    nis = String(nis).replace(/\D/g, '');

    // Verifica se o NIS possui 11 dígitos
    if (nis.length !== 11) {
        return false;
    }

    // Faz a soma dos dígitos do NIS multiplicados pelos pesos correspondentes
    let total = 0;
    for (let i = 0; i < 10; i++) {
        total += parseInt(nis.charAt(i)) * (10 - i);
    }

    // Calcula o dígito verificador
    let mod = total % 11;
    let dv = mod < 2 ? 0 : 11 - mod;

    // Verifica se o último dígito do NIS é igual ao dígito verificador
    return parseInt(nis.charAt(10)) === dv;
};
function isValidTitle(tituloEleitor) {
    // Remove caracteres não numéricos
    tituloEleitor = tituloEleitor.replace(/\D/g, '');
    // Verifica se o título de eleitor possui 12 dígitos
    if (tituloEleitor.length !== 12) {
        return false;
    }

    // Extrai os dígitos de verificação
    const dv1 = parseInt(tituloEleitor.charAt(10));
    const dv2 = parseInt(tituloEleitor.charAt(11));

    // Calcula o primeiro dígito verificador
    let total = 0;
    for (let i = 0; i < 8; i++) {
        total += parseInt(tituloEleitor.charAt(i)) * (9 - i);
    }
    let resto = total % 11;
    const dv1Calculado = (resto === 10) ? 0 : resto;

    // Calcula o segundo dígito verificador
    total = 0;
    for (let i = 8; i < 10; i++) {
        total += parseInt(tituloEleitor.charAt(i)) * (11 - i);
    }
    total += dv1Calculado * 2;
    resto = total % 11;
    const dv2Calculado = (resto === 10) ? 0 : resto;

    // Verifica se os dígitos de verificação informados correspondem aos calculados
    return dv1 === dv1Calculado && dv2 === dv2Calculado;
}
function isValidTitle2(numero) {
   // Validar tamanho
   if (numero.length !== 12) {
    return false;
  }

  // Separar dígitos
  const digitos = numero.split("");

  // Validar dígitos verificadores
  const dv1 = digitos[11];
  const dv2 = digitos[10];

  const calculoDV1 = (
    digitos[0] * 2 +
    digitos[1] * 3 +
    digitos[2] * 4 +
    digitos[3] * 5 +
    digitos[4] * 6 +
    digitos[5] * 7 +
    digitos[6] * 8 +
    digitos[7] * 9
  ) % 11;

  const calculoDV2 = (
    calculoDV1 * 2 +
    digitos[0] * 3 +
    digitos[1] * 4 +
    digitos[2] * 5 +
    digitos[3] * 6 +
    digitos[4] * 7 +
    digitos[5] * 8 +
    digitos[6] * 9 +
    digitos[7] * 10
  ) % 11;

  if (dv1 !== String(calculoDV1) || dv2 !== String(calculoDV2)) {
    return false;
  }

  // Retornar true se todas as validações forem bem-sucedidas
  return true;
}

const generateUserNmUser = (fullName) => {
    const names = fullName.split(/\s+/); // Divide o nome completo em palavras
    if (names.length < 2) return fullName.replace(/\s+/g, '').toLowerCase(); // Se não houver dois nomes, usa o nome completo
    const firstTwoNames = names.slice(0, 2).join(''); // Pega os dois primeiros nomes e junta
    return firstTwoNames.toLowerCase(); // Retorna em minúsculas
};

module.exports = {
    formatInNumber,
    isValidCPF,
    isValidCNPJ,
    isValidNIS,
    isValidTitle,
    isValidTitle2,
    generateUserNmUser
}