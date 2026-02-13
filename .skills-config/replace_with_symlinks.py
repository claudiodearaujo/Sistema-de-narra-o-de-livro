#!/usr/bin/env python3
"""
Script para substituir diretórios de skills por symlinks apontando para /skills
"""

import os
import shutil
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

print("=" * 60)
print("Replacing skills directories with symlinks")
print("=" * 60)

for tool_dir in TOOL_DIRS:
    if not tool_dir.exists():
        print(f"⊘ Skipped (not found): {tool_dir}")
        continue

    skills_path = tool_dir / "skills"

    if not skills_path.exists():
        print(f"⊘ {skills_path} does not exist")
        continue

    if skills_path.is_symlink():
        print(f"✓ Already a symlink: {skills_path}")
        continue

    if not skills_path.is_dir():
        print(f"✗ {skills_path} is not a directory")
        continue

    # Remover diretório antigo
    try:
        print(f"🗑️  Removing old directory: {skills_path}")
        shutil.rmtree(skills_path)
        print(f"✓ Removed: {skills_path}")
    except Exception as e:
        print(f"✗ Failed to remove {skills_path}: {e}")
        continue

    # Calcular caminho relativo
    try:
        rel_path = os.path.relpath(SKILLS_PATH, tool_dir)
    except ValueError:
        rel_path = str(SKILLS_PATH)

    # Criar symlink
    try:
        os.symlink(rel_path, skills_path)
        print(f"✓ Created symlink: {skills_path} → {rel_path}")
    except Exception as e:
        print(f"✗ Failed to create symlink: {skills_path} - {e}")

print("\n" + "=" * 60)
print("Verification:")
print("=" * 60)

for tool_dir in TOOL_DIRS:
    if not tool_dir.exists():
        continue

    skills_path = tool_dir / "skills"
    if skills_path.is_symlink():
        target = os.readlink(skills_path)
        print(f"  ✓ {tool_dir.name}/skills → {target}")
    else:
        print(f"  ✗ {tool_dir.name}/skills - NOT a symlink!")

print("\n" + "=" * 60)
print("Done!")
print("=" * 60)
