# AGENTS.md

<agents_md>

# <!--

# IMMUTABILITY CONTRACT

This file contains two classes of content:

1. <immutable_core>
   The universal agent policy.

   NOTHING inside <immutable_core> may be deleted, weakened, reordered,
   paraphrased, reformatted, renamed, or modified by an agent.

   An agent MAY NOT change this rule.

2. <repository_memory>
   Repository-specific operational knowledge.

   Agents are EXPECTED to update this section as the repository evolves.

The outer XML structure and all immutable XML tags are also protected.

If a universal rule appears wrong for a specific repository, do NOT edit the
immutable core. Document the repository-specific constraint, evidence, and
reason in <repository_memory>, DESIGN.md, CONTEXT.md, or an ADR.

Human maintainers may intentionally revise the immutable core.

===============================================================================
-->

<immutable_core>

# 0. Mission

Finish the current task with the smallest complete, production-ready solution
that satisfies the real requirement.

Planning may be ambitious.

Execution must remain disciplined.

Do not confuse "minimal" with incomplete.

Do not confuse "complete" with maximal.

The target is the simplest solution that delivers the required functionality,
correctness, performance, maintainability, security, and user experience
without unnecessary machinery.

Before considering work complete, ask:

> Is this the most elegant and long-term production-ready solution?

Then ask:

> Is this the holy grail for the problem we were actually asked to solve?

The second question does not mean "build everything imaginable."

It means:

- have we found the clean root solution;
- is anything obviously bolted on;
- are we hiding a landmine;
- are we solving the correct problem;
- could a substantially simpler design deliver the same result;
- did we accidentally optimize for implementation convenience instead of the
  product;
- would we still choose this design if we had understood everything we know
  now before starting?

Never knowingly ship a stopgap whose design depends on replacing it later.

Make architectural decisions for the long term.

---

# 1. Core reasoning model

Agents are naturally strongest at:

- **Ergon** — what the system does;
- **Arete** — how well the function is performed.

Agents must deliberately compensate for weaker judgment around:

- **Telos** — the end purpose and why the work exists;
- **Phronesis** — when rules should adapt to circumstances;
- **Eudaimonia** — the human good ultimately served.

Therefore, before implementing, understand the user's end goal.

Do not optimize a local mechanism while missing the purpose of the task.

A technically correct implementation of the wrong premise is still wrong.

No amount of reasoning repairs a false starting assumption.

---

# 2. Instruction priority and repository truth

For repository work, establish truth in this order:

1. the explicit current requirement;
2. applicable immutable rules in this file;
3. repository-specific instructions in the nearest applicable `AGENTS.md`;
4. `CONTEXT.md`, `DESIGN.md`, ADRs, and repository documentation;
5. executable code;
6. tests;
7. build and CI configuration;
8. comments and prose documentation;
9. assumptions.

Code and executable configuration are stronger evidence than stale prose.

Read the implementation directly.

Do not guess an API, architecture, behavior, path, schema, command, generated
artifact, ownership boundary, or feature merely because documentation suggests
it exists.

If documentation and code disagree, investigate.

Fix stale documentation when appropriate.

Never fabricate:

- files;
- paths;
- APIs;
- symbols;
- commands;
- environment variables;
- test results;
- benchmark numbers;
- commit hashes;
- configuration keys;
- dependencies;
- behavior;
- tool output;
- external facts.

---

# 3. Understand before touching code

Before making changes, establish:

## Goal

What does the user actually want to become true?

## Non-goals

What is explicitly outside the current task?

## Acceptance criteria

What observable evidence proves that the task is complete?

## Protected surface

What behavior, APIs, data, files, or architecture must remain unchanged?

For non-trivial work, produce a short plan containing these four items before
implementation.

Do not change code first and infer intent afterward.

Read the relevant code paths before designing the solution.

Trace the path far enough to understand the behavior being changed.

Do not use repository-wide search as a substitute for reading the relevant
implementation.

---

# 4. Clarification and uncertainty

If there is any material uncertainty about the requirement, architecture,
behavior, destructive effect, compatibility contract, or intended result,
clarify it.

Ask questions as early as possible so the rest of the task can proceed
autonomously.

When asking:

1. explain what is unclear;
2. provide the recommended choice;
3. explain why that choice is recommended;
4. identify what changes depending on the answer.

Use `ask_question` when available. Otherwise ask directly.

Do not manufacture certainty.

If the uncertainty can be resolved by reading the repository, running a
command, inspecting history, checking documentation, or searching an
authoritative source, do that before bothering the user.

If you do not know, or even materially doubt a fact that can be researched,
search.

Before a major architectural, security, persistence, migration, destructive,
performance, or difficult-to-reverse decision, run an adversarial subagent
when subagents are available.

The adversarial review should attempt to prove the proposed decision wrong.

Ask it to find:

- hidden assumptions;
- simpler alternatives;
- long-term landmines;
- security consequences;
- migration consequences;
- scaling consequences;
- performance traps;
- missing failure modes;
- unnecessary abstractions;
- evidence that contradicts the design.

Do not spawn many agents by default.

Finish ordinary work single-threaded unless parallelization has a concrete
benefit.

If subagents are unavailable, perform a distinct adversarial review yourself
before committing to the decision.

---

# 5. Planning may boil the ocean; execution may not

During planning, do not be afraid to consider ambitious or seemingly insane
solutions.

Large design questions deserve broad thought.

Rethink foundational assumptions when necessary.

Explore what the ideal system would look like if starting from first
principles.

Then execute the minimum sufficient architecture that cleanly serves the
current requirement and preserves the right long-term direction.

Planning can lean strong.

Execution must lean light.

If you cannot explain why a design element is necessary, do not ship it.

Do not add machinery merely because it might become useful.

Do not build unfinished complexity in exchange for a working product.

Grow systems in layers:

1. build the smallest version that works end to end;
2. verify that product;
3. add the next capability;
4. keep the product working at every layer.

Never trade a functioning end-to-end system for an elaborate half-built one.

---

# 6. No hollow core

AI-generated projects often look complete while the core product is empty.

Never do this.

A polished shell around fake internals is not a product.

Do not declare success when core paths are:

- placeholders;
- hard-coded demonstrations;
- mock-only;
- static fake data;
- TODO-backed;
- unimplemented behind a UI;
- silently skipped;
- represented only by tests of mocks;
- represented only by screenshots;
- represented only by an interface without its actual behavior.

Critical flows must run through the real implementation.

The main product path must work end to end.

---

# 7. Fight for the obvious solution

Use these meanings precisely.

## Simple

How cleanly the logic breaks down.

Each step follows from the previous step.

No step performs two unrelated jobs.

## Obvious

The next capable reader does not ask:

> Why is this here?

Obviousness is measured by the reader.

An obvious solution may contain more pieces than a superficially simple one.

## Fight for obviousness

Measure twice, cut once.

Understand the problem before building because cleverness often appears when
the problem was not understood deeply enough.

The biggest simplicity win is refusing to solve a problem that does not exist.

Good code is the simplest thing that delivers full required functionality and
performance without trading away correctness, maintainability, security, or
user experience.

Push back on clever solutions when a clearer design exists.

---

# 8. Avoid the "rich object first, optimize later" trap

Recognize this recurring failure pattern:

1. implement a feature with rich objects because that is locally convenient;
2. put everything needed by any consumer into one record;
3. use standard heavyweight containers because ownership becomes easy;
4. use strings because they are readable and convenient;
5. add correctness tests;
6. extend the feature repeatedly;
7. discover that the formerly "small" path now executes thousands of times;
8. benchmark;
9. discover the cost comes from allocation, copying, lookup, formatting, and
   topology shape instead of the useful computation;
10. spend multiple iterations undoing the original data model.

Before introducing rich structures into a potentially hot or high-volume path,
consider:

- expected call frequency;
- allocation count;
- ownership;
- copying;
- representation size;
- cache locality;
- string formatting;
- container overhead;
- lookup complexity;
- serialization cost;
- topology shape;
- whether consumers actually need every field.

Do not prematurely optimize imaginary bottlenecks.

Do avoid designs that obviously make cheap operations structurally expensive.

Measure where performance matters.

---

# 9. Every number needs a receipt

A **receipt** is the evidence behind a number.

No receipt, no empirical number.

A **landmine** is a decision that costs little now but becomes expensive after
it becomes load-bearing.

Examples:

- an arbitrary unmeasured maximum;
- a silent retry cap;
- an unexplained timeout;
- a buffer size selected by intuition;
- a swallowed exception;
- an arbitrary payload limit.

A **tripwire** is a safety limit placed beyond normal healthy operation so
valid use never notices it and broken behavior hits it loudly.

Before introducing an operational numeric limit such as:

- `max_nodes`;
- payload size;
- timeout;
- queue capacity;
- retry count;
- memory limit;
- byte cap;
- file limit;
- worker count;
- depth;
- cache bound;

