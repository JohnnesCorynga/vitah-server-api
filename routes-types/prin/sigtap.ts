// Interface para os procedimentos SIGTAP
interface Procedure {
    cd_sequence: number; // Identificador único do procedimento
    cd_procedure: string; // Código do procedimento
    ds_procedure: string; // Descrição do procedimento
    ds_complexity: string | null; // Complexidade do procedimento (pode ser nula)
    funding_type: string | null; // Tipo de financiamento (pode ser nulo)
    procedure_cost: number | null; // Custo do procedimento (pode ser nulo)
    cd_user_registered: number; // ID do usuário responsável pelo cadastro
    cd_user_update: number | null; // ID do usuário responsável pela última atualização (pode ser nulo)
    dt_created: string; // Data de criação do registro
    dt_updated: string | null; // Data da última atualização (pode ser nula)
}

// Interface para criar um novo procedimento SIGTAP
interface CreateProcedure {
    cdProcedure?: string; // Código do procedimento (opcional)
    dsProcedure?: string; // Descrição do procedimento (opcional)
    dsComplexity?: string | null; // Complexidade do procedimento (opcional)
    fundingType?: string | null; // Tipo de financiamento (opcional)
    procedureCost?: number | null; // Custo do procedimento (opcional)
    cdUserRegistered?: number; // ID do usuário responsável pelo cadastro
    cdUserUpdate?: number | null; // ID do usuário responsável pela última atualização (opcional)
}
