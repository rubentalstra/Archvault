# Security Policy

## Supported Versions

Archvault is pre-1.0 software. Security fixes are applied to the **latest release only**.

| Version        | Supported |
|----------------|-----------|
| Latest         | Yes       |
| Older releases | No        |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Please report vulnerabilities
through [GitHub Security Advisories](https://github.com/rubentalstra/Archvault/security/advisories/new). This keeps the
report private until a fix is available.

### Response Timeline

| Stage                   | Timeframe       |
|-------------------------|-----------------|
| Acknowledgement         | Within 48 hours |
| Assessment              | Within 7 days   |
| Fix for critical issues | Within 30 days  |

We will keep you informed of progress throughout the process.

## Coordinated Disclosure

We follow coordinated disclosure. Once a fix is released, we will:

1. Credit the reporter (unless anonymity is requested)
2. Publish a security advisory on GitHub
3. Include the fix in the next release with a changelog entry

## Self-Hosting Hardening

If you are running Archvault in production, we recommend:

- **`BETTER_AUTH_SECRET`** — Use a strong, randomly generated secret (minimum 32 characters). Never reuse secrets across
  environments.
- **TLS** — Run Archvault behind a reverse proxy (nginx, Caddy, Traefik) with HTTPS enabled.
- **PostgreSQL credentials** — Use dedicated database credentials with least-privilege access. Do not expose the
  database port publicly.
- **Docker** — Keep your Docker images and base OS up to date. Run containers as a non-root user where possible.
- **Environment variables** — Never commit `.env` files or secrets to version control.
