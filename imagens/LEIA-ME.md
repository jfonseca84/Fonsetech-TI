# Imagens da landing page

Há dois caminhos, e o normal é o primeiro.

## 1. Pelo painel admin (recomendado, sem deploy)

`/admin` → **Configurações do site**. Envie a imagem de cada espaço; ela entra no
site público na hora, sem republicar nada. O botão *Usar padrão* volta para o
arquivo desta pasta.

Requisitos: ter executado `supabase/migrations/002_site_imagens.sql`.

## 2. Trocando os arquivos padrão desta pasta

São as imagens que aparecem quando o espaço nunca recebeu upload pelo painel.
Substitua o arquivo mantendo o **mesmo nome**, faça commit e push (a Railway
republica sozinha). Mantenha as duas cópias em sincronia: `public/imagens/`
(usada no build) e `imagens/` (usada ao abrir o `index.html` direto).

| Arquivo | Onde aparece | Tamanho recomendado |
|---|---|---|
| `dashboard-notebook.jpg` | mockup grande do hero | 800 × 516 px |
| `dashboard-celular.jpg` | mockup do celular, no hero | 320 × 615 px |
| `plataforma-dashboard.jpg` | moldura da seção "Plataforma própria" | 1200 × 760 px |
| `sobre-fonsetech.jpg` | coluna esquerda da seção "Sobre nós" | 1040 × 1290 px (retrato) |
| `projeto-gestao.jpg` | 1º card do Portfólio | 420 × 384 px |
| `projeto-delivery.jpg` | 2º card do Portfólio | 420 × 384 px |
| `projeto-site.jpg` | 3º card do Portfólio | 420 × 384 px |
| `depoimento-carlos.jpg` | foto redonda do depoimento | 200 × 200 px (quadrada) |

Dicas:

- Use o **dobro** do tamanho exibido (telas retina), JPG qualidade ~80 ou WebP.
  Mire abaixo de 300 KB por arquivo.
- O recorte é `object-fit: cover`: a imagem preenche o espaço e o excesso é cortado —
  centralize o assunto.
- Enquanto nenhum arquivo existir, aparece um bloco cinza com o nome esperado.
- O `data-slug` de cada espaço no `index.html` é o que liga a imagem ao painel
  (mesma lista em `src/dados/espacosImagem.js`). Renomear um exige mudar os três.
