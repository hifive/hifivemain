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
			name: 'TestDataModel1',
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
		var invalidProps = $.isArray(ary) ? ary : [ary];
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
				var errMsg = window.JSON ? JSON.stringify(invalidProps[i]) : invalidProps;
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
		window.TestManager = undefined;
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

	test('データモデルの登録', 3, function() {
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
		strictEqual(model.getManager(), manager, 'データモデルマネージャが取得できること');
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

	module('createModel - ディスクリプタのチェック', {
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

	test('descriptorにschemaプロパティがない場合はエラーが発生すること', 1, function() {
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
			'baseにデータモデルが指定されている場合は、指定されたデータモデルのプロパティを継承し、schema指定されたプロパティと同名のものがあれば上書かれていること',
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

	test('baseにデータモデルを指定し、schemaに指定したデータモデルと同名のid:trueな属性がある場合は、上書きされてモデルが作成されること', function() {
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
		strictEqual(item.get('value'), 2, '同名のプロパティについては、baseを指定している側で設定したdefaultValueが入っていること');
		strictEqual(item.get('value2'), 1, '継承先にしかないプロパティの値を取得できること');
		strictEqual(item.get('val'), 2, 'baseを指定している側にしかないプロパティの値に指定したdefaultValueが入っていること');
	});


	test('baseに、データモデルを継承しているデータモデルを指定できること', 7, function() {
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


	test('baseの指定が文字列でない場合はエラーが発生すること', function() {
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

	test('baseを不正な文字列で指定した場合はエラーが発生すること', function() {
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

	test('baseに存在しないデータモデル名を指定した場合はエラーが発生すること', function() {
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

	test('baseに自分自身のモデル名を指定した場合はエラーが発生すること', function() {
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

	test('baseにほかのマネージャのモデルを指定できないこと', function() {
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

	test('schemaがオブジェクトでない場合はエラーが発生すること', function() {
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

	test('schemaがプロパティを持たないオブジェクト(空オブジェクト)の場合エラーが発生すること', function() {
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

	test('schemaの持つプロパティ名が不正な場合エラーが発生すること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var invalidPropNames = ['', ' ', '1a', ' abc', 'a bc'];
		for ( var i = 0, l = invalidPropNames.length; i < l; i++) {
			try {
				var schema = {
					id: {
						id: true
					}
				};
				schema[invalidPropNames[i]] = {};
				manager.createModel({
					name: 'TestDataModel',
					schema: schema
				});
				ok(false, 'テスト失敗。エラーが発生していません。プロパティ名: ' + invalidPropNames[i]);
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	});

	test('id指定されているプロパティがない場合・複数ある場合はエラーが出ること', 2, function() {
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

	test('typeに文字列以外を指定した場合はエラーが出ること', function() {
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

	test('typeに不正な文字列を指定した場合はエラーが出ること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		// TODO 不正になる文字列を確認する
		var invalidStrs = ['string|number', 'string number', 'int', 'num', 'null', 'String',
				'Number', 'Boolean', 'Object', 'Array', 'Null', 'Any', 'undefined', 'string[][]',
				'any[][]', '@string'];
		var l = invalidStrs.length;
		expect(l);

		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: invalidStrs[i]
			}, errCode);
		}
	});

	test('enumValueに配列以外を指定した場合はエラーが出ること', function() {
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

	test('enumValueに空配列、nullを含む配列、undefinedを含む配列を指定した場合はエラーが出ること', function() {
		// IE6の場合[undefined, 1]と定義するとsparseな配列として処理してしまうため、push()でundefinedを格納する
		var undefAr = [];
		undefAr.push(undefined);
		undefAr.push(1);
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var noArrays = [[], [null, 1], undefAr];
		var l = noArrays.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: 'enum',
				enumValue: noArrays[i]
			}, errCode);
		}
	});

	test('enumValueに空配列(lengthが0の配列)を指定した場合はエラーが出ること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var ary = [];
		ary['a'] = 1;
		var invalidArrays = [[], ary];
		var l = invalidArrays.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: 'enum',
				enumValue: invalidArrays[i]
			}, errCode);
		}
	});

	test('type:enumでないのにenumValueを指定した場合はエラーが出ること', 6, function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var ary = [];
		ary['a'] = 1;
		manager.createModel({
			name: 'A',
			schema: {
				id: {
					id: true
				}
			}
		});
		var notEnumTypes = ['string', 'number', 'integer', 'boolean', '@A', 'any'];
		var l = notEnumTypes.length;
		expect(l);
		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: notEnumTypes[i],
				enumValue: [1]
			}, errCode);
		}
	});

	test('enhanceにboolean以外を指定した場合はエラーが出ること', function() {
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

	test('dependに不正な値を指定した場合はエラーが出ること', function() {
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

	test('depend指定のあるプロパティにdefaultValueを設定できないこと', function() {
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
							on: 'id',
							calc: function() {
								return 0;
							}
						},
						defaultValue: 0

					}
				}
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('id指定のプロパティにdependを設定できないこと', 1, function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		try {
			manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true,
						depend: {
							on: 'v',
							calc: function() {
								return 0;
							}
						}
					},
					v: null
				}
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('dependの依存先もdepend指定されている場合、循環参照になっていなければデータモデルを作成できること', function() {
		var m = manager.createModel({
			name: 'TestDependModel',
			schema: {
				id: {
					id: true

				},
				v1: {
					depend: {
						on: ['v2', 'v3', 'v4'],
						calc: function() {
							return 0;
						}
					}
				},
				v2: {},
				v3: {
					depend: {
						on: ['v4', 'v2'],
						calc: function() {
							return 0;
						}
					}
				},
				v4: {
					depend: {
						on: 'v2',
						calc: function() {
							return 0;
						}
					}
				},
				val1: null,
				val2: {
					depend: {
						on: 'val1',
						calc: function() {
							return 0;
						}
					}
				},
				val3: {
					depend: {
						on: ['val1', 'val2'],
						calc: function() {
							return 0;
						}
					}
				}
			}
		});
		strictEqual(m.name, 'TestDependModel', 'データモデルが作成できること');
	});

	test('dependの依存先の参照が循環していた場合はエラーになること', function() {
		try {
			manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true

					},
					v1: {
						depend: {
							on: 'v1',
							calc: function() {
								return 0;
							}
						}
					}
				}
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_DESCRIPTOR, e.message);
		}
		try {
			manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true

					},
					v1: {
						depend: {
							on: 'v2',
							calc: function() {
								return 0;
							}
						}
					},
					v2: {
						depend: {
							on: 'v1',
							calc: function() {
								return 0;
							}
						}
					}
				}
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_DESCRIPTOR, e.message);
		}
		try {
			manager.createModel({
				name: 'TestDataModel2',
				schema: {
					id: {
						id: true

					},
					v1: {
						depend: {
							on: ['v2', 'v3'],
							calc: function() {
								return 0;
							}
						}
					},
					v2: {},
					v3: {
						depend: {
							on: 'v4',
							calc: function() {
								return 0;
							}
						}
					},
					v4: {
						depend: {
							on: 'v1',
							calc: function() {
								return 0;
							}
						}
					}
				}
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_DESCRIPTOR, e.message);
		}
	});


	test('constraintにオブジェクトでない値を指定した場合はエラーが出ること', function() {
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

	test('constraintの各プロパティについて正しく値を指定していない場合はエラーが出ること', function() {
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

	test('constraintの指定とtypeの指定に不整合がある場合はエラーが出ること', function() {
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
				'enum': [1, 'a', 1.1],
				constraint: invalidValues[i].constraint
			}, errCode);
		}
		testCount += l;
		expect(testCount);
	});

	test('id:trueの項目にtype:"string" または "integer"以外を指定するとエラーになること', function() {
		var errCode = ERR.ERR_CODE_INVALID_DESCRIPTOR;
		var invalidIdTypes = ['number', 'boolean', 'array', 'any', '@ParentModel', 'string[]',
				'integer[]'];
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

	test('id:trueの項目にnotNull:false, notEmpty:false, maxLength:0 を指定できないこと', function() {
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

	test('id:trueの項目にdefaultValueが設定されている場合はエラーになること', function() {
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

	test('defaultValueがtypeの条件を満たしている場合、データモデルが生成できること', 1, function() {
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
					testEnum3: {
						type: 'enum',
						defaultValue: NaN,
						enumValue: [Infinity, NaN, -Infinity]
					},
					testEnum4: {
						type: 'enum',
						defaultValue: null,
						enumValue: [1, 2, 3]
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

	test('defaultValueがtypeに指定されている型を満たさない場合はエラーになること', function() {
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
			'enum': [1, 2, 3],
			defaultValue: 4
		}, {
			type: 'enum',
			'enum': [1, 2, 3],
			defaultValue: '1'
		}, {
			type: 'enum',
			'enum': [{}, 1, 2],
			defaultValue: {}
		}, {
			type: 'enum',
			'enum': [[], 1, 2],
			defaultValue: []
		}, {
			type: 'enum[]',
			'enum': [1, 2, 3],
			defaultValue: 1
		}, {
			type: 'enum[]',
			'enum': [1, 2, 3],
			defaultValue: [2, 3, 4]
		}, {
			type: 'enum[]',
			'enum': [1, 2, 3],
			defaultValue: [[1]]
		}, {
			type: 'enum[][]',
			'enum': [1, 2, 3],
			defaultValue: [1]
		}];
		testErrorWhenCreateModelByValueProperty(invalidEnumValues, errCode);
		dropAllModel(manager2);
	});

	test('defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること number', function() {
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

	test('defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること string', function() {
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


	test('defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること integer', function() {
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


	test('defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること boolean', function() {
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

	test('defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること array', function() {
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

	test('defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること any', function() {
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
	test('defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること @DataModelName', function() {
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
	test('defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること string[]', function() {
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
	test('defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること string[][]', function() {
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

	test('descriptorと、schemaのプロパティ定義に無関係なプロパティが含まれていても、エラーにならないこと。', 1, function() {
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
					}
				}
			}
		});
		ok(model);
	});

	test('ディスクリプタを配列で指定してモデルを作成できること', 5, function() {
		var models = manager.createModel([{
			name: 'Test1',
			schema: {
				id: {
					id: true
				}
			}
		}]);
		ok(manager.models.Test1, '1つ指定して作成されていること');
		deepEqual(models, [manager.models.Test1], '戻り値は作成されたデータモデルが格納された配列であること');

		var models = manager.createModel([{
			name: 'Test2',
			schema: {
				id: {
					id: true
				}
			}
		}, {
			name: 'Test3',
			schema: {
				id: {
					id: true
				}
			}
		}]);
		ok(manager.models.Test2, '2つ指定して1つ目が作成されていること');
		ok(manager.models.Test3, '2つ指定して2つ目が作成されていること');
		deepEqual(models, [manager.models.Test2, manager.models.Test3],
				'戻り値のデータモデルの配列は引数に渡した順番で格納されていること');
	});

	test('ディスクリプタを配列で指定してモデルを作成できること。渡したディスクリプタの配列内で依存関係があっても作成されること', 8, function() {
		var models = manager.createModel([{
			name: 'Test1',
			schema: {
				id: {
					id: true
				},
				d: {
					type: '@Test2'
				}
			}
		}, {
			name: 'Test2',
			schema: {
				id: {
					id: true
				},
				v: null
			}
		}]);
		ok(manager.models.Test1, '1つ目、type指定で依存していても正しく作成されること');
		ok(manager.models.Test2, '2つ目、正しく作成されること');
		deepEqual(models, [manager.models.Test1, manager.models.Test2],
				'戻り値のデータモデルの配列は引数に渡した順番で格納されていること');
		var models = manager.createModel([{
			name: 'Test3',
			base: '@Test6',
			schema: {}
		}, {
			name: 'Test4',
			base: '@Test6',
			schema: {
				v: {
					type: '@Test3[]'
				}
			}
		}, {
			name: 'Test5',
			schema: {
				id: {
					id: true
				}
			}
		}, {
			name: 'Test6',
			schema: {
				id: {
					id: true
				},
				v: {
					type: '@Test1'
				}
			}
		}]);
		ok(manager.models.Test3, '1つ目、base指定で依存していても正しく作成されること');
		ok(manager.models.Test4, '2つ目、base, type指定で依存していても正しく作成されること');
		ok(manager.models.Test5, '3つ目、正しく作成されること');
		ok(manager.models.Test6, '4つ目、正しく作成されること');
		deepEqual(models, [manager.models.Test3, manager.models.Test4, manager.models.Test5,
				manager.models.Test6], '戻り値のデータモデルの配列は引数に渡した順番で格納されていること');
	});

	test('ディスクリプタを配列で指定した時、依存関係に循環参照があったらエラーになること', 1, function() {
		try {
			var models = manager.createModel([{
				name: 'Test3',
				base: '@Test6',
				schema: {}
			}, {
				name: 'Test4',
				base: '@Test6',
				schema: {
					v: {
						type: '@Test3'
					}
				}
			}, {
				name: 'Test5',
				schema: {
					id: {
						id: true
					}
				}
			}, {
				name: 'Test6',
				schema: {
					id: {
						id: true
					},
					v: {
						type: '@Test4'
					}
				}
			}]);
			ok(false, 'テスト失敗。エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CANNOT_CALC_DEPEND, e.message);
		}
	});

	test('ディスクリプタを配列で指定した時、存在しないデータモデル名に依存指定しているディスクリプタがあったらエラーになること', 1, function() {
		try {
			var models = manager.createModel([{
				name: 'Test3',
				base: '@Test6',
				schema: {}
			}, {
				name: 'Test4',
				base: '@Test6',
				schema: {
					v: {
						type: '@Test3'
					}
				}
			}, {
				name: 'Test5',
				schema: {
					id: {
						id: true
					}
				}
			}, {
				name: 'Test6',
				schema: {
					id: {
						id: true
					},
					v: {
						type: '@TestNoExistModel'
					}
				}
			}]);
			ok(false, 'テスト失敗。エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_DESCRIPTOR, e.message);
		}
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

	test('データモデルのドロップ', 11,
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
				var model3 = manager.createModel({
					name: 'TestDataModel3',
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
				model3.create({
					id: sequence.next(),
					val: 3
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
				strictEqual(model1.getManager(), null, 'dropModelの戻り値のmanagerプロパティはnullであること');
				strictEqual(model1.size, 1, 'dropModelの戻り値はドロップ前にcreateしたアイテムを持っており、サイズを取得できること');
				strictEqual(model1.items['1'].get('val'), 1,
						'dropModelの戻り値はドロップ前にcreateしたアイテムを持っており、値を取得できること');
				manager.dropModel('TestDataModel2');
				strictEqual(manager.models.TestDataModel2, undefined,
						'モデル2をドロップした後、モデル2がmanager.modelsの中に入っていないこと');

				manager.dropModel(model3);
				strictEqual(model3.getManager(), null, '引数にデータモデルインスタンスを渡してモデルを削除できること');
				deepEqual(manager.models, {}, '全てのモデルをドロップしたので、manager.modelsは空オブジェクトであること');

			});

	test('dropModelされたモデルでcreate/removeできないこと', 2, function() {
		var model1 = manager.createModel({
			name: 'TestDataModel1',
			schema: {
				id: {
					id: true
				},
				val: {}
			}
		});
		var item = model1.create({
			id: sequence.next(),
			val: 1
		});

		manager.dropModel(model1);

		try {
			model1.create({
				id: sequence.next()
			});
			ok(false, 'テスト失敗。エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CANNOT_CHANGE_DROPPED_MODEL, e.message);
		}
		try {
			model1.remove(item);
			ok(false, 'テスト失敗。エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CANNOT_CHANGE_DROPPED_MODEL, e.message);
		}

	});

	//=============================
	// Definition
	//=============================

	module('DataModel', {
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
			val3: 33
		}]);

		strictEqual(items[0], items[1], '同じid要素を持つオブジェクトを配列で渡した時、戻り値は同じインスタンスであること');
		strictEqual(items[0].get('val'), 1, '上書かれていないプロパティを取得できること');
		strictEqual(items[0].get('val2'), 22, '上書いたプロパティを取得できること');
		strictEqual(items[0].get('val3'), 33, '上書いたプロパティを取得できること');
	});

	test('idのtypeの指定がないモデルで、アイテムを作成できること(string指定と同様)', 5, function() {
		// idのtype:string
		model = manager.createModel({
			name: 'IdNoTypeModel',
			schema: {
				id: {
					id: true
				},
				v: {}
			}
		});
		var item = model.create({
			id: '1',
			v: 'a'
		});

		strictEqual(item.get('id'), '1', 'idが文字列の"1"のアイテムが作成でき、item.get("id")の値が文字列"1"であること');
		strictEqual(item.get('v'), 'a', '値を取得できること');
		strictEqual(model.get('1'), item, 'model.get("1")でアイテムが取得できること');
		strictEqual(model.get(1), item, 'model.get(1)でアイテムを取得できること');

		model.remove(1);
		strictEqual(model.get(1), null, 'model.remove(1)でアイテムは削除されること');
	});

	test('idのtypeにstringを指定しているモデルで、アイテムを作成できること', 5, function() {
		// idのtype:string
		var model = manager.createModel({
			name: 'IdStringModel',
			schema: {
				id: {
					id: true,
					type: 'string'
				},
				v: {}
			}
		});
		var item = model.create({
			id: '1',
			v: 'a'
		});

		strictEqual(item.get('id'), '1', 'idが文字列の"1"のアイテムが作成でき、item.get("id")の値が文字列"1"であること');
		strictEqual(item.get('v'), 'a', '値を取得できること');
		strictEqual(model.get('1'), item, 'model.get("1")でアイテムを取得できること');
		strictEqual(model.get(1), item, 'model.get(1)でアイテムを取得できること');

		model.remove(1);
		strictEqual(model.get(1), null, 'model.remove(1)でアイテムは削除されること');
	});

	test('idのtypeにintegerを指定しているモデルで、アイテムを作成できること', 5, function() {
		// idのtype:integer
		var model = manager.createModel({
			name: 'IdIntegerModel',
			schema: {
				id: {
					id: true,
					type: 'integer'
				},
				v: {}
			}
		});
		var item = model.create({
			id: 1,
			v: 'b'
		});

		strictEqual(item.get('id'), 1, 'idが数値の1のアイテムが作成でき、item.get("id")の値が数値1であること');
		strictEqual(item.get('v'), 'b', '値を取得できること');
		strictEqual(model.get('1'), item, 'model.get("1")でアイテムが取得できること');
		strictEqual(model.get(1), item, 'model.get(1)でアイテムが取得できること');

		model.remove('1');
		strictEqual(model.get(1), null, 'model.remove("1")でアイテムが削除されること');
	});

	test('idが不正な値の場合はcreateでエラーが発生すること', 18,
			function() {
				// idのtype:string
				model = manager.createModel({
					name: 'IdStringModel',
					schema: {
						id: {
							id: true
						},
						v: {}
					}
				});

				var invalidIds = [null, undefined, 1, 1.1, true, [], {}, new String('abc'), /a/];
				for ( var i = 0, l = invalidIds.length; i < l; i++) {
					try {
						model.create({
							id: invalidIds[i]
						});
						ok(false, h5.u.str.format('type:string idに{0}を指定したのにエラーが発生していません',
								invalidIds[i]));
					} catch (e) {
						if (invalidIds[i] == null || invalidIds[i] === '') {
							strictEqual(e.code, ERR.ERR_CODE_NO_ID, e.message);
						} else {
							strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
						}
					}
				}

				// idのtype:integer
				model = manager.createModel({
					name: 'IdIntegerModel',
					schema: {
						id: {
							id: true,
							type: 'integer'
						},
						v: {}
					}
				});

				invalidIds = [null, undefined, 1.1, '1.1', true, [], {}, new Number('1'), /1/];
				for ( var i = 0, l = invalidIds.length; i < l; i++) {
					try {
						model.create({
							id: invalidIds[i]
						});
						ok(false, h5.u.str.format('type;integer idに{0}を指定したのにエラーが発生していません',
								invalidIds[i]));
					} catch (e) {
						if (invalidIds[i] == null || invalidIds[i] === '') {
							strictEqual(e.code, ERR.ERR_CODE_NO_ID, e.message);
						} else {
							strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
						}
					}
				}
			});

	test('toArrayでモデルが持つアイテムが配列で取得できること', 1, function() {
		var items = dataModel1.create([{
			id: sequence.next()
		}, {
			id: sequence.next()
		}]);
		var item = dataModel1.create({
			id: sequence.next()
		});
		items.push(item);
		equalsArrayIgnoreOrder(dataModel1.toArray(), items, 'toArrayでモデルが持つアイテムが配列で取得できること');
	});

	test('createに配列を渡して、その要素のいずれかが原因でエラーが起きた場合、エラーが起きるまでの要素までは生成され、残りは生成されないこと', function() {
		try {
			dataModel1.create([{
				id: sequence.next()
			}, {
				id: null
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

	test('removeでアイテムを削除できること。引数に配列を指定した場合は複数削除できること', 17, function() {
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
		var item4 = dataModel1.create({
			id: sequence.next(),
			val: 4
		});
		strictEqual(dataModel1.has('1'), true, '削除する前はmodel.hasの結果がtrueであること');
		strictEqual(dataModel1.has('2'), true, '削除する前はmodel.hasの結果がtrueであること');
		strictEqual(dataModel1.has('3'), true, '削除する前はmodel.hasの結果がtrueであること');
		strictEqual(dataModel1.has('4'), true, '削除する前はmodel.hasの結果がtrueであること');
		strictEqual(dataModel1.size, 4, '削除する前はmodel.size()の結果が4であること');

		var item = dataModel1.remove('1');
		strictEqual(item, item1, 'removeの戻り値はDataItemインスタンスであること');

		strictEqual(dataModel1.get('1'), null, '削除したアイテムのidでgetすると戻り値がnullであること');
		strictEqual(dataModel1.has('1'), false, 'model.hasの結果がfalseになっていること');
		strictEqual(dataModel1.size, 3, 'model.sizeが1減っていること');

		dataModel1.remove(item4);
		strictEqual(dataModel1.get('4'), null, '引数にデータアイテムインスタンスを指定して削除できること');

		item = dataModel1.remove('noExistId');
		strictEqual(item, null, '存在しないIDをremoveした時の戻り値はnullであること');

		var items = dataModel1.remove(['2', 'noExistId', item3]);

		// removeの戻り値を確認する
		deepEqual(items, [item2, null, item3], 'removeに配列を渡した時の戻り値は各要素のremove結果が格納された配列であること');

		// アイテムが削除されていることを確認する
		strictEqual(dataModel1.get('2'), null, '削除したアイテムのidでgetすると戻り値がnullであること');
		strictEqual(dataModel1.has('2'), false, 'model.hasの結果がfalseになっていること');
		strictEqual(dataModel1.get('3'), null, '削除したアイテムのidでgetすると戻り値がnullであること');
		strictEqual(dataModel1.has('3'), false, 'model.hasの結果がfalseになっていること');
		strictEqual(dataModel1.size, 0, 'すべて削除したので、model.sizeが0になっていること');
	});

	test(
			'データモデルから削除されたアイテムの項目について、getはできるがsetできないこと。ObsevableArrayのプロパティについて、副作用のあるメソッドは使用できないこと。',
			8, function() {
				var model = manager.createModel({
					name: 'TestModel',
					schema: {
						id: {
							id: true
						},
						v: null,
						ary: {
							type: 'any[]'
						}
					}
				});

				var item = model.create({
					id: sequence.next(),
					v: 'a',
					ary: [1, 2, 3]
				});

				model.remove(item);
				strictEqual(item.getModel(), null, 'モデルから削除したアイテムのgetModel()がnullを返すこと');
				strictEqual(item.get('v'), 'a', '削除されたアイテムが持つプロパティの値をgetで取得できること');
				deepEqualObs(item.get('ary'), [1, 2, 3],
						'削除されたアイテムが持つプロパティの値(ObsArray)をgetで取得できること');
				deepEqual(item.get('ary').slice(0), [1, 2, 3],
						'削除されたアイテムが持つプロパティの値(ObsArray)に対してslice(0)できること');

				try {
					item.set('v', 'a');
					ok(false, 'テスト失敗。エラーが発生しませんでした。');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM, e.message);
				}
				try {
					item.set('ary', [1]);
					ok(false, 'テスト失敗。エラーが発生しませんでした。');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM, e.message);
				}
				try {
					var o = item.get('ary');
					o.push(4);
					ok(false, 'テスト失敗。エラーが発生しませんでした。');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM, e.message);
				}
				try {
					var o = item.get('ary');
					o.splice(0, 1, 1);
					ok(false, 'テスト失敗。エラーが発生しませんでした。');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM, e.message);
				}
			});

	test(
			'データマネージャから削除されたデータモデルに属するアイテムの項目について、getはできるがsetできないこと。ObsevableArrayのプロパティについて、副作用のあるメソッドは使用できないこと。',
			8, function() {
				var model = manager.createModel({
					name: 'TestModel',
					schema: {
						id: {
							id: true
						},
						v: null,
						ary: {
							type: 'any[]'
						}
					}
				});

				var item = model.create({
					id: sequence.next(),
					v: 'a',
					ary: [1, 2, 3]
				});

				manager.dropModel(model.name);
				strictEqual(model.getManager(), null, 'model.getManager()がnull');
				strictEqual(item.get('v'), 'a', '削除されたアイテムが持つプロパティの値をgetで取得できること');
				deepEqualObs(item.get('ary'), [1, 2, 3],
						'削除されたアイテムが持つプロパティの値(ObsArray)をgetで取得できること');
				deepEqual(item.get('ary').slice(0), [1, 2, 3],
						'削除されたアイテムが持つプロパティの値(ObsArray)に対してslice(0)できること');

				try {
					item.set('v', 'a');
					ok(false, 'テスト失敗。エラーが発生しませんでした。');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM, e.message);
				}
				try {
					item.set('ary', [1]);
					ok(false, 'テスト失敗。エラーが発生しませんでした。');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM, e.message);
				}
				try {
					var o = item.get('ary');
					o.push(4);
					ok(false, 'テスト失敗。エラーが発生しませんでした。');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM, e.message);
				}
				try {
					var o = item.get('ary');
					o.splice(0, 1, 1);
					ok(false, 'テスト失敗。エラーが発生しませんでした。');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM, e.message);
				}
			});

	test('id指定の項目にsetできないこと', 2, function() {
		var item = dataModel1.create({
			id: sequence.next(),
			val: 'item1'
		});
		try {
			item.set('id', 'a');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CANNOT_SET_ID, e.message);
		}
		try {
			item.set('id', item.get('id'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CANNOT_SET_ID, e.message);
		}
	});

	//=============================
	// Definition
	//=============================

	module('has', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			createDataModel1();
		},
		teardown: function() {
			sequence = null;
			dropAllModel(manager);
		}
	});

	test('hasでデータモデルがアイテムを持っているかどうか判別できること', 8, function() {
		var item = dataModel1.create({
			id: '1'
		});
		var item2 = dataModel1.create({
			id: 'true'
		});
		ok(dataModel1.has(item), 'アイテムインすタスを渡してtrueが返ってくること');
		ok(dataModel1.has(item2), 'アイテムインすタスを渡してtrueが返ってくること');
		ok(dataModel1.has('1'), 'idを渡してtrueが返ってくること');
		ok(dataModel1.has(1), 'idを数値で渡してtrueが返ってくること');
		ok(!dataModel1.has({
			id: '1'
		}), 'id:"1"を持つオブジェクトを渡すとfalseが返ってくること');
		ok(!dataModel1.has({
			id: 1
		}), 'id:1を持つオブジェクトを渡すとfalseが返ってくること');
		ok(dataModel1.has('true'), 'id:"true"のアイテムがあるので"true"を渡すとtrueが返ってくること');
		ok(!dataModel1.has(true), 'id:"true"のアイテムがあってもtrueを渡すとfalseが返ってくること');
	});

	//=============================
	// Definition
	//=============================

	module('DataItem.get, set', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			createDataModel1();
			model = manager.createModel({
				name: 'TestModel',
				schema: {
					id: {
						id: true
					},
					val: {},
					val2: {}
				}
			});
			item = model.create({
				id: sequence.next()
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
	test('getで値の取得、setで値の格納ができること', 4, function() {
		item.set('val', 'abc');
		strictEqual(item.get('val'), 'abc', 'setした値がgetで取得できること');
		var obj = item.get();
		deepEqual(obj, {
			id: item.get('id'),
			val: 'abc',
			val2: null
		}, 'get()を引数なしで呼び出すと、値の格納されたオブジェクトが返ること');

		item.set({
			val: 'ABC',
			val2: 'DEF'
		});
		deepEqual(item.get(), {
			id: item.get('id'),
			val: 'ABC',
			val2: 'DEF'
		}, 'setにオブジェクトを渡して複数のプロパティに同時に設定できること');

		obj.val = 'def';
		strictEqual(item.get('val'), 'ABC', 'get()で取得した値の格納されたオブジェクト内の値を変更してもデータアイテム内の値は変わらないこと');
	});

	test('スキーマに定義されていないプロパティに値をセットできないこと', 4, function() {
		try {
			model.create({
				id: '000001',
				val3: 'a'
			});
			ok(false, 'テスト失敗。create(新規作成)でスキーマに定義されていないプロパティにセットしたのにエラーが発生していない');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY, e.message);
		}
		try {
			model.create({
				id: item.get('id'),
				val3: 'a'
			});
			ok(false, 'テスト失敗。create(変更)でスキーマに定義されていないプロパティにセットしたのにエラーが発生していない');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY, e.message);
		}
		try {
			item.set('val3', 'c');
			ok(false, 'テスト失敗。setでスキーマに定義されていないプロパティにセットしたのにエラーが発生していない');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY, e.message);
		}
		try {
			item.set({
				val2: 'c',
				val3: 'd'
			});
			ok(false, 'テスト失敗。setでスキーマに定義されていないプロパティにセットしたのにエラーが発生していない');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY, e.message);
		}

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
			console.log(e.stack)
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

	test('type指定 string[] 正常系', function() {
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
			deepEqualObs(item.get('test1'), ['a'],
					'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqualObs(item.get('test2'), [], 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: ['c', 'z']
			});

			deepEqualObs(item.get('test1'), ['c', 'z'], 'type:\'string[]\'のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new Array(new String('a'), new String(10)), new Array('x', 'r'),
					new Array('8', '5'), new Object(['i', 'd']), new Object(['3', '4']), [],
					[null, undefined]];
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
			throw e;
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

	test('type指定 DataModel 正常系', 4,
			function() {
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

				equal(item1.get('dataModel1').get('test1'), 'aaa',
						'create時に指定したモデルの値が、DataItemから取得できること。');
				equal(item1.get('dataModel2'), null, 'create時に何も値を指定しない場合、nullが取得できること。');
				equal(item2.get('dataModel1'), null, 'create時に何も値を指定しない場合、nullが取得できること。');
				equal(item2.get('dataModel2').get('test1'), 20,
						'create時に指定したモデルの値が、DataItemから取得できること。');

				//TODO null,undefinedでcreateできること、代入できることを確認する
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
		}, 'type:DataModel2のプロパティに異なる型の値をsetするとエラーが発生すること。');

		item1.set('dataModel1', null);
		// DaaModel1をdrop
		manager.dropModel('DataModel1');
		try {
			item1.set('dataModel1', model1DataItem);
		} catch (e) {
			ok(true, 'ドロップしたモデルのアイテムは格納できないこと');
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message)
		}
	});

	test(
			'type指定 DataModel[] 正常系',
			8,
			function() {
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

				equal(item1.get('dataModel1')[0].get('test1'), 'aaa',
						'create時に指定したモデルの値が、DataItemから取得できること。');
				equal(item1.get('dataModel1')[1].get('test1'), 'bbb',
						'create時に指定したモデルの値が、DataItemから取得できること。');
				deepEqualObs(item1.get('dataModel2'), [], 'create時に何も値を指定しない場合、空のObsArrayが取得できること。');
				equal(item2.get('dataModel2')[0].get('test1'), 20,
						'create時に指定したモデルの値が、DataItemから取得できること。');
				equal(item2.get('dataModel2')[1].get('test1'), 30,
						'create時に指定したモデルの値が、DataItemから取得できること。');
				deepEqualObs(item2.get('dataModel1'), [], 'create時に何も値を指定しない場合、空のObsArrayが取得できること。');

				// 指定無し、null,空配列でcreateできるか
				deepEqualObs(model.create({
					id: sequence.next(),
					dataModel1: [null]
				}).get('dataModel1'), [null], 'create時に[null]を指定した場合、[null]が取得できること。');

				deepEqualObs(model.create({
					id: sequence.next(),
					dataModel1: []
				}).get('dataModel1'), [], 'create時に空配列を指定した場合、空のObsArrayが取得できること。');

			});

	test('type指定 DataModel[] 異常系', 6, function() {
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

		// DaaModel1をdrop
		manager.dropModel('DataModel1');
		try {
			item1.set('dataModel1', [model1DataItem1]);
		} catch (e) {
			ok(true, 'ドロップしたモデルのアイテムは格納できないこと');
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message)
		}
	});


	test(
			'type指定 number 正常系',
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
					strictEqual(item.get('test2'), null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

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
			deepEqualObs(item.get('test1'), [20],
					'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqualObs(item.get('test2'), [], 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: [30, 10]
			});

			deepEqualObs(item.get('test1'), [30, 10], 'type:\'number[]\'のプロパティcreateで値が代入できること。');

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
			strictEqual(item.get('test2'), null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

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
			deepEqualObs(item.get('test1'), [50, 15],
					'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqualObs(item.get('test2'), [], 'DefaultValueが未指定の場合、空のObsArrayが代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: [10, 30]
			});

			deepEqualObs(item.get('test1'), [10, 30], 'type:integer[] のプロパティに値が代入できること。');

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
			strictEqual(item.get('test2'), null, 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

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
			deepEqualObs(item.get('test1'), [true, false],
					'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqualObs(item.get('test2'), [], 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: [false, true, false]
			});

			deepEqualObs(item.get('test1'), [false, true, false],
					'type:boolean[] のプロパティに値が代入できること。');

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
	test('type指定 any 正常系',
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
	test('type指定 any[]', function() {
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
			deepEqualObs(item.get('test1'), [10],
					'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
			deepEqualObs(item.get('test2'), [], 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

			item = model.create({
				id: sequence.next(),
				test1: [30]
			});

			deepEqualObs(item.get('test1'), [30], 'type:\'any\'のプロパティに値が代入できること。');

			// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
			var item2 = null;
			var sub = [new Array(10, 8), new Object(['a']), [new Number(1)], [null, undefined]];
			for ( var i = 0; i < sub.length; i++) {
				item2 = model.create({
					id: sequence.next(),
					test1: sub[i]
				});

				deepEqualObs(item2.get('test1'), sub[i], 'test1に' + sub[i]
						+ 'が代入されてDataItemが生成されること。');

				item2.set('test2', sub[i]);

				deepEqualObs(item2.get('test2'), sub[i], 'typeプロパティで指定した型の値が代入できること。');
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
					enumValue: ['a', 10, true, testClass1, NaN]
				},
				test2: {
					type: 'enum[]',
					enumValue: ['b', 20, false, testClass1, NaN]
				}
			}
		});
		var item = model.create({
			id: sequence.next()
		});

		// 初期値は正しいか
		deepEqualObs(item.get('test1'), [10],
				'DefaultValueが指定されている場合、defaultValueに指定した値が代入されていること。');
		deepEqualObs(item.get('test2'), [], 'DefaultValueが未指定の場合、型に応じた初期値が代入されていること。');

		item = model.create({
			id: sequence.next(),
			test1: ['a']
		});

		deepEqualObs(item.get('test1'), ['a'], 'type:\'enum[]\'のプロパティに値が代入できること。');

		// 代入可能な値でDataItemの生成とプロパティへの代入ができるか
		var item2 = null;
		var sub = [['b'], ['b', 'b'], ['b', 20], ['b', 20, false, testClass1, NaN], [NaN], [false],
				[testClass1], [null], [null, null], []];
		for ( var i = 0; i < sub.length; i++) {
			try {

				item2 = model.create({
					id: sequence.next(),
					test2: sub[i]
				});

				deepEqualObs(item2.get('test2'), sub[i], 'test2に['
						+ Array.prototype.toString.call(sub[i]) + ']が代入されてDataItemが生成されること。');

				item2.set('test2', sub[i]);

				deepEqualObs(item2.get('test2'), sub[i], 'typeプロパティで指定した型の値が代入できること。');
			} catch (e) {
				ok(false, 'エラーが発生しました。『' + e.message + '』');
			}
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

	test('constraintの各プロパティについてnullまたはundefinedを指定した時は、指定無しと同じ扱いで制約がかからないこと', 44, function() {
		var nullConstraint = {
			notNull: null,
			notEmpty: null,
			min: null,
			max: null,
			minLength: null,
			maxLength: null,
			pattern: null
		};
		var undefConstraint = {
			notNull: undefined,
			notEmpty: undefined,
			min: undefined,
			max: undefined,
			minLength: undefined,
			maxLength: undefined,
			pattern: undefined
		};
		var item = manager.createModel({
			name: 'Test',
			schema: {
				id: {
					id: true
				}
			}
		}).create({
			id: sequence.next()
		});
		var enumValue = [true, 1, 'ab', item];
		var typeValMap = {
			number: [null, 1.1, -12.3],
			integer: [null, 1, -12],
			boolean: [null, true, false],
			string: [null, '', 'ab'],
			'enum': [true, 1, 'ab', item],
			'@Test': [null, item],
			any: [null, undefined, item, window]
		};
		for ( var c = 0; c < 2; c++) {
			var constraint = [nullConstraint, undefConstraint][c];
			for ( var type in typeValMap) {
				var propObj = {
					type: type,
					constraint: constraint
				};
				if (type === 'enum') {
					propObj.enumValue = enumValue;
				}
				var model = manager.createModel({
					name: 'TestModel' + sequence.next(),
					schema: {
						id: {
							id: true
						},
						v: propObj
					}
				});
				for ( var i = 0, l = typeValMap[type].length; i < l; i++) {
					var item = model.create({
						id: sequence.next(),
						v: typeValMap[type][i]
					});
					strictEqual(item.get('v'), typeValMap[type][i], h5.u.str.format(
							'モデルに制約がかかっていないこと。type: {0}, value: {1}', type, typeValMap[type][i]));
				}
			}
		}
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
					type: 'any[]',
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
		deepEqualObs(item1.get('test2'), ['a', 'b', 'c'], msg);
		equal(item1.get('test3'), 10.5, msg);
		deepEqualObs(item1.get('test4'), [20.1, 20.2, 20.3], msg);
		equal(item1.get('test5'), 6, msg);
		deepEqualObs(item1.get('test6'), [7, 8, 9], msg);
		equal(item1.get('test7'), true, msg);
		deepEqualObs(item1.get('test8'), [true, false], msg);
		deepEqualObs(item1.get('test9'), [30, 'ZZZ', /[0-9]/], msg);
		deepEqual(item1.get('test10'), {
			hoge: 1
		}, msg);
		equal(item1.get('test11'), itemA, msg);
		deepEqualObs(item1.get('test12'), [itemB, itemA], msg);
		equal(item1.get('test13'), 10.8, msg);
		deepEqualObs(item1.get('test14'), [testClass1], msg);

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
		deepEqualObs(item2.get('test2'), ['A', 'B', 'C'], msg);
		strictEqual(item2.get('test3'), 120.1, msg);
		deepEqualObs(item2.get('test4'), [81.1, 81.2, 81.3], msg);
		strictEqual(item2.get('test5'), 3000, msg);
		deepEqualObs(item2.get('test6'), [4000, 5000, 6000], msg);
		strictEqual(item2.get('test7'), false, msg);
		deepEqualObs(item2.get('test8'), [false, false], msg);
		deepEqualObs(item2.get('test9'), [true, '9999', 70.5], msg);
		strictEqual(item2.get('test10'), $div, msg);
		strictEqual(item2.get('test11'), itemB, msg);
		deepEqualObs(item2.get('test12'), [itemA], msg);
		strictEqual(item2.get('test13'), true, msg);
		deepEqualObs(item2.get('test14'), [5], msg);

		// setできること
		msg = '条件を満たす値をsetできること';

		item2.set('test1', 'ccc');
		strictEqual(item2.get('test1'), 'ccc', msg);

		item2.set('test2', ['aa', 'bb', 'cc']);
		deepEqualObs(item2.get('test2'), ['aa', 'bb', 'cc'], msg);

		item2.set('test3', 0);
		strictEqual(item2.get('test3'), 0, msg);

		item2.set('test4', [1, 2, 3]);
		deepEqualObs(item2.get('test4'), [1, 2, 3], msg);

		item2.set('test5', -3000);
		strictEqual(item2.get('test5'), -3000, msg);

		item2.set('test6', [1, 2, 3]);
		deepEqualObs(item2.get('test6'), [1, 2, 3], msg);

		item2.set('test7', true);
		strictEqual(item2.get('test7'), true, msg);

		item2.set('test8', [true, true, false]);
		deepEqualObs(item2.get('test8'), [true, true, false], msg);

		item2.set('test9', [[1], 2, 'aaa']);
		deepEqualObs(item2.get('test9'), [[1], 2, 'aaa'], msg);

		item2.set('test10', {
			a: 'b'
		});
		deepEqual(item2.get('test10'), {
			a: 'b'
		}, msg);

		item2.set('test11', itemA);
		strictEqual(item2.get('test11'), itemA, msg);

		item2.set('test12', [itemA, itemB, itemB]);
		deepEqualObs(item2.get('test12'), [itemA, itemB, itemB], msg);

		item2.set('test13', 10.8);
		strictEqual(item2.get('test13'), 10.8, msg);

		item2.set('test14', [testClass1, 'YYY', true, true]);
		deepEqualObs(item2.get('test14'), [testClass1, 'YYY', true, true], msg);


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
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
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
		}
	});

	//=============================
	// Body
	//=============================

	test('制約が適用されているか 正常系', 7, function() {
		// 値を指定せずcreateできること
		var msg = 'defaultValueで指定した値を持つDataItemが作成できること。';
		var item = model.create({
			id: sequence.next()
		});

		equal(item.get('test1'), 'test1', msg);
		deepEqualObs(item.get('test2'), ['a', 'b', 'c'], msg);

		// 値を指定してcreateできること
		msg = '条件を満たす値を持つDataItemが作成できること';

		item = model.create({
			id: sequence.next(),
			test1: 'bbb',
			test2: ['A', 'B', 'C']
		});

		equal(item.get('test1'), 'bbb', msg);
		deepEqualObs(item.get('test2'), ['A', 'B', 'C'], msg);


		// setできること
		msg = '条件を満たす値を代入できること';

		item.set('test1', 'bbb');
		strictEqual(item.get('test1'), 'bbb', msg);

		item.set('test2', ['aa', 'bb', 'cc']);
		deepEqualObs(item.get('test2'), ['aa', 'bb', 'cc'], msg);

		// string[]に[]をsetできること
		item.set('test2', []);
		deepEqualObs(item.get('test2'), [], msg);
	});

	test(
			'制約が適用されているか 異常系',
			9,
			function() {
				// createでエラー
				try {
					model.create({
						id: sequence.next(),
						test1: ''
					});
					ok(false, 'テスト失敗。NotEmpty指定した項目(string)に空文字を指定してcreateした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
				}

				try {
					model.create({
						id: sequence.next(),
						test2: ['a', '']
					});
					ok(false, 'テスト失敗。NotEmpty指定した項目(string[])に空文字を含む配列を指定してcreateした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
				}

				try {
					model.create({
						id: sequence.next(),
						test1: null
					});
					ok(false, 'テスト失敗。NotEmpty指定した項目(string)にnullを指定してcreateした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
				}

				try {
					model.create({
						id: sequence.next(),
						test2: ['a', null]
					});
					ok(false,
							'テスト失敗。NotEmpty指定した項目(string[])にnullを含む配列を指定してcreateした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
				}

				var item = model.create({
					id: sequence.next()
				});

				// setでエラー
				try {
					item.set('test1', '');
					ok(false, 'テスト失敗。NotEmpty指定した項目(string)に空文字をsetした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
				}
				try {
					item.set('test2', ['b', '']);
					ok(false, 'テスト失敗。NotEmpty指定した項目(string[])に空文字を含む配列をsetした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
				}
				try {
					item.set('test1', null);
					ok(false, 'テスト失敗。NotEmpty指定した項目(string)にnullをsetした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
				}
				try {
					item.set('test2', ['b', null]);
					ok(false, 'テスト失敗。NotEmpty指定した項目(string[])にnullを含む配列をsetした時にエラーが発生しませんでした');
				} catch (e) {
					strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
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
					strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
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
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	test('制約が適用されているか 正常系', 22, function() {
		// 値を指定しないでcreate
		var item = model.create({
			id: sequence.next()
		});
		equal(item.get('num'), -5.5, 'type:num minの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
		deepEqualObs(item.get('numA'), [55, -5.5],
				'type:num[] minの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
		equal(item.get('int'), 5, 'type:int minの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
		deepEqualObs(item.get('intA'), [5, 6, 7],
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
		deepEqualObs(item.get('intA'), [5, 10], 'type:int[] minの条件を満たす値でcreateできること');

		// set
		item.set({
			num: Infinity,
			numA: [123.456],
			int: 6,
			intA: [5, 6, 7]
		});
		equal(item.get('num'), Infinity, 'type:num minの条件を満たす値をsetできること');
		deepEqualObs(item.get('numA'), [123.456], 'type:num[] minの条件を満たす値をsetできること');
		equal(item.get('int'), 6, 'type:int minの条件を満たす値をsetできること');
		deepEqualObs(item.get('intA'), [5, 6, 7], 'type:int[] minの条件を満たす値をsetできること');

		// nullをset
		item.set({
			num: null,
			numA: [null, null],
			int: null,
			intA: [null, null]
		});
		equal(item.get('num'), null, 'type:num nullをsetできること');
		deepEqualObs(item.get('numA'), [null, null], 'type:num[] [null, null]をsetできること');
		equal(item.get('int'), null, 'type:int nullをsetできること');
		deepEqualObs(item.get('intA'), [null, null], 'type:int[] [null, null]をsetできること');

		// 空配列をset
		item.set({
			numA: [],
			intA: []
		});
		deepEqualObs(item.get('numA'), [], 'type:num[] []をsetできること');
		deepEqualObs(item.get('intA'), [], 'type:int[] []をsetできること');

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
		item = model2.create({
			id: sequence.next()
		});
		strictEqual(item.get('num'), null, 'defaultValue指定無しで、値nullのアイテムがcreateできること');
		deepEqualObs(item.get('numA'), [], 'defaultValue指定無しで、値[]のアイテムがcreateできること');
		strictEqual(item.get('int'), null, 'defaultValue指定無しで、値nullのアイテムがcreateできること');
		deepEqualObs(item.get('intA'), [], 'defaultValue指定無しで、値[]のアイテムがcreateできること');

	});

	test('制約が適用されているか 異常系', 8, function() {
		//create
		try {
			model.create({
				id: sequence.next(),
				num: -5.55
			});
			ok(false, 'テスト失敗。minで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				numA: [4.44, -5.55, 6.66]
			});
			ok(false, 'テスト失敗。minで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				int: 4
			});
			ok(false, 'テスト失敗。minで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				intA: [8, 6, 4]
			});
			ok(false, 'テスト失敗。minで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}

		// set
		var item = model.create({
			id: sequence.next()
		});
		try {
			item.set({
				num: -5.50001
			});
			ok(false, 'テスト失敗。minで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			item.set({
				numA: [0, 1, -5.5000001]
			});
			ok(false, 'テスト失敗。minで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			item.set({
				int: 4
			});
			ok(false, 'テスト失敗。minで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			item.set({
				int: [6, 4]
			});
			ok(false, 'テスト失敗。minで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
	});

	//=============================
	// Definition
	//=============================

	module('constraint - max', {
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
							max: -5.5
						},
						defaultValue: -5.5
					},
					numA: {
						type: 'number[]',
						constraint: {
							max: 5.5
						},
						defaultValue: [-55, 5.5]
					},
					int: {
						type: 'integer',
						constraint: {
							max: 5
						},
						defaultValue: 5
					},
					intA: {
						type: 'integer[]',
						constraint: {
							max: 5
						},
						defaultValue: [3, 4, 5]
					}
				}
			});
		},
		teardown: function() {
			sequence = null;
			dataModel1 = null;
			testClass1 = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================

	test('制約が適用されているか 正常系', 22, function() {
		// 値を指定しないでcreate
		var item = model.create({
			id: sequence.next()
		});
		equal(item.get('num'), -5.5, 'type:num maxの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
		deepEqualObs(item.get('numA'), [-55, 5.5],
				'type:num[] maxの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
		equal(item.get('int'), 5, 'type:int maxの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
		deepEqualObs(item.get('intA'), [3, 4, 5],
				'type:int[] maxの条件をdefaultValueが満たす時、値を指定しないでcreateできること');

		// create
		item = model.create({
			id: sequence.next(),
			num: -5.5,
			numA: [5.5, 0, -5, -Infinity],
			int: 5,
			intA: [5, -100]
		});

		equal(item.get('num'), -5.5, 'type:num maxの条件を満たす値でcreateできること');
		deepEqualObs(item.get('numA'), [5.5, 0, -5, -Infinity],
				'type:num[] maxの条件を満たす値でcreateできること');
		equal(item.get('int'), 5, 'type:intでmaxの条件を満たす値でcreateできること');
		deepEqualObs(item.get('intA'), [5, -100], 'type:int[] maxの条件を満たす値でcreateできること');

		// set
		item.set({
			num: -Infinity,
			numA: [5.5],
			int: 4,
			intA: [0, 1, 2]
		});
		equal(item.get('num'), -Infinity, 'type:num maxの条件を満たす値をsetできること');
		deepEqualObs(item.get('numA'), [5.5], 'type:num[] maxの条件を満たす値をsetできること');
		equal(item.get('int'), 4, 'type:int maxの条件を満たす値をsetできること');
		deepEqualObs(item.get('intA'), [0, 1, 2], 'type:int[] maxの条件を満たす値をsetできること');

		// nullをset
		item.set({
			num: null,
			numA: [null, null],
			int: null,
			intA: [null, null]
		});
		equal(item.get('num'), null, 'type:num nullをsetできること');
		deepEqualObs(item.get('numA'), [null, null], 'type:num[] [null, null]をsetできること');
		equal(item.get('int'), null, 'type:int nullをsetできること');
		deepEqualObs(item.get('intA'), [null, null], 'type:int[] [null, null]をsetできること');

		// 空配列をset
		item.set({
			numA: [],
			intA: []
		});
		deepEqualObs(item.get('numA'), [], 'type:num[] []をsetできること');
		deepEqualObs(item.get('intA'), [], 'type:int[] []をsetできること');

		// defaultValueが設定されていない場合
		var constraint = {
			max: -10
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
		item = model2.create({
			id: sequence.next()
		});
		strictEqual(item.get('num'), null, 'defaultValue指定無しで、値nullのアイテムがcreateできること');
		deepEqualObs(item.get('numA'), [], 'defaultValue指定無しで、値nullのアイテムがcreateできること');
		strictEqual(item.get('int'), null, 'defaultValue指定無しで、値nullのアイテムがcreateできること');
		deepEqualObs(item.get('intA'), [], 'defaultValue指定無しで、値nullのアイテムがcreateできること');

	});

	test('制約が適用されているか 異常系', 8, function() {
		//create
		try {
			model.create({
				id: sequence.next(),
				num: -5.45
			});
			ok(false, 'テスト失敗。maxで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				numA: [4.44, 5.55]
			});
			ok(false, 'テスト失敗。maxで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				int: 6
			});
			ok(false, 'テスト失敗。maxで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				intA: [2, 6, 4]
			});
			ok(false, 'テスト失敗。maxで設定した値未満をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}

		// set
		var item = model.create({
			id: sequence.next()
		});
		try {
			item.set({
				num: -5.4999
			});
			ok(false, 'テスト失敗。maxで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			item.set({
				numA: [0, 1, 5.5000001]
			});
			ok(false, 'テスト失敗。maxで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			item.set({
				int: 6
			});
			ok(false, 'テスト失敗。maxで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			item.set({
				int: [6, 4]
			});
			ok(false, 'テスト失敗。maxで設定した値未満をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
	});

	//=============================
	// Definition
	//=============================

	module('constraint - minLength', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');

			var constraint = {
				minLength: 2
			};
			model = manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true
					},
					str: {
						type: 'string',
						constraint: constraint,
						defaultValue: 'ab'
					},
					strA: {
						type: 'string[]',
						constraint: constraint,
						defaultValue: ['ab', 'abc']
					}
				}
			});
		},
		teardown: function() {
			sequence = null;
			dataModel1 = null;
			testClass1 = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================
	test(
			'制約が適用されているか 正常系',
			11,
			function() {
				// 値を指定しないでcreate
				var item = model.create({
					id: sequence.next()
				});
				equal(item.get('str'), 'ab',
						'type:string minLengthの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
				deepEqualObs(item.get('strA'), ['ab', 'abc'],
						'type:num[] minLengthの条件をdefaultValueが満たす時、値を指定しないでcreateできること');

				// create
				item = model.create({
					id: sequence.next(),
					str: 'AB',
					strA: ['ABC', 'AB']
				});

				equal(item.get('str'), 'AB',
						'type:string minLengthの条件を満たす値でcreateした時、値を指定しないでcreateできること');
				deepEqualObs(item.get('strA'), ['ABC', 'AB'],
						'type:num[] minLengthの条件を満たす値でcreate時、値を指定しないでcreateできること');

				// set
				item.set({
					str: 'CD',
					strA: ['CDE', 'CD']
				});
				equal(item.get('str'), 'CD',
						'type:string minLengthの条件を満たす値でcreateした時、値を指定しないでcreateできること');
				deepEqualObs(item.get('strA'), ['CDE', 'CD'],
						'type:num[] minLengthの条件を満たす値でcreate時、値を指定しないでcreateできること');

				// nullをset
				item.set({
					str: null,
					strA: [null, null]
				});
				equal(item.get('str'), null, 'type:string nullをsetできること');
				deepEqualObs(item.get('strA'), [null, null], 'type:string[] [null, null]をsetできること');

				// []をset
				item.set({
					strA: []
				});
				deepEqualObs(item.get('strA'), [], 'type:string[] 空配列をsetできること');

				// defaultValueが設定されていない場合
				var constraint = {
					minLength: 5
				};
				var model2 = manager.createModel({
					name: 'TestModel2',
					schema: {
						id: {
							id: true
						},
						str: {
							type: 'string',
							constraint: constraint
						},
						strA: {
							type: 'string[]',
							constraint: constraint
						}
					}
				});
				item = model2.create({
					id: sequence.next()
				});
				strictEqual(item.get('str'), null, 'defaultValue指定無しで、値nullのアイテムがcreateできること');
				deepEqualObs(item.get('strA'), [], 'defaultValue指定無しで、値[]のアイテムがcreateできること');
			});

	test('制約が適用されているか 異常系', 4, function() {
		//create
		try {
			model.create({
				id: sequence.next(),
				str: 'a'
			});
			ok(false, 'テスト失敗。minLengthで設定した長さより短い文字列をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				strA: ['abc', 'def', 'g']
			});
			ok(false, 'テスト失敗。minLengthで設定した長さより短い文字列をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}

		// set
		var item = model.create({
			id: sequence.next()
		});
		try {
			item.set({
				str: 'b'
			});
			ok(false, 'テスト失敗。minLengthで設定した長さより短い文字列をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			item.set({
				strA: ['ABC', 'D']
			});
			ok(false, 'テスト失敗。minLengthで設定した長さより短い文字列をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
	});

	//=============================
	// Definition
	//=============================

	module('constraint - maxLength', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');

			var constraint = {
				maxLength: 2
			};
			model = manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true
					},
					str: {
						type: 'string',
						constraint: constraint,
						defaultValue: 'ab'
					},
					strA: {
						type: 'string[]',
						constraint: constraint,
						defaultValue: ['ab', 'a']
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
			11,
			function() {
				// 値を指定しないでcreate
				var item = model.create({
					id: sequence.next()
				});
				equal(item.get('str'), 'ab',
						'type:string maxLengthの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
				deepEqualObs(item.get('strA'), ['ab', 'a'],
						'type:num[] maxLengthの条件をdefaultValueが満たす時、値を指定しないでcreateできること');

				// create
				item = model.create({
					id: sequence.next(),
					str: 'AB',
					strA: ['A', 'AB']
				});

				equal(item.get('str'), 'AB', 'type:string maxLengthの条件を満たす値でcreateできること');
				deepEqualObs(item.get('strA'), ['A', 'AB'],
						'type:num[] maxLengthの条件を満たす値でcreateできること');

				// set
				item.set({
					str: 'CD',
					strA: ['', null, 'C', 'CD']
				});
				equal(item.get('str'), 'CD',
						'type:string maxLengthの条件を満たす値でcreateした時、値を指定しないでcreateできること');
				deepEqualObs(item.get('strA'), ['', null, 'C', 'CD'],
						'type:num[] maxLengthの条件を満たす値でcreate時、値を指定しないでcreateできること');

				// nullをset
				item.set({
					str: null,
					strA: [null, null]
				});
				equal(item.get('str'), null, 'type:string nullをsetできること');
				deepEqualObs(item.get('strA'), [null, null], 'type:string[] [null, null]をsetできること');

				// []をset
				item.set({
					strA: []
				});
				deepEqualObs(item.get('strA'), [], 'type:string[] 空配列をsetできること');

				// defaultValueが設定されていない場合
				var constraint = {
					maxLength: 5
				};
				var model2 = manager.createModel({
					name: 'TestModel2',
					schema: {
						id: {
							id: true
						},
						str: {
							type: 'string',
							constraint: constraint
						},
						strA: {
							type: 'string[]',
							constraint: constraint
						}
					}
				});
				item = model2.create({
					id: sequence.next()
				});
				strictEqual(item.get('str'), null, 'defaultValue指定無しで、値nullのアイテムがcreateできること');
				deepEqualObs(item.get('strA'), [], 'defaultValue指定無しで、値[]のアイテムがcreateできること');
			});

	test('制約が適用されているか 異常系', 4, function() {
		//create
		try {
			model.create({
				id: sequence.next(),
				str: 'abc'
			});
			ok(false, 'テスト失敗。maxLengthで設定した長さより長い文字列をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				strA: ['a', 'bcd', 'e']
			});
			ok(false, 'テスト失敗。maxLengthで設定した長さより長い文字列をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}

		// set
		var item = model.create({
			id: sequence.next()
		});
		try {
			item.set({
				str: 'bbb'
			});
			ok(false, 'テスト失敗。maxLengthで設定した長さより長い文字列をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			item.set({
				strA: ['ABC', 'D']
			});
			ok(false, 'テスト失敗。maxLengthで設定した長さより長い文字列をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
	});

	//=============================
	// Definition
	//=============================

	module('constraint - pattern', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');

			var constraint = {
				pattern: /^h5/i
			};
			model = manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true
					},
					str: {
						type: 'string',
						constraint: constraint,
						defaultValue: 'h5'
					},
					strA: {
						type: 'string[]',
						constraint: constraint,
						defaultValue: ['H5aa', 'h5']
					}
				}
			});
		},
		teardown: function() {
			sequence = null;
			dataModel1 = null;
			testClass1 = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================
	test(
			'制約が適用されているか 正常系',
			11,
			function() {
				// 値を指定しないでcreate
				var item = model.create({
					id: sequence.next()
				});
				equal(item.get('str'), 'h5',
						'type:string patternの条件をdefaultValueが満たす時、値を指定しないでcreateできること');
				deepEqualObs(item.get('strA'), ['H5aa', 'h5'],
						'type:num[] patternの条件をdefaultValueが満たす時、値を指定しないでcreateできること');

				// create
				item = model.create({
					id: sequence.next(),
					str: 'H555',
					strA: ['h555', null, 'h5']
				});

				equal(item.get('str'), 'H555', 'type:string patternの条件を満たす値でcreateできること');
				deepEqualObs(item.get('strA'), ['h555', null, 'h5'],
						'type:num[] patternの条件を満たす値でcreateできること');

				// set
				item.set({
					str: 'h5',
					strA: ['h5', null]
				});
				equal(item.get('str'), 'h5',
						'type:string patternの条件を満たす値でcreateした時、値を指定しないでcreateできること');
				deepEqualObs(item.get('strA'), ['h5', null],
						'type:num[] patternの条件を満たす値でcreate時、値を指定しないでcreateできること');

				// nullをset
				item.set({
					str: null,
					strA: [null, null]
				});
				equal(item.get('str'), null, 'type:string nullをsetできること');
				deepEqualObs(item.get('strA'), [null, null], 'type:string[] [null, null]をsetできること');

				// 空配列をset
				item.set({
					strA: []
				});
				deepEqualObs(item.get('strA'), [], 'type:string[] 空配列をsetできること');

				// defaultValueが設定されていない場合
				var constraint = {
					pattern: /hifive/i
				};
				var model2 = manager.createModel({
					name: 'TestModel2',
					schema: {
						id: {
							id: true
						},
						str: {
							type: 'string',
							constraint: constraint
						},
						strA: {
							type: 'string[]',
							constraint: constraint
						}
					}
				});
				item = model2.create({
					id: sequence.next()
				});
				strictEqual(item.get('str'), null, 'defaultValue指定無しで、値nullのアイテムがcreateできること');
				deepEqualObs(item.get('strA'), [], 'defaultValue指定無しで、値[]のアイテムがcreateできること');
			});

	test('制約が適用されているか 異常系', 4, function() {
		//create
		try {
			model.create({
				id: sequence.next(),
				str: 'ｈ５'
			});
			ok(false, 'テスト失敗。patternを満たさない文字列をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			model.create({
				id: sequence.next(),
				strA: ['a', 'h5', 'e']
			});
			ok(false, 'テスト失敗。patternを満たさない文字列をcreate時に指定して、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}

		// set
		var item = model.create({
			id: sequence.next()
		});
		try {
			item.set({
				str: 'ｈ５'
			});
			ok(false, 'テスト失敗。patternを満たさない文字列をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
		try {
			item.set({
				strA: ['h5', 'D']
			});
			ok(false, 'テスト失敗。patternを満たさない文字列をsetした時、エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
		}
	});
	//=============================
	// Definition
	//=============================

	module('constraint - 複合条件', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			sequence = null;
			dataModel1 = null;
			testClass1 = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================
	test('number, number[], integer, integer[]', 25, function() {
		var constraint = {
			notNull: true,
			min: -1,
			max: 2
		};
		model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				num: {
					type: 'number',
					constraint: constraint,
					defaultValue: 0
				},
				numA: {
					type: 'number[]',
					constraint: constraint,
					defaultValue: []
				},
				int: {
					type: 'integer',
					constraint: constraint,
					defaultValue: 0
				},
				intA: {
					type: 'integer[]',
					constraint: constraint,
					defaultValue: []
				}
			}
		});

		ok(true, 'notNull:true, min:-1, max:2 の複合条件を持つプロパティを持つモデルを作成できること');
		var values = [null, -2, 0, 1, 2, 3];
		var propTypes = ['number', 'number[]', 'integer', 'integer[]'];
		var props = ['num', 'numA', 'int', 'intA'];
		for ( var i = 0, l = values.length; i < l; i++) {
			for ( var j = 0, len = props.length; j < len; j++) {
				var descriptor = {
					id: sequence.next()
				};
				var v = propTypes[j].indexOf('[]') > -1 ? [values[i]] : values[i];
				descriptor[props[j]] = v;
				var vStr = $.isArray(v) ? '[' + v[0] + ']' : v;
				var condition = values[i] !== null && -1 <= values[i] && values[i] <= 2;
				try {
					model.create(descriptor);
					ok(condition, h5.u.str.format(
							'type:{0}, 値{1} はnotNull, min, max すべての条件を満たすのでエラーでない', propTypes[j],
							vStr));
				} catch (e) {
					ok(!condition, h5.u.str.format(
							'type:{0}, 値{1} はnotNull, min, max いずれかの条件を満たさないのでエラー', propTypes[j],
							vStr));
				}
			}
		}
	});

	test('string, string[]', 9, function() {
		var constraint = {
			pattern: /^hi/,
			minLength: 4,
			maxLength: 6
		};
		model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				str: {
					type: 'string',
					constraint: constraint
				},
				strA: {
					type: 'string[]',
					constraint: constraint
				}
			}
		});

		ok(true, 'pattern:/^hi/, minLength:4, maxLength:6 の複合条件を持つプロパティを持つモデルを作成できること');
		var values = ['hifive', 'hi5', 'hi-five', 'HIFIVE'];
		var propTypes = ['string', 'string[]'];
		var props = ['str', 'strA'];
		for ( var i = 0, l = values.length; i < l; i++) {
			for ( var j = 0, len = props.length; j < len; j++) {
				var descriptor = {
					id: sequence.next()
				};
				var v = propTypes[j].indexOf('[]') > -1 ? [values[i]] : values[i];
				descriptor[props[j]] = v;
				var vStr = $.isArray(v) ? '[' + v[0] + ']' : v;
				var condition = values[i].indexOf('hi') === 0 && 4 <= values[i].length
						&& values[i].length <= 6;
				try {
					model.create(descriptor);
					ok(condition, h5.u.str.format(
							'type:{0}, 値{1} はpattern, minLength, maxLength すべての条件を満たすのでエラーでない',
							propTypes[j], vStr));
				} catch (e) {
					ok(!condition, h5.u.str.format(
							'type:{0}, 値{1} はpattern, minLength, maxLength いずれかの条件を満たさないのでエラー',
							propTypes[j], vStr));
				}
			}
		}
	});


	//=============================
	// Definition
	//=============================
	module('schemaのプロパティオブジェクトがnull', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			sequence = null;
			dropAllModel(manager);
		}
	});

	test('データモデルが生成でき、空オブジェクトを指定した場合と同じで、type:"any"扱いになりどんなものでもセットできること', function() {
		var schema = {
			id: {
				id: true
			},
			v: null
		};
		var item1 = manager.createModel({
			name: 'TestModel',
			schema: schema
		}).create({
			id: sequence.next()
		});

		var item2 = manager.createModel([{
			name: 'TestModel2',
			schema: schema
		}])[0].create({
			id: sequence.next()
		});

		var vals = [1, 'abc', new String('ABC'), new Number(1), {}, [],
				h5.u.obj.createObservableArray(), null, undefined];

		for ( var i = 0, l = vals.length; i < l; i++) {
			item1.set('v', vals[i]);
			strictEqual(item1.get('v'), vals[i], vals[i] + 'がsetできてgetできること');
			item2.set('v', vals[i]);
			strictEqual(item2.get('v'), vals[i], vals[i] + 'がsetできてgetできること');
		}

		expect(2 * l);
	});


	//=============================
	// Definition
	//=============================
	/**
	 * イベントオブジェクトをチェックする関数
	 * targetにthis(DataItem)を入れるので、calcの中でcheckEv.apply(this,ev,exp)のようにして呼んでチェックする
	 * expはtarget以外のプロパティを入れる
	 *
	 * @param {object} ev イベントオブジェクト
	 * @param {object} exp イベントオブジェクトの予想(targetは指定しなくてよい)
	 */
	function checkEv(ev, exp) {
		// イベントオブジェクトのチェック
		// targetはitemなので、
		exp.target = this;
		deepEqual(ev, exp, 'イベントオブジェクトに正しくnewValue,oldValueが格納されていること。');
	}

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

	test(
			'DataItem生成時にdpend.calcが実行されてdepend指定項目の値が計算されること',
			8,
			function() {
				var eventObj;
				var count = 0;
				var context;
				var model1 = manager
						.createModel({
							name: 'TestDataModel',
							schema: {
								id: {
									id: true
								},
								v1: {
									defaultValue: 'v1'
								},
								v2: {
									type: 'string',
									depend: {
										on: 'v1',
										calc: function(ev) {
											eventObj = ev;
											context = this;
											ok(!count, 'create時にcalcが1回呼ばれること');
											strictEqual(this.get('v1'), 'v1',
													'onに指定したプロパティをgetすると、defaultValueの値が取得できること');
											strictEqual(this.get('v3'), 'v3',
													'onに指定していないプロパティをgetすると、defaultValueの値が取得できるること');
											strictEqual(this.get('v2'), undefined,
													'このdependが設定されている項目の値はundefinedであること');
											// イベントオブジェクトのチェック
											deepEqual(eventObj, {
												props: {
													id: {
														newValue: '1',
														oldValue: undefined
													},
													v1: {
														newValue: 'v1',
														oldValue: undefined
													},
													v3: {
														newValue: 'v3',
														oldValue: undefined
													},
													v4: {
														newValue: 'v4',
														oldValue: undefined
													}
												},
												type: 'create',
												target: this
											},
													'イベントオブジェクトに正しくnewValue,oldValueが格納されていること。create時はoldValueはどのプロパティについてもundefinedであること。');
											count++;
											return this.get('v1') + 'a';
										}
									}
								},
								v3: {
									defaultValue: 'v3'
								},
								v4: {
									defaultValue: ''
								}
							}
						});

				var item = model1.create({
					id: '1',
					v4: 'v4'
				});

				// thisのチェック
				strictEqual(context, item, 'calc内のthisは生成されるitemインスタンスと同じインスタンスであること');

				// 値のチェック
				strictEqual(item.get('v1'), 'v1', 'depend指定のないプロパティにdefaultValue値が入っていること');
				strictEqual(item.get('v2'), 'v1a', 'depend指定したプロパティに、計算済みの値が入っていること');
			});


	test('set,createで値の変更があった場合にdpend.calcが実行され、値が更新されること', 8, function() {
		var expectEvObj = {};
		var checkEvFlag = false;
		var model1 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				v1: {
					defaultValue: 'v1'
				},
				v2: {
					type: 'string',
					depend: {
						on: ['v1', 'v3'],
						calc: function(ev) {
							if (checkEvFlag) {
								checkEv.apply(this, [ev, expectEvObj]);
								checkEvFlag = false;
							}
							var v1 = this.get('v1');
							var v3 = this.get('v3');
							return v1 + v3;
						}
					}
				},
				v3: {
					defaultValue: 'v3'
				}
			}
		});

		var item = model1.create({
			id: '1'
		});

		// 依存する2つの項目を書き換え
		// 予想されるeventObject
		expectEvObj = {
			props: {
				v1: {
					newValue: 'v11',
					oldValue: 'v1'
				},
				v3: {
					newValue: 'v33',
					oldValue: 'v3'
				}
			},
			type: 'change'
		};
		checkEvFlag = true;
		item.set({
			v1: 'v11',
			v3: 'v33'
		});
		strictEqual(item.get('v2'), 'v11v33', 'depend先の項目を変えると値が反映されること');

		// テストの成功失敗に関わらず、次のテストでoldValueを同じにするため、setする
		item.set({
			v1: 'test1',
			v3: 'test3'
		});

		// 依存する2つの項目のうち、1つを書き換え
		// 予想されるeventObject
		expectEvObj = {
			props: {
				v1: {
					newValue: 'v111',
					oldValue: 'test1'
				}
			},
			type: 'change'
		};
		checkEvFlag = true;
		item.set({
			v1: 'v111'
		});
		strictEqual(item.get('v2'), 'v111test3', 'depend先の項目を変えると値が反映されること');

		// テストの成功失敗に関わらず、次のテストでoldValueを同じにするため、setする
		item.set({
			v1: 'test11',
			v3: 'test33'
		});

		// 依存する2つの項目をcreateで書き換え
		// 予想されるeventObject
		expectEvObj = {
			props: {
				v1: {
					newValue: 'V1',
					oldValue: 'test11'
				},
				v3: {
					newValue: 'V3',
					oldValue: 'test33'
				}
			},
			type: 'change'
		};
		checkEvFlag = true;
		model1.create({
			id: item.get('id'),
			v1: 'V1',
			v3: 'V3'
		});
		strictEqual(item.get('v2'), 'V1V3', 'depend先の項目を変えると値が反映されること');

		// テストの成功失敗に関わらず、次のテストでoldValueを同じにするため、setする
		item.set({
			v1: 'test111',
			v3: 'test333'
		});

		// 依存する2つの項目のうち1つをcreateで書き換え
		// 予想されるeventObject
		expectEvObj = {
			props: {
				v3: {
					newValue: 'V3',
					oldValue: 'test333'
				}
			},
			type: 'change'
		};
		checkEvFlag = true;
		model1.create({
			id: item.get('id'),
			v3: 'V3'
		});
		strictEqual(item.get('v2'), 'test111V3', 'depend先の項目を変えると値が反映されること');
	});

	test('set,createで値の変更がない場合はdpend.calcは実行されないこと', 4, function() {
		var eventObj;
		var count = 0;
		var model1 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				v1: {},
				v2: {
					type: 'string',
					depend: {
						on: 'v1',
						calc: function(ev) {
							count++;
							return this.get('v1') + 'a';
						}
					}
				},
				v3: {},
				v4: {}
			}
		});

		var item = model1.create({
			id: '1'
		});
		ok(count === 1, 'create時には値を指定しなくてもcalcが実行される');

		// 関係ない値を更新
		count = 0;
		item.set({
			v3: 'v33',
			v4: 'v44'
		});
		ok(count === 0, 'onに指定されていない値を更新してもcalcは実行されない');

		// 値の変更がないset
		count = 0;
		item.set({
			v1: item.get('v1')
		});
		ok(count === 0, 'set時に値の変更ない場合calcは実行されない');

		// 値の変更がないcreate
		count = 0;
		model1.create({
			id: '1',
			v1: item.get('v1')
		});
		ok(count === 0, 'create時に値の変更ない場合calcは実行されない');
	});

	test('依存先プロパティがさらに別のプロパティに依存している場合でも正しく値が計算されること', 14, function() {
		var expectEvObj = {};
		var executed = [];
		var checkEvFlag = true;
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				v1: {
					defaultValue: 'v1'
				},
				v2: {
					type: 'string',
					depend: {
						on: ['v3', 'v5'],
						calc: function(ev) {
							executed.push('v2');
							if (checkEvFlag) {
								checkEv.apply(this, [ev, expectEvObj]);
							}
							var v1 = this.get('v1');
							var v3 = this.get('v3');
							var v5 = this.get('v5');
							return v1 + v3 + v5;
						}
					}
				},
				v3: {
					depend: {
						on: ['v1', 'v4'],
						calc: function(ev) {
							executed.push('v3');
							if (checkEvFlag) {
								checkEv.apply(this, [ev, expectEvObj]);
							}
							var v1 = this.get('v1');
							var v4 = this.get('v4');
							return v1 + v4;
						}
					}
				},
				v4: {},
				v5: {}
			}
		});

		// create
		expectEvObj = {
			props: {
				id: {
					newValue: '1',
					oldValue: undefined
				},
				v1: {
					newValue: 'v1',
					oldValue: undefined
				},
				v4: {
					newValue: null,
					oldValue: undefined
				},
				v5: {
					newValue: null,
					oldValue: undefined
				}
			},
			type: 'create'
		};
		var item = model.create({
			id: '1'
		});
		deepEqual(executed, ['v3', 'v2'], '依存関係の順番通りにcalcが実行されていること');
		strictEqual(item.get('v3'), 'v1null', '正しく値が計算されて格納されていること');
		strictEqual(item.get('v2'), 'v1v1nullnull', '正しく値が計算されて格納されていること');

		// set
		executed = [];
		expectEvObj = {
			props: {
				v4: {
					newValue: 'v44',
					oldValue: null
				}
			},
			type: 'change'
		};
		item.set({
			v4: 'v44'
		});
		deepEqual(executed, ['v3', 'v2'], '変更されたプロパティに依存するプロパティのcalcが依存関係順に実行されていること');
		strictEqual(item.get('v3'), 'v1v44', '正しく値が計算されて格納されていること');
		strictEqual(item.get('v2'), 'v1v1v44null', '正しく値が計算されて格納されていること');

		executed = [];
		expectEvObj = {
			props: {
				v5: {
					newValue: 'v55',
					oldValue: null
				}
			},
			type: 'change'
		};
		item.set({
			v5: 'v55'
		});
		deepEqual(executed, ['v2'], '変更されたプロパティに依存するプロパティのcalcが依存関係順に実行されていること');
		strictEqual(item.get('v3'), 'v1v44', '正しく値が計算されて格納されていること');
		strictEqual(item.get('v2'), 'v1v1v44v55', '正しく値が計算されて格納されていること');
	});

	test('set,createで値の変更がない場合はdpend.calcは実行されないこと', 4, function() {
		var eventObj;
		var count = 0;
		var model1 = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				v1: {},
				v2: {
					type: 'string',
					depend: {
						on: 'v1',
						calc: function(ev) {
							count++;
							return this.get('v1') + 'a';
						}
					}
				},
				v3: {},
				v4: {}
			}
		});

		var item = model1.create({
			id: '1'
		});
		ok(count === 1, 'create時には値を指定しなくてもcalcが実行される');

		// 関係ない値を更新
		count = 0;
		item.set({
			v3: 'v33',
			v4: 'v44'
		});
		ok(count === 0, 'onに指定されていない値を更新してもcalcは実行されない');

		// 値の変更がないset
		count = 0;
		item.set({
			v1: item.get('v1')
		});
		ok(count === 0, 'set時に値の変更ない場合calcは実行されない');

		// 値の変更がないcreate
		count = 0;
		model1.create({
			id: '1',
			v1: item.get('v1')
		});
		ok(count === 0, 'create時に値の変更ない場合calcは実行されない');
	});

	test('depend指定されている項目にsetできないこと', 7, function() {
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				v1: {},
				v2: {
					depend: {
						on: 'v1',
						calc: function(ev) {
							return this.get('v1') + 'a';
						}
					}
				}
			}
		});

		var item = model.create({
			id: '1'
		});

		try {
			item.set({
				v1: 'v1',
				v2: 'v2'
			});
			ok(false, 'テスト失敗。depend指定された項目にsetしてエラーが発生しませんでした');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_DEPEND_PROPERTY, e.message);
			strictEqual(item.get('v1'), null, 'setでエラーが起きたら、DataItemの中身は変わらないこと');
			strictEqual(item.get('v2'), 'nulla', 'setでエラーが起きたら、DataItemの中身は変わらないこと');
		}

		try {
			model.create({
				id: '2',
				v2: 'v22'
			});
			ok(false, 'テスト失敗。create時にdepend指定された項目に値を指定してエラーが発生しませんでした');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_DEPEND_PROPERTY, e.message);
		}

		try {
			model.create({
				id: '1',
				v1: 'v1',
				v2: 'v22'
			});
			ok(false, 'テスト失敗。create時にdepend指定された項目に値を指定してエラーが発生しませんでした');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_DEPEND_PROPERTY, e.message);
			strictEqual(item.get('v1'), null, 'createでエラーが起きたら、DataItemの中身は変わらないこと');
			strictEqual(item.get('v2'), 'nulla', 'createtでエラーが起きたら、DataItemの中身は変わらないこと');
		}
	});

	test('depend.calcが指定された型と違う値を返したら、エラーになること（自動型変換もされないこと）', 15, function() {
		// 型指定とdependのあるモデルを作成
		var model = manager.createModel({
			name: 'AutoBoxingDependDataModel',
			schema: {
				id: {
					id: true
				},
				testS: {
					type: 'string',
					depend: {
						on: 's',
						calc: function() {
							return this.get('s');
						}
					}
				},
				s: {},
				testI1: {
					type: 'integer',
					depend: {
						on: 'i',
						calc: function() {
							return this.get('i');
						}
					}
				},
				i: {},
				testN: {
					type: 'number',
					depend: {
						on: 'n',
						calc: function() {
							return this.get('n');
						}
					}
				},
				n: {},
				testB: {
					type: 'boolean',
					depend: {
						on: 'b',
						calc: function() {
							return this.get('b');
						}
					}
				},
				b: {},
				testSA: {
					type: 'string[]',
					depend: {
						on: 'sa',
						calc: function() {
							return this.get('sa');
						}
					}
				},
				sa: {},
				testIA: {
					type: 'integer[]',
					depend: {
						on: 'ia',
						calc: function() {
							return this.get('ia');
						}
					}
				},
				ia: {},
				testNA: {
					type: 'number[]',
					depend: {
						on: 'na',
						calc: function() {
							return this.get('na');
						}
					}
				},
				na: {},
				testBA: {
					type: 'boolean[]',
					depend: {
						on: 'ba',
						calc: function() {
							return this.get('ba');
						}
					}
				},
				ba: {}
			}
		});

		// create
		var item = model.create({
			id: sequence.next(),
			sa: [],
			ia: [],
			na: [],
			ba: []
		});

		var failMsg = 'テスト失敗。type:{0} の要素のdepend.calcが{1}を返したのにエラーが発生していません';
		try {
			item.set('s', 1);
			ok(false, h5.u.str.format(failMsg, 'string', '数値の1'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('s', new String('TEST'));
			ok(false, h5.u.str.format(failMsg, 'string', 'Stringラッパークラス'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('i', 'a');
			ok(false, h5.u.str.format(failMsg, 'integer', '文字列"a"'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('i', '1');
			ok(false, h5.u.str.format(failMsg, 'integer', '文字列"1"'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('i', new Number(1));
			ok(false, h5.u.str.format(failMsg, 'integer', 'new Number(1)'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('i', new Number(1));
			ok(false, h5.u.str.format(failMsg, 'integer', 'new String(1)'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('n', 'a');
			ok(false, h5.u.str.format(failMsg, 'number', '文字列"a"'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('n', '1');
			ok(false, h5.u.str.format(failMsg, 'number', '文字列"1"'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('n', new Number(1));
			ok(false, h5.u.str.format(failMsg, 'number', 'new Number(1)'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('n', new Number(1));
			ok(false, h5.u.str.format(failMsg, 'number', 'new String(1)'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('b', new Boolean(true));
			ok(false, h5.u.str.format(failMsg, 'boolean', 'new Boolean(true)'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('sa', [new String('ABCDE')]);
			ok(false, h5.u.str.format(failMsg, 'string[]', '[new String("ABCDE")]'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('ia', [new Number(1)]);
			ok(false, h5.u.str.format(failMsg, 'integer[]', '[new Number(1)]'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('na', [new Number(1)]);
			ok(false, h5.u.str.format(failMsg, 'number[]', '[new Number(1)]'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
		try {
			item.set('ba', [new Boolean(true)]);
			ok(false, h5.u.str.format(failMsg, 'boolean[]', '[new Boolean(true)]'));
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CALC_RETURNED_INVALID_VALUE, e.message);
		}
	});

	test('calcの返す値の制約チェックが行われること (type: number, number[], integer, integer[])', 29, function() {
		var constraint = {
			notNull: true,
			min: -1,
			max: 2
		};
		model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				num: {
					type: 'number',
					constraint: constraint,
					depend: {
						on: 'n',
						calc: function() {
							return this.get('n');
						}
					}
				},
				numA: {
					type: 'number[]',
					constraint: constraint,
					depend: {
						on: 'na',
						calc: function() {
							return this.get('na');
						}
					}
				},
				int: {
					type: 'integer',
					constraint: constraint,
					depend: {
						on: 'i',
						calc: function() {
							return this.get('i');
						}
					}
				},
				intA: {
					type: 'integer[]',
					constraint: constraint,
					depend: {
						on: 'ia',
						calc: function() {
							return this.get('ia');
						}
					}
				},
				n: {
					defaultValue: 0
				},
				i: {
					defaultValue: 0
				},
				na: {
					defaultValue: []
				},
				ia: {
					defaultValue: []
				}
			}
		});

		ok(true, 'notNull:true, min:-1, max:2 の複合条件を持つプロパティを持つモデルを作成できること');
		var values = [null, -2, -1, 0, 1, 2, 3];
		var propTypes = ['number', 'number[]', 'integer', 'integer[]'];
		var props = ['n', 'na', 'i', 'ia'];
		for ( var i = 0, l = values.length; i < l; i++) {
			for ( var j = 0, len = props.length; j < len; j++) {
				var descriptor = {
					id: sequence.next()
				};
				var v = propTypes[j].indexOf('[]') > -1 ? [values[i]] : values[i];
				descriptor[props[j]] = v;
				var vStr = $.isArray(v) ? '[' + v[0] + ']' : v;
				var condition = !!(values[i] !== null && -1 <= values[i] && values[i] <= 2);
				try {
					model.create(descriptor);
					ok(condition, h5.u.str.format(
							'type:{0}, 値{1} はnotNull, min, max すべての条件を満たすのでエラーでない', propTypes[j],
							vStr));
				} catch (e) {
					ok(!condition, h5.u.str.format(
							'type:{0}, 値{1} はnotNull, min, max いずれかの条件を満たさないのでエラー', propTypes[j],
							vStr));
				}
			}
		}
	});

	test('string, string[]', 9, function() {
		var constraint = {
			pattern: /^hi/,
			minLength: 4,
			maxLength: 6
		};
		model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				str: {
					type: 'string',
					constraint: constraint
				},
				strA: {
					type: 'string[]',
					constraint: constraint
				}
			}
		});

		ok(true, 'pattern:/^hi/, minLength:4, maxLength:6 の複合条件を持つプロパティを持つモデルを作成できること');
		var values = ['hifive', 'hi5', 'hi-five', 'HIFIVE'];
		var propTypes = ['string', 'string[]'];
		var props = ['str', 'strA'];
		for ( var i = 0, l = values.length; i < l; i++) {
			for ( var j = 0, len = props.length; j < len; j++) {
				var descriptor = {
					id: sequence.next()
				};
				var v = propTypes[j].indexOf('[]') > -1 ? [values[i]] : values[i];
				descriptor[props[j]] = v;
				var vStr = $.isArray(v) ? '[' + v[0] + ']' : v;
				var condition = values[i].indexOf('hi') === 0 && 4 <= values[i].length
						&& values[i].length <= 6;
				try {
					model.create(descriptor);
					ok(condition, h5.u.str.format(
							'type:{0}, 値{1} はpattern, minLength, maxLength すべての条件を満たすのでエラーでない',
							propTypes[j], vStr));
				} catch (e) {
					ok(!condition, h5.u.str.format(
							'type:{0}, 値{1} はpattern, minLength, maxLength いずれかの条件を満たさないのでエラー',
							propTypes[j], vStr));
				}
			}
		}
	});

	test('create時に、依存プロパティにundefinedをセットした場合も、calcが計算されること', 3, function() {
		var model = manager.createModel({
			name: 'TestModel',
			schema: {
				id: {
					id: true
				},
				v: {},
				d: {
					depend: {
						on: 'v',
						calc: function(ev) {
							checkEv.call(this, ev);
							return this.get('v');
						}
					}
				}
			}
		});
		var expectEv;
		function checkEv(ev) {
			// イベントオブジェクトのチェック
			expectEv.target = this;
			deepEqual(ev, expectEv, '依存プロパティにundefinedをセットした時にcalcが呼ばれ、イベントオブジェクトも正しいこと');
		}

		expectEv = {
			props: {
				id: {
					newValue: '1',
					oldValue: undefined
				}
			},
			type: 'create'
		}

		var item = model.create({
			id: '1',
			v: undefined
		});

		strictEqual(item.get('v'), undefined, 'undefiendが格納されていること');
		strictEqual(item.get('d'), undefined, 'calcが返した値が依存プロパティに格納されていること');
	});

	//=============================
	// Definition
	//=============================

	module('自動型変換', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			dataModel1 = manager.createModel({
				name: 'AutoBoxingDataModel1',
				schema: {
					id: {
						id: true
					},
					testS1: {
						type: 'string',
						defaultValue: new String('abc')
					},
					testI1: {
						type: 'integer',
						defaultValue: '10'
					},
					testI2: {
						type: 'integer',
						defaultValue: new Number(10)
					},
					testI3: {
						type: 'integer',
						defaultValue: new String(10)
					},
					testN1: {
						type: 'number',
						defaultValue: '20.1'
					},
					testN2: {
						type: 'number',
						defaultValue: new Number(20.1)
					},
					testN3: {
						type: 'number',
						defaultValue: new String(20.1)
					},
					testSA1: {
						type: 'string[]',
						defaultValue: [new String('ABC')]
					},
					testIA1: {
						type: 'integer[]',
						defaultValue: ['30', new Number(30), new String(30)]
					},
					testNA1: {
						type: 'number[]',
						defaultValue: ['40.1', new Number(40.1), new String(40.1)]
					}
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

	test('create時に自動的に型変換されること', function() {
		var item = dataModel1.create({
			id: sequence.next()
		});

		strictEqual(item.get('testS1'), 'abc',
				'type:stringでdefaultValueがStringラッパークラスの場合、自動的にstringに変換されること。');
		strictEqual(item.get('testI1'), 10,
				'type:integerでdefaultValueがパース可能な文字列の場合、自動的に数値に変換されること。');
		strictEqual(item.get('testI2'), 10,
				'type:integerでdefaultValueがNumberラッパークラスの場合、自動的に数値に変換されること。');
		strictEqual(item.get('testI3'), 10,
				'type:integerでdefaultValueがパース可能な文字列のStringラッパークラスの場合、自動的に数値に変換されること。');
		strictEqual(item.get('testN1'), 20.1,
				'type:numberでdefaultValueがパース可能な文字列の場合、自動的に数値に変換されること。');
		strictEqual(item.get('testN2'), 20.1,
				'type:numberでdefaultValueがNumberラッパークラスの場合、自動的に数値に変換されること。');
		strictEqual(item.get('testN3'), 20.1,
				'type:numberでdefaultValueがパース可能な文字列のStringラッパークラスの場合、自動的に数値に変換されること。');

		deepEqualObs(item.get('testSA1'), ['ABC'],
				'type:string[]でdefaultValueが型変換可能な値を要素に持つ配列の場合、自動的に変換されること。');

		deepEqualObs(item.get('testIA1'), [30, 30, 30],
				'type:numberでdefaultValueが型変換可能な値を要素に持つ配列の場合、自動的に変換されること。');

		deepEqualObs(item.get('testNA1'), [40.1, 40.1, 40.1],
				'type:numberでdefaultValueが型変換可能な値を要素に持つ配列の場合、自動的に変換されること。');

	});

	test('set時に型変換されること',
			function() {
				var item = dataModel1.create({
					id: sequence.next()
				});

				item.set('testS1', new String('ABCDE'));
				item.set('testI1', '-40');
				item.set('testI2', new Number(-40));
				item.set('testI3', new String(-40));
				item.set('testN1', '-50.1');
				item.set('testN2', new Number(-50.1));
				item.set('testN3', new String(-50.1));
				item.set('testSA1', [new String('A'), 'B', new String('C')]);
				item.set('testIA1', ['+60', new Number(60), new String(60)]);
				item.set('testNA1', ['70.1', new Number(70.1), new String(70.1)]);

				strictEqual(item.get('testS1'), 'ABCDE',
						'type:stringのプロパティにStringラッパークラスをsetすると、自動的に数値に変換されること。');
				strictEqual(item.get('testI1'), -40,
						'type:integerのプロパティにパース可能な文字列をsetすると、自動的に数値に変換されること。');
				strictEqual(item.get('testI2'), -40,
						'type:integerのプロパティにパース可能な文字列をsetすると、自動的に数値に変換されること。');
				strictEqual(item.get('testI3'), -40,
						'type:integerのプロパティにパース可能な文字列をsetすると、自動的に数値に変換されること。');
				strictEqual(item.get('testN1'), -50.1,
						'type:numberのプロパティにパース可能な文字列(整数)をsetすると、自動的に数値に変換されること。');
				strictEqual(item.get('testN2'), -50.1,
						'type:numberのプロパティにパース可能な文字列(整数)をsetすると、自動的に数値に変換されること。');
				strictEqual(item.get('testN3'), -50.1,
						'type:numberのプロパティにパース可能な文字列(整数)をsetすると、自動的に数値に変換されること。');
				deepEqualObs(item.get('testSA1'), ['A', 'B', 'C']);
				deepEqualObs(item.get('testIA1'), [60, 60, 60]);
				deepEqualObs(item.get('testNA1'), [70.1, 70.1, 70.1]);
			});

	//=============================
	// Definition
	//=============================

	// datamodelがObservableArrayを扱っていることのテスト
	// h5.u.obj.createObservableArrayで作っているものなので、
	// ObservableArray自体のテストはh5.uに記述する
	module('ObservableArray', {
		setup: function() {
			sequence = h5.core.data.createSequence(1, 1, h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
			manager = h5.core.data.createManager('TestManager');
			createDataModel1();
			item = dataModel1.create({
				id: sequence.next(),
				val: 1
			});

			model = manager.createModel({
				name: 'TestModelForObsArray',
				schema: {
					id: {
						id: true
					},
					numA: {
						type: 'number[]'
					},
					intA: {
						type: 'integer[]'
					},
					strA: {
						type: 'string[]'
					},
					boolA: {
						type: 'boolean[]'
					},
					anyA: {
						type: 'any[]'
					},
					enumA: {
						type: 'enum[]',
						enumValue: [1, 2, 3]
					},
					datamodelA: {
						type: '@' + dataModel1.name + '[]'
					}
				}
			});
		},
		teardown: function() {
			item.removeEventListener('change', changeListener);
			sequence = null;
			dataModel1 = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================
	test('配列要素が自動的にObservableArrayに変換されること',
			function() {
				var item = model.create({
					id: sequence.next()
				});
				var types = ['number[]', 'integer[]', 'string[]', 'boolean[]', 'any[]', 'enum[]',
						'@' + dataModel1.name + '[]'];
				var keys = ['numA', 'intA', 'strA', 'boolA', 'anyA', 'enumA', 'datamodelA'];
				var store = [];
				for ( var i = 0, l = types.length; i < l; i++) {
					ok(h5.u.obj.isObservableArray(item.get(keys[i])), h5.u.str.format(
							'type:{0}の要素がObservableArray', types[i]));
					store.push(item.get(keys[i]));

					// 別のアイテムをセット
					item.set(keys[i], [null]);
				}

				for ( var i = 0, l = types.length; i < l; i++) {
					strictEqual(store[i], item.get(keys[i]),
							'中身の違う配列をsetしてもObservableArrayのインスタンスは変わらないこと');
				}
			});

	test('配列の操作に対しても制約チェックが行われること', 6, function() {
		var item = model.create({
			id: sequence.next()
		});
		var types = ['number[]', 'integer[]', 'string[]', 'boolean[]', 'enum[]',
				'@' + dataModel1.name + '[]'];
		var keys = ['numA', 'intA', 'strA', 'boolA', 'enumA', 'datamodelA'];
		var invalidVals = ['a', 1.1, 1, 'a', 4, {}];

		for ( var i = 0, l = types.length; i < l; i++) {
			var o = item.get(keys[i]);
			try {
				o.push(invalidVals[i]);
				ok(false, 'テスト失敗。エラーが発生していません');
			} catch (e) {
				strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
			}
		}
	});

	test('配列要素にObservableArrayを格納できること', function() {
		var item = model.create({
			id: sequence.next()
		});
		var types = ['number[]', 'integer[]', 'string[]', 'boolean[]', 'any[]', 'enum[]',
				'@' + dataModel1.name + '[]'];
		var keys = ['numA', 'intA', 'strA', 'boolA', 'anyA', 'enumA', 'datamodelA'];
		var numOA = h5.u.obj.createObservableArray();
		numOA.copyFrom([1.1, 2.2, 3.3]);
		var intOA = h5.u.obj.createObservableArray();
		intOA.copyFrom([1, 2, 3]);
		var strOA = h5.u.obj.createObservableArray();
		strOA.copyFrom(['a', 'b']);
		var boolOA = h5.u.obj.createObservableArray();
		boolOA.copyFrom([true, false, true]);
		var anyOA = h5.u.obj.createObservableArray();
		anyOA.copyFrom([1, true, undefined, 'a']);
		var enumOA = h5.u.obj.createObservableArray();
		enumOA.copyFrom([1, 3, 2]);
		var datamodelOA = h5.u.obj.createObservableArray();
		var item1 = dataModel1.create({
			id: '1'
		});
		datamodelOA.copyFrom([item1, null, item1]);

		var vals = [numOA, intOA, strOA, boolOA, anyOA, enumOA, datamodelOA];

		for ( var i = 0, l = types.length; i < l; i++) {
			try {
				var desc = {
					id: sequence.next()
				};
				desc[keys[i]] = vals[i];
				var item = model.create(desc);
				ok(true, h5.u.str.format('type:{0}にObservableArrayを格納できること', types[i]));
				ok(item.get(keys[i]).equals(vals[i]),
						'格納するときに渡したObsArrayと、アイテムが持つObsArrayの中身が同じであること');
				notStrictEqual(item.get(keys[i]), vals[i],
						'格納するときに渡したObsArrayと、アイテムが持つObsArrayはインスタンスが異なること');
			} catch (e) {
				strictEqual(e.code, ERR.ERR_CODE_INVALID_ITEM_VALUE, e.message);
			}
		}
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
			evObj = {};
			dropAllModel(manager);
			changeListener = null;
		}
	});

	//=============================
	// Body
	//=============================
	test('addEventListener 正常系', 4, function() {
		// (文字列,関数)ならエラーにならない
		var validArgs = [['change', changeListener], ['itemsChange', changeListener],
				[' ', changeListener], ['', changeListener]];
		var l = validArgs.length
		for ( var i = 0; i < l; i++) {
			var ret = item.addEventListener(validArgs[i][0], validArgs[i][1]);
			strictEqual(ret, undefined, '(文字列、関数)ならエラーにならないこと。戻り値はundefinedであること。' + validArgs[i]);
			item.removeEventListener(validArgs[i][0], validArgs[i][1]);
		}
		expect(l);
	});


	test('addEventListener 異常系', 5, function() {
		var errCode = ERRCODE.h5scopeglobals.ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER;
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
		try {
			item.addEventListener(document.createEventObject ? document.createEventObject('itemsChange') : new Event('itemsChange'), function() {});
			ok(false, 'イベント名が文字列でない場合にエラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
		try {
			item.addEventListener('itemsChange', {});
			ok(false, 'イベントリスナが関数でない場合にエラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('hasEventListener', 5, function() {
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

	test(
			'removeEventListener',
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

	test('addEventListenerで"change"イベントに登録したハンドラだけが実行され、removeEventListenerされたハンドラは実行されなくなること。',
			function() {
				// イベントをaddする
				var managerEventListener = function() {
					order.push('managerEventListener');
				};
				var modelEventListener = function() {
					order.push('modelEventListener');
				};
				item.addEventListener('change', managerEventListener);

				item.set('val', sequence.next());

				deepEqual(order, ['managerEventListener'],
						'addEventListenerの"change"にハンドリングした関数が実行されていること');

				order = [];
				item.addEventListener('change', managerEventListener);
				item.set('val', sequence.next());

				deepEqual(order, ['managerEventListener'],
						'addEventListenerの"change"に同じ関数を2度ハンドリングしても一度だけ実行されること');

				order = [];
				item.addEventListener('change', modelEventListener);
				item.set('val', sequence.next());

				deepEqual(order, ['managerEventListener', 'modelEventListener'],
						'addEventListenerの"change"にさらに別の関数をハンドリングすると、addした順番で実行されること');

				order = [];
				item.removeEventListener('change', managerEventListener);
				item.set('val', sequence.next());

				deepEqual(order, ['modelEventListener'],
						'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				item.removeEventListener('change', modelEventListener);
				item.set('val', sequence.next());

				deepEqual(order, [], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				function itemsChange() {
					order.push('itemsChange');
				}
				function CHANGE() {
					order.push('CHANGE');
				}
				item.addEventListener('itemsChange', itemsChange);
				item.addEventListener('CHANGE', CHANGE);
				item.set('val', sequence.next());

				deepEqual(order, [], 'addEventListenerの"change"以外を指定してハンドリングした関数は、実行されないこと');

				// addしたイベントを削除
				item.removeEventListener('itemsChange', managerEventListener);
				item.removeEventListener('itemsChange', itemsChange);
				item.removeEventListener('itemsChange', CHANGE);
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
			evObj = {};
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
		// (文字列,関数)ならエラーにならない
		var validArgs = [['change', changeListener], ['itemsChange', changeListener],
				[' ', changeListener], ['', changeListener]];
		var l = validArgs.length
		for ( var i = 0; i < l; i++) {
			var ret = dataModel1.addEventListener(validArgs[i][0], validArgs[i][1]);
			strictEqual(ret, undefined,
					'addEventListenerの戻り値はundefinedであること。引数が2つ指定されていればエラーにはならないこと');
			dataModel1.removeEventListener(validArgs[i][0], validArgs[i][1]);
		}
		expect(l);
	});


	test('addEventListener 異常系', 5, function() {
		var errCode = ERRCODE.h5scopeglobals.ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER;
		try {
			dataModel1.addEventListener();
			ok(false, '引数なしでエラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
		try {
			dataModel1.addEventListener('cnahge');
			ok(false, 'イベント名だけを引数に渡して呼び出した場合に、エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
		try {
			dataModel1.addEventListener(function() {});
			ok(false, '関数だけを引数に渡して呼び出した場合にエラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
		try {
			dataModel1.addEventListener(document.createEventObject ? document.createEventObject('itemsChange') : new Event('itemsChange'), function() {});
			ok(false, 'イベント名が文字列でない場合にエラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
		try {
			dataModel1.addEventListener('itemsChange', {});
			ok(false, 'イベントリスナが関数でない場合にエラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('hasEventListener', 5, function() {
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

	test(
			'removeEventListener ',
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

	test('addEventListenerで"itemsChange"イベントに登録したハンドラが実行され、removeEventListenerすると実行されなくなること。', 6,
			function() {
				var managerEventListener = function() {
					order.push('itemsChange');
				};
				var modelEventListener = function() {
					order.push('itemsChange2');
				};
				dataModel1.addEventListener('itemsChange', managerEventListener);
				dataModel1.create({
					id: sequence.next()
				});

				deepEqual(order, ['itemsChange'],
						'addEventListenerの"itemsChange"にハンドリングした関数が実行されていること');

				order = [];
				dataModel1.addEventListener('itemsChange', managerEventListener);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange'],
						'addEventListenerの"itemsChange"に同じ関数を2度ハンドリングしても一度だけ実行されること');

				order = [];
				dataModel1.addEventListener('itemsChange', modelEventListener);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange', 'itemsChange2'],
						'addEventListenerの"itemsChange"にさらに別の関数をハンドリングすると、addした順番で実行されること');

				order = [];
				dataModel1.removeEventListener('itemsChange', modelEventListener);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange'], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				dataModel1.removeEventListener('itemsChange', managerEventListener);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, [], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				dataModel1.addEventListener('change', managerEventListener);
				dataModel1.val = sequence.next();

				deepEqual(order, [], 'addEventListenerの"itemsChange"以外を指定してハンドリングした関数は、実行されないこと');

				// addしたイベントを削除
				dataModel1.removeEventListener('change', managerEventListener);
				dataModel1.removeEventListener('change', modelEventListener);
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
			evObj = {};
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
		// (文字列,関数)ならエラーにならない
		var validArgs = [['change', changeListener], ['itemsChange', changeListener],
				[' ', changeListener], ['', changeListener]];
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
		var errCode = ERRCODE.h5scopeglobals.ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER;
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
		try {
			manager.addEventListener(document.createEventObject ? document.createEventObject('itemsChange') : new Event('itemsChange'), function() {});
			ok(false, 'イベント名が文字列でない場合にエラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
		try {
			manager.addEventListener('itemsChange', {});
			ok(false, 'イベントリスナが関数でない場合にエラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('hasEventListener', 5, function() {
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

	test(
			'removeEventListener',
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

	test('addEventListenerで"itemsChange"イベントに登録したハンドラが実行され、removeEventListenerすると実行されなくなること。', 6,
			function() {
				var managerEventListener = function() {
					order.push('itemsChange');
				};
				var modelEventListener = function() {
					order.push('itemsChange2');
				};
				manager.addEventListener('itemsChange', managerEventListener);
				dataModel1.create({
					id: sequence.next()
				});

				deepEqual(order, ['itemsChange'],
						'addEventListenerの"itemsChange"にハンドリングした関数が実行されていること');

				order = [];
				manager.addEventListener('itemsChange', managerEventListener);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange'],
						'addEventListenerの"itemsChange"に同じ関数を2度ハンドリングしても一度だけ実行されること');

				order = [];
				manager.addEventListener('itemsChange', modelEventListener);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange', 'itemsChange2'],
						'addEventListenerの"itemsChange"にさらに別の関数をハンドリングすると、addした順番で実行されること');

				order = [];
				manager.removeEventListener('itemsChange', modelEventListener);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, ['itemsChange'], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				manager.removeEventListener('itemsChange', managerEventListener);
				dataModel1.create({
					id: sequence.next()
				});
				deepEqual(order, [], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				manager.addEventListener('change', managerEventListener);
				dataModel1.val = sequence.next();

				deepEqual(order, [], 'addEventListenerの"itemsChange"以外を指定してハンドリングした関数は、実行されないこと');

				// addしたイベントを削除
				manager.removeEventListener('change', managerEventListener);
				manager.removeEventListener('change', modelEventListener);
			});

	//=============================
	// Definition
	//=============================

	// イベントハンドラ
	var managerEventListener = modelEventListener = itemEventListener = null;
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

			managerEventListener = function(ev) {
				order.push('manager');
				evObj = evObj || {};
				evObj['manager'] = ev;
			}
			modelEventListener = function(ev) {
				order.push('model');
				evObj = evObj || {};
				evObj['model'] = ev;
			}

			itemEventListener = function(ev) {
				order.push('item');
				evObj = evObj || {};
				evObj['item'] = ev;
			}

			manager.addEventListener('itemsChange', managerEventListener);
			dataModel1.addEventListener('itemsChange', modelEventListener);
			item.addEventListener('change', itemEventListener);
		},
		teardown: function() {
			// addしたイベントを削除
			manager.removeEventListener('itemsChange', managerEventListener);
			dataModel1.removeEventListener('itemsChange', modelEventListener);
			item.removeEventListener('change', itemEventListener);

			order = [];
			sequence = null;
			dataModel1 = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================
	test('DataItemの値set時にイベントハンドラが実行されること', 2, function() {
		item.set('val', sequence.next());
		deepEqual(order, ['item', 'model', 'manager'], 'データアイテム、データモデル、データマネージャの順でイベントが発火すること');

		order = [];
		item.set('val', new Object(item.get('val')));
		deepEqual(order, ['item', 'model', 'manager'], 'データアイテム、データモデル、データマネージャの順でイベントが発火すること');
	});

	test('DataItemの値set時に値が変わらない場合はイベントハンドラは実行されないこと', 14, function() {
		item.set('val', item.get('val'));

		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		var model = manager.createModel({
			name: 'AutoBoxingDataModel1',
			schema: {
				id: {
					id: true
				},
				testS1: {
					type: 'string',
					defaultValue: 'abc'
				},
				testI1: {
					type: 'integer',
					defaultValue: 10
				},
				testN1: {
					type: 'number',
					defaultValue: '20.1'
				},
				testB1: {
					type: 'boolean',
					defaultValue: true
				},
				testSA1: {
					type: 'string[]',
					defaultValue: ['abc', 'def']
				},
				testIA1: {
					type: 'integer[]',
					defaultValue: [1, 2, 3]
				},
				testNA1: {
					type: 'number[]',
					defaultValue: [1.1, 2.2, 3.3]
				},
				testBA1: {
					type: 'boolean[]',
					defaultValue: [true, false, true]
				}
			}
		});
		item = model.create({
			id: '1'
		});

		item.addEventListener('change', itemEventListener);

		order = [];
		item.set('testS1', 'abc');
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testS1', new String('abc'));
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testI1', '10');
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testI1', new Number(10));
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testI1', new String(10));
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testN1', '20.1');
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testN1', new Number(20.1));
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testB1', new Boolean(true));
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testSA1', ['abc', 'def']);
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testSA1', [new String('abc'), 'def']);
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testIA1', ['1', new Number(2), '3']);
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testNA1', ['1.1', new Number(2.2), '3.3']);
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');

		order = [];
		item.set('testBA1', [new Boolean(true), new Boolean(false), new Boolean(true)]);
		deepEqual(order, [], 'setしても値が変わっていない場合はchangeイベントが発火しないこと');
	});

	test('DataItemのcreateで値の変更があった時にchangeイベントハンドラが実行されること', 9, function() {
		var id = item.get('id');
		dataModel1.create({
			id: id,
			val: 'test'
		});

		deepEqual(order, ['item', 'model', 'manager'], 'データアイテム、データモデル、データマネージャの順でイベントが発火すること');
		order = [];

		dataModel1.create([{
			id: id,
			val: 'test1'
		}]);

		deepEqual(order, ['item', 'model', 'manager'], '配列で渡してもイベントが発火すること');
		order = [];

		dataModel1.create({
			id: id,
			val: item.get('val')
		});
		deepEqual(order, [], '値が変わっていないときはハンドラが実行されないこと');
		order = [];

		dataModel1.create([{
			id: id,
			val: item.get('val')
		}]);
		deepEqual(order, [], '配列で渡しても値が変わっていないときはハンドラが実行されないこと');
		order = [];

		dataModel1.create([{
			id: id,
			val: item.get()
		}, {
			id: id,
			val: '2'
		}, {
			id: id,
			val: '3'
		}]);
		deepEqual(order, ['item', 'model', 'manager'],
				'createに配列で引数を渡したとき、値が最終的に変わっていたらイベントが1度だけ発火すること');
		order = [];

		dataModel1.create([{
			id: id,
			val: '4'
		}, {
			id: id,
			val: '5'
		}, {
			id: id,
			val: '6'
		}]);
		deepEqual(order, ['item', 'model', 'manager'],
				'createに配列で引数を渡したとき、値が最終的に変わっていたらイベントが1度だけ発火すること');
		order = [];

		dataModel1.create([{
			id: id,
			val: '3'
		}, {
			id: id,
			val: 'test2'
		}, {
			id: id,
			val: item.get('val')
		}]);
		deepEqual(order, [], 'createに配列で引数を渡したとき、値が最終的に変わらない場合はイベントは発火しないこと');
		order = [];

		try {
			item.create({
				id: id,
				val: 'aaaa'
			});
		} catch (e) {

		} finally {
			deepEqual(order, [], 'プロパティset時にエラーが発生た場合は、ハンドラは実行されないこと');
		}

		order = [];
		dataModel1.create([{
			id: item2.get('id'),
			val: '3'
		}, {
			id: item2.get('id'),
			val: '4'
		}, {
			id: item2.get('id'),
			val: '5'
		}]);
		deepEqual(order, ['model', 'manager'],
				'addEventListenerしていないデータアイテムの値を変更した時、モデル、マネージャのイベントだけ拾えること');
	});

	test('DataItemが持つObservableArrayの中身に変更があった時にchangeイベントハンドラが実行されること', 14, function() {
		var model = manager.createModel({
			name: 'AryModel',
			schema: {
				id: {
					id: true
				},
				ary: {
					type: 'any[]'
				}
			}
		});
		model.addEventListener('itemsChange', modelEventListener);
		var item = model.create({
			id: sequence.next()
		});

		item.addEventListener('change', itemEventListener);

		var expEvObj = null;
		order = [];
		item.addEventListener('change', itemEventListener);
		o = item.get('ary');
		item.set('ary', [1, 2, 3]);
		deepEqual(order, ['item', 'model', 'manager'], 'setでイベントが上がる');

		order = [];
		evObj = {};
		model.create({
			id: item.get('id'),
			ary: [2, 2, 2, 2]
		});
		deepEqual(order, ['item', 'model', 'manager'], 'createによる変更でイベント上がる');

		order = [];
		evObj = {};
		manager.addEventListener('itemsChage', managerEventListener);
		o = item.get('ary');
		o.copyFrom([1, 2, 3, 4]);
		deepEqual(order, ['item', 'model', 'manager'], 'copyFromでイベント上がる');

		order = [];
		evObj = {};
		o = item.get('ary');
		o.push(1);
		deepEqual(order, ['item', 'model', 'manager'], 'pushでイベント上がる');

		order = [];
		evObj = {};
		o = item.get('ary');
		o.shift(1);
		deepEqual(order, ['item', 'model', 'manager'], 'shiftでイベント上がる');

		order = [];
		evObj = {};
		o = item.get('ary');
		o.unshift(1);
		deepEqual(order, ['item', 'model', 'manager'], 'unshiftでイベント上がる');

		o.copyFrom([2, 1, 3]);
		order = [];
		evObj = {};
		o = item.get('ary');
		o.sort();
		deepEqual(order, ['item', 'model', 'manager'], 'sortでイベント上がる');

		o.copyFrom([2, 1, 3]);
		order = [];
		evObj = {};
		o = item.get('ary');
		o.reverse();
		deepEqual(order, ['item', 'model', 'manager'], 'reverseでイベント上がる');

		o.copyFrom([2, 1, 3]);
		order = [];
		evObj = {};
		o = item.get('ary');
		o.pop();
		deepEqual(order, ['item', 'model', 'manager'], 'popでイベント上がる');

		o.copyFrom([2, 1, 3]);
		order = [];
		evObj = {};
		o = item.get('ary');
		o.splice(0, o.length); // IE8未満では第二引数endを省略できないので指定する
		deepEqual(order, ['item', 'model', 'manager'], 'spliceでイベント上がる');

		o.copyFrom([2, 1, 3]);
		order = [];
		evObj = {};
		o = item.get('ary');
		o.slice(0);
		deepEqual(order, [], '配列の中身の変わらないメソッド(slice)を呼んだ時はイベントは上がらない');

		o.copyFrom([1, 2, 3]);
		order = [];
		evObj = {};
		o.sort();
		deepEqual(order, [], '配列の中身が変わらない時(sort)はイベントは上がらない');

		o.copyFrom([1, 2, 3]);
		order = [];
		evObj = {};
		o.splice(1, 0);
		deepEqual(order, [], '配列の中身が変わらない時(splice)はイベントは上がらない');

		o.copyFrom([1, 2, 3]);
		order = [];
		evObj = {};
		manager.beginUpdate();
		o.push(4);
		o.splice(3, 1, 5);
		o.pop();
		manager.endUpdate();
		deepEqual(order, [], 'beginUpdate-endUpdateで囲んでいて、最終的に配列の中身が変わらない時(sort)はイベントは上がらない');
	});

	test('beginUpdate-endUpdateの間で値の変更があった時に、endUpdate時にchangeイベントハンドラが実行されること', 11, function() {
		manager.beginUpdate();
		item.set('val', 'aaaa');
		deepEqual(order, [], 'begin/endUpdateの中ではsetしてもイベントハンドラは呼ばれないこと');
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
				'二つのプロパティを変更した場合、endUpdateのタイミングで、Item,Model,Managerに登録したイベントハンドラが1回づつ呼ばれること');

		order = [];
		manager.beginUpdate();
		dataModel1.create({
			id: 'a',
			val: 'aaaa'
		});
		deepEqual(order, [], 'begin/endUpdateの中ではcreateしてもイベントハンドラは呼ばれないこと');
		manager.endUpdate();
		deepEqual(order, ['model', 'manager'],
				'新しくデータアイテムを作成した場合、endUpdateのタイミングで、Model,Managerに登録したイベントハンドラが1回づつ呼ばれること');

		order = [];
		manager.beginUpdate();
		dataModel1.create({
			id: 'b',
			val: 'aaaa'
		});
		deepEqual(order, [], 'begin/endUpdateの中ではcreateしてもイベントハンドラは呼ばれないこと');
		dataModel1.remove('b');
		deepEqual(order, [], 'begin/endUpdateの中ではremoveしてもイベントハンドラは呼ばれないこと');
		manager.endUpdate();
		deepEqual(order, [],
				'新しくデータアイテムを作成して、削除した場合、biginUpdate時とendUpdate時で比較して変更はないので、イベントハンドラは呼ばれないこと');

		order = [];
		manager.beginUpdate();
		dataModel1.remove('a');
		deepEqual(order, [], 'begin/endUpdateの中ではremoveしてもイベントハンドラは呼ばれないこと');
		manager.endUpdate();
		deepEqual(order, ['model', 'manager'],
				'データアイテムを削除した場合、endUpdateのタイミングで、Model,Managerに登録したイベントハンドラが1回づつ呼ばれること');
	});

	test(
			'beginUpdate-endUpdateの間で値の変更があった時に、endUpdate時に登録されているchangeイベントハンドラだけが実行されること',
			function() {
				manager.beginUpdate();
				item.set('val', 'aaaa');
				manager.removeEventListener('itemsChange', managerEventListener);
				dataModel1.removeEventListener('itemsChange', modelEventListener);
				item.removeEventListener('change', itemEventListener);
				manager.endUpdate();

				deepEqual(order, [],
						'begin/endUpdateの中でDataItemのイベントハンドラを削除した場合、DataItemのイベントハンドラは実行されないこと。');

				order = [];

				manager.beginUpdate();
				item.set('val', 'bbbb');

				manager.addEventListener('itemsChange', managerEventListener);
				dataModel1.addEventListener('itemsChange', modelEventListener);
				item.addEventListener('change', itemEventListener);
				manager.endUpdate();
				deepEqual(order, ['item', 'model', 'manager'],
						'begin/endUpdateの中でaddEventListenerをした場合、プロパティがbeginUpdate時と値が変わっていればイベントハンドラが実行されること');

				order = [];
				manager.beginUpdate();
				item.set('val', 'bbbb');
				item.addEventListener('change', itemEventListener);
				item.set('val', 'cccc');
				manager.endUpdate();
				deepEqual(order, ['item', 'model', 'manager'],
						'begin/endUpdateの中でaddEventListenerをした場合、プロパティがbeginUpdate時と値が変わっていなければイベントハンドラは実行されないこと');

				item.addEventListener('change', itemEventListener);
				order = [];
				manager.beginUpdate();
				item.set('val', sequence.next());
				item.set('val2', sequence.next());
				manager.endUpdate();
				deepEqual(order, ['item', 'model', 'manager'],
						'二つのプロパティを変更ても場合は、endUpdateのタイミングで、登録したイベントハンドラが1回だけ呼ばれること');
			});

	test('beginUpdate-endUpdateの間でも、依存プロパティは即座に計算されること', 1, function() {
		var model = manager.createModel({
			name: 'DependModel',
			schema: {
				id: {
					id: true
				},
				v: {},
				d: {
					depend: {
						on: 'v',
						calc: function() {
							return this.get('v');
						}
					}
				}
			}
		});
		var item = model.create({
			id: sequence.next()
		});
		manager.beginUpdate();
		item.set('v', 'a');
		strictEqual(item.get('v'), 'a', 'endUpdateを呼ばなくても、depend項目は計算されている');
		manager.endUpdate();
	});

	test('beginUpdate-endUpdateの間でもObservableArrayのイベントは即座に上がること', 1, function() {
		var model = manager.createModel({
			name: 'AryModel',
			schema: {
				id: {
					id: true
				},
				ary: {
					type: 'any[]'
				}
			}
		});

		var item = model.create({
			id: sequence.next()
		});

		var order = [];
		item.get('ary').addEventListener('observe', function(ev) {
			order.push(ev.method);
		});
		manager.beginUpdate();
		item.get().ary.push('a');
		// 内部でoldValueを保存するためにsliceが呼ばれる
		deepEqual(order, ['slice', 'push'], 'begin-endUpdate内でもObservableArrayのイベントは即座に発火する。');
		manager.endUpdate();
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


		model.addEventListener('itemsChange', modelEventListener);
		testItem.addEventListener('change', itemEventListener);

		testItem.numVal = '1';
		deepEqual(order, [], '値が型変換されると変更前と変更後が同じになる場合はイベントが発火しないこと');
		order = [];

		testItem.numVal = new Number(1);
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

	test('イベントハンドラ内で値の変更があった時も、イベント発火すること', 6, function() {
		var model = manager.createModel({
			name: 'TestModel',
			schema: {
				id: {
					id: true
				},
				v: null,
				v2: null
			}
		});

		var item = model.create({
			id: sequence.next()
		});
		var history = [];
		var listener = function(e) {
			history.push(e.props.v.newValue);
			if (this.get('v') === 5) {
				return;
			}
			this.set('v', this.get('v') + 1);
		};
		item.addEventListener('change', listener);

		item.set('v', 1);
		deepEqual(history, [1, 2, 3, 4, 5], 'イベントリスナ内でアイテムの値をセットした時に、イベントが発火すること');

		history = [];

		manager.beginUpdate();
		item.set('v', 3);
		manager.endUpdate();
		deepEqual(history, [3, 4, 5], 'イベントリスナ内でアイテムの値をセットした時に、イベントが発火すること');

		history = [];
		item.removeEventListener('change', listener);
		listener = function(e) {
			history.push(e.props.v.newValue);
			if (this.get('v') === 5) {
				return;
			}
			manager.beginUpdate();
			this.set('v', this.get('v') + 1);
		}
		item.addEventListener('change', listener);
		manager.beginUpdate();
		item.set('v', 2);
		manager.endUpdate();
		deepEqual(history, [2], 'イベントリスナ内で、beginUpdate()できること。endUpdate()までイベント発火しないこと');
		manager.endUpdate();
		deepEqual(history, [2, 3], 'イベントリスナ内で、beginUpdate()できること。endUpdate()までイベント発火しないこと');
		manager.endUpdate();
		deepEqual(history, [2, 3, 4], 'イベントリスナ内で、beginUpdate()できること。endUpdate()までイベント発火しないこと');
		manager.endUpdate();
		deepEqual(history, [2, 3, 4, 5], 'イベントリスナ内で、beginUpdate()できること。endUpdate()までイベント発火しないこと');
	});


	//=============================
	// Definition
	//=============================

	// イベントオブジェクトを格納する変数
	var evObj = {};
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
					val2: {},
					ary: {
						type: 'string[]'
					}
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

			managerEventListener = function(ev) {
				order.push('manager');
				evObj = evObj || {};
				evObj['manager'] = ev;
			}
			modelEventListener = function(ev) {
				order.push('model');
				evObj = evObj || {};
				evObj['model'] = ev;
			}

			itemEventListener = function(ev) {
				order.push('item');
				evObj = evObj || {};
				evObj['item'] = ev;
			}

			manager.addEventListener('itemsChange', managerEventListener);
			dataModel1.addEventListener('itemsChange', modelEventListener);
			item.addEventListener('change', itemEventListener);
		},
		teardown: function() {
			// addしたイベントを削除
			manager.removeEventListener('itemsChange', managerEventListener);
			dataModel1.removeEventListener('itemsChange', modelEventListener);
			item.removeEventListener('change', itemEventListener);

			order = [];
			sequence = null;
			dataModel1 = null;
			dropAllModel(manager);
		}
	});

	//=============================
	// Body
	//=============================
	test('DataItemインスタンスの"change"に登録したハンドラが受け取る引数に正しく情報が格納されていること', 14, function() {
		var listener = function(ev) {
			evObj.item2 = ev;
		};
		item.addEventListener('change', listener);



		var orgVal = item.get('val');

		item.set('val', 'test');

		var ev = evObj.item;
		ok(typeof ev === 'object', '値をsetしたとき、イベントハンドラが実行され、changeイベントオブジェクトが取得できること');
		strictEqual(ev.type, 'change', 'changeイベントオブジェクトのtypeプロパティは"change"であること');
		strictEqual(ev.target, item, 'changeイベントオブジェクトのtargetプロパティはDataItemインスタンスであること');
		deepEqual(ev.props, {
			val: {
				oldValue: orgVal,
				newValue: 'test'
			}
		}, 'changeイベントオブジェクトのpropsプロパティに、変更されたプロパティについてoldValue,newValueが正しく格納されていること');
		strictEqual(ev, evObj.item2,
				'イベントハンドラが二つ登録されているとき、どちらのハンドラにも同じインスタンスのchangeイベントオブジェクトが渡されること');

		// 引数を格納するオブジェクト変数のリセット
		evObj = {};

		// itemの二つ目のハンドラを削除
		item.removeEventListener('change', listener);

		manager.beginUpdate();
		item.set('val', '変更途中');
		item.set('val2', 'ABC2');
		item.set('val', 'ABC');
		manager.endUpdate();

		ev = evObj.item;

		ok(typeof ev === 'object',
				'beginUpdate/endUpdateの間で値を変更した時、イベントハンドラが実行され、changeイベントオブジェクトが取得できること');
		strictEqual(ev.type, 'change', 'changeイベントオブジェクトのtypeプロパティは"change"であること');
		strictEqual(ev.target, item, 'changeイベントオブジェクトのtargetプロパティはDataItemインスタンスであること');
		deepEqual(ev.props, {
			val: {
				oldValue: 'test',
				newValue: 'ABC'
			},
			val2: {
				oldValue: null,
				newValue: 'ABC2'
			}
		}, 'changeイベントオブジェクトのpropsプロパティに、変更されたプロパティについてoldValue,newValueが正しく格納されていること');

		evObj = {};
		var oldVal = item.get('val');
		var oldVal2 = item.get('val2');
		var id = item.get('id');
		dataModel1.create([{
			id: id,
			val: '変更途中',
			val2: '変更途中'
		}, {
			id: id,
			val: 'AAAA',
			val2: 'BBBB'
		}]);
		ev = evObj.item;
		ok(typeof ev === 'object', 'createので値を変更した時、イベントハンドラが実行され、changeイベントオブジェクトが取得できること');
		strictEqual(ev.type, 'change', 'changeイベントオブジェクトのtypeプロパティは"change"であること');
		strictEqual(ev.target, item, 'changeイベントオブジェクトのtargetプロパティはDataItemインスタンスであること');
		deepEqual(ev.props, {
			val: {
				oldValue: oldVal,
				newValue: 'AAAA'
			},
			val2: {
				oldValue: oldVal2,
				newValue: 'BBBB'
			}
		}, 'changeイベントオブジェクトのpropsプロパティに、変更されたプロパティについてoldValue,newValueが正しく格納されていること');


		oldVal = item.get('val');
		oldVal2 = item.get('val2');
		item.set({
			val: 'CC',
			val2: 'DD'
		});
		ev = evObj.item;
		deepEqual(ev.props, {
			val: {
				oldValue: oldVal,
				newValue: 'CC'
			},
			val2: {
				oldValue: oldVal2,
				newValue: 'DD'
			}
		}, 'setにオブジェクトを指定して複数値を更新した時、変更されたプロパティについてoldValue,newValueが正しく格納されていること');
	});

	test('type:[]の要素について、DataItemインスタンスの"change"に登録したハンドラが受け取る引数に正しく情報が格納されていること', 24, function() {
		var model = manager.createModel({
			name: 'aryModel',
			schema: {
				id: {
					id: true
				},
				ary: {
					type: 'any[]'
				},
				ary2: {
					type: 'string[]'
				}
			}
		});
		var item2 = model.create({
			id: sequence.next()
		});
		var listener = function(ev) {
			evObj.item2 = ev;
		};
		item2.addEventListener('change', listener);

		item2.set('ary', ['a', 'b']);

		var ev = evObj.item2;
		ok(typeof ev === 'object', '値をsetしたとき、イベントハンドラが実行され、changeイベントオブジェクトが取得できること');
		strictEqual(ev.type, 'change', 'changeイベントオブジェクトのtypeプロパティは"change"であること');
		strictEqual(ev.target, item2, 'changeイベントオブジェクトのtargetプロパティはDataItemインスタンスであること');
		deepEqual(ev.props.ary.oldValue, [], 'changeイベントオブジェクトのpropsプロパティに、oldValueが正しく格納されていること');
		ok($.isArray(ev.props.ary.oldValue), 'oldValueはArrayクラスであること');
		deepEqualObs(ev.props.ary.newValue, ['a', 'b'],
				'changeイベントオブジェクトのpropsプロパティに、newValueが正しく格納されていること');
		strictEqual(ev.props.ary.newValue, item2.get('ary'),
				'newValueはObservalArrayで、アイテムが持つものと同じインスタンスであること');

		// 引数を格納するオブジェクト変数のリセット
		evObj = {};

		// begin-end間で配列の中身を更新
		manager.beginUpdate();
		var ary = item2.get('ary');
		item2.set('ary', ['A']);
		ary.push('B');
		manager.endUpdate();

		ev = evObj.item2;
		ok(typeof ev === 'object', '値をsetしたとき、イベントハンドラが実行され、changeイベントオブジェクトが取得できること');
		strictEqual(ev.type, 'change', 'changeイベントオブジェクトのtypeプロパティは"change"であること');
		strictEqual(ev.target, item2, 'changeイベントオブジェクトのtargetプロパティはDataItemインスタンスであること');
		deepEqual(ev.props.ary.oldValue, ['a', 'b'],
				'changeイベントオブジェクトのpropsプロパティに、oldValueが正しく格納されていること');
		ok($.isArray(ev.props.ary.oldValue), 'oldValueはArrayクラスであること');
		deepEqualObs(ev.props.ary.newValue, ['A', 'B'],
				'changeイベントオブジェクトのpropsプロパティに、newValueが正しく格納されていること');
		strictEqual(ev.props.ary.newValue, item2.get('ary'),
				'newValueはObservalArrayで、アイテムが持つものと同じインスタンスであること');

		// setに複数引数を渡して更新
		evObj = {};
		try {
			item2.set({
				ary: ['B'],
				ary2: ['C', 'D']
			});
		} catch (e) {
		}
		ev = evObj.item2;
		ok(typeof ev === 'object', '値をsetしたとき、イベントハンドラが実行され、changeイベントオブジェクトが取得できること');
		strictEqual(ev.type, 'change', 'changeイベントオブジェクトのtypeプロパティは"change"であること');
		strictEqual(ev.target, item2, 'changeイベントオブジェクトのtargetプロパティはDataItemインスタンスであること');
		deepEqual(ev.props.ary.oldValue, ['A', 'B'],
				'changeイベントオブジェクトのpropsプロパティに、oldValueが正しく格納されていること');
		ok($.isArray(ev.props.ary.oldValue), 'oldValueはArrayクラスであること');
		deepEqualObs(ev.props.ary.newValue, ['B'],
				'changeイベントオブジェクトのpropsプロパティに、newValueが正しく格納されていること');
		strictEqual(ev.props.ary.newValue, item2.get('ary'),
				'newValueはObservalArrayで、アイテムが持つものと同じインスタンスであること');
		ok($.isArray(ev.props.ary2.oldValue), 'oldValueはArrayクラスであること');
		deepEqualObs(ev.props.ary2.newValue, ['C', 'D'],
				'changeイベントオブジェクトのpropsプロパティに、newValueが正しく格納されていること');
		strictEqual(ev.props.ary2.newValue, item2.get('ary2'),
				'newValueはObservalArrayで、アイテムが持つものと同じインスタンスであること');
	});

	test('DataModelインスタンスの"itemsChange"に登録したハンドラが受け取る引数に正しく情報が格納されていること createdプロパティの確認',
			function() {
				var item = dataModel1.create({
					id: sequence.next()
				});
				var ev = evObj['model'];

				strictEqual(ev.type, 'itemsChange', 'typeプロパティにイベント名"itemsChange"が格納されていること');
				strictEqual(ev.target, dataModel1, 'targetプロパティにデータモデルのインスタンスが格納されていること');
				deepEqual(ev.changed, [], 'changedプロパティは空配列であること');
				deepEqual(ev.created, [item], 'createdプロパティに、生成されたアイテムのインスタンスが格納されていること');
				deepEqual(ev.recreated, [], 'recreatedプロパティは空配列であること');
				deepEqual(ev.removed, [], 'changedプロパティは空配列であること');

				evObj = {};
				var items = dataModel1.create([{
					id: sequence.next()
				}, {
					id: sequence.next()
				}]);
				var ev = evObj['model'];

				deepEqual(ev.changed, [], 'changedプロパティは空配列であること');
				// createdの順番は問わないので、順序がitems(createの戻り値)と順序が違ってもテスト通るようにする
				// 配列中の要素についてインスタンスが等しいかで比較(===)で比較する
				equalsArrayIgnoreOrder(ev.created, items,
						'createdプロパティに、生成されたアイテムのインスタンスが格納されていること');
				deepEqual(ev.recreated, [], 'recreatedプロパティは空配列であること');
				deepEqual(ev.removed, [], 'changedプロパティは空配列であること');

				ev = {};
				dataModel2.addEventListener('itemsChange', modelEventListener);
				var item2 = dataModel2.create({
					id: sequence.next(),
					ary: ['a', 'b']
				});
			});

	test('DataModelインスタンスの"itemsChange"に登録したハンドラが受け取る引数に正しく情報が格納されていること changedプロパティの確認',
			function() {
				var item = dataModel1.create({
					id: '1'
				});
				evObj = {};
				// itemsChangeベントオブジェクトのchangeと比較するため、changeイベントオブジェクトをとっておく。
				var changeArgs = [];
				item.addEventListener('change', function(ev) {
					changeArgs.push(ev);
				});
				item.set('val', 'test');
				var ev = evObj['model'];

				strictEqual(ev.changed[0], changeArgs[0],
						'changedプロパティに、変更したアイテムのchangeイベントオブジェクトが格納されていること');
				deepEqual(ev.created, [], 'createdプロパティは空配列であること');
				deepEqual(ev.recreated, [], 'recreatedプロパティは空配列であること');
				deepEqual(ev.removed, [], 'changedプロパティは空配列であること');

				dataModel1.create({
					id: '2'
				}).addEventListener('change', function(ev) {
					changeArgs.push(ev);
				});

				evObj = {};
				changeArgs = [];
				dataModel1.create([{
					id: '1',
					val: 'AAA'
				}, {
					id: '2',
					val: 'BBB'
				}]);
				ev = evObj['model'];
				// changeイベントオブジェクトがitemsChangeイベントオブジェクトのchangedに入っていることを確認する。
				// 複数ある場合、格納される順番は問わないので、格納されている順序が違っていてもテストが通るようにする
				// インスタンスは違ってていいので、deepで比較するよう指定する
				equalsArrayIgnoreOrder(ev.changed, changeArgs,
						'changedプロパティに、変更したアイテムインスタンスが格納されていること', true);
				deepEqual(ev.created, [], 'createdプロパティは空配列であること');
				deepEqual(ev.recreated, [], 'recreatedプロパティは空配列であること');
				deepEqual(ev.removed, [], 'changedプロパティは空配列であること');
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

				var ev = evObj['model'];

				deepEqual(ev.changed, [], 'changedプロパティは空配列であること');
				deepEqual(ev.created, [], 'createdプロパティは空配列であること');
				deepEqual(ev.recreated, [{
					id: '1',
					oldItem: oldItem,
					newItem: newItem
				}], 'recreatedプロパティに、削除されたインスタンスと、再生成されたインスタンスが格納されていること');
				deepEqual(ev.removed, [], 'removedプロパティは空配列であること');
				evObj = {};

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

				var ev = evObj['model'];

				deepEqual(ev.changed, [], 'changedプロパティは空配列であること');
				deepEqual(ev.created, [], 'createdプロパティは空配列であること');
				deepEqual(ev.recreated, [{
					id: '1',
					oldItem: oldItem,
					newItem: newItem
				}, {
					id: '2',
					oldItem: oldItem2,
					newItem: newItem2
				}], 'recreatedプロパティに、削除されたインスタンスと、再生成されたインスタンスが格納されていること');
				deepEqual(ev.removed, [], 'removedプロパティは空配列であること');
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
				oldItem3.addEventListener('change', function(ev) {
					changeArgs.push(ev);
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

				var ev = evObj['model'];

				deepEqual(ev.changed, changeArgs, 'changedプロパティにchangeイベントオブジェクトが格納されていること');
				deepEqual(ev.created, [newItem5], 'createdプロパティに生成されたDataItemインスタンスが格納されていること');
				deepEqual(ev.recreated, [{
					id: '1',
					oldItem: oldItem,
					newItem: newItem
				}], 'recreatedプロパティに、削除されたインスタンスと、再生成されたインスタンスが格納されていること');
				deepEqual(ev.removed, [oldItem2], 'removedプロパティに削除されたインスタンスが格納されていること');
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
						},
						val: {}
					}
				});
				var model2 = manager.createModel({
					name: 'BModel',
					schema: {
						id: {
							id: true
						},
						val: {}
					}
				});
				var model3 = manager.createModel({
					name: 'CModel',
					schema: {
						id: {
							id: true
						},
						val: {}
					}
				});

				// 各モデルのitemsChangeハンドラに渡される引数を取得するため、イベントハンドラをaddする
				var evs = {};
				function modelChangeListener(ev) {
					evs[ev.target.name] = ev;
				}
				model1.addEventListener('itemsChange', modelChangeListener);
				model2.addEventListener('itemsChange', modelChangeListener);
				model3.addEventListener('itemsChange', modelChangeListener);

				model1.create({
					id: '1'
				});
				model1.create({
					id: '2'
				});
				model2.create({
					id: '1'
				});
				model2.create({
					id: '2'
				});
				// アイテムを生成してイベントを上げる
				manager.beginUpdate();
				model1.remove('1');
				model1.create({
					id: '1'
				});
				model1.create({
					id: '2',
					val: '2'
				});
				model1.create({
					id: '3'
				});
				model2.create({
					id: '3'
				});
				model2.remove('2');
				manager.endUpdate();

				strictEqual(evObj.manager.type, 'itemsChange', 'typeが"itemsChange"であること');
				var evAry = ['created', 'changed', 'removed', 'recreated'];
				for ( var i = 0, l = evAry.length; i < l; i++) {
					var prop = evAry[i];
					strictEqual(
							evObj.manager.models.AModel[prop],
							evs.AModel[prop],
							h5.u.str
									.format(
											'AModelのイベントオブジェクトの{0}が、managerのイベントオブジェクトのmodels.AModel.{0}に格納されていること(インスタンスが同じ)',
											prop));
					strictEqual(
							evObj.manager.models.BModel[prop],
							evs.BModel[prop],
							h5.u.str
									.format(
											'BModelのイベントオブジェクトの{0}が、managerのイベントオブジェクトのmodels.BModel.{0}に格納されていること(インスタンスが同じ)',
											prop));
				}
			});
	//=============================
	// Definition
	//=============================
	module('createSequence', {});

	//=============================
	// Body
	//=============================
	test(
			'createSequence',
			35,
			function() {
				var sequence = h5.core.data.createSequence();
				strictEqual(sequence.returnType, h5.core.data.SEQUENCE_RETURN_TYPE_INT,
						'引数なし returnTypeがh5.core.data.SEQUENCE_RETURN_TYPE_INTであること');
				strictEqual(sequence.current(), 1, '引数なし 初期値が1であること');
				strictEqual(sequence.next(), 1, '引数なし next()でcurrent()の値が取得できること');
				strictEqual(sequence.current(), 2, '引数なし next()を呼んだのでcurrent()の戻り値が2になっていること');
				strictEqual(sequence.next(), 2, '引数なし next()でcurrent()の値が取得できること');

				sequence = h5.core.data.createSequence(0);
				strictEqual(sequence.returnType, h5.core.data.SEQUENCE_RETURN_TYPE_INT,
						'引数(0) returnTypeがh5.core.data.SEQUENCE_RETURN_TYPE_INTであること');
				strictEqual(sequence.current(), 0, '引数(0) 初期値が0であること');
				strictEqual(sequence.next(), 0, '引数(0) next()でcurrent()の値が取得できること');
				strictEqual(sequence.current(), 1, '引数(0) next()を呼んだのでcurrent()の戻り値が1になっていること');
				strictEqual(sequence.next(), 1, '引数(0) next()でcurrent()の値が取得できること');

				sequence = h5.core.data.createSequence(null, 100);
				strictEqual(sequence.returnType, h5.core.data.SEQUENCE_RETURN_TYPE_INT,
						'引数(null, 100) returnTypeがh5.core.data.SEQUENCE_RETURN_TYPE_INTであること');
				strictEqual(sequence.current(), 1, '引数(null, 100) 初期値が1であること');
				strictEqual(sequence.next(), 1, '引数(null, 100) next()でcurrent()の値が取得できること');
				strictEqual(sequence.current(), 101,
						'引数(null, 100) next()を呼んだのでcurrent()の戻り値が101になっていること');
				strictEqual(sequence.next(), 101, '引数(null, 100) next()でcurrent()の値が取得できること');

				sequence = h5.core.data.createSequence(1000, 100);
				strictEqual(sequence.returnType, h5.core.data.SEQUENCE_RETURN_TYPE_INT,
						'引数(1000, 100) returnTypeがh5.core.data.SEQUENCE_RETURN_TYPE_INTであること');
				strictEqual(sequence.current(), 1000, '引数(1000, 100) 初期値が1000であること');
				strictEqual(sequence.next(), 1000, '引数(1000, 100) next()でcurrent()の値が取得できること');
				strictEqual(sequence.current(), 1100,
						'引数(1000, 100) next()を呼んだのでcurrent()の戻り値が1100になっていること');
				strictEqual(sequence.next(), 1100, '引数(1000, 100) next()でcurrent()の値が取得できること');

				sequence = h5.core.data.createSequence(null, null,
						h5.core.data.SEQUENCE_RETURN_TYPE_INT);
				strictEqual(
						sequence.returnType,
						h5.core.data.SEQUENCE_RETURN_TYPE_INT,
						'引数(null, null, h5.core.dataSEQUENCE_RETURN_TYPE_INT) returnTypeがh5.core.data.SEQUENCE_RETURN_TYPE_INTであること');
				strictEqual(sequence.current(), 1,
						'引数(null, null, h5.core.dataSEQUENCE_RETURN_TYPE_INT) 初期値が1であること');
				strictEqual(sequence.next(), 1,
						'引数(null, null, h5.core.dataSEQUENCE_RETURN_TYPE_INT) next()でcurrent()の値が取得できること');
				strictEqual(sequence.current(), 2,
						'引数(null, null, h5.core.dataSEQUENCE_RETURN_TYPE_INT) next()を呼んだのでcurrent()の戻り値が2になっていること');
				strictEqual(sequence.next(), 2,
						'引数(null, null, h5.core.dataSEQUENCE_RETURN_TYPE_INT) next()でcurrent()の値が取得できること');

				sequence = h5.core.data.createSequence(null, null,
						h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
				strictEqual(
						sequence.returnType,
						h5.core.data.SEQUENCE_RETURN_TYPE_STRING,
						'引数(null, null, h5.core.dataSEQUENCE_RETURN_TYPE_STRING) returnTypeがh5.core.data.SEQUENCE_RETURN_TYPE_STRINGであること');
				strictEqual(sequence.current(), "1",
						'引数(null, null, h5.core.dataSEQUENCE_RETURN_TYPE_STRING) 初期値が"1"であること');
				strictEqual(sequence.next(), "1",
						'引数(null, null, h5.core.dataSEQUENCE_RETURN_TYPE_STRING) next()でcurrent()の値が取得できること');
				strictEqual(sequence.current(), "2",
						'引数(null, null, h5.core.dataSEQUENCE_RETURN_TYPE_STRING) next()を呼んだのでcurrent()の戻り値が"2"になっていること');
				strictEqual(sequence.next(), "2",
						'引数(null, null, h5.core.dataSEQUENCE_RETURN_TYPE_STRING) next()でcurrent()の値が取得できること');

				sequence = h5.core.data.createSequence(500, 5,
						h5.core.data.SEQUENCE_RETURN_TYPE_STRING);
				strictEqual(
						sequence.returnType,
						h5.core.data.SEQUENCE_RETURN_TYPE_STRING,
						'引数(500, 5, h5.core.dataSEQUENCE_RETURN_TYPE_STRING) returnTypeがh5.core.data.SEQUENCE_RETURN_TYPE_STRINGであること');
				strictEqual(sequence.current(), "500",
						'引数(500, 5, h5.core.dataSEQUENCE_RETURN_TYPE_STRING) 初期値が"500"であること');
				strictEqual(sequence.next(), "500",
						'引数(500, 5, h5.core.dataSEQUENCE_RETURN_TYPE_STRING) next()でcurrent()の値が取得できること');
				strictEqual(sequence.current(), "505",
						'引数(500, 5, h5.core.dataSEQUENCE_RETURN_TYPE_STRING) next()を呼んだのでcurrent()の戻り値が"505"になっていること');
				strictEqual(sequence.next(), "505",
						'引数(500, 5, h5.core.dataSEQUENCE_RETURN_TYPE_STRING) next()でcurrent()の値が取得できること');
			});
});
