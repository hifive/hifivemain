/*
 * Copyright (C) 2012 NS Solutions Corporation, All Rights Reserved.
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

	// window.com.htmlhifiveがない場合は作成して、window.com.htmlhifive.testに空オブジェクトを入れる
	((window.com = window.com || {}).htmlhifive = window.com.htmlhifive || {}).test = {};


	var CREATE_NAMESPACE_PASS_REASON = '名前空間オブジェクトを作成したので、undefinedでなくオブジェクトが入っているはず';

	module("h5.u", {
		teardown: function() {
			window.com.htmlhifive.test = {};
		}
	});

	test('名前空間作成 (h5.u.obj.ns)', 3, function() {
		var ns = h5.u.obj.ns('htmlhifive');

		strictEqual(ns, window.htmlhifive, 'ns()の戻り値は作成した名前空間オブジェクト');
		notStrictEqual(window.htmlhifive, undefined, CREATE_NAMESPACE_PASS_REASON);

		window.htmlhifive = undefined;
		strictEqual(window.htmlhifive, undefined, '（クリーンアップ）');
	});

	test('名前空間作成 (h5.u.obj.ns) 異常系', 8, function() {
		try {
			h5.u.obj.ns();
			ok(false, 'h5.u.obj()（引数なし）でエラーが発生しませんでした。');
		} catch (e) {
			ok(true, '引数なし:' + e.message);
		}
		try {
			h5.u.obj.ns(undefined);
			ok(false, 'h5.u.obj(undefined)でエラーが発生しませんでした。');
		} catch (e) {
			ok(true, 'undefined:' + e.message);
		}
		try {
			h5.u.obj.ns(null);
			ok(false, 'h5.u.obj(null)でエラーが発生しませんでした。');
		} catch (e) {
			ok(true, 'null:' + e.message);
		}
		try {
			h5.u.obj.ns(1);
			ok(false, 'h5.u.obj(1)でエラーが発生しませんでした。');
		} catch (e) {
			ok(true, '1:' + e.message);
		}
		try {
			h5.u.obj.ns(true);
			ok(false, 'h5.u.obj(true)でエラーが発生しませんでした。');
		} catch (e) {
			ok(true, 'true:' + e.message);
		}
		try {
			h5.u.obj.ns({});
			ok(false, 'h5.u.obj({})でエラーが発生しませんでした。');
		} catch (e) {
			ok(true, '{}:' + e.message);
		}
		try {
			h5.u.obj.ns([]);
			ok(false, 'h5.u.obj([])でエラーが発生しませんでした。');
		} catch (e) {
			ok(true, '[]:' + e.message);
		}
		try {
			h5.u.obj.ns(['a']);
			ok(false, 'h5.u.obj([\'a\'])でエラーが発生しませんでした。');
		} catch (e) {
			ok(true, '[\'a\']:' + e.message);
		}
	});
	test('名前空間作成-ドット区切りでネスト  (h5.u.obj.ns)', 6, function() {
		var ns = h5.u.obj.ns("com.htmlhifive.test.test1");

		strictEqual(ns, com.htmlhifive.test.test1,
				'ns()の戻り値は作成した名前空間オブジェクト。ネストしている場合は一番末尾のオブジェクトであること。');
		notStrictEqual(com, undefined, CREATE_NAMESPACE_PASS_REASON);
		notStrictEqual(com.htmlhifive, undefined, CREATE_NAMESPACE_PASS_REASON);
		notStrictEqual(com.htmlhifive.test, undefined, CREATE_NAMESPACE_PASS_REASON);
		notStrictEqual(com.htmlhifive.test.test1, undefined, CREATE_NAMESPACE_PASS_REASON);

		window.jp = undefined;
		strictEqual(window.jp, undefined, '（クリーンアップ）');
	});

	test('名前空間作成-パラメータにオブジェクトを指定する (h5.u.obj.ns)', 2, function() {
		var test = {
			dummy: 'DUMMY'
		};

		try {
			h5.u.obj.ns(test);
		} catch (e) {
			ok(e, 'オブジェクトをパラメータに指定するとエラーとして処理されること。');
		}

		strictEqual(window.dummy, undefined, 'ns()のパラメータにString型以外を指定した場合はエラーとして処理されること。');
	});

	test('com.htmlhifive.test.test1にオブジェクトを公開する (h5.u.obj.ns)', 4, function() {
		var comStr = 'COM';
		var htmlhifiveStr = 'HTMLHIFIVE';

		window.com = {
			dummy: comStr
		};
		window.com.htmlhifive = {
			dummy: htmlhifiveStr
		};

		var test1 = h5.u.obj.ns('com.htmlhifive.test.test1');

		equal(com.dummy, comStr);
		equal(com.htmlhifive.dummy, htmlhifiveStr);
		strictEqual(test1, com.htmlhifive.test.test1, 'nsの戻り値と作成された名前空間が同一であること。');
		notStrictEqual(com.htmlhifive.test.test1, undefined, '存在しない分については新規作成されていること。');
	});

	test('h5test1.exposeにオブジェクトを公開する (h5.u.obj.expose)', 5, function() {
		h5.u.obj.expose('h5test1.expose', {
			test: 1
		});

		ok(window.h5test1.expose, '名前空間が作成され公開されていること。');
		strictEqual(window.h5test1.expose.test, 1, 'window.h5test1.expose.test = 1 であること。');

		try {
			h5.u.obj.expose('h5test1', {
				expose: {
					test2: 1
				}
			});
		} catch (e) {
			ok(e, 'expose()で名前空間を上書きするとエラーが発生すること。');
		}

		strictEqual(window.h5test1.expose.test, 1, 'window.h5test1.expose.test = 1 であること。');
		strictEqual(window.h5test1.expose.test2, undefined,
				'window.h5test1.expose.test2 = undefined であること。');

		window.h5test1 = undefined;
	});

	test('h5test1.expose.testに1を設定後、expose()でtestに10を設定する (h5.u.obj.expose)', 3, function() {
		h5.u.obj.expose('h5test1.expose', {
			test: 1
		});

		strictEqual(window.h5test1.expose.test, 1, 'window.h5test1.expose.test = 1 であること。');

		try {
			h5.u.obj.expose('h5test1.expose', {
				test: 10
			});
		} catch (e) {
			ok(e, 'expose()で名前空間を上書きするとエラーが発生すること。');
		}

		strictEqual(window.h5test1.expose.test, 1, 'window.h5test1.expose.test = 10 に更新されること。');
		window.h5test1 = undefined;
	});

	test('expose()の第一引数に、String以外のオブジェクトを指定する。 (h5.u.obj.expose)', 1, function() {
		function Hoge() {
		//
		}
		Hoge.prototype.test = 10;

		window.h5test1 = new Hoge();

		try {
			h5.u.obj.expose(window.h5test1, {
				test: 2
			});
		} catch (e) {
			ok(e, 'expose()にString以外を指定するとエラーが発生すること。');
		}

		window.h5test1 = undefined;
	});

	test('html文字列をエスケープする(h5.u.str.espaceHtml)', 4, function() {
		var str = '<div>hogehoge<span>TEST</span>hoge.!</script>';
		var escapeStr = h5.u.str.escapeHtml(str);
		$('#qunit-fixture').append(escapeStr);
		strictEqual(escapeStr,
				'&lt;div&gt;hogehoge&lt;span&gt;TEST&lt;/span&gt;hoge.!&lt;/script&gt;',
				'エスケープされること。');
		strictEqual(h5.u.str.escapeHtml(0), 0, '文字列のみエスケープされること。');
		strictEqual(h5.u.str.escapeHtml(undefined), undefined, '文字列のみエスケープされること。');
		var obj = {
			aaa: 10
		};
		strictEqual(h5.u.str.escapeHtml(obj), obj, '文字列のみエスケープされること。');
	});

	test('文字列のプレフィックスを判定する (h5.u.str.startsWith)', 2, function() {
		var str = "abcdefg";
		var prefix1 = "abc";
		var prefix2 = "abe";

		strictEqual(h5.u.str.startsWith(str, prefix1), true, '文字列のプレフィックスが abc であること。');
		notStrictEqual(h5.u.str.startsWith(str, prefix2), true, '文字列のプレフィックスが abe ではないこと。');
	});

	test('文字列のサフィックスをを判定する (h5.u.str.endsWith)', 2, function() {
		var str = "abcdefg";
		var suffix1 = "efg";
		var suffix2 = "efa";

		strictEqual(h5.u.str.endsWith(str, suffix1), true, '文字列のサフィックスが efg であること。');
		notStrictEqual(h5.u.str.endsWith(str, suffix2), true, '文字列のサフィックスが efg 指定したものではないこと。');
	});

	test(
			'スクリプトのロード(h5.u.loadScript) 引数なし、空配列、null、文字列以外、空文字、空白文字、その他の型を引数に渡した時に、エラーも出ず、何もしないで終了すること。',
			10, function() {
				try {
					h5.u.loadScript({
						async: false
					});
					ok(false, '引数なしでエラーが発生していません。');
				} catch (e) {
					ok(true, '引数なしでエラーが発生しました。');
				}

				var vals = [[], null, 0, 1, true, false, {}, '', ' '];
				var valsStr = ['[]', null, 0, 1, true, false, {}, '""', '" "'];
				for ( var i = 0, l = vals.length; i < l; i++) {
					try {
						h5.u.loadScript(vals[i], {
							force: true,
							async: false
						});
						ok(false, 'エラーが発生していません。' + valsStr[i]);
					} catch (e) {
						ok(ok, 'エラーが発生しました。' + valsStr[i]);
					}
				}
			});

	test(
			'スクリプトのロード(h5.u.loadScript) 配列、null、文字列以外、空文字、空白文字、その他の型を含む配列を引数に渡した時に、エラーも出ず、何もしないで終了すること。',
			16, function() {
				window.h5samplefunc = undefined
				var vals = [[['data/sample.js']], ['data/sample.js', null], ['data/sample.js', 0],
						['data/sample.js', 1], ['data/sample.js', true], ['data/sample.js', false],
						['data/sample.js', {}], ['data/sample.js', ' ']];
				var valsStr = ["[['data/sample.js']]", "['data/sample.js', null]",
						"['data/sample.js', 0]", "['data/sample.js', 1]",
						"['data/sample.js', true]", "['data/sample.js', false]",
						"['data/sample.js', {}]", "['data/sample.js', ' ']"];
				for ( var i = 0, l = vals.length; i < l; i++) {
					try {
						h5.u.loadScript(vals[i], {
							force: true,
							async: false
						});
						ok(false, 'エラーが発生していません。' + valsStr[i]);
					} catch (e) {
						ok(ok, 'エラーが発生しました。' + valsStr[i]);
						ok(!window.h5samplefunc, 'スクリプトのロードはされていない');
					}
					window.h5samplefunc = undefined;
				}
			});

	test('スクリプトのロード(h5.u.loadScript) オプションに プレーンオブジェクト/undefined/null 以外を渡すと、エラーが出ること。', 8,
			function() {
				var opts = [[], '', 'data/sample.js', new String(), 0, 1, true, false];
				for ( var i = 0, l = opts.length; i < l; i++) {
					try {
						h5.u.loadScript('data/sample.js', opts[i], {
							async: false
						});
						ok(false, 'エラーが発生していません。');
					} catch (e) {
						ok(true, e.code + ': ' + e.message);
					}
				}
			});

	test('スクリプトのロード(h5.u.loadScript)', 3, function() {
		window.com.htmlhifive.test.h5samplefunc = undefined;
		h5.u.loadScript('data/sample.js', {
			force: true,
			async: false
		});

		ok(window.com.htmlhifive.test.h5samplefunc, 'スクリプトがロードできたか');
		window.com.htmlhifive.test.h5samplefunc = undefined;
		h5.u.loadScript('data/sample.js', {
			async: false
		});
		ok(!window.com.htmlhifive.test.h5samplefunc, '2重読み込みの防止はされていること。');
		h5.u.loadScript('data/sample.js', {
			force: true,
			async: false
		});
		ok(window.com.htmlhifive.test.h5samplefunc, 'forceオプションは有効か');
		window.com.htmlhifive.test.h5samplefunc = undefined;
	});

	test(
			'スクリプトのロード(h5.u.loadScript) 引数で渡した配列中に同一のpathを指定した場合、2重読み込み防止されること。また、forceオプション指定で2重読み込みされること。',
			2,
			function() {
				window.com.htmlhifive.test.sample4loaded = undefined;
				h5.u.loadScript(['data/sample4.js?1', 'data/sample.js', 'data/sample4.js?1'], {
					async: false
				});
				deepEqual(window.com.htmlhifive.test.sample4loaded, 1, 'sample4.jsが2重読み込みされていないこと。');

				window.com.htmlhifive.test.sample4loaded = undefined;
				h5.u.loadScript(['data/sample4.js?1', 'data/sample.js', 'data/sample4.js?1'], {
					force: true,
					async: false
				});
				deepEqual(window.com.htmlhifive.test.sample4loaded, 2,
						'forceオプションをtrueにするとsample4.jsが2重読み込みされたこと。');

				window.com.htmlhifive.test.sample4loaded = undefined;

			});

	test('スクリプトのロード(h5.u.loadScript) リクエストパラメータが違えば、同一のパスでも2重に読み込まれること。', 3, function() {
		window.com.htmlhifive.test.sample4loaded = undefined;
		h5.u.loadScript('data/sample4.js?s123', {
			async: false
		});
		deepEqual(window.com.htmlhifive.test.sample4loaded, 1, 'スクリプトが1回読み込まれたこと。');
		h5.u.loadScript('data/sample4.js?s1234', {
			async: false
		});
		deepEqual(window.com.htmlhifive.test.sample4loaded, 2, 'スクリプトが2回読み込まれたこと。');
		h5.u.loadScript(['data/sample4.js?s12345', 'data/sample4.js?s123',
				'data/sample4.js?s123456'], {
			async: false
		});
		deepEqual(window.com.htmlhifive.test.sample4loaded, 4, 'スクリプトが4回読み込まれたこと。');
	});


	test('スクリプトのロード(h5.u.loadScript) 存在しないスクリプトを指定した場合、以降のスクリプトは読み込まれないこと。', 2, function() {
		var qunitWindowOnErrorFunc = window.onerror;
		window.onerror = function() {};
		window.com.htmlhifive.test.sample4loaded = undefined;

		try {
			h5.u.loadScript(['data/sample4.js?existFile1', 'data/sample4.js?existFile2',
					'data/noExistFile.js', 'data/sample4.js?existFile3'], {
				async: false,
				force: true
			});
			ok(false, '例外がスローされなかったためテスト失敗');
		} catch (e) {
			equal(e.code, 11010, e.message);
			equal(window.com.htmlhifive.test.sample4loaded, 2,
					'data/sample4.js?existFile2 までは読み込まれていること。');
		}

		window.onerror = qunitWindowOnErrorFunc;
	});

	test('スクリプトの同期ロード(h5.u.loadScript)', 6, function() {
		h5.u.loadScript(['data/test1.js', 'data/test2.js', 'data/test3.js'], {
			force: true,
			async: false
		});

		ok(window.com.htmlhifive.test.test1.a, 'スクリプトが同期的にロードされたか1');
		ok(window.com.htmlhifive.test.test2.b, 'スクリプトが同期的にロードされたか2');
		ok(window.com.htmlhifive.test.test3.c, 'スクリプトが同期的にロードされたか3');

		strictEqual(window.com.htmlhifive.test.test1, window.com.htmlhifive.test.test2.test1,
				'スクリプトはシーケンシャルに読み込まれたか1');
		strictEqual(window.com.htmlhifive.test.test1, window.com.htmlhifive.test.test3.test1,
				'スクリプトはシーケンシャルに読み込まれたか2');
		strictEqual(window.com.htmlhifive.test.test2, window.com.htmlhifive.test.test3.test2,
				'スクリプトはシーケンシャルに読み込まれたか3');

		window.com.htmlhifive.test.test1 = undefined;
		window.com.htmlhifive.test.test2 = undefined;
		window.com.htmlhifive.test.test3 = undefined;
	});



	test('スクリプトのロード(h5.u.loadScript) (atomicオプション有効)', 3, function() {
		window.com.htmlhifive.test.h5samplefunc5 = undefined;
		h5.u.loadScript('data/sample5.js', {
			atomic: true,
			async: false
		});
		ok(window.com.htmlhifive.test.h5samplefunc5, 'スクリプトがロードできたか');
		window.com.htmlhifive.test.h5samplefunc5 = undefined;
		h5.u.loadScript('data/sample5.js', {
			async: false
		});
		ok(!window.com.htmlhifive.test.h5samplefunc5, '2重読み込みの防止はされていること。');
		h5.u.loadScript('data/sample5.js', {
			force: true,
			atomic: true,
			async: false
		});
		ok(window.com.htmlhifive.test.h5samplefunc5, 'forceオプションは有効か');
		window.com.htmlhifive.test.h5samplefunc5 = undefined;
	});

	test(
			'スクリプトのロード(h5.u.loadScript) (atomicオプション有効) 引数で渡した配列中に同一のpathを指定した場合、2重読み込み防止されること。また、forceオプション指定で2重読み込みされること。',
			2,
			function() {
				window.com.htmlhifive.test.sample4loaded = undefined;
				h5.u.loadScript(['data/sample4.js?3', 'data/sample.js', 'data/sample4.js?3'], {
					atomic: true,
					async: false
				});
				deepEqual(window.com.htmlhifive.test.sample4loaded, 1, 'sample4.jsが2重読み込みされていないこと。');

				window.com.htmlhifive.test.sample4loaded = undefined;
				h5.u.loadScript(['data/sample4.js?3', 'data/sample.js', 'data/sample4.js?3'], {
					force: true,
					atomic: true,
					async: false
				});
				deepEqual(window.com.htmlhifive.test.sample4loaded, 2,
						'forceオプションをtrueにするとsample4.jsが2重読み込みされたこと。');

				window.com.htmlhifive.test.sample4loaded = undefined;

			});

	test('スクリプトのロード(h5.u.loadScript) (atomicオプション有効) リクエストパラメータが違えば、同一のパスでも2重に読み込まれること。', 3,
			function() {
				window.com.htmlhifive.test.sample4loaded = undefined;
				h5.u.loadScript('data/sample4.js?atomic123', {
					atomic: true,
					async: false
				});
				deepEqual(window.com.htmlhifive.test.sample4loaded, 1, 'スクリプトが1回読み込まれたこと。');
				h5.u.loadScript('data/sample4.js?atomic1234', {
					atomic: true,
					async: false
				});
				deepEqual(window.com.htmlhifive.test.sample4loaded, 2, 'スクリプトが2回読み込まれたこと。');
				h5.u.loadScript(['data/sample4.js?atomic12345', 'data/sample4.js?atomic123',
						'data/sample4.js?atomic123456'], {
					atomic: true,
					async: false
				});
				deepEqual(window.com.htmlhifive.test.sample4loaded, 4, 'スクリプトが4回読み込まれたこと。');
			});


	test(
			'スクリプトのロード(h5.u.loadScript) (atomicオプション有効) 存在しないスクリプトを指定した場合、直前まで読み込みに成功していスクリプトファイルも全て読み込まれないこと。',
			2, function() {
				var qunitWindowOnErrorFunc = window.onerror;
				window.onerror = function() {};
				window.com.htmlhifive.test.sample4loaded = undefined;

				try {
					h5.u.loadScript(['data/sample4.js?existFile1', 'data/sample4.js?existFile2',
							'data/noExistFile.js', 'data/sample4.js?existFile3'], {
						async: false,
						force: true,
						atomic: true
					});
					ok(false, '例外がスローされなかったためテスト失敗');
				} catch (e) {
					equal(e.code, 11010, e.message);
					equal(window.com.htmlhifive.test.sample4loaded, undefined,
							'全てのスクリプトが読み込まれていないこと。');
				}

				window.onerror = qunitWindowOnErrorFunc;
			});

	test('スクリプトの同期ロード(h5.u.loadScript) (atomicオプション有効)', 6, function() {
		h5.u.loadScript(['data/test1.js', 'data/test2.js', 'data/test3.js'], {
			force: true,
			atomic: true,
			async: false
		});

		ok(window.com.htmlhifive.test.test1.a, 'スクリプトが同期的にロードされたか1');
		ok(window.com.htmlhifive.test.test2.b, 'スクリプトが同期的にロードされたか2');
		ok(window.com.htmlhifive.test.test3.c, 'スクリプトが同期的にロードされたか3');

		strictEqual(window.com.htmlhifive.test.test1, window.com.htmlhifive.test.test2.test1,
				'スクリプトはシーケンシャルに読み込まれたか1');
		strictEqual(window.com.htmlhifive.test.test1, window.com.htmlhifive.test.test3.test1,
				'スクリプトはシーケンシャルに読み込まれたか2');
		strictEqual(window.com.htmlhifive.test.test2, window.com.htmlhifive.test.test3.test2,
				'スクリプトはシーケンシャルに読み込まれたか3');

		window.com.htmlhifive.test.test1 = undefined;
		window.com.htmlhifive.test.test2 = undefined;
		window.com.htmlhifive.test.test3 = undefined;
	});



	asyncTest('スクリプトの非同期(parallel=true)ロード(h5.u.loadScript)', 6, function() {
		var promise = h5.u.loadScript(['data/test1.js', 'data/test2.js', 'data/test3.js'], {
			force: true,
			parallel: true
		});

		ok(!window.com.htmlhifive.test.test1, 'スクリプトが非同期にロードされたか1');
		ok(!window.com.htmlhifive.test.test2, 'スクリプトが非同期にロードされたか2');
		ok(!window.com.htmlhifive.test.test3, 'スクリプトが非同期にロードされたか3');

		promise.done(function() {
			ok(window.com.htmlhifive.test.test1.a, 'スクリプトが非同期にロードされたか4');
			ok(window.com.htmlhifive.test.test2.b, 'スクリプトが非同期にロードされたか5');
			ok(window.com.htmlhifive.test.test3.c, 'スクリプトが非同期にロードされたか6');

			window.com.htmlhifive.test.test1 = undefined;
			window.com.htmlhifive.test.test2 = undefined;
			window.com.htmlhifive.test.test3 = undefined;
			start();
		});

	});


	asyncTest('スクリプトの非同期(parallel=true)ロード(h5.u.loadScript) (atomicオプション有効)', 6, function() {
		var promise = h5.u.loadScript(['data/test1.js', 'data/test2.js', 'data/test3.js'], {
			force: true,
			parallel: true,
			atomic: true
		});

		ok(!window.com.htmlhifive.test.test1, 'スクリプトが非同期にロードされたか1');
		ok(!window.com.htmlhifive.test.test2, 'スクリプトが非同期にロードされたか2');
		ok(!window.com.htmlhifive.test.test3, 'スクリプトが非同期にロードされたか3');

		promise.done(function() {
			ok(window.com.htmlhifive.test.test1.a, 'スクリプトが非同期にロードされたか4');
			ok(window.com.htmlhifive.test.test2.b, 'スクリプトが非同期にロードされたか5');
			ok(window.com.htmlhifive.test.test3.c, 'スクリプトが非同期にロードされたか6');

			window.com.htmlhifive.test.test1 = undefined;
			window.com.htmlhifive.test.test2 = undefined;
			window.com.htmlhifive.test.test3 = undefined;
			start();
		});
	});



	asyncTest('スクリプトの非同期(parallel=false)ロード(h5.u.loadScript)', 9, function() {
		var promise = h5.u.loadScript(['data/test1.js', 'data/test2.js', 'data/test3.js'], {
			force: true,
			parallel: false
		});

		ok(!window.com.htmlhifive.test.test1, 'スクリプトが非同期にロードされたか1');
		ok(!window.com.htmlhifive.test.test2, 'スクリプトが非同期にロードされたか2');
		ok(!window.com.htmlhifive.test.test3, 'スクリプトが非同期にロードされたか3');

		promise.done(function() {
			ok(window.com.htmlhifive.test.test1.a, 'スクリプトが非同期にロードされたか4');
			ok(window.com.htmlhifive.test.test2.b, 'スクリプトが非同期にロードされたか5');
			ok(window.com.htmlhifive.test.test3.c, 'スクリプトが非同期にロードされたか6');

			strictEqual(window.com.htmlhifive.test.test1, window.com.htmlhifive.test.test2.test1,
					'スクリプトはシーケンシャルに読み込まれたか1');
			strictEqual(window.com.htmlhifive.test.test1, window.com.htmlhifive.test.test3.test1,
					'スクリプトはシーケンシャルに読み込まれたか2');
			strictEqual(window.com.htmlhifive.test.test2, window.com.htmlhifive.test.test3.test2,
					'スクリプトはシーケンシャルに読み込まれたか3');

			window.com.htmlhifive.test.test1 = undefined;
			window.com.htmlhifive.test.test2 = undefined;
			window.com.htmlhifive.test.test3 = undefined;
			start();
		});

	});

	asyncTest('スクリプトのロード(h5.u.loadScript) 【非同期】リクエストパラメータが違えば、同一のパスでも2重に読み込まれること。', 3, function() {
		window.com.htmlhifive.test.sample4loaded = undefined;
		h5.u.loadScript('data/sample4.js?async123').done(
				function() {
					deepEqual(window.com.htmlhifive.test.sample4loaded, 1, 'スクリプトが1回読み込まれたこと。');
					h5.u.loadScript('data/sample4.js?async1234').done(
							function() {
								deepEqual(window.com.htmlhifive.test.sample4loaded, 2,
										'スクリプトが2回読み込まれたこと。');
								h5.u.loadScript(
										['data/sample4.js?async12345', 'data/sample4.js?async123',
												'data/sample4.js?async123456']).done(
										function() {
											deepEqual(window.com.htmlhifive.test.sample4loaded, 4,
													'スクリプトが4回読み込まれたこと。');
											start();
										});
							});
				});
	});

	test(
			'スクリプトのロード(h5.u.loadScript) 【非同期】引数なし、空配列、null、文字列以外、空文字、空白文字、その他の型を引数に渡した時に、エラーも出ず、何もしないで終了すること。',
			10, function() {
				try {
					h5.u.loadScript();
					ok(false, '引数なしでエラーが発生していません。');
				} catch (e) {
					ok(true, '引数なしでエラーが発生しました。');
				}

				var vals = [[], null, 0, 1, true, false, {}, '', ' '];
				var valsStr = ['[]', null, 0, 1, true, false, {}, '""', '" "'];
				for ( var i = 0, l = vals.length; i < l; i++) {
					try {
						h5.u.loadScript(vals[i], {
							force: true
						});
						ok(false, 'エラーが発生していません。' + valsStr[i]);
					} catch (e) {
						ok(ok, 'エラーが同期で発生する。' + valsStr[i]);
					}
				}
			});

	test(
			'スクリプトのロード(h5.u.loadScript) 【非同期】配列、null、文字列以外、空文字、空白文字、その他の型を含む配列を引数に渡した時に、エラーも出ず、何もしないで終了すること。',
			16, function() {
				window.h5samplefunc = undefined
				var vals = [[['data/sample.js']], ['data/sample.js', null], ['data/sample.js', 0],
						['data/sample.js', 1], ['data/sample.js', true], ['data/sample.js', false],
						['data/sample.js', {}], ['data/sample.js', ' ']];
				var valsStr = ["[['data/sample.js']]", "['data/sample.js', null]",
						"['data/sample.js', 0]", "['data/sample.js', 1]",
						"['data/sample.js', true]", "['data/sample.js', false]",
						"['data/sample.js', {}]", "['data/sample.js', ' ']"];
				for ( var i = 0, l = vals.length; i < l; i++) {
					try {
						h5.u.loadScript(vals[i], {
							force: true
						});
						ok(false, 'エラーが発生していません。' + valsStr[i]);
					} catch (e) {
						ok(ok, 'エラーが同期で発生する。' + valsStr[i]);
						ok(!window.h5samplefunc, 'スクリプトのロードはされていない');
					}
					window.h5samplefunc = undefined;
				}
			});

	asyncTest(
			'スクリプトのロード(h5.u.loadScript) 【非同期】引数で渡した配列中に同一のpathを指定した場合、2重読み込み防止されること。また、forceオプション指定で2重読み込みされること。',
			2, function() {
				window.com.htmlhifive.test.sample4loaded = undefined;
				h5.u.loadScript(['data/sample4.js?2', 'data/sample.js', 'data/sample4.js?2']).done(
						function() {
							deepEqual(window.com.htmlhifive.test.sample4loaded, 1,
									'sample4.jsが2重読み込みされていないこと。');
							window.com.htmlhifive.test.sample4loaded = undefined;
							h5.u.loadScript(
									['data/sample4.js?2', 'data/sample.js', 'data/sample4.js?2'], {
										force: true
									}).done(
									function() {
										deepEqual(window.com.htmlhifive.test.sample4loaded, 2,
												'forceオプションをtrueにするとsample4.jsが2重読み込みされたこと。');

										window.com.htmlhifive.test.sample4loaded = undefined;
										start();
									});
						});
			});

	asyncTest('スクリプトのロード(h5.u.loadScript) 【非同期】存在しないスクリプトを指定した場合、以降のスクリプトは読み込まれないこと。', 2,
			function() {
				var qunitWindowOnErrorFunc = window.onerror;
				window.onerror = function() {};
				window.com.htmlhifive.test.sample4loaded = undefined;
				h5.u.loadScript(
						['data/sample4.js?existFile1', 'data/noExistFile.js',
								'data/sample4.js?existFile2', 'data/sample4.js?existFile3'], {
							force: true
						}).done(function() {
					ok(false, 'テスト失敗');
				}).fail(
						function(e) {
							equal(e.code, 11010, e.message);
							equal(window.com.htmlhifive.test.sample4loaded, 1,
									'data/sample4.js?existFile1 までは読み込まれていること。');
						}).always(function() {
					window.com.htmlhifive.test.sample4loaded = undefined;
					window.onerror = qunitWindowOnErrorFunc;
					start();
				});
			});


	test('文字列のフォーマット(h5.u.str.format)', 5, function() {
		var str = 'このテストは、{0}によって実行されています。{1}するはず、です。{0}いいですね。';
		strictEqual(h5.u.str.format(str, 'qUnit', '成功'),
				'このテストは、qUnitによって実行されています。成功するはず、です。qUnitいいですね。', '文字列がフォーマットされること。');

		strictEqual('', h5.u.str.format(null, 1), 'nullを渡すと空文字列が返るか');
		strictEqual('', h5.u.str.format(undefined), 'undefinedを渡すと空文字列が返るか');
		strictEqual('nullが渡されました。', h5.u.str.format('{0}が渡されました。', null),
				'パラメータとしてnullを渡すと"null"という文字列になっているか');
		strictEqual('undefinedが渡されました。', h5.u.str.format('{0}が渡されました。', undefined),
				'パラメータとしてundefinedを渡すと"undefined"という文字列になっているか');
	});

	test('argumentsを配列に変換(h5.u.obj.argsToArray)', function() {
		var func = function(a, b, c, d) {
			return h5.u.obj.argsToArray(arguments);
		};
		var result = func(1, 2, 3, 4);
		strictEqual(result instanceof Array, true, 'Array型であること。');
		deepEqual(result, [1, 2, 3, 4], 'argumentsオブジェクトが配列に変換されていること。');
	});

	test('window.hoge 配下のオブジェクトを、名前空間の文字列を指定して取得。(h5.u.obj.getByPath)', 7, function() {
		window.hoge = {
			hogehoge: {
				test: 10
			},
			hogehoge2: null,
			hogehoge3: {

			}
		};

		var objs = h5.u.obj.getByPath('hoge.hogehoge.test');
		deepEqual(objs, window.hoge.hogehoge.test, '10を取得できること。');
		objs = h5.u.obj.getByPath('hoge.hogehoge2');
		deepEqual(objs, window.hoge.hogehoge2, 'nullが取得できること。');
		objs = h5.u.obj.getByPath('hoge');
		deepEqual(objs, window.hoge, 'window.hogeオブジェクトが取得できること。');
		objs = h5.u.obj.getByPath('hoge.hogehoge4');
		deepEqual(objs, undefined, '指定した名前空間に何も存在しないので、undefinedが取得できること。');
		objs = h5.u.obj.getByPath('hoge.hogehoge4.hoge2');
		deepEqual(objs, undefined, '指定した名前空間に何も存在しないので、undefinedが取得できること。');
		objs = h5.u.obj.getByPath('hoge2');
		deepEqual(objs, undefined, '指定した名前空間に何も存在しないので、undefinedが取得できること。');
		raises(function() {
			h5.u.obj.getByPath(window.hoge);
		}, '文字列以外をパラメータに指定すると例外が発生すること。');
	});

	test('serialize/deserialize 文字列', 2, function() {
		var strs = ["helloWorld", 'o{"str1":"\"string1\""}'];
		for ( var i = 0, len = strs.length; i < len; i++) {
			var str = strs[i];
			var serialized = h5.u.obj.serialize(str, true);
			var deserialized = h5.u.obj.deserialize(serialized);
			deepEqual(deserialized, str, "シリアライズしてデシリアライズした文字列が元の文字列と同じ");
		}
	});

	test('serialize/deserialize 数字', 6, function() {
		var nums = [0, 1, -1.123, NaN, Infinity, -Infinity];
		for ( var i = 0, len = nums.length; i < len; i++) {
			var num = nums[i];
			var serialized = h5.u.obj.serialize(num);
			var deserialized = h5.u.obj.deserialize(serialized);
			deepEqual(deserialized, num, "シリアライズしてデシリアライズした数値が元の数値と同じ");
		}
	});

	test('serialize/deserialize 真偽値', 2, function() {
		var nums = [true, false];
		for ( var i = 0, len = nums.length; i < len; i++) {
			var num = nums[i];
			var serialized = h5.u.obj.serialize(num);
			var deserialized = h5.u.obj.deserialize(serialized);
			deepEqual(deserialized, num, "シリアライズしてデシリアライズした数値が元の数値と同じ");
		}
	});

	test('serialize/deserialize 日付', 2, function() {
		var dates = [new Date(0), new Date()];
		for ( var i = 0, len = dates.length; i < len; i++) {
			var date = dates[i];
			var serialized = h5.u.obj.serialize(date);
			var deserialized = h5.u.obj.deserialize(serialized);
			deepEqual(deserialized, date, "シリアライズしてデシリアライズしたDateオブジェクトが元のDateオブジェクトと同じ。"
					+ deserialized.getTime());
		}
	});

	test('serialize/deserialize 正規表現', 6,
			function() {
				var regExps = [/hello/, /^o*(.*)[a|b]{0,}?$/, /\\/g, /a|b/i, /x/gi, /\/\\\//img];
				for ( var i = 0, len = regExps.length; i < len; i++) {
					var regExp = regExps[i];
					var serialized = h5.u.obj.serialize(regExp);
					var deserialized = h5.u.obj.deserialize(serialized);
					deepEqual(deserialized, regExp, "シリアライズしてデシリアライズした正規表現が元の正規表現と同じ。"
							+ regExp.toString());
				}
			});

	test('serialize/deserialize 配列', 3, function() {
		var arrays = [[1, 2, null, undefined, 'a[b]c,[][', new Date(), /ar*ay/i], [], ['@{}']];
		for ( var i = 0, len = arrays.length; i < len; i++) {
			var array = arrays[i];
			var serialized = h5.u.obj.serialize(array);
			var deserialized = h5.u.obj.deserialize(serialized);
			deepEqual(deserialized, array, "シリアライズしてデシリアライズした配列が元の配列と同じ。" + array.toString());
		}
	});

	test('serialize/deserialize 多次元配列', 1, function() {
		var arrays = [[[1, 2, 3], [4, '\\5\\"', ['\\\"6\\\"', [7, '\\\"8\\\"']]], 9]];
		for ( var i = 0, len = arrays.length; i < len; i++) {
			var array = arrays[i];
			var serialized = h5.u.obj.serialize(array);
			var deserialized = h5.u.obj.deserialize(serialized);
			deepEqual(deserialized, array, "シリアライズしてデシリアライズした配列が元の配列と同じ。" + array.toString());
		}
	});

	test('serialize/deserialize オブジェクトの配列', 2, function() {
		var arrays = [[{
			a: 'A',
			b: 'B'
		}, {
			c: 'C',
			d: 'D'
		}], [{
			a: 'A',
			b: 'B'
		}, [1, [{
			c: 'C',
			d: 'D'
		}, 3]], {
			e: 'E',
			f: 'F'
		}]];
		for ( var i = 0, len = arrays.length; i < len; i++) {
			var array = arrays[i];
			var serialized = h5.u.obj.serialize(array);
			var deserialized = h5.u.obj.deserialize(serialized);
			deepEqual(deserialized, array, "シリアライズしてデシリアライズした配列が元の配列と同じ。" + array.toString());
		}
	});

	test('serialize/deserialize 連想配列', 22, function() {
		var array1 = [];
		array1['key'] = 'value';

		var array2 = [0, , 2, undefined, 4];
		// IE6用 代入式でundefinedを入れないとhasOwnPropertyがtrueの要素にならない。
		array2[3] = undefined;

		array2['a'] = 'A';
		array2['b'] = 'B';
		array2['u'] = undefined;
		var b = [];
		b['aa'] = 'AA';
		array2['obj'] = {
			a: 'A',
			b: b
		};

		var arrays = [array1, array2];
		for ( var i = 0, len = arrays.length; i < len; i++) {
			var array = arrays[i];
			var serialized = h5.u.obj.serialize(array);
			var deserialized = h5.u.obj.deserialize(serialized);
			deepEqual(deserialized, array, "シリアライズしてデシリアライズした配列が元の配列と同じ。" + array.toString());
			deepEqual(deserialized.length, array.length, "シリアライズしてデシリアライズした配列のlengthが元の配列と同じ。");
			for ( var key in array) {
				var compFunction = strictEqual;
				if (typeof array[key] === 'object') {
					compFunction = deepEqual;
				}
				compFunction(deserialized[key], array[key], "シリアライズしてデシリアライズした配列の値が各要素で同じ。 key = "
						+ key);
				compFunction(deserialized.hasOwnProperty(key), array.hasOwnProperty(key),
						"シリアライズしてデシリアライズした配列のhasOwnProperty()の値が各要素で同じ。 key = " + key);
			}
		}
	});


	test('serialize/deserialize プリミティブラッパー', 16,
			function() {
				var primitives = [new String("hello"), new String(), new Number(123),
						new Number('NaN'), new Number('Infinity'), new Number('-Infinity'),
						new Boolean(true), new Boolean(false)];
				for ( var i = 0, len = primitives.length; i < len; i++) {
					var primitive = primitives[i];
					var serialized = h5.u.obj.serialize(primitive);
					var deserialized = h5.u.obj.deserialize(serialized);
					strictEqual(typeof deserialized, 'object', 'デシリアライズした結果がプリミティブ型');
					// NaN === NaN ではないため、NaNの時は二つともNaNかどうか調べる
					if (isNaN(deserialized.valueOf())) {
						ok(isNaN(primitive.valueOf()), "シリアライズしてデシリアライズした値が元の値と同じ。"
								+ primitive.toString());
						continue;
					}
					strictEqual(deserialized.valueOf(), primitive.valueOf(),
							"シリアライズしてデシリアライズした値が元の値と同じ。" + primitive.toString());
				}
			});

	test('serialize/deserialize null/undefined', 2, function() {
		var exps = [null, undefined];
		// IE6用 代入式でundefinedを入れないとhasOwnPropertyがtrueの要素にならない。
		exps[1] = undefined;

		for ( var i = 0, len = exps.length; i < len; i++) {
			var exp = exps[i];
			var serialized = h5.u.obj.serialize(exp);
			var deserialized = h5.u.obj.deserialize(serialized);
			strictEqual(deserialized, exp, "シリアライズしてデシリアライズしたnull/undefinedが元と同じ。" + exp);
		}
	});

	test('serialize/deserialize オブジェクト：文字列、数値、日付、正規表現、null、undefined、配列、プリミティブ型各種', 7, function() {
		var obj = {
			str: "string",
			num: 456,
			date: new Date(),
			ary: [0, 1, 2],
			ary2: [3, [4, 5], 6],
			reg: /[a-z]*/,
			nul: null,
			und: undefined,
			NUM: new Number(123),
			BOL: new Boolean(true),
			STR: new String('STRING')
		};
		var serialized = h5.u.obj.serialize(obj);
		var deserialized = h5.u.obj.deserialize(serialized);
		strictEqual(typeof deserialized.STR, typeof obj.STR,
				'元のオブジェクトの中身のプリミティブ型Stringの要素と、シリアライズしてデシリアライズした同要素の型が同じ。');
		strictEqual(deserialized.STR.valueOf(), obj.STR.valueOf(),
				'元のオブジェクトの中身のプリミティブ型Stringの要素と、シリアライズしてデシリアライズした同要素の値が同じ。');
		strictEqual(typeof deserialized.NUM, typeof obj.NUM,
				'元のオブジェクトの中身のプリミティブ型Numberの要素と、シリアライズしてデシリアライズした同要素の型が同じ。');
		strictEqual(deserialized.NUM.valueOf(), obj.NUM.valueOf(),
				'元のオブジェクトの中身のプリミティブ型Numberの要素と、シリアライズしてデシリアライズした同要素の値が同じ。');
		strictEqual(typeof deserialized.NUM, typeof obj.NUM,
				'元のオブジェクトの中身のプリミティブ型Booleanの要素と、シリアライズしてデシリアライズした同要素の型が同じ。');
		strictEqual(deserialized.BOL.valueOf(), obj.BOL.valueOf(),
				'元のオブジェクトの中身のプリミティブ型Booleanの要素と、シリアライズしてデシリアライズした同要素の値が同じ。');

		delete obj.STR;
		delete deserialized.STR;
		delete obj.NUM;
		delete deserialized.NUM;
		delete obj.BOL;
		delete deserialized.BOL;

		deepEqual(deserialized, obj, "プリミティブ型を除いて、シリアライズしてデシリアライズしたオブジェクトが元のオブジェクトと同じ");
	});

	test('serialize/deserialize オブジェクトの入れ子', 2, function() {
		var obj1 = {
			obj2: {},
			obj3: {
				obj: {}
			},
			obj4: {}
		};
		var obj2 = {
			str1: "string",
			num1: 147,
			date1: new Date(),
			reg1: /[a-z]*/,
			nul1: null,
			und1: undefined,
			ary1: [1, 2],
			obj2: {
				str2: "string2\\\"\\",
				num2: 258,
				date2: new Date(),
				reg2: /[0-9]*/,
				nul2: null,
				und2: undefined,
				ary2: [3, [4, [5, 6], {
					a: 'A',
					b: ['B', {
						c: 'C'
					}]
				}], 8],
				obj3: {
					str3: "\\\"string3\\\"\\",
					num3: 369,
					date3: new Date(),
					reg3: /ABC|DEF|GHI/,
					nul3: null,
					und3: undefined,
					ary3: [3, [4, [5, 6], 7], 8]
				}
			}
		};
		var hashArray1 = [0, , , 3, undefined];
		// IE6用 代入式でundefinedを入れないとhasOwnPropertyがtrueの要素にならない。
		hashArray1[4] = undefined;

		hashArray1['key'] = {
			a: 'a',
			b: []
		};

		obj2.obj2.hashArray = hashArray1;
		var objs = [obj1, obj2];
		for ( var i = 0, len = objs.length; i < len; i++) {
			var obj = objs[i];
			var serialized = h5.u.obj.serialize(obj);
			var deserialized = h5.u.obj.deserialize(serialized);
			deepEqual(deserialized, obj, "シリアライズしてデシリアライズしたオブジェクトが元のオブジェクトと同じ");
		}
	});

	test('serialize/deserialize オブジェクト/配列/連想配列：循環参照でエラーが出ること', 8, function() {
		var a = {};
		a.obj = a;

		var b = {};
		b.obj = {};
		b.obj.obj = b;

		var c = {};
		c.obj1 = {};
		c.obj2 = {};
		c.obj1.obj1 = {};
		c.obj1.obj2 = {};
		c.obj1.obj1.obj1 = {};
		c.obj1.obj1.obj2 = {};
		c.obj1.obj2.obj1 = {};
		c.obj1.obj2.obj2 = {};
		c.obj1.obj2.obj1 = c.obj1;

		var d = [];
		d.push(d);

		var e = [];
		e[5] = e;

		var f = [];
		f.push([], []);
		f[0].push([], []);
		f[0][0].push([], []);
		f[0][1].push([], []);
		f[0][1][1] = f[0];

		var g = [];
		g['roop'] = g;

		var h = [];
		h['roop'] = f;

		var objs = [a, b, c, d, e, f, g, h];
		for ( var i = 0, len = objs.length; i < len; i++) {
			var obj = objs[i];
			try {
				var serialized = h5.u.obj.serialize(obj);
				ok(false, 'エラーが投げられていません。' + serialized);
			} catch (e) {
				ok(true, "エラーメッセージ：" + e.message);
			}
		}
	});

	test('serialize/deserialize オブジェクト/配列/連想配列：同じインスタンスを内部に重複して持つが、循環参照はしていない時にエラーが出ないこと。', 6,
			function() {
				var a = {};
				a.obj1 = {};
				a.obj2 = {};
				a.obj2.obj1 = a.obj1;

				var b = {};
				b.obj1 = {};
				b.obj2 = {};
				b.obj1.obj1 = {};
				b.obj1.obj2 = {};
				b.obj1.obj1.obj1 = {};
				b.obj1.obj1.obj2 = {};
				b.obj1.obj2.obj1 = {};
				b.obj1.obj2.obj2 = {};
				b.obj1.obj2.obj1 = b.obj2;
				b.obj1.obj2.obj1 = b.obj1.obj1;

				var c = [];
				c[1] = a;
				c['key'] = b;

				var d = [];
				d['key1'] = {};
				d['key2'] = d['key1'];

				var e = [];
				e.push([], []);
				e[0].push([], []);
				e[0][0].push([], []);
				e[0][1].push([], []);
				e[0][1][1] = e[1];

				var f = [a, b, c, d, e];

				var objs = [a, b, c, d, e, f];
				for ( var i = 0, len = objs.length; i < len; i++) {
					var obj = objs[i];
					try {
						var serialized = h5.u.obj.serialize(obj);
						var deserialized = h5.u.obj.deserialize(serialized);
						deepEqual(deserialized, obj, "シリアライズしてデシリアライズした配列が元の配列と同じ。");
					} catch (e) {
						ok(false, "エラーメッセージ：" + e.message);
					}
				}
			});

	test(
			'serialize/deserialize 値としてのundefinedと、未定義のundefinedを含む配列の各要素のhasOwnProperty()の結果が一致すること。',
			10, function() {
				// [,]の長さが1でないとき、最後のカンマを1つ減らす。(IE8以前とそれ以外でテストの数が変わらないようにするため)。
				var array = ([, ].length === 1) ? [0, , 2, undefined, 4, , undefined, , ] : [0, ,
						2, undefined, 4, , undefined, ];

				// IE6用 代入式でundefinedを入れないとhasOwnPropertyがtrueの要素にならない。
				array[3] = undefined;
				array[6] = undefined;

				var serialized = h5.u.obj.serialize(array);
				var deserialized = h5.u.obj.deserialize(serialized);
				deepEqual(deserialized, array, "シリアライズしてデシリアライズした配列が元の配列と同じ。" + array.toString());
				deepEqual(deserialized.length, array.length, "シリアライズしてデシリアライズした配列のlengthが元の配列と同じ。"
						+ array.length);
				for ( var i = 0, l = array.length; i < l; i++) {
					strictEqual(deserialized.hasOwnProperty(i), array.hasOwnProperty(i),
							"シリアライズしてデシリアライズした配列のhasOwnProperty()の値が各要素で同じ。" + i);
				}
			});

	test('serialize/deserialize プロトタイプの中身はシリアライズ化されないこと', 1, function() {
		var P = function() {};
		P.prototype = {
			b: 'b',
			c: function() {
				console.log(this);
			}
		};
		var obj = new P();
		obj.a = 'a';
		var serialized = h5.u.obj.serialize(obj);
		var deserialized = h5.u.obj.deserialize(serialized);
		var hasOwnObj = {};
		for ( var p in obj) {
			if (obj.hasOwnProperty(p)) {
				hasOwnObj[p] = obj[p];
			}
		}
		deepEqual(deserialized, hasOwnObj, "シリアライズしてデシリアライズしたオブジェクトが元のオブジェクトと同じ");
	});

	test('serialize/deserialize 関数をserializeするとエラーが出ること。', 1, function() {
		var func = function() {
			return 'hoge';
		};
		try {
			var serialized = h5.u.obj.serialize(func);
			ok(false, 'エラーが投げられていません。' + serialized);
		} catch (e) {
			ok(true, e.message);
		}
	});

	test('serialize/deserialize シリアライズしたバージョンの違う文字列をデシリアライズできないこと。', 4, function() {
		var serialized = "2|shello";
		try {
			h5.u.obj.deserialize(serialized);
			ok(false, 'エラーが投げられていません。' + serialized);
		} catch (e) {
			ok(true, e.message);
		}
		serialized = "";
		try {
			h5.u.obj.deserialize(serialized);
			ok(false, 'エラーが投げられていません。' + serialized);
		} catch (e) {
			ok(true, e.message);
		}
		serialized = " ";
		try {
			h5.u.obj.deserialize(serialized);
			ok(false, 'エラーが投げられていません。' + serialized);
		} catch (e) {
			ok(true, e.message);
		}
		serialized = " 1|n1";
		try {
			h5.u.obj.deserialize(serialized);
			ok(false, 'エラーが投げられていません。' + serialized);
		} catch (e) {
			ok(true, e.message);
		}
	});

	test('serialize/deserialize 関数を含むオブジェクト、配列、連想配列で、関数を持つプロパティは無視されること。', 11, function() {
		var hash = [1, 2];
		hash['f'] = function() {};
		hash['key'] = 'value';
		var objs = [{
			a: 'A',
			f: function() {},
			b: 'B'
		}, [0, function() {}, , function() {}], hash];
		var hashNoFunction = [1, 2];
		hashNoFunction['key'] = 'value';
		var noFuncArray = [0, undefined, , undefined];
		// IE6用 undefinedを代入式で代入しないと値としてのundefinedにならないため
		noFuncArray[1] = undefined;
		noFuncArray[3] = undefined;


		var objsNoFunction = [{
			a: 'A',
			b: 'B'
		}, noFuncArray, hashNoFunction];

		for ( var i = 0, len = objs.length; i < len; i++) {
			var obj = objs[i];
			var objNoFunction = objsNoFunction[i];
			var serialized = h5.u.obj.serialize(obj);
			var deserialized = h5.u.obj.deserialize(serialized);
			deepEqual(deserialized, objNoFunction, "シリアライズしてデシリアライズしたオブジェクトが元のオブジェクトと同じ");
			for ( var key in deserialized) {
				strictEqual(deserialized.hasOwnProperty(key), objNoFunction.hasOwnProperty(key),
						"シリアライズしてデシリアライズした配列のhasOwnProperty()の値が各要素で同じ。key = " + key);
			}
		}
	});

	test('deserialize 型情報が不正な文字をデシリアライズしようとしたときはエラーが発生すること。', 7, function() {
		var strs = ['1|', '1| ', '1|_', '1|@{}', '1|"abc"', '1|A', '1|O'];
		var errorCode = 11004;
		var deserialized;
		for ( var i = 0, len = strs.length; i < len; i++) {
			var str = strs[i];
			try {
				deserialized = h5.u.obj.deserialize(str);
				ok(false, 'エラーが発生していません。 ' + deserialized);
			} catch (e) {
				deepEqual(e.code, errorCode, e.message + ' ' + str);
			}
		}

	});

	test('deserialize 値が不正な文字をデシリアライズしようとしたときはエラーが発生すること。', 15, function() {

		var strs = ['1|n1px', '1|nNaN', '1|NNaN', '1|aary', '1|a{}', '1|o["n1"]', '1|o{"n1"}',
				'1|o1', '1|b2', '1|B2', '1|xx', '1|ii', '1|II', '1|ll', '1|uu'];
		var errorCode = 11006;
		for ( var i = 0, len = strs.length; i < len; i++) {
			var str = strs[i];
			try {
				var deserialized = h5.u.obj.deserialize(str);
				ok(false, 'エラーが発生していません。 ' + deserialized);
			} catch (e) {
				deepEqual(e.code, errorCode, e.message + ' ' + str);
			}
		}
	});

	test('deserialize 値が不正な正規表現文字列をRegExpオブジェクトにデシリアライズする。', 5, function() {

		var strs = ['1|r2', '1|r/a/y', '1|r/a/gy', '1|r/a/mG', '1|r/a/iQ'];
		// Firefoxにはyオプションがあるため、yオプションも復元されて取得できる
		var expect = h5.env.ua.isFirefox ? ['/r/', '/a/y', '/a/gy', '/a/m', '/a/i'] : ['/r/',
				'/a/', '/a/g', '/a/m', '/a/i'];
		var errorCode = 11006;
		for ( var i = 0, len = strs.length; i < len; i++) {
			var str = strs[i];
			try {
				var deserialized = h5.u.obj.deserialize(str);
				var patternStr = deserialized.toString();
				// RegExpの第二引数に不正なグローバルオプションを指定した場合、ブラウザによっては例外を出さず、不正な値のみ無視してRegExpを生成する。
				// そのため、例外を出さないブラウザでは以下のテストで検証する。
				// 例外を出さないブラウザ: Android 2,3, 3.1, 4.0.1 デフォルトブラウザ、 iOS4 Safari
				equal(patternStr, expect[i], '不正なグローバルオプションのみ無視されたRegExpオブジェクトが生成(復元)されること。'
						+ patternStr);
			} catch (e) {
				deepEqual(e.code, errorCode, e.message + ' ' + str);
			}
		}
	});

	test('deserialize 要素に不正な値を含む配列やオブジェクト文字列をデシリアライズしようとしたときはエラーが発生すること。', 10, function() {
		var objStrs = ['1|a["n1","q"]', '1|o{"key":"qq"}', '1|o{"key":"a[\\\"1\\\"]"}',
				'1|o{"key":"@[\\\"n1\\\"]"}', '1|a["@{\\\"key\\\":\\\"1\\\"}"]'];
		var errorCode = 11004;
		for ( var i = 0, len = objStrs.length; i < len; i++) {
			var str = objStrs[i];
			try {
				var deserialized = h5.u.obj.deserialize(str);
				ok(false, 'エラーが発生していません。 ' + deserialized);
			} catch (e) {
				deepEqual(e.code, errorCode, e.message + ' ' + str);
			}
		}
		objStrs = ['1|a["n1","nq"]', '1|o{"key":"b2"}', '1|o{"key":"a[\\\"nNaN\\\"]"}',
				'1|o{"key":"a[\\\"ll\\\"]"}', '1|a["@{\\\"key\\\":\\\"xx\\\"}"]'];
		var errorCode = 11006;
		for ( var i = 0, len = objStrs.length; i < len; i++) {
			var str = objStrs[i];
			try {
				var deserialized = h5.u.obj.deserialize(str);
				ok(false, 'エラーが発生していません。 ' + deserialized);
			} catch (e) {
				deepEqual(e.code, errorCode, e.message + ' ' + str);
			}
		}
	});

	test('deserialize 文字列以外をデシリアライズしようとしたときはエラーが発生すること。', 8, function() {
		var objStrs = [[], {}, true, false, 1, 2, undefined, null];
		var errorCode = 11009;
		for ( var i = 0, len = objStrs.length; i < len; i++) {
			var str = objStrs[i];
			try {
				var deserialized = h5.u.obj.deserialize(str);
				ok(false, 'エラーが発生していません。 ' + deserialized);
			} catch (e) {
				deepEqual(e.code, errorCode, e.message + ' ' + str);
			}
		}
	});

	test('h5.u.createInterceptor() インターセプタを作成できること', 5, function() {
		var count = 0;
		var count2 = 0;
		var ret = 0;
		var testInterceptor = h5.u.createInterceptor(function(invocation, data) {
			// invocationを実行
			count++;
			invocation();
		}, function(invocation, data) {
			count2++;
		});
		testInterceptor(function() {
			ret = 100;
		});
		deepEqual(count, 1, '関数の初めに実行したい関数が実行されること');
		deepEqual(count2, 1, '関数の終わりに実行したい関数が実行されること');
		deepEqual(ret, 100, '関数そのものが実行されていること');

		count = 0;
		ret = 0;
		testInterceptor = h5.u.createInterceptor(function(invocation, data) {
			// invocationを実行
			count++;
			invocation();
		});
		testInterceptor(function() {
			ret = 100;
		});
		deepEqual(count, 1, '第二引数省略 関数の初めに実行したい関数が実行されること');
		deepEqual(ret, 100, '第二引数省略 関数そのものが実行されていること');

	});

});
