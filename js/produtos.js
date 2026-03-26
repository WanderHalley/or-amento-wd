/**
 * ============================================================
 * produtos.js — CRUD de Produtos
 * ============================================================
 */

/* Estado local */
let produtosData = [];
let deleteProdutoId = null;

/* ============================================================
   Inicialização
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initSidebar();
    aplicarMascarasProduto();
    carregarProdutos();
    bindEventosProduto();
});

function aplicarMascarasProduto() {
    maskInput(document.getElementById('produtoValor'), 'currency');
}

function bindEventosProduto() {
    const btnNovo = document.getElementById('btnNovoProduto');
    if (btnNovo) btnNovo.addEventListener('click', abrirModalProduto);

    const btnFechar = document.getElementById('btnFecharModalProduto');
    if (btnFechar) btnFechar.addEventListener('click', fecharModalProduto);

    const btnCancelar = document.getElementById('btnCancelarProduto');
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalProduto);

    const form = document.getElementById('formProduto');
    if (form) form.addEventListener('submit', salvarProduto);

    const btnFecharDel = document.getElementById('btnFecharDeleteProduto');
    if (btnFecharDel) btnFecharDel.addEventListener('click', fecharConfirmDeleteProduto);

    const btnCancelarDel = document.getElementById('btnCancelarDeleteProduto');
    if (btnCancelarDel) btnCancelarDel.addEventListener('click', fecharConfirmDeleteProduto);

    const btnConfirmarDel = document.getElementById('btnConfirmarDeleteProduto');
    if (btnConfirmarDel) btnConfirmarDel.addEventListener('click', executarDeleteProduto);

    const inputBusca = document.getElementById('buscaProduto');
    if (inputBusca) {
        const buscaDebounced = debounce(function () {
            carregarProdutos(inputBusca.value.trim());
        }, 400);
        inputBusca.addEventListener('input', buscaDebounced);
    }

    const inputImagem = document.getElementById('produtoImagem');
    if (inputImagem) inputImagem.addEventListener('change', handleImagemProduto);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            fecharModalProduto();
            fecharConfirmDeleteProduto();
        }
    });
}

/* ============================================================
   Imagem — Upload preview
   ============================================================ */

async function handleImagemProduto(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('produtoImagemPreview');
    const hiddenBase64 = document.getElementById('produtoImagemBase64');

    if (!file) {
        previewContainer.innerHTML = '';
        hiddenBase64.value = '';
        return;
    }

    try {
        const base64 = await readImageAsBase64(file, 2);
        hiddenBase64.value = base64;
        previewContainer.innerHTML = '<img src="' + base64 + '" alt="Preview">' +
            '<br><button type="button" class="btn btn-danger btn-sm" id="btnRemoverImagemProduto">Remover imagem</button>';
        const btnRemover = document.getElementById('btnRemoverImagemProduto');
        if (btnRemover) {
            btnRemover.addEventListener('click', function () {
                previewContainer.innerHTML = '';
                hiddenBase64.value = '';
                document.getElementById('produtoImagem').value = '';
            });
        }
    } catch (error) {
        showToast(error.message, 'error');
        event.target.value = '';
    }
}

/* ============================================================
   Carregar / Renderizar
   ============================================================ */

