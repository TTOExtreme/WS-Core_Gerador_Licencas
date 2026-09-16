CREATE TABLE IF NOT EXISTS _Mod_WSGL_Clusters(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL COMMENT 'FK -> _Mod_WSGL_Clientes',
    ambiente_id BIGINT NOT NULL COMMENT 'FK -> _Mod_WSGL_Ambientes',
    nome VARCHAR(160) NOT NULL,
    cluster_uid VARCHAR(64) NOT NULL COMMENT 'identidade publica persistente do cluster',
    situacao ENUM('pendente','aprovado','inativo','bloqueado') NOT NULL DEFAULT 'pendente',
    origem_rede VARCHAR(255) NULL COMMENT 'IPs/faixas autorizadas',
    ultima_comunicacao TIMESTAMP NULL,
    observacoes VARCHAR(500) NULL,
    criado_em TIMESTAMP NULL, criado_por BIGINT NOT NULL DEFAULT 0,
    editado_em TIMESTAMP NULL, editado_por BIGINT NOT NULL DEFAULT 0,
    excluido_em TIMESTAMP NULL, excluido_por BIGINT NOT NULL DEFAULT 0,
    ativado_em TIMESTAMP NULL, ativado_por BIGINT NOT NULL DEFAULT 0,
    inativado_em TIMESTAMP NULL, inativado_por BIGINT NOT NULL DEFAULT 0,
    ativo INT(1) DEFAULT 1, excluido INT(1) DEFAULT 0,
    UNIQUE KEY uq_wsgl_clusters_uid (cluster_uid),
    INDEX idx_wsgl_clusters_ambiente (ambiente_id)
);
