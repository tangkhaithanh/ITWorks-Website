## ADDED Requirements

### Requirement: Job-scoped conversation

The system SHALL maintain a **conversation** entity bound to exactly one `jobId` and exactly one applicant `accountId`. Each conversation SHALL represent the message thread between that applicant and the job’s authorized recruiter(s) as defined by access rules.

#### Scenario: Conversation is unique per job and applicant

- **WHEN** a conversation would be created for a given `jobId` and applicant `accountId`
- **THEN** the system SHALL return the existing conversation if one already exists, and SHALL NOT create duplicate conversations for that pair and job

### Requirement: Conversation on application

When an applicant submits an application to a job, the system SHALL ensure a conversation exists for that job and applicant (create if missing).

#### Scenario: Apply creates or reuses chat

- **WHEN** an applicant successfully applies to a job
- **THEN** a conversation SHALL exist linking that job and applicant account, and it SHALL be the same record if the applicant had already started a thread for that job

### Requirement: Recruiter-initiated conversation

A recruiter authorized for the job SHALL be able to open or continue a conversation with a given applicant for that job without a new application if business rules allow (e.g. prior contact or pipeline entry); the system SHALL still enforce job scope and participant rules.

#### Scenario: Recruiter starts chat from job context

- **WHEN** a recruiter requests to start messaging with an applicant for a specific job they are allowed to manage
- **THEN** the system SHALL create the conversation if none exists or return the existing one, and SHALL NOT expose the thread to unauthorized users

### Requirement: Real-time message delivery

The system SHALL deliver newly created messages to connected, authorized participants in near real time using a WebSocket-based gateway (e.g. Socket.io).

#### Scenario: Participant receives message live

- **WHEN** a participant sends a valid message in a conversation they belong to
- **THEN** the message SHALL be persisted and the other participant SHALL receive it through the real-time channel if connected

### Requirement: Message history

The system SHALL persist all messages with author, conversation, body, and timestamp, and SHALL provide paginated retrieval for authorized participants.

#### Scenario: History is private to participants

- **WHEN** an authorized participant requests message history for a conversation
- **THEN** the system SHALL return only messages for that conversation in chronological order according to pagination rules

### Requirement: Authorization

Only the applicant participant and authorized recruiter participant(s) for the job SHALL read or send messages in that conversation. All other requests SHALL be denied.

#### Scenario: Outsider cannot join conversation

- **WHEN** a user who is not a participant of a conversation attempts to read messages or connect to that conversation’s real-time room
- **THEN** the system SHALL reject the operation

### Requirement: Applicant and recruiter roles

Messaging features SHALL be available only to accounts with roles consistent with the platform’s recruiter and applicant (candidate) model; admins MAY have read-only audit access only if explicitly specified in a future requirement (out of scope for this spec unless added).

#### Scenario: Wrong role cannot impersonate participant

- **WHEN** a user whose role does not match the conversation’s expected recruiter or applicant participant attempts to act in that conversation
- **THEN** the system SHALL deny access
