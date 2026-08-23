import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Pacotes_Socket } from '../../Models/Modulos/Pacotes_Socket';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { Logger } from '../Lib/Logger';
import { Socket_Client } from '../Modulos/Socket_Client';
import { Config_Clusters, DadosCluster } from './Config_Clusters';
import { _Usuarios } from '../../Models/DB/_Usuarios';
import { AuditDB } from '../Lib/AuditDB';

export class Socket_Clusters {
    private _Logger: Logger;
    private _BD: Conector_Mysql;
    private _Config: Modelo_Config;
    private _Core_Conection: Socket_Client;
    private _Cfg: Config_Clusters;

    constructor(_config: Modelo_Config, _bd: Conector_Mysql, _core: Socket_Client) {
        this._Config = _config;
        this._BD = _bd;
        this._Core_Conection = _core;
        this._Logger = new Logger();
        this._Cfg = new Config_Clusters(_config, _bd);
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

        sc.on('wsgl/clusters.listar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/clusters.listar', callback, () => {
                const p = this.parse<{ pagina: number; limite: number; pesquisa: string; ordem: string; direcao: string }>(d.dados, callback); if (!p) return;
                this._Cfg.Listar(p).then((dados) => callback({ status: 'OK', registros: dados.registros, total: dados.total }))
                    .catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao listar clusters' }));
            });
        });

        sc.on('wsgl/clusters.buscar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/clusters.listar', callback, () => {
                const p = this.parse<{ id: number }>(d.dados, callback); if (!p) return;
                this._Cfg.Buscar(p.id).then((e) => callback({ status: 'OK', dados: e }))
                    .catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Cluster não encontrado' }));
            });
        });

        sc.on('wsgl/clusters.criar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/clusters.criar', callback, (usuario) => {
                const p = this.parse<DadosCluster>(d.dados, callback); if (!p) return;
                if (typeof p.nome !== 'string' || !p.nome.trim()) { callback({ status: 'Erro', mensagem: 'Campo obrigatório: nome' }); return; }
                if (typeof p.cliente_id !== 'number' || !p.cliente_id) { callback({ status: 'Erro', mensagem: 'Campo obrigatório: cliente_id' }); return; }
                if (typeof p.ambiente_id !== 'number' || !p.ambiente_id) { callback({ status: 'Erro', mensagem: 'Campo obrigatório: ambiente_id' }); return; }
                this._Cfg.Criar(p, usuario.id).then((e) => {
                    AuditDB.Gravar({ evento: 'wsgl/clusters.criar', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK', retorno: `id=${e.id}` });
                    callback({ status: 'OK', dados: e });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao criar cluster' }));
            });
        });

        sc.on('wsgl/clusters.editar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/clusters.editar', callback, (usuario) => {
                const p = this.parse<{ id: number } & Partial<DadosCluster>>(d.dados, callback); if (!p) return;
                if (typeof p.id !== 'number') { callback({ status: 'Erro', mensagem: 'Campo obrigatório: id (number)' }); return; }
                this._Cfg.Editar(p.id, p, usuario.id).then((e) => {
                    AuditDB.Gravar({ evento: 'wsgl/clusters.editar', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK', retorno: `id=${e.id}` });
                    callback({ status: 'OK', dados: e });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao editar cluster' }));
            });
        });

        sc.on('wsgl/clusters.excluir', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/clusters.excluir', callback, (usuario) => {
                const p = this.parse<{ ids: number[] }>(d.dados, callback); if (!p) return;
                if (!Array.isArray(p.ids) || p.ids.length === 0) { callback({ status: 'Erro', mensagem: 'Campo obrigatório: ids (array)' }); return; }
                Promise.all(p.ids.map((id) => this._Cfg.Excluir(id, usuario.id))).then(() => {
                    AuditDB.Gravar({ evento: 'wsgl/clusters.excluir', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK' });
                    callback({ status: 'OK' });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao excluir cluster' }));
            });
        });

        sc.on('wsgl/clusters.aprovar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/clusters.aprovar', callback, (usuario) => {
                const p = this.parse<{ id: number }>(d.dados, callback); if (!p) return;
                this._Cfg.Aprovar(p.id, usuario.id).then(() => {
                    AuditDB.Gravar({ evento: 'wsgl/clusters.aprovar', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK' });
                    callback({ status: 'OK' });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao aprovar cluster' }));
            });
        });

        sc.on('wsgl/clusters.bloquear', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/clusters.bloquear', callback, (usuario) => {
                const p = this.parse<{ id: number }>(d.dados, callback); if (!p) return;
                this._Cfg.Bloquear(p.id, usuario.id).then(() => {
                    AuditDB.Gravar({ evento: 'wsgl/clusters.bloquear', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK' });
                    callback({ status: 'OK' });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao bloquear cluster' }));
            });
        });

        sc.on('wsgl/clusters.inativar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/clusters.inativar', callback, (usuario) => {
                const p = this.parse<{ id: number }>(d.dados, callback); if (!p) return;
                this._Cfg.Inativar(p.id, usuario.id).then(() => {
                    AuditDB.Gravar({ evento: 'wsgl/clusters.inativar', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK' });
                    callback({ status: 'OK' });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao inativar cluster' }));
            });
        });
    }
}
