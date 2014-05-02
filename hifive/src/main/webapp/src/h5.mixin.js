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

/* ------ h5.mixin ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	// -------------------------------
	// エラーコード
	// -------------------------------
	/** addEventListenerに不正な引数が渡された */
	var ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER = 16000;

	// =============================
	// Development Only
	// =============================

	/* del begin */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER] = 'addEventListenerには、イベント名(文字列)、イベントリスナ(関数)を渡す必要があります。';

	// メッセージの登録
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
	// =============================
	// Functions
	// =============================
	/**
	 * 受け取ったオブジェクトをイベントオブジェクトにする
	 *
	 * @private
	 * @param {Object} event 任意のオブジェクト
	 * @param {Object} target event.targetになるオブジェクト
	 * @returns {Object} イベントオブジェクト
	 */
	function createEventObject(event, target) {
		// ターゲットの追加
		if (!event.target) {
			event.target = target;
		}
		// タイムスタンプの追加
		if (!event.timeStamp) {
			event.timeStamp = new Date().getTime();
		}

		// isDefaultPreventedがないなら、isDefaultPrevented()とpreventDefault()を追加
		if (!event.isDefaultPrevented) {
			var _isDefaultPrevented = false;
			event.isDefaultPrevented = function() {
				return _isDefaultPrevented;
			};
			event.preventDefault = function() {
				_isDefaultPrevented = true;
			};
		}

		// isImmediatePropagationStoppedがないなら、isImmediatePropagationStopped()とstopImmediatePropagation()を追加
		if (!event.isImmediatePropagationStopped) {
			var _isImmediatePropagationStopped = false;
			event.isImmediatePropagationStopped = function() {
				return _isImmediatePropagationStopped;
			};
			event.stopImmediatePropagation = function() {
				_isImmediatePropagationStopped = true;
			};
		}
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * Mixinのコンストラクタ
	 * <p>
	 * このクラスは自分でnewすることはありません。
	 * h5.mixin.createMixin(moduleObject)を呼ぶと渡されたモジュールオブジェクトについてのMixinインスタンスを返します。
	 * </p>
	 * <p>
	 * 作製したインスタンスの<a href="Mixin.html#mix">mix()</a>を呼ぶと、モジュールオブジェクトとmixの引数に渡されたオブジェクトをミックスインしたオブジェクトを返します。
	 * </p>
	 *
	 * <pre><code>
	 * // set,getメソッドを持つモジュールオブジェクトのmixinを作成する例
	 * var mixin = h5.mixin.createMixin({
	 * 	set: function(p, v) {
	 * 		this[p] = v;
	 * 	},
	 * 	get: function(p) {
	 * 		return this[p];
	 * 	}
	 * });
	 * var target = {
	 * 	hoge: 'abc'
	 * };
	 * mixin.mix(target);
	 * mixin.get('hoge'); // 'abc'が返る
	 * </code></pre>
	 *
	 * <p>
	 * <a href="h5.mixin.html">h5.mixin</a>以下にこのクラスを実装したインスタンスを配置しています。
	 * </p>
	 *
	 * @class Mixin
	 */
	/**
	 * @private
	 * @param moduleObject mixinする元となるモジュールオブジェクト
	 */
	function Mixin(moduleObject) {
		// moduleObjectのプロパティキャッシュを作成
		var props = {};
		for ( var p in moduleObject) {
			var v = moduleObject[p];
			// hasOwnPropertyがtrueでなければコピーしない
			// 関数、null、文字列リテラル、数値リテラル、真偽値リテラルのいずれかの場合のみコピー
			if (moduleObject.hasOwnProperty(p)
					&& ($.isFunction(v) || v === null || typeof v === 'string'
							|| typeof v === 'number' || typeof v === 'boolean')) {
				props[p] = v;
			}
		}

		// mix, hasInterfaceはMixinのprototypeに持たせていて、それぞれインスタンスが持つ_mix, _hasInterfaceを呼んでいる
		// _mix, _hasInterfaceはmoduleObjectのプロパティキャッシュを参照したいため、Mixinインスタンスごとに定義している
		this._mix = function(target) {
			for ( var p in props) {
				// targetがもともと持っていたプロパティがあっても上書き
				target[p] = props[p];
			}
		};

		this._hasInterface = function(object) {
			for ( var p in props) {
				// プライベートなものはチェックしない
				if (h5.u.str.startsWith(p, '_')) {
					continue;
				}
				// hasOwnPropertyがtrueかどうかは判定せず、プロトタイプチェーン上にあってもよい
				// undefinedでなければそのプロパティを持っていると判定する
				if (object[p] === undefined) {
					return false;
				}
			}
			return true;
		};
	}

	$.extend(Mixin.prototype, {
		/**
		 * 引数に渡されたオブジェクトと、モジュールオブジェクトとのミックスインを作成します。
		 * <p>
		 * 関数、null、文字列リテラル、数値リテラル、真偽値リテラルのいずれかの値を持つプロパティについてのみミックスインを行います。
		 * </p>
		 *
		 * @memberOf Mixin
		 * @prop {Object} target
		 */
		mix: function(target) {
			return this._mix(target);
		},
		/**
		 * 引数に渡されたオブジェクトが、モジュールオブジェクトを実装しているかどうか判定します。
		 * <p>
		 * 関数、null、文字列リテラル、数値リテラル、真偽値リテラルのいずれかの値を持つモジュールオブジェクトのプロパティを、
		 * 引数に渡されたobjectが全て持っているならtrue、そうでないならfalseを返します。
		 * </p>
		 * <p>
		 * ただしモジュールオブジェクトで定義されたプライベートメンバ("_"始まり)のプロパティについてはチェックしません。
		 * </p>
		 *
		 * @memberOf Mixin
		 * @prop {Object} object
		 * @returns {Boolean}
		 */
		hasInterface: function(object) {
			return this._hasInterface(object);
		}
	});

	function createMixin(moduleObject) {
		return new Mixin(moduleObject);
	}

	//-------------------------------------------
	//EventDispatcher
	//-------------------------------------------
	/**
	 * イベントディスパッチャ
	 * <p>
	 * イベントリスナを管理するクラスです。このクラスはnewできません。
	 * </p>
	 * <p>
	 * このモジュールをミックスインしたオブジェクトを作成したい場合は、<a
	 * href="h5.mixin.html#eventDispatcher">h5.mixin.eventDispatcher</a>の<a
	 * href="Mixin.html#mix">mix()</a>メソッドを使用してください。
	 * </p>
	 * <p>
	 * 以下のクラスがイベントディスパッチャのメソッドを持ちます。
	 * <ul>
	 * <li><a href="ObservableArray.html">ObservableArray</a>
	 * <li><a href="ObservableItem.html">ObservableItem</a>
	 * <li><a href="DataModelManager.html">DataModelManager</a>
	 * <li><a href="DataModel.html">DataModel</a>
	 * <li><a href="DataItem.html">DataItem</a>
	 * </ul>
	 * </p>
	 *
	 * @mixin
	 * @name EventDispatcher
	 */
	var eventDispatcherModule = {
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
			if (arguments.length !== 2 || !isString(type)) {
				throwFwError(ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER);
			}
			if (listener == null || this.hasEventListener(type, listener)) {
				// nullまたはundefinedが指定されている、または既に登録済みのイベントリスナなら何もしない
				return;
			}

			if (!this._eventListeners) {
				this._eventListeners = {};
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
			if (!this._eventListeners) {
				return;
			}
			var l = this._eventListeners[event.type];
			if (!l) {
				return;
			}
			// リスナをslice(0)して、dispatchEventを呼んだ瞬間にどのリスナが呼ばれるか確定させる
			// (あるイベントのイベントリスナの中でadd/removeEventListenerされても、そのイベントが実行するイベントリスナには影響ない)
			l = l.slice(0);

			createEventObject(event, this);

			// リスナーを実行。stopImmediatePropagationが呼ばれていたらそこでループを終了する。
			for (var i = 0, count = l.length; i < count && !event.isImmediatePropagationStopped(); i++) {
				if ($.isFunction(l[i])) {
					l[i].call(event.target, event);
				} else if (l[i].handleEvent) {
					// イベントリスナオブジェクトの場合はhandleEventを呼ぶ
					// handleEvent内のコンテキストはイベントリスナオブジェクトなので、callは使わずにそのまま呼び出す
					l[i].handleEvent(event);
				}
			}

			return event.isDefaultPrevented();
		}
	};

	// =============================
	// Expose to window
	// =============================

	/**
	 * @namespace h5.mixin
	 */
	h5.u.obj.expose('h5.mixin', {
		/**
		 * Mixinクラスを引数に渡されたモジュールオブジェクトから作成します。
		 * <p>
		 * 作成したMixinクラスはモジュールオブジェクトとのmixinを行うクラスになります。 Mixinクラスについては<a href="Mixin.html">こちら</a>をご覧ください。
		 * </p>
		 *
		 * @since 1.1.10
		 * @memberOf h5.mixin
		 * @param {Object} moduleObject モジュールオブジェクト。mixinの元となるオブジェクト
		 * @returns {Mixin} モジュールオブジェクトをもとに生成したMixinオブジェクト
		 */
		createMixin: createMixin,

		/**
		 * EventDispatcherのMixin
		 * <p>
		 * EventDispatcherのMixinです。このクラスが持つmix()メソッドを呼ぶと、オブジェクトにEventDispatcherの機能が追加されます。
		 * </p>
		 * <p>
		 * Mixinクラスについては<a href="Mixin.html">こちら</a>をご覧ください。
		 * </p>
		 * <p>
		 * EventDispatcherクラスについては<a href="EventDispatcher">こちら</a>をご覧ください。
		 * </p>
		 *
		 * @since 1.1.10
		 * @memberOf h5.mixin
		 * @type {Mixin}
		 * @name eventDispatcher
		 */
		eventDispatcher: createMixin(eventDispatcherModule)
	});
})();