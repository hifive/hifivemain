hifiveMain
----------------------------------------------
hifiveのコア部分の開発用です。
ここではhifiveのリリース版、開発版、CSS、EJSのビルド方法を記述します。

1.リポジトリのクローン
  $ git clone git@github.com:hifive/hifivemain.git

2.Apache ivyを利用しhifiveビルドに必要なライブラリを追加
  hifive/ivy_build.xmlのresolveターゲットを実行します。

  -コマンドラインから
   $ cd hifive
   $ ant -buildfile ivy_build.xml

  -IDE(eclipse)から
   hifiveプロジェクトをインポート -> hifive/ivy_build.xmlを右クリック -> 実行 -> Antビルド

3.hifiveビルドを実行
  hifive/build_for_js.xmlのbuildターゲットを実行します。

  -コマンドラインから
   $ cd hifive
   $ ant -buildfile build_for_js.xml

  -IDE(eclipseから)
   hifive/build_for_js.xmlを右クリック -> 実行 -> Antビルド

  バージョンを入力(任意)すると
  hifive/src/main/webapp/release/
    ejs.js
    h5.css
    h5.dev.js
    h5.js
     が生成されます。

------------------------------------------------------------

APIドキュメント（JSDocドキュメント）の生成方法:

1.jsdoc3をダウンロード

  - jsdoc3はここからダウンロードできます
    https://github.com/jsdoc3/jsdoc

  - Tagなどからすべてのファイルをダウンロードし、 hifive/jsTool/jsdoc/bin に配置します。
    ("jsdoc"コマンドが"bin"フォルダに存在するようにします。)

2.生成

  - build_for_js.xmlのjsdocターゲットを実行します。
    hifive/src/main/webapp/doc の下にドキュメントが生成されます。

------------------------------------------------------------

hifiveのテスト実行方法:

1.jscoverageをダウンロードしjsTool/jscoverageにjscoverage.exeを配置
  - http://siliconforks.com/jscoverage/

2.build_for_js.xmlのjscoverageターゲットを実行

3.lib/selenium内に以下のファイルを配置
  - firebug-x.x.x-fx.xpi  http://getfirebug.com/
  - chromedriver          http://code.google.com/p/selenium/

4.src/main/webapp/lib以下に、必要なライブラリを追加

  - hifive/src/main/webapp/index.htmlを参照してください

5.CoverageMargeTestを実行する
- IDE(Eclipse利用)の場合
  1.tomcatプラグインをインストールし、設定を行う.
  - http://www.eclipsetotale.com/tomcatPlugin.html

  2.プロジェクトを右クリックしTomcat定義を更新

  3.Tomcat起動

  4.CoverageMargeTestでjunit実行
