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
/* ------ h5.api.sqldb ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

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
	/** エラーコード: where句に指定されたカラム名が不正 */
	var ERR_CODE_INVALID_COLUMN_NAME_IN_WHERE = 3011;

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.api.sqldb');

	/* del begin */
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
	errMsgMap[ERR_CODE_INVALID_COLUMN_NAME_IN_WHERE] = 'where句に指定されたカラム名が空白または空文字です。';
	addFwErrorCodeMap(errMsgMap);

	//SQLExceptionの例外メッセージ定義。dev版のみ出力される。
	//typeof SQLExceptionは、Android2-4, iOS4はundefined、iOS5-6はobject、PCのChrome26はfunctionになる。
	//このため、定数が定義されている環境でのみメッセージを出力することとする。
	var SQL_ERR_DATABASE = 'データベースエラー';
	var SQL_ERR_CONSTRAINT = '一意制約に反しています。';
	var SQL_ERR_QUOTA = '空き容量が不足しています。';
	var SQL_ERR_SYNTAX = '構文に誤りがあります。';
	var SQL_ERR_TIMEOUT = 'ロック要求がタイムアウトしました。';
	var SQL_ERR_TOO_LARGE = '取得結果の行が多すぎます。';
	var SQL_ERR_VERSION = 'データベースのバージョンが一致しません。';
	var SQL_ERR_UNKNOWN = 'トランザクション内で不明なエラーが発生、または例外がスローされました。';

	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	var getDeferred = h5.async.deferred;
	var format = h5.u.str.format;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	/**
	 * SQLExceptionのエラーコードに対応するメッセージを取得します。
	 */
	function getTransactionErrorMsg(e) {
		var msg = 'SQLDB ERROR';

		/* del begin */
		if (e.DATABASE_ERR !== 'undefined') {
			//OperaやAndroid4系等、SQLExceptionがグローバルに公開されておらず
			//エラーオブジェクトを生成しないと定数が見えない環境があるので
			//実行時に定数の有無を判定してメッセージを入れる。
			//Android2、iOS4等実行時にも定数が存在しない場合はdev版でも汎用メッセージになる。
			//注：Android2、iOS4は実際にエラーが発生した時codeが必ず1になる
			switch (e.code) {
			case e.DATABASE_ERR:
				msg = SQL_ERR_DATABASE;
				break;
			case e.CONSTRAINT_ERR:
				msg = SQL_ERR_CONSTRAINT;
				break;
			case e.QUOTA_ERR:
				msg = SQL_ERR_QUOTA;
				break;
			case e.SYNTAX_ERR:
				msg = SQL_ERR_SYNTAX;
				break;
			case e.TIMEOUT_ERR:
				msg = SQL_ERR_TIMEOUT;
				break;
			case e.TOO_LARGE_ERR:
				msg = SQL_ERR_TOO_LARGE;
				break;
			case e.VERSION_ERR:
				msg = SQL_ERR_VERSION;
				break;
			case e.UNKNOWN_ERR:
				msg = SQL_ERR_UNKNOWN;
				break;
			}
		}
		/* del end */

		return msg + '(code=' + e.code + ')';
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
	function transactionErrorCallback(tasks, e) {
		for ( var i = tasks.length - 1; i >= 0; i--) {
			var result = tasks[i];
			var msgParam = getTransactionErrorMsg(e);
			result.deferred.reject(createRejectReason(ERR_CODE_TRANSACTION_PROCESSING_FAILURE, [
					msgParam, e.message], e));
		}
	}

	/**
	 * トランザクション完了時に実行する共通処理
	 */
	function transactionSuccessCallback(tasks) {
		for ( var i = tasks.length - 1; i >= 0; i--) {
			var result = tasks[i];
			result.deferred.resolve(result.result);
		}
	}

	/**
	 * 既にexecuteSql()の実行が完了した、またはexecute()が実行中の場合はエラーをスローします
	 */
	function executeCalled(recentTask) {
		if (!recentTask) {
			return;
		}

		var dfd = recentTask.deferred;

		if (isRejected(dfd) || isResolved(dfd) || !recentTask.result) {
			throwFwError(ERR_CODE_RETRY_SQL);
		}
	}

	/**
	 * DatabaseWrapper.select()/insert()/update()/del() のパラメータチェック
	 * <p>
	 * tableNameが未指定またはString型以外の型の値が指定された場合、例外をスローします。
	 */
	function validTableName(funcName, tableName) {
		if (!isString(tableName)) {
			throwFwError(ERR_CODE_INVALID_TABLE_NAME, funcName);
		}
	}

	/**
	 * DatabaseWrapper.select()/insert()/update()/del()/sql()/transaction() のパラメータチェック
	 * <p>
	 * txeがTransactionalExecutor型ではない場合、例外をスローします。<br>
	 * null,undefinedの場合は例外をスローしません。
	 */
	function isTransactionalExecutor(funcName, txe) {
		if (txe != undefined && !(txe instanceof TransactionalExecutor)) {
			throwFwError(ERR_CODE_INVALID_TRANSACTION_TYPE, funcName);
		}
	}

	/**
	 * 条件を保持するオブジェクトから、SQLのプレースホルダを含むWHERE文とパラメータの配列を生成します
	 */
	function setConditionAndParameters(whereObj, conditions, parameters) {
		if ($.isPlainObject(whereObj)) {
			for ( var prop in whereObj) {
				var params = $.trim(prop).replace(/ +/g, ' ').split(' ');
				var param = [];

				if (params[0] === "") {
					throwFwError(ERR_CODE_INVALID_COLUMN_NAME_IN_WHERE);
				} else if (params.length === 1) {
					param.push(params[0]);
					param.push('=');
					param.push('?');
				} else if (!/^(<=|<|>=|>|=|!=|like)$/i.test(params[1])) {
					throwFwError(ERR_CODE_INVALID_OPERATOR);
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
	 * Web SQL Databaseクラス
	 *
	 * @class
	 * @name WebSqlDatabase
	 */
	function WebSqlDatabase() {
	// 空コンストラクタ
	}

	/**
	 * Statementクラス
	 * <p>
	 * このクラスを継承しているクラスはTransactionalExecutor.add()で追加できる。
	 *
	 * @class
	 * @name Statement
	 */
	function Statement() {
		/**
		 * 1インスタンスで複数のステートメントを実行するか判定するフラグ このフラグがtrueの場合、execute()の実行結果を配列で返します
		 */
		this._multiple = false;
	}

	$.extend(Statement.prototype, {
		/**
		 * SQL文を実行します
		 */
		execute: function() {
			return this._executor.add(this)._execute(function(results) {
				return results[0]; // 配列に包まれていない実行結果を返す
			});
		}
	});

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	/**
	 * SQLTransaction管理・実行クラス
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().transaction()</b>を呼び出した場合と、
	 * Insert/Select/Update/Del/Sqlオブジェクトのexecute()が返すPromiseオブジェクトの、progressコールバックの引数に存在します。
	 * <p>
	 * ver1.1.7までは<b>Transaction</b>クラスと<b>TransactionWrapper</b>クラスが別々に存在していましたが、 ver1.1.8からは<b>TransactionalExecutor</b>クラスに統合されました。
	 * <p>
	 * 本クラスに存在する<b>execute()</b>と<b>add()</b>の使用方法は、Transactionクラスのexecute()とadd()と同じです。
	 *
	 * @class
	 * @name TransactionalExecutor
	 */
	function TransactionalExecutor(db) {
		this._db = db;
		this._df = getDeferred();
		this._tx = null;
		this._tasks = [];
		this._queue = [];
	}

	$.extend(TransactionalExecutor.prototype, {
		/**
		 * トランザクション処理中か判定します
		 *
		 * @private
		 * @memberOf TransactionalExecutor
		 * @function
		 * @returns {Boolean} true:実行中 / false: 未実行
		 */
		_runTransaction: function() {
			return this._tx != null;
		},
		/**
		 * トランザクション内で実行中のDeferredオブジェクトを管理対象として追加します。
		 *
		 * @private
		 * @memberOf TransactionalExecutor
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
		 * SQLの実行結果を設定します
		 *
		 * @private
		 * @memberOf TransactionalExecutor
		 * @function
		 * @param {Any} resul SQL実行結果
		 */
		_setResult: function(result) {
			this._getRecentTask().result = result;
		},
		/**
		 * 現在実行中のタスク情報を取得します
		 *
		 * @private
		 * @memberOf TransactionalExecutor
		 * @function
		 * @return {Any} タスク
		 */
		_getRecentTask: function() {
			return this._tasks[this._tasks.length - 1];
		},
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
		 * @memberOf TransactionalExecutor
		 * @param {Insert|Update|Del|Select|Sql} statement Statementクラスのインスタンス
		 * @return {TransactionalExecutor} Transactionオブジェクト
		 */
		add: function(statement) {
			if (!(statement instanceof Statement)) {
				throwFwError(ERR_CODE_INVALID_TRANSACTION_TARGET);
			}

			var recentTask = this._getRecentTask();

			// execute()実行中はadd()できない
			if (!recentTask || recentTask.result) {
				this._queue.push(statement);
			}

			return this;
		},
		/**
		 * SQLを実行します
		 *
		 * @private
		 * @function
		 * @memberOf TransactionalExecutor
		 * @param {Function(Array)} completeCallback SQLの実行が全て完了し、notifyが呼ばれる直前に実行されるコールバック関数
		 * @return {TransactionalExecutor} TransactionalExecutorオブジェクト
		 */
		_execute: function(completeCallback) {
			var that = this;
			var df = this._df;
			var queue = this._queue;
			var results = [];

			function executeSql() {
				if (queue.length === 0) {
					var ret = completeCallback(results);
					that._setResult.apply(that, [ret]);
					df.notify(ret, that);
					return;
				}

				var statementObj = queue.shift();
				var statements = statementObj._statements;
				var parameters = statementObj._parameters;
				var p = getDeferred().resolve().promise();
				var ret = [];

				for ( var i = 0, iLen = statements.length; i < iLen; i++) {
					(function(statement, parameter) {
						fwLogger.debug(wrapInArray(statement), wrapInArray(parameter));

						p = thenCompat(p, function() {
							var thenDf = getDeferred();

							that._tx.executeSql(statement, parameter, function(innerTx, rs) {
								ret.push(statementObj._onComplete(rs));
								thenDf.resolve();
							});

							return thenDf.promise();
						});

					})(statements[i], parameters[i]);
				}

				thenCompat(p, function() {
					// _multipleフラグがtrueの場合は実行結果を配列として返す
					var unwrapedRet = statementObj._multiple ? ret : ret[0];
					results.push(unwrapedRet);
					executeSql();
				});
			}

			try {
				executeCalled(this._getRecentTask());
				this._addTask(df);

				// トランザクション内で_buildStatementAndParameters()を実行すると、
				// SQL構文エラーがクライアントに返せないため、ここでステートメントとパラメータを生成する
				for ( var j = 0, jLen = queue.length; j < jLen; j++) {
					queue[j]._buildStatementAndParameters();
				}

				if (this._runTransaction()) {
					executeSql();
				} else {
					this._db.transaction(function(tx) {
						that._tx = tx;
						executeSql();
					}, function(e) {
						that._tx = null;
						transactionErrorCallback(that._tasks, e);
					}, function() {
						that._tx = null;
						transactionSuccessCallback(that._tasks);
					});
				}
			} catch (e) {
				df.reject(e);
			}

			this._df = getDeferred();
			return df.promise();
		},
		/**
		 * add()で追加された順にSQLを実行します
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
		 * <p>
		 * <h5>ver1.1.8からの変更点</h5>
		 * execute()が返すPromiseオブジェクトのprogressコールバックの第二引数(<b>TransactionalExecutor</b>インスタンス)に、
		 * Select/Insert/Del/Update/Sqlインスタンスをaddすることができるようになりました。
		 * <p>
		 * 下記のサンプルコードは、Statementインスタンスをtx.add()することにより、db.select()と同一トランザクションでSQLを実行しています。
		 *
		 * <pre>
		 *  db.transaction().add(db.select('PRODUCT', ['ID']).where({NAME: 'ballA'})).execute().progress(function(rsArray, tx) {
		 * 　　tx.add(db.sql(' STOCK', {COUNT:20}).where({ID: rsArray[0].item(0).ID})).execute();
		 *  });
		 * </pre>
		 *
		 * @function
		 * @memberOf TransactionalExecutor
		 * @returns {Promise} Promiseオブジェクト
		 */
		execute: function() {
			return this._execute(function(results) {
				// add()されたStatementの数に関係なく、結果は配列に包んで返す
				return results;
			});
		},
		/**
		 * SQLの実行結果を受け取ることができる、Promiseオブジェクトを取得します
		 *
		 * @function
		 * @memberOf TransactionalExecutor
		 * @returns {Promise} Promiseオブジェクト
		 */
		promise: function() {
			return this._df.promise();
		}
	});

	/**
	 * 指定されたテーブルに対して、検索処理(SELECT)を行うクラス
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().select()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Select
	 */
	function Select(executor, tableName, columns) {
		this._statements = [];
		this._parameters = [];
		this._executor = executor;
		this._tableName = tableName;
		this._columns = $.isArray(columns) ? columns.join(', ') : '*';
		this._where = null;
		this._orderBy = null;
	}

	Select.prototype = new Statement();
	$.extend(Select.prototype, {
		/**
		 * WHERE句を設定します
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
			if (!$.isPlainObject(whereObj) && !isString(whereObj)) {
				throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Select', 'where']);
			}

			this._where = whereObj;
			return this;
		},
		/**
		 * ORDER BY句を設定します
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
			if (!$.isPlainObject(orderByObj) && !isString(orderByObj)) {
				throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Select', 'orderBy']);
			}

			this._orderBy = wrapInArray(orderByObj);
			return this;
		},
		/**
		 * SQLの構文とパラメータを生成します
		 *
		 * @private
		 * @function
		 * @memberOf Select
		 */
		_buildStatementAndParameters: function() {
			var statement = '';
			var where = this._where;

			statement = format(SELECT_SQL_FORMAT, this._columns, this._tableName);

			if ($.isPlainObject(where)) {
				var conditions = [];
				setConditionAndParameters(where, conditions, this._parameters);
				statement += (' WHERE ' + conditions.join(' AND '));
			} else if (isString(where)) {
				statement += (' WHERE ' + where);
			}

			if ($.isArray(this._orderBy)) {
				statement += (' ORDER BY ' + this._orderBy.join(', '));
			}

			this._statements.push([statement]);
			this._parameters = [this._parameters];
		},
		/**
		 * executeSql成功時の処理を実行します
		 *
		 * @private
		 * @function
		 * @memberOf Select
		 * @param {ResultSet} rs SQL実行結果
		 * @return {Any} クライアントが取得するSQL実行結果
		 */
		_onComplete: function(rs) {
			return rs.rows;
		}
	});


	/**
	 * 指定されたテーブルに対して、登録処理(INSERT)を行うクラス
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().insert()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Insert
	 */
	function Insert(executor, tableName, values) {
		this._statements = [];
		this._parameters = [];
		this._executor = executor;
		this._tableName = tableName;
		this._values = values ? wrapInArray(values) : [];
		this._df = getDeferred();
		// 1インスタンスで複数のSQLを実行するのでフラグを立てる
		this._multiple = true;
	}

	Insert.prototype = new Statement();
	$.extend(Insert.prototype, {
		/**
		 * SQLの構文とパラメータを生成します
		 *
		 * @private
		 * @function
		 * @memberOf Insert
		 */
		_buildStatementAndParameters: function() {
			var values = this._values;
			var statements = this._statements;
			var parameters = this._parameters;

			if (values.length === 0) {
				statements.push(format(INSERT_SQL_EMPTY_VALUES, this._tableName));
				parameters.push([]);
				return;
			}

			for ( var i = 0, len = values.length; i < len; i++) {
				var valueObj = values[i];

				if (valueObj == null) {
					statements.push(format(INSERT_SQL_EMPTY_VALUES, this._tableName));
					parameters.push([]);
				} else if ($.isPlainObject(valueObj)) {
					var value = [];
					var column = [];
					var param = [];

					for ( var prop in valueObj) {
						value.push('?');
						column.push(prop);
						param.push(valueObj[prop]);
					}

					statements.push(format(INSERT_SQL_FORMAT, this._tableName, column.join(', '),
							value.join(', ')));
					parameters.push(param);
				}
			}
		},
		/**
		 * executeSql成功時の処理を実行します
		 *
		 * @private
		 * @function
		 * @memberOf Insert
		 * @param {ResultSet} rs SQL実行結果
		 * @return {Any} クライアントが取得するSQL実行結果
		 */
		_onComplete: function(rs) {
			return rs.insertId;
		}
	});

	/**
	 * 指定されたテーブルに対して、更新処理(UPDATE)を行うクラス
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().update()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Update
	 */
	function Update(executor, tableName, values) {
		this._statements = [];
		this._parameters = [];
		this._executor = executor;
		this._tableName = tableName;
		this._values = values;
		this._where = null;
	}

	Update.prototype = new Statement();
	$.extend(Update.prototype, {
		/**
		 * WHERE句を設定します
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
			if (!$.isPlainObject(whereObj) && !isString(whereObj)) {
				throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Update', 'where']);
			}

			this._where = whereObj;
			return this;
		},
		/**
		 * SQLの構文とパラメータを生成します
		 *
		 * @private
		 * @function
		 * @memberOf Update
		 */
		_buildStatementAndParameters: function() {
			var statement = '';
			var where = this._where;
			var values = this._values;
			var columns = [];

			for ( var prop in values) {
				columns.push(prop + ' = ?');
				this._parameters.push(values[prop]);
			}

			statement = format(UPDATE_SQL_FORMAT, this._tableName, columns.join(', '));

			if ($.isPlainObject(where)) {
				var conditions = [];
				setConditionAndParameters(where, conditions, this._parameters);
				statement += (' WHERE ' + conditions.join(' AND '));
			} else if (isString(where)) {
				statement += (' WHERE ' + where);
			}

			this._statements.push([statement]);
			this._parameters = [this._parameters];
		},
		/**
		 * executeSql成功時の処理を実行します
		 *
		 * @private
		 * @function
		 * @memberOf Update
		 * @param {ResultSet} rs SQL実行結果
		 * @return {Any} クライアントが取得するSQL実行結果
		 */
		_onComplete: function(rs) {
			return rs.rowsAffected;
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
	function Del(executor, tableName) {
		this._statements = [];
		this._parameters = [];
		this._executor = executor;
		this._tableName = tableName;
		this._where = null;
	}

	Del.prototype = new Statement();
	$.extend(Del.prototype, {
		/**
		 * WHERE句を設定します
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
			if (!$.isPlainObject(whereObj) && !isString(whereObj)) {
				throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Del', 'where']);
			}

			this._where = whereObj;
			return this;
		},
		/**
		 * SQLの構文とパラメータを生成します
		 *
		 * @private
		 * @function
		 * @memberOf Del
		 */
		_buildStatementAndParameters: function() {
			var statement = '';
			var where = this._where;

			statement = format(DELETE_SQL_FORMAT, this._tableName);

			if ($.isPlainObject(where)) {
				var conditions = [];
				setConditionAndParameters(where, conditions, this._parameters);
				statement += (' WHERE ' + conditions.join(' AND '));
			} else if (isString(where)) {
				statement += (' WHERE ' + where);
			}

			this._statements.push([statement]);
			this._parameters = [this._parameters];
		},
		/**
		 * executeSql成功時の処理を実行します
		 *
		 * @private
		 * @function
		 * @memberOf Del
		 * @param {ResultSet} rs SQL実行結果
		 * @return {Any} クライアントが取得するSQL実行結果
		 */
		_onComplete: function(rs) {
			return rs.rowsAffected;
		}
	});

	/**
	 * 指定されたSQLステートメントを実行するクラス
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().sql()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Sql
	 */
	function Sql(executor, statement, params) {
		this._statements = [];
		this._parameters = [];
		this._executor = executor;
		this._statements.push(statement);
		this._parameters.push(params || []);
	}

	Sql.prototype = new Statement();
	$.extend(Sql.prototype, {
		/**
		 * SQLの構文とパラメータを生成します
		 *
		 * @private
		 * @function
		 * @memberOf Sql
		 */
		_buildStatementAndParameters: function() {
		// 既にコンストラクタで渡されているため何もしない
		},
		/**
		 * executeSql成功時の処理を実行します
		 *
		 * @private
		 * @function
		 * @memberOf Sql
		 * @param {ResultSet} rs SQL実行結果
		 * @return {Any} クライアントが取得するSQL実行結果
		 */
		_onComplete: function(rs) {
			return rs;
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
	 */
	/**
	 * @param {Database} db openDatabase()が返すネイティブのDatabaseオブジェクト
	 */
	function DatabaseWrapper(db) {
		this._db = db;
	}

	$.extend(DatabaseWrapper.prototype, {
		/**
		 * 指定されたテーブルに対して、検索処理(SELECT)を行うためのオブジェクトを生成します
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} tableName テーブル名
		 * @param {Array} columns カラム
		 * @param {TransactionalExecutor} [txe] TransactionalExecutorクラス
		 * @returns {Select} SELECTオブジェクト
		 */
		select: function(tableName, columns, txe) {
			validTableName('select', tableName);

			if (!$.isArray(columns) && columns !== '*') {
				throwFwError(ERR_CODE_INVALID_COLUMN_NAME, 'select');
			}

			return new Select(this.transaction(txe), tableName, columns);
		},
		/**
		 * 指定されたテーブルに対して、登録処理(INSERT)を行うためのオブジェクトを生成します
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
		 * @param {TransactionalExecutor} [txe] TransactionalExecutorクラス
		 * @returns {Insert} INSERTオブジェクト
		 */
		insert: function(tableName, values, txe) {
			validTableName('insert', tableName);

			if (values != null && !$.isArray(values) && !$.isPlainObject(values)) {
				throwFwError(ERR_CODE_INVALID_VALUES, 'insert');
			}

			return new Insert(this.transaction(txe), tableName, values);
		},
		/**
		 * 指定されたテーブルに対して、更新処理(UPDATE)を行うためのオブジェクトを生成します
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
		 * @param {TransactionalExecutor} [txe] TransactionalExecutorクラス
		 * @returns {Update} Updateオブジェクト
		 */
		update: function(tableName, values, txe) {
			validTableName('update', tableName);

			if (!$.isPlainObject(values)) {
				throwFwError(ERR_CODE_INVALID_VALUES, 'update');
			}

			return new Update(this.transaction(txe), tableName, values);
		},
		/**
		 * 指定されたテーブルに対して、削除処理(DELETE)を行うためのオブジェクトを生成します
		 * <p>
		 * <i>deleteは予約語なため、delとしています。</i>
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} tableName テーブル名
		 * @param {TransactionalExecutor} [txe] TransactionalExecutorクラス
		 * @returns {Del} Delオブジェクト
		 */
		del: function(tableName, txe) {
			validTableName('del', tableName);

			return new Del(this.transaction(txe), tableName);
		},
		/**
		 * 指定されたステートメントとパラメータから、SQLを実行するためのオブジェクトを生成します
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} statement SQLステートメント
		 * @param {Array} parameters パラメータ
		 * @param {TransactionalExecutor} [txe] TransactionalExecutorクラス
		 * @returns {Sql} Sqlオブジェクト
		 */
		sql: function(statement, parameters, txe) {
			if (!isString(statement)) {
				throwFwError(ERR_CODE_INVALID_STATEMENT, 'sql');
			}

			if (parameters != null && !$.isArray(parameters)) {
				throwFwError(ERR_CODE_TYPE_NOT_ARRAY, 'sql');
			}

			return new Sql(this.transaction(txe), statement, parameters);
		},
		/**
		 * 指定された複数のSQLを同一トランザクションで実行するためのオブジェクトを生成します
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {TransactionalExecutor} [txe] TransactionalExecutorクラス
		 * @returns {TransactionalExecutor} TransactionalExecutorオブジェクト
		 */
		transaction: function(txe) {
			isTransactionalExecutor('transaction', txe);
			return txe ? txe : new TransactionalExecutor(this._db);
		}
	});

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