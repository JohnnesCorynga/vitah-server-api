// Interface para a tabela de Alas (Wards)
interface WardType {
    cd_sequence: number; // Identificador único da ala
    cd_health_unit: number; // Unidade de saúde associada
    cd_user_registered: number | null; // Usuário responsável pelo cadastro
    nm_ward: string; // Nome da ala
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
    cd_user_update: number | null; // ID do usuário que realizou a última atualização
}

// Tipo para criação de uma nova Ala
interface CreateWardType {
    cdSequence?: number; // Identificador único da ala (opcional)
    cdHealthUnit: number; // Unidade de saúde associada (obrigatório)
    cdUserRegistered?: number; // Usuário responsável pelo cadastro (opcional)
    nmWard: string; // Nome da ala (obrigatório)
}
