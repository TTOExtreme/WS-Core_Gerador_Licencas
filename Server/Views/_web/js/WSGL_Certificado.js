// WSGL_Certificado.js — exporta o certificado publico da API de Licenciamento (cert-pinning).
// Tela customizada (sem tabela). Usa Controle_Tela_Conteudo (padrao WSCore_Financeiro/Dashboard.js).
if (!window._TelaWSGLCertificado_Registrada) {
    window._TelaWSGLCertificado_Registrada = true;
    _Eventos.on("open/wsgl/certificado", () => { _WSGL_AbrirTelaCertificado(); });
}

function _WSGL_NotificarCert(titulo, ok) {
    _Notificacoes.Adicionar_Notificacao(
        Date.now(), titulo,
        ok ? { Titulo: "Sucesso", Cor: "#26a69a", Background: "#1a2e2e" }
           : { Titulo: "Erro", Cor: "#ef5350", Background: "#2e1a1a" },
        "", {}
    );
}

function _WSGL_AbrirTelaCertificado() {
    const tela = new Controle_Tela_Conteudo({
        titulo: "Certificado da API",
        icone: "security",
        instanciaUnica: true,
        chaveUnica: "wsgl_certificado",
        botoes: [
            { id: "atualizar", label: "Atualizar", icone: "refresh", tipo: "padrao", grupo: 1, requerSelecao: 0, aoClicar: () => { _WSGL_CarregarCertificado(); _WSGL_CarregarChave(); } },
        ],
        renderizar(container) {
            window._WSGLCertCtx = { container };
            container.style.cssText = "padding:20px;font-family:var(--font_principal);color:var(--texto_primario);box-sizing:border-box;overflow:auto;";
            container.innerHTML =
                '<h2 style="margin:0 0 4px 0;font-size:18px;color:var(--texto_primario);">Certificado da API de Licenciamento</h2>' +
                '<div style="margin:0 0 16px 0;font-size:12px;color:var(--texto_secundario);">Exporte este certificado e importe-o na tela Cluster &amp; Recuperação de cada Licenciador para confiar na API HTTPS (cert-pinning), sem TLSInseguro.</div>' +
                '<div id="wsgl_cert_fp" style="margin-bottom:10px;font-size:13px;color:var(--texto_secundario);">Carregando…</div>' +
                '<textarea id="wsgl_cert_pem" rows="14" readonly style="width:100%;box-sizing:border-box;resize:vertical;background:var(--bg_primario);color:var(--texto_primario);border:1px solid var(--border_primario);border-radius:6px;padding:10px;font-family:var(--font_mono);font-size:12px;"></textarea>' +
                '<div id="wsgl_cert_acoes" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;"></div>' +
                '<div style="height:1px;background:var(--border_primario);margin:24px 0;"></div>' +
                '<h2 style="margin:0 0 4px 0;font-size:18px;color:var(--texto_primario);">Chave de Licenciamento</h2>' +
                '<div style="margin:0 0 12px 0;font-size:12px;color:var(--texto_secundario);">Importe o <b>kid</b> e a <b>chave pública</b> abaixo no painel “Chaves de Licenciamento” da tela Cluster de cada Licenciador. É o que valida a assinatura das licenças (sem ela, todas são recusadas).</div>' +
                '<div id="wsgl_chave_kid" style="margin-bottom:8px;font-size:13px;color:var(--texto_primario);font-family:var(--font_mono);">kid: —</div>' +
                '<div id="wsgl_chave_fp" style="margin-bottom:10px;font-size:13px;color:var(--texto_secundario);">Carregando…</div>' +
                '<textarea id="wsgl_chave_pem" rows="6" readonly style="width:100%;box-sizing:border-box;resize:vertical;background:var(--bg_primario);color:var(--texto_primario);border:1px solid var(--border_primario);border-radius:6px;padding:10px;font-family:var(--font_mono);font-size:12px;"></textarea>' +
                '<div id="wsgl_chave_acoes" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;"></div>';
            const acoes = container.querySelector("#wsgl_cert_acoes");
            acoes.appendChild(_WSGL_CriarBotaoCert("wsgl_cert_btn_copiar", "Copiar", "content_copy", _WSGL_CopiarCertificado));
            acoes.appendChild(_WSGL_CriarBotaoCert("wsgl_cert_btn_baixar", "Baixar .crt", "download", _WSGL_BaixarCertificado));
            const acoesChave = container.querySelector("#wsgl_chave_acoes");
            acoesChave.appendChild(_WSGL_CriarBotaoCert("wsgl_chave_btn_copiar_kid", "Copiar kid", "content_copy", _WSGL_CopiarChaveKid));
            acoesChave.appendChild(_WSGL_CriarBotaoCert("wsgl_chave_btn_copiar_pem", "Copiar chave", "content_copy", _WSGL_CopiarChavePem));
            _WSGL_CarregarCertificado();
            _WSGL_CarregarChave();
        },
    });
    tela.Abrir();
    _LogAtividades.Registrar("Aberto: Certificado da API", "info");
}

