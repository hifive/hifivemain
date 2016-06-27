/*
 * Copyright (C) 2016 NS Solutions Corporation
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
	// testutils
	var clearController = testutils.u.clearController;
	var gate = testutils.async.gate;

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
	module('ルールの追加 addRule()', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input name="a"></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(start);
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('ルールの追加', function() {
		this.formController.addRule({
			a: {
				required: true
			}
		});
		var result = this.formController.validate();
		ok(!result.isValid, 'ルールが追加されること');
	});

	test('ルールの上書き', function() {
		$('input[name="a"]').val(10);
		this.formController.addRule({
			a: {
				size: [0, 100]
			}
		});
		this.formController.addRule({
			a: {
				min: 100
			}
		});
		var result = this.formController.validate();
		ok(!result.isValid, 'ルールが上書きされること');
	});

	test('上書きされていないプロパティは前のルールが適用されていること', function() {
		$('.testForm').append('<input name="b">');
		this.formController.addRule({
			a: {
				required: true
			},
			b: {
				required: true
			}
		});
		this.formController.addRule({
			a: {
				size: [0, 10]
			}
		});
		var result = this.formController.validate();
		ok($.inArray('b', result.invalidProperties) !== -1, '上書きされていないプロパティは前のルールが適用されていること');
	});

	test('nullで上書きできること', function() {
		this.formController.addRule({
			a: {
				required: true
			}
		});
		this.formController.addRule({
			a: null
		});
		var result = this.formController.validate();
		ok(result.isValid, 'nullで上書きできること');
	});

	//=============================
	// Definition
	//=============================
	module('ルールの削除 removeRule()', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input name="a"><input name="b"></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('指定したプロパティのルールが削除されていること', function() {
		this.formController.removeRule('a');
		var result = this.formController.validate();
		ok(result.isValid, '指定したプロパティのルールが削除されていること');
	});

	test('指定していないプロパティのルールが削除されていないこと', function() {
		this.formController.addRule({
			b: {
				required: true
			}
		});
		this.formController.removeRule('a');
		var result = this.formController.validate();
		ok(!result.isValid, '指定していないプロパティのルールが削除されていないこと');
	});

	test('プロパティを配列で複数指定した場合は複数プロパティのルールを削除できること', function() {
		this.formController.addRule({
			b: {
				required: true
			}
		});
		this.formController.removeRule(['a', 'b']);
		var result = this.formController.validate();
		ok(result.isValid, 'プロパティを配列で複数指定した場合は複数プロパティのルールを削除できること');
	});

	//=============================
	// Definition
	//=============================
	module('ルールの無効化 disableRule()', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input name="a"><input name="b"></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					},
					b: {
						required: true
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('指定したプロパティのバリデートが無効になっていること', function() {
		this.formController.disableRule('a');
		var result = this.formController.validate();
		strictEqual(result.invalidCount, 1, '指定したプロパティのバリデートが無効になっていること');

	});

	test('指定したプロパティ以外のバリデートは有効であること', function() {
		this.formController.disableRule('a');
		var result = this.formController.validate();
		ok($.inArray('b', result.invalidProperties) !== -1, '指定したプロパティ以外のバリデートは有効であること');
	});

	test('無効化するプロパティを追加設定できること', function() {
		this.formController.disableRule('a');
		this.formController.validate();
		this.formController.disableRule('b');
		var result = this.formController.validate();
		ok(result.isValid, '無効化するプロパティを追加設定できること');
	});

	test('配列で無効化するプロパティを複数指定できること', function() {
		this.formController.disableRule(['a', 'b']);
		var result = this.formController.validate();
		ok(result.isValid, '配列で無効化するプロパティを複数指定できること');
	});

	//=============================
	// Definition
	//=============================
	module('ルールの有効化 enableRule()', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input name="a"><input name="b"></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					},
					b: {
						required: true
					}
				});
				this.disableRule(['a', 'b']);
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('指定したプロパティのバリデートが有効になっていること', function() {
		this.formController.enableRule('a');
		var result = this.formController.validate();
		ok($.inArray('a', result.invalidProperties) !== -1, '指定したプロパティのバリデートが有効になっていること');
	});

	test('指定したプロパティのバリデートが有効になっていること', function() {
		this.formController.enableRule(['a', 'b']);
		var result = this.formController.validate();
		ok($.inArray('a', result.invalidProperties) !== -1, '指定したプロパティのバリデートが有効になっていること');
		ok($.inArray('b', result.invalidProperties) !== -1, '指定したプロパティのバリデートが有効になっていること');
	});

	//=============================
	// Definition
	//=============================
	module('フォームのクリア clearValue()', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input name="a"><input name="b"></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.$find('input[name="a"]').val('aaaa');
				this.$find('input[name="b"]').val('bbbb');
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('フォーム部品の値がクリアされること', function() {
		this.formController.clearValue();
		strictEqual($('input[name="a"]').val(), '', 'フォーム部品の値がクリアされること');
		strictEqual($('input[name="b"]').val(), '', 'フォーム部品の値がクリアされること');
	});

	test('関連しないフォーム部品の値はクリアされないこと', function() {
		$('#qunit-fixture').append('<form><input name="c" value="cccc"></form>');
		this.formController.clearValue();
		strictEqual($('input[name="c"]').val(), 'cccc', '関連しないフォーム部品の値はクリアされないこと');
	});

	//=============================
	// Definition
	//=============================
	module('バリデート validate()', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input name="a"><input name="b"></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					},
					b: {
						required: true
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('引数なしでフォーム全体のバリデートを行うこと', function() {
		var result = this.formController.validate();
		ok($.inArray('a', result.invalidProperties) !== -1, '引数なしでフォーム全体のバリデートを行うこと');
		ok($.inArray('b', result.invalidProperties) !== -1, '引数なしでフォーム全体のバリデートを行うこと');
	});

	test('引数にプロパティ名を指定した場合は指定した要素のバリデートを行うこと', function() {
		var result = this.formController.validate('a');
		ok($.inArray('a', result.invalidProperties) !== -1, '引数にプロパティ名を指定した場合は指定した要素のバリデートを行うこと');
		strictEqual($.inArray('b', result.invalidProperties), -1,
				'引数にプロパティ名を指定した場合は指定した要素のバリデートを行うこと');
	});

	test('引数にプロパティ名の配列を指定した場合は指定した要素のバリデートを行うこと',
			function() {
				var result = this.formController.validate(['a', 'b']);
				ok($.inArray('a', result.invalidProperties) !== -1,
						'引数にプロパティ名の配列を指定した場合は指定した要素のバリデートを行うこと');
				ok($.inArray('b', result.invalidProperties) !== -1,
						'引数にプロパティ名の配列を指定した場合は指定した要素のバリデートを行うこと');
			});

	test('ValidationResult を取得できること', function() {
		var result = this.formController.validate(['a', 'b']);
		ok(result.hasOwnProperty('isValid'), 'isValidプロパティを持っている');
		ok(result.hasOwnProperty('invalidReason'), 'invalidReasonプロパティを持っている');
		ok(result.hasOwnProperty('validProperties'), 'validPropertiesプロパティを持っている');
		ok(result.hasOwnProperty('validCount'), 'validCountプロパティを持っている');
		ok(result.hasOwnProperty('isAsync'), 'isAsyncプロパティを持っている');
		ok(result.hasOwnProperty('isAllValid'), 'isAllvalidプロパティを持っている');
	});

	//=============================
	// Definition
	//=============================
	module(
			'フォーム部品の値を集約して取得 getValue()',
			{
				setup: function() {
					stop();
					var $fixture = $('#qunit-fixture');
					var html = '<form class="testForm">';
					html += '<input name="a">';
					html += '<input name="b" type="checkbox" checked>';
					html += '<textarea name="c"></textarea>';
					html += '<select name="d"><option selected value="selectA"><option value="selectB"></select>';
					html += '</form>';
					$fixture.append(html);
					$fixture.append('<form><input name="z"></form>');
					this.formController = h5.core.controller('.testForm', h5.ui.FormController);
					this.formController.readyPromise.done(start);
				},
				teardown: function() {
					clearController();
				}
			});

	//=============================
	// Body
	//=============================
	test('第1引数のtargetNamesを指定しない場合はコントローラが管理するフォーム内のフォーム部品の値を集約したオブジェクトを取得できること', function() {
		var result = this.formController.getValue();
		ok(result.hasOwnProperty('a'), 'フォーム部品の値を集約したオブジェクトを取得できること');
		ok(result.hasOwnProperty('b'), 'フォーム部品の値を集約したオブジェクトを取得できること');
		ok(result.hasOwnProperty('c'), 'フォーム部品の値を集約したオブジェクトを取得できること');
		ok(result.hasOwnProperty('d'), 'フォーム部品の値を集約したオブジェクトを取得できること');
		ok(!result.hasOwnProperty('z'), 'コントローラが管理しないフォーム部品の値は集約されないこと');
	});

	test('第1引数にtargetNamesを指定した場合は指定した名前に当てはまるフォーム部品だけが集約対象となること', function() {
		var result = this.formController.getValue('a');
		ok(result.hasOwnProperty('a'), '指定した名前に当てはまるフォーム部品だけが集約対象となること');
		ok(!result.hasOwnProperty('b'), '指定しなかった名前のフォーム部品は集約されないこと');
		ok(!result.hasOwnProperty('c'), '指定しなかった名前のフォーム部品は集約されないこと');
		ok(!result.hasOwnProperty('d'), '指定しなかった名前のフォーム部品は集約されないこと');
	});

	test('取得したオブジェクトのキー名が各部品のname属性値となっていること', function() {
		var result = this.formController.getValue();
		ok(result.hasOwnProperty('a'), 'キー名が各部品のname属性値となっていること');
		ok(result.hasOwnProperty('b'), 'キー名が各部品のname属性値となっていること');
		ok(result.hasOwnProperty('c'), 'キー名が各部品のname属性値となっていること');
		ok(result.hasOwnProperty('d'), 'キー名が各部品のname属性値となっていること');
	});

	//=============================
	// Definition
	//=============================
	module(
			'フォーム部品の値を集約して取得 getValue() グループ指定',
			{
				setup: function() {
					stop();
					var $fixture = $('#qunit-fixture');
					var html = '<form class="testForm">';
					html += '<div  data-h5-input-group-container="testGroup">';
					html += '<input name="a">';
					html += '<input name="b" type="checkbox" checked>';
					html += '</div>';
					html += '<textarea name="c"></textarea>';
					html += '<select name="d"><option selected value="selectA"><option value="selectB"></select>';
					html += '</form>';
					$fixture.append(html);
					$fixture.append('<form><input name="z"></form>');
					this.formController = h5.core.controller('.testForm', h5.ui.FormController);
					this.formController.readyPromise.done(start);
				},
				teardown: function() {
					clearController();
				}
			});

	//=============================
	// Body
	//=============================
	test('グループ指定されている場合はグループ名をキーにグループに属する要素を集約したオブジェクトが取得できること', function() {
		var result = this.formController.getValue();
		ok(result.hasOwnProperty('testGroup'), 'キー名がグループ名になっていること');
		var groupProp = result['testGroup'];
		ok(groupProp.hasOwnProperty('a'), 'グループ名をキーとするオブジェクトはグループに属する要素を集約していること');
		ok(groupProp.hasOwnProperty('b'), 'グループ名をキーとするオブジェクトはグループに属する要素を集約していること');
	});

	//=============================
	// Definitionf
	//=============================
	module(
			'コントローラが管理するフォームに対して値を設定 setValue()',
			{
				setup: function() {
					stop();
					var $fixture = $('#qunit-fixture');
					var html = '<form class="testForm">';
					html += '<input class="p1" name="a">';
					html += '<input class="p2" name="b" type="checkbox">';
					html += '<textarea class="p3" name="c"></textarea>';
					html += '<select class="p4" name="d"><option selected value="selectA"><option value="selectB"></select>';
					html += '<input class="p5" name="e">';
					html += '</form>';
					$fixture.append(html);
					$fixture.append('<form><input name="z"></form>');
					this.formController = h5.core.controller('.testForm', h5.ui.FormController);
					this.formController.readyPromise.done(start);
				},
				teardown: function() {
					clearController();
				}
			});

	//=============================
	// Body
	//=============================
	test('各フォーム部品の名前と値を集約したオブジェクトを引数に渡すと各フォーム部品にセットされること', function() {
		this.formController.setValue({
			a: 'valueA',
			b: 'on',
			c: 'valueC',
			d: 'selectB'
		});
		strictEqual($('.p1').val(), 'valueA', 'フォーム部品に値がセットされること');
		strictEqual($('.p2').prop('checked'), true, 'フォーム部品に値がセットされること');
		strictEqual($('.p3').val(), 'valueC', 'フォーム部品に値がセットされること');
		strictEqual($('.p4').val(), 'selectB', 'フォーム部品に値がセットされること');
		strictEqual($('.p5').val(), '', '指定していないフォーム部品に値はセットされないこと');
	});

	test('boolean型の値でcheckboxの値を設定できること', function() {
		var $p2 = $('.p2');
		this.formController.setValue({
			b: true
		});
		strictEqual($p2.prop('checked'), true, 'checkboxに値がセットされること');

		this.formController.setValue({
			b: false
		});
		strictEqual($p2.prop('checked'), false, 'checkboxに値がセットされること');
	});

	//=============================
	// Definition
	//=============================
	module('バリデート結果出力プラグイン asyncIndicator', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a" value="v">';
			html += '<input class="inputB" name="b"></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
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
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('asyncIndicatorプラグインを有効化できること', function() {
		this.formController.addOutput('asyncIndicator');
		var asyncIndicatorPlugin = this.formController.getOutput('asyncIndicator');
		ok(asyncIndicatorPlugin
				&& asyncIndicatorPlugin.__name === 'h5.ui.validation.AsyncIndicator',
				'asyncIndicatorプラグインが有効化されていること');
	});

	asyncTest('非同期バリデート中の項目にインジケータが表示されること', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('asyncIndicator');
		var result = formCtrl.validate();
		result.addEventListener('validate', function(ev) {
			start();
		});
		strictEqual($('form> .inputA >.h5-indicator').length, 1, '非同期バリデート対象要素にインジケータが表示されること');
	});

	//=============================
	// Definition
	//=============================
	module('asyncIndicatorプラグイン 全体バリデートを行った場合', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a" value="v"></form>';
			$('#qunit-fixture').append(html);
			var that = this;
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addOutput('asyncIndicator');
				this.addRule({
					a: {
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
					}
				});
				that.result = this.validate();
				that.result.addEventListener('validate', function(ev) {
					start();
				});
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('バリデートを行った場合は表示されること', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var result = formCtrl.validate();
		result.addEventListener('validate', function(ev) {
			start();
		});
		strictEqual($('form> .inputA >.h5-indicator').length, 1, '非同期バリデート対象要素にインジケータが表示されること');
	});

	asyncTest('focus時に表示されること', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.inputA > .h5-indicator').length === 1;
			},
			failMsg: 'インジケータが表示されませんでした',
			maxWait: 3000
		}).done(function() {
			strictEqual($('.inputA>.h5-indicator').length, 1, '非同期バリデート対象要素にインジケータが表示されること');
		}).always(start);
	});

	asyncTest('blur時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		$('.inputA').blur();
		gate({
			func: function() {
				return $('.inputA > .h5-indicator').length === 0;
			},
			failMsg: 'インジケータが表示されました',
			maxWait: 3000
		}).done(function() {
			strictEqual($('.inputA>.h5-indicator').length, 0, '非同期バリデート対象要素にインジケータが表示されないこと');
		}).always(start);
	});

	asyncTest('keyup時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		$('.inputA').keyup();
		gate({
			func: function() {
				return $('.inputA > .h5-indicator').length === 1;
			},
			failMsg: 'インジケータが表示されませんでした',
			maxWait: 3000
		}).done(function() {
			strictEqual($('.inputA>.h5-indicator').length, 1, '非同期バリデート対象要素にインジケータが表示されること');
		}).always(start);
	});

	asyncTest('change時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		$('.inputA').change();
		gate({
			func: function() {
				return $('.inputA > .h5-indicator').length === 0;
			},
			failMsg: 'インジケータが表示されませんでした',
			maxWait: 3000
		}).done(function() {
			strictEqual($('.inputA>.h5-indicator').length, 0, '非同期バリデート対象要素にインジケータが表示されないこと');
		}).always(start);
	});

	asyncTest('click時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		$('.inputA').click();
		gate({
			func: function() {
				return $('.inputA > .h5-indicator').length === 0;
			},
			failMsg: 'インジケータが表示されませんでした',
			maxWait: 3000
		}).done(function() {
			strictEqual($('.inputA>.h5-indicator').length, 0, '非同期バリデート対象要素にインジケータが表示されないこと');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('asyncIndicatorプラグイン 全体バリデートを行っていない場合', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a" value="v"></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addOutput('asyncIndicator');
				this.addRule({
					a: {
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
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('バリデートを行った場合は表示されること', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var result = formCtrl.validate();
		result.addEventListener('validate', function(ev) {
			start();
		});
		strictEqual($('form> .inputA >.h5-indicator').length, 1, '非同期バリデート対象要素にインジケータが表示されること');
	});

	asyncTest('focus時に表示されること', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.inputA > .h5-indicator').length === 1;
			},
			failMsg: 'インジケータが表示されませんでした',
			maxWait: 3000
		}).done(function() {
			strictEqual($('.inputA>.h5-indicator').length, 1, '非同期バリデート対象要素にインジケータが表示されること');
		}).always(start);
	});

	asyncTest('blur時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		$('.inputA').blur();
		gate({
			func: function() {
				return $('.inputA > .h5-indicator').length === 0;
			},
			failMsg: 'インジケータが表示されました',
			maxWait: 3000
		}).done(function() {
			strictEqual($('.inputA>.h5-indicator').length, 0, '非同期バリデート対象要素にインジケータが表示されないこと');
		}).always(start);
	});

	asyncTest('keyup時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		$('.inputA').keyup();
		gate({
			func: function() {
				return $('.inputA > .h5-indicator').length === 1;
			},
			failMsg: 'インジケータが表示されませんでした',
			maxWait: 3000
		}).done(function() {
			strictEqual($('.inputA>.h5-indicator').length, 1, '非同期バリデート対象要素にインジケータが表示されること');
		}).always(start);
	});

	asyncTest('change時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		$('.inputA').change();
		gate({
			func: function() {
				return $('.inputA > .h5-indicator').length === 0;
			},
			failMsg: 'インジケータが表示されませんでした',
			maxWait: 3000
		}).done(function() {
			strictEqual($('.inputA>.h5-indicator').length, 0, '非同期バリデート対象要素にインジケータが表示されないこと');
		}).always(start);
	});

	asyncTest('click時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		$('.inputA').click();
		gate({
			func: function() {
				return $('.inputA > .h5-indicator').length === 0;
			},
			failMsg: 'インジケータが表示されませんでした',
			maxWait: 3000
		}).done(function() {
			strictEqual($('.inputA>.h5-indicator').length, 0, '非同期バリデート対象要素にインジケータが表示されないこと');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('asyncIndicatorプラグイン abort', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a" value="v"></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addOutput('asyncIndicator');
				this.addRule({
					a: {
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
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('インジケータ表示中にabortイベントが起きた場合はインジケータを非表示にすること', function() {
		var result = this.formController.validate();
		gate({
			func: function() {
				return $('.inputA > .h5-indicator').length === 1;
			},
			failMsg: 'インジケータが表示されませんでした',
			maxWait: 3000
		}).done(function() {
			result.abort();
			gate({
				func: function() {
					return $('.inputA > .h5-indicator').length === 0;
				},
				failMsg: 'インジケータが非表示になりませんでした',
				maxWait: 3000
			}).done(function() {
				strictEqual($('.inputA>.h5-indicator').length, 0, '非同期バリデート対象要素にインジケータが表示されないこと');
			}).always(start);
		}).fail(start);
	});

	//=============================
	// Definition
	//=============================
	module('バリデート結果出力プラグイン composition', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			html += '<div class="errorContainer"></div>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('compositionプラグインを有効化できること',
			function() {
				var formCtrl = this.formController;
				formCtrl.addOutput('composition');
				var pluginCtrl = formCtrl.getOutput('composition');
				strictEqual(pluginCtrl.__name, 'h5.ui.validation.Composition',
						'compositionプラグインを有効化できること');
			});

	test('バリデートエラーが有った場合にエラーメッセージが表示されること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.addOutput('composition');
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer')
				}
			},
			property: {
				a: {
					composition: {
						message: errorMessage
					}
				}
			}
		});
		// FIXME #529 addOutput()の直後はcompositionプラグインが子コントローラ化が完了していない
		// 内部でsettingはコントローラ化完了後に行われるので、完了を待たずにバリデートするとエラーメッセージ表示先が
		// 設定されておらず表示されない
		// 本来は表示されるはず
		formCtrl.validate();
		strictEqual($('.errorContainer').text(), errorMessage, 'バリデートエラーが有った場合にエラーメッセージが表示されること');
	});

	test('メッセージ出力先となるコンテナ要素をjQueryオブジェクトで設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.addOutput('composition');
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer')
				}
			},
			property: {
				a: {
					composition: {
						message: errorMessage
					}
				}
			}
		});
		// FIXME #529 addOutput()の直後はcompositionプラグインが子コントローラ化が完了していない
		// 内部でsettingはコントローラ化完了後に行われるので、完了を待たずにバリデートするとエラーメッセージ表示先が
		// 設定されておらず表示されない
		// 本来は表示されるはず
		formCtrl.validate();
		strictEqual($('.errorContainer').text(), errorMessage, 'メッセージ出力先となるコンテナ要素を設定できること');
	});

	test('メッセージ出力先となるコンテナ要素をDOMで設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.addOutput('composition');
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer').get(0)
				}
			},
			property: {
				a: {
					composition: {
						message: errorMessage
					}
				}
			}
		});
		// FIXME #529 addOutput()の直後はcompositionプラグインが子コントローラ化が完了していない
		// 内部でsettingはコントローラ化完了後に行われるので、完了を待たずにバリデートするとエラーメッセージ表示先が
		// 設定されておらず表示されない
		// 本来は表示されるはず
		formCtrl.validate();
		strictEqual($('.errorContainer').text(), errorMessage, 'メッセージ出力先となるコンテナ要素を設定できること');
	});

	test('メッセージ出力先となるコンテナ要素をセレクタ文字列で設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.addOutput('composition');
		formCtrl.setSetting({
			output: {
				composition: {
					container: '.errorContainer'
				}
			},
			property: {
				a: {
					composition: {
						message: errorMessage
					}
				}
			}
		});
		// FIXME #529 addOutput()の直後はcompositionプラグインが子コントローラ化が完了していない
		// 内部でsettingはコントローラ化完了後に行われるので、完了を待たずにバリデートするとエラーメッセージ表示先が
		// 設定されておらず表示されない
		// 本来は表示されるはず
		formCtrl.validate();
		strictEqual($('.errorContainer').text(), errorMessage, 'メッセージ出力先となるコンテナ要素を設定できること');
	});

	test('メッセージを出力する要素のタグ名を設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.addOutput('composition');
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					wrapper: 'li'
				}
			}
		});
		// FIXME #529 addOutput()の直後はcompositionプラグインが子コントローラ化が完了していない
		// 内部でsettingはコントローラ化完了後に行われるので、完了を待たずにバリデートするとエラーメッセージ表示先が
		// 設定されておらず表示されない
		// 本来は表示されるはず
		formCtrl.validate();
		strictEqual($('.errorContainer > li').length, 1, 'メッセージを出力する要素のタグ名を設定できること');
	});

	test('メッセージを出力する要素のタグ生成文字列を設定できること',
			function() {
				var formCtrl = this.formController;
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				formCtrl.addOutput('composition');
				formCtrl.setSetting({
					output: {
						composition: {
							container: $('.errorContainer'),
							wrapper: '<span class="errorMessage">'
						}
					}
				});
				// FIXME #529 addOutput()の直後はcompositionプラグインが子コントローラ化が完了していない
				// 内部でsettingはコントローラ化完了後に行われるので、完了を待たずにバリデートするとエラーメッセージ表示先が
				// 設定されておらず表示されない
				formCtrl.validate();
				strictEqual($('.errorContainer > .errorMessage').length, 1,
						'メッセージを出力する要素のタグ生成文字列を設定できること');
			});

	test('バリデート結果表示をリセットできること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.addOutput('composition');
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
				}
			}
		});
		// FIXME #529 addOutput()の直後はcompositionプラグインが子コントローラ化が完了していない
		// 内部でsettingはコントローラ化完了後に行われるので、完了を待たずにバリデートするとエラーメッセージ表示先が
		// 設定されておらず表示されない
		// 本来は表示されるはず
		// このテストではメッセージが表示されていなくてもresetValidation()で消してしまうので結果的に成功している
		formCtrl.validate();
		formCtrl.resetValidation();
		strictEqual($('.errorContainer').text(), '', 'バリデート結果表示をリセットできること');
	});

	//=============================
	// Definition
	//=============================
	module('compositionプラグイン 全体バリデートを行った場合', {
		setup: function() {
			stop();
			var that = this;
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			html += '<div class="errorContainer"></div>';
			$('#qunit-fixture').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						size: [5, 10]
					}
				});
				this.addOutput('composition');
				// FIXME #529
				formCtrl.setSetting({
					output: {
						composition: {
							container: $('.errorContainer'),
							message: that.errorMessage,
							wrapper: 'li'
						}
					}
				});
				formCtrl.validate();
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('バリデートを行った場合は表示されること', function() {
		// FIXME #530 setSetting()で各プロパティ毎のプラグイン設定でメッセージを指定しない場合、
		// プラグイン設定のmessageではなくバリデーションルールのデフォルトメッセージが表示される。
		this.formController.validate();
		strictEqual($('.errorContainer').text(), this.errorMessage, 'エラーメッセージが表示されること');
	});

	asyncTest('focus時に表示されないこと', function() {
		// validate()時にエラーメッセージが書き換わる想定なので
		// ここでメッセージを除去してfocus時に書き換わらないことを確認する
		var $container = $('.errorContainer');
		$container.find('li').remove();
		$('.inputA').focus();
		gate({
			func: function() {
				return $container.find('li').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($container.find('li').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('blur時に表示されないこと', function() {
		// validate()時にエラーメッセージが書き換わる想定なので
		// ここでメッセージを除去してblur時に書き換わらないことを確認する
		var $container = $('.errorContainer');
		$container.find('li').remove();
		$('.inputA').blur();
		gate({
			func: function() {
				return $container.find('li').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($container.find('li').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('keyup時に表示されないこと', function() {
		// validate()時にエラーメッセージが書き換わる想定なので
		// ここでメッセージを除去してkeyup時に書き換わらないことを確認する
		var $container = $('.errorContainer');
		$container.find('li').remove();
		$('.inputA').keyup();
		gate({
			func: function() {
				return $container.find('li').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($container.find('li').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('change時に表示されないこと', function() {
		// validate()時にエラーメッセージが書き換わる想定なので
		// ここでメッセージを除去してchange時に書き換わらないことを確認する
		var $container = $('.errorContainer');
		$container.find('li').remove();
		$('.inputA').keyup();
		gate({
			func: function() {
				return $container.find('li').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($container.find('li').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('click時に表示されないこと', function() {
		// validate()時にエラーメッセージが書き換わる想定なので
		// ここでメッセージを除去してclick時に書き換わらないことを確認する
		var $container = $('.errorContainer');
		$container.find('li').remove();
		$('.inputA').click();
		gate({
			func: function() {
				return $container.find('li').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($container.find('li').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('compositionプラグイン 全体バリデートを行っていない場合', {
		setup: function() {
			stop();
			var that = this;
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			html += '<div class="errorContainer"></div>';
			$('#qunit-fixture').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						size: [5, 10]
					}
				});
				this.addOutput('composition');
				// FIXME #529
				formCtrl.setSetting({
					output: {
						composition: {
							container: $('.errorContainer'),
							message: that.errorMessage,
							wrapper: 'li'
						}
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('バリデートを行った場合は表示されること', function() {
		// FIXME #530 setSetting()で各プロパティ毎のプラグイン設定でメッセージを指定しない場合、
		// プラグイン設定のmessageではなくバリデーションルールのデフォルトメッセージが表示される。
		this.formController.validate();
		strictEqual($('.errorContainer').text(), this.errorMessage, 'エラーメッセージが表示されること');
	});

	asyncTest('focus時に表示されないこと', function() {
		var $container = $('.errorContainer');
		$('.inputA').focus();
		gate({
			func: function() {
				return $container.find('li').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($container.find('li').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('blur時に表示されないこと', function() {
		var $container = $('.errorContainer');
		$('.inputA').blur();
		gate({
			func: function() {
				return $container.find('li').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($container.find('li').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('keyup時に表示されないこと', function() {
		var $container = $('.errorContainer');
		$('.inputA').keyup();
		gate({
			func: function() {
				return $container.find('li').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($container.find('li').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('change時に表示されないこと', function() {
		var $container = $('.errorContainer');
		$('.inputA').keyup();
		gate({
			func: function() {
				return $container.find('li').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($container.find('li').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('click時に表示されないこと', function() {
		var $container = $('.errorContainer');
		$('.inputA').click();
		gate({
			func: function() {
				return $container.find('li').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($container.find('li').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('バリデート結果出力プラグイン message', {
		setup: function() {
			stop();
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('messageプラグインを有効化できること', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('message');
		var pluginCtrl = formCtrl.getOutput('message');
		strictEqual(pluginCtrl.__name, 'h5.ui.validation.Message', 'messageプラグインを有効化できること');
	});

	test('バリデートエラーが有った場合にエラーメッセージが表示されること', function() {
		var formCtrl = this.formController;
		var errorMessage = this.errorMessage;
		formCtrl.addOutput('message');
		// #529
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.setSetting({
			output: {
				message: {
					message: errorMessage
				}
			}
		});
		formCtrl.validate();
		// FIXME #530 setSetting()で各プロパティ毎のプラグイン設定でメッセージを指定しない場合、
		// プラグイン設定のmessageではなくバリデーションルールのデフォルトメッセージが表示される。
		strictEqual($('.inputA').next().text(), errorMessage, 'エラーメッセージが表示されること');
	});

	test('メッセージ要素配置関数を設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = this.errorMessage;
		formCtrl.addOutput('message');
		// #529
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.setSetting({
			output: {
				message: {
					appendMessage: function(messageElem, propName, target) {
						$(target).append('<span class="errorMessageWrapper">');
					},
					message: errorMessage
				}
			}
		});
		formCtrl.validate();
		// FIXME #530 setSetting()で各プロパティ毎のプラグイン設定でメッセージを指定しない場合、
		// プラグイン設定のmessageではなくバリデーションルールのデフォルトメッセージが表示される。
		strictEqual($('.errorMessageWrapper').text(), errorMessage, 'エラーメッセージが表示されること');
	});

	test('メッセージを出力する要素のタグ名を設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = this.errorMessage;
		formCtrl.addOutput('message');
		// #529
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.setSetting({
			output: {
				message: {
					message: errorMessage,
					wrapper: 'li'
				}
			}
		});
		formCtrl.validate();
		// FIXME #530 setSetting()で各プロパティ毎のプラグイン設定でメッセージを指定しない場合、
		// プラグイン設定のmessageではなくバリデーションルールのデフォルトメッセージが表示される。
		strictEqual($('.inputA').next().text(), errorMessage, 'エラーメッセージが表示されること');
	});

	test('メッセージを出力する要素のタグ生成文字列を設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = this.errorMessage;
		formCtrl.addOutput('message');
		// #529
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.setSetting({
			output: {
				message: {
					message: errorMessage,
					wrapper: '<span class="errorMessageWrapper">'
				}
			}
		});
		formCtrl.validate();
		// FIXME #530 setSetting()で各プロパティ毎のプラグイン設定でメッセージを指定しない場合、
		// プラグイン設定のmessageではなくバリデーションルールのデフォルトメッセージが表示される。
		strictEqual($('.errorMessageWrapper').text(), errorMessage, 'エラーメッセージが表示されること');
	});

	test('バリデート結果表示をリセットできること', function() {
		var formCtrl = this.formController;
		var errorMessage = this.errorMessage;
		formCtrl.addOutput('message');
		// #529
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.setSetting({
			output: {
				message: {
					message: errorMessage,
					wrapper: '<span class="errorMessageWrapper">'
				}
			}
		});
		formCtrl.validate();
		formCtrl.resetValidation();
		// FIXME #530 setSetting()で各プロパティ毎のプラグイン設定でメッセージを指定しない場合、
		// プラグイン設定のmessageではなくバリデーションルールのデフォルトメッセージが表示される。
		strictEqual($('.errorMessageWrapper').text(), '', 'バリデート結果表示をリセットできること');
	});

	//=============================
	// Definition
	//=============================
	module('messageプラグイン 全体バリデートを行った場合', {
		setup: function() {
			stop();
			var that = this;
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			$('#qunit-fixture').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput('message');
				// FIXME #529
				formCtrl.setSetting({
					output: {
						message: {
							message: that.errorMessage,
							wrapper: '<span class="errorMessageWrapper">'
						}
					}
				});
				formCtrl.validate();
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('バリデートを行った場合は表示されること', function() {
		var formCtrl = this.formController;
		var $container = $('.errorMessageWrapper');
		if ($container.length === 0) {
			ok(false, '全体バリデート時にエラーメッセージが表示されていない');
			start();
			return;
		}
		var errorMessage = this.errorMessage;
		$('.inputA').blur();
		gate({
			func: function() {
				return $container.length === 0;
			}
		}).done(function() {
			// FIXME #530 setSetting()で各プロパティ毎のプラグイン設定でメッセージを指定しない場合、
			// プラグイン設定のmessageではなくバリデーションルールのデフォルトメッセージが表示される。
			formCtrl.validate();
			strictEqual($container.text(), errorMessage, 'エラーメッセージが表示されること');
		}).always(start);
	});

	asyncTest('focus時に表示されること', function() {
		var $container = $('.errorMessageWrapper');
		if ($container.length === 0) {
			ok(false, '全体バリデート時にエラーメッセージが表示されていない');
			start();
			return;
		}
		var errorMessage = this.errorMessage;
		$('.inputA').blur();
		gate({
			func: function() {
				return $container.length === 0;
			}
		}).done(function() {
			$('.inputA').focus();
			gate({
				func: function() {
					return $container.length === 1;
				},
				maxWait: 1000
			}).done(function() {
				strictEqual($container.text(), errorMessage, 'エラーメッセージが表示されること');
			}).always(start);
		}).fail(start);
	});

	asyncTest('blur時にメッセージ表示要素が削除されること', function() {
		var $container = $('.errorMessageWrapper');
		if ($container.length === 0) {
			ok(false, '全体バリデート時にエラーメッセージが表示されていない');
			start();
			return;
		}
		$('.inputA').blur();
		gate({
			func: function() {
				return $container.length === 0;
			},
			maxWait: 1000
		}).done(function() {
			strictEqual($container.length, 0, 'メッセージ表示要素が削除されること');
		}).always(start);
	});

	asyncTest('keyup時に表示されないこと', function() {
		var $container = $('.errorMessageWrapper');
		if ($container.length === 0) {
			ok(false, '全体バリデート時にエラーメッセージが表示されていない');
			start();
			return;
		}
		$('.inputA').blur();
		gate({
			func: function() {
				return $container.length === 0;
			}
		}).done(function() {
			$('.inputA').keyup();
			gate({
				func: function() {
					return $container.length === 1;
				},
				maxWait: 1000
			}).done(function() {
				ok(false, 'エラーメッセージが表示されてしまう');
			}).fail(function() {
				strictEqual($container.length, 0, 'エラーメッセージが表示されないこと');
			}).always(start);
		}).fail(start);
	});

	asyncTest('change時に表示されないこと', function() {
		var $container = $('.errorMessageWrapper');
		if ($container.length === 0) {
			ok(false, '全体バリデート時にエラーメッセージが表示されていない');
			start();
			return;
		}
		$('.inputA').blur();
		gate({
			func: function() {
				return $container.length === 0;
			}
		}).done(function() {
			$('.inputA').change();
			gate({
				func: function() {
					return $container.length === 1;
				},
				maxWait: 1000
			}).done(function() {
				ok(false, 'エラーメッセージが表示されてしまう');
			}).fail(function() {
				strictEqual($container.length, 0, 'エラーメッセージが表示されないこと');
			}).always(start);
		}).fail(start);
	});

	asyncTest('click時に表示されないこと', function() {
		var $container = $('.errorMessageWrapper');
		if ($container.length === 0) {
			ok(false, '全体バリデート時にエラーメッセージが表示されていない');
			start();
			return;
		}
		$('.inputA').blur();
		gate({
			func: function() {
				return $container.length === 0;
			}
		}).done(function() {
			$('.inputA').click();
			gate({
				func: function() {
					return $container.length === 1;
				},
				maxWait: 1000
			}).done(function() {
				ok(false, 'エラーメッセージが表示されてしまう');
			}).fail(function() {
				strictEqual($container.length, 0, 'エラーメッセージが表示されないこと');
			}).always(start);
		}).fail(start);
	});

	//=============================
	// Definition
	//=============================
	module('messageプラグイン 全体バリデートを行っていない場合', {
		setup: function() {
			stop();
			var that = this;
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			$('#qunit-fixture').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput('message');
				// FIXME #529
				formCtrl.setSetting({
					output: {
						message: {
							message: that.errorMessage,
							wrapper: '<span class="errorMessageWrapper">'
						}
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('バリデートを行った場合は表示されること', function() {
		// FIXME #530 setSetting()で各プロパティ毎のプラグイン設定でメッセージを指定しない場合、
		// プラグイン設定のmessageではなくバリデーションルールのデフォルトメッセージが表示される。
		this.formController.validate();
		strictEqual($('.errorMessageWrapper').text(), this.errorMessage, 'エラーメッセージが表示されること');
	});

	asyncTest('focus時に表示されないこと', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.errorMessageWrapper').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($('.errorMessageWrapper').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('blur時に表示されないこと', function() {
		$('.inputA').blur();
		gate({
			func: function() {
				return $('.errorMessageWrapper').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($('.errorMessageWrapper').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('keyup時に表示されないこと', function() {
		$('.inputA').keyup();
		gate({
			func: function() {
				return $('.errorMessageWrapper').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($('.errorMessageWrapper').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('change時に表示されないこと', function() {
		$('.inputA').change();
		gate({
			func: function() {
				return $('.errorMessageWrapper').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($('.errorMessageWrapper').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	asyncTest('click時に表示されないこと', function() {
		$('.inputA').click();
		gate({
			func: function() {
				return $('.errorMessageWrapper').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'エラーメッセージが表示されてしまう');
		}).fail(function() {
			strictEqual($('.errorMessageWrapper').length, 0, 'エラーメッセージが表示されないこと');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('バリデート結果出力プラグイン balloon', {
		setup: function() {
			stop();
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><div class="testBalloonContainer">';
			html += '<input class="inputA" name="a"></div></form>';
			$('body').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	test('balloonプラグインを有効化できること', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('balloon');
		var pluginCtrl = formCtrl.getOutput('balloon');
		strictEqual(pluginCtrl.__name, 'h5.ui.validation.ErrorBalloon', 'balloonプラグインを有効化できること');
	});

	asyncTest('バリデートエラーがあってもバルーンが表示されないこと', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('balloon');
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.validate();
		strictEqual($('.validation-balloon').length, 0, 'バルーンが表示されないこと');
		start();
	});

	asyncTest('バルーンを表示する位置を文字列で指定できること', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('balloon');
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.setSetting({
			output: {
				balloon: {
					placement: 'bottom'
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			var balloonPos = $('.validation-balloon').position();
			var inputPos = $('.inputA').position();
			ok(balloonPos.top > inputPos.top, 'バルーンを表示する位置を文字列で指定できること');
		}).always(start);
	});

	asyncTest('バルーン要素を配置するコンテナを設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('balloon');
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.setSetting({
			output: {
				balloon: {
					container: '.testBalloonContainer'
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(
				function() {
					ok($('.validation-balloon').parent().hasClass('testBalloonContainer'),
							'バルーン要素を配置するコンテナを設定できること');
				}).always(start);
	});

	asyncTest('バリデート結果表示をリセットできること', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('balloon');
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			formCtrl.resetValidation();
			// TODO 要再考。Balloonプラグインのバリデート結果のリセットはどういう意味を考える
			strictEqual($('.validation-balloon').length, 0, 'バリデート結果表示をリセットできること');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('balloonプラグイン 全体バリデートを行った場合', {
		setup: function() {
			stop();
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><div class="testBalloonContainer">';
			html += '<input class="inputA" name="a"></div></form>';
			$('body').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput('balloon');
				formCtrl.validate();
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('バリデートを行った場合は表示されないこと', function() {
		var formCtrl = this.formController;
		formCtrl.validate();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.validation-balloon').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('focus時に表示されること', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			failMsg: 'バルーンが表示されない'
		}).done(function() {
			strictEqual($('.validation-balloon').length, 1, 'バルーンが表示されること');
		}).always(start);
	});

	asyncTest('blur時に非表示になること', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			failMsg: 'バルーンが表示されない',
		}).done(function() {
			$('.inputA').blur();
			gate({
				func: function() {
					return $('.validation-balloon').length === 0;
				},
				failMsg: 'バルーンが非表示にならない',
				maxWait: 1000
			}).done(function() {
				strictEqual($('.validation-balloon').length, 0, 'バルーンが非表示になること');
			}).always(start);
		}).fail(start);
	});

	asyncTest('keyup時に表示されること', function() {
		// フォーカスをあてないとkeyup時のactiveElementがbodyになる
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			failMsg: 'バルーンが表示されない',
		}).done(function() {
			$('.inputA').keyup();
			gate({
				func: function() {
					return $('.validation-balloon').length === 1;
				},
				failMsg: 'バルーンが表示されない',
				maxWait: 1000
			}).done(function() {
				strictEqual($('.validation-balloon').length, 1, 'バルーンが表示されること');
			}).always(start);
		}).fail(start);
	});

	asyncTest('change時に表示されないこと', function() {
		$('.inputA').change();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.validation-balloon').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('click時に表示されないこと', function() {
		// click()ではフォーカスは当たらない
		$('.inputA').click();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.validation-balloon').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('balloonプラグイン 全体バリデートを行っていない場合', {
		setup: function() {
			stop();
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			$('body').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput('balloon');
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('バリデートを行った場合は表示されないこと', function() {
		this.formController.validate();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.validation-balloon').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('focus時に表示されないこと', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.validation-balloon').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('blur時に表示されないこと', function() {
		$('.inputA').blur();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.validation-balloon').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('keyup時に表示されないこと', function() {
		$('.inputA').keyup();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.validation-balloon').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('change時に表示されないこと', function() {
		$('.inputA').change();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.validation-balloon').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('click時に表示されないこと', function() {
		$('.inputA').click();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.validation-balloon').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('balloonプラグイン バルーンを表示する位置を指定', {
		setup: function() {
			stop();
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><div style="text-align: center">';
			html += '<input class="inputA" name="a"></div></form>';
			$('body').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput('balloon');
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('対象要素の上に表示されること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					placement: 'top'
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length !== 0;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(function() {
			// FIXME #534 バルーン要素(validation-balloonクラス要素)が複数生成されている
			// $('.validation-balloon)ではバルーンとして表示されない要素の方が取得できpositionが期待と異なっている
			var balloonPos = $('.validation-balloon').position();
			var inputPos = $('.inputA').position();
			ok(balloonPos.top < inputPos.top, '対象要素の上に表示されること');
		}).always(start);
	});

	asyncTest('対象要素の下に表示されること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					placement: 'bottom'
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(function() {
			var balloonPos = $('.validation-balloon').position();
			var inputPos = $('.inputA').position();
			ok(balloonPos.top > inputPos.top, '対象要素の下に表示されること');
		}).always(start);
	});

	asyncTest('対象要素の左に表示されること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					placement: 'left'
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(function() {
			var balloonPos = $('.validation-balloon').position();
			var inputPos = $('.inputA').position();
			ok(balloonPos.left < inputPos.left, '対象要素の左に表示されること');
		}).always(start);
	});

	asyncTest('対象要素の右に表示されること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					placement: 'bottom'
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(function() {
			var balloonPos = $('.validation-balloon').position();
			var inputPos = $('.inputA').position();
			ok(balloonPos.left > inputPos.left, '対象要素の右に表示されること');
		}).always(start);
	});

	asyncTest('デフォルトは対象要素の上に表示されること', function() {
		var formCtrl = this.formController;
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(function() {
			var balloonPos = $('.validation-balloon').position();
			var inputPos = $('.inputA').position();
			ok(balloonPos.top < inputPos.top, 'デフォルトは対象要素の上に表示されること');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('バリデート結果出力プラグイン bsBalloon', {
		setup: function() {
			stop();
			var cssFile = '/hifive-res/ext/bootstrap/3.3.4/css/bootstrap.min.css';
			var jsFile = '/hifive-res/ext/bootstrap/3.3.4/js/bootstrap.min.js';
			this.errorMessage = 'errorMessage';
			var that = this;
			h5.res.dependsOn([cssFile, jsFile]).resolve().done(function(all, bsCss, bsJs) {
				that.bsCss = bsCss;
				that.bsJs = bsJs;
				var html = '<form class="testForm"><div class="testBalloonContainer">';
				html += '<input class="inputA" name="a"></div></form>';
				$('body').append(html);
				that.formController = h5.core.controller('.testForm', h5.ui.FormController);
				that.formController.readyPromise.done(function() {
					start();
				});
			}).fail(start);
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
			$(this.bsCss).remove();
			$(this.bsJs).remove();
		}
	});

	//=============================
	// Body
	//=============================
	test('bsBalloonプラグインを有効化できること', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('bsBalloon');
		var pluginCtrl = formCtrl.getOutput('bsBalloon');
		strictEqual(pluginCtrl.__name, 'h5.ui.validation.BootstrapErrorBalloon',
				'bsBalloonプラグインを有効化できること');
	});

	asyncTest('バリデートエラーがあってもBootstrapのバルーンが表示されないこと', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('bsBalloon');
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.validate();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.tooltip').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('Bootstrapのバルーンを表示する位置を文字列で指定できること', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('bsBalloon');
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.setSetting({
			output: {
				balloon: {
					placement: 'bottom'
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			var bsBalloonPos = $('.tooltip').position();
			var inputPos = $('.inputA').position();
			ok(bsBalloonPos.top < inputPos.top, 'バルーンを表示する位置を文字列で指定できること');
		}).always(start);
	});

	asyncTest('バルーン要素を配置するコンテナを設定できること)', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('bsBalloon');
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.setSetting({
			output: {
				balloon: {
					container: '.testBalloonContainer'
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok($('.tooltip').parent().hasClass('testBalloonContainer'), 'バルーン要素を配置するコンテナを設定できること');
		}).always(start);
	});

	asyncTest('バリデート結果表示をリセットできること)', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('bsBalloon');
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			formCtrl.resetValidation();
			// TODO 要再考。balloonプラグインのバリデート結果のリセットはどういう意味を考える
			strictEqual($('.tooltip').length, 0, 'バリデート結果表示をリセットできること');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('bsBalloonプラグイン 全体バリデートを行った場合', {
		setup: function() {
			stop();
			var cssFile = '/hifive-res/ext/bootstrap/3.3.4/css/bootstrap.min.css';
			var jsFile = '/hifive-res/ext/bootstrap/3.3.4/js/bootstrap.min.js';
			this.errorMessage = 'errorMessage';
			var that = this;
			h5.res.dependsOn([cssFile, jsFile]).resolve().done(
					function(all, bsCss, bsJs) {
						that.bsCss = bsCss;
						that.bsJs = bsJs;
						var html = '<form class="testForm"><div class="testBalloonContainer">';
						html += '<input class="inputA" name="a"></div></form>';
						$('body').append(html);
						var formCtrl = that.formController = h5.core.controller('.testForm',
								h5.ui.FormController);
						formCtrl.readyPromise.done(function() {
							this.addRule({
								a: {
									required: true
								}
							});
							this.addOutput('bsBalloon');
							this.validate();
							start();
						});
					}).fail(start);
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
			$(this.bsCss).remove();
			$(this.bsJs).remove();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('バリデートを行った場合は表示されないこと', function() {
		var formCtrl = this.formController;
		formCtrl.validate();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.tooltip').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('focus時に表示されること', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			failMsg: 'バルーンが表示されない'
		}).done(function() {
			strictEqual($('.tooltip').length, 1, 'バルーンが表示されること');
		}).always(start);
	});

	asyncTest('blur時に非表示になること', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			failMsg: 'バルーンが表示されない',
		}).done(function() {
			$('.inputA').blur();
			gate({
				func: function() {
					return $('.tooltip').length === 0;
				},
				failMsg: 'バルーンが非表示にならない',
				maxWait: 1000
			}).done(function() {
				strictEqual($('.tooltip').length, 0, 'バルーンが非表示になること');
			}).always(start);
		}).fail(start);
	});

	asyncTest('keyup時に表示されること', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			failMsg: 'バルーンが表示されない',
		}).done(function() {
			$('.inputA').keyup();
			gate({
				func: function() {
					return $('.tooltip').length === 1;
				},
				maxWait: 1000,
				failMsg: 'バルーンが非表示になる'
			}).done(function() {
				strictEqual($('.tooltip').length, 1, 'バルーンが表示されること');
			}).always(start);
		}).fail(start);
	});

	asyncTest('change時に表示されないこと', function() {
		$('.inputA').change();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.tooltip').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('click時に表示されないこと', function() {
		$('.inputA').click();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.tooltip').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('input要素にtitle属性を指定してもメッセージが正しく表示されること', function() {
		$('.inputA').attr('title', 'hoge');
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			failMsg: 'バルーンが表示されない'
		}).done(function() {
			strictEqual($('.tooltip-inner').text(), 'aは必須項目です', 'title属性を指定しても正しくメッセージが表示されること');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module(
			'bsBalloonプラグイン グループ内のinput要素にルールを設定しても、keyup/blur時にバルーンが非表示なること',
			{
				setup: function() {
					stop();
					var cssFile = '/hifive-res/ext/bootstrap/3.3.4/css/bootstrap.min.css';
					var jsFile = '/hifive-res/ext/bootstrap/3.3.4/js/bootstrap.min.js';
					this.errorMessage = 'errorMessage';
					var that = this;
					h5.res
							.dependsOn([cssFile, jsFile])
							.resolve()
							.done(
									function(all, bsCss, bsJs) {
										that.bsCss = bsCss;
										that.bsJs = bsJs;
										var html = '<form class="testForm">';
										html += '<div class="testBalloonContainer" data-h5-input-group-container="testGroup">';
										html += '<input class="inputA" name="a"><input class="inputB" name="b">';
										html += '</div></form>';
										$('body').append(html);
										var formCtrl = that.formController = h5.core.controller(
												'.testForm', h5.ui.FormController);
										formCtrl.readyPromise.done(function() {
											this.addRule({
												a: {
													required: true
												},
												testGroup: {
													customFunc: function(group) {
														var a = group.a;
														var b = group.b;
														return (a && b);
													}
												}
											});
											this.addOutput('bsBalloon');
											this.validate();
											start();
										});
									}).fail(start);
				},
				teardown: function() {
					clearController();
					$('.testForm').remove();
					$(this.bsCss).remove();
					$(this.bsJs).remove();
				}
			});

	//=============================
	// Body
	//=============================
	asyncTest('keyup時にバルーンが非表示になること', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.tooltip').length === 2;// inputA,グループの2つのバルーンが表示される
			},
			maxWait: 1000
		}).done(function() {
			$('.inputA').val('hoge');
			$('.inputB').val('fuga');
			$('.inputA').keyup();
			gate({
				func: function() {
					return $('.tooltip').length === 0;
				},
				maxWait: 1000
			}).done(function() {
				strictEqual($('.tooltip').length === 0, true, 'keyupしたinput要素のバルーンが非表示になること');
			}).always(start);
		}).fail(start);
	});

	asyncTest('blur時にバルーンが非表示になること', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.tooltip').length === 2;// inputA,グループの2つのバルーンが表示される
			},
			maxWait: 1000
		}).done(function() {
			$('.inputA').val('hoge');
			$('.inputB').val('fuga');
			$('.inputA').blur();
			gate({
				func: function() {
					return $('.tooltip').length === 0;
				},
				maxWait: 1000
			}).done(function() {
				strictEqual($('.tooltip').length === 0, true, 'blurしたinput要素のバルーンが非表示になること');
			}).always(start);
		}).fail(start);
	});

	//=============================
	// Definition
	//=============================
	module('bsBalloonプラグイン 全体バリデートを行っていない場合', {
		setup: function() {
			stop();
			var cssFile = '/hifive-res/ext/bootstrap/3.3.4/css/bootstrap.min.css';
			var jsFile = '/hifive-res/ext/bootstrap/3.3.4/js/bootstrap.min.js';
			this.errorMessage = 'errorMessage';
			var that = this;
			h5.res.dependsOn([cssFile, jsFile]).resolve().done(
					function(all, bsCss, bsJs) {
						that.bsCss = bsCss;
						that.bsJs = bsJs;
						var html = '<form class="testForm"><div class="testBalloonContainer">';
						html += '<input class="inputA" name="a"></div></form>';
						$('body').append(html);
						var formCtrl = that.formController = h5.core.controller('.testForm',
								h5.ui.FormController);
						formCtrl.readyPromise.done(function() {
							this.addRule({
								a: {
									required: true
								}
							});
							this.addOutput('bsBalloon');
							start();
						});
					}).fail(start);
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
			$(this.bsCss).remove();
			$(this.bsJs).remove();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('バリデートを行った場合は表示されないこと', function() {
		var formCtrl = this.formController;
		formCtrl.validate();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.tooltip').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('focus時に表示されないこと', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.tooltip').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('blur時に表示されないこと', function() {
		$('.inputA').blur();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.tooltip').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('keyup時に表示されないこと', function() {
		$('.inputA').keyup();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.tooltip').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('change時に表示されないこと', function() {
		$('.inputA').change();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.tooltip').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	asyncTest('click時に表示されないこと', function() {
		$('.inputA').click();
		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'バルーンが表示される');
		}).fail(function() {
			strictEqual($('.tooltip').length, 0, 'バルーンが表示されないこと');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('バリデート結果出力プラグイン style', {
		setup: function() {
			stop();
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><div class="testBalloonContainer">';
			html += '<input class="inputA" name="a"></div></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('styleプラグインを有効化できること', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('style');
		var pluginCtrl = formCtrl.getOutput('style');
		strictEqual(pluginCtrl.__name, 'h5.ui.validation.Style', 'styleプラグインを有効化できること');
	});

	asyncTest(
			'バリデート時に適用するクラス名を設定できること',
			function() {
				var $form = $('.testForm');
				var html = '<input class="inputB" name="b"><input class="inputC" name="c"><input class="inputD" name="d">';
				$form.append(html);
				var $inputA = $('.inputA');
				var $inputB = $('.inputB');
				var $inputC = $('.inputC');
				var $inputD = $('.inputD');
				$inputA.val('aaa');
				var successClassName = 'successValidate';
				var errorClassName = 'failValidate';
				var validatingClassName = 'validating';

				var formCtrl = this.formController;
				formCtrl.addOutput('style');
				formCtrl.addRule({
					a: {
						required: true
					},
					b: {
						required: true
					},
					c: {
						customFunc: function() {
							var dfd = h5.async.deferred();
							setTimeout(function() {
								dfd.resolve();
							}, 500);
							return dfd.promise();
						}
					},
					d: {
						customFunc: function() {
							var dfd = h5.async.deferred();
							setTimeout(function() {
								dfd.reject();
							}, 500);
							return dfd.promise();
						}
					}
				});
				formCtrl.setSetting({
					output: {
						style: {
							successClassName: successClassName,
							errorClassName: errorClassName,
							validatingClassName: validatingClassName
						}
					}
				});
				var result = formCtrl.validate();
				ok($inputA.hasClass(successClassName), 'バリデート成功した要素にバリデート成功クラスが適用されること');
				ok($inputB.hasClass(errorClassName), 'バリデート失敗した要素にバリデート失敗クラスが適用されること');
				ok($inputC.hasClass(validatingClassName),
						'非同期バリデートの結果待機中の要素に非同期バリデート結果待機のクラスが適用されること');
				result.addEventListener('validateComplete', function() {
					ok($inputC.hasClass(successClassName), '非同期バリデートの結果が成功であればバリデート成功クラスが適用されること');
					ok($inputD.hasClass(errorClassName), '非同期バリデートの結果が失敗であればバリデート失敗クラスが適用されること');
					start();
				});
			});

	asyncTest('バリデート結果表示をリセットできること)', function() {
		var $form = $('.testForm');
		var html = '<input class="inputB" name="b"><input class="inputC" name="c">';
		$form.append(html);
		var $inputA = $('.inputA');
		var $inputB = $('.inputB');
		var $inputC = $('.inputC');
		$inputA.val('aaa');
		var successClassName = 'successValidate';
		var errorClassName = 'failValidate';
		var validatingClassName = 'validating';

		var formCtrl = this.formController;
		formCtrl.addOutput('style');
		formCtrl.addRule({
			a: {
				required: true
			},
			b: {
				required: true
			},
			c: {
				customFunc: function() {
					var dfd = h5.async.deferred();
					setTimeout(function() {
						dfd.resolve();
					}, 500);
					return dfd.promise();
				}
			}
		});
		formCtrl.setSetting({
			output: {
				style: {
					successClassName: successClassName,
					errorClassName: errorClassName,
					validatingClassName: validatingClassName
				}
			}
		});
		var result = formCtrl.validate();
		result.addEventListener('validateComplete', function() {
			formCtrl.resetValidation();
			ok(!$inputA.hasClass(successClassName), '適用したクラスがリセットされていること');
			ok(!$inputB.hasClass(errorClassName), '適用したクラスがリセットされていること');
			ok(!$inputC.hasClass(validatingClassName), '適用したクラスがリセットされていること');
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('styleプラグイン 全体バリデートを行った場合', {
		setup: function() {
			stop();
			this.successClassName = 'successValidate';
			this.errorClassName = 'failValidate';
			this.validatingClassName = 'validating';
			this.errorMessage = 'errorMessage';
			var that = this;
			var html = '<form class="testForm">';
			html += '<input class="inputA" name="a"></form>';
			$('#qunit-fixture').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput('style');
				this.setSetting({
					output: {
						style: {
							successClassName: that.successClassName,
							errorClassName: that.errorClassName,
							validatingClassName: that.validatingClassName
						}
					}
				});
				this.validate();
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	test('バリデートを行った場合は設定されること', function() {
		this.formController.validate();
		ok($('.inputA').hasClass(this.errorClassName), 'クラスが設定されること');
	});

	asyncTest('focus時に設定されること', function() {
		var $inputA = $('.inputA');
		$inputA.focus();
		var that = this;
		gate({
			func: function() {
				return $inputA.hasClass(that.errorClassName);
			},
			maxWait: 1000,
			failMsg: 'クラスが設定されない'
		}).done(function() {
			ok($inputA.hasClass(that.errorClassName), 'クラスが設定されること');
		}).always(start);
	});

	asyncTest('blur時に設定されないこと', function() {
		var $inputA = $('.inputA');
		// 全体バリデート時にあてられたクラスを除去し
		// イベントが起きてもクラスが設定されないことを確認する
		$inputA.removeClass(this.errorClassName);
		$inputA.blur();
		var that = this;
		gate({
			func: function() {
				return $inputA.hasClass(that.errorClassName);
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'クラスが設定される');
		}).fail(function() {
			ok(!$inputA.hasClass(that.errorClassName), 'クラスが設定されないこと');
		}).always(start);
	});

	asyncTest('keyup時に設定されること', function() {
		var $inputA = $('.inputA');
		$inputA.keyup();
		var that = this;
		gate({
			func: function() {
				return $inputA.hasClass(that.errorClassName);
			},
			maxWait: 1000,
			failMsg: 'クラスが設定されない'
		}).done(function() {
			ok($inputA.hasClass(that.errorClassName), 'クラスが設定されること');
		}).always(start);
	});

	asyncTest('change時に設定されないこと', function() {
		var $inputA = $('.inputA');
		// 全体バリデート時にあてられたクラスを除去し
		// イベントが起きてもクラスが設定されないことを確認する
		$inputA.removeClass(this.errorClassName);
		$inputA.change();
		var that = this;
		gate({
			func: function() {
				return $inputA.hasClass(that.errorClassName);
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'クラスが設定される');
		}).fail(function() {
			ok(!$inputA.hasClass(that.errorClassName), 'クラスが設定されないこと');
		}).always(start);
	});

	asyncTest('click時に設定されないこと', function() {
		var $inputA = $('.inputA');
		// 全体バリデート時にあてられたクラスを除去し
		// イベントが起きてもクラスが設定されないことを確認する
		$inputA.removeClass(this.errorClassName);
		$inputA.click();
		var that = this;
		gate({
			func: function() {
				return $inputA.hasClass(that.errorClassName);
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'クラスが設定される');
		}).fail(function() {
			ok(!$inputA.hasClass(that.errorClassName), 'クラスが設定されないこと');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('styleプラグイン 全体バリデートを行っていない場合', {
		setup: function() {
			stop();
			this.successClassName = 'successValidate';
			this.errorClassName = 'failValidate';
			this.validatingClassName = 'validating';
			this.errorMessage = 'errorMessage';
			var that = this;
			var html = '<form class="testForm">';
			html += '<input class="inputA" name="a"></form>';
			$('#qunit-fixture').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput('style');
				this.setSetting({
					output: {
						style: {
							successClassName: that.successClassName,
							errorClassName: that.errorClassName,
							validatingClassName: that.validatingClassName
						}
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	test('バリデートを行った場合は設定されること', function() {
		this.formController.validate();
		ok($('.inputA').hasClass(this.errorClassName), 'クラスが設定されること');
	});

	asyncTest('focus時に設定されること', function() {
		var $inputA = $('.inputA');
		$inputA.focus();
		var that = this;
		gate({
			func: function() {
				return $inputA.hasClass(that.errorClassName);
			},
			maxWait: 1000,
			failMsg: 'クラスが設定されない'
		}).done(function() {
			ok($inputA.hasClass(that.errorClassName), 'クラスが設定されること');
		}).always(start);
	});

	asyncTest('blur時に設定されないこと', function() {
		var $inputA = $('.inputA');
		$inputA.blur();
		var that = this;
		gate({
			func: function() {
				return $inputA.hasClass(that.errorClassName);
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'クラスが設定される');
		}).fail(function() {
			ok(!$inputA.hasClass(that.errorClassName), 'クラスが設定されないこと');
		}).always(start);
	});

	asyncTest('keyup時に設定されること', function() {
		var $inputA = $('.inputA');
		$inputA.keyup();
		var that = this;
		gate({
			func: function() {
				return $inputA.hasClass(that.errorClassName);
			},
			maxWait: 1000,
			failMsg: 'クラスが設定されない'
		}).done(function() {
			ok($inputA.hasClass(that.errorClassName), 'クラスが設定されること');
		}).always(start);
	});

	asyncTest('change時に設定されないこと', function() {
		var $inputA = $('.inputA');
		$inputA.change();
		var that = this;
		gate({
			func: function() {
				return $inputA.hasClass(that.errorClassName);
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'クラスが設定される');
		}).fail(function() {
			ok(!$inputA.hasClass(that.errorClassName), 'クラスが設定されないこと');
		}).always(start);
	});

	asyncTest('click時に設定されないこと', function() {
		var $inputA = $('.inputA');
		$inputA.click();
		var that = this;
		gate({
			func: function() {
				return $inputA.hasClass(that.errorClassName);
			},
			maxWait: 1000
		}).done(function() {
			ok(false, 'クラスが設定される');
		}).fail(function() {
			ok(!$inputA.hasClass(that.errorClassName), 'クラスが設定されないこと');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('全プラグイン共通の設定 off', {
		setup: function() {
			stop();
			this.errorClassName = 'failValidate';
			var that = this;
			var containerClass = '.testContainer';
			var html = '<form class="testForm"><div class="testContainer"></div>';
			html += '<input class="inputA" name="a"></form>';
			$('body').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput(['asyncIndicator', 'composition', 'message', 'balloon', 'bsBalloon',
						'style']);
				this.setSetting({
					output: {
						asyncIndicator: {
							replaceElement: containerClass,
							off: true
						},
						composition: {
							container: containerClass,
							off: true
						},
						message: {
							wrapper: '<li class="testMessage">',
							off: true
						},
						balloon: {
							off: true
						},
						bsBalloon: {
							off: true
						},
						style: {
							errorClassName: that.errorClassName,
							off: true
						}
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('asyncIndicatorプラグインが無効になること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			a: {
				customFunc: function() {
					var dfd = h5.async.deferred();
					setTimeout(function() {
						dfd.resolve();
					}, 500);
					return dfd.promise();
				}
			}
		});
		var result = formCtrl.validate();
		result.addEventListener('validateComplete', function() {
			start();
		});
		var $indicator = $('.h5-indicator');
		strictEqual($indicator.length, 0, 'asyncIndicatorプラグインが無効になること');
	});

	test('compositionプラグインが無効になること', function() {
		this.formController.validate();
		strictEqual($('.testContainer').text(), '', 'compositionプラグインが無効になること');
	});

	test('messageプラグインが無効になること', function() {
		this.formController.validate();
		strictEqual($('.testMessage').length, 0, 'messageプラグインが無効になること');
	});

	test('balloonプラグインが無効になること', function() {
		this.formController.validate();
		strictEqual($('.validation-balloon').length, 0, 'balloonプラグインが無効になること');
	});

	test('bsBalloonプラグインが無効になること', function() {
		this.formController.validate();
		strictEqual($('.tooltip').length, 0, 'bsBalloonプラグインが無効になること');
	});

	test('styleプラグインが無効になること', function() {
		this.formController.validate();
		strictEqual($(this.errorClassName).length, 0, 'styleプラグインが無効になっている');
	});

	//=============================
	// Definition
	//=============================
	module('メッセージを表示するプラグインで共通の設定 Compositionプラグイン', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><div class="testContainer"></div>';
			html += '<input class="inputA" name="a"></form>';
			$('body').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput('composition');
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	test('バリデーション対象のプロパティに対応する表示名 displayName を設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				composition: {
					container: '.testContainer',
					displayName: 'composition displayName'
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.testContainer').text(), 'composition displayNameは必須項目です',
				'バリデーション対象のプロパティに対応する表示名 displayName を設定できること');
	});

	test('バリデートエラー時に表示するメッセージ文字列 message を設定できること', function() {
		var errorMessage = 'errorMessage';
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				composition: {
					container: '.testContainer',
					message: errorMessage
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.testContainer').text(), errorMessage,
				'バリデートエラー時に表示するメッセージ文字列 message を設定できること');
	});

	test('バリデートエラー時に表示するメッセージ生成関数 message を設定できること', function() {
		var errorMessage = 'errorMessage';
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				composition: {
					container: '.testContainer',
					message: function(param) {
						return errorMessage;
					}
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.testContainer').text(), errorMessage,
				'バリデートエラー時に表示するメッセージ生成関数 message を設定できること');
	});

	//=============================
	// Definition
	//=============================
	module('メッセージを表示するプラグインで共通の設定 messageプラグイン', {
		setup: function() {
			stop();
			var html = '<form class="testForm">';
			html += '<input class="inputA" name="a"></form>';
			$('body').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput('message');
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	test('バリデーション対象のプロパティに対応する表示名 displayName を設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				message: {
					wrapper: '<span class="messageWrapper">',
					displayName: 'message displayName'
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.messageWrapper').text(), 'message displayNameは必須項目です',
				'バリデーション対象のプロパティに対応する表示名 displayName を設定できること');
	});

	test('バリデートエラー時に表示するメッセージ文字列 message を設定できること', function() {
		var errorMessage = 'errorMessage';
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				message: {
					wrapper: '<span class="messageWrapper">',
					message: errorMessage
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.messageWrapper').text(), errorMessage,
				'バリデートエラー時に表示するメッセージ文字列 message を設定できること');
	});

	test('バリデートエラー時に表示するメッセージ生成関数 message を設定できること', function() {
		var errorMessage = 'errorMessage';
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				message: {
					wrapper: '<span class="messageWrapper">',
					message: function(param) {
						return errorMessage;
					}
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.messageWrapper').text(), errorMessage,
				'バリデートエラー時に表示するメッセージ生成関数 message を設定できること');
	});

	//=============================
	// Definition
	//=============================
	module('メッセージを表示するプラグインで共通の設定 balloonプラグイン', {
		setup: function() {
			stop();
			var html = '<form class="testForm">';
			html += '<input class="inputA" name="a"></form>';
			$('body').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput('balloon');
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	test('バリデーション対象のプロパティに対応する表示名 displayName を設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					displayName: 'balloon displayName'
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.validation-balloon').text(), 'balloon displayNameは必須項目です',
				'バリデーション対象のプロパティに対応する表示名 displayName を設定できること');
	});

	test('バリデートエラー時に表示するメッセージ文字列 message を設定できること', function() {
		var errorMessage = 'errorMessage';
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					message: errorMessage
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.validation-balloon').text(), errorMessage,
				'バリデートエラー時に表示するメッセージ文字列 message を設定できること');
	});

	test('バリデートエラー時に表示するメッセージ生成関数 message を設定できること', function() {
		var errorMessage = 'errorMessage';
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					message: function(param) {
						return errorMessage;
					}
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.validation-balloon').text(), errorMessage,
				'バリデートエラー時に表示するメッセージ生成関数 message を設定できること');
	});

	//=============================
	// Definition
	//=============================
	module('フォーム入力要素基準でエラー表示を行うプラグインで共通の設定 styleプラグイン', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><div class="replaceContainer"></div>';
			html += '<input class="inputA" name="a"></form>';
			$('body').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addOutput('style');
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	test('クラス適用対象要素 replaceElement をDOMで設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				style: {
					successClassName: 'successValidate',
					replaceElement: document.getElementsByClassName('replaceContainer')[0]
				}
			}
		});
		formCtrl.validate();
		ok($('.replaceContainer').hasClass('successValidate'),
				'クラス適用対象要素 replaceElement をDOMで設定できること');
	});

	test('クラス適用対象要素 replaceElement をjQueryで設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				style: {
					successClassName: 'successValidate',
					replaceElement: $('.replaceContainer')
				}
			}
		});
		formCtrl.validate();
		ok($('.replaceContainer').hasClass('successValidate'),
				'クラス適用対象要素 replaceElement をjQueryで設定できること');
	});

	test('クラス適用対象要素 replaceElement をセレクタ文字列で設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				style: {
					successClassName: 'successValidate',
					replaceElement: '.replaceContainer'
				}
			}
		});
		formCtrl.validate();
		ok($('.replaceContainer').hasClass('successValidate'),
				'クラス適用対象要素 replaceElement をセレクタ文字列で設定できること');
	});

	test('クラス適用対象要素 replaceElement を関数で設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				style: {
					successClassName: 'successValidate',
					replaceElement: function() {
						return $('.replaceContainer');
					}
				}
			}
		});
		formCtrl.validate();
		ok($('.replaceContainer').hasClass('successValidate'),
				'クラス適用対象要素 replaceElement を関数でで設定できること');
	});

	//=============================
	// Definition
	//=============================
	module('フォーム入力要素基準でエラー表示を行うプラグインで共通の設定 messageプラグイン', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><div class="replaceContainer"></div>';
			html += '<input class="inputA" name="a"></form>';
			$('body').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				this.addOutput('message');
				start();
			});
		},
		teardown: function() {
			clearController();
			$('.testForm').remove();
		}
	});

	//=============================
	// Body
	//=============================
	test('クラス適用対象要素 replaceElement をDOMで設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				message: {
					replaceElement: document.getElementsByClassName('replaceContainer')[0]
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.replaceContainer').text(), 'aは必須項目です',
				'クラス適用対象要素 replaceElement をDOMで設定できること');
	});

	test('クラス適用対象要素 replaceElement をjQueryで設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				message: {
					replaceElement: $('.replaceContainer')
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.replaceContainer').text(), 'aは必須項目です',
				'クラス適用対象要素 replaceElement をjQueryで設定できること');
	});

	test('クラス適用対象要素 replaceElement をセレクタ文字列で設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				message: {
					successClassName: 'successValidate',
					replaceElement: '.replaceContainer'
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.replaceContainer').text(), 'aは必須項目です',
				'クラス適用対象要素 replaceElement をセレクタ文字列で設定できること');
	});

	test('クラス適用対象要素 replaceElement を関数で設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				message: {
					successClassName: 'successValidate',
					replaceElement: function() {
						return $('.replaceContainer');
					}
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.replaceContainer').text(), 'aは必須項目です',
				'クラス適用対象要素 replaceElement を関数でで設定できること');
	});

	//=============================
	// Definition
	//=============================
	module(
			'フォーム入力要素基準でエラー表示を行うプラグインで共通の設定 balloonプラグイン',
			{
				setup: function() {
					stop();
					var html = '<form class="testForm">';
					html += '<div class="replaceContainer" style="height:10px; width: 100px; border: solid 1px;"></div>';
					html += '<input class="inputA" name="a"></form>';
					$('#qunit-fixture').append(html);

					this.formController = h5.core.controller('.testForm', h5.ui.FormController);
					this.formController.readyPromise.done(function() {
						this.addRule({
							a: {
								required: true
							}
						});
						this.addOutput('balloon');
						start();
					});
				},
				teardown: function() {
					clearController();
					$('.validation-balloon').remove();
				}
			});

	//=============================
	// Body
	//=============================
	asyncTest('クラス適用対象要素 replaceElement をDOMで設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					replaceElement: document.getElementsByClassName('replaceContainer')[0]
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				$('.validation-balloon').length === 1;
			},
			failMsg: 'バルーンが表示されない',
			maxWait: 1000
		}).done(
				function() {
					strictEqual($('.replaceContainer').next('.validation-balloon').length, 1,
							'クラス適用対象要素 replaceElement をDOMで設定できること');
				}).always(start);
	});

	asyncTest('クラス適用対象要素 replaceElement をjQueryで設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					replaceElement: $('.replaceContainer')
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				$('.validation-balloon').length === 1;
			},
			failMsg: 'バルーンが表示されない',
			maxWait: 1000
		}).done(
				function() {
					strictEqual($('.replaceContainer').next('.validation-balloon').length, 1,
							'クラス適用対象要素 replaceElement をjQueryで設定できること');
				}).always(start);
	});

	asyncTest('クラス適用対象要素 replaceElement をセレクタ文字列で設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					successClassName: 'successValidate',
					replaceElement: '.replaceContainer'
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				$('.validation-balloon').length === 1;
			},
			failMsg: 'バルーンが表示されない',
			maxWait: 1000
		}).done(
				function() {
					strictEqual($('.replaceContainer').next('.validation-balloon').length, 1,
							'クラス適用対象要素 replaceElement をセレクタ文字列で設定できること');
				}).always(start);
	});

	asyncTest('クラス適用対象要素 replaceElement を関数で設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					successClassName: 'successValidate',
					replaceElement: function() {
						return $('.replaceContainer');
					}
				}
			}
		});
		formCtrl.validate();
		$('.inputA').focus();
		gate({
			func: function() {
				$('.validation-balloon').length === 1;
			},
			failMsg: 'バルーンが表示されない',
			maxWait: 1000
		}).done(
				function() {
					strictEqual($('.replaceContainer').next('.validation-balloon').length, 1,
							'クラス適用対象要素 replaceElement を関数でで設定できること');
				}).always(start);

	});

	//=============================
	// Definition
	//=============================
	module(
			'フォーム入力要素基準でエラー表示を行うプラグインで共通の設定 asyncIndicatorプラグイン',
			{
				setup: function() {
					stop();
					var html = '<form class="testForm">';
					html += '<div class="replaceContainer" style="height:10px; width: 100px; border: solid 1px;"></div>';
					html += '<input class="inputA" name="a"></form>';
					$('body').append(html);

					this.formController = h5.core.controller('.testForm', h5.ui.FormController);
					this.formController.readyPromise.done(function() {
						this.addRule({
							a: {
								customFunc: function() {
									var dfd = h5.async.deferred();
									setTimeout(function() {
										dfd.resolve();
									}, 500);
									return dfd.promise();
								}
							}
						});
						this.addOutput('asyncIndicator');
						start();
					});
				},
				teardown: function() {
					clearController();
					$('.testForm').remove();
				}
			});

	//=============================
	// Body
	//=============================
	asyncTest('クラス適用対象要素 replaceElement をDOMで設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				asyncIndicator: {
					replaceElement: document.getElementsByClassName('replaceContainer')[0]
				}
			}
		});
		var result = formCtrl.validate();
		result.addEventListener('validateComplete', function() {
			start();
		});
		strictEqual($('.replaceContainer > .h5-indicator').length, 1,
				'replaceElementの子要素にインジケータが表示されること');
	});

	asyncTest('クラス適用対象要素 replaceElement をjQueryで設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				asyncIndicator: {
					replaceElement: $('.replaceContainer')
				}
			}
		});
		var result = formCtrl.validate();
		result.addEventListener('validateComplete', function() {
			start();
		});
		strictEqual($('.replaceContainer > .h5-indicator').length, 1,
				'replaceElementの子要素にインジケータが表示されること');
	});

	asyncTest('クラス適用対象要素 replaceElement をセレクタ文字列で設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				asyncIndicator: {
					replaceElement: '.replaceContainer'
				}
			}
		});
		var result = formCtrl.validate();
		result.addEventListener('validateComplete', function() {
			start();
		});
		strictEqual($('.replaceContainer > .h5-indicator').length, 1,
				'replaceElementの子要素にインジケータが表示されること');
	});

	asyncTest('クラス適用対象要素 replaceElement を関数で設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				asyncIndicator: {
					replaceElement: function() {
						return $('.replaceContainer');
					}
				}
			}
		});
		var result = formCtrl.validate();
		result.addEventListener('validateComplete', function() {
			start();
		});
		strictEqual($('.replaceContainer > .h5-indicator').length, 1,
				'replaceElementの子要素にインジケータが表示されること');
	});

	//=============================
	// Definition
	//=============================
	module('グループバリデート', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><div data-h5-input-group-container="testGroup">';
			html += '<input class="inputA" name="a"><input class="inputB" name="b">';
			html += '</div></form>';
			$('#qunit-fixture').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('グループに対してバリデートルールを追加できること',
			function() {
				var formCtrl = this.formController;
				formCtrl.addRule({
					testGroup: {
						customFunc: function(value) {
							var valA = value.a;
							var valB = value.b;
							return valA !== '' && valB !== '';
						}
					}
				});
				var result = formCtrl.validate();
				strictEqual($.inArray('testGroup', result.invalidProperties), 0,
						'グループに対してバリデートルールを追加できること');
			});

	test('グループの中身について個別にバリデートルールを追加できること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			testGroup: {
				customFunc: function(value) {
					var valA = value.a;
					var valB = value.b;
					return valA !== '' && valB !== '';
				}
			},
			a: {
				size: [5, 10]
			}
		});
		$('.inputA').val('xxx');
		var result = formCtrl.validate();
		strictEqual($.inArray('a', result.invalidProperties), 0, '個別にバリデートルールを追加できること');
	});

	test('グループに対してバリデートルールを削除できること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			testGroup: {
				customFunc: function(value) {
					var valA = value.a;
					var valB = value.b;
					return valA !== '' && valB !== '';
				}
			}
		});
		formCtrl.removeRule('testGroup');
		var result = formCtrl.validate();
		ok(result.isValid, 'グループに対してバリデートルールを削除できること');
	});

	test('グループの中身について個別にバリデートルールを削除できること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			testGroup: {
				customFunc: function(value) {
					var valA = value.a;
					var valB = value.b;
					return valA !== '' && valB !== '';
				}
			},
			a: {
				size: [5, 10]
			}
		});
		formCtrl.removeRule('a');
		$('.inputA').val('xxx');
		var result = formCtrl.validate();
		strictEqual($.inArray('a', result.validProperties), 0, '個別にバリデートルールを削除できること');
	});

	test('グループに対してバリデートをかけられること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			testGroup: {
				customFunc: function(value) {
					var valA = value.a;
					var valB = value.b;
					return valA !== '' && valB !== '';
				}
			}
		});
		var result = formCtrl.validate('testGroup');
		strictEqual($.inArray('testGroup', result.invalidProperties), 0, 'グループに対してバリデートをかけられること');
	});

	test('グループの中身について個別にバリデートをかけられること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			testGroup: {
				customFunc: function(value) {
					var valA = value.a;
					var valB = value.b;
					return valA !== '' && valB !== '';
				}
			},
			a: {
				required: true
			}
		});
		$('.inputA').val('xxx');
		var result = formCtrl.validate('a');
		strictEqual($.inArray('a', result.validProperties), 0, 'グループの中身について個別にバリデートをかけられること');
	});

	//=============================
	// Definition
	//=============================
	module('フォームコントローラの設定 isArray', {
		setup: function() {
			stop();
			var html = '<form class="testForm">';
			html += '<input type="checkbox" class="checkA" name="a" checked>';
			html += '<input type="checkbox" class="checkB" name="a">';
			html += '</form>';
			$('#qunit-fixture').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('デフォルトはfalseであること', function() {
		var value = this.formController.getValue();
		strictEqual(typeof value['a'], 'string', 'name属性が同じフォーム入力要素が複数あっても配列以外で返ってくるためfalseである');
	});

	test('trueを設定したプロパティは値を必ず配列で取得できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				a: {
					isArray: true
				}
			}
		});
		var value = formCtrl.getValue();
		ok($.isArray(value['a']), '結果が配列で返ってくること');
	});

	//=============================
	// Definition
	//=============================
	module('フォームコントローラの設定 srcElement', {
		setup: function() {
			stop();
			var html = '<form class="testForm">';
			html += '<input class="inputA" name="a">';
			html += '</form><input class="inputB" name="b" value="valueB">';
			$('#qunit-fixture').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('プロパティに対応する要素をDOMで設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				a: {
					srcElement: document.getElementsByClassName('inputB')
				}
			}
		});
		var result = formCtrl.validate();
		ok(result.isValid, 'プロパティに対応する要素をDOMで設定できること');
	});

	test('プロパティに対応する要素をjQueryで設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				a: {
					srcElement: $('.inputB')
				}
			}
		});
		var result = formCtrl.validate();
		ok(result.isValid, 'プロパティに対応する要素をjQueryで設定できること');
	});


	test('プロパティに対応する要素をセレクタ文字列で設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				a: {
					srcElement: 'inputB'
				}
			}
		});
		var result = formCtrl.validate();
		ok(result.isValid, 'プロパティに対応する要素をセレクタ文字列で設定できること');
	});

	//=============================
	// Definition
	//=============================
	module('フォームコントローラの設定 valueFunc', {
		setup: function() {
			stop();
			var html = '<form class="testForm">';
			html += '<input class="inputA" name="a">';
			html += '<div class="valueContainer">test</div></form>';
			$('#qunit-fixture').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('指定した値取得関数によって値を取得できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				a: {
					valueFunc: function(root, prop) {
						return 'val';
					}
				}
			}
		});
		var result = formCtrl.validate();
		ok(result.isValid, 'valueFuncで返した値でバリデートされること');
	});

	test('valueFuncの第1引数にFormControllerのルートエレメント、第2引数に対象プロパティ名が入っていること', function() {
		var formCtrl = this.formController;
		var rootElement;
		var propertyName;
		formCtrl.setSetting({
			property: {
				a: {
					valueFunc: function(root, prop) {
						rootElement = root;
						propertyName = prop;
						return 'val';
					}
				}
			}
		});
		formCtrl.validate();
		strictEqual(rootElement, formCtrl.rootElement,
				'valueFuncの第1引数にFormControllerのルートエレメントが渡されること');
		strictEqual(propertyName, 'a', 'valueFuncの第2引数にプロパティ名が渡されること');
	});

	test('srcElementを指定した場合は第1引数に指定した要素が入っていること', function() {
		var formCtrl = this.formController;
		var srcElement = $('.valueContainer')[0];
		var element;
		formCtrl.setSetting({
			property: {
				a: {
					srcElement: srcElement,
					valueFunc: function(elem, prop) {
						element = elem;
						return 'val';
					}
				}
			}
		});
		formCtrl.validate();
		strictEqual(element.className, srcElement.className, 'valueFuncの第1引数にsrcElementが渡されること');
	});

	//=============================
	// Definition
	//=============================
	module('サブミット', {
		setup: function() {
			stop();
			//			QUnit.config.testTimeout = 1000;
			var html = '<form class="testForm">';
			html += '<input class="inputA" name="a">';
			html += '</form>';
			$('#qunit-fixture').append(html);

			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				this.addRule({
					a: {
						required: true
					}
				});
				start();
			});
		},
		teardown: function() {
			clearController();
			//			QUnit.config.testTimeout = undefined;
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('バリデートエラーが有った場合は送信をキャンセルすること', function() {
		$('.testForm').submit();
		var formCtrl = this.formController;
		$('.testForm').on('submit', function(ev) {
			ok(false, '送信がキャンセルされない');
			start();
		});
		formCtrl.validate();
		setTimeout(function() {
			ok(true, '送信をキャンセルすること');
			start();
		}, 0);
	});

	//	asyncTest('バリデートエラーがなければ送信すること', function() {
	//		$('.inputA').val('xxx');
	//		var $form = $('.testForm');
	//		$form.on('submit', function(ev) {
	//			ev.preventDefault();
	//			ev.stopImmediatePropagation();
	//			ok(true, '送信すること');
	//
	//		});
	//		$form.submit();
	//	});

	test('バリデートエラーが有った場合は有効になっているプラグインの出力がされること', function() {
		var formCtrl = this.formController;
		formCtrl.addOutput('style');
		formCtrl.setSetting({
			output: {
				style: {
					errorClassName: 'failValidate'
				}
			}
		});
		$('.testForm').submit();
		ok($('.inputA').hasClass('failValidate'), 'プラグインの出力がされること');
	});

	//=============================
	// Definition
	//=============================
	module('h5.ui.validation.MessageOutputController addMessageSetting()', {
		setup: function() {
			stop();
			this.validateLogic = h5.core.logic(h5.validation.FormValidationLogic);
			this.messageOutputCtrl = h5.core.controller('#qunit-fixture',
					h5.ui.validation.MessageOutputController);
			this.messageOutputCtrl.readyPromise.done(function() {
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('メッセージをValidationResultから出力する場合の設定を行えること', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		logic.addRule({
			a: {
				required: true
			}
		});
		var result = logic.validate({
			a: ''
		});
		var message = msgOutputCtrl.getMessageByValidationResult(result, 'a');
		strictEqual(message, '入力要素Aが違反しています', 'メッセージをValidationResultから出力する場合の設定を行えること');
	});

	test('プロパティごとの設定が行えること', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			},
			b: {
				displayName: '入力要素B',
				message: '{displayName}が違反しています'
			}
		});
		logic.addRule({
			a: {
				required: true
			},
			b: {
				required: true
			}
		});
		var result = logic.validate({
			a: '',
			b: ''
		});
		var messageA = msgOutputCtrl.getMessageByValidationResult(result, 'a');
		var messageB = msgOutputCtrl.getMessageByValidationResult(result, 'b');
		strictEqual(messageA, '入力要素Aが違反しています', 'プロパティごとの設定が行えること');
		strictEqual(messageB, '入力要素Bが違反しています', 'プロパティごとの設定が行えること');
	});

	test('既に設定済みのプロパティがある場合は上書きとなること', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		logic.addRule({
			a: {
				required: true
			}
		});
		// 設定を上書き
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: 'xxx',
				message: '{displayName}が違反しています'
			}
		});
		var result = logic.validate({
			a: ''
		});
		var message = msgOutputCtrl.getMessageByValidationResult(result, 'a');
		strictEqual(message, 'xxxが違反しています', '既に設定済みのプロパティがある場合は上書きとなること');
	});

	//=============================
	// Definition
	//=============================
	module('h5.ui.validation.MessageOutputController appendMessageByValidationResult()', {
		setup: function() {
			stop();
			var $fixture = $('#qunit-fixture');
			$fixture.append('<div class="messageContainer"></div>');
			this.$container = $('.messageContainer');
			this.validateLogic = h5.core.logic(h5.validation.FormValidationLogic);
			this.messageOutputCtrl = h5.core.controller('#qunit-fixture',
					h5.ui.validation.MessageOutputController);
			this.messageOutputCtrl.readyPromise.done(function() {
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('第1引数のValidationResultからメッセージを作成してコンテナに追加表示できること', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		var $container = this.$container;
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		msgOutputCtrl.setContainer('.messageContainer');
		logic.addRule({
			a: {
				required: true
			}
		});
		var result = logic.validate({
			a: ''
		});
		msgOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual($container.text(), '入力要素Aが違反しています', 'コンテナにメッセージが追加表示されること');
	});

	asyncTest('ValidationResultが非同期バリデート待ちの場合は結果が返ってきたときにメッセージを表示すること', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		var $container = this.$container;
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		msgOutputCtrl.setContainer('.messageContainer');
		logic.addRule({
			a: {
				customFunc: function() {
					var dfd = h5.async.deferred();
					setTimeout(function() {
						dfd.reject();
					}, 0);
					return dfd.promise();
				}
			}
		});
		var result = logic.validate({
			a: ''
		});
		result.addEventListener('validateComplete', function() {
			strictEqual($container.text(), '入力要素Aが違反しています',
					'ValidationResultが非同期バリデート待ちの場合は結果が返ってきたときにメッセージを表示すること');
			start();
		});
		msgOutputCtrl.appendMessageByValidationResult(result, 'a');
	});

	test('setContainer()でコンテナを未設定の場合は何も表示しないこと', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		logic.addRule({
			a: {
				required: true
			}
		});
		var result = logic.validate({
			a: ''
		});
		msgOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual(this.$container.text(), '', 'setContainer()でコンテナを未設定の場合は何も表示しないこと');
	});

	//=============================
	// Definition
	//=============================
	module('h5.ui.validation.MessageOutputController getMessageByValidationResult()', {
		setup: function() {
			stop();
			this.validateLogic = h5.core.logic(h5.validation.FormValidationLogic);
			this.messageOutputCtrl = h5.core.controller('#qunit-fixture',
					h5.ui.validation.MessageOutputController);
			this.messageOutputCtrl.readyPromise.done(function() {
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('第1引数のValidationResultから第2引数プロパティのエラーメッセージを作成して返すこと', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		logic.addRule({
			a: {
				required: true
			}
		});
		var result = logic.validate({
			a: ''
		});
		var message = msgOutputCtrl.getMessageByValidationResult(result, 'a');
		strictEqual(message, '入力要素Aが違反しています', 'メッセージをValidationResultから出力する場合の設定を行えること');
	});

	test('第2引数で指定したプロパティがエラーではない場合はnullを返すこと', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		logic.addRule({
			a: {
				required: true
			},
			b: {
				required: true
			}
		});
		var result = logic.validate({
			a: '',
			b: 'valueB'
		});
		var message = msgOutputCtrl.getMessageByValidationResult(result, 'b');
		strictEqual(message, null, '第2引数で指定したプロパティがエラーではない場合はnullを返すこと');
	});

	//=============================
	// Definition
	//=============================
	module('h5.ui.validation.MessageOutputController clearMessage()', {
		setup: function() {
			stop();
			var $fixture = $('#qunit-fixture');
			$fixture.append('<div class="messageContainer"></div>');
			this.validateLogic = h5.core.logic(h5.validation.FormValidationLogic);
			this.messageOutputCtrl = h5.core.controller($fixture,
					h5.ui.validation.MessageOutputController);
			this.messageOutputCtrl.readyPromise.done(function() {
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('setContainer()で設定した出力先からメッセージを削除すること', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		msgOutputCtrl.setContainer($('.messageContainer'));
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		logic.addRule({
			a: {
				required: true
			}
		});
		var result = logic.validate({
			a: ''
		});
		var message = msgOutputCtrl.getMessageByValidationResult(result, 'a');
		strictEqual(message, '入力要素Aが違反しています', 'メッセージをValidationResultから出力する場合の設定を行えること');
	});

	//=============================
	// Definition
	//=============================
	module('h5.ui.validation.MessageOutputController setContainer()', {
		setup: function() {
			stop();
			var $fixture = $('#qunit-fixture');
			$fixture.append('<div class="messageContainer"></div>');
			this.$container = $('.messageContainer');
			this.validateLogic = h5.core.logic(h5.validation.FormValidationLogic);
			this.messageOutputCtrl = h5.core.controller($fixture,
					h5.ui.validation.MessageOutputController);
			this.messageOutputCtrl.readyPromise.done(function() {
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('メッセージ出力先要素をコンテナとして設定すること', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		msgOutputCtrl.setContainer($('.messageContainer'));
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		logic.addRule({
			a: {
				required: true
			}
		});
		msgOutputCtrl.setContainer(this.$container);
		var result = logic.validate({
			a: ''
		});
		msgOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual(this.$container.text(), '入力要素Aが違反しています', 'メッセージ出力先要素をコンテナとして設定すること');
	});

	//=============================
	// Definition
	//=============================
	module('h5.ui.validation.MessageOutputController setWrapper()', {
		setup: function() {
			stop();
			var $fixture = $('#qunit-fixture');
			$fixture.append('<div class="messageContainer"></div>');
			this.$container = $('.messageContainer');
			this.validateLogic = h5.core.logic(h5.validation.FormValidationLogic);
			this.messageOutputCtrl = h5.core.controller($fixture,
					h5.ui.validation.MessageOutputController);
			this.messageOutputCtrl.readyPromise.done(function() {
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('メッセージのラッパーを設定すること', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		msgOutputCtrl.setContainer($('.messageContainer'));
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		logic.addRule({
			a: {
				required: true
			}
		});
		msgOutputCtrl.setContainer(this.$container);
		msgOutputCtrl.setWrapper('li');
		var result = logic.validate({
			a: ''
		});
		msgOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual(this.$container.find('li').text(), '入力要素Aが違反しています', 'メッセージがラップされること');
	});

	test('タグ名を指定した場合はタグでラップして出力されること', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		msgOutputCtrl.setContainer($('.messageContainer'));
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		logic.addRule({
			a: {
				required: true
			}
		});
		msgOutputCtrl.setContainer(this.$container);
		msgOutputCtrl.setWrapper('li');
		var result = logic.validate({
			a: ''
		});
		msgOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual(this.$container.find('li').text(), '入力要素Aが違反しています', '指定したタグ名でラップされること');
	});

	test('タグ生成文字列を指定した場合はメッセージを指定された文字列から作成した要素でメッセージをラップすること', function() {
		var msgOutputCtrl = this.messageOutputCtrl;
		var logic = this.validateLogic;
		msgOutputCtrl.setContainer($('.messageContainer'));
		msgOutputCtrl.addMessageSetting({
			a: {
				displayName: '入力要素A',
				message: '{displayName}が違反しています'
			}
		});
		logic.addRule({
			a: {
				required: true
			}
		});
		msgOutputCtrl.setContainer(this.$container);
		msgOutputCtrl.setWrapper('<span class="messageWrapper">');
		var result = logic.validate({
			a: ''
		});
		msgOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual(this.$container.find('.messageWrapper').text(), '入力要素Aが違反しています',
				'指定したタグ生成文字列から作成した要素でメッセージがラップされること');
	});

	//=============================
	// Definition
	//=============================
	module('デフォルトエラーメッセージの確認', {
		setup: function() {
			stop();
			var $fixture = $('#qunit-fixture');
			$fixture.append('<div class="messageContainer"></div>');
			this.$container = $('.messageContainer');
			this.validateLogic = h5.core.logic(h5.validation.FormValidationLogic);
			this.messageOutputCtrl = h5.core.controller($fixture,
					h5.ui.validation.MessageOutputController);
			this.messageOutputCtrl.readyPromise.done(function() {
				this.setContainer($('.messageContainer'));
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('required', function() {
		this.validateLogic.addRule({
			a: {
				required: true
			}
		});
		var result = this.validateLogic.validate({
			a: ''
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual(this.$container.text(), 'aは必須項目です', 'displayName は必須項目です');
	});

	test('min inclusive=true', function() {
		var num = 5;
		this.validateLogic.addRule({
			a: {
				min: [num, true]
			}
		});
		var result = this.validateLogic.validate({
			a: 2
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual(this.$container.text(), 'aは' + num + '以上の数値を入力してください。',
				'displayName は min 以上の数値を入力してください。');
	});

	test('min inclusive=false', function() {
		var num = 5;
		this.validateLogic.addRule({
			a: {
				min: [num, false]
			}
		});
		var result = this.validateLogic.validate({
			a: 2
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual(this.$container.text(), 'aは' + num + 'より大きい数値を入力してください。',
				'displayName は min より大きい数値を入力してください。');
	});

	test('max inclusive=true', function() {
		var num = 5;
		this.validateLogic.addRule({
			a: {
				max: [num, true]
			}
		});
		var result = this.validateLogic.validate({
			a: 10
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual(this.$container.text(), 'aは' + num + '以下の数値を入力してください。',
				'displayName は max 以下の数値を入力してください。');
	});

	test('max inclusive=false', function() {
		var num = 5;
		this.validateLogic.addRule({
			a: {
				max: [num, false]
			}
		});
		var result = this.validateLogic.validate({
			a: 10
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual(this.$container.text(), 'aは' + num + '未満の数値を入力してください。',
				'displayName は max 未満の数値を入力してください。');
	});

	test('pattern', function() {
		var regexp = /[0-9]/;
		this.validateLogic.addRule({
			a: {
				pattern: regexp
			}
		});
		var result = this.validateLogic.validate({
			a: 'x'
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		strictEqual(this.$container.text(), 'aは正規表現' + regexp + 'を満たす文字列を入力してください。',
				'displayName は正規表現 regexp を満たす文字列を入力してください。');
	});

	test('digits', function() {
		var intNum = 3;
		var frunctionNum = 5;
		this.validateLogic.addRule({
			a: {
				digits: [intNum, frunctionNum]
			}
		});
		var result = this.validateLogic.validate({
			a: '1234.123456'
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		var expectMsg = 'aは整数部分' + intNum + '桁、小数部分' + frunctionNum + '桁以下の数値を入力してください。';
		strictEqual(this.$container.text(), expectMsg,
				'displayName は整数部分 integer 桁、小数部分 fruction 桁以下の数値を入力してください。');
	});

	test('size',
			function() {
				var min = 1;
				var max = 10;
				this.validateLogic.addRule({
					a: {
						size: [min, max]
					}
				});
				var result = this.validateLogic.validate({
					a: 100
				});
				this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
				var expectMsg = 'aは' + min + '以上' + max + '以下の長さでなければいけません。';
				strictEqual(this.$container.text(), expectMsg,
						'displayName は min 以上 max 以下の長さでなければいけません。');
			});

	test('future', function() {
		this.validateLogic.addRule({
			a: {
				future: true
			}
		});
		var result = this.validateLogic.validate({
			a: new Date().getTime() - 100
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		var expectMsg = 'aは現在時刻より未来の時刻を入力してください。';
		strictEqual(this.$container.text(), expectMsg, 'displayName は現在時刻より未来の時刻を入力してください。');
	});

	test('past', function() {
		this.validateLogic.addRule({
			a: {
				past: true
			}
		});
		var result = this.validateLogic.validate({
			a: new Date().getTime() + 60000
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		var expectMsg = 'aは現在時刻より過去の時刻を入力してください。';
		strictEqual(this.$container.text(), expectMsg, 'displayName は現在時刻より過去の時刻を入力してください。');
	});

	test('assertNull', function() {
		this.validateLogic.addRule({
			a: {
				assertNull: true
			}
		});
		var result = this.validateLogic.validate({
			a: 'xxx'
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		var expectMsg = 'aはnullでなければなりません。';
		strictEqual(this.$container.text(), expectMsg, 'displayName はnullでなければなりません。');
	});

	test('assertNotNull', function() {
		this.validateLogic.addRule({
			a: {
				assertNotNull: true
			}
		});
		var result = this.validateLogic.validate({
			a: null
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		var expectMsg = 'aはnullでない値を設定してください。';
		strictEqual(this.$container.text(), expectMsg, 'displayName はnullでない値を設定してください。');
	});

	test('assertFalse', function() {
		this.validateLogic.addRule({
			a: {
				assertFalse: true
			}
		});
		var result = this.validateLogic.validate({
			a: true
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		var expectMsg = 'aはfalseとなる値を入力してください。';
		strictEqual(this.$container.text(), expectMsg, 'displayName はfalseとなる値を入力してください。');
	});

	test('assertTrue', function() {
		this.validateLogic.addRule({
			a: {
				assertTrue: true
			}
		});
		var result = this.validateLogic.validate({
			a: false
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		var expectMsg = 'aはtrueとなる値を入力してください。';
		strictEqual(this.$container.text(), expectMsg, 'displayName はtrueとなる値を入力してください。');
	});

	test('assertTrue', function() {
		this.validateLogic.addRule({
			a: {
				customFunc: function() {
					return false;
				}
			}
		});
		var result = this.validateLogic.validate({
			a: false
		});
		this.messageOutputCtrl.appendMessageByValidationResult(result, 'a');
		var expectMsg = 'aは条件を満たしません';
		strictEqual(this.$container.text(), expectMsg, 'displayName は条件を満たしません');
	});

});
