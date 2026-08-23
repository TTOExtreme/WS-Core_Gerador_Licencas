import { describe, it, expect } from 'vitest';
import { Config_Dashboard } from '../Config_Dashboard';
import { FakeBD } from '../../../__tests__/FakeBD';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

describe('Config_Dashboard', () => {
  it('Resumo agrega contadores das tabelas', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ total: 3 }]);  // clientes_ativos
    fake.enfileirar([{ total: 2 }]);  // contratos_ativos
    fake.enfileirar([{ total: 4 }]);  // ambientes
    fake.enfileirar([{ total: 1 }]);  // clusters_pendentes
    fake.enfileirar([{ ativa: 5, expirada: 1, revogada: 2 }]); // licencas por situacao
    fake.enfileirar([{ total: 1 }]);  // licencas_vencendo
    const cfg = new Config_Dashboard({} as Modelo_Config, fake.comoConector());
    const r = await cfg.Resumo();
    expect(r.clientes_ativos).toBe(3);
    expect(r.contratos_ativos).toBe(2);
    expect(r.licencas_ativas).toBe(5);
    expect(r.licencas_revogadas).toBe(2);
    expect(r.licencas_vencendo).toBe(1);
    expect(r.clusters_pendentes).toBe(1);
  });
});
