// WSGL_Modulos.js — catalogo de modulos e versoes (flags disponivel/beta/descomissionado).
// Tela de tabela (Controle_Tela_Tabela) + modal generico (window.WSGL_ModalFormulario),
// mesmo padrao de WSGL_Licencas.js / WSGL_Cadastros.js.
if (!window._TelaWSGLModulos_Registrada) {
    window._TelaWSGLModulos_Registrada = true;
    _Eventos.on("open/wsgl/modulos", () => {
        window._WSGL_GarantirFormulario();
        new Controle_Tela_Tabela(_configModulos()).Abrir();
    });
}

// Garante o modal genérico (window.WSGL_ModalFormulario, registrado por WSGL_Cadastros.js),
// carregando-o sob demanda. Idempotente/compartilhado (mesma definição em WSGL_Licencas.js).
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

const _WSGL_SITUACOES_MODULO = [
    { valor: "disponivel", label: "Disponível" },
    { valor: "beta", label: "Beta test" },
    { valor: "descomissionado", label: "Descomissionado" },
];

function _configModulos() {
    function notificar(titulo, ok) {
        _Notificacoes.Adicionar_Notificacao(
            Date.now(), titulo,
            ok ? { Titulo: "Sucesso", Cor: "#26a69a", Background: "#1a2e2e" }
               : { Titulo: "Erro", Cor: "#ef5350", Background: "#2e1a1a" },
            "", {}
        );
    }

    function camposModulo(valores) {
        return [
            { chave: "modulo_nome", label: "Módulo (nome de runtime)", tipo: "texto", obrigatorio: true },
            { chave: "modulo_titulo", label: "Título", tipo: "texto" },
            { chave: "versao", label: "Versão", tipo: "texto", obrigatorio: true },
            { chave: "situacao", label: "Situação", tipo: "select", opcoes: _WSGL_SITUACOES_MODULO, obrigatorio: true },
            { chave: "observacao", label: "Observação", tipo: "texto" },
        ].map((c) => valores ? { ...c } : c);
    }

    return {
        titulo: "Módulos & Versões",
        icone: "widgets",
        instanciaUnica: true,
        chaveUnica: "wsgl_modulos",

        limiteRegistros: 50,
        ordemPadrao: "modulo_nome",
        direcaoPadrao: "asc",

        carregarDados(params, callback) {
            _WebSocket.Emit("wsgl/modulos.listar", "WSCore_GeradorLicencas/*", params, (resposta) => {
                if (resposta && resposta.status === "OK") callback({ registros: resposta.registros, total: resposta.total });
                else callback({ erro: true, mensagem: (resposta && resposta.mensagem) || "Falha ao carregar registros." });
            });
        },

        iconeVazio: "widgets",
        textoVazio: "Nenhum módulo catalogado",
        textoVazioSub: 'Adicione um módulo/versão clicando em "Novo".',

        colunas: [
            { chave: "modulo_nome", titulo: "Módulo", tipo: "texto", larguraMin: "200px" },
            { chave: "modulo_titulo", titulo: "Título", tipo: "texto", larguraMin: "160px" },
            { chave: "versao", titulo: "Versão", tipo: "texto", larguraMin: "100px" },
            {
                chave: "situacao", titulo: "Situação", tipo: "status", larguraMin: "150px",
                mapaStatus: {
                    disponivel: { cls: "ativo", label: "Disponível" },
                    beta: { cls: "bloqueado", label: "Beta test" },
                    descomissionado: { cls: "inativo", label: "Descomissionado" },
                },
            },
            { chave: "observacao", titulo: "Observação", tipo: "texto", larguraMin: "180px" },
        ],

        botoes: [
            {
                id: "novo", label: "Novo", icone: "add", tipo: "primario", grupo: 1, requerSelecao: 0,
                permissao: "wsgl/modulos.criar",
                async aoClicar(_sel, _dados, tela) {
                    await window._WSGL_GarantirFormulario();
                    const vals = await window.WSGL_ModalFormulario.Abrir({
                        titulo: "Novo Módulo/Versão", campos: camposModulo(), valores: { situacao: "disponivel" },
                    });
                    if (!vals) return;
                    _WebSocket.Emit("wsgl/modulos.criar", "WSCore_GeradorLicencas/*", vals, (r) => {
                        if (r && r.status === "OK") { tela.LimparSelecao(); tela.Recarregar(); notificar("Módulo cadastrado", true); }
                        else notificar((r && r.mensagem) || "Erro ao criar módulo", false);
                    });
                },
            },
            {
                id: "editar", label: "Editar", icone: "edit", tipo: "padrao", grupo: 2, requerSelecao: -1,
                permissao: "wsgl/modulos.editar",
                async aoClicar(sel, _dados, tela) {
                    await window._WSGL_GarantirFormulario();
                    const reg = sel[0];
                    const vals = await window.WSGL_ModalFormulario.Abrir({
                        titulo: "Editar Módulo/Versão", campos: camposModulo(true),
                        valores: { modulo_nome: reg.modulo_nome, modulo_titulo: reg.modulo_titulo, versao: reg.versao, situacao: reg.situacao, observacao: reg.observacao },
                    });
                    if (!vals) return;
                    _WebSocket.Emit("wsgl/modulos.editar", "WSCore_GeradorLicencas/*", { id: reg.id, ...vals }, (r) => {
                        if (r && r.status === "OK") { tela.LimparSelecao(); tela.Recarregar(); notificar("Módulo atualizado", true); }
                        else notificar((r && r.mensagem) || "Erro ao editar módulo", false);
                    });
                },
            },
            {
                id: "excluir", label: "Excluir", icone: "delete", tipo: "perigo", grupo: 3, requerSelecao: -1,
                permissao: "wsgl/modulos.excluir",
                async aoClicar(sel, _dados, tela) {
                    const ids = sel.map((s) => s.id);
                    const confirmado = await WSCore_ModalConfirmacao.Abrir({
                        tipo: "aviso", titulo: "Excluir módulo(s)",
                        subtitulo: "Os itens selecionados serão removidos do catálogo.",
                        registros: sel.map((s) => ({ label: s.modulo_nome + " v" + s.versao })),
                        textoBotao: "Excluir",
                    });
                    if (!confirmado) return;
                    _WebSocket.Emit("wsgl/modulos.excluir", "WSCore_GeradorLicencas/*", { ids }, (r) => {
                        if (r && r.status === "OK") { tela.LimparSelecao(); tela.Recarregar(); notificar("Módulo(s) excluído(s)", true); }
                        else notificar((r && r.mensagem) || "Erro ao excluir módulo", false);
                    });
                },
            },
        ],
    };
}
