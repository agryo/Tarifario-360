# Tarifário 360

Sistema completo para gestão de tarifas, orçamentos e escalas hoteleiras.

## 📋 Sobre o Projeto

O **Tarifário 360** é uma aplicação web desenvolvida para otimizar a rotina operacional de hotéis e pousadas. O sistema permite o gerenciamento centralizado de categorias de quartos, precificação dinâmica (alta/baixa temporada), promoções e escalas de trabalho da equipe, oferecendo uma interface intuitiva e responsiva.

## 🚀 Funcionalidades Principais

- **Gestão de Tarifas**: Controle total de categorias de quartos (Standard, Luxo, Suítes, etc.) com precificação diferenciada para alta e baixa temporada, com ou sem café da manhã.
- **Orçamentos**:
  - **Oficial**: Geração e gerenciamento de orçamentos detalhados.
  - **Rápido**: Calculadora ágil para cotações imediatas no balcão ou telefone.
- **Promoções**: Configuração de regras de desconto (ex: Early Bird, Long Stay) com critérios de dias mínimos e validade sazonal.
- **Escala de Trabalho**: Organização e visualização das escalas dos colaboradores.
- **Painel Master**: Área administrativa protegida por senha para configurações globais (horários de refeições, valores de extras, festividades e parâmetros do sistema).
- **Backup e Segurança**: Sistema robusto de exportação e importação de dados (JSON) com verificação de integridade e criptografia de senhas.
- **Impressão**: Geração de tabelas de preços formatadas especificamente para impressão física.

## 🛠 Tecnologias Utilizadas

- **[Angular](https://angular.io/)**: Framework principal para construção da aplicação SPA.
- **[PrimeNG](https://primeng.org/)**: Suíte de componentes de UI rica (Tabelas, Dialogs, Inputs, etc.).
- **TypeScript**: Linguagem base para lógica de negócios e tipagem segura.
- **SCSS**: Estilização avançada e responsiva.

## 📦 Instalação e Configuração

Para instruções detalhadas sobre como preparar o ambiente (Node.js, Angular CLI) e executar o projeto em sua máquina, consulte nosso guia dedicado:
_Senha Padrão:_ 1234

👉 **[Guia de Instalação e Configuração](./INSTALLATION.md)**

## 📄 Estrutura de Dados

O sistema utiliza persistência local e arquivos JSON estruturados para portabilidade dos dados, gerenciando entidades como:

- `CategoriaQuarto`: Definições das UHs.
- `Promocao`: Regras de descontos.
- `ConfiguracaoGeral`: Parâmetros globais do hotel.
- `Orcamento`: Histórico de cotações.

---

**Versão do Sistema**: 2.0
Desenvolvido para o Tarifário 360.