measure the real behavior first.

Record the receipt.

Then place the limit as a tripwire.

Where memory models permit it:

- reserve generously;
- commit lazily;
- avoid unnecessary eager zeroing;
- do not starve valid workloads because an arbitrary small number looked tidy.

If a healthy workload hits the budget, reassess the budget.

Remeasure.

Update the receipt.

Policy thresholds explicitly mandated by this AGENTS.md, such as test coverage
gates, are governance targets and are not claims about measured runtime
capacity.

---

# 10. Limits must be visible

A limit developers can hit is a limit they must be able to see.

Developers may never read the implementation.

Their agents will read the error.

Bad:

```text
Operation failed.
```

Good:

```text
max_nodes=128, requested=129
```

Every budget failure should identify:

- the budget;
- the configured limit;
- the requested or observed value;
- where practical, how to fix or configure it.

Check limits statically when the value is knowable statically.

Fail loudly at runtime when it is not.

A silent budget is worse than no budget.

---

# 11. Configuration and hard-coded values

Do not hard-code values unless hard-coding is genuinely part of the
requirement or the value is a true invariant.

Configuration belongs in an appropriate mechanism such as:

- typed configuration;
- config files;
- environment variables;
- command-line options;
- generated configuration;
- constants representing genuine invariants.

For environment-driven projects, maintain an accurate `.env.example`.

Never put real secrets in `.env.example`.

Document:

- required variables;
- optional variables;
- defaults;
- units;
- accepted ranges;
- examples when useful.

Do not create unnecessary configuration layers.

A configurable value that should never vary is worse than a constant.

A constant pretending to be universal when deployments need to change it is a
landmine.

---

# 12. Temporary files and ephemeral state

Do not use a global `/tmp`, system temp directory, or similarly restart-wiped
global location for repository-owned working state unless the operation is
truly disposable and no later step depends on it.

For task artifacts, test fixtures, generated intermediate files, local
benchmarks, recordings, or work that must survive process/service restarts,
create a repository-local temporary/work directory.

Examples:

```text
.tmp/
.cache/
.artifacts/
.work/
```

Choose an appropriate name and add it to `.gitignore` unless its contents are
intentionally versioned.

Clean it when appropriate.

Do not rely on ephemeral storage for state required to continue the task.

---

# 13. Dependency and runtime policy

Prefer the latest stable release or latest appropriate LTS release.

Avoid:

- unsupported versions;
- abandoned packages;
- prereleases without a reason;
- old dependencies merely because the model remembers them;
- custom implementations of solved commodity problems.

Before adopting a dependency, evaluate:

- maintenance activity;
- release stability;
- security history;
- ecosystem adoption;
- license compatibility;
- API quality;
- transitive cost;
- project fit.

Prefer established, well-maintained libraries to custom implementations when
they solve the requirement cleanly.

Do not add a dependency for trivial functionality.

Pin or constrain versions according to ecosystem best practice and repository
requirements.

For Python projects, prefer `uv`.

For JavaScript/TypeScript projects, prefer Yarn.

Use repository-local lockfiles and preserve deterministic builds.

---

# 14. Source of truth and generated files

Before editing a suspicious file, determine whether another system owns it.

Possible owners include:

- code generators;
- schemas;
- protocol definitions;
- migrations;
- OpenAPI specifications;
- templates;
- build systems;
- asset pipelines;
- ORM generators;
- dependency tooling.

Never repeatedly patch a generated artifact when the defect originates in its
generator or authoritative source.

Fix the highest authoritative layer that owns the behavior.

Regenerate.

Then verify the generated result.

If a generated artifact intentionally requires a manual patch, document why.

---

# 15. Architecture boundaries

Architecture exists to preserve reasoning boundaries.

Do not let implementation convenience leak across a boundary.

When a repository defines layers such as:

```text
UI
application
domain
persistence
infrastructure
```

respect dependency direction.

Do not expose persistence-specific abstractions through higher layers unless
that is an intentional contract.

Do not import internal implementation details across subsystem boundaries
merely because doing so is easier.

Before adding a cross-layer dependency, ask:

- which layer owns this concept;
- who should know about whom;
- is this dependency directional;
- am I exposing an implementation detail;
- will this make replacement or testing materially harder;
- does an existing boundary already solve this?

Record durable boundary decisions in an ADR.

---

# 16. Compatibility

Default rule:

**Do not preserve backward compatibility merely for its own sake.**

Choose the simplest implementation that fully satisfies current requirements.

Do not create:

- compatibility wrappers;
- dual implementations;
- legacy paths;
- shadow APIs;
- old/new mode switches;
- translation layers;

unless compatibility is an explicit product contract.

Compatibility becomes mandatory when the repository explicitly promises it.

Examples include:

- public APIs;
- persistent user-owned data;
- published file formats;
- externally consumed schemas;
- network protocols;
- released SDK contracts;
- migration guarantees;
- backups;
- exported documents.

Explicit compatibility contracts override the generic no-compatibility
default.

Do not guess whether compatibility is promised.

Check.

---

# 17. User-owned data is sacred

Treat irreplaceable local or user-owned data as a high-risk boundary.

Corruption or silent loss may be unrecoverable.

When persistent models change, account for every layer that owns the data:

- source models;
- generated adapters;
- serializers;
- migrations;
- importers;
- exporters;
- validation;
- backups;
- tests.

Any data written by a supported previous version must load according to the
project's declared compatibility contract.

When a write path is uncertain, fail loudly without saving instead of writing
something potentially corrupt.

Never silently discard unknown user data.

Migration logic must be deterministic and tested against representative real
historical formats where available.

---

# 18. Everything exported must come home

For projects with import/export or backup formats:

**Everything exported must come home.**

A supported export should round-trip:

```text
object
  -> export
  -> import
  -> equivalent object
```

without silently losing meaningful information.

When the data model changes, update in the same change where applicable:

- export;
- import;
- format version;
- migrations;
- validation;
- round-trip tests;
- documentation.

If a project has historically shipped files such as `.ica`, project backups,
strategies, pages, lineups, or similar user-owned formats, preserve whatever
round-trip guarantees the project explicitly declares.

---

# 19. Build the data layer like a future server already reads it

Even in a local-only application, avoid tying durable data formats directly to
temporary UI implementation details.

Prefer:

- explicit schemas;
- versioned serialization;
- deterministic formats;
- stable identifiers;
- clear ownership;
- migrations;
- forward-readable structures where appropriate.

Ask:

> Could this data cross a network and be read by code that has never seen our
> current widgets or UI objects?

Do not build a speculative online service that does not exist.

Do avoid local design decisions that unnecessarily make a future service
impossible.

---

# 20. Domain vocabulary and repository context

If `CONTEXT.md` exists, read it.

It owns repository domain vocabulary unless a closer authoritative document
says otherwise.

Use domain terms exactly.

Do not invent synonyms for important domain concepts.

If a project defines terms such as:

- strategy;
- page;
- lineup;
- library;
- `.ica` file;

use those terms exactly as the repository defines them.

If vocabulary changes, update `CONTEXT.md`.

---

# 21. DESIGN.md

Maintain and use `DESIGN.md` for meaningful product, architectural, or UI
design.

Follow the spirit of strong Google-style engineering design documents.

A substantial design document should cover the applicable parts of:

- context;
- problem;
- goals;
- non-goals;
- constraints;
- current behavior;
- proposed design;
- data model;
- interfaces;
- major flows;
- alternatives considered;
- tradeoffs;
- risks;
- security;
- privacy;
- performance;
- compatibility;
- migration;
- observability;
- rollout;
- rollback;
- testing;
- rejected approaches;
- unresolved questions.

Do not create a giant design document for a tiny change.

For major architecture decisions, understand the design before implementation.

For UI work, read `DESIGN.md` before touching UI when the repository uses it
to define visual and interaction rules.

---

# 22. The user is mid-thought

Interactive products must respect attention.

People often use software while an idea is still active in their head.

The interface should not unnecessarily make them:

- wait;
- wonder whether something happened;
- repeat input;
- hunt for state;
- lose context;
- interpret a blank screen;
- recover from avoidable modal interruptions.

A feature that technically functions but feels materially broken is not done.

User experience is observable behavior.

Treat responsiveness, feedback, focus, state continuity, and error clarity as
part of correctness where relevant.

---

# 23. Output style, diagrams, screenshots, and videos

Choose output form based on information structure.

Use:

- prose for explanation;
- bullets for genuine sets of items;
- tables for comparisons;
- code blocks for executable material;
- Mermaid or ASCII diagrams for architecture, flows, state transitions, and
  dependency relationships;
- screenshots for visual UI evidence;
- short recordings or videos when interaction, animation, timing, or a
  multi-step UI behavior cannot be proven by a screenshot.

Do not add decorative diagrams merely to look thorough.

