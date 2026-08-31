-- Catalogo inicial de modulos WSCore (versao 1.1.0 / disponivel), semeado a partir dos
-- modulos existentes. Idempotente (INSERT IGNORE respeita o unique modulo_nome+versao).
-- O administrador ajusta versoes e flags (disponivel/beta/descomissionado) pela tela Modulos & Versoes.
INSERT IGNORE INTO _Mod_WSGL_Modulos (modulo_nome, modulo_titulo, versao, situacao, criado_em, ativo, excluido) VALUES
("WSCore_Autenticador","Autenticador","1.1.0","disponivel",NOW(),1,0),
("WSCore_GeradorLicencas","Gerador de Licencas","1.1.0","disponivel",NOW(),1,0),
("WSCore_Licenciador","Licenciador","1.1.0","disponivel",NOW(),1,0),
("WSCore_Financeiro","Financeiro","1.1.0","disponivel",NOW(),1,0),
("WSCore_RH","Recursos Humanos","1.1.0","disponivel",NOW(),1,0),
("WSCore_IPAM","IPAM","1.1.0","disponivel",NOW(),1,0),
("WSCore_BackupSSH","Backup SSH","1.1.0","disponivel",NOW(),1,0),
("WSCore_DNSControl","DNS Control","1.1.0","disponivel",NOW(),1,0),
("WSCore_WebChat","WebChat","1.1.0","disponivel",NOW(),1,0),
("WSCore_ServerControl","Server Control","1.1.0","disponivel",NOW(),1,0),
("WSCore_CofreSenhas","Cofre de Senhas","1.1.0","disponivel",NOW(),1,0),
("WSCore_M365-Integrador","M365 Integrador","1.1.0","disponivel",NOW(),1,0);
