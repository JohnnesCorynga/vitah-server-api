// Interface principal para os cargos
interface PositionType {
    cd_sequence: number; // Identificador único do cargo
    cd_department: number; // Identificador do departamento ao qual o cargo pertence
    nm_position: string; // Nome do cargo (exemplo: Médico, Enfermeiro)
    cd_user_registered: number | null; // Usuário responsável pelo cadastro
    cd_user_update: number | null; // Usuário responsável pelo cadastro
    ds_position: string | null; // Descrição do cargo (opcional)
    is_active: number; // Indica se o cargo está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do cargo
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizado)
}

// Tipo para criação de um novo cargo
interface CreatePositionType {
    cdSequence?:number;
    cdDepartment?: number; // Identificador do departamento ao qual o cargo pertence (opcional)
    nmPosition?: string; // Nome do cargo (opcional)
    dsPosition?: string; // Descrição do cargo (opcional)
};
