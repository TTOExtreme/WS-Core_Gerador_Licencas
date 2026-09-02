-- Permissoes do modulo Gerador de Licencas
-- Roda automaticamente uma unica vez na instalacao
INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("tela/wsgl","Menu Licenciamento","Acesso ao menu raiz do Gerador de Licencas","WSCore_GeradorLicencas");

-- Permissoes das telas de cadastro (Fase G1): Clientes, Contratos, Ambientes, Clusters
INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("tela/wsgl/clientes","Tela Clientes","Tela de cadastro de clientes","WSCore_GeradorLicencas"),
("wsgl/clientes.listar","Listagem Clientes","Permissao de listagem de clientes","WSCore_GeradorLicencas"),
("wsgl/clientes.criar","Inclusao Clientes","Permissao de criacao de clientes","WSCore_GeradorLicencas"),
("wsgl/clientes.editar","Edicao Clientes","Permissao de edicao de clientes","WSCore_GeradorLicencas"),
("wsgl/clientes.ativar","Ativacao Clientes","Permissao de ativacao de clientes","WSCore_GeradorLicencas"),
("wsgl/clientes.inativar","Inativacao Clientes","Permissao de inativacao de clientes","WSCore_GeradorLicencas"),
("wsgl/clientes.excluir","Exclusao Clientes","Permissao de exclusao de clientes","WSCore_GeradorLicencas");

INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("tela/wsgl/contratos","Tela Contratos","Tela de cadastro de contratos","WSCore_GeradorLicencas"),
("wsgl/contratos.listar","Listagem Contratos","Permissao de listagem de contratos","WSCore_GeradorLicencas"),
("wsgl/contratos.criar","Inclusao Contratos","Permissao de criacao de contratos","WSCore_GeradorLicencas"),
("wsgl/contratos.editar","Edicao Contratos","Permissao de edicao de contratos","WSCore_GeradorLicencas"),
("wsgl/contratos.ativar","Ativacao Contratos","Permissao de ativacao de contratos","WSCore_GeradorLicencas"),
("wsgl/contratos.inativar","Inativacao Contratos","Permissao de inativacao de contratos","WSCore_GeradorLicencas"),
("wsgl/contratos.excluir","Exclusao Contratos","Permissao de exclusao de contratos","WSCore_GeradorLicencas");

INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("tela/wsgl/ambientes","Tela Ambientes","Tela de cadastro de ambientes","WSCore_GeradorLicencas"),
("wsgl/ambientes.listar","Listagem Ambientes","Permissao de listagem de ambientes","WSCore_GeradorLicencas"),
("wsgl/ambientes.criar","Inclusao Ambientes","Permissao de criacao de ambientes","WSCore_GeradorLicencas"),
("wsgl/ambientes.editar","Edicao Ambientes","Permissao de edicao de ambientes","WSCore_GeradorLicencas"),
("wsgl/ambientes.ativar","Ativacao Ambientes","Permissao de ativacao de ambientes","WSCore_GeradorLicencas"),
("wsgl/ambientes.inativar","Inativacao Ambientes","Permissao de inativacao de ambientes","WSCore_GeradorLicencas"),
("wsgl/ambientes.excluir","Exclusao Ambientes","Permissao de exclusao de ambientes","WSCore_GeradorLicencas");

INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("tela/wsgl/clusters","Tela Clusters","Tela de cadastro de clusters","WSCore_GeradorLicencas"),
("wsgl/clusters.listar","Listagem Clusters","Permissao de listagem de clusters","WSCore_GeradorLicencas"),
("wsgl/clusters.criar","Inclusao Clusters","Permissao de criacao de clusters","WSCore_GeradorLicencas"),
("wsgl/clusters.editar","Edicao Clusters","Permissao de edicao de clusters","WSCore_GeradorLicencas"),
("wsgl/clusters.excluir","Exclusao Clusters","Permissao de exclusao de clusters","WSCore_GeradorLicencas");

INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("wsgl/clusters.provisionar","Provisionamento Clusters","Permissao de provisionar (vincular cliente/ambiente) cluster auto-registrado","WSCore_GeradorLicencas"),
("wsgl/clusters.aprovar","Aprovacao Clusters","Permissao de aprovar cluster","WSCore_GeradorLicencas"),
("wsgl/clusters.bloquear","Bloqueio Clusters","Permissao de bloquear cluster","WSCore_GeradorLicencas"),
("wsgl/clusters.inativar","Inativacao Clusters","Permissao de inativar cluster","WSCore_GeradorLicencas");

-- Permissoes da tela de Licencas (Fase G2)
INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("tela/wsgl/licencas","Tela Licencas","Tela de emissao e consulta de licencas","WSCore_GeradorLicencas"),
("wsgl/licencas.listar","Listagem Licencas","Permissao de listagem de licencas","WSCore_GeradorLicencas"),
("wsgl/licencas.emitir","Emissao Licencas","Permissao de emitir licencas","WSCore_GeradorLicencas");

-- Permissoes do catalogo de Modulos & Versoes
INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("tela/wsgl/modulos","Tela Modulos","Catalogo de modulos e versoes","WSCore_GeradorLicencas"),
("wsgl/modulos.listar","Listagem Modulos","Permissao de listagem do catalogo de modulos","WSCore_GeradorLicencas"),
("wsgl/modulos.criar","Inclusao Modulos","Permissao de criacao de modulo/versao","WSCore_GeradorLicencas"),
("wsgl/modulos.editar","Edicao Modulos","Permissao de edicao de modulo/versao","WSCore_GeradorLicencas"),
("wsgl/modulos.excluir","Exclusao Modulos","Permissao de exclusao de modulo/versao","WSCore_GeradorLicencas");

-- Permissoes de ciclo de vida (Fase G3)
INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("wsgl/licencas.renovar","Renovacao Licencas","Permissao de renovar licencas","WSCore_GeradorLicencas"),
("wsgl/licencas.estender","Extensao Licencas","Permissao de estender licencas","WSCore_GeradorLicencas"),
("wsgl/licencas.revogar","Revogacao Licencas","Permissao de revogar licencas","WSCore_GeradorLicencas"),
("wsgl/clusters.substituir","Substituicao Clusters","Permissao de substituir/migrar cluster","WSCore_GeradorLicencas");

-- Permissoes das telas de observabilidade (Fase G4)
INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("tela/wsgl/dashboard","Tela Dashboard","Painel geral de licenciamento","WSCore_GeradorLicencas"),
("tela/wsgl/monitoramento","Tela Monitoramento","Monitoramento de ambientes/clusters","WSCore_GeradorLicencas"),
("tela/wsgl/auditoria","Tela Auditoria","Consulta de auditoria do Licenciador","WSCore_GeradorLicencas");

-- Permissao da tela de Certificado da API (Fase cert-pinning)
INSERT IGNORE INTO _Permissoes (codigo,nome,descricao,modulo) VALUES
("tela/wsgl/certificado","Tela Certificado","Exportacao do certificado publico da API de Licenciamento","WSCore_GeradorLicencas");
