export class _Mod_WSGL_Modulos {
  id!: number;
  modulo_nome!: string;
  modulo_titulo!: string | null;
  versao!: string;
  situacao!: 'disponivel' | 'beta' | 'descomissionado';
  observacao!: string | null;
  criado_em!: Date; criado_por!: number; editado_em!: Date; editado_por!: number;
  excluido_em!: Date; excluido_por!: number; ativo!: boolean; excluido!: boolean;
}
