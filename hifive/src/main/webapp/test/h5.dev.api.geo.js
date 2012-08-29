/*
 * Copyright (C) 2012 NS Solutions Corporation, All Rights Reserved.
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

// IE9でドキュメントモードを8以下にしている場合はisSupportedをfalseにして、テストを飛ばす。
var isSupported = h5.api.geo.isSupported && navigator.geolocation;

module('H5Api - Geo Location (Debug Mode)', {
	setup: function() {
		h5.dev.api.geo.watchIntervalTime = 1000;
		h5.dev.api.geo.dummyPositions = [];
		h5.dev.api.geo.forceError = false;
	}
});
asyncTest('getCurrentPosition デバッグモード ダミー位置情報をセットしていないときは元のAPIを使うこと。エラーが起きるか位置が取得できる。', 1,
		function() {
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

asyncTest('getCurrentPosition デバッグモード ダミー位置情報がセットした通りに取得できること。', 8, function() {
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
asyncTest('getCurrentPosition デバッグモード ダミー位置情報セット時に省略したパラメータにデフォルト値が入って取得できること。', 24, function() {
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
asyncTest('getCurrentPosition デバッグモード 失敗 強制エラー', 1, function() {
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
asyncTest('watchPosition デバッグモード ダミー位置情報をセットしていないときは元のAPIを使うこと。エラーが起きるか位置が取得できる。', 1, function() {
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
asyncTest('watchPosition デバッグモード ダミー位置情報がセットした通りに取得できること。ダミー位置を3カ所セットして、５回取得する', 36, function() {
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
		'watchPosition デバッグモード watchPositionを3回呼ぶ。watchInterval=1000msにして2つ目と3つ目を500ms,2500msずらして呼び、それぞれが同時に正しい位置情報を取得し、それぞれを同時に停止し、正しく停止する。',
		61, function() {
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
			var positions1 = [];
			var positions2 = [];
			var positions3 = [];
			var times1 = [];
			var times2 = [];
			var times3 = [];
			// 1つ目のwatchPosition
			var promise1 = h5.api.geo.watchPosition({
				timeout: 10000
			});
			var count1 = 0;
			promise1.progress(
					function(pos) {
						if (positions1.length < 6) {
							positions1.push(pos);
							times1.push(new Date().getTime());
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
						times2.push(new Date().getTime());
					}
				}).fail(function(error) {
					promise2.unwatch && promise2.unwatch();
					ok(true, 'エラーオブジェクトが取得できること。エラーコード:' + error.code);
				}).done(function() {
					ok(true, '2番目に呼んだwatchPositionが停止すること。');
				});
			}, 500);
			// 3つ目のwatchPositionを2500ms後に実行(1つ目が3つ取得した後)
			var promise3 = null;
			setTimeout(function() {
				promise3 = h5.api.geo.watchPosition({
					timeout: 10000
				});
				promise3.progress(function(pos) {
					if (positions3.length < 3) {
						positions3.push(pos);
						times3.push(new Date().getTime());
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
							for ( var i = 0, len = positions2.length; i < len; i++) {
								deepEqual(positions2[i], positions1[i + 1], "2つ目が" + (i + 1)
										+ "番目に取得したposiitonオブジェクトと1つ目が" + (i + 2)
										+ "番目に取得したpositionオブジェクトが同じ");
								strictEqual(Math.floor(times2[i] / 100), Math
										.floor(times1[i + 1] / 100), "2つ目が" + (i + 1)
										+ "番目に取得した時間と1つ目が" + (i + 2) + "番目に取得した時間が誤差100ms以内：");
							}
							for ( var i = 0, len = positions3.length; i < len; i++) {
								deepEqual(positions3[i], positions1[i + 3], "3つ目が" + (i + 1)
										+ "番目に取得したposiitonオブジェクトと1つ目が" + (i + 4)
										+ "番目に取得したpositionオブジェクトが同じ");
								strictEqual(Math.floor(times3[i] / 100), Math
										.floor(times1[i + 3] / 100), "3つ目が" + (i + 1)
										+ "番目に取得した時間と1つ目が" + (i + 4) + "番目に取得した時間が誤差100ms以内：");
							}
							start();
						});
			}, 2500);
		});

asyncTest('watchPosition 失敗 forceError=true', function() {
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

/**
 * 国土地理院 直線距離計算ページ http://vldb.gsi.go.jp/sokuchi/surveycalc/bl2stf.html 緯度・経度を北緯・東経に変換するサイト
 * http://www.yaskey.cside.tv/mapserver/note/degree.php 上記サイトから算出した特定地点の距離と、テストメソッドが返す値とを比較する。
 * ただし距離が長くなればなるほど誤差が生じるため、100km未満圏内の小数点以下の誤差は許容範囲とする。
 * (長距離の場合も考えて、距離によって誤差が大きくならない『測地線航海算法』で計算するメソッドの追加も要検討)
 */
