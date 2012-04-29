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

/* ------ h5.core.controller ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================
	var TEMPLATE_LOAD_RETRY_COUNT = 3;
	var TEMPLATE_LOAD_RETRY_INTERVAL = 3000;
	var TYPE_OF_UNDEFINED = 'undefined';
	var SUFFIX_CONTROLLER = 'Controller';
	var SUFFIX_LOGIC = 'Logic';
	var EVENT_NAME_H5_TRACKSTART = 'h5trackstart';
	var EVENT_NAME_H5_TRACKMOVE = 'h5trackmove';
	var EVENT_NAME_H5_TRACKEND = 'h5trackend';
	var ROOT_ELEMENT_NAME = 'rootElement';

	// エラーコード
	/** エラーコード: テンプレートに渡すセレクタが不正 */
	var ERR_CODE_INVALID_TEMPLATE_SELECTOR = 6000;
	/** エラーコード: バインド対象が指定されていない */
	var ERR_CODE_BIND_TARGET_REQUIRED = 6001;
	/** エラーコード: bindControllerメソッドにコントローラではないオブジェクトが渡された */
	var ERR_CODE_BIND_NOT_CONTROLLER = 6002;
	/** エラーコード: バインド対象となるDOMがない */
	var ERR_CODE_BIND_NOT_TARGET = 6003;
	/** エラーコード: バインド対象となるDOMが複数存在する */
	var ERR_CODE_BIND_TARGET_COMPLEX = 6004;
	/** エラーコード: エラータイプが指定されていない */
	var ERR_CODE_CUSTOM_ERROR_TYPE_REQUIRED = 6005;
	/** エラーコード: コントローラの名前が指定されていない */
	var ERR_CODE_CONTROLLER_NAME_REQUIRED = 6006;
	/** エラーコード: コントローラの初期化パラメータが不正 */
	var ERR_CODE_CONTROLLER_INVALID_INIT_PARAM = 6007;
	/** エラーコード: 既にコントローラ化されている */
	var ERR_CODE_CONTROLLER_ALREADY_CREATED = 6008;
	/** エラーコード: コントローラの参照が循環している */
	var ERR_CODE_CONTROLLER_CIRCULAR_REF = 6009;
	/** エラーコード: コントローラの参照が循環している */
	var ERR_CODE_LOGIC_CIRCULAR_REF = 6010;
	/** エラーコード: コントローラの参照が循環している */
	var ERR_CODE_CONTROLLER_SAME_PROPERTY = 6011;
	/** エラーコード: イベントハンドラのセレクタに{this}が指定されている */
	var ERR_CODE_EVENT_HANDLER_SELECTOR_THIS = 6012;
	/** エラーコード: あるセレクタに対して重複したイベントハンドラが設定されている */
	var ERR_CODE_SAME_EVENT_HANDLER = 6013;
	/** エラーコード: __metaで指定されたプロパティがない */
	var ERR_CODE_CONTROLLER_META_KEY_INVALID = 6014;
	/** エラーコード: __metaで指定されたプロパティがnullである */
	var ERR_CODE_CONTROLLER_META_KEY_NULL = 6015;
	/** エラーコード: __metaで指定されたプロパティがコントローラではない */
	var ERR_CODE_CONTROLLER_META_KEY_NOT_CONTROLLER = 6016;
	/** エラーコード: ロジックの名前が指定されていない */
	var ERR_CODE_LOGIC_NAME_REQUIRED = 6017;
	/** エラーコード: 既にロジック化されている */
	var ERR_CODE_LOGIC_ALREADY_CREATED = 6018;
	/** エラーコード: exposeする際にコントローラ、もしくはロジックの名前がない */
	var ERR_CODE_EXPOSE_NAME_REQUIRED = 6019;
	/** エラーコード: Viewモジュールが組み込まれていない */
	var ERR_CODE_NOT_VIEW = 6029;

	// エラーコードマップ
	var errMsgMap = {};
	errMsgMap[ERR_CODE_INVALID_TEMPLATE_SELECTOR] = 'update/append/prepend() の第1引数に"window", "window.", "navigator", "navigator."で始まるセレクタは指定できません。';
	errMsgMap[ERR_CODE_BIND_TARGET_REQUIRED] = 'バインド対象となる要素を指定して下さい。';
	errMsgMap[ERR_CODE_BIND_NOT_CONTROLLER] = 'コントローラ化したオブジェクトを指定して下さい。';
	errMsgMap[ERR_CODE_BIND_NOT_TARGET] = 'コントローラ"{0}"のバインド対象となる要素が存在しません。';
	errMsgMap[ERR_CODE_BIND_TARGET_COMPLEX] = 'コントローラ"{0}"のバインド対象となる要素が2つ以上存在します。バインド対象は1つのみにしてください。';
	errMsgMap[ERR_CODE_CUSTOM_ERROR_TYPE_REQUIRED] = 'エラータイプを指定してください。';
	errMsgMap[ERR_CODE_CONTROLLER_NAME_REQUIRED] = 'コントローラの名前が定義されていません。__nameにコントローラ名を設定して下さい。';
	errMsgMap[ERR_CODE_CONTROLLER_INVALID_INIT_PARAM] = 'コントローラ"{0}"の初期化パラメータがプレーンオブジェクトではありません。初期化パラメータにはプレーンオブジェクトを設定してください。';
	errMsgMap[ERR_CODE_CONTROLLER_ALREADY_CREATED] = '指定されたオブジェクトは既にコントローラ化されています。';
	errMsgMap[ERR_CODE_CONTROLLER_CIRCULAR_REF] = 'コントローラ"{0}"で、参照が循環しているため、コントローラを生成できません。';
	errMsgMap[ERR_CODE_LOGIC_CIRCULAR_REF] = 'コントローラ"{0}"のロジックで、参照が循環しているため、ロジックを生成できません。';
	errMsgMap[ERR_CODE_CONTROLLER_SAME_PROPERTY] = 'コントローラ"{0}"のプロパティ"{1}"はコントローラ化によって追加されるプロパティと名前が重複しています。';
	errMsgMap[ERR_CODE_EVENT_HANDLER_SELECTOR_THIS] = 'コントローラ"{0}"でセレクタ名にthisが指定されています。コントローラをバインドした要素自身を指定したい時はrootElementを指定してください。';
	errMsgMap[ERR_CODE_SAME_EVENT_HANDLER] = 'コントローラ"{0}"のセレクタ"{1}"に対して"{2}"というイベントハンドラが重複して設定されています。';
	errMsgMap[ERR_CODE_CONTROLLER_META_KEY_INVALID] = 'コントローラ"{0}"には__metaで指定されたプロパティ"{1}"がありません。';
	errMsgMap[ERR_CODE_CONTROLLER_META_KEY_NULL] = 'コントローラ"{0}"の__metaに指定されたキー"{1}"の値がnullです。コントローラを持つプロパティキー名を指定してください。';
	errMsgMap[ERR_CODE_CONTROLLER_META_KEY_NOT_CONTROLLER] = 'コントローラ"{0}"の__metaに指定されたキー"{1}"の値はコントローラではありません。コントローラを持つプロパティキー名を指定してください。';
	errMsgMap[ERR_CODE_LOGIC_NAME_REQUIRED] = 'ロジック名が定義されていません。__nameにロジック名を設定して下さい。';
	errMsgMap[ERR_CODE_LOGIC_ALREADY_CREATED] = '指定されたオブジェクトは既にロジック化されています。';
	errMsgMap[ERR_CODE_EXPOSE_NAME_REQUIRED] = 'コントローラ、もしくはロジックの __name が設定されていません。';
	errMsgMap[ERR_CODE_NOT_VIEW] = 'テンプレートはViewモジュールがなければ使用できません。';

	addFwErrorCodeMap(errMsgMap);

	// =============================
	// Development Only
	// =============================
	var fwLogger = h5.log.createLogger('h5.core');

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
	var getDeferred = h5.async.deferred;
	var startsWith = h5.u.str.startsWith;
	var endsWith = h5.u.str.endsWith;
	var format = h5.u.str.format;
	var argsToArray = h5.u.obj.argsToArray;
	var getByPath = h5.u.obj.getByPath;

	// =============================
	// Functions
	// =============================


	/**
	 * コントローラのexecuteListenersを見てリスナーを実行するかどうかを決定するインターセプタ。
	 *
	 * @param {Object} invocation インヴォケーション.
	 */
	function executeListenersInterceptor(invocation) {
		if (!this.__controllerContext.executeListeners) {
			return;
		}
		return invocation.proceed();
	}

	/**
	 * 指定されたオブジェクトの関数にアスペクトを織り込みます。
	 *
	 * @param {Object} controllerDefObject オブジェクト.
	 * @param {Object} prop プロパティ名.
	 * @param {Boolean} isEventHandler イベントハンドラかどうか.
	 * @returns {Object} AOPに必要なメソッドを織り込んだオブジェクト.
	 */
	function weaveControllerAspect(controllerDefObject, prop, isEventHandler) {
		var interceptors = getInterceptors(controllerDefObject.__name, prop);
		// イベントハンドラの場合、 enable/disableListeners()のために一番外側に制御用インターセプタを織り込む
		if (isEventHandler) {
			interceptors.push(executeListenersInterceptor);
		}
		return createWeavedFunction(controllerDefObject[prop], prop, interceptors);
	}

	/**
	 * 関数名とポイントカットを比べて、条件に合致すればインターセプタを返す.
	 *
	 * @param {String} targetName バインドする必要のある関数名.
	 * @param {Object} pcName ポイントカットで判別する対象名.
	 * @returns {Function[]} AOP用関数配列.
	 */
	function getInterceptors(targetName, pcName) {
		var ret = [];
		var aspects = h5.settings.aspects;
		// 織り込むべきアスペクトがない場合はそのまま空の配列を返す
		if (!aspects || aspects.length === 0) {
			return ret;
		}
		aspects = wrapInArray(aspects);
		for ( var i = aspects.length - 1; -1 < i; i--) {
			var aspect = aspects[i];
			if (aspect.target && !aspect.compiledTarget.test(targetName)) {
				continue;
			}
			var interceptors = aspect.interceptors;
			if (aspect.pointCut && !aspect.compiledPointCut.test(pcName)) {
				continue;
			}
			if (!$.isArray(interceptors)) {
				ret.push(interceptors);
				continue;
			}
			for ( var j = interceptors.length - 1; -1 < j; j--) {
				ret = ret.concat(interceptors[j]);
			}
		}
		return ret;
	}

	/**
	 * 基本となる関数にアスペクトを織り込んだ関数を返します。
	 *
	 * @param {Function} baseFunc 基本関数.
	 * @param {String} funcName 基本関数名.
	 * @param {Function[]} aspects AOP用関数配列.
	 * @returns {Function} AOP用関数を織り込んだ関数.
	 */
	function createWeavedFunction(base, funcName, aspects) {
		// 関数のウィービングを行う
		var weave = function(baseFunc, fName, aspect) {
			return function(/* var_args */) {
				var that = this;
				var invocation = {
					target: that,
					func: baseFunc,
					funcName: fName,
					args: arguments,
					proceed: function() {
						return baseFunc.apply(that, this.args);
					}
				};
				return aspect.call(that, invocation);
			};
		};

		var f = base;
		for ( var i = 0, l = aspects.length; i < l; i++) {
			f = weave(f, funcName, aspects[i]);
		}
		return f;
	}

	/**
	 * 指定されたオブジェクトの関数にアスペクトを織り込みます。
	 *
	 * @param {Object} logic ロジック.
	 * @returns {Object} AOPに必要なメソッドを織り込んだロジック.
	 */
	function weaveLogicAspect(logic) {
		for ( var prop in logic) {
			if ($.isFunction(logic[prop])) {
				logic[prop] = createWeavedFunction(logic[prop], prop, getInterceptors(logic.__name,
						prop));
			} else {
				logic[prop] = logic[prop];
			}
		}
		return logic;
	}

	/**
	 * コントローラ定義オブジェクトのプロパティがライフサイクルイベントどうかを返します。
	 *
	 * @param {Object} controllerDefObject コントローラ定義オブジェクト
	 * @param {String} prop プロパティ名
	 * @returns {Boolean} コントローラ定義オブジェクトのプロパティがライフサイクルイベントかどうか
	 */
	function isLifecycleProperty(controllerDefObject, prop) {
		// $.isFunction()による判定はいらないかも。
		return (prop === '__ready' || prop === '__construct' || prop === '__init')
				&& $.isFunction(controllerDefObject[prop]);
	}

	/**
	 * セレクタがコントローラの外側の要素を指しているかどうかを返します。<br>
	 * (外側の要素 = true)
	 *
	 * @param {String} selector セレクタ
	 * @returns {Boolean} コントローラの外側の要素を指しているかどうか
	 */
	function isGlobalSelector(selector) {
		return !!selector.match(/^\{.*\}$/);
	}

	/**
	 * イベント名がjQuery.bindを使って要素にイベントをバインドするかどうかを返します。
	 *
	 * @param {String} eventName イベント名
	 * @returns {Boolean} jQuery.bindを使って要素にイベントをバインドするかどうか
	 */
	function isBindRequested(eventName) {
		return !!eventName.match(/^\[.*\]$/);
	}

	/**
	 * セレクタから{}を外した文字列を返します。
	 *
	 * @param {String} selector セレクタ
	 * @returns {String} セレクタから{}を外した文字列
	 */
	function trimGlobalSelectorBracket(selector) {
		return $.trim(selector.substring(1, selector.length - 1));
	}

	/**
	 * イベント名から[]を外した文字列を返す
	 *
	 * @param {String} eventName イベント名
	 * @returns {String} イベント名から[]を外した文字列
	 */
	function trimBindEventBracket(eventName) {
		return $.trim(eventName.substring(1, eventName.length - 1));
	}

	/**
	 * 指定されたセレクタがwindow, window., document, document., navidator, navigator. で
	 * 始まっていればそのオブジェクトを、そうでなければそのまま文字列を返します。
	 *
	 * @param {String} selector セレクタ
	 * @returns {DOM|String} DOM要素、もしくはセレクタ
	 */
	function getGlobalSelectorTarget(selector) {
		var retSelector = selector;
		if (startsWith(selector, 'window') || startsWith(selector, 'document')
				|| startsWith(selector, 'navigator')) {
			// セレクタではなく、オブジェクトがターゲットの場合
			return getByPath(selector);
		}
		return retSelector;
	}

	/**
	 * 指定されたプロパティがイベントハンドラかどうかを返します。
	 *
	 * @param {Object} controllerDefObject コントローラ定義オブジェクト
	 * @param {String} prop プロパティ名
	 * @returns {Boolean} プロパティがイベントハンドラかどうか
	 */
	function isEventHandler(controllerDefObject, prop) {
		return prop.indexOf(' ') !== -1 && $.isFunction(controllerDefObject[prop]);
	}

	/**
	 * コントローラ定義オブジェクトの子孫コントローラ定義が循環参照になっているかどうかをチェックします。
	 *
	 * @param {Object} controllerDefObject コントローラ定義オブジェクト
	 * @returns {Boolean} 循環参照になっているかどうか(true=循環参照)
	 */
	function checkControllerCircularRef(controllerDefObject) {
		var checkCircular = function(controllerDef, ancestors) {
			for ( var prop in controllerDef)
				if ($.inArray(controllerDef, ancestors) >= 0 || endsWith(prop, SUFFIX_CONTROLLER)
						&& checkCircular(controllerDef[prop], ancestors.concat([controllerDef]))) {
					return true;
				}
			return false;
		};
		return checkCircular(controllerDefObject, []);
	}

	/**
	 * コントローラ定義オブジェクトのロジック定義が循環参照になっているかどうかをチェックします。
	 *
	 * @param {Object} controllerDefObject コントローラ定義オブジェクト
	 * @returns {Boolean} 循環参照になっているかどうか(true=循環参照)
	 */
	function checkLogicCircularRef(controllerDefObj) {
		var checkCircular = function(controllerDef, ancestors) {
			for ( var prop in controllerDef)
				if ($.inArray(controllerDef, ancestors) >= 0 || endsWith(prop, SUFFIX_LOGIC)
						&& checkCircular(controllerDef[prop], ancestors.concat([controllerDef]))) {
					return true;
				}
			return false;
		};
		return checkCircular(controllerDefObj, []);
	}

	/**
	 * コントローラのプロパティが子コントローラかどうかを返します。
	 *
	 * @param {Object} controller コントローラ
	 * @param {String} プロパティ名
	 * @returns {Boolean} コントローラのプロパティが子コントローラかどうか(true=子コントローラである)
	 */
	function isChildController(controller, prop) {
		var target = controller[prop];
		return endsWith(prop, SUFFIX_CONTROLLER) && prop !== 'rootController'
				&& prop !== 'parentController' && !$.isFunction(target)
				&& (target && !target.__controllerContext.isRoot);
	}

	/**
	 * 指定されたコントローラの子孫コントローラのPromiseオブジェクトを全て取得します。
	 *
	 * @param {Object} controller コントローラ
	 * @param {String} propertyName プロパティ名(initPromise,readyPromise)
	 * @param {Object} aquireFromControllerContext コントローラコンテキストのプロパティかどうか
	 * @returns {Promise[]} Promiseオブジェクト配列
	 */
	function getDescendantControllerPromises(controller, propertyName, aquireFromControllerContext) {
		var promises = [];
		var targets = [];
		var getPromisesInner = function(object) {
			targets.push(object);
			for ( var prop in object) {
				if (isChildController(object, prop)) {
					var c = object[prop];
					var promise = aquireFromControllerContext ? c.__controllerContext[propertyName]
							: c[propertyName];
					if (promise) {
						promises.push(promise);
					}
					if ($.inArray(c, targets) === -1) {
						getPromisesInner(c);
					}
				}
			}
		};
		getPromisesInner(controller);
		return promises;
	}

	/**
	 * 子孫コントローラのイベントハンドラをバインドします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function bindDescendantHandlers(controller) {
		var targets = [];
		var execute = function(controllerInstance) {
			if (controllerInstance.isReady || $.inArray(controllerInstance, targets) !== -1) {
				return;
			}
			targets.push(controllerInstance);

			var meta = controllerInstance.__meta;
			var notBindControllers = {};
			if (meta) {
				for ( var prop in meta) {
					if (meta[prop].useHandlers === false) {
						// trueより文字数が少ないため1を代入。機能的には"true"を表せば何を代入しても良い。
						notBindControllers[prop] = 1;
					}
				}
			}

			for ( var prop in controllerInstance) {
				var c = controllerInstance[prop];
				if (!isChildController(controllerInstance, prop)) {
					continue;
				}
				execute(c);
				if (!notBindControllers[prop]) {
					bindByBindMap(c);
				}
			}
		};
		execute(controller);
	}

	/**
	 * バインドマップに基づいてイベントハンドラをバインドします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function bindByBindMap(controller) {
		var bindMap = controller.__controllerContext.bindMap;
		for ( var s in bindMap) {
			for ( var e in bindMap[s]) {
				(function(selector, eventName) {
					bindEventHandler(controller, selector, eventName);
				})(s, e);
			}
		}
	}

	/**
	 * イベントハンドラのバインドを行います。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} selector セレクタ
	 * @param {String} eventName イベント名
	 */
	function bindEventHandler(controller, selector, eventName) {
		// bindMapに格納しておいたハンドラを取得
		var func = controller.__controllerContext.bindMap[selector][eventName];
		var event = eventName;
		var bindRequested = isBindRequested(eventName);
		if (bindRequested) {
			event = trimBindEventBracket(eventName);
		}
		var bindObj = null;
		switch (event) {
		case 'mousewheel':
			bindObj = getNormalizeMouseWheelBindObj(controller, selector, event, func);
			break;
		case EVENT_NAME_H5_TRACKSTART:
		case EVENT_NAME_H5_TRACKMOVE:
		case EVENT_NAME_H5_TRACKEND:
			bindObj = getH5TrackBindObj(controller, selector, eventName, func);
			break;
		default:
			bindObj = getNormalBindObj(controller, selector, event, func);
			break;
		}
		if (!bindObj) {
			return;
		}

		if (!$.isArray(bindObj)) {
			useBindObj(bindObj, bindRequested);
			return;
		}
		for ( var i = 0, l = bindObj.length; i < l; i++) {
			useBindObj(bindObj[i], bindRequested);
		}
	}

	/**
	 * バインドオブジェクトに基づいてイベントハンドラをバインドします。
	 *
	 * @param {Object} bindObj バインドオブジェクト
	 */
	function bindByBindObject(bindObj) {
		var controller = bindObj.controller;
		var rootElement = controller.rootElement;
		var selector = bindObj.selector;
		var eventName = bindObj.eventName;
		var handler = bindObj.handler;
		var useBind = isBindRequested(eventName);
		var event = useBind ? trimBindEventBracket(eventName) : eventName;
		if (isGlobalSelector(selector)) {
			// グローバルなセレクタの場合
			var selectTarget = trimGlobalSelectorBracket(selector);
			var isSelf = false;
			if (selectTarget === ROOT_ELEMENT_NAME) {
				selectTarget = rootElement;
				isSelf = true;
			} else {
				selectTarget = getGlobalSelectorTarget(selectTarget);
			}
			// バインド対象がdocument, windowの場合、live, delegateではイベントが拾えないことへの対応
			var needBind = selectTarget === document || selectTarget === window;
			if (isSelf || useBind || needBind) {
				$(selectTarget).bind(event, handler);
			} else {
				$(selectTarget).live(event, handler);
			}
		} else {
			if (useBind) {
				$(selector, rootElement).bind(event, handler);
			} else {
				$(rootElement).delegate(selector, event, handler);
			}
		}
	}

	/**
	 * バインドオブジェクトに対して必要であればイベント名を修正し、アンバインドマップにハンドラを追加した後、 実際にバインドを行います。
	 *
	 * @param {Object} bindObj バインドオブジェクト
	 * @param {Boolean} bindRequested イベントハンドラをバインド([]記法)すべきかどうか
	 */
	function useBindObj(bindObj, bindRequested) {
		if (bindRequested) {
			bindObj.eventName = '[' + bindObj.eventName + ']';
		}
		// アンバインドマップにハンドラを追加
		registerUnbindMap(bindObj.controller, bindObj.selector, bindObj.eventName, bindObj.handler);
		bindByBindObject(bindObj);
	}

	/**
	 * 子孫コントローラのイベントハンドラをアンバインドします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function unbindDescendantHandlers(controller) {
		var targets = [];
		var execute = function(controllerInstance) {
			if ($.inArray(controllerInstance, targets) !== -1) {
				return;
			}
			targets.push(controllerInstance);

			var meta = controllerInstance.__meta;
			var notBindControllers = {};
			if (meta) {
				for ( var prop in meta) {
					if (meta[prop].useHandlers === false) {
						// trueより文字数が少ないため1を代入。機能的には"true"を表せば何を代入しても良い。
						notBindControllers[prop] = 1;
					}
				}
			}

			for ( var prop in controllerInstance) {
				var c = controllerInstance[prop];
				if (!isChildController(controllerInstance, prop)) {
					continue;
				}
				execute(c);
				if (!notBindControllers[prop]) {
					unbindByBindMap(c);
				}
			}
		};
		execute(controller);
	}

	/**
	 * バインドマップに基づいてイベントハンドラをアンバインドします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function unbindByBindMap(controller) {
		var rootElement = controller.rootElement;
		var unbindMap = controller.__controllerContext.unbindMap;
		for ( var selector in unbindMap) {
			for ( var eventName in unbindMap[selector]) {
				var handler = unbindMap[selector][eventName];
				var useBind = isBindRequested(eventName);
				var event = useBind ? trimBindEventBracket(eventName) : eventName;
				if (isGlobalSelector(selector)) {
					var selectTarget = trimGlobalSelectorBracket(selector);
					var isSelf = false;
					if (selectTarget === ROOT_ELEMENT_NAME) {
						selectTarget = rootElement;
						isSelf = true;
					} else {
						selectTarget = getGlobalSelectorTarget(selectTarget);
					}
					var needBind = selectTarget === document || selectTarget === window;
					if (isSelf || useBind || needBind) {
						$(selectTarget).unbind(event, handler);
					} else {
						$(selectTarget).die(event, handler);
					}
				} else {
					if (useBind) {
						$(selector, rootElement).unbind(event, handler);
					} else {
						$(rootElement).undelegate(selector, event, handler);
					}
				}
			}
		}
	}

	/**
	 * 指定されたフラグで子コントローラを含む全てのコントローラのexecuteListenersフラグを変更します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {Boolean} flag フラグ
	 */
	function setExecuteListenersFlag(controller, flag) {
		controller.__controllerContext.executeListeners = flag;
		var targets = [];
		var changeFlag = function(controllerInstance) {
			targets.push(controllerInstance);
			for ( var prop in controllerInstance) {
				if (isChildController(controllerInstance, prop)) {
					var c = controllerInstance[prop];
					c.__controllerContext.executeListeners = flag;
					if ($.inArray(c, targets) === -1) {
						changeFlag(c);
					}
				}
			}
		};
		changeFlag(controller);
	}

	/**
	 * rootControllerとparentControllerをセットします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function initRootAndParentController(controller) {
		var targets = [];
		var init = function(controllerInstance, root, parent) {
			controllerInstance.rootController = root;
			controllerInstance.parentController = parent;
			targets.push(controllerInstance);
			for ( var prop in controllerInstance) {
				if (isChildController(controllerInstance, prop)) {
					var c = controllerInstance[prop];
					if ($.inArray(c, targets) === -1) {
						init(c, root, controllerInstance);
					}
				}
			}
		};
		init(controller, controller, null);
	}

	/**
	 * __init, __readyイベントを実行する.
	 *
	 * @param ｛Object} controller コントローラ.
	 * @param {Booelan} isInitEvent __initイベントを実行するかどうか.
	 */
	function executeLifecycleEventChain(controller, isInitEvent) {
		var targets = [];
		var flagName = isInitEvent ? 'isInit' : 'isReady';
		var funcName = isInitEvent ? '__init' : '__ready';

		var leafDfd = getDeferred();
		setTimeout(function() {
			leafDfd.resolve();
		}, 0);
		var leafPromise = leafDfd.promise();

		var execInner = function(controllerInstance) {
			if ($.inArray(controllerInstance, targets) !== -1) {
				return;
			}
			targets.push(controllerInstance);
			// 既にライフサイクルイベントを実行済みであれば何もしない
			if (controllerInstance[flagName]) {
				return;
			}

			var isLeafController = true;
			for ( var prop in controllerInstance) {
				// 子コントローラがあれば再帰的に処理
				if (isChildController(controllerInstance, prop)) {
					isLeafController = false;
					execInner(controllerInstance[prop]);
				}
			}

			// 子孫コントローラの準備ができた時に実行させる関数を定義
			var func = function() {
				// 既にライフサイクルイベントを実行済みであれば何もしない
				// 数行上で同じチェックを行っているが、非同期の場合ここでのチェックも必須となるはず
				if (controllerInstance[flagName]) {
					return;
				}
				var ret = null;
				var lifecycleFunc = controllerInstance[funcName];
				if (lifecycleFunc) {
					ret = controllerInstance[funcName]
							(createInitializationContext(controllerInstance));
				}
				// ライフサイクルイベント実行後に呼ぶべきコールバック関数を作成
				var callback = isInitEvent ? createCallbackForInit(controllerInstance)
						: createCallbackForReady(controllerInstance);
				if (h5.async.isPromise(ret)) {
					ret.done(function() {
						callback();
					});
				} else {
					callback();
				}
			};
			// getPromisesForXXXの戻り値が空の配列の場合はfunc()は同期的に呼ばれる
			var promises = isInitEvent ? getPromisesForInit(controllerInstance)
					: getPromisesForReady(controllerInstance);
			if (isInitEvent && isLeafController) {
				promises.push(leafPromise);
			}
			$.when.apply($, promises).done(function() {
				func();
			});
		};
		execInner(controller);
	}

	/**
	 * __initイベントを実行するために必要なPromiseを返します。
	 *
	 * @param {Controller} controller コントローラ
	 * @returns {Promise[]} Promiseオブジェクト
	 */
	function getPromisesForInit(controller) {
		// 子孫コントローラのinitPromiseオブジェクトを取得
		var initPromises = getDescendantControllerPromises(controller, 'initPromise');
		// 自身のテンプレート用Promiseオブジェクトを取得
		initPromises.push(controller.__controllerContext.templatePromise);
		return initPromises;
	}

	/**
	 * __readyイベントを実行するために必要なPromiseを返します。
	 *
	 * @param {Controller} controller コントローラ
	 * @returns {Promise[]} Promiseオブジェクト
	 */
	function getPromisesForReady(controller) {
		// 子孫コントローラのreadyPromiseオブジェクトを取得
		return getDescendantControllerPromises(controller, 'readyPromise');
	}

	/**
	 * __initイベントで実行するコールバック関数を返します。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function createCallbackForInit(controller) {
		return function() {
			if (controller.isInit) {
				return;
			}
			controller.isInit = true;
			var initDfd = controller.__controllerContext.initDfd;
			// FW、ユーザともに使用しないので削除
			delete controller.__controllerContext.templatePromise;
			delete controller.__controllerContext.initDfd;
			initDfd.resolve();

			if (controller.__controllerContext && controller.__controllerContext.isRoot) {
				// ルートコントローラであれば次の処理(イベントハンドラのバインドと__readyの実行)へ進む
				bindAndTriggerReady(controller);
			}
		};
	}

	/**
	 * __readyイベントで実行するコールバック関数を返します。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function createCallbackForReady(controller) {
		return function() {
			if (controller.isReady) {
				return;
			}
			controller.isReady = true;

			var readyDfd = controller.__controllerContext.readyDfd;
			// FW、ユーザともに使用しないので削除
			delete controller.__controllerContext.readyDfd;
			readyDfd.resolve();

			if (controller.__controllerContext && controller.__controllerContext.isRoot) {
				// ルートコントローラであれば全ての処理が終了したことを表すイベント"h5controllerready"をトリガ
				if (!controller.rootElement || !controller.isInit || !controller.isReady) {
					return;
				}
				$(controller.rootElement).trigger('h5controllerready', [controller]);
			}
		};
	}

	/**
	 * テンプレートに渡すセレクタとして正しいかどうかを返します。
	 *
	 * @param {String} selector セレクタ
	 * @returns {Boolean} テンプレートに渡すセレクタとして正しいかどうか(true=正しい)
	 */
	function isCorrectTemplatePrefix(selector) {
		if (startsWith('window')) {
			return false;
		}
		if (startsWith('window.')) {
			return false;
		}
		if (startsWith('navigator')) {
			return false;
		}
		if (startsWith('navigator.')) {
			return false;
		}
		return true;
	}

	/**
	 * 指定された要素が文字列があれば、ルートエレメント、{}記法を考慮した要素をjQueryオブジェクト化して返します。 DOM要素、jQueryオブジェクトであれば、
	 * jQueryオブジェクト化して(指定要素がjQueryオブジェクトの場合、無駄な処理になるがコスト的には問題ない)返します。
	 *
	 * @param {String|DOM|jQuery} セレクタ、DOM要素、jQueryオブジェクト
	 * @param {DOM} rootElement ルートエレメント
	 * @param {Boolean} isTemplate テンプレートで使用するかどうか
	 * @returns {jQuery} jQueryオブジェクト
	 */
	function getTarget(element, rootElement, isTemplate) {
		if (typeof element !== 'string') {
			return $(element);
		}
		var $targets;
		var selector = $.trim(element);
		if (isGlobalSelector(selector)) {
			var s = trimGlobalSelectorBracket(selector);
			if (isTemplate && isCorrectTemplatePrefix(s)) {
				throwFwError(ERR_CODE_INVALID_TEMPLATE_SELECTOR);
			}
			$targets = $(getGlobalSelectorTarget(s));
		} else {
			$targets = $(rootElement).find(element);
		}
		return $targets;
	}

	/**
	 * ハンドラをアンバインドマップに登録します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} selector セレクタ
	 * @param {String} eventName イベント名
	 * @param {Function} handler ハンドラ
	 */
	function registerUnbindMap(controller, selector, eventName, handler) {
		if (!controller.__controllerContext.unbindMap[selector]) {
			controller.__controllerContext.unbindMap[selector] = {};
		}
		controller.__controllerContext.unbindMap[selector][eventName] = handler;
	}

	/**
	 * バインドオブジェクトを返します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} selector セレクタ
	 * @param {String} eventName イベント名
	 * @param {Function} func ハンドラとして登録したい関数
	 * @returns {Object} バインドオブジェクト
	 *          <ul>
	 *          <li>bindObj.controller - コントローラ</li>
	 *          <li>bindObj.selector - セレクタ</li>
	 *          <li>bindObj.eventName - イベント名</li>
	 *          <li>bindObj.handler - イベントハンドラ</li>
	 *          </ul>
	 */
	function getNormalBindObj(controller, selector, eventName, func) {
		return {
			controller: controller,
			selector: selector,
			eventName: eventName,
			handler: function(/* var_args */) {
				func.call(controller, createEventContext(controller, arguments));
			}
		};
	}

	/**
	 * クラスブラウザな"mousewheel"イベントのためのバインドオブジェクトを返します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} selector セレクタ
	 * @param {String} eventName イベント名
	 * @param {Function} func ハンドラとして登録したい関数
	 * @returns {Object} バインドオブジェクト
	 *          <ul>
	 *          <li>bindObj.controller - コントローラ</li>
	 *          <li>bindObj.selector - セレクタ</li>
	 *          <li>bindObj.eventName - イベント名</li>
	 *          <li>bindObj.handler - イベントハンドラ</li>
	 *          </ul>
	 */
	function getNormalizeMouseWheelBindObj(controller, selector, eventName, func) {
		return {
			controller: controller,
			selector: selector,
			// Firefoxには"mousewheel"イベントがない
			eventName: typeof document.onmousewheel === TYPE_OF_UNDEFINED ? 'DOMMouseScroll'
					: eventName,
			handler: function(/* var_args */) {
				var eventContext = createEventContext(controller, arguments);
				var event = eventContext.event;
				// Firefox
				if (event.detail) {
					event.wheelDelta = -event.detail * 40;
				}
				func.call(controller, eventContext);
			}
		};
	}
	/**
	 * hifiveの独自イベント"h5trackstart", "h5trackmove", "h5trackend"のためのバインドオブジェクトを返します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} selector セレクタ
	 * @param {String} eventName イベント名
	 * @param {Function} func ハンドラとして登録したい関数
	 * @returns {Object[]} バインドオブジェクト
	 *          <ul>
	 *          <li>bindObj.controller - コントローラ</li>
	 *          <li>bindObj.selector - セレクタ</li>
	 *          <li>bindObj.eventName - イベント名</li>
	 *          <li>bindObj.handler - イベントハンドラ</li>
	 *          </ul>
	 */
	function getH5TrackBindObj(controller, selector, eventName, func) {
		// タッチイベントがあるかどうか
		var hasTouchEvent = typeof document.ontouchstart !== TYPE_OF_UNDEFINED;
		if (eventName !== EVENT_NAME_H5_TRACKSTART) {
			if (hasTouchEvent) {
				return getNormalBindObj(controller, selector, eventName, func);
			}
			// イベントオブジェクトの正規化
			return getNormalBindObj(controller, selector, eventName, function(context) {
				var event = context.event;
				var offset = $(event.currentTarget).offset();
				event.offsetX = event.pageX - offset.left;
				event.offsetY = event.pageY - offset.top;
				func.apply(this, arguments);
			});
		}
		var getEventType = function(en) {
			switch (en) {
			case 'touchstart':
			case 'mousedown':
				return EVENT_NAME_H5_TRACKSTART;
			case 'touchmove':
			case 'mousemove':
				return EVENT_NAME_H5_TRACKMOVE;
			case 'touchend':
			case 'mouseup':
				return EVENT_NAME_H5_TRACKEND;
			default:
				return;
			}
		};

		// jQuery.Eventオブジェクトのプロパティをコピーする。
		// 1.6.xの場合, "liveFired"というプロパティがあるがこれをコピーしてしまうとtriggerしてもイベントが発火しない。
		var copyEventObject = function(src, dest) {
			for ( var prop in src) {
				if (src.hasOwnProperty(prop) && !dest[prop] && prop !== 'target'
						&& prop !== 'currentTarget' && prop !== 'originalEvent'
						&& prop !== 'liveFired') {
					dest[prop] = src[prop];
				}
			}
			dest.h5DelegatingEvent = src;
		};
		var start = hasTouchEvent ? 'touchstart' : 'mousedown';
		var move = hasTouchEvent ? 'touchmove' : 'mousemove';
		var end = hasTouchEvent ? 'touchend' : 'mouseup';
		var $document = $(document);
		var getBindObjects = function() {
			// h5trackendイベントの最後でハンドラの除去を行う関数を格納するための変数
			var removeHandlers = null;
			var execute = false;
			var getHandler = function(en, eventTarget, setup) {
				return function(var_args) {
					var type = getEventType(en);
					var isStart = type === EVENT_NAME_H5_TRACKSTART;
					if (isStart && execute) {
						return;
					}
					var eventContext = createEventContext(controller, arguments);
					var event = eventContext.event;
					if (hasTouchEvent) {
						// タッチイベントの場合、イベントオブジェクトに座標系のプロパティを付加
						initTouchEventObject(event, en);
					}
					var newEvent = new $.Event(type);
					copyEventObject(event, newEvent);
					var target = event.target;
					if (eventTarget) {
						target = eventTarget;
					}
					if (setup) {
						setup(newEvent);
					}
					if (!hasTouchEvent || (execute || isStart)) {
						$(target).trigger(newEvent, eventContext.evArg);
						execute = true;
					}
					if (isStart && execute) {
						if (!newEvent.isDefaultPrevented()) {
							newEvent.h5DelegatingEvent.preventDefault();
							var nt = newEvent.target;

							// 直前のh5track系イベントとの位置の差分を格納
							var ox = newEvent.clientX;
							var oy = newEvent.clientY;
							var setupDPos = function(ev) {
								var cx = ev.clientX;
								var cy = ev.clientY;
								ev.dx = cx - ox;
								ev.dy = cy - oy;
								ox = cx;
								oy = cy;
							};
							var moveHandler = getHandler(move, nt, setupDPos);
							var upHandler = getHandler(end, nt);

							var $bindTarget = hasTouchEvent ? $(nt) : $document;
							removeHandlers = function() {
								$bindTarget.unbind(move, moveHandler);
								$bindTarget.unbind(end, upHandler);
							};
							$bindTarget.bind(move, moveHandler);
							$bindTarget.bind(end, upHandler);
						} else {
							execute = false;
						}
					}
					if (type === EVENT_NAME_H5_TRACKEND) {
						removeHandlers();
						execute = false;
					}
				};
			};
			var createBindObj = function(en) {
				return {
					controller: controller,
					selector: selector,
					eventName: en,
					handler: getHandler(en)
				};
			};
			var bindObjects = [getNormalBindObj(controller, selector, eventName, func)];
			bindObjects.push(createBindObj(start));
			return bindObjects;
		};
		return getBindObjects();
	}

	/**
	 * タッチイベントのイベントオブジェクトにpageXやoffsetXといった座標系のプロパティを追加します。
	 *
	 * @param {Object} event jQuery.Eventオブジェクト
	 * @param {String} eventName イベント名
	 */
	function initTouchEventObject(event, eventName) {
		var originalEvent = event.originalEvent;
		var touches = eventName === 'touchend' || eventName === 'touchcancel' ? originalEvent.changedTouches[0]
				: originalEvent.touches[0];
		var pageX = touches.pageX;
		var pageY = touches.pageY;
		event.pageX = originalEvent.pageX = pageX;
		event.pageY = originalEvent.pageY = pageY;
		event.screenX = originalEvent.screenX = touches.screenX;
		event.screenY = originalEvent.screenY = touches.screenY;
		event.clientX = originalEvent.clientX = touches.clientX;
		event.clientY = originalEvent.clientY = touches.clientY;

		var target = event.target;
		if (target.ownerSVGElement) {
			target = target.farthestViewportElement;
		} else if (target === window || target === document) {
			target = document.body;
		}
		var offset = $(target).offset();
		if (offset) {
			var offsetX = pageX - offset.left;
			var offsetY = pageY - offset.top;
			event.offsetX = originalEvent.offsetX = offsetX;
			event.offsetY = originalEvent.offsetY = offsetY;
		}
	}
	/**
	 * イベントオブジェクトを正規化します。
	 *
	 * @param {Object} event jQuery.Eventオブジェクト
	 */
	function normalizeEventObjext(event) {
		// ここはnull, undefinedの場合にtrueとしたいため、あえて厳密等価を使用していない
		if (event && event.offsetX == null && event.offsetY == null && event.pageX && event.pageY) {
			var target = event.target;
			if (target.ownerSVGElement) {
				target = target.farthestViewportElement;
			} else if (target === window || target === document) {
				target = document.body;
			}
			var offset = $(target).offset();
			if (offset) {
				event.offsetX = event.pageX - offset.left;
				event.offsetY = event.pageY - offset.top;
			}
		}
	}

	/**
	 * イベントコンテキストを作成します。
	 *
	 * @param {Object} controller コントローラ
	 * @param {Object} args 1番目にはjQuery.Eventオブジェクト、2番目はjQuery.triggerに渡した引数
	 */
	function createEventContext(controller, args) {
		var event = null;
		var evArg = null;
		if (args) {
			event = args[0];
			evArg = args[1];
		}
		// イベントオブジェクトの正規化
		normalizeEventObjext(event);
		return {
			controller: controller,
			rootElement: controller.rootElement,
			event: event,
			evArg: evArg
		};
	}

	/**
	 * 初期化イベントコンテキストをセットアップします。
	 *
	 * @param {Object} rootController ルートコントローラ
	 */
	function createInitializationContext(rootController) {
		return {
			args: rootController.__controllerContext.args
		};
	}

	/**
	 * コントローラとその子孫コントローラのrootElementにnullをセットします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function unbindRootElement(controller) {
		for ( var prop in controller) {
			var c = controller[prop];
			if (isChildController(controller, prop)) {
				c.rootElement = null;
				c.view.__controller = null;
				unbindRootElement(c);
			}
		}
	}

	/**
	 * コントローラとｓの子孫コントローラのrootElementをセットします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function copyAndSetRootElement(controller) {
		var rootElement = controller.rootElement;
		var meta = controller.__meta;
		for ( var prop in controller) {
			var c = controller[prop];
			if (isChildController(controller, prop)) {
				// __metaが指定されている場合、__metaのrootElementを考慮した要素を取得する
				if (meta && meta[prop] && meta[prop].rootElement) {
					c.rootElement = getBindTarget(meta[prop].rootElement, rootElement, c);
				} else {
					c.rootElement = rootElement;
				}
				c.view.__controller = c;
				copyAndSetRootElement(c);
			}
		}
	}

	/**
	 * コントローラをバインドする対象となる要素を返します。
	 *
	 * @param {String|DOM|jQuery} element セレクタ、DOM要素、もしくはjQueryオブジェクト
	 * @param {DOM} [rootElement] ルートエレメント
	 * @param {Controller} controller コントローラ
	 * @returns {DOM} コントローラのバインド対象である要素
	 */
	function getBindTarget(element, rootElement, controller) {
		if (!element) {
			throwFwError(ERR_CODE_BIND_TARGET_REQUIRED);
		} else if (!controller) {
			throwFwError(ERR_CODE_BIND_NOT_CONTROLLER);
		}
		var $targets;
		if (rootElement) {
			$targets = getTarget(element, rootElement);
		} else {
			$targets = $(element);
		}
		if ($targets.length === 0) {
			throwFwError(ERR_CODE_BIND_NOT_TARGET, [controller.__name]);
		}
		if ($targets.length > 1) {
			throwFwError(ERR_CODE_BIND_TARGET_COMPLEX, [controller.__name]);
		}
		return $targets.get(0);
	}

	/**
	 * イベントハンドラのバインドと__readyイベントを実行します。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function bindAndTriggerReady(controller) {
		bindByBindMap(controller);
		bindDescendantHandlers(controller);

		// コントローラマネージャの管理対象に追加
		var controllers = h5.core.controllerManager.controllers;
		if ($.inArray(controller, controllers) === -1) {
			controllers.push(controller);
		}

		// h5controllerboundイベントをトリガ.
		$(controller.rootElement).trigger('h5controllerbound', [controller]);

		// コントローラの__ready処理を実行
		var initPromises = getDescendantControllerPromises(controller, 'initPromise');
		initPromises.push(controller.initPromise);
		$.when.apply($, initPromises).done(function() {
			executeLifecycleEventChain(controller, false);
		});
	}

	/**
	 * rootController, parentControllerのセットと__initイベントを実行します。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function setRootAndTriggerInit(controller) {
		if (controller.rootController === null) {
			// rootControllerとparentControllerのセット
			initRootAndParentController(controller);
		}
		copyAndSetRootElement(controller);

		// __initイベントの実行
		executeLifecycleEventChain(controller, true);
	}

	/**
	 * h5.core.bindController()のために必要なプロパティをコントローラに追加します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {Object} param 初期化パラメータ
	 */
	function initInternalProperty(controller, param) {
		var templateDfd = getDeferred();
		templateDfd.resolve();
		controller.__controllerContext.templatePromise = templateDfd.promise();
		controller.__controllerContext.initDfd = getDeferred();
		controller.initPromise = controller.__controllerContext.initDfd.promise();
		controller.__controllerContext.readyDfd = getDeferred();
		controller.readyPromise = controller.__controllerContext.readyDfd.promise();
		controller.isInit = false;
		controller.isReady = false;
		controller.__controllerContext.args = param;
		for ( var prop in controller) {
			if (isChildController(controller, prop)) {
				initInternalProperty(controller[prop]);
			}
		}
	}

	/**
	 * インジケータを呼び出します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {Object} option インジケータのオプション
	 */
	function callIndicator(controller, option) {
		var target = null;
		var opt = option;

		if ($.isPlainObject(opt)) {
			target = opt.target;
		} else {
			opt = {};
		}
		target = target ? getTarget(target, controller.rootElement, true) : controller.rootElement;
		return h5.ui.indicator.call(controller, target, opt);
	}

	/**
	 * __unbind, __disposeイベントを実行します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} property プロパティ名(__unbind | __dispose)
	 * @returns {Promise[]} Promiseオブジェクト
	 */
	function executeLifeEndChain(controller, property) {
		var promises = [];
		var targets = [];
		var execute = function(parentController) {
			targets.push(parentController);
			for ( var prop in parentController) {
				if (isChildController(parentController, prop)) {
					var c = parentController[prop];
					if ($.inArray(c, targets) === -1) {
						execute(c);
					}
				}
			}
			if (parentController[property] && $.isFunction(parentController[property])) {
				promises.push(parentController[property]());
			}
		};
		execute(controller);
		return promises;
	}

	/**
	 * コントローラのリソース解放処理を行います。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function disposeController(controller) {
		var targets = [];
		var dispose = function(parentController) {
			targets.push(parentController);
			if (getByPath('h5.core.view')) {
				parentController.view.clear();
			}
			for ( var prop in parentController) {
				if (isChildController(parentController, prop)) {
					var c = parentController[prop];
					if ($.inArray(c, targets) === -1) {
						dispose(c);
					}
				}
				parentController[prop] = null;
			}
		};
		dispose(controller);
	}

	/**
	 * 指定されたIDを持つViewインスタンスを返します。 自身が持つViewインスタンスが指定されたIDを持っていない場合、parentControllerのViewインスタンスに対して
	 * 持っているかどうか問い合わせ、持っていればそのインスタンスを、持っていなければ更に上に問い合わせます。
	 * ルートコントローラのViewインスタンスも持っていない場合、h5.core.viewに格納された最上位のViewインスタンスを返します。
	 *
	 * @param {String} templateId テンプレートID
	 * @param {Controller} controller コントローラ
	 */
	function getView(templateId, controller) {
		if (controller.view.__view.isAvailable(templateId)) {
			return controller.view.__view;
		} else if (controller.parentController) {
			return getView(templateId, controller.parentController);
		}
		return h5.core.view;
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	function controllerFactory(controller, rootElement, controllerName, param, isRoot) {

		/**
		 * コントローラ名.
		 *
		 * @type String
		 * @name __name
		 * @memberOf Controller
		 */
		controller.__name = controllerName;

		/**
		 * テンプレート.
		 *
		 * @type String|String[]
		 * @name __templates
		 * @memberOf Controller
		 */
		controller.__templates = null;

		/**
		 * コントローラがバインドされた要素.
		 *
		 * @type Element
		 * @name rootElement
		 * @memberOf Controller
		 */
		controller.rootElement = rootElement;

		/**
		 * コントローラコンテキスト.
		 *
		 * @private
		 * @memberOf Controller
		 * @name __controllerContext
		 */
		controller.__controllerContext = {

			/**
			 * リスナーを実行するかどうかのフラグ
			 *
			 * @type Boolean
			 */
			executeListeners: true,

			/**
			 * ルートコントローラかどうか
			 *
			 * @type Boolean
			 */
			isRoot: isRoot,

			/**
			 * バインド対象となるイベントハンドラのマップ.
			 *
			 * @type Object
			 */
			bindMap: {},

			/**
			 * アンバインド対象となるイベントハンドラのマップ.
			 *
			 * @type Object
			 */
			unbindMap: {}
		};

		// 初期化パラメータがあれば、クローンしてコントローラコンテキストに格納
		if (param) {
			controller.__controllerContext.args = $.extend(true, {}, param);
		}

		/**
		 * コントローラのライフサイクルイベント__initが終了したかどうかを返します。
		 *
		 * @type Boolean
		 * @memberOf Controller
		 * @name isInit
		 */
		controller.isInit = false;

		/**
		 * コントローラのライフサイクルイベント__readyが終了したかどうかを返します。
		 *
		 * @type Boolean
		 * @memberOf Controller
		 * @name isReady
		 */
		controller.isReady = false;

		/**
		 * 親子関係を持つコントローラ群の一番祖先であるコントローラを返します。祖先がいない場合、自分自身を返します。
		 *
		 * @type Controller
		 * @memberOf Controller
		 * @name rootController
		 */
		controller.rootController = null;

		/**
		 * 親子関係を持つコントローラの親コントローラを返します。親コントローラがいない場合、nullを返します。
		 *
		 * @type Controller
		 * @memberOf Controller
		 * @name parentController
		 */
		controller.parentController = null;

		/**
		 * コントローラのライフサイクルイベント__initについてのPromiseオブジェクトを返します。
		 *
		 * @type Promise
		 * @memberOf Controller
		 * @name initPromise
		 */
		controller.initPromise = null;

		/**
		 * コントローラのライフサイクルイベント__readyについてのPromiseオブジェクトを返します。
		 *
		 * @type Promise
		 * @memberOf Controller
		 * @name readyPromise
		 */
		controller.readyPromise = null;

		/**
		 * コントローラのロガーを返します。
		 *
		 * @type Log
		 * @memberOf Controller
		 * @name log
		 */
		controller.log = h5.log.createLogger(controllerName);

		/**
		 * ビュー操作に関するメソッドを格納しています。
		 *
		 * @namespace
		 * @name view
		 * @memberOf Controller
		 * @see View
		 */
		controller.view = new View(controller);
	}

	function View(controller) {
		// 利便性のために循環参照になってしまうがコントローラの参照を持つ
		this.__controller = controller;
		// Viewモジュールがなければインスタンスを作成しない(できない)
		if (getByPath('h5.core.view')) {
			this.__view = h5.core.view.createView();
		}
	}

	$.extend(View.prototype, {

		/**
		 * パラメータで置換された、指定されたテンプレートIDのテンプレートを取得します。
		 *
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ(オブジェクトリテラルで指定)
		 * @returns {String} テンプレート文字列
		 * @function
		 * @name get
		 * @memberOf Controller.view
		 * @see View.get
		 */
		get: function(templateId, param) {
			return getView(templateId, this.__controller).get(templateId, param);
		},

		/**
		 * 要素を指定されたIDのテンプレートで書き換えます。
		 *
		 * @param {String|Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ(オブジェクトリテラルで指定)
		 * @function
		 * @name update
		 * @memberOf Controller.view
		 * @see View.update
		 */
		update: function(element, templateId, param) {
			var target = getTarget(element, this.__controller.rootElement, true);
			getView(templateId, this.__controller).update(target, templateId, param);
		},

		/**
		 * 要素の末尾に指定されたIDのテンプレートを挿入します。
		 *
		 * @param {String|Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ(オブジェクトリテラルで指定)
		 * @function
		 * @name append
		 * @memberOf Controller.view
		 * @see View.append
		 */
		append: function(element, templateId, param) {
			var target = getTarget(element, this.__controller.rootElement, true);
			getView(templateId, this.__controller).append(target, templateId, param);
		},

		/**
		 * 要素の先頭に指定されたIDのテンプレートを挿入します。
		 *
		 * @param {String|Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ(オブジェクトリテラルで指定)
		 * @function
		 * @name prepend
		 * @memberOf Controller.view
		 * @see View.prepend
		 */
		prepend: function(element, templateId, param) {
			var target = getTarget(element, this.__controller.rootElement, true);
			getView(templateId, this.__controller).prepend(target, templateId, param);
		},

		/**
		 * 指定されたパスのテンプレートファイルを非同期で読み込みキャッシュします。
		 *
		 * @param {String|String[]} resourcePaths テンプレートファイル(.ejs)のパス (配列で複数指定可能)
		 * @returns {Promise} Promiseオブジェクト
		 * @function
		 * @name load
		 * @memberOf Controller.view
		 * @see View.load
		 */
		load: function(resourcePaths) {
			return this.__view.load(resourcePaths);
		},

		/**
		 * Viewインスタンスに、指定されたIDとテンプレート文字列からテンプレートを1件登録します。
		 *
		 * @param {String} templateId テンプレートID
		 * @param {String} templateString テンプレート文字列
		 * @function
		 * @name register
		 * @memberOf Controller.view
		 * @see View.register
		 */
		register: function(templateId, templateString) {
			this.__view.register(templateId, templateString);
		},

		/**
		 * テンプレート文字列が、コンパイルできるかどうかを返します。
		 *
		 * @param {String} templateString テンプレート文字列
		 * @returns {Boolean} 渡されたテンプレート文字列がコンパイル可能かどうか。
		 * @function
		 * @name isValid
		 * @memberOf Controller.view
		 * @see View.isValid
		 */
		isValid: function(templateString) {
			return this.__view.isValid(templateString);
		},

		/**
		 * 指定されたテンプレートIDのテンプレートが存在するか判定します。
		 *
		 * @param {String} templateId テンプレートID
		 * @returns {Boolean} 判定結果(存在する: true / 存在しない: false)
		 * @function
		 * @name isAvailable
		 * @memberOf Controller.view
		 * @see View.isAvailable
		 */
		isAvailable: function(templateId) {
			return getView(templateId, this.__controller).isAvailable(templateId);
		},

		/**
		 * 引数に指定されたテンプレートIDをもつテンプレートをキャッシュから削除します。 <br />
		 * 引数を指定しない場合はキャッシュされている全てのテンプレートを削除します。
		 *
		 * @param {String|String[]} [templateId] テンプレートID
		 * @function
		 * @name clear
		 * @memberOf Controller.view
		 * @see View.clear
		 */
		clear: function(templateIds) {
			this.__view.clear(templateIds);
		}
	});

	/**
	 * コントローラのコンストラクタ
	 *
	 * @param {Element} rootElement コントローラをバインドした要素
	 * @param {String} controllerName コントローラ名
	 * @param {Object} param 初期化パラメータ
	 * @param {Boolean} isRoot ルートコントローラかどうか
	 * @name Controller
	 * @class
	 */
	function Controller(rootElement, controllerName, param, isRoot) {
		return controllerFactory(this, rootElement, controllerName, param, isRoot);
	}
	$.extend(Controller.prototype, {
		/**
		 * コントローラがバインドされた要素内から要素を選択します。
		 *
		 * @param {String} selector セレクタ
		 * @returns {jQuery} セレクタにマッチするjQueryオブジェクト
		 * @memberOf Controller
		 */
		$find: function(selector) {
			return $(this.rootElement).find(selector);
		},

		/**
		 * Deferredオブジェクトを返します。
		 *
		 * @returns {Deferred} Deferredオブジェクト
		 * @memberOf Controller
		 */
		deferred: function() {
			return getDeferred();
		},

		/**
		 * ルート要素を起点に指定されたイベントを実行します。
		 *
		 * @param {String} eventName イベント名
		 * @param {Object} [parameter] パラメータ
		 * @memberOf Controller
		 */
		trigger: function(eventName, parameter) {
			$(this.rootElement).trigger(eventName, [parameter]);
		},

		/**
		 * 指定された関数に対して、コンテキスト(this)をコントローラに変更して実行する関数を返します。
		 *
		 * @param {Function} func 関数
		 * @return {Function} コンテキスト(this)をコントローラに変更した関数
		 * @memberOf Controller
		 */
		own: function(func) {
			var that = this;
			return function(/* var_args */) {
				func.apply(that, arguments);
			};
		},

		/**
		 * 指定された関数に対して、コンテキスト(this)をコントローラに変更し、元々のthisを第1引数に加えて実行する関数を返します。
		 *
		 * @param {Function} func 関数
		 * @return {Function} コンテキスト(this)をコントローラに変更し、元々のthisを第1引数に加えた関数
		 * @memberOf Controller
		 */
		ownWithOrg: function(func) {
			var that = this;
			return function(/* var_args */) {
				var args = h5.u.obj.argsToArray(arguments);
				args.unshift(this);
				func.apply(that, args);
			};
		},

		/**
		 * コントローラを要素へバインドします。
		 *
		 * @memberOf Controller
		 * @param {String|Element|jQuery} targetElement バインド対象とする要素のセレクタ、DOMエレメント、もしくはjQueryオブジェクト.<br />
		 *            セレクタで指定したときにバインド対象となる要素が存在しない、もしくは2つ以上存在する場合、エラーとなります。
		 * @param {Object} [param] 初期化パラメータ.<br />
		 *            初期化パラメータは __init, __readyの引数として渡されるオブジェクトの argsプロパティとして格納されます。
		 * @returns {Controller} コントローラ.
		 */
		bind: function(targetElement, param) {
			var target = getBindTarget(targetElement, null, this);
			this.rootElement = target;
			this.view.__controller = this;
			var args = null;
			if (param) {
				args = $.extend(true, {}, param);
			}
			initInternalProperty(this, args);
			setRootAndTriggerInit(this);
			return this;
		},

		/**
		 * コントローラのバインドを解除します。
		 *
		 * @memberOf Controller
		 */
		unbind: function() {
			executeLifeEndChain(this, '__unbind');

			unbindByBindMap(this);
			unbindDescendantHandlers(this);

			this.__controllerContext.unbindMap = {};

			// コントローラマネージャの管理対象から外す.
			var targetRootElement = this.rootElement;
			var controllers = h5.core.controllerManager.controllers;
			h5.core.controllerManager.controllers = $.grep(controllers,
					function(controllerInstance) {
						return controllerInstance.rootElement !== targetRootElement;
					});

			// h5controllerunboundイベントをトリガ
			$(this.rootElement).trigger('h5controllerunbound');

			// rootElemetnのアンバインド
			this.rootElement = null;
			this.view.__controller = null;
			unbindRootElement(this);
		},

		/**
		 * コントローラのリソースをすべて削除します。<br />
		 * Controller#unbind() の処理を包含しています。
		 *
		 * @returns {Promise} Promiseオブジェクト
		 * @memberOf Controller
		 */
		dispose: function() {
			var dfd = this.deferred();
			this.unbind();
			var that = this;
			var promises = executeLifeEndChain(this, '__dispose');
			$.when.apply($, promises).done(function() {
				disposeController(that);
				dfd.resolve();
			});
			return dfd.promise();
		},

		/**
		 * コントローラのインジケータイベントを実行します。
		 *
		 * @param {Object} opt オプション
		 * @param {String} [opt.message] メッセージ
		 * @param {Number} [opt.percent] 進捗を0～100の値で指定する。
		 * @param {Boolean} [opt.block] 操作できないよう画面をブロックするか (true:する/false:しない)
		 * @param {String} ev イベント名
		 * @returns {Indicator} インジケータオブジェクト
		 * @memberOf Controller
		 */
		triggerIndicator: function(opt, evName) {
			var option = $.extend(true, {}, opt);
			var ev = evName;

			if (!ev || ev.length === 0) {
				ev = 'triggerIndicator';
			}

			$(this.rootElement).trigger(ev, [option]);
			return option.indicator;
		},

		/**
		 * 指定された要素に対して、インジケータ(メッセージ・画面ブロック・進捗)の表示や非表示を行うためのオブジェクトを取得します。
		 * <p>
		 * targetには、インジケータを表示するDOMオブジェクト、またはセレクタを指定して下さい。<br>
		 * targetを指定しない場合、コントローラを割り当てた要素(rootElement)に対してインジケータを表示します。
		 * <p>
		 * <h4>注意:</h4>
		 * targetにセレクタを指定した場合、以下の制約があります。
		 * <ul>
		 * <li>コントローラがバインドされた要素内に存在する要素が対象となります。
		 * <li>マッチした要素が複数存在する場合、最初にマッチした要素が対象となります。
		 * </ul>
		 * コントローラがバインドされた要素よりも外にある要素にインジケータを表示したい場合は、セレクタではなく<b>DOMオブジェクト</b>を指定して下さい。
		 * <h4>使用例</h4>
		 * <b>画面全体をブロックする場合</b><br>
		 * ・画面全体をブロックする場合、targetオプションに<b>document</b>、<b>window</b>または<b>body</b>を指定する。<br>
		 *
		 * <pre>
		 * var indicator = this.indicator({
		 * 	target: document
		 * }).show();
		 * </pre>
		 *
		 * <b>li要素にスロバー(くるくる回るアイコン)を表示してブロックを表示しないる場合</b><br>
		 *
		 * <pre>
		 * var indicator = this.indicator({
		 * 	target: 'li',
		 * 	block: false
		 * }).show();
		 * </pre>
		 *
		 * <b>パラメータにPromiseオブジェクトを指定して、done()/fail()の実行と同時にインジケータを除去する</b><br>
		 * resolve() または resolve() が実行されると、画面からインジケータを除去します。
		 *
		 * <pre>
		 * var df = $.Deferred();
		 * var indicator = this.indicator({
		 * 	target: document,
		 * 	promises: df.promise()
		 * }).show();
		 *
		 * setTimeout(function() {
		 * 	df.resolve() // ここでイジケータが除去される
		 * }, 2000);
		 * </pre>
		 *
		 * <b>パラメータに複数のPromiseオブジェクトを指定して、done()/fail()の実行と同時にインジケータを除去する</b><br>
		 * Promiseオブジェクトを配列で複数指定すると、全てのPromiseオブジェクトでresolve()が実行されるか、またはいずれかのPromiseオブジェクトでfail()が実行されるタイミングでインジケータを画面から除去します。
		 *
		 * <pre>
		 * var df = $.Deferred();
		 * var df2 = $.Deferred();
		 * var indicator = this.indicator({
		 * 	target: document,
		 * 	promises: [df.promise(), df2.promise()]
		 * }).show();
		 *
		 * setTimeout(function() {
		 * 	df.resolve()
		 * }, 2000);
		 *
		 * setTimeout(function() {
		 * 	df.resolve() // ここでイジケータが除去される
		 * }, 4000);
		 * </pre>
		 *
		 * @param {Object} [opt]
		 * @param {String} [opt.message] メッセージ
		 * @param {Number} [opt.percent] 進捗を0～100の値で指定する。
		 * @param {Boolean} [opt.block] 操作できないよう画面をブロックするか (true:する/false:しない)
		 * @param {Promise|Promise[]} [opt.promises] Promiseオブジェクト (Promiseの状態と合わせてインジケータの表示・非表示する)
		 * @param {String} [opt.theme] インジケータの基点となるクラス名 (CSSでテーマごとにスタイルをする場合に使用する)
		 * @returns {Indicator} インジケータオブジェクト
		 * @memberOf Controller
		 * @see Indicator
		 */
		indicator: function(opt) {
			return callIndicator(this, opt);
		},

		/**
		 * コントローラに定義されているリスナーの実行を許可します。
		 *
		 * @memberOf Controller
		 */
		enableListeners: function() {
			setExecuteListenersFlag(this, true);
		},

		/**
		 * コントローラに定義されているリスナーの実行を禁止します。
		 *
		 * @memberOf Controller
		 */
		disableListeners: function() {
			setExecuteListenersFlag(this, false);
		},

		/**
		 * フォーマット済みメッセージを詰めたエラーをthrowします。
		 *
		 * @memberOf Controller
		 * @param {String|Object} parameter 文字列の場合、第2引数以降をパラメータとしてフォーマットします。<br />
		 *            オブジェクトの場合、そのままErrorクラスへ格納します。
		 * @param {Any} [var_args] 第1引数が文字列の場合のパラメータ
		 */
		throwError: function(parameter, var_args) {
			var error = null;
			if (parameter && typeof parameter === 'string') {
				error = new Error(format.apply(null, argsToArray(arguments)));
			} else {
				error = Error.apply(null, arguments);
			}
			error.customType = null;
			throw error;
		},

		/**
		 * エラータイプとフォーマット済みメッセージを詰めたエラーをthrowします。
		 *
		 * @memberOf Controller
		 * @param {String} customType エラータイプ
		 * @param {String|Object} parameter 文字列の場合、第3引数以降をパラメータとしてフォーマットします。<br />
		 *            オブジェクトの場合、そのままErrorクラスへ格納します。
		 * @param {Any} [var_args] 第2引数が文字列の場合のパラメータ
		 */
		throwCustomError: function(customType, parameter, var_args) {
			// null, undefinedの場合をtrueとしたいため、あえて厳密等価にしていない
			if (customType == null) {
				throwFwError(ERR_CODE_CUSTOM_ERROR_TYPE_REQUIRED);
			}
			var args = argsToArray(arguments);
			args.shift();
			if (parameter && typeof parameter === 'string') {
				error = new Error(format.apply(null, argsToArray(args)));
			} else {
				error = Error.apply(null, args);
			}
			error.customType = customType;
			throw error;
		}
	});

	/**
	 * コントローラマネージャクラス
	 *
	 * @name ControllerManager
	 * @class
	 */
	function ControllerManager() {
		this.rootElement = document;
		this.controllers = [];

		/**
		 * triggerIndicatorイベントハンドラ
		 *
		 * @param {EventContext} context
		 * @memberOf ControllerManager
		 * @private
		 */
		$(document).bind('triggerIndicator', function(event, opt) {
			opt.indicator = callIndicator(this, opt).show();
			event.stopPropagation();
		});

	}
	$.extend(ControllerManager.prototype, {

		/**
		 * すべてのコントローラのインスタンスの配列を返します。
		 *
		 * @returns {Controller[]} コントローラ配列
		 * @memberOf ControllerManager
		 */
		getAllControllers: function() {
			return this.controllers;
		},

		/**
		 * 指定した要素にバインドされているコントローラを返します。
		 *
		 * @param {String|Element|jQuery} rootElement 要素
		 * @returns {Controller} コントローラ
		 * @memberOf ControllerManager
		 */
		getController: function(rootElement) {
			var target = $(rootElement).get(0);
			var controllers = this.controllers;
			for ( var i = 0, len = controllers.length; i < len; i++) {
				if (target === controllers[i].rootElement) {
					return controllers[i];
				}
			}
		}
	});

	h5.u.obj.expose('h5.core', {
		/**
		 * コントローラマネージャ
		 *
		 * @name controllerManager
		 * @type ControllerManager
		 * @memberOf h5.core
		 */
		controllerManager: new ControllerManager()
	});

	// プロパティ重複チェック用のコントローラプロパティマップ
	var controllerPropertyMap = {};
	var c = new Controller(null, 'a');
	for ( var p in c) {
		if (c.hasOwnProperty(p) && p !== '__name' && p !== '__templates' && p !== '__meta') {
			controllerPropertyMap[p] = 1;
		}
	}
	var proto = Controller.prototype;
	for ( var p in proto) {
		if (proto.hasOwnProperty(p)) {
			controllerPropertyMap[p] = 1;
		}
	}

	/**
	 * コントローラのファクトリ
	 *
	 * @param {String|Element|jQuery} targetElement バインド対象とする要素のセレクタ、DOMエレメント、もしくはjQueryオブジェクト.
	 * @param {Object} controllerDefObj コントローラ定義オブジェクト
	 * @param {Object} [param] 初期化パラメータ.
	 */
	// fwOptは内部的に使用している.
	function createAndBindController(targetElement, controllerDefObj, param, fwOpt) {

		// コントローラ名
		var controllerName = controllerDefObj.__name;
		if (!controllerName || $.trim(controllerName).length === 0) {
			throwFwError(ERR_CODE_CONTROLLER_NAME_REQUIRED, null, {
				controllerDefObj: controllerDefObj
			});
		}

		// 初期化パラメータがオブジェクトかどうかチェック
		if (param && !$.isPlainObject(param)) {
			throwFwError(ERR_CODE_CONTROLLER_INVALID_INIT_PARAM, [controllerName], {
				controllerDefObj: controllerDefObj
			});
		}

		// 既にコントローラ化されているかどうかチェック
		if (controllerDefObj.__controllerContext) {
			throwFwError(ERR_CODE_CONTROLLER_ALREADY_CREATED, null, {
				controllerDefObj: controllerDefObj
			});
		}


		// バインド対象となる要素のチェック
		if (targetElement) {
			var $bindTargetElement = $(targetElement);
			if ($bindTargetElement.length === 0) {
				throwFwError(ERR_CODE_BIND_NOT_TARGET, [controllerName], {
					controllerDefObj: controllerDefObj
				});
			}
			if ($bindTargetElement.length > 1) {
				throwFwError(ERR_CODE_BIND_TARGET_COMPLEX, [controllerName], {
					controllerDefObj: controllerDefObj
				});
			}
		}

		// コントローラの循環参照チェック
		if (checkControllerCircularRef(controllerDefObj)) {
			throwFwError(ERR_CODE_CONTROLLER_CIRCULAR_REF, [controllerName], {
				controllerDefObj: controllerDefObj
			});
		}

		// ロジックの循環参照チェック
		if (checkLogicCircularRef(controllerDefObj)) {
			throwFwError(ERR_CODE_LOGIC_CIRCULAR_REF, [controllerName], {
				controllerDefObj: controllerDefObj
			});
		}

		var isRoot = !fwOpt || !fwOpt.isInternal;
		var clonedControllerDef = $.extend(true, {}, controllerDefObj);
		var controller = new Controller(targetElement ? $(targetElement).get(0) : null,
				controllerName, param, isRoot);

		var templates = controllerDefObj.__templates;
		var templateDfd = getDeferred();
		var templatePromise = templateDfd.promise();

		controller.__controllerContext.templatePromise = templatePromise;
		controller.__controllerContext.initDfd = getDeferred();
		controller.initPromise = controller.__controllerContext.initDfd.promise();
		controller.__controllerContext.readyDfd = getDeferred();
		controller.readyPromise = controller.__controllerContext.readyDfd.promise();

		if (templates && templates.length > 0) {
			// テンプレートがあればロード
			var viewLoad = function(count) {
				// Viewモジュールがなければエラーログを出力する。
				// この直後のloadでエラーになるはず。
				if (!getByPath('h5.core.view')) {
					fwLogger.error(errMsgMap[ERR_CODE_NOT_VIEW]);
				}
				var vp = controller.view.load(templates);
				vp.then(function(result) {
					/* del begin */
					if (templates && templates.length > 0) {
						fwLogger.info('コントローラ"{0}"のテンプレートの読み込みに成功しました。', controllerName);
					}
					/* del end */
					templateDfd.resolve();
				}, function(result) {
					// テンプレートのロードをリトライする条件は、リトライ回数が上限回数未満、かつ
					// jqXhr.statusが"0"、もしくは"12029"であること。
					// jqXhr.statusの値の根拠は、IE以外のブラウザだと通信エラーの時に"0"になっていること、
					// IEの場合は、コネクションが繋がらない時のコードが"12029"であること。
					// 12000番台すべてをリトライ対象としていないのは、何度リトライしても成功しないエラーが含まれていることが理由。
					// WinInet のエラーコード(12001 - 12156): http://support.microsoft.com/kb/193625/ja
					var jqXhrStatus = result.detail.error.status;
					if (count === TEMPLATE_LOAD_RETRY_COUNT || jqXhrStatus !== 0
							|| jqXhrStatus !== 12029) {
						result.controllerDefObject = controllerDefObj;
						templateDfd.reject(result);
						// controller.__controllerContext.initDfd.reject();
						return;
					}
					setTimeout(function() {
						viewLoad(++count);
					}, TEMPLATE_LOAD_RETRY_INTERVAL);
				});
			};
			viewLoad(0);
		} else {
			// テンプレートがない場合は、resolve()しておく
			templateDfd.resolve();
		}

		for ( var prop in clonedControllerDef) {
			if (controllerPropertyMap[prop]) {
				throwFwError(ERR_CODE_CONTROLLER_SAME_PROPERTY, [controllerName, prop], {
					controllerDefObj: controllerDefObj
				});
			} else if (isLifecycleProperty(clonedControllerDef, prop)) {
				// ライフサイクルイベント
				controller[prop] = weaveControllerAspect(clonedControllerDef, prop);
			} else if (isEventHandler(clonedControllerDef, prop)) {
				// イベントハンドラ
				var lastIndex = $.trim(prop).lastIndexOf(' ');
				var selector = $.trim(prop.substring(0, lastIndex));
				var eventName = $.trim(prop.substring(lastIndex + 1, prop.length));
				if (isBindRequested(eventName)) {
					eventName = '[' + $.trim(trimBindEventBracket(eventName)) + ']';
				}

				if (isGlobalSelector(selector)) {
					var selectTarget = trimGlobalSelectorBracket(selector);
					if (selectTarget === 'this') {
						throwFwError(ERR_CODE_EVENT_HANDLER_SELECTOR_THIS, [controllerName], {
							controllerDefObj: controllerDefObj
						});
					}
				}
				var bindMap = controller.__controllerContext.bindMap;
				if (!bindMap[selector]) {
					bindMap[selector] = {};
				}
				if (bindMap[selector][eventName]) {
					throwFwError(ERR_CODE_SAME_EVENT_HANDLER,
							[controllerName, selector, eventName], {
								controllerDefObj: controllerDefObj
							});
				}
				var weavedFunc = weaveControllerAspect(clonedControllerDef, prop, true);
				bindMap[selector][eventName] = weavedFunc;
				controller[prop] = weavedFunc;
			} else if (endsWith(prop, SUFFIX_CONTROLLER) && clonedControllerDef[prop]
					&& !$.isFunction(clonedControllerDef[prop])) {
				// 子コントローラ
				var controllerTarget = clonedControllerDef[prop];
				if (!controllerTarget) {
					controller[prop] = controllerTarget;
					continue;
				}
				var c = createAndBindController(null,
						$.extend(true, {}, clonedControllerDef[prop]), param, $.extend({
							isInternal: true
						}, fwOpt));
				controller[prop] = c;
			} else if (endsWith(prop, SUFFIX_LOGIC) && clonedControllerDef[prop]
					&& !$.isFunction(clonedControllerDef[prop])) {
				// ロジック
				var logicTarget = clonedControllerDef[prop];
				var logic = createLogic(logicTarget);
				controller[prop] = logic;
			} else if ($.isFunction(clonedControllerDef[prop])) {
				// イベントハンドラではないメソッド
				controller[prop] = weaveControllerAspect(clonedControllerDef, prop);
			} else {
				// その他プロパティ
				controller[prop] = clonedControllerDef[prop];
			}
		}

		// __metaのチェック
		var meta = controller.__meta;
		if (meta) {
			for ( var prop in meta) {
				var c = controller[prop];
				if (c === undefined) {
					throwFwError(ERR_CODE_CONTROLLER_META_KEY_INVALID, [controllerName, prop], {
						controllerDefObj: controllerDefObj
					});
				}
				if (c === null) {
					throwFwError(ERR_CODE_CONTROLLER_META_KEY_NULL, [controllerName, prop], {
						controllerDefObj: controllerDefObj
					});
				}
				if (Controller.prototype.constructor !== c.constructor) {
					throwFwError(ERR_CODE_CONTROLLER_META_KEY_NOT_CONTROLLER,
							[controllerName, prop], {
								controllerDefObj: controllerDefObj
							});
				}
			}
		}

		// __constructがあれば実行。ここまでは完全に同期処理になる。
		if (controller.__construct) {
			controller.__construct(createInitializationContext(controller));
		}
		// ルートコントローラではない場合、インスタンスを戻す
		if (!controller.__controllerContext.isRoot) {
			return controller;
		}
		setRootAndTriggerInit(controller);
		return controller;
	}

	/**
	 * オブジェクトのロジック化を行います。
	 *
	 * @param {Object} logicDefObj ロジック定義オブジェクト
	 * @returns {Logic}
	 * @name logic
	 * @function
	 * @memberOf h5.core
	 */
	function createLogic(logicDefObj) {
		var logicName = logicDefObj.__name;
		if (!logicName || $.trim(logicName.length) === 0) {
			throwFwError(ERR_CODE_LOGIC_NAME_REQUIRED, null, {
				logicDefObj: logicDefObj
			});
		}
		if (logicDefObj.__logicContext) {
			throwFwError(ERR_CODE_LOGIC_ALREADY_CREATED, null, {
				logicDefObj: logicDefObj
			});
		}
		var logic = weaveLogicAspect($.extend(true, {}, logicDefObj));
		logic.deferred = getDeferred;
		logic.log = h5.log.createLogger(logicName);
		logic.__logicContext = {};

		for ( var prop in logic) {
			if (logic.hasOwnProperty(prop) && endsWith(prop, SUFFIX_LOGIC)) {
				var target = logic[prop];
				logic[prop] = createLogic(target);
			}
		}
		return logic;
	}

	// =============================
	// Expose to window
	// =============================


	/**
	 * Core MVCの名前空間
	 *
	 * @name core
	 * @memberOf h5
	 * @namespace
	 */
	h5.u.obj.expose('h5.core', {
		/**
		 * オブジェクトのコントローラ化と、要素へのバインドを行います。
		 *
		 * @param {String|Element|jQuery} targetElement バインド対象とする要素のセレクタ、DOMエレメント、もしくはjQueryオブジェクト..<br />
		 *            セレクタで指定したときにバインド対象となる要素が存在しない、もしくは2つ以上存在する場合、エラーとなります。
		 * @param {Object} controllerDefObj コントローラ定義オブジェクト
		 * @param {Object} [param] 初期化パラメータ.<br />
		 *            初期化パラメータは __construct, __init, __readyの引数として渡されるオブジェクトの argsプロパティとして格納されます。
		 * @returns {Controller} コントローラ
		 * @name controller
		 * @function
		 * @memberOf h5.core
		 */
		controller: createAndBindController,

		logic: createLogic,

		/**
		 * コントローラ、ロジックを__nameで公開します。<br />
		 * 例：__nameが"jp.co.nssol.controller.TestController"の場合、window.jp.co.nssol.controller.TestController
		 * で グローバルから辿れるようにします。
		 *
		 * @param {Controller|Logic} obj コントローラ、もしくはロジック
		 * @name expose
		 * @function
		 * @memberOf h5.core
		 */
		expose: function(obj) {
			var objName = obj.__name;
			if (!objName) {
				throwFwError(ERR_CODE_EXPOSE_NAME_REQUIRED, null, {
					target: obj
				});
			}
			var lastIndex = objName.lastIndexOf('.');
			if (lastIndex === -1) {
				window[objName] = obj;
			} else {
				var ns = objName.substr(0, lastIndex);
				var key = objName.substr(lastIndex + 1, objName.length);
				var nsObj = {};
				nsObj[key] = obj;
				h5.u.obj.expose(ns, nsObj);
			}

		}
	});
})();