function _WSGL_CriarBotaoCert(id, label, icone, aoClicar) {
    const btn = document.createElement("button");
    btn.id = id; btn.type = "button";
    btn.style.cssText = "display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:8px;border:1px solid var(--border_primario);background:var(--bg_secundario);color:var(--texto_primario);font-family:var(--font_principal);font-size:13px;cursor:pointer;";
    const ic = document.createElement("span");
    ic.className = "material-symbols-outlined"; ic.textContent = icone;
    ic.style.cssText = "font-size:18px;color:var(--accent);";
    btn.appendChild(ic);
    const t = document.createElement("span"); t.textContent = label; btn.appendChild(t);
    btn.addEventListener("click", () => aoClicar());
    return btn;
}

function _WSGL_CarregarCertificado() {
    const ctx = window._WSGLCertCtx;
    if (!ctx || !ctx.container || !ctx.container.isConnected) return;
    const fp = ctx.container.querySelector("#wsgl_cert_fp");
    const ta = ctx.container.querySelector("#wsgl_cert_pem");
    fp.textContent = "Carregando…";
    _WebSocket.Emit("wsgl/certificado.exportar", "WSCore_GeradorLicencas/*", {}, (r) => {
        if (!ctx.container.isConnected) return;
        const dados = r && r.dados;
        if (r && r.status === "OK" && dados) {
            ta.value = dados.pem || "";
            fp.style.color = "var(--texto_secundario)";
            fp.textContent = "Fingerprint SHA-256: " + (dados.fingerprint_sha256 || "—") + "  |  Validade: " + (dados.validade || "—");
        } else {
            ta.value = "";
            fp.style.color = "var(--cor_erro)";
            fp.textContent = (r && r.mensagem) || "Falha ao exportar o certificado.";
        }
    });
}

function _WSGL_CopiarCertificado() {
    const ctx = window._WSGLCertCtx;
    const ta = ctx && ctx.container && ctx.container.querySelector("#wsgl_cert_pem");
    const texto = ta && ta.value;
    if (!texto) { _WSGL_NotificarCert("Nada para copiar", false); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(() => _WSGL_NotificarCert("Certificado copiado", true))
            .catch(() => _WSGL_NotificarCert("Não foi possível copiar", false));
    } else {
        ta.select(); document.execCommand("copy"); _WSGL_NotificarCert("Certificado copiado", true);
    }
}

function _WSGL_BaixarCertificado() {
    const ctx = window._WSGLCertCtx;
    const ta = ctx && ctx.container && ctx.container.querySelector("#wsgl_cert_pem");
    const texto = ta && ta.value;
    if (!texto) { _WSGL_NotificarCert("Nada para baixar", false); return; }
    const blob = new Blob([texto], { type: "application/x-x509-ca-cert" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "gerador_ca.crt";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    _WSGL_NotificarCert("Download iniciado", true);
}

// ── Chave pública de licenciamento (kid + SPKI PEM) ──────────────────────────
function _WSGL_CarregarChave() {
    const ctx = window._WSGLCertCtx;
    if (!ctx || !ctx.container || !ctx.container.isConnected) return;
    const kidEl = ctx.container.querySelector("#wsgl_chave_kid");
    const fp = ctx.container.querySelector("#wsgl_chave_fp");
    const ta = ctx.container.querySelector("#wsgl_chave_pem");
    fp.textContent = "Carregando…";
    _WebSocket.Emit("wsgl/chave.exportar", "WSCore_GeradorLicencas/*", {}, (r) => {
        if (!ctx.container.isConnected) return;
        const dados = r && r.dados;
        if (r && r.status === "OK" && dados) {
            kidEl.textContent = "kid: " + (dados.kid || "—");
            ta.value = dados.spki_pem || "";
            fp.style.color = "var(--texto_secundario)";
            fp.textContent = "Fingerprint SHA-256: " + (dados.fingerprint_sha256 || "—");
        } else {
            kidEl.textContent = "kid: —";
            ta.value = "";
            fp.style.color = "var(--cor_erro)";
            fp.textContent = (r && r.mensagem) || "Falha ao exportar a chave de licenciamento.";
        }
    });
}

function _WSGL_CopiarTexto(texto, okMsg) {
    if (!texto) { _WSGL_NotificarCert("Nada para copiar", false); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(() => _WSGL_NotificarCert(okMsg, true))
            .catch(() => _WSGL_NotificarCert("Não foi possível copiar", false));
    } else {
        _WSGL_NotificarCert("Não foi possível copiar", false);
    }
}

function _WSGL_CopiarChaveKid() {
    const ctx = window._WSGLCertCtx;
    const el = ctx && ctx.container && ctx.container.querySelector("#wsgl_chave_kid");
    const kid = el && el.textContent ? el.textContent.replace(/^kid:\s*/, "").trim() : "";
    _WSGL_CopiarTexto(kid && kid !== "—" ? kid : "", "kid copiado");
}

function _WSGL_CopiarChavePem() {
    const ctx = window._WSGLCertCtx;
    const ta = ctx && ctx.container && ctx.container.querySelector("#wsgl_chave_pem");
    _WSGL_CopiarTexto(ta && ta.value, "Chave copiada");
}
