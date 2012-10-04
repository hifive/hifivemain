/*
 * Copyright (C) 2012 NS Solutions Corporation
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

/* ------ h5.ui.jqm.manager ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	var ERR_CODE_INVALID_TYPE = 12000;
	var ERR_CODE_NAME_INVALID_PARAMETER = 12001;

	// エラーコードマップ
	var errMsgMap = {};
	errMsgMap[ERR_CODE_INVALID_TYPE] = '引数{0}が不正です。正しい値を指定して下さい。';
	errMsgMap[ERR_CODE_NAME_INVALID_PARAMETER] = '引数の指定に誤りがあります。第2引数にCSSファイルパス、第3引数にコントローラ定義オブジェクトを指定して下さい。';
	addFwErrorCodeMap(errMsgMap);

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.ui.jqm.manager');
	/* del begin */
	// TODO Minify時にプリプロセッサで削除されるべきものはこの中に書く
	var FW_LOG_JQM_CONTROLLER_ALREADY_INITIALIZED = '既にJQMマネージャは初期化されています。';
	var FW_LOG_CONTROLLER_DEF_ALREADY_DEFINED = '既にコントローラ"{0}"はJQMマネージャに登録されています。';
	var FW_LOG_CSS_FILE_PATH_ALREADY_DEFINED = '既にCSSファイル"{0}"はJQMマネージャに登録されています。';
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
	/**
	 * JQMControllerのインスタンス(シングルトン)
	 */
	var jqmControllerInstance = null;

	/**
	 * コントローラのマップ
	 * <p>
	 * キー：ページID、値：コントローラ定義オブジェクト
	 *
	 * @type Object
	 */
	var controllerMap = {};

	/**
	 * コントローラインスタンスのマップ
	 * <p>
	 * キー：ページID、値：コントローラインスタンスの配列
	 *
	 * @type Object
	 */
	var controllerInstanceMap = {};

	/**
	 * JQMManagerで管理する、h5.core.controller()で動的に生成されたコントローラインスタンスを保持するマップ
	 * <p>
	 * キー：ページID、値：コントローラインスタンスの配列
	 *
	 * @type Object
	 */
	var dynamicControllerInstanceMap = {};

	/**
	 * 初期化パラメータのマップ
	 * <p>
	 * キー：ページID、値：初期化パラメータの配列
	 *
	 * @type Object
	 */
	var initParamMap = {};

	/**
	 * CSSファイルのマップ
	 * <p>
	 * キー：ページID、値：CSSファイルパスのオブジェクトの配列
	 *
	 * @type Object
	 */
	var cssMap = {};

	/**
	 * h5.ui.jqm.manager.init()が呼ばれたかどうかを示すフラグ
	 *
	 * @type Boolean
	 */
	var initCalled = false;

	// =============================
	// Functions
	// =============================

	/**
	 * 現在のアクティブページにコントローラをバインドします。
	 */
	function bindToActivePage() {
		var activePage = $.mobile.activePage;
		if (!activePage) {
			return;
		}
		var id = activePage.attr('id');

		jqmControllerInstance.addCSS(id);
		jqmControllerInstance.bindController(id);
	}

	/**
	 * コントローラインスタンスの__nameプロパティとコントローラ定義オブジェクトの__nameプロパティを比較し、同値であるかを判定します。
	 *
	 * @param {Object[]} controllerInstances コントローラインスタンスを保持する配列
	 * @param {Object} controllerDefObj コントローラ定義オブジェクト
	 */
	function equalsControllerName(controllerInstances, controllerDefObj) {
		var ret = false;

		for ( var i = 0, len = controllerInstances.length; i < len; i++) {
			var ci = controllerInstances[i];
			if (ci && ci.__name === controllerDefObj.__name) {
				ret = true;
				break;
			}
		}

		return ret;
	}

	// 関数は関数式ではなく function myFunction(){} のように関数定義で書く

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	/**
	 * @name jqm
	 * @memberOf h5.ui
	 * @namespace
	 */
	h5.u.obj.ns('h5.ui.jqm');

	/**
	 * hifiveで使用するdata属性のプレフィックス。<br />
	 * デフォルトは"h5"。
	 *
	 * @type String
	 * @memberOf h5.ui.jqm
	 * @name dataPrefix
	 */
	h5.ui.jqm.dataPrefix = 'h5';

	/**
	 * JQMコントローラ
	 */
	var jqmController = {
		/**
		 * コントローラ名
		 *
		 * @memberOf JQMController
		 */
		__name: 'JQMController',

		/**
		 * __readyイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		__ready: function(context) {
			var that = this;
			$(':jqmData(role="page"), :jqmData(role="dialog")').each(function() {
				that.loadScript(this.id);
			});
		},

		/**
		 * pageinitイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		':jqmData(role="page"), :jqmData(role="dialog") pageinit': function(context) {
			var id = context.event.target.id;
			this.loadScript(id);
			this.addCSS(id);
			this.bindController(id);
		},

		/**
		 * pageremoveイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		'{document} pageremove': function(context) {
			var id = context.event.target.id;
			var controllers = controllerInstanceMap[id];
			var dynamicControllers = dynamicControllerInstanceMap[id];

			if (controllers) {
				for ( var i = 0, len = controllers.length; i < len; i++) {
					controllers[i].dispose();
				}

				controllerInstanceMap[id] = [];
			}

			if (dynamicControllers) {
				for ( var i = 0, len = dynamicControllers.length; i < len; i++) {
					dynamicControllers[i].dispose();
				}

				dynamicControllerInstanceMap[id] = [];
			}
		},

		/**
		 * pagebeforeshowイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		'{document} pagebeforeshow': function(context) {
			var id = context.event.target.id;
			var prop = null;

			this.addCSS(id);

			// リスナーの有効・無効の切り替え
			for (prop in controllerInstanceMap) {
				var controllers = controllerInstanceMap[prop];
				var pageControllerEnabled = id === prop;

				for ( var i = 0, len = controllers.length; i < len; i++) {
					var controller = controllers[i];
					pageControllerEnabled ? controller.enableListeners() : controller
							.disableListeners();
				}
			}

			for (prop in dynamicControllerInstanceMap) {
				var dynamicControllers = dynamicControllerInstanceMap[prop];
				var dynamicControllerEnabled = id === prop;

				for ( var i = 0, len = dynamicControllers.length; i < len; i++) {
					var dynamicController = dynamicControllers[i];
					dynamicControllerEnabled ? dynamicController.enableListeners()
							: dynamicController.disableListeners();
				}
			}
		},

		/**
		 * pagehideイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		'{document} pagehide': function(context) {
			this.removeCSS(context.event.target.id);
		},

		/**
		 * h5controllerboundイベントを監視しコントローラインスタンスを管理するためのイベントハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		'{rootElement} h5controllerbound': function(context) {
			var boundController = context.evArg;

			if (this === boundController) {
				return;
			}

			if (!$.mobile.activePage) {
				return;
			}

			var id = $.mobile.activePage.attr('id');

			if (isString(id) && id.length > 0) {
				// define()でバインドしたコントローラも、h5controllerboundイベントを発火するので、
				// このイベントを発生させたコントローラが、define()によってバインドしたコントローラか判定する
				// ↑がtrue = 「既にJQMManagerの管理対象になっているコントローラ」なので、dynamicControllerInstanceMapに含めない
				if ($.inArray(boundController, controllerInstanceMap[id]) !== -1) {
					return;
				}

				if (!dynamicControllerInstanceMap[id]) {
					dynamicControllerInstanceMap[id] = [];
				}

				dynamicControllerInstanceMap[id].push(boundController);
			}
		},

		/**
		 * 指定されたページIDに紐付くスクリプトをロードする。
		 *
		 * @param {String} id ページID
		 * @memberOf JQMController
		 */
		loadScript: function(id) {
			var page = $('#' + id);
			var script = $.trim(page.data(this.getDataAttribute('script')));
			if (script.length === 0) {
				return;
			}
			var src = $.map(script.split(','), function(n) {
				return $.trim(n);
			});
			var async = page.data(this.getDataAttribute('async')) == true;
			return h5.u.loadScript(src, {
				async: async
			});
		},

		/**
		 * JQMコントローラが使用するdata属性にprefixを付けた属性名を返す。
		 *
		 * @param {String} attributeName 属性名
		 * @returns {String} prefixを付けた属性名
		 */
		getDataAttribute: function(attributeName) {
			var prefix = h5.ui.jqm.dataPrefix;
			if (prefix == null) {
				prefix = 'h5';
			}
			return prefix.length !== 0 ? prefix + '-' + attributeName : attributeName;
		},

		/**
		 * コントローラのバインドを行う
		 *
		 * @param {String} id ページID
		 * @memberOf JQMController
		 */
		bindController: function(id) {
			var controllerDefs = controllerMap[id];
			var initParams = initParamMap[id];

			if (!controllerDefs || controllerDefs.length === 0) {
				return;
			}

			if (!controllerInstanceMap[id]) {
				controllerInstanceMap[id] = [];
			}

			var ci = controllerInstanceMap[id];

			for ( var i = 0, len = controllerDefs.length; i < len; i++) {
				var defObj = controllerDefs[i];

				if (equalsControllerName(ci, defObj)) {
					continue;
				}

				controllerInstanceMap[id].push(h5.core.controller('#' + id, defObj, initParams[i]));
			}
		},

		/**
		 * 指定されたページIDに紐付くCSSをHEADに追加する。
		 *
		 * @param {String} id ページID
		 * @memberOf JQMController
		 */
		addCSS: function(id) {
			var src = cssMap[id];

			if (!src) {
				return;
			}

			var head = document.getElementsByTagName('head')[0];
			var linkTags = head.getElementsByTagName('link');
			var linkLen = linkTags.length;

			for ( var i = 0, srcLen = src.length; i < srcLen; i++) {
				var path = $.mobile.path.parseUrl(src[i]).filename;
				var isLoaded = false;

				for ( var j = 0; j < linkLen; j++) {
					var loadedPath = $.mobile.path.parseUrl(linkTags[j].href).filename;

					if (loadedPath === path) {
						isLoaded = true;
						break;
					}
				}

				if (isLoaded) {
					continue;
				}

				var cssNode = document.createElement('link');
				cssNode.type = 'text/css';
				cssNode.rel = 'stylesheet';
				cssNode.href = src[i];
				head.appendChild(cssNode);
			}
		},

		/**
		 * 指定されたページIDに紐付くCSSを削除する。
		 *
		 * @param {String} id ページID
		 * @memberOf JQMController
		 */
		removeCSS: function(id) {
			var fromPageCSS = cssMap[id];

			if (!fromPageCSS) {
				return;
			}

			var activeId = $.mobile.activePage.attr('id');
			var toPageCSS = cssMap[activeId];

			$('link').filter(function() {
				var href = $(this).attr('href');
				// 遷移元のページで使用していたCSSファイルを、遷移先のページでも使用する場合はremoveしない
				return $.inArray(href, fromPageCSS) !== -1 && $.inArray(href, toPageCSS) === -1;
			}).remove();
		}
	};

	// =============================
	// Expose to window
	// =============================

	/**
	 * jQuery Mobile専用コントローラマネージャ (JQM Manager)
	 * <p>
	 * 現在表示されているページ(アクティブページ)に指定したコントローラとCSSファイルを読み込むという定義を行うことにより、 jQuery
	 * Mobile特有のページのライフサイクル(DOM生成や破棄)にあわせて、ページに対して
	 * <ul>
	 * <li>コントローラで定義したハンドラ</li>
	 * <li>スタイル(CSSファイル)</li>
	 * </ul>
	 * の有効・無効化を行います。
	 * <p>
	 * JQM Managerはページ内で動的に作成した(h5.core.controller()で生成した)コントローラも管理します。<br>
	 * 動的に生成したコントローラもページに紐づくものとして管理し、define()で生成したコントローラと同様に、ページの遷移によってハンドラとスタイルの有効・無効化を行います。
	 * <p>
	 * 動的に生成されたコントローラは、そのページに内で起こったユーザー操作などによって初めて作られるものと考えられるため、
	 * pageremoveイベントが発生してページが破棄されると、そのページに紐づいたコントローラのインスタンスも破棄されます。
	 *
	 * @name manager
	 * @memberOf h5.ui.jqm
	 * @namespace
	 */
	h5.u.obj.expose('h5.ui.jqm.manager',
			{

				/**
				 * jQuery Mobile用hifiveコントローラマネージャを初期化します。
				 * <p>
				 * 2回目以降は何も処理を行いません。
				 *
				 * @memberOf h5.ui.jqm.manager
				 * @function
				 * @name init
				 */
				init: function() {
					if (initCalled) {
						fwLogger.info(FW_LOG_JQM_CONTROLLER_ALREADY_INITIALIZED);
						return;
					}
					initCalled = true;
					$(function() {
						jqmControllerInstance = h5internal.core.controllerInternal('body',
								jqmController, null, {
									managed: false
								});
						bindToActivePage();
					});
				},

				/**
				 * jQuery Mobile用hifiveコントローラマネージャにコントローラを登録します。
				 * <p>
				 * 「data-role="page"」または「data-role="dialog"」の属性が指定された要素でかつ、
				 * idが第1引数で指定されたものに一致する要素に対してコントローラを登録します。
				 * <p>
				 * 1つのページに複数コントローラを登録することもできます。<br>
				 * 以下のように、登録したいコントローラ定義オブジェクトの数分、define()を実行して下さい。
				 *
				 * <pre>
				 * h5.ui.jqm.manager.define('pageA', 'css/pageA.css', controllerDefA, defAParams);
				 * h5.ui.jqm.manager.define('pageA', 'css/pageA.css', controllerDefB, defBParams);
				 * </pre>
				 *
				 * 注意:<br>
				 * ただし、ページに同じコントローラを2つ以上バインドすることはできません。<br>
				 * 同じコントローラであるかの判定は、コントローラ定義オブジェクトの<b>__name</b>プロパティの値がバインド済みのコントローラと同値であるか比較し、同値の場合はバインドされません。
				 *
				 * @param {String} id ページID
				 * @param {String|String[]} [cssSrc] CSSファイルのパス
				 * @param {Object} [controllerDefObject] コントローラ定義オブジェクト
				 * @param {Object} [initParam] 初期化パラメータ (ライフサイクルイベント(__construct, __init,
				 *            __ready)の引数にargsプロパティとして渡されます)
				 * @memberOf h5.ui.jqm.manager
				 * @function
				 * @name define
				 */
				define: function(id, cssSrc, controllerDefObject, initParam) {
					if (!isString(id)) {
						throw new throwFwError(ERR_CODE_INVALID_TYPE, 'id');
					}

					if (cssSrc != null && !isString(cssSrc) && !$.isArray(cssSrc)) {
						throw new throwFwError(ERR_CODE_INVALID_TYPE, 'cssSrc');
					}

					if (controllerDefObject != null) {
						if (isString(controllerDefObject) || $.isArray(controllerDefObject)) {
							throw new throwFwError(ERR_CODE_NAME_INVALID_PARAMETER);
						}

						if (!$.isPlainObject(controllerDefObject)
								|| !('__name' in controllerDefObject)) {
							throw new throwFwError(ERR_CODE_INVALID_TYPE, 'controllerDefObject');
						}

						if (initParam != null && !$.isPlainObject(initParam)) {
							throw new throwFwError(ERR_CODE_INVALID_TYPE, 'initParam');
						}
					}

					if (!cssMap[id]) {
						cssMap[id] = [];
					}

					if (!controllerMap[id]) {
						controllerMap[id] = [];
					}

					if (!initParamMap[id]) {
						initParamMap[id] = [];
					}

					$.merge(cssMap[id], $.map($.makeArray(cssSrc), function(val, i) {
						if ($.inArray(val, cssMap[id]) !== -1) {
							fwLogger.info(FW_LOG_CSS_FILE_PATH_ALREADY_DEFINED, val);
							return null;
						}
						return val;
					}));

					if (controllerDefObject) {
						if ($.inArray(controllerDefObject, controllerMap[id]) === -1) {
							controllerMap[id].push(controllerDefObject);
							initParamMap[id].push(initParam);
						} else {
							fwLogger.info(FW_LOG_CONTROLLER_DEF_ALREADY_DEFINED,
									controllerDefObject.__name);
						}
					}

					if ($.mobile.activePage && $.mobile.activePage.attr('id') === id
							&& jqmControllerInstance) {
						bindToActivePage();
					} else {
						this.init();
					}
				}
				/* del begin */
				,
				/*
				 * テスト用に公開
				 * JQMControllerが管理しているコントローラへの参照と、JQMControllerインスタンスへの参照を除去し、JQMControllerをdisposeをします。
				 *
				 * @memberOf h5.ui.jqm.manager
				 * @function
				 * @name __reset
				 */
				__reset: function() {
					if (jqmControllerInstance) {
						jqmControllerInstance.dispose();
						jqmControllerInstance = null;
					}
					controllerMap = {};
					controllerInstanceMap = {};
					dynamicControllerInstanceMap = {};
					initParamMap = {};
					cssMap = {};
					initCalled = false;
				}
			/* del end */
			});
})();
