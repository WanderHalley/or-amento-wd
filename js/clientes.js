// ==========================================
// CLIENTES - Gerenciamento de Clientes
// Campo "Empresa" removido - apenas "Nome"
// ==========================================

let clientesData = [];
let deleteClienteId = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    aplicarMascaras();
    carregarClientes();
    bindEvents();
});

// ==========================================
// MÁSCARAS DE INPUT
// ==========================================

function aplicarMascaras() {
    const telefoneInput = document.getElementById('clienteTelefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length <= 10) {
                v = v.replace(/^(\d{2})(\d)/, '($1) $2');
                v = v.replace(/(\d{4})(\d)/, '$1-$2');
            } else {
                v = v.replace(/^(\d{2})(\d)/, '($1) $2');
                v = v.replace(/(\d{5})(\d)/, '$1-$2');
            }
            e.target.value = v;
        });
    }

    const cepInput = document.getElementById('clienteCep');
    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            v = v.replace(/^(\d{5})(\d)/, '$1-$2');
            e.target.value = v;
        });
    }

    const cpfCnpjInput = document.getElementById('clienteCpfCnpj');
    if (cpfCnpjInput) {
        cpfCnpjInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length <= 11) {
                v = v.replace(/(\d{3})(\d)/, '$1.$2');
                v = v.replace(/(\d{3})(\d)/, '$1.$2');
                v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            } else {
                v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                v = v.replace(/(\d{3})(\d)/, '$1.$2');
                v = v.replace(/(\d{3})(\d)/, '$1/$2');
                v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
            }
            e.target.value = v;
        });
    }
}

// ==========================================
// EVENTOS
// ==========================================

function bindEvents() {
    const btnNovo = document.getElementById('btnNovoCliente');
    if (btnNovo) btnNovo.addEventListener('click', novoCliente);

    const btnFechar = document.getElementById('btnFecharModalCliente');
    if (btnFechar) btnFechar.addEventListener('click', fecharModalCliente);

    const btnCancelar = document.getElementById('btnCancelarCliente');
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalCliente);

    const form = document.getElementById('formCliente');
    if (form) form.addEventListener('submit', salvarCliente);

    const btnFecharDel = document.getElementById('btnFecharModalDelete');
    if (btnFecharDel) btnFecharDel.addEventListener('click', fecharModalDelete);

    const btnCancelarDel = document.getElementById('btnCancelarDelete');
    if (btnCancelarDel) btnCancelarDel.addEventListener('click', fecharModalDelete);

    const btnConfirmarDel = document.getElementById('btnConfirmarDelete');
    if (btnConfirmarDel) btnConfirmarDel.addEventListener('click', confirmarDeleteCliente);

    const searchInput = document.getElementById('searchCliente');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                carregarClientes(e.target.value);
            }, 300);
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            fecharModalCliente();
            fecharModalDelete();
        }
    });
}

// ==========================================
// CARREGAR CLIENTES
// ==========================================

