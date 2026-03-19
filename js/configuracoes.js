/**
 * configuracoes.js — Gerencia configurações da empresa (localStorage)
 *
 * Depende de: app.js (getConfig, saveConfig, showToast, readFileAsBase64,
 *             formatCNPJ, formatPhone, unmaskValue, maskInput)
 *
 * IDs esperados no HTML:
 *   formConfigEmpresa, cfgLogo, cfgLogoImg, cfgLogoPreview, btnRemoverLogo,
 *   cfgNomeEmpresa, cfgCnpj, cfgTelefone, cfgEmail, cfgSite, cfgEndereco,
 *   cfgCondicoesPadrao, cfgValidadeDias, cfgPrazoEntregaPadrao,
 *   cfgObservacoesPadrao, cfgApiStatus
 */

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    // app.js cuida de initTheme e initSidebar
    carregarConfiguracoes();
    verificarStatusAPI();
    aplicarMascarasConfig();
});

/**
 * Aplica máscaras nos campos de configuração
 */
function aplicarMascarasConfig() {
    const cnpjInput = document.getElementById('cfgCnpj');
    const telInput = document.getElementById('cfgTelefone');

    if (cnpjInput && typeof formatCNPJ === 'function') {
        cnpjInput.addEventListener('input', function () {
            this.value = formatCNPJ(this.value);
        });
    }

    if (telInput && typeof formatPhone === 'function') {
        telInput.addEventListener('input', function () {
            this.value = formatPhone(this.value);
        });
    }
}

/**
 * Carrega configurações do localStorage e preenche o formulário
 */
function carregarConfiguracoes() {
    const config = typeof getConfig === 'function' ? getConfig() : {};
    console.log('[Config] Carregando:', config);

    // Logo
    const logoImg = document.getElementById('cfgLogoImg');
    const btnRemover = document.getElementById('btnRemoverLogo');

    if (config.logo && logoImg) {
        logoImg.src = config.logo;
        logoImg.style.display = 'block';
        if (btnRemover) btnRemover.style.display = 'inline-block';
    } else if (logoImg) {
        logoImg.style.display = 'none';
        if (btnRemover) btnRemover.style.display = 'none';
    }

    // Campos de texto
    const campos = {
        'cfgNomeEmpresa': config.nomeEmpresa || '',
        'cfgEmail': config.email || '',
        'cfgSite': config.site || '',
        'cfgEndereco': config.endereco || '',
        'cfgCondicoesPadrao': config.condicoesPadrao || '',
        'cfgValidadeDias': config.validadeDias || 15,
        'cfgPrazoEntregaPadrao': config.prazoEntregaPadrao || '',
        'cfgObservacoesPadrao': config.observacoesPadrao || '',
    };

    for (const [id, valor] of Object.entries(campos)) {
        const el = document.getElementById(id);
        if (el) el.value = valor;
    }

    // Campos com máscara
    const cnpjInput = document.getElementById('cfgCnpj');
    if (cnpjInput) {
        cnpjInput.value = config.cnpj
            ? (typeof formatCNPJ === 'function' ? formatCNPJ(config.cnpj) : config.cnpj)
            : '';
    }

    const telInput = document.getElementById('cfgTelefone');
    if (telInput) {
        telInput.value = config.telefone
            ? (typeof formatPhone === 'function' ? formatPhone(config.telefone) : config.telefone)
            : '';
    }
}

/**
 * Preview do logo ao selecionar arquivo
 */
async function previewLogoConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Logo max 500 KB
        const maxBytes = 500 * 1024;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const base64 = await readFileAsBase64(file, maxBytes, allowedTypes);

        const logoImg = document.getElementById('cfgLogoImg');
        const btnRemover = document.getElementById('btnRemoverLogo');

        if (logoImg) {
            logoImg.src = base64;
            logoImg.style.display = 'block';
            logoImg.dataset.newLogo = base64;
        }
        if (btnRemover) {
            btnRemover.style.display = 'inline-block';
        }

        console.log('[Config] Logo carregado, tamanho:', base64.length);

    } catch (error) {
        console.error('[Config] Erro no upload do logo:', error);
        showToast(error.message || 'Erro ao carregar logo', 'error');
        event.target.value = '';
    }
}

/**
 * Remove logo
 */
