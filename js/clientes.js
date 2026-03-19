/**
 * clientes.js — CRUD de Clientes
 * Depende de: app.js (apiGet, apiPost, apiPut, apiDelete, showToast, formatPhone, etc.)
 */

// ========== ESTADO LOCAL ==========
let clientesData = [];
let deleteClienteId = null;

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

    if (telInput) {
        telInput.addEventListener('input', function () {
            this.value = formatPhone(this.value);
        });
    }
    if (cepInput) {
        cepInput.addEventListener('input', function () {
            this.value = formatCEP(this.value);
        });
    }
    if (cpfCnpjInput) {
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
        clientesData = data.clientes || data || [];

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
        const telefone = c.telefone ? formatPhone(c.telefone) : '-';
        const email = escapeHtml(c.email || '-');
        const cidade = c.cidade || '';
        const estado = c.estado || '';
        const local = cidade && estado ? `${escapeHtml(cidade)}/${escapeHtml(estado)}` : escapeHtml(cidade || estado || '-');

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
const buscarClientesDebounced = debounce(() => {
    const busca = document.getElementById('buscaCliente')?.value || '';
    carregarClientes(busca);
}, 400);

// ========== MODAL: ABRIR/FECHAR ==========
function abrirModalCliente() {
    document.getElementById('modalClienteTitulo').textContent = 'Novo Cliente';
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('modalCliente').classList.add('active');
}

function fecharModalCliente() {
    document.getElementById('modalCliente').classList.remove('active');
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
}

// ========== EDITAR CLIENTE ==========
async function editarCliente(id) {
    try {
        const cliente = await apiGet(`/api/clientes/${id}`);
        console.log('[Clientes] Editando:', cliente);

        document.getElementById('modalClienteTitulo').textContent = 'Editar Cliente';
        document.getElementById('clienteId').value = cliente.id;
        document.getElementById('clienteNome').value = cliente.nome || '';
        document.getElementById('clienteEmpresa').value = cliente.empresa || '';
        document.getElementById('clienteCpfCnpj').value = cliente.cpf_cnpj ? formatCPFCNPJ(cliente.cpf_cnpj) : '';
        document.getElementById('clienteTelefone').value = cliente.telefone ? formatPhone(cliente.telefone) : '';
        document.getElementById('clienteEmail').value = cliente.email || '';
        document.getElementById('clienteEndereco').value = cliente.endereco || '';
        document.getElementById('clienteCidade').value = cliente.cidade || '';
        document.getElementById('clienteEstado').value = cliente.estado || '';
        document.getElementById('clienteCep').value = cliente.cep ? formatCEP(cliente.cep) : '';

        document.getElementById('modalCliente').classList.add('active');

    } catch (error) {
        console.error('[Clientes] Erro ao carregar cliente para edição:', error);
        showToast('Erro ao carregar dados do cliente', 'error');
    }
}

// ========== SALVAR CLIENTE ==========
async function salvarCliente(event) {
    event.preventDefault();

    const id = document.getElementById('clienteId').value;
    const nome = document.getElementById('clienteNome').value.trim();

    // Validação
    if (!nome) {
        showToast('O nome do cliente é obrigatório', 'warning');
        return;
    }

    const dados = {
        nome: nome,
        empresa: document.getElementById('clienteEmpresa').value.trim() || null,
        cpf_cnpj: unmaskValue(document.getElementById('clienteCpfCnpj').value) || null,
        telefone: unmaskValue(document.getElementById('clienteTelefone').value) || null,
        email: document.getElementById('clienteEmail').value.trim() || null,
        endereco: document.getElementById('clienteEndereco').value.trim() || null,
        cidade: document.getElementById('clienteCidade').value.trim() || null,
        estado: document.getElementById('clienteEstado').value || null,
        cep: unmaskValue(document.getElementById('clienteCep').value) || null,
    };

    console.log('[Clientes] Salvando:', dados);

    try {
        if (id) {
            // Atualizar
            await apiPut(`/api/clientes/${id}`, dados);
            showToast('Cliente atualizado com sucesso!', 'success');
        } else {
            // Criar
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
    document.getElementById('confirmDeleteCliente').classList.add('active');
}

function fecharConfirmDeleteCliente() {
    deleteClienteId = null;
    document.getElementById('confirmDeleteCliente').classList.remove('active');
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
