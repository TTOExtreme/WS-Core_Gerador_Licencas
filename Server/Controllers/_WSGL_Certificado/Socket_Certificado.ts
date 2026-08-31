import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Pacotes_Socket } from '../../Models/Modulos/Pacotes_Socket';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { Logger } from '../Lib/Logger';
import { Socket_Client } from '../Modulos/Socket_Client';
import { Config_Certificado } from './Config_Certificado';
import { _Usuarios } from '../../Models/DB/_Usuarios';

/** Evento autenticado (usuário via Autenticador) para exportar o cert público da API. */
export class Socket_Certificado {
    private _Logger: Logger;
    private _BD: Conector_Mysql;
    private _Config: Modelo_Config;
    private _Core_Conection: Socket_Client;
    private _Cfg: Config_Certificado;

    constructor(_config: Modelo_Config, _bd: Conector_Mysql, _core: Socket_Client) {
        this._Config = _config;
        this._BD = _bd;
        this._Core_Conection = _core;
        this._Logger = new Logger();
        this._Cfg = new Config_Certificado(_config, _bd);
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

    Inicializar_Listeners() {
        const sc = this._Core_Conection.socketClient;

        sc.on('wsgl/certificado.exportar', (d: Pacotes_Socket, callback = (..._: unknown[]) => { }) => {
            this.comAutorizacao(d, 'tela/wsgl/certificado', callback, () => {
                this._Cfg.Exportar().then((dados) => callback({ status: 'OK', dados }))
                    .catch((err) => callback({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao exportar o certificado' }));
            });
        });
    }
}
