---
name: developer-notebook
description: Maintain, update, and consult the project developer's notebook (DEV_NOTEBOOK.md) when executing commands, identifying potentials, writing notes, recording feedback, tracking blockers or gotchas, and documenting decisions and changelogs.
---

# Developer Notebook Skill

This skill defines the workflow and standards for maintaining **`DEV_NOTEBOOK.md`**, a non-git-ignored developer brain and notebook for the project.

## Purpose & Scope
The developer notebook serves as the persistent repository memory. It tracks software development activities, architectural decisions, changelogs, feature roadmaps, command execution notes, potential optimizations, developer feedback, and known blockers or gotchas.

## Notebook Location
- **Notebook File:** `DEV_NOTEBOOK.md` (located in the workspace root).
- **Skill Definition:** `.agents/skills/developer-notebook/SKILL.md`.

---

## Workflow Instructions for Agents & Developers

### 1. Pre-Task Consultation
Before starting any significant task, debug session, or feature implementation:
- Consult [DEV_NOTEBOOK.md](./DEV_NOTEBOOK.md) to check existing architectural decisions, known blockers, API quirks, and related planned features.

### 2. Updating `DEV_NOTEBOOK.md` During & After Tasks
Update [DEV_NOTEBOOK.md](./DEV_NOTEBOOK.md) when any of the following occur:

#### A. Executing Significant Commands & Workflows
- Document new commands, run options, environment requirements, or test commands in **Section 7: Developer Notes, Command Executions & Feedback**.

#### B. Discovering Potentials & Opportunities
- Log ideas, refactoring targets, performance improvements, UX enhancements, or missing integrations in **Section 5: Potentials & Future Opportunities**.

#### C. Encountering Blockers, Gotchas, or Bugs
- Document setup failures, API quirks, rate limits, dependency bugs, or environment issues in **Section 6: Blockers, Gotchas & Known Issues**. Include workarounds and root causes.

#### D. Making Architectural Decisions (ADRs)
- Record major design choices, pattern selections, framework updates, or data structure changes in **Section 3: Architecture & Technical Decisions (ADRs)** with rationale and trade-offs.

#### E. Completing Features or Milestones
- Move items in **Section 4: Features & Current Capabilities** from planned `[ ]` to completed `[x]`.
- Append new release or implementation entries to **Section 2: Changelog & Milestones** with the current date (`YYYY-MM-DD`).

---

## Notebook Structure Standards

Keep entries well-organized under the standard sections:
1. **Executive Summary & Repository Overview**
2. **Changelog & Milestones**
3. **Architecture & Technical Decisions (ADRs)**
4. **Features & Current Capabilities**
5. **Potentials & Future Opportunities**
6. **Blockers, Gotchas & Known Issues**
7. **Developer Notes, Command Executions & Feedback**

Entries should be dated (`YYYY-MM-DD`), concise, structured with Markdown formatting, and actionable.
