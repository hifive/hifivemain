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

/* ------ h5.ui.jqm.manager ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	var EV_NAME_H5_JQM_PAGE_HIDE = 'h5jqmpagehide';
	var EV_NAME_H5_JQM_PAGE_SHOW = 'h5jqmpageshow';
	var EV_NAME_EMULATE_PAGE_SHOW = 'h5controllerready.emulatepageshow';

	// =============================
	// Production
	// =============================

	// エラーコード
	var ERR_CODE_INVALID_TYPE = 12000;
	var ERR_CODE_NAME_INVALID_PARAMETER = 12001;

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.ui.jqm.manager');
	/* del begin */
	var FW_LOG_JQM_CONTROLLER_ALREADY_INITIALIZED = '既にJQMマネージャは初期化されています。';
	var FW_LOG_CONTROLLER_DEF_ALREADY_DEFINED = '既にコントローラ"{0}"はJQMマネージャに登録されています。';
	var FW_LOG_CSS_FILE_PATH_ALREADY_DEFINED = '既にCSSファイル"{0}"はJQMマネージャに登録されています。';

	// エラーコードマップ
	var errMsgMap = {};
	errMsgMap[ERR_CODE_INVALID_TYPE] = '引数{0}が不正です。正しい値を指定して下さい。';
	errMsgMap[ERR_CODE_NAME_INVALID_PARAMETER] = '引数の指定に誤りがあります。第2引数にCSSファイルパス、第3引数にコントローラ定義オブジェクトを指定して下さい。';
	addFwErrorCodeMap(errMsgMap);
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
	 * ページをの初期化処理呼び出しをpagecreateイベントハンドラで行うかどうか
	 * <p>
	 * このフラグがtrueの場合はpagecreateイベントハンドラでページの初期化処理を呼び出します。
	 * falseの場合はpageinitイベントハンドラでページの初期化処理を呼び出します。
	 * </p>
	 * <p>
	 * jqm1.4より前ではpagecreateイベントはページのDOM拡張前、pageinitイベントはページのDOM拡張後に上がりますが、
	 * jqm1.4以降ではDOM拡張後にpagecreateが上がり、pageinitイベントはdeprecatedになりました。
	 * jqm1.4以降ではdeprecatedなpageinitではなくpagecreateイベントハンドラで初期化処理を行うようにします。
	 * </p>
	 * <p>
	 * フラグの値はh5.ui.jqm.manager.init時に設定します。
	 * </p>
	 */
	var shouldHandlePagecreateEvent;

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
	var isInitCalled = false;

	/**
	 * pagehideイベントが発生したかを判定するフラグ
	 *
	 * @type Boolean
	 */
	var hideEventFired = false;

	/**
	 * 初期表示時、アクティブページにバインドしたコントローラがreadyになるよりも前に、 pageshowが発火したかを判定するフラグ
	 *
	 * @type Boolean
	 */
	var showEventFiredBeforeReady = false;

	// =============================
	// Functions
	// =============================

	/**
	 * アクティブページに設定されているID属性の値を取得します。
	 * <p>
	 * アクティブページが存在しない、またはIDが1文字以上の文字列ではない場合nullを取得します。
	 */
	function getActivePageId() {
		var $ap = $.mobile.activePage;
		var id = $ap && $ap[0] && $ap[0].id;
		return isString(id) && id.length > 0 ? id : null;
	}

	/**
	 * 現在のアクティブページにコントローラをバインドします。
	 */
	function bindToActivePage() {
		var id = getActivePageId();

		if (id === null) {
			return;
		}
		// jqmControllerInstanceにインスタンスが格納されるのはinitの中で$(function(){})で囲って行っているため、
		// bindToActivePageがdocument.readyより前に呼ばれた場合はjqmControllerInstanceに値がまだ入っていない場合がある。
		// そのためjqmControllerInstanceのメソッド呼び出しは$(function(){})で囲って行っている。
		$(function() {
			jqmControllerInstance.addCSS(id);
			jqmControllerInstance.bindController(id);
		});
	}

	/**
	 * コントローラインスタンスの__nameプロパティとコントローラ定義オブジェクトの__nameプロパティを比較し、同値であるかを判定します。
	 *
	 * @param {Object[]} controllerInstances コントローラインスタンスを保持する配列
	 * @param {Object} controllerDefObj コントローラ定義オブジェクト
	 */
	function equalsControllerName(controllerInstances, controllerDefObj) {
		var ret = false;

		for (var i = 0, len = controllerInstances.length; i < len; i++) {
			var ci = controllerInstances[i];
			if (ci && ci.__name === controllerDefObj.__name) {
				ret = true;
				break;
			}
		}

		return ret;
	}

	/**
	 * JQMマネージャが管理する動的または静的コントローラが持つイベントハンドラの有効・無効化を行います
	 *
	 * @param {String} id ページID
	 * @param {Boolean} flag (true: ハンドラを有効化する / false: ハンドラを無効化する)
	 */
	function changeListenerState(id, flag) {
		for (var prop in controllerInstanceMap) {
			var controllers = controllerInstanceMap[prop];
			var pageControllerEnabled = id === prop;

			for (var i = 0, len = controllers.length; i < len; i++) {
				var controller = controllers[i];

				if (pageControllerEnabled) {
					controller[(flag ? 'enable' : 'disable') + 'Listeners']();
				}
			}
		}

		for (var prop in dynamicControllerInstanceMap) {
			var dynamicControllers = dynamicControllerInstanceMap[prop];
			var dynamicControllerEnabled = id === prop;

			for (var i = 0, len = dynamicControllers.length; i < len; i++) {
				var dynamicController = dynamicControllers[i];

				if (dynamicControllerEnabled) {
					dynamicController[(flag ? 'enable' : 'disable') + 'Listeners']();
				}
			}
		}
	}

	/**
	 * バージョン文字列の大小を比較する関数
	 * <p>
	 * '1.11.0', '1.9.9'のような'.'区切りのバージョン文字列を比較して、第1引数の方が小さければ-1、同じなら0、第2引数の方が小さければ1 を返す。
	 * </p>
	 *
	 * @param {String} a バージョン文字列
	 * @param {String} b バージョン文字列
	 * @returns {Integer} 比較結果。aがbより小さいなら-1、同じなら0、aがbより大きいなら1 を返す
	 */
	function compareVersion(a, b) {
		// '.0'が末尾にならない様にする
		a = a.replace(/(\.0+)+$/, '');
		b = b.replace(/(\.0+)+$/, '');

		if (a === b) {
			// aとbが同じならループで比較せずに0を返す
			return 0;
		}
		var aAry = a.split('.');
		var bAry = b.split('.');

		var aAryLen = aAry.length;
		for (var i = 0; i < aAryLen; i++) {
			if (bAry[i] == null) {
				// bAryが先にnullになった=aAryの方が桁数(バージョン文字列の.の数)が多い場合、
				// '.0'が末尾にならないようにしてあるので、桁数の多い方がバージョンが大きい
				return 1;
			}
			var aVal = parseInt(aAry[i], 10);
			var bVal = parseInt(bAry[i], 10);
			if (aVal === bVal) {
				// 同じなら次以降のindexで比較
				continue;
			}
			// 比較してaが小さいなら-1、bが小さいなら-1を返す
			return aVal < bVal ? -1 : 1;
		}
		if (bAry[aAryLen] != null) {
			// aAryよりbAryの方が桁数が多い場合はbの方が桁数が多いのでバージョンが大きい
			return -1;
		}
		// 最後まで比較して同じなら同じバージョンなので0を返す
		return 0;
	}

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
		__ready: function() {
			var that = this;
			var activePageId = getActivePageId();

			$(':jqmData(role="page"), :jqmData(role="dialog")').each(function() {
				that.loadScript(this.id);
			});

			var $page = this.$find('#' + activePageId);

			// 初期表示時、トランジションにアニメーションが適用されていない場合、
			// JQMコントローラがreadyになる前にpageshowが発火してしまいJQMコントローラが拾うことができないため、
			// 既にpageshowが発火されていたら、h5controllerreadyのタイミングで、h5jqmpageshowをトリガする
			$page.one(EV_NAME_EMULATE_PAGE_SHOW, function() {
				if (showEventFiredBeforeReady && $page[0] === $.mobile.activePage[0]) {
					$page.trigger(EV_NAME_H5_JQM_PAGE_SHOW, {
						prevPage: $('')
					});
				}
			});
		},
		/**
		 * pageinitイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		':jqmData(role="page"), :jqmData(role="dialog") pageinit': function(context) {
			// pagecreateイベントを使うべきである場合はpagecreateハンドラ、そうでない時はpageinitハンドラで初期化処理を行う。
			if (!shouldHandlePagecreateEvent) {
				this._initPage(context.event.target.id);
			}
		},

		/**
		 * pagecreateイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		':jqmData(role="page"), :jqmData(role="dialog") pagecreate': function(context) {
			if (shouldHandlePagecreateEvent) {
				this._initPage(context.event.target.id);
			}
		},

		/**
		 * ページの初期化処理を行う
		 *
		 * @private
		 * @param {String} id
		 * @memberOf JQMController
		 */
		_initPage: function(id) {
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
		'{rootElement} pageremove': function(context) {
			// pagehide -> pageremoveの順でイベントは発火するので、pagehideのタイミングでh5jqmpagehideをトリガすればよいが、
			// 別ページに遷移する際、JQMがpagebeforeloadからpageloadの間のタイミングで、pageremoveをトリガするハンドラをpagehide.removeにバインドしてしまう為、
			// これ以降にpagehideに対して登録したハンドラは全てpageremoveの後に発火してしまう
			// 上記の理由により、pageremoveが発生する場合は、このタイミングでh5jqmpagehideイベントをトリガし、
			// pagehideイベントではh5jqmpagehideイベントを発火しないようフラグで制御する
			$(context.event.target).trigger(EV_NAME_H5_JQM_PAGE_HIDE, {
				nextPage: $.mobile.activePage
			});
			hideEventFired = true;

			var id = context.event.target.id;
			var controllers = controllerInstanceMap[id];
			var dynamicControllers = dynamicControllerInstanceMap[id];

			if (controllers) {
				for (var i = 0, len = controllers.length; i < len; i++) {
					controllers[i].dispose();
				}

				controllerInstanceMap[id] = [];
			}

			if (dynamicControllers) {
				for (var i = 0, len = dynamicControllers.length; i < len; i++) {
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
		'{rootElement} pagebeforeshow': function(context) {
			var id = context.event.target.id;

			this.addCSS(id);
			changeListenerState(id, true);
		},
		/**
		 * pagehideイベントのハンドラ コントローラでもページ非表示時のイベントを拾えるようにするため、
		 * JQMのpagehideイベントと同じタイミングで、JQMマネージャが管理しているコントローラのルート要素に対してh5jqmpagehideイベントをトリガします
		 * h5jqmpagehideイベントをトリガ後アクティブページ以外のページに対して、コントローラのイベントハンドラの無効化と、 CSSの定義をHEADタグから削除を行います
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		'{rootElement} pagehide': function(context) {
			if (!hideEventFired) {
				$(context.event.target).trigger(EV_NAME_H5_JQM_PAGE_HIDE, {
					nextPage: context.evArg.nextPage
				});
			}

			hideEventFired = false;

			var id = context.event.target.id;

			changeListenerState(id, false);
			this.removeCSS(id);
		},
		/**
		 * コントローラでもページ表示時のイベントを拾えるようにするため、 JQMのpageshowイベントと同じタイミングで、JQMマネージャが管理しているコントローラのルート要素に対して
		 * h5jqmpageshowイベントをトリガします
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		'{rootElement} pageshow': function(context) {
			var emulatePageShow = false;
			var $target = $(context.event.target);
			var $fromPage = context.evArg ? context.evArg.prevPage : $('');
			var conAr = controllerInstanceMap[$target[0].id];

			if (conAr) {
				for (var i = 0, len = conAr.length; i < len; i++) {
					var controllerInstance = conAr[i];
					// isReady=falseであるときコントローラのイベントハンドラは無効であり、
					// JQMマネージャが管理する静的コントローラがイベントを受け取れない状態なので、h5controllerready後にh5jqmpageshowをトリガするようにする
					// トランジションのアニメーションが無効(同期でJQMのイベントが発生する)場合のみここに到達する
					if (!controllerInstance.isReady) {
						$target.unbind(EV_NAME_EMULATE_PAGE_SHOW).one(EV_NAME_EMULATE_PAGE_SHOW,
								function() {
									if ($.mobile.activePage[0] === $target[0]) {
										$target.trigger(EV_NAME_H5_JQM_PAGE_SHOW, {
											prevPage: $fromPage
										});
									}
								});
						emulatePageShow = true;
						break;
					}
				}
			}

			if (!emulatePageShow) {
				$target.trigger(EV_NAME_H5_JQM_PAGE_SHOW, {
					prevPage: $fromPage
				});
			}
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

			var id = getActivePageId();

			if (id === null) {
				return;
			}

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
		},
		/**
		 * 動的に生成されたコントローラがunbindまたはdisposeされた場合、JQMManagerの管理対象から除外します
		 *
		 * @param context コンテキスト
		 * @memberOf JQMController
		 */
		'{rootElement} h5controllerunbound': function(context) {
			var unboundController = context.evArg;
			var id = getActivePageId();

			if (id === null) {
				return;
			}

			var index = $.inArray(unboundController, dynamicControllerInstanceMap[id]);

			if (index === -1) {
				return;
			}

			dynamicControllerInstanceMap[id].splice(index, 1);
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

			for (var i = 0, len = controllerDefs.length; i < len; i++) {
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

			for (var i = 0, srcLen = src.length; i < srcLen; i++) {
				var path = $.mobile.path.parseUrl(src[i]).filename;
				var isLoaded = false;

				for (var j = 0; j < linkLen; j++) {
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

			var id = getActivePageId();

			if (id === null) {
				return;
			}

			var toPageCSS = cssMap[id];

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
					if (isInitCalled) {
						fwLogger.info(FW_LOG_JQM_CONTROLLER_ALREADY_INITIALIZED);
						return;
					}
					isInitCalled = true;

					// jqmのバージョンを見てpagecreateイベントのタイミングで初期化するべきかどうかのフラグの値をセットする
					// (initが呼ばれるタイミングではjqmが読み込まれている前提)
					shouldHandlePagecreateEvent = compareVersion($.mobile.version, '1.4') >= 0;

					// 初期表示時、JQMマネージャがreadyになる前にpageshowイベントが発火したかをチェックする
					$(document).one('pageshow', function() {
						showEventFiredBeforeReady = true;
					});

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
						throwFwError(ERR_CODE_INVALID_TYPE, 'id');
					}

					if (cssSrc != null && !isString(cssSrc) && !$.isArray(cssSrc)) {
						throwFwError(ERR_CODE_INVALID_TYPE, 'cssSrc');
					}

					if (controllerDefObject != null) {
						if (isString(controllerDefObject) || $.isArray(controllerDefObject)) {
							throwFwError(ERR_CODE_NAME_INVALID_PARAMETER);
						}

						if (!$.isPlainObject(controllerDefObject)
								|| !('__name' in controllerDefObject)) {
							throwFwError(ERR_CODE_INVALID_TYPE, 'controllerDefObject');
						}

						if (initParam != null && !$.isPlainObject(initParam)) {
							throwFwError(ERR_CODE_INVALID_TYPE, 'initParam');
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

					if (isInitCalled && getActivePageId() !== null) {
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
					isInitCalled = false;
					hideEventFired = false;
					showEventFiredBeforeReady = false;
				}
			/* del end */
			});
})();