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
// JsDocのための定義.実際には使用しない.
/**
 * ロジッククラス
 *
 * @name Logic
 * @class
 */

/**
 * ロジック名
 *
 * @memberOf Logic
 * @type {string}
 * @name __name
 */

/**
 * ロジックのライフサイクル __construct
 * <p>
 * ロジック生成時に実行されるライフサイクルメソッドの一つ。ロジック定義オブジェクトの__constructに関数を記述することで動作する。 指定はオプションであり、記述しなくてもよい。
 * </p>
 * <p>
 * ロジック生成時のライフサイクルメソッドは{@link Logic.__construct}, {@link Logic.__ready}の順序で動作する。
 * </p>
 * <p>
 * ロジックの__constructはロジック化されたタイミングで実行される。
 * </p>
 * <p>
 * ロジックツリー上においては親からロジック化されるため、親の__constructが子の__constructより先に実行される。
 * </p>
 *
 * @memberOf Logic
 * @type {function}
 * @name __construct
 */

/**
 * ロジックのライフサイクル __ready
 * <p>
 * ロジック生成時に実行されるライフサイクルメソッドの一つ。ロジック定義オブジェクトの__readyに関数を記述することで動作する。 指定はオプションであり、記述しなくてもよい。
 * </p>
 * <p>
 * ロジック生成時のライフサイクルメソッドは{@link Logic.__construct}, {@link Logic.__ready}の順序で動作する。
 * </p>
 * <p>
 * ロジックの__readyはロジックツリー上の全ての依存関係が解決して__constructが実行済みかつ、ロジックツリーにおける自分より下のロジックの__readyが実行済みのタイミングで実行される。
 * </p>
 * <p>
 * つまりロジックツリー上においては子の__readyが親の__readyより先に実行される。
 * </p>
 *
 * @memberOf Logic
 * @type {function}
 * @name __ready
 */

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

/**
 * Deferredオブジェクトを生成するメソッドです。
 * <p>
 * 詳細は<a href="h5.async.html#deferred">h5.async.deferred</a>をご覧ください。
 * </p>
 *
 * @name deferred
 * @returns {Deferred} Deferredオブジェクト
 * @memberOf Logic
 */

/**
 * 指定された関数に対して、コンテキスト(this)をロジックに変更して実行する関数を返します。
 *
 * @name own
 * @param {Function} func 関数
 * @return {Function} コンテキスト(this)をロジックに変更した関数
 * @memberOf Logic
 */

/**
 * 指定された関数に対して、コンテキスト(this)をロジックに変更し、元々のthisを第1引数に加えて実行する関数を返します。
 *
 * @name ownWithOrg
 * @param {Function} func 関数
 * @return {Function} コンテキスト(this)をロジックに変更し、元々のthisを第1引数に加えた関数
 * @memberOf Logic
 */
