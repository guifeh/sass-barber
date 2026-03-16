# ⚙️ Barber Shop API

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Fastify-5.0-green?style=for-the-badge" alt="Fastify">
  <img src="https://img.shields.io/badge/TypeScript-5.2-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
</p>

<p align="center">
  <a href="https://sass-barber-backend.onrender.com/">🌐 Acessar API</a>
  •
  <a href="https://github.com/guifeh/sass-barber">🐙 GitHub Backend</a>
  •
  <a href="https://github.com/guifeh/barbershop-flow">🐙 GitHub Frontend</a>
</p>

---

## 📌 Sobre o Projeto

A **Barber Shop API** é uma REST API robusta construída com Fastify e Node.js, responsável por toda a lógica de negócio do sistema de agendamento de barbearias.

### Responsabilidades da API

- **Autenticação**: Login, registro e proteção de rotas com JWT
- **Agendamentos**: Criação, listagem, confirmação e cancelamento
- **Serviços**: Gestão de serviços disponíveis na barbearia
- **Barbeiros**: Perfis, configurações e horários de atendimento
- **Dashboard**: Métricas e estatísticas
- **Uploads**: Armazenamento de imagens no Supabase Storage
- **Notificações**: Envio de emails transacionais via Brevo

### Problema Resolvido

Barbearias precisam digitalizar processos manuais de agendamento, eliminando:
- Conflitos de horário
- Falta de confirmação de clientes
- Dificuldade no gestão financeira

---

## 🖥️ API em Produção

| Serviço | URL |
|---------|-----|
| **Backend API** | https://sass-barber-backend.onrender.com |
| **Frontend Demo** | https://barbershop-flow.vercel.app |

---

## 🛠️ Tech Stack

### Core
| Tecnologia | Descrição |
|------------|-----------|
| **Node.js 20** | Runtime JavaScript |
| **Fastify** | Framework web de alta performance |
| **TypeScript** | Tipagem estática |
| **Drizzle ORM** | ORM leve e rápido |

### Banco de Dados
| Tecnologia | Descrição |
|------------|-----------|
| **PostgreSQL** | Banco relacional |
| **Supabase** | PostgreSQL gerenciado na nuvem |

### Autenticação & Segurança
| Tecnologia | Descrição |
|------------|-----------|
| **Fastify JWT** | Autenticação stateless |
| **bcrypt** | Hashing de senhas |
| **Zod** | Validação de schemas |

### Serviços Externos
| Serviço | Uso |
|---------|-----|
| **Supabase Storage** | Armazenamento de imagens |
| **Brevo** | Envio de emails transacionais |

---

## 📐 Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                    │
│                   (Vercel - React SPA)                             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼ HTTPS
┌─────────────────────────────────────────────────────────────────────┐
│                      RENDER (Backend)                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     FASTIFY SERVER                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │  │
│  │  │  Auth    │ │Appoint-  │ │Dashboard │ │  Notifications │  │  │
│  │  │ Module   │ │ments     │ │  Module  │ │    Module      │  │  │
│  │  │          │ │ Module   │ │          │ │                │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │  │
│  │         │            │            │              │            │  │
│  │         └────────────┴────────────┴──────────────┘            │  │
│  │                          │                                     │  │
│  │                    ┌─────┴─────┐                               │  │
│  │                    │  Drizzle  │                               │  │
│  │                    │    ORM    │                               │  │
│  │                    └─────┬─────┘                               │  │
│  └──────────────────────────┼────────────────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    SUPABASE     │  │  SUPABASE       │  │     BREVO       │
│                 │  │   STORAGE       │  │                 │
│ ┌─────────────┐ │  │                 │  │  ┌───────────┐  │
│ │  PostgreSQL │ │  │  /uploads/       │  │  │  Email    │  │
│ │    Database │ │  │    photos/      │  │  │  Service  │  │
│ └─────────────┘ │  │                 │  │  └───────────┘  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Estrutura de Pastas

```
src/
├── config/
│   └── env.ts          # Variáveis de ambiente validadas
├── db/
│   ├── index.ts        # Conexão Drizzle
│   └── schema/         # Definições das tabelas
├── jobs/
│   └── confirmation-reminders.ts  # Job de lembretes
├── modules/
│   ├── appointments/   # Agendamentos
│   ├── auth/           # Autenticação
│   ├── barber/         # Perfil barbeiro
│   ├── dashboard/      # Métricas
│   ├── notifications/  # Emails
│   ├── public/         # Rotas públicas
│   ├── services/       # Serviços
│   └── upload/         # Upload imagens
├── server.ts           # Entry point
└── types/              # Tipos globais
```

---

