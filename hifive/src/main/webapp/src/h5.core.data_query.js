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

	/** setOrderFunctionで既にオーダー関数が設定済みなのにaddOrderが呼ばれた */
	var ERR_CODE_ALREADY_SET_ORDER_FUNCTION = 4;

	/** addOrderで既にオーダーキーが追加済みなのにsetOrderFunctionが呼ばれた */
	var ERR_CODE_ALREADY_ADDED_ORDER = 5;

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_NO_COMPARE_FUNCTIONS] = '演算子"{0}"で"{1}"型の値を比較することはできません';
	errMsgMap[ERR_CODE_ORDER_BY_KEY] = '{0}の第1引数が不正です。指定されたキー({1})はモデル{2}に存在しません';
	errMsgMap[ERR_CODE_ORDER_BY_COMPARE_FUNCTION_INVALID] = 'setOrderFunctionの第1引数が不正です。比較関数を関数で指定してください';
	errMsgMap[ERR_CODE_ALREADY_SET_ORDER_FUNCTION] = 'setOrderFunction()ですでにソート条件が設定済みです。addOrder()でソート条件を追加することはできません。';
	errMsgMap[ERR_CODE_ALREADY_ADDED_ORDER] = 'addOrder()ですでにソート条件が追加済みです。setOrderFunction()でソート条件を設定することはできません。';

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
	 * @param {Object} criteria 検索条件オブジェクト
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
	 * QueryResultクラス
	 * <p>
	 * {@link Query.execute}がこのクラスのインスタンスを返します
	 * </p>
	 * <p>
	 * {@link QueryResult.result}プロパティにクエリ結果が格納されています
	 * </p>
	 *
	 * @class
	 * @name QueryResult
	 */
	/**
	 * @private
	 * @param {DataItem[]} result クエリ結果配列
	 */
	function QueryResult(result) {
		/**
		 * クエリ結果配列
		 * <p>
		 * {@link Query.execute}によって選択された{@link DataItem}が格納された配列です。
		 * </p>
		 *
		 * @memberOf QueryResult
		 * @name result
		 * @type {DataItem[]}
		 */
		this.result = result;
	}

	/**
	 * Queryクラス
	 * <p>
	 * {@link DataModel.createQuery}の戻り値がこのクラスのインスタンスです。<br>
	 * 参考：<a href="/conts/web/view/reference/data-model-query">リファレンス/データモデルのクエリ</a>
	 * </p>
	 *
	 * @class
	 * @name Query
	 */
	/**
	 * @private
	 * @param {DataModel} model データモデル
	 */
	function Query(src) {
		/**
		 * クエリ対象のデータソース。データモデルまたは配列を指定可能。
		 *
		 * @private
		 * @name _src
		 * @memberOf Query
		 * @type {DataModel}
		 */
		this._src = src;
	}
	// TODO 今は何もイベントをあげていないのでeventDispatcherにする必要がない。仕様が決まったら対応する。
	//	h5.mixin.eventDispatcher.mix(Query.prototype);

	$.extend(Query.prototype, {
		/**
		 * 検索条件オブジェクトをセットします。<br>
		 * 参考：<a href="/conts/web/view/reference/data-model-query">リファレンス/データモデルのクエリ</a>
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
		 *
		 * <pre class="sh_javascript">
		 * // 記述例
		 * // categoryが'book'で、nameに'HTML5'を含み、priceが3000未満のアイテムを検索する条件
		 * {
		 * 	category: 'book',
		 * 	name: /HTML5/,
		 * 	'price &lt;': 3000
		 * }
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
		 * {@link Query.setCriteria}で設定した検索条件で検索し、結果を{@link QueryResult}で返します。
		 * </p>
		 *
		 * @memberOf Query
		 * @returns {QueryResult}
		 */
		execute: function() {
			var result = [];
			var dataSource = this._getDataSource();
			//データソース配列の各要素がDataItemかどうか
			var isDataItemSrc = isArray(this._src);

			//条件に基づいてフィルタリング
			for (var i = 0, len = dataSource.length; i < len; i++) {
				var data = dataSource[i];
				if (isDataItemSrc) {
					if (this._criteria.match(data.get())) {
						result.push(data);
					}
				} else if (this._criteria.match(data)) {
					result.push(data);
				}
			}

			// ソート
			if (this._orderFunction) {
				result.sort(this._orderFunction);
			} else if (this._addedOrders) {
				var addedOrders = this._addedOrders;
				var keysLength = addedOrders.length;
				result.sort(function(item1, item2) {
					// 追加されたキー順に評価する
					// p1,p2が2つとも昇順で登録されている場合、p1で昇順ソートになっていて、p1が同じものについてはp2で昇順ソートされるようにする
					for (var i = 0; i < keysLength; i++) {
						var order = addedOrders[i];
						var key = order.key;
						var isAsc = order.isAsc;
						var val1 = isDataItemSrc ? item1.get(key) : item;
						var val2 = isDataItemSrc ? item2.get(key) : item;
						if (val1 > val2) {
							return isAsc ? 1 : -1;
						}
						if (val1 < val2) {
							return isAsc ? -1 : 1;
						}
					}
					return 0;
				});
			}
			return new QueryResult(result);
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
		 * 検索結果のソート条件を比較関数で設定
		 * <p>
		 * 検索結果をソートする比較関数を指定します。データアイテム同士を比較する関数を設定してください。
		 * </p>
		 * <p>
		 * 比較関数の例
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * query.setOrderFunction(function(a, b) {
		 * 	// 比較関数の引数はそれぞれデータアイテム。第1引数のオブジェクトを先にする場合は負の値、第2引数のオブジェクトを先にする場合は正の値を返す。この場合、ageが小さい順（昇順）でソートされる。
		 * 		return a.get('age') - b.get('age');
		 * 	});
		 * </code></pre>
		 *
		 * <p>
		 * 単にあるプロパティで昇順あるいは降順にソートしたい場合は{@link Query.addOrder}で設定できます。
		 * </p>
		 * <p>
		 * {@link Query.addOrder}で条件を追加している場合にsetOrderFunctionで比較関数を設定することはできません。また逆に、setOrderFunctionで比較関数を設定している場合はaddOrderは呼べません。
		 * </p>
		 * <p>
		 * setOrderFunction()で比較設定を設定済みである場合に再度setOrderFunction()を実行すると、設定済みの関数は上書きされます。
		 * </p>
		 * <p>
		 * setOrderFunction()で設定したソート条件を削除したい場合は{@link Query.clearOrder}を実行してください。
		 * </p>
		 *
		 * @memberOf Query
		 * @param {Function} orderFunction
		 * @returns {Query}
		 */
		setOrderFunction: function(orderFunction) {
			// 比較関数のエラーチェック
			if (!isFunction(orderFunction)) {
				throwFwError(ERR_CODE_ORDER_BY_COMPARE_FUNCTION_INVALID);
			}
			if (this._addedOrders) {
				// addOrderですでにオーダーキーが設定済みの場合はsetOrderFunctionできない
				throwFwError(ERR_CODE_ALREADY_ADDED_ORDER);
			}
			this._orderFunction = orderFunction;
			return this;
		},

		/**
		 * 検索結果のソート条件を指定したプロパティついての昇順、または降順に設定
		 * <p>
		 * 検索結果のソート条件を指定したプロパティについての昇順、または降順に設定します。第1引数には比較対象となるキー名を指定してください。
		 * </p>
		 * <p>
		 * 第2引数にfalseを指定した場合は降順です。trueを指定した場合は省略した場合は昇順です。
		 * </p>
		 * <p>
		 * addOrderは複数回呼ぶことで条件を追加できます。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * query.addOrder('p1').addOrder('p2', false);
		 * </code></pre>
		 *
		 * <p>
		 * 上記のように指定した場合、p1キーで昇順ソートし、p1の値が同じアイテムについてはp2キーで降順ソートします。
		 * </p>
		 * <p>
		 * {@link Query.setOrderFunction}で比較関数を設定している場合はこのメソッドは呼べません。また逆に、addOrder()で条件を追加している場合にsetOrderFunctionで比較関数を設定することもできません。
		 * </p>
		 * <p>
		 * addOrder()で追加した条件をすべて削除したい場合は{@link Query.clearOrder}を実行してください。
		 * </p>
		 *
		 * @memberOf Query
		 * @param {string} key
		 * @param {boolean} [isAsc=true] falseを指定すると降順に設定。デフォルトは昇順
		 * @returns {Query}
		 */
		addOrder: function(key, isAsc) {
			if (!isArray(this._src) && !this._src.schema.hasOwnProperty(key)) {
				// データソースがDataModelの場合、keyがschemaにあるかどうかチェックする。
				// スキーマに存在しないプロパティをkeyに指定しようとしたらエラーにする
				throwFwError(ERR_CODE_ORDER_BY_KEY, ['addOrder', key, this._src.name]);
			}

			if (this._orderFunction) {
				// setOrderFunctionですでにオーダー関数が設定済みの場合はaddOrderできない
				throwFwError(ERR_CODE_ALREADY_SET_ORDER_FUNCTION);
			}

			this._addedOrders = this._addedOrders || [];
			this._addedOrders.push({
				key: key,
				isAsc: isAsc !== false
			});
			return this;
		},

		/**
		 * 検索結果のソート条件指定を全て削除
		 * <p>
		 * {@link Query.addOrder}及び{@link Query.setOrderFunction}で設定したソート条件をすべて削除します。
		 * </p>
		 *
		 * @memberOf Query
		 * @returns {Query}
		 */
		clearOrder: function() {
			this._addedOrders = null;
			this._orderFunction = null;
			return this;
		},

		/**
		 * データソースの配列を返す。データソースは配列またはDataModelがあり得るので、配列に正規化する。
		 *
		 * @private
		 * @returns データソース配列
		 */
		_getDataSource: function() {
			if (isArray(this._src)) {
				//srcが配列の場合はそのまま返す
				return this._src;
			}

			//DataModelの場合は、アイテムを配列化して返す
			return this._src.toArray();
		}
	});

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * Queryクラスを作成して返します。このメソッドはDataModelのメソッドとなり、実行時のthisはDataModelインスタンスになります。
	 *
	 * @private
	 * @returns {Query} 検索を行うQueryクラスを返します
	 */
	function createQuery() {
		return new Query(this);
	}

	/**
	 * Queryクラスを作成します。
	 *
	 * @param {Array} src クエリの対象となるデータソースです。配列を指定できます。
	 * @returns {Query} クエリオブジェクト
	 */
	function createGenericQuery(src) {
		return new Query(src);
	}

	// =============================
	// Expose to window
	// =============================

	// h5internalにqueryを公開
	h5internal.data = {
		createQuery: createQuery
	};

	h5.u.obj.expose('h5.core.data', {
		createQuery: createGenericQuery
	});
})();
