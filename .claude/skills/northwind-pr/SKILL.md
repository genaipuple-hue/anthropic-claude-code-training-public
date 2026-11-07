---
name: northwind-pr
description: Write a pull request description in the Northwind team format — the repo's PR template plus a ticket-ID title, verification evidence with real command output, honestly ticked acceptance criteria and a "Deliberately not done" section — from the branch diff, git log and ticket. Use when the user invokes /northwind-pr or asks specifically for the Northwind team format or a "deliberately not done" write-up; /submit also follows it. For a plain "write the PR description" request, /pr applies.
---

# /northwind-pr

Write the pull request description for the work on this branch, in the Northwind team format.

A reviewer, and the grader, read this before the diff. Its job is to say, truthfully and quickly, what changed, how we know it works, and what was left out.

The team format is the repo's `.github/pull_request_template.md` (which the grader reads, so every section of it stays) with stricter rules for verification and criteria, and one added section, **Deliberately not done**.

## 1. Read before writing

Do all of this before drafting a single line. Do not guess at any of it. These are plain git commands; run each one on its own so they work in Bash and PowerShell alike.

1. **Find the base.** Compare against the branch the PR will target, not a possibly stale local `main`.
   1. Run `git remote`. If it lists `upstream`, the base remote is `upstream`; otherwise it is `origin`.
   2. Run `git fetch <remote> main`.
   3. If the fetch succeeds, `<base>` is `<remote>/main`. If it fails (offline, no access), tell the user, use `<remote>/main` if that ref exists or local `main` if not, and say in the description's reviewer notes that the base may be stale.
   4. If the user names a different target branch, use that instead.
2. **The diff:** `git diff <base>...HEAD --stat`, then `git diff <base>...HEAD`. This is what actually changed.
3. **The log:** `git log <base>..HEAD --oneline`. This is how the work was sequenced.
4. **What the PR will actually contain:** `git status -sb`.
   - Uncommitted changes are not in the PR. Mention them to the user and leave them out of the description.
   - If the branch is ahead of its remote, the unpushed commits are not on GitHub yet. Tell the user they need pushing (`/submit` does that).
5. **The ticket:** take the ticket ID from the branch name first (`NWP-101-export-options` → `NWP-101`). Use commit messages only if the branch name has none. If the branch and commits disagree, or several IDs appear, ask which one this PR closes. Then read `docs/tickets/<ID>.md` in full. If there is no ID, or no matching file, stop and ask the user which ticket this is. Do not write criteria from memory.
6. **The spec:** if `docs/specs/<ID>-*.md` exists, read it. Where the build departed from the plan, say so under Deliberately not done or Notes for the reviewer.

## 2. Collect the verification evidence

List every check that was actually run and its actual output. Valid sources:

- Commands run in this session, with the output you saw.
- Output the user pasted or told you, attributed to them ("the user reports…").
- Checks you run now, such as `npm test` or `npm run lint` in `build-battle/merchant-console/`. Ask first if a check is slow or has side effects.

Anything else is not evidence. A test file existing does not mean it was run. A passing CI check is evidence only if you have read its result (for example with `gh pr checks`).

## 3. Check each acceptance criterion

Copy the ticket's acceptance-criteria checkboxes **verbatim**, in order. For each one, find the code in the diff that implements it and the evidence from step 2 that shows it works.

- Implemented **and** verified by step-2 evidence: `- [x]`.
- Implemented but not verified: `- [ ]` with the note `— implemented, not verified: <what was not checked>`.
- Partly met: `- [ ]` with the note `— partial: <what is done, what is not>`.
- Not met: `- [ ]` with a short reason.

A ticked box means "met and verified", nothing less. An unmet criterion stated plainly is far better than one the reviewer finds on their own.

The template's three verification boxes (`npm test` passes, new behaviour is covered by a test, checked in the browser) follow the same rule: tick each only with step-2 evidence for it.

## 4. Write the title and the body

The **title** goes to the PR title, not into the body:

```
<TICKET-ID>: <what it does>
```

The ticket ID, a colon, then what the change does in a few words, in the imperative. Example: `NWP-101: add export options`.

The **body** uses exactly this shape. It is the repo template with its comments filled in, plus Deliberately not done:

```markdown
## Ticket

Closes <TICKET-ID>

## What changed

<One plain-language paragraph: what the app or the user can do now that they could not before, and why it matters. Not a list of files.>

## How I verified it

- `<command>` — <the actual result, e.g. "Test Files 3 passed (3) · Tests 35 passed (35)">
- <What was clicked or requested, and what appeared>

- [x] `npm test` passes
- [ ] New behavior is covered by a test
- [ ] Checked it in the browser

## Acceptance criteria

- [x] <criterion, verbatim>
- [ ] <criterion, verbatim> — partial: <what is done, what is not>

## Bugs fixed along the way

- `<file>`: <root cause, not just the symptom, and what changed>

## Deliberately not done

- <Out-of-scope item, follow-up found along the way, or unverified area, and why>

## Notes for the reviewer

<Trade-offs, open questions, anything you would say out loud in a review.>
```

Section guidance:

- **What changed:** one paragraph. Write it for a reviewer who has not read the ticket.
- **How I verified it:** the command or action, then what it produced. "Tests pass" is not enough; give the summary line. If nothing was run, write `Not verified yet.`, leave all three boxes unticked, and tell the user. Never fill this section with checks that could have been run.
- **Bugs fixed along the way:** only fixes that are in the diff and outside the ticket. Name the file and the root cause. If there are none, write `None.`
- **Deliberately not done:** anything the ticket marks out of scope that was respected, bugs found but not fixed (name the file and the cause), things that were not checked (for example dark mode, phone width), and stretch goals left out. If there is truly nothing, write `Nothing.`
- **Notes for the reviewer:** anything that does not fit above. If there is nothing, write `None.`

## 5. Hand it over

Write the body to a temp file and print the title and body for the user.

To open or update the PR, offer `/submit`: it pushes the branch to the user's fork and opens the PR against the right repository. **Ask before running it.** Opening a pull request is the user's decision.

## Rules

- **Never claim a verification step that was not run.** No command, output, click or result goes into "How I verified it" unless it came from step 2. No made-up test counts. When unsure, leave it out and say it was not verified.
- **Never tick a box without verification evidence from step 2.** Code in the diff alone is not enough. Partial is partial.
- **Do not paraphrase the acceptance criteria.** Copy them from the ticket.
- **Keep every template section.** The grader reads `.github/pull_request_template.md`; write `None.` rather than dropping a section.
- **Do not write before reading.** Steps 1 to 3 come before any drafting.
- **Plain language.** "Ops can choose which columns to export" beats "implemented column selection functionality".
- **Describe only what is on the branch.** Uncommitted changes and unrelated work stay out.
- **No filler.** Short paragraphs, real bullets, no summary of the summary.
