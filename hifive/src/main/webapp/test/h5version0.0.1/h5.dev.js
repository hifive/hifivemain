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
 *   version 0.0.1
 *   build at 2012/05/25 14:50:26.436 (+0900)
 *   (util,controller,view,ui,api.geo,api.sqldb,api.storage)
 */
(function($){

	// =========================================================================
	//
	// Prelude
	//
	// =========================================================================

	var savedH5 = undefined;

	//h5存在チェック
	if (window.h5) {
		if (window.h5.env && (window.h5.env.version === '0.0.1')) {
			// 既にロード済みのhifiveと同じバージョンをロードしようとした場合は何もしない
			return;
		}
		//coexistのために既存のh5を退避
		savedH5 = window.h5;
	}

	// h5空間を新規に作成。クロージャでくるんでいるので
	// 以降の各モジュールが見るh5はここで定義された(新しい)h5になる
	var h5 = {};

	// =============================
	// Expose to window
	// =============================

	window.h5 = h5;

	h5.coexist = function() {
		window.h5 = savedH5;
		return h5;
	};

	h5.env = {
		version: '0.0.1'
	};

	// =========================================================================
	//
	// Extenal Library
	//
	// =========================================================================


	// =========================================================================
	//
	// Modules
	//
	// =========================================================================



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
 *  { (エラーコード): (フォーマット文字列) } なマップ
 *
 *  @private
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
};

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
};


/* ------ h5.u ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	/**
	 * undefinedのタイプ
	 */
	var TYPE_OF_UNDEFINED = 'undefined';

	/**
	 * シリアライザのバージョン
	 */
	var CURRENT_SEREALIZER_VERSION = '1';

	/**
	 * ns()、getByPathで引数の名前空間名にstring以外が渡されたときに発生するエラー
	 */
	var ERR_CODE_NAMESPACE_INVALID = 11000;

	/**
	 * expose()で既に存在する名前空間が指定されたときに発生するエラー
	 */
	var ERR_CODE_NAMESPACE_EXIST = 11001;

	/**
	 * serialize()に関数オブジェクトが渡されたときに発生するエラー
	 */
	var ERR_CODE_SERIALIZE_FUNCTION = 11002;

	/**
	 * 現行のバージョンと違うバージョンでserialize()された文字列をdeserialize()しようとしたときに発生するエラー
	 */
	var ERR_CODE_SERIALIZE_VERSION = 11003;

	/**
	 * deserialize()で型情報の判定に失敗したときに発生するエラー
	 */
	var ERR_CODE_DESERIALIZE = 11004;

	/**
	 * serialize()に渡されたオブジェクト/配列が循環参照を持つときに発生するエラー
	 */
	var ERR_CODE_REFERENCE_CYCLE = 11005;

	/**
	 * deserialize()で値が不正でデシリアライズできない時に発生するエラー
	 */
	var ERR_CODE_INVALID_VALUE = 11006;

	/**
	 * loadScript()に渡されたパスが不正(文字列以外、空文字、空白文字)である時に発生するエラー
	 */
	var ERR_CODE_INVALID_SCRIPT_PATH = 11007;


	/**
	 * loadScript()に渡されたオプションが不正(プレーンオブジェクト、null、undefined)である時に発生するエラー
	 */
	var ERR_CODE_INVALID_OPTION = 11008;

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_NAMESPACE_INVALID] = '{0} 第一引数には空文字で無い文字列を指定して下さい。';
	errMsgMap[ERR_CODE_NAMESPACE_EXIST] = '名前空間"{0}"には、プロパティ"{1}"が既に存在します。';
	errMsgMap[ERR_CODE_SERIALIZE_FUNCTION] = 'Function型のオブジェクトは変換できません。';
	errMsgMap[ERR_CODE_SERIALIZE_VERSION] = 'シリアライザのバージョンが違います。シリアライズされたバージョン：{0} 現行のバージョン：{1}';
	errMsgMap[ERR_CODE_DESERIALIZE] = '型情報の判定に失敗したため、デシリアライズできませんでした。';
	errMsgMap[ERR_CODE_REFERENCE_CYCLE] = '循環参照が含まれています。';
	errMsgMap[ERR_CODE_INVALID_VALUE] = '不正な値が含まれるため、デシリアライズできませんでした。';
	errMsgMap[ERR_CODE_INVALID_SCRIPT_PATH] = 'スクリプトのパスが不正です。空文字以外の文字列、またはその配列を指定して下さい。';
	errMsgMap[ERR_CODE_INVALID_OPTION] = '{0} オプションの指定が不正です。プレーンオブジェクトで指定してください。';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);

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
	/**
	 * loadScript()によって追加されたjsファイルの絶対パスを保持する配列
	 *
	 * @private
	 */
	var addedJS = [];

	/**
	 * HTMLのエスケープルール
	 *
	 * @private
	 */
	var htmlEscapeRules = {
		'&': '&amp;',
		'"': '&quot;',
		'<': '&lt;',
		'>': '&gt;',
		"'": '&apos;'
	};
	// =============================
	// Functions
	// =============================

	/**
	 * 型情報の文字列をコードに変換します。
	 *
	 * @private
	 * @returns {String} 型を表すコード（１字）
	 */
	function typeToCode(typeStr) {
		switch (typeStr) {
		case 'string':
			return 's';
		case 'number':
			return 'n';
		case 'boolean':
			return 'b';
		case 'String':
			return 'S';
		case 'Number':
			return 'N';
		case 'Boolean':
			return 'B';
		case 'infinity':
			return 'i';
		case '-infinity':
			return 'I';
		case 'nan':
			return 'x';
		case 'date':
			return 'd';
		case 'regexp':
			return 'r';
		case 'array':
			return 'a';
		case 'object':
			return 'o';
		case 'null':
			return 'l';
		case TYPE_OF_UNDEFINED:
			return 'u';
		case 'undefElem':
			return '_';
		case 'objElem':
			return '@';
		}
	}
	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	/**
	 * ドット区切りで名前空間オブジェクトを生成します。 （h5.u.obj.ns('jp.co.nssol')と呼ぶと、window.jp.co.nssolとオブジェクトを生成します。）
	 * すでにオブジェクトが存在した場合は、それをそのまま使用します。 引数にString以外が渡された場合はエラーとします。
	 *
	 * @param {String} namespace 名前空間
	 * @memberOf h5.u.obj
	 * @returns {Object} 作成した名前空間オブジェクト
	 */
	var ns = function(namespace) {
		if (!namespace) {
			throwFwError(ERR_CODE_NAMESPACE_INVALID, 'h5.u.obj.ns()');
		}

		if ($.type(namespace) !== 'string') {
			throwFwError(ERR_CODE_NAMESPACE_INVALID, 'h5.u.obj.ns()');
		}

		var nsArray = namespace.split('.');
		var parentObj = window;
		for ( var i = 0, len = nsArray.length; i < len; i++) {
			if (parentObj[nsArray[i]] === undefined) {
				parentObj[nsArray[i]] = {};
			}
			parentObj = parentObj[nsArray[i]];
		}

		// ループが終了しているので、parentObjは一番末尾のオブジェクトを指している
		return parentObj;
	};

	/**
	 * オブジェクトを指定された名前空間に登録し、グローバルに公開します。 引数namespaceの型がObjectでそのObjectがグローバルに紐付いていない場合は公開されません。
	 *
	 * @param {String|Object} namespace 名前空間
	 * @param {Object} object 登録するオブジェクト
	 * @memberOf h5.u.obj
	 */
	var expose = function(namespace, object) {
		var nsObj = ns(namespace);
		for ( var prop in object) {
			if (object.hasOwnProperty(prop)) {
				if (nsObj[prop]) {
					throwFwError(ERR_CODE_NAMESPACE_EXIST, namespace, prop);
				}
				nsObj[prop] = object[prop];
			}
		}
	};

	/**
	 * 指定されたスクリプトをロードします。
	 *
	 * @param {String|String[]} path ソースパス
	 * @param {Object} [opt] オプション
	 * @param {Boolean} [opt.async] 非同期で読み込むかどうかを指定します。デフォルトはfalse(同期)です。<br />
	 *            trueの場合は、戻り値としてPromiseオブジェクトを返します。
	 * @param {Boolean} [opt.force] 既に読み込み済みのスクリプトを再度読み込むかどうかを指定します。<br />
	 *            読み込み済みかどうかの判定は相対パスではなく、絶対パスで行います。デフォルトはfalse(読み込まない)です。
	 * @param {Boolean} [opt.parallel] 非同期で読み込む場合にパラレルに読み込むかどうかを指定します。<br />
	 *            trueの場合は、指定した順番を考慮せずに読み込みます。デフォルトはfalse(シーケンシャルに読み込む)です。
	 * @returns {Promise} Promiseオブジェクト。第2引数optのasyncプロパティがtrueである場合のみ戻り値としてPromiseオブジェクトを返します。
	 * @name loadScript
	 * @function
	 * @memberOf h5.u
	 */
	var loadScript = function(path, opt) {
		var resource = wrapInArray(path);
		if (!resource || resource.length === 0) {
			throwFwError(ERR_CODE_INVALID_SCRIPT_PATH);
		}
		for(var i = 0, l = resource.length; i < l; i++){
			var path = resource[i];
			if(typeof path !== 'string' || !$.trim(path)){
				throwFwError(ERR_CODE_INVALID_SCRIPT_PATH);
			}
		}
		if(opt != null && !$.isPlainObject(opt)){
			throwFwError(ERR_CODE_INVALID_OPTION, 'h5.u.loadScript()');
		}
		var force = opt && opt.force === true;
		var srcLen = resource.length;
		// 同期読み込みの場合
		if (!opt || opt.async !== true) {
			var $head = $('head');
			for ( var i = 0; i < srcLen; i++) {
				var s = toAbsoluteUrl(resource[i]);
				if (force || $.inArray(s, addedJS) === -1) {
					$head.append('<script type="text/javascript" src="' + s + '"></script>');
					addedJS.push(s);
				}
			}
			// 同期の場合は何も返さない。
			return;
		}
		// 非同期読み込みの場合
		var parallel = opt && opt.parallel === true;
		var promises = [];
		var dfd = h5.async.deferred();
		var head = document.head || document.getElementsByTagName('head')[0];
		var load = function(index) {
			var count = index;
			if (srcLen <= count) {
				// 読み込み終了
				$.when.apply($, promises).done(function() {
					dfd.resolve();
				});
				return;
			}

			var s = toAbsoluteUrl(resource[count]);
			if (!force && $.inArray(s, addedJS) !== -1) {
				load(++count);
				return;
			}

			var script = document.createElement('script');
			script.type = 'text/javascript';

			var scriptDfd = parallel ? h5.async.deferred() : null;
			if (window.ActiveXObject) {
				script.onreadystatechange = function() {
					if (script.readyState == 'complete' || script.readyState == 'loaded') {
						script.onreadystatechange = null;
						if (scriptDfd) {
							scriptDfd.resolve();
						} else {
							load(++count);
						}
					}
				};
			} else {
				script.onerror = function() {
					script.onerror = null;
					if (scriptDfd) {
						scriptDfd.resolve();
					} else {
						load(++count);
					}
				};
				script.onload = function() {
					script.onload = null;
					if (scriptDfd) {
						scriptDfd.resolve();
					} else {
						load(++count);
					}
				};
			}
			script.src = s;
			head.appendChild(script);
			addedJS.push(s);
			if (scriptDfd) {
				promises.push(scriptDfd.promise());
				load(++count);
			}

		};
		setTimeout(function() {
			load(0);
		}, 0);
		return dfd.promise();
	};

	/**
	 * 文字列のプレフィックスが指定したものかどうかを返します。
	 *
	 * @param {String} str 文字列
	 * @param {String} prefix プレフィックス
	 * @returns {Boolean} 文字列のプレフィックスが指定したものかどうか
	 * @name startsWith
	 * @function
	 * @memberOf h5.u.str
	 */
	var startsWith = function(str, prefix) {
		return str.lastIndexOf(prefix, 0) === 0;
	};

	/**
	 * 文字列のサフィックスが指定したものかどうかを返します。
	 *
	 * @param {String} str 文字列
	 * @param {String} suffix サフィックス
	 * @returns {Boolean} 文字列のサフィックスが指定したものかどうか
	 * @name endsWith
	 * @function
	 * @memberOf h5.u.str
	 */
	var endsWith = function(str, suffix) {
		var sub = str.length - suffix.length;
		return (sub >= 0) && (str.lastIndexOf(suffix) === sub);
	};

	/**
	 * 第一引数の文字列に含まれる{0}、{1}、{2}...{n} (nは数字)を、第2引数以降に指定されたパラメータに置換します。
	 *
	 * <pre>
	 * 例：
	 * 		var myValue = 10;
	 * 		h5.u.str.format('{0} is {1}', 'myValue', myValue);
	 * </pre>
	 *
	 * 実行結果: myValue is 10
	 *
	 * @param {String} str 文字列
	 * @param {Any} var_args 可変長引数
	 * @returns {String} フォーマット済み文字列
	 * @name format
	 * @function
	 * @memberOf h5.u.str
	 */
	var format = function(str, var_args) {
		if (str == null) {
			return '';
		}
		var args = arguments;
		return str.replace(/\{(\d+)\}/g, function(m, c) {
			var rep = args[parseInt(c, 10) + 1];
			if (typeof rep === TYPE_OF_UNDEFINED) {
				return TYPE_OF_UNDEFINED;
			}
			return rep;
		});
	};

	/**
	 * 指定されたHTML文字列をエスケープします。
	 *
	 * @param {String} str HTML文字列
	 * @returns {String} エスケープ済HTML文字列
	 * @name escapeHTML
	 * @function
	 * @memberOf h5.u.str
	 */
	var escapeHtml = function(str) {
		if ($.type(str) !== 'string') {
			return str;
		}
		return str.replace(/[&"'<>]/g, function(c) {
			return htmlEscapeRules[c];
		});
	};

	/**
	 * オブジェクトを、型情報を付与した文字列に変換します。
	 * <p>
	 * このメソッドが判定可能な型は、以下のとおりです。
	 * <ul>
	 * <li>string(文字列)
	 * <li>number(数値)
	 * <li>boolean(真偽値)
	 * <li>String(文字列のラッパークラス型)
	 * <li>Number(数値のラッパークラス型)
	 * <li>Boolean(真偽値のラッパークラス型)
	 * <li>array(配列)
	 * <li>object(プレーンオブジェクト [new Object() または {…} のリテラルで作られたオブジェクト])
	 * <li>Date(日付)
	 * <li>RegExp(正規表現)
	 * <li>undefined
	 * <li>null
	 * <li>NaN
	 * <li>Infinity
	 * <li>-Infinity
	 * </ul>
	 * <p>
	 * このメソッドで文字列化したオブジェクトは<a href="#deserialize">deseriarize</a>メソッドで元に戻すことができます。
	 * </p>
	 * <p>
	 * object型はプレーンオブジェクトとしてシリアライズします。 渡されたオブジェクトがプレーンオブジェクトで無い場合、そのprototypeやconstructorは無視します。
	 * </p>
	 * <p>
	 * array型は連想配列として保持されているプロパティもシリアライズします。
	 * </p>
	 * <p>
	 * 循環参照を含むarray型およびobject型はシリアライズできません。例外をスローします。
	 * </p>
	 * <p>
	 * 内部に同一インスタンスを持つarray型またはobject型は、別インスタンスとしてシリアライズします。以下のようなarray型オブジェクトaにおいて、a[0]とa[1]が同一インスタンスであるという情報は保存しません。
	 *
	 * <pre>
	 * a = [];
	 * a[0] = a[1] = [];
	 * </pre>
	 *
	 * </p>
	 * <h4>注意</h4>
	 * <p>
	 * function型のオブジェクトは<b>変換できません</b>。例外をスローします。
	 * array型にfunction型のオブジェクトが存在する場合は、undefinedとしてシリアライズします。object型または連想配列にfunction型のオブジェクトが存在する場合は、無視します。
	 * </p>
	 *
	 * @param {Object} value オブジェクト
	 * @returns {String} 型情報を付与した文字列
	 * @name serialize
	 * @function
	 * @memberOf h5.u.obj
	 */
	var serialize = function(value) {
		if ($.isFunction(value)) {
			throwFwError(ERR_CODE_SERIALIZE_FUNCTION);
		}
		// 循環参照チェック用配列
		var objStack = [];
		function existStack(obj) {
			for ( var i = 0, len = objStack.length; i < len; i++) {
				if (obj === objStack[i]) {
					return true;
				}
			}
			return false;
		}
		;
		function popStack(obj) {
			for ( var i = 0, len = objStack.length; i < len; i++) {
				if (obj === objStack[i]) {
					objStack.splice(i, 1);
				}
			}
		}
		;

		function func(val) {
			var ret = val;
			var type = $.type(val);

			// プリミティブラッパークラスを判別する
			if (typeof val === 'object') {
				if (val instanceof String) {
					type = 'String';
				} else if (val instanceof Number) {
					type = 'Number';
				} else if (val instanceof Boolean) {
					type = 'Boolean';
				}
			}

			// オブジェクトや配列の場合、JSON.stringify()を使って書けるが、json2.jsのJSON.stringify()を使った場合に不具合があるため自分で実装した。
			switch (type) {
			case 'String':
			case 'string':
				ret = typeToCode(type) + ret;
				break;
			case 'Boolean':
				ret = ret.valueOf();
			case 'boolean':
				ret = typeToCode(type) + ((ret) ? 1 : 0);
				break;
			case 'Number':
				ret = ret.valueOf();
				if (($.isNaN && $.isNaN(val)) || ($.isNumeric && !$.isNumeric(val))) {
					if (val.valueOf() === Infinity) {
						ret = typeToCode('infinity');
					} else if (val.valueOf() === -Infinity) {
						ret = typeToCode('-infinity');
					} else {
						ret = typeToCode('nan');
					}
				}
				ret = typeToCode(type) + ret;
				break;
			case 'number':
				if (($.isNaN && $.isNaN(val)) || ($.isNumeric && !$.isNumeric(val))) {
					if (val === Infinity) {
						ret = typeToCode('infinity');
					} else if (val === -Infinity) {
						ret = typeToCode('-infinity');
					} else {
						ret = typeToCode('nan');
					}
				} else {
					ret = typeToCode(type) + ret;
				}
				break;
			case 'regexp':
				ret = typeToCode(type) + ret.toString();
				break;
			case 'date':
				ret = typeToCode(type) + (+ret);
				break;
			case 'array':
				if (existStack(val)) {
					throwFwError(ERR_CODE_REFERENCE_CYCLE);
				}
				objStack.push(val);
				var indexStack = [];
				ret = typeToCode(type) + '[';
				for ( var i = 0, len = val.length; i < len; i++) {
					indexStack[i.toString()] = true;
					var elm;
					if (!val.hasOwnProperty(i)) {
						elm = typeToCode('undefElem');
					} else if ($.type(val[i]) === 'function') {
						elm = typeToCode(TYPE_OF_UNDEFINED);
					} else {
						elm = (func(val[i])).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
					}
					ret += '"' + elm + '"';
					if (i !== val.length - 1) {
						ret += ',';
					}
				}
				var hash = '';
				for ( var key in val) {
					if (indexStack[key]) {
						continue;
					}
					if ($.type(val[key]) !== 'function') {
						hash += '"' + key + '":"'
								+ (func(val[key])).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
								+ '",';
					}
				}
				if (hash) {
					ret += ((val.length) ? ',' : '') + '"' + typeToCode('objElem') + '{'
							+ hash.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
					ret = ret.replace(/,$/, '');
					ret += '}"';
				}
				ret += ']';
				popStack(val);
				break;
			case 'object':
				if (existStack(val)) {
					throwFwError('循環参照が含まれています。');
				}
				objStack.push(val);
				ret = typeToCode(type) + '{';
				for ( var key in val) {
					if (val.hasOwnProperty(key)) {
						if ($.type(val[key]) === 'function') {
							continue;
						}
						ret += '"' + key + '":"'
								+ (func(val[key])).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
								+ '",';
					}
				}
				ret = ret.replace(/,$/, '');
				ret += '}';
				popStack(val);
				break;
			case 'null':
			case TYPE_OF_UNDEFINED:
				ret = typeToCode(type);
				break;
			}

			return ret;
		}
		;
		return CURRENT_SEREALIZER_VERSION + '|' + func(value);
	};

	/**
	 * 型情報が付与された文字列をオブジェクトを復元します。
	 *
	 * @param {String} value 型情報が付与された文字列
	 * @returns {Any} 復元されたオブジェクト
	 * @name deserialize
	 * @function
	 * @memberOf h5.u.obj
	 */
	var deserialize = function(value) {
		if (typeof value !== 'string') {
			return value;
		}

		value.match(/^(.)\|(.*)/);
		var version = RegExp.$1;
		if (version !== CURRENT_SEREALIZER_VERSION) {
			throwFwError(ERR_CODE_SERIALIZE_VERSION, [version, CURRENT_SEREALIZER_VERSION]);
		}
		var ret = RegExp.$2;

		function func(val) {
			var originValue = val;
			/**
			 * 型情報のコードを文字列に変換します。
			 *
			 * @private
			 * @returns {String} 型を表す文字列
			 */
			function codeToType(typeStr) {
				switch (typeStr) {
				case 's':
					return 'string';
				case 'n':
					return 'number';
				case 'b':
					return 'boolean';
				case 'S':
					return 'String';
				case 'N':
					return 'Number';
				case 'B':
					return 'Boolean';
				case 'i':
					return 'infinity';
				case 'I':
					return '-infinity';
				case 'x':
					return 'nan';
				case 'd':
					return 'date';
				case 'r':
					return 'regexp';
				case 'a':
					return 'array';
				case 'o':
					return 'object';
				case 'l':
					return 'null';
				case 'u':
					return TYPE_OF_UNDEFINED;
				case '_':
					return 'undefElem';
				case '@':
					return 'objElem';
				}
			}
			try {
				val.match(/^(.)(.*)/);
				type = RegExp.$1;
				ret = (RegExp.$2) ? RegExp.$2 : '';
				if (type !== undefined && type !== '') {
					var value = ret;// ret.substring(repPos, ret.length);

					switch (codeToType(type)) {
					case 'String':
						ret = new String(ret);
						break;
					case 'string':
						break;
					case 'Boolean':
						if (ret === '0' || ret === '1') {
							ret = new Boolean(ret === '1');
						} else {
							throwFwError(ERR_CODE_INVALID_VALUE);
						}
						break;
					case 'boolean':
						if (ret === '0' || ret === '1') {
							ret = ret === '1';
						} else {
							throwFwError(ERR_CODE_INVALID_VALUE);
						}
						break;
					case 'Number':
						if (codeToType(ret) === 'infinity') {
							ret = new Number(Infinity);
						} else if (codeToType(ret) === '-infinity') {
							ret = new Number(-Infinity);
						} else if (codeToType(ret) === 'nan') {
							ret = new Number(NaN);
						} else {
							ret = new Number(ret);
						}
						break;
					case 'number':
						ret = parseFloat(ret);
						break;
					case 'array':
						var obj = $.parseJSON(ret);

						for ( var i = 0; i < obj.length; i++) {
							switch (codeToType(obj[i].substring(0, 1))) {
							case 'undefElem':
								delete obj[i];
								break;
							case 'objElem':
								var extendObj = func(typeToCode('object') + obj[i].substring(1));
								var tempObj = [];
								for ( var i = 0, l = obj.length - 1; i < l; i++) {
									tempObj[i] = obj[i];
								}
								obj = tempObj;
								for ( var key in extendObj) {
									obj[key] = extendObj[key];
								}
								break;
							default:
								obj[i] = func(obj[i]);
							}
						}
						ret = obj;
						break;
					case 'object':
						var obj = $.parseJSON(ret);

						for ( var key in obj) {
							obj[key] = func(obj[key]);
						}
						ret = obj;
						break;
					case 'date':
						ret = new Date(parseInt(value, 10));
						break;
					case 'regexp':
						value.match(/^\/(.*)\/(.*)$/);
						var regStr = RegExp.$1;
						var flg = RegExp.$2;
						ret = new RegExp(regStr, flg);
						break;
					case 'null':
						ret = null;
						break;
					case TYPE_OF_UNDEFINED:
						ret = undefined;
						break;
					case 'nan':
						ret = NaN;
						break;
					case 'infinity':
						ret = Infinity;
						break;
					case '-infinity':
						ret = -Infinity;
						break;
					default:
						throwFwError(ERR_CODE_INVALID_VALUE);
					}
				}
			} catch (e) {
				// 型情報の判定(復元)に失敗した場合、値をそのまま返すので何もしない
				// throwFwError(ERR_CODE_DESERIALIZE);
				ret = originValue;
			}
			return ret;
		};

		return func(ret);
	};

	/**
	 * オブジェクトがjQueryオブジェクトかどうかを返します。
	 *
	 * @param {Object} obj オブジェクト
	 * @returns {Boolean} jQueryオブジェクトかどうか
	 * @name isJQueryObject
	 * @function
	 * @memberOf h5.u.obj
	 */
	var isJQueryObject = function(obj) {
		if (!obj || !obj.jquery) {
			return false;
		}
		return (obj.jquery === $().jquery);
	};

	/**
	 * argumentsを配列に変換します。
	 *
	 * @param {Arguments} args Arguments
	 * @returns {Any[]} argumentsを変換した配列
	 * @name argsToArray
	 * @function
	 * @memberOf h5.u.obj
	 */
	var argsToArray = function(args) {
		return Array.prototype.slice.call(args);
	};

	/**
	 * 指定された名前空間に存在するオブジェクトを取得します。
	 *
	 * @param {String} 名前空間
	 * @return {Any} その名前空間に存在するオブジェクト
	 * @name getByPath
	 * @function
	 * @memberOf h5.u.obj
	 */
	var getByPath = function(namespace) {
		if (typeof namespace !== 'string') {
			throwFwError(ERR_CODE_NAMESPACE_INVALID, 'h5.u.obj.getByPath()');
		}

		var names = namespace.split('.');
		if (names[0] === 'window') {
			names.unshift();
		}
		var ret = window;
		for ( var i = 0, len = names.length; i < len; i++) {
			ret = ret[names[i]];
			if (ret == null) { // nullまたはundefinedだったら辿らない
				break;
			}
		}

		return ret;
	};

	/**
	 * インターセプタを作成します。
	 *
	 * @param {Function} pre インターセプト先関数の実行前に呼ばれる関数です。
	 * @param {Function} post インターセプト先関数の実行後に呼ばれる関数です。<br />
	 *            <ul>
	 *            <li>pre(), post()には引数としてinvocationとdata(preからpostへ値を渡すための入れ物オブジェクト)が渡されます。</li>
	 *            <li>post()は、呼び出した関数の戻り値がPromiseオブジェクトかどうかをチェックし、Promiseオブジェクトの場合は対象のDeferredが完了した後に呼ばれます。</li>
	 *            <li>pre()の中でinvocation.proceed()が呼ばれなかった場合、post()は呼ばれません。</li>
	 *            <li>invocation.resultプロパティに呼び出した関数の戻り値が格納されます。</li>
	 *            <li>pre()が指定されていない場合、invocation.proceed()を実行した後にpost()を呼びます。</li>
	 *            </ul>
	 *            コード例(h5.core.interceptor.lapInterceptor)を以下に示します。<br />
	 *
	 * <pre>
	 * var lapInterceptor = h5.u.createInterceptor(function(invocation, data) {
	 * 	// 開始時間をdataオブジェクトに格納
	 * 		data.start = new Date();
	 * 		// invocationを実行
	 * 		return invocation.proceed();
	 * 	}, function(invocation, data) {
	 * 		// 終了時間を取得
	 * 		var end = new Date();
	 * 		// ログ出力
	 * 		this.log.info('{0} &quot;{1}&quot;: {2}ms', this.__name, invocation.funcName, (end - data.start));
	 * 	});
	 * </pre>
	 *
	 * @return {Function} インターセプタ
	 * @name createInterceptor
	 * @function
	 * @memberOf h5.u
	 */
	var createInterceptor = function(pre, post) {
		return function(invocation) {
			var data = {};
			var ret = pre ? pre.call(this, invocation, data) : invocation.proceed();
			invocation.result = ret;
			if (!post) {
				return ret;
			}
			if (h5.async.isPromise(ret)) {
				var that = this;
				ret.always(function() {
					post.call(that, invocation, data);
				});
				return ret;
			}
			post.call(this, invocation, data);
			return ret;
		};
	};

	// =============================
	// Expose to window
	// =============================

	expose('h5.u', {
		loadScript: loadScript,
		createInterceptor: createInterceptor
	});

	/**
	 * @namespace
	 * @name str
	 * @memberOf h5.u
	 */
	expose('h5.u.str', {
		startsWith: startsWith,
		endsWith: endsWith,
		format: format,
		escapeHtml: escapeHtml
	});

	/**
	 * @namespace
	 * @name obj
	 * @memberOf h5.u
	 */
	expose('h5.u.obj', {
		expose: expose,
		ns: ns,
		serialize: serialize,
		deserialize: deserialize,
		isJQueryObject: isJQueryObject,
		argsToArray: argsToArray,
		getByPath: getByPath
	});

})();


