// WSGL_Auditoria.js — consulta de auditoria do Licenciador (Fase G4)
// Tela de leitura (Instrucao_Modulo_Tela.md §3): usa Controle_Tela_Tabela, sem botoes de escrita.
// Guard contra dupla execucao.
if (!window._TelaWSGLAuditoria_Registrada) {
    window._TelaWSGLAuditoria_Registrada = true;

    _Eventos.on("open/wsgl/auditoria", () => {
        new Controle_Tela_Tabela(_configAuditoria()).Abrir();
    });
}

/**
 * Factory de configuracao — chamada a cada abertura para garantir
 * closures frescos por instancia.
 */
function _configAuditoria() {
    return {
        // ── Identidade ──────────────────────────────────────────
        titulo: "Auditoria",
        icone: "fact_check",
        instanciaUnica: true,
        chaveUnica: "wsgl_auditoria",

        // ── Dados ───────────────────────────────────────────────
        limiteRegistros: 50,
        ordemPadrao: "criado_em",
        direcaoPadrao: "desc",

        carregarDados(params, callback) {
            _WebSocket.Emit("wsgl/auditoria.listar", "WSCore_GeradorLicencas/*", params, (resposta) => {
                if (resposta && resposta.status === "OK") callback({ registros: resposta.registros, total: resposta.total });
                else callback({ erro: true, mensagem: (resposta && resposta.mensagem) || "Falha ao carregar registros." });
            });
        },

        // ── Estado vazio ────────────────────────────────────────
        iconeVazio: "fact_check",
        textoVazio: "Nenhum evento de auditoria encontrado",
        textoVazioSub: "Ainda não há eventos registrados para os filtros atuais.",

        // ── Colunas ─────────────────────────────────────────────
        colunas: [
            { chave: "criado_em", titulo: "Data/Hora", tipo: "data", larguraMin: "150px" },
            { chave: "evento", titulo: "Evento", tipo: "texto", larguraMin: "180px" },
            { chave: "usuario_login", titulo: "Usuário", tipo: "texto", larguraMin: "140px" },
            {
                chave: "status", titulo: "Status", tipo: "status", larguraMin: "110px",
                mapaStatus: {
                    OK: { cls: "ativo", label: "OK" },
                    Erro: { cls: "inativo", label: "Erro" },
                },
            },
            { chave: "retorno", titulo: "Retorno", tipo: "texto", larguraMin: "220px", ordenavel: false },
        ],

        // Tela de leitura: sem botoes de escrita.
        botoes: [],
    };
}
