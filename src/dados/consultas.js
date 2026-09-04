import { supabase } from '../lib/supabase.js';

/**
 * Camada de acesso. Nenhuma consulta filtra por empresa manualmente:
 * quem limita o escopo e o RLS no Supabase. O frontend so pede os dados.
 */

// ---------- CHAMADOS ----------
const CAMPOS_CHAMADO = `
  id, numero, titulo, categoria, descricao, prioridade, status,
  aberto_em, resolvido_em, usuario_equipamento, equipamento_livre,
  empresa_id, maquina_id, responsavel_id,
  empresas ( id, razao_social ),
  maquinas ( id, nome, usuario ),
  responsavel:profiles!chamados_responsavel_id_fkey ( id, nome ),
  autor:profiles!chamados_aberto_por_fkey ( id, nome )
`;

export async function listarChamados() {
  const { data, error } = await supabase
    .from('chamados').select(CAMPOS_CHAMADO).order('aberto_em', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function abrirChamado(dados) {
  const { data, error } = await supabase.from('chamados').insert(dados).select(CAMPOS_CHAMADO).single();
  if (error) throw error;
  return data;
}

export async function atualizarChamado(id, campos) {
  const { data, error } = await supabase
    .from('chamados').update(campos).eq('id', id).select(CAMPOS_CHAMADO).single();
  if (error) throw error;
  return data;
}

// ---------- HISTORICO ----------
export async function listarHistorico(chamadoId) {
  const { data, error } = await supabase
    .from('chamado_historico')
    .select('id, texto, autor_nome, interno, criado_em')
    .eq('chamado_id', chamadoId)
    .order('criado_em', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function comentar(chamadoId, autorId, autorNome, texto, interno = false) {
  const { data, error } = await supabase
    .from('chamado_historico')
    .insert({ chamado_id: chamadoId, autor_id: autorId, autor_nome: autorNome, texto, interno })
    .select('id, texto, autor_nome, interno, criado_em')
    .single();
  if (error) throw error;
  return data;
}

/** Ultimas movimentacoes de todos os chamados (painel admin). */
export async function acoesRecentes(limite = 6) {
  const { data, error } = await supabase
    .from('chamado_historico')
    .select('id, texto, autor_nome, criado_em, chamados ( numero )')
    .order('criado_em', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data || [];
}

// ---------- EMPRESAS ----------
export async function listarEmpresas() {
  const { data, error } = await supabase
    .from('empresas')
    .select('id, razao_social, cnpj, endereco, email, telefone, tem_ti_interno, responsavel_ti, gerente_geral, diretor, plano, ativo')
    .order('razao_social');
  if (error) throw error;
  return data || [];
}

export async function salvarEmpresa(id, campos) {
  const { data, error } = await supabase.from('empresas').update(campos).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function criarEmpresa(campos) {
  const { data, error } = await supabase.from('empresas').insert(campos).select().single();
  if (error) throw error;
  return data;
}

// ---------- PERFIS ----------
export async function listarPerfis() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, telefone, role, ativo, empresa_id, empresas ( id, razao_social )')
    .order('nome');
  if (error) throw error;
  return data || [];
}

export async function listarAdmins() {
  const { data, error } = await supabase
    .from('profiles').select('id, nome').eq('role', 'admin').eq('ativo', true).order('nome');
  if (error) throw error;
  return data || [];
}

export async function alternarAtivo(perfilId, ativo) {
  const { error } = await supabase.from('profiles').update({ ativo }).eq('id', perfilId);
  if (error) throw error;
}

// ---------- MAQUINAS ----------
export async function listarMaquinas() {
  const { data, error } = await supabase
    .from('maquinas')
    .select('id, nome, usuario, setor, modelo, cpu, memoria, disco, sistema, rede, ip, mascara, gateway, dns, ativo, empresa_id, empresas ( id, razao_social )')
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return data || [];
}

/** Somente admin: o RLS bloqueia esta tabela para cliente. */
export async function listarAcessoRemoto() {
  const { data, error } = await supabase
    .from('maquinas_acesso_remoto')
    .select('maquina_id, ferramenta, host, login, observacoes');
  if (error) throw error;
  return data || [];
}

export async function criarMaquina(campos, acesso) {
  const { data, error } = await supabase.from('maquinas').insert(campos).select().single();
  if (error) throw error;
  if (acesso && (acesso.host || acesso.login)) {
    const { error: e2 } = await supabase
      .from('maquinas_acesso_remoto')
      .insert({ maquina_id: data.id, ...acesso });
    if (e2) throw e2;
  }
  return data;
}

// ---------- AGENDAMENTOS ----------
export async function listarAgendamentos() {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('id, tipo, data, hora, assunto, endereco, formato, status, empresa_id, empresas ( id, razao_social )')
    .order('data');
  if (error) throw error;
  return data || [];
}

export async function solicitarAgendamento(dados) {
  const { data, error } = await supabase.from('agendamentos').insert(dados).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarAgendamento(id, campos) {
  const { error } = await supabase.from('agendamentos').update(campos).eq('id', id);
  if (error) throw error;
}

// ---------- MATERIAIS ----------
export async function listarMateriais(tipos) {
  let q = supabase
    .from('materiais')
    .select('id, tipo, titulo, descricao, categoria, nivel, paginas, arquivo_path, link_externo, versao, tamanho, sistema, destaque')
    .eq('publicado', true);
  if (tipos) q = q.in('tipo', tipos);
  const { data, error } = await q.order('titulo');
  if (error) throw error;
  return data || [];
}

/** URL assinada temporaria do bucket privado. */
export async function urlAssinada(caminho, segundos = 3600) {
  const { data, error } = await supabase.storage.from('materiais').createSignedUrl(caminho, segundos);
  if (error) throw error;
  return data.signedUrl;
}

// ---------- IMAGENS DA LANDING (Configuracoes do site) ----------
export async function listarSiteImagens() {
  const { data, error } = await supabase
    .from('site_imagens')
    .select('slug, arquivo_path, atualizado_em');
  if (error) throw error;
  return data || [];
}

/** URL publica servida pelo CDN, com ?v= para o navegador nao servir a antiga do cache. */
export function urlPublicaSite(caminho, versao) {
  const { data } = supabase.storage.from('site').getPublicUrl(caminho);
  return data.publicUrl + (versao ? '?v=' + new Date(versao).getTime() : '');
}

/**
 * Envia a imagem de um espaco da landing e registra o caminho.
 * O nome inclui um sufixo de tempo: cada troca gera um arquivo novo, o que
 * evita qualquer chance de cache velho no CDN.
 */
export async function salvarSiteImagem(slug, arquivo, autorId) {
  const ext = (arquivo.name.split('.').pop() || 'jpg').toLowerCase();
  const caminho = `${slug}-${Date.now()}.${ext}`;

  const { error: erroUpload } = await supabase.storage
    .from('site')
    .upload(caminho, arquivo, { cacheControl: '3600', contentType: arquivo.type, upsert: false });
  if (erroUpload) throw erroUpload;

  const anterior = await supabase.from('site_imagens').select('arquivo_path').eq('slug', slug).maybeSingle();

  const { data, error } = await supabase
    .from('site_imagens')
    .upsert({ slug, arquivo_path: caminho, atualizado_em: new Date().toISOString(), atualizado_por: autorId || null })
    .select('slug, arquivo_path, atualizado_em')
    .single();
  if (error) {
    await supabase.storage.from('site').remove([caminho]);
    throw error;
  }

  // limpa o arquivo substituido (falha aqui nao invalida a troca)
  if (anterior.data?.arquivo_path && anterior.data.arquivo_path !== caminho) {
    await supabase.storage.from('site').remove([anterior.data.arquivo_path]);
  }
  return data;
}

/** Volta o espaco para a imagem padrao versionada no repositorio. */
export async function removerSiteImagem(slug) {
  const { data: atual } = await supabase.from('site_imagens').select('arquivo_path').eq('slug', slug).maybeSingle();
  const { error } = await supabase.from('site_imagens').delete().eq('slug', slug);
  if (error) throw error;
  if (atual?.arquivo_path) await supabase.storage.from('site').remove([atual.arquivo_path]);
}