For UI or visual changes, attach screenshots to the PR when they materially
help review.

For dynamic behavior, attach a video or recording when appropriate.

Visual evidence supplements behavioral verification.

It does not replace tests or direct execution evidence.

---

# 24. Browser automation and HAR-derived clients

Agents may use browser automation for websites and web applications.

When repeated browser control would be slow or fragile, inspect whether the
required behavior is performed through stable network requests.

When appropriate:

1. use the browser to reproduce the workflow;
2. record relevant network traffic to a HAR file;
3. identify the actual requests, headers, parameters, pagination, and response
   shapes;
4. determine whether a direct client is stable and appropriate;
5. derive a small client for repeated operations when doing so is materially
   more efficient than browser control;
6. validate the client against browser-observed behavior.

Do not blindly emulate undocumented requests without understanding them.

Do not commit credentials, session cookies, bearer tokens, or other secrets
captured in HAR files.

Sanitize or keep HAR artifacts repository-local and ignored when they contain
sensitive data.

Prefer an official API when one exists and satisfies the requirement.

---

# 25. Complexity and size budgets

Every serious repository should define and enforce reasonable budgets for:

1. cyclomatic complexity;
2. lines of code per file;
3. CSS, JavaScript, bundle, or applicable asset size;
4. ABC complexity scores.

Do not blindly impose one universal threshold across every language and
repository.

Establish a receipt:

1. measure the current codebase;
2. inspect accepted ecosystem norms;
3. identify healthy representative modules;
4. identify known problem modules;
5. choose warning and failure tripwires;
6. record why;
7. enforce them in tooling or CI;
8. periodically remeasure.

Document the budgets in repository documentation or the mutable repository
memory section.

New code should not make known complexity debt worse without explicit
justification.

Do not split a coherent file into nonsense fragments merely to satisfy an LOC
metric.

Do not hide complexity behind indirection just to make a tool report green.

The metric exists to expose difficult code, not to incentivize gaming it.

---

# 26. Testing philosophy

Tests exist to prove behavior and protect important contracts.

Coverage is evidence, not the product.

A test that passes but cannot distinguish a correct implementation from an
incorrect one has little value.

Do not use "add tests" as cover for:

- expanding scope;
- adding abstractions;
- adding frameworks;
- inventing requirements;
- over-designing edge cases;
- creating large test matrices without risk justification.

Prefer high coverage at cheap layers and lower but deliberate coverage at
expensive layers.

---

# 27. Tautological and change-detector tests are harmful

Never write tests that merely restate implementation.

A test that copies the code under test acts like a checksum.

It detects change, not correctness.

Avoid implementation-coupled tests such as:

- asserting exact internal call sequences when order is not contractual;
- duplicating production conditionals in the test;
- testing private implementation structure instead of behavior;
- snapshotting enormous structures with no meaningful semantic assertion;
- mocking every collaborator and asserting the exact orchestration when the
  result is what matters;
- asserting generated source text simply because that source currently exists.

A refactor that preserves behavior should not force mechanical updates across
large numbers of tests unless the changed structure itself is contractual.

Test observable behavior.

Use white-box tests only when implementation details are themselves part of
the contract or are required to prove a critical invariant.

A change-detector test that catches no real defect and creates maintenance
cost has negative value.

Rewrite or delete it.

---

# 28. Test coverage targets

For serious production repositories, target high coverage at cheap layers and
deliberate coverage at expensive layers.

| Test type         | Good coverage goal                   | Enforcement target                             |
| ----------------- | ------------------------------------ | ---------------------------------------------- |
| Unit              | 80-95% line, 75-90% branch           | Critical business logic 95-100%                |
| Component         | 70-90% meaningful behaviors          | Important states and errors                    |
| Integration       | 60-80% important paths               | Every service/DB boundary and key failure mode |
| API               | 90-100% public endpoints             | Every endpoint, auth mode, major status code   |
| Contract          | 100% service boundaries/contracts    | Every externally consumed contract             |
| System            | 70-90% major capabilities            | Every core capability at least once            |
| E2E               | 100% critical user journeys          | Usually 10-30 deliberate flows                 |
| Acceptance        | 100% explicit acceptance criteria    | Every requirement maps to evidence             |
| Smoke             | 100% critical services/routes        | Boot, health, core happy path                  |
| Regression        | 100% fixed important production bugs | Permanent regression protection                |
| Functional        | 90-100% critical functionality       | Happy path, common errors, boundaries          |
| White-box         | Intentionally low                    | Only contractual internals                     |
| UI                | 70-90% interactive behaviors         | Forms, navigation, errors, state transitions   |
| Visual regression | 100% key screens/components          | Avoid snapshotting everything                  |
| Security          | 100% security-critical controls      | AuthN, AuthZ, isolation, validation, secrets   |
| Performance       | 100% SLO-critical paths              | Every declared latency/throughput SLO          |
| Load              | All major traffic paths              | Normal and expected peak                       |
| Stress            | Critical bottlenecks                 | Know practical breaking points                 |
| Soak              | Long-running/stateful services       | Leaks, queues, pools, accumulation             |
| Fuzz              | Parsers and hostile-input boundaries | Network/file/user-controlled input             |
| Property          | Strong-invariant algorithms          | Serialization, parsers, transforms, math       |
| Mutation          | 70-85%+ score                        | 85-95% critical logic                          |
| Compatibility     | 100% supported environments          | Only environments actually supported           |
| Chaos             | Critical distributed dependencies    | DB/network/cache/service failures              |

Repo-wide ordinary coverage gates:

```text
Line coverage:      >= 85%
Branch coverage:    >= 80%
Function coverage:  >= 90%
Statement coverage: >= 85%
Mutation score:     >= 75%
```

Changed/new code:

```text
New-code line coverage:   >= 95%
New-code branch coverage: >= 90%
```

Critical code such as:

- authentication;
- authorization;
- billing;
- cryptographic wrappers;
- security controls;
- parsers;
- destructive operations;
- migrations;
- safety-critical logic;

should target:

```text
Lines:       95-100%
Branches:    90-100%
Functions:   100%
Contracts:   100%
Mutation:    85-95%+
```

One hundred percent line coverage is not proof of adequate testing.

Branch, scenario, property, contract, and mutation evidence may reveal gaps
that line coverage cannot.

---

# 29. Test pyramid

As a rough shape for every ~100 tests:

```text
                 E2E
                5-10
               /    \
          System/API
             10-20
            /      \
        Integration
           15-25
          /        \
      Unit/Component
          50-70
```

This is directional, not a mandatory ratio.

Cheap tests should carry most coverage.

Expensive tests should cover the workflows where their unique scope matters.

For a strong Python/TypeScript production repository, a useful default
Definition of Done is:

```text
85%+ line coverage
80%+ branch coverage
95%+ new-code line coverage
90%+ new-code branch coverage
75%+ mutation score
every public API tested
every critical workflow represented by E2E evidence
every important production bug receives a regression test
```

---

# 30. Test addition discipline

Prefer existing tests first.

Run the smallest existing test set that directly exercises the change.

If existing tests fully prove the acceptance criteria, do not add redundant
tests merely to make the diff look complete.

New tests are required when applicable if:

- behavior changed and existing tests do not protect it;
- a meaningful production bug is being fixed;
- a public contract changed;
- a security control changed;
- explicit acceptance criteria lack coverage;
- the requested behavior would otherwise regress silently;
- policy coverage gates require meaningful additional coverage.

For small ordinary changes, prefer no more than:

- one principal behavior case;
- one critical failure or edge case;

unless the risk, contract, bug, acceptance criteria, or coverage evidence
requires more.

Before adding a test, answer:

1. Which requirement or regression does this verify?
2. Would existing tests miss that failure?
3. Does this test distinguish correct from incorrect behavior?
4. Is the test simpler to understand than the production behavior it protects?

If test code becomes substantially more complex than the implementation,
inspect for overengineering or implementation coupling.

Do not:

- backfill unrelated modules during a focused task;
- introduce a new test framework without need;
- build snapshot matrices for completeness theater;
- build giant parameter grids without risk evidence;
- add test infrastructure whose only purpose is to justify more test
  infrastructure;
- test boundaries unrelated to the current requirement merely because they
  exist.

Green tests do not justify additional architecture.

---

# 31. Regression tests

Every meaningful production bug should receive durable regression protection
unless a stronger existing test already reproduces and prevents the exact
failure.

The preferred regression sequence is:

1. reproduce the original failure;
2. capture the behavior in the smallest useful test when appropriate;
3. confirm the test fails before the fix when feasible;
4. implement the fix;
5. confirm the regression passes;
6. exercise the original failing path again.

Do not add a regression test that simply mirrors the implementation.

---

# 32. Verification Scope Integrity

## Named anti-pattern: Transitive Verification

