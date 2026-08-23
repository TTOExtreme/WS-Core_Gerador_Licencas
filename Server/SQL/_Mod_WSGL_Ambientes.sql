CREATE TABLE IF NOT EXISTS _Mod_WSGL_Ambientes(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL COMMENT 'FK -> _Mod_WSGL_Clientes',
    contrato_id BIGINT NULL COMMENT 'FK -> _Mod_WSGL_Contratos',
    nome VARCHAR(160) NOT NULL,
    tipo ENUM('producao','homologacao','desenvolvimento','teste') NOT NULL DEFAULT 'producao',
    validade DATE NULL,
    observacoes VARCHAR(500) NULL,
    criado_em TIMESTAMP NULL, criado_por BIGINT NOT NULL DEFAULT 0,
    editado_em TIMESTAMP NULL, editado_por BIGINT NOT NULL DEFAULT 0,
    excluido_em TIMESTAMP NULL, excluido_por BIGINT NOT NULL DEFAULT 0,
    ativado_em TIMESTAMP NULL, ativado_por BIGINT NOT NULL DEFAULT 0,
    inativado_em TIMESTAMP NULL, inativado_por BIGINT NOT NULL DEFAULT 0,
    ativo INT(1) DEFAULT 1, excluido INT(1) DEFAULT 0,
    INDEX idx_wsgl_ambientes_cliente (cliente_id)
);
