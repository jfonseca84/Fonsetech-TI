import { describe, expect, it } from 'vitest';
import { dataBR, iniciais } from './tokens.js';

describe('dataBR', () => {
  it('formata data ISO para o padrao brasileiro', () => {
    expect(dataBR('2026-03-05T10:00:00.000Z')).toBe(new Date('2026-03-05T10:00:00.000Z').toLocaleDateString('pt-BR'));
  });

  it('retorna travessao quando nao ha data', () => {
    expect(dataBR(null)).toBe('—');
    expect(dataBR(undefined)).toBe('—');
    expect(dataBR('')).toBe('—');
  });
});

describe('iniciais', () => {
  it('usa a primeira letra do primeiro e do ultimo nome', () => {
    expect(iniciais('Marina Ribeiro')).toBe('MR');
  });

  it('funciona com nome unico', () => {
    expect(iniciais('Marina')).toBe('M');
  });

  it('ignora espacos extras e usa maiusculas', () => {
    expect(iniciais('  joão   fonseca  ')).toBe('JF');
  });

  it('retorna travessao duplo quando nao ha nome', () => {
    expect(iniciais('')).toBe('--');
    expect(iniciais(null)).toBe('--');
  });
});
