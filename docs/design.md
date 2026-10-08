# Muninn: design

Conceito: **livro de horas**. De dia, velino com rubrica vermelha (tema claro, "Rubrica"). De noite, velino negro com rubrica em ouro (tema escuro, "Cinco Cabeças"). Mesma estrutura, mesmos componentes; o que muda é a tinta.

Tokens prontos em `src/styles/tokens.css`. Nunca usar cor literal em componente: sempre `var(--token)`.

## Papéis de cor

| Token | Claro | Escuro | Usado em |
| --- | --- | --- | --- |
| `--rubric` | vermelho #8C1C13 | ouro #D6B270 | nome do card, títulos, filete afinado, capitular, item ativo da navegação, barras do stat block |
| `--gilt` | dourado #B08D57 | latão #8C7445 | moldura do retrato, borda de chips e de controles |
| `--secret` | índigo #3B3486 | lavanda #A99CF0 | tudo que é "só o mestre": bloco secreto, cadeado, botão Revelar |
| `--type-*` | 5 cores | 5 cores | código de tipo do card (abaixo) |

Cor por tipo (sempre acompanhada de texto, nunca só a cor):

| Tipo (enum) | Rótulo | Cor |
| --- | --- | --- |
| `npc` | NPC | vermelho |
| `location` | Local | azul |
| `faction` | Facção | verde |
| `item` | Item | branco/cinza |
| `document` | Documento | negro/ônix |

Cada tipo tem três tokens: `--type-X` (ponto e barra), `--type-X-text` (texto do chip) e `--type-X-bg` (fundo do chip).

## Tipografia

- **Alegreya** (serifada, caligráfica) para nomes, títulos e texto de conteúdo.
- **Alegreya Sans** para interface: botões, navegação, rótulos, campos.
- Nome do card: Alegreya 800, `--text-name` (48px) no celular e `--text-name-lg` (58px) no desktop.
- Títulos de seção: Alegreya 700, cor `--rubric`.
- Corpo: Alegreya 400, 17–18px, entrelinha 1.55, no máximo ~75 caracteres por linha.
- Textos de interface em pt-BR, sentence case. Nada de rótulo todo em maiúsculas.

## Componentes

1. **Cabeçalho do card**, de cima pra baixo:
   - barra de 5 segmentos (4px): o tipo do card aceso e mais largo (flex 2), os outros quatro com 28% de opacidade;
   - nome em `--rubric`;
   - linha de tipo em itálico com um ponto da cor do tipo: "NPC, goblin artífice";
   - filete afinado: SVG `polygon points="0,0 W,H/2 0,H"` preenchido com `--rubric`, 8–9px de altura, largura total.
2. **Capitular** no primeiro parágrafo do card: Alegreya 800, ~3.4em, `--rubric`, float à esquerda.
3. **Retrato**: fundo `--inset`, borda 1px `--gilt` e segunda linha interna via `box-shadow: inset 0 0 0 5px var(--surface), inset 0 0 0 6px var(--gilt)`. Sem imagem: texto "[retrato]" em itálico.
4. **Seção de bloco**: título + rótulo de visibilidade à direita (ícone de olho + "Grupo, desde a sessão N", `--muted`).
5. **Bloco secreto** (só o mestre vê): fundo `--secret-bg`, borda 1.5px tracejada `--secret`, título em `--secret`, rótulo com cadeado "Só o mestre", botão "Revelar ao grupo" (fundo `--secret`, texto `--on-secret`).
6. **Stat block de regra**: fundo `--raised`, barras de `--rule-bar` em `--rubric` em cima e embaixo, título em Alegreya 800 `--rubric`, subtítulo em itálico ("Ação, opção do ataque desarmado"), filete afinado, parágrafos com rótulo corrido em negrito itálico ("**_Quem tenta._** Precisa de uma mão livre…"), linha "Fonte: SRD 5.2.1".
7. **Chip de tipo**: pílula 24–28px, ponto `--type-X` + texto `--type-X-text` sobre `--type-X-bg`.
8. **Chip de sessão**: pílula com borda `--gilt`, altura mínima `--touch`.
9. **Navegação**:
   - celular: barra inferior com 4 abas (Grimório, Sessões, Regras, Buscar), ícone + rótulo, ativa em `--rubric`;
   - desktop (mestre): barra lateral com Cards, Sessões, Regras, Handouts e, abaixo, "Filtrar por tipo" com o ponto de cada cor.
10. **Topo do mestre (Escudo)**: "Muninn" em Alegreya 800 `--rubric`, nome da campanha, busca ("Buscar cards e regras", dica "Ctrl K"), sessão atual, botão de tema (lua no claro, sol no escuro) e o interruptor "Grimório aberto" (`role="switch"`, trilho `--rubric`).

## Telas de referência

- **Grimório no celular (player, sem login)**: topo com voltar, nome da campanha, tema e busca; card do NPC (cabeçalho, retrato, capitular, seções reveladas, "Aparece em" com chips de sessão); barra inferior de 4 abas.
- **Tela do mestre (desktop)**: topo do mestre; três colunas que quebram em uma no celular (`flex-wrap`): navegação (~200px), card (flex 999 1 560px) e "Regras fixadas" (~300px) com stat blocks. O card mostra também os blocos secretos, as relações com seu chip de tipo e o estado de visibilidade, mais os botões "Ver como player" e "Editar".

## Regras

- Sem gradiente, sem sombra decorativa, sem card com borda só à esquerda, sem emoji.
- Hierarquia de raio: card 6px, controle 8px, pílula 999px.
- Alvo de toque ≥ 44px; foco visível (outline 2px `--focus`, offset 2px).
- Contraste: os tokens já passam 4.5:1 pra texto; não inventar cinzas novos.
- `prefers-reduced-motion` respeitado; movimento só como resposta a uma ação.
- Tema: preferência salva > `prefers-color-scheme`. Aplicar `data-theme` no `<html>` por script inline no `index.html`, antes do primeiro paint, pra não piscar.
- Nunca usar logo, arte ou fonte oficial de D&D. A cara de livro vem das convenções de diagramação.
