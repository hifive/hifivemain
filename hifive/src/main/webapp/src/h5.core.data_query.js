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

	/**
	 * criteriaで'or'または'and'の論理演算子を指定するプロパティのマップ
	 *
	 * @private
	 */
	var OPERAND_PROPERTY = '__op';

	/**
	 * 比較関数と演算子のマップ
	 *
	 * @private
	 */
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

	/**
	 * RegExp型を比較する関数と演算子のマップ
	 *
	 * @private
	 */
	var COMPARE_REGEXP_FUNCTIONS = {
		'=': function(value, queryValue) {
			return queryValue.test(value);
		},
		'!=': function(value, queryValue) {
			return !queryValue.test(value);
		}
	};

	/**
	 * Date型を比較する関数と演算子のマップ
	 *
	 * @private
	 */
	var COMPARE_DATE_FUNCIONS = {
		'=': function(value, queryValue) {
			if (!isDate(value)) {
				// Date型じゃない場合はfalseを返す(queryValueは必ずDate型であるため)
				return false;
			}
			return value.getTime() === queryValue.getTime();
		},
		'!=': function(value, queryValue) {
			if (!isDate(value)) {
				// Date型じゃない場合はtrueを返す(queryValueは必ずDate型であるため)
				return true;
			}
			return value.getTime() !== queryValue.getTime();
		},
		'<': function(value, queryValue) {
			if (!isDate(value)) {
				return false;
			}
			return value.getTime() < queryValue.getTime();
		},
		'>': function(value, queryValue) {
			if (!isDate(value)) {
				return false;
			}
			return value.getTime() > queryValue.getTime();
		},
		'<=': function(value, queryValue) {
			if (!isDate(value)) {
				return false;
			}
			return value.getTime() <= queryValue.getTime();
		},
		'>=': function(value, queryValue) {
			if (!isDate(value)) {
				return false;
			}
			return value.getTime() >= queryValue.getTime();
		},
		'between': function(value, queryValue) {
			if (!isDate(value)) {
				return false;
			}
			var lower = queryValue[0].getTime();
			var upper = queryValue[1].getTime();
			var valueTime = value.getTime();
			// 境界値を含む
			return lower <= valueTime && valueTime <= upper;
		},
		'!between': function(value, queryValue) {
			if (!isDate(value)) {
				return false;
			}
			var lower = queryValue[0].getTime();
			var upper = queryValue[1].getTime();
			var valueTime = value.getTime();
			// 境界値を含まない
			return valueTime < lower || upper < valueTime;
		},
		'in': function(value, queryValue) {
			if (!isDate(value)) {
				return false;
			}
			var valueTime = value.getTime();
			for (var i = 0, l = queryValue.length; i < l; i++) {
				if (valueTime === queryValue[i].getTime()) {
					return true;
				}
			}
			return false;
		},
		'!in': function(value, queryValue) {
			if (!isDate(value)) {
				return true;
			}
			var valueTime = value.getTime();
			for (var i = 0, l = queryValue.length; i < l; i++) {
				if (valueTime === queryValue[i].getTime()) {
					return false;
				}
			}
			return true;
		}
	};

	// -------------------------------
	// エラーコード
	// -------------------------------
	// TODO エラーコードの採番は決まってから適切な番号にする
	/** 指定された比較関数がない */
	var ERR_CODE_NO_COMPARE_FUNCTIONS = 1;

	/** ORDER BY句に指定されたkey名がschemaに存在しない */
	var ERR_CODE_ORDER_BY_KEY = 2;

	/** ORDER BY句に指定された比較関数が不正 */
	var ERR_CODE_ORDER_BY_COMPARE_FUNCTION_INVALID = 3;

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_NO_COMPARE_FUNCTIONS] = '演算子"{0}"で"{1}"型の値を比較することはできません';
	errMsgMap[ERR_CODE_ORDER_BY_KEY] = '{0}の第1引数が不正です。指定されたキー({1})はモデル{2}に存在しません';
	errMsgMap[ERR_CODE_ORDER_BY_COMPARE_FUNCTION_INVALID] = 'orderByの第1引数が不正です。比較関数を関数で指定してください';
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
	/**
	 * 正規表現かどうか
	 *
	 * @private
	 * @param value
	 * @returns {Boolean}
	 */
	function isRegExp(value) {
		return value instanceof RegExp;
	}

	/**
	 * 日付型かどうか
	 *
	 * @private
	 * @param value
	 * @returns {Boolean}
	 */
	function isDate(value) {
		return value instanceof Date;
	}

	/**
	 * 各条件について結果をANDで評価する関数を生成して返します
	 *
	 * @private
	 * @param {Object} compiledCriteria コンパイル済みcriteria
	 * @returns {Function}
	 */
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

	/**
	 * 各条件について結果をORで評価する関数を生成して返します
	 *
	 * @private
	 * @param {Object} compiledCriteria コンパイル済みcriteria
	 * @returns {Function}
	 */
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

	/**
	 * setLive()が呼ばれた時にDataModelにaddEventListenerするリスナを作成します
	 *
	 * @param {Query} query クエリクラス
	 * @returns {Function} リスナ
	 */
	function createChangeListener(query) {
		var match = query._criteria.match;
		var resultArray = query.result;
		return function(ev) {
			var removed = ev.removed;
			var created = ev.created;
			var changed = ev.changed;
			var isSorted = true;

			for (var i = 0, l = removed.length; i < l; i++) {
				// resultArrayの何番目に入っているアイテムか
				var resultIndex = $.inArray(removed[i], resultArray._src);
				// DataModelから削除されたら結果からも削除
				if (resultIndex !== -1) {
					resultArray.splice(resultIndex, 1);
				}
			}
			for (var i = 0, l = changed.length; i < l; i++) {
				// resultArrayの何番目に入っているアイテムか(入っていないなら-1)
				var resultIndex = $.inArray(changed[i].target, resultArray._src);
				// 中身が変更されたら再ソート
				isSorted = false;
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
			for (var i = 0, l = created.length; i < l; i++) {
				// 新しく作成されたアイテムがあればマッチするかどうかチェックして
				// マッチするなら結果に追加
				if (match(created[i].get())) {
					isSorted = false;
					resultArray.push(created[i]);
				}
			}

			// ソート
			if (query._compareFunction && !isSorted) {
				// ソートする必要があるならソートする
				resultArray.sort(query._compareFunction);
			}
		};
	}

	/**
	 * criteriaオブジェクトをコンパイルします
	 * <p>
	 * 以下のようなオブジェクトを生成します
	 * </p>
	 *
	 * <pre class="sh_javascript">
	 * {
	 *   queries: [{
	 *     prop: プロパティ名,
	 *     queryValue: 指定された値,
	 *     compareFunction: 指定された値と比較する関数,
	 *   }],
	 *   nestedCriterias: ネストされたcriteriaオブジェクト(コンパイル済み)の配列,
	 *   userFunctions: ユーザ指定関数の配列
	 * }
	 * </pre>
	 *
	 * @private
	 * @param {Object} criteria
	 * @returns {Object} コンパイル済みcriteriaオブジェクト
	 */
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

			if (isRegExp(valueForTypeCheck)) {
				// 正規表現の場合
				compareFunctions = COMPARE_REGEXP_FUNCTIONS;
			} else if (isDate(valueForTypeCheck)) {
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
			var compareFunction = compareFunctions[op];
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
		compiledCriteria.match = criteria[OPERAND_PROPERTY] === 'or' ? createORCompareFunction(compiledCriteria)
				: createANDCompareFunction(compiledCriteria);
		return compiledCriteria;
	}

	/**
	 * 指定されたキーでアイテムを昇順にソートするための比較関数を作成します
	 *
	 * @private
	 * @param {String} key データアイテムのキー名
	 * @returns {Function}
	 */
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
		};
	}

	/**
	 * 指定されたキーでアイテムを降順にソートするための比較関数を作成します
	 *
	 * @private
	 * @param {String} key データアイテムのキー名
	 * @returns {Function}
	 */
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
		};
	}

	/**
	 * Queryクラス
	 * <p>
	 * {@link DataModel.createQuery}の戻り値がこのクラスのインスタンスです。
	 * </p>
	 *
	 * @class
	 * @name Query
	 */
	/**
	 * @private
	 * @param {DataModel} model データモデル
	 */
	function Query(model) {
		/**
		 * 検索結果の配列(ObservableArray)
		 * <p>
		 * 検索結果配列は中身は変わってもインスタンスは変わりません。
		 * </p>
		 *
		 * @name result
		 * @memberOf Query
		 * @type {ObservableArray}
		 */
		this.result = h5.core.data.createObservableArray();

		/**
		 * 検索対象のデータモデル
		 *
		 * @private
		 * @name _model
		 * @memberOf Query
		 * @type {DataModel}
		 */
		this._model = model;
	}
	// TODO 今は何もイベントをあげていないのでeventDispatcherにする必要がない。仕様が決まったら対応する。
	//	h5.mixin.eventDispatcher.mix(Query.prototype);

	$.extend(Query.prototype, {
		/**
		 * 検索条件オブジェクトをセットします
		 * <p>
		 * 検索の実行({@link Query.execute})を実行した時に、ここで指定した検索条件オブジェクトに基づいて検索を実行します。
		 * </p>
		 * <p>
		 * 検索条件オブジェクトは、"プロパティ名 (演算子)"をキーにして、比較する値を値に持つオブジェクトを指定します。
		 * 複数のプロパティを持つオブジェクトはデフォルトではANDで評価します。
		 * <p>
		 * 演算子には、===,!==,==,!=,>=,<=,between,!between,in,!inを指定できます。省略した場合は===です。
		 * </p>
		 * 検索条件オブジェクトに"__op"プロパティを持たせて、値に'or'を記述すると、ORでの評価になります。 ('and'を設定すると記述しない場合と同様ANDでの評価になります。
		 * </p>
		 * <p>
		 * 詳細は{@link (TODO 未作成)|リファレンス&gt;Criteriaオブジェクト}をご覧ください
		 * </p>
		 *
		 * <pre class="sh_javascript">
		 * // 記述例
		 * // categoryが'book'で、nameに'HTML5'を含み、priceが3000未満のアイテムを検索する条件
		 * {
		 * 	category: 'book',
		 * 	name: /HTML5/,
		 * 	'price &lt;': 3000
		 * }
		 *
		 * // categoryが'game'または'movie'で、releaseDateが2014年以降のアイテムを検索する条件
		 * {
		 *   'category in': ['game', 'movie'],
		 *   'relaseDate &gt;=': new Date('2014/1/1')
		 * }
		 * </pre>
		 *
		 * @memberOf Query
		 * @param {Object} criteria 検索条件オブジェクト
		 * @returns {Query}
		 */
		setCriteria: function(criteria) {
			this._criteria = compileCriteria(criteria);
			return this;
		},

		/**
		 * 検索を実行
		 * <p>
		 * {@link Query.setCriteria}で設定した検索条件で検索します。検索が完了すると{@link result}に結果が格納されます。
		 * </p>
		 * <p>
		 * また、{@link Query.onQueryComplete}に設定したハンドラが呼ばれます。
		 * </p>
		 *
		 * @memberOf Query
		 * @returns {Query}
		 */
		execute: function() {
			// 新しくdeferredを作成
			this._executeDfd = h5.async.deferred();
			var result = this.result;
			// resultを一旦空にする
			result.copyFrom(null);
			for ( var id in this._model.items) {
				var item = this._model.items[id];
				// マッチするなら結果に追加
				if (this._criteria.match(item.get())) {
					result.push(item);
				}
			}
			// ソート
			if (this._compareFunction) {
				result.sort(this._compareFunction);
			}
			this._executeDfd.resolveWith(this, [result]);
			return this;
		},

		/**
		 * execute()による検索が完了した時に実行するハンドラを登録
		 * <p>
		 * ハンドラの引数には検索結果(ObserevableArray)が渡されます
		 * </p>
		 *
		 * @memberOf Query
		 * @param {Function} completeHandler
		 * @returns {Query}
		 */
		onQueryComplete: function(completeHandler) {
			// TODO executeが呼ばれる前にハンドラを設定された場合はどうするか
			this._executeDfd.done(completeHandler);
			return this;
		},

		// TODO Liveクエリの仕様は再検討する
		//		/**
		//		 * クエリをライブクエリにします
		//		 * <p>
		//		 * ライブクエリにすると、検索条件がセットされた時やDataModelに変更があった時に検索結果が動的に変更されます。(executeを呼ぶ必要がありません)
		//		 * </p>
		//		 *
		//		 * @see Query#unsetLive
		//		 * @memberOf Query
		//		 * @returns {Query}
		//		 */
		//		setLive: function() {
		//			// ライブクエリ設定済みなら何もしない
		//			if (this._isLive) {
		//				return;
		//			}
		//			// リスナ未作成なら作成
		//			this._listener = this._listener || createChangeListener(this);
		//			this._model.addEventListener('itemsChange', this._listener);
		//			this._isLive = true;
		//
		//			return this;
		//		},
		//
		//		/**
		//		 * ライブクエリを解除します
		//		 *
		//		 * @see Query#setLive
		//		 * @memberOf Query
		//		 * @returns {Query}
		//		 */
		//		unsetLive: function() {
		//			// ライブクエリでなければ何もしない
		//			if (!this._isLive) {
		//				return;
		//			}
		//			this._model.removeEventListener('itemsChange', this._listener);
		//			this._isLive = false;
		//			return this;
		//		},

		/**
		 * 検索結果のソート条件を設定
		 * <p>
		 * 比較関数で指定します。単にあるプロパティで昇順あるいは降順にしたい場合は{@link Query.orderByAsc}または{@link Query.orderByDesc}を使用できます。
		 * </p>
		 * <p>
		 * 比較関数は、以下の例のように実装してください。
		 * </p>
		 *
		 * <pre class="sh_javascript">
		 * query.orderBy(function(a, b) {
		 * 	// idを数値で評価して降順にする
		 * 		// 引数はそれぞれデータアイテム。第1引数を先にする場合は正の値、第2引数を先にする場合は負の値を返す
		 * 		return parseInt(b.get('id')) - parseInt(a.get('id'));
		 * 	});
		 * </pre>
		 *
		 * @memberOf Query
		 * @param {Function} compareFunction
		 * @returns {Query}
		 */
		orderBy: function(compareFunction) {
			// 比較関数のエラーチェック
			if (!isFunction(compareFunction)) {
				throwFwError(ERR_CODE_ORDER_BY_COMPARE_FUNCTION_INVALID);
				return;
			}
			return this._orderBy(compareFunction);
		},

		/**
		 * 検索結果のソート条件を指定したプロパティについての昇順に設定
		 * <p>
		 * 検索結果のソート条件を指定したプロパティについての昇順に設定します。第1引数には比較対象となるキー名を指定してください。
		 * </p>
		 *
		 * @memberOf Query
		 * @param {string} key
		 * @returns {Query}
		 */
		orderByAsc: function(key) {
			// keyがschemaにあるかどうかチェックする
			var schema = this._model.schema;
			if (!schema.hasOwnProperty(key)) {
				//スキーマに存在しないプロパティはgetできない（プログラムのミスがすぐわかるように例外を送出）
				throwFwError(ERR_CODE_ORDER_BY_KEY, ['orderByAsc', key, this._model.name]);
			}
			return this._orderBy(createAscCompareFunction(key));
		},

		/**
		 * 検索結果のソート条件を指定したプロパティについての降順に設定
		 * <p>
		 * 検索結果のソート条件を指定したプロパティについての降順に設定します。第1引数には比較対象となるキー名を指定してください。
		 * </p>
		 *
		 * @memberOf Query
		 * @param {string} key
		 * @returns {Query}
		 */
		orderByDesc: function(key) {
			// keyがschemaにあるかどうかチェックする
			var schema = this._model.schema;
			if (!schema.hasOwnProperty(key)) {
				//スキーマに存在しないプロパティはgetできない（プログラムのミスがすぐわかるように例外を送出）
				throwFwError(ERR_CODE_ORDER_BY_KEY, ['orderByDesc', key, this._model.name]);
			}
			return this._orderBy(createDescCompareFunction(key));
		},

		_orderBy: function(compareFunction) {
			this._compareFunction = compareFunction;
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
	 * @private
	 * @returns {Query} 検索を行うQueryクラスを返します
	 */
	function createQuery() {
		return new Query(this);
	}

	// =============================
	// Expose to window
	// =============================

	// h5internalにqueryを公開
	h5internal.data = {
		createQuery: createQuery
	};
})();
