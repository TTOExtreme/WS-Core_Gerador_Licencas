import { describe, it, expect, beforeAll } from 'vitest';
import { Config_Licencas, type DadosEmissao } from '../Config_Licencas';
import { FakeBD } from '../../../__tests__/FakeBD';
import { gerarParDeChaves } from '../../Lib/Licenca/Chaves';
import { TipoLicenca, NivelComercial, EscopoLicenca, ModeloUso } from '../../Lib/Licenca/Tipos';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

beforeAll(async () => {
  const par = await gerarParDeChaves();
  process.env.WSGL_LICENCA_CHAVE_PRIVADA = par.privadaPem;
  process.env.WSGL_LICENCA_KID = 'kid-teste';
  process.env.WSGL_LICENCA_EMISSOR = 'WSCore-Gerador-Teste';
});

function novaEntrada() {
  return { escopo: EscopoLicenca.MODULO, tipo: TipoLicenca.MODULO, cliente_id: 1, contrato_id: 2, ambiente_id: 3, cluster_id: 4,
    modulo: 'WSCore_Financeiro', nivel: NivelComercial.PROFESSIONAL };
}

describe('Config_Licencas.Emitir', () => {
  it('rejeita emissão quando o cluster não está aprovado', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 4, cluster_uid: 'uid-4', situacao: 'pendente' }]); // Buscar cluster
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Emitir(novaEntrada(), 9)).rejects.toMatchObject({ mensagem: 'Cluster não está aprovado' });
  });

  it('emite licença assinada e grava em _Mod_WSGL_Licencas', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 4, cluster_uid: 'uid-4', situacao: 'aprovado' }]); // Buscar cluster
    fake.enfileirar([{ id: 3, tipo: 'producao' }]);                          // Buscar ambiente
    fake.enfileirar({ insertId: 55 });                                        // INSERT
    fake.enfileirar([{ id: 55, lic_id: 'x', jws: 'j', situacao: 'ativa' }]); // Buscar licença
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    const lic = await cfg.Emitir(novaEntrada(), 9);
    expect(lic.id).toBe(55);
    const insert = fake.queries.find((q) => q.sql.includes('INSERT INTO _Mod_WSGL_Licencas'));
    expect(insert).toBeDefined();
    // o JWS assinado deve ter 3 segmentos (header.payload.signature)
    const jwsParam = insert!.valores.find((v) => typeof v === 'string' && (v as string).split('.').length === 3);
    expect(jwsParam).toBeDefined();
  });

  it('bloqueia emissão NOVA sobre versão descomissionada', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 4, cluster_uid: 'uid-4', situacao: 'aprovado' }]); // cluster
    fake.enfileirar([{ id: 3, tipo: 'producao' }]);                          // ambiente
    fake.enfileirar([{ situacao: 'descomissionado' }]);                      // SituacaoDaVersao
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Emitir({ ...novaEntrada(), modulo: 'WSCore_Financeiro', versao: '1.0.0' } as never, 9))
      .rejects.toMatchObject({ mensagem: expect.stringContaining('descomissionada') });
  });

  it('permite emissão NOVA sobre versão beta', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 4, cluster_uid: 'uid-4', situacao: 'aprovado' }]); // cluster
    fake.enfileirar([{ id: 3, tipo: 'producao' }]);                          // ambiente
    fake.enfileirar([{ situacao: 'beta' }]);                                 // SituacaoDaVersao
    fake.enfileirar({ insertId: 70 });                                       // INSERT
    fake.enfileirar([{ id: 70, lic_id: 'x', jws: 'j', situacao: 'ativa' }]); // Buscar
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    const lic = await cfg.Emitir({ ...novaEntrada(), modulo: 'WSCore_Financeiro', versao: '2.0.0-beta' } as never, 9);
    expect(lic.id).toBe(70);
  });

  it('compõe limites.vagas a partir do atalho vagas do formulário', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 4, cluster_uid: 'uid-4', situacao: 'aprovado' }]);
    fake.enfileirar([{ id: 3, tipo: 'producao' }]);
    fake.enfileirar({ insertId: 60 });
    fake.enfileirar([{ id: 60, lic_id: 'x', jws: 'j', situacao: 'ativa' }]);
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await cfg.Emitir({ ...novaEntrada(), tipo: TipoLicenca.USO_MULTIPLO, vagas: 5 } as never, 9);
    const insert = fake.queries.find((q) => q.sql.includes('INSERT INTO _Mod_WSGL_Licencas'));
    const limitesParam = insert!.valores.find((v) => typeof v === 'string' && (v as string).includes('"vagas"'));
    expect(limitesParam).toBeDefined();
    expect(JSON.parse(limitesParam as string)).toMatchObject({ vagas: 5 });
  });

  it('normaliza instância: vagas=1, sem nível/modelo_uso, tipo legado instancia_modulo', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 4, cluster_uid: 'uid-4', situacao: 'aprovado' }]);
    fake.enfileirar([{ id: 3, tipo: 'producao' }]);
    fake.enfileirar([{ situacao: 'disponivel' }]);                       // SituacaoDaVersao
    fake.enfileirar({ insertId: 80 });
    fake.enfileirar([{ id: 80, lic_id: 'x', jws: 'j', situacao: 'ativa' }]);
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await cfg.Emitir({ escopo: 'instancia', tipo: 'x', cliente_id: 1, ambiente_id: 3, cluster_id: 4, modulo: 'WSCore_Financeiro', versao: '1.1.0', nivel: 'enterprise', vagas: 500 } as never, 9);
    const ins = fake.queries.find((q) => q.sql.includes('INSERT INTO _Mod_WSGL_Licencas'))!;
    expect((ins.sql.match(/\?/g) || []).length).toBe(ins.valores.length);
    expect(ins.valores).toContain('instancia');
    expect(ins.valores).toContain('instancia_modulo');
    const limitesParam = ins.valores.find((v) => typeof v === 'string' && (v as string).includes('"vagas"'));
    expect(JSON.parse(limitesParam as string)).toMatchObject({ vagas: 1 });
  });

  it('base simultâneos: tipo legado uso_multiplo, escopo base, vagas do input', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 4, cluster_uid: 'uid-4', situacao: 'aprovado' }]);
    fake.enfileirar([{ id: 3, tipo: 'producao' }]);
    fake.enfileirar({ insertId: 81 });
    fake.enfileirar([{ id: 81, lic_id: 'x', jws: 'j', situacao: 'ativa' }]);
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await cfg.Emitir({ escopo: 'base', modelo_uso: 'simultaneos', tipo: 'x', cliente_id: 1, ambiente_id: 3, cluster_id: 4, nivel: 'professional', vagas: 50 } as never, 9);
    const ins = fake.queries.find((q) => q.sql.includes('INSERT INTO _Mod_WSGL_Licencas'))!;
    expect((ins.sql.match(/\?/g) || []).length).toBe(ins.valores.length);
    expect(ins.valores).toContain('base');
    expect(ins.valores).toContain('uso_multiplo');
    expect(ins.valores).toContain('simultaneos');
    const limitesParam = ins.valores.find((v) => typeof v === 'string' && (v as string).includes('"vagas"'));
    expect(JSON.parse(limitesParam as string)).toMatchObject({ vagas: 50 });
  });

  it('base uso único: mantém a quantidade do input (N assentos dedicados), tipo legado uso_unico', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 4, cluster_uid: 'uid-4', situacao: 'aprovado' }]);
    fake.enfileirar([{ id: 3, tipo: 'producao' }]);
    fake.enfileirar({ insertId: 82 });
    fake.enfileirar([{ id: 82, lic_id: 'x', jws: 'j', situacao: 'ativa' }]);
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await cfg.Emitir({ escopo: 'base', modelo_uso: 'unico', tipo: 'x', cliente_id: 1, ambiente_id: 3, cluster_id: 4, nivel: 'enterprise', vagas: 10 } as never, 9);
    const ins = fake.queries.find((q) => q.sql.includes('INSERT INTO _Mod_WSGL_Licencas'))!;
    expect(ins.valores).toContain('unico');
    expect(ins.valores).toContain('uso_unico');
    const limitesParam = ins.valores.find((v) => typeof v === 'string' && (v as string).includes('"vagas"'));
    expect(JSON.parse(limitesParam as string)).toMatchObject({ vagas: 10 }); // não força mais 1
  });

  it('INSERT tem colunas e valores em contagem igual (regressão de count mismatch — erro 1136)', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 4, cluster_uid: 'uid-4', situacao: 'aprovado' }]);
    fake.enfileirar([{ id: 3, tipo: 'producao' }]);
    fake.enfileirar({ insertId: 55 });
    fake.enfileirar([{ id: 55, lic_id: 'x', jws: 'j', situacao: 'ativa' }]);
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await cfg.Emitir(novaEntrada(), 9);
    const insert = fake.queries.find((q) => q.sql.includes('INSERT INTO _Mod_WSGL_Licencas'));
    expect(insert).toBeDefined();
    const sql = insert!.sql;
    // Invariante que evita o erro 1136/tipo do MySQL: o nº de placeholders (?) tem de
    // bater exatamente com o nº de parâmetros vinculados (senão os valores desalinham
    // das colunas — ex.: um Date acaba numa coluna BIGINT / um int numa TIMESTAMP).
    const nPlaceholders = (sql.match(/\?/g) || []).length;
    expect(nPlaceholders).toBe(insert!.valores.length);
  });

  it('ambiente=teste emite com validade longa (expira_em > 100 dias)', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 5, cluster_uid: 'clu-x', situacao: 'aprovado' }]); // Buscar cluster
    fake.enfileirar([{ id: 9, tipo: 'teste' }]);                              // Buscar ambiente
    fake.enfileirar({ insertId: 1 });                                         // INSERT licença
    fake.enfileirar([{ id: 1, lic_id: 'x', jws: 'j', situacao: 'ativa' }]);   // Buscar pós-insert
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await cfg.Emitir({ escopo: EscopoLicenca.BASE, cliente_id: 1, ambiente_id: 9, cluster_id: 5,
                       nivel: NivelComercial.ENTERPRISE, modelo_uso: ModeloUso.SIMULTANEOS,
                       vagas: 5, validadeDias: 720 } as DadosEmissao);
    const ins = fake.queries.find((q) => q.sql.includes('INSERT INTO _Mod_WSGL_Licencas'))!;
    const expiraLonge = ins.valores.some((v) => v instanceof Date && (v as Date).getTime() > Date.now() + 100 * 86400_000);
    expect(expiraLonge).toBe(true);
  });

  it('ambiente=producao ignora validadeDias>30 (mantém teto 30)', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 5, cluster_uid: 'clu-x', situacao: 'aprovado' }]);
    fake.enfileirar([{ id: 2, tipo: 'producao' }]);
    fake.enfileirar({ insertId: 1 });
    fake.enfileirar([{ id: 1, lic_id: 'x', jws: 'j', situacao: 'ativa' }]);
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await cfg.Emitir({ escopo: EscopoLicenca.BASE, cliente_id: 1, ambiente_id: 2, cluster_id: 5,
                       nivel: NivelComercial.ENTERPRISE, modelo_uso: ModeloUso.SIMULTANEOS,
                       vagas: 5, validadeDias: 3650 } as DadosEmissao);
    const ins = fake.queries.find((q) => q.sql.includes('INSERT INTO _Mod_WSGL_Licencas'))!;
    const expiraLonge = ins.valores.some((v) => v instanceof Date && (v as Date).getTime() > Date.now() + 60 * 86400_000);
    expect(expiraLonge).toBe(false); // capado em 30
  });
});

