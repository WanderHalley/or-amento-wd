// ==========================================================
// CLIENTES - Gerenciamento de Clientes
// ==========================================================

let clientesData = [];
let deleteClienteId = null;

document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initSidebar();
    aplicarMascaras();
    carregarClientes();
    bindEvents();
});

// ==========================================================
// MÁSCARAS DE INPUT
// ==========================================================

function aplicarMascaras() {
    var telefoneInput = document.getElementById('clienteTelefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            var v = e.target.value.replace(/\D/g, '');
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

    var cepInput = document.getElementById('clienteCep');
    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            var v = e.target.value.replace(/\D/g, '');
            v = v.replace(/^(\d{5})(\d)/, '$1-$2');
            e.target.value = v;
        });
    }

    var cpfCnpjInput = document.getElementById('clienteCpfCnpj');
    if (cpfCnpjInput) {
        cpfCnpjInput.addEventListener('input', function(e) {
            var v = e.target.value.replace(/\D/g, '');
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

// ==========================================================
// EVENTOS
// ==========================================================

function bindEvents() {
    var btnNovo = document.getElementById('btnNovoCliente');
    if (btnNovo) btnNovo.addEventListener('click', novoCliente);

    var btnFechar = document.getElementById('btnFecharModalCliente');
    if (btnFechar) btnFechar.addEventListener('click', fecharModalCliente);

    var btnCancelar = document.getElementById('btnCancelarCliente');
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalCliente);

    var form = document.getElementById('formCliente');
    if (form) form.addEventListener('submit', salvarCliente);

    var btnFecharDel = document.getElementById('btnFecharModalDelete');
    if (btnFecharDel) btnFecharDel.addEventListener('click', fecharModalDelete);

    var btnCancelarDel = document.getElementById('btnCancelarDelete');
    if (btnCancelarDel) btnCancelarDel.addEventListener('click', fecharModalDelete);

    var btnConfirmarDel = document.getElementById('btnConfirmarDelete');
    if (btnConfirmarDel) btnConfirmarDel.addEventListener('click', confirmarDeleteCliente);

    var searchInput = document.getElementById('searchCliente');
    if (searchInput) {
        var debounceTimer;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                carregarClientes(e.target.value);
            }, 300);
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModalCliente();
            fecharModalDelete();
        }
    });
}

// ==========================================================
// CARREGAR CLIENTES
// ==========================================================

async function carregarClientes(busca) {
    if (!busca) busca = '';
    try {
        var url = '/api/clientes';
        if (busca) url += '?search=' + encodeURIComponent(busca);

        var response = await apiGet(url);
        if (response.success) {
            clientesData = response.data || [];
            renderizarTabela();
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showToast('Erro ao carregar clientes', 'error');
    }
}

// ==========================================================
// RENDERIZAR TABELA — sem coluna Empresa
// ==========================================================

function renderizarTabela() {
    var tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;

    if (clientesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;" class="empty-state"><h4>Nenhum cliente encontrado</h4></td></tr>';
        return;
    }

    var html = '';
    for (var i = 0; i < clientesData.length; i++) {
        var cliente = clientesData[i];
        var cidade = '';
        if (cliente.cidade && cliente.estado) {
            cidade = cliente.cidade + '/' + cliente.estado;
        } else {
            cidade = cliente.cidade || cliente.estado || '-';
        }

        html += '<tr>';
        html += '<td><strong>' + escapeHtml(cliente.nome || '-') + '</strong></td>';
        html += '<td>' + escapeHtml(formatPhone(cliente.telefone) || '-') + '</td>';
        html += '<td>' + escapeHtml(cliente.email || '-') + '</td>';
        html += '<td>' + escapeHtml(cidade) + '</td>';
        html += '<td>';
        html += '<button class="btn-icon edit" onclick="editarCliente(\'' + cliente.id + '\')" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>';
        html += '<button class="btn-icon delete" onclick="deletarCliente(\'' + cliente.id + '\')" title="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';
        html += '</td>';
        html += '</tr>';
    }

    tbody.innerHTML = html;
}

// ==========================================================
// MODAL CLIENTE
// ==========================================================

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
        var response = await apiGet('/api/clientes/' + id);
        if (response.success) {
            var c = response.data;
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

    var id = document.getElementById('clienteId').value;
    var nome = document.getElementById('clienteNome').value.trim();

    if (!nome) {
        showToast('Nome é obrigatório', 'error');
        return;
    }

    var dados = {
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
        var response;
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

// ==========================================================
// DELETAR CLIENTE
// ==========================================================

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
        var response = await apiDelete('/api/clientes/' + deleteClienteId);
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
