# Disposable release acceptance

This is an acceptance overlay, never a production ingress. The driver only accepts
an existing local Docker Desktop engine or a GitHub-hosted disposable runner. It
does not start a daemon, publish ports, access an external database, seed curriculum,
upload images, change host trust, or modify an existing Compose project.

Use Python 3.12+, Git and Docker Compose from a clean immutable checkout:

```sh
python3 deployment/qa/rehearse.py --context EXPLICIT_LOCAL_CONTEXT \
  --source-sha EXACT_40_CHARACTER_HEAD --output NEW_PRIVATE_EXTERNAL_DIRECTORY
```

Each run creates a new labelled network, target UUID, database volume and distinct
operator/migration/runtime credentials. It builds production images from `git archive`,
initializes the pinned schema, verifies actual datasource connections, issues a
disposable CA, and trusts that CA only inside the nonroot QA browser container.
Chromium sandboxing and TLS certificate/hostname verification stay enabled.

The real browser tests cookie login/recovery/logout and desktop/mobile layout.
Real API tests check ownership, origin/CSRF, refresh rotation/revocation and account/
notebook persistence across restart, independent database restore and configuration
rollback. No authorized curriculum is fabricated to exercise learning content.

The driver stops only its own services, retains its volumes/private evidence, and
checks preexisting container state and resource preservation. Never use global Docker
cleanup commands. Review a failed target before starting a new run; the driver does
not repair, clean, overwrite or adopt partially initialized databases.

Only `summary.json` and `commands.json` are sanitized CI artifacts. The output directory
also contains disposable passwords, TLS private keys, account fixtures and database
dumps: protect it with a private OS ACL, never commit or upload it. Raw subprocess
diagnostics are private. No cookies, JWTs or screenshots are public evidence.

Limits: this rehearses a disposable private HTTPS edge, not the Arch host, public DNS,
Ganbarou ingress, host capacity, off-host backups or curriculum publication. The
rollback exercise returns to the intact original database; cross-version artifact
rollback needs two approved compatible release images and remains a separate gate.
