interface PrescriptionType {
    cd_sequence: number; // Identificador único do tipo de prescrição
    nm_type: string; // Nome do tipo de prescrição (ex.: Medicamento, Dieta, Exame)
    ds_description: string | null; // Descrição detalhada do tipo de prescrição (pode ser nula)
    is_active: number; // Indica se o tipo de prescrição está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
}
type CreatePrescriptionType = {
    cdSequence?: number; // Identificador único do tipo de prescrição (obrigatório)
    nmType?: string; // Nome do tipo de prescrição (opcional)
    dsDescription?: string; // Descrição detalhada do tipo de prescrição (opcional)
    isActive?: number; // Indica se está ativo (1 = ativo, 0 = inativo) (opcional)
};
