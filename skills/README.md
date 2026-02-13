# 🎯 Livrya Skills Library

Reorganized and categorized skills for the **Livrya - Sistema de Narração de Livro** project.

**Version:** 1.0.0
**Last Updated:** 2026-02-13
**Total Skills:** 105 (from 245 original)

---

## 📚 Structure

This library is organized by functionality and framework:

### 🔧 Backend
Backend development skills for Node.js/Express stack:
- **Node.js best practices**
- **Prisma ORM**
- **PostgreSQL optimization**
- **API design patterns**
- **Database design**
- **BullMQ/Redis patterns**
- **API security**

**Skills:** 11
**Location:** `/backend/`

---

### 🎨 Frontend
Frontend development organized by framework:

#### Angular (`/frontend/angular/`)
Angular-specific patterns and practices
- **To be populated** with Angular best practices

#### React (`/frontend/react/`)
React-specific patterns and practices:
- React patterns
- React UI patterns
- React best practices
- Frontend dev guidelines
- Frontend patterns

**Skills:** 5

#### Shared (`/frontend/shared/`)
Frontend skills applicable to all frameworks:
- **Tailwind CSS patterns**
- **UI/UX design**
- **Responsive design**
- **Web design guidelines**
- **3D web experiences**
- **Mobile design**
- **Web artifacts builder**
- **Algolia search**

**Skills:** 9

**Total Frontend:** 14 skills

---

### 🚀 Full-Stack
Full-stack development patterns and integrations:
- GraphQL
- File uploads
- Stripe payments
- Serverless jobs (Inngest, Trigger.dev)
- Web scraping & crawling
- Internationalization (i18n)

**Skills:** 7
**Location:** `/fullstack/`

---

### 🤖 AI Integration
AI, LLM agents, RAG, and machine learning:
- **AI agents architecture**
- **LangGraph** (stateful multi-actor agents)
- **CrewAI** (role-based agent framework)
- **RAG (Retrieval-Augmented Generation)**
- **Prompt engineering**
- **Memory systems & persistence**
- **Voice AI & TTS**
- **Agent memory & tool design**
- **LLM application patterns**
- **Autonomous agents**

**Skills:** 31
**Location:** `/ai-integration/`

> 💡 **Perfect for:** Livrya's Gemini TTS integration and narrator system

---

### 🛠️ DevOps
DevOps, CI/CD, deployment, and infrastructure:
- **Docker** containerization
- **GitHub workflows** & automation
- **Deployment procedures**
- **Git workflows**
- **Architecture decisions**

**Skills:** 7
**Location:** `/devops/`

---

### ✅ Testing
Testing frameworks, automation, and quality assurance:
- **Playwright** E2E testing
- **Browser automation**
- **Test fixing & debugging**
- **WebApp testing**
- **Agent evaluation & benchmarking**

**Skills:** 5
**Location:** `/testing/`

> 💡 **Matches project:** Playwright is used in LivryaFrontSocial for E2E tests

---

### 📊 Code Quality
Code quality, standards, and best practices:
- **Clean code principles**
- **Test-driven development**
- **TypeScript** expertise
- **Code review checklists**
- **Systematic debugging**
- **Performance profiling**
- **Coding standards** (TypeScript, JavaScript, React)
- **Production code audit**

**Skills:** 12
**Location:** `/code-quality/`

---

### 🔐 Security
Security practices, authentication, and authorization:
- **API security** best practices
- **JWT** authentication patterns
- **OAuth2 & Clerk** auth integration
- **Security review** procedures

**Skills:** 4
**Location:** `/security/`

> 💡 **Relevant to Livrya:** JWT auth + OAuth2 PKCE implementation

---

### ⚡ Productivity
Development productivity and workflow skills:
- **Planning & execution**
- **Git workflows**
- **Code review workflows**
- **Documentation templates**
- **Continuous improvement** (Kaizen)

**Skills:** 10
**Location:** `/productivity/`

---

### 🎬 Project-Specific
Skills specific to the Livrya project:
- **NotebookLM** integration (for AI narration)

**Skills:** 1
**Location:** `/project-specific/`

> 🚀 **Growing:** Will expand with more Livrya-specific skills in Phase 2

---

## 🔗 Symlinks

Skills are accessible from multiple IDE/tool locations via symlinks:

```
/.claude/skills           → ../skills
/.agent/skills            → ../skills
/.cursor/skills           → ../skills
/.gemini/skills           → ../skills
/backend/.claude/skills   → ../../skills
/Frontend/LivryaFrontSocial/.claude/skills → ../../../skills
```

This ensures all tools can access the same centralized skills library.

---

## 📊 Statistics

| Category | Skills | Purpose |
|----------|--------|---------|
| AI Integration | 31 | LLM agents, RAG, TTS |
| Frontend | 14 | React, Angular, design |
| Backend | 11 | Node.js, APIs, DB |
| Code Quality | 12 | Testing, debugging |
| DevOps | 7 | Docker, CI/CD |
| Testing | 5 | Playwright, E2E |
| Full-Stack | 7 | Cross-layer patterns |
| Security | 4 | Auth, API security |
| Productivity | 10 | Workflows, planning |
| Project-Specific | 1 | Livrya features |
| **TOTAL** | **105** | |

---

## 🎯 Using Skills

### In Claude Code
```bash
@skill-name
```

### In Cursor
Use the same `@skill-name` syntax

### In Gemini API
Skills are available through configuration

---

## 📈 Phase 2: New Skills

Recommended new skills to create for Livrya:

### Audio & TTS
- `livrya-audio-processing` - FFmpeg patterns, optimization
- `livrya-tts-optimization` - Caching, voice selection, fallbacks
- `livrya-audio-streaming` - HLS/DASH, CDN optimization

### Real-time & Communication
- `socket-io-rooms-management` - Namespaces, broadcasting
- `socket-io-security` - Auth, DDoS protection

### Social & Engagement
- `social-feed-architecture` - Pagination, algorithms
- `notification-system` - Push notifications, queues
- `gamification-patterns` - Achievements, badges, leaderboards

### Business Logic
- `stripe-subscription-patterns` - Billing, webhooks
- `oauth2-pkce-implementation` - Your auth system

---

## 🔄 Management

### View All Skills
```bash
ls -la /skills/*/
```

### Find a Skill
```bash
find /skills -name "*skill-name*" -type d
```

### Update Skills Index
```bash
python3 .skills-config/analyze_skills.py
```

---

## 📝 Notes

- Skills are organized by **relevance to Livrya project**
- **91 skills removed** (gaming, pentesting, marketing, CMS)
- **61 skills under review** (may be included later)
- **105 skills kept** (high-relevance)

---

## 🚀 Next Steps

1. ✅ Phase 1: Reorganize & clean (COMPLETED)
2. ⏳ Phase 2: Create new project-specific skills
3. ⏳ Phase 3: Update skills with best practices
4. ⏳ Phase 4: Team documentation & training

---

**For more information, see:**
- `.skills-config/PHASE1_ANALYSIS.md` - Detailed analysis
- `.skills-config/skills-manifest.json` - Full manifest
- `CLAUDE.md` - Livrya development guide