describe('Config_Licencas ciclo de vida', () => {
  it('Revogar exige motivo', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Revogar(5, '', 1)).rejects.toMatchObject({ mensagem: 'Motivo da revogação é obrigatório' });
  });

  it('Revogar marca situacao=revogada', async () => {
    const fake = new FakeBD();
    fake.enfileirar({ affectedRows: 1 }); // UPDATE
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await cfg.Revogar(5, 'inadimplencia', 1);
    const upd = fake.queries.find((q) => q.sql.includes("situacao = 'revogada'"));
    expect(upd).toBeDefined();
    expect(upd!.valores).toContain('inadimplencia');
  });

  it('RenovarLicenca re-assina e atualiza a licença', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 5, lic_id: 'l5', tipo: 'modulo', cliente_id: 1, contrato_id: null, ambiente_id: 3, cluster_id: 4, modulo: 'M', instancia: null, nivel: 'professional', limites: null, situacao: 'ativa', excluido: 0 }]); // Buscar licenca
    fake.enfileirar([{ id: 4, cluster_uid: 'uid-4', situacao: 'aprovado' }]); // cluster
    fake.enfileirar([{ id: 3, tipo: 'producao' }]); // ambiente (para _ambienteTipo)
    fake.enfileirar({ affectedRows: 1 }); // UPDATE
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    const jws = await cfg.RenovarLicenca(5, 9);
    expect(typeof jws).toBe('string');
    expect(jws.split('.').length).toBe(3);
    const upd = fake.queries.find((q) => q.sql.includes("tipo_emissao = 'renovacao'"));
    expect(upd).toBeDefined();
  });

  it('RenovarLicenca rejeita licença revogada (integridade da revogação)', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 5, cluster_id: 4, situacao: 'revogada', excluido: 0 }]); // Buscar licenca
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    await expect(cfg.RenovarLicenca(5, 9)).rejects.toMatchObject({ mensagem: 'Só é possível renovar licenças ativas' });
  });
});

