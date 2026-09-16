-- Roda AUTOMATICAMENTE na inicializacao (Cadastro_Dados_Banco.Inicializar_Dados pre-checa a
-- coluna e so aplica se faltar). Eixos ortogonais da licenca (escopo + modelo de uso).
ALTER TABLE _Mod_WSGL_Licencas ADD COLUMN escopo VARCHAR(20) NULL;
ALTER TABLE _Mod_WSGL_Licencas ADD COLUMN modelo_uso VARCHAR(20) NULL;
