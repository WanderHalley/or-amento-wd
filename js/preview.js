/**
 * ============================================================
 * preview.js — Visualização / Preview do Orçamento
 * ============================================================
 */

/* Estado */
let orcamentoAtual = null;

/* ============================================================
   Inicialização
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initSidebar();
    bindEventosPreview();

    const params = new URLSearchParams(window.location.search);
    const orcId = params.get('id');

    if (!orcId) {
        document.getElementById('previewLoading').style.display = 'none';
        document.getElementById('previewArea').style.display = '';
        document.getElementById('previewArea').innerHTML = '<div class="empty-state">' +
            '<h4>Nenhum orçamento selecionado</h4>' +
            '<p>Selecione um orçamento para visualizar</p>' +
            '<a href="orcamentos.html" class="btn btn-primary btn-sm">Ver Orçamentos</a></div>';
        return;
    }

    carregarOrcamentoPreview(orcId);
});

function bindEventosPreview() {
    const btnPDF = document.getElementById('btnSalvarPDF');
    if (btnPDF) btnPDF.addEventListener('click', salvarPDF);

    const btnWhats = document.getElementById('btnWhatsApp');
    if (btnWhats) btnWhats.addEventListener('click', compartilharWhatsApp);

    const btnPrint = document.getElementById('btnImprimir');
    if (btnPrint) btnPrint.addEventListener('click', function () { window.print(); });
}

/* ============================================================
   Carregar Orçamento
   ============================================================ */

async function carregarOrcamentoPreview(id) {
    try {
        const result = await apiGet('/api/orcamentos/' + id);
        if (result.success && result.data) {
            orcamentoAtual = result.data;
            renderizarPreview(orcamentoAtual);
        }
    } catch (error) {
        document.getElementById('previewLoading').style.display = 'none';
        document.getElementById('previewArea').style.display = '';
        document.getElementById('previewArea').innerHTML = '<div class="empty-state">' +
            '<h4>Erro ao carregar orçamento</h4>' +
            '<p>' + escapeHtml(error.message) + '</p>' +
            '<a href="orcamentos.html" class="btn btn-primary btn-sm">Voltar</a></div>';
    }
}

/* ============================================================
   Renderizar Preview
   ============================================================ */

