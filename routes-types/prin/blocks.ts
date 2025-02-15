// Interface principal para os blocos
interface BlockType {
    cd_sequence: number; // Identificador único do bloco
    cd_user_registered: number; // Usuário responsável pelo cadastro
    nm_block: string; // Nome do bloco
    cd_ward: number; // Ala associada ao bloco
    dt_create: string; // Data de criação do bloco
    dt_update: string | null; // Data da última atualização (pode ser nula)
    cd_user_update: number | null; // Usuário que atualizou o registro
}

// Tipo para criação de um novo bloco
interface CreateBlockType {
    cdSequence?: number; // Identificador único do bloco (opcional, pois pode ser gerado automaticamente)
    nmBlock?: string; // Nome do bloco (opcional)
    cdWard?: number; // Ala associada ao bloco (obrigatório)
    cdUserRegistered?: number; // Usuário responsável pelo cadastro (opcional)
    cdUserUpdate?: number; // Usuário responsável pela atualização (opcional)
};
