/**
 * ============================================================
 * orcamentos.js — Gerenciamento de Orçamentos
 * ============================================================
 */

/* Estado local */
let orcamentosData = [];
let produtosDisponiveis = [];
let clientesDisponiveis = [];
let deleteOrcamentoId = null;
let itemCounter = 0;

/* ============================================================
   Inicialização
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initSidebar();
    carregarOrcamentos();
    bindEventosOrcamento();

    const params = new URLSearchParams(window.location.search);
    if (params.get('novo') === '1') {
        mostrarFormulario();
    }
});

function bindEventosOrcamento() {
    const btnNovo = document.getElementById('btnNovoOrcamento');
    if (btnNovo) btnNovo.addEventListener('click', mostrarFormulario);

    const btnVoltar = document.getElementById('btnVoltarLista');
    if (btnVoltar) btnVoltar.addEventListener('click', mostrarLista);

    const btnCancelar = document.getElementById('btnCancelarOrcamento');
    if (btnCancelar) btnCancelar.addEventListener('click', mostrarLista);

    const btnAddItem = document.getElementById('btnAdicionarItem');
    if (btnAddItem) btnAddItem.addEventListener('click', adicionarItem);

    const form = document.getElementById('formOrcamento');
    if (form) form.addEventListener('submit', salvarOrcamento);

    /* Status modal */
    const btnFecharStatus = document.getElementById('btnFecharModalStatus');
    if (btnFecharStatus) btnFecharStatus.addEventListener('click', fecharModalStatus);

    const btnCancelarStatus = document.getElementById('btnCancelarStatus');
    if (btnCancelarStatus) btnCancelarStatus.addEventListener('click', fecharModalStatus);

    const btnConfirmarStatus = document.getElementById('btnConfirmarStatus');
    if (btnConfirmarStatus) btnConfirmarStatus.addEventListener('click', confirmarMudarStatus);

    /* Delete modal */
    const btnFecharDel = document.getElementById('btnFecharDeleteOrcamento');
    if (btnFecharDel) btnFecharDel.addEventListener('click', fecharConfirmDeleteOrcamento);

    const btnCancelarDel = document.getElementById('btnCancelarDeleteOrcamento');
    if (btnCancelarDel) btnCancelarDel.addEventListener('click', fecharConfirmDeleteOrcamento);

    const btnConfirmarDel = document.getElementById('btnConfirmarDeleteOrcamento');
    if (btnConfirmarDel) btnConfirmarDel.addEventListener('click', executarDeleteOrcamento);

    /* Busca e filtro */
    const inputBusca = document.getElementById('buscaOrcamento');
    if (inputBusca) {
        const buscaDebounced = debounce(function () {
            carregarOrcamentos();
        }, 400);
        inputBusca.addEventListener('input', buscaDebounced);
    }

    const selectFiltro = document.getElementById('filtroStatus');
    if (selectFiltro) selectFiltro.addEventListener('change', function () { carregarOrcamentos(); });

    /* ESC */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            fecharModalStatus();
            fecharConfirmDeleteOrcamento();
        }
    });
}

/* ============================================================
   Views: Lista vs Formulário
   ============================================================ */

function mostrarLista() {
    document.getElementById('secaoLista').style.display = '';
    document.getElementById('secaoFormulario').style.display = 'none';
    document.getElementById('orcPageTitle').textContent = 'Orçamentos';
    document.getElementById('btnNovoOrcamento').style.display = '';
    carregarOrcamentos();
}

