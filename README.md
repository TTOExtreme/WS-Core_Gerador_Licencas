# WSCore — Gerador de Licenças

Emissor central de licenças do ecossistema **WSCore**, mantido exclusivamente pela
equipe desenvolvedora. Responsável por **autorizar, emitir, assinar, renovar,
revogar, transferir entre clusters e auditar** as licenças de uso dos clientes que
operam o WSCore.

## Papel no licenciamento híbrido

O licenciamento é dividido em dois componentes:

| Componente | Repositório | Papel |
|---|---|---|
| **Gerador de Licenças** (este) | `WS-Core_Gerador_Licencas` | Emissor central. Emite e **assina** as licenças. |
| **Licenciador** | `WS-Core_Licenciador` | Módulo local no cluster do cliente. **Valida e renova** as licenças. |

Este módulo expõe **duas faces**:

- **Painel administrativo** (Socket / Core): telas para a equipe gerir clientes,
  contratos, ambientes, clusters, e emitir/renovar/revogar licenças.
- **API de Licenciamento** (HTTPS): endpoint que o Licenciador remoto do cliente
  consome para ativação, validação e renovação de licenças.

## Assinatura de licenças

As licenças são emitidas como **JWS compacto** assinado com **Ed25519 (EdDSA)**. A
chave privada permanece exclusivamente neste Gerador; a chave pública é distribuída
ao Licenciador para validação. Alterações no banco local do cliente não tornam uma
licença válida sem a assinatura correspondente.

## Especificação

Escopo funcional completo em
[`_ProjectControl/WSCoreGeradorLicenças.md`](_ProjectControl/WSCoreGeradorLicen%C3%A7as.md)
(seções §14-15). O design do programa e os planos de implementação por fase ficam em
`_ProjectControl/Specs/` e `_ProjectControl/Plans/`.

## Stack

- TypeScript 5.x · Node.js 24+ LTS · Express · Socket.IO · MySQL (`mysql2`)
- Assinatura: **Ed25519 / JWS** (`jose`)

## Status

Versão **1.1.0** (alinhada à versão do sistema WSCore). Em desenvolvimento —
convertido a partir do módulo de referência `WSCore_RH`, cuja infraestrutura
(`Lib`, `Modulos`, `_WebFiles`, `Modelo_Configuracao`) é reaproveitada.

## Comandos

- `npm install` — instala dependências
- `npm run dev` — executa em desenvolvimento
- `npm run build` — compila o projeto
- `npm test` — roda os testes
- `npm run lint` — linter
