/*
 * Copyright (C) 2014-2016 NS Solutions Corporation
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

	/**
	 * タイムアウト時のエラー
	 */
	var ERR_CODE_RESOLVE_TIMEOUT = 17001;

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
	errMsgMap[ERR_CODE_RESOLVE_TIMEOUT] = 'リソースキー"{0}"の解決がタイムアウトしました';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);
	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
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

	/** リソースキーをキーに、解決済コンポーネントを持つマップ */
	var componentMap = {};

	/** registerされるのを待っているDeferredのマップ */
	var waitingInfoMap = {};

	/** setImmediateでresolve処理を待っているdeferredの配列 */
	var waitingForImmediateDeferred = [];

	/** 非同期でresolveするのを待機するタイマーID(タイマーを複数作成しないようにするため) */
	var waitingImmediateTimer = null;

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
			var url = toAbsoluteUrl(path);
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
			h5.ajax(path, {
				dataType: 'text'
			}).done(function(result, statusText, obj) {
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

	/**
	 * キャッシュ機構を使用してURLへアクセスします
	 *
	 * @private
	 */
	var urlLoader = {
		/**
		 * 指定されたテンプレートパスからテンプレートを非同期で読み込みます。 テンプレートパスがキャッシュに存在する場合はキャッシュから読み込みます。
		 *
		 * @private
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

	// =============================
	// Functions
	// =============================
	/**
	 * Dependencyクラス
	 * <p>
	 * <a href="h5.res.html#reequire">h5.res.dependsOn()</a>がこのクラスのインスタンスを返します。
	 * </p>
	 *
	 * @class
	 * @name Dependency
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
		 * <p>
		 * 第1引数にリゾルバのタイプを指定した場合、登録されているリゾルバから同一タイプのものを探して、そのリゾルバを使って解決します。
		 * </p>
		 * <p>
		 * 第1引数を省略した場合は、リソースキーから使用するリゾルバを決定します。
		 * </p>
		 *
		 * @memberOf Dependency
		 * @param {String} [type] リゾルバタイプ
		 * @returns {Promise} 依存関係の解決を待機するプロミスオブジェクト
		 */
		resolve: function(type) {
			// リゾルバを特定する
			function resolveInner(resourceKey) {
				for (var i = 0, l = resolvers.length; i < l; i++) {
					if (type && type !== resolvers[i].type) {
						// typeが指定されている場合はtypeと一致するかどうか見る
						continue;
					}
					// typeが指定されていない場合は条件とマッチするか判定
					var test = resolvers[i].test;
					if (!type && test) {
						if ($.type(test) === 'regexp') {
							if (!test.test(resourceKey)) {
								continue;
							}
						} else {
							if (test(resourceKey) === false) {
								continue;
							}
						}
					}

					// リゾルバを実行
					return resolvers[i].resolver(resourceKey, type);
				}
				// false以外のものを返すリゾルバが無かった場合はfalseを返す
				return false;
			}

			if (!isArray(this._resourceKey)) {
				// リソースキーが配列でない場合
				return resolveInner(this._resourceKey);
			}

			// リソースキーが配列の場合
			var resourceKeys = this._resourceKey;
			var promises = [];
			for (var i = 0, l = resourceKeys.length; i < l; i++) {
				var resourceKey = resourceKeys[i];
				var ret = resolveInner(resourceKey);
				promises.push(ret);
			}
			var dfd = h5.async.deferred();
			waitForPromises(promises, function(results) {
				// 結果の配列、1番目の結果、2番目の結果、…となるように引数を生成
				if (!isArray(results)) {
					// 結果が配列でない場合(=リソースキーが長さ１の配列の場合)、配列にする
					results = [results];
				}
				results.unshift(results.slice(0));
				dfd.resolveWith(dfd, results);
			}, function(e) {
				dfd.reject(e);
			});
			return dfd.promise();
		},

		/**
		 * 指定されたリソースキーを返します
		 *
		 * @memberOf Dependency
		 * @returns {String} リソースキー
		 */
		getKey: function() {
			return this._resourceKey;
		}
	});

	/**
	 * カレントを考慮したファイルパスの取得
	 *
	 * @private
	 * @param {String} filePath
	 * @returns {String}
	 */
	function getFilePath(filePath) {
		var baseUrl = h5.settings.res.baseUrl;
		if (filePath === toAbsoluteUrl(filePath) || filePath.indexOf('/') === 0) {
			// filePathが絶対パスの場合、または、'/'始まりの場合は、filePathをそのまま返す
			return filePath;
		}
		if (!baseUrl) {
			// baseUrlが指定されていないなら'./'を付けて返す
			if (filePath.indexOf('./') === 0) {
				return filePath;
			}
			return './' + filePath;
		}

		// 上位パス指定('../')を取り除いて、baseUrlの上位をたどる
		function removeAbovePath(base, path) {
			if (path.indexOf('../') !== 0) {
				return base + path;
			}
			path = path.slice(3);
			base = base.replace(/[^\/]+?\/$/, '');
			return removeAbovePath(base, path);
		}
		// baseUrlを'/'終わりにして、上位パス指定の計算
		if (!h5.u.str.endsWith(baseUrl, '/')) {
			baseUrl += '/';
		}
		return removeAbovePath(baseUrl, filePath);
	}

	/**
	 * 名前空間からjsファイルをロードするリゾルバ
	 *
	 * @private
	 * @param {String} resourceKey
	 * @returns {Promise} 解決した名前空間オブジェクトをresolveで渡します
	 */
	function resolveNamespace(resourceKey) {
		var ret = componentMap[resourceKey] || h5.u.obj.getByPath(resourceKey);
		if (ret) {
			// 既に解決済みの場合はresolve済みのプロミスを返す
			return getDeferred().resolve(ret).promise();
		}
		// 現在解決待ちのリソースキーであれば、それを返す
		if (waitingInfoMap[resourceKey]) {
			return waitingInfoMap[resourceKey].deferred.promise();
		}
		// "."を"/"に変えてファイルパスを取得
		var filePath = getFilePath(resourceKey.replace(/\./g, '/')) + '.js';

		var dfd = getDeferred();
		// タイムアウト設定
		var resolveTimeout = h5.settings.res.resolveTimeout;
		var timer = null;
		if (resolveTimeout > 0) {
			timer = setTimeout(function() {
				if (waitingInfoMap[resourceKey]) {
					delete waitingInfoMap[resourceKey];
					dfd.reject(createRejectReason(ERR_CODE_RESOLVE_TIMEOUT, [resourceKey]));
				}
			}, resolveTimeout);
		}
		// registerされるのを待つ
		waitingInfoMap[resourceKey] = {
			deferred: dfd,
			timer: timer
		};
		var dep = this;

		h5.u.loadScript(filePath).done(function() {
			var ret = componentMap[resourceKey] || h5.u.obj.getByPath(resourceKey);
			if (ret && waitingInfoMap[resourceKey]) {
				componentMap[resourceKey] = ret;
				delete waitingInfoMap[resourceKey];
				clearTimeout(timer);
				dfd.resolve(ret);
				return;
			}
		}).fail(function(errorObj) {
			// loadScriptのエラー
			clearTimeout(timer);
			delete waitingInfoMap[resourceKey];
			dfd.reject(errorObj);
		});
		return dfd.promise();
	}

	/**
	 * ejsファイルリゾルバ
	 *
	 * @private
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
		var dfd = getDeferred();
		urlLoader.load(getFilePath(resourceKey)).done(function(resource) {
			// コンテンツからscript要素を取得
			var $elements = $(resource.content).filter(function() {
				// IE8以下で、要素内にSCRIPTタグが含まれていると、jQueryが&lt;/SCRIPT&gt;をunknownElementとして扱ってしまう。
				// nodeTypeを見てコメントノードも除去して、tagNameが'/SCRIPT'のものも除去する。
				return this.nodeType === 1 && this.tagName.indexOf('/') !== 0;
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
	 * @private
	 * @param {String} resourceKey
	 * @returns {Function} Viewリゾルバ
	 */
	function resolveJs(resourceKey) {
		// loadScriptでロードする
		return h5.u.loadScript(getFilePath(resourceKey));
	}
	/**
	 * cssファイルのデフォルトのリゾルバを作成する
	 *
	 * @private
	 * @param {String} resoruceKey
	 * @param {String} type
	 * @returns {Function} Viewリゾルバ
	 */
	function resolveCss(resourceKey) {
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
	 * リゾルバを追加します
	 *
	 * @private
	 * @param {String} type リゾルバのタイプ。リゾルバをタイプと紐づける。nullを指定した場合はtypeに紐づかないリゾルバを登録します。
	 * @param {RegExp|Function} test リソースキーがこのリゾルバにマッチするかどうかの正規表現、または関数
	 * @param {Function} resolver リゾルバ
	 */
	function addResolver(type, test, resolver) {
		if (resolver === undefined && isFunction(type)) {
			// 第1引数に関数が指定されていて第2引数の指定がない場合はtype指定無しのリゾルバとみなす
			// TODO とりあえずの実装です。引数の指定方法、引数チェック等、詳細仕様が決まり次第実装します。
			resolver = type;
			type = undefined;
		}
		// 先頭に追加する
		resolvers.unshift({
			type: type,
			test: test,
			resolver: resolver
		});
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * 引数がDependencyクラスかどうか判定
	 *
	 * @memberOf h5.res
	 * @param {Any} obj
	 * @returns {Boolean} Dependencyクラスかどうか
	 */
	function isDependency(obj) {
		return obj instanceof Dependency;
	}

	/**
	 * リソースキーから、Dependencyオブジェクトを返します
	 *
	 * @memberOf h5.res
	 * @param {String} resourceKey
	 * @returns {Dependency}
	 */
	function dependsOn(resourceKey) {
		return new Dependency(resourceKey);
	}

	/**
	 * 指定されたリソースキーの解決を行います
	 *
	 * @memberOf h5.res
	 * @param {String|Array} resourceKey
	 * @returns {Promise}
	 */
	function get(resourceKey) {
		return h5.res.dependsOn(resourceKey).resolve();
	}

	/**
	 * リソースの登録
	 *
	 * @memberOf h5.res
	 * @param {String} key
	 * @param {Any} value
	 * @param {Boolean} [exposeToGlobal=false] グローバルに公開するか
	 * @param {String} [exposureName=null] グローバル公開名
	 */
	function register(key, value, exposeToGlobal, exposureName) {
		if (exposeToGlobal) {
			if (exposureName) {
				h5.u.obj.expose(exposureName, value);
			} else {
				h5.u.obj.expose(key, value);
			}
		}
		// コンポーネントマップに登録
		componentMap[key] = value;
		// このリソースキーに紐づくdeferredが既に解決済み(waitingInfoから削除済み)なら何もしない
		var waitingInfo = waitingInfoMap[key];
		if (!waitingInfo) {
			return;
		}
		delete waitingInfoMap[key];
		var dfd = waitingInfo.deferred;
		var timer = waitingInfo.timer;
		if (timer) {
			// タイムアウト待ちタイマーをクリア
			clearTimeout(timer);
		}

		// 読込後の処理(register()呼び出し後)等が実行された後に、
		// ユーザコードのdoneハンドラが動作するようにするためsetTimeout使用
		// 既に動作しているタイマーがあれば新たにタイマーは作らない
		waitingForImmediateDeferred.push({
			dfd: dfd,
			value: value
		});
		if (!waitingImmediateTimer) {
			waitingImmediateTimer = setTimeout(function() {
				waitingImmediateTimer = null;
				var dfds = waitingForImmediateDeferred
						.splice(0, waitingForImmediateDeferred.length);
				for (var i = 0, l = dfds.length; i < l; i++) {
					dfds[i].dfd.resolve(dfds[i].value);
				}
			}, 0);
		}
	}

	// デフォルトリゾルバの登録
	addResolver('namespace', null, resolveNamespace);
	addResolver('ejsfile', /.*\.ejs(\?.*$|$)/, resolveEJSTemplate);
	addResolver('jsfile', /.*\.js(\?.*$|$)/, resolveJs);
	addResolver('cssfile', /.*\.css(\?.*$|$)/, resolveCss);

	// =============================
	// Expose to window
	// =============================

	/**
	 * @namespace
	 * @name res
	 * @memberOf h5
	 */
	h5.u.obj.expose('h5.res', {
		dependsOn: dependsOn,
		isDependency: isDependency,
		register: register,
		get: get
	});

})();
