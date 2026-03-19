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
/**
 * A API pode retornar em vários formatos:
 *   { clientes: [...] }              — formato padrão
 *   { success: true, data: [...] }   — formato alternativo
 *   [...]                            — array direto
 *
 * Esta função extrai o array independente do formato.
 */
function extrairArrayClientes(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.clientes && Array.isArray(data.clientes)) return data.clientes;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    // Tema e sidebar são inicializados pelo app.js
    if (typeof initTheme === 'function') initTheme();
    if (typeof initSidebar === 'function') initSidebar();
    if (typeof updateThemeIcon === 'function') updateThemeIcon();

    // Aplicar máscaras nos campos do modal
    aplicarMascarasCliente();

    // Carregar clientes
    carregarClientes();
});

/**
 * Aplica máscaras de formatação nos campos do formulário
 */
function aplicarMascarasCliente() {
    const telInput = document.getElementById('clienteTelefone');
    const cepInput = document.getElementById('clienteCep');
    const cpfCnpjInput = document.getElementById('clienteCpfCnpj');

    if (telInput && typeof formatPhone === 'function') {
        telInput.addEventListener('input', function () {
            this.value = formatPhone(this.value);
        });
    }
    if (cepInput && typeof formatCEP === 'function') {
        cepInput.addEventListener('input', function () {
            this.value = formatCEP(this.value);
        });
    }
    if (cpfCnpjInput && typeof formatCPFCNPJ === 'function') {
        cpfCnpjInput.addEventListener('input', function () {
            this.value = formatCPFCNPJ(this.value);
        });
    }
}

// ========== CARREGAR CLIENTES ==========
async function carregarClientes(busca = '') {
    const tbody = document.getElementById('tabelaClientes');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">
                <div class="loading-spinner"></div>
                <p>Carregando...</p>
            </td>
        </tr>`;

    try {
        let url = '/api/clientes?limit=200';
        if (busca) url += `&busca=${encodeURIComponent(busca)}`;

        const data = await apiGet(url);
        clientesData = extrairArrayClientes(data);

        console.log('[Clientes] Carregados:', clientesData.length);
        renderizarClientes(clientesData);

    } catch (error) {
        console.error('[Clientes] Erro ao carregar:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <p>Erro ao carregar clientes.</p>
                </td>
            </tr>`;
        showToast('Erro ao carregar clientes', 'error');
    }
}

