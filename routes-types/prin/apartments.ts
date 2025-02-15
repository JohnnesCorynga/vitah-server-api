// Interface principal para os apartamentos
interface ApartmentType {
    cd_sequence: number; // Identificador único do apartamento
    cd_user_registered: number; // Usuário responsável pelo cadastro
    nm_apartment: string | null; // Nome do apartamento (pode ser nulo)
    cd_block: number; // Bloco associado ao apartamento
    dt_create: string; // Data de criação do apartamento
    dt_update: string | null; // Data da última atualização (pode ser nula)
    cd_user_update: number | null; // ID do responsável pela unidade (referência a tb_users)
}

// Tipo para criação de um novo apartamento
interface CreateApartmentType {
    cdSequence?: number; // Identificador único do apartamento (opcional, gerado automaticamente)
    cdUserRegistered?: number; // Usuário responsável pelo cadastro (opcional)
    nmApartment?: string; // Nome do apartamento (opcional)
    cdBlock: number; // Bloco associado ao apartamento (obrigatório)
    cdUserUpdate?: number | null; // ID do responsável pela unidade (opcional)
}