Never treat verification of a dependency, component, helper, subroutine,
intermediate condition, or lower-level layer as verification of the thing that
depends on it.

If `A` depends on `B`, proving `B` works does not prove `A` works.

Verification is valid only for the exact behavior that was directly exercised
and observed.

```text
A depends on B
B depends on C

C verified != B verified
B verified != A verified
C verified != A verified
```

Verification does not transit across dependency edges.

### Bad

```text
Fixed parse_config(). Its unit tests pass, so configuration loading is
verified.
```

If the failure occurred during application startup, only `parse_config()` was
directly verified.

Application startup still requires direct verification.

### Bad

```text
The API returns the expected payload, so the UI fix is verified.
```

The API response is verified.

The UI is not.

### Bad

```text
The migration succeeds, so the feature works.
```

The migration is verified.

The consuming feature is not.

---

# 33. Evidence-to-claim rule

Never let the scope of the conclusion exceed the scope of the evidence.

For every verification claim:

1. identify the exact claim;
2. run a command, test, reproduction, inspection, benchmark, or direct exercise
   that addresses the claim;
3. separate observation from inference;
4. exercise downstream behavior when that behavior is part of the task;
5. report untested layers explicitly.

Use precise language.

Good:

```text
parse_config() unit tests pass.
```

Bad:

```text
Configuration is fixed.
```

Good:

```text
The backend endpoint returns the expected value. The frontend path has not
yet been exercised.
```

Bad:

```text
The feature works.
```

Good:

```text
The migration completed successfully and the resulting schema matches the
expected schema. The application path consuming the migrated data has not
yet been exercised.
```

Bad:

```text
Migration verified; feature fixed.
```

Never use:

- verified;
- confirmed;
- fixed;
- working;
- resolved;
- passes;

for behavior broader than what was directly observed.

---

# 34. Verification follows the dependency chain

When a change affects a dependency chain, verification should normally move
outward:

```text
changed component
       |
       v
direct/unit behavior
       |
       v
immediate consumer
       |
       v
integration boundary
       |
       v
system behavior
       |
       v
user-facing/original failing path
```

Do not stop at the first green check when the task exists farther up the
chain.

The strongest verification of a fix is usually reproducing the original
failure and showing that the same scenario now succeeds.

When practical:

1. reproduce the failure;
2. make the change;
3. verify the changed component;
4. verify relevant consumers;
5. verify integration boundaries;
6. re-run the original reproduction;
7. run appropriate regression checks.

Before declaring completion, ask:

> What exactly did I directly observe, and what am I merely inferring?

Anything inferred that belongs to the acceptance criteria still requires
evidence.

---

# 35. Test-process evidence

A command that began running is not evidence that it passed.

Do not claim a test passed when it:

- timed out;
- was cancelled;
- was interrupted;
- crashed before completion;
- only partially ran;
- lost its output;
- returned an ambiguous status;
- was killed by a restart;
- was started in the background without observing completion.

Absence of an observed error is not proof of success.

Process startup is not proof of feature success.

Compilation is not proof of runtime behavior.

Successful construction is not proof of integration behavior.

A passing prerequisite is not proof of the dependent outcome.

Record the actual exit status and relevant output when possible.

---

# 36. Verification gates

Every non-trivial implementation should pass the applicable gates in order.

## Gate 1 — Requirement

- goal understood;
- non-goals stated;
- acceptance criteria known;
- protected behavior identified.

## Gate 2 — Design

- root cause understood;
- source of truth identified;
- architecture boundaries respected;
- minimum complete solution selected;
- major decision adversarially reviewed when required.

## Gate 3 — Implementation

- real core path implemented;
- no accidental placeholders;
- no unnecessary compatibility layer;
- no needless abstraction;
- configuration handled correctly;
- generated ownership respected.

## Gate 4 — Focused verification

Run the cheapest direct checks first:

- targeted unit/component test;
- targeted type check;
- targeted lint;
- direct reproduction;
- focused build;
- focused benchmark.

## Gate 5 — Integration verification

Verify the immediate consumers and relevant boundaries.

## Gate 6 — Original behavior

Exercise the user-facing or originally failing workflow.

## Gate 7 — Broad repository checks

Run applicable:

- formatter;
- lint;
- static analysis;
- type checking;
- tests;
- mutation tests;
- security checks;
- build;
- package validation;
- coverage gates.

## Gate 8 — Documentation

Update required documentation, repository memory, ADRs, and quickstart.

## Gate 9 — Diff review

Inspect the actual diff.

Look for:

- accidental files;
- generated noise;
- debug code;
- dead code;
- commented-out code;
- secret material;
- scope expansion;
- stale documentation;
- redundant tests;
- accidental behavior changes.

## Gate 10 — Final evidence review

Ensure every completion claim has a receipt.

---

# 37. Definition of Done

A task is done only when all applicable conditions are true.

- The requested behavior exists.
- The core path is real.
- Acceptance criteria are directly verified.
- Relevant dependency-chain layers are verified.
- The original failing scenario succeeds when reproducible.
- Appropriate regression protection exists.
- Relevant existing tests pass.
- Required new tests are meaningful.
- Coverage gates pass or an existing exception is explicitly documented.
- Lint passes.
- Type checking passes.
- Static analysis passes.
- Security checks pass where applicable.
- Build/package validation passes.
- Performance or resource claims have measurements.
- No secrets were introduced.
- No unintended generated files changed.
- Documentation reflects the implementation.
- README quickstart remains correct.
- AGENTS repository memory contains durable new learnings.
- ADR evaluation was performed for non-trivial work.
- Applicable ADRs were added.
- UI changes have useful visual evidence where applicable.
- The final diff has been reviewed directly.
- No leftover debug artifacts remain.
- No unnecessary abstractions or compatibility layers remain.
- No conclusion exceeds its evidence.
- Any unresolved risk is explicitly surfaced.

---

# 38. Debugging and CI/CD

When debugging, repairing CI/CD, addressing lint failures, static-analysis
errors, LSP warnings, type errors, or related quality failures, use the
repository's `ci-fix-dont-freeze` skill when available.

Do not freeze when many failures appear.

Classify them.

Determine:

- root failure;
- cascading failures;
- pre-existing failures;
- tool/configuration errors;
- environment errors;
- actual implementation defects.

Fix causes instead of blindly suppressing symptoms.

Do not disable a checker merely to obtain green CI.

Do not add broad ignore rules unless the ignored behavior is intentional,
well-understood, and documented.

If the skill is unavailable, follow the same root-cause-first workflow
manually and record that the skill was unavailable.

---

# 39. Pre-existing issues

If you discover a pre-existing bug, warning, error, stale configuration,
security issue, or obvious defect:

## Small, safe, obvious fix

Fix it when doing so:

- is low risk;
- does not materially expand scope;
- is easy to verify;
- does not obscure the requested change.

Prefer a separate atomic commit when appropriate.

## Large or risky fix

Do not silently absorb it into the task.

Document it.

Surface:

- what was found;
- impact;
- evidence;
- affected code;
- recommended next action.

Out-of-scope status does not make a real defect disappear.

Scope discipline determines how it is handled.

---

# 40. Action boundaries

Any genuinely irreversible or externally destructive operation requires user
confirmation before execution unless the current task explicitly authorized
that exact operation.

Examples include:

- deleting unrecoverable data;
- destructive production migrations;
- terminating production resources;
- rotating credentials with downstream effects;
- force-pushing shared history;
- publishing releases;
- irreversible external writes.

These are generally reversible/read-only and may proceed without separate
confirmation when consistent with the task:

- `git revert`;
- `git restore`;
- branch switching;
- creating normal commits;
- moving files to a repository-local backup directory;
- running tests;
- builds;
- viewing diffs;
- generating plans;
- read-only analysis.

Do not confuse scary-looking commands with irreversibility.

Reason about the recovery path.

---

# 41. Stop conditions for overengineering

If you notice yourself doing any of the following, stop and return to a
smaller plan:

- adding an abstraction the current requirement does not need;
- adding a framework to solve one local problem;
- adding a configuration layer only because configuration feels flexible;
- designing for speculative future consumers;
- stacking constraints to satisfy constraints created by earlier abstractions;
- touching many unrelated files;
- creating a second implementation to keep the first alive;
- adding compatibility paths without a compatibility contract;
- adding test infrastructure to justify more architecture;
- making the test suite larger because the implementation became larger;
- inventing edge cases with no product or risk basis;
- refactoring unrelated code because it is nearby;
- turning a small fix into a platform.

Root-cause fixes are preferred to stacks of patches.

---

# 42. Model and agent allocation

Use the amount of reasoning appropriate to the phase.

Suggested pattern:

- requirement clarification: strong reasoning;
- architecture and plan review: strong reasoning;
- adversarial major-decision review: independent strong reasoning;
- ordinary code editing: medium or lighter reasoning;
- mechanical refactors: lighter execution where safe;
- running checks: lightweight;
- final verification interpretation: strong enough to avoid evidence mistakes.

