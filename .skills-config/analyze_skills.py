#!/usr/bin/env python3
import json
import os
from pathlib import Path

# Definir os skills de ALTA relevância para o projeto
HIGH_RELEVANCE_KEYWORDS = {
    # Backend
    "nodejs": "backend",
    "express": "backend",
    "nestjs": "backend",
    "prisma": "backend",
    "postgres": "backend",
    "postgres-best": "backend",
    "neon": "backend",
    "redis": "backend",
    "bullmq": "backend",
    "socket": "backend",
    "socket-io": "backend",
    "api-pattern": "backend",
    "api-security": "backend",
    "backend": "backend",
    "database": "backend",

    # Frontend Angular
    "angular": "frontend",
    "primeng": "frontend",
    "transloco": "frontend",
    "signals": "frontend",

    # Frontend React
    "react": "frontend",
    "vite": "frontend",
    "zustand": "frontend",

    # Shared Frontend
    "tailwind": "frontend",
    "ui-ux": "frontend",
    "responsive": "frontend",
    "accessibility": "frontend",

    # TypeScript/Code Quality
    "typescript": "code-quality",
    "clean-code": "code-quality",
    "test-driven": "code-quality",
    "tdd": "code-quality",
    "testing": "code-quality",
    "jest": "code-quality",
    "jasmine": "code-quality",
    "karma": "code-quality",
    "playwright": "code-quality",
    "systematic-debug": "code-quality",

    # DevOps
    "docker": "devops",
    "deployment": "devops",
    "github": "devops",
    "ci-cd": "devops",

    # Git
    "git": "productivity",
    "git-pushing": "productivity",

    # Security
    "security": "security",
    "auth": "security",
    "jwt": "security",
    "oauth": "security",

    # AI Integration
    "ai": "ai",
    "gemini": "ai",
    "tts": "ai",
    "rag": "ai",
    "prompt": "ai",
    "agent": "ai",

    # Project Specific
    "audio": "project-specific",
    "book": "project-specific",
    "livrya": "project-specific",
    "narrat": "project-specific",
}

IRRELEVANT_KEYWORDS = {
    # Gaming (não é relevante)
    "game", "2d-game", "3d-game", "unreal",

    # Pentesting (não é o escopo do projeto)
    "penetration", "pentest", "hacking", "exploit", "burp", "metasploit",
    "sql-injection", "xss", "idor", "directory-traversal",
    "privilege-escalation", "active-directory", "kerberos",

    # Marketing (fora do escopo técnico)
    "marketing", "seo", "cro", "affiliate", "viral", "email-sequence",
    "social-content", "form-cro", "copywriting", "branding",
    "app-store-optimization", "launch-strategy",

    # CMS/No-code (não é o stack)
    "wordpress", "shopify", "notion", "moodle", "zapier", "make",

    # Specific Clouds não usados
    "aws", "azure", "gcp", "firebase", "vercel", "netlify",

    # Other
    "windows", "powershell", "active-directory", "saas-builder",
    "micro-saas", "business", "crm", "pricing", "referral",
}

def get_relevance(skill_name, category, description):
    """Determinar relevância do skill"""
    name_lower = skill_name.lower()
    desc_lower = description.lower() if description else ""
    full_text = f"{name_lower} {desc_lower}"

    # Verificar se é irrelevante
    for keyword in IRRELEVANT_KEYWORDS:
        if keyword in name_lower or keyword in desc_lower:
            return "remove"

    # Verificar se é altamente relevante
    matches = []
    for keyword, category_name in HIGH_RELEVANCE_KEYWORDS.items():
        if keyword in name_lower or keyword in desc_lower:
            matches.append(category_name)

    if matches:
        return "keep", matches[0]  # Usar primeiro match

    # Skills para análise manual (média relevância)
    if any(word in name_lower for word in ["debug", "plan", "doc", "review", "code", "dev", "pattern"]):
        return "review"

    return "review"

def main():
    skills_index_path = Path("/home/user/Sistema-de-narra-o-de-livro/.agent/skills_index.json")

    with open(skills_index_path, 'r') as f:
        skills = json.load(f)

    analysis = {
        "keep": {},
        "review": [],
        "remove": []
    }

    for skill in skills:
        skill_id = skill.get('id')
        skill_name = skill.get('name', skill_id)
        category = skill.get('category', 'uncategorized')
        description = skill.get('description', '')

        relevance_result = get_relevance(skill_id, category, description)

        if relevance_result == "remove":
            analysis["remove"].append({
                "id": skill_id,
                "name": skill_name,
                "reason": "Not relevant to Livrya project"
            })
        elif isinstance(relevance_result, tuple) and relevance_result[0] == "keep":
            category_name = relevance_result[1]
            if category_name not in analysis["keep"]:
                analysis["keep"][category_name] = []
            analysis["keep"][category_name].append({
                "id": skill_id,
                "name": skill_name,
                "description": description[:100] + "..." if len(description) > 100 else description
            })
        else:
            analysis["review"].append({
                "id": skill_id,
                "name": skill_name,
                "category": category,
                "description": description[:100] + "..." if len(description) > 100 else description
            })

    # Salvar análise
    output_path = Path("/home/user/Sistema-de-narra-o-de-livro/.skills-config/skills_analysis.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)

    # Imprimir resumo
    print("\n=== SKILLS ANALYSIS SUMMARY ===\n")
    print(f"✓ KEEP ({sum(len(v) for v in analysis['keep'].values())} skills):")
    for cat, items in analysis['keep'].items():
        print(f"  - {cat}: {len(items)} skills")

    print(f"\n? REVIEW ({len(analysis['review'])} skills)")
    print(f"\n✗ REMOVE ({len(analysis['remove'])} skills)")

    print(f"\nTotal: {len(skills)} skills")
    print(f"\nAnalysis saved to: {output_path}")

if __name__ == "__main__":
    main()