async function carregarClientes(busca = '') {
    try {
        let url = '/api/clientes';
        if (busca) url += '?search=' + encodeURIComponent(busca);

        const response = await apiGet(url);
        if (response.success) {
            clientesData = response.data || [];
            renderizarTabela();
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showToast('Erro ao carregar clientes', 'error');
    }
}

// ==========================================
// RENDERIZAR TABELA - SEM coluna Empresa
// ==========================================

function renderizarTabela() {
    const tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;

    if (clientesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Nenhum cliente encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = clientesData.map(cliente => {
        const cidade = cliente.cidade && cliente.estado
            ? cliente.cidade + '/' + cliente.estado
            : cliente.cidade || cliente.estado || '-';

        return '<tr>' +
            '<td><strong>' + (cliente.nome || '-') + '</strong></td>' +
            '<td>' + (formatarTelefone(cliente.telefone) || '-') + '</td>' +
            '<td>' + (cliente.email || '-') + '</td>' +
            '<td>' + cidade + '</td>' +
            '<td>' +
                '<div class="action-buttons">' +
                    '<button class="btn btn-sm btn-secondary" onclick="editarCliente(\'' + cliente.id + '\')">✏️</button>' +
                    '<button class="btn btn-sm btn-danger" onclick="deletarCliente(\'' + cliente.id + '\')">🗑️</button>' +
                '</div>' +
            '</td>' +
        '</tr>';
    }).join('');
}

function formatarTelefone(tel) {
    if (!tel) return '';
    const nums = tel.replace(/\D/g, '');
    if (nums.length === 11) {
        return '(' + nums.slice(0, 2) + ') ' + nums.slice(2, 7) + '-' + nums.slice(7);
    } else if (nums.length === 10) {
        return '(' + nums.slice(0, 2) + ') ' + nums.slice(2, 6) + '-' + nums.slice(6);
    }
    return tel;
}

// ==========================================
// MODAL CLIENTE
// ==========================================

function novoCliente() {
    document.getElementById('modalClienteTitulo').textContent = 'Novo Cliente';
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('modalCliente').classList.add('active');
}

function fecharModalCliente() {
    document.getElementById('modalCliente').classList.remove('active');
}

async function editarCliente(id) {
    try {
        const response = await apiGet('/api/clientes/' + id);
        if (response.success) {
            const c = response.data;
            document.getElementById('modalClienteTitulo').textContent = 'Editar Cliente';
            document.getElementById('clienteId').value = c.id;
            document.getElementById('clienteNome').value = c.nome || '';
            document.getElementById('clienteCpfCnpj').value = c.cpf_cnpj || '';
            document.getElementById('clienteTelefone').value = c.telefone || '';
            document.getElementById('clienteEmail').value = c.email || '';
            document.getElementById('clienteEndereco').value = c.endereco || '';
            document.getElementById('clienteCidade').value = c.cidade || '';
            document.getElementById('clienteEstado').value = c.estado || '';
            document.getElementById('clienteCep').value = c.cep || '';
            document.getElementById('modalCliente').classList.add('active');
        }
    } catch (error) {
        console.error('Erro ao carregar cliente:', error);
        showToast('Erro ao carregar cliente', 'error');
    }
}

async function salvarCliente(e) {
    e.preventDefault();

    const id = document.getElementById('clienteId').value;
    const nome = document.getElementById('clienteNome').value.trim();

    if (!nome) {
        showToast('Nome é obrigatório', 'error');
        return;
    }

    const dados = {
        nome: nome,
        empresa: nome,
        cpf_cnpj: document.getElementById('clienteCpfCnpj').value.trim(),
        telefone: document.getElementById('clienteTelefone').value.trim(),
        email: document.getElementById('clienteEmail').value.trim(),
        endereco: document.getElementById('clienteEndereco').value.trim(),
        cidade: document.getElementById('clienteCidade').value.trim(),
        estado: document.getElementById('clienteEstado').value,
        cep: document.getElementById('clienteCep').value.trim()
    };

    try {
        let response;
        if (id) {
            response = await apiPut('/api/clientes/' + id, dados);
        } else {
            response = await apiPost('/api/clientes', dados);
        }

        if (response.success) {
            showToast(id ? 'Cliente atualizado!' : 'Cliente criado!', 'success');
            fecharModalCliente();
            carregarClientes();
        } else {
            showToast(response.error || 'Erro ao salvar', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        showToast('Erro ao salvar cliente', 'error');
    }
}

// ==========================================
// DELETAR CLIENTE
// ==========================================

function deletarCliente(id) {
    deleteClienteId = id;
    document.getElementById('modalDeleteCliente').classList.add('active');
}

function fecharModalDelete() {
    document.getElementById('modalDeleteCliente').classList.remove('active');
    deleteClienteId = null;
}

async function confirmarDeleteCliente() {
    if (!deleteClienteId) return;

    try {
        const response = await apiDelete('/api/clientes/' + deleteClienteId);
        if (response.success) {
            showToast('Cliente excluído!', 'success');
            fecharModalDelete();
            carregarClientes();
        } else {
            showToast(response.error || 'Erro ao excluir', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        showToast('Erro ao excluir cliente', 'error');
    }
}
