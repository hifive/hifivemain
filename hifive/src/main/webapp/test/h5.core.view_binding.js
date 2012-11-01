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
	/**
	 * #qunit-fixture
	 */
	var $fixture = $('#qunit-fixture');

	/**
	 * viewインスタンス
	 */
	var view = h5.core.view;

	/**
	 * データバインディングのエラーコード
	 */
	var ERR_BIND = ERRCODE.h5.core.view_binding;

	/**
	 * h5.uiのエラーコード
	 */
	var ERR_U = ERRCODE.h5.u;

	/**
	 * viewのエラーコード
	 */
	var ERR_VIEW = ERRCODE.h5.core.view;

	/**
	 * view
	 */
	var view = h5.core.view.createView();


	$.ajaxSetup({
		async: false
	});

	view.load('template/data-bind.ejs');

	$.ajaxSetup({
		async: true
	});

	//=============================
	// Functions
	//=============================

	/**
	 * 引数に指定された値をdata-h5-bind属性に持つspan要素を作って返す
	 */
	function createBindSpan(p) {
		return $('<span data-h5-bind="' + p + '">');
	}

	/**
	 * DataItemとObservableItemで同じテストをするための関数
	 * 引数に渡す関数は、引数にitemを取るように書く。このitemがObsItem,DataItemの場合をテストする。
	 *
	 * @param func テストする関数。
	 * @param schema テストするObsItem,DataItemを作るためのスキーマ。id項目についてはDataItem生成時に追加するので、id項目を除いたスキーマを渡す。
	 */
	function testDataItemObsItem(func, schema) {
		// ObservableItemでテスト
		var obsItem = h5.u.obj.createObservableItem(schema);
		func(obsItem);

		// データアイテムでテスト
		var dataSchema = {};
		$.extend(dataSchema, schema, {
			id: {
				id: true
			}
		});

		var manager = h5.core.data.createManager('TestManager');

		var model = manager.createModel({
			name: 'TestModel',
			schema: dataSchema
		});
		var dataItem = model.create({
			id: '1'
		});

		func(dataItem, true);
	}

	/**
	 * #dataBindTest li の中のテキストを配列化したものと、引数に渡されたexpectAryが正しいかどうかテストする関数。 配列のバインドのテストで使用する
	 *
	 * @param {Array} expectAry 結果予想配列
	 * @param {String} message テストメッセージ
	 * @param {String} [selector='li'] チェックする要素のセレクタ。デフォルトはli。
	 */
	function checkTexts(expectAry, message, selector) {
		var sel = selector ? selector : 'li';
		var liTexts = [];
		$('#dataBindTest ' + sel).each(function(i) {
			liTexts.push($(this).text());
		});
		deepEqual(liTexts, expectAry, message);
	}

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================

	module('バインド');

	//=============================
	// Body
	//=============================
	test('data-h5-bind属性に指定した名前のプロパティがバインドできること', function() {
		view.append($fixture, 'bindTest1');
		view.bind($('#dataBindTest', $fixture), {
			test: 'abc',
			test2: 'abcd'
		});
		strictEqual($('#dataBindTest>span').text(), 'abc', 'data-h5-bind指定した要素に値が表示されていること');
		strictEqual($('#dataBindTest>p').text(), 'abcd', 'data-h5-bind指定した要素に値が表示されていること');
		strictEqual($('#dataBindTest>div>pre').text(), 'abcd', 'data-h5-bind指定した要素に値が表示されていること');
	});

	test('data-h5-bind属性の指定してある要素自体にバインドできること', 1, function() {
		view.append($fixture, 'bindSpan');
		view.bind($fixture.find('span'), {
			test: 'test'
		});
		strictEqual($fixture.find('span').text(), 'test', 'data-h5-bind属性を指定している要素自体にバインドされていること');
	});

	test('コンテキストに定義されているプロパティ名を持つデータをバインドする', function() {
		view.append($fixture, 'simple');
		view.bind($('#dataBindTest'), {
			test: 'abc'
		});
		strictEqual($('#dataBindTest>span').text(), 'abc', 'data-h5-bind指定した要素の値が書き変わること');
	});

	test('コンテキストに定義されていないプロパティ名を持つデータをバインドする', function() {
		view.append($fixture, 'simple');

		raises(function(enviroment) {
			view.bind($('#dataBindTest'), {
				test2: 'abcd'
			});
		}, function(actual) {
			return ERR_U.ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY === actual.code;
		}, 'スキーマに存在しないプロパティを指定した場合エラーが発生すること"');
	});

	test('null, undefined, String, Number, Array, Objectが、それぞれ表示されること', function() {
		var ary = [1, 2, 'aa'];
		var obj = {
			a: 'a'
		};
		var func = function() {
			return;
		};

		view.append($fixture, 'variableType');
		view.bind('#dataBindTest', {
			dataNull: null,
			dataUndef: undefined,
			dataStr: 'abc',
			dataNum: -1234.567,
			dataNaN: NaN,
			dataInf: Infinity,
			dataMInf: -Infinity,
			dataAry: ary,
			dataObj: {
				a: 'a'
			},
			dataFunc: func
		});
		var exp = ['', '', 'abc', '-1234.567', 'NaN', 'Infinity', '-Infinity', ary.toString(),
				obj.toString(), ''];
		checkTexts(exp, 'data-h5-bind指定した要素に値が表示されていること', 'span');
	});

	test('HTML文字列を含むような文字列をテキストノードにバインドできること', 2, function() {
		view.append($fixture, 'simple');

		var str = '<a href="aa"></a><!--aa-->';
		view.bind($fixture.find('span'), {
			test: str
		});
		strictEqual($fixture.find('span').text(), str, 'バインドした値が表示されていること');
		strictEqual($fixture.find('a').length, 0, 'バインドした文字列にHTMLタグが含まれていても、テキストノード扱いになっていること');
	});

	test('複数要素にバインドできること', 4, function() {
		view.append($fixture, 'bindSpan');
		view.append($fixture, 'bindSpan');
		var args = [$fixture.find('span'), '#qunit-fixture>span'];
		for ( var i = 0, l = args.length; i < l; i++) {
			try {
				view.bind(args[i], {
					test: 'test'
				});

				var elem = $('#qunit-fixture > span');
				equal(elem.eq(0).text(), 'test');
				equal(elem.eq(1).text(), 'test');
			} catch (e) {
				ok(false, 'エラーが発生したためテスト失敗。');
			}
		}
	});

	test('バインドする要素が存在しない場合は、エラーになること', 3, function() {
		var args = [$fixture.find('#noExist'), '#noExist', $([])];
		for ( var i = 0, l = args.length; i < l; i++) {
			try {
				view.bind(args[i], {
					test: 'test'
				});
				ok(false, 'テスト失敗。エラーが発生していません。');
			} catch (e) {
				strictEqual(e.code, ERR_VIEW.ERR_CODE_BIND_INVALID_TARGET, e.message);
			}
		}
	});

	test('バインドする要素の指定方法はjQueryオブジェクト、DOM、セレクタのどれでもいいこと', function() {
		view.append($fixture, 'bindSpan');
		var strs = ['jQueryオブジェクト', 'DOM', 'セレクタ'];
		for ( var i = 0, l = strs.length; i < l; i++) {
			switch (i) {
			case 0:
				arg = $fixture.find('span');
				break;
			case 1:
				arg = $fixture.find('span')[0];
				break;
			case 2:
				arg = '#qunit-fixture>span';
				break;
			}
			view.bind(arg, {
				test: i
			});
			equal($fixture.find('span').text(), i, strs[i] + 'を引数に指定できること');
		}
	});

	test('バインドする要素の指定に不正な値を渡すとエラーになること', function() {
		view.append($fixture, 'bindSpan');
		var invalids = [$(), null, undefined];
		for ( var i = 0, l = invalids.length; i < l; i++) {
			try {
				view.bind(invalids[i], {
					test: i
				});
				ok(false, 'テスト失敗。エラーが発生していません。' + invalids[i]);
			} catch (e) {
				strictEqual(e.code, ERR_VIEW.ERR_CODE_BIND_INVALID_TARGET, e.message);
			}
		}
	});

	test('バインド指定するものがオブジェクトでない場合はエラーになること', function() {
		view.append($fixture, 'bindSpan');
		var args = [null, undefined, [{}], 1, 'abc', true];
		for ( var i = 0, l = args.length; i < l; i++) {
			try {
				view.bind($fixture.find('span'), args[i]);
				ok(false, 'テスト失敗。エラーが発生していません。' + args[i]);
			} catch (e) {
				strictEqual(e.code, ERR_VIEW.ERR_CODE_BIND_CONTEXT_INVALID, e.message);
			}
		}
	});
	//=============================
	// Definition
	//=============================
	module('オブジェクトのバインド');

	//=============================
	// Body
	//=============================
	test('バインドするオブジェクトの入れ子関係を表せること', function() {
		view.append($fixture, 'objectNest');
		view.bind('#dataBindTest', {
			test: 'TEST',
			obj: {
				test: 'OBJ.TEST',
				test2: 'OBJ.TEST2',
				obj: {
					test: 'OBJ.OBJ.TEST'
				}
			}
		});

		var result = ['TEST', '', 'OBJ.TEST', 'OBJ.TEST2', 'OBJ.OBJ.TEST', ''];
		$('#dataBindTest span').each(function(i) {
			strictEqual($(this).text(), result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
	});

	test('テキスト・HTML・属性・スタイル・クラスにnullをバインドする', function() {
		view.append($fixture, 'object1');
		view.bind('#dataBindTest', {
			obj: null
		});

		var $span = $fixture.find('#dataBindTest span');
		strictEqual($span.text(), '', 'text:空文字が設定されていること');
		strictEqual($span.attr('id'), undefined, 'attr:削除されていること');
		strictEqual($span[0].style.color, '', 'style:何も設定されていないこと');
		strictEqual($span.attr('class'), undefined, 'class:何も設定されていないこと');
	});

	test('値が既に設定されているテキスト・HTML・属性・スタイル・クラスにnullをバインドする', function() {
		view.append($fixture, 'object2');
		view.bind('#dataBindTest', {
			obj: null
		});

		var $span = $fixture.find('#dataBindTest span');
		strictEqual($span.text(), '', 'text:空文字が設定されていること');
		strictEqual($span.attr('id'), undefined, 'attr:削除されていること');
		strictEqual($span[0].style.color, '', 'style:何も設定されていないこと');
		strictEqual($span.attr('class'), undefined, 'class:何も設定されていないこと');
	});

	//=============================
	// Definition
	//=============================
	module('配列のバインド');

	//=============================
	// Body
	//=============================

	test('配列をバインドできること', 1, function() {
		var items = [{
			test: 'a'
		}, {
			test: 'b'
		}];
		view.append($fixture, 'loopContext1');
		view.bind($('#dataBindTest'), {
			test: 'aaa',
			items: items
		});

		var result = ['a', 'b'];
		checkTexts(result, 'data-h5-bind指定した要素に値が表示されていること');
	});

	test('空配列をバインドできること', 1, function() {
		view.append($fixture, 'loopContext1');
		view.bind($('#dataBindTest'), {
			items: []
		});

		strictEqual($('#dataBindTest li').length, 0, '繰り返される要素が一つもないこと');
	});

	test('data-h5-loop-contextに配列、ObservableArray以外のものをバインドした場合はエラーになること', function() {
		var noArys = [{}, $(), function() {}];
		var l = noArys.length;
		for ( var i = 0; i < l; i++) {
			view.append($fixture, 'loopContext1');
			try {
				view.bind($('#dataBindTest'), {
					test: 'aaa',
					items: noArys[i]
				});
				ok(false, 'テスト失敗。エラーが発生してません' + noArys[i]);
			} catch (e) {
				strictEqual(e.code, ERR_BIND.ERR_CODE_INVALID_CONTEXT_SRC, e.message);
			}
			$fixture.find('div').remove();
		}

		try {
			view.bind($('#dataBindTest'), {
				test: 'aaa'
			});
			ok(false, 'テスト失敗。指定無しでエラーが発生してません');
		} catch (e) {
			strictEqual(e.code, ERR_VIEW.ERR_CODE_BIND_INVALID_TARGET, e.message);
		}

		expect(l + 1);
	});

	test('配列の要素のオブジェクトがさらに配列を持つ場合バインドできること', function() {
		var ary = [{
			test: 'A',
			ary: [{
				test: 'A-A'
			}]
		}, {
			test: 'B',
			ary: [{
				test: 'B-A'
			}, {
				test: 'B-B'
			}]
		}];

		view.append($fixture, 'loopContext2');
		view.bind($('#dataBindTest'), {
			items: ary
		});

		strictEqual($('#dataBindTest>ul>li:eq(0)').text(), 'A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)>ul:first>li:eq(0)').text(), 'A-A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)>ul:first>li').length, 1,
				'loop-contextに指定した配列のサイズと同数、DOMが生成されていること');
		strictEqual($('#dataBindTest>ul>li:eq(2)').text(), 'B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(3)>ul:first>li:eq(0)').text(), 'B-A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(3)>ul:first>li:eq(1)').text(), 'B-B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(3)>ul:first>li').length, 2,
				'loop-contextに指定した配列のサイズと同数、DOMが生成されていること');
	});

	test('循環参照を持つ配列をバインドできること', function() {
		var ary = [{
			test: 'A',
			ary: [{
				test: 'A'
			}]

		}, {
			test: 'B',
			ary: [{
				test: 'B-A'
			}, {
				test: 'B-B'
			}]
		}];
		ary[0].ary = ary;
		view.append($fixture, 'loopContext2');
		view.bind($('#dataBindTest'), {
			items: ary
		});

		strictEqual($('#dataBindTest>ul>li:eq(0)').text(), 'A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)>ul>li:eq(0)').text(), 'A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)>ul>li:eq(1)').text(), 'B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)>ul>li').length, ary[0].ary.length,
				'配列の要素数分DOMが生成されること');
		strictEqual($('#dataBindTest>ul>li:eq(2)').text(), 'B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(3)>ul>li:eq(0)').text(), 'B-A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(3)>ul>li:eq(1)').text(), 'B-B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(3)>ul>li').length, ary[1].ary.length,
				'配列の要素数分DOMが生成されること');
	});

	//=============================
	// Definition
	//=============================
	module('ObservableArrayのバインド');

	//=============================
	// Body
	//=============================
	test('ObservableArrayをバインドできること', function() {
		var items = h5.u.obj.createObservableArray();
		items.copyFrom([{
			test: 'a'
		}, {
			test: 'b'
		}]);

		view.append($fixture, 'loopContext1');
		view.bind($('#dataBindTest'), {
			test: 'aaa',
			items: items
		});

		var result = ['a', 'b'];
		checkTexts(result, 'data-h5-bind指定した要素に値が表示されていること');
	});

	test('空のObservableArrayをバインドできること', function() {
		var items = h5.u.obj.createObservableArray();
		items.copyFrom([]);

		view.append($fixture, 'loopContext1');
		view.bind($('#dataBindTest'), {
			test: 'aaa',
			items: items
		});

		strictEqual($('#dataBindTest li').length, 0, '繰り返される要素が一つもないこと');
	});

	test('中身がオブジェクトでないObservableArrayをバインドするとエラーになること', function() {
		var items = h5.u.obj.createObservableArray();
		items.copyFrom([]);

		var noObjs = [1, 'a', [], [{}]];

		var l = noObjs.length;
		for ( var i = 0; i < l; i++) {
			view.append($fixture, 'loopContext1');

			raises(function(enviroment) {
				view.bind($('#dataBindTest'), {
					items: [{
						test: 'a'
					}, noObjs[i], {
						test: 'b'
					}]
				});
			}, function(actual) {
				return ERR_BIND.ERR_CODE_INVALID_CONTEXT_SRC === actual.code;
			}, 'コンテキストにArrayまたはObservableArrayを指定していないためエラーになること"');

			$fixture.children().remove();
		}
		expect(l);
	});

	test('ObservableItemを要素に持つObservableArrayをバインドできること', 1, function() {
		var items = h5.u.obj.createObservableArray();
		var schema = {
			test: null
		};
		var item1 = h5.u.obj.createObservableItem(schema);
		item1.set('test', 'aa');
		var item2 = h5.u.obj.createObservableItem(schema);
		item2.set('test', 'bb');

		items.copyFrom([item1, item2]);

		view.append($fixture, 'loopContext1');
		view.bind($('#dataBindTest'), {
			items: items
		});

		var result = ['aa', 'bb'];
		checkTexts(result, 'data-h5-bind指定した要素に値が表示されていること');
	});

	test('循環参照を持つObservableArrayをバインドできること', function() {
		var ary = [{
			test: 'A',
			ary: [{
				test: 'A'
			}]

		}, {
			test: 'B',
			ary: [{
				test: 'B-A'
			}, {
				test: 'B-B'
			}]
		}];

		var oAry = h5.u.obj.createObservableArray();
		oAry.copyFrom(ary);

		oAry[0].ary = oAry;
		view.append($fixture, 'loopContext2');
		view.bind($('#dataBindTest'), {
			items: oAry
		});

		strictEqual($('#dataBindTest>ul>li:eq(0)').text(), 'A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)>ul>li:eq(0)').text(), 'A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)>ul>li:eq(1)').text(), 'B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)>ul>li').length, ary[0].ary.length,
				'配列の要素数分DOMが生成されること');
		strictEqual($('#dataBindTest>ul>li:eq(2)').text(), 'B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(3)>ul>li:eq(0)').text(), 'B-A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(3)>ul>li:eq(1)').text(), 'B-B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(3)>ul>li').length, ary[1].ary.length,
				'配列の要素数分DOMが生成されること');
	});

	test('h5-data-loop-contextにnulを指定する', 1, function() {
		view.append($fixture, 'loopContext1');
		view.bind($('#dataBindTest'), {
			items: null
		});

		strictEqual($('#dataBindTest li').length, 0, '繰り返される要素が一つもないこと');
	});

	//=============================
	// Definition
	//=============================
	var oAry = null;
	module('ObservableArrayの変更検知 各メソッド', {
		setup: function() {
			oAry = h5.u.obj.createObservableArray();
			oAry.copyFrom([{
				test: '初期値0'
			}, {
				test: '初期値1'
			}, {
				test: '初期値2'
			}]);
			view.append($fixture, 'loopContext1');
			view.bind($('#dataBindTest'), {
				items: oAry
			});
		},
		teardown: function() {
			oAry = null;
		}
	});

	//=============================
	// Body
	//=============================
	test('copyFrom', function() {
		oAry.copyFrom([{
			test: 'a'
		}, {
			test: 'b'
		}]);
		var result = ['a', 'b'];
		checkTexts(result, '変更が反映されること');

		oAry.copyFrom([]);
		checkTexts([], '中身を空にすると繰り返し要素がなくなること');

		oAry.copyFrom([{
			test: 'AA'
		}]);
		checkTexts(['AA'], '空の状態から、空でない状態に変更した時、ビューに変更が反映されること');
	});

	test('push', function() {
		oAry.push({
			test: 'a'
		});
		var result = ['初期値0', '初期値1', '初期値2', 'a'];
		checkTexts(result, '変更が反映されること');

		oAry.push({
			test: 'b'
		}, {
			test: 'c'
		});
		result.push('b', 'c');
		checkTexts(result, '複数要素を引数に渡した場合も、変更が反映されること');
	});

	test('pop', function() {
		oAry.pop();
		checkTexts(['初期値0', '初期値1'], '変更が反映されること');

		oAry.pop();
		checkTexts(['初期値0'], '変更が反映されること');

		oAry.pop();
		checkTexts([], '変更が反映されること');
	});

	test('shift', function() {
		oAry.shift();
		checkTexts(['初期値1', '初期値2'], '変更が反映されること');

		oAry.shift();
		checkTexts(['初期値2'], '変更が反映されること');

		oAry.shift();
		checkTexts([], '変更が反映されること');
	});

	test('unshift', function() {
		oAry.unshift({
			test: 'a'
		});
		var result = ['a', '初期値0', '初期値1', '初期値2'];
		checkTexts(result, '変更が反映されること');

		oAry.unshift({
			test: 'c'
		}, {
			test: 'b'
		});
		result.unshift('c', 'b');
		checkTexts(result, '複数要素を引数に渡した場合も、変更が反映されること');
	});

	test('splice', function() {
		oAry.splice(0, 1, {
			test: 'a'
		});
		var result = ['a', '初期値1', '初期値2'];
		checkTexts(result, '変更が反映されること');

		oAry.splice(0, 1, {
			test: 'A'
		}, {
			test: 'B'
		}, {
			test: 'C'
		});
		result.splice(0, 1, 'A', 'B', 'C');
		checkTexts(result, '変更が反映されること');

		oAry.splice(1, 2, {
			test: 'D'
		}, {
			test: 'E'
		});
		result.splice(1, 2, 'D', 'E');
		checkTexts(result, '変更が反映されること');

		oAry.splice(0, 1);
		result.splice(0, 1);
		checkTexts(result, '変更が反映されること');
	});

	test('sort', function() {
		oAry.unshift({
			test: '初期値3'
		});

		oAry.sort(function(a, b) {
			return a.test > b.test ? 1 : -1;
		});
		checkTexts(['初期値0', '初期値1', '初期値2', '初期値3'], '変更が反映されること');
	});

	test('reverse', function() {
		oAry.reverse();
		checkTexts(['初期値2', '初期値1', '初期値0'], '変更が反映されること');
	});


	test('バインドされているObservableArrayの中のObservableItemを変更すると、表示も書き変わること', function() {
		var schema = {
			test: null
		};
		var item1 = h5.u.obj.createObservableItem(schema);
		var item2 = h5.u.obj.createObservableItem(schema);
		item1.set('test', 'a');
		item2.set('test', 'b');

		// oAryの中をitem1だけにする（初期値を消す)
		oAry.splice(0, oAry.length, item1);
		checkTexts(['a'], 'ObservableArrayにObservableItemをpushすると、ビューへ反映されること');

		oAry.push(item2);
		checkTexts(['a', 'b'], 'ObservableItemの中身がビューへ反映されていること');

		oAry.push({
			test: 'c'
		});
		checkTexts(['a', 'b', 'c'], '通常のオブジェクトの中身もビューへ反映されていること');

		item1.set('test', 'A');
		checkTexts(['A', 'b', 'c'], 'ObservableItemの中身の変更がビューへ反映されていること');
	});


	//=============================
	// Definition
	//=============================
	module('ObservableArrayの変更検知');

	//=============================
	// Body
	//=============================
	test('ObservableArrayの要素のオブジェクトが持つObservableArrayを変更した時ビューへ反映されること', function() {
		var innerOAry = h5.u.obj.createObservableArray();
		innerOAry.copyFrom([{
			test: 'innerA',
			ary: []
		}]);
		var ary = [{
			test: 'a',
			ary: innerOAry
		}];
		var oAry = h5.u.obj.createObservableArray();
		oAry.copyFrom(ary);
		view.append($fixture, 'loopContext2');
		view.bind($('#dataBindTest'), {
			items: oAry
		});

		strictEqual($('#dataBindTest>ul>li:eq(0)').text(), 'a', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)>ul>li:eq(0)').text(), 'innerA', 'バインドされていること');

		oAry.push({
			test: 'b',
			ary: []
		});

		strictEqual($('#dataBindTest>ul>li:eq(2)').text(), 'b', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(3)>ui:first-child').length, 0,
				'空の配列を指定したので要素が生成されていないこと');

		innerOAry.push({
			test: 'innerB'
		});

		strictEqual($('#dataBindTest>ul>li:eq(1)>ul>li:eq(1)').text(), 'innerB', 'バインドされていること');
	});

	test('循環参照を持つObservableArrayの中身を変更した時にビューへ反映されること',
			function() {
				var ary = [{
					test: 'A',
					ary: []
				}, {
					test: 'B',
					ary: [{
						test: 'B-A'
					}, {
						test: 'B-B'
					}]
				}];
				var oAry = h5.u.obj.createObservableArray();
				oAry.copyFrom(ary);
				oAry[0].ary = oAry;
				view.append($fixture, 'loopContext2');
				view.bind($('#dataBindTest'), {
					items: oAry
				});

				strictEqual($('#dataBindTest>ul>li:first').text(), 'A', '変更が反映されていること');
				strictEqual($('#dataBindTest>ul>li:eq(1)>ul:first>li:eq(0)').text(), 'A',
						'変更が反映されていること');
				strictEqual($('#dataBindTest>ul>li:eq(1)>ul:first>li:eq(1)').text(), 'B',
						'変更が反映されていること');
				strictEqual($('#dataBindTest>ul>li:eq(2)').text(), 'B', '変更が反映されていること');
				strictEqual($('#dataBindTest>ul>li:eq(3)>ul:first>li:eq(0)').text(), 'B-A',
						'変更が反映されていること');
				strictEqual($('#dataBindTest>ul>li:eq(3)>ul:first>li:eq(1)').text(), 'B-B',
						'変更が反映されていること');

				oAry.splice(1, 1, {
					test: 'BB',
					ary: oAry
				});

				strictEqual($('#dataBindTest>ul>li:first').text(), 'A', '変更が反映されていること');
				strictEqual($('#dataBindTest>ul>li:eq(1)>ul:first>li:eq(0)').text(), 'A',
						'変更が反映されていること');
				strictEqual($('#dataBindTest>ul>li:eq(1)>ul:first>li:eq(1)').text(), 'BB',
						'変更が反映されていること');
				strictEqual($('#dataBindTest>ul>li:eq(2)').text(), 'BB', '変更が反映されていること');
				strictEqual($('#dataBindTest>ul>li:eq(3)>ul:first>li:eq(0)').text(), 'A',
						'変更が反映されていること');
				strictEqual($('#dataBindTest>ul>li:eq(3)>ul:first>li:eq(1)').text(), 'BB',
						'変更が反映されていること');
			});

	//=============================
	// Definition
	//=============================
	var testSchema = null;
	module('ObservableItem/DataItem', {
		setup: function() {
			var obj = {
				a: 'obj.a'
			};
			var oAry = h5.u.obj.createObservableArray();
			oAry.copyFrom([1, 'b']);
			testSchema = {
				str: {
					type: 'string',
					defaultValue: 'abc'
				},
				num: {
					type: 'number',
					defaultValue: -123.45
				},
				obj: {
					defaultValue: obj
				},
				item: null,
				ary: {
					type: 'any',
					defaultValue: [{
						a: 'ary.1'
					}, {
						a: 'ary.2'
					}]
				},
				oAry: {
					type: 'any[]',
					defaultValue: [{
						a: 'oAry.1'
					}, {
						a: 'oAry.2'
					}]
				}
			};
		},
		teardown: function() {
			testSchema = null;
		}
	});

	//=============================
	// Body
	//=============================
	test('バインドできること', 2, function() {
		var exp = ['abc', '-123.45', 'obj.a', 'abc', '-123.45', 'ary.1', 'ary.2', 'oAry.1',
				'oAry.2'];
		testDataItemObsItem(function(item, isDataItem) {
			var itemType = isDataItem ? 'DataItem' : 'ObservableItem';
			item.set('item', item);

			// バインド先の設定
			$fixture.find('#dataBindTest').remove();
			view.append($fixture, 'itemBind5');

			view.bind('#dataBindTest', item);

			checkTexts(exp, itemType + 'の中身がバインドされていること', 'span');
		}, testSchema);
	});

	test('循環参照を持っていてもバインドできること', 2, function() {
		var exp = ['abc', '-123.45', 'obj.a', 'abc', '-123.45', 'ary.1', 'ary.2', 'oAry.1',
				'oAry.2'];
		testDataItemObsItem(function(item, isDataItem) {
			var itemType = isDataItem ? 'DataItem' : 'ObservableItem';
			item.set('item', item);

			// バインド先の設定
			$fixture.find('#dataBindTest').remove();
			view.append($fixture, 'itemBind5');
			view.bind('#dataBindTest', item);

			checkTexts(exp, itemType + 'の中身がバインドされていること', 'span');
		}, testSchema);
	});

	test('オブジェクト内のObservableItem/DataItemをバインドできること', 2, function() {
		testDataItemObsItem(function(item, isDataItem) {
			var itemType = isDataItem ? 'DataItem' : 'ObservableItem';
			item.set('item', item);

			// バインド先の設定
			$fixture.find('#dataBindTest').remove();
			view.append($fixture, 'itemBind5');

			// 一段ラップする
			$('#dataBindTest').wrapInner('<div data-h5-context="item">');

			view.bind('#dataBindTest', {
				item: item
			});

			var exp = ['abc', '-123.45', 'obj.a', 'abc', '-123.45', 'ary.1', 'ary.2', 'oAry.1',
					'oAry.2'];
			checkTexts(exp, itemType + 'の中身がバインドされていること', 'span');
		}, testSchema);
	});

	//=============================
	// Definition
	//=============================
	module('ObservableItem/DataItemの変更の適用', {
		setup: function() {
			testSchema = {
				str: {
					type: 'string',
					defaultValue: 'abc'
				},
				num: {
					type: 'number',
					defaultValue: -123.45
				},
				ary: {
					type: 'any[]'
				},
				any: null
			};
		},
		teardown: function() {
			testSchema = null;
		}
	});

	//=============================
	// Body
	//=============================

	test('ObserbableArrayの中身を変更すると、変更結果がビューに反映されること', function() {
		var oar = h5.u.obj.createObservableArray();
		oar.push({
			test: 1
		});
		oar.push({
			test: 2
		});

		view.append($fixture, 'loopContext1');
		view.bind($('#dataBindTest'), {
			items: oar
		});

		var $result = $('#dataBindTest > ul > li');
		equal($result.length, oar.length, 'ObserbableArrayの要素数分loop-contextを指定した要素にDOMが生成されること');
		equal($result.eq(0).text(), oar[0].test, 'li[0].text() == ObservableArray[0].test');
		equal($result.eq(1).text(), oar[1].test, 'li[1].text() == ObservableArray[1].test');

		// 値を取り出す
		oar.pop();
		$result = $('#dataBindTest > ul > li');

		equal($result.length, oar.length,
				'ObserbableArrayから要素を一つ削除したので、ObserbableArrayをバインドしたビューに反映されていること');
		equal($result.eq(0).text(), oar[0].test, 'li[0].text() == ObservableArray[0].test');

		// 値の変更をキャンセルする
		oar.addEventListener('observeBefore', function(ev) {
			ev.preventDefault();
		});

		oar.pop();
		$result = $('#dataBindTest > ul > li');

		equal($result.length, oar.length,
				'observeBeforeイベントをキャンセルしてObservableArrayの中身に変更がないので、ビューは変更されないこと');
		equal($result.eq(0).text(), oar[0].test, 'li[0].text() == ObservableArray[0].test');
	});

	test('ObserbableItem/DataItemの中身を変更すると、ビューに反映されること', 4, function() {
		testDataItemObsItem(function(item, isDataItem) {
			var itemType = isDataItem ? 'DataItem' : 'ObservableItem';

			item.set({
				str: 'AA',
				num: 11
			});

			// バインド先の設定
			$fixture.find('#dataBindTest').remove();
			view.append($fixture, 'itemBind1');

			view.bind($('#dataBindTest'), item);
			var result = ['AA', '11'];
			checkTexts(result, itemType + ' data-h5-bind指定した要素に値が表示されていること', 'span');

			item.set({
				str: 'BB',
				num: 22
			});
			result = ['BB', '22'];
			checkTexts(result, itemType + ' 変更が反映されていること', 'span');
		}, testSchema);
	});

	test('ObserbableItem/DataItemが持つObservableArray要素の中身を変更すると、ビューに反映されること', 6, function() {
		testDataItemObsItem(function(item, isDataItem) {
			var itemType = isDataItem ? 'DataItem' : 'ObservableItem';

			item.set('ary', [{
				test: 'ary[0]'
			}, {
				test: 'ary[1]'
			}]);

			// バインド先の設定
			$fixture.find('#dataBindTest').remove();
			view.append($fixture, 'itemBind2');

			view.bind($('#dataBindTest'), item);
			var result = ['ary[0]', 'ary[1]'];
			checkTexts(result, itemType + ' data-h5-bind指定した要素に値が表示されていること', 'span');

			item.set('ary', [{
				test: 'newAry[0]'
			}]);
			result = ['newAry[0]'];
			checkTexts(result, itemType + ' setで変更した時に反映されていること', 'span');

			// ObservableArrayのメソッドで配列を変更
			item.get('ary').push({
				test: 'newAry[1]'
			});
			result.push('newAry[1]');
			checkTexts(result, itemType + ' メソッド操作による変更があった時に反映されていること', 'span');
		}, testSchema);
	});

	test('ObserbableItem/DataItemが持つtype:anyの要素に格納されたObservableItem/DataItemが、ビューに反映されること', 8,
			function() {
				testDataItemObsItem(function(item, isDataItem) {
					var itemType = isDataItem ? 'DataItem' : 'ObservableItem';

					// itemに持たせるItemの作成
					var item2 = {};
					var item3 = { // 通常オブジェクト
						str: 'c',
						num: 3
					};
					var item4 = {};
					if (isDataItem) {
						item2 = item.getModel().create({
							id: 'item2',
							str: 'b',
							num: 2
						});
						item4 = item.getModel().create({
							id: 'item4',
							str: 'd',
							num: 4
						});
					} else {
						item2 = h5.u.obj.createObservableItem(testSchema);
						item4 = h5.u.obj.createObservableItem(testSchema);
						item2.set({
							str: 'b',
							num: 2
						});
						item4.set({
							str: 'd',
							num: 4
						});
					}
					item.set({
						str: 'a',
						num: 1,
						any: item2
					});

					// バインド先の設定
					$fixture.find('#dataBindTest').remove();
					view.append($fixture, 'itemBind3');

					view.bind($('#dataBindTest'), item);
					var result = ['a', '1', 'b', '2'];
					checkTexts(result, itemType + ' data-h5-bind指定した要素に値が表示されていること', 'span');

					// バインドしたアイテムが持つアイテムを変更
					item2.set({
						str: 'bb',
						num: 22
					});
					result = ['a', '1', 'bb', '22'];
					checkTexts(result, itemType + ' setで変更した時に反映されていること', 'span');

					// バインドしたアイテムが持つアイテムを通常オブジェクトに変更
					item.set('any', item3);
					result = ['a', '1', 'c', '3'];
					checkTexts(result, itemType + ' setで変更した時に反映されていること', 'span');

					// バインドしたアイテムが持つアイテムを別のアイテムに変更
					item.set('any', item4);
					result = ['a', '1', 'd', '4'];
					checkTexts(result, itemType + ' setで変更した時に反映されていること', 'span');
				}, testSchema);
			});

	test('ObserbableItem/DataItemが持つtype:anyの要素に格納された配列、ObservableArrayが、ビューに反映されること', 10,
			function() {

				testDataItemObsItem(function(item, isDataItem) {
					var itemType = isDataItem ? 'DataItem' : 'ObservableItem';

					var obsArray = h5.u.obj.createObservableArray();
					obsArray.copyFrom([{
						test: 'ary[0]'
					}, {
						test: 'ary[1]'
					}]);
					item.set({
						any: obsArray
					});

					// バインド先の設定
					$('#dataBindTest').remove();
					view.append($fixture, 'itemBind4');

					view.bind('#dataBindTest', item);
					var result = ['ary[0]', 'ary[1]'];
					checkTexts(result, itemType + ' data-h5-bind指定した要素に値が表示されていること', 'span');

					// ObservableArrayのメソッドで配列を変更
					item.get('any').push({
						test: 'newAry[1]'
					});
					result.push('newAry[1]');
					checkTexts(result, itemType + ' メソッド操作による変更があった時に反映されていること', 'span');

					// 別の配列インスタンスに変更
					item.set('any', [{
						test: 'otherAry[0]'
					}, {
						test: 'otherAry[1]'
					}]);
					result = ['otherAry[0]', 'otherAry[1]'];
					checkTexts(result, itemType + ' 別の配列インスタンスに変更した時に反映されていること', 'span');

					// 別のObservableArrayインスタンスに変更
					var oAry = h5.u.obj.createObservableArray();
					oAry.copyFrom([{
						test: 'otherOAry[0]'
					}]);
					item.set('any', oAry);
					result = ['otherOAry[0]'];
					checkTexts(result, itemType + ' 別のObservableArrayインスタンスに変更した時に反映されていること',
							'span');

					// ObservableArrayのメソッドで配列を変更
					oAry.push({
						test: 'otherOAry[1]'
					});
					result = ['otherOAry[0]', 'otherOAry[1]'];
					checkTexts(result, itemType + ' 差し替え後のObservableArrayの中身を変更した時に反映されていること',
							'span');

				}, testSchema);
			});

	//=============================
	// Definition
	//=============================
	var testDataModel = null;
	var testDataItem = null;
	var testObsItem = null;
	module('DataItem/ObservableItemが保持するObservableArrayに対する変更', {
		setup: function() {
			var schema = {
				id: {
					id: true
				},
				ary: {
					type: 'any[]'
				}
			};
			var manager = h5.core.data.createManager('TestManager');
			testDataModel = manager.createModel({
				name: 'TestModel',
				schema: schema
			});
			testDataItem = testDataModel.create({
				id: '1'
			});

			testObsItem = h5.u.obj.createObservableItem(schema);
		},
		teardown: function() {
			$('#dataBindTest').remove();
			testDataModel.remove('1');
			testDataModel = null;
		}
	});

	//=============================
	// Body
	//=============================
	test('copyFrom()', function() {
		function testFunc(item) {
			var name = item instanceof testDataItem.constructor ? 'DataItem' : 'ObservableItem';
			view.append($fixture, 'itemBind7');

			var binding = view.bind($('#dataBindTest'), {
				item: item
			});

			var oar = item.get('ary');
			equal(oar.length, 0, name + ': ObservableArrayには何も格納されていないこと。');

			oar.copyFrom([{
				test: 'a'
			}, {
				test: 'b'
			}, {
				test: 'c'
			}]);
			equal($('#dataBindTest span').length, oar.length, name
					+ ': ObservableArrayの変更がビューに反映されていること');
			equal($('#dataBindTest span').eq(0).text(), oar[0].test, name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(1).text(), oar[1].test, name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(2).text(), oar[2].test, name
					+ ': ObservableArrayの内容がビューに反映されていること');

			oar.copyFrom([{
				test: 'a'
			}]);
			equal($('#dataBindTest span').length, oar.length, name
					+ ': ObservableArrayの変更がビューに反映されていること');
			equal($('#dataBindTest span').eq(0).text(), oar[0].test, name
					+ ': ObservableArrayの内容がビューに反映されていること');

			binding.unbind();

			oar.copyFrom([{
				test: 'A'
			}, {
				test: 'B'
			}, {
				test: 'C'
			}]);
			equal($('#dataBindTest span').length, 1, name
					+ ': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
			equal($('#dataBindTest span').eq(0).text(), 'a', name
					+ ': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');

			$('#dataBindTest').remove();
		}
		testFunc(testDataItem);
		testFunc(testObsItem);
	});

	test('push()',
			function() {
				function testFunc(item) {
					var name = item instanceof testDataItem.constructor ? 'DataItem'
							: 'ObservableItem';
					view.append($fixture, 'itemBind7');

					var binding = view.bind($('#dataBindTest'), {
						item: item
					});

					//		item.addEventListener('change', function(ev) {
					//			console.log("change");
					//		});

					var oar = item.get('ary');

					//		oar.addEventListener('observe', function(ev){
					//			console.log("observe");
					//		});

					equal(oar.length, 0, name + ': ObservableArrayには何も格納されていないこと。');
					oar.push({
						test: 'AAA'
					});

					equal($('#dataBindTest span').length, oar.length, name
							+ ': ObservableArrayの変更がビューに反映されていること');
					equal($('#dataBindTest span').eq(0).text(), 'AAA', name
							+ ': ObservableArrayの内容がビューに反映されていること');

					oar.push({
						test: 'BBB'
					});

					equal($('#dataBindTest span').length, oar.length, name
							+ ': ObservableArrayの変更がビューに反映されていること');
					equal($('#dataBindTest span').eq(0).text(), 'AAA', name
							+ ': ObservableArrayの内容がビューに反映されていること');
					equal($('#dataBindTest span').eq(1).text(), 'BBB', name
							+ ': ObservableArrayの内容がビューに反映されていること');

					oar.push({
						test: 'CCC'
					});

					equal($('#dataBindTest span').length, oar.length, name
							+ ': ObservableArrayの変更がビューに反映されていること');
					equal($('#dataBindTest span').eq(0).text(), 'AAA', name
							+ ': ObservableArrayの内容がビューに反映されていること');
					equal($('#dataBindTest span').eq(1).text(), 'BBB', name
							+ ': ObservableArrayの内容がビューに反映されていること');
					equal($('#dataBindTest span').eq(2).text(), 'CCC', name
							+ ': ObservableArrayの内容がビューに反映されていること');

					binding.unbind();

					oar.push({
						test: 'DDD'
					});

					equal($('#dataBindTest span').length, 3,
							name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
					equal($('#dataBindTest span').eq(0).text(), 'AAA',
							name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
					equal($('#dataBindTest span').eq(1).text(), 'BBB',
							name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
					equal($('#dataBindTest span').eq(2).text(), 'CCC',
							name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');

					$('#dataBindTest').remove();
				}
				testFunc(testDataItem);
				testFunc(testObsItem);
			});

	test('pop()', function() {
		function testFunc(item) {
			var name = item instanceof testDataItem.constructor ? 'DataItem' : 'ObservableItem';
			view.append($fixture, 'itemBind7');
			var binding = view.bind($('#dataBindTest'), {
				item: item
			});

			item.set('ary', [{
				test: 'a'
			}, {
				test: 'b'
			}, {
				test: 'c'
			}, {
				test: 'd'
			}]);
			var oar = item.get('ary');

			equal(oar.length, 4, name + ': set()で設定しした値が格納されていること。');
			oar.pop();
			equal($('#dataBindTest span').length, oar.length, name
					+ ': ObservableArrayの変更がビューに反映されていること');
			equal($('#dataBindTest span').eq(0).text(), 'b', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(1).text(), 'c', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(2).text(), 'd', name
					+ ': ObservableArrayの内容がビューに反映されていること');


			oar.pop();
			equal($('#dataBindTest span').length, oar.length, name
					+ ': ObservableArrayの変更がビューに反映されていること');
			equal($('#dataBindTest span').eq(0).text(), 'c', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(1).text(), 'd', name
					+ ': ObservableArrayの内容がビューに反映されていること');

			oar.pop();
			equal($('#dataBindTest span').length, oar.length, name
					+ ': ObservableArrayの変更がビューに反映されていること');
			equal($('#dataBindTest span').eq(0).text(), 'd', name
					+ ': ObservableArrayの内容がビューに反映されていること');

			binding.unbind();

			oar.pop();
			equal($('#dataBindTest span').length, 1, name
					+ ': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
			equal($('#dataBindTest span').eq(0).text(), 'd', name
					+ ': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');

			$('#dataBindTest').remove();
		}
		testFunc(testDataItem);
		testFunc(testObsItem);
	});

	test('shift()', function() {
		function testFunc(item) {
			var name = item instanceof testDataItem.constructor ? 'DataItem' : 'ObservableItem';
			view.append($fixture, 'itemBind7');
			var binding = view.bind($('#dataBindTest'), {
				item: item
			});

			item.set('ary', [{
				test: 'a'
			}, {
				test: 'b'
			}, {
				test: 'c'
			}, {
				test: 'd'
			}]);
			var oar = item.get('ary');

			equal(oar.length, 4, name + ': set()で設定しした値が格納されていること。');
			oar.shift();
			equal($('#dataBindTest span').length, oar.length, name
					+ ': ObservableArrayの変更がビューに反映されていること');
			equal($('#dataBindTest span').eq(0).text(), 'b', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(1).text(), 'c', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(2).text(), 'd', name
					+ ': ObservableArrayの内容がビューに反映されていること');

			oar.shift();
			equal($('#dataBindTest span').length, oar.length, name
					+ ': ObservableArrayの変更がビューに反映されていること');
			equal($('#dataBindTest span').eq(0).text(), 'c', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(1).text(), 'd', name
					+ ': ObservableArrayの内容がビューに反映されていること');

			oar.shift();
			equal($('#dataBindTest span').length, oar.length, name
					+ ': ObservableArrayの変更がビューに反映されていること');
			equal($('#dataBindTest span').eq(0).text(), 'd', name
					+ ': ObservableArrayの内容がビューに反映されていること');

			binding.unbind();

			oar.shift();
			equal($('#dataBindTest span').length, 1, name
					+ ': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
			equal($('#dataBindTest span').eq(0).text(), 'd', name
					+ ': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');

			$('#dataBindTest').remove();
		}
		testFunc(testDataItem);
		testFunc(testObsItem);
	});

	test('unshift()',
			function() {
				function testFunc(item) {
					var name = item instanceof testDataItem.constructor ? 'DataItem'
							: 'ObservableItem';
					view.append($fixture, 'itemBind7');
					var binding = view.bind($('#dataBindTest'), {
						item: item
					});

					var oar = item.get('ary');

					equal(oar.length, 0, name + ': ObservableArrayには何も格納されていないこと。');
					oar.unshift({
						test: 'a'
					});
					equal($('#dataBindTest span').length, oar.length, name
							+ ': ObservableArrayの変更がビューに反映されていること');
					equal($('#dataBindTest span').eq(0).text(), 'a', name
							+ ': ObservableArrayの内容がビューに反映されていること');

					oar.unshift({
						test: 'b'
					});
					equal($('#dataBindTest span').length, oar.length, name
							+ ': ObservableArrayの変更がビューに反映されていること');
					equal($('#dataBindTest span').eq(0).text(), 'a', name
							+ ': ObservableArrayの内容がビューに反映されていること');
					equal($('#dataBindTest span').eq(1).text(), 'b', name
							+ ': ObservableArrayの内容がビューに反映されていること');

					oar.unshift({
						test: 'c'
					});
					equal($('#dataBindTest span').length, oar.length, name
							+ ': ObservableArrayの変更がビューに反映されていること');
					equal($('#dataBindTest span').eq(0).text(), 'a', name
							+ ': ObservableArrayの内容がビューに反映されていること');
					equal($('#dataBindTest span').eq(1).text(), 'b', name
							+ ': ObservableArrayの内容がビューに反映されていること');
					equal($('#dataBindTest span').eq(2).text(), 'c', name
							+ ': ObservableArrayの内容がビューに反映されていること');

					binding.unbind();

					oar.unshift({
						test: 'd'
					});
					equal($('#dataBindTest span').length, 3,
							name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
					equal($('#dataBindTest span').eq(0).text(), 'a',
							name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
					equal($('#dataBindTest span').eq(1).text(), 'b',
							name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
					equal($('#dataBindTest span').eq(2).text(), 'c',
							name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');

					$('#dataBindTest').remove();
				}
				testFunc(testDataItem);
				testFunc(testObsItem);
			});

	test('splice()',
			function() {
				function testFunc(item) {
					var name = item instanceof testDataItem.constructor ? 'DataItem'
							: 'ObservableItem';
					view.append($fixture, 'itemBind7');
					var binding = view.bind($('#dataBindTest'), {
						item: item
					});

					var ar = [{
						test: 'a'
					}, {
						test: 'b'
					}, {
						test: 'c'
					}];

					item.set('ary', ar);
					var oar = item.get('ary');

					equal(oar.length, 3, name + ': set()で設定しした値が格納されていること');
					oar.splice(1, 2);
					equal($('#dataBindTest span').length, oar.length, name
							+ ': ObservableArrayの変更がビューに反映されていること');
					equal($('#dataBindTest span').eq(0).text(), ar[0].test, name
							+ ': ObservableArrayの内容がビューに反映されていること');

					var obj = {
						test: 'AA'
					};
					oar.splice(0, 1, obj);
					equal($('#dataBindTest span').length, oar.length, name
							+ ': ObservableArrayの変更がビューに反映されていること');
					equal($('#dataBindTest span').eq(0).text(), obj.test, name
							+ ': ObservableArrayの内容がビューに反映されていること');

					binding.unbind();

					oar.splice(0, 1);
					equal($('#dataBindTest span').length, 1,
							name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
					equal($('#dataBindTest span').eq(0).text(), obj.test,
							name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');

					$('#dataBindTest').remove();
				}
				testFunc(testDataItem);
				testFunc(testObsItem);
			});

	test('sort()', function() {
		function testFunc(item) {
			var name = item instanceof testDataItem.constructor ? 'DataItem' : 'ObservableItem';
			view.append($fixture, 'itemBind7');
			var binding = view.bind($('#dataBindTest'), {
				item: item
			});

			item.set('ary', [{
				test: 1
			}, {
				test: 5
			}, {
				test: 3
			}]);
			var oar = item.get('ary');

			equal(oar.length, 3, name + ': set()で設定しした値が格納されていること。');

			oar.sort(function(a, b) {
				return a.test < b.test;
			});
			equal($('#dataBindTest span').length, oar.length, name
					+ ': ObservableArrayの変更がビューに反映されていること');
			equal($('#dataBindTest span').eq(0).text(), '5', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(1).text(), '3', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(2).text(), '1', name
					+ ': ObservableArrayの内容がビューに反映されていること');

			oar.sort(function(a, b) {
				return a.test > b.test;
			});
			equal($('#dataBindTest span').length, oar.length, name
					+ ': ObservableArrayの変更がビューに反映されていること');
			equal($('#dataBindTest span').eq(0).text(), '1', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(1).text(), '3', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(2).text(), '5', name
					+ ': ObservableArrayの内容がビューに反映されていること');

			binding.unbind();

			oar.sort(function(a, b) {
				return a.test < b.test;
			});
			equal($('#dataBindTest span').length, oar.length,
					name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
			equal($('#dataBindTest span').eq(0).text(), '1',
					name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
			equal($('#dataBindTest span').eq(1).text(), '3',
					name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
			equal($('#dataBindTest span').eq(2).text(), '5',
					name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');

			$('#dataBindTest').remove();
		}
		testFunc(testDataItem);
		testFunc(testObsItem);
	});

	test('reverse()', function() {
		function testFunc(item) {
			var name = item instanceof testDataItem.constructor ? 'DataItem' : 'ObservableItem';
			view.append($fixture, 'itemBind7');
			var binding = view.bind($('#dataBindTest'), {
				item: item
			});

			item.set('ary', [{
				test: 1
			}, {
				test: 5
			}, {
				test: 3
			}]);
			var oar = item.get('ary');

			equal(oar.length, 3, name + ': set()で設定しした値が格納されていること。');

			oar.reverse();
			equal($('#dataBindTest span').length, oar.length, name
					+ ': ObservableArrayの変更がビューに反映されていること');
			equal($('#dataBindTest span').eq(0).text(), '3', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(1).text(), '5', name
					+ ': ObservableArrayの内容がビューに反映されていること');
			equal($('#dataBindTest span').eq(2).text(), '1', name
					+ ': ObservableArrayの内容がビューに反映されていること');

			binding.unbind();

			oar.reverse();
			equal($('#dataBindTest span').length, oar.length,
					name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
			equal($('#dataBindTest span').eq(0).text(), '3',
					name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
			equal($('#dataBindTest span').eq(1).text(), '5',
					name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');
			equal($('#dataBindTest span').eq(2).text(), '1',
					name +': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');

			$('#dataBindTest').remove();
		}
		testFunc(testDataItem);
		testFunc(testObsItem);
	});

	//=============================
	// Definition
	//=============================
	var testBaseDataModel = null;
	var testBaseDataItem = null;
	var testDataModel2 = null;
	var testDataItem2 = null;

	module('DataItemが保持するDataItemに対する変更', {
		setup: function() {
			var schema = {
				id: {
					id: true
				},
				test: {
					type: 'integer',
					defaultValue: 10
				}
			};
			var schema2 = {
				id: {
					id: true
				},
				val: {
					type: 'string',
					defaultValue: 'AAA'
				},
				data: {
					type: '@BaseTestModel'
				}
			};
			var manager = h5.core.data.createManager('TestManager');
			testBaseDataModel = manager.createModel({
				name: 'BaseTestModel',
				schema: schema
			});
			testBaseDataItem = testBaseDataModel.create({
				id: '1'
			});
			testDataModel2 = manager.createModel({
				name: 'TestModel',
				schema: schema2
			});
			testDataItem2 = testDataModel2.create({
				id: '1',
				data: testBaseDataItem
			});
		},
		teardown: function() {
			$('#dataBindTest').remove();
			testDataModel2.remove('1');
			testDataModel2 = null;
			testBaseDataModel.remove('1');
			testBaseDataModel = null;
		}
	});

	//=============================
	// Body
	//=============================

	test('値を更新する',
			function() {
				view.append($fixture, 'itemBind9');
				var binding = view.bind($('#dataBindTest'), {
					item: testDataItem2
				});

				equal($('#dataBindTest span').eq(0).text(), '10', 'DataItemの内容がビューに反映されていること');

				testBaseDataItem.set({
					test: 1000
				});
				equal($('#dataBindTest span').eq(0).text(), '1000', '更新した値がビューに反映されていること');

				binding.unbind();

				testBaseDataItem.set({
					test: 5000
				});
				equal($('#dataBindTest span').eq(0).text(), '1000',
						'unbind()後にDataItemを更新してもビューに反映されないこと');
			});

	test('ビューに表示されているDataItemを別のDataItemに変更する', function() {
		var item = testBaseDataModel.create({
			id: '2',
			test: 500
		});
		var item2 = testBaseDataModel.create({
			id: '3',
			test: 5000
		});
		var item3 = testBaseDataModel.create({
			id: '4',
			test: 10000
		});

		view.append($fixture, 'itemBind9');
		var binding = view.bind($('#dataBindTest'), {
			item: testDataItem2
		});

		equal($('#dataBindTest span').eq(0).text(), '10', 'DataItemの内容がビューに反映されていること');

		testDataItem2.set({
			data: item
		});
		equal($('#dataBindTest span').eq(0).text(), '' + item.get('test'), '変更した値がビューに反映されていること');

		testDataItem2.set({
			data: item2
		});
		equal($('#dataBindTest span').eq(0).text(), '' + item2.get('test'), '更新した値がビューに反映されていること');

		binding.unbind();

		testDataItem2.set({
			data: item3
		});
		equal($('#dataBindTest span').eq(0).text(), '' + item2.get('test'),
				'unbind()後にDataItemを更新してもビューに反映されないこと');
	});



	//=============================
	// Definition
	//=============================
	module('バインドの詳細指定');

	//=============================
	// Body
	//=============================

	test('属性へのバインド', function() {
		// バインド先の設定
		view.append($fixture, 'id');

		view.bind('#dataBindTest', {
			id: 'bindTest123'
		});

		var $span = $fixture.find('span');
		strictEqual($span.attr('id'), 'bindTest123', 'id属性の値が書き変わっていること');
		strictEqual($span.text(), 'before', 'テキストノードの値は書き変わっていないこと');
	});

	test('属性名を指定せずに、属性へバインド', 1, function() {
		view.append($fixture, 'id2');

		raises(function(enviroment) {
			view.bind('#dataBindTest', {
				id: 'bindTest123'
			});
		}, function(actual) {
			return ERR_BIND.ERR_CODE_REQUIRE_DETAIL === actual.code;
		}, 'data-h5-bindのattrに属性名を指定していないためエラーになること"');
	});

	test('classへのバインド', function() {
		// バインド先の設定
		view.append($fixture, 'class');

		view.bind('#dataBindTest', {
			cls: 'bindTestCls123'
		});

		var $span = $fixture.find('span');
		strictEqual($span.attr('class'), 'testClass bindTestCls123', 'class属性にバインドした値が追加されていること');
		strictEqual($span.text(), 'test', 'テキストノードの値は書き変わっていないこと');
	});

	test('styleへのバインド', function() {
		// バインド先の設定
		view.append($fixture, 'style');

		view.bind('#dataBindTest', {
			marginLeft: '15px',
			margin: '5px 10px 20px 30px'
		});

		var $span = $fixture.find('span');
		var span1 = $span[0];
		var span2 = $span[1];
		strictEqual(span1.style.marginLeft, '15px', 'バインドしたスタイルが適応されていること');
		strictEqual(span1.style.color, 'red', 'もともと指定していたスタイルがなくなっていないこと');
		strictEqual(span2.style.marginTop, '5px', 'バインドしたスタイルが適応されていること');
		strictEqual(span2.style.marginRight, '10px', 'バインドしたスタイルが適応されていること');
		strictEqual(span2.style.marginBottom, '20px', 'バインドしたスタイルが適応されていること');
		strictEqual(span2.style.marginLeft, '30px', 'バインドしたスタイルが適応されていること');
		strictEqual(span2.style.color, 'red', 'もともと指定していたスタイルがなくなっていないこと');
	});

	test('プロパティ名を指定せずに、styleへバインド', function() {
		// バインド先の設定
		view.append($fixture, 'style2');

		raises(function(enviroment) {
			view.bind('#dataBindTest', {
				color: 'red'
			});
		}, function(actual) {
			return ERR_BIND.ERR_CODE_REQUIRE_DETAIL === actual.code;
		}, 'data-h5-bindのstyleにプロパティ名を指定していないためエラーになること"');
	});

	test('テキストノードへのバインド', function() {
		// バインド先の設定
		view.append($fixture, 'text');

		var str = '<a href="#e">a</a>';
		view.bind($('#dataBindTest'), {
			test: str
		});

		var $span = $fixture.find('span');
		strictEqual($span.text(), str, '値がテキストノードとしてバインドされていること');
	});

	test('HTMLへのバインド', function() {
		var e = document.createElement('span');
		e.innerHTML = '<a href="#e"/>';
		var url = e.firstChild.href;

		// バインド先の設定
		view.append($fixture, 'html');

		var str = '<a href="' + url + '">a</a>';
		view.bind($('#dataBindTest'), {
			test: str
		});

		var $span = $fixture.find('span');
		strictEqual($span.html().toLowerCase(), str.toLowerCase(), '値がinnerHTMLとしてバインドされていること');
		strictEqual($span.find('a').length, 1, 'DOM要素が新しく作成されていること');
	});

	test('『:』を含むプロパティのバインド', function() {
		// バインド先の設定
		view.append($fixture, 'id');

		view.bind('#dataBindTest', {
			'attr(id):id': 'after'
		});

		var $span = $fixture.find('span');
		strictEqual($span.text(), 'before', '『:』を含むプロパティはバインドされないこと');
		strictEqual($span.attr('id'), undefined, '『:』を含むプロパティはバインドされないこと');
	});

	test('無効なバインド種別を指定', function() {
		// バインド先の設定
		view.append($fixture, 'invalidDef');

		raises(function(enviroment) {
			view.bind('#dataBindTest', {
				id: 'bindTest123'
			});
		}, function(actual) {
			return ERR_BIND.ERR_CODE_UNKNOWN_BIND_DIRECTION === actual.code;
		}, 'data-h5-bindのstyleにプロパティ名を指定していないためエラーになること"');
	});

	//=============================
	// Definition
	//=============================
	module('複数のプロパティを一つの要素にバインド');

	//=============================
	// Body
	//=============================
	test('セミコロンで複数のプロパティを一つの要素にバインドできること', function() {
		view.append($fixture, 'multiple');
		view.bind('#dataBindTest', {
			v1: 'v1',
			v2: 'v2',
			v3: 'v3',
			v4: 'red',
			v5: 'v5'
		});
		var $span = $fixture.find('span');
		strictEqual($span.text(), 'v2', '複数のプロパティをhtml,textで指定した場合、一番最後に指定したものがバインドされること');
		strictEqual($span.attr('id'), 'v3', '属性値にバインドされていること');
		strictEqual($span[0].style.color, 'red', 'styleにバインドされていること');
		strictEqual($span.attr('class'), 'v1', 'classにバインドされていること');
	});

	test('各プロパティにnullをバインドする', function() {
		view.append($fixture, 'multiple');
		view.bind('#dataBindTest', {
			v1: null,
			v2: null,
			v3: null,
			v4: null,
			v5: null
		});
		var $span = $fixture.find('span');
		strictEqual($span.text(), '', '空文字が設定されていること');
		strictEqual($span.attr('id'), undefined, '削除されていること');
		strictEqual($span[0].style.color, '', '削除されていること');
		strictEqual($span.attr('class'), undefined, '何も設定されていないこと');
	});


	//=============================
	// Definition
	//=============================
	var bindItem = h5.u.obj.createObservableItem({
		test: null
	});
	module('get', {
		setup: function() {
			$fixture.append('<div id="inFixture">');

			bindItem.set({
				test: 'a'
			});
		},
		teardown: function() {
			var controllers = h5.core.controllerManager.controllers;
			for ( var i = 0, l = controllers.length; i < l; i++) {
				controllers[i] && controllers[i].dispose && controllers[i].dispose();
			}
		}
	});

	//=============================
	// Body
	//=============================


	test('getはデータバインドされないこと', function() {
		var str = view.get('simple', {
			test: 'a'
		});

		var $dom = $(str);
		strictEqual($dom.find('span').text(), 'バインド前', 'データバインドされていないこと');
	});

	asyncTest('コントローラ内 this.view.get データバインドされないこと', function() {
		h5.core.controller($fixture, {
			__name: 'TestController',
			__templates: 'template/data-bind.ejs',
			__ready: function() {
				var str = this.view.get('simple', {
					test: 'a'
				});

				var $dom = $(str);
				strictEqual($dom.find('span').text(), 'バインド前', 'データバインドされていないこと');
				start();
			}
		});
	});

	//=============================
	// Definition
	//=============================
	module('コメントノードにバインド');

	//=============================
	// Body
	//=============================
	test('コントローラ内のviewでないviewインスタンスからはバインドできないこと', 2, function() {
		view.append($fixture, 'comment1');

		try {
			view.bind('h5view#item', {
				text: 'a',
				cls: 'testClass'
			});
		} catch (e) {
			strictEqual(e.code, ERR_VIEW.ERR_CODE_BIND_INVALID_TARGET, e.message);
		}
		var $span = $fixture.find('span');
		strictEqual($span.length, 0, 'コメントノードは展開されていないこと');
	});

	asyncTest('コメントノードにバインドできること', function() {
		view.append($fixture, 'comment1');

		h5.core.controller($fixture, {
			__name: 'TestController',
			__ready: function() {
				this.view.bind('h5view#item', {
					text: 'a',
					cls: 'testClass'
				});

				var $span = $fixture.find('span');
				strictEqual($span.text(), 'a', 'コメントノードにバインドされていること');
				strictEqual($span.attr('class'), 'testClass', 'コメントノードにバインドされていること');
				start();
			}
		});
	});

	asyncTest('コメントノードにObservableItemをバインド', 2, function() {

		view.append($fixture, 'comment2');
		var item = h5.u.obj.createObservableItem({
			v1: null,
			v2: null,
			item: null
		});
		item.set({
			v1: 'a',
			v2: 'b',
			item: {
				v1: 'aa',
				v2: 'bb'
			}
		});

		var c = h5.core.controller($fixture, {
			__name: 'TestController'
		});

		c.readyPromise.done(function() {
			c.view.bind('h5view#item', item);

			var $span = $fixture.find('span');
			checkTexts(['a', 'b', 'aa', 'bb'], 'コメントノードに書いた箇所にバインドされていること', 'span');

			//値の変更
			item.set({
				v1: 'aaa',
				v2: 'bbb'
			});

			var $span = $fixture.find('span');
			checkTexts(['aaa', 'bbb', 'aa', 'bb'], '変更が反映されること', 'span');
			start();
		});
	});

	asyncTest('コメントノードに配列をバインド', function() {
		view.append($fixture, 'comment3');

		var item = h5.u.obj.createObservableItem({
			test: null
		});

		item.set('test', 'c');

		var items = [{
			test: 'a'
		}, {
			test: 'b'
		}, item];

		var c = h5.core.controller($fixture, {
			__name: 'TestController'
		});

		c.readyPromise.done(function() {
			c.view.bind('h5view#item', {
				items: items
			});

			checkTexts(['a', 'b', 'c'], 'コメントノードに書いた箇所にバインドされていること');

			//変更
			item.set('test', 'cc');
			checkTexts(['a', 'b', 'cc'], '配列内のObservableItemの変更が反映されること');

			start();
		});
	});


	asyncTest('コメントノードにObservableArrayをバインド', function() {
		view.append($fixture, 'comment3');

		var item = h5.u.obj.createObservableItem({
			test: null
		});
		var items = h5.u.obj.createObservableArray();

		item.set('test', 'c');

		items.copyFrom([{
			test: 'a'
		}, {
			test: 'b'
		}, item]);

		var c = h5.core.controller($fixture, {
			__name: 'TestController'
		});

		c.readyPromise.done(function() {
			c.view.bind('h5view#item', {
				items: items
			});

			checkTexts(['a', 'b', 'c'], 'コメントノードに書いた箇所にバインドされていること');

			//変更
			items.shift();
			checkTexts(['b', 'c'], '変更が反映されていること');

			item.set('test', 'cc');
			checkTexts(['b', 'cc'], 'ObservableArray内のObservableItemの変更が反映されること');

			items.copyFrom([]);
			strictEqual($('#dataBindTest li').length, 0, '空配列になったら繰り返し要素がなくなること');

			start();
		});
	});

	asyncTest('inputタグへのバインドはvalue属性に値が設定されること', 4, function() {
		view.append($fixture, 'inputtext1');

		var items = {
			txt1: 2000,
			txt2: 3000
		};

		var c = h5.core.controller($fixture, {
			__name: 'TestController'
		});

		c.readyPromise.done(function() {
			c.view.bind('h5view#item', {
				items: items
			});

			equal($('#txt1').val(), items.txt1, 'value属性に値が設定されていること。');
			equal($('#txt2').val(), items.txt2, 'value属性に値が設定されていること。');
			equal($('#txt1').text(), '', 'テキストノードには何も設定されていないこと。');
			equal($('#txt2').text(), '', 'テキストノードには何も設定されていないこと。');

			start();
		});
	});

	asyncTest('inputタグへnullをバインドする', 5, function() {
		view.append($fixture, 'inputtext1');

		var items = {
			txt1: null,
			txt2: null,
			txt3: null
		};

		var c = h5.core.controller($fixture, {
			__name: 'TestController'
		});

		c.readyPromise.done(function() {
			c.view.bind('h5view#item', {
				items: items
			});

			equal($('#txt1').val(), '', 'value属性に値が設定されていること。');
			equal($('#txt2').val(), '', 'value属性に値が設定されていること。');
			equal($('#txt3').val(), '', 'value属性に値が設定されていること。');
			equal($('#txt1').text(), '', 'テキストノードには何も設定されていないこと。');
			equal($('#txt2').text(), '', 'テキストノードには何も設定されていないこと。');
			start();
		});
	});

	asyncTest('input[type="checkbox"]のcheckedプロパティに値が設定されること', 2, function() {
		view.append($fixture, 'inputcheck1');

		var items = {
			check1: 'checked',
			check2: 'checked'
		};

		var c = h5.core.controller($fixture, {
			__name: 'TestController'
		});

		c.readyPromise.done(function() {
			c.view.bind('h5view#item', {
				items: items
			});

			equal($('#txt1').attr('checked'), items.check1, 'value属性に値が設定されていること。');
			equal($('#txt2').attr('checked'), items.check2, 'value属性に値が設定されていること。');
			start();
		});
	});

	asyncTest('ネストしたコンテキストに定義されたinput[type="checkbox"]のcheckedプロパティに値が設定されること', 2, function() {
		view.append($fixture, 'inputcheck2');

		var items = {
			check1: 'checked',
			items2: {
				check2: 'checked'
			}
		};

		var c = h5.core.controller($fixture, {
			__name: 'TestController'
		});

		c.readyPromise.done(function() {
			c.view.bind('h5view#item', {
				items: items
			});

			equal($('#txt1').attr('checked'), items.check1, 'value属性に値が設定されていること。');
			equal($('#txt2').attr('checked'), items.check2, 'value属性に値が設定されていること。');
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('loop-contextコンテキストのネスト');

	//=============================
	// Body
	//=============================
	test('loop-contextの子要素にloop-contextがある要素に配列をバインドする', function() {
		var ar = [{
			ar: [{
				val: 1
			}]
		}, {
			ar: [{
				val: 2
			}, {
				val: 3
			}]
		}];

		view.append($fixture, 'nestloop1');
		view.bind($('#dataBindTest'), {
			items: ar
		});

		strictEqual($('#dataBindTest>div>div:eq(0)>span:eq(0)').text(), '1', 'バインドされていること');
		strictEqual($('#dataBindTest>div>div:eq(0)>span').length, ar[0].ar.length,
				'配列の要素数分DOMが生成されること');
		strictEqual($('#dataBindTest>div>div:eq(1)>span:eq(0)').text(), '2', 'バインドされていること');
		strictEqual($('#dataBindTest>div>div:eq(1)>span:eq(1)').text(), '3', 'バインドされていること');
		strictEqual($('#dataBindTest>div>div:eq(1)>span').length, ar[1].ar.length,
				'配列の要素数分DOMが生成されること');
	});

	test('loop-contextの子要素にloop-contextがある要素にObservableArrayをバインドする', function() {
		var ar = [{
			ar: [{
				val: 1
			}]
		}, {
			ar: [{
				val: 2
			}, {
				val: 3
			}]
		}];
		var oar = h5.u.obj.createObservableArray();
		oar.copyFrom(ar);

		view.append($fixture, 'nestloop1');
		view.bind($('#dataBindTest'), {
			items: oar
		});

		strictEqual($('#dataBindTest>div>div:eq(0)>span:eq(0)').text(), '1', 'バインドされていること');
		strictEqual($('#dataBindTest>div>div:eq(0)>span').length, oar[0].ar.length,
				'配列の要素数分DOMが生成されること');
		strictEqual($('#dataBindTest>div>div:eq(1)>span:eq(0)').text(), '2', 'バインドされていること');
		strictEqual($('#dataBindTest>div>div:eq(1)>span:eq(1)').text(), '3', 'バインドされていること');
		strictEqual($('#dataBindTest>div>div:eq(1)>span').length, oar[1].ar.length,
				'配列の要素数分DOMが生成されること');
	});

	//=============================
	// Definition
	//=============================
	module('unbind');

	//=============================
	// Body
	//=============================
	test('DataItemをバインド後、unbind()を実行する', function() {
		var schema = {
			id: {
				id: true
			},
			test: {
				type: 'string',
				defaultValue: 'abc'
			}
		};
		var manager = h5.core.data.createManager('TestManager');
		var model = manager.createModel({
			name: 'TestModel',
			schema: schema
		});
		var dataItem = model.create({
			id: '1'
		});

		view.append($fixture, 'itemBind8');
		var binding = view.bind($('#dataBindTest'), {
			item: dataItem
		});

		equal($('#dataBindTest span').text(), 'abc', 'strプロパティのdefaultValueがビューに反映されていること');

		binding.unbind();

		dataItem.set({
			test: 'AAAA'
		});

		equal($('#dataBindTest span').text(), 'abc', 'unbind後にDataItemを変更しても、ビューは変更されないこと');
	});

	test('ObservableItemをバインド後、unbind()を実行する', function() {
		var schema = {
			id: {
				id: true
			},
			test: {
				type: 'string',
				defaultValue: 'abc'
			}
		};
		var obsItem = h5.u.obj.createObservableItem(schema);

		view.append($fixture, 'itemBind8');
		var binding = view.bind($('#dataBindTest'), {
			item: obsItem
		});

		equal($('#dataBindTest span').text(), 'abc', 'strプロパティのdefaultValueがビューに反映されていること');

		binding.unbind();

		obsItem.set({
			test: 'AAAA'
		});

		equal($('#dataBindTest span').text(), 'abc', 'unbind後にDataItemを変更しても、ビューは変更されないこと');
	});

	test(
			'ObservableArrayをバインド後、unbind()を実行する',
			function() {
				var oar = h5.u.obj.createObservableArray();
				oar.copyFrom([{
					test: 1
				}, {
					test: 2
				}, {
					test: 3
				}]);

				view.append($fixture, 'itemBind7');
				var binding = view.bind($('#dataBindTest'), {
					item: {
						ary: oar
					}
				});

				equal($('#dataBindTest span').length, oar.length, name
						+ ': ObservableArrayの変更がビューに反映されていること');
				equal($('#dataBindTest span').eq(0).text(), '1', 'ObservableArrayの内容がビューに表示されていること');
				equal($('#dataBindTest span').eq(1).text(), '2', 'ObservableArrayの内容がビューに表示されていること');
				equal($('#dataBindTest span').eq(2).text(), '3', 'ObservableArrayの内容がビューに表示されていること');

				binding.unbind();

				oar.push({
					test: 1000
				});
				equal($('#dataBindTest span').length, 3,
						'push:unbind後にObservableArrayの内容を変更してもビューに反映されないこと');
				equal($('#dataBindTest span').eq(0).text(), '1', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(1).text(), '2', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(2).text(), '3', 'ビューが書き換わっていないこと');

				oar.splice(1, 1, {
					test: 10
				});
				equal($('#dataBindTest span').length, 3,
						'splice:unbind後にObservableArrayの内容を変更してもビューに反映されないこと');
				equal($('#dataBindTest span').eq(0).text(), '1', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(1).text(), '2', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(2).text(), '3', 'ビューが書き換わっていないこと');

				oar.pop();
				equal($('#dataBindTest span').length, 3,
						'pop:unbind後にObservableArrayの内容を変更してもビューに反映されないこと');
				equal($('#dataBindTest span').eq(0).text(), '1', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(1).text(), '2', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(2).text(), '3', 'ビューが書き換わっていないこと');

				oar.copyFrom([{
					test: 1000
				}, {
					test: 2000
				}, {
					test: 3000
				}]);
				equal($('#dataBindTest span').length, 3,
						'copyFrom:unbind後にObservableArrayの内容を変更してもビューに反映されないこと');
				equal($('#dataBindTest span').eq(0).text(), '1', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(1).text(), '2', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(2).text(), '3', 'ビューが書き換わっていないこと');

				oar.shift();
				equal($('#dataBindTest span').length, 3,
						'shift:unbind後にObservableArrayの内容を変更してもビューに反映されないこと');
				equal($('#dataBindTest span').eq(0).text(), '1', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(1).text(), '2', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(2).text(), '3', 'ビューが書き換わっていないこと');

				oar.unshift({
					test: 444
				});
				equal($('#dataBindTest span').length, 3,
						'unshift:unbind後にObservableArrayの内容を変更してもビューに反映されないこと');
				equal($('#dataBindTest span').eq(0).text(), '1', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(1).text(), '2', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(2).text(), '3', 'ビューが書き換わっていないこと');

				oar.sort();
				equal($('#dataBindTest span').length, 3,
						'sort:unbind後にObservableArrayの内容を変更してもビューに反映されないこと');
				equal($('#dataBindTest span').eq(0).text(), '1', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(1).text(), '2', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(2).text(), '3', 'ビューが書き換わっていないこと');

				oar.reverse();
				equal($('#dataBindTest span').length, 3,
						'reverse:unbind後にObservableArrayの内容を変更してもビューに反映されないこと');
				equal($('#dataBindTest span').eq(0).text(), '1', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(1).text(), '2', 'ビューが書き換わっていないこと');
				equal($('#dataBindTest span').eq(2).text(), '3', 'ビューが書き換わっていないこと');
			});
});