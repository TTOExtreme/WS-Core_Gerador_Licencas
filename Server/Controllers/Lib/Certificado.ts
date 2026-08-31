import * as fs from 'fs';
import * as path from 'path';
import * as selfsigned from 'selfsigned';

export interface ParCertificado { key: string; cert: string; }

export interface ParCaminhoCert { Cert: string; Key: string; }

/**
 * Resolve caminhos de cert/key relativos contra `baseDir` (ex.: a pasta do config.cfg),
 * deixando caminhos absolutos intactos. Garante um local estável para o certificado,
 * independente do diretório de trabalho (cwd) de onde o processo foi iniciado — evitando
 * que o cert "suma" e seja regerado a cada boot em cwd diferente.
 */
export function resolverCaminhosCert(cert: ParCaminhoCert, baseDir: string): ParCaminhoCert {
  return {
    Cert: path.isAbsolute(cert.Cert) ? cert.Cert : path.resolve(baseDir, cert.Cert),
    Key: path.isAbsolute(cert.Key) ? cert.Key : path.resolve(baseDir, cert.Key),
  };
}

/**
 * Garante um par certificado/chave nos caminhos informados. Se ambos existirem,
 * carrega-os do disco. Se ausentes e `gerar` for true, gera um par self-signed
 * (válido ~10 anos) e persiste em disco; se `gerar` for false, lança erro.
 * Usado pelo Portal de Ponto para subir o servidor HTTPS.
 */
export function GarantirCertificado(certPath: string, keyPath: string, gerar: boolean): ParCertificado {
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return { cert: fs.readFileSync(certPath).toString(), key: fs.readFileSync(keyPath).toString() };
  }
  if (!gerar) {
    throw new Error('Certificado ausente e geração automática desabilitada: ' + certPath);
  }
  const atributos = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(atributos, { days: 3650, keySize: 2048, algorithm: 'sha256' });
  fs.mkdirSync(path.dirname(certPath), { recursive: true });
  fs.mkdirSync(path.dirname(keyPath), { recursive: true });
  fs.writeFileSync(certPath, pems.cert);
  fs.writeFileSync(keyPath, pems.private);
  return { cert: pems.cert, key: pems.private };
}
