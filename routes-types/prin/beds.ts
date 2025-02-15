// Interface para o leito
export interface Bed {
    cd_sequence: number;         // Identificador único do leito
    cd_user_registered: number;  // Usuário responsável pelo cadastro
    nm_bed: string;              // Nome ou número do leito
    cd_apartment?: number;       // Apartamento associado ao leito (opcional)
    cd_bed_type: string;         // Tipo de leito (Internação, Atendimento, etc.)
    cd_status: number;           // Status do leito (Ocupado, Livre, Reservado)
    cd_patient?: number;         // Paciente associado ao leito (caso esteja ocupado)
    dt_create: string;           // Data de criação (timestamp)
    dt_update?: string;          // Data da última atualização (timestamp, opcional)
    cd_user_update?: number;     // ID do responsável pela unidade (referência a tb_prin_users)
}

// Interface para os status do leito
export interface BedStatus {
    cd_sequence: number;         // Identificador único do status
    nm_status: string;           // Nome do status (Ocupado, Livre, Reservado)
}

// Interface para usuários
export interface User {
    cd_sequence: number;         // Identificador único do usuário
    nm_user: string;             // Nome do usuário
}

// Interface para paciente
export interface Patient {
    cd_sequence: number;         // Identificador único do paciente
    nm_patient: string;          // Nome do paciente
}

// Interface para o tipo de leito
export interface BedType {
    cd_sequence: number;         // Identificador único do tipo de leito
    nm_bed_type: string;         // Nome do tipo de leito
}

// Interface para o apartamento
export interface Apartment {
    cd_sequence: number;         // Identificador único do apartamento
    nm_apartment: string;        // Nome ou número do apartamento
}
