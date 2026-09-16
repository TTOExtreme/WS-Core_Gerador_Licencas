CREATE TABLE IF NOT EXISTS _Mod_WSGL_Modulos(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    modulo_nome VARCHAR(120) NOT NULL COMMENT 'Modulo_Nome de runtime (ex.: WSCore_Financeiro)',
    modulo_titulo VARCHAR(160) NULL COMMENT 'rotulo amigavel para exibicao',
    versao VARCHAR(40) NOT NULL COMMENT 'versao do modulo (ex.: 1.1.0)',
    situacao ENUM('disponivel','beta','descomissionado') NOT NULL DEFAULT 'disponivel',
    observacao VARCHAR(300) NULL,
    criado_em TIMESTAMP NULL, criado_por BIGINT NOT NULL DEFAULT 0,
    editado_em TIMESTAMP NULL, editado_por BIGINT NOT NULL DEFAULT 0,
    excluido_em TIMESTAMP NULL, excluido_por BIGINT NOT NULL DEFAULT 0,
    ativo INT(1) DEFAULT 1, excluido INT(1) DEFAULT 0,
    UNIQUE KEY uq_wsgl_modulos_nome_versao (modulo_nome, versao),
    INDEX idx_wsgl_modulos_nome (modulo_nome),
    INDEX idx_wsgl_modulos_situacao (situacao)
);
