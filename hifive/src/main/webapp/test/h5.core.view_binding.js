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
	var simpleElm = $('<div id="dataBindTest"><span data-h5-bind="test">aaaa</span></div>');

	/**
	 * data-h5-loop-contex="items"を持つdiv#dataBindTest
	 */
	var simpleLoopElm = $('<div id="dataBindTest"><ul data-h5-loop-context="items"><li data-h5-bind="test"></div>');

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

		func(dataItem);
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

	test('配列をバインドできること', 2, function() {
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
		$('#dataBindTest li').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
	});

	test('空配列をバインドできること', 1, function() {
		$fixture.append(simpleLoopElm);
		view.bind($('#dataBindTest'), {
			items: []
		});

		strictEqual($('#dataBindTest li').length, 0, '繰り返される要素が一つもないこと');
	});

	test('data-h5-loop-contextに配列、ObservableArray以外のものをバインドした場合、繰り返し要素は表示されないこと', function() {
		var noArys = [null, undefined, 1, 'a'];
		var l = noArys.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			$fixture.append(simpleLoopElm);
			view.bind($('#dataBindTest'), {
				test: 'aaa',
				items: noArys[i]
			});
			$fixture.find('div').remove();
		}
		strictEqual($('#dataBindTest li').length, 0,
				'配列以外のものを渡しているので、data-h5-loop-contextのなかは空であること');
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
		$('#dataBindTest li').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
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

	test('中身がオブジェクトでないObservableArrayをバインドすると、繰り返し要素は表示されないこと', function() {
		var items = h5.u.obj.createObservableArray();
		items.copyFrom([]);

		var noObjs = [null, undefined, 1, [], [{}]];

		var l = noObjs.length;
		for ( var i = 0; i < l; i++) {
			$fixture.append(simpleLoopElm);
			view.bind($('#dataBindTest'), {
				items: [{
					test: 'a'
				}, noObjs[i], {
					test: 'b'
				}]
			});

			var $lis = $('#dataBindTest li');
			strictEqual($lis.length, 2, 'オブジェクトでない要素は無視されていること');
			strictEqual($lis[0].innerText, 'a', 'オブジェクトである要素はバインドされていること');
			strictEqual($lis[1].innerText, 'b', 'オブジェクトである要素はバインドされていること');

			$fixture.children().remove();
		}
		expect(l * 3);
	});

	test('ObservableItemを要素に持つObservableArrayをバインドできること', 4, function() {
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
		$('#dataBindTest li').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
	});

	//=============================
	// Definition
	//=============================
	var oAry = null;
	module('ObservableArrayの変更検知', {
		setup: function() {
			oAry = h5.u.obj.createObservableArray();

			$fixture.append(simpleLoopElm);
			view.bind($('#dataBindTest'), {
				items: oAry
			});
		}
	});

	//=============================
	// Body
	//=============================

	test('バインドされているObservableArrayの中身を変更すると、表示も書き変わること', function() {
		oAry.copyFrom([{
			test: 'a'
		}, {
			test: 'b'
		}]);
		var result = ['a', 'b'];
		$('#dataBindTest li').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});

		oAry.copyFrom([]);
		strictEqual($('#dataBindTest li').length, 0, '中身を空にすると、繰り返し要素がなくなること');

		oAry.copyFrom([{
			test: 'AA'
		}, {
			test: 'BB'
		}, {
			test: 'CC'
		}]);
		result = ['AA', 'BB', 'CC'];
		$('#dataBindTest li').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});

		oAry.push({
			test: 'DD'
		});
		oAry.splice(1, 2, {
			test: 'BBB'
		});
		oAry.unshift({
			test: 'aa'
		});
		oAry.reverse();
		result = ['DD', 'BBB', 'AA', 'aa'];
		$('#dataBindTest li').each(
				function(i) {
					strictEqual(this.innerText, result[i], 'ObservableArrayの中身通りの順番で値がバインドされていること'
							+ result[i]);
				});
	});

	test(
			'バインドされているObservableArrayの中のObservableItemを変更すると、表示も書き変わること',
			function() {
				var schema = {
					test: null
				};
				var item1 = h5.u.obj.createObservableItem(schema);
				var item2 = h5.u.obj.createObservableItem(schema);
				item1.set('test', 'a');
				item2.set('test', 'b');

				oAry.push(item1);
				strictEqual($('#dataBindTest li').length, 1,
						'ObservableArrayにObservableItemをpushすると、ビューへ反映されること');
				strictEqual($('#dataBindTest li').text(), 'a', 'ObservableItemの中身がビューへ反映されていること');

				oAry.push(item2);
				strictEqual($('#dataBindTest li')[1].innerText(), 'b',
						'ObservableItemの中身がビューへ反映されていること');

				oAry.push({
					test: 'c'
				});
				strictEqual($('#dataBindTest li')[2].innerText(), 'c', '通常のオブジェクトの中身もビューへ反映されていること');

				item1.set('test', 'A');
				strictEqual($('#dataBindTest li')[0].innerText(), 'A',
						'ObservableItemの中身の変更がビューへ反映されていること');
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
	test('バインドできること', function() {
		testDataItemObsItem(function(item, isDataItem) {
			var itemType = isDataItem ? 'DataItem' : 'ObservableItem';

			view.bind($('#dataBindTest'), item);

			var exp = ['abc', '-123.45', 'obj.a', 'abc', '-123.45', 'ary.1', 'ary.2', 'oAry.1',
					'oAry.2'];
			expect(exp.length);
			$('#dataBindTest span').each(function(i) {
				strictEqual(this.innerText, exp[i], itemType + 'の中身がバインドされていること' + exp[i]);
			});
		}, testSchema);
	});

	test('循環参照を持っていてもバインドできること', function() {
		testDataItemObsItem(function(item, isDataItem) {
			var itemType = isDataItem ? 'DataItem' : 'ObservableItem';
			item.set('item', item);

			view.bind($('#dataBindTest'), item);

			var exp = ['abc', '-123.45', 'obj.a', 'abc', '-123.45', 'ary.1', 'ary.2', 'oAry.1',
					'oAry.2'];
			expect(exp.length);
			$('#dataBindTest span').each(function(i) {
				strictEqual(this.innerText, exp[i], itemType + 'の中身がバインドされていること' + exp[i]);
			});
		}, testSchema);
	});

	test('オブジェクト内のObservableItem/DataItemをバインドできること', function() {
		testDataItemObsItem(function(item, isDataItem) {
			var itemType = isDataItem ? 'DataItem' : 'ObservableItem';

			$('#dataBindTest').wrapInner('<div data-h5-context="item">');
			view.bind($('#dataBindTest'), {
				item: item
			});

			var exp = ['abc', '-123.45', 'obj.a', 'abc', '-123.45', 'ary.1', 'ary.2', 'oAry.1',
					'oAry.2'];
			expect(exp.length);
			$('#dataBindTest span').each(function(i) {
				strictEqual(this.innerText, exp[i], itemType + 'の中身がバインドされていること' + exp[i]);
			});
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

	test('バインドされているObserbableItem/DataItemの中身を変更すると、表示も書き変わること', 13, function() {
		testDataItemObsItem(function(item, isDataItem) {
			var itemType = isDataItem ? 'DataItem' : 'ObservableItem';

			item.set({
				str: 'AA',
				num: 11,
				ary: [{
					a: 'ary[0]'
				}, {
					a: 'ary[1]'
				}],
				any: [{
					test: 'any[0]'
				}]
			});

			// バインド先の設定
			var $dataBindTest = $('<div id="dataBindTest">');
			$dataBindTest.append(createBindSpan('str'));
			$dataBindTest.append(createBindSpan('num'));
			$loopContext1 = $('<div data-h5-loop-context="ary">');
			$loopContext1.append(createBindSpan('a'));
			$loopContext2 = $('<div data-h5-loop-context="ary">');
			$loopContext2.append(createBindSpan('test'));
			$fixture.append($dataBindTest.append($loopContext1).append($loopContext2));

			view.bind($('#dataBindTest'), item);
			var result = ['AA', '11', 'ary[0]', 'ary[1]', 'any[0]'];
			$('#dataBindTest span').each(
					function(i) {
						strictEqual(this.innerText, result[i], itemType
								+ ' data-h5-bind指定した要素に値が表示されていること。' + result[i]);
					});

			//イベントリスナの登録
			var changed = 0;
			item.addEventListener('change', function() {
				changed++;
			});

			item.set({
				str: 'BB',
				num: 22,
				ary: [{
					a: 'newAry[0]'
				}]
			});
			result = ['BB', '22', 'newAry[0]'];
			$('#dataBindTest span').each(function(i) {
				strictEqual(this.innerText, result[i], itemType + ' 変更が反映されていること' + result[i]);
			});
			strictEqual(changed--, 1, 'イベントリスナが動作していること');

			// ObservableArrayのメソッドで配列を変更
			item.get('ary').push({
				a: 'newAry[1]'
			});
			result.push('newAry[1]');
			$('#dataBindTest span').each(
					function(i) {
						strictEqual(this.innerText, result[i], itemType
								+ ' type:[]の中身に変更があった時に反映されていること' + result[i]);
					});
			strictEqual(changed--, 1, 'イベントリスナが動作していること');

			// type:anyに配列を持たせる
			item.set('any', [{
				test: 'any[0]'
			}, {
				test: 'any[1]'
			}]);
			result.push('any[0]');
			result.push('any[1]');
			$('#dataBindTest span').each(
					function(i) {
						strictEqual(this.innerText, result[i], itemType
								+ ' type:anyに配列を持たせたときに、その配列がh5-data-loop-contextにバインドされること。'
								+ result[i]);
					});
			strictEqual(changed--, 1, 'イベントリスナが動作していること');

			// type:anyが持つ配列インスタンスを別の配列インスタンスに変更
			item.set('any', [{
				test: 'newAny[0]'
			}]);
			result.splice(result.length - 2, 2, 'newAny[0]');
			$('#dataBindTest span').each(
					function(i) {
						strictEqual(this.innerText, result[i], itemType
								+ ' type:anyの配列のインスタンスが変更されたとき、変更が反映されること' + result[i]);
					});
			strictEqual(changed--, 1, 'イベントリスナが動作していること');
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