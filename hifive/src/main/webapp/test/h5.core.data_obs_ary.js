/*
 * Copyright (C) 2012-2016 NS Solutions Corporation
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
		var inAry = ['a', 'b', 'c'];
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
	module('[browser#ie:-8|ie:9-:docmode=7-9|ie-wp:9:docmode=7]ObservableArray Arrayメソッド 非破壊系(JavaScript1.6以降)');

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
	module('ObservableArrayのイベント');

	//=============================
	// Body
	//=============================
	test('changeBeforeイベント', 7, function() {
		var o = h5.core.data.createObservableArray();
		var evObj = null;
		var context = null;
		var current = null;
		function l(ev) {
			evObj = ev;
			context = this;
			current = this.toArray();
		}
		o.addEventListener('changeBefore', l);
		o.push('a');
		ok(evObj, 'changeBeforeイベントハンドラが実行されること');
		strictEqual(evObj.type, 'changeBefore', 'イベントオブジェクトのtypeがchangeBeforeであること');
		strictEqual(evObj.method, 'push', 'イベントオブジェクトのtypeがpsuhであること');
		strictEqual(evObj.target, o, 'イベントオブジェクトのtargetがObservableArrayであること');
		strictEqual(evObj.args[0], 'a', 'イベントオブジェクトのargsが引数であること');
		strictEqual(context, o, 'イベントハンドラ内のthisはObservableArrayであること');
		deepEqual(current, [], 'イベントハンドラ内ではまだObservableArrayの中身に変更はないこと');
	});

	test('changeイベント', 8, function() {
		var o = h5.core.data.createObservableArray();
		var evObj = null;
		var context = null;
		var current = null;
		function l(ev) {
			evObj = ev;
			context = this;
			current = this.toArray();
		}
		o.addEventListener('change', l);
		var ret = o.push('a');
		ok(evObj, 'changeイベントハンドラが実行されること');
		strictEqual(evObj.type, 'change', 'イベントオブジェクトのtypeがchangeであること');
		strictEqual(evObj.method, 'push', 'イベントオブジェクトのtypeがpsuhであること');
		strictEqual(evObj.target, o, 'イベントオブジェクトのtargetがObservableArrayであること');
		strictEqual(evObj.args[0], 'a', 'イベントオブジェクトのargsが引数であること');
		strictEqual(evObj.returnValue, ret, 'イベントオブジェクトのreturnValueがメソッドの戻り値' + ret + 'であること');
		strictEqual(context, o, 'イベントハンドラ内のthisはObservableArrayであること');
		deepEqual(current, ['a'], 'イベントハンドラ内でObservableArrayの中身はすでに変更されていること');
	});

	test('changeBeforeイベント内でのpreventDefault', 3, function() {
		var o = h5.core.data.createObservableArray();
		var changeEv = null;
		function changeBefore(ev) {
			ev.preventDefault();
		}
		function change(ev) {
			changeEv = ev;
		}
		o.addEventListener('changeBefore', changeBefore);
		o.addEventListener('change', change);
		var ret = o.push('a');
		deepEqual(o.toArray(), [], 'changeBeforeイベントハンドラでpreventDefaultした場合は中身が変更されないこと');
		strictEqual(changeEv, null, 'changeBeforeイベントハンドラでpreventDefaultした場合はchangeイベントは起きないこと');
		strictEqual(ret, undefined, 'changeBeforeイベントハンドラでpreventDefaultした場合、戻り値はundefinedであること');
	});
});