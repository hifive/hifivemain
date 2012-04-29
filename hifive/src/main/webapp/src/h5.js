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

	// TODO エラーコード定数等Minify版（製品利用版）でも必要なものはここに書く

	// =============================
	// Development Only
	// =============================

	// var fwLogger = h5.log.createLogger(); //TODO カテゴリ名(ファイル名から拡張子を除いたもの)を入れる

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
		 * failコールバックが設定されていない時にrejectされた場合に発動する共通ハンドラ.
		 *
		 * @memberOf h5.settings
		 * @type Function
		 */
		commonFailHandler: null,

		/**
		 * コントローラ、ロジックへのアスペクト
		 *
		 * @memberOf h5.settings
		 * @type Aspect|Aspect[]
		 */
		aspects: null,

		/**
		 * ログの設定を行います。<br />
		 * <ul>
		 * <li></li>
		 * </ul>
		 *
		 * @memberOf h5.settings
		 * @type Object
		 */
		log: null
	};

	// h5preinitでglobalAspectsの設定をしている関係上、別ファイルではなく、ここに置いている。
	/**
	 * 実行時間の計測を行うインターセプタ。
	 *
	 * @param {Function} invocation 次に実行する関数
	 * @returns {Any} invocationの戻り値
	 * @memberOf h5.core.interceptor
	 */
	var lapInterceptor = h5.u.createInterceptor(function(invocation, data) {
		// 開始時間をdataオブジェクトに格納
		data.start = new Date();
		// invocationを実行
		return invocation.proceed();
	}, function(invocation, data) {
		// 終了時間を取得
		var end = new Date();
		// ログ出力
		this.log.info('{0} "{1}": {2}ms', this.__name, invocation.funcName, (end - data.start));
	});

	/**
	 * イベントコンテキストに格納されているものをコンソールに出力するインターセプタ。
	 *
	 * @param {Function} invocation 次に実行する関数
	 * @returns {Any} invocationの戻り値
	 * @memberOf h5.core.interceptor
	 */
	var logInterceptor = h5.u.createInterceptor(function(invocation) {
		this.log.info('{0} "{1}"が開始されました。', this.__name, invocation.funcName);
		this.log.info(invocation.args);
		return invocation.proceed();
	}, function(invocation) {
		this.log.info('{0} "{1}"が終了しました。', this.__name, invocation.funcName);
	});

	/**
	 * invocationからあがってきたエラーを受け取りcommonFailHandlerに処理を任せるインターセプタ。
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
	$(window.document).trigger('h5preinit');

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
		_compileAspects: compileAspects
	});
	/* del end */
})();
