# Importador JSON

Em **Cards > Importar** (só o mestre), cole o JSON ou escolha o arquivo, clique em **Conferir**, leia a prévia e clique em **Importar**.

Regras:

- **Nada é apagado nem sobrescrito.** Card com o mesmo nome de um que já existe (sem diferenciar maiúscula ou acento) mantém o cabeçalho e só ganha os blocos cujo título ele ainda não tem. Relação que já existe é ignorada.
- **Tudo nasce "Só o mestre"**, a não ser que o JSON diga `"visibility": "party"`.
- Relações podem apontar pra cards do próprio JSON ou que já estão na campanha, pelo nome.
- Erro em qualquer parte barra a importação inteira, com a lista do que corrigir.

## Formato

```json
{
  "cards": [
    {
      "type": "npc",
      "name": "Frickz",
      "summary": "goblin artífice",
      "tags": ["goblin", "artífice"],
      "visibility": "party",
      "blocks": [
        { "title": "Oficina", "body": "Melhorou o equipamento do grupo.", "visibility": "party" },
        { "title": "Segredo", "body": "Pode ter sido da banda goblin." }
      ]
    },
    { "type": "faction", "name": "Banda goblin", "summary": "fugindo do Culto do Dragão" }
  ],
  "links": [
    { "from": "Frickz", "label": "ex-integrante de", "to": "Banda goblin" }
  ]
}
```

| Campo | Obrigatório | O que é |
| --- | --- | --- |
| `cards[].type` | sim | `npc`, `location`, `faction`, `item` ou `document`. Também aceita `NPC`, `Local`, `Facção`, `Item`, `Documento`. |
| `cards[].name` | sim | Nome do card. É a chave pra achar card existente e pras relações. |
| `cards[].summary` | não | Curto: aparece ao lado do tipo ("goblin artífice"). |
| `cards[].tags` | não | Lista de textos. |
| `cards[].visibility` | não | `dm` (padrão) ou `party`. Só vale pra card novo. |
| `cards[].blocks[]` | não | `title`, `body` (Markdown) e `visibility` (`dm` padrão). |
| `links[]` | não | `from`, `label`, `to` (nomes de cards) e `visibility` (`dm` padrão). Lê-se "from label to". |

Missões e lore entram como `document` com uma tag (`"tags": ["missão"]`), como no escopo.

## Prompt pro projeto do Claude

Cole isto junto com o doc da sessão:

> Converta as minhas anotações abaixo para o formato JSON do Muninn (descrito a seguir) e responda só com o JSON.
> Um card por NPC, local, facção, item ou documento importante. `summary` é um epíteto curto. Cada informação vira um bloco com título curto.
> Marque `"visibility": "party"` só no que os jogadores já viram ou ouviram na mesa; segredos, planos e ganchos ficam sem `visibility` (só o mestre).
> Use os mesmos nomes em `links` que nos `cards`. Não copie trechos do livro da campanha: resuma com as minhas palavras.
> [cole aqui a seção "Formato" deste arquivo]

Revise a prévia antes de importar: é ela que mostra o que é novo e o que já existia.
