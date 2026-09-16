import { describe, it, expect } from 'vitest';
import { Config_Monitoramento } from '../Config_Monitoramento';
import { FakeBD } from '../../../__tests__/FakeBD';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

describe('Config_Monitoramento.Listar', () => {
  it('retorna {registros,total} e a query de registros contem licencas_ativas e conexao', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ total: 1 }]); // COUNT
    fake.enfileirar([{ id: 4, cluster_nome: 'clu-1', cluster_uid: 'uid-4', situacao: 'aprovado', ultima_comunicacao: new Date(),
      ambiente_nome: 'Producao', ambiente_tipo: 'producao', cliente_razao_social: 'Cliente X',
      licencas_ativas: 3, validade_mais_proxima: new Date(), conexao: 'online' }]); // SELECT registros
    const cfg = new Config_Monitoramento({} as Modelo_Config, fake.comoConector());
    const r = await cfg.Listar({ pagina: 1, limite: 50, pesquisa: '' });
    expect(r.total).toBe(1);
    expect(r.registros).toHaveLength(1);
    const registrosQuery = fake.queries.find((q) => q.sql.includes('licencas_ativas') && q.sql.includes('conexao'));
    expect(registrosQuery).toBeDefined();
  });
});
