/*
 * Copyright (C) 2012-2014 NS Solutions Corporation
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

	H5_TEST_ENV = window.H5_TEST_ENV || {};

	// h5テスト方式識別
	// 'src' … src/main/webapp/src 以下を対象
	// 'dev' … archives/current/h5.dev.js を対象
	// 'min' … archives/current/h5.js を対象
	if (!H5_TEST_ENV.buildType)
		H5_TEST_ENV.buildType = 'src';

	// h5ソースファイルベースURL
	if (!H5_TEST_ENV.srcBaseUrl)
		H5_TEST_ENV.srcBaseUrl = '../';

	// H5_TEST_ENVに格納するパラメータキーのプレフィックス
	var H5TEST_NAMASPACE = 'h5testenv';

	// H5_TEST_ENVとリクエストパラメータでマージするプロパティ
	var MARGE_PROP_NAMES = ['ci', 'filter', 'geo', 'qunit', 'buildType'];

	// リクエストパラメータからオブジェクトを生成する
	var requestParam = testutils.u.parseRequestParameter();

	var envByParam = requestParam[H5TEST_NAMASPACE] || {};

	// H5_TEST_ENVにリクエストパラメータ優先でマージする
	for (var i = 0, l = MARGE_PROP_NAMES.length; i < l; i++) {
		var prop = MARGE_PROP_NAMES[i];
		if (envByParam[prop]) {
			if (typeof (envByParam[prop]) === 'object') {
				H5_TEST_ENV[prop] = $.extend(H5_TEST_ENV[prop], envByParam[prop]);
			} else {
				H5_TEST_ENV[prop] = envByParam[prop];
			}
		}
	}

	// テスト環境を表示する
	if (!$.isEmptyObject(H5_TEST_ENV)) {
		$(function() {
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