interface EmployeeType {
    cd_sequence: number; // Identificador único do tipo de funcionário
    tp_employee: string; // Tipo de funcionário (ex.: médico, enfermeiro, administrativo)
    is_active: number; // Indica se o tipo de funcionário está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
}

type CreateEmployeeType = {
    cdSequence?: number; // Identificador único do tipo de funcionário (opcional)
    tpEmployee?: string; // Tipo de funcionário (opcional)
    isActive?: number; // Indica se está ativo (1 = ativo, 0 = inativo) (opcional)
};
