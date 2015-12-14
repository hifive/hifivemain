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

	var vf = h5.validation.rule;

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

	module('validation.rule');

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
		strictEqual(vf.digits(10.123, 2), true, '引数: 10.123, 2, undefined 結果: true');
		strictEqual(vf.digits(100.12, null, 2), true, '引数: 100.12, null, 2 結果: true');
		strictEqual(vf.digits(10.12, 2, 2), true, '引数: 10.12, 2, 2 結果: true');
		strictEqual(vf.digits(10.12, 2, 1), false, '引数: 10.12, 2, 1 結果: false');
		strictEqual(vf.digits(10.12, 1, 2), false, '引数: 10.12, 1, 2 結果: false');
		strictEqual(vf.digits(100, 2), false, '引数: 100, 2, undefined 結果: false');
		strictEqual(vf.digits(10.123, null, 2), false, '引数: 10.123, null, 2 結果: false');
		strictEqual(vf.digits(parseFloat('1.1e+50'), 51, 0), true,
				'引数: \'1.1e+50\', 51, 0 結果: true');
		strictEqual(vf.digits(parseFloat('1.1e+50'), 50, 0), false,
				'引数: \'1.1e+50\', 50, 0 結果: false');
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

	test('assertNull', function() {
		strictEqual(vf.assertNull(null), true, '引数: null 結果: true');
		strictEqual(vf.assertNull(undefined), true, '引数: undefined 結果: true');
		strictEqual(vf.assertNull(false), false, '引数: false 結果: false');
		strictEqual(vf.assertNull(true), false, '引数: true 結果: false');
		strictEqual(vf.assertNull(0), false, '引数: 0 結果: false');
	});

	test('assertNotNull', function() {
		strictEqual(vf.assertNotNull(null), false, '引数: null 結果: false');
		strictEqual(vf.assertNotNull(undefined), true, '引数: undefined 結果: true');
		strictEqual(vf.assertNotNull(false), true, '引数: false 結果: true');
		strictEqual(vf.assertNotNull(true), true, '引数: true 結果: true');
		strictEqual(vf.assertNotNull(0), true, '引数: 0 結果: true');
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
		strictEqual(vf.size(ary, null, 3), true, '引数: [0, 1, 2], null, 3 結果: true');
		strictEqual(vf.size(ary, 3, 3), true, '引数: [0, 1, 2], 3, 3 結果: true');
		strictEqual(vf.size(ary, 0, 2), false, '引数: [0, 1, 2], 0, 2 結果: false');
		strictEqual(vf.size(ary, 4, 5), false, '引数: [0, 1, 2], 4, 5 結果: false');
		strictEqual(vf.size(ary, 4), false, '引数: [0, 1, 2], 4 結果: false');
		strictEqual(vf.size(ary, null, 2), false, '引数: [0, 1, 2], null, 2 結果: false');

		var str = '123';
		strictEqual(vf.size(str, 3), true, '引数: \'123\', 3 結果: true');
		strictEqual(vf.size(str, null, 3), true, '引数: \'123\', null, 3 結果: true');
		strictEqual(vf.size(str, 3, 3), true, '引数: \'123\', 3, 3 結果: true');
		strictEqual(vf.size(str, 0, 2), false, '引数: \'123\', 0, 2 結果: false');
		strictEqual(vf.size(str, 4, 5), false, '引数: \'123\', 4, 5 結果: false');
		strictEqual(vf.size(str, 4), false, '引数: \'123\', 4 結果: false');
		strictEqual(vf.size(str, null, 2), false, '引数: \'123\', null, 2 結果: false');

		var obj = {
			a: 1,
			b: 2,
			c: 3
		};
		strictEqual(vf.size(obj, 3), true, '引数: {a:1,b:2,c:3}, 3 結果: true');
		strictEqual(vf.size(obj, 3, 3), true, '引数: {a:1,b:2,c:3}, 3, 3 結果: true');
		strictEqual(vf.size(obj, 0, 2), false, '引数: {a:1,b:2,c:3}, 0, 2 結果: false');
		strictEqual(vf.size(obj, 4, 5), false, '引数: {a:1,b:2,c:3}, 4, 5 結果: false');
		strictEqual(vf.size(obj, 4), false, '引数: {a:1,b:2,c:3}, 4 結果: false');
		strictEqual(vf.size(obj, null, 2), false, '引数:{a:1,b:2,c:3}, null, 2 結果: false');

		strictEqual(vf.size(window, 0, Infinity), false, '引数: window, 0, Infinity 結果: false');

		strictEqual(vf.size(1, 0, 1), false, '引数: 1, 0, 1 結果: false');
	});

	//=============================
	// Definition
	//=============================
	module('validator.validate', {
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

	test('require', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				require: true
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
		strictEqual(validator.validate({}).isValid, false,
				'require指定されているプロパティが定義されていないオブジェクトはinvalid');
	});

	test('assertFalse',
			function() {
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
				strictEqual(validator.validate({}).isValid, true,
						'assertFalse指定されているプロパティがないオブジェクトはvalid');
				strictEqual(validator.validate({
					p1: null
				}).isValid, true, 'nullならvalid');
				strictEqual(validator.validate({
					p1: undefined
				}).isValid, true, 'undefinedならvalid');
			});

	test('assertTrue', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				assertTrue: true
			}
		});
		strictEqual(validator.validate({
			p1: true
		}).isValid, true, 'assertTrue指定されているプロパティの値がtrueであるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: false
		}).isValid, false, 'assertTrue指定されているプロパティの値がfalseであるオブジェクトはinvalid');
		strictEqual(validator.validate({}).isValid, true, 'assertTrue指定されているプロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullならvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('max', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				max: 10
			}
		});
		strictEqual(validator.validate({
			p1: 9
		}).isValid, true, 'max:10指定されているプロパティの値が9であるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: 10
		}).isValid, false, 'max:10指定されているプロパティの値が10であるオブジェクトはinvalid');

		validator.addRule({
			p1: {
				max: [10, true]
			}
		});
		strictEqual(validator.validate({
			p1: 9
		}).isValid, true, 'max:[10,true]指定されているプロパティの値が9であるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: 10
		}).isValid, true, 'max:[10,true]指定されているプロパティの値が10であるオブジェクトはvalid');
		strictEqual(validator.validate({}).isValid, true, 'max指定されているプロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullならvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('min', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				min: 0
			}
		});
		strictEqual(validator.validate({
			p1: 1
		}).isValid, true, 'min:0指定されているプロパティの値が1であるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: 0
		}).isValid, false, 'min:0指定されているプロパティの値が0であるオブジェクトはinvalid');

		validator.addRule({
			p1: {
				min: [0, true]
			}
		});
		strictEqual(validator.validate({
			p1: 1
		}).isValid, true, 'min:[0,true]指定されているプロパティの値が1であるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: 0
		}).isValid, true, 'min:[0,true]指定されているプロパティの値が1であるオブジェクトはvalid');
		strictEqual(validator.validate({}).isValid, true, 'min指定されているプロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullならvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('digits', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				digits: 2
			}
		});
		strictEqual(validator.validate({
			p1: 99.9
		}).isValid, true, 'digits:2指定されているプロパティの値が99.9であるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: 100
		}).isValid, false, 'digits:2指定されているプロパティの値が100であるオブジェクトはinvalid');

		validator.addRule({
			p1: {
				digits: [2, 1]
			}
		});
		strictEqual(validator.validate({
			p1: 99.9
		}).isValid, true, 'digits:[2,1]指定されているプロパティの値が99.9であるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: 100
		}).isValid, false, 'digits:[2,1]指定されているプロパティの値が100であるオブジェクトはinvalid');
		strictEqual(validator.validate({
			p1: 99.99
		}).isValid, false, 'digits:[2,1]指定されているプロパティの値が99.99であるオブジェクトはinvalid');
		strictEqual(validator.validate({}).isValid, true, 'digits指定されているプロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullならvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('future', function() {
		var validator = this.validator;
		var current = new Date();
		var currentTime = current.getTime();
		var future = new Date(currentTime + 100);
		var past = new Date(currentTime - 1);
		validator.addRule({
			p1: {
				future: true
			}
		});
		strictEqual(validator.validate({
			p1: future
		}).isValid, true, 'future指定されているプロパティの値が現在時刻より未来のDate型であるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: past
		}).isValid, false, 'future指定されているプロパティの値が現在時刻より過去のDate型であるオブジェクトはinvalid');
		strictEqual(validator.validate({
			p1: current
		}).isValid, false, 'future指定されているプロパティの値が現在時刻のDate型であるオブジェクトはinvalid');
		strictEqual(validator.validate({}).isValid, true, 'future指定されているプロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullならvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('past', function() {
		var validator = this.validator;
		var current = new Date();
		var currentTime = current.getTime();
		var future = new Date(currentTime + 100);
		var past = new Date(currentTime - 1);
		validator.addRule({
			p1: {
				past: true
			}
		});
		strictEqual(validator.validate({
			p1: past
		}).isValid, true, 'past指定されているプロパティの値が現在時刻より過去のDate型であるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: future
		}).isValid, false, 'past指定されているプロパティの値が現在時刻より未来のDate型であるオブジェクトはinvalid');
		strictEqual(validator.validate({}).isValid, true, 'past指定されているプロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullならvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('assertNull', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				assertNull: true
			}
		});
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'assertNull指定されているプロパティの値がnullであるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: ''
		}).isValid, false, 'assertNull指定されているプロパティの値が空文字であるオブジェクトはinvalid');
		strictEqual(validator.validate({}).isValid, true, 'assertNull指定されているプロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('assertNotNull', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				assertNotNull: true
			}
		});
		strictEqual(validator.validate({
			p1: ''
		}).isValid, true, 'assertNotNull指定されているプロパティの値が空文字であるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, false, 'assertNotNull指定されているプロパティの値がnullであるオブジェクトはinvalid');
		strictEqual(validator.validate({}).isValid, true, 'assertNotNull指定されているプロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('pattern', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				pattern: /a/
			}
		});
		strictEqual(validator.validate({
			p1: 'ab'
		}).isValid, true, 'pattern:/a/指定されているプロパティの値が\'ab\'であるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: 'bc'
		}).isValid, false, 'pattern:/a/指定されているプロパティの値\'bc\'であるオブジェクトはinvalid');
		strictEqual(validator.validate({}).isValid, true, 'pattern指定されているプロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullならvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('size', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				size: [3, 3]
			}
		});
		strictEqual(validator.validate({
			p1: 'abc'
		}).isValid, true, 'size:[3,3]指定されているプロパティの値が\'abc\'であるオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: 'abcd'
		}).isValid, false, 'size:[3,3]指定されているプロパティの値\'abcd\'であるオブジェクトはinvalid');
		strictEqual(validator.validate({}).isValid, true, 'size指定されているプロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullならvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('複数ルールの指定', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				assertNotNull: true,
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
		}).isValid, false, 'assertNotNullを満たさないのでfalse');
		strictEqual(validator.validate({
			p1: 1.01
		}).isValid, false, 'digitsを満たさないのでfalse');
		strictEqual(validator.validate({
			p1: -1
		}).isValid, false, 'minを満たさないのでfalse');
		strictEqual(validator.validate({
			p1: 2
		}).isValid, false, 'maxを満たさないのでfalse');
	});

	//=============================
	// Definition
	//=============================
	module('ValidationResult', {
		setup: function() {
			this.validator = h5.validation.createValidator();
		}
	});

	//=============================
	// Body
	//=============================
	test('ValidationResultの中身', function() {
		var validator = this.validator;
		var obj = {
			p2: 1,
			p3: 1
		};
		validator.addRule({
			p1: {
				require: true,
				min: 0,
				max: [1.1, true],
				digits: [1, 1]
			},
			p2: {
				require: true,
				min: 0
			},
			p3: {
				require: true,
				min: 0
			},
			p4: {
				require: true,
				min: 0
			},
			p5: {
				require: true,
				min: 0
			}
		});

		var result = validator.validate(obj);
		var invalidProperties = result.invalidProperties.sort();
		var validProperties = result.validProperties.sort();
		deepEqual(validProperties, ['p2', 'p3'], 'validPropertiesはinvalidなプロパティの配列');
		strictEqual(result.validCount, 2, 'validCountはvalidだったプロパティの総数');
		deepEqual(invalidProperties, ['p1', 'p4', 'p5'], 'invalidPropertiesはinvalidなプロパティの配列');
		strictEqual(result.invalidCount, 3, 'invalidCountはinvalidだったプロパティの総数');
		strictEqual(result.isValid, false, 'isValidは全てのプロパティがvalidだったかどうか');

		validator.addRule({
			p1: null,
			p2: null,
			p3: null,
			p4: null,
			p5: null
		});
		result = validator.validate(obj);
		var invalidProperties = result.invalidProperties.sort();
		var validProperties = result.validProperties.sort();
		deepEqual(validProperties, ['p1', 'p2', 'p3', 'p4', 'p5'],
				'validPropertiesはinvalidなプロパティの配列');
		strictEqual(result.validCount, 5, 'validCountはvalidだったプロパティの総数');
		deepEqual(invalidProperties, [], 'invalidPropertiesはinvalidなプロパティの配列');
		strictEqual(result.invalidCount, 0, 'invalidCountはinvalidだったプロパティの総数');
		strictEqual(result.isValid, true, 'isValidは全てのプロパティがvalidだったかどうか');
	});

	//=============================
	// Definition
	//=============================
	module('ルールの追加と削除', {
		setup: function() {
			this.validator = h5.validation.createValidator();
		}
	});

	//=============================
	// Body
	//=============================
	test('addRuleでルールの上書き', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				assertNotNull: true,
				min: 0,
				max: [1.1, true],
				digits: [1, 1]
			},
			p2: {
				min: 0
			},
			p4: {
				min: 0
			}
		});
		validator.addRule({
			p1: {
				min: 10,
			},
			p3: {
				min: 0
			},
			p4: null
		});
		strictEqual(validator.validate({
			p1: 1
		}).isValid, false, '既存のプロパティについてルールが上書かれていること');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, '既存のプロパティについてルールが上書かれていること');
		strictEqual(validator.validate({
			p2: -1
		}).isValid, false, '上書かれていないプロパティは前のルールが適用されていること');
		strictEqual(validator.validate({
			p3: -1
		}).isValid, false, '新しく追加したプロパティのルールが適用されていること');
		strictEqual(validator.validate({
			p4: -1
		}).isValid, true, 'nullで上書けること');
	});

	test('removeRule', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				min: 0
			},
			p2: {
				min: 0
			},
			p3: {
				min: 0
			}
		});
		validator.removeRule('p1');
		strictEqual(validator.validate({
			p1: -1
		}).isValid, true, '指定したキーのルールが削除されていること');
		strictEqual(validator.validate({
			p2: -1
		}).isValid, false, '指定していないキーのルールは削除されていないこと');
		validator.removeRule(['p2', 'p3']);
		strictEqual(validator.validate({
			p2: -1
		}).isValid, true, 'removeRuleにキーを配列で複数指定した時、複数プロパティのルールを削除できること');
		strictEqual(validator.validate({
			p3: -1
		}).isValid, true, 'removeRuleにキーを配列で複数指定した時、複数プロパティのルールを削除できること');
	});
	//=============================
	// Definition
	//=============================
	module('ルールの無効化と有効化', {
		setup: function() {
			this.validator = h5.validation.createValidator();
		}
	});

	//=============================
	// Body
	//=============================
	test('disableRuleで無効にするプロパティの指定', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				min: 0,
			},
			p2: {
				min: 0
			}
		});
		validator.disableRule('p1');
		ok(validator.validate({
			p1: -1
		}).isValid, '指定したプロパティのバリデートが無効になっていること');
		ok(!validator.validate({
			p2: -1
		}).isValid, '指定したプロパティ以外のバリデートは有効であること');
		validator.disableRule('p2');
		ok(validator.validate({
			p2: -1
		}).isValid, '無効化するプロパティを追加設定できること');

		validator.addRule({
			q1: {
				require: true,
			},
			q2: {
				require: true
			}
		});
		validator.disableRule(['q1', 'q2']);
		ok(validator.validate({}).isValid, '配列で無効化するプロパティを複数指定できること');
	});

	test('enableRule', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				min: 0
			},
			p2: {
				min: 0
			},
			p3: {
				min: 0
			}
		});
		validator.disableRule(['p1', 'p2', 'p3']);
		validator.enableRule('p1');
		ok(!validator.validate({
			p1: -1
		}).isValid, '指定したプロパティのバリデートが有効になっていること');
		validator.enableRule(['p2', 'p3']);
		deepEqual(validator.validate({
			p1: -1,
			p2: -1,
			p3: -1
		}).invalidProperties.sort(), ['p1', 'p2', 'p3'], '配列で複数指定したプロパティのバリデートが有効になっていること');
	});

	//=============================
	// Definition
	//=============================
	module('ルールの定義', {
		setup: function() {
			this.validator = h5.validation.createValidator();
		}
	});

	//=============================
	// Body
	//=============================
});