// ========== RENDERIZAR TABELA ==========
function renderizarClientes(clientes) {
    const tbody = document.getElementById('tabelaClientes');
    if (!tbody) return;

    if (!clientes || clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <p>Nenhum cliente encontrado.</p>
                    <button class="btn btn-primary btn-sm" onclick="abrirModalCliente()" style="margin-top:10px;">+ Adicionar cliente</button>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = clientes.map(c => {
        const nome = escapeHtml(c.nome || '-');
        const empresa = escapeHtml(c.empresa || '-');

        // Telefone: formata se a função existir
        const telefoneRaw = c.telefone || '';
        const telefone = telefoneRaw
            ? (typeof formatPhone === 'function' ? formatPhone(telefoneRaw) : telefoneRaw)
            : '-';

        const email = escapeHtml(c.email || '-');

        // Cidade/UF
        const cidade = c.cidade || '';
        const estado = c.estado || '';
        const local = cidade && estado
            ? `${escapeHtml(cidade)}/${escapeHtml(estado)}`
            : escapeHtml(cidade || estado || '-');

        return `
            <tr>
                <td><strong>${nome}</strong></td>
                <td>${empresa}</td>
                <td>${telefone}</td>
                <td>${email}</td>
                <td>${local}</td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button class="btn btn-outline btn-sm" onclick="editarCliente('${c.id}')" title="Editar">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmarDeleteCliente('${c.id}')" title="Excluir">🗑️</button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

// ========== BUSCA COM DEBOUNCE ==========
const buscarClientesDebounced = typeof debounce === 'function'
    ? debounce(() => {
        const buscaInput = document.getElementById('buscaCliente');
        const busca = buscaInput ? buscaInput.value : '';
        carregarClientes(busca);
    }, 400)
    : function () {
        const buscaInput = document.getElementById('buscaCliente');
        const busca = buscaInput ? buscaInput.value : '';
        carregarClientes(busca);
    };

// ========== MODAL: ABRIR/FECHAR ==========
function abrirModalCliente() {
    const titulo = document.getElementById('modalClienteTitulo');
    const form = document.getElementById('formCliente');
    const idInput = document.getElementById('clienteId');
    const modal = document.getElementById('modalCliente');

    if (titulo) titulo.textContent = 'Novo Cliente';
    if (form) form.reset();
    if (idInput) idInput.value = '';
    if (modal) modal.classList.add('active');
}

function fecharModalCliente() {
    const modal = document.getElementById('modalCliente');
    const form = document.getElementById('formCliente');
    const idInput = document.getElementById('clienteId');

    if (modal) modal.classList.remove('active');
    if (form) form.reset();
    if (idInput) idInput.value = '';
}

// ========== EDITAR CLIENTE ==========
async function editarCliente(id) {
    try {
        const response = await apiGet(`/api/clientes/${id}`);
        // Compatível: pode vir direto ou dentro de { data: {...} }
        const cliente = response.data || response;

        console.log('[Clientes] Editando:', cliente);

        const titulo = document.getElementById('modalClienteTitulo');
        if (titulo) titulo.textContent = 'Editar Cliente';

        const idInput = document.getElementById('clienteId');
        if (idInput) idInput.value = cliente.id;

        const nomeInput = document.getElementById('clienteNome');
        if (nomeInput) nomeInput.value = cliente.nome || '';

        const empresaInput = document.getElementById('clienteEmpresa');
        if (empresaInput) empresaInput.value = cliente.empresa || '';

        // Compatível com cpf_cnpj (schema novo) E cnpj_cpf (schema antigo)
        const cpfCnpjInput = document.getElementById('clienteCpfCnpj');
        const cpfCnpjValue = cliente.cpf_cnpj || cliente.cnpj_cpf || '';
        if (cpfCnpjInput) {
            cpfCnpjInput.value = cpfCnpjValue
                ? (typeof formatCPFCNPJ === 'function' ? formatCPFCNPJ(cpfCnpjValue) : cpfCnpjValue)
                : '';
        }

        const telInput = document.getElementById('clienteTelefone');
        if (telInput) {
            telInput.value = cliente.telefone
                ? (typeof formatPhone === 'function' ? formatPhone(cliente.telefone) : cliente.telefone)
                : '';
        }

        const emailInput = document.getElementById('clienteEmail');
        if (emailInput) emailInput.value = cliente.email || '';

        const enderecoInput = document.getElementById('clienteEndereco');
        if (enderecoInput) enderecoInput.value = cliente.endereco || '';

        const cidadeInput = document.getElementById('clienteCidade');
        if (cidadeInput) cidadeInput.value = cliente.cidade || '';

        const estadoInput = document.getElementById('clienteEstado');
        if (estadoInput) estadoInput.value = cliente.estado || '';

        const cepInput = document.getElementById('clienteCep');
        if (cepInput) {
            cepInput.value = cliente.cep
                ? (typeof formatCEP === 'function' ? formatCEP(cliente.cep) : cliente.cep)
                : '';
        }

        const modal = document.getElementById('modalCliente');
        if (modal) modal.classList.add('active');

    } catch (error) {
        console.error('[Clientes] Erro ao carregar cliente para edição:', error);
        showToast('Erro ao carregar dados do cliente', 'error');
    }
}

// ========== SALVAR CLIENTE ==========
async function salvarCliente(event) {
    event.preventDefault();

    const idInput = document.getElementById('clienteId');
    const id = idInput ? idInput.value : '';

    const nomeInput = document.getElementById('clienteNome');
    const nome = nomeInput ? nomeInput.value.trim() : '';

    // Validação
    if (!nome) {
        showToast('O nome do cliente é obrigatório', 'warning');
        return;
    }

    // Ler todos os campos do formulário
    const empresaInput = document.getElementById('clienteEmpresa');
    const cpfCnpjInput = document.getElementById('clienteCpfCnpj');
    const telInput = document.getElementById('clienteTelefone');
    const emailInput = document.getElementById('clienteEmail');
    const enderecoInput = document.getElementById('clienteEndereco');
    const cidadeInput = document.getElementById('clienteCidade');
    const estadoInput = document.getElementById('clienteEstado');
    const cepInput = document.getElementById('clienteCep');

    // Função para remover máscara (só dígitos)
    const unmask = typeof unmaskValue === 'function'
        ? unmaskValue
        : function (v) { return v ? v.replace(/\D/g, '') : ''; };

    const dados = {
        nome: nome,
        empresa: empresaInput ? empresaInput.value.trim() || null : null,
        cpf_cnpj: cpfCnpjInput ? unmask(cpfCnpjInput.value) || null : null,
        telefone: telInput ? unmask(telInput.value) || null : null,
        email: emailInput ? emailInput.value.trim() || null : null,
        endereco: enderecoInput ? enderecoInput.value.trim() || null : null,
        cidade: cidadeInput ? cidadeInput.value.trim() || null : null,
        estado: estadoInput ? estadoInput.value || null : null,
        cep: cepInput ? unmask(cepInput.value) || null : null,
    };

    console.log('[Clientes] Salvando:', dados);

    try {
        if (id) {
            // Atualizar cliente existente
            await apiPut(`/api/clientes/${id}`, dados);
            showToast('Cliente atualizado com sucesso!', 'success');
        } else {
            // Criar novo cliente
            await apiPost('/api/clientes', dados);
            showToast('Cliente criado com sucesso!', 'success');
        }

        fecharModalCliente();
        carregarClientes();

    } catch (error) {
        console.error('[Clientes] Erro ao salvar:', error);
        showToast(`Erro ao salvar cliente: ${error.message}`, 'error');
    }
}

// ========== DELETAR CLIENTE ==========
function confirmarDeleteCliente(id) {
    deleteClienteId = id;
    const modal = document.getElementById('confirmDeleteCliente');
    if (modal) modal.classList.add('active');
}

function fecharConfirmDeleteCliente() {
    deleteClienteId = null;
    const modal = document.getElementById('confirmDeleteCliente');
    if (modal) modal.classList.remove('active');
}

async function deletarCliente() {
    if (!deleteClienteId) return;

    try {
        await apiDelete(`/api/clientes/${deleteClienteId}`);
        showToast('Cliente excluído com sucesso!', 'success');
        fecharConfirmDeleteCliente();
        carregarClientes();

    } catch (error) {
        console.error('[Clientes] Erro ao excluir:', error);
        showToast(`Erro ao excluir cliente: ${error.message}`, 'error');
        fecharConfirmDeleteCliente();
    }
}
