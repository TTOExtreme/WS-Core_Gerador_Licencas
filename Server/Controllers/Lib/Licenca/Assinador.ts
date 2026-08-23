import { SignJWT } from 'jose';
import { LicencaClaims } from './Tipos';
import { carregarChavePrivada, kidAtual, emissor, ALG_LICENCA } from './Chaves';

/** Validade máxima de uma licença, em dias (spec §3.3). */
export const VALIDADE_MAXIMA_DIAS = 30;

export interface OpcoesAssinatura {
  /** Validade desejada em dias; limitada a VALIDADE_MAXIMA_DIAS. */
  validadeDias?: number;
}

/**
 * Emite uma licença como JWS compacto (EdDSA/Ed25519) assinada com a chave privada
 * do Gerador. Adiciona iat/nbf/exp/iss/kid; a validade nunca excede 30 dias.
 */
export async function assinarLicenca(claims: LicencaClaims, opcoes: OpcoesAssinatura = {}): Promise<string> {
  const dias = Math.min(opcoes.validadeDias ?? VALIDADE_MAXIMA_DIAS, VALIDADE_MAXIMA_DIAS);
  if (dias <= 0) throw { mensagem: 'Validade da licença deve ser positiva' };

  const chave = await carregarChavePrivada();
  const agora = Math.floor(Date.now() / 1000);
  const exp = agora + dias * 86400;

  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: ALG_LICENCA, kid: kidAtual() })
    .setIssuedAt(agora)
    .setNotBefore(agora)
    .setExpirationTime(exp)
    .setIssuer(emissor())
    .setSubject(claims.lic_id)
    .sign(chave);
}
