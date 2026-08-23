import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Conector_Mysql } from '../Lib/Conector_Mysql';

export interface ParametrosMonitoramento { pagina: number; limite: number; pesquisa: string; }

export class Config_Monitoramento {
  private _BD: Conector_Mysql; private _Config: Modelo_Config;
  constructor(_config: Modelo_Config, _bd: Conector_Mysql) { this._Config = _config; this._BD = _bd; }

  public async Listar(params: ParametrosMonitoramento): Promise<{ registros: unknown[]; total: number }> {
    const limite = params.limite > 0 ? params.limite : 50;
    const pagina = params.pagina > 0 ? params.pagina : 1;
    const offset = (pagina - 1) * limite;
    const like = `%${params.pesquisa ?? ''}%`;
    const totalResult = await this._BD.Query(
      `SELECT COUNT(*) AS total FROM _Mod_WSGL_Clusters c
         LEFT JOIN _Mod_WSGL_Ambientes amb ON amb.id = c.ambiente_id
         LEFT JOIN _Mod_WSGL_Clientes cli ON cli.id = c.cliente_id
        WHERE c.excluido = 0 AND (c.nome LIKE ? OR amb.nome LIKE ? OR cli.razao_social LIKE ?)`,
      [like, like, like]);
    const totalLinhas = Object.assign([], totalResult) as Array<{ total: number }>;
    const registrosResult = await this._BD.Query(
      `SELECT c.id, c.nome AS cluster_nome, c.cluster_uid, c.situacao, c.ultima_comunicacao,
              amb.nome AS ambiente_nome, amb.tipo AS ambiente_tipo, cli.razao_social AS cliente_razao_social,
              (SELECT COUNT(*) FROM _Mod_WSGL_Licencas l WHERE l.cluster_id = c.id AND l.excluido = 0 AND l.situacao = 'ativa') AS licencas_ativas,
              (SELECT MIN(l.expira_em) FROM _Mod_WSGL_Licencas l WHERE l.cluster_id = c.id AND l.excluido = 0 AND l.situacao = 'ativa') AS validade_mais_proxima,
              CASE WHEN c.ultima_comunicacao IS NOT NULL AND c.ultima_comunicacao > (NOW() - INTERVAL 1 DAY) THEN 'online' ELSE 'offline' END AS conexao
         FROM _Mod_WSGL_Clusters c
         LEFT JOIN _Mod_WSGL_Ambientes amb ON amb.id = c.ambiente_id
         LEFT JOIN _Mod_WSGL_Clientes cli ON cli.id = c.cliente_id
        WHERE c.excluido = 0 AND (c.nome LIKE ? OR amb.nome LIKE ? OR cli.razao_social LIKE ?)
        ORDER BY c.ultima_comunicacao DESC LIMIT ? OFFSET ?`,
      [like, like, like, limite, offset]);
    return { registros: Object.assign([], registrosResult) as unknown[], total: totalLinhas[0]?.total ?? 0 };
  }
}
