import { describe, it, expect } from 'vitest';
import { Config_Modulos } from '../Config_Modulos';
import { FakeBD } from '../../../__tests__/FakeBD';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

describe('Config_Modulos', () => {
  it('Criar exige modulo_nome', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Modulos({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Criar({ modulo_nome: '', versao: '1.0.0' }, 1)).rejects.toMatchObject({ mensagem: expect.stringContaining('modulo_nome') });
  });

  it('Criar rejeita situação inválida', async () => {
    const fake = new FakeBD();
    const cfg = new Config_Modulos({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Criar({ modulo_nome: 'WSCore_X', versao: '1.0.0', situacao: 'foo' as never }, 1))
      .rejects.toMatchObject({ mensagem: 'Situação inválida' });
  });

  it('Criar rejeita versão duplicada do módulo', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ id: 1 }]); // jaExiste
    const cfg = new Config_Modulos({} as Modelo_Config, fake.comoConector());
    await expect(cfg.Criar({ modulo_nome: 'WSCore_X', versao: '1.0.0' }, 1))
      .rejects.toMatchObject({ mensagem: expect.stringContaining('Já existe') });
  });

  it('SituacaoDaVersao devolve a situação, ou null quando não catalogada', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ situacao: 'beta' }]);
    const cfg = new Config_Modulos({} as Modelo_Config, fake.comoConector());
    expect(await cfg.SituacaoDaVersao('WSCore_X', '1.0.0')).toBe('beta');
    fake.enfileirar([]);
    expect(await cfg.SituacaoDaVersao('WSCore_X', '9.9.9')).toBeNull();
  });

  it('Opcoes devolve módulos/versões não excluídos', async () => {
    const fake = new FakeBD();
    fake.enfileirar([{ modulo_nome: 'WSCore_X', modulo_titulo: 'X', versao: '1.0.0', situacao: 'disponivel' }]);
    const cfg = new Config_Modulos({} as Modelo_Config, fake.comoConector());
    const ops = await cfg.Opcoes();
    expect(ops).toEqual([{ modulo_nome: 'WSCore_X', modulo_titulo: 'X', versao: '1.0.0', situacao: 'disponivel' }]);
  });
});
