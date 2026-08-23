-- Menu raiz do modulo Gerador de Licencas
-- Roda automaticamente uma unica vez na instalacao (ver Cadastro_Dados_Banco.Inicializar_Dados())
INSERT IGNORE INTO _Menus (codigo,nome,descricao,menu_pai,versao,permissao,modulo,evento,load_dependencia,configuracao) VALUES
("wsgl","Licenciamento","Gestao de clientes, contratos, clusters e licencas do WSCore","","1.1.0","tela/wsgl","WSCore_GeradorLicencas","","","{\"menu_icon\":\"verified_user\"}");

-- Telas de cadastro (Fase G1): Clientes, Contratos, Ambientes, Clusters
INSERT IGNORE INTO _Menus (codigo,nome,descricao,menu_pai,versao,permissao,modulo,evento,load_dependencia,configuracao) VALUES
("wsgl/clientes","Clientes","Cadastro de clientes","wsgl","1.1.0","tela/wsgl/clientes","WSCore_GeradorLicencas","open/wsgl/clientes","./modulos/WSCore_GeradorLicencas/js/WSGL_Cadastros.js","{\"menu_icon\":\"apartment\"}"),
("wsgl/contratos","Contratos","Contratos comerciais dos clientes","wsgl","1.1.0","tela/wsgl/contratos","WSCore_GeradorLicencas","open/wsgl/contratos","./modulos/WSCore_GeradorLicencas/js/WSGL_Cadastros.js","{\"menu_icon\":\"description\"}"),
("wsgl/ambientes","Ambientes","Ambientes por cliente (Prod/Homolog/Dev/Teste)","wsgl","1.1.0","tela/wsgl/ambientes","WSCore_GeradorLicencas","open/wsgl/ambientes","./modulos/WSCore_GeradorLicencas/js/WSGL_Cadastros.js","{\"menu_icon\":\"dns\"}"),
("wsgl/clusters","Clusters","Clusters autorizados e sua identidade","wsgl","1.1.0","tela/wsgl/clusters","WSCore_GeradorLicencas","open/wsgl/clusters","./modulos/WSCore_GeradorLicencas/js/WSGL_Cadastros.js","{\"menu_icon\":\"hub\"}");

UPDATE _Menus SET categoria='cadastros' WHERE codigo IN ('wsgl/clientes','wsgl/contratos','wsgl/ambientes','wsgl/clusters');

-- Tela de Licencas (Fase G2): emissao e consulta
INSERT IGNORE INTO _Menus (codigo,nome,descricao,menu_pai,versao,permissao,modulo,evento,load_dependencia,configuracao) VALUES
("wsgl/licencas","Licenças","Emissao e consulta de licencas assinadas","wsgl","1.1.0","tela/wsgl/licencas","WSCore_GeradorLicencas","open/wsgl/licencas","./modulos/WSCore_GeradorLicencas/js/WSGL_Licencas.js","{\"menu_icon\":\"key\"}");
UPDATE _Menus SET categoria='cadastros' WHERE codigo IN ('wsgl/licencas');
