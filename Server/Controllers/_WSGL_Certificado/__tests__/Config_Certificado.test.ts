import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as selfsigned from 'selfsigned';
import { Config_Certificado } from '../Config_Certificado';
import type { Modelo_Config } from '../../../Models/Modelo_Configuracao';

const pem = selfsigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 3650, keySize: 2048, algorithm: 'sha256' }).cert;
const certPath = path.join(os.tmpdir(), `wsgl_export_${process.pid}.crt`);
afterEach(() => { try { fs.unlinkSync(certPath); } catch { /* ignore */ } });

function cfg(p: string): Modelo_Config {
  return { Licenciamento: { Cert: { Cert: p } } } as unknown as Modelo_Config;
}
const bd = {} as never;

describe('Config_Certificado.Exportar', () => {
  it('devolve pem, fingerprint e validade do cert em disco', async () => {
    fs.writeFileSync(certPath, pem);
    const r = await new Config_Certificado(cfg(certPath), bd).Exportar();
    expect(r.pem).toBe(pem);
    expect(r.fingerprint_sha256).toMatch(/^[0-9A-F]{2}(:[0-9A-F]{2})+$/);
    expect(typeof r.validade).toBe('string');
  });
  it('lança { mensagem } quando o cert não existe', async () => {
    await expect(new Config_Certificado(cfg(certPath), bd).Exportar())
      .rejects.toMatchObject({ mensagem: expect.any(String) });
  });
});
