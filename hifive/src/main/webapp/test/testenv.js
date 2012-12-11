$(function() {
	// テスト環境オブジェクト。既に作成されていれば、パラメータからは読み込まない。
	if (window.H5_TEST_ENV) {
		return;
	}
	// リクエストパラメータから取得して生成
	var paramsArray = window.location.search.substring(1).split('&');

	var l = paramsArray.length;
	if (l === 0) {
		// FILTER_ENVもリクエストパラメータも無ければ全テストを実行するので、フィルタは掛けない。
		return;
	}
	// リクエストパラメータの値を使用する
	window.H5_TEST_ENV = {};
	for ( var i = 0; i < l; i++) {
		var keyVal = paramsArray[i].split('=');
		var namespace = keyVal[0];
		var val = keyVal[1];

		var names = namespace.split('.');
		var ret = window.H5_TEST_ENV;
		for ( var j = 0, len = names.length; j < len - 1; j++) {
			if (ret[names[j]] == null) { // nullまたはundefjnedだったら辿らない
				ret[names[j]] = {};
			}
			ret = ret[names[j]];
		}
		ret[names[len - 1]] = val;
	}
});