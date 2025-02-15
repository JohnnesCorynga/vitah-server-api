// Interface principal para os funcionários
interface EmployeeType {
    cd_sequence: number; // Identificador único do funcionário
    cd_department: number; // Código do departamento
    cd_health_unit: number; // Código da unidade de saúde
    cd_position: number; // Código da posição/função
    cd_user_registered: number | null; // Usuário responsável pelo cadastro
    cd_user_update: number | null; // Usuário responsável pelo cadastro
    nr_registration:number;//matricula do funcionario
    nm_full: string; // Nome completo do funcionário
    nm_scial: string | null; // Nome social (opcional)
    ds_photo: string | null; // URL da foto (opcional)
    nr_cpf: string; // CPF do funcionário
    nr_rg: string | null; // RG do funcionário (opcional)
    dt_birth: string | null; // Data de nascimento (opcional)
    nr_phone: string | null; // Número de telefone (opcional)
    email: string | null; // Email do funcionário (opcional)
    tp_gender: string | null; // Gênero (opcional)
    dt_admission: string; // Data de admissão
    is_active: number; // Indica se o funcionário está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
}

  interface UserType {
    cd_sequence: number; // Identificador único do usuário
    cd_employee: number; // Referência ao funcionário
    cd_permission: number; // Permissão do usuário
    cd_module: number; // Módulo associado ao usuário
    cd_user_registered: number | null; // Usuário responsável pelo cadastro
    cd_user_update: number | null; // Usuário responsável pelo cadastro
    is_active: number; // 1 = ativo, 0 = inativo
    nm_user: string; // Nome de usuário
    pass_user: string; // Senha do usuário
    dt_create: string; // Data de criação (ISO string format)
    dt_update: string | null; // Data da última atualização (ISO string format)
  }
  
  interface UserEmployeeJoin {
    user: UserType;
    employee: EmployeeType | null; // Pode ser null em caso de LEFT JOIN sem correspondência
  }
  

// Tipo para criação de um novo funcionário
interface CreateEmployeeType {
    cdSequence: number; // Código único do funcionário (obrigatório)
    cdDepartment?: number; // Código do departamento (opcional)
    cdHealthUnit?: number; // Código da unidade de saúde (opcional)
    nrRegistration?:number;//matricula do funcionario
    cdPosition?: number; // Código da posição/função (opcional)
    nmFull?: string; // Nome completo do funcionário (opcional)
    nmSocial?: string; // Nome social (opcional)
    dsPhoto?: string; // URL da foto (opcional)
    nrCpf?: string; // CPF do funcionário (opcional)
    nrRg?: string; // RG do funcionário (opcional)
    dtBirth?: string; // Data de nascimento (opcional)
    nrPhone?: string; // Número de telefone (opcional)
    email?: string; // Email do funcionário (opcional)
    tpGender?: string; // Gênero (opcional)
    dtAdmission?: string; // Data de admissão (opcional)
    isActive?: number; // Indica se o funcionário está ativo (1 = ativo, 0 = inativo) (opcional)
};
// Tipagem para a criação de um novo usuário
interface CreateUserType {
  cdSequence?: number;      // Código do Funcionário (obrigatório)
  cdEmployee: number;      // Código do Funcionário (obrigatório)
  cdModule: number;        // Código do Módulo (obrigatório)
  nmUser: string;          // Nome de Usuário (obrigatório)
  passUser: string;        // Senha do Usuário (obrigatório)
  passUserConfirm: string; // Confirmação da Senha (obrigatório)
}

