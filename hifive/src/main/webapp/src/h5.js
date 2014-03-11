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

/* ------ (h5) ------ */
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

	/* del begin */

	/* del end */


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
	 * すべてのアスペクト設定をコンパイルします。
	 *
	 * @param {Object|Object[]} aspects アスペクト設定
	 */
	function compileAspects(aspects) {
		var compile = function(aspect) {
			if (aspect.target) {
				aspect.compiledTarget = getRegex(aspect.target);
			}
			if (aspect.pointCut) {
				aspect.compiledPointCut = getRegex(aspect.pointCut);
			}
			return aspect;
		};
		h5.settings.aspects = $.map(wrapInArray(aspects), function(n) {
			return compile(n);
		});
	}


	/**
	 * h5.ajax()でリトライする時のデフォルトのフィルタ<br>
	 * <p>
	 * falseを返した場合はリトライしない。リトライする場合はリトライするajaxSettingsオブジェクト($.ajax()に渡すオブジェクト)を返す。
	 * type===GETかつステータスコードが0(タイムアウト)または12029(IEでコネクションが繋がらない)場合にリトライする。
	 * </p>
	 * <p>
	 * 引数は$.ajaxのfailコールバックに渡されるものが入る。 thisはajaxを呼んだ時の設定パラメータを含むajaxSettingsオブジェクト
	 * </p>
	 *
	 * @param {jqXHR} jqXHR jqXHRオブジェクト
	 * @param {String} textStatus
	 * @param {String} thrownError
	 * @returns {false|Object} リトライしない場合はfalseを返す。する場合はthis(ajaxSettingsオブジェクト)を返す
	 */
	function defaultAjaxRetryFilter(jqXHR, textStatus, thrownError) {
		// type===GETかつステータスコードが0(タイムアウト)または12029(IEでコネクションが繋がらない)場合にリトライする
		var stat = jqXHR.status;
		// jQuery1.9以降、GET,POSTの設定はtypeではなくmethodで指定することが推奨されているが、
		// thisにはtypeにtoUpperCase()されたものが格納されている
		var type = this.type;
		if (type === 'POST' || !(stat === 0 || stat === 12029)) {
			return false;
		}
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * 設定を格納するh5.settingsオブジェクト
	 *
	 * @name settings
	 * @memberOf h5
	 * @namespace
	 */
	h5.u.obj.ns('h5.settings');

	h5.settings = {

		/**
		 * failコールバックの設定されていないDeferred/Promiseオブジェクトの共通のエラー処理
		 * <p>
		 * failコールバックが一つも設定されていないDeferredオブジェクトがrejectされたときにcommonFailHandlerに設定した関数が実行されます。
		 * <p>
		 * <p>
		 * commonFailHandlerが実行されるDeferredオブジェクトは、h5.async.deferred()で作成したDeferredオブジェクトかhifive内部で生成されているDeferredオブジェクトだけです。
		 * jQuery.Deferred()で生成したDeferredオブジェクトは対象ではありません。
		 * </p>
		 * <p>
		 * commonFailHandlerの引数と関数内のthisは通常のfailハンドラと同様で、それぞれ、rejectで渡された引数、rejectの呼ばれたDefferedオブジェクト、です。
		 * </p>
		 * <h4>サンプル</h4>
		 *
		 * <pre>
		 * // commonFailHandlerの登録
		 * h5.settings.commonFailHandler = function(e) {
		 * 	alert(e);
		 * };
		 *
		 * // Deferredオブジェクトの生成
		 * var dfd1 = h5.async.deferred();
		 * var dfd2 = h5.async.deferred();
		 * var dfd3 = h5.async.deferred();
		 *
		 * dfd1.reject(1);
		 * // alert(1); が実行される
		 *
		 * dfd2.fail(function() {});
		 * dfd2.reject(2);
		 * // failコールバックが登録されているので、commonFailHandlerは実行されない
		 *
		 * var promise3 = dfd3.promise();
		 * promise3.fail(function() {});
		 * dfd3.reject(3);
		 * // promiseオブジェクトからfailコールバックを登録した場合も、commonFailHandlerは実行されない
		 *
		 * h5.ajax('hoge');
		 * // 'hoge'へのアクセスがエラーになる場合、commonFailHandlerが実行される。
		 * // エラーオブジェクトが引数に渡され、[object Object]がalertで表示される。
		 * // h5.ajax()の戻り値であるDeferredオブジェクトが内部で生成されており、
		 * // そのDeferredオブジェクトにfailハンドラが登録されていないためである。
		 *
		 * var d = h5.ajax('hoge');
		 * d.fail(function() {});
		 * // failハンドラが登録されているため、commonFailHandlerは実行されない
		 * </pre>
		 *
		 * <h4>デフォルトの設定</h4>
		 * <p>
		 * h5.settings.commonFailHandlerのデフォルト値はnullです。共通のエラー処理はデフォルトでは何も実行されません。
		 * commonFailHandlerでの処理を止めたい場合は、nullを代入して設定をクリアしてください。
		 * </p>
		 *
		 * <pre>
		 * h5.settings.commonFailHandler = null;
		 * </pre>
		 *
		 * @memberOf h5.settings
		 * @type Function
		 */
		commonFailHandler: null,

		/**
		 * コントローラ、ロジックへのアスペクトを設定します。
		 *
		 * @memberOf h5.settings
		 * @type Aspect|Aspect[]
		 */
		aspects: null,

		/**
		 * ログの設定を行います。
		 *
		 * @memberOf h5.settings
		 * @type Object
		 */
		log: null,

		/**
		 * コントローラのイベントリスナーのターゲット要素（第2引数）をどの形式で渡すかを設定します。<br>
		 * <ul>
		 * <li>1 (default) : jQueryオブジェクト
		 * <li>0 : ネイティブ形式（DOM要素そのもの）
		 * </ul>
		 *
		 * @since 1.1.4
		 * @memberOf h5.settings
		 * @type Number
		 */
		listenerElementType: 1,

		/**
		 * コントローラに記述されたテンプレートの読み込み等、動的リソース読み込み時の設定を行います。<br>
		 * このプロパティはオブジェクトで、<code>h5.settings.dynamicLoading.retryCount = 3;</code>のようにして設定します。<br>
		 * dynamicLoadingで指定できるプロパティ：
		 * <dl>
		 * <dt>retryCount</dt>
		 * <dd>一時的な通信エラーが発生した場合に通信をリトライする回数（デフォルト：3）</dd>
		 * <dt>retryInterval</dt>
		 * <dd>一時的な通信エラーが発生した場合に通信をリトライするまでの待ち秒数（ミリ秒）。通信エラーが発生した場合、ここで指定した秒数待ってからリクエストを送信します。（デフォルト：500）</dd>
		 * </dl>
		 *
		 * @since 1.1.4
		 * @memberOf h5.settings
		 * @type Object
		 */
		dynamicLoading: {
			retryCount: 3,
			retryInterval: 500
		},

		/**
		 * h5.ajaxの設定<br>
		 * <p>
		 * このパラメータはオブジェクトで、以下のプロパティを持ちます
		 * </p>
		 * <dl>
		 * <dt>retryCount</dt>
		 * <dd>一時的な通信エラーが発生した場合に通信をリトライする回数。デフォルトは0で、リトライを行いません。</dd>
		 * <dt>retryInterval</dt>
		 * <dd>一時的な通信エラーが発生した場合に通信をリトライするまでの待ち秒数（ミリ秒）。
		 * <p>
		 * 通信エラーが発生した場合、ここで指定した秒数待ってからリクエストを送信します。デフォルトは500msです。
		 * 同期(async:false)でh5.ajaxを呼んだ場合はretryIntervalは無視され、即座にリトライします。 (同期で呼んだ場合は必ず結果が同期で返ってきます。)
		 * </p>
		 * </dd>
		 * <dt>retryFilter</dt>
		 * <dd> リトライ時に実行する関数を登録できます。
		 * <p>
		 * リトライが有効な場合、呼び出しが失敗した場合に呼ばれます。 (失敗か成功かは、jQuery.ajaxの結果に基づく。200番台、304番なら成功、それ以外は失敗。)
		 * </p>
		 * <p>
		 * retryFilterに設定した関数がfalseを返した場合はリトライを中止し、それ以外を返した場合はリトライを継続します。
		 * (retryCountに設定した回数だけリトライをしたら、retryFilterの戻り値に関わらずリトライを中止します。)
		 * </p>
		 * <p>
		 * デフォルトで設定してあるretryFilterは、「メソッドがGET、かつ、コネクションタイムアウトで失敗した場合のみリトライする」 ようになっています。
		 * </p>
		 * <p>
		 * この挙動を変えたい場合は、以下のようにしてretryFilter関数を差し替えます。
		 * </p>
		 * <code><pre>
		 * h5.settings.ajax.retryFilter = function(jqXHR, textStatus, thrownError) {
		 * 	// この関数のthisはh5.ajax()呼び出し時のパラメータオブジェクトです。
		 * 	// thisを見ると、メソッドがGETかPOSTか、等も分かります。
		 * 	console.log('Ajax呼び出し失敗。textStatus = ' + textStatus);
		 * 	return false; // 明示的にfalseを返した場合のみリトライを中止する
		 * }
		 * </pre></code> </dd>
		 * </dl>
		 * h5preinitのタイミングで設定すると、ユーザコード内のh5.ajaxの呼び出し全てに反映されます。 <code><pre>
		 * $(document).bind('h5preinit', function() {
		 * 	h5.settings.ajax = {
		 * 		retryCount: 3,
		 * 		retryInterval: 500,
		 * 		retryFilter: function(){...}
		 * 	};
		 * });
		 * </pre></code>
		 * <p>
		 * また、h5.ajax()の呼び出しパラメータで指定すると、呼び出しごとに設定を変えることもできます。 指定しなかったパラメータは<code>h5.settings.ajax</code>のパラメータが使われます。
		 * </p>
		 * <code><pre>
		 * h5.ajax({
		 * 	url: 'hoge',
		 * 	retryCount: 1
		 * });
		 * // この場合、retryCountだけ1になり、retryIntervalとretryFilterはsettingsのものが使われます。
		 * </pre></code>
		 *
		 * @since 1.1.5
		 * @memberOf h5.settings
		 * @type Object
		 */
		ajax: {
			retryCount: 0,
			retryInterval: 500,
			retryFilter: defaultAjaxRetryFilter
		}
	};

	// h5preinitでglobalAspectsの設定をしている関係上、別ファイルではなく、ここに置いている。

	/**
	 * メソッド呼び出し時に、コントローラまたはロジック名、メソッド名、引数をログ出力するインターセプタです。<br>
	 * このインターセプタはコントローラまたはロジックに対して設定してください。<br>
	 * ver.1.1.6以降、このインターセプタは処理時間も出力します。<br>
	 * 「処理時間」とは、メソッドの戻り値がPromiseでない場合は呼び出し～returnされるまでの時間、<br>
	 * 戻り値がPromiseだった場合は呼び出し～そのPromiseがresolveまたはrejectされるまでの時間です。
	 *
	 * @function
	 * @param {Function} invocation 次に実行する関数
	 * @returns {Any} invocationの戻り値
	 * @memberOf h5.core.interceptor
	 */
	var logInterceptor = h5.u.createInterceptor(function(invocation, data) {
		this.log.info('{0}.{1}が開始されました。', this.__name, invocation.funcName);
		this.log.info(invocation.args);

		data.start = new Date();

		return invocation.proceed();
	}, function(invocation, data) {
		var end = new Date();
		var time = end.getTime() - data.start.getTime();

		this.log.info('{0}.{1}が終了しました。 Time={2}ms', this.__name, invocation.funcName, time);
	});

	/**
	 * メソッドの実行時間を計測するインターセプタです。<br>
	 * このインターセプタはコントローラまたはロジックに対して設定してください。
	 *
	 * @deprecated ※このメソッドの代わりに、logInterceptorを使用してください。ver.1.1.6以降、lapInterceptorはlogInterceptorと同じになりました。
	 * @function
	 * @param {Function} invocation 次に実行する関数
	 * @returns {Any} invocationの戻り値
	 * @memberOf h5.core.interceptor
	 */
	var lapInterceptor = logInterceptor;

	/**
	 * 例外発生時にcommonFailHandlerを呼び出すインターセプタです。<br>
	 * このインターセプタをかけたメソッド内で例外がスローされメソッド内でキャッチされなかった場合、
	 * その例外オブジェクトを引数にしてcommonFailHandlerを呼びだします（commonFailHandlerがない場合はなにもしません）。
	 *
	 * @param {Function} invocation 次に実行する関数
	 * @returns {Any} invocationの戻り値
	 * @memberOf h5.core.interceptor
	 */
	var errorInterceptor = function(invocation) {
		var ret = null;
		try {
			ret = invocation.proceed();
		} catch (e) {
			if (h5.settings.commonFailHandler && $.isFunction(h5.settings.commonFailHandler)) {
				h5.settings.commonFailHandler.call(null, e);
			}
		}
		return ret;
	};

	// ここで公開しないとh5preinit時にデフォルトインターセプタが定義されていないことになる
	/**
	 * @name interceptor
	 * @memberOf h5.core
	 * @namespace
	 */
	h5.u.obj.expose('h5.core.interceptor', {
		lapInterceptor: lapInterceptor,
		logInterceptor: logInterceptor,
		errorInterceptor: errorInterceptor
	});

	// h5preinitイベントをトリガ.
	$(document).trigger('h5preinit');

	if (h5.settings.aspects) {
		compileAspects(h5.settings.aspects);
	}

	// ログ設定の適用
	h5.log.configure();

	// =============================
	// Expose to window
	// =============================
	/* del begin */
	// テストのために公開している。
	h5.u.obj.expose('h5.core', {
		__compileAspects: compileAspects
	});
	/* del end */
})();
