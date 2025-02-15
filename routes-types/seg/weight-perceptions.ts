// Interface para os dados de uma percepção de peso
interface WeightPerception {
    cd_sequence: number; // Identificador único da percepção de peso
    tp_weight_perception: string; // Tipo de percepção de peso (ex.: 'below_weight', 'adequate_weight', 'above_weight')
    ds_weight_perception: string; // Descrição detalhada da percepção de peso
    is_active: number; // Indica se o tipo está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
}

// Tipo para criar uma nova percepção de peso
interface CreateWeightPerception {
    cdSequence?: number; // Identificador único da percepção de peso (opcional)
    tpWeightPerception?: string; // Tipo de percepção de peso (obrigatório)
    dsWeightPerception?: string; // Descrição detalhada da percepção de peso (obrigatório)
    isActive?: number; // Indica se está ativo (1 = ativo, 0 = inativo) (opcional)
};
