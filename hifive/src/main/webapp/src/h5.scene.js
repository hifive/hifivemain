/*
 * Copyright (C) 2014-2015 NS Solutions Corporation
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
 */

/* ------ h5.scene ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	//TODO(鈴木) 定数追加
	var DATA_ATTR_CONTROLLER = 'data-h5-controller';
	var DATA_ATTR_CURRENT_BOUND = 'data-h5-current-bound';

	// =============================
	// Production
	// =============================

	var REMOTE_METHOD_INVOCATION = '__h5__RMI';

	var REMOTE_METHOD_INVOCATION_RESULT = '__h5__RMI_Result';

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.scene');

	/* del begin */
	//	var FW_LOG_H5_WHEN_INVALID_PARAMETER = 'h5.scene.when: 引数にpromiseオブジェクトでないものが含まれています。';
	/**
	 * 各エラーコードに対応するメッセージ
	 */
	//	var errMsgMap = {};
	//	errMsgMap[ERR_CODE_NOT_ARRAY] = 'h5.scene.each() の第1引数は配列のみを扱います。';
	// メッセージの登録
	//	addFwErrorCodeMap(errMsgMap);
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
	// =============================
	// Functions
	// =============================
	/**
	 * デフォルトシーンのシーンコントローラを取得する。
	 *
	 * @returns controller
	 */
	function getDefaultSceneController() {
		var bodyController = h5.core.controllerManager.getControllers(document.body)[0];

		return bodyController;
	}


	function disposeAllControllers(element) {
		var controllers = h5.core.controllerManager.getControllers(element, {
			deep: true
		});
		for (var i = 0, len = controllers.length; i < len; i++) {
			controllers[i].dispose();
		}
	}

	function scan(rootElement, controllerName) {
		//		if (!isDocumentReady) {
		//			reserveScan();
		//			return;
		//		}

		//TODO(鈴木) デフォルトをBODYにする実装を有効化
		//var root = rootElement; // ? rootElement : document.body;
		var root = rootElement ? rootElement : document.body;
		//TODO(鈴木) ルート要素自身も対象とする
		$(root).find('[' + DATA_ATTR_CONTROLLER + ']').andSelf('[' + DATA_ATTR_CONTROLLER + ']').each(
				function() {
					var attrControllers = this.getAttribute(DATA_ATTR_CONTROLLER);

					var attrControllerNameList = attrControllers.split(',');

					for (var i = 0, len = attrControllerNameList.length; i < len; i++) {
						//TODO(鈴木) getFullnameの使用不明のため暫定回避
						//var attrControllerName = getFullname($.trim(attrControllerNameList[i]));
						var attrControllerName = $.trim(attrControllerNameList[i]);

						if (attrControllerName === '') {
							// trimした結果空文字になる場合は何もしない
							return true;
						}

						if (controllerName && attrControllerName !== controllerName) {
							// バインドしたいコントローラが指定されていて、その指定と異なっている場合は次を検索
							return true;
						}

						// 既に「同じ名前の」コントローラがバインドされていたら何もしない
						//TODO(鈴木) alreadyBoundの使用不明のため暫定回避
						//if (!alreadyBound(attrControllerName, h5.core.controllerManager
						//		.getControllers(this))) {
							// TODO
							// 一時しのぎ、getControllers()でバインド途中のコントローラも取得できるようにすべき
							if (!this.getAttribute(DATA_ATTR_CURRENT_BOUND)) {
								this.setAttribute(DATA_ATTR_CURRENT_BOUND, attrControllerName);
								loadController(attrControllerName, this);
							}
						//}
					}
				});
	}

	//TODO(鈴木) loadController実装
	function loadController(name, rootElement){
		var dfd = h5.async.deferred();
		h5.res.get(name).then(function(Controller){
			var controller = h5.core.controller(rootElement, Controller);
			dfd.resolve(controller);
		});
		return dfd.promise();
	}

	function TypedMessage(type, data) {
		this.type = type;
		this.data = data;
	}

	function MessageChannel(type, targetWindow) {
		this.type = type;

		this._targetWindow = targetWindow;

		this._closed = false;

		this._subscribers = [];

		var that = this;

		this._recv = function(event) {
			that._receiveMessage(event.originalEvent);
		};

		$(window).on('message', this._recv);
	}
	h5.mixin.eventDispatcher.mix(MessageChannel.prototype);
	$.extend(MessageChannel.prototype, {
		send: function(data) {
			if (this._closed) {
				//TODO fwErrorを投げる
				alert('クローズ済みのチャネルです。送信できません。');
				return;
			}

			var msg = new TypedMessage(this.type, data);

			var msgSerialized = h5.u.obj.serialize(msg);

			//TODO originを指定できるようにする, IE8-にoriginがないので対応が必要
			this._targetWindow.postMessage(msgSerialized, location.origin);
		},

		subscribe: function(func, thisObj) {
			var s = {
				func: func,
				thisObj: thisObj ? thisObj : null
			};

			this._subscribers.push(s);
		},

		close: function() {
			this._closed = true;
			this.off(window, 'message', this._recv);
		},

		_receiveMessage: function(event) {
			var msg;

			try {
				msg = h5.u.obj.deserialize(event.data);

				if (msg.type !== this.type) {
					return;
				}
			} catch (e) {
				fwLogger.debug('メッセージをデシリアライズできませんでした。無視します。');
				return;
			}

			var subers = this._subscribers;
			for (var i = 0, len = subers.length; i < len; i++) {
				var s = subers[i];
				s.func.call(s.thisObj, msg.data);
			}

			var ev = {
				type: 'message',
				data: msg.data
			};

			this.dispatchEvent(ev);
		}

	});

	//type:String -> MessageChannelインスタンス
	var singletonMessageChannelMap = {};

	/**
	 * type毎に一意なMessageChannelインスタンスを取得する。
	 *
	 * @returns channel
	 */
	function getMessageChannel(type, win) {
		var channel = singletonMessageChannelMap[type];

		if (!channel) {
			channel = new MessageChannel(type, win);
			singletonMessageChannelMap[type] = channel;
		}

		return channel;
	}

	// =========================================================================
	//
	// Classes
	//
	// =========================================================================

	//=============================
	// RemoteInvocation
	//=============================

	var RMI_STATUS_SUCCESS = 0;
	var RMI_STATUS_EXCEPTION = 1;
	var RMI_STATUS_ASYNC_RESOLVED = 2;
	var RMI_STATUS_ASYNC_REJECTED = 3;
	var RMI_STATUS_METHOD_NOT_FOUND = 4;

	function RMIReceiver() {
		this._recvChannel = new MessageChannel(REMOTE_METHOD_INVOCATION, window.opener);
		this._recvChannel.subscribe(this._receive, this);

		this._sendChannel = new MessageChannel(REMOTE_METHOD_INVOCATION_RESULT, window.opener);
	}
	$.extend(RMIReceiver.prototype, {
		_receive: function(data) {
			var controller = getDefaultSceneController();

			var id = data.id;
			var method = data.method;
			var args = data.args;

			if (!controller[method] || isFunction(controller[method])) {
				this._callFunction(id, controller, method, args);
			} else {
				this._sendChannel.send({
					id: id,
					isAsync: false,
					status: RMI_STATUS_METHOD_NOT_FOUND,
					result: null
				});
			}
		},

		_callFunction: function(id, controller, method, args) {
			args = wrapInArray(args);

			var ret = undefined;
			try {
				ret = controller[method].apply(controller, args);
			} catch (e) {
				this._sendChannel.send({
					id: id,
					isAsync: false,
					status: RMI_STATUS_EXCEPTION,
					result: null
				});
				return;
			}

			var that = this;

			//TODO コード整理
			if (h5.async.isPromise(ret)) {
				ret.done(function(/* var_args */) {
					var value = h5.u.obj.argsToArray(arguments);

					that._sendChannel.send({
						id: id,
						isAsync: true,
						status: RMI_STATUS_ASYNC_RESOLVED,
						result: value
					});
				}).fail(function(/* var_args */) {
					var value = h5.u.obj.argsToArray(arguments);

					that._sendChannel.send({
						id: id,
						isAsync: true,
						status: RMI_STATUS_ASYNC_REJECTED,
						result: value
					});

				});
			} else {
				this._sendChannel.send({
					id: id,
					isAsync: false,
					status: RMI_STATUS_SUCCESS,
					result: ret
				});
			}

		}
	});

	//=============================
	// RemoteInvocation
	//=============================

	function RemoteMethodInvocation(targetWindow) {
		this.targetWindow = targetWindow;

		//TODO channel id は一意になるように生成する
		this.id = 'FIXME';

		//TODO channelはmessageイベントを1つだけonしてハンドラを共有する
		//id -> dfd
		this._invocationMap = {};

		//TODO createSequenceは別ファイルにしたい
		this._invocationSeq = h5.core.data.createSequence(1, 1, h5.core.data.SEQ_INT);

		//TODO MessageChannelは、同一ウィンドウ、かつ、同一チャネルにのみ伝わるようにすべき(channel idの導入)
		this._sendChannel = getMessageChannel(REMOTE_METHOD_INVOCATION, targetWindow);

		this._recvChannel = getMessageChannel(REMOTE_METHOD_INVOCATION_RESULT, targetWindow);
		this._recvChannel.subscribe(this._receive, this);
	}
	$.extend(RemoteMethodInvocation.prototype, {
		invoke: function(method, args) {
			var dfd = h5.async.deferred();

			var data = {
				id: this._invocationSeq.next(),
				method: method,
				args: args
			};

			this._invocationMap[data.id] = dfd;

			this._sendChannel.send(data);

			return dfd.promise();
		},

		_receive: function(data) {
			var id = data.id;
			var dfd = this._invocationMap[id];

			if (!dfd) {
				//TODO fwLogger
				return;
			}

			delete this._invocationMap[id];

			var ret = data.result;
			var isAsync = data.isAsync;
			var status = data.status;

			if (!isAsync) {
				if (status === RMI_STATUS_SUCCESS) {
					dfd.resolve(ret);
				} else {
					dfd.reject();
				}
			} else {
				if (status === RMI_STATUS_ASYNC_RESOLVED) {
					dfd.resolve.apply(dfd, ret);
				} else {
					dfd.reject.apply(dfd, ret);
				}
			}

		}
	});

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	//子ウィンドウの場合
	if (window.opener) {
		new RMIReceiver();
	}

	function InvocationProxy() {

	}


	function RemoteWindow(url, windowName, features, isModal) {
		var win = window.open(url, windowName, features);

		this.window = win;

		this._isModal = false;

		this._parentBlocker = null;

		this.setModal(isModal === true ? true : false);

		this._rmi = new RemoteMethodInvocation(win);

		this._watchChild();
	}
	$.extend(RemoteWindow.prototype, {
		invoke: function(method, args) {
			return this._rmi.invoke(method, args);
		},

		getControllerProxy: function(selector) {
			var proxy = new InvocationProxy();

			return proxy;
		},

		setModal: function(value) {
			if (this._isModal == value) {
				return;
			}

			//TODO 外部化
			//h5.messageBundle.scene.MODAL_NOTICE = '子ウィンドウを開いている間は操作できません';
			var message = '子ウィンドウを開いている間は操作できません。';



			if (this._isModal) {
				//true -> false なので親ウィンドウのブロックを外す
				this._parentBlocker.hide();
				this._parentBlocker = null;
			} else {
				//false -> trueなので親ウィンドウをブロックする
				this._parentBlocker = h5.ui.indicator({
					target: 'body',
					block: true,
					message: message,
					showThrobber: false
				}).show();
			}

			this._isModal = value;
		},

		close: function() {
			var dfd = h5.async.deferred();

			this.window.close();

			return dfd.promise();
		},

		_watchChild: function() {
			var that = this;

			//TODO setModal(false)のときは監視しないようにする
			function watch() {
				if (that.window.closed) {
					clearInterval(tid);
					that.setModal(false);
				}
			}

			var tid = setInterval(watch, 300);
		}
	});

	function Scene(contentsSource, type) {
		this.type = type;

		this._contentsSource = contentsSource;

		this.rootElement = null;

		this._producer = null;
	}
	$.extend(Scene.prototype, {

		show: function() {
			var dfd = h5.async.deferred();

			//producerは、シーンの表示方法を制御する人
			var producer = sceneTypeMap[this.type];

			var p = h5.core.controller($('<div></div>'), producer);

			this._producer = p;

			var that = this;

			p.readyPromise.then(function() {
				return p.onShow(that._contentsSource);
			}).done(function(elem) {
				that.rootElement = elem;
				dfd.resolve();
			});

			return dfd.promise();
		},

		hide: function() {
			this._producer.onHide();
		},

		dispose: function() {
			//
		}
	});

	function createScene(contentsSource, type, controller) {
		var scene = new Scene(contentsSource, type);
		return scene;
	}

	/**
	 * 別ウィンドウをオープンします。
	 *
	 * @param url
	 * @param name
	 * @param features
	 * @param isModal
	 * @param controllerName
	 * @param param
	 * @returns {Promise} プロミス。完了するとRemoteWindowオブジェクトを返します。
	 */
	function openWindow(url, name, features, isModal, controllerName, param) {
		var dfd = h5.async.deferred();

		var remote = new RemoteWindow(url, name, features, isModal);

		//FIXME window側のURLのロードが完了し、存在する場合にコントローラのreadyが完了したらresolve
		setTimeout(function() {
			dfd.resolve(remote);
		}, 100);

		return dfd.promise();
	}

	/**
	 * シーンタイプ⇒コントローラ
	 */
	var sceneTypeMap = {};

	function registerSceneType(type, controller) {
		sceneTypeMap[type] = controller;
	}

	//directorよりproducer？
	var simpleSceneDirectorController = {
		__name: 'h5.scene.SimpleSceneDirectorController',

		_controller: null,

		onInit: function() {
			//
		},

		onShow: function(contentsSource, controller) {
			var dfd = h5.async.deferred();

			if (this._isShowing) {
				return;
			}

			var loadPromise = loadContents(contentsSource);

			var that = this;

			var p = loadPromise.done(function(dom) {
				//コントローラをバインド
				var ic = h5.core.controller(dom, controller);

				that._controller = ic;

				ic.readyPromise.done(function() {
					dfd.resolve(dom);
				});

			});

			return dfd.promise();
		},

		onHide: function() {
			//
		},

		onDispose: function() {
			this._controller.dispose();
		}
	};

	//TODO(鈴木) HTMLコメント削除用正規表現
	var htmlCommentRegexp = /<!--(?:\s|\S)*?-->/g;
	//TODO(鈴木) BODYタグ内容抽出用正規表現
	var bodyTagRegExp = /<body\s([^>]*)>((?:\s|\S)*?)(?:<\/body\s*>|<\/html\s*>|$)/i;

	//TODO(鈴木) HTML文字列からBODYタグ内容部分抽出
	//BODYタグがある場合、戻り値はDIVタグで囲む。
	//BODYタグの属性をそのDIVに追加する。(既存BODYタグの属性を操作することはしない)
	//data-main-container属性を追加する。
	//BODYタグがない場合は字列をそのまま返す。
	function extractBody(html){
		//TODO(鈴木) この場合HTMLコメントは消える。HTMLコメント内にbodyタグがない前提であれば楽だが。。
		//HTMLコメントも保存するよう実装すべきか？
		var match = html.replace(htmlCommentRegexp, '').match(bodyTagRegExp);
		if(match){
			return '<div data-main-container ' + match[1] + '>' + match[2] + '</div>';
		}
		return html;
	}

	//TODO(鈴木) 直下の要素に'data-h5-scene'属性がない場合は、'data-h5-scene'のDIV要素で囲む。
	//また、親(シーンコンテナ)側にdata-h5-controller属性がある場合は、シーン要素に移動する。
	//ほかの属性も移動すべきか？
	function wrapScene(parent){
		var $parent = $(parent);
		var $children = $parent.children();
		if($children.is('[data-h5-scene]') === false){
			$children.wrapAll($('<div data-h5-scene></div>'));
		}
		var name = $parent.attr('data-h5-controller');
		if(name){
			//TODO(鈴木) ↑により要素は1つはあるはず。全部処理でよいか。(eq(0)で先頭だけ対象とするか)
			$parent.removeAttr('data-h5-controller').children('[data-h5-scene]').attr('data-h5-controller', name);
		}
	}

	function loadContentsFromUrl(source) {
		var dfd = h5.async.deferred();

		//TODO htmlだとスクリプトが実行されてしまうのでフルHTMLが返されるとよくない
		//部分HTML取得の場合のことを考慮。
		var xhr = h5.ajax({
			url: source,
			dataType: 'html'
		});

		xhr.done(function(data) {

			//TODO(鈴木) HTML直下でいいのでsetStartBefore等はしない。
			//これだとhtml、head、bodyタグが消え、scriptタグはそのままとなる。
			//※Rangeが使えない場合の考慮は必要か？(insertAdjacentHTML使用等)
//			var range = document.createRange();
//			var fragment = range.createContextualFragment(data);
//			var dom = $(fragment);

			//TODO(鈴木) これだとhtml、head、bodyタグが消え、scriptタグはなくなる。
			//var dom = $.parseHTML(data);

			//TODO(鈴木) ここでdataからbody部分のみ抜く。
			data = extractBody(data);

			var $dom = $($.parseHTML(data));

			//TODO(鈴木) mainタグかdata-main-container属性要素があればその内容を対象とする。
			//通常のシーンコンテナ内にmainとdata-main-containerはない前提。
			var main = $dom.filter('main, [data-main-container]');
			if(main.length === 0) main = $dom.find('main, [data-main-container]');
			if(main.length > 0){
				$dom = main;
			}

			//TODO(鈴木) 直下の要素に'data-h5-scene'属性がない場合は、'data-h5-scene'のDIV要素で囲む。
			wrapScene($dom);

			dfd.resolve($dom.children());

		}).fail(function(error) {
			dfd.reject(error);
		});

		return dfd;
	}

	var NEW_SCENE_HTML = '<div class="h5-scene"></div>';

	function loadContents(source) {
		var dfd;

		if (isString(source)) {
			dfd = loadContentsFromUrl(source);
		} else {
			dfd = h5.async.deferred();

			var contentsRoot;
			if (source == null) {
				//新しくdiv要素を生成
				contentsRoot = $.parseHTML(NEW_SCENE_HTML);
			} else {
				//DOM要素が指定されたのでそれをそのまま使用
				contentsRoot = h5.u.obj.isJQueryObject(source) ? source[0] : source;
			}

			dfd.resolve(contentsRoot);
		}

		return dfd.promise();
	}

	registerSceneType('simple', simpleSceneDirectorController);

	//directorよりproducer？
	var popupSceneDirectorController = {
		__name: 'h5.scene.PopupSceneDirectorController',

		_$root: null,

		_popup: null,

		onShow: function(contentsSource, controller) {
			var dfd = h5.async.deferred();

			if (this._popup) {
				this._popup.show();
			}

			var loadPromise = loadContents(contentsSource);

			var that = this;

			var p = loadPromise.done(function(dom) {

				var popup = h5.ui.popupManager.createPopup('defaultGroup', '', dom);

				that._popup = popup;

				//						var popup = $(
				//								'<div class="popup" style="left: 100px; top: 100px; position: absolute; width: 200px; height: 200px"></div>')
				//								.append(dom);

				//						this._$root = popup;

				//						$(document.body).append(popup);

				popup.show();

				dfd.resolve(popup.rootElement);
			});

			return dfd.promise();
		},

		onHide: function() {
			if (this._popup) {
				this._popup.hide();
			}
		},

		onDispose: function() {
			//
		}
	};

	registerSceneType('popup', popupSceneDirectorController);


	/**
	 * type -> constructor function
	 */
	var transitionTypeMap = {};

	function registerSceneTransition(type, constructor) {
		if (transitionTypeMap[type]) {
			//
		}
		transitionTypeMap[type] = constructor;
	}


	var DEFAULT_SCENE_TRANSITION_TYPE = 'default';

	/**
	 * from,to is Element rootElementはコンテナ要素になる
	 */