/* ------ h5.log ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	/**
	 * ログターゲット(targets)の指定が不正なときのエラーコード
	 */
	var ERR_CODE_LOG_TARGET_TYPE = 10000;

	/**
	 * out.categoryのが指定されていないときのエラーコード
	 */
	var ERR_CODE_OUT_CATEGORY_IS_NONE = 10001;

	/**
	 * カテゴリが複数回指定されたときのエラーコード
	 */
	var ERR_CODE_CATEGORY_NAMED_MULTIPLE_TIMES = 10002;

	/**
	 * ログレベルの指定が不正なときのエラーコード
	 */
	var ERR_CODE_LEVEL_INVALID = 10003;

	/**
	 * 存在しないログターゲットを指定されたときのエラーコード
	 */
	var ERR_CODE_LOG_TARGETS_IS_NONE = 10004;

	/**
	 * カテゴリに文字列以外または空文字を指定したときのエラーコード
	 */
	var ERR_CODE_CATEGORY_INVALID = 10005;

	/**
	 * ログターゲット(targets)が複数回指定されたときのエラーコード
	 */
	var ERR_CODE_LOG_TARGETS_NAMED_MULTIPLE_TIMES = 10007;

	/**
	 * ログターゲット(targets)に文字列以外または空文字を指定されたときのエラーコード
	 */
	var ERR_CODE_LOG_TARGETS_INVALID = 10008;

	/**
	 * ログターゲット(target)にオブジェクト以外を指定されたときのエラーコード
	 */
	var ERR_CODE_LOG_TARGET_INVALID = 10009;

	/**
	 * out.categoryが指定されていないときのエラーコード
	 */
	var ERR_CODE_OUT_CATEGORY_INVALID = 10010;

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_LOG_TARGET_TYPE] = 'ログターゲットのtypeには、オブジェクト、もしくは"console"のみ指定可能です。';
	errMsgMap[ERR_CODE_OUT_CATEGORY_IS_NONE] = 'outの各要素について、categoryは必須項目です。。';
	errMsgMap[ERR_CODE_CATEGORY_NAMED_MULTIPLE_TIMES] = 'category"{0}"が複数回指定されています。';
	errMsgMap[ERR_CODE_LEVEL_INVALID] = 'level"{0}"の指定は不正です。Number、もしくはtrace, info, debug, warn, error, noneを指定してください。';
	errMsgMap[ERR_CODE_LOG_TARGETS_NAMED_MULTIPLE_TIMES] = 'ログターゲット"{0}"が複数回指定されています。';
	errMsgMap[ERR_CODE_LOG_TARGETS_IS_NONE] = '"{0}"という名前のログターゲットはありません。';
	errMsgMap[ERR_CODE_CATEGORY_INVALID] = 'categoryは必須項目です。1文字以上の文字列を指定してください。';
	errMsgMap[ERR_CODE_LOG_TARGETS_INVALID] = 'ログターゲット(targets)の指定は1文字以上の文字列、または配列で指定してください。';
	errMsgMap[ERR_CODE_LOG_TARGET_INVALID] = 'ログターゲット(target)の指定はプレーンオブジェクトで指定してください。';
	errMsgMap[ERR_CODE_OUT_CATEGORY_INVALID] = 'outの各要素についてcategoryは文字列で指定する必要があります。';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);

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
	var logLevel = {

		/**
		 * ログレベル: ERROR
		 *
		 * @memberOf Log.LEVEL
		 * @const {Object} ERROR
		 * @type Number
		 */
		ERROR: 50,

		/**
		 * ログレベル: WARN
		 *
		 * @memberOf Log.LEVEL
		 * @const {Object} WARN
		 * @type Number
		 */
		WARN: 40,

		/**
		 * ログレベル: INFO
		 *
		 * @memberOf Log.LEVEL
		 * @const {Object} INFO
		 * @type Number
		 */
		INFO: 30,

		/**
		 * ログレベル: DEBUG
		 *
		 * @memberOf Log.LEVEL
		 * @const {Object} DEBUG
		 * @type Number
		 */
		DEBUG: 20,

		/**
		 * ログレベル: TRACE
		 *
		 * @memberOf Log.LEVEL
		 * @const {Object} TRACE
		 * @type Number
		 */
		TRACE: 10,

		/**
		 * ログレベル: ALL
		 *
		 * @memberOf Log.LEVEL
		 * @const {Object} ALL
		 * @type Number
		 */
		ALL: 0,

		/**
		 * ログレベル: NONE
		 *
		 * @memberOf Log.LEVEL
		 * @const {Object} NONE
		 * @type Number
		 */
		NONE: -1
	};

	// コンパイル済ログ設定
	var compiledLogSettings = null;

	// =============================
	// Functions
	// =============================
	/**
	 * 指定されたレベルを文字列に変換します。
	 */
	function levelToString(level) {
		if (level === logLevel.ERROR) {
			return 'ERROR';
		} else if (level === logLevel.WARN) {
			return 'WARN';
		} else if (level === logLevel.INFO) {
			return 'INFO';
		} else if (level === logLevel.DEBUG) {
			return 'DEBUG';
		} else if (level === logLevel.TRACE) {
			return 'TRACE';
		}
	}

	/**
	 * 指定された文字列をレベルに変換します。
	 */
	function stringToLevel(str) {
		if (str.match(/^error$/i)) {
			return logLevel.ERROR;
		} else if (str.match(/^warn$/i)) {
			return logLevel.WARN;
		} else if (str.match(/^info$/i)) {
			return logLevel.INFO;
		} else if (str.match(/^debug$/i)) {
			return logLevel.DEBUG;
		} else if (str.match(/^trace$/i)) {
			return logLevel.TRACE;
		} else if (str.match(/^all$/i)) {
			return logLevel.ALL;
		} else if (str.match(/^none$/i)) {
			return logLevel.NONE;
		} else {
			return null;
		}
	}
	;

	/**
	 * トレース情報からトレース結果のオブジェクト取得します。
	 * <ul>
	 * <li>result.all {String} 全てトレースする
	 * <li>result.recent {String} Logクラス/LogTargetクラスのメソッドは省いた最大3件のスタックトーレス"[func1_2 () <- func1_1 () <-
	 * func1 () ...]"
	 * </ul>
	 */
	function getTraceResult(recentTraces, detailTraces) {
		var COUNT = 3;
		var result = {};

		if ($.isArray(recentTraces)) {
			var recent = recentTraces.slice(0, COUNT).join(' <- ');

			if (recentTraces.slice(COUNT).length > 0) {
				recent += ' ...';
			}

			result.recent = recent;
			result.all = detailTraces.join('\n');
		} else {
			result.recent = recentTraces;
			result.all = detailTraces;
		}

		return result;
	}

	/**
	 * 指定されたFunction型のオブジェクトから、名前を取得します。
	 *
	 * @param {Function} fn
	 */
	function getFunctionName(fn) {
		var ret = '';

		if (!fn.name) {
			var regExp = /^\s*function\s*([\w\-\$]+)?\s*\(/i;
			regExp.test(fn.toString());
			ret = RegExp.$1;
		} else {
			ret = fn.name;
		}

		return ret;
	}

	/**
	 * 指定されたFunction型のオブジェクトから、引数の型の一覧を取得します。
	 */
	function parseArgs(args) {
		var argArray = h5.u.obj.argsToArray(args);
		var result = [];

		for ( var i = 0, len = argArray.length; i < len; i++) {
			result.push($.type(argArray[i]));
		}

		return result.join(', ');
	}


	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * コンソールにログを出力するログターゲット
	 *
	 * @name ConsoleLogTarget
	 * @constructor
	 */
	function ConsoleLogTarget() {
	// 空コンストラクタ
	}

	ConsoleLogTarget.prototype = {

		/**
		 * コンソールログターゲットの初期化を行います。
		 *
		 * @memberOf ConsoleLogTarget
		 * @function
		 * @param {Object} param 初期化パラメータ
		 */
		init: function(param) {
		// 今は特定のパラメータはない
		},

		/**
		 * ログをコンソールに出力します。
		 *
		 * @memberOf ConsoleLogTarget
		 * @function
		 * @param {Object} logObj ログ情報を保持するオブジェクト
		 */
		log: function(logObj) {
			if (!window.console) {
				return;
			}

			var args = logObj.args;
			if (typeof args[0] !== 'string') {
				this._logObj(logObj);
			} else {
				this._logMsg(logObj);
			}
		},

		/**
		 * 指定された文字列をコンソールに出力します。
		 *
		 * @memberOf ConsoleLogTarget
		 * @private
		 * @function
		 * @param {Object} logObj ログ情報を保持するオブジェクト
		 */
		_logMsg: function(logObj) {
			var args = logObj.args;
			var msg = null;

			if (args.length === 1) {
				msg = args[0];
			} else {
				msg = h5.u.str.format.apply(h5.u.str, args);
			}

			var logMsg = this._getLogPrefix(logObj) + msg;

			if (logObj.logger.enableStackTrace) {
				logMsg += '  [' + logObj.stackTrace.recent + ']';
			}

			if (logObj.logger.enableStackTrace && console.groupCollapsed) {
				console.groupCollapsed(logMsg);
			} else {
				this._consoleOut(logObj.level, logMsg);
			}

			if (logObj.logger.enableStackTrace) {
				// if (console.trace) {
				// console.trace();
				// } else {
				this._consoleOut(logObj.level, logObj.stackTrace.all);
				// }
			}

			if (logObj.logger.enableStackTrace && console.groupEnd) {
				console.groupEnd();
			}
		},

		_consoleOut: function(level, str) {
			var logPrinted = false;

			// 専用メソッドがあればそれを使用して出力
			if ((level == logLevel.ERROR) && console.error) {
				console.error(str);
				logPrinted = true;
			} else if ((level == logLevel.WARN) && console.warn) {
				console.warn(str);
				logPrinted = true;
			} else if ((level == logLevel.INFO) && console.info) {
				console.info(str);
				logPrinted = true;
			} else if ((level == logLevel.DEBUG) && console.debug) {
				console.debug(str);
				logPrinted = true;
			}

			if (!logPrinted && console.log) {
				// this.trace()の場合、または固有メソッドがない場合はlogメソッドで出力
				console.log(str);
			}
		},

		/**
		 * 出力するログのプレフィックスを作成します。
		 *
		 * @memberOf ConsoleLogTarget
		 * @private
		 * @function
		 * @param {Object} logObj ログ情報を保持するオブジェクト
		 * @return ログのプレフィックス
		 */
		_getLogPrefix: function(logObj) {
			return '[' + logObj.levelString + ']' + logObj.date.getHours() + ':'
					+ logObj.date.getMinutes() + ':' + logObj.date.getSeconds() + ','
					+ logObj.date.getMilliseconds() + ': ';
		},

		/**
		 * 指定されたオブジェクトをコンソールに出力します。
		 *
		 * @memberOf ConsoleLogTarget
		 * @private
		 * @function
		 * @param {Object} logObj ログ情報を保持するオブジェクト
		 */
		_logObj: function(logObj) {
			// 専用メソッドがあればそれを使用して出力
			var args = logObj.args;
			var prefix = this._getLogPrefix(logObj);
			args.unshift(prefix);
			if ((logObj.level == logLevel.ERROR) && console.error) {
				this._output(console.error, args);
			} else if ((logObj.level == logLevel.WARN) && console.warn) {
				this._output(console.warn, args);
			} else if ((logObj.level == logLevel.INFO) && console.info) {
				this._output(console.info, args);
			} else if ((logObj.level == logLevel.DEBUG) && console.debug) {
				this._output(console.debug, args);
			} else {
				this._output(console.log, args);
			}
		},

		_output: function(func, args) {
			var f = func;
			if (!func.call) {
				// IEでは、console.log/error/info/warnにcallがないので、その対応をする
				f = function(arg) {
					func(arg);
				};
			}
			f.call(console, args);
			return;
		}
	};

	/**
	 * h5.settings.logにあるログ設定を適用します。
	 *
	 * @function
	 * @name configure
	 * @memberOf h5.log
	 */
	var configure = function() {
		// defaultOutのデフォルト
		var defaultOut = {
			level: 'NONE',
			targets: null
		};

		/* del begin */
		// h5.dev.jsではデフォルトのdefaultOutをログ出力するようにしておく。
		defaultOut = {
			level: 'debug',
			targets: 'console'
		};

		/* del end */

		function compileLogTarget(targets) {
			if (!$.isPlainObject(targets)) {
				throwFwError(ERR_CODE_LOG_TARGET_INVALID);
			}
			for ( var prop in targets) {
				var obj = targets[prop];
				var type = $.type(obj.type);
				// 今は"remote"でもエラーとなる
				if (type !== 'object' && obj.type !== 'console') {
					throwFwError(ERR_CODE_LOG_TARGET_TYPE);
				}
				var compiledTarget = null;
				if (obj.type === 'console') {
					compiledTarget = new ConsoleLogTarget();
				} else {
					// typeがオブジェクトの場合
					var clone = $.extend(true, {}, obj.type);
					compiledTarget = clone;
				}
				if (compiledTarget.init) {
					compiledTarget.init(obj);
				}
				obj.compiledTarget = compiledTarget;
			}
			targets.console = {
				type: 'console',
				compiledTarget: new ConsoleLogTarget()
			};
		}

		var categoryCache = [];
		function compileOutput(_logTarget, out, _dOut) {
			var isDefault = _dOut == null;
			if (!isDefault) {
				var category = out.category;
				if (typeof category !== 'string' || $.trim(category).length === 0) {
					throwFwError(ERR_CODE_OUT_CATEGORY_INVALID);
				}
				category = $.trim(category);
				if ($.inArray(category, categoryCache) !== -1) {
					throwFwError(ERR_CODE_CATEGORY_NAMED_MULTIPLE_TIMES, out.category);
				}
				out.compiledCategory = getRegex(category);
				categoryCache.push(category);
			}
			var compiledLevel;
			if (out.level == null) {
				compiledLevel = stringToLevel(isDefault ? defaultOut.level : _dOut.level);
			} else {
				compiledLevel = typeof out.level === 'string' ? stringToLevel($.trim(out.level))
						: out.level;
			}
			if (typeof compiledLevel !== 'number') {
				throwFwError(ERR_CODE_LEVEL_INVALID, out.level);
			}
			out.compiledLevel = compiledLevel;

			var compiledTargets = [];
			var targets = out.targets;
			if (!isDefault || targets != null) {
				var targetNames = [];
				// targetsの指定は文字列または配列またはnull,undefinedのみ
				if (!(targets == null || $.isArray(targets) || (typeof targets === 'string' && $
						.trim(targets).length))) {
					throwFwError(ERR_CODE_LOG_TARGETS_INVALID);
				}
				targets = wrapInArray(targets);
				for ( var i = 0, len = targets.length; i < len; i++) {
					if (!(targets[i] == null || (typeof targets[i] === 'string' && $
							.trim(targets[i]).length))) {
						throwFwError(ERR_CODE_LOG_TARGETS_INVALID);
					}
					var targetName = targets[i];
					if (!targetName) {
						continue;
					}
					if ($.inArray(targetName, targetNames) !== -1) {
						throwFwError(ERR_CODE_LOG_TARGETS_NAMED_MULTIPLE_TIMES, targetName);
					}
					var l = _logTarget[targetName];
					if (!l) {
						throwFwError(ERR_CODE_LOG_TARGETS_IS_NONE, targetName);
					}
					targetNames.push(targetName);
					compiledTargets.push(l.compiledTarget);
				}
				if (!isDefault) {
					var defaultTargets = _dOut.targets;
					if (defaultTargets != null) {
						defaultTargets = wrapInArray(defaultTargets);
						for ( var i = 0, len = defaultTargets.length; i < len; i++) {
							var targetName = defaultTargets[i];
							if ($.inArray(targetName, targetNames) === -1) {
								compiledTargets.push(_dOut.compiledTargets[i]);
								targetNames.push(targetName);
							}
						}
					}
				}
			}
			out.compiledTargets = compiledTargets;
		}

		compiledLogSettings = $.extend(true, {}, h5.settings.log ? h5.settings.log : {
			defaultOut: defaultOut
		});
		var logTarget = compiledLogSettings.target;
		if (!logTarget) {
			logTarget = {};
			compiledLogSettings.target = logTarget;
		}
		compileLogTarget(logTarget);
		var dOut = compiledLogSettings.defaultOut;
		if (!dOut) {
			dOut = defaultOut;
			compiledLogSettings.defaultOut = dOut;
		}
		compileOutput(logTarget, dOut);
		var outs = compiledLogSettings.out;
		if (outs) {
			outs = wrapInArray(outs);
			for ( var i = 0, len = outs.length; i < len; i++) {
				compileOutput(logTarget, outs[i], dOut);
			}
		}
	};

	/**
	 * ログを生成するクラス
	 *
	 * @class
	 * @name Log
	 */
	function Log(category) {
		// categoryの指定が文字列以外、または空文字、空白文字ならエラー。
		if (typeof category !== 'string' || $.trim(category).length === 0) {
			throwFwError(ERR_CODE_CATEGORY_INVALID);
		}

		/**
		 * ログカテゴリ
		 *
		 * @memberOf Log
		 * @type String
		 * @name category
		 */
		this.category = $.trim(category);
	}

	Log.prototype = {
		/**
		 * ログ出力時、スタックトレース(関数呼び出し関係)を表示するか設定します。<br>
		 * (デフォルト: false[表示しない])
		 *
		 * @type Boolean
		 * @memberOf Log
		 */
		enableStackTrace: false,

		/**
		 * ログに表示するトレースの最大数を設定します。<br>
		 * (デフォルト:10)
		 *
		 * @type Number
		 * @memberOf Log
		 */
		maxStackSize: 10,

		/**
		 * LEVEL.ERROR レベルのログを出力します。
		 * <p>
		 * 引数がObject型の場合はオブジェクト構造を、String型の場合は引数の書式に合わせてログを出力します。
		 * <p>
		 * 書式については、h5.u.str.format関数のドキュメントを参照下さい。
		 *
		 * @see h5.u.str.format
		 * @memberOf Log
		 * @function
		 * @param {Any} var_args コンソールに出力する内容
		 */
		error: function(var_args) {
			this._log(logLevel.ERROR, arguments, this.error);
		},

		/**
		 * LEVEL.WARN レベルのログを出力します。
		 * <p>
		 * 引数がObject型の場合はオブジェクト構造を、String型の場合は引数の書式に合わせてログを出力します。
		 * <p>
		 * 書式については、h5.u.str.format関数のドキュメントを参照下さい。
		 *
		 * @see h5.u.str.format
		 * @memberOf Log
		 * @function
		 * @param {Any} var_args コンソールに出力する内容
		 */
		warn: function(var_args) {
			this._log(logLevel.WARN, arguments, this.warn);
		},

		/**
		 * LEVEL.INFO レベルのログを出力します。
		 * <p>
		 * 引数がObject型の場合はオブジェクト構造を、String型の場合は引数の書式に合わせてログを出力します。
		 * <p>
		 * 書式については、h5.u.str.format関数のドキュメントを参照下さい。
		 *
		 * @see h5.u.str.format
		 * @memberOf Log
		 * @function
		 * @param {Any} var_args コンソールに出力する内容
		 */
		info: function(var_args) {
			this._log(logLevel.INFO, arguments, this.info);
		},

		/**
		 * LEVEL.DEBUG レベルのログを出力します。
		 * <p>
		 * 引数がObject型の場合はオブジェクト構造を、String型の場合は引数の書式に合わせてログを出力します。
		 * <p>
		 * 書式については、h5.u.str.format関数のドキュメントを参照下さい。
		 *
		 * @see h5.u.str.format
		 * @function
		 * @memberOf Log
		 * @param {Any} var_args コンソールに出力する内容
		 */
		debug: function(var_args) {
			this._log(logLevel.DEBUG, arguments, this.debug);
		},

		/**
		 * LEVEL.TRACE レベルのログを出力します。
		 * <p>
		 * 引数がObject型の場合はオブジェクト構造を、String型の場合は引数の書式に合わせてログを出力します。
		 * <p>
		 * 書式については、h5.u.str.format関数のドキュメントを参照下さい。
		 *
		 * @see h5.u.str.format
		 * @memberOf Log
		 * @function
		 * @param {Any} var_args コンソールに出力する内容
		 */
		trace: function(var_args) {
			this._log(logLevel.TRACE, arguments, this.trace);
		},

		/**
		 * スタックトレース(関数呼び出し関係)を取得します。
		 *
		 * @private
		 * @memberOf Log
		 * @function
		 * @param fn {Function} トレース対象の関数
		 * @returns {Object} スタックトレース<br>
		 *
		 * <pre>
		 * {
		 *   all: 全てトレースした文字列,
		 *   recent: Logクラス/LogTargetクラスのメソッドは省いた最大3件トレースした文字列
		 *    &quot;[func1_2 () &lt;- func1_1 () &lt;- func1 () ...]&quot;
		 * }
		 * </pre>
		 */
		_traceFunctionName: function(fn) {
			var e = new Error();
			var errMsg = e.stack || e.stacktrace;
			var result = {};
			var traces = [];

			if (errMsg) {
				// トレースされたログのうち、トレースの基点から3メソッド分(_traceFunction、_log、
				// debug|info|warn|error|trace)はログに出力しない。
				var DROP_TRACE_COUNT = 3;

				// Chrome, FireFox, Opera
				traces = errMsg.replace(/\r\n/, '\n').replace(
						/at\b|@|Error\b|\t|\[arguments not available\]/ig, '').replace(
						/(http|https|file):.+[0-9]/g, '').replace(/ +/g, ' ').split('\n');

				var ret = null;
				traces = $.map(traces, function(value) {
					if (value.length === 0) {
						ret = null; // 不要なデータ(Chromeは配列の先頭, FireFoxは配列の末尾に存在する)
					} else if ($.trim(value) === '') {
						ret = '{anonymous}'; // ログとして出力されたが関数名が無い
					} else {
						ret = $.trim(value);
					}
					return ret;
				});

				result = getTraceResult(traces.slice(DROP_TRACE_COUNT, traces.length), traces
						.slice(0, this.maxStackSize));
			} else {
				// IE, Safari
				var currentCaller = fn.caller;
				var index = 0;

				if (!currentCaller) {
					getTraceResult('{unable to trace}', '{unable to trace}');
				} else {
					while (true) {
						var argStr = parseArgs(currentCaller.arguments);
						var funcName = getFunctionName(currentCaller);

						if (funcName) {
							traces.push('{' + funcName + '}(' + argStr + ')');
						} else {
							if (!currentCaller.caller) {
								traces.push('{root}(' + argStr + ')');
							} else {
								traces.push('{anonymous}(' + argStr + ')');
							}
						}

						if (!currentCaller.caller || index >= this.maxStackSize) {
							result = getTraceResult(traces, traces);
							break;
						}

						currentCaller = currentCaller.caller;
						index++;
					}
				}
			}
			return result;
		},

		/**
		 * ログ情報を保持するオブジェクトに以下の情報を付与し、コンソールまたはリモートサーバにログを出力します。
		 * <ul>
		 * <li>時刻
		 * <li>ログの種別を表す文字列(ERROR, WARN, INFO, DEBUG, TRACE, OTHER)
		 * </ul>
		 *
		 * @private
		 * @memberOf Log
		 * @function
		 * @param {Number} level ログレベル
		 * @param {Arguments} args 引数
		 * @param {Function} func 元々呼ばれた関数
		 */
		_log: function(level, args, func) {
			var logObj = {
				level: level,
				args: h5.u.obj.argsToArray(args),
				stackTrace: this.enableStackTrace ? this._traceFunctionName(func) : ''
			};

			var outs = compiledLogSettings.out;
			var defaultOut = compiledLogSettings.defaultOut;

			var targetOut = null;
			if (outs) {
				outs = wrapInArray(outs);
				for ( var i = 0, len = outs.length; i < len; i++) {
					var out = outs[i];
					if (!out.compiledCategory.test(this.category)) {
						continue;
					}
					targetOut = out;
					break;
				}
			}
			if (!targetOut) {
				targetOut = defaultOut;
			}
			var levelThreshold = targetOut.compiledLevel;
			var logTarget = targetOut.compiledTargets;

			if (level < levelThreshold || levelThreshold < 0) {
				return;
			}

			logObj.logger = this;
			logObj.date = new Date();
			logObj.levelString = this._levelToString(level);

			if (!logTarget || logTarget.length === 0) {
				return;
			}

			for ( var i = 0, len = logTarget.length; i < len; i++) {
				logTarget[i].log(logObj);
			}
		},

		/**
		 * ログレベルを判定して、ログの種別を表す文字列を取得します。
		 *
		 * @private
		 * @memberOf Log
		 * @function
		 * @param {Object} level
		 */
		_levelToString: levelToString
	};

	/**
	 * ロガーを作成します。
	 *
	 * @param {String} [category=null] カテゴリ.
	 * @returns {Log} ロガー.
	 * @name createLogger
	 * @function
	 * @memberOf h5.log
	 * @see Log
	 */
	var createLogger = function(category) {
		return new Log(category);
	};

	// =============================
	// Expose to window
	// =============================

	/**
	 * @namespace
	 * @name log
	 * @memberOf h5
	 */
	h5.u.obj.expose('h5.log', {
		createLogger: createLogger,
		configure: configure
	});
})();


/* ------ (h5) ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	// TODO エラーコード定数等Minify版（製品利用版）でも必要なものはここに書く

	// =============================
	// Development Only
	// =============================

	// var fwLogger = h5.log.createLogger(); //TODO カテゴリ名(ファイル名から拡張子を除いたもの)を入れる

	/* del begin */

	// TODO Minify時にプリプロセッサで削除されるべきものはこの中に書く
	/* del end */


	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// TODO 高速化のために他で定義されている関数などを変数に入れておく場合はここに書く
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	// TODO モジュールレベルのプライベート変数はここに書く
	// =============================
	// Functions
	// =============================

	/**
	 * すべてのアスペクト設定をコンパイルします。
	 *
	 * @param {Object|Object[]} aspects アスペクト設定
	 */
	function compileAspects(aspects) {
		var compile = function(aspect) {
			if (aspect.target) {
				aspect.compiledTarget = getRegex(aspect.target);
			}
			if (aspect.pointCut) {
				aspect.compiledPointCut = getRegex(aspect.pointCut);
			}
			return aspect;
		};
		h5.settings.aspects = $.map(wrapInArray(aspects), function(n) {
			return compile(n);
		});
	}


	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * 設定を格納するh5.settingsオブジェクト
	 *
	 * @name settings
	 * @memberOf h5
	 * @namespace
	 */
	h5.u.obj.ns('h5.settings');

	h5.settings = {

		/**
		 * failコールバックが設定されていない時にrejectされた場合に発動する共通ハンドラ.
		 *
		 * @memberOf h5.settings
		 * @type Function
		 */
		commonFailHandler: null,

		/**
		 * コントローラ、ロジックへのアスペクト
		 *
		 * @memberOf h5.settings
		 * @type Aspect|Aspect[]
		 */
		aspects: null,

		/**
		 * ログの設定を行います。
		 *
		 * @memberOf h5.settings
		 * @type Object
		 */
		log: null
	};

	// h5preinitでglobalAspectsの設定をしている関係上、別ファイルではなく、ここに置いている。
	/**
	 * 実行時間の計測を行うインターセプタ。
	 *
	 * @function
	 * @param {Function} invocation 次に実行する関数
	 * @returns {Any} invocationの戻り値
	 * @memberOf h5.core.interceptor
	 */
	var lapInterceptor = h5.u.createInterceptor(function(invocation, data) {
		// 開始時間をdataオブジェクトに格納
		data.start = new Date();
		// invocationを実行
		return invocation.proceed();
	}, function(invocation, data) {
		// 終了時間を取得
		var end = new Date();
		// ログ出力
		this.log.info('{0} "{1}": {2}ms', this.__name, invocation.funcName, (end - data.start));
	});

	/**
	 * イベントコンテキストに格納されているものをコンソールに出力するインターセプタ。
	 *
	 * @function
	 * @param {Function} invocation 次に実行する関数
	 * @returns {Any} invocationの戻り値
	 * @memberOf h5.core.interceptor
	 */
	var logInterceptor = h5.u.createInterceptor(function(invocation) {
		this.log.info('{0} "{1}"が開始されました。', this.__name, invocation.funcName);
		this.log.info(invocation.args);
		return invocation.proceed();
	}, function(invocation) {
		this.log.info('{0} "{1}"が終了しました。', this.__name, invocation.funcName);
	});

	/**
	 * invocationからあがってきたエラーを受け取りcommonFailHandlerに処理を任せるインターセプタ。
	 *
	 * @param {Function} invocation 次に実行する関数
	 * @returns {Any} invocationの戻り値
	 * @memberOf h5.core.interceptor
	 */
	var errorInterceptor = function(invocation) {
		var ret = null;
		try {
			ret = invocation.proceed();
		} catch (e) {
			if (h5.settings.commonFailHandler && $.isFunction(h5.settings.commonFailHandler)) {
				h5.settings.commonFailHandler.call(null, e);
			}
		}
		return ret;
	};

	// ここで公開しないとh5preinit時にデフォルトインターセプタが定義されていないことになる
	/**
	 * @name interceptor
	 * @memberOf h5.core
	 * @namespace
	 */
	h5.u.obj.expose('h5.core.interceptor', {
		lapInterceptor: lapInterceptor,
		logInterceptor: logInterceptor,
		errorInterceptor: errorInterceptor
	});

	// h5preinitイベントをトリガ.
	$(window.document).trigger('h5preinit');

	if (h5.settings.aspects) {
		compileAspects(h5.settings.aspects);
	}

	// ログ設定の適用
	h5.log.configure();

	// =============================
	// Expose to window
	// =============================
	/* del begin */
	// テストのために公開している。
	h5.u.obj.expose('h5.core', {
		_compileAspects: compileAspects
	});
	/* del end */
})();


/* ------ h5.env ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	// TODO エラーコード定数等Minify版（製品利用版）でも必要なものはここに書く

	// =============================
	// Development Only
	// =============================

	/* del begin */

	// TODO Minify時にプリプロセッサで削除されるべきものはこの中に書く
	/* del end */


	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// TODO 高速化のために他で定義されている関数などを変数に入れておく場合はここに書く
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	// TODO モジュールレベルのプライベート変数はここに書く
	// =============================
	// Functions
	// =============================
	function check(ua) {
		/**
		 * iPhoneであるかどうかを表します。
		 *
		 * @name isiPhone
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isiPhone = !!ua.match(/iPhone/i);
		/**
		 * iPadであるかどうかを表します。
		 *
		 * @name isiPad
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isiPad = !!ua.match(/iPad/i);
		/**
		 * iOSであるかどうかを表します。
		 *
		 * @name isiOS
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isiOS = isiPhone || isiPad;
		/**
		 * Androidであるかどうかを表します。
		 *
		 * @name isAndroid
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isAndroid = !!ua.match(/android/i);
		/**
		 * Windows Phoneであるかどうかを表します。
		 *
		 * @name isWindowsPhone
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isWindowsPhone = !!ua.match(/Windows Phone/i);
		/**
		 * ブラウザがInternet Explorerであるかどうかを表します。
		 *
		 * @name isIE
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isIE = !!ua.match(/MSIE/);
		/**
		 * ブラウザがFirefoxであるかどうかを表します。
		 *
		 * @name isFirefox
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isFirefox = !!ua.match(/Firefox/i);
		/**
		 * ブラウザがGoogle Chromeであるかどうかを表します。
		 *
		 * @name isChrome
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isChrome = !!ua.match(/Chrome/i) || !!ua.match(/CrMo/);
		/**
		 * ブラウザがSafariであるかどうかを表します。
		 *
		 * @name isSafari
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isSafari = !isAndroid && !!ua.match(/Safari/i) && !isChrome;
		/**
		 * レンダリングエンジンがWebkitであるかどうかを表します。
		 *
		 * @name isFirefox
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isWebkit = !!ua.match(/Webkit/i);
		/**
		 * ブラウザがOperaであるかどうかを表します。
		 *
		 * @name isOpera
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isOpera = !!ua.match(/Opera/i);
		/**
		 * ブラウザがAndroid標準ブラウザであるかどうかを表します。
		 *
		 * @name isOpera
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isAndroidDefaultBrowser = isAndroid && !!ua.match(/Safari/i) && !isChrome;
		/**
		 * スマートフォンであるかどうかを表します。<br />
		 * isiPhone, isWindowsPhoneがtrueならtrueとなります。<br />
		 * Androidの場合、判定は以下の場合にtrueとなります。
		 * <ul>
		 * <li>Android標準ブラウザ、かつユーザーエージェントに"Mobile"を含む、かつ"SC-01C"を含まない。 </li>
		 * <li>ユーザーエージェントに"Fennec"を含む。</li>
		 * <li>ユーザーエージェントに"Opera Mobi"を含む。</li>
		 * </ul>
		 *
		 * @name isSmartPhone
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isSmartPhone = !!(isiPhone || isWindowsPhone
				|| (isAndroidDefaultBrowser && ua.match(/Mobile/) && !ua.match(/SC-01C/))
				|| (isAndroid && isChrome && ua.match(/Mobile/)) || ua.match(/Fennec/i) || ua
				.match(/Opera Mobi/i));
		/**
		 * タブレットであるかどうかを表します。<br />
		 * isiPadがtrueならtrueとなります。<br />
		 * Androidの場合、判定は以下の場合にtrueとなります。
		 * <ul>
		 * <li>Android標準ブラウザ、かつユーザーエージェントに"Mobile"を含まない。ただし"SC-01C"を含む場合はtrue。 </li>
		 * <li>ユーザーエージェントに"Fennec"を含む。</li>
		 * <li>ユーザーエージェントに"Opera Tablet"を含む。</li>
		 * </ul>
		 *
		 * @name isTablet
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isTablet = !!(isiPad || (isAndroidDefaultBrowser && !ua.match(/Mobile/))
				|| (isAndroid && isChrome && !ua.match(/Mobile/)) || ua.match(/SC-01C/)
				|| ua.match(/Fennec/i) || ua.match(/Opera Tablet/i));
		/**
		 * PCであるかどうかを表します。
		 *
		 * @name isDesktop
		 * @type Boolean
		 * @memberOf h5.env.ua
		 */
		var isDesktop = !isSmartPhone && !isTablet;
		/**
		 * OSのバージョンを表します。<br />
		 * h5.env.ua.isDesktopがtrueである場合、値はnullになります。
		 *
		 * @name osVersion
		 * @type Number
		 * @memberOf h5.env.ua
		 */
		var osVersion = null;
		/**
		 * OSのフルバージョンを表します。<br />
		 * h5.env.ua.isDesktopがtrueである場合、値はnullになります。
		 *
		 * @name osVersionFull
		 * @type String
		 * @memberOf h5.env.ua
		 */
		var osVersionFull = null;
		var getiOSVersion = function(pre, post) {
			return $.trim(ua.substring(ua.indexOf(pre) + pre.length, ua.indexOf(post))).split('_');
		};
		var getVersion = function(target, end, ignoreCase) {
			var r = ignoreCase === false ? new RegExp(target + end) : new RegExp(target + end, 'i');
			return $.trim(ua.match(r));
		};
		var spaceSplit = function(target, ignoreCase) {
			var v = getVersion(target, '[^;)]*', ignoreCase).split(' ');
			if(v.length === 1) return '';
			return v[v.length - 1];
		};
		var slashSplit = function(target, ignoreCase) {
			var v = getVersion(target, '[^;) ]*', ignoreCase).split('/');
			if(v.length === 1) return '';
			return v[v.length - 1];
		};
		var getMainVersion = function(target) {
			return parseInt(target.split('.')[0]);
		};
		if (isiPhone) {
			var s = getiOSVersion('iPhone OS', 'like');
			osVersion = parseInt(s[0]);
			osVersionFull = s.join('.');
		} else if (isiPad) {
			var s = getiOSVersion('CPU OS', 'like');
			osVersion = parseInt(s[0]);
			osVersionFull = s.join('.');
		} else if (isAndroid && isFirefox) {
			// FennecはAndroidのバージョンを取得することができない。
		} else if (isAndroid) {
			var s = spaceSplit('Android');
			osVersion = getMainVersion(s);
			osVersionFull = s;
		} else if (isWindowsPhone) {
			var s = spaceSplit('Windows Phone OS');
			if (!s) {
				s = spaceSplit('Windows Phone');
			}
			osVersion = getMainVersion(s);
			osVersionFull = s;
		}
		// Operaのuaに'MSIE'が入っているとき用に、isIE && isOperaならisIEをfalseにする
		if(isIE && isOpera){
			isIE = false;
		}

		// デスクトップの場合。osVersion, osVersionFullはnull
		/**
		 * ブラウザのバージョンを表します。
		 *
		 * @name browserVersion
		 * @type Number
		 * @memberOf h5.env.ua
		 */
		var browserVersion = null;
		/**
		 * ブラウザのフルバージョンを表します。
		 *
		 * @name browserVersionFull
		 * @type String
		 * @memberOf h5.env.ua
		 */
		var browserVersionFull = null;
		if (isiOS || (isAndroid && isAndroidDefaultBrowser)) {
			browserVersion = osVersion;
			browserVersionFull = osVersionFull;
		} else {
			var version = null;
			if (isIE) {
				version = spaceSplit('MSIE', false);
			} else if (isChrome) {
				version = slashSplit('Chrome', false);
				if (!version) {
					version = slashSplit('CrMo', false);
				}
			} else if (isSafari) {
				version = slashSplit('Version');
			} else if (isFirefox) {
				version = slashSplit('Firefox');
			} else if (isOpera) {
				version = slashSplit('Version');
				if (!version) {
					version = slashSplit('Opera');
				}
				if (!version) {
					version = spaceSplit('Opera');
				}
			}
			if (version) {
				browserVersion = getMainVersion(version);
				browserVersionFull = version;
			}
		}
		return {
			osVersion: osVersion,
			osVersionFull: osVersionFull,
			browserVersion: browserVersion,
			browserVersionFull: browserVersionFull,
			isiPhone: isiPhone,
			isiPad: isiPad,
			isiOS: isiOS,
			isAndroid: isAndroid,
			isWindowsPhone: isWindowsPhone,
			isIE: isIE,
			isFirefox: isFirefox,
			isChrome: isChrome,
			isSafari: isSafari,
			isOpera: isOpera,
			isAndroidDefaultBrowser: isAndroidDefaultBrowser,
			isSmartPhone: isSmartPhone,
			isTablet: isTablet,
			isDesktop: isDesktop,
			isWebkit: isWebkit
		};
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	// =============================
	// Expose to window
	// =============================
	/**
	 * @namespace
	 * @name env
	 * @memberOf h5
	 */
	/**
	 * ユーザーエージェントからOS、ブラウザを判別します。<br />
	 * 『Geolocationが使えるか』等機能の有無を判別したい場合は、これらのプロパティを使わず機能の有無をチェックしてください。<br />
	 * たとえばGeolocation機能はh5.api.geo.isSupportedで判別できます。
	 *
	 * @namespace
	 * @name ua
	 * @memberOf h5.env
	 */
	h5.u.obj.expose('h5.env', {
		ua: check(navigator.userAgent)
	});
	/* del begin */
	// テストのためにグローバルに公開。プリプロセッサで削除される。
	h5.u.obj.expose('h5.env', {
		__check: check
	});
	/* del end */
})();


