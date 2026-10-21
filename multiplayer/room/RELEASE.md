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

# GOLD 0.47

Nickname placeholder changed to 「例：ノミ・クエスト」; invitation notice text made dark for readability. Client-side only.
Rollback: restore commit 702f745 (GOLD 0.46).

# GOLD 0.48

Home-screen icon changed to the gold skull logo (icon-192/512, maskable, apple-touch-icon, favicon). Footer button renamed 「📲 ホームに追加」 and hidden when already installed. End-of-game install ask gets an 「あとで」 button: snoozed 7 days, never shown again after 3 snoozes. Client-side only; no Firebase or rules change. Note: an already installed home-screen icon may keep the old image until re-added.
Rollback: restore commit c23e346 (GOLD 0.47).

# GOLD 0.49

Nickname field: removed the label above it; placeholder is now 「ここにニックネームを入れてね」 (screen-reader label kept). Client-side only.
Rollback: restore commit bb1dfff (GOLD 0.48).

## GOLD 0.50
- 招待画面に「ルールは ここ で確認してね」リンク（遊び方モーダル）
- 待合室に「📖 ルールを見る」ボタン、タイトルを読みやすく
- 遊ぶゲームを枠＋アイコン（🃏カードゲーム / 👹鬼ごっこ）で表示
- 通信・DBルールの変更なし
- Rollback: restore commit 64984ec (GOLD 0.49)

## GOLD 0.50b
- 待合室「カードゲーム」のアイコンを、NOMI QUESTのカード裏面（ドクロ）に変更
- Rollback: restore commit d537bee

## GOLD 0.51
- カード裏面を正規デザイン（ドクロ＋NOMI QUESTロゴ）に差し替え（山札・引く演出の両方）
- カードを引く演出を新設計（約1.85秒）：浮上 → 金の光 → 半回転 → 金の集中線と粒 → 表 → お題ページ
- カード表を金縁デザインに統一
- 通信・DBルールの変更なし（演出は端末内のみ）／画像 +約63KB
- Rollback: restore commit 9109166 (GOLD 0.50b)

## GOLD 0.52
- 修正：充電カードの入力エラー（赤枠）が、次のターン・次のカードに移っても消えない問題。ターン／カード／場面が変わったら自動で消す
- Rollback: restore commit 8b3283f (GOLD 0.51)

## GOLD 0.53（第1段階：見た目と演出のみ）
- カードを引く前に「〇〇のターン！」の全画面テロップ（約1.5秒・タップで消せる）。休憩ターンは「休憩ターン！」
- ドリンクタイム／最終ドリンクタイムに、イッテキーラ全画面演出（乾杯画像＋名前がドーン＋金の粒＋画面ゆれ。タップでつづける）
- ニックネームは10文字まで（入力欄）。テロップ・演出では長い名前を自動で縮小、11文字以上は10文字＋…で表示（登録名そのものは変更しない）
- 通信・DBルールの変更なし（演出は端末内のみ）
- Rollback: restore commit 8bcd81c (GOLD 0.52)

## GOLD 0.54（第2段階：休憩カードとドリンクタイムの新しい流れ）
- 休憩ターンの自動挿入（8ターン）を廃止。みんなのメーター累計が3杯たまるごとに、山札に「休憩カード」が入る（引くたびに40%で出現、直前に休憩したら2ターン空ける）
- 休憩カードを引いたターンはターン数に数えない（次の人が引く）。ターン表示は休憩を除いた数
- 休憩カード：①結果発表（全員のメーター＋ランキング）→ 状態を選んで確認 → ②お助けカード受付（1分カウントダウン・使えるカードのある人だけ）→ ③イッテキーラ全画面 → ④飲んだ→次へ（全員そろうと進む）
- ターン表示に「あとN杯で休憩カード」
- 10秒±0.5秒のお助けカード獲得：コードは入れたが、Firebaseルール更新（トシさんの手動公開）までOFF（deck.js の TEN_REWARD）
- 通信・DBルールの変更なし（既存の書き込み先だけを使用）
- Rollback: restore commit b0dcb0d (GOLD 0.53)

## GOLD 0.55
- 10秒ジャスト±0.5秒（9.5〜10.5秒）でお助けカード獲得をON（Firebaseルール更新の公開後）
- NPC3人×60ターンを8パターンの乱数で通し、ルール拒否0件
- Rollback: restore commit a8e3e35 (GOLD 0.54)。TEN_REWARD を false にすれば獲得だけOFFに戻せる

## GOLD 0.56（基本ルールにあわせて作り直し）
- ドリンクタイム：8ターンごとに自動（ターンに数えない）。8ターン目の結果のあと、ホストの「🥃 ドリンクタイムへ」で始まる。流れは 結果発表 → お助けカード受付1分 → イッテキーラ → 飲んだ確認
- 休憩カード：ドリンクタイムとは別の「みんなの状態を確認するだけ」のカード。引いたターンは数えず、次の人が引く
- 休憩カードの出方：ゲーム開始から「実際に飲んだイッテキーラ」（バリアで無効になった分は除く）が3杯、6杯、9杯…を超えたクールだけ、1クールに最大1枚（出る順番はランダム）
- 休憩カードは Firebaseルール（card に rest を追加）を公開したあと、REST_CARD を true にして有効化（今回は OFF）
- ターン表示「あとNターンでドリンクタイム」。ルール説明・ロビーの文も更新

## GOLD 0.57
- 休憩カードを有効化（Firebaseルール公開ずみ）。3杯・6杯…を超えた次のクールに1回ずつ
