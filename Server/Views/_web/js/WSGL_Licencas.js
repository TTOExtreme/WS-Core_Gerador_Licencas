// WSGL_Licencas.js — tela de emissao e consulta de licencas do modulo Gerador de Licencas (Fase G2)
// Reaproveita o modal de formulario generico (window.WSGL_ModalFormulario) e o padrao de
// campo 'referencia' ja registrados por WSGL_Cadastros.js (ambas as telas sao carregadas
// no mesmo WSCore). Nao ha necessidade de duplicar/extrair esse util aqui.
// Guard contra dupla execucao.
if (!window._TelaWSGLLicencas_Registrada) {
    window._TelaWSGLLicencas_Registrada = true;

    _Eventos.on("open/wsgl/licencas", () => {
        // Pré-carrega o modal de formulário (definido em WSGL_Cadastros.js) assim que a tela abre,
        // para que a emissão funcione mesmo sem ter passado antes por uma tela de cadastro.
        window._WSGL_GarantirFormulario();
        new Controle_Tela_Tabela(_configLicencas()).Abrir();
    });
}

// Garante que o modal genérico (window.WSGL_ModalFormulario, registrado por WSGL_Cadastros.js)
// esteja disponível — carregando WSGL_Cadastros.js sob demanda. Resolve quando o modal existir.
// Idempotente e compartilhado entre as telas do Gerador (definido uma vez em window).
window._WSGL_GarantirFormulario = window._WSGL_GarantirFormulario || function () {
    return new Promise((resolve, reject) => {
        if (window.WSGL_ModalFormulario) { resolve(); return; }
        if (!document.querySelector('script[data-wsgl-cadastros]')) {
            const s = document.createElement("script");
            s.src = "./modulos/WSCore_GeradorLicencas/js/WSGL_Cadastros.js";
            s.setAttribute("data-wsgl-cadastros", "1");
            s.onerror = () => reject({ mensagem: "Falha ao carregar o formulário (WSGL_Cadastros.js)" });
            document.head.appendChild(s);
        }
        const inicio = Date.now();
        const iv = setInterval(() => {
            if (window.WSGL_ModalFormulario) { clearInterval(iv); resolve(); }
            else if (Date.now() - inicio > 5000) { clearInterval(iv); reject({ mensagem: "Tempo esgotado ao carregar o formulário" }); }
        }, 50);
    });
};

// Valores do enum TipoLicenca (Server/Controllers/Lib/Licenca/Tipos.ts).
const _WSGL_TIPOS_LICENCA = [
    { valor: "base", label: "Base" },
    { valor: "modulo", label: "Módulo" },
    { valor: "instancia_modulo", label: "Instância de Módulo" },
    { valor: "uso_unico", label: "Uso Único" },
    { valor: "uso_multiplo", label: "Uso Múltiplo" },
    { valor: "integracao", label: "Integração" },
    { valor: "nivel_usuario", label: "Nível de Usuário" },
    { valor: "nivel_modulo", label: "Nível de Módulo" },
    { valor: "ambiente", label: "Ambiente" },
    { valor: "core_adicional", label: "Core Adicional" },
];

// Valores do enum NivelComercial (Server/Controllers/Lib/Licenca/Tipos.ts).
const _WSGL_NIVEIS_LICENCA = [
    { valor: "basic", label: "Basic" },
    { valor: "professional", label: "Professional" },
    { valor: "enterprise", label: "Enterprise" },
    { valor: "integracao", label: "Integração" },
];

// Eixos ortogonais da licenca (Server/Controllers/Lib/Licenca/Tipos.ts).
const _WSGL_ESCOPOS_LICENCA = [
    { valor: "base", label: "Base (todos os módulos)" },
    { valor: "modulo", label: "Módulo específico" },
    { valor: "instancia", label: "Instância de módulo (conexão no Core)" },
];
const _WSGL_MODELOS_USO = [
    { valor: "simultaneos", label: "N usuários simultâneos" },
    { valor: "unico", label: "Usuário único" },
];
const _WSGL_QUANTIDADES = [5, 10, 50, 100, 500, 1000, 5000].map((n) => ({ valor: n, label: String(n) }));

/**
 * Busca o catalogo de modulos/versoes para o select de emissao. Exclui versoes
 * descomissionadas (nao permitem nova licenca); beta entra com marcador.
 * Retorna [{ valor: "modulo_nome|||versao", label }]. Falha silenciosa -> lista vazia.
 */
