/**
 * Schema de claims de uma licença WSCore. Contrato comum entre o Gerador (assina)
 * e o Licenciador (valida). Ver _ProjectControl/Specs/2026-08-22-Licenciamento-Hibrido-design.md §3.
 */

export enum TipoLicenca {
  BASE = 'base',
  MODULO = 'modulo',
  INSTANCIA_MODULO = 'instancia_modulo',
  USO_UNICO = 'uso_unico',
  USO_MULTIPLO = 'uso_multiplo',
  INTEGRACAO = 'integracao',
  NIVEL_USUARIO = 'nivel_usuario',
  NIVEL_MODULO = 'nivel_modulo',
  AMBIENTE = 'ambiente',
  CORE_ADICIONAL = 'core_adicional',
}

export enum NivelComercial {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  INTEGRACAO = 'integracao',
}

/** Escopo da licença (o que cobre) — eixo ortogonal ao nível e ao modelo de uso. */
export enum EscopoLicenca {
  BASE = 'base',
  MODULO = 'modulo',
  INSTANCIA = 'instancia',
}

/** Modelo de uso das licenças de usuário (base/modulo). */
export enum ModeloUso {
  SIMULTANEOS = 'simultaneos',
  UNICO = 'unico',
}

export enum TipoAmbiente {
  PRODUCAO = 'producao',
  HOMOLOGACAO = 'homologacao',
  DESENVOLVIMENTO = 'desenvolvimento',
  TESTE = 'teste',
}

/** Limites numéricos da licença (vagas simultâneas, instâncias, etc.). */
export interface LicencaLimites {
  vagas?: number;
  instancias?: number;
}

/** Corpo de negócio da licença (antes dos campos temporais iat/nbf/exp/iss/kid). */
export interface LicencaClaims {
  /** ID único da licença. */
  lic_id: string;
  tipo: TipoLicenca;
  /** Escopo (base/modulo/instancia) — eixo primário do modelo de licenças. */
  escopo: EscopoLicenca;
  cliente: string;
  contrato?: string | null;
  ambiente: TipoAmbiente;
  cluster_id: string;
  modulo?: string | null;
  /** Versão do módulo licenciado (casada ao catálogo de módulos/versões). */
  versao?: string | null;
  nivel?: NivelComercial | null;
  /** Modelo de uso (base/modulo): N simultâneos ou usuário único. */
  modelo_uso?: ModeloUso | null;
  limites?: LicencaLimites | null;
}
