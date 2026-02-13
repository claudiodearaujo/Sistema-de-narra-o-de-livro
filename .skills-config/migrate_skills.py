#!/usr/bin/env python3
"""
Script para migrar skills de .agent/skills para /skills/
com categorização baseada em análise de relevância.
"""

import json
import shutil
from pathlib import Path

def create_folder_structure(base_path):
    """Criar a estrutura de pastas proposta"""
    structure = [
        "backend",
        "frontend/angular",
        "frontend/react",
        "frontend/shared",
        "fullstack",
        "ai-integration",
        "devops",
        "testing",
        "code-quality",
        "security",
        "productivity",
        "project-specific",
    ]

    for folder in structure:
        Path(base_path / folder).mkdir(parents=True, exist_ok=True)
        print(f"✓ Created: {base_path / folder}")

def get_skill_mapping():
    """Criar mapa de ID de skill -> categoria de destino"""
    return {
        # Backend
        "backend-dev-guidelines": "backend",
        "bullmq-specialist": "backend",
        "cc-skill-backend-patterns": "backend",
        "database-design": "backend",
        "docker-expert": "devops",
        "neon-postgres": "backend",
        "nodejs-best-practices": "backend",
        "nosql-expert": "backend",
        "postgres-best-practices": "backend",
        "prisma-expert": "backend",
        "redis-patterns": "backend",
        "api-patterns": "backend",
        "api-security-best-practices": "backend",

        # Frontend - React
        "react-patterns": "frontend/react",
        "react-ui-patterns": "frontend/react",
        "react-best-practices": "frontend/react",
        "frontend-dev-guidelines": "frontend/react",
        "cc-skill-frontend-patterns": "frontend/react",

        # Frontend - Angular
        "angular-best-practices": "frontend/angular",

        # Frontend - Shared
        "tailwind-patterns": "frontend/shared",
        "ui-ux-pro-max": "frontend/shared",
        "frontend-design": "frontend/shared",
        "web-design-guidelines": "frontend/shared",
        "web-artifacts-builder": "frontend/shared",
        "3d-web-experience": "frontend/shared",
        "mobile-design": "frontend/shared",

        # Code Quality
        "clean-code": "code-quality",
        "test-driven-development": "code-quality",
        "testing-patterns": "code-quality",
        "systematic-debugging": "code-quality",
        "typescript-expert": "code-quality",
        "code-review-checklist": "code-quality",
        "playwright-skill": "testing",
        "browser-automation": "testing",
        "webapp-testing": "testing",
        "agent-evaluation": "testing",
        "bun-development": "code-quality",
        "crewai": "ai-integration",

        # AI/Agents
        "ai-agents-architect": "ai-integration",
        "agent-memory-mcp": "ai-integration",
        "agent-memory-systems": "ai-integration",
        "agent-tool-builder": "ai-integration",
        "ai-product": "ai-integration",
        "ai-wrapper-product": "ai-integration",
        "autonomous-agent-patterns": "ai-integration",
        "autonomous-agents": "ai-integration",
        "langgraph": "ai-integration",
        "llm-app-patterns": "ai-integration",
        "prompt-engineer": "ai-integration",
        "prompt-engineering": "ai-integration",
        "prompt-library": "ai-integration",
        "rag-engineer": "ai-integration",
        "rag-implementation": "ai-integration",
        "research-engineer": "ai-integration",
        "voice-agents": "ai-integration",
        "voice-ai-development": "ai-integration",
        "context-window-management": "ai-integration",
        "conversation-memory": "ai-integration",
        "prompt-caching": "ai-integration",
        "langfuse": "ai-integration",
        "agent-manager-skill": "ai-integration",
        "behavioral-modes": "ai-integration",
        "context7-auto-research": "ai-integration",
        "dispatching-parallel-agents": "ai-integration",
        "loki-mode": "ai-integration",
        "multi-agent-brainstorming": "ai-integration",
        "parallel-agents": "ai-integration",
        "subagent-driven-development": "ai-integration",

        # Security
        "api-security-best-practices": "security",
        "cc-skill-security-review": "security",
        "clerk-auth": "security",
        "nextjs-supabase-auth": "security",

        # DevOps
        "address-github-comments": "devops",
        "deployment-procedures": "devops",
        "git-pushing": "devops",
        "github-workflow-automation": "devops",
        "writing-skills": "devops",

        # Productivity
        "brainstorming": "productivity",
        "plan-writing": "productivity",
        "planning-with-files": "productivity",
        "executing-plans": "productivity",
        "finishing-a-development-branch": "productivity",
        "requesting-code-review": "productivity",
        "receiving-code-review": "productivity",
        "documentation-templates": "productivity",
        "kaizen": "productivity",
        "verification-before-completion": "productivity",

        # Fullstack
        "graphql": "fullstack",
        "file-uploads": "fullstack",
        "stripe-integration": "fullstack",
        "inngest": "fullstack",
        "trigger-dev": "fullstack",
        "firecrawl-scraper": "fullstack",
        "i18n-localization": "fullstack",
        "notebooklm": "project-specific",

        # Project Specific
        "cc-skill-coding-standards": "code-quality",
        "claude-d3js-skill": "frontend/shared",
        "algolia-search": "frontend/shared",
        "remotion-best-practices": "frontend/shared",
        "environment-setup-guide": "productivity",
        "architecture": "devops",
        "kaizen": "productivity",
        "performance-profiling": "code-quality",
        "lint-and-validate": "code-quality",
        "production-code-audit": "code-quality",
        "test-fixing": "testing",
        "error-handling-patterns": "fullstack",
    }

