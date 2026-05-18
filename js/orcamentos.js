/**
 * orcamentos.js — Aba Orçamentos (SPA)
 * Função de entrada: init_orcamentos()
 */

let orcamentosData = [];
let orcProdutos = [];
let orcClientes = [];
let deleteOrcamentoId = null;
let itemCounter = 0;

function extrairArrayOrcamentos(data, chave) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data[chave] && Array.isArray(data[chave])) return data[chave];
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
}

// ========== INIT (chamada pelo sistema de abas) ==========
function init_orcamentos() {
    console.log('[Orçamentos] Inicializando...');
    mostrarLista();
}

function mostrarLista() {
    const secaoLista = document.getElementById('secaoLista');
    const secaoFormulario = document.getElementById('secaoFormulario');
    const btnNovo = document.getElementById('btnNovoOrcamento');

    if (secaoLista) secaoLista.style.display = 'block';
    if (secaoFormulario) secaoFormulario.style.display = 'none';
    if (btnNovo) btnNovo.style.display = '';

    carregarOrcamentos();
}

async function mostrarFormulario() {
    const secaoLista = document.getElementById('secaoLista');
    const secaoFormulario = document.getElementById('secaoFormulario');
    const btnNovo = document.getElementById('btnNovoOrcamento');

    if (secaoLista) secaoLista.style.display = 'none';
    if (secaoFormulario) secaoFormulario.style.display = 'block';
    if (btnNovo) btnNovo.style.display = 'none';

    const form = document.getElementById('formOrcamento');
    if (form) form.reset();

    const tbodyItens = document.getElementById('tabelaItensOrcamento');
    if (tbodyItens) tbodyItens.innerHTML = '';

    const totalDisplay = document.getElementById('orcTotalDisplay');
    if (totalDisplay) totalDisplay.textContent = 'R$ 0,00';

    itemCounter = 0;

    const config = typeof getConfig === 'function' ? getConfig() : {};
    const validadeDias = config.validadeDias || 15;

    const dataEmissao = document.getElementById('orcDataEmissao');
    const dataValidade = document.getElementById('orcDataValidade');
    if (dataEmissao) dataEmissao.value = getToday();
    if (dataValidade) dataValidade.value = getDatePlusDays(validadeDias);

    const formaPag = document.getElementById('orcFormaPagamento');
    const prazoEnt = document.getElementById('orcPrazoEntrega');
    const obs = document.getElementById('orcObservacoes');

    if (formaPag && config.condicoesPadrao) formaPag.value = config.condicoesPadrao;
    if (prazoEnt && config.prazoEntregaPadrao) prazoEnt.value = config.prazoEntregaPadrao;
    if (obs && config.observacoesPadrao) obs.value = config.observacoesPadrao;

    await carregarClientesParaSelect();
    await carregarProdutosParaSelect();
    adicionarItem();
}

async function carregarClientesParaSelect() {
    const select = document.getElementById('orcCliente');
    if (!select) return;
    select.innerHTML = '<option value="">Carregando...</option>';
    try {
        const data = await apiGet('/api/clientes?limit=200');
        orcClientes = extrairArrayOrcamentos(data, 'clientes');
        select.innerHTML = '<option value="">Selecione um cliente...</option>';
        orcClientes.forEach(c => {
            const label = c.empresa ? `${c.nome} (${c.empresa})` : c.nome;
            select.innerHTML += `<option value="${c.id}">${escapeHtml(label)}</option>`;
        });
    } catch (error) {
        console.error('[Orçamentos] Erro ao carregar clientes:', error);
        select.innerHTML = '<option value="">Erro ao carregar clientes</option>';
    }
}

async function carregarProdutosParaSelect() {
    try {
        const data = await apiGet('/api/produtos?ativo=true&limit=200');
        orcProdutos = extrairArrayOrcamentos(data, 'produtos');
    } catch (error) {
        console.error('[Orçamentos] Erro ao carregar produtos:', error);
        orcProdutos = [];
    }
}

function adicionarItem() {
    itemCounter++;
    const tbody = document.getElementById('tabelaItensOrcamento');
    if (!tbody) return;

    let optionsHtml = '<option value="">Selecione...</option>';
    orcProdutos.forEach(p => {
        const precoFormatado = formatCurrency(p.valor);
        optionsHtml += `<option value="${p.id}" data-valor="${p.valor}">${escapeHtml(p.nome)} — ${precoFormatado}</option>`;
    });

    const tr = document.createElement('tr');
    tr.id = `item-row-${itemCounter}`;
    tr.innerHTML = `
        <td><select class="form-input item-produto" data-row="${itemCounter}" onchange="atualizarItemValor(${itemCounter})">${optionsHtml}</select></td>
        <td><input type="number" class="form-input item-quantidade" data-row="${itemCounter}" value="1" min="1" onchange="recalcularTotal()" oninput="recalcularTotal()"></td>
        <td><input type="number" class="form-input item-valor-unit" data-row="${itemCounter}" value="0" min="0" step="0.01" onchange="recalcularTotal()" oninput="recalcularTotal()"></td>
        <td><span class="item-subtotal" data-row="${itemCounter}" data-valor="0">R$ 0,00</span></td>
        <td><button type="button" class="btn btn-danger btn-sm" onclick="removerItem(${itemCounter})">🗑️</button></td>`;
    tbody.appendChild(tr);
}

