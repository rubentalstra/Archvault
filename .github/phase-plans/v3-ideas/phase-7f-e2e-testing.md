# Phase 7f — E2E Testing & CI

## Status: Not Started

## Goal

Set up end-to-end testing with Playwright and CI pipeline with GitHub Actions for automated
testing, linting, and build verification on every PR.

## Prerequisites

- Phase 7a (Import & Export) — complete

## Tasks

- [ ] Install and configure Playwright
- [ ] E2E test suites:
  - Auth flow (login, register, logout)
  - Workspace CRUD
  - Element CRUD and hierarchy
  - Connection CRUD
  - Diagram creation and canvas interaction
  - Flow creation and playback
  - Tag management and perspectives
  - Import/export roundtrip
- [ ] GitHub Actions CI workflow:
  - Lint (ESLint)
  - Type check (tsc --noEmit)
  - Unit tests (vitest)
  - E2E tests (Playwright with Docker PostgreSQL)
  - Build verification
- [ ] Test fixtures and seed data
- [ ] CI status badges in README

## Verification

- [ ] All E2E tests pass locally
- [ ] CI pipeline runs on PRs
- [ ] Build succeeds in CI
- [ ] All existing unit tests pass in CI