async function carregarProdutos(busca) {
    const tbody = document.getElementById('tabelaProdutos');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';

    try {
        let endpoint = '/api/produtos?limit=200';
        if (busca) endpoint += '&busca=' + encodeURIComponent(busca);

        const result = await apiGet(endpoint);

        if (result.success) {
            produtosData = result.data || [];
            renderizarProdutos(produtosData);
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">' +
            '<h4>Erro ao carregar produtos</h4>' +
            '<p>' + escapeHtml(error.message) + '</p>' +
            '</div></td></tr>';
        showToast('Erro ao carregar produtos', 'error');
    }
}

function renderizarProdutos(produtos) {
    const tbody = document.getElementById('tabelaProdutos');
    if (!tbody) return;

    if (!produtos || produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' +
            '<h4>Nenhum produto cadastrado</h4>' +
            '<p>Adicione seu primeiro produto para começar</p>' +
            '</div></td></tr>';
        return;
    }

    tbody.innerHTML = produtos.map(function (p) {
        const dims = [];
        if (p.altura_cm) dims.push('A: ' + p.altura_cm + 'cm');
        if (p.largura_cm) dims.push('L: ' + p.largura_cm + 'cm');
        if (p.profundidade_cm) dims.push('P: ' + p.profundidade_cm + 'cm');
        const dimStr = dims.length > 0 ? dims.join(' × ') : '-';

        const imgSrc = p.imagem_base64 || p.imagem_url || '';
        const imgHtml = imgSrc
            ? '<img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(p.nome) + '" style="width:48px;height:48px;object-fit:cover;border-radius:6px;">'
            : '<div style="width:48px;height:48px;background:var(--bg-hover);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;">SEM</div>';

        return '<tr>' +
            '<td>' + imgHtml + '</td>' +
            '<td><strong>' + escapeHtml(p.nome) + '</strong>' +
            (p.descricao ? '<br><small style="color:var(--text-muted);">' + escapeHtml(p.descricao.substring(0, 80)) + (p.descricao.length > 80 ? '...' : '') + '</small>' : '') +
            '</td>' +
            '<td>' + dimStr + '</td>' +
            '<td>' + (p.peso_kg ? p.peso_kg + ' kg' : '-') + '</td>' +
            '<td><strong style="color:var(--color-primary);">' + formatCurrency(p.valor) + '</strong></td>' +
            '<td><span class="badge ' + (p.ativo ? 'badge-aprovado' : 'badge-expirado') + '">' + (p.ativo ? 'Ativo' : 'Inativo') + '</span></td>' +
            '<td>' +
            '<button class="btn-icon edit" title="Editar" data-id="' + p.id + '" data-action="editar-produto">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
            '</button>' +
            '<button class="btn-icon delete" title="Excluir" data-id="' + p.id + '" data-action="deletar-produto">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
            '</td>' +
            '</tr>';
    }).join('');

    tbody.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'editar-produto') editarProduto(id);
        if (action === 'deletar-produto') confirmarDeleteProduto(id);
    });
}

/* ============================================================
   Modal — Abrir / Fechar
   ============================================================ */

function abrirModalProduto() {
    document.getElementById('modalProdutoTitulo').textContent = 'Novo Produto';
    document.getElementById('formProduto').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('produtoImagemBase64').value = '';
    document.getElementById('produtoImagemPreview').innerHTML = '';
    document.getElementById('produtoAtivo').value = 'true';
    document.getElementById('modalProduto').classList.add('active');
}

function fecharModalProduto() {
    document.getElementById('modalProduto').classList.remove('active');
}

