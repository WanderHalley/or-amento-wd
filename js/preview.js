// ==========================================
// PREVIEW - Visualização de Orçamento
// PDF A4 perfeito | Nome: produto+cliente+data
// Sem empresa duplicada | Status oculto no PDF
// WhatsApp e Email com PDF anexo
// ==========================================

let orcamentoAtual = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    bindPreviewEvents();

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
        carregarOrcamentoPreview(id);
    } else {
        document.getElementById('previewArea').innerHTML =
            '<div class="empty-state"><h3>Nenhum orçamento selecionado</h3></div>';
    }
});

// ==========================================
// EVENTOS
// ==========================================

function bindPreviewEvents() {
    const btnPDF = document.getElementById('btnSalvarPDF');
    if (btnPDF) btnPDF.addEventListener('click', salvarPDF);

    const btnWhats = document.getElementById('btnWhatsApp');
    if (btnWhats) btnWhats.addEventListener('click', compartilharWhatsApp);

    const btnPrint = document.getElementById('btnImprimir');
    if (btnPrint) btnPrint.addEventListener('click', imprimirOrcamento);

    const btnEmail = document.getElementById('btnEnviarEmail');
    if (btnEmail) btnEmail.addEventListener('click', abrirModalEmail);

    const btnFecharEmail = document.getElementById('btnFecharModalEmail');
    if (btnFecharEmail) btnFecharEmail.addEventListener('click', fecharModalEmail);

    const btnCancelarEmail = document.getElementById('btnCancelarEmail');
    if (btnCancelarEmail) btnCancelarEmail.addEventListener('click', fecharModalEmail);

    const btnEnviar = document.getElementById('btnEnviarEmailConfirm');
    if (btnEnviar) btnEnviar.addEventListener('click', enviarEmail);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharModalEmail();
    });
}

// ==========================================
// HELPERS - NOME DE ARQUIVO
// ==========================================

function limparParaNome(texto) {
    if (!texto) return '';
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '.')
        .replace(/^\.+|\.+$/g, '');
}

function gerarNomeArquivo() {
    var nomeProduto = 'orcamento';
    var nomeCliente = 'cliente';

    if (orcamentoAtual) {
        if (orcamentoAtual.itens && orcamentoAtual.itens.length > 0) {
            var item = orcamentoAtual.itens[0];
            var prodNome = item.produto_nome || item.descricao || '';
            if (prodNome) nomeProduto = limparParaNome(prodNome);
        }
        if (orcamentoAtual.cliente) {
            var cliNome = orcamentoAtual.cliente.nome || '';
            if (cliNome) nomeCliente = limparParaNome(cliNome);
        }
    }

    var hoje = new Date();
    var dd = String(hoje.getDate()).padStart(2, '0');
    var mm = String(hoje.getMonth() + 1).padStart(2, '0');
    var aa = String(hoje.getFullYear()).slice(-2);
    var dataStr = dd + '.' + mm + '.' + aa;

    return nomeProduto + '.' + nomeCliente + '.' + dataStr;
}

// ==========================================
// CARREGAR ORÇAMENTO
// ==========================================

