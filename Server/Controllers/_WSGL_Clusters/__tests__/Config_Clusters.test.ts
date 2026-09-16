import { describe, it, expect } from 'vitest';
import { Config_Clusters } from '../Config_Clusters';
import { FakeBD } from '../../../__tests__/FakeBD';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

describe('Config_Clusters', () => {
  it('RegistrarContato auto-registra cluster pendente/não provisionado quando UID é desconhecido', async () => {
    const fake = new FakeBD();
    fake.enfileirar([]);                 // SELECT existe? -> não
    fake.enfileirar({ insertId: 9 });    // INSERT auto-registro
    const cfg = new Config_Clusters({} as Modelo_Config, fake.comoConector());
    await cfg.RegistrarContato('uid-novo', '203.0.113.7');
    const ins = fake.queries.find((q) => q.sql.includes('INSERT INTO _Mod_WSGL_Clusters'));
    expect(ins).toBeDefined();
    expect(ins!.valores).toContain('uid-novo');
    expect(ins!.valores).toContain('203.0.113.7');
    // placeholders do INSERT batem com os parâmetros
    expect((ins!.sql.match(/\?/g) || []).length).toBe(ins!.valores.length);
  });

  it('RegistrarContato só atualiza IP/última comunicação quando o UID já existe', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 5 }]);        // SELECT existe? -> sim
    fake.enfileirar({ affectedRows: 1 }); // UPDATE
    const cfg = new Config_Clusters({} as Modelo_Config, fake.comoConector());
    await cfg.RegistrarContato('uid-5', '198.51.100.2');
    expect(fake.queries.some((q) => q.sql.includes('INSERT INTO _Mod_WSGL_Clusters'))).toBe(false);
    const upd = fake.queries.find((q) => q.sql.includes('UPDATE _Mod_WSGL_Clusters SET ultima_comunicacao'));
    expect(upd).toBeDefined();
    expect(upd!.valores).toContain('198.51.100.2');
  });

  it('Provisionar vincula cliente/ambiente/nome (exige os três)', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Clusters({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Provisionar(9, { cliente_id: 0, ambiente_id: 1, nome: 'X' })).rejects.toMatchObject({ mensagem: 'Campo obrigatório: cliente_id' });
    const fake2 = new FakeBD();
    fake2.enfileirar([{ id: 9, situacao: 'pendente' }]); // Buscar (valida existência)
    fake2.enfileirar({ affectedRows: 1 });               // UPDATE
    fake2.enfileirar([{ id: 9, cliente_id: 2, ambiente_id: 3, nome: 'Cluster X', situacao: 'pendente' }]); // Buscar final
    const ok = await new Config_Clusters({} as Modelo_Config, fake2.comoConector()).Provisionar(9, { cliente_id: 2, ambiente_id: 3, nome: 'Cluster X' }, 1);
    expect(ok.cliente_id).toBe(2);
    const upd = fake2.queries.find((q) => q.sql.includes('UPDATE _Mod_WSGL_Clusters SET cliente_id'));
    expect(upd!.valores).toEqual(expect.arrayContaining([2, 3, 'Cluster X']));
  });

  it('Criar exige nome', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Clusters({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Criar({ nome: '', cliente_id: 1, ambiente_id: 1 })).rejects.toMatchObject({ mensagem: 'Campo obrigatório: nome' });
  });

  it('Criar exige cliente_id', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Clusters({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Criar({ nome: 'Cluster A', cliente_id: 0, ambiente_id: 1 })).rejects.toMatchObject({ mensagem: 'Campo obrigatório: cliente_id' });
  });

  it('Criar exige ambiente_id', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Clusters({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Criar({ nome: 'Cluster A', cliente_id: 1, ambiente_id: 0 })).rejects.toMatchObject({ mensagem: 'Campo obrigatório: ambiente_id' });
  });

  it('Criar gera cluster_uid e situacao pendente quando não fornecidos', async () => {
    const fake = new FakeBD();
    fake.enfileirar({ insertId: 3 });
    fake.enfileirar([{ id: 3, nome: 'Cluster A', situacao: 'pendente' }]);
    const cfg = new Config_Clusters({} as Modelo_Config, fake.comoConector());
    const cluster = await cfg.Criar({ nome: 'Cluster A', cliente_id: 1, ambiente_id: 1 }, 2);
    expect(cluster.id).toBe(3);
    expect(fake.queries[0].sql).toContain('INSERT INTO _Mod_WSGL_Clusters');
    expect(fake.queries[0].sql).toContain("'pendente'");
    const clusterUid = fake.queries[0].valores[3] as string;
    expect(typeof clusterUid).toBe('string');
    expect(clusterUid.length).toBeGreaterThan(0);
    expect(clusterUid).not.toContain('-');
  });

  it('Aprovar emite UPDATE ... situacao = aprovado', async () => {
    const fake = new FakeBD();
    fake.enfileirar({});
    const cfg = new Config_Clusters({} as Modelo_Config, fake.comoConector());
    await cfg.Aprovar(1, 0);
    expect(fake.queries[0].sql).toContain('UPDATE _Mod_WSGL_Clusters');
    expect(fake.queries[0].sql).toContain("situacao = 'aprovado'");
  });

  it('Substituir move licencas e inativa o cluster antigo', async () => {
    const fake = new FakeBD();
    // Config_Clusters.Substituir: valida antigo, valida novo, delega a MoverParaCluster, inativa antigo.
    fake.enfileirar([{ id: 1, situacao: 'aprovado' }]); // Buscar cluster antigo (Config_Clusters.Buscar)
    fake.enfileirar([{ id: 2, situacao: 'aprovado' }]); // Buscar cluster novo
    fake.enfileirar([{ cluster_uid: 'uid-2', situacao: 'aprovado' }]); // _clusterUidAprovado (Config_Licencas)
    fake.enfileirar([]); // MoverParaCluster: sem licencas ativas
    fake.enfileirar({ affectedRows: 1 }); // UPDATE inativa antigo
    const cfg = new Config_Clusters({} as Modelo_Config, fake.comoConector());
    await cfg.Substituir(1, 2, 'migracao de infra', 9);
    const upd = fake.queries.find((q) => q.sql.includes('_Mod_WSGL_Clusters') && q.sql.includes("situacao = 'inativo'"));
    expect(upd).toBeDefined();
  });
});
