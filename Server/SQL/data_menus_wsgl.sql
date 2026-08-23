-- Menu raiz do modulo Gerador de Licencas
-- Roda automaticamente uma unica vez na instalacao (ver Cadastro_Dados_Banco.Inicializar_Dados())
INSERT IGNORE INTO _Menus (codigo,nome,descricao,menu_pai,versao,permissao,modulo,evento,load_dependencia,configuracao) VALUES
("wsgl","Licenciamento","Gestao de clientes, contratos, clusters e licencas do WSCore","","1.1.0","tela/wsgl","WSCore_GeradorLicencas","","","{\"menu_icon\":\"verified_user\"}");
