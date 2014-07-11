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

	/**
	 * リソースファイルの取得時に発生するエラー
	 */
	var ERR_CODE_RESOURCE_AJAX = 17000;

	// ---------- EJSResolverのエラー ----------
	/** テンプレートファイルの内容読み込み時に発生するエラー */
	var ERR_CODE_TEMPLATE_FILE = 7001;

	/** テンプレートIDが不正である時に発生するエラー */
	var ERR_CODE_TEMPLATE_INVALID_ID = 7002;

	/** テンプレートファイルの取得時に発生するエラー */
	var ERR_CODE_TEMPLATE_AJAX = 7003;

	/** テンプレートファイルにscriptタグの記述がない */
	var ERR_CODE_TEMPLATE_FILE_NO_SCRIPT_ELEMENT = 7011;

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.res');

	/* del begin */
	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_RESOURCE_AJAX] = 'リソースファイルを取得できませんでした。ステータスコード:{0}, URL:{1}';

	// EJSResolverのエラー
	errMsgMap[ERR_CODE_TEMPLATE_FILE] = 'テンプレートファイルが不正です。';
	errMsgMap[ERR_CODE_TEMPLATE_INVALID_ID] = 'テンプレートIDが指定されていません。空や空白でない文字列で指定してください。';
	errMsgMap[ERR_CODE_TEMPLATE_AJAX] = 'テンプレートファイルを取得できませんでした。ステータスコード:{0}, URL:{1}';
	errMsgMap[ERR_CODE_TEMPLATE_FILE_NO_SCRIPT_ELEMENT] = 'テンプレートファイルに<script>タグの記述がありません。テンプレートは<script>タグで記述してください。';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);
	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	var isPromise = h5.async.isPromise;
	var argsToArray = h5.u.obj.argsToArray;

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

	/**
	 * TextResrouceクラス
	 */
	function TextResource(id, type, content) {
		this.id = id;
		this.type = type;
		this.content = content;
	}

	/**
	 * ResourceCacheクラス
	 */
	function ResourceCache(url, path, content) {
		this.url = url;
		this.path = path;
		this.content = content;
	}

	/** リソースのキャッシュ機構。リソースをURL毎にキャッシュします。キャッシュ済みのものはそれを返し、そうでないものは新たにキャッシュして返します * */
	var textResourceManager = {
		/**
		 * キャッシュの最大数
		 */
		MAX_CACHE: 10,

		/**
		 * URLとリソースを格納するキャッシュ
		 */
		cache: {},

		/**
		 * 現在キャッシュしているURLを保持する配列。もっとも使用されていないURLが配列の先頭にくるようソートされています。(LRU)
		 */
		cacheUrls: [],

		/**
		 * 現在アクセス中のURL(絶対パス)をkeyにして、そのpromiseオブジェクトを持つ連想配列
		 */
		accessingUrls: {},

		/**
		 * リソースをキャッシュします。
		 *
		 * @param {ResourceCache} resource ResourceCacheインスタンス
		 */
		append: function(resource) {
			if (this.cacheUrls.length >= this.MAX_CACHE) {
				this.deleteCache(this.cacheUrls[0]);
			}
			var url = resource.url;
			this.cache[url] = resource;
			this.cacheUrls.push(url);
		},

		/* del begin */
		/**
		 * テンプレートのグローバルキャッシュがResourceCacheの配列を返します。 この関数は開発版でのみ利用できます。
		 *
		 * @returns {ResourceCache[]} グローバルキャッシュが保持しているResourceCacheの配列
		 */
		getCacheInfo: function() {
			var ret = [];
			for ( var url in this.cache) {
				ret.push(this.cache[url]);
			}
			return ret;
		},
		/* del end */

		/**
		 * 指定されたURLのキャッシュを削除します。
		 *
		 * @param {String} url URL
		 * @param {Boolean} isOnlyUrls trueを指定された場合、キャッシュは消さずに、キャッシュしているURLリストから引数に指定されたURLを削除します。
		 */
		deleteCache: function(url, isOnlyUrls) {
			if (!isOnlyUrls) {
				delete this.cache[url];
			}
			for (var i = 0, len = this.cacheUrls.length; i < len; i++) {
				if (this.cacheUrls[i] === url) {
					this.cacheUrls.splice(i, 1);
					break;
				}
			}
		},

		/**
		 * キャッシュからリソースを取得
		 *
		 * @param {String} url ファイルの絶対パス
		 */
		getResourceFromCache: function(url) {
			var ret = this.cache[url];
			this.deleteCache(url, true);
			this.cacheUrls.push(url);
			return ret;
		},

		/**
		 * urlからリソースを取得。プロミスを返し、ResourceCacheをハンドラに渡す
		 *
		 * @param {String} path
		 * @returns {Promise}
		 */
		loadResource: function(path) {
			var absolutePath = toAbsoluteUrl(path);

			// 現在アクセス中のURLであれば、そのpromiseを返す
			if (this.accessingUrls[absolutePath]) {
				return this.accessingUrls[absolutePath];
			}

			var df = $.Deferred();
			var promise = df.promise();
			this.accessingUrls[absolutePath] = promise;
			var manager = this;
			var absolutePath = toAbsoluteUrl(path);
			h5.ajax(path).done(function(result, statusText, obj) {
				// アクセス中のURLのプロミスを保持するaccessingUrlsから、このURLのプロミスを削除する
				delete manager.accessingUrls[absolutePath];
				// ResourceCacheオブジェクトを作成してキャッシュに登録
				var resource = new ResourceCache(absolutePath, path, obj.responseText);
				manager.append(resource);
				df.resolve(resource);
			}).fail(function(e) {
				// アクセス中のURLのプロミスを保持するaccessingUrlsから、このURLのプロミスを削除する
				delete manager.accessingUrls[absolutePath];

				df.reject(createRejectReason(ERR_CODE_RESOURCE_AJAX, [e.status, absolutePath], {
					url: absolutePath,
					path: path,
					error: e
				}));
				return;
			});
			return promise;
		},

		/**
		 * 指定されたテンプレートパスからテンプレートを非同期で読み込みます。 テンプレートパスがキャッシュに存在する場合はキャッシュから読み込みます。
		 *
		 * @param {String} resourcePath リソースパス
		 * @returns {Object} Promiseオブジェクト
		 */
		getResource: function(resourcePath) {
			var absolutePath = toAbsoluteUrl(resourcePath);
			// キャッシュにある場合
			if (this.cache[absolutePath]) {
				// キャッシュから取得したリソースを返す
				return $.Deferred().resolve(this.getResourceFromCache(absolutePath)).promise();
			}
			// キャッシュにない場合
			// urlからロード
			return this.loadResource(resourcePath);
		}
	};

	// =============================
	// Functions
	// =============================
	/**
	 * Dependencyクラス
	 * <p>
	 * <a href="h5.res.html#reequire">h5.res.require()</a>がこのクラスのインスタンスを返します。
	 * </p>
	 *
	 * @param {String} resourceKey
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
		// './'で始まるパスが指定されていたら'./'を取り除いてcurrentPathを先頭に追加する
		filePath = filePath.indexOf('./') === 0 ? filePath.slice(2) : filePath;
		return (h5.settings.res.currentPath || './') + filePath;
	}

	/**
	 * 名前空間からjsファイルをロードするリゾルバを作成する
	 *
	 * @returns {Function} Viewリゾルバ
	 */
	function resolveNamespace(resourceKey) {
		var ret = h5.u.obj.getByPath(resourceKey);
		if (ret) {
			// 既にある場合はresolve済みのプロミスを返す
			return $.Deferred().resolve(ret).promise();
		}
		// "."を"/"に変えてファイルパスを取得
		var filePath = getFilePath(resourceKey.replace(/\./g, '/')) + '.js';
		// loadScriptでロードする
		var dfd = $.Deferred();
		h5.u.loadScript(filePath).done(function() {
			dfd.resolve(h5.u.obj.getByPath(resourceKey));
		}).fail(function(/* var_args */) {
			dfd.reject(argsToArray(arguments));
		});
		return dfd.promise();
	}

	/**
	 * ejsファイルのリソース解決
	 *
	 * @param {resourceKey}
	 * @returns {Promise}
	 */
	function resolveEJSTemplate(resourceKey) {
		if (!/\.ejs$/.test(resourceKey)) {
			// .ejsで終わっていないファイルは無視
			return false;
		}
		var dfd = $.Deferred();
		textResourceManager.getResource(getFilePath(resourceKey)).done(function(resource) {
			// コンテンツからscript要素を取得
			var $elements = $(resource.content).filter(function() {
				// IE8以下で、要素内にSCRIPTタグが含まれていると、jQueryが</SCRIPT>をunknownElementとして扱ってしまう。
				// nodeTypeを見てコメントノードも除去して、tagNameが'/SCRIPT'のものも除去する。
				return this.nodeType === 1 && this.tagName.indexOf('/') !== 1;
			});
			var textResources = [];
			if ($elements.not('script[type="text/ejs"]').length > 0) {
				// テンプレート記述以外のタグがあ場合はエラー
				dfd.reject(createRejectReason(ERR_CODE_TEMPLATE_FILE_NO_SCRIPT_ELEMENT, null, {
					url: resource.url,
					path: resource.path
				}));
				return;
			}
			if ($elements.length === 0) {
				// テンプレート記述が一つもない場合はエラー
				dfd.reject(createRejectReason(ERR_CODE_TEMPLATE_FILE, null, {
					url: resource.url,
					path: resource.path
				}));
			}
			// script要素からTextResourceを作成
			$elements.each(function() {
				var id = $.trim(this.id);
				if (!id) {
					dfd.reject(createRejectReason(ERR_CODE_TEMPLATE_INVALID_ID, null, {
						url: resource.url,
						path: resource.path
					}));
				}
				var type = $.trim(this.getAttribute('type'));
				var content = $.trim(this.innerHTML);
				textResources.push(new TextResource(id, type, content));
			});

			// resolveする
			dfd.resolve({
				url: resource.url,
				path: resource.path,
				templates: textResources
			});
		}).fail(
				function(errorObj) {
					// リソースの取得に失敗
					// ここにくるエラーオブジェクトはgetResource()のエラーなので、
					// テンプレートのロードが投げるエラー(Viewのエラー)に差し替える
					var detail = errorObj.detail;
					dfd.reject(createRejectReason(ERR_CODE_TEMPLATE_AJAX, [detail.error.status,
							detail.url], detail));
					dfd.reject(errorObj);
				});
		return dfd.promise();
	}

	/**
	 * jsファイルのデフォルトのリゾルバを作成する
	 *
	 * @returns {Function} Viewリゾルバ
	 */
	function resolveJs(resourceKey) {
		if (!/\.js$/.test(resourceKey)) {
			// .jsで終わっていないファイルは無視
			return false;
		}
		// loadScriptでロードする
		return h5.u.loadScript(getFilePath(resourceKey));
	}
	/**
	 * cssファイルのデフォルトのリゾルバを作成する
	 *
	 * @returns {Function} Viewリゾルバ
	 */
	function resolveCss(resourceKey) {
		if (!/\.css$/.test(resourceKey)) {
			// .cssで終わっていないファイルは無視
			return false;
		}
		var head = document.getElementsByTagName('head')[0];

		var cssNode = document.createElement('link');
		cssNode.type = 'text/css';
		cssNode.rel = 'stylesheet';
		cssNode.href = getFilePath(resourceKey);
		head.appendChild(cssNode);

		// 同期でresolve
		// TODO cssのロードを待機する必要ある…？
		return $.Deferred().resolve().promise();
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
	addResolver(resolveNamespace);
	addResolver(resolveEJSTemplate);
	addResolver(resolveJs);
	addResolver(resolveCss);

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
		isDependency: isDependency,
		getResource: function(resourcePath) {
			return textResourceManager.getResource(resourcePath);
		}
	});

})();
