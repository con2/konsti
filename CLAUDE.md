# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Konsti is an event signup tool for conventions (Ropecon, Tracon, etc.). Users browse program items and sign up via lottery or first-come-first-served. Supports group signups, Kompassi OAuth integration, and admin assignment management.

## Monorepo Structure

- **client/** — React 19 frontend (Vite, Redux Toolkit, styled-components, i18next for fi/en)
- **server/** — Express 5 backend (MongoDB/Mongoose, JWT auth, lottery assignment algorithms)
- **shared/** — Types, constants, configs, and utilities imported by client and server (not a Yarn workspace, used as a TypeScript path)
- **playwright/** — E2E tests
- **eslint-rules/** — Custom ESLint rules

Yarn 4 workspaces. Node >= 24.14.1. Use yarn, not npm. All code and scripts must be OS agnostic (Linux, Mac, Windows). Use exact dependency versions (e.g., `"vite": "7.3.1"`, not `"~7.3.1"` or `"^7.3.1"`).

## Common Commands

```bash
# Install
yarn install

# Development (requires Docker for MongoDB)
yarn start:dev              # Starts server + client with hot reload

# Seed database
yarn workspace server docker:db  # Start MongoDB container (port 27017, done automatically by start:dev)
yarn populate-db:dummy      # Load test data (admin:test, test1:test, helper:test, etc.)

# Testing
yarn test                   # Vitest unit tests (all workspaces)
yarn test:watch             # Watch mode
yarn vitest run path/to/file.test.ts  # Run a single test file

# Linting & formatting
yarn lint                   # ESLint + stylelint + Prettier check
yarn eslint                 # ESLint only
yarn type-check             # TypeScript type checking
yarn prettier:write         # Auto-format

# Building
yarn build-front:prod       # Build client → client/build → copied to server/front

# E2E
yarn playwright             # Start DB + server + client + Playwright UI
yarn docker-compose:test    # Full Docker-based E2E run
```

## Architecture

### Client-Server Communication

REST API over axios. All endpoints prefixed with `/api`. Endpoint constants defined in `shared/constants/apiEndpoints.ts`. Dev client runs on port 8000, production server on port 5000.

### Server Feature Structure

`server/src/features/{feature}/` — each feature has controllers, services, and Mongoose schemas. Controllers handle HTTP, services contain business logic. Key features: `assignment/` (lottery algorithms), `direct-signup/`, `user/`, `kompassi-login/`, `program-item/`.

### Assignment System

Two lottery algorithms: PADG (preference-based via `eventassigner-js`) and random (`eventassigner-random`). Admin triggers assignment runs. Users submit weighted preferences during signup windows defined per-event in `shared/config/`.

### Authentication

Local login (bcryptjs) and Kompassi OAuth. JWT tokens stored in localStorage. User roles: admin, helper, regular user.

### Event Configuration

Current event config in `shared/config/eventConfig.ts`, past events in `shared/config/past-events/` (e.g., `ropecon2025.ts`). Controls signup windows, program item types, assignment rules.

### Database

MongoDB with Mongoose. Tests use `mongodb-memory-server` for in-memory DB. Docker Compose config in `docker/`.

### State Management

Client uses Redux Toolkit. Store in `client/src/state/`. API calls in `client/src/services/`.

## Test Data Credentials

- Admin: `admin:test`
- Regular users: `test1:test`, `test2:test`, `test3:test`
- Group users: `group1:test`, `group2:test`, `group3:test`
- Helper: `helper:test`
