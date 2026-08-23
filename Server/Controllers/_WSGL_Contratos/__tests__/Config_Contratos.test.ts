import { describe, it, expect } from 'vitest';
import { Config_Contratos } from '../Config_Contratos';
import { FakeBD } from '../../../__tests__/FakeBD';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

describe('Config_Contratos', () => {
  it('Criar exige cliente_id', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Contratos({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Criar({ cliente_id: 0 })).rejects.toMatchObject({ mensagem: 'Campo obrigatório: cliente_id' });
  });
  it('Criar insere em _Mod_WSGL_Contratos e retorna o registro', async () => {
    const fake = new FakeBD();
    fake.enfileirar({ insertId: 9 });
    fake.enfileirar([{ id: 9, cliente_id: 1, codigo: 'CTR-001' }]);
    const cfg = new Config_Contratos({} as Modelo_Config, fake.comoConector());
    const contrato = await cfg.Criar({ cliente_id: 1, codigo: 'CTR-001' }, 2);
    expect(contrato.id).toBe(9);
    expect(fake.queries[0].sql).toContain('INSERT INTO _Mod_WSGL_Contratos');
    expect(fake.queries[1].sql).toContain('SELECT * FROM _Mod_WSGL_Contratos');
  });
});
