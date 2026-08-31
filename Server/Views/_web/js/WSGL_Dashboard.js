// WSGL_Dashboard.js — painel geral de indicadores do modulo Gerador de Licencas (Fase G4)
// Tela customizada de cards (sem tabela). Usa Controle_Tela_Conteudo (padrao de
// WSCore_Financeiro/Dashboard.js): a classe monta o conteudo DENTRO da area da aba via
// renderizar(container) — NAO manipular document.body/Controle_Tela manualmente.
// Guard contra dupla execucao.
if (!window._TelaWSGLDashboard_Registrada) {
    window._TelaWSGLDashboard_Registrada = true;

    _Eventos.on("open/wsgl/dashboard", () => {
        _WSGL_AbrirTelaDashboard();
    });
}

// Definicao dos cards exibidos no dashboard: rotulo, campo em ResumoDashboard e cor de destaque.
const _WSGL_DASHBOARD_CARDS = [
    { chave: "clientes_ativos", label: "Clientes Ativos", icone: "apartment", cor: "var(--accent)" },
    { chave: "contratos_ativos", label: "Contratos Ativos", icone: "description", cor: "var(--accent)" },
    { chave: "ambientes", label: "Ambientes", icone: "dns", cor: "var(--accent)" },
    { chave: "clusters_pendentes", label: "Clusters Pendentes", icone: "hub", cor: "var(--cor_aviso)" },
    { chave: "licencas_ativas", label: "Licenças Ativas", icone: "key", cor: "var(--cor_sucesso)" },
    { chave: "licencas_vencendo", label: "Licenças Vencendo", icone: "schedule", cor: "var(--cor_aviso)" },
    { chave: "licencas_expiradas", label: "Licenças Expiradas", icone: "event_busy", cor: "var(--cor_erro)" },
    { chave: "licencas_revogadas", label: "Licenças Revogadas", icone: "block", cor: "var(--cor_erro)" },
];

function _WSGL_AbrirTelaDashboard() {
    const tela = new Controle_Tela_Conteudo({
        titulo: "Dashboard de Licenciamento",
        icone: "insights",
        instanciaUnica: true,
        chaveUnica: "wsgl_dashboard",
        botoes: [
            { id: "atualizar", label: "Atualizar", icone: "refresh", tipo: "padrao", grupo: 1, requerSelecao: 0, aoClicar: () => _WSGL_CarregarDashboard() },
        ],
        renderizar(container) {
            window._WSGLDashCtx = { container };
            container.style.cssText = "padding:20px;font-family:var(--font_principal);color:var(--texto_primario);box-sizing:border-box;overflow:auto;";
            container.innerHTML =
                '<h2 style="margin:0 0 4px 0;font-size:18px;color:var(--texto_primario);">Dashboard de Licenciamento</h2>' +
                '<div style="margin:0 0 20px 0;font-size:12px;color:var(--texto_secundario);">Visão geral de clientes, contratos, ambientes e licenças</div>' +
                '<div id="wsgl_dash_grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:14px;"></div>';
            _WSGL_CarregarDashboard();
        },
    });
    tela.Abrir();
    _LogAtividades.Registrar("Aberto: Dashboard", "info");
}

function _WSGL_CarregarDashboard() {
    const ctx = window._WSGLDashCtx;
    if (!ctx || !ctx.container || !ctx.container.isConnected) return;
    const grid = ctx.container.querySelector("#wsgl_dash_grid");
    if (!grid) return;
    _WSGL_RenderizarCardsCarregando(grid);
    _WebSocket.Emit("wsgl/dashboard.resumo", "WSCore_GeradorLicencas/*", {}, (r) => {
        if (!ctx.container.isConnected) return;
        // Socket_Dashboard responde { status:'OK', dados:{...indicadores} }.
        const resumo = r && (r.dados || r);
        if (r && r.status === "OK" && resumo) {
            _WSGL_RenderizarCardsResumo(grid, resumo);
        } else {
            _WSGL_RenderizarCardsErro(grid, (r && r.mensagem) || "Falha ao carregar indicadores.");
        }
    });
}

function _WSGL_RenderizarCardsCarregando(grid) {
    grid.innerHTML = "";
    for (const def of _WSGL_DASHBOARD_CARDS) {
        grid.appendChild(_WSGL_CriarCard(def, "…"));
    }
}

function _WSGL_RenderizarCardsResumo(grid, resumo) {
    grid.innerHTML = "";
    for (const def of _WSGL_DASHBOARD_CARDS) {
        const bruto = resumo[def.chave];
        const numero = Number(bruto);
        const valor = Number.isFinite(numero) ? numero : 0;
        grid.appendChild(_WSGL_CriarCard(def, String(valor)));
    }
}

function _WSGL_RenderizarCardsErro(grid, mensagem) {
    grid.innerHTML = "";
    const aviso = document.createElement("div");
    aviso.style.cssText = "grid-column:1 / -1;padding:16px;border:1px solid var(--cor_erro);border-radius:8px;background:var(--bg_secundario);color:var(--cor_erro);font-size:13px;";
    aviso.textContent = String(mensagem);
    grid.appendChild(aviso);
}

function _WSGL_CriarCard(def, valorTexto) {
    const card = document.createElement("div");
    card.id = "wsgl_dash_card_" + def.chave;
    card.style.cssText = "background:var(--bg_secundario);border:1px solid var(--border_primario);border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:8px;";

    const topo = document.createElement("div");
    topo.style.cssText = "display:flex;align-items:center;justify-content:space-between;";

    const label = document.createElement("div");
    label.textContent = def.label;
    label.style.cssText = "font-size:12px;color:var(--texto_secundario);";
    topo.appendChild(label);

    const icone = document.createElement("span");
    icone.className = "material-symbols-outlined";
    icone.textContent = def.icone;
    icone.style.cssText = "font-size:18px;color:" + def.cor + ";";
    topo.appendChild(icone);

    card.appendChild(topo);

    const numero = document.createElement("div");
    numero.id = "wsgl_dash_valor_" + def.chave;
    numero.textContent = valorTexto;
    numero.style.cssText = "font-size:30px;font-weight:600;color:" + def.cor + ";line-height:1.1;";
    card.appendChild(numero);

    return card;
}
