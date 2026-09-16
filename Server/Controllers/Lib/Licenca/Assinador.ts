import { SignJWT } from 'jose';
import { LicencaClaims } from './Tipos';
import { carregarChavePrivada, kidAtual, emissor, ALG_LICENCA } from './Chaves';

/** Validade máxima de uma licença de produção, em dias (spec §3.3). */
export const VALIDADE_MAXIMA_DIAS = 30;
/** Validade máxima de uma licença de AVALIAÇÃO (ambiente=teste), em dias (~10 anos). */
export const VALIDADE_TESTE_MAXIMA_DIAS = 3650;

export interface OpcoesAssinatura {
  /** Validade desejada em dias; limitada ao teto aplicável. */
  validadeDias?: number;
  /** Permite validade longa (só para ambiente=teste). */
  permitirLongo?: boolean;
}

/**
 * Emite uma licença como JWS compacto (EdDSA/Ed25519) assinada com a chave privada
 * do Gerador. Adiciona iat/nbf/exp/iss/kid; a validade nunca excede 30 dias (ou 3650 com permitirLongo).
 */
export async function assinarLicenca(claims: LicencaClaims, opcoes: OpcoesAssinatura = {}): Promise<string> {
  const teto = opcoes.permitirLongo ? VALIDADE_TESTE_MAXIMA_DIAS : VALIDADE_MAXIMA_DIAS;
  const dias = Math.min(opcoes.validadeDias ?? VALIDADE_MAXIMA_DIAS, teto);
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
