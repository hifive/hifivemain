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

	module("h5.log");

	function outputAll() {
		h5.settings.log = {
			defaultOut: {
				level: 'trace',
				targets: 'console'
			}
		};
		h5.log.configure();
	}

	test('※要目視確認：基本コンソールログ出力', function() {
		outputAll();
		var logger = h5.log.createLogger('LogTest');
		logger.info("-------------- 基本コンソールログ出力 ここから --------------");
		logger.error('ERRORレベルのログ');
		logger.warn('WARNレベルのログ');
		logger.info('INFOレベルのログ');
		logger.debug('DEBUGレベルのログ');
		logger.trace('TRACEレベルのログ');
		logger.info("-------------- 基本コンソールログ出力 ここまで --------------");

		ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEのレベル順にメッセージが出ていることを確認してください。');
	});

	test('※要目視確認：ログレベル閾値動作', function() {
		h5.settings.log = {
			defaultOut: {
				level: 'info',
				targets: 'console'
			}
		};
		h5.log.configure();
		var logger = h5.log.createLogger('LogTest');
		logger.info("-------------- ログレベル閾値動作 ここから --------------");
		logger.error('ERRORレベルのログ');
		logger.warn('WARNレベルのログ');
		logger.info('INFOレベルのログ');
		logger.debug('DEBUGレベルのログ');
		logger.trace('TRACEレベルのログ');
		logger.info("-------------- ログレベル閾値動作 ここまで --------------");

		ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFOのログが出力され、DEBUG, TRACEのログが出力「されていない」ことを確認してください。');
	});

	test('※要目視確認：オブジェクトを渡した時の動作', function() {
		outputAll();
		var obj = {
			a: 1
		};
		var logger = h5.log.createLogger('LogTest');
		logger.info("-------------- オブジェクトを渡した時の動作 ここから --------------");
		logger.error(obj);
		logger.warn(obj);
		logger.info(obj);
		logger.debug(obj);
		logger.trace(obj);
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

	test('※要目視確認：カテゴリによるフィルタ', function() {
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

		ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEのレベル順にメッセージが出ていることを確認してください。');

		var logger = h5.log.createLogger('jp.co.hifive.logic.SampleLogic');
		logger.info("-------------- カテゴリによるフィルタ2 ここから --------------");
		logger.error('ERRORレベルのログ');
		logger.warn('WARNレベルのログ');
		logger.info('INFOレベルのログ');
		logger.debug('DEBUGレベルのログ');
		logger.trace('TRACEレベルのログ');
		logger.info("-------------- カテゴリによるフィルタ2 ここまで --------------");

		ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFOのログが出力され、DEBUG, TRACEのログが出力「されていない」ことを確認してください。');


		var logger = h5.log.createLogger('jp.co.hifive.utility');
		logger.info("-------------- カテゴリによるフィルタ3 ここから --------------");
		logger.error('ERRORレベルのログ');
		logger.warn('WARNレベルのログ');
		logger.info('INFOレベルのログ');
		logger.debug('DEBUGレベルのログ');
		logger.trace('TRACEレベルのログ');
		logger.info("-------------- カテゴリによるフィルタ3 ここまで --------------");

		ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEのログが出力「されていない」ことを確認してください。');
	});

	test('※要目視確認：スタックトレース', function() {
		outputAll();
		// ネイティブのトレース機能を確認
		function func1() {
			function func1_1() {
				function func1_2() {
					var logger = h5.log.createLogger("テスト h5.u");
					logger.enableStackTrace = true;
					logger.debug("スタックトレース - テスト");
				}
				func1_2();
			}
			func1_1();
		}
		func1();

		if (!window.console) {
			ok(false, 'このブラウザはconsoleをサポートしていません。IE9の場合は、開発者ツールを開いてからテストを実行して下さい。');
			return;
		}

		// オリジナルのトレース機能を確認
		function func2() {
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
			func2_1();
		}
		func2();
	});

});