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

## GOLD 0.58
- お助けカードを分かりやすい名前に：バリア／なすりつけ（旧：可愛いだけじゃダメですか？）／身代わり（旧：天使の分け前）
- 配るお助けカードを3種からランダムに（これまではバリアだけ）。Firebaseルールの変更なし

## GOLD 0.59
- ホーム画面の上のほう（「皆に教える」の下）に、目立つ「📲 ホーム画面に追加」ボタンを追加（これまでは一番下の小さい文字だけ）。追加ずみ（アイコンから開いた）ときは出ない。通信・ルール変更なし

## GOLD 0.60
- カードの絵をぼかして背景にした1ページ表示（見本のB）。ドリンクタイム用の新しい絵を追加
- 「イッテキーラ！」をグラスが「カチン」→火花→赤い大きな文字が吹き出す演出に変更
- 充電バトルに入力の説明文を追加。通信・Firebaseルールの変更なし

## GOLD 0.61
- 見本とそろえた1ページ表示：上の細い帯（ドリンクタイムまで／お助け／メーター）、絵つき見出し、進行の点、真ん中に内容、下に大きいボタン
- 充電バトルを見本と同じ大きい数字＋スライダーに。通信・Firebaseルールの変更なし

## GOLD 0.62
- 10秒ジャストを見本と同じ「大きな10.00から開始→数え始めて…→STOP」に。通信・Firebaseルールの変更なし

## GOLD 0.63
- 選ぶボタン（ボタン1/2・名前・A/Bなど）をカードの枠の中に移動。通信・Firebaseルールの変更なし

## GOLD 0.64
- ゲーム中の操作ボタン（START・送信・やった／できない など）を全部カードの枠の中に。通信・Firebaseルールの変更なし

## GOLD 0.65
- お題・A/B・王様の命令などの要の一文を、白い「質問カード」（見本B）で大きく表示。通信・Firebaseルールの変更なし

## GOLD 0.66（カード裏面・公開）
- カード裏面を、ロゴ入りの採用デザイン（card-back-nomi-quest.webp、約66KB）に差し替え。縦横比2:3のまま全体を表示。通信・Firebaseルールの変更なし

## GOLD 0.67（最終UI見本・未公開）
- 採用ホームUI（2026-10-24承認）を組み込み：ホーム → みんなで遊ぶ → 部屋を作る／参加 → 名前入力。1人で遊ぶ・友達に教える・ホーム画面に追加つき
- 部屋作成・参加・復帰・1人用の処理は元のまま。Firebaseルールの変更なし。画像7点（約270KB）とフォント（約100KB）を追加。アイコンは同梱せず本体にSVGで直接記述

## GOLD 0.67（最終UI・見本／未公開）
- 最終採用UI（2026-10-24）：名前入力＋アイコン29種の選択、招待された人の参加画面、待合室（招待QR・名簿・ゲーム選択・準備OK・開始）を組み込み。ホームは先の0.66見本と同じ。
- アイコンは短いID（nq-avatar-01〜29）だけを保存。選ぶだけでは予約せず、参加確定の書き込みでFirebaseルールが早い者順を決める（同時に同じ物を取っても1人だけ成立）。
- Firebaseルール案：multiplayer/firebase/database.rules.proposed-avatar.json（公開はトシ本人）。ルール公開前でも、アイコン抜きで部屋作成・参加は動く（アイコンは表示されない）。
- 待合室の「3/6人参加」「準備OK」など画像に焼き込まれていた文字は、本物の人数・名簿に置き換え。QRは部屋の招待リンクから生成。
- 追加：画像約0.4MB（アイコン29枚は画面を開いたとき必要な分だけ読み込み）。

## GOLD 0.67（公開）
- 最終UI：ホーム／名前入力＋アイコン選択／招待参加画面／待合室。アイコンは短いID（nq-avatar-NN）だけ保存し、早い者順をFirebaseルールで決める（公開用ルール案：multiplayer/firebase/database.rules.proposed-release.json）。
- アイコンの「特殊1〜5」（nq-avatar-21〜25）は公開を見合わせ（画像も置かない）。残りは25種。
- ゲーム中：下バー（メンバー／お助け／ホスト設定／ルール）、メンバー画面（グラスのメーター・つながり状態・累計杯数・タップで拡大）、お助けカード一覧画面。
- ドリンクタイムを「①結果発表→②お助けカード（30秒）→③最終結果＋身代わり（10秒）」に作り直し。各段階に説明書（初回のみ自動表示／「次から表示しない」）。順位は表彰台＋グラスのメーター（ライムは光る）。
- お助けカードの待ち状況は新しい書き込み（dt／dg）で共有。ルール未公開でも動くが、その場合は時間待ちのみ（早送りなし）。
- ルール公開の順番：先にFirebaseルールを公開 → その後にこの版を公開。

## GOLD 0.68（公開）土台：新しいカードの出し方
- カードの「出し方」だけを変更（カードの中身・お題の文言・画面は変更なし）。抽選は新ファイル draw.js の純粋な関数に切り出し。
- 抽選の元になる記録を部屋で共有（sessions/<部屋>/deck：seed／5番のお題25個の番号／ラウンドごとに出たカード）。端末ごとの記憶（specialSeen／soloAt／seenPrompts）は抽選に使わない。
- 1クール＝8ターン。1人用系（タップ王・10秒・充電）／パーティー系（ドキドキ・ボタン）／投票系（まとめた1つのお題の山）／特殊カード（GO TO HEAVEN OR HELL・キス顔・王様）の配分に変更。「直前と同じカードは出さない」は廃止。
- 5番は、ゲーム開始時にお題26個から25個を選ぶ。休憩カードは廃止。
- 仮の初期値（実機で調整）：SOLO_CHANCE=0.7、PARTY_CHANCE=1.0（draw.js の DRAW_CONFIG にまとめた）。
- Firebaseルールの追加あり（deck の3か所）：multiplayer/firebase/database.rules.proposed-draw-0.68.json。**先にルールを公開 → その後にこの版を公開。**（ルール公開前に新しい版を使うと、カードが引けない）
- 検証：tests/draw.test.mjs（1000ゲーム×100ターンの模擬）、tools/draw-live.test.mjs（実際の画面コードを3台ぶん動かして80回引く＋再読み込み）、tools/draw-rules.test.mjs（ルール18件）。
- 戻し方：GOLD 0.67 のコミット 110051b に戻す。ルール追加は他の動作に影響しない（追加のみ）。
