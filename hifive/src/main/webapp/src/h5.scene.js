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
	function TypedMessage(type, data) {
		this.type = type;
		this.data = data;
	}

	function MessageChannel(type, targetWindow) {
		this.type = type;

		this._targetWindow = targetWindow;

		this._closed = false;

		var that = this;

		this._recv = function(ev) {
			that._receiveMessage(ev);
		};

		$.on(window, 'message', this._recv);
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

		close: function() {
			this._closed = true;
			this.off(window, 'message', this._recv);
		},

		_receiveMessage: function(event) {
			try {
				var msg = h5.u.obj.deserialize(event.data);
			} catch (e) {
				fwLogger.debug('メッセージをデシリアライズできませんでした。無視します。');
			}

			if (msg.type !== this.type) {
				return;
			}

			var ev = {
				type: 'message',
				data: msg.data
			};

			this.dispatchEvent(ev);
		}

	});

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	function Scene() {
	//scene
	}

	function SceneContainer() {
	//ignore
	}

	function InvocationProxy() {

	}

	var REMOTE_METHOD_INVOCATION = '__h5__remoteMethodInvocation';

	function RemoteWindow(url, windowName, features, isModal) {
		var win = window.open(url, windowName, features);

		this.window = win;

		this._isModal = false;

		this._parentBlocker = null;

		this.setModal(isModal === true ? true : false);

		//TODO createSequenceは別ファイルにしたい
		this._messageSeq = h5.core.data.createSequence(1, 1, h5.core.data.SEQ_INT);

		this._channel = new MessageChannel(REMOTE_METHOD_INVOCATION, win);

		this._channel.addEventListener('');

		//TODO channelはmessageイベントを1つだけonしてハンドラを共有する
		//id -> dfd
		this._invocationMap = {};

		this._watchChild();
	}
	$.extend(RemoteWindow.prototype, {
		invoke: function(method, args) {
			var dfd = h5.async.deferred();

			var data = {
				id: this._messageSeq.next(),
				args: args
			};

			this._invocationMap[data.id] = dfd;

			this._channel.send(data);

			return dfd.promise();
		},

		_receiveInvocationResult: function(ev) {

		},

		getControllerProxy: function(selector) {
			var proxy = new InvocationProxy();

			return proxy;
		},

		setModal: function(value) {
			if (this._isModal == value) {
				return;
			}

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
					message: message
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
		setTimeout(function(){
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
