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
/* ------ h5.ui ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	/**
	 * メッセージを表示する要素のクラス名
	 */
	var CLASS_INDICATOR_THROBBER = 'indicator-throbber';

	/**
	 * スロバーを表示する要素のクラス名
	 */
	var CLASS_INDICATOR_MESSAGE = 'indicator-message';

	/**
	 * スロバー本体(Canvas)に付与するクラス名
	 */
	var CLASS_THROBBER_CANVAS = 'throbber-canvas';

	/**
	 * スロバー内に進捗率(パーセント)を表示する要素のクラス名
	 */
	var CLASS_THROBBER_PERCENT = 'throbber-percent';

	/**
	 * インジケータ - ルートのクラス名
	 */
	var CLASS_INDICATOR_ROOT = 'h5-indicator';

	/**
	 * インジケータ - メッセージのクラス名
	 */
	var CLASS_INDICATOR_CONTENT = 'content';

	/**
	 * インジケータ - オーバーレイのクラス名
	 */
	var CLASS_OVERLAY = 'overlay';

	/**
	 * インジケータ - オーバーレイのクラス名
	 * <p>
	 * IE6でのみ使用する。
	 */
	var CLASS_SKIN = 'skin';

	/**
	 * 一番外側にあるVML要素のクラス名
	 */
	var CLASS_VML_ROOT = 'vml-root';

	/**
	 * VMLのスタイル定義要素(style要素)のid
	 */
	var ID_VML_STYLE = 'h5-vmlstyle';

	/**
	 * メッセージに要素に表示する文字列のフォーマット
	 */
	var FORMAT_THROBBER_MESSAGE_AREA = '<span class="' + CLASS_INDICATOR_THROBBER
			+ '"></span><span class="' + CLASS_INDICATOR_MESSAGE + '" {0}>{1}</span>';

	/**
	 * jQuery.data()で使用するキー名
	 * <p>
	 * インジケータ表示前のスタイル、positionプロパティの値を保持するために使用する
	 */
	var DATA_KEY_POSITION = 'before-position';

	/**
	 * jQuery.data()で使用するキー名
	 * <p>
	 * インジケータ表示前のスタイル、zoomプロパティの値を保持するために使用する
	 */
	var DATA_KEY_ZOOM = 'before-zoom';

	/**
	 * scrollToTop() リトライまでの待機時間
	 */
	var WAIT_MILLIS = 500;

	/**
	 * アニメーション(fadeIn,fadeOut)するときの1フレームの時間(ms)
	 * <p>
	 * jQuery.fx.intervalがデフォルトで13なので、それに倣って13を指定している
	 * </p>
	 */
	var ANIMATION_INTERVAL = 13;


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
	var h5ua = h5.env.ua;
	var isJQueryObject = h5.u.obj.isJQueryObject;
	var argsToArray = h5.u.obj.argsToArray;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	// =============================
	// Variables
	// =============================
	// h5.cssを読み込んで、Canvas版スロバーに適用するスタイルの情報を保持するマップ
	// key:クラス名  value:CSSプロパティ名
	var throbberStyleMap = {
		throbber: ['width', 'height'],
		'throbber-line': ['width', 'color']
	};

	/**
	 * Canvasをサポートしているか
	 * <p>
	 * (true:サポート/false:未サポート)
	 */
	var isCanvasSupported = !!document.createElement('canvas').getContext;

	/**
	 * VMLをサポートしているか (true:サポート/false:未サポート)
	 */
	// 機能ベースでVMLのサポート判定を行う(IE6,7,8,9:true その他のブラウザ:false)
	var isVMLSupported = (function() {
		var fragment = document.createDocumentFragment();
		var div = fragment.appendChild(document.createElement('div'));
		div.innerHTML = '<v:line strokeweight="1"/>';
		var child = div.firstChild;
		child.style.behavior = 'url(#default#VML)';
		return typeof child.strokeweight === 'number';
	})();

	/**
	 * 互換モードか判定します
	 */
	var compatMode = (document.compatMode !== 'CSS1Compat');

	/**
	 * 対象ブラウザがIE6以前のブラウザか
	 */
	var isLegacyIE = h5ua.isIE && h5ua.browserVersion <= 6;

	/**
	 * timer + transformでスロバーを回すかどうか (PC版chromeでは、timer + transformでスロバーを回すようにするため)
	 */
	var useTransformTimerAnimation = h5ua.isChrome && h5ua.isDesktop;

	/**
	 * position:fixedでインジケータを描画するかのフラグ。
	 * <p>
	 * 自動更新またはアップデート可能なブラウザは、最新のブラウザであるものとして判定しない。(常にposition:fixedは有効とする)
	 * <p>
	 * 以下の理由から、機能ベースでの判定は行わない。
	 * <ul>
	 * <li>$.support.fixedPosition()にバグがあり、モバイルブラウザの判定が正しくない。</li>
	 * <li>jQuery1.8では、$.support.fixedPosition()が無くなっている。 (fixedPositionを判定するAPIが無い)</li>
	 * <li>機能ベースでモバイル・デスクトップの両方を検知するのは困難。</li>
	 * </ul>
	 * <p>
	 * <b>position:fixedについて</b>
	 * <ul>
	 * <li>position:fixed対応表: http://caniuse.com/css-fixed</li>
	 * <li>Androidは2.2からposition:fixedをサポートしており、2.2と2.3はmetaタグに「user-scalable=no」が設定されていないと機能しない。<br>
	 * http://blog.webcreativepark.net/2011/12/07-052517.html </li>
	 * <li>Androidのデフォルトブラウザでposition:fixedを使用すると、2.xはkeyframesとtransformをposition:fixedで使用すると正しい位置に表示されないバグが、4.xは画面の向きが変更されると描画が崩れるバグがあるため使用しない。
	 * <li>Windows Phoneは7.0/7.5ともに未サポート https://github.com/jquery/jquery-mobile/issues/3489</li>
	 * <ul>
	 */
	var usePositionFixed = !(h5ua.isAndroidDefaultBrowser
			|| (h5ua.isiOS && h5ua.browserVersion < 5) || isLegacyIE || compatMode || h5ua.isWindowsPhone);

	/**
	 * CSS3 Animationsをサポートしているか
	 * <p>
	 * (true:サポート/false:未サポート)
	 */
	var isCSS3AnimationsSupported = null;

	/**
	 * ウィンドウの高さを取得するメソッド
	 */
	var windowHeight = null;

	/**
	 * ドキュメントの高さを取得するメソッド
	 */
	var documentHeight = null;

	/**
	 * ドキュメントの高さを取得するメソッド
	 */
	var documentWidth = null;

	/**
	 * Y方向のスクロール値を取得するメソッド
	 */
	var scrollTop = null;

	/**
	 * Y方向のスクロール値を取得するメソッド
	 */
	var scrollLeft = null;

	// =============================
	// Functions
	// =============================

	/**
	 * 指定されたCSS3プロパティをサポートしているか判定します。
	 * <p>
	 * プレフィックスなし、プレフィックスありでサポート判定を行います。
	 * <p>
	 * 判定に使用するプレフィックス
	 * <ul>
	 * <li>Khtml (Safari2以前)</li>
	 * <li>ms (IE)</li>
	 * <li>O (Opera)</li>
	 * <li>Moz (Firefox)</li>
	 * <li>Webkit (Safari2以降/Chrome)</li>
	 * </ul>
	 * <p>
	 * ※Chrome20にて、WebKitプレフィックスはデバッグでの表示上は小文字(webkitXxxxx)だが、先頭文字が小文字または大文字でも正しく判定される。
	 * しかし、古いバージョンでは確認できていないため『Webkit』で判定する。
	 */
	var supportsCSS3Property = (function() {
		var fragment = document.createDocumentFragment();
		var div = fragment.appendChild(document.createElement('div'));
		var prefixes = 'Webkit Moz O ms Khtml'.split(' ');
		var len = prefixes.length;

		return function(propName) {
			// CSSシンタックス(ハイフン区切りの文字列)をキャメルケースに変換
			var propCamel = $.camelCase(propName);

			// ベンダープレフィックスなしでサポートしているか判定
			if (propCamel in div.style) {
				return true;
			}

			propCamel = propCamel.charAt(0).toUpperCase() + propCamel.slice(1);

			// ベンダープレフィックスありでサポートしているか判定
			for (var i = 0; i < len; i++) {
				if (prefixes[i] + propCamel in div.style) {
					return true;
				}
			}

			return false;
		};
	})();

	/**
	 * CSSファイルに書かれた、Canvasのスタイル定義を取得します。
	 */
	function readThrobberStyle(theme) {
		var readStyles = {};

		for ( var prop in throbberStyleMap) {
			var $elem = $('<div></div>').addClass(theme).addClass(prop).appendTo('body');
			var propCamel = $.camelCase(prop);

			readStyles[propCamel] = {};

			$.map(throbberStyleMap[prop], function(item, idx) {
				if (item === 'width' || item === 'height') {
					readStyles[propCamel][item] = parseInt($elem.css(item).replace(/\D/g, ''), 10);
				} else {
					readStyles[propCamel][item] = $elem.css(item);
				}
			});

			$elem.remove();
		}

		return readStyles;
	}

	/**
	 * VML要素を生成します。
	 */
	function createVMLElement(tagName, doc, opt) {
		var elem = doc.createElement('v:' + tagName);

		for ( var prop in opt) {
			elem.style[prop] = opt[prop];
		}

		return elem;
	}

	/**
	 * 要素のサイズから、スロバーの線を引く座標を計算します。
	 */
	function calculateLineCoords(size, line) {
		var positions = [];
		var centerPos = size / 2;
		var radius = size * 0.8 / 2;
		var eachRadian = 360 / line * Math.PI / 180;

		for (var j = 1; j <= line; j++) {
			var rad = eachRadian * j;
			var cosRad = Math.cos(rad), sinRad = Math.sin(rad);
			positions.push({
				from: {
					x: centerPos + radius / 2 * cosRad,
					y: centerPos + radius / 2 * sinRad
				},
				to: {
					x: centerPos + radius * cosRad,
					y: centerPos + radius * sinRad
				}
			});
		}

		return positions;
	}

	/**
	 * 任意要素のスクロールサイズ(scrollWidth/Height：見た目でなくコンテンツ全体のサイズ)を取得します。
	 * IE6は内包する要素の方が小さい場合にscrollサイズがclientサイズより小さくなってしまうバグがあります（本来はscroll===client）。
	 * そこで、IE6の場合はscrollとclientのうち大きい方のサイズを返します。<br>
	 * また、scrollW/Hは整数を返しますが、内部的にはサイズが小数になっている場合があります。Chrome22, Firefox20,
	 * Opera12ではscrollサイズをセットしても問題ありませんが、IEの場合
	 * (内部サイズが小数のときに)scrollW/Hの大きさでオーバーレイのサイズを設定すると意図しないスクロールバーが出てしまう場合があります。
	 * このメソッドは、IEかつ内部に小数を取り得る環境と判断した場合この誤差を調整してこの問題を回避します。
	 *
	 * @private
	 * @param elem {Element} DOM要素
	 */
	function getScrollSize(elem) {
		var retW = elem.scrollWidth;
		var retH = elem.scrollHeight;

		if (isLegacyIE) {
			retW = Math.max(retW, elem.clientWidth);
			retH = Math.max(retH, elem.clientHeight);
		} else if (h5ua.isIE && typeof getComputedStyle === 'function') {
			//getComputedStyleが未定義な環境(IE)でエラーにならないように、typeofを使って判定

			//IE9以上(かつIE9モード以上)。この場合、ボックスサイズが小数になる可能性がある
			//(IE8orIE8モード以下の場合常に整数で計算されるので、scrollサイズを使えばよい)。
			//ComputedStyleで厳密なサイズを取得し、その分を調整することで
			//意図しないスクロールバーが出ないようにする。
			//-1しているのは四捨五入させるため(描画の際はピクセルにスナップされるようなので)。

			// エレメントが別ウィンドウの場合もあるので、elemの属するwindowのgetComputedStyleを使用
			var comStyle = getWindowOfDocument(getDocumentOf(elem)).getComputedStyle(elem, null);

			var eW = parseFloat(comStyle.width) + parseFloat(comStyle.paddingLeft)
					+ parseFloat(comStyle.paddingRight);
			retW += eW - parseInt(eW) - 1;

			var eH = parseFloat(comStyle.height) + parseFloat(comStyle.paddingTop)
					+ parseFloat(comStyle.paddingBottom);
			retH += eH - parseInt(eH) - 1;
		}

		return {
			w: retW,
			h: retH
		};
	}

	/**
	 * ドキュメント(コンテンツ全体)の高さまたは幅を取得します。
	 * <p>
	 * ウィンドウの高さを取得したい場合は引数に"Height"を、 ウィンドウの幅を取得したい場合は引数に"Width"を指定して下さい。
	 * <p>
	 * 以下のバグがあるため自前で計算を行う。
	 * <p>
	 * 1.6.4/1.7.1/1.8.0は正しい値を返すが1.7.1ではバグがあるため正しい値を返さない。<br>
	 * http://bugs.jquery.com/ticket/3838<br>
	 * http://pastebin.com/MaUuLjU2
	 * <p>
	 * IE6だと同一要素に対してスタイルにwidthとpaddingを指定するとサイズがおかしくなる。<br>
	 * http://hiromedo-net.sakura.ne.jp/memoblog/?p=47
	 */
	function documentSize(propName) {
		var prop = propName;

		return function() {
			var body = document.body;
			var docElem = document.documentElement;
			// 互換モードの場合はサイズ計算にbody要素を、IE6標準の場合はdocumentElementを使用する
			var elem = compatMode ? body : isLegacyIE ? docElem : null;

			if (elem) {
				if (prop === 'Height') {
					// ウィンドウサイズを大きくすると、scroll[Width/Height]よりもclient[Width/Height]の値のほうが大きくなるため、
					// client[Width/Height]のほうが大きい場合はこの値を返す
					return elem['client' + prop] > elem['scroll' + prop] ? elem['client' + prop]
							: elem['scroll' + prop];
				}
				return elem['client' + prop];
			}
			return Math.max(body['scroll' + prop], docElem['scroll' + prop], body['offset' + prop],
					docElem['offset' + prop], docElem['client' + prop]);

		};
	}

	/**
	 * スクロールバーの幅も含めた、ウィンドウ幅または高さを取得します。
	 * <p>
	 * ウィンドウの高さを取得したい場合は引数に"Height"を、 ウィンドウの幅を取得したい場合は引数に"Width"を指定して下さい。
	 * <p>
	 * jQuery1.8からQuirksモードをサポートしていないため、$(window).height()からウィンドウサイズを取得できない(0を返す)ため、自前で計算を行う。<br>
	 * http://blog.jquery.com/2012/08/30/jquery-1-8-1-released/
	 */
	function windowSize(propName) {
		var prop = propName;

		return function() {
			var body = document.body;
			var docElem = document.documentElement;
			return (typeof window['inner' + prop] === 'number') ? window['inner' + prop]
					: compatMode ? body['client' + prop] : docElem['client' + prop];
		};
	}

	/**
	 * Y方向またはX方向のスクロール量を取得します。
	 * <p>
	 * Y方向のスクロール量を取得したい場合は引数に"Top"を、 X方向のスクロール量を取得したい場合は引数に"Left"を指定して下さい。
	 */
	function scrollPosition(propName) {
		var prop = propName;

		return function() {
			// doctypeが「XHTML1.0 Transitional DTD」だと、document.documentElement.scrollTopが0を返すので、互換モードを判定する
			// http://mokumoku.mydns.jp/dok/88.html
			var elem = compatMode ? document.body : document.documentElement;
			var offsetProp = (prop === 'Top') ? 'Y' : 'X';
			return window['page' + offsetProp + 'Offset'] || elem['scroll' + prop];
		};
	}

	/**
	 * スクロールバーの幅を含めない、ウィンドウ幅または高さを取得します。
	 */
	function getDisplayArea(prop) {
		var e = compatMode ? document.body : document.documentElement;
		return h5ua.isiOS ? window['inner' + prop] : e['client' + prop];
	}

	/**
	 * 指定された要素の左上からの絶対座標を取得します。
	 * <p>
	 * 1.8.xのjQuery.offset()は、Quirksモードでのスクロール量の計算が正しく行われないため自前で計算する。
	 * </p>
	 * <p>
	 * 絶対座標は、
	 *
	 * <pre>
	 * getBoundingClinetRectの値 + スクロール量 - clientTop / Left
	 * </pre>
	 *
	 * で計算します。
	 * </p>
	 * <p>
	 * IE6の場合、BODY要素についてgetBoundingClientRect()の値が正しく計算できず、
	 * また、HTML要素のmargin,borderが表示されないので、BODY要素の場合は、htmlのpadding～bodyのborderまでを加えた値を計算して返します。
	 * </p>
	 */
	function getOffset(element) {
		var elem = $(element)[0];
		var body = document.body;
		var html = $('html')[0];
		var box = {
			top: 0,
			left: 0
		};
		if (elem === body && isLegacyIE) {
			return {
				top: parseFloat(html.currentStyle.paddingTop || 0)
						+ parseFloat(body.currentStyle.marginTop || 0)
						+ parseFloat(body.currentStyle.borderTop || 0),
				left: parseFloat(html.currentStyle.paddingLeft || 0)
						+ parseFloat(body.currentStyle.marginLeft || 0)
						+ parseFloat(body.currentStyle.borderLeft || 0)
			};
		}

		if (typeof elem.getBoundingClientRect !== "undefined") {
			box = elem.getBoundingClientRect();
		}

		var docElem = compatMode ? body : document.documentElement;
		var clientTop = docElem.clientTop || 0;
		var clientLeft = docElem.clientLeft || 0;

		return {
			top: box.top + scrollTop() - clientTop,
			left: box.left + scrollLeft() - clientLeft
		};

	}

	/**
	 * 指定された要素で発生したイベントを無効にする
	 */
	function disableEventOnIndicator(/* var_args */) {
		var disabledEventTypes = 'click dblclick touchstart touchmove touchend mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave focus focusin focusout blur change select';

		$.each(argsToArray(arguments), function(i, e) {
			e.bind(disabledEventTypes, function() {
				return false;
			});
		});
	}

	/**
	 * スクリーンロック対象の要素か判定します。
	 */
	function isScreenlockTarget(element) {
		var e = isJQueryObject(element) ? element[0] : element;
		return e === window || e === document || e === document.body;
	}

	/**
	 * VMLが機能するよう名前空間とVML要素用のスタイルを定義する(VML用)
	 */
	function defineVMLNamespaceAndStyle(doc) {
		// 既に定義済みなら何もしない
		if (doc.getElementById(ID_VML_STYLE)) {
			return;
		}

		doc.namespaces.add('v', 'urn:schemas-microsoft-com:vml');
		// メモリリークとIE9で動作しない問題があるため、document.createStyleSheet()は使用しない
		var vmlStyle = doc.createElement('style');
		doc.getElementsByTagName('head')[0].appendChild(vmlStyle);

		vmlStyle.id = ID_VML_STYLE;
		var styleDef = ['v\\:stroke', 'v\\:line', 'v\\:textbox'].join(',')
				+ ' { behavior:url(#default#VML); }';
		vmlStyle.setAttribute('type', 'text/css');
		vmlStyle.styleSheet.cssText = styleDef;
	}
	/**
	 * getComputedStyleがあるブラウザについて、getComputedStyleを呼び出した結果を返します。
	 * <p>
	 * 渡されたエレメントが属するdocumentツリーのwindowオブジェクトのgetComputedStyleを使用します
	 * </p>
	 *
	 * @private
	 * @param {DOM} elm
	 * @returns {Style} elmのcomputedStyle
	 */
	function getComputedStyleWrapper(elm) {
		var doc = getDocumentOf(elm);
		var win = getWindowOfDocument(doc);
		return win.getComputedStyle(elm, null);
	}

	/**
	 * スタイルを取得する
	 * <p>
	 * IEでjQuery1.8.X～1.10.Xを使用した時、ポップアップウィンドウ内の要素についてスタイルを取得しようとするとエラーになるため、ラップしている。
	 * </p>
	 * <p>
	 * getComputedStyleがないブラウザについては、jQuery.css()を使って取得した値を返す。
	 * </p>
	 *
	 * @private
	 * @param elm {DOM}
	 * @param prop {String} CSSプロパティ
	 * @returns 第1引数について、computedStyleを取得し、第2引数に指定されたプロパティの値を返す
	 */
	function getComputedStyleValue(elm, prop) {
		if (!window.getComputedStyle) {
			return $(elm).css(prop);
		}
		return getComputedStyleWrapper(elm)[prop];
	}

	/**
	 * 要素のheightを取得する
	 * <p>
	 * IEでjQuery1.8.X～1.10.Xを使用した時、ポップアップウィンドウ内の要素についてスタイルを取得しようとするとエラーになるため、ラップしている。
	 * </p>
	 * <p>
	 * getComputedStyleがないブラウザについては、height()で取得した値を返す。
	 * </p>
	 *
	 * @private
	 * @param {DOM} elm
	 * @returns {Number} 引数で渡された要素のheight
	 */
	function getHeight(elm) {
		if (!window.getComputedStyle) {
			return $(elm).height();
		}
		var elmStyle = getComputedStyleWrapper(elm);
		return parseInt(elmStyle.height);
	}

	/**
	 * 要素のwidthを取得する
	 * <p>
	 * IEでjQuery1.8.X～1.10.Xを使用した時、ポップアップウィンドウ内の要素についてスタイルを取得しようとするとエラーになるため、ラップしている。
	 * </p>
	 * <p>
	 * getComputedStyleがないブラウザについては、width()で取得した値を返す。
	 * </p>
	 *
	 * @private
	 * @param {DOM} elm
	 * @returns {Number} 引数で渡された要素のwidth
	 */
	function getWidth(elm) {
		if (!window.getComputedStyle) {
			return $(elm).width();
		}
		var elmStyle = getComputedStyleWrapper(elm);
		return parseInt(elmStyle.width);
	}

	/**
	 * 要素のouterHeightを取得する
	 * <p>
	 * IEでjQuery1.8.X～1.10.Xを使用した時、ポップアップウィンドウ内の要素についてスタイルを取得しようとするとエラーになるため、ラップしている。
	 * </p>
	 * <p>
	 * getComputedStyleがないブラウザについては、outerHeight()で取得した値を返す。
	 * </p>
	 *
	 * @private
	 * @param {DOM} elm
	 * @param {Boolean} [includeMargin=true] maginを含めるかどうか
	 * @returns {Number} 引数で渡された要素のouterHeight
	 */
	function getOuterHeight(elm, includeMargin) {
		if (!window.getComputedStyle) {
			return $(elm).outerWidth();
		}

		var elmStyle = getComputedStyleWrapper(elm);
		return parseInt(elmStyle.height)
				+ parseInt(elmStyle.paddingTop)
				+ parseInt(elmStyle.paddingBottom)
				+ parseInt(elmStyle.borderTopWidth)
				+ parseInt(elmStyle.borderBottomWidth)
				+ (includeMargin ? (parseInt(elmStyle.marginTop) + parseInt(elmStyle.marginBottom))
						: 0);
	}

	/**
	 * 要素のouterWidthを取得する
	 * <p>
	 * IEでjQuery1.8.X～1.10.Xを使用した時、ポップアップウィンドウ内の要素についてスタイルを取得しようとするとエラーになるため、ラップしている。
	 * </p>
	 * <p>
	 * getComputedStyleがないブラウザについては、outerWidth()で取得した値を返す。
	 * </p>
	 *
	 * @param {DOM} elm
	 * @param {Boolean} [includeMargin=true] maginを含めるかどうか
	 * @returns {Number} 引数で渡された要素のouterWidth
	 */
	function getOuterWidth(elm, includeMargin) {
		if (!window.getComputedStyle) {
			return $(elm).outerWidth();
		}
		var elmStyle = getComputedStyleWrapper(elm);
		return parseInt(elmStyle.width)
				+ parseInt(elmStyle.paddingLeft)
				+ parseInt(elmStyle.paddingRight)
				+ parseInt(elmStyle.borderLeftWidth)
				+ parseInt(elmStyle.borderRightWidth)
				+ (includeMargin ? (parseInt(elmStyle.marginLeft) + parseInt(elmStyle.marginRight))
						: 0);
	}

	/**
	 * 要素のinnerHeightを取得する
	 * <p>
	 * IEでjQuery1.8.X～1.10.Xを使用した時、ポップアップウィンドウ内の要素についてスタイルを取得しようとするとエラーになるため、ラップしている。
	 * </p>
	 * <p>
	 * getComputedStyleがないブラウザについては、innerHeight()で取得した値を返す。
	 * </p>
	 *
	 * @param {DOM} elm
	 * @returns {Number} 引数で渡された要素のinnerHeight
	 */
	function getInnerHeight(elm) {
		if (!window.getComputedStyle) {
			return $(elm).innerHeight();
		}
		var elmStyle = getComputedStyleWrapper(elm);
		return parseInt(elmStyle.height) + parseInt(elmStyle.paddingTop)
				+ parseInt(elmStyle.paddingBottom);
	}

	/**
	 * 要素のinnerWidthを取得する
	 * <p>
	 * IEでjQuery1.8.X～1.10.Xを使用した時、ポップアップウィンドウ内の要素についてスタイルを取得しようとするとエラーになるため、ラップしている。
	 * </p>
	 * <p>
	 * getComputedStyleがないブラウザについては、innerWidth()で取得した値を返す。
	 * </p>
	 *
	 * @param {DOM} elm
	 * @returns {Number} 引数で渡された要素のinnerWidth
	 */
	function getInnerWidth(elm) {
		if (!window.getComputedStyle) {
			return $(elm).innerWidth();
		}
		var elmStyle = getComputedStyleWrapper(elm);
		return parseInt(elmStyle.width) + parseInt(elmStyle.paddingLeft)
				+ parseInt(elmStyle.paddingRight);
	}

	/**
	 * fadeIn, fadeOut用のアニメーション関数
	 *
	 * @param {Array} props $elmのアニメーション終了時のスタイルの配列。propsの配列のインデックスは$elmのインデックスに対応する。
	 * @param {jQuery} $elm アニメーションさせる要素
	 * @param {Number} time アニメーションに掛ける時間
	 * @param {Function} callback アニメーション終了時に実行するコールバック関数
	 */
	function animate(props, $elm, time, callback) {
		var interval = ANIMATION_INTERVAL;
		var count = 0;
		// 現在の値(アニメーションするごとに変化)
		var curProps = [];
		// 1インターバルごとに変化する量
		var v = [];
		// 現在のスタイルを$elmの最初の要素から取得し、それを基準にアニメーションする
		$elm.each(function(i) {
			var prop = props[i];
			v[i] = {};
			curProps[i] = {};
			var curStyle = getComputedStyleWrapper($elm[i]);
			for ( var p in prop) {
				curProps[i][p] = parseFloat(curStyle[p]);
				v[i][p] = (parseFloat(prop[p]) - parseFloat(curStyle[p])) * interval / time;
			}
		});
		function fn() {
			count += interval;
			if (count > time) {
				// アニメーション終了
				clearInterval(timerId);
				// スタイルを削除して、デフォルト(cssなどで指定されている値)に戻す
				$elm.each(function(i) {
					for ( var p in props[i]) {
						this.style[p] = '';
					}
				});
				callback();
				return;
			}
			$elm.each(function(i) {
				var curProp = curProps[i];
				for ( var p in curProp) {
					curProp[p] += v[i][p];
				}
				$(this).css(curProp);
			});
		}
		fn();
		var timerId = setInterval(fn, interval);
	}

	/**
	 * opacityを0から、現在の要素のopacityの値までアニメーションします
	 *
	 * @param {jQuery} $elm fadeInさせる要素
	 * @param {Number} time アニメーションに掛ける時間(ms)
	 * @param {Function} callback アニメーションが終了した時に呼び出すコールバック関数
	 */
	function fadeIn($elm, time, callback) {
		// 現在のopacityを取得
		var opacities = [];
		$elm.each(function() {
			var opacity = parseFloat(getComputedStyleValue(this, 'opacity'));
			opacities.push({
				opacity: opacity
			});
		});
		// opacityを0にして、display:blockにする
		$elm.css({
			opacity: 0,
			display: 'block'
		});
		animate(opacities, $elm, time, callback);
	}

	/**
	 * opacityを現在の値から、0までアニメーションします
	 *
	 * @param {jQuery} $elm fadeOutさせる要素
	 * @param {Number} time アニメーションに掛ける時間(ms)
	 * @param {Function} callback アニメーションが終了した時に呼び出すコールバック関数
	 */
	function fadeOut($elm, time, callback) {
		var opacities = [];
		$elm.each(function() {
			opacities.push({
				opacity: 0
			});
		});
		animate(opacities, $elm, time, callback);
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	windowHeight = windowSize('Height');
	documentHeight = documentSize('Height');
	documentWidth = documentSize('Width');
	scrollTop = scrollPosition('Top');
	scrollLeft = scrollPosition('Left');

	// CSS3 Animationのサポート判定
	isCSS3AnimationsSupported = supportsCSS3Property('animationName');

	/**
	 * VML版スロバー (IE 6,7,8)用
	 */
	function ThrobberVML(opt, doc) {
		this.style = $.extend(true, {}, opt);

		// documentにVMLの名前空間とスタイルが定義されていなかったら、定義する
		defineVMLNamespaceAndStyle(doc);

		var w = this.style.throbber.width;
		var h = this.style.throbber.height;

		this.group = createVMLElement('group', doc, {
			width: w + 'px',
			height: h + 'px'
		});
		this.group.className = CLASS_VML_ROOT;

		var positions = calculateLineCoords(w, this.style.throbber.lines);
		var lineColor = this.style.throbberLine.color;
		var lineWidth = this.style.throbberLine.width;

		for (var i = 0, len = positions.length; i < len; i++) {
			var pos = positions[i];
			var from = pos.from;
			var to = pos.to;
			var e = createVMLElement('line', doc);
			e.strokeweight = lineWidth;
			e.strokecolor = lineColor;
			e.fillcolor = lineColor;
			e.from = from.x + ',' + from.y;
			e.to = to.x + ',' + to.y;
			var ce = createVMLElement('stroke', doc);
			ce.opacity = 1;
			e.appendChild(ce);
			this.group.appendChild(e);
		}

		this._createPercentArea(doc);
	}

	ThrobberVML.prototype = {
		show: function(root) {
			if (!root) {
				return;
			}

			this.root = root;
			this.highlightPos = 1;
			this.hide();
			this.root.appendChild(this.group);
			this._run();
		},
		hide: function() {
			this.root.innerHTML = "";

			if (this._runId) {
				clearTimeout(this._runId);
				this._runId = null;
			}
		},
		_run: function() {
			var lineCount = this.style.throbber.lines;
			var roundTime = this.style.throbber.roundTime;
			var highlightPos = this.highlightPos;
			var lines = this.group.childNodes;

			for (var i = 0, len = lines.length; i < len; i++) {
				var child = lines[i];

				if (child.nodeName === 'textbox') {
					continue;
				}

				var lineNum = i + 1;
				var line = child.firstChild;
				if (lineNum == highlightPos) {
					line.opacity = "1";
				} else if (lineNum == highlightPos + 1 || lineNum == highlightPos - 1) {
					line.opacity = "0.75";
				} else {
					line.opacity = "0.4";
				}
			}

			if (highlightPos == lineCount) {
				highlightPos = 0;
			} else {
				highlightPos++;
			}

			this.highlightPos = highlightPos;
			var perMills = Math.floor(roundTime / lineCount);

			var that = this;

			// VML版スロバーはIE8以下専用でかつ、IE8以下はAnimations/Transformに対応していないのでsetTimeoutでスロバーを描写する
			this._runId = setTimeout(function() {
				that._run.call(that);
			}, perMills);
		},
		_createPercentArea: function(doc) {
			var textPath = createVMLElement('textbox', doc);
			var $table = $(doc.createElement('table'));
			$table.append('<tr><td></td></tr>');
			var $td = $table.find('td');
			$td.width(this.group.style.width);
			$td.height(this.group.style.height);
			$td.css('line-height', this.group.style.height);
			$td.addClass(CLASS_THROBBER_PERCENT);

			textPath.appendChild($table[0]);
			this.group.appendChild(textPath);
		},
		setPercent: function(percent) {
			$(this.group).find('.' + CLASS_THROBBER_PERCENT).html(percent);
		}
	};

	/**
	 * Canvas版スロバー
	 */
	var ThrobberCanvas = function(opt, doc) {
		this.style = $.extend(true, {}, opt);
		this.canvas = doc.createElement('canvas');
		this.baseDiv = doc.createElement('div');
		this.percentDiv = doc.createElement('div');

		var canvas = this.canvas;
		var baseDiv = this.baseDiv;
		var percentDiv = this.percentDiv;
		// CSSファイルから読み取ったスタイルをCanvasに適用する
		canvas.width = this.style.throbber.width;
		canvas.height = this.style.throbber.height;
		canvas.style.display = 'block';
		canvas.style.position = 'absolute';
		baseDiv.style.width = this.style.throbber.width + 'px';
		baseDiv.style.height = this.style.throbber.height + 'px';
		baseDiv.appendChild(canvas);
		// パーセント表示用DIV
		percentDiv.style.width = this.style.throbber.width + 'px';
		percentDiv.style.height = this.style.throbber.height + 'px';
		percentDiv.style.lineHeight = this.style.throbber.height + 'px';
		percentDiv.className = CLASS_THROBBER_PERCENT;
		baseDiv.appendChild(percentDiv);

		this.positions = calculateLineCoords(canvas.width, this.style.throbber.lines);
	};

	ThrobberCanvas.prototype = {
		show: function(root) {
			if (!root) {
				return;
			}

			this.root = root;
			this.highlightPos = 1;
			this.hide();
			this.root.appendChild(this.baseDiv);
			this._run();
		},
		hide: function() {
			// this.root.innerHTML = ''だと、IEにてthis.child.innerHTMLまで空になってしまう
			// removeChildを使うとDOMがない時にエラーが出るため、jQueryのremove()を使っている
			$(this.baseDiv).remove();

			if (this._runId) {
				// Timerを止める
				// chromeの場合はsetIntervalでタイマーを回しているため、clearIntervalで止める
				if (useTransformTimerAnimation) {
					clearInterval(this._runId);
				} else {
					clearTimeout(this._runId);
				}
				this._runId = null;
			}
		},
		_run: function() {
			var canvas = this.canvas;
			var ctx = canvas.getContext('2d');
			var highlightPos = this.highlightPos;
			var positions = this.positions;
			var lineColor = this.style.throbberLine.color;
			var lineWidth = this.style.throbberLine.width;
			var lineCount = this.style.throbber.lines;
			var roundTime = this.style.throbber.roundTime;

			canvas.width = canvas.width;

			for (var i = 0, len = positions.length; i < len; i++) {
				ctx.beginPath();
				ctx.strokeStyle = lineColor;
				ctx.lineWidth = lineWidth;
				var lineNum = i + 1;
				if (lineNum == highlightPos) {
					ctx.globalAlpha = 1;
				} else if (lineNum == highlightPos + 1 || lineNum == highlightPos - 1) {
					ctx.globalAlpha = 0.75;
				} else {
					ctx.globalAlpha = 0.4;
				}
				var pos = positions[i];
				var from = pos.from;
				var to = pos.to;
				ctx.moveTo(from.x, from.y);
				ctx.lineTo(to.x, to.y);
				ctx.stroke();
			}
			if (highlightPos == lineCount) {
				highlightPos = 0;
			} else {
				highlightPos++;
			}
			this.highlightPos = highlightPos;


			if (useTransformTimerAnimation) {
				// chrome22で、webkit-animationでアニメーションしている要素を消すと、表示上残ってしまう。(すべてのPCで起きるわけではない)
				// そのため、chromeの場合はwebkit-animationを使わず、Timer + transform でスロバーを回している
				//
				// このwebkit-animationの問題について調べたところ、
				// chrome23βでも同様の問題が起きたが、
				// chrome24devとchrome25canaryではきちんと消えることを確認した。(2012/11/06現在)
				var deg = 0;
				this._runId = setInterval(function() {
					deg++;
					canvas.style.webkitTransform = 'rotate(' + deg + 'deg)';
					if (deg >= 360) {
						deg -= 360;
					}
				}, roundTime / 360);
				return;
			}

			if (isCSS3AnimationsSupported) {
				// CSS3Animationをサポートしている場合は、keyframesでスロバーを描写する
				canvas.className = CLASS_THROBBER_CANVAS;
			} else {
				var perMills = Math.floor(roundTime / lineCount);
				var that = this;

				// CSSAnimation未サポートの場合タイマーアニメーションで描画する
				// 対象ブラウザ: Firefox 2,3 / Opera  9.0～10.1 / Opera Mini 5.0～7.0 / Opera Mobile 10.0
				// http://caniuse.com/transforms2d
				// http://caniuse.com/#search=canvas
				// ただし、Android 2.xは、-webkit-keyframesで-webkit-transformを使用すると、topとleftを変更してもその位置に描画されないバグがあるため、
				// タイマーアニメーションでスロバーを描写する
				this._runId = setTimeout(function() {
					that._run.call(that);
				}, perMills);
			}
		},
		setPercent: function(percent) {
			this.percentDiv.innerHTML = percent;
		}
	};

	/**
	 * インジケータ(メッセージ・画面ブロック・進捗表示)の表示や非表示を行うクラス。
	 *
	 * @class
	 * @name Indicator
	 * @param {String|Object} target インジケータを表示する対象のDOM要素、jQueryオブジェクトまたはセレクタ
	 * @param {Object} [option] オプション
	 * @param {String} [option.message] スロバーの右側に表示する文字列 (デフォルト:未指定)
	 * @param {Number} [option.percent] スロバーの中央に表示する数値。0～100で指定する (デフォルト:未指定)
	 * @param {Boolean} [option.block] 画面を操作できないようオーバーレイ表示するか (true:する/false:しない) (デフォルト:true)
	 * @param {Number} [option.fadeIn] インジケータをフェードで表示する場合、表示までの時間をミリ秒(ms)で指定する (デフォルト:フェードしない)
	 * @param {Number} [option.fadeOut] インジケータをフェードで非表示にする場合、非表示までの時間をミリ秒(ms)で指定する (デフォルト:しない)
	 * @param {Promise|Promise[]} [option.promises] Promiseオブジェクト (Promiseの状態に合わせて自動でインジケータの非表示を行う)
	 * @param {String} [option.theme] テーマクラス名 (インジケータのにスタイル定義の基点となるクラス名 (デフォルト:'a')
	 * @param {String} [option.throbber.lines] スロバーの線の本数 (デフォルト:12)
	 * @param {String} [option.throbber.roundTime] スロバーの白線が1周するまでの時間(ms)
	 *            (このオプションはCSS3Animationを未サポートブラウザのみ有効) (デフォルト:1000)
	 */
	function Indicator(target, option) {
		var that = this;
		var $t = $(target);
		// ターゲットが存在しない場合は何もしない
		if (!$t.length) {
			return;
		}
		// スクリーンロックで表示するか判定
		// (自分のwindowのみで、ポップアップウィンドウの場合はスクリーンロックと判定しない)
		var isScreenlock = isScreenlockTarget($t);
		// スクリーンロックで表示する場合はターゲットはbodyにする
		$t = isScreenlock ? $('body') : $t;
		// documentの取得
		var doc = getDocumentOf($t[0]);

		// 別ウィンドウのwindow又はdocumentが指定されていた場合は、そのwindow,documentのbodyに出す
		if (doc !== window.document && ($t[0] === doc || getWindowOfDocument(doc) === $t[0])) {
			$t = $(doc.body);
		}

		// デフォルトオプション
		var defaultOption = {
			message: '',
			percent: -1,
			block: true,
			fadeIn: -1,
			fadeOut: -1,
			promises: null,
			theme: 'a'
		};
		// スロバーのスタイル定義 (基本的にはCSSで記述する。ただし固定値はここで設定する)
		// CSSAnimationsがサポートされているブラウザの場合、CSSのanimation-durationを使用するためroundTimeプロパティの値は使用しない
		var defaultStyle = {
			throbber: {
				roundTime: 1000,
				lines: 12
			},
			throbberLine: {},
			percent: {}
		};
		// デフォルトオプションとユーザオプションをマージしたオプション情報
		var settings = $.extend(true, {}, defaultOption, option);

		// インジケータを画面に表示したか
		this._displayed = false;
		// スロバーを保持する配列
		this._throbbers = [];
		// オプション情報
		this._settings = settings;
		// スタイル情報
		this._styles = $.extend(true, {}, defaultStyle, readThrobberStyle(settings.theme));
		// スクリーンロックで表示するか
		this._isScreenLock = isScreenlock;
		// 表示対象であるDOM要素を保持するjQueryオブジェクト
		this._$target = $t;
		// 表示対象のDOM要素 (旧バージョン互換用)
		this._target = this._$target.length === 1 ? this._$target[0] : this._$target.toArray();
		// scroll/touchmoveイベントハンドラで使用するタイマーID
		this._scrollEventTimerId = null;
		// scroll/touchmoveイベントハンドラ
		this._scrollHandler = function() {
			that._handleScrollEvent();
		};
		// resize/orientationchangeイベントハンドラ内で使用するタイマーID
		this._resizeEventTimerId = null;
		// scroll/touchmoveイベントハンドラ
		this._resizeHandler = function() {
			that._handleResizeEvent();
		};
		// DOM要素の書き換え可能かを判定するフラグ
		this._redrawable = true;
		// _redrawable=false時、percent()に渡された最新の値
		this._lastPercent = -1;
		// _redrawable=false時、message()に渡された最新の値
		this._lastMessage = null;
		// フェードインの時間 (フェードインで表示しない場合は-1)
		this._fadeInTime = typeof settings.fadeIn === 'number' ? settings.fadeIn : -1;
		// フェードアウトの時間 (フェードアウトで表示しない場合は-1)
		this._fadeOutTime = typeof settings.fadeOut === 'number' ? settings.fadeOut : -1;
		// コンテンツ(メッセージ/スロバー)
		this._$content = $();
		// オーバーレイ
		this._$overlay = $();
		// スキン - IE6の場合selectタグがz-indexを無視するため、オーバーレイと同一階層にiframe要素を生成してselectタグを操作出来ないようにする
		// http://www.programming-magic.com/20071107222415/
		this._$skin = $();

		// コンテンツ内の要素
		var contentElem = h5.u.str.format(FORMAT_THROBBER_MESSAGE_AREA,
				(settings.message === '') ? 'style="display: none;"' : '', settings.message);
		// httpsでiframeを開くと警告が出るためsrcに指定する値を変える
		// http://www.ninxit.com/blog/2008/04/07/ie6-https-iframe/
		var srcVal = 'https' === document.location.protocol ? 'return:false' : 'about:blank';

		for (var i = 0, len = this._$target.length; i < len; i++) {
			this._$content = this._$content.add($(doc.createElement('div')).append(contentElem)
					.addClass(CLASS_INDICATOR_ROOT).addClass(settings.theme).addClass(
							CLASS_INDICATOR_CONTENT).css('display', 'none'));
			this._$overlay = this._$overlay
					.add((settings.block ? $(doc.createElement('div')) : $()).addClass(
							CLASS_INDICATOR_ROOT).addClass(settings.theme).addClass(CLASS_OVERLAY)
							.css('display', 'none'));
			this._$skin = this._$skin.add(((isLegacyIE || compatMode) ? $(doc
					.createElement('iframe')) : $()).attr('src', srcVal).addClass(
					CLASS_INDICATOR_ROOT).addClass(CLASS_SKIN).css('display', 'none'));
		}

		var position = this._isScreenLock && usePositionFixed ? 'fixed' : 'absolute';
		// オーバーレイ・コンテンツにpositionを設定する
		$.each([this._$overlay, this._$content], function() {
			this.css('position', position);
		});

		var promises = settings.promises;
		var promiseCallback = function() {
			that.hide();
		};

		// jQuery1.7以下ならpipe、1.8以降ならthenを使ってコールバックを登録
		var pipeMethod = $.hasOwnProperty('curCSS') ? 'pipe' : 'then';
		if ($.isArray(promises)) {
			// プロミスでないものを除去
			promises = $.map(promises, function(item, idx) {
				return item && $.isFunction(item.promise) ? item : null;
			});

			if (promises.length > 0) {
				// whenを呼んで、pipeにコールバックを登録。
				// CFHの発火を阻害しないようにSilentlyでpipeコールバックを登録する。
				registerCallbacksSilently(h5.async.when(promises), pipeMethod, [promiseCallback,
						promiseCallback]);
			}
		} else if (promises && $.isFunction(promises.promise)) {
			// CFHの発火を阻害しないようにpipeを呼び出し。
			registerCallbacksSilently(promises, pipeMethod, [promiseCallback, promiseCallback]);
		}
	}

	Indicator.prototype = {
		/**
		 * 画面上にインジケータ(メッセージ・画面ブロック・進捗表示)を表示します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @returns {Indicator} インジケータオブジェクト
		 */
		show: function() {
			if (this._displayed || !this._$target
					|| this._$target.children('.' + CLASS_INDICATOR_ROOT).length > 0) {
				return this;
			}

			this._displayed = true;

			var that = this;
			var fadeInTime = this._fadeInTime;
			var cb = function() {
				var $window = $(window);

				if (that._isScreenLock) {
					disableEventOnIndicator(that._$overlay, that._$content);

					if (!usePositionFixed) {
						$window.bind('touchmove', that._scrollHandler);
						$window.bind('scroll', that._scrollHandler);
					}
				}

				// 画面の向きの変更を検知したらインジータを中央に表示させる
				$window.bind('orientationchange', that._resizeHandler);
				$window.bind('resize', that._resizeHandler);
			};

			for (var i = 0, len = this._$target.length; i < len; i++) {
				var _$target = this._$target.eq(i);
				var _$content = this._$content.eq(i);
				var _$skin = this._$skin.eq(i);
				var _$overlay = this._$overlay.eq(i);

				// position:absoluteの子要素を親要素からの相対位置で表示するため、親要素がposition:staticの場合はrelativeに変更する(親要素がbody(スクリーンロック)の場合は変更しない)
				// また、IEのレイアウトバグを回避するためzoom:1を設定する
				var targetPosition = getComputedStyleValue(_$target[i], 'position');
				if (!this._isScreenLock && targetPosition === 'static') {
					// スロバーメッセージ要素に親要素のposition/zoomを記憶させておく
					_$target.data(DATA_KEY_POSITION, targetPosition);
					_$target.data(DATA_KEY_ZOOM, getComputedStyleValue(_$target[i], 'zoom'));

					_$target.css({
						position: 'relative',
						zoom: '1'
					});
				}
				var doc = getDocumentOf(_$target[0]);
				var throbber = isCanvasSupported ? new ThrobberCanvas(this._styles, doc)
						: isVMLSupported ? new ThrobberVML(this._styles, doc) : null;

				if (throbber) {
					that._throbbers.push(throbber);
					that.percent(this._settings.percent);
					throbber.show(_$content.children('.' + CLASS_INDICATOR_THROBBER)[0]);
				}

				_$target.append(_$skin).append(_$overlay).append(_$content);
			}

			// Array.prototype.pushを使って、適用する要素を配列にまとめる
			var elems = this._$skin.toArray();
			Array.prototype.push.apply(elems, this._$content.toArray());
			Array.prototype.push.apply(elems, this._$overlay.toArray());
			var $elems = $(elems);

			if (fadeInTime < 0) {
				$elems.css('display', 'block');
				cb();
			} else {
				fadeIn($elems, fadeInTime, cb);
			}

			this._reposition();
			this._resizeOverlay();
			return this;
		},
		/**
		 * オーバーレイのサイズを再計算します。
		 * <p>
		 * position:fixedで表示している場合は再計算しません。
		 * <p>
		 * position:absoluteの場合は高さのみ再計算を行い、IE6以下の標準モード及びQuirksモードの場合は高さと幅の両方を再計算します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @private
		 */
		_resizeOverlay: function() {
			if (this._isScreenLock && usePositionFixed) {
				return;
			}

			for (var i = 0, len = this._$target.length; i < len; i++) {
				var _$target = this._$target.eq(i);
				var _$overlay = this._$overlay.eq(i);
				var _$skin = this._$skin.eq(i);

				var w, h;

				//オーバーレイはターゲット要素全体の大きさ(スクロールサイズ)にする
				if (this._isScreenLock) {
					w = documentWidth();
					h = documentHeight();
				} else {
					var scrSize = getScrollSize(_$target[0]);
					w = scrSize.w;
					h = scrSize.h;
				}
				_$overlay[i].style.width = w + 'px';
				_$overlay[i].style.height = h + 'px';

				if (isLegacyIE || compatMode) {
					_$skin[i].style.width = w + 'px';
					_$skin[i].style.height = h + 'px';
				}
			}
		},
		/**
		 * インジケータのメッセージ要素のwidthを調整し、中央になるようtopとleftの位置を設定します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @private
		 */
		_reposition: function() {
			for (var i = 0, len = this._$target.length; i < len; i++) {
				var _$target = this._$target.eq(i);
				var _$content = this._$content.eq(i);

				if (this._isScreenLock) {
					// MobileSafari(iOS4)だと $(window).height()≠window.innerHeightなので、window.innerHeightをから高さを取得する
					// また、quirksモードでjQuery1.8.xの$(window).height()を実行すると0を返すので、clientHeightから高さを取得する
					var wh = windowHeight();

					if (usePositionFixed) {
						// 可視領域からtopを計算する
						_$content.css('top', ((wh - getOuterHeight(_$content[0])) / 2) + 'px');
					} else {
						// 可視領域+スクロール領域からtopを計算する
						_$content.css('top',
								((scrollTop() + (wh / 2)) - (getOuterHeight(_$content[0]) / 2))
										+ 'px');
					}
				} else {
					//オーバーレイの計算はスクロールサイズを基準にしている。これに倣い、中央揃え計算の基準はinnerHeight()にする(＝paddingを含める)。leftも同様
					_$content.css('top', _$target.scrollTop()
							+ (getInnerHeight(_$target[0]) - getOuterHeight(_$content[0]) / 2));
				}

				var blockElementPadding = getInnerWidth(_$content[0]) - getWidth(_$content[0]);

				var totalWidth = 0;

				_$content.children().each(function() {
					var $e = $(this);
					// IE9にて不可視要素に対してouterWidth(true)を実行すると不正な値が返ってくるため、display:noneの場合は値を取得しない
					if (getComputedStyleValue($e[0], 'display') === 'none') {
						return true;
					}
					totalWidth += getOuterWidth(this, true);
				});
				_$content.width(totalWidth + blockElementPadding);
				_$content.css('left', _$target.scrollLeft()
						+ (getInnerWidth(_$target[0]) - getOuterWidth(_$content[0])) / 2);
			}
		},
		/**
		 * 画面上に表示されているインジケータ(メッセージ・画面ブロック・進捗表示)を除去します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @returns {Indicator} インジケータオブジェクト
		 */
		hide: function() {
			if (!this._displayed) {
				return this;
			}

			this._displayed = false;

			var that = this;
			var fadeOutTime = this._fadeOutTime;
			// Array.prototype.pushを使って、適用する要素を配列にまとめる
			var elems = this._$skin.toArray();
			Array.prototype.push.apply(elems, this._$content.toArray());
			Array.prototype.push.apply(elems, this._$overlay.toArray());
			var $elems = $(elems);
			var cb = function() {
				var $window = $(window);

				$elems.remove();
				// 親要素のposition/zoomをインジケータ表示前の状態に戻す
				if (!that._isScreenLock) {
					that._$target.each(function(i, e) {
						var $e = $(e);

						$e.css({
							position: $e.data(DATA_KEY_POSITION),
							zoom: $e.data(DATA_KEY_ZOOM)
						});

						$e.removeData(DATA_KEY_POSITION).removeData(DATA_KEY_ZOOM);
					});
				}

				$window.unbind('touchmove', that._scrollHandler);
				$window.unbind('scroll', that._scrollHandler);
				$window.unbind('orientationchange', that._resizeHandler);
				$window.unbind('resize', that._resizeHandler);

				if (that._resizeEventTimerId) {
					clearTimeout(that._resizeEventTimerId);
				}
				if (that._scrollEventTimerId) {
					clearTimeout(that._scrollEventTimerId);
				}
			};

			if (!isCSS3AnimationsSupported || useTransformTimerAnimation) {
				// CSS3Animationをサポートしないブラウザまたはchromeの場合、タイマーでスロバーのアニメーションを動かしているため、スロバーのhide()でタイマーを停止させる。
				for (var i = 0, len = this._throbbers.length; i < len; i++) {
					this._throbbers[i].hide();
				}
			}

			if (fadeOutTime < 0) {
				$elems.css('display', 'none');
				cb();
			} else {
				fadeOut($elems, fadeOutTime, cb);
			}

			return this;
		},
		/**
		 * 進捗のパーセント値を指定された値に更新します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @param {Number} percent 進捗率(0～100%)
		 * @returns {Indicator} インジケータオブジェクト
		 */
		percent: function(percent) {
			if (typeof percent !== 'number' || !(percent >= 0 && percent <= 100)) {
				return this;
			}

			if (!this._redrawable) {
				this._lastPercent = percent;
				return this;
			}

			for (var i = 0, len = this._throbbers.length; i < len; i++) {
				this._throbbers[i].setPercent(percent);
			}

			return this;
		},
		/**
		 * メッセージを指定された値に更新します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @param {String} message メッセージ
		 * @returns {Indicator} インジケータオブジェクト
		 */
		message: function(message) {
			if (!isString(message)) {
				return this;
			}

			if (!this._redrawable) {
				this._lastMessage = message;
				return this;
			}

			this._$content.children('.' + CLASS_INDICATOR_MESSAGE).css('display', 'inline-block')
					.text(message);
			this._reposition();

			return this;
		},
		/**
		 * scroll/touchmoveイベントハンドラ
		 * <p>
		 * タッチまたはホイールスクロールの停止を検知します
		 */
		_handleScrollEvent: function() {
			if (this._scrollEventTimerId) {
				clearTimeout(this._scrollEventTimerId);
			}

			if (!this._redrawable) {
				return;
			}

			var that = this;
			this._scrollEventTimerId = setTimeout(function() {
				that._reposition();
				that._scrollEventTimerId = null;
			}, 50);
		},
		/**
		 * orientationChange/resizeイベントハンドラ
		 * <p>
		 * orientationChange/resizeイベントが発生した1秒後に、インジケータとオーバーレイを画面サイズに合わせて再描画し、 メッセージとパーセントの内容を更新する。
		 *
		 * @memberOf Indicator
		 * @function
		 * @private
		 */
		_handleResizeEvent: function() {
			var that = this;

			function updateMessageArea() {
				that._resizeOverlay();
				that._reposition();
				that._redrawable = true;
				that.percent(that._lastPercent);
				that.message(that._lastMessage);
				that._resizeEventTimerId = null;
			}

			if (this._resizeEventTimerId) {
				clearTimeout(this._resizeEventTimerId);
			}

			this._redrawable = false;

			if (usePositionFixed || isLegacyIE || compatMode) {
				updateMessageArea();
			} else {
				// Android 4.xの場合、orientationChangeイベント発生直後にDOM要素の書き換えを行うと画面の再描画が起こらなくなることがあるため、対症療法的に対処
				this._resizeEventTimerId = setTimeout(function() {
					updateMessageArea();
				}, 1000);
			}
		}
	};

	/**
	 * 指定された要素に対して、インジケータ(メッセージ・画面ブロック・進捗)の表示や非表示を行うためのオブジェクトを取得します。
	 * <p>
	 * targetに<b>document</b>、<b>window</b>または<b>body</b>を指定しかつ、blockオプションがtrueの場合、「スクリーンロック」として動作します。<br>
	 * 上記以外のDOM要素を指定した場合は、指定した要素上にインジケータを表示します。
	 * <p>
	 * <b>スクリーンロック</b>とは、コンテンツ領域(スクロールしないと見えない領域も全て含めた領域)全体にオーバーレイを、表示領域(画面に見えている領域)中央にメッセージが表示し、画面を操作できないようにすることです。スマートフォン等タッチ操作に対応する端末の場合、スクロール操作も禁止します。
	 * <h4>スクリーンロック中の制限事項</h4>
	 * <ul>
	 * <li>Android
	 * 4.xにてorientationchangeイベント発生直後にインジケータのDOM要素の書き換えを行うと画面の再描画が起こらなくなってしまうため、orientationchangeイベント発生から1秒間percent()/massage()での画面の書き換えをブロックします。<br>
	 * orientationchagenイベント発生から1秒以内にpercent()/message()で値を設定した場合、最後に設定された値が画面に反映されます。</li>
	 * <li>WindowsPhone
	 * 7ではscrollイベントを抑止できないため、インジケータ背後の要素がスクロールしてしまいます。ただし、クリック等その他のイベントはキャンセルされます。</li>
	 * </ul>
	 * <h4>使用例</h4>
	 * <b>スクリーンロックとして表示する</b><br>
	 *
	 * <pre>
	 * var indicator = h5.ui.indicator(document).show();
	 * </pre>
	 *
	 * <b>li要素にスロバー(くるくる回るアイコン)を表示してブロックを表示しない場合</b><br>
	 *
	 * <pre>
	 * var indicator = h5.ui.indicator('li', {
	 * 	block: false
	 * }).show();
	 * </pre>
	 *
	 * <b>パラメータにPromiseオブジェクトを指定して、done()/fail()の実行と同時にインジケータを除去する</b><br>
	 * resolve() または resolve() が実行されると、画面からインジケータを除去します。
	 *
	 * <pre>
	 * var df = $.Deferred();
	 * var indicator = h5.ui.indicator(document, {
	 * 	promises: df.promise()
	 * }).show();
	 *
	 * setTimeout(function() {
	 * 	df.resolve() // ここでイジケータが除去される
	 * }, 2000);
	 * </pre>
	 *
	 * <b>パラメータに複数のPromiseオブジェクトを指定して、done()/fail()の実行と同時にインジケータを除去する</b><br>
	 * Promiseオブジェクトを複数指定すると、全てのPromiseオブジェクトでresolve()が実行されるか、またはいずれかのPromiseオブジェクトでfail()が実行されるタイミングでインジケータを画面から除去します。
	 *
	 * <pre>
	 * var df = $.Deferred();
	 * var df2 = $.Deferred();
	 * var indicator = h5.ui.indicator(document, {
	 * 	promises: [df.promise(), df2.promise()]
	 * }).show();
	 *
	 * setTimeout(function() {
	 * 	df.resolve()
	 * }, 2000);
	 *
	 * setTimeout(function() {
	 * 	df.resolve() // ここでイジケータが除去される
	 * }, 4000);
	 * </pre>
	 *
	 * <p>
	 * コントローラのindicator()の仕様については、<a href="./Controller.html#indicator">Controller.indicator</a>のドキュメント
	 * を参照下さい。
	 *
	 * @memberOf h5.ui
	 * @name indicator
	 * @function
	 * @param {String|Object} target インジケータを表示する対象のDOM要素、jQueryオブジェクトまたはセレクタ
	 * @param {Object} [option] オプション
	 * @param {String} [option.message] スロバーの右側に表示する文字列 (デフォルト:未指定)
	 * @param {Number} [option.percent] スロバーの中央に表示する数値。0～100で指定する (デフォルト:未指定)
	 * @param {Boolean} [option.block] 画面を操作できないようオーバーレイ表示するか (true:する/false:しない) (デフォルト:true)
	 * @param {Number} [option.fadeIn] インジケータをフェードで表示する場合、表示までの時間をミリ秒(ms)で指定する (デフォルト:フェードしない)
	 * @param {Number} [option.fadeOut] インジケータをフェードで非表示にする場合、非表示までの時間をミリ秒(ms)で指定する (デフォルト:しない)
	 * @param {Promise|Promise[]} [option.promises] Promiseオブジェクト (Promiseの状態に合わせて自動でインジケータの非表示を行う)
	 * @param {String} [option.theme] テーマクラス名 (インジケータのにスタイル定義の基点となるクラス名 (デフォルト:'a')
	 * @param {String} [option.throbber.lines] スロバーの線の本数 (デフォルト:12)
	 * @param {String} [option.throbber.roundTime] スロバーの白線が1周するまでの時間(ms)
	 *            (このオプションはCSS3Animationを未サポートブラウザのみ有効) (デフォルト:1000)
	 * @see Indicator
	 * @see Controller.indicator
	 */
	var indicator = function(target, option) {
		return new Indicator(target, option);
	};

	/**
	 * 要素が可視範囲内、または指定した親要素内にあるかどうかを返します。
	 * <p>
	 * 第2引数を省略した場合、要素がウィンドウ内に見えているかどうかを返します。 elementが他のDOM要素によって隠れていても、範囲内にあればtrueを返します。
	 * </p>
	 * <p>
	 * 第2引数を指定した場合、elementがcontainerの表示範囲内で見えているかどうかを返します。 containerがウィンドウ内に見えているかどうかは関係ありません。
	 * elementがcontainerの子孫要素で無ければundefinedを返します。
	 * </p>
	 * <p>
	 * ブラウザで拡大/縮小を行っていた場合、僅かな誤差のために結果が異なる場合があります。
	 * </p>
	 * <p>
	 * いずれの場合も、要素が非表示の場合の動作は保障されません。
	 * </p>
	 *
	 * @param {String|Element|jQuery} element 要素
	 * @param {Object} container コンテナ
	 * @returns {Boolean} 要素が可視範囲内にあるかどうか
	 * @name isInView
	 * @function
	 * @memberOf h5.ui
	 */
	var isInView = function(element, container) {
		var viewTop, viewBottom, viewLeft, viewRight;
		var $element = $(element);
		var height, width;

		// containerの位置を取得。borderの内側の位置で判定する。
		if (container === undefined) {
			// containerが指定されていないときは、画面表示範囲内にあるかどうか判定する
			height = getDisplayArea('Height');
			width = getDisplayArea('Width');
			viewTop = scrollTop();
			viewLeft = scrollLeft();
		} else {
			var $container = $(container);
			if ($container.find($element).length === 0) {
				// elementとcontaienrが親子関係でなければundefinedを返す
				return undefined;
			}
			var containerOffset = getOffset($container);
			viewTop = containerOffset.top + parseInt($container.css('border-top-width'));
			viewLeft = containerOffset.left + parseInt($container.css('border-left-width'));
			height = $container.innerHeight();
			width = $container.innerWidth();
		}
		viewBottom = viewTop + height;
		viewRight = viewLeft + width;

		// elementの位置を取得。borderの外側の位置で判定する。
		var elementOffset = getOffset($element);
		var positionTop = elementOffset.top;
		var positionLeft = elementOffset.left;
		var positionBottom = positionTop + $element.outerHeight();
		var positionRight = positionLeft + $element.outerWidth();

		return ((viewTop <= positionTop && positionTop < viewBottom) || (viewTop < positionBottom && positionBottom <= viewBottom))
				&& ((viewLeft <= positionLeft && positionLeft < viewRight) || (viewLeft < positionRight && positionRight <= viewRight));
	};

	/**
	 * ブラウザのトップにスクロールします。
	 *
	 * @name scrollToTop
	 * @function
	 * @memberOf h5.ui
	 */
	var scrollToTop = function() {
		var waitCount = 3;

		function fnScroll() {
			if (window.scrollY === 1) {
				waitCount = 0;
			}
			if (waitCount > 0) {
				window.scrollTo(0, 1);
				waitCount--;
				setTimeout(fnScroll, WAIT_MILLIS);
			}
		}

		window.scrollTo(0, 1);
		if ($(window).scrollTop() !== 1) {
			setTimeout(fnScroll, WAIT_MILLIS);
		}
	};

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5.ui', {
		indicator: indicator,
		isInView: isInView,
		scrollToTop: scrollToTop
	});
})();