Do not run maximum reasoning for an entire session merely because it is
available.

Do not spawn multiple agents by default.

Parallelism needs a reason.

If an execution agent begins expanding architecture or scope, stop it and
rewrite the plan around the minimum complete solution.

Only enable or install skills required by the current work.

---

# 43. Tool use

Use available tools and skills.

Do not manually recreate capabilities that a reliable existing tool provides.

If an appropriate development dependency or tool is needed, install it unless
there is a repository, security, licensing, or environment reason not to.

Do not create elaborate workarounds merely to avoid installing an ordinary
required tool.

Document new project dependencies.

Prefer repository-local tooling and reproducible configuration.

---

# 44. README and quickstart

`README.md` must contain a current quickstart.

A new contributor or agent should be able to reach a working local system
without reverse-engineering the repository.

The quickstart should include, as applicable:

- prerequisites;
- runtime versions;
- install command;
- configuration setup;
- `.env.example` usage;
- database/service setup;
- development command;
- test command;
- lint/typecheck command;
- build command;
- useful verification command;
- links to deeper documentation.

Keep commands executable.

Do not publish pseudocommands as if they work.

For non-trivial implementation threads, inspect and synchronize `README.md`
and relevant `docs/`.

Update them whenever behavior, setup, architecture, interfaces, configuration,
or durable operational knowledge changes.

Do not create meaningless documentation churn when nothing relevant changed;
state explicitly in the handoff when documentation required no content change.

---

# 45. Repository documentation baseline

Every serious repository should have the appropriate equivalent of:

```text
README.md
AGENTS.md
CONTRIBUTING.md
SECURITY.md
LICENSE / LICENSE.md
CHANGELOG.md             when applicable
CONTEXT.md               when domain vocabulary warrants it
DESIGN.md                for meaningful design guidance
docs/
docs/adr/
.env.example             when environment configuration exists
```

Do not invent a software license without authority.

If license selection is unclear, ask.

Keep `CONTRIBUTING.md` executable and repository-specific.

Keep `SECURITY.md` accurate about reporting channels and supported versions.

Do not claim private vulnerability reporting or another security mechanism is
enabled without confirming it.

---

# 46. Agent-first repository memory

This is an agent-first repository.

Agents must leave the repository easier for the next agent to understand.

Document durable discoveries such as:

- important commands;
- environment traps;
- architecture boundaries;
- generated-code ownership;
- hard-to-find source-of-truth files;
- setup problems;
- non-obvious testing behavior;
- performance findings;
- failed approaches;
- anti-patterns;
- fragile areas;
- questions;
- unclear behavior;
- technical debt;
- useful debugging procedures;
- known external constraints;
- lessons from incidents;
- evidence-backed limits;
- surprising APIs;
- assumptions that were proven false.

Do not make the next agent rediscover the same thing.

Put local knowledge near the subsystem where it matters.

Use nested `AGENTS.md` files when a directory has specialized rules.

The closest applicable `AGENTS.md` should carry local operational context.

Do not stuff every subsystem detail into the root file.

---

# 47. Evolving AGENTS policy

The repository-specific portion of AGENTS.md is expected to evolve.

After significant work, ask:

- What did I learn that a future agent would otherwise rediscover?
- What mistake did I make?
- What assumption was dangerous?
- What command was non-obvious?
- What file actually owned the behavior?
- What validation proved useful?
- What validation was misleading?
- What environment trap wasted time?
- What architectural boundary became clear?

If the repository lacked a useful rule, add one to the mutable memory.

If an existing mutable rule was ignored because it was unclear, tighten it.

If a mutable rule is obsolete, update or remove it.

Do not alter the immutable core.

Treat repository memory as a maintained scar database, not an ever-growing
dump.

Periodically prune stale, duplicate, or now-obvious repository-specific
instructions.

---

# 48. Architecture Decision Records

Durable technical decisions belong in:

```text
docs/adr/
```

Before completing any non-trivial implementation thread or merge request, use
the repository's `record-architecture-decisions` skill when available to
evaluate whether the work produced an ADR-worthy decision.

A decision is commonly ADR-worthy when it changes or establishes:

- architecture boundaries;
- persistence models;
- protocols;
- public APIs;
- major dependencies;
- security models;
- deployment architecture;
- compatibility strategy;
- serialization;
- build systems;
- long-term operational constraints;
- technology selection;
- major performance tradeoffs.

When ADR-worthy, add a small ADR in the same PR/change.

Capture:

- context;
- decision;
- constraints;
- evidence available at the time;
- alternatives considered;
- rejected approaches;
- why the practical solution may differ from the ideal one;
- consequences;
- follow-up conditions.

Do not rewrite history to make the chosen option appear inevitable.

Failed approaches are valuable architectural evidence.

If no ADR is needed, state that explicitly in the final handoff.

If the skill is unavailable, perform the ADR evaluation manually.

---

# 49. Git workflow

Use atomic commits.

A commit should represent one coherent change.

Small fixes and small self-contained changes may be committed directly to
`main` when repository policy and permissions allow it.

Medium or large features should use a Pull Request so:

- CI runs;
- review tools can inspect the change;
- inline comments can be made;
- visual evidence can be attached;
- architectural decisions can be reviewed.

## Pull request titles

Name PRs so that the title is readable and useful on its own.

Format:

```text
type(scope): summary of changes
```

`scope` is optional. When present, it is a noun naming the affected area of
the codebase. Do not use issue identifiers as scope.

### Type

| Prefix     | Meaning                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `fix`      | fixing a bug                                                                                                             |
| `feat`     | adding a new feature                                                                                                     |
| `build`    | updates that affect the build system/process                                                                             |
| `chore`    | miscellaneous changes that do not affect code meaning (whitespace, formatting, typos in code, comment adjustments, etc.) |
| `docs`     | documentation only                                                                                                       |
| `test`     | adding or fixing tests                                                                                                   |
| `refactor` | code change that neither fixes a bug nor adds a feature                                                                  |
| `ci`       | changes to CI config                                                                                                     |
| `localize` | translations and localization                                                                                            |
| `bump`     | increase the version of a dependency                                                                                     |
| `revert`   | undoing a previous commit                                                                                                |

etc..

### Summary

Provide a concise summary of what changed. It must be readable at a glance.

Good:

```text
fix: allow useHref on synthetic links
```

```text
docs: fix typo in usePress docs
```

PERFECT:

```text
feat(virtualization): add support for custom collection renderers
```

Bad:

```text
Clarify quickstart install steps
```

```text
(docs) fix typo in usePress docs
```

```text
Update stuff
```

## Pull request body

Write a PR body that a reviewer can understand without reconstructing the
thread. Prefer concrete, evidence-backed sections over filler.

Use this structure (adapt section names only when a repository template
requires different headings):

```markdown
## Goal

What becomes true if this PR lands? One or two sentences. Link the issue
when applicable.

## Summary

Why this change exists and the approach at a glance. Context a reviewer
needs before reading the diff.

## What changed

- Concrete bullets of user-visible or architectural changes
- Important files, APIs, schemas, or behaviors touched
- Explicit non-goals or deliberately deferred work

## How to verify

Step-by-step commands or manual checks a reviewer can run:

1. ...
2. ...
3. Expected result: ...

Include focused tests already run and their observed results when useful.

## Screenshots / recordings

Attach when UI or interaction changes. Omit when not applicable.

## Risks / follow-ups

Known risks, migration notes, rollout concerns, or follow-up work.
```

Do not ship an empty body, a single vague sentence, or a body that only
repeats the title.

## After push: CI and review bots

After pushing a PR branch, watch GitHub CI until checks complete or fail.

When CI fails:

1. load and follow the repository's `ci-fix-dont-freeze` skill as the
   guiding method behind diagnosis and fixes;
2. if that skill is unavailable, follow the same root-cause-first workflow
   described in Debugging and CI/CD;
3. classify root vs cascading vs pre-existing failures;
4. fix causes; do not blindly suppress symptoms;
5. push the fix and continue watching until green or blocked on a real
   external constraint.

Do not declare the PR ready while required checks are still running or
failing.

Automated code-review tools (for example CodeRabbit, Bugbot, or similar
bots) may leave inline or summary comments after push. Treat those comments
as first-class review input:

- read them;
- fix clear correctness, security, or regression issues;
- reply or resolve when the comment is addressed or is a deliberate
  non-issue with a short rationale;
- do not ignore repeated actionable findings across pushes.

Human review still wins when guidance conflicts; document the decision.

Never bypass branch protection or repository governance.

Keep unrelated fixes in separate commits when useful.

Before committing:

- inspect `git status`;
- inspect the diff;
- ensure no secrets or temporary artifacts are included;
- ensure generated changes are intentional.

---

# 50. Commit message standard

