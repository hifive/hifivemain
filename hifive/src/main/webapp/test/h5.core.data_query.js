/*
 * Copyright (C) 2014-2016 NS Solutions Corporation
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
	// テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.core.data_query;

	var itemSchema = {
		name: 'ItemModel',
		schema: {
			id: {
				id: true
			},
			itemname: {
				type: 'string'
			},
			price: {
				type: 'number'
			}
		}
	};

	var dateSchema = {
		name: 'DateModel',
		schema: {
			id: {
				id: true
			},
			value: null
		}
	};

	var itemsData = [{
		id: '1',
		itemname: 'テレビ',
		price: 25000
	}, {
		id: '2',
		itemname: 'HDレコーダー',
		price: 22000
	}, {
		id: '3',
		itemname: 'Blu-rayプレーヤー',
		price: 7500
	}, {
		id: '4',
		itemname: 'ステレオ',
		price: 30000
	}, {
		id: '5',
		itemname: 'コンパクトデジタルカメラ',
		price: 18600
	}, {
		id: '6',
		itemname: 'デジタル一眼レフカメラ',
		price: 160000
	}, {
		id: '7',
		itemname: 'プリンタ',
		price: 7000
	}, {
		id: '8',
		itemname: 'プリンタ・スキャナ 複合機',
		price: 22000
	}, {
		id: '9',
		itemname: 'USBマウス',
		price: 1000
	}, {
		id: '10',
		itemname: 'Bluetoothマウス',
		price: 1200
	}];

	var dateData = [{
		id: '1',
		value: new Date('2014/6/30')
	}, {
		id: '2',
		value: new Date('2014/7/1')
	}, {
		id: '3',
		value: new Date('2014/7/2')
	}, {
		id: '4',
		value: new Date('2014/7/2')
	}, {
		id: '5',
		value: new Date('2014/7/3')
	}, {
		id: '6',
		value: null
	}, {
		id: '7',
		value: new Date('2014/7/4')
	}];

	//=============================
	// Functions
	//=============================
	/**
	 * 引数に指定されたマネージャが持つモデルを全てdropする
	 *
	 * @param {DataManager} manager
	 */
	function dropAllModel(manager) {
		if (manager && manager.models) {
			for ( var model in manager.models) {
				manager.dropModel(model);
			}
		}
	}

	/**
	 * idをIntで評価して昇順に並び替える比較関数
	 *
	 * @param a
	 * @param b
	 * @returns {Integer}
	 */
	function compareId(a, b) {
		// id番号順
		var aId = a.get('id');
		var bId = b.get('id');
		return parseInt(aId) - parseInt(bId);
	}

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================
	module('クエリの実行', {
		setup: function() {
			this.manager = h5.core.data.createManager('TestManager');
			this.model = this.manager.createModel(itemSchema);
			this.model.create(itemsData);
		},
		teardown: function() {
			dropAllModel(this.manager);
			this.manager = null;
		},
		manager: null,
		model: null
	});

	//=============================
	// Body
	//=============================
	test('検索条件にマッチするデータアイテムを取得できること', 4, function() {
		var query = this.model.createQuery().setCriteria({
			price: 22000
		});
		var queryResult = query.addOrder('id').execute();
		var result = queryResult.result;
		ok($.isArray(result), '検索結果はQueryResultでresultプロパティが配列であること');
		strictEqual(result.length, 2, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('2'), '検索条件を満たすアイテムが格納されていること');
		strictEqual(result[1], this.model.get('8'), '検索条件を満たすアイテムが格納されていること');
	});

	//=============================
	// Definition
	//=============================
	module('比較演算子', {
		setup: function() {
			this.manager = h5.core.data.createManager('TestManager');
			this.model = this.manager.createModel(itemSchema);
			this.model.create(itemsData);
		},
		teardown: function() {
			dropAllModel(this.manager);
			this.manager = null;
		},
		manager: null,
		model: null
	});

	//=============================
	// Body
	//=============================
	test('演算子未指定の場合は"==="で比較されること', 2, function() {
		var result = this.model.createQuery().setCriteria({
			id: 1
		}).execute().result;
		strictEqual(result.length, 0, 'id===1のデータアイテムは検索結果に格納されていないこと');
		result = this.model.createQuery().setCriteria({
			id: '1'
		}).execute().result;
		strictEqual(result[0], this.model.get('1'), 'id==="1"のデータアイテムが検索結果に格納されていること');
	});

	test('"="を指定した場合は"==="で比較されること', 2, function() {
		var result = this.model.createQuery().setCriteria({
			'id =': 1
		}).execute().result;
		strictEqual(result.length, 0, 'id===1のデータアイテムは検索結果に格納されていないこと');
		result = this.model.createQuery().setCriteria({
			'id =': '1'
		}).execute().result;
		strictEqual(result[0], this.model.get('1'), 'id==="1"のデータアイテムが検索結果に格納されていること');
	});

	test('"!="を指定した場合は"!=="で比較されること', 21, function() {
		var result = this.model.createQuery().setCriteria({
			'id !=': 5
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 10, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		var index = 0;
		for ( var id in this.model.items) {
			strictEqual(this.model.items[id], result[index++], '検索結果を満たすアイテムが検索結果に格納されていること');
		}

		result = this.model.createQuery().setCriteria({
			'id !=': '5'
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 9, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		index = 0;
		for ( var id in this.model.items) {
			if (id === '5') {
				continue;
			}
			strictEqual(this.model.items[id], result[index++], '検索結果を満たすアイテムが検索結果に格納されていること');
		}
	});

	test('"<"を指定', 2, function() {
		var result = this.model.createQuery().setCriteria({
			'price <': 1200
		}).execute().result;
		strictEqual(result.length, 1, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('9'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('"<="を指定', 3, function() {
		var result = this.model.createQuery().setCriteria({
			'price <=': 1200
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 2, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('9'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('10'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('">"を指定', 2, function() {
		var result = this.model.createQuery().setCriteria({
			'price >': 30000
		}).execute().result;
		strictEqual(result.length, 1, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('6'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('">="を指定', 3, function() {
		var result = this.model.createQuery().setCriteria({
			'price >=': 30000
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 2, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('4'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('6'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('"between"を指定', 4, function() {
		var result = this.model.createQuery().setCriteria({
			'price between': [1000, 7000]
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 3, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('7'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('9'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[2], this.model.get('10'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('"!between"を指定', 5, function() {
		var result = this.model.createQuery().setCriteria({
			'price !between': [1200, 22000]
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 4, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('1'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('4'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[2], this.model.get('6'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[3], this.model.get('9'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('"in"を指定', 3, function() {
		var result = this.model.createQuery().setCriteria({
			'id in': ['4', '2']
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 2, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('2'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('4'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('"!in"を指定', 3, function() {
		var result = this.model.createQuery().setCriteria({
			'id !in': ['1', '2', '4', '5', '7', '8', '9', '10']
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 2, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('3'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('6'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	//=============================
	// Definition
	//=============================
	module('正規表現による比較', {
		setup: function() {
			this.manager = h5.core.data.createManager('TestManager');
			this.model = this.manager.createModel(itemSchema);
			this.model.create(itemsData);
		},
		teardown: function() {
			dropAllModel(this.manager);
			this.manager = null;
		},
		manager: null,
		model: null
	});

	//=============================
	// Body
	//=============================
	test('演算子を指定しない場合は正規表現にマッチするアイテムが選択されること', 3, function() {
		var query = this.model.createQuery().setCriteria({
			itemname: /マウス/
		});
		var result = query.setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 2, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('9'), '検索条件を満たすアイテムが格納されていること');
		strictEqual(result[1], this.model.get('10'), '検索条件を満たすアイテムが格納されていること');
	});

	test('演算子に"="を指定した場合は正規表現にマッチするアイテムが選択されること', 3, function() {
		var query = this.model.createQuery().setCriteria({
			'itemname =': /マウス/
		});
		var result = query.setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 2, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('9'), '検索条件を満たすアイテムが格納されていること');
		strictEqual(result[1], this.model.get('10'), '検索条件を満たすアイテムが格納されていること');

	});

	test('演算子に"!="を指定した場合は正規表現にマッチしないアイテムが選択されること', 9, function() {
		var query = this.model.createQuery().setCriteria({
			'itemname !=': /マウス/
		});
		var result = query.setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 8, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('1'), '検索条件を満たすアイテムが格納されていること');
		strictEqual(result[1], this.model.get('2'), '検索条件を満たすアイテムが格納されていること');
		strictEqual(result[2], this.model.get('3'), '検索条件を満たすアイテムが格納されていること');
		strictEqual(result[3], this.model.get('4'), '検索条件を満たすアイテムが格納されていること');
		strictEqual(result[4], this.model.get('5'), '検索条件を満たすアイテムが格納されていること');
		strictEqual(result[5], this.model.get('6'), '検索条件を満たすアイテムが格納されていること');
		strictEqual(result[6], this.model.get('7'), '検索条件を満たすアイテムが格納されていること');
		strictEqual(result[7], this.model.get('8'), '検索条件を満たすアイテムが格納されていること');
	});

	//=============================
	// Definition
	//=============================
	module('日付型の比較', {
		setup: function() {
			this.manager = h5.core.data.createManager('TestManager');
			this.model = this.manager.createModel(dateSchema);
			this.model.create(dateData);
		},
		teardown: function() {
			dropAllModel(this.manager);
			this.manager = null;
		},
		manager: null,
		model: null
	});

	//=============================
	// Body
	//=============================
	test('演算子未指定の場合はgetTime()の"==="で比較されること', 3, function() {
		var result = this.model.createQuery().setCriteria({
			value: new Date('2014/7/2')
		}).execute().result;
		strictEqual(result.length, 2, 'id===1のデータアイテムは検索結果に格納されていないこと');
		strictEqual(result[0], this.model.get('3'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('4'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('"="を指定した場合はgetTime()の"==="で比較されること', 3, function() {
		var result = this.model.createQuery().setCriteria({
			'value =': new Date('2014/7/2')
		}).execute().result;
		strictEqual(result.length, 2, 'id===1のデータアイテムは検索結果に格納されていないこと');
		strictEqual(result[0], this.model.get('3'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('4'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('"!="を指定した場合は"!=="で比較されること', 6, function() {
		var result = this.model.createQuery().setCriteria({
			'value !=': new Date('2014/7/2')
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 5, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		var index = 0;
		for ( var id in this.model.items) {
			if (id === '3' || id === '4') {
				continue;
			}
			strictEqual(this.model.items[id], result[index++], '検索結果を満たすアイテムが検索結果に格納されていること');
		}
	});

	test('"<"を指定', 2, function() {
		var result = this.model.createQuery().setCriteria({
			'value <': new Date('2014/7/1')
		}).execute().result;
		strictEqual(result.length, 1, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('1'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});


	test('"<="を指定', 3, function() {
		var result = this.model.createQuery().setCriteria({
			'value <=': new Date('2014/7/1')
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 2, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('1'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('2'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('">"を指定', 3, function() {
		var result = this.model.createQuery().setCriteria({
			'value >': new Date('2014/7/2')
		}).execute().result;
		strictEqual(result.length, 2, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('5'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('7'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('">="を指定', 5, function() {
		var result = this.model.createQuery().setCriteria({
			'value >=': new Date('2014/7/2')
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 4, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('3'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('4'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[2], this.model.get('5'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[3], this.model.get('7'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('"between"を指定', 5, function() {
		var result = this.model.createQuery().setCriteria({
			'value between': [new Date('2014/7/1'), new Date('2014/7/3')]
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 4, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('2'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('3'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[2], this.model.get('4'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[3], this.model.get('5'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('"!between"を指定', 3, function() {
		var result = this.model.createQuery().setCriteria({
			'value !between': [new Date('2014/7/1'), new Date('2014/7/3')]
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 2, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('1'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('7'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('"in"を指定', 4, function() {
		var result = this.model.createQuery().setCriteria({
			'value in': [new Date('2014/7/4'), new Date('2014/7/2')]
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 3, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('3'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('4'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[2], this.model.get('7'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	test('"!in"を指定', 5, function() {
		var result = this.model.createQuery().setCriteria({
			'value !in': [new Date('2014/7/4'), new Date('2014/7/2')]
		}).setOrderFunction(compareId).execute().result;
		strictEqual(result.length, 4, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('1'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('2'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[2], this.model.get('5'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[3], this.model.get('6'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	//=============================
	// Definition
	//=============================
	module('演算子の指定が不正な場合はエラー', {
		setup: function() {
			this.manager = h5.core.data.createManager('TestManager');
			this.model = this.manager.createModel(itemSchema);
			this.model.create(itemsData);
		},
		teardown: function() {
			dropAllModel(this.manager);
			this.manager = null;
		},
		manager: null,
		model: null
	});

	//=============================
	// Body
	//=============================
	test('定義されていない演算子を使用', 1, function() {
		try {
			this.model.createQuery().setCriteria({
				'price =>': 1000
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_NO_COMPARE_FUNCTIONS, e.message);
		}
	});

	test('正規表現で定義されていない演算子を使用', 1, function() {
		try {
			this.model.createQuery().setCriteria({
				'itemname >': /テレビ/
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_NO_COMPARE_FUNCTIONS, e.message);
		}
	});

	//=============================
	// Definition
	//=============================
	module('検索条件のソート', {
		setup: function() {
			this.manager = h5.core.data.createManager('TestManager');
			this.model = this.manager.createModel(itemSchema);
			this.model.create([{
				id: '11',
				itemname: 'B',
				price: 100
			}, {
				id: '12',
				itemname: 'A',
				price: 100
			}, {
				id: '13',
				itemname: 'C',
				price: 200
			}, {
				id: '14',
				itemname: 'A',
				price: 100
			}, {
				id: '15',
				price: 1
			}, {
				id: '16',
				price: 3
			}, {
				id: '17',
				price: 2
			}, {
				id: '1'
			}, {
				id: '2'
			}, {
				id: '10'
			}]);
			this.sequence = h5.core.data.createSequence(itemsData.length, 1,
					h5.core.data.SEQ_STRING);
		},
		teardown: function() {
			dropAllModel(this.manager);
			this.manager = null;
		},
		manager: null,
		model: null
	});

	//=============================
	// Body
	//=============================
	test('addOrderで昇順', function() {
		var result = this.model.createQuery().setCriteria({
			'id in': ['15', '16', '17']
		}).addOrder('price').execute().result;
		strictEqual(result[0], this.model.get('15'), 'price=1のアイテムが0番目');
		strictEqual(result[1], this.model.get('17'), 'price=2のアイテムが1番目');
		strictEqual(result[2], this.model.get('16'), 'price=3のアイテムが2番目');
	});

	test('addOrderで降順', function() {
		var result = this.model.createQuery().setCriteria({
			'id in': ['15', '16', '17']
		}).addOrder('price', false).execute().result;
		strictEqual(result[0], this.model.get('16'), 'price=3のアイテムが0番目');
		strictEqual(result[1], this.model.get('17'), 'price=2のアイテムが1番目');
		strictEqual(result[2], this.model.get('15'), 'price=1のアイテムが2番目');
	});

	test('addOrderで複数条件指定', function() {
		var result = this.model.createQuery().setCriteria({
			'id in': ['11', '12', '13', '14']
		}).addOrder('price').addOrder('itemname', false).addOrder('id', false).execute().result;
		strictEqual(result[0], this.model.get('11'), 'id==="11"のアイテムが0番目');
		strictEqual(result[1], this.model.get('14'), 'id==="14"のアイテムが1番目');
		strictEqual(result[2], this.model.get('12'), 'id==="12"のアイテムが2番目');
		strictEqual(result[3], this.model.get('13'), 'id==="13"のアイテムが3番目');
	});

	test('setOrderFunctionで比較関数を指定してソート', function() {
		var result = this.model.createQuery().setCriteria({
			'id in': ['1', '2', '10']
		}).setOrderFunction(function(a, b) {
			// idを数値で評価して降順
			return parseInt(b.get('id')) - parseInt(a.get('id'));
		}).execute().result;
		strictEqual(result[0], this.model.get('10'), 'id==="10"のアイテムが0番目');
		strictEqual(result[1], this.model.get('2'), 'id==="2"のアイテムが1番目');
		strictEqual(result[2], this.model.get('1'), 'id==="1"のアイテムが2番目');
	});

	test('setOrderFunctionを複数回呼んで比較関数を上書き', function() {
		var result = this.model.createQuery().setCriteria({
			'id in': ['1', '2', '10']
		}).setOrderFunction(function(a, b) {
			// idを数値で評価して昇順
			return parseInt(a.get('id')) - parseInt(b.get('id'));
		}).setOrderFunction(function(a, b) {
			// idを数値で評価して降順
			return parseInt(b.get('id')) - parseInt(a.get('id'));
		}).execute().result;
		strictEqual(result[0], this.model.get('10'), 'id==="10"のアイテムが0番目');
		strictEqual(result[1], this.model.get('2'), 'id==="2"のアイテムが1番目');
		strictEqual(result[2], this.model.get('1'), 'id==="1"のアイテムが2番目');
	});

	test('clearOrderを呼んで比較条件設定を削除して再設定できること', function() {
		var result = this.model.createQuery().setCriteria({
			'id in': ['1', '2', '10']
		}).addOrder('id').clearOrder().setOrderFunction(function(a, b) {
			// idを数値で評価して降順
			return parseInt(b.get('id')) - parseInt(a.get('id'));
		}).execute().result;
		strictEqual(result[0], this.model.get('10'), 'id==="10"のアイテムが0番目');
		strictEqual(result[1], this.model.get('2'), 'id==="2"のアイテムが1番目');
		strictEqual(result[2], this.model.get('1'), 'id==="1"のアイテムが2番目');
		result = this.model.createQuery().setCriteria({
			'id in': ['1', '2', '10']
		}).setOrderFunction(function(a, b) {
			// idを数値で評価して降順
			return parseInt(b.get('id')) - parseInt(a.get('id'));
		}).clearOrder().addOrder('id').execute().result;
		strictEqual(result[0], this.model.get('1'), 'id==="1"のアイテムが0番目');
		strictEqual(result[1], this.model.get('10'), 'id==="10"のアイテムが1番目');
		strictEqual(result[2], this.model.get('2'), 'id==="2"のアイテムが2番目');
	});

	test('addOrderに存在しないキー名を指定するとエラー', function() {
		try {
			this.model.createQuery().setCriteria({
				'id in': ['1', '2', '10']
			}).addOrder();
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_ORDER_BY_KEY, e.message);
		}
		var invalidArgs = ['ID', '', null, 1, true, false, {}, [], /id/, $.noop];
		for (var i = 0, l = invalidArgs.length; i < l; i++) {
			try {
				this.model.createQuery().setCriteria({
					'id in': ['1', '2', '10']
				}).addOrder(invalidArgs[i]);
				ok(false, 'エラー発生していません');
			} catch (e) {
				strictEqual(e.code, ERR.ERR_CODE_ORDER_BY_KEY, e.message);
			}
		}
	});

	test('setOrderFunctionに関数以外を指定するとエラー', function() {
		try {
			this.model.createQuery().setCriteria({
				'id in': ['1', '2', '10']
			}).setOrderFunction();
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_ORDER_BY_COMPARE_FUNCTION_INVALID, e.message);
		}
		var invalidArgs = ['id', '', null, 1, true, false, {}, [], /id asc/];
		for (var i = 0, l = invalidArgs.length; i < l; i++) {
			try {
				this.model.createQuery().setCriteria({
					'id in': ['1', '2', '10']
				}).setOrderFunction(invalidArgs[i]);
				ok(false, 'エラー発生していません');
			} catch (e) {
				strictEqual(e.code, ERR.ERR_CODE_ORDER_BY_COMPARE_FUNCTION_INVALID, e.message);
			}
		}
	});

	test('addOrderで条件が追加済みの時、setFunction()で比較関数を設定するとエラー', function() {
		var query = this.model.createQuery().addOrder('id');
		try {
			query.setOrderFunction($.noop);
			ok(false, 'エラー発生していません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_ALREADY_ADDED_ORDER, e.message);
		}
	});

	test('setFunctionで条件が設定済みの時、addOrder()で条件を追加するとエラー', function() {
		var query = this.model.createQuery().setOrderFunction($.noop);
		try {
			query.addOrder('id');
			ok(false, 'エラー発生していません');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_ALREADY_SET_ORDER_FUNCTION, e.message);
		}
	});

	//=============================
	// Definition
	//=============================
	module('ユーザ関数', {
		setup: function() {
			this.manager = h5.core.data.createManager('TestManager');
			this.model = this.manager.createModel(itemSchema);
			this.model.create(itemsData);
		},
		teardown: function() {
			dropAllModel(this.manager);
			this.manager = null;
		},
		manager: null,
		model: null
	});

	//=============================
	// Body
	//=============================
	test('ユーザ関数がtrueを返したデータアイテムが検索結果に入ること', function() {
		var result = this.model.createQuery().setCriteria({
			func: function(valueObj) {
				// 3で割り切れるidのアイテムだけtrueを返す
				return !(parseInt(valueObj.id) % 3);
			}
		}).execute().result;
		strictEqual(result.length, 3, '検索結果の長さが検索条件を満たすアイテムの数分だけあること');
		strictEqual(result[0], this.model.get('3'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[1], this.model.get('6'), '検索条件を満たすアイテムが検索結果に格納されていること');
		strictEqual(result[2], this.model.get('9'), '検索条件を満たすアイテムが検索結果に格納されていること');
	});

	// TODO ライブクエリの仕様は再検討する
	//	//=============================
	//	// Definition
	//	//=============================
	//	module('ライブクエリ', {
	//		setup: function() {
	//			this.manager = h5.core.data.createManager('TestManager');
	//			this.model = this.manager.createModel(itemSchema);
	//			this.model.create(itemsData);
	//		},
	//		teardown: function() {
	//			dropAllModel(this.manager);
	//			this.manager = null;
	//		},
	//		manager: null,
	//		model: null
	//	});
	//
	//	//=============================
	//	// Body
	//	//=============================
	//	test('DataModelに新しくアイテムを追加した時、検索条件にマッチすれば検索結果に格納されること', 2, function() {
	//		var query = this.model.createQuery().setCriteria({
	//			id: 'a'
	//		}).setLive().execute();
	//		var result = query.result;
	//		strictEqual(result.length, 0, '検索条件にマッチするアイテムが無いとき、検索結果は長さ0であること');
	//		var item = this.model.create({
	//			id: 'a'
	//		});
	//		strictEqual(result[0], item, 'DataModelに新しく追加したアイテムが検索結果に格納されていること');
	//	});
	//
	//	test('検索結果に含まれるアイテムがDataModelから削除された時、検索結果から削除されること', 2, function() {
	//		var query = this.model.createQuery().setCriteria({
	//			id: '1'
	//		}).setLive().execute();
	//		var result = query.result;
	//		strictEqual(result[0], this.model.get('1'), '検索条件にマッチするアイテムが結果に格納されていること');
	//		this.model.remove('1');
	//		strictEqual(result.length, 0, 'DataModelのitemが削除されたら検索結果からも削除されること');
	//	});
	//
	//	test('検索結果に含まれるアイテムの値が変更されて、検索条件を満たさなくなったとき、検索結果から外されること', 2, function() {
	//		var query = this.model.createQuery().setCriteria({
	//			itemname: 'テレビ'
	//		}).setLive().execute();
	//		var result = query.result;
	//		var item = this.model.get('1');
	//		strictEqual(result[0], item, '検索条件にマッチするアイテムが検索結果に格納されていること');
	//		item.set('itemname', '4Kテレビ');
	//		strictEqual(result.length, 0, '検索条件を満たさなくなったアイテムは検索結果から外されていること');
	//	});
	//
	//	test('検索結果に含まれないアイテムの値が変更されて、検索条件を満たすようになったとき、検索結果に格納されること', 2, function() {
	//		var query = this.model.createQuery().setCriteria({
	//			itemname: '4Kテレビ'
	//		}).setLive().execute();
	//		var result = query.result;
	//		strictEqual(result.length, 0, '検索条件にマッチするアイテムが無いとき、検索結果は長さ0であること');
	//		var item = this.model.get('1');
	//		item.set('itemname', '4Kテレビ');
	//		strictEqual(result[0], item, '検索条件にマッチするようになったアイテムが検索結果に格納されていること');
	//	});
	//
	//	test('ライブクエリにsetOrderFunctionを指定すると、指定したタイミングでソートされること', 6, function() {
	//		var query = this.model.createQuery().setCriteria({
	//			'id in': ['1', '2', '10']
	//		}).setLive().execute();
	//		var result = query.result;
	//		query.addOrder('id');
	//		strictEqual(result[0], this.model.get('1'), 'id==="1"のアイテムが0番目');
	//		strictEqual(result[1], this.model.get('10'), 'id==="10"のアイテムが1番目');
	//		strictEqual(result[2], this.model.get('2'), 'id==="2"のアイテムが2番目');
	//
	//		query.setOrderFunctionDesc('id');
	//		strictEqual(result[0], this.model.get('2'), 'id==="2"のアイテムが0番目');
	//		strictEqual(result[1], this.model.get('10'), 'id==="10"のアイテムが1番目');
	//		strictEqual(result[2], this.model.get('1'), 'id==="1"のアイテムが2番目');
	//	});
	//
	//	test('ライブクエリにsetOrderFunctionを指定すると、検索結果に変更があった場合にもソートされること', 7, function() {
	//		var query = this.model.createQuery().setCriteria({
	//			'id in': ['1', '2', '10', '100']
	//		}).setLive().execute();
	//		var result = query.result;
	//		query.addOrder('price');
	//		this.model.get('2').set('price', '0');
	//		strictEqual(result[0], this.model.get('2'), 'id==="2"のアイテムが0番目');
	//		strictEqual(result[1], this.model.get('10'), 'id==="10"のアイテムが1番目');
	//		strictEqual(result[2], this.model.get('1'), 'id==="1"のアイテムが2番目');
	//
	//		this.model.create({
	//			id: '100',
	//			price: 1
	//		});
	//		strictEqual(result[0], this.model.get('2'), 'id==="2"のアイテムが0番目');
	//		strictEqual(result[1], this.model.get('100'), 'id==="100"のアイテムが1番目');
	//		strictEqual(result[2], this.model.get('10'), 'id==="10"のアイテムが2番目');
	//		strictEqual(result[3], this.model.get('1'), 'id==="1"のアイテムが3番目');
	//	});
	//
	//	test('unsetLiveでライブクエリを解除できること', 2, function() {
	//		var query = this.model.createQuery().setCriteria({
	//			itemname: 'テレビ'
	//		}).setLive().execute();
	//		var result = query.result;
	//		query.unsetLive();
	//		var item = result[0];
	//		item.set('itemname', 'hoge');
	//		strictEqual(result[0], item, 'unsetLive()したクエリはデータアイテムの変更があっても検索結果は変わらないこと');
	//		query.execute();
	//		strictEqual(result.length, 0, '再度execute()すると変更が反映されること');
	//	});

});