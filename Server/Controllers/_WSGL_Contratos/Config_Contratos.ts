import * as mysql from 'mysql2';
import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { _Mod_WSGL_Contratos } from '../../Models/DB/_Mod_WSGL_Contratos';

export interface DadosContrato {
  cliente_id: number; codigo?: string | null; modalidade?: string | null;
  vigencia_inicio?: Date | string | null; vigencia_fim?: Date | string | null;
  situacao?: 'ativo' | 'suspenso' | 'encerrado';
  regras_renovacao?: string | null; politica_revogacao?: string | null; observacoes?: string | null;
}

export interface ParametrosListagem { pagina: number; limite: number; pesquisa: string; ordem: string; direcao: string; }

const COLUNAS_ORDENAVEIS = ['codigo', 'vigencia_inicio', 'situacao', 'criado_em'];

export class Config_Contratos {
  private _BD: Conector_Mysql; private _Config: Modelo_Config;
  constructor(_config: Modelo_Config, _bd: Conector_Mysql) { this._Config = _config; this._BD = _bd; }

  public async Listar(params: ParametrosListagem): Promise<{ registros: unknown[]; total: number }> {
    const limite = params.limite > 0 ? params.limite : 50;
    const pagina = params.pagina > 0 ? params.pagina : 1;
    const offset = (pagina - 1) * limite;
    const ordem = COLUNAS_ORDENAVEIS.includes(params.ordem) ? params.ordem : 'codigo';
    const direcao = params.direcao === 'desc' ? 'DESC' : 'ASC';
    const like = `%${params.pesquisa ?? ''}%`;
    const totalResult = await this._BD.Query(
      `SELECT COUNT(*) AS total FROM _Mod_WSGL_Contratos WHERE excluido = 0 AND (codigo LIKE ? OR modalidade LIKE ?)`,
      [like, like]);
    const totalLinhas = Object.assign([], totalResult) as Array<{ total: number }>;
    const registrosResult = await this._BD.Query(
      `SELECT c.*, cli.razao_social AS cliente_razao_social
         FROM _Mod_WSGL_Contratos c
         LEFT JOIN _Mod_WSGL_Clientes cli ON cli.id = c.cliente_id
        WHERE c.excluido = 0 AND (c.codigo LIKE ? OR c.modalidade LIKE ?)
        ORDER BY ${ordem} ${direcao} LIMIT ? OFFSET ?`,
      [like, like, limite, offset]);
    return { registros: Object.assign([], registrosResult) as unknown[], total: totalLinhas[0]?.total ?? 0 };
  }

  public async Buscar(id: number): Promise<_Mod_WSGL_Contratos> {
    const r = await this._BD.Query('SELECT * FROM _Mod_WSGL_Contratos WHERE id = ? AND excluido = 0 LIMIT 1', [id]);
    const rows = Object.assign([], r) as _Mod_WSGL_Contratos[];
    if (rows.length === 0) throw { mensagem: 'Contrato não encontrado' };
    return Object.assign(new _Mod_WSGL_Contratos(), rows[0]);
  }

  public async Criar(d: DadosContrato, criado_por = 0): Promise<_Mod_WSGL_Contratos> {
    if (!d.cliente_id) throw { mensagem: 'Campo obrigatório: cliente_id' };
    const agora = new Date();
    const r = await this._BD.Query(
      `INSERT INTO _Mod_WSGL_Contratos (cliente_id, codigo, modalidade, vigencia_inicio, vigencia_fim, situacao,
         regras_renovacao, politica_revogacao, observacoes,
         criado_em, criado_por, editado_por, excluido_por, ativado_em, ativado_por, inativado_por, ativo, excluido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 0, 1, 0)`,
      [d.cliente_id, d.codigo ?? null, d.modalidade ?? null, d.vigencia_inicio ?? null, d.vigencia_fim ?? null, d.situacao ?? 'ativo',
       d.regras_renovacao ?? null, d.politica_revogacao ?? null, d.observacoes ?? null,
       agora, criado_por, agora, criado_por]) as mysql.OkPacket;
    return this.Buscar(r.insertId);
  }

  public async Editar(id: number, d: Partial<DadosContrato>, editado_por = 0): Promise<_Mod_WSGL_Contratos> {
    const a = await this.Buscar(id);
    await this._BD.Query(
      `UPDATE _Mod_WSGL_Contratos SET cliente_id = ?, codigo = ?, modalidade = ?, vigencia_inicio = ?, vigencia_fim = ?,
         situacao = ?, regras_renovacao = ?, politica_revogacao = ?, observacoes = ?,
         editado_em = ?, editado_por = ? WHERE id = ? AND excluido = 0`,
      [d.cliente_id ?? a.cliente_id, d.codigo !== undefined ? d.codigo : a.codigo,
       d.modalidade !== undefined ? d.modalidade : a.modalidade,
       d.vigencia_inicio !== undefined ? d.vigencia_inicio : a.vigencia_inicio,
       d.vigencia_fim !== undefined ? d.vigencia_fim : a.vigencia_fim,
       d.situacao ?? a.situacao,
       d.regras_renovacao !== undefined ? d.regras_renovacao : a.regras_renovacao,
       d.politica_revogacao !== undefined ? d.politica_revogacao : a.politica_revogacao,
       d.observacoes !== undefined ? d.observacoes : a.observacoes,
       new Date(), editado_por, id]);
    return this.Buscar(id);
  }

  public async Ativar(id: number, por = 0): Promise<void> {
    await this._BD.Query('UPDATE _Mod_WSGL_Contratos SET ativo = 1, ativado_em = ?, ativado_por = ? WHERE id = ? AND excluido = 0', [new Date(), por, id]);
  }
  public async Inativar(id: number, por = 0): Promise<void> {
    await this._BD.Query('UPDATE _Mod_WSGL_Contratos SET ativo = 0, inativado_em = ?, inativado_por = ? WHERE id = ? AND excluido = 0', [new Date(), por, id]);
  }
  public async Excluir(id: number, por = 0): Promise<void> {
    await this._BD.Query('UPDATE _Mod_WSGL_Contratos SET excluido = 1, excluido_em = ?, excluido_por = ? WHERE id = ? AND excluido = 0', [new Date(), por, id]);
  }
}