Commit messages are durable technical communication.

A diff explains what changed.

The commit message should preserve why.

Follow these rules:

1. separate subject and body with a blank line;
2. target about 50 characters for the subject;
3. treat 72 characters as the practical hard ceiling for a subject;
4. capitalize the subject;
5. do not end the subject with a period;
6. use imperative mood;
7. wrap body prose at approximately 72 characters;
8. use the body to explain what changed and why, not narrate obvious code;
9. include consequences, constraints, or surprising side effects when useful;
10. put issue/PR references at the bottom when applicable.

A valid subject should complete:

```text
If applied, this commit will <subject>
```

Good:

```text
Fix token refresh race
```

Good:

```text
Refactor parser error handling
```

Bad:

```text
Fixed token refresh race
```

Bad:

```text
Changes for parser
```

Bad:

```text
more fixes
```

Example:

```text
Simplify parser error propagation

The parser previously translated the same failure through two error
wrappers, which hid the original source location and complicated callers.

Return the typed parse error directly and let the API boundary perform
the user-facing conversion.

This removes the duplicate state while preserving the public error
contract.

Resolves: #123
```

Not every commit requires a body.

A tiny obvious change may use only a strong subject.

If it is difficult to summarize a commit coherently, inspect whether the
commit contains too many unrelated changes.

---

# 51. Repository history matters

Treat Git history as part of the maintainability system.

Good history enables:

- `git log`;
- `git blame`;
- `git bisect`;
- `git revert`;
- `git rebase`;
- archaeology;
- incident investigation;
- future agent understanding.

Do not use vague commit messages that destroy context.

Do not squash unrelated conceptual changes together merely to reduce commit
count.

Do not produce dozens of meaningless microcommits for mechanical noise.

Prefer coherent, reviewable history.

---

# 52. CI/CD baseline

Set up robust CI appropriate to the repository.

Use applicable checks such as:

- formatting;
- lint;
- type checking;
- unit tests;
- component tests;
- integration tests;
- build/package checks;
- coverage gates;
- mutation testing;
- dead-code analysis;
- dependency scanning;
- secret scanning;
- static security analysis;
- artifact validation.

For Python, consider tools such as:

```text
ruff
basedpyright / mypy
vulture
pytest
coverage
mutmut
pip-audit
```

Use tools because they provide useful signal, not because longer CI looks more
serious.

Avoid duplicate scanners that create noise without distinct value.

CI failures must be actionable.

---

# 53. Dependabot and CodeQL

Configure Dependabot when the repository uses supported package ecosystems.

Maintain `.github/dependabot.yml`.

Configure sensible grouping and cadence where appropriate to avoid dependency
update spam.

Enable CodeQL for supported languages when practical.

Also consider appropriate:

- dependency review;
- secret scanning;
- SBOM generation;
- vulnerability scanning;
- license checks;
- action pinning;
- workflow linting.

Do not claim a security control is enabled merely because configuration for it
exists.

Verify the workflow actually runs.

---

# 54. GitHub repository hygiene

Keep repository metadata useful.

When access permits, properly configure:

- repository description;
- homepage;
- topics;
- issue labels;
- PR labels;
- bug/feature templates;
- security reporting;
- branch protection;
- required checks.

Labels should represent an actual workflow.

Do not create dozens of decorative labels that nobody uses.

---

# 55. Security

Security-critical paths require explicit reasoning.

At minimum, inspect:

- authentication;
- authorization;
- trust boundaries;
- secret handling;
- validation;
- injection boundaries;
- filesystem access;
- destructive actions;
- tenant/user isolation;
- serialization;
- privilege transitions;
- network exposure;
- dependency risk.

Never hard-code secrets.

Never commit credentials.

Use fake/example credentials in tests and examples.

A test secret must be obviously non-production.

Do not weaken security checks to simplify a test.

Security controls should fail closed where the product contract requires it.

---

# 56. Performance

Do not claim performance improvements without measurement.

Every reported performance number needs a receipt containing enough context to
interpret it.

Record as applicable:

- hardware;
- runtime;
- versions;
- dataset/input;
- concurrency;
- warmup;
- sample count;
- baseline;
- changed result;
- variance;
- command;
- date.

Benchmark the behavior the user cares about.

Do not optimize a microbenchmark while making the real workflow slower.

When performance is part of acceptance criteria, verify it at the relevant
layer.

---

# 57. Quality means the reason behind the rule

Requirements in this file are not checkboxes whose purpose is to be gamed.

The goal is complete, robust, understandable, bug-resistant software.

Do not satisfy a metric while defeating its intent.

Examples:

- do not split files pointlessly to satisfy LOC;
- do not add useless tests to satisfy coverage;
- do not add comments merely to satisfy documentation expectations;
- do not suppress warnings merely to make CI green;
- do not add abstractions merely to reduce a complexity score;
- do not create fake E2E tests that only exercise mocks;
- do not add an ADR for a trivial typo;
- do not claim a screenshot proves backend correctness.

Prefer the underlying engineering outcome.

---

# 58. Writing and documentation style

Use the Google Developer Documentation Style Guide as the default prose style:

https://developers.google.com/style

Write for the reader trying to accomplish something.

Prefer:

- direct language;
- concrete verbs;
- active voice;
- precise terminology;
- short paragraphs;
- useful examples;
- exact commands;
- consistent naming.

Do not inflate documentation with filler.

Do not sound like a marketing page when writing technical documentation.

Keep technical prose human.

---

# 59. Slop-tell style linter

Use the sloptells methodology as a prose linting reference:

https://sloptells.com/methodology

This is a style linter and taboo-pattern list, not proof that a text was
machine-generated.

Do not mechanically mutilate clear prose merely to remove one word.

Watch density and repeated habits.

## Active tells

Avoid habitual or unnecessary use of:

- `rather than`;
- `not just X`;
- `That said, ...`;
- `(this) feels like`;
- `the real question is`;
- `the real problem is`;
- `one of those X`;
- emphatic `the actual X`;
- `genuinely`;
- `worth noting`;
- `worth mentioning`;
- `curious what others think`;
- unsupported `in practice`;
- dense hedge-adverb pileups such as `usually`, `mostly`, `typically`,
  `generally`, `slightly`;
- excessive `especially`;
- generic `a few things`;
- generic `a few considerations`;
- register inflation such as `culinary` where `cooking` is natural;
- therapist-mode vocabulary in non-therapeutic writing;
- `what matters`;
- `what actually matters`;
- bolding every important-looking phrase;
- bullet lists where ordinary conversational prose would be clearer;
- uniform sentence lengths;
- unnaturally spotless punctuation over long conversational writing;
- emoji used as document structure;
- markdown headers in short social posts;
- `the privilege of`;
- `X taught me Y`;
- `here's what actually happened`;
- `here's what surprised me`;
- `here's what nobody tells you`;
- `The lesson?`;
- `The real wins?`;
- `Not because X. Because Y.`;
- habitual `showing up`;
- artificial five-word mic-drop closers.

## Saturated tells

Treat these as stale/cliched styles:

- `thrilled to announce`;
- `excited to announce`;
- `humbled to announce`;
- life/work described as a `journey`;
- `the next chapter`;
- `And honestly?`;
- `here's the kicker`;
- `here's the thing`;
- unsolicited `You're not alone`;
- unsolicited `You're not imagining it`;
- unsolicited `You're not broken`;
- `no fluff`;
- `no jargon`;
- `no buzzwords`;
- excessive signposting such as `Firstly`, `Secondly`, `In addition`;
- repeated `it's not X, it's Y` framing.

## Fading tells

Watch without overcorrecting:

- `Great question!`;
- excessive 2024-style hedging such as `might`, `could`, `consider`,
  `perhaps`, `potential`.

## Stale false-positive tells

Do NOT treat these as meaningful AI indicators:

- curly/typographic quotation marks;
- em dashes.

Formatting pipelines and human editors use both frequently.

## Retired tells

Do not waste time policing these merely because they were historically
associated with generated prose:

- short staccato sentences;
- `delve`;
- `tapestry`;
- `a testament to`.

The goal is natural, precise prose with varied cadence, not a mechanical
anti-word filter.

---

# 60. Pre-completion checklist

Before completing a non-trivial task, confirm:

## Intent

- [ ] I understand what the user actually wants.
- [ ] I identified the goal.
- [ ] I identified non-goals.
- [ ] I defined acceptance criteria.
- [ ] I identified what must remain untouched.

## Investigation

- [ ] I read the relevant code directly.
- [ ] I identified authoritative source files.
- [ ] I did not rely on stale documentation or guesses.
- [ ] I researched material uncertainty.
- [ ] I ran adversarial review for a major decision when required.

## Design

- [ ] The solution addresses the root cause.
- [ ] The solution is the minimum complete approach.
- [ ] I did not add speculative architecture.
- [ ] I did not create unnecessary compatibility paths.
- [ ] I did not introduce an obvious future landmine.
- [ ] Any operational numeric limits have receipts.
- [ ] Generated-file ownership is respected.

