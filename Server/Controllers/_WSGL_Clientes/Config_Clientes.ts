import * as mysql from 'mysql2';
import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { _Mod_WSGL_Clientes } from '../../Models/DB/_Mod_WSGL_Clientes';

export interface DadosCliente {
  razao_social: string; nome_fantasia?: string | null; documento?: string | null;
  inscricao_estadual?: string | null; email?: string | null; telefone?: string | null;
  responsavel_tecnico?: string | null; responsavel_comercial?: string | null; observacoes?: string | null;
}

export interface ParametrosListagem { pagina: number; limite: number; pesquisa: string; ordem: string; direcao: string; }

const COLUNAS_ORDENAVEIS = ['razao_social', 'nome_fantasia', 'documento', 'criado_em'];

export class Config_Clientes {
  private _BD: Conector_Mysql; private _Config: Modelo_Config;
  constructor(_config: Modelo_Config, _bd: Conector_Mysql) { this._Config = _config; this._BD = _bd; }

  public async Listar(params: ParametrosListagem): Promise<{ registros: unknown[]; total: number }> {
    const limite = params.limite > 0 ? params.limite : 50;
    const pagina = params.pagina > 0 ? params.pagina : 1;
    const offset = (pagina - 1) * limite;
    const ordem = COLUNAS_ORDENAVEIS.includes(params.ordem) ? params.ordem : 'razao_social';
    const direcao = params.direcao === 'desc' ? 'DESC' : 'ASC';
    const like = `%${params.pesquisa ?? ''}%`;
    const totalResult = await this._BD.Query(
      `SELECT COUNT(*) AS total FROM _Mod_WSGL_Clientes WHERE excluido = 0 AND (razao_social LIKE ? OR nome_fantasia LIKE ? OR documento LIKE ?)`,
      [like, like, like]);
    const totalLinhas = Object.assign([], totalResult) as Array<{ total: number }>;
    const registrosResult = await this._BD.Query(
      `SELECT *, (CASE WHEN ativo = 1 THEN 'ativo' ELSE 'inativo' END) AS status FROM _Mod_WSGL_Clientes WHERE excluido = 0 AND (razao_social LIKE ? OR nome_fantasia LIKE ? OR documento LIKE ?)
        ORDER BY ${ordem} ${direcao} LIMIT ? OFFSET ?`,
      [like, like, like, limite, offset]);
    return { registros: Object.assign([], registrosResult) as unknown[], total: totalLinhas[0]?.total ?? 0 };
  }

  public async Buscar(id: number): Promise<_Mod_WSGL_Clientes> {
    const r = await this._BD.Query('SELECT * FROM _Mod_WSGL_Clientes WHERE id = ? AND excluido = 0 LIMIT 1', [id]);
    const rows = Object.assign([], r) as _Mod_WSGL_Clientes[];
    if (rows.length === 0) throw { mensagem: 'Cliente não encontrado' };
    return Object.assign(new _Mod_WSGL_Clientes(), rows[0]);
  }

  public async Criar(d: DadosCliente, criado_por = 0): Promise<_Mod_WSGL_Clientes> {
    if (!d.razao_social || !d.razao_social.trim()) throw { mensagem: 'Campo obrigatório: razao_social' };
    const agora = new Date();
    const r = await this._BD.Query(
      `INSERT INTO _Mod_WSGL_Clientes (razao_social, nome_fantasia, documento, inscricao_estadual, email, telefone,
         responsavel_tecnico, responsavel_comercial, observacoes,
         criado_em, criado_por, editado_por, excluido_por, ativado_em, ativado_por, inativado_por, ativo, excluido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 0, 1, 0)`,
      [d.razao_social, d.nome_fantasia ?? null, d.documento ?? null, d.inscricao_estadual ?? null, d.email ?? null, d.telefone ?? null,
       d.responsavel_tecnico ?? null, d.responsavel_comercial ?? null, d.observacoes ?? null,
       agora, criado_por, agora, criado_por]) as mysql.OkPacket;
    return this.Buscar(r.insertId);
  }

  public async Editar(id: number, d: Partial<DadosCliente>, editado_por = 0): Promise<_Mod_WSGL_Clientes> {
    const a = await this.Buscar(id);
    await this._BD.Query(
      `UPDATE _Mod_WSGL_Clientes SET razao_social = ?, nome_fantasia = ?, documento = ?, inscricao_estadual = ?,
         email = ?, telefone = ?, responsavel_tecnico = ?, responsavel_comercial = ?, observacoes = ?,
         editado_em = ?, editado_por = ? WHERE id = ? AND excluido = 0`,
      [d.razao_social ?? a.razao_social, d.nome_fantasia !== undefined ? d.nome_fantasia : a.nome_fantasia,
       d.documento !== undefined ? d.documento : a.documento, d.inscricao_estadual !== undefined ? d.inscricao_estadual : a.inscricao_estadual,
       d.email !== undefined ? d.email : a.email, d.telefone !== undefined ? d.telefone : a.telefone,
       d.responsavel_tecnico !== undefined ? d.responsavel_tecnico : a.responsavel_tecnico,
       d.responsavel_comercial !== undefined ? d.responsavel_comercial : a.responsavel_comercial,
       d.observacoes !== undefined ? d.observacoes : a.observacoes,
       new Date(), editado_por, id]);
    return this.Buscar(id);
  }

  public async Ativar(id: number, por = 0): Promise<void> {
    await this._BD.Query('UPDATE _Mod_WSGL_Clientes SET ativo = 1, ativado_em = ?, ativado_por = ? WHERE id = ? AND excluido = 0', [new Date(), por, id]);
  }
  public async Inativar(id: number, por = 0): Promise<void> {
    await this._BD.Query('UPDATE _Mod_WSGL_Clientes SET ativo = 0, inativado_em = ?, inativado_por = ? WHERE id = ? AND excluido = 0', [new Date(), por, id]);
  }
  public async Excluir(id: number, por = 0): Promise<void> {
    await this._BD.Query('UPDATE _Mod_WSGL_Clientes SET excluido = 1, excluido_em = ?, excluido_por = ? WHERE id = ? AND excluido = 0', [new Date(), por, id]);
  }
}
