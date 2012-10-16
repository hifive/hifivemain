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
	var ERR = ERRCODE.h5.core.view_binding;

	/**
	 * viewのエラーコード
	 */
	var ERR_VIEW = ERRCODE.h5.core.view;

	/**
	 * view
	 */
	var view = h5.core.view.createView();

	view.load('template/data-bind.ejs');

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
			liTexts.push(this.innerText);
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

	test('data-h5-bind属性をしていた要素にバインドされているプロパティの値で中身が書き変わること', function() {
		view.append($fixture, 'simple');
		view.bind($('#dataBindTest'), {
			test: 'abc'
		});
		strictEqual($('#dataBindTest>span').text(), 'abc', 'data-h5-bind指定した要素の値が書き変わること');
	});

	test('data-h5-bind属性をしていた要素にバインドされているプロパティがない場合は、中身が変わらないこと', function() {
		view.append($fixture, 'simple');
		view.bind($('#dataBindTest'), {
			test2: 'abcd'
		});

		strictEqual($('#dataBindTest>span').text(), 'バインド前', 'data-h5-bind指定した要素の値が書き変わらないこと');
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
		var exp = ['null', '', 'abc', '-1234.567', 'NaN', 'Infinity', '-Infinity', ary.toString(),
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

	test('バインドする要素が複数ある場合は、エラーになること', 3, function() {
		view.append($fixture, 'bindSpan');
		view.append($fixture, 'bindSpan');
		var args = [$fixture.find('span'), '#qunit-fixture>span', $([1, 2])];
		for ( var i = 0, l = args.length; i < l; i++) {
			try {
				view.bind(args[i], {
					test: 'test'
				});
				ok(false, 'テスト失敗。エラーが発生していません。');
			} catch (e) {
				strictEqual(e.code, ERR_VIEW.ERR_CODE_BIND_TARGET_TOO_MANY, e.message);
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
				strictEqual(e.code, ERR_VIEW.ERR_CODE_BIND_TARGET_INVALID, e.message);
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
		var invalids = [1, $([1]), function() {
			throw {}
		}, [1], true];
		for ( var i = 0, l = invalids.length; i < l; i++) {
			try {
				view.bind(invalids[i], {
					test: i
				});
				ok(false, 'テスト失敗。エラーが発生していません。' + invalids[i]);
			} catch (e) {
				strictEqual(e.code, ERR_VIEW.ERR_CODE_BIND_TARGET_INVALID, e.message);
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

		var result = ['TEST', 'バインド無し', 'OBJ.TEST', 'OBJ.TEST2', 'OBJ.OBJ.TEST', 'バインド無し'];
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
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
		var noArys = [null, undefined, 1, 'a'];
		var l = noArys.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			view.append($fixture, 'loopContext1');
			try {
				view.bind($('#dataBindTest'), {
					test: 'aaa',
					items: noArys[i]
				});
				ok(false, 'テスト失敗。エラーが発生してません' + noArys[i]);
			} catch (e) {
				//TODO エラーコード確認
				strictEqual(e.code, 0, e.message);
			}
			$fixture.find('div').remove();
		}
		try {
			view.bind($('#dataBindTest'), {
				test: 'aaa'
			});
			ok(false, 'テスト失敗。指定無しでエラーが発生してません');
		} catch (e) {
			//TODO エラーコード確認
			strictEqual(e.code, 0, '指定無しでエラーになること');
		}
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

		//TODO どっちでテストするか（タグの入れ子あり、無しで両方テストする)
		// ulをliの中に入れた書き方<ul data-h5-loop-context="items"><li><ul data-h5-loop-cotnext"ary"><li></ul></ul>
		//		$fixture.append('<div id="dataBindTest">');
		//		$innerUl = $('<ul data-h5-loop-context="items"><li>');
		//		$innerUl.find('li').append(
		//				$('<ul data-h5-loop-context="ary">').append('<li data-h5-bind="test">'));
		//		$('#dataBindTest').append($innerUl);



		view.append($fixture, 'loopContext1');
		$innerUl = $('<ul data-h5-loop-context="ary">').append('<li data-h5-bind="test">');
		$fixture.find('ul').append($innerUl);
		view.bind($('#dataBindTest'), {
			items: ary
		});

		strictEqual($('#dataBindTest>ul>li:first').text(), 'A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:first>li').text(), 'A-A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)').text(), 'B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:eq(1)>li:first').text(), 'B-A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:eq(1)>li:eq(1)').text(), 'B-B', 'バインドされていること');
	});

	test('循環参照を持つ配列をバインドできること', function() {
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
		ary[0].ary = ary;
		view.append($fixture, 'loopContext1');
		$innerUl = $('<ul data-h5-loop-context="ary">').append('<li data-h5-bind="test">');
		$fixture.find('ul').append($innerUl);
		view.bind($('#dataBindTest'), {
			items: ary
		});

		strictEqual($('#dataBindTest>ul>li:first').text(), 'A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:first>li:first').text(), 'A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:first>li:eq(1)').text(), 'B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)').text(), 'B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:eq(1)>li:first').text(), 'B-A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:eq(1)>li:eq(1)').text(), 'B-B', 'バインドされていること');
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

		var noObjs = [null, undefined, 1, 'a', [], [{}]];

		var l = noObjs.length;
		for ( var i = 0; i < l; i++) {
			view.append($fixture, 'loopContext1');
			try {
				view.bind($('#dataBindTest'), {
					items: [{
						test: 'a'
					}, noObjs[i], {
						test: 'b'
					}]
				});
				ok(false, 'テスト失敗。エラーが発生していません');
			} catch (e) {
				//TODO エラーコード確認する
				strictEqual(e.code, 0, e.message);
			}
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

	test('ObservableArrayの要素のオブジェクトがさらにObservableArrayを持つ場合バインドできること', function() {
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
		var oAry = h5.u.obj.createObservableArray();
		view.append($fixture, 'loopContext1');
		$innerUl = $('<ul data-h5-loop-context="ary">').append('<li data-h5-bind="test">');
		$fixture.find('ul').append($innerUl);
		view.bind($('#dataBindTest'), {
			items: oAry
		});

		strictEqual($('#dataBindTest>ul>li:first').text(), 'A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:first>li').text(), 'A-A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)').text(), 'B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:eq(1)>li:first').text(), 'B-A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:eq(1)>li:eq(1)').text(), 'B-B', 'バインドされていること');
	});

	test('循環参照を持つObservableArrayをバインドできること', function() {
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
		view.append($fixture, 'loopContext1');
		$innerUl = $('<ul data-h5-loop-context="ary">').append('<li data-h5-bind="test">');
		$fixture.find('ul').append($innerUl);
		view.bind($('#dataBindTest'), {
			items: oAry
		});

		strictEqual($('#dataBindTest>ul>li:first').text(), 'A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:first>li:first').text(), 'A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:first>li:eq(1)').text(), 'B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)').text(), 'B', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:eq(1)>li:first').text(), 'B-A', 'バインドされていること');
		strictEqual($('#dataBindTest>ul>ul:eq(1)>li:eq(1)').text(), 'B-B', 'バインドされていること');
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
	test(
			'ObservableArrayの要素のオブジェクトが持つObservableArrayを変更した時ビューへ反映されること',
			function() {
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

				oAry.push([{
					test: 'b',
					ary: []
				}]);

				innerOAry.push({
					test: 'innerB'
				});

				strictEqual($('#dataBindTest>ul>li:first').text(), 'a', 'バインドされていること');
				strictEqual($('#dataBindTest>ul>ul:first>li:first').text(), 'innerA', 'バインドされていること');
				strictEqual($('#dataBindTest>ul>ul:first>li:nth-child(2)').text(), 'innerB',
						'バインドされていること');
				strictEqual($('#dataBindTest>ul>li:nth-child(2)').text(), 'b', 'バインドされていること');
			});

	test('循環参照を持つObservableArrayの中身を変更した時にビューへ反映されること', function() {
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

		oAry.splice(1, 1, {
			test: 'BB',
			ary: oAry
		});

		strictEqual($('#dataBindTest>ul>li:first').text(), 'A', '変更が反映されていること');
		strictEqual($('#dataBindTest>ul>ul:first>li:first').text(), 'A', '変更が反映されていること');
		strictEqual($('#dataBindTest>ul>ul:first>li:eq(1)').text(), 'BB', '変更が反映されていること');
		strictEqual($('#dataBindTest>ul>li:eq(1)').text(), 'BB', '変更が反映されていること');
		strictEqual($('#dataBindTest>ul>ul:eq(1)>li:first').text(), 'A', '変更が反映されていること');
		strictEqual($('#dataBindTest>ul>ul:eq(1)>li:eq(1)').text(), 'BB', '変更が反映されていること');
	});

	//=============================
	// Definition
	//=============================
	module('ObservableItem/DataItemのバインド');

	//=============================
	// Body
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
		}
	});

	//=============================
	// Body
	//=============================

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

			item.set({
				ary: [{
					test: 'newAry[0]'
				}]
			});
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
						test: 'otherOArray[0]'
					}]);
					item.set('any', oAry);
					result = ['otherOAry[0]'];
					checkTexts(result, itemType + ' 別のObservableArrayインスタンスに変更した時に反映されていること',
							'span');

					// 別のObservableArrayインスタンスに変更
					oAry.push([{
						test: 'otherOArray[1]'
					}]);
					item.set('any', oAry);
					result = ['otherOAry[0]', 'otherOAry[1]'];
					checkTexts(result, itemType + ' ObservableArrayのメソッドで中身を変更した時に反映されていること',
							'span');
				}, testSchema);
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

	test('テキストノードへのバインド', function() {
		// バインド先の設定
		view.append($fixture, 'text');

		var str = '<a href="#a">a</a>';
		view.bind($('#dataBindTest'), {
			test: str
		});

		var $span = $fixture.find('span');
		strictEqual($span.text(), str, '値がテキストノードとしてバインドされていること');
	});

	test('innerHTMLへのバインド', function() {
		// バインド先の設定
		view.append($fixture, 'html');

		var str = '<a href="#a">a</a>';
		view.bind($('#dataBindTest'), {
			test: str
		});

		var $span = $fixture.find('span');
		strictEqual($span.html(), str, '値がinnerHTMLとしてバインドされていること');
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

	//=============================
	// Definition
	//=============================
	var bindItem = h5.u.obj.createObservableItem({
		test: null
	});

	module('append/prepend/update', {
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
	test('append データバインドできること', function() {
		view.append($fixture, 'simple', {
			test: 'a'
		});

		strictEqual($('#inFixture').next('div').attr('id'), 'dataBindTest',
				'appendで、指定した要素内に後ろからテンプレートが追加されていること');
		strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
	});

	test('append 値の変更が反映されること', function() {
		view.append($fixture, 'simple', bindItem);
		strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
		//値の変更
		bindItem.set('test', 'b');

		strictEqual($('#dataBindTest span').text(), 'b', '値の変更が反映されること');
	});

	asyncTest('コントローラ内 this.view.append データバインドできること', function() {
		h5.core.controller($fixture, {
			__name: 'TestController',
			__templates: 'template/data-bind.ejs',
			__ready: function() {
				this.view.append(this.rootElement, 'simple', {
					test: 'a'
				});

				strictEqual($('#inFixture').next('div').attr('id'), 'dataBindTest',
						'appendで、指定した要素内に後ろからテンプレートが追加されていること');
				strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

				start();
			}
		});
	});

	asyncTest('コントローラ内 this.view.append 値の変更が反映されること', function() {
		h5.core.controller($fixture, {
			__name: 'TestController',
			__templates: 'template/data-bind.ejs',
			__ready: function() {
				this.view.append(this.rootElement, 'simple', {
					test: 'a'
				});

				strictEqual($('#inFixture').next('div').attr('id'), 'dataBindTest',
						'prependで、指定した要素内に後ろからテンプレートが追加されていること');
				strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

				start();
			}
		});
	});

	test('prepend データバインドできること', function() {
		view.prepend($fixture, 'simple', {
			test: 'a'
		});

		strictEqual($('#inFixture').prev('div').attr('id'), 'dataBindTest',
				'prependで、指定した要素内に前からテンプレートが追加されていること');
		strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
	});

	test('prepend 値の変更が反映されること', function() {
		view.prepend($fixture, 'simple', bindItem);
		strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
		//値の変更
		bindItem.set('test', 'b');

		strictEqual($('#dataBindTest span').text(), 'b', '値の変更が反映されること');
	});

	asyncTest('コントローラ内 this.view.prepend データバインドできること', function() {
		h5.core.controller($fixture, {
			__name: 'TestController',
			__templates: 'template/data-bind.ejs',
			__ready: function() {
				this.view.prepend(this.rootElement, 'simple', {
					test: 'a'
				});

				strictEqual($('#inFixture').prev('div').attr('id'), 'dataBindTest',
						'prependで、指定した要素内に前からテンプレートが追加されていること');
				strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

				start();
			}
		});
	});

	asyncTest('コントローラ内 this.view.prepend 値の変更が反映されること', function() {
		h5.core.controller($fixture, {
			__name: 'TestController',
			__templates: 'template/data-bind.ejs',
			__ready: function() {
				this.view.prepend(this.rootElement, 'simple', {
					test: 'a'
				});

				strictEqual($('#inFixture').prev('div').attr('id'), 'dataBindTest',
						'prependで、指定した要素内に前からテンプレートが追加されていること');
				strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

				start();
			}
		});
	});

	test('update データバインドできること', function() {
		view.update($fixture, 'simple', {
			test: 'a'
		});

		ok($('#inFixture').length === 0 && $('#dataBindTest').length === 1,
				'updateで、指定した要素内が更新されていること');
		strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
	});

	test('update 値の変更が反映されること', function() {
		view.update($fixture, 'simple', bindItem);
		strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
		//値の変更
		bindItem.set('test', 'b');

		strictEqual($('#dataBindTest span').text(), 'b', '値の変更が反映されること');
	});

	asyncTest('コントローラ内 this.view.update データバインドできること', function() {
		h5.core.controller($fixture, {
			__name: 'TestController',
			__templates: 'template/data-bind.ejs',
			__ready: function() {
				this.view.update(this.rootElement, 'simple', {
					test: 'a'
				});

				ok($('#inFixture').length === 0 && $('#dataBindTest').length === 1,
						'updateで、指定した要素内が更新されていること');
				strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

				start();
			}
		});
	});

	asyncTest('コントローラ内 this.view.update 値の変更が反映されること', function() {
		h5.core.controller($fixture, {
			__name: 'TestController',
			__templates: 'template/data-bind.ejs',
			__ready: function() {
				this.view.update(this.rootElement, 'simple', {
					test: 'a'
				});

				ok($('#inFixture').length === 0 && $('#dataBindTest').length === 1,
						'updateで、指定した要素内が更新されていること');
				strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

				start();
			}
		});
	});

	test('EJSテンプレートの評価後にデータバインドが実行されること', function() {
		view.append($fixture, 'ejsBind', {
			value: 'test',
			test: 'a'
		});
		strictEqual($('#dataBindTest span').text(), 'a', 'EJSテンプレートが評価されて、データバインドされていること');
		strictEqual($('#dataBindTest p').attr('id'), 'a', 'EJSテンプレートが評価されて、データバインドされていること');
	});

	asyncTest('コントローラ内 EJSテンプレートの評価後にデータバインドが実行されること', function() {
		h5.core.controller($fixture,
				{
					__name: 'TestController',
					__templates: 'template/data-bind.ejs',
					__ready: function() {

						this.view.append($fixture, 'ejsBind', {
							value: 'test',
							test: 'a'
						});
						strictEqual($('#dataBindTest span').text(), 'a',
								'EJSテンプレートが評価されて、データバインドされていること');
						strictEqual($('#dataBindTest p').attr('id'), 'a',
								'EJSテンプレートが評価されて、データバインドされていること');
						start();
					}
				});
	});

	//=============================
	// Definition
	//=============================
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
			view.bind('h5bind#item', {
				text: 'a',
				cls: 'testClass'
			});
		} catch (e) {
			strictEqual(e.code, ERR_VIEW.ERR_CODE_BIND_TARGET_INVALID, e.message);
		}
		var $span = $fixture.find('span');
		strictEqual($span.length, 0, 'コメントノードは展開されていないこと');
	});

	asyncTest('コメントノードにバインドできること', function() {
		view.append($fixture, 'comment1');

		h5.core.controller($fixture, {
			__name: 'TestController',
			__ready: function() {
				this.view.bind('h5bind#item', {
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
			__name: 'TestController',
		});

		c.readyPromise.done(function() {
			c.view.bind('h5bind#item', item);

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
			__name: 'TestController',
		});

		c.readyPromise.done(function() {
			c.view.bind('h5bind#item', {
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
			__name: 'TestController',
		});

		c.readyPromise.done(function() {
			c.view.bind('h5bind#item', {
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

});