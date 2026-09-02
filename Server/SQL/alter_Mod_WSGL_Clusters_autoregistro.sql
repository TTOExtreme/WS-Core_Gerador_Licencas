-- Roda AUTOMATICAMENTE na inicializacao (Cadastro_Dados_Banco.Inicializar_Dados pre-checa a
-- coluna e so aplica se faltar). Suporta o auto-registro de clusters: quando um Licenciador
-- desconhecido contata a API, o cluster e criado como pendente/nao-provisionado (cliente_id=0,
-- ambiente_id=0) e estas colunas guardam o IP de origem e o instante do primeiro contato.
ALTER TABLE _Mod_WSGL_Clusters ADD COLUMN ip_origem VARCHAR(64) NULL;
ALTER TABLE _Mod_WSGL_Clusters ADD COLUMN primeira_comunicacao TIMESTAMP NULL;
