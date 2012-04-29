/* del begin */
/*
 * Copyright (C) 2011-2012 NS Solutions Corporation.
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
/* ------ h5.dev.api.geo ------ */
(function() {
	if (!h5) {
		return;
	}

	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	// =============================
	// Development Only
	// =============================


	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	// =============================
	// Variables
	// =============================

	/**
	 * 元のh5.api.geo
	 *
	 * @private
	 */
	var originalAPI = {};

	/**
	 * _watchPositionで作られたdeferredオブジェクトの配列
	 *
	 * @private
	 * @type deferred[]
	 */
	var _dfds = [];
	/**
	 * _watchPositionで作られたdeferredオブジェクトに割り当てるID
	 *
	 * @private
	 * @type Number
	 */
	var _dfdID = 0;
	/**
	 * _watchPositionで使用するsetInterval()のタイマーID
	 *
	 * @private
	 * @type Number
	 */
	var _timerID = null;
	/**
	 * _watchPositionがデバッグ用位置情報の何番目を見ているかを設定します。
	 *
	 * @private
	 * @type Number
	 */
	var _watchPointer = 0;

	// =============================
	// Functions
	// =============================
	/**
	 * 以下の構造の位置情報オブジェクトを生成します<br>
	 * <p>
	 * <table border="1">
	 * <tr>
	 * <td>プロパティ名</td>
	 * <td>説明</td>
	 * </tr>
	 * <tr>
	 * <td>latitude</td>
	 * <td>緯度</td>
	 * </tr>
	 * <tr>
	 * <td>longitude</td>
	 * <td>経度</td>
	 * </tr>
	 * <tr>
	 * <td>accuracy</td>
	 * <td>位置の誤差(m)</td>
	 * </tr>
	 * <tr>
	 * <td>altitude</td>
	 * <td>高度(m)</td>
	 * </tr>
	 * <tr>
	 * <td>altitudeAccuracy</td>
	 * <td>高度の誤差(m)</td>
	 * </tr>
	 * <tr>
	 * <td>heading</td>
	 * <td>方角(0～360)(度)</td>
	 * </tr>
	 * <tr>
	 * <td>speed</td>
	 * <td>速度 (m/s)</td>
	 * </tr>
	 * <tr>
	 * <td>timestamp</td>
	 * <td>時刻</td>
	 * </tr>
	 * </table>
	 *
	 * @memberOf h5.dev.api.geo
	 * @private
	 * @params {Object} dummyPosition dummyPositionsに格納されたオブジェクト
	 * @returns {Object} 位置情報オブジェクト
	 * @type Object[]
	 */
	function createPosition(params) {
		var param = params || {};
		param.timestamp = param.timestamp || new Date().getTime();
		var coords = param.coords ? param.coords : param;
		param.coords = {
			latitude: coords.latitude || 0,
			longitude: coords.longitude || 0,
			accuracy: coords.accuracy || 0,
			altitude: coords.altitude || null,
			altitudeAccuracy: coords.altitudeAccuracy || null,
			heading: coords.heading || null,
			speed: coords.speed || null
		};
		return param;
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	// originalAPI に 元のgetCurrentPositionとwatchPositionをとっておく
	originalAPI.getCurrentPosition = h5.api.geo.getCurrentPosition;
	originalAPI.watchPosition = h5.api.geo.watchPosition;
	/**
	 * デバッグ用 PositionErrorクラス 以下のAPIが失敗時に返すオブジェクトと同様の構造を持つ。
	 * <ul>
	 * <li>navigator.geolocation.getWachPosition</li>
	 * <li>navigator.geolocation.currentPosition</li>
	 * </ul>
	 */
	function DummyPositionError() {
		this.PERMISSION_DENIED = 1;
		this.POSITION_UNAVALABLE = 2;
		this.TIMEOUT = 3;
	}

	DummyPositionError.prototype.code = 1;
	DummyPositionError.prototype.message = '';

	function H5GeolocationSupport() {
	// 空コンストラクタ
	}

	/**
	 * ※この関数はh5.dev.jsを読み込んだ場合のみ利用可能です。開発支援用機能のため、最終リリース物にh5.dev.jsやデバッグコードが混入しないよう十分ご注意ください。<br>
	 * dummyPosiitonsへ位置情報オブジェクトを格納して使用してください。位置情報はcreatePosition()で作成することができます。
	 *
	 * @memberOf h5.dev.api
	 * @name geo
	 * @namespace
	 */
	$.extend(H5GeolocationSupport.prototype, {
		/**
		 * 強制的にロケーションの取得に失敗させるかどうか
		 *
		 * @memberOf h5.dev.api.geo
		 * @type Boolean
		 */
		forceError: false,
		/**
		 * _watchPositionの座標の送信間隔(ms)
		 *
		 * @memberOf h5.dev.api.geo
		 * @type Number
		 */
		watchIntervalTime: 1000,
		/**
		 * デバッグ用位置情報
		 * <p>
		 * 位置情報オブジェクトを格納する配列です。 以下のようなオブジェクトを格納してください。
		 * </p>
		 * <table class="params" style=""><thead>
		 * <tr>
		 * <th>Name</th>
		 * <th>Type</th>
		 * <th>Argument</th>
		 * <th class="last">Description</th>
		 * </tr>
		 * </thead><tbody>
		 * <tr>
		 * <td class="name"><code>coords</code></td>
		 * <td class="type"> Object </td>
		 * <td class="attributes"></td>
		 * <td class="description last">
		 * <h6>Properties</h6>
		 * <table class="params"><thead>
		 * <tr>
		 * <th>Name</th>
		 * <th>Type</th>
		 * <th>Argument</th>
		 * <th>Default</th>
		 * <th class="last">Description</th>
		 * </tr>
		 * </thead><tbody>
		 * <tr>
		 * <td class="name"><code>latitude</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> 0 </td>
		 * <td class="description last">緯度</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>longitude</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> 0 </td>
		 * <td class="description last">経度</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>accuracy</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> 50 </td>
		 * <td class="description last">位置の誤差(m)</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>altitude</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> null </td>
		 * <td class="description last">高度(m)</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>altitudeAccuracy</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> null </td>
		 * <td class="description last">高度の誤差(m)</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>heading</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> null </td>
		 * <td class="description last">方角(0～360)(度)</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>speed</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> null </td>
		 * <td class="description last">速度 (m/s)</td>
		 * </tr>
		 * </tbody></table></td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>timestamp</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="description last">タイムスタンプ。省略時は取得時のタイムスタンプが自動で格納されます。</td>
		 * </tr>
		 * </tbody></table> <br>
		 * <br>
		 *
		 * <pre>
		 * 	例１．
		 * 	h5.api.geo.dummyPositions.push({
		 * 		coords:{
		 * 			latitude: 35.45019435393257,
		 * 			longitude: 139.6305128879394,
		 * 			accuracy: 50,
		 * 			altitude: 100,
		 * 			altitudeAccuracy: 100,
		 * 			heading: 90,
		 * 			speed: 9
		 * 		}
		 * 	timestamp: 1331106454545
		 * 	})
		 * </pre>
		 *
		 * <p>
		 * 省略したプロパティにはdefault値が入ります。timestampを省略すると、取得時に値が格納されます。
		 * </p>
		 *
		 * <pre>
		 * 	例２．
		 * 	h5.api.geo.dummyPositions.push({
		 * 		coords: {
		 * 			latitude: 35.45019435393257,
		 * 			longitude: 139.6305128879394,
		 * 		}
		 * 	})
		 * </pre>
		 *
		 * <p>
		 * coordsの中身だけを記述して格納することもできます。getPositionや_watchPositionでの取得時にcoordsプロパティに格納して返します。省略したプロパティにはdefault値が入ります。
		 * timestampには取得時に値が格納されます。
		 * </p>
		 *
		 * <pre>
		 * 	例３．
		 * 	h5.api.geo.dummyPositions.push(
		 * 		latitude: 35.45019435393257,
		 * 		longitude: 139.6305128879394
		 * 	})
		 * </pre>
		 *
		 * <p>
		 * <a href="../sandbox/geolocation/index.html">座標データ生成ツール</a>を使うと地図から緯度と経度を求められます。
		 * </p>
		 *
		 * @memberOf h5.dev.api.geo
		 * @type Object[]
		 */
		dummyPositions: []
	});

	/**
	 * dummyPositionsの先頭の位置情報を返します。dummyPositionsがオブジェクトの場合はdummyPositionsを返します。
	 * <p>
	 * このメソッドはh5.api.geo.getCurrentPosition()で呼びます。※ h5.dev.api.geo.getCurrentPosition()ではありません。
	 * </p>
	 * <p>
	 * dummyPositionsに値が設定されていない場合は元のh5.api.geoのメソッドを実行します。
	 * </p>
	 *
	 * @memberOf h5.dev.api.geo
	 * @function
	 * @param {Object} [option] 設定情報
	 * @param {Boolean} [option.enableHighAccuracy] 正確な位置を取得するか (ただし消費電力の増加や応答が遅延する)
	 * @param {Number} [option.timeout] 位置情報を取得するまで待機する時間 (ミリ秒)
	 * @param {Number} [option.maximumAge] キャッシュされた位置情報の有効期間を指定する (ミリ秒)
	 * @returns {Promise} Promiseオブジェクト
	 */
	function getCurrentPosition(option) {
		var dfd = h5.async.deferred();
		if (h5.dev.api.geo.forceError) {
			setTimeout(function() {
				dfd.reject({
					code: 'forceError'
				});
			}, 0);
			return dfd.promise();
		}

		var dummyPositions = h5.dev.api.geo.dummyPositions;
		if (!dummyPositions || dummyPositions.length === 0) {
			return originalAPI.getCurrentPosition(option);
		}
		// dummyPositionsが配列でない場合も対応する
		var dummyPositions = $.isArray(h5.dev.api.geo.dummyPositions) ? h5.dev.api.geo.dummyPositions
				: [h5.dev.api.geo.dummyPositions];

		setTimeout(function() {
			if (dummyPositions.length > 0) {
				dfd.resolve(createPosition(dummyPositions[0]));
			} else {
				dfd.reject({
					code: new DummyPositionError().POSITION_UNAVALABLE
				});
			}
		}, 0);
		return dfd.promise();
	}

	/**
	 * dummyPositionsの緯度・緯度を順番に返します。 dummyPositionsの末尾まで到達すると、末尾の要素を返し続けます。
	 * <p>
	 * このメソッドはh5.api.geo.watchPosition()で呼びます。※ h5.dev.api.geo.watchtPosition()ではありません。
	 * </p>
	 * <p>
	 * dummyPositionsに値が設定されていない場合は元のh5.api.geoのメソッドを実行します。
	 * </p>
	 *
	 * @memberOf h5.dev.api.geo
	 * @function
	 * @name watchPosition
	 * @param {Object} [option] 設定情報
	 * @param {Boolean} [option.enableHighAccuracy] 正確な位置を取得するか (ただし消費電力の増加や応答が遅延する)
	 * @param {Number} [option.timeout] 位置情報を取得するまで待機する時間 (ミリ秒)
	 * @param {Number} [option.maximumAge] キャッシュされた位置情報の有効期間を指定する (ミリ秒)
	 * @returns {WatchPositionPromise} WatchPositionPromiseオブジェクト
	 */
	function watchPosition(option) {
		var dfd = h5.async.deferred();
		if (h5.dev.api.geo.forceError) {
			setTimeout(function() {
				dfd.reject({
					code: 'forceError'
				});
			}, 0);
			return dfd.promise();
		}
		// dummyPositionsが配列でない場合も対応する
		var dummyPos = $.isArray(h5.dev.api.geo.dummyPositions) ? h5.dev.api.geo.dummyPositions
				: [h5.dev.api.geo.dummyPositions].slice(0);
		if (dummyPos.length === 0) {
			return originalAPI.watchPosition(option);
		}
		var that = this;
		var watchID = _dfdID++;
		// WatchPositionPromiseクラス
		// _watchPositionはこのクラスをプロミス化して返す。
		var WatchPositionPromise = function() {
		// コンストラクタ
		};
		// promiseオブジェクトにunwatchメソッドを付加
		WatchPositionPromise.prototype = {
			// unwatchを呼び出したdeferredを_dfds[]から削除
			unwatch: function() {
				if (!_dfds[watchID]) {
					// deferredオブジェクトが_dfdsに登録されていないのにunwatchが呼ばれる場合は
					// reject()済みであるため、resolve()する必要がない。
					return;
				}
				_dfds[watchID].resolve();
				delete _dfds[watchID];
				setTimeout(function() {
					// deferredオブジェクトがすべてなくなったらタイマーの停止
					// dummyPositionsの見ている位置を0に戻す。
					if ($.isEmptyObject(_dfds)) {
						clearInterval(_timerID);
						_timerID = null;
						_watchPointer = 0;
					}
				}, 0);
			}
		};

		setTimeout(function() {
			if (dummyPos.length > 0) {
				_dfds[watchID] = dfd;
				if (_timerID === null) {
					var intervalFunc = function() {
						var pos;
						if (_watchPointer >= dummyPos.length) {
							pos = dummyPos[dummyPos.length - 1];
						} else {
							pos = dummyPos[_watchPointer++];
						}
						for ( var id in _dfds) {
							_dfds[id].notify(createPosition(pos));
						}
					};
					intervalFunc();
					_timerID = setInterval(intervalFunc, h5.dev.api.geo.watchIntervalTime);
				}
			} else {
				dfd.reject({
					code: new DummyPositionError().POSITION_UNAVALABLE
				});
			}
		}, 0);
		return dfd.promise(new WatchPositionPromise(watchID));
	}

	// =============================
	// Expose to window
	// =============================

	// geolocation
	var h5GeolocationSupport = new H5GeolocationSupport();
	// getCurrentPosition と watchPosition を上書きする。
	$.extend(h5.api.geo, {
		getCurrentPosition: getCurrentPosition,
		watchPosition: watchPosition
	});
	h5.u.obj.expose('h5.dev.api.geo', h5GeolocationSupport);
})();
/* del end */
