// Interface para o Equipamento
interface Equipment {
    cd_sequence?: number; // Opcional para a criação, mas necessário na atualização
    nm_equipment: string; // Nome do equipamento
    ds_description?: string | null; // Descrição do equipamento
    cd_status: number; // Status do equipamento
    cd_health_unit: number; // Unidade de saúde associada
    ds_location: string; // Localização do equipamento
    nr_unic: string; // Número único de identificação (patrimônio)
    nr_serial?: string | null; // Número de série do equipamento
    nr_invoice?: string | null; // Nota fiscal associada
    nr_lot?: string | null; // Número do lote
    vl_value?: number | null; // Valor do equipamento
    dt_purchase?: string | null; // Data de aquisição
    dt_last_maintenance?: string | null; // Data da última manutenção
    dt_next_maintenance?: string | null; // Data prevista para a próxima manutenção
    cd_department?: number | null; // Departamento associado
    cd_supplier?: number | null; // Fornecedor do equipamento
    cd_user_registered: number; // ID do usuário que registrou
    cd_user_update?: number | null; // ID do usuário que atualizou
    dt_create?: string; // Data de criação
    dt_update?: string | null; // Data da última atualização
    is_active?: number; // Indica se o equipamento está ativo (1 - sim, 0 - não)
    is_deleted?: number; // Indica se o equipamento foi deletado (1 - sim, 0 - não)
}


interface CreateEquipment {
    nmEquipment: string;        // Nome do equipamento
    dsDescription: string | null; // Descrição do equipamento
    cdStatus: string;           // Status do equipamento (ex: "Ativo", "Inativo")
    dsLocation: string;         // Localização do equipamento (ex: "Sala 101")
    nrUnic: string;             // Número único de patrimônio
    nrSerial: string | null;    // Número de série do equipamento
    nrInvoice: string | null;   // Número da nota fiscal
    nrLot: string | null;       // Número do lote
    nmSupplier: string | null;  // Nome do fornecedor
    vlValue: number | null;     // Valor do equipamento
    dtPurchase: string | null;  // Data de compra (formato: "YYYY-MM-DD")
    dtLastMaintenance: string | null; // Data da última manutenção
    dtNextMaintenance: string | null; // Data da próxima manutenção
    cdDepartment: string;       // Código do departamento
    cdSupplier: string;         // Código do fornecedor
    cdHealthUnit: string;       // Código da unidade de saúde
    cdUserRegistered: string;   // Código do usuário que registrou
}

interface EquipmentUpdate extends CreateEquipment {
    cdSequence: number;         // Código do equipamento (para atualização)
    cdUserUpdate: string;       // Código do usuário que atualizou
}

