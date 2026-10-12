# Implementation plan

## Approach

Separate read representation from write validation in chat/serializer.py so a
read-only sender object never replaces authenticated sender selection on writes.
Use a canonical serializer/helper for both REST and the task's saved Message.
Avoid duplicating DTO assembly between tasks.py and consumers.py. Use select_related
where appropriate to avoid one sender lookup per history item. Preserve permission
filters from 001 and read pagination wrappers.

Update the worker to retain the created Message and serialize its persisted fields.
Add the public envelope in the consumer without breaking the internal handler key.
After T001, update source-level client adapters; do not modify minified dist files.
A schema example is not a substitute for endpoint/event contract tests.

## Verification

Implement AC mappings in evidence.md. Exercise DRF serializers through authorized
HTTP requests and the worker-to-consumer event path. Assert field types, nullability,
privacy, UTC timestamps and legacy aliases. Test multibyte content and encoded body
limits independently. Run make check; add browser/build verification only after
frontend restoration and record the actual project commands. Keep AC-006 Pending
while source is unavailable.

## Rollout and rollback

Deploy additive server representations before the new client adapter. Existing
clients should continue reading aliases. Avoid any schema migration solely for a
null placeholder client_message_id; storage is owned by 004. Keep dual fields until
client compatibility is demonstrated; rollback the client first if reverting server
fields. Preserve the old queued write semantics throughout this spec.
