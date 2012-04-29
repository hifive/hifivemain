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
/* ------ h5.api.geo ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	/** エラコード: 指定された緯度または経度の値が不正 */
	var ERR_CODE_INVALID_COORDS = 2000;
	/** エラーコード: getDistance()で、指定された計算モードの定数が不正 */
	var ERR_CODE_INVALID_GEOSYSTEM_CONSTANT = 2001;
	/** エラーコード: 位置情報の取得に失敗 */
	var ERR_CODE_POSITIONING_FAILURE = 2002;

	var errMsgMap = {};
	errMsgMap[ERR_CODE_INVALID_COORDS] = '正しい緯度または経度を指定して下さい。';
	errMsgMap[ERR_CODE_INVALID_GEOSYSTEM_CONSTANT] = '正しい計算モード定数を指定して下さい';
	errMsgMap[ERR_CODE_POSITIONING_FAILURE] = '位置情報の取得に失敗しました。';
	addFwErrorCodeMap(errMsgMap);

	// =============================
	// Development Only
	// =============================

	/* del begin */
	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// navigator.geolocationをキャッシュする変数
	var geo = null;
	function getGeo() {
		if (!geo) {
			geo = navigator.geolocation;
		}
		return geo;
	}

	var h5ua = h5.env.ua;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	// =============================
	// Variables
	// =============================

	// =============================
	// Functions
	// =============================

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	/**
	 * h5.api.geo.getDistance() の計算モードを指定するための定数クラス
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。以下のオブジェクトにアクセスするとインスタンスが返されます。
	 * </p>
	 * <ul>
	 * <li>h5.api.geo.GS_GRS80</li>
	 * <li>h5.api.geo.GS_BESSEL</li>
	 * </ul>
	 *
	 * @class
	 * @name GeodeticSystemEnum
	 */
	function GeodeticSystemEnum(oblateness, semiMajorAxis) {
		// 扁平率
		this.oblateness = oblateness;
		// 長(赤道)半径
		this.semiMajorAxis = semiMajorAxis;
	}
	/**
	 * 扁平率を取得します。
	 *
	 * @memberOf GeodeticSystemEnum
	 * @name getOblateness
	 * @returns {Number} 扁平率
	 */
	GeodeticSystemEnum.prototype.getOblateness = function() {
		return this.oblateness;
	};
	/**
	 * 長(赤道)半径を取得します。
	 *
	 * @memberOf GeodeticSystemEnum
	 * @name getSemiMajorAxis
	 * @returns {Number} 長(赤道)半径
	 */
	GeodeticSystemEnum.prototype.getSemiMajorAxis = function() {
		return this.semiMajorAxis;
	};

	/** 計算モード: 世界測地系(GRS80) */
	var GRS80 = new GeodeticSystemEnum(298.257222, 6378137);
	/** 計算モード: 日本測地系(BESSEL) */
	var BESSEL = new GeodeticSystemEnum(299.152813, 6377397.155);
	/** ラジアン毎秒 - 1度毎秒 */
	var DEGREES_PER_SECOND = Math.PI / 180;

	/**
	 * Geolocation API
	 *
	 * @memberOf h5.api
	 * @name geo
	 * @namespace
	 */
	function Geolocation() {
	// 空コンストラクタ
	}

	$.extend(Geolocation.prototype, {
		/**
		 * Geolocation APIが使用可能であるかの判定結果<br>
		 *
		 * @type Boolean
		 * @memberOf h5.api.geo
		 * @name isSupported
		 */
		// IE9の場合、navigator.geolocationにアクセスするとメモリーリークするのでエージェントで利用可能か判定する
		isSupported: (h5ua.isIE && h5ua.browserVersion >= 9) ? true : !!getGeo(),
		/**
		 * 現在地の緯度・経度を取得します。
		 *
		 * @memberOf h5.api.geo
		 * @name getCurrentPosition
		 * @function
		 * @param {Object} [option] 設定情報
		 * @param {Boolean} [option.enableHighAccuracy] 正確な位置を取得するか (ただし消費電力の増加や応答が遅延する)
		 * @param {Number} [option.timeout] 位置情報を取得するまで待機する時間 (ミリ秒)
		 * @param {Number} [option.maximumAge] キャッシュされた位置情報の有効期間を指定する (ミリ秒)
		 * @returns {Promise} Promiseオブジェクト
		 */
		getCurrentPosition: function(option) {
			var dfd = h5.async.deferred();
			getGeo().getCurrentPosition(function(geoPosition) {
				dfd.resolve(geoPosition);
			}, function(e) {
				dfd.reject(createRejectReason(ERR_CODE_POSITIONING_FAILURE, null, e));
			}, option);
			return dfd.promise();
		},
		/**
		 * 現在地の緯度・経度を定期的に送信します。
		 * <p>
		 * このメソッドは定期的に位置情報を取得するため、Deferred.progress()で値を取得します。<br>
		 * (Deferred.done()では値を取得できません。)
		 * <p>
		 * <b>実装例</b><br>
		 *
		 * <pre>
		 * h5.api.geo.watchPosition().progress(function(pos) {
		 * // 変数 pos に位置情報が格納されている。
		 * 		});
		 * </pre>
		 *
		 * @memberOf h5.api.geo
		 * @name watchPosition
		 * @function
		 * @param {Object} [option] 設定情報
		 * @param {Boolean} [option.enableHighAccuracy] 正確な位置を取得するか (ただし消費電力の増加や応答が遅延する)
		 * @param {Number} [option.timeout] 位置情報を取得するまで待機する時間 (ミリ秒)
		 * @param {Number} [option.maximumAge] キャッシュされた位置情報の有効期間を指定する (ミリ秒)
		 * @returns {WatchPositionPromise} WatchPositionPromiseオブジェクト
		 */
		watchPosition: function(option) {
			var dfd = h5.async.deferred();
			var id = getGeo().watchPosition(function(pos) {
				dfd.notify(pos);
			}, function(e) {
				dfd.reject(createRejectReason(ERR_CODE_POSITIONING_FAILURE, null, e));
			}, option);
			/**
			 * h5.api.geo.watchPositionがこのオブジェクトをプロミス化して返します。
			 * <p>
			 * このオブジェクトは自分でnewすることはありません。<b>h5.api.geo.watchPosition</b>関数を呼び出すとインスタンスが返されます。
			 * </p>
			 *
			 * @class
			 * @name WatchPositionPromise
			 */
			function WatchPositionPromise() {
			// 空コンストラクタ
			}
			/**
			 * h5.api.geo.watchPositionで行っているユーザの位置監視を終了します。
			 * <p>
			 * ユーザの位置監視を終了し、Deferred.done()が実行されます。
			 * </p>
			 *
			 * @memberOf WatchPositionPromise
			 * @name unwatch
			 */
			WatchPositionPromise.prototype.unwatch = function() {
				getGeo().clearWatch(id);
				dfd.resolve();
			};
			return dfd.promise(new WatchPositionPromise());
		},
		/**
		 * ヒュベニの法則を使用して、2点間の緯度・経度から直線距離(m)を取得します。
		 * <p>
		 * 定数に使用している長半径・扁平率は国土地理院で紹介されている値を使用。
		 * <p>
		 * 注意:アルゴリズム上、長距離(100km以上)の地点を図る場合1m以上の誤差が出てしまいます。
		 * <h4>計算モードの指定方法</h4>
		 * 計算モードの指定は以下の定数クラスを使用します。<br>
		 * <table border="1">
		 * <tr>
		 * <td>h5.api.geo.GS_GRS80</td>
		 * <td>世界測地系</td>
		 * </tr>
		 * <tr>
		 * <td>h5.api.geo.GS_BESSEL</td>
		 * <td>日本測地系</td>
		 * </tr>
		 * </table>
		 *
		 * @memberOf h5.api.geo
		 * @name getDistance
		 * @function
		 * @param {Number} lat1 地点1の緯度
		 * @param {Number} lng1 地点1の経度
		 * @param {Number} lat2 地点2の緯度
		 * @param {Number} lng2 地点2の経度
		 * @param {GeodeticSystemEnum} [geoSystem] 計算モード定数
		 *            (h5.api.geo.GS_GRS80:世界測地系(未指定の場合このモードで計算する) / h5.api.geo.GS_BESSEL: 日本測地系)
		 * @returns {Number} 2点間の直線距離
		 */
		// TODO 長距離の場合も考えて、距離によって誤差が大きくならない『測地線航海算法』で計算するメソッドの追加も要検討
		getDistance: function(lat1, lng1, lat2, lng2, geoSystem) {
			if (!isFinite(lat1) || !isFinite(lng1) || !isFinite(lat2) || !isFinite(lng2)) {
				throw new throwFwError(ERR_CODE_INVALID_COORDS);
			}
			var geodeticMode = geoSystem ? geoSystem : GRS80;
			if (!(geodeticMode instanceof GeodeticSystemEnum)) {
				throw new throwFwError(ERR_CODE_INVALID_GEOSYSTEM_CONSTANT);
			}
			// 長半径(赤道半径)
			var A = geodeticMode.getSemiMajorAxis();
			// 扁平率
			var O = geodeticMode.getOblateness();
			// 起点の緯度のラジアン
			var latRad1 = lat1 * DEGREES_PER_SECOND;
			// 起点の経度のラジアン
			var lngRad1 = lng1 * DEGREES_PER_SECOND;
			// 終点の緯度のラジアン
			var latRad2 = lat2 * DEGREES_PER_SECOND;
			// 終点の経度のラジアン
			var lngRad2 = lng2 * DEGREES_PER_SECOND;
			// 2点の平均緯度
			var avgLat = (latRad1 + latRad2) / 2;
			// 第一離心率
			var e = (Math.sqrt(2 * O - 1)) / O;
			var e2 = Math.pow(e, 2);
			var W = Math.sqrt(1 - e2 * Math.pow(Math.sin(avgLat), 2));
			// 短半径(極半径)
			var semiminorAxis = A * (1 - e2);
			// 子午線曲率半径
			var M = semiminorAxis / Math.pow(W, 3);
			// 卯酉船曲率半径
			var N = A / W;
			// 2点の緯度差
			var deltaLat = latRad1 - latRad2;
			// 2点の経度差
			var deltaLon = lngRad1 - lngRad2;
			return Math.sqrt(Math.pow(M * deltaLat, 2)
					+ Math.pow(N * Math.cos(avgLat) * deltaLon, 2));
		},
		/**
		 * getDistanceメソッドで使用する計算モード定数 (世界測地系:GRS80)
		 *
		 * @constant
		 * @memberOf h5.api.geo
		 * @name GS_GRS80
		 */
		GS_GRS80: GRS80,
		/**
		 * getDistanceメソッドで使用する計算モード定数 (日本測地系:BESSEL)
		 *
		 * @constant
		 * @memberOf h5.api.geo
		 * @name GS_BESSEL
		 */
		GS_BESSEL: BESSEL
	});

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5.api', {
		geo: new Geolocation()
	});
})();