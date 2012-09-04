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

	// constraint/イベントのテストで使用
	var dataModel1 = null;
	var dataModel2 = null;
	var testClass1 = null;
	var itemA = null;
	var itemB = null;

	// 各moduleのsetup()で、h5.core.data.createSequence()によって生成されたシーケンスオブジェクトを持つ
	var sequence = null;

	//=============================
	// Variables
	//=============================

	// TODO テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.core.data;
	var ERR_U = ERRCODE.h5.u;

	/**
	 * データモデルマネージャ
	 */
	var manager = {}; // マネージャを新規生成するテスト以外では、setupでmanagerを生成し、teardownでmanager.dropModelを実行すればよい

	//=============================
	// Functions
	//=============================

	/**
	 * 引数に指定されたマネージャが持つモデルを全てdropする
	 */
	function dropAllModel(manager) {
		if (manager && manager.models) {
			for ( var model in manager.models) {
				manager.dropModel(model);
			}
		}
	}

	/**
	 * dataModel1を作成する
	 */
	function createDataModel1() {
		dataModel1 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				val: {},
				val2: {},
				val3: {}
			}
		});
	}

	/**
	 * 引数に指定されたオブジェクト(Any)をschema.valueに指定した時、createModelでエラーが出ることをテストする関数
	 *
	 * @param [Any|Any[]]
	 */
	function testErrorWhenCreateModelByValueProperty(ary, errCode) {
		var invalidProps = wrapInArray(ary);
		var l = invalidProps.length;
		for ( var i = 0; i < l; i++) {
			try {
				manager.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
						},
						value: invalidProps[i]
					}
				});
				var errMsg = JSON ? JSON.stringify(invalidProps[i]) : invalidProps;
				manager.dropModel('TestDataModel');
				ok(false, 'エラーが発生していません。' + errMsg);
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	}

	/**
	 * 引数に渡された配列2つを、順序を無視して比較してテストする
	 */
	function equalsArrayIgnoreOrder(result, exp, msg, deep) {
		if (result.length !== exp.length) {
			// 長さが違うならテストを失敗させてそれ以上チェックしない
			strictEqual('length:' + result.length, 'length:' + exp.length, msg);
			return;
		}
		var i,l;
		while ((l = exp.length) !== 0) {
			var elm = result[0];
			var hasElm = false;
			for (i = 0; i < l; i++) {
				if (deep && QUnit.equiv(elm, exp[i]) || !deep && elm === exp[i]) {
					hasElm = true;
					break;
				}
			}
			if (!hasElm) {
				// resultの中の要素がexpのいずれにもマッチしないなら、テスト失敗
				msg += '結果の配列内の要素が予想した配列内の要素のいずれにもマッチしませんでした';
				ok(false, msg);
				return;
			}
			// result, expから一致した要素を取り除く
			result.splice(0, 1);
			exp.splice(i, 1);
		}
		// ここまでreturnされなかった場合は、配列の中身が一致しているためテスト成功させる
		ok(true, msg);
	}

	/**
	 * ObservalArrayと普通の配列をdeepEqualで比較する
	 */
	function deepEqualObs(ary1, ary2, msg) {
		deepEqual(ary1 && ary1.slice(0), ary2 && ary2.slice(0), msg);
	}

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================

	module('createManager', {
		setup: function() {
			manager = undefined;
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
		},
		teardown: function() {
			sequence = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

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
		var errCode = ERR.ERR_CODE_INVALID_MANAGER_NAME;
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
		var errCode = ERR.ERR_CODE_INVALID_MANAGER_NAME;
		// TODO trimされるのかどうか確認する。$,_がOKなのかどうか確認する
		var invalidStrs = ['', ' ', '.', ',', '1A', ' TestModel', 'Test Model'];
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
		var errCode = ERR_U.ERR_CODE_NAMESPACE_INVALID;
		var invalidNs = [0, 1, true, false, [], {}, '.com.htmlhifive', 'あ', 'com htmlhifive',
				'com.htmlhifive.'];
		var l = invalidNs.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			try {
				manager = h5.core.data.createManager('TestManager', invalidNs[i]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	});

	test('データモデルマネージャの作成 名前空間指定が空文字の場合はwindow直下ににマネージャを作成できること', 1, function() {
		manager = h5.core.data.createManager('TestManager', '');
		ok(manager === window.TestManager, '名前空間指定が空文字の場合はwindow直下ににマネージャを作成できること');
		delete window.TestManager;
	});

	test('データモデルマネージャの作成 名前空間指定のない場合は同名のにマネージャを作成できること', 1, function() {
		manager = h5.core.data.createManager('TestManager');
		var manager2 = h5.core.data.createManager('TestManager');
		ok(manager !== manager2, '同名のマネージャを作成したとき、別インスタンスであること');
	});

	test('データモデルマネージャの作成 指定した名前空間にマネージャ名に指定したプロパティがすでに存在する時にエラーが出ること', 1, function() {
		var errCode = ERR_U.ERR_CODE_NAMESPACE_EXIST;
		h5.u.obj.expose('com.htmlhifive.test', {
			TestModel: 0
		});
		try {
			manager = h5.core.data.createManager('TestModel', 'com.htmlhifive.test');
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
		com.htmlhifive.test.TestModel = undefined;
	});

	//=============================
	// Definition
	//=============================

	module('createModel', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
		},
		teardown: function() {
			sequence = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	test('データモデルの登録', 5, function() {
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
		deepEqual(model.schema, schema, 'モデルにschemaが格納されていること');
		strictEqual(model.idKey, 'empId', 'IDとなるキーが取得できること');
		strictEqual(model.manager, manager, 'データモデルマネージャが取得できること');
		strictEqual(model.size, 0, 'データを格納していないので、sizeが0であること');
	});

	test('登録したデータモデルがmanager.modelsに格納されていること', function() {
		var models = {};
		var l = 3;
		for ( var i = 0; i < l; i++) {
			var name = 'Test' + i;
			models[name] = manager.createModel({
				name: name,
				schema: {
					id: {
						id: true
					}
				}
			});
		}
		var count = 0;
		for ( var prop in manager.models) {
			count++;
			ok(models[prop] === manager.models[prop], '登録したモデルがmanager.modelsの中に格納されていること');
		}
		ok(count === l, '登録したモデルの数だけ格納されていること');
	});


	test(
			'※要目視確認 同名のデータモデルを同じマネージャに登録すると無視されて、戻り値が登録済みのデータモデルであること。ログが出力されること',
			4,
			function() {
				var model1 = manager.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
						},
						val: {
							defaultValue: 1
						}
					}
				});
				var model2 = manager.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
						},
						val: {
							defaultValue: 2
						}
					}
				});
				strictEqual(model2, model1, '同名のデータモデルを登録しようとすると戻り値が登録済みのデータモデルであること');
				ok(
						true,
						'※要目視確認 以下のようなログが出力されていること。『 同じ名前のデータモデルを登録しようとしました。同名のデータモデルの2度目以降の登録は無視されます。マネージャ名は TestManager, 登録しようとしたデータモデル名は TestDataModel です。 』');
				var item = model1.create({
					id: sequence.next()
				});
				strictEqual(item.get('val'), 1, '最初に作成したモデルのスキーマでアイテムが生成されること');
				var manager2 = h5.core.data.createManager('TestManager');
				var model3 = manager2.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
						},
						val: {
							defaultValue: 3
						}
					}
				});
				ok(model3, '別マネージャであれば同名のモデルを登録できること');
			});

	test('データモデルの登録 descriptorがオブジェクトでない場合はエラーが発生すること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var noDescriptors = ["a", 1, null, undefined, true, []];
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
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
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
						id: true
					}
				}
			});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('データモデルの登録 既に存在するnameのデータモデルを登録しようとすると、無視されること', 2, function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				value: {
					defaultValue: 1
				}
			}
		});
		var model2 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				value: {
					defaultValue: 2
				}
			}
		});
		strictEqual(model, model2, '2度目のcreateModelの戻り値が1度目の戻り値と同じインスタンスを返すこと');
		var item = model2.create({
			id: sequence.next()
		});
		strictEqual(item.get('value'), 1, '1度目のcreateModelのスキーマに基づいてアイテムが生成されること');
	});

	//=============================
	// Definition
	//=============================

	module('createModel - schema', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			sequence = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	test('データモデルの登録 descriptorにschemaプロパティがない場合はエラーが発生すること', 1, function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		try {
			manager.createModel({
				name: 'TestDataModel'
			});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test(
			'データモデルの登録 baseにデータモデルが指定されている場合は、指定されたデータモデルのプロパティを継承し、schema指定されたプロパティと同名のものがあれば上書かれていること',
			function() {
				manager.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
						},
						value: {
							defaultValue: 1
						},
						value2: {
							defaultValue: 1
						}
					}
				});
				var model2 = manager.createModel({
					name: 'TestDataModel2',
					base: '@TestDataModel',
					schema: {
						value: {
							defaultValue: 2
						},
						val: {
							defaultValue: 2
						}
					}
				});

				var item = model2.create({
					id: sequence.next()
				});

				strictEqual(item.get('id'), "1", '指定したidでアイテムが生成されていること');
				strictEqual(item.get('value'), 2,
						'同名のプロパティについては、baseを指定している側で設定したdefaultValueが入っていること');
				strictEqual(item.get('value2'), 1, '継承先にしかないプロパティの値を取得できること');
				strictEqual(item.get('val'), 2, 'baseを指定している側にしかないプロパティの値に指定したdefaultValueが入っていること');
			});

	test(
			'データモデルの登録 baseにデータモデルを指定し、schemaに指定したデータモデルと同名のid:trueな属性がある場合は、上書きされてモデルが作成されること',
			function() {
				manager.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
						},
						value: {
							defaultValue: 1
						},
						value2: {
							defaultValue: 1
						}
					}
				});
				var model2 = manager.createModel({
					name: 'TestDataModel2',
					base: '@TestDataModel',
					schema: {
						id: {
							id: true
						},
						value: {
							defaultValue: 2
						},
						val: {
							defaultValue: 2
						}
					}
				});

				var item = model2.create({
					id: sequence.next()
				});

				strictEqual(item.get('id'), '1', '指定したidでアイテムが生成されていること');
				strictEqual(item.get('value'), 2,
						'同名のプロパティについては、baseを指定している側で設定したdefaultValueが入っていること');
				strictEqual(item.get('value2'), 1, '継承先にしかないプロパティの値を取得できること');
				strictEqual(item.get('val'), 2, 'baseを指定している側にしかないプロパティの値に指定したdefaultValueが入っていること');
			});


	test('データモデルの登録 baseに、データモデルを継承しているデータモデルを指定できること', 7, function() {
		manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				value: {
					defaultValue: 1
				},
				value2: {
					defaultValue: 1
				},
				data1: {
					defaultValue: 1
				}
			}
		});
		manager.createModel({
			name: 'TestDataModel2',
			base: '@TestDataModel',
			schema: {
				value: {
					defaultValue: 2
				},
				value3: {
					defaultValue: 2
				},
				data2: {
					defaultValue: 2
				}
			}
		});
		var model3 = manager.createModel({
			name: 'TestDataModel3',
			base: '@TestDataModel2',
			schema: {
				value: {
					defaultValue: 3
				},
				value2: {
					defaultValue: 3
				},
				value3: {
					defaultValue: 3
				},
				data3: {
					defaultValue: 3
				}
			}
		});

		var item = model3.create({
			id: sequence.next()
		});

		strictEqual(item.get('id'), '1', '指定したidでアイテムが生成されていること');
		strictEqual(item.get('value'), 3, '同名のプロパティについては、上書かれていること');
		strictEqual(item.get('value2'), 3, '同名のプロパティについては、上書かれていること');
		strictEqual(item.get('value3'), 3, '同名のプロパティについては、上書かれていること');
		strictEqual(item.get('data1'), 1, '継承先にしかないプロパティの値を取得できること');
		strictEqual(item.get('data2'), 2, '継承先にしかないプロパティの値を取得できること');
		strictEqual(item.get('data3'), 3, '継承先にないデータはそのモデルで指定したdefaultValueの値が格納されていること');
	});


	test('データモデルの登録 baseの指定が文字列でない場合はエラーが発生すること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var noStrs = [['@TestDataModel'], {}, 1, true];
		var l = noStrs.length;
		expect(l);
		manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				value: {
					defaultValue: 1
				},
				value2: {
					defaultValue: 1
				}
			}
		});
		for ( var i = 0; i < l; i++) {
			try {
				manager.createModel({
					name: 'TestDataModel2',
					base: noStrs[i],
					schema: {
						id: {
							id: true
						},
						value: {
							defaultValue: 2
						},
						val: {
							defaultValue: 2
						}
					}
				});
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	});

	test('データモデルの登録 baseを不正な文字列で指定した場合はエラーが発生すること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var invalidStrs = ['TestDataModel', '@TestDataModel, @TestDataModel2'];
		var l = invalidStrs.length;
		expect(l);
		manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				value: {
					defaultValue: 1
				},
				value2: {
					defaultValue: 1
				}
			}
		});
		manager.createModel({
			name: 'TestDataModel2',
			schema: {
				id: {
					id: true
				},
				value: {
					defaultValue: 1
				},
				value2: {
					defaultValue: 1
				}
			}
		});
		for ( var i = 0; i < l; i++) {
			try {
				manager.createModel({
					name: 'TestDataModel3',
					base: invalidStrs[i],
					schema: {
						id: {
							id: true
						},
						value: {
							defaultValue: 2
						},
						val: {
							defaultValue: 2
						}
					}
				});
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	});

	test('データモデルの登録 baseに存在しないデータモデル名を指定した場合はエラーが発生すること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		try {
			manager.createModel({
				name: 'TestDataModel',
				base: '@TestDataModel2',
				schema: {
					id: {
						id: true
					}
				}
			});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('データモデルの登録 baseに自分自身のモデル名を指定した場合はエラーが発生すること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		try {
			manager.createModel({
				name: 'TestDataModel',
				base: '@TestDataModel',
				schema: {
					id: {
						id: true
					}
				}
			});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('データモデルの登録 baseにほかのマネージャのモデルを指定できないこと', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var manager2 = h5.core.data.createManager('TestManager');

		manager2.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				}
			}
		});
		try {
			manager.createModel({
				name: 'TestDataModel2',
				base: '@TestDataModel',
				schema: {
					id: {
						id: true
					}
				}
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
		dropAllModel(manager2);
	});



	test('データモデルの登録 schemaがオブジェクトでない場合はエラーが発生すること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var noObjs = ['a', 1, true];
		var l = noObjs.length;
		expect(l);

		for ( var i = 0; i < l; i++) {
			try {
				manager.createModel({
					name: 'TestDataModel',
					schema: noObjs[i]
				});
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	});

	test('データモデルの登録 schemaのチェック schemaがプロパティを持たないオブジェクト(空オブジェクト)の場合エラーが発生すること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		try {
			manager.createModel({
				name: 'TestDataModel',
				schema: {}
			});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('データモデルの登録 schemaのチェック id指定されているプロパティがない場合・複数ある場合はエラーが出ること', 2, function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		try {
			manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {}
				}
			});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
		try {
			manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true
					},
					val: {
						id: true
					}
				}
			});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('データモデルの登録 schemaのチェック typeに文字列以外を指定した場合はエラーが出ること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var noStrs = [['string'], 1, true, {}];
		var l = noStrs.length;
		expect(l);

		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: noStrs[i]
			}, errCode);
		}
	});

	test('データモデルの登録 schemaのチェック typeに不正な文字列を指定した場合はエラーが出ること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		// TODO 不正になる文字列を確認する
		var invalidStrs = ['string|number', 'string number', 'int', 'num', 'null', 'String',
				'Number', 'Boolean', 'Object', 'Array', 'Null', 'Any', 'undefined'];
		var l = invalidStrs.length;
		expect(l);

		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: invalidStrs[i]
			}, errCode);
		}
	});

	test('データモデルの登録 schemaのチェック enumValueに配列以外を指定した場合はエラーが出ること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var noArrays = ['A', 'A,B', {
			a: {}
		}];
		var l = noArrays.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: noArrays[i]
			}, errCode);
		}
	});

	test('データモデルの登録 schemaのチェック enumValueに空配列(lengthが0の配列)を指定した場合はエラーが出ること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var ary = [];
		ary['a'] = 1;
		var invalidArrays = [[], ary];
		var l = invalidArrays.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: invalidArrays[i]
			}, errCode);
		}
	});

	test('データモデルの登録 schemaのチェック enhanceにboolean以外を指定した場合はエラーが出ること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var invalidValues = [1, 'true', [], {}];
		var l = invalidValues.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: invalidValues[i]
			}, errCode);
		}
	});

	test('データモデルの登録 schemaのチェック dependに不正な値を指定した場合はエラーが出ること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var invalidValues = ['a', true, false, 1, {}, {
			on: ['val2'],
			calc: function() {}
		}, {
			on: ['val1'],
			calc: 1
		}];
		var l = invalidValues.length;
		expect(l);

		for ( var i = 0; i < l; i++) {
			try {
				manager.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
						},
						val: {
							depend: invalidValues[i]
						},
						val1: {
						//
						}
					}
				});
				ok(false, 'エラーが発生していません');
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	});

	test('データモデルの登録 schemaのチェック depend指定のあるプロパティにdefaultValueを設定できないこと', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		try {
			manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true

					},
					val: {
						depend: {
							props: 'id',
							calc: function() {
								return 0;
							},
							defaultValue: 0
						}

					}
				}
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('データモデルの登録 schemaのチェック constraintにオブジェクトでない値を指定した場合はエラーが出ること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var invalidValues = ['notNull', 1, true, false];
		var l = invalidValues.length;
		expect(l);

		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				constraint: invalidValues[i]
			}, errCode);
		}
	});

	test('データモデルの登録 schemaのチェック constraintの各プロパティについて正しく値を指定していない場合はエラーが出ること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var invalidValues = [];
		// type:numberで、constraint.minの値が不正な場合
		var invalidNumMin = ['10', NaN, -Infinity, Infinity, [], {}, true];
		for ( var i = 0, l = invalidNumMin.length; i < l; i++) {
			invalidValues.push({
				type: 'number',
				constraint: {
					min: invalidNumMin[i]
				}
			});
		}

		// type:numberで、constraint.maxの値が不正な場合
		var invalidNumMax = invalidNumMin;
		for ( var i = 0, l = invalidNumMax.length; i < l; i++) {
			invalidValues.push({
				type: 'number',
				constraint: {
					max: invalidNumMax[i]
				}
			});
		}
		// type:integerで、constraint.minの値が不正な場合 (integerの時は小数不可)
		var invalidIntMin = ['10', 5.7, NaN, -Infinity, Infinity, [], {}, true];
		for ( var i = 0, l = invalidIntMin.length; i < l; i++) {
			invalidValues.push({
				type: 'integer',
				constraint: {
					min: invalidIntMin[i]
				}
			});
		}

		// type:integerで、constraint.maxの値が不正な場合 (integerの時は小数不可)
		var invalidIntMax = invalidIntMin;
		for ( var i = 0, l = invalidIntMax.length; i < l; i++) {
			invalidValues.push({
				type: 'integer',
				constraint: {
					max: invalidIntMax[i]
				}
			});
		}

		// constraint.minLengthの値が不正な場合
		var invalidStrMinLength = [-1, 10.1, '10', NaN, -Infinity, Infinity, [], {}, true];
		for ( var i = 0, l = invalidStrMinLength.length; i < l; i++) {
			invalidValues.push({
				type: 'string',
				constraint: {
					minLength: invalidStrMinLength[i]
				}
			});
		}

		// constraint.maxLengthの値が不正な場合
		var invalidStrMaxLength = invalidStrMinLength;
		for ( var i = 0, l = invalidStrMaxLength.length; i < l; i++) {
			invalidValues.push({
				type: 'string',
				constraint: {
					maxLength: invalidStrMaxLength[i]
				}
			});
		}

		// constraint.notNullの値が不正な場合
		var invalidStrNotNull = [0, 'true', [], {}, new Boolean(true)];
		for ( var i = 0, l = invalidStrNotNull.length; i < l; i++) {
			invalidValues.push({
				type: 'string',
				constraint: {
					notNull: invalidStrNotNull[i]
				}
			});
		}

		// constraint.notEmptyの値が不正な場合
		var invalidStrNotEmpty = invalidStrNotNull;
		for ( var i = 0, l = invalidStrNotEmpty.length; i < l; i++) {
			invalidValues.push({
				type: 'string',
				constraint: {
					notEmpty: invalidStrNotEmpty[i]
				}
			});
		}

		// constraint.patternの値が不正な場合
		var invalidStrPattern = [1, 'a', [], {}, true, false];
		for ( var i = 0, l = invalidStrPattern.length; i < l; i++) {
			invalidValues.push({
				type: 'string',
				constraint: {
					pattern: invalidStrPattern[i]
				}
			});
		}

		// constraintの組み合わせで不整合が出る場合
		// notEmptyかつmaxLength:0
		invalidValues.push({
			type: 'string',
			constraint: {
				notEmpty: true,
				maxLength: 0
			}
		});

		// min > max
		invalidValues.push({
			type: 'number',
			constraint: {
				min: 11,
				max: 10
			}
		});

		// minLength > maxLength
		invalidValues.push({
			type: 'string',
			constraint: {
				minLength: 11,
				maxLength: 10
			}
		});

		var l = invalidValues.length;
		expect(l);

		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: invalidValues[i].type,
				constraint: invalidValues[i].constraint
			}, errCode);
		}
	});

	test('データモデルの登録 schemaのチェック constraintの指定とtypeの指定に不整合がある場合はエラーが出ること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var invalidValues = [{
			type: 'string',
			constraint: {
				min: 1
			}
		}, {
			type: 'string',
			constraint: {
				max: 10
			}
		}, {
			type: 'number',
			constraint: {
				notEmpty: true
			}
		}, {
			type: 'number',
			constraint: {
				minLength: 1
			}
		}, {
			type: 'number',
			constraint: {
				maxLength: 10
			}
		}, {
			type: 'number',
			constraint: {
				pattern: /a/
			}
		}, {
			type: 'integer',
			constraint: {
				notEmpty: true
			}
		}, {
			type: 'integer',
			constraint: {
				minLength: 1
			}
		}, {
			type: 'integer',
			constraint: {
				maxLength: 10
			}
		}, {
			type: 'integer',
			constraint: {
				pattern: /a/
			}
		}, {
			type: 'boolean',
			constraint: {
				notEmpty: true
			}
		}, {
			type: 'boolean',
			constraint: {
				min: 1
			}
		}, {
			type: 'boolean',
			constraint: {
				max: 10
			}
		}, {
			type: 'boolean',
			constraint: {
				minLength: 1
			}
		}, {
			type: 'boolean',
			constraint: {
				maxLength: 10
			}
		}, {
			type: 'boolean',
			constraint: {
				pattern: /a/
			}
		}, {
			type: 'object',
			constraint: {
				notEmpty: true
			}
		}, {
			type: 'object',
			constraint: {
				min: 1
			}
		}, {
			type: 'object',
			constraint: {
				max: 10
			}
		}, {
			type: 'object',
			constraint: {
				minLength: 1
			}
		}, {
			type: 'object',
			constraint: {
				maxLength: 10
			}
		}, {
			type: 'object',
			constraint: {
				pattern: /a/
			}
		}, {
			type: 'array',
			constraint: {
				notEmpty: true
			}
		}, {
			type: 'array',
			constraint: {
				min: 1
			}
		}, {
			type: 'array',
			constraint: {
				max: 10
			}
		}, {
			type: 'array',
			constraint: {
				minLength: 1
			}
		}, {
			type: 'array',
			constraint: {
				maxLength: 10
			}
		}, {
			type: 'array',
			constraint: {
				pattern: /a/
			}
		}, {
			type: 'any',
			constraint: {
				notEmpty: true
			}
		}, {
			type: 'any',
			constraint: {
				min: 1
			}
		}, {
			type: 'any',
			constraint: {
				max: 10
			}
		}, {
			type: 'any',
			constraint: {
				minLength: 1
			}
		}, {
			type: 'any',
			constraint: {
				maxLength: 10
			}
		}, {
			type: 'any',
			constraint: {
				pattern: /a/
			}
		}, {
			type: '@ParentModel',
			constraint: {
				notEmpty: true
			}
		}, {
			type: '@ParentModel',
			constraint: {
				min: 1
			}
		}, {
			type: '@ParentModel',
			constraint: {
				max: 10
			}
		}, {
			type: '@ParentModel',
			constraint: {
				minLength: 1
			}
		}, {
			type: '@ParentModel',
			constraint: {
				maxLength: 10
			}
		}, {
			type: '@ParentModel',
			constraint: {
				pattern: /a/
			}
		}];

		var l = invalidValues.length;

		// typeを配列にしたものを追加する(anyとarray以外)
		for ( var i = 0; i < l; i++) {
			var obj = invalidValues[i];
			if (obj.type !== 'any' && obj.type !== 'array') {
				invalidValues.push({
					type: obj.type + '[]',
					constraint: obj.constraint
				});
			}
		}
		l = invalidValues.length;
		var testCount = l;

		manager.createModel({
			name: 'ParentModel',
			schema: {
				id: {
					id: true
				}
			}
		});

		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: invalidValues[i].type,
				constraint: invalidValues[i].constraint
			}, errCode);
		}

		// type:enumの場合について
		invalidValues = [{
			type: 'enum',
			constraint: {
				notEmpty: true
			}
		}, {
			type: 'enum',
			constraint: {
				min: 1
			}
		}, {
			type: 'enum',
			constraint: {
				max: 10
			}
		}, {
			type: 'enum',
			constraint: {
				minLength: 1
			}
		}, {
			type: 'enum',
			constraint: {
				maxLength: 10
			}
		}, {
			type: 'enum',
			constraint: {
				pattern: /a/
			}
		}];
		// typeを配列にしたものを追加する
		l = invalidValues.length;
		for ( var i = 0; i < l; i++) {
			var obj = invalidValues[i];
			invalidValues.push({
				type: obj.type + '[]',
				constraint: obj.constraint
			});
		}
		l = invalidValues.length;
		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: invalidValues[i].type,
				enum: [1, 'a', 1.1],
				constraint: invalidValues[i].constraint
			}, errCode);
		}
		testCount += l;
		expect(testCount);
	});

	test('データモデルの登録 schemaのチェック id:trueの項目にtype:"string" または "integer"以外を指定するとエラーになること',
			function() {
				var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
				var invalidIdTypes = ['number', 'boolean', 'array', 'any', '@ParentModel',
						'string[]', 'integer[]'];
				var l = invalidIdTypes.length;
				expect(l);

				manager.createModel({
					name: 'ParentModel',
					schema: {
						id: {
							id: true
						}
					}
				});
				for ( var i = 0; i < l; i++) {
					try {
						manager.createModel({
							name: 'TestDataModel',
							schema: {
								id: {
									id: true,
									type: invalidIdTypes[i]
								}
							}
						});
						ok(false, 'エラーが発生していません');
					} catch (e) {
						strictEqual(e.code, errCode, e.message);
					}
				}
			});

	test('データモデルの登録 schemaのチェック id:trueの項目にnotNull:false, notEmpty:false, maxLength:0 を指定できないこと',
			function() {
				var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
				var invalidConstraint = [{
					notNull: false
				}, {
					notEmpty: false
				}, {
					maxLength: 0
				}];
				var l = invalidConstraint.length;
				for ( var i = 0; i < l; i++) {
					try {
						manager.createModel({
							name: 'TestDataModel',
							schema: {
								id: {
									id: true,
									constraint: invalidConstraint[i]
								}
							}
						});
						ok(false, 'エラーが発生していません');
					} catch (e) {
						strictEqual(e.code, errCode, e.message);
					}
				}
			});

	test('データモデルの登録 schemaのチェック id:trueの項目にdefaultValueが設定されている場合はエラーになること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		try {
			manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true,
						defaultValue: '12345'
					}
				}
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('データモデルの登録 schemaのチェック defaultValueがtypeの条件を満たしている場合、データモデルが生成できること', 1, function() {
		var model1 = manager.createModel({
			name: 'TestDataModelA',
			schema: {
				id: {
					id: true
				},
				val: {
					type: 'string',
					defaultValue: 'hoge'
				}
			}
		});

		var item1 = model1.create({
			id: sequence.next()
		});

		var item2 = model1.create({
			id: sequence.next()
		});

		try {
			manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true
					},
					testS1: {
						type: 'string',
						defaultValue: 'aaa'
					},
					testS2: {
						type: 'string',
						defaultValue: new String('aaa')
					},
					testS3: {
						type: 'string',
						defaultValue: new Object('aaa')
					},
					testB1: {
						type: 'boolean',
						defaultValue: true
					},
					testB2: {
						type: 'boolean',
						defaultValue: new Boolean(1)
					},
					testB3: {
						type: 'boolean',
						defaultValue: new Object(true)
					},
					testA1: {
						type: 'array',
						defaultValue: [10, 20]
					},
					testA2: {
						type: 'array',
						defaultValue: new Array(10, 20)
					},
					testA3: {
						type: 'array',
						defaultValue: new Object([10, 20])
					},
					testI1: {
						type: 'integer',
						defaultValue: 10
					},
					testI2: {
						type: 'integer',
						defaultValue: '10'
					},
					testI3: {
						type: 'integer',
						defaultValue: new Number('10')
					},
					testI4: {
						type: 'integer',
						defaultValue: new Object('10')
					},
					testI5: {
						type: 'integer',
						defaultValue: new String(10)
					},
					testN1: {
						type: 'number',
						defaultValue: 20
					},
					testN2: {
						type: 'number',
						defaultValue: 20.1
					},
					testN3: {
						type: 'number',
						defaultValue: '20'
					},
					testN4: {
						type: 'number',
						defaultValue: new Number('20')
					},
					testN5: {
						type: 'number',
						defaultValue: new Object('20')
					},
					testN6: {
						type: 'number',
						defaultValue: new String(20)
					},
					testN7: {
						type: 'number',
						defaultValue: '30.1'
					},
					testN8: {
						type: 'number',
						defaultValue: new Number('30.1')
					},
					testN9: {
						type: 'number',
						defaultValue: new Object('30.1')
					},
					testN10: {
						type: 'number',
						defaultValue: new String('30.1')
					},
					testEnum1: {
						type: 'enum',
						defaultValue: 2,
						enumValue: [1, 2, 3]
					},
					testEnum2: {
						type: 'enum',
						defaultValue: window,
						enumValue: [window]
					},
					testEnum2: {
						type: 'enum',
						defaultValue: NaN,
						enumValue: [Infinity, NaN, -Infinity]
					},
					testAny1: {
						type: 'any',
						defaultValue: 1
					},
					testAny2: {
						type: 'any',
						defaultValue: new Number(10)
					},
					testAny3: {
						type: 'any',
						defaultValue: new Object(10)
					},
					testAny4: {
						type: 'any',
						defaultValue: 10.7
					},
					testAny5: {
						type: 'any',
						defaultValue: new Number(10.7)
					},
					testAny6: {
						type: 'any',
						defaultValue: new Object(10.7)
					},
					testAny7: {
						type: 'any',
						defaultValue: 'A'
					},
					testAny8: {
						type: 'any',
						defaultValue: new String('A')
					},
					testAny9: {
						type: 'any',
						defaultValue: new Object('A')
					},
					testAny10: {
						type: 'any',
						defaultValue: [10, 20]
					},
					testAny11: {
						type: 'any',
						defaultValue: new Array(10, 20)
					},
					testAny12: {
						type: 'any',
						defaultValue: new Object([10, 20])
					},
					testAny13: {
						type: 'any',
						defaultValue: item1
					},
					testDI1: {
						type: '@TestDataModelA',
						defaultValue: item1
					},
					testSA1: {
						type: 'string[]',
						defaultValue: ['aaa', new String('aaa'), new Object('aaa')]
					},
					testSA2: {
						type: 'string[]',
						defaultValue: new Array('aaa', new String('aaa'), new Object('aaa'))
					},
					testSA3: {
						type: 'string[]',
						defaultValue: new Object(['aaa', new String('aaa'), new Object('aaa')])
					},
					testBA1: {
						type: 'boolean[]',
						defaultValue: [true, new Boolean(1), new Object(true)]
					},
					testBA2: {
						type: 'boolean[]',
						defaultValue: new Array(true, new Boolean(1), new Object(true))
					},
					testBA3: {
						type: 'boolean[]',
						defaultValue: new Object([true, new Boolean(1), new Object(true)])
					},
					testIA1: {
						type: 'integer[]',
						defaultValue: [10, '10', new String(10), new Object(10)]
					},
					testIA2: {
						type: 'integer[]',
						defaultValue: new Array(10, '10', new String(10), new Object(10))
					},
					testIA3: {
						type: 'integer[]',
						defaultValue: new Object([10, '10', new String(10), new Object(10)])
					},
					testNA1: {
						type: 'number[]',
						defaultValue: [10, '10', 10.1, '10.1', new String('10'), new Object('10'),
								new String('10.1'), new Object('10.1')]
					},
					testNA2: {
						type: 'number[]',
						defaultValue: new Array(10, '10', 10.1, '10.1', new String('10'),
								new Object('10'), new String('10.1'), new Object('10.1'))
					},
					testNA3: {
						type: 'number[]',
						defaultValue: new Object([10, '10', 10.1, '10.1', new String('10'),
								new Object('10'), new String('10.1'), new Object('10.1')])
					},
					testDIA1: {
						type: '@TestDataModelA[]',
						defaultValue: [item1, item2]
					},
					testDIA2: {
						type: '@TestDataModelA[]',
						defaultValue: new Array(item1, item2)
					},
					testDIA3: {
						type: '@TestDataModelA[]',
						defaultValue: new Object([item1, item2])
					},
					testEnumA1: {
						type: 'enum[]',
						defaultValue: [10, 20, '10'],
						enumValue: ['10', 10, 20]
					}
				}
			});
			ok(true, 'DataModelが作成できること。');
		} catch (e) {
			ok(false, 'テスト失敗');
		}
	});

	test('データモデルの登録 schemaのチェック defaultValueがtypeに指定されている型を満たさない場合はエラーになること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		// @ParentModelのテスト用にモデルを2つのマネージャで作成する
		var manager2 = h5.core.data.createManager('TestDataModel');
		var parentModelDesc = {
			name: 'ParentModel',
			schema: {
				id: {
					id: true
				}
			}
		};
		var parentModel1 = manager.createModel(parentModelDesc);
		var parentModel2 = manager2.createModel(parentModelDesc);
		var parentModelItem = parentModel1.create({
			id: sequence.next()
		});
		var parentModelItem2 = parentModel2.create({
			id: sequence.next()
		});

		var types = ['string', 'number', 'integer', 'boolean', 'array', '@ParentModel', 'string[]',
				'number[]', 'integer[]', 'boolean[]', '@ParentModel[]', 'string[][]'];
		var invalidValueArrays = [];
		// stringでないもの
		invalidValueArrays.push([1, true, ["a"], {}]);
		// numberでないもの
		invalidValueArrays.push(['a1', true, [1], {}]);
		// integerでないもの
		invalidValueArrays.push([1.1, Infinity, -Infinity, '1.1', '1px', true, [1], {}]);
		// booleanでないもの
		invalidValueArrays.push([1, '1', [true], {}]);
		// arrayでないもの
		invalidValueArrays.push([1, "1", {}]);
		// 同じマネージャのデータモデル@ParentModelでないもの
		invalidValueArrays.push([1, "1", {
			id: sequence.next()
		}, parentModelItem2, [parentModelItem]]);
		// string[]でないもの
		invalidValueArrays.push(["a", ["a", "b", 1], [["a"]]]);
		// number[]でないもの
		invalidValueArrays.push([1, [1, 2, [1]], [[1]]]);
		// integer[]でないもの
		invalidValueArrays.push([1, [1, 2, 1.1, [1]], [[1]]]);
		// boolean[]でないもの
		invalidValueArrays.push([[true, false, 'true'], true, [[true, false]]]);
		// @ParentModel[]でないもの
		invalidValueArrays.push([parentModelItem, [parentModelItem2], [[parentModelItem]]]);
		// string[][]でないもの
		invalidValueArrays.push(["a", ["a"], [["a", "b", 1]], [[["a"]]]]);

		var invalidProps = [];
		for ( var i = 0, typesLen = types.length; i < typesLen; i++) {
			var type = types[i];
			for ( var j = 0, valueArrayLen = invalidValueArrays[i].length; j < valueArrayLen; j++) {
				var defaultValue = invalidValueArrays[i][j];
				invalidProps.push({
					type: type,
					defaultValue: defaultValue
				});
			}
		}

		testErrorWhenCreateModelByValueProperty(invalidProps, errCode);

		// enum, enum[], enum[][]の場合
		var invalidEnumValues = [{
			type: 'enum',
			enum: [1, 2, 3],
			defaultValue: 4
		}, {
			type: 'enum',
			enum: [1, 2, 3],
			defaultValue: '1'
		}, {
			type: 'enum',
			enum: [{}, 1, 2],
			defaultValue: {}
		}, {
			type: 'enum',
			enum: [[], 1, 2],
			defaultValue: []
		}, {
			type: 'enum[]',
			enum: [1, 2, 3],
			defaultValue: 1
		}, {
			type: 'enum[]',
			enum: [1, 2, 3],
			defaultValue: [2, 3, 4]
		}, {
			type: 'enum[]',
			enum: [1, 2, 3],
			defaultValue: [[1]]
		}, {
			type: 'enum[][]',
			enum: [1, 2, 3],
			defaultValue: [1]
		}];
		testErrorWhenCreateModelByValueProperty(invalidEnumValues, errCode);
		dropAllModel(manager2);
	});

	test('データモデルの登録 schemaのチェック defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること number',
			function() {
				var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
				var type = 'number';
				var invalidProps = [{
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: null
				}, {
					type: type,
					constraint: {
						min: -1.11
					},
					defaultValue: -1.111
				}, {
					type: type,
					constraint: {
						max: 3.33
					},
					defaultValue: 3.333
				}];

				testErrorWhenCreateModelByValueProperty(invalidProps, errCode);
			});

	test('データモデルの登録 schemaのチェック defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること string',
			function() {
				var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
				var type = 'string';
				var invalidProps = [{
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: null
				}, {
					type: type,
					constraint: {
						notEmpty: true
					},
					defaultValue: ''
				}, {
					type: type,
					constraint: {
						minLength: 2
					},
					defaultValue: 'a'
				}, {
					type: type,
					constraint: {
						maxLength: 4
					},
					defaultValue: 'abcde'
				}, {
					type: type,
					constraint: {
						pattern: /^s/
					},
					defaultValue: 'S123456'
				}];

				testErrorWhenCreateModelByValueProperty(invalidProps, errCode);
			});


	test('データモデルの登録 schemaのチェック defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること integer',
			function() {
				var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
				var type = 'integer';
				var invalidProps = [{
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: null
				}, {
					type: type,
					constraint: {
						min: 2
					},
					defaultValue: 1
				}, {
					type: type,
					constraint: {
						max: 4
					},
					defaultValue: 5
				}];

				testErrorWhenCreateModelByValueProperty(invalidProps, errCode);
			});


	test('データモデルの登録 schemaのチェック defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること boolean',
			function() {
				var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
				var type = 'boolean';
				var invalidProps = [{
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: null
				}];

				testErrorWhenCreateModelByValueProperty(invalidProps, errCode);
			});

	test('データモデルの登録 schemaのチェック defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること array',
			function() {
				var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
				var type = 'array';
				var invalidProps = [{
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: null
				}, {
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: undefined
				}];

				testErrorWhenCreateModelByValueProperty(invalidProps, errCode);
			});

	test('データモデルの登録 schemaのチェック defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること any',
			function() {
				var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
				var type = 'any';
				var invalidProps = [{
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: null
				}];

				testErrorWhenCreateModelByValueProperty(invalidProps, errCode);
			});
	test('データモデルの登録 schemaのチェック defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること @DataModelName',
			function() {
				var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
				var type = '@ParentModel';
				var invalidProps = [{
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: null
				}];

				// ParentModelの作成
				manager.createModel({
					name: 'ParentModel',
					schema: {
						id: {
							id: true
						}
					}
				});

				testErrorWhenCreateModelByValueProperty(invalidProps, errCode);
			});
	test('データモデルの登録 schemaのチェック defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること string[]',
			function() {
				var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
				var type = 'string[]';
				var invalidProps = [{
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: [null]
				}, {
					type: type,
					constraint: {
						notEmpty: true
					},
					defaultValue: [null]
				}, {
					type: type,
					constraint: {
						notEmpty: true
					},
					defaultValue: ['']
				}, {
					type: type,
					constraint: {
						minLength: 3
					},
					defaultValue: ["abc", "ab"]
				}, {
					type: type,
					constraint: {
						maxLength: 3
					},
					defaultValue: ["abc", "ab", "abcd"]
				}, {
					type: type,
					constraint: {
						pattern: /a/
					},
					defaultValue: ["abc", "ab", "bcd"]
				}];

				testErrorWhenCreateModelByValueProperty(invalidProps, errCode);
			});
	test('データモデルの登録 schemaのチェック defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること string[][]',
			function() {
				var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
				var type = 'string[]';
				var invalidProps = [{
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: [["a", "b"], [null]]
				}, {
					type: type,
					constraint: {
						notEmpty: true
					},
					defaultValue: [["a", "b"], [null]]
				}, {
					type: type,
					constraint: {
						notEmpty: true
					},
					defaultValue: [["a", "b"]['']]
				}, {
					type: type,
					constraint: {
						minLength: 3
					},
					defaultValue: [["abc", "abc"], ["abc", "ab"]]
				}, {
					type: type,
					constraint: {
						maxLength: 3
					},
					defaultValue: [["abc", "abc"], ["abcd", "abc", "abc"]]
				}, {
					type: type,
					constraint: {
						pattern: /a/
					},
					defaultValue: [["abc", "abc"], ["abcd", "bc", "abc"]]
				}];

				testErrorWhenCreateModelByValueProperty(invalidProps, errCode);
			});

	test('データモデルの登録 schemaのチェック descriptorと、schemaのプロパティ定義に無関係なプロパティが含まれていても、エラーにならないこと。', 1,
			function() {
				var model = manager.createModel({
					name: 'TestDataModel',
					__name: 'TestDataModel(関係ないプロパティ)',
					title: '関係ないプロパティ',
					description: '関係ないプロパティ',
					schema: {
						id: {
							id: true,
							title: '関係ないプロパティ',
							description: '関係ないプロパティ'
						},
						value: {
							dummyProp1: '関係ないプロパティ',
							dummyProp2: {
								description: '関係ないプロパティ'
							},
						}
					}
				});
				ok(model);
			});

	//=============================
	// Definition
	//=============================

	module('dropModel', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			sequence = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	test('データモデルのドロップ', 10,
			function() {
				var model1 = manager.createModel({
					name: 'TestDataModel1',
					schema: {
						id: {
							id: true
						},
						val: {}
					}
				});
				var model2 = manager.createModel({
					name: 'TestDataModel2',
					schema: {
						id: {
							id: true
						},
						val: {}
					}
				});
				model1.create({
					id: sequence.next(),
					val: 1
				});
				model2.create({
					id: sequence.next(),
					val: 2
				});

				strictEqual(manager.models.TestDataModel1, model1,
						'ドロップする前は作成したモデル1がmanager.modelsの中に入っていること');
				strictEqual(manager.models.TestDataModel2, model2,
						'ドロップする前は作成したモデル2がmanager.modelsの中に入っていること');
				var model1 = manager.dropModel('TestDataModel1');
				strictEqual(manager.models.TestDataModel1, undefined,
						'モデル1だけをドロップした後、モデル1がmanager.modelsの中に入っていないこと');
				strictEqual(manager.models.TestDataModel2, model2,
						'モデル1だけをドロップした後、モデル2がmanager.modelsの中に入っていること');
				strictEqual(model1.name, 'TestDataModel1',
						'dropModelの戻り値はドロップしたデータモデルオブジェクトであり、名前が取得できること');
				strictEqual(model1.manager, null, 'dropModelの戻り値のmanagerプロパティはnullであること');
				strictEqual(model1.size, 1, 'dropModelの戻り値はドロップ前にcreateしたアイテムを持っており、サイズを取得できること');
				strictEqual(model1.items['1'].get('val'), 1,
						'dropModelの戻り値はドロップ前にcreateしたアイテムを持っており、値を取得できること');
				manager.dropModel('TestDataModel2');
				strictEqual(manager.models.TestDataModel2, undefined,
						'モデル2をドロップした後、モデル2がmanager.modelsの中に入っていないこと');
				deepEqual(manager.models, {}, '全てのモデルをドロップしたので、manager.modelsは空オブジェクトであること');
			});

	//=============================
	// Definition
	//=============================

	module('create, get, remove', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			createDataModel1();
		},
		teardown: function() {
			sequence = null;
			dataModel1 = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	test('createでアイテムが生成できること。引数に配列を渡した場合は戻り値も配列になること。', function() {
		var item = dataModel1.create({
			id: sequence.next(),
			val: 456
		});

		strictEqual(item.get('id'), '1', 'create時に指定した値が戻り値から取得できること');
		strictEqual(item.get('val'), 456, 'create時に指定した値が戻り値から取得できること');

		item = dataModel1.create({
			id: sequence.next()
		});

		strictEqual(item.get('id'), '2', 'createでidに数字を指定しても、文字列として格納されていること');
		strictEqual(item.get('val'), null, 'create時に値を指定していない値について、nullが格納されてること');

		var items = dataModel1.create([{
			id: '3'
		}, {
			id: '4'
		}, {
			id: '5'
		}]);

		strictEqual(items.length, 3, 'createの引数に配列を渡すと、戻り値がアイテムの配列として返ってくること');
		strictEqual(items[0].get('id'), '3', '戻り値の配列の中身が正しいこと');
		strictEqual(items[1].get('id'), '4', '戻り値の配列の中身が正しいこと');
		strictEqual(items[2].get('id'), '5', '戻り値の配列の中身が正しいこと');
	});

	test('idの重複するオブジェクトを登録すると、後から登録したもので上書かれること', 8, function() {
		var item = dataModel1.create({
			id: '1',
			val: 1,
			val2: 2
		});
		var item2 = dataModel1.create({
			id: '1',
			val2: 22,
			val3: 33
		});

		strictEqual(item, item2, '同一のidを指定してcreateをした時、戻り値は同じインスタンスであること');
		strictEqual(item.get('val'), 1, '上書かれていないプロパティを取得できること');
		strictEqual(item.get('val2'), 22, '上書いたプロパティを取得できること');
		strictEqual(item.get('val3'), 33, '上書いたプロパティを取得できること');

		var items = dataModel1.create([{
			id: '2',
			val: 1,
			val2: 2
		}, {
			id: '2',
			val2: 22,
			val2: 33
		}]);

		strictEqual(items[0], items[1], '同じid要素を持つオブジェクトを配列で渡した時、戻り値は同じインスタンスであること');
		strictEqual(items[0].get('val'), 1, '上書かれていないプロパティを取得できること');
		strictEqual(items[0].get('val2'), 22, '上書いたプロパティを取得できること');
		strictEqual(items[0].get('val3'), 33, '上書いたプロパティを取得できること');
	});

	test('createに配列を渡して、その要素のいずれかが原因でエラーが起きた場合、エラーが起きるまでの要素までは生成され、残りは生成されないこと', function() {
		// TODO アトミックかどうか確認する
		try {
			dataModel1.create([{
				id: sequence.next()
			}, {
				id: {}
			}, {
				id: sequence.next()
			}]);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_NO_ID, e.message);
		} finally {
			// 配列で渡した場合、一つでもエラーが発生したら、配列中の要素全てをアイテム化しない(TODO 確認する)
			ok(dataModel1.has('1'), '配列で渡した場合にエラーが発生したら、その要素より前のアイテムは生成されること');
			ok(!dataModel1.has('2'), '配列で渡した場合にエラーが発生したら、その要素以降のアイテムは生成されないこと');
			strictEqual(dataModel1.size, 1, 'sizeが1であること');
		}
	});

	//=============================
	// Body
	//=============================

	test('getでアイテムが取得できること。引数に配列を指定した場合は戻り値も配列になること。', function() {
		var item1 = dataModel1.create({
			id: sequence.next(),
			val: 'item1'
		});
		var item2 = dataModel1.create({
			id: sequence.next(),
			val: 'item2'
		});
		var item3 = dataModel1.create({
			id: sequence.next(),
			val: 'item3'
		});

		strictEqual(dataModel1.get('1'), item1, '登録したアイテムが取得できること');
		strictEqual(dataModel1.get('2'), item2, '登録したアイテムが取得できること');
		strictEqual(dataModel1.get('3'), item3, '登録したアイテムが取得できること');
		strictEqual(dataModel1.get('abc'), null, '登録されていないidを渡すとnullが返ってくること');
		strictEqual(dataModel1.get('4'), null, '違うモデルに登録したアイテムは取得できないこと。');
		var items = dataModel1.get(['2', '4', '1', '3', 'noExistId']);
		deepEqual(items, [item2, null, item1, item3, null],
				'getに配列を渡した時の戻り値は各要素のget結果が格納された配列であること');
		strictEqual(dataModel1.get('1').get('val'), 'item1', '登録したアイテムが、渡したidの順に取得できること');
		strictEqual(dataModel1.get('2').get('val'), 'item2', '登録したアイテムが取得できること');
		strictEqual(dataModel1.get('3').get('val'), 'item3', '登録したアイテムが取得できること');

	});

	test('removeでアイテムを削除できること。引数に配列を指定した場合は複数削除できること', function() {
		var item1 = dataModel1.create({
			id: sequence.next(),
			val: 1
		});
		var item2 = dataModel1.create({
			id: sequence.next(),
			val: 2
		});
		var item3 = dataModel1.create({
			id: sequence.next(),
			val: 3
		});
		strictEqual(dataModel1.has('1'), true, '削除する前はmodel.hasの結果がtrueであること');
		strictEqual(dataModel1.has('2'), true, '削除する前はmodel.hasの結果がtrueであること');
		strictEqual(dataModel1.has('3'), true, '削除する前はmodel.hasの結果がtrueであること');

		var item = dataModel1.remove('1');
		strictEqual(item, item1, 'removeの戻り値はDataItemインスタンスであること');

		strictEqual(dataModel1.get('1'), null, '削除したアイテムのidでgetすると戻り値がnullであること');
		strictEqual(dataModel1.has('1'), false, 'model.hasの結果がfalseになっていること');
		strictEqual(dataModel1.size, 2, 'model.sizeが1減っていること');

		item = dataModel1.remove('noExistId');
		strictEqual(item, null, '存在しないIDをremoveした時の戻り値はnullであること');

		var items = dataModel1.remove(['2', 'noExistId', '3']);

		// removeの戻り値を確認する
		deepEqual(items, [item2, null, item3], 'removeに配列を渡した時の戻り値は各要素のremove結果が格納された配列であること');

		// アイテムが削除されていることを確認する
		strictEqual(dataModel1.get('2'), null, '削除したアイテムのidでgetすると戻り値がnullであること');
		strictEqual(dataModel1.has('2'), false, 'model.hasの結果がfalseになっていること');
		strictEqual(dataModel1.get('3'), null, '削除したアイテムのidでgetすると戻り値がnullであること');
		strictEqual(dataModel1.has('3'), false, 'model.hasの結果がfalseになっていること');
		strictEqual(dataModel1.size, 0, 'すべて削除したので、model.sizeが0になっていること');
	});

	//=============================
	// Definition
	//=============================

	module('type', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			sequence = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	// 2012/07/27 竹内追記
	// Any/Array 以外 typeに[]を指定可能
	// id:true の場合type指定不可
	// type:object 廃止
	// 2012/08/07 竹内追記
	// 08/06 15:04
	//	（id属性メモ）
	//	・id: true
	//	　・自動生成は、サーバーサイド、ローカルストレージとの整合を詰める必要があるのでver.1.1.0ではやめておく
	//	　　　・指定するときは： id: 'auto' みたいな感じになるだろう
	//
	//	・id: trueの場合、 type: はintegerまたはstring
	//	　　・デフォルト（type省略時）は string
	//	　　・stringの場合：notEmpty : true 扱い
	//	　　・integerの場合: notNull: true 扱い
	//	　　・それぞれ、矛盾するconstraintが与えられたらvalidationエラーとする

	// 2012/08/23 福田追記
	// 型変換のテストは別でやっているので、代入後またはcreate後の値はここではチェックしない
	test('type指定 string 正常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
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
			var item = model.create({
				id: sequence.next()
			});

			// 初期値は正しいか
			equal(item.get('test1'), 'a', 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			strictEqual(item.get('test2'), null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: 'c'
			});

			equal(item.get('test1'), 'c', 'type:\'string\'のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new String('a'), new Object('i'), "", '', null, undefined];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: sequence.next(),
					test1: sub[i]
				});

				ok(true, 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.set('test1', sub[i]);

				ok(true, 'typeプロパティで指定した型の値が代入できること。');
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
					id: true
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
			var item = model.create({
				id: sequence.next()
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, /[0-9]/, new RegExp(), false, new Boolean(1), Infinity, -Infinity,
					new Number(1), NaN, window, {}, new Object(1), new Object(['a']),
					new Array('a'), ['a']];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: sequence.next(),
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.set('test1', nosub[i]);
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 string[] 正常系',
			function() {
				var model = manager.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
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
					var item = model.create({
						id: sequence.next()
					});

					// 初期値は正しいか
					deepEqualObs(item.test1, ['a'],
							'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
					deepEqualObs(item.test2, [], 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

					item = model.create({
						id: sequence.next(),
						test1: ['c', 'z']
					});

					deepEqualObs(item.test1, ['c', 'z'], 'type:\'string[]\'のプロパティに値が代入できること。');

					// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
					var item2 = null;
					var sub = [new Array(new String('a'), new String(10)), new Array('x', 'r'),
							new Array('8', '5'), new Object(['i', 'd']), new Object(['3', '4']),
							[], [null, undefined]];
					for ( var i = 0; i < sub.length; i++) {
						item2 = model.create({
							id: sequence.next(),
							test1: sub[i]
						});

						ok(true, 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

						item2.set('test1', sub[i]);

						ok(true, 'typeプロパティで指定した型の値が代入できること。');
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
					id: true
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
			var item = model.create({
				id: sequence.next()
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, null, undefined, /[0-9]/, new RegExp(), 'false', '', Infinity,
					-Infinity, new Number(1), NaN, window, {}, new Object([10, 'v']),
					new Array(1, 'a'), function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: sequence.next(),
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.set('test1', sub[i]);
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
			id: sequence.next(),
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
			id: sequence.next(),
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

		// DataItemでcreateできるか
		var item1 = model.create({
			id: sequence.next(),
			dataModel1: model1DataItem
		});
		var item2 = model.create({
			id: sequence.next(),
			dataModel2: model2DataItem
		});

		equal(item1.dataModel1.test1, 'aaa', 'create時に指定したモデルの値が、DataItemから取得できること。');
		equal(item1.get('dataModel2'), null, 'create時に何も値を指定しない場合、nullが取得できること。');
		equal(item2.get('dataModel1'), null, 'create時に何も値を指定しない場合、nullが取得できること。');
		equal(item2.dataModel2.test1, 20, 'create時に指定したモデルの値が、DataItemから取得できること。');

		//TODO null,undefinedでcreateできること、代入できることを確認する
	});

	test('type指定 DataModel 異常系', 2, function() {
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

		var desc1Model = manager.createModel(descriptor1);
		var model1DataItem = desc1Model.create({
			id: sequence.next(),
			test1: 'aaa'
		});

		var descModel2 = manager.createModel(descriptor2);
		var model2DataItem = descModel2.create({
			id: sequence.next(),
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

		// DataItemでcreateできるか
		var item1 = model.create({
			id: sequence.next(),
			dataModel1: model1DataItem
		});
		var item2 = model.create({
			id: sequence.next(),
			dataModel2: model2DataItem
		});

		// 異なる型を指定してcreateするとエラーが発生すること
		raises(function() {
			model.create({
				id: sequence.next(),
				dataModel2: model1DataItem
			});
		}, 'type:DataMode1のプロパティに異なる型の値を指定してcreateするとエラーが発生すること。');

		// 異なる型をsetするとエラーが発生すること
		raises(function() {
			item1.set('dataModel1', model2DataItem);
			item1.refresh();
		}, 'type:DataModel2のプロパティに異なる型の値をsetするとエラーが発生すること。');
	});

	test('type指定 DataModel[] 正常系', 8, function() {
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
			id: sequence.next(),
			test1: 'aaa'
		});
		var model1DataItem2 = desc1Model.create({
			id: sequence.next(),
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
			id: sequence.next(),
			test1: 20
		});
		var model2DataItem2 = descModel2.create({
			id: sequence.next(),
			test1: 30
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
			id: sequence.next(),
			dataModel1: [model1DataItem1, model1DataItem2]
		});
		var item2 = model.create({
			id: sequence.next(),
			dataModel2: [model2DataItem1, model2DataItem2]
		});

		equal(item1.dataModel1[0].test1, 'aaa', 'create時に指定したモデルの値が、DataItemから取得できること。');
		equal(item1.dataModel1[1].test1, 'bbb', 'create時に指定したモデルの値が、DataItemから取得できること。');
		deepEqualObs(item1.dataModel2, [], 'create時に何も値を指定しない場合、空のObsArrayが取得できること。');
		equal(item2.dataModel2[0].test1, 20, 'create時に指定したモデルの値が、DataItemから取得できること。');
		equal(item2.dataModel2[1].test1, 30, 'create時に指定したモデルの値が、DataItemから取得できること。');
		deepEqualObs(item2.dataModel1, [], 'create時に何も値を指定しない場合、空のObsArrayが取得できること。');

		// 指定無し、null,undefined,空配列でcreateできるか
		deepEqualObs(model.create({
			id: sequence.next(),
			dataModel1: [null]
		}).dataModel1, [null], 'create時に[null]を指定した場合、[null]が取得できること。');

		//TODO undefined → null の変換は型変換が行われることを確認するテストで行う
		//		deepEqualObs(model.create({
		//			id: sequence.next(),
		//			dataModel1: [undefined]
		//		}).dataModel1, [null], 'create時に[undefined]を指定した場合、[null]が取得できること。');

		deepEqualObs(model.create({
			id: sequence.next(),
			dataModel1: []
		}).dataModel1, [], 'create時に空配列を指定した場合、空配列が取得できること。');

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
			id: sequence.next(),
			test1: 'aaa'
		});
		var model1DataItem2 = desc1Model.create({
			id: sequence.next(),
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
			id: sequence.next(),
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

		var item1 = model.create({
			id: sequence.next(),
			dataModel1: [model1DataItem1, model1DataItem2]
		});

		// 異なる型を指定してcreateするとエラーが発生すること
		raises(function() {
			model.create({
				id: sequence.next(),
				dataModel1: [model1DataItem1, model2DataItem1]
			});
		}, 'type:DataMode1のプロパティに異なる型の値を指定してcreateするとエラーが発生すること。');

		// 異なる型を指定してcreateするとエラーが発生すること
		raises(function() {
			model.create({
				id: sequence.next(),
				dataModel2: [model1DataItem1, model2DataItem1]
			});
		}, 'type:DataMode1のプロパティに異なる型の値を指定してcreateするとエラーが発生すること。');

		// 異なる型をsetするとエラーが発生すること
		raises(function() {
			item1.set('dataModel1', [model1DataItem1, model2DataItem1]);
		}, 'type:DataModel2のプロパティに異なる型の値をsetするとエラーが発生すること。');

		// 異なる型をsetするとエラーが発生すること
		raises(function() {
			item1.set('dataModel2', [model1DataItem1, model2DataItem1]);
		}, 'type:DataModel2のプロパティに異なる型の値をsetするとエラーが発生すること。');
	});


	test('type指定 number 正常系',
			function() {
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
					var item = model.create({
						id: sequence.next()
					});

					// 初期値は正しいか
					strictEqual(item.get('test1'), 20,
							'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
					strictEqual(item.get('test2'), 0, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

					item = model.create({
						id: sequence.next(),
						test1: 10
					});

					strictEqual(item.get('test1'), 10, 'type:number のプロパティに値が代入できること。');

					// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
					var item2 = null;
					var sub = [new Number(10), Infinity, -Infinity, NaN, new Object(10.9), null,
							undefined];
					for ( var i = 0; i < sub.length; i++) {
						item2 = model.create({
							id: sequence.next(),
							test1: sub[i]
						});

						ok(true, 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

						item2.set('test1', sub[i]);

						ok(true, 'typeプロパティで指定した型の値が代入できること。');
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
			var item = model.create({
				id: sequence.next()
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = ['', /[0-9]/, new RegExp(), {
				1: 1
			}, '1a', [1], new Array(), new Boolean(1), window, function() {
				return 10;
			}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: sequence.next(),
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.set('test1', nosub[i]);
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
					id: true
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
			var item = model.create({
				id: sequence.next()
			});

			// 初期値は正しいか
			deepEqualObs(item.test1, [20], 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqualObs(item.test2, [], 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: [30, 10]
			});

			deepEqualObs(item.test1, [30, 10], 'type:\'number[]\'のプロパティcreateで値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new Array(new Number(10)), new Array(40, 90), new Object([10, 30]), ["10"],
					[Infinity, -Infinity, NaN], new Array(Infinity, -Infinity, NaN),
					new Object([Infinity, -Infinity, NaN]), [null, undefined]];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: sequence.next(),
					test1: sub[i]
				});

				ok(true, 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.set('test1', sub[i]);

				ok(true, 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 number[] 異常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
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
			var item = model.create({
				id: sequence.next()
			});

			item = model.create({
				id: sequence.next(),
				test1: [30, 10]
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, null, undefined, /[0-9]/, new RegExp(), 'false', new String('[10]'),
					'', Infinity, -Infinity, new Number(1), NaN, window, {}, new Object(),
					[1, 'a'], new Object(['a']), new Array(1, 'a'), function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: sequence.next(),
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.set('test1', nosub[i]);
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
			var item = model.create({
				id: sequence.next()
			});

			// 初期値は正しいか
			strictEqual(item.get('test1'), 50,
					'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			strictEqual(item.get('test2'), 0, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: 10
			});

			strictEqual(item.get('test1'), 10, 'type:integer のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new Number(10), '10', '+10', '-10', 10.00, new String('56'),
					new Object('30'), new Object(20), null, undefined];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: sequence.next(),
					test1: sub[i]
				});

				ok(true, 'test1に' + parseInt(sub[i], 10) + 'が代入されてDataItemが生成されること。');

				item2.set('test1', sub[i]);

				ok(true, 'typeプロパティで指定した型の値が代入できること。');
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
			var item = model.create({
				id: sequence.next()
			});

			item = model.create({
				id: sequence.next(),
				test1: 10
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = ['', 'a1', /[0-9]/, new RegExp(), {
				1: 1
			}, [1], new String('a3'), new Object('a2'), new Array(), new Boolean(1), window,
					Infinity, -Infinity, function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: sequence.next(),
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.set('test1', nosub[i]);
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 integer[] 正常系', function() {
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
			var item = model.create({
				id: sequence.next()
			});

			// 初期値は正しいか
			deepEqualObs(item.test1, [50, 15],
					'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqualObs(item.test2, [], 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: [10, 30]
			});

			deepEqual(item.get('test1'), [10, 30], 'type:integer[] のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;

			// 「整数」に変換できるもの以外はエラー
			var sub = [[1, 2], ['1', 2], [], [new Number(10), new Number(20)], new Array(1, 2),
					new Array(new Number(10), new Number(20)),
					new Array(new String('56'), new String('48')),
					new Array(new Object('30'), new Object('31')),
					new Array(new Object(20), new Object(20)), [null]];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: sequence.next(),
					test1: sub[i]
				});

				ok(true, 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.set('test1', sub[i]);

				ok(true, 'typeプロパティで指定した型の値が代入できること。');
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
			var item = model.create({
				id: sequence.next()
			});

			item = model.create({
				id: sequence.next(),
				test1: [10, 30]
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, null, undefined, '1', [1, 'a'], '', /[0-9]/, new RegExp(), {
				1: 1
			}, new Number(10), new String('a3'), new Object('a2'), new Array('A'), new Boolean(1),
					window, Infinity, -Infinity, NaN, function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: sequence.next(),
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.set('test1', nosub[i]);
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
					id: true
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
			var item = model.create({
				id: sequence.next()
			});

			// 初期値は正しいか
			strictEqual(item.get('test1'), true,
					'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			strictEqual(item.get('test2'), false, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: false
			});

			strictEqual(item.get('test1'), false, 'type:boolean のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new Boolean(1), new Boolean(0), new Object(true), new Object(false), null,
					undefined];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: sequence.next(),
					test1: sub[i]
				});

				ok(true, 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.set('test1', sub[i]);

				ok(true, 'typeプロパティで指定した型の値が代入できること。');
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
					id: true
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
			var item = model.create({
				id: sequence.next()
			});

			item = model.create({
				id: sequence.next(),
				test1: false
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, '', /[0-9]/, new RegExp(), {
				1: 1
			}, 'false', [1], new String('true'), new Object(), new Array(), Infinity, -Infinity,
					new Number(1), NaN, window, function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: sequence.next(),
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.set('test1', nosub[i]);
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
					id: true
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
			var item = model.create({
				id: sequence.next()
			});

			// 初期値は正しいか
			deepEqualObs(item.test1, [true, false],
					'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqualObs(item.test2, [], 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: [false, true, false]
			});

			deepEqualObs(item.test1, [false, true, false], 'type:boolean[] のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [[new Boolean(1), new Boolean(0)], new Array(new Boolean(1), new Boolean(0)),
					[new Object(true), new Object(false)],
					new Array(new Object(true), new Object(false)), [null, undefined], []];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: sequence.next(),
					test1: sub[i]
				});

				ok(true, 'test1に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.set('test1', sub[i]);

				ok(true, 'typeプロパティで指定した型の値が代入できること。');
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
					id: true
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
			var item = model.create({
				id: sequence.next()
			});

			item = model.create({
				id: sequence.next(),
				test1: [false, true, false]
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, '', null, undefined, [true, 'true'], [1], /[0-9]/, new RegExp(), {
				1: 1
			}, 'false', new String('true'), new Object(), Infinity, -Infinity, new Number(1), NaN,
					window, function() {
						return 10;
					}, ['true', 'false'], [1, 0]];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: sequence.next(),
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.set('test1', nosub[i]);
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});



	// NaN === NaN = false(h5.core.data.js l.525の判定を修正する)
	// 2012/07/27 竹内追記 type:any[]は無い
	// 2012/08/23 福田追記 type:arrayが廃止になって、中身の型の指定のない配列はtype:any[]になった。
	test('type指定 any',
			function() {
				var div = document.createElement('div');
				var model = manager.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
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
					var item = model.create({
						id: sequence.next()
					});

					// 初期値は正しいか
					equal(item.get('test1'), div,
							'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
					equal(item.get('test2'), null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

					function Test1Obj() {
						this.name = 'test1Obj';
						this.num = 10;
					}

					item = model.create({
						id: sequence.next(),
						test1: new Test1Obj()
					});

					deepEqual(item.get('test1'), new Test1Obj(), 'type:\'any\'のプロパティに値が代入できること。');

					// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
					var sub = [1, null, undefined, /[0-9]/, new RegExp(), 'false',
							new String('true'), '', Infinity, -Infinity, new Number(1), NaN,
							window, new Array(), [1], {}, new Object(), function() {
								return 10;
							}];
					var item2 = null;
					for ( var i = 0; i < sub.length; i++) {
						item2 = model.create({
							id: sequence.next(),
							test1: sub[i]
						});

						deepEqual(item2.get('test1'), sub[i], 'test1に' + sub[i]
								+ 'が代入されてDataItemが生成されること。');

						item2.set('test1', sub[i]);

						deepEqual(item2.get('test1'), sub[i], 'typeプロパティで指定した型の値が代入できること。');
					}
				} catch (e) {
					ok(false, 'エラーが発生しました。『' + e.message + '』');
				}
			});

	// 2012/07/27 竹内追記 type:array[]は無い
	// 2012/08/23 福田追記 type:arrayは廃止。type:any[]を使用する
	test('type指定 any[] 正常系',
			function() {
				var model = manager.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
						},
						test1: {
							type: 'any[]',
							defaultValue: [10]
						},
						test2: {
							type: 'any[]'
						}
					}
				});

				try {
					var item = model.create({
						id: sequence.next()
					});

					// 初期値は正しいか
					deepEqualObs(item.test1, [10],
							'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
					deepEqualObs(item.test2, [], 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

					item = model.create({
						id: sequence.next(),
						test1: [30]
					});

					deepEqualObs(item.test1, [30], 'type:\'any\'のプロパティに値が代入できること。');

					// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
					var item2 = null;
					var sub = [new Array(10, 8), new Object(['a']), [new Number(1)]];
					for ( var i = 0; i < sub.length; i++) {
						item2 = model.create({
							id: sequence.next(),
							test1: sub[i]
						});

						deepEqual(item2.get('test1'), sub[i], 'test1に' + sub[i]
								+ 'が代入されてDataItemが生成されること。');

						item2.set('test1', sub[i]);

						deepEqual(item2.get('test1'), sub[i], 'typeプロパティで指定した型の値が代入できること。');
					}
				} catch (e) {
					ok(false, 'エラーが発生しました。『' + e.message + '』');
				}
			});

	test('type指定 any[] 異常系', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'any[]',
					defaultValue: [10]
				},
				test2: {
					type: 'any[]'
				}
			}
		});

		try {
			var item = model.create({
				id: sequence.next()
			});

			item = model.create({
				id: sequence.next(),
				test1: [30]
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, null, undefined, /[0-9]/, new RegExp(), 'false', new String('true'),
					'', Infinity, -Infinity, new Number(1), NaN, window, {}, new Object(),
					function() {
						return 10;
					}];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: sequence.next(),
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.set('test1', nosub[i]);
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test(
			'type指定 enum 正常系',
			function() {
				function TestClass1() {
					this.num = 10;
				}
				var testClass1 = new TestClass1();

				var model = manager.createModel({
					name: 'TestDataModel',
					schema: {
						id: {
							id: true
						},
						test1: {
							type: 'enum',
							defaultValue: 10,
							enumValue: ['a', 10, true, testClass1]
						},
						test2: {
							type: 'enum',
							enumValue: ['b', 20, false, testClass1, NaN]
						}
					}
				});

				try {
					var item = model.create({
						id: sequence.next()
					});

					// 初期値は正しいか
					equal(item.get('test1'), 10,
							'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
					strictEqual(item.get('test2'), null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

					item = model.create({
						id: sequence.next(),
						test1: testClass1
					});

					deepEqual(item.get('test1'), testClass1, 'type:\'enum\'のプロパティに値が代入できること。');

					// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
					var item2 = null;
					var sub = ['b', 20, false, testClass1, NaN];
					for ( var i = 0; i < sub.length; i++) {
						item2 = model.create({
							id: sequence.next(),
							test2: sub[i]
						});

						deepEqual(item2.get('test2'), sub[i], 'test2に' + sub[i]
								+ 'が代入されてDataItemが生成されること。');

						item2.set('test2', sub[i]);

						deepEqual(item2.get('test2'), sub[i], 'typeプロパティで指定した型の値が代入できること。');
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
					id: true
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
			var item = model.create({
				id: sequence.next()
			});

			item = model.create({
				id: sequence.next(),
				test1: testClass1
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, false, 'z', /[0-9]/, new RegExp(), 'true', new String(10), '',
					Infinity, -Infinity, new Number(1), NaN, window, {}, new Object(),
					new Object(['b']), new Array('a'), ['a'], function() {
						return 'a';
					}, new TestClass1(), new String('a'), new Object('a'), new Number(10),
					new Object(10), new Boolean(1), new Object(true)];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: sequence.next(),
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.set('test1', nosub[i]);
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 enum[] 正常系', function() {
		function TestClass1() {
			this.num = 10;
		}
		var testClass1 = new TestClass1();

		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'enum[]',
					defaultValue: [10],
					enumValue: ['a', 10, true, testClass1]
				},
				test2: {
					type: 'enum[]',
					enumValue: ['b', 20, false, testClass1]
				}
			}
		});

		try {
			var item = model.create({
				id: sequence.next()
			});

			// 初期値は正しいか
			deepEqualObs(item.test1, [10], 'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqualObs(item.test2, [], 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: ['a']
			});

			deepEqual(item.get('test1'), testClass1, 'type:\'enum[]\'のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [['b'], ['b', 'b'], ['b', 20], ['b', 20, false, testClass1], [false],
					[testClass1], [null], [undefined], [null, undefined]];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: sequence.next(),
					test2: sub[i]
				});

				deepEqualObs(item2.test1, sub[i], 'test2に' + sub[i] + 'が代入されてDataItemが生成されること。');

				item2.set('test2', sub[i]);

				deepEqualObs(item2.test2, sub[i], 'typeプロパティで指定した型の値が代入できること。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	test('type指定 enum[] 異常系', function() {
		function TestClass1() {
			this.num = 10;
		}
		var testClass1 = new TestClass1();

		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'enum[]',
					defaultValue: [10],
					enumValue: ['a', 10, true, testClass1]
				},
				test2: {
					type: 'enum[]',
					enumValue: ['b', 20, false, testClass1]
				}
			}
		});

		try {
			var item = model.create({
				id: sequence.next()
			});

			item = model.create({
				id: sequence.next(),
				test1: [testClass1]
			});

			// 代入不可な値を指定した場合は例外が発生するか
			var nosub = [1, false, 'z', null, undefined, /[0-9]/, new RegExp(), 'true',
					new String(10), '', Infinity, -Infinity, new Number(1), NaN, window, {},
					new Object(), new Object(['b']), new Array('b'), ['b'], function() {
						return 'a';
					}, new TestClass1(), new String('a'), new Object('a'), new Number(10),
					new Object(10), new Boolean(1), new Object(true)];
			for ( var i = 0; i < nosub.length; i++) {
				raises(function() {
					model.create({
						id: sequence.next(),
						test1: nosub[i]
					});
				}, '指定された型以外の値でcreateできないこと。');

				raises(function() {
					item.set('test1', nosub[i]);
				}, '指定された型以外の値は代入できないこと。');
			}
		} catch (e) {
			ok(false, 'エラーが発生しました。『' + e.message + '』');
		}
	});

	//=============================
	// Definition
	//=============================

	module('constraint', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			sequence = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	// 2012/07/27 竹内追記 仕様が確定するまで取りあえず放置
	test('値をセットしても何もイベントが起きず、値のチェックも行われないこと', 0, function() {
	// TODO
	});

	//=============================
	// Definition
	//=============================
	/**
	 * schemaからデータモデルを作成する
	 */
	function createModelFromSchema(schema) {
		return manager.createModel({
			name: 'TestDataModel',
			schema: schema
		});
	}

	/**
	 * constraintを定義したテスト用のモデル 中身は各constraintのテストのsetupで記述する
	 */
	var model;

	module('constraint - notNull', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			var model1 = manager.createModel({
				name: 'DataModel1',
				schema: {
					id: {
						id: true
					},
					test1: {
						type: 'string',
						defaultValue: 'ccc'
					}
				}
			});

			function TestClass1() {
				this.num = 10;
			}
			testClass1 = new TestClass1();

			itemA = model1.create({
				id: sequence.next(),
				test1: 'aaa'
			});

			itemB = model1.create({
				id: sequence.next(),
				test1: 'bbb'
			});

			// notNullをテストする用のモデルを作成
			var constraint = {
				notNull: true
			};

			model = createModelFromSchema({
				id: {
					id: true
				},
				test1: {
					type: 'string',
					defaultValue: 'aaa',
					constraint: constraint
				},
				test2: {
					type: 'string[]',
					defaultValue: ['a', 'b', 'c'],
					constraint: constraint
				},
				test3: {
					type: 'number',
					defaultValue: 10.5,
					constraint: constraint
				},
				test4: {
					type: 'number[]',
					defaultValue: [20.1, 20.2, 20.3],
					constraint: constraint
				},
				test5: {
					type: 'integer',
					defaultValue: 6,
					constraint: constraint
				},
				test6: {
					type: 'integer[]',
					defaultValue: [7, 8, 9],
					constraint: constraint
				},
				test7: {
					type: 'boolean',
					defaultValue: true,
					constraint: constraint
				},
				test8: {
					type: 'boolean[]',
					defaultValue: [true, false],
					constraint: constraint
				},
				test9: {
					type: 'array',
					defaultValue: [30, 'ZZZ', /[0-9]/],
					constraint: constraint
				},
				test10: {
					type: 'any',
					defaultValue: {
						hoge: 1
					},
					constraint: constraint
				},
				test11: {
					type: '@DataModel1',
					defaultValue: itemA,
					constraint: constraint
				},
				test12: {
					type: '@DataModel1[]',
					defaultValue: [itemB, itemA],
					constraint: constraint
				},
				test13: {
					type: 'enum',
					enumValue: [10.8, 'a', 5, true, [1, 2, 3], /[0-9]/, testClass1, itemB],
					defaultValue: 10.8,
					constraint: constraint
				},
				test14: {
					type: 'enum[]',
					enumValue: [itemB, testClass1, /[0-9]/, [10, 20, 30], true, 5, 'YYY', 10.8],
					defaultValue: [testClass1],
					constraint: constraint
				}
			});
		},
		teardown: function() {
			dropAllModel(manager);
			model = null;
			sequence = null;
			testClass1 = null;
			itemA = null;
			itemB = null;
		}
	});

	//=============================
	// Body
	//=============================

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
	test('制約が適用されているか 正常系', 42, function() {
		// 値を指定せずcreateできること
		var msg = 'defaultValueで指定した値を持つDataItemが作成できること。';

		var item1 = model.create({
			id: sequence.next()
		});
		equal(item1.get('test1'), 'aaa', msg);
		deepEqualObs(item1.test2, ['a', 'b', 'c'], msg);
		equal(item1.get('test3'), 10.5, msg);
		deepEqualObs(item1.test4, [20.1, 20.2, 20.3], msg);
		equal(item1.get('test5'), 6, msg);
		deepEqualObs(item1.test6, [7, 8, 9], msg);
		equal(item1.get('test7'), true, msg);
		deepEqualObs(item1.test8, [true, false], msg);
		deepEqualObs(item1.test9, [30, 'ZZZ', /[0-9]/], msg);
		deepEqual(item1.get('test10'), {
			hoge: 1
		}, msg);
		equal(item1.get('test11'), itemA, msg);
		deepEqualObs(item1.test12, [itemB, itemA], msg);
		equal(item1.get('test13'), 10.8, msg);
		deepEqualObs(item1.test14, [testClass1], msg);

		var $div = $('<div></div>');

		// 値を指定してcreateできること
		msg = '条件を満たす値を持つDataItemが作成できること';

		var item2 = model.create({
			id: sequence.next(),
			test1: 'bbb',
			test2: ['A', 'B', 'C'],
			test3: 120.1,
			test4: [81.1, 81.2, 81.3],
			test5: 3000,
			test6: [4000, 5000, 6000],
			test7: false,
			test8: [false, false],
			test9: [true, '9999', 70.5],
			test10: $div,
			test11: itemB,
			test12: [itemA],
			test13: true,
			test14: [5]
		});
		strictEqual(item2.get('test1'), 'bbb', msg);
		deepEqualObs(item2.test2, ['A', 'B', 'C'], msg);
		strictEqual(item2.get('test3'), 120.1, msg);
		deepEqualObs(item2.test4, [81.1, 81.2, 81.3], msg);
		strictEqual(item2.get('test5'), 3000, msg);
		deepEqualObs(item2.test6, [4000, 5000, 6000], msg);
		strictEqual(item2.get('test7'), false, msg);
		deepEqualObs(item2.test8, [false, false], msg);
		deepEqualObs(item2.test9, [true, '9999', 70.5], msg);
		strictEqual(item2.get('test10'), $div, msg);
		strictEqual(item2.get('test11'), itemB, msg);
		deepEqualObs(item2.test12, [itemA], msg);
		strictEqual(item2.get('test13'), true, msg);
		deepEqualObs(item2.test14, [5], msg);

		// setできること
		msg = '条件を満たす値を代入できること';

		item2.set('test1', 'ccc');
		strictEqual(item2.get('test1'), 'ccc', msg);

		item2.set('test2', ['aa', 'bb', 'cc']);
		deepEqualObs(item2.test2, ['aa', 'bb', 'cc'], msg);

		item2.set('test3', 0);
		strictEqual(item2.get('test3'), 0, msg);

		item2.set('test4', [1, 2, 3]);
		deepEqualObs(item2.test4, [1, 2, 3], msg);

		item2.set('test5', -3000);
		strictEqual(item2.get('test5'), -3000, msg);

		item2.set('test6', [1, 2, 3]);
		deepEqualObs(item2.test6, [1, 2, 3], msg);

		item2.set('test7', true);
		strictEqual(item2.get('test7'), true, msg);

		item2.set('test8', [true, true, false]);
		deepEqualObs(item2.test8, [true, true, false], msg);

		item2.set('test9', [[1], 2, 'aaa']);
		deepEqual(item2.get('test9'), [[1], 2, 'aaa'], msg);

		item2.test10 = {
			a: 'b'
		};
		deepEqual(item2.get('test10'), {
			a: 'b'
		}, msg);

		item2.set('test11', itemA);
		strictEqual(item2.get('test11'), itemA, msg);

		item2.set('test12', [itemA, itemB, itemB]);
		deepEqualObs(item2.test12, [itemA, itemB, itemB], msg);

		item2.set('test13', 10.8);
		strictEqual(item2.get('test13'), 10.8, msg);

		item2.set('test14', [testClass1, 'YYY', true, true]);
		deepEqualObs(item2.test14, [testClass1, 'YYY', true, true], msg);


	});

	test('制約が適用されているか 異常系', 16, function() {
		var i = 0;
		for (i = 0; i < 15; i++) {
			raises(function() {
				var desc1 = {
					id: i
				};
				desc1['test' + i] = null;

				model.create(desc1);
			}, 'NotNull制約があるため、値にnullを指定してDataItemを作成できないこと。');
		}

		// defaultValuのない場合は、create時に指定が必須であることを確認する
		var model2 = manager.createModel({
			name: 'TestModel2',
			schema: {
				id: {
					id: true
				},
				test: {
					constraint: {
						notNull: true
					}
				}
			}
		});

		try {
			model2.create({
				id: '1'
			});
			ok(false, 'テスト失敗。notNullの項目に値を設定しないでcreateした時にエラーが発生していません。');
		} catch (e) {
			//TODO エラーコード確認する(以降のconstraintチェック異常系のテストも同様)
			strictEqual(e.code, ERR.ERR_CODE_INVALID_TYPE, e.message);
		}
	});

	//=============================
	// Definition
	//=============================
	module('constraint - notEmpty', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');

			// notEmptyをテストする用のモデルを作成
			var constraint = {
				notEmpty: true
			};

			model = createModelFromSchema({
				id: {
					id: true
				},
				test1: {
					type: 'string',
					defaultValue: 'test1',
					constraint: constraint
				},
				test2: {
					type: 'string[]',
					defaultValue: ['a', 'b', 'c'],
					constraint: constraint
				}
			});

		},
		teardown: function() {
			dropAllModel(manager);
			model = null;
			sequence = null;
			testClass1 = null;
			itemA = null;
			itemB = null;
		}
	});

	//=============================
	// Body
	//=============================

	test('制約が適用されているか 正常系', 6, function() {
		// 値を指定せずcreateできること
		var msg = 'defaultValueで指定した値を持つDataItemが作成できること。';
		var item = model.create({
			id: sequence.next()
		});

		equal(item.get('test1'), 'test1', msg);
		deepEqualObs(item.test2, ['a', 'b', 'c'], msg);

		// 値を指定してcreateできること
		msg = '条件を満たす値を持つDataItemが作成できること';

		item = model.create({
			id: sequence.next(),
			test1: 'bbb',
			test2: ['A', 'B', 'C']
		});

		equal(item.get('test1'), 'bbb', msg);
		deepEqualObs(item.test2, ['A', 'B', 'C'], msg);


		// setできること
		msg = '条件を満たす値を代入できること';

		item.set('test1', 'bbb');
		strictEqual(item.get('test1'), 'bbb', msg);

		item.set('test2', ['aa', 'bb', 'cc']);
		deepEqualObs(item.test2, ['aa', 'bb', 'cc'], msg);
	});

	test(
			'制約が適用されているか 異常系',
			function() {
				// createでエラー
				try {
					model.create({
						id: sequence.next(),
						test1: ''
					});
					ok(false, 'テスト失敗。NotEmpty指定した項目(string)に空文字を指定してcreateした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_TYPE, e.message);
				}

				try {
					model.create({
						id: sequence.next(),
						test2: ['a', '']
					});
					ok(false, 'テスト失敗。NotEmpty指定した項目(string[])に空文字を含む配列を指定してcreateした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_TYPE, e.message);
				}

				try {
					model.create({
						id: sequence.next(),
						test1: null
					});
					ok(false, 'テスト失敗。NotEmpty指定した項目(string)にnullを指定してcreateした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_TYPE, e.message);
				}

				try {
					model.create({
						id: sequence.next(),
						test2: ['a', null]
					});
					ok(false,
							'テスト失敗。NotEmpty指定した項目(string[])にnullを含む配列を指定してcreateした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_TYPE, e.message);
				}

				var item = model.create({
					id: sequence.next()
				});

				// setでエラー
				try {
					item.set('test1', '');
					ok(false, 'テスト失敗。NotEmpty指定した項目(string)に空文字を代入してrefreshした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_TYPE, e.message);
				}
				try {
					item.set('test2', ['b', '']);
					ok(false,
							'テスト失敗。NotEmpty指定した項目(string[])に空文字を含む配列を代入してrefreshした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_TYPE, e.message);
				}
				try {
					item.set('test1', null);
					ok(false, 'テスト失敗。NotEmpty指定した項目(string)にnullを代入してrefreshした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_TYPE, e.message);
				}
				try {
					item.set('test2', ['b', null]);
					ok(false,
							'テスト失敗。NotEmpty指定した項目(string[])にnullを含む配列を代入してrefreshした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_TYPE, e.message);
				}

				var constraint = {
					notEmpty: true
				};

				// defaultValueなし、notEmpty制約がある場合、create時に値を設定しないとエラー
				model2 = manager.createModel({
					name: 'TestModel2',
					schema: {
						id: {
							id: true
						},
						test1: {
							type: 'string',
							constraint: constraint
						}
					}
				});

				try {
					model2.create({
						id: sequence.next()
					});
					ok(false,
							'テスト失敗。NotEmpty制約の項目にdefaultValue指定がない項目を、create時に値を指定しなかった場合にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_TYPE, e.message);
				}
			});

	//=============================
	// Definition
	//=============================

	module('constraint - min', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');

			model = manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true
					},
					num: {
						type: 'number',
						constraint: {
							min: -5.5
						},
						defaultValue: -5.5
					},
					numA: {
						type: 'number[]',
						constraint: {
							min: -5.5
						},
						defaultValue: [55, -5.5]
					},
					int: {
						type: 'integer',
						constraint: {
							min: 5
						},
						defaultValue: 5
					},
					intA: {
						type: 'integer[]',
						constraint: {
							min: 5
						},
						defaultValue: [5, 6, 7]
					}
				}
			});
		},
		teardown: function() {
			sequence = null;
			dataModel1 = null;
			testClass1 = null;
			itemA = null;
			itemB = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	test(
			'制約が適用されているか 正常系',
			function() {
				// 値を指定しないでcreate
				var item = model.create({
					id: sequence.next()
				});
				equal(item.get('num'), -5.5,
						'type:num minの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
				deepEqualObs(item.get('numA'), [55, -5.5],
						'type:num[] minの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
				equal(item.get('int'), 5, 'type:int minの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
				deepEqual(item.get('intA'), [5, 6, 7],
						'type:int[] minの条件をdefaultValueが満たす時、値を指定しないでcreateできること');

				// create
				item = model.create({
					id: sequence.next(),
					num: -5.5,
					numA: [-5.5, 0, 6.6, Infinity],
					int: 5,
					intA: [5, 10]
				});

				equal(item.get('num'), -5.5, 'type:num minの条件を満たす値でcreateできること');
				deepEqualObs(item.get('numA'), [-5.5, 0, 6.6, Infinity],
						'type:num[] minの条件を満たす値でcreateできること');
				equal(item.get('int'), 5, 'type:intでminの条件を満たす値でcreateできること');
				deepEqual(item.get('intA'), [5, 10], 'type:int[] minの条件を満たす値でcreateできること');

				// set
				item.set({
					num: Infinity,
					numA: [123.456],
					int: 6,
					intA: [5, 6, 7]
				});
				equal(item.get('num'), Infinity, 'type:num minの条件を満たす値をsetできること');
				deepEqualObs(item.get('numA'), [-5.5, 0, 6.6, Infinity],
						'type:num[] minの条件を満たす値をsetできること');
				equal(item.get('int'), 5, 'type:int minの条件を満たす値をsetできること');
				deepEqual(item.get('intA'), [5, 10], 'type:int[] minの条件を満たす値をsetできること');

				// nullをset
				item.set({
					num: null,
					numA: [null, null],
					int: null,
					intA: [null, null]
				});
				equal(item.get('num'), Infinity, 'type:num nullをsetできること');
				deepEqualObs(item.get('numA'), [-5.5, 0, 6.6, Infinity],
						'type:num[] [null, null]をsetできること');
				equal(item.get('int'), 5, 'type:int nullをsetできること');
				deepEqual(item.get('intA'), [5, 10], 'type:int[] [null, null]をsetできること');

				// defaultValueが設定されていない場合
				var constraint = {
					min: 10
				};
				var model2 = manager.createModel({
					name: 'TestModel2',
					schema: {
						id: {
							id: true
						},
						num: {
							type: 'number',
							constraint: constraint
						},
						numA: {
							type: 'number[]',
							constraint: constraint
						},
						int: {
							type: 'integer',
							constraint: constraint
						},
						intA: {
							type: 'integer[]',
							constraint: constraint
						}
					}
				});
				try {
					model2.create({
						id: sequence.next()
					});
					strictEqual(itemget('num'), null, 'defaultValue指定無しで、値nullのアイテムがcreateできること');
					deepEqualObs(itemget('numA'), [null],
							'defaultValue指定無しで、値nullのアイテムがcreateできること');
					strictEqual(itemget('int'), null, 'defaultValue指定無しで、値nullのアイテムがcreateできること');
					deepEqualObs(itemget('int[]'), null, 'defaultValue指定無しで、値nullのアイテムがcreateできること');
				} catch (e) {
					ok(false, e.message);
				}

			});

	test('制約が適用されているか 異常系', function() {
		//create
		try {
			model.create({
				id: sequence.next(),
				num: -5.55
			});
			ok(false, 'テスト失敗。minで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_CONSTRAINT, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				numA: [4.44, -5.55, 6.66]
			});
			ok(false, 'テスト失敗。minで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_CONSTRAINT, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				int: 4
			});
			ok(false, 'テスト失敗。minで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_CONSTRAINT, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				intA: [8, 6, 4]
			});
			ok(false, 'テスト失敗。minで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_CONSTRAINT, e.message);
		}

		// set
		var item = model.create({
			id: sequence.next()
		});
		try {
			item.set({
				id: sequence.next(),
				num: -5.50001
			});
			ok(false, 'テスト失敗。minで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALIDCONSTRAINT, e.message);
		}
		try {
			item.set({
				id: sequence.next(),
				numA: [0, 1, -5.5000001]
			});
			ok(false, 'テスト失敗。minで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALIDCONSTRAINT, e.message);
		}
		try {
			item.set({
				id: sequence.next(),
				int: 4
			});
			ok(false, 'テスト失敗。minで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALIDCONSTRAINT, e.message);
		}
		try {
			item.set({
				id: sequence.next(),
				int: [6, 4]
			});
			ok(false, 'テスト失敗。minで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALIDCONSTRAINT, e.message);
		}
	});

	test('max 制約が適用されているか 正常系', function() {
		var model1 = dataModel1({
			max: 5
		});

		var item1 = model1.create({
			id: sequence.next(),
			test1: '6',
			test2: ['6'],
			test3: 5.0,
			test4: [5.0],
			test5: 5,
			test6: [5],
			test7: true,
			test8: [true],
			test9: [6],
			test10: 6,
			test11: itemA,
			test12: [itemB, itemA],
			test13: 6.0,
			test14: 6
		});

		equal(item1.get('test1'), '6',
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		deepEqual(item1.get('test2'), ['6'],
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		equal(item1.get('test3'), 5.0,
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		deepEqual(item1.get('test4'), [5.0],
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		equal(item1.get('test5'), 5,
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		deepEqual(item1.get('test6'), [5],
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		equal(item1.get('test7'), true,
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		deepEqual(item1.get('test8'), [true],
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		deepEqual(item1.get('test9'), [6],
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		equal(item1.get('test10'), 6,
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		equal(item1.get('test11'), itemA,
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		deepEqual(item1.get('test12'), [itemB, itemA],
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		equal(item1.get('test13'), 6.0,
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
		equal(item1.get('test14'), 6,
				'type:number,number[],integer,integer[]の場合、create時にmaxがチェックされること。');
	});

	test('max 制約が適用されているか 異常系', function() {
		var model1 = dataModel1({
			max: 5
		});

		raises(function() {
			model1.create({
				id: sequence.next(),
				test3: 6.00001
			});
		}, 'maxで設定した値を超える場合は、制約でエラーになること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test4: [6.0, 6.00000001]
			});
		}, 'maxで設定した値を超える場合は、制約でエラーになること。');

		raises(function() {
			model1.create({
				test5: 6
			});
		}, 'maxで設定した値を超える場合は、制約でエラーになること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test6: [5, 6]
			});
		}, 'maxで設定した値を超える場合は、制約でエラーになること。');
	});

	test(
			'minLength 制約が適用されているか 正常系',
			function() {
				var model1 = dataModel1({
					minLength: 5
				});

				var item1 = model1.create({
					id: sequence.next(),
					test1: 'AAAAA',
					test2: ['DDDDD'],
					test3: 4.0,
					test4: [4.0],
					test5: 4,
					test6: [4],
					test7: true,
					test8: [true],
					test9: ['BBBB'],
					test10: 'CCCC',
					test11: itemA,
					test12: [itemB, itemA],
					test13: 'aaaa',
					test14: 'YYYY'
				});

				equal(item1.get('test1'), 'AAAAA',
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test2'), ['DDDDD'],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test3'), 4.0,
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test4'), [4.0],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test5'), 4, 'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test6'), [4],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test7'), true,
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test8'), [true],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test9'), ['BBBB'],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test10'), 'CCCC',
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test11'), itemA,
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test12'), [itemB, itemA],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test13'), 'aaaa',
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test14'), 'YYYY',
						'type:string,string[]の場合、create時にminLengthがチェックされること。');

				var item2 = model1.create({
					id: sequence.next(),
					test1: null,
					test2: [null]
				});

				equal(item2.get('test1'), null, 'nullの場合はminLengthのチェックは行われないこと。');
				deepEqual(item2.get('test2'), [null], 'nullの場合はminLengthのチェックは行われないこと。');
			});

	test('minLength 制約が適用されているか 異常系', function() {
		var model1 = dataModel1({
			minLength: 5
		});

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: 'AAAA'
			});
		}, 'minLengthで設定した文字数未満の場合は、制約でエラーになること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test2: [null, 'BBBB']
			});
		}, 'minLengthで設定した文字数未満の場合は、制約でエラーになること。');

		raises(function() {
			model1.create({
				test1: 'あいうえ'
			});
		}, 'minLengthで設定した文字数未満の場合は、制約でエラーになること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: [null, 'おかきく']
			});
		}, 'minLengthで設定した文字数未満の場合は、制約でエラーになること。');
	});

	test(
			'maxLength 制約が適用されているか 正常系',
			function() {
				var model1 = dataModel1({
					maxLength: 5
				});

				var item1 = model1.create({
					id: sequence.next(),
					test1: 'AAAAA',
					test2: ['DDDDD'],
					test3: 6.0,
					test4: [6.0],
					test5: 6,
					test6: [6],
					test7: true,
					test8: [true],
					test9: ['BBBBBB'],
					test10: 'CCCCCC',
					test11: itemA,
					test12: [itemB, itemA],
					test13: 'aaaaaa',
					test14: 'YYYYYY'
				});

				equal(item1.get('test1'), 'AAAAA',
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test2'), ['DDDDD'],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test3'), 6.0,
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test4'), [6.0],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test5'), 6, 'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test6'), [6],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test7'), true,
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test8'), [true],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test9'), ['BBBBBB'],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test10'), 'CCCCCC',
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test11'), itemA,
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				deepEqual(item1.get('test12'), [itemB, itemA],
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test13'), 'aaaaaa',
						'type:string,string[]の場合、create時にminLengthがチェックされること。');
				equal(item1.get('test14'), 'YYYYYY',
						'type:string,string[]の場合、create時にminLengthがチェックされること。');

				var item2 = model1.create({
					id: sequence.next(),
					test1: null,
					test2: [null]
				});

				equal(item2.get('test1'), null, 'nullの場合はmaxLengthのチェックは行われないこと。');
				deepEqual(item2.get('test2'), [null], 'nullの場合はmaxLengthのチェックは行われないこと。');
			});

	test('maxLength 制約が適用されているか 異常系', function() {
		var model1 = dataModel1({
			maxLength: 5
		});

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: 'AAAAAA'
			});
		}, 'maxLengthで設定した文字数を超える場合は、制約でエラーになること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test2: [null, 'BBBBBB']
			});
		}, 'maxLengthで設定した文字数を超える場合は、制約でエラーになること。');

		raises(function() {
			model1.create({
				test1: 'あいうえおか'
			});
		}, 'maxLengthで設定した文字数を超える場合は、制約でエラーになること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: [null, 'きくけこさし']
			});
		}, 'maxLengthで設定した文字数を超える場合は、制約でエラーになること。');
	});

	test(
			'pattern 制約が適用されているか 正常系',
			function() {
				var model1 = dataModel1({
					pattern: /^hifive[0-9][0-9]$/
				});

				var item1 = model1.create({
					id: sequence.next(),
					test1: 'hifive01',
					test2: ['hifive02'],
					test3: 6.0,
					test4: [6.0],
					test5: 6,
					test6: [6],
					test7: true,
					test8: [true],
					test9: ['hifive03'],
					test10: 'hifive04',
					test11: itemA,
					test12: [itemB, itemA],
					test13: 'hifive05',
					test14: 'hifive06'
				});

				equal(item1.get('test1'), 'hifive01',
						'type:string,string[]の場合、create時にpatternがチェックされること。');
				deepEqual(item1.get('test2'), ['hifive02'],
						'type:string,string[]の場合、create時にpatternがチェックされること。');
				equal(item1.get('test3'), 6.0, 'type:string,string[]の場合、create時にpatternがチェックされること。');
				deepEqual(item1.get('test4'), [6.0],
						'type:string,string[]の場合、create時にpatternがチェックされること。');
				equal(item1.get('test5'), 6, 'type:string,string[]の場合、create時にpatternがチェックされること。');
				deepEqual(item1.get('test6'), [6],
						'type:string,string[]の場合、create時にpatternがチェックされること。');
				equal(item1.get('test7'), true,
						'type:string,string[]の場合、create時にpatternがチェックされること。');
				deepEqual(item1.get('test8'), [true],
						'type:string,string[]の場合、create時にpatternがチェックされること。');
				deepEqual(item1.get('test9'), ['hifive003'],
						'type:string,string[]の場合、create時にpatternがチェックされること。');
				equal(item1.get('test10'), 'hifive004',
						'type:string,string[]の場合、create時にpatternがチェックされること。');
				equal(item1.get('test11'), itemA,
						'type:string,string[]の場合、create時にpatternがチェックされること。');
				deepEqual(item1.get('test12'), [itemB, itemA],
						'type:string,string[]の場合、create時にpatternがチェックされること。');
				equal(item1.get('test13'), 'hifive005',
						'type:string,string[]の場合、create時にpatternがチェックされること。');
				equal(item1.get('test14'), 'hifive006',
						'type:string,string[]の場合、create時にpatternがチェックされること。');

				var item2 = model1.create({
					id: sequence.next(),
					test1: null,
					test2: [null]
				});

				equal(item2.get('test1'), null, 'nullの場合はpatternのチェックは行われないこと。');
				deepEqual(item2.get('test2'), [null], 'nullの場合はpatternのチェックは行われないこと。');
			});

	test('pattern 制約が適用されているか 異常系', function() {
		var model1 = dataModel1({
			pattern: /^hifive[0-9][0-9]$/
		});

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: 'hifive001'
			});
		}, '値がpatternと一致しない場合、制約でエラーになること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test2: [null, 'hifive001']
			});
		}, '値がpatternと一致しない場合、制約でエラーになること。');
	});

	//=============================
	// Definition
	//=============================

	module('constraint', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			sequence = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	test('constraint 適用順序のチェック number', function() {
		var model1 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'number',
					defaultValue: 5.0,
					constraint: {
						notNull: true,
						min: 4.6,
						max: 5.8
					}
				},
				test2: {
					type: 'number',
					defaultValue: 5.0,
					constraint: {
						notNull: true,
						min: 4.6,
						max: 5.8
					}
				}
			}
		});

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: 3.5,
				test2: null
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notNullの制約エラーが発生すること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: 6.5,
				test2: null
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notNullの制約エラーが発生すること。');
	});

	test('constraint 適用順序のチェック number[]', function() {
		var model1 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'number[]',
					defaultValue: [3.1, 4.5],
					constraint: {
						notNull: true,
						min: 3.1,
						max: 8.2
					}
				},
				test2: {
					type: 'number[]',
					defaultValue: [5.7, 8.2],
					constraint: {
						notNull: true,
						min: 3.1,
						max: 8.2
					}
				}
			}
		});

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: [2.5, 7.2],
				test2: null
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notNullの制約エラーが発生すること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: [3.5, 9.2],
				test2: null
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notNullの制約エラーが発生すること。');
	});

	test('constraint 適用順序のチェック integer', function() {
		var model1 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'integer',
					defaultValue: 5,
					constraint: {
						notNull: true,
						min: 5,
						max: 8
					}
				},
				test2: {
					type: 'integer',
					defaultValue: 6,
					constraint: {
						notNull: true,
						min: 5,
						max: 8
					}
				}
			}
		});

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: 4,
				test2: null
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notNullの制約エラーが発生すること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: 9,
				test2: null
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notNullの制約エラーが発生すること。');
	});

	test('constraint 適用順序のチェック integer[]', function() {
		var model1 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'integer[]',
					defaultValue: [3, 4],
					constraint: {
						notNull: true,
						min: 3,
						max: 6
					}
				},
				test2: {
					type: 'integer[]',
					defaultValue: [5, 6],
					constraint: {
						notNull: true,
						min: 3,
						max: 6
					}
				}
			}
		});

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: [2, 5],
				test2: null
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notNullの制約エラーが発生すること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: [4, 7],
				test2: null
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notNullの制約エラーが発生すること。');
	});

	test('constraint 適用順序のチェック string', function() {
		var model1 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'string',
					defaultValue: '00000',
					constraint: {
						notNull: true,
						notEmpty: true,
						minLength: 5,
						maxLength: 10,
						pattern: /^[0-9]{5}$/
					}
				},
				test2: {
					type: 'string',
					defaultValue: '11111',
					constraint: {
						notNull: true,
						notEmpty: true,
						minLength: 5,
						maxLength: 10,
						pattern: /^[0-9]{5}$/
					}
				},
				test3: {
					type: 'string',
					defaultValue: '22222',
					constraint: {
						notNull: true,
						notEmpty: true,
						minLength: 5,
						maxLength: 10,
						pattern: /^[0-9]{5}$/
					}
				},
				test4: {
					type: 'string',
					defaultValue: '33333',
					constraint: {
						notNull: true,
						notEmpty: true,
						minLength: 5,
						maxLength: 10,
						pattern: /^[0-9]{5}$/
					}
				}
			}
		});

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: null,
				test2: '',
				test3: '2222',
				test3: 'aaaaa'
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notNullの制約エラーが発生すること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: 'aaaaa',
				test2: '',
				test3: '2222',
				test3: 'aaaaa'
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notEmptyの制約エラーが発生すること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: aaaaa,
				test2: 'aaaaa',
				test3: '2222',
				test3: 'aaaaa'
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'lengthの制約エラーが発生すること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: 'aaaaa',
				test2: 'aaaaa',
				test3: 'aaaaa',
				test3: '2222a'
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'patternの制約エラーが発生すること。');
	});

	test('constraint 適用順序のチェック string[]', function() {
		var model1 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'string',
					defaultValue: ['00000', '00000'],
					constraint: {
						notNull: true,
						notEmpty: true,
						minLength: 5,
						maxLength: 10,
						pattern: /^[0-9]{5}$/
					}
				},
				test2: {
					type: 'string',
					defaultValue: ['11111', '11111'],
					constraint: {
						notNull: true,
						notEmpty: true,
						minLength: 5,
						maxLength: 10,
						pattern: /^[0-9]{5}$/
					}
				},
				test3: {
					type: 'string',
					defaultValue: ['22222', '22222'],
					constraint: {
						notNull: true,
						notEmpty: true,
						minLength: 5,
						maxLength: 10,
						pattern: /^[0-9]{5}$/
					}
				},
				test4: {
					type: 'string',
					defaultValue: ['33333', '33333'],
					constraint: {
						notNull: true,
						notEmpty: true,
						minLength: 5,
						maxLength: 10,
						pattern: /^[0-9]{5}$/
					}
				}

			}
		});

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: null,
				test2: ['aaaaa', ''],
				test3: ['aaaaa', '2222'],
				test3: ['aaaaa', 'aaaaa']
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notNullの制約エラーが発生すること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: ['aaaaa', 'aaaaa'],
				test2: ['aaaaa', ''],
				test3: ['aaaaa', '2222'],
				test3: ['aaaaa', 'aaaaa']
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'notEmptyの制約エラーが発生すること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: ['aaaaa', 'aaaaa'],
				test2: ['aaaaa', 'aaaaa'],
				test3: ['aaaaa', '2222'],
				test3: ['aaaaa', 'aaaaa']
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'lengthの制約エラーが発生すること。');

		raises(function() {
			model1.create({
				id: sequence.next(),
				test1: ['aaaaa', 'aaaaa'],
				test2: ['aaaaa', 'aaaaa'],
				test3: ['aaaaa', 'aaaaa'],
				test3: ['aaaaa', '2222a']
			});
		}, function(actual) {
			return actual.code === ERR.ERR_CODE_INVALID_DESCRIPTOR;
		}, 'patternの制約エラーが発生すること。');
	});

	//=============================
	// Definition
	//=============================

	module('depend', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			sequence = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	test('同じモデル依存先プロパティの値が変更された場合のテスト1', function() {
		var model1 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				test1: {
					type: 'string',
					defaultValue: 'aaa',
					depend: {
						on: 'test2',
						calc: function(ev) {
							//ok(ev, '引数にイベントオブジェクトがあること。');
							ok(this.test2, 'test2のdefaultValueが設定されていること。');
							//ok(ev.props.test2.oldValue, '変更前の値が取得できること。');
							//ok(ev.props.test2.newValue, '変更後の値が取得できること。');
							return this.test2 + 'a';
						}
					}
				},
				test2: {
					type: 'string',
					defaultValue: 'bbb'
				}
			}
		});

		var item = model1.create({
			id: sequence.next(),
			test2: 'AAA'
		});


		item.addEventListener('change', function(ev) {});

		item.set('test2', 'bbb');
	});

	test('同じモデル依存先プロパティの値が変更された場合のテスト2', function() {
		manager.createModel({
			name: 'BaseDataModel1',
			schema: {
				id: {
					id: true
				},
				test2: {
					type: 'string',
					defaultValue: 'ccc'
				}
			}
		});

		var model1 = manager.createModel({
			name: 'TestDataModel',
			base: '@BaseDataModel1',
			schema: {
				test1: {
					type: 'string',
					defaultValue: 'aaa',
					depend: {
						on: 'test2',
						calc: function(ev) {
							//ok(ev, '引数にイベントオブジェクトがあること。');
							ok(this.test2, 'test2のdefaultValueが設定されていること。');
							//ok(ev.props.test2.oldValue, '変更前の値が取得できること。');
							//ok(ev.props.test2.newValue, '変更後の値が取得できること。');
							return this.test2 + 'a';
						}
					}
				}
			}
		});

		var item = model1.create({
			id: sequence.next(),
			test2: 'ZZZ'
		});


		item.addEventListener('change', function(ev) {});

		item.set('test2', 'YYY');
	});

	//=============================
	// Definition
	//=============================

	module('auto boxing', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			dataModel1 = manager.createModel({
				name: 'AutoBoxingDataModel1',
				schema: {
					id: {
						id: true
					},
					testI1: {
						type: 'integer',
						defaultValue: '10'
					},
					testI2: {
						type: 'integer',
						defaultValue: new Number('10')
					},
					testI3: {
						type: 'integer',
						defaultValue: new Object('10')
					},
					testI4: {
						type: 'integer',
						defaultValue: new String(10)
					},
					testN1: {
						type: 'number',
						defaultValue: '20'
					},
					testN2: {
						type: 'number',
						defaultValue: new Number('20')
					},
					testN3: {
						type: 'number',
						defaultValue: new Object('20')
					},
					testN4: {
						type: 'integer',
						defaultValue: new String(30)
					},
					testN5: {
						type: 'number',
						defaultValue: '30.1'
					},
					testN6: {
						type: 'number',
						defaultValue: new Number('30.1')
					},
					testN7: {
						type: 'number',
						defaultValue: new Object('30.1')
					},
					testN8: {
						type: 'integer',
						defaultValue: new String('30.1')
					},
				}
			});
		},
		teardown: function() {
			sequence = null;
			dataModel1 = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	test('DataItem生成時に自動的に型変換されていることを確認', function() {
		var item = dataModel1.create({
			id: sequence.next()
		});

		equal(item.get('testI1'), 10, 'type:integerでdefaultValueがパース可能な文字列の場合、自動的に数値に変換されること。');
		equal(item.get('testI2'), 10, 'type:integerでdefaultValueがパース可能な文字列の場合、自動的に数値に変換されること。');
		equal(item.get('testI3'), 10, 'type:integerでdefaultValueがパース可能な文字列の場合、自動的に数値に変換されること。');
		equal(item.get('testI4'), 10, 'type:integerでdefaultValueがパース可能な文字列の場合、自動的に数値に変換されること。');
		equal(item.get('testN1'), 20, 'type:numberでdefaultValueがパース可能な文字列(整数)の場合、自動的に数値に変換されること。');
		equal(item.get('testN2'), 20, 'type:numberでdefaultValueがパース可能な文字列(整数)の場合、自動的に数値に変換されること。');
		equal(item.get('testN3'), 20, 'type:numberでdefaultValueがパース可能な文字列(整数)の場合、自動的に数値に変換されること。');
		equal(item.get('testN4'), 20, 'type:numberでdefaultValueがパース可能な文字列(整数)の場合、自動的に数値に変換されること。');
		equal(item.get('testN5'), 30.1,
				'type:numberでdefaultValueがパース可能な文字列(小数点を含む)の場合、自動的に数値に変換されること。');
		equal(item.get('testN6'), 30.1,
				'type:numberでdefaultValueがパース可能な文字列(小数点を含む)の場合、自動的に数値に変換されること。');
		equal(item.get('testN7'), 30.1,
				'type:numberでdefaultValueがパース可能な文字列(小数点を含む)の場合、自動的に数値に変換されること。');
		equal(item.get('testN8'), 30.1,
				'type:numberでdefaultValueがパース可能な文字列(小数点を含む)の場合、自動的に数値に変換されること。');

	});

	test(
			'DataItemの値を更新すると自動的に型変換されていることを確認',
			function() {
				var item = dataModel1.create({
					id: sequence.next()
				});

				item.set('testI1', '40');
				item.set('testI2', '40');
				item.set('testI3', '40');
				item.set('testN1', '50');
				item.set('testN2', '50');
				item.set('testN3', '50');
				item.set('testN4', '60.1');
				item.set('testN5', '60.1');
				item.set('testN6', '60.1');
				item.set('testN7', '60.1');
				item.set('testN8', '60.1');

				equal(item.get('testI1'), 40, 'type:integerのプロパティにパース可能な文字列を設定すると、自動的に数値に変換されること。');
				equal(item.get('testI2'), 40, 'type:integerのプロパティにパース可能な文字列を設定すると、自動的に数値に変換されること。');
				equal(item.get('testI3'), 40, 'type:integerのプロパティにパース可能な文字列を設定すると、自動的に数値に変換されること。');
				equal(item.get('testN1'), 50,
						'type:numberのプロパティにパース可能な文字列(整数)を設定すると、自動的に数値に変換されること。');
				equal(item.get('testN2'), 50,
						'type:numberのプロパティにパース可能な文字列(整数)を設定すると、自動的に数値に変換されること。');
				equal(item.get('testN3'), 50,
						'type:numberのプロパティにパース可能な文字列(整数)を設定すると、自動的に数値に変換されること。');
				equal(item.get('testN4'), 60.1,
						'type:numberのプロパティにパース可能な文字列(小数点を含む)を設定すると、自動的に数値に変換されること。');
				equal(item.get('testN5'), 60.1,
						'type:numberのプロパティにパース可能な文字列(小数点を含む)を設定すると、自動的に数値に変換されること。');
				equal(item.get('testN6'), 60.1,
						'type:numberのプロパティにパース可能な文字列(小数点を含む)を設定すると、自動的に数値に変換されること。');
				equal(item.get('testN7'), 60.1,
						'type:numberのプロパティにパース可能な文字列(小数点を含む)を設定すると、自動的に数値に変換されること。');
				equal(item.get('testN8'), 60.1,
						'type:numberのプロパティにパース可能な文字列(小数点を含む)を設定すると、自動的に数値に変換されること。');
			});

	//=============================
	// Definition
	//=============================
	var item = item2 = null;
	// ハンドラが実行された順番を確認する用の配列
	var order = [];

	var changeListener = null;

	module('DataItem EventListenerの登録・削除', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			createDataModel1();
			changeListener = function() {
			//
			};
			item = dataModel1.create({
				id: sequence.next(),
				val: 1
			});
		},
		teardown: function() {
			item.removeEventListener('change', changeListener);
			sequence = null;
			dataModel1 = null;
			order = [];
			argsObj = {};
			dropAllModel(manager);
			changeListener = null;
		}
	});

	//=============================
	// Body
	//=============================
	test('addEventListener 正常系', function() {
		//TODO window.addEventListenerと同じで、何いれても(引数が2つさえあれば)エラー出ない？？
		var validArgs = [['change', changeListener], ['itemsChange', changeListener],
				['change', undefined], [false, false], [undefined, undefined]];
		var l = validArgs.length
		for ( var i = 0; i < l; i++) {
			var ret = item.addEventListener(validArgs[i][0], validArgs[i][1]);
			strictEqual(ret, undefined,
					'addEventListenerの戻り値はundefinedであること。引数が2つ指定されていればエラーにはならないこと');
			item.removeEventListener(validArgs[i][0], validArgs[i][1]);
		}
		expect(l);
	});


	test('addEventListener 異常系', 3, function() {
		//TODO エラーコード確認する
		var errCode// = ERR.ERR_CODE_XXX;
		try {
			item.addEventListener();
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, 'addEventListenerの引数にハンドラだけ渡した時、エラーになること');
		}
		try {
			item.addEventListener('cnahge');
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, 'addEventListenerの引数にイベント名だけ渡した時、エラーになること');
		}
		try {
			item.addEventListener(function() {});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, 'addEventListenerの引数にハンドラだけ渡した時、エラーになること');
		}
	});

	test('hasEventListener 正常系', 5, function() {
		var ret = item.hasEventListener('change', changeListener);
		strictEqual(ret, false, 'addEventListenerする前のhasEventListenerの結果はfalseであること');

		item.addEventListener('change', changeListener);
		ret = item.hasEventListener('change', changeListener);
		strictEqual(ret, true,
				'addEventListenerした後、addしたイベントとハンドラのインスタンスをhasEventListenerに渡した時、結果はtrueであること');

		ret = item.hasEventListener('change', function() {});
		strictEqual(ret, false,
				'addEventListenerに渡したインスタンスと異なるインスタンスをhasEventListenerに渡した場合、結果はfalseであること');

		ret = item.hasEventListener('itemsChange', changeListener);
		strictEqual(ret, false,
				'addEventListenerに渡したイベント名と異なるイベント名をhasEventListenerに渡した場合、結果はfalseであること');

		item.removeEventListener('change', changeListener);
		ret = item.hasEventListener('change', changeListener);
		strictEqual(ret, false, 'removeEventListenerすると、hasEventListenerの結果はfalseであること');
	});

	test('hasEventListener 異常系', function() {
	//TODO hasEventListenerの引数チェックを確認する
	});

	test(
			'removeEventListener 正常系',
			function() {
				var ret = item.removeEventListener('change', changeListener);
				strictEqual(ret, undefined,
						'指定したイベントに指定した関数インスタンスが登録されていない時、removeEventListenerの戻り値はundefinedであること');

				item.addEventListener('change', changeListener);

				item.removeEventListener('itemsChange', changeListener);
				ret = item.hasEventListener('change', changeListener);
				strictEqual(
						ret,
						true,
						'addEventListenerに渡したイベント名と異なるイベント名をremoveEventListenerに渡して呼び出した場合、addしたイベントについてのhasEventListenerの結果はtrueであること');

				item.removeEventListener('change', function() {
				//
				});
				ret = item.hasEventListener('change', changeListener);
				strictEqual(
						ret,
						true,
						'addEventListenerに渡したハンドラと異なるハンドラをremoveEventListenerに渡して呼び出した場合、addしたイベントについてのhasEventListenerの結果はtrueであること');

				ret = item.removeEventListener('change', changeListener);
				strictEqual(ret, undefined,
						'指定したイベントに指定した関数インスタンスが登録されてる時、removeEventListenerの戻り値はundefinedであること');

				ret = item.hasEventListener('change', changeListener);
				strictEqual(
						ret,
						false,
						'removeEventListenerにaddEventListenerしたイベント名とハンドラを渡すと、そのイベントとハンドラについてのhasEventListenerの結果はfalseになること');
			});

	test('removeEventListener 異常系', function() {
	//TODO removeEventListenerの引数チェックを確認する
	});

	test('addEventListenerで"change"イベントに登録したハンドラだけが実行され、removeEventListenerされたハンドラは実行されなくなること。',
			function() {
				// イベントをaddする
				var changeListener1 = function() {
					order.push('changeListener1');
				};
				var changeListener2 = function() {
					order.push('changeListener2');
				};
				item.addEventListener('change', changeListener1);

				item.set('val', sequence.next());

				deepEqual(order, ['changeListener1'],
						'addEventListenerの"change"にハンドリングした関数が実行されていること');

				order = [];
				item.addEventListener('change', changeListener1);
				item.set('val', sequence.next());

				deepEqual(order, ['changeListener1'],
						'addEventListenerの"change"に同じ関数を2度ハンドリングしても一度だけ実行されること');

				order = [];
				item.addEventListener('change', changeListener2);
				item.set('val', sequence.next());

				deepEqual(order, ['changeListener1', 'changeListener2'],
						'addEventListenerの"change"にさらに別の関数をハンドリングすると、addした順番で実行されること');

				order = [];
				item.removeEventListener('change', changeListener1);
				item.set('val', sequence.next());

				deepEqual(order, ['changeListener2'],
						'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				item.removeEventListener('change', changeListener2);
				item.set('val', sequence.next());

				deepEqual(order, [], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				item.addEventListener('itemsChange', changeListener2);
				item.set('val', sequence.next());

				deepEqual(order, [], 'addEventListenerの"change"以外を指定してハンドリングした関数は、実行されないこと');

				// addしたイベントを削除
				item.removeEventListener('itemsChange', changeListener1);
			});

	//=============================
	// Definition
	//=============================

	module('DataModel EventListenerの登録・削除', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			createDataModel1();
			changeListener = function() {
			//
			};
		},
		teardown: function() {
			order = [];
			argsObj = {};
			sequence = null;
			dataModel1 = null;
			dropAllModel(manager);
			changeListener = null;
		}
	});

	//=============================
	// Body
	//=============================
	test('addEventListener 正常系', function() {
		//TODO window.addEventListenerと同じで、何いれても(引数が2つさえあれば)エラー出ない？？
		var validArgs = [['change', changeListener], ['itemsChange', changeListener],
				['change', undefined], [false, false], [undefined, undefined]];
		var l = validArgs.length
		for ( var i = 0; i < l; i++) {
			var ret = dataModel1.addEventListener(validArgs[i][0], validArgs[i][1]);
			strictEqual(ret, undefined,
					'addEventListenerの戻り値はundefinedであること。引数が2つ指定されていればエラーにはならないこと');
			dataModel1.removeEventListener(validArgs[i][0], validArgs[i][1]);
		}
		expect(l);
	});


	test('addEventListener 異常系', function() {
		//TODO エラーコード確認する
		var errCode// = ERR.ERR_CODE_XXX;
		try {
			dataModel1.addEventListener('cnahge');
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, 'addEventListenerの引数にイベント名だけ渡した時、エラーになること');
		}
		try {
			item.addEventListener(function() {});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, 'addEventListenerの引数にハンドラだけ渡した時、エラーになること');
		}
	});

	test('hasEventListener 正常系', 5, function() {
		var ret = dataModel1.hasEventListener('itemsChange', changeListener);
		strictEqual(ret, false, 'addEventListenerする前のhasEventListenerの結果はfalseであること');

		dataModel1.addEventListener('itemsChange', changeListener);
		ret = dataModel1.hasEventListener('itemsChange', changeListener);
		strictEqual(ret, true,
				'addEventListenerした後、addしたイベントとハンドラのインスタンスをhasEventListenerに渡した時、結果はtrueであること');

		ret = dataModel1.hasEventListener('itemsChange', function() {});
		strictEqual(ret, false,
				'addEventListenerに渡したインスタンスと異なるインスタンスをhasEventListenerに渡した場合、結果はfalseであること');

		ret = dataModel1.hasEventListener('change', changeListener);
		strictEqual(ret, false,
				'addEventListenerに渡したイベント名と異なるイベント名をhasEventListenerに渡した場合、結果はfalseであること');

		dataModel1.removeEventListener('change', changeListener);
		ret = dataModel1.hasEventListener('change', changeListener);
		strictEqual(ret, false, 'removeEventListenerすると、hasEventListenerの結果はfalseであること');
	});

	test('hasEventListener 異常系', function() {
	//TODO hasEventListenerの引数チェックを確認する
	});

	test(
			'removeEventListener 正常系',
			function() {

				var ret = dataModel1.removeEventListener('change', changeListener);
				strictEqual(ret, undefined,
						'指定したイベントに指定した関数インスタンスが登録されていない時、removeEventListenerの戻り値はundefinedであること');

				dataModel1.addEventListener('change', changeListener);

				dataModel1.removeEventListener('itemsChange', changeListener);
				ret = dataModel1.hasEventListener('change', changeListener);
				strictEqual(
						ret,
						true,
						'addEventListenerに渡したイベント名と異なるイベント名をremoveEventListenerに渡して呼び出した場合、addしたイベントについてのhasEventListenerの結果はtrueであること');

				dataModel1.removeEventListener('change', function() {
				//
				});
				ret = dataModel1.hasEventListener('change', changeListener);
				strictEqual(
						ret,
						true,
						'addEventListenerに渡したハンドラと異なるハンドラをremoveEventListenerに渡して呼び出した場合、addしたイベントについてのhasEventListenerの結果はtrueであること');

				ret = dataModel1.removeEventListener('change', changeListener);
				strictEqual(ret, undefined,
						'指定したイベントに指定した関数インスタンスが登録されてる時、removeEventListenerの戻り値はundefinedであること');

				ret = dataModel1.hasEventListener('change', changeListener);
				strictEqual(
						ret,
						false,
						'removeEventListenerにaddEventListenerしたイベント名とハンドラを渡すと、そのイベントとハンドラについてのhasEventListenerの結果はfalseになること');
			});

	test('removeEventListener 異常系', function() {
	//TODO removeEventListenerの引数チェックを確認する
	});
	test('addEventListenerで"itemsChange"イベントに登録したハンドラが実行され、removeEventListenerすると実行されなくなること。', 6,
			function() {
				var changeListener1 = function() {
					order.push('itemsChange');
				};
				var changeListener2 = function() {
					order.push('itemsChange2');
				};
				dataModel1.addEventListener('itemsChange', changeListener1);
				dataModel1.create({
					id: sequence.next()
				});

				deepEqual(order, ['itemsChange'],
						'addEventListenerの"itemsChange"にハンドリングした関数が実行されていること');

				order = [];
				dataModel1.addEventListener('itemsChange', changeListener1);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange'],
						'addEventListenerの"itemsChange"に同じ関数を2度ハンドリングしても一度だけ実行されること');

				order = [];
				dataModel1.addEventListener('itemsChange', changeListener2);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange', 'itemsChange2'],
						'addEventListenerの"itemsChange"にさらに別の関数をハンドリングすると、addした順番で実行されること');

				order = [];
				dataModel1.removeEventListener('itemsChange', changeListener2);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange'], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				dataModel1.removeEventListener('itemsChange', changeListener1);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, [], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				dataModel1.addEventListener('change', changeListener1);
				dataModel1.val = sequence.next();

				deepEqual(order, [], 'addEventListenerの"itemsChange"以外を指定してハンドリングした関数は、実行されないこと');

				// addしたイベントを削除
				dataModel1.removeEventListener('change', changeListener1);
				dataModel1.removeEventListener('change', changeListener2);
			});

	//=============================
	// Definition
	//=============================

	module('DataManager EventListenerの登録・削除', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			createDataModel1();
			changeListener = function() {};
		},
		teardown: function() {
			order = [];
			argsObj = {};
			sequence = null;
			dataModel1 = null;
			changeListener = null;
			dropAllModel(manager);
		}
	});


	//=============================
	// Body
	//=============================
	test('addEventListener 正常系', function() {
		var validArgs = [['change', changeListener], ['itemsChange', changeListener],
				['change', undefined], [false, false], [undefined, undefined]];
		var l = validArgs.length
		for ( var i = 0; i < l; i++) {
			var ret = manager.addEventListener(validArgs[i][0], validArgs[i][1]);
			strictEqual(ret, undefined,
					'addEventListenerの戻り値はundefinedであること。引数が2つ指定されていればエラーにはならないこと');
			manager.removeEventListener(validArgs[i][0], validArgs[i][1]);
		}
		expect(l);
	});


	test('addEventListener 異常系', function() {
		//TODO エラーコード確認する
		var errCode// = ERR.ERR_CODE_XXX;
		try {
			manager.addEventListener('itemsCnahge');
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, 'addEventListenerの引数にイベント名だけ渡した時、エラーになること');
		}
		try {
			manager.addEventListener(function() {});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, 'addEventListenerの引数にハンドラだけ渡した時、エラーになること');
		}
	});

	test('hasEventListener 正常系', 5, function() {
		var ret = manager.hasEventListener('itemsChange', changeListener);
		strictEqual(ret, false, 'addEventListenerする前のhasEventListenerの結果はfalseであること');

		manager.addEventListener('itemsChange', changeListener);
		ret = manager.hasEventListener('itemsChange', changeListener);
		strictEqual(ret, true,
				'addEventListenerした後、addしたイベントとハンドラのインスタンスをhasEventListenerに渡した時、結果はtrueであること');

		ret = manager.hasEventListener('itemsChange', function() {});
		strictEqual(ret, false,
				'addEventListenerに渡したインスタンスと異なるインスタンスをhasEventListenerに渡した場合、結果はfalseであること');

		ret = manager.hasEventListener('change', changeListener);
		strictEqual(ret, false,
				'addEventListenerに渡したイベント名と異なるイベント名をhasEventListenerに渡した場合、結果はfalseであること');

		manager.removeEventListener('change', changeListener);
		ret = manager.hasEventListener('change', changeListener);
		strictEqual(ret, false, 'removeEventListenerすると、hasEventListenerの結果はfalseであること');
	});

	test('hasEventListener 異常系', function() {
	//TODO hasEventListenerの引数チェックを確認する
	});

	test(
			'removeEventListener 正常系',
			function() {

				var ret = manager.removeEventListener('change', changeListener);
				strictEqual(ret, undefined,
						'指定したイベントに指定した関数インスタンスが登録されていない時、removeEventListenerの戻り値はundefinedであること');

				manager.addEventListener('change', changeListener);

				manager.removeEventListener('itemsChange', changeListener);
				ret = manager.hasEventListener('change', changeListener);
				strictEqual(
						ret,
						true,
						'addEventListenerに渡したイベント名と異なるイベント名をremoveEventListenerに渡して呼び出した場合、addしたイベントについてのhasEventListenerの結果はtrueであること');

				manager.removeEventListener('change', function() {
				//
				});
				ret = manager.hasEventListener('change', changeListener);
				strictEqual(
						ret,
						true,
						'addEventListenerに渡したハンドラと異なるハンドラをremoveEventListenerに渡して呼び出した場合、addしたイベントについてのhasEventListenerの結果はtrueであること');

				ret = manager.removeEventListener('change', changeListener);
				strictEqual(ret, undefined,
						'指定したイベントに指定した関数インスタンスが登録されてる時、removeEventListenerの戻り値はundefinedであること');

				ret = manager.hasEventListener('change', changeListener);
				strictEqual(
						ret,
						false,
						'removeEventListenerにaddEventListenerしたイベント名とハンドラを渡すと、そのイベントとハンドラについてのhasEventListenerの結果はfalseになること');
			});

	test('removeEventListener 異常系', function() {
	//TODO hasEventListenerの引数チェックを確認する
	});

	test('addEventListenerで"itemsChange"イベントに登録したハンドラが実行され、removeEventListenerすると実行されなくなること。', 6,
			function() {
				var changeListener1 = function() {
					order.push('itemsChange');
				};
				var changeListener2 = function() {
					order.push('itemsChange2');
				};
				manager.addEventListener('itemsChange', changeListener1);
				dataModel1.create({
					id: sequence.next()
				});

				deepEqual(order, ['itemsChange'],
						'addEventListenerの"itemsChange"にハンドリングした関数が実行されていること');

				order = [];
				manager.addEventListener('itemsChange', changeListener1);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange'],
						'addEventListenerの"itemsChange"に同じ関数を2度ハンドリングしても一度だけ実行されること');

				order = [];
				manager.addEventListener('itemsChange', changeListener2);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange', 'itemsChange2'],
						'addEventListenerの"itemsChange"にさらに別の関数をハンドリングすると、addした順番で実行されること');

				order = [];
				manager.removeEventListener('itemsChange', changeListener2);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange'], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				manager.removeEventListener('itemsChange', changeListener1);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, [], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				manager.addEventListener('change', changeListener1);
				dataModel1.val = sequence.next();

				deepEqual(order, [], 'addEventListenerの"itemsChange"以外を指定してハンドリングした関数は、実行されないこと');

				// addしたイベントを削除
				manager.removeEventListener('change', changeListener1);
				manager.removeEventListener('change', changeListener2);
			});

	//=============================
	// Definition
	//=============================

	// イベントハンドラ
	var changeListener1 = changeListener2 = changeListener3 = null;
	// データアイテムインスタンス
	var item2 = null;

	module('イベント発火のタイミング', {
		setup: function() {
			sequence = h5.core.data
					.createSequence(100, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			// dataModel1の作成
			createDataModel1();
			// dataModel2の作成 TODO 関数呼び出しで作成するようにする
			dataModel2 = manager.createModel({
				name: 'TestDataModel2',
				schema: {
					id: {
						id: true
					},
					val: {},
					val2: {}
				}
			});
			item = dataModel1.create({
				id: sequence.next(),
				val: 1
			});
			item2 = dataModel1.create({
				id: sequence.next(),
				val2: 2
			});

			changeListener1 = function(arg) {
				order.push('manager');
				argsObj = argsObj || {};
				argsObj['manager'] = arg;
			}
			changeListener2 = function(arg) {
				order.push('model');
				argsObj = argsObj || {};
				argsObj['model'] = arg;
			}

			changeListener3 = function(arg) {
				order.push('item');
				argsObj = argsObj || {};
				argsObj['item'] = arg;
			}

			manager.addEventListener('itemsChange', changeListener1);
			dataModel1.addEventListener('itemsChange', changeListener2);
			item.addEventListener('change', changeListener3);
		},
		teardown: function() {
			// addしたイベントを削除
			manager.removeEventListener('itemsChange', changeListener1);
			dataModel1.removeEventListener('itemsChange', changeListener2);
			item.removeEventListener('change', changeListener3);

			order = [];
			sequence = null;
			dataModel1 = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================
	test('DataItemの値代入時(または値変更後のrefresh時)にイベントハンドラが実行されること', 2, function() {
		item.set('val', sequence.next());

		deepEqual(order, ['item', 'model', 'manager'], 'データアイテム、データモデル、データマネージャの順でイベントが発火すること');

		order = [];
		item.set('val', item.val);

		deepEqual(order, [], '代入しても値が変わっていない場合はchangeイベントが発火しないこと');
	});

	test('DataItemのcreateで値の変更があった時にchangeイベントハンドラが実行されること', 6, function() {
		var id = item.id;
		dataModel1.create({
			id: id,
			val: 'test'
		});

		deepEqual(order, ['item', 'model', 'manager'], 'データアイテム、データモデル、データマネージャの順でイベントが発火すること');
		order = [];

		dataModel1.create({
			id: id,
			val: 'test'
		});
		deepEqual(order, [], '値が変わっていないときはハンドラが実行されないこと');
		order = [];

		dataModel1.create([{
			id: id,
			val: 'test'
		}, {
			id: id,
			val: 'test2'
		}, {
			id: id,
			val: 'test'
		}]);
		deepEqual(order, [], 'createに配列で引数を渡して、最終的に値が変わっていなければイベントハンドラは実行されないこと');
		order = [];

		dataModel1.create([{
			id: id,
			val: 'test'
		}, {
			id: id,
			val: 'test2'
		}, {
			id: id,
			val: 'test3'
		}]);
		deepEqual(order, ['item', 'model', 'manager'],
				'createに配列で引数を渡して、最終的に値が変わった時、データアイテム、データモデル、データマネージャの順で一度ずつイベントが発火すること');
		order = [];

		try {
			item.set('id', {});
		} finally {
			deepEqual(order, [], 'プロパティ代入時(refresh時に)エラーが発生た場合は、ハンドラは実行されないこと');
		}
		order = [];

		item2.set('val', 'a');
		deepEqual(order, ['model', 'manager'],
				'addEventListenerしていないデータアイテムの値を変更した時、モデル、マネージャのイベントだけ拾えること');
		order = [];
	});

	test(
			'DataItemのbeginUpdate-endUpdateの間で値の変更があった時に、endUpdate時にchangeイベントハンドラが実行されること',
			function() {
				manager.beginUpdate();
				item.set('val', 'aaaa');
				deepEqual(order, [], 'begin/endUpdateの中ではプロパティを変更(refresh)してもイベントハンドラは呼ばれないこと');
				order = [];
				item.set('val', 'cccc');
				manager.endUpdate();

				deepEqual(order, ['item', 'model', 'manager'],
						'begin/endUpdateの中でプロパティを変更し、endUpdate時にbegin時と比べて変更されていた場合はイベントハンドラが1回だけ呼ばれること');
				order = [];

				manager.beginUpdate();
				item.set('val', 'bbbb');
				item.set('val', 'cccc');
				manager.endUpdate();
				deepEqual(order, [],
						'begin/endUpdateの中でプロパティを変更し、endUpdate時にbegin時と比べて変更されていない場合はイベントハンドラは呼ばれないこと');

				order = [];
				manager.beginUpdate();
				item.set('val', sequence.next());
				item.set('val2', sequence.next());
				manager.endUpdate();
				deepEqual(order, ['item', 'model', 'manager'],
						'二つのプロパティを変更した場合、endUpdateのタイミングで、登録したイベントハンドラが1回だけ呼ばれること');
			});

	test(
			'DataItemのbeginUpdate-endUpdateの間で値の変更があった時に、endUpdate時に登録されているchangeイベントハンドラだけが実行されること',
			function() {
				manager.beginUpdate();
				item.set('val', 'aaaa');
				manager.removeEventListener('itemsChange', changeListener1);
				dataModel1.removeEventListener('itemsChange', changeListener2);
				item.removeEventListener('change', changeListener3);
				manager.endUpdate();

				deepEqual(order, [],
						'begin/endUpdateの中でDataItemのイベントハンドラを削除した場合、DataItemのイベントハンドラは実行されないこと。');

				order = [];

				manager.beginUpdate();
				item.set('val', 'bbbb');

				manager.addEventListener('itemsChange', changeListener1);
				dataModel1.addEventListener('itemsChange', changeListener2);
				item.removeEventListener('change', changeListener3);

				item.set('val', 'cccc');
				manager.endUpdate();
				deepEqual(order, ['item', 'model', 'manager'],
						'begin/endUpdateの中でaddEventListenerをした場合、プロパティがbeginUpdate時と値が変わっていればイベントハンドラが実行されること');

				order = [];
				manager.beginUpdate();
				item.set('val', 'bbbb');
				item.addEventListener('change', changeListener3);
				item.set('val', 'cccc');
				manager.endUpdate();
				deepEqual(order, ['item', 'model', 'manager'],
						'begin/endUpdateの中でaddEventListenerをした場合、プロパティがbeginUpdate時と値が変わっていなければイベントハンドラは実行されないこと');

				item.addEventListener('change', changeListener3);
				order = [];
				manager.beginUpdate();
				item.set('val', sequence.next());
				item.set('val2', sequence.next());
				manager.endUpdate();
				deepEqual(order, ['item', 'model', 'manager'],
						'二つのプロパティを変更ても場合は、endUpdateのタイミングで、登録したイベントハンドラが1回だけ呼ばれること');
			});

	test('DataItemで、型の自動変換が行われるものについて、変更後が代入前と同じ値ならchangeイベントは発火しないこと', 2, function() {
		var model = manager.createModel({
			name: 'Model',
			schema: {
				id: {
					id: true
				},
				numVal: {
					type: 'number'
				}
			}
		});

		var testItem = model.create({
			id: sequence.next(),
			numVal: 1
		});

		order = [];


		model.addEventListener('itemsChange', changeListener2);
		testItem.addEventListener('change', changeListener3);

		testItem.numVal = '1';
		testItem.refresh();
		deepEqual(order, [], '値が型変換されると変更前と変更後が同じになる場合はイベントが発火しないこと');
		order = [];

		testItem.numVal = new Number(1);
		testItem.refresh();
		deepEqual(order, [], '値が型変換されると変更前と変更後が同じになる場合はイベントが発火しないこと');
	});



	test('DataItem生成のタイミングで、DataModel、DataManagerのitemsChangeイベントが発火すること', 3, function() {
		dataModel1.create({
			id: sequence.next()
		});
		deepEqual(order, ['model', 'manager'], 'アイテムの生成で"itemsChange"にハンドリングした関数が実行されていること');
		order = [];

		var idA = sequence.next();
		var idB = sequence.next();
		dataModel1.create([{
			id: idA
		}, {
			id: idB
		}]);
		deepEqual(order, ['model', 'manager'],
				'1回のcreateで2つのDataItemを生成した時、"itemsChange"にハンドリングした関数が1回だけ実行されていること');
		order = [];

		dataModel1.create([{
			id: idA
		}, {
			id: idB
		}]);
		deepEqual(order, [], 'createにすでに存在するidで値の変更もないオブジェクトを入れた場合は、itemsChangeイベントは発火しないこと');
		order = [];
	});

	test('DataItem削除時に、DataModel、DataManagerのitemsChangeイベントが発火すること', 3, function() {
		var id = sequence.next();
		dataModel1.create({
			id: id
		});
		order = [];

		dataModel1.remove(id);
		deepEqual(order, ['model', 'manager'],
				'DataModelからDataItemを削除した時、DataModelのitemsChangeイベントハンドラが実行されること');

		var id2 = sequence.next();
		dataModel1.create({
			id: id2
		});
		order = [];

		dataModel1.remove([id, , 'noExistId', id2]);
		deepEqual(order, ['model', 'manager'],
				'DataModelからDataItemを２つ削除した時、DataModelのitemsChangeイベントハンドラが１回だけ実行されること');
		order = [];

		dataModel1.remove('noExistId');
		deepEqual(order, [], 'removeを呼んだが削除するものがなかった時、DataModelのitemsChangeイベントハンドラは実行されないこと');
	});


	//TODO 8/13メモ： DataModelの作成、削除時には、itemsChangeイベントじゃなくて、別のイベントが発火する仕様にする
	//
	//	test('DataModel作成時に、ManagerのitemsChangeイベントが発火すること', function() {
	//		manager.createModel({
	//			name: 'AModel',
	//			schema: {
	//				id: {
	//					id: true
	//				}
	//			}
	//		});
	//		deepEqual(order, ['manager'], 'データモデル生成時にDataManagerのitemsChangeイベントハンドラが実行されること');
	//		order = [];
	//
	//		manager.beginUpdate();
	//		manager.createModel({
	//			name: 'BModel',
	//			schema: {
	//				id: {
	//					id: true
	//				}
	//			}
	//		});
	//		deepEqual(order, [], 'begin-end内では、DataManagerのitemsChangeイベントハンドラは実行されないこと');
	//		manager.createModel({
	//			name: 'CModel',
	//			schema: {
	//				id: {
	//					id: true
	//				}
	//			}
	//		});
	//		manager.endUpdate();
	//		deepEqual(order, ['manager'],
	//				'begin-end内で2つデータモデルを生成した時にendUpdate時にDataManagerのitemsChangeイベントハンドラが実行されること');
	//		order = [];
	//	});
	//
	//	test('DataModel削除時に、ManagerのitemsChangeイベントが発火すること', function() {
	//		manager.createModel({
	//			name: 'AModel',
	//			schema: {
	//				id: {
	//					id: true
	//				}
	//			}
	//		});
	//		order = [];
	//
	//
	//		manager.createModel({
	//			name: 'AModel',
	//			schema: {
	//				id: {
	//					id: true
	//				}
	//			}
	//		});
	//		manager.createModel({
	//			name: 'BModel',
	//			schema: {
	//				id: {
	//					id: true
	//				}
	//			}
	//		});
	//		order = [];
	//
	//		manager.beginUpdate();
	//		manager.dropModel('AModel');
	//		manager.dropModel('BModel');
	//		deepEqual(order, [],
	//				'begin-end内でデータモデル削除しても、endUpdate前にDataManagerのitemsChangeイベントハンドラは実行されないこと');
	//		manager.endUpdate();
	//
	//		deepEqual(order, ['manager'],
	//				'begin-end内でデータモデル削除した時、endUpdate時にDataManagerのitemsChangeイベントハンドラが実行されること');
	//
	//		manager.beginUpdate();
	//		deepEqual(order, [], 'begin-end内では、DataManagerのitemsChangeイベントハンドラは実行されないこと');
	//		manager.createModel({
	//			name: 'CModel',
	//			schema: {
	//				id: {
	//					id: true
	//				}
	//			}
	//		});
	//		manager.dropModel('CModel');
	//		manager.endUpdate();
	//		deepEqual(order, ['manager'],
	//				'begin-end内でデータモデルを生成して削除た時に、endUpdate時にDataManagerのitemsChangeイベントハンドラが実行されること');
	//		order = [];
	//	});


	//=============================
	// Definition
	//=============================

	// イベントオブジェクトを格納する変数
	var argsObj = {};
	module('イベントオブジェクトの確認', {
		setup: function() {
			sequence = h5.core.data
					.createSequence(100, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			// dataModel1の作成
			createDataModel1();
			// dataModel2の作成 TODO 関数呼び出しで作成するようにする
			dataModel2 = manager.createModel({
				name: 'TestDataModel2',
				schema: {
					id: {
						id: true
					},
					val: {},
					val2: {}
				}
			});
			item = dataModel1.create({
				id: sequence.next(),
				val: 1
			});
			item2 = dataModel1.create({
				id: sequence.next(),
				val2: 2
			});

			changeListener1 = function(arg) {
				order.push('manager');
				argsObj = argsObj || {};
				argsObj['manager'] = arg;
			}
			changeListener2 = function(arg) {
				order.push('model');
				argsObj = argsObj || {};
				argsObj['model'] = arg;
			}

			changeListener3 = function(arg) {
				order.push('item');
				argsObj = argsObj || {};
				argsObj['item'] = arg;
			}

			manager.addEventListener('itemsChange', changeListener1);
			dataModel1.addEventListener('itemsChange', changeListener2);
			item.addEventListener('change', changeListener3);
		},
		teardown: function() {
			// addしたイベントを削除
			manager.removeEventListener('itemsChange', changeListener1);
			dataModel1.removeEventListener('itemsChange', changeListener2);
			item.removeEventListener('change', changeListener3);

			order = [];
			sequence = null;
			dataModel1 = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================
	test('DataItemインスタンスの"change"に登録したハンドラが受け取る引数に正しく情報が格納されていること', function() {
		var listener = function(arg) {
			argsObj.item2 = arg;
		};
		item.addEventListener('change', listener);



		var orgVal = item.val;

		item.set('val', 'test');

		var arg = argsObj.item;
		ok(typeof arg === 'object', '値を変更してrefresh()したとき、イベントハンドラが実行され、changeイベントオブジェクトが取得できること');
		strictEqual(arg.type, 'change', 'changeイベントオブジェクトのtypeプロパティは"change"であること');
		strictEqual(arg.target, item, 'changeイベントオブジェクトのtargetプロパティはDataItemインスタンスであること');
		deepEqual(arg.props, {
			val: {
				oldValue: orgVal,
				newValue: 'test'
			}
		}, 'changeイベントオブジェクトのpropsプロパティに、変更されたプロパティについてoldValue,newValueが正しく格納されていること');
		strictEqual(arg, argsObj.item2,
				'イベントハンドラが二つ登録されているとき、どちらのハンドラにも同じインスタンスのchangeイベントオブジェクトが渡されること');

		// 引数を格納するオブジェクト変数のリセット
		argsObj = {};

		// itemの二つ目のハンドラを削除
		item.removeEventListener('change', listener);

		manager.beginUpdate();
		item.set('val', '変更途中');
		item.set('val2', 'ABC2');
		item.set('val', 'ABC');
		manager.endUpdate();

		arg = argsObj.item;

		ok(typeof arg === 'object',
				'beginUpdate/endUpdateの間で値を変更した時、イベントハンドラが実行され、changeイベントオブジェクトが取得できること');
		strictEqual(arg.type, 'change', 'changeイベントオブジェクトのtypeプロパティは"change"であること');
		strictEqual(arg.target, item, 'changeイベントオブジェクトのtargetプロパティはDataItemインスタンスであること');
		deepEqual(arg.props, {
			val: {
				oldValue: 'test',
				newValue: 'ABC'
			},
			val2: {
				oldValue: null,
				newValue: 'ABC2'
			},
		}, 'changeイベントオブジェクトのpropsプロパティに、変更されたプロパティについてoldValue,newValueが正しく格納されていること');

		argsObj = {};

		var id = item.id;
		dataModel1.create({
			id: id,
			val: '変更途中',
			val2: '変更途中'
		}, {
			id: id,
			val: 'AAAA',
			val2: 'BBBB'
		});
		ok(typeof arg === 'object', 'createので値を変更した時、イベントハンドラが実行され、changeイベントオブジェクトが取得できること');
		strictEqual(arg.type, 'change', 'changeイベントオブジェクトのtypeプロパティは"change"であること');
		strictEqual(arg.target, item, 'changeイベントオブジェクトのtargetプロパティはDataItemインスタンスであること');
		deepEqual(arg.props, {
			val: {
				oldValue: 'test',
				newValue: 'AAAA'
			},
			val2: {
				oldValue: null,
				newValue: 'BBBB'
			},
		}, 'changeイベントオブジェクトのpropsプロパティに、変更されたプロパティについてoldValue,newValueが正しく格納されていること');

		argsObj = {};
	});


	test('DataModelインスタンスの"itemsChange"に登録したハンドラが受け取る引数に正しく情報が格納されていること createdプロパティの確認',
			function() {
				var item = dataModel1.create({
					id: sequence.next()
				});
				var arg = argsObj['model'];

				strictEqual(arg.type, 'itemsChange', 'typeプロパティにイベント名"itemsChange"が格納されていること');
				strictEqual(arg.target, dataModel1, 'targetプロパティにデータモデルのインスタンスが格納されていること');
				deepEqual(arg.changed, [], 'changedプロパティは空配列であること');
				deepEqual(arg.created, [item], 'createdプロパティに、生成されたアイテムのインスタンスが格納されていること');
				deepEqual(arg.recreated, {}, 'recreatedプロパティは空オブジェクトであること');
				deepEqual(arg.removed, [], 'changedプロパティは空配列であること');

				argsObj = {};
				var items = dataModel1.create([{
					id: sequence.next()
				}, {
					id: sequence.next()
				}]);
				var arg = argsObj['model'];

				deepEqual(arg.changed, [], 'changedプロパティは空配列であること');
				// createdの順番は問わないので、順序がitems(createの戻り値)と順序が違ってもテスト通るようにする
				// 配列中の要素についてインスタンスが等しいかで比較(===)で比較する
				equalsArrayIgnoreOrder(arg.created, items,
						'createdプロパティに、生成されたアイテムのインスタンスが格納されていること');
				deepEqual(arg.recreated, {}, 'recreatedプロパティは空オブジェクトであること');
				deepEqual(arg.removed, [], 'changedプロパティは空配列であること');
			});

	test('DataModelインスタンスの"itemsChange"に登録したハンドラが受け取る引数に正しく情報が格納されていること changedプロパティの確認',
			function() {
				var item = dataModel1.create({
					id: '1'
				});
				argsObj = {};
				// itemsChangeベントオブジェクトのchangeと比較するため、changeイベントオブジェクトをとっておく。
				var changeArgs = [];
				item.addEventListener('change', function(arg) {
					changeArgs.push(arg);
				});
				item.set('val', 'test');
				var arg = argsObj['model'];

				strictEqual(arg.changed[0], changeArgs[0],
						'changedプロパティに、変更したアイテムのchangeイベントオブジェクトが格納されていること');
				deepEqual(arg.created, [], 'createdプロパティは空配列であること');
				deepEqual(arg.recreated, {}, 'recreatedプロパティは空オブジェクトであること');
				deepEqual(arg.removed, [], 'changedプロパティは空配列であること');

				dataModel1.create({
					id: '2'
				}).addEventListener('change', function(arg) {
					changeArgs.push(arg);
				});

				argsObj = {};
				changeArgs = [];
				dataModel1.create([{
					id: '1',
					val: 'AAA'
				}, {
					id: '2',
					val: 'BBB'
				}]);
				arg = argsObj['model'];
				// changeイベントオブジェクトがitemsChangeイベントオブジェクトのchangedに入っていることを確認する。
				// 複数ある場合、格納される順番は問わないので、格納されている順序が違っていてもテストが通るようにする
				// インスタンスは違ってていいので、deepで比較するよう指定する
				equalsArrayIgnoreOrder(arg.changed, changeArgs,
						'changedプロパティに、変更したアイテムインスタンスが格納されていること', true);
				deepEqual(arg.created, [], 'createdプロパティは空配列であること');
				deepEqual(arg.recreated, {}, 'recreatedプロパティは空オブジェクトであること');
				deepEqual(arg.removed, [], 'changedプロパティは空配列であること');
			});

	test('DataModelインスタンスの"itemsChange"に登録したハンドラが受け取る引数に正しく情報が格納されていること recreatedの確認', 8,
			function() {
				var items = dataModel1.create([{
					id: '1'
				}, {
					id: '2'
				}]);
				var oldItem = items[0];
				var oldItem2 = items[1];
				var newItem = newItem2 = null;

				manager.beginUpdate();
				// 削除して、そのIDのオブジェクトをまたcreateする
				dataModel1.remove('1');
				newItem = dataModel1.create({
					id: '1',
					val: 1
				});
				manager.endUpdate();

				var arg = argsObj['model'];

				deepEqual(arg.changed, [], 'changedプロパティは空配列であること');
				deepEqual(arg.created, [], 'createdプロパティは空配列であること');
				deepEqual(arg.recreated, {
					'1': {
						oldItem: oldItem,
						newItem: newItem
					}
				}, 'recreatedプロパティに、削除されたインスタンスと、再生成されたインスタンスが格納されていること');
				deepEqual(arg.removed, [], 'removedプロパティは空配列であること');
				argsObj = {};

				oldItem = newItem;

				manager.beginUpdate();
				// 削除して、そのIDのオブジェクトをまたcreateする
				dataModel1.remove(['1', '2']);
				newItem = dataModel1.create({
					id: '1'
				});
				newItem2 = dataModel1.create({
					id: '2'
				});
				manager.endUpdate();

				var arg = argsObj['model'];

				deepEqual(arg.changed, [], 'changedプロパティは空配列であること');
				deepEqual(arg.created, [], 'createdプロパティは空配列であること');
				deepEqual(arg.recreated, {
					'1': {
						oldItem: oldItem,
						newItem: newItem
					},
					'2': {
						oldItem: oldItem2,
						newItem: newItem2
					}
				}, 'recreatedプロパティに、削除されたインスタンスと、再生成されたインスタンスが格納されていること');
				deepEqual(arg.removed, [], 'removedプロパティは空配列であること');
			});

	test('DataModelインスタンスの"itemsChange"に登録したハンドラが受け取る引数に正しく情報が格納されていること 複数のプロパティに変更情報が格納される場合',
			function() {
				var items = dataModel1.create([{
					id: '1'
				}, {
					id: '2'
				}, {
					id: '3'
				}]);
				var oldItem = items[0];
				var oldItem2 = items[1];
				var oldItem3 = items[2];
				var newItem = newItem2 = newItem3 = newItem4 = newItem5 = null;

				// changeイベントオブジェクトを格納する
				var changeArgs = [];
				oldItem3.addEventListener('change', function(arg) {
					changeArgs.push(arg);
				});

				manager.beginUpdate();
				// ID:1のアイテムを削除して、またcreateする
				dataModel1.remove('1');
				newItem = dataModel1.create({
					id: '1',
					val: 1
				});

				// ID:1のアイテムの値を変更する
				newItem.val = 'changed';

				// ID:2のアイテムを削除する
				dataModel1.remove('2');

				// ID:3のアイテムのIDを4にする
				oldItem3.id = 4;
				newItem4 = oldItem3;

				// ID:5のアイテムをcreateする
				newItem5 = dataModel1.create({
					id: '5'
				});

				// ID:6のアイテムをcreateしてremoveする
				dataModel1.create({
					id: '6'
				});
				dataModel1.remove('6');
				manager.endUpdate();

				var arg = argsObj['model'];

				deepEqual(arg.changed, changeArgs, 'changedプロパティにchangeイベントオブジェクトが格納されていること');
				deepEqual(arg.created, [newItem5], 'createdプロパティに生成されたDataItemインスタンスが格納されていること');
				deepEqual(arg.recreated, {
					'1': {
						oldItem: oldItem,
						newItem: newItem
					}
				}, 'recreatedプロパティに、削除されたインスタンスと、再生成されたインスタンスが格納されていること');
				deepEqual(arg.removed, [oldItem2], 'removedプロパティに削除されたインスタンスが格納されていること');
			});

	// ------------------------------------ DataManagerのイベントテスト------------------------------------
	test(
			'DataManagerインスタンスの"itemsChange"に登録したハンドラが受け取る引数に正しく情報が格納されていること',
			function() {
				// モデルを作成する
				var model1 = manager.createModel({
					name: 'AModel',
					schema: {
						id: {
							id: true
						}
					}
				});
				var model2 = manager.createModel({
					name: 'BModel',
					schema: {
						id: {
							id: true
						}
					}
				});
				var model3 = manager.createModel({
					name: 'CModel',
					schema: {
						id: {
							id: true
						}
					}
				});

				// 各モデルのitemsChangeハンドラに渡される引数を取得するため、イベントハンドラをaddする
				var args = [];
				function modelChangeListener(arg) {
					args.push(arg);
				}
				model1.addEventListener('itemsChange', modelChangeListener);
				model2.addEventListener('itemsChange', modelChangeListener);
				model3.addEventListener('itemsChange', modelChangeListener);

				// アイテムを生成してイベントを上げる
				manager.beginUpdate();
				model1.create({
					id: '1'
				});
				model2.create({
					id: '1'
				});
				manager.endUpdate();

				equalsArrayIgnoreOrder(
						argsObj.manager.models,
						args,
						'DataManagerのitemsChangeイベントオブジェクトに、変更のあったDataModelのitemsChangeイベントオブジェクトが格納されていること',
						true);
			});
	//TODO createModelやdropModelした時のイベントについてテストする
	//	test('DataManagerインスタンスの"xxx"イベントに登録したハンドラが受け取る引数に正しく情報が格納されていること', function(){
	//		//TODO
	//	});


	//=============================
	// Definition
	//=============================

	module('オブジェクト拡張(※IE8-では失敗します)', {
		setup: function() {
			sequence = h5.core.data
					.createSequence(100, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');


			// dataModel1の作成
			createDataModel1();
			// dataModel2の作成 TODO 関数呼び出しで作成するようにする
			dataModel2 = manager.createModel({
				name: 'TestDataModel2',
				schema: {
					id: {
						id: true
					},
					val: {},
					val2: {},
					num: {
						type: 'number'
					},
					int: {
						type: 'integer'
					},
					bool: {
						type: 'boolean'
					},
					str: {
						type: 'string',
						constraint: {
							notEmpty: true
						},
						defaultValue: 'str'
					}
				}
			});
			item = dataModel1.create({
				id: sequence.next(),
				val: 1
			});

			changeListener1 = function(arg) {
				order.push('manager');
				argsObj = argsObj || {};
				argsObj['manager'] = arg;
			}
			changeListener2 = function(arg) {
				order.push('model');
				argsObj = argsObj || {};
				argsObj['model'] = arg;
			}

			changeListener3 = function(arg) {
				order.push('item');
				argsObj = argsObj || {};
				argsObj['item'] = arg;
			}

			manager.addEventListener('itemsChange', changeListener1);
			dataModel1.addEventListener('itemsChange', changeListener2);
			item.addEventListener('change', changeListener3);
		},
		teardown: function() {
			// addしたイベントを削除
			manager.removeEventListener('itemsChange', changeListener1);
			dataModel1.removeEventListener('itemsChange', changeListener2);
			item.removeEventListener('change', changeListener3);

			order = [];
			sequence = null;
			dataModel1 = null;
			dropAllModel(manager);
		}
	});
	//=============================
	// Body
	//=============================
	test('DataItem.refresh()を呼び出さなくても、イベントの発火、値のチェック、型変換、が発生すること', function() {
		if (h5.env.ua.isIE && h5.env.ua.browserVersion < 9) {
			ok(false, 'IE8以下では、このテストを実行できません');
			expect(1);
			return;
		}
		item.set('val', 'AAA');
		deepEqual(order, ['item', 'model', 'manager'], '値の代入で値が変更されたとき、イベントが発火すること');
		order = [];

		item.set('val', 'AAA');
		deepEqual(order, [], '値の代入で値の変更がなかった場合、イベントは発火しないこと');
		order = [];

		var item2 = dataModel2.create({
			id: sequence.next()
		});
		item2.set('num', '12.3');
		strictEqual(item2.get('num'), 12.3, 'セット時に値の型変換が行われること');
		item2.set('num', new Number(12.3));
		strictEqual(item2.get('num'), 12.3, 'セット時に値の型変換が行われること');
		item2.set('num', new String('12.3'));
		strictEqual(item2.get('num'), 12.3, 'セット時に値の型変換が行われること');

		item2.set('int', '12');
		strictEqual(item2.get('int'), 12, 'セット時に値の型変換が行われること');
		item2.set('int', new Number(12));
		strictEqual(item2.get('int'), 12, 'セット時に値の型変換が行われること');
		item2.set('int', new String('12'));
		strictEqual(item2.get('int'), 12, 'セット時に値の型変換が行われること');

		item2.set('bool', new Boolean(1));
		strictEqual(item2.get('bool'), true, 'セット時に値の型変換が行われること');

		item2.set('str', new String('1'));
		strictEqual(item2.get('str'), '1', 'セット時に値の型変換が行われること');

		try {
			item2.set('num', 'ABC');
			ok(false, 'エラーが発生していません。typeのチェックが値のセット時に行われていません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_DESCRIPTOR,
					'セット時に値の型変換が行われ、条件を満たさない値をsetするとエラーが発生すること');
		}
		try {
			item2.set('str', '');
			ok(false, 'エラーが発生していません。constraintのチェックが値のセット時に行われていません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_DESCRIPTOR,
					'セット時に値の型変換が行われ、条件を満たさない値をsetするとエラーが発生すること');
		}
	});
});
