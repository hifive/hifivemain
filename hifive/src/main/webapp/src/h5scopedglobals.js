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

//=============================
// Errors
//=============================
/**
 * addEventListener,removeEventListenerに渡された引数が不正
 *
 * @private
 */
var G_ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER = 100;

var G_ERROR_MESSAGES = [];
G_ERROR_MESSAGES[G_ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER] = 'addEventListenerには、イベント名(文字列)、イベントリスナ(関数)を渡す必要があります。';

addFwErrorCodeMap(G_ERROR_MESSAGES);



// ---------------------------
// スキーマのエラーコード
// ---------------------------

/**
 * ID指定されたプロパティが重複している
 *
 * @private
 */
var SCHEMA_ERR_CODE_DUPLICATED_ID = 7;

/**
 * ID指定されたプロパティがない
 *
 * @private
 */
var SCHEMA_ERR_CODE_NO_ID = 8;

/**
 * プロパティ名が不正
 *
 * @private
 */
var SCHEMA_ERR_CODE_INVALID_PROPERTY_NAME = 9;

/**
 * id指定されたプロパティにdependが指定されている
 *
 * @private
 */
var SCHEMA_ERR_CODE_ID_DEPEND = 10;

/**
 * depend.onに指定されたプロパティが存在しない
 *
 * @private
 */
var SCHEMA_ERR_CODE_DEPEND_ON = 11;

/**
 * depend.calcに関数が指定されていない
 *
 * @private
 */
var SCHEMA_ERR_CODE_DEPEND_CALC = 12;

/**
 * typeに文字列が指定されていない
 *
 * @private
 */
var SCHEMA_ERR_CODE_INVALID_TYPE = 13;

/**
 * type文字列が不正
 *
 * @private
 */
var SCHEMA_ERR_CODE_TYPE = 14;

/**
 * typeに指定されたデータモデルが存在しない
 *
 * @private
 */
var SCHEMA_ERR_CODE_TYPE_DATAMODEL = 15;

/**
 * type:enumなのにenumValueが指定されていない
 *
 * @private
 */
var SCHEMA_ERR_CODE_TYPE_ENUM_NO_ENUMVALUE = 16;

/**
 * constraintにオブジェクトが指定されていない
 *
 * @private
 */
var SCHEMA_ERR_CODE_INVALID_CONSTRAINT = 17;

/**
 * constraint.notNullの指定が不正
 *
 * @private
 */
var SCHEMA_ERR_CODE_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY = 18;

/**
 * min-maxに数値が入力されなかった時のエラー
 *
 * @private
 */
var SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MIN_MAX = 20;

/**
 * typeがinteger,numberじゃないのにconstraint.min/max を指定されたときのエラー
 *
 * @private
 */
var SCHEMA_ERR_CODE_TYPE_CONSTRAINT = 21;

/**
 * constraint.patternが正規表現じゃない
 *
 * @private
 */
var SCHEMA_ERR_CODE_INVALID_CONSTRAINT_PATTERN = 22;

/**
 * minLength/maxLengthに0以上の整数値以外の値が渡された
 *
 * @private
 */
var SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MINLENGTH_MAXLENGTH = 23;

/**
 * constraintの指定に矛盾がある場合(mix > maxなど)
 *
 * @private
 */
var SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT = 24;

/**
 * typeがenumでないのにenumValueが指定されている
 *
 * @private
 */
var SCHEMA_ERR_CODE_ENUMVALUE_TYPE = 25;

/**
 * enumValueが配列でない、または空配列
 *
 * @private
 */
var SCHEMA_ERR_CODE_INVALID_ENUMVALUE = 26;

/**
 * id項目にdefaultValueが設定されている
 *
 * @private
 */
var SCHEMA_ERR_CODE_DEFAULTVALUE_ID = 27;

/**
 * defaultValueに設定された値がtype,constraintに指定された条件を満たしていない
 *
 * @private
 */
var SCHEMA_ERR_CODE_INVALIDATE_DEFAULTVALUE = 28;

/**
 * ID項目のconstraintに不正な指定がある
 *
 * @private
 */
var SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT_ID = 29;

/**
 * defaultValue指定されたプロパティにdependが指定されている
 *
 * @private
 */
var SCHEMA_ERR_CODE_DEFAULTVALUE_DEPEND = 30;

/**
 * dependの依存関係が循環している
 *
 * @private
 */
var SCHEMA_ERR_CODE_DEPEND_CIRCULAR_REF = 31;

/**
 * スキーマのエラーメッセージ
 *
 * @private
 */
