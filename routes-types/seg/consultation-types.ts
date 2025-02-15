// Interface para os dados de um tipo de consulta
interface ConsultationType {
    cd_sequence: number; // Identificador único do tipo de consulta
    nm_type: string; // Nome do tipo de consulta (ex.: diabetes, puericultura)
    ds_description: string | null; // Descrição detalhada do tipo de consulta (pode ser nula)
    is_active: number; // Indica se o tipo de consulta está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
}

// Tipo para criar um novo tipo de consulta
interface CreateConsultationType  {
    cdSequence?: number; // Identificador único do tipo de consulta (obrigatório)
    nmType?: string; // Nome do tipo de consulta (opcional)
    dsDescription?: string; // Descrição detalhada do tipo de consulta (opcional)
    isActive?: number; // Indica se está ativo (1 = ativo, 0 = inativo) (opcional)
};
