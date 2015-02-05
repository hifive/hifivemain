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

	function Scene() {
	//scene
	}

	function SceneContainer() {
	//ignore
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

	function openWindow(url, name, features, isModal, controllerName, param) {
		var dfd = h5.async.deferred();

		var remote = new RemoteWindow(url, name, features, isModal);

		//FIXME window側のURLのロードが完了し、存在する場合にコントローラのreadyが完了したらresolve
		setTimeout(function() {
			dfd.resolve(remote);
		}, 100);

		return dfd.promise();
	}


	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5.scene', {
		openWindow: openWindow
	});

})();
