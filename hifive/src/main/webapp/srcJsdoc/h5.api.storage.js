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
function WebStorage(storage) {
	/**
	 * ストレージオブジェクト(sessionStorage)
	 *
	 * @memberOf h5.api.storage.session
	 * @name storage
	 * @type Storage
	 * @private
	 */
	this._storage = storage;
}

WebStorage.prototype = {
	/**
	 * ストレージに保存されている、キーと値のペアの数を取得します。
	 *
	 * @memberOf h5.api.storage.session
	 * @name getLength
	 * @function
	 * @returns {Number} キーとペアの数
	 */
	getLength: function() {
	//
	},

	/**
	 * 指定されたインデックスにあるキーを、ストレージから取得します。
	 *
	 * @memberOf h5.api.storage.session
	 * @name key
	 * @function
	 * @param {Number} index インデックス
	 * @returns {String} キー
	 */
	key: function(index) {
	//
	},

	/**
	 * 指定されたキーに紐付く値を、ストレージから取得します。
	 * <p>
	 * 自動的にsetItem()実行時に保存したときの型に戻します。
	 *
	 * @memberOf h5.api.storage.session
	 * @name getItem
	 * @function
	 * @param {String} key キー
	 * @returns {Any} キーに紐付く値
	 */
	getItem: function(key) {
	//
	},

	/**
	 * 指定されたキーで、値をストレージに保存します。
	 * <p>
	 * 値は、シリアライズして保存します。保存できる型は<a href="./h5.u.obj.html#serialize">h5.u.obj.serialize()</a>を参照してください。
	 * </p>
	 *
	 * @memberOf h5.api.storage.session
	 * @name setItem
	 * @function
	 * @param {String} key キー
	 * @param {Any} value 値
	 */
	setItem: function(key, value) {
	//
	},

	/**
	 * 指定されたキーに紐付く値を、ストレージから削除します。
	 *
	 * @memberOf h5.api.storage.session
	 * @name removeItem
	 * @function
	 * @param {String} key キー
	 */
	removeItem: function(key) {
	//
	},

	/**
	 * ストレージに保存されている全てのキーとそれに紐付く値を全て削除します。
	 *
	 * @memberOf h5.api.storage.session
	 * @name clear
	 * @function
	 */
	clear: function() {
	//
	},

	/**
	 * 現在ストレージに保存されているオブジェクト数分、キーと値をペアで取得します。
	 *
	 * @memberOf h5.api.storage.session
	 * @name each
	 * @function
	 * @param {Function} callback インデックス, キー, 値 を引数に持つコールバック関数
	 */
	each: function() {
	//
	}
};