function renderizarPreview(orc) {
    const loading = document.getElementById('previewLoading');
    const area = document.getElementById('previewArea');

    loading.style.display = 'none';
    area.style.display = '';

    const empresa = orc.empresa || {};
    const cliente = orc.clientes || {};
    const itens = orc.itens || [];

    /* Logo */
    let logoHtml = '';
    if (empresa.logo_base64) {
        logoHtml = '<img src="' + empresa.logo_base64 + '" alt="Logo" class="orc-empresa-logo">';
    }

    /* Itens tabela */
    let itensHTML = '';
    itens.forEach(function (item, index) {
        const produto = item.produtos || {};
        itensHTML += '<tr>' +
            '<td>' + (index + 1) + '</td>' +
            '<td class="nome-produto">' + escapeHtml(produto.nome || 'Produto') + '</td>' +
            '<td style="text-align:center;">' + item.quantidade + '</td>' +
            '<td style="text-align:right;">' + formatCurrency(item.valor_unitario) + '</td>' +
            '<td style="text-align:right;"><strong>' + formatCurrency(item.valor_total) + '</strong></td>' +
            '</tr>';
    });

    /* Especificações, dimensões e imagens */
    let specsHTML = '';
    let dimensoesHTML = '';
    let imagensHTML = '';

    itens.forEach(function (item) {
        const produto = item.produtos || {};

        const imgSrc = produto.imagem_base64 || produto.imagem_url || '';
        if (imgSrc) {
            imagensHTML += '<div class="orc-produto-imagem">' +
                '<img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(produto.nome || '') + '">' +
                '</div>';
        }

        if (produto.descricao || produto.especificacoes) {
            specsHTML += '<div class="orc-specs">' +
                '<h4>' + escapeHtml(produto.nome || 'Produto') + '</h4>' +
                (produto.descricao ? '<p>' + escapeHtml(produto.descricao) + '</p>' : '') +
                (produto.especificacoes ? '<p>' + escapeHtml(produto.especificacoes) + '</p>' : '') +
                '</div>';
        }

        if (produto.altura_cm || produto.largura_cm || produto.profundidade_cm || produto.peso_kg) {
            dimensoesHTML += '<div class="orc-dimensoes">' +
                (produto.altura_cm ? '<div class="orc-dim-item"><div class="dim-label">Altura</div><div class="dim-value">' + produto.altura_cm + '</div><div class="dim-unit">CM</div></div>' : '') +
                (produto.largura_cm ? '<div class="orc-dim-item"><div class="dim-label">Largura</div><div class="dim-value">' + produto.largura_cm + '</div><div class="dim-unit">CM</div></div>' : '') +
                (produto.profundidade_cm ? '<div class="orc-dim-item"><div class="dim-label">Profundidade</div><div class="dim-value">' + produto.profundidade_cm + '</div><div class="dim-unit">CM</div></div>' : '') +
                (produto.peso_kg ? '<div class="orc-dim-item"><div class="dim-label">Peso</div><div class="dim-value">' + produto.peso_kg + '</div><div class="dim-unit">KG</div></div>' : '') +
                '</div>';
        }
    });

    /* Observações */
    let obsHtml = '';
    if (orc.observacoes) {
        obsHtml = '<div class="orc-section">' +
            '<div class="orc-section-title">Observações</div>' +
            '<p style="color:var(--text-secondary);font-size:14px;line-height:1.6;">' + escapeHtml(orc.observacoes) + '</p>' +
            '</div>';
    }

    /* Montar preview completo */
    area.innerHTML =
        '<!-- HEADER -->' +
        '<div class="orc-header">' +
        '<div class="orc-empresa">' +
        logoHtml +
        '<h2>' + escapeHtml(empresa.nome || 'WD MÁQUINAS') + '</h2>' +
        (empresa.endereco ? '<p>' + escapeHtml(empresa.endereco) + '</p>' : '') +
        (empresa.cnpj ? '<p>CNPJ: ' + escapeHtml(formatCNPJ(empresa.cnpj)) + '</p>' : '') +
        (empresa.telefone || empresa.email ? '<p>' + (empresa.telefone ? escapeHtml(formatPhone(empresa.telefone)) : '') + (empresa.telefone && empresa.email ? ' | ' : '') + (empresa.email ? escapeHtml(empresa.email) : '') + '</p>' : '') +
        '</div>' +
        '<div class="orc-meta">' +
        '<h3>ORÇAMENTO</h3>' +
        '<div class="orc-numero">#' + escapeHtml(String(orc.numero_orcamento || '-')) + '</div>' +
        '<div class="orc-meta-row"><strong>Emissão:</strong> ' + formatDate(orc.data_emissao) + '</div>' +
        '<div class="orc-meta-row"><strong>Validade:</strong> ' + formatDate(orc.data_validade) + '</div>' +
        '<div style="margin-top:8px;"><span class="badge badge-' + (orc.status || 'pendente') + '">' + capitalizeFirst(orc.status || 'pendente') + '</span></div>' +
        '</div>' +
        '</div>' +

        '<!-- CLIENTE -->' +
        '<div class="orc-section"><div class="orc-section-title">Dados do Cliente</div>' +
        '<div class="orc-cliente-box">' +
        '<div class="nome">' + escapeHtml(cliente.nome || '-') + (cliente.empresa ? ' - ' + escapeHtml(cliente.empresa) : '') + '</div>' +
        (cliente.cpf_cnpj ? '<div class="info">CPF/CNPJ: ' + escapeHtml(formatCPFCNPJ(cliente.cpf_cnpj)) + '</div>' : '') +
        (cliente.telefone ? '<div class="info">Tel: ' + escapeHtml(formatPhone(cliente.telefone)) + '</div>' : '') +
        (cliente.email ? '<div class="info">Email: ' + escapeHtml(cliente.email) + '</div>' : '') +
        (cliente.endereco ? '<div class="info">Endereço: ' + escapeHtml(cliente.endereco) + (cliente.cidade ? ', ' + escapeHtml(cliente.cidade) : '') + (cliente.estado ? '/' + escapeHtml(cliente.estado) : '') + (cliente.cep ? ' - CEP: ' + escapeHtml(formatCEP(cliente.cep)) : '') + '</div>' : '') +
        '</div></div>' +

        '<!-- ITENS -->' +
        '<div class="orc-section"><div class="orc-section-title">Itens do Orçamento</div>' +
        '<table class="orc-tabela"><thead><tr>' +
        '<th style="width:50px;">#</th><th>Produto</th><th style="width:80px;text-align:center;">Qtd</th><th style="width:130px;text-align:right;">Valor Un.</th><th style="width:130px;text-align:right;">Total</th>' +
        '</tr></thead><tbody>' + itensHTML + '</tbody></table></div>' +

        '<!-- TOTAL -->' +
        '<div class="orc-total-row"><div class="orc-total-box"><span>VALOR TOTAL</span><strong>' + formatCurrency(orc.valor_total) + '</strong></div></div>' +

        '<!-- CONDIÇÕES -->' +
        '<div class="orc-section"><div class="orc-section-title">Condições Comerciais</div>' +
        '<div class="orc-info-grid">' +
        '<div class="orc-info-box"><h5>Forma de Pagamento</h5><p>' + escapeHtml(orc.forma_pagamento || '-') + '</p></div>' +
        '<div class="orc-info-box"><h5>Prazo de Entrega</h5><p>' + escapeHtml(orc.prazo_entrega || '-') + '</p></div>' +
        '</div></div>' +

        obsHtml +

        '<!-- IMAGENS -->' +
        (imagensHTML ? '<div class="orc-section"><div class="orc-section-title">Imagens dos Produtos</div>' + imagensHTML + '</div>' : '') +

        '<!-- ESPECIFICAÇÕES -->' +
        (specsHTML ? '<div class="orc-section"><div class="orc-section-title">Especificações Técnicas</div>' + specsHTML + '</div>' : '') +

        '<!-- DIMENSÕES -->' +
        (dimensoesHTML ? '<div class="orc-section"><div class="orc-section-title">Dimensões</div>' + dimensoesHTML + '</div>' : '') +

        '<!-- FOOTER -->' +
        '<div class="orc-footer">' +
        '<p>' + escapeHtml(empresa.nome || 'WD MÁQUINAS') +
        (empresa.telefone ? ' - ' + escapeHtml(formatPhone(empresa.telefone)) : '') +
        (empresa.email ? ' - ' + escapeHtml(empresa.email) : '') + '</p>' +
        '<p style="margin-top:4px;">Orçamento válido até ' + formatDate(orc.data_validade) + '</p>' +
        '</div>';
}

