# Analise de Acessibilidade Web

Aplicacao para analise automatica de acessibilidade em paginas web, com foco em utilidade pratica para times de produto, design e desenvolvimento.

O sistema recebe uma URL, processa a pagina com `Puppeteer` + `axe-core`, executa validacoes complementares proprias e gera um relatorio organizado por severidade, categoria e prioridade de correcao.

## O que o projeto faz

- Inicia uma analise a partir de uma URL.
- Processa a pagina de forma assíncrona sem travar a interface.
- Exibe status claros de fila, processamento, conclusao e erro.
- Calcula um score mais realista com base em severidade e recorrencia.
- Mostra um relatorio acionavel com:
  - score geral
  - prioridades imediatas
  - agrupamento por severidade
  - agrupamento por categoria
  - explicacao simples do impacto para o usuario
  - sugestao pratica de correcao

## Principais melhorias da refatoracao

Comparado ao estado inicial do projeto, esta versao:

- removeu a dependencia de banco de dados
- eliminou a necessidade de `.env` para rodar localmente
- integrou frontend e backend no mesmo servidor
- separou melhor controller, servicos, fila e persistencia
- melhorou a confiabilidade do carregamento com `Puppeteer`
- ampliou as validacoes alem do `axe-core`
- evoluiu o score para um modelo mais proximo do impacto real
- reorganizou dashboard e relatorio para uma UX mais profissional

## Arquitetura atual

### Visao geral

O projeto funciona como uma aplicacao web servida por um backend Node.js:

- o backend expõe a API de analise
- o mesmo backend serve `index.html`, `report.html`, scripts e estilos
- as analises sao persistidas localmente em JSON
- uma fila simples controla concorrencia para evitar sobrecarga

### Estrutura

```text
AnaliseDeAcessibilidade/
|-- index.html
|-- report.html
|-- scripts/
|   |-- api.js
|   |-- dashboard.js
|   |-- dashboard-view.js
|   |-- report.js
|   |-- report-view.js
|   `-- ui-helpers.js
|-- styles/
|   |-- globals.css
|   `-- main.css
|-- locales/
|-- backend/
|   |-- controllers/
|   |   `-- analysisController.js
|   |-- routes/
|   |   `-- analysisRoutes.js
|   |-- services/
|   |   |-- accessibilityAnalysis.js
|   |   |-- analysisQueue.js
|   |   |-- analysisRepository.js
|   |   `-- analysisService.js
|   |-- data/
|   |   `-- analyses.json
|   |-- package.json
|   `-- server.js
`-- README.md
```

## Responsabilidades por camada

### Backend

- [backend/server.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/backend/server.js)
  - sobe o servidor
  - serve frontend e assets
  - registra a API

- [backend/controllers/analysisController.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/backend/controllers/analysisController.js)
  - recebe requests HTTP
  - converte erros em respostas da API
  - delega a logica de negocio para o service

- [backend/services/analysisService.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/backend/services/analysisService.js)
  - valida URL
  - cria analise
  - enfileira processamento
  - controla status e etapas
  - executa `Puppeteer` e `axe-core`
  - classifica erros de rede, timeout, bloqueio e HTTP

- [backend/services/analysisQueue.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/backend/services/analysisQueue.js)
  - controla concorrencia
  - evita disparar varias analises pesadas ao mesmo tempo

- [backend/services/analysisRepository.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/backend/services/analysisRepository.js)
  - cuida da persistencia local em arquivo JSON
  - lista, cria, atualiza e remove analises

- [backend/services/accessibilityAnalysis.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/backend/services/accessibilityAnalysis.js)
  - transforma retorno do `axe-core`
  - roda validacoes complementares
  - calcula score
  - organiza issues por severidade e categoria

### Frontend

- [scripts/api.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/scripts/api.js)
  - camada de acesso a API

- [scripts/dashboard.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/scripts/dashboard.js)
  - estado e fluxo da pagina inicial

- [scripts/dashboard-view.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/scripts/dashboard-view.js)
  - renderizacao do dashboard

- [scripts/report.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/scripts/report.js)
  - estado e fluxo do relatorio

- [scripts/report-view.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/scripts/report-view.js)
  - renderizacao do relatorio

- [scripts/ui-helpers.js](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/scripts/ui-helpers.js)
  - helpers de apresentacao e formatacao

## Fluxo de analise

