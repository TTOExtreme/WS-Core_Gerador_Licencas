import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { gerarParDeChaves, carregarChavePrivada } from '../Chaves';

const ENV_PEM = 'WSGL_LICENCA_CHAVE_PRIVADA';
const ENV_ARQ = 'WSGL_LICENCA_CHAVE_PRIVADA_ARQUIVO';
const arq = path.join(os.tmpdir(), `wsgl_privada_${process.pid}.pem`);

function limparEnv() {
  delete process.env[ENV_PEM];
  delete process.env[ENV_ARQ];
}

afterEach(() => {
  limparEnv();
  try { fs.unlinkSync(arq); } catch { /* ignore */ }
});

describe('carregarChavePrivada — env + arquivo', () => {
  it('usa a env WSGL_LICENCA_CHAVE_PRIVADA quando definida', async () => {
    const { privadaPem } = await gerarParDeChaves();
    limparEnv();
    process.env[ENV_PEM] = privadaPem;
    const chave = await carregarChavePrivada();
    expect(chave).toBeDefined();
  });

  it('carrega do arquivo apontado por WSGL_LICENCA_CHAVE_PRIVADA_ARQUIVO quando a env do PEM está ausente', async () => {
    const { privadaPem } = await gerarParDeChaves();
    fs.writeFileSync(arq, privadaPem);
    limparEnv();
    process.env[ENV_ARQ] = arq;
    const chave = await carregarChavePrivada();
    expect(chave).toBeDefined();
  });

  it('a env do PEM tem precedência sobre o arquivo', async () => {
    const { privadaPem } = await gerarParDeChaves();
    fs.writeFileSync(arq, 'conteúdo inválido que quebraria se fosse lido');
    limparEnv();
    process.env[ENV_PEM] = privadaPem;
    process.env[ENV_ARQ] = arq;
    const chave = await carregarChavePrivada();
    expect(chave).toBeDefined();
  });

  it('lança { mensagem } quando não há env nem arquivo', async () => {
    limparEnv();
    await expect(carregarChavePrivada()).rejects.toMatchObject({ mensagem: expect.stringContaining('Chave privada de licença ausente') });
  });
});
