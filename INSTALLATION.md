# Guia de Instalação e Configuração - Tarifário 360

Este documento fornece as instruções necessárias para configurar o ambiente de desenvolvimento e executar o projeto **Tarifário 360**.

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

1.  **Node.js**: O ambiente de execução JavaScript. Recomenda-se a versão LTS (Long Term Support).
    - [Download Node.js](https://nodejs.org/)
2.  **npm**: O gerenciador de pacotes do Node (geralmente instalado automaticamente junto com o Node.js).

## Passo a Passo

### 1. Instalar o Angular CLI

O projeto é construído com o framework Angular. Se você ainda não possui a CLI (Command Line Interface) instalada globalmente, execute o seguinte comando no terminal:

```bash
npm install -g @angular/cli
```

### 2. Acessar a Pasta do Projeto

Navegue até a pasta raiz do projeto via terminal:

```bash
cd Tarifario-360
```

### 3. Instalar Dependências

Instale todas as bibliotecas necessárias (incluindo Angular, PrimeNG e outras dependências listadas no `package.json`):

```bash
npm install
```

### 4. Executar o Servidor de Desenvolvimento

Para rodar a aplicação localmente em modo de desenvolvimento:

```bash
ng serve
```

Após a compilação, acesse `http://localhost:4200/` no seu navegador. A aplicação recarregará automaticamente se você modificar qualquer arquivo fonte.

### 5. Build para Produção

Para gerar os arquivos otimizados para implantação (produção), execute:

```bash
ng build
```

Os arquivos de saída serão gerados no diretório `dist/`.
