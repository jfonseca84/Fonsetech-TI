import { describe, expect, it } from 'vitest';
import { traduzir } from './usarDados.js';

describe('traduzir', () => {
  it('preserva mensagens ja marcadas como amigaveis pelo proprio app', () => {
    const erro = Object.assign(new Error('Sua conta está inativa.'), { amigavel: true });
    expect(traduzir(erro)).toBe('Sua conta está inativa.');
  });

  it('traduz falha de rede', () => {
    expect(traduzir(new Error('Failed to fetch'))).toBe('Sem conexão com o servidor. Verifique sua internet.');
  });

  it('traduz sessao expirada (JWT)', () => {
    expect(traduzir(new Error('JWT expired'))).toBe('Sua sessão expirou. Entre novamente.');
  });

  it('traduz credenciais invalidas de login', () => {
    expect(traduzir(new Error('Invalid login credentials'))).toBe('E-mail ou senha incorretos.');
  });

  it('traduz violacao de row-level security sem vazar detalhe tecnico', () => {
    expect(traduzir(new Error('new row violates row-level security policy'))).toBe(
      'Você não tem permissão para esta operação.'
    );
  });

  it('traduz registro nao encontrado pelo codigo PGRST116', () => {
    const erro = Object.assign(new Error('multiple (or no) rows returned'), { code: 'PGRST116' });
    expect(traduzir(erro)).toBe('Registro não encontrado ou fora do seu acesso.');
  });

  it('cai na mensagem generica para erros nao mapeados, sem expor a causa tecnica', () => {
    const generica = traduzir(new Error('ORA-00001: unique constraint violated'));
    expect(generica).toBe('Não foi possível concluir a operação. Tente novamente ou fale com o suporte.');
  });
});
