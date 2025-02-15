// Interface principal para os transportes
interface TransportType {
    cd_sequence: number; // Identificador único do transporte
    cd_status: number; // Status do transporte (Ocupado, Livre, Reservado)
    cd_user_registered: number; // ID do usuário que registrou a ordem (referência a tb_users)
    nm_vehicle: string; // Nome ou modelo do veículo
    nr_plate: string | null; // Placa do veículo (pode ser nula)
    nm_driver: string | null; // Nome do motorista (pode ser nulo)
    nr_driver_phone: string | null; // Telefone do motorista (pode ser nulo)
    cd_health_unit: number; // Unidade de saúde associada
    dt_create: string; // Data de criação do transporte
    dt_update: string | null; // Data da última atualização (pode ser nula)
    cd_user_update: number | null; // ID do responsável pela atualização (referência a tb_users)
}

// Tipo para criação de um novo transporte
interface CreateTransportType {
    cdSequence?: number; // Identificador único do transporte (opcional, gerado automaticamente)
    cdStatus: number; // Status do transporte (obrigatório)
    cdUserRegistered: number; // ID do usuário que registrou (obrigatório)
    nmVehicle: string; // Nome ou modelo do veículo (obrigatório)
    nrPlate?: string | null; // Placa do veículo (opcional)
    nmDriver?: string | null; // Nome do motorista (opcional)
    nrDriverPhone?: string | null; // Telefone do motorista (opcional)
    cdHealthUnit: number; // Unidade de saúde associada (obrigatório)
    cdUserUpdate?: number | null; // ID do responsável pela atualização (opcional)
}
