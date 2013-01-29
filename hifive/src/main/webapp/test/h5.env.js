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
	var ERR = ERRCODE.h5.env;

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

	module("[build#min]h5.env");

	//=============================
	// Body
	//=============================

	test(
			'uaの確認(Android 4.0.1, Chrome for Android 16.0.912.75)',
			function() {
				// Galaxy Nexus
				var ua = 'Mozilla/5.0 (Linux; U; Android 4.0.1; ja-jp; Galaxy Nexus Build/ITL41D) AppleWebKit/535.7 (KHTML, like Gecko) CrMo/16.0.912.75 Mobile Safari/535.7';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, 4, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, '4.0.1', 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 16, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '16.0.912.75', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, false, 'iOSか');
				strictEqual(ret.isAndroid, true, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, false, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, true, 'Chromeか');
				strictEqual(ret.isSafari, false, 'Safariか');
				strictEqual(ret.isOpera, false, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, true, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, false, 'デスクトップか');
				strictEqual(ret.isWebkit, true, 'Webkitか');
			});
	test(
			'uaの確認(Android 2.3.4, Android標準ブラウザ)',
			function() {
				var ua = 'Mozilla/5.0 (Linux; U; Android 2.3.4; ja-jp; SonyEricssonIS11S Build/4.0.1.B.0.112) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, 2, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, '2.3.4', 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 2, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '2.3.4', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, false, 'iOSか');
				strictEqual(ret.isAndroid, true, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, false, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, false, 'Chromeか');
				strictEqual(ret.isSafari, false, 'Safariか');
				strictEqual(ret.isOpera, false, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, true, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, true, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, false, 'デスクトップか');
				strictEqual(ret.isWebkit, true, 'Webkitか');
			});
	test(
			'uaの確認(iPhone 5.0.1, Safari)',
			function() {
				var ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Mobile/9A405 Safari/7534.48.3';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, 5, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, '5.0.1', 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 5, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '5.0.1', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, true, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, true, 'iOSか');
				strictEqual(ret.isAndroid, false, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, false, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, false, 'Chromeか');
				strictEqual(ret.isSafari, true, 'Safariか');
				strictEqual(ret.isOpera, false, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, true, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, false, 'デスクトップか');
				strictEqual(ret.isWebkit, true, 'Webkitか');
			});
	test(
			'uaの確認(iPad 4.3.4, Safari)',
			function() {
				var ua = 'Mozilla/5.0 (iPad; U; CPU OS 4_3_4 like Mac OS X; ja-jp) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8K2 Safari/6533.18.5';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, 4, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, '4.3.4', 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 4, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '4.3.4', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, true, 'iPadか');
				strictEqual(ret.isiOS, true, 'iOSか');
				strictEqual(ret.isAndroid, false, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, false, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, false, 'Chromeか');
				strictEqual(ret.isSafari, true, 'Safariか');
				strictEqual(ret.isOpera, false, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, false, 'スマートフォンか');
				strictEqual(ret.isTablet, true, 'タブレットか');
				strictEqual(ret.isDesktop, false, 'デスクトップか');
				strictEqual(ret.isWebkit, true, 'Webkitか');
			});
	test(
			'uaの確認(Windows Phone 7.5, IE 9.0)',
			function() {
				var ua = 'Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0; FujitsuToshibaMobileCommun; IS12T; KDDI)';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, 7, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, '7.5', 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 9, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '9.0', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, false, 'iOSか');
				strictEqual(ret.isAndroid, false, 'Androidか');
				strictEqual(ret.isWindowsPhone, true, 'WindowsPhoneか');
				strictEqual(ret.isIE, true, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, false, 'Chromeか');
				strictEqual(ret.isSafari, false, 'Safariか');
				strictEqual(ret.isOpera, false, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, true, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, false, 'デスクトップか');
				strictEqual(ret.isWebkit, false, 'Webkitか');
			});
	test(
			'uaの確認(Windows NT 5.1, IE 8.0)',
			function() {
				var ua = 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 2.0.50727; InfoPath.1';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, null, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, null, 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 8, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '8.0', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, false, 'iOSか');
				strictEqual(ret.isAndroid, false, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, true, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, false, 'Chromeか');
				strictEqual(ret.isSafari, false, 'Safariか');
				strictEqual(ret.isOpera, false, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, false, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, true, 'デスクトップか');
				strictEqual(ret.isWebkit, false, 'Webkitか');
			});
	test(
			'uaの確認(Ubuntu 10.04, Chrome 15.0.874.106)',
			function() {
				var ua = 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/535.2 (KHTML, like Gecko) Ubuntu/10.04 Chromium/15.0.874.106 Chrome/15.0.874.106 Safari/535.2';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, null, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, null, 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 15, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '15.0.874.106', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, false, 'iOSか');
				strictEqual(ret.isAndroid, false, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, false, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, true, 'Chromeか');
				strictEqual(ret.isSafari, false, 'Safariか');
				strictEqual(ret.isOpera, false, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, false, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, true, 'デスクトップか');
				strictEqual(ret.isWebkit, true, 'Webkitか');
			});
	test(
			'uaの確認(Max OS X, Firefox 8.0.1)',
			function() {
				var ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.5; rv:8.0.1) Gecko/20100101 Firefox/8.0.1';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, null, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, null, 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 8, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '8.0.1', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, false, 'iOSか');
				strictEqual(ret.isAndroid, false, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, false, 'IEか');
				strictEqual(ret.isFirefox, true, 'Firefoxか');
				strictEqual(ret.isChrome, false, 'Chromeか');
				strictEqual(ret.isSafari, false, 'Safariか');
				strictEqual(ret.isOpera, false, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, false, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, true, 'デスクトップか');
				strictEqual(ret.isWebkit, false, 'Webkitか');
			});
	test(
			'uaの確認(Max OS X, Safari 5.1.2)',
			function() {
				var ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.52.7 (KHTML, like Gecko) Version/5.1.2 Safari/534.52.7';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, null, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, null, 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 5, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '5.1.2', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, false, 'iOSか');
				strictEqual(ret.isAndroid, false, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, false, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, false, 'Chromeか');
				strictEqual(ret.isSafari, true, 'Safariか');
				strictEqual(ret.isOpera, false, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, false, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, true, 'デスクトップか');
				strictEqual(ret.isWebkit, true, 'Webkitか');
			});
	test('uaの確認(Windows NT 5.1, Opera 9.62)', function() {
		var ua = 'Opera/9.62 (Windows NT 5.1; U; ja) Presto/2.1.1';
		var ret = h5.env.__check(ua);
		strictEqual(ret.osVersion, null, 'OSのバージョンは正しいか');
		strictEqual(ret.osVersionFull, null, 'OSのフルバージョンは正しいか');
		strictEqual(ret.browserVersion, 9, 'ブラウザのバージョンは正しいか');
		strictEqual(ret.browserVersionFull, '9.62', 'ブラウザのフルバージョンは正しいか');
		strictEqual(ret.isiPhone, false, 'iPhoneか');
		strictEqual(ret.isiPad, false, 'iPadか');
		strictEqual(ret.isiOS, false, 'iOSか');
		strictEqual(ret.isAndroid, false, 'Androidか');
		strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
		strictEqual(ret.isIE, false, 'IEか');
		strictEqual(ret.isFirefox, false, 'Firefoxか');
		strictEqual(ret.isChrome, false, 'Chromeか');
		strictEqual(ret.isSafari, false, 'Safariか');
		strictEqual(ret.isOpera, true, 'Operaか');
		strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
		strictEqual(ret.isSmartPhone, false, 'スマートフォンか');
		strictEqual(ret.isTablet, false, 'タブレットか');
		strictEqual(ret.isDesktop, true, 'デスクトップか');
		strictEqual(ret.isWebkit, false, 'Webkitか');
	});
	test(
			'uaの確認(Android 2.3.3, Opera Mobi 11.50)',
			function() {
				var ua = 'Opera/9.80 (Android 2.3.3; Linux; Opera Mobi/ADR-1111101157; U; ja) Presto/2.9.201 Version/11.50';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, 2, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, '2.3.3', 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 11, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '11.50', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, false, 'iOSか');
				strictEqual(ret.isAndroid, true, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, false, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, false, 'Chromeか');
				strictEqual(ret.isSafari, false, 'Safariか');
				strictEqual(ret.isOpera, true, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, true, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, false, 'デスクトップか');
				strictEqual(ret.isWebkit, false, 'Webkitか');
			});

	test(
			'uaの確認(Android 3.2.1, Opera Tablet 11.10)',
			function() {
				var ua = 'Opera/9.80 (Android 3.2.1; Linux; Opera Tablet/ADR-1109081720; U; ja) Presto/2.8.149 Version/11.10';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, 3, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, '3.2.1', 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 11, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '11.10', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, false, 'iOSか');
				strictEqual(ret.isAndroid, true, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, false, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, false, 'Chromeか');
				strictEqual(ret.isSafari, false, 'Safariか');
				strictEqual(ret.isOpera, true, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, false, 'スマートフォンか');
				strictEqual(ret.isTablet, true, 'タブレットか');
				strictEqual(ret.isDesktop, false, 'デスクトップか');
				strictEqual(ret.isWebkit, false, 'Webkitか');
			});

	test(
			'uaの確認(Windows Phone 6.5, IE 6.0)',
			function() {
				var ua = 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; KDDI-TS01; Windows Phone 6.5.3.5)';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, 6, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, '6.5.3.5', 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 6, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '6.0', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, false, 'iOSか');
				strictEqual(ret.isAndroid, false, 'Androidか');
				strictEqual(ret.isWindowsPhone, true, 'WindowsPhoneか');
				strictEqual(ret.isIE, true, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, false, 'Chromeか');
				strictEqual(ret.isSafari, false, 'Safariか');
				strictEqual(ret.isOpera, false, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, true, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, false, 'デスクトップか');
				strictEqual(ret.isWebkit, false, 'Webkitか');
			});

	test('uaの確認(Opera/9.80 (Windows NT 6.1; U; ja) Presto/2.10.229 Version/11.61)', function() {
		var ua = 'Opera/9.80 (Windows NT 6.1; U; ja) Presto/2.10.229 Version/11.61';
		var ret = h5.env.__check(ua);
		strictEqual(ret.osVersion, null, 'OSのバージョンは正しいか');
		strictEqual(ret.osVersionFull, null, 'OSのフルバージョンは正しいか');
		strictEqual(ret.browserVersion, 11, 'ブラウザのバージョンは正しいか');
		strictEqual(ret.browserVersionFull, '11.61', 'ブラウザのフルバージョンは正しいか');
		strictEqual(ret.isiPhone, false, 'iPhoneか');
		strictEqual(ret.isiPad, false, 'iPadか');
		strictEqual(ret.isiOS, false, 'iOSか');
		strictEqual(ret.isAndroid, false, 'Androidか');
		strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
		strictEqual(ret.isIE, false, 'IEか');
		strictEqual(ret.isFirefox, false, 'Firefoxか');
		strictEqual(ret.isChrome, false, 'Chromeか');
		strictEqual(ret.isSafari, false, 'Safariか');
		strictEqual(ret.isOpera, true, 'Operaか');
		strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
		strictEqual(ret.isSmartPhone, false, 'スマートフォンか');
		strictEqual(ret.isTablet, false, 'タブレットか');
		strictEqual(ret.isDesktop, true, 'デスクトップか');
		strictEqual(ret.isWebkit, false, 'Webkitか');
	});


	test('uaの確認(Mozilla/4.0 (compatible; MSIE 6.0; X11; Linux i686; ja) Opera 10.10)',
			function() {
				var ua = 'Mozilla/4.0 (compatible; MSIE 6.0; X11; Linux i686; ja) Opera 10.10';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, null, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, null, 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 10, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '10.10', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, false, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, false, 'iOSか');
				strictEqual(ret.isAndroid, false, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, false, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, false, 'Chromeか');
				strictEqual(ret.isSafari, false, 'Safariか');
				strictEqual(ret.isOpera, true, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, false, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, true, 'デスクトップか');
				strictEqual(ret.isWebkit, false, 'Webkitか');
			});

	// https://developers.google.com/chrome/mobile/docs/user-agent
	test(
			'uaの確認(Chrome for iOS 19.0.1084.60)',
			function() {
				var ua = 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 5_1_1 like Mac OS X; ja-jp) AppleWebKit/534.46.0 (KHTML, like Gecko) CriOS/19.0.1084.60 Mobile/9B206 Safari/7534.48.3';
				var ret = h5.env.__check(ua);
				strictEqual(ret.osVersion, 5, 'OSのバージョンは正しいか');
				strictEqual(ret.osVersionFull, '5.1.1', 'OSのフルバージョンは正しいか');
				strictEqual(ret.browserVersion, 5, 'ブラウザのバージョンは正しいか');
				strictEqual(ret.browserVersionFull, '5.1.1', 'ブラウザのフルバージョンは正しいか');
				strictEqual(ret.isiPhone, true, 'iPhoneか');
				strictEqual(ret.isiPad, false, 'iPadか');
				strictEqual(ret.isiOS, true, 'iOSか');
				strictEqual(ret.isAndroid, false, 'Androidか');
				strictEqual(ret.isWindowsPhone, false, 'WindowsPhoneか');
				strictEqual(ret.isIE, false, 'IEか');
				strictEqual(ret.isFirefox, false, 'Firefoxか');
				strictEqual(ret.isChrome, true, 'Chromeか');
				strictEqual(ret.isSafari, false, 'Safariか');
				strictEqual(ret.isOpera, false, 'Operaか');
				strictEqual(ret.isAndroidDefaultBrowser, false, 'Android標準ブラウザか');
				strictEqual(ret.isSmartPhone, true, 'スマートフォンか');
				strictEqual(ret.isTablet, false, 'タブレットか');
				strictEqual(ret.isDesktop, false, 'デスクトップか');
				strictEqual(ret.isWebkit, true, 'Webkitか');
			});
});
