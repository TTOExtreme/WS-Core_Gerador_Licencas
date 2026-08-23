// WSGL_Licencas.js — tela de emissao e consulta de licencas do modulo Gerador de Licencas (Fase G2)
// Reaproveita o modal de formulario generico (window.WSGL_ModalFormulario) e o padrao de
// campo 'referencia' ja registrados por WSGL_Cadastros.js (ambas as telas sao carregadas
// no mesmo WSCore). Nao ha necessidade de duplicar/extrair esse util aqui.
// Guard contra dupla execucao.
if (!window._TelaWSGLLicencas_Registrada) {
    window._TelaWSGLLicencas_Registrada = true;

    _Eventos.on("open/wsgl/licencas", () => {
        new Controle_Tela_Tabela(_configLicencas()).Abrir();
    });
}

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
                    const vals = await window.WSGL_ModalFormulario.Abrir({
                        titulo: "Emitir Licença",
                        campos: [
                            { chave: "tipo", label: "Tipo", tipo: "select", opcoes: _WSGL_TIPOS_LICENCA, obrigatorio: true },
                            { chave: "cliente_id", label: "Cliente", tipo: "referencia", entidade: "clientes", rotulo: "razao_social", obrigatorio: true },
                            { chave: "ambiente_id", label: "Ambiente", tipo: "referencia", entidade: "ambientes", rotulo: "nome", obrigatorio: true },
                            { chave: "cluster_id", label: "Cluster", tipo: "referencia", entidade: "clusters", rotulo: "nome", obrigatorio: true },
                            { chave: "contrato_id", label: "Contrato", tipo: "referencia", entidade: "contratos", rotulo: "codigo" },
                            { chave: "modulo", label: "Módulo", tipo: "texto" },
                            { chave: "instancia", label: "Instância", tipo: "texto" },
                            { chave: "nivel", label: "Nível", tipo: "select", opcoes: _WSGL_NIVEIS_LICENCA },
                        ],
                        valores: {},
                    });
                    if (!vals) return;
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
        ],
    };
}
