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

$(function() {
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
	module('H5Api - Geo Location (Debug Mode) - getCurrentPosition', {
		setup: function() {
			if (!isDevMode()) {
				return;
			}

			h5.dev.api.geo.watchIntervalTime = 1000;
			h5.dev.api.geo.dummyPositions = [];
			h5.dev.api.geo.forceError = false;
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('ダミー位置情報をセットしていないときは元のAPIを使うこと。エラーが起きるか位置が取得できる。', 1, function() {
		if (!isDevMode()) {
			expect(1);
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
			start();
			return;
		}

		if (!isSupported) {
			expect(1);
			ok(false, 'お使いのブラウザはGeolocationをサポートしていません。');
			start();
			return;
		}
		h5.api.geo.getCurrentPosition({
			timeout: 5000
		}).done(function(pos) {
			ok(pos, pos);
			start();
		}).fail(function(error) {
			ok(true, 'エラーコード:' + error.code);
			start();
		});
	});

	asyncTest('ダミー位置情報がセットした通りに取得できること。', 8, function() {
		if (!isDevMode()) {
			expect(1);
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
			start();
			return;
		}

		// ダミー位置をセットする
		var params = {
			coords: {
				latitude: 35.67920288784219,
				longitude: 139.7650095767821,
				accuracy: 300,
				altitude: 100,
				altitudeAccuracy: 50,
				heading: 90,
				speed: 5
			},
			timestamp: 1330930209732
		};
		h5.dev.api.geo.dummyPositions = params;
		h5.api.geo.getCurrentPosition({
			timeout: 5000
		}).done(function(pos) {
			strictEqual(pos.coords.latitude, params.coords.latitude, '緯度');
			strictEqual(pos.coords.longitude, params.coords.longitude, '経度');
			strictEqual(pos.coords.accuracy, params.coords.accuracy, '緯度・経度の誤差(m)');
			strictEqual(pos.coords.altitude, params.coords.altitude, '高度(m)');
			strictEqual(pos.coords.altitudeAccuracy, params.coords.altitudeAccuracy, '高度の誤差(m)');
			strictEqual(pos.coords.heading, params.coords.heading, '方角(度)');
			strictEqual(pos.coords.speed, params.coords.speed, '速度(m/s)');
			strictEqual(pos.timestamp, params.timestamp, 'タイムスタンプ');
			start();
		}).fail(function(error) {
			ok(false, 'エラーコード:' + error.code);
			start();
		});

	});
	asyncTest('ダミー位置情報セット時に省略したパラメータにデフォルト値が入って取得できること。', 24, function() {
		if (!isDevMode()) {
			expect(1);
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
			start();
			return;
		}

		var params = [{}, {
			coords: {
				latitude: 35.67920288784001,
				longitude: 139.7650095767001
			}
		}, {
			latitude: 35.67920288784002,
			longitude: 139.7650095767002
		}];
		var promises = [];
		for ( var i = 0, len = params.length; i < len; i++) {
			var param = params[i];
			h5.dev.api.geo.dummyPositions = param;
			promises.push(h5.api.geo.getCurrentPosition({
				timeout: 5000
			}));
		}
		promises[0].done(
				function(pos) {
					strictEqual(pos.coords.latitude, 0, '緯度');
					strictEqual(pos.coords.longitude, 0, '経度');
					strictEqual(pos.coords.accuracy, 0, '緯度・経度の誤差(m)');
					strictEqual(pos.coords.altitude, null, '高度(m)');
					strictEqual(pos.coords.altitudeAccuracy, null, '高度の誤差(m)');
					strictEqual(pos.coords.heading, null, '方角(度)');
					strictEqual(pos.coords.speed, null, '速度(m/s)');
					strictEqual(Math.floor(pos.timestamp / 5000), Math
							.floor(new Date().getTime() / 5000), 'タイムスタンプ(誤差5秒以内)');
				}).fail(function(error) {
			ok(false, error.code);
		});
		promises[1].done(
				function(pos) {
					strictEqual(pos.coords.latitude, params[1].coords.latitude, '緯度');
					strictEqual(pos.coords.longitude, params[1].coords.longitude, '経度');
					strictEqual(pos.coords.accuracy, 0, '緯度・経度の誤差(m)');
					strictEqual(pos.coords.altitude, null, '高度(m)');
					strictEqual(pos.coords.altitudeAccuracy, null, '高度の誤差(m)');
					strictEqual(pos.coords.heading, null, '方角(度)');
					strictEqual(pos.coords.speed, null, '速度(m/s)');
					strictEqual(Math.floor(pos.timestamp / 5000), Math
							.floor(new Date().getTime() / 5000), 'タイムスタンプ(誤差5秒以内)');
				}).fail(function(error) {
			ok(false, 'エラー');
		});
		promises[2].done(
				function(pos) {
					strictEqual(pos.coords.latitude, params[2].latitude, '緯度');
					strictEqual(pos.coords.longitude, params[2].longitude, '経度');
					strictEqual(pos.coords.accuracy, 0, '緯度・経度の誤差(m)');
					strictEqual(pos.coords.altitude, null, '高度(m)');
					strictEqual(pos.coords.altitudeAccuracy, null, '高度の誤差(m)');
					strictEqual(pos.coords.heading, null, '方角(度)');
					strictEqual(pos.coords.speed, null, '速度(m/s)');
					strictEqual(Math.floor(pos.timestamp / 5000), Math
							.floor(new Date().getTime() / 5000), 'タイムスタンプ(誤差5秒以内)');
					start();
				}).fail(function(error) {
			ok(false, 'エラー');
			start();
		});
	});
	asyncTest('強制エラー', 1, function() {
		if (!isDevMode()) {
			expect(1);
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
			start();
			return;
		}

		h5.dev.api.geo.forceError = true;
		h5.dev.api.geo.dummyPositions = {};
		h5.api.geo.getCurrentPosition({
			timeout: 5000
		}).done(function(pos) {
			ok(false, 'エラーが発生していません。');
			start();
		}).fail(function(error) {
			ok(error, 'エラーオブジェクトが取得できること。エラーコード:' + error.code);
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('H5Api - Geo Location (Debug Mode) - watchPosition', {
		setup: function() {
			if (!isDevMode()) {
				return;
			}

			h5.dev.api.geo.watchIntervalTime = 1000;
			h5.dev.api.geo.dummyPositions = [];
			h5.dev.api.geo.forceError = false;
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('ダミー位置情報をセットしていないときは元のAPIを使うこと。エラーが起きるか位置が取得できる。', 1, function() {
		if (!isDevMode()) {
			expect(1);
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
			start();
			return;
		}

		if (!isSupported) {
			expect(1);
			ok(false, 'お使いのブラウザはGeolocationをサポートしていません。');
			start();
			return;
		}
		var p = h5.api.geo.watchPosition({
			timeout: 5000
		}).progress(function(pos) {
			ok(pos, pos);
			p.unwatch();
			start();
		}).fail(function(error) {
			p.unwatch();
			ok(true, 'エラーコード:' + error.code);
			start();
		});
	});
	asyncTest('ダミー位置情報がセットした通りに取得できること。ダミー位置を3カ所セットして、５回取得する', 36, function() {
		if (!isDevMode()) {
			expect(1);
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
			start();
			return;
		}

		var paramsArray = [{
			latitude: 35.67920288784219,
			longitude: 139.7650095767821
		}, {
			latitude: 35.68540771444479,
			longitude: 139.7660395450439
		}, {
			latitude: 35.69802503048958,
			longitude: 139.7729918308105
		}];
		var paramsLen = paramsArray.length;
		h5.dev.api.geo.dummyPositions = paramsArray;
		var count = 0;
		var i = 0;
		var promise = h5.api.geo.watchPosition({
			timeout: 10000
		});
		promise.progress(
				function(pos) {
					i = count++;
					if (count >= paramsLen) {
						i = paramsLen - 1;
					}
					strictEqual(pos.coords.latitude, paramsArray[i].latitude, i
							+ '番目にセットした緯度と取得した緯度が一致すること。');
					strictEqual(pos.coords.longitude, paramsArray[i].longitude, i
							+ '番目にセットした経度と取得した経度が一致すること。');
					strictEqual(pos.coords.accuracy, 0, 'accuracyは0であること。');
					strictEqual(pos.coords.altitude, null, 'altitudeはnullであること。');
					strictEqual(pos.coords.altitudeAccuracy, null, 'altitudeAccuracyはnullであること。');
					strictEqual(pos.coords.heading, null, 'headingはnullであること。');
					strictEqual(pos.coords.speed, null, 'speedはnullであること。');
					if (count === 5) {
						promise.unwatch();
					}
				}).fail(function(error) {
			promise.unwatch && promise.unwatch();
			ok(false, 'watchPosition エラー：' + error.code);
			start();
		}).done(function() {
			ok(true, 'watchPositionが停止すること。');
			start();
		});
	});
	asyncTest(
			'watchPositionを3回呼ぶ。watchInterval=1000msにして2つ目と3つ目を900ms,2900msずらして呼び、それぞれが同時に正しい位置情報を取得し、それぞれを同時に停止し、正しく停止する。',
			61, function() {
				if (!isDevMode()) {
					expect(1);
					ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
					start();
					return;
				}

				// 1秒ごと
				h5.dev.api.geo.watchIntervalTime = 1000;
				var paramsArray = [{
					latitude: 35.67920288784111,
					longitude: 139.7650095767111
				}, {
					latitude: 35.68540771444222,
					longitude: 139.7660395450222
				}, {
					latitude: 35.69802503048333,
					longitude: 139.7729918308333
				}, {
					latitude: 35.69802503048444,
					longitude: 139.7729918308444
				}];
				var paramsLen = paramsArray.length;
				h5.dev.api.geo.dummyPositions = paramsArray;

				// watchPosition2,3を1回目とどれだけずらすか。
				// 0～1秒ずらしたものと、2～3秒ずらしたものでテストをする。
				// 例えば500,2500にすると設定したintervalからnotifyされるまでに500ms以上かかった場合に、
				// 想定したnotifyより早くwatchPosition2,3が始まってしまい、テストが失敗する。
				// 低スペック端末や、他のテストと同時で処理が重いなどでそういう状況が起こる。
				// intervalからnotifyまでの時間が900ms以下になる想定で、900ms,2900msでテストする。
				var def1 = 900;
				var def2 = 2900;


				// 各watciPositionが取得する位置
				var positions1 = [];
				var positions2 = [];
				var positions3 = [];

				// 各watchPositionPromiseがnotifyされた時間を記録する変数。
				// 0ms, 1000ms, 2000ms ... でnotifyされるので、それ+処理時間分のタイムが入る
				var times1 = [];
				var times2 = [];
				var times3 = [];

				// 1つ目のwatchPositionを始めたtime
				var startTime = +new Date();

				// 1つ目のwatchPosition
				var promise1 = h5.api.geo.watchPosition({
					timeout: 10000
				});
				var count1 = 0;
				promise1.progress(
						function(pos) {
							if (positions1.length < 6) {
								positions1.push(pos);
								times1.push(+new Date() - startTime);
								var i = (count1 >= paramsLen - 1) ? count1 : count1++;
								strictEqual(pos.coords.latitude, paramsArray[i].latitude, i
										+ '番目にセットした緯度と取得した緯度が一致すること。');
								strictEqual(pos.coords.longitude, paramsArray[i].longitude, i
										+ '番目にセットした経度と取得した経度が一致すること。');
								strictEqual(pos.coords.accuracy, 0, 'accuracyは0であること。');
								strictEqual(pos.coords.altitude, null, 'altitudeはnullであること。');
								strictEqual(pos.coords.altitudeAccuracy, null,
										'altitudeAccuracyはnullであること。');
								strictEqual(pos.coords.heading, null, 'headingはnullであること。');
								strictEqual(pos.coords.speed, null, 'speedはnullであること。');
							}
						}).fail(function(error) {
					promise1.unwatch && promise1.unwatch();
					ok(false, 'watchPosition エラー:' + error.code);
				}).done(function() {
					ok(true, '1番目に呼んだwatchPositionが停止すること。');
				});
				// 2つ目のwatchPositionを500ms後に実行(1つ目が1つ取得した後)
				var promise2 = null;
				setTimeout(function() {
					promise2 = h5.api.geo.watchPosition({
						timeout: 10000
					});
					promise2.progress(function(pos) {
						if (positions2.length < 5) {
							positions2.push(pos);
							times2.push(+new Date() - startTime);
						}
					}).fail(function(error) {
						promise2.unwatch && promise2.unwatch();
						ok(true, 'エラーオブジェクトが取得できること。エラーコード:' + error.code);
					}).done(function() {
						ok(true, '2番目に呼んだwatchPositionが停止すること。');
					});
				}, def1);
				// 3つ目のwatchPositionを2500ms後に実行(1つ目が3つ取得した後)
				var promise3 = null;
				setTimeout(function() {
					promise3 = h5.api.geo.watchPosition({
						timeout: 10000
					});
					promise3.progress(function(pos) {
						if (positions3.length < 4) {
							positions3.push(pos);
							times3.push(+new Date() - startTime);
						} else {
							// 3つ目が4回取得したら終了
							// 3つ目の3回目までしか確認しないが、promise1,2のunwatchを呼ぶ(promise3.doneに入るタイミング)までに、positions1,2がテストに必要なだけ取得できている状態にするため
							promise3.unwatch();
						}
					}).fail(function(error) {
						promise3.unwatch && promise3.unwatch();
						ok(true, 'エラーオブジェクトが取得できること。エラーコード:' + error.code);
					}).done(
							function() {
								ok(true, '3番目に呼んだwatchPositionが停止すること。');
								promise1.unwatch();
								promise2.unwatch();
								for ( var i = 0; i < 5; i++) {
									deepEqual(positions2[i], positions1[i + 1], "2つ目が" + (i + 1)
											+ "番目に取得したposiitonオブジェクトと1つ目が" + (i + 2)
											+ "番目に取得したpositionオブジェクトが同じ");
									ok(Math.abs(times2[i] - times1[i + 1]) <= 100, "2つ目が" + (i + 1)
											+ "番目に取得した時間と1つ目が" + (i + 2) + "番目に取得した時間が誤差100ms以内：");
								}
								for ( var i = 0; i < 3; i++) {
									deepEqual(positions3[i], positions1[i + 3], "3つ目が" + (i + 1)
											+ "番目に取得したposiitonオブジェクトと1つ目が" + (i + 4)
											+ "番目に取得したpositionオブジェクトが同じ");
									ok(Math.abs(times3[i] - times1[i + 3]) <= 100, "3つ目が" + (i + 1)
											+ "番目に取得した時間と1つ目が" + (i + 4) + "番目に取得した時間が誤差100ms以内：");
								}
								start();
							});
				}, def2);
			});

	asyncTest('失敗 forceError=true', function() {
		if (!isDevMode()) {
			expect(1);
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
			start();
			return;
		}

		h5.dev.api.geo.forceError = true;
		var promise = h5.api.geo.watchPosition({
			timeout: 5000
		});
		promise.progress(function(pos) {
			ok(false, '成功');
			promise.unwatch();
			start();
		}).fail(function(error) {
			ok(true, 'エラーオブジェクトが取得できること。エラーコード:' + error.code);
			start();
		});
	});
});