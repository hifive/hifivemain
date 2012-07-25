/*
 * Copyright (C) 2012 NS Solutions Corporation, All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 *
 * hifive
 */
$(function() {
	/**
	 * データモデルマネージャ
	 */
	var manager = {};

	module('createManager', {
		setup: function() {
		//
		},
		teardown: function() {
			// マネージャをリセットする
			manager.dropModel('TestManager');
		}
	});

	test('データモデルマネージャの作成', 1, function() {
		manager = h5.core.data.createManager('TestManager');
		strictEqual(manager.name, 'TestManager', 'データモデルマネージャが指定した名前で作成されること');
		console.log(manager);
	});

	test('データモデルマネージャの作成 名前空間指定', 1, function() {
		manager = h5.core.data.createManager('TestManager', 'com.htmlhifive.test');
		strictEqual(manager, com.htmlhifive.test.TestManager, 'データモデルマネージャが指定した名前で作成されること');
		com.htmlhifive.test.TestManager = undefined;
	});

	module('createModel', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
		},
		teardonw: function() {
			// マネージャをリセットする
			manager.dropModel('TestManager');
		}
	});

	test('データモデルの登録', 5, function() {
		var descripter = {
			name: 'TestDataModel',
			description: 'データモデルテスト',
			schema: {
				empId: {
					id: true,
					title: 'ID',
					description: 'IDを保持するプロパティです'
				},
				name: {
					title: '名前',
					description: '名前を保持するプロパティです'
				}
			}
		};
		var model = manager.createModel(descripter);

		ok(model, 'モデルが作成できること');
		strictEqual(model.descriptor, descripter, 'モデルにdescriptorが格納されていること');
		strictEqual(model.idKey, 'empId', 'IDとなるキーが取得できること');
		strictEqual(model.manager, manager, 'データモデルマネージャが取得できること');
		strictEqual(model.size, 0, 'データを格納していないので、sizeが0であること');

		//		var item = model.getItem({
		//			id: '001',
		//			name: 'test'
		//		});
		//		ok(item, 'モデルが作成できて、getItem()できること');
		//		strictEqual(item.id, '001', 'プロパティが格納されていること');
		//		strictEqual(item.name, 'test', 'プロパティが格納されていること');
	});

	test('データモデルの登録 descriptorがオブジェクトでない場合はエラーが発生すること', function() {
		// TODO エラーコード確認する
		var errCode = 30001;
		var noDescriptors = ["a", 1, null, undefined, true];
		var l = noDescriptors.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			try {
				manager.createModel(noDescriptors[i]);
				ok(false, 'エラーが発生していません。');
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	});

	test('データモデルの登録 descriptorにnameプロパティがない場合はエラーが発生すること', 2, function() {
		// TODO エラーコード確認する
		var errCode = 30001;
		try {
			manager.createModel({});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
		try {
			manager.createModel({
				__name: 'TestDataModel',
				description: 'データモデルテスト',
				schema: {
					empId: {
						id: true,
						title: 'ID',
						description: 'IDを保持するプロパティです'
					},
					name: {
						title: '名前',
						description: '名前を保持するプロパティです'
					}
				}
			});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('データモデルの登録 descriptorにschemaプロパティがない場合はエラーが発生すること', 1, function() {
		// TODO エラーコード確認する
		var errCode = 30000;
		try {
			manager.createModel({name:'TestDataModel'});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	// TODO schemaの指定でエラーが出るパターン書く

	test('データモデルの登録 type指定 string', 1, function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			description: 'データモデルテスト',
			schema: {
				id: {
					id: true,
					type: 'number',
				},
				str: {
					type: 'string'
				}
			}
		});

		var item = model.getItem({
			id: 0,
			str: 'taro'
		});

		strictEqual(item.str, 'taro', 'type:\'string\'のプロパティに文字列値が格納できること');

		var noStrs = [0, true, {
			str: "test"
		}, ["test"], /test/, new String('test')];

		for ( var i = 0, l = noStrs.length; i < l; i++) {
			try {
				model.getItem({
					id: 'noStr' + i,
					str: noStrs[i]
				});
				ok(false, 'テスト失敗。文字列以外を格納したが、エラーが発生していない');
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}

		item.str = 'jiro';
		strictEqual(item.str, 'jiro', 'type:\'string\'のプロパティに文字列値を代入できること');

		for ( var i = 0, l = noStrs.length; i < l; i++) {
			try {
				item.str = noStrs[i];
				ok(false, 'テスト失敗。文字列以外を代入したが、エラーが発生していない');
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	});


	// TODO タイプ毎にテストケースを作るようにする
	test('データモデルの登録 type指定', 1, function() {
		// タイプが不正な場合のエラーコード
		var errCode = 30001;

		var nameDescriptor = {
			name: 'NameModel',
			schema: {
				id: {
					id: true
				},
				name: {}
			}
		};
		var nameModel = manager.createModel(nameDescriptor);
		var model = manager.createModel({
			name: 'TestDataModel',
			description: 'データモデルテスト',
			schema: {
				id: {
					id: true,
					type: 'number',
				},
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
				obj: {
					type: 'object'
				},
				array: {
					type: 'array'
				},
				any: {
					type: 'any'
				},
				date: {
					type: 'date'
				},
				regex: {
					type: 'regex'
				},
				datamodel1: {
					type: '@TestDataModel'
				},
				datamodel2: {
					type: '@NameModel'
				}
			}
		});

		// 正しい型の値が入ることを確認する
		var obj = {
			a: 1
		};
		var array = [1, 2];
		var date = new Date();
		var regex = /a/gim;
		var nameItem = nameModel.getItem({
			id: 0,
			name: 'test'
		});
		var item = model.getItem({
			id: 0,
			str: 'taro',
			num: 0.1,
			int: -1,
			bool: false,
			obj: obj,
			array: array,
			any: -1.1,
			date: date,
			regex: regex,
			datamodel2: nameItem
		});
		var item2 = model.getItem({
			id: 1,
			datamodel1: item
		});

		// getItemに指定した値が全て格納されていることを確認する
		// TODO オブジェクトがcloneされるのかどうか確認する
		strictEqual(item.num, 0.1, 'type:\'number\'のプロパティに数値が格納できること');
		strictEqual(item.int, 1, 'type:\'integer\'のプロパティに整数値が格納できること');
		strictEqual(item.bool, false, 'type:\'boolean\'のプロパティに真偽値が格納できること');
		deepEqual(item.obj, {
			a: 1
		}, 'type:\'object\'のプロパティにオブジェクトが格納できること');
		ok(item.obj !== obj, 'objectがクローンされて格納されていること');
		deepEqual(item.array, [1, 2], 'type:\'array\'のプロパティに配列が格納できること');
		ok(item.array !== array, 'arrayがクローンされて格納されていること');
		strictEqual(item.any, -1.1, 'type:\'any\'のプロパティに-1.1が格納できること');
		strictEqual(item.date.getTime(), date.getTime(), 'type:\'date\'のプロパティにDateオブジェクトが格納できること');
		ok(item.date !== date, 'Dateオブジェクトがクローンされて格納されていること');
		strictEqual(item.regex.toString(), regex.toString(),
				'type:\'regex\'のプロパティにRegexオブジェクトが格納できること');
		ok(item.regex !== regex, 'Regexオブジェクトがクローンされて格納されていること');
		deepEqual(item2.datamodel1, item,
				'type:\'@TestDataModel\'を指定したプロパティにTestDataModelのオブジェクトが格納できること');
		ok(item2.datamodel1 === item, 'インスタンスが変わっていないこと');
		deepEqual(item.datamodel2, nameItem,
				'type:\'@NameModel\'を指定したプロパティにNameModelのオブジェクトが格納できること');
		ok(item.datamodel2 === nameItem, 'インスタンスが変わっていないこと');

		var manager2 = h5.core.data.createManager('Test2Manager');
		var modelName2 = manager2.createModel(nameDescriptor);


		ok(true, 'typeに指定された型と同じ型の値を持つオブジェクトでgetItemできること');
		try {
			model.getItem({
				id: 2,
				name: 'taro'
			});
			ok(false, 'typeに指定されたものと異なるプロパティを持つオブジェクトでgetItemするとエラーが出ること');
		} catch (e) {
			ok(e.code, errCode, e.message);
		}
		try {
			model.getItem({
				id: 3,
				name: 3
			});
			ok(false, 'typeに指定されたものと異なるプロパティを持つオブジェクトでgetItemするとエラーが出ること');
		} catch (e) {
			ok(e.code, errCode, e.message);
		}
		try {
			item.id = '4';
			ok(false, 'typeに指定されたものと異なるプロパティを代入するとエラーが出ること');
		} catch (e) {
			ok(e.code, errCode, e.message);
		}
		try {
			item.name = new String('abc');
			ok(false, 'typeに指定されたものと異なるプロパティを代入するとエラーが出ること');
		} catch (e) {
			ok(e.code, errCode, e.message);
		}
	});

	// TODO addEventListener, removeEventListener, hasEventListener のテスト
	// DataItemはchangeイベントのみ
	//　・DataItemは change イベントのみを出す
	//	        changeイベントオブジェクト：
	//	        {
	//	                type: 'change',
	//	                target: (当該DataItemインスタンス),
	//	                props: {
	//	                    (変更されたプロパティ1): {
	//	                            oldValue: (変更前の値),
	//	                            newValue: (変更後の値)
	//	                    },
	//	                    (変更されたプロパティ2): {
	//	                            oldValue: (変更前の値),
	//	                            newValue: (変更後の値)
	//	                    }, ...
	//	                }
	//	        }
	//	    ・DataModelは itemsChange イベントを出す
	//	        itemsChangeイベントオブジェクト：
	//	        {
	//	                type: 'change',
	//	                target: (当該DataModelインスタンス),
	//	                added: [(DataItem配列)],
	//	                removed: [(DataItem配列)],
	//	                changed: [(↑のchangeイベントオブジェクト配列)]
	//	        }
	//
	//	    ・DataItem側で変更があった場合は
	//	        Item、Model両方からイベントが上がる



	// TODO removeItemのテスト
	//	    removeItem(itemOrItemIdOrArray)
	//	            ・オブジェクトが渡されたらそれをitemとみなして当該idのオブジェクトの削除を試みる
	//	            ・Stringの場合はitemのidとみなす
	//	            ・Arrayの場合はitemOrItemIdの配列とみなす
});