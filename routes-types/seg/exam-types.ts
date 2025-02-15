interface ExamType {
    cd_sequence: number; // Identificador único do tipo de exame
    tp_exam: string; // Tipo de exame (ex.: 'blood_test', 'x_ray', 'ultrasound')
    ds_exam: string; // Descrição detalhada do tipo de exame
    is_active: number; // Indica se o tipo de exame está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
}

// Tipo para criar um novo tipo de exame
interface CreateExamType {
    cdSequence?: number; // Identificador único do tipo de exame (opcional)
    tpExam?: string; // Tipo de exame (obrigatório)
    dsExam?: string; // Descrição detalhada do tipo de exame (obrigatório)
    isActive?: number; // Indica se está ativo (1 = ativo, 0 = inativo) (opcional)
};
