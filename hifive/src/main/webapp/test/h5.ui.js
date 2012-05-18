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

	// セレクタから、セレクタ/jQueryオブジェクト/DOMについてのisInViewのテストをする関数
	function check(fn, expect, message, s1, s2) {
		var obj1 = [s1, $(s1), $(s1)[0]];
		var obj2 = [undefined, undefined, undefined];
		if (s2 !== undefined) {
			obj2 = [s2, $(s2), $(s2)[0]];
		}
		var indexMes = ['セレクタ', 'jQuery', 'DOM'];
		for ( var i = 0; i < obj1.length; i++) {
			for ( var j = 0; j < obj2.length; j++) {
				var footer = s1 + ',' + s2 + '  (' + indexMes[i] + '/' + indexMes[j] + ')  ';
				var result = s2 !== undefined ? h5.ui.isInView(obj1[i], obj2[j]) : h5.ui
						.isInView(obj1[i]);
				if (fn === '!==') {
					ok(result !== expect, message + ' ' + footer + ' ' + result);
				} else {
					fn(result, expect, message + footer);
				}
			}
		}
	}
	module(
			"isInView",
			{
				setup: function() {
					$(fixture)
							.append(
									'<div id="'
											+ test1.substring(1)
											+ '" style="position:absolute; top:50px; left:50px; margin:5px; padding:5px; border:3px solid; width:20px; height:20px;"></div>')
							.append(
									'<div id="'
											+ test2.substring(1)
											+ '" style="position:absolute; top:50px; left:50px; margin:5px; padding:5px; width:20px; height:20px"></div>');
					$(fixture).css('height', '100px');
					$(fixture).css('width', '200px');
					$(fixture).css('padding', '10px');
					$(fixture).css('margin', '10px');
					$(fixture).css('border', '10px solid');
				},
				teardown: function() {
					$(test1).remove();
					$(test2).remove();
					$(fixture).css('height', '');
					$(fixture).css('width', '');
				}
			});

	test('h5.ui.isInView - 親子関係でない要素については、isInView()の結果がundefinedであること。jQuery', 54, function() {
		check(same, undefined, '', test1, test2);
		check(same, undefined, '', test2, test1);
		check(same, undefined, '', 'body', test1);
		check(same, undefined, '', fixture, test1);
		check('!==', undefined, '親子関係なのでundefinedではないこと。', test1, fixture);
		check('!==', undefined, '親子関係なのでundefinedではないこと。', test1, 'body');
	});

	asyncTest(
			'h5.ui.isInView - 親子関係である要素について、親のborderの内側に子のborderの外側が見えていればisInView()の結果がtrue、見えてない場合はfalseであること。',
			3 * 4 * 9, function() {
				function testFunc() {
					var top,left;
					// 1 - ( 内側の要素のボーダー(上下(左右)の合計) + 内側の要素のパディング(上下(左右)の合計) + 内側の要素の高さ(幅) +
					// 外側の要素のボーダー)
					top = left = -40;

					// Firefoxだと負の値を設定したときに1px～2pxずれるため、調整。WebDriver版はずれない。
					if (h5.env.ua.isFirefox && navigator.userAgent.indexOf('WebDriver') === -1) {
						top++;
						left++;
					}
					$(test1).css('top', top + 'px');
					$(test1).css('left', left + 'px');
					check(same, true, '左上1pxが見えている状態', test1, fixture);
					$(test1).css('top', top - 1 + 'px');
					$(test1).css('left', left + 'px');
					check(same, false, '左上1pxが見えている状態から上に1px移動', test1, fixture);
					$(test1).css('top', top + 'px');
					$(test1).css('left', left - 1 + 'px');
					check(same, false, '左上1pxが見えている状態から左に1px移動', test1, fixture);

					// 外側の要素の幅 + 外側の要素のボーダー + 外側の要素のパディング(左右) - 内側の要素のマージン - 1
					left = 214;
					$(test1).css('top', top + 'px');
					$(test1).css('left', left + 'px');
					check(same, true, '右上1pxが見えている状態', test1, fixture);
					$(test1).css('top', top - 1 + 'px');
					$(test1).css('left', left + 'px');
					check(same, false, '右上1pxが見えている状態から上に1px移動', test1, fixture);
					$(test1).css('top', top + 'px');
					$(test1).css('left', left + 1 + 'px');
					check(same, false, '右上1pxが見えている状態から右に1px移動', test1, fixture);

					// 外側の要素の高さ + 外側の要素のボーダー + 外側の要素のパディング(上下) - 内側の要素のマージン - 1
					top = 114;
					$(test1).css('top', top + 'px');
					$(test1).css('left', left + 'px');
					check(same, true, '右下1pxが見えている状態', test1, fixture);
					$(test1).css('top', top + 1 + 'px');
					$(test1).css('left', left + 'px');
					check(same, false, '右下1pxが見えている状態から下に1px移動', test1, fixture);
					$(test1).css('top', top + 'px');
					$(test1).css('left', left + 1 + 'px');
					check(same, false, '右下1pxが見えている状態から右に1px移動', test1, fixture);

					// leftを左側に戻す
					left = -40;
					if (h5.env.ua.isFirefox && navigator.userAgent.indexOf('WebDriver') === -1) {
						left++;
					}
					$(test1).css('top', top + 'px');
					$(test1).css('left', left + 'px');
					check(same, true, '左下1pxが見えている状態', test1, fixture);
					$(test1).css('top', top + 1 + 'px');
					$(test1).css('left', left + 'px');
					check(same, false, '左下1pxが見えている状態から下に1px移動', test1, fixture);
					$(test1).css('top', top + 'px');
					$(test1).css('left', left - 1 + 'px');
					check(same, false, '左下1pxが見えている状態から右に1px移動', test1, fixture);

					start();
				}
				function waitForDom(i) {
					if ($(test1).offset()) {
						testFunc();
						return;
					}
					setTimeout(function() {
						waitForDom();
					}, 100);
				}
				waitForDom();
			});


	var originTop = $(window).scrollTop();
	var originLeft = $(window).scrollLeft();
	module(
			"isInView2",
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
					$('body').append(
							'<div id="enableScroll" style="width:1px;visible:hidden;height:1px; position:absolute; top:'
									+ $(window).height() + 1000 + 'px; width:' + $(window).width()
									+ 1000 + 'px;"></div>');
					// 一時的にスクロールバーを消す
					$('body').css('overflow', 'hidden');
					// 0,0にスクロールしてテスト
					$(window).scrollTop(0);
					$(window).scrollLeft(0);
				},
				teardown: function() {
					// テスト用に作った要素の削除
					$(test3).remove();
					$('#enableScroll').remove();
					// スクロールバーを元に戻す
					$('body').css('overflow', 'visible');
					$(window).scrollTop(originTop);
					$(window).scrollTop(originLeft);
				}
			});
	test(
			'h5.ui.isInView - 第二引数を省略したときに、可視範囲の内側に子のborderの外側が見えていればisInView()の結果がtrue、見えてない場合はfalseであること。',
			2 * 3 * 4 * 9,
			function() {
				function testFunc(scrollTop, scrollLeft) {
					// テスト実行中に$(test3)がなくなることがあるので、なければ作る。
					if (!$(test3).offset()) {
						$(test3).remove && $(test3).remove();
						$('body')
								.append(

										'<div id="'
												+ test3.substring(1)
												+ '" style="position:absolute; top:50px; left:50px; padding:5px; border:3px solid; width:20px; height:20px;"></div>');

					}
					var viewTop = scrollTop | 0;
					var viewLeft = scrollLeft | 0;

					if (h5.env.ua.isFirefox) {
						if (scrollTop) {
							viewTop++;
						}
						if (scrollLeft) {
							viewLeft++;
						}
					}

					var top,left;
					// 1 - 内側の要素のパディング(上下(左右)の合計) + 内側の要素のボーダー(上下(左右)の合計) + 内側の要素の高さ(幅))
					// viewTop(viewLeft)
					top = viewTop - 35;
					left = viewLeft - 35;
					// Firefoxだとずれるため、調整。
					if (h5.env.ua.isFirefox) {
						if (navigator.userAgent.indexOf('WebDriver') === -1) {
							top += 2;
							left += 2;
						}
						if (scrollTop) {
							top--;
						}
						if (scrollLeft) {
							left--;
						}
					}

					$(test3).css('top', top + 'px');
					$(test3).css('left', left + 'px');
					check(same, true, '左上1pxが見えている状態', test3);
					$(test3).css('top', top - 1 + 'px');
					$(test3).css('left', left + 'px');
					check(same, false, '左上1pxが見えている状態から上に1px移動', test3);
					$(test3).css('top', top + 'px');
					$(test3).css('left', left - 1 + 'px');
					check(same, false, '左上1pxが見えている状態から左に1px移動', test3);

					// window幅 - 1
					left = $(window).width() + viewLeft - 1;
					if (h5.env.ua.isFirefox && navigator.userAgent.indexOf('WebDriver') !== -1) {
						if (scrollLeft) {
							left--;
						}
					}
					$(test3).css('top', top + 'px');
					$(test3).css('left', left + 'px');
					check(same, true, '右上1pxが見えている状態', test3);
					$(test3).css('top', top - 1 + 'px');
					$(test3).css('left', left + 'px');
					check(same, false, '右上1pxが見えている状態から上に1px移動', test3);
					$(test3).css('top', top + 'px');
					$(test3).css('left', left + 1 + 'px');
					check(same, false, '右上1pxが見えている状態から右に1px移動', test3);

					// windowの高さ - 1
					top = $(window).height() + viewTop - 1;
					if (h5.env.ua.isFirefox && navigator.userAgent.indexOf('WebDriver') !== -1) {
						if (scrollTop) {
							top--;
						}
					}
					$(test3).css('top', top + 'px');
					$(test3).css('left', left + 'px');
					check(same, true, '右下1pxが見えている状態', test3);
					$(test3).css('top', top + 1 + 'px');
					$(test3).css('left', left + 'px');
					check(same, false, '右下1pxが見えている状態から下に1px移動', test3);
					$(test3).css('top', top + 'px');
					$(test3).css('left', left + 1 + 'px');
					check(same, false, '右下1pxが見えている状態から右に1px移動', test3);

					// leftを左側に戻す
					left = viewLeft - 35;

					// Firefoxだとずれるため、調整。
					if (h5.env.ua.isFirefox) {
						if (navigator.userAgent.indexOf('WebDriver') === -1) {
							left += 2;
						}
						if (scrollLeft) {
							left--;
						}
					}
					$(test3).css('top', top + 'px');
					$(test3).css('left', left + 'px');
					check(same, true, '左下1pxが見えている状態', test3);
					$(test3).css('top', top + 1 + 'px');
					$(test3).css('left', left + 'px');
					check(same, false, '左下1pxが見えている状態から下に1px移動', test3);
					$(test3).css('top', top + 'px');
					$(test3).css('left', left - 1 + 'px');
					check(same, false, '左下1pxが見えている状態から右に1px移動', test3);

					if (!(scrollTop && scrollLeft)) {
						$(window).scrollTop(100);
						$(window).scrollLeft(100);
					} else {
						return;
					}
					// 100, 100にスクロールされた状態でテスト
					testFunc(100, 100);

				}
				testFunc();
			});

	module('scrollToTop', {

		setup: function() {
			originTop = $(window).scrollTop();
			originLeft = $(window).scrollLeft();
			// スクロールできるようにするための要素を追加
			$('body').append(
					'<div id="enableScroll" style="width:1px;visible:hidden;height:1px; position:absolute; top:'
							+ $(window).height() + 1000 + 'px; width:' + $(window).width() + 1000
							+ 'px;"></div>');
		},
		teardown: function() {
			// テスト用に作った要素の削除
			$('#enableScroll').remove();
			// スクロールバーを元に戻す
			$(window).scrollTop(originTop);
			$(window).scrollTop(originLeft);
		}
	});
	test('h5.ui.scrollToTop', 1, function() {
		// 100,100にスクロール
		$(window).scrollTop(100);
		$(window).scrollLeft(100);
		// scrollToTopで(0,1)にスクロール
		h5.ui.scrollToTop();
		var count = 0;
		function waitForScroll() {
			if ($(window).scrollTop() === 1 && $(window).scrollLeft() === 0) {
				ok(true, '(0,1)にスクロールされた');
				return;
			} else if (count++ === 3) {
				ok(false, 'スクロールされませんでした。');
				return;
			}
			setTimeout(waitForScroll, 300);
		}
		waitForScroll();
	});
});
