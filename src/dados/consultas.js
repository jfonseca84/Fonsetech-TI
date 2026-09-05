import { supabase, amigavel } from '../lib/supabase.js';

/**
 * Camada de acesso. Nenhuma consulta filtra por empresa manualmente:
 * quem limita o escopo e o RLS no Supabase. O frontend so pede os dados.
 */

// ---------- CHAMADOS ----------
const CAMPOS_CHAMADO = `
  id, numero, titulo, categoria, descricao, prioridade, status,
  aberto_em, resolvido_em, usuario_equipamento, equipamento_livre,
  empresa_id, maquina_id, responsavel_id,
  empresas (
    id, razao_social, telefone, whatsapp, endereco, cidade, estado, plano, status_cliente,
    responsavel_nome, responsavel_cargo, responsavel_email, responsavel_whatsapp
  ),
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

// ---------- ANEXOS DO CHAMADO ----------
export async function listarAnexosChamado(chamadoId) {
  const { data, error } = await supabase
    .from('chamado_anexos')
    .select('id, arquivo_path, nome_original, tamanho, tipo, criado_em')
    .eq('chamado_id', chamadoId)
    .order('criado_em');
  if (error) throw error;
  return data || [];
}

/** Envia um arquivo para o bucket privado e registra o anexo do chamado. */
export async function enviarAnexoChamado(chamadoId, arquivo, autorId) {
  const nomeSeguro = arquivo.name.replace(/[^\w.-]+/g, '_');
  const caminho = `${chamadoId}/${Date.now()}-${nomeSeguro}`;

  const { error: erroUpload } = await supabase.storage.from('chamados-anexos').upload(caminho, arquivo);
  if (erroUpload) throw erroUpload;

  const { error } = await supabase.from('chamado_anexos').insert({
    chamado_id: chamadoId,
    arquivo_path: caminho,
    nome_original: arquivo.name,
    tamanho: arquivo.size,
    tipo: arquivo.type,
    enviado_por: autorId
  });
  if (error) throw error;
}

/** URL assinada temporaria do bucket privado de anexos de chamado. */
export async function urlAnexoChamado(caminho, segundos = 3600) {
  const { data, error } = await supabase.storage.from('chamados-anexos').createSignedUrl(caminho, segundos);
  if (error) throw error;
  return data.signedUrl;
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
    .select('*')
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

export async function excluirEmpresa(id) {
  const { error } = await supabase.from('empresas').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ---------- PERFIS E USUARIOS DA EMPRESA ----------
export async function listarPerfis() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, email, telefone, whatsapp, cargo, role, ativo, empresa_id, empresas ( id, razao_social, nome_fantasia )')
    .order('nome');
  if (error) throw error;
  return data || [];
}

export async function listarUsuariosEmpresa(empresaId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, email, telefone, whatsapp, cargo, role, ativo, empresa_id')
    .eq('empresa_id', empresaId)
    .order('nome');
  if (error) throw error;
  return data || [];
}

/**
 * Cria o login de verdade (usuario + senha no Supabase Auth) e o perfil
 * vinculado, via rota de servidor — o navegador nunca tem a service_role
 * key, entao criar um usuario com senha so pode acontecer no backend.
 * Ver POST /api/admin/criar-usuario em server.js e a RPC
 * criar_perfil_cliente em supabase/migrations/006_login_clientes.sql.
 */
export async function criarUsuarioEmpresa(dados) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw amigavel('Sua sessão expirou. Entre novamente para cadastrar o usuário.');
  }

  const resposta = await fetch('/api/admin/criar-usuario', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      nome: dados.nome,
      email: dados.email,
      password: dados.password,
      telefone: dados.telefone || null,
      whatsapp: dados.whatsapp || null,
      cargo: dados.cargo || null,
      empresaId: dados.empresa_id,
      role: dados.role || 'cliente'
    })
  });

  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw amigavel(corpo.error?.message || 'Não foi possível criar o usuário.');
  }
  return corpo;
}

export async function atualizarUsuarioEmpresa(id, campos) {
  const { data, error } = await supabase
    .from('profiles')
    .update(campos)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function redefinirSenhaUsuario(email) {
  if (supabase?.auth?.resetPasswordForEmail) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }
  return true;
}

// ---------- PLANOS ----------
export async function listarPlanos() {
  const { data, error } = await supabase
    .from('planos')
    .select('*')
    .order('valor_mensal');
  if (error) throw error;
  return data || [];
}

export async function criarPlano(campos) {
  const { data, error } = await supabase.from('planos').insert(campos).select().single();
  if (error) throw error;
  return data;
}

export async function salvarPlano(id, campos) {
  const { data, error } = await supabase.from('planos').update(campos).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ---------- CRM / FUNIL DE VENDAS ----------
export async function listarCrmLeads() {
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*, empresas(id, razao_social)')
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function criarCrmLead(campos) {
  const { data, error } = await supabase.from('crm_leads').insert(campos).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarCrmLead(id, campos) {
  const { data, error } = await supabase
    .from('crm_leads')
    .update({ ...campos, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function excluirCrmLead(id) {
  const { error } = await supabase.from('crm_leads').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function converterLeadEmCliente(leadId, dadosExtras = {}) {
  const { data: lead, error: eLead } = await supabase.from('crm_leads').select('*').eq('id', leadId).single();
  if (eLead) throw eLead;

  // 1. Cria a empresa a partir do Lead
  const dadosEmpresa = {
    razao_social: dadosExtras.razao_social || lead.empresa_nome || lead.nome,
    nome_fantasia: dadosExtras.nome_fantasia || lead.empresa_nome || lead.nome,
    cnpj: dadosExtras.cnpj || '',
    telefone: dadosExtras.telefone || lead.telefone || '',
    whatsapp: dadosExtras.whatsapp || lead.whatsapp || '',
    email: dadosExtras.email || lead.email || '',
    responsavel_nome: lead.nome,
    responsavel_email: lead.email,
    responsavel_whatsapp: lead.whatsapp,
    plano: dadosExtras.plano || 'Profissional',
    valor_mensal: dadosExtras.valor_mensal || lead.valor_estimado || 599.00,
    status_cliente: 'Ativo',
    situacao_financeira: 'Em dia',
    ativo: true,
    inicio_contrato: new Date().toISOString().split('T')[0]
  };

  const { data: novaEmpresa, error: eEmp } = await supabase.from('empresas').insert(dadosEmpresa).select().single();
  if (eEmp) throw eEmp;

  // 2. Atualiza o lead como Ganho e vincula a empresa criada
  await supabase.from('crm_leads').update({
    etapa: 'ganho',
    empresa_id: novaEmpresa.id,
    probabilidade: 100
  }).eq('id', leadId);

  // O login do responsavel (usuario + senha) e criado depois, na tela da
  // empresa ("Novo usuario") — criar_usuario_empresa exige uma senha e so
  // pode ser feito via /api/admin/criar-usuario (precisa da service_role
  // key), o que essa conversao automatica de lead nao tem como fornecer.
  return novaEmpresa;
}

// ---------- PROPOSTAS COMERCIAIS ----------
export async function listarPropostas(leadId = null) {
  let q = supabase
    .from('crm_propostas')
    .select('*, empresas(id, razao_social), crm_leads(id, nome, empresa_nome)');
  if (leadId) q = q.eq('lead_id', leadId);
  const { data, error } = await q.order('criado_em', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function criarProposta(campos) {
  const { data, error } = await supabase.from('crm_propostas').insert(campos).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarProposta(id, campos) {
  const { data, error } = await supabase.from('crm_propostas').update(campos).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function excluirProposta(id) {
  const { error } = await supabase.from('crm_propostas').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ---------- FINANCEIRO ----------
export async function listarLancamentosFinanceiros(empresaId = null) {
  let q = supabase
    .from('financeiro_lancamentos')
    .select('*, empresas(id, razao_social, nome_fantasia, plano, whatsapp)')
    .order('data_vencimento', { ascending: false });
  if (empresaId) q = q.eq('empresa_id', empresaId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function criarLancamentoFinanceiro(campos) {
  const { data, error } = await supabase.from('financeiro_lancamentos').insert(campos).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarLancamentoFinanceiro(id, campos) {
  const { data, error } = await supabase.from('financeiro_lancamentos').update(campos).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function excluirLancamentoFinanceiro(id) {
  const { error } = await supabase.from('financeiro_lancamentos').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ---------- AUDITORIA ----------
export async function registrarAuditoria({ usuarioNome, empresaId, acao, recurso, recursoId = null, resultado = 'sucesso', detalhes = {} }) {
  try {
    await supabase.from('auditoria_logs').insert({
      usuario_nome: usuarioNome || 'Sistema',
      empresa_id: empresaId || null,
      acao,
      recurso,
      recurso_id: recursoId ? String(recursoId) : null,
      resultado,
      detalhes
    });
  } catch {
    // Ignora erro silencioso de log
  }
}

export async function listarAuditoria(limite = 20) {
  const { data, error } = await supabase
    .from('auditoria_logs')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(limite);
  if (error) return [];
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

/** Máquinas de uma única empresa — usado no painel lateral do chamado. */
export async function listarMaquinasEmpresa(empresaId) {
  const { data, error } = await supabase
    .from('maquinas')
    .select('id, nome, usuario, setor')
    .eq('empresa_id', empresaId)
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

/**
 * Grava (ou atualiza) o acesso remoto com a senha ja cifrada no banco via
 * RPC — a senha em texto puro trafega apenas nesta chamada e nunca fica
 * armazenada sem cifra. Ver supabase/migrations/002_cifra_acesso_remoto.sql.
 */
export async function salvarAcessoRemoto({ maquinaId, ferramenta, host, login, senha, observacoes }) {
  const { error } = await supabase.rpc('salvar_acesso_remoto', {
    p_maquina_id: maquinaId,
    p_ferramenta: ferramenta || 'AnyDesk',
    p_host: host || null,
    p_login: login || null,
    p_senha: senha || null,
    p_observacoes: observacoes || null
  });
  if (error) throw error;
}

/** Somente admin: revela a senha decifrada sob demanda (nunca em listagens). */
export async function obterSenhaAcessoRemoto(maquinaId) {
  const { data, error } = await supabase.rpc('obter_senha_acesso_remoto', { p_maquina_id: maquinaId });
  if (error) throw error;
  return data;
}

// ---------- AGENDAMENTOS ----------
export async function listarAgendamentos() {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('id, tipo, data, hora, duracao_minutos, assunto, endereco, formato, modalidade, status, contato_nome, contato_whatsapp, observacoes, cobranca_tipo, cobranca_valor, empresa_id, empresas ( id, razao_social, nome_fantasia, whatsapp )')
    .order('data', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function solicitarAgendamento(dados) {
  const { data, error } = await supabase.from('agendamentos').insert(dados).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarAgendamento(id, campos) {
  const { data, error } = await supabase.from('agendamentos').update(campos).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function excluirAgendamento(id) {
  const { error } = await supabase.from('agendamentos').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ---------- MATERIAIS ----------
export async function listarMateriais(tipos) {
  let q = supabase
    .from('materiais')
    .select('id, tipo, titulo, descricao, categoria, nivel, paginas, arquivo_path, link_externo, versao, tamanho, sistema, destaque, disponibilidade, plano_minimo, empresa_id, ordem')
    .eq('publicado', true);
  if (tipos) q = q.in('tipo', tipos);
  const { data, error } = await q.order('ordem', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function listarMateriaisAdmin() {
  const { data, error } = await supabase
    .from('materiais')
    .select('*')
    .order('ordem', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function criarMaterialAdmin(campos) {
  const { data, error } = await supabase.from('materiais').insert(campos).select().single();
  if (error) throw error;
  return data;
}

export async function salvarMaterialAdmin(id, campos) {
  const { data, error } = await supabase.from('materiais').update(campos).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function excluirMaterialAdmin(id) {
  const { error } = await supabase.from('materiais').delete().eq('id', id);
  if (error) throw error;
  return true;
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

// ---------- CONFIGURACOES DE TEXTO DA LANDING (chave/valor) ----------
export async function obterConfigSite(chave) {
  const { data, error } = await supabase.from('site_config').select('valor').eq('chave', chave).maybeSingle();
  if (error) throw error;
  return data?.valor || '';
}

export async function salvarConfigSite(chave, valor, autorId) {
  const { error } = await supabase
    .from('site_config')
    .upsert({ chave, valor: valor || null, atualizado_em: new Date().toISOString(), atualizado_por: autorId || null });
  if (error) throw error;
}