/* ------ h5.async ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	/**
	 * テンプレート文字列のコンパイル時に発生するエラー
	 */
	var ERR_CODE_NOT_ARRAY = 5000;

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_NOT_ARRAY] = 'h5.async.each() の第1引数は配列のみを扱います。';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);

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
	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * 登録された共通のエラー処理を実行できるDeferredオブジェクトを返します。<br>
	 * Deferredに notify() / notifyWith() / progress() メソッドがない場合は、追加したオブジェクトを返します。
	 *
	 * @returns {Deferred} Deferredオブジェクト
	 * @name deferred
	 * @function
	 * @memberOf h5.async
	 */
	var deferred = function() {
		var dfd = $.Deferred();
		// jQuery1.6.xにはDeferred.notify/notifyWith/progressがない
		if (!dfd.notify && !dfd.notifyWith && !dfd.progress) {
			// 既にnorify/notifyWithが呼ばれたかどうかのフラグ
			var notified = false;
			// 最後に指定された実行コンテキスト
			var lastNotifyContext = null;
			// 最後に指定されたパラメータ
			var lastNotifyParam = null;
			// progressCallbacksを格納するための配列
			dfd.__h5__progressCallbacks = [];
			// progressCallbacksに対応したprogressFilterの配列を格納するための配列
			dfd.__h5__progressFilters = [];

			var progress = function(progressCallback) {
				// 既にnorify/notifyWithが呼ばれていた場合、jQuery1.7.xの仕様と同じにするためにコールバックの登録と同時に実行する必要がある
				var filters = this.__h5__progressPipeFilters;
				if (notified) {
					var params = lastNotifyParam;
					// pipe()でprogressFilterが登録されいたら値をフィルタに通す
					if (filters && filters.length > 0) {
						for ( var i = 0, fLen = filters.length; i < fLen; i++) {
							params = filters[i].apply(this, wrapInArray(params));
						}
					}
					if (params !== lastNotifyParam) {
						params = wrapInArray(params);
					}
					progressCallback.apply(lastNotifyContext, params);
				}
				dfd.__h5__progressCallbacks.push(progressCallback);
				dfd.__h5__progressFilters.push(filters);
				return this;
			};
			dfd.progress = progress;
			var originalPromise = dfd.promise;
			dfd.promise = function(obj) {
				var promise = originalPromise.call(this, obj);
				// プロミスにprogress()を追加
				promise.progress = progress;
				return promise;
			};

			dfd.notify = function(/* var_args */) {
				notified = true;
				if (arguments.length !== -1) {
					lastNotifyContext = this;
					lastNotifyParam = h5.u.obj.argsToArray(arguments);
				}
				var callbacks = dfd.__h5__progressCallbacks;
				var filters = dfd.__h5__progressFilters;
				var args = h5.u.obj.argsToArray(arguments);
				// progressコールバックが登録されていたら全て実行する
				if (callbacks.length > 0) {
					for ( var i = 0, callbackLen = callbacks.length; i < callbackLen; i++) {
						var params = args;
						// pipe()でprogressFilterが登録されいたら値をフィルタに通す
						if (filters[i] && filters[i].length > 0) {
							for ( var j = 0, fLen = filters[i].length; j < fLen; j++) {
								params = filters[i][j].apply(this, wrapInArray(params));
							}
						}
						if (params !== arguments) {
							params = wrapInArray(params);
						}
						callbacks[i].apply(this, params);
					}
				}
				return this;
			};

			dfd.notifyWith = function(context, args) {
				notified = true;
				lastNotifyContext = context;
				lastNotifyParam = args;
				var callbacks = this.__h5__progressCallbacks;
				var filters = this.__h5__progressFilters;
				// progressコールバックが登録されていたら全て実行する
				if (callbacks.length > 0) {
					for ( var i = 0, callbackLen = callbacks.length; i < callbackLen; i++) {
						var params = args;
						// pipe()でprogressFilterが登録されいたら値をフィルタに通す
						if (filters[i] && filters[i].length > 0) {
							for ( var j = 0, fLen = filters[i].length; j < fLen; j++) {
								params = filters[i][j].apply(this, wrapInArray(params));
							}
						}
						if (params !== args) {
							params = wrapInArray(params);
						}
						callbacks[i].apply(context, params);
					}
				}
				return this;
			};

			var originalPipe = dfd.pipe;
			dfd.pipe = function(doneFilter, failFilter, progressFilter) {
				// pipe()の戻り値であるfilteredは元のDeferredオブジェクトとはインスタンスが異なる
				var filtered = originalPipe.call(this, doneFilter, failFilter);
				if (progressFilter) {
					if (!this.__h5__progressPipeFilters) {
						filtered.__h5__progressPipeFilters = [progressFilter];
					} else {
						filtered.__h5__progressPipeFilters = this.__h5__progressPipeFilters
								.concat([progressFilter]);
					}
				}
				filtered.pipe = dfd.pipe;
				filtered.progress = dfd.progress;
				return filtered;
			};
		}
		// failコールバックが1つ以上登録されたかどうかのフラグ
		var existFailHandler = false;

		var originalFail = dfd.fail;
		var fail = function(/* var_args */) {
			if (arguments.length > 0) {
				existFailHandler = true;
			}
			return originalFail.apply(this, arguments);
		};
		dfd.fail = fail;

		var originalAlways = dfd.always;
		var always = function(/* var_args */) {
			if (arguments.length > 0) {
				existFailHandler = true;
			}
			return originalAlways.apply(this, arguments);
		};
		dfd.always = always;

		var then = function(doneCallbacks, failCallbacks, progressCallbacks) {
			if (doneCallbacks) {
				this.done.apply(this, wrapInArray(doneCallbacks));
			}
			if (failCallbacks) {
				this.fail.apply(this, wrapInArray(failCallbacks));
			}
			if (progressCallbacks) {
				this.progress.apply(this, wrapInArray(progressCallbacks));
			}
			return this;
		};
		dfd.then = then;

		var originalReject = dfd.reject;
		var reject = function(/* var_args */) {
			var commonFailHandler = h5.settings.commonFailHandler;
			// failコールバックが1つもない、かつcommonFailHandlerがある場合は、commonFailHandlerを登録する
			if (!existFailHandler && commonFailHandler) {
				originalFail.call(this, commonFailHandler);
			}
			return originalReject.apply(this, arguments);
		};
		dfd.reject = reject;
		var originalRejectWith = dfd.rejectWith;
		var rejectWith = function(/* var_args */) {
			var commonFailHandler = h5.settings.commonFailHandler;
			// failコールバックが1つもない、かつcommonFailHandlerがある場合は、commonFailHandlerを登録する
			if (!existFailHandler && commonFailHandler) {
				this.fail(commonFailHandler);
			}
			return originalRejectWith.apply(this, arguments);
		};
		dfd.rejectWith = rejectWith;
		var p = dfd.promise;
		dfd.promise = function(obj) {
			var promise = p.call(this, obj);
			promise.always = always;
			promise.then = then;
			promise.fail = fail;
			return promise;
		};
		return dfd;
	};

	/**
	 * オブジェクトがPromiseオブジェクトであるかどうかを返します。<br />
	 * オブジェクトがDeferredオブジェクトの場合、falseが返ります。
	 *
	 * @param {Object} object オブジェクト
	 * @returns {Boolean} オブジェクトがPromiseオブジェクトであるかどうか
	 * @name isPromise
	 * @function
	 * @memberOf h5.async
	 */
	var isPromise = function(object) {
		return !!object && object.done && object.fail && !object.resolve && !object.reject;
	};

	/**
	 * 指定された回数ごとにループを抜けブラウザに制御を戻すユーティリティメソッドです。
	 *
	 * @param {Any[]} array 配列
	 * @param {Function} callback コールバック関数。<br />
	 *            コールバックには引数として現在のインデックス、現在の値、ループコントローラが渡されます。<br />
	 *            callback(index, value, loopControl) <br />
	 *            loopControlは以下の3つのメソッドを持っています。<br />
	 *            <ul>
	 *            <li>pause - 処理の途中でポーズをかけます。</li>
	 *            <li>resume - ポーズを解除し処理を再開します。</li>
	 *            <li>stop - 処理を中断します。1度stopで中断すると再開することはできません。</li>
	 *            </ul>
	 * @param {Number} [suspendOnTimes=20] 何回ごとにループを抜けるか。デフォルトは20回です。
	 * @returns {Promise} Promiseオブジェクト
	 * @name loop
	 * @function
	 * @memberOf h5.async
	 */
	var loop = function(array, callback, suspendOnTimes) {
		if (!$.isArray(array)) {
			throwFwError(ERR_CODE_NOT_ARRAY);
		}
		var dfd = deferred();
		// 何回ごとにループを抜けるか。デフォルトは20回
		var st = $.type(suspendOnTimes) === 'number' ? suspendOnTimes : 20;
		var userReject = false;
		var index = 0;
		var len = array.length;
		var execute,loopControl = null;
		var each = function() {
			if (index === len) {
				dfd.resolve(array);
				return;
			} else if (userReject) {
				dfd.reject(array);
				return;
			}
			var ret = callback.call(array, index, array[index], loopControl);
			index++;
			if (isPromise(ret)) {
				ret.done(function() {
					execute();
				}).fail(function() {
					userReject = true;
					execute();
				});
			} else {
				execute();
			}
		};
		var async = function() {
			setTimeout(function() {
				var i = index - 1;
				if (index > 0) {
					dfd.notify({
						data: array,
						index: i,
						value: array[i]
					});
				}
				each();
			}, 0);
		};
		var pause = false;
		execute = function() {
			if (pause) {
				return;
			}
			index % st === 0 ? async() : each();
		};
		var stopFlag = false;
		loopControl = {
			resume: function() {
				if (!stopFlag && pause) {
					pause = false;
					execute();
				}
			},
			pause: function() {
				pause = true;
			},
			stop: function() {
				stopFlag = true;
				dfd.resolve(array);
			}
		};
		async();
		return dfd.promise();
	};

	// =============================
	// Expose to window
	// =============================

	/**
	 * @namespace
	 * @name async
	 * @memberOf h5
	 */
	h5.u.obj.expose('h5.async', {
		deferred: deferred,
		isPromise: isPromise,
		loop: loop
	});

})();


/* ------ h5.ajax ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	// TODO エラーコード定数等Minify版（製品利用版）でも必要なものはここに書く

	// =============================
	// Development Only
	// =============================

	/* del begin */

	// TODO Minify時にプリプロセッサで削除されるべきものはこの中に書く
	/* del end */


	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// TODO 高速化のために他で定義されている関数などを変数に入れておく場合はここに書く
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	// TODO モジュールレベルのプライベート変数はここに書く
	// =============================
	// Functions
	// =============================
	// TODO モジュールレベルのプライベート関数はここに書く
	// 関数は関数式ではなく function myFunction(){} のように関数定義で書く
	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * HTTP通信を行います。<br />
	 * 基本的に使い方は、<a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax()</a>と同じです。<br />
	 *
	 * jQuery.ajax()と異なる点は共通のエラーハンドラが定義できることです。<br/>
	 * h5.settings.commonFailHandlerに関数を設定し、h5.ajax()に引数として渡すオプションにerror/completeコールバックが設定されていない、<br />
	 * もしくは戻り値のPromiseオブジェクトに対するfail/alwaysコールバックが設定されていない場合にエラーが発生すると <br />
	 * h5.settings.commonFailHandlerに設定した関数が呼ばれます。
	 *
	 * @param {Any} var_args jQuery.ajaxに渡す引数
	 * @returns {Promise} Promiseオブジェクト
	 * @name ajax
	 * @function
	 * @memberOf h5
	 */
	var ajax = function(var_args) {
		var opt = typeof arguments[0] === 'string' ? arguments[1] : arguments[0];
		var hasFailCallback = opt && (opt.error || opt.fail || opt.complete || opt.always);
		var jqXHR = $.ajax.apply($, arguments);

		if (!jqXHR.progress) {
			jqXHR.progress = function() {
			// notifyされることはないので空にしている
			};
		}

		var callFail = false;
		var commonFailHandler = h5.settings.commonFailHandler;
		if (!hasFailCallback && commonFailHandler) {
			jqXHR.fail(function(/* var_args */) {
				if (!callFail) {
					commonFailHandler.apply(null, arguments);
				}
			});
			var originalFail = jqXHR.fail;
			jqXHR.fail = function(/* var_args */) {
				callFail = true;
				return originalFail.apply(jqXHR, arguments);
			};
			jqXHR.error = jqXHR.fail;

			var originalAlways = jqXHR.always;
			jqXHR.always = function(/* var_args */) {
				callFail = true;
				return originalAlways.apply(jqXHR, arguments);
			};
			jqXHR.complete = jqXHR.always;

			jqXHR.then = function(doneCallbacks, failCallbacks, progressCallbacks) {
				if (doneCallbacks) {
					jqXHR.done.apply(jqXHR, wrapInArray(doneCallbacks));
				}
				if (failCallbacks) {
					jqXHR.fail.apply(jqXHR, wrapInArray(failCallbacks));
				}
				if (progressCallbacks) {
					jqXHR.progress.apply(jqXHR, wrapInArray(progressCallbacks));
				}
				return jqXHR;
			};
		}
		return jqXHR;
	};


	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5', {
		ajax: ajax
	});
})();


