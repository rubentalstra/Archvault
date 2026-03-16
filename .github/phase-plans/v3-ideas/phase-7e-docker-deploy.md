# Phase 7e — Docker Self-Hosting

## Status: Not Started

## Goal

Provide a production-ready Docker setup for self-hosting Archvault with PostgreSQL, including
docker-compose configuration, environment variable documentation, and health checks.

## Prerequisites

- Phase 7a (Import & Export) — complete

## Tasks

- [ ] Production Dockerfile (multi-stage build, Node.js runtime)
- [ ] docker-compose.yml with app + PostgreSQL + optional reverse proxy
- [ ] Environment variable template (`.env.example`)
- [ ] Health check endpoint (`/api/health`)
- [ ] Auto-migration on startup
- [ ] Backup/restore scripts for PostgreSQL
- [ ] Documentation for self-hosting setup

## Verification

- [ ] `docker compose up` starts the full stack
- [ ] Application is accessible and functional
- [ ] Data persists across container restarts
- [ ] Health check endpoint responds correctly