/* ============================================================
   PDF — Salvar via html2canvas + jsPDF
   ============================================================ */

async function salvarPDF() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'warning');
        return;
    }

    const btn = document.getElementById('btnSalvarPDF');
    btn.disabled = true;
    btn.textContent = 'Gerando PDF...';

    try {
        const previewArea = document.getElementById('previewArea');
        const canvas = await html2canvas(previewArea, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 10;

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);

        while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);
        }

        const nomeArquivo = 'Orcamento_' + (orcamentoAtual.numero_orcamento || '') + '_' + formatFileDate() + '.pdf';
        pdf.save(nomeArquivo);
        showToast('PDF gerado com sucesso!', 'success');
    } catch (error) {
        showToast('Erro ao gerar PDF: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Salvar PDF';
    }
}

/* ============================================================
   WhatsApp
   ============================================================ */

function compartilharWhatsApp() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'warning');
        return;
    }

    const orc = orcamentoAtual;
    const cliente = orc.clientes || {};
    const empresa = orc.empresa || {};

    const itensTexto = (orc.itens || []).map(function (item, i) {
        const prod = item.produtos || {};
        return (i + 1) + '. ' + (prod.nome || 'Produto') + ' - Qtd: ' + item.quantidade + ' - ' + formatCurrency(item.valor_total);
    }).join('\n');

    const texto = '*' + (empresa.nome || 'WD MÁQUINAS') + '*\n' +
        '*ORÇAMENTO #' + (orc.numero_orcamento || '-') + '*\n\n' +
        '*Cliente:* ' + (cliente.nome || '-') + (cliente.empresa ? ' - ' + cliente.empresa : '') + '\n' +
        '*Emissão:* ' + formatDate(orc.data_emissao) + '\n' +
        '*Validade:* ' + formatDate(orc.data_validade) + '\n\n' +
        '*Itens:*\n' + itensTexto + '\n\n' +
        '*TOTAL: ' + formatCurrency(orc.valor_total) + '*\n\n' +
        '*Pagamento:* ' + (orc.forma_pagamento || '-') + '\n' +
        '*Entrega:* ' + (orc.prazo_entrega || '-') + '\n\n' +
        (empresa.telefone ? formatPhone(empresa.telefone) : '') +
        (empresa.email ? ' | ' + empresa.email : '');

    const encoded = encodeURIComponent(texto);
    let whatsUrl = 'https://wa.me/?text=' + encoded;

    if (cliente.telefone) {
        const tel = unmask(cliente.telefone);
        if (tel.length >= 10) {
            const telFull = tel.indexOf('55') === 0 ? tel : '55' + tel;
            whatsUrl = 'https://wa.me/' + telFull + '?text=' + encoded;
        }
    }

    window.open(whatsUrl, '_blank');
}
