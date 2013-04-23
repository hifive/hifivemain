/*
 * Copyright (C) 2012-2013 NS Solutions Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * hifive
 */

(function() {
	// テスト環境オブジェクトの作成。
	// リクエストパラメータから取得して生成
	var paramsStr = window.location.search;

	// H5_TEST_ENVに格納するパラメータキーのプレフィックス
	var PARAM_PREFIX = 'h5testenv.';

	// リクエストパラメータからオブジェクトを生成する
	var envByParam = {};
	if (paramsStr !== "") {
		var paramsArray = paramsStr.substring(1).split('&');

		var l = paramsArray.length;
		for ( var i = 0; i < l; i++) {
			var keyVal = paramsArray[i].split('=');
			var namespace = keyVal[0];
			// h5env.で始まるものについてだけ
			if (namespace.indexOf(PARAM_PREFIX) != 0) {
				continue;
			}
			var val = keyVal[1];

			var names = namespace.substring(PARAM_PREFIX.length).split('.');
			var ret = envByParam;
			for ( var j = 0, len = names.length; j < len - 1; j++) {
				if (ret[names[j]] == null) { // nullまたはundefjnedだったら辿らない
					ret[names[j]] = {};
				}
				ret = ret[names[j]];
			}
			ret[names[len - 1]] = val;
		}
	}

	// H5_TEST_ENVが既に定義されていれば、定義オブジェクト優先でマージする
	// 定義されていない場合はリクエストパラメータから取得したオブジェクトをそのまま使用する
	window.H5_TEST_ENV = window.H5_TEST_ENV ? {
		ci: $.extend(window.H5_TEST_ENV.ci, envByParam.ci),
		filter: $.extend(window.H5_TEST_ENV.filter, envByParam.filter),
		geo: $.extend(window.H5_TEST_ENV.geo, envByParam.geo),
		qunit: $.extend(window.H5_TEST_ENV.qunit, envByParam.qunit)
	} : envByParam;

	// テスト環境を表示する
	if (!$.isEmptyObject(H5_TEST_ENV)) {
		QUnit.config.begin.push(function() {
			// beginはQUnit.loadの先頭で呼ばれるコールバックなので、DOMの追加等が終わっていない
			// そのためsetTimeout(0)でDOM追加が終わってから、H5_TEST_ENVの表示を行う
			setTimeout(function() {
				$('#qunit-header').after(
						'<p>H5_TEST_ENV</p><pre id="h5-testenv">' + QUnit.jsDump.parse(H5_TEST_ENV)
								+ '</pre>');
			}, 0);
		});
	}



	// 環境設定
	// dummygeoが設定されていればnavigator.geolocationの持つメソッドをダミーで上書く(オリジナルはprototypeメソッドなので、メンバとして上書く)
	if (H5_TEST_ENV.geo && H5_TEST_ENV.geo.impersonate) {
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
})();