# 創作ノート ZIPインポート形式

創作ノートの「JSON / ZIPファイルからインポート」は、以下の構造のZIPファイルを読み込めます。
このドキュメントの仕様通りにZIPを組み立てれば、アプリでエクスポートしたものでなくても
(例:別のAIセッションに内容を考えてもらって書き出したものでも)そのままインポートできます。

## ZIPの構造

```
work.json                  ← 必須。作品情報
entries/
  <エントリID>.json         ← エントリごとに1ファイル。0件でもOK
images/
  <ファイル名>.jpg など      ← 画像を使うentryだけ。任意
```

## work.json

```json
{
  "version": 1,
  "work": {
    "id": "work_temp",
    "name": "作品名",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "templates": []
}
```

- `work.id` はZIP内で使われないダミー値でよい(インポート時に新しいIDへ自動的に振り直される)。
- `work.name` が作品名としてそのまま使われる。
- `createdAt` / `updatedAt` はインポート時に上書きされるので適当なISO日時で構わない。
- `templates` は省略可(プロパティテンプレート機能。使わないなら `[]`)。

## entries/\<エントリID\>.json

```json
{
  "id": "char_alde",
  "category": "キャラクター",
  "title": "アルド",
  "tags": ["主人公", "騎士団"],
  "properties": [
    { "key": "年齢", "value": "17" },
    { "key": "所属", "value": "王国騎士団" }
  ],
  "body": "王国騎士団に所属する青年。幼い頃に魔王の襲撃で故郷を失った。",
  "relations": [
    { "targetId": "char_seti", "label": "幼馴染" },
    { "targetId": "person_maou", "label": "宿敵" }
  ],
  "images": [],
  "layout": "banner",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

フィールドの補足:

- `id`: そのファイル内だけで一意であればよい任意の文字列。ファイル名(拡張子なし)と一致させる。
  `relations[].targetId` から参照されるので、参照する側とされる側で値を揃えること。
  インポート時にアプリ内部のIDへ自動的に振り直されるので、他の作品や既存データと衝突する心配はない。
- `category`: 自由文字列(「キャラクター」「国」「時代」など)。
- `tags`: 自由文字列の配列。タグ絞り込み・グラフのタグ絞り込みで使われる。
- `properties`: `{ "key": "...", "value": "..." }` の配列。省略時は `[]`。
- `body`: 本文。他のエントリのタイトルと一致する文字列は、アプリ側で自動的にリンク化される
  (ZIP側で特別な記法を使う必要はない。プレーンテキストでよい)。
- `relations`: `{ "targetId": "他エントリのid", "label": "関係を表す自由文字列" }` の配列。
  存在しない`targetId`を参照していると、インポート時にその関連だけ無視される。
- `images`: 画像を使わないなら `[]` でよい。使う場合は下記参照。
- `layout`: `"banner"`(画像を上部に大きく表示、デフォルト)または `"thumbnail"`(画像をタイトル横に小さく表示する証明写真風レイアウト)。省略時は `"banner"` として扱われる。
- `createdAt` / `updatedAt`: 適当なISO日時でよい(必須フィールドだが値の妥当性はチェックされない)。

## 画像を含める場合

```json
"images": [
  { "id": "img_001", "file": "images/char_alde_main.jpg", "caption": "通常衣装", "isMain": true }
]
```

- `file` はZIPルートからの相対パス。実際のバイナリファイルを `images/` に入れる。
- `isMain` を `true` にした1枚がエントリ一覧・グラフビューのサムネイルとして使われる。
- 画像を使わないエントリでは `images: []` のままでよい。

## 最小構成の例

エントリ間の関連だけ試したい場合、画像なし・テンプレートなしで次の2ファイルだけでも成立する。

```
work.json
entries/char_alde.json
entries/char_seti.json
```

`char_alde.json` の `relations` に `{ "targetId": "char_seti", "label": "幼馴染" }` を入れておけば、
インポート後にグラフビューへ関連として反映される。

## 作り方

ZIP圧縮さえできれば作成ツールは問わない(Node.jsの`archiver`/`jszip`、Pythonの`zipfile`、
シェルの`zip`コマンドなど)。ファイル名の拡張子は `.zip` にすること。