/* ------ h5.core.controller ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================
	var TEMPLATE_LOAD_RETRY_COUNT = 3;
	var TEMPLATE_LOAD_RETRY_INTERVAL = 3000;
	var TYPE_OF_UNDEFINED = 'undefined';
	var SUFFIX_CONTROLLER = 'Controller';
	var SUFFIX_LOGIC = 'Logic';
	var EVENT_NAME_H5_TRACKSTART = 'h5trackstart';
	var EVENT_NAME_H5_TRACKMOVE = 'h5trackmove';
	var EVENT_NAME_H5_TRACKEND = 'h5trackend';
	var ROOT_ELEMENT_NAME = 'rootElement';

	// エラーコード
	/** エラーコード: テンプレートに渡すセレクタが不正 */
	var ERR_CODE_INVALID_TEMPLATE_SELECTOR = 6000;
	/** エラーコード: バインド対象が指定されていない */
	var ERR_CODE_BIND_TARGET_REQUIRED = 6001;
	/** エラーコード: bindControllerメソッドにコントローラではないオブジェクトが渡された */
	var ERR_CODE_BIND_NOT_CONTROLLER = 6002;
	/** エラーコード: バインド対象となるDOMがない */
	var ERR_CODE_BIND_NOT_TARGET = 6003;
	/** エラーコード: バインド対象となるDOMが複数存在する */
	var ERR_CODE_BIND_TARGET_COMPLEX = 6004;
	/** エラーコード: エラータイプが指定されていない */
	var ERR_CODE_CUSTOM_ERROR_TYPE_REQUIRED = 6005;
	/** エラーコード: コントローラの名前が指定されていない */
	var ERR_CODE_CONTROLLER_NAME_REQUIRED = 6006;
	/** エラーコード: コントローラの初期化パラメータが不正 */
	var ERR_CODE_CONTROLLER_INVALID_INIT_PARAM = 6007;
	/** エラーコード: 既にコントローラ化されている */
	var ERR_CODE_CONTROLLER_ALREADY_CREATED = 6008;
	/** エラーコード: コントローラの参照が循環している */
	var ERR_CODE_CONTROLLER_CIRCULAR_REF = 6009;
	/** エラーコード: コントローラ内のロジックの参照が循環している */
	var ERR_CODE_LOGIC_CIRCULAR_REF = 6010;
	/** エラーコード: コントローラの参照が循環している */
	var ERR_CODE_CONTROLLER_SAME_PROPERTY = 6011;
	/** エラーコード: イベントハンドラのセレクタに{this}が指定されている */
	var ERR_CODE_EVENT_HANDLER_SELECTOR_THIS = 6012;
	/** エラーコード: あるセレクタに対して重複したイベントハンドラが設定されている */
	var ERR_CODE_SAME_EVENT_HANDLER = 6013;
	/** エラーコード: __metaで指定されたプロパティがない */
	var ERR_CODE_CONTROLLER_META_KEY_INVALID = 6014;
	/** エラーコード: __metaで指定されたプロパティがnullである */
	var ERR_CODE_CONTROLLER_META_KEY_NULL = 6015;
	/** エラーコード: __metaで指定されたプロパティがコントローラではない */
	var ERR_CODE_CONTROLLER_META_KEY_NOT_CONTROLLER = 6016;
	/** エラーコード: ロジックの名前が指定されていない */
	var ERR_CODE_LOGIC_NAME_REQUIRED = 6017;
	/** エラーコード: 既にロジック化されている */
	var ERR_CODE_LOGIC_ALREADY_CREATED = 6018;
	/** エラーコード: exposeする際にコントローラ、もしくはロジックの名前がない */
	var ERR_CODE_EXPOSE_NAME_REQUIRED = 6019;
	/** エラーコード: Viewモジュールが組み込まれていない */
	var ERR_CODE_NOT_VIEW = 6029;

	// エラーコードマップ
	var errMsgMap = {};
	errMsgMap[ERR_CODE_INVALID_TEMPLATE_SELECTOR] = 'update/append/prepend() の第1引数に"window", "navigator", または"window.", "navigator."で始まるセレクタは指定できません。';
	errMsgMap[ERR_CODE_BIND_TARGET_REQUIRED] = 'バインド対象となる要素を指定して下さい。';
	errMsgMap[ERR_CODE_BIND_NOT_CONTROLLER] = 'コントローラ化したオブジェクトを指定して下さい。';
	errMsgMap[ERR_CODE_BIND_NOT_TARGET] = 'コントローラ"{0}"のバインド対象となる要素が存在しません。';
	errMsgMap[ERR_CODE_BIND_TARGET_COMPLEX] = 'コントローラ"{0}"のバインド対象となる要素が2つ以上存在します。バインド対象は1つのみにしてください。';
	errMsgMap[ERR_CODE_CUSTOM_ERROR_TYPE_REQUIRED] = 'エラータイプを指定してください。';
	errMsgMap[ERR_CODE_CONTROLLER_NAME_REQUIRED] = 'コントローラの名前が定義されていません。__nameにコントローラ名を設定して下さい。';
	errMsgMap[ERR_CODE_CONTROLLER_INVALID_INIT_PARAM] = 'コントローラ"{0}"の初期化パラメータがプレーンオブジェクトではありません。初期化パラメータにはプレーンオブジェクトを設定してください。';
	errMsgMap[ERR_CODE_CONTROLLER_ALREADY_CREATED] = '指定されたオブジェクトは既にコントローラ化されています。';
	errMsgMap[ERR_CODE_CONTROLLER_CIRCULAR_REF] = 'コントローラ"{0}"で、参照が循環しているため、コントローラを生成できません。';
	errMsgMap[ERR_CODE_LOGIC_CIRCULAR_REF] = 'コントローラ"{0}"のロジックで、参照が循環しているため、ロジックを生成できません。';
	errMsgMap[ERR_CODE_CONTROLLER_SAME_PROPERTY] = 'コントローラ"{0}"のプロパティ"{1}"はコントローラ化によって追加されるプロパティと名前が重複しています。';
	errMsgMap[ERR_CODE_EVENT_HANDLER_SELECTOR_THIS] = 'コントローラ"{0}"でセレクタ名にthisが指定されています。コントローラをバインドした要素自身を指定したい時はrootElementを指定してください。';
	errMsgMap[ERR_CODE_SAME_EVENT_HANDLER] = 'コントローラ"{0}"のセレクタ"{1}"に対して"{2}"というイベントハンドラが重複して設定されています。';
	errMsgMap[ERR_CODE_CONTROLLER_META_KEY_INVALID] = 'コントローラ"{0}"には__metaで指定されたプロパティ"{1}"がありません。';
	errMsgMap[ERR_CODE_CONTROLLER_META_KEY_NULL] = 'コントローラ"{0}"の__metaに指定されたキー"{1}"の値がnullです。コントローラを持つプロパティキー名を指定してください。';
	errMsgMap[ERR_CODE_CONTROLLER_META_KEY_NOT_CONTROLLER] = 'コントローラ"{0}"の__metaに指定されたキー"{1}"の値はコントローラではありません。コントローラを持つプロパティキー名を指定してください。';
	errMsgMap[ERR_CODE_LOGIC_NAME_REQUIRED] = 'ロジック名が定義されていません。__nameにロジック名を設定して下さい。';
	errMsgMap[ERR_CODE_LOGIC_ALREADY_CREATED] = '指定されたオブジェクトは既にロジック化されています。';
	errMsgMap[ERR_CODE_EXPOSE_NAME_REQUIRED] = 'コントローラ、もしくはロジックの __name が設定されていません。';
	errMsgMap[ERR_CODE_NOT_VIEW] = 'テンプレートはViewモジュールがなければ使用できません。';

	addFwErrorCodeMap(errMsgMap);

	// =============================
	// Development Only
	// =============================
	var fwLogger = h5.log.createLogger('h5.core');

	/* del begin */

	// TODO Minify時にプリプロセッサで削除されるべきものはこの中に書く
	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// TODO 高速化のために他で定義されている関数などを変数に入れておく場合はここに書く
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	var getDeferred = h5.async.deferred;
	var startsWith = h5.u.str.startsWith;
	var endsWith = h5.u.str.endsWith;
	var format = h5.u.str.format;
	var argsToArray = h5.u.obj.argsToArray;
	var getByPath = h5.u.obj.getByPath;

	// =============================
	// Functions
	// =============================

	/**
	 * コントローラのexecuteListenersを見てリスナーを実行するかどうかを決定するインターセプタ。
	 *
	 * @param {Object} invocation インヴォケーション.
	 */
	function executeListenersInterceptor(invocation) {
		if (!this.__controllerContext.executeListeners) {
			return;
		}
		return invocation.proceed();
	}

	/**
	 * 指定されたオブジェクトの関数にアスペクトを織り込みます。
	 *
	 * @param {Object} controllerDefObject オブジェクト.
	 * @param {Object} prop プロパティ名.
	 * @param {Boolean} isEventHandler イベントハンドラかどうか.
	 * @returns {Object} AOPに必要なメソッドを織り込んだオブジェクト.
	 */
	function weaveControllerAspect(controllerDefObject, prop, isEventHandler) {
		var interceptors = getInterceptors(controllerDefObject.__name, prop);
		// イベントハンドラの場合、 enable/disableListeners()のために一番外側に制御用インターセプタを織り込む
		if (isEventHandler) {
			interceptors.push(executeListenersInterceptor);
		}
		return createWeavedFunction(controllerDefObject[prop], prop, interceptors);
	}

	/**
	 * 関数名とポイントカットを比べて、条件に合致すればインターセプタを返す.
	 *
	 * @param {String} targetName バインドする必要のある関数名.
	 * @param {Object} pcName ポイントカットで判別する対象名.
	 * @returns {Function[]} AOP用関数配列.
	 */
	function getInterceptors(targetName, pcName) {
		var ret = [];
		var aspects = h5.settings.aspects;
		// 織り込むべきアスペクトがない場合はそのまま空の配列を返す
		if (!aspects || aspects.length === 0) {
			return ret;
		}
		aspects = wrapInArray(aspects);
		for ( var i = aspects.length - 1; -1 < i; i--) {
			var aspect = aspects[i];
			if (aspect.target && !aspect.compiledTarget.test(targetName)) {
				continue;
			}
			var interceptors = aspect.interceptors;
			if (aspect.pointCut && !aspect.compiledPointCut.test(pcName)) {
				continue;
			}
			if (!$.isArray(interceptors)) {
				ret.push(interceptors);
				continue;
			}
			for ( var j = interceptors.length - 1; -1 < j; j--) {
				ret = ret.concat(interceptors[j]);
			}
		}
		return ret;
	}

	/**
	 * 基本となる関数にアスペクトを織り込んだ関数を返します。
	 *
	 * @param {Function} baseFunc 基本関数.
	 * @param {String} funcName 基本関数名.
	 * @param {Function[]} aspects AOP用関数配列.
	 * @returns {Function} AOP用関数を織り込んだ関数.
	 */
	function createWeavedFunction(base, funcName, aspects) {
		// 関数のウィービングを行う
		var weave = function(baseFunc, fName, aspect) {
			return function(/* var_args */) {
				var that = this;
				var invocation = {
					target: that,
					func: baseFunc,
					funcName: fName,
					args: arguments,
					proceed: function() {
						return baseFunc.apply(that, this.args);
					}
				};
				return aspect.call(that, invocation);
			};
		};

		var f = base;
		for ( var i = 0, l = aspects.length; i < l; i++) {
			f = weave(f, funcName, aspects[i]);
		}
		return f;
	}

	/**
	 * 指定されたオブジェクトの関数にアスペクトを織り込みます。
	 *
	 * @param {Object} logic ロジック.
	 * @returns {Object} AOPに必要なメソッドを織り込んだロジック.
	 */
	function weaveLogicAspect(logic) {
		for ( var prop in logic) {
			if ($.isFunction(logic[prop])) {
				logic[prop] = createWeavedFunction(logic[prop], prop, getInterceptors(logic.__name,
						prop));
			} else {
				logic[prop] = logic[prop];
			}
		}
		return logic;
	}

	/**
	 * コントローラ定義オブジェクトのプロパティがライフサイクルイベントどうかを返します。
	 *
	 * @param {Object} controllerDefObject コントローラ定義オブジェクト
	 * @param {String} prop プロパティ名
	 * @returns {Boolean} コントローラ定義オブジェクトのプロパティがライフサイクルイベントかどうか
	 */
	function isLifecycleProperty(controllerDefObject, prop) {
		// $.isFunction()による判定はいらないかも。
		return (prop === '__ready' || prop === '__construct' || prop === '__init')
				&& $.isFunction(controllerDefObject[prop]);
	}

	/**
	 * セレクタがコントローラの外側の要素を指しているかどうかを返します。<br>
	 * (外側の要素 = true)
	 *
	 * @param {String} selector セレクタ
	 * @returns {Boolean} コントローラの外側の要素を指しているかどうか
	 */
	function isGlobalSelector(selector) {
		return !!selector.match(/^\{.*\}$/);
	}

	/**
	 * イベント名がjQuery.bindを使って要素にイベントをバインドするかどうかを返します。
	 *
	 * @param {String} eventName イベント名
	 * @returns {Boolean} jQuery.bindを使って要素にイベントをバインドするかどうか
	 */
	function isBindRequested(eventName) {
		return !!eventName.match(/^\[.*\]$/);
	}

	/**
	 * セレクタから{}を外した文字列を返します。
	 *
	 * @param {String} selector セレクタ
	 * @returns {String} セレクタから{}を外した文字列
	 */
	function trimGlobalSelectorBracket(selector) {
		return $.trim(selector.substring(1, selector.length - 1));
	}

	/**
	 * イベント名から[]を外した文字列を返す
	 *
	 * @param {String} eventName イベント名
	 * @returns {String} イベント名から[]を外した文字列
	 */
	function trimBindEventBracket(eventName) {
		return $.trim(eventName.substring(1, eventName.length - 1));
	}

	/**
	 * 指定されたセレクタがwindow, window., document, document., navidator, navigator. で
	 * 始まっていればそのオブジェクトを、そうでなければそのまま文字列を返します。
	 *
	 * @param {String} selector セレクタ
	 * @returns {DOM|String} DOM要素、もしくはセレクタ
	 */
	function getGlobalSelectorTarget(selector) {
		var retSelector = selector;
		if (startsWith(selector, 'window') || startsWith(selector, 'document')
				|| startsWith(selector, 'navigator')) {
			// セレクタではなく、オブジェクトがターゲットの場合
			return getByPath(selector);
		}
		return retSelector;
	}

	/**
	 * 指定されたプロパティがイベントハンドラかどうかを返します。
	 *
	 * @param {Object} controllerDefObject コントローラ定義オブジェクト
	 * @param {String} prop プロパティ名
	 * @returns {Boolean} プロパティがイベントハンドラかどうか
	 */
	function isEventHandler(controllerDefObject, prop) {
		return prop.indexOf(' ') !== -1 && $.isFunction(controllerDefObject[prop]);
	}

	/**
	 * コントローラ定義オブジェクトの子孫コントローラ定義が循環参照になっているかどうかをチェックします。
	 *
	 * @param {Object} controllerDefObject コントローラ定義オブジェクト
	 * @returns {Boolean} 循環参照になっているかどうか(true=循環参照)
	 */
	function checkControllerCircularRef(controllerDefObject) {
		var checkCircular = function(controllerDef, ancestors) {
			for ( var prop in controllerDef)
				if ($.inArray(controllerDef, ancestors) >= 0 || endsWith(prop, SUFFIX_CONTROLLER)
						&& checkCircular(controllerDef[prop], ancestors.concat([controllerDef]))) {
					return true;
				}
			return false;
		};
		return checkCircular(controllerDefObject, []);
	}

	/**
	 * コントローラ定義オブジェクトのロジック定義が循環参照になっているかどうかをチェックします。
	 *
	 * @param {Object} controllerDefObject コントローラ定義オブジェクト
	 * @returns {Boolean} 循環参照になっているかどうか(true=循環参照)
	 */
	function checkLogicCircularRef(controllerDefObj) {
		var checkCircular = function(controllerDef, ancestors) {
			for ( var prop in controllerDef)
				if ($.inArray(controllerDef, ancestors) >= 0 || endsWith(prop, SUFFIX_LOGIC)
						&& checkCircular(controllerDef[prop], ancestors.concat([controllerDef]))) {
					return true;
				}
			return false;
		};
		return checkCircular(controllerDefObj, []);
	}

	/**
	 * コントローラのプロパティが子コントローラかどうかを返します。
	 *
	 * @param {Object} controller コントローラ
	 * @param {String} プロパティ名
	 * @returns {Boolean} コントローラのプロパティが子コントローラかどうか(true=子コントローラである)
	 */
	function isChildController(controller, prop) {
		var target = controller[prop];
		return endsWith(prop, SUFFIX_CONTROLLER) && prop !== 'rootController'
				&& prop !== 'parentController' && !$.isFunction(target)
				&& (target && !target.__controllerContext.isRoot);
	}

	/**
	 * 指定されたコントローラの子孫コントローラのPromiseオブジェクトを全て取得します。
	 *
	 * @param {Object} controller コントローラ
	 * @param {String} propertyName プロパティ名(initPromise,readyPromise)
	 * @param {Object} aquireFromControllerContext コントローラコンテキストのプロパティかどうか
	 * @returns {Promise[]} Promiseオブジェクト配列
	 */
	function getDescendantControllerPromises(controller, propertyName, aquireFromControllerContext) {
		var promises = [];
		var targets = [];
		var getPromisesInner = function(object) {
			targets.push(object);
			for ( var prop in object) {
				if (isChildController(object, prop)) {
					var c = object[prop];
					var promise = aquireFromControllerContext ? c.__controllerContext[propertyName]
							: c[propertyName];
					if (promise) {
						promises.push(promise);
					}
					if ($.inArray(c, targets) === -1) {
						getPromisesInner(c);
					}
				}
			}
		};
		getPromisesInner(controller);
		return promises;
	}

	/**
	 * 子孫コントローラのイベントハンドラをバインドします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function bindDescendantHandlers(controller) {
		var execute = function(controllerInstance) {
			var meta = controllerInstance.__meta;
			var notBindControllers = {};
			if (meta) {
				for ( var prop in meta) {
					if (meta[prop].useHandlers === false) {
						// trueより文字数が少ないため1を代入。機能的には"true"を表せば何を代入しても良い。
						notBindControllers[prop] = 1;
					}
				}
			}

			for ( var prop in controllerInstance) {
				var c = controllerInstance[prop];
				if (!isChildController(controllerInstance, prop)) {
					continue;
				}
				execute(c);
				if (!notBindControllers[prop]) {
					bindByBindMap(c);
				}
			}
		};
		execute(controller);
	}

	/**
	 * バインドマップに基づいてイベントハンドラをバインドします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function bindByBindMap(controller) {
		var bindMap = controller.__controllerContext.bindMap;
		for ( var s in bindMap) {
			for ( var e in bindMap[s]) {
				(function(selector, eventName) {
					bindEventHandler(controller, selector, eventName);
				})(s, e);
			}
		}
	}

	/**
	 * イベントハンドラのバインドを行います。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} selector セレクタ
	 * @param {String} eventName イベント名
	 */
	function bindEventHandler(controller, selector, eventName) {
		// bindMapに格納しておいたハンドラを取得
		var func = controller.__controllerContext.bindMap[selector][eventName];
		var event = eventName;
		var bindRequested = isBindRequested(eventName);
		if (bindRequested) {
			event = trimBindEventBracket(eventName);
		}
		var bindObj = null;
		switch (event) {
		case 'mousewheel':
			bindObj = getNormalizeMouseWheelBindObj(controller, selector, event, func);
			break;
		case EVENT_NAME_H5_TRACKSTART:
		case EVENT_NAME_H5_TRACKMOVE:
		case EVENT_NAME_H5_TRACKEND:
			bindObj = getH5TrackBindObj(controller, selector, eventName, func);
			break;
		default:
			bindObj = getNormalBindObj(controller, selector, event, func);
			break;
		}

		if (!$.isArray(bindObj)) {
			useBindObj(bindObj, bindRequested);
			return;
		}
		for ( var i = 0, l = bindObj.length; i < l; i++) {
			useBindObj(bindObj[i], bindRequested);
		}
	}

	/**
	 * バインドオブジェクトに基づいてイベントハンドラをバインドします。
	 *
	 * @param {Object} bindObj バインドオブジェクト
	 */
	function bindByBindObject(bindObj) {
		var controller = bindObj.controller;
		var rootElement = controller.rootElement;
		var selector = bindObj.selector;
		var eventName = bindObj.eventName;
		var handler = bindObj.handler;
		var useBind = isBindRequested(eventName);
		var event = useBind ? trimBindEventBracket(eventName) : eventName;
		if (isGlobalSelector(selector)) {
			// グローバルなセレクタの場合
			var selectTarget = trimGlobalSelectorBracket(selector);
			var isSelf = false;
			if (selectTarget === ROOT_ELEMENT_NAME) {
				selectTarget = rootElement;
				isSelf = true;
			} else {
				selectTarget = getGlobalSelectorTarget(selectTarget);
			}
			// バインド対象がdocument, windowの場合、live, delegateではイベントが拾えないことへの対応
			var needBind = selectTarget === document || selectTarget === window;
			if (isSelf || useBind || needBind) {
				$(selectTarget).bind(event, handler);
			} else {
				$(selectTarget).live(event, handler);
			}
		} else {
			if (useBind) {
				$(selector, rootElement).bind(event, handler);
			} else {
				$(rootElement).delegate(selector, event, handler);
			}
		}
	}

	/**
	 * バインドオブジェクトに対して必要であればイベント名を修正し、アンバインドマップにハンドラを追加した後、 実際にバインドを行います。
	 *
	 * @param {Object} bindObj バインドオブジェクト
	 * @param {Boolean} bindRequested イベントハンドラをバインド([]記法)すべきかどうか
	 */
	function useBindObj(bindObj, bindRequested) {
		if (bindRequested) {
			bindObj.eventName = '[' + bindObj.eventName + ']';
		}
		// アンバインドマップにハンドラを追加
		registerUnbindMap(bindObj.controller, bindObj.selector, bindObj.eventName, bindObj.handler);
		bindByBindObject(bindObj);
	}

	/**
	 * 子孫コントローラのイベントハンドラをアンバインドします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function unbindDescendantHandlers(controller) {
		var execute = function(controllerInstance) {
			var meta = controllerInstance.__meta;
			var notBindControllers = {};
			if (meta) {
				for ( var prop in meta) {
					if (meta[prop].useHandlers === false) {
						// trueより文字数が少ないため1を代入。機能的には"true"を表せば何を代入しても良い。
						notBindControllers[prop] = 1;
					}
				}
			}

			for ( var prop in controllerInstance) {
				var c = controllerInstance[prop];
				if (!isChildController(controllerInstance, prop)) {
					continue;
				}
				execute(c);
				if (!notBindControllers[prop]) {
					unbindByBindMap(c);
				}
			}
		};
		execute(controller);
	}

	/**
	 * バインドマップに基づいてイベントハンドラをアンバインドします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function unbindByBindMap(controller) {
		var rootElement = controller.rootElement;
		var unbindMap = controller.__controllerContext.unbindMap;
		for ( var selector in unbindMap) {
			for ( var eventName in unbindMap[selector]) {
				var handler = unbindMap[selector][eventName];
				var useBind = isBindRequested(eventName);
				var event = useBind ? trimBindEventBracket(eventName) : eventName;
				if (isGlobalSelector(selector)) {
					var selectTarget = trimGlobalSelectorBracket(selector);
					var isSelf = false;
					if (selectTarget === ROOT_ELEMENT_NAME) {
						selectTarget = rootElement;
						isSelf = true;
					} else {
						selectTarget = getGlobalSelectorTarget(selectTarget);
					}
					var needBind = selectTarget === document || selectTarget === window;
					if (isSelf || useBind || needBind) {
						$(selectTarget).unbind(event, handler);
					} else {
						$(selectTarget).die(event, handler);
					}
				} else {
					if (useBind) {
						$(selector, rootElement).unbind(event, handler);
					} else {
						$(rootElement).undelegate(selector, event, handler);
					}
				}
			}
		}
	}

	/**
	 * 指定されたフラグで子コントローラを含む全てのコントローラのexecuteListenersフラグを変更します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {Boolean} flag フラグ
	 */
	function setExecuteListenersFlag(controller, flag) {
		controller.__controllerContext.executeListeners = flag;
		var targets = [];
		var changeFlag = function(controllerInstance) {
			targets.push(controllerInstance);
			for ( var prop in controllerInstance) {
				if (isChildController(controllerInstance, prop)) {
					var c = controllerInstance[prop];
					c.__controllerContext.executeListeners = flag;
					if ($.inArray(c, targets) === -1) {
						changeFlag(c);
					}
				}
			}
		};
		changeFlag(controller);
	}

	/**
	 * rootControllerとparentControllerをセットします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function initRootAndParentController(controller) {
		var targets = [];
		var init = function(controllerInstance, root, parent) {
			controllerInstance.rootController = root;
			controllerInstance.parentController = parent;
			targets.push(controllerInstance);
			for ( var prop in controllerInstance) {
				if (isChildController(controllerInstance, prop)) {
					var c = controllerInstance[prop];
					if ($.inArray(c, targets) === -1) {
						init(c, root, controllerInstance);
					}
				}
			}
		};
		init(controller, controller, null);
	}

	/**
	 * __init, __readyイベントを実行する.
	 *
	 * @param ｛Object} controller コントローラ.
	 * @param {Booelan} isInitEvent __initイベントを実行するかどうか.
	 */
	function executeLifecycleEventChain(controller, isInitEvent) {
		var funcName = isInitEvent ? '__init' : '__ready';

		var leafDfd = getDeferred();
		setTimeout(function() {
			leafDfd.resolve();
		}, 0);
		var leafPromise = leafDfd.promise();

		var execInner = function(controllerInstance) {
			var isLeafController = true;
			for ( var prop in controllerInstance) {
				// 子コントローラがあれば再帰的に処理
				if (isChildController(controllerInstance, prop)) {
					isLeafController = false;
					execInner(controllerInstance[prop]);
				}
			}

			// 子孫コントローラの準備ができた時に実行させる関数を定義
			var func = function() {
				var ret = null;
				var lifecycleFunc = controllerInstance[funcName];
				if (lifecycleFunc) {
					ret = controllerInstance[funcName]
							(createInitializationContext(controllerInstance));
				}
				// ライフサイクルイベント実行後に呼ぶべきコールバック関数を作成
				var callback = isInitEvent ? createCallbackForInit(controllerInstance)
						: createCallbackForReady(controllerInstance);
				if (h5.async.isPromise(ret)) {
					ret.done(function() {
						callback();
					});
				} else {
					callback();
				}
			};
			// getPromisesForXXXの戻り値が空の配列の場合はfunc()は同期的に呼ばれる
			var promises = isInitEvent ? getPromisesForInit(controllerInstance)
					: getPromisesForReady(controllerInstance);
			if (isInitEvent && isLeafController) {
				promises.push(leafPromise);
			}
			$.when.apply($, promises).done(function() {
				func();
			});
		};
		execInner(controller);
	}

	/**
	 * __initイベントを実行するために必要なPromiseを返します。
	 *
	 * @param {Controller} controller コントローラ
	 * @returns {Promise[]} Promiseオブジェクト
	 */
	function getPromisesForInit(controller) {
		// 子孫コントローラのinitPromiseオブジェクトを取得
		var initPromises = getDescendantControllerPromises(controller, 'initPromise');
		// 自身のテンプレート用Promiseオブジェクトを取得
		initPromises.push(controller.preinitPromise);
		return initPromises;
	}

	/**
	 * __readyイベントを実行するために必要なPromiseを返します。
	 *
	 * @param {Controller} controller コントローラ
	 * @returns {Promise[]} Promiseオブジェクト
	 */
	function getPromisesForReady(controller) {
		// 子孫コントローラのreadyPromiseオブジェクトを取得
		return getDescendantControllerPromises(controller, 'readyPromise');
	}

	/**
	 * __initイベントで実行するコールバック関数を返します。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function createCallbackForInit(controller) {
		return function() {
			// disopseされていたら何もしない。
			if (isDisposing(controller)) {
				return;
			}
			controller.isInit = true;
			var initDfd = controller.__controllerContext.initDfd;
			// FW、ユーザともに使用しないので削除
			delete controller.__controllerContext.templatePromise;
			delete controller.__controllerContext.initDfd;
			initDfd.resolve();

			if (controller.__controllerContext && controller.__controllerContext.isRoot) {
				// ルートコントローラであれば次の処理(イベントハンドラのバインドと__readyの実行)へ進む
				bindAndTriggerReady(controller);
			}
		};
	}

	/**
	 * __readyイベントで実行するコールバック関数を返します。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function createCallbackForReady(controller) {
		return function() {
			// disopseされていたら何もしない。
			if (isDisposing(controller)) {
				return;
			}
			controller.isReady = true;

			var readyDfd = controller.__controllerContext.readyDfd;
			// FW、ユーザともに使用しないので削除
			delete controller.__controllerContext.readyDfd;
			readyDfd.resolve();

			if (controller.__controllerContext && controller.__controllerContext.isRoot) {
				// ルートコントローラであれば全ての処理が終了したことを表すイベント"h5controllerready"をトリガ
				if (!controller.rootElement || !controller.isInit || !controller.isReady) {
					return;
				}
				$(controller.rootElement).trigger('h5controllerready', [controller]);
			}
		};
	}

	/**
	 * テンプレートに渡すセレクタとして正しいかどうかを返します。
	 *
	 * @param {String} selector セレクタ
	 * @returns {Boolean} テンプレートに渡すセレクタとして正しいかどうか(true=正しい)
	 */
	function isCorrectTemplatePrefix(selector) {
		if (startsWith(selector, 'window')) {
			return false;
		}
		if (startsWith(selector, 'navigator')) {
			return false;
		}
		return true;
	}

	/**
	 * 指定された要素が文字列があれば、ルートエレメント、{}記法を考慮した要素をjQueryオブジェクト化して返します。 DOM要素、jQueryオブジェクトであれば、
	 * jQueryオブジェクト化して(指定要素がjQueryオブジェクトの場合、無駄な処理になるがコスト的には問題ない)返します。
	 *
	 * @param {String|DOM|jQuery} セレクタ、DOM要素、jQueryオブジェクト
	 * @param {DOM} rootElement ルートエレメント
	 * @param {Boolean} isTemplate テンプレートで使用するかどうか
	 * @returns {jQuery} jQueryオブジェクト
	 */
	function getTarget(element, rootElement, isTemplate) {
		if (typeof element !== 'string') {
			return $(element);
		}
		var $targets;
		var selector = $.trim(element);
		if (isGlobalSelector(selector)) {
			var s = trimGlobalSelectorBracket(selector);
			if (isTemplate && !isCorrectTemplatePrefix(s)) {
				throwFwError(ERR_CODE_INVALID_TEMPLATE_SELECTOR);
			}
			$targets = $(getGlobalSelectorTarget(s));
		} else {
			$targets = $(rootElement).find(element);
		}
		return $targets;
	}

	/**
	 * ハンドラをアンバインドマップに登録します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} selector セレクタ
	 * @param {String} eventName イベント名
	 * @param {Function} handler ハンドラ
	 */
	function registerUnbindMap(controller, selector, eventName, handler) {
		if (!controller.__controllerContext.unbindMap[selector]) {
			controller.__controllerContext.unbindMap[selector] = {};
		}
		controller.__controllerContext.unbindMap[selector][eventName] = handler;
	}

	/**
	 * バインドオブジェクトを返します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} selector セレクタ
	 * @param {String} eventName イベント名
	 * @param {Function} func ハンドラとして登録したい関数
	 * @returns {Object} バインドオブジェクト
	 *          <ul>
	 *          <li>bindObj.controller - コントローラ</li>
	 *          <li>bindObj.selector - セレクタ</li>
	 *          <li>bindObj.eventName - イベント名</li>
	 *          <li>bindObj.handler - イベントハンドラ</li>
	 *          </ul>
	 */
	function getNormalBindObj(controller, selector, eventName, func) {
		return {
			controller: controller,
			selector: selector,
			eventName: eventName,
			handler: function(/* var_args */) {
				func.call(controller, createEventContext(controller, arguments));
			}
		};
	}

	/**
	 * クラスブラウザな"mousewheel"イベントのためのバインドオブジェクトを返します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} selector セレクタ
	 * @param {String} eventName イベント名
	 * @param {Function} func ハンドラとして登録したい関数
	 * @returns {Object} バインドオブジェクト
	 *          <ul>
	 *          <li>bindObj.controller - コントローラ</li>
	 *          <li>bindObj.selector - セレクタ</li>
	 *          <li>bindObj.eventName - イベント名</li>
	 *          <li>bindObj.handler - イベントハンドラ</li>
	 *          </ul>
	 */
	function getNormalizeMouseWheelBindObj(controller, selector, eventName, func) {
		return {
			controller: controller,
			selector: selector,
			// Firefoxには"mousewheel"イベントがない
			eventName: typeof document.onmousewheel === TYPE_OF_UNDEFINED ? 'DOMMouseScroll'
					: eventName,
			handler: function(/* var_args */) {
				var eventContext = createEventContext(controller, arguments);
				var event = eventContext.event;
				// Firefox
				if (event.originalEvent && event.originalEvent.detail) {
					event.wheelDelta = -event.detail * 40;
				}
				func.call(controller, eventContext);
			}
		};
	}
	/**
	 * hifiveの独自イベント"h5trackstart", "h5trackmove", "h5trackend"のためのバインドオブジェクトを返します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} selector セレクタ
	 * @param {String} eventName イベント名
	 * @param {Function} func ハンドラとして登録したい関数
	 * @returns {Object[]} バインドオブジェクト
	 *          <ul>
	 *          <li>bindObj.controller - コントローラ</li>
	 *          <li>bindObj.selector - セレクタ</li>
	 *          <li>bindObj.eventName - イベント名</li>
	 *          <li>bindObj.handler - イベントハンドラ</li>
	 *          </ul>
	 */
	function getH5TrackBindObj(controller, selector, eventName, func) {
		// タッチイベントがあるかどうか
		var hasTouchEvent = typeof document.ontouchstart !== TYPE_OF_UNDEFINED;
		if (eventName !== EVENT_NAME_H5_TRACKSTART) {
			if (hasTouchEvent) {
				return getNormalBindObj(controller, selector, eventName, func);
			}
			// イベントオブジェクトの正規化
			return getNormalBindObj(controller, selector, eventName, function(context) {
				var event = context.event;
				var offset = $(event.currentTarget).offset() || {
					left: 0,
					top: 0
				};
				event.offsetX = event.pageX - offset.left;
				event.offsetY = event.pageY - offset.top;
				func.apply(this, arguments);
			});
		}
		var getEventType = function(en) {
			switch (en) {
			case 'touchstart':
			case 'mousedown':
				return EVENT_NAME_H5_TRACKSTART;
			case 'touchmove':
			case 'mousemove':
				return EVENT_NAME_H5_TRACKMOVE;
			case 'touchend':
			case 'mouseup':
				return EVENT_NAME_H5_TRACKEND;
			}
		};

		// jQuery.Eventオブジェクトのプロパティをコピーする。
		// 1.6.xの場合, "liveFired"というプロパティがあるがこれをコピーしてしまうとtriggerしてもイベントが発火しない。
		var copyEventObject = function(src, dest) {
			for ( var prop in src) {
				if (src.hasOwnProperty(prop) && !dest[prop] && prop !== 'target'
						&& prop !== 'currentTarget' && prop !== 'originalEvent'
						&& prop !== 'liveFired') {
					dest[prop] = src[prop];
				}
			}
			dest.h5DelegatingEvent = src;
		};
		var start = hasTouchEvent ? 'touchstart' : 'mousedown';
		var move = hasTouchEvent ? 'touchmove' : 'mousemove';
		var end = hasTouchEvent ? 'touchend' : 'mouseup';
		var $document = $(document);
		var getBindObjects = function() {
			// h5trackendイベントの最後でハンドラの除去を行う関数を格納するための変数
			var removeHandlers = null;
			var execute = false;
			var getHandler = function(en, eventTarget, setup) {
				return function(var_args) {
					var type = getEventType(en);
					var isStart = type === EVENT_NAME_H5_TRACKSTART;
					if (isStart && execute) {
						return;
					}
					var eventContext = createEventContext(controller, arguments);
					var event = eventContext.event;
					if (hasTouchEvent) {
						// タッチイベントの場合、イベントオブジェクトに座標系のプロパティを付加
						initTouchEventObject(event, en);
					}
					var newEvent = new $.Event(type);
					copyEventObject(event, newEvent);
					var target = event.target;
					if (eventTarget) {
						target = eventTarget;
					}
					if (setup) {
						setup(newEvent);
					}
					if (!hasTouchEvent || (execute || isStart)) {
						$(target).trigger(newEvent, eventContext.evArg);
						execute = true;
					}
					if (isStart && execute) {
						newEvent.h5DelegatingEvent.preventDefault();
						var nt = newEvent.target;

						// 直前のh5track系イベントとの位置の差分を格納
						var ox = newEvent.clientX;
						var oy = newEvent.clientY;
						var setupDPos = function(ev) {
							var cx = ev.clientX;
							var cy = ev.clientY;
							ev.dx = cx - ox;
							ev.dy = cy - oy;
							ox = cx;
							oy = cy;
						};
						var moveHandler = getHandler(move, nt, setupDPos);
						var upHandler = getHandler(end, nt);

						var $bindTarget = hasTouchEvent ? $(nt) : $document;
						removeHandlers = function() {
							$bindTarget.unbind(move, moveHandler);
							$bindTarget.unbind(end, upHandler);
						};
						$bindTarget.bind(move, moveHandler);
						$bindTarget.bind(end, upHandler);
					}
					if (type === EVENT_NAME_H5_TRACKEND) {
						removeHandlers();
						execute = false;
					}
				};
			};
			var createBindObj = function(en) {
				return {
					controller: controller,
					selector: selector,
					eventName: en,
					handler: getHandler(en)
				};
			};
			var bindObjects = [getNormalBindObj(controller, selector, eventName, func)];
			bindObjects.push(createBindObj(start));
			return bindObjects;
		};
		return getBindObjects();
	}

	/**
	 * タッチイベントのイベントオブジェクトにpageXやoffsetXといった座標系のプロパティを追加します。
	 *
	 * @param {Object} event jQuery.Eventオブジェクト
	 * @param {String} eventName イベント名
	 */
	function initTouchEventObject(event, eventName) {
		var originalEvent = event.originalEvent;
		var touches = eventName === 'touchend' || eventName === 'touchcancel' ? originalEvent.changedTouches[0]
				: originalEvent.touches[0];
		var pageX = touches.pageX;
		var pageY = touches.pageY;
		event.pageX = originalEvent.pageX = pageX;
		event.pageY = originalEvent.pageY = pageY;
		event.screenX = originalEvent.screenX = touches.screenX;
		event.screenY = originalEvent.screenY = touches.screenY;
		event.clientX = originalEvent.clientX = touches.clientX;
		event.clientY = originalEvent.clientY = touches.clientY;

		var target = event.target;
		if (target.ownerSVGElement) {
			target = target.farthestViewportElement;
		} else if (target === window || target === document) {
			target = document.body;
		}
		var offset = $(target).offset();
		if (offset) {
			var offsetX = pageX - offset.left;
			var offsetY = pageY - offset.top;
			event.offsetX = originalEvent.offsetX = offsetX;
			event.offsetY = originalEvent.offsetY = offsetY;
		}
	}
	/**
	 * イベントオブジェクトを正規化します。
	 *
	 * @param {Object} event jQuery.Eventオブジェクト
	 */
	function normalizeEventObjext(event) {
		// ここはnull, undefinedの場合にtrueとしたいため、あえて厳密等価を使用していない
		if (event && event.offsetX == null && event.offsetY == null && event.pageX && event.pageY) {
			var target = event.target;
			if (target.ownerSVGElement) {
				target = target.farthestViewportElement;
			} else if (target === window || target === document) {
				target = document.body;
			}
			var offset = $(target).offset();
			if (offset) {
				event.offsetX = event.pageX - offset.left;
				event.offsetY = event.pageY - offset.top;
			}
		}
	}

	/**
	 * イベントコンテキストを作成します。
	 *
	 * @param {Object} controller コントローラ
	 * @param {Object} args 1番目にはjQuery.Eventオブジェクト、2番目はjQuery.triggerに渡した引数
	 */
	function createEventContext(controller, args) {
		var event = null;
		var evArg = null;
		if (args) {
			event = args[0];
			evArg = args[1];
		}
		// イベントオブジェクトの正規化
		normalizeEventObjext(event);
		return {
			controller: controller,
			rootElement: controller.rootElement,
			event: event,
			evArg: evArg
		};
	}

	/**
	 * 初期化イベントコンテキストをセットアップします。
	 *
	 * @param {Object} rootController ルートコントローラ
	 */
	function createInitializationContext(rootController) {
		return {
			args: rootController.__controllerContext.args
		};
	}

	/**
	 * コントローラとその子孫コントローラのrootElementにnullをセットします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function unbindRootElement(controller) {
		for ( var prop in controller) {
			var c = controller[prop];
			if (isChildController(controller, prop)) {
				c.rootElement = null;
				c.view.__controller = null;
				unbindRootElement(c);
			}
		}
	}

	/**
	 * コントローラとその子孫コントローラのrootElementをセットします。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function copyAndSetRootElement(controller) {
		var rootElement = controller.rootElement;
		var meta = controller.__meta;
		for ( var prop in controller) {
			var c = controller[prop];
			if (isChildController(controller, prop)) {
				// __metaが指定されている場合、__metaのrootElementを考慮した要素を取得する
				if (meta && meta[prop] && meta[prop].rootElement) {
					c.rootElement = getBindTarget(meta[prop].rootElement, rootElement, c);
				} else {
					c.rootElement = rootElement;
				}
				c.view.__controller = c;
				copyAndSetRootElement(c);
			}
		}
	}

	/**
	 * コントローラをバインドする対象となる要素を返します。
	 *
	 * @param {String|DOM|jQuery} element セレクタ、DOM要素、もしくはjQueryオブジェクト
	 * @param {DOM} [rootElement] ルートエレメント
	 * @param {Controller} controller コントローラ
	 * @returns {DOM} コントローラのバインド対象である要素
	 */
	function getBindTarget(element, rootElement, controller) {
		if (!element) {
			throwFwError(ERR_CODE_BIND_TARGET_REQUIRED);
		} else if (!controller || !controller.__controllerContext) {
			throwFwError(ERR_CODE_BIND_NOT_CONTROLLER);
		}
		var $targets;
		if (rootElement) {
			$targets = getTarget(element, rootElement);
		} else {
			$targets = $(element);
		}
		if ($targets.length === 0) {
			throwFwError(ERR_CODE_BIND_NOT_TARGET, [controller.__name]);
		}
		if ($targets.length > 1) {
			throwFwError(ERR_CODE_BIND_TARGET_COMPLEX, [controller.__name]);
		}
		return $targets.get(0);
	}

	/**
	 * イベントハンドラのバインドと__readyイベントを実行します。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function bindAndTriggerReady(controller) {
		bindByBindMap(controller);
		bindDescendantHandlers(controller);

		// コントローラマネージャの管理対象に追加
		var controllers = h5.core.controllerManager.controllers;
		if ($.inArray(controller, controllers) === -1) {
			controllers.push(controller);
		}

		// h5controllerboundイベントをトリガ.
		$(controller.rootElement).trigger('h5controllerbound', [controller]);

		// コントローラの__ready処理を実行
		var initPromises = getDescendantControllerPromises(controller, 'initPromise');
		initPromises.push(controller.initPromise);
		$.when.apply($, initPromises).done(function() {
			executeLifecycleEventChain(controller, false);
		});
	}

	/**
	 * rootController, parentControllerのセットと__initイベントを実行します。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function setRootAndTriggerInit(controller) {
		if (controller.rootController === null) {
			// rootControllerとparentControllerのセット
			initRootAndParentController(controller);
		}
		copyAndSetRootElement(controller);

		// __initイベントの実行
		executeLifecycleEventChain(controller, true);
	}

	/**
	 * h5.core.bindController()のために必要なプロパティをコントローラに追加します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {Object} param 初期化パラメータ
	 */
	function initInternalProperty(controller, param) {
		var templateDfd = getDeferred();
		templateDfd.resolve();
		controller.__controllerContext.templatePromise = templateDfd.promise();
		controller.__controllerContext.initDfd = getDeferred();
		controller.initPromise = controller.__controllerContext.initDfd.promise();
		controller.__controllerContext.readyDfd = getDeferred();
		controller.readyPromise = controller.__controllerContext.readyDfd.promise();
		controller.isInit = false;
		controller.isReady = false;
		controller.__controllerContext.args = param;
		for ( var prop in controller) {
			if (isChildController(controller, prop)) {
				initInternalProperty(controller[prop]);
			}
		}
	}

	/**
	 * インジケータを呼び出します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {Object} option インジケータのオプション
	 */
	function callIndicator(controller, option) {
		var target = null;
		var opt = option;

		if ($.isPlainObject(opt)) {
			target = opt.target;
		} else {
			opt = {};
		}
		target = target ? getTarget(target, controller.rootElement, true) : controller.rootElement;
		return h5.ui.indicator.call(controller, target, opt);
	}

	/**
	 * __unbind, __disposeイベントを実行します。
	 *
	 * @param {Controller} controller コントローラ
	 * @param {String} property プロパティ名(__unbind | __dispose)
	 * @returns {Promise[]} Promiseオブジェクト
	 */
	function executeLifeEndChain(controller, property) {
		var promises = [];
		var targets = [];
		var execute = function(parentController) {
			targets.push(parentController);
			for ( var prop in parentController) {
				if (isChildController(parentController, prop)) {
					var c = parentController[prop];
					if ($.inArray(c, targets) === -1) {
						execute(c);
					}
				}
			}
			if (parentController[property] && $.isFunction(parentController[property])) {
				promises.push(parentController[property]());
			}
		};
		execute(controller);
		return promises;
	}

	/**
	 * コントローラのリソース解放処理を行います。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function disposeController(controller) {
		var targets = [];
		var dispose = function(parentController) {
			targets.push(parentController);
			if (getByPath('h5.core.view')) {
				parentController.view.clear();
			}
			for ( var prop in parentController) {
				if (isChildController(parentController, prop)) {
					var c = parentController[prop];
					if ($.inArray(c, targets) === -1) {
						dispose(c);
					}
				}
				parentController[prop] = null;
			}
		};
		dispose(controller);
	}

	/**
	 * 指定されたIDを持つViewインスタンスを返します。 自身が持つViewインスタンスが指定されたIDを持っていない場合、parentControllerのViewインスタンスに対して
	 * 持っているかどうか問い合わせ、持っていればそのインスタンスを、持っていなければ更に上に問い合わせます。
	 * ルートコントローラのViewインスタンスも持っていない場合、h5.core.viewに格納された最上位のViewインスタンスを返します。
	 *
	 * @param {String} templateId テンプレートID
	 * @param {Controller} controller コントローラ
	 */
	function getView(templateId, controller) {
		if (controller.view.__view.isAvailable(templateId)) {
			return controller.view.__view;
		} else if (controller.parentController) {
			return getView(templateId, controller.parentController);
		}
		return h5.core.view;
	}

	/**
	 * 指定されたコントローラがdispose済みかどうか、(非同期の場合はdispose中かどうか)を返します。
	 *
	 * @param {Controller} controller コントローラ
	 */
	function isDisposing(controller) {
		return !controller.__controllerContext || controller.__controllerContext.isDisposing;
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	function controllerFactory(controller, rootElement, controllerName, param, isRoot) {

		/**
		 * コントローラ名.
		 *
		 * @type String
		 * @name __name
		 * @memberOf Controller
		 */
		controller.__name = controllerName;

		/**
		 * テンプレート.
		 *
		 * @type String|String[]
		 * @name __templates
		 * @memberOf Controller
		 */
		controller.__templates = null;

		/**
		 * コントローラがバインドされた要素.
		 *
		 * @type Element
		 * @name rootElement
		 * @memberOf Controller
		 */
		controller.rootElement = rootElement;

		/**
		 * コントローラコンテキスト.
		 *
		 * @private
		 * @memberOf Controller
		 * @name __controllerContext
		 */
		controller.__controllerContext = {

			/**
			 * リスナーを実行するかどうかのフラグ
			 *
			 * @type Boolean
			 */
			executeListeners: true,

			/**
			 * ルートコントローラかどうか
			 *
			 * @type Boolean
			 */
			isRoot: isRoot,

			/**
			 * バインド対象となるイベントハンドラのマップ.
			 *
			 * @type Object
			 */
			bindMap: {},

			/**
			 * アンバインド対象となるイベントハンドラのマップ.
			 *
			 * @type Object
			 */
			unbindMap: {}
		};

		// 初期化パラメータがあれば、クローンしてコントローラコンテキストに格納
		if (param) {
			controller.__controllerContext.args = $.extend(true, {}, param);
		}

		/**
		 * コントローラのライフサイクルイベント__initが終了したかどうかを返します。
		 *
		 * @type Boolean
		 * @memberOf Controller
		 * @name isInit
		 */
		controller.isInit = false;

		/**
		 * コントローラのライフサイクルイベント__readyが終了したかどうかを返します。
		 *
		 * @type Boolean
		 * @memberOf Controller
		 * @name isReady
		 */
		controller.isReady = false;

		/**
		 * 親子関係を持つコントローラ群の一番祖先であるコントローラを返します。祖先がいない場合、自分自身を返します。
		 *
		 * @type Controller
		 * @memberOf Controller
		 * @name rootController
		 */
		controller.rootController = null;

		/**
		 * 親子関係を持つコントローラの親コントローラを返します。親コントローラがいない場合、nullを返します。
		 *
		 * @type Controller
		 * @memberOf Controller
		 * @name parentController
		 */
		controller.parentController = null;

		/**
		 * コントローラのライフサイクルイベント__initについてのPromiseオブジェクトを返します。
		 *
		 * @type Promise
		 * @memberOf Controller
		 * @name initPromise
		 */
		controller.initPromise = null;

		/**
		 * コントローラのライフサイクルイベント__readyについてのPromiseオブジェクトを返します。
		 *
		 * @type Promise
		 * @memberOf Controller
		 * @name readyPromise
		 */
		controller.readyPromise = null;

		/**
		 * コントローラのロガーを返します。
		 *
		 * @type Log
		 * @memberOf Controller
		 * @name log
		 */
		controller.log = h5.log.createLogger(controllerName);

		/**
		 * ビュー操作に関するメソッドを格納しています。
		 *
		 * @namespace
		 * @name view
		 * @memberOf Controller
		 * @see View
		 */
		controller.view = new View(controller);
	}

	function View(controller) {
		// 利便性のために循環参照になってしまうがコントローラの参照を持つ
		this.__controller = controller;
		// Viewモジュールがなければインスタンスを作成しない(できない)
		if (getByPath('h5.core.view')) {
			this.__view = h5.core.view.createView();
		}
	}

	$.extend(View.prototype, {

		/**
		 * パラメータで置換された、指定されたテンプレートIDのテンプレートを取得します。
		 *
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ(オブジェクトリテラルで指定)
		 * @returns {String} テンプレート文字列
		 * @function
		 * @name get
		 * @memberOf Controller.view
		 * @see View.get
		 */
		get: function(templateId, param) {
			return getView(templateId, this.__controller).get(templateId, param);
		},

		/**
		 * 要素を指定されたIDのテンプレートで書き換えます。
		 *
		 * @param {String|Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ(オブジェクトリテラルで指定)
		 * @function
		 * @name update
		 * @memberOf Controller.view
		 * @see View.update
		 */
		update: function(element, templateId, param) {
			var target = getTarget(element, this.__controller.rootElement, true);
			getView(templateId, this.__controller).update(target, templateId, param);
		},

		/**
		 * 要素の末尾に指定されたIDのテンプレートを挿入します。
		 *
		 * @param {String|Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ(オブジェクトリテラルで指定)
		 * @function
		 * @name append
		 * @memberOf Controller.view
		 * @see View.append
		 */
		append: function(element, templateId, param) {
			var target = getTarget(element, this.__controller.rootElement, true);
			getView(templateId, this.__controller).append(target, templateId, param);
		},

		/**
		 * 要素の先頭に指定されたIDのテンプレートを挿入します。
		 *
		 * @param {String|Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ(オブジェクトリテラルで指定)
		 * @function
		 * @name prepend
		 * @memberOf Controller.view
		 * @see View.prepend
		 */
		prepend: function(element, templateId, param) {
			var target = getTarget(element, this.__controller.rootElement, true);
			getView(templateId, this.__controller).prepend(target, templateId, param);
		},

		/**
		 * 指定されたパスのテンプレートファイルを非同期で読み込みキャッシュします。
		 *
		 * @param {String|String[]} resourcePaths テンプレートファイル(.ejs)のパス (配列で複数指定可能)
		 * @returns {Promise} Promiseオブジェクト
		 * @function
		 * @name load
		 * @memberOf Controller.view
		 * @see View.load
		 */
		load: function(resourcePaths) {
			return this.__view.load(resourcePaths);
		},

		/**
		 * Viewインスタンスに、指定されたIDとテンプレート文字列からテンプレートを1件登録します。
		 *
		 * @param {String} templateId テンプレートID
		 * @param {String} templateString テンプレート文字列
		 * @function
		 * @name register
		 * @memberOf Controller.view
		 * @see View.register
		 */
		register: function(templateId, templateString) {
			this.__view.register(templateId, templateString);
		},

		/**
		 * テンプレート文字列が、コンパイルできるかどうかを返します。
		 *
		 * @param {String} templateString テンプレート文字列
		 * @returns {Boolean} 渡されたテンプレート文字列がコンパイル可能かどうか。
		 * @function
		 * @name isValid
		 * @memberOf Controller.view
		 * @see View.isValid
		 */
		isValid: function(templateString) {
			return this.__view.isValid(templateString);
		},

		/**
		 * 指定されたテンプレートIDのテンプレートが存在するか判定します。
		 *
		 * @param {String} templateId テンプレートID
		 * @returns {Boolean} 判定結果(存在する: true / 存在しない: false)
		 * @function
		 * @name isAvailable
		 * @memberOf Controller.view
		 * @see View.isAvailable
		 */
		isAvailable: function(templateId) {
			return getView(templateId, this.__controller).isAvailable(templateId);
		},

		/**
		 * 引数に指定されたテンプレートIDをもつテンプレートをキャッシュから削除します。 <br />
		 * 引数を指定しない場合はキャッシュされている全てのテンプレートを削除します。
		 *
		 * @param {String|String[]} [templateId] テンプレートID
		 * @function
		 * @name clear
		 * @memberOf Controller.view
		 * @see View.clear
		 */
		clear: function(templateIds) {
			this.__view.clear(templateIds);
		}
	});

	/**
	 * コントローラのコンストラクタ
	 *
	 * @param {Element} rootElement コントローラをバインドした要素
	 * @param {String} controllerName コントローラ名
	 * @param {Object} param 初期化パラメータ
	 * @param {Boolean} isRoot ルートコントローラかどうか
	 * @name Controller
	 * @class
	 */
	function Controller(rootElement, controllerName, param, isRoot) {
		return controllerFactory(this, rootElement, controllerName, param, isRoot);
	}
	$.extend(Controller.prototype, {
		/**
		 * コントローラがバインドされた要素内から要素を選択します。
		 *
		 * @param {String} selector セレクタ
		 * @returns {jQuery} セレクタにマッチするjQueryオブジェクト
		 * @memberOf Controller
		 */
		$find: function(selector) {
			return $(this.rootElement).find(selector);
		},

		/**
		 * Deferredオブジェクトを返します。
		 *
		 * @returns {Deferred} Deferredオブジェクト
		 * @memberOf Controller
		 */
		deferred: function() {
			return getDeferred();
		},

		/**
		 * ルート要素を起点に指定されたイベントを実行します。
		 *
		 * @param {String} eventName イベント名
		 * @param {Object} [parameter] パラメータ
		 * @memberOf Controller
		 */
		trigger: function(eventName, parameter) {
			$(this.rootElement).trigger(eventName, [parameter]);
		},

		/**
		 * 指定された関数に対して、コンテキスト(this)をコントローラに変更して実行する関数を返します。
		 *
		 * @param {Function} func 関数
		 * @return {Function} コンテキスト(this)をコントローラに変更した関数
		 * @memberOf Controller
		 */
		own: function(func) {
			var that = this;
			return function(/* var_args */) {
				func.apply(that, arguments);
			};
		},

		/**
		 * 指定された関数に対して、コンテキスト(this)をコントローラに変更し、元々のthisを第1引数に加えて実行する関数を返します。
		 *
		 * @param {Function} func 関数
		 * @return {Function} コンテキスト(this)をコントローラに変更し、元々のthisを第1引数に加えた関数
		 * @memberOf Controller
		 */
		ownWithOrg: function(func) {
			var that = this;
			return function(/* var_args */) {
				var args = h5.u.obj.argsToArray(arguments);
				args.unshift(this);
				func.apply(that, args);
			};
		},

		/**
		 * コントローラを要素へバインドします。
		 *
		 * @memberOf Controller
		 * @param {String|Element|jQuery} targetElement バインド対象とする要素のセレクタ、DOMエレメント、もしくはjQueryオブジェクト.<br />
		 *            セレクタで指定したときにバインド対象となる要素が存在しない、もしくは2つ以上存在する場合、エラーとなります。
		 * @param {Object} [param] 初期化パラメータ.<br />
		 *            初期化パラメータは __init, __readyの引数として渡されるオブジェクトの argsプロパティとして格納されます。
		 * @returns {Controller} コントローラ.
		 */
		bind: function(targetElement, param) {
			var target = getBindTarget(targetElement, null, this);
			this.rootElement = target;
			this.view.__controller = this;
			var args = null;
			if (param) {
				args = $.extend(true, {}, param);
			}
			initInternalProperty(this, args);
			setRootAndTriggerInit(this);
			return this;
		},

		/**
		 * コントローラのバインドを解除します。
		 *
		 * @memberOf Controller
		 */
		unbind: function() {
			executeLifeEndChain(this, '__unbind');

			unbindByBindMap(this);
			unbindDescendantHandlers(this);

			this.__controllerContext.unbindMap = {};

			// コントローラマネージャの管理対象から外す.
			var targetRootElement = this.rootElement;
			var controllers = h5.core.controllerManager.controllers;
			h5.core.controllerManager.controllers = $.grep(controllers,
					function(controllerInstance) {
						return controllerInstance.rootElement !== targetRootElement;
					});

			// h5controllerunboundイベントをトリガ
			$(this.rootElement).trigger('h5controllerunbound');

			// rootElemetnのアンバインド
			this.rootElement = null;
			this.view.__controller = null;
			unbindRootElement(this);
		},

		/**
		 * コントローラのリソースをすべて削除します。<br />
		 * Controller#unbind() の処理を包含しています。
		 *
		 * @returns {Promise} Promiseオブジェクト
		 * @memberOf Controller
		 */
		dispose: function() {
			// disopseされていたら何もしない。
			if (isDisposing(this)) {
				return;
			}
			this.__controllerContext.isDisposing = 1;
			var dfd = this.deferred();
			this.unbind();
			var that = this;
			var promises = executeLifeEndChain(this, '__dispose');
			$.when.apply($, promises).done(function() {
				disposeController(that);
				dfd.resolve();
			});
			return dfd.promise();
		},

		/**
		 * コントローラのインジケータイベントを実行します。
		 *
		 * @param {Object} opt オプション
		 * @param {String} [opt.message] メッセージ
		 * @param {Number} [opt.percent] 進捗を0～100の値で指定する。
		 * @param {Boolean} [opt.block] 操作できないよう画面をブロックするか (true:する/false:しない)
		 * @param {String} ev イベント名
		 * @returns {Indicator} インジケータオブジェクト
		 * @memberOf Controller
		 */
		triggerIndicator: function(opt, evName) {
			var option = $.extend(true, {}, opt);
			var ev = evName;

			if (!ev || ev.length === 0) {
				ev = 'triggerIndicator';
			}

			$(this.rootElement).trigger(ev, [option]);
			return option.indicator;
		},

		/**
		 * 指定された要素に対して、インジケータ(メッセージ・画面ブロック・進捗)の表示や非表示を行うためのオブジェクトを取得します。
		 * <p>
		 * targetには、インジケータを表示するDOMオブジェクト、またはセレクタを指定して下さい。<br>
		 * targetを指定しない場合、コントローラを割り当てた要素(rootElement)に対してインジケータを表示します。
		 * <p>
		 * <h4>注意:</h4>
		 * targetにセレクタを指定した場合、以下の制約があります。
		 * <ul>
		 * <li>コントローラがバインドされた要素内に存在する要素が対象となります。
		 * <li>マッチした要素が複数存在する場合、最初にマッチした要素が対象となります。
		 * </ul>
		 * コントローラがバインドされた要素よりも外にある要素にインジケータを表示したい場合は、セレクタではなく<b>DOMオブジェクト</b>を指定して下さい。
		 * <h4>使用例</h4>
		 * <b>画面全体をブロックする場合</b><br>
		 * ・画面全体をブロックする場合、targetオプションに<b>document</b>、<b>window</b>または<b>body</b>を指定する。<br>
		 *
		 * <pre>
		 * var indicator = this.indicator({
		 * 	target: document
		 * }).show();
		 * </pre>
		 *
		 * <b>li要素にスロバー(くるくる回るアイコン)を表示してブロックを表示しないる場合</b><br>
		 *
		 * <pre>
		 * var indicator = this.indicator({
		 * 	target: 'li',
		 * 	block: false
		 * }).show();
		 * </pre>
		 *
		 * <b>パラメータにPromiseオブジェクトを指定して、done()/fail()の実行と同時にインジケータを除去する</b><br>
		 * resolve() または resolve() が実行されると、画面からインジケータを除去します。
		 *
		 * <pre>
		 * var df = $.Deferred();
		 * var indicator = this.indicator({
		 * 	target: document,
		 * 	promises: df.promise()
		 * }).show();
		 *
		 * setTimeout(function() {
		 * 	df.resolve() // ここでイジケータが除去される
		 * }, 2000);
		 * </pre>
		 *
		 * <b>パラメータに複数のPromiseオブジェクトを指定して、done()/fail()の実行と同時にインジケータを除去する</b><br>
		 * Promiseオブジェクトを配列で複数指定すると、全てのPromiseオブジェクトでresolve()が実行されるか、またはいずれかのPromiseオブジェクトでfail()が実行されるタイミングでインジケータを画面から除去します。
		 *
		 * <pre>
		 * var df = $.Deferred();
		 * var df2 = $.Deferred();
		 * var indicator = this.indicator({
		 * 	target: document,
		 * 	promises: [df.promise(), df2.promise()]
		 * }).show();
		 *
		 * setTimeout(function() {
		 * 	df.resolve()
		 * }, 2000);
		 *
		 * setTimeout(function() {
		 * 	df.resolve() // ここでイジケータが除去される
		 * }, 4000);
		 * </pre>
		 *
		 * @param {Object} [opt]
		 * @param {String} [opt.message] メッセージ
		 * @param {Number} [opt.percent] 進捗を0～100の値で指定する。
		 * @param {Boolean} [opt.block] 操作できないよう画面をブロックするか (true:する/false:しない)
		 * @param {Promise|Promise[]} [opt.promises] Promiseオブジェクト (Promiseの状態と合わせてインジケータの表示・非表示する)
		 * @param {String} [opt.theme] インジケータの基点となるクラス名 (CSSでテーマごとにスタイルをする場合に使用する)
		 * @returns {Indicator} インジケータオブジェクト
		 * @memberOf Controller
		 * @see Indicator
		 */
		indicator: function(opt) {
			return callIndicator(this, opt);
		},

		/**
		 * コントローラに定義されているリスナーの実行を許可します。
		 *
		 * @memberOf Controller
		 */
		enableListeners: function() {
			setExecuteListenersFlag(this, true);
		},

		/**
		 * コントローラに定義されているリスナーの実行を禁止します。
		 *
		 * @memberOf Controller
		 */
		disableListeners: function() {
			setExecuteListenersFlag(this, false);
		},

		/**
		 * フォーマット済みメッセージを詰めたエラーをthrowします。
		 *
		 * @memberOf Controller
		 * @param {String|Object} parameter 文字列の場合、第2引数以降をパラメータとしてフォーマットします。<br />
		 *            オブジェクトの場合、そのままErrorクラスへ格納します。
		 * @param {Any} [var_args] 第1引数が文字列の場合のパラメータ
		 */
		throwError: function(parameter, var_args) {
			var error = null;
			if (parameter && typeof parameter === 'string') {
				error = new Error(format.apply(null, argsToArray(arguments)));
			} else {
				error = Error.apply(null, arguments);
			}
			error.customType = null;
			throw error;
		},

		/**
		 * エラータイプとフォーマット済みメッセージを詰めたエラーをthrowします。
		 *
		 * @memberOf Controller
		 * @param {String} customType エラータイプ
		 * @param {String|Object} parameter 文字列の場合、第3引数以降をパラメータとしてフォーマットします。<br />
		 *            オブジェクトの場合、そのままErrorクラスへ格納します。
		 * @param {Any} [var_args] 第2引数が文字列の場合のパラメータ
		 */
		throwCustomError: function(customType, parameter, var_args) {
			// null, undefinedの場合をtrueとしたいため、あえて厳密等価にしていない
			if (customType == null) {
				throwFwError(ERR_CODE_CUSTOM_ERROR_TYPE_REQUIRED);
			}
			var args = argsToArray(arguments);
			args.shift();
			if (parameter && typeof parameter === 'string') {
				error = new Error(format.apply(null, argsToArray(args)));
			} else {
				error = Error.apply(null, args);
			}
			error.customType = customType;
			throw error;
		}
	});

	/**
	 * コントローラマネージャクラス
	 *
	 * @name ControllerManager
	 * @class
	 */
	function ControllerManager() {
		this.rootElement = document;
		this.controllers = [];

		/**
		 * triggerIndicatorイベントハンドラ
		 *
		 * @param {EventContext} context
		 * @memberOf ControllerManager
		 * @private
		 */
		$(document).bind('triggerIndicator', function(event, opt) {
			if (opt.target == null) {
				opt.target = document;
			}
			opt.indicator = callIndicator(this, opt);
			event.stopPropagation();
		});

	}
	$.extend(ControllerManager.prototype, {

		/**
		 * すべてのコントローラのインスタンスの配列を返します。
		 *
		 * @returns {Controller[]} コントローラ配列
		 * @memberOf ControllerManager
		 */
		getAllControllers: function() {
			return this.controllers;
		},

		/**
		 * 指定した要素にバインドされているコントローラを返します。
		 *
		 * @param {String|Element|jQuery} rootElement 要素
		 * @returns {Controller} コントローラ
		 * @memberOf ControllerManager
		 */
		getController: function(rootElement) {
			var target = $(rootElement).get(0);
			var controllers = this.controllers;
			for ( var i = 0, len = controllers.length; i < len; i++) {
				if (target === controllers[i].rootElement) {
					return controllers[i];
				}
			}
		}
	});

	h5.u.obj.expose('h5.core', {
		/**
		 * コントローラマネージャ
		 *
		 * @name controllerManager
		 * @type ControllerManager
		 * @memberOf h5.core
		 */
		controllerManager: new ControllerManager()
	});

	// プロパティ重複チェック用のコントローラプロパティマップ
	var controllerPropertyMap = {};
	var c = new Controller(null, 'a');
	for ( var p in c) {
		if (c.hasOwnProperty(p) && p !== '__name' && p !== '__templates' && p !== '__meta') {
			controllerPropertyMap[p] = 1;
		}
	}
	var proto = Controller.prototype;
	for ( var p in proto) {
		if (proto.hasOwnProperty(p)) {
			controllerPropertyMap[p] = 1;
		}
	}

	/**
	 * コントローラのファクトリ
	 *
	 * @param {String|Element|jQuery} targetElement バインド対象とする要素のセレクタ、DOMエレメント、もしくはjQueryオブジェクト.
	 * @param {Object} controllerDefObj コントローラ定義オブジェクト
	 * @param {Object} [param] 初期化パラメータ.
	 */
	// fwOptは内部的に使用している.
	function createAndBindController(targetElement, controllerDefObj, param, fwOpt) {

		// コントローラ名
		var controllerName = controllerDefObj.__name;
		if (!controllerName || $.trim(controllerName).length === 0) {
			throwFwError(ERR_CODE_CONTROLLER_NAME_REQUIRED, null, {
				controllerDefObj: controllerDefObj
			});
		}

		// 初期化パラメータがオブジェクトかどうかチェック
		if (param && !$.isPlainObject(param)) {
			throwFwError(ERR_CODE_CONTROLLER_INVALID_INIT_PARAM, [controllerName], {
				controllerDefObj: controllerDefObj
			});
		}

		// 既にコントローラ化されているかどうかチェック
		if (controllerDefObj.__controllerContext) {
			throwFwError(ERR_CODE_CONTROLLER_ALREADY_CREATED, null, {
				controllerDefObj: controllerDefObj
			});
		}

		// バインド対象となる要素のチェック
		if (targetElement) {
			var $bindTargetElement = $(targetElement);
			if ($bindTargetElement.length === 0) {
				throwFwError(ERR_CODE_BIND_NOT_TARGET, [controllerName], {
					controllerDefObj: controllerDefObj
				});
			}
			if ($bindTargetElement.length > 1) {
				throwFwError(ERR_CODE_BIND_TARGET_COMPLEX, [controllerName], {
					controllerDefObj: controllerDefObj
				});
			}
		}

		// コントローラの循環参照チェック
		if (checkControllerCircularRef(controllerDefObj)) {
			throwFwError(ERR_CODE_CONTROLLER_CIRCULAR_REF, [controllerName], {
				controllerDefObj: controllerDefObj
			});
		}

		// ロジックの循環参照チェック
		if (checkLogicCircularRef(controllerDefObj)) {
			throwFwError(ERR_CODE_LOGIC_CIRCULAR_REF, [controllerName], {
				controllerDefObj: controllerDefObj
			});
		}

		var isRoot = !fwOpt || !fwOpt.isInternal;
		var clonedControllerDef = $.extend(true, {}, controllerDefObj);
		var controller = new Controller(targetElement ? $(targetElement).get(0) : null,
				controllerName, param, isRoot);

		var templates = controllerDefObj.__templates;
		var templateDfd = getDeferred();
		var templatePromise = templateDfd.promise();
		var preinitDfd = getDeferred();
		var preinitPromise = preinitDfd.promise();

		controller.__controllerContext.templatePromise = templatePromise;
		controller.preinitPromise = preinitPromise;
		controller.__controllerContext.initDfd = getDeferred();
		controller.initPromise = controller.__controllerContext.initDfd.promise();
		controller.__controllerContext.readyDfd = getDeferred();
		controller.readyPromise = controller.__controllerContext.readyDfd.promise();

		if (templates && templates.length > 0) {
			// テンプレートがあればロード
			var viewLoad = function(count) {
				// Viewモジュールがない場合、この直後のloadでエラーが発生してしまうためここでエラーを投げる。
				if (!getByPath('h5.core.view')) {
					throwFwError(ERR_CODE_NOT_VIEW);
				}
				var vp = controller.view.load(templates);
				vp.then(function(result) {
					/* del begin */
					if (templates && templates.length > 0) {
						fwLogger.info('コントローラ"{0}"のテンプレートの読み込みに成功しました。', controllerName);
					}
					/* del end */
					templateDfd.resolve();
				}, function(result) {
					// テンプレートのロードをリトライする条件は、リトライ回数が上限回数未満、かつ
					// jqXhr.statusが"0"、もしくは"12029"であること。
					// jqXhr.statusの値の根拠は、IE以外のブラウザだと通信エラーの時に"0"になっていること、
					// IEの場合は、コネクションが繋がらない時のコードが"12029"であること。
					// 12000番台すべてをリトライ対象としていないのは、何度リトライしても成功しないエラーが含まれていることが理由。
					// WinInet のエラーコード(12001 - 12156):
					// http://support.microsoft.com/kb/193625/ja
					var jqXhrStatus = result.detail.error.status;
					if (count === TEMPLATE_LOAD_RETRY_COUNT || jqXhrStatus !== 0
							&& jqXhrStatus !== 12029) {
						result.controllerDefObject = controllerDefObj;
						setTimeout(function(){
						templateDfd.reject(result);},0);
						return;
					}
					setTimeout(function() {
						viewLoad(++count);
					}, TEMPLATE_LOAD_RETRY_INTERVAL);
				});
			};
			viewLoad(0);
		} else {
			// テンプレートがない場合は、resolve()しておく
			templateDfd.resolve();
		}

		// テンプレートプロミスのハンドラ登録
		templatePromise.done(function() {
			preinitDfd.resolve();
		}).fail(function(e) {
			preinitDfd.reject(e);
			if (controller.__controllerContext) {
				controller.rootController.dispose();
			}
		});

		for ( var prop in clonedControllerDef) {
			if (controllerPropertyMap[prop]) {
				throwFwError(ERR_CODE_CONTROLLER_SAME_PROPERTY, [controllerName, prop], {
					controllerDefObj: controllerDefObj
				});
			} else if (isLifecycleProperty(clonedControllerDef, prop)) {
				// ライフサイクルイベント
				controller[prop] = weaveControllerAspect(clonedControllerDef, prop);
			} else if (isEventHandler(clonedControllerDef, prop)) {
				// イベントハンドラ
				var lastIndex = $.trim(prop).lastIndexOf(' ');
				var selector = $.trim(prop.substring(0, lastIndex));
				var eventName = $.trim(prop.substring(lastIndex + 1, prop.length));
				if (isBindRequested(eventName)) {
					eventName = '[' + $.trim(trimBindEventBracket(eventName)) + ']';
				}

				if (isGlobalSelector(selector)) {
					var selectTarget = trimGlobalSelectorBracket(selector);
					if (selectTarget === 'this') {
						throwFwError(ERR_CODE_EVENT_HANDLER_SELECTOR_THIS, [controllerName], {
							controllerDefObj: controllerDefObj
						});
					}
				}
				var bindMap = controller.__controllerContext.bindMap;
				if (!bindMap[selector]) {
					bindMap[selector] = {};
				}
				if (bindMap[selector][eventName]) {
					throwFwError(ERR_CODE_SAME_EVENT_HANDLER,
							[controllerName, selector, eventName], {
								controllerDefObj: controllerDefObj
							});
				}
				var weavedFunc = weaveControllerAspect(clonedControllerDef, prop, true);
				bindMap[selector][eventName] = weavedFunc;
				controller[prop] = weavedFunc;
			} else if (endsWith(prop, SUFFIX_CONTROLLER) && clonedControllerDef[prop]
					&& !$.isFunction(clonedControllerDef[prop])) {
				var c = createAndBindController(null,
						$.extend(true, {}, clonedControllerDef[prop]), param, $.extend({
							isInternal: true
						}, fwOpt));
				controller[prop] = c;
			} else if (endsWith(prop, SUFFIX_LOGIC) && clonedControllerDef[prop]
					&& !$.isFunction(clonedControllerDef[prop])) {
				// ロジック
				var logicTarget = clonedControllerDef[prop];
				var logic = createLogic(logicTarget);
				controller[prop] = logic;
			} else if ($.isFunction(clonedControllerDef[prop])) {
				// イベントハンドラではないメソッド
				controller[prop] = weaveControllerAspect(clonedControllerDef, prop);
			} else {
				// その他プロパティ
				controller[prop] = clonedControllerDef[prop];
			}
		}

		// __metaのチェック
		var meta = controller.__meta;
		if (meta) {
			for ( var prop in meta) {
				var c = controller[prop];
				if (c === undefined) {
					throwFwError(ERR_CODE_CONTROLLER_META_KEY_INVALID, [controllerName, prop], {
						controllerDefObj: controllerDefObj
					});
				}
				if (c === null) {
					throwFwError(ERR_CODE_CONTROLLER_META_KEY_NULL, [controllerName, prop], {
						controllerDefObj: controllerDefObj
					});
				}
				if (Controller.prototype.constructor !== c.constructor) {
					throwFwError(ERR_CODE_CONTROLLER_META_KEY_NOT_CONTROLLER,
							[controllerName, prop], {
								controllerDefObj: controllerDefObj
							});
				}
			}
		}

		// __constructがあれば実行。ここまでは完全に同期処理になる。
		if (controller.__construct) {
			controller.__construct(createInitializationContext(controller));
		}

		if (isDisposing(controller)) {
			return null;
		}
		// ルートコントローラなら、ルートをセット
		if (controller.__controllerContext.isRoot) {
			setRootAndTriggerInit(controller);
		}
		return controller;
	}

	/**
	 * オブジェクトのロジック化を行います。
	 *
	 * @param {Object} logicDefObj ロジック定義オブジェクト
	 * @returns {Logic}
	 * @name logic
	 * @function
	 * @memberOf h5.core
	 */
	function createLogic(logicDefObj) {
		var logicName = logicDefObj.__name;
		if (!logicName || $.trim(logicName.length) === 0) {
			throwFwError(ERR_CODE_LOGIC_NAME_REQUIRED, null, {
				logicDefObj: logicDefObj
			});
		}
		if (logicDefObj.__logicContext) {
			throwFwError(ERR_CODE_LOGIC_ALREADY_CREATED, null, {
				logicDefObj: logicDefObj
			});
		}
		var logic = weaveLogicAspect($.extend(true, {}, logicDefObj));
		logic.deferred = getDeferred;
		logic.log = h5.log.createLogger(logicName);
		logic.__logicContext = {};

		for ( var prop in logic) {
			if (logic.hasOwnProperty(prop) && endsWith(prop, SUFFIX_LOGIC)) {
				var target = logic[prop];
				logic[prop] = createLogic(target);
			}
		}
		return logic;
	}

	// =============================
	// Expose to window
	// =============================

	/**
	 * Core MVCの名前空間
	 *
	 * @name core
	 * @memberOf h5
	 * @namespace
	 */
	h5.u.obj.expose('h5.core', {
		/**
		 * オブジェクトのコントローラ化と、要素へのバインドを行います。
		 *
		 * @param {String|Element|jQuery} targetElement バインド対象とする要素のセレクタ、DOMエレメント、もしくはjQueryオブジェクト..<br />
		 *            セレクタで指定したときにバインド対象となる要素が存在しない、もしくは2つ以上存在する場合、エラーとなります。
		 * @param {Object} controllerDefObj コントローラ定義オブジェクト
		 * @param {Object} [param] 初期化パラメータ.<br />
		 *            初期化パラメータは __construct, __init, __readyの引数として渡されるオブジェクトの argsプロパティとして格納されます。
		 * @returns {Controller} コントローラ
		 * @name controller
		 * @function
		 * @memberOf h5.core
		 */
		controller: createAndBindController,

		logic: createLogic,

		/**
		 * コントローラ、ロジックを__nameで公開します。<br />
		 * 例：__nameが"jp.co.nssol.controller.TestController"の場合、window.jp.co.nssol.controller.TestController
		 * で グローバルから辿れるようにします。
		 *
		 * @param {Controller|Logic} obj コントローラ、もしくはロジック
		 * @name expose
		 * @function
		 * @memberOf h5.core
		 */
		expose: function(obj) {
			var objName = obj.__name;
			if (!objName) {
				throwFwError(ERR_CODE_EXPOSE_NAME_REQUIRED, null, {
					target: obj
				});
			}
			var lastIndex = objName.lastIndexOf('.');
			if (lastIndex === -1) {
				window[objName] = obj;
			} else {
				var ns = objName.substr(0, lastIndex);
				var key = objName.substr(lastIndex + 1, objName.length);
				var nsObj = {};
				nsObj[key] = obj;
				h5.u.obj.expose(ns, nsObj);
			}

		}
	});
})();


