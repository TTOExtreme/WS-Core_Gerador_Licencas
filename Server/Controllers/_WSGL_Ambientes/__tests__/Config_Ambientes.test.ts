import { describe, it, expect } from 'vitest';
import { Config_Ambientes } from '../Config_Ambientes';
import { FakeBD } from '../../../__tests__/FakeBD';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

describe('Config_Ambientes', () => {
  it('Criar exige nome', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Ambientes({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Criar({ nome: '', cliente_id: 1 })).rejects.toMatchObject({ mensagem: 'Campo obrigatório: nome' });
  });

  it('Criar exige cliente_id', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Ambientes({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Criar({ nome: 'Prod', cliente_id: 0 })).rejects.toMatchObject({ mensagem: 'Campo obrigatório: cliente_id' });
  });

  it('Criar rejeita tipo inválido', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Ambientes({} as Modelo_Config, fake.comoConector());
    // @ts-expect-error tipo invalido propositalmente para o teste
    await expect(cfg.Criar({ nome: 'Prod', cliente_id: 1, tipo: 'invalido' })).rejects.toMatchObject({ mensagem: 'Tipo de ambiente inválido' });
  });

  it('Criar insere em _Mod_WSGL_Ambientes e retorna o registro', async () => {
    const fake = new FakeBD();
    fake.enfileirar({ insertId: 5 });
    fake.enfileirar([{ id: 5, nome: 'Producao', cliente_id: 1 }]);
    const cfg = new Config_Ambientes({} as Modelo_Config, fake.comoConector());
    const amb = await cfg.Criar({ nome: 'Producao', cliente_id: 1 }, 2);
    expect(amb.id).toBe(5);
    expect(fake.queries[0].sql).toContain('INSERT INTO _Mod_WSGL_Ambientes');
    expect(fake.queries[1].sql).toContain('SELECT * FROM _Mod_WSGL_Ambientes');
  });
});
