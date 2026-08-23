// WSGL_Dashboard.js — painel geral de indicadores do modulo Gerador de Licencas (Fase G4)
// Tela customizada (Instrucao_Modulo_Tela.md §9): nao usa Controle_Tela_Tabela pois o
// layout e uma grade de cards de indicadores, sem tabela/paginacao/busca.
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
    const ID_TELA = "wsgl_dash_" + _GeraString().substring(0, 14);
    const tela = new Controle_Tela(ID_TELA, "Dashboard");

    Adicionar_Aba_Superior(
        ID_TELA, "Dashboard",
        window._Favoritos?.EhFavoritado(ID_TELA) ?? false,
        () => tela.Abrir_Tela()
    );

    tela.instancia_tela = document.createElement("div");
    tela.instancia_tela.id = ID_TELA;
    tela.instancia_tela.className = "WSCore_tela_holder hide";
    tela.instancia_tela.style.cssText = "padding:20px;font-family:var(--font_principal);color:var(--texto_primario);box-sizing:border-box;";

    const titulo = document.createElement("h2");
    titulo.textContent = "Dashboard de Licenciamento";
    titulo.style.cssText = "margin:0 0 4px 0;font-size:18px;color:var(--texto_primario);";
    tela.instancia_tela.appendChild(titulo);

    const subtitulo = document.createElement("div");
    subtitulo.textContent = "Visão geral de clientes, contratos, ambientes e licenças";
    subtitulo.style.cssText = "margin:0 0 20px 0;font-size:12px;color:var(--texto_secundario);";
    tela.instancia_tela.appendChild(subtitulo);

    const grid = document.createElement("div");
    grid.id = "wsgl_dash_grid";
    grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:14px;";
    tela.instancia_tela.appendChild(grid);

    _WSGL_RenderizarCardsCarregando(grid);

    document.body.appendChild(tela.instancia_tela);
    tela.Abrir_Tela();
    _LogAtividades.Registrar("Aberto: Dashboard", "info");

    _WebSocket.Emit("wsgl/dashboard.resumo", "WSCore_GeradorLicencas/*", {}, (r) => {
        if (r && (r.status === "OK" || typeof r.clientes_ativos !== "undefined")) {
            _WSGL_RenderizarCardsResumo(grid, r);
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
