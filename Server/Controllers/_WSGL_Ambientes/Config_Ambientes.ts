import * as mysql from 'mysql2';
import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { _Mod_WSGL_Ambientes } from '../../Models/DB/_Mod_WSGL_Ambientes';

export interface DadosAmbiente {
  cliente_id: number; contrato_id?: number | null; nome: string;
  tipo?: 'producao' | 'homologacao' | 'desenvolvimento' | 'teste';
  validade?: Date | string | null; observacoes?: string | null;
}

export interface ParametrosListagem { pagina: number; limite: number; pesquisa: string; ordem: string; direcao: string; }

const COLUNAS_ORDENAVEIS = ['nome', 'tipo', 'validade', 'criado_em'];
const TIPOS_AMBIENTE = ['producao', 'homologacao', 'desenvolvimento', 'teste'];

export class Config_Ambientes {
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
      `SELECT COUNT(*) AS total FROM _Mod_WSGL_Ambientes WHERE excluido = 0 AND (nome LIKE ?)`,
      [like]);
    const totalLinhas = Object.assign([], totalResult) as Array<{ total: number }>;
    const registrosResult = await this._BD.Query(
      `SELECT c.*, cli.razao_social AS cliente_razao_social
         FROM _Mod_WSGL_Ambientes c
         LEFT JOIN _Mod_WSGL_Clientes cli ON cli.id = c.cliente_id
        WHERE c.excluido = 0 AND (c.nome LIKE ?)
        ORDER BY ${ordem} ${direcao} LIMIT ? OFFSET ?`,
      [like, limite, offset]);
    return { registros: Object.assign([], registrosResult) as unknown[], total: totalLinhas[0]?.total ?? 0 };
  }

  public async Buscar(id: number): Promise<_Mod_WSGL_Ambientes> {
    const r = await this._BD.Query('SELECT * FROM _Mod_WSGL_Ambientes WHERE id = ? AND excluido = 0 LIMIT 1', [id]);
    const rows = Object.assign([], r) as _Mod_WSGL_Ambientes[];
    if (rows.length === 0) throw { mensagem: 'Ambiente não encontrado' };
    return Object.assign(new _Mod_WSGL_Ambientes(), rows[0]);
  }

  public async Criar(d: DadosAmbiente, criado_por = 0): Promise<_Mod_WSGL_Ambientes> {
    if (!d.nome || !d.nome.trim()) throw { mensagem: 'Campo obrigatório: nome' };
    if (!d.cliente_id) throw { mensagem: 'Campo obrigatório: cliente_id' };
    const tipo = d.tipo ?? 'producao';
    if (!TIPOS_AMBIENTE.includes(tipo)) throw { mensagem: 'Tipo de ambiente inválido' };
    const agora = new Date();
    const r = await this._BD.Query(
      `INSERT INTO _Mod_WSGL_Ambientes (cliente_id, contrato_id, nome, tipo, validade, observacoes,
         criado_em, criado_por, editado_por, excluido_por, ativado_em, ativado_por, inativado_por, ativo, excluido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 0, 1, 0)`,
      [d.cliente_id, d.contrato_id ?? null, d.nome, tipo, d.validade ?? null, d.observacoes ?? null,
       agora, criado_por, agora, criado_por]) as mysql.OkPacket;
    return this.Buscar(r.insertId);
  }

  public async Editar(id: number, d: Partial<DadosAmbiente>, editado_por = 0): Promise<_Mod_WSGL_Ambientes> {
    const a = await this.Buscar(id);
    if (d.tipo !== undefined && !TIPOS_AMBIENTE.includes(d.tipo)) throw { mensagem: 'Tipo de ambiente inválido' };
    await this._BD.Query(
      `UPDATE _Mod_WSGL_Ambientes SET cliente_id = ?, contrato_id = ?, nome = ?, tipo = ?, validade = ?, observacoes = ?,
         editado_em = ?, editado_por = ? WHERE id = ? AND excluido = 0`,
      [d.cliente_id ?? a.cliente_id, d.contrato_id !== undefined ? d.contrato_id : a.contrato_id,
       d.nome ?? a.nome, d.tipo ?? a.tipo, d.validade !== undefined ? d.validade : a.validade,
       d.observacoes !== undefined ? d.observacoes : a.observacoes,
       new Date(), editado_por, id]);
    return this.Buscar(id);
  }

  public async Ativar(id: number, por = 0): Promise<void> {
    await this._BD.Query('UPDATE _Mod_WSGL_Ambientes SET ativo = 1, ativado_em = ?, ativado_por = ? WHERE id = ? AND excluido = 0', [new Date(), por, id]);
  }
  public async Inativar(id: number, por = 0): Promise<void> {
    await this._BD.Query('UPDATE _Mod_WSGL_Ambientes SET ativo = 0, inativado_em = ?, inativado_por = ? WHERE id = ? AND excluido = 0', [new Date(), por, id]);
  }
  public async Excluir(id: number, por = 0): Promise<void> {
    await this._BD.Query('UPDATE _Mod_WSGL_Ambientes SET excluido = 1, excluido_em = ?, excluido_por = ? WHERE id = ? AND excluido = 0', [new Date(), por, id]);
  }
}
