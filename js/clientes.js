/**
 * ============================================================
 * clientes.js — CRUD de Clientes
 * ============================================================
 */

/* Estado local */
let clientesData = [];
let deleteClienteId = null;

/* ============================================================
   Inicialização
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initSidebar();
    aplicarMascaras();
    carregarClientes();
    bindEventos();
});

/**
 * Aplica máscaras nos campos do formulário.
 */
function aplicarMascaras() {
    maskInput(document.getElementById('clienteTelefone'), 'phone');
    maskInput(document.getElementById('clienteCep'), 'cep');
    maskInput(document.getElementById('clienteCpfCnpj'), 'cpfcnpj');
}

/**
 * Bindeia eventos de clique (sem onclick inline no HTML).
 */
function bindEventos() {
    /* Botão novo cliente */
    const btnNovo = document.getElementById('btnNovoCliente');
    if (btnNovo) btnNovo.addEventListener('click', abrirModalCliente);

    /* Fechar modal criar/editar */
    const btnFechar = document.getElementById('btnFecharModalCliente');
    if (btnFechar) btnFechar.addEventListener('click', fecharModalCliente);

    const btnCancelar = document.getElementById('btnCancelarCliente');
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalCliente);

    /* Submit formulário */
    const form = document.getElementById('formCliente');
    if (form) form.addEventListener('submit', salvarCliente);

    /* Fechar modal delete */
    const btnFecharDel = document.getElementById('btnFecharDeleteCliente');
    if (btnFecharDel) btnFecharDel.addEventListener('click', fecharConfirmDeleteCliente);

    const btnCancelarDel = document.getElementById('btnCancelarDeleteCliente');
    if (btnCancelarDel) btnCancelarDel.addEventListener('click', fecharConfirmDeleteCliente);

    /* Confirmar delete */
    const btnConfirmarDel = document.getElementById('btnConfirmarDeleteCliente');
    if (btnConfirmarDel) btnConfirmarDel.addEventListener('click', executarDeleteCliente);

    /* Busca com debounce */
    const inputBusca = document.getElementById('buscaCliente');
    if (inputBusca) {
        const buscaDebounced = debounce(function () {
            carregarClientes(inputBusca.value.trim());
        }, 400);
        inputBusca.addEventListener('input', buscaDebounced);
    }

    /* ESC fecha modais */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            fecharModalCliente();
            fecharConfirmDeleteCliente();
        }
    });
}

/* ============================================================
   Carregar / Renderizar
   ============================================================ */

/**
 * Carrega clientes da API.
 * @param {string} busca
 */
async function carregarClientes(busca) {
    const tbody = document.getElementById('tabelaClientes');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6"><div class="spinner"></div></td></tr>';

    try {
        let endpoint = '/api/clientes?limit=200';
        if (busca) endpoint += '&busca=' + encodeURIComponent(busca);

        const result = await apiGet(endpoint);

        if (result.success) {
            clientesData = result.data || [];
            renderizarClientes(clientesData);
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">' +
            '<h4>Erro ao carregar clientes</h4>' +
            '<p>' + escapeHtml(error.message) + '</p>' +
            '</div></td></tr>';
        showToast('Erro ao carregar clientes', 'error');
    }
}

/**
 * Renderiza a lista de clientes na tabela.
 * @param {Array} clientes
 */
function renderizarClientes(clientes) {
    const tbody = document.getElementById('tabelaClientes');
    if (!tbody) return;

    if (!clientes || clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' +
            '<h4>Nenhum cliente cadastrado</h4>' +
            '<p>Adicione seu primeiro cliente para começar</p>' +
            '</div></td></tr>';
        return;
    }

    tbody.innerHTML = clientes.map(function (c) {
        const cidadeUf = (c.cidade && c.estado) ? escapeHtml(c.cidade) + '/' + escapeHtml(c.estado) : '-';
        return '<tr>' +
            '<td><strong>' + escapeHtml(c.nome) + '</strong></td>' +
            '<td>' + escapeHtml(c.empresa || '-') + '</td>' +
            '<td>' + escapeHtml(c.telefone ? formatPhone(c.telefone) : '-') + '</td>' +
            '<td>' + escapeHtml(c.email || '-') + '</td>' +
            '<td>' + cidadeUf + '</td>' +
            '<td>' +
            '<button class="btn-icon edit" title="Editar" data-id="' + c.id + '" data-action="editar-cliente">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
            '</button>' +
            '<button class="btn-icon delete" title="Excluir" data-id="' + c.id + '" data-action="deletar-cliente">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
            '</td>' +
            '</tr>';
    }).join('');

    /* Event delegation para botões da tabela */
    tbody.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'editar-cliente') editarCliente(id);
        if (action === 'deletar-cliente') confirmarDeleteCliente(id);
    });
}

