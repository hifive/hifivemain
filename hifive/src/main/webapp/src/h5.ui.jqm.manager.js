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

	// =============================
	// Development Only
	// =============================
	var fwLogger = h5.log.createLogger('h5.ui.jqm.manager');

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
	/**
	 * JQMControllerのインスタンス(シングルトン)
	 */
	var jqmControllerInstance = null;

	/**
	 * コントローラのマップ キー：ページID、値：コントローラ定義オブジェクト
	 *
	 * @type Object
	 */
	var controllerMap = {};

	/**
	 * コントローラインスタンスのマップ キー：ページID、値：コントローラインスタンスの配列
	 *
	 * @type Object
	 */
	var controllerInstanceMap = {};

	/**
	 * 初期化パラメータのマップ キー：ページID、値：初期化パラメータ
	 *
	 * @type Object
	 */
	var initParamMap = {};

	/**
	 * dispose対象から外すページの配列
	 *
	 * @type Object[]
	 */
	var excludeDispose = [];

	/**
	 * CSSファイルのマップ キー：ページID、値：CSSファイルパスのオブジェクト
	 *
	 * @type Object
	 */
	var cssMap = {};

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
		var controllers = controllerInstanceMap[id];
		if (controllerMap[id] && (!controllers || controllers.length === 0)) {
			jqmControllerInstance.addCSS(id);
			jqmControllerInstance.bindController(id);
		}
	}
	// TODO モジュールレベルのプライベート関数はここに書く
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
	 *
	 * @name JQMController
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
			excludeDispose.push(this.rootElement);
			$(':jqmData(role="page"), :jqmData(role="dialog")').each(function() {
				excludeDispose.push(this);
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
			if (!controllers) {
				return;
			}
			for ( var i = 0, len = controllers.length; i < len; i++) {
				controllers[i].dispose();
			}
			controllerInstanceMap[id] = [];
		},

		/**
		 * pagebeforeshowイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		'{document} pagebeforeshow': function(context) {
			var id = context.event.target.id;
			this.addCSS(id);

			// リスナーの有効・無効の切り替え
			for ( var prop in controllerInstanceMap) {
				var controllers = controllerInstanceMap[prop];
				var enable = id === prop;

				for ( var i = 0, len = controllers.length; i < len; i++) {
					var c = controllers[i];
					enable ? c.enableListeners() : c.disableListeners();
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
		'* h5controllerbound': function(context) {
			var id = context.event.target.id;
			if (!controllerInstanceMap[id]) {
				controllerInstanceMap[id] = [];
			}
			controllerInstanceMap[id].push(context.evArg);
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
			var controllers = controllerInstanceMap[id];
			if (!controllerMap[id] || (controllers && controllers.length > 0)) {
				return;
			}
			h5.core.controller('#' + id, controllerMap[id], initParamMap[id]);
		},

		/**
		 * 指定されたページIDに紐付くCSSを追加する。
		 *
		 * @param {String} id ページID
		 * @memberOf JQMController
		 */
		addCSS: function(id) {
			if (this.firstAddCSS) {
				this.firstAddCSS = false;
			}

			var src = cssMap[id];

			if (!src) {
				return;
			}

			var head = document.getElementsByTagName('head')[0];
			var linkTags = head.getElementsByTagName('link');
			var linkLen = linkTags.length;

			src = wrapInArray(src);
			for ( var i = 0, srcLen = src.length; i < srcLen; i++) {
				var path = $.mobile.path.parseUrl(cssMap[id][i]).filename;
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
				cssNode.href = cssMap[id][i];
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
			var current = cssMap[id];
			if (!current) {
				return;
			}
			var activeId = $.mobile.activePage.attr('id');
			var active = cssMap[activeId];
			var src = wrapInArray(current);
			var activeSrc = wrapInArray(active);
			var css = $('link').filter(function() {
				var href = $(this).attr('href');
				return $.inArray(href, src) !== -1 && $.inArray(href, activeSrc) === -1;
			});
			css.remove();
		}
	};

	// =============================
	// Expose to window
	// =============================

	/**
	 * @name manager
	 * @memberOf h5.ui.jqm
	 * @namespace
	 */
	h5.u.obj.expose('h5.ui.jqm.manager', {

		/**
		 * jQuery Mobile用hifiveコントローラマネージャを初期化します。<br />
		 * 2回目以降は何も処理を行いません。
		 *
		 * @memberOf h5.ui.jqm.manager
		 * @function
		 * @name init
		 */
		init: function() {
			$(function() {
				if (jqmControllerInstance) {
					fwLogger.info('JQMマネージャは既に初期化されています。');
				} else {
					jqmControllerInstance = h5.core.controller(document.body, jqmController);
				}
				bindToActivePage();
			});
		},

		/**
		 * jQuery Mobile用hifiveコントローラマネージャにコントローラを登録します。<br />
		 * 1画面1コントローラを想定しています。<br />
		 *
		 * @param {String} id ページID
		 * @param {String|String[]} cssSrc CSSファイルパス配列
		 * @param {Object} controllerDefObject コントローラを定義したオブジェクト
		 * @param {Object} initParam 初期化パラメータ
		 * @memberOf h5.ui.jqm.manager
		 * @function
		 * @name define
		 */
		define: function(id, cssSrc, controllerDefObject, initParam) {
			controllerMap[id] = controllerDefObject;
			initParamMap[id] = initParam;
			cssMap[id] = wrapInArray(cssSrc);
			!jqmControllerInstance ? h5.ui.jqm.manager.init() : bindToActivePage();
		}
	});
})();