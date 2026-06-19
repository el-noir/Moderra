---
name: docker-debug
description: Debug docker-compose startup failures, inter-service networking problems,
  or environment variable issues. Use when any container fails to start or services
  cannot reach each other.
---

# Docker Debug Workflow

Run in order. Stop when you find the cause.

1. `docker-compose ps` — identify which services are stopped or restarting.
2. `docker-compose logs <service> --tail=50` for any non-running service.
3. If backend cannot reach mongo: verify MONGO_URI uses the docker-compose service
   name (mongo), not localhost.
4. If env vars look wrong: `docker-compose config` to see resolved values with
   variable substitution applied.
5. If port conflict: `lsof -i :<port>` to find what is using it.
6. After any change: `docker-compose down && docker-compose up --build`
   Not just restart — restart does not rebuild the image.

Report: which container failed, what the log tail shows, what was changed, what the result was.
