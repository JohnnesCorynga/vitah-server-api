interface Specialty {
    cd_sequence: number; // Identificador único da especialidade
    value_queries: number; // Valor associado a consultas
    nm_specialty: string; // Nome da especialidade
    ds_specialty: string; // Descrição da especialidade
    is_active:boolean;
    dt_create: string; // Data de criação
    dt_update: string | null; // Data de última atualização (pode ser nula se nunca foi atualizada)
}
interface CreateSpecialty {
    cdSequence?: number; // Identificador único da especialidade
    valueQueries: number; // Valor associado a consultas
    nmSpecialty: string; // Nome da especialidade
    dsSpecialty: string; // Descrição da especialidade
    isActive: boolean;
}
