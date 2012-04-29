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
		case 'function':
			return 'f';
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
		if (resource.length === 0) {
			return;
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
					ret += ((val.length) ? ',' : '') + '"@{'
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
				case 'f':
					return 'function';
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
							if (obj[i].match(new RegExp('^' + typeToCode('undefElem')))) {
								delete obj[i];
								continue;
							}
							if (obj[i].match(new RegExp('^' + typeToCode('objElem')))) {
								var extendObj = func(obj[i].replace(new RegExp('^'
										+ typeToCode('objElem')), typeToCode('object')));
								var tempObj = [];
								for ( var i = 0, l = obj.length - 1; i < l; i++) {
									tempObj[i] = obj[i];
								}
								obj = tempObj;
								for ( var key in extendObj) {
									obj[key] = extendObj[key];
								}
							} else {
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
					case 'function': // Function型はnullにする
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
					}
				}
			}

			catch (e) {
				// 型情報の判定(復元)に失敗した場合、値をそのまま返すので何もしない
				// throwFwError(ERR_CODE_DESERIALIZE);
			}

			return ret;
		}
		;

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