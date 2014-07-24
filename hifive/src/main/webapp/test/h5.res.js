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
		setup: function() {
			stop();
			var that = this;
			h5.res.require('h5resdata.controller.SampleController').resolve().done(
					function(result) {
						// 最初にロードした時の結果を覚えておく
						that.result = result;
						start();
					});
		},
		teardown: function() {
			deleteProperty(window, 'h5resdata');
			// scriptタグの除去
			$('script[src*="h5resdata\"]').remove();
		},
		result: null
	});

	//=============================
	// Body
	//=============================
	test('名前空間の依存解決', 4,
			function() {
				strictEqual(h5resdata.controller.SampleController.__name,
						'h5resdata.controller.SampleController', '指定した名前空間のコントローラが取得できること');
				strictEqual(h5resdata.controller.SampleController, this.result,
						'doneハンドラの引数にコントローラが渡されること');

				h5.res.require('h5resdata.controller.SampleController').resolve('namespace').done(
						function(result) {
							strictEqual(h5resdata.controller.SampleController, result,
									'resolveの引数にリゾルバのタイプを指定した時、doneハンドラの引数にコントローラが渡されること');
						});

				h5resdata.controller.SampleController = 'hoge';

				h5.res.require('h5resdata.controller.SampleController').resolve().done(
						function() {
							strictEqual(h5resdata.controller.SampleController, 'hoge',
									'指定した名前空間に既に値が存在するとき、doneハンドラの引数に元々入っている値が渡されること');
						});
			});

	//=============================
	// Definition
	//=============================
	module('名前空間の依存解決(異常系)');

	//=============================
	// Body
	//=============================
	asyncTest('存在しないファイルを指す名前空間を指定した場合はエラー', 1, function() {
		h5.res.require('h5resdata.noexist.SampleController').resolve().fail(function(e) {
			strictEqual(e.code, ERR_U.ERR_CODE_SCRIPT_FILE_LOAD_FAILD, e.message);
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('jsファイルの依存解決', {
		setup: function() {
			stop();
			h5.res.require('h5resdata/data/js/test.js').resolve().done(function(result) {
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


		var promise1 = h5.res.require('h5resdata/data/js/test.js?hoge').resolve();
		promise1.done(function(result) {
			strictEqual(h5test.test.a, 1, 'クエリパラメータを指定した場合に、jsファイルがロードされていること');
		});

		var promise2 = h5.res.require('h5resdata/data/js/test.js?fuga').resolve('jsfile');
		promise2.done(function(result) {
			strictEqual(h5test.test.a, 1, 'resolveの引数にリゾルバのタイプを指定した時、jsファイルがロードされていること');
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
		h5.res.require('noexist.js').resolve().fail(function(e) {
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
		h5.res.require(cssFile).resolve().done(function(result) {
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
		h5.res.require(cssFile).resolve().done(function(result) {
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
		h5.res.require(cssFile).resolve('cssfile').done(function(result) {
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
		h5.res.require(ejsFile).resolve().done(
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
		h5.res.require(ejsFile).resolve().done(
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
		h5.res.require(ejsFile).resolve('ejsfile').done(
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
		h5.res.require(ejsFile).resolve().fail(function(e) {
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
		h5.res.require(ejsFile).resolve('ejsfile').fail(function(e) {
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
		h5.res.require(ejsFile).resolve().fail(function(e) {
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
		h5.res.require(ejsFile).resolve().fail(function(e) {
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
		h5.res.require(ejsFile).resolve().fail(function(e) {
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
		h5.res.require(ejsFile).resolve().fail(function(e) {
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
	module('isDependency');

	//=============================
	// Body
	//=============================
	test('isDependencyでDependencyオブジェクトを判定できること', 2, function() {
		ok(h5.res.isDependency(h5.res.require('hoge.js')));
		ok(!h5.res.isDependency({}));
	});

	//=============================
	// Definition
	//=============================
	module('リゾルバのカスタマイズ', {
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
	test('リゾルバの引数とthis', 2, function() {
		var context, arg;
		function resolver(resourceKey) {
			context = this;
			arg = resourceKey;
			return true;
		}
		h5.res.addResolver('mytype', resolver);
		h5.res.require('hoge').resolve();
		strictEqual(arg, 'hoge', '引数にはrequireで渡したリソースキーが渡されること');
		strictEqual(context.type, 'mytype', 'this.typeで実行中のリゾルバのtypeが取得できること');
	});

	test('addResolverでリゾルバを追加', 3, function() {
		h5.res.addResolver(function(resourceKey) {
			return 'custom1';
		});
		strictEqual(h5.res.require('hoge').resolve(), 'custom1', '追加したリゾルバが使用されること');

		h5.res.addResolver(function(resourceKey) {
			return 'custom2';
		});
		strictEqual(h5.res.require('hoge').resolve(), 'custom2', '後から追加したリゾルバが使用されること');

		h5.res.addResolver(function(resourceKey) {
			return false;
		});
		strictEqual(h5.res.require('hoge').resolve(), 'custom2', 'リゾルバがfalseを返した時は次のリゾルバが使用されること');
	});

	test('addResolverでtypeを指定したリゾルバを追加', 3, function() {
		h5.res.addResolver(function(resourceKey) {
			return 'custom1';
		});

		h5.res.addResolver('customtype', function(resourceKey) {
			return 'custom2';
		});

		h5.res.addResolver(function(resourceKey) {
			return 'custom3';
		});
		strictEqual(h5.res.require('hoge').resolve('customtype'), 'custom2',
				'指定したtypeのリゾルバが使用されること');

		h5.res.addResolver('customtype', function(resourceKey) {
			return 'custom4';
		});
		strictEqual(h5.res.require('hoge').resolve('customtype'), 'custom4',
				'指定したtypeのリゾルバのうち、後から追加したものが使用されること');

		h5.res.addResolver('customtype', function(resourceKey) {
			return false;
		});
		strictEqual(h5.res.require('hoge').resolve('customtype'), 'custom4',
				'指定したtypeのリゾルバのうち、後から追加したものが使用されること');
	});

	test('h5.res.resolversを編集', 1, function() {
		var index = 0;
		var resolvers = h5.res.resolvers;
		for (var l = resolvers.length; index < l; index++) {
			if (resolvers[index].type === 'jsfile') {
				break;
			}
		}
		resolvers.splice(index, 0, {
			resolver: function() {
				return 'hoge';
			}
		});
		strictEqual(h5.res.require('a.js').resolve(), 'hoge', 'resolversに追加したリゾルバが使用されること');
	});

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
	test('typeを指定した場合に実行されるリゾルバ', 2, function() {
		var resolvers = h5.res.resolvers;
		resolvers.splice(0, resolvers.length, {
			type: 'a',
			resolver: function() {
				ok(false, '指定されたtypeと異なるリゾルバは実行されないこと');
				return false;
			}
		}, {
			resolver: function() {
				ok(false, 'typeの指定されていないリゾルバは実行されないこと');
				return false;
			}
		}, {
			type: 'b',
			resolver: function() {
				ok(true, 'typeが一致するリゾルバは実行されること');
				return false;
			}
		}, {
			type: 'b',
			resolver: function() {
				ok(true, 'typeが一致するリゾルバは実行されること');
				return true;
			}
		}, {
			type: 'b',
			resolver: function() {
				ok(false, 'false以外を返すリゾルバが実行された場合、以降のリゾルバは実行されないこと');
				return true;
			}
		});
		h5.res.require('hoge').resolve('b');
	});


	test('typeを指定しない場合に実行されるリゾルバ', 2, function() {
		var resolvers = h5.res.resolvers;
		resolvers.splice(0, resolvers.length, {
			type: 'a',
			resolver: function() {
				ok(true, 'typeの指定されているリゾルバが実行されること');
				return false;
			}
		}, {
			resolver: function() {
				ok(true, 'typeの指定されていないリゾルバが実行されること');
				return true;
			}
		}, {
			resolver: function() {
				ok(false, 'false以外を返すリゾルバが実行された場合、以降のリゾルバは実行されないこと');
				return true;
			}
		});
		h5.res.require('hoge').resolve();
	});

	test('指定したtypeにマッチするリゾルバがない場合', 1, function() {
		var resolvers = h5.res.resolvers;

		resolvers.splice(0, resolvers.length, {
			type: 'a',
			resolver: function() {
				ok(false, '指定されたtypeと異なるリゾルバは実行されないこと');
				return false;
			}
		}, {
			resolver: function() {
				ok(false, 'typeの指定されていないリゾルバは実行されないこと');
				return false;
			}
		});
		strictEqual(h5.res.require('hoge').resolve('c'), false, 'resolve()はfalseを返すこと');
	});

	test('全てのリゾルバがfalseを返す場合', 1, function() {
		var resolvers = h5.res.resolvers;

		resolvers.splice(0, resolvers.length, {
			type: 'a',
			resolver: function() {
				return false;
			}
		}, {
			resolver: function() {
				return false;
			}
		});
		strictEqual(h5.res.require('hoge').resolve(), false, 'resolve()はfalseを返すこと');
	});
});