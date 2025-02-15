// Interface para os dados de um tipo de manutenção
interface MaintenanceType {
    cd_sequence: number; // Identificador único do tipo de manutenção
    tp_maintenance: string; // Descrição do tipo de manutenção (ex.: Reparação, Revisão)
    is_active: number; // Indica se o tipo de manutenção está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
}

// Tipo para criar um novo tipo de manutenção
interface CreateMaintenanceType {
    cdSequence?: number; // Identificador único do tipo de manutenção (opcional)
    tpMaintenance?: string; // Descrição do tipo de manutenção (obrigatório)
    isActive?: number; // Indica se está ativo (1 = ativo, 0 = inativo) (opcional)
};
