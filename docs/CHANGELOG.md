# TuiEngine - Developer Changelog

## [1.1.0] - 2026-06-30

This release focuses on platform integration, monetization, SSO, and durability fixes.

### Added
* **Monetization adapter (`TuiBillingWizard`)**:
  - Exposes an interactive component that displays a payment checkout redirect link alongside a high-fidelity **ASCII QR Code** dynamically inside any TUI window.
  - Automatically queries status callbacks to unlock purchase privileges on payment completion.
* **CLI `billing-init` command**:
  - Run `bun run billing-init` to generate a git-ignored `.env` file containing Stripe Price and secret key configurations.
* **Single Sign-On (SSO) Support**:
  - In `AuthWizard.ts`, the connection flow automatically detects if the SSH username matches `hub-user:${username}`.
  - If a player logs in via SSO, the credentials prompt is completely bypassed and their container account profile is resolved automatically.

### Changed
* **CLI `publish` command**:
  - Extended the publishing CLI wizard to enforce authentication against the play.tuicraft.com hub before pack-and-upload actions are permitted.

### Fixed
* **SSH Connection Freeze (Input Durability Patch)**:
  - Mocked missing `setRawMode` call on the readable stream implementation in the SSH terminal pipeline.
  - Disabled stream backpressure pauses to resolve keyboard freezing bugs under Bun.
