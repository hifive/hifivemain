/*
 * Copyright (C) 2012-2013 NS Solutions Corporation
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

	// TODO テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.api.sqldb;

	var db = h5.api.sqldb.open('hcdb', '1', 'hcdb', 2 * 1024 * 1024);
	var TABLE_NAME = 'TBL_WEB_SQL_DB_TEST1';

	//=============================
	// Functions
	//=============================

	function isAbleToGetErrorCode() {
		// Android2系、iOS4の場合は、ネイティブのSQLErrorのcodeプロパティからエラーの種類を特定できないため
		// hifiveが包んだエラーオブジェクトのメッセージの内容もエラーの種類別に変えていない。
		// そのため、メッセージを比較するテストで、Android2系かどうかの判別が必要になる。
		return h5.env.ua.isAndroid && h5.env.ua.browserVersion === 2 || h5.env.ua.isiOS
				&& h5.env.ua.browserVersion === 4;
	}

	// テストメソッド実行毎に処理する関数 sql/insert/transaction/
	function setupFunc() {
		if (!h5.api.sqldb.isSupported) {
			return;
		}
		stop();

		db.sql('DROP TABLE IF EXISTS ' + TABLE_NAME).execute().done(
				function() {
					db.sql('CREATE TABLE ' + TABLE_NAME + ' (col1, col2, col3)').execute().done(
							function(rs, tx) {
								start();
							});
				}).fail(function(e) {
			throw (e);
			start();
		});
	}

	// テストメソッド実行毎に処理する関数 update/del
	function setupFunc2() {
		if (!h5.api.sqldb.isSupported) {
			return;
		}
		stop();
		db.sql('DROP TABLE IF EXISTS ' + TABLE_NAME).execute().done(
				function() {
					db.sql('CREATE TABLE ' + TABLE_NAME + ' (col1, col2, col3)').execute().done(
							function(rs, tx) {
								db.insert(TABLE_NAME, [{
									col1: 10,
									col2: 'hoge1',
									col3: 'test%%b'
								}, {
									col1: 20,
									col2: 'hoge2',
									col3: 'test%%a'
								}]).execute().done(function() {
									start();
								});
							});
				}).fail(function(e) {
			throw (e);
			start();
		});
	}

	function dropTable() {
		if (!h5.api.sqldb.isSupported) {
			return;
		}
		stop();

		db.sql('DROP TABLE IF EXISTS ' + TABLE_NAME).execute().always(function() {
			start();
		});
	}

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================

	module('[browser#ie:all|ie-wp:all|ff:all]H5Api - Web SQL Database - Sql', {
		setup: setupFunc,
		teardown: dropTable
	});

	//=============================
	// Body
	//=============================

	asyncTest('db.sql()を実行', 7, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.sql('insert into ' + TABLE_NAME + ' values(?, ?, ?)', [10, "hoge", 80.5]).execute()
				.done(function(rs) {
					strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
					strictEqual(rs.insertId, 1, '1件登録され、insertid=1を取得できること。');
					strictEqual(arguments.length, 1, '引数は1つあること。');
					start();
				}).progress(function(rs, tx) {
					strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
					strictEqual(rs.insertId, 1, '1件登録され、insertid=1を取得できること。');
					strictEqual(arguments.length, 2, '引数は2つあること。');
					ok(tx._db && tx._tx && tx._tasks, '第二引数はトランザクションであること。');
				}).fail(function(error) {
					ok(false, '登録失敗 message:' + error.message);
					start();
				});
	});

	test('クエリ文に文字列以外のものを指定するとエラーが発生すること', 6, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}

		var errorCode = ERR.ERR_CODE_INVALID_STATEMENT;
		try {
			db.sql(undefined, [10, "hoge", 80.5]);
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.sql(0, [10, "hoge", 80.5]);
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.sql(1, [10, "hoge", 80.5]);
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.sql(/a/, [10, "hoge", 80.5]);
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.sql(true, [10, "hoge", 80.5]);
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}

		try {
			db
					.sql(new String('insert into ' + TABLE_NAME + ' values(?, ?, ?)'), [10, "hoge",
							80.5]);
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});

	test('パラメータに配列とnull,undefined以外のものを指定するとエラーが発生すること', 6, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}

		var errorCode = ERR.ERR_CODE_TYPE_NOT_ARRAY;
		try {
			db.sql('insert into ' + TABLE_NAME + ' values(10, ?, 80.5)', "hoge");
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.sql('insert into ' + TABLE_NAME + ' values(?, ?, ?)', {
				col1: 10,
				col2: "hoge",
				col3: 80.5
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.sql('insert into ' + TABLE_NAME + ' values(?, ?, ?)', 0);
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.sql('insert into ' + TABLE_NAME + ' values(?, ?, ?)', 1);
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.sql('insert into ' + TABLE_NAME + ' values(?, ?, ?)', true);
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}

		try {
			db.sql('insert into ' + TABLE_NAME + ' values(?, ?, ?)', false);
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});

	asyncTest('db.sql()を実行後、別トランザクションで、db.sql()を実行', 8, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.sql('insert into ' + TABLE_NAME + ' values(?, ?, ?)', [10, "hoge1", 100]).execute()
				.done(
						function(rs) {
							strictEqual(seqNo++, 2, 'done1 2番目に実行されること。');
							strictEqual(rs.insertId, 1, '1件登録され、insertid=1を取得できること。');

							db.sql('insert into ' + TABLE_NAME + ' values(?, ?, ?)',
									[20, "hoge2", 200]).execute().done(function(rs) {
								strictEqual(seqNo++, 4, 'done2 4番目に実行されること。');
								strictEqual(rs.insertId, 2, '1件登録され、insertid=2を取得できること。');
								start();
							}).progress(function(rs2, tx2) {
								strictEqual(seqNo++, 3, 'progress2 3番目に実行されること。');
								strictEqual(rs.insertId, 1, '1件登録され、insertid=2を取得できること。');
							});
						}).progress(function(rs, tx) {
					strictEqual(seqNo++, 1, 'progress1 1番目に実行されること。');
					strictEqual(rs.insertId, 1, '1件登録され、insertid=1を取得できること。');
				}).fail(function(error) {
					ok(false, '登録失敗 message:' + error.message);
					start();
				});
	});

	asyncTest('db.sql()を実行後、同一トランザクションで、db.sql()を実行', 8, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.sql('insert into ' + TABLE_NAME + ' values(?, ?, ?)', [10, "hoge1", 100]).execute()
				.done(function(rs) {
					strictEqual(seqNo++, 4, 'done1 4番目に実行されること。');
					strictEqual(rs.insertId, 1, '1件登録され、insertid=1を取得できること。');

				}).progress(
						function(rs, tx) {
							strictEqual(seqNo++, 1, 'progress1 1番目に実行されること。');
							strictEqual(rs.insertId, 1, '1件登録され、insertid=1を取得できること。');

							db.sql('insert into ' + TABLE_NAME + ' values(?, ?, ?)',
									[20, "hoge2", 200], tx).execute().done(function(rs) {
								strictEqual(seqNo++, 3, 'done2 3番目に実行されること。');
								strictEqual(rs.insertId, 2, '1件登録され、insertid=2を取得できること。');
								start();
							}).progress(function(rs2, tx2) {
								strictEqual(seqNo++, 2, 'progress2 2番目に実行されること。');
								strictEqual(rs.insertId, 1, '1件登録され、insertid=2を取得できること。');
							});
						}).fail(function(error) {
					ok(false, '登録失敗 message:' + error.message);
					start();
				});
	});

	asyncTest('db.sql()を実行後、同一トランザクションで、エラーのdb.sql()を実行', 11, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;
		var errCode = ERR.ERR_CODE_TRANSACTION_PROCESSING_FAILURE;

		db.sql('insert into ' + TABLE_NAME + ' values(?, ?, ?)', [10, "hoge1", 100]).execute()
				.progress(function(rs, tx) {
					strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
					strictEqual(rs.insertId, 1, '1件登録され、insertid=1を取得できること。');

					db.sql('insert aaa ' + TABLE_NAME + ' values(?, ?, ?)', [20, "hoge2", 200], tx)
					// エラーSQL
					.execute().fail(function(e) {
						strictEqual(seqNo++, 2, 'fail2 2番目に実行されること。');
						strictEqual(e.code, errCode, 'エラーコードが格納されていること。');
						ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
						ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');
					});
				}).fail(function(e) {
					strictEqual(seqNo++, 3, 'fail1 3番目に実行されること。');
					strictEqual(e.code, errCode, 'エラーコードが格納されていること。');
					ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
					ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');

					db.select(TABLE_NAME, '*').execute().done(function(rs) {
						strictEqual(rs.length, 0, 'ロールバックされているためレコードは0件であること。');
						start();
					});
				});
	});

	asyncTest('execute()を2回呼び出す', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var sql = db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['abc', 10, 20000]);
		sql.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			sql.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
				start();
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('execute()を3回呼び出す', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var sql = db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['abc', 10, 20000]);
		sql.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			sql.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);

				sql.execute().fail(function(e2) {
					ok(true, '三回目のexecute()は、エラーとして処理されること');
					equal(e2.code, ERR.ERR_CODE_RETRY_SQL, e2.code + ': ' + e2.message);
					start();
				}).done(function() {
					ok(false, 'エラーが発生していないためテスト失敗');
				});
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('execute()を2回呼び出す 2', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var sql = db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['abc', 10, 20000]);
		sql.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		sql.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	asyncTest('execute()を3回呼び出す 2', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var sql = db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['abc', 10, 20000]);
		sql.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		sql.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});

		sql.execute().fail(function(e) {
			ok(true, '三回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	//=============================
	// Definition
	//=============================

	module('[browser#ie:all|ie-wp:all|ff:all]H5Api - Web SQL Database - Insert', {
		setup: setupFunc,
		teardown: dropTable
	});

	//=============================
	// Body
	//=============================

	asyncTest('db.insert()を実行', 7, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.insert(TABLE_NAME, {
			col1: 10,
			col2: 'hoge',
			col3: 80.5
		}).execute().done(function(rowIds) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowIds[0], 1, '1件登録され、insertid=1を取得できること。');
			strictEqual(arguments.length, 1, '引数は1つあること。');
			start();
		}).progress(function(rowIds, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowIds[0], 1, '1件登録され、insertid=1を取得できること。');
			strictEqual(arguments.length, 2, '引数は2つあること。');
			ok(tx._db && tx._tx && tx._tasks, '第二引数はトランザクションであること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('db.insert()を実行 (VALUES未指定)', 7, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.insert(TABLE_NAME).execute().done(function(rowIds) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowIds[0], 1, '1件登録され、insertid=1を取得できること。');
			strictEqual(arguments.length, 1, '引数は1つあること。');
			start();
		}).progress(function(rowIds, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowIds[0], 1, '1件登録され、insertid=1を取得できること。');
			strictEqual(arguments.length, 2, '引数は2つあること。');
			ok(tx._db && tx._tx && tx._tasks, '第二引数はトランザクションであること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	test('引数がプレーンオブジェクトでない時にエラーが発生すること', 8, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}

		var errorCode = ERR.ERR_CODE_INVALID_VALUES;
		try {
			db.insert(TABLE_NAME, 0);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.insert(TABLE_NAME, 1);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.insert(TABLE_NAME, false);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.insert(TABLE_NAME, true);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.insert(TABLE_NAME, '');
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.insert(TABLE_NAME, 'a');
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.insert(TABLE_NAME, /a/);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.insert(TABLE_NAME, new String());
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});

	asyncTest('db.insert()を実行後、別トランザクションで、db.insert()を実行', 8, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.insert(TABLE_NAME, {
			col1: 10,
			col2: 'hoge',
			col3: 100
		}).execute().done(function(rowIds) {
			strictEqual(seqNo++, 2, 'done1 2番目に実行されること。');
			strictEqual(rowIds[0], 1, '1件登録され、insertid=1を取得できること。');

			db.insert(TABLE_NAME, {
				col1: 20,
				col2: 'hoge2',
				col3: 200
			}).execute().done(function(rowIds) {
				strictEqual(seqNo++, 4, 'done2 4番目に実行されること。');
				strictEqual(rowIds[0], 2, '1件登録され、insertid=2を取得できること。');
				start();
			}).progress(function(rowIds, tx2) {
				strictEqual(seqNo++, 3, 'progress2 3番目に実行されること。');
				strictEqual(rowIds[0], 2, '1件登録され、insertid=2を取得できること。');
			});
		}).progress(function(rowIds, tx) {
			strictEqual(seqNo++, 1, 'progress1 1番目に実行されること。');
			strictEqual(rowIds[0], 1, '1件登録され、insertid=1を取得できること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('db.insert()を実行後、同一トランザクションで、db.insert()を実行', 8, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.insert(TABLE_NAME, {
			col1: 10,
			col2: 'hoge',
			col3: 100
		}).execute().done(function(rowIds) {
			strictEqual(seqNo++, 4, 'done1 4番目に実行されること。');
			strictEqual(rowIds[0], 1, '1件登録され、insertid=1を取得できること。');

		}).progress(function(rowIds, tx) {
			strictEqual(seqNo++, 1, 'progress1 1番目に実行されること。');
			strictEqual(rowIds[0], 1, '1件登録され、insertid=1を取得できること。');

			db.insert(TABLE_NAME, {
				col1: 20,
				col2: 'hoge2',
				col3: 200
			}, tx).execute().done(function(rowIds) {
				strictEqual(seqNo++, 3, 'done2 3番目に実行されること。');
				strictEqual(rowIds[0], 2, '1件登録され、insertid=2を取得できること。');
				start();
			}).progress(function(rowIds, tx2) {
				strictEqual(seqNo++, 2, 'progress2 2番目に実行されること。');
				strictEqual(rowIds[0], 2, '1件登録され、insertid=2を取得できること。');
			});
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('db.insert()を実行後、同一トランザクションで、エラーのdb.insert()を実行', 11, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.insert(TABLE_NAME, {
			col1: 10,
			col2: 'hoge',
			col3: 100
		}).execute().progress(
				function(insertId, tx) {
					strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
					deepEqual(insertId, [1], '1件登録され、insertid=1を取得できること。');

					db.insert(TABLE_NAME, { // エラーSQL
						col1: 20,
						col2: 'hoge2',
						col333: 200
					}, tx).execute().fail(
							function(e) {
								strictEqual(seqNo++, 2, 'fail2 2番目に実行されること。');
								strictEqual(e.code, ERR.ERR_CODE_TRANSACTION_PROCESSING_FAILURE,
										'エラーコードが格納されていること。');
								ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
								ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');
							});
				}).fail(function(e) {
			strictEqual(seqNo++, 3, 'fail1 3番目に実行されること。');
			strictEqual(e.code, ERR.ERR_CODE_TRANSACTION_PROCESSING_FAILURE, 'エラーコードが格納されていること。');
			ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
			ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');

			db.select(TABLE_NAME, '*').execute().done(function(rs) {
				strictEqual(rs.length, 0, 'ロールバックされているためレコードは0件であること。');
				start();
			});
		});
	});

	asyncTest('配列で値を指定して、insert()を実行', 11, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.insert(TABLE_NAME, [{
			col1: 20,
			col2: 'hoge1',
			col3: 111
		}, {
			col1: 10,
			col2: 'hoge2',
			col3: 222
		}]).execute().done(function(rowIds) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowIds.length, 2, '2件登録されること。');
			strictEqual(rowIds[0], 1, 'insertid=1を取得できること。');
			strictEqual(rowIds[1], 2, 'insertid=2を取得できること。');
			strictEqual(arguments.length, 1, '引数は1つあること。');
			start();
		}).progress(function(rowIds, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowIds.length, 2, '2件登録されること。');
			strictEqual(rowIds[0], 1, 'insertid=1を取得できること。');
			strictEqual(rowIds[1], 2, 'insertid=2を取得できること。');
			strictEqual(arguments.length, 2, '引数は2つあること。');
			ok(tx._db && tx._tx && tx._tasks, '第二引数はトランザクションであること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest(
			'配列で値を指定して、insert()を実行。空要素(undefined)およびnullはDefaultValueが入り、planeObjectでない値については無視されること。',
			30,
			function() {
				if (!h5.api.sqldb.isSupported) {
					expect(1);
					ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
					start();
					return;
				}

				var seqNo = 1;
				var obj1 = {
					col1: 20,
					col2: 'hoge1',
					col3: 111
				},obj2 = {
					col1: 10,
					col2: 'hoge2',
					col3: 222
				};

				db
						.insert(TABLE_NAME, [
						// オブジェクト
						obj1
						// 空要素(undefined)
						, ,
						// オブジェクト
						obj2,
						// null
						null,
						// undefined
						undefined])
						.execute()
						.done(
								function(rowIds) {
									strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
									strictEqual(rowIds.length, 5, '5件登録されること。');
									strictEqual(rowIds[0], 1, 'insertid=1を取得できること。');
									strictEqual(rowIds[1], 2, 'insertid=2を取得できること。');
									strictEqual(rowIds[2], 3, 'insertid=3を取得できること。');
									strictEqual(rowIds[3], 4, 'insertid=4を取得できること。');
									strictEqual(rowIds[4], 5, 'insertid=5を取得できること。');
									strictEqual(arguments.length, 1, '引数は1つあること。');
									db
											.insert(TABLE_NAME, [
											// number
											0, 1,
											// boolean
											false, true,
											// string
											'',
											// RegExp
											/a/,
											// String
											new String()])
											.execute()
											.done(
													function(rowIds) {
														strictEqual(seqNo++, 4, 'done 4番目に実行されること。');
														strictEqual(rowIds.length, 0,
																'プレーンオブジェクトでないものは1つも登録されないこと。');
														strictEqual(arguments.length, 1,
																'引数は1つあること。');
														db
																.select(TABLE_NAME, '*')
																.execute()
																.done(
																		function(rs) {
																			ok(rs.length, 5,
																					'合計5件登録されたこと');
																			var defultObj = {
																				col1: null,
																				col2: null,
																				col3: null
																			};
																			deepEqual(rs.item(0),
																					obj1,
																					'オブジェクトで渡したものが正しく登録できていること。');
																			deepEqual(rs.item(1),
																					defultObj,
																					'空要素(undefined)で渡したものはDefultValueで登録されていること');
																			deepEqual(rs.item(2),
																					obj2,
																					'オブジェクトで渡したものが正しく登録できていること。');
																			deepEqual(rs.item(3),
																					defultObj,
																					'nullで渡したものはDefultValueで登録されていること');
																			deepEqual(rs.item(4),
																					defultObj,
																					'undefinedで渡したものはDefultValueで登録されていること');
																			start();
																		});
													}).progress(
													function(rowIds, tx) {
														strictEqual(seqNo++, 3,
																'progress 3番目に実行されること。');
														strictEqual(rowIds.length, 0,
																'プレーンオブジェクトでないものは1つも登録されないこと。');
														strictEqual(arguments.length, 2,
																'引数は2つあること。');
														ok(tx._db && tx._tx && tx._tasks,
																'第二引数はトランザクションであること。');
													}).fail(function(error) {
												ok(false, '登録失敗 message:' + error.message);
												start();
											});
								}).progress(function(rowIds, tx) {
							strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
							strictEqual(rowIds.length, 5, '5件登録されること。');
							strictEqual(rowIds[0], 1, 'insertid=1を取得できること。');
							strictEqual(rowIds[1], 2, 'insertid=2を取得できること。');
							strictEqual(rowIds[2], 3, 'insertid=3を取得できること。');
							strictEqual(rowIds[3], 4, 'insertid=4を取得できること。');
							strictEqual(rowIds[4], 5, 'insertid=5を取得できること。');
							strictEqual(arguments.length, 2, '引数は2つあること。');
							ok(tx._db && tx._tx && tx._tasks, '第二引数はトランザクションであること。');
						}).fail(function(error) {
							ok(false, '登録失敗 message:' + error.message);
							start();
						});
			});

	asyncTest('配列で値を指定したdb.insert()を実行後、別トランザクションで、配列で値を指定したdb.insert()を実行。', 16, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.insert(TABLE_NAME, [{
			col1: 20,
			col2: 'hoge1',
			col3: 111
		}, {
			col1: 10,
			col2: 'hoge2',
			col3: 222
		}]).execute().done(function(rowIds) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowIds.length, 2, '2件登録されること。');
			strictEqual(rowIds[0], 1, 'insertid=1を取得できること。');
			strictEqual(rowIds[1], 2, 'insertid=2を取得できること。');

			db.insert(TABLE_NAME, [{
				col1: 30,
				col2: 'hoge3',
				col3: 333
			}, {
				col1: 40,
				col2: 'hoge4',
				col3: 444
			}]).execute().done(function(rowIds) {
				strictEqual(seqNo++, 4, 'done 4番目に実行されること。');
				strictEqual(rowIds.length, 2, '2件登録されること。');
				strictEqual(rowIds[0], 3, 'insertid=3を取得できること。');
				strictEqual(rowIds[1], 4, 'insertid=4を取得できること。');
				start();
			}).progress(function(rowIds, tx) {
				strictEqual(seqNo++, 3, 'progress 3番目に実行されること。');
				strictEqual(rowIds.length, 2, '2件登録されること。');
				strictEqual(rowIds[0], 3, 'insertid=3を取得できること。');
				strictEqual(rowIds[1], 4, 'insertid=4を取得できること。');
			}).fail(function(error) {
				ok(false, '登録失敗 message:' + error.message);
				start();
			});
		}).progress(function(rowIds, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowIds.length, 2, '2件登録されること。');
			strictEqual(rowIds[0], 1, 'insertid=1を取得できること。');
			strictEqual(rowIds[1], 2, 'insertid=2を取得できること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});



	asyncTest('配列で値を指定したdb.insert()を実行後、同一トランザクションで、配列で値を指定したdb.insert()を実行。', 16, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.insert(TABLE_NAME, [{
			col1: 20,
			col2: 'hoge1',
			col3: 111
		}, {
			col1: 10,
			col2: 'hoge2',
			col3: 222
		}]).execute().done(function(rowIds) {
			strictEqual(seqNo++, 4, 'done1 4番目に実行されること。');
			strictEqual(rowIds.length, 2, '2件登録されること。');
			strictEqual(rowIds[0], 1, 'insertid=1を取得できること。');
			strictEqual(rowIds[1], 2, 'insertid=2を取得できること。');
		}).progress(function(rowIds, tx) {
			strictEqual(seqNo++, 1, 'progress1 1番目に実行されること。');
			strictEqual(rowIds.length, 2, '2件登録されること。');
			strictEqual(rowIds[0], 1, 'insertid=1を取得できること。');
			strictEqual(rowIds[1], 2, 'insertid=2を取得できること。');

			db.insert(TABLE_NAME, [{
				col1: 30,
				col2: 'hoge3',
				col3: 333
			}, {
				col1: 40,
				col2: 'hoge4',
				col3: 444
			}], tx).execute().done(function(rowIds) {
				strictEqual(seqNo++, 3, 'done2 3番目に実行されること。');
				strictEqual(rowIds.length, 2, '2件登録されること。');
				strictEqual(rowIds[0], 3, 'insertid=3を取得できること。');
				strictEqual(rowIds[1], 4, 'insertid=4を取得できること。');
				start();
			}).progress(function(rowIds, tx) {
				strictEqual(seqNo++, 2, 'progress2 2番目に実行されること。');
				strictEqual(rowIds.length, 2, '2件登録されること。');
				strictEqual(rowIds[0], 3, 'insertid=3を取得できること。');
				strictEqual(rowIds[1], 4, 'insertid=4を取得できること。');
			}).fail(function(error) {
				ok(false, '登録失敗 message:' + error.message);
				start();
			});
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});


	asyncTest('execute()を2回呼び出す', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var insert = db.insert(TABLE_NAME, {
			col1: 20,
			col2: 'hoge1',
			col3: 111
		});
		insert.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			insert.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
				start();
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('execute()を3回呼び出す', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var insert = db.insert(TABLE_NAME, {
			col1: 20,
			col2: 'hoge1',
			col3: 111
		});
		insert.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			insert.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);

				insert.execute().fail(function(e2) {
					ok(true, '三回目のexecute()は、エラーとして処理されること');
					equal(e2.code, ERR.ERR_CODE_RETRY_SQL, e2.code + ': ' + e2.message);
					start();
				}).done(function() {
					ok(false, 'エラーが発生していないためテスト失敗');
				});
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('db.insert() - execute()を2回呼び出す 2', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var insert = db.insert(TABLE_NAME, {
			col1: 20,
			col2: 'hoge1',
			col3: 111
		});

		insert.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		insert.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	asyncTest('db.insert() - execute()を3回呼び出す 2', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var insert = db.insert(TABLE_NAME, {
			col1: 20,
			col2: 'hoge1',
			col3: 111
		});

		insert.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		insert.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});

		insert.execute().fail(function(e) {
			ok(true, '三回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	//=============================
	// Definition
	//=============================

	module('[browser#ie:all|ie-wp:all|ff:all]H5Api - Web SQL Database - Update', {
		setup: setupFunc2,
		teardown: dropTable
	});

	//=============================
	// Body
	//=============================

	asyncTest('db.update()を実行', 7, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 80.5
		}).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');
			strictEqual(arguments.length, 1, '引数は1つあること。');
			start();
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');
			strictEqual(arguments.length, 2, '引数は2つあること。');
			ok(tx._db && tx._tx && tx._tasks, '第二引数はトランザクションであること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	test('引数にundefined,null,0,1,\'\',\'aa\',new String()を指定してすろとエラーが出ること。', 7, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}

		var errorCode = ERR.ERR_CODE_INVALID_VALUES;
		try {
			db.update(TABLE_NAME);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.update(TABLE_NAME, null);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.update(TABLE_NAME, 0);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.update(TABLE_NAME, 1);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.update(TABLE_NAME, '');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.update(TABLE_NAME, 'aa');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.update(TABLE_NAME, new String());
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});

	asyncTest('whereを指定(=)', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 80.5
		}).where({
			col1: 10
		}).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件更新されること。');
			start();
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件更新されること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('whereを指定(>=)', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 80.5
		}).where({
			'col1 >=': 10
		}).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');
			start();
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('whereを指定(like)', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 80.5
		}).where({
			'col2 like': '%ge1'
		}).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowsAffected, 1, '2件更新されること。');
			start();
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowsAffected, 1, '2件更新されること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('whereを文字列で指定', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 80.5
		}).where('col1 >= 10').execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');
			start();
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('誤ったwhereを指定', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		// whereのオペレータが不正
		var errorCodeInvalidOperator = ERR.ERR_CODE_INVALID_OPERATOR;
		// whereのカラムが無い
		var errorCodeEmptyWhereCondition = ERR.ERR_CODE_INVALID_COLUMN_NAME_IN_WHERE;

		db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 80.5
		}).where({
			// 演算子が不正
			'col1 a': 10,
			'col1 >=': 10
		}).execute().done(function(rowsAffected) {
			ok(false, 'テスト失敗');
			start();
		}).fail(function(e) {
			deepEqual(e.code, errorCodeInvalidOperator, e.message);
			db.update(TABLE_NAME, {
				col2: 'hoge',
				col3: 80.5
			}).where({
				// 渡す数が不正
				'col1 col2 =': 10,
				'col1 >=': 10
			}).execute().done(function(rowsAffected) {
				ok(false, 'テスト失敗');
				start();
			}).fail(function(e) {
				deepEqual(e.code, errorCodeInvalidOperator, e.message);
				db.update(TABLE_NAME, {
					col2: 'hoge',
					col3: 80.5
				}).where({
					// 空文字
					'': 10,
					'col1 >=': 10
				}).execute().done(function(rowsAffected) {
					ok(false, 'テスト失敗');
					start();
				}).fail(function(e) {
					deepEqual(e.code, errorCodeEmptyWhereCondition, e.message);
					db.update(TABLE_NAME, {
						col2: 'hoge',
						col3: 80.5
					}).where({
						// 空白文字
						'  ': 10,
						'col1 >=': 10
					}).execute().done(function(rowsAffected) {
						ok(false, 'テスト失敗');
						start();
					}).fail(function(e) {
						deepEqual(e.code, errorCodeEmptyWhereCondition, e.message);
						start();
					});
				});
			});
		});
	});

	test('誤ったwhereを指定 2', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}

		var errorCode = ERR.ERR_CODE_INVALID_PARAM_TYPE;
		try {
			db.update(TABLE_NAME, {
				col2: 'hoge',
				col3: 80.5
			}).where();
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.update(TABLE_NAME, {
				col2: 'hoge',
				col3: 80.5
			}).where(null);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.update(TABLE_NAME, {
				col2: 'hoge',
				col3: 80.5
			}).where(10);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.update(TABLE_NAME, {
				col2: 'hoge',
				col3: 80.5
			}).where(true);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.update(TABLE_NAME, {
				col2: 'hoge',
				col3: 80.5
			}).where(new String("col1 >= 10"));
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});

	asyncTest('db.update()を実行後、別トランザクションで、db.update()を実行', 8, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 100
		}).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done1 2番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');

			db.update(TABLE_NAME, {
				col2: 'hoge2',
				col3: 200
			}).execute().done(function(rowsAffected) {
				strictEqual(seqNo++, 4, 'done2 4番目に実行されること。');
				strictEqual(rowsAffected, 2, '2件更新されること。');
				start();
			}).progress(function(rowsAffected, tx2) {
				strictEqual(seqNo++, 3, 'progress2 3番目に実行されること。');
				strictEqual(rowsAffected, 2, '2件更新されること。');
			});
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress1 1番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('db.update()を実行後、同一トランザクションで、db.update()を実行', 8, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 100
		}).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 4, 'done1 4番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');

		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress1 1番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');

			db.update(TABLE_NAME, {
				col2: 'hoge555',
				col3: 1000
			}, tx).execute().done(function(rowsAffected) {
				strictEqual(seqNo++, 3, 'done2 3番目に実行されること。');
				strictEqual(rowsAffected, 2, '2件更新されること。');
				start();
			}).progress(function(rowsAffected, tx2) {
				strictEqual(seqNo++, 2, 'progress2 2番目に実行されること。');
				strictEqual(rowsAffected, 2, '2件更新されること。');
			});
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('db.update()を実行後、同一トランザクションで、エラーのdb.update()を実行', 17, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 100
		}).execute().progress(
				function(rowsAffected, tx) {
					strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
					strictEqual(rowsAffected, 2, '2件更新されていること。');

					db.update(TABLE_NAME, { // エラーSQL
						col2: 'hoge555',
						col333: 1000
					}, tx).execute().fail(
							function(e) {
								strictEqual(seqNo++, 2, 'fail2 2番目に実行されること。');
								strictEqual(e.code, ERR.ERR_CODE_TRANSACTION_PROCESSING_FAILURE,
										'エラーコードが格納されていること。');
								ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
								ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');
							});
				}).fail(function(e) {
			strictEqual(seqNo++, 3, 'fail1 3番目に実行されること。');
			strictEqual(e.code, ERR.ERR_CODE_TRANSACTION_PROCESSING_FAILURE, 'エラーコードが格納されていること。');
			ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
			ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');

			db.select(TABLE_NAME, '*').execute().done(function(rs) {
				strictEqual(rs.length, 2, 'テーブルに2件レコードが存在すること。');
				strictEqual(rs.item(0).col1, 10, 'ロールバックされているため更新前の値に戻っていること。');
				strictEqual(rs.item(0).col2, 'hoge1', 'ロールバックされているため更新前の値に戻っていること。');
				strictEqual(rs.item(0).col3, 'test%%b', 'ロールバックされているため更新前の値に戻っていること。');
				strictEqual(rs.item(1).col1, 20, 'ロールバックされているため更新前の値に戻っていること。');
				strictEqual(rs.item(1).col2, 'hoge2', 'ロールバックされているため更新前の値に戻っていること。');
				strictEqual(rs.item(1).col3, 'test%%a', 'ロールバックされているため更新前の値に戻っていること。');
				start();
			});
		});
	});

	asyncTest('execute()を2回呼び出す', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var update = db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 100
		});

		update.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			update.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
				start();
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('execute()を3回呼び出す', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var update = db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 100
		});

		update.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			update.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);

				update.execute().fail(function(e2) {
					ok(true, '三回目のexecute()は、エラーとして処理されること');
					equal(e2.code, ERR.ERR_CODE_RETRY_SQL, e2.code + ': ' + e2.message);
					start();
				}).done(function() {
					ok(false, 'エラーが発生していないためテスト失敗');
				});
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('db.update() - execute()を2回呼び出す 2', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var update = db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 100
		});

		update.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		update.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	asyncTest('db.update() - execute()を3回呼び出す 2', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var update = db.update(TABLE_NAME, {
			col2: 'hoge',
			col3: 100
		});

		update.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		update.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});

		update.execute().fail(function(e) {
			ok(true, '三回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	//=============================
	// Definition
	//=============================

	module('[browser#ie:all|ie-wp:all|ff:all]H5Api - Web SQL Database - Del', {
		setup: setupFunc2,
		teardown: dropTable
	});

	//=============================
	// Body
	//=============================

	asyncTest('db.del()を実行', 7, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.del(TABLE_NAME).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');
			strictEqual(arguments.length, 1, '引数は1つあること。');
			start();
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件更新されること。');
			strictEqual(arguments.length, 2, '引数は2つあること。');
			ok(tx._db && tx._tx && tx._tasks, '第二引数はトランザクションであること。');
		}).fail(function(error) {
			ok(false, '削除失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('whereを指定(=)', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.del(TABLE_NAME).where({
			col1: 10
		}).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件削除されること。');
			start();
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件削除されること。');
		}).fail(function(error) {
			ok(false, '削除失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('whereを指定(>=)', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.del(TABLE_NAME).where({
			'col1 >=': 10
		}).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件削除されること。');
			start();
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowsAffected, 2, '2件削除されること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('whereを文字列で指定', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.del(TABLE_NAME).where('col1>=10 AND col1<=15').execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件削除されること。');
			start();
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件削除されること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('whereを指定(like)', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.del(TABLE_NAME).where({
			'col2 like': '%ge1'
		}).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件削除されること。');
			start();
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件削除されること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('誤ったwhereを指定', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		// whereのオペレータが不正
		var errorCodeInvalidOperator = ERR.ERR_CODE_INVALID_OPERATOR;
		// whereのカラムが無い
		var errorCodeEmptyWhereCondition = ERR.ERR_CODE_INVALID_COLUMN_NAME_IN_WHERE;

		db.del(TABLE_NAME).where({
			// 演算子が不正
			'col1 a': 10,
			'col1 >=': 10
		}).execute().done(function(rowsAffected) {
			ok(false, 'テスト失敗');
			start();
		}).fail(function(e) {
			deepEqual(e.code, errorCodeInvalidOperator, e.message);
			db.del(TABLE_NAME).where({
				// 渡す数が不正
				'col1 col2 =': 10,
				'col1 >=': 10
			}).execute().done(function(rowsAffected) {
				ok(false, 'テスト失敗');
				start();
			}).fail(function(e) {
				deepEqual(e.code, errorCodeInvalidOperator, e.message);
				db.del(TABLE_NAME).where({
					// 空文字
					'': 10,
					'col1 >=': 10
				}).execute().done(function(rowsAffected) {
					ok(false, 'テスト失敗');
					start();
				}).fail(function(e) {
					deepEqual(e.code, errorCodeEmptyWhereCondition, e.message);
					db.del(TABLE_NAME).where({
						// 空白文字
						'  ': 10,
						'col1 >=': 10
					}).execute().done(function(rowsAffected) {
						ok(false, 'テスト失敗');
						start();
					}).fail(function(e) {
						deepEqual(e.code, errorCodeEmptyWhereCondition, e.message);
						start();
					});
				});
			});
		});
	});

	test('誤ったwhereを指定 2', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}

		var errorCode = ERR.ERR_CODE_INVALID_PARAM_TYPE;
		try {
			db.del(TABLE_NAME).where();
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.del(TABLE_NAME).where(null);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.del(TABLE_NAME).where(10);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.del(TABLE_NAME).where(true);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.del(TABLE_NAME).where(new String("col1 >= 10"));
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});

	asyncTest('db.del()を実行後、別トランザクションで、db.del()を実行', 8, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.del(TABLE_NAME).where({
			col1: 10
		}).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 2, 'done1 2番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件削除されること。');

			db.del(TABLE_NAME).where({
				col1: 20
			}).execute().done(function(rowsAffected) {
				strictEqual(seqNo++, 4, 'done2 4番目に実行されること。');
				strictEqual(rowsAffected, 1, '1件削除されること。');
				start();
			}).progress(function(rowsAffected, tx2) {
				strictEqual(seqNo++, 3, 'progress2 3番目に実行されること。');
				strictEqual(rowsAffected, 1, '1件削除されること。');
			});
		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress1 1番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件削除されること。');
		}).fail(function(error) {
			ok(false, '削除失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('db.del()を実行後、同一トランザクションで、db.del()を実行', 8, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.del(TABLE_NAME).where({
			col1: 10
		}).execute().done(function(rowsAffected) {
			strictEqual(seqNo++, 4, 'done1 4番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件削除されること。');

		}).progress(function(rowsAffected, tx) {
			strictEqual(seqNo++, 1, 'progress1 1番目に実行されること。');
			strictEqual(rowsAffected, 1, '1件削除されること。');

			db.del(TABLE_NAME, tx).where({
				col1: 20
			}).execute().done(function(rowsAffected) {
				strictEqual(seqNo++, 3, 'done2 3番目に実行されること。');
				strictEqual(rowsAffected, 1, '1件削除されること。');
				start();
			}).progress(function(rowsAffected, tx2) {
				strictEqual(seqNo++, 2, 'progress2 2番目に実行されること。');
				strictEqual(rowsAffected, 1, '1件削除されること。');
			});
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('db.del()を実行後、同一トランザクションで、エラーのdb.del()を実行', 15, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;
		var errorCode = ERR.ERR_CODE_TRANSACTION_PROCESSING_FAILURE;

		db.del(TABLE_NAME).where({
			col1: 10
		}).execute().progress(function(rowsAffected, tx) {
			db.select(TABLE_NAME, '*', tx).execute().progress(function(rs, tx) {
				strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
				strictEqual(rs.length, 1, '1件削除されたたため、テーブルにはレコードが1件存在すること。');

				db.del(TABLE_NAME, tx).where({
					col111: 20
				}).execute().fail(function(e) {
					strictEqual(seqNo++, 2, 'fail2 2番目に実行されること。');

					strictEqual(e.code, errorCode, 'エラーコードが格納されていること。');
					ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
					ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');
				});
			}).fail(function(e) {
				strictEqual(seqNo++, 3, 'fail2 3番目に実行されること。');
				strictEqual(e.code, errorCode, 'エラーコードが格納されていること。');
				ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
				ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');
			});
		}).fail(function(e) {
			strictEqual(seqNo++, 4, 'fail1 4番目に実行されること。');
			strictEqual(e.code, errorCode, 'エラーコードが格納されていること。');
			ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
			ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');

			db.select(TABLE_NAME, '*').execute().done(function(rs) {
				strictEqual(rs.length, 2, 'ロールバックされているので、テーブルにレコードが2件存在すること。');
				start();
			});
		});
	});

	asyncTest('execute()を2回呼び出す', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var del = db.del(TABLE_NAME).where({
			col1: 10
		});

		del.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			del.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
				start();
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('execute()を3回呼び出す', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var del = db.del(TABLE_NAME).where({
			col1: 10
		});

		del.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			del.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);

				del.execute().fail(function(e2) {
					ok(true, '三回目のexecute()は、エラーとして処理されること');
					equal(e2.code, ERR.ERR_CODE_RETRY_SQL, e2.code + ': ' + e2.message);
					start();
				}).done(function() {
					ok(false, 'エラーが発生していないためテスト失敗');
				});
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('db.update() - execute()を2回呼び出す 2', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var del = db.del(TABLE_NAME).where({
			col1: 10
		});

		del.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		del.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			ok(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	asyncTest('db.update() - execute()を3回呼び出す 2', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var del = db.del(TABLE_NAME).where({
			col1: 10
		});

		del.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		del.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			ok(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});

		del.execute().fail(function(e) {
			ok(true, '三回目のexecute()は、エラーとして処理されること');
			ok(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	//=============================
	// Definition
	//=============================

	module('[browser#ie:all|ie-wp:all|ff:all]H5Api - Web SQL Database - Select', {
		setup: setupFunc2,
		teardown: dropTable
	});

	//=============================
	// Body
	//=============================

	asyncTest('db.select()を実行', 7, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.select(TABLE_NAME, '*').execute().done(function(rows) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rows.length, 2, '2件取得できること。');
			strictEqual(arguments.length, 1, '引数は1つあること。');
			start();
		}).progress(function(rows, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rows.length, 2, '2件取得できること。');
			strictEqual(arguments.length, 2, '引数は2つあること。');
			ok(tx._db && tx._tx && tx._tasks, '第二引数はトランザクションであること。');
		}).fail(function(error) {
			ok(false, '取得失敗 message:' + error.message);
			start();
		});
	});


	test('カラム名に不正な値を指定するとエラーが出ること', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}

		var errorCode = ERR.ERR_CODE_INVALID_COLUMN_NAME;
		try {
			db.select(TABLE_NAME);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.select(TABLE_NAME, 'col1');
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.select(TABLE_NAME, '');
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});

	asyncTest('whereを指定(=)', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.select(TABLE_NAME, '*').where({
			col1: 10
		}).execute().done(function(rows) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rows.length, 1, '1件取得できること。');
			start();
		}).progress(function(rows, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rows.length, 1, '1件取得できること。');
		}).fail(function(error) {
			ok(false, '取得失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('whereを指定(>=)', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.select(TABLE_NAME, '*').where({
			'col1 >=': 10
		}).execute().done(function(rows) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rows.length, 2, '2件取得できること。');
			start();
		}).progress(function(rows, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rows.length, 2, '2件取得できること。');
		}).fail(function(error) {
			ok(false, '取得失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('whereを指定(like)', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.select(TABLE_NAME, '*').where({
			'col2 like': '%ge1'
		}).execute().done(function(rows) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rows.length, 1, '1件取得できること。');
			start();
		}).progress(function(rows, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rows.length, 1, '1件取得できること。');
		}).fail(function(error) {
			ok(false, '取得失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('whereを指定(like escape @)', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.select(TABLE_NAME, '*').where({
			'col3 like @': 'test@%@%b'
		}).execute().done(function(rows) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rows.length, 1, '1件取得できること。');
			start();
		}).progress(function(rows, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rows.length, 1, '1件取得できること。');
		}).fail(function(error) {
			ok(false, '取得失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('whereを文字列で指定', 6, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.select(TABLE_NAME, '*').where('col1>=10 AND col1<=15').execute().done(function(rs) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rs.length, 1, '1件取得できること。');
			deepEqual(rs.item(0), {
				col1: 10,
				col2: 'hoge1',
				col3: 'test%%b'
			}, '1件取得できること。');
			start();
		}).progress(function(rs, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rs.length, 1, '1件取得できること。');
			deepEqual(rs.item(0), {
				col1: 10,
				col2: 'hoge1',
				col3: 'test%%b'
			}, '1件取得できること。');
		}).fail(function(error) {
			ok(false, '登録失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('誤ったwhereを指定', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		// whereのオペレータが不正
		var errorCodeInvalidOperator = ERR.ERR_CODE_INVALID_OPERATOR;
		// whereのカラムが無い
		var errorCodeEmptyWhereCondition = ERR.ERR_CODE_INVALID_COLUMN_NAME_IN_WHERE;
		;

		db.select(TABLE_NAME, '*').where({
			// 演算子が不正
			'col1 a': 10,
			'col1 >=': 10
		}).execute().done(function(rowsAffected) {
			ok(false, 'テスト失敗');
			start();
		}).fail(function(e) {
			deepEqual(e.code, errorCodeInvalidOperator, e.message);
			db.select(TABLE_NAME, '*').where({
				// 渡す数が不正
				'col1 col2 =': 10,
				'col1 >=': 10
			}).execute().done(function(rowsAffected) {
				ok(false, 'テスト失敗');
				start();
			}).fail(function(e) {
				deepEqual(e.code, errorCodeInvalidOperator, e.message);
				db.select(TABLE_NAME, '*').where({
					// 空文字
					'': 10,
					'col1 >=': 10
				}).execute().done(function(rowsAffected) {
					ok(false, 'テスト失敗');
					start();
				}).fail(function(e) {
					deepEqual(e.code, errorCodeEmptyWhereCondition, e.message);
					db.select(TABLE_NAME, '*').where({
						// 空白文字
						'  ': 10,
						'col1 >=': 10
					}).execute().done(function(rowsAffected) {
						ok(false, 'テスト失敗');
						start();
					}).fail(function(e) {
						deepEqual(e.code, errorCodeEmptyWhereCondition, e.message);
						start();
					});
				});
			});
		});
	});

	test('誤ったwhereを指定 2', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}


		var errorCode = ERR.ERR_CODE_INVALID_PARAM_TYPE;
		try {
			db.select(TABLE_NAME, '*').where();
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.select(TABLE_NAME, '*').where(null);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.select(TABLE_NAME, '*').where(10);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.select(TABLE_NAME, '*').where(true);
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		try {
			db.select(TABLE_NAME, '*').where(new String("col1 >= 10"));
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});


	asyncTest('orderByを指定', 6, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.select(TABLE_NAME, '*').orderBy('col2 desc').execute().done(function(rows) {
			strictEqual(seqNo++, 2, 'done 2番目に実行されること。');
			strictEqual(rows.length, 2, '2件取得できること。');

			var expected = ['hoge2', 'hoge1'];
			for ( var i = 0; i < rows.length; i++) {
				strictEqual(rows.item(i).col2, expected[i], '降順でソートされていること。');
			}
			start();
		}).progress(function(rows, tx) {
			strictEqual(seqNo++, 1, 'progress 1番目に実行されること。');
			strictEqual(rows.length, 2, '2件取得できること。');
		}).fail(function(error) {
			ok(false, '取得失敗 message:' + error.message);
			start();
		});
	});

	test('誤ったorderByを指定', 1, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}

		raises(function() {
			db.select(TABLE_NAME, '*').orderBy(10);
		}, 'orderBy()に不正な型を指定したためエラーが発生すること。');
	});


	asyncTest('db.select()を実行後、別トランザクションで、db.select()を実行', 8, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.select(TABLE_NAME, '*').where({
			col1: 10
		}).execute().done(function(rows) {
			strictEqual(seqNo++, 2, 'done1 2番目に実行されること。');
			strictEqual(rows.length, 1, '1件取得できること。');

			db.select(TABLE_NAME, '*').where({
				col1: 20
			}).execute().done(function(rows) {
				strictEqual(seqNo++, 4, 'done2 4番目に実行されること。');
				strictEqual(rows.length, 1, '1件取得できること。');
				start();
			}).progress(function(rows, tx2) {
				strictEqual(seqNo++, 3, 'progress2 3番目に実行されること。');
				strictEqual(rows.length, 1, '1件削除されていること。');
			});
		}).progress(function(rows, tx) {
			strictEqual(seqNo++, 1, 'progress1 1番目に実行されること。');
			strictEqual(rows.length, 1, '1件削除されていること。');
		}).fail(function(error) {
			ok(false, '取得失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('db.select()を実行後、同一トランザクションで、db.select()を実行', 8, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var seqNo = 1;

		db.select(TABLE_NAME, '*').where({
			col1: 10
		}).execute().done(function(rows) {
			strictEqual(seqNo++, 4, 'done1 4番目に実行されること。');
			strictEqual(rows.length, 1, '1件取得できること。');

		}).progress(function(rows, tx) {
			strictEqual(seqNo++, 1, 'progress1 1番目に実行されること。');
			strictEqual(rows.length, 1, '1件取得できること。');

			db.select(TABLE_NAME, '*', tx).where({
				col1: 20
			}).execute().done(function(rows) {
				strictEqual(seqNo++, 3, 'done2 3番目に実行されること。');
				strictEqual(rows.length, 1, '1件取得できること。');
				start();
			}).progress(function(rows, tx2) {
				strictEqual(seqNo++, 2, 'progress2 2番目に実行されること。');
				strictEqual(rows.length, 1, '1件取得できること。');
			});
		}).fail(function(error) {
			ok(false, '取得失敗 message:' + error.message);
			start();
		});
	});

	asyncTest('execute()を2回呼び出す', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var select = db.select(TABLE_NAME, '*').where({
			col1: 10
		});

		select.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			select.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
				start();
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('execute()を3回呼び出す', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var select = db.select(TABLE_NAME, '*').where({
			col1: 10
		});

		select.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			select.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);

				select.execute().fail(function(e2) {
					ok(true, '三回目のexecute()は、エラーとして処理されること');
					equal(e2.code, ERR.ERR_CODE_RETRY_SQL, e2.code + ': ' + e2.message);
					start();
				}).done(function() {
					ok(false, 'エラーが発生していないためテスト失敗');
				});
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('execute()を2回呼び出す 2', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var select = db.select(TABLE_NAME, '*').where({
			col1: 10
		});

		select.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		select.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	asyncTest('execute()を3回呼び出す 2', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var select = db.select(TABLE_NAME, '*').where({
			col1: 10
		});

		select.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		select.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});

		select.execute().fail(function(e) {
			ok(true, '三回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	//=============================
	// Definition
	//=============================

	module('[browser#ie:all|ie-wp:all|ff:all]H5Api - Web SQL Database - Transaction', {
		setup: setupFunc,
		teardown: dropTable
	});

	//=============================
	// Body
	//=============================

	asyncTest('3件SQLをaddして実行', 15, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}
		db.transaction().add(
				db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['txtest', 10, 20000]))
				.add(db.insert(TABLE_NAME, {
					col1: 'txtest2',
					col2: 'rerere',
					col3: 777
				})).add(db.select(TABLE_NAME, ['col1', 'col2']).where({
					'col3': 20000
				})).add(db.update(TABLE_NAME, {
					col1: 'txtest更新'
				}).where({
					col2: 'rerere'
				})).execute().done(
						function(rs) {
							strictEqual(rs[0].rows.length, 0,
									'配列の0番目に、db.sql()の実行結果(ResultSet)が格納されていること。');
							strictEqual(rs[0].insertId, 1,
									'配列の0番目に、db.sql()の実行結果(insertId)が格納されていること。');
							strictEqual(rs[0].rowsAffected, 1,
									'配列の0番目に、db.sql()の実行結果(rowsAffected)が格納されていること。');
							deepEqual(rs[1], [2],
									'配列の1番目に、db.insert()の実行結果(insertIdを保持する配列)が格納されていること。');
							deepEqual(rs[2].item(0), {
								col1: 'txtest',
								col2: 10
							}, '配列の2番目に、db.select()の実行結果(rows)が格納されていること。');
							strictEqual(rs[3], 1,
									'配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
							strictEqual(arguments.length, 1, '引数は1つであること。');

							db.select(TABLE_NAME, '*').execute().done(
									function(rs) {
										strictEqual(rs.length, 2,
												'db.transaction()で2件登録したので、テーブルには2件レコードが存在すること。');
										start();
									});
						}).progress(
						function(rs, tx) {
							strictEqual(rs[0].rows.length, 0,
									'配列の0番目に、db.sql()の実行結果(ResultSet)が格納されていること。');
							strictEqual(rs[0].insertId, 1,
									'配列の0番目に、db.sql()の実行結果(insertId)が格納されていること。');
							strictEqual(rs[0].rowsAffected, 1,
									'配列の0番目に、db.sql()の実行結果(rowsAffected)が格納されていること。');
							deepEqual(rs[1], [2],
									'配列の1番目に、db.insert()の実行結果(insertIdを保持する配列)が格納されていること。');
							deepEqual(rs[2].item(0), {
								col1: 'txtest',
								col2: 10
							}, '配列の2番目に、db.select()の実行結果(rows)が格納されていること。');
							strictEqual(rs[3], 1,
									'配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
							ok(tx._db && tx._tx && tx._tasks, '第二引数はトランザクションであること。');
						}).fail(function() {
					ok(false, 'db.transaction()テスト失敗。');
				});
	});

	asyncTest(
			'progressのtxにSQLをaddして実行',
			13,
			function() {
				if (!h5.api.sqldb.isSupported) {
					expect(1);
					ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
					start();
					return;
				}

				db
						.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)',
								['txtest', 10, 20000])
						.execute()
						.progress(
								function(rs, tx) {
									var sql = db.sql('INSERT INTO ' + TABLE_NAME
											+ ' VALUES (?, ?, ?)', ['txtest', 10, 20000]);
									var ins = db.insert(TABLE_NAME, {
										col1: 'txtest2',
										col2: 'rerere',
										col3: 777
									});
									var sel = db.select(TABLE_NAME, ['col1', 'col2']).where({
										'col3': 20000
									});
									var upd = db.update(TABLE_NAME, {
										col1: 'txtest更新'
									}).where({
										col2: 'rerere'
									});
									tx
											.add(sql)
											.add(ins)
											.add(sel)
											.add(upd)
											.execute()
											.progress(
													function(rs2, tx2) {
														strictEqual(rs2[0].rows.length, 0,
																'配列の0番目に、db.sql()の実行結果(ResultSet)が格納されていること。');
														strictEqual(rs2[0].insertId, 2,
																'配列の0番目に、db.sql()の実行結果(insertId)が格納されていること。');
														strictEqual(rs2[0].rowsAffected, 1,
																'配列の0番目に、db.sql()の実行結果(rowsAffected)が格納されていること。');
														deepEqual(rs2[1], [3],
																'配列の1番目に、db.insert()の実行結果(insertIdを保持する配列)が格納されていること。');
														deepEqual(rs2[2].item(0), {
															col1: 'txtest',
															col2: 10
														},
																'配列の2番目に、db.select()の実行結果(rows)が格納されていること。');
														strictEqual(rs2[3], 1,
																'配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
														ok(tx._db && tx._tx && tx._tasks,
																'第二引数はトランザクションであること。');
													})
											.done(
													function(rs2) {
														strictEqual(rs2[0].rows.length, 0,
																'配列の0番目に、db.sql()の実行結果(ResultSet)が格納されていること。');
														strictEqual(rs2[0].insertId, 2,
																'配列の0番目に、db.sql()の実行結果(insertId)が格納されていること。');
														strictEqual(rs2[0].rowsAffected, 1,
																'配列の0番目に、db.sql()の実行結果(rowsAffected)が格納されていること。');
														deepEqual(rs2[1], [3],
																'配列の1番目に、db.insert()の実行結果(insertIdを保持する配列)が格納されていること。');
														deepEqual(rs2[2].item(0), {
															col1: 'txtest',
															col2: 10
														},
																'配列の2番目に、db.select()の実行結果(rows)が格納されていること。');
														strictEqual(rs2[3], 1,
																'配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
														start();
													});
								}).fail(function() {
							ok(false, 'db.transaction()テスト失敗。');
						});
			});

	asyncTest('promise()で、execute()を呼ぶ前にpromiseオブジェクトを受け取れること。', 2, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var tx = db.transaction();
		var promise = tx.promise();

		promise.done(function() {
			ok(true, '先に受け取ったpromiseオブジェクトに登録したdoneコールバックが実行されること');
		}).fail(function(e) {
			ok(false, e.code + ': ' + e.message);
		});

		tx.add(db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['txtest', 10, 20000]))
				.execute().done(function() {
					ok(true, 'execute()記述時に登録したdoneコールバックが実行されること');
					start();
				}).fail(function(e) {
					ok(false, 'テスト失敗');
				});
	});


	asyncTest('execute()実行済みのオブジェクトで再度execute()を実行', 2, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var tx = db.transaction();

		tx.add(db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['txtest', 10, 20000]))
				.execute().done(function() {
					ok(true, 'execute()記述時に登録したdoneコールバックが実行されること。');
					start();
				}).fail(function(e) {
					ok(false, 'テスト失敗');
					start();
				});

		tx.add(db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['txtest2', 10, 20000]))
				.execute().fail(function() {
					ok(true, 'execute()が既に実行されていたらエラー。fail()で処理されること。');
				}).done(function() {
					ok(false, 'テスト失敗');
				});
	});

	asyncTest('3件中1件不正なSQLをaddして実行', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var errorCode = ERR.ERR_CODE_TRANSACTION_PROCESSING_FAILURE;

		db.transaction().add(
				db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['txtest', 10, 20000]))
				.add(db.insert(TABLE_NAME, {
					col1: 'txtest2',
					col2: 'rerere',
					col3: 777
				})).add(db.select(TABLE_NAME, ['col1', 'col12']).where({
					'col3': 20000
				})).add(db.update(TABLE_NAME, {
					col1: 'txtest更新'
				}).where({
					col2: 'rerere'
				})).execute().done(function(rs) {
					ok(false, 'db.transaction()テスト失敗。');
					start();
				}).progress(function(rs, tx) {
					ok(false, 'db.transaction()テスト失敗。');
				}).fail(function(e) {
					ok(e, 'SQLの実行に失敗してfail()で処理されること。');
					strictEqual(e.code, errorCode, 'エラーコードが格納されていること。');
					ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
					ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');

					db.select(TABLE_NAME, '*').execute().done(function(rs) {
						strictEqual(rs.length, 0, 'ロールバックされているためレコードは0件であること。');
						start();
					});
				});
	});


	test('Insert/Update/Del/Select/Sqlクラスのインスタンス以外のものをadd()するとエラーが発生すること。', 10, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}

		// db.transaction()はStatementクラスのオブジェクトではないのでadd()には追加できない
		var args = [, undefined, null, 0, 1, '', 'a', new String(), {}, db.transaction()];
		expect(args.length);

		for ( var i = 0; i < args.length; i++) {
			try {
				db.transaction().add(args[i]);
			} catch (e) {
				deepEqual(e.code, ERR.ERR_CODE_INVALID_TRANSACTION_TARGET, args[i] + ': '
						+ e.message);
			}
		}
	});



	asyncTest(
			'3件SQLをaddしたdb.transaction()を実行後、別トランザクションで、2件SQLをaddしたdb.transaction()を実行する。',
			29,
			function() {
				if (!h5.api.sqldb.isSupported) {
					expect(1);
					ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
					start();
					return;
				}

				var seqNo = 1;

				db
						.transaction()
						.add(
								db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', [
										'txtest', 10, 20000]))
						.add(db.insert(TABLE_NAME, {
							col1: 'txtest2',
							col2: 'rerere',
							col3: 777
						}))
						.add(db.select(TABLE_NAME, ['col1', 'col2']).where({
							'col3': 20000
						}))
						.add(db.update(TABLE_NAME, {
							col1: 'txtest更新'
						}).where({
							col2: 'rerere'
						}))
						.execute()
						.progress(
								function(rs, tx) {
									strictEqual(seqNo++, 1, 'progress1: 1番目に実行されること。');
									strictEqual(rs[0].rows.length, 0,
											'progress1: 配列の0番目に、db.sql()の実行結果(ResultSet)が格納されていること。');
									strictEqual(rs[0].insertId, 1,
											'progress1: 配列の0番目に、db.sql()の実行結果(insertId)が格納されていること。');
									strictEqual(rs[0].rowsAffected, 1,
											'progress1: 配列の0番目に、db.sql()の実行結果(rowsAffected)が格納されていること。');
									deepEqual(rs[1], [2],
											'progress1: 配列の1番目に、db.insert()の実行結果(insertIdを保持する配列)が格納されていること。');
									deepEqual(rs[2].item(0), {
										col1: 'txtest',
										col2: 10
									}, 'progress1: 配列の2番目に、db.select()の実行結果(rows)が格納されていること。');
									strictEqual(rs[3], 1,
											'progress1: 配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
									ok(tx._db && tx._tx && tx._tasks,
											'progress1: 第二引数はトランザクションであること。');
								})
						.fail(function() {
							ok(false, 'db.transaction()テスト失敗。');
						})
						.done(
								function(rs) {
									strictEqual(seqNo++, 2, 'done1: 2番目に実行されること。');
									strictEqual(rs[0].rows.length, 0,
											'done1: 配列の0番目に、db.sql()の実行結果(ResultSet)が格納されていること。');
									strictEqual(rs[0].insertId, 1,
											'done1: 配列の0番目に、db.sql()の実行結果(insertId)が格納されていること。');
									strictEqual(rs[0].rowsAffected, 1,
											'done1: 配列の0番目に、db.sql()の実行結果(rowsAffected)が格納されていること。');
									deepEqual(rs[1], [2],
											'done1: 配列の1番目に、db.insert()の実行結果(insertIdを保持する配列)が格納されていること。');
									deepEqual(rs[2].item(0), {
										col1: 'txtest',
										col2: 10
									}, 'done1: 配列の2番目に、db.select()の実行結果(rows)が格納されていること。');
									strictEqual(rs[3], 1,
											'done1: 配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
									strictEqual(arguments.length, 1, 'done1: 引数は1つであること。');

									db
											.transaction()
											.add(db.update(TABLE_NAME, {
												col1: 'txtest更新2'
											}).where({
												col2: 'rerere'
											}))
											.add(db.select(TABLE_NAME, ['col1', 'col3']).where({
												col2: 'rerere'
											}))
											.execute()
											.progress(
													function(rs, tx) {
														strictEqual(seqNo++, 3,
																'progress2: 3番目に実行されること。');

														strictEqual(rs[0], 1,
																'progress2: 配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
														strictEqual(rs[1].length, 1,
																'progress2: 配列の3番目に、db.select()の実行結果(rows)が格納されていること。');
														strictEqual(rs[1].item(0).col1,
																'txtest更新2',
																'progress2: db.select()のResultSetからcol1の結果が取得できること。');
														strictEqual(rs[1].item(0).col3, 777,
																'progress2: db.select()のResultSetからcol3の結果が取得できること。');
														ok(tx._db && tx._tx && tx._tasks,
																'progress2: 第二引数はトランザクションであること。');
														strictEqual(arguments.length, 2,
																'progress2: 引数は2つであること。');
													})
											.done(
													function(rs) {
														strictEqual(seqNo++, 4,
																'done2: 4番目に実行されること。');

														strictEqual(rs[0], 1,
																'done2: 配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
														strictEqual(rs[1].length, 1,
																'done2: 配列の3番目に、db.select()の実行結果(rows)が格納されていること。');
														strictEqual(rs[1].item(0).col1,
																'txtest更新2',
																'done2: db.select()のResultSetからcol1の結果が取得できること。');
														strictEqual(rs[1].item(0).col3, 777,
																'done2: db.select()のResultSetからcol3の結果が取得できること。');
														strictEqual(arguments.length, 1,
																'done2: 引数は1つであること。');

														start();
													});




								});
			});


	asyncTest(
			'3件SQLをaddしたdb.transaction()を実行後、同一トランザクションで、2件SQLをaddしたdb.transaction()を実行する。',
			30,
			function() {
				if (!h5.api.sqldb.isSupported) {
					expect(1);
					ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
					start();
					return;
				}

				var seqNo = 1;

				db
						.transaction()
						.add(
								db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', [
										'txtest', 10, 20000]))
						.add(db.insert(TABLE_NAME, {
							col1: 'txtest2',
							col2: 'rerere',
							col3: 777
						}))
						.add(db.select(TABLE_NAME, ['col1', 'col2']).where({
							'col3': 20000
						}))
						.add(db.update(TABLE_NAME, {
							col1: 'txtest更新'
						}).where({
							col2: 'rerere'
						}))
						.execute()
						.progress(
								function(rs, tx) {
									strictEqual(seqNo++, 1, 'progress1: 1番目に実行されること。');
									strictEqual(rs[0].rows.length, 0,
											'progress1: 配列の0番目に、db.sql()の実行結果(ResultSet)が格納されていること。');
									strictEqual(rs[0].insertId, 1,
											'progress1: 配列の0番目に、db.sql()の実行結果(insertId)が格納されていること。');
									strictEqual(rs[0].rowsAffected, 1,
											'progress1: 配列の0番目に、db.sql()の実行結果(rowsAffected)が格納されていること。');
									deepEqual(rs[1], [2],
											'progress1: 配列の1番目に、db.insert()の実行結果(insertIdを保持する配列)が格納されていること。');
									deepEqual(rs[2].item(0), {
										col1: 'txtest',
										col2: 10
									}, 'progress1: 配列の2番目に、db.select()の実行結果(rows)が格納されていること。');
									strictEqual(rs[3], 1,
											'progress1: 配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
									ok(tx._db && tx._tx && tx._tasks,
											'progress1: 第二引数はトランザクションであること。');


									db
											.transaction(tx)
											.add(db.update(TABLE_NAME, {
												col1: 'txtest更新2'
											}).where({
												col2: 'rerere'
											}))
											.add(db.select(TABLE_NAME, ['col1', 'col3']).where({
												col2: 'rerere'
											}))
											.execute()
											.progress(
													function(rs, tx) {
														strictEqual(seqNo++, 2,
																'progress2: 2番目に実行されること。');
														strictEqual(rs[0], 1,
																'progress2: 配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
														strictEqual(rs[1].length, 1,
																'progress2: 配列の3番目に、db.select()の実行結果(rows)が格納されていること。');
														strictEqual(rs[1].item(0).col1,
																'txtest更新2',
																'progress2: db.select()のResultSetからcol1の結果が取得できること。');
														strictEqual(rs[1].item(0).col3, 777,
																'progress2: db.select()のResultSetからcol3の結果が取得できること。');
														ok(tx._db && tx._tx && tx._tasks,
																'progress2: 第二引数はトランザクションであること。');
														strictEqual(arguments.length, 2,
																'progress2: 引数は2つであること。');
													})
											.done(
													function(rs) {
														strictEqual(seqNo++, 3,
																'done2: 3番目に実行されること。');
														strictEqual(rs[0], 1,
																'done2: 配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
														strictEqual(rs[1].length, 1,
																'done2: 配列の3番目に、db.select()の実行結果(rows)が格納されていること。');
														strictEqual(rs[1].item(0).col1,
																'txtest更新2',
																'done2: db.select()のResultSetからcol1の結果が取得できること。');
														strictEqual(rs[1].item(0).col3, 777,
																'done2: db.select()のResultSetからcol3の結果が取得できること。');
														strictEqual(arguments.length, 1,
																'done2: 引数は1つであること。');
													});

								})
						.fail(function() {
							ok(false, 'db.transaction()テスト失敗。');
						})
						.done(
								function(rs) {
									strictEqual(seqNo++, 4, 'done1: 4番目に実行されること。');
									strictEqual(rs[0].rows.length, 0,
											'done1: 配列の0番目に、db.sql()の実行結果(ResultSet)が格納されていること。');
									strictEqual(rs[0].insertId, 1,
											'done1: 配列の0番目に、db.sql()の実行結果(insertId)が格納されていること。');
									strictEqual(rs[0].rowsAffected, 1,
											'done1: 配列の0番目に、db.sql()の実行結果(rowsAffected)が格納されていること。');
									deepEqual(rs[1], [2],
											'done1: 配列の1番目に、db.insert()の実行結果(insertIdを保持する配列)が格納されていること。');
									deepEqual(rs[2].item(0), {
										col1: 'txtest',
										col2: 10
									}, 'done1: 配列の2番目に、db.select()の実行結果(rows)が格納されていること。');
									strictEqual(rs[3], 1,
											'done1: 配列の3番目に、db.update()の実行結果(rowsAffected)が格納されていること。');
									strictEqual(arguments.length, 1, 'done1: 引数は1つであること。');

									db.select(TABLE_NAME, '*').execute().done(function(rs) {
										strictEqual(rs.length, 2, '2件テーブルに登録されていること。');
										start();
									});
								});
			});


	asyncTest(
			'3件SQLをaddしたdb.transaction()を実行後、同一トランザクションで、2件中1件エラーのあるSQLをaddしたdb.transaction()を実行する。',
			9, function() {
				if (!h5.api.sqldb.isSupported) {
					expect(1);
					ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
					start();
					return;
				}

				var seqNo = 1;
				var errorCode = ERR.ERR_CODE_TRANSACTION_PROCESSING_FAILURE;

				db.transaction().add(
						db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['txtest', 10,
								20000])).add(db.insert(TABLE_NAME, {
					col1: 'txtest2',
					col2: 'rerere',
					col3: 777
				})).add(db.select(TABLE_NAME, ['col1', 'col2']).where({
					'col3': 20000
				})).add(db.update(TABLE_NAME, {
					col1: 'txtest更新'
				}).where({
					col2: 'rerere'
				})).execute().progress(function(rs, tx) {
					db.transaction(tx).add(db.update(TABLE_NAME, {
						col1: 'txtest更新2'
					}).where({
						col2: 'rerere'
					})).add(db.select(TABLE_NAME, ['col11', 'col3']).where({ // エラーSQL
						col2: 'rerere'
					})).execute().fail(function(e) {
						strictEqual(seqNo++, 1, 'fail2: 1番目に実行されること。');

						strictEqual(e.code, errorCode, 'エラーコードが格納されていること。');
						ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
						ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');
					});

				}).fail(function(e) {
					strictEqual(seqNo++, 2, 'fail1: 2番目に実行されること。');
					strictEqual(e.code, errorCode, 'エラーコードが格納されていること。');
					ok(e.detail.message, 'detailにはSQLErrorのメッセージが格納されていること。');
					ok(e.detail.message, 'detailにはSQLErrorのエラーコードが格納されていること。');

					db.select(TABLE_NAME, '*').execute().done(function(rs) {
						strictEqual(rs.length, 0, 'ロールバックされているためレコードは0件であること。');
						start();
					});
				});
			});

	asyncTest('execute()を2回呼び出す', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var transaction = db.transaction().add(
				db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['txtest', 10, 20000]))
				.add(db.insert(TABLE_NAME, {
					col1: 'txtest2',
					col2: 'rerere',
					col3: 777
				}));

		transaction.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			transaction.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
				start();
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('execute()を3回呼び出す', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var transaction = db.transaction().add(
				db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['txtest', 10, 20000]))
				.add(db.insert(TABLE_NAME, {
					col1: 'txtest2',
					col2: 'rerere',
					col3: 777
				}));

		transaction.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');

			transaction.execute().fail(function(e) {
				ok(true, '二回目のexecute()は、エラーとして処理されること');
				equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);

				transaction.execute().fail(function(e2) {
					ok(true, '三回目のexecute()は、エラーとして処理されること');
					equal(e2.code, ERR.ERR_CODE_RETRY_SQL, e2.code + ': ' + e2.message);
					start();
				}).done(function() {
					ok(false, 'エラーが発生していないためテスト失敗');
				});
			}).done(function() {
				ok(false, 'エラーが発生していないためテスト失敗');
			});
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生しました。' + e.code + ': ' + e.message);
			start();
		});
	});

	asyncTest('execute()を2回呼び出す 2', 3, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var transaction = db.transaction().add(
				db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['txtest', 10, 20000]))
				.add(db.insert(TABLE_NAME, {
					col1: 'txtest2',
					col2: 'rerere',
					col3: 777
				}));

		transaction.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		transaction.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	asyncTest('execute()を3回呼び出す 2', 5, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var transaction = db.transaction().add(
				db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['txtest', 10, 20000]))
				.add(db.insert(TABLE_NAME, {
					col1: 'txtest2',
					col2: 'rerere',
					col3: 777
				}));

		transaction.execute().done(function() {
			ok(true, '一回目のexecute()ではエラーが発生しないこと');
			start();
		}).fail(function(e) {
			ok(false, '一回目のexecute()でエラーが発生したため、テスト失敗。' + e.code + ': ' + e.message);
			start();
		});

		transaction.execute().fail(function(e) {
			ok(true, '二回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});

		transaction.execute().fail(function(e) {
			ok(true, '三回目のexecute()は、エラーとして処理されること');
			equal(e.code, ERR.ERR_CODE_RETRY_SQL, e.code + ': ' + e.message);
		}).done(function() {
			ok(false, 'エラーが発生していないためテスト失敗');
		});
	});

	//=============================
	// Definition
	//=============================

	module('[browser#ie:all|ie-wp:all|ff:all]H5Api - Web SQL Database', {
		setup: setupFunc,
		teardown: dropTable
	});

	//=============================
	// Body
	//=============================

	asyncTest('トランザクションを引き継がないでCRUDを実行', 9, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		// db.insert
		db.insert(TABLE_NAME, {
			col1: 'テスト',
			col2: 'aaa',
			col3: 10
		}).execute().done(function(result) {
			deepEqual(result, [1], 'db.insert() 1件登録されること。'); // rowid=1
			// db.select
			db.select(TABLE_NAME, ['col1', 'col3']).where({
				'col3 =': 10
			}).execute().done(function(result) {
				deepEqual(result.item(0), {
					col1: 'テスト',
					col3: 10
				}, 'db.select() 1件取得できること。');
				// db.update 更新失敗
				db.update(TABLE_NAME, {
					col1: '更新1'
				}).where({
					col99: 'zzzzz'
				}).execute().done(function(result) {
					ok(false, 'db.update() テスト失敗');
				}).progress(function(result, tx) {
					ok(false, 'db.update() テスト失敗');
				}).fail(function(error) {
					ok(error, 'db.update() 更新されずfail()で処理されること。');

					// db.update 更新成功
					db.update(TABLE_NAME, {
						col1: '更新2'
					}).where({
						col1: 'テスト'
					}).execute().done(function(result) {
						strictEqual(result, 1, '1件更新されること。');

						// db.del 削除失敗
						db.del(TABLE_NAME).where({
							col99: 'aaaaaa'
						}).execute().done(function(result) {
							ok(false, 'db.del()1 テスト失敗');
						}).progress(function(result, tx) {
							ok(false, 'db.del()1 テスト失敗');
						}).fail(function(error) {
							ok(error, 'db.del()1 削除されずfail()で処理されること。');

							// db.del 削除成功
							db.del(TABLE_NAME).where({
								col1: '更新2'
							}).execute().done(function(result) {
								strictEqual(result, 1, 'db.del()2 done() 1件削除されること。');
								start();
							}).progress(function() {
								strictEqual(result, 1, 'db.del()2 progress() 1件削除されること。');
							}).fail(function() {
								ok(false, 'db.del()2 テスト失敗');
							});
						});
					});
				});
			}).progress(function(result) {
				deepEqual(result.item(0), {
					col1: 'テスト',
					col3: 10
				}, 'db.select() 1件取得できること。');
			}).fail(function() {
				ok(false, 'db.select() テスト失敗');
			});
		}).progress(function(result) {
			deepEqual(result, [1], 'db.insert() 1件登録されること。'); // rowid=3
		}).fail(function() {
			ok(false, 'db.insert() テスト失敗');
		});
	});

	test('異なるデータベースのバージョンをオープンする', 1, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}
		try {
			h5.api.sqldb.open('hcdb', '0.9', 'hcdb', 2 * 1024 * 1024);
			ok(false, "エラーが発生していません");
		} catch (e) {
			ok(true, e.code + ": " + e.message);
		}
	});

	test('select()/insert()/update()/del()/sql() - String型以外の値をテーブル名を指定する', 4, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			return;
		}

		var errorCode = ERR.ERR_CODE_INVALID_TABLE_NAME;
		try {
			db.select(null, '*');
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(errorCode, e.code, e.message);
		}
		try {
			insert = db.insert(123, {
				col1: 10,
				col2: 'hoge1',
				col3: 'test'
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(errorCode, e.code, e.message);
		}
		try {
			update = db.update(new String(TABLE_NAME), {
				col2: 'hoge',
				col3: 80.5
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(errorCode, e.code, e.message);
		}
		try {
			del = db.del({
				table: TABLE_NAME
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(errorCode, e.code, e.message);
		}
	});

	test(
			'select()/insert()/update()/del()/sql()/transaction() - TransactionalExecutor型以外の値をトランザクションに指定する',
			5, function() {
				if (!h5.api.sqldb.isSupported) {
					expect(1);
					ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
					return;
				}

				var errorCode = ERR.ERR_CODE_INVALID_TRANSACTION_TYPE;
				try {
					db.select(TABLE_NAME, '*', '');
					ok(false, 'エラーが発生していません');
				} catch (e) {
					deepEqual(e.code, errorCode, e.message);
				}
				try {
					insert = db.insert(TABLE_NAME, {
						col1: 10,
						col2: 'hoge1',
						col3: 'test'
					}, 0);
					ok(false, 'エラーが発生していません');
				} catch (e) {
					deepEqual(e.code, errorCode, e.message);
				}
				try {
					update = db.update(TABLE_NAME, {
						col2: 'hoge',
						col3: 80.5
					}, {});
					ok(false, 'エラーが発生していません');
				} catch (e) {
					deepEqual(e.code, errorCode, e.message);
				}
				try {
					del = db.sql('INSERT INTO ' + TABLE_NAME + ' VALUES (?, ?, ?)', ['abc', 10,
							20000], []);
					ok(false, 'エラーが発生していません');
				} catch (e) {
					deepEqual(e.code, errorCode, e.message);
				}
				try {
					del = db.transaction(NaN);
					ok(false, 'エラーが発生していません');
				} catch (e) {
					deepEqual(e.code, errorCode, e.message);
				}
			});

	asyncTest('スタブを使ったテスト。各エラーを取得する', 24, function() {
		if (!h5.api.sqldb.isSupported) {
			expect(1);
			ok(false, 'このブラウザはWeb SQL Databaseをサポートしていません。');
			start();
			return;
		}

		var origin = window.openDatabase;

		var SQLError = function(code, message) {
			this.UNKNOWN_ERR = 0;
			this.DATABASE_ERR = 1;
			this.VERSION_ERR = 2;
			this.TOO_LARGE_ERR = 3;
			this.QUOTA_ERR = 4;
			this.SYNTAX_ERR = 5;
			this.CONSTRAINT_ERR = 6;
			this.TIMEOUT_ERR = 7;
			this.code = code;
			this.message = message;
		};

		// メッセージはネイティブだとユーザの言語で入る（とW3Cに書かれている)。
		// ここでは空でない何かしらの文字列を入れている。
		var errs = [new SQLError(0, '不明なエラー'), new SQLError(1, 'データベースエラー'),
				new SQLError(2, 'バージョンエラー'), new SQLError(3, '取得結果のサイズが多すぎるエラー'),
				new SQLError(4, '空き容量不足エラー'), new SQLError(5, '構文エラー'), new SQLError(6, '一意制約エラー'),
				new SQLError(7, 'タイムアウトエラー')];


		function loop(i) {
			if (i === errs.length) {
				window.openDatabase = origin;
				start();
				return;
			}

			window.openDatabase = function() {
				return {
					transaction: function(param1, param2, param3) {
						param1({
							executeSql: function() {}
						});
						param2(errs[i]);
					}
				};
			};
			var dbDummy = h5.api.sqldb.open('hcdb', '1', 'hcdb', 2 * 1024 * 1024);

			var s = dbDummy.sql('insert into ' + TABLE_NAME + ' values(1,1,1)');
			s.execute().fail(
					function(e) {
						strictEqual(e.code, ERR.ERR_CODE_TRANSACTION_PROCESSING_FAILURE,
								'エラーコードが格納されていること。');
						ok(e.detail.code != null, 'エラーコード:' + e.detail.code
								+ ' detailにはSQLErrorのメッセージが格納されていること。');
						ok(e.detail.message != null, e.detail.message);
						loop(++i);
					});
		}
		loop(0);
	});
});
