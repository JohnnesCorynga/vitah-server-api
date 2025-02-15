// Interface principal para fornecedores
interface SupplierType {
    cd_sequence: number; // Identificador único do fornecedor
    cd_user_registered: number; // ID do usuário que registrou o fornecedor
    nm_supplier: string; // Nome do fornecedor
    nm_contact_person: string | null; // Nome da pessoa de contato (opcional)
    nr_phone: string | null; // Número de telefone (formato string para manter os caracteres especiais)
    nr_cnpj: string; // CNPJ do fornecedor (único)
    ds_address: string | null; // Endereço do fornecedor (opcional)
    ds_email: string | null; // Email do fornecedor (opcional)
    is_active: number; // Indica se o fornecedor está ativo (1 = ativo, 0 = inativo)
    dt_create: string; // Data de criação do registro
    dt_update: string | null; // Data da última atualização (pode ser nula se nunca foi atualizada)
    cd_user_update: number | null; // ID do usuário que atualizou o registro
}

// Tipo para criação de um novo fornecedor
interface CreateSupplierType {
    cdUserRegistered: number; // ID do usuário que registrou o fornecedor
    nmSupplier: string; // Nome do fornecedor
    nmContactPerson?: string; // Nome da pessoa de contato (opcional)
    nrPhone?: string; // Número de telefone (opcional)
    nrCnpj: string; // CNPJ do fornecedor (único)
    dsAddress?: string; // Endereço do fornecedor (opcional)
    dsEmail?: string; // Email do fornecedor (opcional)
    isActive?: number; // Indica se está ativo (1 = ativo, 0 = inativo) (opcional)
};