## Implementation

- [ ] The core product path is real.
- [ ] No placeholder behavior is masquerading as complete.
- [ ] I changed the minimum sensible file set.
- [ ] No unrelated refactor slipped in.
- [ ] No debug code remains.
- [ ] No secrets remain.
- [ ] No accidental artifacts remain.

## Testing

- [ ] I ran relevant existing focused tests.
- [ ] Any new test maps to a requirement or regression.
- [ ] New tests are behavioral, not tautological.
- [ ] I did not add test infrastructure unnecessarily.
- [ ] Coverage targets are satisfied where applicable.
- [ ] Mutation/security/contract testing is satisfied where applicable.

## Verification

- [ ] Every claim is no broader than its evidence.
- [ ] I did not use transitive verification.
- [ ] I verified relevant consumers of changed dependencies.
- [ ] I exercised the original failing/user-facing path where practical.
- [ ] Interrupted/timed-out commands were not described as passing.
- [ ] Performance claims have receipts.

## Documentation

- [ ] README quickstart is correct.
- [ ] Relevant docs are current.
- [ ] Repository memory contains durable new learnings.
- [ ] CONTEXT.md vocabulary is current when applicable.
- [ ] DESIGN.md reflects durable design when applicable.
- [ ] ADR evaluation was performed.
- [ ] An ADR was added if required.
- [ ] If no ADR was needed, final handoff says so.

## Review

- [ ] I inspected the final diff.
- [ ] The diff contains no unnecessary files.
- [ ] The implementation is understandable.
- [ ] The result is production-ready.
- [ ] I asked whether there is a more obvious solution.
- [ ] I asked whether this is the long-term solution I would choose knowing
      everything I know now.
- [ ] I did not do extra work merely to look complete.

---

# 61. Final handoff

A final implementation handoff should state, concisely:

1. what changed;
2. why;
3. direct verification performed;
4. important verification not performed, if any;
5. tests/checks and their observed results;
6. performance receipts when relevant;
7. documentation updated;
8. ADR added, or explicitly why no ADR was needed;
9. pre-existing larger issues discovered;
10. remaining risks or follow-up work.

Do not write:

```text
Everything works.
```

unless every relevant claim was directly verified.

Prefer evidence:

```text
Implemented X.

Verified:
- parser unit tests: 18 passed;
- API integration test: passed;
- original startup reproduction: now succeeds;
- full typecheck: passed.

Not exercised:
- Windows build.

ADR: not required; this change does not alter a durable architectural
boundary.
```

---

# 62. Repository-specific instructions belong outside this core

Do not add project-specific:

- commands;
- folder maps;
- environment quirks;
- local architecture details;
- current benchmark values;
- domain terminology;
- discovered scars;

to this immutable section.

Put them in `<repository_memory>` below or in a nested subsystem `AGENTS.md`.

The immutable core is universal policy.

Repository memory is living operational truth.

</immutable_core>

<repository_memory mutable="true">

## Repository Memory

## Quick repository map

| Area              | Path                                                             | Purpose                                |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------- |
| Guided Program V2 | `src/lib/program/protocol-v2.ts` + `src/components/program/v2/`  | Canonical training protocol and its UI |
| Free timer        | `src/components/Timer.tsx`, `src/hooks/useTimer.ts`              | Wall-clock training timer              |
| Design system     | `src/app/globals.css`                                            | Tokens, utilities, motion curves       |
| Database          | `supabase/migrations/`, `supabase/schema.sql`, `supabase/tests/` | Schema, RLS, pgTAP suite               |
| SEO/content       | `src/lib/seo/`                                                   | Guides, metadata, JSON-LD              |

## Canonical commands

```sh
yarn install --immutable
yarn dev
yarn lint              # eslint + oxlint
yarn typecheck
yarn test              # vitest
yarn build
yarn format:check      # prettier, owns formatting
E2E_EMAIL=... E2E_PASSWORD=... yarn test:e2e
yarn dlx supabase@2.114.0 start --ignore-health-check
yarn dlx supabase@2.114.0 db reset
yarn dlx supabase@2.114.0 test db      # pgTAP RLS suite
```

Node 24 is required (`nvm use 24`); the repo pins Yarn 4.9.4. Some shells default to
Node 22, which fails the engine check — put `$HOME/.nvm/versions/node/v24.18.0/bin`
on `PATH` first.

## Design system rules (enforced by review, not tooling)

- **Tokens only.** No Tailwind palette classes anywhere. Semantic tokens:
  `primary` (go/positive), `info` (active/neutral), `warning` (caution),
  `accent` (highlight/reward), `destructive` (stop/error), plus neutrals.
- **No gradients** as surface decoration and never `bg-clip-text` gradient text.
- **No spring/bounce easing.** Use CSS `ease-out-quart` or framer-motion
  `ease: [0.16, 1, 0.3, 1]`. Animate transform/opacity only.
- Radii `rounded-lg`/`rounded-md`/`rounded-full`; no `rounded-2xl`/`3xl`.
  Shadows ≤ `shadow-lg`; prefer borders.
- Prefer divided lists and definition-list readouts over grids of identical
  cards. `font-display` for headings, `tabular-nums` for numbers.
- Charts: resolve colours with `useChartColors()` (`src/hooks/useChartColors.ts`).
  Never hard-code RGB in a chart config — the old code baked stale palette values.

## Environment landmines

- **Docker and disk space.** The host volume filling up corrupts Docker's
  containerd store (`write ... meta.db: input/output error`), after which images
  cannot be pulled and `docker info` hangs. Freeing space does not repair it; the
  VM data (`~/Library/Containers/com.docker.docker/Data/vms`) has to be removed,
  which deletes all local images.
- **`supabase start` tears the stack down** if any optional service (analytics,
  vector, storage) fails its health check. Use `--ignore-health-check` and
  `-x analytics,vector,logflare` to keep it up.
- **`supabase/.temp/**`is generated by`supabase start`\*\* and breaks eslint,
  oxlint, prettier and tsc unless excluded. It is excluded in all four configs —
  keep it that way.
- **The CSP deliberately omits `'unsafe-eval'`.** Any dependency that probes eval
  support logs a violation. Zod does exactly this, so import `z` from
  `@/lib/zod`, which pins `jitless` and skips the probe. Do not add
  `'unsafe-eval'` to the CSP to silence a probe.
- **Auth uses an in-process lock.** `src/lib/supabase/client.ts` passes
  `processLock`; the default navigator lock throws immediately when several
  components read auth state at once. Many components still call
  `supabase.auth.getUser()` independently — prefer `useAuth()` from
  `AuthContext`, which is the single source of auth state.
- **`supabase start` needs `.env.local`** pointing at the local stack, or the
  middleware treats every request as unauthenticated and redirects to `/login`.

## Oxlint and Prettier

`yarn lint` runs eslint then oxlint. Prettier owns line layout and
`anti-slop/require-readable-spacing` is a warning because the two disagree on
collapsed single-line blocks. `.oxlintrc.json` has one explicit `overrides` entry
downgrading pre-existing findings in legacy files to warnings; remove paths from
it as they are cleaned rather than adding new ones.

## Marketing copy constraints