test('getDistance - 100km未満 (誤差が1m未満であること)',
		function() {
			var result = h5.api.geo.getDistance(35.802739, 140.380034, 35.785796, 140.392265);
			equal(Math.floor(result), 2180, '成田空港の北側暫定滑走路の距離 - 世界測地系 (国土地理院算出値:2180.932m) 誤差:'
					+ (result - 2180.932) + 'm');
			var a = h5.api.geo.getDistance(35.681382, 139.766084, 35.828487, 139.803472,
					h5.api.geo.GS_GRS80);
			equal(Math.floor(a), 16668, '東京駅 - 草加駅 世界測地系 (国土地理院算出値:16668.546m) 誤差:'
					+ (a - 16668.546) + 'm');
			var b = h5.api.geo.getDistance(35.681382, 139.766084, 36.082744, 140.111234,
					h5.api.geo.GS_GRS80);
			equal(Math.floor(b), 54356, '東京駅 - つくば駅間 世界測地系 (国土地理院算出値:54356.124m) 誤差:'
					+ (b - 54356.124) + 'm');
			var c = h5.api.geo.getDistance(35.681382, 139.766084, 34.974689, 139.092264,
					h5.api.geo.GS_GRS80);
			equal(Math.floor(c), 99502, '東京駅 - 伊東駅間 世界測地系 (国土地理院算出値:99502.147m) 誤差:'
					+ (c - 99502.147) + 'm');
			var result4 = h5.api.geo.getDistance(35.802739, 140.380034, 35.785796, 140.392265,
					h5.api.geo.GS_BESSEL);
			equal(Math.floor(result4), 2180, '成田空港の北側暫定滑走路の距離 - 日本測地系 (国土地理院算出値:2180.693m) 誤差:'
					+ (result4 - 2180.693) + 'm');
			var aa = h5.api.geo.getDistance(35.681382, 139.766084, 35.828487, 139.803472,
					h5.api.geo.GS_BESSEL);
			equal(Math.floor(aa), 16666, '東京駅 - 草加駅 日本測地系 (国土地理院算出値:16666.767m) 誤差:'
					+ (aa - 16666.767) + 'm');
			var bb = h5.api.geo.getDistance(35.681382, 139.766084, 36.082744, 140.111234,
					h5.api.geo.GS_BESSEL);
			equal(Math.floor(bb), 54350, '東京駅 - つくば駅間 日本測地系 (国土地理院算出値:54350.115m) 誤差:'
					+ (bb - 54350.115) + 'm');
			var cc = h5.api.geo.getDistance(35.681382, 139.766084, 34.974689, 139.092264,
					h5.api.geo.GS_BESSEL);
			equal(Math.floor(cc), 99491, '東京駅 - 伊東駅間 日本測地系 (国土地理院算出値:99491.101m) 誤差:'
					+ (cc - 99491.101) + 'm');
		});
test('getDistance - 100km以上 (1m以上誤差が出てしまうが、期待値通りの値が取得できること)', function() {
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