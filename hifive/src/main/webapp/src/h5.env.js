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

/* ------ h5.env ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	// TODO エラーコード定数等Minify版（製品利用版）でも必要なものはここに書く

	// =============================
	// Development Only
	// =============================

	/* del begin */

	// TODO Minify時にプリプロセッサで削除されるべきものはこの中に書く
	/* del end */


	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// TODO 高速化のために他で定義されている関数などを変数に入れておく場合はここに書く
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	// TODO モジュールレベルのプライベート変数はここに書く
	// =============================
	// Functions
	// =============================
	function check(ua) {
		/**
		 * iPhoneであるかどうかを表します。
		 *
		 * @name isiPhone
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isiPhone = !!ua.match(/iPhone/i);
		/**
		 * iPadであるかどうかを表します。
		 *
		 * @name isiPad
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isiPad = !!ua.match(/iPad/i);
		/**
		 * iOSであるかどうかを表します。
		 *
		 * @name isiOS
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isiOS = isiPhone || isiPad;
		/**
		 * Androidであるかどうかを表します。
		 *
		 * @name isAndroid
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isAndroid = !!ua.match(/android/i);
		/**
		 * Windows Phoneであるかどうかを表します。
		 *
		 * @name isWindowsPhone
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isWindowsPhone = !!ua.match(/Windows Phone/i);
		/**
		 * ブラウザがInternet Explorerであるかどうかを表します。
		 *
		 * @name isIE
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isIE = !!ua.match(/MSIE/);
		/**
		 * ブラウザがFirefoxであるかどうかを表します。
		 *
		 * @name isFirefox
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isFirefox = !!ua.match(/Firefox/i);
		/**
		 * ブラウザがGoogle Chromeであるかどうかを表します。
		 *
		 * @name isChrome
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isChrome = !!ua.match(/Chrome/i) || !!ua.match(/CrMo/);
		/**
		 * ブラウザがSafariであるかどうかを表します。
		 *
		 * @name isSafari
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isSafari = !isAndroid && !!ua.match(/Safari/i) && !isChrome;
		/**
		 * レンダリングエンジンがWebkitであるかどうかを表します。
		 *
		 * @name isFirefox
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isWebkit = !!ua.match(/Webkit/i);
		/**
		 * ブラウザがOperaであるかどうかを表します。
		 *
		 * @name isOpera
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isOpera = !!ua.match(/Opera/i);
		/**
		 * ブラウザがAndroid標準ブラウザであるかどうかを表します。
		 *
		 * @name isOpera
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isAndroidDefaultBrowser = isAndroid && !!ua.match(/Safari/i) && !isChrome;
		/**
		 * スマートフォンであるかどうかを表します。<br />
		 * isiPhone, isWindowsPhoneがtrueならtrueとなります。<br />
		 * Androidの場合、判定は以下の場合にtrueとなります。
		 * <ul>
		 * <li>Android標準ブラウザ、かつユーザーエージェントに"Mobile"を含む、かつ"SC-01C"を含まない。 </li>
		 * <li>ユーザーエージェントに"Fennec"を含む。</li>
		 * <li>ユーザーエージェントに"Opera Mobi"を含む。</li>
		 * </ul>
		 *
		 * @name isSmartPhone
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isSmartPhone = !!(isiPhone || isWindowsPhone
				|| (isAndroidDefaultBrowser && ua.match(/Mobile/) && !ua.match(/SC-01C/))
				|| (isAndroid && isChrome && ua.match(/Mobile/)) || ua.match(/Fennec/i) || ua
				.match(/Opera Mobi/i));
		/**
		 * タブレットであるかどうかを表します。<br />
		 * isiPadがtrueならtrueとなります。<br />
		 * Androidの場合、判定は以下の場合にtrueとなります。
		 * <ul>
		 * <li>Android標準ブラウザ、かつユーザーエージェントに"Mobile"を含まない。ただし"SC-01C"を含む場合はtrue。 </li>
		 * <li>ユーザーエージェントに"Fennec"を含む。</li>
		 * <li>ユーザーエージェントに"Opera Tablet"を含む。</li>
		 * </ul>
		 *
		 * @name isTablet
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isTablet = !!(isiPad || (isAndroidDefaultBrowser && !ua.match(/Mobile/))
				|| (isAndroid && isChrome && !ua.match(/Mobile/)) || ua.match(/SC-01C/)
				|| ua.match(/Fennec/i) || ua.match(/Opera Tablet/i));
		/**
		 * PCであるかどうかを表します。
		 *
		 * @name isDesktop
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isDesktop = !isSmartPhone && !isTablet;
		/**
		 * OSのバージョンを表します。<br />
		 * h5.env.ua.isDesktopがtrueである場合、値はnullになります。
		 *
		 * @name osVersion
		 * @type Number
		 * @memberOf h5.env.ua
		 */
		var osVersion = null;
		/**
		 * OSのフルバージョンを表します。<br />
		 * h5.env.ua.isDesktopがtrueである場合、値はnullになります。
		 *
		 * @name osVersionFull
		 * @type String
		 * @memberOf h5.env.ua
		 */
		var osVersionFull = null;
		var getiOSVersion = function(pre, post) {
			return $.trim(ua.substring(ua.indexOf(pre) + pre.length, ua.indexOf(post))).split('_');
		};
		var getVersion = function(target, end, ignoreCase) {
			var r = ignoreCase === false ? new RegExp(target + end) : new RegExp(target + end, 'i');
			return $.trim(ua.match(r));
		};
		var spaceSplit = function(target, ignoreCase) {
			var v = getVersion(target, '[^;)]*', ignoreCase).split(' ');
			return v[v.length - 1];
		};
		var slashSplit = function(target, ignoreCase) {
			var v = getVersion(target, '[^;) ]*', ignoreCase).split('/');
			return v[v.length - 1];
		};
		var getMainVersion = function(target) {
			return parseInt(target.split('.')[0]);
		};
		if (isiPhone) {
			var s = getiOSVersion('iPhone OS', 'like');
			osVersion = parseInt(s[0]);
			osVersionFull = s.join('.');
		} else if (isiPad) {
			var s = getiOSVersion('CPU OS', 'like');
			osVersion = parseInt(s[0]);
			osVersionFull = s.join('.');
		} else if (isAndroid && isFirefox) {
			// FennecはAndroidのバージョンを取得することができない。
		} else if (isAndroid) {
			var s = spaceSplit('Android');
			osVersion = getMainVersion(s);
			osVersionFull = s;
		} else if (isWindowsPhone) {
			var s = spaceSplit('Windows Phone OS');
			if (!s) {
				s = spaceSplit('Windows Phone');
			}
			osVersion = getMainVersion(s);
			osVersionFull = s;
		}
		// デスクトップの場合。osVersion, osVersionFullはnull
		/**
		 * ブラウザのバージョンを表します。
		 *
		 * @name browserVersion
		 * @type Number
		 * @memberOf h5.env.ua
		 */
		var browserVersion = null;
		/**
		 * ブラウザのフルバージョンを表します。
		 *
		 * @name browserVersionFull
		 * @type String
		 * @memberOf h5.env.ua
		 */
		var browserVersionFull = null;
		if (isiOS || (isAndroid && isAndroidDefaultBrowser)) {
			browserVersion = osVersion;
			browserVersionFull = osVersionFull;
		} else {
			var version = null;
			if (isIE) {
				version = spaceSplit('MSIE', false);
			} else if (isChrome) {
				version = slashSplit('Chrome', false);
				if (!version) {
					version = slashSplit('CrMo', false);
				}
			} else if (isSafari) {
				version = slashSplit('Version');
			} else if (isFirefox) {
				version = slashSplit('Firefox');
			} else if (isOpera) {
				version = slashSplit('Version');
				if (!version) {
					version = slashSplit('Opera');
				}
				if (!version) {
					version = spaceSplit('Opera');
				}
			}
			if (version) {
				browserVersion = getMainVersion(version);
				browserVersionFull = version;
			}
		}
		return {
			osVersion: osVersion,
			osVersionFull: osVersionFull,
			browserVersion: browserVersion,
			browserVersionFull: browserVersionFull,
			isiPhone: isiPhone,
			isiPad: isiPad,
			isiOS: isiOS,
			isAndroid: isAndroid,
			isWindowsPhone: isWindowsPhone,
			isIE: isIE,
			isFirefox: isFirefox,
			isChrome: isChrome,
			isSafari: isSafari,
			isOpera: isOpera,
			isAndroidDefaultBrowser: isAndroidDefaultBrowser,
			isSmartPhone: isSmartPhone,
			isTablet: isTablet,
			isDesktop: isDesktop,
			isWebkit: isWebkit
		};
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	// =============================
	// Expose to window
	// =============================
	/**
	 * @namespace
	 * @name env
	 * @memberOf h5
	 */
	/**
	 * ユーザーエージェントからOS、ブラウザを判別します。<br />
	 * 『Geolocationが使えるか』等機能の有無を判別したい場合は、これらのプロパティを使わず機能の有無をチェックしてください。<br />
	 * たとえばGeolocation機能はh5.api.geo.isSupportedで判別できます。
	 *
	 * @namespace
	 * @name ua
	 * @memberOf h5.env
	 */
	h5.u.obj.expose('h5.env', {
		ua: check(navigator.userAgent)
	});
	/* del begin */
	// テストのためにグローバルに公開。プリプロセッサで削除される。
	h5.u.obj.expose('h5.env', {
		__check: check
	});
	/* del end */
})();