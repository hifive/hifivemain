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
 * { (エラーコード): (フォーマット文字列) } マップ
 *
 * @private
 */
var errorCodeToMessageMap = {};

/**
 * { (エラーコード)： (フォーマッタ関数) } マップ
 *
 * @private
 */
var errorCodeToCustomFormatterMap = {};

/**
 * undefinedかどうかの判定で、typeofで判定する
 *
 * @private
 */
var TYPE_OF_UNDEFINED = 'undefined';

/**
 * Node.ELEMENT_NODE。IE8-ではNodeがないので自前で定数を作っている
 *
 * @private
 */
var NODE_TYPE_ELEMENT = 1;

/**
 * Node.DOCUMENT_NODE。IE8-ではNodeがないので自前で定数を作っている
 *
 * @private
 */
var NODE_TYPE_DOCUMENT = 9;

//=============================
// Errors
//=============================
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

	var customFormatter = errorCodeToCustomFormatterMap[code];
	if (customFormatter) {
		msg = customFormatter(code, msgSrc, msgParam, detail);
	}

	//カスタムフォーマッタがnull/undefinedを返した場合も標準フォーマッタにかける
	if (!msg && msgSrc) {
		msg = h5.u.str.format.apply(null, [msgSrc].concat(msgParam));
	}

	if (msg) {
		//最後に必ずエラーコードを付ける
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
	for ( var code in mapObj) {
		if (mapObj.hasOwnProperty(code)) {
			errorCodeToMessageMap[code] = mapObj[code];
		}
	}
}

/**
 * エラーコードとカスタムメッセージフォーマッタのマップを追加します。
 *
 * @private
 * @param errorCode エラーコード
 * @param formatter カスタムメッセージフォーマッタ
 */
function addFwErrorCustomFormatter(errorCode, formatter) {
	errorCodeToCustomFormatterMap[errorCode] = formatter;
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
	return isArray(value) ? value : [value];
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
 * DeferredオブジェクトがReject状態かどうかを判定します。 jQuery1.7でDeferred.isRejected/isResolvedはDeprecatedとなり、
 * 1.8で削除された（代わりにstate()メソッドが1.7から追加された）ので、 使用可能なAPIを用いて判定します。
 *
 * @private
 * @param {Object} dfd Deferredオブジェクト
 * @returns {Boolean} Rejected状態かどうか
 */
function isRejected(dfd) {
	if (dfd.isRejected) {
		return dfd.isRejected();
	}
	//jQuery 1.7でisRejectedはDeprecatedになり、1.8.0で削除された
	return dfd.state() === 'rejected';
}

/**
 * DeferredオブジェクトがReject状態かどうかを判定します。 jQuery1.7でDeferred.isRejected/isResolvedはDeprecatedとなり、
 * 1.8で削除された（代わりにstate()メソッドが1.7から追加された）ので、 使用可能なAPIを用いて判定します。
 *
 * @private
 * @param {Object} dfd Deferredオブジェクト
 * @returns {Boolean} Resolved状態かどうか
 */
function isResolved(dfd) {
	if (dfd.isResolved) {
		return dfd.isResolved();
	}
	return dfd.state() === 'resolved';
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

/**
 * promiseのメソッド呼び出しを_h5UnwrappedCallを使って行います。 jQueryのpromiseが渡されたらそのまま実行します。
 *
 * @private
 * @param {Deferred|Promise} promise
 * @param {String} method
 * @param {Array|Any} args 複数の引数があるときは配列で渡します。
 */
function registerCallbacksSilently(promise, method, args) {
	if (promise) {
		promise._h5UnwrappedCall ? promise._h5UnwrappedCall(method, args) : promise[method](args);
	}
}

/**
 * 使用しているjQueryのバージョンで推奨されている、Deferredをフィルタリングまたはチェーンするメソッドを実行します。
 * <p>
 * deferred.pipe()がjQuery1.8から非推奨となったため1.8以上の場合then()を、1.7以下の場合はpipe()を実行します。
 *
 * @private
 * @param {Promise} promise Promiseオブジェクト
 * @param {Function} doneFilter doneコールバック
 * @param {Function} failFilter failコールバック
 * @param {Function} progressFilter progressコールバック
 * @returns {Promise} Promiseオブジェクト
 */
function thenCompat(promise, doneFilter, failFilter, progressFilter) {
	//curCSS()はjQuery1.8.0で削除されたメソッド。これの有無で1.8以上かどうかの判定を代理している
	return promise[$.hasOwnProperty('curCSS') ? 'pipe' : 'then'](doneFilter, failFilter,
			progressFilter);
}

/**
 * ノードからドキュメントを取得。
 * <p>
 * 引数がdocumentノードなら引数をそのまま、ノードならownerDocument、windowオブジェクトならそのdocumentを返します。nodeがいずれにも該当しない場合はnullを返します。
 * </p>
 *
 * @private
 * @param {DOM} node
 * @returns {Document} documentオブジェクト
 */
function getDocumentOf(node) {
	if (typeof node.nodeType === TYPE_OF_UNDEFINED) {
		// ノードではない
		if (node.document && node.document.nodeType === NODE_TYPE_DOCUMENT
				&& getWindowOfDocument(node.document) === node) {
			// nodeがdocumentを持ち、documentから得られるwindowオブジェクトがnode自身ならnodeをwindowオブジェクトと判定する
			return node.document;
		}
		return null;
	}
	if (node.nodeType === NODE_TYPE_DOCUMENT) {
		// nodeがdocumentの場合
		return node;
	}
	// nodeがdocument以外(documentツリー属するノード)の場合はそのownerDocumentを返す
	return node.ownerDocument;
}

/**
 * documentオブジェクトからwindowオブジェクトを取得
 *
 * @private
 * @param {Document} doc
 * @returns {Window} windowオブジェクト
 */
function getWindowOfDocument(doc) {
	// IE8-ではdocument.parentWindow、それ以外はdoc.defaultViewでwindowオブジェクトを取得
	return doc.defaultView || doc.parentWindow;
}

/**
 * ノードからwindowオブジェクトを取得
 *
 * @private
 * @param {DOM} node
 * @returns {Window} windowオブジェクト
 */
function getWindowOf(node) {
	return getWindowOfDocument(getDocumentOf(node));
}

/**
 * 引数が配列かどうか判定
 *
 * @private
 * @param {Any} obj
 */
var isArray = Array.isArray || (function() {
	// プロパティアクセスを減らすため、toStringをキャッシュ
	var toStringObj = Object.prototype.toString;
	return function(obj) {
		return toStringObj.call(obj) === '[object Array]';
	};
})();

/**
 * 引数が配列かどうか判定
 *
 * @private
 * @param {Any} obj
 */
function isFunction(obj) {
	return typeof obj === 'function';
}

//TODO あるオブジェクト下に名前空間を作ってexposeするようなメソッドを作る
var h5internal = {
	core: {
		controllerInternal: null
	}
};
