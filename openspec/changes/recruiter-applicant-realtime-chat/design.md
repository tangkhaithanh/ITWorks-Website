## Context

The ITWorks backend is **NestJS** with **Prisma** (PostgreSQL), **JWT** auth, and existing **`Application`** records when candidates apply to **`Job`** postings. There is no first-class messaging layer today. The frontend will need a **socket** connection alongside existing REST patterns.

## Goals / Non-Goals

**Goals:**

- Model **conversations** tied to a **job** (`jobId` required for MVP), with exactly **two participants**: one **recruiter** (job owner or delegated recruiter account) and one **applicant** (`Account` with applicant role).
- **Create** a conversation automatically when an applicant applies (if no conversation exists for that job + applicant pair).
- **Create** a conversation when a recruiter opens chat with an applicant for a given job (idempotent: reuse existing thread).
- **Persist** messages in PostgreSQL; **deliver** new messages in real time via **Socket.io** (already used elsewhere in the stack for websockets).
- **Enforce** access: only the two participants; recruiter access only if they own the job (or future assignment model—see Open Questions).

**Non-Goals:**

- Group chats, file attachments, voice/video (can be extension points only).
- End-to-end encryption.
- Full-text search across all messages (optional index later).
- Mobile push notifications (out of scope for initial design).
- Message editing after send (optional later).

## Decisions

| Decision | Choice | Rationale | Alternatives considered |
|----------|--------|-----------|-------------------------|
| Real-time transport | **Socket.io** on NestJS (`@nestjs/websockets` + existing patterns) | Aligns with current dependencies; rooms per `conversationId`; JWT auth on handshake. | Raw WebSockets (more manual), SSE (one-way only). |
| Conversation key | **Unique `(jobId, applicantAccountId)`** | One thread per job per applicant avoids duplicate threads; recruiter is derived from job owner. | Include recruiter id in key (redundant if one recruiter per job owner). |
| Create on apply | **Transactional**: create `Application` + upsert `Conversation` | Single source of truth; chat always has application context when apply exists. | Fire-and-forget async (risk of missing chat on failure). |
| Idempotency | **`upsert` / find-first-or-create** for conversation | Safe for concurrent apply + recruiter click. | Distributed lock (overkill for MVP). |
| Scaling | **Single-node Socket.io** first; **Redis adapter** when multiple instances | Matches proposal impact; add Redis URL when deploying horizontally. | Sticky sessions only (fragile). |
| Message body | **Plain text** + length limit (e.g. 8–16k chars) | Simple validation; escape on render. | Rich HTML (XSS risk without sanitization). |

## Risks / Trade-offs

- **[Risk] Socket auth mismatch** → Mitigation: validate JWT on connection; join only `conversation:{id}` rooms after server-side membership check.
- **[Risk] Job ownership rules change** → Mitigation: centralize “can recruiter access job?” in one guard/service used by HTTP and WS.
- **[Risk] High message volume** → Mitigation: pagination for history; index `(conversationId, createdAt)`; rate limit per user.
- **[Trade-off]** Job required for every chat simplifies authorization but blocks “general recruiter inbox” without a job—acceptable per non-goals.

## Migration Plan

1. Deploy Prisma migration adding `Conversation`, `Message` (and optional `MessageRead` later) **before** enabling gateway in production.
2. Feature-flag or deploy **API + socket** together so clients do not hit missing routes.
3. **Rollback**: disable socket namespace / feature flag; DB tables can remain empty without breaking existing flows.

## Open Questions

- **Delegated recruiters**: If multiple recruiter accounts can manage one company’s jobs, should all see the same thread or only the job owner? *(Default MVP: job owner `Account` only.)*
- **Blocking users**: Should either side block the other? *(Defer.)*
- **Retention**: Legal hold / auto-delete policy for messages? *(Product/legal input.)*
