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
 */
/* ------ h5.event ------ */
(function() {
	'use strict';

	//TODO 当座、このファイルを単体で読み込んでも使えるようにする
	//最終的にはh5scolpedglobals.jsに入っているのでなくす
	function isString(target) {
		return typeof target === 'string';
	}

	//TODO 最終的に削除（h5scolpedglobals.jsにはいっている）
	var isFunction = (function() {
		// Android3以下、iOS4以下は正規表現をtypeofで判定すると"function"を返す
		// それらのブラウザでは、toStringを使って判定する
		if (typeof new RegExp() === 'function') {
			var toStringObj = Object.prototype.toString;
			return function(obj) {
				return toStringObj.call(obj) === '[object Function]';
			};
		}
		// 正規表現のtypeofが"function"にならないブラウザなら、typeofがfunctionなら関数と判定する
		return function(obj) {
			return typeof obj === 'function';
		};
	})();



	var RootClass = h5.cls.RootClass;

	/**
	 * イベントディスパッチャ
	 * <p>
	 * イベントの発火・リスナ管理を行うクラスです。
	 * </p>
	 *
	 * @mixin
	 * @name EventDispatcher
	 */
	var EventDispatcher = RootClass.extend(function() {
		/**
		 * 受け取ったオブジェクトをイベントオブジェクトにする
		 *
		 * @private
		 * @param {Object} event 任意のオブジェクト
		 * @param {Object} target event.targetになるオブジェクト
		 * @returns {Object} イベントオブジェクト
		 */
		function setEventProperties(event, target) {
			// ターゲットの追加
			if (!event.target) {
				event.target = target;
			}
			// タイムスタンプの追加
			if (!event.timeStamp) {
				event.timeStamp = new Date().getTime();
			}
		}

		var desc = {
			name: 'h5.event.EventDispatcher',
			field: {
				_eventListeners: null
			},
			method: {
				/**
				 * @mebmerOf h5.event.EventDispatcher
				 */
				constructor: function EventDispatcher() {
					EventDispatcher._super.call(this);

					this._eventListeners = {};
				},

				/**
				 * イベントリスナが登録されているかどうかを返します
				 * <p>
				 * 第一引数にイベント名、第二引数にイベントリスナを渡し、指定したイベントに指定したイベントリスナが登録済みかどうかを返します。
				 * </p>
				 *
				 * @since 1.1.0
				 * @memberOf EventDispatcher
				 * @param {String} type イベント名
				 * @param {Function} listener イベントリスナ
				 * @returns {Boolean} 第一引数のイベント名に第二引数のイベントリスナが登録されているかどうか
				 */
				hasEventListener: function(type, listener) {
					if (!this._eventListeners) {
						return false;
					}
					var l = this._eventListeners[type];
					if (!l || !this._eventListeners.hasOwnProperty(type)) {
						return false;
					}

					for (var i = 0, count = l.length; i < count; i++) {
						if (l[i] === listener) {
							return true;
						}
					}
					return false;
				},

				/**
				 * イベントリスナを登録します。
				 * <p>
				 * 第一引数にイベント名、第二引数にイベントリスナを渡し、イベントリスナを登録します。指定したイベントが起こった時にイベントリスナが実行されます。
				 * </p>
				 * <p>
				 * イベントリスナは、関数または<a
				 * href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventListener">EventListener</a>
				 * インタフェースを実装するオブジェクト(handleEventプロパティに関数を持つオブジェクト)で指定できます。
				 * <p>
				 * 指定したイベントに、指定したイベントリスナが既に登録されていた場合は何もしません。
				 * </p>
				 * <p>
				 * 同一のイベントに対して複数回addEventListener()を呼び、複数のイベントリスナを登録した場合は、イベント発火時に登録した順番に実行されます。
				 * </p>
				 * <p>
				 * 第３引数以降が指定されていても無視されます。
				 * </p>
				 *
				 * @since 1.1.0
				 * @memberOf EventDispatcher
				 * @param {String} type イベント名
				 * @param {Function|Object} listener イベントリスナまたはhandleEventを持つイベントリスナオブジェクト
				 */
				addEventListener: function(type, listener) {
					// 引数チェック
					// typeは文字列で、第2引数まで指定されていることをチェックする
					// listenerが関数またはイベントリスナオブジェクトかどうかは、実行時に判定し、関数でもイベントリスナオブジェクトでもない場合は実行しない
					if (arguments.length < 2 || !isString(type)) {
						throwFwError(ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER);
					}
					if (listener == null || this.hasEventListener(type, listener)) {
						// nullまたはundefinedが指定されている、または既に登録済みのイベントリスナなら何もしない
						return;
					}

					if (!(this._eventListeners.hasOwnProperty(type))) {
						this._eventListeners[type] = [];
					}

					this._eventListeners[type].push(listener);
				},

				/**
				 * イベントリスナを削除します。
				 * <p>
				 * 第一引数にイベント名、第二引数にイベントリスナを渡し、指定したイベントから指定したイベントリスナを削除します。
				 * </p>
				 * <p>
				 * 指定したイベント名に指定したイベントリスナが登録されていない場合は何もしません。
				 * </p>
				 *
				 * @since 1.1.0
				 * @memberOf EventDispatcher
				 * @param {String} type イベント名
				 * @param {Function} listener イベントリスナ
				 */
				removeEventListener: function(type, listener) {
					if (!this.hasEventListener(type, listener)) {
						return;
					}

					var l = this._eventListeners[type];

					for (var i = 0, count = l.length; i < count; i++) {
						if (l[i] === listener) {
							l.splice(i, 1);
							return;
						}
					}
				},

				/**
				 * イベントをディスパッチします
				 * <p>
				 * イベントオブジェクトを引数に取り、そのevent.typeに登録されているイベントリスナを実行します。
				 * イベントオブジェクトにpreventDefault()関数を追加してイベントリスナの引数に渡して呼び出します。
				 * </p>
				 * <p>
				 * 戻り値は『イベントリスナ内でpreventDefault()が呼ばれたかどうか』を返します。
				 * </p>
				 *
				 * @since 1.1.0
				 * @memberOf EventDispatcher
				 * @param {Object} event イベントオブジェクト
				 * @returns {Boolean} イベントリスナ内でpreventDefault()が呼ばれたかどうか。
				 */
				dispatchEvent: function(event) {
					var l = this._eventListeners[event.type];
					if (!l) {
						return;
					}
					// リスナをslice(0)して、dispatchEventを呼んだ瞬間にどのリスナが呼ばれるか確定させる
					// (あるイベントのイベントリスナの中でadd/removeEventListenerされても、そのイベントが実行するイベントリスナには影響ない)
					l = l.slice(0);

					setEventProperties(event, this);

					// リスナーを実行。stopImmediatePropagationが呼ばれていたらそこでループを終了する。
					for (var i = 0, count = l.length; i < count
							&& !event.isImmediatePropagationStopped(); i++) {
						if (isFunction(l[i])) {
							l[i].call(event.target, event);
						} else if (l[i].handleEvent) {
							// イベントリスナオブジェクトの場合はhandleEventを呼ぶ
							// handleEvent内のコンテキストはイベントリスナオブジェクトなので、callは使わずにそのまま呼び出す
							l[i].handleEvent(event);
						}
					}

					return event.defaultPrevented;
				}
			}
		};
		return desc;
	});

	var Event = RootClass.extend(function() {
		var desc = {
			name: 'h5.event.Event',
			field: {
				target: null,
				timeStamp: null,
				_type: null,
				_defaultPrevented: null,
				_isImmediatePropagationStopped: null
			},
			accessor: {
				type: {
					get: function() {
						return this._type;
					}
				},
				defaultPrevented: {
					get: function() {
						return this._defaultPrevented;
					}
				}
			},
			method: {
				/**
				 * @memberOf h5.event.Event
				 */
				constructor: function Event(type) {
					Event._super.call(this);

					this._type = type;
					this._defaultPrevented = false;
					this._isImmediatePropagationStopped = false;
				},
				preventDefault: function() {
					this._defaultPrevented = true;
				},
				isDefaultPrevented: function() {
					return this._defaultPrevented;
				},
				stopImmediatePropagation: function() {
					this._isImmediatePropagationStopped = true;
				},
				isImmediatePropagationStopped: function() {
					return this._isImmediatePropagationStopped;
				}
			}
		};
		return desc;
	});

})();
