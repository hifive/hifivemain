$(function() {
	// テスト環境オブジェクト。既に作成されていれば、パラメータからは読み込まない。
	if (!window.H5_TEST_ENV) {
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
	}

	// H5_TEST_ENV_ADDがあればマージ。
	// H5_TEST_ENV_ADDは、リクエストパラメータとオブジェクト両方で指定したい時に記述するオブジェクト。
	if (window.H5_TEST_ENV_ADD) {
		$.extend(window.H5_TEST_ENV, window.H5_TEST_ENV_ADD);
	}

	// 環境設定
	// dummygeoが設定されていればnavigator.geolocationの持つメソッドをダミーで上書く(オリジナルはprototypeメソッドなので、メンバとして上書く)
	if (H5_TEST_ENV.geo && H5_TEST_ENV.geo.impresonate) {
		if (!navigator.geolocation) {
			// geolocationが無ければ何もしない
			return;
		}
		// ダミー位置
		var dummyPosition = {
			coords: {
				latitude: 35.45616425225519,
				longitude: 139.6296590566635,
				accuracy: 10,
				altitude: null,
				altitudeAccuracy: null,
				heading: NaN,
				speed: null
			},
			timestamp: new Date()
		};
		// watchPositionのsuccessコールバックが呼ばれる間隔
		watchPositionTime = 1000;

		navigator.geolocation.getCurrentPosition = function(success, error, opt) {
			setTimeout(function() {
				success(dummyPosition);
			}, 0);
		};
		navigator.geolocation.watchPosition = function(success, error, opt) {
			return setInterval(function() {
				success(dummyPosition);
			}, watchPositionTime);
		};
		navigator.geolocation.clearWatch = function(watchId) {
			clearInterval(watchId);
		};
	}
});