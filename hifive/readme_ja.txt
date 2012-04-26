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