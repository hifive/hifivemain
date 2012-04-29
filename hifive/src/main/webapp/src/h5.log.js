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
	 * ログターゲットの指定が不正なときのエラーコード
	 */
	var ERR_CODE_LOG_TARGET = 10000;

	/**
	 * out.categoryの指定が空文字のときのエラーコード
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
	 * ログターゲットが複数回指定されたときのエラーコード
	 */
	var ERR_CODE_LOG_TARGET_NAMED_MULTIPLE_TIMES = 10003;

	/**
	 * 存在しないログターゲットを指定されたときのエラーコード
	 */
	var ERR_CODE_LOG_TARGET_IS_NONE = 10004;

	/**
	 * カテゴリに文字列以外または空文字を指定したときのエラーコード
	 */
	var ERR_CODE_CATEGORY_INVALID = 10005;

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_LOG_TARGET] = 'ログターゲットのtypeには、オブジェクト、もしくは"console"のみ指定可能です。';
	errMsgMap[ERR_CODE_OUT_CATEGORY_IS_NONE] = 'out.categoryは必須項目です。';
	errMsgMap[ERR_CODE_CATEGORY_NAMED_MULTIPLE_TIMES] = 'category"{0}"が複数回指定されています。';
	errMsgMap[ERR_CODE_LEVEL_INVALID] = 'level"{0}"の指定は不正です。Number、もしくはtrace, info, debug, warn, errorを指定してください。';
	errMsgMap[ERR_CODE_LOG_TARGET_NAMED_MULTIPLE_TIMES] = 'ログターゲット"{0}"が複数回指定されています。';
	errMsgMap[ERR_CODE_LOG_TARGET_IS_NONE] = '"{0}"という名前のログターゲットはありません。';
	errMsgMap[ERR_CODE_CATEGORY_INVALID] = 'categoryは必須項目です。1文字以上の文字列を指定してください。';

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
		} else if (level === logLevel.ALL) {
			return 'ALL';
		} else if (level === logLevel.NONE) {
			return 'NONE';
		} else {
			return 'OTHER';
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
			if (typeof func.apply !== 'undefined') {
				func.apply(console, args);
				return;
			}
			var msg = '';
			if (!$.isArray(args)) {
				msg += args.toString();
			} else {
				msg += args.join(' ');
			}
			func(msg);
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
			for ( var prop in targets) {
				var obj = targets[prop];
				var type = $.type(obj.type);
				// 今は"remote"でもエラーとなる
				if (type === 'object' || (type === 'string' && obj.type !== 'console')) {
					throwFwError(ERR_CODE_LOG_TARGET);
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
				var category = $.trim(out.category);
				if (category.length === 0 && !_dOut) {
					throwFwError(ERR_CODE_OUT_CATEGORY_IS_NONE);
				}
				if ($.inArray(category, categoryCache) !== -1) {
					throwFwError(ERR_CODE_CATEGORY_NAMED_MULTIPLE_TIMES, out.category);
				}
				out.compiledCategory = getRegex(category);
			}
			var level = $.trim(out.level);
			if (level.length === 0) {
				level = isDefault ? defaultOut.level : _dOut.level;
			}
			var compiledLevel = $.type(level) === 'number' ? level : stringToLevel(level);
			if (compiledLevel == null) {
				throwFwError(ERR_CODE_LEVEL_INVALID, level);
			}
			out.compiledLevel = compiledLevel;

			var compiledTargets = [];
			var targets = out.targets;
			if (!isDefault && !targets) {
				compiledTargets = _dOut.compiledTargets;
			} else if (!isDefault || targets) {
				var targetNames = [];
				targets = wrapInArray(targets);
				for ( var i = 0, len = targets.length; i < len; i++) {
					var targetName = targets[i];
					if (!targetName) {
						continue;
					}
					if ($.inArray(targetName, targetNames) !== -1) {
						throwFwError(ERR_CODE_LOG_TARGET_NAMED_MULTIPLE_TIMES, targetName);
					}
					var l = _logTarget[targetName];
					if (!l) {
						throwFwError(ERR_CODE_LOG_TARGET_IS_NONE, targetName);
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
		// 0は大丈夫なので category == null で判断する
		if (category == null || $.trim(category).length === 0) {
			throwFwError(ERR_CODE_CATEGORY_INVALID);
		}

		/**
		 * ログカテゴリ。
		 *
		 * @memberOf Log
		 * @type String
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
		 * @param {Any} var_args
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
		 * @param {Any} var_args
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
		 * @param {Any} var_args
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
		 * @param {Any} var_args
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
		 * @param {Any} var_args
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
		return new Log($.trim(category));
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