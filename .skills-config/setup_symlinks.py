#!/usr/bin/env python3
import os
from pathlib import Path

PROJECT_ROOT = Path("/home/user/Sistema-de-narra-o-de-livro")
SKILLS_PATH = PROJECT_ROOT / "skills"

TOOL_DIRS = [
    PROJECT_ROOT / ".claude",
    PROJECT_ROOT / ".agent",
    PROJECT_ROOT / ".cursor",
    PROJECT_ROOT / ".gemini",
    PROJECT_ROOT / "backend" / ".claude",
    PROJECT_ROOT / "Frontend" / "LivryaFrontSocial" / ".claude",
]

print("=" * 50)
print("Setting up symlinks for skills")
print("=" * 50)

for tool_dir in TOOL_DIRS:
    if not tool_dir.exists():
        print(f"⊘ Skipped (not found): {tool_dir}")
        continue

    skills_symlink = tool_dir / "skills"

    # Remover symlink antigo se existir
    if skills_symlink.is_symlink():
        print(f"✓ Removing old symlink: {skills_symlink}")
        skills_symlink.unlink()
    elif skills_symlink.is_dir():
        print(f"⊘ {skills_symlink} is a directory, not a symlink - cannot replace")
        continue

    # Calcular caminho relativo
    try:
        rel_path = os.path.relpath(SKILLS_PATH, tool_dir)
    except ValueError:
        rel_path = str(SKILLS_PATH)

    # Criar symlink
    try:
        os.symlink(rel_path, skills_symlink)
        print(f"✓ Created symlink: {skills_symlink} → {rel_path}")
    except Exception as e:
        print(f"✗ Failed to create symlink: {skills_symlink} - {e}")

print("\n" + "=" * 50)
print("Verifying symlinks:")
print("=" * 50)

for tool_dir in TOOL_DIRS:
    if not tool_dir.exists():
        continue

    skills_symlink = tool_dir / "skills"
    if skills_symlink.is_symlink():
        target = os.readlink(skills_symlink)
        print(f"  ✓ {skills_symlink} → {target}")
    elif skills_symlink.is_dir():
        print(f"  ⊘ {skills_symlink} is a directory (not a symlink)")
    else:
        print(f"  ✗ {skills_symlink} does not exist")
