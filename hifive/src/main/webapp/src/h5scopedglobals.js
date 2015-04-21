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
 * ネットワークに繋がらない時にjqXhr.statusに格納されるコード(IE)。通信をリトライするかどうかの判定に使用。
 *
 * @private
 */
var ERROR_INTERNET_CANNOT_CONNECT = 12029;

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
var toAbsoluteUrl = (function() {
	var a = null;
	var span = null;
	var isHrefPropAbsoluteFlag = null;
	function isHrefPropAbsolute() {
		if (isHrefPropAbsoluteFlag === null) {
			a.setAttribute('href', './');
			isHrefPropAbsoluteFlag = a.href !== './';
		}
		return isHrefPropAbsoluteFlag;
	}
	return function(relativePath) {
		if (!a) {
			// a.hrefを使わない場合でも、a.hrefが使えるかどうかの判定でa要素を使用するので、最初の呼び出し時に必ずa要素を作る
			a = document.createElement('a');
		}
		if (isHrefPropAbsolute()) {
			a.setAttribute('href', relativePath);
			return a.href;
		}
		// a.hrefが絶対パスにならない場合はinnerHTMLを使う
		if (!span) {
			span = document.createElement('span');
		}
		span.innerHTML = '<a href="' + relativePath + '" />';
		return span.firstChild.href;
	};
})();

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

/**
 * 文字列をHTMLにパースします
 * <p>
 * jQuery.parseHTMLがある(jQuery1.8以降)場合はjQuery.parseHTMLと同じです
 * </p>
 * <p>
 * ない場合はjQuery1.8以降のparseHTMLと同様の動作を実装しています。
 * </p>
 *
 * @private
 * @param {String} data HTML文字列
 * @param {Document} [context=document] createElementを行うDocumentオブジェクト。省略した場合はdocumentを使用します
 * @param {Boolean} [keppScripts=false] script要素を生成するかどうか。デフォルトは生成しない(false)です
 */
parseHTML = $.parseHTML ? $.parseHTML : function(data, context, keepScripts) {
	if (!data || !isString(data)) {
		return null;
	}
	if (typeof context === 'boolean') {
		// context指定が省略された場合(第2引数がboolean)なら第2引数をkeepScripts指定として扱う
		keepScripts = context;
		context = false;
	}
	context = context || document;

	// タグで囲って、$()でパースできるようにする
	data = '<div>' + data + '</div>';
	var $ret = $(data, context);
	if (!keepScripts) {
		// script要素の除去
		$ret.find('script').remove();
	}
	// タグで囲ってパースしたので、parentElementがダミーのものになっている
	// そのためフラグメントを生成してparentElementがnullになるようにする
	var ret = $ret[0].childNodes;
	var fragment = context.createDocumentFragment();
	for (var i = 0, l = ret.length; i < l; i++) {
		fragment.appendChild(ret[i]);
	}
	return fragment.childNodes;
};

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
 * 渡されたオブジェクトがwindowオブジェクトかどうか判定する
 *
 * @private
 * @param {Any} obj
 * @returns {Boolean} objがwindowオブジェクトかどうか
 */
