import { useCallback, useEffect, useState } from 'react';

/**
 * Carga assincrona com estados de loading/erro e recarga manual.
 * Uso: const { dados, carregando, erro, recarregar } = usarDados(listarChamados, []);
 */
export function usarDados(consulta, deps = [], inicial = null) {
  const [dados, setDados] = useState(inicial);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const executar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setDados(await consulta());
    } catch (e) {
      setErro(traduzir(e));
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { executar(); }, [executar]);

  return { dados, carregando, erro, recarregar: executar, definir: setDados };
}

/** Mensagens do Postgres/Supabase em linguagem de usuario. */
export function traduzir(e) {
  const m = e?.message || String(e);
  const codigo = e?.code || '';

  // mensagens que o proprio app escreveu (ja estao em portugues)
  if (e?.amigavel) return m;

  if (/Failed to fetch|NetworkError|network request failed/i.test(m)) {
    return 'Sem conexão com o servidor. Verifique sua internet.';
  }
  if (codigo === 'PGRST116' || /multiple \(or no\) rows|0 rows/i.test(m)) {
    return 'Registro não encontrado ou fora do seu acesso.';
  }
  if (/JWT|token is expired|Invalid Refresh Token|session.*(expired|missing)/i.test(m)) {
    return 'Sua sessão expirou. Entre novamente.';
  }
  if (/Invalid login credentials/i.test(m)) {
    return 'E-mail ou senha incorretos.';
  }
  if (/Email not confirmed/i.test(m)) {
    return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
  }
  if (/relation .* does not exist|schema cache|Could not find the (table|column)|PGRST20[0-9]/i.test(m)) {
    return 'Banco de dados ainda não configurado. Fale com o administrador da Fonsetech.';
  }
  if (/permission denied|not authorized|insufficient/i.test(m)) {
    return 'Você não tem permissão para esta operação.';
  }
  if (/row-level security|violates row-level/i.test(m)) {
    return 'Você não tem permissão para esta operação.';
  }
  if (/duplicate key|already exists/i.test(m)) {
    return 'Este registro já existe.';
  }
  if (/violates foreign key/i.test(m)) {
    return 'Registro relacionado não encontrado.';
  }
  if (/check constraint/i.test(m)) {
    return 'Dados inconsistentes. Revise os campos obrigatórios.';
  }
  if (/not null|null value in column/i.test(m)) {
    return 'Preencha todos os campos obrigatórios.';
  }
  // nada reconhecido: mensagem generica, detalhe tecnico so no console
  console.warn('[fonsetech] erro nao mapeado:', m);
  return 'Não foi possível concluir a operação. Tente novamente ou fale com o suporte.';
}
