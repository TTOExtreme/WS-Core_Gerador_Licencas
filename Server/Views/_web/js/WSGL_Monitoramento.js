// WSGL_Monitoramento.js — monitoramento de ambientes/clusters do modulo Gerador de Licencas (Fase G4)
// Tela de leitura (Instrucao_Modulo_Tela.md §3): usa Controle_Tela_Tabela, sem botoes de escrita.
// Guard contra dupla execucao.
if (!window._TelaWSGLMonitoramento_Registrada) {
    window._TelaWSGLMonitoramento_Registrada = true;

    _Eventos.on("open/wsgl/monitoramento", () => {
        new Controle_Tela_Tabela(_configMonitoramento()).Abrir();
    });
}

/**
 * Factory de configuracao — chamada a cada abertura para garantir
 * closures frescos por instancia.
 */
function _configMonitoramento() {
    return {
        // ── Identidade ──────────────────────────────────────────
        titulo: "Monitoramento",
        icone: "monitor_heart",
        instanciaUnica: true,
        chaveUnica: "wsgl_monitoramento",

        // ── Dados ───────────────────────────────────────────────
        limiteRegistros: 50,
        ordemPadrao: "ultima_comunicacao",
        direcaoPadrao: "desc",

        carregarDados(params, callback) {
            _WebSocket.Emit("wsgl/monitoramento.listar", "WSCore_GeradorLicencas/*", params, (resposta) => {
                if (resposta && resposta.status === "OK") callback({ registros: resposta.registros, total: resposta.total });
                else callback({ erro: true, mensagem: (resposta && resposta.mensagem) || "Falha ao carregar registros." });
            });
        },

        // ── Estado vazio ────────────────────────────────────────
        iconeVazio: "monitor_heart",
        textoVazio: "Nenhum cluster encontrado",
        textoVazioSub: "Nenhum ambiente/cluster foi cadastrado ainda.",

        // ── Colunas ─────────────────────────────────────────────
        colunas: [
            { chave: "cluster_nome", titulo: "Cluster", tipo: "texto", larguraMin: "160px" },
            { chave: "cliente_razao_social", titulo: "Cliente", tipo: "texto", larguraMin: "180px" },
            { chave: "ambiente_nome", titulo: "Ambiente", tipo: "texto", larguraMin: "140px" },
            {
                chave: "situacao", titulo: "Situação", tipo: "status", larguraMin: "110px",
                mapaStatus: {
                    aprovado: { cls: "ativo", label: "Aprovado" },
                    pendente: { cls: "aviso", label: "Pendente" },
                    bloqueado: { cls: "bloqueado", label: "Bloqueado" },
                    inativo: { cls: "inativo", label: "Inativo" },
                },
            },
            {
                chave: "conexao", titulo: "Conexão", tipo: "status", larguraMin: "110px",
                mapaStatus: {
                    online: { cls: "ativo", label: "Online" },
                    offline: { cls: "inativo", label: "Offline" },
                },
            },
            { chave: "licencas_ativas", titulo: "Licenças Ativas", tipo: "texto", larguraMin: "120px", ordenavel: false },
            { chave: "validade_mais_proxima", titulo: "Validade Mais Próxima", tipo: "data", larguraMin: "150px" },
            { chave: "ultima_comunicacao", titulo: "Última Comunicação", tipo: "data", larguraMin: "150px" },
        ],

        // Tela de leitura: sem botoes de escrita.
        botoes: [],
    };
}
