## Sistema de Chamados TCC - Guia de Instalação

Este guia detalha os passos necessários para configurar e executar o Sistema de Chamados desenvolvido para o seu Trabalho de Conclusão de Curso (TCC).

---

##  Visão Geral do Projeto

Este é um sistema web para gerenciamento de tickets (chamados).

* **Backend (API):** Desenvolvido com **Node.js** e **Express**, utilizando a biblioteca `mysql2/promise` para comunicação assíncrona com o banco de dados. A API roda na porta `3000`.
* **Frontend (Cliente):** Implementado com **HTML, CSS e JavaScript puros**.
* **Funcionalidades:** Login de Usuário/Analista/Admin, Criação de Chamados, Visualização de Histórico e Redefinição de Senha via e-mail.

---

## Requisitos de Sistema

Certifique-se de que os seguintes softwares estão instalados:

1.  **Node.js** (Versão 16+ recomendada).
2.  **MySQL** ou **MariaDB**.
3.  **Extensão Live Server** (no VS Code ou editor similar, para rodar o `index.html`).

---

## Configuração do Banco de Dados

O banco de dados do projeto se chama `meu_tcc_db`.

### 1. Criar o Banco e as Tabelas

1.  Acesse seu MySQL.
2.  Execute o script SQL contido no arquivo `schema.sql` para criar o banco de dados e as tabelas necessárias:
3.  Insira o Usuario Administrador para acessar a área de administração

## Configuração do Backend

### 1. Instalar Dependências

Primeiro, navegue até a pasta `backend` no seu terminal e instale os módulos necessários listados no `package.json`:

```bash
cd backend
npm install
```


