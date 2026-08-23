import * as https from 'https';
import express, { Request, Response } from 'express';
import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { Logger } from '../Lib/Logger';
import { GarantirCertificado } from '../Lib/Certificado';
import { Config_Licencas } from './Config_Licencas';

/**
 * API de Licenciamento — servidor HTTPS apartado (mesmo processo do Gerador),
 * consumido pelo modulo Licenciador remoto. Nao passa pelo Core.
 * Autentica pela identidade do cluster (cluster_uid aprovado).
 */
export class Servidor_Licenciamento {
  private _Config: Modelo_Config;
  private _BD: Conector_Mysql;
  private _Logger: Logger;
  private _Lic: Config_Licencas;

  constructor(_config: Modelo_Config, _bd: Conector_Mysql) {
    this._Config = _config;
    this._BD = _bd;
    this._Logger = new Logger();
    this._Lic = new Config_Licencas(_config, _bd);
  }

  public Iniciar(): void {
    const app = express();
    app.use(express.json());

    // Validação: cluster envia { cluster_uid }; retorna as licenças ativas assinadas.
    app.post('/api/licenciamento/validar', (req: Request, res: Response) => {
      const body = (req.body ?? {}) as { cluster_uid?: string };
      if (typeof body.cluster_uid !== 'string' || !body.cluster_uid) { res.status(400).json({ status: 'Erro', mensagem: 'cluster_uid obrigatório' }); return; }
      this._Lic.LicencasAtivasPorClusterUid(body.cluster_uid)
        .then((licencas) => res.json({ status: 'OK', licencas }))
        .catch((err) => res.status(500).json({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao validar' }));
    });

    // Renovação: re-assina por mais 30 dias as licenças ativas do cluster.
    app.post('/api/licenciamento/renovar', (req: Request, res: Response) => {
      const body = (req.body ?? {}) as { cluster_uid?: string };
      if (typeof body.cluster_uid !== 'string' || !body.cluster_uid) { res.status(400).json({ status: 'Erro', mensagem: 'cluster_uid obrigatório' }); return; }
      this._Lic.RenovarPorClusterUid(body.cluster_uid)
        .then((licencas) => res.json({ status: 'OK', licencas }))
        .catch((err) => res.status(500).json({ status: 'Erro', mensagem: (err as { mensagem?: string }).mensagem ?? 'Erro ao renovar' }));
    });

    const cert = GarantirCertificado(
      this._Config.Licenciamento.Cert.Cert,
      this._Config.Licenciamento.Cert.Key,
      this._Config.Licenciamento.Cert.GerarSeAusente,
    );
    const server = https.createServer({ key: cert.key, cert: cert.cert }, app);
    server.listen(this._Config.Licenciamento.Porta, () => {
      this._Logger.System('[Licenciamento] API HTTPS escutando na porta', String(this._Config.Licenciamento.Porta));
    });
    server.on('error', (err) => this._Logger.Error('[Licenciamento] Falha ao subir a API de Licenciamento', err));
  }
}
