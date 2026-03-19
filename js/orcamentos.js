/**
 * orcamentos.js — CRUD de Orçamentos com itens dinâmicos
 * Depende de: app.js
 */

// ========== ESTADO LOCAL ==========
let orcamentosData = [];
let orcProdutos = [];
let orcClientes = [];
let deleteOrcamentoId = null;
let itemCounter = 0;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initTheme === 'function') initTheme();
    if (typeof initSidebar === 'function') initSidebar();
    if (typeof updateThemeIcon === 'function') updateThemeIcon();

    // Se URL tem ?novo=1, abrir formulário direto
    const params = new URLSearchParams(window.location.search);
    if (params.get('novo') === '1') {
        mostrarFormulario();
    } else {
        carregarOrcamentos();
    }
});

// ========== ALTERNAR LISTA / FORMULÁRIO ==========
function mostrarLista() {
    document.getElementById('secaoLista').style.display = 'block';
    document.getElementById('secaoFormulario').style.display = 'none';
    document.getElementById('btnNovoOrcamento').style.display = '';
    carregarOrcamentos();
}

async function mostrarFormulario() {
    document.getElementById('secaoLista').style.display = 'none';
    document.getElementById('secaoFormulario').style.display = 'block';
    document.getElementById('btnNovoOrcamento').style.display = 'none';

    // Reset
    document.getElementById('formOrcamento').reset();
    document.getElementById('tabelaItensOrcamento').innerHTML = '';
    document.getElementById('orcTotalDisplay').textContent = 'R$ 0,00';
    itemCounter = 0;

    // Datas padrão
    const config = typeof getConfig === 'function' ? getConfig() : {};
    const validadeDias = config.validadeDias || 15;
    document.getElementById('orcDataEmissao').value = getToday();
    document.getElementById('orcDataValidade').value = getDatePlusDays(validadeDias);

    // Condições padrão
    if (config.condicoesPadrao) {
        document.getElementById('orcFormaPagamento').value = config.condicoesPadrao;
    }
    if (config.prazoEntregaPadrao) {
        document.getElementById('orcPrazoEntrega').value = config.prazoEntregaPadrao;
    }
    if (config.observacoesPadrao) {
        document.getElementById('orcObservacoes').value = config.observacoesPadrao;
    }

    // Carregar clientes e produtos para os selects
    await carregarClientesParaSelect();
    await carregarProdutosParaSelect();

    // Adicionar primeiro item
    adicionarItem();
}

