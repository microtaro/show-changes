<h1 align="center">show-changes</h1>

<p align="center">
  <strong>Web アプリを大きく変えた後、変えた所を全部、今見ている画面の上で見せる。変えた部品ごとに番号付きの枠を重ね、説明は 1 つにまとめて並べます。</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-3730a3" alt="ライセンス: Apache-2.0"></a>
  <img src="https://img.shields.io/badge/agent%20skill-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-3730a3" alt="Claude Code・Codex・Cursor 用のスキル">
  <img src="https://img.shields.io/badge/browser-Chrome%20DevTools%20MCP-3730a3" alt="Chrome DevTools MCP を使う">
  <img src="https://img.shields.io/badge/marks-English%20%7C%20%E6%97%A5%E6%9C%AC%E8%AA%9E-3730a3" alt="英語と日本語">
</p>

<p align="center">
  <a href="#導入">導入</a> ·
  <a href="#見本">見本</a> ·
  <a href="#できること">できること</a> ·
  <a href="#使い方">使い方</a> ·
  <a href="#引数">引数</a> ·
  <a href="#知っておくとよいこと">知っておくとよいこと</a> ·
  <a href="CHANGELOG.ja.md">更新履歴</a> ·
  <a href="README.md">English</a>
</p>

エージェントが何か所も変えた時、文書の報告だと、読む人が一つずつ画面で探すことになります。このスキルを使うと、エージェントは変更が見える状態でアプリを開き、その場で印を付けます。部品に ① ② ③、言葉は説明の欄に並びます。読む人は全部の変更を一度に確かめられ、試したい所をその場で押せます。

