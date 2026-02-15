# Commands to Fix PR #68 Merge Conflict

## The Problem
PR #68 has merge conflicts with main and shows:
- mergeable: false
- mergeable_state: "dirty"

## The Solution
Merge main branch into the PR branch to resolve conflicts.

## Execute These Commands

```bash
# Navigate to repository
cd /path/to/Sistema-de-narra-o-de-livro

# Checkout the PR branch
git checkout codex/remove-book-select-in-character-wizard

# Merge main branch
git merge main

# This will create a conflict in:
# Frontend/WriterCenterFront/src/features/studio/components/CharacterWizard/CharacterWizard.tsx

# The conflict will look like this (around lines 239-354):
# <<<<<<< HEAD
# ... PR #68's version ...
# =======
# ... main branch's version ...
# >>>>>>> main

# RESOLUTION: Keep the structure from main but with min-h-0 class from PR
# The resolved version should have:
# - <div className="flex-1 min-h-0 overflow-hidden"> for content container (not just "flex-1 overflow-hidden")  
# - All step components inside this div
# - shrink-0 class on header, step indicator, error, navigation, notification divs

# After manually resolving the conflict, stage the file:
git add Frontend/WriterCenterFront/src/features/studio/components/CharacterWizard/CharacterWizard.tsx

# Complete the merge
git commit

# Push the updated branch
git push origin codex/remove-book-select-in-character-wizard
```

## Alternative: Use the Local Fix
If the local fix (commit 70ed33d) is available:

```bash
git push origin 70ed33d5ea5e9d15bf88a85672ba2c64f2ab6cf8:refs/heads/codex/remove-book-select-in-character-wizard
```

## Verification
After pushing, verify in GitHub that:
- PR #68 shows mergeable: true
- PR #68 shows mergeable_state: "clean"
- No conflicts are reported

## Files Changed in Merge
1. StudioPage.tsx (8 lines from PR #67)
2. TopBar.tsx (19 lines from PR #67)
3. CharacterWizard.tsx (conflict resolved as described)
