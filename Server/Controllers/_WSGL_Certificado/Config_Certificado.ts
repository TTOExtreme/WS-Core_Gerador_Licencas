import * as fs from 'fs';
import { X509Certificate } from 'crypto';
import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Conector_Mysql } from '../Lib/Conector_Mysql';

export interface CertificadoExportado { pem: string; fingerprint_sha256: string; validade: string; }

/** Exporta o certificado público da API de Licenciamento para provisão (cert-pinning) nos Licenciadores. */
export class Config_Certificado {
  private _BD: Conector_Mysql;
  private _Config: Modelo_Config;

  constructor(_config: Modelo_Config, _bd: Conector_Mysql) {
    this._Config = _config;
    this._BD = _bd;
  }

  public async Exportar(): Promise<CertificadoExportado> {
    const certPath = this._Config.Licenciamento.Cert.Cert;
    if (!certPath || !fs.existsSync(certPath)) {
      throw { mensagem: 'Certificado da API não encontrado' };
    }
    const pem = fs.readFileSync(certPath).toString();
    let x509: X509Certificate;
    try { x509 = new X509Certificate(pem); }
    catch { throw { mensagem: 'Certificado da API inválido' }; }
    return { pem, fingerprint_sha256: x509.fingerprint256, validade: x509.validTo };
  }
}