var DESCRIPTOR_VALIDATION_ERROR_MSGS = [];
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_DUPLICATED_ID] = 'ID指定されているプロパティが複数あります。ID指定は1つのプロパティのみに指定してください。';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_NO_ID] = 'ID指定されているプロパティがありません。ID指定は必須です。';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_INVALID_PROPERTY_NAME] = '{0}をプロパティ名に指定できません。半角英数字,_,$ で構成される文字列で、先頭は数字以外である必要があります。';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_ID_DEPEND] = '"{0}"プロパティの定義にエラーがあります。id指定されたプロパティにdependを指定することはできません。';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_DEPEND_ON] = '"{0}"プロパティプロパティの定義にエラーがあります。depend.onに指定されたプロパティが存在しません。';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_DEPEND_CALC] = '"{0}"プロパティプロパティの定義にエラーがあります。depend.calcには関数を指定する必要があります';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_INVALID_TYPE] = '"{0}"プロパティプロパティの定義にエラーがあります。typeは文字列で指定して下さい。';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_TYPE] = 'プロパティの定義にエラーがあります。typeに指定された文字列が不正です "{1}"';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_TYPE_DATAMODEL] = '"{0}"プロパティの定義にエラーがあります。 typeに指定されたデータモデル"{1}"は存在しません';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_TYPE_ENUM_NO_ENUMVALUE] = '"{0}"プロパティの定義にエラーがあります。 タイプにenumを指定する場合はenumValueも指定する必要があります';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_INVALID_CONSTRAINT] = '"{0}"プロパティの定義にエラーがあります。 constraintはオブジェクトで指定してください';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1} の指定が不正です。trueまたはfalseで指定してください。';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MIN_MAX] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1} は、数値で指定してください。typeにintegerを指定している場合は整数値で指定する必要があります';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_TYPE_CONSTRAINT] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1} は、type:{2}の項目に対して指定することはできません。';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_INVALID_CONSTRAINT_PATTERN] = '"{0}"プロパティ constraint.{1}は正規表現オブジェクトで指定してください。';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MINLENGTH_MAXLENGTH] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1}には正の整数を指定してください';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT] = '"{0}"プロパティの定義にエラーがあります。 constraintに矛盾する指定があります。{1},{2}';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_ENUMVALUE_TYPE] = '"{0}"プロパティの定義にエラーがあります。 enumValueはtypeに"enum"またはその配列が指定されている場合のみ指定可能です';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_INVALID_ENUMVALUE] = '"{0}"プロパティの定義にエラーがあります。 enumValueは長さ1以上の配列を指定してください';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_DEFAULTVALUE_ID] = '"{0}"プロパティの定義にエラーがあります。id指定した項目にdefaultValueを設定することはできません';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_INVALIDATE_DEFAULTVALUE] = '"{0}"プロパティのdefaultValueに設定された値"{1}"は、typeまたはconstraintに定義された条件を満たしていません';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT_ID] = '"{0}"プロパティの定義にエラーがあります。id指定された項目にconstraint.{1}:{2}を指定することはできません';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_DEFAULTVALUE_DEPEND] = '"{0}"プロパティの定義にエラーがあります。dependが指定された項目にdefaultValueを指定することはできません。';
DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_CODE_DEPEND_CIRCULAR_REF] = '"{0}"プロパティの定義にエラーがあります。depend.onに指定されたプロパティの依存関係が循環しています';

/**
 * validateDescriptor, validateDescriptor/Schema/DefaultValueが返すエラー情報の配列に格納するエラーオブジェクトを作成する
 *
 * @private
 * @param {Integer} code エラーコード
 * @param {Array} msgParam メッセージパラメータ
 * @param {Boolean} stopOnError
 * @returns {Object} エラーオブジェクト
 */
function createErrorReason(/* var args */) {
	var args = arguments;
	var code = args[0];
	args[0] = DESCRIPTOR_VALIDATION_ERROR_MSGS[code];
	var msg = h5.u.str.format.apply(null, args);
	return {
		code: code,
		message: msg
	};
}


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
 * イベントディスパッチャ
 * <p>
 * イベントリスナを管理するクラスです。このクラスはnewできません。
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
 * @since 1.1.0
 * @class
 * @name EventDispatcher
 */
