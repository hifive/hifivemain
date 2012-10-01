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

	//=============================
	// Functions
	//=============================

	/**
	 * 引数に指定された値をdata-h5-bind属性に持つspan要素を作って返す
	 */
	function createBindSpan(p) {
		return $('<span data-h5-bind="' + p + '">');
	}


	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================

	module('data-h5-bind', {
		setup: function() {},
		teardown: function() {}
	});

	//=============================
	// Body
	//=============================
	test(
			'data-h5-bind属性に指定した名前のプロパティがバインドできること',
			function() {
				$fixture
						.append('<div id="dataBindTest"><span data-h5-bind="test"></span><p data-h5-bind="test2"></p><div><pre data-h5-bind="test2"></pre></div></div>');
				h5.core.view.bind($('#dataBindTest', $fixture), {
					test: 'abc',
					test2: 'abcd'
				});
				strictEqual($('#dataBindTest>span').text(), 'abc', 'data-h5-bind指定した要素に値が表示されていること');
				strictEqual($('#dataBindTest>p').text(), 'abcd', 'data-h5-bind指定した要素に値が表示されていること');
				strictEqual($('#dataBindTest>div>pre').text(), 'abcd',
						'data-h5-bind指定した要素に値が表示されていること');
			});

	test('data-h5-bind属性をしていた要素にバインドされているプロパティの値で中身が書き変わること', function() {
		$fixture.append(simpleElm);
		h5.core.view.bind($('#dataBindTest', $fixture), {
			test: 'abc'
		});

		strictEqual($('#dataBindTest>span').text(), 'abc', 'data-h5-bind指定した要素の値が書き変わること');
	});

	test('data-h5-bind属性をしていた要素にバインドされているプロパティがない場合は、中身が変わらないこと', function() {
		$fixture.append(simpleElm);
		h5.core.view.bind($('#dataBindTest'), {
			test2: 'abc'
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
		h5.core.view.bind($dataBindTest, {
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

	test('データがバインドされた要素に、再度バインドすると、後からバインドしたものに上書かれること', function() {
		var objA = {
			test1: 'a',
			test2: 'b'
		};
		var objB = {
			test2: 'B',
			test3: 'C'
		};
		var $dataBindTest = $('<div id="dataBindTest">');
		for ( var i = 1; i <= 3; i++) {
			$dataBindTest.append(createBindSpan('test' + i));
		}

		$fixture.append($dataBindTest);

		// objAのバインド
		h5.core.view.bind($('#dataBindTest'), objA);

		var result = ['a', 'b', ''];
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});

		// objBのバインド
		h5.core.view.bind($('#dataBindTest'), objB);
		result = ['a', 'B', 'C'];
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
	});

	test('バインドに指定する要素が複数ある場合は、複数にバインドされること', function(){
		//TODO
	});

	test('バインドに指定する要素が存在しない場合は、エラーになること', function(){
		//TODO
	});

	test('バインドに指定する要素の指定方法はjQueryオブジェクト、DOM、セレクタのどれでもいいこと', function(){
		//TODO
	});

	test('バインド指定するものがオブジェクトでない場合はエラーになること', function(){

	});

	//=============================
	// Definition
	//=============================
	module('data-h5-context');

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

				h5.core.view.bind($('#dataBindTest', $fixture), {
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

	test('データがバインドされた要素に、再度バインドすると、後からバインドしたものに上書かれること', function() {
		var objA = {
			obj: {
				test1: 'a',
				test2: 'b'
			}
		};
		var objB = {
			obj: {
				test2: 'B',
				test3: 'C'
			}
		};
		var $dataBindTest = $('<div id="dataBindTest">');
		var $context = $('<div data-h5-context="obj">');
		for ( var i = 1; i <= 3; i++) {
			$context.append(createBindSpan('test' + i));
		}

		$fixture.append($dataBindTest.append($context));

		// objAのバインド
		h5.core.view.bind($('#dataBindTest'), objA);

		// objBのバインド
		h5.core.view.bind($('#dataBindTest'), objB);

		result = ['a', 'B', 'C'];
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
	});

	//=============================
	// Definition
	//=============================
	module('data-h5-loop-context');

	//=============================
	// Body
	//=============================

	test('data-h5-loop-contextで、配列をバインドできること', function() {
		var items = [{
			test: 'a'
		}, {
			test: 'b'
		}];
		$fixture.append(simpleLoopElm);
		h5.core.view.bind($('#dataBindTest'), {
			test: 'aaa',
			items: items
		});

		var result = ['a', 'b'];
		$('#dataBindTest li').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
	});

	test('data-h5-loop-contextで、ObservableArrayをバインドできること', function() {
		var items = h5.u.obj.createObservableArray();
		items.copyFrom([{
			test: 'a'
		}, {
			test: 'b'
		}]);

		$fixture.append(simpleLoopElm);
		h5.core.view.bind($('#dataBindTest'), {
			test: 'aaa',
			items: items
		});

		var result = ['a', 'b'];
		$('#dataBindTest li').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
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
	});

	//=============================
	// Body
	//=============================

	test('ObservableItem バインドできること', function() {
		var item = h5.u.obj.createObservableItem(testSchema);
		item.set('item', item);

		h5.core.view.bind($('#dataBindTest'), item);

		var exp = ['abc', '-123.45', 'obj.a', 'abc', '-123.45', 'ary.1', 'ary.2', 'oAry.1',
				'oAry.2'];
		expect(exp.length);
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, exp[i], 'ObservableItemの中身がバインドされていること' + exp[i]);
		});
	});

	test('ObservableItem データがバインドされた要素に、再度バインドすると、後からバインドしたものに上書かれること', function() {
		var item = h5.u.obj.createObservableItem(testSchema);

		// ObsItemのバインド
		h5.core.view.bind($('#dataBindTest'), item);

		// ObsItemで上書き
		var newItem = h5.u.obj.createObservableItem({
			str: null,
			num: null
		});
		newItem.set({
			str: 'newItemStr',
			num: 'newItemNum'
		});
		h5.core.view.bind($('#dataBindTest'), newItem);

		result = ['newItemStr', 'newItemNum'];
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
			if (i === result.length - 1) {
				return false;
			}
		});

		item.set('str', 'バインドされていないアイテム');

		$('#dataBindTest span').each(
				function(i) {
					strictEqual(this.innerText, result[i], 'バインドされていないアイテムの値を変更しても、表示は変わらないこと'
							+ result[i]);
					if (i === result.length - 1) {
						return false;
					}
				});
		// オブジェクトで上書き
		h5.core.view.bind($('#dataBindTest'), {
			str: 'AA',
			num: 'BB'
		});

		result = ['AA', 'BB'];
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
			if (i === result.length - 1) {
				return false;
			}
		});
	});

	test('DataItem バインドできること', function() {
		var manager = h5.core.data.createManager('TestManager');
		testSchema.id = {
			id: true
		};
		var model = manager.createModel({
			name: 'TestModel',
			schema: testSchema
		});
		var item = model.create({
			id: '1'
		});
		item.set('item', item);

		h5.core.view.bind($('#dataBindTest'), item);

		var exp = ['abc', '-123.45', 'obj.a', 'abc', '-123.45', 'ary.1', 'ary.2', 'oAry.1',
				'oAry.2'];
		expect(exp.length);
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, exp[i], 'ObservableItemの中身がバインドされていること' + exp[i]);
		});
	});


	test('オブジェクト内のObservableItem バインドできること', function() {
		var item = h5.u.obj.createObservableItem(testSchema);
		item.set('item', item);

		$('#dataBindTest').wrapInner('<div data-h5-context="item">');
		h5.core.view.bind($('#dataBindTest'), {
			item: item
		});

		var exp = ['abc', '-123.45', 'obj.a', 'abc', '-123.45', 'ary.1', 'ary.2', 'oAry.1',
				'oAry.2'];
		expect(exp.length);
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, exp[i], 'ObservableItemの中身がバインドされていること' + exp[i]);
		});
	});

	test('オブジェクト内のDataItem バインドできること', function() {
		var manager = h5.core.data.createManager('TestManager');
		testSchema.id = {
			id: true
		};
		var model = manager.createModel({
			name: 'TestModel',
			schema: testSchema
		});
		var item = model.create({
			id: '1'
		});
		item.set('item', item);

		$('#dataBindTest').wrapInner('<div data-h5-context="item">');
		h5.core.view.bind($('#dataBindTest'), {
			item: item
		});

		var exp = ['abc', '-123.45', 'obj.a', 'abc', '-123.45', 'ary.1', 'ary.2', 'oAry.1',
				'oAry.2'];
		expect(exp.length);
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, exp[i], 'ObservableItemの中身がバインドされていること' + exp[i]);
		});
	});

	//=============================
	// Definition
	//=============================
	module('変更検知', {
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
				}
			};
		}
	});

	//=============================
	// Body
	//=============================

	test('バインドされているObservableArrayの中身を変更すると、表示も書き変わること', function() {
		var items = h5.u.obj.createObservableArray();
		var observed = 0;
		items.addEventListener('observe', function() {
			observed++;
		});
		items.copyFrom([{
			test: 'a'
		}, {
			test: 'b'
		}]);

		// バインド
		$fixture.append(simpleLoopElm);
		h5.core.view.bind($('#dataBindTest'), {
			items: items
		});

		var result = ['a', 'b'];
		$('#dataBindTest li').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
		strictEqual(observed--, 1, 'ObserableArrayのobserveにハンドリングしたイベントリスナが動作していること');


		items.copyFrom([{
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
		strictEqual(observed--, 1, 'ObserableArrayのobserveにハンドリングしたイベントリスナが動作していること');
	});

	test('バインドされているObserbableItemの中身を変更すると、表示も書き変わること', 10, function() {
		var item = h5.u.obj.createObservableItem(testSchema);
		item.set({
			str: 'AA',
			num: 11,
			ary: [{
				a: 'ary[0]'
			}, {
				a: 'ary[1]'
			}]
		});

		// バインド先の設定
		var $dataBindTest = $('<div id="dataBindTest">');
		$dataBindTest.append(createBindSpan('str'));
		$dataBindTest.append(createBindSpan('num'));
		$loopContext = $('<div data-h5-loop-context="ary">');
		$loopContext.append(createBindSpan('a'));
		$fixture.append($dataBindTest.append($loopContext));

		h5.core.view.bind($('#dataBindTest'), item);
		var result = ['AA', '11', 'ary[0]', 'ary[1}'];
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
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
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
		strictEqual(changed--, 1, 'イベントリスナが動作していること');

		// 配列だけ変更
		item.get('ary').push('newAry[1]');
		result.push('newAry[1]');
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
		strictEqual(changed--, 1, 'イベントリスナが動作していること');
	});

	test('バインドされているデータアイテムの中身を変更すると、表示も書き変わること', 17, function() {
		testSchema.id = {
			id: true
		};
		var manager = h5.core.data.createManager('TestManager');
		var model = manager.createModel({
			name: 'TestModel',
			schema: testSchema
		});
		var item = model.create({
			id: '1'
		});
		item.set({
			str: 'AA',
			num: 11,
			ary: [{
				a: 'ary[0]'
			}, {
				a: 'ary[1]'
			}]
		});

		// バインド先の設定
		var $dataBindTest = $('<div id="dataBindTest">');
		$dataBindTest.append(createBindSpan('str'));
		$dataBindTest.append(createBindSpan('num'));
		$loopContext = $('<div data-h5-loop-context="ary">');
		$loopContext.append(createBindSpan('a'));
		$fixture.append($dataBindTest.append($loopContext));

		h5.core.view.bind($('#dataBindTest'), item);
		var result = ['AA', '11', 'ary[0]', 'ary[1}'];
		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
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
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
		strictEqual(changed--, 1, 'イベントリスナが動作していること');

		// 配列だけ変更
		item.get('ary').push('newAry[1]');
		result.push('newAry[1]');

		$('#dataBindTest span').each(function(i) {
			strictEqual(this.innerText, result[i], 'data-h5-bind指定した要素に値が表示されていること。' + result[i]);
		});
		strictEqual(changed--, 1, 'イベントリスナが動作していること');

		//begin-end
		manager.beginUpdate();
		item.set('str', 'CC');
		strictEqual($('#dataBindTest span:first').text(), 'BB',
				'アップデートセッション中にデータアイテムが変更された場合は、endUpdateを呼ぶまではバインド先に反映されていないこと');
		manager.endUpdate();
		strictEqual($('#dataBindTest span:first').text(), 'CC', 'endUpdate時にバインド先に反映されること');
		strictEqual(changed--, 1, 'イベントリスナが動作していること');
	});

});