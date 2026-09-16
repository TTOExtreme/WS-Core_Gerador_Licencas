import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { resolverCaminhosCert } from '../Certificado';

describe('resolverCaminhosCert', () => {
  const base = path.join('C:', 'app', 'config');

  it('resolve caminhos relativos contra o baseDir (estável, independe do cwd)', () => {
    const r = resolverCaminhosCert({ Cert: 'licenciamento.crt', Key: 'licenciamento.key' }, base);
    expect(r.Cert).toBe(path.resolve(base, 'licenciamento.crt'));
    expect(r.Key).toBe(path.resolve(base, 'licenciamento.key'));
  });

  it('resolve o prefixo ./Certs contra o baseDir', () => {
    const r = resolverCaminhosCert({ Cert: './Certs/licenciamento.crt', Key: './Certs/licenciamento.key' }, base);
    expect(r.Cert).toBe(path.resolve(base, './Certs/licenciamento.crt'));
    expect(r.Key).toBe(path.resolve(base, './Certs/licenciamento.key'));
  });

  it('mantém caminhos absolutos intactos', () => {
    const abs = path.join('D:', 'certs', 'x.crt');
    const absK = path.join('D:', 'certs', 'x.key');
    const r = resolverCaminhosCert({ Cert: abs, Key: absK }, base);
    expect(r.Cert).toBe(abs);
    expect(r.Key).toBe(absK);
  });
});
