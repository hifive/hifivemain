/*
 * Copyright (C) 2012 NS Solutions Corporation, All Rights Reserved.
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


	function setLevel(level) {
		h5.settings.log = {
			defaultOut: {
				level: level,
				targets: 'console'
			}
		};
		h5.log.configure();
	}

	function outputEachLevel() {
		var logger = h5.log.createLogger('LogTest');
		window.console && window.console.log("-------------- 基本コンソールログ出力 ここから --------------");
		logger.error('ERRORレベルのログ');
		logger.warn('WARNレベルのログ');
		logger.info('INFOレベルのログ');
		logger.debug('DEBUGレベルのログ');
		logger.trace('TRACEレベルのログ');
		window.console && window.console.log("-------------- 基本コンソールログ出力 ここまで --------------");
	}

	function testForLogLevelStr(levelStr, message) {
		setLevel(levelStr.toLowerCase());
		outputEachLevel();
		ok(true, message);
		setLevel(levelStr.toUpperCase());
		outputEachLevel();
		ok(true, message);
	}

	function testForLogLevelNum(levelNum, message) {
		setLevel(levelNum);
		outputEachLevel();
		ok(true, message);
	}

	module("h5.log", {
		teardown: function() {
			setLevel();
		}
	});

	test(
			'※要目視確認：基本コンソールログ出力',
			1,
			function() {
				outputEachLevel();
				ok(
						true,
						'デフォルトレベルで出力します。開発支援版(h5.dev.js)の場合はデバッグコンソールを確認し、ERROR, WARN, INFO, DEBUGのレベル順にメッセージが出ていることを確認してください。');
			});

	test('※要目視確認：ログレベル閾値動作 error,ERROR', 2, function() {
		testForLogLevelStr('error',
				'デバッグコンソールを確認し、ERRORのログが出力され、WARN, INFO、DEBUG, TRACEのログが出力「されていない」ことを確認してください。');
	});


	test('※要目視確認：ログレベル閾値動作 warn,WARN', 2, function() {
		testForLogLevelStr('warn',
				'デバッグコンソールを確認し、ERROR, WARNのログが出力され、INFO, DEBUG, TRACEのログが出力「されていない」ことを確認してください。');
	});

	test('※要目視確認：ログレベル閾値動作 info,INFO', 2, function() {
		testForLogLevelStr('info',
				'デバッグコンソールを確認し、ERROR, WARN, INFOのログが出力され、DEBUG, TRACEのログが出力「されていない」ことを確認してください。');
	});


	test('※要目視確認：ログレベル閾値動作 debug,DEBUG', 2, function() {
		testForLogLevelStr('debug',
				'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUGのログが出力され、TRACEのログが出力「されていない」ことを確認してください。');
	});


	test('※要目視確認：ログレベル閾値動作 trace,TRACE', 2, function() {
		testForLogLevelStr('trace',
				'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEの順にログが出力されていることを確認してください。');
	});

	test('※要目視確認：ログレベル閾値動作 all,ALL', 2, function() {
		testForLogLevelStr('all',
				'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEの順にログが出力されていることを確認してください。');
	});

	test('※要目視確認：ログレベル閾値動作 none,NONE', 2, function() {
		testForLogLevelStr('none', 'デバッグコンソールを確認し、ログが出力「されていない」ことを確認してください。');
	});

	test(
			'※要目視確認：ログレベル閾値動作 level指定なし, null',
			2,
			function() {
				try {
					h5.settings.log = {
						defaultOut: {
							targets: 'console'
						}
					};
					h5.log.configure();
					outputEachLevel();
					ok(
							true,
							'level指定なし： デフォルトレベルで出力します。開発支援版(h5.dev.js)の場合はデバッグコンソールを確認し、ERROR, WARN, INFO, DEBUGのレベル順にメッセージが出ていることを確認してください。');

					h5.settings.log = {
						defaultOut: {
							level: null,
							targets: 'console'
						}
					};
					h5.log.configure();
					outputEachLevel();
					ok(
							true,
							'level指定なし： デフォルトレベルで出力します。開発支援版(h5.dev.js)の場合はデバッグコンソールを確認し、ERROR, WARN, INFO, DEBUGのレベル順にメッセージが出ていることを確認してください。');
				} catch (e) {
					ok(false, e.code + ': ' + e.message);
				}
			});

	test('ログレベル閾値動作 ログレベルに不正な値(ログレベル指定できない文字、空文字、空白文字、文字列以外)を指定するとエラーが出ること', 5, function() {
		var levels = ['debag', '', ' ', [], {
			level: 'debug'
		}];
		var levelsStr = ["'debag'", "''", "' '", "[]", "{level: 'debug'}"];
		for ( var i = 0, l = levels.length; i < l; i++) {
			try {
				h5.settings.log = {
					defaultOut: {
						level: levels[i],
						targets: 'console'
					}
				};
				h5.log.configure();
				ok(false, 'エラーが発生していません。 ' + levelsStr[i]);
			} catch (e) {
				ok(true, e.code + ': ' + e.message + ' ' + levelsStr[i]);
			}
		}
	});

	test('ログレベル閾値動作 aaa(不正な文字)を指定するとエラーが出ること', 1, function() {
		try {
			h5.settings.log = {
				defaultOut: {
					level: 'aaa',
					targets: 'console'
				}
			};
			h5.log.configure();
		} catch (e) {
			ok(true, e.code + ': ' + e.message);
		}
	});


	test('※要目視確認：ログレベル閾値動作 51, -1', function() {
		testForLogLevelNum(51, 'デバッグコンソールを確認し、ログが出力「されていない」ことを確認してください。');
		testForLogLevelNum(-1, 'デバッグコンソールを確認し、ログが出力「されていない」ことを確認してください。');
	});

	test('※要目視確認：ログレベル閾値動作 50,41', function() {
		testForLogLevelNum(50,
				'デバッグコンソールを確認し、ERRORのログが出力され、WARN, INFO、DEBUG, TRACEのログが出力「されていない」ことを確認してください。');
		testForLogLevelNum(41,
				'デバッグコンソールを確認し、ERRORのログが出力され、WARN, INFO、DEBUG, TRACEのログが出力「されていない」ことを確認してください。');
	});

	test('※要目視確認：ログレベル閾値動作 40,31', function() {
		testForLogLevelNum(40,
				'デバッグコンソールを確認し、ERROR, WARNのログが出力され、INFO, DEBUG, TRACEのログが出力「されていない」ことを確認してください。');
		testForLogLevelNum(31,
				'デバッグコンソールを確認し、ERROR, WARNのログが出力され、INFO, DEBUG, TRACEのログが出力「されていない」ことを確認してください。');
	});

	test('※要目視確認：ログレベル閾値動作 30,21', function() {
		testForLogLevelNum(30,
				'デバッグコンソールを確認し、ERROR, WARN, INFOのログが出力され、DEBUG, TRACEのログが出力「されていない」ことを確認してください。');
		testForLogLevelNum(21,
				'デバッグコンソールを確認し、ERROR, WARN, INFOのログが出力され、DEBUG, TRACEのログが出力「されていない」ことを確認してください。');
	});


	test('※要目視確認：ログレベル閾値動作 20,11', function() {
		testForLogLevelNum(20,
				'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUGのログが出力され、TRACEのログが出力「されていない」ことを確認してください。');
		testForLogLevelNum(11,
				'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUGのログが出力され、TRACEのログが出力「されていない」ことを確認してください。');
	});

	test('※要目視確認：ログレベル閾値動作 10,0', function() {
		testForLogLevelNum(10,
				'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEの順にログが出力されていることを確認してください。');
		testForLogLevelNum(0,
				'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEの順にログが出力されていることを確認してください。');
	});

	test('※要目視確認：オブジェクトを渡した時の動作', function() {

		var obj = {
			a: 1
		};
		setLevel('all');
		var logger = h5.log.createLogger('LogTest');
		logger.info("-------------- オブジェクトを渡した時の動作 ここから --------------");
		logger.error(obj);
		logger.warn(obj);
		logger.info(obj);
		logger.debug(obj);
		logger.trace(obj);
		logger.info(obj);
		logger.info("-------------- オブジェクトを渡した時の動作 ここまで --------------");

		ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEのレベル順にメッセージが出ていることを確認してください。');
	});

	test('ログカテゴリの設定 (h5.log.createLogger)', function() {
		var category = 'log.category';
		var logger1 = h5.log.createLogger(category);
		try {
			h5.log.createLogger();
		} catch (e) {
			ok(e.message === 'categoryは必須項目です。1文字以上の文字列を指定してください。',
					'h5.log.createLogger() に何も渡さない場合、エラーが発生すること。');
		}

		ok(category === logger1.category, 'h5.log.createLogger() に渡したカテゴリが設定されていること。');
	});

	test(
			'ログカテゴリの設定 (h5.log.createLogger) 不正な値を設定するとエラーが出ること。("", " ", {}, [], 0, 1, true, false)',
			8,
			function() {
				var categorys = ['', ' ', {}, [], 0, 1, true, false];
				var categorysStr = ["''", "' '", "{}", "[]", "0", "1", "true", "false"];
				for ( var i = 0, l = categorys.length; i < l; i++) {
					try {
						h5.log.createLogger(categorys[i]);
						ok(false, 'エラーが発生していません');
					} catch (e) {
						ok(e.message === 'categoryは必須項目です。1文字以上の文字列を指定してください。',
								'h5.log.createLogger() に' + categorysStr[i] + 'を渡した場合、エラーが発生すること。');
					}
				}
			});
	test('カテゴリによるフィルタ outに指定するカテゴリが不正な時にエラー', 8, function() {
		var errorCode = 10010;
		var categorys = ['', ' ', {}, [], 0, 1, true, false];
		var categorysStr = ["''", "' '", "{}", "[]", "0", "1", "true", "false"];
		for ( var i = 0, l = categorys.length; i < l; i++) {
			h5.settings.log = {
				target: {
					myTarget: {
						type: 'console'
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
				deepEqual(e.code, errorCode, e.message);
			}
		}
	});

	test(
			'※要目視確認：カテゴリによるフィルタ',
			function() {
				h5.settings.log = {
					target: {
						myTarget: {
							type: 'console'
						}
					},
					out: [{
						category: 'jp.co.hifive.controller*',
						level: 'trace',
						targets: ['myTarget']
					}, {
						category: 'jp.co.hifive.logic*',
						level: 'info',
						targets: ['console']
					}, {
						category: 'test',
						level: 'error',
						targets: ['console']
					}]
				};
				h5.log.configure();
				var logger = h5.log.createLogger('jp.co.hifive.controller.SampleController');
				logger.info("-------------- カテゴリによるフィルタ1 ここから --------------");
				logger.error('ERRORレベルのログ');
				logger.warn('WARNレベルのログ');
				logger.info('INFOレベルのログ');
				logger.debug('DEBUGレベルのログ');
				logger.trace('TRACEレベルのログ');
				logger.info("-------------- カテゴリによるフィルタ1 ここまで --------------");

				ok(true,
						'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEのレベル順にメッセージが出ていることを確認してください。');

				var logger = h5.log.createLogger('jp.co.hifive.logic.SampleLogic');
				logger.info("-------------- カテゴリによるフィルタ2 ここから --------------");
				logger.error('ERRORレベルのログ');
				logger.warn('WARNレベルのログ');
				logger.info('INFOレベルのログ');
				logger.debug('DEBUGレベルのログ');
				logger.trace('TRACEレベルのログ');
				logger.info("-------------- カテゴリによるフィルタ2 ここまで --------------");

				ok(true,
						'デバッグコンソールを確認し、ERROR, WARN, INFOのログが出力され、DEBUG, TRACEのログが出力「されていない」ことを確認してください。');

				var logger = h5.log.createLogger('test');
				logger.error("-------------- カテゴリによるフィルタ3 ここから --------------");
				logger.error('ERRORレベルのログ');
				logger.warn('WARNレベルのログ');
				logger.info('INFOレベルのログ');
				logger.debug('DEBUGレベルのログ');
				logger.trace('TRACEレベルのログ');
				logger.error("-------------- カテゴリによるフィルタ3 ここまで --------------");

				ok(true,
						'デバッグコンソールを確認し、ERRORのログが出力され、 WARN, INFO, DEBUG, TRACEのログが出力「されていない」ことを確認してください。');

				var logger = h5.log.createLogger('jp.co.hifive.utility');
				logger.info("-------------- カテゴリによるフィルタ4 ここから --------------");
				logger.error('ERRORレベルのログ');
				logger.warn('WARNレベルのログ');
				logger.info('INFOレベルのログ');
				logger.debug('DEBUGレベルのログ');
				logger.trace('TRACEレベルのログ');
				logger.info("-------------- カテゴリによるフィルタ4 ここまで --------------");

				ok(
						true,
						'デフォルトレベルで出力します。開発支援版(h5.dev.js)の場合はデバッグコンソールを確認し、ERROR, WARN, INFO, DEBUGのレベル順にメッセージが出ていることを確認してください。');
			});

	test('targetにプレーンオブジェクト以外のものを指定してエラーが発生すること。', 3, function() {
		var errorCode = 10009;
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

	test('※要目視確認 target.typeに、オブジェクトが指定できること。', 1, function() {
		h5.settings.log = {
			target: {
				myTarget: {
					type: {
						log: function(obj) {
							if (window.console) {
								console.log('■■上書きされたlog関数による出力■■', obj.args[0]);
							}
						}
					}
				},
				myTarget2: {
					type: {
						log: function(obj) {
							if (window.console) {
								console.log('■上書きされたlog関数による出力■', obj.args[0]);
							}
						}
					}
				}
			},
			out: [{
				category: 'for test target.type',
				level: 'trace',
				targets: ['myTarget', 'myTarget2']
			}]
		};
		h5.log.configure();
		var logger = h5.log.createLogger('for test target.type');
		logger.trace('test');
		ok(true, '"■■上書きされたlog関数による出力■■ test"  と出力されていることを確認してください。')
	});

	test('target.typeに、オブジェクト, "console"以外を指定するとエラーになること。', 6, function() {
		var errorCode = 10000;
		var vals = [[], '', 'remote', 1, true, false];
		for ( var i = 0, l = vals.length; i < l; i++) {
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
				deepEqual(e.code, errorCode, e.message);
			}
		}
	});

	test('categoryに重複したものをとうろくしてconfigure()するとエラーが発生すること。', 1, function() {
		var errorCode = 10002;
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
			deepEqual(e.code, errorCode, e.message);
		}
	});


	test('targetsに重複したターゲットを登録してconfigure()するとエラーが発生すること。', 1, function() {
		var errorCode = 10007;
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
			deepEqual(e.code, errorCode, e.message);
		}
	});

	test('※要目視確認：スタックトレース グローバル領域(loadScriptで読み込む)から出力', 1, function() {
		if(!h5.u){
			ok(false, 'このテストはh5.uを読み込む必要があります');
			return;
		}
		h5.u.loadScript('data/stacktrace.js');
		ok(true, 'Chrome,Firefoxではトレース結果が出力されていること(chromeだと、[DEBUG]16:39:3,213: スタックトレース - テスト [eval <anonymous> () <- eval (native) <- {anonymous} ...])'
				+ 'IE,Safariではトレースできないため、[DEBUG]16:39:3,213: スタックトレース - テスト [undefined] のように表示されていることを確認してください。')
	});
	test('※要目視確認：スタックトレース', 0, function() {

		// ネイティブのトレース機能を確認
		// 名前付き(fn.nameで名前を取得できる)関数。
		var func1Named = function func1_1(){
			this.name = 'func1_1';
			function func1_2() {
				var logger = h5.log.createLogger("テスト h5.u");
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
			ok(false, 'このブラウザはconsoleをサポートしていません。IE9の場合は、開発者ツールを開いてからテストを実行して下さい。');
			return;
		}

		// オリジナルのトレース機能を確認
		var func2Named = function func2() {
			function func2_1() {
				function func2_2() {
					var logger = h5.log.createLogger("テスト h5.u");
					logger.enableStackTrace = true;
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
	});

	test('※要目視確認：ログターゲットの設定 (h5.log.createLogger) 指定なし、undefined、null を指定したときはログが出力されないこと。', 3,
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
		var errorCode = 10008;
		for ( var i = 0, l = categorys.length; i < l; i++) {
			try {
				h5.settings.log = {
					defaultOut: {
						targets: categorys[i]
					}
				};
				h5.log.configure();
				ok(false, 'エラーが発生していません ' + categorysStr[i]);
			} catch (e) {
				deepEqual(e.code, errorCode, e.message + categorysStr[i]);
			}
		}
	});

	test('ログターゲットの設定 (h5.log.createLogger)  "console"以外の文字列を指定したときはエラーが出ること。', 1, function() {
		var errorCode = 10004;
		try {
			h5.settings.log = {
				defaultOut: {
					targets: "aaa"
				}
			};
			h5.log.configure();
			ok(false, 'エラーが発生していません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
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

		var errorCode = 10004;
		h5.settings.log = {
			defaultOut: {
				targets: ['aa', 'console']
			}
		};
		try {
			h5.log.configure();
			ok(true, 'null,undefined,"console"ではエラー発生しない。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});

	test(
			'ログターゲットの設定 (h5.log.createLogger)  配列の中に(null/undefined/文字列)以外、空文字、空白文字、を指定したときはエラーが出ること。',
			7, function() {
				var errorCode = 10008;
				var vals = [{}, [], '', ' ', 1, true, false];
				for ( var i = 0, l = vals.length; i < l; i++) {
					h5.settings.log = {
						defaultOut: {
							targets: ['console', vals[i]]
						}
					};
					try {
						h5.log.configure();
						ok(true, 'null,undefined,"console"ではエラー発生しない。');
					} catch (e) {
						deepEqual(e.code, errorCode, e.message);
					}
				}
			});
});