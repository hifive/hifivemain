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
	function match(item, queryObj) {
		for ( var prop in queryObj) {
			if (prop === '_result') {
				continue;
			}
			var value = item.get(prop);
			var param = queryObj[prop];
			if (value === param) {
				continue;
			}
			if (!/^<*$/i.test(param)) {
				if (value < parseFloat(param.slice(1))) {
					continue;
				}
			}

			// TODO



			return false;

		}
		return true;
	}

	function createChangeListener(queryObj, result) {
		return function(ev) {
			var removed = ev.removed;
			var created = ev.created;
			var changed = ev.changed;
			for (var i = 0, l = removed.length; i < l; i++) {
				result.splice($.inArray(removed[i], result), 1);
			}
			for (var i = 0, l = changed.length; i < l; i++) {
				if (!match(changed[i].target, queryObj)) {
					result.push(changed[i].target);
				} else {
					result.splice($.inArray(changed[i], result), 1);
				}
			}
			for (var i = 0, l = created.length; i < l; i++) {
				if (match(created[i], queryObj)) {
					result.push(created[i]);
				}
			}
		};
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
		if (queryObj._result) {
			// 既に同一クエリで結果ObservableArray生成済みの場合はそれを返す
			return queryObj._result;
		}
		var result = queryObj._result = h5.core.data.createObservableArray();

		for ( var p in items) {
			var item = items[p];
			if (match(item, queryObj)) {
				result.push(item);
			}
		}
		// DataModelに変更があった時に結果を更新する関数をバインドする
		this.addEventListener('itemsChange', createChangeListener(queryObj, result));

		return result;
	}

	// h5internalにqueryを公開
	h5internal.data = {
		query: query
	};
	// =============================
	// Expose to window
	// =============================
})();