async function carregarOrcamentoPreview(id) {
    try {
        var response = await apiGet('/api/orcamentos/' + id);
        if (response.success) {
            orcamentoAtual = response.data;
            renderizarPreview();
        } else {
            showToast('Erro ao carregar orçamento', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar:', error);
        showToast('Erro ao carregar orçamento', 'error');
    }
}

// ==========================================
// RENDERIZAR PREVIEW
// ==========================================

function renderizarPreview() {
    var area = document.getElementById('previewArea');
    if (!area || !orcamentoAtual) return;

    var orc = orcamentoAtual;
    var cliente = orc.cliente || {};
    var itens = orc.itens || [];
    var config = orc.configuracoes || {};

    // Status badge - só aparece na tela, NÃO no PDF/impressão
    var statusMap = {
        'rascunho': { label: 'Rascunho', cor: '#6c757d' },
        'enviado': { label: 'Enviado', cor: '#0066cc' },
        'aprovado': { label: 'Aprovado', cor: '#28a745' },
        'rejeitado': { label: 'Rejeitado', cor: '#dc3545' }
    };
    var statusInfo = statusMap[orc.status] || statusMap['rascunho'];

    // Datas
    var dataCriacao = orc.created_at ? new Date(orc.created_at).toLocaleDateString('pt-BR') : '-';
    var dataValidade = orc.validade ? new Date(orc.validade).toLocaleDateString('pt-BR') : '-';

    // Itens HTML
    var itensHTML = '';
    var totalGeral = 0;
    for (var i = 0; i < itens.length; i++) {
        var item = itens[i];
        var subtotal = (item.quantidade || 0) * (item.valor_unitario || 0);
        totalGeral += subtotal;
        itensHTML +=
            '<tr>' +
                '<td style="padding:8px 6px;border-bottom:1px solid #dee2e6;text-align:center;font-size:11px;color:#333;">' + (i + 1) + '</td>' +
                '<td style="padding:8px 6px;border-bottom:1px solid #dee2e6;font-size:11px;color:#333;">' + (item.produto_nome || item.descricao || '-') + '</td>' +
                '<td style="padding:8px 6px;border-bottom:1px solid #dee2e6;text-align:center;font-size:11px;color:#333;">' + (item.quantidade || 0) + '</td>' +
                '<td style="padding:8px 6px;border-bottom:1px solid #dee2e6;text-align:right;font-size:11px;color:#333;">R$ ' + (item.valor_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</td>' +
                '<td style="padding:8px 6px;border-bottom:1px solid #dee2e6;text-align:right;font-size:11px;color:#333;font-weight:600;">R$ ' + subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</td>' +
            '</tr>';
    }

    // Seções opcionais
    var observacoesHTML = '';
    if (orc.observacoes) {
        observacoesHTML =
            '<div style="margin-top:14px;">' +
                '<h3 style="font-size:12px;color:#1a1a2e;margin:0 0 6px 0;padding-bottom:4px;border-bottom:2px solid #0066cc;font-weight:700;">OBSERVAÇÕES</h3>' +
                '<p style="font-size:10px;color:#333;white-space:pre-wrap;line-height:1.5;margin:0;">' + orc.observacoes + '</p>' +
            '</div>';
    }

    var especificacoesHTML = '';
    if (orc.especificacoes) {
        especificacoesHTML =
            '<div style="margin-top:14px;">' +
                '<h3 style="font-size:12px;color:#1a1a2e;margin:0 0 6px 0;padding-bottom:4px;border-bottom:2px solid #0066cc;font-weight:700;">ESPECIFICAÇÕES TÉCNICAS</h3>' +
                '<p style="font-size:10px;color:#333;white-space:pre-wrap;line-height:1.5;margin:0;">' + orc.especificacoes + '</p>' +
            '</div>';
    }

    var dimensoesHTML = '';
    if (orc.dimensoes) {
        dimensoesHTML =
            '<div style="margin-top:14px;">' +
                '<h3 style="font-size:12px;color:#1a1a2e;margin:0 0 6px 0;padding-bottom:4px;border-bottom:2px solid #0066cc;font-weight:700;">DIMENSÕES</h3>' +
                '<p style="font-size:10px;color:#333;white-space:pre-wrap;line-height:1.5;margin:0;">' + orc.dimensoes + '</p>' +
            '</div>';
    }

    var imagensHTML = '';
    if (orc.imagens && orc.imagens.length > 0) {
        var imgs = '';
        for (var j = 0; j < orc.imagens.length; j++) {
            imgs += '<img src="' + orc.imagens[j] + '" style="max-width:160px;max-height:120px;border-radius:4px;border:1px solid #ddd;" crossorigin="anonymous">';
        }
        imagensHTML =
            '<div style="margin-top:14px;">' +
                '<h3 style="font-size:12px;color:#1a1a2e;margin:0 0 6px 0;padding-bottom:4px;border-bottom:2px solid #0066cc;font-weight:700;">IMAGENS</h3>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + imgs + '</div>' +
            '</div>';
    }

    // Condições
    var condicaoHTML = '';
    if (orc.condicao_pagamento) {
        condicaoHTML =
            '<div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:6px;padding:10px;">' +
                '<h3 style="font-size:11px;color:#0066cc;margin:0 0 4px 0;font-weight:700;">CONDIÇÃO DE PAGAMENTO</h3>' +
                '<p style="font-size:10px;color:#333;margin:0;">' + orc.condicao_pagamento + '</p>' +
            '</div>';
    }
    var prazoHTML = '';
    if (orc.prazo_entrega) {
        prazoHTML =
            '<div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:6px;padding:10px;">' +
                '<h3 style="font-size:11px;color:#0066cc;margin:0 0 4px 0;font-weight:700;">PRAZO DE ENTREGA</h3>' +
                '<p style="font-size:10px;color:#333;margin:0;">' + orc.prazo_entrega + '</p>' +
            '</div>';
    }
    var condicoesGridHTML = '';
    if (condicaoHTML || prazoHTML) {
        condicoesGridHTML =
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
                condicaoHTML + prazoHTML +
            '</div>';
    }

    // Endereço do cliente
    var enderecoCliente = '';
    if (cliente.endereco) {
        enderecoCliente = cliente.endereco;
        if (cliente.cidade) enderecoCliente += ', ' + cliente.cidade;
        if (cliente.estado) enderecoCliente += '/' + cliente.estado;
        if (cliente.cep) enderecoCliente += ' - CEP: ' + cliente.cep;
    }

    // MONTAR HTML COMPLETO
    area.innerHTML =
        '<div class="preview-content" style="font-family:Inter,Arial,Helvetica,sans-serif;color:#1a1a1a;background:#ffffff;padding:28px 32px;max-width:800px;margin:0 auto;">' +

            // Status - NÃO aparece no PDF/impressão
            '<div class="no-print" style="margin-bottom:12px;">' +
                '<span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;background:' + statusInfo.cor + ';">' + statusInfo.label + '</span>' +
            '</div>' +

            // CABEÇALHO EMPRESA
            '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0066cc;padding-bottom:14px;margin-bottom:18px;">' +
                '<div>' +
                    '<h1 style="font-size:20px;color:#0066cc;margin:0;font-weight:700;">' + (config.empresa_nome || 'WD Máquinas') + '</h1>' +
                    (config.empresa_endereco ? '<p style="font-size:10px;color:#555;margin:2px 0 0 0;">' + config.empresa_endereco + '</p>' : '') +
                    '<p style="font-size:10px;color:#555;margin:2px 0 0 0;">' +
                        (config.empresa_telefone || '') +
                        (config.empresa_email ? ' | ' + config.empresa_email : '') +
                    '</p>' +
                    (config.empresa_cnpj ? '<p style="font-size:10px;color:#555;margin:2px 0 0 0;">CNPJ: ' + config.empresa_cnpj + '</p>' : '') +
                '</div>' +
                (config.empresa_logo ? '<img src="' + config.empresa_logo + '" style="max-height:60px;max-width:140px;" crossorigin="anonymous">' : '') +
            '</div>' +

            // TÍTULO ORÇAMENTO
            '<div style="background:#0066cc;color:#ffffff;padding:10px 14px;border-radius:6px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">' +
                '<h2 style="margin:0;font-size:15px;font-weight:700;">ORÇAMENTO Nº ' + (orc.numero || '-') + '</h2>' +
                '<div style="text-align:right;font-size:10px;">' +
                    '<div>Data: ' + dataCriacao + '</div>' +
                    '<div>Validade: ' + dataValidade + '</div>' +
                '</div>' +
            '</div>' +

            // DADOS DO CLIENTE - Apenas nome, sem empresa duplicada
            '<div style="background:#f0f4ff;border:1px solid #ccd9f0;border-radius:6px;padding:12px 14px;margin-bottom:16px;">' +
                '<h3 style="font-size:12px;color:#0066cc;margin:0 0 8px 0;font-weight:700;">DADOS DO CLIENTE</h3>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:10px;color:#333;">' +
                    '<div><strong style="color:#1a1a2e;">Nome:</strong> ' + (cliente.nome || '-') + '</div>' +
                    '<div><strong style="color:#1a1a2e;">CPF/CNPJ:</strong> ' + (cliente.cpf_cnpj || '-') + '</div>' +
                    '<div><strong style="color:#1a1a2e;">Telefone:</strong> ' + (cliente.telefone || '-') + '</div>' +
                    '<div><strong style="color:#1a1a2e;">Email:</strong> ' + (cliente.email || '-') + '</div>' +
                    (enderecoCliente ? '<div style="grid-column:1/3;"><strong style="color:#1a1a2e;">Endereço:</strong> ' + enderecoCliente + '</div>' : '') +
                '</div>' +
            '</div>' +

            // TABELA DE ITENS
            '<table style="width:100%;border-collapse:collapse;margin-bottom:14px;">' +
                '<thead>' +
                    '<tr style="background:#0066cc;color:#ffffff;">' +
                        '<th style="padding:8px 6px;text-align:center;font-size:10px;width:35px;font-weight:600;">#</th>' +
                        '<th style="padding:8px 6px;text-align:left;font-size:10px;font-weight:600;">Produto / Descrição</th>' +
                        '<th style="padding:8px 6px;text-align:center;font-size:10px;width:50px;font-weight:600;">Qtd</th>' +
                        '<th style="padding:8px 6px;text-align:right;font-size:10px;width:90px;font-weight:600;">Valor Unit.</th>' +
                        '<th style="padding:8px 6px;text-align:right;font-size:10px;width:90px;font-weight:600;">Subtotal</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    itensHTML +
                '</tbody>' +
            '</table>' +

            // TOTAL
            '<div style="text-align:right;margin-bottom:16px;">' +
                '<div style="display:inline-block;background:#0066cc;color:#ffffff;padding:10px 20px;border-radius:6px;font-size:15px;font-weight:700;">' +
                    'TOTAL: R$ ' + totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
                '</div>' +
            '</div>' +

            // CONDIÇÕES
            condicoesGridHTML +

            // SEÇÕES OPCIONAIS
            observacoesHTML +
            especificacoesHTML +
            dimensoesHTML +
            imagensHTML +

            // RODAPÉ
            '<div style="margin-top:20px;border-top:2px solid #0066cc;padding-top:10px;text-align:center;">' +
                '<p style="font-size:9px;color:#777;margin:0;">' + (config.empresa_nome || 'WD Máquinas') + ' - ' + (config.empresa_telefone || '') + ' - ' + (config.empresa_email || '') + '</p>' +
                '<p style="font-size:8px;color:#999;margin:3px 0 0 0;">Orçamento válido até ' + dataValidade + '</p>' +
            '</div>' +

        '</div>';
}

// ==========================================
// GERAR PDF BLOB (reutilizável)
// ==========================================

async function gerarPDFBlob() {
    var jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFClass) throw new Error('Biblioteca jsPDF não carregada');

    var previewArea = document.getElementById('previewArea');
    if (!previewArea) throw new Error('Área de preview não encontrada');

    // Clonar off-screen com dimensões A4 exatas
    var clone = previewArea.cloneNode(true);
    var a4W = 794;  // A4 largura em px @96dpi
    var a4H = 1123; // A4 altura em px @96dpi

    clone.style.cssText =
        'position:fixed;left:-9999px;top:0;' +
        'width:' + a4W + 'px;min-height:auto;' +
        'background:#ffffff;color:#1a1a1a;' +
        'font-family:Inter,Arial,Helvetica,sans-serif;' +
        'padding:0;margin:0;border:none;' +
        'overflow:visible;box-sizing:border-box;';

    // Remover badges de status (não aparecem no PDF)
    var noPrintEls = clone.querySelectorAll('.no-print');
    for (var i = 0; i < noPrintEls.length; i++) {
        noPrintEls[i].parentNode.removeChild(noPrintEls[i]);
    }

    document.body.appendChild(clone);

    // Aguardar renderização
    await new Promise(function(r) { setTimeout(r, 400); });

    // Verificar se conteúdo cabe em A4; se não, escalar proporcionalmente
    var realH = clone.scrollHeight;
    var scaleFactor = 1;
    if (realH > a4H) {
        scaleFactor = a4H / realH;
        clone.style.transformOrigin = 'top left';
        clone.style.transform = 'scale(' + scaleFactor + ')';
        clone.style.width = a4W + 'px';
        clone.style.height = a4H + 'px';
        await new Promise(function(r) { setTimeout(r, 300); });
    }

    // Capturar com html2canvas
    var canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: a4W,
        height: Math.min(realH, a4H),
        windowWidth: a4W,
        windowHeight: Math.min(realH, a4H)
    });

    document.body.removeChild(clone);

    // Criar PDF A4 - imagem ocupa a página inteira
    var pdf = new jsPDFClass('p', 'mm', 'a4');
    var imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

    return {
        blob: pdf.output('blob'),
        nome: gerarNomeArquivo() + '.pdf',
        pdf: pdf
    };
}

