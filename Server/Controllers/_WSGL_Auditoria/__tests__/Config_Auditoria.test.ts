import { describe, it, expect } from 'vitest';
import { Config_Auditoria } from '../Config_Auditoria';
import { FakeBD } from '../../../__tests__/FakeBD';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

describe('Config_Auditoria.Listar', () => {
  it('sem filtros retorna {registros,total}', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ total: 2 }]); // COUNT
    fake.enfileirar([
      { id: 1, evento: 'wsgl/clientes.criar', usuario_login: 'admin', origem_modulo: 'WSCore_GeradorLicencas', status: 'OK', retorno: 'id=1', criado_em: new Date() },
      { id: 2, evento: 'wsgl/licencas.revogar', usuario_login: 'admin', origem_modulo: 'WSCore_GeradorLicencas', status: 'OK', retorno: 'id=5', criado_em: new Date() },
    ]); // SELECT registros
    const cfg = new Config_Auditoria({} as Modelo_Config, fake.comoConector());
    const r = await cfg.Listar({ pagina: 1, limite: 50 });
    expect(r.total).toBe(2);
    expect(r.registros).toHaveLength(2);
  });

  it('com status informado, a query inclui status = ? e o valor', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ total: 0 }]);
    fake.enfileirar([]);
    const cfg = new Config_Auditoria({} as Modelo_Config, fake.comoConector());
    await cfg.Listar({ pagina: 1, limite: 50, status: 'Erro' });
    const comStatus = fake.queries.find((q) => q.sql.includes('status = ?') && q.valores.includes('Erro'));
    expect(comStatus).toBeDefined();
  });
});
