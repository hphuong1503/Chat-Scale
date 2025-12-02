
# ADR-XXX: Write Message Async by 

**Date:** 2025-11-28
**Status:** Accepted

## Context

What problem forces this decision?
What constraints, risks, or scaling concerns drive it?
Keep it factual and measurable.

System handle milion write message per day coming from a lot of user, 
System can't deny the write message but must 
handle it in async way to improve performance and user experience.



## Decision

State the decision in one or two sentences.
Be explicit about technologies, patterns, constraints, and boundaries.

## Rationale

Why this option over the alternatives?
List the concrete reasons, not opinions.
Highlight trade-offs.

## Alternatives Considered

* Sync Architecture - API insert message to Database -> User must wait the message commit to DB then reponse -> Low latency
* Async by asyncio - Still wait


## Consequences

**Positive:**

* What becomes easier or more reliable.

**Negative / Costs:**

* New obligations, risks, or operational overhead.
* What future constraints this decision creates.

## Notes

Anything that clarifies intent, migration paths, or future revisit conditions.