/* ------ h5.core.view ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	/**
	 * テンプレート文字列のコンパイル時に発生するエラー
	 */
	var ERR_CODE_TEMPLATE_COMPILE = 7000;

	/**
	 * テンプレートファイルの内容読み込み時に発生するエラー
	 */
	var ERR_CODE_TEMPLATE_FILE = 7001;

	/**
	 * テンプレートIDが不正である時に発生するエラー
	 */
	var ERR_CODE_TEMPLATE_INVALID_ID = 7002;

	/**
	 * テンプレートファイルの取得時に発生するエラー
	 */
	var ERR_CODE_TEMPLATE_AJAX = 7003;

	/**
	 * load()呼び出し時に引数にファイル名またはファイル名の配列が渡されなかった時に発生するエラー
	 */
	var ERR_CODE_INVALID_FILE_PATH = 7004;

	/**
	 * 登録されていないテンプレートIDを指定したときに発生するエラー
	 */
	var ERR_CODE_TEMPLATE_ID_UNAVAILABLE = 7005;

	/**
	 * テンプレートに渡すパラメータに必要なプロパティが設定されていない時に発生するエラー
	 */
	var ERR_CODE_TEMPLATE_PROPATY_UNDEFINED = 7006;

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_TEMPLATE_COMPILE] = 'テンプレートをコンパイルできませんでした。{0}';
	errMsgMap[ERR_CODE_TEMPLATE_FILE] = 'テンプレートファイルが不正です。{0}';
	errMsgMap[ERR_CODE_TEMPLATE_INVALID_ID] = 'テンプレートIDが指定されていません。空や空白でない文字列で指定してください。';
	errMsgMap[ERR_CODE_TEMPLATE_AJAX] = 'テンプレートファイルを取得できませんでした。';
	errMsgMap[ERR_CODE_INVALID_FILE_PATH] = 'テンプレートファイルの指定が不正です。空や空白でない文字列、または文字列の配列で指定してください。';
	errMsgMap[ERR_CODE_TEMPLATE_ID_UNAVAILABLE] = 'テンプレートID:{0} テンプレートがありません。';
	errMsgMap[ERR_CODE_TEMPLATE_PROPATY_UNDEFINED] = '{0} テンプレートにパラメータが設定されていません。';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);

	/**
	 * register(id,str)でstrにstring型以外が渡されたときに発生させる例外のdetailに格納するメッセージ。
	 */
	var ERR_REASON_TEMPLATE_IS_NOT_STRING = 'テンプレートには文字列を指定してください';

	/**
	 * scriptタグで囲まれていないテンプレートを読み込んだ時のメッセージ
	 */
	var ERR_REASON_SCRIPT_ELEMENT_IS_NOT_EXIST = 'scriptタグが見つかりません。テンプレート文字列はscriptタグで囲って記述して下さい。';

	/**
	 * テンプレートのコンパイルエラー時に発生するメッセージ
	 */
	var ERR_REASON_SYNTAX_ERR = '構文エラー {0}{1}';

	/**
	 * EJSにスクリプトレットの区切りとして認識させる文字
	 */
	var DELIMITER = '[';

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.core.view');

	/* del begin */

	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	var getDeferred = h5.async.deferred;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	// =============================
	// Variables
	// =============================

	/**
	 * EJSテンプレート内で使用可能なヘルパー関数を格納するオブジェクト
	 */
	var helperExtras = {

		/**
		 * HTML文字列をエスケープします。
		 *
		 * @param {String} str エスケープ対象文字列
		 * @returns {String} エスケープされた文字列
		 */
		escapeHtml: function(str) {
			return h5.u.str.escapeHtml(str);
		}
	};

	/**
	 * テンプレートファイルをURL毎にキャッシュします。テンプレートファイルを取得するときに、キャッシュ済みであればアクセスしません。
	 */
	var cacheManager = {
		/**
		 * キャッシュの最大数
		 */
		MAX_CACHE: 10,

		/**
		 * URLとテンプレートオブジェクトを格納するキャッシュ
		 */
		cache: {},

		/**
		 * 現在キャッシュしているURLを保持する配列。もっとも使用されていないURLが配列の先頭にくるようソートされています。
		 */
		cacheUrls: [],

		/**
		 * 現在アクセス中のURL(絶対パス)をkeyにして、そのpromiseオブジェクトを持つ連想配列
		 */
		accessingUrls: [],

		/**
		 * コンパイル済みテンプレートオブジェクトをキャッシュします。
		 *
		 * @param {String} url URL(絶対パス)
		 * @param {Object} compiled コンパイル済みテンプレートオブジェクト
		 * @param {String} [path] 相対パス
		 */
		append: function(url, compiled, path) {
			if (this.cacheUrls.length >= this.MAX_CACHE) {
				this.deleteCache(this.cacheUrls[0]);
			}
			this.cache[url] = {};
			this.cache[url].templates = compiled;
			this.cache[url].path = path;
			this.cacheUrls.push(url);
		},

		/* del begin */
		/**
		 * テンプレートのグローバルキャッシュが保持しているURL、指定された相対パス、テンプレートIDを持ったオブジェクトを返します。 この関数は開発版でのみ利用できます。
		 *
		 * @returns {Array[Object]} グローバルキャッシュが保持しているテンプレート情報オブジェクトの配列。 [{path:(指定されたパス、相対パス),
		 *          absoluteUrl:(絶対パス), ids:(ファイルから取得したテンプレートのIDの配列)} ,...]
		 */
		getCacheInfo: function() {
			var ret = [];
			for ( var url in this.cache) {
				var obj = this.cache[url];
				var ids = [];
				for ( var id in obj.templates) {
					ids.push(id);
				}
				ret.push({
					path: obj.path,
					absoluteUrl: url,
					ids: ids
				});
			}
			return ret;
		},
		/* del end */

		/**
		 * 指定されたURLのキャッシュを削除します。
		 *
		 * @param {String} url URL
		 * @param {Boolean} isOnlyUrls trueを指定された場合、キャッシュは消さずに、キャッシュしているURLリストから引数に指定されたURLを削除します。
		 */
		deleteCache: function(url, isOnlyUrls) {
			if (!isOnlyUrls) {
				delete this.cache[url];
			}
			for ( var i = 0, len = this.cacheUrls.length; i < len; i++) {
				if (this.cacheUrls[i] === url) {
					this.cacheUrls.splice(i, 1);
					break;
				}
			}
		},

		/**
		 * 指定されたテンプレートパスからテンプレートを非同期で読み込みます。 テンプレートパスがキャッシュに存在する場合はキャッシュから読み込みます。
		 *
		 * @param {Array[String]} resourcePaths テンプレートパス
		 * @returns {Object} Promiseオブジェクト
		 */
		getTemplateByUrls: function(resourcePaths) {
			var ret = {};
			var tasks = [];
			var datas = [];

			var that = this;
			/**
			 * キャッシュからテンプレートを取得します。
			 *
			 * @param {String} url ファイルの絶対パス
			 * @returns {Object} テンプレートIDがkeyである、コンパイル済みテンプレートオブジェクトを持つオブジェクト
			 */
			var getTemplateByURL = function(url) {
				var ret = that.cache[url].templates;
				that.deleteCache(url, true);
				that.cacheUrls.push(url);
				return ret;
			};

			/**
			 * テンプレートをEJS用にコンパイルされたテンプレートに変換します。
			 *
			 * @param {jQuery} $templateElements テンプレートが記述されている要素(<script type="text/ejs">...</script>)
			 * @returns {Object}
			 *          テンプレートIDがkeyである、コンパイル済みテンプレートオブジェクトを持つオブジェクトと、テンプレートを取得したファイルパスと絶対パス(URL)を保持するオブジェクト
			 */
			function compileTemplatesByElements($templateElements) {
				if ($templateElements.length === 0) {
					return;
				}

				/**
				 * テンプレート読み込み結果オブジェクト
				 */
				var compiled = {};
				/**
				 * 読み込んだテンプレートのIDを覚えておく
				 */
				var ids = [];

				$templateElements.each(function() {
					var templateId = $.trim(this.id);
					var templateString = $.trim(this.innerHTML);
					if (!templateId) {
						// 空文字または空白ならエラー
						throwFwError(ERR_CODE_TEMPLATE_INVALID_ID, null, {});
					}

					try {
						var compiledTemplate = new EJS.Compiler(templateString, DELIMITER);
						compiledTemplate.compile();
						compiled[templateId] = compiledTemplate.process;
						ids.push(templateId);
					} catch (e) {
						var lineNo = e.lineNumber;
						var msg = lineNo ? ' line:' + lineNo : '';
						throwFwError(ERR_CODE_TEMPLATE_COMPILE, [h5.u.str.format(
								ERR_REASON_SYNTAX_ERR, msg, e.message)], {
							id: templateId,
							error: e
						});
					}
				});
				return {
					compiled: compiled,
					data: {
						ids: ids
					}
				};
			}
			;

			// キャッシュにあればそれを結果に格納し、なければajaxで取得する。
			for ( var i = 0; i < resourcePaths.length; i++) {
				var path = resourcePaths[i];
				var absolutePath = toAbsoluteUrl(path);
				if (this.cache[absolutePath]) {
					$.extend(ret, getTemplateByURL(absolutePath));
					datas.push({
						absoluteUrl: absolutePath
					});
					continue;
				}
				tasks.push(path);
			}

			var df = getDeferred();

			function load(task, count) {
				var step = count || 0;
				if (task.length == step) {
					df.resolve();
					return;
				}
				var filePath = task[step];
				var absolutePath = toAbsoluteUrl(filePath);
				if (!that.accessingUrls[absolutePath]) {
					that.accessingUrls[absolutePath] = h5.ajax(filePath);
				}

				that.accessingUrls[absolutePath].then(
						function(result, statusText, obj) {
							delete that.accessingUrls[absolutePath];
							var templateText = obj.responseText;
							// IE8以下で、テンプレート要素内にSCRIPTタグが含まれていると、jQueryが</SCRIPT>をunknownElementとして扱ってしまうため、ここで除去する
							var $elements = $(templateText).filter(
									function() {
										// nodeType:8 コメントノード
										return (this.tagName && this.tagName.indexOf('/') === -1)
												&& this.nodeType !== 8;
									});
							var filePath = this.url;

							if ($elements.not('script[type="text/ejs"]').length > 0) {
								df.reject(createRejectReason(ERR_CODE_TEMPLATE_FILE,
										[ERR_REASON_SCRIPT_ELEMENT_IS_NOT_EXIST], {
											url: absolutePath,
											path: filePath
										}));
							}
							var compileData = null;
							try {
								compileData = compileTemplatesByElements($elements
										.filter('script[type="text/ejs"]'));
							} catch (e) {
								e.detail.url = absolutePath;
								e.detail.path = filePath;
								df.reject(e);
							}
							try {
								var compiled = compileData.compiled;
								var data = compileData.data;
								data.path = filePath;
								data.absoluteUrl = absolutePath;
								$.extend(ret, compiled);
								datas.push(data);
								that.append(absolutePath, compiled, filePath);
								load(task, ++step);
							} catch (e) {
								df.reject(createRejectReason(ERR_CODE_TEMPLATE_FILE, null, {
									error: e,
									url: absolutePath,
									path: filePath
								}));
							}
						}).fail(function(e) {
					df.reject(createRejectReason(ERR_CODE_TEMPLATE_AJAX, null, {
						url: absolutePath,
						path: filePath,
						error: e
					}));
					return;
				});

				return df.promise();
			}

			var parentDf = getDeferred();

			$.when(load(tasks)).done(function() {
				parentDf.resolve(ret, datas);
			}).fail(function(e) {
				parentDf.reject(e);
			});

			return parentDf.promise();
		}
	};

	// =============================
	// Functions
	// =============================

	/**
	 * jQueryオブジェクトか判定し、jQueryオブジェクトならそのまま、そうでないならjQueryオブジェクトに変換して返します。
	 *
	 * @function
	 * @param {Object} obj DOM要素
	 * @returns {Object} jQueryObject
	 */
	function getJQueryObj(obj) {
		return h5.u.obj.isJQueryObject(obj) ? obj : $(obj);
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	/**
	 * テンプレートを扱うクラス。
	 * <p>
	 * コントローラは内部にViewインスタンスを持ち、コントローラ内であればthis.viewで参照することができます。
	 * </p>
	 *
	 * @class
	 * @name View
	 */
	function View() {
		/**
		 * キャッシュしたテンプレートを保持するオブジェクト
		 *
		 * @name __cachedTemplates
		 * @memberOf View
		 */
		this.__cachedTemplates = {};
	}
	;

	$.extend(View.prototype, {
		/**
		 * 指定されたパスのテンプレートファイルを非同期で読み込みキャッシュします。
		 *
		 * @memberOf View
		 * @name load
		 * @function
		 * @param {String|Array[String]} resourcePaths テンプレートファイル(.ejs)のパス (配列で複数指定可能)
		 * @returns {Promise} promiseオブジェクト
		 */
		load: function(resourcePaths) {
			var dfd = getDeferred();
			var that = this;

			var paths = null;

			// resourcePathsが文字列か配列でなかったらエラーを投げます。
			switch ($.type(resourcePaths)) {
			case 'string':
				if (!$.trim(resourcePaths)) {
					throwFwError(ERR_CODE_INVALID_FILE_PATH);
				}
				paths = [resourcePaths];
				break;
			case 'array':
				paths = resourcePaths;
				if (paths.length === 0) {
					throwFwError(ERR_CODE_INVALID_FILE_PATH);
				}
				for(var i = 0, len = paths.length; i < len; i++){
					if(typeof paths[i] !== 'string') {
						throwFwError(ERR_CODE_INVALID_FILE_PATH);
					} else if (!$.trim(paths[i])) {
						throwFwError(ERR_CODE_INVALID_FILE_PATH);
					}
				}
				break;
			default:
				throwFwError(ERR_CODE_INVALID_FILE_PATH);
			}

			cacheManager.getTemplateByUrls(paths).done(function(result, datas) {
				/* del begin */
				for ( var id in result) {
					if (that.__cachedTemplates[id]) {
						fwLogger.info('テンプレートID:{0} は上書きされました。', id);
					}
				}
				/* del end */
				$.extend(that.__cachedTemplates, result);
				dfd.resolve(datas);
			}).fail(function(e) {
				dfd.reject(e);
			});
			return dfd.promise();
		},

		/**
		 * Viewインスタンスに登録されている、利用可能なテンプレートのIDの配列を返します。
		 *
		 * @memberOf View
		 * @name getAvailableTemplates
		 * @function
		 * @returns {Array[String]} テンプレートIDの配列
		 */
		getAvailableTemplates: function() {
			var ids = [];
			for ( var id in this.__cachedTemplates) {
				ids.push(id);
			}
			return ids;
		},
		/**
		 * Viewインスタンスに、指定されたIDとテンプレート文字列からテンプレートを1件登録します。
		 * <p>
		 * 指定されたIDのテンプレートがすでに存在する場合は上書きします。 templateStringが不正な場合はエラーを投げます。
		 * </p>
		 *
		 * @memberOf View
		 * @name register
		 * @function
		 * @param {String} templateId テンプレートID
		 * @param {String} templateString テンプレート文字列
		 */
		register: function(templateId, templateString) {
			if ($.type(templateString) !== 'string') {
				throwFwError(ERR_CODE_TEMPLATE_COMPILE, [ERR_REASON_TEMPLATE_IS_NOT_STRING], {
					id: templateId
				});
			} else if (typeof templateId !== 'string' || !$.trim(templateId)) {
				throwFwError(ERR_CODE_TEMPLATE_INVALID_ID, []);
			}

			try {
				var compiledTemplate = new EJS.Compiler(templateString, DELIMITER);
				compiledTemplate.compile();
				this.__cachedTemplates[templateId] = compiledTemplate.process;
			} catch (e) {
				var lineNo = e.lineNumber;
				var msg = lineNo ? ' line:' + lineNo : '';
				throwFwError(ERR_CODE_TEMPLATE_COMPILE, [h5.u.str.format(ERR_REASON_SYNTAX_ERR,
						msg, e.message)], {
					id: templateId
				});
			}
		},

		/**
		 * テンプレート文字列が、コンパイルできるかどうかを返します。
		 *
		 * @memberOf View
		 * @name isValid
		 * @function
		 * @returns {Boolean} 第一引数に渡されたテンプレート文字列がコンパイル可能かどうか。
		 */
		isValid: function(templateString) {
			try {
				new EJS.Compiler(templateString, DELIMITER).compile();
				return true;
			} catch (e) {
				return false;
			}
		},

		/**
		 * パラメータで置換された、指定されたテンプレートIDのテンプレートを取得します。
		 * <p>
		 * 取得するテンプレート内に置換要素([%= %])が存在する場合、パラメータを全て指定してください。
		 * </p>
		 * <p>
		 * templateIdがこのViewインスタンスで利用可能でなければエラーを投げます。
		 * </p>
		 * <p> ※ ただし、コントローラが持つviewインスタンスから呼ばれた場合、templateIdが利用可能でない場合は再帰的に親コントローラをたどり、
		 * 親コントローラが持つViewインスタンスで利用可能かどうか確認します。 利用可能であれば、そのインスタンスのview.get()を実行します。
		 * </p>
		 * <p>
		 * 一番上の親のViewインスタンスまで辿ってもtemplateId利用可能でなければ場合はh5.core.view.get()を実行します。
		 * h5.core.viewでtemplateIdが利用可能でなければエラーを投げます。
		 * </p>
		 * <p>
		 * <a href="#update">update()</a>, <a href="#append">append()</a>, <a
		 * href="#prepend">prepend()</a>についても同様です。
		 * </p>
		 *
		 * @memberOf View
		 * @name get
		 * @function
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ(オブジェクトリテラルで指定)
		 * @returns {String} テンプレート文字列
		 */
		get: function(templateId, param) {
			var cache = this.__cachedTemplates;

			if ($.isEmptyObject(cache)) {
				return null;
			}

			if (typeof templateId !== 'string' || !$.trim(templateId)) {
				fwLogger.info(errMsgMap[ERR_CODE_TEMPLATE_INVALID_ID]);
				throwFwError(ERR_CODE_TEMPLATE_INVALID_ID);
			}

			var template = cache[templateId];

			if (!template) {
				fwLogger.info(errMsgMap[ERR_CODE_TEMPLATE_ID_UNAVAILABLE], templateId);
				throwFwError(ERR_CODE_TEMPLATE_ID_UNAVAILABLE, templateId);
			}

			var p = (param) ? $.extend(true, {}, param) : {};
			var helper = p.hasOwnProperty('_h') ? new EJS.Helpers(p) : new EJS.Helpers(p, {
				_h: helperExtras
			});
			var ret = null;

			try {
				ret = template.call(p, p, helper);
			} catch (e) {
				fwLogger.info(errMsgMap[ERR_CODE_TEMPLATE_PROPATY_UNDEFINED], e.toString());
				throwFwError(ERR_CODE_TEMPLATE_PROPATY_UNDEFINED, e.toString(), e);
			}

			return ret;
		},

		/**
		 * 要素を指定されたIDのテンプレートで書き換えます。
		 * <p>
		 * templateIdがこのViewインスタンスで利用可能でなければエラーを投げますが、
		 * コントローラが持つviewインスタンスから呼ばれた場合は親コントローラのviewを再帰的にたどります。詳細は<a href="#get">get()</a>をご覧ください。
		 * </p>
		 *
		 * @memberOf View
		 * @name update
		 * @function
		 * @param {String|Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ
		 * @returns {Object} テンプレートが適用されたDOM要素 (jQueryオブジェクト)
		 */
		update: function(element, templateId, param) {
			return getJQueryObj(element).html(this.get(templateId, param));
		},

		/**
		 * 要素の末尾に指定されたIDのテンプレートを挿入します。
		 * <p>
		 * templateIdがこのViewインスタンスで利用可能でなければエラーを投げますが、
		 * コントローラが持つviewインスタンスから呼ばれた場合は親コントローラのviewを再帰的にたどります。詳細は<a href="#get">get()</a>をご覧ください。
		 * </p>
		 *
		 * @memberOf View
		 * @name append
		 * @function
		 * @param {Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ
		 * @returns {Object} テンプレートが適用されたDOM要素
		 */
		append: function(element, templateId, param) {
			return getJQueryObj(element).append(this.get(templateId, param));
		},

		/**
		 * 要素の先頭に指定されたIDのテンプレートを挿入します。
		 * <p>
		 * templateIdがこのViewインスタンスで利用可能でなければエラーを投げますが、
		 * コントローラが持つviewインスタンスから呼ばれた場合は親コントローラのviewを再帰的にたどります。詳細は<a href="#get">get()</a>をご覧ください。
		 * </p>
		 *
		 * @memberOf View
		 * @name prepend
		 * @function
		 * @param {String|Element|jQuery} element DOM要素(セレクタ文字列, DOM要素, jQueryオブジェクト)
		 * @param {String} templateId テンプレートID
		 * @param {Object} [param] パラメータ
		 * @returns {Object} テンプレートが適用されたDOM要素 (jQueryオブジェクト)
		 */
		prepend: function(element, templateId, param) {
			return getJQueryObj(element).prepend(this.get(templateId, param));
		},

		/**
		 * 指定されたテンプレートIDのテンプレートが存在するか判定します。
		 *
		 * @memberOf View
		 * @name isAvailable
		 * @function
		 * @param {String} templateId テンプレートID
		 * @returns {Boolean} 判定結果(存在する: true / 存在しない: false)
		 */
		isAvailable: function(templateId) {
			return !!this.__cachedTemplates[templateId];
		},

		/**
		 * 引数に指定されたテンプレートIDをもつテンプレートをキャッシュから削除します。 引数を指定しない場合はキャッシュされている全てのテンプレートを削除します。
		 *
		 * @memberOf View
		 * @name clear
		 * @param {String|String[]} templateIds テンプレートID
		 * @function
		 */
		clear: function(templateIds) {
			if (templateIds === undefined) {
				this.__cachedTemplates = {};
				return;
			}

			var templateIdsArray = null;
			switch ($.type(templateIds)) {
			case 'string':
				templateIdsArray = [templateIds];
				break;
			case 'array':
				if(!templateIds.length){
					fwLogger.info(errMsgMap[ERR_CODE_TEMPLATE_INVALID_ID]);
					throwFwError(ERR_CODE_TEMPLATE_INVALID_ID);
				}
				templateIdsArray = templateIds;
				break;
			default:
				fwLogger.info(errMsgMap[ERR_CODE_TEMPLATE_INVALID_ID]);
				throwFwError(ERR_CODE_TEMPLATE_INVALID_ID);
			}

			for ( var i = 0, len = templateIdsArray.length; i < len; i++) {
				var id = templateIdsArray[i];
				if(typeof id !== 'string' || !$.trim(id)){
					fwLogger.info(errMsgMap[ERR_CODE_TEMPLATE_INVALID_ID]);
					throwFwError(ERR_CODE_TEMPLATE_INVALID_ID);
				}
				/* del begin */
				if(!this.__cachedTemplates[id]){
					fwLogger.warn('指定されたIDのテンプレートは登録されていません。"{0}"', id);
				}
				/* del end */
			}

			for ( var i = 0, len = templateIdsArray.length; i < len; i++) {
				delete this.__cachedTemplates[templateIdsArray[i]];
			}
		}
	});

	var view = new View();

	/**
	 * <a href="./View.html">View</a>クラスのインスタンスを生成します。
	 * <p>
	 * この関数はh5.core.viewに公開されたViewインスタンスのみが持ちます。この関数で作られたViewインスタンスはcreateView()を持ちません。
	 * </p>
	 *
	 * @name createView
	 * @memberOf h5.core.view
	 * @function
	 */
	view.createView = function() {
		return new View();
	};

	/**
	 * HTMLに記述されたテンプレートを読み込む
	 * <p>
	 * HTMLにあるテンプレートが構文エラーの場合は、例外そのままスローする。
	 */
	$(function() {
		$('script[type="text/ejs"]').each(function() {
			var templateId = $.trim(this.id);
			var templateText = $.trim(this.innerHTML);

			if (templateText.length === 0 || !templateId) {
				return;
			}

			var compiledTemplate = new EJS.Compiler(templateText, DELIMITER);
			compiledTemplate.compile();
			view.__cachedTemplates[templateId] = compiledTemplate.process;
		});
	});

	// =============================
	// Expose to window
	// =============================

	/**
	 * グローバルに公開されているViewクラスのインスタンスです。
	 *
	 * @name view
	 * @memberOf h5.core
	 * @see View
	 * @namespace
	 */
	h5.u.obj.expose('h5.core', {
		view: view
	});

	/* del begin */
	// 開発支援用にcacheManagerをグローバルに出す。
	h5.u.obj.expose('h5.dev.core.view', {
		cacheManager: cacheManager
	});
	/* del end */

})();

