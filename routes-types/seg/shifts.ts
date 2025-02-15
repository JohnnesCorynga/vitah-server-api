interface Shift {
    cd_sequence: number; // Identificador único do turno
    tp_shift: string; // Tipo de turno (ex.: 'morning', 'afternoon', 'night')
    ds_shift: string; // Descrição detalhada do turno
    is_active: number; // Indica se o turno está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
}

// Tipo para criar um novo turno
interface CreateShift {
    cdSequence?: number; // Identificador único do turno (opcional)
    tpShift?: string; // Tipo de turno (obrigatório)
    dsShift?: string; // Descrição detalhada do turno (obrigatório)
    isActive?: number; // Indica se está ativo (1 = ativo, 0 = inativo) (opcional)
};