describe('Config_Licencas RenovarPorClusterUid', () => {
  it('renovação pula licenças de ambiente=teste (não recapa o token longo)', async () => {
    const fake = new FakeBD();
    // Com o JOIN + filtro amb.tipo <> 'teste', um cluster só-de-teste não retorna
    // licenças ativas do SELECT (a licença de teste já vem filtrada pela query).
    fake.enfileirar([]); // SELECT de licenças ativas do cluster
    fake.enfileirar({ affectedRows: 1 }); // UPDATE ultima_comunicacao
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    const novos = await cfg.RenovarPorClusterUid('clu-x');
    const select = fake.queries.find((q) => q.sql.includes('FROM _Mod_WSGL_Licencas l'));
    expect(select?.sql).toContain('JOIN _Mod_WSGL_Ambientes amb ON amb.id = l.ambiente_id');
    expect(select?.sql).toContain("amb.tipo <> 'teste'");
    // não houve UPDATE de reassinatura
    expect(fake.queries.some((q) => q.sql.includes('SET jws'))).toBe(false);
    expect(novos.length).toBe(0);
  });
});

describe('Config_Licencas InfoClusterPorUid', () => {
  it('devolve aprovado=true e nome/ambiente para cluster aprovado', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ nome: 'Cluster A', situacao: 'aprovado', ambiente: 'producao' }]);
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    const info = await cfg.InfoClusterPorUid('uid-1');
    expect(info).toEqual({ aprovado: true, nome: 'Cluster A', ambiente: 'producao' });
  });
  it('devolve aprovado=false para cluster não-aprovado', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ nome: 'Cluster B', situacao: 'pendente', ambiente: 'homologacao' }]);
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    const info = await cfg.InfoClusterPorUid('uid-2');
    expect(info.aprovado).toBe(false);
  });
  it('devolve aprovado=false quando o cluster não existe', async () => {
    const fake = new FakeBD();
    fake.enfileirar([]);
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    const info = await cfg.InfoClusterPorUid('uid-x');
    expect(info).toEqual({ aprovado: false, nome: null, ambiente: null });
  });
});

describe('Config_Licencas telemetria', () => {
  it('LicencasAtivasPorClusterUid registra ultima_comunicacao do cluster', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ jws: 'a.b.c' }]); // SELECT licencas
    fake.enfileirar({ affectedRows: 1 }); // UPDATE ultima_comunicacao
    const cfg = new Config_Licencas({} as Modelo_Config, fake.comoConector());
    const licencas = await cfg.LicencasAtivasPorClusterUid('uid-1');
    expect(licencas).toEqual(['a.b.c']);
    const upd = fake.queries.find((q) => q.sql.includes('ultima_comunicacao'));
    expect(upd).toBeDefined();
    expect(upd!.valores).toContain('uid-1');
  });
});
