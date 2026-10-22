<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All app data lives in localStorage under one versioned key via `src/lib/store.ts` (no backend); never change the key or drop fields without a migration, so user data survives updates.
- The exercise library has one source (`src/lib/exercises.ts`) plus custom exercises from the store; completed sessions store name snapshots so later edits never change history.
