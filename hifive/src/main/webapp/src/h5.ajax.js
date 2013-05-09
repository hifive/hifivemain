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
	/**
	 * jqXHRをkeyにして、commonFailHandlerを登録する関数を覚えておく配列
	 */
	var jqXHRCommonFailHandlerMap = [];

	/**
	 * フックするjqXHRのコールバック登録関数
	 */
	var hookMethods = ['done', 'fail', 'pipe', 'always', 'then', 'success', 'error', 'complete'];

	// =============================
	// Functions
	// =============================
	/**
	 * コールバック登録関数をフックする
	 */
	function hookCallbackRegistMethod(jqXHRWrapper, stockRegistCallbacks) {
		// 引数をストックしておく
		// リトライの途中で成功した場合はその時のjqXHRに登録する。
		// 最後まで成功しなかった場合は最後のリトライ時のjqXHRにまとめて登録する
		for ( var i = 0, l = hookMethods.length; i < l; i++) {
			var method = hookMethods[i];
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
	}
	/**
	 * フックしたコールバック登録関数を削除
	 */
	function removeHookedMethod(jqXHRWrapper) {
		for ( var i = 0, l = hookMethods.length; i < l; i++) {
			var method = hookMethods[i];
			delete jqXHRWrapper[method];
		}
	}

	/**
	 * ストックしたコールバック登録を引数に指定されたjqXHRに対して行う関数<br>
	 * jqXHRWrapperから登録されたコールバックはストックされている。
	 * 既にreject,resolveされたjqXHRにストックされたコールバックを登録すると、即座にコールバックが実行される。
	 *
	 * @private
	 * @param {jqXHR} _jqXHR
	 * @param {Array} stockRegistCallbacks 登録するコールバックオブジェクトの配列
	 */
	function registCallback(_jqXHR, stockRegistCallbacks) {
		// ストックしたコールバックを登録
		for ( var i = 0, l = stockRegistCallbacks.length; i < l; i++) {
			_jqXHR[stockRegistCallbacks[i].method].apply(_jqXHR, stockRegistCallbacks[i].args);
		}
		// commonFailHandlerの登録があれば登録
		for ( var i = 0, l = jqXHRCommonFailHandlerMap.length; i < l; i++) {
			if (jqXHRCommonFailHandlerMap[i].jqXHR === _jqXHR) {
				jqXHRCommonFailHandlerMap[i].registCommonFailHandler();
				break;
			}
		}
		if (i !== l) {
			// ヒットしたらjqXHRCommonFailHandlerMapから現在の_jqXHRの箇所を削除
			jqXHRCommonFailHandlerMap.splice(i, 1);
		}
	}

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

		// ajaxの呼び出し。jqXHRを取得してjqXHRWrapperを作成。
		var jqXHR = _ajax(settings);
		JqXHRWrapper.prototype = jqXHR;
		var jqXHRWrapper = new JqXHRWrapper();

		// コールバック登録関数をフックする。
		// 登録された関数はストックする
		var stockRegistCallbacks = [];
		hookCallbackRegistMethod(jqXHRWrapper, stockRegistCallbacks);

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
				// プロパティで指定されたコールバックはfailやdoneで指定したコールバックより先に実行されるのでshiftでストック
				stockRegistCallbacks.shift({
					method: propToMethod[prop],
					args: settings[prop]
				});
				settings[prop] = undefined;
			}
		}

		/**
		 * リトライ時のdoneハンドラ。 成功時はリトライせずに登録されたdoneハンドラを呼び出す。
		 * jqXHRWrapperのメソッドから登録されたストック済みの関数を登録を現在のjqXHRに登録する
		 */
		function retryDone(_data, _textStatus, _jqXHR) {
			// ストックしたコールバックを今回のjqXHRに登録
			registCallback(_jqXHR, stockRegistCallbacks);
			// フックした関数を元に戻す
			removeHookedMethod(jqXHRWrapper);
		}

		/**
		 * リトライ時のfailハンドラ。 ステータスコードを見て、リトライするかどうかを決める。
		 * リトライしないなら、registCallbackを呼んで、現在のjqXHRへコールバックを登録する。
		 */
		function retryFail(_jqXHR, _textStatus, _errorThrown) {
			if (retryCount === 0 || retryFilter.apply(this, arguments) === false) {
				// retryFilterがfalseを返した、
				// またはこれが最後のリトライ、
				// またはリトライ指定のない場合、
				// ストックしたコールバックを今回のjqXHRに登録して終了
				registCallback(_jqXHR, stockRegistCallbacks);
				// フックした関数を元に戻す
				removeHookedMethod(jqXHRWrapper);
				return;
			}
			retryCount--;
			if (this.async) {
				// 非同期ならretryIntervalミリ秒待機してリトライ
				var that = this;
				setTimeout(function() {
					_ajax(that).done(retryDone).fail(retryFail);
				}, retryInterval);
			} else {
				// 同期なら即リトライする
				// (同期で呼ばれたらリトライ指定があっても同期になるようにするためretryIntervalは無視する)
				_ajax(this).done(retryDone).fail(retryFail);
			}
		}
		// retryFailの登録はcommonFailHandlerを実行するかどうかに関係ないので、
		// 判別するためにフラグを立てておく
		retryFail.isRetryFailCallback = true;

		// コールバックを登録
		jqXHR.done(retryDone).fail(retryFail);

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
			// リトライ機能のために、failハンドラはreject,resolveされてからまとめて登録される。
			// commonFailHandlerを呼ぶためのfailハンドラの登録は、その後でなければ、commonFailHandlerを呼ぶかどうかの判定ができない。
			// そのため、まとめて登録の時が終わってから一番最後に登録するために、覚えておく。
			var originalFail = jqXHR.fail;
			jqXHRCommonFailHandlerMap.push({
				jqXHR: jqXHR,
				registCommonFailHandler: function() {
					originalFail(function(/* var_args */) {
						if (!callFail) {
							commonFailHandler.apply(null, arguments);
						}
					});
				}
			});
			jqXHR.fail = function(/* var_args */) {
				// リトライ用のfailコールバックが登録されるときは、callFailをtrueにしない
				if (arguments[0] && !arguments[0].isRetryFailCallback) {
					callFail = true;
				}
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