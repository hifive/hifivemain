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
// JsDocのための定義.実際には使用しない.
/**
 * ロジッククラス
 *
 * @name Logic
 * @class
 */
function Logic() {
	/**
	 * ロジックのロガーを返します。
	 * <p>
	 * ロジック内のメソッドで<code>this.log.debug('debug message');</code>のように記述して使用します。ロガーの使い方の詳細は<a
	 * href="Log.html">Log</a>をご覧ください。
	 * </p>
	 *
	 * @type Log
	 * @memberOf Logic
	 * @name log
	 */
	this.log = log;
}
/**
 * Deferredオブジェクトを生成するメソッドです。
 * <p>
 * 詳細は<a href="h5.async.html#deferred">h5.async.deferred</a>をご覧ください。
 * </p>
 *
 * @returns {Deferred} Deferredオブジェクト
 * @memberOf Logic
 */
Logic.prototype.deferred = function() {};


/**
 * 指定された関数に対して、コンテキスト(this)をロジックに変更して実行する関数を返します。
 *
 * @param {Function} func 関数
 * @return {Function} コンテキスト(this)をロジックに変更した関数
 * @memberOf Logic
 */
Logic.prototype.own = function(func) {};

/**
 * 指定された関数に対して、コンテキスト(this)をロジックに変更し、元々のthisを第1引数に加えて実行する関数を返します。
 *
 * @param {Function} func 関数
 * @return {Function} コンテキスト(this)をロジックに変更し、元々のthisを第1引数に加えた関数
 * @memberOf Logic
 */
Logic.prototype.ownWithOrg = function(func) {};