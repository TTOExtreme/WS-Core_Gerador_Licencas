import { describe, it, expect } from 'vitest';
import { Config_Clientes } from '../Config_Clientes';
import { FakeBD } from '../../../__tests__/FakeBD';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

describe('Config_Clientes', () => {
  it('Criar exige razao_social', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Clientes({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Criar({ razao_social: '' })).rejects.toMatchObject({ mensagem: 'Campo obrigatório: razao_social' });
  });
  it('Criar insere em _Mod_WSGL_Clientes e retorna o registro', async () => {
    const fake = new FakeBD();
    fake.enfileirar({ insertId: 7 });
    fake.enfileirar([{ id: 7, razao_social: 'ACME SA' }]);
    const cfg = new Config_Clientes({} as Modelo_Config, fake.comoConector());
    const cli = await cfg.Criar({ razao_social: 'ACME SA' }, 2);
    expect(cli.id).toBe(7);
    expect(fake.queries[0].sql).toContain('INSERT INTO _Mod_WSGL_Clientes');
    expect(fake.queries[1].sql).toContain('SELECT * FROM _Mod_WSGL_Clientes');
  });
});
