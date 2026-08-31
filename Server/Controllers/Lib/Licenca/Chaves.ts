import * as fs from 'fs';
import { importPKCS8, generateKeyPair, exportPKCS8, exportSPKI } from 'jose';
import type { KeyLike } from 'jose';

/** Algoritmo JWS das licenças: EdDSA sobre curva Ed25519. */
export const ALG_LICENCA = 'EdDSA';

/** ID da chave de assinatura corrente (header `kid` do JWS), para rotação. */
export function kidAtual(): string {
  return process.env.WSGL_LICENCA_KID ?? 'wsgl-dev';
}

/** Identificador do emissor (claim `iss`). */
export function emissor(): string {
  return process.env.WSGL_LICENCA_EMISSOR ?? 'WSCore-Gerador';
}

/**
 * Carrega a chave privada Ed25519 (PKCS8 PEM). Precedência:
 *  1. env `WSGL_LICENCA_CHAVE_PRIVADA` (PEM inline — prod/secret manager);
 *  2. arquivo apontado por `WSGL_LICENCA_CHAVE_PRIVADA_ARQUIVO` (resolvido junto ao
 *     config.cfg no boot) — conveniência de dev/homolog, sem PEM multilinha no terminal.
 * Sem nenhuma das fontes, lança erro tipado.
 */
export async function carregarChavePrivada(): Promise<KeyLike> {
  let pem = process.env.WSGL_LICENCA_CHAVE_PRIVADA;
  if (!pem || !pem.trim()) {
    const arquivo = process.env.WSGL_LICENCA_CHAVE_PRIVADA_ARQUIVO;
    if (arquivo && fs.existsSync(arquivo)) {
      pem = fs.readFileSync(arquivo).toString();
    }
  }
  if (!pem || !pem.trim()) {
    throw { mensagem: 'Chave privada de licença ausente (defina a env WSGL_LICENCA_CHAVE_PRIVADA ou crie o arquivo de chave junto ao config.cfg)' };
  }
  return importPKCS8(pem, ALG_LICENCA);
}

/**
 * Gera um novo par Ed25519 e retorna as chaves em PEM.
 * Uso: provisionamento/dev — a privada deve ser guardada fora do repositório
 * (variável de ambiente), e a pública distribuída ao Licenciador.
 */
export async function gerarParDeChaves(): Promise<{ privadaPem: string; publicaPem: string }> {
  const { privateKey, publicKey } = await generateKeyPair(ALG_LICENCA, { extractable: true });
  return {
    privadaPem: await exportPKCS8(privateKey),
    publicaPem: await exportSPKI(publicKey),
  };
}
