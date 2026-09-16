-- Menu raiz do modulo Gerador de Licencas
-- Roda automaticamente uma unica vez na instalacao (ver Cadastro_Dados_Banco.Inicializar_Dados())
INSERT IGNORE INTO _Menus (codigo,nome,descricao,menu_pai,versao,permissao,modulo,evento,load_dependencia,configuracao) VALUES
("wsgl","Licenciamento","Gestao de clientes, contratos, clusters e licencas do WSCore","","1.2.0","tela/wsgl","WSCore_GeradorLicencas","","","{\"menu_icon\":\"verified_user\"}");

-- Telas de cadastro (Fase G1): Clientes, Contratos, Ambientes, Clusters
INSERT IGNORE INTO _Menus (codigo,nome,descricao,menu_pai,versao,permissao,modulo,evento,load_dependencia,configuracao) VALUES
("wsgl/clientes","Clientes","Cadastro de clientes","wsgl","1.2.0","tela/wsgl/clientes","WSCore_GeradorLicencas","open/wsgl/clientes","./modulos/WSCore_GeradorLicencas/js/WSGL_Cadastros.js","{\"menu_icon\":\"apartment\"}"),
("wsgl/contratos","Contratos","Contratos comerciais dos clientes","wsgl","1.2.0","tela/wsgl/contratos","WSCore_GeradorLicencas","open/wsgl/contratos","./modulos/WSCore_GeradorLicencas/js/WSGL_Cadastros.js","{\"menu_icon\":\"description\"}"),
("wsgl/ambientes","Ambientes","Ambientes por cliente (Prod/Homolog/Dev/Teste)","wsgl","1.2.0","tela/wsgl/ambientes","WSCore_GeradorLicencas","open/wsgl/ambientes","./modulos/WSCore_GeradorLicencas/js/WSGL_Cadastros.js","{\"menu_icon\":\"dns\"}"),
("wsgl/clusters","Clusters","Clusters autorizados e sua identidade","wsgl","1.2.0","tela/wsgl/clusters","WSCore_GeradorLicencas","open/wsgl/clusters","./modulos/WSCore_GeradorLicencas/js/WSGL_Cadastros.js","{\"menu_icon\":\"hub\"}");

UPDATE _Menus SET categoria='cadastros' WHERE codigo IN ('wsgl/clientes','wsgl/contratos','wsgl/ambientes','wsgl/clusters');

-- Tela de Licencas (Fase G2): emissao e consulta
INSERT IGNORE INTO _Menus (codigo,nome,descricao,menu_pai,versao,permissao,modulo,evento,load_dependencia,configuracao) VALUES
("wsgl/licencas","Licenças","Emissao e consulta de licencas assinadas","wsgl","1.2.0","tela/wsgl/licencas","WSCore_GeradorLicencas","open/wsgl/licencas","./modulos/WSCore_GeradorLicencas/js/WSGL_Licencas.js","{\"menu_icon\":\"key\"}");
UPDATE _Menus SET categoria='cadastros' WHERE codigo IN ('wsgl/licencas');

-- Tela de Modulos & Versoes (catalogo): flags disponivel/beta/descomissionado
INSERT IGNORE INTO _Menus (codigo,nome,descricao,menu_pai,versao,permissao,modulo,evento,load_dependencia,configuracao) VALUES
("wsgl/modulos","Módulos & Versões","Catalogo de modulos e versoes com flags de disponibilidade","wsgl","1.2.0","tela/wsgl/modulos","WSCore_GeradorLicencas","open/wsgl/modulos","./modulos/WSCore_GeradorLicencas/js/WSGL_Modulos.js","{\"menu_icon\":\"widgets\"}");
UPDATE _Menus SET categoria='cadastros' WHERE codigo IN ('wsgl/modulos');

-- Telas de observabilidade (Fase G4): Dashboard, Monitoramento, Auditoria
INSERT IGNORE INTO _Menus (codigo,nome,descricao,menu_pai,versao,permissao,modulo,evento,load_dependencia,configuracao) VALUES
("wsgl/dashboard","Dashboard","Visao geral do licenciamento","wsgl","1.2.0","tela/wsgl/dashboard","WSCore_GeradorLicencas","open/wsgl/dashboard","./modulos/WSCore_GeradorLicencas/js/WSGL_Dashboard.js","{\"menu_icon\":\"insights\"}"),
("wsgl/monitoramento","Monitoramento","Ambientes e clusters dos clientes","wsgl","1.2.0","tela/wsgl/monitoramento","WSCore_GeradorLicencas","open/wsgl/monitoramento","./modulos/WSCore_GeradorLicencas/js/WSGL_Monitoramento.js","{\"menu_icon\":\"monitor_heart\"}"),
("wsgl/auditoria","Auditoria","Eventos de auditoria do Licenciador","wsgl","1.2.0","tela/wsgl/auditoria","WSCore_GeradorLicencas","open/wsgl/auditoria","./modulos/WSCore_GeradorLicencas/js/WSGL_Auditoria.js","{\"menu_icon\":\"fact_check\"}");
UPDATE _Menus SET categoria='dashboards' WHERE codigo IN ('wsgl/dashboard','wsgl/monitoramento','wsgl/auditoria');

-- Tela de Certificado da API (cert-pinning): exporta o cert publico para os Licenciadores
INSERT IGNORE INTO _Menus (codigo,nome,descricao,menu_pai,versao,permissao,modulo,evento,load_dependencia,configuracao) VALUES
("wsgl/certificado","Certificado da API","Exporta o certificado publico da API de Licenciamento","wsgl","1.2.0","tela/wsgl/certificado","WSCore_GeradorLicencas","open/wsgl/certificado","./modulos/WSCore_GeradorLicencas/js/WSGL_Certificado.js","{\"menu_icon\":\"security\"}");
UPDATE _Menus SET categoria='dashboards' WHERE codigo IN ('wsgl/certificado');