function _WSGL_CarregarOpcoesModulo() {
    return new Promise((resolve) => {
        _WebSocket.Emit("wsgl/modulos.opcoes", "WSCore_GeradorLicencas/*", {}, (r) => {
            if (!r || r.status !== "OK" || !Array.isArray(r.registros)) { resolve([]); return; }
            const ops = r.registros
                .filter((m) => m.situacao !== "descomissionado")
                .map((m) => ({
                    valor: m.modulo_nome + "|||" + m.versao,
                    label: (m.modulo_titulo || m.modulo_nome) + " — v" + m.versao + (m.situacao === "beta" ? " [beta]" : ""),
                }));
            resolve(ops);
        });
    });
}

/**
 * Busca os ambientes cadastrados e monta um mapa id→tipo, usado para exibir o
 * campo de duração da avaliação apenas quando o ambiente selecionado é do tipo `teste`.
 * Falha silenciosa -> mapa vazio (campo simplesmente não aparece).
 */
function _WSGL_CarregarAmbientesTipo() {
    return new Promise((resolve) => {
        _WebSocket.Emit("wsgl/ambientes.listar", "WSCore_GeradorLicencas/*",
            { pagina: 1, limite: 500, pesquisa: "", ordem: "nome", direcao: "asc" }, (r) => {
                const mapa = {};
                if (r && r.status === "OK" && Array.isArray(r.registros)) {
                    for (const a of r.registros) mapa[String(a.id)] = a.tipo;
                }
                resolve(mapa);
            });
    });
}
const _WSGL_DURACOES_TESTE = [
    { valor: "30", label: "30 dias" }, { valor: "60", label: "60 dias" },
    { valor: "90", label: "90 dias" }, { valor: "180", label: "180 dias" },
    { valor: "360", label: "360 dias" }, { valor: "720", label: "720 dias" },
    { valor: "3650", label: "3650 dias (10 anos)" },
];

/**
 * Factory de configuracao — chamada a cada abertura para garantir
 * closures frescos por instancia.
 */
