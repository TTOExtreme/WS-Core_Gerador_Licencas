import * as mysql from 'mysql2';
import { randomUUID } from 'crypto';
import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { _Mod_WSGL_Clusters } from '../../Models/DB/_Mod_WSGL_Clusters';

export interface DadosCluster {
  cliente_id: number; ambiente_id: number; nome: string; cluster_uid?: string | null;
  origem_rede?: string | null; observacoes?: string | null;
}

export interface ParametrosListagem { pagina: number; limite: number; pesquisa: string; ordem: string; direcao: string; }

const COLUNAS_ORDENAVEIS = ['nome', 'situacao', 'ultima_comunicacao', 'criado_em'];

export class Config_Clusters {
  private _BD: Conector_Mysql; private _Config: Modelo_Config;
  constructor(_config: Modelo_Config, _bd: Conector_Mysql) { this._Config = _config; this._BD = _bd; }

  public async Listar(params: ParametrosListagem): Promise<{ registros: unknown[]; total: number }> {
    const limite = params.limite > 0 ? params.limite : 50;
    const pagina = params.pagina > 0 ? params.pagina : 1;
    const offset = (pagina - 1) * limite;
    const ordem = COLUNAS_ORDENAVEIS.includes(params.ordem) ? params.ordem : 'nome';
    const direcao = params.direcao === 'desc' ? 'DESC' : 'ASC';
    const like = `%${params.pesquisa ?? ''}%`;
    const totalResult = await this._BD.Query(
      `SELECT COUNT(*) AS total FROM _Mod_WSGL_Clusters WHERE excluido = 0 AND (nome LIKE ? OR cluster_uid LIKE ?)`,
      [like, like]);
    const totalLinhas = Object.assign([], totalResult) as Array<{ total: number }>;
    const registrosResult = await this._BD.Query(
      `SELECT c.*, amb.nome AS ambiente_nome, cli.razao_social AS cliente_razao_social
         FROM _Mod_WSGL_Clusters c
         LEFT JOIN _Mod_WSGL_Ambientes amb ON amb.id = c.ambiente_id
         LEFT JOIN _Mod_WSGL_Clientes cli ON cli.id = c.cliente_id
        WHERE c.excluido = 0 AND (c.nome LIKE ? OR c.cluster_uid LIKE ?)
        ORDER BY c.${ordem} ${direcao} LIMIT ? OFFSET ?`,
      [like, like, limite, offset]);
    return { registros: Object.assign([], registrosResult) as unknown[], total: totalLinhas[0]?.total ?? 0 };
  }

  public async Buscar(id: number): Promise<_Mod_WSGL_Clusters> {
    const r = await this._BD.Query('SELECT * FROM _Mod_WSGL_Clusters WHERE id = ? AND excluido = 0 LIMIT 1', [id]);
    const rows = Object.assign([], r) as _Mod_WSGL_Clusters[];
    if (rows.length === 0) throw { mensagem: 'Cluster não encontrado' };
    return Object.assign(new _Mod_WSGL_Clusters(), rows[0]);
  }

  public async Criar(d: DadosCluster, criado_por = 0): Promise<_Mod_WSGL_Clusters> {
    if (!d.nome || !d.nome.trim()) throw { mensagem: 'Campo obrigatório: nome' };
    if (!d.cliente_id) throw { mensagem: 'Campo obrigatório: cliente_id' };
    if (!d.ambiente_id) throw { mensagem: 'Campo obrigatório: ambiente_id' };
    const cluster_uid = d.cluster_uid && d.cluster_uid.trim() ? d.cluster_uid.trim() : randomUUID().replace(/-/g, '');
    const agora = new Date();
    const r = await this._BD.Query(
      `INSERT INTO _Mod_WSGL_Clusters (cliente_id, ambiente_id, nome, cluster_uid, situacao, origem_rede, observacoes,
         criado_em, criado_por, editado_por, excluido_por, ativado_em, ativado_por, inativado_por, ativo, excluido)
       VALUES (?, ?, ?, ?, 'pendente', ?, ?, ?, ?, 0, 0, ?, ?, 0, 1, 0)`,
      [d.cliente_id, d.ambiente_id, d.nome, cluster_uid, d.origem_rede ?? null, d.observacoes ?? null,
       agora, criado_por, agora, criado_por]) as mysql.OkPacket;
    return this.Buscar(r.insertId);
  }

  public async Editar(id: number, d: Partial<DadosCluster>, editado_por = 0): Promise<_Mod_WSGL_Clusters> {
    const a = await this.Buscar(id);
    await this._BD.Query(
      `UPDATE _Mod_WSGL_Clusters SET cliente_id = ?, ambiente_id = ?, nome = ?, origem_rede = ?, observacoes = ?,
         editado_em = ?, editado_por = ? WHERE id = ? AND excluido = 0`,
      [d.cliente_id ?? a.cliente_id, d.ambiente_id ?? a.ambiente_id, d.nome ?? a.nome,
       d.origem_rede !== undefined ? d.origem_rede : a.origem_rede,
       d.observacoes !== undefined ? d.observacoes : a.observacoes,
       new Date(), editado_por, id]);
    return this.Buscar(id);
  }

  public async Excluir(id: number, por = 0): Promise<void> {
    await this._BD.Query('UPDATE _Mod_WSGL_Clusters SET excluido = 1, excluido_em = ?, excluido_por = ? WHERE id = ? AND excluido = 0', [new Date(), por, id]);
  }

  public async Aprovar(id: number, por = 0): Promise<void> {
    await this._BD.Query("UPDATE _Mod_WSGL_Clusters SET situacao = 'aprovado', editado_em = ?, editado_por = ? WHERE id = ? AND excluido = 0", [new Date(), por, id]);
  }

  public async Bloquear(id: number, por = 0): Promise<void> {
    await this._BD.Query("UPDATE _Mod_WSGL_Clusters SET situacao = 'bloqueado', editado_em = ?, editado_por = ? WHERE id = ? AND excluido = 0", [new Date(), por, id]);
  }

  public async Inativar(id: number, por = 0): Promise<void> {
    await this._BD.Query("UPDATE _Mod_WSGL_Clusters SET situacao = 'inativo', editado_em = ?, editado_por = ? WHERE id = ? AND excluido = 0", [new Date(), por, id]);
  }
}
