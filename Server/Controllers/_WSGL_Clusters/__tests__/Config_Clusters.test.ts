import { describe, it, expect } from 'vitest';
import { Config_Clusters } from '../Config_Clusters';
import { FakeBD } from '../../../__tests__/FakeBD';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

describe('Config_Clusters', () => {
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
