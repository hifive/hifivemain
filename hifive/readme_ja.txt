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
ここではhifiveのテスト実行方法について示します。

1.リポジトリをクローンし、ライブラリを取得(上記項目1,2)

2.jscoverageをダウンロードしjsTool/jscoverageにjscoverage.exeを配置
  - http://siliconforks.com/jscoverage/

3.build_for_js.xmlのjscoverageターゲットを実行

4.lib/selenium内に以下のファイルを配置
  - firebug-x.x.x-fx.xpi  http://getfirebug.com/
  - chromedriver          http://code.google.com/p/selenium/

5.src/main/webapp/libに以下に示すライブラリの追加
  - ejs
  - jqplugins
  - jquery
  - syntaxhighlighter
  - modernizr.js  
  
6.CoverageMargeTestを実行する
- IDE(Eclipse利用)の場合
  1.tomcatプラグインをインストールし、設定を行う.
  - http://www.eclipsetotale.com/tomcatPlugin.html
  
  2.プロジェクトを右クリックしTomcat定義を更新
  
  3.Tomcat起動
  
  4.CoverageMargeTestでjunit実行
