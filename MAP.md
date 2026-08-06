# Project map

## Core documents

| File | Audience | Loaded or read when | Owns |
|---|---|---|---|
| `AGENTS.md` | Agents and humans | Every repository session | Portable project contract |
| `CLAUDE.md` | Claude adapter | Every Claude repository session | Imports `AGENTS.md` |
| `.cursor/rules/00-project-contract.mdc` | Cursor adapter | Every Cursor repository session | Requires `AGENTS.md` |
| `CURRENT-TASK.md` | Agents and humans | Start, resume, handoff | Active goal, progress, exact next verifier |
| `WORK_QUEUE.md` | Agents and harness | Multi-step work | Actionable checkbox state |
| `STATUS.md` | Agents and humans | Start, resume, milestone | Durable project state |
| `LOG.md` | Agents and humans | Recent history, handoff | Append-only work record |
| `BACKBURNER.md` | Humans and agents | Planning | Parked backlog |
| `VERIFY.md` | Agents and CI | Before completion | Required evidence and commands |
| `MAP.md` | Agents and humans | Orientation | This document graph and project navigation |
| `DESIGN.md` | Agents and humans | Feature and architecture work | Goals, constraints, decisions |
| `MEMORY.md` | Agents | Recall | Lean links to durable topic notes |
| `data-manifest.yaml` | Agents and applications | Data access | Value-free data locations and classifications |
| `secret-manifest.json` | Agents and automation | Credential-dependent setup | Value-free credential inventory |
| `skills-manifest.json` | Agents and cloud setup | Skill selection and export | Project skill bindings |
| `.agents/feedback/FEEDBACK-LOG.md` | Agents and humans | Explicit correction or recurrence review | Append-only, value-free feedback records |

## Architecture

| Component | Purpose | Entry point | Owner |
|---|---|---|---|
| `<component>` | `<purpose>` | `<path or command>` | `<owner>` |

## Important paths

| Path | Purpose | Generated | Committed |
|---|---|---|---|
| `<path>` | `<purpose>` | `<yes/no>` | `<yes/no>` |

## Data flow

Describe inputs, transformations, stores, outputs, and trust-boundary crossings.

## Integrations

| System | Direction | Authentication name | Failure behavior |
|---|---|---|---|
| `<system>` | `<in/out/both>` | `<manifest name only>` | `<behavior>` |

## Ownership and concurrency

Record component owners, shared mutable resources, worktree constraints, ports, test databases, and deployment targets.

## Update rule

Update this file whenever a core document, component boundary, data flow, owner, integration, or important path changes.