// ========== CARREGAR CLIENTES PARA SELECT ==========
async function carregarClientesParaSelect() {
    const select = document.getElementById('orcCliente');
    select.innerHTML = '<option value="">Carregando...</option>';

    try {
        const data = await apiGet('/api/clientes?limit=200');
        orcClientes = data.clientes || data || [];

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

// ========== CARREGAR PRODUTOS PARA SELECT ==========
async function carregarProdutosParaSelect() {
    try {
        const data = await apiGet('/api/produtos?ativo=true&limit=200');
        orcProdutos = data.produtos || data || [];
        console.log('[Orçamentos] Produtos para select:', orcProdutos.length);
    } catch (error) {
        console.error('[Orçamentos] Erro ao carregar produtos:', error);
        orcProdutos = [];
    }
}

// ========== ITENS DINÂMICOS ==========
function adicionarItem() {
    itemCounter++;
    const tbody = document.getElementById('tabelaItensOrcamento');

    // Select de produtos
    let optionsHtml = '<option value="">Selecione...</option>';
    orcProdutos.forEach(p => {
        optionsHtml += `<option value="${p.id}" data-valor="${p.valor}">${escapeHtml(p.nome)} — ${formatCurrency(p.valor)}</option>`;
    });

    const tr = document.createElement('tr');
    tr.id = `item-row-${itemCounter}`;
    tr.innerHTML = `
        <td>
            <select class="form-input item-produto" data-row="${itemCounter}" onchange="atualizarItemValor(${itemCounter})">
                ${optionsHtml}
            </select>
        </td>
        <td>
            <input type="number" class="form-input item-quantidade" data-row="${itemCounter}" value="1" min="1" onchange="recalcularTotal()" oninput="recalcularTotal()">
        </td>
        <td>
            <input type="number" class="form-input item-valor-unit" data-row="${itemCounter}" value="0" min="0" step="0.01" onchange="recalcularTotal()" oninput="recalcularTotal()">
        </td>
        <td>
            <span class="item-subtotal" data-row="${itemCounter}" data-valor="0">R$ 0,00</span>
        </td>
        <td>
            <button type="button" class="btn btn-danger btn-sm" onclick="removerItem(${itemCounter})">🗑️</button>
        </td>`;

    tbody.appendChild(tr);
}

function atualizarItemValor(rowId) {
    const select = document.querySelector(`.item-produto[data-row="${rowId}"]`);
    const valorInput = document.querySelector(`.item-valor-unit[data-row="${rowId}"]`);

    if (select && valorInput) {
        const selectedOption = select.options[select.selectedIndex];
        const valor = parseFloat(selectedOption?.dataset?.valor || 0);
        valorInput.value = valor.toFixed(2);
        recalcularTotal();
    }
}

function removerItem(rowId) {
    const row = document.getElementById(`item-row-${rowId}`);
    if (row) {
        row.remove();
        recalcularTotal();
    }
}

function recalcularTotal() {
    let total = 0;
    const rows = document.querySelectorAll('#tabelaItensOrcamento tr');

    rows.forEach(row => {
        const qtdInput = row.querySelector('.item-quantidade');
        const valorInput = row.querySelector('.item-valor-unit');
        const subtotalSpan = row.querySelector('.item-subtotal');

        if (qtdInput && valorInput && subtotalSpan) {
            const qtd = parseInt(qtdInput.value) || 0;
            const valorUnit = parseFloat(valorInput.value) || 0;
            const subtotal = qtd * valorUnit;

            subtotalSpan.textContent = formatCurrency(subtotal);
            subtotalSpan.dataset.valor = subtotal;
            total += subtotal;
        }
    });

    document.getElementById('orcTotalDisplay').textContent = formatCurrency(total);
}

// ========== SALVAR ORÇAMENTO ==========
async function salvarOrcamento(event) {
    event.preventDefault();

    const clienteId = document.getElementById('orcCliente').value;
    if (!clienteId) {
        showToast('Selecione um cliente', 'warning');
        return;
    }

    // Coletar itens
    const itens = [];
    const rows = document.querySelectorAll('#tabelaItensOrcamento tr');

    rows.forEach(row => {
        const produtoSelect = row.querySelector('.item-produto');
        const qtdInput = row.querySelector('.item-quantidade');
        const valorInput = row.querySelector('.item-valor-unit');

        if (produtoSelect && qtdInput && valorInput) {
            const produtoId = produtoSelect.value;
            const quantidade = parseInt(qtdInput.value) || 0;
            const valorUnitario = parseFloat(valorInput.value) || 0;

            if (produtoId && quantidade > 0) {
                itens.push({
                    produto_id: produtoId,
                    quantidade: quantidade,
                    valor_unitario: valorUnitario,
                });
            }
        }
    });

    if (itens.length === 0) {
        showToast('Adicione pelo menos um item ao orçamento', 'warning');
        return;
    }

    const dados = {
        cliente_id: clienteId,
        data_emissao: document.getElementById('orcDataEmissao').value || null,
        data_validade: document.getElementById('orcDataValidade').value || null,
        forma_pagamento: document.getElementById('orcFormaPagamento').value.trim() || null,
        prazo_entrega: document.getElementById('orcPrazoEntrega').value.trim() || null,
        observacoes: document.getElementById('orcObservacoes').value.trim() || null,
        itens: itens,
    };

    console.log('[Orçamentos] Salvando:', dados);

    try {
        const result = await apiPost('/api/orcamentos', dados);
        const orcId = result.id || result.orcamento?.id;

        showToast('Orçamento criado com sucesso!', 'success');

        // Redirecionar para preview
        if (orcId) {
            setTimeout(() => {
                window.location.href = `preview.html?id=${orcId}`;
            }, 500);
        } else {
            mostrarLista();
        }

    } catch (error) {
        console.error('[Orçamentos] Erro ao salvar:', error);
        showToast(`Erro ao salvar orçamento: ${error.message}`, 'error');
    }
}

// ========== CARREGAR LISTA DE ORÇAMENTOS ==========
async function carregarOrcamentos() {
    const tbody = document.getElementById('tabelaOrcamentos');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-state">
                <div class="loading-spinner"></div>
                <p>Carregando...</p>
            </td>
        </tr>`;

    try {
        let url = '/api/orcamentos?limit=100';

        const status = document.getElementById('filtroStatus')?.value;
        if (status) url += `&status=${status}`;

        const busca = document.getElementById('buscaOrcamento')?.value;
        if (busca) url += `&busca=${encodeURIComponent(busca)}`;

        const data = await apiGet(url);
        orcamentosData = data.orcamentos || data || [];

        console.log('[Orçamentos] Carregados:', orcamentosData.length);
        renderizarOrcamentos(orcamentosData);

    } catch (error) {
        console.error('[Orçamentos] Erro ao carregar:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <p>Erro ao carregar orçamentos.</p>
                </td>
            </tr>`;
        showToast('Erro ao carregar orçamentos', 'error');
    }
}

// ========== RENDERIZAR LISTA ==========
function renderizarOrcamentos(orcamentos) {
    const tbody = document.getElementById('tabelaOrcamentos');
    if (!tbody) return;

    if (!orcamentos || orcamentos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <p>Nenhum orçamento encontrado.</p>
                    <button class="btn btn-primary btn-sm" onclick="mostrarFormulario()" style="margin-top:10px;">+ Criar orçamento</button>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = orcamentos.map(orc => {
        const numero = orc.numero || orc.id?.substring(0, 8) || '-';
        const clienteNome = orc.cliente_nome || orc.cliente?.nome || '-';
        const clienteEmpresa = orc.cliente_empresa || orc.cliente?.empresa || '';
        const nomeDisplay = clienteEmpresa ? `${escapeHtml(clienteNome)}<br><small>${escapeHtml(clienteEmpresa)}</small>` : escapeHtml(clienteNome);

        const emissao = formatDate(orc.data_emissao || orc.created_at);
        const validade = orc.data_validade ? formatDate(orc.data_validade) : '-';
        const valor = formatCurrency(orc.valor_total || 0);
        const status = orc.status || 'pendente';

        const badgeClass = {
            'pendente': 'badge-warning',
            'aprovado': 'badge-success',
            'recusado': 'badge-danger',
            'expirado': 'badge-secondary'
        }[status] || 'badge-secondary';

        const statusLabel = {
            'pendente': 'Pendente',
            'aprovado': 'Aprovado',
            'recusado': 'Recusado',
            'expirado': 'Expirado'
        }[status] || status;

        return `
            <tr>
                <td><strong>#${escapeHtml(String(numero))}</strong></td>
                <td>${nomeDisplay}</td>
                <td>${emissao}</td>
                <td>${validade}</td>
                <td><strong>${valor}</strong></td>
                <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
                <td>
                    <div style="display:flex; gap:5px; flex-wrap:wrap;">
                        <a href="preview.html?id=${orc.id}" class="btn btn-outline btn-sm" title="Visualizar">👁️</a>
                        <button class="btn btn-secondary btn-sm" onclick="abrirModalStatus('${orc.id}', '${status}')" title="Status">🔄</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmarDeleteOrcamento('${orc.id}')" title="Excluir">🗑️</button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

// ========== BUSCA COM DEBOUNCE ==========
const buscarOrcamentosDebounced = debounce(() => {
    carregarOrcamentos();
}, 400);

// ========== MODAL: MUDAR STATUS ==========
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
    const novoStatus = document.getElementById('novoStatus').value;

    if (!id || !novoStatus) return;

    try {
        await apiPut(`/api/orcamentos/${id}/status`, { status: novoStatus });
        showToast('Status atualizado com sucesso!', 'success');
        fecharModalStatus();
        carregarOrcamentos();

    } catch (error) {
        console.error('[Orçamentos] Erro ao mudar status:', error);
        showToast(`Erro ao atualizar status: ${error.message}`, 'error');
    }
}

// ========== MODAL: DELETAR ORÇAMENTO ==========
function confirmarDeleteOrcamento(id) {
    deleteOrcamentoId = id;
    document.getElementById('confirmDeleteOrcamento').classList.add('active');
}

function fecharConfirmDeleteOrcamento() {
    deleteOrcamentoId = null;
    document.getElementById('confirmDeleteOrcamento').classList.remove('active');
}

async function deletarOrcamento() {
    if (!deleteOrcamentoId) return;

    try {
        await apiDelete(`/api/orcamentos/${deleteOrcamentoId}`);
        showToast('Orçamento excluído com sucesso!', 'success');
        fecharConfirmDeleteOrcamento();
        carregarOrcamentos();

    } catch (error) {
        console.error('[Orçamentos] Erro ao excluir:', error);
        showToast(`Erro ao excluir orçamento: ${error.message}`, 'error');
        fecharConfirmDeleteOrcamento();
    }
}
