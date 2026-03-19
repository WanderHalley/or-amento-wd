/**
 * ============================================================
 * clientes.js - CRUD de Clientes
 * ============================================================
 */

// Estado local
let clientesData = [];
let deleteClienteId = null;

// ============================================================
// Carregar clientes ao abrir a página
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    carregarClientes();
});

/**
 * Carrega a lista de clientes da API e renderiza na tabela.
 * @param {string} busca - Termo de busca opcional
 */
async function carregarClientes(busca = '') {
    const tbody = document.getElementById('tbodyClientes');
    tbody.innerHTML = '<tr><td colspan="6"><div class="spinner"></div></td></tr>';

    try {
        let endpoint = '/api/clientes?limit=200';
        if (busca) endpoint += `&busca=${encodeURIComponent(busca)}`;

        const result = await apiGet(endpoint);

        if (result.success) {
            clientesData = result.data;
            renderizarClientes(clientesData);
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--danger)">Erro ao carregar clientes: ${escapeHtml(error.message)}</td></tr>`;
        showToast('Erro ao carregar clientes', 'error');
    }
}

/**
 * Renderiza a lista de clientes na tabela HTML.
 * @param {Array} clientes
 */
function renderizarClientes(clientes) {
    const tbody = document.getElementById('tbodyClientes');

    if (!clientes || clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        <h4>Nenhum cliente cadastrado</h4>
                        <p>Adicione seu primeiro cliente para começar</p>
                        <button class="btn btn-primary btn-sm" onclick="abrirModalCliente()">Adicionar Cliente</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clientes.map(c => `
        <tr>
            <td><strong>${escapeHtml(c.nome)}</strong></td>
            <td>${escapeHtml(c.empresa || '-')}</td>
            <td>${escapeHtml(c.telefone || '-')}</td>
            <td>${escapeHtml(c.email || '-')}</td>
            <td>${c.cidade && c.estado ? escapeHtml(c.cidade) + '/' + escapeHtml(c.estado) : '-'}</td>
            <td>
                <button class="btn-icon edit" title="Editar" onclick="editarCliente('${c.id}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon delete" title="Excluir" onclick="confirmarDeleteCliente('${c.id}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================================
// Busca com debounce
// ============================================================
const buscarClientesDebounced = debounce((termo) => {
    carregarClientes(termo);
}, 400);

function buscarClientes() {
    const termo = document.getElementById('buscaCliente').value.trim();
    buscarClientesDebounced(termo);
}

// ============================================================
// Modal - Abrir / Fechar
// ============================================================

/**
 * Abre o modal para criar um novo cliente.
 */
function abrirModalCliente() {
    document.getElementById('modalClienteTitulo').textContent = 'Novo Cliente';
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('modalCliente').classList.add('active');
}

/**
 * Fecha o modal de cliente.
 */
function fecharModalCliente() {
    document.getElementById('modalCliente').classList.remove('active');
}

/**
 * Abre o modal para editar um cliente existente.
 * @param {string} id - ID do cliente
 */
async function editarCliente(id) {
    try {
        const result = await apiGet(`/api/clientes/${id}`);
        if (result.success) {
            const c = result.data;
            document.getElementById('modalClienteTitulo').textContent = 'Editar Cliente';
            document.getElementById('clienteId').value = c.id;
            document.getElementById('clienteNome').value = c.nome || '';
            document.getElementById('clienteEmpresa').value = c.empresa || '';
            document.getElementById('clienteTelefone').value = c.telefone || '';
            document.getElementById('clienteEmail').value = c.email || '';
            document.getElementById('clienteEndereco').value = c.endereco || '';
            document.getElementById('clienteCidade').value = c.cidade || '';
            document.getElementById('clienteEstado').value = c.estado || '';
            document.getElementById('clienteCep').value = c.cep || '';
            document.getElementById('clienteCnpjCpf').value = c.cnpj_cpf || '';
            document.getElementById('clienteObservacoes').value = c.observacoes || '';
            document.getElementById('modalCliente').classList.add('active');
        }
    } catch (error) {
        showToast('Erro ao carregar cliente', 'error');
    }
}

// ============================================================
// Salvar (Criar / Atualizar)
// ============================================================

/**
 * Salva o cliente (cria novo ou atualiza existente).
 * @param {Event} event
 */
async function salvarCliente(event) {
    event.preventDefault();

    const id = document.getElementById('clienteId').value;
    const dados = {
        nome: document.getElementById('clienteNome').value.trim(),
        empresa: document.getElementById('clienteEmpresa').value.trim() || null,
        telefone: document.getElementById('clienteTelefone').value.trim() || null,
        email: document.getElementById('clienteEmail').value.trim() || null,
        endereco: document.getElementById('clienteEndereco').value.trim() || null,
        cidade: document.getElementById('clienteCidade').value.trim() || null,
        estado: document.getElementById('clienteEstado').value || null,
        cep: document.getElementById('clienteCep').value.trim() || null,
        cnpj_cpf: document.getElementById('clienteCnpjCpf').value.trim() || null,
        observacoes: document.getElementById('clienteObservacoes').value.trim() || null,
    };

    if (!dados.nome) {
        showToast('O nome do cliente é obrigatório', 'warning');
        return;
    }

    try {
        let result;
        if (id) {
            result = await apiPut(`/api/clientes/${id}`, dados);
            showToast('Cliente atualizado com sucesso!', 'success');
        } else {
            result = await apiPost('/api/clientes', dados);
            showToast('Cliente criado com sucesso!', 'success');
        }

        fecharModalCliente();
        carregarClientes();
    } catch (error) {
        showToast(`Erro ao salvar: ${error.message}`, 'error');
    }
}

// ============================================================
// Excluir
// ============================================================

/**
 * Abre o modal de confirmação para excluir um cliente.
 * @param {string} id
 */
function confirmarDeleteCliente(id) {
    deleteClienteId = id;
    document.getElementById('modalConfirmDelete').classList.add('active');
    document.getElementById('btnConfirmDelete').onclick = async () => {
        await deletarCliente(deleteClienteId);
    };
}

/**
 * Fecha o modal de confirmação de exclusão.
 */
function fecharConfirmDelete() {
    document.getElementById('modalConfirmDelete').classList.remove('active');
    deleteClienteId = null;
}

/**
 * Exclui um cliente pelo ID.
 * @param {string} id
 */
async function deletarCliente(id) {
    try {
        await apiDelete(`/api/clientes/${id}`);
        showToast('Cliente excluído com sucesso!', 'success');
        fecharConfirmDelete();
        carregarClientes();
    } catch (error) {
        showToast(`Erro ao excluir: ${error.message}`, 'error');
        fecharConfirmDelete();
    }
}