function removerLogoConfig() {
    const logoImg = document.getElementById('cfgLogoImg');
    const fileInput = document.getElementById('cfgLogo');
    const btnRemover = document.getElementById('btnRemoverLogo');

    if (logoImg) {
        logoImg.src = '';
        logoImg.style.display = 'none';
        logoImg.dataset.newLogo = '';
    }
    if (fileInput) {
        fileInput.value = '';
    }
    if (btnRemover) {
        btnRemover.style.display = 'none';
    }
}

/**
 * Salva configurações no localStorage
 */
function salvarConfiguracoes(event) {
    event.preventDefault();

    const nomeInput = document.getElementById('cfgNomeEmpresa');
    const nomeEmpresa = nomeInput ? nomeInput.value.trim() : '';

    if (!nomeEmpresa) {
        showToast('O nome da empresa é obrigatório', 'warning');
        return;
    }

    // Logo: se tem um novo, usa ele; senão mantém o existente
    const configAtual = typeof getConfig === 'function' ? getConfig() : {};
    const logoImg = document.getElementById('cfgLogoImg');
    const newLogo = logoImg ? logoImg.dataset.newLogo : undefined;
    let logo = configAtual.logo || '';

    if (newLogo !== undefined && newLogo !== '') {
        logo = newLogo;
    } else if (logoImg && logoImg.style.display === 'none') {
        // Logo foi removido
        logo = '';
    }

    // Função unmask segura
    const unmask = typeof unmaskValue === 'function'
        ? unmaskValue
        : function (v) { return v ? v.replace(/\D/g, '') : ''; };

    // Ler todos os campos
    const el = (id) => document.getElementById(id);

    const novaConfig = {
        logo: logo,
        nomeEmpresa: nomeEmpresa,
        cnpj: unmask(el('cfgCnpj') ? el('cfgCnpj').value : ''),
        telefone: unmask(el('cfgTelefone') ? el('cfgTelefone').value : ''),
        email: el('cfgEmail') ? el('cfgEmail').value.trim() : '',
        site: el('cfgSite') ? el('cfgSite').value.trim() : '',
        endereco: el('cfgEndereco') ? el('cfgEndereco').value.trim() : '',
        condicoesPadrao: el('cfgCondicoesPadrao') ? el('cfgCondicoesPadrao').value.trim() : '',
        validadeDias: el('cfgValidadeDias') ? parseInt(el('cfgValidadeDias').value) || 15 : 15,
        prazoEntregaPadrao: el('cfgPrazoEntregaPadrao') ? el('cfgPrazoEntregaPadrao').value.trim() : '',
        observacoesPadrao: el('cfgObservacoesPadrao') ? el('cfgObservacoesPadrao').value.trim() : '',
    };

    console.log('[Config] Salvando:', {
        ...novaConfig,
        logo: novaConfig.logo ? `[${novaConfig.logo.length} chars]` : '',
    });

    if (typeof saveConfig === 'function') {
        saveConfig(novaConfig);
    } else {
        localStorage.setItem('wd_config', JSON.stringify(novaConfig));
    }

    showToast('Configurações salvas com sucesso!', 'success');

    // Limpar flag de novo logo
    if (logoImg) logoImg.dataset.newLogo = '';
}

/**
 * Restaurar configurações padrão
 */
function resetarConfiguracoes() {
    if (!confirm('Tem certeza que deseja restaurar as configurações padrão? Isso apagará todas as personalizações.')) {
        return;
    }

    localStorage.removeItem('wd_config');

    showToast('Configurações restauradas para o padrão', 'info');
    setTimeout(() => {
        window.location.reload();
    }, 800);
}

/**
 * Verifica se a API está online
 */
async function verificarStatusAPI() {
    const statusEl = document.getElementById('cfgApiStatus');
    if (!statusEl) return;

    try {
        const data = await apiGet('/health');
        if (data && data.status === 'healthy') {
            statusEl.innerHTML = '<span style="color: var(--success-color, #22c55e);">Online (banco conectado)</span>';
        } else {
            statusEl.innerHTML = '<span style="color: var(--warning-color, #f59e0b);">Instável</span>';
        }
    } catch (error) {
        console.error('[Config] Erro ao verificar API:', error);
        statusEl.innerHTML = '<span style="color: var(--danger-color, #ef4444);">Offline</span>';
    }
}
