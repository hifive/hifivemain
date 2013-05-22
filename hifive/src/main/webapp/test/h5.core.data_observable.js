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

	// テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR_U.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.core.data;

	// window.com.htmlhifiveがない場合は作成して、window.com.htmlhifive.testに空オブジェクトを入れる
	((window.com = window.com || {}).htmlhifive = window.com.htmlhifive || {}).test = {};

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
	module('ObservableArray 独自メソッド');

	//=============================
	// Body
	//=============================
	test('createObservableArray', 3, function() {
		var o = h5.core.data.createObservableArray();
		strictEqual(o.equals([]), true, 'ObservableArrayが作成できること。中身が空であること');
		strictEqual(o[0], undefined, '0番目にインデックスアクセスすると、undefinedが返ってくること');
		strictEqual(o.length, 0, 'lengthプロパティに0が入っていること');
	});

	test('copyFrom', 11, function() {
		var o = h5.core.data.createObservableArray();
		var ary = [1, 'a', window];
		o.copyFrom(ary);
		ok(o.equals(ary), 'copyFromで引数に渡した配列の中身がコピーされること');
		notStrictEqual(o, ary, 'copyFromで渡した通常の配列とインスタンスが異なること');
		strictEqual(o.length, ary.length, 'lengthが渡した配列と同じであること');
		strictEqual(o.get(2), ary[2], 'getで値を取得できること');

		o.copyFrom([]);
		ok(o.equals([]), 'copyFromで引数に空配列を渡すと、ObservableArrayの中身も空になること');
		strictEqual(o.length, 0, 'lengthが0になること');
		strictEqual(o.get(0), undefined, 'get(0)するとundefinedが取得できること');

		var o2 = h5.core.data.createObservableArray();
		o2.copyFrom(ary);
		o.copyFrom(o2);
		ok(o.equals(ary), 'copyFromで引数にObservableArrayを渡すと、その中身がコピーされること');
		notStrictEqual(o, ary, 'copyFromで渡したObservableArrayとインスタンスが異なること');
		strictEqual(o.length, ary.length, 'lengthが更新されること');
		strictEqual(o.get(2), ary[2], 'getで値を取得できること');
	});

	test('equals', 17, function() {
		var o = h5.core.data.createObservableArray();
		var obj = {};
		var ary = [1, '2', obj];
		o.copyFrom(ary);
		strictEqual(o.equals([1, '2', obj]), true, '引数の配列と中身が同じならequalsの結果がtrueであること');

		var o2 = h5.core.data.createObservableArray();
		o2.copyFrom(ary);
		strictEqual(o.equals(o2), true, '引数のObservableArrayと中身が同じならequalsの結果がtrueであること');

		var o3 = h5.core.data.createObservableArray();
		strictEqual(o3.equals([]), true, '空のObservableArrayについて、equalsに空配列を渡されたら結果がtrueであること');

		var o4 = h5.core.data.createObservableArray();
		strictEqual(o3.equals(o4), true,
				'空のObservableArrayについて、equalsに空のObservableArrayを渡されたら結果がtrueであること');

		strictEqual(o2.equals(o2), true, '同一のObservableArrayインスタンスならequalsの結果はtrueであること');

		var nanAry = [1, NaN];
		var nanObsAry = h5.core.data.createObservableArray();
		var nanObsAry2 = h5.core.data.createObservableArray();
		nanObsAry.copyFrom(nanAry);
		nanObsAry2.copyFrom(nanAry);
		strictEqual(nanObsAry.equals(nanAry), true, 'NaNを含む配列でも場合equalsの結果はtrueであること');
		strictEqual(nanObsAry.equals(nanObsAry2), true, 'NaNを含むObs配列でも場合equalsの結果はtrueであること');

		o2.copyFrom([1, '2', {}]);
		strictEqual(o.equals(o2), false, '中身が違うならfalseが返ってくること');

		o2.copyFrom([1, 2, obj]);
		strictEqual(o.equals(o2), false, '中身が違うならfalseが返ってくること');

		o2.copyFrom([1, '2']);
		strictEqual(o.equals(o2), false, '中身が違うならfalseが返ってくること');

		o2.copyFrom([1, '2', obj, 3]);
		strictEqual(o.equals(o2), false, '中身が違うならfalseが返ってくること');

		strictEqual(o.equals([1, '2', {}]), false, '中身が違うならfalseが返ってくること');

		strictEqual(o.equals([1, 2, obj]), false, '中身が違うならfalseが返ってくること');

		strictEqual(o.equals([1, '2']), false, '中身が違うならfalseが返ってくること');

		strictEqual(o.equals([1, '2', obj, 3]), false, '中身が違うならfalseが返ってくること');

		nanObsAry.copyFrom([1, NaN, 3]);
		nanObsAry2.copyFrom([1, NaN]);
		strictEqual(nanObsAry.equals([1, NaN]), false, '中身が違うならfalseが返ってくること');
		strictEqual(nanObsAry.equals(nanObsAry2), false, '中身が違うならfalseが返ってくること');
	});

	test('toArray', 3, function() {
		var o = h5.core.data.createObservableArray();

		deepEqual($.type(o.toArray()), 'array', 'toArray()の戻り値は通常の配列であること');
		ok(o.equals([]), 'toArrayの戻り値は、中身の同じ配列であること');

		var obj = {
			a: 1
		};
		o.copyFrom([1, 2, obj]);
		ok(o.equals([1, 2, obj]), 'toArrayの戻り値は、中身の同じ配列であること');
	});

	test('get', 5, function() {
		var o = h5.core.data.createObservableArray();

		strictEqual(o.get(0), undefined, '範囲外をgetするとundefinedが返ってくること');
		o.copyFrom([1, 2, 3]);

		strictEqual(o.get(0), 1, '引数に指定したindexの要素を取得できること');
		strictEqual(o.get(1), 2, '引数に指定したindexの要素を取得できること');
		strictEqual(o.get(2), 3, '引数に指定したindexの要素を取得できること');

		strictEqual(o.get(3), undefined, '範囲外をgetするとundefinedが返ってくること');
	});

	test('set', 8, function() {
		var o = h5.core.data.createObservableArray();

		o.set(0, 1);

		ok(o.equals([1]), 'setで指定したindexに指定した要素を格納できること');
		strictEqual(o.get(0), 1, 'setしたものをgetで取得できること');
		strictEqual(o.length, 1, 'lengthが正しく更新されること');
		o.set(0, 2);
		o.set(1, 3);
		ok(o.equals([2, 3]), 'setで指定したindexに指定した要素を格納できること');

		o = h5.core.data.createObservableArray();
		o.set(1, 5);
		o.set(3, 7);
		var ary = [];
		ary[1] = 5;
		ary[3] = 7;
		ok(o.equals(ary), 'setで指定したindexに指定した要素を格納できること');
		strictEqual(o.get(1), 5, 'setしたものをgetで取得できること');
		strictEqual(o.get(3), 7, 'setしたものをgetで取得できること');
		strictEqual(o.length, ary.length, 'lengthが正しく更新されること');
	});

	//=============================
	// Definition
	//=============================
	module('ObservableArray Arrayメソッド 破壊系');

	//=============================
	// Body
	//=============================
	test('push', 12, function() {
		var o = h5.core.data.createObservableArray();
		var a = [];

		var retO = o.push(1);
		var retA = a.push(1);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		retO = o.push(2);
		retA = a.push(2);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		retO = o.push(null);
		retA = a.push(null);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		retO = o.push(4, 5);
		retA = a.push(4, 5);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');
	});

	test('pop', 12, function() {
		var o = h5.core.data.createObservableArray();
		var a = ['1', '2', '3'];
		o.copyFrom(a);

		var retO = o.pop();
		var retA = a.pop();
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		retO = o.pop();
		retA = a.pop();
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		retO = o.pop();
		retA = a.pop();
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		retO = o.pop();
		retA = a.pop();
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');
	});

	test('reverse', 3, function() {
		var o = h5.core.data.createObservableArray();
		var a = ['1', '2', '3'];
		o.copyFrom(a);

		var retO = o.reverse();
		a.reverse();
		strictEqual(retO, o, '戻り値がObservableArrayのインスタンスであること');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');
	});

	test('shift', 12, function() {
		var o = h5.core.data.createObservableArray();
		var a = ['1', '2', '3'];
		o.copyFrom(a);

		var retO = o.shift();
		var retA = a.shift();
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		retO = o.shift();
		retA = a.shift();
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		retO = o.shift();
		retA = a.shift();
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		retO = o.shift();
		retA = a.shift();
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');
	});

	test('sort', 6, function() {
		var o = h5.core.data.createObservableArray();
		var a = ['1', '3', '2'];
		o.copyFrom(a);

		var retO = o.sort();
		a.sort();
		strictEqual(retO, o, '戻り値がObservableArrayのインスタンスであること');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		o.push(null);
		a.push(null);

		var f = function(a, b) {
			return a < b ? 1 : a > b ? -1 : 0;
		};
		retO = o.sort(f);
		a.sort(f);
		strictEqual(retO, o, '戻り値がObservableArrayのインスタンスであること');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');
	});

	test('unshift', 9, function() {
		var o = h5.core.data.createObservableArray();
		var a = ['a', 'b', 'c'];
		o.copyFrom(a);

		var retO = o.unshift('1');
		var retA = a.unshift('1');
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		retO = o.unshift('2', '3');
		retA = a.unshift('2', '3');
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		retO = o.unshift(null);
		retA = a.unshift(null);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');
	});

	test('splice', 30, function() {
		var o = h5.core.data.createObservableArray();
		var a = ['1', '2', '3'];
		o.copyFrom(a);

		var retO = o.splice(1, o.length);
		var retA = a.splice(1, a.length);

		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		o = h5.core.data.createObservableArray();
		a = ['1', '2', '3'];
		o.copyFrom(a);

		retO = o.splice(0, 2);
		retA = a.splice(0, 2);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		o = h5.core.data.createObservableArray();
		a = ['1', '2', '3'];
		o.copyFrom(a);

		retO = o.splice(0, 4);
		retA = a.splice(0, 4);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		o = h5.core.data.createObservableArray();
		a = ['1', '2', '3'];
		o.copyFrom(a);

		retO = o.splice(3, 1);
		retA = a.splice(3, 1);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		// ----- 値を追加するパターン -------
		o = h5.core.data.createObservableArray();
		a = ['1', '2', '3'];
		o.copyFrom(a);

		var inAry = ['a', 'b'];
		var inObsAry = h5.core.data.createObservableArray();
		inObsAry.copyFrom(inAry);

		retO = o.splice(2, 1, '10', '20', inAry, inObsAry);
		retA = a.splice(2, 1, '10', '20', inAry, inObsAry);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');

		o = h5.core.data.createObservableArray();
		a = ['1', '2', '3'];
		o.copyFrom(a);

		retO = o.splice(0, null, '100', '200', '300');
		retA = a.splice(0, null, '100', '200', '300');
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(a), 'メソッド呼び出し後のObservableArrayの中身が正しいこと');
		strictEqual(o.length, a.length, 'メソッド呼び出し後のObservableArrayのlengthが正しいこと');
	});

	//=============================
	// Definition
	//=============================
	module('ObservableArray Arrayメソッド 非破壊系');

	//=============================
	// Body
	//=============================
	test('concat', 30, function() {
		var o = h5.core.data.createObservableArray();
		var a = ['1', '2', '3'];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var retO = o.concat('a');
		var retA = a.concat('a');
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');

		retO = o.concat('2', '3');
		retA = a.concat('2', '3');
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');

		retO = o.concat(['2', '3']);
		retA = a.concat(['2', '3']);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');

		retO = o.concat(['2', '3'], ['4', '5']);
		retA = a.concat(['2', '3'], ['4', '5']);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');

		// 引数にObservableArrayを取る場合
		inAry = ['a', 'b', 'c'];
		var inObsAry = h5.core.data.createObservableArray();
		inObsAry.copyFrom(inAry);

		retO = o.concat(inObsAry);
		retA = a.concat(inAry);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');

		retO = o.concat(o, inObsAry);
		retA = a.concat(a, inAry);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});

	test('slice', 15, function() {
		var o = h5.core.data.createObservableArray();
		var a = ['1', '2', '3', '4'];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var retO = o.slice(0);
		var retA = a.slice(0);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');

		retO = o.slice(1);
		retA = a.slice(1);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');

		retO = o.slice(1, 3);
		retA = a.slice(1, 3);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});

	test('join', 6, function() {
		var o = h5.core.data.createObservableArray();
		var a = [1, 2, 3, 4];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var retO = o.join();
		var retA = a.join();
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');

		retO = o.join('-');
		retA = a.join('-');
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});

	//=============================
	// Definition
	//=============================
	module('[browser#ie:-8|ie:9-10:docmode=7-9|ie-wp:9:docmode=7]ObservableArray Arrayメソッド 非破壊系(JavaScript1.6以降)');

	//=============================
	// Body
	//=============================
	test('every', 6, function() {
		var o = h5.core.data.createObservableArray();
		var a = [1, 2, 3, 4];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var f = function(d) {
			return d < 4;
		};
		var retO = o.every(f);
		var retA = a.every(f);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');

		f = function(d) {
			return d <= 4;
		};
		retO = o.every(f);
		retA = a.every(f);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});

	test('some', 6, function() {
		var o = h5.core.data.createObservableArray();
		var a = [1, 2, 3, 4];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var f = function(d) {
			return d === 3;
		};
		var retO = o.some(f);
		var retA = a.some(f);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');

		f = function(d) {
			return d > 4;
		};
		retO = o.some(f);
		retA = a.some(f);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});


	test('filter', 10, function() {
		var o = h5.core.data.createObservableArray();
		var a = [1, 2, 3, 4];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var f = function(d) {
			return d > 2;
		};
		var retO = o.filter(f);
		var retA = a.filter(f);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');

		f = function(d) {
			return d < 0;
		};
		retO = o.filter(f);
		retA = a.filter(f);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});


	test('forEach', 3, function() {
		var o = h5.core.data.createObservableArray();
		var a = [1, 2, 3, 4];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var retO = [];
		var retA = [];
		var f = function(d) {
			return this.ret.push(d * 2);
		};
		o.forEach(f, {
			ret: retO
		});
		a.forEach(f, {
			ret: retA
		});
		deepEqual(retO, retA, 'forEachに渡したコールバックが実行されること');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});

	test('map', 5, function() {
		var o = h5.core.data.createObservableArray();
		var a = [1, 2, 3, 4];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var f = function(d) {
			return d * 2;
		};
		var retO = o.map(f);
		var retA = a.map(f);
		ok(h5.core.data.isObservableArray(retO), '戻り値がObservableArrayであること');
		ok(retO.equals(retA), '戻り値の中身が正しいこと');
		strictEqual(retO.length, retA.length, '戻り値のlengthが正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});

	test('reduce', 3, function() {
		var o = h5.core.data.createObservableArray();
		var a = [1, 2, 3, 4];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var f = function(p, d) {
			return p - d;
		};
		var retO = o.reduce(f);
		var retA = a.reduce(f);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});

	test('reduceRight', 3, function() {
		var o = h5.core.data.createObservableArray();
		var a = [1, 2, 3, 4];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var f = function(p, d) {
			return p - d;
		};
		var retO = o.reduceRight(f);
		var retA = a.reduceRight(f);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});

	test('indexOf', 3, function() {
		var o = h5.core.data.createObservableArray();
		var a = [1, 2, 1, 2];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var retO = o.indexOf(2);
		var retA = a.indexOf(2);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});


	test('lastIndexOf', 3, function() {
		var o = h5.core.data.createObservableArray();
		var a = [1, 2, 1, 2];
		o.copyFrom(a);

		var originAry = o.toArray();
		var originLength = o.length;

		var retO = o.lastIndexOf(2);
		var retA = a.lastIndexOf(2);
		strictEqual(retO, retA, '戻り値が正しいこと');
		ok(o.equals(originAry), 'メソッド呼び出し後のObservableArrayの中身は変化していないこと');
		strictEqual(o.length, originLength, 'メソッド呼び出し後のObservableArrayのlengthは変化していないこと');
	});

	//=============================
	// Definition
	//=============================
	var item = null;
	module('ObservableItem', {
		setup: function() {
			item = h5.core.data.createObservableItem({
				nul: null,
				blank: null,
				str: {
					type: 'string'
				},
				num: {
					type: 'number'
				},
				int: {
					type: 'integer'
				},
				bool: {
					type: 'boolean'
				},
				'enum': {
					type: 'enum',
					enumValue: [1, 'a', window]
				},
				any: {
					type: 'any'
				},
				strA: {
					type: 'string[]'
				},
				numA: {
					type: 'number[]'
				},
				intA: {
					type: 'integer[]'
				},
				anyA: {
					type: 'any[]'
				}
			});
		},
		teardown: function() {
			item = null;
		}
	});

	//=============================
	// Body
	//=============================
	test('createObservableItem', function() {
		var item = h5.core.data.createObservableItem({
			no: null,
			name: null
		});
		ok(item, 'ObservableItemが作成できること');
	});

	test('createObservableItemの引数にオブジェクト以外を渡すとエラーになること', function() {
		var invalidValues = ['a', 1, true];
		for ( var i = 0, l = invalidValues.length; i < l; i++) {
			try {
				h5.core.data.createObservableItem(invalidValues[i]);
				ok(false, 'テスト失敗。エラーが発生しませんでした。' + invalidValues[i]);
			} catch (e) {
				strictEqual(e.code, ERR.ERR_CODE_REQUIRE_SCHEMA, e.message);
			}
		}
	});

	test('スキーマに定義されていないプロパティをget/setするとエラーになること', 2, function() {
		raises(function(enviroment) {
			item.get('hoge');
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_CANNOT_GET_NOT_DEFINED_PROPERTY;
		}, 'スキーマに定義されていないプロパティの値を取得したためエラーになること"');

		raises(function(enviroment) {
			item.set('hoge', 10);
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY;
		}, 'スキーマに定義されていないプロパティに対して値を設定したためエラーになること"');
	});


	//=============================
	// Definition
	//=============================
	/**
	 * イベントオブジェクトをチェックする関数
	 * targetにthis(ObservableItem)を入れるので、calcの中でcheckEv.apply(this,ev,exp)のようにして呼んでチェックする
	 * expはtarget以外のプロパティを入れる
	 *
	 * @param {object} ev イベントオブジェクト
	 * @param {object} exp イベントオブジェクトの予想(targetは指定しなくてよい)
	 */
	function checkEv(ev, exp) {
		// イベントオブジェクトのチェック
		// targetはitemなので、
		exp.target = this;
		deepEqual(ev, exp, 'イベントオブジェクトに正しくnewValue,oldValueが格納されていること。');
	}

	module('ObservableItem depend');

	//=============================
	// Body
	//=============================
	test(
			'ObservableItem生成時にdepend.calcが実行されてdepend指定項目の値が計算されること',
			8,
			function() {
				var eventObj;
				var count = 0;
				var context = null;
				var item = h5.core.data
						.createObservableItem({
							v1: {
								defaultValue: 'v1'
							},
							v2: {
								type: 'string',
								depend: {
									on: 'v1',
									calc: function(ev) {
										eventObj = ev;
										context = this;
										ok(!count, 'create時にcalcが1回呼ばれること');
										strictEqual(this.get('v1'), 'v1',
												'onに指定したプロパティをgetすると、defaultValueの値が取得できること');
										strictEqual(this.get('v3'), 'v3',
												'onに指定していないプロパティをgetすると、defaultValueの値が取得できるること');
										strictEqual(this.get('v2'), undefined,
												'このdependが設定されている項目の値はundefinedであること');
										// イベントオブジェクトのチェック
										deepEqual(eventObj, {
											props: {
												v1: {
													newValue: 'v1',
													oldValue: undefined
												},
												v3: {
													newValue: 'v3',
													oldValue: undefined
												},
												v4: {
													newValue: 'v4',
													oldValue: undefined
												}
											},
											type: 'create',
											target: this
										},
												'イベントオブジェクトに正しくnewValue,oldValueが格納されていること。create時はoldValueはどのプロパティについてもundefinedであること。');
										count++;
										return this.get('v1') + 'a';
									}
								}
							},
							v3: {
								defaultValue: 'v3'
							},
							v4: {
								defaultValue: 'v4'
							}
						});

				// thisのチェック
				strictEqual(context, item, 'calc内のthisは生成されるitemインスタンスと同じインスタンスであること');

				// 値のチェック
				strictEqual(item.get('v1'), 'v1', 'depend指定のないプロパティにdefaultValue値が入っていること');
				strictEqual(item.get('v2'), 'v1a', 'depend指定したプロパティに、計算済みの値が入っていること');
			});


	test('setで値の変更があった場合にdepend.calcが実行され、値が更新されること', 4, function() {
		var expectEvObj = {};
		var checkEvFlag = false;
		var item = h5.core.data.createObservableItem({
			v1: {
				defaultValue: 'v1'
			},
			v2: {
				type: 'string',
				depend: {
					on: ['v1', 'v3'],
					calc: function(ev) {
						if (checkEvFlag) {
							checkEv.apply(this, [ev, expectEvObj]);
							checkEvFlag = false;
						}
						var v1 = this.get('v1');
						var v3 = this.get('v3');
						return v1 + v3;
					}
				}
			},
			v3: {
				defaultValue: 'v3'
			}
		});

		// 依存する2つの項目を書き換え
		// 予想されるeventObject
		expectEvObj = {
			props: {
				v1: {
					newValue: 'v11',
					oldValue: 'v1'
				},
				v3: {
					newValue: 'v33',
					oldValue: 'v3'
				}
			},
			type: 'change'
		};
		checkEvFlag = true;
		item.set({
			v1: 'v11',
			v3: 'v33'
		});
		strictEqual(item.get('v2'), 'v11v33', 'depend先の項目を変えると値が反映されること');

		// テストの成功失敗に関わらず、次のテストでoldValueを同じにするため、setする
		item.set({
			v1: 'test1',
			v3: 'test3'
		});

		// 依存する2つの項目のうち、1つを書き換え
		// 予想されるeventObject
		expectEvObj = {
			props: {
				v1: {
					newValue: 'v111',
					oldValue: 'test1'
				}
			},
			type: 'change'
		};
		checkEvFlag = true;
		item.set({
			v1: 'v111'
		});
		strictEqual(item.get('v2'), 'v111test3', 'depend先の項目を変えると値が反映されること');

		// テストの成功失敗に関わらず、次のテストでoldValueを同じにするため、setする
		item.set({
			v1: 'test11',
			v3: 'test33'
		});

		// 依存する2つの項目をcreateで書き換え
		// 予想されるeventObject
		expectEvObj = {
			props: {
				v1: {
					newValue: 'V1',
					oldValue: 'test11'
				},
				v3: {
					newValue: 'V3',
					oldValue: 'test33'
				}
			},
			type: 'change'
		};
	});

	test(
			'type[]指定されているときにcalcが配列を返したら、ObservableArrayとして格納されること',
			34,
			function() {
				// 型指定とdependのあるモデルを作成
				var item = h5.core.data.createObservableItem({
					id: {
						id: true
					},
					testSA: {
						type: 'string[]',
						depend: {
							on: 'sa',
							calc: function() {
								return this.get('sa');
							}
						}
					},
					sa: {
						type: 'string[]'
					},
					testIA: {
						type: 'integer[]',
						depend: {
							on: 'ia',
							calc: function() {
								return this.get('ia');
							}
						}
					},
					ia: {},
					testNA: {
						type: 'number[]',
						depend: {
							on: 'na',
							calc: function() {
								return this.get('na');
							}
						}
					},
					na: {},
					testBA: {
						type: 'boolean[]',
						depend: {
							on: 'ba',
							calc: function() {
								return this.get('ba');
							}
						}
					},
					ba: {},
					testAA: {
						type: 'any[]',
						depend: {
							on: 'aa',
							calc: function() {
								return this.get('aa');
							}
						}
					},
					aa: {}
				});

				// string
				ok(h5.core.data.isObservableArray(item.get('testSA')),
						'【type:string[]】calcがnullを返した時、ObservableArrayであること');
				ok(item.get('testSA').equals([]), '中身は空であること');

				item.set('sa', []);
				ok(h5.core.data.isObservableArray(item.get('testSA')),
						'calcが[]を返したらObservableArrayに変換されること');

				var instance = item.get('testSA');

				item.set('sa', ['ABCDE', 'abcde']);
				ok(item.get('testSA').equals(['ABCDE', 'abcde']),
						'calcが["ABCDE", "abcde"]を返した時、ObservableArrayに変換されて格納されること');
				ok(item.get('testSA') === instance, 'インスタンスは変わっていないこと');

				item.set('sa', [null]);
				ok(item.get('testSA').equals([null]),
						'calcが[null]を返した時、ObservableArrayに変換されて格納されること');

				item.set('sa', undefined);
				ok(item.get('testSA').equals([]),
						'calcがundefinedを返した時、空のObservableArrayに変換されて格納されること');

				// integer
				ok(h5.core.data.isObservableArray(item.get('testIA')),
						'【type:integer[]】 calcがnullを返した時、ObservableArrayであること');
				ok(item.get('testIA').equals([]), '中身は空であること');

				item.set('ia', []);
				ok(h5.core.data.isObservableArray(item.get('testIA')),
						'integer[] calcが[]を返したらObservableArrayに変換されること');

				instance = item.get('testIA');

				item.set('ia', [1, 2, 3]);
				ok(item.get('testIA').equals([1, 2, 3]),
						'calcが[1, 2, 3]を返した時、ObservableArrayに変換されて格納されること');
				ok(item.get('testIA') === instance, 'インスタンスは変わっていないこと');

				item.set('ia', [null]);
				ok(item.get('testIA').equals([null]),
						'calcが[null]を返した時、ObservableArrayに変換されて格納されること');

				item.set('ia', undefined);
				ok(item.get('testIA').equals([]),
						'calcがundefinedを返した時、空のObservableArrayに変換されて格納されること');

				// number
				ok(h5.core.data.isObservableArray(item.get('testNA')),
						'【type:number[]】 calcがnullを返した時、ObservableArrayであること');
				ok(item.get('testIA').equals([]), '中身は空であること');

				item.set('na', []);
				ok(h5.core.data.isObservableArray(item.get('testNA')),
						'calcが[]を返したらObservableArrayに変換されること');

				instance = item.get('testIA');

				item.set('na', [1, 2.2, 3, Infinity]);
				ok(item.get('testNA').equals([1, 2.2, 3, Infinity]),
						'calcが[1, 2.2, 3, Infinity]を返した時、ObservableArrayに変換されて格納されること');
				ok(item.get('testIA') === instance, 'インスタンスは変わっていないこと');

				item.set('na', [null, null]);
				ok(item.get('testNA').equals([null, null]),
						'calcが[null,null]を返した時、ObservableArrayに変換されて格納されること');

				item.set('na', undefined);
				ok(item.get('testNA').equals([]),
						'calcがundefinedを返した時、空のObservableArrayに変換されて格納されること');

				// boolean
				ok(h5.core.data.isObservableArray(item.get('testBA')),
						'【type:boolean[]】 calcがnullを返した時、ObservableArrayであること');
				ok(item.get('testBA').equals([]), '中身は空であること');

				item.set('ba', []);
				ok(h5.core.data.isObservableArray(item.get('testBA')),
						'calcが[]を返したらObservableArrayに変換されること');

				instance = item.get('testIA');

				item.set('ba', [true, false]);
				ok(item.get('testBA').equals([true, false]),
						'calcが[true, false]を返した時、ObservableArrayに変換されて格納されること');
				ok(item.get('testIA') === instance, 'インスタンスは変わっていないこと');

				item.set('ba', [null, true]);
				ok(item.get('testBA').equals([null, true]),
						'calcが[null,true]を返した時、ObservableArrayに変換されて格納されること');

				item.set('ba', undefined);
				ok(item.get('testBA').equals([]),
						'calcがundefinedを返した時、空のObservableArrayに変換されて格納されること');

				// any
				ok(h5.core.data.isObservableArray(item.get('testAA')),
						'【type:any[]】 calcがnullを返した時、ObservableArrayであること');
				ok(item.get('testAA').equals([]), '中身は空であること');

				item.set('aa', []);
				ok(h5.core.data.isObservableArray(item.get('testAA')),
						'calcが[]を返したらObservableArrayに変換されること');

				instance = item.get('testIA');

				var ary = [3, {
					a: 3
				}, true, null, new Date(), item];

				item.set('aa', ary);
				ok(item.get('testAA').equals(ary),
						'calcが[3, {a: 3}, true, null, new Date(), object]を返した時、ObservableArrayに変換されて格納されること');
				ok(item.get('testIA') === instance, 'インスタンスは変わっていないこと');

				item.set('aa', undefined);
				ok(item.get('testAA').equals([]),
						'calcがundefinedを返した時、空のObservableArrayに変換されて格納されること');

			});
	test('setで値の変更がない場合はdepend.calcは実行されないこと', 2, function() {
		var item = h5.core.data.createObservableItem({
			id: {
				id: true
			},
			v1: {},
			v2: {
				type: 'string',
				depend: {
					on: 'v1',
					calc: function(ev) {
						return this.get('v1') + 'a';
					}
				}
			},
			v3: {},
			v4: {}
		});

		// 関係ない値を更新
		count = 0;
		item.set({
			v3: 'v33',
			v4: 'v44'
		});
		ok(count === 0, 'onに指定されていない値を更新してもcalcは実行されない');

		// 値の変更がないset
		count = 0;
		item.set({
			v1: item.get('v1')
		});
		ok(count === 0, 'set時に値の変更ない場合calcは実行されない');
	});

	test('依存先プロパティがさらに別のプロパティに依存している場合でも正しく値が計算されること', 14, function() {
		var expectEvObj = {
			props: {
				v1: {
					newValue: 'v1',
					oldValue: undefined
				},
				v4: {
					newValue: null,
					oldValue: undefined
				},
				v5: {
					newValue: null,
					oldValue: undefined
				}
			},
			type: 'create'
		};
		var executed = [];
		var checkEvFlag = true;
		var item = h5.core.data.createObservableItem({
			v1: {
				defaultValue: 'v1'
			},
			v2: {
				type: 'string',
				depend: {
					on: ['v3', 'v5'],
					calc: function(ev) {
						executed.push('v2');
						if (checkEvFlag) {
							checkEv.apply(this, [ev, $.extend({}, expectEvObj)]);
						}
						var v1 = this.get('v1');
						var v3 = this.get('v3');
						var v5 = this.get('v5');
						return v1 + v3 + v5;
					}
				}
			},
			v3: {
				depend: {
					on: ['v1', 'v4'],
					calc: function(ev) {
						executed.push('v3');
						if (checkEvFlag) {
							checkEv.apply(this, [ev, $.extend({}, expectEvObj)]);
						}
						var v1 = this.get('v1');
						var v4 = this.get('v4');
						return v1 + v4;
					}
				}
			},
			v4: {},
			v5: {}
		});

		deepEqual(executed, ['v3', 'v2'], '依存関係の順番通りにcalcが実行されていること');
		strictEqual(item.get('v3'), 'v1null', '正しく値が計算されて格納されていること');
		strictEqual(item.get('v2'), 'v1v1nullnull', '正しく値が計算されて格納されていること');

		// set
		executed = [];
		expectEvObj = {
			props: {
				v4: {
					newValue: 'v44',
					oldValue: null
				}
			},
			type: 'change'
		};
		item.set({
			v4: 'v44'
		});
		deepEqual(executed, ['v3', 'v2'], '変更されたプロパティに依存するプロパティのcalcが依存関係順に実行されていること');
		strictEqual(item.get('v3'), 'v1v44', '正しく値が計算されて格納されていること');
		strictEqual(item.get('v2'), 'v1v1v44null', '正しく値が計算されて格納されていること');

		executed = [];
		expectEvObj = {
			props: {
				v5: {
					newValue: 'v55',
					oldValue: null
				}
			},
			type: 'change'
		};
		item.set({
			v5: 'v55'
		});
		deepEqual(executed, ['v2'], '変更されたプロパティに依存するプロパティのcalcが依存関係順に実行されていること');
		strictEqual(item.get('v3'), 'v1v44', '正しく値が計算されて格納されていること');
		strictEqual(item.get('v2'), 'v1v1v44v55', '正しく値が計算されて格納されていること');
	});

	test('depend指定されている項目にsetできないこと', 6, function() {
		var item = h5.core.data.createObservableItem({
			v1: {},
			v2: {
				depend: {
					on: 'v1',
					calc: function(ev) {
						return this.get('v1') + 'a';
					}
				}
			}
		});

		try {
			item.set('v2', 'v2');
			ok(false, 'テスト失敗。depend指定された項目にsetしてエラーが発生しませんでした');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_DEPEND_PROPERTY, e.message);
			strictEqual(item.get('v1'), null, 'setでエラーが起きたら、ObservableItemの中身は変わらないこと');
			strictEqual(item.get('v2'), 'nulla', 'setでエラーが起きたら、ObservableItemの中身は変わらないこと');
		}

		try {
			item.set({
				v1: 'v1',
				v2: 'v2'
			});
			ok(false, 'テスト失敗。depend指定された項目にsetしてエラーが発生しませんでした');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_DEPEND_PROPERTY, e.message);
			strictEqual(item.get('v1'), null, 'setでエラーが起きたら、ObservableItemの中身は変わらないこと');
			strictEqual(item.get('v2'), 'nulla', 'setでエラーが起きたら、ObservableItemの中身は変わらないこと');
		}
	});

	test('depend.calcが指定された型と違う値を返したら、エラーになること（自動型変換はされません）', 15, function() {
		// 型指定とdependのあるモデルを作成
		var item = h5.core.data.createObservableItem({
			testS: {
				type: 'string',
				depend: {
					on: 's',
					calc: function() {
						return this.get('s');
					}
				}
			},
			s: {
				defaultValue: 's'
			},
			testI1: {
				type: 'integer',
				depend: {
					on: 'i',
					calc: function() {
						return this.get('i');
					}
				}
			},
			i: {
				defaultValue: 1
			},
			testN: {
				type: 'number',
				depend: {
					on: 'n',
					calc: function() {
						return this.get('n');
					}
				}
			},
			n: {
				defaultValue: 1.2
			},
			testB: {
				type: 'boolean',
				depend: {
					on: 'b',
					calc: function() {
						return this.get('b');
					}
				}
			},
			b: {
				defaultValue: false
			},
			testSA: {
				type: 'string[]',
				depend: {
					on: 'sa',
					calc: function() {
						return this.get('sa');
					}
				}
			},
			sa: {
				defaultValue: []
			},
			testIA: {
				type: 'integer[]',
				depend: {
					on: 'ia',
					calc: function() {
						return this.get('ia');
					}
				}
			},
			ia: {
				defaultValue: []
			},
			testNA: {
				type: 'number[]',
				depend: {
					on: 'na',
					calc: function() {
						return this.get('na');
					}
				}
			},
			na: {
				defaultValue: []
			},
			testBA: {
				type: 'boolean[]',
				depend: {
					on: 'ba',
					calc: function() {
						return this.get('ba');
					}
				}
			},
			ba: {
				defaultValue: []
			}
		});

		var failMsg = 'テスト失敗。type:{0} の要素のdepend.calcが{1}を返したのにエラーが発生していません';
		try {
			item.set('s', 1);
			ok(false, h5.u.str.format(failMsg, 'string', '数値の1'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('s', new String('TEST'));
			ok(false, h5.u.str.format(failMsg, 'string', 'Stringラッパークラス'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('i', 'a');
			ok(false, h5.u.str.format(failMsg, 'integer', '文字列"a"'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('i', '1');
			ok(false, h5.u.str.format(failMsg, 'integer', '文字列"1"'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('i', new Number(1));
			ok(false, h5.u.str.format(failMsg, 'integer', 'new Number(1)'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('i', new Number(1));
			ok(false, h5.u.str.format(failMsg, 'integer', 'new String(1)'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('n', 'a');
			ok(false, h5.u.str.format(failMsg, 'number', '文字列"a"'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('n', '1');
			ok(false, h5.u.str.format(failMsg, 'number', '文字列"1"'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('n', new Number(1));
			ok(false, h5.u.str.format(failMsg, 'number', 'new Number(1)'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('n', new Number(1));
			ok(false, h5.u.str.format(failMsg, 'number', 'new String(1)'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('b', new Boolean(true));
			ok(false, h5.u.str.format(failMsg, 'boolean', 'new Boolean(true)'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('sa', [new String('ABCDE')]);
			ok(false, h5.u.str.format(failMsg, 'string[]', '[new String("ABCDE")]'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('ia', [new Number(1)]);
			ok(false, h5.u.str.format(failMsg, 'integer[]', '[new Number(1)]'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('na', [new Number(1)]);
			ok(false, h5.u.str.format(failMsg, 'number[]', '[new Number(1)]'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('ba', [new Boolean(true)]);
			ok(false, h5.u.str.format(failMsg, 'boolean[]', '[new Boolean(true)]'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
	});

	test('calcの返す値の制約チェックが行われること (type: number, number[], integer, integer[])', 29, function() {
		var constraint = {
			notNull: true,
			min: -1,
			max: 2
		};
		var item = h5.core.data.createObservableItem({
			id: {
				id: true
			},
			num: {
				type: 'number',
				constraint: constraint,
				depend: {
					on: 'n',
					calc: function() {
						return this.get('n');
					}
				}
			},
			numA: {
				type: 'number[]',
				constraint: constraint,
				depend: {
					on: 'na',
					calc: function() {
						return this.get('na');
					}
				}
			},
			int: {
				type: 'integer',
				constraint: constraint,
				depend: {
					on: 'i',
					calc: function() {
						return this.get('i');
					}
				}
			},
			intA: {
				type: 'integer[]',
				constraint: constraint,
				depend: {
					on: 'ia',
					calc: function() {
						return this.get('ia');
					}
				}
			},
			n: {
				defaultValue: 0
			},
			i: {
				defaultValue: 0
			},
			na: {
				defaultValue: []
			},
			ia: {
				defaultValue: []
			}
		});

		ok(true, 'notNull:true, min:-1, max:2 の複合条件を持つプロパティを持つObservableItemを作成できること');
		var values = [null, -2, -1, 0, 1, 2, 3];
		var propTypes = ['number', 'number[]', 'integer', 'integer[]'];
		var props = ['n', 'na', 'i', 'ia'];
		for ( var i = 0, l = values.length; i < l; i++) {
			for ( var j = 0, len = props.length; j < len; j++) {
				var descriptor = {};
				var v = propTypes[j].indexOf('[]') > -1 ? [values[i]] : values[i];
				descriptor[props[j]] = v;
				var vStr = $.isArray(v) ? '[' + v[0] + ']' : v;
				var condition = !!(values[i] !== null && -1 <= values[i] && values[i] <= 2);
				try {
					item.set(descriptor);
					ok(condition, h5.u.str.format(
							'type:{0}, 値{1} はnotNull, min, max すべての条件を満たすのでエラーでない', propTypes[j],
							vStr));
				} catch (e) {
					ok(!condition, h5.u.str.format(
							'type:{0}, 値{1} はnotNull, min, max いずれかの条件を満たさないのでエラー', propTypes[j],
							vStr));
				}
			}
		}
	});

	test('depend指定された項目の値が変更された場合、changeイベントオブジェクトから古い値と新しい値を取得できること', 1, function() {
		var item = h5.core.data.createObservableItem({
			num: {
				type: 'number',
				depend: {
					on: 'n',
					calc: function() {
						return this.get('n') * 2;
					}
				}
			},
			n: {
				type: 'number',
				defaultValue: 1
			}
		});
		item.addEventListener('change', function(ev) {
			deepEqual(ev.props.num, {
				oldValue: 2,
				newValue: 4
			});
		});
		item.set('n', 2);
	});

	//=============================
	// Definition
	//=============================
	var itemEventOrder = [];
	module('ObservableItem EventListener', {
		itemEventListener: function(e) {
			itemEventOrder.push(e);
		}
	});

	//=============================
	// Body
	//=============================
	test('setでNaNのものにNaNをセットした時にはイベントハンドラは実行されないこと', 2, function() {
		var item = h5.core.data.createObservableItem({
			val: {
				defaultValue: NaN
			},
			ary: {
				type: 'any[]',
				defaultValue: [1, NaN, 3]
			}
		});
		item.addEventListener('change', this.itemEventListener);

		itemEventOrder = [];
		item.set('val', NaN);
		deepEqual(itemEventOrder, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		itemEventOrder = [];
		item.set('ary', [1, NaN, 3]);
		deepEqual(itemEventOrder, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');
	});

	//=============================
	// Definition
	//=============================
	var regardsTestReturnValue = null;
	module('ObservableItem.regardAsNull', {
		regardsTestSchema: {
			string: {
				type: 'string'
			},
			number: {
				type: 'number'
			},
			integer: {
				type: 'integer'
			},
			boolean: {
				type: 'boolean'
			},
			'enum': {
				type: 'enum',
				enumValue: [1]
			},
			any: {
				type: 'any'
			},
			stringAr: {
				type: 'string[]'
			},
			numberAr: {
				type: 'number[]'
			},
			integerAr: {
				type: 'integer[]'
			},
			booleanAr: {
				type: 'boolean[]'
			},
			enumAr: {
				type: 'enum[]',
				enumValue: [1]
			},
			anyAr: {
				type: 'any[]'
			},
			string2: {
				type: 'string',
				defaultValue: 'a'
			},
			number2: {
				type: 'number',
				defaultValue: 1.5
			},
			integer2: {
				type: 'integer',
				defaultValue: 1
			},
			boolean2: {
				type: 'boolean',
				defaultValue: false
			},
			enum2: {
				type: 'enum',
				enumValue: [1],
				defaultValue: 1
			},
			any2: {
				type: 'any',
				defaultValue: $('<div></div>')
			},
			stringAr2: {
				type: 'string[]',
				defaultValue: ['A', 'B']
			},
			numberAr2: {
				type: 'number[]',
				defaultValue: [10.2, 3.55]
			},
			integerAr2: {
				type: 'integer[]',
				defaultValue: [12]
			},
			booleanAr2: {
				type: 'boolean[]',
				defaultValue: [false, true]
			},
			enumAr2: {
				type: 'enum[]',
				enumValue: [1],
				defaultValue: [1, 1]
			},
			anyAr2: {
				type: 'any[]',
				defaultValue: [window]
			}
		},
		regardsTestDependSchema: {
			dS: {
				type: 'string',
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dS;
					}
				}
			},
			dI: {
				type: 'integer',
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dI;
					}
				}
			},
			dN: {
				type: 'number',
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dN;
					}
				}
			},
			dB: {
				type: 'boolean',
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dB;
					}
				}
			},
			dE: {
				type: 'enum',
				enumValue: [1, 2],
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dE;
					}
				}
			},
			dA: {
				type: 'any',
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dA;
					}
				}
			},
			dSA: {
				type: 'string[]',
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dSA;
					}
				}
			},
			dIA: {
				type: 'integer[]',
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dIA;
					}
				}
			},
			dNA: {
				type: 'number[]',
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dNA;
					}
				}
			},
			dBA: {
				type: 'boolean[]',
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dBA;
					}
				}
			},
			dEA: {
				type: 'enum[]',
				enumValue: [1, 2],
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dEA;
					}
				}
			},
			dAA: {
				type: 'any[]',
				depend: {
					on: 'on',
					calc: function() {
						return regardsTestReturnValue.dAA;
					}
				}
			},
			on: null
		}
	});

	//=============================
	// Body
	//=============================

	test('生成直後のObservableItemに対してregardAsNull()を実行する', 22, function() {
		var item = h5.core.data.createObservableItem(this.regardsTestSchema);
		equal(item.regardAsNull('string'), true, 'type:string');
		equal(item.regardAsNull('number'), true, 'type:number');
		equal(item.regardAsNull('integer'), true, 'type:integer');
		equal(item.regardAsNull('boolean'), true, 'type:boolean');
		equal(item.regardAsNull('enum'), true, 'type:enum');
		equal(item.regardAsNull('any'), true, 'type:any');
		equal(item.regardAsNull('stringAr'), true, 'type:string[]');
		equal(item.regardAsNull('numberAr'), true, 'type:number[]');
		equal(item.regardAsNull('integerAr'), true, 'type:integer[]');
		equal(item.regardAsNull('enumAr'), true, 'type:enum[]');
		equal(item.regardAsNull('anyAr'), true, 'type:any[]');
		equal(item.regardAsNull('string2'), false, 'type:string defaultValueあり');
		equal(item.regardAsNull('number2'), false, 'type:number defaultValueあり');
		equal(item.regardAsNull('integer2'), false, 'type:integer defaultValueあり');
		equal(item.regardAsNull('boolean2'), false, 'type:boolean defaultValueあり');
		equal(item.regardAsNull('enum2'), false, 'type:enum defaultValueあり');
		equal(item.regardAsNull('any2'), false, 'type:any defaultValueあり');
		equal(item.regardAsNull('stringAr2'), false, 'type:string[] defaultValueあり');
		equal(item.regardAsNull('numberAr2'), false, 'type:number[] defaultValueあり');
		equal(item.regardAsNull('integerAr2'), false, 'type:integer[] defaultValueあり');
		equal(item.regardAsNull('enumAr2'), false, 'type:enum[] defaultValueあり');
		equal(item.regardAsNull('anyAr2'), false, 'type:any[] defaultValueあり');
	});

	test('値を更新したObservableItemに対してregardAsNull()を実行する', 22, function() {
		var item = h5.core.data.createObservableItem(this.regardsTestSchema);
		item.set('string', 'A');
		equal(item.regardAsNull('string'), false, 'type:string');
		item.set('number', 8.9);
		equal(item.regardAsNull('number'), false, 'type:number');
		item.set('integer', 80);
		equal(item.regardAsNull('integer'), false, 'type:integer');
		item.set('boolean', false);
		equal(item.regardAsNull('boolean'), false, 'type:boolean');
		item.set('enum', 1);
		equal(item.regardAsNull('enum'), false, 'type:enum');
		item.set('any', $('<div></div>'));
		equal(item.regardAsNull('any'), false, 'type:any');
		item.set('stringAr', ['A']);
		equal(item.regardAsNull('stringAr'), false, 'type:string[]');
		item.set('numberAr', [10.2]);
		equal(item.regardAsNull('numberAr'), false, 'type:number[]');
		item.set('integerAr', [90]);
		equal(item.regardAsNull('integerAr'), false, 'type:integer[]');
		item.set('enumAr', [1, 1]);
		equal(item.regardAsNull('enumAr'), false, 'type:enum[]');
		item.set('anyAr', [document]);
		equal(item.regardAsNull('anyAr'), false, 'type:any[]');
		item.set('string2', null);

		equal(item.regardAsNull('string2'), true, 'type:string defaultValueあり');
		item.set('number2', null);
		equal(item.regardAsNull('number2'), true, 'type:number defaultValueあり');
		item.set('integer2', null);
		equal(item.regardAsNull('integer2'), true, 'type:integer defaultValueあり');
		item.set('boolean2', null);
		equal(item.regardAsNull('boolean2'), true, 'type:boolean defaultValueあり');
		item.set('enum2', null);
		equal(item.regardAsNull('enum2'), true, 'type:enum defaultValueあり');
		item.set('any2', null);
		equal(item.regardAsNull('any2'), true, 'type:any defaultValueあり');
		item.set('stringAr2', null);
		equal(item.regardAsNull('stringAr2'), true, 'type:string[] defaultValueあり');
		item.set('numberAr2', null);
		equal(item.regardAsNull('numberAr2'), true, 'type:number[] defaultValueあり');
		item.set('integerAr2', null);
		equal(item.regardAsNull('integerAr2'), true, 'type:integer[] defaultValueあり');
		item.set('enumAr2', null);
		equal(item.regardAsNull('enumAr2'), true, 'type:enum[] defaultValueあり');
		item.set('anyAr2', null);
		equal(item.regardAsNull('anyAr2'), true, 'type:any[] defaultValueあり');
	});

	test('depend項目に対してcalcがnullを返すとき、regardAsNull()はtrueを返すこと', 12, function() {
		regardsTestReturnValue = {
			dS: null,
			dN: null,
			dI: null,
			dB: null,
			dE: null,
			dA: null,
			dSA: null,
			dNA: null,
			dIA: null,
			dBA: null,
			dEA: null,
			dAA: null
		};
		var item = h5.core.data.createObservableItem(this.regardsTestDependSchema);
		equal(item.regardAsNull('dS'), true, 'type:string');
		equal(item.regardAsNull('dN'), true, 'type:number');
		equal(item.regardAsNull('dI'), true, 'type:integer');
		equal(item.regardAsNull('dB'), true, 'type:boolean');
		equal(item.regardAsNull('dE'), true, 'type:enum');
		equal(item.regardAsNull('dA'), true, 'type:any');
		equal(item.regardAsNull('dSA'), true, 'type:string[]');
		equal(item.regardAsNull('dNA'), true, 'type:number[]');
		equal(item.regardAsNull('dIA'), true, 'type:integer[]');
		equal(item.regardAsNull('dBA'), true, 'type:boolean[]');
		equal(item.regardAsNull('dEA'), true, 'type:enum[]');
		equal(item.regardAsNull('dAA'), true, 'type:any[]');
	});

	test('depend項目に対してregardAsNull()を実行する。calcがnullを返すときはtrue、calcがnull以外を返すときはfalseを返すこと', 36,
			function() {

				regardsTestReturnValue = {
					dS: null,
					dN: null,
					dI: null,
					dB: null,
					dE: null,
					dA: null,
					dSA: null,
					dNA: null,
					dIA: null,
					dBA: null,
					dEA: null,
					dAA: null
				};
				var item = h5.core.data.createObservableItem(this.regardsTestDependSchema);
				equal(item.regardAsNull('dS'), true, 'calcがnullをreturn type:string');
				equal(item.regardAsNull('dN'), true, 'calcがnullをreturn type:number');
				equal(item.regardAsNull('dI'), true, 'calcがnullをreturn type:integer');
				equal(item.regardAsNull('dB'), true, 'calcがnullをreturn type:boolean');
				equal(item.regardAsNull('dE'), true, 'calcがnullをreturn type:enum');
				equal(item.regardAsNull('dA'), true, 'calcがnullをreturn type:any');
				equal(item.regardAsNull('dSA'), true, 'calcがnullをreturn type:string[]');
				equal(item.regardAsNull('dNA'), true, 'calcがnullをreturn type:number[]');
				equal(item.regardAsNull('dIA'), true, 'calcがnullをreturn type:integer[]');
				equal(item.regardAsNull('dBA'), true, 'calcがnullをreturn type:boolean[]');
				equal(item.regardAsNull('dEA'), true, 'calcがnullをreturn type:enum[]');
				equal(item.regardAsNull('dAA'), true, 'calcがnullをreturn type:any[]');

				regardsTestReturnValue = {
					dS: 'a',
					dN: 1,
					dI: 1,
					dB: true,
					dE: 1,
					dA: 1,
					dSA: ['a'],
					dNA: [1],
					dIA: [1],
					dBA: [true],
					dEA: [1],
					dAA: [1]
				};
				item.set('on', 1);
				equal(item.regardAsNull('dS'), false, 'calcがnull以外をreturn type:string');
				equal(item.regardAsNull('dN'), false, 'calcがnull以外をreturn type:number');
				equal(item.regardAsNull('dI'), false, 'calcがnull以外をreturn type:integer');
				equal(item.regardAsNull('dB'), false, 'calcがnull以外をreturn type:boolean');
				equal(item.regardAsNull('dE'), false, 'calcがnull以外をreturn type:enum');
				equal(item.regardAsNull('dA'), false, 'calcがnull以外をreturn type:any');
				equal(item.regardAsNull('dSA'), false, 'calcがnull以外をreturn type:string[]');
				equal(item.regardAsNull('dNA'), false, 'calcがnull以外をreturn type:number[]');
				equal(item.regardAsNull('dIA'), false, 'calcがnull以外をreturn type:integer[]');
				equal(item.regardAsNull('dBA'), false, 'calcがnull以外をreturn type:boolean[]');
				equal(item.regardAsNull('dEA'), false, 'calcがnull以外をreturn type:enum[]');
				equal(item.regardAsNull('dAA'), false, 'calcがnull以外をreturn type:any[]');

				// regardAsNullの結果が切り替わるかどうか、再度nullをreturnさせてテスト
				regardsTestReturnValue = {
					dS: null,
					dN: null,
					dI: null,
					dB: null,
					dE: null,
					dA: null,
					dSA: null,
					dNA: null,
					dIA: null,
					dBA: null,
					dEA: null,
					dAA: null
				};
				item.set('on', 2);
				equal(item.regardAsNull('dS'), true, 'calcがnullをreturn type:string');
				equal(item.regardAsNull('dN'), true, 'calcがnullをreturn type:number');
				equal(item.regardAsNull('dI'), true, 'calcがnullをreturn type:integer');
				equal(item.regardAsNull('dB'), true, 'calcがnullをreturn type:boolean');
				equal(item.regardAsNull('dE'), true, 'calcがnullをreturn type:enum');
				equal(item.regardAsNull('dA'), true, 'calcがnullをreturn type:any');
				equal(item.regardAsNull('dSA'), true, 'calcがnullをreturn type:string[]');
				equal(item.regardAsNull('dNA'), true, 'calcがnullをreturn type:number[]');
				equal(item.regardAsNull('dIA'), true, 'calcがnullをreturn type:integer[]');
				equal(item.regardAsNull('dBA'), true, 'calcがnullをreturn type:boolean[]');
				equal(item.regardAsNull('dEA'), true, 'calcがnullをreturn type:enum[]');
				equal(item.regardAsNull('dAA'), true, 'calcがnullをreturn type:any[]');
			});
});
