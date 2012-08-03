module("h5scopedglobals.js");

test('throwFwError() ※dev版のみ(min版ではエラーになります)', function() {
	var func = window.com && window.com.htmlhifive ? window.com.htmlhifive.throwFwError : null;

	if (func) {
		raises(function(enviroment) {
			func();
		}, function(actual) {
			return 'FwError: code = undefined' === actual.message;
		}, 'エラーコードを指定しない場合は「FwError: code = undefined」が表示されること。');

		raises(function(enviroment) {
			func(0);
		}, function(actual) {
			return 'FwError: code = 0' === actual.message;
		}, '存在しないエラーコードの場合は「FwError: code = x」表示されること。');

		raises(function(enviroment) {
			func(10000);
		}, function(actual) {
			return 'ログターゲットのtypeには、オブジェクト、もしくは"console"のみ指定可能です。(code=10000)' === actual.message;
		}, 'エラーコードに紐づくエラーメッセージがmesasgeプロパティに保持していること。');

		raises(function(enviroment) {
			func(7003, [1000, 'aaa']);
		}, function(actual) {
			return 'テンプレートファイルを取得できませんでした。ステータスコード:1000, URL:aaa(code=7003)' === actual.message;
		}, 'エラーコードに紐づくエラーメッセージがmesasgeプロパティに保持していること。');
	} else {
		ok(false, 'このテストはdev版でのみ有効です。');
	}
});