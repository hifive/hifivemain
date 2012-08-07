/*
 * Copyright (C) 2012 NS Solutions Corporation
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
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	//=============================
	// Variables
	//=============================

	// TODO テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.api.geo;

	// IE9でドキュメントモードを8以下にしている場合はisSupportedをfalseにして、テストを飛ばす。
	var isSupported = h5.api.geo.isSupported && navigator.geolocation;

	//=============================
	// Functions
	//=============================

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================

	module('H5Api - Geo Location : getCurrentPosition');

	//=============================
	// Body
	//=============================

	asyncTest('座標情報またはエラー情報が取得できること。', function() {
		if (!isSupported) {
			ok(false, 'このブラウザはGeolocation APIをサポートしていません。');
			start();
		} else {
			h5.api.geo.getCurrentPosition({
				timeout: 5000
			}).done(function(pos) {
				start();
				ok(true, pos.coords.latitude + "," + pos.coords.longitude);
			}).fail(function(error) {
				equal(error.code, ERR.ERR_CODE_POSITIONING_FAILURE, 'エラーオブジェクトが取得できること。エラーコード:' + error.code);
				start();
			});
		}
	});

	//=============================
	// Definition
	//=============================

	module('H5Api - Geo Location : watchPosition');

	//=============================
	// Body
	//=============================

	asyncTest('watchPosition 座標情報またはエラー情報が取得できること。', function() {
		if (!isSupported) {
			ok(false, 'このブラウザはGeolocation APIをサポートしていません。');
			start();
			return;
		}
		var promise = null;
		promise = h5.api.geo.watchPosition({
			timeout: 5000
		}).progress(function(pos) {
			promise.unwatch();
			ok(true, pos.coords.latitude + "," + pos.coords.longitude);
		}).fail(function(error) {
			equal(error.code, ERR.ERR_CODE_POSITIONING_FAILURE, 'エラーオブジェクトが取得できること。エラーコード:' + error.code);
			start();
		}).done(function() {
			ok(true, 'watchPositionが停止すること。');
			start();
		});
	});

	asyncTest('watchPosition を3回呼び、unwatch()をして、すべてのwatchPosition()が終了すること。またはエラー情報が取得できること。',
			function() {
				if (!isSupported) {
					ok(false, 'このブラウザはGeolocation APIをサポートしていません。');
					start();
					return;
				}
				// 1つ目
				var promise1 = h5.api.geo.watchPosition({
					timeout: 10000
				});
				// 2つ目
				var promise2 = h5.api.geo.watchPosition({
					timeout: 10000
				});
				// 3つ目(500ms後に実行)
				setTimeout(function() {
					var promise3 = h5.api.geo.watchPosition({
						timeout: 10000
					});
					promise3.progress(function(pos) {
						promise3.unwatch();
						ok(true, pos.coords.latitude + "," + pos.coords.longitude);
					}).fail(function(error) {
						promise3.unwatch && promise3.unwatch();
						equal(error.code, ERR.ERR_CODE_POSITIONING_FAILURE, 'エラーオブジェクトが取得できること。エラーコード:' + error.code);
						start();
					}).done(function() {
						ok(true, '3つ目のwatchPositionが停止すること。');
						start();
					});
				}, 500);
				promise1.progress(function(pos) {
					promise1.unwatch();
					ok(true, pos.coords.latitude + "," + pos.coords.longitude);
				}).fail(function(error) {
					promise1.unwatch && promise1.unwatch();
					equal(error.code, ERR.ERR_CODE_POSITIONING_FAILURE, 'エラーオブジェクトが取得できること。エラーコード:' + error.code);
				}).done(function() {
					ok(true, '1つ目のwatchPositionが停止すること。');
				});
				promise2.progress(function(pos) {
					promise2.unwatch();
					ok(true, pos.coords.latitude + "," + pos.coords.longitude);
				}).fail(function(error) {
					promise2.unwatch && promise2.unwatch();
					equal(error.code, ERR.ERR_CODE_POSITIONING_FAILURE, 'エラーオブジェクトが取得できること。エラーコード:' + error.code);
				}).done(function() {
					ok(true, '2つ目のwatchPositionが停止すること。');
				});
			});

	//=============================
	// Definition
	//=============================

	module('H5Api - Geo Location : getDistance');

	//=============================
	// Body
	//=============================

	/**
	 * 国土地理院 直線距離計算ページ http://vldb.gsi.go.jp/sokuchi/surveycalc/bl2stf.html 緯度・経度を北緯・東経に変換するサイト
	 * http://www.yaskey.cside.tv/mapserver/note/degree.php 上記サイトから算出した特定地点の距離と、テストメソッドが返す値とを比較する。
	 * ただし距離が長くなればなるほど誤差が生じるため、100km未満圏内の小数点以下の誤差は許容範囲とする。
	 * (長距離の場合も考えて、距離によって誤差が大きくならない『測地線航海算法』で計算するメソッドの追加も要検討)
	 */
	test('100km未満 (誤差が1m未満であること)', function() {
		var result = h5.api.geo.getDistance(35.802739, 140.380034, 35.785796, 140.392265);
		equal(Math.floor(result), 2180, '成田空港の北側暫定滑走路の距離 - 世界測地系 (国土地理院算出値:2180.932m) 誤差:'
				+ (result - 2180.932) + 'm');
		var a = h5.api.geo.getDistance(35.681382, 139.766084, 35.828487, 139.803472,
				h5.api.geo.GS_GRS80);
		equal(Math.floor(a), 16668, '東京駅 - 草加駅 世界測地系 (国土地理院算出値:16668.546m) 誤差:' + (a - 16668.546)
				+ 'm');
		var b = h5.api.geo.getDistance(35.681382, 139.766084, 36.082744, 140.111234,
				h5.api.geo.GS_GRS80);
		equal(Math.floor(b), 54356, '東京駅 - つくば駅間 世界測地系 (国土地理院算出値:54356.124m) 誤差:' + (b - 54356.124)
				+ 'm');
		var c = h5.api.geo.getDistance(35.681382, 139.766084, 34.974689, 139.092264,
				h5.api.geo.GS_GRS80);
		equal(Math.floor(c), 99502, '東京駅 - 伊東駅間 世界測地系 (国土地理院算出値:99502.147m) 誤差:' + (c - 99502.147)
				+ 'm');
		var result4 = h5.api.geo.getDistance(35.802739, 140.380034, 35.785796, 140.392265,
				h5.api.geo.GS_BESSEL);
		equal(Math.floor(result4), 2180, '成田空港の北側暫定滑走路の距離 - 日本測地系 (国土地理院算出値:2180.693m) 誤差:'
				+ (result4 - 2180.693) + 'm');
		var aa = h5.api.geo.getDistance(35.681382, 139.766084, 35.828487, 139.803472,
				h5.api.geo.GS_BESSEL);
		equal(Math.floor(aa), 16666, '東京駅 - 草加駅 日本測地系 (国土地理院算出値:16666.767m) 誤差:' + (aa - 16666.767)
				+ 'm');
		var bb = h5.api.geo.getDistance(35.681382, 139.766084, 36.082744, 140.111234,
				h5.api.geo.GS_BESSEL);
		equal(Math.floor(bb), 54350, '東京駅 - つくば駅間 日本測地系 (国土地理院算出値:54350.115m) 誤差:'
				+ (bb - 54350.115) + 'm');
		var cc = h5.api.geo.getDistance(35.681382, 139.766084, 34.974689, 139.092264,
				h5.api.geo.GS_BESSEL);
		equal(Math.floor(cc), 99491, '東京駅 - 伊東駅間 日本測地系 (国土地理院算出値:99491.101m) 誤差:'
				+ (cc - 99491.101) + 'm');
	});

	test('100km以上 (1m以上誤差が出てしまうが、期待値通りの値が取得できること)', function() {
		var result2 = h5.api.geo.getDistance(35.681382, 139.766084, 35.170694, 136.881637,
				h5.api.geo.GS_GRS80);
		equal(Math.floor(result2), 268001, '東京駅 - 名古屋駅間の距離 - 世界測地系 (国土地理院算出値:267990.478m) 誤差:'
				+ (result2 - 267990.478) + 'm');
		var result3 = h5.api.geo.getDistance(35.681382, 139.766084, 43.068625, 141.350801,
				h5.api.geo.GS_GRS80);
		equal(Math.floor(result3), 831441, '東京駅 - 札幌駅間の距離 - 世界測地系 (国土地理院算出値:831396.029m) 誤差:'
				+ (result3 - 831396.029) + 'm');
		var result5 = h5.api.geo.getDistance(35.681382, 139.766084, 35.170694, 136.881637,
				h5.api.geo.GS_BESSEL);
		equal(Math.floor(result5), 267969, '東京駅 - 名古屋駅間の距離 - 日本測地系 (国土地理院算出値:267958.649m) 誤差:'
				+ (result5 - 267958.649) + 'm');
		var result6 = h5.api.geo.getDistance(35.681382, 139.766084, 43.068625, 141.350801,
				h5.api.geo.GS_BESSEL);
		equal(Math.floor(result6), 831351, '東京駅 - 札幌駅間の距離 - 日本測地系 (国土地理院算出値:831305.990m) 誤差:'
				+ (result6 - 831305.990) + 'm');
	});

	test('位置情報に不正な値が含まれる時にエラーが発生すること', 4,
			function() {
				try {
					h5.api.geo.getDistance(NaN, 139.766084, 35.170694, 136.881637,
							h5.api.geo.GS_GRS80);
					ok(false, "エラーが発生しいていません");
				} catch (e) {
					ok(true, e.code + ': ' + e.message);
				}
				try {
					h5.api.geo.getDistance(35.681382, Infinity, 35.170694, 136.881637,
							h5.api.geo.GS_GRS80);
					ok(false, "エラーが発生しいていません");
				} catch (e) {
					ok(true, e.code + ': ' + e.message);
				}
				try {
					h5.api.geo.getDistance(35.681382, 139.766084, -Infinity, 136.881637,
							h5.api.geo.GS_GRS80);
					ok(false, "エラーが発生しいていません");
				} catch (e) {
					ok(true, e.code + ': ' + e.message);
				}
				try {
					h5.api.geo.getDistance(35.681382, 139.766084, 35.170694, "abc",
							h5.api.geo.GS_GRS80);
					ok(false, "エラーが発生しいていません");
				} catch (e) {
					ok(true, e.code + ': ' + e.message);
				}
			});

	test('計算モードが不正な値である時にエラーが発生すること。指定しない場合はエラーが発生しないこと。', 2, function() {
		try {
			h5.api.geo.getDistance(35.681382, 139.766084, 35.170694, 136.881637, "GS_GRS80");
			ok(false, "エラーが発生しいていません");
		} catch (e) {
			ok(true, e.code + ': ' + e.message);
		}
		try {
			h5.api.geo.getDistance(35.681382, 139.766084, 35.170694, 136.881637);
			ok(true, "エラーが発生しいていません");
		} catch (e) {
			ok(false, e.code + ': ' + e.message);
		}
	});
})();