## 🌐 Endpoints Principais

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Cadastrar novo usuário |
| POST | `/auth/login` | Login (retorna tokens JWT) |
| POST | `/auth/refresh` | Renovar access token |

### Agendamentos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/appointments/me` | Listar meus agendamentos |
| POST | `/appointments` | Criar agendamento |
| GET | `/appointments/availability` | Verificar horários disponíveis |
| POST | `/appointments/:token/confirm` | Confirmar agendamento |
| DELETE | `/appointments/:token/cancel` | Cancelar agendamento |

### Serviços
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/services` | Listar serviços disponíveis |

### Barbeiro
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/barber/profile` | Perfil do barbeiro |
| PUT | `/barber/profile` | Atualizar perfil |
| GET | `/barber/settings` | Configurações de agenda |
| PUT | `/barber/settings` | Atualizar configurações |

### Dashboard
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/dashboard/stats` | Métricas gerais |
| GET | `/dashboard/appointments` | Agendamentos por período |

### Uploads
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/upload/photo` | Upload de foto |

### Notificações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/notifications/status` | Status dos serviços de email |
| POST | `/notifications/test` | Enviar email de teste |

---

## 🔐 Variáveis de Ambiente

### Variáveis Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL do PostgreSQL (Supabase) | `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | Chave secreta para JWT (mín 32 chars) | `sua-chave-secreta-aqui` |

### Variáveis Opcionais

| Variável | Descrição | Padrão |
|----------|-----------|---------|
| `PORT` | Porta do servidor | `3333` |
| `JWT_ACCESS_EXPIRES_IN` | Tempo de expiração access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Tempo de expiração refresh token | `7d` |
| `APP_BASE_URL` | URL base para links nos emails | - |
| `BREVO_API_KEY` | Chave API do Brevo | - |
| `SMTP_FROM` | Email remetente para Brevo | - |

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- **Node.js** 20+
- **npm** ou **yarn**
- **PostgreSQL** (local ou Supabase)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/guifeh/sass-barber.git
cd sass-barber

# 2. Instale as dependências
cd backend
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env

# 4. Edite o .env com suas configurações
# DATABASE_URL=postgres://...
# JWT_SECRET=sua-chave-secreta-minimo-32-caracteres

# 5. Execute as migrations do banco
npm run db:push

# 6. Inicie o servidor
npm run dev
```

### Servidor rodando

```
Server listening at http://127.0.0.1:3333
Server listening at http://localhost:3333
HTTP server running on port 3333
```

---

## 🌐 Configuração em Produção (Render)

### Variáveis no Render

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | URL do PostgreSQL (Supabase) |
| `JWT_SECRET` | Chave JWT segura (32+ chars) |
| `BREVO_API_KEY` | Sua chave Brevo |
| `PORT` | `3333` |

### Build Settings

| Configuração | Valor |
|--------------|-------|
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Node Version | `20` |

---

## 📬 Sistema de Emails

### Brevo (Sendinblue)

O sistema utiliza **Brevo** para envio de emails transacionais:

- **Plano gratuito**: 300 emails/dia
- **Não requer domínio próprio**
- **Setup rápido**: Apenas API Key

### Emails Enviados

| Tipo | Descrição |
|------|-----------|
| **Confirmação de agendamento** | Enviado ao cliente quando agenda |
| **Lembrete de confirmação** | Enviado 24h antes do horário |
| **Notificação ao barbeiro** | Enviado quando novo agendamento é criado |

### Testando Emails

```bash
# Enviar email de teste
curl -X POST https://sass-barber-backend.onrender.com/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"to":"seu-email@exemplo.com"}'

# Verificar status
curl https://sass-barber-backend.onrender.com/notifications/status
```

---

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar com coverage
npm run test:coverage
```

---

## 🤝 Contribuição

Contribuições são **bem-vindas**! Se você quer ajudar:

### Como Contribuir

1. **Fork** o repositório
2. Crie uma **branch** (`git checkout -b feature/nova-feature`)
3. Faça **commit** (`git commit -m 'Adiciona nova feature'`)
4. Faça **push** (`git push origin feature/nova-feature`)
5. Abra um **Pull Request**

### Ideas para Contribuição

- [ ] Testes E2E
- [ ] Documentação Swagger/OpenAPI
- [ ] Rate limiting
- [ ] Cache com Redis
- [ ] Webhooks
- [ ] Integração com pagamento

---

## 📜 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👏 Créditos

Desenvolvido por **Guilherme Fernandes**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/guilherme-fernandesgn/)

---

<p align="center">
  <img src="https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F-red?style=for-the-badge" alt="Made with love">
  <img src="https://img.shields.io/badge/Stars-%E2%98%85%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20-yellow?style=for-the-badge" alt="Stars">
</p>
