・init-server.bat
    実行するとJSCoverageサーバでrunner.html実行時のカバレッジを計測するためのserverフォルダがjscoverageフォルダ内に作られます。

・JSCoverageサーバの起動
    jscoverge-server-start.bat を実行します。


・JSCoverageサーバを使ったカバレッジ計測方法
    ・JSCoverageサーバを起ち上げて、http://localhost:8000/jscoverage.html にアクセスします。
        ここからJSCoverageサーバ内のURLを叩いて、カバレッジの計測を行います。
    ・計測結果はStoreタブのSent Reportボタンからサーバに送信します。
    ・送信された結果は、http://localhost:8000/report/jscoverage.html で確認できます。

・JSCoverageサーバの終了
    jscoverge-server-shutdown.bat を実行します。