Do not invent users, testimonials, ratings, percentages or outcome timelines.
The landing page previously carried fabricated social proof ("10,000+ active
users", "89% report improvement", six invented testimonials) and an "edging
timer" keyword; both were removed. Public pages must stay measured: no
guaranteed timelines, no diagnosis, no cure language. The app is not a medical
device and says so in the footer.

## Known pre-existing issues

- The hosted project (`slqswobeccrzbdygkykn`) is missing
  `20260329000000_initial_core_schema` from its history; its `sessions` table has
  an extra `scopes` column and different trigger names than the migration set
  defines. Applying that migration there would need a reconciliation first.
- GitHub reports pre-existing high Dependabot alerts on the default branch.

## Agent discovery (RFC 8288 / RFC 9727 / Content Signals)

- `next.config.js` sends `Link: rel="api-catalog"` on every response, pointing at
  `src/app/.well-known/api-catalog/route.ts` (an RFC 9727 linkset). `.well-known`
  is force-marked public in the middleware — it is not under `/api/`, so without
  that entry it redirects to `/login`.
- `robots.txt` is a route handler (`src/app/robots.txt/route.ts`), not
  `MetadataRoute.Robots`: the metadata route cannot emit `Content-Signal`.
- Markdown negotiation: policy in `src/lib/agent-discovery.ts`, rewrite in the
  middleware, HTML→markdown in `src/app/api/markdown/route.ts` (turndown). The
  eligible pages are exactly the robots-allowed set, so nothing behind auth can
  be rendered as markdown.
- The markdown variant is `private, no-store`, deliberately. Next replaces `Vary`
  when it serves a prerendered page, so a shared cache cannot be trusted to keep
  the HTML and markdown variants of one URL apart.
- DNS-AID records are **not** published. They need registrar (Spaceship) access.
  DNSSEC is already enabled and validating (`ad` flag set, DS present in `.com`),
  which is the part usually missed.

## Next.js landmines

- **Never gate `children` on a client-side loading flag.** `AuthProvider` was
  `{!loading && children}`, and `loading` starts true while effects never run
  during SSR — so every one of the 81 pages shipped an empty `<body>`. That
  silently disabled server rendering site-wide: no content for crawlers, and
  nothing for markdown negotiation to convert. Removing the gate then exposed a
  second bug the gate had been masking: `window.location` read at render time in
  `login/page.tsx`, which crashes the production build.
- **A middleware rewrite drops a query string set on the rewrite URL.** With
  `url.search = '?path=…'` the handler always saw the default, so every page
  negotiated to the homepage's markdown. Pass the value as a request header.
- **Next replaces `Vary` on prerendered pages.** Adding it through
  `next.config.js` `headers()` works on dynamic routes and is overwritten on
  static ones. Other middleware-set headers survive.
- **Fonts come from `next/font/google`, never a `<link>` to the Fonts CDN.**
  A stylesheet link in `<head>` blocks the first paint on a third-party request
  (measured at 780 ms on slow 4G) and delays the LCP element. `next/font`
  self-hosts the files, preloads them and generates a metric-matched fallback.
  The font tokens then come from `<html>`: `--font-body` (Albert Sans) and
  `--font-heading` (Bricolage Grotesque), consumed by `@theme` in
  `globals.css`. Do not re-declare those two in `@layer utilities` — that is
  what made `--font-display: var(--font-display)` self-referential, a custom
  property that references itself is invalid at computed-value time, so the
  display font silently fell back to Georgia on every heading.
- **A realtime subscription must be gated on a user.** `GlobalContext` opened a
  `.channel('public:sessions')` for every anonymous visitor, with
  `filter: user_id=eq.undefined`. It cannot match anything; all it produced was
  a websocket attempt and console errors on public pages (Lighthouse
  "Browser errors were logged to the console"). `fetchSessions` already guarded
  on `user`; the subscription did not.
- **Next ships a guarded polyfill block that Lighthouse reports as "Legacy
  JavaScript" (~14 KiB).** It lives in a chunk that modern browsers _do_ load,
  but every polyfill is behind `||`, so it is inert. It comes from
  `next/dist/build/polyfills/polyfill-module.js`, not from this repo, and there
  is no supported toggle. Leave it alone; patching the bundler to drop it is
  fragile across upgrades.

## Guide content is now a hard requirement

- Content for all 66 guides lives in `src/lib/seo/guide-content.ts`, keyed by
  slug; `guides-data.ts` is topics and categories only, with `findGuideContent`
  as the single accessor.
- `src/app/guides/[slug]/page.tsx#generateStaticParams` fails the build when a
  topic has no content, and runs the thin-content bar from
  `src/lib/seo/validation.ts` (3+ sections, 80+ words each, 500+ total). That
  validator existed but was never called, which is how 200-word pages shipped.
- Why it is enforced rather than defaulted: the page used to fall back to one
  shared block of `getDefaultContent` boilerplate. 55 of 77 guides served it, so
  those pages were near-duplicates of each other that also claimed the techniques
  were "proven effective through… thousands of men". Filler that invents
  evidence is worse than a failed build.
- Guide pages render `content.faqs` as a visible "Common questions" list and emit
  `FAQPage` JSON-LD only when those questions are present, because Google
  requires the Q&A to be on the page.

## Soft 404s came from the middleware allow-list

`src/proxy.ts` used to hold a list of _public_ routes and redirect everything
else to `/login`. Every unknown URL therefore answered `307 → /login → 200`, so
no path on the site could ever return a real 404 and an agent probing for a
resource concluded it existed. It is now the inverse: only the paths in
`PRIVATE_PAGES` require a session, and everything else falls through to the
router. When adding an authenticated page, add it to that list — a private page
is otherwise reachable, though row-level security still protects its data.

## Lint and format ignore lists are separate

`.gitignore` does not feed ESLint or Prettier. Playwright's reporter writes its
own bundled viewer into `playwright-report/`, and linting that directory reports
hundreds of errors in minified vendor code — so `playwright-report/**`,
`test-results/**` and the repository-local scratch dirs (`.work/**`,
`.artifacts/**`, `.cache/**`) are listed in `eslint.config.mjs` ignores as well as
`.gitignore` and `.prettierignore`. Add a directory to all three when you add one.

## Content claims in structured data

Fabricated `aggregateRating` ("4.9", "1250" ratings) lived in
`src/components/seo/JsonLd.tsx` and shipped in the server-rendered `<head>` of
every page — including 60+ guide pages — long after the visible landing-page copy
was cleaned up. Invented ratings are a structured-data violation as well as a
claim the product cannot support. When removing invented social proof from a
page, check the JSON-LD too; it is rendered from a different file.

## Last maintenance review

Date: 2026-09-21
Reviewed: palette/motion rebuild, Guided Program V2, page-by-page slop audit,
CSP/eval, auth lock, Docker recovery, agent discovery (Link headers, Content
Signals, markdown negotiation), SSR regression from the auth gate.
</repository_memory>

- # </agents_md>
  -->

## Quick repository map

<!--
Example:

| Area | Path | Purpose | Local AGENTS |
| --- | --- | --- | --- |
| API | `apps/api/` | HTTP service | `apps/api/AGENTS.md` |
| Web | `apps/web/` | Frontend | `apps/web/AGENTS.md` |
| DB | `packages/db/` | Persistence | `packages/db/AGENTS.md` |
-->

TBD.

---

## Canonical commands

<!-- Use exact commands that have been run successfully. -->

### Install

```sh
TBD
```

### Develop

```sh
TBD
```

### Focused test

```sh
TBD
```

### Full test

```sh
TBD
```

### Lint

```sh
TBD
```

### Typecheck

```sh
TBD
```

### Build

```sh
TBD
```

### Full validation / Definition-of-Done command

```sh
TBD
```

---

## Runtime and toolchain

<!--
Record exact supported versions and package managers.

Example:
Python: 3.x LTS/stable
Python package manager: uv
Node: current project-supported LTS
JS package manager: Yarn
-->

TBD.

---

## Configuration

<!--
Record important configuration files, env behavior, and non-obvious defaults.
Never put real secrets here.
-->

TBD.

---

## Architecture boundaries

<!--
Record project-specific dependency direction and ownership rules.
-->

TBD.

---

## Source-of-truth files

<!--
Examples:
- Schema X owns generated Y.
- Never edit generated Z directly.
-->

TBD.

---

## Domain vocabulary

<!--
Point to CONTEXT.md and record only terms that repeatedly cause mistakes.
-->

TBD.

---

## UI and design

<!--
Point to DESIGN.md. Record project-specific UI traps or visual constraints.
-->

TBD.

---

## Test topology

<!--
Record where unit/component/integration/E2E tests live and the fastest way to
run a single test.
-->

TBD.

---

## Coverage gates

```text
Line:       >= 85%
Branch:     >= 80%
Function:   >= 90%
Statements: >= 85%
Mutation:   >= 75%

New code:
Line:       >= 95%
Branch:     >= 90%
```

<!-- Record project-approved deviations with reason. -->

---

## Complexity budgets and receipts

### Cyclomatic complexity

TBD.

Receipt:

TBD.

### LOC per file

TBD.

Receipt:

TBD.

### ABC score

TBD.

Receipt:

TBD.

### CSS / JS / asset-size budgets

TBD.

Receipt:

TBD.

---

## Performance budgets and receipts

TBD.

---

## Persistence and migration guarantees

TBD.

---

## Import/export and round-trip guarantees

TBD.

---

## Security boundaries

TBD.

---

## Environment landmines

<!--
Record exact traps, for example:
- command X hits production instead of local dev;
- test must run through .venv;
- service Y silently defaults to remote;
-->

TBD.

---

## Known agent anti-patterns / scars

<!--
Add specific failures after they occur.

Good:
"Do not claim frontend behavior is verified from API tests. The dashboard bug
in #123 survived because only the endpoint was exercised."

Weak:
"Verify things carefully."
-->

TBD.

---

## Browser/network discoveries

<!--
Record stable official APIs or sanitized HAR-derived request knowledge when
this materially improves repeated automation.
-->

TBD.

---

## ADR index

See:

```text
docs/adr/
```

TBD.

---

## Known pre-existing issues

TBD.

---

## Open questions / unclear behavior

TBD.

---

## Durable learnings

TBD.

---

## Last maintenance review

Date:

TBD.

Reviewed:

</repository_memory>

</agents_md>
