import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Conector_Mysql } from '../Lib/Conector_Mysql';

export interface ResumoDashboard {
  clientes_ativos: number; contratos_ativos: number; ambientes: number; clusters_pendentes: number;
  licencas_ativas: number; licencas_expiradas: number; licencas_revogadas: number; licencas_vencendo: number;
}

export class Config_Dashboard {
  private _BD: Conector_Mysql; private _Config: Modelo_Config;
  constructor(_config: Modelo_Config, _bd: Conector_Mysql) { this._Config = _config; this._BD = _bd; }

  private async _um(sql: string): Promise<Record<string, number>> {
    const rows = Object.assign([], await this._BD.Query(sql, [])) as Array<Record<string, number>>;
    return rows[0] ?? {};
  }

  public async Resumo(): Promise<ResumoDashboard> {
    const clientes = await this._um("SELECT COUNT(*) AS total FROM _Mod_WSGL_Clientes WHERE excluido = 0 AND ativo = 1");
    const contratos = await this._um("SELECT COUNT(*) AS total FROM _Mod_WSGL_Contratos WHERE excluido = 0 AND situacao = 'ativo'");
    const ambientes = await this._um("SELECT COUNT(*) AS total FROM _Mod_WSGL_Ambientes WHERE excluido = 0");
    const clusters = await this._um("SELECT COUNT(*) AS total FROM _Mod_WSGL_Clusters WHERE excluido = 0 AND situacao = 'pendente'");
    const lic = await this._um(
      `SELECT
         SUM(situacao='ativa') AS ativa,
         SUM(situacao='expirada') AS expirada,
         SUM(situacao='revogada') AS revogada
       FROM _Mod_WSGL_Licencas WHERE excluido = 0`);
    const vencendo = await this._um(
      "SELECT COUNT(*) AS total FROM _Mod_WSGL_Licencas WHERE excluido = 0 AND situacao = 'ativa' AND expira_em BETWEEN NOW() AND (NOW() + INTERVAL 7 DAY)");
    return {
      clientes_ativos: Number(clientes.total ?? 0),
      contratos_ativos: Number(contratos.total ?? 0),
      ambientes: Number(ambientes.total ?? 0),
      clusters_pendentes: Number(clusters.total ?? 0),
      licencas_ativas: Number(lic.ativa ?? 0),
      licencas_expiradas: Number(lic.expirada ?? 0),
      licencas_revogadas: Number(lic.revogada ?? 0),
      licencas_vencendo: Number(vencendo.total ?? 0),
    };
  }
}
