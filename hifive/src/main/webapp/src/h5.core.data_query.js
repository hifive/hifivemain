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
			if (queryValue instanceof RegExp) {
				return queryValue.test(value)
			}
			return value === queryValue;
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
		'in': function(value, queryValue) {
			return $.inArray(value, queryValue) !== -1;
		}
	};

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
		}
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

	function createChangeListener(match, resultArray) {
		return function(ev) {
			var removed = ev.removed;
			var created = ev.created;
			var changed = ev.changed;

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
						resultArray.push(created[i]);
					}
				}
			}
		};
	}

	function compileCriteria(criteria) {
		// queryObjの解析
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
				// objectの場合は解析して追加
				nestedCriterias.push(compileCriteria(criteria[prop]));
				continue;
			}
			if (isFunction(criteria[prop])) {
				// 関数の場合はユーザ関数として追加
				userFunctions.push(criteria[prop]);
				continue;
			}
			// プロパティ名とオペランドに分割。連続した空白文字は無視
			var tmp = $.trim(prop.replace(/ +/g, ' ')).split(' ');
			// 演算子省略時は'='で比較
			var op = tmp[1] || '=';
			queries.push({
				prop: tmp[0],
				queryValue: criteria[prop],
				compareFunction: COMPARE_FUNCIONS[op]
			});
		}
		compiledCriteria.match = criteria.__op === 'or' ? createORCompareFunction(compiledCriteria)
				: createANDCompareFunction(compiledCriteria);
		return compiledCriteria;
	}


	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * クエリにマッチするDataItemを返します
	 *
	 * @param {Object} criteria
	 * @returns {ObservableArray} 検索結果にマッチするDataItemを持つObservableArray
	 */
	function query(criteria) {
		var resultArray = h5.core.data.createObservableArray();

		// criteriaを解析してresultArrayに結果を格納する関数を作成する
		var compiledCriteria = compileCriteria(criteria);

		// DataModelに変更があった時に結果を更新する関数をバインドする
		var listener = createChangeListener(compiledCriteria.match, resultArray);
		this.addEventListener('itemsChange', listener);

		// 今あるアイテムについて、条件を満たすものを列挙させる
		listener({
			created: this.items
		});
		return resultArray;
	}

	// h5internalにqueryを公開
	h5internal.data = {
		query: query
	};
	// =============================
	// Expose to window
	// =============================
})();
