/**
 * clientes.js — Aba Clientes (SPA)
 * Função de entrada: init_clientes()
 */

let clientesData = [];
let deleteClienteId = null;
let clientes_mascarasAplicadas = false;

function extrairArrayClientes(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.clientes && Array.isArray(data.clientes)) return data.clientes;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
}

function init_clientes() {
    console.log('[Clientes] Inicializando...');
    if (!clientes_mascarasAplicadas) {
        aplicarMascarasCliente();
        clientes_mascarasAplicadas = true;
    }
    carregarClientes();
}

function aplicarMascarasCliente() {
    const telInput = document.getElementById('clienteTelefone');
    const cepInput = document.getElementById('clienteCep');
    const cpfCnpjInput = document.getElementById('clienteCpfCnpj');

    if (telInput) telInput.addEventListener('input', function () { this.value = formatPhone(this.value); });
    if (cepInput) cepInput.addEventListener('input', function () { this.value = formatCEP(this.value); });
    if (cpfCnpjInput) cpfCnpjInput.addEventListener('input', function () { this.value = formatCPFCNPJ(this.value); });
}

async function carregarClientes(busca = '') {
    const tbody = document.getElementById('tabelaClientes');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;"><div class="spinner"></div><p>Carregando...</p></td></tr>';

    try {
        let url = '/api/clientes?limit=200';
        if (busca) url += `&busca=${encodeURIComponent(busca)}`;
        const data = await apiGet(url);
        clientesData = extrairArrayClientes(data);
        renderizarClientes(clientesData);
    } catch (error) {
        console.error('[Clientes] Erro:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;"><p>Erro ao carregar clientes.</p></td></tr>';
        showToast('Erro ao carregar clientes', 'error');
    }
}

function renderizarClientes(clientes) {
    const tbody = document.getElementById('tabelaClientes');
    if (!tbody) return;

    if (!clientes || clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;"><p>Nenhum cliente encontrado.</p><button class="btn btn-primary btn-sm" onclick="abrirModalCliente()" style="margin-top:10px;">+ Adicionar cliente</button></td></tr>';
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

        return `<tr>
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
            </td></tr>`;
    }).join('');
}

const buscarClientesDebounced = debounce(() => {
    const busca = document.getElementById('buscaCliente')?.value || '';
    carregarClientes(busca);
}, 400);

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

async function editarCliente(id) {
    try {
        const response = await apiGet(`/api/clientes/${id}`);
        const cliente = response.data || response;

        document.getElementById('modalClienteTitulo').textContent = 'Editar Cliente';
        document.getElementById('clienteId').value = cliente.id;
        document.getElementById('clienteNome').value = cliente.nome || '';
        document.getElementById('clienteEmpresa').value = cliente.empresa || '';

        const cpfCnpjValue = cliente.cpf_cnpj || cliente.cnpj_cpf || '';
        document.getElementById('clienteCpfCnpj').value = cpfCnpjValue ? formatCPFCNPJ(cpfCnpjValue) : '';
        document.getElementById('clienteTelefone').value = cliente.telefone ? formatPhone(cliente.telefone) : '';
        document.getElementById('clienteEmail').value = cliente.email || '';
        document.getElementById('clienteEndereco').value = cliente.endereco || '';
        document.getElementById('clienteCidade').value = cliente.cidade || '';
        document.getElementById('clienteEstado').value = cliente.estado || '';
        document.getElementById('clienteCep').value = cliente.cep ? formatCEP(cliente.cep) : '';
        document.getElementById('modalCliente').classList.add('active');
    } catch (error) {
        console.error('[Clientes] Erro ao carregar:', error);
        showToast('Erro ao carregar dados do cliente', 'error');
    }
}

async function salvarCliente(event) {
    event.preventDefault();
    const id = document.getElementById('clienteId').value;
    const nome = document.getElementById('clienteNome').value.trim();
    if (!nome) { showToast('O nome é obrigatório', 'warning'); return; }

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

    try {
        if (id) {
            await apiPut(`/api/clientes/${id}`, dados);
            showToast('Cliente atualizado!', 'success');
        } else {
            await apiPost('/api/clientes', dados);
            showToast('Cliente criado!', 'success');
        }
        fecharModalCliente();
        carregarClientes();
    } catch (error) {
        console.error('[Clientes] Erro ao salvar:', error);
        showToast(`Erro: ${error.message}`, 'error');
    }
}

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
        showToast('Cliente excluído!', 'success');
        fecharConfirmDeleteCliente();
        carregarClientes();
    } catch (error) {
        console.error('[Clientes] Erro:', error);
        showToast(`Erro: ${error.message}`, 'error');
        fecharConfirmDeleteCliente();
    }
}
