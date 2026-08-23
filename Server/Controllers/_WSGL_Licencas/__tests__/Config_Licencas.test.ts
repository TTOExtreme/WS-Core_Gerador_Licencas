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
