interface Priority {
    cd_sequence: number; // Identificador único da prioridade
    tp_priority: string; // Descrição da prioridade
}
interface StatusOS {
    cd_sequence: number; // Identificador único do status
    tp_status: string; // Descrição do status
}
interface Disability {
    cd_sequence: number; // Identificador único do tipo de deficiência
    cd_cid: string; // Código CID da deficiência
    tp_disability: string; // Tipo de deficiência
}
interface Race {
    cd_sequence: number; // Identificador único da raça
    tp_race: string; // Nome da raça
}
interface Ethnicity {
    cd_sequence: number; // Identificador único da etnia
    tp_ethnicity: string; // Nome da etnia
}
interface EducationLevel {
    cd_sequence: number; // Identificador único do nível de escolaridade
    tp_education_level: string; // Nome do nível de escolaridade
}
interface BloodType {
    cd_sequence: number; // Identificador único do tipo sanguíneo
    tp_blood: string; // Tipo sanguíneo (ex: A+, O-)
}
interface NotificationType {
    cd_sequence: number; // Identificador único do tipo de notificação
    tp_notification: string; // Tipo de notificação (ex: ALERTA, MENSAGEM)
    ds_notification: string; // Descrição do tipo de notificação
}
interface PermissionType {
    cd_sequence: number; // Identificador único do tipo de permissão
    tp_permissions: string; // Tipo de permissão (ex: Admin, Médico)
    ds_permissions: string; // Descrição da permissão
}
interface StatusQuery {
    cd_sequence: number; // Identificador único do status da consulta
    tp_status: string; // Nome do status da consulta (ex: Agendado, Cancelado)
    ds_status: string; // Descrição do status da consulta
}
interface StatusCommunication {
    cd_sequence: number; // Identificador único do status de comunicação
    tp_status: string; // Nome do status (ex: sent, failed)
    ds_status: string; // Descrição do status
}
interface AdminRoute {
    cd_sequence: number; // Identificador único da via de administração
    tp_route: string; // Tipo de via de administração (ex: oral, intravenosa)
}
interface EquipmentStatus {
    cd_sequence: number; // Identificador único do status do equipamento
    tp_status: string; // Descrição do status (ex: Ocupado, Livre)
}
interface SurgeryStatus {
    cd_sequence: number; // Identificador único do status da cirurgia
    tp_status: string; // Tipo de status (ex: Agendada, Em andamento)
    ds_surgery_status: string; // Descrição detalhada do status da cirurgia
}
interface Integration {
    cd_sequence: number; // Identificador único da integração
    cd_user_registered: number; // ID do responsável pela integração
    nm_api: string; // Nome da API integrada
    tp_status: string | null; // Status da execução da integração
    ds_message: string | null; // Mensagem de erro ou sucesso
    dt_execution: string; // Data de execução da integração
    dt_create: string; // Data de criação
    dt_update: string | null; // Data de última atualização
}
interface Integration {
    cd_sequence: number; // Identificador único da integração
    cd_user_registered: number; // ID do responsável pela integração
    nm_api: string; // Nome da API integrada
    tp_status: string | null; // Status da execução da integração
    ds_message: string | null; // Mensagem de erro ou sucesso
    dt_execution: string; // Data de execução da integração
    dt_create: string; // Data de criação
    dt_update: string | null; // Data de última atualização
}
interface UnitType {
    cd_sequence: number; // Identificador único do tipo de unidade
    tp_unit: string; // Tipo da unidade (ex: UBS, Hospital)
    ds_unit_type: string; // Descrição do tipo de unidade
    is_active: number; // Indica se o tipo está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do tipo
    dt_update: string | null; // Data da última atualização
}