/* ------ h5.ui ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	/**
	 * メッセージを表示する要素のクラス名
	 */
	var CLASS_INDICATOR_THROBBER = 'indicator-throbber';

	/**
	 * スロバーを表示する要素のクラス名
	 */
	var CLASS_INDICATOR_MESSAGE = 'indicator-message';

	/**
	 * スロバー内に進捗率(パーセント)を表示する要素のクラス名
	 */
	var CLASS_THROBBER_PERCENT = 'throbber-percent';

	/**
	 * 一番外側にあるVML要素のクラス名
	 */
	var CLASS_VML_ROOT = 'vml-root';

	/**
	 * BlockUIのメッセージ欄に表示する文字列のフォーマット
	 */
	var FORMAT_THROBBER_MESSAGE_AREA = '<span class="' + CLASS_INDICATOR_THROBBER
			+ '"></span><span class="' + CLASS_INDICATOR_MESSAGE + '" {0}>{1}</span>';

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
	var isPromise = h5.async.isPromise;
	var h5ua = h5.env.ua;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	// =============================
	// Variables
	// =============================
	// キーにスタイルクラス名、値に読み込む対象のプロパティを保持するマップ
	var throbberStyleMap = {
		throbber: ['width', 'height'],
		'throbber-line': ['width', 'color']
	};

	/**
	 * Canvasをサポートしているか
	 * <p>
	 * (true:サポート/false:未サポート)
	 */
	var isCanvasSupported = true;

	/**
	 * VMLをサポートしているか (true:サポート/false:未サポート)
	 */
	// 機能ベースでの判定方法が無いため、ブラウザの種類で判定する
	var isVMLSupported = h5ua.isIE;


	// =============================
	// Functions
	// =============================

	/**
	 * CSSファイルに書かれた、Canvasのスタイル定義を取得します。
	 */
	function readThrobberStyle(theme) {
		var readStyles = {};

		for ( var prop in throbberStyleMap) {
			var $elem = $('<div></div>').addClass(theme).addClass(prop).appendTo('body');
			var propCamel = $.camelCase(prop);

			readStyles[propCamel] = {};

			$.map(throbberStyleMap[prop], function(item, idx) {
				if (item === 'width' || item === 'height') {
					readStyles[propCamel][item] = parseInt($elem.css(item).replace(/\D/g, ''), 10);
				} else {
					readStyles[propCamel][item] = $elem.css(item);
				}
			});

			$elem.remove();
		}

		return readStyles;
	}

	/**
	 * VML要素を生成します。
	 */
	function createVMLElement(tagName, opt) {
		var elem = window.document.createElement('v:' + tagName);

		for ( var prop in opt) {
			elem.style[prop] = opt[prop];
		}

		return elem;
	}

	/**
	 * 要素のサイズから、スロバーの線を引く座標を計算します。
	 */
	function calculateLineCoords(size, line) {
		var positions = [];
		var centerPos = size / 2;
		var radius = size * 0.8 / 2;
		var eachRadian = 360 / line * Math.PI / 180;

		for ( var j = 1; j <= line; j++) {
			var rad = eachRadian * j;
			var cosRad = Math.cos(rad),sinRad = Math.sin(rad);
			positions.push({
				from: {
					x: centerPos + radius / 2 * cosRad,
					y: centerPos + radius / 2 * sinRad
				},
				to: {
					x: centerPos + radius * cosRad,
					y: centerPos + radius * sinRad
				}
			});
		}

		return positions;
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	// VMLとCanvasのサポート判定
	$(function() {
		// Cnavasがサポートされているかチェック
		isCanvasSupported = !!document.createElement("canvas").getContext;

		if (!isCanvasSupported && isVMLSupported) {
			document.namespaces.add('v', 'urn:schemas-microsoft-com:vml');
			document.createStyleSheet().cssText = ['v\\:stroke', 'v\\:line', 'v\\:textbox']
					.join(',')
					+ '{behavior\: url(#default#VML);}';
		}
	});

	/**
	 * VML版スロバー (IE 6,7,8)用
	 */
	function ThrobberVML(opt) {
		this.style = $.extend(true, {}, opt);

		var w = this.style.throbber.width;
		var h = this.style.throbber.height;

		this.group = createVMLElement('group', {
			width: w + 'px',
			height: h + 'px'
		});
		this.group.className = CLASS_VML_ROOT;

		var positions = calculateLineCoords(w, this.style.throbber.lines);
		var lineColor = this.style.throbberLine.color;
		var lineWidth = this.style.throbberLine.width;

		for ( var i = 0, len = positions.length; i < len; i++) {
			var pos = positions[i];
			var from = pos.from;
			var to = pos.to;
			var e = createVMLElement('line');
			e.strokeweight = lineWidth;
			e.strokecolor = lineColor;
			e.fillcolor = lineColor;
			e.from = from.x + ',' + from.y;
			e.to = to.x + ',' + to.y;
			var ce = createVMLElement('stroke');
			ce.opacity = 1;
			e.appendChild(ce);
			this.group.appendChild(e);
		}

		this._createPercentArea();
	}

	ThrobberVML.prototype = {
		show: function(root) {
			if (!root) {
				return;
			}

			this.root = root;
			this.highlightPos = 1;
			this.hide();
			this.root.appendChild(this.group);
			this._run();
		},
		hide: function() {
			this.root.innerHTML = "";

			if (this._runId) {
				clearTimeout(this._runId);
				this._runId = null;
			}
		},
		_run: function() {
			var lineCount = this.style.throbber.lines;
			var roundTime = this.style.throbber.roundTime;
			var highlightPos = this.highlightPos;
			var lines = this.group.childNodes;

			for ( var i = 0, len = lines.length; i < len; i++) {
				var child = lines[i];

				if (child.nodeName === 'textbox') {
					continue;
				}

				var lineNum = i + 1;
				var line = child.firstChild;
				if (lineNum == highlightPos) {
					line.opacity = "1";
				} else if (lineNum == highlightPos + 1 || lineNum == highlightPos - 1) {
					line.opacity = "0.75";
				} else {
					line.opacity = "0.4";
				}
			}

			if (highlightPos == lineCount) {
				highlightPos = 0;
			} else {
				highlightPos++;
			}

			this.highlightPos = highlightPos;
			var perMills = Math.floor(roundTime / lineCount);

			var that = this;

			this._runId = setTimeout(function() {
				that._run.call(that);
			}, perMills);
		},
		_createPercentArea: function() {
			var textPath = createVMLElement('textbox');
			var $table = $('<table><tr><td></td></tr></table>');
			var $td = $table.find('td');
			$td.width(this.group.style.width);
			$td.height(this.group.style.height);
			$td.css('line-height', this.group.style.height);
			$td.addClass(CLASS_THROBBER_PERCENT);

			textPath.appendChild($table[0]);
			this.group.appendChild(textPath);
		},
		setPercent: function(percent) {
			$(this.group).find('.' + CLASS_THROBBER_PERCENT).html(percent);
		}
	};

	/**
	 * Canvas版スロバー
	 */
	var ThrobberCanvas = function(opt) {
		this.style = $.extend(true, {}, opt);
		this.canvas = document.createElement('canvas');
		this.baseDiv = document.createElement('div');
		this.percentDiv = document.createElement('div');

		var canvas = this.canvas;
		var baseDiv = this.baseDiv;
		var percentDiv = this.percentDiv;
		// CSSファイルから読み取ったスタイルをCanvasに適用する
		canvas.width = this.style.throbber.width;
		canvas.height = this.style.throbber.height;
		canvas.style.display = 'block';
		canvas.style.position = 'absolute';
		baseDiv.style.width = this.style.throbber.width + 'px';
		baseDiv.style.height = this.style.throbber.height + 'px';
		baseDiv.appendChild(canvas);
		// パーセント表示用DIV
		percentDiv.style.width = this.style.throbber.width + 'px';
		percentDiv.style.height = this.style.throbber.height + 'px';
		percentDiv.style.lineHeight = this.style.throbber.height + 'px';
		percentDiv.className = CLASS_THROBBER_PERCENT;
		baseDiv.appendChild(percentDiv);

		this.positions = calculateLineCoords(canvas.width, this.style.throbber.lines);
	};

	ThrobberCanvas.prototype = {
		show: function(root) {
			if (!root) {
				return;
			}

			this.root = root;
			this.highlightPos = 1;
			this.hide();
			this.root.appendChild(this.baseDiv);
			this._run();
		},
		hide: function() {
			// this.root.innerHTML = ''だと、IEにてthis.child.innerHTMLまで空になってしまう
			// removeChildを使うとDOMがない時にエラーが出るため、jQueryのremove()を使っている
			$(this.baseDiv).remove();

			if (this._runId) {
				clearTimeout(this._runId);
				this._runId = null;
			}
		},
		_run: function() {
			var canvas = this.canvas;
			var ctx = canvas.getContext('2d');
			var highlightPos = this.highlightPos;
			var positions = this.positions;
			var lineColor = this.style.throbberLine.color;
			var lineWidth = this.style.throbberLine.width;
			var lineCount = this.style.throbber.lines;
			var roundTime = this.style.throbber.roundTime;

			canvas.width = canvas.width;

			for ( var i = 0, len = positions.length; i < len; i++) {
				ctx.beginPath();
				ctx.strokeStyle = lineColor;
				ctx.lineWidth = lineWidth;
				var lineNum = i + 1;
				if (lineNum == highlightPos) {
					ctx.globalAlpha = 1;
				} else if (lineNum == highlightPos + 1 || lineNum == highlightPos - 1) {
					ctx.globalAlpha = 0.75;
				} else {
					ctx.globalAlpha = 0.4;
				}
				var pos = positions[i];
				var from = pos.from;
				var to = pos.to;
				ctx.moveTo(from.x, from.y);
				ctx.lineTo(to.x, to.y);
				ctx.stroke();
			}
			if (highlightPos == lineCount) {
				highlightPos = 0;
			} else {
				highlightPos++;
			}
			this.highlightPos = highlightPos;
			var perMills = Math.floor(roundTime / lineCount);

			var that = this;

			this._runId = setTimeout(function() {
				that._run.call(that);
			}, perMills);
		},
		setPercent: function(percent) {
			this.percentDiv.innerHTML = percent;
		}
	};



	/**
	 * インジケータ(メッセージ・画面ブロック・進捗表示)の表示や非表示を行うクラス。
	 *
	 * @class
	 * @name Indicator
	 * @param {String|Object} target インジケータを表示する対象のDOMオブジェクトまたはセレクタ
	 * @param {Object} [option] オプション
	 * @param {String} [option.message] メッセージ
	 * @param {Number} [option.percent] 進捗を0～100の値で指定する。
	 * @param {Boolean} [option.block] 操作できないよう画面をブロックするか (true:する/false:しない)
	 * @param {Promise|Promise[]} [option.promises] Promiseオブジェクト (Promiseの状態に合わせて自動でインジケータの非表示を行う)
	 * @param {String} [option.theme] インジケータの基点となるクラス名 (CSSでテーマごとにスタイルを変更する場合に使用する)
	 */
	function Indicator(target, option) {
		$.blockUI.defaults.css = {};
		$.blockUI.defaults.overlayCSS = {};

		this.target = h5.u.obj.isJQueryObject(target) ? target.get(0) : target;

		var that = this;
		var $target = this._isGlobalBlockTarget() ? $('body') : $(this.target);
		var targetPositionStatic = $target.css('position');
		var targetZoom = $target.css('zoom');

		// optionのデフォルト値
		var opts = $.extend(true, {}, {
			message: '',
			percent: -1,
			block: true,
			promises: null,
			theme: 'a'
		}, option);
		// BlockUIのスタイル定義
		var blockUISetting = {
			message: h5.u.str.format(FORMAT_THROBBER_MESSAGE_AREA,
					(opts.message === '') ? 'style="display: none;"' : '', opts.message),
			css: {},
			overlayCSS: {},
			blockMsgClass: opts.theme,
			showOverlay: opts.block,
			centerX: false,
			centerY: false,
			onUnblock: function() { // blockUIが、画面ブロックの削除時に実行するコールバック関数
				// インジケータを表示する要素のpositionがstaticの場合、blockUIがroot要素のpositionをrelativeに書き換えるため、インジケータを表示する前の状態に戻す
				$target.css('position', targetPositionStatic);
				// IEの場合、blockUIがroot要素にzoom:1を設定するため、インジケータを表示する前の状態に戻す
				$target.css('zoom', targetZoom);
				that.throbber.hide();
			}
		};
		// スロバーのスタイル定義 (基本的にはCSSで記述する。ただし固定値はここで設定する)
		var throbberSetting = {
			throbber: {
				roundTime: 1000,
				lines: 12
			},
			throbberLine: {},
			percent: {}
		};

		var promises = opts.promises;
		var promiseCallback = $.proxy(function() {
			this.hide();
		}, this);

		if ($.isArray(promises)) {
			$.map(promises, function(item, idx) {
				return isPromise(item) ? item : null;
			});

			if (promises.length > 0) {
				$.when.apply(null, promises).pipe(promiseCallback, promiseCallback);
			}
		} else if (isPromise(promises)) {
			promises.pipe(promiseCallback, promiseCallback);
		}

		var canvasStyles = readThrobberStyle(opts.theme);
		throbberSetting = $.extend(true, throbberSetting, canvasStyles);

		this._style = $.extend(true, {}, blockUISetting, throbberSetting);

		if (isCanvasSupported) {
			this.throbber = new ThrobberCanvas(this._style);
		} else if (isVMLSupported) {
			this.throbber = new ThrobberVML(this._style);
		}

		if (this.throbber && opts.percent > -1) {
			this.throbber.setPercent(opts.percent);
		}
	}

	Indicator.prototype = {
		/**
		 * 画面上にインジケータ(メッセージ・画面ブロック・進捗表示)を表示します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @returns {Indicator} インジケータオブジェクト
		 */
		show: function() {
			var setting = this._style;
			var $blockElement = null;

			if (this._isGlobalBlockTarget()) {
				$.blockUI(setting);
				$blockElement = $('body').children(
						'.blockUI.' + setting.blockMsgClass + '.blockPage');
			} else {
				var $target = $(this.target);
				$target.block(setting);
				$blockElement = $target.children('.blockUI.' + setting.blockMsgClass
						+ '.blockElement');
			}

			this.throbber.show($blockElement.children('.' + CLASS_INDICATOR_THROBBER)[0]);
			this._setPositionAndResizeWidth();
			return this;
		},
		/**
		 * 内部のコンテンツ納まるようイジケータの幅を調整し、表示位置(topとleft)が中央になるよう設定します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @private
		 */
		_setPositionAndResizeWidth: function() {
			var setting = this._style;
			var $blockParent = null;
			var $blockElement = null;
			var width = 0;

			if (this._isGlobalBlockTarget()) {
				$blockParent = $('body');
				$blockElement = $blockParent.children('.blockUI.' + setting.blockMsgClass
						+ '.blockPage');
				// 画面全体をブロックするので、windowからheightを取得する
				$blockElement.css('top', (($(window).height() - $blockElement.outerHeight()) / 2)
						+ 'px');
			} else {
				$blockParent = $(this.target);
				$blockElement = $blockParent.children('.blockUI.' + setting.blockMsgClass
						+ '.blockElement');
				$blockElement.css('top',
						(($blockParent.height() - $blockElement.outerHeight()) / 2) + 'px');
			}

			var blockElementPadding = $blockElement.innerWidth() - $blockElement.width();

			$blockElement.children().each(function() {
				width += $(this).outerWidth(true);
			});

			$blockElement.width(width + blockElementPadding);
			$blockElement.css('left', (($blockParent.width() - $blockElement.outerWidth()) / 2)
					+ 'px');
		},
		/**
		 * 指定された要素がウィンドウ領域全体をブロックすべき要素か判定します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @private
		 * @returns {Boolean} 領域全体に対してブロックする要素か (true:対象要素 / false: 非対象要素)
		 */
		_isGlobalBlockTarget: function() {
			return this.target === document || this.target === window
					|| this.target === document.body;
		},
		/**
		 * 画面上に表示されているインジケータ(メッセージ・画面ブロック・進捗表示)を除去します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @returns {Indicator} インジケータオブジェクト
		 */
		hide: function() {
			if (this._isGlobalBlockTarget()) {
				$.unblockUI();
			} else {
				$(this.target).unblock();
			}

			return this;
		},
		/**
		 * 進捗のパーセント値を指定された値に更新します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @param {Number} percent 進捗率(0～100%)
		 * @returns {Indicator} インジケータオブジェクト
		 */
		percent: function(percent) {
			if (typeof percent === 'number' && percent >= 0 && percent <= 100) {
				this.throbber.setPercent(percent);
			}

			return this;
		},
		/**
		 * メッセージを指定された値に更新します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @param {String} message メッセージ
		 * @returns {Indicator} インジケータオブジェクト
		 */
		message: function(message) {
			if (typeof message === 'string') {
				var setting = this._style;
				var $blockElement = null;

				if (this._isGlobalBlockTarget()) {
					$blockElement = $('body').children(
							'.blockUI.' + setting.blockMsgClass + '.blockPage');

				} else {
					$blockElement = $(this.target).children(
							'.blockUI.' + setting.blockMsgClass + '.blockElement');
				}

				$blockElement.children('.' + CLASS_INDICATOR_MESSAGE)
						.css('display', 'inline-block').text(message);

				this._setPositionAndResizeWidth();
			}

			return this;
		}
	};

	/**
	 * 指定された要素に対して、インジケータ(メッセージ・画面ブロック・進捗)の表示や非表示を行うためのオブジェクトを取得します。
	 * <h4>使用例</h4>
	 * <b>画面全体をブロックする場合</b><br>
	 * ・画面全体をブロックする場合、targetオプションに<b>document</b>、<b>window</b>または<b>body</b>を指定する。<br>
	 *
	 * <pre>
	 * var indicator = h5.ui.indicator({
	 * 	target: document,
	 * }).show();
	 * </pre>
	 *
	 * <b>li要素にスロバー(くるくる回るアイコン)を表示してブロックを表示しないる場合</b><br>
	 *
	 * <pre>
	 * var indicator = h5.ui.indicator('li', {
	 * 	block: false
	 * }).show();
	 * </pre>
	 *
	 * <b>パラメータにPromiseオブジェクトを指定して、done()/fail()の実行と同時にインジケータを除去する</b><br>
	 * resolve() または resolve() が実行されると、画面からインジケータを除去します。
	 *
	 * <pre>
	 * var df = $.Deferred();
	 * var indicator = h5.ui.indicator(document, {
	 * 	promises: df.promise()
	 * }).show();
	 *
	 * setTimeout(function() {
	 * 	df.resolve() // ここでイジケータが除去される
	 * }, 2000);
	 * </pre>
	 *
	 * <b>パラメータに複数のPromiseオブジェクトを指定して、done()/fail()の実行と同時にインジケータを除去する</b><br>
	 * Promiseオブジェクトを複数指定すると、全てのPromiseオブジェクトでresolve()が実行されるか、またはいずれかのPromiseオブジェクトでfail()が実行されるタイミングでインジケータを画面から除去します。
	 *
	 * <pre>
	 * var df = $.Deferred();
	 * var df2 = $.Deferred();
	 * var indicator = h5.ui.indicator(document, {
	 * 	promises: [df.promise(), df2.promise()]
	 * }).show();
	 *
	 * setTimeout(function() {
	 * 	df.resolve()
	 * }, 2000);
	 *
	 * setTimeout(function() {
	 * 	df.resolve() // ここでイジケータが除去される
	 * }, 4000);
	 * </pre>
	 *
	 * <p>
	 * コントローラのindicator()の仕様については、<a href="./Controller.html#indicator">Controller.indicator</a>のドキュメント
	 * を参照下さい。
	 *
	 * @memberOf h5.ui
	 * @name indicator
	 * @function
	 * @param {String|Object} target インジケータを表示する対象のDOMオブジェクトまたはセレクタ
	 * @param {String} [option.message] メッセージ
	 * @param {Number} [option.percent] 進捗を0～100の値で指定する。
	 * @param {Boolean} [option.block] 操作できないよう画面をブロックするか (true:する/false:しない)
	 * @param {Object} [option.style] スタイルオプション (詳細はIndicatorクラスのドキュメントを参照)
	 * @param {Promise|Promise[]} [option.promises] Promiseオブジェクト (Promiseの状態に合わせて自動でインジケータの非表示を行う)
	 * @param {String} [options.theme] インジケータの基点となるクラス名 (CSSでテーマごとにスタイルをする場合に使用する)
	 * @see Indicator
	 * @see Controller.indicator
	 */
	var indicator = function(target, option) {
		return new Indicator(target, option);
	};

	/**
	 * 要素が可視範囲内、または指定した親要素内にあるかどうかを返します。
	 * <p>
	 * 第2引数を省略した場合、要素がウィンドウ内に見えているかどうかを返します。 elementが他のDOM要素によって隠れていても、範囲内にあればtrueを返します。
	 * </p>
	 * <p>
	 * 第2引数を指定した場合、elementがcontaienrの表示範囲内で見えているかどうかを返します。 containerがウィンドウ内に見えているかどうかは関係ありません。
	 * elementがcontainerの子孫要素で無ければundefinedを返します。
	 * </p>
	 * <p>
	 * いずれの場合も、要素が非表示の場合の動作は保障されません。
	 * </p>
	 *
	 * @param {String|Element|jQuery} element 要素
	 * @param {Object} container コンテナ
	 * @returns {Boolean} 要素が可視範囲内にあるかどうか
	 * @name isInView
	 * @function
	 * @memberOf h5.ui
	 */
	var isInView = function(element, container) {
		var viewTop,viewBottom,viewLeft,viewRight;
		var $element = $(element);
		var height,width;
		var $container;
		// containerの位置を取得。borderの内側の位置で判定する。
		if (container === undefined) {
			// containerが指定されていないときは、画面表示範囲内にあるかどうか判定する
			height = h5.env.ua.isiOS ? window.innerHeight : $(window).height();
			width = h5.env.ua.isiOS ? window.innerWidth : $(window).width();
			viewTop = $(window).scrollTop();
			viewLeft = $(window).scrollLeft();
		} else {
			$container = $(container);
			if ($container.find($element).length === 0) {
				// elementとcontaienrが親子関係でなければundefinedを返す
				return undefined;
			}
			viewTop = $container.offset().top + parseInt($container.css('border-top-width'));
			viewLeft = $container.offset().left + parseInt($container.css('border-left-width'));
			height = $container.innerHeight();
			width = $container.innerWidth();
		}
		viewBottom = viewTop + height;
		viewRight = viewLeft + width;

		// elementの位置を取得。borderの外側の位置で判定する。
		var positionTop = $element.offset().top;
		var positionLeft = $element.offset().left;
		var positionBottom = positionTop + $element.outerHeight();
		var positionRight = positionLeft + $element.outerWidth();
		return ((viewTop <= positionTop && positionTop < viewBottom) || (viewTop < positionBottom && positionBottom <= viewBottom))
				&& ((viewLeft <= positionLeft && positionLeft < viewRight) || (viewLeft < positionRight && positionRight <= viewRight));
	};

	/**
	 * ブラウザのトップにスクロールします。
	 *
	 * @name scrollToTop
	 * @function
	 * @memberOf h5.ui
	 */
	var scrollToTop = function() {
		var waitCount = 3;
		var waitMillis = 500;
		function fnScroll() {
			if (window.scrollY === 1) {
				waitCount = 0;
			}
			if (waitCount > 0) {
				window.scrollTo(0, 1);
				waitCount--;
				setTimeout(fnScroll, waitMillis);
			}
		}

		window.scrollTo(0, 1);
		if ($(window).scrollTop !== 1) {
			setTimeout(fnScroll, waitMillis);
		}
	};

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5.ui', {
		indicator: indicator,
		isInView: isInView,
		scrollToTop: scrollToTop
	});
})();


/* ------ h5.ui.jqm.manager ------ */
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
	var fwLogger = h5.log.createLogger('h5.ui.jqm.manager');

	/* del begin */

	// TODO Minify時にプリプロセッサで削除されるべきものはこの中に書く
	/* del end */


	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// TODO 高速化のために他で定義されている関数などを変数に入れておく場合はここに書く
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	/**
	 * JQMControllerのインスタンス(シングルトン)
	 */
	var jqmControllerInstance = null;

	/**
	 * コントローラのマップ キー：ページID、値：コントローラ定義オブジェクト
	 *
	 * @type Object
	 */
	var controllerMap = {};

	/**
	 * コントローラインスタンスのマップ キー：ページID、値：コントローラインスタンスの配列
	 *
	 * @type Object
	 */
	var controllerInstanceMap = {};

	/**
	 * 初期化パラメータのマップ キー：ページID、値：初期化パラメータ
	 *
	 * @type Object
	 */
	var initParamMap = {};

	/**
	 * CSSファイルのマップ キー：ページID、値：CSSファイルパスのオブジェクト
	 *
	 * @type Object
	 */
	var cssMap = {};

	// =============================
	// Functions
	// =============================

	/**
	 * 現在のアクティブページにコントローラをバインドします。
	 */
	function bindToActivePage() {
		var activePage = $.mobile.activePage;
		if (!activePage) {
			return;
		}
		var id = activePage.attr('id');
		var controllers = controllerInstanceMap[id];
		if (controllerMap[id] && (!controllers || controllers.length === 0)) {
			jqmControllerInstance.addCSS(id);
			jqmControllerInstance.bindController(id);
		}
	}
	// TODO モジュールレベルのプライベート関数はここに書く
	// 関数は関数式ではなく function myFunction(){} のように関数定義で書く

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	/**
	 * @name jqm
	 * @memberOf h5.ui
	 * @namespace
	 */
	h5.u.obj.ns('h5.ui.jqm');

	/**
	 * hifiveで使用するdata属性のプレフィックス。<br />
	 * デフォルトは"h5"。
	 *
	 * @type String
	 * @memberOf h5.ui.jqm
	 * @name dataPrefix
	 */
	h5.ui.jqm.dataPrefix = 'h5';

	/**
	 * JQMコントローラ
	 */
	var jqmController = {
		/**
		 * コントローラ名
		 *
		 * @memberOf JQMController
		 */
		__name: 'JQMController',

		/**
		 * __readyイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		__ready: function(context) {
			var that = this;
			$(':jqmData(role="page"), :jqmData(role="dialog")').each(function() {
				that.loadScript(this.id);
			});
		},

		/**
		 * pageinitイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		':jqmData(role="page"), :jqmData(role="dialog") pageinit': function(context) {
			var id = context.event.target.id;
			this.loadScript(id);
			this.addCSS(id);
			this.bindController(id);
		},

		/**
		 * pageremoveイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		'{document} pageremove': function(context) {
			var id = context.event.target.id;
			var controllers = controllerInstanceMap[id];
			if (!controllers) {
				return;
			}
			for ( var i = 0, len = controllers.length; i < len; i++) {
				controllers[i].dispose();
			}
			controllerInstanceMap[id] = [];
		},

		/**
		 * pagebeforeshowイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		'{document} pagebeforeshow': function(context) {
			var id = context.event.target.id;
			this.addCSS(id);

			// リスナーの有効・無効の切り替え
			for ( var prop in controllerInstanceMap) {
				var controllers = controllerInstanceMap[prop];
				var enable = id === prop;

				for ( var i = 0, len = controllers.length; i < len; i++) {
					var c = controllers[i];
					enable ? c.enableListeners() : c.disableListeners();
				}
			}
		},

		/**
		 * pagehideイベントのハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		'{document} pagehide': function(context) {
			this.removeCSS(context.event.target.id);
		},

		/**
		 * h5controllerboundイベントを監視しコントローラインスタンスを管理するためのイベントハンドラ
		 *
		 * @param {Object} context コンテキスト
		 * @memberOf JQMController
		 */
		'{rootElement} h5controllerbound': function(context) {
			var id = context.event.target.id;
			if (!controllerInstanceMap[id]) {
				controllerInstanceMap[id] = [];
			}
			controllerInstanceMap[id].push(context.evArg);
		},

		/**
		 * 指定されたページIDに紐付くスクリプトをロードする。
		 *
		 * @param {String} id ページID
		 * @memberOf JQMController
		 */
		loadScript: function(id) {
			var page = $('#' + id);
			var script = $.trim(page.data(this.getDataAttribute('script')));
			if (script.length === 0) {
				return;
			}
			var src = $.map(script.split(','), function(n) {
				return $.trim(n);
			});
			var async = page.data(this.getDataAttribute('async')) == true;
			return h5.u.loadScript(src, {
				async: async
			});
		},

		/**
		 * JQMコントローラが使用するdata属性にprefixを付けた属性名を返す。
		 *
		 * @param {String} attributeName 属性名
		 * @returns {String} prefixを付けた属性名
		 */
		getDataAttribute: function(attributeName) {
			var prefix = h5.ui.jqm.dataPrefix;
			if (prefix == null) {
				prefix = 'h5';
			}
			return prefix.length !== 0 ? prefix + '-' + attributeName : attributeName;
		},

		/**
		 * コントローラのバインドを行う
		 *
		 * @param {String} id ページID
		 * @memberOf JQMController
		 */
		bindController: function(id) {
			var controllers = controllerInstanceMap[id];
			if (!controllerMap[id] || (controllers && controllers.length > 0)) {
				return;
			}
			h5.core.controller('#' + id, controllerMap[id], initParamMap[id]);
		},

		/**
		 * 指定されたページIDに紐付くCSSを追加する。
		 *
		 * @param {String} id ページID
		 * @memberOf JQMController
		 */
		addCSS: function(id) {
			var src = cssMap[id];

			if (!src) {
				return;
			}

			var head = document.getElementsByTagName('head')[0];
			var linkTags = head.getElementsByTagName('link');
			var linkLen = linkTags.length;

			src = wrapInArray(src);
			for ( var i = 0, srcLen = src.length; i < srcLen; i++) {
				var path = $.mobile.path.parseUrl(cssMap[id][i]).filename;
				var isLoaded = false;

				for ( var j = 0; j < linkLen; j++) {
					var loadedPath = $.mobile.path.parseUrl(linkTags[j].href).filename;

					if (loadedPath === path) {
						isLoaded = true;
						break;
					}
				}

				if (isLoaded) {
					continue;
				}

				var cssNode = document.createElement('link');
				cssNode.type = 'text/css';
				cssNode.rel = 'stylesheet';
				cssNode.href = cssMap[id][i];
				head.appendChild(cssNode);
			}
		},

		/**
		 * 指定されたページIDに紐付くCSSを削除する。
		 *
		 * @param {String} id ページID
		 * @memberOf JQMController
		 */
		removeCSS: function(id) {
			var current = cssMap[id];
			if (!current) {
				return;
			}
			var activeId = $.mobile.activePage.attr('id');
			var active = cssMap[activeId];
			var src = wrapInArray(current);
			var activeSrc = wrapInArray(active);
			var css = $('link').filter(function() {
				var href = $(this).attr('href');
				return $.inArray(href, src) !== -1 && $.inArray(href, activeSrc) === -1;
			});
			css.remove();
		}
	};

	// =============================
	// Expose to window
	// =============================

	/**
	 * @name manager
	 * @memberOf h5.ui.jqm
	 * @namespace
	 */
	h5.u.obj.expose('h5.ui.jqm.manager', {

		/**
		 * jQuery Mobile用hifiveコントローラマネージャを初期化します。<br />
		 * 2回目以降は何も処理を行いません。
		 *
		 * @memberOf h5.ui.jqm.manager
		 * @function
		 * @name init
		 */
		init: function() {
			$(function() {
				if (jqmControllerInstance) {
					fwLogger.info('JQMマネージャは既に初期化されています。');
				} else {
					jqmControllerInstance = h5.core.controller('body', jqmController);
				}
				bindToActivePage();
			});
		},

		/**
		 * jQuery Mobile用hifiveコントローラマネージャにコントローラを登録します。<br />
		 * 1画面1コントローラを想定しています。<br />
		 *
		 * @param {String} id ページID
		 * @param {String|String[]} cssSrc CSSファイルパス配列
		 * @param {Object} controllerDefObject コントローラを定義したオブジェクト
		 * @param {Object} initParam 初期化パラメータ
		 * @memberOf h5.ui.jqm.manager
		 * @function
		 * @name define
		 */
		define: function(id, cssSrc, controllerDefObject, initParam) {
			controllerMap[id] = controllerDefObject;
			initParamMap[id] = initParam;
			cssMap[id] = wrapInArray(cssSrc);
			!jqmControllerInstance ? h5.ui.jqm.manager.init() : bindToActivePage();
		}
	});
})();

