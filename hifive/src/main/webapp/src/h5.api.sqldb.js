/*
 * Copyright (C) 2011-2012 NS Solutions Corporation.
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
/* ------ h5.api.sqldb ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================
	/** INSERT フォーマット */
	var INSERT_SQL_FORMAT = 'INSERT INTO {0} ({1}) VALUES ({2})';
	/** INSERT フォーマット(VALUES未指定) */
	var INSERT_SQL_EMPTY_VALUES = 'INSERT INTO {0} DEFAULT VALUES';
	/** SELECT フォーマット */
	var SELECT_SQL_FORMAT = 'SELECT {0} FROM {1}';
	/** UPDATE フォーマット */
	var UPDATE_SQL_FORMAT = 'UPDATE {0} SET {1}';
	/** DELETE フォーマット */
	var DELETE_SQL_FORMAT = 'DELETE FROM {0}';

	// =============================
	// Production
	// =============================

	/** エラーコード: Insert/Sql/Del/Update/Select オブジェクトのexecute()が複数回実行された */
	var ERR_CODE_RETRY_SQL = 3000;
	/** エラーコード: 指定されたテーブル名が不正 */
	var ERR_CODE_INVALID_TABLE_NAME = 3001;
	/** エラーコード: 指定されたトランザクションの型が不正 */
	var ERR_CODE_INVALID_TRANSACTION_TYPE = 3002;
	/** エラーコード: where句に指定されたオペレータ文字列が不正 */
	var ERR_CODE_INVALID_OPERATOR = 3003;
	/** エラーコード: 引数で指定された型が不正 */
	var ERR_CODE_INVALID_PARAM_TYPE = 3004;
	/** エラーコード: 指定した取得カラム名が不正 */
	var ERR_CODE_INVALID_COLUMN_NAME = 3005;
	/** エラーコード: 指定したパラメータが不正 */
	var ERR_CODE_INVALID_VALUES = 3006;
	/** エラーコード: SQLのステートメントが不正 */
	var ERR_CODE_INVALID_STATEMENT = 3007;
	/** エラーコード: パラメータに指定したオブジェクトの型が不正 */
	var ERR_CODE_TYPE_NOT_ARRAY = 3008;
	/** エラーコード: transaction.add()に指定したオブジェクトの型が不正 */
	var ERR_CODE_INVALID_TRANSACTION_TARGET = 3009;
	/** エラーコード: トランザクション処理失敗 */
	var ERR_CODE_TRANSACTION_PROCESSING_FAILURE = 3010;

	var errMsgMap = {};
	errMsgMap[ERR_CODE_RETRY_SQL] = '同一オブジェクトによるSQLの再実行はできません。';
	errMsgMap[ERR_CODE_INVALID_TABLE_NAME] = '{0}: テーブル名を指定して下さい。';
	errMsgMap[ERR_CODE_INVALID_TRANSACTION_TYPE] = '{0}: トランザクションが不正です。';
	errMsgMap[ERR_CODE_INVALID_OPERATOR] = 'オペレータが不正です。 <= < >= > = != like のいずれかを使用して下さい。';
	errMsgMap[ERR_CODE_INVALID_PARAM_TYPE] = '{0}: {1}に指定したオブジェクトの型が不正です。';
	errMsgMap[ERR_CODE_INVALID_COLUMN_NAME] = '{0}: カラム名を指定して下さい。';
	errMsgMap[ERR_CODE_INVALID_VALUES] = '{0}: 値を指定して下さい。';
	errMsgMap[ERR_CODE_INVALID_STATEMENT] = '{0}: ステートメントが不正です。';
	errMsgMap[ERR_CODE_TYPE_NOT_ARRAY] = '{0}: パラメータは配列で指定して下さい。';
	errMsgMap[ERR_CODE_INVALID_TRANSACTION_TARGET] = '指定されたオブジェクトはトランザクションに追加できません。Insert/Update/Del/Select/Sqlクラスのインスタンスを指定して下さい。';
	errMsgMap[ERR_CODE_TRANSACTION_PROCESSING_FAILURE] = 'トランザクション処理中にエラーが発生しました。{0} {1}';
	addFwErrorCodeMap(errMsgMap);

	// =============================
	// Development Only
	// =============================

	/* del begin */

	var fwLogger = h5.log.createLogger('h5.api.sqldb');

	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	var getDeferred = h5.async.deferred;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	/**
	 * SQLErrorのエラーコードに対応するメッセージを取得します。
	 */
	function getTransactionErrorMsg(e) {
		switch (e.code) {
		case e.CONSTRAINT_ERR:
			return '一意制約に反しています。';
		case e.DATABASE_ERR:
			return 'データベースエラー';
		case e.QUOTA_ERR:
			return '空き容量が不足しています。';
		case e.SYNTAX_ERR:
			return '構文に誤りがあります。';
		case e.TIMEOUT_ERR:
			return 'ロック要求がタイムアウトしました。';
		case e.TOO_LARGE_ERR:
			return '取得結果の行が多すぎます。';
		case e.UNKNOWN_ERR:
			return 'トランザクション内で例外がスローされました。';
		case e.VERSION_ERR:
			return 'データベースのバージョンが一致しません。';
		default:
			return '';
		}
	}

	// =============================
	// Variables
	// =============================

	// =============================
	// Functions
	// =============================
	/**
	 * トランザクションエラー時に実行する共通処理
	 */
	function transactionErrorCallback(txw, e) {
		var results = txw._tasks;
		for ( var i = results.length - 1; i >= 0; i--) {
			var result = results[i];
			var msgParam = getTransactionErrorMsg(e);
			result.deferred.reject(createRejectReason(ERR_CODE_TRANSACTION_PROCESSING_FAILURE, [
					msgParam, e.message], e));
		}
	}

	/**
	 * トランザクション完了時に実行する共通処理
	 */
	function transactionSuccessCallback(txw) {
		var results = txw._tasks;
		for ( var i = results.length - 1; i >= 0; i--) {
			var result = results[i];
			result.deferred.resolve(result.result);
		}
	}

	/**
	 * Insert/Select/Update/Del/Sql/Transactionオブジェクトのexecute()が二度を呼び出された場合、例外をスローする
	 */
	function checkSqlExecuted(flag) {
		if (flag) {
			throw new throwFwError(ERR_CODE_RETRY_SQL);
		}
	}

	/**
	 * DatabaseWrapper.select()/insert()/update()/del()/sql() のパラメータチェック
	 * <p>
	 * tableNameが未指定またはString型以外の型の値が指定された場合、例外をスローします。
	 */
	function checkTableName(funcName, tableName) {
		if (typeof tableName !== 'string') {
			throw new throwFwError(ERR_CODE_INVALID_TABLE_NAME, funcName);
		}
	}

	/**
	 * DatabaseWrapper.select()/insert()/update()/del()/sql()/transaction() のパラメータチェック
	 * <p>
	 * txwがTransactionWrapper型ではない場合、例外をスローします。
	 */
	function checkTransaction(funcName, txw) {
		if (txw && !(txw instanceof SQLTransactionWrapper)) {
			throw new throwFwError(ERR_CODE_INVALID_TRANSACTION_TYPE, funcName);
		}
	}

	/**
	 * 条件を保持するオブジェクトから、SQLのプレースホルダを含むWHERE文とパラメータの配列を生成します。
	 */
	function createConditionAndParameters(whereObj, conditions, parameters) {
		if ($.isPlainObject(whereObj)) {
			for ( var prop in whereObj) {
				var params = prop.replace(/ +/g, ' ').split(' ');
				var param = [];

				if (params.length === 0 || params[0] === "") {
					continue;
				} else if (params.length === 1) {
					param.push(params[0]);
					param.push('=');
					param.push('?');
				} else if (!/^(<=|<|>=|>|=|!=|like)$/i.test(params[1])) {
					throw new throwFwError(ERR_CODE_INVALID_OPERATOR);
				} else if (params.length === 3 && /^like$/i.test(params[1])) {
					param.push(params[0]);
					param.push(params[1]);
					param.push('?');
					param.push('ESCAPE');
					param.push('\"' + params[2] + '\"');
				} else {
					param.push(params[0]);
					param.push(params[1]);
					param.push('?');
				}

				conditions.push(param.join(' '));
				parameters.push(whereObj[prop]);
			}
		}
	}

	/**
	 * マーカークラス
	 * <p>
	 * このクラスを継承しているクラスはTransaction.add()で追加できる。
	 */
	function SqlExecutor() {
	// 空コンストラクタ
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	/**
	 * SQLTransaction拡張クラス
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * Insert/Select/Update/Del/Sql/Transactionオブジェクトのexecute()が返す、Promiseオブジェクトのprogress()の引数に存在します。
	 *
	 * @class
	 * @name SQLTransactionWrapper
	 */
	function SQLTransactionWrapper(db, tx) {
		this._db = db;
		this._tx = tx;
		this._tasks = [];
	}

	$.extend(SQLTransactionWrapper.prototype, {
		/**
		 * トランザクション処理中か判定します。
		 *
		 * @private
		 * @memberOf SQLTransactionWrapper
		 * @function
		 * @returns {Boolean} true:実行中 / false: 未実行
		 */
		_runTransaction: function() {
			return this._tx != null;
		},
		/**
		 * トランザクション処理中か判定し、未処理の場合はトランザクションの開始を、処理中の場合はSQLの実行を行います。
		 *
		 * @private
		 * @memberOf SQLTransactionWrapper
		 * @function
		 * @param {String|Function} param1 パラメータ1
		 * @param {String|Function} param2 パラメータ2
		 * @param {Function} param3 パラメータ3
		 */
		_execute: function(param1, param2, param3) {
			this._runTransaction() ? this._tx.executeSql(param1, param2, param3) : this._db
					.transaction(param1, param2, param3);
		},
		/**
		 * トランザクション内で実行中のDeferredオブジェクトを管理対象として追加します。
		 *
		 * @private
		 * @memberOf SQLTransactionWrapper
		 * @function
		 * @param {Deferred} df Deferredオブジェクト
		 */
		_addTask: function(df) {
			this._tasks.push({
				deferred: df,
				result: null
			});
		},
		/**
		 * SQLの実行結果を設定します。
		 *
		 * @private
		 * @memberOf SQLTransactionWrapper
		 * @function
		 * @param {Any} resul SQL実行結果
		 */
		_setResult: function(result) {
			this._tasks[this._tasks.length - 1].result = result;
		}
	});

	/**
	 * SELECT文とパラメータ配列を生成します。
	 */
	function createSelectStatementAndParameters(params, tableName, column, where, orderBy) {
		var statement = h5.u.str.format(SELECT_SQL_FORMAT, column, tableName);

		if ($.isPlainObject(where)) {
			var conditions = [];
			createConditionAndParameters(where, conditions, params);
			statement += (' WHERE ' + conditions.join(' AND '));
		} else if (typeof where === 'string') {
			statement += (' WHERE ' + where);
		}

		if ($.isArray(orderBy)) {
			statement += (' ORDER BY ' + orderBy.join(', '));
		}

		return statement;
	}

	/**
	 * 指定されたテーブルに対して、検索処理(SELECT)を行うクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().select()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Select
	 */
	function Select(txw, tableName, columns) {
		this._txw = txw;
		this._tableName = tableName;
		this._columns = $.isArray(columns) ? columns.join(', ') : '*';
		this._where = null;
		this._orderBy = null;
		this._statement = null;
		this._params = [];
		this._df = getDeferred();
		this._executed = false;
	}

	Select.prototype = new SqlExecutor();
	$.extend(Select.prototype, {
		/**
		 * WHERE句を設定します。
		 * <p>
		 * <b>条件は以下の方法で設定できます。</b><br>
		 * <ul>
		 * <li>オブジェクト</li>
		 * <li>文字列</li>
		 * </ul>
		 * <b>オブジェクト</b>の場合、キーに『<b>カラム名[半角スペース]オペレータ</b>』、バリューに<b>値</b>を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.select('USER', '*').where({
		 * 	'ID &gt;': 0,
		 * 	'ID &lt;=': 100
		 * })
		 * </pre>
		 *
		 * オペレータで使用可能な文字は以下の通りです。
		 * <ul>
		 * <li> &lt;=</li>
		 * <li> &lt;</li>
		 * <li> &gt;=</li>
		 * <li> &gt;</li>
		 * <li> =</li>
		 * <li> !=</li>
		 * <li> like (sqliteの仕様上大文字・小文字を区別しない)</li>
		 * </ul>
		 * 条件を複数指定した場合、全てAND句で結合されます。 AND句以外の条件で結合したい場合は<b>文字列</b>で条件を指定して下さい。
		 * <p>
		 * <b>エスケープ文字の指定方法</b><br>
		 * キーに『<b>カラム名[半角スペース]オペレータ[半角スペース]エスケープ文字</b>』のように指定します。 <br>
		 * エスケープ文字はクォートやダブルクォートで囲わず、エスケープ文字のみ指定して下さい。
		 * <p>
		 * 例. $をエスケープ文字として指定する場合
		 *
		 * <pre>
		 * db.select('USER', '*').where({
		 * 	'NAME like $': 'SUZUKI$'
		 * });
		 * </pre>
		 *
		 * <p>
		 * <b>文字列</b>の場合、SQLステートメントに追加するWHERE文を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.select('USER', '*').where('ID &gt;= 10 AND ID &lt;= 100');
		 * </pre>
		 *
		 * @function
		 * @memberOf Select
		 * @param {Object|String} whereObj 条件
		 * @returns {Select} Selectオブジェクト
		 */
		where: function(whereObj) {
			if (!$.isPlainObject(whereObj) && typeof whereObj !== 'string') {
				throw new throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Select', 'where']);
			}

			this._where = whereObj;
			return this;
		},
		/**
		 * ORDER BY句を設定します。
		 * <p>
		 * ソート対象のカラムが一つの場合は<b>文字列</b>、複数の場合は<b>配列</b>で指定します。
		 * <p>
		 * 例.IDを降順でソートする場合
		 *
		 * <pre>
		 * db.select('USER', '*').orderBy('ID DESC');
		 * </pre>
		 *
		 * 例.IDを降順、NAMEを昇順でソートする場合
		 *
		 * <pre>
		 * db.select('USER', '*').orderBy(['ID DESC', 'NAME ASC']);
		 * </pre>
		 *
		 * なお、複数の条件が指定されている場合、ソートは配列の先頭に指定されたカラムから順番に実行されます。
		 *
		 * @function
		 * @memberOf Select
		 * @param {Array|String} orderBy 条件
		 * @returns {Select} Selectオブジェクト
		 */
		orderBy: function(orderByObj) {
			if (!$.isPlainObject(orderByObj) && typeof orderByObj !== 'string') {
				throw new throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Select', 'orderBy']);
			}

			this._orderBy = wrapInArray(orderByObj);
			return this;
		},
		/**
		 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します。
		 * <p>
		 * 実行結果は、Promiseオブジェクトのprogress()に指定したコールバック関数または、done()に指定したコールバック関数に、<b>検索結果を保持するインスタンス</b>が返されます。
		 * <p>
		 * 検索結果へのアクセスは以下のように実行します。
		 *
		 * <pre>
		 *  db.insert('USER', {ID:10, NAME:'TANAKA'}).execute().done(function(rows) {
		 * 　rows.item(0).ID     // 検索にマッチした1件目のレコードのID
		 * 　rows.item(0).NAME   // 検索にマッチした1件目のレコードのNAME
		 *  });
		 * </pre>
		 *
		 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
		 *
		 * <pre>
		 *  db.select('PRODUCT', ['ID']).where({NAME: 'ball'}).execute().progress(function(rs, tx) {
		 * 　db.update('STOCK', {PRICE: 2000}, tx).where({ID: rs.item(0).ID}).execute();
		 *  });
		 * </pre>
		 *
		 * db.select().execute()で返ってきたトランザクションを、db.update()の第三引数に指定することで、db.selec()とdb.update()は同一トランザクションで実行されます。
		 *
		 * @function
		 * @memberOf Select
		 * @returns {Promise} Promiseオブジェクト
		 */
		execute: function() {
			var that = this;
			var build = function() {
				that._statement = createSelectStatementAndParameters(that._params, that._tableName,
						that._columns, that._where, that._orderBy);
			};
			var df = getDeferred();
			var txw = this._txw;
			var executed = this._executed;
			var resultSet = null;

			if (txw._runTransaction()) {
				txw._addTask(df);
				build();
				checkSqlExecuted(executed);
				fwLogger.debug('Select: ' + this._statement);
				txw._execute(this._statement, this._params, function(innerTx, rs) {
					resultSet = rs.rows;
					txw._setResult(resultSet);
					df.notify(resultSet, txw);
				});
			} else {
				txw._execute(function(tx) {
					txw._addTask(df);
					build();
					checkSqlExecuted(executed);
					txw._tx = tx;
					fwLogger.debug('Select: ' + that._statement);
					tx.executeSql(that._statement, that._params, function(innerTx, rs) {
						resultSet = rs.rows;
						txw._setResult(resultSet);
						df.notify(resultSet, txw);
					});
				}, function(e) {
					transactionErrorCallback(txw, e);
				}, function() {
					transactionSuccessCallback(txw);
				});
			}

			this._executed = true;
			return df.promise();
		}
	});



	/**
	 * 指定されたテーブルに対して、登録処理(INSERT)を行うクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().insert()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Insert
	 */
	function Insert(txw, tableName, values) {
		this._txw = txw;
		this._tableName = tableName;
		this._values = values ? wrapInArray(values) : [];
		this._statement = [];
		this._params = [];
		this._df = getDeferred();
		this._executed = false;
	}

	Insert.prototype = new SqlExecutor();
	$.extend(Insert.prototype,
			{
				/**
				 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します。
				 * <p>
				 * 実行結果は、Promiseオブジェクトのprogress()に指定したコールバック関数または、done()に指定したコールバック関数に、<b>登録に成功したレコードのIDを持つ配列</b>が返されます。
				 * <p>
				 * 検索結果へのアクセスは以下のように実行します。
				 *
				 * <pre>
				 *  db.insert('USER', {ID:10, NAME:'TANAKA'}).execute().done(function(rows) {
				 * 　rows.item(0).ID     // 検索にマッチした1件目のレコードのID
				 * 　rows.item(0).NAME   // 検索にマッチした1件目のレコードのNAME
				 *  });
				 * </pre>
				 *
				 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
				 *
				 * <pre>
				 *  db.select('STOCK', {ID:10, NAME:'ballA'}).execute().progress(function(rs, tx) { // ※1
				 * 　db.insert('STOCK', {ID:11, NAME:'ballB'}, tx).execute(); // ※2
				 *  });
				 * </pre>
				 *
				 * ※1のprogress()で返ってきたトランザクション(tx)を、※2のinsert()の第三引数に指定することで、2つのdb.insert()は同一トランザクションで実行されます。
				 *
				 * @function
				 * @memberOf Insert
				 * @returns {Promise} Promiseオブジェクト
				 */
				execute: function() {
					var that = this;
					var build = function() {
						var valueObjs = that._values;

						if (valueObjs.length === 0) {
							that._statement.push(h5.u.str.format(INSERT_SQL_EMPTY_VALUES,
									that._tableName));
							that._params.push([]);
							return;
						}

						for ( var i = 0, len = valueObjs.length; i < len; i++) {
							var valueObj = valueObjs[i];

							if (!valueObj) {
								that._statement.push(h5.u.str.format(INSERT_SQL_EMPTY_VALUES,
										that._tableName));
								that._params.push([]);
							} else if ($.isPlainObject(valueObj)) {
								var values = [];
								var columns = [];
								var params = [];

								for ( var prop in valueObj) {
									if (!valueObj.hasOwnProperty(prop)) {
										continue;
									}
									values.push('?');
									columns.push(prop);
									params.push(valueObj[prop]);
								}

								that._statement.push(h5.u.str.format(INSERT_SQL_FORMAT,
										that._tableName, columns.join(', '), values.join(', ')));
								that._params.push(params);
							}
						}
					};
					var df = getDeferred();
					var txw = this._txw;
					var executed = this._executed;
					var resultSet = null;
					var insertRowIds = [];
					var index = 0;

					function executeSql() {
						if (that._statement.length === index) {
							resultSet = insertRowIds;
							txw._setResult(resultSet);
							df.notify(resultSet, txw);
							return;
						}

						fwLogger.debug('Insert: ' + that._statement[index]);
						txw._execute(that._statement[index], that._params[index], function(innerTx,
								rs) {
							index++;
							insertRowIds.push(rs.insertId);
							executeSql();
						});
					}

					if (txw._runTransaction()) {
						txw._addTask(df);
						build();
						checkSqlExecuted(executed);
						executeSql();
					} else {
						txw._execute(function(tx) {
							txw._addTask(df);
							build();
							checkSqlExecuted(executed);
							txw._tx = tx;
							executeSql();
						}, function(e) {
							transactionErrorCallback(txw, e);
						}, function() {
							transactionSuccessCallback(txw);
						});
					}

					this._executed = true;
					return df.promise();
				}
			});

	/**
	 * 指定されたテーブルに対して、更新処理(UPDATE)を行うクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().update()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Update
	 */
	function Update(txw, tableName, value) {
		this._txw = txw;
		this._tableName = tableName;
		this._value = value;
		this._where = null;
		this._statement = null;
		this._params = [];
		this._df = getDeferred();
		this._executed = false;
	}

	Update.prototype = new SqlExecutor();
	$.extend(Update.prototype, {
		/**
		 * WHERE句を設定します。
		 * <p>
		 * <b>条件は以下の方法で設定できます。</b><br>
		 * <ul>
		 * <li>オブジェク</li>
		 * <li>文字列</li>
		 * </ul>
		 * <b>オブジェクト</b>の場合、キーに『<b>カラム名[半角スペース]オペレータ</b>』、バリューに<b>値</b>を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.update('USER', {
		 * 	NAME: 'TANAKA'
		 * }).where({
		 * 	'ID &gt;': 0,
		 * 	'ID &lt;=': 100
		 * })
		 * </pre>
		 *
		 * オペレータで使用可能な文字は以下の通りです。
		 * <ul>
		 * <li> &lt;=</li>
		 * <li> &lt;</li>
		 * <li> &gt;=</li>
		 * <li> &gt;</li>
		 * <li> =</li>
		 * <li> !=</li>
		 * <li> like (sqliteの仕様上大文字・小文字を区別しない)</li>
		 * </ul>
		 * 条件を複数指定した場合、全てAND句で結合されます。 AND句以外の条件で結合したい場合は文字列で条件を指定して下さい。
		 * <p>
		 * <b>エスケープ文字の指定方法</b><br>
		 * キーに『<b>カラム名[半角スペース]オペレータ[半角スペース]エスケープ文字</b>』のように指定します。 <br>
		 * エスケープ文字はクォートやダブルクォートで囲わず、エスケープ文字のみ指定して下さい。
		 * <p>
		 * 例. $をエスケープ文字として指定する場合
		 *
		 * <pre>
		 * db.update('USER', {
		 * 	NAME: 'TANAKA'
		 * }).where({
		 * 	'NAME like $': 'SUZUKI$'
		 * });
		 * </pre>
		 *
		 * <p>
		 * <b>文字列</b>の場合、SQLステートメントに追加するWHERE文を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.update('USER').where('ID &gt;= 10 AND ID &lt;= 100')
		 * </pre>
		 *
		 * @function
		 * @memberOf Update
		 * @param {Object|String} whereObj 条件
		 * @returns {Update} Updateオブジェクト
		 */
		where: function(whereObj) {
			if (!$.isPlainObject(whereObj) && typeof whereObj !== 'string') {
				throw new throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Update', 'where']);
			}

			this._where = whereObj;
			return this;
		},
		/**
		 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します。
		 * <p>
		 * 実行結果は、Promiseオブジェクトのprogress()に指定したコールバック関数または、done()に指定したコールバック関数に、<b>更新されたレコードの件数</b>が返されます。
		 *
		 * <pre>
		 *  db.update('USER', {NAME:TANAKA}).where({ID:10}).execute().done(function(rowsAffected) {
		 *  　rowsAffected // 更新されたレコードの行数(Number型)
		 *  });
		 * </pre>
		 *
		 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
		 *
		 * <pre>
		 *  db.select('PRODUCT', ['ID']).where({NAME: 'ball'}).execute().progress(function(rs, tx) {
		 * 　db.update('STOCK', {PRICE: 2000}, tx).where({ID: rs.item(0).ID}).execute();
		 *  });
		 * </pre>
		 *
		 * db.select().execute()で返ってきたトランザクションを、db.update()の第三引数に指定することで、db.select()とdb.update()は同一トランザクションで実行されます。
		 *
		 * @function
		 * @memberOf Update
		 * @returns {Promise} Promiseオブジェクト
		 */
		execute: function() {
			var that = this;
			var build = function() {
				var whereObj = that._where;
				var valueObj = that._value;
				var columns = [];

				for ( var prop in valueObj) {
					if (!valueObj.hasOwnProperty(prop)) {
						continue;
					}
					columns.push(prop + ' = ?');
					that._params.push(valueObj[prop]);
				}

				that._statement = h5.u.str.format(UPDATE_SQL_FORMAT, that._tableName, columns
						.join(', '));

				if ($.isPlainObject(whereObj)) {
					var conditions = [];
					createConditionAndParameters(whereObj, conditions, that._params);
					that._statement += (' WHERE ' + conditions.join(' AND '));
				} else if (typeof whereObj === 'string') {
					that._statement += (' WHERE ' + whereObj);
				}
			};
			var df = getDeferred();
			var txw = this._txw;
			var executed = this._executed;
			var resultSet = null;

			if (txw._runTransaction()) {
				txw._addTask(df);
				build();
				checkSqlExecuted(executed);
				fwLogger.debug('Update: ' + this._statement);
				txw._execute(this._statement, this._params, function(innerTx, rs) {
					resultSet = rs.rowsAffected;
					txw._setResult(resultSet);
					df.notify(resultSet, txw);
				});
			} else {
				txw._execute(function(tx) {
					txw._addTask(df);
					build();
					checkSqlExecuted(executed);
					txw._tx = tx;
					fwLogger.debug('Update: ' + that._statement);
					tx.executeSql(that._statement, that._params, function(innerTx, rs) {
						resultSet = rs.rowsAffected;
						txw._setResult(resultSet);
						df.notify(resultSet, txw);
					});
				}, function(e) {
					transactionErrorCallback(txw, e);
				}, function() {
					transactionSuccessCallback(txw);
				});
			}

			this._executed = true;
			return df.promise();
		}
	});

	/**
	 * 指定されたテーブルに対して、削除処理(DELETE)を行うクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().del()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 * <p>
	 * <i>deleteは予約語なため、Delとしています。</i>
	 *
	 * @class
	 * @name Del
	 */
	function Del(txw, tableName) {
		this._txw = txw;
		this._tableName = tableName;
		this._where = null;
		this._statement = null;
		this._params = [];
		this._df = getDeferred();
		this._executed = false;
	}

	Del.prototype = new SqlExecutor();
	$.extend(Del.prototype, {
		/**
		 * WHERE句を設定します。
		 * <p>
		 * <b>条件は以下の方法で設定できます。</b><br>
		 * <ul>
		 * <li>オブジェクト</li>
		 * <li>文字列</li>
		 * </ul>
		 * <b>オブジェクト</b>の場合、キーに『<b>カラム名[半角スペース]オペレータ</b>』、バリューに<b>値</b>を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.delete('USER').where({'ID &gt;':0, 'ID &lt;=':100})
		 * </pre>
		 *
		 * オペレータで使用可能な文字は以下の通りです。
		 * <ul>
		 * <li> &lt;=</li>
		 * <li> &lt;</li>
		 * <li> &gt;=</li>
		 * <li> &gt;</li>
		 * <li> =</li>
		 * <li> !=</li>
		 * <li> like (sqliteの仕様上大文字・小文字を区別しない)</li>
		 * </ul>
		 * 条件を複数指定した場合、全てAND句で結合されます。 AND句以外の条件で結合したい場合は文字列で条件を指定して下さい。
		 * <p>
		 * <b>エスケープ文字の指定方法</b><br>
		 * キーに『<b>カラム名[半角スペース]オペレータ[半角スペース]エスケープ文字</b>』のように指定します。 <br>
		 * エスケープ文字はクォートやダブルクォートで囲わず、エスケープ文字のみ指定して下さい。
		 * <p>
		 * 例. $をエスケープ文字として指定する場合
		 *
		 * <pre>
		 * db.delete('USER').where({'NAME like $': 'SUZUKI$'});
		 * </pre>
		 *
		 * <p>
		 * <b>文字列</b>の場合、SQLステートメントに追加するWHERE文を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.delete('USER').where('ID &gt;= 10 AND ID &lt;= 100')
		 * </pre>
		 *
		 * @function
		 * @memberOf Del
		 * @param {Object|String} whereObj 条件
		 * @returns {Del} Delオブジェクト
		 */
		where: function(whereObj) {
			if (!$.isPlainObject(whereObj) && typeof whereObj !== 'string') {
				throw new throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Del', 'where']);
			}

			this._where = whereObj;
			return this;
		},
		/**
		 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します。
		 * <p>
		 * 実行結果は、Promiseオブジェクトのprogress()に指定したコールバック関数または、done()に指定したコールバック関数に、<b>削除されたレコードの件数</b>が返されます。
		 *
		 * <pre>
		 *  db.del('USER').where({ID:10}).execute().done(function(rowsAffected) {
		 *  　rowsAffected // 削除されたレコードの行数(Number型)
		 *  });
		 * </pre>
		 *
		 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
		 *
		 * <pre>
		 *  db.select('PRODUCT', ['ID']).where({NAME: 'ball'}).execute().progress(function(rs, tx) {
		 *  　db.del('STOCK', tx).where({ID: rs.item(0).ID}).execute();
		 *  });
		 * </pre>
		 *
		 * db.select().execute()で返ってきたトランザクションを、db.del()の第二引数に指定することで、db.select()とdb.del()は同一トランザクションで実行されます。
		 *
		 * @function
		 * @memberOf Del
		 * @returns {Promise} Promiseオブジェクト
		 */
		execute: function() {
			var that = this;
			var build = function() {
				var whereObj = that._where;

				that._statement = h5.u.str.format(DELETE_SQL_FORMAT, that._tableName);

				if ($.isPlainObject(whereObj)) {
					var conditions = [];
					createConditionAndParameters(whereObj, conditions, that._params);
					that._statement += (' WHERE ' + conditions.join(' AND '));
				} else if (typeof whereObj === 'string') {
					that._statement += (' WHERE ' + whereObj);
				}
			};
			var df = getDeferred();
			var txw = this._txw;
			var executed = this._executed;
			var resultSet = null;

			if (txw._runTransaction()) {
				txw._addTask(df);
				build();
				checkSqlExecuted(executed);
				fwLogger.debug('Del: ' + this._statement);
				txw._execute(this._statement, this._params, function(innerTx, rs) {
					resultSet = rs.rowsAffected;
					txw._setResult(resultSet);
					df.notify(resultSet, txw);
				});
			} else {
				txw._execute(function(tx) {
					txw._addTask(df);
					build();
					checkSqlExecuted(executed);
					txw._tx = tx;
					fwLogger.debug('Del: ' + that._statement);
					tx.executeSql(that._statement, that._params, function(innerTx, rs) {
						resultSet = rs.rowsAffected;
						txw._setResult(resultSet);
						df.notify(resultSet, txw);
					});
				}, function(e) {
					transactionErrorCallback(txw, e);
				}, function() {
					transactionSuccessCallback(txw);
				});
			}

			return df.promise();
		}
	});

	/**
	 * 指定されたSQLステートメントを実行するクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().sql()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Sql
	 */
	function Sql(txw, statement, params) {
		this._txw = txw;
		this._statement = statement;
		this._params = params || [];
		this._df = getDeferred();
		this._executed = false;
	}

	Sql.prototype = new SqlExecutor();
	$.extend(Sql.prototype, {
		/**
		 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します。
		 * <p>
		 * 実行結果は、戻り値であるPromiseオブジェクトのprogress()に指定したコールバック関数または、done()に指定したコールバック関数に、<b>実行結果を保持するオブジェクト</b>が返されます。
		 * <p>
		 * 実行結果オブジェクトは、以下のプロパティを持っています。<br>
		 * <table border="1">
		 * <tr>
		 * <td>プロパティ名</td>
		 * <td>説明</td>
		 * </tr>
		 * <tr>
		 * <td>rows</td>
		 * <td>検索(SELECT)を実行した場合、このプロパティに結果が格納されます。</td>
		 * </tr>
		 * <tr>
		 * <td>insertId</td>
		 * <td>登録(INSERT)を実行した場合、このプロパティに登録したレコードのIDが格納されます。</td>
		 * </tr>
		 * <tr>
		 * <td>rowsAffected</td>
		 * <td>削除(DELETE)や更新(UPDATE)した場合、このプロパティに変更のあったレコードの件数が格納されます。</td>
		 * </tr>
		 * </table>
		 * <p>
		 * 例.検索結果の取得
		 *
		 * <pre>
		 *  db.sql('SELECT * FROM USER').execute().done(function(rs) {
		 *  　rs.rows          // SQLResultSetRowList
		 *  　rs.insertId      // Number
		 *  　rs.rowsAffected  // Number
		 *  });
		 * </pre>
		 *
		 * <p>
		 * <b>SQLResultSetRowList</b>は、以下のプロパティを持っています。<br>
		 * <table border="1">
		 * <tr>
		 * <td>プロパティ名</td>
		 * <td>説明</td>
		 * </tr>
		 * <tr>
		 * <td>length</td>
		 * <td>検索にマッチしたレコードの件数</td>
		 * </tr>
		 * <tr>
		 * <td>rows</td>
		 * <td>検索結果</td>
		 * </tr>
		 * </table>
		 * <p>
		 * 例.検索結果の取得する
		 *
		 * <pre>
		 *  db.sql('SELECT ID, NAME FROM USER').execute().done(function(rs) {
		 * 　rs.rows.item(0).ID     // 検索にマッチした1件目のレコードのID
		 * 　rs.rows.item(0).NAME   // 検索にマッチした1件目のレコードのNAME
		 *  });
		 * </pre>
		 *
		 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
		 * <p>
		 * 例.同一トランザクションでdb.insert()とdb.sql()を実行する
		 *
		 * <pre>
		 *  db.select('PRODUCT', ['ID']).where({NAME: 'ball'}).execute().progress(function(rs, tx) {
		 * 　db.sql('UPDATE STOCK SET PRICE = 2000', tx).where({ID: rs.item(0).ID}).execute();
		 *  });
		 * </pre>
		 *
		 * db.select().execute()で返ってきたトランザクションを、db.sql()の第三引数に指定することで、db.select()とdb.sql()は同一トランザクションで実行されます。
		 *
		 * @function
		 * @memberOf Sql
		 * @returns {Promise} Promiseオブジェクト
		 */
		execute: function() {
			var df = getDeferred();
			var txw = this._txw;
			var executed = this._executed;
			var statement = this._statement;
			var params = this._params;
			var resultSet = null;

			if (txw._runTransaction()) {
				txw._addTask(df);
				checkSqlExecuted(executed);
				fwLogger.debug('Sql: ' + statement);
				txw._execute(statement, params, function(tx, rs) {
					resultSet = rs;
					txw._setResult(resultSet);
					df.notify(resultSet, txw);
				});
			} else {
				txw._execute(function(tx) {
					txw._addTask(df);
					checkSqlExecuted(executed);
					txw._tx = tx;
					fwLogger.debug('Sql: ' + statement);
					tx.executeSql(statement, params, function(innerTx, rs) {
						resultSet = rs;
						txw._setResult(resultSet);
						df.notify(resultSet, txw);
					});
				}, function(e) {
					transactionErrorCallback(txw, e);
				}, function() {
					transactionSuccessCallback(txw);
				});
			}

			this._executed = true;
			return df.promise();
		}
	});

	/**
	 * 指定された複数のSQLを同一トランザクションで実行するクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().transaction()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Transaction
	 */
	function Transaction(txw) {
		this._txw = txw;
		this._queue = [];
		this._df = getDeferred();
		this._executed = false;
	}

	Transaction.prototype = new SqlExecutor();
	$.extend(Transaction.prototype, {
		/**
		 * 1トランザクションで処理したいSQLをタスクに追加します。
		 * <p>
		 * このメソッドには、以下のクラスのインスタンスを追加することができます。
		 * <ul>
		 * <li><a href="Insert.html">Insert</a></li>
		 * <li><a href="Update.html">Update</a></li>
		 * <li><a href="Del.html">Del</a></li>
		 * <li><a href="Select.html">Select</a></li>
		 * <li><a href="Sql.html">Sql</a></li>
		 * </ul>
		 *
		 * @function
		 * @memberOf Transaction
		 * @param {Any} task Insert/Update/Del/Select/Sqlクラスのインスタンス
		 * @return {Transaction} Transactionオブジェクト
		 */
		add: function(task) {
			if (!(task instanceof SqlExecutor)) {
				throw new throwFwError(ERR_CODE_INVALID_TRANSACTION_TARGET);
			}
			this._queue.push(task);
			return this;
		},
		/**
		 * add()で追加された順にSQLを実行します。
		 * <p>
		 * 実行結果は、戻り値であるPromiseオブジェクトのprogress()に指定したコールバック関数、またはdone()に指定したコールバック関数に返されます。
		 *
		 * <pre>
		 *  db.transaction()
		 *   .add(db.insert('USER', {ID:10, NAME:TANAKA}))
		 *   .add(db.insert('USER', {ID:11, NAME:YOSHIDA}))
		 *   .add(db.insert('USER', {ID:12, NAME:SUZUKI})).execute().done(function(rs) {
		 *  　rs // 第一引数: 実行結果
		 *  });
		 * </pre>
		 *
		 * 実行結果は<b>配列(Array)</b>で返され、結果の格納順序は、<b>add()で追加した順序</b>に依存します。<br>
		 * 上記例の場合、3件 db.insert()をadd()で追加しているので、実行結果rsには3つのROWIDが格納されています。( [1, 2, 3]のような構造になっている )
		 * <p>
		 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
		 *
		 * <pre>
		 *  db.select('PRODUCT', ['ID']).where({NAME: 'ball'}).execute().progress(function(rs, tx) {
		 * 　db.transaction(tx)
		 * 　　.add(db.update('UPDATE STOCK SET PRICE = 2000').where({ID: rs.item(0).ID}))
		 * 　　.execute();
		 *  });
		 * </pre>
		 *
		 * select().execute()で返ってきたトランザクションを、db.transaction()の引数に指定することで、db.select()とdb.transaction()は同一トランザクションで実行されます。
		 *
		 * @function
		 * @memberOf Transaction
		 * @returns {Promise} Promiseオブジェクト
		 */
		execute: function() {
			var df = this._df;
			var txw = this._txw;
			var queue = this._queue;
			var executed = this._executed;
			var index = 0;
			var tasks = null;

			function createTransactionTask(txObj) {
				function TransactionTask(tx) {
					this._txw = new SQLTransactionWrapper(null, tx);
				}

				var ret = [];

				for ( var i = 0, len = queue.length; i < len; i++) {
					TransactionTask.prototype = queue[i];
					ret.push(new TransactionTask(txObj));
				}

				return ret;
			}

			function executeSql() {
				if (tasks.length === index) {
					var results = [];

					for ( var j = 0, len = tasks.length; j < len; j++) {
						var result = tasks[j]._txw._tasks;
						results.push(result[0].result);
					}

					txw._setResult(results);
					df.notify(results, txw);
					return;
				}

				tasks[index].execute().progress(function(rs, innerTx) {
					index++;
					executeSql();
				});
			}

			if (txw._runTransaction()) {
				txw._addTask(df);
				checkSqlExecuted(executed);
				tasks = createTransactionTask(txw._tx);
				executeSql();
			} else {
				txw._execute(function(tx) {
					txw._addTask(df);
					checkSqlExecuted(executed);
					tasks = createTransactionTask(tx);
					txw._tx = tx;
					executeSql();
				}, function(e) {
					transactionErrorCallback(txw, e);
				}, function() {
					transactionSuccessCallback(txw);
				});
			}

			this._executed = true;
			return df.promise();
		},
		promise: function() {
			return this._df.promise();
		}
	});

	/**
	 * Database拡張クラス
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name DatabaseWrapper
	 * @param {Database} db openDatabase()が返すネイティブのDatabaseオブジェクト
	 */
	function DatabaseWrapper(db) {
		this._db = db;
	}

	$.extend(DatabaseWrapper.prototype, {
		/**
		 * 指定されたテーブルに対して、検索処理(SELECT)を行うためのオブジェクトを生成します。
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} tableName テーブル名
		 * @param {Array} columns カラム
		 * @param {SQLTransactionWrapper} [txw] トランザクション
		 * @returns {Select} SELECTオブジェクト
		 */
		select: function(tableName, columns, txw) {
			checkTableName('select', tableName);
			checkTransaction('select', txw);

			if (!$.isArray(columns) && columns !== '*') {
				throw new throwFwError(ERR_CODE_INVALID_COLUMN_NAME, 'select');
			}

			return new Select(txw ? txw : new SQLTransactionWrapper(this._db, null), tableName,
					columns);
		},
		/**
		 * 指定されたテーブルに対して、登録処理(INSERT)を行うためのオブジェクトを生成します。
		 * <p>
		 * <b>第二引数valuesの指定方法</b>
		 * <p>
		 * 1テーブルに1件INSERTを行う場合は<b>オブジェクト</b>で値を指定します。また、1テーブルに複数件INSERTを行う場合は<b>配列</b>で値を指定します。<br>
		 * <p>
		 * オブジェクトで指定する場合、シンタックスは以下のようになります。
		 *
		 * <pre>
		 * {カラム名:登録する値, ...}
		 * </pre>
		 *
		 * <p>
		 * 例.USERテーブルに、1件レコードをINSERTする。
		 *
		 * <pre>
		 * db.insert('USER', {
		 * 	ID: 10,
		 * 	NAME: 'TANAKA'
		 * }).execute();
		 * </pre>
		 *
		 * <p>
		 * 配列で指定する場合、シンタックスは以下のようになります。
		 *
		 * <pre>
		 * [{カラム名:登録する値, ...}, {カラム名:登録する値, ...}, ...]
		 * </pre>
		 *
		 * <p>
		 * 例.USERテーブルに、3件レコードをINSERTする。
		 *
		 * <pre>
		 * db.insert('USER', [{
		 * 	ID: 1,
		 * 	NAME: 'TANAKA'
		 * }, {
		 * 	ID: 2,
		 * 	NAME: 'YAMADA'
		 * }, {
		 * 	ID: 3,
		 * 	NAME: 'SUZUKI'
		 * }]).execute();
		 * </pre>
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} tableName テーブル名
		 * @param {Object|Array} values 値(登録情報を保持するオブジェクトまたは、登録情報のオブジェクトを複数保持する配列)
		 * @param {SQLTransactionWrapper} [txw] トランザクション
		 * @returns {Insert} INSERTオブジェクト
		 */
		insert: function(tableName, values, txw) {
			checkTableName('insert', tableName);
			checkTransaction('insert', txw);

			if (values && !$.isArray(values) && !$.isPlainObject(values)) {
				throw new throwFwError(ERR_CODE_INVALID_VALUES, 'insert');
			}

			return new Insert(txw ? txw : new SQLTransactionWrapper(this._db, null), tableName,
					values);
		},
		/**
		 * 指定されたテーブルに対して、更新処理(UPDATE)を行うためのオブジェクトを生成します。
		 * <p>
		 * <b>第二引数valuesの指定方法</b>
		 * <p>
		 * オブジェクトリテラルで以下のように指定します。
		 *
		 * <pre>
		 * {
		 * 	カラム名: 更新後の値
		 * }
		 * </pre>
		 *
		 * <p>
		 * 例.USERテーブルのNAMEカラムを"TANAKA"に更新する。
		 *
		 * <pre>
		 * db.update('USER', {
		 * 	NAME: 'TANAKA'
		 * }).excute();
		 * </pre>
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} tableName テーブル名
		 * @param {Object} values カラム
		 * @param {SQLTransactionWrapper} [txw] トランザクション
		 * @returns {Update} Updateオブジェクト
		 */
		update: function(tableName, values, txw) {
			checkTableName('update', tableName);
			checkTransaction('update', txw);

			if (!$.isPlainObject(values)) {
				throw new throwFwError(ERR_CODE_INVALID_VALUES, 'update');
			}

			return new Update(txw ? txw : new SQLTransactionWrapper(this._db, null), tableName,
					values);
		},
		/**
		 * 指定されたテーブルに対して、削除処理(DELETE)を行うためのオブジェクトを生成します。
		 * <p>
		 * <i>deleteは予約語なため、delとしています。</i>
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} tableName テーブル名
		 * @param {SQLTransactionWrapper} [txw] トランザクション
		 * @returns {Del} Delオブジェクト
		 */
		del: function(tableName, txw) {
			checkTableName('del', tableName);
			checkTransaction('del', txw);

			return new Del(txw ? txw : new SQLTransactionWrapper(this._db, null), tableName);
		},
		/**
		 * 指定されたステートメントとパラメータから、SQLを実行するためのオブジェクトを生成します。
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} statement SQLステートメント
		 * @param {Array} parameters パラメータ
		 * @param {SQLTransactionWrapper} [txw] トランザクション
		 * @returns {Sql} Sqlオブジェクト
		 */
		sql: function(statement, parameters, txw) {
			checkTransaction('sql', txw);

			if (typeof statement !== 'string') {
				throw new throwFwError(ERR_CODE_INVALID_STATEMENT, 'sql');
			}

			if (parameters && !$.isArray(parameters)) {
				throw new throwFwError(ERR_CODE_TYPE_NOT_ARRAY, 'sql');
			}

			return new Sql(txw ? txw : new SQLTransactionWrapper(this._db, null), statement,
					parameters);
		},
		/**
		 * 指定された複数のSQLを同一トランザクションで実行するためのオブジェクトを生成します。
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} statement テーブル名
		 * @param {Array} parameters パラメータ
		 * @returns {Transaction} Transactionオブジェクト
		 */
		transaction: function(txw) {
			checkTransaction('sql', txw);
			return new Transaction(txw ? txw : new SQLTransactionWrapper(this._db, null));
		}
	});

	function WebSqlDatabase() {
	// 空コンストラクタ
	}

	/**
	 * Web SQL Database
	 *
	 * @memberOf h5.api
	 * @name sqldb
	 * @namespace
	 */
	$.extend(WebSqlDatabase.prototype, {
		/**
		 * Web SQL Databaseが使用可能であるかの判定結果
		 *
		 * @memberOf h5.api.sqldb
		 * @name isSupported
		 * @type Boolean
		 */
		isSupported: !!window.openDatabase,
		/**
		 * データベースに接続します。
		 *
		 * @memberOf h5.api.sqldb
		 * @name open
		 * @function
		 * @param {String} name データベース名
		 * @param {String} [version] バージョン
		 * @param {String} [displayName] 表示用データベース名
		 * @param {Number} [estimatedSize] 見込み容量(バイト)
		 * @returns {DatabaseWrapper} Databaseオブジェクト
		 */
		open: function(name, version, displayName, estimatedSize) {
			if (!this.isSupported) {
				return;
			}

			var conn = openDatabase(name, version, displayName, estimatedSize);
			return new DatabaseWrapper(conn);
		}
	});

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5.api', {
		sqldb: new WebSqlDatabase()
	});
})();