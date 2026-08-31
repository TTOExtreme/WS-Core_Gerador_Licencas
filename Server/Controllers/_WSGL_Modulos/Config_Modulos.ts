import * as mysql from 'mysql2';
import { Modelo_Config } from '../../Models/Modelo_Configuracao';
import { Conector_Mysql } from '../Lib/Conector_Mysql';
import { _Mod_WSGL_Modulos } from '../../Models/DB/_Mod_WSGL_Modulos';

export type SituacaoModulo = 'disponivel' | 'beta' | 'descomissionado';

export interface DadosModulo {
  modulo_nome: string; modulo_titulo?: string | null; versao: string;
  situacao?: SituacaoModulo; observacao?: string | null;
}

export interface ParametrosListagem { pagina: number; limite: number; pesquisa: string; ordem: string; direcao: string; }

const COLUNAS_ORDENAVEIS = ['modulo_nome', 'versao', 'situacao', 'criado_em'];
const SITUACOES: SituacaoModulo[] = ['disponivel', 'beta', 'descomissionado'];

export class Config_Modulos {
  private _BD: Conector_Mysql; private _Config: Modelo_Config;
  constructor(_config: Modelo_Config, _bd: Conector_Mysql) { this._Config = _config; this._BD = _bd; }

  public async Listar(params: ParametrosListagem): Promise<{ registros: unknown[]; total: number }> {
    const limite = params.limite > 0 ? params.limite : 50;
    const pagina = params.pagina > 0 ? params.pagina : 1;
    const offset = (pagina - 1) * limite;
    const ordem = COLUNAS_ORDENAVEIS.includes(params.ordem) ? params.ordem : 'modulo_nome';
    const direcao = params.direcao === 'desc' ? 'DESC' : 'ASC';
    const like = `%${params.pesquisa ?? ''}%`;
    const totalResult = await this._BD.Query(
      `SELECT COUNT(*) AS total FROM _Mod_WSGL_Modulos WHERE excluido = 0 AND (modulo_nome LIKE ? OR modulo_titulo LIKE ? OR versao LIKE ?)`,
      [like, like, like]);
    const totalLinhas = Object.assign([], totalResult) as Array<{ total: number }>;
    const registrosResult = await this._BD.Query(
      `SELECT * FROM _Mod_WSGL_Modulos WHERE excluido = 0 AND (modulo_nome LIKE ? OR modulo_titulo LIKE ? OR versao LIKE ?)
        ORDER BY ${ordem} ${direcao}, versao ASC LIMIT ? OFFSET ?`,
      [like, like, like, limite, offset]);
    return { registros: Object.assign([], registrosResult) as unknown[], total: totalLinhas[0]?.total ?? 0 };
  }

  public async Buscar(id: number): Promise<_Mod_WSGL_Modulos> {
    const r = await this._BD.Query('SELECT * FROM _Mod_WSGL_Modulos WHERE id = ? AND excluido = 0 LIMIT 1', [id]);
    const rows = Object.assign([], r) as _Mod_WSGL_Modulos[];
    if (rows.length === 0) throw { mensagem: 'Módulo não encontrado' };
    return Object.assign(new _Mod_WSGL_Modulos(), rows[0]);
  }

  /** Opções para os selects de emissão: módulos e versões disponíveis (não excluídos). */
  public async Opcoes(): Promise<Array<{ modulo_nome: string; modulo_titulo: string | null; versao: string; situacao: SituacaoModulo }>> {
    const rows = Object.assign([], await this._BD.Query(
      `SELECT modulo_nome, modulo_titulo, versao, situacao FROM _Mod_WSGL_Modulos
        WHERE excluido = 0 ORDER BY modulo_nome ASC, versao ASC`, [])
    ) as Array<{ modulo_nome: string; modulo_titulo: string | null; versao: string; situacao: SituacaoModulo }>;
    return rows;
  }

  /** Situação da versão de um módulo (ou null se não catalogada). Base do enforcement de emissão. */
  public async SituacaoDaVersao(modulo_nome: string, versao: string): Promise<SituacaoModulo | null> {
    const rows = Object.assign([], await this._BD.Query(
      `SELECT situacao FROM _Mod_WSGL_Modulos WHERE modulo_nome = ? AND versao = ? AND excluido = 0 LIMIT 1`,
      [modulo_nome, versao])
    ) as Array<{ situacao: SituacaoModulo }>;
    return rows.length > 0 ? rows[0].situacao : null;
  }

  private _validar(d: Partial<DadosModulo>): void {
    if (d.situacao !== undefined && !SITUACOES.includes(d.situacao)) throw { mensagem: 'Situação inválida' };
  }

  public async Criar(d: DadosModulo, criado_por = 0): Promise<_Mod_WSGL_Modulos> {
    if (!d.modulo_nome || !d.modulo_nome.trim()) throw { mensagem: 'Campo obrigatório: modulo_nome' };
    if (!d.versao || !d.versao.trim()) throw { mensagem: 'Campo obrigatório: versao' };
    this._validar(d);
    const jaExiste = Object.assign([], await this._BD.Query(
      'SELECT id FROM _Mod_WSGL_Modulos WHERE modulo_nome = ? AND versao = ? AND excluido = 0 LIMIT 1', [d.modulo_nome, d.versao])
    ) as Array<{ id: number }>;
    if (jaExiste.length > 0) throw { mensagem: 'Já existe essa versão para o módulo' };
    const agora = new Date();
    const r = await this._BD.Query(
      `INSERT INTO _Mod_WSGL_Modulos (modulo_nome, modulo_titulo, versao, situacao, observacao,
         criado_em, criado_por, editado_por, excluido_por, ativo, excluido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 0)`,
      [d.modulo_nome.trim(), d.modulo_titulo ?? null, d.versao.trim(), d.situacao ?? 'disponivel', d.observacao ?? null,
       agora, criado_por, criado_por]) as mysql.OkPacket;
    return this.Buscar(r.insertId);
  }

  public async Editar(id: number, d: Partial<DadosModulo>, editado_por = 0): Promise<_Mod_WSGL_Modulos> {
    const a = await this.Buscar(id);
    this._validar(d);
    await this._BD.Query(
      `UPDATE _Mod_WSGL_Modulos SET modulo_nome = ?, modulo_titulo = ?, versao = ?, situacao = ?, observacao = ?,
         editado_em = ?, editado_por = ? WHERE id = ? AND excluido = 0`,
      [d.modulo_nome ?? a.modulo_nome, d.modulo_titulo !== undefined ? d.modulo_titulo : a.modulo_titulo,
       d.versao ?? a.versao, d.situacao ?? a.situacao, d.observacao !== undefined ? d.observacao : a.observacao,
       new Date(), editado_por, id]);
    return this.Buscar(id);
  }

  public async Excluir(id: number, por = 0): Promise<void> {
    await this._BD.Query('UPDATE _Mod_WSGL_Modulos SET excluido = 1, excluido_em = ?, excluido_por = ? WHERE id = ? AND excluido = 0', [new Date(), por, id]);
  }
}
