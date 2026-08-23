export class _Mod_WSGL_Contratos {
  id!: number;
  cliente_id!: number;
  codigo!: string | null;
  modalidade!: string | null;
  vigencia_inicio!: Date | null;
  vigencia_fim!: Date | null;
  situacao!: 'ativo' | 'suspenso' | 'encerrado';
  regras_renovacao!: string | null;
  politica_revogacao!: string | null;
  observacoes!: string | null;
  criado_em!: Date; criado_por!: number; editado_em!: Date; editado_por!: number;
  excluido_em!: Date; excluido_por!: number; ativado_em!: Date; ativado_por!: number;
  inativado_em!: Date; inativado_por!: number; ativo!: boolean; excluido!: boolean;
}
