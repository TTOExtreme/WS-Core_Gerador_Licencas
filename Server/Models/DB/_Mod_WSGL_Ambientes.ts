export class _Mod_WSGL_Ambientes {
  id!: number;
  cliente_id!: number;
  contrato_id!: number | null;
  nome!: string;
  tipo!: 'producao' | 'homologacao' | 'desenvolvimento' | 'teste';
  validade!: Date | null;
  observacoes!: string | null;
  criado_em!: Date; criado_por!: number; editado_em!: Date; editado_por!: number;
  excluido_em!: Date; excluido_por!: number; ativado_em!: Date; ativado_por!: number;
  inativado_em!: Date; inativado_por!: number; ativo!: boolean; excluido!: boolean;
}
