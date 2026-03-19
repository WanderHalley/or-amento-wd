/**
 * preview.js — Renderiza o preview do orçamento para impressão/PDF/email
 * Depende de: app.js
 */

// ========== ESTADO ==========
let orcamentoData = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initTheme === 'function') initTheme();
    if (typeof initSidebar === 'function') initSidebar();
    if (typeof updateThemeIcon === 'function') updateThemeIcon();

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        document.getElementById('previewLoading').innerHTML = '<p>ID do orçamento não informado.</p>';
        showToast('ID do orçamento não encontrado na URL', 'error');
        return;
    }

    carregarOrcamento(id);
});

// ========== CARREGAR ORÇAMENTO ==========
async function carregarOrcamento(id) {
    try {
        const data = await apiGet(`/api/orcamentos/${id}`);
        orcamentoData = data;
        console.log('[Preview] Orçamento carregado:', data);

        renderizarPreview(data);

        document.getElementById('previewLoading').style.display = 'none';
        document.getElementById('previewArea').style.display = 'block';

    } catch (error) {
        console.error('[Preview] Erro ao carregar orçamento:', error);
        document.getElementById('previewLoading').innerHTML = `<p>Erro ao carregar orçamento: ${escapeHtml(error.message)}</p>`;
        showToast('Erro ao carregar orçamento', 'error');
    }
}

