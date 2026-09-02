# Generate Git Commit Message

Draft a commit message for the current changes. **Do not commit** unless the user explicitly asks.

## Gather context (run in parallel)

```bash
git status
git diff
git diff --cached
git log -10 --oneline
```

If the user cares about a specific base branch, also run `git diff <base>...HEAD` and include commits on the branch.

## Analyze

- Read **all** staged changes (and unstaged if the user might commit everything).
- If multiple unrelated topics, say so and suggest splitting commits — still draft one message for what is staged now.
- Match recent `git log` style (e.g. `feat(scope): …`, `fix: …`, `refactor: …`).
- Focus the message on **why**, not a file list.
- Do not propose committing secrets (`.env`, credentials, keys).

## Output format

Return:

1. **Recommended** — subject + optional body (HEREDOC-ready):

```
feat(scope): short imperative subject

1–3 sentences on why these changes belong together and what they fix or enable.
```

2. **Subject only** — one line if the change is small.

Use complete sentences in the body. Keep the subject ≤ ~72 chars when possible.

## Rules

- Never run `git commit`, `git push`, or stage files unless the user asks.
- If nothing to commit, say so plainly.
- If only lockfile/deps bumps with no functional change, say that in the message.
