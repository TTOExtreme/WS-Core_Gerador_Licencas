-- Roda AUTOMATICAMENTE na inicializacao (Cadastro_Dados_Banco.Inicializar_Dados pre-checa a
-- coluna no information_schema e so aplica se faltar). Adiciona a versao do modulo a licenca,
-- para o catalogo de modulos/versoes (bloqueio de emissao nova sobre versao descomissionada).
ALTER TABLE _Mod_WSGL_Licencas ADD COLUMN versao VARCHAR(40) NULL;
