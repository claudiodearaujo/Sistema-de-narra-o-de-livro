#!/bin/bash
# Script para criar symlinks das skills nas pastas de ferramentas

PROJECT_ROOT="/home/user/Sistema-de-narra-o-de-livro"
SKILLS_PATH="$PROJECT_ROOT/skills"

echo "=========================================="
echo "Setting up symlinks for skills"
echo "=========================================="

# Criar symlinks nas pastas de ferramentas
declare -a TOOL_DIRS=(
    "$PROJECT_ROOT/.claude"
    "$PROJECT_ROOT/.agent"
    "$PROJECT_ROOT/.cursor"
    "$PROJECT_ROOT/.gemini"
    "$PROJECT_ROOT/backend/.claude"
    "$PROJECT_ROOT/Frontend/LivryaFrontSocial/.claude"
)

for tool_dir in "${TOOL_DIRS[@]}"; do
    if [ -d "$tool_dir" ]; then
        # Remover symlink anterior se existir
        if [ -L "$tool_dir/skills" ]; then
            echo "✓ Removing old symlink: $tool_dir/skills"
            rm "$tool_dir/skills"
        fi

        # Criar novo symlink
        # Calcular o caminho relativo corretamente
        relative_path=$(python3 -c "
import os
from pathlib import Path
tool_path = Path('$tool_dir')
skills_path = Path('$SKILLS_PATH')
try:
    rel_path = os.path.relpath(skills_path, tool_path)
    print(rel_path)
except ValueError:
    print(skills_path)
")

        ln -s "$relative_path" "$tool_dir/skills"
        if [ -L "$tool_dir/skills" ]; then
            echo "✓ Created symlink: $tool_dir/skills → $relative_path"
        else
            echo "✗ Failed to create symlink: $tool_dir/skills"
        fi
    else
        echo "⊘ Skipped (not found): $tool_dir"
    fi
done

echo ""
echo "=========================================="
echo "Symlink setup complete!"
echo "=========================================="

# Verificar symlinks
echo ""
echo "Verifying symlinks:"
for tool_dir in "${TOOL_DIRS[@]}"; do
    if [ -d "$tool_dir" ] && [ -L "$tool_dir/skills" ]; then
        target=$(readlink "$tool_dir/skills")
        echo "  ✓ $tool_dir/skills → $target"
    fi
done
