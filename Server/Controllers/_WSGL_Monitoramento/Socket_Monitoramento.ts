import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Pacotes_Socket } from '../../Models/Modulos/Pacotes_Socket';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { Logger } from '../Lib/Logger';
import { Socket_Client } from '../Modulos/Socket_Client';
import { Config_Monitoramento } from './Config_Monitoramento';
import { _Usuarios } from '../../Models/DB/_Usuarios';

export class Socket_Monitoramento {
    private _Logger: Logger;
    private _BD: Conector_Mysql;
    private _Config: Modelo_Config;
    private _Core_Conection: Socket_Client;
    private _Cfg: Config_Monitoramento;

    constructor(_config: Modelo_Config, _bd: Conector_Mysql, _core: Socket_Client) {
        this._Config = _config;
        this._BD = _bd;
        this._Core_Conection = _core;
        this._Logger = new Logger();
        this._Cfg = new Config_Monitoramento(_config, _bd);
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

        sc.on('wsgl/monitoramento.listar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'tela/wsgl/monitoramento', callback, () => {
                const p = this.parse<{ pagina: number; limite: number; pesquisa: string }>(d.dados, callback); if (!p) return;
                this._Cfg.Listar(p).then((dados) => callback({ status: 'OK', registros: dados.registros, total: dados.total }))
                    .catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao listar monitoramento' }));
            });
        });
    }
}
