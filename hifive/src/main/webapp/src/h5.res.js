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

/* ------ h5.res ------ */
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

	//	var fwLogger = h5.log.createLogger('h5.res');
	//
	//	/* del begin */
	//
	//	/**
	//	 * 各エラーコードに対応するメッセージ
	//	 */
	//	var errMsgMap = {};
	//
	//	// メッセージの登録
	//	addFwErrorCodeMap(errMsgMap);
	//	/* del end */


	// =========================================================================
	//
	// Cache
	//
	// =========================================================================

	var isPromise = h5.async.isPromise;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================

	/** リゾルバのリスト保持する配列 */
	var resolvers = [];

	// =============================
	// Functions
	// =============================
	/**
	 * Dependencyクラス
	 * <p>
	 * <a href="h5.res.html#reequire">h5.res.require()</a>がこのクラスのインスタンスを返します。
	 * </p>
	 */
	function Dependency(resourceKey) {
		this._resourceKey = resourceKey;
		var dfd = $.Deferred();
		// プロミスのインターフェイスを持たせる
		dfd.promise(this);
	}
	$.extend(Dependency.prototype, {
		/**
		 * resourceKeyに基づいて依存関係を解決します
		 * <p>
		 * 登録されているリゾルバでresolveできないリソースキーの場合はfalseを返します
		 * </p>
		 */
		resolve: function() {
			var promise = false;
			var resourceKey = this._resourceKey;
			for (var i = 0, l = resolvers.length; i < l; i++) {
				var ret = resolvers[i](resourceKey);
				if (isPromise(ret)) {
					// プロミスを返すリゾルバがあったらそのリゾルバが返すプロミスを待機する
					promise = ret;
					break;
				}
			}
			// リゾルバがプロミスを返せばそのプロミス、プロミスを返すリゾルバが無かった場合はfalseを返す
			return promise;
		}
	});

	/**
	 * カレントを考慮したファイルパスの取得
	 *
	 * @returns {String}
	 */
	function getFilePath(filePath) {
		return (h5.settings.currentPath || './') + filePath;
	}

	/**
	 * 名前空間からjsファイルをロードするリゾルバを作成する
	 *
	 * @returns {Function} Viewリゾルバ
	 */
	function createNamespaceResolver() {
		return function(namespace) {
			var ret = h5.u.obj.getByPath(namespace);
			if (ret) {
				// 既にある場合はresolve済みのプロミスを返す
				return $.Deferred().resolve(ret).promise();
			}
			// "."を"/"に変えてファイルパスを取得
			var filePath = getFilePath(namespace.replace(/\./g, '/')) + '.js';
			// loadScriptでロードする
			var dfd = $.Deferred();
			h5.u.loadScript(filePath).done(function() {
				dfd.resolve(h5.u.obj.getByPath(namespace));
			}).fail(function(/* var_args */) {
				dfd.reject(argsToArray(arguments));
			});
			return dfd.promise();
		};
	}

	/**
	 * ejsファイルのデフォルトのリゾルバを作成する
	 *
	 * @returns {Function} Viewリゾルバ
	 */
	function createViewResolver() {
		return function(filePath) {
			if (!/\.ejs$/.test(filePath)) {
				// .ejsで終わっていないファイルは無視
				return false;
			}
			var dfd = $.Deferred();
			// TODO VeiwTemplateクラスを作ってそれを返すようにする
			var view = h5.core.view.createView();
			view.load(getFilePath(filePath)).done(function() {
				dfd.resolve(view.__cachedTemplates);
			}).fail(function(/* var_args */) {
				dfd.reject(argsToArray(arguments));
			});
			return dfd.promise();
		};
	}

	/**
	 * jsファイルのデフォルトのリゾルバを作成する
	 *
	 * @returns {Function} Viewリゾルバ
	 */
	function createJsResolver() {
		return function(filePath) {
			if (!/\.js$/.test(filePath)) {
				// .jsで終わっていないファイルは無視
				return false;
			}
			// loadScriptでロードする
			return h5.u.loadScript(getFilePath(filePath));
		};
	}

	/**
	 * cssファイルのデフォルトのリゾルバを作成する
	 *
	 * @returns {Function} Viewリゾルバ
	 */
	function createCssResolver() {
		return function(filePath) {
			if (!/\.css$/.test(filePath)) {
				// .cssで終わっていないファイルは無視
				return false;
			}
			var head = document.getElementsByTagName('head')[0];

			var cssNode = document.createElement('link');
			cssNode.type = 'text/css';
			cssNode.rel = 'stylesheet';
			cssNode.href = getFilePath(filePath);
			head.appendChild(cssNode);

			// 同期でresolve
			// TODO cssのロードを待機する必要ある…？
			return $.Deferred().resolve().promise();
		};
	}

	/**
	 * 引数がDependencyクラスかどうか判定
	 *
	 * @param {Any} obj
	 * @returns {Boolean} Dependencyクラスかどうか
	 */
	function isDependency(obj) {
		return obj instanceof Dependency;
	}
	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * リソースキーから、Dependencyオブジェクトを返します
	 *
	 * @param {String} resourceKey
	 */
	function require(resourceKey) {
		return new Dependency(resourceKey);
	}

	/**
	 * リゾルバを追加します
	 *
	 * @param {Function} resolver
	 */
	function addResolver(resolver) {
		// 先頭に追加する
		resolvers.unshift(resolver);
	}

	// デフォルトリゾルバの登録
	addResolver(createNamespaceResolver());
	addResolver(createViewResolver());
	addResolver(createJsResolver());
	addResolver(createCssResolver());

	// =============================
	// Expose to window
	// =============================

	/**
	 * @namespace
	 * @name res
	 * @memberOf h5
	 */
	h5.u.obj.expose('h5.res', {
		require: require,
		addResolver: addResolver,
		isDependency: isDependency
	});

})();