// ==========================================
// SALVAR PDF
// ==========================================

async function salvarPDF() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'error');
        return;
    }

    var btnPDF = document.getElementById('btnSalvarPDF');
    if (btnPDF) {
        btnPDF.disabled = true;
        btnPDF.innerHTML = '⏳ Gerando PDF...';
    }

    try {
        var resultado = await gerarPDFBlob();

        // Salvar arquivo
        resultado.pdf.save(resultado.nome);

        // Guardar referência para WhatsApp/Email
        window._ultimoPDFBlob = resultado.blob;
        window._ultimoPDFNome = resultado.nome;

        showToast('PDF salvo com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showToast('Erro ao gerar PDF: ' + error.message, 'error');
    } finally {
        if (btnPDF) {
            btnPDF.disabled = false;
            btnPDF.innerHTML = '📄 Salvar PDF';
        }
    }
}

// ==========================================
// IMPRIMIR
// ==========================================

function imprimirOrcamento() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'error');
        return;
    }
    var nomeOriginal = document.title;
    document.title = gerarNomeArquivo();
    window.print();
    setTimeout(function() {
        document.title = nomeOriginal;
    }, 1500);
}

// ==========================================
// WHATSAPP - Envia texto + PDF
// ==========================================

async function compartilharWhatsApp() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'error');
        return;
    }

    var btnWhats = document.getElementById('btnWhatsApp');
    if (btnWhats) {
        btnWhats.disabled = true;
        btnWhats.innerHTML = '⏳ Preparando...';
    }

    try {
        // Gerar PDF
        var pdfObj = null;
        try {
            pdfObj = await gerarPDFBlob();
        } catch (e) {
            console.warn('Não foi possível gerar PDF:', e);
        }

        var orc = orcamentoAtual;
        var cliente = orc.cliente || {};
        var config = orc.configuracoes || {};
        var itens = orc.itens || [];

        var totalGeral = 0;
        for (var i = 0; i < itens.length; i++) {
            totalGeral += (itens[i].quantidade || 0) * (itens[i].valor_unitario || 0);
        }

        // Montar mensagem
        var msg = '*' + (config.empresa_nome || 'WD Máquinas') + '*\n';
        msg += '━━━━━━━━━━━━━━━\n';
        msg += '📋 *Orçamento Nº ' + (orc.numero || '-') + '*\n';
        msg += '👤 Cliente: ' + (cliente.nome || '-') + '\n';
        msg += '📅 Data: ' + (orc.created_at ? new Date(orc.created_at).toLocaleDateString('pt-BR') : '-') + '\n';
        msg += '📅 Validade: ' + (orc.validade ? new Date(orc.validade).toLocaleDateString('pt-BR') : '-') + '\n';
        msg += '━━━━━━━━━━━━━━━\n';
        msg += '*ITENS:*\n';
        for (var j = 0; j < itens.length; j++) {
            var sub = (itens[j].quantidade || 0) * (itens[j].valor_unitario || 0);
            msg += (j + 1) + '. ' + (itens[j].produto_nome || itens[j].descricao || '-') +
                ' - ' + itens[j].quantidade + 'x R$ ' +
                (itens[j].valor_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
                ' = R$ ' + sub.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '\n';
        }
        msg += '━━━━━━━━━━━━━━━\n';
        msg += '💰 *TOTAL: R$ ' + totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '*\n';
        if (orc.condicao_pagamento) msg += '💳 Pagamento: ' + orc.condicao_pagamento + '\n';
        if (orc.prazo_entrega) msg += '🚚 Entrega: ' + orc.prazo_entrega + '\n';
        msg += '━━━━━━━━━━━━━━━\n';
        msg += (config.empresa_nome || 'WD Máquinas') + ' - ' + (config.empresa_telefone || '');

        // Tentar Web Share API com arquivo PDF (funciona em mobile)
        if (pdfObj && navigator.canShare) {
            try {
                var file = new File([pdfObj.blob], pdfObj.nome, { type: 'application/pdf' });
                var shareData = { text: msg, files: [file] };

                if (navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    showToast('Orçamento compartilhado!', 'success');
                    return;
                }
            } catch (shareErr) {
                if (shareErr.name === 'AbortError') return;
                console.warn('Web Share API falhou, usando fallback:', shareErr);
            }
        }

        // Fallback: baixar PDF + abrir WhatsApp com texto
        if (pdfObj) {
            var url = URL.createObjectURL(pdfObj.blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = pdfObj.nome;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('PDF baixado! Anexe manualmente no WhatsApp.', 'info');
        }

        // Abrir WhatsApp
        var telefone = '';
        if (cliente.telefone) {
            telefone = cliente.telefone.replace(/\D/g, '');
            if (telefone.length === 11 || telefone.length === 10) {
                telefone = '55' + telefone;
            }
        }

        var whatsUrl = telefone
            ? 'https://wa.me/' + telefone + '?text=' + encodeURIComponent(msg)
            : 'https://wa.me/?text=' + encodeURIComponent(msg);

        window.open(whatsUrl, '_blank');

    } catch (error) {
        console.error('Erro WhatsApp:', error);
        showToast('Erro ao compartilhar: ' + error.message, 'error');
    } finally {
        if (btnWhats) {
            btnWhats.disabled = false;
            btnWhats.innerHTML = '📱 WhatsApp';
        }
    }
}

// ==========================================
// EMAIL - Modal + gera PDF + mailto
// ==========================================

function abrirModalEmail() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'error');
        return;
    }

    var cliente = orcamentoAtual.cliente || {};
    var config = orcamentoAtual.configuracoes || {};
    var nomeArq = gerarNomeArquivo();

    var emailDest = document.getElementById('emailDestinatario');
    var emailAssunto = document.getElementById('emailAssunto');
    var emailMensagem = document.getElementById('emailMensagem');

    if (emailDest) emailDest.value = cliente.email || '';
    if (emailAssunto) emailAssunto.value = 'Orçamento Nº ' + (orcamentoAtual.numero || '') + ' - ' + (config.empresa_nome || 'WD Máquinas');
    if (emailMensagem) {
        emailMensagem.value =
            'Prezado(a) ' + (cliente.nome || 'Cliente') + ',\n\n' +
            'Segue em anexo o orçamento Nº ' + (orcamentoAtual.numero || '') + ' conforme solicitado.\n\n' +
            'O arquivo PDF "' + nomeArq + '.pdf" será baixado automaticamente ao clicar em Enviar.\n' +
            'Por favor, anexe-o ao email.\n\n' +
            'Qualquer dúvida estamos à disposição.\n\n' +
            'Atenciosamente,\n' +
            (config.empresa_nome || 'WD Máquinas') + '\n' +
            (config.empresa_telefone || '');
    }

    var modal = document.getElementById('modalEmail');
    if (modal) modal.classList.add('active');
}

