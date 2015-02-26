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

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	//=============================
	// Variables
	//=============================
	// testutils
	var deleteProperty = testutils.u.deleteProperty;
	var gate = testutils.async.gate;
	var toAbsoluteUrl = testutils.u.toAbsoluteUrl;
	var clearController = testutils.u.clearController;

	// resのエラーコード
	var ERR = ERRCODE.h5.res;
	// viewのエラーコード
	var ERR_VIEW = ERRCODE.h5.core.view;
	// uのエラーコード
	var ERR_U = ERRCODE.h5.u;

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
	module('名前空間の依存解決', {
		teardown: function() {
			h5.res.clearAll();
			deleteProperty(window, 'h5resdata');
			// scriptタグの除去
			$('script[src*="h5resdata\"]').remove();
		},
		result: null
	});

	//=============================
	// Body
	//=============================
	asyncTest('グローバルに公開されるオブジェクトの取得', function() {
		h5.res.dependsOn('h5resdata.controller.SampleController').resolve().done(
				function(result) {
					strictEqual(h5resdata.controller.SampleController.__name,
							'h5resdata.controller.SampleController',
							'指定した名前空間のコントローラがグローバル領域から取得できること');
					strictEqual(h5resdata.controller.SampleController, result,
							'doneハンドラの引数にコントローラが渡されること');
				}).always(start);
	});

	asyncTest('リゾルバタイプ"namespace"を指定', function() {
		h5.res.dependsOn('h5resdata.controller.SampleController').resolve('namespace').done(
				function(result) {
					strictEqual(h5resdata.controller.SampleController, result,
							'resolveの引数にリゾルバのタイプを指定した時、doneハンドラの引数にコントローラが渡されること');
					strictEqual(h5resdata.controller.SampleController.__name,
							'h5resdata.controller.SampleController',
							'指定した名前空間のコントローラがグローバル領域から取得できること');
				}).always(start);
	});

	asyncTest('オブジェクトが既にグローバルに公開済み', function() {
		h5resdata = {
			controller: {
				SampleController: 'hoge'
			}
		};
		h5.res.dependsOn('h5resdata.controller.SampleController').resolve().done(function(result) {
			strictEqual(result, 'hoge', '指定した名前空間に既に値が存在するとき、doneハンドラの引数に元々入っている値が渡されること');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('名前空間の依存解決(異常系)');

	//=============================
	// Body
	//=============================
	asyncTest('存在しないファイルを指す名前空間を指定した場合はエラー', 1, function() {
		h5.res.dependsOn('h5resdata.noexist.SampleController').resolve().fail(function(e) {
			strictEqual(e.code, ERR_U.ERR_CODE_SCRIPT_FILE_LOAD_FAILD, e.message);
			start();
		});
	});

	asyncTest('タイムアウト', function() {
		var orgTimeoutTime = h5.settings.res.timeoutTime;
		h5.settings.res.timeoutTime = 1;
		h5.res.dependsOn('h5resdata.controller.NoExposeController').resolve().fail(function(e) {
			strictEqual(e.code, ERR.ERR_CODE_RESOLVE_TIMEOUT, e.message);
		}).always(function() {
			h5.settings.res.timeoutTime = orgTimeoutTime;
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('register', {
		teardown: function() {
			h5.res.clearAll();
			deleteProperty(window, 'h5resdata');
			// scriptタグの除去
			$('script[src*="h5resdata\"]').remove();
		},
		result: null
	});

	//=============================
	// Body
	//=============================
	asyncTest('オブジェクトが既にregister()で登録済み', function() {
		h5.res.register('h5resdata.controller.SampleController', {
			a: 'a'
		});
		h5.res.dependsOn('h5resdata.controller.SampleController').resolve().done(function(result) {
			strictEqual(result.a, 'a', '指定した名前空間にregister()で登録済みである時、doneハンドラの引数に登録済みの値が渡されること');
		}).always(start);
	});

	asyncTest('同期で呼ばれるregister()によって登録されるオブジェクトの取得', function() {
		var promise = h5.res.dependsOn('h5resdata.register.A').resolve();
		promise.done(function(result) {
			var a = new result();
			strictEqual(a.a, 'a', 'register()で渡されたオブジェクトがdoneハンドラに渡されること');
			ok(!window.h5resdata, 'グローバルには公開されていないこと');
			ok(a.ary[0], 'ok', 'register呼び出し後の処理が、doneハンドラの時点で実行済みであること');
		}).always(start);
	});

	asyncTest('非同期で呼ばれるregister()によって登録されるオブジェクトの取得', function() {
		var promise = h5.res.dependsOn('h5resdata.register.A_async').resolve();
		promise.done(function(result) {
			var a = new result();
			strictEqual(a.a, 'a', 'register()で渡されたオブジェクトがdoneハンドラに渡されること');
			ok(a.ary[0], 'ok', 'register呼び出し後の処理が、doneハンドラの時点で実行済みであること');
		}).always(start);
	});

	asyncTest('依存関係のネスト', function() {
		var promise = h5.res.dependsOn('h5resdata.register.B').resolve();
		promise.done(function(result) {
			var r = new result();
			strictEqual(r.b, 'b', 'register()で渡されたオブジェクトがdoneハンドラに渡されること');
			strictEqual(r.a && r.a.a, 'a', 'ネストした依存関係が解決されていること');
		}).always(start);
	});

	test('register()でグローバルに公開', function() {
		var obj = {
			a: 'a'
		};
		h5.res.register('h5resdata.objA', obj, true);
		strictEqual(h5resdata.objA.a, 'a', '第3引数にtrueを指定すると、キー名でオブジェクトが公開されること');
		h5.res.register('h5resdata.objB', obj, false);
		strictEqual(h5resdata.objB, undefined, '第3引数にfalseを指定すると、グローバルに公開されないこと');
		h5.res.register('h5resdata.objC', obj);
		strictEqual(h5resdata.objC, undefined, '第3引数を指定しない場合、グローバルに公開されないこと');
	});

	test('register()でグローバルに公開する名前空間を指定', function() {
		var obj = {
			a: 'a'
		};
		h5.res.register('h5resdata.objA', obj, true, 'h5resdata.hogeA');
		strictEqual(h5resdata.hogeA.a, 'a', '第4引数に指定した名前空間に公開されること');
		strictEqual(h5resdata.objA, undefined, 'キー名の名前空間には公開されないこと');
		h5.res.register('h5resdata.objB', obj, false, 'h5resdata.hogeB');
		strictEqual(h5resdata.hogeB, undefined, '第3引数がfalseの場合、第4引数を指定してもその場所に公開されないこと');
		strictEqual(h5resdata.objB, undefined, '第3引数がfalseの場合、キー名の場所に公開されないこと');
	});

	//=============================
	// Definition
	//=============================
	module('jsファイルの依存解決', {
		setup: function() {
			stop();
			h5.res.dependsOn('h5resdata/data/js/test.js').resolve().done(function(result) {
				start();
			});
		},
		teardown: function() {
			deleteProperty(window, 'h5test');
			// scriptタグの除去
			$('script[src*="h5resdata\"]').remove();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('jsファイルの依存解決', 3, function() {
		strictEqual(h5test.test.a, 1, '指定したjsファイルがロードされていること');
		h5test.test.a = 0;


		var promise1 = h5.res.dependsOn('h5resdata/data/js/test.js?hoge').resolve();
		promise1.done(function(result) {
			strictEqual(h5test.test.a, 1, 'クエリパラメータを指定した場合に、jsファイルがロードされていること');
			h5test.test.a = 0;
		});

		var promise2 = h5.res.dependsOn('h5resdata/data/js/test.js?fuga').resolve('jsfile');
		promise2.done(function(result) {
			strictEqual(h5test.test.a, 1, 'resolveの引数にリゾルバのタイプを指定した時、jsファイルがロードされていること');
			h5test.test.a = 0;
		});
		$.when(promise1, promise2).done(start);
	});

	//=============================
	// Definition
	//=============================
	module('jsファイルの依存解決(異常系)');

	//=============================
	// Body
	//=============================
	asyncTest('存在しないjsファイルを指定した場合はエラー', function() {
		h5.res.dependsOn('noexist.js').resolve().fail(function(e) {
			strictEqual(e.code, ERR_U.ERR_CODE_SCRIPT_FILE_LOAD_FAILD, e.message);
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('cssファイルの依存解決');

	//=============================
	// Body
	//=============================
	asyncTest('cssファイルの依存解決', function() {
		var cssFile = './h5resdata/data/css/test.css';
		h5.res.dependsOn(cssFile).resolve().done(function(result) {
			strictEqual($(result).attr('href'), cssFile, 'doneハンドラにlinkタグ要素が渡されること');

			var $h1 = $('<h1>hoge</h1>');
			$('#qunit-fixture').append($h1);
			gate({
				func: function() {
					return $h1.css('font-size') === '111px';
				},
				failMessage: 'スタイルが適用されていません'
			}).done(function() {
				ok(true, 'cssファイルがロードされてスタイルが適用されていること');
			}).always(function() {
				// linkタグの除去
				$(result).remove();
				start();
			});
		});
	});

	asyncTest('クエリパラメータ付きcssファイルの依存解決', function() {
		var cssFile = './h5resdata/data/css/test.css?hoge';
		h5.res.dependsOn(cssFile).resolve().done(function(result) {
			strictEqual($(result).attr('href'), cssFile, 'doneハンドラにlinkタグ要素が渡されること');

			var $h1 = $('<h1>hoge</h1>');
			$('#qunit-fixture').append($h1);
			gate({
				func: function() {
					return $h1.css('font-size') === '111px';
				},
				failMessage: 'スタイルが適用されていません'
			}).done(function() {
				ok(true, 'cssファイルがロードされてスタイルが適用されていること');
			}).always(function() {
				// linkタグの除去
				$(result).remove();
				start();
			});
		});
	});

	asyncTest('cssファイルの依存解決(typeにcssfile指定)', function() {
		var cssFile = './h5resdata/data/css/test.css';
		h5.res.dependsOn(cssFile).resolve('cssfile').done(function(result) {
			strictEqual($(result).attr('href'), cssFile, 'doneハンドラにlinkタグ要素が渡されること');

			var $h1 = $('<h1>hoge</h1>');
			$('#qunit-fixture').append($h1);
			gate({
				func: function() {
					return $h1.css('font-size') === '111px';
				},
				failMessage: 'スタイルが適用されていません'
			}).done(function() {
				ok(true, 'cssファイルがロードされてスタイルが適用されていること');
			}).always(function() {
				// linkタグの除去
				$(result).remove();
				start();
			});
		});
	});

	//=============================
	// Definition
	//=============================
	module('ejsファイルの依存解決');

	//=============================
	// Body
	//=============================
	asyncTest('ejsファイルの依存解決', 7, function() {
		var ejsFile = './h5resdata/data/ejs/valid.ejs';
		h5.res.dependsOn(ejsFile).resolve().done(
				function(result) {
					strictEqual(result.path, ejsFile, 'doneハンドラに渡されるオブジェクトから相対パスが取得できること');
					strictEqual(result.url, toAbsoluteUrl(ejsFile),
							'doneハンドラに渡されるオブジェクトからファイルの絶対パスが取得できること');
					var templates = result.templates;
					strictEqual(templates.length, 2, 'ejsファイルに書かれたテンプレートの数分だけテンプレートが取得できること');
					strictEqual(templates[0].id, 'tmp1', '1つ目のテンプレートidが取得できること');
					strictEqual(templates[0].content, '<p>テンプレート1</p>', '1つ目のテンプレートの中身が取得できること');
					strictEqual(templates[1].id, 'tmp2', '2つ目のテンプレートidが取得できること');
					strictEqual(templates[1].content, '<p>テンプレート2</p>', '2つ目のテンプレートの中身が取得できること');
					start();
				});
	});

	asyncTest('クエリパラメータ付きejsファイルの依存解決', 7, function() {
		var ejsFile = './h5resdata/data/ejs/valid.ejs?hoge';
		h5.res.dependsOn(ejsFile).resolve().done(
				function(result) {
					strictEqual(result.path, ejsFile, 'doneハンドラに渡されるオブジェクトから相対パスが取得できること');
					strictEqual(result.url, toAbsoluteUrl(ejsFile),
							'doneハンドラに渡されるオブジェクトからファイルの絶対パスが取得できること');
					var templates = result.templates;
					strictEqual(templates.length, 2, 'ejsファイルに書かれたテンプレートの数分だけテンプレートが取得できること');
					strictEqual(templates[0].id, 'tmp1', '1つ目のテンプレートidが取得できること');
					strictEqual(templates[0].content, '<p>テンプレート1</p>', '1つ目のテンプレートの中身が取得できること');
					strictEqual(templates[1].id, 'tmp2', '2つ目のテンプレートidが取得できること');
					strictEqual(templates[1].content, '<p>テンプレート2</p>', '2つ目のテンプレートの中身が取得できること');
					start();
				});
	});

	asyncTest('resolveの引数にリゾルバのタイプを指定してejsファイルの依存解決', 7, function() {
		var ejsFile = './h5resdata/data/ejs/valid.ejs';
		h5.res.dependsOn(ejsFile).resolve('ejsfile').done(
				function(result) {
					strictEqual(result.path, ejsFile, 'doneハンドラに渡されるオブジェクトから相対パスが取得できること');
					strictEqual(result.url, toAbsoluteUrl(ejsFile),
							'doneハンドラに渡されるオブジェクトからファイルの絶対パスが取得できること');
					var templates = result.templates;
					strictEqual(templates.length, 2, 'ejsファイルに書かれたテンプレートの数分だけテンプレートが取得できること');
					strictEqual(templates[0].id, 'tmp1', '1つ目のテンプレートidが取得できること');
					strictEqual(templates[0].content, '<p>テンプレート1</p>', '1つ目のテンプレートの中身が取得できること');
					strictEqual(templates[1].id, 'tmp2', '2つ目のテンプレートidが取得できること');
					strictEqual(templates[1].content, '<p>テンプレート2</p>', '2つ目のテンプレートの中身が取得できること');
					start();
				});
	});

	//=============================
	// Definition
	//=============================
	module('ejsファイルの依存解決(異常系)');

	//=============================
	// Body
	//=============================
	asyncTest('scriptタグ以外の要素があるときはエラー', 4, function() {
		var ejsFile = './h5resdata/data/ejs/invalidElement.ejs';
		h5.res.dependsOn(ejsFile).resolve().fail(function(e) {
			ok(true, 'failハンドラが実行されること');
			strictEqual(e.code, ERR_VIEW.ERR_CODE_TEMPLATE_FILE_INVALID_ELEMENT, e.message);
			var detail = e.detail;
			strictEqual(detail.path, ejsFile, 'detailから相対パスが取得できること');
			strictEqual(detail.url, toAbsoluteUrl(ejsFile), 'detailから絶対パスが取得できること');
			start();
		});
	});

	asyncTest('空ファイルはエラー', 4, function() {
		var ejsFile = './h5resdata/data/ejs/blank.ejs';
		h5.res.dependsOn(ejsFile).resolve('ejsfile').fail(function(e) {
			ok(true, 'failハンドラが実行されること');
			strictEqual(e.code, ERR_VIEW.ERR_CODE_TEMPLATE_FILE_NO_TEMPLATE, e.message);
			var detail = e.detail;
			strictEqual(detail.path, ejsFile, 'detailから相対パスが取得できること');
			strictEqual(detail.url, toAbsoluteUrl(ejsFile), 'detailから絶対パスが取得できること');
			start();
		});
	});

	asyncTest('コメントのみのファイルはエラー', 4, function() {
		var ejsFile = './h5resdata/data/ejs/commentOnly.ejs';
		h5.res.dependsOn(ejsFile).resolve().fail(function(e) {
			ok(true, 'failハンドラが実行されること');
			strictEqual(e.code, ERR_VIEW.ERR_CODE_TEMPLATE_FILE_NO_TEMPLATE, e.message);
			var detail = e.detail;
			strictEqual(detail.path, ejsFile, 'detailから相対パスが取得できること');
			strictEqual(detail.url, toAbsoluteUrl(ejsFile), 'detailから絶対パスが取得できること');
			start();
		});
	});

	asyncTest('id属性が無いテンプレートはエラー', 4, function() {
		var ejsFile = './h5resdata/data/ejs/noId.ejs';
		h5.res.dependsOn(ejsFile).resolve().fail(function(e) {
			ok(true, 'failハンドラが実行されること');
			strictEqual(e.code, ERR_VIEW.ERR_CODE_TEMPLATE_INVALID_ID, e.message);
			var detail = e.detail;
			strictEqual(detail.path, ejsFile, 'detailから相対パスが取得できること');
			strictEqual(detail.url, toAbsoluteUrl(ejsFile), 'detailから絶対パスが取得できること');
			start();
		});
	});

	asyncTest('idが空文字のテンプレートはエラー', 4, function() {
		var ejsFile = './h5resdata/data/ejs/blankId.ejs';
		h5.res.dependsOn(ejsFile).resolve().fail(function(e) {
			ok(true, 'failハンドラが実行されること');
			strictEqual(e.code, ERR_VIEW.ERR_CODE_TEMPLATE_INVALID_ID, e.message);
			var detail = e.detail;
			strictEqual(detail.path, ejsFile, 'detailから相対パスが取得できること');
			strictEqual(detail.url, toAbsoluteUrl(ejsFile), 'detailから絶対パスが取得できること');
			start();
		});
	});

	asyncTest('idが空白文字のテンプレートはエラー', 4, function() {
		var ejsFile = './h5resdata/data/ejs/spaceId.ejs';
		h5.res.dependsOn(ejsFile).resolve().fail(function(e) {
			ok(true, 'failハンドラが実行されること');
			strictEqual(e.code, ERR_VIEW.ERR_CODE_TEMPLATE_INVALID_ID, e.message);
			var detail = e.detail;
			strictEqual(detail.path, ejsFile, 'detailから相対パスが取得できること');
			strictEqual(detail.url, toAbsoluteUrl(ejsFile), 'detailから絶対パスが取得できること');
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('複数のリソースの同時取得');

	//=============================
	// Body
	//=============================
	asyncTest('複数のリソースを配列で指定', function() {
		var ejsFile = './h5resdata/data/ejs/valid.ejs';
		var cssFile = './h5resdata/data/css/test.css';
		var jsFile = 'h5resdata/data/js/test.js?複数のリソースの同時取得';
		h5.res.dependsOn([ejsFile, cssFile, jsFile]).resolve().done(
				function(all, ejs, css, js) {
					ok(all.length === 3 && all[0] === ejs && all[1] === css && all[2] === js,
							'第1引数は各リソースの取得結果が指定した順に格納された配列であること');
					strictEqual(ejs.templates && ejs.templates && ejs.templates[0].id, 'tmp1',
							'テンプレートが取得できること');
					strictEqual($(css).attr('href'), cssFile, '指定したcssファイルのlinkタグが取得できること');
					strictEqual(h5test.test.a, 1, 'jsファイルがロードされていること');
					deleteProperty(window, 'h5test');
				}).fail(function() {
			ok(false, 'resolveが失敗しました');
		}).always(start);
	});

	asyncTest('長さ１の配列でリソース指定', function() {
		var ejsFile = './h5resdata/data/ejs/valid.ejs';
		h5.res.dependsOn([ejsFile]).resolve().done(
				function(all, ejs) {
					ok(all.length === 1 && all[0] === ejs, '第1引数は各リソースの取得結果が指定した順に格納された配列であること');
					strictEqual(ejs.templates && ejs.templates && ejs.templates[0].id, 'tmp1',
							'テンプレートが取得できること');
					deleteProperty(window, 'h5test');
				}).fail(function() {
			ok(false, 'resolveが失敗しました');
		}).always(start);
	});


	//=============================
	// Definition
	//=============================
	module('get', {
		teardown: function() {
			h5.res.clearAll();
			deleteProperty(window, 'h5resdata');
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('get()メソッドでリソースキーの解決ができること', function() {
		h5.res.register('h5resdata.get', {
			a: 1
		});
		h5.res.get('h5resdata.get').done(function(result) {
			strictEqual(result.a, 1, 'get()メソッドでリソースキーの解決ができること');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('isDependency');

	//=============================
	// Body
	//=============================
	test('isDependencyでDependencyオブジェクトを判定できること', 2, function() {
		ok(h5.res.isDependency(h5.res.dependsOn('hoge.js')));
		ok(!h5.res.isDependency({}));
	});

	//=============================
	// Definition
	//=============================
	module('getKey');

	//=============================
	// Body
	//=============================
	test('DependencyオブジェクトのgetKey()でリソースキーを取得できること', 1, function() {
		var dep = h5.res.dependsOn('hoge');
		strictEqual(dep.getKey(), 'hoge', 'getKey()でリソースキーを取得できること');
	});

	// TODO リゾルバのカスタマイズについて前仕様のテストをコメントアウトしている
	// 仕様が決まったらテスト追加
	//	//=============================
	//	// Definition
	//	//=============================
	//	module('リゾルバのカスタマイズ', {
	//		setup: function() {
	//			// slice(0)して、元のresolversの中身を覚えておく
	//			this.orgResolvers = h5.res.resolvers.slice(0);
	//		},
	//		teardown: function() {
	//			// 元のresolversの中身にspliceを使って入れ替える(元に戻す)
	//			var resolvers = h5.res.resolvers;
	//			var spliceArgs = this.orgResolvers;
	//			spliceArgs.unshift(0, resolvers.length);
	//			resolvers.splice.apply(resolvers, spliceArgs);
	//		},
	//		orgResolvers: null
	//	});
	//
	//	//=============================
	//	// Body
	//	//=============================
	//	test('リゾルバの引数とthis', 2, function() {
	//		var context, arg;
	//		function resolver(resourceKey) {
	//			context = this;
	//			arg = resourceKey;
	//			return true;
	//		}
	//		h5.res.addResolver('mytype', resolver);
	//		h5.res.dependsOn('hoge').resolve();
	//		strictEqual(arg, 'hoge', '引数にはrequireで渡したリソースキーが渡されること');
	//		strictEqual(context.type, 'mytype', 'this.typeで実行中のリゾルバのtypeが取得できること');
	//	});
	//
	//	test('addResolverでリゾルバを追加', 3, function() {
	//		h5.res.addResolver(function(resourceKey) {
	//			return 'custom1';
	//		});
	//		strictEqual(h5.res.dependsOn('hoge').resolve(), 'custom1', '追加したリゾルバが使用されること');
	//
	//		h5.res.addResolver(function(resourceKey) {
	//			return 'custom2';
	//		});
	//		strictEqual(h5.res.dependsOn('hoge').resolve(), 'custom2', '後から追加したリゾルバが使用されること');
	//
	//		h5.res.addResolver(function(resourceKey) {
	//			return false;
	//		});
	//		strictEqual(h5.res.dependsOn('hoge').resolve(), 'custom2', 'リゾルバがfalseを返した時は次のリゾルバが使用されること');
	//	});
	//
	//	test('addResolverでtypeを指定したリゾルバを追加', 3, function() {
	//		h5.res.addResolver(function(resourceKey) {
	//			return 'custom1';
	//		});
	//
	//		h5.res.addResolver('customtype', function(resourceKey) {
	//			return 'custom2';
	//		});
	//
	//		h5.res.addResolver(function(resourceKey) {
	//			return 'custom3';
	//		});
	//		strictEqual(h5.res.dependsOn('hoge').resolve('customtype'), 'custom2',
	//				'指定したtypeのリゾルバが使用されること');
	//
	//		h5.res.addResolver('customtype', function(resourceKey) {
	//			return 'custom4';
	//		});
	//		strictEqual(h5.res.dependsOn('hoge').resolve('customtype'), 'custom4',
	//				'指定したtypeのリゾルバのうち、後から追加したものが使用されること');
	//
	//		h5.res.addResolver('customtype', function(resourceKey) {
	//			return false;
	//		});
	//		strictEqual(h5.res.dependsOn('hoge').resolve('customtype'), 'custom4',
	//				'指定したtypeのリゾルバのうち、後から追加したものが使用されること');
	//	});
	//
	//	test('h5.res.resolversを編集', 1, function() {
	//		var index = 0;
	//		var resolvers = h5.res.resolvers;
	//		for (var l = resolvers.length; index < l; index++) {
	//			if (resolvers[index].type === 'jsfile') {
	//				break;
	//			}
	//		}
	//		resolvers.splice(index, 0, {
	//			resolver: function() {
	//				return 'hoge';
	//			}
	//		});
	//		strictEqual(h5.res.dependsOn('a.js').resolve(), 'hoge', 'resolversに追加したリゾルバが使用されること');
	//	});

	//=============================
	// Definition
	//=============================
	module('リゾルバの選択', {
		setup: function() {
			// slice(0)して、元のresolversの中身を覚えておく
			this.orgResolvers = h5.res.resolvers.slice(0);
		},
		teardown: function() {
			// 元のresolversの中身にspliceを使って入れ替える(元に戻す)
			var resolvers = h5.res.resolvers;
			var spliceArgs = this.orgResolvers;
			spliceArgs.unshift(0, resolvers.length);
			resolvers.splice.apply(resolvers, spliceArgs);
		},
		orgResolvers: null
	});

	//=============================
	// Body
	//=============================
	test('testに関数を指定した場合の使用するリゾルバの判定', function() {
		var resolvers = h5.res.resolvers;
		resolvers.splice(0, resolvers.length, {
			test: function(resouceKey) {
				strictEqual(resouceKey, 'hoge', 'test関数にリソースキーが渡されること');
				return false;
			},
			resolver: function() {
				ok(false, 'test関数がfalseを返した場合はリゾルバは実行されないこと');
			}
		}, {
			test: function(resouceKey) {
				ok(true, '2番目に登録されたリゾルバのtest関数が実行されること');
				strictEqual(resouceKey, 'hoge', 'test関数にリソースキーが渡されること');
			},
			resolver: function() {
				ok(true, 'test関数がfalseを返していない場合、そのリゾルバが実行されること');
			}
		}, {
			test: function(resouceKey) {
				ok(false, '実行されるリゾルバが決定した後のtest関数は実行されないこと');
			},
			resolver: function() {
			// 何もしない
			}
		});
		h5.res.dependsOn('hoge').resolve();
	});

	test('testに正規表現を指定した場合の使用するリゾルバの判定', function() {
		var resolvers = h5.res.resolvers;
		resolvers.splice(0, resolvers.length, {
			test: /a/,
			resolver: function() {
				ok(false, 'testの正規表現にマッチしないリゾルバは実行されないこと');
			}
		}, {
			test: /hoge/,
			resolver: function() {
				ok(true, 'testの正規表現にマッチするリゾルバが実行されること');
				return true;
			}
		}, {
			resolver: function() {
				ok(false, '実行されるリゾルバが決まった場合、それ以降のリゾルバは実行されないこと');
				return true;
			}
		});
		h5.res.dependsOn('hoge').resolve();
	});

	test('typeを指定した場合の使用するリゾルバの判定', function() {
		var resolvers = h5.res.resolvers;
		resolvers.splice(0, resolvers.length, {
			type: 'a',
			test: function() {
				ok(false, '指定されたtypeと異なるリゾルバのtest関数は実行されないこと');
			},
			resolver: function() {
				ok(false, '指定されたtypeと異なるリゾルバは実行されないこと');
			}
		}, {
			type: 'b',
			resolver: function() {
				ok(true, 'typeが一致するリゾルバは実行されること');
			}
		});
		h5.res.dependsOn('hoge').resolve('b');

		var testExecuted = false;
		resolvers.splice(0, resolvers.length, {
			type: 'b',
			test: function() {
				textExecuted = true;
			},
			resolver: function() {
				ok(!testExecuted, 'type指定された場合、test関数は実行されないこと');
			}
		});
		h5.res.dependsOn('hoge').resolve('b');

		var testExecuted = false;
		resolvers.splice(0, resolvers.length, {
			type: 'b',
			test: /fuga/,
			resolver: function() {
				ok(!testExecuted, 'type指定された場合、testに指定した正規表現による判定は実行されないこと');
			}
		});
		h5.res.dependsOn('hoge').resolve('b');
	});


	test('指定したtypeにマッチするリゾルバがない場合', 1, function() {
		var resolvers = h5.res.resolvers;

		resolvers.splice(0, resolvers.length, {
			type: 'a',
			resolver: function() {
				ok(false, '指定されたtypeと異なるリゾルバは実行されないこと');
				return false;
			}
		});
		strictEqual(h5.res.dependsOn('hoge').resolve('b'), false, 'resolve()はfalseを返すこと');
	});

	test('全てのリゾルバについてtestが条件を満たさない場合', 1, function() {
		var resolvers = h5.res.resolvers;
		resolvers.splice(0, resolvers.length, {
			type: 'a',
			test: function() {
				return false;
			},
			resolver: function() {
				ok(false, 'リゾルバはじっこうされないこと');
			}
		}, {
			test: /fuga/,
			resolver: function() {
				ok(false, 'リゾルバはじっこうされないこと');
			}
		});
		strictEqual(h5.res.dependsOn('hoge').resolve(), false, 'resolve()はfalseを返すこと');
	});

	//=============================
	// Definition
	//=============================
	module('子コントローラに未解決のコントローラを指定', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"></div>');
		},
		teardown: function() {
			clearController();
			deleteProperty(window, 'h5resdata');
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('子コントローラに未解決のコントローラを指定', 3, function() {
		var c = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			childController: h5.res.dependsOn('h5resdata.controller.ChildController'),
			__construct: function() {
				this.isExecutedConstruct = true;
			},
			__init: function() {
				strictEqual(this.childController.__name, 'h5resdata.controller.ChildController',
						'__initの時点で子コントローラはインスタンス化されていること');
				ok(this.childController.isExecutedConstruct,
						'__initの時点で子コントローラの__constructが実行されていること');
			}
		});
		ok(c.isExecutedConstruct, 'ルートコントローラの__constructは同期で実行されること');
		c.readyPromise.done(start);
	});

	//=============================
	// Definition
	//=============================
	module('コントローラのロジックに未解決のロジックを指定', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"></div>');
		},
		teardown: function() {
			clearController();
			deleteProperty(window, 'h5resdata');
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('コントローラのロジックに未解決のロジックを指定', 4, function() {
		var c = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			sampleLogic: h5.res.dependsOn('h5resdata.logic.SampleLogic'),
			__construct: function() {
				this.isExecutedConstruct = true;
			},
			__init: function() {
				strictEqual(this.sampleLogic.__name, 'h5resdata.logic.SampleLogic',
						'__initの時点でロジックはインスタンス化されていること');
				ok(this.sampleLogic.isExecutedConstruct, '__initの時点でロジックの__constructが実行されていること');
				ok(this.sampleLogic.isExecutedReady, '__initの時点でロジックの__readyが実行されていること');
			}
		});
		ok(c.isExecutedConstruct, 'ルートコントローラの__constructは同期で実行されること');
		c.readyPromise.done(start);
	});

	//=============================
	// Definition
	//=============================
	module('コントローラ化するときの依存関係解決', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"></div>');
		},
		teardown: function() {
			clearController();
			deleteProperty(window, 'h5resdata');
			h5.res.clearAll();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('子コントローラ及びロジックがDependencyで記述されているとき、__initの時点で全ての依存関係が解決していること', 6, function() {
		h5.core.expose({
			__name: 'h5resdata.controller.ChildController',
			__construct: function() {
				this.isExecutedConstruct = true;
			}
		});
		h5.core.expose({
			__name: 'h5resdata.logic.SampleLogic',
			__construct: function() {
				this.isExecutedConstruct = true;
			},
			__ready: function() {
				this.isExecutedReady = true;
			}
		});
		var c = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			childController: h5.res.dependsOn('h5resdata.controller.ChildController'),
			sampleLogic: h5.res.dependsOn('h5resdata.logic.SampleLogic'),
			__construct: function() {
				this.isExecutedConstruct = true;
			},
			__init: function() {
				strictEqual(this.childController.__name, 'h5resdata.controller.ChildController',
						'__initの時点で子コントローラはインスタンス化されていること');
				ok(this.childController.isExecutedConstruct,
						'__initの時点で子コントローラの__constructが実行されていること');
				strictEqual(this.sampleLogic.__name, 'h5resdata.logic.SampleLogic',
						'__initの時点でロジックはインスタンス化されていること');
				ok(this.sampleLogic.isExecutedConstruct, '__initの時点でロジックの__constructが実行されていること');
				ok(this.sampleLogic.isExecutedReady, '__initの時点でロジックの__readyが実行されていること');
			}
		});
		ok(c.isExecutedConstruct, 'ルートコントローラの__constructは同期で実行されること');
		c.readyPromise.done(start);
	});

	asyncTest(
			'Dependencyで記述された定義オブジェクトが更にDependencyで記述された定義オブジェクトを持つとき、__initの時点で全ての依存関係が解決していること',
			11, function() {
				h5.core.expose({
					__name: 'h5resdata.controller.ChildController',
					childController: h5.res.dependsOn('h5resdata.controller.GrandChildController'),
					__construct: function() {
						this.isExecutedConstruct = true;
					}
				});
				h5.core.expose({
					__name: 'h5resdata.controller.GrandChildController',
					__construct: function() {
						this.isExecutedConstruct = true;
					}
				});
				h5.core.expose({
					__name: 'h5resdata.logic.SampleLogic',
					childLogic: h5.res.dependsOn('h5resdata.logic.ChildLogic'),
					__construct: function() {
						this.isExecutedConstruct = true;
					},
					__ready: function() {
						this.isExecutedReady = true;
					}
				});
				h5.core.expose({
					__name: 'h5resdata.logic.ChildLogic',
					__construct: function() {
						this.isExecutedConstruct = true;
					},
					__ready: function() {
						this.isExecutedReady = true;
					}
				});
				var c = h5.core.controller('#controllerTest', {
					__name: 'TestController',
					childController: h5.res.dependsOn('h5resdata.controller.ChildController'),
					sampleLogic: h5.res.dependsOn('h5resdata.logic.SampleLogic'),
					__construct: function() {
						this.isExecutedConstruct = true;
					},
					__init: function() {
						strictEqual(this.childController.__name,
								'h5resdata.controller.ChildController',
								'__initの時点で子コントローラはインスタンス化されていること');
						ok(this.childController.isExecutedConstruct,
								'__initの時点で子コントローラの__constructが実行されていること');
						strictEqual(this.childController.childController.__name,
								'h5resdata.controller.GrandChildController',
								'__initの時点で孫コントローラはインスタンス化されていること');
						ok(this.childController.childController.isExecutedConstruct,
								'__initの時点で孫コントローラの__constructが実行されていること');
						strictEqual(this.sampleLogic.__name, 'h5resdata.logic.SampleLogic',
								'__initの時点でロジックはインスタンス化されていること');
						ok(this.sampleLogic.isExecutedConstruct,
								'__initの時点でロジックの__constructが実行されていること');
						ok(this.sampleLogic.isExecutedReady, '__initの時点でロジックの__readyが実行されていること');
						strictEqual(this.sampleLogic.childLogic.__name,
								'h5resdata.logic.ChildLogic', '__initの時点で子ロジックはインスタンス化されていること');
						ok(this.sampleLogic.childLogic.isExecutedConstruct,
								'__initの時点で子ロジックの__constructが実行されていること');
						ok(this.sampleLogic.childLogic.isExecutedReady,
								'__initの時点で子ロジックの__readyが実行されていること');
					}
				});
				ok(c.isExecutedConstruct, 'ルートコントローラの__constructは同期で実行されること');
				c.readyPromise.done(start);
			});

	asyncTest('テンプレートをDependencyで記述', function() {
		h5.core.controller('#controllerTest', {
			__name: 'TestController',
			__templates: h5.res.dependsOn('h5resdata/data/ejs/valid.ejs'),
			__init: function() {
				this.view.append('{rootElement}', 'tmp1');
				strictEqual(this.$find('p').text(), 'テンプレート1', 'テンプレートが__initの時点で使用可能になっていること');
			}
		}).readyPromise.done(start);
	});

	asyncTest('テンプレートに複数リソースのDependencyを指定', function() {
		var ejs1 = './h5resdata/data/ejs/valid1.ejs';
		var ejs2 = './h5resdata/data/ejs/valid2.ejs';

		h5.core.controller('#controllerTest', {
			__name: 'TestController',
			__templates: h5.res.dependsOn([ejs1, ejs2]),
			__ready: function() {
				ok($(this.view.get('valid1-tmp1')).text(), 'valid1-tmp1', 'テンプレートがロードされていること');
				ok($(this.view.get('valid2-tmp1')).text(), 'valid2-tmp1', 'テンプレートがロードされていること');
			}
		}).readyPromise.done(start);
	});

	//=============================
	// Definition
	//=============================
	module('コントローラ化するときの依存関係解決(非同期)', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"></div>');
			this.orgResolvers = h5.res.resolvers.slice(0);
			var resolvers = h5.res.resolvers;
			// 名前空間解決をスタブに変更
			for (var i = 0, l = resolvers.length; i < l; i++) {
				var resolver = resolvers[i];
				if (resolver.type === 'namespace') {
					resolvers[i] = this.asyncNamespaceResolver;
					break;
				}
			}
		},
		teardown: function() {
			// 元のresolversの中身にspliceを使って入れ替える(元に戻す)
			var resolvers = h5.res.resolvers;
			var spliceArgs = this.orgResolvers;
			spliceArgs.unshift(0, resolvers.length);
			resolvers.splice.apply(resolvers, spliceArgs);

			clearController();
			deleteProperty(window, 'h5resdata');
		},
		orgResolvers: null,
		asyncNamespaceResolver: {
			type: 'namespace',
			resolver: function(resourceKey) {
				// 非同期でオブジェクトを返すスタブ
				var dfd = $.Deferred();
				setTimeout(function() {
					dfd.resolve(h5.u.obj.getByPath(resourceKey));
				}, 0);
				return dfd.promise();
			}
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('子コントローラ及びロジックがDependencyで記述されているとき、__initの時点で全ての依存関係が解決していること', 6, function() {
		h5.core.expose({
			__name: 'h5resdata.controller.ChildController',
			__construct: function() {
				this.isExecutedConstruct = true;
			}
		});
		h5.core.expose({
			__name: 'h5resdata.logic.SampleLogic',
			__construct: function() {
				this.isExecutedConstruct = true;
			},
			__ready: function() {
				this.isExecutedReady = true;
			}
		});
		var c = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			childController: h5.res.dependsOn('h5resdata.controller.ChildController'),
			sampleLogic: h5.res.dependsOn('h5resdata.logic.SampleLogic'),
			__construct: function() {
				this.isExecutedConstruct = true;
			},
			__init: function() {
				strictEqual(this.childController.__name, 'h5resdata.controller.ChildController',
						'__initの時点で子コントローラはインスタンス化されていること');
				ok(this.childController.isExecutedConstruct,
						'__initの時点で子コントローラの__constructが実行されていること');
				strictEqual(this.sampleLogic.__name, 'h5resdata.logic.SampleLogic',
						'__initの時点でロジックはインスタンス化されていること');
				ok(this.sampleLogic.isExecutedConstruct, '__initの時点でロジックの__constructが実行されていること');
				ok(this.sampleLogic.isExecutedReady, '__initの時点でロジックの__readyが実行されていること');
			}
		});
		ok(c.isExecutedConstruct, 'ルートコントローラの__constructは同期で実行されること');
		c.readyPromise.done(start);
	});

	asyncTest(
			'Dependencyで記述された定義オブジェクトが更にDependencyで記述された定義オブジェクトを持つとき、__initの時点で全ての依存関係が解決していること',
			11, function() {
				h5.core.expose({
					__name: 'h5resdata.controller.ChildController',
					childController: h5.res.dependsOn('h5resdata.controller.GrandChildController'),
					__construct: function() {
						this.isExecutedConstruct = true;
					}
				});
				h5.core.expose({
					__name: 'h5resdata.controller.GrandChildController',
					__construct: function() {
						this.isExecutedConstruct = true;
					}
				});
				h5.core.expose({
					__name: 'h5resdata.logic.SampleLogic',
					childLogic: h5.res.dependsOn('h5resdata.logic.ChildLogic'),
					__construct: function() {
						this.isExecutedConstruct = true;
					},
					__ready: function() {
						this.isExecutedReady = true;
					}
				});
				h5.core.expose({
					__name: 'h5resdata.logic.ChildLogic',
					__construct: function() {
						this.isExecutedConstruct = true;
					},
					__ready: function() {
						this.isExecutedReady = true;
					}
				});
				var c = h5.core.controller('#controllerTest', {
					__name: 'TestController',
					childController: h5.res.dependsOn('h5resdata.controller.ChildController'),
					sampleLogic: h5.res.dependsOn('h5resdata.logic.SampleLogic'),
					__construct: function() {
						this.isExecutedConstruct = true;
					},
					__init: function() {
						strictEqual(this.childController.__name,
								'h5resdata.controller.ChildController',
								'__initの時点で子コントローラはインスタンス化されていること');
						ok(this.childController.isExecutedConstruct,
								'__initの時点で子コントローラの__constructが実行されていること');
						strictEqual(this.childController.childController.__name,
								'h5resdata.controller.GrandChildController',
								'__initの時点で孫コントローラはインスタンス化されていること');
						ok(this.childController.childController.isExecutedConstruct,
								'__initの時点で孫コントローラの__constructが実行されていること');
						strictEqual(this.sampleLogic.__name, 'h5resdata.logic.SampleLogic',
								'__initの時点でロジックはインスタンス化されていること');
						ok(this.sampleLogic.isExecutedConstruct,
								'__initの時点でロジックの__constructが実行されていること');
						ok(this.sampleLogic.isExecutedReady, '__initの時点でロジックの__readyが実行されていること');
						strictEqual(this.sampleLogic.childLogic.__name,
								'h5resdata.logic.ChildLogic', '__initの時点で子ロジックはインスタンス化されていること');
						ok(this.sampleLogic.childLogic.isExecutedConstruct,
								'__initの時点で子ロジックの__constructが実行されていること');
						ok(this.sampleLogic.childLogic.isExecutedReady,
								'__initの時点で子ロジックの__readyが実行されていること');
					}
				});
				ok(c.isExecutedConstruct, 'ルートコントローラの__constructは同期で実行されること');
				c.readyPromise.done(start);
			});
});