import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Conector_Mysql } from '../Lib/Conector_Mysql';

export interface ParametrosAuditoria {
  pagina: number; limite: number; pesquisa?: string;
  evento?: string; usuario?: string; status?: string; data_ini?: string; data_fim?: string;
}

export class Config_Auditoria {
  private _BD: Conector_Mysql; private _Config: Modelo_Config;
  constructor(_config: Modelo_Config, _bd: Conector_Mysql) { this._Config = _config; this._BD = _bd; }

  public async Listar(params: ParametrosAuditoria): Promise<{ registros: unknown[]; total: number }> {
    const limite = params.limite > 0 ? params.limite : 50;
    const pagina = params.pagina > 0 ? params.pagina : 1;
    const offset = (pagina - 1) * limite;

    const cond: string[] = ['1=1'];
    const val: unknown[] = [];
    if (params.pesquisa) {
      const like = `%${params.pesquisa}%`;
      cond.push('(evento LIKE ? OR usuario_login LIKE ? OR retorno LIKE ?)');
      val.push(like, like, like);
    }
    if (params.evento) { cond.push('evento LIKE ?'); val.push(`%${params.evento}%`); }
    if (params.usuario) { cond.push('usuario_login LIKE ?'); val.push(`%${params.usuario}%`); }
    if (params.status) { cond.push('status = ?'); val.push(params.status); }
    if (params.data_ini) { cond.push('criado_em >= ?'); val.push(params.data_ini); }
    // Inclui o dia inteiro quando `data_fim` vem como data pura (YYYY-MM-DD):
    // criado_em < data_fim + 1 dia, evitando excluir os registros do próprio dia.
    if (params.data_fim) { cond.push('criado_em < (? + INTERVAL 1 DAY)'); val.push(params.data_fim); }

    const where = cond.join(' AND ');
    const totalResult = await this._BD.Query(
      `SELECT COUNT(*) AS total FROM _Mod_WSGL_Auditoria WHERE ${where}`, val);
    const totalLinhas = Object.assign([], totalResult) as Array<{ total: number }>;

    const registrosResult = await this._BD.Query(
      `SELECT id, evento, usuario_login, origem_modulo, status, retorno, criado_em
         FROM _Mod_WSGL_Auditoria
        WHERE ${where}
        ORDER BY criado_em DESC LIMIT ? OFFSET ?`,
      [...val, limite, offset]);

    return { registros: Object.assign([], registrosResult) as unknown[], total: totalLinhas[0]?.total ?? 0 };
  }
}
