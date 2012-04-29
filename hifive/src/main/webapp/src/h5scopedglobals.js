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
/* h5scopedglobals */

// =========================================================================
//
// Scoped Globals
//
// =========================================================================
// =============================
// Misc Variables
// =============================
/** { (エラーコード): (フォーマット文字列) } なマップ */
var errorCodeToMessageMap = {};

// =============================
// Misc Functions
// =============================

/**
 * フレームワークエラーを発生させます。
 *
 * @param code {Number} エラーコード
 * @param msgParam {Any[]} フォーマットパラメータ
 * @param detail {Any} 追加のデータ(内容はAPIごとに異なる)
 */
function throwFwError(code, msgParam, detail) {
	var e = new Error();
	if (code) {
		e.code = code; // TODO codeは必須、ない場合は…throw Error
	}
	var msg = errorCodeToMessageMap[code];
	if (msg) {
		var args = [msg].concat(msgParam);
		e.message = h5.u.str.format.apply(null, args);
	}
	if (detail) {
		e.detail = detail;
	}
	throw e;
}

/**
 * エラーコードとエラーメッセージのマップを追加します。
 *
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
 * @param value 値
 * @returns 配列化された値、ただし引数がnullまたはundefinedの場合はそのまま
 */
function wrapInArray(value) {
	if (!value) {
		return value;
	}
	return $.isArray(value) ? value : [value];
}

/**
 * 相対URLを絶対URLに変換します。
 *
 * @param {String} relativePath 相対URL
 * @returns {String} 絶対パス
 * @private
 */
function toAbsoluteUrl(relativePath) {
	var e = document.createElement('span');
	e.innerHTML = '<a href="' + relativePath + '" />';
	return e.firstChild.href;
}


// =============================
// ロガー・アスペクトで使用する共通処理
// =============================
/**
 * 文字列の正規表現記号をエスケープします。
 *
 * @param {String} str 文字列
 * @returns {String} エスケープ済文字列
 */
function escapeRegex(str) {
	return str.replace(/\W/g, '\\$&');
};

/**
 * 引数がStringの場合、RegExpオブジェクトにして返します。 引数がRegExpオブジェクトの場合はそのまま返します。
 *
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
};
