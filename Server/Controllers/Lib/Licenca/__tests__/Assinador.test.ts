import { describe, it, expect, beforeAll } from 'vitest';
import { importSPKI, jwtVerify, decodeProtectedHeader } from 'jose';
import { gerarParDeChaves, ALG_LICENCA } from '../Chaves';
import { assinarLicenca, VALIDADE_MAXIMA_DIAS } from '../Assinador';
import { TipoLicenca, TipoAmbiente, NivelComercial, EscopoLicenca, LicencaClaims } from '../Tipos';

let publicaPem: string;

function claimsExemplo(): LicencaClaims {
  return {
    lic_id: 'lic-001',
    tipo: TipoLicenca.MODULO,
    escopo: EscopoLicenca.MODULO,
    cliente: 'cli-001',
    contrato: 'ctr-001',
    ambiente: TipoAmbiente.PRODUCAO,
    cluster_id: 'clu-001',
    modulo: 'WSCore_Financeiro',
    nivel: NivelComercial.PROFESSIONAL,
  };
}

beforeAll(async () => {
  const par = await gerarParDeChaves();
  process.env.WSGL_LICENCA_CHAVE_PRIVADA = par.privadaPem;
  process.env.WSGL_LICENCA_KID = 'kid-teste';
  process.env.WSGL_LICENCA_EMISSOR = 'WSCore-Gerador-Teste';
  publicaPem = par.publicaPem;
});

describe('assinarLicenca', () => {
  it('assina e a licença é verificável pela chave pública, com claims e kid preservados', async () => {
    const jws = await assinarLicenca(claimsExemplo());
    const header = decodeProtectedHeader(jws);
    expect(header.alg).toBe(ALG_LICENCA);
    expect(header.kid).toBe('kid-teste');

    const chavePub = await importSPKI(publicaPem, ALG_LICENCA);
    const { payload } = await jwtVerify(jws, chavePub, { issuer: 'WSCore-Gerador-Teste' });
    expect(payload.lic_id).toBe('lic-001');
    expect(payload.cluster_id).toBe('clu-001');
    expect(payload.tipo).toBe(TipoLicenca.MODULO);
    expect(typeof payload.exp).toBe('number');
  });

  it('impõe teto de validade de 30 dias mesmo se pedirem mais', async () => {
    const jws = await assinarLicenca(claimsExemplo(), { validadeDias: 999 });
    const chavePub = await importSPKI(publicaPem, ALG_LICENCA);
    const { payload } = await jwtVerify(jws, chavePub);
    const janela = (payload.exp as number) - (payload.iat as number);
    expect(janela).toBeLessThanOrEqual(VALIDADE_MAXIMA_DIAS * 86400);
  });

  it('rejeita licença adulterada', async () => {
    const jws = await assinarLicenca(claimsExemplo());
    const partes = jws.split('.');
    const adulterada = `${partes[0]}.${Buffer.from('{"lic_id":"HACK"}').toString('base64url')}.${partes[2]}`;
    const chavePub = await importSPKI(publicaPem, ALG_LICENCA);
    await expect(jwtVerify(adulterada, chavePub)).rejects.toThrow();
  });

  it('rejeita validade não-positiva', async () => {
    await expect(assinarLicenca(claimsExemplo(), { validadeDias: 0 })).rejects.toMatchObject({
      mensagem: 'Validade da licença deve ser positiva',
    });
  });

  it('lança se a chave privada não estiver configurada', async () => {
    const bak = process.env.WSGL_LICENCA_CHAVE_PRIVADA;
    const bakArq = process.env.WSGL_LICENCA_CHAVE_PRIVADA_ARQUIVO;
    delete process.env.WSGL_LICENCA_CHAVE_PRIVADA;
    delete process.env.WSGL_LICENCA_CHAVE_PRIVADA_ARQUIVO;
    await expect(assinarLicenca(claimsExemplo())).rejects.toMatchObject({
      mensagem: expect.stringContaining('Chave privada de licença ausente'),
    });
    process.env.WSGL_LICENCA_CHAVE_PRIVADA = bak;
    if (bakArq !== undefined) process.env.WSGL_LICENCA_CHAVE_PRIVADA_ARQUIVO = bakArq;
  });
});