// ========== RENDERIZAR PREVIEW ==========
function renderizarPreview(orc) {
    const config = typeof getConfig === 'function' ? getConfig() : {};

    // === HEADER DA EMPRESA ===
    const headerEl = document.getElementById('previewHeader');
    let logoHtml = '';
    if (config.logo) {
        logoHtml = `<img src="${config.logo}" alt="Logo" style="max-height:80px; max-width:250px;">`;
    }

    headerEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
            <div>
                ${logoHtml}
                <h2 style="margin:5px 0 0 0;">${escapeHtml(config.nomeEmpresa || 'WD Máquinas')}</h2>
            </div>
            <div style="text-align:right; font-size:0.9em; color:var(--text-muted);">
                ${config.cnpj ? `<p>CNPJ: ${formatCNPJ(config.cnpj)}</p>` : ''}
                ${config.endereco ? `<p>${escapeHtml(config.endereco)}</p>` : ''}
                ${config.telefone ? `<p>Tel: ${formatPhone(config.telefone)}</p>` : ''}
                ${config.email ? `<p>${escapeHtml(config.email)}</p>` : ''}
                ${config.site ? `<p>${escapeHtml(config.site)}</p>` : ''}
            </div>
        </div>`;

    // === INFO DO ORÇAMENTO ===
    const infoEl = document.getElementById('previewInfo');
    const numero = orc.numero || orc.id?.substring(0, 8) || '-';
    const emissao = formatDate(orc.data_emissao || orc.created_at);
    const validade = orc.data_validade ? formatDate(orc.data_validade) : '-';
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

    infoEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding:15px; background:var(--bg-secondary); border-radius:var(--radius-md); margin:15px 0;">
            <div>
                <h3 style="margin:0;">Orçamento #${escapeHtml(String(numero))}</h3>
            </div>
            <div style="display:flex; gap:20px; flex-wrap:wrap; font-size:0.9em;">
                <span><strong>Emissão:</strong> ${emissao}</span>
                <span><strong>Validade:</strong> ${validade}</span>
                <span class="badge ${badgeClass}">${statusLabel}</span>
            </div>
        </div>`;

    // === DADOS DO CLIENTE ===
    const cliente = orc.cliente || {};
    const clienteContent = document.getElementById('previewClienteContent');
    clienteContent.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:10px; font-size:0.95em;">
            <p><strong>Nome:</strong> ${escapeHtml(cliente.nome || orc.cliente_nome || '-')}</p>
            ${cliente.empresa ? `<p><strong>Empresa:</strong> ${escapeHtml(cliente.empresa)}</p>` : ''}
            ${cliente.cpf_cnpj ? `<p><strong>CPF/CNPJ:</strong> ${formatCPFCNPJ(cliente.cpf_cnpj)}</p>` : ''}
            ${cliente.telefone ? `<p><strong>Telefone:</strong> ${formatPhone(cliente.telefone)}</p>` : ''}
            ${cliente.email ? `<p><strong>E-mail:</strong> ${escapeHtml(cliente.email)}</p>` : ''}
            ${cliente.endereco ? `<p><strong>Endereço:</strong> ${escapeHtml(cliente.endereco)}</p>` : ''}
            ${cliente.cidade || cliente.estado ? `<p><strong>Cidade/UF:</strong> ${escapeHtml(cliente.cidade || '')}${cliente.estado ? '/' + escapeHtml(cliente.estado) : ''}</p>` : ''}
            ${cliente.cep ? `<p><strong>CEP:</strong> ${formatCEP(cliente.cep)}</p>` : ''}
        </div>`;

    // === ITENS DO ORÇAMENTO ===
    const itens = orc.itens || [];
    const itensBody = document.getElementById('previewItensBody');
    const itensFoot = document.getElementById('previewItensFoot');
    let totalGeral = 0;

    if (itens.length === 0) {
        itensBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum item</td></tr>`;
    } else {
        itensBody.innerHTML = itens.map((item, index) => {
            const nomeProduto = item.produto_nome || item.produto?.nome || '-';
            const qtd = item.quantidade || 0;
            const valorUnit = item.valor_unitario || 0;
            const subtotal = qtd * valorUnit;
            totalGeral += subtotal;

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${escapeHtml(nomeProduto)}</strong></td>
                    <td style="text-align:center;">${qtd}</td>
                    <td style="text-align:right;">${formatCurrency(valorUnit)}</td>
                    <td style="text-align:right;"><strong>${formatCurrency(subtotal)}</strong></td>
                </tr>`;
        }).join('');
    }

    // Se o backend já tem o total, usar ele
    const valorTotal = orc.valor_total || totalGeral;

    itensFoot.innerHTML = `
        <tr style="font-size:1.1em;">
            <td colspan="4" style="text-align:right;"><strong>VALOR TOTAL:</strong></td>
            <td style="text-align:right;"><strong style="color:var(--primary-color);">${formatCurrency(valorTotal)}</strong></td>
        </tr>`;

    // === DETALHES DOS PRODUTOS (imagens, specs, dimensões) ===
    const detalhesContainer = document.getElementById('previewProdutosDetalheContent');
    if (itens.length > 0) {
        detalhesContainer.innerHTML = itens.map(item => {
            const produto = item.produto || {};
            const nome = produto.nome || item.produto_nome || '-';

            // Imagem
            let imgHtml = '';
            if (produto.imagem_base64) {
                imgHtml = `<img src="${produto.imagem_base64}" alt="${escapeHtml(nome)}" style="max-width:300px; max-height:250px; border-radius:8px; object-fit:contain;">`;
            } else if (produto.imagem_url) {
                imgHtml = `<img src="${escapeHtml(produto.imagem_url)}" alt="${escapeHtml(nome)}" style="max-width:300px; max-height:250px; border-radius:8px; object-fit:contain;" onerror="this.style.display='none'">`;
            }

            // Dimensões
            const dims = [];
            if (produto.altura) dims.push(`Altura: ${produto.altura} cm`);
            if (produto.largura) dims.push(`Largura: ${produto.largura} cm`);
            if (produto.profundidade) dims.push(`Profundidade: ${produto.profundidade} cm`);
            const pesoStr = produto.peso ? `Peso: ${produto.peso} kg` : '';

            // Descrição e especificações
            const descricao = produto.descricao || '';
            const especificacoes = produto.especificacoes || '';

            return `
                <div style="border:1px solid var(--border-color); border-radius:var(--radius-md); padding:20px; margin-bottom:15px; page-break-inside:avoid;">
                    <h4 style="margin:0 0 15px 0; color:var(--primary-color);">${escapeHtml(nome)}</h4>
                    <div style="display:flex; gap:20px; flex-wrap:wrap;">
                        ${imgHtml ? `<div style="flex-shrink:0;">${imgHtml}</div>` : ''}
                        <div style="flex:1; min-width:250px;">
                            ${descricao ? `<p style="margin:0 0 10px 0;"><strong>Descrição:</strong><br>${escapeHtml(descricao)}</p>` : ''}
                            ${especificacoes ? `<p style="margin:0 0 10px 0;"><strong>Especificações:</strong><br>${escapeHtml(especificacoes)}</p>` : ''}
                            ${dims.length > 0 ? `
                                <p style="margin:0 0 5px 0;"><strong>Dimensões:</strong></p>
                                <p style="margin:0 0 5px 0;">${dims.join(' | ')}</p>
                            ` : ''}
                            ${pesoStr ? `<p style="margin:5px 0 0 0;">${pesoStr}</p>` : ''}
                        </div>
                    </div>
                </div>`;
        }).join('');

        document.getElementById('previewProdutosDetalhe').style.display = 'block';
    } else {
        document.getElementById('previewProdutosDetalhe').style.display = 'none';
    }

    // === CONDIÇÕES COMERCIAIS ===
    const condicoesContent = document.getElementById('previewCondicoesContent');
    const formaPagamento = orc.forma_pagamento || config.condicoesPadrao || '';
    const prazoEntrega = orc.prazo_entrega || config.prazoEntregaPadrao || '';

    condicoesContent.innerHTML = `
        <div style="font-size:0.95em;">
            ${formaPagamento ? `<p><strong>Forma de Pagamento:</strong> ${escapeHtml(formaPagamento)}</p>` : ''}
            ${prazoEntrega ? `<p><strong>Prazo de Entrega/Despacho:</strong> ${escapeHtml(prazoEntrega)}</p>` : ''}
            ${validade !== '-' ? `<p><strong>Validade do Orçamento:</strong> ${validade}</p>` : ''}
        </div>`;

    // === OBSERVAÇÕES ===
    const observacoes = orc.observacoes || '';
    if (observacoes) {
        document.getElementById('previewObservacoesContent').innerHTML = `<p>${escapeHtml(observacoes)}</p>`;
        document.getElementById('previewObservacoes').style.display = 'block';
    }

    // === RODAPÉ ===
    const footerEl = document.getElementById('previewFooter');
    footerEl.innerHTML = `
        <div style="text-align:center; padding:15px 0; border-top:2px solid var(--border-color); margin-top:20px; font-size:0.85em; color:var(--text-muted);">
            <p>${escapeHtml(config.nomeEmpresa || 'WD Máquinas')} ${config.telefone ? ' | Tel: ' + formatPhone(config.telefone) : ''} ${config.email ? ' | ' + escapeHtml(config.email) : ''}</p>
            ${config.site ? `<p>${escapeHtml(config.site)}</p>` : ''}
            <p style="margin-top:5px;">Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>`;

    // Pré-popular modal de e-mail
    prePopularEmail(orc);
}

// ========== PRÉ-POPULAR MODAL EMAIL ==========
function prePopularEmail(orc) {
    const cliente = orc.cliente || {};
    const numero = orc.numero || orc.id?.substring(0, 8) || '';
    const config = typeof getConfig === 'function' ? getConfig() : {};

    if (cliente.email) {
        document.getElementById('emailDestinatario').value = cliente.email;
    }

    document.getElementById('emailAssunto').value = `Orçamento #${numero} - ${config.nomeEmpresa || 'WD Máquinas'}`;
    document.getElementById('emailMensagem').value = `Prezado(a) ${cliente.nome || 'Cliente'},\n\nSegue em anexo o orçamento #${numero} conforme solicitado.\n\nQualquer dúvida estamos à disposição.\n\nAtenciosamente,\n${config.nomeEmpresa || 'WD Máquinas'}`;
}

// ========== IMPRIMIR / PDF ==========
function imprimirOrcamento() {
    // Gerar título do PDF com nome do produto e data
    if (orcamentoData) {
        const itens = orcamentoData.itens || [];
        const numero = orcamentoData.numero || orcamentoData.id?.substring(0, 8) || '';
        const dataEmissao = orcamentoData.data_emissao || orcamentoData.created_at || '';

        let titulo = '';
        if (itens.length === 1) {
            const nomeProduto = itens[0].produto_nome || itens[0].produto?.nome || '';
            if (nomeProduto) {
                titulo = formatFileName(nomeProduto, dataEmissao);
            }
        }

        if (!titulo) {
            titulo = formatFileName(`Orçamento #${numero}`, dataEmissao);
        }

        document.title = titulo;
    }

    window.print();

    // Restaurar título original
    setTimeout(() => {
        document.title = 'Preview do Orçamento | WD Máquinas';
    }, 1000);
}

// ========== COMPARTILHAR WHATSAPP ==========
function compartilharWhatsApp() {
    if (!orcamentoData) {
        showToast('Orçamento não carregado', 'error');
        return;
    }

    const orc = orcamentoData;
    const config = typeof getConfig === 'function' ? getConfig() : {};
    const numero = orc.numero || orc.id?.substring(0, 8) || '';
    const cliente = orc.cliente || {};
    const valorTotal = formatCurrency(orc.valor_total || 0);
    const emissao = formatDate(orc.data_emissao || orc.created_at);

    // Montar mensagem
    let msg = `*Orçamento #${numero}*\n`;
    msg += `*${config.nomeEmpresa || 'WD Máquinas'}*\n\n`;
    msg += `📅 Data: ${emissao}\n`;
    msg += `👤 Cliente: ${cliente.nome || '-'}\n\n`;

    // Itens
    const itens = orc.itens || [];
    if (itens.length > 0) {
        msg += `📦 *Itens:*\n`;
        itens.forEach((item, i) => {
            const nome = item.produto_nome || item.produto?.nome || '-';
            const qtd = item.quantidade || 0;
            const subtotal = (item.quantidade || 0) * (item.valor_unitario || 0);
            msg += `  ${i + 1}. ${nome} (x${qtd}) — ${formatCurrency(subtotal)}\n`;
        });
    }

    msg += `\n💰 *Total: ${valorTotal}*\n`;

    if (orc.forma_pagamento) {
        msg += `\n💳 Pagamento: ${orc.forma_pagamento}`;
    }
    if (orc.prazo_entrega) {
        msg += `\n🚚 Entrega: ${orc.prazo_entrega}`;
    }

    // URL do WhatsApp
    const telefone = cliente.telefone ? cliente.telefone.replace(/\D/g, '') : '';
    let whatsUrl = 'https://wa.me/';
    if (telefone) {
        // Adicionar código do país se necessário
        const tel = telefone.startsWith('55') ? telefone : `55${telefone}`;
        whatsUrl += tel;
    }
    whatsUrl += `?text=${encodeURIComponent(msg)}`;

    window.open(whatsUrl, '_blank');
}

// ========== MODAL EMAIL ==========
function abrirModalEmail() {
    document.getElementById('modalEmail').classList.add('active');
}

function fecharModalEmail() {
    document.getElementById('modalEmail').classList.remove('active');
}

async function enviarEmail(event) {
    event.preventDefault();

    if (!orcamentoData) {
        showToast('Orçamento não carregado', 'error');
        return;
    }

    const email = document.getElementById('emailDestinatario').value.trim();
    const assunto = document.getElementById('emailAssunto').value.trim();
    const mensagem = document.getElementById('emailMensagem').value.trim();

    if (!email) {
        showToast('Informe o e-mail do destinatário', 'warning');
        return;
    }

    const btnEnviar = document.getElementById('btnEnviarEmail');
    btnEnviar.disabled = true;
    btnEnviar.textContent = '⏳ Enviando...';

    try {
        await apiPost(`/api/orcamentos/${orcamentoData.id}/enviar-email`, {
            email: email,
            assunto: assunto || `Orçamento - WD Máquinas`,
            mensagem: mensagem || '',
        });

        showToast('E-mail enviado com sucesso!', 'success');
        fecharModalEmail();

    } catch (error) {
        console.error('[Preview] Erro ao enviar e-mail:', error);
        showToast(`Erro ao enviar e-mail: ${error.message}`, 'error');
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = '📧 Enviar';
    }
}
