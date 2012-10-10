/*
 * Copyright (C) 2012 NS Solutions Corporation, All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 *
 * hifive
 */
$(function() {
	var fixture = '#qunit-fixture';
	var test1 = '#isInViewTest1';
	var test2 = '#isInViewTest2';
	var test3 = '#isInViewTest3';

	function getWindowWidth() {
		var elem = $.support.boxModel ? document.documentElement : document.body;
		// window.innerHeightではスクロールバーの幅も入ってしまうため、clientWidthを使う
		return elem.clientWidth;
	}
	function getWindowHeight() {
		// iPhoneの場合、clientHeightだと下のツールバーまで含まれてしまうので、innerHeightを使う
		if (h5.env.ua.isiPhone) {
			return window.innerHeight;
		}
		var elem = $.support.boxModel ? document.documentElement : document.body;
		return elem.clientHeight;
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
		for ( var i = 0; i < obj1.length; i++) {
			for ( var j = 0; j < obj2.length; j++) {
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

	test('h5.ui.isInView - 親子関係でない要素については、isInView()の結果がundefinedであること。jQuery', 6, function() {
		check(deepEqual, undefined, '', test1, test2);
		check(deepEqual, undefined, '', test2, test1);
		check(deepEqual, undefined, '', 'body', test1);
		check(deepEqual, undefined, '', fixture, test1);
		check('!==', undefined, '親子関係なのでundefinedではないこと。', test1, fixture);
		check('!==', undefined, '親子関係なのでundefinedではないこと。', test1, 'body');
	});

	asyncTest(
			'h5.ui.isInView - 親子関係である要素について、親のborderの内側に子のborderの外側が見えていればisInView()の結果がtrue、見えてない場合はfalseであること。引数は、セレクタ、DOM、jQueryオブジェクトのどれでも判定できること。',
			3 * 4 * 9, function() {
				var $fixture = $(fixture);
				var $test1 = $(test1);
				var test1Dom = $test1[0];
				function testFunc() {
					var top,left;
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
				function waitForDom(i) {
					if ($(test1Dom).offset()) {
						testFunc();
						return;
					}
					setTimeout(function() {
						waitForDom();
					}, 0);
				}
				waitForDom();
			});

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
	asyncTest('h5.ui.isInView - 親要素がbodyの直下でない場合でもisInView()の結果が正しく取得できること。', 12, function() {
		var $test1 = $(test1);
		var $test2 = $(test2);
		var test2Dom = $(test2)[0];
		function testFunc() {
			var top,left;
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
		function waitForDom(i) {
			if ($(test2).offset()) {
				testFunc();
				return;
			}
			setTimeout(function() {
				waitForDom();
			}, 0);
		}
		waitForDom();
	});


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
	asyncTest('h5.ui.isInView - 孫要素に対してもisInView()の結果が正しく取得できること。', 12, function() {
		var $test1 = $(test1);
		var $test2 = $(test2);
		var test2Dom = $test2[0];
		function testFunc() {
			var top,left;
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
		function waitForDom(i) {
			if ($(test2).offset()) {
				testFunc();
				return;
			}
			setTimeout(function() {
				waitForDom();
			}, 0);
		}
		waitForDom();
	});

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
					$('body')
							.append(
									'<div id="enableScroll" style="width:2000px;height:2000px;visible:hidden;top:0;left:0;position:absolute;"></div>');

					// 0,0にスクロールしてテスト
					window.scrollTo(0, 0);
				},
				teardown: function() {
					// テスト用に作った要素の削除
					$(test3).remove();
					$('#enableScroll').remove();
					$(window).scrollTop(originTop);
					$(window).scrollTop(originLeft);
				}
			});
	asyncTest(
			'(Androidのデフォルトブラウザでテストを行う場合は、「設定」-「ページを全体表示で開く」を無効にして下さい)h5.ui.isInView - 第二引数を省略したときはウィンドウ上に見えているかどうかを判定できること。スクロールした状態でも見えているかどうかで判定されること。',
			24, function() {
				setTimeout(function() {
					var testDom = $(test3)[0];
					function testFunc(scrollTop, scrollLeft) {
						var viewTop = scrollTop || 0;
						var viewLeft = scrollLeft || 0;

						var top,left;
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
							window.scrollTo(100, 100);
						} else {
							return;
						}
						setTimeout(function() {
							// 100, 100にスクロールされた状態でテスト
							testFunc(100, 100);
							start();
						}, 1000);

					}
					testFunc();
				}, 1000);
			});

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

	asyncTest('h5.ui.scrollToTop', 1, function() {
		// scrollToTopで(0,1)にスクロール
		h5.ui.scrollToTop();

		var count = 0;
		function waitForScroll() {
			if ($(window).scrollTop() === 1 && $(window).scrollLeft() === 0) {
				ok(true, '(0,1)にスクロールされた');
				start();
				return;
			} else if (count++ === 3) {
				ok(false, 'スクロールされませんでした。');
				start();
				return;
			}
			setTimeout(waitForScroll, 200);
		}
		waitForScroll();
	});
});
