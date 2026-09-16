CREATE TABLE IF NOT EXISTS _Mod_WSGL_Contratos(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL COMMENT 'FK -> _Mod_WSGL_Clientes',
    codigo VARCHAR(60) NULL,
    modalidade VARCHAR(80) NULL,
    vigencia_inicio DATE NULL,
    vigencia_fim DATE NULL,
    situacao ENUM('ativo','suspenso','encerrado') NOT NULL DEFAULT 'ativo',
    regras_renovacao VARCHAR(300) NULL,
    politica_revogacao VARCHAR(300) NULL,
    observacoes VARCHAR(500) NULL,
    criado_em TIMESTAMP NULL, criado_por BIGINT NOT NULL DEFAULT 0,
    editado_em TIMESTAMP NULL, editado_por BIGINT NOT NULL DEFAULT 0,
    excluido_em TIMESTAMP NULL, excluido_por BIGINT NOT NULL DEFAULT 0,
    ativado_em TIMESTAMP NULL, ativado_por BIGINT NOT NULL DEFAULT 0,
    inativado_em TIMESTAMP NULL, inativado_por BIGINT NOT NULL DEFAULT 0,
    ativo INT(1) DEFAULT 1, excluido INT(1) DEFAULT 0,
    INDEX idx_wsgl_contratos_cliente (cliente_id)
);
