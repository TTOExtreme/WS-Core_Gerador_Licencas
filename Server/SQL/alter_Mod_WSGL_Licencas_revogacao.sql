-- Roda AUTOMATICAMENTE na inicializacao (Cadastro_Dados_Banco.Inicializar_Dados processa
-- os alter_*.sql de forma idempotente: pre-checa a coluna no information_schema e so aplica se faltar).
-- Adiciona as colunas de revogacao (motivo/quando) a tabela _Mod_WSGL_Licencas, tanto em bancos
-- ja instalados quanto em instalacao nova (a tabela base nao inclui essas colunas).
ALTER TABLE _Mod_WSGL_Licencas ADD COLUMN motivo_revogacao VARCHAR(300) NULL;
ALTER TABLE _Mod_WSGL_Licencas ADD COLUMN revogada_em TIMESTAMP NULL;
