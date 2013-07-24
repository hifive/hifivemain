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
	module('ObservableItem');

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

	test('getModelメソッドはObservableItemにはないこと', 1, function() {
		var item = h5.core.data.createObservableItem({
			no: null,
			name: null
		});
		strictEqual(item.getModel, undefined, 'ObservableItemが作成できること');
	});

	test('id:true指定の項目は無視されること', 3, function() {
		var item = h5.core.data.createObservableItem({
			id: {
				id: true
			},
			name: {
				id: true
			}
		});
		ok(item, 'id:true指定の項目が複数あってもObservableItemを作成できること');
		var ary = [];
		item.set('id', ary);
		strictEqual(item.get('id'), ary, 'id:trueを指定しても無視され、制約は掛からないこと。');
		item.set('name', null);
		strictEqual(item.get('name'), null, 'id:trueを指定しても無視され、制約は掛からないこと。');
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

	test('isObservableItem', 2, function() {
		var item = h5.core.data.createObservableItem({
			no: null,
			name: null
		});
		strictEqual(h5.core.data.isObservableItem(item), true,
				'ObservableItemをisObservableItem()に渡すとtrueが返ってくること');

		var manager = h5.core.data.createManager('manager');
		var model = manager.createModel({
			name: 'model',
			schema: {
				id: {
					id: true
				}
			}
		});
		item = model.create({
			id: '0'
		});
		strictEqual(h5.core.data.isObservableItem(item), false,
				'DataItemをisObservableItem()に渡すとfalseが返ってくること');
	});

	//=============================
	// Definition
	//=============================
	module('ObservableItem changeイベント');

	//=============================
	// Body
	//=============================
	test('ObservableItemのプロパティに変更があった時にイベントが上がること', 4, function() {
		var item = h5.core.data.createObservableItem({
			v: null,
			ary: {
				type: 'any[]'
			}
		});
		var expectEventObjProps = null;
		item.addEventListener('change', function(e) {
			deepEqual(e.props, expectEventObjProps, '値の変更でイベントが上がり、changeイベントハンドラにオブジェクトが渡されること');
		});
		expectEventObjProps = {
			v: {
				newValue: 1,
				oldValue: null
			}
		};
		item.set('v', 1);

		expectEventObjProps = {
			ary: {
				newValue: item.get('ary'),
				oldValue: []
			}
		};
		item.set('ary', [1]);

		expectEventObjProps = {
			ary: {
				newValue: item.get('ary'),
				oldValue: [1]
			}
		};
		item.get('ary').push(2);

		expectEventObjProps = {
			ary: {
				newValue: item.get('ary'),
				oldValue: [1, 2]
			},
			v: {
				newValue: 2,
				oldValue: 1
			}
		};
		item.set({
			v: 2,
			ary: [2]
		});
	});
});