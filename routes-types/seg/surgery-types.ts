// Interface para os tipos de cirurgia
interface SurgeryType {
    cd_sequence: number; // Identificador único do tipo de cirurgia
    nm_surgery_type: string; // Nome do tipo de cirurgia (e.g., eletiva, emergência)
    ds_surgery_type: string | null; // Descrição detalhada do tipo de cirurgia
    is_active: boolean; // Indica se o tipo de cirurgia está ativo
    dt_created: string; // Data de criação do registro
    dt_updated: string | null; // Data da última atualização (nulo se nunca atualizado)
    cd_user_update: number | null; // ID do responsável pela última atualização
    cd_user_registered: number; // Usuário responsável pelo cadastro
}

// Interface para criar um novo tipo de cirurgia
interface CreateSurgeryType {
    cdSequence?: number; // Identificador único do tipo de cirurgia
    nmSurgeryType?: string; // Nome do tipo de cirurgia (opcional)
    dsSurgeryType?: string; // Descrição detalhada (opcional)
    isActive?: boolean; // Indica se o tipo de cirurgia está ativo (opcional)
}