/* ------ h5.api.geo ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	/** エラコード: 指定された緯度または経度の値が不正 */
	var ERR_CODE_INVALID_COORDS = 2000;
	/** エラーコード: getDistance()で、指定された計算モードの定数が不正 */
	var ERR_CODE_INVALID_GEOSYSTEM_CONSTANT = 2001;
	/** エラーコード: 位置情報の取得に失敗 */
	var ERR_CODE_POSITIONING_FAILURE = 2002;

	var errMsgMap = {};
	errMsgMap[ERR_CODE_INVALID_COORDS] = '正しい緯度または経度を指定して下さい。';
	errMsgMap[ERR_CODE_INVALID_GEOSYSTEM_CONSTANT] = '正しい計算モード定数を指定して下さい';
	errMsgMap[ERR_CODE_POSITIONING_FAILURE] = '位置情報の取得に失敗しました。';
	addFwErrorCodeMap(errMsgMap);

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
	// navigator.geolocationをキャッシュする変数
	var geo = null;
	function getGeo() {
		if (!geo) {
			geo = navigator.geolocation;
		}
		return geo;
	}

	var h5ua = h5.env.ua;

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

	/**
	 * h5.api.geo.getDistance() の計算モードを指定するための定数クラス
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。以下のオブジェクトにアクセスするとインスタンスが返されます。
	 * </p>
	 * <ul>
	 * <li>h5.api.geo.GS_GRS80</li>
	 * <li>h5.api.geo.GS_BESSEL</li>
	 * </ul>
	 *
	 * @class
	 * @name GeodeticSystemEnum
	 */
	function GeodeticSystemEnum(oblateness, semiMajorAxis) {
		// 扁平率
		this.oblateness = oblateness;
		// 長(赤道)半径
		this.semiMajorAxis = semiMajorAxis;
	}
	/**
	 * 扁平率を取得します。
	 *
	 * @memberOf GeodeticSystemEnum
	 * @name getOblateness
	 * @returns {Number} 扁平率
	 */
	GeodeticSystemEnum.prototype.getOblateness = function() {
		return this.oblateness;
	};
	/**
	 * 長(赤道)半径を取得します。
	 *
	 * @memberOf GeodeticSystemEnum
	 * @name getSemiMajorAxis
	 * @returns {Number} 長(赤道)半径
	 */
	GeodeticSystemEnum.prototype.getSemiMajorAxis = function() {
		return this.semiMajorAxis;
	};

	/** 計算モード: 世界測地系(GRS80) */
	var GRS80 = new GeodeticSystemEnum(298.257222, 6378137);
	/** 計算モード: 日本測地系(BESSEL) */
	var BESSEL = new GeodeticSystemEnum(299.152813, 6377397.155);
	/** ラジアン毎秒 - 1度毎秒 */
	var DEGREES_PER_SECOND = Math.PI / 180;

	/**
	 * Geolocation API
	 *
	 * @memberOf h5.api
	 * @name geo
	 * @namespace
	 */
	function Geolocation() {
	// 空コンストラクタ
	}

	$.extend(Geolocation.prototype, {
		/**
		 * Geolocation APIが使用可能であるかの判定結果<br>
		 *
		 * @type Boolean
		 * @memberOf h5.api.geo
		 * @name isSupported
		 */
		// IE9の場合、navigator.geolocationにアクセスするとメモリーリークするのでエージェントで利用可能か判定する
		isSupported: (h5ua.isIE && h5ua.browserVersion >= 9) ? true : !!getGeo(),
		/**
		 * 現在地の緯度・経度を取得します。
		 *
		 * @memberOf h5.api.geo
		 * @name getCurrentPosition
		 * @function
		 * @param {Object} [option] 設定情報
		 * @param {Boolean} [option.enableHighAccuracy] 正確な位置を取得するか (ただし消費電力の増加や応答が遅延する)
		 * @param {Number} [option.timeout] 位置情報を取得するまで待機する時間 (ミリ秒)
		 * @param {Number} [option.maximumAge] キャッシュされた位置情報の有効期間を指定する (ミリ秒)
		 * @returns {Promise} Promiseオブジェクト
		 */
		getCurrentPosition: function(option) {
			var dfd = h5.async.deferred();
			getGeo().getCurrentPosition(function(geoPosition) {
				dfd.resolve(geoPosition);
			}, function(e) {
				dfd.reject(createRejectReason(ERR_CODE_POSITIONING_FAILURE, null, e));
			}, option);
			return dfd.promise();
		},
		/**
		 * 現在地の緯度・経度を定期的に送信します。
		 * <p>
		 * このメソッドは定期的に位置情報を取得するため、Deferred.progress()で値を取得します。<br>
		 * (Deferred.done()では値を取得できません。)
		 * <p>
		 * <b>実装例</b><br>
		 *
		 * <pre>
		 * h5.api.geo.watchPosition().progress(function(pos) {
		 * // 変数 pos に位置情報が格納されている。
		 * 		});
		 * </pre>
		 *
		 * @memberOf h5.api.geo
		 * @name watchPosition
		 * @function
		 * @param {Object} [option] 設定情報
		 * @param {Boolean} [option.enableHighAccuracy] 正確な位置を取得するか (ただし消費電力の増加や応答が遅延する)
		 * @param {Number} [option.timeout] 位置情報を取得するまで待機する時間 (ミリ秒)
		 * @param {Number} [option.maximumAge] キャッシュされた位置情報の有効期間を指定する (ミリ秒)
		 * @returns {WatchPositionPromise} WatchPositionPromiseオブジェクト
		 */
		watchPosition: function(option) {
			var dfd = h5.async.deferred();
			var id = getGeo().watchPosition(function(pos) {
				dfd.notify(pos);
			}, function(e) {
				dfd.reject(createRejectReason(ERR_CODE_POSITIONING_FAILURE, null, e));
			}, option);
			/**
			 * h5.api.geo.watchPositionがこのオブジェクトをプロミス化して返します。
			 * <p>
			 * このオブジェクトは自分でnewすることはありません。<b>h5.api.geo.watchPosition</b>関数を呼び出すとインスタンスが返されます。
			 * </p>
			 *
			 * @class
			 * @name WatchPositionPromise
			 */
			function WatchPositionPromise() {
			// 空コンストラクタ
			}
			/**
			 * h5.api.geo.watchPositionで行っているユーザの位置監視を終了します。
			 * <p>
			 * ユーザの位置監視を終了し、Deferred.done()が実行されます。
			 * </p>
			 *
			 * @memberOf WatchPositionPromise
			 * @name unwatch
			 */
			WatchPositionPromise.prototype.unwatch = function() {
				getGeo().clearWatch(id);
				dfd.resolve();
			};
			return dfd.promise(new WatchPositionPromise());
		},
		/**
		 * ヒュベニの法則を使用して、2点間の緯度・経度から直線距離(m)を取得します。
		 * <p>
		 * 定数に使用している長半径・扁平率は国土地理院で紹介されている値を使用。
		 * <p>
		 * 注意:アルゴリズム上、長距離(100km以上)の地点を図る場合1m以上の誤差が出てしまいます。
		 * <h4>計算モードの指定方法</h4>
		 * 計算モードの指定は以下の定数クラスを使用します。<br>
		 * <table border="1">
		 * <tr>
		 * <td>h5.api.geo.GS_GRS80</td>
		 * <td>世界測地系</td>
		 * </tr>
		 * <tr>
		 * <td>h5.api.geo.GS_BESSEL</td>
		 * <td>日本測地系</td>
		 * </tr>
		 * </table>
		 *
		 * @memberOf h5.api.geo
		 * @name getDistance
		 * @function
		 * @param {Number} lat1 地点1の緯度
		 * @param {Number} lng1 地点1の経度
		 * @param {Number} lat2 地点2の緯度
		 * @param {Number} lng2 地点2の経度
		 * @param {GeodeticSystemEnum} [geoSystem] 計算モード定数
		 *            (h5.api.geo.GS_GRS80:世界測地系(未指定の場合このモードで計算する) / h5.api.geo.GS_BESSEL: 日本測地系)
		 * @returns {Number} 2点間の直線距離
		 */
		// TODO 長距離の場合も考えて、距離によって誤差が大きくならない『測地線航海算法』で計算するメソッドの追加も要検討
		getDistance: function(lat1, lng1, lat2, lng2, geoSystem) {
			if (!isFinite(lat1) || !isFinite(lng1) || !isFinite(lat2) || !isFinite(lng2)) {
				throw new throwFwError(ERR_CODE_INVALID_COORDS);
			}
			var geodeticMode = geoSystem ? geoSystem : GRS80;
			if (!(geodeticMode instanceof GeodeticSystemEnum)) {
				throw new throwFwError(ERR_CODE_INVALID_GEOSYSTEM_CONSTANT);
			}
			// 長半径(赤道半径)
			var A = geodeticMode.getSemiMajorAxis();
			// 扁平率
			var O = geodeticMode.getOblateness();
			// 起点の緯度のラジアン
			var latRad1 = lat1 * DEGREES_PER_SECOND;
			// 起点の経度のラジアン
			var lngRad1 = lng1 * DEGREES_PER_SECOND;
			// 終点の緯度のラジアン
			var latRad2 = lat2 * DEGREES_PER_SECOND;
			// 終点の経度のラジアン
			var lngRad2 = lng2 * DEGREES_PER_SECOND;
			// 2点の平均緯度
			var avgLat = (latRad1 + latRad2) / 2;
			// 第一離心率
			var e = (Math.sqrt(2 * O - 1)) / O;
			var e2 = Math.pow(e, 2);
			var W = Math.sqrt(1 - e2 * Math.pow(Math.sin(avgLat), 2));
			// 短半径(極半径)
			var semiminorAxis = A * (1 - e2);
			// 子午線曲率半径
			var M = semiminorAxis / Math.pow(W, 3);
			// 卯酉船曲率半径
			var N = A / W;
			// 2点の緯度差
			var deltaLat = latRad1 - latRad2;
			// 2点の経度差
			var deltaLon = lngRad1 - lngRad2;
			return Math.sqrt(Math.pow(M * deltaLat, 2)
					+ Math.pow(N * Math.cos(avgLat) * deltaLon, 2));
		},
		/**
		 * getDistanceメソッドで使用する計算モード定数 (世界測地系:GRS80)
		 *
		 * @constant
		 * @memberOf h5.api.geo
		 * @name GS_GRS80
		 */
		GS_GRS80: GRS80,
		/**
		 * getDistanceメソッドで使用する計算モード定数 (日本測地系:BESSEL)
		 *
		 * @constant
		 * @memberOf h5.api.geo
		 * @name GS_BESSEL
		 */
		GS_BESSEL: BESSEL
	});

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5.api', {
		geo: new Geolocation()
	});
})();

/* ------ h5.api.sqldb ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================
	/** INSERT フォーマット */
	var INSERT_SQL_FORMAT = 'INSERT INTO {0} ({1}) VALUES ({2})';
	/** INSERT フォーマット(VALUES未指定) */
	var INSERT_SQL_EMPTY_VALUES = 'INSERT INTO {0} DEFAULT VALUES';
	/** SELECT フォーマット */
	var SELECT_SQL_FORMAT = 'SELECT {0} FROM {1}';
	/** UPDATE フォーマット */
	var UPDATE_SQL_FORMAT = 'UPDATE {0} SET {1}';
	/** DELETE フォーマット */
	var DELETE_SQL_FORMAT = 'DELETE FROM {0}';

	// =============================
	// Production
	// =============================

	/** エラーコード: Insert/Sql/Del/Update/Select オブジェクトのexecute()が複数回実行された */
	var ERR_CODE_RETRY_SQL = 3000;
	/** エラーコード: 指定されたテーブル名が不正 */
	var ERR_CODE_INVALID_TABLE_NAME = 3001;
	/** エラーコード: 指定されたトランザクションの型が不正 */
	var ERR_CODE_INVALID_TRANSACTION_TYPE = 3002;
	/** エラーコード: where句に指定されたオペレータ文字列が不正 */
	var ERR_CODE_INVALID_OPERATOR = 3003;
	/** エラーコード: 引数で指定された型が不正 */
	var ERR_CODE_INVALID_PARAM_TYPE = 3004;
	/** エラーコード: 指定した取得カラム名が不正 */
	var ERR_CODE_INVALID_COLUMN_NAME = 3005;
	/** エラーコード: 指定したパラメータが不正 */
	var ERR_CODE_INVALID_VALUES = 3006;
	/** エラーコード: SQLのステートメントが不正 */
	var ERR_CODE_INVALID_STATEMENT = 3007;
	/** エラーコード: パラメータに指定したオブジェクトの型が不正 */
	var ERR_CODE_TYPE_NOT_ARRAY = 3008;
	/** エラーコード: transaction.add()に指定したオブジェクトの型が不正 */
	var ERR_CODE_INVALID_TRANSACTION_TARGET = 3009;
	/** エラーコード: トランザクション処理失敗 */
	var ERR_CODE_TRANSACTION_PROCESSING_FAILURE = 3010;
	/** エラーコード: where句に指定されたカラム名が不正 */
	var ERR_CODE_INVALID_COLUMN_NAME_IN_WHERE = 3011;

	var errMsgMap = {};
	errMsgMap[ERR_CODE_RETRY_SQL] = '同一オブジェクトによるSQLの再実行はできません。';
	errMsgMap[ERR_CODE_INVALID_TABLE_NAME] = '{0}: テーブル名を指定して下さい。';
	errMsgMap[ERR_CODE_INVALID_TRANSACTION_TYPE] = '{0}: トランザクションが不正です。';
	errMsgMap[ERR_CODE_INVALID_OPERATOR] = 'オペレータが不正です。 <= < >= > = != like のいずれかを使用して下さい。';
	errMsgMap[ERR_CODE_INVALID_PARAM_TYPE] = '{0}: {1}に指定したオブジェクトの型が不正です。';
	errMsgMap[ERR_CODE_INVALID_COLUMN_NAME] = '{0}: カラム名を指定して下さい。';
	errMsgMap[ERR_CODE_INVALID_VALUES] = '{0}: 値を指定して下さい。';
	errMsgMap[ERR_CODE_INVALID_STATEMENT] = '{0}: ステートメントが不正です。';
	errMsgMap[ERR_CODE_TYPE_NOT_ARRAY] = '{0}: パラメータは配列で指定して下さい。';
	errMsgMap[ERR_CODE_INVALID_TRANSACTION_TARGET] = '指定されたオブジェクトはトランザクションに追加できません。Insert/Update/Del/Select/Sqlクラスのインスタンスを指定して下さい。';
	errMsgMap[ERR_CODE_TRANSACTION_PROCESSING_FAILURE] = 'トランザクション処理中にエラーが発生しました。{0} {1}';
	errMsgMap[ERR_CODE_INVALID_COLUMN_NAME_IN_WHERE] = 'where句に指定されたカラム名が空白または空文字です。';
	addFwErrorCodeMap(errMsgMap);

	// =============================
	// Development Only
	// =============================

	/* del begin */

	var fwLogger = h5.log.createLogger('h5.api.sqldb');

	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	var getDeferred = h5.async.deferred;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	/**
	 * SQLErrorのエラーコードに対応するメッセージを取得します。
	 */
	function getTransactionErrorMsg(e) {
		switch (e.code) {
		case e.CONSTRAINT_ERR:
			return '一意制約に反しています。';
		case e.DATABASE_ERR:
			return 'データベースエラー';
		case e.QUOTA_ERR:
			return '空き容量が不足しています。';
		case e.SYNTAX_ERR:
			return '構文に誤りがあります。';
		case e.TIMEOUT_ERR:
			return 'ロック要求がタイムアウトしました。';
		case e.TOO_LARGE_ERR:
			return '取得結果の行が多すぎます。';
		case e.UNKNOWN_ERR:
			return 'トランザクション内で例外がスローされました。';
		case e.VERSION_ERR:
			return 'データベースのバージョンが一致しません。';
		}
	}

	// =============================
	// Variables
	// =============================

	// =============================
	// Functions
	// =============================
	/**
	 * トランザクションエラー時に実行する共通処理
	 */
	function transactionErrorCallback(txw, e) {
		var results = txw._tasks;
		for ( var i = results.length - 1; i >= 0; i--) {
			var result = results[i];
			var msgParam = getTransactionErrorMsg(e);
			result.deferred.reject(createRejectReason(ERR_CODE_TRANSACTION_PROCESSING_FAILURE, [
					msgParam, e.message], e));
		}
	}

	/**
	 * トランザクション完了時に実行する共通処理
	 */
	function transactionSuccessCallback(txw) {
		var results = txw._tasks;
		for ( var i = results.length - 1; i >= 0; i--) {
			var result = results[i];
			result.deferred.resolve(result.result);
		}
	}

	/**
	 * Insert/Select/Update/Del/Sql/Transactionオブジェクトのexecute()が二度を呼び出された場合、例外をスローする
	 */
	function checkSqlExecuted(flag) {
		if (flag) {
			throw new throwFwError(ERR_CODE_RETRY_SQL);
		}
	}

	/**
	 * DatabaseWrapper.select()/insert()/update()/del() のパラメータチェック
	 * <p>
	 * tableNameが未指定またはString型以外の型の値が指定された場合、例外をスローします。
	 */
	function checkTableName(funcName, tableName) {
		if (typeof tableName !== 'string') {
			throw new throwFwError(ERR_CODE_INVALID_TABLE_NAME, funcName);
		}
	}

	/**
	 * DatabaseWrapper.select()/insert()/update()/del()/sql()/transaction() のパラメータチェック
	 * <p>
	 * txwがTransactionWrapper型ではない場合、例外をスローします。
	 */
	function checkTransaction(funcName, txw) {
		if (txw !== undefined && !(txw instanceof SQLTransactionWrapper)) {
			throw new throwFwError(ERR_CODE_INVALID_TRANSACTION_TYPE, funcName);
		}
	}

	/**
	 * 条件を保持するオブジェクトから、SQLのプレースホルダを含むWHERE文とパラメータの配列を生成します。
	 */
	function createConditionAndParameters(whereObj, conditions, parameters) {
		if ($.isPlainObject(whereObj)) {
			for ( var prop in whereObj) {
				var params = $.trim(prop).replace(/ +/g, ' ').split(' ');
				var param = [];

				if (params[0] === "") {
					throw new throwFwError(ERR_CODE_INVALID_COLUMN_NAME_IN_WHERE);
				} else if (params.length === 1) {
					param.push(params[0]);
					param.push('=');
					param.push('?');
				} else if (!/^(<=|<|>=|>|=|!=|like)$/i.test(params[1])) {
					throw new throwFwError(ERR_CODE_INVALID_OPERATOR);
				} else if (params.length === 3 && /^like$/i.test(params[1])) {
					param.push(params[0]);
					param.push(params[1]);
					param.push('?');
					param.push('ESCAPE');
					param.push('\"' + params[2] + '\"');
				} else {
					param.push(params[0]);
					param.push(params[1]);
					param.push('?');
				}

				conditions.push(param.join(' '));
				parameters.push(whereObj[prop]);
			}
		}
	}

	/**
	 * マーカークラス
	 * <p>
	 * このクラスを継承しているクラスはTransaction.add()で追加できる。
	 */
	function SqlExecutor() {
	// 空コンストラクタ
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	/**
	 * SQLTransaction拡張クラス
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * Insert/Select/Update/Del/Sql/Transactionオブジェクトのexecute()が返す、Promiseオブジェクトのprogress()の引数に存在します。
	 *
	 * @class
	 * @name SQLTransactionWrapper
	 */
	function SQLTransactionWrapper(db, tx) {
		this._db = db;
		this._tx = tx;
		this._tasks = [];
	}

	$.extend(SQLTransactionWrapper.prototype, {
		/**
		 * トランザクション処理中か判定します。
		 *
		 * @private
		 * @memberOf SQLTransactionWrapper
		 * @function
		 * @returns {Boolean} true:実行中 / false: 未実行
		 */
		_runTransaction: function() {
			return this._tx != null;
		},
		/**
		 * トランザクション処理中か判定し、未処理の場合はトランザクションの開始を、処理中の場合はSQLの実行を行います。
		 *
		 * @private
		 * @memberOf SQLTransactionWrapper
		 * @function
		 * @param {String|Function} param1 パラメータ1
		 * @param {String|Function} param2 パラメータ2
		 * @param {Function} param3 パラメータ3
		 */
		_execute: function(param1, param2, param3) {
			this._runTransaction() ? this._tx.executeSql(param1, param2, param3) : this._db
					.transaction(param1, param2, param3);
		},
		/**
		 * トランザクション内で実行中のDeferredオブジェクトを管理対象として追加します。
		 *
		 * @private
		 * @memberOf SQLTransactionWrapper
		 * @function
		 * @param {Deferred} df Deferredオブジェクト
		 */
		_addTask: function(df) {
			this._tasks.push({
				deferred: df,
				result: null
			});
		},
		/**
		 * SQLの実行結果を設定します。
		 *
		 * @private
		 * @memberOf SQLTransactionWrapper
		 * @function
		 * @param {Any} resul SQL実行結果
		 */
		_setResult: function(result) {
			this._tasks[this._tasks.length - 1].result = result;
		}
	});

	/**
	 * SELECT文とパラメータ配列を生成します。
	 */
	function createSelectStatementAndParameters(params, tableName, column, where, orderBy) {
		var statement = h5.u.str.format(SELECT_SQL_FORMAT, column, tableName);

		if ($.isPlainObject(where)) {
			var conditions = [];
			createConditionAndParameters(where, conditions, params);
			statement += (' WHERE ' + conditions.join(' AND '));
		} else if (typeof where === 'string') {
			statement += (' WHERE ' + where);
		}

		if ($.isArray(orderBy)) {
			statement += (' ORDER BY ' + orderBy.join(', '));
		}

		return statement;
	}

	/**
	 * 指定されたテーブルに対して、検索処理(SELECT)を行うクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().select()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Select
	 */
	function Select(txw, tableName, columns) {
		this._txw = txw;
		this._tableName = tableName;
		this._columns = $.isArray(columns) ? columns.join(', ') : '*';
		this._where = null;
		this._orderBy = null;
		this._statement = null;
		this._params = [];
		this._df = getDeferred();
		this._executed = false;
	}

	Select.prototype = new SqlExecutor();
	$.extend(Select.prototype, {
		/**
		 * WHERE句を設定します。
		 * <p>
		 * <b>条件は以下の方法で設定できます。</b><br>
		 * <ul>
		 * <li>オブジェクト</li>
		 * <li>文字列</li>
		 * </ul>
		 * <b>オブジェクト</b>の場合、キーに『<b>カラム名[半角スペース]オペレータ</b>』、バリューに<b>値</b>を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.select('USER', '*').where({
		 * 	'ID &gt;': 0,
		 * 	'ID &lt;=': 100
		 * })
		 * </pre>
		 *
		 * オペレータで使用可能な文字は以下の通りです。
		 * <ul>
		 * <li> &lt;=</li>
		 * <li> &lt;</li>
		 * <li> &gt;=</li>
		 * <li> &gt;</li>
		 * <li> =</li>
		 * <li> !=</li>
		 * <li> like (sqliteの仕様上大文字・小文字を区別しない)</li>
		 * </ul>
		 * 条件を複数指定した場合、全てAND句で結合されます。 AND句以外の条件で結合したい場合は<b>文字列</b>で条件を指定して下さい。
		 * <p>
		 * <b>エスケープ文字の指定方法</b><br>
		 * キーに『<b>カラム名[半角スペース]オペレータ[半角スペース]エスケープ文字</b>』のように指定します。 <br>
		 * エスケープ文字はクォートやダブルクォートで囲わず、エスケープ文字のみ指定して下さい。
		 * <p>
		 * 例. $をエスケープ文字として指定する場合
		 *
		 * <pre>
		 * db.select('USER', '*').where({
		 * 	'NAME like $': 'SUZUKI$'
		 * });
		 * </pre>
		 *
		 * <p>
		 * <b>文字列</b>の場合、SQLステートメントに追加するWHERE文を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.select('USER', '*').where('ID &gt;= 10 AND ID &lt;= 100');
		 * </pre>
		 *
		 * @function
		 * @memberOf Select
		 * @param {Object|String} whereObj 条件
		 * @returns {Select} Selectオブジェクト
		 */
		where: function(whereObj) {
			if (!$.isPlainObject(whereObj) && typeof whereObj !== 'string') {
				throw new throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Select', 'where']);
			}

			this._where = whereObj;
			return this;
		},
		/**
		 * ORDER BY句を設定します。
		 * <p>
		 * ソート対象のカラムが一つの場合は<b>文字列</b>、複数の場合は<b>配列</b>で指定します。
		 * <p>
		 * 例.IDを降順でソートする場合
		 *
		 * <pre>
		 * db.select('USER', '*').orderBy('ID DESC');
		 * </pre>
		 *
		 * 例.IDを降順、NAMEを昇順でソートする場合
		 *
		 * <pre>
		 * db.select('USER', '*').orderBy(['ID DESC', 'NAME ASC']);
		 * </pre>
		 *
		 * なお、複数の条件が指定されている場合、ソートは配列の先頭に指定されたカラムから順番に実行されます。
		 *
		 * @function
		 * @memberOf Select
		 * @param {Array|String} orderBy 条件
		 * @returns {Select} Selectオブジェクト
		 */
		orderBy: function(orderByObj) {
			if (!$.isPlainObject(orderByObj) && typeof orderByObj !== 'string') {
				throw new throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Select', 'orderBy']);
			}

			this._orderBy = wrapInArray(orderByObj);
			return this;
		},
		/**
		 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します。
		 * <p>
		 * 実行結果は、Promiseオブジェクトのprogress()に指定したコールバック関数または、done()に指定したコールバック関数に、<b>検索結果を保持するインスタンス</b>が返されます。
		 * <p>
		 * 検索結果へのアクセスは以下のように実行します。
		 *
		 * <pre>
		 *  db.insert('USER', {ID:10, NAME:'TANAKA'}).execute().done(function(rows) {
		 * 　rows.item(0).ID     // 検索にマッチした1件目のレコードのID
		 * 　rows.item(0).NAME   // 検索にマッチした1件目のレコードのNAME
		 *  });
		 * </pre>
		 *
		 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
		 *
		 * <pre>
		 *  db.select('PRODUCT', ['ID']).where({NAME: 'ball'}).execute().progress(function(rs, tx) {
		 * 　db.update('STOCK', {PRICE: 2000}, tx).where({ID: rs.item(0).ID}).execute();
		 *  });
		 * </pre>
		 *
		 * db.select().execute()で返ってきたトランザクションを、db.update()の第三引数に指定することで、db.selec()とdb.update()は同一トランザクションで実行されます。
		 *
		 * @function
		 * @memberOf Select
		 * @returns {Promise} Promiseオブジェクト
		 */
		execute: function() {
			var that = this;
			var build = function() {
				that._statement = createSelectStatementAndParameters(that._params, that._tableName,
						that._columns, that._where, that._orderBy);
			};
			var df = getDeferred();
			var txw = this._txw;
			var executed = this._executed;
			var resultSet = null;

			if (txw._runTransaction()) {
				txw._addTask(df);
				build();
				checkSqlExecuted(executed);
				fwLogger.debug('Select: ' + this._statement);
				txw._execute(this._statement, this._params, function(innerTx, rs) {
					resultSet = rs.rows;
					txw._setResult(resultSet);
					df.notify(resultSet, txw);
				});
			} else {
				txw._execute(function(tx) {
					txw._addTask(df);
					build();
					checkSqlExecuted(executed);
					txw._tx = tx;
					fwLogger.debug('Select: ' + that._statement);
					tx.executeSql(that._statement, that._params, function(innerTx, rs) {
						resultSet = rs.rows;
						txw._setResult(resultSet);
						df.notify(resultSet, txw);
					});
				}, function(e) {
					transactionErrorCallback(txw, e);
				}, function() {
					transactionSuccessCallback(txw);
				});
			}

			this._executed = true;
			return df.promise();
		}
	});



	/**
	 * 指定されたテーブルに対して、登録処理(INSERT)を行うクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().insert()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Insert
	 */
	function Insert(txw, tableName, values) {
		this._txw = txw;
		this._tableName = tableName;
		this._values = values ? wrapInArray(values) : [];
		this._statement = [];
		this._params = [];
		this._df = getDeferred();
		this._executed = false;
	}

	Insert.prototype = new SqlExecutor();
	$.extend(Insert.prototype,
			{
				/**
				 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します。
				 * <p>
				 * 実行結果は、Promiseオブジェクトのprogress()に指定したコールバック関数または、done()に指定したコールバック関数に、<b>登録に成功したレコードのIDを持つ配列</b>が返されます。
				 * <p>
				 * 検索結果へのアクセスは以下のように実行します。
				 *
				 * <pre>
				 *  db.insert('USER', {ID:10, NAME:'TANAKA'}).execute().done(function(rows) {
				 * 　rows.item(0).ID     // 検索にマッチした1件目のレコードのID
				 * 　rows.item(0).NAME   // 検索にマッチした1件目のレコードのNAME
				 *  });
				 * </pre>
				 *
				 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
				 *
				 * <pre>
				 *  db.select('STOCK', {ID:10, NAME:'ballA'}).execute().progress(function(rs, tx) { // ※1
				 * 　db.insert('STOCK', {ID:11, NAME:'ballB'}, tx).execute(); // ※2
				 *  });
				 * </pre>
				 *
				 * ※1のprogress()で返ってきたトランザクション(tx)を、※2のinsert()の第三引数に指定することで、2つのdb.insert()は同一トランザクションで実行されます。
				 *
				 * @function
				 * @memberOf Insert
				 * @returns {Promise} Promiseオブジェクト
				 */
				execute: function() {
					var that = this;
					var build = function() {
						var valueObjs = that._values;

						if (valueObjs.length === 0) {
							that._statement.push(h5.u.str.format(INSERT_SQL_EMPTY_VALUES,
									that._tableName));
							that._params.push([]);
							return;
						}

						for ( var i = 0, len = valueObjs.length; i < len; i++) {
							var valueObj = valueObjs[i];

							if (valueObj == null) {
								that._statement.push(h5.u.str.format(INSERT_SQL_EMPTY_VALUES,
										that._tableName));
								that._params.push([]);
							} else if ($.isPlainObject(valueObj)) {
								var values = [];
								var columns = [];
								var params = [];

								for ( var prop in valueObj) {
									values.push('?');
									columns.push(prop);
									params.push(valueObj[prop]);
								}

								that._statement.push(h5.u.str.format(INSERT_SQL_FORMAT,
										that._tableName, columns.join(', '), values.join(', ')));
								that._params.push(params);
							}
						}
					};
					var df = getDeferred();
					var txw = this._txw;
					var executed = this._executed;
					var resultSet = null;
					var insertRowIds = [];
					var index = 0;

					function executeSql() {
						if (that._statement.length === index) {
							resultSet = insertRowIds;
							txw._setResult(resultSet);
							df.notify(resultSet, txw);
							return;
						}

						fwLogger.debug('Insert: ' + that._statement[index]);
						txw._execute(that._statement[index], that._params[index], function(innerTx,
								rs) {
							index++;
							insertRowIds.push(rs.insertId);
							executeSql();
						});
					}

					if (txw._runTransaction()) {
						txw._addTask(df);
						build();
						checkSqlExecuted(executed);
						executeSql();
					} else {
						txw._execute(function(tx) {
							txw._addTask(df);
							build();
							checkSqlExecuted(executed);
							txw._tx = tx;
							executeSql();
						}, function(e) {
							transactionErrorCallback(txw, e);
						}, function() {
							transactionSuccessCallback(txw);
						});
					}

					this._executed = true;
					return df.promise();
				}
			});

	/**
	 * 指定されたテーブルに対して、更新処理(UPDATE)を行うクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().update()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Update
	 */
	function Update(txw, tableName, value) {
		this._txw = txw;
		this._tableName = tableName;
		this._value = value;
		this._where = null;
		this._statement = null;
		this._params = [];
		this._df = getDeferred();
		this._executed = false;
	}

	Update.prototype = new SqlExecutor();
	$.extend(Update.prototype, {
		/**
		 * WHERE句を設定します。
		 * <p>
		 * <b>条件は以下の方法で設定できます。</b><br>
		 * <ul>
		 * <li>オブジェク</li>
		 * <li>文字列</li>
		 * </ul>
		 * <b>オブジェクト</b>の場合、キーに『<b>カラム名[半角スペース]オペレータ</b>』、バリューに<b>値</b>を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.update('USER', {
		 * 	NAME: 'TANAKA'
		 * }).where({
		 * 	'ID &gt;': 0,
		 * 	'ID &lt;=': 100
		 * })
		 * </pre>
		 *
		 * オペレータで使用可能な文字は以下の通りです。
		 * <ul>
		 * <li> &lt;=</li>
		 * <li> &lt;</li>
		 * <li> &gt;=</li>
		 * <li> &gt;</li>
		 * <li> =</li>
		 * <li> !=</li>
		 * <li> like (sqliteの仕様上大文字・小文字を区別しない)</li>
		 * </ul>
		 * 条件を複数指定した場合、全てAND句で結合されます。 AND句以外の条件で結合したい場合は文字列で条件を指定して下さい。
		 * <p>
		 * <b>エスケープ文字の指定方法</b><br>
		 * キーに『<b>カラム名[半角スペース]オペレータ[半角スペース]エスケープ文字</b>』のように指定します。 <br>
		 * エスケープ文字はクォートやダブルクォートで囲わず、エスケープ文字のみ指定して下さい。
		 * <p>
		 * 例. $をエスケープ文字として指定する場合
		 *
		 * <pre>
		 * db.update('USER', {
		 * 	NAME: 'TANAKA'
		 * }).where({
		 * 	'NAME like $': 'SUZUKI$'
		 * });
		 * </pre>
		 *
		 * <p>
		 * <b>文字列</b>の場合、SQLステートメントに追加するWHERE文を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.update('USER').where('ID &gt;= 10 AND ID &lt;= 100')
		 * </pre>
		 *
		 * @function
		 * @memberOf Update
		 * @param {Object|String} whereObj 条件
		 * @returns {Update} Updateオブジェクト
		 */
		where: function(whereObj) {
			if (!$.isPlainObject(whereObj) && typeof whereObj !== 'string') {
				throw new throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Update', 'where']);
			}

			this._where = whereObj;
			return this;
		},
		/**
		 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します。
		 * <p>
		 * 実行結果は、Promiseオブジェクトのprogress()に指定したコールバック関数または、done()に指定したコールバック関数に、<b>更新されたレコードの件数</b>が返されます。
		 *
		 * <pre>
		 *  db.update('USER', {NAME:TANAKA}).where({ID:10}).execute().done(function(rowsAffected) {
		 *  　rowsAffected // 更新されたレコードの行数(Number型)
		 *  });
		 * </pre>
		 *
		 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
		 *
		 * <pre>
		 *  db.select('PRODUCT', ['ID']).where({NAME: 'ball'}).execute().progress(function(rs, tx) {
		 * 　db.update('STOCK', {PRICE: 2000}, tx).where({ID: rs.item(0).ID}).execute();
		 *  });
		 * </pre>
		 *
		 * db.select().execute()で返ってきたトランザクションを、db.update()の第三引数に指定することで、db.select()とdb.update()は同一トランザクションで実行されます。
		 *
		 * @function
		 * @memberOf Update
		 * @returns {Promise} Promiseオブジェクト
		 */
		execute: function() {
			var that = this;
			var build = function() {
				var whereObj = that._where;
				var valueObj = that._value;
				var columns = [];

				for ( var prop in valueObj) {
					columns.push(prop + ' = ?');
					that._params.push(valueObj[prop]);
				}

				that._statement = h5.u.str.format(UPDATE_SQL_FORMAT, that._tableName, columns
						.join(', '));

				if ($.isPlainObject(whereObj)) {
					var conditions = [];
					createConditionAndParameters(whereObj, conditions, that._params);
					that._statement += (' WHERE ' + conditions.join(' AND '));
				} else if (typeof whereObj === 'string') {
					that._statement += (' WHERE ' + whereObj);
				}
			};
			var df = getDeferred();
			var txw = this._txw;
			var executed = this._executed;
			var resultSet = null;

			if (txw._runTransaction()) {
				txw._addTask(df);
				build();
				checkSqlExecuted(executed);
				fwLogger.debug('Update: ' + this._statement);
				txw._execute(this._statement, this._params, function(innerTx, rs) {
					resultSet = rs.rowsAffected;
					txw._setResult(resultSet);
					df.notify(resultSet, txw);
				});
			} else {
				txw._execute(function(tx) {
					txw._addTask(df);
					build();
					checkSqlExecuted(executed);
					txw._tx = tx;
					fwLogger.debug('Update: ' + that._statement);
					tx.executeSql(that._statement, that._params, function(innerTx, rs) {
						resultSet = rs.rowsAffected;
						txw._setResult(resultSet);
						df.notify(resultSet, txw);
					});
				}, function(e) {
					transactionErrorCallback(txw, e);
				}, function() {
					transactionSuccessCallback(txw);
				});
			}

			this._executed = true;
			return df.promise();
		}
	});

	/**
	 * 指定されたテーブルに対して、削除処理(DELETE)を行うクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().del()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 * <p>
	 * <i>deleteは予約語なため、Delとしています。</i>
	 *
	 * @class
	 * @name Del
	 */
	function Del(txw, tableName) {
		this._txw = txw;
		this._tableName = tableName;
		this._where = null;
		this._statement = null;
		this._params = [];
		this._df = getDeferred();
		this._executed = false;
	}

	Del.prototype = new SqlExecutor();
	$.extend(Del.prototype, {
		/**
		 * WHERE句を設定します。
		 * <p>
		 * <b>条件は以下の方法で設定できます。</b><br>
		 * <ul>
		 * <li>オブジェクト</li>
		 * <li>文字列</li>
		 * </ul>
		 * <b>オブジェクト</b>の場合、キーに『<b>カラム名[半角スペース]オペレータ</b>』、バリューに<b>値</b>を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.delete('USER').where({'ID &gt;':0, 'ID &lt;=':100})
		 * </pre>
		 *
		 * オペレータで使用可能な文字は以下の通りです。
		 * <ul>
		 * <li> &lt;=</li>
		 * <li> &lt;</li>
		 * <li> &gt;=</li>
		 * <li> &gt;</li>
		 * <li> =</li>
		 * <li> !=</li>
		 * <li> like (sqliteの仕様上大文字・小文字を区別しない)</li>
		 * </ul>
		 * 条件を複数指定した場合、全てAND句で結合されます。 AND句以外の条件で結合したい場合は文字列で条件を指定して下さい。
		 * <p>
		 * <b>エスケープ文字の指定方法</b><br>
		 * キーに『<b>カラム名[半角スペース]オペレータ[半角スペース]エスケープ文字</b>』のように指定します。 <br>
		 * エスケープ文字はクォートやダブルクォートで囲わず、エスケープ文字のみ指定して下さい。
		 * <p>
		 * 例. $をエスケープ文字として指定する場合
		 *
		 * <pre>
		 * db.delete('USER').where({'NAME like $': 'SUZUKI$'});
		 * </pre>
		 *
		 * <p>
		 * <b>文字列</b>の場合、SQLステートメントに追加するWHERE文を指定します。
		 * <p>
		 * 例. IDが0以上100以下。
		 *
		 * <pre>
		 * db.delete('USER').where('ID &gt;= 10 AND ID &lt;= 100')
		 * </pre>
		 *
		 * @function
		 * @memberOf Del
		 * @param {Object|String} whereObj 条件
		 * @returns {Del} Delオブジェクト
		 */
		where: function(whereObj) {
			if (!$.isPlainObject(whereObj) && typeof whereObj !== 'string') {
				throw new throwFwError(ERR_CODE_INVALID_PARAM_TYPE, ['Del', 'where']);
			}

			this._where = whereObj;
			return this;
		},
		/**
		 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します。
		 * <p>
		 * 実行結果は、Promiseオブジェクトのprogress()に指定したコールバック関数または、done()に指定したコールバック関数に、<b>削除されたレコードの件数</b>が返されます。
		 *
		 * <pre>
		 *  db.del('USER').where({ID:10}).execute().done(function(rowsAffected) {
		 *  　rowsAffected // 削除されたレコードの行数(Number型)
		 *  });
		 * </pre>
		 *
		 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
		 *
		 * <pre>
		 *  db.select('PRODUCT', ['ID']).where({NAME: 'ball'}).execute().progress(function(rs, tx) {
		 *  　db.del('STOCK', tx).where({ID: rs.item(0).ID}).execute();
		 *  });
		 * </pre>
		 *
		 * db.select().execute()で返ってきたトランザクションを、db.del()の第二引数に指定することで、db.select()とdb.del()は同一トランザクションで実行されます。
		 *
		 * @function
		 * @memberOf Del
		 * @returns {Promise} Promiseオブジェクト
		 */
		execute: function() {
			var that = this;
			var build = function() {
				var whereObj = that._where;

				that._statement = h5.u.str.format(DELETE_SQL_FORMAT, that._tableName);

				if ($.isPlainObject(whereObj)) {
					var conditions = [];
					createConditionAndParameters(whereObj, conditions, that._params);
					that._statement += (' WHERE ' + conditions.join(' AND '));
				} else if (typeof whereObj === 'string') {
					that._statement += (' WHERE ' + whereObj);
				}
			};
			var df = getDeferred();
			var txw = this._txw;
			var executed = this._executed;
			var resultSet = null;

			if (txw._runTransaction()) {
				txw._addTask(df);
				build();
				checkSqlExecuted(executed);
				fwLogger.debug('Del: ' + this._statement);
				txw._execute(this._statement, this._params, function(innerTx, rs) {
					resultSet = rs.rowsAffected;
					txw._setResult(resultSet);
					df.notify(resultSet, txw);
				});
			} else {
				txw._execute(function(tx) {
					txw._addTask(df);
					build();
					checkSqlExecuted(executed);
					txw._tx = tx;
					fwLogger.debug('Del: ' + that._statement);
					tx.executeSql(that._statement, that._params, function(innerTx, rs) {
						resultSet = rs.rowsAffected;
						txw._setResult(resultSet);
						df.notify(resultSet, txw);
					});
				}, function(e) {
					transactionErrorCallback(txw, e);
				}, function() {
					transactionSuccessCallback(txw);
				});
			}

			return df.promise();
		}
	});

	/**
	 * 指定されたSQLステートメントを実行するクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().sql()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Sql
	 */
	function Sql(txw, statement, params) {
		this._txw = txw;
		this._statement = statement;
		this._params = params || [];
		this._df = getDeferred();
		this._executed = false;
	}

	Sql.prototype = new SqlExecutor();
	$.extend(Sql.prototype, {
		/**
		 * このオブジェクトに設定された情報からSQLステートメントとパラメータを生成し、SQLを実行します。
		 * <p>
		 * 実行結果は、戻り値であるPromiseオブジェクトのprogress()に指定したコールバック関数または、done()に指定したコールバック関数に、<b>実行結果を保持するオブジェクト</b>が返されます。
		 * <p>
		 * 実行結果オブジェクトは、以下のプロパティを持っています。<br>
		 * <table border="1">
		 * <tr>
		 * <td>プロパティ名</td>
		 * <td>説明</td>
		 * </tr>
		 * <tr>
		 * <td>rows</td>
		 * <td>検索(SELECT)を実行した場合、このプロパティに結果が格納されます。</td>
		 * </tr>
		 * <tr>
		 * <td>insertId</td>
		 * <td>登録(INSERT)を実行した場合、このプロパティに登録したレコードのIDが格納されます。</td>
		 * </tr>
		 * <tr>
		 * <td>rowsAffected</td>
		 * <td>削除(DELETE)や更新(UPDATE)した場合、このプロパティに変更のあったレコードの件数が格納されます。</td>
		 * </tr>
		 * </table>
		 * <p>
		 * 例.検索結果の取得
		 *
		 * <pre>
		 *  db.sql('SELECT * FROM USER').execute().done(function(rs) {
		 *  　rs.rows          // SQLResultSetRowList
		 *  　rs.insertId      // Number
		 *  　rs.rowsAffected  // Number
		 *  });
		 * </pre>
		 *
		 * <p>
		 * <b>SQLResultSetRowList</b>は、以下のプロパティを持っています。<br>
		 * <table border="1">
		 * <tr>
		 * <td>プロパティ名</td>
		 * <td>説明</td>
		 * </tr>
		 * <tr>
		 * <td>length</td>
		 * <td>検索にマッチしたレコードの件数</td>
		 * </tr>
		 * <tr>
		 * <td>rows</td>
		 * <td>検索結果</td>
		 * </tr>
		 * </table>
		 * <p>
		 * 例.検索結果の取得する
		 *
		 * <pre>
		 *  db.sql('SELECT ID, NAME FROM USER').execute().done(function(rs) {
		 * 　rs.rows.item(0).ID     // 検索にマッチした1件目のレコードのID
		 * 　rs.rows.item(0).NAME   // 検索にマッチした1件目のレコードのNAME
		 *  });
		 * </pre>
		 *
		 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
		 * <p>
		 * 例.同一トランザクションでdb.insert()とdb.sql()を実行する
		 *
		 * <pre>
		 *  db.select('PRODUCT', ['ID']).where({NAME: 'ball'}).execute().progress(function(rs, tx) {
		 * 　db.sql('UPDATE STOCK SET PRICE = 2000', tx).where({ID: rs.item(0).ID}).execute();
		 *  });
		 * </pre>
		 *
		 * db.select().execute()で返ってきたトランザクションを、db.sql()の第三引数に指定することで、db.select()とdb.sql()は同一トランザクションで実行されます。
		 *
		 * @function
		 * @memberOf Sql
		 * @returns {Promise} Promiseオブジェクト
		 */
		execute: function() {
			var df = getDeferred();
			var txw = this._txw;
			var executed = this._executed;
			var statement = this._statement;
			var params = this._params;
			var resultSet = null;

			if (txw._runTransaction()) {
				txw._addTask(df);
				checkSqlExecuted(executed);
				fwLogger.debug('Sql: ' + statement);
				txw._execute(statement, params, function(tx, rs) {
					resultSet = rs;
					txw._setResult(resultSet);
					df.notify(resultSet, txw);
				});
			} else {
				txw._execute(function(tx) {
					txw._addTask(df);
					checkSqlExecuted(executed);
					txw._tx = tx;
					fwLogger.debug('Sql: ' + statement);
					tx.executeSql(statement, params, function(innerTx, rs) {
						resultSet = rs;
						txw._setResult(resultSet);
						df.notify(resultSet, txw);
					});
				}, function(e) {
					transactionErrorCallback(txw, e);
				}, function() {
					transactionSuccessCallback(txw);
				});
			}

			this._executed = true;
			return df.promise();
		}
	});

	/**
	 * 指定された複数のSQLを同一トランザクションで実行するクラス。
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open().transaction()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name Transaction
	 */
	function Transaction(txw) {
		this._txw = txw;
		this._queue = [];
		this._df = getDeferred();
		this._executed = false;
	}

	Transaction.prototype = new SqlExecutor();
	$.extend(Transaction.prototype, {
		/**
		 * 1トランザクションで処理したいSQLをタスクに追加します。
		 * <p>
		 * このメソッドには、以下のクラスのインスタンスを追加することができます。
		 * <ul>
		 * <li><a href="Insert.html">Insert</a></li>
		 * <li><a href="Update.html">Update</a></li>
		 * <li><a href="Del.html">Del</a></li>
		 * <li><a href="Select.html">Select</a></li>
		 * <li><a href="Sql.html">Sql</a></li>
		 * </ul>
		 *
		 * @function
		 * @memberOf Transaction
		 * @param {Any} task Insert/Update/Del/Select/Sqlクラスのインスタンス
		 * @return {Transaction} Transactionオブジェクト
		 */
		add: function(task) {
			if (!(task instanceof SqlExecutor)) {
				throw new throwFwError(ERR_CODE_INVALID_TRANSACTION_TARGET);
			}
			this._queue.push(task);
			return this;
		},
		/**
		 * add()で追加された順にSQLを実行します。
		 * <p>
		 * 実行結果は、戻り値であるPromiseオブジェクトのprogress()に指定したコールバック関数、またはdone()に指定したコールバック関数に返されます。
		 *
		 * <pre>
		 *  db.transaction()
		 *   .add(db.insert('USER', {ID:10, NAME:TANAKA}))
		 *   .add(db.insert('USER', {ID:11, NAME:YOSHIDA}))
		 *   .add(db.insert('USER', {ID:12, NAME:SUZUKI})).execute().done(function(rs) {
		 *  　rs // 第一引数: 実行結果
		 *  });
		 * </pre>
		 *
		 * 実行結果は<b>配列(Array)</b>で返され、結果の格納順序は、<b>add()で追加した順序</b>に依存します。<br>
		 * 上記例の場合、3件 db.insert()をadd()で追加しているので、実行結果rsには3つのROWIDが格納されています。( [1, 2, 3]のような構造になっている )
		 * <p>
		 * また、progress()に指定したコールバック関数の第二引数には、トランザクションオブジェクトが格納され、このオブジェクトを使用することで、トランザクションを引き継ぐことができます。
		 *
		 * <pre>
		 *  db.select('PRODUCT', ['ID']).where({NAME: 'ball'}).execute().progress(function(rs, tx) {
		 * 　db.transaction(tx)
		 * 　　.add(db.update('UPDATE STOCK SET PRICE = 2000').where({ID: rs.item(0).ID}))
		 * 　　.execute();
		 *  });
		 * </pre>
		 *
		 * select().execute()で返ってきたトランザクションを、db.transaction()の引数に指定することで、db.select()とdb.transaction()は同一トランザクションで実行されます。
		 *
		 * @function
		 * @memberOf Transaction
		 * @returns {Promise} Promiseオブジェクト
		 */
		execute: function() {
			var df = this._df;
			var txw = this._txw;
			var queue = this._queue;
			var executed = this._executed;
			var index = 0;
			var tasks = null;

			function createTransactionTask(txObj) {
				function TransactionTask(tx) {
					this._txw = new SQLTransactionWrapper(null, tx);
				}

				var ret = [];

				for ( var i = 0, len = queue.length; i < len; i++) {
					TransactionTask.prototype = queue[i];
					ret.push(new TransactionTask(txObj));
				}

				return ret;
			}

			function executeSql() {
				if (tasks.length === index) {
					var results = [];

					for ( var j = 0, len = tasks.length; j < len; j++) {
						var result = tasks[j]._txw._tasks;
						results.push(result[0].result);
					}

					txw._setResult(results);
					df.notify(results, txw);
					return;
				}

				tasks[index].execute().progress(function(rs, innerTx) {
					index++;
					executeSql();
				});
			}

			if (txw._runTransaction()) {
				txw._addTask(df);
				checkSqlExecuted(executed);
				tasks = createTransactionTask(txw._tx);
				executeSql();
			} else {
				txw._execute(function(tx) {
					txw._addTask(df);
					checkSqlExecuted(executed);
					tasks = createTransactionTask(tx);
					txw._tx = tx;
					executeSql();
				}, function(e) {
					transactionErrorCallback(txw, e);
				}, function() {
					transactionSuccessCallback(txw);
				});
			}

			this._executed = true;
			return df.promise();
		},
		promise: function() {
			return this._df.promise();
		}
	});

	/**
	 * Database拡張クラス
	 * <p>
	 * このオブジェクトは自分でnewすることはありません。<br>
	 * <b>h5.api.sqldb.open()</b>を呼び出すと、このクラスのインスタンスが返されます。
	 *
	 * @class
	 * @name DatabaseWrapper
	 * @param {Database} db openDatabase()が返すネイティブのDatabaseオブジェクト
	 */
	function DatabaseWrapper(db) {
		this._db = db;
	}

	$.extend(DatabaseWrapper.prototype, {
		/**
		 * 指定されたテーブルに対して、検索処理(SELECT)を行うためのオブジェクトを生成します。
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} tableName テーブル名
		 * @param {Array} columns カラム
		 * @param {SQLTransactionWrapper} [txw] トランザクション
		 * @returns {Select} SELECTオブジェクト
		 */
		select: function(tableName, columns, txw) {
			checkTableName('select', tableName);
			checkTransaction('select', txw);

			if (!$.isArray(columns) && columns !== '*') {
				throw new throwFwError(ERR_CODE_INVALID_COLUMN_NAME, 'select');
			}

			return new Select(txw ? txw : new SQLTransactionWrapper(this._db, null), tableName,
					columns);
		},
		/**
		 * 指定されたテーブルに対して、登録処理(INSERT)を行うためのオブジェクトを生成します。
		 * <p>
		 * <b>第二引数valuesの指定方法</b>
		 * <p>
		 * 1テーブルに1件INSERTを行う場合は<b>オブジェクト</b>で値を指定します。また、1テーブルに複数件INSERTを行う場合は<b>配列</b>で値を指定します。<br>
		 * <p>
		 * オブジェクトで指定する場合、シンタックスは以下のようになります。
		 *
		 * <pre>
		 * {カラム名:登録する値, ...}
		 * </pre>
		 *
		 * <p>
		 * 例.USERテーブルに、1件レコードをINSERTする。
		 *
		 * <pre>
		 * db.insert('USER', {
		 * 	ID: 10,
		 * 	NAME: 'TANAKA'
		 * }).execute();
		 * </pre>
		 *
		 * <p>
		 * 配列で指定する場合、シンタックスは以下のようになります。
		 *
		 * <pre>
		 * [{カラム名:登録する値, ...}, {カラム名:登録する値, ...}, ...]
		 * </pre>
		 *
		 * <p>
		 * 例.USERテーブルに、3件レコードをINSERTする。
		 *
		 * <pre>
		 * db.insert('USER', [{
		 * 	ID: 1,
		 * 	NAME: 'TANAKA'
		 * }, {
		 * 	ID: 2,
		 * 	NAME: 'YAMADA'
		 * }, {
		 * 	ID: 3,
		 * 	NAME: 'SUZUKI'
		 * }]).execute();
		 * </pre>
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} tableName テーブル名
		 * @param {Object|Array} values 値(登録情報を保持するオブジェクトまたは、登録情報のオブジェクトを複数保持する配列)
		 * @param {SQLTransactionWrapper} [txw] トランザクション
		 * @returns {Insert} INSERTオブジェクト
		 */
		insert: function(tableName, values, txw) {
			checkTableName('insert', tableName);
			checkTransaction('insert', txw);

			if (values != null && !$.isArray(values) && !$.isPlainObject(values)) {
				throw new throwFwError(ERR_CODE_INVALID_VALUES, 'insert');
			}

			return new Insert(txw ? txw : new SQLTransactionWrapper(this._db, null), tableName,
					values);
		},
		/**
		 * 指定されたテーブルに対して、更新処理(UPDATE)を行うためのオブジェクトを生成します。
		 * <p>
		 * <b>第二引数valuesの指定方法</b>
		 * <p>
		 * オブジェクトリテラルで以下のように指定します。
		 *
		 * <pre>
		 * {
		 * 	カラム名: 更新後の値
		 * }
		 * </pre>
		 *
		 * <p>
		 * 例.USERテーブルのNAMEカラムを"TANAKA"に更新する。
		 *
		 * <pre>
		 * db.update('USER', {
		 * 	NAME: 'TANAKA'
		 * }).excute();
		 * </pre>
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} tableName テーブル名
		 * @param {Object} values カラム
		 * @param {SQLTransactionWrapper} [txw] トランザクション
		 * @returns {Update} Updateオブジェクト
		 */
		update: function(tableName, values, txw) {
			checkTableName('update', tableName);
			checkTransaction('update', txw);

			if (!$.isPlainObject(values)) {
				throw new throwFwError(ERR_CODE_INVALID_VALUES, 'update');
			}

			return new Update(txw ? txw : new SQLTransactionWrapper(this._db, null), tableName,
					values);
		},
		/**
		 * 指定されたテーブルに対して、削除処理(DELETE)を行うためのオブジェクトを生成します。
		 * <p>
		 * <i>deleteは予約語なため、delとしています。</i>
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} tableName テーブル名
		 * @param {SQLTransactionWrapper} [txw] トランザクション
		 * @returns {Del} Delオブジェクト
		 */
		del: function(tableName, txw) {
			checkTableName('del', tableName);
			checkTransaction('del', txw);

			return new Del(txw ? txw : new SQLTransactionWrapper(this._db, null), tableName);
		},
		/**
		 * 指定されたステートメントとパラメータから、SQLを実行するためのオブジェクトを生成します。
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} statement SQLステートメント
		 * @param {Array} parameters パラメータ
		 * @param {SQLTransactionWrapper} [txw] トランザクション
		 * @returns {Sql} Sqlオブジェクト
		 */
		sql: function(statement, parameters, txw) {
			checkTransaction('sql', txw);

			if (typeof statement !== 'string') {
				throw new throwFwError(ERR_CODE_INVALID_STATEMENT, 'sql');
			}

			if (parameters != null && !$.isArray(parameters)) {
				throw new throwFwError(ERR_CODE_TYPE_NOT_ARRAY, 'sql');
			}

			return new Sql(txw ? txw : new SQLTransactionWrapper(this._db, null), statement,
					parameters);
		},
		/**
		 * 指定された複数のSQLを同一トランザクションで実行するためのオブジェクトを生成します。
		 *
		 * @memberOf DatabaseWrapper
		 * @function
		 * @param {String} statement テーブル名
		 * @param {Array} parameters パラメータ
		 * @returns {Transaction} Transactionオブジェクト
		 */
		transaction: function(txw) {
			checkTransaction('sql', txw);
			return new Transaction(txw ? txw : new SQLTransactionWrapper(this._db, null));
		}
	});

	function WebSqlDatabase() {
	// 空コンストラクタ
	}

	/**
	 * Web SQL Database
	 *
	 * @memberOf h5.api
	 * @name sqldb
	 * @namespace
	 */
	$.extend(WebSqlDatabase.prototype, {
		/**
		 * Web SQL Databaseが使用可能であるかの判定結果
		 *
		 * @memberOf h5.api.sqldb
		 * @name isSupported
		 * @type Boolean
		 */
		isSupported: !!window.openDatabase,
		/**
		 * データベースに接続します。
		 *
		 * @memberOf h5.api.sqldb
		 * @name open
		 * @function
		 * @param {String} name データベース名
		 * @param {String} [version] バージョン
		 * @param {String} [displayName] 表示用データベース名
		 * @param {Number} [estimatedSize] 見込み容量(バイト)
		 * @returns {DatabaseWrapper} Databaseオブジェクト
		 */
		open: function(name, version, displayName, estimatedSize) {
			if (!this.isSupported) {
				return;
			}

			var conn = openDatabase(name, version, displayName, estimatedSize);
			return new DatabaseWrapper(conn);
		}
	});

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5.api', {
		sqldb: new WebSqlDatabase()
	});
})();


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

