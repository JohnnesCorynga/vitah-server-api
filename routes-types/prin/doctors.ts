// Interface para a tabela de médicos
interface Doctor {
    cd_sequence: number; // Identificador único do médico
    cd_employee: number; // Identificador único do servidor/funcionário
    cd_specialty: string; // Especialidade do médico
    cd_user_registered: number; // ID do usuário que registrou o médico
    nr_crm: string; // CRM único do médico
    pass_doctor: string; // Senha do médico
    days_availability: string | null; // Dias da semana disponíveis em formato JSON (pode ser nulo)
    is_active: boolean; // Indica se o médico está ativo
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula)
    cd_user_update: number | null; // ID do responsável pela última atualização (pode ser nulo)
}

// Interface para criar um novo médico
interface CreateDoctor {
    cdSequence: number; // Identificador único do médico
    cdEmployee: number; // Identificador único do servidor/funcionário
    cdSpecialty: string; // Especialidade do médico
    cdUserRegistered: number; // ID do usuário que registrou o médico
    nrCrm: string; // CRM único do médico
    passDoctor: string; // Senha do médico
    daysAvailability?: string | null; // Dias da semana disponíveis em formato JSON (opcional)
    isActive?: boolean; // Indica se o médico está ativo (opcional, padrão: true)
    dtUpdate?: string | null; // Data da última atualização (opcional)
    cdUserUpdate?: number | null; // ID do responsável pela última atualização (opcional)
}


