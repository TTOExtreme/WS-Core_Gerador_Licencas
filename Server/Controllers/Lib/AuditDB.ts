import { Conector_Mysql } from './Conector_Mysql';

interface DadosAuditoria {
    evento:        string;
    usuario_id?:   number | null;
    usuario_login?: string | null;
    origem_modulo?: string | null;
    dados_entrada?: string | null;
    status:        string;
    retorno?:      string | null;
}

export class AuditDB {
    private static _bd: Conector_Mysql | null = null;
    private static _tabela: string = '_Mod_Auditoria';

    /** Inicializa o singleton. Chamar uma vez após o banco estar pronto.
     *  `tabela` permite que cada módulo grave na sua própria tabela de auditoria. */
    static Inicializar(bd: Conector_Mysql, tabela: string = '_Mod_Auditoria'): void {
        AuditDB._bd = bd;
        AuditDB._tabela = tabela;
    }

    /**
     * Grava uma ação de auditoria de forma fire-and-forget.
     * Nunca lança — falha silenciosa para não impactar o fluxo principal.
     */
    static Gravar(dados: DadosAuditoria): void {
        if (!AuditDB._bd) return;
        AuditDB._bd.Query(
            `INSERT INTO ${AuditDB._tabela}
                (evento, usuario_id, usuario_login, origem_modulo, dados_entrada, status, retorno, criado_em)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                dados.evento,
                dados.usuario_id ?? null,
                dados.usuario_login ?? null,
                dados.origem_modulo ?? null,
                dados.dados_entrada ?? null,
                dados.status,
                dados.retorno ?? null,
                new Date(),
            ]
        ).catch(() => {});
    }
}
