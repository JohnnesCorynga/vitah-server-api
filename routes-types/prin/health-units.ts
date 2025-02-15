interface HealthUnit {
    cd_sequence: number; // Identificador único da unidade de saúde
    cd_user_registered: number | null; // ID do responsável pela unidade (referência a tb_users)
    cd_user_update: number | null; // Usuário responsável pelo cadastro
    cd_unit_type: number; // Tipo da unidade (UBS, Hospital, etc.)
    nm_unit: string; // Nome da unidade de saúde
    nr_cnes: string; // CNES único da unidade
    email?: string | null; // E-mail da unidade (opcional)
    latitude: string; // Latitude da unidade de saúde
    longitude: string; // Longitude da unidade de saúde
    ds_zone: string; // Zona de localização (urbana ou rural)
    ds_uf?: string | null; // Nome completo do estado (opcional)
    ds_city?: string | null; // Nome da cidade (opcional)
    ds_neighborhood?: string | null; // Nome do bairro (opcional)
    ds_street?: string | null; // Nome da rua (opcional)
    nr_code_residence?: string | null; // Código único para o comprovante de residência (opcional)
    sg_uf?: string | null; // Sigla do estado (opcional)
    nr_cep?: number | null; // Código postal (CEP) (opcional)
    nr_address?: number | null; // Número do endereço (opcional)
    nr_phone?: string | null; // Número de telefone da unidade (opcional)
    is_active: number; // Status da unidade (ativa ou inativa) (1 = ativa, 0 = inativa)
    cd_segmento?: string | null; // Código do segmento da unidade de saúde (opcional)
    cd_area?: string | null; // Código da área dentro da unidade de saúde (opcional)
    cd_micro_area?: string | null; // Código da microárea dentro da unidade de saúde (opcional)
    dt_create: string; // Data de criação do registro
    dt_update?: string | null; // Data da última atualização (opcional)
}

interface CreateHealthUnit {
    cdSequence?:number; // Identificador único da unidade de saúde
    cdUnitType: number; // Tipo da unidade (obrigatório)
    nmUnit: string; // Nome da unidade de saúde (obrigatório)
    nrCnes: string; // CNES único da unidade (obrigatório)
    email?: string; // E-mail da unidade (opcional)
    latitude: string; // Latitude da unidade de saúde (obrigatório)
    longitude: string; // Longitude da unidade de saúde (obrigatório)
    dsZone: string; // Zona de localização (urbana ou rural) (obrigatório)
    dsUf?: string; // Nome completo do estado (opcional)
    dsCity?: string; // Nome da cidade (opcional)
    dsNeighborhood?: string; // Nome do bairro (opcional)
    dsStreet?: string; // Nome da rua (opcional)
    nrCodeResidence?: string; // Código único para o comprovante de residência (opcional)
    sgUf?: string; // Sigla do estado (opcional)
    nrCep?: number; // Código postal (CEP) (opcional)
    nrAddress?: number; // Número do endereço (opcional)
    nrPhone?: string; // Número de telefone da unidade (opcional)
    isActive?: number; // Status da unidade (ativa ou inativa) (1 = ativa, 0 = inativa) (opcional)
    cdSegmento?: string; // Código do segmento da unidade de saúde (opcional)
    cdArea?: string; // Código da área dentro da unidade de saúde (opcional)
    cdMicroArea?: string; // Código da microárea dentro da unidade de saúde (opcional)
};
