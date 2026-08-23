import { describe, it, expect, beforeAll } from 'vitest';
import { Config_Licencas } from '../Config_Licencas';
import { FakeBD } from '../../../__tests__/FakeBD';
import { gerarParDeChaves } from '../../Lib/Licenca/Chaves';
import { TipoLicenca, NivelComercial } from '../../Lib/Licenca/Tipos';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

beforeAll(async () => {
  const par = await gerarParDeChaves();
  process.env.WSGL_LICENCA_CHAVE_PRIVADA = par.privadaPem;
  process.env.WSGL_LICENCA_KID = 'kid-teste';
  process.env.WSGL_LICENCA_EMISSOR = 'WSCore-Gerador-Teste';
});

function novaEntrada() {
  return { tipo: TipoLicenca.MODULO, cliente_id: 1, contrato_id: 2, ambiente_id: 3, cluster_id: 4,
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
