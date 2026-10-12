# Product scope and decisions

## Working direction

The existing roadmap targets web DIRECT/GROUP chat with durable history, realtime,
correct permissions and reconnect. Voice/video, E2EE, federation and multi-region
are excluded from that roadmap's default scope. These are planning assumptions;
T003 still owns final release scope.

## Scope for the first SDD slice

Spec 001 covers authorization when sending and reading room messages and connecting
a socket. Preserve the queued 202 success contract. Use the existing room-history
404 convention for authenticated users without membership. These bounded defaults
allow implementation without choosing the entire production architecture.

## Decisions outside that slice

| Question | Owner role | Backlog | Blocks |
|---|---|---|---|
| MVP features, self-chat, edits/deletes, retention, account deletion | Product owner | T003 | Related feature specs |
| Peak sockets, message rate, room sizes | Product + backend | T002 | Capacity/SLO decisions |
| Hosting, budget, operator | Product + operations | T004 | Deployment plan |
| Synchronous durable writes and outbox contract | Backend + product | T026 | Delivery spec |
| Token expiry and removal of active sockets | Backend + product | T038/T045 | Revocation/auth spec |
| Confirm SLO, RPO and RTO | Product + operations | T068 | Production release gates |

Roles are responsibilities, not claims that people have been assigned. The person
requesting a feature is the decision-maker until ownership is explicitly assigned.
An unanswered question blocks the affected feature, not unrelated backend work.
