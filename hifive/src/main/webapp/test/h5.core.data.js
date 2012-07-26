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
	// TODO マネージャを新規生成するテストでなければ、setupでmanagerを生成し、teardownでmanager.dropModelを呼べばOK
	var manager = {};

	module('createManager', {
		setup: function() {
			manager = undefined;
		},
		teardown: function() {
			// マネージャをリセットする
			manager && manager.dropModel('TestManager');
		}
	});

	test('データモデルマネージャの作成', 1, function() {
		manager = h5.core.data.createManager('TestManager');
		strictEqual(manager.name, 'TestManager', 'データモデルマネージャが指定した名前で作成されること');
	});

	test('データモデルマネージャの作成 名前空間指定', 1, function() {
		manager = h5.core.data.createManager('TestManager', 'com.htmlhifive.test');
		strictEqual(manager, com.htmlhifive.test.TestManager, 'データモデルマネージャが指定した名前空間に作成されること');
		com.htmlhifive.test.TestManager = undefined;
	});

	test('データモデルマネージャの作成 名前指定が文字列以外の時にエラーが出ること', function() {
		// TODO エラーコード確認する
		var errCode = 30000;
		var noStrs = [0, 1, null, undefined, true, ['TestModel'], {
			name: 'TestModel'
		}];
		var l = noStrs.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			try {
				manager = h5.core.data.createManager(noStrs[i]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	});

	test('データモデルマネージャの作成 名前指定が不正な文字列の時にエラーが出ること', function() {
		// TODO エラーコード確認する
		var errCode = 30000;
		// TODO trimされるのかどうか確認する。$,_がOKなのかどうか確認する
		var invalidStrs = ['', ' ', '1A', '$A', 'A$', ' TestModel', '_TestModel', 'Test Model'];
		var l = invalidStrs.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			try {
				manager = h5.core.data.createManager(invalidStrs[i]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	});

	test('データモデルマネージャの作成 名前空間指定が不正な時にエラーが出ること', function() {
		var errCode = 30005;
		var invalidNs = [0, 1, true, false, [], {}, '', ' '];
		var l = invalidNs.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			try {
				manager = h5.core.data.createManager('TestModel', invalidNs[i]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
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

	test('データモデルの登録', 6, function() {
		var schema = {
			empId: {
				id: true,
				title: 'ID',
				description: 'IDを保持するプロパティです'
			},
			name: {
				title: '名前',
				description: '名前を保持するプロパティです'
			}
		};
		var descripter = {
			name: 'TestDataModel',
			description: 'データモデルテスト',
			schema: schema
		};
		var model = manager.createModel(descripter);

		ok(model, 'モデルが作成できること');
		strictEqual(model.descriptor, descripter, 'モデルにdescriptorが格納されていること');
		deepEqual(model.schema, schema, 'モデルにschemaが格納されていること');
		strictEqual(model.idKey, 'empId', 'IDとなるキーが取得できること');
		strictEqual(model.manager, manager, 'データモデルマネージャが取得できること');
		strictEqual(model.size, 0, 'データを格納していないので、sizeが0であること');
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
		var errCode = 30005;
		try {
			manager.createModel({
				name: 'TestDataModel'
			});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('baseのにデータモデルが指定されている場合は、指定されたデータモデルのプロパティを継承し、schema指定されたプロパティと同名のものがあれば上書かれていること',
			function() {
			// TODO 多重継承できていることも確認する
			});

	test('データモデルの登録 descriptionが文字列でない場合はエラーが発生すること', function() {
	// TODO
	});

	test('データモデルの登録 extendsの指定が不正な場合はエラーが発生すること', function() {
	// TODO
	});

	test('データモデルの登録 schemaがオブジェクトでない場合はエラーが発生すること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック schemaがプロパティを持たないオブジェクト(空オブジェクト)の場合エラーが発生すること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック id指定されているプロパティがない場合・複数ある場合・boolean型以外が指定されている場合はエラーが出ること',
			function() {
			// TODO boolean型以外の場合はエラーになるのかどうか確認する
			});

	test('データモデルの登録 schemaのチェック typeに文字列以外を指定した場合はエラーが出ること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック typeに不正な文字列を指定した場合はエラーが出ること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック enumValueに配列以外を指定した場合はエラーが出ること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック enumValueに不正な配列を指定した場合はエラーが出ること', function() {
	// TODO 要素が重複してる等
	});

	test('データモデルの登録 schemaのチェック enhanceにboolean以外を指定した場合はエラーが出ること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック titleに文字列以外を指定した場合はエラーが出ること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック descriptionに文字列以外を指定した場合はエラーが出ること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック dependに不正な値を指定した場合はエラーが出ること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック constraintに不正な値を指定した場合はエラーが出ること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック defaultValueにtype指定と矛盾する値を指定した場合はエラーが出ること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック propertiesにオブジェクト以外を指定した場合はエラーが出ること', function() {
	// TODO
	});

	test('データモデルの登録 schemaのチェック properties指定したオブジェクトの中身が不正な時はエラーが出ること', function() {
	// TODO 再帰的にpropertiesの中身をチェックしているかどうかをテストする
	});


	module('dropModel', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
		},
		teardonw: function() {
			// マネージャをリセットする
			manager.dropModel('TestManager');
		}
	});

	test('データモデルのドロップ', function() {
	// TODO model.dropModel()のテスト
	});

	module('create, set', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
		},
		teardonw: function() {
			// マネージャをリセットする
			manager.dropModel('TestManager');
		}
	});

	test('createでアイテムが生成できること。引数に配列を渡した場合は戻り値も配列になること。', function() {
	// TODO createやitem.id=xxx で重複したidを持たせようとするとエラー (配列の途中でエラーが出た場合、アトミックに処理されるかどうかの仕様を確認する)
	});

	test('idの重複するアイテムは生成できず、エラーになること', function() {
	// TODO createやitem.id=xxx で重複したidを持たせようとするとエラー
	});

	test('constraintに指定されているルールを満たさない値は、格納できずにエラーになること', function() {
	// TODO createやitem.id=xxx で重複したidを持たせようとするとエラー
	});

	// TODO typeプロパティ指定が正しい場合についてのテスト
	// type毎にテストケースを書く
	// type毎にdefaultValueのチェック(指定していない場合)を確認する
	// defaultValueに不正な値を指定している場合はcreateModelのテストでチェックしているのでここでは不要
	test('type指定 string', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
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
		// TODO modelのchange, add イベントが発火するかどうかを確認する
		var changed = false;
		model.objectChangeListener(function() {
			changed = true;
		});

		var item = {};
		var id = 0;
		try {
			item = model.create({
				id: id++,
				str: 'taro'
			});
			strictEqual(item.str, 'taro', 'type:\'string\'のプロパティに文字列値が格納できること');
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		} finally {
			itemsChanged = false;
			changed = false;
			item = {};
		}

		try {
			item = model.create({
				id: 1,
				str: ''
			});
			strictEqual(item.str, '', '空文字を格納できること');
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		} finally {
			itemsChanged = false;
			changed = false;
			item = {};
		}

		try {
			item = model.create({
				id: 2
			});
			strictEqual(item.str, null, '指定していない場合はnullが格納されていること');
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		} finally {
			itemsChanged = false;
			changed = false;
			item = {};
		}

		try {
			item = model.create({
				id: 2,
				str: null
			});
			strictEqual(item.str, null, 'nullを指定した場合はnullが格納されていること');
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		} finally {
			itemsChanged = false;
			changed = false;
			item = {};
		}

		try {
			item = model.create({
				id: 2,
				str: undefined
			});

			strictEqual(item.str, null, 'undefinedを指定した場合はnullが格納されていること');
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		} finally {
			itemsChanged = false;
			changed = false;
			item = {};
		}

		var noStrs = [0, true, {
			str: "test"
		}, ["test"], /test/, new String('test')];

		var l = noStrs.length;
		expect(l + 2);

		for ( var i = 0; i < l; i++) {
			try {
				model.create({
					id: id++,
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

		try {
			item.str = null;
			ok(false, 'テスト失敗。文字列以外を代入したが、エラーが発生していない');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('type指定 DataModel', 1, function() {
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
			schema: {
				id: {
					id: true,
					type: 'number',
				},
				dataModel1: {
					type: '@NameModel'
				},
				dataModel2: {
					type: '@TestDataModel'
				}
			}
		});

		var manager2 = h5.core.data.createManager('Test2Manager');
		var modelName2 = manager2.createModel(nameDescriptor);

		var item = model.create({
			id: 0,
			str: 'taro'
		});

		strictEqual(item.str, 'taro', 'type:\'string\'のプロパティに文字列値が格納できること');

		var noStrs = [0, true, {
			str: "test"
		}, ["test"], /test/, new String('test')];

		var l = noStrs.length;
		expect(l + 2);

		for ( var i = 0; i < l; i++) {
			try {
				model.create({
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
	// TODO ↑のケースに引き続き、ほかのtype、複合タイプについても書く

	test('enumの指定されているプロパティは、宣言されている値しか格納できないこと', function() {
	// TODO
	});

	test('propertiesの指定されているプロパティは、オブジェクトの中身もチェックされること', function() {
	// TODO
	});

	test('defaultValueの指定されているプロパティに値を指定せずにcreateすると、defaultValueに指定した値が格納されていること', function() {
	// TODO
	});

	test('enhanceの指定されているプロパティは、値をセットしても何もイベントが起きず、値のチェックも行われないこと', function() {
	// TODO
	});

	test('dependの設定されているプロパティに、値はセットできないこと。depend先のアイテムから値が変更されたら、dependを設定しているプロパティの値も変わること', function() {
	// TODO
	});

	module('データモデルの操作', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
		},
		teardonw: function() {
			// マネージャをリセットする
			manager.dropModel('TestManager');
		}
	});

	test('get DataModelオブジェクトからアイテムを取得できること', function() {
	// TODO
	});
	test('remove DataModelオブジェクトからアイテムを削除できること', function() {
	// TODO
	});
	test('query DataModelオブジェクトからクエリでアイテムを操作できること', function() {
	// TODO CRUD操作が可能
	});


	module('イベント', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
		},
		teardonw: function() {
			// マネージャをリセットする
			manager.dropModel('TestManager');
		}
	});

	test('addEventListener itemsChangeイベント', function() {
		var itemsChangeArgs = {};
		var itemsChangeCount = 0;
		function itemsChangeListener(arg) {
			itemsChangeArgs = obj;
			itemsChangeCount++;
		}

		function reset() {
			// ハンドラ実行回数をカウントする変数のリセット
			itemsChangeCount = 0;
			// 引数を格納するオブジェクト変数のリセット
			itemsChangeArgs = {};
		}

		// TODO itemChangeイベントをテストするコードを書く。
		// beginUpdate/endUpdateを使ったテストは、beginUpdate/endUpdateのテストの箇所に書く
		// create([item1,item2,,,,])とした場合は、発火は1回、引数に複数のアイテムが入ってくるので、それはここで確認する
	});

	test('addEventListener changeイベント', function() {
		// addEventListenerに登録するハンドラの定義
		var changeCount = 0;
		var changeCount2 = 0;
		var changeArgs = {};
		var changeArgs2 = {};
		function changeListener(arg) {
			changeArgs = arg;
			changeCount++;
		}
		function changeListener2(arg) {
			changeArgs2 = arg;
			changeCount2++;
		}

		function reset() {
			// ハンドラ実行回数をカウントする変数のリセット
			changeCount = changeCount2 = 0;
			// 引数を格納するオブジェクト変数のリセット
			changeArgs = {};
			changeArgs2 = {};
		}

		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
					type: 'number',
				},
				value: {
					type: 'string'
				}
			}
		});

		var item = model.create({
			id: 0,
			value: 'test'
		});

		ok(!item.hasEventListener('change', changeListener),
				'addEventListenerする前のhasEventListener()はfalseであること');
		item.addEventListener('change', changeListener);
		ok(item.hasEventListener('change', changeListener),
				'addEventListenerした後のhasEventListener()はtrueであること');
		ok(item.hasEventListener('change', changeListener),
				'addEventListenerした後のhasEventListener()はtrueであること');

		item.id = 1;
		strictEqual(changeCount, 1, '値を変更すると、addEventListenerのchangeイベントに登録したハンドラが実行されること');
		// TODO ハンドラの引数のチェックを行う
		reset();

		item.value = 'a';
		strictEqual(changeCount, 1, '値を変更すると、addEventListenerのchangeイベントに登録したハンドラが実行されること');
		reset();

		item.value = 'a';
		strictEqual(changeCount, 0, '同じ値を代入した場合(変更なしの場合)、ハンドラは実行されないこと');
		reset();

		try {
			item.id = "1";
		} finally {
			strictEqual(changeCount, 0, '型指定の異なる値を代入した場合はエラーが発生し、ハンドラは実行されないこと');
		}
		reset();

		var item2 = model.create({
			id: 1,
			value: 'test'
		});
		item2.value = 'a';
		strictEqual(changeCount, 0, 'addEventListenerしていないインスタンスの値を変更しても、ハンドラは実行されないこと');
		reset();

		item.addEventListener('change', changeListener);
		item.value = 'b';
		strictEqual(changeCount, 1, '同じハンドラを再度addEventListenerしても、値変更時に1度だけ実行されること');
		reset();

		item.addEventListener('change', changeListener2);

		item.value = 'c';
		strictEqual(changeCount, 1, 'addEventListenerを2回、異なるハンドラを登録した場合、1つ目のハンドラが実行されること');
		strictEqual(changeCount2, 1, 'addEventListenerを2回、異なるハンドラを登録した場合、2つ目のハンドラが実行されること');
		reset();

		// テスト用に追加したハンドラをremove
		item.removeEventListener('change', changeListener);
		item.removeEventListener('change', changeListener2);
	});

	test('removeEventListener', function() {
	// TODO addEventListenerのテストと切り分け可能か
	});
	test('hasEventListener', function() {
	// TODO addEventListenerのテストと切り分け可能か
	});
	test('beginUpdate/endUpdate', function() {
	//		DataModelのitemsChangeイベントについて仕様詳細化：
	//		・beginUpdate()を呼ぶと、その間の変更はキューに貯められ、
	//		　endUpdate()を呼ぶと変更がまとめて1つのイベントとして発火する
	//
	//		・この時、同じItemが複数変更された場合、
	//		　changed: の中にはそれらの変更はマージされて存在(propsに変更がマージされる)。
	//		　従って、changedの中は、同じインスタンスについての変更は1つしかない。
	//
	//		・change -> change -> remove のようになった場合、
	//		　最終状態に基づいてイベントオブジェクトが作成される。
	//		　上の場合、changed:の中には当該インスタンスについてイベントオブジェクトはなく
	//		　removed: の中にItemインスタンスそのものが入っている。
	//		　　・add -> change -> remove の場合（こんなことあんまりないと思うけど…）
	//		　　　は、added, changed, removedのいずれにも入らない。
	//		　　　# あくまでbegin-endを使った時の話なので
	//		　　　　begin-end中でadd->removeとやった場合に外部に通知する必要は
	//		　　　　ない（ユーザーが意図的にやったのだ）という理解。
	//
	//		・begin -> add -> change -> end の場合は
	//		　added: にのみ入る。
	//		　endで状態が確定した人から見るとあくまで「新規に追加された」インスタンスと捉えればよいから。
	//
	//		・あるPropを a -> b -> c -> a と変更すると
	//		　endのときに c -> a と変更通知が出てしまうので
	//		　最初のchangeのときに値を覚えておいてendのタイミングで最初===最後かどうかをチェックする
	});
});