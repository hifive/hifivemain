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

	var TYPE_OF_UNDEFINED = 'undefined';
	var NODE_TYPE_DOCUMENT = 9;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	//=============================
	// Variables
	//=============================
	// testutils
	var createIFrameElement = testutils.dom.createIFrameElement;
	var openPopupWindow = testutils.dom.openPopupWindow;
	var closePopupWindow = testutils.dom.closePopupWindow;

	// TODO テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.ui;

	var fixture = '#qunit-fixture';
	var test1 = '#isInViewTest1';
	var test2 = '#isInViewTest2';
	var test3 = '#isInViewTest3';

	var isQuirksMode = (document.compatMode === "CSS1Compat");

	//=============================
	// Functions
	//=============================

	// gate関数をキャッシュ
	var gate = testutils.async.gate;

	function getWindowWidth() {
		var elem = isQuirksMode ? document.documentElement : document.body;
		// window.innerHeightではスクロールバーの幅も入ってしまうため、clientWidthを使う
		return elem.clientWidth;
	}

	function getWindowHeight() {
		// iPhoneの場合、clientHeightだと下のツールバーまで含まれてしまうので、innerHeightを使う
		if (h5.env.ua.isiPhone) {
			return window.innerHeight;
		}
		var elem = isQuirksMode ? document.documentElement : document.body;
		return elem.clientHeight;
	}

	/**
	 * x,yの位置にスクロールされているかどうかチェックする関数を作成して返す
	 */
	function createCheckScrollFunction(x, y) {
		return function() {
			// 0,0にスクロールされているかどうか確認する
			var scrollX = window.pageXOffset
					|| (isQuirksMode ? document.documentElement.scrollLeft
							: document.body.scrollLeft);
			var scrollY = window.pageYOffset
					|| (isQuirksMode ? document.documentElement.scrollTop : document.body.scrollTop);
			return scrollX === x && scrollY === y;
		}
	}

	// セレクタから、セレクタ/jQueryオブジェクト/DOMについてのisInViewのテストをする関数
	function checkAllMode(fn, expect, message, s1, s2) {
		var obj1 = [s1, $(s1), $(s1)[0]];
		var obj2 = [undefined, undefined, undefined];
		var footer = '';
		if (s2 !== undefined) {
			obj2 = [s2, $(s2), $(s2)[0]];
		}
		var indexMes = ['セレクタ', 'jQuery', 'DOM'];
		for (var i = 0; i < obj1.length; i++) {
			for (var j = 0; j < obj2.length; j++) {
				footer = s1 + ',' + s2 + '  (' + indexMes[i] + '/' + indexMes[j] + ')  ';
				check(fn, expect, message + ' ' + footer, obj1[i], obj2[j]);
			}
		}
	}

	// isInViewのテストをする関数
	function check(fn, expect, message, s1, s2) {
		var result = h5.ui.isInView(s1, s2);
		if (fn === '!==') {
			ok(result !== expect, message + ' ' + result);
		} else {
			fn(result, expect, message);
		}
	}

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
	 * ノードからドキュメントを取得。
	 *
	 * @param {DOM} node
	 * @returns {Document} documentオブジェクト
	 */
	function getDocumentOf(node) {
		if (typeof node.nodeType === TYPE_OF_UNDEFINED) {
			// ノードではない
			if (node.document && node.document.nodeType === NODE_TYPE_DOCUMENT
					&& getWindowOfDocument(node.document) === node) {
				// nodeがdocumentを持ち、documentから得られるwindowオブジェクトがnode自身ならnodeをwindowオブジェクトと判定する
				return node.document;
			}
			return null;
		}
		if (node.nodeType === NODE_TYPE_DOCUMENT) {
			// nodeがdocumentの場合
			return node;
		}
		// nodeがdocument以外(documentツリー属するノード)の場合はそのownerDocumentを返す
		return node.ownerDocument;
	}

	/**
	 * documentオブジェクトからwindowオブジェクトを取得
	 *
	 * @param {Document} doc
	 * @returns {Window} windowオブジェクト
	 */
	function getWindowOfDocument(doc) {
		// IE8-ではdocument.parentWindow、それ以外はdoc.defaultViewでwindowオブジェクトを取得
		return doc.defaultView || doc.parentWindow;
	}

	/**
	 * getComputedStyleで引数に渡されたエレメントのスタイルを取得する
	 *
	 * @param {DOM} elm
	 * @returns computedStyle
	 */
	function getComputedStyleObject(elm) {
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
		return getComputedStyleObject(elm)[prop];
	}
	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================

	module(
			"isInView",
			{
				setup: function() {
					var $fixture = $(fixture);
					$fixture
							.append(
									'<div id="'
											+ test1.substring(1)
											+ '" style="position:absolute; top:50px; left:50px; margin:5px; padding:5px; border:3px solid; width:20px; height:20px;"></div>')
							.append(
									'<div id="'
											+ test2.substring(1)
											+ '" style="position:absolute; top:50px; left:50px; margin:5px; padding:5px; border:0px; width:20px; height:20px"></div>');
					$fixture[0].style.height = '100px';
					$fixture[0].style.width = '200px';
					$fixture[0].style.padding = '10px';
					$fixture[0].style.margin = '10px';
					$fixture[0].style.border = '10px solid';
				},
				teardown: function() {
					$(test1).remove();
					$(test2).remove();
					$(fixture)[0].style.height = '';
					$(fixture)[0].style.width = '';
				}
			});

	//=============================
	// Body
	//=============================
	test('h5.ui.isInView - 親子関係でない要素については、isInView()の結果がundefinedであること。jQuery', function() {
		check(deepEqual, undefined, '', test1, test2);
		check(deepEqual, undefined, '', test2, test1);
		check(deepEqual, undefined, '', 'body', test1);
		check(deepEqual, undefined, '', fixture, test1);
		check('!==', undefined, '親子関係なのでundefinedではないこと。', test1, fixture);
		check('!==', undefined, '親子関係なのでundefinedではないこと。', test1, 'body');
	});

	asyncTest(
			'h5.ui.isInView - 親子関係である要素について、親のborderの内側に子のborderの外側が見えていればisInView()の結果がtrue、見えてない場合はfalseであること。引数は、セレクタ、DOM、jQueryオブジェクトのどれでも判定できること。',
			108, function() {
				var $fixture = $(fixture);
				var $test1 = $(test1);
				var test1Dom = $test1[0];
				function testFunc() {
					var top, left;
					// 1 - ( 内側の要素の高さ・幅 + 内側の要素のマージン(top(left)の値)
					top = 1 - (test1Dom.offsetHeight + parseInt($test1.css('margin-top')));
					left = 1 - (test1Dom.offsetWidth + parseInt($test1.css('margin-left')));

					test1Dom.style.top = top + 'px';
					test1Dom.style.left = left + 'px';
					checkAllMode(deepEqual, true, '左上1pxが見えている状態', test1Dom, fixture);
					test1Dom.style.top = top - 1 + 'px';
					test1Dom.style.left = left + 'px';
					checkAllMode(deepEqual, false, '左上1pxが見えている状態から上に1px移動', test1Dom, fixture);
					test1Dom.style.top = top + 'px';
					test1Dom.style.left = left - 1 + 'px';
					checkAllMode(deepEqual, false, '左上1pxが見えている状態から左に1px移動', test1Dom, fixture);

					// 外側の要素の幅 + 内側の要素の左マージン - 1
					left = $fixture[0].clientWidth - parseInt($test1.css('margin-left')) - 1;

					test1Dom.style.top = top + 'px';
					test1Dom.style.left = left + 'px';
					checkAllMode(deepEqual, true, '右上1pxが見えている状態', test1Dom, fixture);
					test1Dom.style.top = top - 1 + 'px';
					test1Dom.style.left = left + 'px';
					checkAllMode(deepEqual, false, '右上1pxが見えている状態から上に1px移動', test1Dom, fixture);
					test1Dom.style.top = top + 'px';
					test1Dom.style.left = left + 1 + 'px';
					checkAllMode(deepEqual, false, '右上1pxが見えている状態から右に1px移動', test1Dom, fixture);

					// 外側の要素の高さ + 内側の要素の左マージン - 1
					top = $fixture[0].clientHeight - parseInt($test1.css('margin-top')) - 1;

					test1Dom.style.top = top + 'px';
					test1Dom.style.left = left + 'px';
					checkAllMode(deepEqual, true, '右下1pxが見えている状態', test1Dom, fixture);
					test1Dom.style.top = top + 1 + 'px';
					test1Dom.style.left = left + 'px';
					checkAllMode(deepEqual, false, '右下1pxが見えている状態から下に1px移動', test1Dom, fixture);
					test1Dom.style.top = top + 'px';
					test1Dom.style.left = left + 1 + 'px';
					checkAllMode(deepEqual, false, '右下1pxが見えている状態から右に1px移動', test1Dom, fixture);

					// leftを左側に戻す
					left = 1 - (test1Dom.offsetWidth + parseInt($test1.css('margin-left')));

					test1Dom.style.top = top + 'px';
					test1Dom.style.left = left + 'px';
					checkAllMode(deepEqual, true, '左下1pxが見えている状態', test1Dom, fixture);
					test1Dom.style.top = top + 1 + 'px';
					test1Dom.style.left = left + 'px';
					checkAllMode(deepEqual, false, '左下1pxが見えている状態から下に1px移動', test1Dom, fixture);
					test1Dom.style.top = top + 'px';
					test1Dom.style.left = left - 1 + 'px';
					checkAllMode(deepEqual, false, '左下1pxが見えている状態から右に1px移動', test1Dom, fixture);

					start();
				}
				// #test1が配置されるまで待機
				gate({
					func: function() {
						return $(test1Dom).offset()
					},
					failMsg: 'テストに必要なDOMの準備が完了しませんでした'
				}).done(testFunc);
			});

	//=============================
	// Definition
	//=============================
	module(
			"isInView 2",
			{
				setup: function() {
					$(fixture)
							.append(
									'<div id="'
											+ test1.substring(1)
											+ '" style="position:absolute; top:10px; left:-20px; overflow:hidden"></div>');

					$(test1)
							.append(
									'<div id="'
											+ test2.substring(1)
											+ '" style="position:absolute; top:0px; left:0px; margin:5px; padding:5px; width:10px; height:20px; border:2px solid red"></div>');

					$(test1)[0].style.height = '100px';
					$(test1)[0].style.width = '200px';
					$(test1)[0].style.padding = '10px';
					$(test1)[0].style.margin = '10px';
					$(test1)[0].style.border = '10px solid';
				},
				teardown: function() {
					$(test1).remove();
					$(fixture)[0].style.height = '';
					$(fixture)[0].style.width = '';
				}
			});

	//=============================
	// Body
	//=============================
	asyncTest('h5.ui.isInView - 親要素がbodyの直下でない場合でもisInView()の結果が正しく取得できること。', 12, function() {

		var $test1 = $(test1);
		var $test2 = $(test2);
		var test2Dom = $(test2)[0];
		function testFunc() {
			var top, left;
			// 1 - ( 内側の要素の高さ・幅 + 内側の要素のマージン(top(left)の値)
			top = 1 - (test2Dom.offsetHeight + parseInt($test2.css('margin-top')));
			left = 1 - (test2Dom.offsetWidth + parseInt($test2.css('margin-left')));

			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, true, '左上1pxが見えている状態', test2, test1);
			test2Dom.style.top = top - 1 + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, false, '左上1pxが見えている状態から上に1px移動', test2, test1);
			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left - 1 + 'px';
			check(deepEqual, false, '左上1pxが見えている状態から左に1px移動', test2, test1);

			// 外側の要素の幅 + 内側の要素の左マージン - 1
			left = $test1[0].clientWidth - parseInt($test2.css('margin-left')) - 1;

			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, true, '右上1pxが見えている状態', test2, test1);
			test2Dom.style.top = top - 1 + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, false, '右上1pxが見えている状態から上に1px移動', test2, test1);
			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 1 + 'px';
			check(deepEqual, false, '右上1pxが見えている状態から右に1px移動', test2, test1);

			// 外側の要素の高さ + 内側の要素の左マージン - 1
			top = $test1[0].clientHeight - parseInt($test2.css('margin-top')) - 1;

			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, true, '右下1pxが見えている状態', test2, test1);
			test2Dom.style.top = top + 1 + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, false, '右下1pxが見えている状態から下に1px移動', test2, test1);
			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 1 + 'px';
			check(deepEqual, false, '右下1pxが見えている状態から右に1px移動', test2, test1);

			// leftを左側に戻す
			left = 1 - (test2Dom.offsetWidth + parseInt($test2.css('margin-left')));

			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, true, '左下1pxが見えている状態', test2, test1);
			test2Dom.style.top = top + 1 + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, false, '左下1pxが見えている状態から下に1px移動', test2, test1);
			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left - 1 + 'px';
			check(deepEqual, false, '左下1pxが見えている状態から右に1px移動', test2, test1);

			start();
		}

		// #test2が配置されるまで待機
		gate({
			func: function() {
				return $(test2Dom).offset()
			},
			failMsg: 'テストに必要なDOMの準備が完了しませんでした'
		}).done(testFunc);
	});

	//=============================
	// Definition
	//=============================
	module(
			"isInView 3",
			{
				setup: function() {
					$(fixture)
							.append(
									'<div id="'
											+ test1.substring(1)
											+ '" style="position:absolute; top:10px; left:-20px; overflow:hidden"></div>');
					$(test1).append('<div id="' + test3.substring(1) + '"></div>');
					$(test3)
							.append(
									'<div id="'
											+ test2.substring(1)
											+ '" style="position:absolute; margin:5px; padding:5px; width:10px; height:20px; border:2px solid red"></div>');

					$(test1)[0].style.height = '100px';
					$(test1)[0].style.width = '200px';
					$(test1)[0].style.padding = '10px';
					$(test1)[0].style.margin = '10px';
					$(test1)[0].style.border = '10px solid';
				},
				teardown: function() {
					$(test1).remove();
					$(fixture)[0].style.height = '';
					$(fixture)[0].style.width = '';
				}
			});

	//=============================
	// Body
	//=============================
	asyncTest('h5.ui.isInView - 孫要素に対してもisInView()の結果が正しく取得できること。', 12, function() {
		var $test1 = $(test1);
		var $test2 = $(test2);
		var test2Dom = $test2[0];
		function testFunc() {
			var top, left;
			// 1 - ( 内側の要素の高さ・幅 + 内側の要素のマージン(top(left)の値)
			top = 1 - (test2Dom.offsetHeight + parseInt($test2.css('margin-top')));
			left = 1 - (test2Dom.offsetWidth + parseInt($test2.css('margin-left')));

			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, true, '左上1pxが見えている状態', test2, test1);
			test2Dom.style.top = top - 1 + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, false, '左上1pxが見えている状態から上に1px移動', test2, test1);
			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left - 1 + 'px';
			check(deepEqual, false, '左上1pxが見えている状態から左に1px移動', test2, test1);

			// 外側の要素の幅 + 内側の要素の左マージン - 1
			left = $test1[0].clientWidth - parseInt($test2.css('margin-left')) - 1;

			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, true, '右上1pxが見えている状態', test2, test1);
			test2Dom.style.top = top - 1 + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, false, '右上1pxが見えている状態から上に1px移動', test2, test1);
			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 1 + 'px';
			check(deepEqual, false, '右上1pxが見えている状態から右に1px移動', test2, test1);

			// 外側の要素の高さ + 内側の要素の左マージン - 1
			top = $test1[0].clientHeight - parseInt($test2.css('margin-top')) - 1;

			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, true, '右下1pxが見えている状態', test2, test1);
			test2Dom.style.top = top + 1 + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, false, '右下1pxが見えている状態から下に1px移動', test2, test1);
			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 1 + 'px';
			check(deepEqual, false, '右下1pxが見えている状態から右に1px移動', test2, test1);

			// leftを左側に戻す
			left = 1 - (test2Dom.offsetWidth + parseInt($test2.css('margin-left')));

			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, true, '左下1pxが見えている状態', test2, test1);
			test2Dom.style.top = top + 1 + 'px';
			test2Dom.style.left = left + 'px';
			check(deepEqual, false, '左下1pxが見えている状態から下に1px移動', test2, test1);
			test2Dom.style.top = top + 'px';
			test2Dom.style.left = left - 1 + 'px';
			check(deepEqual, false, '左下1pxが見えている状態から右に1px移動', test2, test1);

			start();
		}

		// #test2が配置されるまで待機
		gate({
			func: function() {
				return $(test2Dom).offset()
			},
			failMsg: 'テストに必要なDOMの準備が完了しませんでした'
		}).done(testFunc);
	});

	//=============================
	// Definition
	//=============================
	var originTop = 0;
	var originLeft = 0;

	module(
			"isInView4",
			{
				setup: function() {
					originTop = $(window).scrollTop();
					originLeft = $(window).scrollLeft();
					$('body')
							.append(
									'<div id="'
											+ test3.substring(1)
											+ '" style="position:absolute; top:50px; left:50px; padding:5px; border:3px solid; width:20px; height:20px;"></div>');
					// スクロールできるようにするための要素を追加
					var width = getWindowWidth() + 100;
					var height = getWindowHeight() + 100;
					$('body').append(
							'<div id="enableScroll" style="width:' + width + 'px;height:' + height
									+ 'px;visible:hidden;top:0;left:0;position:absolute;"></div>');

					// 0,0 にスクロールされるまで待ってからテスト実行
					stop();
					window.scrollTo(0, 0);
					gate({
						func: createCheckScrollFunction(0, 0)
					}).done(function() {
						start();
					}).fail(function() {
						start();
						skipTest(true, 'setupでスクロールが完了しませんでした');
					});
				},
				teardown: function() {
					// テスト用に作った要素の削除
					$(test3).remove();
					$('#enableScroll').remove();
					$(window).scrollTop(originTop);
					$(window).scrollTop(originLeft);
				}
			});

	//=============================
	// Body
	//=============================
	asyncTest(
			'(Androidのデフォルトブラウザでテストを行う場合は、「設定」-「ページを全体表示で開く」を無効にして下さい)h5.ui.isInView - 第二引数を省略したときはウィンドウ上に見えているかどうかを判定できること。スクロールした状態でも見えているかどうかで判定されること。',
			24, function() {
				var testDom = $(test3)[0];
				// スクロール量
				var scrollVal = 3;

				function testFunc(scrollTop, scrollLeft) {
					var viewTop = scrollTop || 0;
					var viewLeft = scrollLeft || 0;

					var top, left;
					// 1 - 内側の要素のボーダー(上下(左右)の合計) + 内側の要素の高さ(幅))
					top = viewTop + (1 - testDom.offsetHeight);
					left = viewLeft + (1 - testDom.offsetWidth);

					testDom.style.top = top + 'px';
					testDom.style.left = left + 'px';
					check(deepEqual, true, '左上1pxが見えている状態', testDom);
					testDom.style.top = top - 1 + 'px';
					testDom.style.left = left + 'px';
					check(deepEqual, false, '左上1pxが見えている状態から上に1px移動', testDom);
					testDom.style.top = top + 'px';
					testDom.style.left = left - 1 + 'px';
					check(deepEqual, false, '左上1pxが見えている状態から左に1px移動', testDom);

					// window幅 - 1
					left = getWindowWidth() + viewLeft - 1;

					testDom.style.top = top + 'px';
					testDom.style.left = left + 'px';
					check(deepEqual, true, '右上1pxが見えている状態', testDom);
					testDom.style.top = top - 1 + 'px';
					testDom.style.left = left + 'px';
					check(deepEqual, false, '右上1pxが見えている状態から上に1px移動', testDom);
					testDom.style.top = top + 'px';
					testDom.style.left = left + 1 + 'px';
					check(deepEqual, false, '右上1pxが見えている状態から右に1px移動', testDom); // TODO

					// windowの高さ - 1
					top = getWindowHeight() + viewTop - 1;

					testDom.style.top = top + 'px';
					testDom.style.left = left + 'px';
					check(deepEqual, true, '右下1pxが見えている状態', testDom);
					testDom.style.top = top + 1 + 'px';
					testDom.style.left = left + 'px';
					check(deepEqual, false, '右下1pxが見えている状態から下に1px移動', testDom);
					testDom.style.top = top + 'px';
					testDom.style.left = left + 1 + 'px';
					check(deepEqual, false, '右下1pxが見えている状態から右に1px移動', testDom);

					// leftを左側に戻す
					left = viewLeft + (1 - testDom.offsetWidth);

					testDom.style.top = top + 'px';
					testDom.style.left = left + 'px';
					check(deepEqual, true, '左下1pxが見えている状態', testDom);
					testDom.style.top = top + 1 + 'px';
					testDom.style.left = left + 'px';
					check(deepEqual, false, '左下1pxが見えている状態から下に1px移動', testDom);
					testDom.style.top = top + 'px';
					testDom.style.left = left - 1 + 'px';
					check(deepEqual, false, '左下1pxが見えている状態から右に1px移動', testDom);

					if (!(scrollTop && scrollLeft)) {
						window.scrollTo(scrollVal, scrollVal);
					} else {
						return;
					}

					// scrollValにスクロールされるのを待機
					gate({
						func: createCheckScrollFunction(scrollVal, scrollVal),
						failMsg: 'スクロールが完了しませんでした'
					}).done(function() {
						testFunc(scrollVal, scrollVal);
						start();
					});
				}
				testFunc();
			});

	//=============================
	// Definition
	//=============================
	module(
			"isInView 6",
			{
				setup: function() {
					$(fixture)
							.append(
									'<div id="'
											+ test1.substring(1)
											+ '" style="position:absolute; top:10px; left:-20px; overflow:hidden"></div>');

					$(test1)
							.append(
									'<div id="'
											+ test2.substring(1)
											+ '" style="position:absolute; top:0px; left:0px; margin:5px; padding:5px; width:10px; height:20px; border:2px solid red"></div>');

					var domTest1 = $(test1)[0];
					domTest1.style.height = '100px';
					domTest1.style.width = '200px';
					domTest1.style.padding = '10px';
					domTest1.style.margin = '10px';
					domTest1.style.border = '10px solid';
				},
				teardown: function() {
					$(test1).remove();
					$(fixture)[0].style.height = '';
					$(fixture)[0].style.width = '';
				}
			});
	//=============================
	// Body
	//=============================
	asyncTest(
			'[browser#ie:6-7]h5.ui.isInView - 親要素がbodyの直下でない場合でもisInView()の結果が正しく取得できること。box-sizing:border-boxを適用された要素でも正しく判定されるか。※CSSのbox-sizing属性がサポートされていないブラウザの場合テストは失敗します。',
			12, function() {
				if (!supportsCSS3Property('boxSizing')) {
					expect(1);
					ok(false, 'CSSのbox-sizing属性がサポートされていないため、テストは実行されません。');
					start();
					return;
				}

				var $test1 = $(test1);
				var $test2 = $(test2);
				var test2Dom = $(test2)[0];

				$test1.css({
					'box-sizing': 'border-box',
					'-moz-box-sizing': 'border-box',
					'-webkit-box-sizing': 'border-box',
					'-ms-box-sizing': 'border-box',
					'-o-box-sizing': 'border-box'
				});

				$test2.css({
					'box-sizing': 'border-box',
					'-moz-box-sizing': 'border-box',
					'-webkit-box-sizing': 'border-box',
					'-ms-box-sizing': 'border-box',
					'-o-box-sizing': 'border-box'
				});


				function testFunc() {
					var top, left;
					// 1 - ( 内側の要素の高さ・幅 + 内側の要素のマージン(top(left)の値)
					top = 1 - (test2Dom.offsetHeight + parseInt($test2.css('margin-top')));
					left = 1 - (test2Dom.offsetWidth + parseInt($test2.css('margin-left')));

					test2Dom.style.top = top + 'px';
					test2Dom.style.left = left + 'px';
					check(deepEqual, true, '左上1pxが見えている状態', test2, test1);
					test2Dom.style.top = top - 1 + 'px';
					test2Dom.style.left = left + 'px';
					check(deepEqual, false, '左上1pxが見えている状態から上に1px移動', test2, test1);
					test2Dom.style.top = top + 'px';
					test2Dom.style.left = left - 1 + 'px';
					check(deepEqual, false, '左上1pxが見えている状態から左に1px移動', test2, test1);

					// 外側の要素の幅 + 内側の要素の左マージン - 1
					left = $test1[0].clientWidth - parseInt($test2.css('margin-left')) - 1;

					test2Dom.style.top = top + 'px';
					test2Dom.style.left = left + 'px';
					check(deepEqual, true, '右上1pxが見えている状態', test2, test1);
					test2Dom.style.top = top - 1 + 'px';
					test2Dom.style.left = left + 'px';
					check(deepEqual, false, '右上1pxが見えている状態から上に1px移動', test2, test1);
					test2Dom.style.top = top + 'px';
					test2Dom.style.left = left + 1 + 'px';
					check(deepEqual, false, '右上1pxが見えている状態から右に1px移動', test2, test1);

					// 外側の要素の高さ + 内側の要素の左マージン - 1
					top = $test1[0].clientHeight - parseInt($test2.css('margin-top')) - 1;

					test2Dom.style.top = top + 'px';
					test2Dom.style.left = left + 'px';
					check(deepEqual, true, '右下1pxが見えている状態', test2, test1);
					test2Dom.style.top = top + 1 + 'px';
					test2Dom.style.left = left + 'px';
					check(deepEqual, false, '右下1pxが見えている状態から下に1px移動', test2, test1);
					test2Dom.style.top = top + 'px';
					test2Dom.style.left = left + 1 + 'px';
					check(deepEqual, false, '右下1pxが見えている状態から右に1px移動', test2, test1);

					// leftを左側に戻す
					left = 1 - (test2Dom.offsetWidth + parseInt($test2.css('margin-left')));

					test2Dom.style.top = top + 'px';
					test2Dom.style.left = left + 'px';
					check(deepEqual, true, '左下1pxが見えている状態', test2, test1);
					test2Dom.style.top = top + 1 + 'px';
					test2Dom.style.left = left + 'px';
					check(deepEqual, false, '左下1pxが見えている状態から下に1px移動', test2, test1);
					test2Dom.style.top = top + 'px';
					test2Dom.style.left = left - 1 + 'px';
					check(deepEqual, false, '左下1pxが見えている状態から右に1px移動', test2, test1);

					start();
				}
				// #test2が配置されるまで待機
				gate({
					func: function() {
						return $(test2Dom).offset()
					},
					failMsg: 'テストに必要なDOMの準備が完了しませんでした'
				}).done(testFunc);
			});

	//=============================
	// Definition
	//=============================
	module("isInView 7", {
		setup: function() {
			this.$test.css({
				border: '10px solid red',
				width: '20px',
				height: '20px',
				position: 'absolute'
			});
			var $html = $('html');
			var htmlElm = $html[0];
			var $body = $(document.body);

			// html,body要素のスタイル(指定値)を変更する。
			// (ブラウザによってデフォルト指定されている値が違うため)
			// teardownで戻せるように保存しておく。
			this.originHtmlCss = {
				margin: htmlElm.style.margin,
				padding: htmlElm.style.padding,
				border: htmlElm.style.border
			};
			$html.css({
				margin: '1px',
				border: '2px solid #ccc',
				padding: '4px'
			});

			this.originBodyCss = {
				margin: document.body.style.margin,
				border: document.body.style.border,
				padding: document.body.style.padding
			};
			$body.css({
				margin: '8px',
				border: '16px solid #ccc',
				padding: '32px'
			});
			$body.append(this.$test);

			// スクロールできるようにするための要素を追加
			var width = getWindowWidth() + 100;
			var height = getWindowHeight() + 100;
			$('body').append(
					'<div id="enableScroll" style="width:' + width + 'px;height:' + height
							+ 'px;visible:hidden;top:0;left:0;position:absolute;"></div>');

			// 0,0 にスクロールされるまで待ってからテスト実行
			stop();
			window.scrollTo(0, 0);
			gate({
				func: createCheckScrollFunction(0, 0)
			}).done(function() {
				start();
			}).fail(function() {
				start();
				skipTest(true, 'setupでスクロールが完了しませんでした');
			});

		},
		teardown: function() {
			document.body.style.margin = this.originBodyCss.margin;
			document.body.style.border = this.originBodyCss.border;
			document.body.style.padding = this.originBodyCss.padding;

			var htmlElm = $('html')[0];
			htmlElm.style.margin = this.originHtmlCss.margin;
			htmlElm.style.border = this.originHtmlCss.border;
			htmlElm.style.padding = this.originHtmlCss.padding;

			this.$test.remove();
			$('#enableScroll').remove();
			window.scrollTo(0, 0);
		},
		$test: $('<div>a</div>​'),
		originHtmlCss: {},
		originBodyCss: {}
	});
	//=============================
	// Body
	//=============================
	asyncTest('h5.ui.isInView - 第2引数がbodyの場合に正しく判定できること。スクロールされてもbodyの位置が正しく取得できて判定できること。', 24,
			function() {
				var that = this;
				// スクロール量
				var scrollVal = 3;

				function testFunc() {
					var top, left;
					var body = document.body;
					var html = $('html')[0];
					var test = that.$test[0];

					var htmlMarginX = parseFloat($(html).css('marginLeft'));
					var htmlBorderX = parseFloat($(html).css('borderLeftWidth'));
					var htmlPaddingX = parseFloat($(html).css('paddingLeft'));
					var bodyMarginX = parseFloat($(body).css('marginLeft'));
					var bodyBorderX = parseFloat($(body).css('borderLeftWidth'));

					var htmlMarginY = parseFloat($(html).css('marginTop'));
					var htmlBorderY = parseFloat($(html).css('borderTopWidth'));
					var htmlPaddingY = parseFloat($(html).css('paddingTop'));
					var bodyMarginY = parseFloat($(body).css('marginTop'));
					var bodyBorderY = parseFloat($(body).css('borderTopWidth'));


					var offsetX = htmlPaddingX + bodyMarginX + bodyBorderX;
					var offsetY = htmlPaddingY + bodyMarginY + bodyBorderY;
					if (!(h5.env.ua.isIE && h5.env.ua.browserVersion <= 6)) {
						offsetX += htmlMarginX + htmlBorderX;
						offsetY += htmlMarginY + htmlBorderY;
					}

					// 1 - (内側の要素 border-width*2 + width)
					top = offsetY + 1 - (10 * 2 + 20);
					left = offsetX + 1 - (10 * 2 + 20);

					test.style.top = top + 'px';
					test.style.left = left + 'px';
					check(deepEqual, true, '左上1pxが見えている状態', test, body);
					test.style.top = top - 1 + 'px';
					test.style.left = left + 'px';
					check(deepEqual, false, '左上1pxが見えている状態から上に1px移動', test, body);
					test.style.top = top + 'px';
					test.style.left = left - 1 + 'px';
					check(deepEqual, false, '左上1pxが見えている状態から左に1px移動', test, body);

					// 外側の要素の幅 - 1
					left = offsetX + body.clientWidth - 1;

					test.style.top = top + 'px';
					test.style.left = left + 'px';
					check(deepEqual, true, '右上1pxが見えている状態', test, body);
					test.style.top = top - 1 + 'px';
					test.style.left = left + 'px';
					check(deepEqual, false, '右上1pxが見えている状態から上に1px移動', test, body);
					test.style.top = top + 'px';
					test.style.left = left + 1 + 'px';
					check(deepEqual, false, '右上1pxが見えている状態から右に1px移動', test, body);

					// 外側の要素の高さ - 1
					top = offsetY + body.clientHeight - 1;

					test.style.top = top + 'px';
					test.style.left = left + 'px';
					check(deepEqual, true, '右下1pxが見えている状態', test, body);
					test.style.top = top + 1 + 'px';
					test.style.left = left + 'px';
					check(deepEqual, false, '右下1pxが見えている状態から下に1px移動', test, body);
					test.style.top = top + 'px';
					test.style.left = left + 1 + 'px';
					check(deepEqual, false, '右下1pxが見えている状態から右に1px移動', test, body);

					// leftを左側に戻す
					left = offsetX + 1 - (10 * 2 + 20);

					test.style.top = top + 'px';
					test.style.left = left + 'px';
					check(deepEqual, true, '左下1pxが見えている状態', test, body);
					test.style.top = top + 1 + 'px';
					test.style.left = left + 'px';
					check(deepEqual, false, '左下1pxが見えている状態から下に1px移動', test, body);
					test.style.top = top + 'px';
					test.style.left = left - 1 + 'px';
					check(deepEqual, false, '左下1pxが見えている状態から右に1px移動', test, body);
				}
				testFunc();

				// スクロールしてテスト
				window.scrollTo(scrollVal, scrollVal);
				gate({
					func: createCheckScrollFunction(scrollVal, scrollVal),
					failMsg: 'スクロールが完了しませんでした'
				}).done(function() {
					testFunc();
					start();
				});

			});

	//=============================
	// Definition
	//=============================
	module('scrollToTop', {
		setup: function() {
			// スクロールできるようにするための要素を追加
			$('body').append(
					'<div id="enableScroll" style="width:1px;visible:hidden;height:1px; position:absolute; top:'
							+ (getWindowHeight() + 1000) + 'px; width:' + (getWindowWidth() + 1000)
							+ 'px;"></div>');
		},
		teardown: function() {
			// テスト用に作った要素の削除
			$('#enableScroll').remove();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('h5.ui.scrollToTop (0, 1)の地点にスクロール', 1, function() {
		// scrollToTopで(0,1)にスクロール
		h5.ui.scrollToTop();

		// スクロールされるのを待機
		gate({
			func: createCheckScrollFunction(0, 1),
			failMsg: 'スクロールが完了しませんでした'
		}).done(function() {
			ok(true, '(0,1)にスクロールされた');
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('indicator');

	//=============================
	// Body
	//=============================
	test('プロミスオブジェクトを指定した時、commonFailHandlerの動作は阻害されない', 2, function() {
		var cfhCount = 0;
		h5.settings.commonFailHandler = function() {
			cfhCount++;
		};
		var dfd = h5.async.deferred();
		var indicator = h5.ui.indicator(document, {
			promises: dfd.promise()
		});
		dfd.reject();
		strictEqual(cfhCount, 1, 'commonFailHandlerが実行されたこと');

		cfhCount = 0;
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		indicator = h5.ui.indicator(document, {
			promises: [dfd1.promise(), dfd2.promise()]
		});
		dfd1.reject();
		dfd2.reject();
		strictEqual(cfhCount, 1, '複数のプロミスを渡したとき、まとめて1回だけcommonFailHandlerが実行されること');
	});

	//=============================
	// Definition
	//=============================
	module('iframe内の要素にindicator', {
		setup: function() {
			// IE11EdgeかつjQuery1.10.1または2.0.2の場合はテストしない
			if (h5.env.ua.isIE && h5.env.ua.browserVersion === 11
					&& ($().jquery === '1.10.1' || $().jquery === '2.0.2')) {
				skipTest();
				return;
			}
			stop();
			var that = this;
			createIFrameElement().done(function(iframe, doc, win) {
				that.doc = doc;
				that.win = win;
				start();
			});
		},
		teardown: function() {
			this.doc = null;
			this.win = null;
		},
		doc: null,
		win: null
	});

	//=============================
	// Body
	//=============================
	asyncTest('iframe内にindicator target:div', 5, function() {
		var doc = this.doc;
		var div = doc.createElement('div');
		div.style.width = '100px';
		div.style.height = '100px';
		doc.body.appendChild(div);
		var indicator = h5.ui.indicator(div, {
			message: 'BlockMessageTest'
		}).show();
		ok(indicator._target === div, 'ターゲットがiframe内のdiv要素であること');

		strictEqual($(indicator._target).find('.h5-indicator.a.content > .indicator-message')
				.text(), 'BlockMessageTest', 'メッセージが表示されていること');
		strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
				'Indicator#show() インジケータが表示されること');

		strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css('display'), 'block',
				'オーバーレイが表示されていること');

		setTimeout(function() {
			indicator.hide();

			setTimeout(function() {
				strictEqual($('.h5-indicator', indicator._target).length, 0,
						'Indicator#hide() インジケータが除去されていること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('iframe内にindicator target:body', 5, function() {
		var doc = this.doc;
		var indicator = h5.ui.indicator(doc.body, {
			message: 'BlockMessageTest'
		}).show();
		ok(indicator._target === doc.body, 'ターゲットがiframe要素内のbodyであること');

		strictEqual($(indicator._target).find('.h5-indicator.a.content > .indicator-message')
				.text(), 'BlockMessageTest', 'メッセージが表示されていること');
		strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
				'Indicator#show() インジケータが表示されること');

		strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css('display'), 'block',
				'オーバーレイが表示されていること');

		setTimeout(function() {
			indicator.hide();

			setTimeout(function() {
				strictEqual($('.h5-indicator', indicator._target).length, 0,
						'Indicator#hide() インジケータが除去されていること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('iframe内にindicator  target:document', 5, function() {
		var doc = this.doc;
		var indicator = h5.ui.indicator(doc, {
			message: 'BlockMessageTest'
		}).show();
		ok(indicator._target === doc.body, 'ターゲットがiframe要素内のbodyであること');

		strictEqual($(indicator._target).find('.h5-indicator.a.content > .indicator-message')
				.text(), 'BlockMessageTest', 'メッセージが表示されていること');
		strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
				'Indicator#show() インジケータが表示されること');

		strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css('display'), 'block',
				'オーバーレイが表示されていること');

		setTimeout(function() {
			indicator.hide();

			setTimeout(function() {
				strictEqual($('.h5-indicator', indicator._target).length, 0,
						'Indicator#hide() インジケータが除去されていること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('iframe内にindicator  target:window', 5, function() {
		var indicator = h5.ui.indicator(this.win, {
			message: 'BlockMessageTest'
		}).show();
		ok(indicator._target === this.doc.body, 'ターゲットがiframe要素内のbodyであること');

		strictEqual($(indicator._target).find('.h5-indicator.a.content > .indicator-message')
				.text(), 'BlockMessageTest', 'メッセージが表示されていること');
		strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
				'Indicator#show() インジケータが表示されること');

		strictEqual($(indicator._target).find('.h5-indicator.a.overlay')[0].style.display, 'block',
				'オーバーレイが表示されていること');

		setTimeout(function() {
			indicator.hide();

			setTimeout(function() {
				strictEqual($('.h5-indicator', indicator._target).length, 0,
						'Indicator#hide() インジケータが除去されていること');
				start();
			}, 0);
		}, 0);
	});
	//=============================
	// Definition
	//=============================
	module('[browser#ch-and:all|and-and:all|sa-ios:all|ie-wp:all]ポップアップウィンドウ内の要素にindicator', {
		setup: function() {
			// (IE8-またはIE11)かつ(jQuery1.10.1または2.0.2)の場合はポップアップウィンドウを使用するテストは行わずにスキップする。
			// いずれの場合もポップアップウィンドウのDOM操作をjQueryで行う時にエラーになるからである。
			if (h5.env.ua.isIE
					&& (h5.env.ua.browserVersion === 11 || h5.env.ua.browserVersion <= 8)
					&& ($().jquery === '1.10.1' || $().jquery === '2.0.2')) {
				skipTest();
				return;
			}
			stop();
			var that = this;
			openPopupWindow().done(function(w) {
				that.win = w;
				that.doc = w.document;
				start();
			}).fail(function() {
				start();
				skipTest();
				return;
			});
		},
		teardown: function() {
			var that = this;
			if (this.win) {
				stop();
				closePopupWindow(this.win).done(function() {
					that.doc = null;
					that.win = null;
					start();
				}).fail(function() {
					start();
				});
			}
		},
		doc: null,
		win: null
	});

	//=============================
	// Body
	//=============================

	asyncTest('ポップアップウィンドウ内のbodyにindicator  target:popupWindow', 5, function() {
		var indicator = h5.ui.indicator(this.win, {
			message: 'BlockMessageTest'
		}).show();
		ok(indicator._target === this.doc.body, 'ターゲットがポップアップウィンドウのbodyであること');

		strictEqual($(indicator._target).find('.h5-indicator.a.content > .indicator-message')
				.text(), 'BlockMessageTest', 'メッセージが表示されていること');
		var $overlay = $(indicator._target).find('.h5-indicator.a.overlay');
		strictEqual($overlay.length, 1, 'Indicator#show() インジケータが表示されること');
		strictEqual(getComputedStyleValue($overlay[0], 'display'), 'block', 'オーバーレイが表示されていること');
		setTimeout(function() {
			indicator.hide();

			setTimeout(function() {
				strictEqual($('.h5-indicator', indicator._target).length, 0,
						'Indicator#hide() インジケータが除去されていること');
				start();
			}, 0);
		}, 0);
	});
});