async function editarProduto(id) {
    try {
        const result = await apiGet('/api/produtos/' + id);
        if (result.success && result.data) {
            const p = result.data;
            document.getElementById('modalProdutoTitulo').textContent = 'Editar Produto';
            document.getElementById('produtoId').value = p.id;
            document.getElementById('produtoNome').value = p.nome || '';
            document.getElementById('produtoDescricao').value = p.descricao || '';
            document.getElementById('produtoEspecificacoes').value = p.especificacoes || '';
            document.getElementById('produtoValor').value = p.valor ? Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
            document.getElementById('produtoAltura').value = p.altura_cm || '';
            document.getElementById('produtoLargura').value = p.largura_cm || '';
            document.getElementById('produtoProfundidade').value = p.profundidade_cm || '';
            document.getElementById('produtoPeso').value = p.peso_kg || '';
            document.getElementById('produtoAtivo').value = p.ativo ? 'true' : 'false';
            document.getElementById('produtoImagemUrl').value = p.imagem_url || '';

            /* Preview de imagem existente */
            const previewContainer = document.getElementById('produtoImagemPreview');
            const hiddenBase64 = document.getElementById('produtoImagemBase64');
            hiddenBase64.value = p.imagem_base64 || '';

            const imgSrc = p.imagem_base64 || p.imagem_url || '';
            if (imgSrc) {
                previewContainer.innerHTML = '<img src="' + escapeHtml(imgSrc) + '" alt="Preview">' +
                    '<br><button type="button" class="btn btn-danger btn-sm" id="btnRemoverImagemProdutoEdit">Remover imagem</button>';
                const btnRemover = document.getElementById('btnRemoverImagemProdutoEdit');
                if (btnRemover) {
                    btnRemover.addEventListener('click', function () {
                        previewContainer.innerHTML = '';
                        hiddenBase64.value = '';
                        document.getElementById('produtoImagem').value = '';
                        document.getElementById('produtoImagemUrl').value = '';
                    });
                }
            } else {
                previewContainer.innerHTML = '';
            }

            document.getElementById('modalProduto').classList.add('active');
        }
    } catch (error) {
        showToast('Erro ao carregar produto', 'error');
    }
}

/* ============================================================
   Salvar (Criar / Atualizar)
   ============================================================ */

async function salvarProduto(event) {
    event.preventDefault();

    const btnSalvar = document.getElementById('btnSalvarProduto');
    const id = document.getElementById('produtoId').value;

    const dados = {
        nome: document.getElementById('produtoNome').value.trim(),
        descricao: document.getElementById('produtoDescricao').value.trim() || null,
        especificacoes: document.getElementById('produtoEspecificacoes').value.trim() || null,
        valor: parseCurrency(document.getElementById('produtoValor').value),
        altura_cm: parseFloat(document.getElementById('produtoAltura').value) || null,
        largura_cm: parseFloat(document.getElementById('produtoLargura').value) || null,
        profundidade_cm: parseFloat(document.getElementById('produtoProfundidade').value) || null,
        peso_kg: parseFloat(document.getElementById('produtoPeso').value) || null,
        imagem_url: document.getElementById('produtoImagemUrl').value.trim() || null,
        imagem_base64: document.getElementById('produtoImagemBase64').value || null,
        ativo: document.getElementById('produtoAtivo').value === 'true',
    };

    if (!dados.nome) {
        showToast('O nome do produto é obrigatório', 'warning');
        return;
    }
    if (!dados.valor || dados.valor <= 0) {
        showToast('Informe um valor válido para o produto', 'warning');
        return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
        if (id) {
            await apiPut('/api/produtos/' + id, dados);
            showToast('Produto atualizado com sucesso!', 'success');
        } else {
            await apiPost('/api/produtos', dados);
            showToast('Produto criado com sucesso!', 'success');
        }
        fecharModalProduto();
        carregarProdutos();
    } catch (error) {
        showToast('Erro ao salvar: ' + error.message, 'error');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar Produto';
    }
}

/* ============================================================
   Excluir
   ============================================================ */

function confirmarDeleteProduto(id) {
    deleteProdutoId = id;
    document.getElementById('modalConfirmDeleteProduto').classList.add('active');
}

function fecharConfirmDeleteProduto() {
    document.getElementById('modalConfirmDeleteProduto').classList.remove('active');
    deleteProdutoId = null;
}

async function executarDeleteProduto() {
    if (!deleteProdutoId) return;

    const btnDel = document.getElementById('btnConfirmarDeleteProduto');
    btnDel.disabled = true;
    btnDel.textContent = 'Excluindo...';

    try {
        await apiDelete('/api/produtos/' + deleteProdutoId);
        showToast('Produto excluído com sucesso!', 'success');
        fecharConfirmDeleteProduto();
        carregarProdutos();
    } catch (error) {
        showToast('Erro ao excluir: ' + error.message, 'error');
    } finally {
        btnDel.disabled = false;
        btnDel.textContent = 'Excluir';
    }
}
