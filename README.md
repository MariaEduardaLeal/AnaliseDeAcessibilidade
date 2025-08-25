# Framework de Análise de Acessibilidade Web

Uma ferramenta para análise automática de acessibilidade de páginas web, desenvolvida com foco nas diretrizes da WCAG 2.1.

### Funcionalidades

- **Análise de URL:** Permite iniciar a verificação de qualquer página web.
- **Relatórios Detalhados:** Gera relatórios completos com pontuação, erros e recomendações para correção.
- **Persistência de Dados:** Armazena o histórico de análises em um banco de dados MySQL.

### Tecnologias

- **Frontend:** HTML, CSS (Tailwind CSS) e JavaScript puro.
- **Backend:** Node.js (Express), Sequelize e MySQL.

### Como Rodar o Projeto

1.  **Instale as dependências do backend:**
    ```bash
    cd backend
    npm install
    ```

2.  **Configure o banco de dados:**
    * Crie um arquivo `.env` na pasta `backend` com suas credenciais.
    * Execute as migrations para criar a tabela `Analysis`:
    ```bash
    npx sequelize-cli db:migrate
    ```

3.  **Inicie o servidor:**
    ```bash
    node backend/server.js
    ```

4.  **Abra o frontend:**
    * Abra o arquivo `index.html` em seu navegador.