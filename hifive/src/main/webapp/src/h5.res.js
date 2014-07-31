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
	var ERR_CODE_TEMPLATE_FILE_NO_TEMPLATE = 7001;

	/** テンプレートIDが不正である時に発生するエラー */
	var ERR_CODE_TEMPLATE_INVALID_ID = 7002;

	/** テンプレートファイルの取得時に発生するエラー */
	var ERR_CODE_TEMPLATE_AJAX = 7003;

	/** テンプレートファイルにscriptタグ以外の記述がある */
	var ERR_CODE_TEMPLATE_FILE_INVALID_ELEMENT = 7011;

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
	errMsgMap[ERR_CODE_TEMPLATE_FILE_NO_TEMPLATE] = 'テンプレートファイルに<script>タグの記述がありません。テンプレートファイルは全て<script>タグで囲んだテンプレートを記述してください';
	errMsgMap[ERR_CODE_TEMPLATE_INVALID_ID] = 'テンプレートIDが指定されていません。空や空白でない文字列で指定してください。';
	errMsgMap[ERR_CODE_TEMPLATE_AJAX] = 'テンプレートファイルを取得できませんでした。ステータスコード:{0}, URL:{1}';
	errMsgMap[ERR_CODE_TEMPLATE_FILE_INVALID_ELEMENT] = 'テンプレートファイルに<script>タグ以外の記述があります。テンプレートファイルは全て<script>タグで囲んだテンプレートを記述してください';

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
	var getDeferred = h5.async.deferred;

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
	 * ViewTemplateクラス
	 */
	function ViewTemplate(id, content) {
		this.id = id;
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

	/**
	 * リソースのキャッシュ機構
	 * <p>
	 * リソースをURL毎にキャッシュします。キャッシュ済みのものはそれを返し、そうでないものは新たにキャッシュして返します
	 * </p>
	 *
	 * @private
	 */
	var cacheManager = {
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
				this.clearCache(this.cacheUrls[0]);
			}
			var url = resource.url;
			this.cache[url] = resource;
			this.cacheUrls.push(url);
		},

		/**
		 * 指定されたパスのキャッシュを削除します。
		 *
		 * @param {String} path ファイルパス
		 * @param {Boolean} isOnlyUrls trueを指定された場合、キャッシュは消さずに、キャッシュしているURLリストから引数に指定されたURLを削除します。
		 */
		clearCache: function(path, isOnlyUrls) {
			var url = toAbsoluteUrl(path)
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
		 * キャッシュを全て削除します
		 */
		clearAllCache: function() {
			this.cacheUrls = [];
			this.cache = {};
		},

		/**
		 * キャッシュからリソースを取得
		 *
		 * @param {String} url ファイルの絶対パス
		 */
		getResourceFromCache: function(url) {
			var ret = this.cache[url];
			this.clearCache(url, true);
			this.cacheUrls.push(url);
			return ret;
		},

		/**
		 * urlからリソースを取得。プロミスを返し、ResourceCacheをハンドラに渡す
		 *
		 * @param {String} path
		 * @returns {Promise}
		 */
		loadResourceFromPath: function(path) {
			var absolutePath = toAbsoluteUrl(path);

			// 現在アクセス中のURLであれば、そのpromiseを返す
			if (this.accessingUrls[absolutePath]) {
				return this.accessingUrls[absolutePath];
			}

			var df = getDeferred();
			var promise = df.promise();
			this.accessingUrls[absolutePath] = promise;
			var manager = this;
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
		// TODO プロミスのインターフェイスを持つ必要ある…？あるならコメントアウトを外す
		// var dfd = getDeferred();
		// dfd.promise(this);
	}
	$.extend(Dependency.prototype, {
		/**
		 * resourceKeyに基づいて依存関係を解決します
		 * <p>
		 * 登録されているリゾルバでresolveできないリソースキーの場合はfalseを返します
		 * </p>
		 *
		 * @param {String} type
		 */
		resolve: function(type) {
			var resourceKey = this._resourceKey;
			var resolver = null;

			// リゾルバを特定する
			for (var i = 0, l = resolvers.length; i < l; i++) {
				if (type && type !== resolvers[i].type) {
					// typeが指定されている場合はtypeと一致するかどうか見る
					continue;
				}
				var ret = resolvers[i].resolver(resourceKey, type);
				if (ret === false) {
					continue;
				}
				// リゾルバがfalse以外のものを返せばそれを返す
				return ret;
			}
			// false以外のものを返すリゾルバが無かった場合はfalseを返す
			return false;
		},

		/**
		 * 指定されたリソースキーを返します
		 *
		 * @returns {String} リソースキー
		 */
		getKey: function() {
			return this._resourceKey;
		}
	});

	/**
	 * カレントを考慮したファイルパスの取得
	 *
	 * @param {String} filePath
	 * @returns {String}
	 */
	function getFilePath(filePath) {
		// './'で始まるパスが指定されていたら'./'を取り除いてcurrentPathを先頭に追加する
		filePath = filePath.indexOf('./') === 0 ? filePath.slice(2) : filePath;
		return (h5.settings.res.currentPath || './') + filePath;
	}

	/**
	 * 名前空間からjsファイルをロードするリゾルバ
	 *
	 * @param {String} resourceKey
	 * @returns {Promise} 解決した名前空間オブジェクトをresolveで渡します
	 */
	function resolveNamespace(resourceKey) {
		var ret = h5.u.obj.getByPath(resourceKey);
		if (ret) {
			// 既にある場合はresolve済みのプロミスを返す
			return getDeferred().resolve(ret).promise();
		}
		// "."を"/"に変えてファイルパスを取得
		var filePath = getFilePath(resourceKey.replace(/\./g, '/')) + '.js';
		// loadScriptでロードする
		var dfd = getDeferred();
		h5.u.loadScript(filePath).done(function() {
			dfd.resolve(h5.u.obj.getByPath(resourceKey));
		}).fail(function(errorObj) {
			dfd.reject(errorObj);
		});
		return dfd.promise();
	}

	/**
	 * ejsファイルリゾルバ
	 *
	 * @param {String} resourceKey
	 * @returns {Promise} 以下のようなオブジェクトをresolveで返します
	 *
	 * <pre><code>
	 * {
	 *  path: ロードしたファイルのパス,
	 * 	url: ロードしたファイルのURL(絶対パス),
	 * 	templates: [{id: テンプレートID, content: テンプレートの中身}, ...]
	 * }
	 * </code></pre>
	 */
	function resolveEJSTemplate(resourceKey) {
		// 拡張子の判定。クエリパラメータ('?'以降の文字列)を除いた文字列が".ejs"で終わっているかどうか
		if (!/\.ejs$/.test(resourceKey.slice(0, (resourceKey + '?').indexOf('?')))) {
			// .ejsで終わっていないファイルは無視
			return false;
		}
		var dfd = getDeferred();
		urlLoader.load(getFilePath(resourceKey)).done(function(resource) {
			// コンテンツからscript要素を取得
			var $elements = $(resource.content).filter(function() {
				// IE8以下で、要素内にSCRIPTタグが含まれていると、jQueryが</SCRIPT>をunknownElementとして扱ってしまう。
				// nodeTypeを見てコメントノードも除去して、tagNameが'/SCRIPT'のものも除去する。
				return this.nodeType === 1 && this.tagName.indexOf('/') !== 1;
			});
			var textResources = [];
			if ($elements.not('script[type="text/ejs"]').length > 0) {
				// テンプレート記述以外のタグがあ場合はエラー
				dfd.reject(createRejectReason(ERR_CODE_TEMPLATE_FILE_INVALID_ELEMENT, null, {
					url: resource.url,
					path: resource.path
				}));
				return;
			}
			if ($elements.length === 0) {
				// テンプレート記述が一つもない場合はエラー
				dfd.reject(createRejectReason(ERR_CODE_TEMPLATE_FILE_NO_TEMPLATE, null, {
					url: resource.url,
					path: resource.path
				}));
			}
			// script要素からViewTemplateを作成
			$elements.each(function() {
				var id = $.trim(this.id);
				if (!id) {
					dfd.reject(createRejectReason(ERR_CODE_TEMPLATE_INVALID_ID, null, {
						url: resource.url,
						path: resource.path
					}));
				}
				var content = $.trim(this.innerHTML);
				textResources.push(new ViewTemplate(id, content));
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
					// テンプレートのロードが投げるエラー(Viewのエラー)にする
					// インスタンスは変更しないようにする
					var detail = errorObj.detail;
					var viewErrorObj = createRejectReason(ERR_CODE_TEMPLATE_AJAX, [
							detail.error.status, detail.url], detail);
					errorObj.code = viewErrorObj.code;
					errorObj.message = viewErrorObj.message;
					errorObj.detail = errorObj.detail;
					dfd.reject(errorObj);
				});
		return dfd.promise();
	}

	/**
	 * jsファイルのデフォルトのリゾルバを作成する
	 *
	 * @param {String} resourceKey
	 * @param {String} type
	 * @returns {Function} Viewリゾルバ
	 */
	function resolveJs(resourceKey, type) {
		if (!/\.js$/.test(resourceKey.slice(0, (resourceKey + '?').indexOf('?')))) {
			// .jsで終わっていないファイルは無視
			return false;
		}
		// loadScriptでロードする
		return h5.u.loadScript(getFilePath(resourceKey));
	}
	/**
	 * cssファイルのデフォルトのリゾルバを作成する
	 *
	 * @param {String} resoruceKey
	 * @param {String} type
	 * @returns {Function} Viewリゾルバ
	 */
	function resolveCss(resourceKey, type) {
		if (!/\.css$/.test(resourceKey.slice(0, (resourceKey + '?').indexOf('?')))) {
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
		return getDeferred().resolve(cssNode).promise();
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
	 * キャッシュ機構を使用してURLへアクセスします
	 *
	 * @memberOf h5.res
	 * @name urlLoader
	 */
	var urlLoader = {
		/**
		 * 指定されたテンプレートパスからテンプレートを非同期で読み込みます。 テンプレートパスがキャッシュに存在する場合はキャッシュから読み込みます。
		 *
		 * @param {String} resourcePath リソースパス
		 * @returns {Object} Promiseオブジェクト
		 */
		load: function(resourcePath) {
			var absolutePath = toAbsoluteUrl(resourcePath);
			// キャッシュにある場合
			if (cacheManager.cache[absolutePath]) {
				// キャッシュから取得したリソースを返す
				// 新しくDeferredを作ってプロミスを返す
				return getDeferred().resolve(cacheManager.getResourceFromCache(absolutePath))
						.promise();
			}
			// キャッシュにない場合
			// urlからロードして、そのプロミスを返す
			return cacheManager.loadResourceFromPath(resourcePath);
		},

		/**
		 * URL(path)を指定してキャッシュをクリアする
		 *
		 * @param {String} path
		 */
		clearCache: function(path) {
			cacheManager.clearCache(path);
		},
		/**
		 * URLキャッシュをすべてクリアする
		 */
		clearAllCache: function() {
			cacheManager.clearAllCache();
		}
	};

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
	 * @param {String} type リゾルバのタイプ。リゾルバをタイプと紐づける。nullを指定した場合はtypeに紐づかないリゾルバを登録します。
	 * @param {Function} resolver リゾルバ
	 */
	function addResolver(type, resolver) {
		if (resolver === undefined && isFunction(type)) {
			// 第1引数に関数が指定されていて第2引数の指定がない場合はtype指定無しのリゾルバとみなす
			// TODO とりあえずの実装です。引数の指定方法、引数チェック等、詳細仕様が決まり次第実装します。
			resolver = type;
			type = undefined;
		}
		// 先頭に追加する
		resolvers.unshift({
			type: type,
			resolver: resolver
		});
	}

	// デフォルトリゾルバの登録
	addResolver('namespace', resolveNamespace);
	addResolver('ejsfile', resolveEJSTemplate);
	addResolver('jsfile', resolveJs);
	addResolver('cssfile', resolveCss);

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
		urlLoader: urlLoader,
		resolvers: resolvers
	});

})();
