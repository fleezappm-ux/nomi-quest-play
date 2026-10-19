# POP UI 0.40

Released 2026-10-19 with explicit user approval to publish.

Source: private NOMI QUEST development commit 1ac84660a1cbb8ebed72bbdae26bc15a5f155679.

Native DOM titles and controls with artwork-only crops; all 23 approved reference screens mapped to existing card, break and settlement processing. Production Firebase configuration, database rules, logging configuration, local DB, manifest and root single-device page are retained. Module cache tags are updated to pop0.40.

Validation: 92 production-path mobile UI checks, 106 simulated multiplayer cases, 40 NPC turns, and a 20-turn normal-timing offline browser playthrough. Android hardware and live multi-device 20-turn playthrough remain unverified. This release is not a stable-baseline promotion.

Rollback: restore the files from branch backup/pre-pop040-20261019, commit d138b2abd9f8a3382b96b87c93f666b877d1b1d6. Preserve subsequent changes when rolling back.
