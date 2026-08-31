export class _Mod_WSGL_Licencas {
  id!: number;
  lic_id!: string;
  tipo!: string;
  cliente_id!: number;
  contrato_id!: number | null;
  ambiente_id!: number;
  cluster_id!: number;
  modulo!: string | null;
  versao!: string | null;
  instancia!: string | null;
  nivel!: string | null;
  limites!: string | null;
  jws!: string;
  kid!: string | null;
  situacao!: 'ativa' | 'expirada' | 'revogada' | 'substituida';
  tipo_emissao!: 'nova' | 'renovacao' | 'substituicao' | 'extensao';
  emitida_em!: Date | null;
  expira_em!: Date | null;
  motivo_revogacao!: string | null;
  revogada_em!: Date | null;
  criado_em!: Date; criado_por!: number; editado_em!: Date; editado_por!: number;
  excluido_em!: Date; excluido_por!: number; ativado_em!: Date; ativado_por!: number;
  inativado_em!: Date; inativado_por!: number; ativo!: boolean; excluido!: boolean;
}