/* ============================================================
   Modal — Abrir / Fechar
   ============================================================ */

function abrirModalCliente() {
    document.getElementById('modalClienteTitulo').textContent = 'Novo Cliente';
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('modalCliente').classList.add('active');
}

function fecharModalCliente() {
    document.getElementById('modalCliente').classList.remove('active');
}

/**
 * Abre modal preenchido para edição.
 * @param {string} id
 */
async function editarCliente(id) {
    try {
        const result = await apiGet('/api/clientes/' + id);
        if (result.success && result.data) {
            const c = result.data;
            document.getElementById('modalClienteTitulo').textContent = 'Editar Cliente';
            document.getElementById('clienteId').value = c.id;
            document.getElementById('clienteNome').value = c.nome || '';
            document.getElementById('clienteEmpresa').value = c.empresa || '';
            document.getElementById('clienteCpfCnpj').value = c.cpf_cnpj ? formatCPFCNPJ(c.cpf_cnpj) : '';
            document.getElementById('clienteTelefone').value = c.telefone ? formatPhone(c.telefone) : '';
            document.getElementById('clienteEmail').value = c.email || '';
            document.getElementById('clienteEndereco').value = c.endereco || '';
            document.getElementById('clienteCidade').value = c.cidade || '';
            document.getElementById('clienteEstado').value = c.estado || '';
            document.getElementById('clienteCep').value = c.cep ? formatCEP(c.cep) : '';
            document.getElementById('modalCliente').classList.add('active');
        }
    } catch (error) {
        showToast('Erro ao carregar cliente', 'error');
    }
}

/* ============================================================
   Salvar (Criar / Atualizar)
   ============================================================ */

/**
 * Salva o cliente (cria ou atualiza).
 * @param {Event} event
 */
async function salvarCliente(event) {
    event.preventDefault();

    const btnSalvar = document.getElementById('btnSalvarCliente');
    const id = document.getElementById('clienteId').value;

    const dados = {
        nome: document.getElementById('clienteNome').value.trim(),
        empresa: document.getElementById('clienteEmpresa').value.trim() || null,
        cpf_cnpj: unmask(document.getElementById('clienteCpfCnpj').value) || null,
        telefone: unmask(document.getElementById('clienteTelefone').value) || null,
        email: document.getElementById('clienteEmail').value.trim() || null,
        endereco: document.getElementById('clienteEndereco').value.trim() || null,
        cidade: document.getElementById('clienteCidade').value.trim() || null,
        estado: document.getElementById('clienteEstado').value || null,
        cep: unmask(document.getElementById('clienteCep').value) || null,
    };

    if (!dados.nome) {
        showToast('O nome do cliente é obrigatório', 'warning');
        return;
    }

    /* Proteção duplo-clique */
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
        if (id) {
            await apiPut('/api/clientes/' + id, dados);
            showToast('Cliente atualizado com sucesso!', 'success');
        } else {
            await apiPost('/api/clientes', dados);
            showToast('Cliente criado com sucesso!', 'success');
        }
        fecharModalCliente();
        carregarClientes();
    } catch (error) {
        showToast('Erro ao salvar: ' + error.message, 'error');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar Cliente';
    }
}

/* ============================================================
   Excluir
   ============================================================ */

/**
 * Abre modal de confirmação de exclusão.
 * @param {string} id
 */
function confirmarDeleteCliente(id) {
    deleteClienteId = id;
    document.getElementById('modalConfirmDeleteCliente').classList.add('active');
}

function fecharConfirmDeleteCliente() {
    document.getElementById('modalConfirmDeleteCliente').classList.remove('active');
    deleteClienteId = null;
}

/**
 * Executa a exclusão do cliente.
 */
async function executarDeleteCliente() {
    if (!deleteClienteId) return;

    const btnDel = document.getElementById('btnConfirmarDeleteCliente');
    btnDel.disabled = true;
    btnDel.textContent = 'Excluindo...';

    try {
        await apiDelete('/api/clientes/' + deleteClienteId);
        showToast('Cliente excluído com sucesso!', 'success');
        fecharConfirmDeleteCliente();
        carregarClientes();
    } catch (error) {
        showToast('Erro ao excluir: ' + error.message, 'error');
    } finally {
        btnDel.disabled = false;
        btnDel.textContent = 'Excluir';
    }
}
