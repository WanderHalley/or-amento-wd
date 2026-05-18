/**
 * configuracoes.js — Aba Configurações (SPA)
 * Função de entrada: init_configuracoes()
 */

let configuracoes_mascarasAplicadas = false;

function init_configuracoes() {
    console.log('[Configurações] Inicializando...');
    if (!configuracoes_mascarasAplicadas) {
        aplicarMascarasConfig();
        configuracoes_mascarasAplicadas = true;
    }
    carregarConfiguracoes();
    verificarStatusAPI();
}

function aplicarMascarasConfig() {
    const cnpjInput = document.getElementById('cfgCnpj');
    const telInput = document.getElementById('cfgTelefone');
    if (cnpjInput) cnpjInput.addEventListener('input', function () { this.value = formatCNPJ(this.value); });
    if (telInput) telInput.addEventListener('input', function () { this.value = formatPhone(this.value); });
}

function carregarConfiguracoes() {
    const config = getConfig();

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

    const cnpjInput = document.getElementById('cfgCnpj');
    if (cnpjInput) cnpjInput.value = config.cnpj ? formatCNPJ(config.cnpj) : '';

    const telInput = document.getElementById('cfgTelefone');
    if (telInput) telInput.value = config.telefone ? formatPhone(config.telefone) : '';
}

async function previewLogoConfig(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const base64 = await readFileAsBase64(file, 500 * 1024, ['image/jpeg', 'image/png', 'image/webp']);
        const logoImg = document.getElementById('cfgLogoImg');
        const btnRemover = document.getElementById('btnRemoverLogo');
        if (logoImg) { logoImg.src = base64; logoImg.style.display = 'block'; logoImg.dataset.newLogo = base64; }
        if (btnRemover) btnRemover.style.display = 'inline-block';
    } catch (error) {
        console.error('[Config] Erro upload logo:', error);
        showToast(error.message || 'Erro ao carregar logo', 'error');
        event.target.value = '';
    }
}

function removerLogoConfig() {
    const logoImg = document.getElementById('cfgLogoImg');
    const fileInput = document.getElementById('cfgLogo');
    const btnRemover = document.getElementById('btnRemoverLogo');
    if (logoImg) { logoImg.src = ''; logoImg.style.display = 'none'; logoImg.dataset.newLogo = ''; }
    if (fileInput) fileInput.value = '';
    if (btnRemover) btnRemover.style.display = 'none';
}

function salvarConfiguracoes(event) {
    event.preventDefault();
    const nomeEmpresa = document.getElementById('cfgNomeEmpresa')?.value.trim() || '';
    if (!nomeEmpresa) { showToast('Nome da empresa é obrigatório', 'warning'); return; }

    const configAtual = getConfig();
    const logoImg = document.getElementById('cfgLogoImg');
    const newLogo = logoImg ? logoImg.dataset.newLogo : undefined;
    let logo = configAtual.logo || '';
    if (newLogo !== undefined && newLogo !== '') logo = newLogo;
    else if (logoImg && logoImg.style.display === 'none') logo = '';

    const el = (id) => document.getElementById(id);
    const novaConfig = {
        logo,
        nomeEmpresa,
        cnpj: unmaskValue(el('cfgCnpj')?.value || ''),
        telefone: unmaskValue(el('cfgTelefone')?.value || ''),
        email: el('cfgEmail')?.value.trim() || '',
        site: el('cfgSite')?.value.trim() || '',
        endereco: el('cfgEndereco')?.value.trim() || '',
        condicoesPadrao: el('cfgCondicoesPadrao')?.value.trim() || '',
        validadeDias: parseInt(el('cfgValidadeDias')?.value) || 15,
        prazoEntregaPadrao: el('cfgPrazoEntregaPadrao')?.value.trim() || '',
        observacoesPadrao: el('cfgObservacoesPadrao')?.value.trim() || '',
    };

    saveConfig(novaConfig);
    showToast('Configurações salvas!', 'success');
    if (logoImg) logoImg.dataset.newLogo = '';
}

function resetarConfiguracoes() {
    if (!confirm('Restaurar configurações padrão? Isso apagará todas as personalizações.')) return;
    localStorage.removeItem('wd_config');
    showToast('Configurações restauradas', 'info');
    carregarConfiguracoes();
}

async function verificarStatusAPI() {
    const statusEl = document.getElementById('cfgApiStatus');
    if (!statusEl) return;
    try {
        const data = await apiGet('/health');
        if (data && data.status === 'healthy') {
            statusEl.innerHTML = '<span style="color: var(--success, #22c55e);">Online</span>';
        } else {
            statusEl.innerHTML = '<span style="color: var(--warning, #f59e0b);">Instável</span>';
        }
    } catch (error) {
        statusEl.innerHTML = '<span style="color: var(--danger, #ef4444);">Offline</span>';
    }
}
