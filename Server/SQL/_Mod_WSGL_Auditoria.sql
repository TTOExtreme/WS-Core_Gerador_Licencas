CREATE TABLE IF NOT EXISTS _Mod_WSGL_Auditoria(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evento VARCHAR(120) NOT NULL,
    usuario_id BIGINT NULL,
    usuario_login VARCHAR(120) NULL,
    origem_modulo VARCHAR(120) NULL,
    dados_entrada MEDIUMTEXT NULL,
    status VARCHAR(20) NOT NULL,
    retorno VARCHAR(255) NULL,
    criado_em TIMESTAMP NULL,
    INDEX idx_wsgl_auditoria_evento (evento)
);
