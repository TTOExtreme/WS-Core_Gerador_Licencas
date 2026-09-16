import * as fs from 'fs';
import * as path from 'path';
import { gerarParDeChaves, kidAtual, emissor } from './Chaves';

// Local padrão da chave privada: junto ao config.cfg do módulo (Server/config/), casando
// com o default de Config.Licenciamento.ChavePrivadaArquivo. Sobrescreva com o 1º argumento.
const destinoPadrao = path.resolve(__dirname, '../../../config/licenca_privada.pem');
const destino = process.argv[2] ? path.resolve(process.argv[2]) : destinoPadrao;

(async () => {
  if (fs.existsSync(destino)) {
    console.error('[gerar-chaves] Já existe uma chave privada em: ' + destino);
    console.error('[gerar-chaves] Remova o arquivo para regerar (ATENÇÃO: invalida todas as licenças já emitidas).');
    process.exit(1);
  }

  const { privadaPem, publicaPem } = await gerarParDeChaves();

  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, privadaPem, { mode: 0o600 });

  console.log('# kid=' + kidAtual() + '  emissor=' + emissor());
  console.log('# Chave PRIVADA gravada em (lida automaticamente no boot): ' + destino);
  console.log('#   (alternativa para prod: definir a env WSGL_LICENCA_CHAVE_PRIVADA com o PEM — tem prioridade)');
  console.log('# Distribua esta chave PUBLICA ao Licenciador (Licenciamento.ChavesPublicas, kid=' + kidAtual() + '):');
  console.log(publicaPem);
})().catch((e) => { console.error(e); process.exit(1); });
