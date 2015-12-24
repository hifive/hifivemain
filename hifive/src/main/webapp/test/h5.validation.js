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
		var future = new Date(currentTime + 100);
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
		var future = new Date(currentTime + 100);
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
	test('ValidationResultの中身', function() {
		var validator = this.validator;
		var obj = {
			p2: 1,
			p3: 1
		};
		validator.addRule({
			p1: {
				required: true,
				min: 0,
				max: [1.1, true],
				digits: [1, 1]
			},
			p2: {
				required: true,
				min: 0
			},
			p3: {
				required: true,
				min: 0
			},
			p4: {
				required: true,
				min: 0
			},
			p5: {
				required: true,
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

	// TODO 非同期バリデートのテスト

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
			this.validator = h5.core.logic(h5.validation.FormValidationLogic);
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
				required: true,
			},
			q2: {
				required: true
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
