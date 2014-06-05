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

	var ERR = ERRCODE.h5.mixin;

	//=============================
	// Functions
	//=============================

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================

	module("Mixinクラス");

	//=============================
	// Body
	//=============================
	test('createMixinでMixinクラスを作成', 2, function() {
		var moduleObject = {
			s1: 'hoge'
		};
		var mixin = h5.mixin.createMixin(moduleObject);
		strictEqual(typeof mixin.mix, 'function', 'mixメソッドを持っていること');
		strictEqual(typeof mixin.hasInterface, 'function', 'hasInterfaceメソッドを持っていること');
	});

	test('createMixinで作成したMixinクラスのmix()メソッド', 2, function() {
		function f1() {
		// 何もしない関数1
		}
		var moduleObject = {
			s: 'a',
			f: f1,
			n: 1,
			b: false,
			nul: null,
			undef: undefined,
			o: {},
			S: new String('a'),
			N: new Number(1),
			B: new Boolean(true),
			r: /a/,
			_p: 'p'
		};
		var mixin = h5.mixin.createMixin(moduleObject);
		var target = {
			s: '上書きされる値',
			s2: 's2',
			o: {
				hoge: 'hoge'
			}
		};
		var expect = {
			s: 'a',
			f: f1,
			n: 1,
			b: false,
			nul: null,
			s2: 's2',
			o: {
				hoge: 'hoge'
			},
			_p: 'p'
		};
		mixin.mix(target);
		deepEqual(target, expect,
				'mixメソッドでmixinされ、文字列リテラル、関数、数値リテラル、真偽値リテラル、nullのプロパティが上書きでコピーされること');

		function A() {
			this.s1 = 'a';
			this.s4 = 'd';
			this._p = 'p';
		}
		A.prototype = {
			s1: 'aa',
			s2: 'bb',
			s5: 'ee'
		};
		mixin = h5.mixin.createMixin(new A());
		target = {
			s2: 'B',
			s3: 'C'
		};
		expect = {
			s1: 'a',
			s2: 'B',
			s3: 'C',
			s4: 'd',
			_p: 'p'
		};
		mixin.mix(target);
		deepEqual(target, expect, 'hasOwnPropertyがtrueのもののみコピーされること');
	});

	test('createMixin作成したMixinクラスのhasInterfaceメソッド', 5, function() {
		var module = {
			a: 1,
			n: null,
			_p: 'p'
		};
		var mixin = h5.mixin.createMixin(module);
		strictEqual(mixin.hasInterface({
			a: 1,
			b: 1,
			n: null,
			_p: 'p'
		}), true, 'モジュールオブジェクトのプロパティを持っていればhasInterfaceはtrueを返すこと');
		strictEqual(mixin.hasInterface({
			a: 1,
			b: 1,
			n: null
		}), true, 'プライベート("_"始まり)のプロパティは持っていなくても、hasInterfaceはtrueを返すこと');

		strictEqual(mixin.hasInterface({
			a: null,
			n: false
		}), true, '値が違っていてもプロパティを持っていればhasInterfaceはtrueを返すこと');

		function A() {
		// 何もしない
		}
		A.prototype = {
			a: 0,
			n: 0
		};
		strictEqual(mixin.hasInterface(new A()), true, 'prototypeで持っていてもhasInterfaceはtrueを返すこと');

		strictEqual(mixin.hasInterface({
			a: 1
		}), false, 'モジュールのプロパティを１つでも持っていないオブジェクトを渡した場合はfalseを返すこと');


	});

	//=============================
	// Definition
	//=============================

	module("eventDispatcher");

	//=============================
	// Body
	//=============================

	test('eventDispatcher.mix()', 4, function() {
		var target = {
			a: 1
		};
		h5.mixin.eventDispatcher.mix(target);
		ok($.isFunction(target.addEventListener), 'addEventListener関数を持っていること');
		ok($.isFunction(target.removeEventListener), 'removeEventListener関数を持っていること');
		ok($.isFunction(target.hasEventListener), 'hasEventListener関数を持っていること');
		ok($.isFunction(target.dispatchEvent), 'dispatchEvent関数を持っていること');
	});

	test('eventDispatcher.hasInterface()', 2, function() {
		var target = {
			addEventListener: null,
			removeEventListener: null,
			hasEventListener: null,
			dispatchEvent: null
		};
		strictEqual(h5.mixin.eventDispatcher.hasInterface(target), true,
				'EventDispatcherのプロパティを全て持っているオブジェクトについてはtrueが返ること');
		target.addEventListener = undefined;
		strictEqual(h5.mixin.eventDispatcher.hasInterface(target), false,
				'EventDispatcherのプロパティを一つでも持っていないオブジェクトについてはfalseが返ること');
	});

	test('addEventListener 正常系', 4, function() {
		var item = {};
		h5.mixin.eventDispatcher.mix(item);
		function listener() {
		// 何もしない
		}
		// (文字列,関数またはEnventListenerオブジェクト)ならエラーにならない
		var validArgs = [['change', listener], ['itemsChange', listener], [' ', listener],
				['', listener], ['change', {
					handleEvent: listener
				}]];
		var l = validArgs.length;
		for (var i = 0; i < l; i++) {
			var ret = item.addEventListener(validArgs[i][0], validArgs[i][1]);
			strictEqual(ret, undefined,
					'(文字列、関数またはEnventListenerオブジェクト))ならエラーにならないこと。戻り値はundefinedであること。'
							+ validArgs[i]);
			item.removeEventListener(validArgs[i][0], validArgs[i][1]);
		}
		expect(l);
	});

	test('addEventListener 異常系', 4, function() {
		var item = {};
		h5.mixin.eventDispatcher.mix(item);
		var errCode = ERR.ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER;
		try {
			item.addEventListener();
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, 'addEventListenerの引数にハンドラだけ渡した時、エラーになること');
		}
		try {
			item.addEventListener('cnahge');
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, 'addEventListenerの引数にイベント名だけ渡した時、エラーになること');
		}
		try {
			item.addEventListener(function() {
			// 何もしない
			});
			ok(false, 'エラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, 'addEventListenerの引数にハンドラだけ渡した時、エラーになること');
		}
		try {
			item.addEventListener(document.createEventObject ? document
					.createEventObject('itemsChange') : !!document.createEvent ? document
					.createEvent('HTMLEvents') : new Event('itemsChange'));
			ok(false, 'イベント名が文字列でない場合にエラーが発生していません');
		} catch (e) {
			strictEqual(e.code, errCode, e.message);
		}
	});

	test('hasEventListener イベントリスナが関数の場合', 5, function() {
		var item = {};
		h5.mixin.eventDispatcher.mix(item);
		function listener() {
		// 何もしない
		}
		var ret = item.hasEventListener('change', listener);
		strictEqual(ret, false, 'addEventListenerする前のhasEventListenerの結果はfalseであること');

		item.addEventListener('change', listener);
		ret = item.hasEventListener('change', listener);
		strictEqual(ret, true,
				'addEventListenerした後、addしたイベントとハンドラのインスタンスをhasEventListenerに渡した時、結果はtrueであること');

		ret = item.hasEventListener('change', function() {
		// 何もしない
		});
		strictEqual(ret, false,
				'addEventListenerに渡したインスタンスと異なるインスタンスをhasEventListenerに渡した場合、結果はfalseであること');

		ret = item.hasEventListener('itemsChange', listener);
		strictEqual(ret, false,
				'addEventListenerに渡したイベント名と異なるイベント名をhasEventListenerに渡した場合、結果はfalseであること');

		item.removeEventListener('change', listener);
		ret = item.hasEventListener('change', listener);
		strictEqual(ret, false, 'removeEventListenerすると、hasEventListenerの結果はfalseであること');
	});

	test('hasEventListener イベントリスナがイベントリスナオブジェクトの場合', 5, function() {
		var item = {};
		h5.mixin.eventDispatcher.mix(item);
		var listenerObj = {
			handleEvent: function() {
			// 何もしない
			}
		};
		var ret = item.hasEventListener('change', listenerObj);
		strictEqual(ret, false, 'addEventListenerする前のhasEventListenerの結果はfalseであること');

		item.addEventListener('change', listenerObj);
		ret = item.hasEventListener('change', listenerObj);
		strictEqual(ret, true,
				'addEventListenerした後、addしたイベントとハンドラのインスタンスをhasEventListenerに渡した時、結果はtrueであること');

		ret = item.hasEventListener('change', function() {
		// 何もしない
		});
		strictEqual(ret, false,
				'addEventListenerに渡したインスタンスと異なるインスタンスをhasEventListenerに渡した場合、結果はfalseであること');

		ret = item.hasEventListener('itemsChange', listenerObj);
		strictEqual(ret, false,
				'addEventListenerに渡したイベント名と異なるイベント名をhasEventListenerに渡した場合、結果はfalseであること');

		item.removeEventListener('change', listenerObj);
		ret = item.hasEventListener('change', listenerObj);
		strictEqual(ret, false, 'removeEventListenerすると、hasEventListenerの結果はfalseであること');
	});

	test(
			'removeEventListener イベントリスナが関数の場合',
			function() {
				var item = {};
				h5.mixin.eventDispatcher.mix(item);
				function listener() {
				// 何もしない
				}
				var ret = item.removeEventListener('change', listener);
				strictEqual(ret, undefined,
						'指定したイベントに指定した関数インスタンスが登録されていない時、removeEventListenerの戻り値はundefinedであること');

				item.addEventListener('change', listener);

				item.removeEventListener('itemsChange', listener);
				ret = item.hasEventListener('change', listener);
				strictEqual(
						ret,
						true,
						'addEventListenerに渡したイベント名と異なるイベント名をremoveEventListenerに渡して呼び出した場合、addしたイベントについてのhasEventListenerの結果はtrueであること');

				item.removeEventListener('change', function() {
				//
				});
				ret = item.hasEventListener('change', listener);
				strictEqual(
						ret,
						true,
						'addEventListenerに渡したハンドラと異なるハンドラをremoveEventListenerに渡して呼び出した場合、addしたイベントについてのhasEventListenerの結果はtrueであること');

				ret = item.removeEventListener('change', listener);
				strictEqual(ret, undefined,
						'指定したイベントに指定した関数インスタンスが登録されてる時、removeEventListenerの戻り値はundefinedであること');

				ret = item.hasEventListener('change', listener);
				strictEqual(
						ret,
						false,
						'removeEventListenerにaddEventListenerしたイベント名とハンドラを渡すと、そのイベントとハンドラについてのhasEventListenerの結果はfalseになること');
			});

	test(
			'removeEventListener イベントリスナがイベントリスナオブジェクトの場合',
			function() {
				var item = {};
				h5.mixin.eventDispatcher.mix(item);
				var listenerObj = {
					handleEvent: function() {
					// 何もしない
					}
				};
				var ret = item.removeEventListener('change', listenerObj);
				strictEqual(ret, undefined,
						'指定したイベントに指定した関数インスタンスが登録されていない時、removeEventListenerの戻り値はundefinedであること');

				item.addEventListener('change', listenerObj);

				item.removeEventListener('itemsChange', listenerObj);
				ret = item.hasEventListener('change', listenerObj);
				strictEqual(
						ret,
						true,
						'addEventListenerに渡したイベント名と異なるイベント名をremoveEventListenerに渡して呼び出した場合、addしたイベントについてのhasEventListenerの結果はtrueであること');

				item.removeEventListener('change', function() {
				//
				});
				ret = item.hasEventListener('change', listenerObj);
				strictEqual(
						ret,
						true,
						'addEventListenerに渡したハンドラと異なるハンドラをremoveEventListenerに渡して呼び出した場合、addしたイベントについてのhasEventListenerの結果はtrueであること');

				ret = item.removeEventListener('change', listenerObj);
				strictEqual(ret, undefined,
						'指定したイベントに指定した関数インスタンスが登録されてる時、removeEventListenerの戻り値はundefinedであること');

				ret = item.hasEventListener('change', listenerObj);
				strictEqual(
						ret,
						false,
						'removeEventListenerにaddEventListenerしたイベント名とハンドラを渡すと、そのイベントとハンドラについてのhasEventListenerの結果はfalseになること');
			});

	test(
			'addEventListenerで"change"イベントに登録したハンドラだけが実行され、removeEventListenerされたハンドラは実行されなくなること。イベントリスナが関数の場合。',
			function() {
				var item = {
					change: function() {
						this.dispatchEvent({
							type: 'change'
						});
					}
				};
				h5.mixin.eventDispatcher.mix(item);
				var order = [];
				function listener() {
				// 何もしない
				}
				// イベントをaddする
				function l1() {
					order.push('l1');
				}
				function l2() {
					order.push('l2');
				}
				item.addEventListener('change', l1);
				item.change();

				deepEqual(order, ['l1'], 'addEventListenerの"change"にハンドリングした関数が実行されていること');

				order = [];
				item.addEventListener('change', l1);
				item.change();

				deepEqual(order, ['l1'], 'addEventListenerの"change"に同じ関数を2度ハンドリングしても一度だけ実行されること');

				order = [];
				item.addEventListener('change', l2);
				item.change();

				deepEqual(order, ['l1', 'l2'],
						'addEventListenerの"change"にさらに別の関数をハンドリングすると、addした順番で実行されること');

				order = [];
				item.removeEventListener('change', l1);
				item.change();

				deepEqual(order, ['l2'], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				item.removeEventListener('change', l2);
				item.change();

				deepEqual(order, [], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				function itemsChange() {
					order.push('itemsChange');
				}
				function CHANGE() {
					order.push('CHANGE');
				}
				item.addEventListener('itemsChange', itemsChange);
				item.addEventListener('CHANGE', CHANGE);
				item.change();

				deepEqual(order, [], 'addEventListenerの"change"以外を指定してハンドリングした関数は、実行されないこと');

				// addしたイベントを削除
				item.removeEventListener('itemsChange', l1);
				item.removeEventListener('itemsChange', itemsChange);
				item.removeEventListener('itemsChange', CHANGE);
			});

	test(
			'addEventListenerで"change"イベントに登録したハンドラだけが実行され、removeEventListenerされたハンドラは実行されなくなること。イベントリスナがイベントリスナオブジェクトの場合。',
			function() {
				var item = {
					change: function() {
						this.dispatchEvent({
							type: 'change'
						});
					}
				};
				h5.mixin.eventDispatcher.mix(item);
				var order = [];
				// イベントをaddする
				var l1 = {
					handleEvent: function() {
						order.push('l1');
					}
				};
				var l2 = {
					handleEvent: function() {
						order.push('l2');
					}
				};
				item.addEventListener('change', l1);

				item.change();

				deepEqual(order, ['l1'], 'addEventListenerの"change"にハンドリングした関数が実行されていること');

				order = [];
				item.addEventListener('change', l1);
				item.change();

				deepEqual(order, ['l1'], 'addEventListenerの"change"に同じ関数を2度ハンドリングしても一度だけ実行されること');

				order = [];
				item.addEventListener('change', l2);
				item.change();

				deepEqual(order, ['l1', 'l2'],
						'addEventListenerの"change"にさらに別の関数をハンドリングすると、addした順番で実行されること');

				order = [];
				item.removeEventListener('change', l1);
				item.change();

				deepEqual(order, ['l2'], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				item.removeEventListener('change', l2);
				item.change();

				deepEqual(order, [], 'removeEventListenerすると、removeしたハンドラは実行されないこと');

				order = [];
				var itemsChangeListener = {
					handleEvent: function() {
						order.push('itemsChange');
					}
				};
				var changeListener = {
					handleEvent: function() {
						order.push('CHANGE');
					}
				};
				item.addEventListener('itemsChange', itemsChangeListener);
				item.addEventListener('CHANGE', changeListener);
				item.change();

				deepEqual(order, [], 'addEventListenerの"change"以外を指定してハンドリングした関数は、実行されないこと');

				// addしたイベントを削除
				item.removeEventListener('itemsChange', l1);
				item.removeEventListener('itemsChange', itemsChangeListener);
				item.removeEventListener('itemsChange', changeListener);
			});

	test('イベントリスナ内のthis 関数の場合', 1, function() {
		var item = {
			change: function() {
				this.dispatchEvent({
					type: 'change'
				});
			}
		};
		h5.mixin.eventDispatcher.mix(item);
		var context = null;
		function listener() {
			context = this;
		}
		item.addEventListener('change', listener);
		item.change();
		strictEqual(context, item, 'イベントリスナ内のthisはイベントの起きたオブジェクトであること');
		item.removeEventListener('change', listener);
	});

	test('イベントリスナ内のthis イベントリスナオブジェクトの場合', 1, function() {
		var item = {
			change: function() {
				this.dispatchEvent({
					type: 'change'
				});
			}
		};
		h5.mixin.eventDispatcher.mix(item);
		var context = null;
		var listenerObj = {
			handleEvent: function() {
				context = this;
			}
		};
		item.addEventListener('change', listenerObj);
		item.change();
		strictEqual(context, listenerObj, 'イベントリスナ内のthisはイベントリスナオブジェクトであること');
		item.removeEventListener('change', listenerObj);
	});
});