function atualizarItemValor(rowId) {
    const select = document.querySelector(`.item-produto[data-row="${rowId}"]`);
    const valorInput = document.querySelector(`.item-valor-unit[data-row="${rowId}"]`);
    if (select && valorInput) {
        const selectedOption = select.options[select.selectedIndex];
        valorInput.value = parseFloat(selectedOption?.dataset?.valor || 0).toFixed(2);
        recalcularTotal();
    }
}

function removerItem(rowId) {
    const row = document.getElementById(`item-row-${rowId}`);
    if (row) { row.remove(); recalcularTotal(); }
}

function recalcularTotal() {
    let total = 0;
    document.querySelectorAll('#tabelaItensOrcamento tr').forEach(row => {
        const qtdInput = row.querySelector('.item-quantidade');
        const valorInput = row.querySelector('.item-valor-unit');
        const subtotalSpan = row.querySelector('.item-subtotal');
        if (qtdInput && valorInput && subtotalSpan) {
            const subtotal = (parseInt(qtdInput.value) || 0) * (parseFloat(valorInput.value) || 0);
            subtotalSpan.textContent = formatCurrency(subtotal);
            subtotalSpan.dataset.valor = subtotal;
            total += subtotal;
        }
    });
    const totalDisplay = document.getElementById('orcTotalDisplay');
    if (totalDisplay) totalDisplay.textContent = formatCurrency(total);
}

async function salvarOrcamento(event) {
    event.preventDefault();
    const clienteId = document.getElementById('orcCliente')?.value || '';
    if (!clienteId) { showToast('Selecione um cliente', 'warning'); return; }

    const itens = [];
    document.querySelectorAll('#tabelaItensOrcamento tr').forEach(row => {
        const produtoSelect = row.querySelector('.item-produto');
        const qtdInput = row.querySelector('.item-quantidade');
        const valorInput = row.querySelector('.item-valor-unit');
        if (produtoSelect && qtdInput && valorInput) {
            const produtoId = produtoSelect.value;
            const quantidade = parseInt(qtdInput.value) || 0;
            const valorUnitario = parseFloat(valorInput.value) || 0;
            if (produtoId && quantidade > 0) itens.push({ produto_id: produtoId, quantidade, valor_unitario: valorUnitario });
        }
    });
    if (itens.length === 0) { showToast('Adicione pelo menos um item', 'warning'); return; }

    const dados = {
        cliente_id: clienteId,
        data_emissao: document.getElementById('orcDataEmissao')?.value || null,
        data_validade: document.getElementById('orcDataValidade')?.value || null,
        forma_pagamento: document.getElementById('orcFormaPagamento')?.value.trim() || null,
        prazo_entrega: document.getElementById('orcPrazoEntrega')?.value.trim() || null,
        observacoes: document.getElementById('orcObservacoes')?.value.trim() || null,
        itens: itens,
    };

    try {
        const result = await apiPost('/api/orcamentos', dados);
        const orcId = result.id || result.data?.id || result.orcamento?.id;
        showToast('Orçamento criado com sucesso!', 'success');
        if (orcId) {
            setTimeout(() => { window.open(`preview.html?id=${orcId}`, '_blank'); }, 300);
        }
        mostrarLista();
    } catch (error) {
        console.error('[Orçamentos] Erro ao salvar:', error);
        showToast(`Erro ao salvar: ${error.message}`, 'error');
    }
}

