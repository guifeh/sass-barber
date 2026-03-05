# Testar rotas no Postman

## Antes de testar

1. **Subir o Postgres** (na raiz do projeto):
   ```bash
   docker-compose up -d
   ```

2. **Rodar as migrations** (criar tabelas):
   ```bash
   cd backend
   npm install
   npm run db:migrate
   ```

3. **Subir o backend**:
   ```bash
   npm run dev
   ```
   O servidor sobe em `http://localhost:3333` (ou a porta do seu `.env`).

---

## Exemplos de requisições

Base URL: `http://localhost:3333`

### 1. Registrar usuário  
**POST** `http://localhost:3333/auth/register`

- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha12345",
  "role": "usuario"
}
```
- Roles permitidos: `admin`, `barbeiro`, `usuario` (opcional; padrão é `usuario`).

Resposta esperada (201): `user`, `accessToken`, `refreshToken`, `expiresIn`.  
Guarde o `accessToken` para as rotas protegidas.

---

### 2. Login  
**POST** `http://localhost:3333/auth/login`

- Body (raw JSON):
```json
{
  "email": "joao@email.com",
  "password": "senha12345"
}
```

Resposta (200): `user`, `accessToken`, `refreshToken`, `expiresIn`.

---

### 3. Dados do usuário logado (autenticado)  
**GET** `http://localhost:3333/me`

- Headers:
  - `Authorization: Bearer SEU_ACCESS_TOKEN`
  - (cole o `accessToken` recebido no login ou no register).

Resposta (200): `id`, `name`, `email`, `role`.

---

### 4. Renovar tokens  
**POST** `http://localhost:3333/auth/refresh`

- Body (raw JSON):
```json
{
  "refreshToken": "SEU_REFRESH_TOKEN"
}
```

Resposta (200): novo `accessToken`, `refreshToken`, `expiresIn`.

---

### 5. Serviços (admin ou barbeiro)

Todas as rotas abaixo exigem **admin** ou **barbeiro**. Use um usuário com `role: "admin"` ou `role: "barbeiro"` (registre ou faça login) e envie o header:

- `Authorization: Bearer SEU_ACCESS_TOKEN`

#### 5.1 Listar serviços  
**GET** `http://localhost:3333/services`

Resposta (200): array de serviços (`id`, `name`, `description`, `durationMinutes`, `basePrice`, `active`, `createdAt`, `updatedAt`).

---

#### 5.2 Buscar um serviço  
**GET** `http://localhost:3333/services/:id`

Substitua `:id` pelo UUID do serviço.  
Resposta (200): objeto do serviço. (404 se não existir.)

---

#### 5.3 Criar serviço  
**POST** `http://localhost:3333/services`

- Headers: `Content-Type: application/json`, `Authorization: Bearer ...`
- Body (raw JSON):
```json
{
  "name": "Corte masculino",
  "description": "Corte com máquina e tesoura",
  "durationMinutes": 30,
  "basePrice": 3500,
  "active": true
}
```
- `basePrice` em centavos (ex.: 3500 = R$ 35,00). Opcional.
- `description` e `active` são opcionais; `active` padrão é `true`.

Resposta (201): serviço criado com `id`, `name`, `description`, `durationMinutes`, `basePrice`, `active`, `createdAt`, `updatedAt`.

---

#### 5.4 Atualizar serviço  
**PUT** `http://localhost:3333/services/:id`

- Body (raw JSON) – todos os campos opcionais:
```json
{
  "name": "Corte masculino premium",
  "description": "Corte + barba",
  "durationMinutes": 45,
  "basePrice": 5000,
  "active": true
}
```

Resposta (200): serviço atualizado. (404 se o `:id` não existir.)

---

#### 5.5 Deletar serviço  
**DELETE** `http://localhost:3333/services/:id`

Resposta (200): `{ "message": "Service deleted" }`. (404 se o serviço não existir.)

---

### 6. Disponibilidade e agendamentos

Todas as rotas abaixo (exceto confirmação por link) exigem **Authorization: Bearer SEU_ACCESS_TOKEN**.

#### 6.1 Slots disponíveis  
**GET** `http://localhost:3333/availability?date=YYYY-MM-DD&serviceId=UUID`

- Query: `date` (obrigatório), `serviceId` (obrigatório), `barberId` (opcional; se omitido, usa o primeiro barbeiro).
- Resposta (200): `{ "slots": [ { "start": "ISO datetime", "end": "ISO datetime" }, ... ] }`.  
- (400) se data/serviço inválido ou serviço inativo.

#### 6.2 Criar agendamento  
**POST** `http://localhost:3333/appointments`

