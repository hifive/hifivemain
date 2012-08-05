/*
 * Copyright (C) 2012 NS Solutions Corporation
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
/* h5scopedglobals */

// =========================================================================
//
// Scoped Globals
//
// =========================================================================
// =============================
// Misc Variables
// =============================
/**
 * { (エラーコード): (フォーマット文字列) } なマップ
 *
 * @private
 */
var errorCodeToMessageMap = {};

// =============================
// Misc Functions
// =============================

/**
 * フレームワークエラーを発生させます。
 *
 * @private
 * @param code {Number} エラーコード
 * @param msgParam {Any[]} フォーマットパラメータ
 * @param detail {Any} 追加のデータ(内容はAPIごとに異なる)
 */
function throwFwError(code, msgParam, detail) {
	var msg = null;
	var msgSrc = errorCodeToMessageMap[code];

	if (msgSrc) {
		msg = h5.u.str.format.apply(null, [msgSrc].concat(msgParam));
		msg += '(code=' + code + ')';
	}

	var e = msg ? new Error(msg) : new Error('FwError: code = ' + code);

	if (code) {
		e.code = code;
	}
	if (detail) {
		e.detail = detail;
	}

	throw e;
}

/* del begin */
// テストのためにexposeする
window.com = {
	htmlhifive: {
		throwFwError: throwFwError
	}
};
/* del end */


/**
 * エラーコードとエラーメッセージのマップを追加します。
 *
 * @private
 * @param mapObj {Object} { (エラーコード): (フォーマット文字列) }という構造のオブジェクト
 */
function addFwErrorCodeMap(mapObj) {
	for (code in mapObj) {
		if (mapObj.hasOwnProperty(code)) {
			errorCodeToMessageMap[code] = mapObj[code];
		}
	}
}

/**
 * 非同期APIのReject時の理由オブジェクトを作成します。
 *
 * @private
 * @param code {Number} エラーコード
 * @param msgParam {Any[]} フォーマットパラメータ
 * @param detail {Any} 追加のデータ(内容はAPIごとに異なる)
 * @returns {Object} 理由オブジェクト
 */
function createRejectReason(code, msgParam, detail) {
	var msg = null;
	var f = errorCodeToMessageMap[code];
	if (f) {
		var args = [f].concat(msgParam);
		msg = h5.u.str.format.apply(null, args);
	}

	return {
		code: code,
		message: msg,
		detail: detail
	};
}

/**
 * 引数を配列化します。既に配列だった場合はそれをそのまま返し、 配列以外だった場合は配列にして返します。 ただし、nullまたはundefinedの場合はそのまま返します。
 *
 * @private
 * @param value 値
 * @returns 配列化された値、ただし引数がnullまたはundefinedの場合はそのまま
 */
function wrapInArray(value) {
	if (value == null) {
		return value;
	}
	return $.isArray(value) ? value : [value];
}

/**
 * 相対URLを絶対URLに変換します。
 *
 * @private
 * @param {String} relativePath 相対URL
 * @returns {String} 絶対パス
 */
function toAbsoluteUrl(relativePath) {
	var e = document.createElement('span');
	e.innerHTML = '<a href="' + relativePath + '" />';
	return e.firstChild.href;
}

/**
 * 引数が文字列かどうかを判定します。
 *
 * @private
 * @param {Any} target 値
 * @returns {boolean} 文字列ならtrue、そうでないならfalse
 */
function isString(target) {
	return typeof target === 'string';
}

/**
 * 引数が名前空間として有効な文字列かどうかを判定します。 ただし、全角文字が含まれる場合はfalseを返します。
 *
 * @private
 * @param {Any} property 値
 * @returns {boolean} 名前空間として有効な文字列であればtrue、そうでないならfalse
 */
function isValidNamespaceIdentifier(property) {
	if (!isString(property)) {
		return false;
	}

	// 全角文字は考慮しない
	return !!property.match(/^[A-Za-z_\$][\w|\$]*$/);
}

// =============================
// ロガー・アスペクトで使用する共通処理
// =============================
/**
 * 文字列の正規表現記号をエスケープします。
 *
 * @private
 * @param {String} str 文字列
 * @returns {String} エスケープ済文字列
 */
function escapeRegex(str) {
	return str.replace(/\W/g, '\\$&');
}

/**
 * 引数がStringの場合、RegExpオブジェクトにして返します。 引数がRegExpオブジェクトの場合はそのまま返します。
 *
 * @private
 * @param {String|RegExp} target 値
 * @returns {RegExp} オブジェクト
 */
function getRegex(target) {
	if ($.type(target) === 'regexp') {
		return target;
	}
	var str = '';
	if (target.indexOf('*') !== -1) {
		var array = $.map(target.split('*'), function(n) {
			return escapeRegex(n);
		});
		str = array.join('.*');
	} else {
		str = target;
	}
	return new RegExp('^' + str + '$');
}




/***************************************************************************************************
 * イベントディスパッチャのプロトタイプ。ObservableArray, DataModel等で使用するのでグローバルに配置している。
 *
 * @private
 * @class
 * @name EventDispatcher
 **************************************************************************************************/
function EventDispatcher() {}

/**
 * @memberOf EventDispatcher
 * @param type
 * @param listener
 * @returns {Boolean}
 */
EventDispatcher.prototype.hasEventListener = function(type, listener) {
	if (!this.__listeners) {
		return false;
	}
	var l = this.__listeners[type];
	if (!l) {
		return false;
	}

	for ( var i = 0, count = l.length; i < count; i++) {
		if (l[i] === listener) {
			return true;
		}
	}
	return false;

};

/**
 * @memberOf EventDispatcher
 * @param type
 * @param listener
 */
EventDispatcher.prototype.addEventListener = function(type, listener) {
	if (this.hasEventListener(type, listener)) {
		return;
	}

	if (!this.__listeners) {
		this.__listeners = {};
	}

	if (!(type in this.__listeners)) {
		this.__listeners[type] = [];
	}

	this.__listeners[type].push(listener);
};

/**
 * @memberOf EventDispatcher
 * @param type
 * @param listener
 */
EventDispatcher.prototype.removeEventListener = function(type, listener) {
	if (!this.hasEventListener(type, listener)) {
		return;
	}

	var l = this.__listeners[type];

	for ( var i = 0, count = l.length; i < count; i++) {
		if (l[i] === listener) {
			l.splice(i, 1);
			return;
		}
	}

};

/**
 * @memberOf EventDispatcher
 * @param event
 */
EventDispatcher.prototype.dispatchEvent = function(event) {
	if (!this.__listeners) {
		return;
	}
	var l = this.__listeners[event.type];
	if (!l) {
		return;
	}

	if (!event.target) {
		event.target = this;
	}

	for ( var i = 0, count = l.length; i < count; i++) {
		l[i].call(event.target, event);
	}
};



var h5internal = {
	core: {
		controllerInternal: null
	}
};
