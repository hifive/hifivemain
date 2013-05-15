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
	 * フックするjqXHRのコールバック登録関数
	 *
	 * @type {Array}
	 */
	var HOOK_METHODS = ['done', 'fail', 'pipe', 'always', 'then', 'success', 'error', 'complete'];

	/**
	 * ajaxの引数のオブジェクトでコールバックが記述されるプロパティ<br>
	 * コールバックの実行されるタイミング順と逆順で記述(completeが一番遅いタイミングで実行されるので、先頭に記述)
	 *
	 * @type {Array}
	 */
	var CALLBACK_REGISTER_DELEGATE_MAP = ['complete', 'error', 'success'];

	/**
	 * コールバック指定プロパティと、コールバック登録関数を対応させるオブジェクト
	 * <p>
	 * settingsに指定されたコールバックはdone,fail,alwaysで登録させる。<br>
	 * success -> done, error -> fail, complete -> always にそれぞれ対応。<br>
	 * (success,error,completeメソッドはjQuery1.8で非推奨になったため)。
	 * </p>
	 *
	 * @type Object
	 */
	var PROP_TO_METHOD_MAP = {
		success: 'done',
		error: 'fail',
		complete: 'always'
	};
	// =============================
	// Functions
	// =============================
	/**
	 * ストックしたコールバック登録を引数に指定されたjqXHRに対して行う関数<br>
	 * jqXHRWrapperから登録されたコールバックはストックされている。
	 * 既にreject,resolveされたjqXHRにストックされたコールバックを登録すると、即座にコールバックが実行される。
	 * commonFailHandlerが定義されていてかつエラーコールバックが登録されていないならcommonFailHandlerを登録する
	 *
	 * @private
	 * @param {jqXHR} _jqXHR
	 * @param {Array} stockedCallbacks 登録するコールバックオブジェクトの配列
	 */
	function registCallback(_jqXHR, stockedCallbacks) {
		var hasErrorCallback = false;
		var commonFailHandler = h5.settings.commonFailHandler;

		// ストックしたコールバックを登録
		for ( var i = 0, l = stockedCallbacks.length; i < l; i++) {
			var method = stockedCallbacks[i].method;
			var args = stockedCallbacks[i].args;
			// commonFailHandlerがあるなら、エラーコールバックへの登録があるかどうかチェック
			if (commonFailHandler && !hasErrorCallback) {
				switch (method) {
				case 'fail':
				case 'error':
				case 'always':
				case 'complete':
					hasErrorCallback = true;
					hasErrorCallback = true;
					break;
				case 'pipe':
				case 'then':
					// pipeとthenによる登録なら第2引数を見る
					if (!!args[1]) {
						hasErrorCallback = true;
					}
					break;
				}
			}
			// オリジナルのjqXHRに関数を登録。resolve,reject済みなら即発火する。
			_jqXHR[method].apply(_jqXHR, args);
		}
		// commonFailHandlerがあって、エラーコールバックへの登録がないならcommonFailHandlerを登録する
		if (commonFailHandler && !hasErrorCallback) {
			_jqXHR.fail(function(/* var_args */) {
				commonFailHandler.apply(this, arguments);
			});
		}
	}

	/**
	 * ajaxの引数に指定されたコールバックを指定するプロパティを外し、ストックする
	 *
	 * @private
	 * @param {Object} settings ajaxに渡すオブジェクト
	 * @param {Array} stockedCallbacks コールバック関数をストックする配列
	 */
	function stockPropertyCallbacks(settings, stockedCallbacks) {
		for ( var i = 0, l = CALLBACK_REGISTER_DELEGATE_MAP.length; i < l; i++) {
			var prop = CALLBACK_REGISTER_DELEGATE_MAP[i];
			if (settings[prop]) {
				// プロパティで指定されたコールバックはfailやdoneで指定したコールバックより先に実行されるのでunshiftでストック
				// (CALLBACK_REGISTER_DELEGATE_MAPは実行されるタイミングと逆順で記述しているので、unshiftによる追加で順番通りになる)
				stockedCallbacks.unshift({
					method: PROP_TO_METHOD_MAP[prop],
					args: wrapInArray(settings[prop])
				});
				settings[prop] = undefined;
			}
		}
	}

	/**
	 * jqXHRのプロパティをjqXHRWrapperにコピーする
	 * <p>
	 * hookEnableがtrueならコールバック登録関数をフックして呼び出しをストックするようにする。ストック先はstockedCallbacksに指定する。
	 * </p>
	 *
	 * @private
	 * @param {JqXHRWrapper} jqXHRWrapper
	 * @param {Object} jqXHR
	 * @param {Boolean} enableHookMethods コールバック登録関数をフックするか
	 * @param {Array} stockedCallbacks フックしたコールバック関数呼び出しをストックしておく配列
	 */
	function copyJqXHRProperty(jqXHRWrapper, jqXHR, enableHookMethods, stockedCallbacks) {
		// jqXHRの中身をコピー
		// 関数プロパティならapplyでオリジナルのjqXHRの関数を呼ぶ関数にする
		for ( var prop in jqXHR) {
			if (jqXHR.hasOwnProperty(prop)) {
				if (enableHookMethods && $.inArray(prop, HOOK_METHODS) !== -1) {
					// コールバック登録関数をフックして、コールバックをストックする関数に差し替え
					jqXHRWrapper[prop] = (function(_method) {
						return function() {
							stockedCallbacks.push({
								method: _method,
								args: arguments
							});
							return jqXHRWrapper;
						};
					})(prop);
				} else {
					// フックしないプロパティなら値をコピー
					jqXHRWrapper[prop] = jqXHR[prop];
				}
			}
		}
		/**
		 * オリジナルのjqXHR
		 *
		 * @private
		 * @memberOf JqXHRWrapper
		 * @type jqXHR
		 * @name _jqXHR
		 */
		jqXHRWrapper._jqXHR = jqXHR;
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * jqXHRWrapper
	 * <p>
	 * このクラスは自分でnewすることはありません。 h5.ajax()の戻り値がこのクラスです。
	 * jqXHRをラップしているクラスで、jqXHRのメソッド、プロパティを使用することができます。
	 * </p>
	 *
	 * @class
	 * @name JqXHRWrapper
	 */
	function JqXHRWrapper(jqXHR, stockedCallbacks) {
		// オリジナルのjqXHRから値をコピー
		copyJqXHRProperty(this, jqXHR, true, stockedCallbacks);
	}

	/**
	 * HTTP通信を行います。
	 * <p>
	 * 基本的な使い方は、<a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax()</a>と同じです。
	 * jQuery.ajax()と異なる点は共通のエラーハンドラが定義できることと、リトライオプションを指定できることです。
	 * </p>
	 * <br>
	 * <h3>共通のエラーハンドラ</h3>
	 * <p>
	 * <a href="h5.settings.html#commonFailHandler">h5.settings.commonFailHandler</a>に関数が設定されている場合、
	 * エラーコールバックがjqXHRに登録されずにajaxが失敗すると、h5.settings.commonFailHandlerに設定した関数が呼ばれます。
	 * </p>
	 * <br>
	 * <h3>リトライオプション</h3>
	 * <p>
	 * <a href="h5.settings.html#ajax">h5.settings.ajax</a>でリトライをする設定がしてあれば、リトライを行います(デフォルトはリトライを行わない)。<br>
	 * また、引数からもリトライの設定を指定することができ、h5.settings.ajaxの設定よりも優先します。
	 * </p>
	 * <code><pre>
	 * h5.ajax({
	 * 	url: 'hoge',
	 * 	cache: false		// jQuery.ajaxのオプション
	 * 	retryCount: 3,		// h5.ajaxで追加しているオプション。リトライ回数。
	 * 	retryInterval: 200	// h5.ajaxで追加しているオプション。リトライ間のインターバル。
	 * 	retryFilter: function()		// h5.ajaxで追加しているオプション。リトライ毎に実行される関数。
	 * });
	 * </pre></code>
	 * <p>
	 * リトライ回数の設定してある場合は、リトライ途中で通信に成功した場合はdoneコールバックが、 リトライ回数回リトライしても失敗した場合はfailコールバックが呼ばれます。
	 * </p>
	 * <p>
	 * 同期(async:false)で呼んだ時は、retryIntervalの値に関わらず即座に同期でリトライを行います。ajax通信結果は同期で返ってきます。
	 * </p>
	 *
	 * @param {Any} var_args jQuery.ajaxに渡す引数
	 * @returns {JqXHRWrapper} jqXHRWrapperオブジェクト
	 * @name ajax
	 * @function
	 * @memberOf h5
	 */
	function ajax(/* var_args */) {
		// $.ajax(settings)での呼び出しに統一する。
		var settings = {};
		var args = arguments;
		if (isString(args[0])) {
			// ajax(url,[settings]) での呼び出しなら、settings.urlを追加する。
			$.extend(settings, args[1]);
			// 第1引数のurlがsettings.urlより優先される($.ajaxと同じ)
			settings.url = args[0];
		} else {
			// 第一引数がurlでないならsettingsにsettingsをクローン
			$.extend(settings, args[0]);
		}
		// h5.settings.ajaxとマージ
		settings = $.extend({}, h5.settings.ajax, settings);

		// settingsに指定されたコールバックを外して、ストックする
		var stockedCallbacks = [];
		stockPropertyCallbacks(settings, stockedCallbacks);

		// _ajaxの呼び出し。jqXHRを取得してjqXHRWrapperを作成。
		var jqXHR = _ajax(settings);

		// jqXHRWrapperの作成
		// コールバック登録関数はフックして、登録されたコールバック関数をストックする。
		var jqXHRWrapper = new JqXHRWrapper(jqXHR, stockedCallbacks);

		/**
		 * リトライ時のdoneハンドラ。 成功時はリトライせずに登録されたdoneハンドラを呼び出す。
		 * jqXHRWrapperのメソッドから登録されたストック済みの関数を登録を現在のjqXHRに登録する
		 */
		function retryDone(_data, _textStatus, _jqXHR) {
			// jqXHRの差し替え
			copyJqXHRProperty(jqXHRWrapper, _jqXHR);
			// ストックしたコールバックを今回のjqXHRに登録
			registCallback(_jqXHR, stockedCallbacks);
		}

		/**
		 * リトライ時のfailハンドラ。 ステータスコードを見て、リトライするかどうかを決める。
		 * リトライしないなら、registCallbackを呼んで、現在のjqXHRへコールバックを登録する。
		 */
		function retryFail(_jqXHR, _textStatus, _errorThrown) {
			// jqXHRの差し替え
			copyJqXHRProperty(jqXHRWrapper, _jqXHR);
			if (settings.retryCount === 0 || settings.retryFilter.apply(this, arguments) === false) {
				// retryFilterがfalseを返した、
				// またはこれが最後のリトライ、
				// またはリトライ指定のない場合、
				// ストックしたコールバックを今回のjqXHRに登録して終了

				// ストックしたコールバックを今回のjqXHRに登録
				registCallback(_jqXHR, stockedCallbacks);
				return;
			}
			settings.retryCount--;
			if (this.async) {
				// 非同期ならretryIntervalミリ秒待機してリトライ
				var that = this;
				setTimeout(function() {
					_ajax(that).done(retryDone).fail(retryFail);
				}, settings.retryInterval);
			} else {
				// 同期なら即リトライする
				// (同期で呼ばれたらリトライ指定があっても同期になるようにするためretryIntervalは無視する)
				_ajax(this).done(retryDone).fail(retryFail);
			}
		}

		// コールバックを登録
		jqXHR.done(retryDone).fail(retryFail);

		// 戻り値はjqXHRをラップしたjqXHRWrapperオブジェクト
		return jqXHRWrapper;
	}

	/**
	 * HTTP通信を行います。
	 * <p>
	 * h5.ajaxから呼び出される関数です。progressメソッドを追加します。
	 * </p>
	 *
	 * @private
	 * @param {Object} settings jQuery.ajaxに渡すオブジェクト
	 * @returns {jqXHR} jqXHRオブジェクト
	 * @name _ajax
	 * @function
	 * @memberOf h5
	 */
	function _ajax(settings) {
		var jqXHR = $.ajax.apply($, arguments);

		if (!jqXHR.progress) {
			jqXHR.progress = function() {
			// notifyされることはないので空にしている
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