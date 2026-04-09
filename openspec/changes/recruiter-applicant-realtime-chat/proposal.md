## Why

Recruiters and applicants need a direct, timely channel to clarify roles, schedules, and expectations without leaving the platform. Email and external messengers fragment context and slow hiring. Adding **real-time, job-scoped chat** keeps conversations tied to each role, improves trust, and matches how modern job platforms operate.

## What Changes

- Introduce **conversations (chats)** scoped to a **job** when possible, linking **one recruiter-side participant** and **one applicant-side participant** (or their account identities).
- **Auto-create a chat** when an applicant **submits an application** to a job (if none exists for that job + pair).
- Allow a **recruiter to start a chat** with an applicant **in the context of a job** (e.g. from applicant list or job pipeline), creating the thread if needed.
- Deliver messages in **real time** (WebSockets or similar) with **persistence** in the database for history, search, and compliance.
- Expose **REST (or tRPC) APIs** for listing chats, message history, and sending; **WebSocket** for live delivery and typing/presence if in scope.
- **Authorization**: only participants of a chat can read/send; recruiters only for jobs they own or are assigned to; applicants only for their own applications/chats.

## Capabilities

### New Capabilities

- `job-messaging`: End-to-end behavior for job-scoped chats between recruiters and applicants—creation rules (on apply + recruiter-initiated), membership, message lifecycle, and real-time delivery contracts.

### Modified Capabilities

- *(none — no existing OpenSpec capabilities in `openspec/specs/`)*

## Impact

- **Backend (NestJS)**: New module(s) for chat (gateway, services, guards), likely **Socket.io** (already in dependencies per stack) or native WS; Prisma models for `Conversation`, `Message`, and links to `Job`, `Application`, `Account`.
- **Database**: New tables and indexes; optional soft-delete and read receipts later.
- **Frontend**: Chat UI (thread list, message pane), socket client, integration with job detail and application flows.
- **Infrastructure**: Redis adapter for Socket.io horizontal scaling if multi-instance; otherwise single-node acceptable for MVP.
- **Dependencies**: Possible additions: Redis (optional for pub/sub), no **BREAKING** changes to existing public APIs if versioned carefully.
