interface PointStatus {
    cd_sequence: number; // Identificador único do status de ponto
    tp_status: string; // Tipo de status de ponto (ex.: 'present', 'absent', 'on_leave')
    ds_status: string; // Descrição detalhada do status de ponto
    is_active: number; // Indica se o status está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
}

// Tipo para criar um novo status de ponto
interface CreatePointStatus {
    cdSequence?: number; // Identificador único do status de ponto (opcional)
    tpStatus?: string; // Tipo de status de ponto (obrigatório)
    dsStatus?: string; // Descrição detalhada do status de ponto (obrigatório)
    isActive?: number; // Indica se está ativo (1 = ativo, 0 = inativo) (opcional)
};
