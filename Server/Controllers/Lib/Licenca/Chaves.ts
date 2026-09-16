import * as fs from 'fs';
import { createPrivateKey, createPublicKey } from 'crypto';
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
  return importPKCS8(carregarPrivadaPem(), ALG_LICENCA);
}

/** Resolve o PEM (normalizado) da chave privada pela mesma precedência de `carregarChavePrivada`. */
function carregarPrivadaPem(): string {
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
  return normalizarPem(pem);
}

/**
 * Exporta a chave PÚBLICA (SPKI PEM) derivada da privada corrente + o `kid` atual, para
 * provisão no Licenciador (`ChavesPublicas`). Deriva a pública sem regerar o par nem
 * expor a privada — assim a distribuição pode ser feita por tela, como o cert-pinning.
 */
export function exportarPublicaSpki(): { kid: string; spki_pem: string } {
  const priv = createPrivateKey(carregarPrivadaPem());
  const spki_pem = createPublicKey(priv).export({ type: 'spki', format: 'pem' }).toString();
  return { kid: kidAtual(), spki_pem };
}

/**
 * Normaliza um PEM que possa ter chegado na forma "escapada" (como o `gerar-chaves` imprime
 * para secret managers): remove aspas externas e converte `\n`/`\r` literais em quebras reais.
 * Um PEM já válido (com quebras reais e sem `\n` literal) passa intacto. Evita o erro comum
 * `ERR_OSSL_ASN1_HEADER_TOO_LONG` quando a chave é colada na env/arquivo com escapes.
 */
export function normalizarPem(bruto: string): string {
  let pem = bruto.trim();
  if ((pem.startsWith('"') && pem.endsWith('"')) || (pem.startsWith("'") && pem.endsWith("'"))) {
    pem = pem.slice(1, -1);
  }
  if (pem.indexOf('\\n') >= 0) {
    pem = pem.replace(/\\r/g, '').replace(/\\n/g, '\n');
  }
  return pem.trim();
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
