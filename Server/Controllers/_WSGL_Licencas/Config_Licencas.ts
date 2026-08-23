import * as mysql from 'mysql2';
import { randomUUID } from 'crypto';
import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { _Mod_WSGL_Licencas } from '../../Models/DB/_Mod_WSGL_Licencas';
import { assinarLicenca } from '../Lib/Licenca/Assinador';
import { kidAtual } from '../Lib/Licenca/Chaves';
import { LicencaClaims, TipoLicenca, NivelComercial, TipoAmbiente, LicencaLimites } from '../Lib/Licenca/Tipos';

export interface DadosEmissao {
  tipo: TipoLicenca;
  cliente_id: number;
  contrato_id?: number | null;
  ambiente_id: number;
  cluster_id: number;
  modulo?: string | null;
  instancia?: string | null;
  nivel?: NivelComercial | null;
  limites?: LicencaLimites | null;
  validadeDias?: number;
  tipo_emissao?: 'nova' | 'renovacao' | 'substituicao' | 'extensao';
}

export interface ParametrosListagem { pagina: number; limite: number; pesquisa: string; ordem: string; direcao: string; }

const COLUNAS_ORDENAVEIS = ['lic_id', 'tipo', 'situacao', 'expira_em', 'criado_em'];

export class Config_Licencas {
  private _BD: Conector_Mysql; private _Config: Modelo_Config;
  constructor(_config: Modelo_Config, _bd: Conector_Mysql) { this._Config = _config; this._BD = _bd; }

  /** Emite uma licença assinada a partir dos cadastros e a persiste. */
  public async Emitir(d: DadosEmissao, emitido_por = 0): Promise<_Mod_WSGL_Licencas> {
    if (!d.cluster_id) throw { mensagem: 'Campo obrigatório: cluster_id' };
    if (!d.cliente_id) throw { mensagem: 'Campo obrigatório: cliente_id' };
    if (!d.ambiente_id) throw { mensagem: 'Campo obrigatório: ambiente_id' };

    const clusterRows = Object.assign([], await this._BD.Query(
      'SELECT id, cluster_uid, situacao FROM _Mod_WSGL_Clusters WHERE id = ? AND excluido = 0 LIMIT 1', [d.cluster_id])
    ) as Array<{ id: number; cluster_uid: string; situacao: string }>;
    if (clusterRows.length === 0) throw { mensagem: 'Cluster não encontrado' };
    if (clusterRows[0].situacao !== 'aprovado') throw { mensagem: 'Cluster não está aprovado' };
    const cluster_uid = clusterRows[0].cluster_uid;

    const ambRows = Object.assign([], await this._BD.Query(
      'SELECT id, tipo FROM _Mod_WSGL_Ambientes WHERE id = ? AND excluido = 0 LIMIT 1', [d.ambiente_id])
    ) as Array<{ id: number; tipo: string }>;
    if (ambRows.length === 0) throw { mensagem: 'Ambiente não encontrado' };
    const ambienteTipo = ambRows[0].tipo as TipoAmbiente;

    const lic_id = randomUUID();
    const claims: LicencaClaims = {
      lic_id, tipo: d.tipo, cliente: String(d.cliente_id),
      contrato: d.contrato_id != null ? String(d.contrato_id) : null,
      ambiente: ambienteTipo, cluster_id: cluster_uid,
      modulo: d.modulo ?? null, instancia: d.instancia ?? null,
      nivel: d.nivel ?? null, limites: d.limites ?? null,
    };
    const dias = d.validadeDias ?? 30;
    const jws = await assinarLicenca(claims, { validadeDias: dias });
    const agora = new Date();
    const expira = new Date(agora.getTime() + Math.min(dias, 30) * 86400 * 1000);

    const r = await this._BD.Query(
      `INSERT INTO _Mod_WSGL_Licencas (lic_id, tipo, cliente_id, contrato_id, ambiente_id, cluster_id, modulo, instancia,
         nivel, limites, jws, kid, situacao, tipo_emissao, emitida_em, expira_em,
         criado_em, criado_por, editado_por, excluido_por, ativado_em, ativado_por, inativado_por, ativo, excluido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativa', ?, ?, ?, ?, ?, 0, 0, ?, ?, 0, 1, 0)`,
      [lic_id, d.tipo, d.cliente_id, d.contrato_id ?? null, d.ambiente_id, d.cluster_id, d.modulo ?? null, d.instancia ?? null,
       d.nivel ?? null, d.limites ? JSON.stringify(d.limites) : null, jws, kidAtual(), d.tipo_emissao ?? 'nova', agora, expira,
       agora, emitido_por, emitido_por, agora, emitido_por]) as mysql.OkPacket;
    return this.Buscar(r.insertId);
  }

  public async Buscar(id: number): Promise<_Mod_WSGL_Licencas> {
    const r = await this._BD.Query('SELECT * FROM _Mod_WSGL_Licencas WHERE id = ? AND excluido = 0 LIMIT 1', [id]);
    const rows = Object.assign([], r) as _Mod_WSGL_Licencas[];
    if (rows.length === 0) throw { mensagem: 'Licença não encontrada' };
    return Object.assign(new _Mod_WSGL_Licencas(), rows[0]);
  }

