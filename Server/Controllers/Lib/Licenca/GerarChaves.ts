import { gerarParDeChaves, kidAtual, emissor } from './Chaves';

(async () => {
  const { privadaPem, publicaPem } = await gerarParDeChaves();
  console.log('# kid=' + kidAtual() + '  emissor=' + emissor());
  console.log('# 1) Defina no ambiente do GERADOR (NUNCA commitar a privada):');
  console.log('WSGL_LICENCA_CHAVE_PRIVADA=' + JSON.stringify(privadaPem));
  console.log('# 2) Distribua esta chave PUBLICA ao Licenciador (por kid):');
  console.log(publicaPem);
})().catch((e) => { console.error(e); process.exit(1); });
