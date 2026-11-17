# QA browser/seccomp provenance

Browser base: official Microsoft Playwright 1.64.1 Noble, immutable manifest digest in Dockerfile.browser.
Chromium uses its ordinary sandbox. No ignore-certificate-errors/no-sandbox flag is used.

The vendored default-plus-user-namespace seccomp profile is from Microsoft Playwright:
https://raw.githubusercontent.com/microsoft/playwright/ae935a43d9e376e4759548f6b3c6905c7b282333/utils/docker/seccomp_profile.json

Apache-2.0 license is retained in playwright-LICENSE.
Profile SHA-256: cc3e61cabda6bbc1e53e54d27ba4d55a9d3be829b6dd1a596f4a7b31b1cc7849.
Reference: https://playwright.dev/docs/docker

CA trust is created only inside the disposable non-root QA browser container; the host trust store is unchanged.
