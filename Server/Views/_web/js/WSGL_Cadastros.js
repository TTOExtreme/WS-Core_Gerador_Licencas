// WSGL_Cadastros.js — telas de cadastro do modulo Gerador de Licencas (Fase G1)
// Um unico arquivo, carregado por todas as telas de cadastro (load_dependencia),
// contendo: um modal de formulario generico, um builder de config para
// Controle_Tela_Tabela e o registro dos 4 eventos de tela (Clientes/Contratos/Ambientes/Clusters).
// Adaptado do template equivalente do modulo de RH: removida a geracao de matricula,
// o fluxo de "Senha do Ponto" e toda a dependencia do digest client-side de senha
// (nenhuma tela do Gerador usa senha de portal).
// Guard contra dupla execucao.
if (!window._WSGL_Cadastros_Registrada) {
    window._WSGL_Cadastros_Registrada = true;

    // ─────────────────────────────────────────────────────────────
    // Modal de formulario generico. Abrir({titulo, campos, valores})
    // resolve com um objeto {chave: valor} ou null (cancelado).
    // campo: { chave, label, tipo, opcoes?, obrigatorio? }
    //   tipo: 'texto' | 'numero' | 'data' | 'select' | 'textarea'
    // ─────────────────────────────────────────────────────────────
    window.WSGL_ModalFormulario = {
        // Abrir({ titulo, campos, valores, aoAbrir }) -> Promise<obj|null>.
        // Recursos de campo: tipo 'referencia' (select carregado por socket + "+"),
        // mascara ('cpf'|'cnpj'|'telefone'), validar ('cpf'|'cnpj'), mostrarSe(valores)=>bool.
        async Abrir({ titulo, campos, valores, aoAbrir }) {
            valores = Object.assign({}, valores || {});
            if (typeof aoAbrir === 'function') { try { await aoAbrir(valores); } catch (e) { /* ignora */ } }

            const opcoesRef = {};
            for (let i = 0; i < campos.length; i++) {
                if (campos[i].tipo === 'referencia') opcoesRef[campos[i].chave] = await _carregarOpcoes(campos[i]);
            }

            return new Promise((resolve) => {
                const estiloInput = 'background:var(--bg_primario);border:1px solid var(--border_primario);border-radius:6px;padding:8px;color:var(--texto_primario);font-family:var(--font_principal);font-size:13px;width:100%;box-sizing:border-box;';
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);';
                const caixa = document.createElement('div');
                caixa.style.cssText = 'background:var(--bg_secundario);border:1px solid var(--border_primario);border-radius:10px;min-width:420px;max-width:560px;max-height:88vh;overflow:auto;padding:20px;font-family:var(--font_principal);color:var(--texto_primario);';
                const h = document.createElement('h3');
                h.textContent = titulo || 'Formulário';
                h.style.cssText = 'margin:0 0 16px 0;font-size:16px;color:var(--texto_primario);';
                caixa.appendChild(h);

                const refs = {};
                function valoresAtuais() { const o = {}; for (const k in refs) o[k] = refs[k].input.value; return o; }
                function reavaliar() {
                    const atuais = valoresAtuais();
                    for (const k in refs) {
                        const { campo, grupo } = refs[k];
                        if (typeof campo.mostrarSe === 'function') grupo.style.display = campo.mostrarSe(atuais) ? '' : 'none';
                    }
                }

                campos.forEach((campo) => {
                    const grupo = document.createElement('div');
                    grupo.style.cssText = 'margin-bottom:12px;display:flex;flex-direction:column;gap:4px;';
                    const label = document.createElement('label');
                    label.textContent = campo.label + (campo.obrigatorio ? ' *' : '');
                    label.style.cssText = 'font-size:12px;color:var(--texto_secundario);';
                    grupo.appendChild(label);

                    let valor = valores[campo.chave];
                    if (valor === undefined || valor === null) valor = '';
                    let input;

                    if (campo.tipo === 'referencia') {
                        const linha = document.createElement('div');
                        linha.style.cssText = 'display:flex;gap:6px;';
                        input = document.createElement('select'); input.style.cssText = estiloInput;
                        const vazia = document.createElement('option'); vazia.value = ''; vazia.textContent = '— selecione —';
                        input.appendChild(vazia);
                        (opcoesRef[campo.chave] || []).forEach((op) => {
                            const o = document.createElement('option'); o.value = op.valor; o.textContent = op.label;
                            if (String(op.valor) === String(valor)) o.selected = true;
                            input.appendChild(o);
                        });
                        linha.appendChild(input);
                        if (campo.permiteCriar) {
                            const mais = document.createElement('button');
                            mais.type = 'button'; mais.textContent = '+'; mais.title = 'Cadastrar novo';
                            mais.style.cssText = 'background:var(--accent);border:none;border-radius:6px;color:#fff;width:38px;cursor:pointer;font-size:16px;flex:0 0 auto;';
                            mais.onclick = () => _criarReferencia(campo, input);
                            linha.appendChild(mais);
                        }
                        grupo.appendChild(linha);
                    } else if (campo.tipo === 'select') {
                        input = document.createElement('select'); input.style.cssText = estiloInput;
                        (campo.opcoes || []).forEach((op) => {
                            const valorOpcao = (op && typeof op === 'object') ? op.valor : op;
                            const labelOpcao = (op && typeof op === 'object') ? op.label : op;
                            const o = document.createElement('option'); o.value = valorOpcao; o.textContent = labelOpcao;
                            if (String(valorOpcao) === String(valor)) o.selected = true;
                            input.appendChild(o);
                        });
                        grupo.appendChild(input);
                    } else if (campo.tipo === 'textarea') {
                        input = document.createElement('textarea'); input.rows = 3; input.value = valor; input.style.cssText = estiloInput;
                        grupo.appendChild(input);
                    } else if (campo.tipo === 'boolean') {
                        input = document.createElement('select'); input.style.cssText = estiloInput;
                        const atual = (valor === true || valor === 1 || valor === '1' || valor === 'true');
                        [['true', 'Sim'], ['false', 'Não']].forEach((o) => {
                            const op = document.createElement('option'); op.value = o[0]; op.textContent = o[1];
                            if ((o[0] === 'true') === atual) op.selected = true;
                            input.appendChild(op);
                        });
                        grupo.appendChild(input);
                    } else {
                        input = document.createElement('input');
                        input.type = campo.tipo === 'numero' ? 'number' : (campo.tipo === 'data' ? 'date' : (campo.tipo === 'senha' ? 'password' : 'text'));
                        if (campo.tipo === 'data' && typeof valor === 'string' && valor.indexOf('T') > -1) valor = valor.slice(0, 10);
                        if (campo.mascara && valor) valor = _fmt(campo.mascara, valor);
                        input.value = valor; input.style.cssText = estiloInput;
                        if (campo.mascara) input.addEventListener('input', () => { input.value = _fmt(campo.mascara, input.value); });
                        grupo.appendChild(input);
                    }

                    refs[campo.chave] = { input, campo, grupo };
                    input.addEventListener('change', reavaliar);
                    input.addEventListener('input', reavaliar);
                    caixa.appendChild(grupo);
                });

                reavaliar();

                const erro = document.createElement('div');
                erro.style.cssText = 'color:var(--cor_erro);font-size:12px;min-height:16px;margin-bottom:8px;';
                caixa.appendChild(erro);
                const acoes = document.createElement('div');
                acoes.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:8px;';
                const btnCancelar = document.createElement('button');
                btnCancelar.type = 'button'; btnCancelar.textContent = 'Cancelar';
                btnCancelar.style.cssText = 'background:var(--bg_terciario);border:1px solid var(--border_primario);border-radius:6px;padding:8px 14px;color:var(--texto_primario);cursor:pointer;font-family:var(--font_principal);';
                const btnSalvar = document.createElement('button');
                btnSalvar.type = 'button'; btnSalvar.textContent = 'Salvar';
                btnSalvar.style.cssText = 'background:var(--accent);border:1px solid var(--accent);border-radius:6px;padding:8px 14px;color:#fff;cursor:pointer;font-family:var(--font_principal);';
                acoes.appendChild(btnCancelar); acoes.appendChild(btnSalvar);
                caixa.appendChild(acoes);
                overlay.appendChild(caixa);
                document.body.appendChild(overlay);

                const fechar = (resultado) => { document.body.removeChild(overlay); resolve(resultado); };
                btnCancelar.onclick = () => fechar(null);
                overlay.onclick = (e) => { if (e.target === overlay) fechar(null); };

                btnSalvar.onclick = () => {
                    const out = {};
                    for (const chave in refs) {
                        const { input, campo, grupo } = refs[chave];
                        if (grupo.style.display === 'none') continue; // campo oculto nao entra
                        let v = input.value;
                        if (campo.obrigatorio && (v === '' || v === null)) {
                            erro.textContent = 'Preencha o campo obrigatório: ' + campo.label;
                            input.focus(); return;
                        }
                        if (v !== '' && campo.validar) {
                            const msg = _valida(campo.validar, v);
                            if (msg) { erro.textContent = campo.label + ': ' + msg; input.focus(); return; }
                        }
                        if (v === '') v = null;
                        else if (campo.tipo === 'numero') v = Number(v);
                        else if (campo.tipo === 'boolean') v = (v === 'true');
                        else if (campo.tipo === 'referencia') v = (v === '' ? null : Number(v));
                        out[chave] = v;
                    }
                    fechar(out);
                };
            });
        }
    };

    // Carrega as opcoes de um campo 'referencia' via o evento .listar da entidade.
    function _carregarOpcoes(campo) {
        return new Promise((res) => {
            _WebSocket.Emit('wsgl/' + campo.entidade + '.listar', 'WSCore_GeradorLicencas/*', { pagina: 1, limite: 1000, pesquisa: '', ordem: 'nome', direcao: 'asc' }, (r) => {
                if (r && r.status === 'OK' && Array.isArray(r.registros)) res(r.registros.map((x) => ({ valor: x.id, label: x[campo.rotulo || 'nome'] || ('#' + x.id) })));
                else res([]);
            });
        });
    }
    // Botao "+": cria um registro da entidade referenciada num modal aninhado.
    async function _criarReferencia(campo, selectEl) {
        const vals = await window.WSGL_ModalFormulario.Abrir({ titulo: campo.criarTitulo || ('Novo: ' + campo.label), campos: campo.criarCampos || [{ chave: 'nome', label: 'Nome', tipo: 'texto', obrigatorio: true }], valores: {} });
        if (!vals) return;
        _WebSocket.Emit('wsgl/' + campo.entidade + '.criar', 'WSCore_GeradorLicencas/*', vals, (r) => {
            if (r && r.status === 'OK' && r.dados) {
                const o = document.createElement('option');
                o.value = r.dados.id; o.textContent = r.dados[campo.rotulo || 'nome'] || ('#' + r.dados.id);
                o.selected = true; selectEl.appendChild(o);
            } else {
                _Notificacoes.Adicionar_Notificacao(Date.now(), (r && r.mensagem) || 'Erro ao cadastrar', { Titulo: 'Erro', Cor: '#ef5350', Background: '#2e1a1a' }, '', {});
            }
        });
    }
    // Mascaras/validadores (cpf/cnpj/telefone): nenhum campo do Gerador as usa hoje,
    // mas as funcoes ficam preservadas (padrao do template) para uso futuro. Sem
    // WSGL_Validadores.js proprio ainda, ambas retornam o valor inalterado.
    function _fmt(mascara, v) {
        const V = window.WSGL_Validadores; if (!V) return v;
        if (mascara === 'cpf') return V.formatarCPF(v);
        if (mascara === 'cnpj') return V.formatarCNPJ(v);
        if (mascara === 'telefone') return V.formatarTelefone(v);
        return v;
    }
    function _valida(regra, v) {
        const V = window.WSGL_Validadores; if (!V) return null;
        if (regra === 'cpf') return V.validarCPF(v) ? null : 'CPF inválido';
        if (regra === 'cnpj') return V.validarCNPJ(v) ? null : 'CNPJ inválido';
        return null;
    }

    // ─────────────────────────────────────────────────────────────
    // Builder de config para Controle_Tela_Tabela a partir de um spec.
    // ─────────────────────────────────────────────────────────────
    function _wsglConfig(spec) {
        const entidade = spec.entidade;
        function notificar(titulo, ok) {
            _Notificacoes.Adicionar_Notificacao(
                Date.now(), titulo,
                ok ? { Titulo: 'Sucesso', Cor: '#26a69a', Background: '#1a2e2e' }
                   : { Titulo: 'Erro', Cor: '#ef5350', Background: '#2e1a1a' },
                '', {}
            );
        }
        // Traduz spec.acoes (ex: aprovar/bloquear de Clusters) em botoes de grupo 2,
        // requerSelecao:-1, que emitem `wsgl/<entidade>.<evento>` com { id } e recarregam a tela.
        const botoesDeAcoes = (spec.acoes || []).map((acao) => ({
            id: acao.id, label: acao.label, icone: acao.icone, tipo: 'padrao', grupo: 2, requerSelecao: -1,
            permissao: acao.permissao,
            async aoClicar(sel, _dados, tela) {
                const reg = sel[0];
                _WebSocket.Emit('wsgl/' + entidade + '.' + acao.evento, 'WSCore_GeradorLicencas/*', { id: reg.id }, (r) => {
                    if (r && r.status === 'OK') { tela.LimparSelecao(); tela.Recarregar(); notificar(acao.label + ' realizado(a) com sucesso', true); _LogAtividades.Registrar(acao.label + ' em ' + entidade, 'aviso'); }
                    else notificar((r && r.mensagem) || ('Erro ao ' + acao.label.toLowerCase()), false);
                });
            },
        }));
        return {
            titulo: spec.titulo,
            icone: spec.icone,
            instanciaUnica: true,
            chaveUnica: 'wsgl_' + entidade,
            limiteRegistros: 50,
            ordemPadrao: spec.ordemPadrao || 'nome',
            direcaoPadrao: spec.direcaoPadrao || 'asc',
            carregarDados(params, callback) {
                _WebSocket.Emit('wsgl/' + entidade + '.listar', 'WSCore_GeradorLicencas/*', params, (r) => {
                    if (r && r.status === 'OK') callback({ registros: r.registros, total: r.total });
                    else callback({ erro: true, mensagem: (r && r.mensagem) || 'Falha ao carregar registros.' });
                });
            },
            iconeVazio: spec.iconeVazio || 'search_off',
            textoVazio: spec.textoVazio || ('Nenhum registro em ' + spec.titulo),
            textoVazioSub: 'Clique em "Adicionar" para criar o primeiro registro.',
            colunas: spec.colunas,
            botoes: [
                {
                    id: 'adicionar', label: 'Adicionar', icone: 'add', tipo: 'primario', grupo: 1, requerSelecao: 0,
                    async aoClicar(_sel, _dados, tela) {
                        const vals = await WSGL_ModalFormulario.Abrir({ titulo: 'Novo: ' + spec.titulo, campos: spec.campos, valores: {}, aoAbrir: spec.aoAbrir });
                        if (!vals) return;
                        _WebSocket.Emit('wsgl/' + entidade + '.criar', 'WSCore_GeradorLicencas/*', vals, (r) => {
                            if (r && r.status === 'OK') { tela.Recarregar(); notificar('Registro criado', true); _LogAtividades.Registrar('Criado em ' + entidade, 'info'); }
                            else notificar((r && r.mensagem) || 'Erro ao criar', false);
                        });
                    },
                },
                {
                    id: 'editar', label: 'Editar', icone: 'edit', tipo: 'padrao', grupo: 2, requerSelecao: -1,
                    async aoClicar(sel, _dados, tela) {
                        const reg = sel[0];
                        const vals = await WSGL_ModalFormulario.Abrir({ titulo: 'Editar: ' + spec.titulo, campos: spec.campos, valores: reg });
                        if (!vals) return;
                        vals.id = reg.id;
                        _WebSocket.Emit('wsgl/' + entidade + '.editar', 'WSCore_GeradorLicencas/*', vals, (r) => {
                            if (r && r.status === 'OK') { tela.LimparSelecao(); tela.Recarregar(); notificar('Registro atualizado', true); _LogAtividades.Registrar('Editado em ' + entidade, 'info'); }
                            else notificar((r && r.mensagem) || 'Erro ao editar', false);
                        });
                    },
                },
                {
                    id: 'excluir', label: 'Excluir', icone: 'delete', tipo: 'perigo', grupo: 3, requerSelecao: 1,
                    async aoClicar(sel, _dados, tela) {
                        const confirmado = await WSCore_ModalConfirmacao.Abrir({
                            tipo: 'excluir',
                            titulo: 'Excluir ' + sel.length + ' registro(s)',
                            subtitulo: 'Esta ação é irreversível.',
                            registros: sel.map((r) => ({ label: r.nome || r.razao_social || r.codigo || ('#' + r.id) })),
                            textoConfirmacao: sel.length === 1 ? (sel[0].nome || sel[0].razao_social || sel[0].codigo || 'EXCLUIR') : 'EXCLUIR',
                            textoBotao: 'Excluir definitivamente',
                        });
                        if (!confirmado) return;
                        const ids = sel.map((r) => r.id);
                        _WebSocket.Emit('wsgl/' + entidade + '.excluir', 'WSCore_GeradorLicencas/*', { ids }, (r) => {
                            if (r && r.status === 'OK') { tela.LimparSelecao(); tela.Recarregar(); notificar(ids.length + ' registro(s) excluído(s)', true); _LogAtividades.Registrar('Excluído(s) em ' + entidade, 'erro'); }
                            else notificar((r && r.mensagem) || 'Erro ao excluir', false);
                        });
                    },
                },
            ].concat(botoesDeAcoes).concat(spec.botoesExtras || []),
        };
    }

    // ─────────────────────────────────────────────────────────────
    // Specs das 4 telas + registro dos eventos.
    // ─────────────────────────────────────────────────────────────
    const SPECS = {
        'open/wsgl/clientes': {
            entidade: 'clientes', titulo: 'Cliente', icone: 'apartment', iconeVazio: 'domain_disabled',
            colunas: [
                { chave: 'razao_social', titulo: 'Razão Social', tipo: 'texto' },
                { chave: 'nome_fantasia', titulo: 'Fantasia', tipo: 'texto' },
                { chave: 'documento', titulo: 'Documento', tipo: 'texto' },
                { chave: 'status', titulo: 'Status', tipo: 'status' },
                { chave: 'criado_em', titulo: 'Criado em', tipo: 'data' },
            ],
            campos: [
                { chave: 'razao_social', label: 'Razão Social', tipo: 'texto', obrigatorio: true },
                { chave: 'nome_fantasia', label: 'Nome Fantasia', tipo: 'texto' },
                { chave: 'documento', label: 'CNPJ/CPF', tipo: 'texto' },
                { chave: 'inscricao_estadual', label: 'Inscrição Estadual', tipo: 'texto' },
                { chave: 'email', label: 'E-mail', tipo: 'texto' },
                { chave: 'telefone', label: 'Telefone', tipo: 'texto' },
                { chave: 'responsavel_tecnico', label: 'Resp. Técnico', tipo: 'texto' },
                { chave: 'responsavel_comercial', label: 'Resp. Comercial', tipo: 'texto' },
                { chave: 'observacoes', label: 'Observações', tipo: 'texto' },
            ],
        },
        'open/wsgl/contratos': {
            entidade: 'contratos', titulo: 'Contrato', icone: 'description', iconeVazio: 'description',
            colunas: [
                { chave: 'codigo', titulo: 'Código', tipo: 'texto' },
                { chave: 'cliente_razao_social', titulo: 'Cliente', tipo: 'texto' },
                { chave: 'modalidade', titulo: 'Modalidade', tipo: 'texto' },
                {
                    chave: 'situacao', titulo: 'Situação', tipo: 'status',
                    mapaStatus: {
                        ativo: { cls: 'ativo', label: 'Ativo' },
                        suspenso: { cls: 'bloqueado', label: 'Suspenso' },
                        encerrado: { cls: 'inativo', label: 'Encerrado' },
                    },
                },
                { chave: 'vigencia_fim', titulo: 'Vigência fim', tipo: 'data' },
            ],
            campos: [
                { chave: 'cliente_id', label: 'Cliente', tipo: 'referencia', entidade: 'clientes', rotulo: 'razao_social', obrigatorio: true },
                { chave: 'codigo', label: 'Código', tipo: 'texto' },
                { chave: 'modalidade', label: 'Modalidade', tipo: 'texto' },
                { chave: 'vigencia_inicio', label: 'Vigência início', tipo: 'data' },
                { chave: 'vigencia_fim', label: 'Vigência fim', tipo: 'data' },
                { chave: 'situacao', label: 'Situação', tipo: 'select', opcoes: ['ativo', 'suspenso', 'encerrado'] },
                { chave: 'regras_renovacao', label: 'Regras de renovação', tipo: 'texto' },
                { chave: 'politica_revogacao', label: 'Política de revogação', tipo: 'texto' },
                { chave: 'observacoes', label: 'Observações', tipo: 'texto' },
            ],
        },
        'open/wsgl/ambientes': {
            entidade: 'ambientes', titulo: 'Ambiente', icone: 'dns', iconeVazio: 'dns',
            colunas: [
                { chave: 'nome', titulo: 'Nome', tipo: 'texto' },
                { chave: 'cliente_razao_social', titulo: 'Cliente', tipo: 'texto' },
                { chave: 'tipo', titulo: 'Tipo', tipo: 'texto' },
                { chave: 'validade', titulo: 'Validade', tipo: 'data' },
                { chave: 'status', titulo: 'Status', tipo: 'status' },
            ],
            campos: [
                { chave: 'cliente_id', label: 'Cliente', tipo: 'referencia', entidade: 'clientes', rotulo: 'razao_social', obrigatorio: true },
                { chave: 'nome', label: 'Nome', tipo: 'texto', obrigatorio: true },
                { chave: 'tipo', label: 'Tipo', tipo: 'select', opcoes: ['producao', 'homologacao', 'desenvolvimento', 'teste'] },
                { chave: 'validade', label: 'Validade', tipo: 'data' },
                { chave: 'observacoes', label: 'Observações', tipo: 'texto' },
            ],
        },
        'open/wsgl/clusters': {
            entidade: 'clusters', titulo: 'Cluster', icone: 'hub', iconeVazio: 'hub',
            colunas: [
                { chave: 'nome', titulo: 'Nome', tipo: 'texto' },
                { chave: 'cliente_razao_social', titulo: 'Cliente', tipo: 'texto' },
                { chave: 'ambiente_nome', titulo: 'Ambiente', tipo: 'texto' },
                { chave: 'cluster_uid', titulo: 'UID', tipo: 'texto' },
                {
                    chave: 'situacao', titulo: 'Situação', tipo: 'status',
                    mapaStatus: {
                        pendente: { cls: 'aviso', label: 'Pendente' },
                        aprovado: { cls: 'ativo', label: 'Aprovado' },
                        bloqueado: { cls: 'bloqueado', label: 'Bloqueado' },
                        inativo: { cls: 'inativo', label: 'Inativo' },
                    },
                },
            ],
            campos: [
                { chave: 'cliente_id', label: 'Cliente', tipo: 'referencia', entidade: 'clientes', rotulo: 'razao_social', obrigatorio: true },
                { chave: 'ambiente_id', label: 'Ambiente', tipo: 'referencia', entidade: 'ambientes', rotulo: 'nome', obrigatorio: true },
                { chave: 'nome', label: 'Nome', tipo: 'texto', obrigatorio: true },
                { chave: 'origem_rede', label: 'Origem de rede (IPs/faixas)', tipo: 'texto' },
                { chave: 'observacoes', label: 'Observações', tipo: 'texto' },
            ],
            acoes: [
                { id: 'aprovar', label: 'Aprovar', icone: 'verified', evento: 'aprovar', permissao: 'wsgl/clusters.aprovar' },
                { id: 'bloquear', label: 'Bloquear', icone: 'block', evento: 'bloquear', permissao: 'wsgl/clusters.bloquear' },
            ],
            // 'acoes' (acima) só cobre eventos que recebem { id }; Substituir precisa de
            // campos extras (cluster de destino + justificativa) coletados em modal, então
            // usa o mecanismo de escape 'botoesExtras' (botão completo) já suportado por _wsglConfig.
            botoesExtras: [
                {
                    id: 'substituir', label: 'Substituir', icone: 'sync_alt', tipo: 'padrao', grupo: 2, requerSelecao: -1,
                    permissao: 'wsgl/clusters.substituir',
                    title: 'Migra as licenças ativas do cluster selecionado para outro cluster aprovado',
                    async aoClicar(sel, _dados, tela) {
                        const reg = sel[0];
                        const vals = await WSGL_ModalFormulario.Abrir({
                            titulo: 'Substituir Cluster',
                            campos: [
                                { chave: 'clusterNovoId', label: 'Novo Cluster', tipo: 'referencia', entidade: 'clusters', rotulo: 'nome', obrigatorio: true },
                                { chave: 'justificativa', label: 'Justificativa', tipo: 'texto', obrigatorio: true },
                            ],
                            valores: {},
                        });
                        if (!vals) return;
                        _WebSocket.Emit('wsgl/clusters.substituir', 'WSCore_GeradorLicencas/*', {
                            clusterAntigoId: reg.id, clusterNovoId: vals.clusterNovoId, justificativa: vals.justificativa,
                        }, (r) => {
                            if (r && r.status === 'OK') {
                                tela.LimparSelecao();
                                tela.Recarregar();
                                _Notificacoes.Adicionar_Notificacao(Date.now(), 'Cluster substituído com sucesso', { Titulo: 'Sucesso', Cor: '#26a69a', Background: '#1a2e2e' }, '', {});
                                _LogAtividades.Registrar('Substituição de cluster', 'aviso');
                            } else {
                                _Notificacoes.Adicionar_Notificacao(Date.now(), (r && r.mensagem) || 'Erro ao substituir cluster', { Titulo: 'Erro', Cor: '#ef5350', Background: '#2e1a1a' }, '', {});
                            }
                        });
                    },
                },
            ],
        },
    };

    Object.keys(SPECS).forEach((evento) => {
        _Eventos.on(evento, () => new Controle_Tela_Tabela(_wsglConfig(SPECS[evento])).Abrir());
    });
}