async function carregarOrcamentos() {
    const tbody = document.getElementById('tabelaOrcamentos');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px;"><div class="spinner"></div><p>Carregando...</p></td></tr>';

    try {
        let url = '/api/orcamentos?limit=100';
        const status = document.getElementById('filtroStatus')?.value || '';
        if (status) url += `&status=${status}`;
        const busca = document.getElementById('buscaOrcamento')?.value || '';
        if (busca) url += `&busca=${encodeURIComponent(busca)}`;

        const data = await apiGet(url);
        orcamentosData = extrairArrayOrcamentos(data, 'orcamentos');
        renderizarOrcamentos(orcamentosData);
    } catch (error) {
        console.error('[Orçamentos] Erro:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px;"><p>Erro ao carregar orçamentos.</p></td></tr>';
        showToast('Erro ao carregar orçamentos', 'error');
    }
}

function renderizarOrcamentos(orcamentos) {
    const tbody = document.getElementById('tabelaOrcamentos');
    if (!tbody) return;

    if (!orcamentos || orcamentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px;"><p>Nenhum orçamento encontrado.</p><button class="btn btn-primary btn-sm" onclick="mostrarFormulario()" style="margin-top:10px;">+ Criar orçamento</button></td></tr>';
        return;
    }

    tbody.innerHTML = orcamentos.map(orc => {
        const numero = orc.numero || orc.numero_orcamento || orc.id?.substring(0, 8) || '-';
        const clienteNome = orc.cliente_nome || orc.cliente?.nome || '-';
        const clienteEmpresa = orc.cliente_empresa || orc.cliente?.empresa || '';
        const nomeDisplay = clienteEmpresa ? `${escapeHtml(clienteNome)}<br><small>${escapeHtml(clienteEmpresa)}</small>` : escapeHtml(clienteNome);
        const emissao = formatDate(orc.data_emissao || orc.created_at);
        const validade = orc.data_validade ? formatDate(orc.data_validade) : '-';
        const valor = formatCurrency(orc.valor_total || 0);
        const status = orc.status || 'pendente';
        const badgeClass = { 'pendente': 'badge-warning', 'aprovado': 'badge-success', 'recusado': 'badge-danger', 'expirado': 'badge-secondary' }[status] || 'badge-secondary';
        const statusLabel = { 'pendente': 'Pendente', 'aprovado': 'Aprovado', 'recusado': 'Recusado', 'expirado': 'Expirado' }[status] || status;

        return `<tr>
            <td><strong>#${escapeHtml(String(numero))}</strong></td>
            <td>${nomeDisplay}</td>
            <td>${emissao}</td>
            <td>${validade}</td>
            <td><strong>${valor}</strong></td>
            <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
            <td>
                <div style="display:flex; gap:5px; flex-wrap:wrap;">
                    <a href="preview.html?id=${orc.id}" target="_blank" class="btn btn-outline btn-sm" title="Visualizar">👁️</a>
                    <button class="btn btn-secondary btn-sm" onclick="abrirModalStatus('${orc.id}', '${status}')" title="Status">🔄</button>
                    <button class="btn btn-danger btn-sm" onclick="confirmarDeleteOrcamento('${orc.id}')" title="Excluir">🗑️</button>
                </div>
            </td></tr>`;
    }).join('');
}

const buscarOrcamentosDebounced = debounce(() => carregarOrcamentos(), 400);

function abrirModalStatus(id, statusAtual) {
    const idInput = document.getElementById('statusOrcamentoId');
    const statusSelect = document.getElementById('novoStatus');
    const modal = document.getElementById('modalStatus');
    if (idInput) idInput.value = id;
    if (statusSelect) statusSelect.value = statusAtual;
    if (modal) modal.classList.add('active');
}

function fecharModalStatus() {
    const modal = document.getElementById('modalStatus');
    if (modal) modal.classList.remove('active');
}

async function confirmarMudarStatus() {
    const id = document.getElementById('statusOrcamentoId')?.value || '';
    const novoStatus = document.getElementById('novoStatus')?.value || '';
    if (!id || !novoStatus) return;
    try {
        await apiPut(`/api/orcamentos/${id}/status`, { status: novoStatus });
        showToast('Status atualizado!', 'success');
        fecharModalStatus();
        carregarOrcamentos();
    } catch (error) {
        console.error('[Orçamentos] Erro ao mudar status:', error);
        showToast(`Erro: ${error.message}`, 'error');
    }
}

function confirmarDeleteOrcamento(id) {
    deleteOrcamentoId = id;
    const modal = document.getElementById('confirmDeleteOrcamento');
    if (modal) modal.classList.add('active');
}

function fecharConfirmDeleteOrcamento() {
    deleteOrcamentoId = null;
    const modal = document.getElementById('confirmDeleteOrcamento');
    if (modal) modal.classList.remove('active');
}

async function deletarOrcamento() {
    if (!deleteOrcamentoId) return;
    try {
        await apiDelete(`/api/orcamentos/${deleteOrcamentoId}`);
        showToast('Orçamento excluído!', 'success');
        fecharConfirmDeleteOrcamento();
        carregarOrcamentos();
    } catch (error) {
        console.error('[Orçamentos] Erro:', error);
        showToast(`Erro: ${error.message}`, 'error');
        fecharConfirmDeleteOrcamento();
    }
}
