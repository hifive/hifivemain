/*
 * Copyright (C) 2015-2016 NS Solutions Corporation
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

	var requiredRule = {
		required: true
	};

	var customAsyncRule = {
		customFunc: function(value) {
			return value.promise();
		}
	};

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
	module('FormValidationLogic バリデーションルール', {
		setup: function() {
			this.validator = h5.core.logic(h5.validation.FormValidationLogic);
		}
	});

	//=============================
	// Body
	//=============================

	test('required', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				required: true
			}
		});
		strictEqual(validator.validate({
			p1: 'a',
			p2: 'a'
		}).isValid, true, '"a"はvalid');
		strictEqual(validator.validate({}).isValid, false, 'プロパティのないオブジェクトはinvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, false, 'nullはinvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, false, 'undefinedはinvalid');
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
		}).isValid, true, 'falseはvalid');
		strictEqual(validator.validate({
			p1: true
		}).isValid, false, 'trueはinvalid');
		strictEqual(validator.validate({}).isValid, true, 'プロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullはvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedはvalid');
	});

	test('assertTrue', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				assertTrue: true
			}
		});
		strictEqual(validator.validate({
			p1: false
		}).isValid, false, 'falseはinvalid');
		strictEqual(validator.validate({
			p1: true
		}).isValid, true, 'trueはvalid');
		strictEqual(validator.validate({}).isValid, true, 'プロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullはvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedはvalid');
	});

	test('max', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				max: 10
			}
		});
		strictEqual(validator.validate({
			p1: '9'
		}).isValid, true, 'max:10指定 "9"はvalid');
		strictEqual(validator.validate({
			p1: '10'
		}).isValid, false, 'max:10指定 "10"はinvalid');

		validator.addRule({
			p1: {
				max: [10, true]
			}
		});
		strictEqual(validator.validate({
			p1: '10'
		}).isValid, true, 'max:[10,true]指定 "9"はvalid');
		strictEqual(validator.validate({
			p1: '11'
		}).isValid, false, 'max:[10,true]指定 "11"はinvalid');
		strictEqual(validator.validate({}).isValid, true, 'プロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullはinvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedはvalid');
	});

	test('min', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				min: 10
			}
		});
		strictEqual(validator.validate({
			p1: '11'
		}).isValid, true, 'min:10指定 "11"はvalid');
		strictEqual(validator.validate({
			p1: '10'
		}).isValid, false, 'min:10指定 "10"はinvalid');

		validator.addRule({
			p1: {
				min: [10, true]
			}
		});
		strictEqual(validator.validate({
			p1: '10'
		}).isValid, true, 'min:[10,true]指定 "10"はvalid');
		strictEqual(validator.validate({
			p1: '9'
		}).isValid, false, 'min:[10,true]指定 "9"はinvalid');
		strictEqual(validator.validate({}).isValid, true, 'プロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullはvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedはvalid');
	});

	test('digits', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				digits: 2
			}
		});
		strictEqual(validator.validate({
			p1: '99.9'
		}).isValid, true, 'digits:2指定 "99.9"はvalid');
		strictEqual(validator.validate({
			p1: "100"
		}).isValid, false, 'digits:2指定 100はinvalid');

		validator.addRule({
			p1: {
				digits: [2, 1]
			}
		});
		strictEqual(validator.validate({
			p1: "99.9"
		}).isValid, true, 'digits:[2,1]指定 "99.9"はvalid');
		strictEqual(validator.validate({
			p1: "100"
		}).isValid, false, 'digits:[2,1]指定 "100"はinvalid');
		strictEqual(validator.validate({
			p1: "99.99"
		}).isValid, false, 'digits:[2,1]指定 "99.99"はinvalid');
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
		var future = new Date(currentTime + 60000);
		var past = new Date(currentTime - 1);
		validator.addRule({
			p1: {
				future: true
			}
		});
		strictEqual(validator.validate({
			p1: future
		}).isValid, true, '現在時刻より未来のDate型はvalid');
		strictEqual(validator.validate({
			p1: past
		}).isValid, false, '現在時刻より過去のDate型はinvalid');
		strictEqual(validator.validate({
			p1: current
		}).isValid, false, '現在時刻のDate型はinvalid');
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
		var future = new Date(currentTime + 60000);
		var past = new Date(currentTime - 1);
		validator.addRule({
			p1: {
				past: true
			}
		});
		strictEqual(validator.validate({
			p1: past
		}).isValid, true, '現在時刻より過去のDate型はvalid');
		strictEqual(validator.validate({
			p1: future
		}).isValid, false, '現在時刻より未来のDate型はinvalid');
		strictEqual(validator.validate({}).isValid, true, 'プロパティがないオブジェクトはvalid');
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
		}).isValid, true, 'nullはvalid');
		strictEqual(validator.validate({
			p1: ''
		}).isValid, false, '空文字はinvalid');
		strictEqual(validator.validate({}).isValid, true, 'プロパティがないオブジェクトはvalid');
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
		}).isValid, true, '空文字はvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, false, 'nullはinvalid');
		strictEqual(validator.validate({}).isValid, true, 'プロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('pattern', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				pattern: /a.c/
			}
		});
		strictEqual(validator.validate({
			p1: 'abc'
		}).isValid, true, 'pattern:/a.c/指定 "abc"はvalid');
		strictEqual(validator.validate({
			p1: 'bcc'
		}).isValid, false, 'pattern:/a.c/指定 "bcc"はinvalid');
		strictEqual(validator.validate({}).isValid, true, 'プロパティがないオブジェクトはvalid');
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
		}).isValid, true, 'size:[3,3]指定 "abc"はvalid');
		strictEqual(validator.validate({
			p1: 'ab'
		}).isValid, false, 'size:[3,3]指定 "ab"はinvalid');
		strictEqual(validator.validate({
			p1: 'abcd'
		}).isValid, false, 'size:[3,3]指定 "abcd"はinvalid');
		strictEqual(validator.validate({}).isValid, true, 'プロパティがないオブジェクトはvalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, true, 'nullならvalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, true, 'undefinedならvalid');
	});

	test('customFunc(同期)', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				customFunc: function(v) {
					return v === 'v';
				}
			}
		});
		strictEqual(validator.validate({
			p1: 'v'
		}).isValid, true, 'customFunc指定 valid');
		strictEqual(validator.validate({
			p1: 'a'
		}).isValid, false, 'customFunc指定 invalid');
		strictEqual(validator.validate({
			p1: null
		}).isValid, false, 'customFunc指定 invalid');
		strictEqual(validator.validate({
			p1: undefined
		}).isValid, false, 'customFunc指定 valid');
		strictEqual(validator.validate({}).isValid, true, 'プロパティがないオブジェクトはvalid');
	});

	asyncTest('customFunc(非同期)', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				customFunc: function(v) {
					var dfd = $.Deferred();
					var promise = dfd.promise();
					setTimeout(function() {
						if (v === 'v') {
							dfd.resolve();
						} else {
							dfd.reject();
						}
					}, 0);
					return promise;
				}
			},
			p2: {
				customFunc: function(v) {
					var dfd = $.Deferred();
					return v === 'v' ? dfd.resolve().promise() : dfd.reject().promise();
				}
			}
		});
		var testObjects = [{
			obj: {
				p1: 'v'
			},
			isValidExpect: true
		}, {
			obj: {
				p1: 'a'
			},
			isValidExpect: false
		}, {
			obj: {
				p1: null
			},
			isValidExpect: false
		}, {
			obj: {
				p1: undefined
			},
			isValidExpect: false
		}];
		var validateTests = [];
		var currentIndex = 0;
		for (var i = 0, l = testObjects.length; i < l; i++) {
			validateTests.push(function() {
				var obj = testObjects[currentIndex].obj;
				var expect = testObjects[currentIndex].isValidExpect;
				var result = validator.validate(obj);
				result.addEventListener('validate', function(ev) {
					strictEqual(this.isValid, expect, ev.value + 'は' + ev.isValid);
					currentIndex++;
					if (validateTests[currentIndex]) {
						validateTests[currentIndex]();
					} else {
						start();
					}
				});
			});
		}
		strictEqual(validator.validate({}).isValid, true, 'プロパティ無しはtrue');
		strictEqual(validator.validate({
			p2: 'v'
		}).isValid, true, 'customFuncがpromiseを返しても同期でresolveされていたら同期で結果が返ってきて、結果はtrue');
		strictEqual(validator.validate({
			p2: 'a'
		}).isValid, false, 'customFuncがpromiseを返しても同期でrejectされていたら同期で結果が返ってきて、結果はfalse');
		validateTests[0]();
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
			p1: '1.1'
		}).isValid, true, '全てのルールを満たすのでtrue');
		strictEqual(validator.validate({
			p1: null
		}).isValid, false, 'assertNotNullを満たさないのでfalse');
		strictEqual(validator.validate({
			p1: '1.01'
		}).isValid, false, 'digitsを満たさないのでfalse');
		strictEqual(validator.validate({
			p1: '-1'
		}).isValid, false, 'minを満たさないのでfalse');
		strictEqual(validator.validate({
			p1: '2'
		}).isValid, false, 'maxを満たさないのでfalse');
	});

	test('指定したプロパティのみのバリデート', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				required: true
			},
			p2: {
				digits: 1
			},
			p3: {
				max: 2
			}
		});
		var result = validator.validate({
			p2: '1',
			p3: '3'
		}, 'p2');
		strictEqual(result.isValid, true, '指定したプロパティのみバリデートした結果が取得できる');
		deepEqual(result.properties, ['p2'], 'propertiesに指定したプロパティのみ入っている');
		result = validator.validate({
			p2: '1',
			p3: '1'
		}, ['p2', 'p3']);
		strictEqual(result.isValid, true, '指定したプロパティのみバリデートした結果が取得できる');
		deepEqual(result.properties.sort(), ['p2', 'p3'], 'propertiesに指定したプロパティのみ入っている');
	});

	//=============================
	// Definition
	//=============================
	module('ValidationResult', {
		setup: function() {
			this.validator = h5.core.logic(h5.validation.FormValidationLogic);
		}
	});

	//=============================
	// Body
	//=============================
	test('properties',
			function() {
				var validator = this.validator;
				validator.addRule({
					p1: customAsyncRule,
					p2: requiredRule,
					p3: requiredRule
				});
				var dfd1 = h5.async.deferred();
				var result = validator.validate({
					p1: dfd1,
					p2: 1
				});
				deepEqual(result.properties.slice(0).sort(), ['p1', 'p2', 'p3'],
						'全てのバリデート対象のプロパティ名が入っている');
				dfd1.reject();
				deepEqual(result.properties.slice(0).sort(), ['p1', 'p2', 'p3'],
						'非同期バリデートがあってもpropertiesの中身は変わらない');
				var validator = h5.core.logic(h5.validation.FormValidationLogic);
				result = validator.validate({
					p1: dfd1,
					p2: 1
				});
				deepEqual(result.validProperties, [], 'バリデートするプロパティが無い場合ropertiesは空配列');
			});


	test('validPropertiesとvalidCount', function() {
		var validator = this.validator;
		validator.addRule({
			p1: requiredRule,
			p2: requiredRule,
			p3: requiredRule,
			p4: requiredRule,
			p5: requiredRule
		});
		var result = validator.validate({
			p1: 1,
			p3: 1
		});
		strictEqual(result.validCount, 2, 'validCountにはvalidなプロパティの数が入っている');
		deepEqual(result.validProperties.splice(0).sort(), ['p1', 'p3'],
				'validPropertiesはvalidなプロパティの配列である');
	});

	test('invalidPropertiesとinvalidCount', function() {
		var validator = this.validator;
		validator.addRule({
			p1: requiredRule,
			p2: requiredRule,
			p3: requiredRule,
			p4: requiredRule,
			p5: requiredRule
		});
		var result = validator.validate({
			p1: 1,
			p3: 1
		});
		strictEqual(result.invalidCount, 3, 'invalidCountにはinvalidなプロパティの数が入っている');
		deepEqual(result.invalidProperties.splice(0).sort(), ['p2', 'p4', 'p5'],
				'invalidPropertiesはinvalidなプロパティの配列');
	});

	test('validatingProperties', function() {
		var validator = this.validator;
		validator.addRule({
			p1: customAsyncRule,
			p2: customAsyncRule,
			p3: customAsyncRule
		});
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		var dfd3 = h5.async.deferred();
		dfd2.resolve();
		var result = validator.validate({
			p1: dfd1,
			p2: dfd2,
			p3: dfd3
		});
		deepEqual(result.validatingProperties.slice(0).sort(), ['p1', 'p3'],
				'バリデート結果待ちプロパティのみが格納されていること');
		dfd1.reject();
		deepEqual(result.validatingProperties, ['p3'], 'バリデート結果待ちプロパティのみが格納されていること');
		dfd3.resolve();
		deepEqual(result.validatingProperties, [], '全てのバリデートが終わったら空配列になること');
	});

	test('isAsync', function() {
		var validator = this.validator;
		validator.addRule({
			p1: requiredRule,
		});

		var result = validator.validate({});
		strictEqual(result.isAsync, false, '同期バリデートの場合はisAsyncはfalse');

		customAsyncRule.max = 1;
		validator.addRule({
			p1: requiredRule,
			p2: customAsyncRule
		});
		var dfd1 = h5.async.deferred();
		result = validator.validate({
			p1: 1,
			p2: dfd1
		});
		strictEqual(result.isAsync, true, '非同期でバリデートするルールが１つでもあればisAsyncはtrue');

		var dfd2 = h5.async.deferred();
		dfd2.resolve();
		result = validator.validate({
			p1: 1,
			p2: dfd2
		});
		strictEqual(result.isAsync, false,
				'バリデートルール関数が既にresolve()している結果確定済みのプロミスを返す場合は同期扱いとなり、isAsyncはfalse');

		var dfd3 = h5.async.deferred();
		dfd3.reject();
		result = validator.validate({
			p1: 1,
			p2: dfd3
		});
		strictEqual(result.isAsync, false,
				'バリデートルール関数が既にreject()している結果確定済みのプロミスを返す場合は同期扱いとなり、isAsyncはfalse');
	});

	test('isValidとisAllValid(同期バリデート)', function() {
		var validator = this.validator;
		validator.addRule({
			p1: requiredRule,
			p2: requiredRule
		});
		var result = validator.validate({
			p1: 1
		});
		strictEqual(result.isValid, false, '一つでもinvalidなプロパティがあればisValidはfalse');
		strictEqual(result.isAllValid, false, '一つでもinvalidなプロパティがあればisAllValidはfalse');

		result = validator.validate({
			p1: 1,
			p2: 1
		});
		strictEqual(result.isValid, true, '全てのプロパティがvalidであればisValidはtrue');
		strictEqual(result.isAllValid, true, '全てのプロパティがvalidであればisAllValidはtrue');
	});

	test('isValidとisAllValid(非同期バリデート)', function() {
		var validator = this.validator;
		validator.addRule({
			p1: customAsyncRule,
			p2: customAsyncRule
		});

		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		var result = validator.validate({
			p1: dfd1,
			p2: dfd2
		});

		strictEqual(result.isValid, true, '全てのプロパティについてまだ結果が出ていない時、isValidはtrue');
		strictEqual(result.isAllValid, null, '全てのプロパティについてまだ結果が出ていない時、isAllValidはnull');
		dfd1.reject();
		strictEqual(result.isValid, false, '非同期バリデート中のプロパティの１つがinvalidになった時、isValidはfalse');
		strictEqual(result.isAllValid, false, '非同期バリデート中のプロパティの１つがinvalidになった時、isAllValidはfalse');
		dfd1.resolve();
		strictEqual(result.isValid, false,
				'既にisValidがfalseの場合、非同期バリデート中のプロパティがvalidになってもisValidはfalse');
		strictEqual(result.isValid, false,
				'既にisValidがfalseの場合、非同期バリデート中のプロパティがvalidになってもisAllValidはfalse');

		var dfd3 = h5.async.deferred();
		var dfd4 = h5.async.deferred();
		result = validator.validate({
			p1: dfd3,
			p2: dfd4
		});
		strictEqual(result.isValid, true, '全てのプロパティについてまだ結果が出ていない時、isValidはtrue');
		strictEqual(result.isAllValid, null, '全てのプロパティについてまだ結果が出ていない時、isAllValidはnull');
		dfd3.resolve();
		strictEqual(result.isValid, true,
				'まだバリデート未完了のプロパティがあってもバリデート完了しているプロパティが全てvalidなら、isValidはtrue');
		strictEqual(result.isAllValid, null,
				'まだバリデート未完了のプロパティがある場合、完了済みのプロパティが全てvalidであってもisAllValidはnull');
		dfd4.resolve();
		strictEqual(result.isValid, true, '全ての非同期バリデートがvalidで終了した時、isValidはtrue');
		strictEqual(result.isAllValid, true, '全ての非同期バリデートがvalidで終了した時、isAllValidはtrue');
	});

	//=============================
	// Definition
	//=============================
	module('ValidationResult invalidReason', {
		setup: function() {
			this.validator = h5.core.logic(h5.validation.FormValidationLogic);
		}
	});

	//=============================
	// Body
	//=============================
	test('バリデート違反のプロパティについてのみ対応する違反オブジェクトが格納されていること', function() {
		var validator = this.validator;
		var maxRule = {
			max: 1
		};
		validator.addRule({
			p1: maxRule,
			p2: maxRule,
			p3: maxRule,
			p4: maxRule,
			p5: maxRule
		});
		var result = validator.validate({
			p1: 1,
			p2: 0,
			p3: 0,
			p4: 1,
			p5: 1
		});
		var invalidReason = result.invalidReason;
		ok(invalidReason, 'invalidReasonが取れること');
		ok(invalidReason.p1, '失敗しているプロパティのinvalidReasonが取れる');
		ok(invalidReason.p4, '失敗しているプロパティのinvalidReasonが取れる');
		ok(invalidReason.p5, '失敗しているプロパティのinvalidReasonが取れる');
		ok(!invalidReason.p2, '成功しているプロパティのinvalidReasonはない');
		ok(!invalidReason.p3, '成功しているプロパティのinvalidReasonはない');
	});

	test('違反オブジェクトの中身', function() {
		var validator = this.validator;
		validator.addRule({
			p1: {
				required: true,
				min: 0,
				max: [1.1, true],
				digits: [1, 2]
			}
		});
		var result = validator.validate({
			p1: '1000'
		});

		var invalidReason = result.invalidReason;
		strictEqual(invalidReason.p1.name, 'p1', 'nameはプロパティ名');
		strictEqual(invalidReason.p1.value, '1000', 'valueはバリデート対象の値');
		var violation = invalidReason.p1.violation;
		ok(violation, 'invalidReasonのviolationが取れる');
		strictEqual(violation.length, 2, '違反したルールの数だけviolationがある');
		var maxViolation = violation[0].ruleName === 'max' ? violation[0] : violation[1];
		strictEqual(maxViolation.ruleName, 'max', 'violationのruleNameには違反したルール名が入っている');
		strictEqual(maxViolation.ruleValue.max, 1.1, 'violationのruleValueで指定した引数が取得できる');
		strictEqual(maxViolation.ruleValue.inclusive, true, 'violationのruleValueで指定した引数が取得できる');
		var digitsViolation = violation[0] == maxViolation ? violation[1] : violation[0];
		strictEqual(digitsViolation.ruleName, 'digits', 'violationのruleNameには違反したルール名が入っている');
		strictEqual(digitsViolation.ruleValue.integer, 1, 'violationのruleValueで指定した引数が取得できる');
		strictEqual(digitsViolation.ruleValue.fruction, 2, 'violationのruleValueで指定した引数が取得できる');
	});


	test('非同期バリデート失敗時の違反オブジェクトのreason', function() {
		var validator = this.validator;
		validator.addRule({
			p1: customAsyncRule
		});
		var dfd = h5.async.deferred();
		var result = validator.validate({
			p1: dfd
		});
		var reason1 = {};
		var reason2 = {};
		dfd.reject(reason1, reason2);
		var violation = result.invalidReason.p1.violation[0]
		strictEqual(violation && violation.ruleName, 'customFunc', 'customFuncのviolationが取得できる');
		ok(violation.reason, 'reasonプロパティが取得できる');
		strictEqual(violation.reason[0], reason1, 'reasonにrejectで渡した第1引数が入っている');
		strictEqual(violation.reason[1], reason2, 'reasonにrejectで渡した第2引数が入っている');
	});

	//=============================
	// Definition
	//=============================
	module('ValidationResult validateイベント', {
		setup: function() {
			this.validator = h5.core.logic(h5.validation.FormValidationLogic);
		}
	});

	//=============================
	// Body
	//=============================
	test('非同期バリデートが１つ完了するタイミングでvalidateイベントが上がること',
			function() {
				var validator = this.validator;
				validator.addRule({
					p1: customAsyncRule,
					p2: customAsyncRule,
					p3: customAsyncRule
				});
				var dfd1 = h5.async.deferred();
				var dfd2 = h5.async.deferred();
				var dfd3 = h5.async.deferred();
				var result = validator.validate({
					p1: dfd1,
					p2: dfd2,
					p3: dfd3
				});
				var validateEventObjects = [];
				result.addEventListener('validate', function(ev) {
					validateEventObjects.push(ev);
				});
				dfd1.resolve();
				strictEqual(validateEventObjects.length, 1,
						'非同期バリデートがvalidで結果を返したイミングでvalidateイベントハンドラが１度呼ばれる');
				validateEventObjects = [];
				dfd2.reject();
				strictEqual(validateEventObjects.length, 1,
						'非同期バリデートがinvalidで結果を返したイミングでvalidateイベントハンドラが１度呼ばれる');
				validateEventObjects = [];
				dfd3.resolve();
				strictEqual(validateEventObjects.length, 1,
						'最後の非同期バリデートが完了したタイミングでvalidateイベントハンドラが１度呼ばれる');
			});

	test('validateイベントハンドラの引数とthis(成功時)', function() {
		var validator = this.validator;
		validator.addRule({
			p1: customAsyncRule
		});
		var dfd1 = h5.async.deferred();
		var result = validator.validate({
			p1: dfd1
		});
		result.addEventListener('validate',
				function(ev) {
					strictEqual(this, result, 'イベントハンドラのthisはValidationResult');
					strictEqual(ev.target, result, 'イベントオブジェクトのtargetはValidationResult');
					strictEqual(ev.value, dfd1, 'イベントオブジェクトのvalueから値が取れること');
					strictEqual(ev.isValid, true, 'イベントオブジェクトのisValidはtrue');
					strictEqual(ev.violation, undefined, 'イベントオブジェクトのviolationはundefined');

					strictEqual(this.validCount, 1, 'validateイベントハンドラの時点でvalidCountが増えている');
					strictEqual(this.validProperties[0], 'p1',
							'validateイベントハンドラの時点でvalidPropertiesが増えている');
					deepEqual(this.validatingProperties, [],
							'validateイベントハンドラの時点でvalidatingPropeertiesが減っている');
					deepEqual(this.invalidProperties, [], 'invalidPropertiesには格納されない');
					deepEqual(this.invalidCount, 0, 'invalidCountは増えない');
				});
		dfd1.resolve();
	});

	test('validateイベントハンドラの引数とthis(失敗時)', function() {
		var validator = this.validator;
		validator.addRule({
			p1: customAsyncRule
		});
		var dfd1 = h5.async.deferred();
		var result = validator.validate({
			p1: dfd1
		});
		result.addEventListener('validate', function(ev) {
			strictEqual(this, result, 'イベントハンドラのthisはValidationResult');
			strictEqual(ev.target, result, 'イベントオブジェクトのtargetはValidationResult');
			strictEqual(ev.value, dfd1, 'イベントオブジェクトのvalueから値が取れること');
			strictEqual(ev.isValid, false, 'イベントオブジェクトのisValidはfalse');
			var violation = ev.violation
			ok(violation, 'イベントオブジェクトのviolationが取得できる');
			strictEqual(violation, this.invalidReason.p1.violation[0],
					'イベントオブジェクトのviolationはValidationResultに格納されているものと同じ');

			strictEqual(this.invalidCount, 1, 'validateイベントハンドラの時点でinvalidCountが増えている');
			strictEqual(this.invalidProperties[0], 'p1',
					'validateイベントハンドラの時点でinvalidPropertiesが増えている');
			deepEqual(this.validatingProperties, [],
					'validateイベントハンドラの時点でvalidatingPropeertiesが減っている');
			deepEqual(this.validProperties, [], 'validPropertiesには格納されない');
			deepEqual(this.validCount, 0, 'validCountは増えない');
		});
		dfd1.reject();
	});

	//=============================
	// Definition
	//=============================
	module('ValidationResult validateCompleteイベント', {
		setup: function() {
			this.validator = h5.core.logic(h5.validation.FormValidationLogic);
		}
	});

	//=============================
	// Body
	//=============================
	test('非同期バリデートが全て完了したタイミングでvalidateCompleteイベントが上がること', function() {
		var validator = this.validator;
		validator.addRule({
			p1: customAsyncRule,
			p2: customAsyncRule,
			p3: customAsyncRule
		});
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		var dfd3 = h5.async.deferred();
		var result = validator.validate({
			p1: dfd1,
			p2: dfd2,
			p3: dfd3
		});
		var validateCompleteEventObjects = [];
		var validateEventObjects = [];
		result.addEventListener('validate', function(ev) {
			validateEventObjects.push(ev);
		});
		result.addEventListener('validateComplete', function(ev) {
			validateCompleteEventObjects.push(ev);
			ok(validateEventObjects.length === 3, 'validateCompleteハンドラはvalidateイベントハンドラの呼び出しより後');
		});
		dfd1.resolve();
		dfd2.resolve();
		strictEqual(validateCompleteEventObjects.length, 0,
				'非同期バリデートがまだ残っている場合、validateCompleteイベントハンドラは呼ばれない');
		dfd3.resolve();
		strictEqual(validateCompleteEventObjects.length, 1,
				'最後の非同期バリデートが完了したタイミングでvalidateCompleteイベントハンドラが１度呼ばれる');
	});

	test('validateCompleteイベントハンドラの引数とthis', function() {
		var validator = this.validator;
		validator.addRule({
			p1: customAsyncRule
		});
		var dfd1 = h5.async.deferred();
		var result = validator.validate({
			p1: dfd1
		});
		result.addEventListener('validateComplete', function(ev) {
			strictEqual(this, result, 'イベントハンドラのthisはValidationResult');
			strictEqual(ev.target, result, 'イベントオブジェクトのtargetはValidationResult');
			console.log(ev);
		});
		dfd1.resolve();
	});

	//=============================
	// Definition
	//=============================
	module('バリデートの中断', {
		setup: function() {
			this.validator = h5.core.logic(h5.validation.FormValidationLogic);
		}
	});

	//=============================
	// Body
	//=============================
	test('Validation.abort()を呼ぶと以降validate,valdiateCompleteイベントはあがらない', function() {
		var validator = this.validator;
		validator.addRule({
			p1: customAsyncRule
		});
		var dfd1 = h5.async.deferred();
		var result = validator.validate({
			p1: dfd1
		});
		var events = [];
		result.addEventListener('validate', function(ev) {
			events.push(ev);
		});
		result.addEventListener('validateComplete', function(ev) {
			events.push(ev);
		});
		result.abort();
		dfd1.resolve();
		deepEqual(events, [], 'abort()を呼ぶとvalidateイベントもvalidateCompleteイベントも上がらない');
	});

	test('abortイベントハンドラが実行されること', function() {
		var validator = this.validator;
		validator.addRule({
			p1: customAsyncRule
		});
		var dfd1 = h5.async.deferred();
		var result = validator.validate({
			p1: dfd1
		});
		var listner1Events = [];
		result.addEventListener('abort', function(ev) {
			listner1Events.push(ev);
		});
		var listner2Events = [];
		result.addEventListener('abort', function(ev) {
			listner2Events.push(ev);
		});
		result.abort();
		strictEqual(listner1Events.length, 1, 'validateを中断するとabortイベントハンドラが動作すること');
		strictEqual(listner2Events.length, 1, 'abortイベントハンドラが複数あっても動作すること');
		result.abort();
		strictEqual(listner1Events.length, 1, 'abort()を2回呼んでもabortイベントハンドラの動作は１度のみ');
	});

	//=============================
	// Definition
	//=============================
	module('ルールの追加と削除', {
		setup: function() {
			this.validator = h5.core.logic(h5.validation.FormValidationLogic);
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

	test('removeRuleでルールの削除', function() {
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
			this.validator = h5.core.logic(h5.validation.FormValidationLogic);
		}
	});

	//=============================
	// Body
	//=============================
	test('disableRuleでルールの無効化', function() {
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
				required: true,
			},
			q2: {
				required: true
			}
		});
		validator.disableRule(['q1', 'q2']);
		ok(validator.validate({}).isValid, '配列で無効化するプロパティを複数指定できること');
	});

	test('enableRuleでルールの有効化', function() {
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
			this.validator = h5.core.logic(h5.validation.FormValidationLogic);
		}
	});

	//=============================
	// Body
	//=============================
	test('独自ルールによるバリデート', function() {
		var validator = this.validator;
		h5.validation.defineRule('hoge', function(v, arg1, arg2) {
			return v === arg1 + arg2;
		}, ['arg1', 'arg2']);

		validator.addRule({
			p1: {
				hoge: [1, 2]
			},
			p2: {
				hoge: ['ho', 'ge']
			}
		});
		strictEqual(validator.validate({
			p1: 3
		}).isValid, true, '独自ルールによるバリデーションができていること');
		strictEqual(validator.validate({
			p1: 4
		}).isValid, false, '独自ルールによるバリデーションができていること');

		strictEqual(validator.validate({
			p2: 'hoge'
		}).isValid, true, '独自ルールによるバリデーションができていること');
		strictEqual(validator.validate({
			p2: 'fuga'
		}).isValid, false, '独自ルールによるバリデーションができていること');
	});

	asyncTest('独自ルールによるバリデート(非同期)', function() {
		var validator = this.validator;
		h5.validation.defineRule('hoge', function(v, arg1, arg2) {
			var isValid = v === arg1 + arg2;
			var dfd = $.Deferred();
			setTimeout(function() {
				if (isValid) {
					dfd.resolve();
				} else {
					dfd.reject();
				}
			}, 0);
			return dfd.promise();
		}, ['arg1', 'arg2']);

		validator.addRule({
			p1: {
				hoge: [1, 2]
			},
			p2: {
				hoge: ['ho', 'ge']
			}
		});
		var testObjects = [{
			obj: {
				p1: 3
			},
			isValidExpect: true
		}, {
			obj: {
				p1: 4
			},
			isValidExpect: false
		}, {
			obj: {
				p2: 'hoge'
			},
			isValidExpect: true
		}, {
			obj: {
				p2: 'fuga'
			},
			isValidExpect: false
		}];
		var validateTests = [];
		var currentIndex = 0;
		for (var i = 0, l = testObjects.length; i < l; i++) {
			validateTests.push(function() {
				var obj = testObjects[currentIndex].obj;
				var expect = testObjects[currentIndex].isValidExpect;
				var result = validator.validate(obj);
				result.addEventListener('validate', function(ev) {
					strictEqual(this.isValid, expect, ev.value + 'は' + ev.isValid);
					currentIndex++;
					if (validateTests[currentIndex]) {
						validateTests[currentIndex]();
					} else {
						start();
					}
				});
			});
		}
		validateTests[0]();
	});
});