function _configLicencas() {
    function notificar(titulo, ok) {
        _Notificacoes.Adicionar_Notificacao(
            Date.now(), titulo,
            ok ? { Titulo: "Sucesso", Cor: "#26a69a", Background: "#1a2e2e" }
               : { Titulo: "Erro", Cor: "#ef5350", Background: "#2e1a1a" },
            "", {}
        );
    }

    return {
        // ── Identidade ──────────────────────────────────────────
        titulo: "Licenças",
        icone: "key",
        instanciaUnica: true,
        chaveUnica: "wsgl_licencas",

        // ── Dados ───────────────────────────────────────────────
        limiteRegistros: 50,
        ordemPadrao: "criado_em",
        direcaoPadrao: "desc",

        carregarDados(params, callback) {
            _WebSocket.Emit("wsgl/licencas.listar", "WSCore_GeradorLicencas/*", params, (resposta) => {
                if (resposta && resposta.status === "OK") callback({ registros: resposta.registros, total: resposta.total });
                else callback({ erro: true, mensagem: (resposta && resposta.mensagem) || "Falha ao carregar registros." });
            });
        },

        // ── Estado vazio ────────────────────────────────────────
        iconeVazio: "key_off",
        textoVazio: "Nenhuma licença emitida",
        textoVazioSub: 'Emita a primeira licença clicando em "Emitir Licença".',

        // ── Colunas ─────────────────────────────────────────────
        colunas: [
            { chave: "lic_id", titulo: "ID da Licença", tipo: "texto", larguraMin: "220px" },
            { chave: "tipo", titulo: "Tipo", tipo: "texto", larguraMin: "140px" },
            { chave: "cliente_razao_social", titulo: "Cliente", tipo: "texto", larguraMin: "180px" },
            { chave: "ambiente_nome", titulo: "Ambiente", tipo: "texto", larguraMin: "140px" },
            { chave: "cluster_nome", titulo: "Cluster", tipo: "texto", larguraMin: "140px" },
            {
                chave: "situacao", titulo: "Situação", tipo: "status", larguraMin: "110px",
                mapaStatus: {
                    ativa: { cls: "ativo", label: "Ativa" },
                    expirada: { cls: "bloqueado", label: "Expirada" },
                    revogada: { cls: "inativo", label: "Revogada" },
                    substituida: { cls: "inativo", label: "Substituída" },
                },
            },
            { chave: "expira_em", titulo: "Expira em", tipo: "data", larguraMin: "130px" },
        ],

        // ── Botões ──────────────────────────────────────────────
        botoes: [
            // ── Grupo 1 ─────────────────────────────────────────
            {
                id: "emitir",
                label: "Emitir Licença",
                icone: "key",
                tipo: "primario",
                grupo: 1,
                requerSelecao: 0,
                title: "Emitir uma nova licença assinada",
                async aoClicar(_sel, _dados, tela) {
                    await window._WSGL_GarantirFormulario();
                    const opcoesModulo = await _WSGL_CarregarOpcoesModulo();
                    const ambTipo = await _WSGL_CarregarAmbientesTipo();
                    const vals = await window.WSGL_ModalFormulario.Abrir({
                        titulo: "Emitir Licença",
                        campos: [
                            { chave: "escopo", label: "Escopo", tipo: "select", opcoes: _WSGL_ESCOPOS_LICENCA, obrigatorio: true },
                            { chave: "cliente_id", label: "Cliente", tipo: "referencia", entidade: "clientes", rotulo: "razao_social", obrigatorio: true },
                            { chave: "ambiente_id", label: "Ambiente", tipo: "referencia", entidade: "ambientes", rotulo: "nome", obrigatorio: true },
                            { chave: "cluster_id", label: "Cluster", tipo: "referencia", entidade: "clusters", rotulo: "nome", obrigatorio: true },
                            { chave: "contrato_id", label: "Contrato", tipo: "referencia", entidade: "contratos", rotulo: "codigo" },
                            { chave: "modulo_versao", label: "Módulo / Versão", tipo: "select", opcoes: opcoesModulo, mostrarSe: (v) => v.escopo === "modulo" || v.escopo === "instancia" },
                            { chave: "nivel", label: "Nível", tipo: "select", opcoes: _WSGL_NIVEIS_LICENCA, mostrarSe: (v) => v.escopo === "base" || v.escopo === "modulo" },
                            { chave: "modelo_uso", label: "Modelo de uso", tipo: "select", opcoes: _WSGL_MODELOS_USO, mostrarSe: (v) => v.escopo === "base" || v.escopo === "modulo" },
                            { chave: "vagas", label: "Quantidade (assentos)", tipo: "select", opcoes: _WSGL_QUANTIDADES, mostrarSe: (v) => (v.escopo === "base" || v.escopo === "modulo") && (v.modelo_uso === "simultaneos" || v.modelo_uso === "unico") },
                            { chave: "validadeDias", label: "Duração da avaliação", tipo: "select", opcoes: _WSGL_DURACOES_TESTE,
                              mostrarSe: (v) => ambTipo[String(v.ambiente_id)] === "teste" },
                        ],
                        valores: {},
                    });
                    if (!vals) return;
                    // Divide o par "modulo|||versao" — só para escopos que usam módulo (módulo/instância);
                    // Base ignora módulo/versão (mesmo que o campo oculto retorne algo).
                    if (vals.escopo !== "base" && vals.modulo_versao) {
                        const partes = String(vals.modulo_versao).split("|||");
                        vals.modulo = partes[0] || null;
                        vals.versao = partes[1] || null;
                    } else {
                        vals.modulo = null;
                        vals.versao = null;
                    }
                    delete vals.modulo_versao;
                    if (vals.validadeDias) vals.validadeDias = Number(vals.validadeDias);
                    _WebSocket.Emit("wsgl/licencas.emitir", "WSCore_GeradorLicencas/*", vals, (r) => {
                        if (r && r.status === "OK") {
                            tela.LimparSelecao();
                            tela.Recarregar();
                            notificar("Licença emitida com sucesso", true);
                            _LogAtividades.Registrar("Licença emitida", "info");
                        } else {
                            notificar((r && r.mensagem) || "Erro ao emitir licença", false);
                        }
                    });
                },
            },

            // ── Grupo 2 ─────────────────────────────────────────
            {
                id: "renovar",
                label: "Renovar",
                icone: "autorenew",
                tipo: "padrao",
                grupo: 2,
                requerSelecao: -1,
                permissao: "wsgl/licencas.renovar",
                title: "Renova a licença selecionada por mais 30 dias",
                async aoClicar(sel, _dados, tela) {
                    _WebSocket.Emit("wsgl/licencas.renovar", "WSCore_GeradorLicencas/*", { id: sel[0].id }, (r) => {
                        if (r && r.status === "OK") {
                            tela.LimparSelecao();
                            tela.Recarregar();
                            notificar("Licença renovada com sucesso", true);
                            _LogAtividades.Registrar("Licença renovada", "info");
                        } else {
                            notificar((r && r.mensagem) || "Erro ao renovar licença", false);
                        }
                    });
                },
            },
            {
                id: "estender",
                label: "Estender",
                icone: "more_time",
                tipo: "padrao",
                grupo: 2,
                requerSelecao: -1,
                permissao: "wsgl/licencas.estender",
                title: "Estende temporariamente a validade da licença selecionada",
                async aoClicar(sel, _dados, tela) {
                    await window._WSGL_GarantirFormulario();
                    const reg = sel[0];
                    const vals = await window.WSGL_ModalFormulario.Abrir({
                        titulo: "Estender Licença",
                        campos: [
                            { chave: "dias", label: "Dias de extensão", tipo: "numero", obrigatorio: true },
                            { chave: "motivo", label: "Motivo", tipo: "texto", obrigatorio: true },
                        ],
                        valores: {},
                    });
                    if (!vals) return;
                    _WebSocket.Emit("wsgl/licencas.estender", "WSCore_GeradorLicencas/*", { id: reg.id, dias: vals.dias, motivo: vals.motivo }, (r) => {
                        if (r && r.status === "OK") {
                            tela.LimparSelecao();
                            tela.Recarregar();
                            notificar("Licença estendida com sucesso", true);
                            _LogAtividades.Registrar("Licença estendida", "info");
                        } else {
                            notificar((r && r.mensagem) || "Erro ao estender licença", false);
                        }
                    });
                },
            },
            {
                id: "copiar_jws",
                label: "Copiar licença (JWS)",
                icone: "content_copy",
                tipo: "padrao",
                grupo: 2,
                requerSelecao: 1,
                title: "Copia o JWS da licença para instalar offline no ambiente de avaliação",
                async aoClicar(sel) {
                    const jws = sel[0] && sel[0].jws;
                    if (!jws) { notificar("JWS não disponível para esta licença", false); return; }
                    try {
                        await navigator.clipboard.writeText(jws);
                        notificar("Licença (JWS) copiada", true);
                    } catch {
                        notificar("Não foi possível copiar", false);
                    }
                },
            },

            // ── Grupo 3 ─────────────────────────────────────────
            {
                id: "revogar",
                label: "Revogar",
                icone: "block",
                tipo: "perigo",
                grupo: 3,
                requerSelecao: 1,
                permissao: "wsgl/licencas.revogar",
                title: "Revoga a(s) licença(s) selecionada(s) — irreversível",
                async aoClicar(sel, _dados, tela) {
                    const regs = (sel || []).filter(Boolean);
                    if (regs.length === 0) return;
                    const umaSo = regs.length === 1;
                    const confirmado = await WSCore_ModalConfirmacao.Abrir({
                        tipo: "aviso",
                        titulo: umaSo ? "Revogar licença" : ("Revogar " + regs.length + " licenças"),
                        subtitulo: "A(s) licença(s) deixará(ão) de ser válida(s) para a API de validação. Esta ação não pode ser desfeita.",
                        registros: regs.map((r) => ({ label: r.lic_id || ("#" + r.id) })),
                        textoConfirmacao: umaSo ? (regs[0].lic_id || "REVOGAR") : "REVOGAR",
                        textoBotao: umaSo ? "Revogar licença" : "Revogar selecionadas",
                    });
                    if (!confirmado) return;
                    await window._WSGL_GarantirFormulario();
                    const vals = await window.WSGL_ModalFormulario.Abrir({
                        titulo: "Motivo da Revogação",
                        campos: [
                            { chave: "motivo", label: "Motivo", tipo: "texto", obrigatorio: true },
                        ],
                        valores: {},
                    });
                    if (!vals) return;
                    const revogarUma = (reg) => new Promise((resolve) => {
                        _WebSocket.Emit("wsgl/licencas.revogar", "WSCore_GeradorLicencas/*", { id: reg.id, motivo: vals.motivo }, (r) => {
                            resolve(!!(r && r.status === "OK"));
                        });
                    });
                    let ok = 0;
                    for (const reg of regs) { if (await revogarUma(reg)) ok++; }
                    const falhas = regs.length - ok;
                    tela.LimparSelecao();
                    tela.Recarregar();
                    if (falhas === 0) {
                        notificar(umaSo ? "Licença revogada com sucesso" : (ok + " licenças revogadas"), true);
                    } else {
                        notificar(ok + " revogada(s), " + falhas + " falhou(aram)", false);
                    }
                    _LogAtividades.Registrar("Revogação de licença (" + ok + "/" + regs.length + ")", "aviso");
                },
            },
        ],
    };
}