//	var defaultTransitionController = {
//		__name: 'h5.scene.DefaultTransitionController',
//
//		onChange: function(container, html) {
//			var dfd = this.deferred();
//
//			var ind = this.indicator({
//				target: this.rootElement,
//				block: true,
//				message: '遷移中...'
//			}).show();
//
//			$(container).html(html);
//			dfd.resolve(html);
//
//			ind.hide();
//
//			return dfd.promise();
//		}
//	};

	//TODO(鈴木) transitionをコントローラーからFunctionに変更
	function defaultTransitionController(){
		//
	}
	$.extend(defaultTransitionController.prototype, {
		onChange: function(container, html) {
			var dfd = h5.async.deferred();
			$(container).html(html);
			dfd.resolve(html);

			return dfd.promise();
		},
		onChangeStart: function(container, from, to){
			this._ind = h5.ui.indicator({
				target: container,
				block: true,
				message: '遷移中...'
			}).show();
		},
		onChangeEnd: function(container, from, to){
			this._ind.hide();
		}
});

	registerSceneTransition(DEFAULT_SCENE_TRANSITION_TYPE, defaultTransitionController);

	function pushState(state, title, url) {
		history.pushState(state, title, url);
	}

	var mainContainer = null;

	//TODO(鈴木) 画面遷移時のpopState時のコールバック
	function onPopState(event) {
		mainContainer._changeScene(location.href);
	}

	function SceneContainer(element, isMain) {

		this.isMain = !!isMain;

		//TODO(鈴木) element指定なしの場合はdiv要素を作って設定(bodyを対象とするのはやめました)
		if(element == null){
			element = $('<div></div>');
		}

		if (this.isMain) {
			if (mainContainer) {
				//TODO throwFwError();
				throw new Error();
			}
			//TODO(鈴木) メインシーンコンテナの場合はURL連動指定を行う。
			$(window).on('popstate', onPopState);
			mainContainer = this;
		}

		this.rootElement = element;

		this._currentSceneRootElement = null;

		this._isClickjackEnabled = false;

		var that = this;

		//TODO(鈴木) 直下の要素に'data-h5-scene'属性がない場合は、'data-h5-scene'のDIV要素で囲む。
		wrapScene(this.rootElement);

		//TODO isClickjackのT/Fでハンドラを切り替える
		//デフォルトではclickjackはfalseの方向
		if (that._isClickjackEnabled) {
			$(element).on('click', 'a', function(event) {
				event.preventDefault();

				var href = event.originalEvent.target.href;

				that.changeScene(href);
			});
		}
	}
	$.extend(SceneContainer.prototype,
			{
				//TODO(鈴木) popState, hashChangeイベント連動のため_changeSceneメソッドに処理を分割
				changeScene: function(to, type) {

					this._transition = this._createTransition(type);

					var from = this._currentSceneRootElement;

					//TODO(鈴木) インジケーターは遷移処理発動直後に表示する必要がある(余計な操作をさせないため)
					//fromは設定しているが使っていない。toはここでは指定できない。
					this._transition.onChangeStart(this.rootElement, from);

					var dfd = this._dfd = h5.async.deferred();

					if (this.isMain){
						if(!isString(to)) {
							//TODO throwFwError();
						}
						pushState(null, null, toAbsoluteUrl(to));
					}

					this._isNavigated = true;

					this._changeScene(to, type);

					return dfd.promise();
				},

				//TODO(鈴木) changeSceneメソッドから処理を分割
				_changeScene : function(to, type){

					var from = this._currentSceneRootElement;

					//popstate経由の場合
					if(!this._isNavigated){
						this._transition = this._createTransition(type);
						this._transition.onChangeStart(this.rootElement, from);
					}

					//現在のページの全てのコントローラを削除
					if (from) {
						disposeAllControllers(from);
					}

					var that = this;

					//TODO(鈴木) transitionをコントローラーからFunctionに変更
					//transitionController.readyPromise.done(function() {

						//TODO(鈴木) TransitionController変更に伴う変更
						//次のコンテンツのロードはこちらで行う。
						//将来、コントローラー・DOMを保存して使用する場合に、それらのハンドリングはシーンコンテナで行うほうがよいと思われるため。
						//更にその先で、これらの処理も外部指定が可能なようにする。
						//var transitionPromise = transitionController.onChange(that.rootElement,
						//		from, to);

						var transitionPromise;

						var loadPromise = loadContents(to);
						//TODO always->done/fail
						loadPromise.always(function(html) {
							//TODO(鈴木) HTMLの対象部分抽出はloadContentsFromUrlに実装
							if (that.isMain){
								//
							}else{
								//TODO(鈴木) メインシーンコンテナ以外
							}
							return that._transition.onChange(that.rootElement, html);
						}).done(function(sceneRoot) {

							//TODO(鈴木) data-h5-controllerに基づいてコントローラーをバインド
							var target = $(sceneRoot).filter('[data-h5-controller]');;
							if(target.length === 0){
								target = $(sceneRoot).find('[data-h5-controller]');
							}
							if(target.length > 0){
								var name = target.attr('data-h5-controller');
								loadController(name, target[0]);

							}

							that._currentSceneRootElement = sceneRoot;

							if(that._dfd){
								that._dfd.resolve({
									from: from,
									to: sceneRoot
								});
							}

							//TODO(鈴木) インジケータ非表示
							that._transition.onChangeEnd(this, from, sceneRoot);

							that._isNavigated = false;
							that._dfd = null;
							that._transition = null;
						});
					//});
				},
				_createTransition : function(type){
					var Transition = transitionTypeMap[type != null ? type
							: DEFAULT_SCENE_TRANSITION_TYPE];

					if (!Transition) {
						//TODO throwFwError();
						throw new Error();
					}

					//TODO transitionはコントローラでなく特別な型orFunctionにするのがよいだろう
					//var transitionController = h5.core.controller(this.rootElement, transition);

					//TODO(鈴木) transitionをコントローラーからFunctionに変更
					return  new Transition();
				}
			});

	//コンテナにtypeはあるか？？
	function createSceneContainer(element, type, isMain) {
		var container = new SceneContainer(element, isMain);

		return container;
	}

	var isInited = false;

	function init() {
		if (!isInited) {
			isInited = true;

			//TODO(鈴木) main-container属性チェック実装
			var main = $('main, [data-main-container]')[0];

			//TODO main-container属性を見る
			createSceneContainer(main ? main : document.body, null, true);

			//TODO(鈴木) 戻り値をどこかに公開したい・・→されてた
		}
	}

	function getMainContainer() {
		return mainContainer;
	}


	// =============================
	// Code on boot
	// =============================

	//TODO autoInitがtrueの場合のみinit
	//TODO(鈴木) 暫定。とりあえず設定を有効化しました
	//ドキュメントロード時にdata-h5-controller属性からコントローラーロード・バインドするようにしました。
	h5.settings.scene = h5.settings.scene || {};
	$(function() {
		if (h5.settings.scene.autoInit) {
			init();
		}
		scan();
	});

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5.scene', {
		openWindow: openWindow,
		registerSceneType: registerSceneType,
		createScene: createScene,
		createSceneContainer: createSceneContainer,
		init: init,
		getMainContainer: getMainContainer
	});

})();
