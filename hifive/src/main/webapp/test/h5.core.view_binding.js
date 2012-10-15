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
	 * data-h5-bind="test"を持つdiv#dataBindTest
	 */
	var simpleElm = '<div id="dataBindTest"><span data-h5-bind="test">aaaa</span></div>';

	/**
	 * data-h5-loop-contex="items"を持つdiv#dataBindTest
	 */
	var simpleLoopElm = '<div id="dataBindTest"><ul data-h5-loop-context="items"><li data-h5-bind="test"></div>';

	/**
	 * エラーコード
	 */
	var ERR = ERRCODE.h5.core.view_binding;

	/**
	 * view
	 */
	var view = h5.core.view.createView();

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

		// セットアップを呼ぶ
		obsItemDataItemSetup();

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
	test(
			'data-h5-bind属性に指定した名前のプロパティがバインドできること',
			function() {
				$fixture
						.append('<div id="dataBindTest"><span data-h5-bind="test"></span><p data-h5-bind="test2"></p><div><pre data-h5-bind="test2"></pre></div></div>');
				view.bind($('#dataBindTest', $fixture), {
					test: 'abc',
					test2: 'abcd'
				});
				strictEqual($('#dataBindTest>span').text(), 'abc', 'data-h5-bind指定した要素に値が表示されていること');
				strictEqual($('#dataBindTest>p').text(), 'abcd', 'data-h5-bind指定した要素に値が表示されていること');
				strictEqual($('#dataBindTest>div>pre').text(), 'abcd',
						'data-h5-bind指定した要素に値が表示されていること');
			});

	test('data-h5-bind属性の指定してある要素自体にバインドできること', 1, function() {
		$fixture.append(createBindSpan('test'));
		view.bind($fixture.find('span'), {
			test: 'test'
		});
		strictEqual($fixture.find('span').text(), 'test', 'data-h5-bind属性を指定している要素自体にバインドされていること');
	});

	test('data-h5-bind属性をしていた要素にバインドされているプロパティの値で中身が書き変わること', function() {
		$fixture.append(simpleElm);
		view.bind($('#dataBindTest'), {
			test: 'abc'
		});
		strictEqual($('#dataBindTest>span').text(), 'abc', 'data-h5-bind指定した要素の値が書き変わること');
	});

	test('data-h5-bind属性をしていた要素にバインドされているプロパティがない場合は、中身が変わらないこと', function() {
		$fixture.append(simpleElm);
		view.bind($('#dataBindTest'), {
			test2: 'abcd'
		});

		strictEqual($('#dataBindTest>span').text(), 'aaaa', 'data-h5-bind指定した要素の値が書き変わらないこと');
	});

	test('null, undefined, String, Number, Array, Objectが、それぞれ表示されること', function() {
		var $dataBindTest = $('<div id="dataBindTest">');
		$dataBindTest.append(createBindSpan('dataNull'));
		$dataBindTest.append(createBindSpan('dataUndef'));
		$dataBindTest.append(createBindSpan('dataStr'));
		$dataBindTest.append(createBindSpan('dataNum'));
		$dataBindTest.append(createBindSpan('dataNaN'));
		$dataBindTest.append(createBindSpan('dataInf'));
		$dataBindTest.append(createBindSpan('dataMInf'));
		$dataBindTest.append(createBindSpan('dataAry'));
		$dataBindTest.append(createBindSpan('dataObj'));
		$dataBindTest.append(createBindSpan('dataFunc'));

		$fixture.append($dataBindTest);

		var ary = [1, 2, 'aa'];
		var obj = {
			a: 'a'
		};
		var func = function() {
			return;
		};
		view.bind($dataBindTest, {
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
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerHTML, exp[i], 'data-h5-bind指定した要素に値が表示されていること。' + exp[i]);
		});
	});

	test('HTML文字がエスケープされること', 1, function() {
		$fixture.append(createBindSpan('test'));
		var str = '<div data-h5-bind="test"></div>';
		view.bind($fixture.find('span'), {
			test: str
		});
		strictEqual($fixture.find('span').text(), str, 'data-h5-bind属性を指定している要素自体にバインドされていること');
	});

	test('バインドする要素が複数ある場合は、エラーになること', 2, function() {
		$fixture.append(createBindSpan('test'), createBindSpan('test'));
		try {
			view.bind($fixture.find('span'), {
				test: 'test'
			});
			ok(false, 'テスト失敗。エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERRCODE.h5.core.view.ERR_CODE_BIND_TARGET_TOO_MANY, e.message);
		}
		try {
			view.bind('#qunit-fixture>span', {
				test: 'test'
			});
			ok(false, 'テスト失敗。エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERRCODE.h5.core.view.ERR_CODE_BIND_TARGET_TOO_MANY, e.message);
		}
	});

	test('バインドする要素が存在しない場合は、エラーになること', function() {
		$fixture.append(createBindSpan('test'));
		try {
			view.bind($fixture.find('#noExist'), {
				test: 'test'
			});
		} catch (e) {
			strictEqual(e.code, ERRCODE.h5.core.view.ERR_CODE_BIND_TARGET_INVALID, e.message);
		}
	});

	test('バインドする要素の指定方法はjQueryオブジェクト、DOM、セレクタのどれでもいいこと', function() {
		$fixture.append(createBindSpan('test'));
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
		$fixture.append(createBindSpan('test'));
		var invalids = [1, $([1, 2, 3]), function() {
			throw {}
		}, [1], true];
		for ( var i = 0, l = invalids.length; i < l; i++) {
			try {
				view.bind(invalids[i], {
					test: i
				});
				ok(false, 'テスト失敗。エラーが発生していません。' + invalids[i]);
			} catch (e) {
				strictEqual(e.code, ERRCODE.h5.core.view.ERR_CODE_BIND_TARGET_INVALID, e.message);
			}
		}
	});

	test('バインド指定する要素自体に値をバインドできること', 1, function() {
		$fixture.append(createBindSpan('test'));
		view.bind($fixture.find('span'), {
			test: 'aaa'
		});
		strictEqual($fixture.find('span').text(), 'aaa', 'バインドされていること');
	});

	test('バインド指定するものがオブジェクトでない場合はエラーになること', function() {
		$fixture.append(createBindSpan('test'));
		var invalidVals = [null, undefined, [1], 1, 'abc', true];
		for ( var i = 0, l = invalidVals.length; i < l; i++) {
			try {
				view.bind($fixture.find('span'), invalidVals[i]);
				ok(false, 'テスト失敗。エラーが発生していません。' + invalidVals[i]);
			} catch (e) {
				strictEqual(e.code, ERRCODE.h5.core.view.ERR_CODE_BIND_CONTEXT_INVALID, e.message);
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
	test(
			'バインドするオブジェクトの入れ子関係を表せること',
			function() {
				$fixture
						.append('<div id="dataBindTest"><span data-h5-bind="test"></span><span data-h5-bind="test2"></span></div>');
				var $dataBindTest = $('#dataBindTest');
				$dataBindTest
						.append('<div data-h5-context="obj"><span data-h5-bind="test"></span><span data-h5-bind="test2"></span></div></div>');
				$dataBindTest
						.find('div')
						.append(
								'<div data-h5-context="obj"><span data-h5-bind="test"></span><span data-h5-bind="test2"></span></div></div>');

				$dataBindTest.find('span').text('バインド無し');

				view.bind($('#dataBindTest', $fixture), {
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
				$('#dataBindTest span').each(
						function(i) {
							strictEqual(this.innerText, result[i],
									'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
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
		$fixture.append(simpleLoopElm);
		view.bind($('#dataBindTest'), {
			test: 'aaa',
			items: items
		});

		var result = ['a', 'b'];
		checkTexts(result, 'data-h5-bind指定した要素に値が表示されていること');
	});

	test('空配列をバインドできること', 1, function() {
		$fixture.append(simpleLoopElm);
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
			$fixture.append(simpleLoopElm);
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



		$fixture.append(simpleLoopElm);
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
		$fixture.append(simpleLoopElm);
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

		$fixture.append(simpleLoopElm);
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

		$fixture.append(simpleLoopElm);
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
			$fixture.append(simpleLoopElm);
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

		$fixture.append(simpleLoopElm);
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
		$fixture.append(simpleLoopElm);
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
		$fixture.append(simpleLoopElm);
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
			$fixture.append(simpleLoopElm);
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
				innerOAry.copyFrom({
					test: 'innerA'
				});
				var ary = [{
					test: 'a',
					ary: innerOAry
				}];
				var oAry = h5.u.obj.createObservableArray();
				oAry.copyFrom(ary);
				$fixture.append(simpleLoopElm);
				$innerUl = $('<ul data-h5-loop-context="ary">').append('<li data-h5-bind="test">');
				$fixture.find('ul').append($innerUl);
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
		$fixture.append(simpleLoopElm);
		$innerUl = $('<ul data-h5-loop-context="ary">').append('<li data-h5-bind="test">');
		$fixture.find('ul').append($innerUl);
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
	/**
	 * setup関数
	 */
	function obsItemDataItemSetup() {
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

		// バインド先の設定
		$fixture.find('#dataBindTest').remove();
		var $dataBindTest = $('<div id="dataBindTest"></div>');
		$dataBindTest.append(createBindSpan('str'));
		$dataBindTest.append(createBindSpan('num'));
		var $v1 = $('<div data-h5-context="obj"></div>');
		$v1.append(createBindSpan('a'));
		var $v2 = $('<div data-h5-context="item"></div>');
		$v2.append(createBindSpan('str'));
		$v2.append(createBindSpan('num'));
		var $v3 = $('<div data-h5-loop-context="ary"></div>');
		$v3.append(createBindSpan('a'));
		var $v4 = $('<div data-h5-loop-context="oAry"></div>');
		$v4.append(createBindSpan('a'));
		$dataBindTest.append($v1, $v2, $v3, $v4);
		$fixture.append($dataBindTest);
	}
	module('ObservableItem/DataItem', {
		setup: obsItemDataItemSetup
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
			view.bind($('#dataBindTest'), item);

			checkTexts(exp, itemType + 'の中身がバインドされていること', 'span');
		}, testSchema);
	});

	test('循環参照を持っていてもバインドできること', 2, function() {
		var exp = ['abc', '-123.45', 'obj.a', 'abc', '-123.45', 'ary.1', 'ary.2', 'oAry.1',
				'oAry.2'];
		testDataItemObsItem(function(item, isDataItem) {
			var itemType = isDataItem ? 'DataItem' : 'ObservableItem';
			item.set('item', item);

			view.bind($('#dataBindTest'), item);

			checkTexts(exp, itemType + 'の中身がバインドされていること', 'span');
		}, testSchema);
	});

	test('オブジェクト内のObservableItem/DataItemをバインドできること', 2, function() {
		testDataItemObsItem(function(item, isDataItem) {
			var itemType = isDataItem ? 'DataItem' : 'ObservableItem';
			item.set('item', item);

			$('#dataBindTest').wrapInner('<div data-h5-context="item">');
			view.bind($('#dataBindTest'), {
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
			var $dataBindTest = $('<div id="dataBindTest">');
			$dataBindTest.append(createBindSpan('str'));
			$dataBindTest.append(createBindSpan('num'));
			$fixture.append($dataBindTest);

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

			item.set({
				ary: [{
					a: 'ary[0]'
				}, {
					a: 'ary[1]'
				}]
			});

			// バインド先の設定
			$fixture.find('#dataBindTest').remove();
			var $dataBindTest = $('<div id="dataBindTest">');
			$loopContext1 = $('<div data-h5-loop-context="ary">');
			$loopContext1.append(createBindSpan('a'));
			$fixture.append($dataBindTest.append($loopContext1));

			view.bind($('#dataBindTest'), item);
			var result = ['ary[0]', 'ary[1]'];
			checkTexts(result, itemType + ' data-h5-bind指定した要素に値が表示されていること', 'span');

			item.set({
				ary: [{
					a: 'newAry[0]'
				}]
			});
			result = ['newAry[0]'];
			checkTexts(result, itemType + ' setで変更した時に反映されていること', 'span');

			// ObservableArrayのメソッドで配列を変更
			item.get('ary').push({
				a: 'newAry[1]'
			});
			result.push('newAry[1]');
			checkTexts(result, itemType + ' メソッド操作による変更があった時に反映されていること', 'span');
		}, testSchema);
	});

	test('ObserbableItem/DataItemが持つtype:anyの要素に格納されたObservableItem/DataItemが、ビューに反映されること', 6,
			function() {
				testDataItemObsItem(function(item, isDataItem) {
					var itemType = isDataItem ? 'DataItem' : 'ObservableItem';

					var item2 = {};
					if (isDataItem) {
						item2 = item.getModel().create({
							id: 'item2',
							str: 'a2',
							num: 2
						});
					} else {
						item2 = h5.u.obj.createObservableItem(testSchema);
						item2.set({
							str: 'a2',
							num: 2
						});
					}
					item.set({
						str: 'a',
						num: 1,
						any: item2
					});

					// バインド先の設定
					$fixture.find('#dataBindTest').remove();
					var $dataBindTest = $('<div id="dataBindTest">');
					$loopContext1 = $('<div data-h5-context="any">');
					$loopContext1.append(createBindSpan('str'));
					$loopContext1.append(createBindSpan('num'));
					$fixture.append($dataBindTest.append($loopContext1));

					view.bind($('#dataBindTest'), item);
					var result = ['a2', '2'];
					checkTexts(result, itemType + ' data-h5-bind指定した要素に値が表示されていること', 'span');

					// バインドしたアイテムが持つアイテムを変更
					item2.set({
						str: 'aa2',
						num: 22
					});
					result = ['aa2', '22'];
					checkTexts(result, itemType + ' setで変更した時に反映されていること', 'span');

					// バインドしたアイテムが持つアイテムを変更
					item.set('any', item);
					result = ['a', '1'];
					checkTexts(result, itemType + ' setで変更した時に反映されていること', 'span');
				}, testSchema);
			});

	test('ObserbableItem/DataItemが持つtype:anyの要素に格納された配列、ObservableArrayが、ビューに反映されること', 8,
			function() {

				testDataItemObsItem(function(item, isDataItem) {
					var itemType = isDataItem ? 'DataItem' : 'ObservableItem';

					var obsArray = h5.u.obj.createObservableArray();
					obsArray.copyFrom([{
						a: 'ary[0]'
					}, {
						a: 'ary[1]'
					}]);
					item.set({
						any: obsArray
					});

					// バインド先の設定
					$fixture.find('#dataBindTest').remove();
					var $dataBindTest = $('<div id="dataBindTest">');
					$loopContext1 = $('<div data-h5-loop-context="any">');
					$loopContext1.append(createBindSpan('a'));
					$fixture.append($dataBindTest.append($loopContext1));

					view.bind($('#dataBindTest'), item);
					var result = ['ary[0]', 'ary[1]'];
					checkTexts(result, itemType + ' data-h5-bind指定した要素に値が表示されていること', 'span');

					// ObservableArrayのメソッドで配列を変更
					item.get('any').push({
						a: 'newAry[1]'
					});
					result.push('newAry[1]');
					checkTexts(result, itemType + ' メソッド操作による変更があった時に反映されていること', 'span');

					// 別の配列インスタンスに変更
					item.set('any', [{
						a: 'otherAry[0]'
					}, {
						a: 'otherAry[1]'
					}]);
					result = ['otherAry[0]', 'otherAry[1]'];
					checkTexts(result, itemType + ' 別の配列インスタンスに変更した時に反映されていること', 'span');

					// 別のObservableArrayインスタンスに変更
					var oAry = h5.u.obj.createObservableArray();
					oAry.copyFrom([{
						a: 'otherOArray[0]'
					}]);
					item.set('any', oAry);
					result = ['otherOAry[0]'];
					checkTexts(result, itemType + ' 別のObservableArrayインスタンスに変更した時に反映されていること', 'span');
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
		var $dataBindTest = $('<div id="dataBindTest">');
		$dataBindTest.append(createBindSpan('attr(id):id'));
		$dataBindTest.find('span').text('test');
		$fixture.append($dataBindTest);

		view.bind($('#dataBindTest'), {
			id: 'bindTest123'
		});

		var $span = $fixture.find('span');
		strictEqual($span.attr('id'), 'bindTest123', 'id属性の値が書き変わっていること');
		strictEqual($span.text(), 'test', 'テキストノードの値は書き変わっていないこと');

		view.bind($('#dataBindTest'), {
			'attr(id):id': 'attr(id):id'
		});

		$span = $fixture.find('span');
		strictEqual($span.text(), 'test', '『:』を含むプロパティはバインドされないこと');
	});

	test('classへのバインド', function() {
		// バインド先の設定
		var $dataBindTest = $('<div id="dataBindTest">');
		$dataBindTest.append(createBindSpan('class:cls'));
		$fixture.append($dataBindTest);
		$dataBindTest.find('span').text('test');
		$dataBindTest.find('span').attr('class', 'testClass');

		view.bind($('#dataBindTest'), {
			cls: 'bindTestCls123'
		});

		var $span = $fixture.find('span');
		strictEqual($span.attr('class'), 'testClass bindTestCls123', 'class属性にバインドした値が追加されていること');
		strictEqual($span.text(), 'test', 'テキストノードの値は書き変わっていないこと');
	});

	test('styleへのバインド', function() {
		// バインド先の設定
		var $dataBindTest = $('<div id="dataBindTest">');
		$dataBindTest.append(createBindSpan('style(margin-left):marginLeft'));
		$dataBindTest.append(createBindSpan('style(margin):margin'));
		$dataBindTest.find('span').attr('style', 'color: red;margin-left:22px');
		$fixture.append($dataBindTest);

		view.bind($('#dataBindTest'), {
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
		var $dataBindTest = $('<div id="dataBindTest">');
		$dataBindTest.append(createBindSpan('text:test'));
		$fixture.append($dataBindTest);

		var str = '<a href="#a">a</a>';
		view.bind($('#dataBindTest'), {
			test: str
		});

		var $span = $fixture.find('span');
		strictEqual($span.text(), str, '値がテキストノードとしてバインドされていること');
	});

	test('innerHTMLへのバインド', function() {
		// バインド先の設定
		var $dataBindTest = $('<div id="dataBindTest">');
		$dataBindTest.append(createBindSpan('html:test'));
		$fixture.append($dataBindTest);

		var str = '<a href="#a">a</a>';
		view.bind($('#dataBindTest'), {
			test: str
		});

		var $span = $fixture.find('span');
		strictEqual($span.html(), str, '値がinnerHTMLとしてバインドされていること');
	});

	//=============================
	// Definition
	//=============================
	module('複数のプロパティを一つの要素にバインド');

	//=============================
	// Body
	//=============================
	test(
			'セミコロンで複数のプロパティを一つの要素にバインドできること',
			function() {
				$fixture
						.append('<span data-h5-bind="html:v5;text:v1;v2;attr(id):v3;style(color):v4;class:v1">');
				view.bind($fixture.find('span'), {
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
		test: null,
		obj: null,
		ary: {
			type: 'any[]'
		}
	});

	module(
			'append/prepend/get',
			{
				setup: function() {
					$fixture.append('<div id="inFixture">');

					bindItem.set({
						test: 'a',
						obj: {
							test: 'obj.test'
						},
						ary: [{
							name: 'taro',
							address: 't'
						}, {
							name: 'jiro',
							address: 'j'
						}]
					});

					view
							.register(
									'1',
									'<h1 data-h5-bind="test"></h1><h2 data-h5-bind="test"></h2><h3>[%= _values.test %]</h3><div data-h5-context="obj"><span data-h5-bind="test"></span></div><table data-h5-loop-context="ary"><tr><th data-h5-bind="name"></th><td data-h5-bind="address"></td></tr></table>');
				},
				teardown: function() {
					view.clear('1');
				}
			});

	//=============================
	// Body
	//=============================
	test(
			'view.appendでデータバインドできること',
			function() {
				view.append($fixture, '1', bindItem);

				strictEqual($('#inFixture').next('h1').length, 1,
						'appendで、指定した要素内に後ろからテンプレートが追加されていること');

				var bindObj = bindItem.get();

				strictEqual($fixture.find('h1').text(), bindObj.test, 'バインドされていること');
				strictEqual($fixture.find('h2').text(), bindObj.test, 'バインドされていること');
				strictEqual($fixture.find('h3').text(), bindObj.test, 'EJSの記法でバインドした箇所にバインドされていること');
				strictEqual($fixture.find('span').text(), bindObj.obj.test, 'バインドされていること');
				strictEqual($fixture.find('tr').length, bindObj.ary.length,
						'data-h5-loop-contextの中身がバインドしている配列の数分だけあること');
				strictEqual($fixture.find('tr:first-child th').text(), bindObj.ary[0].name,
						'バインドされていること');
				strictEqual($fixture.find('tr:first-child td').text(), bindObj.ary[0].address,
						'バインドされていること');
				strictEqual($fixture.find('tr:nth-child(2) th').text(), bindObj.ary[1].name,
						'バインドされていること');
				strictEqual($fixture.find('tr:nth-child(2) td').text(), bindObj.ary[1].address,
						'バインドされていること');

				//値の変更
				bindItem.set({
					test: 'b',
					obj: {
						test: 'obj.test2'
					},
					ary: [{
						name: 'taro2',
						address: 't2'
					}]
				});

				bindObj = bindItem.get();

				strictEqual($fixture.find('h1').text(), bindObj.test, '変更後の値がバインドされていること');
				strictEqual($fixture.find('h2').text(), bindObj.test, '変更後の値がバインドされていること');
				strictEqual($fixture.find('h3').text(), 'a', 'EJSの記法でバインドした箇所なので、値は変更されていないこと');
				strictEqual($fixture.find('span').text(), bindObj.obj.test, '変更後の値がバインドされていること');
				strictEqual($fixture.find('tr').length, bindObj.ary.length,
						'data-h5-loop-contextの中身がバインドしている配列の数分だけあること');
				strictEqual($fixture.find('tr:first-child th').text(), bindObj.ary[0].name,
						'バインドされていること');
				strictEqual($fixture.find('tr:first-child td').text(), bindObj.ary[0].address,
						'バインドされていること');

			});

	test(
			'view.prependでデータバインドできること',
			function() {
				view.prepend($fixture, '1', bindItem);

				strictEqual($('#inFixture').nextAll().length, 0,
						'prependで、指定した要素内に前からテンプレートが追加されていること');

				var bindObj = bindItem.get();

				strictEqual($fixture.find('h1').text(), bindObj.test, 'バインドされていること');
				strictEqual($fixture.find('h2').text(), bindObj.test, 'バインドされていること');
				strictEqual($fixture.find('h3').text(), bindObj.test, 'EJSの記法でバインドした箇所にバインドされていること');
				strictEqual($fixture.find('span').text(), bindObj.obj.test, 'バインドされていること');
				strictEqual($fixture.find('tr').length, bindObj.ary.length,
						'data-h5-loop-contextの中身がバインドしている配列の数分だけあること');
				strictEqual($fixture.find('tr:first-child th').text(), bindObj.ary[0].name,
						'バインドされていること');
				strictEqual($fixture.find('tr:first-child td').text(), bindObj.ary[0].address,
						'バインドされていること');
				strictEqual($fixture.find('tr:nth-child(2) th').text(), bindObj.ary[1].name,
						'バインドされていること');
				strictEqual($fixture.find('tr:nth-child(2) td').text(), bindObj.ary[1].address,
						'バインドされていること');

				//値の変更
				bindItem.set({
					test: 'b',
					obj: {
						test: 'obj.test2'
					},
					ary: [{
						name: 'taro2',
						address: 't2'
					}]
				});

				bindObj = bindItem.get();

				strictEqual($fixture.find('h1').text(), bindObj.test, '変更後の値がバインドされていること');
				strictEqual($fixture.find('h2').text(), bindObj.test, '変更後の値がバインドされていること');
				strictEqual($fixture.find('h3').text(), 'a', 'EJSの記法でバインドした箇所なので、値は変更されていないこと');
				strictEqual($fixture.find('span').text(), bindObj.obj.test, '変更後の値がバインドされていること');
				strictEqual($fixture.find('tr').length, bindObj.ary.length,
						'data-h5-loop-contextの中身がバインドしている配列の数分だけあること');
				strictEqual($fixture.find('tr:first-child th').text(), bindObj.ary[0].name,
						'バインドされていること');
				strictEqual($fixture.find('tr:first-child td').text(), bindObj.ary[0].address,
						'バインドされていること');

			});

	//TODO getの時にアイテムがバインドされるタイミングはいつ？
	test('view.get',
			function() {
				var str = view.get('1', bindItem);

				strictEqual(typeof str, 'string', '文字列が取得できること');

				var bindObj = bindItem.get();

				// 文字列で比較するのはコード量増えるので、ページにappendしてDOM要素にして比較する
				$fixture.append(str);

				strictEqual($fixture.find('h1').text(), bindObj.test, 'バインドされていること');
				strictEqual($fixture.find('h2').text(), bindObj.test, 'バインドされていること');
				strictEqual($fixture.find('span').text(), bindObj.obj.test, 'バインドされていること');
				strictEqual($fixture.find('tr').length, bindObj.ary.length,
						'data-h5-loop-contextの中身がバインドしている配列の数分だけあること');
				strictEqual($fixture.find('tr:first-child th').text(), bindObj.ary[0].name,
						'バインドされていること');
				strictEqual($fixture.find('tr:first-child td').text(), bindObj.ary[0].address,
						'バインドされていること');
				strictEqual($fixture.find('tr:nth-child(2) th').text(), bindObj.ary[1].name,
						'バインドされていること');
				strictEqual($fixture.find('tr:nth-child(2) td').text(), bindObj.ary[1].address,
						'バインドされていること');

				//値の変更
				bindItem.set({
					test: 'b',
					obj: {
						test: 'obj.test2'
					},
					ary: [{
						name: 'taro2',
						address: 't2'
					}]
				});

				// この時点で変更が反映される？？
			});

	//=============================
	// Definition
	//=============================
	module('コメントノードにバインド');

	//=============================
	// Body
	//=============================
	test('コメントノードにバインドできること', function() {
		var $dataBindTest = $('<div id="dataBindTest">');
		;
		$dataBindTest
				.append('<!--{h5bind id="item"} <span data-h5-bind="v1;class:cls"></span> -->');

		$fixture.append($dataBindTest);
		view.bind($('#dataBindTest').contents(), {
			v1: 'a',
			cls: 'testClass'
		});

		var $span = $fixture.find('span');
		strictEqual($span.text(), 'a', 'コメントノードにバインドされていること');
		strictEqual($span.attr('class'), 'testClass', 'コメントノードにバインドされていること');
	});

	test(
			'コメントノードにObservableItemをバインド',
			function() {
				var item = h5.u.obj.createObservableItem({
					v1: null,
					v2: null,
					item: null
				});
				item.set({
					v1: 'a',
					v2: 'b',
					item: item
				});
				var $dataBindTest = $('<div id="dataBindTest">');
				;
				$dataBindTest
						.append('<!--{h5bind id="item"} <span data-h5-bind="v1"></span><div h5-bind-context="item"><span h5-data-bind="v1"></span></div> -->');
				$fixture.append($dataBindTest);
				view.bind($dataBindTest.contents(), item);

				var $span = $fixture.find('span');
				strictEqual($span[0].innerText, 'a', 'コメントノードに書いた箇所にバインドされていること');
				strictEqual($span[1].innerText, 'b', 'コメントノードに書いた箇所にバインドされていること');

				//値の変更
				item.set({
					v1: 'aa',
					v2: 'bb'
				});

				var $span = $fixture.find('span');
				strictEqual($span.text(), 'v1:aa,v2:bb', 'コメントノードに書いた箇所にバインドされていること');
				strictEqual($span.attr('id'), 'bindTestId2', 'data-h5-bindで指定した箇所にもバインドされていること');
			});

	test(
			'コメントノードにObservableArrayをバインド',
			function() {
				var items = h5.u.obj.createObservableArray();
				items.copyFrom([{
					v1: 'a'
				}, {
					v1: 'b'
				}]);
				var $dataBindTest = $('<div id="dataBindTest">');

				$dataBindTest
						.append('<!--{h5bind id="item"} <div h5-bind-loop-context="items"><span h5-data-bind="v1"></span></div> -->');
				$fixture.append($dataBindTest);
				view.bind($dataBindTest.contents(), {
					items: items
				});

				var $span = $fixture.find('span');
				strictEqual($span.length, 2, '配列の要素の数だけDOM要素が作られていること');
				strictEqual($span[0].innerText, 'a', 'コメントノードに書いた箇所にバインドされていること');
				strictEqual($span[1].innerText, 'b', 'コメントノードに書いた箇所にバインドされていること');

				//値の変更
				items.copyFrom([{
					v1: 'aa'
				}]);

				var $span = $fixture.find('span');
				strictEqual($span.length, 1, '配列の要素の数だけDOM要素が作られていること');
				strictEqual($span[0].innerText, 'aa', 'コメントノードに書いた箇所にバインドされていること');
			});

});