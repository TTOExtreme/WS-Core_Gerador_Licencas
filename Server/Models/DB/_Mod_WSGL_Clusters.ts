export class _Mod_WSGL_Clusters {
  id!: number;
  cliente_id!: number;
  ambiente_id!: number;
  nome!: string;
  cluster_uid!: string;
  situacao!: 'pendente' | 'aprovado' | 'inativo' | 'bloqueado';
  origem_rede!: string | null;
  ultima_comunicacao!: Date | null;
  observacoes!: string | null;
  criado_em!: Date; criado_por!: number; editado_em!: Date; editado_por!: number;
  excluido_em!: Date; excluido_por!: number; ativado_em!: Date; ativado_por!: number;
  inativado_em!: Date; inativado_por!: number; ativo!: boolean; excluido!: boolean;
}
