/*
 * Copyright (C) 2012 NS Solutions Corporation
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
	var ERR = ERRCODE.h5.api.storage;

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

	module('[browser#ie:6-7]H5Api - localStorage', {
		setup: function() {
			if (!h5.api.storage.isSupported) {
				return;
			}

			h5.api.storage.local.clear();
		}
	});

	//=============================
	// Body
	//=============================

	test('length', function() {
		if (!h5.api.storage.isSupported) {
			ok(false, 'このブラウザはWeb Storageをサポートしていません。');
			return;
		}
		h5.api.storage.local.setItem('hoge1', 10);
		h5.api.storage.local.setItem('hoge2', 20);
		equal(h5.api.storage.local.getLength(), 2, '');
	});

	test('key', function() {
		if (!h5.api.storage.isSupported) {
			ok(false, 'このブラウザはWeb Storageをサポートしていません。');
			return;
		}
		h5.api.storage.local.setItem('hoge1', 10);
		equal(h5.api.storage.local.key(0), 'hoge1', '0番目のキー');
	});

	test('setItem / local.getItem', function() {
		if (!h5.api.storage.isSupported) {
			ok(false, 'このブラウザはWeb Storageをサポートしていません。');
			return;
		}
		h5.api.storage.local.clear();
		// 数値
		h5.api.storage.local.setItem('number', 222);
		var result1 = h5.api.storage.local.getItem('number');
		strictEqual(result1, 222, '222 であること。');

		// 関数
		h5.api.storage.local.clear();
		// 文字列
		raises(function() {
			h5.api.storage.local.setItem('function', function() {
				alert('hello');
			});
		}, "setItem()に関数型のオブジェクトを格納すると例外が発生すること。");

		h5.api.storage.local.clear();
		// 文字列
		h5.api.storage.local.setItem('string', 'QER');
		var result2 = h5.api.storage.local.getItem('string');
		strictEqual(result2, 'QER', 'QER であること。');

		// 日付
		var now = new Date();
		h5.api.storage.local.setItem('date', now);
		var result2_1 = h5.api.storage.local.getItem('date');
		strictEqual(result2_1.getTime(), now.getTime(), 'Date型のオブジェクトが取得できること。');

		h5.api.storage.local.clear();
		// 配列
		h5.api.storage.local.setItem('array', ['A1', 'A2', 'A3']);
		var result3 = h5.api.storage.local.getItem('array');
		ok(result3 instanceof Array, 'Array型であること。');
		strictEqual(result3[0], 'A1', 'Array[0] = A1 であること。');
		strictEqual(result3[1], 'A2', 'Array[1] = A2 であること。');
		strictEqual(result3[2], 'A3', 'Array[2] = A3 であること。');

		h5.api.storage.local.clear();
		// オブジェクト
		h5.api.storage.local.setItem('object', {
			a: 900,
			b: 'RTY',
			c: function() {
				return 3.4;
			}
		});
		var result4 = h5.api.storage.local.getItem('object');
		strictEqual(result4.a, 900, 'オブジェクトに保存された数値: 900が取得できること。');
		strictEqual(typeof result4.a, 'number', 'オブジェクトに保存された数値: Number型であること。');
		strictEqual(result4.b, 'RTY', 'オブジェクトに保存された文字列: "RTY"が取得できること。');
		strictEqual(typeof result4.b, 'string', 'オブジェクトに保存された文字列: String型であること。');
		ok(!result4.hasOwnProperty('c'), 'オブジェクトに関数は保存されていないこと。');

		h5.api.storage.local.clear();
		// JSON
		h5.api.storage.local.setItem('json', {
			"j10": "xx",
			"j20": "yy",
			"j30": "zz"
		});
		var result5 = h5.api.storage.local.getItem('json');
		strictEqual(typeof result5, 'object', 'typeof: objectであること。');
		ok(result5 instanceof Object, 'instanceof Object型であること。');
		strictEqual(result5.j10, 'xx', 'JSON: Object.j10 = xx であること。');
		strictEqual(result5.j20, 'yy', 'JSON: Object.j20 = yy であること。');
		strictEqual(result5.j30, 'zz', 'JSON: Object.j30 = zz であること。');

		h5.api.storage.local.clear();
		// その他 b e f g
		var date = new Date();
		h5.api.storage.local.setItem('test', {
			a: undefined,
			b: null,
			c: false,
			d: NaN,
			e: Infinity,
			f: -Infinity,
			g: '',
			h: /a/,
			i: date,
			j: 'null',
			k: function(c) {
				var result = c;
				return ++result;
			}
		});
		var result6 = h5.api.storage.local.getItem('test');
		strictEqual(result6.a, undefined, 'オブジェクトに保存された値: undefinedであること。');
		strictEqual(result6.b, null, 'オブジェクトに保存された値: nullであること。');
		strictEqual(result6.c, false, 'オブジェクトに保存された値: Boolean型のtrueが保存できること。');
		ok(isNaN(result6.d), 'オブジェクトに保存された値: NaNであること。');
		strictEqual(result6.e, Infinity, 'オブジェクトに保存された値: Infinityであること。');
		strictEqual(result6.f, -Infinity, 'オブジェクトに保存された値: -Infinityであること。');
		strictEqual(result6.g, '', 'オブジェクトに保存された値: 空文字が取得できること。');
		ok(result6.h instanceof RegExp, 'オブジェクトに保存された値: RegExpオブジェクトであること。');
		ok(result6.i instanceof Date, 'オブジェクトに保存された値: Dateオブジェクトであること。');
		strictEqual(result6.j, 'null', 'オブジェクトに保存された値: 文字列"null"であること。');
		ok(!result6.hasOwnProperty('k'), 'オブジェクトに保存された値: 関数は復元されないこと。');

		h5.api.storage.session.clear();
		// 配列に保存
		var date2 = new Date();
		var exp1 = /a/;
		var obj = [undefined, null, false, NaN, Infinity, -Infinity, '', exp1, date2, function(c) {
			var result = c;
			return ++result;
		}];
		h5.api.storage.local.setItem('test', obj);
		var result6_2 = h5.api.storage.local.getItem('test');
		strictEqual(result6_2[0], undefined, '配列に保存された値: undefinedであること。');
		strictEqual(result6_2[1], null, '配列に保存された値: nullであること。');
		strictEqual(result6_2[2], false, '配列に保存された値: Boolean型のtrueが保存できること。');
		ok(isNaN(result6_2[3]), '配列に保存された値: NaNであること。');
		strictEqual(result6_2[4], Infinity, '配列に保存された値: Infinityであること。');
		strictEqual(result6_2[5], -Infinity, '配列に保存された値: -Infinityであること。');
		strictEqual(result6_2[6], '', '配列に保存された値: 空文字が取得できること。');
		ok(result6_2[7] instanceof RegExp, '配列に保存された値: RegExpオブジェクトであること。');
		ok(result6_2[8] instanceof Date, '配列に保存された値: Dateオブジェクトであること。');
		strictEqual(result6_2[9], undefined, '配列に保存された値: 関数はundefinedになること。');

		// undefined
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', undefined);
		var result7 = h5.api.storage.local.getItem('test');
		strictEqual(result7, undefined, 'undefinedであること。');

		// null
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', null);
		var result8 = h5.api.storage.local.getItem('test');
		strictEqual(result8, null, 'nullであること。');

		// 真偽値
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', true);
		var result9 = h5.api.storage.local.getItem('test');
		strictEqual(typeof result9, 'boolean', 'Boolean型であること。');
		strictEqual(result9, true, 'trueであること。');

		// NaN
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', NaN);
		var result10 = h5.api.storage.local.getItem('test');
		ok(isNaN(result10), 'NaNであること。');

		// Infinity
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', Infinity);
		var result11 = h5.api.storage.local.getItem('test');
		strictEqual(result11, Infinity, 'Infinityであること。');

		// -Infinity
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', -Infinity);
		var result12 = h5.api.storage.local.getItem('test');
		strictEqual(result12, -Infinity, '-Infinityであること。');

		// MAX_VALUE
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', Number.MAX_VALUE);
		var result13 = h5.api.storage.local.getItem('test');
		strictEqual(result13, Number.MAX_VALUE, 'Number.MAX_VALUE は有限なので保存できること。');

		// MIN_VALUE
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', Number.MIN_VALUE);
		var result14 = h5.api.storage.local.getItem('test');
		strictEqual(result14, Number.MIN_VALUE, 'Number.MIN_VALUE は有限なので保存できること。');

		// Number.POSITIVE_INFINITY
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', Number.POSITIVE_INFINITY);
		var result15 = h5.api.storage.local.getItem('test');
		strictEqual(result15, Infinity, 'Infinityであること。');

		// Number.NEGATIVE_INFINITY
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', Number.NEGATIVE_INFINITY);
		var result16 = h5.api.storage.local.getItem('test');
		strictEqual(result16, -Infinity, '-Infinityであること。');

		// RegExp
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', /a/);
		var result17 = h5.api.storage.local.getItem('test');
		equal(result17.toString(), /a/.toString(), 'RegExpオブジェクト: /a/.toString() と同値であること。');
		ok(result17 instanceof RegExp, 'RegExpオブジェクト: RegExp型であること。');

		// Date
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test', date);
		var result18 = h5.api.storage.local.getItem('test');
		equal(result18.toString(), date.toString(), 'Dateオブジェクト: Date.toString() と同値であること。');
		ok(result18 instanceof Date, 'Dateオブジェクト: Date型であること。');

		// オブジェクト<オブジェクト<文字列
		h5.api.storage.local.clear();
		var result19Obj = {
			a1: {
				a2: {
					v: 'AAA'
				}
			}
		};
		h5.api.storage.local.setItem('test', result19Obj);
		var result19 = h5.api.storage.local.getItem('test');
		deepEqual(result19, result19Obj, '同じオブジェクト構造であること。');
		strictEqual(result19.a1.a2.v, 'AAA', 'オブジェクト内に保存されているString型のオブジェクトが取得できること。');

		h5.api.storage.local.clear();

		// URL
		h5.api.storage.local.clear();
		var result22Url = 'http://www.yahoo.co.jp/';
		h5.api.storage.local.setItem('test', result22Url);
		var result22 = h5.api.storage.local.getItem('test');
		strictEqual(result22, result22Url, 'url文字列が取得できること。');

		// JSON文字列
		h5.api.storage.local.clear();
		var result23Json = '{"a1:"hoge","a2:"hoge2"}';
		h5.api.storage.local.setItem('test', result23Json);
		var result23 = h5.api.storage.local.getItem('test');
		strictEqual(result23, result23Json, 'JSONを文字列で保存した場合は、文字列として取得できること。');

		h5.api.storage.session.clear();
	});

	test('removeItem', function() {
		if (!h5.api.storage.isSupported) {
			ok(false, 'このブラウザはWeb Storageをサポートしていません。');
			return;
		}
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test1', 10);
		h5.api.storage.local.setItem('test2', 30);
		h5.api.storage.local.setItem('test3', 'AA');
		strictEqual(h5.api.storage.local.getLength(), 3, 'lengthが3であること。');
		h5.api.storage.local.removeItem('test2');
		strictEqual(h5.api.storage.local.getLength(), 2, 'キー=test2 を削除。 lengthが2であること。');
		strictEqual(h5.api.storage.local.getItem('test2'), null, 'キー=test2 は削除されているのでnullであること。');
	});

	test('clear', function() {
		if (!h5.api.storage.isSupported) {
			ok(false, 'このブラウザはWeb Storageをサポートしていません。');
			return;
		}
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test1', 10);
		h5.api.storage.local.setItem('test2', 30);
		h5.api.storage.local.setItem('test3', 'AA');
		strictEqual(h5.api.storage.local.getLength(), 3, 'lengthが3であること。');
		h5.api.storage.local.clear();
		strictEqual(h5.api.storage.local.getLength(), 0, '全て削除されていること。');
	});

	test('each', function() {
		if (!h5.api.storage.isSupported) {
			ok(false, 'このブラウザはWeb Storageをサポートしていません。');
			return;
		}
		h5.api.storage.local.clear();
		h5.api.storage.local.setItem('test1', 10);
		h5.api.storage.local.setItem('test2', 30);
		h5.api.storage.local.setItem('test3', 'AA');
		strictEqual(h5.api.storage.local.getLength(), 3, 'lengthが3であること。');
		var i = 0;
		h5.api.storage.local.each(function(idx, k, v) {
			strictEqual(i, idx, 'インデックスが取得できること。');
			strictEqual(k, h5.api.storage.local.key(i), 'キーが取得できること。');
			strictEqual(v, h5.api.storage.local.getItem(k), '値が取得できること。');
			i++;
		});
	});

	//=============================
	// Definition
	//=============================

	module('[browser#ie:6-7]H5Api - sessionStorage', {
		setup: function() {
			if (!h5.api.storage.isSupported) {
				return;
			}

			h5.api.storage.session.clear();
		}
	});

	//=============================
	// Body
	//=============================

	test('length', function() {
		if (!h5.api.storage.isSupported) {
			ok(false, 'このブラウザはWeb Storageをサポートしていません。');
			return;
		}
		h5.api.storage.session.setItem('hoge1', 10);
		h5.api.storage.session.setItem('hoge2', 20);
		equal(h5.api.storage.session.getLength(), 2, '');
	});

	test('key', function() {
		if (!h5.api.storage.isSupported) {
			ok(false, 'このブラウザはWeb Storageをサポートしていません。');
			return;
		}
		h5.api.storage.session.setItem('hoge1', 10);
		equal(h5.api.storage.session.key(0), 'hoge1', '0番目のキー');
	});

	test('setItem / session.getItem', function() {
		if (!h5.api.storage.isSupported) {
			ok(false, 'このブラウザはWeb Storageをサポートしていません。');
			return;
		}
		h5.api.storage.session.clear();
		// 数値
		h5.api.storage.session.setItem('number', 222);
		var result1 = h5.api.storage.session.getItem('number');
		strictEqual(result1, 222, '222 であること。');

		// 関数
		h5.api.storage.session.clear();
		// 文字列
		raises(function() {
			h5.api.storage.session.setItem('function', function() {
				alert('hello');
			});
		}, "setItem()に関数型のオブジェクトを格納すると例外が発生すること。");

		h5.api.storage.session.clear();
		// 文字列
		h5.api.storage.session.setItem('string', 'QER');
		var result2 = h5.api.storage.session.getItem('string');
		strictEqual(result2, 'QER', 'QER であること。');

		// 日付
		var now = new Date();
		h5.api.storage.local.setItem('date', now);
		var result2_1 = h5.api.storage.local.getItem('date');
		strictEqual(result2_1.getTime(), now.getTime(), 'Date型のオブジェクトが取得できること。');

		h5.api.storage.session.clear();
		// 配列
		h5.api.storage.session.setItem('array', ['A1', 'A2', 'A3']);
		var result3 = h5.api.storage.session.getItem('array');
		ok(result3 instanceof Array, 'Array型であること。');
		strictEqual(result3[0], 'A1', 'Array[0] = A1 であること。');
		strictEqual(result3[1], 'A2', 'Array[1] = A2 であること。');
		strictEqual(result3[2], 'A3', 'Array[2] = A3 であること。');

		h5.api.storage.session.clear();
		// オブジェクト
		h5.api.storage.session.setItem('object', {
			a: 900,
			b: 'RTY',
			c: function() {
				return 3.4;
			}
		});
		var result4 = h5.api.storage.session.getItem('object');
		strictEqual(result4.a, 900, 'オブジェクトに保存された数値: 900が取得できること。');
		strictEqual(typeof result4.a, 'number', 'オブジェクトに保存された数値: Number型であること。');
		strictEqual(result4.b, 'RTY', 'オブジェクトに保存された文字列: "RTY"が取得できること。');
		strictEqual(typeof result4.b, 'string', 'オブジェクトに保存された文字列: String型であること。');
		ok(!result4.hasOwnProperty('c'), 'オブジェクトに保存された関数オブジェクト: 関数は復元されないこと。');

		h5.api.storage.session.clear();
		// JSON
		h5.api.storage.session.setItem('json', {
			"j10": "xx",
			"j20": "yy",
			"j30": "zz"
		});
		var result5 = h5.api.storage.session.getItem('json');
		strictEqual(typeof result5, 'object', 'typeof: objectであること。');
		ok(result5 instanceof Object, 'instanceof Object型であること。');
		strictEqual(result5.j10, 'xx', 'JSON: Object.j10 = xx であること。');
		strictEqual(result5.j20, 'yy', 'JSON: Object.j20 = yy であること。');
		strictEqual(result5.j30, 'zz', 'JSON: Object.j30 = zz であること。');

		h5.api.storage.session.clear();
		// その他 b e f g
		var date = new Date();
		h5.api.storage.session.setItem('test', {
			a: undefined,
			b: null,
			c: false,
			d: NaN,
			e: Infinity,
			f: -Infinity,
			g: '',
			h: /a/,
			i: date,
			j: 'null',
			k: function(c) {
				var result = c;
				return ++result;
			}
		});
		var result6 = h5.api.storage.session.getItem('test');
		strictEqual(result6.a, undefined, 'オブジェクトに保存された値: undefinedであること。');
		strictEqual(result6.b, null, 'オブジェクトに保存された値: nullであること。');
		strictEqual(result6.c, false, 'オブジェクトに保存された値: Boolean型のtrueが保存できること。');
		ok(isNaN(result6.d), 'オブジェクトに保存された値: NaNであること。');
		strictEqual(result6.e, Infinity, 'オブジェクトに保存された値: Infinityであること。');
		strictEqual(result6.f, -Infinity, 'オブジェクトに保存された値: -Infinityであること。');
		strictEqual(result6.g, '', 'オブジェクトに保存された値: 空文字が取得できること。');
		ok(result6.h instanceof RegExp, 'オブジェクトに保存された値: RegExpオブジェクトであること。');
		ok(result6.i instanceof Date, 'オブジェクトに保存された値: Dateオブジェクトであること。');
		strictEqual(result6.j, 'null', 'オブジェクトに保存された値: 文字列"null"であること。');
		ok(!result6.hasOwnProperty('k'), 'オブジェクトに保存された値: 関数は復元されないこと。');

		h5.api.storage.session.clear();
		// 配列に保存
		var date2 = new Date();
		var exp1 = /a/;
		var obj = [undefined, null, false, NaN, Infinity, -Infinity, '', exp1, date2, function(c) {
			var result = c;
			return ++result;
		}];
		h5.api.storage.session.setItem('test', obj);
		var result6_2 = h5.api.storage.session.getItem('test');
		strictEqual(result6_2[0], undefined, '配列に保存された値: undefinedであること。');
		strictEqual(result6_2[1], null, '配列に保存された値: nullであること。');
		strictEqual(result6_2[2], false, '配列に保存された値: Boolean型のtrueが保存できること。');
		ok(isNaN(result6_2[3]), '配列に保存された値: NaNであること。');
		strictEqual(result6_2[4], Infinity, '配列に保存された値: Infinityであること。');
		strictEqual(result6_2[5], -Infinity, '配列に保存された値: -Infinityであること。');
		strictEqual(result6_2[6], '', '配列に保存された値: 空文字が取得できること。');
		ok(result6_2[7] instanceof RegExp, '配列に保存された値: RegExpオブジェクトであること。');
		ok(result6_2[8] instanceof Date, '配列に保存された値: Dateオブジェクトであること。');
		strictEqual(result6_2[9], undefined, '配列に保存された値: 関数はundefinedになること。');

		// undefined
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', undefined);
		var result7 = h5.api.storage.session.getItem('test');
		strictEqual(result7, undefined, 'undefinedであること。');

		// null
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', null);
		var result8 = h5.api.storage.session.getItem('test');
		strictEqual(result8, null, 'nullであること。');

		// 真偽値
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', true);
		var result9 = h5.api.storage.session.getItem('test');
		strictEqual(typeof result9, 'boolean', 'Boolean型であること。');
		strictEqual(result9, true, 'trueであること。');

		// NaN
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', NaN);
		var result10 = h5.api.storage.session.getItem('test');
		ok(isNaN(result10), 'NaNであること。');

		// Infinity
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', Infinity);
		var result11 = h5.api.storage.session.getItem('test');
		strictEqual(result11, Infinity, 'Infinityであること。');

		// -Infinity
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', -Infinity);
		var result12 = h5.api.storage.session.getItem('test');
		strictEqual(result12, -Infinity, '-Infinityであること。');

		// MAX_VALUE
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', Number.MAX_VALUE);
		var result13 = h5.api.storage.session.getItem('test');
		strictEqual(result13, Number.MAX_VALUE, 'Number.MAX_VALUE は有限なので保存できること。');

		// MIN_VALUE
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', Number.MIN_VALUE);
		var result14 = h5.api.storage.session.getItem('test');
		strictEqual(result14, Number.MIN_VALUE, 'Number.MIN_VALUE は有限なので保存できること。');

		// Number.POSITIVE_INFINITY
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', Number.POSITIVE_INFINITY);
		var result15 = h5.api.storage.session.getItem('test');
		strictEqual(result15, Infinity, 'Infinityであること。');

		// Number.NEGATIVE_INFINITY
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', Number.NEGATIVE_INFINITY);
		var result16 = h5.api.storage.session.getItem('test');
		strictEqual(result16, -Infinity, '-Infinityであること。');

		// RegExp
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', /a/);
		var result17 = h5.api.storage.session.getItem('test');
		equal(result17.toString(), /a/.toString(), 'RegExpオブジェクト: /a/.toString() と同値であること。');
		ok(result17 instanceof RegExp, 'RegExpオブジェクト: RegExp型であること。');

		// Date
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test', date);
		var result18 = h5.api.storage.session.getItem('test');
		equal(result18.toString(), date.toString(), 'Dateオブジェクト: Date.toString() と同値であること。');
		ok(result18 instanceof Date, 'Dateオブジェクト: Date型であること。');

		// オブジェクト<オブジェクト<文字列
		h5.api.storage.session.clear();
		var result19Obj = {
			a1: {
				a2: {
					v: 'AAA'
				}
			}
		};
		h5.api.storage.session.setItem('test', result19Obj);
		var result19 = h5.api.storage.session.getItem('test');
		deepEqual(result19, result19Obj, '同じオブジェクト構造であること。');
		strictEqual(result19.a1.a2.v, 'AAA', 'オブジェクト内に保存されているString型のオブジェクトが取得できること。');

		h5.api.storage.session.clear();

		// URL
		h5.api.storage.session.clear();
		var result22Url = 'http://www.yahoo.co.jp/';
		h5.api.storage.session.setItem('test', result22Url);
		var result22 = h5.api.storage.session.getItem('test');
		strictEqual(result22, result22Url, 'url文字列が取得できること。');

		// JSON文字列
		h5.api.storage.session.clear();
		var result23Json = '{"a1:"hoge","a2:"hoge2"}';
		h5.api.storage.session.setItem('test', result23Json);
		var result23 = h5.api.storage.session.getItem('test');
		strictEqual(result23, result23Json, 'JSONを文字列で保存した場合は、文字列として取得できること。');

		h5.api.storage.session.clear();
	});

	test('removeItem',
			function() {
				if (!h5.api.storage.isSupported) {
					ok(false, 'このブラウザはWeb Storageをサポートしていません。');
					return;
				}
				h5.api.storage.session.clear();
				h5.api.storage.session.setItem('test1', 10);
				h5.api.storage.session.setItem('test2', 30);
				h5.api.storage.session.setItem('test3', 'AA');
				strictEqual(h5.api.storage.session.getLength(), 3, 'lengthが3であること。');
				h5.api.storage.session.removeItem('test2');
				strictEqual(h5.api.storage.session.getLength(), 2, 'キー=test2 を削除。 lengthが2であること。');
				strictEqual(h5.api.storage.session.getItem('test2'), null,
						'キー=test2 は削除されているのでnullであること。');
			});

	test('clear', function() {
		if (!h5.api.storage.isSupported) {
			ok(false, 'このブラウザはWeb Storageをサポートしていません。');
			return;
		}
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test1', 10);
		h5.api.storage.session.setItem('test2', 30);
		h5.api.storage.session.setItem('test3', 'AA');
		strictEqual(h5.api.storage.session.getLength(), 3, 'lengthが3であること。');
		h5.api.storage.session.clear();
		strictEqual(h5.api.storage.session.getLength(), 0, '全て削除されていること。');
	});

	test('each', function() {
		if (!h5.api.storage.isSupported) {
			ok(false, 'このブラウザはWeb Storageをサポートしていません。');
			return;
		}
		h5.api.storage.session.clear();
		h5.api.storage.session.setItem('test1', 10);
		h5.api.storage.session.setItem('test2', 30);
		h5.api.storage.session.setItem('test3', 'AA');
		strictEqual(h5.api.storage.session.getLength(), 3, 'lengthが3であること。');
		var i = 0;
		h5.api.storage.session.each(function(idx, k, v) {
			strictEqual(i, idx, 'インデックスが取得できること。');
			strictEqual(k, h5.api.storage.session.key(i), 'キーが取得できること。');
			strictEqual(v, h5.api.storage.session.getItem(k), '値が取得できること。');
			i++;
		});
	});

});
