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
						value: invalidProps
					}
				});
				var errMsg = JSON ? JSON.stringify(invalidProps) : invalidProps;
				ok(false, 'エラーが発生していません。' + errMsg);
			} catch (e) {
				strictEqual(e.code, errCode, e.message);
			}
		}
	}

	module('createManager', {
		setup: function() {
			manager = undefined;
		},
		teardown: function() {
			// マネージャをリセットする
			dropAllModel(manager);
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
		var invalidNs = [0, 1, true, false, [], {}, '', '.com.htmlhifive', 'あ', 'com htmlhifive',
				'com.htmlhifive.'];
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

	test('データモデルマネージャの作成 名前空間指定のない場合は同名のにマネージャを作成できること', function() {
		manager = h5.core.data.createManager('TestModel');
		var manager2 = h5.core.data.createManager('TestModel');
		ok(manager !== manager2, '同名のマネージャを作成したとき、別インスタンスであること');
	});

	test('データモデルマネージャの作成 指定した名前空間にマネージャ名に指定したプロパティがすでに存在する時にエラーが出ること', function() {
		var errCode = 30005;
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

	module('createModel', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			// マネージャをリセットする
			dropAllModel(manager);
		}
	});

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

	test('データモデルの登録 descriptorがオブジェクトでない場合はエラーが発生すること', function() {
		// TODO エラーコード確認する
		var errCode = 30001;
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
						id: true
					}
				}
			});
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('データモデルの登録 既に存在するnameのデータモデルを登録しようとすると、無視されること', 2, function() {
		// TODO エラーコード確認する
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
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
					id: true,
				},
				value: {
					defaultValue: 2
				}
			}
		});
		strictEqual(model, model2, '2度目のcreateModelの戻り値が1度目の戻り値と同じインスタンスを返すこと');
		var item = model2.create({
			id: 0
		});
		strictEqual(item.value, 1, '1度目のcreateModelのスキーマに基づいてアイテムが生成されること');
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
					id: 0
				});

				strictEqual(item.id, 0, '指定したidでアイテムが生成されていること');
				strictEqual(item.value, 2, '同名のプロパティについては、baseを指定している側で設定したdefaultValueが入っていること');
				strictEqual(item.value2, 1, '継承先にしかないプロパティの値を取得できること');
				strictEqual(item.val, 2, 'baseを指定している側にしかないプロパティの値に指定したdefaultValueが入っていること');
			});

	test('データモデルの登録 baseにデータモデルを指定し、schemaに指定したデータモデルと同名のid:trueな属性がある場合は、上書きされてモデルが作成されること',
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
					id: "a"
				});

				strictEqual(item.id, 'a', '指定したidでアイテムが生成されていること');
				strictEqual(item.value, 2, '同名のプロパティについては、baseを指定している側で設定したdefaultValueが入っていること');
				strictEqual(item.value2, 1, '継承先にしかないプロパティの値を取得できること');
				strictEqual(item.val, 2, 'baseを指定している側にしかないプロパティの値に指定したdefaultValueが入っていること');
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
		var model2 = manager.createModel({
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
			base: '@TestDataMode2',
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
			id: "a"
		});

		strictEqual(item.id, 'a', '指定したidでアイテムが生成されていること');
		strictEqual(item.value, 3, '同名のプロパティについては、上書かれていること');
		strictEqual(item.value2, 3, '同名のプロパティについては、上書かれていること');
		strictEqual(item.value3, 3, '同名のプロパティについては、上書かれていること');
		strictEqual(item.data1, 1, '継承先にしかないプロパティの値を取得できること');
		strictEqual(item.data2, 2, '継承先にしかないプロパティの値を取得できること');
		strictEqual(item.data3, 2, '継承先にないデータはそのモデルで指定したdefaultValueの値が格納されていること');
	});


	test('データモデルの登録 baseの指定が文字列でない場合はエラーが発生すること', function() {
		// TODO エラーコード確認する
		var errCode = 30000;
		var noStrs = [['@TestDataModel'], {}, 1, true];
		var l = noStrs.length;
		expect(l);
		manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
					type: 'number'
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
							id: true,
							type: 'string'
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
		// TODO エラーコード確認する
		var errCode = 30000;
		var invalidStrs = ['TestDataModel', '@TestDataModel, @TestDataModel2'];
		var l = invalidStrs.length;
		expect(l);
		manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true,
					type: 'number'
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
					id: true,
					type: 'number'
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
							id: true,
							type: 'string'
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
			console.log(e)
			strictEqual(e.code, errCode, e.message);
		}
		dropAllModel(manager2);
	});

	test('データモデルの登録 schemaがオブジェクトでない場合はエラーが発生すること', function() {
		// TODO エラーコード確認する
		var errCode = 30000;
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
							id: true,
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

	test('データモデルの登録 schemaのチェック constraintにオブジェクトでない値を指定した場合はエラーが出ること', function() {
		// TODO エラーコード確認する
		var errCode = 30000;
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
		// TODO エラーコード確認する
		var errCode = 30000;

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
		var invalidStrMinLength = [-1, '10', NaN, -Infinity, Infinity, [], {}, true];
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
		// TODO エラーコード確認する
		var errCode = 30000;
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
		expect(l);

		manager.createModel({
			name: 'ParentModel',
			schema: {
				id: true
			}
		});

		for ( var i = 0; i < l; i++) {
			testErrorWhenCreateModelByValueProperty({
				type: invalidValues[i].type,
				constraint: invalinvalidValues[i].constraint
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
				constraint: invalinvalidValues[i].constraint
			});
		}
	});

	test('データモデルの登録 schemaのチェック id:trueの項目にtypeを指定するとエラーになること', function() {
		// TODO エラーコード確認
		var errCode = 30000;
		try {
			manager.createModel({
				name: 'TestDataModel',
				schema: {
					id: {
						id: true,
						type: 'string'
					}
				}
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('データモデルの登録 schemaのチェック id:trueの項目にnotNull, notEmpty, maxLength:0 を指定できないこと', function() {
		// TODO エラーコード確認
		var errCode = 30000;
		var invalidConstraint = [{
			notNull: true
		}, {
			notEmpty: true
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
		var errCode = 30000;
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

	test('データモデルの登録 schemaのチェック defaultValueがtypeに指定されている型を満たさない場合はエラーになること', function() {
		// TODO エラーコード確認
		var errCode = 30000;

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
		var parentModel1 = manger.createModel(parentModelDesc);
		var parentModel2 = manager2.createModel(parentModelDesc);
		var parentModelItem = parentModel1.create({
			id: 1
		});
		var paretModelItem2 = parentModel2.create({
			id: 1
		});

		var types = ['string', 'number', 'integer', 'boolean', 'object', 'array', '@ParentModel',
				'string[]', 'number[]', 'integer[]', 'boolean[]', 'object[]', '@ParentModel[]',
				'string[][]'];
		var invalidValueArrays = [];
		// stringでないもの
		invalidValueArrays.push([1, true, ["a"], {}]);
		// numberでないもの
		invalidValueArrays.push(['a1', true, [1], {}]);
		// integerでないもの
		invalidValueArrays.push([1.1, Infinity, -Infinity, '1', true, [1], {}]);
		// booleanでないもの
		invalidValueArrays.push([1, '1', [true], {}, new Boolean(true)]);
		// objectでないもの
		invalidValueArrays.push([1, '1', [{}]]);
		// arrayでないもの
		invalidValueArrays.push([1, "1", {}]);
		// 同じマネージャのデータモデル@ParentModelでないもの
		invalidValueArrays.push([1, "1", {
			id: 1
		}, paretModelItem2, [parentModelItem]]);
		// string[]でないもの
		invalidValueArrays.push(["a", ["a", "b", 1], [["a"]]]);
		// number[]でないもの
		invalidValueArrays.push([1, [1, 2, "1"], [[1]]]);
		// integer[]でないもの
		invalidValueArrays.push([1, [1, 2, 1.1], [[1]]]);
		// object[]でないもの
		invalidValueArrays.push([{}, [[]], [[{}]]]);
		// @ParentModel[]でないもの
		invalidValueArrays.push([parentModelItem, [parentModelItem2], [[parentModelItem]]]);
		// string[][]でないもの
		invalidValueArrays.push(["a", ["a"], [["a", "b", 1]], [[["a"]]]]);

		var invalidProps = [];
		for ( var i = 0, typesLen = types.length; i < typesLen; i++) {
			var type = types[i];
			for ( var j = 0, valueArraysLen = invalidValueArrays.length; j < valueArraysLen; j++) {
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
				// TODO エラーコード確認
				var errCode = 30000;
				var type = 'number';
				var invalidProps = [{
					// defaultValueなし
					type: type,
					constraint: {
						notNull: true
					}
				}, {
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
				// TODO エラーコード確認
				var errCode = 30000;
				var type = 'string';
				var invalidProps = [{
					type: type,
					// defaultValueなし
					constraint: {
						notNull: true
					}
				}, {
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
				// TODO エラーコード確認
				var errCode = 30000;
				var type = 'integer';
				var invalidProps = [{
					type: type,
					// defaultValueなし
					constraint: {
						notNull: true
					}
				}, {
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
				// TODO エラーコード確認
				var errCode = 30000;

				var type = 'boolean';

				var invalidProps = [{
					type: type,
					// defaultValueなし
					constraint: {
						notNull: true
					}
				}, {
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: null
				}];

				testErrorWhenCreateModelByValueProperty(invalidProps, errCode);
			});

	test('データモデルの登録 schemaのチェック defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること object',
			function() {
				// TODO エラーコード確認
				var errCode = 30000;

				var type = 'object';

				var invalidProps = [{
					type: type,
					// defaultValueなし
					constraint: {
						notNull: true
					}
				}, {
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
				// TODO エラーコード確認
				var errCode = 30000;

				var type = 'array';

				var invalidProps = [{
					type: type,
					// defaultValueなし
					constraint: {
						notNull: true
					}
				}, {
					type: type,
					constraint: {
						notNull: true
					},
					defaultValue: null
				}];

				testErrorWhenCreateModelByValueProperty(invalidProps, errCode);
			});
	test('データモデルの登録 schemaのチェック defaultValueがconstraintに指定されている条件を満たさない場合はエラーになること any',
			function() {
				// TODO エラーコード確認
				var errCode = 30000;

				var type = 'any';

				var invalidProps = [{
					type: type,
					// defaultValueなし
					constraint: {
						notNull: true
					}
				}, {
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
				// TODO エラーコード確認
				var errCode = 30000;

				var type = '@ParentModel';

				var invalidProps = [{
					type: type,
					// defaultValueなし
					constraint: {
						notNull: true
					}
				}, {
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
				// TODO エラーコード確認
				var errCode = 30000;

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
				// TODO エラーコード確認
				var errCode = 30000;

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

	module('dropModel', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			// マネージャをリセットする
			dropAllModel(manager);
		}
	});

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
					id: 1,
					val: 1
				});
				model2.create({
					id: 2,
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
				strictEqual(model1.items['1'].val, 1,
						'dropModelの戻り値はドロップ前にcreateしたアイテムを持っており、値を取得できること');
				manager.dropModel('TestDataModel2');
				strictEqual(manager.models.TestDataModel2, undefined,
						'モデル2をドロップした後、モデル2がmanager.modelsの中に入っていないこと');
				deepEqual(manager.models, {}, '全てのモデルをドロップしたので、manager.modelsは空オブジェクトであること');
			});

	module('create, set', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			// マネージャをリセットする
			dropAllModel(manager);
		}
	});

	test('createでアイテムが生成できること。引数に配列を渡した場合は戻り値も配列になること。', function() {
		// TODO createやitem.id=xxx で重複したidを持たせようとするとエラー (配列の途中でエラーが出た場合、アトミックに処理されるかどうかの仕様を確認する)
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				val: {}
			}
		});

		var item = model.create({
			id: '123',
			val: 456
		});

		strictEqual(item.id, '123', 'create時に指定した値が戻り値から取得できること');
		strictEqual(item.val, 456, 'create時に指定した値が戻り値から取得できること');


		item = model.create({
			id: 456
		});

		strictEqual(item.id, '456', 'createでidに数字を指定しても、文字列として格納されていること');
		strictEqual(item.val, null, 'create時に値を指定していない値について、nullが格納されてること');

		var items = model.create([{
			id: 1
		}, {
			id: 2
		}, {
			id: 3
		}]);

		strictEqual(items.length, 3, 'createの引数に配列を渡すと、戻り値がアイテムの配列として返ってくること');
		strictEqual(items[0].id, '1', '戻り値の配列の中身が正しいこと');
		strictEqual(items[1].id, '1', '戻り値の配列の中身が正しいこと');
		strictEqual(items[2].id, '1', '戻り値の配列の中身が正しいこと');
	});

	test('idの重複するアイテムは生成できず、エラーになること', 2, function() {
		var errCode = 30000;
		var model = manager.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				val: {}
			}
		});

		model.create({
			id: 1
		});
		try {
			model.create({
				id: 1
			});
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
			strictEqual(model.get("1"), null, 'エラーが発生した場合はアイテムが生成されていないこと');
		}
		try {
			model.create([{
				id: 2
			}, {
				id: 2
			}]);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		} finally {
			// 配列で渡した場合、一つでもエラーが発生したら、配列中の要素全てをアイテム化しない(TODO 確認する)
			strictEqual(model.get("2"), null, 'エラーが発生した場合はアイテムが生成されていないこと');
		}
	});

	test('createに配列を渡して、その要素のいずれかが原因でエラーが起きた場合、アイテムは一つも生成されないこと(アトミックに処理されること)', function() {
	// TODO アトミックかどうか確認する
	});

	test('getでアイテムが取得できること。引数に配列を指定した場合は戻り値も配列になること。', function() {
		var model = manager.createModel({
			name: 'TestDataModel',
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

		model.create([{
			id: 1,
			val: 'item1'
		},{
			id: 2,
			val: 'item2'
		},{
			id: 3,
			val: 'item3'
		}]);
		model2.create([{
			id: 1,
			val: 'model2 item1'
		},{
			id: 4,
			val: 'model2 item1'
		}]);

		var manager2 = createManager('TestManager');
		var model3 = manager2.createModel({
			name: 'TestDataModel',
			schema: {
				id: {
					id: true
				},
				val: {}
			}
		});
		model3.create({id: 2,val:'manager2 item2'});


		strictEqual(model.get('1').val, 'item1', '登録したアイテムが取得できること');
		strictEqual(model.get('2').val, 'item2', '登録したアイテムが取得できること');
		strictEqual(model.get('3').val, 'item3', '登録したアイテムが取得できること');
		strictEqual(model.get('abc'), null, '登録されていないidを渡すとnullが返ってくること');
		strictEqual(model.get('4'), null, '違うモデルに登録したアイテムは取得できないこと。');
		var items = model.get(['2','4','1','3', 'abcd']);
		strictEqual(items.length, 3, 'idの配列を引数に渡してアイテムを取得できること');
		strictEqual(model.get('2').val, 'item1', '登録したアイテムが、渡したidの順に取得できること');
		strictEqual(model.get('2').val, 'item1', '登録したアイテムが、渡したidの順に取得できること');
		strictEqual(model.get('2').val, 'item2', '登録したアイテムが取得できること');
		strictEqual(model.get('3').val, 'item3', '登録したアイテムが取得できること');

	});

	module('type', {
		setup: function() {
			manager = h5.core.data.createManager('TestManager');
		},
		teardown: function() {
			// マネージャをリセットする
			dropAllModel(manager);
		}
	});

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
		teardown: function() {
			// マネージャをリセットする
			dropAllModel(manager);
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
		teardown: function() {
			// マネージャをリセットする
			dropAllModel(manager);
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
		teardown: function() {
			// マネージャをリセットする
			dropAllModel(manager);
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