function fecharModalEmail() {
    var modal = document.getElementById('modalEmail');
    if (modal) modal.classList.remove('active');
}

async function enviarEmail() {
    var emailDest = document.getElementById('emailDestinatario');
    var emailAssunto = document.getElementById('emailAssunto');
    var emailMensagem = document.getElementById('emailMensagem');

    var dest = emailDest ? emailDest.value.trim() : '';
    var assunto = emailAssunto ? emailAssunto.value.trim() : '';
    var corpo = emailMensagem ? emailMensagem.value.trim() : '';

    if (!dest) {
        showToast('Informe o email do destinatário', 'error');
        return;
    }

    var btnEnviar = document.getElementById('btnEnviarEmailConfirm');
    if (btnEnviar) {
        btnEnviar.disabled = true;
        btnEnviar.innerHTML = '⏳ Gerando PDF...';
    }

    try {
        // Gerar e baixar PDF automaticamente
        var pdfObj = await gerarPDFBlob();
        var url = URL.createObjectURL(pdfObj.blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = pdfObj.nome;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Abrir cliente de email via mailto
        var mailtoUrl = 'mailto:' + encodeURIComponent(dest) +
            '?subject=' + encodeURIComponent(assunto) +
            '&body=' + encodeURIComponent(corpo);
        window.location.href = mailtoUrl;

        showToast('PDF baixado! Anexe ao email que será aberto.', 'success');
        fecharModalEmail();

    } catch (error) {
        console.error('Erro email:', error);
        showToast('Erro ao preparar email: ' + error.message, 'error');
    } finally {
        if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = '📧 Enviar';
        }
    }
}