async function mostrarFormulario() {
    document.getElementById('secaoLista').style.display = 'none';
    document.getElementById('secaoFormulario').style.display = '';
    document.getElementById('orcPageTitle').textContent = 'Novo Orçamento';
    document.getElementById('btnNovoOrcamento').style.display = 'none';

    document.getElementById('formOrcamento').reset();
    document.getElementById('itensContainer').innerHTML = '';
    document.getElementById('orcTotalDisplay').textContent = 'R$ 0,00';
    itemCounter = 0;

    document.getElementById('orcDataEmissao').value = getToday();

    /* Carregar configurações para preencher padrões */
    try {
        const cfgResult = await apiGet('/api/configuracoes');
        if (cfgResult.success && cfgResult.data) {
            const cfg = cfgResult.data;
            const validadeDias = parseInt(cfg.orcamento_validade_dias) || 15;
            document.getElementById('orcDataValidade').value = getDatePlusDays(validadeDias);
            document.getElementById('orcFormaPagamento').value = cfg.orcamento_condicoes_padrao || '';
            document.getElementById('orcPrazoEntrega').value = cfg.orcamento_prazo_entrega_padrao || '';
            document.getElementById('orcObservacoes').value = cfg.orcamento_observacoes_padrao || '';
        }
    } catch {
        document.getElementById('orcDataValidade').value = getDatePlusDays(15);
    }

    await Promise.all([
        carregarClientesSelect(),
        carregarProdutosSelect()
    ]);

    adicionarItem();
}

async function carregarClientesSelect() {
    try {
        const result = await apiGet('/api/clientes?limit=500');
        if (result.success) {
            clientesDisponiveis = result.data || [];
            const select = document.getElementById('orcClienteId');
            select.innerHTML = '<option value="">Selecione o cliente...</option>';
            clientesDisponiveis.forEach(function (c) {
                const label = c.empresa ? c.nome + ' - ' + c.empresa : c.nome;
                select.innerHTML += '<option value="' + c.id + '">' + escapeHtml(label) + '</option>';
            });
        }
    } catch (error) {
        showToast('Erro ao carregar clientes', 'error');
    }
}

async function carregarProdutosSelect() {
    try {
        const result = await apiGet('/api/produtos?ativo=true&limit=500');
        if (result.success) {
            produtosDisponiveis = result.data || [];
        }
    } catch (error) {
        showToast('Erro ao carregar produtos', 'error');
    }
}

/* ============================================================
   Itens dinâmicos
   ============================================================ */

function adicionarItem() {
    itemCounter++;
    const container = document.getElementById('itensContainer');
    const idx = itemCounter;

    let optionsProdutos = '<option value="">Selecione...</option>';
    produtosDisponiveis.forEach(function (p) {
        optionsProdutos += '<option value="' + p.id + '" data-valor="' + p.valor + '">' + escapeHtml(p.nome) + ' - ' + formatCurrency(p.valor) + '</option>';
    });

    const html = '<div class="item-row" id="itemRow_' + idx + '" data-item-id="' + idx + '">' +
        '<div class="form-group">' +
        '<label>Produto *</label>' +
        '<select id="itemProduto_' + idx + '" class="form-input" required>' + optionsProdutos + '</select>' +
        '<div class="item-info" id="itemInfo_' + idx + '"></div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label>Qtd *</label>' +
        '<input type="number" id="itemQtd_' + idx + '" class="form-input" value="1" min="1" required>' +
        '</div>' +
        '<div>' +
        '<button type="button" class="btn-icon delete" title="Remover item" data-remove-item="' + idx + '">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        '</button>' +
        '</div>' +
        '</div>';

    container.insertAdjacentHTML('beforeend', html);

    /* Bind eventos do novo item */
    const selectProduto = document.getElementById('itemProduto_' + idx);
    const inputQtd = document.getElementById('itemQtd_' + idx);

    if (selectProduto) {
        selectProduto.addEventListener('change', function () { atualizarItemValor(idx); });
    }
    if (inputQtd) {
        inputQtd.addEventListener('input', function () { atualizarItemValor(idx); });
    }

    /* Botão remover */
    const row = document.getElementById('itemRow_' + idx);
    const btnRemover = row.querySelector('[data-remove-item]');
    if (btnRemover) {
        btnRemover.addEventListener('click', function () { removerItem(idx); });
    }
}

