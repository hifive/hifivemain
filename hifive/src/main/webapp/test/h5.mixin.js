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
			r: /a/
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
			}
		};
		mixin.mix(target);
		deepEqual(expect, target,
				'mixメソッドでmixinされ、文字列リテラル、関数、数値リテラル、真偽値リテラル、nullのプロパティが上書きでコピーされること');

		function A() {
			this.s1 = 'a';
			this.s4 = 'd';
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
			s4: 'd'
		};
		mixin.mix(target);
		deepEqual(target, expect, 'hasOwnPropertyがtrueのもののみコピーされること');
	});

	test('createMixin作成したMixinクラスのhasInterfaceメソッド', 4, function() {
		var module = {
			a: 1,
			n: null
		};
		mixin = h5.mixin.createMixin(module);
		strictEqual(mixin.hasInterface({
			a: 1,
			b: 1,
			n: null
		}), true, 'モジュールオブジェクトのプロパティを持っていればhasInterfaceはtrueを返すこと');
		strictEqual(mixin.hasInterface({
			a: null,
			n: false
		}), true, '値が違っていてもプロパティを持っていればhasInterfaceはtrueを返すこと');

		function A() {}
		;
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

	test('EventDispatcherの動作', 5, function() {
		var target = {};
		h5.mixin.eventDispatcher.mix(target);
		var result = '';
		function handler(e) {
			result += e.type;
		}
		target.addEventListener('hoge', handler);
		strictEqual(target.hasEventListener('hoge', handler), true,
				'addEventLisnterで追加したイベントとイベントハンドラについて、hasEventListenerでチェックするとtrueが返ること');
		strictEqual(target.hasEventListener('fuga', handler), false,
				'追加していないイベントについてhasEventListenerでチェックするとfalseが返ること');
		target.dispatchEvent({
			type: 'hoge'
		});
		strictEqual(result, 'hoge', 'dispatchEventで、addEventListenerで追加したイベントハンドラが動作していること');

		result = '';
		target.removeEventListener('hoge', handler);
		target.dispatchEvent({
			type: 'hoge'
		});
		strictEqual(result, '', 'removeEventListenerで削除した後はイベントハンドラは動作しないこと');
		strictEqual(target.hasEventListener('hoge', handler), false,
				'削除したイベントハンドラについてhasEventListenerはfalseを返すこと');
	});
});