1. O usuario informa uma URL no dashboard.
2. O frontend faz `POST /api/analyses`.
3. O backend cria a analise com status inicial `processing` e etapa `queued`.
4. A fila agenda o trabalho.
5. O `analysisService` abre a pagina com `Puppeteer`.
6. O sistema espera carregamento real da pagina.
7. O `axe-core` executa a varredura.
8. Validacoes complementares rodam no DOM da pagina.
9. O motor de analise monta score, prioridades e agrupamentos.
10. O backend salva resultado final e atualiza status para `completed` ou `error`.
11. O frontend faz polling e atualiza a tela automaticamente.

## Sistema de score

O score nao usa apenas contagem simples de erros.

Ele considera:

- severidade do problema
- recorrencia
- impacto aproximado no uso real
- combinacao entre regras do `axe-core` e validacoes complementares

### Niveis de severidade

- `critical`
- `high`
- `medium`
- `low`

### Como a nota funciona

- cada severidade possui um peso base
- ocorrencias repetidas aumentam a penalizacao
- a queda do score usa uma curva nao linear para refletir melhor acumulacao de problemas graves

Na pratica:

- poucos problemas criticos derrubam a nota rapidamente
- varios problemas leves tambem pesam, mas de forma menos agressiva
- o score final representa melhor o risco para a experiencia do usuario

## Validacoes executadas

### Axe-core

O sistema usa `axe-core` para cobertura automatica ampla de regras de acessibilidade.

### Validacoes complementares proprias

Atualmente o projeto tambem verifica:

- imagens sem `alt`
- imagens com `alt` generico
- inputs sem label
- botoes sem nome acessivel
- hierarquia incorreta de headings
- landmarks ausentes
- titulo da pagina ausente

## Como rodar o projeto

### Requisitos

- Node.js instalado
- npm instalado
- acesso a internet para analisar paginas externas

### Instalacao

Entre na pasta do backend e instale as dependencias:

```bash
cd backend
npm install
```

### Executar em modo normal

```bash
npm start
```

Servidor:

```text
http://localhost:3000
```

### Executar em modo desenvolvimento

```bash
npm run dev
```

## Como usar

1. Abra [index.html](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/index.html) via `http://localhost:3000`
2. Informe uma URL valida
3. Inicie a analise
4. Acompanhe o status no dashboard
5. Abra o relatorio quando o processamento terminar

## Endpoints da API

### Criar analise

```http
POST /api/analyses
Content-Type: application/json

{
  "url": "https://exemplo.com"
}
```

### Listar analises

```http
GET /api/analyses
```

### Buscar analise por ID

```http
GET /api/analyses/:id
```

### Remover analise

```http
DELETE /api/analyses/:id
```

### Estatisticas da fila

```http
GET /api/analyses/runtime/stats
```

## Formato de status

Cada analise pode assumir:

- `processing`
- `completed`
- `error`

E tambem possui metadados de etapa, por exemplo:

- `queued`
- `loading`
- `analyzing`
- `completed`
- `error`

Isso ajuda o frontend a mostrar feedback mais preciso.

## Persistencia local

As analises sao armazenadas em:

- [backend/data/analyses.json](/C:/Users/mmedu/Documents/AnaliseDeAcessibilidade/backend/data/analyses.json)

Observacoes:

- esse arquivo e criado automaticamente
- ele nao depende de banco de dados
- o repositório remove payloads pesados antigos do `axe` para manter o armazenamento mais leve

## Decisoes de projeto

### Por que nao usar banco neste momento

Para este escopo, persistencia local simplifica:

- setup
- execucao local
- testes manuais
- demonstracao do projeto

Se o projeto crescer, o repositório atual facilita trocar JSON por banco sem reescrever controller e service.

### Por que existe fila

Analise com `Puppeteer` e `axe-core` e custosa.

A fila:

- evita concorrencia excessiva
- reduz travamentos
- melhora previsibilidade do processamento

## Limitacoes conhecidas

- nem todo problema de acessibilidade pode ser validado automaticamente
- SPAs muito dinamicas ainda podem exigir regras extras por framework
- alguns sites bloqueiam automacao
- contraste e semantica complexa podem exigir revisao humana

## Possiveis proximos passos

- cancelamento de analise em andamento
- retries automaticos para erros transitórios
- exportacao do relatorio
- filtros e paginação do historico
- autenticação e perfis de usuario
- troca da persistencia local por banco, se necessario

## Comandos uteis

Instalar dependencias:

```bash
cd backend
npm install
```

Rodar aplicacao:

```bash
npm start
```

Rodar com watch:

```bash
npm run dev
```

## Resumo

Este projeto hoje entrega:

- interface mais profissional
- backend sem dependencia de banco
- arquitetura mais organizada
- analise mais confiavel
- score mais coerente
- relatorio mais acionavel

Ele ja esta em um patamar bem mais proximo de produto real do que a versao inicial, mantendo o fluxo principal simples de usar.
