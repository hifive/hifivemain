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
	 * jqXHRからJqXHRWrapperにコピーしないプロパティ jqXHRのメソッドで非推奨であるもの。(deferredにないもの)
	 *
	 * @type {Array}
	 */
	var DUPLICATED_METHODS = ['error', 'success', 'complete'];

	/**
	 * ajaxの引数のオブジェクトでコールバックが記述されるプロパティ<br>
	 * コールバックの実行されるタイミング順に記述(completeが一番遅いタイミングで実行されるので最後)
	 *
	 * @type {Array}
	 */
	var CALLBACK_REGISTER_DELEGATE_METHODS = ['error', 'success', 'complete'];

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
	 * ajaxの引数に指定されたコールバックを指定するプロパティを外して、deferredに登録する
	 *
	 * @private
	 * @param {Object} settings ajaxに渡すオブジェクト
	 * @param {Deferred} dfd
	 */
	function delegateCallbackProperties(settings, dfd) {
		for ( var i = 0, l = CALLBACK_REGISTER_DELEGATE_METHODS.length; i < l; i++) {
			var prop = CALLBACK_REGISTER_DELEGATE_METHODS[i];
			if (settings[prop]) {
				dfd[PROP_TO_METHOD_MAP[prop]](settings[prop]);
				settings[prop] = undefined;
			}
		}
	}

	/**
	 * jqXHRのプロパティをjqXHRWrapperにコピーする
	 * <p>
	 * includeFunction==trueなら関数プロパティはコピーしない。promiseからコピーする関数及び非推奨な関数はコピーしない。
	 * </p>
	 *
	 * @private
	 * @param {JqXHRWrapper} jqXHRWrapper
	 * @param {Object} jqXHR コピー元のjqXHR
	 * @param {Boolean} includeFunction 関数プロパティをコピーするかどうか(trueならコピー)
	 * @param {Promise} promise promiseが持つプロパティはコピーしない
	 */
	function copyJqXHRProperties(jqXHRWrapper, jqXHR, includeFunction) {
		// jqXHRの中身をコピー
		// 関数プロパティならapplyでオリジナルのjqXHRの関数を呼ぶ関数にする
		for ( var prop in jqXHR) {
			// includeFunction=falseの場合は関数はコピーしない。
			// includeFunction=trueの場合、
			// 非推奨なプロパティ以外をコピー
			if (jqXHR.hasOwnProperty(prop) && (includeFunction || !$.isFunction(jqXHR[prop]))
					&& $.inArray(prop, DUPLICATED_METHODS) === -1) {
				// 値をコピー
				jqXHRWrapper[prop] = jqXHR[prop];
			}
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
	 * このクラスは自分でnewすることはありません。 h5.ajax()の戻り値がこのクラスです。
	 * jqXHRをラップしているクラスで、jqXHRのメソッド、プロパティを使用することができます。
	 * </p>
	 * <p>
	 * <strong>注意：</strong>jqXHRオブジェクトと違い、success, error, complete メソッドはありません(非推奨であるため)。 それぞれ、done,
	 * fail, always を使用して下さい。
	 * </p>
	 *
	 * @class
	 * @name JqXHRWrapper
	 */
	function JqXHRWrapper(jqXHR, dfd) {
		// オリジナルのjqXHRから値をコピー
		copyJqXHRProperties(this, jqXHR, true);

		// jqXHRWrapperをpromise化する
		// (jqXHRのdoneやfailは使用しない。promise化で上書かれる。)
		dfd.promise(this);

		// promiseをオーバーライド
		// JqXHRWrapper.promise()はthisをdfdにして呼ぶ必要がある。
		// (でないと、h5.async.deferredでフックしているfailが使用されない)
		this.promise = function(obj) {
			return dfd.promise.apply(this, arguments);
		};

		// alwaysをオーバーライド
		// jQuery1.7.0のバグ(alwaysがjqXHRではなくpromiseを返すバグ)の対応
		// http://bugs.jquery.com/ticket/10723  "JQXHR.ALWAYS() RETURNS A PROMISE INSTEAD OF A JQXHR OBJECT"
		var originalAlways = this.always;
		this.always = function(/* var_args */) {
			originalAlways.apply(this, arguments);
			return this;
		};
	}

	/**
	 * HTTP通信を行います。
	 * <p>
	 * 基本的な使い方は、<a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax()</a>と同じです。戻り値はjqXHRをラップした
	 * <a href="JqXHRWrapper.html">JqXHRWrapper</a>クラスです。
	 * <p>
	 * <p>
	 * jQuery.ajax()と異なる点は共通のエラーハンドラが定義できることと、リトライオプションを指定できることです。
	 * </p>
	 * <br>
	 * <h3>共通のエラーハンドラ</h3>
	 * <p>
	 * <a href="h5.settings.html#commonFailHandler">h5.settings.commonFailHandler</a>に関数が設定されている場合、
	 * エラーコールバックが登録されないままajaxが失敗すると、h5.settings.commonFailHandlerに設定した関数が呼ばれます。
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

		// deferredオブジェクトの作成
		var dfd = h5.async.deferred();

		// settingsに指定されたコールバックを外して、deferredに登録する
		delegateCallbackProperties(settings, dfd);

		// $.ajaxの呼び出し。jqXHRを取得してjqXHRWrapperを作成。
		var jqXHR = $.ajax(settings);

		// jqXHRWrapperの作成
		var jqXHRWrapper = new JqXHRWrapper(jqXHR, dfd);

		/**
		 * リトライ時のdoneハンドラ。 成功時はリトライせずにresolveして終了
		 */
		function retryDone(_data, _textStatus, _jqXHR) {
			// jqXHRの差し替え
			copyJqXHRProperties(jqXHRWrapper, _jqXHR);
			dfd.resolveWith(this, arguments);
		}

		/**
		 * リトライ時のfailハンドラ。 ステータスコードを見て、リトライするかどうかを決める。 リトライしないなら、dfd.reject()を呼んで終了。
		 */
		function retryFail(_jqXHR, _textStatus, _errorThrown) {
			if (settings.retryCount === 0 || settings.retryFilter.apply(this, arguments) === false) {
				// retryFilterがfalseを返した、
				// またはこれが最後のリトライ、
				// またはリトライ指定のない場合、
				// rejectして終了

				// jqXHRの差し替え
				copyJqXHRProperties(jqXHRWrapper, _jqXHR);
				dfd.rejectWith(this, arguments);
				return;
			}
			settings.retryCount--;
			if (this.async) {
				// 非同期ならretryIntervalミリ秒待機してリトライ
				var that = this;
				setTimeout(function() {
					$.ajax(that).done(retryDone).fail(retryFail);
				}, settings.retryInterval);
			} else {
				// 同期なら即リトライする
				// (同期で呼ばれたらリトライ指定があっても同期になるようにするためretryIntervalは無視する)
				$.ajax(this).done(retryDone).fail(retryFail);
			}
		}

		// コールバックを登録
		jqXHR.done(retryDone).fail(retryFail);

		// 戻り値はjqXHRをラップしたjqXHRWrapperオブジェクト
		return jqXHRWrapper;
	}

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5', {
		ajax: ajax
	});
})();