function atualizarItemValor(idx) {
    const select = document.getElementById('itemProduto_' + idx);
    const qtdInput = document.getElementById('itemQtd_' + idx);
    const info = document.getElementById('itemInfo_' + idx);
    if (!select || !qtdInput || !info) return;

    const selectedOption = select.options[select.selectedIndex];
    const valor = parseFloat(selectedOption ? selectedOption.getAttribute('data-valor') : 0) || 0;
    const qtd = parseInt(qtdInput.value) || 1;
    const subtotal = valor * qtd;

    if (valor > 0) {
        info.innerHTML = '<span class="item-valor">Subtotal: ' + formatCurrency(subtotal) + '</span>';
    } else {
        info.innerHTML = '';
    }

    recalcularTotal();
}

function removerItem(idx) {
    const row = document.getElementById('itemRow_' + idx);
    if (row) {
        row.remove();
        recalcularTotal();
    }
}

function recalcularTotal() {
    let total = 0;
    const rows = document.querySelectorAll('#itensContainer .item-row');

    rows.forEach(function (row) {
        const idx = row.getAttribute('data-item-id');
        const select = document.getElementById('itemProduto_' + idx);
        const qtdInput = document.getElementById('itemQtd_' + idx);
        if (select && qtdInput) {
            const selectedOption = select.options[select.selectedIndex];
            const valor = parseFloat(selectedOption ? selectedOption.getAttribute('data-valor') : 0) || 0;
            const qtd = parseInt(qtdInput.value) || 0;
            total += valor * qtd;
        }
    });

    document.getElementById('orcTotalDisplay').textContent = formatCurrency(total);
}

/* ============================================================
   Salvar Orçamento
   ============================================================ */

async function salvarOrcamento(event) {
    event.preventDefault();

    const btnSalvar = document.getElementById('btnSalvarOrcamento');
    const clienteId = document.getElementById('orcClienteId').value;
    if (!clienteId) {
        showToast('Selecione um cliente', 'warning');
        return;
    }

    const itens = [];
    const rows = document.querySelectorAll('#itensContainer .item-row');
    rows.forEach(function (row) {
        const idx = row.getAttribute('data-item-id');
        const select = document.getElementById('itemProduto_' + idx);
        const qtdInput = document.getElementById('itemQtd_' + idx);
        if (select && qtdInput && select.value) {
            itens.push({
                produto_id: select.value,
                quantidade: parseInt(qtdInput.value) || 1
            });
        }
    });

    if (itens.length === 0) {
        showToast('Adicione pelo menos um produto ao orçamento', 'warning');
        return;
    }

    const dados = {
        cliente_id: clienteId,
        data_emissao: document.getElementById('orcDataEmissao').value || null,
        data_validade: document.getElementById('orcDataValidade').value || null,
        forma_pagamento: document.getElementById('orcFormaPagamento').value.trim() || null,
        prazo_entrega: document.getElementById('orcPrazoEntrega').value.trim() || null,
        observacoes: document.getElementById('orcObservacoes').value.trim() || null,
        itens: itens
    };

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
        const result = await apiPost('/api/orcamentos', dados);
        if (result.success && result.data) {
            showToast('Orçamento criado com sucesso!', 'success');
            window.location.href = 'preview.html?id=' + result.data.id;
        }
    } catch (error) {
        showToast('Erro ao salvar orçamento: ' + error.message, 'error');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar e Visualizar';
    }
}

/* ============================================================
   Listar Orçamentos
   ============================================================ */