function isWindowObject(obj) {
	// nodeがdocumentを持ち、documentから得られるwindowオブジェクトがnode自身ならnodeをwindowオブジェクトと判定する
	return obj && obj.document && obj.document.nodeType === NODE_TYPE_DOCUMENT
			&& getWindowOfDocument(obj.document) === obj;
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
		if (isWindowObject(node)) {
			// windowオブジェクトならwindow.documentを返す
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
	// IE8-だと、windowとwindow.document.parentWindowで、同じwindowを指すが、"==="で比較するとfalseになる (#339)
	// イベントハンドラをバインドするターゲットがwindowである時は、window.document.parentWindowではなく
	// windowにバインドして、イベントハンドラのthis(コントローライベントハンドラの第２引数)をwindowにするため、
	// window.document === doc の場合はparentWindowではなくwindowを返すようにしている

	// IE8-ではdocument.parentWindow、それ以外はdoc.defaultViewでwindowオブジェクトを取得
	return window.document === doc ? window : doc.defaultView || doc.parentWindow;
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
 * <p>
 * Array.isArrayがあるブラウザの場合はisArray===Array.isArrayです
 * </p>
 *
 * @private
 * @param {Any} obj
 * @returns {Boolean}
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
 * @returns {Boolean}
 */
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

/**
 *
 */
function WaitingPromiseManager(promises, doneCallback, failCallback, cfhIfFail) {
	// 高速化のため、長さ1または0の場合はforを使わずにチェックする
	var length = promises ? promises.length : 0;
	var isPromise = h5.async.isPromise;
	var that = this;
	var resolveArgs = null;
	this._doneCallbackExecuter = function() {
		that._resolved = true;
		doneCallback && doneCallback.apply(this, resolveArgs || arguments);
	};
	this._failCallbackExecuter = function() {
		that._rejected = true;
		if (failCallback) {
			failCallback.apply(this, arguments);
		} else if (cfhIfFail && h5.settings.commonFailHandler) {
			// failCallbackが渡されていなくてcfhIfFailがtrueでcommonFailHandlerが設定されていればcFHを呼ぶ
			h5.settings.commonFailHandler.call(this, arguments);
		}
	};

	// 高速化のため、長さ１またはプロミスを直接指定の場合はプロミス配列を作らない
	if (length === 1 || isPromise(promises)) {
		var promise = length === 1 ? promises[0] : promises;
		if (!isPromise(promise)) {
			// 長さ1で中身がプロミスでない場合はdoneCallback実行して終了
			this._doneCallbackExecuter();
			return;
		}
		// プロミス配列を作っていない場合のremoveをここで定義(プロトタイプのremoveを上書き)
		this.remove = function(p) {
			if (this._resolved || this._rejected) {
				return;
			}
			if (promise === p) {
				this._doneCallbackExecuter();
			}
		};
		// 長さ1で、それがプロミスなら、そのプロミスにdoneとfailを引っかける
		promise.done(this._doneCallbackExecuter);
		promise.fail(this._failCallbackExecuter);
		return;
	}
	// promisesの中のプロミスオブジェクトの数(プロミスでないものは無視)
	// 引数に渡されたpromisesのうち、プロミスオブジェクトと判定したものを列挙
	var monitoringPromises = [];
	for (var i = 0, l = promises.length; i < l; i++) {
		var p = promises[i];
		if (isPromise(p)) {
			monitoringPromises.push(p);
		}
	}

	var promisesLength = monitoringPromises.length;
	if (promisesLength === 0) {
		// プロミスが一つもなかった場合は即doneCallbackを実行
		this._resolved = true;
		doneCallback && doneCallback();
		return;
	}
	this._promises = monitoringPromises;

	resolveArgs = [];
	this._resolveArgs = [];
	this._resolveCount = 0;
	this._promisesLength = promisesLength;

	// いずれかのpromiseが成功するたびに全て終わったかチェックする関数
	function createCheckFunction(_promise) {
		// いずれかのpromiseが成功するたびに全て終わったかチェックする関数
		return function check(/* var_args */) {
			if (that._rejected) {
				// 既にいずれかがreject済みならなにもしない
				return;
			}
			var arg = h5.u.obj.argsToArray(arguments);
			// 引数無しならundefined、引数が一つならそのまま、引数が2つ以上なら配列を追加
			// ($.when()と同じ)
			var index = $.inArray(_promise, promises);
			resolveArgs[index] = (arg.length < 2 ? arg[0] : arg);

			if (++that._resolveCount === that._promisesLength) {
				// 全てのpromiseが成功したので、doneCallbackを実行
				that._doneCallbackExecuter();
			}
		};
	}

	for (var i = 0; i < promisesLength; i++) {
		var targetPromise = monitoringPromises[i];
		targetPromise.done(createCheckFunction(targetPromise)).fail(this._failCallbackExecuter);
	}
}
WaitingPromiseManager.prototype = $.extend(WaitingPromiseManager.prototype, {
	remove: function(promise) {
		if (this._resolved || this._rejected) {
			return;
		}
		if (promsie === this._promises) {
			this._doneCallback && doneCallback();
			this._resolved = true;
			return;
		}
		var index = $.inArray(promise, this._promises);
		if (index === -1) {
			return;
		}

		// 待機中のpromisesからpromiseを外す
		this._promises.splice(index, 1);
		// 取り除くpromiseについてのresolveArgsを減らす
		this._resolveArgs.splice(index, 1);
		if (isResolved(promise)) {
			// 既にresolve済みなら何もしない
			return;
		}
		// キャッシュしてある待機中プロミスの個数を1減らす
		this._promisesLength--;
		if (that._resolveCount === this._promisesLength) {
			// 現在resolve済みの個数と、1減らした後の待機中プロミス個数が同じならdoneハンドラ実行
			this._doneCallbackExecuter();
		}
	}
});

/**
 * 複数のプロミスが完了するのを待機する
 * <p>
 * whenとは仕様が異なり、新しくdeferredは作らない。
 * </p>
 *
 * @private
 * @param {Promise[]} promises
 * @param {Function} doneCallback doneコールバック
 * @param {Function} failCallback failコールバック
 * @param {Boolean} cfhIfFail 渡されたpromiseのいずれかが失敗した時にcFHを呼ぶかどうか。
 *            cFHを呼ぶときのthisは失敗したpromiseオブジェクト、引数は失敗したpromiseのfailに渡される引数
 * @returns {WaitingPromiseManager}
 */
function waitForPromises(promises, doneCallback, failCallback, cfhIfFail) {
	return new WaitingPromiseManager(promises, doneCallback, failCallback, cfhIfFail);

}

//TODO あるオブジェクト下に名前空間を作ってexposeするようなメソッドを作る
var h5internal = {
	core: {
		controllerInternal: null
	}
};
