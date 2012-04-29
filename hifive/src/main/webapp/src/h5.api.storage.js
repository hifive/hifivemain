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

/* ------ h5.api.storage ------ */
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

	var fwLogger = h5.log.createLogger('h5.api.storage');

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
	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	function WebStorage(storage) {
		/**
		 * ストレージオブジェクト(localStorage/sessionStorage)
		 *
		 * @member h5.api.storage.local
		 * @name storage
		 * @type Storage
		 * @private
		 */
		this._storage = storage;
	}

	/**
	 * Web Storage
	 *
	 * @memberOf h5.api
	 * @name storage
	 * @namespace
	 */
	$.extend(WebStorage.prototype, {
		/**
		 * ストレージに保存されている、キーと値のペアの数を取得します。
		 *
		 * @memberOf h5.api.storage.local
		 * @name getLength
		 * @function
		 * @returns {Number} キーとペアの数
		 */
		getLength: function() {
			return this._storage.length;
		},

		/**
		 * 指定されたインデックスにあるキーを、ストレージから取得します。
		 *
		 * @memberOf h5.api.storage.local
		 * @name key
		 * @function
		 * @param {Number} index インデックス
		 * @returns {String} キー
		 */
		key: function(index) {
			return this._storage.key(index);
		},

		/**
		 * 指定されたキーに紐付く値を、ストレージから取得します。
		 * <p>
		 * 自動的にsetItem()実行時に保存したときの型に戻します。
		 *
		 * @memberOf h5.api.storage.local
		 * @name getItem
		 * @function
		 * @param {String} key キー
		 * @returns {Any} キーに紐付く値
		 */
		getItem: function(key) {
			return h5.u.obj.deserialize(this._storage.getItem(key));
		},

		/**
		 * 指定されたキーで、値をストレージに保存します。
		 * <p>
		 * 値は、シリアライズして保存します。保存できる型は<a href="./h5.u.obj.html#serialize">h5.u.obj.serialize()</a>を参照してください。
		 * </p>
		 *
		 * @memberOf h5.api.storage.local
		 * @name setItem
		 * @function
		 * @param {String} key キー
		 * @param {Any} value 値
		 */
		setItem: function(key, value) {
			this._storage.setItem(key, h5.u.obj.serialize(value));
		},

		/**
		 * 指定されたキーに紐付く値を、ストレージから削除します。
		 *
		 * @memberOf h5.api.storage.local
		 * @name removeItem
		 * @function
		 * @param {String} key キー
		 */
		removeItem: function(key) {
			this._storage.removeItem(key);
		},

		/**
		 * ストレージに保存されている全てのキーとそれに紐付く値を全て削除します。
		 *
		 * @memberOf h5.api.storage.local
		 * @name clear
		 * @function
		 */
		clear: function() {
			this._storage.clear();
		},

		/**
		 * 現在ストレージに保存されているオブジェクト数分、キーと値をペアで取得します。
		 *
		 * @memberOf h5.api.storage.local
		 * @name each
		 * @function
		 * @param {Function} callback インデックス, キー, 値 を引数に持つコールバック関数
		 */
		each: function(callback) {
			var storage = this._storage;

			for ( var i = 0, len = storage.length; i < len; i++) {
				var k = storage.key(i);
				callback(i, k, this.getItem(k));
			}
		}
	});

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5.api.storage', {
		/**
		 * ブラウザがこのAPIをサポートしているか。
		 *
		 * @memberOf h5.api.storage
		 * @name isSupported
		 * @type Boolean
		 */
		// APIはlocalStorageとsessionStorageに分かれており、本来であればそれぞれサポート判定する必要があるが、
		// 仕様ではStorage APIとして一つに扱われておりかつ、テストした限りでは片方のみ使用できるブラウザが見つからない為、一括りに判定している。
		isSupported: !!window.localStorage,
		/**
		 * ローカルストレージ
		 *
		 * @memberOf h5.api.storage
		 * @name local
		 * @namespace
		 */
		local: new WebStorage(window.localStorage),
		/**
		 * セッションストレージ
		 *
		 * @memberOf h5.api.storage
		 * @name session
		 * @namespace
		 */
		session: new WebStorage(window.sessionStorage)
	});

	fwLogger.debug(h5.u.str.format('local storage supported:{0}, session storage supported:{1}',
			!!window.localStorage, !!window.sessionStorage));

})();