  public async Listar(params: ParametrosListagem): Promise<{ registros: unknown[]; total: number }> {
    const limite = params.limite > 0 ? params.limite : 50;
    const pagina = params.pagina > 0 ? params.pagina : 1;
    const offset = (pagina - 1) * limite;
    const ordem = COLUNAS_ORDENAVEIS.includes(params.ordem) ? params.ordem : 'criado_em';
    const direcao = params.direcao === 'desc' ? 'DESC' : 'ASC';
    const like = `%${params.pesquisa ?? ''}%`;
    const totalResult = await this._BD.Query(
      `SELECT COUNT(*) AS total FROM _Mod_WSGL_Licencas WHERE excluido = 0 AND (lic_id LIKE ? OR tipo LIKE ? OR modulo LIKE ?)`,
      [like, like, like]);
    const totalLinhas = Object.assign([], totalResult) as Array<{ total: number }>;
    const registrosResult = await this._BD.Query(
      `SELECT l.*, cli.razao_social AS cliente_razao_social, amb.nome AS ambiente_nome, clu.nome AS cluster_nome, clu.cluster_uid AS cluster_uid
         FROM _Mod_WSGL_Licencas l
         LEFT JOIN _Mod_WSGL_Clientes cli ON cli.id = l.cliente_id
         LEFT JOIN _Mod_WSGL_Ambientes amb ON amb.id = l.ambiente_id
         LEFT JOIN _Mod_WSGL_Clusters clu ON clu.id = l.cluster_id
        WHERE l.excluido = 0 AND (l.lic_id LIKE ? OR l.tipo LIKE ? OR l.modulo LIKE ?)
        ORDER BY l.${ordem} ${direcao} LIMIT ? OFFSET ?`,
      [like, like, like, limite, offset]);
    return { registros: Object.assign([], registrosResult) as unknown[], total: totalLinhas[0]?.total ?? 0 };
  }

  /** API: retorna os JWS das licenças ativas (não expiradas/revogadas) de um cluster aprovado. */
  public async LicencasAtivasPorClusterUid(cluster_uid: string): Promise<string[]> {
    const rows = Object.assign([], await this._BD.Query(
      `SELECT l.jws FROM _Mod_WSGL_Licencas l
         JOIN _Mod_WSGL_Clusters clu ON clu.id = l.cluster_id
        WHERE clu.cluster_uid = ? AND clu.situacao = 'aprovado'
          AND l.excluido = 0 AND l.situacao = 'ativa' AND l.expira_em > NOW()`, [cluster_uid])
    ) as Array<{ jws: string }>;
    return rows.map((r) => r.jws);
  }

  /** API: renova (re-assina por mais 30 dias) as licenças ativas de um cluster aprovado. Retorna os novos JWS. */
  public async RenovarPorClusterUid(cluster_uid: string): Promise<string[]> {
    const rows = Object.assign([], await this._BD.Query(
      `SELECT l.* FROM _Mod_WSGL_Licencas l
         JOIN _Mod_WSGL_Clusters clu ON clu.id = l.cluster_id
        WHERE clu.cluster_uid = ? AND clu.situacao = 'aprovado'
          AND l.excluido = 0 AND l.situacao = 'ativa'`, [cluster_uid])
    ) as _Mod_WSGL_Licencas[];
    const novos: string[] = [];
    for (const l of rows) {
      const claims: LicencaClaims = {
        lic_id: l.lic_id, tipo: l.tipo as TipoLicenca, cliente: String(l.cliente_id),
        contrato: l.contrato_id != null ? String(l.contrato_id) : null,
        ambiente: (await this._ambienteTipo(l.ambiente_id)), cluster_id: cluster_uid,
        modulo: l.modulo, instancia: l.instancia, nivel: (l.nivel as NivelComercial | null),
        limites: l.limites ? JSON.parse(l.limites as unknown as string) as LicencaLimites : null,
      };
      const jws = await assinarLicenca(claims, { validadeDias: 30 });
      const agora = new Date();
      const expira = new Date(agora.getTime() + 30 * 86400 * 1000);
      await this._BD.Query(
        `UPDATE _Mod_WSGL_Licencas SET jws = ?, kid = ?, tipo_emissao = 'renovacao', emitida_em = ?, expira_em = ?, editado_em = ?
          WHERE id = ? AND excluido = 0`,
        [jws, kidAtual(), agora, expira, agora, l.id]);
      novos.push(jws);
    }
    return novos;
  }

  private async _ambienteTipo(ambiente_id: number): Promise<TipoAmbiente> {
    const rows = Object.assign([], await this._BD.Query(
      'SELECT tipo FROM _Mod_WSGL_Ambientes WHERE id = ? LIMIT 1', [ambiente_id])
    ) as Array<{ tipo: string }>;
    return (rows[0]?.tipo ?? 'producao') as TipoAmbiente;
  }
}
