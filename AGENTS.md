# HockeyTryouts.ca agent operating rules

These rules apply to all automated Codex work in this repository.

## Mission

Complete one clearly scoped GitHub issue at a time. Prefer small, reviewable changes that improve reliability, usability, accessibility, responsive behavior, tests, SEO, performance, or maintainability.

## Required loop

1. Read the selected issue and inspect the relevant code before editing.
2. Implement only the issue's acceptance criteria.
3. Run the most relevant checks, including `pnpm lint` and `pnpm build` when practical.
4. Fix failures caused by the change and rerun the checks.
5. Leave the working tree with only the intended patch and report tests run.

## Safety boundaries

Stop without implementing and explain why if the task requires any of the following:

- payments, billing, pricing, or financial transactions
- authentication, authorization, secrets, or account access
- deleting or rewriting production data
- database migrations or destructive schema changes
- automatically approving or publishing crawler/import-review records
- deployment, DNS, production environment variables, or production configuration
- major architecture changes or replacing core infrastructure
- actions outside this repository

Never expose secrets, weaken security controls, bypass crawler safeguards, publish imported listings automatically, or modify unrelated user work.

## Engineering expectations

- Preserve existing behavior outside the issue scope.
- Follow existing Next.js, TypeScript, Supabase, and UI patterns.
- Validate user-controlled input at trust boundaries.
- Keep mobile and keyboard accessibility intact.
- Do not silence tests, lint rules, or type errors to make checks pass.
- Do not edit `AGENTS.md`, `.github/workflows/**`, or database migration files during automated backlog runs.
- If requirements are ambiguous or tests reveal an unrelated failure, stop and describe the decision needed.