def migrate_skills(source_base, dest_base, skill_mapping):
    """Migrar skills para a nova estrutura"""
    source_skills = source_base / "skills"

    if not source_skills.exists():
        print(f"✗ Source directory not found: {source_skills}")
        return

    migrated = 0
    not_mapped = []

    for skill_dir in source_skills.iterdir():
        if not skill_dir.is_dir():
            continue

        skill_id = skill_dir.name

        if skill_id in skill_mapping:
            dest_category = skill_mapping[skill_id]
            dest_path = dest_base / dest_category / skill_id

            try:
                if dest_path.exists():
                    shutil.rmtree(dest_path)

                shutil.copytree(skill_dir, dest_path)
                print(f"✓ Migrated: {skill_id} → {dest_category}/")
                migrated += 1
            except Exception as e:
                print(f"✗ Error migrating {skill_id}: {e}")
        else:
            not_mapped.append(skill_id)

    print(f"\n{'='*50}")
    print(f"Migration Summary")
    print(f"{'='*50}")
    print(f"✓ Successfully migrated: {migrated} skills")
    print(f"? Not mapped: {len(not_mapped)} skills")

    if not_mapped:
        print(f"\nNot mapped skills (manual review needed):")
        for skill_id in sorted(not_mapped):
            print(f"  - {skill_id}")

    return migrated, len(not_mapped)

def main():
    # Definir caminhos
    project_root = Path("/home/user/Sistema-de-narra-o-de-livro")
    source_base = project_root / ".agent"
    dest_base = project_root / "skills"

    print("=" * 60)
    print("SKILLS MIGRATION SCRIPT")
    print("=" * 60)
    print(f"\nSource: {source_base / 'skills'}")
    print(f"Destination: {dest_base}")

    # Criar estrutura
    print("\n[1/3] Creating folder structure...")
    create_folder_structure(dest_base)

    # Obter mapa de skills
    print("\n[2/3] Loading skill mapping...")
    skill_mapping = get_skill_mapping()
    print(f"Mapped {len(skill_mapping)} skills")

    # Migrar skills
    print("\n[3/3] Migrating skills...")
    migrated, not_mapped = migrate_skills(source_base, dest_base, skill_mapping)

    print("\n" + "=" * 60)
    print("MIGRATION COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