function EventDispatcher() {}

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
EventDispatcher.prototype.hasEventListener = function(type, listener) {
	if (!this.__listeners) {
		return false;
	}
	var l = this.__listeners[type];
	if (!l || !this.__listeners.hasOwnProperty(type)) {
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
 * イベントリスナを登録します。
 * <p>
 * 第一引数にイベント名、第二引数にイベントリスナを渡し、イベントリスナを登録します。指定したイベントが起こった時にイベントリスナが実行されます。
 * </p>
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
 * @param {Function} listener イベントリスナ
 */
EventDispatcher.prototype.addEventListener = function(type, listener) {
	// 引数チェック
	if (arguments.length !== 2 || !isString(type) || !$.isFunction(listener)) {
		throwFwError(G_ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER);
	}
	if (this.hasEventListener(type, listener)) {
		return;
	}

	if (!this.__listeners) {
		this.__listeners = {};
	}

	if (!(this.__listeners.hasOwnProperty(type))) {
		this.__listeners[type] = [];
	}

	this.__listeners[type].push(listener);
};

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

	var isDefaultPrevented = false;

	event.preventDefault = function() {
		isDefaultPrevented = true;
	};

	for ( var i = 0, count = l.length; i < count; i++) {
		l[i].call(event.target, event);
	}

	return isDefaultPrevented;
};


//========================================================
//
// バリデーション関係コードここから
//
//========================================================

/**
 * schemaオブジェクトのtype指定の文字列を、パースした結果を返す
 *
 * @private
 * @param {String} type
 * @returns elmType:タイプから配列部分を除いた文字列。dataModel:データモデル名。dimention:配列の深さ(配列指定でない場合は0)
 */
function getTypeObjFromString(type) {
	// マッチ結果から、データモデル指定の場合と配列の場合をチェックする
	// "string[][][]"のとき、matched = ["string[][][]", "string", undefined, "[][][]", "[]"]
	// "@DataModel"のとき、matched = ["@DataModel", "@DataModel", "DataModel", "", undefined]
	var matched = type.match(/^(string|number|integer|boolean|any|enum|@(.+?))((\[\]){0,1})$/);
	return matched && {
		elmType: matched[1],
		dataModel: matched[2],
		dimention: matched[3] ? 1 : 0
	};
}

/**
 * dependの循環参照をチェックする関数 循環参照するならtrueを返す
 *
 * @private
 * @param {String} prop map[prop]から辿って行って調べる。
 * @param {Object} map 依存関係をマップしたオブジェクト。{prop1: ['prop2','prop3'], prop2: ['prop3']}
 *            のような構造で依存関係を表したオブジェクト
 * @returns {Boolean} 循環参照しているかどうか
 */
function checkDependCircularRef(prop, map) {
	return (function checkCircular(p, ancestors) {
		if (!map[p]) {
			return false;
		}
		for ( var i = 0, l = map[p].length; i < l; i++) {
			if ($.inArray(map[p][i], ancestors) > -1
					|| checkCircular(map[p][i], ancestors.concat([p]))) {
				return true;
			}
		}
		return false;
	})(prop, []);
}

/**
 * 引数がNaNかどうか判定する。isNaNとは違い、例えば文字列はNaNではないのでfalseとする
 *
 * @private
 * @param {Any} val 判定する値
 * @returns {Boolean} 引数がNaNかどうか
 */
function isStrictNaN(val) {
	return typeof val === 'number' && isNaN(val);
}

/**
 * type:'number' 指定のプロパティに代入できるかのチェック null,undefined,NaN,parseFloatしてNaNにならないもの に当てはまる引数についてtrueを返す
 *
 * @private
 * @param {Any} val 判定する値
 * @param {Boolean} isStrict 厳密に判定するかどうか。isStrict === trueなら型変換可能でも型が違えばfalseを返す
 * @returns {Boolean} type:'number'指定のプロパティに代入可能か
 */
function isNumberValue(val, isStrict) {
	// nullまたはundefinedはtrue
	// NaNを直接入れた場合はtrue
	// new Number() で生成したオブジェクトはtrue
	// 文字列の場合は、[±(数字)(.数字)]で構成されている文字列ならOKにする
	// ※ parseFloatよりも厳しいチェックにしている。
	// "1.2", "+1.2", "1", ".2", "-.2" はOK。
	// "12.3px"、"12.3.4"、"123.", [12.3, 4] はいずれもparseFloatできるが、ここではNG。
	return val == null
			|| isStrictNaN(val)
			|| typeof val === 'number'
			|| (!isStrict && (val instanceof Number || !!((isString(val) || val instanceof String) && !!val
					.match(/^[+\-]{0,1}[0-9]*\.{0,1}[0-9]+$/))));
}

/**
 * type:'integer' 指定のプロパティに代入できるかのチェック null,undefined,parseFloatとparsFloatの結果が同じもの(NaNは除く)
 * に当てはまる引数についてtrueを返す
 *
 * @private
 * @param {Any} val 判定する値
 * @param {Boolean} isStrict 厳密に判定するかどうか。isStrict === trueなら型変換可能でも型が違えばfalseを返す
 * @returns {Boolean} type:'integer'指定のプロパティに代入可能か
 */
function isIntegerValue(val, isStrict) {
	// parseIntとparseFloatの結果が同じかどうかで整数値かどうかの判定をする
	// typeofが'nubmer'または、new Number()で生成したオブジェクトで、parseFloatとparseIntの結果が同じならtrue
	// NaN, Infinity, -Infinityはfalseを返す(parseInt(Infinity)はNaNであるので、InfinityはIntじゃない扱いにする
	// 文字列の場合は、[±数字]で構成されている文字列ならOKにする
	// ※ parseIntよりも厳しいチェックにしている。"12px"、"12.3"、[12,3] はいずれもparseIntできるが、ここではNG。
	return val == null
			|| (typeof val === 'number' && parseInt(val) === val)
			|| (!isStrict && (val instanceof Number && parseInt(val) === parseFloat(val) || (typeof val === 'string' || val instanceof String)
					&& !!val.match(/^[+\-]{0,1}[0-9]+$/)));
}

/**
 * ラッパークラスをunboxする 配列が渡されたら、配列の中身をunboxする
 *
 * @private
 * @param v {Any}
 * @returns unboxしたもの
 */
function unbox(v) {
	if ($.isArray(v)) {
		var ary = v.slice(0);
		for ( var i = 0, l = ary.length; i < l; i++) {
			// aryalueOfメソッドのあるオブジェクトならその値を入れる
			ary[i] = ary[i] && typeof ary[i] === 'object' ? ary[i] && ary[i].valueOf
					&& ary[i].valueOf() : ary[i];
		}
		return ary;
	}
	return v && typeof v === 'object' && v.valueOf ? v.valueOf() : v;
}


/**
 * type:'string' 指定のプロパティに代入できるかのチェック
 *
 * @private
 * @param {Any} val 判定する値
 * @param {Boolean} isStrict 厳密に判定するかどうか。isStrict === trueなら型変換可能でも型が違えばfalseを返す
 * @returns {Boolean} type:'string'指定のプロパティに代入可能か
 */
function isStringValue(val, isStrict) {
	return !!(val == null || isString(val) || (!isStrict && val instanceof String));
}

/**
 * type:'boolean' 指定のプロパティに代入できるかのチェック
 *
 * @private
 * @param {Any} val 判定する値
 * @param {Boolean} isStrict 厳密に判定するかどうか。isStrict === trueなら型変換可能でも型が違えばfalseを返す
 * @returns {Boolean} type:'boolean'指定のプロパティに代入可能か
 */
function isBooleanValue(val, isStrict) {
	return val == null || typeof val === 'boolean' || (!isStrict && val instanceof Boolean);
}

/**
 * type:'enum' 指定のプロパティに代入できるかのチェック
 *
 * @private
 * @param {Any} val 判定する値
 * @param {Array} enumValue 列挙されている値の配列
 * @returns {Boolean} type:'enum'指定のプロパティに代入可能か
 */
function isEnumValue(v, enumValue) {
	if (isStrictNaN(v)) {
		// NaN の時は、NaN===NaNにならない(inArrayでも判定できない)ので、enumValueの中身を見て判定する
		for ( var i = 0, l = enumValue.length; i < l; i++) {
			if (isStrictNaN(enumValue[i])) {
				return true;
			}
		}
		return false;
	}
	return v === null || $.inArray(v, enumValue) > -1;
}

/**
 * schemaが正しいかどうか判定する。 h5.core.data及びh5.uで使用するため、ここに記述している。
 *
 * @private
 * @param {Object} schema schemaオブジェクト
 * @param {Object} manager DataManagerオブジェクト
 * @param {Boolean} stopOnError エラーが発生した時に、即座にreturnするかどうか。(trueなら即座にreturn)
 * @param {Boolean} isObsItemSchema ObservableItemの作成に指定したスキーマかどうか。trueならidのチェックをせず、データモデル依存は指定不可。
 * @returns {Array} エラー理由を格納した配列。エラーのない場合は空配列を返す。
 */
function validateSchema(schema, manager, stopOnError, isObsItemSchema) {
	//TODO stopOnErrorが常にtrueで呼ばれるような実装にするなら、try-catchで囲ってエラー時にエラー投げて、catch節でthrowFwErrorするような実装にする
	var errorReason = [];

	if (!isObsItemSchema) {
		// id指定されている属性が一つだけであることをチェック
		var hasId = false;
		for ( var p in schema) {
			if (schema[p] && schema[p].id === true) {
				if (hasId) {
					errorReason.push(createErrorReason(SCHEMA_ERR_CODE_DUPLICATED_ID));
					if (stopOnError) {
						return errorReason;
					}
				}
				hasId = true;
			}
		}
		if (!hasId) {
			errorReason.push(createErrorReason(SCHEMA_ERR_CODE_NO_ID));
			if (stopOnError) {
				return errorReason;
			}
		}
	}

	// 循環参照チェックのため、depend指定されているプロパティが出てきたら覚えておく
	// key: プロパティ名, value: そのプロパティのdepend.onをwrapInArrayしたもの
	var dependencyMap = {};

	// schemaのチェック
	for ( var schemaProp in schema) {
		// null(またはundefined)がプロパティオブジェクトに指定されていたら、空オブジェクトと同等に扱い、エラーにしない。
		var propObj = schema[schemaProp] == null ? {} : schema[schemaProp];
		var isId = !!propObj.id;

		// プロパティ名が適切なものかどうかチェック
		if (!isValidNamespaceIdentifier(schemaProp)) {
			errorReason.push(createErrorReason(SCHEMA_ERR_CODE_INVALID_PROPERTY_NAME, schemaProp));
			if (stopOnError) {
				return errorReason;
			}
		}

		// -- dependのチェック --
		// defaultValueが指定されていたらエラー
		// onに指定されているプロパティがschema内に存在すること
		var depend = propObj.depend;
		if (depend != null) {
			// id指定されているならエラー
			if (isId) {
				errorReason.push(createErrorReason(SCHEMA_ERR_CODE_ID_DEPEND, schemaProp));
				if (stopOnError) {
					return errorReason;
				}
			}

			// defaultValueが指定されているならエラー
			if (propObj.hasOwnProperty('defaultValue')) {
				errorReason
						.push(createErrorReason(SCHEMA_ERR_CODE_DEFAULTVALUE_DEPEND, schemaProp));
				if (stopOnError) {
					return errorReason;
				}
			}

			// dependが指定されているなら、onが指定されていること
			if (depend.on == null) {
				errorReason.push(createErrorReason(SCHEMA_ERR_CODE_DEPEND_ON, schemaProp));
				if (stopOnError) {
					return errorReason;
				}
			} else {
				var onArray = wrapInArray(depend.on);
				for ( var i = 0, l = onArray.length; i < l; i++) {
					if (!schema.hasOwnProperty(onArray[i])) {
						errorReason.push(createErrorReason(SCHEMA_ERR_CODE_DEPEND_ON, schemaProp));
						if (stopOnError) {
							return errorReason;
						}
						break;
					}
				}
			}

			// dependが指定されているなら、calcが指定されていること
			if (typeof depend.calc !== 'function') {
				errorReason.push(createErrorReason(SCHEMA_ERR_CODE_DEPEND_CALC, schemaProp));
				if (stopOnError) {
					return errorReason;
				}
			}

			// 後の循環参照チェックのため、depend.onを覚えておく
			dependencyMap[schemaProp] = wrapInArray(depend.on);
		}

		// -- typeのチェック --
		// typeに指定されている文字列は正しいか
		// defaultValueとの矛盾はないか
		// constraintにそのtypeで使えない指定がないか
		// enumの時は、enumValueが指定されているか
		var elmType = null;
		var type = propObj.type;
		if (isId && type == null) {
			// id項目で、typeが指定されていない場合は、type:stringにする
			type = 'string';
		}
		var typeObj = {};
		if (type != null) {
			if (!isString(type)) {
				errorReason.push(createErrorReason(SCHEMA_ERR_CODE_INVALID_TYPE, schemaProp));
				if (stopOnError) {
					return errorReason;
				}
			}

			if (isId && type !== 'string' && type !== 'integer') {
				// id指定されているプロパティで、string,integer以外だった場合はエラー
				errorReason.push('id指定されたプロパティにtypeを指定することはできません');
			}

			// "string", "number[]", "@DataModel"... などの文字列をパースしてオブジェクトを生成する
			typeObj = getTypeObjFromString(type);

			if (!typeObj || !typeObj.elmType) {
				// パースできない文字列が指定されていたらエラー
				errorReason.push(createErrorReason(SCHEMA_ERR_CODE_TYPE, schemaProp, type));
				if (stopOnError) {
					return errorReason;
				}
			} else {
				// データモデルの場合
				if (typeObj.dataModel) {
					if (isObsItemSchema) {
						// ObservableItemのスキーマにはデータモデルを指定できないのでエラー
						errorReason.push(createErrorReason(SCHEMA_ERR_CODE_TYPE, schemaProp,
								typeObj.dataModel));
						if (stopOnError) {
							return errorReason;
						}
					}
					if (!manager.models[typeObj.dataModel]) {
						errorReason.push(createErrorReason(SCHEMA_ERR_CODE_TYPE_DATAMODEL,
								schemaProp, typeObj.dataModel));
						if (stopOnError) {
							return errorReason;
						}
					}
				}

				// enumの場合
				if (typeObj.elmType === 'enum') {
					// enumValueが無ければエラー
					if (propObj.enumValue == null) {
						errorReason.push(createErrorReason(SCHEMA_ERR_CODE_TYPE_ENUM_NO_ENUMVALUE,
								schemaProp));
						if (stopOnError) {
							return errorReason;
						}
					}
				}
			}
		}

		// constraintのチェック
		// プロパティのチェック
		// 値のチェック
		// タイプと矛盾していないかのチェック
		var constraintObj = propObj.constraint;
		if (constraintObj != null) {
			if (!$.isPlainObject(constraintObj)) {
				// constraintがオブジェクトではない場合
				errorReason.push(createErrorReason(SCHEMA_ERR_CODE_INVALID_CONSTRAINT, schemaProp));
				if (stopOnError) {
					return errorReason;
				}
			} else {
				for ( var p in constraintObj) {
					// constraintのプロパティの値とtype指定との整合チェック
					var val = constraintObj[p];
					if (val == null) {
						continue;
					}
					switch (p) {
					case 'notNull':
						if (val !== true && val !== false) {
							// notNullにtrueまたはfalse以外が指定されていたらエラー
							errorReason.push(createErrorReason(
									SCHEMA_ERR_CODE_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY,
									schemaProp, p));
							if (stopOnError) {
								return errorReason;
							}
						} else if (isId && !val) {
							// id項目にnotNull:falseが指定されていたらエラー
							errorReason.push(createErrorReason(
									SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT_ID, schemaProp, p, val));
							if (stopOnError) {
								return errorReason;
							}
						}
						break;
					case 'min':
					case 'max':
						switch (typeObj.elmType) {
						case 'integer':
							if (isString(val) || !isIntegerValue(val) || isStrictNaN(val)) {
								// 整数値以外、NaNが指定されていたらエラー
								errorReason.push(createErrorReason(
										SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MIN_MAX, schemaProp, p));
								if (stopOnError) {
									return errorReason;
								}
							}
							break;
						case 'number':
							if (isString(val) || isString(val) || !isNumberValue(val)
									|| val === Infinity || val === -Infinity || isStrictNaN(val)) {
								// 整数値以外、NaNが指定されていたらエラー
								errorReason.push(createErrorReason(
										SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MIN_MAX, schemaProp, p));
								if (stopOnError) {
									return errorReason;
								}
							}
							break;
						default:
							// typeの指定とconstraintに不整合があったらエラー
							errorReason.push(createErrorReason(SCHEMA_ERR_CODE_TYPE_CONSTRAINT,
									schemaProp, p, typeObj.elmType));
							if (stopOnError) {
								return errorReason;
							}
						}
						break;
					case 'minLength':
					case 'maxLength':
						switch (typeObj.elmType) {
						case 'string':
							if (isString(val) || !isIntegerValue(val) || isStrictNaN(val)
									|| val < 0) {
								// typeの指定とconstraintに不整合があったらエラー
								errorReason.push(createErrorReason(
										SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MINLENGTH_MAXLENGTH,
										schemaProp, p));
								if (stopOnError) {
									return errorReason;
								}
							} else if (isId && p === 'maxLength' && val === 0) {
								// id項目にmaxLength: 0 が指定されていたらエラー
								errorReason
										.push(createErrorReason(
												SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT_ID, schemaProp,
												p, val));
								if (stopOnError) {
									return errorReason;
								}
							}
							break;
						default:
							// type:'string'以外の項目にmaxLength,minLengthが指定されていればエラー
							errorReason.push(createErrorReason(SCHEMA_ERR_CODE_TYPE_CONSTRAINT,
									schemaProp, p, typeObj.elmType));
							if (stopOnError) {
								return errorReason;
							}
						}
						break;
					case 'notEmpty':
						switch (typeObj.elmType) {
						case 'string':
							if (val !== true && val !== false) {
								// notEmptyにtrue,false以外の指定がされていたらエラー
								errorReason.push(createErrorReason(
										SCHEMA_ERR_CODE_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY,
										schemaProp, p));
								if (stopOnError) {
									return errorReason;
								}
							} else if (isId && !val) {
								// id項目にnotEmpty: false が指定されていたらエラー
								errorReason
										.push(createErrorReason(
												SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT_ID, schemaProp,
												p, val));
								if (stopOnError) {
									return errorReason;
								}
							}
							break;
						default:
							// type:'string'以外の項目にnotEmptyが指定されていたらエラー
							errorReason.push(createErrorReason(SCHEMA_ERR_CODE_TYPE_CONSTRAINT,
									schemaProp, p, typeObj.elmType));
							if (stopOnError) {
								return errorReason;
							}
						}
						break;
					case 'pattern':
						switch (typeObj.elmType) {
						case 'string':
							if ($.type(val) !== 'regexp') {
								// patternにRegExpオブジェクト以外のものが指定されていたらエラー
								errorReason.push(createErrorReason(
										SCHEMA_ERR_CODE_INVALID_CONSTRAINT_PATTERN, schemaProp, p));
								if (stopOnError) {
									return errorReason;
								}
							}
							break;
						default:
							// type:'string'以外の項目にpatterが指定されていたらエラー
							errorReason.push(createErrorReason(SCHEMA_ERR_CODE_TYPE_CONSTRAINT,
									schemaProp, p, typeObj.elmType));
							if (stopOnError) {
								return errorReason;
							}
						}
						break;
					}
				}

				// constraintの中身に矛盾がないかどうかチェック
				if (constraintObj.notEmpty && constraintObj.maxLength === 0) {
					// notNullなのにmanLengthが0
					errorReason.push(createErrorReason(SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT,
							schemaProp, 'notEmpty', 'maxLength'));
					if (stopOnError) {
						return errorReason;
					}
				}
				if (constraintObj.min != null && constraintObj.max != null
						&& constraintObj.min > constraintObj.max) {
					// min > max
					errorReason.push(createErrorReason(SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT,
							schemaProp, 'min', 'max'));
					if (stopOnError) {
						return errorReason;
					}
				}
				if (constraintObj.minLength != null && constraintObj.maxLength != null
						&& constraintObj.minLength > constraintObj.maxLength) {
					// minLength > maxLength
					errorReason.push(createErrorReason(SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT,
							schemaProp, 'minLength', 'maxLength'));
					if (stopOnError) {
						return errorReason;
					}
				}
			}
		}

		// enumValueのチェック
		var enumValue = propObj.enumValue;
		if (enumValue != null) {
			if (typeObj.elmType !== 'enum') {
				// type指定がenumでないならエラー
				errorReason.push(createErrorReason(SCHEMA_ERR_CODE_ENUMVALUE_TYPE, schemaProp));
				if (stopOnError) {
					return errorReason;
				}
			}
			if (!$.isArray(enumValue) || enumValue.length === 0 || $.inArray(null, enumValue) > -1
					|| $.inArray(undefined, enumValue) > -1) {
				// 配列でない、または空配列、null,undefinedを含む配列ならエラー
				errorReason.push(createErrorReason(SCHEMA_ERR_CODE_INVALID_ENUMVALUE, schemaProp));
				if (stopOnError) {
					return errorReason;
				}
			}
		}

		// defaultValueのチェック
		// defaultValueがtypeやconstraintの条件を満たしているかのチェックはここでは行わない
		// id:trueの項目にdefaultValueが指定されていればここでエラーにする
		// depend指定されている項目にdefaultValueが指定されている場合はエラー(dependのチェック時にエラーにしている)
		if (isId && propObj.hasOwnProperty('defaultValue')) {
			// id項目にdefaultValueが設定されていたらエラー
			errorReason.push(createErrorReason(SCHEMA_ERR_CODE_DEFAULTVALUE_ID, schemaProp));
			if (stopOnError) {
				return errorReason;
			}
		}
	}

	// depend.onの循環参照チェック
	// onに指定されているプロパティの定義が正しいかどうかのチェックが終わっているここでチェックする
	// （循環参照チェック以前の、プロパティがあるのか、dependがあるならonがあるか、などのチェックをしなくて済むようにするため）
	// （これ以前のチェックに引っかかっていたら、循環参照のチェックはしない）
	for ( var prop in dependencyMap) {
		if (checkDependCircularRef(prop, dependencyMap)) {
			errorReason.push(createErrorReason(SCHEMA_ERR_CODE_DEPEND_CIRCULAR_REF, p));
			if (stopOnError) {
				return errorReason;
			}
		}
	}
	return errorReason;
}

/**
 * checkFuncsの条件をdefaultValueが満たすかどうかチェックする
 *
 * @private
 * @param {Object} descriptor descriptor
 * @param {Object} checkFuncs 各プロパティをキーに、チェックする関数を持つオブジェクト
 * @param {Boolean} stopOnError defaultValueがチェック関数を満たさない時に、エラーを投げてチェックを中断するかどうか
 * @returns {Array} エラー情報を格納した配列。エラーのない場合は中身のない配列を返す
 */
function validateDefaultValue(schema, checkFuncs, stopOnError) {
	var errorReason = [];
	for ( var p in schema) {
		var propObj = schema[p];
		if (!propObj || !propObj.hasOwnProperty('defaultValue') && propObj.type
				&& (propObj.type === 'array' || getTypeObjFromString(propObj.type).dimention)) {
			// defaultValueが指定されていないかつ、type指定が配列指定であれば、
			// 初期値は空のOvservableArrayになる。
			// 空のOvservableArrayがチェックに引っかかることはないので、チェック関数でチェックしない。
			continue;
		}

		// defaultValueが指定されていない場合は、ここではチェックしない
		if (!propObj.hasOwnProperty('defaultValue')) {
			continue;
		}
		var defaultValue = propObj.defaultValue;
		if (checkFuncs[p](defaultValue).length) {
			errorReason.push(createErrorReason(SCHEMA_ERR_CODE_INVALIDATE_DEFAULTVALUE, p,
					defaultValue));
			if (stopOnError) {
				return errorReason;
			}
		}
	}
	return errorReason;
}

/**
 * スキーマのプロパティオブジェクトから、そのプロパティに入る値かどうかをチェックする関数を作る。 # schema:{val:xxxx,val2:....}
 * のxxxxの部分と、マネージャを引数にとる スキーマのチェックが通ってから呼ばれる前提なので、エラーチェックは行わない。
 *
 * @private
 * @param {object} propertyObject スキーマのプロパティオブジェクト
 * @param {object} [manager] そのスキーマを持つモデルが属するマネージャのインスタンス。データモデルのチェックに必要(要らないなら省略可能)
 * @returns {function} 指定されたスキーマのプロパティに、引数の値が入るかどうかをチェックする関数
 */
function createCheckValueBySchemaPropertyObj(propertyObject, manager) {
	// schema{prop:null} のように指定されている場合はpropObjはnullなので、空オブジェクト指定と同等に扱うようにする
	var propObj = propertyObject || {};
	var checkFuncArray = [];
	var elmType = null;
	var dimention = 0;
	var type = propObj.type;
	var constraint = propObj.constraint;

	// id:true の場合 type指定がない場合はtype:string,
	// notNull(type:stringならnotEmpty)をtrueにする
	if (propObj.id) {
		type = type || 'string';
		constraint = constraint || {};
		constraint.notNull = true;
		if (type === 'string') {
			constraint.notEmpty = true;
		}
	}
	if (type) {
		// typeに指定された文字列をパースしてオブジェクトに変換
		var typeObj = getTypeObjFromString(type);


		elmType = typeObj.elmType;
		// 配列の次元(0か1のみ)。配列でないなら0
		dimention = typeObj.dimention;

		// type指定を元に値を(配列は考慮せずに)チェックする関数を作成してcheckFuncArrayに追加
		checkFuncArray.push(createTypeCheckFunction(elmType, {
			manager: manager,
			enumValue: propObj.enumValue
		}));
	}
	// constraintを値が満たすかどうかチェックする関数を作成してcheckFuncArrayに追加
	if (propObj.constraint) {
		checkFuncArray.push(createConstraintCheckFunction(propObj.constraint));
	}
	return createCheckValueByCheckObj({
		checkFuncs: checkFuncArray,
		dimention: dimention
	});
}

/**
 * descriptorからschemaの各プロパティの値をチェックする関数を作成して返す
 *
 * @private
 * @param {Object} descriptor descriptor
 * @param {Object} manager データモデルマネージャ
 */
function createCheckValueByDescriptor(schema, manager) {
	var checkFuncs = {};
	for ( var p in schema) {
		checkFuncs[p] = createCheckValueBySchemaPropertyObj(schema[p], manager);
	}
	return checkFuncs;
}

/**
 * constraintオブジェクトから、値がそのconstraintの条件を満たすかどうか判定する関数を作成する
 *
 * @private
 * @param {object} constraint constraintオブジェクト
 * @returns {function} 値がconstraintを満たすかどうかチェックする関数。正しい場合は空配列、そうじゃない場合は引っかかった項目を返す
 */
function createConstraintCheckFunction(constraint) {
	return function(v) {
		var errObjs = [];
		if (constraint.notNull && v == null) {
			errObjs.push({
				notNull: constraint.notNull
			});
		}
		if (constraint.notEmpty && !v) {
			errObjs.push({
				notEmpty: constraint.notEmpty
			});
		}
		if (v == null) {
			// notNull,notEmptyのチェック以外は、nullでないものについてチェックを行うので、nullならtrueを返す
			return errObjs;
		}
		if (constraint.min != null && v < constraint.min) {
			errObjs.push({
				min: constraint.min
			});
		}
		if (constraint.max != null && constraint.max < v) {
			errObjs.push({
				max: constraint.max
			});
		}
		if (constraint.minLength != null && v.length < constraint.minLength) {
			errObjs.push({
				minLength: constraint.minLength
			});
		}
		if (constraint.maxLength != null && constraint.maxLength < v.length) {
			errObjs.push({
				maxLength: constraint.maxLength
			});
		}
		if (constraint.pattern != null && !v.match(constraint.pattern)) {
			errObjs.push({
				pattern: constraint.pattern
			});
		}
		return errObjs;
	};
}

/**
 * type指定された文字列(から"[]"を除いた文字列)、引数がそのtypeを満たすかどうか判定する関数を作成する
 *
 * @private
 * @param {string} elmType type指定文字列
 * @param {object} [opt] type判定に使用するためのオプション
 * @param {object} [opt.manager] DataManagerオブジェクト。"@DataModel"のようにデータモデルを指定された場合、managerからデータモデルを探す
 * @param {array} [opt.enumValue] typeが"enum"の場合、enumValueに入っているかどうかで判定する
 * @returns {function} 引数がそのtypeを満たすかどうか判定する関数。満たすなら空配列、満たさないならエラーオブジェクトの入った配列を返す。
 */
function createTypeCheckFunction(elmType, opt) {
	var errObjs = [{
		type: elmType
	}];
	switch (elmType) {
	case 'number':
		return function(v, isStrict) {
			if (isNumberValue(v, isStrict)) {
				return [];
			}
			return errObjs;
		};
	case 'integer':
		return function(v, isStrict) {
			if (isIntegerValue(v, isStrict)) {
				return [];
			}
			return errObjs;
		};
	case 'string':
		return function(v, isStrict) {
			if (isStringValue(v, isStrict)) {
				return [];
			}
			return errObjs;
		};
	case 'boolean':
		return function(v, isStrict) {
			if (isBooleanValue(v, isStrict)) {
				return [];
			}
			return errObjs;
		};
	case 'enum':
		return function(v) {
			if (isEnumValue(v, opt.enumValue)) {
				return [];
			}
			return errObjs;
		};
	case 'any':
		// anyならタイプチェックは行わない
		return function() {
			return [];
		};
	}
	// タイプチェックは終わっているはずなので、どのケースにも引っかからない場合はデータモデルかつ、そのデータモデルはマネージャに存在する
	var matched = elmType.match(/^@(.+?)$/);
	var dataModelName = matched[1];
	var manager = opt.manager;
	return function(v) {
		var dataModel = manager.models[dataModelName];
		if (!dataModel) {
			// チェック時点でモデルがマネージャからドロップされている場合はfalse
			return errObjs;
		}
		if (typeof v !== 'object' && v != null) {
			// オブジェクト(またはnull,undefined)でないならfalse
			return errObjs;
		}
		// チェック時にそのモデルが持ってるアイテムかどうかで判定する
		// nullはOK
		if (v == null || dataModel.has(v)) {
			return [];
		}
		return errObjs;
	};
}

/**
 * チェック関数と、配列の次元を持つオブジェクトを引数にとり、値のチェックを行う関数を作成して返す
 *
 * @private
 * @param {object} checkObj
 * @param {array} [checkObj.checkFuncs] チェックする関数の配列。配列の先頭の関数から順番にチェックする。指定のない場合は、return
 *            true;するだけの関数を作成して返す
 * @param {integer} [checkObj.dimention]
 *            チェックする値の配列の次元。配列のdimention次元目が全てcheckFuncsを満たすことと、dimention-1次元目まではすべて配列であることを確認する関数を作成して返す。
 *            0、または指定無しの場合は配列でないことを表す
 * @returns {Function} 値をチェックする関数を返す。戻り値の関数はエラー理由を返す。length;0ならエラーでない。
 */
function createCheckValueByCheckObj(checkObj) {
	var funcs = checkObj.checkFuncs;
	if (!funcs || funcs.length === 0) {
		return function() {
			return [];
		};
	}
	var dim = checkObj.dimention || 0;
	/**
	 * 値のチェックを行う関数
	 *
	 * @param {Any} val 値
	 * @param {Boolean} isStrict 型変換可能ならOKにするかどうか
	 */
	return function checkValue(val, isStrict) {
		var errorReason = [];
		function _checkValue(v, d) {
			if (!d) {
				// チェック関数を順番に適用して、falseが返ってきたらチェック終了してfalseを返す
				for ( var i = 0, l = funcs.length; i < l; i++) {
					var result = funcs[i](v, isStrict);
					if (result.length) {
						errorReason = errorReason.concat(result);
						return false;
					}
				}
				return true;
			}
			// 配列指定なのにセットする値が配列でない場合はfalseを返す
			// ただしnullなら空配列同等の扱いをするので、チェックで弾かない
			if (v == null) {
				return true;
			}
			if (!$.isArray(v) && !h5.u.obj.isObservableArray(v)) {
				errorReason.push({
					dimention: dim
				});
				return false;
			}
			for ( var i = 0, l = v.length; i < l; i++) {
				// 配列の各要素について、次元を一つ減らして再帰的にチェックする
				if (!_checkValue(v[i], d - 1)) {
					return false;
				}
			}
			// 全ての要素についてチェックが通ればtrue
			return true;
		}
		_checkValue(val, dim);
		return errorReason;
	};
}

/**
 * schemaからdepend項目の依存関係を表すマップを作成する
 *
 * @private
 * @param schema
 * @returns {Object}
 */
function createDependencyMap(schema) {
	//{ 依存元: [依存先] }という構造のマップ。依存先プロパティは配列内で重複はしない。
	var dependencyMap = {};

	for ( var prop in schema) {
		if (schema.hasOwnProperty(prop)) {
			var dependency = schema[prop] ? schema[prop].depend : null;
			if (dependency) {
				var dependOn = wrapInArray(dependency.on);
				for ( var i = 0, len = dependOn.length; i < len; i++) {
					var dependSrcPropName = dependOn[i];

					if (!dependencyMap[dependSrcPropName]) {
						dependencyMap[dependSrcPropName] = [];
					}
					if ($.inArray(prop, dependencyMap[dependSrcPropName]) === -1) {
						dependencyMap[dependSrcPropName].push(prop);
					}
				}
			}
		}
	}

	return dependencyMap;
}

//========================================================
//
// バリデーション関係コードここまで
//
//========================================================




var h5internal = {
	core: {
		controllerInternal: null
	}
};
