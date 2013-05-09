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

/* ------ h5.ajax ------ */
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
	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * jqXHRWrapper
	 * <p>
	 * jQuery.ajaxが生成するjqXHRをラップするクラス。 h5.ajax()の戻り値で使用します。
	 * </p>
	 *
	 * @private
	 * @class
	 */
	function JqXHRWrapper() {
	// 空コンストラクタ
	}

	/**
	 * HTTP通信を行います。<br />
	 * 基本的に使い方は、<a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax()</a>と同じです。<br />
	 * jQuery.ajax()と異なる点は共通のエラーハンドラが定義できることです。<br/>
	 * h5.settings.commonFailHandlerに関数を設定し、h5.ajax()に引数として渡すオプションにerror/completeコールバックが設定されていない、<br />
	 * もしくは戻り値のPromiseオブジェクトに対するfail/alwaysコールバックが設定されていない場合にエラーが発生すると <br />
	 * h5.settings.commonFailHandlerに設定した関数が呼ばれます。
	 *
	 * @param {Any} var_args jQuery.ajaxに渡す引数
	 * @returns {JqXHRWrapper} jqXHRWrapperオブジェクト
	 * @name ajax
	 * @function
	 * @memberOf h5
	 */
	function ajax(var_args) {
		// $.ajax(settings)での呼び出しに統一する。
		var settings = {};
		if (isString(arguments[0])) {
			// ajax(url,[settings]) での呼び出しなら、settings.urlを追加する。
			$.extend(settings, arguments[1]);
			// 第1引数のurlがsettings.urlより優先される($.ajaxと同じ)
			settings.url = arguments[0];
		} else {
			// 第一引数がurlでないならsettingsにsettingsをクローン
			$.extend(settings, arguments[0]);
		}
		// settings.ajaxとマージ
		$.extend(settings, h5.settings.ajax);

		// リトライについてのパラメータ取得
		var retryCount = settings.retryCount || 0;
		var retryInterval = settings.retryInterval;
		var retryFilter = settings.retryFilter;

		var jqXHR = _ajax(settings);
		$.extend(JqXHRWrapper.prototype, jqXHR);
		var jqXHRWrapper = new JqXHRWrapper();

		// リトライ(POST指定ならリトライしない)
		// jQuery1.9からtypeよりmethodオプションを優先。http://bugs.jquery.com/ticket/12004
		var type = $().jquery.match(/\d*\.\d*/)[0] <= 1.8 ? settings.type || $.ajaxSettings.type
				: settings.method || settings.type || $.ajaxSettings.method || $.ajaxSettings.type;
		if (retryCount && (!type || type.toUpperCase() !== 'POST')) {
			// リトライ指定があって同期の場合は単純にその回数文だけ繰り返す。
			if (settings.async === false || $.ajaxSettings.async === false) {
				// リトライ指定回数回すか、途中で成功(status===200)になったらその時のjqXHRをラップしたjqXHRWrapperを返す
				return (function syncRetry() {
					if (jqXHR.status === 200 || retryCount === 0) {
						return jqXHRWrapper;
					} else {
						retryCount--;
						jqXHR = _ajax(settings);
						$.extend(JqXHRWrapper.prototype, jqXHR);
						jqXHRWrapper = new JqXHRWrapper();
						return syncRetry();
					}
				})();
			}

			// 非同期の場合、コールバック登録関数をフックして
			// 引数をストックしておく
			// リトライの途中で成功した場合はその時のjqXHRに登録する。
			// 最後まで成功しなかった場合は最後のリトライ時のjqXHRにまとめて登録する
			var stockRegistCallbacks = [];
			var registCallbackChain = ['done', 'fail', 'pipe', 'always', 'then', 'success',
					'error', 'complete'];
			for ( var i = 0, l = registCallbackChain.length; i < l; i++) {
				var method = registCallbackChain[i];
				jqXHRWrapper[method] = (function(_method) {
					return function() {
						stockRegistCallbacks.push({
							method: _method,
							args: arguments
						});
						return jqXHRWrapper;
					};
				})(method);
			}
			// settingsに指定されたコールバックもストックする
			// success -> done, error -> fail, complete -> always に登録する
			// (success,error,completeメソッドはjQuery1.8で非推奨になったため)
			var propCallbacks = ['success', 'error', 'complete'];
			var propToMethod = {
				success: 'done',
				error: 'fail',
				complete: 'always'
			};
			for ( var i = 0, l = propCallbacks.length; i < l; i++) {
				var prop = propCallbacks[i];
				if (settings[prop]) {
					stockRegistCallbacks.shift({
						method: propToMethod[prop],
						args: settings[prop]
					});
					settings[prop] = undefined;
				}
			}

			/**
			 * ストックしたコールバック登録を引数に指定されたjqXHRに対して行う関数<br>
			 * jqXHRWrapperから登録されたコールバックはストックされている。
			 * ストックされたコールバックを現在見ているjqXHRオブジェクトに登録することでコールバックが実行される。
			 *
			 * @private
			 * @param {jqXHR} _jqXHR
			 */
			function registCallback(_jqXHR) {
				// ストックしたコールバックを登録
				for ( var i = 0, l = stockRegistCallbacks.length; i < l; i++) {
					_jqXHR[stockRegistCallbacks[i].method].call(_jqXHR,
							stockRegistCallbacks[i].args);
				}
			}

			/**
			 * リトライ時のdoneハンドラ。 成功時はリトライせずに登録されたdoneハンドラを呼び出す。
			 * 現在のjqXHRに対してjqXHRWrapperから登録されたストック済みの関数を
			 */
			function retryDone(_data, _textStatus, _jqXHR) {
				// ストックしたコールバックを今回のjqXHRに登録
				registCallback(_jqXHR);
			}

			/**
			 * リトライ時のfailハンドラ。 ステータスコードを見て、リトライするかどうかを決める。
			 * リトライしないなら、registCallbackを呼んで、現在のjqXHRへコールバックを登録する。
			 */
			function retryFail(_jqXHR, _textStatus, _errorThrown) {
				// settings.timeoutに指定した時間が経過してエラーになった場合はステータスコードが0
				// IEでコネクションが繋がらない時のステータスコードが12029
				// 上記のステータスコードならリトライする
				var status = _jqXHR.status;
				if (status === 0 || status === 12029) {
					retryCount--;
					// リトライする前にretryFilterの呼び出し
					retryFilter.call(null, arguments);

					// retryInterval待ってリトライ
					setTimeout(function() {
						retry(settings);
					}, retryInterval);
				} else {
					// エラーコードが0でも12029でもないならリトライしない
					registCallback(_jqXHR);
				}
			}

			/**
			 * リトライする関数 リトライする度にajaxを呼ぶのでjqXHRオブジェクトが生成される
			 * リトライ回数が残っていればjqXHRにretryDone,retryFailを登録。 残っていないならjqXHRにストックしてあるコールバックを登録。
			 */
			function retry(_settings) {
				var _jqXHR = _ajax(_settings);
				if (retryCount === 0) {
					// これが最後のリトライなので、
					// ストックしたコールバックを今回のjqXHRに登録
					registCallback(_jqXHR);
					return;
				}
				retryCount--;
				_jqXHR.done(var_args).done(retryDone).fail(retryFail);
			}
			jqXHR.done(retryDone).fail(retryFail);
		}

		// 戻り値はjqXHRをラップしたjqXHRWrapperオブジェクト。
		// リトライの設定がない場合は、fail,doneなどは元のjqXHRのものが呼ばれる。(オリジナルのjqXHRを返しているのとほぼ同じ)
		// リトライの設定がある場合は、fail,doneなどがフックされている。
		return jqXHRWrapper;
	}

	/**
	 * HTTP通信を行います。<br />
	 * 基本的に使い方は、<a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax()</a>と同じです。<br />
	 * jQuery.ajax()と異なる点は共通のエラーハンドラが定義できることです。<br/>
	 * h5.settings.commonFailHandlerに関数を設定し、h5.ajax()に引数として渡すオプションにerror/completeコールバックが設定されていない、<br />
	 * もしくは戻り値のPromiseオブジェクトに対するfail/alwaysコールバックが設定されていない場合にエラーが発生すると <br />
	 * h5.settings.commonFailHandlerに設定した関数が呼ばれます。
	 *
	 * @param {Object} settings jQuery.ajaxに渡すオブジェクト
	 * @returns {jqXHR} jqXHRオブジェクト
	 * @name ajax
	 * @function
	 * @memberOf h5
	 */
	function _ajax(settings) {
		var hasFailCallback = settings.hasFailCallback || !!(settings.error || settings.complete);
		// settings.hasFailCallbackに覚えさせておく。retry時はsettings.hasFailCallbackを参照する。
		settings.hasFailCallback = hasFailCallback;

		var jqXHR = $.ajax.apply($, arguments);

		if (!jqXHR.progress) {
			jqXHR.progress = function() {
			// notifyされることはないので空にしている
			};
		}

		var callFail = false;
		var commonFailHandler = h5.settings.commonFailHandler;
		if (!hasFailCallback && commonFailHandler) {
			jqXHR.fail(function(/* var_args */) {
				if (!callFail) {
					commonFailHandler.apply(null, arguments);
				}
			});
			var originalFail = jqXHR.fail;
			jqXHR.fail = function(/* var_args */) {
				callFail = true;
				return originalFail.apply(jqXHR, arguments);
			};
			jqXHR.error = jqXHR.fail;

			var originalAlways = jqXHR.always;
			jqXHR.always = function(/* var_args */) {
				callFail = true;
				return originalAlways.apply(jqXHR, arguments);
			};
			jqXHR.complete = jqXHR.always;

			jqXHR.then = function(doneCallbacks, failCallbacks, progressCallbacks) {
				if (doneCallbacks) {
					jqXHR.done.apply(jqXHR, wrapInArray(doneCallbacks));
				}
				if (failCallbacks) {
					jqXHR.fail.apply(jqXHR, wrapInArray(failCallbacks));
				}
				if (progressCallbacks) {
					jqXHR.progress.apply(jqXHR, wrapInArray(progressCallbacks));
				}
				return jqXHR;
			};
		}
		return jqXHR;
	}

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5', {
		ajax: ajax
	});
})();