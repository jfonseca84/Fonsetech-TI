import { mockStorage } from './mockStore.js';

const listeners = new Set();

function emitirAuth(evento, session) {
  listeners.forEach((cb) => {
    try {
      cb(evento, session);
    } catch {
      // Ignora erro de listener
    }
  });
}

function obterSessaoSalva() {
  try {
    const raw = localStorage.getItem('fs_demo_session');
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignora
  }
  return null;
}

function salvarSessao(session) {
  try {
    if (session) {
      localStorage.setItem('fs_demo_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('fs_demo_session');
    }
  } catch {
    // Ignora
  }
}

class MockQueryBuilder {
  constructor(tabela) {
    this.tabela = tabela;
    this.filtros = [];
    this.ordenacao = null;
    this.limite = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.operacao = 'select';
    this.dadosOperacao = null;
    this.camposSelect = '*';
  }

  select(campos = '*') {
    this.camposSelect = campos;
    return this;
  }

  insert(dados) {
    this.operacao = 'insert';
    this.dadosOperacao = dados;
    return this;
  }

  update(campos) {
    this.operacao = 'update';
    this.dadosOperacao = campos;
    return this;
  }

  delete() {
    this.operacao = 'delete';
    return this;
  }

  upsert(dados) {
    this.operacao = 'upsert';
    this.dadosOperacao = dados;
    return this;
  }

  eq(campo, valor) {
    this.filtros.push({ tipo: 'eq', campo, valor });
    return this;
  }

  in(campo, valores) {
    this.filtros.push({ tipo: 'in', campo, valores: Array.isArray(valores) ? valores : [valores] });
    return this;
  }

  order(campo, { ascending = true } = {}) {
    this.ordenacao = { campo, ascending };
    return this;
  }

  limit(qtd) {
    this.limite = qtd;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  _executar() {
    const colecao = mockStorage.obterColecao(this.tabela);

    if (this.operacao === 'insert') {
      const novos = Array.isArray(this.dadosOperacao) ? this.dadosOperacao : [this.dadosOperacao];
      const inseridos = novos.map((item, idx) => {
        const id = item.id || `${this.tabela}-${Date.now()}-${idx}`;
        const obj = { ...item, id };
        if (this.tabela === 'chamados') {
          obj.numero = obj.numero || Math.floor(1000 + Math.random() * 9000);
          obj.aberto_em = obj.aberto_em || new Date().toISOString();
          obj.status = obj.status || 'Aberto';
        }
        if (this.tabela === 'chamado_historico') {
          obj.criado_em = obj.criado_em || new Date().toISOString();
        }
        colecao.unshift(obj);
        return obj;
      });
      mockStorage.salvar();
      const res = this.isSingle ? this._enriquecer(inseridos[0]) : inseridos.map(i => this._enriquecer(i));
      return { data: res, error: null };
    }

    if (this.operacao === 'update') {
      let afetados = 0;
      let primeiro = null;
      colecao.forEach((item, i) => {
        const atende = this._testarFiltros(item);
        if (atende) {
          colecao[i] = { ...item, ...this.dadosOperacao };
          if (!primeiro) primeiro = colecao[i];
          afetados++;
        }
      });
      mockStorage.salvar();
      const res = this.isSingle ? (primeiro ? this._enriquecer(primeiro) : null) : null;
      return { data: res, error: null, count: afetados };
    }

    if (this.operacao === 'upsert') {
      const item = this.dadosOperacao;
      const idx = colecao.findIndex(i =>
        (item.slug && i.slug === item.slug) ||
        (item.chave && i.chave === item.chave) ||
        (item.id && i.id === item.id)
      );
      if (idx >= 0) {
        colecao[idx] = { ...colecao[idx], ...item };
      } else {
        colecao.push(item);
      }
      mockStorage.salvar();
      const res = this.isSingle ? this._enriquecer(item) : [this._enriquecer(item)];
      return { data: res, error: null };
    }

    if (this.operacao === 'delete') {
      const filtrados = colecao.filter(item => !this._testarFiltros(item));
      const apagados = colecao.length - filtrados.length;
      colecao.length = 0;
      colecao.push(...filtrados);
      mockStorage.salvar();
      return { data: null, error: null, count: apagados };
    }

    // SELECT
    let resultado = colecao.filter(item => this._testarFiltros(item));

    if (this.ordenacao) {
      const { campo, ascending } = this.ordenacao;
      resultado.sort((a, b) => {
        const valA = a[campo];
        const valB = b[campo];
        if (valA == null && valB == null) return 0;
        if (valA == null) return ascending ? 1 : -1;
        if (valB == null) return ascending ? -1 : 1;
        if (typeof valA === 'string') {
          return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    if (this.limite != null) {
      resultado = resultado.slice(0, this.limite);
    }

    const enriquecidos = resultado.map(item => this._enriquecer(item));

    if (this.isSingle) {
      if (enriquecidos.length === 0) {
        return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
      }
      return { data: enriquecidos[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: enriquecidos[0] || null, error: null };
    }

    return { data: enriquecidos, error: null };
  }

  _testarFiltros(item) {
    return this.filtros.every(f => {
      if (f.tipo === 'eq') {
        return item[f.campo] === f.valor;
      }
      if (f.tipo === 'in') {
        return f.valores.includes(item[f.campo]);
      }
      return true;
    });
  }

  _enriquecer(item) {
    if (!item) return item;
    const clone = { ...item };

    if (this.tabela === 'chamados') {
      const empresa = mockStorage.empresas.find(e => e.id === clone.empresa_id);
      clone.empresas = empresa ? { id: empresa.id, razao_social: empresa.razao_social } : null;

      const maquina = mockStorage.maquinas.find(m => m.id === clone.maquina_id);
      clone.maquinas = maquina ? { id: maquina.id, nome: maquina.nome, usuario: maquina.usuario } : null;

      const resp = mockStorage.profiles.find(p => p.id === clone.responsavel_id);
      clone.responsavel = resp ? { id: resp.id, nome: resp.nome } : null;

      const autor = mockStorage.profiles.find(p => p.id === clone.aberto_por);
      clone.autor = autor ? { id: autor.id, nome: autor.nome } : null;
    }

    if (this.tabela === 'profiles') {
      const empresa = mockStorage.empresas.find(e => e.id === clone.empresa_id);
      clone.empresas = empresa ? { id: empresa.id, razao_social: empresa.razao_social, plano: empresa.plano } : null;
    }

    if (this.tabela === 'maquinas' || this.tabela === 'agendamentos' || this.tabela === 'financeiro_lancamentos' || this.tabela === 'crm_propostas') {
      const empresa = mockStorage.empresas.find(e => e.id === clone.empresa_id);
      clone.empresas = empresa ? { id: empresa.id, razao_social: empresa.razao_social, nome_fantasia: empresa.nome_fantasia, plano: empresa.plano, whatsapp: empresa.whatsapp } : null;
    }

    if (this.tabela === 'crm_leads' && clone.empresa_id) {
      const empresa = mockStorage.empresas.find(e => e.id === clone.empresa_id);
      clone.empresas = empresa ? { id: empresa.id, razao_social: empresa.razao_social } : null;
    }

    if (this.tabela === 'crm_propostas' && clone.lead_id) {
      const lead = mockStorage.crm_leads.find(l => l.id === clone.lead_id);
      clone.lead = lead ? { id: lead.id, nome: lead.nome, empresa_nome: lead.empresa_nome } : null;
    }

    if (this.tabela === 'chamado_historico') {
      const chamado = mockStorage.chamados.find(c => c.id === clone.chamado_id);
      clone.chamados = chamado ? { numero: chamado.numero } : null;
    }

    return clone;
  }

  then(resolve, reject) {
    try {
      const res = this._executar();
      return Promise.resolve(res).then(resolve, reject);
    } catch (e) {
      return Promise.reject(e).then(resolve, reject);
    }
  }
}

export function criarClienteMock() {
  return {
    auth: {
      async getSession() {
        const session = obterSessaoSalva();
        return { data: { session }, error: null };
      },
      async getUser() {
        const session = obterSessaoSalva();
        return { data: { user: session?.user || null }, error: null };
      },
      async signInWithPassword({ email }) {
        const e = (email || '').trim().toLowerCase();
        let perfil = mockStorage.profiles.find(p => p.email && p.email.toLowerCase() === e);
        if (!perfil) {
          if (e.includes('admin') || e === 'admin@fonsetech.com.br') {
            perfil = mockStorage.profiles[0];
          } else {
            perfil = mockStorage.profiles[1] || mockStorage.profiles[0];
          }
        }
        const user = {
          id: perfil.id,
          email: perfil.email,
          user_metadata: { nome: perfil.nome }
        };
        const session = {
          access_token: 'mock-token-' + Date.now(),
          user
        };
        salvarSessao(session);
        emitirAuth('SIGNED_IN', session);
        return { data: { user, session }, error: null };
      },
      async signOut() {
        salvarSessao(null);
        emitirAuth('SIGNED_OUT', null);
        return { error: null };
      },
      onAuthStateChange(callback) {
        listeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe() {
                listeners.delete(callback);
              }
            }
          }
        };
      },
      async resetPasswordForEmail() {
        return { data: {}, error: null };
      }
    },
    from(tabela) {
      return new MockQueryBuilder(tabela);
    },
    storage: {
      from(_bucket) {
        return {
          async createSignedUrl(caminho) {
            const fileName = caminho ? caminho.split('/').pop() : 'arquivo.pdf';
            return { data: { signedUrl: `/imagens/${fileName}` }, error: null };
          },
          getPublicUrl(caminho) {
            const fileName = caminho ? caminho.split('/').pop() : 'imagem.jpg';
            return { data: { publicUrl: `/imagens/${fileName}` } };
          },
          async upload(caminho) {
            return { data: { path: caminho }, error: null };
          },
          async remove() {
            return { data: {}, error: null };
          }
        };
      }
    }
  };
}
