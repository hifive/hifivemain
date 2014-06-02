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
	var DATA_H5_BIND = 'data-h5-bind';
	var DATA_H5_CONTEXT = 'data-h5-context';
	var DATA_H5_LOOP_CONTEXT = 'data-h5-loop-context';

	var DATA_H5_DYN_CTX = 'data-h5-dyn-ctx';
	var DATA_H5_DYN_VID = 'data-h5-dyn-vid';
	var DATA_H5_DYN_BIND_ROOT = 'data-h5-dyn-bind-root';
	var DATA_H5_DYN_CN = 'data-h5-dyn-cn';

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	//=============================
	// Variables
	//=============================
	// testutils
	var rgbToHex = testutils.u.rgbToHex;
	var clearController = testutils.u.clearController;
	var createIFrameElement = testutils.dom.createIFrameElement;
	var openPopupWindow = testutils.dom.openPopupWindow;
	var closePopupWindow = testutils.dom.closePopupWindow;

	/**
	 * #qunit-fixture
	 */
	var $fixture = $('#qunit-fixture');

	/**
	 * viewのエラーコード定数
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
		var obsItem = h5.core.data.createObservableItem(schema);
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
		var textList = [];
		// 要素を取得するときに記述されている順番通りになるように取得する
		function makeTextList(root) {
			var node = root.firstChild;
			while (node) {
				//1 === NodeType.ELEMENT_NODE
				if (node.nodeType === 1) {
					if ($(node).is(sel)) {
						textList.push($(node).text());
					} else {
						makeTextList(node);
					}
				}
				node = node.nextSibling;
			}
		}
		makeTextList($('#dataBindTest')[0]);
		deepEqual(textList, expectAry, message);
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

		view.bind($('#dataBindTest'), {
			test2: 'abcd'
		});

		strictEqual($('#dataBindTest>span').text(), '', 'データが空の状態でバインドされること(nullのときと同じ)');
	});

	// TODO Array型とObject型のバインドに対するテストは後で追加する
	test('null, undefined, String, Numberが、それぞれ表示されること', function() {
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
			dataFunc: func
		});
		var exp = ['', '', 'abc', '-1234.567', 'NaN', 'Infinity', '-Infinity', ''];
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

	test('複数要素にバインドできること', 2, function() {
		view.append($fixture, 'bindSpan');
		view.append($fixture, 'bindSpan');
		try {
			view.bind($fixture.find('span'), {
				test: 'test'
			});

			equal($('#qunit-fixture>span:first').text(), 'test');
			equal($('#qunit-fixture>span:last').text(), 'test');
		} catch (e) {
			ok(false, 'エラーが発生したためテスト失敗。');
		}
	});

	test('バインドする要素が存在しない場合は、エラーになること', 3, function() {
		var args = [$fixture.find('#noExist'), '#noExist', $([])];
		for (var i = 0, l = args.length; i < l; i++) {
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

	test('バインドする要素の指定方法はjQueryオブジェクト、DOM、セレクタのいずれかであること', function() {
		view.append($fixture, 'bindSpan');
		var strs = ['jQueryオブジェクト', 'DOM', 'セレクタ'];
		var arg = null;

		for (var i = 0, l = strs.length; i < l; i++) {
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
			var binding = view.bind(arg, {
				test: i
			});
			equal($fixture.find('span').text(), i, strs[i] + 'を引数に指定できること');

			binding.unbind();
		}
	});

	test('バインドする要素の指定に不正な値を渡すとエラーになること', function() {
		view.append($fixture, 'bindSpan');
		var invalids = [$(), null, undefined];
		for (var i = 0, l = invalids.length; i < l; i++) {
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
		/** @type Any */
		var args = [null, undefined, [{}], 1, 'abc', true];
		for (var i = 0, l = args.length; i < l; i++) {
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
		strictEqual($span[0].className, '', 'class:何も設定されていないこと');
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
		strictEqual($span.attr('class'), 'hoge', 'バインド開始前に設定されていた値に戻ること');
	});

	test('一つの要素にtextとhtmlのプロパティをバインドする', function() {
		view.append($fixture, 'object3');
		view.bind('#dataBindTest', {
			v1: 'v1',
			v2: 'v2'
		});
		var $span = $fixture.find('span');
		strictEqual($span.html(), 'v2', '複数のプロパティをhtml,textで指定した場合、一番最後に指定したものがバインドされること');
	});

	test('クラスに既に設定されている値と同じ値をバインドする', function() {
		view.append($fixture, 'object4');
		view.bind('#dataBindTest', {
			v1: 'c2'
		});
		var $span = $fixture.find('span');
		strictEqual($span[0].className, 'c1 c2 c3', '同じクラスが重複して設定されないこと');
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
		var noArys = [{}, $(), function() {/* no code */}];
		var l = noArys.length;
		for (var i = 0; i < l; i++) {
			view.append($fixture, 'loopContext1');
			try {
				view.bind($('#dataBindTest'), {
					test: 'aaa',
					items: noArys[i]
				});
				ok(false, 'テスト失敗。エラーが発生してません' + noArys[i]);
			} catch (e) {
				strictEqual(e.code, ERR_VIEW.ERR_CODE_INVALID_CONTEXT_SRC, e.message);
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
		var items = h5.core.data.createObservableArray();
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
		var items = h5.core.data.createObservableArray();
		items.copyFrom([]);

		view.append($fixture, 'loopContext1');
		view.bind($('#dataBindTest'), {
			test: 'aaa',
			items: items
		});

		strictEqual($('#dataBindTest li').length, 0, '繰り返される要素が一つもないこと');
	});

	test('中身がオブジェクトでないObservableArrayをバインドするとエラーになること', function() {
		var items = h5.core.data.createObservableArray();
		items.copyFrom([]);

		/** @type Any */
		var noObjs = [1, 'a', [], [{}]];

		var l = noObjs.length;
		for (var i = 0; i < l; i++) {
			view.append($fixture, 'loopContext1');

			throws(function(enviroment) {
				view.bind($('#dataBindTest'), {
					items: [{
						test: 'a'
					}, noObjs[i], {
						test: 'b'
					}]
				});
			}, function(actual) {
				return ERR_VIEW.ERR_CODE_INVALID_CONTEXT_SRC === actual.code;
			}, 'コンテキストにArrayまたはObservableArrayを指定していないためエラーになること"');

			$fixture.children().remove();
		}
		expect(l);
	});

	test('ObservableItemを要素に持つObservableArrayをバインドできること', 1, function() {
		var items = h5.core.data.createObservableArray();
		var schema = {
			test: null
		};
		var item1 = h5.core.data.createObservableItem(schema);
		item1.set('test', 'aa');
		var item2 = h5.core.data.createObservableItem(schema);
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

		var oAry = h5.core.data.createObservableArray();
		oAry.copyFrom(ary);

		oAry.get(0).ary = oAry;
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

	var oAryInitValue = [{
		test: '初期値0'
	}, {
		test: '初期値1'
	}, {
		test: '初期値2'
	}];

	module('ObservableArrayの変更検知 各メソッド', {
		setup: function() {
			oAry = h5.core.data.createObservableArray();
			oAry.copyFrom(oAryInitValue);
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

	test('set', function() {
		//TODO テストケース改善

		oAry.set(0, {
			test: 'a'
		});
		checkTexts(['a', '初期値1', '初期値2'], '既存値の上書きが反映されること');

		oAry.set(0, {
			test: 'A'
		});
		oAry.set(1, {
			test: 'B'
		});
		oAry.set(3, {
			test: 'C'
		});
		checkTexts(['A', 'B', '初期値2', 'C'], '末尾にセットしてサイズが拡張された場合');

		oAry.copyFrom([]);
		oAry.set(0, {
			test: 'x'
		});
		checkTexts(['x'], '空にした状態からセットした場合');
	});

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
		var item1 = h5.core.data.createObservableItem(schema);
		var item2 = h5.core.data.createObservableItem(schema);
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
		var innerOAry = h5.core.data.createObservableArray();
		innerOAry.copyFrom([{
			test: 'innerA',
			ary: []
		}]);
		var ary = [{
			test: 'a',
			ary: innerOAry
		}];
		var oAry = h5.core.data.createObservableArray();
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
				var oAry = h5.core.data.createObservableArray();
				oAry.copyFrom(ary);
				oAry.get(0).ary = oAry;
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
			var oAry = h5.core.data.createObservableArray();
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
		function createExpAry(oary) {
			var ret = [];
			for (var i = 0, l = oary.length; i < l; i++) {
				var val = oary.get(i).test;
				ret.push(val != null ? val.toString() : '');
			}
			return ret;
		}
		var oar = h5.core.data.createObservableArray();
		oar.push({
			test: 1
		});

		view.append($fixture, 'loopContext1');
		view.bind($('#dataBindTest'), {
			items: oar
		});

		checkTexts(createExpAry(oar), 'li[i].text() == ObservableArray[i].test');

		// 値を追加する
		oar.push({
			test: 2
		});
		checkTexts(createExpAry(oar), 'li[i].text() == ObservableArray[i].test');

		// nullを追加する
		oar.push({
			test: null
		});
		checkTexts(createExpAry(oar), 'li[i].text() == ObservableArray[i].test');

		// 値を取り出す
		oar.pop();
		checkTexts(createExpAry(oar), 'li[i].text() == ObservableArray[i].test');

		// 値の変更をキャンセルする
		oar.addEventListener('changeBefore', function(ev) {
			ev.preventDefault();
		});
		oar.pop();
		checkTexts(createExpAry(oar),
				'changeBeforeイベントをキャンセルしてObservableArrayの中身に変更がないので、ビューは変更されないこと');
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
						item2 = h5.core.data.createObservableItem(testSchema);
						item4 = h5.core.data.createObservableItem(testSchema);
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

					var obsArray = h5.core.data.createObservableArray();
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
					var oAry = h5.core.data.createObservableArray();
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
	module('DataItem/ObservableItemが保持するObservableArrayに対する変更', {
		setup: function() {
			var schema = {
				id: {
					id: true
				},
				ary: {
					type: 'any[]'
				},
				ary2: {
					type: 'any'
				}
			};
			this.testDataModelManager = h5.core.data.createManager('TestManager');
			this.testDataModel = this.testDataModelManager.createModel({
				name: 'TestModel',
				schema: schema
			});
			this.testDataItem = this.testDataModel.create({
				id: '1'
			});

			this.testObsItem = h5.core.data.createObservableItem(schema);
		},
		teardown: function() {
			$('#dataBindTest').remove();
			this.testDataModel.remove('1');
			this.testDataModelManager.dropModel(this.testDataModel);
			this.testDataModel = null;
			this.testDataItem = null;
			this.testObsItem = null;
		},
		testDataModelManager: null,
		testDataModel: null,
		testDataItem: null,
		testObsItem: null
	});

	//=============================
	// Body
	//=============================
	test(
			'type:any[]に格納されたObservableArrayをDataItem#set()で更新する',
			function() {
				function testFunc(item) {
					var name = item.getModel ? 'DataItem' : 'ObservableItem';
					view.append($fixture, 'itemBind7');

					// 初期値を設定
					var oar = h5.core.data.createObservableArray();
					oar.push({
						test: 'AAAA'
					});
					item.set('ary', oar);

					var binding = view.bind($('#dataBindTest'), {
						item: item
					});

					// loop-contextをnullで更新
					item.set('ary', null);
					equal($('#dataBindTest .loop1').length, 0, name
							+ ': ObservableArrayの変更がビューに反映されていること');

					// loop-contextを別のObsArrayで更新
					var oar2 = h5.core.data.createObservableArray();
					oar2.push({
						test: 10
					}, {
						test: 20
					});
					item.set('ary', oar2);
					checkTexts(['10', '20'], name + ': ObservableArrayの内容がビューに反映されていること', '.loop1');

					binding.unbind();
					$('#dataBindTest').remove();
				}

				testFunc(this.testDataItem);
				testFunc(this.testObsItem);
			});

	test(
			'type:anyに格納されたObservableArrayをDataItem#set()で更新する',
			function() {
				function testFunc(item) {
					var name = item.getModel ? 'DataItem' : 'ObservableItem';
					view.append($fixture, 'itemBind7');

					// 初期値を設定
					var oar = h5.core.data.createObservableArray();
					oar.push({
						test: 'AAAA'
					});
					item.set('ary2', oar);

					var binding = view.bind($('#dataBindTest'), {
						item: item
					});

					// loop-contextをnullで更新
					item.set('ary2', null);
					equal($('#dataBindTest .loop2').length, 0, name
							+ ': ObservableArrayの変更がビューに反映されていること');

					// loop-contextを別のObsArrayで更新
					var oar2 = h5.core.data.createObservableArray();
					oar2.push({
						test: 10
					}, {
						test: 20
					});
					item.set('ary2', oar2);
					checkTexts(['10', '20'], name + ': ObservableArrayの内容がビューに反映されていること', '.loop2');

					binding.unbind();
					$('#dataBindTest').remove();
				}

				testFunc(this.testDataItem);
				testFunc(this.testObsItem);
			});

	test('copyFrom()', function() {
		function testFunc(item) {
			var name = item.getModel ? 'DataItem' : 'ObservableItem';
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
			checkTexts(['a', 'b', 'c'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			oar.copyFrom([{
				test: 'a'
			}]);
			equal($('#dataBindTest span').text(), oar.get(0).test, name
					+ ': ObservableArrayの内容がビューに反映されていること');

			binding.unbind();

			oar.copyFrom([{
				test: 'A'
			}, {
				test: 'B'
			}, {
				test: 'C'
			}]);
			equal($('#dataBindTest span').text(), 'a', name
					+ ': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと');

			$('#dataBindTest').remove();
		}
		testFunc(this.testDataItem);
		testFunc(this.testObsItem);
	});

	test('push()', function() {
		function testFunc(item) {
			var name = item.getModel ? 'DataItem' : 'ObservableItem';
			view.append($fixture, 'itemBind7');

			var binding = view.bind($('#dataBindTest'), {
				item: item
			});

			item.addEventListener('change', function(ev) {
				ok(true, 'アイテムのchangeイベントが発生すること');
			});

			var oar = item.get('ary');

			equal(oar.length, 0, name + ': ObservableArrayには何も格納されていないこと。');
			oar.push({
				test: 'AAA'
			});

			equal($('#dataBindTest span').text(), 'AAA', name
					+ ': ObservableArrayの内容がビューに反映されていること');

			oar.push({
				test: 'BBB'
			});

			checkTexts(['AAA', 'BBB'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			oar.push({
				test: 'CCC'
			});

			checkTexts(['AAA', 'BBB', 'CCC'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			binding.unbind();

			oar.push({
				test: 'DDD'
			});

			checkTexts(['AAA', 'BBB', 'CCC'], name
					+ ': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと', 'span');

			$('#dataBindTest').remove();
		}
		testFunc(this.testDataItem);
		testFunc(this.testObsItem);
	});

	test('pop()', function() {
		function testFunc(item) {
			var name = item.getModel ? 'DataItem' : 'ObservableItem';
			view.append($fixture, 'itemBind7');
			var binding = view.bind($('#dataBindTest'), {
				item: item
			});

			item.addEventListener('change', function(ev) {
				ok(true, 'アイテムのchangeイベントが発生すること');
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

			checkTexts(['a', 'b', 'c', 'd'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			oar.pop();
			checkTexts(['a', 'b', 'c'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			oar.pop();
			checkTexts(['a', 'b'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			oar.pop();
			checkTexts(['a'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			binding.unbind();

			oar.pop();
			checkTexts(['a'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			$('#dataBindTest').remove();
		}
		testFunc(this.testDataItem);
		testFunc(this.testObsItem);
	});

	test('shift()', function() {
		function testFunc(item) {
			var name = item.getModel ? 'DataItem' : 'ObservableItem';
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

			checkTexts(['a', 'b', 'c', 'd'], name + ': set()で設定した値が格納されていること', 'span');

			oar.shift();
			checkTexts(['b', 'c', 'd'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			oar.shift();
			checkTexts(['c', 'd'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			oar.shift();
			checkTexts(['d'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');
			binding.unbind();

			oar.shift();

			checkTexts(['d'], name + ': unbind()後ObservableArrayに変更を加えてもビューは更新されないこと', 'span');

			$('#dataBindTest').remove();
		}
		testFunc(this.testDataItem);
		testFunc(this.testObsItem);
	});

	test('unshift()', function() {
		function testFunc(item) {
			var name = item.getModel ? 'DataItem' : 'ObservableItem';
			view.append($fixture, 'itemBind7');
			var binding = view.bind($('#dataBindTest'), {
				item: item
			});

			var oar = item.get('ary');

			equal(oar.length, 0, name + ': ObservableArrayには何も格納されていないこと。');
			oar.unshift({
				test: 'a'
			});
			checkTexts(['a'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			oar.unshift({
				test: 'b'
			});
			checkTexts(['b', 'a'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			oar.unshift({
				test: 'c'
			});
			checkTexts(['c', 'b', 'a'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			binding.unbind();

			oar.unshift({
				test: 'd'
			});
			checkTexts(['c', 'b', 'a'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			$('#dataBindTest').remove();
		}
		testFunc(this.testDataItem);
		testFunc(this.testObsItem);
	});

	test('splice()', function() {
		function testFunc(item) {
			var name = item.getModel ? 'DataItem' : 'ObservableItem';
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

			checkTexts(['a', 'b', 'c'], name + ': set()で設定した値が格納されていること', 'span');

			oar.splice(1, 2);
			checkTexts(['a'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			var obj = {
				test: 'AA'
			};
			oar.splice(0, 1, obj);
			checkTexts(['AA'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			binding.unbind();

			oar.splice(0, 1);
			checkTexts(['AA'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			$('#dataBindTest').remove();
		}
		testFunc(this.testDataItem);
		testFunc(this.testObsItem);
	});

	test('sort()', function() {
		function testFunc(item) {
			var name = item.getModel ? 'DataItem' : 'ObservableItem';
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

			checkTexts(['1', '5', '3'], name + ': set()で設定した値が格納されていること', 'span');

			oar.sort(function(a, b) {
				return a.test < b.test ? 1 : a.test > b.test ? -1 : 0;
			});

			checkTexts(['5', '3', '1'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			oar.sort(function(a, b) {
				return a.test > b.test ? 1 : a.test < b.test ? -1 : 0;
			});

			checkTexts(['1', '3', '5'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			binding.unbind();

			oar.sort(function(a, b) {
				return a.test < b.test ? 1 : a.test > b.test ? -1 : 0;
			});
			checkTexts(['1', '3', '5'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			$('#dataBindTest').remove();
		}
		testFunc(this.testDataItem);
		testFunc(this.testObsItem);
	});

	test('reverse()', function() {
		function testFunc(item) {
			var name = item.getModel ? 'DataItem' : 'ObservableItem';
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

			checkTexts(['1', '5', '3'], name + ': set()で設定した値が格納されていること', 'span');

			oar.reverse();

			checkTexts(['3', '5', '1'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			binding.unbind();

			oar.reverse();
			checkTexts(['3', '5', '1'], name + ': ObservableArrayの内容がビューに反映されていること', 'span');

			$('#dataBindTest').remove();
		}
		testFunc(this.testDataItem);
		testFunc(this.testObsItem);
	});

	test('beginUpdate/endUpdateでイベント制御されているときに、DataItemに属するObservableArrayを変更する', 2, function() {
		var item = this.testDataItem;
		view.append($fixture, 'itemBind7');

		// 初期値を設定
		var oar = h5.core.data.createObservableArray();
		oar.push({
			test: 'A'
		});
		item.set('ary', oar);

		var binding = view.bind($('#dataBindTest'), {
			item: item
		});

		this.testDataModelManager.beginUpdate();
		item.get('ary').push({
			test: 'B'
		});
		checkTexts(['A'], 'beginUpdate()後の更新はObservableArrayの変更はビューに反映されないこと', '.loop1');
		this.testDataModelManager.endUpdate();
		checkTexts(['A', 'B'], 'endUpdateのタイミングでビューに反映されること', '.loop1');

		binding.unbind();
		$('#dataBindTest').remove();
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

	test('値を更新する', function() {
		view.append($fixture, 'itemBind9');
		var binding = view.bind($('#dataBindTest'), {
			item: testDataItem2
		});


		checkTexts(['10'], 'DataItemの内容がビューに反映されていること', 'span');

		testBaseDataItem.set({
			test: 1000
		});

		checkTexts(['1000'], '更新した値がビューに反映されていること', 'span');

		binding.unbind();

		testBaseDataItem.set({
			test: 5000
		});

		checkTexts(['1000'], 'unbind()後にDataItemを更新してもビューに反映されないこと', 'span');
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
		checkTexts(['10'], 'DataItemの内容がビューに反映されていること', 'span');

		testDataItem2.set({
			data: item
		});
		checkTexts(['500'], '更新した値がビューに反映されていること', 'span');

		testDataItem2.set({
			data: null
		});
		checkTexts([''], '更新した値がビューに反映されていること', 'span');

		testDataItem2.set({
			data: item2
		});
		checkTexts(['5000'], '更新した値がビューに反映されていること', 'span');

		binding.unbind();

		testDataItem2.set({
			data: item3
		});
		checkTexts(['5000'], 'unbind()後にDataItemを更新してもビューに反映されないこと', 'span');
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

		throws(function(enviroment) {
			view.bind('#dataBindTest', {
				id: 'bindTest123'
			});
		}, function(actual) {
			return ERR_VIEW.ERR_CODE_REQUIRE_DETAIL === actual.code;
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
		strictEqual(rgbToHex($(span1).css('display')), 'block', '上書きされていないスタイルはそのまま残っていること');
		strictEqual(span2.style.marginTop, '5px', 'バインドしたスタイルが適応されていること');
		strictEqual(span2.style.marginRight, '10px', 'バインドしたスタイルが適応されていること');
		strictEqual(span2.style.marginBottom, '20px', 'バインドしたスタイルが適応されていること');
		strictEqual(span2.style.marginLeft, '30px', 'バインドしたスタイルが適応されていること');
		strictEqual(rgbToHex($(span2).css('display')), 'block', '上書きされていないスタイルはそのまま残っていること');
	});

	test('プロパティ名を指定せずに、styleへバインド', function() {
		// バインド先の設定
		view.append($fixture, 'style2');

		throws(function(enviroment) {
			view.bind('#dataBindTest', {
				color: 'red'
			});
		}, function(actual) {
			return ERR_VIEW.ERR_CODE_REQUIRE_DETAIL === actual.code;
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

		// strに"&"が含まれる場合、bind(内部的には$.html())で値をセットした時に"&amp;"にエスケープされる
		// (element.innerHTML = '&' でも同じ)
		// URL中の文字がエスケープされていても正しいURLと解釈されてリンクを踏めるので問題ない。

		var $span = $fixture.find('span');
		strictEqual($span.html().toLowerCase().replace(/&amp;/g, '&'), str.toLowerCase(),
				'値がinnerHTMLとしてバインドされていること');
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

		throws(function(enviroment) {
			view.bind('#dataBindTest', {
				id: 'bindTest123'
			});
		}, function(actual) {
			return ERR_VIEW.ERR_CODE_UNKNOWN_BIND_DIRECTION === actual.code;
		}, 'data-h5-bindのstyleにプロパティ名を指定していないためエラーになること"');
	});

	//=============================
	// Definition
	//=============================
	var bindItem = h5.core.data.createObservableItem({
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
			clearController();
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
	module('コメントビューにバインド', {
		teardown: function() {
			clearController();
		}
	});

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
		strictEqual($span.length, 0, 'コメントビューは展開されていないこと');
	});

	asyncTest('コメントビューにバインドできること', function() {
		view.append($fixture, 'comment1');

		h5.core.controller($fixture, {
			__name: 'TestController',
			__ready: function() {
				this.view.bind('h5view#item', {
					text: 'a',
					cls: 'testClass'
				});

				var $span = $fixture.find('span');
				strictEqual($span.text(), 'a', 'コメントビューにバインドされていること');
				strictEqual($span.attr('class'), 'testClass', 'コメントビューにバインドされていること');
				start();
			}
		});
	});

	asyncTest('コメントビューにObservableItemをバインド', 2, function() {

		view.append($fixture, 'comment2');
		var item = h5.core.data.createObservableItem({
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

			checkTexts(['a', 'b', 'aa', 'bb'], 'コメントビューに書いた箇所にバインドされていること', 'span');

			//値の変更
			item.set({
				v1: 'aaa',
				v2: 'bbb'
			});

			checkTexts(['aaa', 'bbb', 'aa', 'bb'], '変更が反映されること', 'span');
			start();
		});
	});

	asyncTest('コメントビューに配列をバインド', function() {
		view.append($fixture, 'comment3');

		var item = h5.core.data.createObservableItem({
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

			checkTexts(['a', 'b', 'c'], 'コメントビューに書いた箇所にバインドされていること');

			//変更
			item.set('test', 'cc');
			checkTexts(['a', 'b', 'cc'], '配列内のObservableItemの変更が反映されること');

			start();
		});
	});


	asyncTest('コメントビューにObservableArrayをバインド', function() {
		view.append($fixture, 'comment3');

		var item = h5.core.data.createObservableItem({
			test: null
		});
		var items = h5.core.data.createObservableArray();

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

			checkTexts(['a', 'b', 'c'], 'コメントビューに書いた箇所にバインドされていること');

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

	asyncTest('inputタグへのバインドはvalueに値が設定されること', 6, function() {
		view.append($fixture, 'inputtext1');

		var item = h5.core.data.createObservableItem({
			txt1: null,
			txt2: null,
			txt3: null
		});
		item.set('txt2', 'hoge2');
		item.set('txt3', 'hoge3');

		var c = h5.core.controller($fixture, {
			__name: 'TestController'
		});

		c.readyPromise.done(function() {
			c.view.bind('h5view#item', {
				items: item
			});

			equal($('#txt2').val(), 'hoge2', 'valueに値が設定されていること。');
			equal($('#txt3').val(), 'hoge3', 'valueに値が設定されていること。attr(value)指定');
			equal($('#txt2').text(), '', 'テキストノードには何も設定されていないこと。');
			equal($('#txt3').text(), '', 'テキストノードには何も設定されていないこと。※attr(value)指定');

			$('#txt2')[0].value = 'ユーザー入力';
			$('#txt3')[0].value = 'ユーザー入力';
			item.set('txt2', 'fuga2');
			item.set('txt3', 'fuga3');
			equal($('#txt2').val(), 'fuga2',
					'ユーザ入力があった後(valueの変更後)でも、バインドされている値が更新されるとvalueが更新されること');
			equal($('#txt3').val(), 'fuga3',
					'ユーザ入力があった後(valueの変更後)でも、バインドされている値が更新されるとvalueが更新されること ※attr(value)指定');
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
			}, {
				val: 2
			}, {
				val: 3
			}]
		}];

		view.append($fixture, 'nestloop1');
		view.bind($('#dataBindTest'), {
			items: ar
		});


		checkTexts(['1', '2', '3'], 'バインドされていること', 'span');
	});

	test('loop-contextの子要素にloop-contextがある要素にnullが含まれている配列をバインドする', function() {
		var ar = [{
			ar: [{
				val: 1
			}, null, {
				val: 3
			}]
		}];

		view.append($fixture, 'nestloop1');
		view.bind($('#dataBindTest'), {
			items: ar
		});

		checkTexts(['1', '', '3'], 'バインドされていること', 'span');
	});

	test('loop-contextの子要素に複数loop-contextがある要素に配列をバインドする', function() {
		var ar = [{
			ar: [{
				val: 1
			}, {
				val: 2
			}, {
				val: 3
			}],
			ar2: [{
				val: 10
			}, {
				val: 20
			}, {
				val: 30
			}]

		}];

		view.append($fixture, 'nestloop2');
		view.bind($('#dataBindTest'), {
			items: ar
		});


		checkTexts(['1', '2', '3', '10', '20', '30'], 'バインドされていること', 'span');
	});

	test('loop-contextの子要素に複数loop-contextがある要素にnullが含まれている配列をバインドする', function() {
		var ar = [{
			ar: [{
				val: 1
			}, {
				val: 2
			}, {
				val: 3
			}],
			ar2: [{
				val: 10
			}, {
				val: 20
			}, {
				val: 30
			}]
		}, {
			ar: null,
			ar2: [{
				val: 100
			}, {
				val: 200
			}, {
				val: 300
			}]
		}];

		view.append($fixture, 'nestloop2');
		view.bind($('#dataBindTest'), {
			items: ar
		});

		checkTexts(['1', '2', '3', '10', '20', '30', '100', '200', '300'], 'バインドされていること', 'span');
	});

	test('loop-contextの子要素にloop-contextがある要素にObservableArrayをバインドする', function() {
		var ar = [{
			ar: [{
				val: 1
			}, {
				val: 2
			}, {
				val: 3
			}]
		}];
		var oar = h5.core.data.createObservableArray();
		oar.copyFrom(ar);

		view.append($fixture, 'nestloop1');
		view.bind($('#dataBindTest'), {
			items: oar
		});


		checkTexts(['1', '2', '3'], 'バインドされていること', 'span');
	});

	test('loop-contextの子要素にloop-contextがある要素にnullが含まれているObservableArrayをバインドする', function() {
		var ar = [{
			ar: [{
				val: 1
			}, null, {
				val: 3
			}]
		}];
		var oar = h5.core.data.createObservableArray();
		oar.copyFrom(ar);

		view.append($fixture, 'nestloop1');
		view.bind($('#dataBindTest'), {
			items: oar
		});

		checkTexts(['1', '', '3'], 'バインドされていること', 'span');
	});

	test('loop-contextの子要素に複数loop-contextがある要素にnullが含まれているObservableArrayをバインドする', function() {
		var ar = [{
			ar: [{
				val: 1
			}, {
				val: 2
			}, {
				val: 3
			}],
			ar2: [{
				val: 10
			}, {
				val: 20
			}, {
				val: 30
			}]
		}, {
			ar: null,
			ar2: [{
				val: 100
			}, {
				val: 200
			}, {
				val: 300
			}]
		}];

		var oar = h5.core.data.createObservableArray();
		oar.copyFrom(ar);

		view.append($fixture, 'nestloop2');
		view.bind($('#dataBindTest'), {
			items: oar
		});

		checkTexts(['1', '2', '3', '10', '20', '30', '100', '200', '300'], 'バインドされていること', 'span');
	});

	//=============================
	// Definition
	//=============================
	module('unbind', {
		teardown: function() {
			clearController();
		}
	});

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

		var ctx = $('[' + DATA_H5_BIND + '],[' + DATA_H5_CONTEXT + '],[' + DATA_H5_LOOP_CONTEXT
				+ ']', '#dataBindTest').length;

		binding.unbind();

		equal($('[' + DATA_H5_BIND + '],[' + DATA_H5_CONTEXT + '],[' + DATA_H5_LOOP_CONTEXT + ']',
				'#dataBindTest').length, ctx, 'data-h5-bind, context, loop-contextは削除されていないこと');
		equal($('[' + DATA_H5_DYN_CTX + '],[' + DATA_H5_DYN_VID + '],[' + DATA_H5_DYN_BIND_ROOT
				+ '],[' + DATA_H5_DYN_CN + ']', '#dataBindTest').length, 0,
				'data-h5-dyn-*属性が全て削除されていること');

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
		var obsItem = h5.core.data.createObservableItem(schema);

		view.append($fixture, 'itemBind8');
		var binding = view.bind($('#dataBindTest'), {
			item: obsItem
		});

		equal($('#dataBindTest span').text(), 'abc', 'strプロパティのdefaultValueがビューに反映されていること');

		var ctx = $('[' + DATA_H5_BIND + '],[' + DATA_H5_CONTEXT + '],[' + DATA_H5_LOOP_CONTEXT
				+ ']', '#dataBindTest').length;

		binding.unbind();

		equal($('[' + DATA_H5_BIND + '],[' + DATA_H5_CONTEXT + '],[' + DATA_H5_LOOP_CONTEXT + ']',
				'#dataBindTest').length, ctx, 'data-h5-bind, context, loop-contextは削除されていないこと');
		equal($('[' + DATA_H5_DYN_CTX + '],[' + DATA_H5_DYN_VID + '],[' + DATA_H5_DYN_BIND_ROOT
				+ '],[' + DATA_H5_DYN_CN + ']', '#dataBindTest').length, 0,
				'data-h5-dyn-*属性が全て削除されていること');

		obsItem.set({
			test: 'AAAA'
		});

		equal($('#dataBindTest span').text(), 'abc', 'unbind後にDataItemを変更しても、ビューは変更されないこと');
	});

	test('ObservableArrayをバインド後、unbind()を実行する',
			function() {
				var oar = h5.core.data.createObservableArray();
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

				checkTexts(['1', '2', '3'], 'ObservableArrayの内容がビューに表示されていること', 'span');

				var ctx = $('[' + DATA_H5_BIND + '],[' + DATA_H5_CONTEXT + '],['
						+ DATA_H5_LOOP_CONTEXT + ']', '#dataBindTest').length;

				binding.unbind();

				equal($('[' + DATA_H5_BIND + '],[' + DATA_H5_CONTEXT + '],[' + DATA_H5_LOOP_CONTEXT
						+ ']', '#dataBindTest').length, ctx,
						'data-h5-bind, context, loop-contextは削除されていないこと');
				equal(
						$('[' + DATA_H5_DYN_CTX + '],[' + DATA_H5_DYN_VID + '],['
								+ DATA_H5_DYN_BIND_ROOT + '],[' + DATA_H5_DYN_CN + ']',
								'#dataBindTest').length, 0, 'data-h5-dyn-*属性が全て削除されていること');

				oar.push({
					test: 1000
				});
				checkTexts(['1', '2', '3'], 'push: unbind後にObservableArrayの内容を変更してもビューに反映されないこと',
						'span');

				oar.splice(1, 1, {
					test: 10
				});
				checkTexts(['1', '2', '3'], 'splice: unbind後にObservableArrayの内容を変更してもビューに反映されないこと',
						'span');

				oar.pop();
				checkTexts(['1', '2', '3'], 'pop: unbind後にObservableArrayの内容を変更してもビューに反映されないこと',
						'span');

				oar.copyFrom([{
					test: 1000
				}, {
					test: 2000
				}, {
					test: 3000
				}]);

				checkTexts(['1', '2', '3'],
						'copyFrom: unbind後にObservableArrayの内容を変更してもビューに反映されないこと', 'span');

				oar.shift();

				checkTexts(['1', '2', '3'], 'shift: unbind後にObservableArrayの内容を変更してもビューに反映されないこと',
						'span');

				oar.unshift({
					test: 444
				});

				checkTexts(['1', '2', '3'],
						'unshift: unbind後にObservableArrayの内容を変更してもビューに反映されないこと', 'span');

				oar.sort();

				checkTexts(['1', '2', '3'], 'sort: unbind後にObservableArrayの内容を変更してもビューに反映されないこと',
						'span');

				oar.reverse();

				checkTexts(['1', '2', '3'],
						'reverse: unbind後にObservableArrayの内容を変更してもビューに反映されないこと', 'span');
			});

	test('複数要素にObservableArray[ObseItem]をバインド、unbind()を実行', 8, function() {
		var $el1 = $('<div data-h5-loop-context="data"></div>');
		$el1.append('<div data-h5-bind="str"></div>');
		$fixture.append($el1);
		var $el2 = $('<div data-h5-loop-context="data"></div>');
		$el2.append('<div data-h5-bind="str"></div>');
		$fixture.append($el2);

		try {
			var ar = h5.core.data.createObservableArray();
			var data = {
				data: ar
			};

			var binding1 = h5.core.view.bind($el1, data);
			var binding2 = h5.core.view.bind($el2, data);

			var item = h5.core.data.createObservableItem({
				str: {
					type: 'string'
				}
			});

			ar.push(item);

			var expected1 = 'AAA';
			item.set('str', expected1);

			var $el1child = $el1.children();
			var $el2child = $el2.children();

			equal($el1child.length, 1, 'ObsItemをObsArrayに追加したので、1件ビューに反映されていること');
			equal($el2child.length, 1, 'ObsItemをObsArrayに追加したので、1件ビューに反映されていること');
			equal($el1child.eq(0).html(), expected1, 'ObsItemに設定した値が複数のビューにされていること');
			equal($el2child.eq(0).html(), expected1, 'ObsItemに設定した値が複数のビューにされていること');

			binding1.unbind();

			var expected2 = 'BBB';
			item.set('str', expected2);

			equal($el1child.eq(0).html(), expected1, 'unbindしたビューは更新されないこと');
			equal($el2child.eq(0).html(), expected2, 'unbindしていないビューは更新されていること');

			binding2.unbind();

			var expected3 = 'CCC';
			item.set('str', expected3);

			equal($el1child.eq(0).html(), expected1, 'unbindしたビューは更新されないこと');
			equal($el2child.eq(0).html(), expected2, 'unbindしたビューは更新されないこと');
		} catch (e) {
			ok(false, 'エラーが発生したためテスト失敗。');
		}
	});

	test('複数要素にObservableArray[DataItem]をバインド後、unbind()を実行', 8, function() {
		var $el1 = $('<div data-h5-loop-context="data"></div>');
		$el1.append('<div data-h5-bind="str"></div>');
		$fixture.append($el1);
		var $el2 = $('<div data-h5-loop-context="data"></div>');
		$el2.append('<div data-h5-bind="str"></div>');
		$fixture.append($el2);

		try {
			var ar = h5.core.data.createObservableArray();
			var data = {
				data: ar
			};

			var binding1 = h5.core.view.bind($el1, data);
			var binding2 = h5.core.view.bind($el2, data);

			var manager = h5.core.data.createManager('TestManager1');
			var model = manager.createModel({
				name: 'BaseTestModel1',
				schema: {
					id: {
						id: true
					},
					str: {
						type: 'string'
					}
				}
			});
			var item = model.create({
				id: '1'
			});

			ar.push(item);

			var expected1 = 'AAA';
			item.set('str', expected1);

			var $el1child = $el1.children();
			var $el2child = $el2.children();

			equal($el1child.length, 1, 'DataItemをObsArrayに追加したので、1件ビューに反映されていること');
			equal($el2child.length, 1, 'DataItemをObsArrayに追加したので、1件ビューに反映されていること');
			equal($el1child.eq(0).html(), expected1, 'DataItemに設定した値が複数のビューにされていること');
			equal($el2child.eq(0).html(), expected1, 'DataItemに設定した値が複数のビューにされていること');

			binding1.unbind();

			var expected2 = 'BBB';
			item.set('str', expected2);

			equal($el1child.eq(0).html(), expected1, 'unbindしたビューは更新されないこと');
			equal($el2child.eq(0).html(), expected2, 'unbindしていないビューは更新されていること');

			binding2.unbind();

			var expected3 = 'CCC';
			item.set('str', expected3);

			equal($el1child.eq(0).html(), expected1, 'unbindしたビューは更新されないこと');
			equal($el2child.eq(0).html(), expected2, 'unbindしたビューは更新されないこと');

		} catch (e) {
			ok(false, 'エラーが発生したためテスト失敗。');
		}
	});

	var cloneTestBinding = null;
	module('動的に生成(クローン)された要素に対する操作', {
		setup: function() {
			var schema = {
				id: {
					id: true
				},
				txt: {
					type: 'string',
					defaultValue: 'TEST'
				},
				cn: {
					type: 'string',
					defaultValue: null
				},
				at: {
					type: 'string'
				},
				st: {
					type: 'string'
				},
				txt2: {
					type: 'string'
				}
			};
			var schema2 = {
				id: {
					id: true
				},
				data: {
					type: '@BaseTestModel'
				}
			};
			var manager = h5.core.data.createManager('TestManager');
			var testBaseDataModel = manager.createModel({
				name: 'BaseTestModel',
				schema: schema
			});
			var testDataModel2 = manager.createModel({
				name: 'TestModel',
				schema: schema2
			});

			var testDataItem1_1 = testBaseDataModel.create({
				id: '1'
			});
			var testDataItem1_2 = testBaseDataModel.create({
				id: '2',
				txt: 'BBB',
				cn: 'hoge',
				at: 'dynId1',
				st: 'block',
				txt2: '<div class="sec">testtest</div>'
			});
			var testDataItem2_1 = testDataModel2.create({
				id: '1',
				data: testDataItem1_1
			});

			view.append($fixture, 'clone1');
			cloneTestBinding = h5.core.view.bind('#dataBindTest', {
				item: testDataItem2_1
			});

			testDataItem2_1.set({
				data: testDataItem1_2
			});
		},
		teardown: function() {
			cloneTestBinding.unbind();
			clearController();
		}
	});

	test('バインドで生成された要素を検索できるか',
			function() {
				equal($('[' + DATA_H5_BIND + ']').length, 2, DATA_H5_BIND + '属性でクエリできること');
				equal($('[' + DATA_H5_CONTEXT + ']').length, 2, DATA_H5_CONTEXT + '属性でクエリできること');
				equal($('[' + DATA_H5_DYN_CTX + ']').length, 2, DATA_H5_DYN_CTX + '属性でクエリできること');
				equal($('[' + DATA_H5_DYN_VID + ']').length, 3, DATA_H5_DYN_VID + '属性でクエリできること');
				equal($('[' + DATA_H5_DYN_BIND_ROOT + ']').length, 1, DATA_H5_DYN_BIND_ROOT
						+ '属性でクエリできること');
				equal($('[' + DATA_H5_DYN_CN + ']').length, 1, DATA_H5_DYN_CN + '属性でクエリできること');

				var $dataBindTest = $('#dataBindTest');

				equal($dataBindTest.find('[' + DATA_H5_BIND + ']').length, 2, DATA_H5_BIND
						+ '属性でfindできること');
				equal($dataBindTest.find('[' + DATA_H5_CONTEXT + ']').length, 2, DATA_H5_CONTEXT
						+ '属性でfindできること');
				equal($dataBindTest.find('[' + DATA_H5_DYN_CTX + ']').length, 2, DATA_H5_DYN_CTX
						+ '属性でfindできること');
				equal($dataBindTest.find('[' + DATA_H5_DYN_VID + ']').length, 2, DATA_H5_DYN_VID
						+ '属性でfindできること');
				equal($dataBindTest.find('[' + DATA_H5_DYN_BIND_ROOT + ']').length, 0,
						DATA_H5_DYN_BIND_ROOT + '属性でfindできること');
				equal($dataBindTest.find('[' + DATA_H5_DYN_CN + ']').length, 1, DATA_H5_DYN_CN
						+ '属性でfindできること');

				equal($('#dynId1').length, 1, '動的に追加したDOM要素を、IDセレクタで指定して取得できること');
				equal($('.hoge').length, 1, '動的に追加したDOM要素を、クラスセレクタで指定して取得できること');
				equal($('span:contains("BBB")').length, 1, '動的に追加したDOM要素を、テキストをセレクタで指定して取得できること');
			});

	asyncTest('動的に生成(クローン)された要素の子要素でイベントが発火するか', 2, function() {
		var controller = {
			__name: 'dynElementTestController',
			'.class1.hoge click': function(context) {
				ok(context.event.target.className + ':動的に生成された要素の子要素からイベントが発生すること');
			},
			'{body} click': function(context) {
				equal(context.event.target.className, 'class1 hoge',
						'動的に生成された要素で発生したイベントがバブリングすること');
				this.dispose();
			},
			__dispose: function() {
				start();
			}
		};

		var c = h5.core.controller('#dataBindTest', controller);
		c.readyPromise.done(function() {
			$('.hoge').click();
		});
	});

	asyncTest('動的に生成(クローン)された要素の子孫要素でイベントが発火するか', 2, function() {
		var controller = {
			__name: 'dynElementTestController',
			'.class1.hoge click': function(context) {
				ok(false, 'イベント発生元のDOM要素の親要素にあたらないのでイベントは発生しないこと');
			},
			'{body} click': function(context) {
				equal(context.event.target.className, 'sec', '動的に生成された要素の子孫要素で発生したイベントがバブリングすること');
				this.dispose();
			},
			'.sec click': function(context) {
				ok(true, context.event.target.className + ':動的に生成された要素の子孫要素からイベントが発生すること');
			},
			__dispose: function() {
				start();
			}
		};

		var c = h5.core.controller('#dataBindTest', controller);
		c.readyPromise.done(function() {
			$('.sec').click();
		});
	});

	//=============================
	// Definition
	//=============================
	module('iframeのドキュメント内の要素へのバインド', {
		setup: function() {
			// IE11EdgeかつjQuery1.10.1または2.0.2の場合はテストしない
			if (h5.env.ua.isIE && h5.env.ua.browserVersion === 11
					&& ($().jquery === '1.10.1' || $().jquery === '2.0.2')) {
				skipTest();
				return;
			}
			stop();
			var that = this;
			createIFrameElement().done(function(iframe, doc) {
				that.iframe = iframe;
				that.ifDoc = doc;

				start();
			});
		},
		teardown: function() {
			$(this.iframe).remove();
		},
		iframe: null,
		ifDoc: null
	});

	//=============================
	// Body
	//=============================
	test('要素へバインドできること', 3, function() {
		var $bindTarget = $(this.ifDoc.body);
		view.append($bindTarget, 'bindTest1');
		view.bind($bindTarget, {
			test: 'abc',
			test2: 'abcd'
		});
		strictEqual($bindTarget.find('#dataBindTest>span').text(), 'abc',
				'data-h5-bind指定した要素に値が表示されていること');
		strictEqual($bindTarget.find('#dataBindTest>p').text(), 'abcd',
				'data-h5-bind指定した要素に値が表示されていること');
		strictEqual($bindTarget.find('#dataBindTest>div>pre').text(), 'abcd',
				'data-h5-bind指定した要素に値が表示されていること');
		$bindTarget.html('');
	});

	test('配列をバインドできること', 2, function() {
		var $bindTarget = $(this.ifDoc.body);
		view.append($bindTarget, 'loopContext1');
		var items = h5.core.data.createObservableArray();
		items.copyFrom([{
			test: 'a'
		}, {
			test: 'b'
		}]);
		view.bind($bindTarget, {
			items: items
		});

		var result = ['a', 'b'];
		// IE7,8のjQuery1.9.0, 1.10.1だと、別ドキュメント要素のfindが順番通りに取得できないので
		// $bindTarget.find('li')ではなく、getElementsByTagNameを使ってliを取得している
		$($bindTarget[0].getElementsByTagName('li')).each(function(i) {
			strictEqual($(this).text(), result[i], 'data-h5-bind指定した要素に値が表示されていること');
		});
		$bindTarget.html('');
	});

	test('ObservableArrayをバインドできること', 6, function() {
		var $bindTarget = $(this.ifDoc.body);
		var items = h5.core.data.createObservableArray();
		items.copyFrom([{
			test: 'a'
		}, {
			test: 'b'
		}]);
		view.append($bindTarget, 'loopContext1');
		view.bind($bindTarget, {
			items: items
		});

		var result = ['a', 'b'];
		$($bindTarget[0].getElementsByTagName('li')).each(function(i) {
			strictEqual($(this).text(), result[i], 'data-h5-bind指定した要素に値が表示されていること');
		});

		items.copyFrom([]);
		strictEqual($($bindTarget[0].getElementsByTagName('li')).length, 0,
				'ObservableArrayが空になった時、繰り返し要素は無くなること');

		items.copyFrom([{
			test: 'A'
		}, {
			test: 'B'
		}, {
			test: 'C'
		}]);
		result = ['A', 'B', 'C'];
		$($bindTarget[0].getElementsByTagName('li')).each(function(i) {
			strictEqual($(this).text(), result[i], 'data-h5-bind指定した要素に値が表示されていること');
		});
		$bindTarget.html('');
	});

	//=============================
	// Definition
	//=============================
	module('[browser#and-and:all|sa-ios:all|ie-wp:all]window.openで開いたポップアップウィンドウドキュメント内の要素へのバインド',
			{
				setup: function() {
					// (IE8-またはIE11)かつ(jQuery1.10.1または2.0.2)の場合はポップアップウィンドウを使用するテストは行わずにスキップする。
					// いずれの場合もポップアップウィンドウのDOM操作をjQueryで行う時にエラーになるからである。
					// IE8-の場合、jQuery1.10.1,2.0.2で、ポップアップウィンドウ内の要素をjQueryを使って操作すると、
					// 内部(setDocument内)でownerDocument.parentWindow.frameElementが参照されるが、
					// IE8-ではポップアップウィンドウのframeElementにアクセスするとエラーになる。、
					// また、IE11の場合でjQuery1.10.1,2.0.2の場合setDocument内でattachEventが呼ばれるがIE11にはattachEventはなくエラーになる
					if (h5.env.ua.isIE
							&& (h5.env.ua.browserVersion === 11 || h5.env.ua.browserVersion <= 8)
							&& ($().jquery === '1.10.1' || $().jquery === '2.0.2')) {
						skipTest();
						return;
					}

					// 空のページを開く
					var that = this;
					stop();
					openPopupWindow().done(function(win) {
						that.win = win;
						start();
					}).fail(function() {
						// 失敗したらテストは実行しない
						skipTest();
						start();
					});
				},
				teardown: function() {
					if (!this.win) {
						return;
					}
					var that = this;
					stop();
					closePopupWindow(this.win).done(function() {
						that.win = null;
						start();
					});
				},
				seq: 0
			});

	//=============================
	// Body
	//=============================
	test('要素へバインドできること', 3, function() {
		var w = this.win;

		var $bindTarget = $(w.document.body);
		view.append($bindTarget, 'bindTest1');
		view.bind($bindTarget, {
			test: 'abc',
			test2: 'abcd'
		});
		strictEqual($bindTarget.find('#dataBindTest>span').text(), 'abc',
				'data-h5-bind指定した要素に値が表示されていること');
		strictEqual($bindTarget.find('#dataBindTest>p').text(), 'abcd',
				'data-h5-bind指定した要素に値が表示されていること');
		strictEqual($bindTarget.find('#dataBindTest>div>pre').text(), 'abcd',
				'data-h5-bind指定した要素に値が表示されていること');
		$bindTarget.html('');
	});

	test('配列をバインドできること', 2, function() {
		var w = this.win;

		var $bindTarget = $(w.document.body);
		view.append($bindTarget, 'loopContext1');
		var items = h5.core.data.createObservableArray();
		items.copyFrom([{
			test: 'a'
		}, {
			test: 'b'
		}]);
		view.bind($bindTarget, {
			items: items
		});

		var result = ['a', 'b'];
		// 別ウィンドウ内の要素をfindで取得すると、IE7,8、jQuery1.9.0, 1.10.1でエラーになるので、findを使わないように要素を取得している
		// # 取得結果が複数ある時に限ってエラーになる。
		// # w.document.body.append(li1);w.document.body.append(li2);$(w.document.body).find('li'); で再現する
		$(w.document.getElementsByTagName('li')).each(function(i) {
			strictEqual($(this).text(), result[i], 'data-h5-bind指定した要素に値が表示されていること');
		});
		$bindTarget.html('');
	});

	test('ObservableArrayをバインドできること', 6, function() {
		var w = this.win;

		var $bindTarget = $(w.document.body);
		var items = h5.core.data.createObservableArray();
		items.copyFrom([{
			test: 'a'
		}, {
			test: 'b'
		}]);
		view.append($bindTarget, 'loopContext1');
		view.bind($bindTarget, {
			items: items
		});

		var result = ['a', 'b'];
		$(w.document.getElementsByTagName('li')).each(function(i) {
			strictEqual($(this).text(), result[i], 'data-h5-bind指定した要素に値が表示されていること');
		});

		items.copyFrom([]);
		strictEqual($(w.document.getElementsByTagName('li')).length, 0,
				'ObservableArrayが空になった時、繰り返し要素は無くなること');

		items.copyFrom([{
			test: 'A'
		}, {
			test: 'B'
		}, {
			test: 'C'
		}]);
		result = ['A', 'B', 'C'];
		$(w.document.getElementsByTagName('li')).each(function(i) {
			strictEqual($(this).text(), result[i], 'data-h5-bind指定した要素に値が表示されていること');
		});
		$bindTarget.html('');
	});
});
