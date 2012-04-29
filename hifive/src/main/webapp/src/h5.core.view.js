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

/* ------ h5.core.view ------ */
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
	 * テンプレート文字列のコンパイル時に発生するエラー
	 */
	var ERR_CODE_TEMPLATE_COMPILE = 7000;

	/**
	 * テンプレートファイルの内容読み込み時に発生するエラー
	 */
	var ERR_CODE_TEMPLATE_FILE = 7001;

	/**
	 * テンプレートIDが不正である時に発生するエラー
	 */
	var ERR_CODE_TEMPLATE_INVALID_ID = 7002;

	/**
	 * テンプレートファイルの取得時に発生するエラー
	 */
	var ERR_CODE_TEMPLATE_AJAX = 7003;

	/**
	 * load()呼び出し時に引数にファイル名またはファイル名の配列が渡されなかった時に発生するエラー
	 */
	var ERR_CODE_INVALID_FILE_PATH = 7004;

	/**
	 * 登録されていないテンプレートIDを指定したときに発生するエラー
	 */
	var ERR_CODE_TEMPLATE_ID_UNAVAILABLE = 7005;

	/**
	 * テンプレートに渡すパラメータに必要なプロパティが設定されていない時に発生するエラー
	 */
	var ERR_CODE_TEMPLATE_PROPATY_UNDEFINED = 7006;

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_TEMPLATE_COMPILE] = 'テンプレートをコンパイルできませんでした。{0}';
	errMsgMap[ERR_CODE_TEMPLATE_FILE] = 'テンプレートファイルが不正です。{0}';
	errMsgMap[ERR_CODE_TEMPLATE_INVALID_ID] = 'テンプレートIDが指定されていません';
	errMsgMap[ERR_CODE_TEMPLATE_AJAX] = 'テンプレートファイルを取得できませんでした。';
	errMsgMap[ERR_CODE_INVALID_FILE_PATH] = 'テンプレートファイルが指定されていません。';
	errMsgMap[ERR_CODE_TEMPLATE_ID_UNAVAILABLE] = 'テンプレートID:{0} テンプレートがありません。';
	errMsgMap[ERR_CODE_TEMPLATE_PROPATY_UNDEFINED] = '{0} テンプレートにパラメータが設定されていません。';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);

	/**
	 * register(id,str)でstrにstring型以外が渡されたときに発生させる例外のdetailに格納するメッセージ。
	 */
	var ERR_REASON_TEMPLATE_IS_NOT_STRING = 'テンプレートには文字列を指定してください';

	/**
	 * scriptタグで囲まれていないテンプレートを読み込んだ時のメッセージ
	 */
	var ERR_REASON_SCRIPT_ELEMENT_IS_NOT_EXIST = 'scriptタグが見つかりません。テンプレート文字列はscriptタグで囲って記述して下さい。';

	/**
	 * テンプレートのコンパイルエラー時に発生するメッセージ
	 */
	var ERR_REASON_SYNTAX_ERR = '構文エラー {0}{1}';

	/**
	 * EJSにスクリプトレットの区切りとして認識させる文字
	 */
	var DELIMITER = '[';

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.core.view');

	/* del begin */

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

	/**
	 * EJSテンプレート内で使用可能なヘルパー関数を格納するオブジェクト
	 */
	var helperExtras = {

		/**
		 * HTML文字列をエスケープします。
		 *
		 * @param {String} str エスケープ対象文字列
		 * @returns {String} エスケープされた文字列
		 */
		escapeHtml: function(str) {
			return h5.u.str.escapeHtml(str);
		}
	};

	/**
	 * テンプレートファイルをURL毎にキャッシュします。テンプレートファイルを取得するときに、キャッシュ済みであればアクセスしません。
	 */
	var cacheManager = {
		/**
		 * キャッシュの最大数
		 */
		MAX_CACHE: 10,

		/**
		 * URLとテンプレートオブジェクトを格納するキャッシュ
		 */
		cache: {},

		/**
		 * 現在キャッシュしているURLを保持する配列。もっとも使用されていないURLが配列の先頭にくるようソートされています。
		 */
		cacheUrls: [],

		/**
		 * 現在アクセス中のURL(絶対パス)をkeyにして、そのpromiseオブジェクトを持つ連想配列
		 */
		accessingUrls: [],

		/**
		 * コンパイル済みテンプレートオブジェクトをキャッシュします。
		 *
		 * @param {String} url URL(絶対パス)
		 * @param {Object} compiled コンパイル済みテンプレートオブジェクト
		 * @param {String} [path] 相対パス
		 */
		append: function(url, compiled, path) {
			if (this.cacheUrls.length >= this.MAX_CACHE) {
				this.deleteCache(this.cacheUrls[0]);
			}
			this.cache[url] = {};
			this.cache[url].templates = compiled;
			this.cache[url].path = path;
			this.cacheUrls.push(url);
		},

		/* del begin */
		/**
		 * テンプレートのグローバルキャッシュが保持しているURL、指定された相対パス、テンプレートIDを持ったオブジェクトを返します。 この関数は開発版でのみ利用できます。
		 *
		 * @returns {Array[Object]} グローバルキャッシュが保持しているテンプレート情報オブジェクトの配列。 [{path:(指定されたパス、相対パス),
		 *          absoluteUrl:(絶対パス), ids:(ファイルから取得したテンプレートのIDの配列)} ,...]
		 */
		getCacheInfo: function() {
			var ret = [];
			for ( var url in this.cache) {
				var obj = cache[url];
				var ids = [];
				for ( var id in obj.templates) {
					ids.push(id);
				}
				ret.push({
					path: obj.path,
					absoluteUrl: url,
					ids: ids
				});
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
			for ( var i = 0, len = this.cacheUrls.length; i < len; i++) {
				if (this.cacheUrls[i] === url) {
					this.cacheUrls.splice(i, 1);
					break;
				}
			}
		},

		/**
		 * 指定されたテンプレートパスからテンプレートを非同期で読み込みます。 テンプレートパスがキャッシュに存在する場合はキャッシュから読み込みます。
		 *
		 * @param {Array[String]} resourcePaths テンプレートパス
		 * @returns {Object} Promiseオブジェクト
		 */
		getTemplateByUrls: function(resourcePaths) {
			var ret = {};
			var tasks = [];
			var datas = [];

			var that = this;
			/**
			 * キャッシュからテンプレートを取得します。
			 *
			 * @param {String} url ファイルの絶対パス
			 * @returns {Object} テンプレートIDがkeyである、コンパイル済みテンプレートオブジェクトを持つオブジェクト
			 */
			var getTemplateByURL = function(url) {
				var ret = that.cache[url].templates;
				that.deleteCache(url, true);
				that.cacheUrls.push(url);
				return ret;
			};

			/**
			 * テンプレートをEJS用にコンパイルされたテンプレートに変換します。
			 *
			 * @param {jQuery} $templateElements テンプレートが記述されている要素(<script type="text/ejs">...</script>)
			 * @returns {Object}
			 *          テンプレートIDがkeyである、コンパイル済みテンプレートオブジェクトを持つオブジェクトと、テンプレートを取得したファイルパスと絶対パス(URL)を保持するオブジェクト
			 */
			function compileTemplatesByElements($templateElements) {
				if ($templateElements.length === 0) {
					return;
				}

				/**
				 * テンプレート読み込み結果オブジェクト
				 */
				var compiled = {};
				/**
				 * 読み込んだテンプレートのIDを覚えておく
				 */
				var ids = [];

				$templateElements.each(function() {
					var templateId = $.trim(this.id);
					var templateString = $.trim(this.innerHTML);
					if (templateId == null) {// 空文字は許容する。
						throwFwError(ERR_CODE_TEMPLATE_INVALID_ID, null, {});
					}

					try {
						var compiledTemplate = new EJS.Compiler(templateString, DELIMITER);
						compiledTemplate.compile();
						compiled[templateId] = compiledTemplate.process;
						ids.push(templateId);
					} catch (e) {
						var lineNo = e.lineNumber;
						var msg = lineNo ? ' line:' + lineNo : '';
						throwFwError(ERR_CODE_TEMPLATE_COMPILE, [h5.u.str.format(
								ERR_REASON_SYNTAX_ERR, msg, e.message)], {
							id: templateId,
							error: e
						});
					}
				});
				return {
					compiled: compiled,
					data: {
						ids: ids
					}
				};
			}
			;

			// キャッシュにあればそれを結果に格納し、なければajaxで取得する。
			for ( var i = 0; i < resourcePaths.length; i++) {
				var path = resourcePaths[i];
				var absolutePath = toAbsoluteUrl(path);
				if (this.cache[absolutePath]) {
					$.extend(ret, getTemplateByURL(absolutePath));
					datas.push({
						absoluteUrl: absolutePath
					});
					continue;
				}
				tasks.push(path);
			}

			var df = getDeferred();

			function load(task, count) {
				var step = count || 0;
				if (task.length == step) {
					df.resolve();
					return;
				}
				var filePath = task[step];
				var absolutePath = toAbsoluteUrl(filePath);
				if (!that.accessingUrls[absolutePath]) {
					that.accessingUrls[absolutePath] = h5.ajax(filePath);
				}

				that.accessingUrls[absolutePath].then(
						function(result, statusText, obj) {
							delete that.accessingUrls[absolutePath];
							var templateText = obj.responseText;
							// IE8以下で、テンプレート要素内にSCRIPTタグが含まれていると、jQueryが</SCRIPT>をunknownElementとして扱ってしまうため、ここで除去する
							var $elements = $(templateText).filter(
									function() {
										// nodeType:8 コメントノード
										return (this.tagName && this.tagName.indexOf('/') === -1)
												&& this.nodeType !== 8;
									});
							var filePath = this.url;

							if ($elements.not('script[type="text/ejs"]').length > 0) {
								df.reject(createRejectReason(ERR_CODE_TEMPLATE_FILE,
										[ERR_REASON_SCRIPT_ELEMENT_IS_NOT_EXIST], {
											url: absolutePath,
											path: filePath
										}));
							}
							var compileData = null;
							try {
								compileData = compileTemplatesByElements($elements
										.filter('script[type="text/ejs"]'));
							} catch (e) {
								e.detail.url = absolutePath;
								e.detail.path = filePath;
								df.reject(e);
							}
							try {
								var compiled = compileData.compiled;
								var data = compileData.data;
								data.path = filePath;
								data.absoluteUrl = absolutePath;
								$.extend(ret, compiled);
								datas.push(data);
								that.append(absolutePath, compiled, filePath);
								load(task, ++step);
							} catch (e) {
								df.reject(createRejectReason(ERR_CODE_TEMPLATE_FILE, null, {
									error: e,
									url: absolutePath,
									path: filePath
								}));
							}
						}).fail(function(e) {
					df.reject(createRejectReason(ERR_CODE_TEMPLATE_AJAX, null, {
						url: absolutePath,
						path: filePath,
						error: e
					}));
					return;
				});

				return df.promise();
			}

			var parentDf = getDeferred();

			$.when(load(tasks)).done(function() {
				parentDf.resolve(ret, datas);
			}).fail(function(e) {
				parentDf.reject(e);
			});

			return parentDf.promise();
		}
	};

	// =============================
	// Functions
	// =============================

	/**
	 * jQueryオブジェクトか判定し、jQueryオブジェクトならそのまま、そうでないならjQueryオブジェクトに変換して返します。
	 *
	 * @function
	 * @param {Object} obj DOM要素
	 * @returns {Object} jQueryObject
	 */
	function getJQueryObj(obj) {
		return h5.u.obj.isJQueryObject(obj) ? obj : $(obj);
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	/**
	 * テンプレートを扱うクラス。
	 * <p>
	 * コントローラは内部にViewインスタンスを持ち、コントローラ内であればthis.viewで参照することができます。
	 * </p>
	 *
	 * @class
	 * @name View
	 */
	function View() {
		/**
		 * キャッシュしたテンプレートを保持するオブジェクト
		 *
		 * @name __cachedTemplates
		 * @memberOf View
		 */
		this.__cachedTemplates = {};
	}
	;

	$.extend(View.prototype, {
		/**
		 * 指定されたパスのテンプレートファイルを非同期で読み込みキャッシュします。
		 *
		 * @memberOf View
		 * @name load
		 * @function
		 * @param {String|Array[String]} resourcePaths テンプレートファイル(.ejs)のパス (配列で複数指定可能)
		 * @returns {Promise} promiseオブジェクト
		 */
		load: function(resourcePaths) {
			var dfd = getDeferred();
			var that = this;

			var paths = null;

			// resourcePathsが文字列か配列でなかったらエラーを投げます。
			switch ($.type(resourcePaths)) {
			case 'string':
				if (!resourcePaths) {
					throwFwError(ERR_CODE_INVALID_FILE_PATH, []);
				}
				paths = [resourcePaths];
				break;
			case 'array':
				paths = resourcePaths;
				if (paths.length === 0) {
					throwFwError(ERR_CODE_INVALID_FILE_PATH, []);
				}
				break;
			default:
				throwFwError(ERR_CODE_INVALID_FILE_PATH, []);
				break;
			}

			cacheManager.getTemplateByUrls(paths).done(function(result, datas) {
				/* del begin */
				for ( var id in result) {
					if (that.__cachedTemplates[id]) {
						fwLogger.info('テンプレートID:{0} は上書きされました。', id);
					}
				}
				/* del end */
				$.extend(that.__cachedTemplates, result);
				dfd.resolve(datas);
			}).fail(function(e) {
				dfd.reject(e);
			});
			return dfd.promise();
		},

		/**
		 * Viewインスタンスに登録されている、利用可能なテンプレートのIDの配列を返します。
		 *
		 * @memberOf View
		 * @name getAvailableTemplates
		 * @function
		 * @returns {Array[String]} テンプレートIDの配列
		 */
		getAvailableTemplates: function() {
			var ids = [];
			for ( var id in this.__cachedTemplates) {
				ids.push(id);
			}
			return ids;
		},
		/**
		 * Viewインスタンスに、指定されたIDとテンプレート文字列からテンプレートを1件登録します。
		 * <p>
		 * 指定されたIDのテンプレートがすでに存在する場合は上書きします。 templateStringが不正な場合はエラーを投げます。
		 * </p>
		 *
		 * @memberOf View
		 * @name register
		 * @function
		 * @param {String} templateId テンプレートID
		 * @param {String} templateString テンプレート文字列
		 */
		register: function(templateId, templateString) {
			if ($.type(templateString) !== 'string') {
				throwFwError(ERR_CODE_TEMPLATE_COMPILE, [ERR_REASON_TEMPLATE_IS_NOT_STRING], {
					id: templateId
				});
			} else if (!templateId) {
				throwFwError(ERR_CODE_TEMPLATE_INVALID_ID, []);
			}

			try {
				var compiledTemplate = new EJS.Compiler(templateString, DELIMITER);
				compiledTemplate.compile();
				this.__cachedTemplates[templateId] = compiledTemplate.process;
			} catch (e) {
				var lineNo = e.lineNumber;
				var msg = lineNo ? ' line:' + lineNo : '';
				throwFwError(ERR_CODE_TEMPLATE_COMPILE, [h5.u.str.format(ERR_REASON_SYNTAX_ERR,
						msg, e.message)], {
					id: templateId
				});
			}
		},

		/**
		 * テンプレート文字列が、コンパイルできるかどうかを返します。
		 *
		 * @memberOf View
		 * @name isValid
		 * @function
		 * @returns {Boolean} 第一引数に渡されたテンプレート文字列がコンパイル可能かどうか。
		 */
		isValid: function(templateString) {
			try {
				new EJS.Compiler(templateString, DELIMITER).compile();
				return true;
			} catch (e) {
				return false;
			}
		},

		/**
		 * パラメータで置換された、指定されたテンプレートIDのテンプレートを取得します。
		 * <p>
		 * 取得するテンプレート内に置換要素([%= %])が存在する場合、パラメータを全て指定してください。
		 * </p>
		 * <p>
		 * templateIdがこのViewインスタンスで利用可能でなければエラーを投げます。
		 * </p>
		 * <p> ※ ただし、コントローラが持つviewインスタンスから呼ばれた場合、templateIdが利用可能でない場合は再帰的に親コントローラをたどり、
		 * 親コントローラが持つViewインスタンスで利用可能かどうか確認します。 利用可能であれば、そのインスタンスのview.get()を実行します。
		 * </p>
		 * <p>
		 * 一番上の親のViewインスタンスまで辿ってもtemplateId利用可能でなければ場合はh5.core.view.get()を実行します。
		 * h5.core.viewでtemplateIdが利用可能でなければエラーを投げます。
		 * </p>
		 * <p>
		 * <a href="#update">update()</a>, <a href="#append">append()</a>, <a
		 * href="#prepend">prepend()</a>についても同様です。
		 * </p>
		 *
		 * @memberOf View
		 * @name get
		 * @function
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ(オブジェクトリテラルで指定)
		 * @returns {String} テンプレート文字列
		 */
		get: function(templateId, param) {
			var cache = this.__cachedTemplates;

			if ($.isEmptyObject(cache)) {
				return null;
			}

			if (!templateId) {
				fwLogger.info(errMsgMap[ERR_CODE_TEMPLATE_INVALID_ID]);
				throwFwError(ERR_CODE_TEMPLATE_INVALID_ID);
			}

			var template = cache[templateId];

			if (!template) {
				fwLogger.info(errMsgMap[ERR_CODE_TEMPLATE_ID_UNAVAILABLE], templateId);
				throwFwError(ERR_CODE_TEMPLATE_ID_UNAVAILABLE, templateId);
			}

			var p = (param) ? $.extend(true, {}, param) : {};
			var helper = p.hasOwnProperty('_h') ? new EJS.Helpers(p) : new EJS.Helpers(p, {
				_h: helperExtras
			});
			var ret = null;

			try {
				ret = template.call(p, p, helper);
			} catch (e) {
				fwLogger.info(errMsgMap[ERR_CODE_TEMPLATE_PROPATY_UNDEFINED], e.toString());
				throwFwError(ERR_CODE_TEMPLATE_PROPATY_UNDEFINED, e.toString(), e);
			}

			return ret;
		},

		/**
		 * 要素を指定されたIDのテンプレートで書き換えます。
		 * <p>
		 * templateIdがこのViewインスタンスで利用可能でなければエラーを投げますが、
		 * コントローラが持つviewインスタンスから呼ばれた場合は親コントローラのviewを再帰的にたどります。詳細は<a href="#get">get()</a>をご覧ください。
		 * </p>
		 *
		 * @memberOf View
		 * @name update
		 * @function
		 * @param {String|Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ
		 * @returns {Object} テンプレートが適用されたDOM要素 (jQueryオブジェクト)
		 */
		update: function(element, templateId, param) {
			return getJQueryObj(element).html(this.get(templateId, param));
		},

		/**
		 * 要素の末尾に指定されたIDのテンプレートを挿入します。
		 * <p>
		 * templateIdがこのViewインスタンスで利用可能でなければエラーを投げますが、
		 * コントローラが持つviewインスタンスから呼ばれた場合は親コントローラのviewを再帰的にたどります。詳細は<a href="#get">get()</a>をご覧ください。
		 * </p>
		 *
		 * @memberOf View
		 * @name append
		 * @function
		 * @param {Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ
		 * @returns {Object} テンプレートが適用されたDOM要素
		 */
		append: function(element, templateId, param) {
			return getJQueryObj(element).append(this.get(templateId, param));
		},

		/**
		 * 要素の先頭に指定されたIDのテンプレートを挿入します。
		 * <p>
		 * templateIdがこのViewインスタンスで利用可能でなければエラーを投げますが、
		 * コントローラが持つviewインスタンスから呼ばれた場合は親コントローラのviewを再帰的にたどります。詳細は<a href="#get">get()</a>をご覧ください。
		 * </p>
		 *
		 * @memberOf View
		 * @name prepend
		 * @function
		 * @param {String|Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ
		 * @returns {Object} テンプレートが適用されたDOM要素 (jQueryオブジェクト)
		 */
		prepend: function(element, templateId, param) {
			return getJQueryObj(element).prepend(this.get(templateId, param));
		},

		/**
		 * 指定されたテンプレートIDのテンプレートが存在するか判定します。
		 *
		 * @memberOf View
		 * @name isAvailable
		 * @function
		 * @param {String} templateId テンプレートID
		 * @returns {Boolean} 判定結果(存在する: true / 存在しない: false)
		 */
		isAvailable: function(templateId) {
			return !!this.__cachedTemplates[templateId];
		},

		/**
		 * 引数に指定されたテンプレートIDをもつテンプレートをキャッシュから削除します。 引数を指定しない場合はキャッシュされている全てのテンプレートを削除します。
		 *
		 * @memberOf View
		 * @name clear
		 * @param {String|String[]} テンプレートID
		 * @function
		 */
		clear: function(templateIds) {
			if (templateIds === undefined) {
				this.__cachedTemplates = {};
				return;
			}

			var templateIdsArray = null;
			switch ($.type(templateIds)) {
			case 'string':
				templateIdsArray = [templateIds];
				break;
			case 'array':
				templateIdsArray = templateIds;
				break;
			default:
				templateIdsArray = [];
				break;
			}

			for ( var i = 0, len = templateIdsArray.length; i < len; i++) {
				delete this.__cachedTemplates[templateIdsArray[i]];
			}
		}
	});

	var view = new View();

	/**
	 * <a href="./View.html">View</a>クラスのインスタンスを生成します。
	 * <p>
	 * この関数はh5.core.viewに公開されたViewインスタンスのみが持ちます。この関数で作られたViewインスタンスはcreateView()を持ちません。
	 * </p>
	 *
	 * @name createView
	 * @memberOf h5.core.view
	 * @function
	 */
	view.createView = function() {
		return new View();
	};

	/**
	 * HTMLに記述されたテンプレートを読み込む
	 * <p>
	 * HTMLにあるテンプレートが構文エラーの場合は、例外そのままスローする。
	 */
	$(function() {
		$('script[type="text/ejs"]').each(function() {
			var templateId = $.trim(this.id);
			var templateText = $.trim(this.innerHTML);

			if (templateText.length === 0 || !templateId) {
				return;
			}

			var compiledTemplate = new EJS.Compiler(templateText, DELIMITER);
			compiledTemplate.compile();
			view.__cachedTemplates[templateId] = compiledTemplate.process;
		});
	});

	// =============================
	// Expose to window
	// =============================

	/**
	 * グローバルに公開されているViewクラスのインスタンスです。
	 *
	 * @name view
	 * @memberOf h5.core
	 * @see View
	 * @namespace
	 */
	h5.u.obj.expose('h5.core', {
		view: view
	});

	/* del begin */
	// 開発支援用にcacheManagerをグローバルに出す。
	h5.u.obj.expose('h5.dev.core.view', {
		cacheManager: cacheManager
	});
	/* del end */

})();
