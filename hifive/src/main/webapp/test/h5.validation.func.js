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

	// TODO テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.env;

	var vf = h5.validation.func;

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

	module("validation.func");

	//=============================
	// Body
	//=============================

	test('assertFalse', function() {
		strictEqual(vf.assertFalse(null), true, '引数: null 結果: true');
		strictEqual(vf.assertFalse(undefined), true, '引数: undefined 結果: true');
		strictEqual(vf.assertFalse(false), true, '引数: false 結果: true');
		strictEqual(vf.assertFalse(new Boolean(false)), true, '引数: false) 結果: true');
		strictEqual(vf.assertFalse(true), false, '引数: true 結果: false');
		strictEqual(vf.assertFalse(new Boolean(true)), false, '引数: true) 結果: false');
		strictEqual(vf.assertFalse(0), false, '引数: 0 結果: false');
		strictEqual(vf.assertFalse(1), false, '引数: 1 結果: false');
	});

	test('assertTrue', function() {
		strictEqual(vf.assertTrue(null), true, '引数: null 結果: true');
		strictEqual(vf.assertFalse(undefined), true, '引数: undefined 結果: true');
		strictEqual(vf.assertTrue(true), true, '引数: true 結果: true');
		strictEqual(vf.assertTrue(new Boolean(true)), true, '引数: true) 結果: true');
		strictEqual(vf.assertTrue(false), false, '引数: false 結果: false');
		strictEqual(vf.assertTrue(new Boolean(false)), false, '引数: false) 結果: false');
		strictEqual(vf.assertTrue(0), false, '引数: 0 結果: false');
		strictEqual(vf.assertTrue(1), false, '引数: 1 結果: false');
	});

	test('max', function() {
		strictEqual(vf.max(null), true, '引数: null 結果: true');
		strictEqual(vf.max(undefined), true, '引数: undefined 結果: true');
		strictEqual(vf.max(10, 11), true, '引数: 10, 11 結果: true');
		strictEqual(vf.max(10.8, 10.9), true, '引数: 10.8, 10.9 結果: true');
		strictEqual(vf.max(-2, -1), true, '引数: -2, -1 結果: true');
		strictEqual(vf.max(10, 10, true), true, '引数: 10, 10, true 結果: true');
		strictEqual(vf.max(10, 10), false, '引数: 10, 10 結果: false');
		strictEqual(vf.max(10, 9), false, '引数: 10, 9 結果: false');
		strictEqual(vf.max(10.1, 10), false, '引数: 10.1, 10 結果: false');
		strictEqual(vf.max('1', 10), false, '引数: \'1\', 10 結果: false');
	});

	test('min', function() {
		strictEqual(vf.min(null), true, '引数: null 結果: true');
		strictEqual(vf.min(undefined), true, '引数: undefined 結果: true');
		strictEqual(vf.min(10, 9), true, '引数: 10, 9 結果: true');
		strictEqual(vf.min(10.8, 10.7), true, '引数: 10.8, 10.7 結果: true');
		strictEqual(vf.min(-2, -3), true, '引数: -2, -3 結果: true');
		strictEqual(vf.min(10, 10, true), true, '引数: 10, 10, true 結果: true');
		strictEqual(vf.min(10, 10), false, '引数: 10, 10 結果: false');
		strictEqual(vf.min(9, 10), false, '引数: 9, 10 結果: false');
		strictEqual(vf.min(10, 10.1), false, '引数: 10, 10.1 結果: false');
		strictEqual(vf.min('1', 0), false, '引数: \'1\', 0 結果: false');
	});

	test('digits', function() {
		strictEqual(vf.digits(null), true, '引数: null 結果: true');
		strictEqual(vf.digits(undefined), true, '引数: undefined 結果: true');
		strictEqual(vf.digits(10.12, 2, 2), true, '引数: 10.12, 2, 2 結果: true');
		strictEqual(vf.digits(10.12, 2, 1), false, '引数: 10.12, 2, 1 結果: false');
		strictEqual(vf.digits(10.12, 1, 2), false, '引数: 10.12, 1, 2 結果: false');
		strictEqual(vf.digits(parseFloat('1.1e+50'), 51, 0), true,
				'引数: \'1.1e+50\'), 51, 0 結果: true');
		strictEqual(vf.digits(parseFloat('1.1e+50'), 50, 0), false,
				'引数: \'1.1e+50\'), 50, 0 結果: false');
		strictEqual(vf.digits('1', 2, 2), false, '引数: \', 2, 2 結果: false');
	});

	test('future',
			function() {
				strictEqual(vf.future(null), true, '引数: null 結果: true');
				strictEqual(vf.future(undefined), true, '引数: undefined 結果: true');
				strictEqual(vf.future(new Date(new Date().getTime() + 100)), true,
						'引数: ) + 100) 結果: true');
				strictEqual(vf.future(new Date(new Date().getTime())), false, '引数: )) 結果: false');
				strictEqual(vf.future('2099/12/31'), false, '引数: \'2099/12/31\' 結果: false');
				strictEqual(vf.future(new Date().getTime() + 100), false, '引数: ) + 100 結果: false');
			});

	test('past',
			function() {
				strictEqual(vf.past(null), true, '引数: null 結果: true');
				strictEqual(vf.past(undefined), true, '引数: undefined 結果: true');
				strictEqual(vf.past(new Date(new Date().getTime() - 1)), true,
						'引数: ) - 1) 結果: true');
				strictEqual(vf.past(new Date(new Date().getTime() + 100)), false,
						'引数: ) + 100) 結果: false');
				strictEqual(vf.past('2000/12/31'), false, '引数: \'2000/12/31\' 結果: false');
				strictEqual(vf.future(new Date().getTime() - 1), false, '引数: ) - 1 結果: false');
			});

	test('nul', function() {
		strictEqual(vf.nul(null), true, '引数: null 結果: true');
		strictEqual(vf.nul(undefined), true, '引数: undefined 結果: true');
		strictEqual(vf.nul(false), false, '引数: false 結果: false');
		strictEqual(vf.nul(true), false, '引数: true 結果: false');
		strictEqual(vf.nul(0), false, '引数: 0 結果: false');
	});

	test('notNull', function() {
		strictEqual(vf.notNull(null), false, '引数: null 結果: false');
		strictEqual(vf.notNull(undefined), false, '引数: undefined 結果: false');
		strictEqual(vf.notNull(false), true, '引数: false 結果: true');
		strictEqual(vf.notNull(true), true, '引数: true 結果: true');
		strictEqual(vf.notNull(0), true, '引数: 0 結果: true');
	});

	test('pattern', function() {
		strictEqual(vf.pattern(null), true, '引数: null 結果: true');
		strictEqual(vf.pattern(undefined), true, '引数: undefined 結果: true');
		strictEqual(vf.pattern('hoge', /h/), true, '引数: \'hoge\', /h/ 結果: true');
		strictEqual(vf.pattern('hoge', /G/i), true, '引数: \'hoge\', /G/i 結果: true');
		strictEqual(vf.pattern('fuga', /h/), false, '引数: \'fuga\', /h/ 結果: false');
		strictEqual(vf.pattern('hoge', /G/), false, '引数: \'hoge\', /G/ 結果: false');
		strictEqual(vf.pattern(true, /G/), false, '引数: true, /G/ 結果: false');
		strictEqual(vf.pattern(1, /G/), false, '引数: 1, /G/ 結果: false');
	});

	test('size', function() {
		strictEqual(vf.size(null), true, '引数: null 結果: true');
		strictEqual(vf.size(undefined), true, '引数: undefined 結果: true');
		var ary = [0, 1, 2];
		strictEqual(vf.size(ary, 3), true, '引数: [0, 1, 2], 3 結果: true');
		strictEqual(vf.size(ary, 3, 3), true, '引数: [0, 1, 2], 3, 3 結果: true');
		strictEqual(vf.size(ary, 0, 2), false, '引数: [0, 1, 2], 0, 2 結果: false');
		strictEqual(vf.size(ary, 4, 5), false, '引数: [0, 1, 2], 4, 5 結果: false');

		var str = '123';
		strictEqual(vf.size(str, 3), true, '引数: \'123\', 3 結果: true');
		strictEqual(vf.size(str, 3, 3), true, '引数: \'123\', 3, 3 結果: true');
		strictEqual(vf.size(str, 0, 2), false, '引数: \'123\', 0, 2 結果: false');
		strictEqual(vf.size(str, 4, 5), false, '引数: \'123\', 4, 5 結果: false');

		var obj = {
			a: 1,
			b: 2,
			c: 3
		};
		strictEqual(vf.size(obj, 3), true, '引数: {a:1,b:2,c:3}, 3 結果: true');
		strictEqual(vf.size(obj, 3, 3), true, '引数: {a:1,b:2,c:3}, 3, 3 結果: true');
		strictEqual(vf.size(obj, 0, 2), false, '引数: {a:1,b:2,c:3}, 0, 2 結果: false');
		strictEqual(vf.size(obj, 4, 5), false, '引数: {a:1,b:2,c:3}, 4, 5 結果: false');

		strictEqual(vf.size(window, 0, Infinity), false, '引数: window, 0, Infinity 結果: false');

		strictEqual(vf.size(1, 0, 1), false, '引数: 1, 0, 1 結果: false');
	});

	//=============================
	// Definition
	//=============================
	module("validator.validate", {
		setup: function() {
			this.validator = h5.validation.createValidator();
		}
	});

	//=============================
	// Body
	//=============================
	//	test('validateに渡す値がオブジェクトでない場合はエラー', function() {
	//
	//	});

	test('required', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				required: true
			}
		});
		strictEqual(validator.validate({
			p1: false,
			p2: 0
		}).isValid, true, 'require指定されているプロパティの値がfalseであるオブジェクトはvalid');
		strictEqual(validator.validate({
			p2: 0
		}).isValid, false, 'require指定されているプロパティのないオブジェクトはinvalid');
		strictEqual(validator.validate({
			p2: 0
		}).isValid, false, 'require指定されているプロパティの値がnullであるオブジェクトはinvalid');
		strictEqual(validator.validate({
			p2: 0
		}).isValid, false, 'require指定されているプロパティの値がundefinedであるオブジェクトはinvalid');
	});

	test('assertFalse', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				assertFalse: true
			}
		});
		strictEqual(validator.validate({
			p1: false
		}).isValid, true, 'assertFalse指定されているプロパティの値がfalseであるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: true
		}).isValid, false, 'assertFalse指定されているプロパティの値がtrueであるオブジェクトはinvalid');
		strictEqual(validator.validate({
			p2: 0
		}).isValid, true, 'assertFalse指定されているプロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p2: 0
		}).isValid, true, 'assertFalse指定されているプロパティの値がnullであるオブジェクトはvalid');
		strictEqual(validator.validate({
			p2: 0
		}).isValid, true, 'require指定されているプロパティの値がundefinedであるオブジェクトはvalid');
	});

	test('複数ルールの指定', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				notNull: true,
				min: 0,
				max: [1.1, true],
				digits: [1, 1]
			}
		});
		strictEqual(validator.validate({
			p1: 1.1
		}).isValid, true, '全てのルールを満たすのでtrue');
		strictEqual(validator.validate({
			p1: null
		}).isValid, false, 'notNullを満たさないのでfalse');
		strictEqual(validator.validate({
			p1: 1.01
		}).isValid, false, 'digitsを満たさないのでfalse');
		strictEqual(validator.validate({
			p1: -1
		}).isValid, false, 'minを満たさないのでfalse');
		strictEqual(validator.validate({
			p1: 2
		}).isValid, false, 'maxを満たさないのでfalse');

		validator.addRule({
			p1: {
				notNull: true,
				min: 0,
				max: [2.1, true],
				digits: [1, 1]
			},
			p2: {
				min: 0
			}
		});
		strictEqual(validator.validate({
			p1: 2
		}).isValid, true, 'ルール変更した');
		strictEqual(validator.validate({
			p1: null
		}).isValid, false, 'ルール変更した');


		validator.removeRule('p1');
		strictEqual(validator.validate({
			p1: 2
		}).isValid, true, 'p1のルール削除した');
		strictEqual(validator.validate({
			p2: -10
		}).isValid, false, 'p1のルール削除した');
	});

	test('ValidationResultの中身', function() {});
	//=============================
	// Definition
	//=============================
	module("ルールの追加と削除", {
		setup: function() {
			this.validator = h5.validation.createValidator();
		}
	});

	//=============================
	// Body
	//=============================
	//=============================
	// Definition
	//=============================
	module("ルールの定義", {
		setup: function() {
			this.validator = h5.validation.createValidator();
		}
	});

	//=============================
	// Body
	//=============================
});
