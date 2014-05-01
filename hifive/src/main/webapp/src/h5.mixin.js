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

	// =============================
	// Development Only
	// =============================

	/* del begin */

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
	 * Mixinのコンストラクタ
	 * <p>
	 * このクラスは自分でnewすることはありません。 h5.mixin.createMixin(moduleObject)を呼ぶと渡されたモジュールについてのMixinインスタンスを返します。
	 * </p>
	 * <p>
	 * また、h5.mixin以下のMixinオブジェクトがこのクラスを実装しています。
	 * </p>
	 * 
	 * @class Mixin
	 */
	/**
	 * @private
	 * @param moduleObject mixinする元となるモジュールオブジェクト
	 */
	function Mixin(moduleObject) {
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

		this._mix = (function() {
			return function(target) {
				for ( var p in props) {
					// targetがもともと持っていたプロパティがあっても上書き
					target[p] = props[p];
				}
			};
		})();

		this._hasInstance = (function() {
			return function(object) {
				for ( var p in props) {
					// hasOwnPropertyがtrueかどうかは判定せず、プロトタイプチェーン上にあってもよい
					// undefined出なければそのプロパティを持っていると判定する
					if (object[p] === undefined) {
						return false;
					}
				}
				return true;
			};
		})();
	}

	$.extend(Mixin.prototype, {
		/**
		 * @memberOf Mixin
		 * @prop {Object} target
		 */
		mix: function(target) {
			return this._mix(target);
		},
		/**
		 * @memberOf Mixin
		 * @prop {Object} object
		 */
		hasInstance: function(object) {
			return this._hasInstance(object);
		}
	});

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	function createMixin(moduleObject) {
		return new Mixin(moduleObject);
	}
	
	/**
	 * EventDispatcherのMixin
	 * <p>EventDispatcherのMixinです。このクラスが持つmix()メソッドを呼ぶと、オブジェクトにEventDispatcherの機能が追加されます。</p>
	 * <p>Mixinクラスについては<a href="Mixin.html">こちら</a>をご覧ください。</p>
	 * <p>EventDispatcherクラスについては<a href="EventDispatcher">こちら</a>をご覧ください。</p>
	 * @memberOf h5.mixin
	 * @name eventDispatcher
	 */
	var eventDispatcher = createMixin(h5internal.mixin.EventDispatcher.prototype);

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5.mixin', {
		createMixin: createMixin,
		eventDispatcher: eventDispatcher
	});
})();