開発中に使ってください。変更を作ったエージェントに、作った直後、同じ会話の中で頼みます。試しでは 1 分かかりませんでした。後から頼んだり、変更を作っていないエージェントに頼んだりすると、先に変更を探すので約 10 分かかりました（[使い方](#使い方)）。

## 見本

別のアプリの計画の画面で、このスキルを使った見本です。印が付き、「全文を見る」で畳んだ文を開くと、②の枠も一緒に広がります。上へ送ると、画面の外にあった④の枠が入ってきます。

![今の画面に番号付きの枠を重ね、畳んだ文を開くと枠 2 も広がり、上へ送ると枠 4 が入ってくる。](docs/demo-ja.gif)

[動画（mp4）でダウンロード](docs/demo-ja.mp4?raw=true)

## できること

**1. 今の画面。** エージェントは、変更が見える状態（試行が動いている、提案が待っている、欄が開いている）までアプリを進め、そのタブを前に出します。

![アノテーションのアプリの計画の画面。まだ何も印が無い。](docs/images/step-1.ja.jpg)

**2. 変えた所ごとに枠。** 枠の角に番号だけを置き、言葉は右下の説明の欄にまとめて並べるので、印が指した物を隠しません。説明の欄には「枠はアプリの一部ではない」とも出ます。

![3 か所に 1〜3 の番号付きの枠、右下に 4 つの説明の欄。4 つ目は上の、画面の外にある。](docs/images/step-2.ja.jpg)

**3. 画面が変わっても付いていく。** 0.3 秒ごとに部品の位置を測り直すので、画面を送ったり、開いたり、伸びたりしても、枠が付いていきます。クリックは枠を素通りするので、枠の下の物もそのまま押せます。

![「全文を見る」を押して上へ送った後。枠 2 は開いた文を囲み、ラベルの説明に付けた枠 4 が画面に入ってきた。](docs/images/step-3.ja.jpg)

中の作り:

- ページの一番手前に、透明な層を 1 枚重ねるだけです。ページ自身のコードからは見えず、どこにも何も書かず、読み込み直すと消えます。
- 印は、部品を CSS セレクタと中の言葉で指します。画面が描き直されても、同じ指定で付きます。
- 印ごとに、見つかった部品の数と、今枠が出ている数を返します。箱やメニューの下に隠れた部品には枠を出しません。見つかった数が 0 なら、その状態がまだ画面に無いことで、スキルは「まだ見えない」と言うようにエージェントに求めます。
- 開いた shadow DOM の中も探します。

## 導入

スキルを動かせるエージェント（Claude Code・Codex・Cursor）と、画面で JavaScript を動かせるブラウザの道具が要ります。ここでは Chrome DevTools MCP を使います。

### 1. スキルを入れる

```bash
# Claude Code
npx skills add microtaro/show-changes --skill show-changes --agent claude-code --global
# Codex
npx skills add microtaro/show-changes --skill show-changes --agent codex --global
# Cursor
npx skills add microtaro/show-changes --skill show-changes --agent cursor --global
```

`--global` で入れると、スキルはプロジェクトの外に置かれ、プロジェクトのファイルには何も足されません。

### 2. エージェントにブラウザを渡す

[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) を使うと、エージェントが Chrome のタブで JavaScript を動かせます。Node.js（LTS）と Chrome が要ります。

```bash
# Claude Code
claude mcp add chrome-devtools --scope user -- npx chrome-devtools-mcp@latest --filesystemRoot ~/.agents/skills
# Codex
codex mcp add chrome-devtools -- npx chrome-devtools-mcp@latest --filesystemRoot ~/.agents/skills
```

Cursor は、Settings → MCP → New MCP Server で、`"command": "npx"`、`"args": ["-y", "chrome-devtools-mcp@latest", "--filesystemRoot", "/home/you/.agents/skills"]` を入れます（ホームのフルパスにします）。

`--filesystemRoot` を付けると、サーバーがスキルのスクリプトを `~/.agents/skills` から読めます。`npx skills add --global` はスキルをここに置き、各エージェントのスキルのフォルダからここへリンクを張ります。付けないと、エージェントがスクリプトの本文を書き写して渡します。試しでは、その書き写しだけで 17 秒かかりました。

### 3. 自分が見ている Chrome に印を付ける

そのままだと、MCP のサーバーは自分用の Chrome を起こします。今見ている窓に印を付けるには、デバッグ用のポートと別のプロファイルで Chrome を起こし、`--browser-url` でそこにつなぎます。

```bash
# Chrome を起こす（Linux の例。先にほかの Chrome の窓を閉じる）
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-profile-show-changes
```

```json
"args": ["chrome-devtools-mcp@latest", "--browser-url=http://127.0.0.1:9222", "--filesystemRoot", "/home/you/.agents/skills"]
```

開いたポートからは、その PC のどのプログラムでもその Chrome を動かせます。普段とは別のプロファイルにし、使い終わったら閉じてください。WSL では、Windows 側で同じように Chrome を起こし、`--browser-url` でそこを指します。

Playwright MCP や Claude in Chrome でも動きます。スキルが要るのは、画面で JavaScript を動かすことだけです。ただし、人が見られるブラウザにしてください。

## 使い方

変えた直後に、同じ会話の中でエージェントに頼みます。

```text
変えた所を画面で見せて。
```

その時に頼むのがよい理由は、エージェントが、何を変えたか、どの画面に出るかを知っているからです。新しい会話で頼んだり、別のエージェントが変えた物を頼んだりすると、まず差分とコードから変更を探します。試し（Claude Opus 5.5）では次のとおりでした。

| 見せたエージェント | 時間 | 道具を呼んだ回数 |
|---|---|---|
| 変更を作った本人、作った直後に同じ会話で（画面 2 つ） | 48〜60 秒 | 10〜12 回 |
| 新しいエージェント、初めて見るアプリの 4 つの commit | 約 10 分 | 90 回 |

プロジェクトには何も書きません。ファイルも commit も設定も足さず、スクリプトは画面の中にだけ入り、読み込み直すと消えます。

エージェントは変更が見える状態を作り、`scripts/show-marks.js` を画面に読み込んで、次のように印を付けます。

```js
showMarks([
  { text: "^出荷の段ボールに貼られた", label: "① 作業の AI への文は、畳まずに全文で出す" },
  { selector: "details", text: "決まりの文", label: "② 長い説明は畳んで出す" },
  { text: "^全文を見る$", label: "③ 「全文を見る」で、畳んだ全文を開く" },
], { lang: "ja" })
```

そのあと、「枠は見せるための印で、アプリの一部ではない」と先に言い、番号ごとに一言で報告し、自分で押して確かめられる所を伝えます。印は `clearMarks()` か、読み込み直すと消えます。

## 引数

| 印 | |
|---|---|
| `selector` | CSS セレクタ。既定は全部の部品 |
| `text` | 部品の言葉に合う正規表現。合う物のうち一番小さい部品に付き、それを囲む部品には付かない |
| `pick` | `"all"`（既定）・`"first"`・`"last"` |
| `label` | 言葉。印の番号から始める（`① …`） |

| オプション | |
|---|---|
| `lang` | `"en"`（既定）か `"ja"`。印と一緒に出す断り書きの言葉 |
| `note` | 断り書きを自分の言葉にする |
| `tags` | `true` で、言葉を説明の欄でなく枠の横に置く |
| `color` | 枠の色。既定は `#d0198c` |
| `corner` | 説明の欄の置き場所。`"bottom-right"`（既定）・`"bottom-left"`・`"top-right"`・`"top-left"` |
| `every` | 測り直す間隔（ミリ秒）。既定は 300 |

印ごとに `{ label, found, shown }` を返します。`found` は合う部品の数、`shown` は今枠が出ている数です（窓の中にあり、上に何も重なっていない物）。

## 知っておくとよいこと

- **Chrome DevTools MCP でスクリプトを読み込む時:** `evaluate_script` がファイルから読める（`sourcePath`）のは、サーバーが使ってよいフォルダ（今のプロジェクト、一時フォルダ、`--filesystemRoot` で足したフォルダ）の中だけです（導入の 2）。外にあると、エージェントはスクリプトの本文を書き写して渡すので、遅くなります。
- **録画:** Chrome DevTools MCP の `screencast_start` で、タブを mp4 に録れます（書き出し先にも同じ制限があります）。上の見本もこの方法で撮りました。
- **撮った画像には使いません:** 今開いている画面に印を付ける物です。画像ファイルに描き込むなら、画像に注釈する道具を使ってください。

## できない事

- 閉じた shadow DOM の中、別ドメインの iframe の中、canvas の中に描かれた物は見つけられません。
- 1 枚の canvas や画像として描かれた図は、全体にしか枠を付けられません。
- 見えている所の真ん中に別の物が重なっていると、隠れていると数えます。
- とても速い動きには、最大で `every` ミリ秒遅れます。

## 画面と安全

スクリプトは、エージェントが印を付けるタブの中だけで動きます。通信はせず、何も保存せず、自分の層のほかはページに何もしません。気を付けるのは、ブラウザのデバッグ用のポートです（上の導入の 3）。

## 開発

```bash
node --test tests/*.test.mjs
```

## ライセンス

Apache-2.0。[LICENSE](LICENSE) を見てください。
