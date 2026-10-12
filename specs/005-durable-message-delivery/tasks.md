# Tasks

- [ ] Resolve Q1–Q3 and write/accept the T026 decision before changing write semantics.
- [ ] Add Message key and OutboxEvent migrations with legacy fixtures.
- [ ] Add transactional send, authorization race and idempotency tests (AC-001–003).
- [ ] Implement atomic write and retry responses using canonical DTO.
- [ ] Implement periodic claim/publish/retry/fencing and operational replay (AC-004–007).
- [ ] Run real worker/Redis/PostgreSQL crash and recovery tests; record failure evidence.
- [ ] Rehearse Q4 cutover and verify restored client/k6 compatibility (AC-008).
- [ ] Update baseline, contract docs and TODO tracking only after required evidence passes.
