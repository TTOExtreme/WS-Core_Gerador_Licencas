-- Execucao MANUAL (prefixo alter_ nao roda na inicializacao automatica).
-- Adiciona as colunas de revogacao (motivo/quando) a tabela de Licencas em bancos ja instalados.
-- Em instalacao nova, as colunas ja vem do _Mod_WSGL_Licencas.sql.
ALTER TABLE _Mod_WSGL_Licencas ADD COLUMN motivo_revogacao VARCHAR(300) NULL;
ALTER TABLE _Mod_WSGL_Licencas ADD COLUMN revogada_em TIMESTAMP NULL;
