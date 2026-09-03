# Protótipos de design — referência visual

Estes arquivos `.dc.html` mostram o layout, as cores, os textos e o comportamento
pretendidos de cada tela. **Não são código de produção.**

## Não publique estes arquivos

- não têm autenticação: qualquer pessoa com a URL abre o painel admin
- os dados são constantes no próprio arquivo, entregues ao navegador

## Saneamento aplicado nesta cópia

Os protótipos originais continham senhas de exemplo de acesso remoto
(campo `senhaRemota`) e senhas de demonstração na tela de login.
**Nesta cópia esses valores foram esvaziados** para que nada com aparência
de credencial entre no repositório.

Isso significa que, ao abrir o painel admin daqui, a coluna de senha das
máquinas aparece vazia. É o comportamento esperado — em produção esse dado
vem de `maquinas_acesso_remoto`, cifrado, e só o admin autenticado o lê.

## Regra permanente

As animações da landing page (`Fontesetech TI Landing.dc.html`) estão aprovadas
e não devem ser alteradas: rede de nós no hero reativa ao mouse, reveal das
seções por scroll, tilt 3D nos cards, ripple e contadores.
