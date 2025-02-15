// Tipo para os dados da equipe de saúde
interface HealthTeam {
    cd_sequence: number; // Identificador único da equipe de saúde
    cd_health_unit: number; // Unidade de saúde associada
    cd_user_responsible: number; // Código do responsável pela equipe
    cd_user_registered: number; // Código do usuário responsável pelo cadastro
    cd_department: number | null; // Tipo de equipe (ACS, ESF, etc.)
    cds_user_team: number[]; // IDs dos servidores/funcionários dessa equipe
    nm_team: string; // Nome da equipe de saúde
    ds_area: string; // Descrição da área de cobertura da equipe
    cd_area: string; // Código da área de atuação
    cd_segment: string; // Código do segmento da equipe
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização
    cd_user_update: number | null; // ID do responsável pela atualização
    is_active:number;
}

// Tipo para criar uma nova equipe de saúde
interface CreateHealthTeam {
    cdSequence: number; // Identificador único da equipe de saúde (obrigatório)
    cdHealthUnit: number; // Unidade de saúde associada
    cdUserResponsible: number; // Código do responsável pela equipe
    cdUserRegistered: number; // Código do usuário responsável pelo cadastro
    cdDepartment?: number | null; // Tipo de equipe (ACS, ESF, etc.)
    cdsUserTeam?: number[]; // IDs dos servidores/funcionários dessa equipe (opcional)
    nmTeam: string; // Nome da equipe de saúde
    dsArea: string; // Descrição da área de cobertura da equipe
    cdArea: string; // Código da área de atuação
    cdSegment: string; // Código do segmento da equipe
    cdUserUpdate?: number | null; // ID do responsável pela atualização (opcional)
}