async function carregarOrcamentos() {
    const tbody = document.getElementById('tabelaOrcamentos');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';

    try {
        let endpoint = '/api/orcamentos?limit=100';
        const busca = document.getElementById('buscaOrcamento');
        if (busca && busca.value.trim()) endpoint += '&busca=' + encodeURIComponent(busca.value.trim());
        const filtro = document.getElementById('filtroStatus');
        if (filtro && filtro.value) endpoint += '&status=' + filtro.value;

        const result = await apiGet(endpoint);

        if (result.success) {
            orcamentosData = result.data || [];
            renderizarOrcamentos(orcamentosData);
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><h4>Erro ao carregar</h4><p>' + escapeHtml(error.message) + '</p></div></td></tr>';
    }
}

function renderizarOrcamentos(orcamentos) {
    const tbody = document.getElementById('tabelaOrcamentos');
    if (!tbody) return;

    if (!orcamentos || orcamentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
            '<h4>Nenhum orçamento encontrado</h4>' +
            '<p>Crie seu primeiro orçamento</p>' +
            '</div></td></tr>';
        return;
    }

    tbody.innerHTML = orcamentos.map(function (orc) {
        const cliente = orc.clientes || {};
        const clienteNome = cliente.nome || '-';
        const clienteEmpresa = cliente.empresa ? ' - ' + cliente.empresa : '';

        return '<tr>' +
            '<td><strong>#' + escapeHtml(String(orc.numero_orcamento || '-')) + '</strong></td>' +
            '<td>' + escapeHtml(clienteNome) + escapeHtml(clienteEmpresa) + '</td>' +
            '<td>' + formatDate(orc.data_emissao) + '</td>' +
            '<td>' + formatDate(orc.data_validade) + '</td>' +
            '<td><strong>' + formatCurrency(orc.valor_total) + '</strong></td>' +
            '<td><span class="badge badge-' + (orc.status || 'pendente') + '">' + capitalizeFirst(orc.status || 'pendente') + '</span></td>' +
            '<td>' +
            '<a href="preview.html?id=' + orc.id + '" class="btn-icon view" title="Visualizar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></a>' +
            '<button class="btn-icon edit" title="Alterar Status" data-id="' + orc.id + '" data-status="' + (orc.status || 'pendente') + '" data-action="status-orc"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></button>' +
            '<button class="btn-icon delete" title="Excluir" data-id="' + orc.id + '" data-action="deletar-orc"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
            '</td></tr>';
    }).join('');

    tbody.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'status-orc') abrirModalStatus(id, btn.getAttribute('data-status'));
        if (action === 'deletar-orc') confirmarDeleteOrcamento(id);
    });
}

/* ============================================================
   Status Modal
   ============================================================ */

function abrirModalStatus(id, statusAtual) {
    document.getElementById('statusOrcamentoId').value = id;
    document.getElementById('novoStatus').value = statusAtual;
    document.getElementById('modalStatus').classList.add('active');
}

function fecharModalStatus() {
    document.getElementById('modalStatus').classList.remove('active');
}

async function confirmarMudarStatus() {
    const id = document.getElementById('statusOrcamentoId').value;
    const status = document.getElementById('novoStatus').value;
    const btn = document.getElementById('btnConfirmarStatus');

    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        await apiPut('/api/orcamentos/' + id + '/status', { status: status });
        showToast('Status atualizado com sucesso!', 'success');
        fecharModalStatus();
        carregarOrcamentos();
    } catch (error) {
        showToast('Erro ao atualizar status: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirmar';
    }
}

/* ============================================================
   Delete Modal
   ============================================================ */

function confirmarDeleteOrcamento(id) {
    deleteOrcamentoId = id;
    document.getElementById('modalConfirmDeleteOrcamento').classList.add('active');
}

function fecharConfirmDeleteOrcamento() {
    document.getElementById('modalConfirmDeleteOrcamento').classList.remove('active');
    deleteOrcamentoId = null;
}

async function executarDeleteOrcamento() {
    if (!deleteOrcamentoId) return;
    const btn = document.getElementById('btnConfirmarDeleteOrcamento');

    btn.disabled = true;
    btn.textContent = 'Excluindo...';

    try {
        await apiDelete('/api/orcamentos/' + deleteOrcamentoId);
        showToast('Orçamento excluído com sucesso!', 'success');
        fecharConfirmDeleteOrcamento();
        carregarOrcamentos();
    } catch (error) {
        showToast('Erro ao excluir: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Excluir';
    }
}
