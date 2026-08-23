-- Permissoes do modulo Gerador de Licencas
-- Roda automaticamente uma unica vez na instalacao
INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("tela/wsgl","Menu Licenciamento","Acesso ao menu raiz do Gerador de Licencas","WSCore_GeradorLicencas");
