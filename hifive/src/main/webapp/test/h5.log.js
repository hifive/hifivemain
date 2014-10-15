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

$(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	//=============================
	// Variables
	//=============================

	var ERR = ERRCODE.h5.log;

	var LOG_MESSAGE_ERROR = 'ERRORレベルのログ';
	var LOG_MESSAGE_WARN = 'WARNレベルのログ';
	var LOG_MESSAGE_DEBUG = 'DEBUGレベルのログ';
	var LOG_MESSAGE_INFO = 'INFOレベルのログ';
	var LOG_MESSAGE_TRACE = 'TRACEレベルのログ';

	//=============================
	// Functions
	//=============================
	// ログの設定を元に戻す関数
	var restoreDefaultLogSettings = testutils.u.restoreDefaultLogSettings;

	function setLevel(level, outputs) {
		h5.settings.log = {
			target: {
				myTarget: {
					type: {
						log: function(logObj) {
							if (outputs) {
								outputs.push(logObj);
							}
						}
					}
				}
			},
			defaultOut: {
				level: level,
				targets: 'myTarget'
			}
		};
		h5.log.configure();
	}

	function outputEachLevel(logger) {
		var logger = logger || h5.log.createLogger('LogTest');
		logger.error(LOG_MESSAGE_ERROR);
		logger.warn(LOG_MESSAGE_WARN);
		logger.info(LOG_MESSAGE_INFO);
		logger.debug(LOG_MESSAGE_DEBUG);
		logger.trace(LOG_MESSAGE_TRACE);
	}

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================
	module('ログカテゴリの設定', {
		teardown: function() {
			restoreDefaultLogSettings();
		}
	});

	//=============================
	// Body
	//=============================
	test('カテゴリを指定してロガーを作成', 1, function() {
		var category = 'log.category';
		var logger1 = h5.log.createLogger(category);

		ok(category === logger1.category, 'h5.log.createLogger() に渡したカテゴリが設定されていること。');
	});

	test('カテゴリ未指定のロガーは作成できないこと', 1, function() {
		try {
			h5.log.createLogger();
		} catch (e) {
			equal(e.code, ERR.ERR_CODE_CATEGORY_INVALID,
					'h5.log.createLogger() に何も渡さない場合、エラーが発生すること。');
		}
	});

	test('カテゴリに不正な値を設定するとエラーが出ること。("", " ", {}, [], 0, 1, true, false)', 8, function() {
		var categorys = ['', ' ', {}, [], 0, 1, true, false];
		var categorysStr = ["''", "' '", "{}", "[]", "0", "1", "true", "false"];
		for (var i = 0, l = categorys.length; i < l; i++) {
			try {
				h5.log.createLogger(categorys[i]);
				ok(false, 'エラーが発生していません');
			} catch (e) {
				equal(e.code, ERR.ERR_CODE_CATEGORY_INVALID, 'h5.log.createLogger() に'
						+ categorysStr[i] + 'を渡した場合、エラーが発生すること。');
			}
		}
	});

	//=============================
	// Definition
	//=============================
	module('configure()', {
		teardown: function() {
			restoreDefaultLogSettings();
		}
	});

	//=============================
	// Body
	//=============================
	test('configure()でエラーが発生しても、ロガーは使用可能であること', 2, function() {
		var logger = h5.log.createLogger('hoge');
		h5.settings.log = {
			out: [{}]
		};
		try {
			h5.log.configure();
		} catch (e) {
			// categoryが未指定なのでエラーが発生する
			ok(true, 'configure()でエラーが発生すること');
		}
		try {
			logger.debug('hoge');
			ok(true, 'configure()でエラーが発生してもロガーは使用可能');
		} catch (e) {
			ok(false, 'logger.debug()でエラーが発生');
		}
	});

	//=============================
	// Definition
	//=============================
	module('ログターゲットの設定', {
		teardown: function() {
			restoreDefaultLogSettings();
		}
	});

	//=============================
	// Body
	//=============================
	test('ログターゲットの設定 (h5.log.createLogger) 指定なし、undefined、null を指定したときはログが出力されないこと。', 3,
			function() {
				h5.settings.log = {
					defaultOut: {
						level: 'debug'
					}
				};
				h5.log.configure();
				outputEachLevel();
				ok(true, 'ログが出力されていないことを確認してください。');

				h5.settings.log = {
					defaultOut: {
						level: 'debug',
						targets: undefined
					}
				};
				h5.log.configure();
				outputEachLevel();
				ok(true, 'ログが出力されていないことを確認してください。');

				h5.settings.log = {
					defaultOut: {
						level: 'debug',
						targets: null
					}
				};
				h5.log.configure();
				outputEachLevel();
				ok(true, 'ログが出力されていないことを確認してください。');
			});

	test('ログターゲットの設定 (h5.log.createLogger)  文字列以外、空文字、空白文字、配列以外を指定したときはエラーが出ること。', 8, function() {
		var categorys = [window.console || function() {}, '', ' ', {}, 0, 1, true, false];
		var categorysStr = [window.console ? "window.console" : 'function(){}', "''", "' '", "{}",
				"0", "1", "true", "false"];

		for (var i = 0, l = categorys.length; i < l; i++) {
			try {
				h5.settings.log = {
					defaultOut: {
						targets: categorys[i]
					}
				};
				h5.log.configure();
				ok(false, 'エラーが発生していません ' + categorysStr[i]);
			} catch (e) {
				deepEqual(e.code, ERR.ERR_CODE_LOG_TARGETS_INVALID, e.message + categorysStr[i]);
			}
		}
	});

	test('ログターゲットの設定 (h5.log.createLogger)  "console"以外の文字列を指定したときはエラーが出ること。', 1, function() {
		try {
			h5.settings.log = {
				defaultOut: {
					targets: "aaa"
				}
			};
			h5.log.configure();
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, ERR.ERR_CODE_LOG_TARGETS_IS_NONE, e.message);
		}
	});

	test('ログターゲットの設定 (h5.log.createLogger)  配列の中に"console"以外の文字列を指定したときはエラーが出ること。', 2, function() {
		h5.settings.log = {
			defaultOut: {
				targets: [null, undefined, 'console']
			}
		};
		try {
			h5.log.configure();
			ok(true, 'null,undefined,"console"ではエラー発生しない。');
		} catch (e) {
			deepEqual(false, e.code + ': ' + e.message);
		}

		h5.settings.log = {
			defaultOut: {
				targets: ['aa', 'console']
			}
		};
		try {
			h5.log.configure();
			ok(true, 'null,undefined,"console"ではエラー発生しない。');
		} catch (e) {
			deepEqual(e.code, ERR.ERR_CODE_LOG_TARGETS_IS_NONE, e.message);
		}
	});

	test(
			'ログターゲットの設定 (h5.log.createLogger)  配列の中に(null/undefined/文字列)以外、空文字、空白文字、を指定したときはエラーが出ること。',
			7, function() {
				var vals = [{}, [], '', ' ', 1, true, false];
				for (var i = 0, l = vals.length; i < l; i++) {
					h5.settings.log = {
						defaultOut: {
							targets: ['console', vals[i]]
						}
					};
					try {
						h5.log.configure();
						ok(true, 'null,undefined,"console"ではエラー発生しない。');
					} catch (e) {
						equal(e.code, ERR.ERR_CODE_LOG_TARGETS_INVALID, e.message);
					}
				}
			});

	test('targetsに重複したターゲットを登録してconfigure()するとエラーが発生すること。', 1, function() {
		h5.settings.log = {
			target: {
				myTarget: {
					type: 'console'
				}
			},
			out: [{
				category: 'for test category',
				level: 'trace',
				targets: ['myTarget', 'console', 'myTarget']
			}]
		};

		try {
			h5.log.configure();
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, ERR.ERR_CODE_LOG_TARGETS_NAMED_MULTIPLE_TIMES, e.message);
		}
	});

	//=============================
	// Definition
	//=============================
	module('カスタムログターゲットの動作', {
		teardown: function() {
			restoreDefaultLogSettings();
		}
	});

	//=============================
	// Body
	//=============================
	test('targetにプレーンオブジェクト以外のものを指定してエラーが発生すること。', 3, function() {
		var errorCode = ERR.ERR_CODE_LOG_TARGET_INVALID;
		h5.settings.log = {
			target: 'console'
		};
		try {
			h5.log.configure();
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		h5.settings.log = {
			target: ['console']
		};
		try {
			h5.log.configure();
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		h5.settings.log = {
			target: new String()
		};
		try {
			h5.log.configure();
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});

	test('target.typeに、オブジェクト, "console"以外を指定するとエラーになること。', 6, function() {
		var vals = [[], '', 'remote', 1, true, false];

		for (var i = 0, l = vals.length; i < l; i++) {
			h5.settings.log = {
				target: {
					myTarget: {
						type: vals[i]
					}
				}
			};

			try {
				h5.log.configure();
				ok(true, 'null,undefined,"console"ではエラー発生しない。');
			} catch (e) {
				deepEqual(e.code, ERR.ERR_CODE_LOG_TARGET_TYPE, e.message);
			}
		}
	});

	test('ログターゲットのinitがconfigure()を呼んだタイミングで呼ばれること', 1, function() {
		var initDone = false;
		var myTargetType = {
			init: function(logTarget) {
				initDone = true;
			}
		};
		h5.settings.log = {
			target: {
				myTarget: {
					type: myTargetType
				}
			},
			defaultOut: {
				targets: 'myTarget'
			}
		};
		h5.log.configure();
		ok(initDone, 'configure()を呼ぶと設定したログターゲットのinitが呼ばれること');
	});

	test('ログターゲットのinitのthisと引数', 3, function() {
		var context = null;
		var myTargetType = {
			init: function(logTarget) {
				ok(logTarget.type.isMyTargetType, 'initの引数には定義したターゲットのクローンが渡されること');
				notStrictEqual(logTarget.type, myTargetType, 'initの引数は定義したターゲットとは別インスタンスであること');
				arg = logTarget;
				context = this;
			},
			isMyTargetType: true
		};
		h5.settings.log = {
			target: {
				myTarget: {
					type: myTargetType
				}
			},
			defaultOut: {
				targets: 'myTarget'
			}
		};
		h5.log.configure();
		// compiledTargetはinitの呼び出し後に設定されるため、init()の後に確認
		strictEqual(context, arg.compiledTarget, 'initのthisはコンパイル済みログターゲットであること');
	});

	test('logメソッドの引数とthis', 6, function() {
		var arg = null;
		var context = null;
		var compiledTargetType = null;
		var myTargetType = {
			init: function() {
				compiledTargetType = this;
			},
			log: function(logObj) {
				arg = logObj;
				context = this;
			}
		};
		h5.settings.log = {
			target: {
				myTarget: {
					type: myTargetType
				}
			},
			defaultOut: {
				targets: 'myTarget'
			}
		};
		h5.log.configure();
		var logger = h5.log.createLogger('a');
		logger.debug('hoge', 1);
		strictEqual(context, compiledTargetType, 'thisがコンパイルログターゲットオブジェクトであること');
		deepEqual(['hoge', 1], arg.args, 'ログ出力メソッドで渡した引数がlogObj.argsに格納されていること');
		ok(arg.date instanceof Date, 'dateにDate型で時刻が格納されていること');
		strictEqual(arg.level, 20, 'levelにログ出力メソッドのレベル(数値)が格納されていること');
		strictEqual(arg.levelString, 'DEBUG', 'levelStringにログ出力メソッドのレベル(文字列)が格納されていること');
		strictEqual(arg.logger, logger, 'loggerにロガーインスタンスが格納されていること');
	});

	//=============================
	// Definition
	//=============================
	module('ログレベル閾値動作', {
		teardown: function() {
			restoreDefaultLogSettings();
		},
		testLogLevel: function(level) {
			var resultAry = [];
			setLevel(level, resultAry);
			outputEachLevel();

			var outputs = [];
			for (var i = 0, l = resultAry.length; i < l; i++) {
				outputs.push(resultAry[i].args[0]);
			}
			return outputs;
		}
	});

	//=============================
	// Body
	//=============================

	test('閾値設定なし', 1, function() {
		var outputs = [];
		h5.settings.log = {
			target: {
				myTarget: {
					type: {
						log: function(logObj) {
							outputs.push(logObj.args[0]);
						}
					}
				}
			},
			defaultOut: {
				targets: 'myTarget'
			}
		};
		h5.log.configure();
		outputEachLevel();
		var expectResult = [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN, LOG_MESSAGE_INFO,
				LOG_MESSAGE_DEBUG];
		deepEqual(outputs, expectResult,
				'level指定無しの場合はデフォルトのレベルとなり、ERROR, WARN, INFO, DEBUGのレベルのログが出力されること');
	});

	test('error,ERROR', 2,
			function() {
				var expectResult = [LOG_MESSAGE_ERROR];
				deepEqual(this.testLogLevel('error'), expectResult,
						'level:"error"の場合、ERRORレベルのログのみ出力されること');
				deepEqual(this.testLogLevel('ERROR'), expectResult,
						'level:"ERROR"の場合、ERRORレベルのログのみ出力されること');
			});

	test('warn,WARN', 2, function() {
		var expectResult = [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN];
		deepEqual(this.testLogLevel('warn'), expectResult,
				'level:"warn"の場合、ERROR,WARNレベルのログが出力されること');
		deepEqual(this.testLogLevel('WARN'), expectResult,
				'level:"WARN"の場合、ERROR,WARNレベルのログが出力されること');
	});

	test('info,INFO', 2, function() {
		var expectResult = [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN, LOG_MESSAGE_INFO];
		deepEqual(this.testLogLevel('info'), expectResult,
				'level:"info"の場合、ERROR,WARN,INFOレベルのログが出力されること');
		deepEqual(this.testLogLevel('INFO'), expectResult,
				'level:"INFO"の場合、ERROR,WARN,INFOレベルのログが出力されること');
	});

	test('debug,DEBUG', 2, function() {
		var expectResult = [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN, LOG_MESSAGE_INFO,
				LOG_MESSAGE_DEBUG];
		deepEqual(this.testLogLevel('debug'), expectResult,
				'level:"debug"の場合、ERROR,WARN,INFO,DEBUGレベルのログが出力されること');
		deepEqual(this.testLogLevel('DEBUG'), expectResult,
				'level:"DEBUG"の場合、ERROR,WARN,INFO,DEBUGレベルのログが出力されること');
	});

	test('trace,TRACE', 2, function() {
		var expectResult = [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN, LOG_MESSAGE_INFO,
				LOG_MESSAGE_DEBUG, LOG_MESSAGE_TRACE];
		deepEqual(this.testLogLevel('trace'), expectResult,
				'level:"trace"の場合、ERROR,WARN,INFO,DEBUG,TRACEレベルのログが出力されること');
		deepEqual(this.testLogLevel('TRACE'), expectResult,
				'level:"TRACE"の場合、ERROR,WARN,INFO,DEBUG,TRACEレベルのログが出力されること');
	});

	test('all,ALL', 2, function() {
		var expectResult = [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN, LOG_MESSAGE_INFO,
				LOG_MESSAGE_DEBUG, LOG_MESSAGE_TRACE];
		deepEqual(this.testLogLevel('all'), expectResult,
				'level:"all"の場合、ERROR,WARN,INFO,DEBUG,TRACEレベルのログが出力されること');
		deepEqual(this.testLogLevel('ALL'), expectResult,
				'level:"ALL"の場合、ERROR,WARN,INFO,DEBUG,TRACEレベルのログが出力されること');
	});

	test('none,NONE', 2, function() {
		var expectResult = [];
		deepEqual(this.testLogLevel('none'), expectResult, 'level:"none"の場合、どのレベルのログも出力されないこと');
		deepEqual(this.testLogLevel('NONE'), expectResult, 'level:"NONE"の場合、どのレベルのログも出力されないこと');
	});

	test('数値指定 51, -1', function() {
		var expectResult = [];
		deepEqual(this.testLogLevel(51), expectResult, 'level:51の場合、どのレベルのログも出力されないこと');
		deepEqual(this.testLogLevel(-1), expectResult, 'level:-1の場合、どのレベルのログも出力されないこと');
	});

	test('数値指定 50, 41', function() {
		var expectResult = [LOG_MESSAGE_ERROR];
		deepEqual(this.testLogLevel(50), expectResult, 'level:50の場合、ERRORレベルのログのみ出力されること');
		deepEqual(this.testLogLevel(41), expectResult, 'level:41の場合、ERRORレベルのログのみ出力されること');
	});

	test('数値指定 40, 31', function() {
		var expectResult = [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN];
		deepEqual(this.testLogLevel(40), expectResult, 'level:40の場合、ERROR,WARNレベルのログが出力されること');
		deepEqual(this.testLogLevel(31), expectResult, 'level:31の場合、ERROR,WARNレベルのログが出力されること');
	});

	test('数値指定 30, 21',
			function() {
				var expectResult = [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN, LOG_MESSAGE_INFO];
				deepEqual(this.testLogLevel(30), expectResult,
						'level:30の場合、ERROR,WARN,INFOレベルのログが出力されること');
				deepEqual(this.testLogLevel(21), expectResult,
						'level:21の場合、ERROR,WARN,INFOレベルのログが出力されること');
			});

	test('数値指定 20, 11', function() {
		var expectResult = [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN, LOG_MESSAGE_INFO,
				LOG_MESSAGE_DEBUG];
		deepEqual(this.testLogLevel(20), expectResult,
				'level:20の場合、ERROR,WARN,INFO,DEBUGレベルのログが出力されること');
		deepEqual(this.testLogLevel(11), expectResult,
				'level:11の場合、ERROR,WARN,INFO,DEBUGレベルのログが出力されること');
	});

	test('数値指定 10, 0', function() {
		var expectResult = [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN, LOG_MESSAGE_INFO,
				LOG_MESSAGE_DEBUG, LOG_MESSAGE_TRACE];
		deepEqual(this.testLogLevel(10), expectResult,
				'level:20の場合、ERROR,WARN,INFO,DEBUG,TRACEレベルのログが出力されること');
		deepEqual(this.testLogLevel(0), expectResult,
				'level:11の場合、ERROR,WARN,INFO,DEBUG,TRACEレベルのログが出力されること');
	});

	test('null,undefined', 2, function() {
		var expectResult = [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN, LOG_MESSAGE_INFO,
				LOG_MESSAGE_DEBUG];
		deepEqual(this.testLogLevel(null), expectResult,
				'level:nullの場合はデフォルトのレベルとなり、ERROR, WARN, INFO, DEBUGのレベルのログが出力されること');
		deepEqual(this.testLogLevel(undefined), expectResult,
				'level:undefinedの場合はデフォルトのレベルとなり、ERROR, WARN, INFO, DEBUGのレベルのログが出力されること');
	});

	test('ログレベルに不正な値(ログレベル指定できない文字、空文字、空白文字、文字列以外)を指定するとエラーが出ること', 5, function() {
		var levels = ['debag', '', ' ', [], {
			level: 'debug'
		}];
		var levelsStr = ["'debag'", "''", "' '", "[]", "{level: 'debug'}"];
		for (var i = 0, l = levels.length; i < l; i++) {
			try {
				setLevel(levels[i]);
				ok(false, 'エラーが発生していません。 ' + levelsStr[i]);
			} catch (e) {
				ok(true, e.code + ': ' + e.message + ' ' + levelsStr[i]);
			}
		}
	});

	//=============================
	// Definition
	//=============================
	module('ログカテゴリによる出力先設定', {
		teardown: function() {
			var outputs = this.outputs;
			outputs.defaultOut = [];
			outputs.myTarget1 = [];
			outputs.myTarget2 = [];
			outputs.myTarget3 = [];
			outputs.myTarget4 = [];
			restoreDefaultLogSettings();
		},
		outputs: {
			myTarget1: [],
			myTarget2: [],
			myTarget3: [],
			myTarget4: [],
			defaultOut: []
		},
		configureCategoryLogger: function(out) {
			var outputs = this.outputs;
			var defaultOutputs = outputs.defaultOut;
			var outputs1 = outputs.myTarget1;
			var outputs2 = outputs.myTarget2;
			var outputs3 = outputs.myTarget3;
			var outputs4 = outputs.myTarget4;
			h5.settings.log = {
				target: {
					myTarget1: {
						type: {
							log: function(logObj) {
								outputs1.push(logObj.args[0]);
							}
						}
					},
					myTarget2: {
						type: {
							log: function(logObj) {
								outputs2.push(logObj.args[0]);
							}
						}
					},
					myTarget3: {
						type: {
							log: function(logObj) {
								outputs3.push(logObj.args[0]);
							}
						}
					},
					myTarget4: {
						type: {
							log: function(logObj) {
								outputs4.push(logObj.args[0]);
							}
						}
					},
					defaultTarget: {
						type: {
							log: function(logObj) {
								defaultOutputs.push(logObj.args[0]);
							}
						}
					}
				},
				out: out,
				defaultOut: {
					level: 'debug',
					targets: 'defaultTarget'
				}
			};
			h5.log.configure();
		}
	});

	//=============================
	// Body
	//=============================
	test('outに指定するカテゴリが不正な時にエラー', 8, function() {
		var categorys = ['', ' ', {}, [], 0, 1, true, false];
		var categorysStr = ["''", "' '", "{}", "[]", "0", "1", "true", "false"];

		for (var i = 0, l = categorys.length; i < l; i++) {
			h5.settings.log = {
				target: {
					myTarget: {
						type: {
							log: function(logObj) {
								outputs.push(logObj);
							}
						}
					}
				},
				out: [{
					category: categorys[i],
					level: 'trace',
					targets: ['myTarget']
				}]
			};

			try {
				h5.log.configure();
				ok(false, 'エラーが発生していません。 ' + categorysStr[i]);
			} catch (e) {
				equal(e.code, ERR.ERR_CODE_OUT_CATEGORY_INVALID, e.message);
			}
		}
	});

	test('categoryに重複したものを登録してconfigure()するとエラーが発生すること。', 1, function() {
		h5.settings.log = {
			target: {
				myTarget: {
					type: 'console'
				}
			},
			out: [{
				category: 'for test category',
				level: 'trace',
				targets: ['myTarget']
			}, {
				category: ' for test category  ',
				level: 'debug',
				targets: 'console'
			}]
		};

		try {
			h5.log.configure();
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, ERR.ERR_CODE_CATEGORY_NAMED_MULTIPLE_TIMES, e.message);
		}
	});

	test('カテゴリにマッチしない場合はdefaultOutの定義で出力されること', 3, function() {
		this.configureCategoryLogger([{
			category: 'test.controller*',
			level: 'trace',
			targets: 'myTarget1'
		}, {
			category: 'test.logic*',
			level: 'info',
			targets: 'myTarget2'
		}]);
		var logger = h5.log.createLogger('test.util');
		outputEachLevel(logger);
		var outputs = this.outputs;
		deepEqual(outputs.myTarget1, [], 'マッチしないカテゴリのターゲットには出力されていないこと');
		deepEqual(outputs.myTarget2, [], 'マッチしないカテゴリのターゲットには出力されていないこと');
		deepEqual(outputs.defaultOut, [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN, LOG_MESSAGE_INFO,
				LOG_MESSAGE_DEBUG], 'defaultOutで指定されたターゲットに指定されたレベルのログが出力されていること');
	});

//	test('カテゴリにマッチする場合、マッチしたoutの定義で出力されること', 3, function() {
//		this.configureCategoryLogger([{
//			category: 'test.controller*',
//			level: 'trace',
//			targets: 'myTarget1'
//		}, {
//			category: '*',
//			level: 'info',
//			targets: 'myTarget2'
//		}]);
//		var logger = h5.log.createLogger('test.controller*');
//		outputEachLevel(logger);
//		var outputs = this.outputs;
//		deepEqual(outputs.myTarget1, [LOG_MESSAGE_ERROR, LOG_MESSAGE_WARN, LOG_MESSAGE_INFO,
//				LOG_MESSAGE_DEBUG, LOG_MESSAGE_TRACE], 'カテゴリにマッチしたoutの定義で出力されていること');
//		deepEqual(outputs.myTarget2, [], 'マッチしたoutがあった時、それ以降のoutの定義では出力されないこと');
//		deepEqual(outputs.defaultOut, [], 'defaultOutには出力されないこと');
//	});
	// TODO
	// カテゴリ指定時の挙動を確認してテスト記述

	//=============================
	// Definition
	//=============================
	module('スタックトレース', {
		setup: function() {
			var logObjs = [];
			var myTarget = {
				type: {
					log: function(arg) {
						logObjs.push(arg);
					}
				}
			};
			h5.settings.log = {
				target: {
					myTarget: myTarget
				},
				defaultOut: {
					level: 'trace',
					targets: ['myTarget']
				}
			};
			h5.log.configure();
			this.logObjs = logObjs;
			this.logger = h5.log.createLogger('test');
		},
		teardown: function() {
			this.logger = null;
			this.logObjs = null;
			restoreDefaultLogSettings();
		},
		/**
		 * 引数の数分だけの関数呼び出しを行ってログを出力する
		 *
		 * @param {Integer} num 1～10まで
		 */
		callFunction: function(num) {
			var logger = this.logger;
			var functions = [function f1() {
				logger.debug('test');
			}, function f2() {
				functions[0]();
			}, function f3() {
				functions[1]();
			}, function f4() {
				functions[2]();
			}, function f5() {
				functions[3]();
			}, function f6() {
				functions[4]();
			}, function f7() {
				functions[5]();
			}, function f8() {
				functions[6]();
			}, function f9() {
				functions[7]();
			}, function fa() {
				functions[8]();
			}];
			functions[num - 1]();
		},
		logger: null,
		logObjs: null
	});

	//=============================
	// Body
	//=============================
	test('スタックトレース機能はデフォルト無効であること', 2, function() {
		ok(!this.logger.enableStackTrace, 'enableStackTraceはデフォルトで無効であること');
		this.logger.debug('a');
		strictEqual(this.logObjs[0].stackTrace, '', 'ログオブジェクトのstackTraceが空文字であること');
	});

	test('スタックトレース機能', 7, function() {
		this.logger.enableStackTrace = true;
		this.callFunction(5);

		var stackTrace = this.logObjs[0].stackTrace;
		var all = stackTrace.all;
		var preview = stackTrace.preview;

		var traces = all.split('\n');
		ok(/f1/.test(traces[0]), 'logger.debugを呼び出したf1がスタックトレースに出力されていること');
		ok(/f2/.test(traces[1]), 'f1を呼び出したf2がスタックトレースに出力されていること');
		ok(/f3/.test(traces[2]), 'f2を呼び出したf3がスタックトレースに出力されていること');
		ok(/f4/.test(traces[3]), 'f3を呼び出したf4がスタックトレースに出力されていること');
		ok(/f5/.test(traces[4]), 'f4を呼び出したf5がスタックトレースに出力されていること');

		// Chrome,Opera f1 () <- f2 () <- f3 () ...
		// Firefox f1 <- f2 <- f3 ...
		// IE,Safari {f1}() <- {f2}() <- {f3}() ...
		ok(/f1.*<-.*f2.*<-.*f3.*\.\.\./.test(preview), 'previewは3回の呼び出しまでのトレース結果であること');
		ok(!/f4/.test(preview), 'previewに4つめの呼び出し履歴は表示されていないこと');
	});

	test('maxStackSizeのデフォルト値', 1, function() {
		strictEqual(this.logger.maxStackSize, 10, 'maxStackSizeのデフォルト値は10であること');
	});

	test('maxStackSizeに指定した数以上のトレース結果は取得できないこと', 7, function() {
		this.logger.enableStackTrace = true;
		this.logger.maxStackSize = 4;
		this.callFunction(5);

		var stackTrace = this.logObjs[0].stackTrace;
		var all = stackTrace.all;
		var preview = stackTrace.preview;

		var traces = all.split('\n');
		ok(/f1/.test(traces[0]), 'logger.debugを呼び出したf1がスタックトレースに出力されていること');
		ok(/f2/.test(traces[1]), 'f1を呼び出したf2がスタックトレースに出力されていること');
		ok(/f3/.test(traces[2]), 'f2を呼び出したf3がスタックトレースに出力されていること');
		ok(/f4/.test(traces[3]), 'f3を呼び出したf4がスタックトレースに出力されていること');
		ok(!traces[4], 'maxStackSizeが4の時、呼び出し履歴5番目の関数は取得できないこと');

		// Chrome,Opera f1 () <- f2 () <- f3 () ...
		// Firefox f1 <- f2 <- f3 ...
		// IE,Safari {f1}() <- {f2}() <- {f3}() ...
		ok(/f1.*<-.*f2.*<-.*f3.*\.\.\./.test(preview), 'previewは3回の呼び出しまでのトレース結果であること');
		ok(!/f4/.test(preview), 'previewに4つめの呼び出し履歴は表示されていないこと');
	});

	test('maxStackSizeが3の時、3件までのトレース結果のみ取得できること', 6, function() {
		this.logger.enableStackTrace = true;
		this.logger.maxStackSize = 3;
		this.callFunction(5);

		var stackTrace = this.logObjs[0].stackTrace;
		var all = stackTrace.all;
		var preview = stackTrace.preview;

		var traces = all.split('\n');
		ok(/f1/.test(traces[0]), 'logger.debugを呼び出したf1がスタックトレースに出力されていること');
		ok(/f2/.test(traces[1]), 'f1を呼び出したf2がスタックトレースに出力されていること');
		ok(/f3/.test(traces[2]), 'f2を呼び出したf3がスタックトレースに出力されていること');
		ok(!traces[3], 'maxStackSizeが3の時、呼び出し履歴4番目の関数は取得できないこと');

		// Chrome,Opera f1 () <- f2 () <- f3 () ...
		// Firefox f1 <- f2 <- f3 ...
		// IE,Safari {f1}() <- {f2}() <- {f3}() ...
		ok(/f1.*<-.*f2.*<-.*f3.*/.test(preview), 'previewは3回の呼び出しまでのトレース結果であること');
		ok(!/\.\.\.$/.test(preview), 'previewに"..."が表示されていないこと');
	});

	test('maxStackSizeが2の時、2件までのトレース結果が取得でき、previewにも2件までの結果が表示されること', 5, function() {
		this.logger.enableStackTrace = true;
		this.logger.maxStackSize = 2;
		this.callFunction(5);

		var stackTrace = this.logObjs[0].stackTrace;
		var all = stackTrace.all;
		var preview = stackTrace.preview;

		var traces = all.split('\n');
		ok(/f1/.test(traces[0]), 'logger.debugを呼び出したf1がスタックトレースに出力されていること');
		ok(/f2/.test(traces[1]), 'f1を呼び出したf2がスタックトレースに出力されていること');
		ok(!traces[2], 'maxStackSizeが2の時、呼び出し履歴3番目の関数は取得できないこと');

		ok(/f1.*<-.*f2.*/.test(preview), 'previewは2回の呼び出しまでのトレース結果であること');
		ok(!/f3/.test(preview), 'previewにf3が表示されていないこと');
	});

	//=============================
	// Definition
	//=============================
	module('※要目視確認：コンソールログターゲットの動作', {
		setup: function() {
			h5.settings.log = {
				defaultOut: {
					level: 'all',
					targets: 'console'
				}
			};
			h5.log.configure();
		},
		teardown: function() {
			restoreDefaultLogSettings();
		}
	});

	//=============================
	// Body
	//=============================
	test('文字列を渡した時の動作', function() {
		var arg = 'hoge';
		var logger = h5.log.createLogger('LogTest');
		logger.info("-------------- 文字列を渡した時の動作 ここから --------------");
		logger.error(arg);
		logger.warn(arg);
		logger.info(arg);
		logger.debug(arg);
		logger.trace(arg);
		logger.info(arg);
		logger.info("-------------- 文字列を渡した時の動作 ここまで --------------");

		ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEのレベル順にメッセージが出ていることを確認してください。');
	});

	test('オブジェクトを渡した時の動作', function() {
		var arg = {
			a: 1
		};
		var logger = h5.log.createLogger('LogTest');
		logger.info("-------------- オブジェクトを渡した時の動作 ここから --------------");
		logger.error(arg);
		logger.warn(arg);
		logger.info(arg);
		logger.debug(arg);
		logger.trace(arg);
		logger.info(arg);
		logger.info("-------------- オブジェクトを渡した時の動作 ここまで --------------");

		ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEのレベル順にメッセージが出ていることを確認してください。');
	});

	test('スタックトレース', 0, function() {
		// ネイティブのトレース機能を確認
		// 名前付き(fn.nameで名前を取得できる)関数。
		var logger = h5.log.createLogger("テスト h5.u");
		logger.info("-------------- スタックトレース ここから --------------");
		logger.enableStackTrace = true;

		var func1Named = function func1_1() {
			this.name = 'func1_1';
			function func1_2() {
				logger.enableStackTrace = true;
				logger.debug("スタックトレース - テスト");
			}
			func1_2();
		};
		func1Named(1, "1");

		var noApplyFunc1 = function() {
			func1Named(1);
		};
		noApplyFunc1.apply = undefined;
		noApplyFunc1();

		if (!window.console) {
			expect(1);
			ok(true, 'このブラウザはconsoleをサポートしていません。IE9の場合は、開発者ツールを開いてからテストを実行して下さい。');
			return;
		}

		// オリジナルのトレース機能を確認
		var func2Named = function func2() {
			function func2_1() {
				function func2_2() {
					var nativeTrace = console.trace;
					console.trace = undefined;
					logger.debug("スタックトレース - テスト");
					console.trace = nativeTrace;
				}
				func2_2();
			}
			func2_1(2, "1");
		};

		func2Named(2);
		logger.enableStackTrace = false;
		logger.info("-------------- スタックトレース ここまで --------------");
	});

	test(
			'スタックトレース グローバル領域(loadScriptで読み込む)から出力',
			1,
			function() {
				if (!h5.u) {
					ok(false, 'このテストはh5.uを読み込む必要があります');
					return;
				}
				h5.u.loadScript('data/stacktrace.js', {
					async: false
				});
				ok(
						true,
						'Chrome,Firefox,IE11,Safariではトレース結果が出力されていること'
								+ '(chromeだと、[DEBUG]16:39:3,213: スタックトレース - テスト [eval <anonymous> () <- eval (native) <- {anonymous} ...], '
								+ 'IE10-ではトレースできないため、[DEBUG]16:39:3,213: スタックトレース - テスト [{unable to trace}] のように表示されていることを確認してください。');
			});
});