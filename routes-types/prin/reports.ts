// Tipo para os relatórios principais
interface MainReport {
    cdSequence: number; // Identificador único do relatório
    cdUserRegistered: number; // ID do responsável pelo relatório
    nmReport: string; // Nome do relatório
    dsData: string; // Dados do relatório
    dtGeneration: string; // Data de geração do relatório
    dtCreate: string; // Data de criação do relatório
    dtUpdate?: string | null; // Data da última atualização (opcional)
    cdUserUpdate?: number | null; // ID do responsável pela última atualização (opcional)
}

// Tipo para criar um novo relatório principal
interface CreateMainReport {
    cdUserRegistered: number; // ID do responsável pelo relatório
    nmReport: string; // Nome do relatório
    dsData: string; // Dados do relatório
    cdUserUpdate?: number | null; // ID do responsável pela última atualização (opcional)
}
