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
  if (/Failed to fetch|NetworkError/i.test(m)) {
    return 'Sem conexão com o servidor. Verifique sua internet.';
  }
  return m;
}
