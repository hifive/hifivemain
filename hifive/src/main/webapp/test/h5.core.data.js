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




	module('type', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
		},
		teardonw: function() {
			// マネージャをリセットする
			manager.dropModel('TestManager');
		}
	});

	// defaultValueに不正な値を指定している場合はcreateModelのテストでチェックしているのでここでは不要
	// 2012/07/27 竹内追記
	// Any/Array 以外 typeに[]を指定可能
	// id:true の場合type指定不可
	// type:object 廃止
	test('type指定 string 正常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'string',
					defaultValue: 'a'
				},
				test2: {
					type: 'string'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 初期値は正しいか
			equal(item.test1, 'a', 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			strictEqual(item.test2, null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: id++,
				test1: 'c'
			});

			equal(item.test1, 'c', 'type:\'string\'のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new String('a'), new Object('i'), "", ''];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: id++,
					test1: sub[i]
				});

				equal(item2.test1, sub[i], 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.test1 = sub[i];

				equal(item2.test1, sub[i], 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 string 異常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'string',
					defaultValue: 'a'
				},
				test2: {
					type: 'string'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, null, undefined, /[0-9]/, new RegExp(), false, new Boolean(1),
					Infinity, -Infinity, new Number(1), NaN, window, {}, new Object(1),
					new Object(['a']), new Array('a'), ['a']];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: id++,
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.test1 = nosub[i];
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 string[] 正常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'string[]',
					defaultValue: ['a']
				},
				test2: {
					type: 'string[]'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 初期値は正しいか
			deepEqual(item.test1, ['a'], 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqual(item.test2, null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: id++,
				test1: ['c', 'z']
			});

			deepEqual(item.test1, ['c', 'z'], 'type:\'string[]\'のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new Array(new String('a'), new String(10)), new Array('x', 'r'),
					new Array('8', '5'), new Object(['i', 'd']), new Object(['3', '4'])];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: id++,
					test1: sub[i]
				});

				equal(item2.test1, sub[i], 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.test1 = sub[i];

				equal(item2.test1, sub[i], 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 string[] 異常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'string[]',
					defaultValue: ['a']
				},
				test2: {
					type: 'string[]'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, null, undefined, /[0-9]/, new RegExp(), 'false', '', Infinity,
					-Infinity, new Number(1), NaN, window, {}, new Object([10, 'v']),
					new Object(['a']), new Array(1, 'a'), [], [undefined, 'a'], function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: id++,
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.test1 = nosub[i];
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 DataModel 正常系', 4, function() {
		var descriptor1 = {
			name: 'DataModel1',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'string'
				}
			}
		};
		var desc1Model = manager.createModel(descriptor1);
		var model1DataItem = desc1Model.create({
			id: 1,
			test1: 'aaa'
		});

		var descriptor2 = {
			name: 'DataModel2',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'number'
				}
			}
		};

		var descModel2 = manager.createModel(descriptor2);
		var model2DataItem = descModel2.create({
			id: 1,
			test1: 20
		});

		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				dataModel1: {
					type: '@DataModel1[]'
				},
				dataModel2: {
					type: '@DataModel2[]'
				}
			}
		});

		// DataItemでcreateできるか
		var item1 = model.create({
			id: 1,
			dataModel1: model1DataItem
		});
		var item2 = model.create({
			id: 2,
			dataModel2: model2DataItem
		});

		equal(item1.dataModel1.test1, 'aaa', 'create時に指定したモデルの値が、DataItemから取得できること。');
		equal(item1.dataModel2, null, 'create時に何も値を指定しない場合、nullが取得できること。');
		equal(item2.dataModel1, null, 'create時に何も値を指定しない場合、nullが取得できること。');
		equal(item2.dataModel2.test1, 20, 'create時に指定したモデルの値が、DataItemから取得できること。');
	});

	test('type指定 DataModel 異常系', 4, function() {
		var descriptor1 = {
			name: 'DataModel1',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'string'
				}
			}
		};
		var desc1Model = manager.createModel(descriptor1);
		var model1DataItem = desc1Model.create({
			id: 1,
			test1: 'aaa'
		});

		var descriptor2 = {
			name: 'DataModel2',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'number'
				}
			}
		};

		var descModel2 = manager.createModel(descriptor2);
		var model2DataItem = descModel2.create({
			id: 1,
			test1: 20
		});

		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				dataModel1: {
					type: '@DataModel1[]'
				},
				dataModel2: {
					type: '@DataModel2[]'
				}
			}
		});

		// DataItemでcreateできるか
		var item1 = model.create({
			id: 1,
			dataModel1: model1DataItem
		});
		var item2 = model.create({
			id: 2,
			dataModel2: model2DataItem
		});

		// 異なる型を指定してcreateするとエラーが発生すること
		raises(function() {
			model.create({
				id: 3,
				dataModel2: model1DataItem
			});
		}, 'type:DataMode1のプロパティに異なる型の値を指定してcreateするとエラーが発生すること。');

		// 異なる型を代入するとエラーが発生すること
		raises(function() {
			item1.dataModel1 = model2DataItem;
		}, 'type:DataMode2のプロパティに異なる型の値を代入するとエラーが発生すること。');
	});

	test('type指定 DataModel[] 正常系', 6, function() {
		var descriptor1 = {
			name: 'DataModel1',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'string'
				}
			}
		};
		var desc1Model = manager.createModel(descriptor1);
		var model1DataItem1 = desc1Model.create({
			id: 1,
			test1: 'aaa'
		});
		var model1DataItem2 = desc1Model.create({
			id: 2,
			test1: 'bbb'
		});

		var descriptor2 = {
			name: 'DataModel2',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'number'
				}
			}
		};

		var descModel2 = manager.createModel(descriptor2);
		var model2DataItem1 = descModel2.create({
			id: 1,
			test1: 20
		});
		var model2DataItem2 = descModel2.create({
			id: 2,
			test1: 30
		});

		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				dataModel1: {
					type: '@DataModel1'
				},
				dataModel2: {
					type: '@DataModel2'
				}
			}
		});

		// DataItemでcreateできるか
		var item1 = model.create({
			id: 1,
			dataModel1: [model1DataItem1, model1DataItem2]
		});
		var item2 = model.create({
			id: 2,
			dataModel2: [model2DataItem1, model2DataItem2]
		});

		equal(item1.dataModel1[0].test1, 'aaa', 'create時に指定したモデルの値が、DataItemから取得できること。');
		equal(item1.dataModel1[1].test1, 'bbb', 'create時に指定したモデルの値が、DataItemから取得できること。');
		equal(item1.dataModel2, null, 'create時に何も値を指定しない場合、nullが取得できること。');
		equal(item2.dataModel2[0].test1, 20, 'create時に指定したモデルの値が、DataItemから取得できること。');
		equal(item2.dataModel2[1].test1, 30, 'create時に指定したモデルの値が、DataItemから取得できること。');
		equal(item2.dataModel1, null, 'create時に何も値を指定しない場合、nullが取得できること。');
	});

	test('type指定 DataModel[] 異常系', 4, function() {
		var descriptor1 = {
			name: 'DataModel1',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'string'
				}
			}
		};
		var desc1Model = manager.createModel(descriptor1);
		var model1DataItem1 = desc1Model.create({
			id: 1,
			test1: 'aaa'
		});
		var model1DataItem2 = desc1Model.create({
			id: 2,
			test1: 'bbb'
		});

		var descriptor2 = {
			name: 'DataModel2',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'number'
				}
			}
		};

		var descModel2 = manager.createModel(descriptor2);
		var model2DataItem1 = descModel2.create({
			id: 1,
			test1: 20
		});

		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				dataModel1: {
					type: '@DataModel1'
				},
				dataModel2: {
					type: '@DataModel2'
				}
			}
		});

		var item1 = model.create({
			id: 1,
			dataModel1: [model1DataItem1, model1DataItem2]
		});

		// 異なる型を指定してcreateするとエラーが発生すること
		raises(function() {
			model.create({
				id: 2,
				dataModel1: [model1DataItem1, model2DataItem1]
			});
		}, 'type:DataMode1のプロパティに異なる型の値を指定してcreateするとエラーが発生すること。');

		// 異なる型を指定してcreateするとエラーが発生すること
		raises(function() {
			model.create({
				id: 2,
				dataModel2: [model1DataItem1, model2DataItem1]
			});
		}, 'type:DataMode1のプロパティに異なる型の値を指定してcreateするとエラーが発生すること。');

		// 異なる型を代入するとエラーが発生すること
		raises(function() {
			item1.dataModel1 = [model1DataItem1, model2DataItem1];
		}, 'type:DataMode2のプロパティに異なる型の値を代入するとエラーが発生すること。');

		// 異なる型を代入するとエラーが発生すること
		raises(function() {
			item1.dataModel2 = [model1DataItem1, model2DataItem1];
		}, 'type:DataMode2のプロパティに異なる型の値を代入するとエラーが発生すること。');
	});


	test('type指定 number 正常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'number',
					defaultValue: 20
				},
				test2: {
					type: 'number'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 初期値は正しいか
			strictEqual(item.test1, 20, 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			strictEqual(item.test2, 0, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: id++,
				test1: 10
			});

			strictEqual(item.test1, 10, 'type:number のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new Number(10), Infinity, -Infinity, NaN, new Object(10.9)];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: id++,
					test1: sub[i]
				});

				deepEqual(item2.test1, sub[i], 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.test1 = sub[i];

				deepEqual(item2.test1, sub[i], 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 number 異常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'number',
					defaultValue: 20
				},
				test2: {
					type: 'number'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [undefined, '', null, undefined, /[0-9]/, new RegExp(), {
				1: 1
			}, '1', [1], new String(1), new Object(1), new Array(), new Boolean(1), window,
					function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: id++,
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.test1 = nosub[i];
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 number[] 正常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'number[]',
					defaultValue: [20]
				},
				test2: {
					type: 'number[]'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 初期値は正しいか
			deepEqual(item.test1, [20], 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			equal(item.test2, null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: id++,
				test1: [30, 10]
			});

			deepEqual(item.test1, [30, 10], 'type:\'number[]\'のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new Array(new Number(10)), new Array(40, 90), new Object([10, 30]),
					[Infinity, -Infinity, NaN], new Array(Infinity, -Infinity, NaN),
					new Object([Infinity, -Infinity, NaN])];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: id++,
					test1: sub[i]
				});

				deepEqual(item2.test1, sub[i], 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.test1 = sub[i];

				deepEqual(item2.test1, sub[i], 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	// 2012/07/27 竹内追記
	// type:number/ type:integer にNaNは代入可
	test('type指定 number[] 異常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'number[]',
					defaultValue: [20]
				},
				test2: {
					type: 'number[]'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			item = model.create({
				id: id++,
				test1: [30, 10]
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, null, undefined, /[0-9]/, new RegExp(), 'false', new String('[10]'),
					'', Infinity, -Infinity, new Number(1), NaN, window, {}, new Object(),
					new Object(['a']), new Array(1, 'a'), [], [undefined, 10], function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: id++,
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.test1 = nosub[i];
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 integer 正常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'integer',
					defaultValue: 50
				},
				test2: {
					type: 'integer'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 初期値は正しいか
			strictEqual(item.test1, 50, 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			strictEqual(item.test2, 0, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: id++,
				test1: 10
			});

			strictEqual(item.test1, 10, 'type:integer のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new Number(10), new Number(10.8), '10', '20.4', new String('56'),
					new String('48.21'), new Object('3a0'), new Object('9a1.9'), new Object('30'),
					new Object('31.9'), new Object(20), new Object(20.3), NaN];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: id++,
					test1: sub[i]
				});

				deepEqual(item2.test1, parseInt(sub[i], 10), 'test1に' + parseInt(sub[i], 10)
						+ 'が代入されてDataItemが生成されること。');

				item2.test1 = sub[i];

				deepEqual(item2.test1, sub[i], 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});


	// 2012/07/27 竹内追記
	// Infinity -Infinity は parseInt()するとNaNになるので、type:integerの場合は代入不可(ただしparseFloat()するとInfinity/-Infinityが返ってくる)
	test('type指定 integer 異常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'integer',
					defaultValue: 50
				},
				test2: {
					type: 'integer'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			item = model.create({
				id: id++,
				test1: 10
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [undefined, '', 'a1', null, undefined, /[0-9]/, new RegExp(), {
				1: 1
			}, '1', [1], new String('a3'), new Object('a2'), new Array(), new Boolean(1), window,
					Infinity, -Infinity, function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: id++,
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.test1 = nosub[i];
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 integer[] 正常系',
			function() {
				var model = manager.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
						},
						test1: {
							type: 'integer[]',
							defaultValue: [50, 15]
						},
						test2: {
							type: 'integer[]'
						}
					}
				});

				try {
					var id = 1;
					var item = model.create({
						id: id++
					});

					// 初期値は正しいか
					deepEqual(item.test1, [50, 15],
							'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
					deepEqual(item.test2, null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

					item = model.create({
						id: id++,
						test1: [10, 30]
					});

					deepEqual(item.test1, [10, 30], 'type:integer[] のプロパティに値が代入できること。');

					// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
					var item2 = null;
					var sub = [[new Number(10), new Number(20)],
							[new Number(10.8), new Number(30.5)], ['10', '20.4'],
							[new String('56'), new String('48.21')],
							[new Object('3a0'), new Object('9a1.9')],
							[new Object('30'), new Object('31.9')],
							[new Object(20), new Object(20.3)], [NaN, NaN],
							new Array(new Number(10), new Number(20)),
							new Array(new Number(10.8), new Number(30.5)), new Array('10', '20.4'),
							new Array(new String('56'), new String('48.21')),
							new Array(new Object('3a0'), new Object('9a1.9')),
							new Array(new Object('30'), new Object('31.9')),
							new Array(new Object(20), new Object(20.3)), new Array(NaN, NaN)];
					for ( var i = 0; i < sub.length; i++) {
						item2 = model.create({
							id: id++,
							test1: sub[i]
						});

						deepEqual(item2.test1, parseInt(sub[i], 10), 'test1に'
								+ parseInt(sub[i], 10) + 'が代入されてDataItemが生成されること。');

						item2.test1 = sub[i];

						deepEqual(item2.test1, sub[i], 'typeプロパティで指定した型の値が代入できること。');
					}
				} catch (e) {
					ok(false, 'エラーが発生しました。『' + e.message + '』');
				}
			});

	test('type指定 integer[] 異常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'integer[]',
					defaultValue: [50, 15]
				},
				test2: {
					type: 'integer[]'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			item = model.create({
				id: id++,
				test1: [10, 30]
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [undefined, 1, '', 'a1', null, undefined, /[0-9]/, new RegExp(), {
				1: 1
			}, '1', new Number(10), new String('a3'), new Object('a2'), new Array(),
					new Boolean(1), window, Infinity, -Infinity, NaN, function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: id++,
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.test1 = nosub[i];
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 boolean 正常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'boolean',
					defaultValue: true
				},
				test2: {
					type: 'boolean'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 初期値は正しいか
			strictEqual(item.test1, true, 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			strictEqual(item.test2, false, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: id++,
				test1: false
			});

			strictEqual(item.test1, false, 'type:boolean のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new Boolean(1), new Boolean(0), new Object(true), new Object(false)];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: id++,
					test1: sub[i]
				});

				equal(item2.test1, sub[i], 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.test1 = sub[i];

				equal(item2.test1, sub[i], 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 boolean 異常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'boolean',
					defaultValue: true
				},
				test2: {
					type: 'boolean'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			item = model.create({
				id: id++,
				test1: false
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [undefined, 1, '', null, undefined, /[0-9]/, new RegExp(), {
				1: 1
			}, 'false', [1], new String('true'), new Object(), new Array(), Infinity, -Infinity,
					new Number(1), NaN, window, function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: id++,
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.test1 = nosub[i];
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 boolean[] 正常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'boolean[]',
					defaultValue: [true, false]
				},
				test2: {
					type: 'boolean[]'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 初期値は正しいか
			deepEqual(item.test1, [true, false],
					'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqual(item.test2, null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: id++,
				test1: [false, true, false]
			});

			deepEqual(item.test1, [false, true, false], 'type:boolean[] のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [[new Boolean(1), new Boolean(0)], new Array(new Boolean(1), new Boolean(0)),
					[new Object(true), new Object(false)],
					new Array(new Object(true), new Object(false))];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: id++,
					test1: sub[i]
				});

				equal(item2.test1, sub[i], 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.test1 = sub[i];

				equal(item2.test1, sub[i], 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 boolean[] 異常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'boolean[]',
					defaultValue: [true, false]
				},
				test2: {
					type: 'boolean[]'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			item = model.create({
				id: id++,
				test1: [false, true, false]
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [undefined, 1, '', null, undefined, /[0-9]/, new RegExp(), {
				1: 1
			}, 'false', [1], new String('true'), new Object(), new Array(), Infinity, -Infinity,
					new Number(1), NaN, window, function() {
						return 10;
					}, ['true', 'false'], [1, 0]];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: id++,
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.test1 = nosub[i];
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});


	// 2012/07/27 竹内追記 type:array[]は無い
	test('type指定 array 正常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'array',
					defaultValue: [10]
				},
				test2: {
					type: 'array'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 初期値は正しいか
			deepEqual(item.test1, [10], 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqual(item.test2, null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: id++,
				test1: [30]
			});

			deepEqual(item.test1, [30], 'type:\'array\'のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new Array(10, 8), new Object(['a'])];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: id++,
					test1: sub[i]
				});

				deepEqual(item2.test1, sub[i], 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.test1 = sub[i];

				deepEqual(item2.test1, sub[i], 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 array 異常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'array',
					defaultValue: [10]
				},
				test2: {
					type: 'array'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			item = model.create({
				id: id++,
				test1: [30]
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [undefined, 1, null, undefined, /[0-9]/, new RegExp(), 'false',
					new String('true'), '', Infinity, -Infinity, new Number(1), NaN, window, {},
					new Object(), function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: id++,
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.test1 = nosub[i];
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	// 2012/07/27 竹内追記 type:any[]は無い
	test('type指定 any', function() {
		var div = document.createElement('div');
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'any',
					defaultValue: div
				},
				test2: {
					type: 'any'
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 初期値は正しいか
			equal(item.test1, div, 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			equal(item.test2, null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			function Test1Obj() {
				this.name = 'test1Obj';
				this.num = 10;
			}

			item = model.create({
				id: id++,
				test1: new Test1Obj()
			});

			deepEqual(item.test1, new Test1Obj(), 'type:\'any\'のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var sub = [1, null, undefined, /[0-9]/, new RegExp(), 'false', new String('true'), '',
					Infinity, -Infinity, new Number(1), NaN, window, new Array(), [1], {},
					new Object(), function() {
						return 10;
					}];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: id++,
					test1: sub[i]
				});

				equal(item2.test1, sub[i], 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.test1 = sub[i];

				equal(item2.test1, sub[i], 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 enum 正常系', function() {
		function TestClass1() {
			this.num = 10;
		}
		var testClass1 = new TestClass1();

		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'enum',
					defaultValue: 10,
					enumValue: ['a', 10, true, testClass1]
				},
				test2: {
					type: 'enum',
					enumValue: ['b', 20, false, testClass1]
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			// 初期値は正しいか
			equal(item.test1, 10, 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			strictEqual(item.test2, 'b', 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: id++,
				test1: testClass1
			});

			deepEqual(item.test1, testClass1, 'type:\'enum\'のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = ['b', 20, false, testClass1];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: id++,
					test2: sub[i]
				});

				deepEqual(item2.test1, sub[i], 'test2に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.test2 = sub[i];

				deepEqual(item2.test2, sub[i], 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 enum 異常系', function() {
		function TestClass1() {
			this.num = 10;
		}
		var testClass1 = new TestClass1();

		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
				},
				test1: {
					type: 'enum',
					defaultValue: 10,
					enumValue: ['a', 10, true, testClass1]
				},
				test2: {
					type: 'enum',
					enumValue: ['b', 20, false, testClass1]
				}
			}
		});

		try {
			var id = 1;
			var item = model.create({
				id: id++
			});

			item = model.create({
				id: id++,
				test1: testClass1
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, false, 'z', null, undefined, /[0-9]/, new RegExp(), 'true',
					new String(10), '', Infinity, -Infinity, new Number(1), NaN, window, {},
					new Object(), new Object(['b']), new Array('a'), ['a'], function() {
						return 'a';
					}, new TestClass1(), new String('a'), new Object('a'), new Number(10),
					new Object(10), new Boolean(1), new Object(true)];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: id++,
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.test1 = nosub[i];
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	// 2012/07/27 竹内追記 仕様が確定するまで取りあえず放置
	test('enhanceの指定されているプロパティは、値をセットしても何もイベントが起きず、値のチェックも行われないこと', function() {
	// TODO
	});

	test('dependの設定されているプロパティに、値はセットできないこと。depend先のアイテムから値が変更されたら、dependを設定しているプロパティの値も変わること',
			function() {
			// TODO
			});

	module('constraint', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
		},
		teardonw: function() {
			// マネージャをリセットする
			manager.dropModel('TestManager');
		}
	});


	//	・nullについて
	//	　・number, integer, boolean は"Nullable"な存在とする。
	//	　　つまり、type:number でnotNull制約がなければ null代入可。
	//	　　（DBと同じようなイメージ）
	//	　　defaultValueが設定されていない場合はnullがデフォルト。
	//	　　デフォルトを設定したい場合はdefaultValueを設定すればよい。
	//	　　notNull制約がついている場合、
	//	　　defaultValueがなく初期生成時にも値を渡さない場合、エラーとする。
	//
	//	・長さ系/patternのチェックは、
	//	　値が入っている場合のみかかる。
	//	　従って、nullがセットされた場合はかからない。
	test('notNull 制約が適用されているか', function() {
	// TODO
	});

	test('notEmpty 制約が適用されているか', function() {
	// TODO
	});

	test('min 制約が適用されているか', function() {
	// TODO
	});

	test('max 制約が適用されているか', function() {
	// TODO
	});

	test('minLength 制約が適用されているか', function() {
	// TODO
	});

	test('maxLength 制約が適用されているか', function() {
	// TODO
	});

	test('pattern 制約が適用されているか', function() {
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
			item.id = '1';
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