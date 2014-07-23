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

				h5.res.require('h5resdata.controller.SampleController', {
					type: 'namespace'
				}).resolve().done(
						function(result) {
							strictEqual(h5resdata.controller.SampleController, result,
									'type:namespaceを指定した時、doneハンドラの引数にコントローラが渡されること');
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
	asyncTest('jsファイルの依存解決', function() {
		strictEqual(h5test.test.a, 1, '指定したjsファイルがロードされていること');
		h5test.test.a = 0;

		h5.res.require('h5resdata/data/js/test.js?hoge', {
			type: 'jsfile'
		}).resolve().done(function(result) {
			strictEqual(h5test.test.a, 1, 'type:jsfileを指定した時、jsファイルがロードされていること');
			start();
		});
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
	module('cssファイルの依存解決', {
		cssFile: './h5resdata/data/css/test.css'
	});

	//=============================
	// Body
	//=============================
	asyncTest('cssファイルの依存解決', function() {
		var cssFile = this.cssFile;
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
		var cssFile = this.cssFile;
		h5.res.require(cssFile, {
			type: 'cssfile'
		}).resolve().done(function(result) {
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

	asyncTest('type:ejsfileを指定してejsファイルの依存解決', 7, function() {
		var ejsFile = './h5resdata/data/ejs/valid.ejs';
		h5.res.require(ejsFile, {
			type: 'ejsfile'
		}).resolve().done(
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
		h5.res.require(ejsFile, {
			type: 'ejsfile'
		}).resolve().fail(function(e) {
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
		h5.res.require(ejsFile, {
			type: 'ejsfile'
		}).resolve().fail(function(e) {
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
		h5.res.require(ejsFile, {
			type: 'ejsfile'
		}).resolve().fail(function(e) {
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
		h5.res.require(ejsFile, {
			type: 'ejsfile'
		}).resolve().fail(function(e) {
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
		h5.res.require(ejsFile, {
			type: 'ejsfile'
		}).resolve().fail(function(e) {
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
		h5.res.require(ejsFile, {
			type: 'ejsfile'
		}).resolve().fail(function(e) {
			ok(true, 'failハンドラが実行されること');
			strictEqual(e.code, ERR_VIEW.ERR_CODE_TEMPLATE_INVALID_ID, e.message);
			var detail = e.detail;
			strictEqual(detail.path, ejsFile, 'detailから相対パスが取得できること');
			strictEqual(detail.url, toAbsoluteUrl(ejsFile), 'detailから絶対パスが取得できること');
			start();
		});
	});
});