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

function Select() {
	//
}
function Insert() {
	//
}
function Update() {
	//
}
function Del() {
	//
}
function Sql() {
	//
}

/**
 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します
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
Select.prototype.execute = function() {
	//
};

/**
 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します
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
Insert.prototype.execute = function() {
	//
};

/**
 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します
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
Update.prototype.execute = function() {
	//
};

/**
 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します
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
Del.prototype.execute = function() {
	//
};

/**
 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します
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
Sql.prototype.execute = function() {
	//
};


