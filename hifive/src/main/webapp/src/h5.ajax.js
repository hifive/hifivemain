/*
 * Copyright (C) 2011-2012 NS Solutions Corporation.
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

	// TODO エラーコード定数等Minify版（製品利用版）でも必要なものはここに書く

	// =============================
	// Development Only
	// =============================

	/* del begin */

	// TODO Minify時にプリプロセッサで削除されるべきものはこの中に書く
	/* del end */


	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// TODO 高速化のために他で定義されている関数などを変数に入れておく場合はここに書く
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	// TODO モジュールレベルのプライベート変数はここに書く
	// =============================
	// Functions
	// =============================
	// TODO モジュールレベルのプライベート関数はここに書く
	// 関数は関数式ではなく function myFunction(){} のように関数定義で書く
	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * HTTP通信を行います。<br />
	 * 基本的に使い方は、<a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax()</a>と同じです。<br />
	 *
	 * jQuery.ajax()と異なる点は共通のエラーハンドラが定義できることです。<br/>
	 * h5.settings.commonFailHandlerに関数を設定し、h5.ajax()に引数として渡すオプションにerror/completeコールバックが設定されていない、<br />
	 * もしくは戻り値のPromiseオブジェクトに対するfail/alwaysコールバックが設定されていない場合にエラーが発生すると <br />
	 * h5.settings.commonFailHandlerに設定した関数が呼ばれます。
	 *
	 * @param {Any} var_args jQuery.ajaxに渡す引数
	 * @returns {Promise} Promiseオブジェクト
	 * @name ajax
	 * @function
	 * @memberOf h5
	 */
	var ajax = function(var_args) {
		var opt = typeof arguments[0] === 'string' ? arguments[1] : arguments[0];
		var hasFailCallback = opt && (opt.error || opt.fail || opt.complete || opt.always);
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
	};


	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5', {
		ajax: ajax
	});
})();