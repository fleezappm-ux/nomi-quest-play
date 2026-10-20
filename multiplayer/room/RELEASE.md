# POP UI 0.40

Released 2026-10-19 with explicit user approval to publish.

Source: private NOMI QUEST development commit 1ac84660a1cbb8ebed72bbdae26bc15a5f155679.

Native DOM titles and controls with artwork-only crops; all 23 approved reference screens mapped to existing card, break and settlement processing. Production Firebase configuration, database rules, logging configuration, local DB, manifest and root single-device page are retained. Module cache tags are updated to pop0.40.

Validation: 92 production-path mobile UI checks, 106 simulated multiplayer cases, 40 NPC turns, and a 20-turn normal-timing offline browser playthrough. Android hardware and live multi-device 20-turn playthrough remain unverified. This release is not a stable-baseline promotion.

Rollback: restore the files from branch backup/pre-pop040-20261019, commit d138b2abd9f8a3382b96b87c93f666b877d1b1d6. Preserve subsequent changes when rolling back.

# GOLD 0.43

Released 2026-10-20 with explicit user approval to publish ("のせなおす").

Gold colour theme (black x gold) layered over POP 0.42, using the ChatGPT kit art in `gold/` for the 12 card screens, home and result icons. Game logic, Firebase configuration and database rules are unchanged (client-side look only).

Rollback: restore the files from commit aef0fb2 (POP 0.42).

# GOLD 0.44

Released 2026-10-20 with explicit user approval ("新ルールいれてって").

Shot meter (5 notches, lime = guaranteed drink), a break every 8 turns, drink time (lime holders, else highest meter, ties all drink), and the イッテキラー display. Reuses existing Firebase paths (personal drinks, check turn, nv history); no new writes, no database rules change. EASY (reset after each break) only; EASY/HARD selection, 30-second helper window and the proxy card are not implemented.

Players should create a new room on the new URL so old and new versions are not mixed.
Rollback: restore the files from commit 0e03bc8 (GOLD 0.43).

# GOLD 0.45

Released 2026-10-20 with explicit user approval.

Developer mode: home link "開発者モード" opens the offline practice mode with `&dev=1`. A panel lets the tester pick any of the 12 cards, or a break / drink time (lime, tie, all-zero, random meters), in any order. NPC auto-draw is paused in dev mode. Offline only; no Firebase access and no rules change.
Rollback: restore the files from commit 2b56641 (GOLD 0.44).

# GOLD 0.46

Released 2026-10-20 with explicit user approval.

Simple home: new gold skull logo (gold/logo.webp), no top-left brand, nickname asked once on first visit then "ようこそ○○さん 今日は何して遊ぶ？" with a nickname-change link; buttons みんなで遊ぶ / 1人で遊ぶ / 皆に教える (share or copy link) / 前の部屋に戻る. Client-side only; no Firebase or rules change.
Rollback: restore the files from commit 0bc7588 (GOLD 0.45).
