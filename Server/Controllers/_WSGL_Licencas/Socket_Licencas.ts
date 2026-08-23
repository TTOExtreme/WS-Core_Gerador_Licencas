import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Pacotes_Socket } from '../../Models/Modulos/Pacotes_Socket';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { Logger } from '../Lib/Logger';
import { Socket_Client } from '../Modulos/Socket_Client';
import { Config_Licencas, DadosEmissao } from './Config_Licencas';
import { _Usuarios } from '../../Models/DB/_Usuarios';
import { AuditDB } from '../Lib/AuditDB';

export class Socket_Licencas {
    private _Logger: Logger;
    private _BD: Conector_Mysql;
    private _Config: Modelo_Config;
    private _Core_Conection: Socket_Client;
    private _Cfg: Config_Licencas;

    constructor(_config: Modelo_Config, _bd: Conector_Mysql, _core: Socket_Client) {
        this._Config = _config;
        this._BD = _bd;
        this._Core_Conection = _core;
        this._Logger = new Logger();
        this._Cfg = new Config_Licencas(_config, _bd);
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

        sc.on('wsgl/licencas.listar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/licencas.listar', callback, () => {
                const p = this.parse<{ pagina: number; limite: number; pesquisa: string; ordem: string; direcao: string }>(d.dados, callback); if (!p) return;
                this._Cfg.Listar(p).then((dados) => callback({ status: 'OK', registros: dados.registros, total: dados.total }))
                    .catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao listar licenças' }));
            });
        });

        sc.on('wsgl/licencas.buscar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/licencas.listar', callback, () => {
                const p = this.parse<{ id: number }>(d.dados, callback); if (!p) return;
                this._Cfg.Buscar(p.id).then((e) => callback({ status: 'OK', dados: e }))
                    .catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Licença não encontrada' }));
            });
        });

        sc.on('wsgl/licencas.emitir', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/licencas.emitir', callback, (usuario) => {
                const p = this.parse<DadosEmissao>(d.dados, callback); if (!p) return;
                if (typeof p.tipo !== 'string' || !p.tipo.trim()) { callback({ status: 'Erro', mensagem: 'Campo obrigatório: tipo' }); return; }
                this._Cfg.Emitir(p, usuario.id).then((e) => {
                    AuditDB.Gravar({ evento: 'wsgl/licencas.emitir', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK', retorno: `lic_id=${e.lic_id}` });
                    callback({ status: 'OK', dados: e });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao emitir licença' }));
            });
        });

        sc.on('wsgl/licencas.renovar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/licencas.renovar', callback, (usuario) => {
                const p = this.parse<{ id: number }>(d.dados, callback); if (!p) return;
                if (typeof p.id !== 'number') { callback({ status: 'Erro', mensagem: 'Campo obrigatório: id' }); return; }
                this._Cfg.RenovarLicenca(p.id, usuario.id).then((jws) => {
                    AuditDB.Gravar({ evento: 'wsgl/licencas.renovar', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK', retorno: `id=${p.id}` });
                    callback({ status: 'OK', dados: { jws } });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao renovar licença' }));
            });
        });

        sc.on('wsgl/licencas.estender', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/licencas.estender', callback, (usuario) => {
                const p = this.parse<{ id: number; dias: number; motivo?: string }>(d.dados, callback); if (!p) return;
                if (typeof p.id !== 'number') { callback({ status: 'Erro', mensagem: 'Campo obrigatório: id' }); return; }
                this._Cfg.Estender(p.id, Number(p.dias), usuario.id).then((jws) => {
                    AuditDB.Gravar({ evento: 'wsgl/licencas.estender', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK', retorno: `id=${p.id}` });
                    callback({ status: 'OK', dados: { jws } });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao estender licença' }));
            });
        });

        sc.on('wsgl/licencas.revogar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'wsgl/licencas.revogar', callback, (usuario) => {
                const p = this.parse<{ id: number; motivo: string }>(d.dados, callback); if (!p) return;
                if (typeof p.id !== 'number') { callback({ status: 'Erro', mensagem: 'Campo obrigatório: id' }); return; }
                this._Cfg.Revogar(p.id, p.motivo, usuario.id).then(() => {
                    AuditDB.Gravar({ evento: 'wsgl/licencas.revogar', usuario_id: usuario.id, usuario_login: usuario.usuario, origem_modulo: d.origem, dados_entrada: d.dados, status: 'OK', retorno: `id=${p.id} revogada` });
                    callback({ status: 'OK' });
                }).catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao revogar licença' }));
            });
        });
    }
}
