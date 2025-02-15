// Interface principal para endereços de funcionários
interface AddressEmployeeType {
    cd_sequence: number; // Identificador único do endereço
    cd_employee: number | null; // ID do funcionário (pode ser nulo se não for associado a um funcionário)
    cd_user_registered: number; // ID do usuário que registrou o endereço
    sg_uf: string | null; // Sigla do estado (ex.: SP, RJ)
    ds_uf: string | null; // Nome do estado completo
    ds_zone: "urbana" | "rural"; // Zona de localização (urbana ou rural)
    ds_city: string | null; // Nome da cidade
    ds_neighborhood: string | null; // Nome do bairro
    ds_street: string | null; // Nome da rua
    cd_cep: number | null; // Código postal (CEP)
    nr_address: number | null; // Número do endereço
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (opcional)
    cd_user_update: number | null; // ID do usuário que atualizou o registro
    is_active: number; // Indica se o endereço está ativo (1 = ativo, 0 = inativo)
}

// Tipo para criação de um novo endereço
interface CreateAddressEmployeeType {
    cdEmployee?: number; // ID do funcionário (opcional)
    cdUserRegistered: number; // ID do usuário que registrou o endereço
    sgUf?: string; // Sigla do estado (opcional)
    dsUf?: string; // Nome do estado (opcional)
    dsZone: "urbana" | "rural"; // Zona de localização
    dsCity?: string; // Nome da cidade (opcional)
    dsNeighborhood?: string; // Nome do bairro (opcional)
    dsStreet?: string; // Nome da rua (opcional)
    cdCep?: number; // Código postal (CEP) (opcional)
    nrAddress?: number; // Número do endereço (opcional)
    isActive?: number; // Indica se está ativo (1 = ativo, 0 = inativo) (opcional)
};
