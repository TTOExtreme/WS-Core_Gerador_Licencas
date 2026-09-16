CREATE TABLE IF NOT EXISTS _Mod_WSGL_Clientes(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    razao_social VARCHAR(180) NOT NULL,
    nome_fantasia VARCHAR(180) NULL,
    documento VARCHAR(20) NULL COMMENT 'CNPJ/CPF',
    inscricao_estadual VARCHAR(30) NULL,
    email VARCHAR(160) NULL,
    telefone VARCHAR(20) NULL,
    responsavel_tecnico VARCHAR(160) NULL,
    responsavel_comercial VARCHAR(160) NULL,
    observacoes VARCHAR(500) NULL,
    criado_em TIMESTAMP NULL, criado_por BIGINT NOT NULL DEFAULT 0,
    editado_em TIMESTAMP NULL, editado_por BIGINT NOT NULL DEFAULT 0,
    excluido_em TIMESTAMP NULL, excluido_por BIGINT NOT NULL DEFAULT 0,
    ativado_em TIMESTAMP NULL, ativado_por BIGINT NOT NULL DEFAULT 0,
    inativado_em TIMESTAMP NULL, inativado_por BIGINT NOT NULL DEFAULT 0,
    ativo INT(1) DEFAULT 1, excluido INT(1) DEFAULT 0,
    INDEX idx_wsgl_clientes_documento (documento)
);