- Body (raw JSON):
```json
{
  "serviceId": "UUID_DO_SERVICO",
  "barberId": "UUID_DO_BARBEIRO",
  "startTime": "2025-03-10T14:00:00.000Z"
}
```
- `startTime`: ISO 8601 (ex.: com timezone). O backend calcula `endTime` pela duração do serviço e valida conflitos e horário de funcionamento.
- Resposta (201): agendamento criado (inclui `confirmationToken`, `confirmationDeadline`).  
- (400) se fora do horário, slot ocupado, antecedência inválida, etc.

#### 6.3 Meus agendamentos (cliente)  
**GET** `http://localhost:3333/appointments/me`

- Resposta (200): array de agendamentos do usuário logado.

#### 6.4 Agenda do barbeiro  
**GET** `http://localhost:3333/appointments/barber?from=ISO&to=ISO`

- Admin: vê o primeiro barbeiro. Barbeiro: vê a própria agenda.
- Query opcional: `from` e `to` (ISO datetime) para filtrar por período.
- Resposta (200): array de agendamentos. (404) se não houver perfil de barbeiro.

#### 6.5 Cancelar agendamento  
**POST** `http://localhost:3333/appointments/:id/cancel`

- Cliente pode cancelar o próprio; admin/barbeiro pode cancelar qualquer um. Respeita `min_cancel_minutes` das configurações do barbeiro.
- Resposta (200): `{ "message": "Appointment cancelled" }`.  
- (400) se já cancelado ou fora do prazo; (403) se não autorizado; (404) se não existir.

#### 6.6 Confirmar agendamento (link do e-mail)  
**GET** `http://localhost:3333/appointments/confirm?token=TOKEN`

- Público (sem auth). Usado no link enviado por e-mail para o cliente confirmar.
- Resposta (200): JSON `{ "success": true, "message": "Appointment confirmed successfully." }`.  
- Se o cliente abrir no navegador (Accept: text/html), a API retorna uma página HTML simples de sucesso.
- (400) se token inválido ou agendamento já cancelado.

#### 6.7 Cancelar agendamento (link do e-mail)  
**GET** `http://localhost:3333/appointments/cancel?token=TOKEN`

- Público (sem auth). Usado no link enviado no e-mail de lembrete para o cliente cancelar.
- Resposta (200): JSON `{ "success": true, "message": "Appointment cancelled successfully." }`.  
- Se abrir no navegador, retorna página HTML simples. (400) se token inválido.

---

## E-mail e notificações

- Ao criar um agendamento (**POST** `/appointments`), o backend envia e-mail para o cliente e para o barbeiro (se SMTP estiver configurado no `.env`: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, etc.).
- Um job roda a cada 15 minutos e envia e-mail de lembrete com link de confirmar/cancelar para agendamentos com `confirmation_deadline` nas próximas 24h (pendentes de confirmação).
- Configure `APP_BASE_URL` (ex.: `http://localhost:3333`) para os links de confirmação/cancelamento nos e-mails.

---

## Ordem sugerida no Postman

1. **POST** `/auth/register` → copiar `accessToken` (use `"role": "admin"` ou `"role": "barbeiro"` para testar serviços).
2. **GET** `/me` com header `Authorization: Bearer <accessToken>`.
3. **POST** `/auth/login` (mesmo email/senha) → copiar novo `accessToken`.
4. **GET** `/me` de novo com o token do login.
5. **POST** `/auth/refresh` com o `refreshToken` para testar renovação.
6. **GET** `/services` (com token de admin/barbeiro) → listar serviços.
7. **POST** `/services` → criar um serviço; guardar o `id` da resposta.
8. **GET** `/services/:id` e **PUT** `/services/:id` → buscar e editar.
9. **DELETE** `/services/:id` → remover (opcional).
10. Criar um **barber_profile** e **barber_settings** (via seed ou SQL) para ter um barbeiro e horários.
11. **GET** `/availability?date=2025-03-10&serviceId=<id>` → ver slots (com token).
12. **POST** `/appointments` → criar agendamento (cliente ou qualquer role).
13. **GET** `/appointments/me` → meus agendamentos.
14. **GET** `/appointments/barber` → agenda (admin/barbeiro).
15. **POST** `/appointments/:id/cancel` → cancelar.
16. **GET** `/appointments/confirm?token=...` → confirmar (sem auth).
17. **GET** `/appointments/cancel?token=...` → cancelar por link (sem auth).

## Health check

**GET** `http://localhost:3333/health`  
Resposta: `{ "status": "ok", "database": "up" }` (confirma que API e banco estão ok).
