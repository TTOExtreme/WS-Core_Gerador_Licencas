import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Pacotes_Socket } from '../../Models/Modulos/Pacotes_Socket';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { Logger } from '../Lib/Logger';
import { Socket_Client } from '../Modulos/Socket_Client';
import { Config_Modulos, DadosModulo } from './Config_Modulos';
import { _Usuarios } from '../../Models/DB/_Usuarios';
import { AuditDB } from '../Lib/AuditDB';

export class Socket_Modulos {
    private _Logger: Logger;
    private _BD: Conector_Mysql;
    private _Config: Modelo_Config;
    private _Core_Conection: Socket_Client;
    private _Cfg: Config_Modulos;

    constructor(_config: Modelo_Config, _bd: Conector_Mysql, _core: Socket_Client) {
        this._Config = _config;
        this._BD = _bd;
        this._Core_Conection = _core;
        this._Logger = new Logger();
        this._Cfg = new Config_Modulos(_config, _bd);
    }

    private comAutorizacao(
        d: Pacotes_Socket, permissao: string,
        callback: (...args: unknown[]) => void, acao: (usuario: _Usuarios) => void
    ): void {
        try {
            this._Core_Conection.emit('usuarios/logintoken', 'WSCore_Autenticador/*', d.token, {}, (resposta: { login: string; Dados_Usuario?: _Usuarios }) => {
                if (resposta.login !== 'OK' || !resposta.Dados_Usuario) { callback({ status: 'Erro', mensagem: 'Token inválido ou expirado' }); return; }
                const usuario = resposta.Dados_Usuario;
                this._Core_Conection.emit('usuarios/autorizar', 'WSCore_Autenticador/*', d.token, { idUsuario: usuario.id, permissao }, (rp: { status: string }) => {
                    if (rp.status !== 'OK') { callback({ status: 'Erro', mensagem: 'Sem permissão para ' + permissao }); return; }
                    acao(usuario);
                });
            });
        } catch { callback({ status: 'Erro', mensagem: 'Token inválido ou expirado' }); }
    }

    private parse<T>(dados: string, callback: (...args: unknown[]) => void): T | undefined {
        try { return JSON.parse(dados) as T; } catch { callback({ status: 'Erro', mensagem: 'Payload inválido' }); return undefined; }
    }

    Inicializar_Listeners() {
        const sc = this._Core_Conection.socketClient;

        sc.on('wsgl/modulos.listar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/modulos.listar', callback, () => {
                const p = this.parse<{ pagina: number; limite: number; pesquisa: string; ordem: string; direcao: string }>(d.dados, callback); if (!p) return;
                this._Cfg.Listar(p).then((dados) => callback({ status: 'OK', registros: dados.registros, total: dados.total }))
                    .catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao listar módulos' }));
            });
        });

        // Opções para os selects de emissão — quem pode emitir pode consultar o catálogo.
        sc.on('wsgl/modulos.opcoes', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/licencas.emitir', callback, () => {
                this._Cfg.Opcoes().then((registros) => callback({ status: 'OK', registros }))
                    .catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao carregar opções de módulos' }));
            });
        });

        sc.on('wsgl/modulos.buscar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/modulos.listar', callback, () => {
                const p = this.parse<{ id: number }>(d.dados, callback); if (!p) return;
                this._Cfg.Buscar(p.id).then((e) => callback({ status: 'OK', dados: e }))
                    .catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Módulo não encontrado' }));
            });
        });

        sc.on('wsgl/modulos.criar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/modulos.criar', callback, (usuario) => {
                const p = this.parse<DadosModulo>(d.dados, callback); if (!p) return;
                if (typeof p.modulo_nome !== 'string' || !p.modulo_nome.trim()) { callback({ status: 'Erro', mensagem: 'Campo obrigatório: modulo_nome' }); return; }
                if (typeof p.versao !== 'string' || !p.versao.trim()) { callback({ status: 'Erro', mensagem: 'Campo obrigatório: versao' }); return; }
                this._Cfg.Criar(p, usuario.id).then((e) => {
                    AuditDB.Gravar({ evento: 'wsgl/modulos.criar', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK', retorno: `id=${e.id}` });
                    callback({ status: 'OK', dados: e });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao criar módulo' }));
            });
        });

        sc.on('wsgl/modulos.editar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/modulos.editar', callback, (usuario) => {
                const p = this.parse<{ id: number } & Partial<DadosModulo>>(d.dados, callback); if (!p) return;
                if (typeof p.id !== 'number') { callback({ status: 'Erro', mensagem: 'Campo obrigatório: id (number)' }); return; }
                this._Cfg.Editar(p.id, p, usuario.id).then((e) => {
                    AuditDB.Gravar({ evento: 'wsgl/modulos.editar', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK', retorno: `id=${e.id}` });
                    callback({ status: 'OK', dados: e });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao editar módulo' }));
            });
        });

        sc.on('wsgl/modulos.excluir', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/modulos.excluir', callback, (usuario) => {
                const p = this.parse<{ ids: number[] }>(d.dados, callback); if (!p) return;
                if (!Array.isArray(p.ids) || p.ids.length === 0) { callback({ status: 'Erro', mensagem: 'Campo obrigatório: ids (array)' }); return; }
                Promise.all(p.ids.map((id) => this._Cfg.Excluir(id, usuario.id))).then(() => {
                    AuditDB.Gravar({ evento: 'wsgl/modulos.excluir', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK' });
                    callback({ status: 'OK' });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao excluir módulo' }));
            });
        });
    }
}
