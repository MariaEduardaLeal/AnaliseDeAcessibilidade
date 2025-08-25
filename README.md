# Framework de Análise de Acessibilidade Web

Uma ferramenta para análise automática de acessibilidade de páginas web, desenvolvida com foco nas diretrizes da WCAG 2.1. O projeto é construído com uma arquitetura moderna e escalável, utilizando Node.js no backend para persistência de dados.

### Funcionalidades

- **Análise de URL:** Permite iniciar a verificação de qualquer página web.
- **Relatórios Detalhados:** Gera relatórios completos com pontuação, erros e recomendações para correção.
- **Persistência de Dados:** Salva e gerencia o histórico de análises em um banco de dados **MySQL**.
- **Comunicação Cliente-Servidor:** O frontend se comunica com uma API RESTful para todas as operações de dados.
- **Design Responsivo:** A interface se adapta perfeitamente a diferentes tamanhos de tela.

### Tecnologias

- **Frontend:**
  - **HTML5:** Estrutura das páginas.
  - **CSS3 (Tailwind CSS):** Estilização e layout responsivo.
  - **JavaScript Puro:** Lógica do lado do cliente e requisições à API.
- **Backend:**
  - **Node.js (Express):** Servidor API.
  - **Sequelize:** ORM para interação com o banco de dados.
  - **MySQL:** Sistema de gerenciamento de banco de dados.
  - **Outras:** `cors` (para segurança) e `dotenv` (para variáveis de ambiente).

### Estrutura do Projeto

O projeto segue a arquitetura **MVC** no backend e uma abordagem modular no frontend.

AnaliseDeAcessibilidade/
├───assets/
├───scripts/
├───styles/
├───backend/
│   ├───config/          # Configuração do banco
│   ├───controllers/     # Lógica de negócio da API
│   ├───models/          # Modelos do Sequelize
│   ├───routes/          # Rotas da API
│   ├───node_modules/
│   ├───.env             # Variáveis de ambiente (ignorado pelo Git)
│   ├───.gitignore
│   ├───package.json
│   └───server.js
│
├───index.html
├───report.html
└───README.md

### Como Rodar o Projeto

Siga estes passos para configurar e executar o projeto:

1.  **Configure o ambiente do backend:**
    * Abra o terminal e navegue até a pasta `backend`.
    * Instale as dependências:
      ```bash
      npm install
      ```
    * Crie um arquivo `.env` na pasta `backend` com as suas credenciais do MySQL.
    * Execute as migrations para criar a tabela no seu banco de dados:
      ```bash
      npx sequelize-cli db:migrate
      ```

2.  **Inicie o servidor Node.js:**
    * Na pasta `backend`, execute:
      ```bash
      node server.js
      ```
    * O servidor será iniciado na porta 3000.

3.  **Abra o frontend:**
    * Abra o arquivo `index.html` em seu navegador usando a extensão **Live Server** do VS Code.
    * O frontend se comunicará com o backend automaticamente.