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

(function() {
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
	var ERR = ERRCODE.h5.core.view;

	var noCache = $.isEmptyObject(h5.core.view.__cachedTemplates);

	var validTemplate1 = '<div>view1 test.</div>';
	var validView1 = "<script type='text/ejs' id='view1'>" + validTemplate1 + '</script>';
	// template.

	var validTemplate2 = '<table><tbody><tr><td>AAAAAAAAAAAA</td><td>BBBBBBBBBBBB</td></tr></tbody></table>';
	var validView2 = '<script type="text/ejs" id="view2">' + validTemplate2 + '</script>';
	// template.

	var validTemplate3 = '<table><tbody><tr><td>[%= val1 %]</td><td>[%= val2 %]</td></tr></tbody></table>';
	var validView3 = '<script type="text/ejs" id="view3">' + validTemplate3 + '</script>';
	// template.
	var validTemplate3Result = '<table><tbody><tr><td>AA</td><td>BB</td></tr></tbody></table>';

	// template.
	var validTemplate3Result2 = '<table><tbody><tr><td>&lt;div&gt;div&amp;nbsp;&lt;/div&gt;</td><td>&lt;&gt;&amp;&apos;&quot;</td></tr></tbody></table>';

	// template.
	var validView4 = '<script type="text/ejs" id="inscript"><script src="data/sample2.js"></script></script>';

	var invalidTemplate1 = '<div>view3 test.</div>';
	var invalidView1 = '<script type="text/ejs">' + invalidTemplate1 + '</script>';

	var invalidTemplate2 = '[%= for(var i = 0; i < 10; i++){} %]';
	var invalidTemplate3 = '<div>[% vaar hoge %]</div>';

	var preparedHtml = '<div>TEST</div>';

	// window.com.htmlhifiveがない場合は作成して、window.com.htmlhifive.testに空オブジェクトを入れる
	((window.com = window.com || {}).htmlhifive = window.com.htmlhifive || {}).test = {};

	$('head').append(validView1).append(validView2).append(validView3).append(validView4).append(
			invalidView1);

	//=============================
	// Functions
	//=============================

	// load()で読み込まれたテンプレートを全て削除する
	function clearCachedTemplate() {
		var cache = h5.core.view.__cachedTemplates;
		for ( var prop in cache) {
			if (prop === "view1" || prop === 'view2' || prop === 'view3' || prop === 'inscript') {
				continue;
			}
			delete cache[prop];
		}
	}

	// DOMに追加したテンプレート文字列を比較する
	function assertElement(base, actual) {
		var aElem = null,bElem = null;

		var func = function($a, $b) {
			if ($a.length !== $b.length) {
				$dummyA = $('<div></div>').append($a);
				$dummyB = $('<div></div>').append($b);
				ok(false, '要素のサイズが一致していません。' + $dummyA.html() + " : " + $dummyB.html());
				return;
			}

			if ($a.children().length > 0) {
				func($a.children(), $b.children());
			} else {
				for ( var i = 0; i < $a.length; i++) {
					aElem = $($a[i]);
					bElem = $($b[i]);

					var aText = aElem.text();
					if (aText) {
						strictEqual(bElem.text(), aText, '要素のテキストが一致すること。');
					}
				}
			}

			for ( var j = 0; j < $a.length; j++) {
				aElem = $($a[j]);
				bElem = $($b[j]);

				var aId = aElem[0].id;
				if (aId) {
					strictEqual(bElem[0].id, aId, '要素のidが一致すること。');
				}

				var aTagName = aElem[0].nodeName;
				if (aTagName) {
					strictEqual(bElem[0].nodeName, aTagName, '要素のタグ名が一致すること。');
				}

				var aName = aElem[0].name;
				if (aName) {
					strictEqual(bElem[0].name, aName, '要素のnameが一致すること。');
				}

				var aSrc = aElem[0].src;
				if (aSrc) {
					strictEqual(bElem[0].src, aSrc, '要素のsrcが一致すること。');
				}
			}
		};
		func($(actual), $(base));
	}

	$(function() {
		// =========================================================================
		//
		// Test Module
		//
		// =========================================================================

		//=============================
		// Definition
		//=============================

		module('View1', {
			setup: function() {
				$('#qunit-fixture').html('');
			}
		});

		//=============================
		// Body
		//=============================

		test('h5.core.view 初期状態', 1, function() {
			strictEqual(noCache, true, 'テンプレートが1件もキャッシュされていないこと。');
		});

		test('load()に文字列または中身のある配列以外、空文字、空白文字を渡したときに例外が発生すること。', 10, function() {
			var view = h5.core.view.createView();
			var invalidErrorCode = ERR.ERR_CODE_INVALID_FILE_PATH;
			try {
				view.load();
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, invalidErrorCode, e.message);
			}
			try {
				view.load(null);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, invalidErrorCode, e.message);
			}
			try {
				view.load([]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, invalidErrorCode, e.message);
			}
			try {
				view.load(1);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, invalidErrorCode, e.message);
			}
			try {
				view.load({});
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, invalidErrorCode, e.message);
			}
			try {
				view.load('');
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, invalidErrorCode, e.message);
			}
			try {
				view.load(' ');
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, invalidErrorCode, e.message);
			}
			try {
				view.load(['']);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, invalidErrorCode, e.message);
			}
			try {
				view.load(['./template/test1.ejs', ' ']);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, invalidErrorCode, e.message);
			}
			try {
				view.load(['./template/test1.ejs', 1]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, invalidErrorCode, e.message);
			}
		});

		//=============================
		// Definition
		//=============================

		module('View2', {
			setup: function() {
				$('#qunit-fixture').html('');
			},
			teardown: function() {
				clearCachedTemplate();
			}
		});

		//=============================
		// Body
		//=============================

		test('画面に書かれた、scriptタグが含まれているテンプレートをロードする。', function() {
			var template = h5.core.view.get('inscript');
			strictEqual(window.com.htmlhifive.test.sample2loaded, undefined,
					'sample2.jsはロードされていないこと。');

			$('#qunit-fixture').html(template);
			strictEqual(window.com.htmlhifive.test.sample2loaded, 'sample2.js is loaded.',
					'DOMツリーに追加した時にsample2.jsがロードされること。');
			window.com.htmlhifive.test.sample2loaded = undefined;
			$('#inscript').remove();
		});

		asyncTest('ejsファイルに書かれた、scriptタグが含まれているテンプレートをロードする。', 2, function() {
			h5.core.view.load('template/test10.ejs').done(
					function() {
						var template = h5.core.view.get('test10-1');
						strictEqual(window.com.htmlhifive.test.sample3loaded, undefined,
								'sample3.jsはロードされていないこと。');

						$('#qunit-fixture').html(template);
						strictEqual(window.com.htmlhifive.test.sample3loaded,
								'sample3.js is loaded.', 'DOMツリーに追加した時にsample3.jsがロードされること。');
						h5.core.view.clear('test10-1');
						window.com.htmlhifive.test.sample3loaded = undefined;
						start();
					}).fail(function(e) {
				ok(false, e.message);
				start();
			});
		});

		// asyncTest('ejsファイルに書かれた、imgタグが含まれているテンプレートをロードする。', function() {
		// h5.core.view.load('template/test10.ejs').done(function() {
		// var template = h5.core.view.get('test10-2');
		// strictEqual(window.imgerr, undefined, 'sample2.jsはロードされていないこと。');
		//
		// $('#qunit-fixture')[0].innerHTML = template;
		// strictEqual(window.imgerr, 'imgの読み込みに失敗。', 'DOMツリーに追加した時にimgタグのonerrorイベントが発生すること。');
		// h5.core.view.clear('test10-1');
		// window.com.htmlhifive.test.sample2loaded = undefined;
		// start();
		// }).fail(function(e){
		// ok(false, e.message);
		// start();
		// });
		// });


		asyncTest('load() ロードが成功した時に、テンプレートファイルの絶対パスとファイルが持つテンプレートIDを取得できること', 6, function() {
			var view = h5.core.view.createView();
			// 強制的に読み込ませるため、パラメータを付加
			var param = +new Date();
			var p = view.load(['./template/test8.ejs?' + param, './template/test4.ejs?' + param]);
			p.done(
					function(result) {
						for ( var i = 0, l = result.length; i < l; i++) {
							var obj = result[i];
							if (obj.path === './template/test8.ejs?' + param) {
								ok(true, 'pathが取得できること');
								ok(obj.absoluteUrl.search(/http:\/\//) === 0
										&& obj.absoluteUrl.search(/\/template\/test8\.ejs/) > 0,
										'絶対パスが取得できること(http://～～/template/test8.ejs?' + param
												+ '): ' + obj.absoluteUrl);
								deepEqual(obj.ids, ['template8'], 'テンプレートのidが取得できること');
							}
							if (obj.path === './template/test4.ejs?' + param) {
								ok(true, 'pathが取得できること');
								ok(obj.absoluteUrl.search(/http:\/\//) === 0
										&& obj.absoluteUrl.search(/\/template\/test4\.ejs/) > 0,
										'絶対パスが取得できること(http://～～/template/test4.ejs?' + param
												+ '): ' + obj.absoluteUrl);
								deepEqual(obj.ids.sort(), ['template4', 'template5'].sort(),
										'テンプレートのidが取得できること');
							}
						}
						start();
					}).fail(function(e) {
				ok(false, e.message);
				start();
			});
		});

		asyncTest('ヘルパー関数を使用してエスケープする。', 2, function() {
			var p = h5.core.view.load(['./template/test6.ejs']);

			p.done(function(result) {
				$('#qunit-fixture').html(h5.core.view.get('esc1'));
				strictEqual($('#qunit-fixture').html(), '&lt;div&gt;aaa&lt;/div&gt;');

				$('#qunit-fixture').html(h5.core.view.get('esc2', {
					_h: 'AA'
				}));
				strictEqual($('#qunit-fixture').html(), 'AA',
						'渡したパラメータに\'_h\'というパラメータがあれば、ヘルパー関数より優先される。');
				start();
			});
		});

		test('画面HTMLに書かれた、置換要素無しテンプレートを取得。', function() {
			$('#qunit-fixture').html(h5.core.view.get('view1'));
			assertElement($('#qunit-fixture').html(), validTemplate1);

			$('#qunit-fixture').html(h5.core.view.get('view2'));
			assertElement($('#qunit-fixture').html(), validTemplate2);
		});

		test('画面HTMLに書かれた、置換要素有りテンプレートを取得。view.get ', function() {
			$('#qunit-fixture').html(h5.core.view.get('view3', {
				val1: 'AA',
				val2: 'BB'
			}));
			assertElement($('#qunit-fixture').html(), validTemplate3Result);
		});

		test('画面HTMLに書かれた、置換要素有りテンプレートを取得。view.update ', function() {
			h5.core.view.update(document.getElementById('qunit-fixture'), 'view3', {
				val1: 'AA',
				val2: 'BB'
			});
			assertElement($('#qunit-fixture').html(), validTemplate3Result);

			//updateなのでfixture内をクリーンアップする必要はない

			h5.core.view.update($('#qunit-fixture'), 'view3', {
				val1: 'AA',
				val2: 'BB'
			});
			assertElement($('#qunit-fixture').html(), validTemplate3Result);

			h5.core.view.update('#qunit-fixture', 'view3', {
				val1: 'AA',
				val2: 'BB'
			});
			assertElement($('#qunit-fixture').html(), validTemplate3Result);
		});

		test('画面HTMLに書かれた、置換要素有りテンプレートを取得。view.prepend ', function() {
			$('#qunit-fixture').html(preparedHtml);

			h5.core.view.prepend(document.getElementById('qunit-fixture'), 'view3', {
				val1: 'AA',
				val2: 'BB'
			});
			assertElement($('#qunit-fixture').html(), validTemplate3Result + preparedHtml);

			$('#qunit-fixture').html(preparedHtml);

			h5.core.view.prepend($('#qunit-fixture'), 'view3', {
				val1: 'AA',
				val2: 'BB'
			});
			assertElement($('#qunit-fixture').html(), validTemplate3Result + preparedHtml);

			$('#qunit-fixture').html(preparedHtml);

			h5.core.view.prepend('#qunit-fixture', 'view3', {
				val1: 'AA',
				val2: 'BB'
			});
			assertElement($('#qunit-fixture').html(), validTemplate3Result + preparedHtml);
		});

		test('画面HTMLに書かれた、置換要素有りテンプレートを取得。view.append ', function() {
			$('#qunit-fixture').html(preparedHtml);

			h5.core.view.append(document.getElementById('qunit-fixture'), 'view3', {
				val1: 'AA',
				val2: 'BB'
			});
			assertElement($('#qunit-fixture').html(), preparedHtml + validTemplate3Result);

			$('#qunit-fixture').html(preparedHtml);

			h5.core.view.append($('#qunit-fixture'), 'view3', {
				val1: 'AA',
				val2: 'BB'
			});
			assertElement($('#qunit-fixture').html(), preparedHtml + validTemplate3Result);

			$('#qunit-fixture').html(preparedHtml);

			h5.core.view.append('#qunit-fixture', 'view3', {
				val1: 'AA',
				val2: 'BB'
			});
			assertElement($('#qunit-fixture').html(), preparedHtml + validTemplate3Result);
		});

		test('置換要素有りテンプレートで置換要素を指定しないで取得。', 1, function() {
			raises(function() {
				$('#qunit-fixture').html(h5.core.view.get('view3', {}));
			}, 'パラメータが必要なテンプレートに対して、パラメータを指定しなかったため例外が発生すること。');
		});

		asyncTest('EJSファイルに書かれた、scriptタグで囲まれていないテンプレートを取得。', 4, function() {
			var p = h5.core.view.load(['./template/test1.ejs']);
			p.fail(function(e) {
				if (isDevMode()) {
					ok(e.message, 'エラーからmessageプロパティが取得できること。' + e.message);
				} else {
					equal(e.message, null, 'リリース版にはエラーメッセージが格納されていないこと');
				}
				strictEqual(h5.core.view.isAvailable('test1'), false,
						'scriptタグで囲まれていないテンプレートはエラーとして処理されること。');
				equal(e.code, ERR.ERR_CODE_TEMPLATE_FILE_NO_SCRIPT_ELEMENT,
						'エラーからcodeプロパティが取得できること。:' + e.code);
				ok(!!e.detail.url, 'エラーからdetail.urlプロパティが取得できること。:' + e.detail.url);
				start();
			});
		});

		asyncTest(
				'EJSファイルに書かれた、scriptタグで囲まれているテンプレートを取得。',
				function() {
					var expected = '<table name="table1"><tbody><tr><td id="1">AAA</td><td id="2">BB</td><td id="3">CC</td><td id="4">DD</td><td id="5">EE</td></tr></tbody></table>\r\n<div><div>テストテスト</div></div>';
					var p = h5.core.view.load(['./template/test2.ejs']);

					p.done(function(result) {
						for ( var prop in h5.core.view.__cachedTemplates) {
							if (prop == 'template2') {
								strictEqual(prop, 'template2', 'scriptタグのidで指定した名前がキー名であること。');
								break;
							}
						}

						$('#qunit-fixture').html(h5.core.view.get('template2'));
						assertElement($('#qunit-fixture').html(), expected);
						start();
					});
				});

		asyncTest(
				'パラメータを置換したテンプレートを取得。 ',
				function() {
					var expected = '<table><tbody><tr><td>hoge1</td><td>hoge2</td><td>hoge3</td></tr></tbody></table>';

					var p = h5.core.view.load(['./template/test3.ejs']);
					p.done(function(result) {
						var params = {
							ar: ['hoge1', 'hoge2', 'hoge3']
						};
						$('#qunit-fixture').html(h5.core.view.get('template3', params));
						assertElement($('#qunit-fixture').html(), expected);
						start();
					});
				});

		asyncTest(
				'EJSファイルに書かれた、1ファイル複数テンプレートを取得。',
				function() {
					var expected1 = '<table name="table1"><tbody><tr><td id="1"></td><td id="2">BB</td><td id="3">VV</td><td id="4">DD</td><td id="5">EE</td></tr></tbody></table>\r\n<div><div>テストテスト</div></div>';
					var expected2 = '<table name="table2"><tbody><tr><td id="6">11</td><td id="7">22</td><td id="8">33</td><td id="9">44</td><td id="10">55</td></tr></tbody></table>\r\n<div><div>てすとてすと</div></div>';
					var p = h5.core.view.load(['./template/test4.ejs']);

					p.done(function(result) {
						var prop = null;

						for (prop in h5.core.view.__cachedTemplates) {
							if (prop == 'template4') {
								strictEqual(prop, 'template4', 'scriptタグのidで指定した名前がキー名であること。');
								break;
							}
						}

						$('#qunit-fixture').html(h5.core.view.get('template4', {
							src: "http://www.google.co.jp/images/srpr/logo3w.png"
						}));
						var tmp = $('<img/>');
						tmp.prop('src', 'http://www.google.co.jp/images/srpr/logo3w.png');

						expected1 = $(expected1);
						expected1.find('#1').append(tmp);
						assertElement($('#qunit-fixture').html(), expected1);

						for (prop in h5.core.view.__cachedTemplates) {
							if (prop == 'template5') {
								strictEqual(prop, 'template5', 'scriptタグのidで指定した名前がキー名であること。');
								break;
							}
						}

						$('#qunit-fixture').html(h5.core.view.get('template5'));
						assertElement($('#qunit-fixture').html(), expected2);
						start();
					});
				});

		asyncTest('load() 構文エラーのテンプレートファイルを取得', 5, function() {
			var p = h5.core.view.load(['./template/test5.ejs']);
			p.fail(function(e) {
				equal(e.code, ERR.ERR_CODE_TEMPLATE_COMPILE_SYNTAX_ERR, 'エラーコード: ' + e.code);
				ok(e.message, 'エラーメッセージ：' + e.message);
				ok(e.detail.url.search(/http:\/\//) === 0
						&& e.detail.url.search(/\/template\/test5\.ejs$/),
						'エラーの起きたテンプレートファイルのURLが取得できる。：' + e.detail.url);
				strictEqual(e.detail.path, './template/test5.ejs', 'エラーの起きたテンプレートファイルのパスが取得できる');
				strictEqual(e.detail.id, 'template5');
				start();
			});
		});

		asyncTest('load() テンプレートIDが空文字または空白である場合エラーが発生すること。', 2, function() {
			var errorCode = ERR.ERR_CODE_TEMPLATE_INVALID_ID;
			var view = h5.core.view.createView();
			view.load('template/test11.ejs').done(function() {
				ok(false, 'エラーが発生していません');
				start();
			}).fail(function(e) {
				deepEqual(e.code, errorCode, e.message);

				view.load('template/test12.ejs').done(function() {
					ok(false, 'エラーが発生していません');
					start();
				}).fail(function(error) {
					deepEqual(error.code, errorCode, error.message);
					start();
				});
			});
		});

		asyncTest(
				'存在しないテンプレートを読み込む。出力されるログも確認する ※要目視確認',
				20,
				function() {
					var errCode = ERR.ERR_CODE_TEMPLATE_AJAX;
					var p = h5.core.view.load(['./template/hogehoge.ejs']);
					p
							.fail(function(e) {
								strictEqual(e.code, errCode, 'エラーコード: ' + e.code);
								strictEqual(e.detail.error.status, 404,
										'エラーオブジェクトにAjaxエラーのオブジェクトが格納されていて、ステータスコード404が取得できる。');
								ok(e.detail.url.match(/^http:\/\/.*\/template\/hogehoge\.ejs$/),
										'エラーの起きたテンプレートファイルのURLが取得できる。：' + e.detail.url);
								strictEqual(e.detail.path, './template/hogehoge.ejs',
										'エラーの起きたテンプレートファイルのパスが取得できる');
								ok(
										true,
										'※要目視確認：WARNレベルで次のようにログが出力されていることを確認してください。'
												+ '『[WARN]10:49:26,38: テンプレートファイルを取得できませんでした。ステータスコード:404 URL:http://localhost:8080/hifive/test/template/hogehoge.ejs 』');

								h5.core.view
										.load('./template/hogehoge.ejs')
										.fail(
												function(e) {
													ok(true,
															'一度ロードしようとした存在しないURLにもう一度アクセスした時、もう一度アクセスを試みること。');
													equal(e.code, ERR.ERR_CODE_TEMPLATE_AJAX,
															'エラーコード: ' + e.code);
													strictEqual(e.detail.error.status, 404,
															'エラーオブジェクトにAjaxエラーのオブジェクトが格納されていて、ステータスコード404が取得できる。');
													ok(
															e.detail.url.search(/http:\/\//) === 0
																	&& e.detail.url
																			.search(/\/template\/hogehoge\.ejs$/),
															'エラーの起きたテンプレートファイルのURLが取得できる。：'
																	+ e.detail.url);
													strictEqual(e.detail.path,
															'./template/hogehoge.ejs',
															'エラーの起きたテンプレートファイルのパスが取得できる');
													ok(
															true,
															'※要目視確認：WARNレベルで次のようにログが出力されていることを確認してください。'
																	+ '『[WARN]10:49:26,38: テンプレートファイルを取得できませんでした。ステータスコード:404 URL:http://localhost:8080/hifive/test/template/hogehoge.ejs 』');

													var propCount = 0;
													for ( var prop in h5.core.view.__cachedTemplates) {
														ok(prop, prop);
														propCount++;
													}

													strictEqual(propCount, 4,
															'画面HTMLに書かれているテンプレートの件数、3件と一致すること');

													strictEqual(h5.core.view.isAvailable('view1'),
															true);
													strictEqual(h5.core.view.isAvailable('view2'),
															true);
													strictEqual(h5.core.view.isAvailable('view3'),
															true);
													strictEqual(h5.core.view
															.isAvailable('inscript'), true);

													start();

												}).done(function() {
											ok(false, 'テスト失敗。存在しないURLなのにdoneコールバックが実行された');
											start();
										});
							});
				});


		asyncTest('中身が空のテンプレートファイルを読み込む。出力されるログも確認する ※要目視確認', 4, function() {
			var errCode = ERR.ERR_CODE_TEMPLATE_FILE;
			var p = h5.core.view.load(['./template/test14.ejs']);
			p.fail(function(e) {
				strictEqual(e.code, errCode, 'エラーコード: ' + e.code);
				ok(e.detail.url.match(/^http:\/\/.*\/template\/test14\.ejs$/),
						'エラーの起きたテンプレートファイルのURLが取得できる。：' + e.detail.url);
				strictEqual(e.detail.path, './template/test14.ejs', 'エラーの起きたテンプレートファイルのパスが取得できる');
				ok(true, '※要目視確認：WARNレベルで次のようにログが出力されていることを確認してください。'
						+ '『[WARN]11:29:59,835: テンプレートファイルが不正です。null』');

				start();
			});
		});

		test('get() 存在しないテンプレートIDを指定してテンプレート取得。', function() {
			try {
				h5.core.view.get('aaa');
				ok(false, '例外は発生しませんでした。');
			} catch (e) {
				ok(true, '存在しないテンプレートIDでgetしたので例外が発生すること。');
			}
		});

		test('get() 引数を指定せずに呼び出し。', function() {
			try {
				h5.core.view.get();
				ok(false, '例外は発生しませんでした。');
			} catch (e) {
				ok(true, 'テンプレートIDを指定しなかったので例外が発生すること。');
			}
		});

		test('get() idの指定が不正である時に例外が発生すること。', 7, function() {
			var templateId = 'id1';
			var templateIdErrorCode = ERR.ERR_CODE_TEMPLATE_INVALID_ID;
			var view = h5.core.view;
			try {
				view.get('');
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.get(' ');
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.get([]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.get({});
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.get(0);
				ok(true, view.get(0), {});
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.get(/a/);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.get(new String(templateId));
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
		});

		asyncTest('コメントが存在するテンプレートをロード。', 2, function() {
			var expected = '<div>TEST TEST</div>';

			var p = h5.core.view.load(['./template/test7.ejs']);

			p.done(function(result) {
				$('#qunit-fixture').html(h5.core.view.get('hoge1'));
				assertElement($('#qunit-fixture').html(), expected);
				start();
			}).fail(function(e) {
				ok(false, e.message);
				start();
			});
		});

		asyncTest('isAvailable() ロードしたテンプレートIDがキャッシュに存在することを確認。', 8, function() {
			var loadedIds = ['template2', 'template3', 'template4', 'template5'];
			var view = h5.core.view.createView();
			for ( var i = 0, l = loadedIds.length; i < l; i++) {
				var id = loadedIds[i];
				ok(!view.isAvailable(id), 'テンプレートをロードする前はisAvailable(id)の結果がfalseであること。');
			}
			var p = view.load(['./template/test2.ejs', './template/test3.ejs',
					'./template/test4.ejs']);
			p.done(function(result) {
				for ( var i = 0, l = loadedIds.length; i < l; i++) {
					var id = loadedIds[i];
					ok(view.isAvailable(id), 'テンプレートをロードした後はisAvailable(id)の結果がtrueであること。');
				}
				start();
			});
		});

		asyncTest('clear() テンプレートをキャッシュから全て削除。', 8, function() {
			var loadedIds = ['template2', 'template3', 'template4', 'template5'];
			var view = h5.core.view.createView();
			var p = view.load(['./template/test2.ejs', './template/test3.ejs',
					'./template/test4.ejs']);

			p.done(function(result) {
				for ( var i = 0, l = loadedIds.length; i < l; i++) {
					var id = loadedIds[i];
					ok(view.isAvailable(id), 'テンプレートを削除する前はisAvailable(id)の結果がtrueであること。');
				}
				view.clear();
				for ( var i = 0, l = loadedIds.length; i < l; i++) {
					var id = loadedIds[i];
					ok(!view.isAvailable(id), 'テンプレートを削除した後はisAvailable(id)の結果がfalseであること。');
					try {
						view.get(id);
					} catch (e) {
						ok(true, '削除したテンプレートに対してgetView()を行うと例外が発生すること。' + e.message);
					}
				}
				start();
			});
		});

		asyncTest('clear() テンプレートIDを指定してキャッシュからテンプレート削除。', 12, function() {
			var loadedIds = ['template2', 'template3', 'template4', 'template5'];
			var deletedIds = ['template2', 'template3', 'template4'];
			var existIds = ['template5'];
			var view = h5.core.view.createView();
			var p = view.load(['./template/test2.ejs', './template/test3.ejs',
					'./template/test4.ejs']);

			p.done(function(result) {
				for ( var i = 0, l = loadedIds.length; i < l; i++) {
					var id = loadedIds[i];
					ok(view.isAvailable(id), 'テンプレートを削除する前はisAvailable(id)の結果がtrueであること。');
				}
				view.clear('template2');
				view.clear(['template3', 'template4']);
				for ( var i = 0, l = deletedIds.length; i < l; i++) {
					var id = deletedIds[i];
					ok(!view.isAvailable(id), 'テンプレートを削除した後はisAvailable(id)の結果がfalseであること。' + id);
					try {
						view.get(id);
					} catch (e) {
						ok(true, '削除したテンプレートに対してgetView()を行うと例外が発生すること。：' + e.message);
					}
				}
				for ( var i = 0, l = existIds.length; i < l; i++) {
					var id = existIds[i];
					ok(view.isAvailable(id), '削除されていないテンプレートはisAvailable(id)の結果がfalseであること。' + id);
					try {
						view.get(id);
						ok(true, '削除されていないテンプレートIDに対してgetView()できること。');
					} catch (e) {
						ok(false, '例外が発生しました。：' + e.message);
					}
				}
				start();
			});
		});

		test('clear() idの指定が不正である時に例外が発生すること。', 7, function() {
			var templateId = 'id1';
			var templateIdErrorCode = ERR.ERR_CODE_TEMPLATE_INVALID_ID;
			var view = h5.core.view;
			try {
				view.clear('');
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.clear(' ');
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.clear([]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.clear({});
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.clear(0);
				ok(true, view.clear(0), {});
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.clear(/a/);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.clear(new String(templateId));
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
		});


		test('clear() idを配列で指定し、その中に不正な要素がある時に例外が発生し、テンプレートの削除は行われないこと。', 30, function() {
			var templateId = 'id1';
			var templateIdErrorCode = ERR.ERR_CODE_TEMPLATE_INVALID_ID;
			var view = h5.core.view;
			view.register(templateId, 'ok');
			try {
				view.clear([templateId, '']);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
				ok(view.isAvailable(templateId), 'テンプレートが削除されていないこと。');
				deepEqual(view.get(templateId), 'ok', '登録されたテンプレートを取得できること。');
			}
			try {
				view.clear([templateId, ' ']);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
				ok(view.isAvailable(templateId), 'テンプレートが削除されていないこと。');
				deepEqual(view.get(templateId), 'ok', '登録されたテンプレートを取得できること。');
			}
			try {
				view.clear([templateId, undefined]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
				ok(view.isAvailable(templateId), 'テンプレートが削除されていないこと。');
				deepEqual(view.get(templateId), 'ok', '登録されたテンプレートを取得できること。');
			}
			try {
				view.clear([templateId, null]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
				ok(view.isAvailable(templateId), 'テンプレートが削除されていないこと。');
				deepEqual(view.get(templateId), 'ok', '登録されたテンプレートを取得できること。');
			}
			try {
				view.clear([templateId, {}]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
				ok(view.isAvailable(templateId), 'テンプレートが削除されていないこと。');
				deepEqual(view.get(templateId), 'ok', '登録されたテンプレートを取得できること。');
			}
			try {
				view.clear([templateId, []]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
				ok(view.isAvailable(templateId), 'テンプレートが削除されていないこと。');
				deepEqual(view.get(templateId), 'ok', '登録されたテンプレートを取得できること。');
			}
			try {
				view.clear([templateId, 1]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
				ok(view.isAvailable(templateId), 'テンプレートが削除されていないこと。');
				deepEqual(view.get(templateId), 'ok', '登録されたテンプレートを取得できること。');
			}
			try {
				view.clear([templateId, true]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
				ok(view.isAvailable(templateId), 'テンプレートが削除されていないこと。');
				deepEqual(view.get(templateId), 'ok', '登録されたテンプレートを取得できること。');
			}
			try {
				view.clear([templateId, false]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
				ok(view.isAvailable(templateId), 'テンプレートが削除されていないこと。');
				deepEqual(view.get(templateId), 'ok', '登録されたテンプレートを取得できること。');
			}
			try {
				view.clear([new String(templateId)]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
				ok(view.isAvailable(templateId), 'テンプレートが削除されていないこと。');
				deepEqual(view.get(templateId), 'ok', '登録されたテンプレートを取得できること。');
			}
		});

		test(
				'clear() 登録されていないテンプレートIDを指定した時に、WARNレベルでログが出力されること ※要目視確認',
				3,
				function() {
					var templateId = 'id1';
					var view = h5.core.view;
					view.register(templateId, 'ok');
					view.clear('id2');
					view.clear(['id3', templateId]);
					ok(!view.isAvailable(templateId),
							'登録されていないIDを含む配列を指定しても、エラーが発生せず、その他のテンプレートは削除されること。');
					ok(true,
							'ログに『[WARN]13:53:37,960: 指定されたIDのテンプレートは登録されていません。"id2" 』と出力されていること ※要目視確認');
					ok(true,
							'ログに『[WARN]13:53:37,960: 指定されたIDのテンプレートは登録されていません。"id3" 』と出力されていること ※要目視確認');
				});

		asyncTest('viewのインスタンスが違うなら利用可能なテンプレートも違うこと。', 4, function() {
			var view1Id = 'template2';
			var view2Id = 'template3';
			var view1 = h5.core.view.createView();
			var view2 = h5.core.view.createView();
			var p1 = view1.load('./template/test2.ejs');
			var p2 = view2.load('./template/test3.ejs');

			p1.done(function(result) {
				ok(view1.isAvailable(view1Id), 'ロードしたテンプレートが使用可能なこと。');
				ok(!view1.isAvailable(view2Id), 'ロードしていないテンプレートが使用不可なこと。');
			});
			p2.done(function(result) {
				ok(view2.isAvailable(view2Id), 'ロードしたテンプレートが使用可能なこと。');
				ok(!view2.isAvailable(view1Id), 'ロードしていないテンプレートが使用不可なこと。');
				start();
			});
		});

		test('register() テンプレートを登録できること。', 2, function() {
			var templateId = 'id1';
			h5.core.view.register(templateId, validTemplate3);
			h5.core.view.register('id2', '');
			ok(h5.core.view.isAvailable(templateId), 'registerで登録したテンプレートが利用可能になること。');
			strictEqual(h5.core.view.get(templateId, {
				val1: 'AA',
				val2: 'BB'
			}), validTemplate3Result);
		});

		test('register() 置換要素有りテンプレートを登録。[%= %]内はデフォルトでHTMLエスケープされること。 view.get ', function() {
			var view = h5.core.view.createView();
			view.register('v1', validTemplate3);
			$('#qunit-fixture').html(view.get('v1', {
				val1: '<div>div&nbsp;</div>',
				val2: '<>&\'"'
			}));
			assertElement($('#qunit-fixture').html(), validTemplate3Result2);
		});

		test('register() 置換要素有りテンプレートを登録。渡したオブジェクトが変化しないこと。view.get ', function() {
			var obj = {
				val1: 'AA',
				val2: 'BB',
				inner: {
					val: 'CC'
				}
			};
			var obj_clone = {
				val1: 'AA',
				val2: 'BB',
				inner: {
					val: 'CC'
				}
			};
			var view = h5.core.view.createView();
			view.register('v1', '[% val1 = 1; val2 = 2; inner.val = 3;%]');
			view.get('v1', obj);
			deepEqual(obj, obj_clone, 'view.getに渡したオブジェクトが変化しない。');
		});

		test('[%:= %]内はエスケープされないこと。', 1, function() {
			var view = h5.core.view.createView();
			view.register('v1', 'エスケープあり[%= str %]\tエスケープなし[%:= str %]');
			strictEqual(view.get('v1', {
				str: '<div>div&nbsp;</div>'
			}), 'エスケープあり&lt;div&gt;div&amp;nbsp;&lt;/div&gt;\tエスケープなし<div>div&nbsp;</div>');
		});

		test('register()で、idの指定が不正である時に例外が発生すること。', 7, function() {
			var templateId = 'id1';
			var templateIdErrorCode = ERR.ERR_CODE_TEMPLATE_INVALID_ID;
			var view = h5.core.view.createView();
			try {
				view.register('', validTemplate1);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.register(' ', validTemplate1);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.register([], validTemplate1);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.register({}, validTemplate1);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.register(0, validTemplate1);
				ok(true, view.get(0), {});
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.register(/a/, validTemplate1);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
			try {
				view.register(new String(templateId), validTemplate1);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateIdErrorCode, e.message);
			}
		});

		test('register()で、idを指定していない時または、テンプレート文字列に文字列でないものを指定した時に例外が発生すること。', 4, function() {
			var templateId = 'id1';
			var templateStringErrorCode = ERR.ERR_CODE_TEMPLATE_COMPILE_NOT_STRING;

			try {
				h5.core.view.register(templateId);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateStringErrorCode, e.message);
			}
			try {
				h5.core.view.register(templateId, 1);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateStringErrorCode, e.message);
			}
			try {
				h5.core.view.register(templateId, ['']);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateStringErrorCode, e.message);
			}
			try {
				h5.core.view.register(templateId, {});
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, templateStringErrorCode, e.message);
			}
		});

		test('register() テンプレート文字列が不正な時にエラーが発生すること。', 1, function() {
			var templateId = 'id1';
			var errorCode = ERR.ERR_CODE_TEMPLATE_COMPILE_SYNTAX_ERR;
			try {
				h5.core.view.register(templateId, '[%= [%= %]');
				ok(false, 'エラーが発生していません');
			} catch (e) {
				deepEqual(e.code, errorCode, e.message);
			}
		});

		test('isValid()でテンプレート文字列がコンパイルできるかどうか調べられること。', 3, function() {
			ok(h5.core.view.isValid(validTemplate3), validTemplate3 + ' true');
			ok(!h5.core.view.isValid(invalidTemplate2), invalidTemplate2 + ' false');
			ok(!h5.core.view.isValid(invalidTemplate3), invalidTemplate3 + ' false');
		});

		asyncTest('view.load() 複数のテンプレートファイルを読み込んだ時に、一つでもエラーがあれば読み込みを中止し、全てのテンプレートがロードされないこと。', 4,
				function() {
					var view = h5.core.view;
					var p = view.load(['./template/test2.ejs', './template/test3.ejs',
							'./template/test4.ejs', './template/test5.ejs']);

					p.done(function() {
						ok(false, '読み込みに成功しました。');
						start();
					}).fail(
							function(error) {
								strictEqual(error.detail.path, './template/test5.ejs',
										'./template/test5.ejs の読み込みでエラーが発生すること。');
								ok(!view.isAvailable('template2'),
										'エラーの発生していないテンプレートも使用不可であること。template2');
								ok(!view.isAvailable('template3'),
										'エラーの発生していないテンプレートも使用不可であること。template3');
								ok(!view.isAvailable('template4'),
										'エラーの発生していないテンプレートも使用不可であること。template4');
								start();
							});
				});

		asyncTest('getAvailableTemplates() viewインスタンスで利用可能なテンプレートIDを配列で取得できること。', 3, function() {
			deepEqual(h5.core.view.getAvailableTemplates().sort(), ['view1', 'view2', 'view3',
					'inscript'].sort(), '画面HTMLに書かれたテンプレートIDが取得できること');
			h5.core.view.load(['./template/test2.ejs', './template/test3.ejs']).done(
					function() {
						deepEqual(h5.core.view.getAvailableTemplates().sort(), ['view1', 'view2',
								'view3', 'inscript', 'template2', 'template3'].sort(),
								'画面HTMLに書かれたテンプレートIDとロードしたテンプレートのIDが取得できること');
						h5.core.view.clear('template2');
						deepEqual(h5.core.view.getAvailableTemplates().sort(), ['view1', 'view2',
								'view3', 'inscript', 'template3'].sort(),
								'clear()で削除したテンプレートIDが利用可能でないこと。');
						start();
					});
		});

		module('View3', {
			setup: function() {
				$('#qunit-fixture').html('');
				if (!h5.dev) {
					return;
				}
				h5.dev.core.view.cacheManager.cache = {};
				h5.dev.core.view.cacheManager.cacheUrls = [];
			},
			teardown: function() {
				clearCachedTemplate();
			}
		});

		asyncTest('[build#min]cacheManager 取得したテンプレートのURLがキャッシュされていて、その情報が取得できること', 10, function() {
			var cacheManager = h5.dev.core.view.cacheManager;
			var view1 = h5.core.view.createView();
			var view2 = h5.core.view.createView();
			var p1 = view1.load(['./template/test2.ejs', './template/test3.ejs']);
			view2.load('./template/test4.ejs');
			p1.done(function() {
				// view2のダウンロードが終わるまで100ms待つ
				setTimeout(function() {
					var cacheInfo = cacheManager.getCacheInfo();
					for ( var i = 0; i < cacheInfo.length; i++) {
						var cache = cacheInfo[i];
						var path = cache.path;
						if (path === "./template/test2.ejs") {
							deepEqual(cache.path, './template/test2.ejs', '相対パス(指定したパス)が取得できる - '
									+ path);
							ok(cache.absoluteUrl.match(/http.*\/template\/test2\.ejs/),
									'URLが取得できる - ' + cache.absoluteUrl);
							for ( var j = 0; j < cache.ids.length; j++) {
								var id = cache.ids[j];
								if (id === 'template2') {
									ok(true, 'テンプレートのIDが取得できる - ' + path + ', id:' + id);
								}
							}
						} else if (path === "./template/test3.ejs") {
							deepEqual(cache.path, './template/test3.ejs', 'キャッシュ' + path);
							ok(cache.absoluteUrl.match(/http.*\/template\/test3\.ejs/),
									'URLが取得できる - ' + cache.absoluteUrl);
							for ( var j = 0; j < cache.ids.length; j++) {
								var id = cache.ids[j];
								if (id === 'template3') {
									ok(true, 'テンプレートのIDが取得できる - ' + path + ', id:' + id);
								}
							}
						} else if (path === "./template/test4.ejs") {
							deepEqual(cache.path, './template/test4.ejs', 'キャッシュ' + path);
							ok(cache.absoluteUrl.match(/http.*\/template\/test4\.ejs/),
									'URLが取得できる - ' + cache.absoluteUrl);
							for ( var j = 0; j < cache.ids.length; j++) {
								var id = cache.ids[j];
								if (id === 'template4') {
									ok(true, 'テンプレートのIDが取得できる - ' + path + ', id:' + id);
								} else if (id === 'template5') {
									ok(true, 'テンプレートのIDが取得できる - ' + path + ', id:' + id);
								}
							}
						}
					}
					start();
				}, 100);
			});
		});

		asyncTest(
				'[build#min]getAvailableTemplates() LRUでキャッシュされていること。※h5.dev.core.view.cacheManagerがない場合',
				20, function() {
					var cacheManager = h5.dev.core.view.cacheManager;
					var view1 = h5.core.view.createView();
					var view2 = h5.core.view.createView();
					var array1 = ['./template/test_cache1.ejs', './template/test_cache2.ejs',
							'./template/test_cache3.ejs', './template/test_cache4.ejs',
							'./template/test_cache5.ejs', './template/test_cache6.ejs',
							'./template/test_cache7.ejs', './template/test_cache8.ejs',
							'./template/test_cache9.ejs', './template/test_cache10.ejs'];
					var expectArray = array1;

					var expectArray2 = [];

					view1.load(array1).done(
							function() {
								var cacheUrls = h5.dev.core.view.cacheManager.cacheUrls;
								var cache = h5.dev.core.view.cacheManager.cache;

								for ( var i = 0, l = cacheUrls.length; i < l; i++) {
									var url = cacheUrls[i];
									ok($.inArray(cache[url].path, expectArray) != -1,
											'キャッシュマネージャにキャッシュしたテンプレートが格納されていること。url: '
													+ cache[url].path);
									expectArray2.push(cache[url].path);
								}

								expectArray2.splice(0, 2);
								expectArray2 = expectArray2
										.concat(['./template/test_cache11.ejs',
												'./template/test_cache2.ejs',
												'./template/test_cache12.ejs']);


								var view2Done3Func = function() {
									var cacheUrls2 = h5.dev.core.view.cacheManager.cacheUrls;
									var cache2 = h5.dev.core.view.cacheManager.cache;

									for ( var i = 0, l = cacheUrls2.length; i < l; i++) {
										var url2 = cacheUrls2[i];
										ok($.inArray(cache2[url2].path, expectArray2) != -1,
												'キャッシュマネージャにキャッシュしたテンプレートが格納されていること。url: '
														+ cache2[url2].path);
									}

									start();
								};

								var view2Done2Func = function() {
									view2.load('./template/test_cache12.ejs').done(view2Done3Func);
								};

								var view2Done1Func = function() {
									view2.load('./template/test_cache2.ejs').done(view2Done2Func);
								};

								view2.load('./template/test_cache11.ejs').done(view2Done1Func);
							});
				});

		asyncTest('[build#min]テンプレートファイルのURLにクエリパラメータが付いていて、パラメータが異なる場合は別のファイルとしてキャッシュされること', 4,
				function() {
					var cacheManager = h5.dev.core.view.cacheManager;
					var view1 = h5.core.view.createView();
					h5.core.view.createView();
					var array1 = ['./template/test_cache1.ejs', './template/test_cache1.ejs?',
							'./template/test_cache1.ejs?aa', './template/test_cache1.ejs?bb'];
					var expectArray1 = array1;

					view1.load(array1).done(
							function() {
								var cacheUrls = h5.dev.core.view.cacheManager.cacheUrls;
								var cache = h5.dev.core.view.cacheManager.cache;

								for ( var i = 0, l = cacheUrls.length; i < l; i++) {
									var url = cacheUrls[i];
									ok($.inArray(cache[url].path, expectArray1) != -1,
											'キャッシュマネージャにキャッシュしたテンプレートが格納されていること。url: '
													+ cache[url].path);
								}
								start();
							});
				});

		asyncTest('[build#min]同じテンプレートファイルを並列にロードする', 2, function() {
			var cacheManager = h5.dev.core.view.cacheManager;
			var view1 = h5.core.view.createView();
			$.when(view1.load('./template/test_cache1.ejs'),
					view1.load('./template/test_cache1.ejs'))
					.done(
							function() {
								var cacheUrls = h5.dev.core.view.cacheManager.cacheUrls;
								var cache = h5.dev.core.view.cacheManager.cache;

								equal(cacheUrls.length, 1,
										'1ファイルのみキャッシュされていること。同じファイルが重複してキャッシュされていないこと。');

								for ( var i = 0, l = cacheUrls.length; i < l; i++) {
									var url = cacheUrls[i];
									equal(cache[url].path, './template/test_cache1.ejs',
											'test_cache1.ejsがキャッシュされていること。');
								}
								start();
							});
		});

		asyncTest('同じテンプレートファイルを別インスタンスのviewで並列にロードする', 4, function() {
			var v1 = h5.core.view.createView();
			var v2 = h5.core.view.createView();

			$.when(v1.load('./template/test4.ejs?test46'), v2.load('./template/test4.ejs?test46'))
					.done(
							function() {
								ok(v1.isAvailable('template4'),
										'viewインスタンス１でid:template4のテンプレートが使用可能であること');
								ok(v1.isAvailable('template5'),
										'viewインスタンス１でid:template5のテンプレートが使用可能であること');
								ok(v2.isAvailable('template4'),
										'viewインスタンス２でid:template4のテンプレートが使用可能であること');
								ok(v2.isAvailable('template5'),
										'viewインスタンス２でid:template5のテンプレートが使用可能であること');
								start();
							});
		});
	});
})();