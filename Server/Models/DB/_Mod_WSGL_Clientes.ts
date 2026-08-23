export class _Mod_WSGL_Clientes {
  id!: number;
  razao_social!: string;
  nome_fantasia!: string | null;
  documento!: string | null;
  inscricao_estadual!: string | null;
  email!: string | null;
  telefone!: string | null;
  responsavel_tecnico!: string | null;
  responsavel_comercial!: string | null;
  observacoes!: string | null;
  criado_em!: Date; criado_por!: number; editado_em!: Date; editado_por!: number;
  excluido_em!: Date; excluido_por!: number; ativado_em!: Date; ativado_por!: number;
  inativado_em!: Date; inativado_por!: number; ativo!: boolean; excluido!: boolean;
}
