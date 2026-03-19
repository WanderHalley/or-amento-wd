/**
 * clientes.js — CRUD de Clientes
 * Parsing da API trata múltiplos formatos de resposta
 * Compatível com campo cpf_cnpj E cnpj_cpf (banco antigo/novo)
 *
 * IDs esperados no HTML:
 *   tabelaClientes, buscaCliente,
 *   modalCliente, modalClienteTitulo, formCliente,
 *   clienteId, clienteNome, clienteEmpresa, clienteCpfCnpj,
 *   clienteTelefone, clienteEmail, clienteEndereco,
 *   clienteCidade, clienteEstado, clienteCep,
 *   confirmDeleteCliente
 */

// ========== ESTADO LOCAL ==========
let clientesData = [];
let deleteClienteId = null;

// ========== HELPER: extrair array da resposta da API ==========
function extrairArrayClientes(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.clientes && Array.isArray(data.clientes)) return data.clientes;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initTheme === 'function') initTheme();
    if (typeof initSidebar === 'function') initSidebar();
    if (typeof updateThemeIcon === 'function') updateThemeIcon();

    aplicarMascarasCliente();
    carregarClientes();
});

/**
 * Aplica máscaras de formatação nos campos do formulário
 */
function aplicarMascarasCliente() {
    const telInput = document.getElementById('clienteTelefone');
    const cepInput = document.getElementById('clienteCep');
    const cpfCnpjInput = document.getElementById('clienteCpfCnpj');

    if (telInput && typeof formatPhone