/* del begin */
/* ------ h5.dev.api.geo ------ */
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

	/**
	 * 元のh5.api.geo
	 *
	 * @private
	 */
	var originalAPI = {};

	/**
	 * _watchPositionで作られたdeferredオブジェクトの配列
	 *
	 * @private
	 * @type deferred[]
	 */
	var _dfds = [];
	/**
	 * _watchPositionで作られたdeferredオブジェクトに割り当てるID
	 *
	 * @private
	 * @type Number
	 */
	var _dfdID = 0;
	/**
	 * _watchPositionで使用するsetInterval()のタイマーID
	 *
	 * @private
	 * @type Number
	 */
	var _timerID = null;
	/**
	 * _watchPositionがデバッグ用位置情報の何番目を見ているかを設定します。
	 *
	 * @private
	 * @type Number
	 */
	var _watchPointer = 0;

	// =============================
	// Functions
	// =============================
	/**
	 * 以下の構造の位置情報オブジェクトを生成します<br>
	 * <p>
	 * <table border="1">
	 * <tr>
	 * <td>プロパティ名</td>
	 * <td>説明</td>
	 * </tr>
	 * <tr>
	 * <td>latitude</td>
	 * <td>緯度</td>
	 * </tr>
	 * <tr>
	 * <td>longitude</td>
	 * <td>経度</td>
	 * </tr>
	 * <tr>
	 * <td>accuracy</td>
	 * <td>位置の誤差(m)</td>
	 * </tr>
	 * <tr>
	 * <td>altitude</td>
	 * <td>高度(m)</td>
	 * </tr>
	 * <tr>
	 * <td>altitudeAccuracy</td>
	 * <td>高度の誤差(m)</td>
	 * </tr>
	 * <tr>
	 * <td>heading</td>
	 * <td>方角(0～360)(度)</td>
	 * </tr>
	 * <tr>
	 * <td>speed</td>
	 * <td>速度 (m/s)</td>
	 * </tr>
	 * <tr>
	 * <td>timestamp</td>
	 * <td>時刻</td>
	 * </tr>
	 * </table>
	 *
	 * @memberOf h5.dev.api.geo
	 * @private
	 * @params {Object} dummyPosition dummyPositionsに格納されたオブジェクト
	 * @returns {Object} 位置情報オブジェクト
	 * @type Object[]
	 */
	function createPosition(params) {
		var param = params || {};
		param.timestamp = param.timestamp || new Date().getTime();
		var coords = param.coords ? param.coords : param;
		param.coords = {
			latitude: coords.latitude || 0,
			longitude: coords.longitude || 0,
			accuracy: coords.accuracy || 0,
			altitude: coords.altitude || null,
			altitudeAccuracy: coords.altitudeAccuracy || null,
			heading: coords.heading || null,
			speed: coords.speed || null
		};
		return param;
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	// originalAPI に 元のgetCurrentPositionとwatchPositionをとっておく
	originalAPI.getCurrentPosition = h5.api.geo.getCurrentPosition;
	originalAPI.watchPosition = h5.api.geo.watchPosition;

	function H5GeolocationSupport() {
	// 空コンストラクタ
	}

	/**
	 * ※この関数はh5.dev.jsを読み込んだ場合のみ利用可能です。開発支援用機能のため、最終リリース物にh5.dev.jsやデバッグコードが混入しないよう十分ご注意ください。<br>
	 * dummyPosiitonsへ位置情報オブジェクトを格納して使用してください。位置情報はcreatePosition()で作成することができます。
	 *
	 * @memberOf h5.dev.api
	 * @name geo
	 * @namespace
	 */
	$.extend(H5GeolocationSupport.prototype, {
		/**
		 * 強制的にロケーションの取得に失敗させるかどうか
		 *
		 * @memberOf h5.dev.api.geo
		 * @type Boolean
		 */
		forceError: false,
		/**
		 * _watchPositionの座標の送信間隔(ms)
		 *
		 * @memberOf h5.dev.api.geo
		 * @type Number
		 */
		watchIntervalTime: 1000,
		/**
		 * デバッグ用位置情報
		 * <p>
		 * 位置情報オブジェクトを格納する配列です。 以下のようなオブジェクトを格納してください。
		 * </p>
		 * <table class="params" style=""><thead>
		 * <tr>
		 * <th>Name</th>
		 * <th>Type</th>
		 * <th>Argument</th>
		 * <th class="last">Description</th>
		 * </tr>
		 * </thead><tbody>
		 * <tr>
		 * <td class="name"><code>coords</code></td>
		 * <td class="type"> Object </td>
		 * <td class="attributes"></td>
		 * <td class="description last">
		 * <h6>Properties</h6>
		 * <table class="params"><thead>
		 * <tr>
		 * <th>Name</th>
		 * <th>Type</th>
		 * <th>Argument</th>
		 * <th>Default</th>
		 * <th class="last">Description</th>
		 * </tr>
		 * </thead><tbody>
		 * <tr>
		 * <td class="name"><code>latitude</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> 0 </td>
		 * <td class="description last">緯度</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>longitude</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> 0 </td>
		 * <td class="description last">経度</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>accuracy</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> 50 </td>
		 * <td class="description last">位置の誤差(m)</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>altitude</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> null </td>
		 * <td class="description last">高度(m)</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>altitudeAccuracy</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> null </td>
		 * <td class="description last">高度の誤差(m)</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>heading</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> null </td>
		 * <td class="description last">方角(0～360)(度)</td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>speed</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="default"> null </td>
		 * <td class="description last">速度 (m/s)</td>
		 * </tr>
		 * </tbody></table></td>
		 * </tr>
		 * <tr>
		 * <td class="name"><code>timestamp</code></td>
		 * <td class="type"> Number </td>
		 * <td class="attributes"> &lt;optional&gt;<br>
		 * </td>
		 * <td class="description last">タイムスタンプ。省略時は取得時のタイムスタンプが自動で格納されます。</td>
		 * </tr>
		 * </tbody></table> <br>
		 * <br>
		 *
		 * <pre>
		 * 	例１．
		 * 	h5.api.geo.dummyPositions.push({
		 * 		coords:{
		 * 			latitude: 35.45019435393257,
		 * 			longitude: 139.6305128879394,
		 * 			accuracy: 50,
		 * 			altitude: 100,
		 * 			altitudeAccuracy: 100,
		 * 			heading: 90,
		 * 			speed: 9
		 * 		}
		 * 	timestamp: 1331106454545
		 * 	})
		 * </pre>
		 *
		 * <p>
		 * 省略したプロパティにはdefault値が入ります。timestampを省略すると、取得時に値が格納されます。
		 * </p>
		 *
		 * <pre>
		 * 	例２．
		 * 	h5.api.geo.dummyPositions.push({
		 * 		coords: {
		 * 			latitude: 35.45019435393257,
		 * 			longitude: 139.6305128879394,
		 * 		}
		 * 	})
		 * </pre>
		 *
		 * <p>
		 * coordsの中身だけを記述して格納することもできます。getPositionや_watchPositionでの取得時にcoordsプロパティに格納して返します。省略したプロパティにはdefault値が入ります。
		 * timestampには取得時に値が格納されます。
		 * </p>
		 *
		 * <pre>
		 * 	例３．
		 * 	h5.api.geo.dummyPositions.push(
		 * 		latitude: 35.45019435393257,
		 * 		longitude: 139.6305128879394
		 * 	})
		 * </pre>
		 *
		 * <p>
		 * <a href="http://www.htmlhifive.com/ja/recipe/geolocation/index.html">座標データ生成ツール</a>を使うと地図から緯度と経度を求められます。
		 * </p>
		 *
		 * @memberOf h5.dev.api.geo
		 * @type Object[]
		 */
		dummyPositions: []
	});

	/**
	 * dummyPositionsの先頭の位置情報を返します。dummyPositionsがオブジェクトの場合はdummyPositionsを返します。
	 * <p>
	 * このメソッドはh5.api.geo.getCurrentPosition()で呼びます。※ h5.dev.api.geo.getCurrentPosition()ではありません。
	 * </p>
	 * <p>
	 * dummyPositionsに値が設定されていない場合は元のh5.api.geoのメソッドを実行します。
	 * </p>
	 *
	 * @memberOf h5.dev.api.geo
	 * @function
	 * @param {Object} [option] 設定情報
	 * @param {Boolean} [option.enableHighAccuracy] 正確な位置を取得するか (ただし消費電力の増加や応答が遅延する)
	 * @param {Number} [option.timeout] 位置情報を取得するまで待機する時間 (ミリ秒)
	 * @param {Number} [option.maximumAge] キャッシュされた位置情報の有効期間を指定する (ミリ秒)
	 * @returns {Promise} Promiseオブジェクト
	 */
	function getCurrentPosition(option) {
		var dfd = h5.async.deferred();
		if (h5.dev.api.geo.forceError) {
			setTimeout(function() {
				dfd.reject({
					code: 'forceError'
				});
			}, 0);
			return dfd.promise();
		}

		var positions = h5.dev.api.geo.dummyPositions;
		if (!positions || positions.length === 0) {
			return originalAPI.getCurrentPosition(option);
		}
		// dummyPositionsが配列でない場合も対応する
		var positionsAry = $.isArray(positions) ? positions: [positions];

		setTimeout(function() {
			dfd.resolve(createPosition(positionsAry[0]));
		}, 0);
		return dfd.promise();
	}

	/**
	 * dummyPositionsの緯度・緯度を順番に返します。 dummyPositionsの末尾まで到達すると、末尾の要素を返し続けます。
	 * <p>
	 * このメソッドはh5.api.geo.watchPosition()で呼びます。※ h5.dev.api.geo.watchtPosition()ではありません。
	 * </p>
	 * <p>
	 * dummyPositionsに値が設定されていない場合は元のh5.api.geoのメソッドを実行します。
	 * </p>
	 *
	 * @memberOf h5.dev.api.geo
	 * @function
	 * @name watchPosition
	 * @param {Object} [option] 設定情報
	 * @param {Boolean} [option.enableHighAccuracy] 正確な位置を取得するか (ただし消費電力の増加や応答が遅延する)
	 * @param {Number} [option.timeout] 位置情報を取得するまで待機する時間 (ミリ秒)
	 * @param {Number} [option.maximumAge] キャッシュされた位置情報の有効期間を指定する (ミリ秒)
	 * @returns {WatchPositionPromise} WatchPositionPromiseオブジェクト
	 */
	function watchPosition(option) {
		var dfd = h5.async.deferred();
		if (h5.dev.api.geo.forceError) {
			setTimeout(function() {
				dfd.reject({
					code: 'forceError'
				});
			}, 0);
			return dfd.promise();
		}
		// dummyPositionsが配列でない場合も対応する
		var dummyPos = $.isArray(h5.dev.api.geo.dummyPositions) ? h5.dev.api.geo.dummyPositions
				: [h5.dev.api.geo.dummyPositions].slice(0);
		if (dummyPos.length === 0) {
			return originalAPI.watchPosition(option);
		}
		var that = this;
		var watchID = _dfdID++;
		// WatchPositionPromiseクラス
		// _watchPositionはこのクラスをプロミス化して返す。
		var WatchPositionPromise = function() {
		// コンストラクタ
		};
		// promiseオブジェクトにunwatchメソッドを付加
		WatchPositionPromise.prototype = {
			// unwatchを呼び出したdeferredを_dfds[]から削除
			unwatch: function() {
				_dfds[watchID] && _dfds[watchID].resolve();
				delete _dfds[watchID];
				setTimeout(function() {
					// deferredオブジェクトがすべてなくなったらタイマーの停止
					// dummyPositionsの見ている位置を0に戻す。
					if ($.isEmptyObject(_dfds)) {
						clearInterval(_timerID);
						_timerID = null;
						_watchPointer = 0;
					}
				}, 0);
			}
		};

		setTimeout(function() {
			_dfds[watchID] = dfd;
			if (_timerID === null) {
				var intervalFunc = function() {
					var pos;
					if (_watchPointer >= dummyPos.length) {
						pos = dummyPos[dummyPos.length - 1];
					} else {
						pos = dummyPos[_watchPointer++];
					}
					for ( var id in _dfds) {
						_dfds[id].notify(createPosition(pos));
					}
				};
				intervalFunc();
				_timerID = setInterval(intervalFunc, h5.dev.api.geo.watchIntervalTime);
			}
		}, 0);
		return dfd.promise(new WatchPositionPromise(watchID));
	}

	// =============================
	// Expose to window
	// =============================

	// geolocation
	var h5GeolocationSupport = new H5GeolocationSupport();
	// getCurrentPosition と watchPosition を上書きする。
	$.extend(h5.api.geo, {
		getCurrentPosition: getCurrentPosition,
		watchPosition: watchPosition
	});
	h5.u.obj.expose('h5.dev.api.geo', h5GeolocationSupport);
})();
/* del end */

	/* del begin */
	var fwLogger = h5.log.createLogger('h5')
	fwLogger.info('開発版のhifive(ver {0})を読み込みました。商用で使う場合はh5.jsを読み込むようにしてください。', h5.env.version);
	/* del end */

})(jQuery);
