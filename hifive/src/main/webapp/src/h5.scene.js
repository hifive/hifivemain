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
	var DATA_ATTR_DEFAULT_SCENE = 'data-h5-default-scene';
	var DATA_ATTR_SCENE = 'data-h5-scene';
	var DATA_ATTR_CONTAINER = 'data-h5-container';
	var DATA_ATTR_MAIN_CONTAINER = 'data-h5-main-container';
	var DATA_ATTR_CONTAINER_BOUND = 'data-h5-container-bound';
	var DATA_ATTR_DUMMY_BODY = 'data-h5-dummy-body';

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

	//TODO(鈴木) ルート要素自身も対象として走査する
	//できればjQuery関数化したい。
	function findWithSelf(target, expr){
		var self = $(target).filter(expr);
		var children = $(target).find(expr);
		if(self.length === 0){
			return children;
		}else if(children.length === 0){
			return self;
		}
		self = $.makeArray(self);
		children = $.makeArray(children);
		return $(self.concat(children));
	}

	//TODO(鈴木) data-h5-default-sceneでdata-h5-controller指定がない場合用のダミーコントローラー
	var DummyController = {
		__name : 'h5.scene.DummyController'
	};

	//TODO(鈴木) 要素がシーン属性を持っているかのチェック
	function isScene(target){
		return $(target).is('[' + DATA_ATTR_DEFAULT_SCENE + '],[' + DATA_ATTR_SCENE + ']' );
	}

	//TODO(鈴木) 要素の上方直近のシーン要素を取得する
	function getParentScene(target){
		var parentScene = $(target).closest('[' + DATA_ATTR_DEFAULT_SCENE + '],[' + DATA_ATTR_SCENE + ']');
		return parentScene.length ? parentScene.get(0) : null;
	}

	//TODO(鈴木) 要素がコンテナ属性を持っているかのチェック
	//body、mainタグがメインシーンコンテナの場合、事前にDATA_ATTR_MAIN_CONTAINERが付与されている前提
	function isContainer(target){
		return $(target).is('[' + DATA_ATTR_MAIN_CONTAINER + '],[' + DATA_ATTR_CONTAINER + ']' );
	}

	//TODO(鈴木) 要素の上方直近のコンテナ要素を取得する
	function getParentContainer(target){
		var parentContainer = $(target).closest('[' + DATA_ATTR_MAIN_CONTAINER + '],[' + DATA_ATTR_CONTAINER + ']');
		console.debug(parentContainer.length);
		return parentContainer.length ? parentContainer.get(0) : null;
	}

	//TODO(鈴木) 対象要素が指定シーン要素の直属であるかのチェック
	//コンテナ化前の要素も存在するため、シーン属性のチェックのみでは判定できない
	function checkScene(target, scene){

		//TODO(鈴木) 同一ならtrue(両方nullは想定していない)
		if(target === scene) return true;

		//TODO(鈴木) 対象要素上方直近のコンテナ要素
		var targetContainer = getParentContainer(target);

		//TODO(鈴木) 指定シーン要素のコンテナ要素。指定シーン要素がない場合はnull。
		var container = scene ? getParentContainer(scene) : null;

//		//TODO(鈴木) シーン要素指定なし、もしくは指定シーン要素のコンテナが見つからない場合
//		if(!container){
//			//対象要素がコンテナに所属していればfalse、所属していなければtrue
//			return !targetContainer;
//		}

		//TODO(鈴木) コンテナ要素が一致しない場合はfalse
		if(targetContainer !== container){
			return false;
		}

		//TODO(鈴木) 対象要素上方直近のシーン要素が、指定シーン要素に一致すればtrue、そうでなければfalse
		return getParentScene(target) === scene;
	}

	//TODO(鈴木) scan関数分割。コントローラーバインドおよびシーンコンテナ生成用。
	//対象要素がシーンである場合に限り、対応コントローラーを生成後にresolveで返す。
	function scan(rootElement, controllerName, args){

		//TODO(鈴木) デフォルトをBODYにする実装を有効化
		//var root = rootElement; // ? rootElement : document.body;
		var root = rootElement ? rootElement : document.body;

		var $root = $(root);

		if($root.length === 0){
			return;
		}

		//TODO(鈴木) 対象要素は一つに限定
		if($root.length !== 1){
			//TODO throwFwError();
			throw new Error();
		}

		//TODO(鈴木) メインシーンコンテナができていない場合のみ実行。
		//この時点でメインシーンコンテナにはdata-h5-main-container属性があるようにする。
		if(!mainContainer && h5.settings.scene.autoCreateMainContainer){
			var main = findWithSelf(root, '[' + DATA_ATTR_MAIN_CONTAINER +  ']');
			if(main.length === 0){
				main = findWithSelf(root, 'main');
				if(main.length === 0 && root === document.body){
					main = $(root);
				}
				if(main.length > 0){
					main.eq(0).attr(DATA_ATTR_MAIN_CONTAINER, DATA_ATTR_MAIN_CONTAINER);
				}
			}
		}

		//TODO(鈴木) rootElementがシーンコンテナの場合
		//この場合promiseは返さない
		//createSceneContainer→scanForContainer→scanとなり再帰になる
		//※createSceneContainerの処理完了を待つべきか？
		if($root.is('[' + DATA_ATTR_CONTAINER + ']')){
			createSceneContainer(root);
			return;
		}else if($root.is('[' + DATA_ATTR_MAIN_CONTAINER + ']')){
			createSceneContainer(root, true);
			return;
		}

		//TODO(鈴木) 以下、rootElementがシーンコンテナでない場合

		//TODO(鈴木) シーンコントローラーをresolveで返却すべきか否か
		//scanがシーン要素を対象としており、コントローラーがバインドされていない場合に返却する
		var resolveSceneController = isScene(root) && !alreadyBound(root);

		var dfd = resolveSceneController ? h5.async.deferred() : null;

		//処理対象となるシーン要素取得(自身か、上方直近のシーン要素)
		var currentScene = isScene(root) ? root : getParentScene(root);

		//TODO(鈴木) シーンコントローラーが見つかったか
		var isFound = false;

		//TODO(鈴木) コントローラーのバインド
		findWithSelf(root, '[' + DATA_ATTR_CONTROLLER + ']').each(function() {
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
				//TODO(鈴木)
				if (!alreadyBound(this, attrControllerName)) {

					//TODO(鈴木) 対象シーン要素直属でなければ処理しない
					if(!checkScene(this, currentScene)){
						return true;
					}

					//TODO(鈴木) 対象シーンのシーンコントローラーであるか否か
					var isCurrent = false;

					//TODO(鈴木) シーンコントローラーを返却する必要がある場合で、また見つかっておらず、
					//処理対象が対象シーン要素自体である場合。
					//isFoundフラグにより、同一要素複数コントローラーの場合は、先頭のコントローラーのみ対象とする
					if(resolveSceneController && !isFound && this === root){
						isFound = true;
						isCurrent = true;
					}

					markBoundController(this, attrControllerName);

					//TODO(鈴木) シーンコントローラーである場合のみパラメータを渡す
					var loadControllerPromise = loadController(attrControllerName, this, isCurrent ? args : null);

					//TODO(鈴木) シーンコントローラーである場合のみ、コントローラーをresolveで返す
					if(isCurrent){
						loadControllerPromise.done(function(controller){
							dfd.resolve(controller);
						});
					}
				}else{
					console.debug('同一コントローラーバインド回避');
				}
			}
		});

		//TODO(鈴木) シーンコンテナの探索と生成
		$root.find('[' + DATA_ATTR_MAIN_CONTAINER + '],[' + DATA_ATTR_CONTAINER + ']').each(function(){

			//TODO(鈴木) 対象シーン要素直属でなければ処理しない
			if(checkScene(this, currentScene)){
				return true;
			}
			var $container = $(this);
			if($container.is('[' + DATA_ATTR_MAIN_CONTAINER + ']')){
				createSceneContainer(this, true);
			}else if($container.is('[' + DATA_ATTR_CONTAINER + ']')){
				createSceneContainer(this);
			}
		});

		if(resolveSceneController){
			return dfd.promise();
		}
		return;
	}

	//TODO(鈴木) alreadyBound実装
	function alreadyBound(element, controllerName){
		// TODO
		// 一時しのぎ、getControllers()でバインド途中のコントローラも取得できるようにすべき
		//var controllers = h5.core.controllerManager.getControllers(element);

		var controllers = $(element).attr(DATA_ATTR_CURRENT_BOUND);

		if(!controllers) return false;

		controllers = controllers.split(',');

		//controllerNameが指定されない場合は、何らかのコントローラーがバインドされていればtrueを返す
		if(!controllerName && controllers.length > 0){
			return true;
		}
		for(var i = 0; i < controllers.length; i++){
			//if(controllers[i].__name === controllerName){
			if($.trim(controllers[i]) === controllerName){
				return true;
			}
		}
		return false;
	}

	//TODO(鈴木) コントローラーがバインドされたことをマーク(暫定)
	function markBoundController(target, name){
		var attr = $(target).attr(DATA_ATTR_CURRENT_BOUND) || '';
		if(attr) attr += ',';
		attr += name;
		$(target).attr(DATA_ATTR_CURRENT_BOUND, attr);
	}

	//TODO(鈴木) scan関数分割。シーンコンテナ作成用。
	//カレントシーンとなる要素の探索と、そのコントローラー指定なしの場合のダミーコントローラーバインドを行う。
	function scanForContainer(rootElement, controllerName, args){

		var root = rootElement ? rootElement : document.body;

		var dfd = h5.async.deferred();

		//TODO(鈴木) 処理対象がシーンコンテナである場合、スキップする実装が必要。

		//TODO(鈴木)
		var isFound = false;
		var dummyController = null;

		//TODO(鈴木) data-h5-default-scene属性を持つ要素が直下に存在するかの確認
		var defaultSceneElm = $(root).find('>[' + DATA_ATTR_DEFAULT_SCENE + ']');
		//TODO(鈴木) 先頭要素がdata-h5-controllerを属性持っていない場合、ダミーのコントローラーをバインドしてresolve
		if(defaultSceneElm.length > 0){
			var elm = defaultSceneElm.eq(0);
			if(!alreadyBound(elm)){
				isFound = true;
				if(!elm.is('[' + DATA_ATTR_CONTROLLER + ']')){
					markBoundController(elm, DummyController.__name);
					dummyController = h5.core.controller(elm, DummyController, args);
					dfd.resolve(dummyController);
				}
			}
		}

		if(!isFound){
			//TODO(鈴木) data-h5-scene属性を持つ要素が直下先頭に存在するかの確認
			var sceneElm = $(root).children().eq(0).filter('[' + DATA_ATTR_SCENE + ']');
			if(sceneElm.length > 0){
				if(!alreadyBound(sceneElm)){
					isFound = true;
					sceneElm.attr(DATA_ATTR_DEFAULT_SCENE, DATA_ATTR_DEFAULT_SCENE);
					defaultSceneElm = sceneElm;
					//TODO(鈴木) 先頭要素がdata-h5-controllerを属性持っていない場合、ダミーのコントローラーをバインドしてresolve
					if(!sceneElm.is('[' + DATA_ATTR_CONTROLLER + ']')){
						markBoundController(sceneElm, DummyController.__name);
						dummyController = h5.core.controller(sceneElm, DummyController, args);
						dfd.resolve(dummyController);
					}
				}
			}
		}

		//TODO(鈴木) カレントとなるシーン要素が見つからない場合はエラー
		if(!isFound){
			//TODO throwFwError();
			throw new Error();
		}

		//TODO(鈴木) カレントとなるシーン要素のみscan
		var promise = scan(defaultSceneElm.get(0), controllerName, args);

		//TODO(鈴木) デフォルトコントローラーがバインド・返却されていなければscanの結果を使用する
		if(dfd.state() !== 'resolved'){
			promise.done(function(controller){
				dfd.resolve(controller);
			});
		}

		return dfd.promise();

	}

	//TODO(鈴木) loadController実装
	function loadController(name, rootElement, args){
		var dfd = h5.async.deferred();
		h5.res.get(name).then(function(Controller){
			var controller = h5.core.controller(rootElement, Controller, args);
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

	//TODO(鈴木) 現状、シーンクラスは使用していない

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
	function openWindow(url, name, features, isModal, controllerName, args) {
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
	var bodyTagRegExp = /<body\b([^>]*)>((?:\s|\S)*?)(?:<\/body\s*>|<\/html\s*>|$)/i;

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
			return '<div ' + DATA_ATTR_DUMMY_BODY +' ' + match[1] + '>' + match[2] + '</div>';
		}
		return html;
	}

	//TODO(鈴木) 直下先頭要素に'data-h5-default-scene'もしくは'data-h5-scene'属性がない場合は、'data-h5-default-scene'のDIV要素で囲む。
	//その際、親(シーンコンテナ)側にdata-h5-controller属性がある場合は、シーン要素に移動する。
	//ほかの属性も移動すべきか？
	function wrapScene(parent){
		var $parent = $(parent);
		var $children = $parent.children();
		if($children.eq(0).is('[' + DATA_ATTR_DEFAULT_SCENE + '],[' + DATA_ATTR_SCENE + ']') === false){
			console.info('シーンコンテナ直下先頭にシーン要素が見つからないため、シーン要素でラップします。');
			$children.wrapAll($('<div ' + DATA_ATTR_DEFAULT_SCENE + '></div>'));
			var name = $parent.attr(DATA_ATTR_CONTROLLER);
			if(name){
				console.info('シーンコンテナのコントローラー指定をラップに使用したシーン要素に移動します。');
				//TODO(鈴木) childrenは↑のwrapAllで作成した要素
				$parent.removeAttr(DATA_ATTR_CONTROLLER).children().attr(DATA_ATTR_CONTROLLER, name);
			}
		}
	}

	//TODO(鈴木) 第二引数にコンテナ指定を追加。これが指定された場合、第一引数で取得したHTML内で、
	//data-h5-container属性の値がこれに一致する要素を対象とする。
	function loadContentsFromUrl(source, container) {
		var dfd = h5.async.deferred();

		//TODO htmlだとスクリプトが実行されてしまうのでフルHTMLが返されるとよくない
		//部分HTML取得の場合のことを考慮。
		var xhr = h5.ajax({
			url: source,
			dataType: 'html'
		});

		xhr.done(function(data) {

			//TODO(鈴木) ここでdataからbody部分のみ抜く。
			data = extractBody(data);

			var $dom = $($.parseHTML(data));

			if(container){
				var $container = findWithSelf($dom, '[' + DATA_ATTR_CONTAINER + '="' + container + '"]');
				if($container.length === 0){
					throw new Error('対象のコンテナ要素が見つかりません');
				}
				$dom = $container.eq(0);
			}else{
				//TODO(鈴木) mainタグかdata-main-container属性要素があればその内容を対象とする。
				//通常のシーンコンテナ内にmainとdata-main-containerはない前提。
				var main = findWithSelf($dom, '[' + DATA_ATTR_MAIN_CONTAINER + ']');
				//TODO(鈴木) 現状のフラグに基づいて遷移先のHTMLからメインシーンコンテナに該当する部分を抽出。
				//さすがに遷移先HTMLでのフラグ状態までは見られない。。
				if(h5.settings.scene.autoCreateMainContainer){
					if(main.length === 0) main = findWithSelf($dom, 'main');
//					if(main.length === 0 && $dom.is('[' + DATA_ATTR_DUMMY_BODY + ']')){
//						$dom.removeAttr(DATA_ATTR_DUMMY_BODY).attr(DATA_ATTR_MAIN_CONTAINER, DATA_ATTR_MAIN_CONTAINER);
//					}
				}
				if(main.length > 0){
					$dom = main.eq(0);
				}
			}

			wrapScene($dom);

			dfd.resolve($dom.children());

		}).fail(function(error) {
			dfd.reject(error);
		});

		return dfd;
	}

	var NEW_SCENE_HTML = '<div class="h5-scene"></div>';

	function loadContents(source, container) {
		var dfd;

		if (isString(source)) {
			dfd = loadContentsFromUrl(source, container);
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
		onChange: function(container, to) {
			var dfd = h5.async.deferred();
			$(container).empty();
			$(to).appendTo(container);
			dfd.resolve();
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

	//TODO(鈴木) jQuery.paramデコード関数
	function toQueryParams(str, separator) {

		var match = str.match(/[?#]?([^?#]*)$/);

		var hash = {};

		$.each(match[1].split(separator || '&'), function(i, pair) {
			if ((pair = pair.split('='))[0]) {
				var name = decodeURIComponent(pair[0]);
				var value = pair[1] ? decodeURIComponent(pair[1]) : undefined;
				var _hash = hash;
				var lastName= null;
				name.replace(/^([^\[\]]+)|\[([^\[\]]+)\]/g, function(){
					var _name = arguments[1] || arguments[2];
					if (lastName){
						if(_hash[lastName] === undefined) {
							_hash[lastName] = {};
						}
						_hash = _hash[lastName];
					}
					lastName = _name;
				});

				if (_hash[lastName] !== undefined) {
					if (_hash[lastName].constructor != Array)
						_hash[lastName] = [
							_hash[lastName]
						];
					if (value)
						_hash[lastName].push(value);
				} else
					_hash[lastName] = value;
			}
		});
		return hash;
	}

	//TODO(鈴木) 画面遷移時のpopState時のコールバック
	function onPopState() {
		var params = toQueryParams((location.search || '').substring(1));
		mainContainer._changeScene(location.href, params);
	}

	function SceneContainer(element, isMain) {

		var that = this;

		this.isMain = !!isMain;

		if (this.isMain) {
			if (mainContainer) {
				//TODO throwFwError();
				throw new Error();
			}
		}

		//TODO(鈴木) element指定なしの場合はdiv要素を作って設定
		if(element == null){
			element = $('<div></div>');
		}

		this.rootElement = element;

		//TODO(鈴木) とりあえずデフォルトのtransitionを使用。
		this._transition = this._createTransition();
		this._transition.onChangeStart(element);

		//TODO(鈴木) シーンコンテナ下はコントローラーを管理
		this._currentController = null;

		this._isClickjackEnabled = false;

		//TODO isClickjackのT/Fでハンドラを切り替える
		//デフォルトではclickjackはfalseの方向
		if (that._isClickjackEnabled) {
			$(element).on('click', 'a', function(event) {
				event.preventDefault();

				var href = event.originalEvent.target.href;

				that.changeScene(href);
			});
		}

		//TODO(鈴木) コンテナ内にシーン要素がなければ追加する
		wrapScene(element);

		if (this.isMain) {

			mainContainer = this;

			//TODO(鈴木) メインシーンコンテナの場合はURL連動指定を行う。
			$(window).on('popstate', onPopState);

			//TODO(鈴木) メインシーンコンテナの場合、URLパラメータを取得して使用。
			//onPopStateを呼んでしまうと余計にHTMLを取りに行くことになるので、直接_changeSceneをto=elementで呼び出す。
			var params = toQueryParams((location.search || '').substring(1));
			scanForContainer(element, null, params.args).done(function(toController){
				that._currentController = toController;
				that._transition.onChangeEnd(that, null, element);
				that._transition = null;
			});

		}else{

			//TODO(鈴木) カレントとなるシーンを探索してscan
			scanForContainer(element).done(function(controller){
				that._currentController = controller;
				that._transition.onChangeEnd(that, null, element);
				that._transition = null;
			});

		}

		//TODO(鈴木) シーン遷移イベント購読。暫定。
		$(this.rootElement).on('changeScene', function(e, to, params){
			e.stopPropagation();
			that.changeScene(to, params);
		});

	}
	$.extend(SceneContainer.prototype, {
		//TODO(鈴木) popState, hashChangeイベント連動のため_changeSceneメソッドに処理を分割
		//paramsのプロパティは以下
		// transition … 遷移効果指定
		// container … toで指定される要素内の部分を表示する場合、その要素のdata-h5-container属性の値を指定する。
		// args … デフォルトシーンに対応するコントローラー生成時に渡されるパラメータ
		changeScene: function(to, params) {

			params = params || {};

			this._transition = this._createTransition(params.transition);

			//TODO(鈴木) シーンコンテナ下はコントローラーを管理
			var fromElm = (this._currentController||{}).rootElement;

			//TODO(鈴木) インジケーターは遷移処理発動直後に表示する必要がある(余計な操作をさせないため)
			//fromは設定しているが使っていない。toはここでは指定できない。
			this._transition.onChangeStart(this.rootElement, fromElm);

			var dfd = this._dfd = h5.async.deferred();

			if (this.isMain){
				if(!isString(to)) {
					//TODO throwFwError();
					throw new Error();
				}
				//TODO(鈴木) パラメータをエンコードしてURLに付加
				//最終的にはhashにも対応する必要がある
				to += ((to.indexOf('?') === -1) ? '?' : '&') + $.param(params);
				pushState(null, null, toAbsoluteUrl(to));
			}

			//TODO(鈴木) changeScene経由で_changeSceneを実行したか否か
			this._isNavigated = true;

			this._changeScene(to, params);

			return dfd.promise();
		},

		//TODO(鈴木) changeSceneメソッドから処理を分割
		_changeScene : function(to, params){

			params = params || {};

			//TODO(鈴木) シーンコンテナ下はコントローラーを管理
			var fromElm = (this._currentController||{}).rootElement;

			//changeSceneメソッド経由でない場合
			if(!this._isNavigated){
				this._transition = this._createTransition(params.transition);
				this._transition.onChangeStart(this.rootElement, fromElm);
			}

			//現在のページの全てのコントローラを削除
			if (fromElm) {
				disposeAllControllers(fromElm);
			}

			var that = this;

			//TODO(鈴木) transitionをコントローラーからFunctionに変更

			//TODO(鈴木) TransitionController変更に伴う変更
			//次のコンテンツのロードはこちらで行う。
			//将来、コントローラー・DOMを保存して使用する場合に、それらのハンドリングはシーンコンテナで行うほうがよいと思われるため。
			//更にその先で、これらの処理も外部指定が可能なようにする。

			//TODO(鈴木) 処理順を以下に変更
			//HTMLロード→(ツリーにはappendせず)DOM生成→属性に基づきコントローラーをロード・バインド
			//→シーンルートとなるコントローラーのDOMを既存と入れ替える
			//(現状はコンテナ以下をそのまま入れている。コンテナ内にDOM的にシーンが複数あるケースは未対応)

			if(isString(to)){

				//TODO(鈴木) HTMLの対象部分抽出はloadContentsFromUrlに実装。
				var loadPromise = loadContents(to, params.container);

				//TODO always->done/fail
				loadPromise.always(function(toElm) {

					//TODO(鈴木) scan用にダミーのDIVにappend
					var _toElm = $('<div></div>').append(toElm);

					//TODO(鈴木) DATA属性に基づいてコントローラーバインド・コンテナ生成
					scanForContainer(_toElm, null, params.args).done(function(toController){

						if(that._dfd){
							that._dfd.resolve({
								from: fromElm,
								to: toElm
							});
						}

						that._transition.onChange(that.rootElement, toElm).done(function(){

							//TODO(鈴木) disposeのタイミングはどうすべきか・・

							if(fromElm){
								fromElm.remove();
							}

							that._currentController = toController;

							//TODO(鈴木) インジケータ非表示
							that._transition.onChangeEnd(that, fromElm, toElm);

							that._isNavigated = false;
							that._dfd = null;
							that._transition = null;

						});
					});
				});

			}

		},
		_createTransition : function(type){
			var Transition = transitionTypeMap[type != null ? type
					: DEFAULT_SCENE_TRANSITION_TYPE];

			if (!Transition) {
				//TODO throwFwError();
				throw new Error();
			}

			//TODO(鈴木) transitionをコントローラーからFunctionに変更
			return  new Transition();
		}
	});

	//TODO(鈴木)
	function isElement(obj){
		return !!(obj && obj.nodeType === 1);
	}

	//コンテナにtypeはあるか？？
	//TODO(鈴木) 第二引数type消しました。
	function createSceneContainer(element, isMain) {

		//TODO(鈴木) 対象要素配下にコンテナ、またはコントローラーバインド済みの要素がある場合はエラーとすべき

		//TODO(鈴木) コンテナ生成済みであればエラー。判定方法は見直しが必要か。
		if($(element).is('[' + DATA_ATTR_CONTAINER_BOUND + ']')){
			//TODO throwFwError();
			throw new Error();
		}

		if(isMain){
			if($(element).is(':not([' + DATA_ATTR_MAIN_CONTAINER +  '])')){
				$(element).attr(DATA_ATTR_MAIN_CONTAINER, DATA_ATTR_MAIN_CONTAINER);
			}
		}else{
			if($(element).is(':not([' + DATA_ATTR_CONTAINER +  '])')){
				$(element).attr(DATA_ATTR_CONTAINER, DATA_ATTR_CONTAINER);
			}
		}

		var container = new SceneContainer(element, isMain);

		$(element).attr(DATA_ATTR_CONTAINER_BOUND, DATA_ATTR_CONTAINER_BOUND);

		return container;
	}

	var isInited = false;

	function init() {
		if (!isInited) {
			isInited = true;

			//TODO(鈴木) createSceneContainerはscan内で呼び出す
			//createSceneContainer(main, true);

			scan();
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
	h5.settings.scene = h5.settings.scene || {};
	$(function() {
		//TODO(鈴木) autoInit=trueの場合に全体を探索し、DATA属性によりコントローラーバインドとシーンコンテナ生成を行う。
		if (h5.settings.scene.autoInit) {
			init();
		}
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
		getMainContainer: getMainContainer,
		scan : scan
	});

})();
