// Interface principal para os departamentos
interface DepartmentType {
    cd_sequence: number; // Identificador único do departamento
    nm_department: string; // Nome do departamento (ex.: Emergência, Cirurgia)
    cd_user_registered: number | null; // Usuário responsável pelo cadastro
    cd_user_update: number | null; // Usuário responsável pelo cadastro
    ds_department: string | null; // Descrição do departamento (opcional)
    ds_location: string | null; // Localização do departamento (ex.: Andar 1, Bloco A)
    is_active: number; // Indica se o departamento está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
    
}

// Tipo para criação de um novo departamento
interface CreateDepartmentType {
    cdSequence?: number; // Identificador único do departamento
    nmDepartment?: string; // Nome do departamento (opcional)
    dsDepartment?: string; // Descrição do departamento (opcional)
    dsLocation?: string; // Localização do departamento (opcional)
    isActive?: number; // Indica se está ativo (1 = ativo, 0 = inativo) (opcional)
};

