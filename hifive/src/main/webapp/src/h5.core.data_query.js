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
	var COMPARE_FUNCIONS = {
		'===': function(value, queryValue) {
			return value === queryValue;
		},
		'==': function(value, queryValue) {
			return value == queryValue;
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

	function match(item, analyzedQuery) {
		// クエリの解析結果を使って、itemが条件を満たすかどうかチェックする
		for (var i = 0, l = analyzedQuery.length; i < l; i++) {
			var query = analyzedQuery[i];
			var prop = query.prop;
			var queryValue = query.queryValue;
			var value = item.get(prop);
			var compareFunction = query.compareFunction;
			if (!compareFunction(value, queryValue)) {
				return false;
			}
		}
		return true;
	}

	function createChangeListener(analyzedQuery, resultArray) {
		return function(ev) {
			var removed = ev.removed;
			var created = ev.created;
			var changed = ev.changed;

			for (var i = 0, l = removed.length; i < l; i++) {
				// resultArrayの何番目に入っているアイテムか
				var resultIndex = $.inArray(removed[i], resultArray._src);
				// DataModelから削除されたら結果からも削除
				resultArray.splice(resultIndex, 1);
			}
			for (var i = 0, l = changed.length; i < l; i++) {
				// resultArrayの何番目に入っているアイテムか(入っていないなら-1)
				var resultIndex = $.inArray(changed[i].target, resultArray._src);

				// マッチするかどうかチェックして、
				// マッチするかつ結果にないものなら追加
				// マッチしないかつ結果にあるものなら取り除く
				if (match(changed[i].target, analyzedQuery)) {
					if (resultIndex === -1) {
						resultArray.push(changed[i].target);
					}
				} else {
					if (resultIndex !== -1) {
						resultArray.splice(resultIndex, 1);
					}
				}
			}
			for (var i = 0, l = created.length; i < l; i++) {
				// 新しく作成されたアイテムがあればマッチするかどうかチェックして
				// マッチするなら結果に追加
				if (match(created[i], analyzedQuery)) {
					resultArray.push(created[i]);
				}
			}
		};
	}

	function createAnalyzedQuery(queryObj) {
		// queryObjの解析
		var analyzedQuery = [];
		for ( var prop in queryObj) {
			// プロパティ名とオペランドに分割。連続した空白文字は無視
			var tmp = $.trim(prop.replace(/ +/g, ' ')).split(' ');
			// 演算子省略時は'==='で比較
			var op = tmp[1] || '===';
			analyzedQuery.push({
				prop: tmp[0],
				queryValue: queryObj[prop],
				compareFunction: COMPARE_FUNCIONS[op]
			});
		}
		return analyzedQuery;
	}


	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * クエリにマッチするDataItemを返します
	 */
	function query(queryObj) {
		var model = this;
		var items = model.items;
		// TODO 同一クエリだった時に結果は覚えておいたものから持ってくるようにするべきか
		// (覚えておく方法、queryObjにもたせる？queryObjにidを振ってmapで覚えておく？)
		//		if (queryObj._result) {
		//			// 既に同一クエリで結果ObservableArray生成済みの場合はそれを返す
		//			return queryObj._result;
		//		}
		//		var result = queryObj._result = h5.core.data.createObservableArray();
		var resultArray = h5.core.data.createObservableArray();

		// queryObjを解析
		var analyzedQuery = createAnalyzedQuery(queryObj);

		// DataModelに変更があった時に結果を更新する関数をバインドする
		this.addEventListener('itemsChange', createChangeListener(analyzedQuery, resultArray));

		// 今あるアイテムについて、条件を満たすものを列挙
		for ( var p in items) {
			var item = items[p];
			if (match(item, analyzedQuery)) {
				resultArray.push(item);
			}
		}

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
