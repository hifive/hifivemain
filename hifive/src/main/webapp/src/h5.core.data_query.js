/*
 * Copyright (C) 2012-2014 NS Solutions Corporation
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

/* ------ h5.core.data ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	var OPERAND_PROPERTY = '__op';

	var COMPARE_FUNCIONS = {
		'=': function(value, queryValue) {
			return value === queryValue;
		},
		'!=': function(value, queryValue) {
			return value !== queryValue;
		},
		'<': function(value, queryValue) {
			return value < queryValue;
		},
		'>': function(value, queryValue) {
			return value > queryValue;
		},
		'<=': function(value, queryValue) {
			return value <= queryValue;
		},
		'>=': function(value, queryValue) {
			return value >= queryValue;
		},
		'between': function(value, queryValue) {
			var lower = queryValue[0];
			var upper = queryValue[1];
			// 境界値を含む
			return lower <= value && value <= upper;
		},
		'!between': function(value, queryValue) {
			var lower = queryValue[0];
			var upper = queryValue[1];
			// 境界値を含まない
			return value < lower || upper < value;
		},
		'in': function(value, queryValue) {
			return $.inArray(value, queryValue) !== -1;
		},
		'!in': function(value, queryValue) {
			return $.inArray(value, queryValue) === -1;
		}
	};

	var COMPARE_REGEXP_FUNCTIONS = {
		'=': function(value, queryValue) {
			return queryValue.test(value);
		},
		'!=': function(value, queryValue) {
			return !queryValue.test(value);
		}
	};

	var COMPARE_DATE_FUNCIONS = {
		'=': function(value, queryValue) {
			if (value == null) {
				// nullまたはundefinedの場合は比較しないでfalseを返す
				return false;
			}
			return value.getTime() === queryValue.getTime();
		},
		'<': function(value, queryValue) {
			if (value == null) {
				return false;
			}
			return value.getTime() < queryValue.getTime();
		},
		'>': function(value, queryValue) {
			if (value == null) {
				return false;
			}
			return value.getTime() > queryValue.getTime();
		},
		'<=': function(value, queryValue) {
			if (value == null) {
				return false;
			}
			return value.getTime() <= queryValue.getTime();
		},
		'>=': function(value, queryValue) {
			if (value == null) {
				return false;
			}
			return value.getTime() >= queryValue.getTime();
		},
		'between': function(value, queryValue) {
			if (value == null) {
				return false;
			}
			var lower = queryValue[0].getTime();
			var upper = queryValue[1].getTime();
			var valueTime = value.getTime();
			// 境界値を含む
			return lower <= valueTime && valueTime <= upper;
		},
		'!between': function(value, queryValue) {
			if (value == null) {
				return false;
			}
			var lower = queryValue[0].getTime();
			var upper = queryValue[1].getTime();
			var valueTime = value.getTime();
			// 境界値を含まない
			return valueTime < lower || upper < valueTime;
		},
		'in': function(value, queryValue) {
			if (value == null) {
				return false;
			}
			var valueTime = value.getTime();
			for (var i = 0; i < l; i++) {
				if (valueTime === queryValue[i].getTime()) {
					return true;
				}
			}
			return false;
		},
		'!in': function(value, queryValue) {
			if (value == null) {
				return false;
			}
			var valueTime = value.getTime();
			for (var i = 0; i < l; i++) {
				if (valueTime === queryValue[i].getTime()) {
					return false;
				}
			}
			return true;
		},
	};

	// -------------------------------
	// エラーコード
	// -------------------------------
	// TODO エラーコードの採番は決まってから適切な番号にする
	/** 指定された比較関数がない */
	var ERR_CODE_NO_COMPARE_FUNCTIONS = 0;
	var ERR_CODE_ORDER_BY_CLAUSE = 1;

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_NO_COMPARE_FUNCTIONS] = '演算子"{0}"で"{1}"型の値を比較することはできません';
	errMsgMap[ERR_CODE_ORDER_BY_CLAUSE] = 'ORDER BY句の指定が不正です。指定されたorder句:{0} "key名 ASC"または"key名 DESC"またはソート関数を指定してください';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);

	// =============================
	// Development Only
	// =============================

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================


	// =============================
	// Functions
	// =============================

	function createANDCompareFunction(compiledCriteria) {
		// 各条件をANDで比較して返す関数
		return function(valueObj) {
			// クエリについてチェック
			var queries = compiledCriteria.queries;
			for (var i = 0, l = queries.length; i < l; i++) {
				var query = queries[i];
				var prop = query.prop;
				var queryValue = query.queryValue;
				var compareFunction = query.compareFunction;
				if (!compareFunction(valueObj[prop], queryValue)) {
					return false;
				}
			}
			// ユーザ関数についてチェック
			var userFunctions = compiledCriteria.userFunctions;
			for (var i = 0, l = userFunctions.length; i < l; i++) {
				if (!userFunctions[i](valueObj)) {
					return false;
				}
			}
			// ネストしたcriteriaについてチェック
			var nestedCriterias = compiledCriteria.nestedCriterias;
			for (var i = 0, l = nestedCriterias.length; i < l; i++) {
				if (!nestedCriterias[i].match(valueObj)) {
					return false;
				}
			}
			return true;
		};
	}

	function createORCompareFunction(compiledCriteria) {
		return function(valueObj) {
			// クエリについてチェック
			var queries = compiledCriteria.queries;
			for (var i = 0, l = queries.length; i < l; i++) {
				var query = queries[i];
				var prop = query.prop;
				var queryValue = query.queryValue;
				var compareFunction = query.compareFunction;
				if (compareFunction(valueObj[prop], queryValue)) {
					return true;
				}
			}
			// ユーザ関数についてチェック
			var userFunctions = compiledCriteria.userFunctions;
			for (var i = 0, l = userFunctions; i < l; i++) {
				if (!userFunctions[i](valueObj)) {
					return true;
				}
			}
			// ネストしたcriteriaについてチェック
			var nestedCriterias = compiledCriteria.nestedCriterias;
			for (var i = 0, l = nestedCriterias.length; i < l; i++) {
				if (nestedCriterias[i].match(valueObj)) {
					return true;
				}
			}
			return false;
		};
	}

	function createChangeListener(query) {
		var match = query._criteria.match;
		var resultArray = query.result;
		return function(ev) {
			var removed = ev.removed;
			var created = ev.created;
			var changed = ev.changed;
			var isSorted = true;

			if (removed) {
				for (var i = 0, l = removed.length; i < l; i++) {
					// resultArrayの何番目に入っているアイテムか
					var resultIndex = $.inArray(removed[i], resultArray._src);
					// DataModelから削除されたら結果からも削除
					if (resultIndex !== -1) {
						resultArray.splice(resultIndex, 1);
					}
				}
			}

			if (changed) {
				for (var i = 0, l = changed.length; i < l; i++) {
					// resultArrayの何番目に入っているアイテムか(入っていないなら-1)
					var resultIndex = $.inArray(changed[i].target, resultArray._src);

					// マッチするかどうかチェックして、
					// マッチするかつ結果にないものなら追加
					// マッチしないかつ結果にあるものなら取り除く
					if (match(changed[i].target.get())) {
						if (resultIndex === -1) {
							isSorted = false;
							resultArray.push(changed[i].target);
						}
					} else {
						if (resultIndex !== -1) {
							resultArray.splice(resultIndex, 1);
						}
					}
				}
			}

			if (created) {
				for (var i = 0, l = created.length; i < l; i++) {
					// 新しく作成されたアイテムがあればマッチするかどうかチェックして
					// マッチするなら結果に追加
					if (match(created[i].get())) {
						isSorted = false;
						resultArray.push(created[i]);
					}
				}
			}

			// ソート
			if (query._compareFunction && !isSorted) {
				// ソートする必要があるならソートする
				resultArray.sort(query._compareFunction);
			}
		};
	}

	function compileCriteria(criteria) {
		// criteriaの解析
		var queries = [];
		var nestedCriterias = [];
		var userFunctions = [];
		var compiledCriteria = {
			queries: queries,
			nestedCriterias: nestedCriterias,
			userFunctions: userFunctions
		};
		for ( var prop in criteria) {
			if (prop === OPERAND_PROPERTY) {
				continue;
			}
			if ($.isPlainObject(criteria[prop])) {
				// objectの場合はネストしたcriteriaオブジェクトとして解析して追加する
				nestedCriterias.push(compileCriteria(criteria[prop]));
				continue;
			}
			if (isFunction(criteria[prop])) {
				// 関数の場合はユーザ関数として追加
				userFunctions.push(criteria[prop]);
				continue;
			}
			var queryValue = criteria[prop];

			// queryValueのタイプをチェックする。配列指定なら先頭の要素でタイプを判定する
			var valueForTypeCheck = isArray(queryValue) ? queryValue[0] : queryValue;
			var compareFunctions = null;
			if (valueForTypeCheck instanceof RegExp) {
				// 正規表現の場合
				compareFunctions = COMPARE_REGEXP_FUNCTIONS;
			} else if (valueForTypeCheck instanceof Date) {
				// Dateクラスの場合
				compareFunctions = COMPARE_DATE_FUNCIONS;
			} else {
				// その他
				compareFunctions = COMPARE_FUNCIONS;
			}
			// プロパティ名とオペランドに分割。連続した空白文字は無視
			var tmp = $.trim(prop.replace(/ +/g, ' ')).split(' ');
			// 演算子省略時は'='で比較
			var op = tmp[1] || '=';
			compareFunction = compareFunctions[op];
			// compareFunctionが無い場合はエラー
			if (!compareFunction) {
				throwFwError(ERR_CODE_NO_COMPARE_FUNCTIONS, [op, $.type(valueForTypeCheck)]);
			}

			queries.push({
				prop: tmp[0],
				queryValue: queryValue,
				compareFunction: compareFunction
			});
		}
		compiledCriteria.match = criteria.__op === 'or' ? createORCompareFunction(compiledCriteria)
				: createANDCompareFunction(compiledCriteria);
		return compiledCriteria;
	}

	function createAscCompareFunction(key) {
		return function(item1, item2) {
			var val1 = item1.get(key);
			var val2 = item2.get(key);
			if (val1 > val2) {
				return 1;
			}
			if (val1 < val2) {
				return -1;
			}
			return 0;
		}
	}

	function createDescCompareFunction(key) {
		return function(item1, item2) {
			var val1 = item1.get(key);
			var val2 = item2.get(key);
			if (val1 > val2) {
				return -1;
			}
			if (val1 < val2) {
				return 1;
			}
			return 0;
		}
	}



	/**
	 * Queryクラス
	 */
	function Query(model, criteria) {
		// データモデルのセット
		this._model = model;
		// criteriaを解析する
		this._criteria = compileCriteria(criteria);
		// 結果配列の作成
		this.result = h5.core.data.createObservableArray();
		// ライブクエリはデフォルトfalse
		this._isLive = false;
	}
	// TODO 今は何もイベントをあげていないのでeventDispatcherにする必要がない。仕様が決まったら対応する。
	//	h5.mixin.eventDispatcher.mix(Query.prototype);

	$.extend(Query.prototype, {
		execute: function() {
			// 新しくdeferredを作成
			this._executeDfd = h5.async.deferred();
			var result = this.result;
			for ( var id in this._model.items) {
				var item = this._model.items[id];
				// マッチするなら結果に追加
				if (this._criteria.match(item.get())) {
					result.push(item);
				}
				// ソート
				if (this._compareFunction) {
					result.sort(this._compareFunction);
				}
			}
			this._executeDfd.resolveWith(this, result);
			return this;
		},
		onQueryComplete: function(completeHandler) {
			// TODO executeが呼ばれる前にハンドラを設定された場合はどうするか
			this._executeDfd.done(completeHandler);
		},
		setLive: function() {
			// ライブクエリ設定済みなら何もしない
			if (this._isLive) {
				return;
			}
			// リスナ未作成なら作成
			this._listener = this._listener || createChangeListener(this);
			this._model.addEventListener('itemsChange', this._listener);
			this._isLive = true;

			return this;
		},
		unsetLive: function() {
			// ライブクエリでなければ何もしない
			if (!this._isLive) {
				return;
			}
			this.removeEventListener('itemsChange', this._listener);
			this._isLive = false;
		},
		orderBy: function(orderByClause) {
			// compareFuncの作成
			if (isFunction(orderByClause)) {
				this._compareFunction = orderByClause;
			}
			var tmp = orderByClause.split(' ');
			var key = tmp[0];
			var order = tmp[1] ? tmp[1].toUpperCase() : 'ASC';
			if (order === 'DESC') {
				this._compareFunction = createDescCompareFunction(key);
			} else if (order = 'ASC') {
				this._compareFunction = createAscCompareFunction(key);
			} else {
				// エラー
				throwFwError(ERR_CODE_ORDER_BY_CLAUSE, [orderByClause]);
			}
			return this;
		}
	});

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * Queryクラスを作成して返します
	 *
	 * @param {Object} criteria
	 * @returns {Query} 検索を行うQueryクラスを返します
	 */
	function createQuery(criteria) {
		return new Query(this, criteria);
	}

	// h5internalにqueryを公開
	h5internal.data = {
		createQuery: createQuery
	};
	// =============================
	// Expose to window
	// =============================
})();
