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

	test('nullが渡された場合は何もしないこと', function() {
		this.formController.addRule({
			a: {
				required: true
			}
		});
		this.formController.addRule({
			a: null
		});
		var result = this.formController.validate();
		ok(!result.isValid, 'nullでルールが上書きされていないこと');
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
					html += '<input name="e" type="checkbox">';
					html += '<input name="f" type="radio" checked>';
					html += '<input name="g" type="radio">';
					html += '<input name="h" type="file">';
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

	test('各name属性の値を取得できること', function() {
		var result = this.formController.getValue();
		strictEqual(result['a'], '', 'valueを取得できること');
		strictEqual(result['b'], 'on', 'checkboxがcheckedの場合はvalueを取得できること');
		strictEqual(result['c'], '', 'textareaのvalueを取得できること');
		strictEqual(result['d'], 'selectA', 'selectのvalueを取得できること');
		strictEqual(result['e'], null, 'checkboxがcheckedでない場合はnullを取得できること');
		strictEqual(result['f'], 'on', 'radioがcheckedの場合はvalueを取得できること');
		strictEqual(result['g'], undefined, 'radioがcheckedでない場合は取得できないこと');
		strictEqual(result['h'], undefined, 'fileのを取得できないこと');
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

			var dfd = this.dfd = h5.async.deferred();
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				formCtrl.addRule({
					a: {
						customFunc: function(v) {
							return dfd.promise();
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
	asyncTest('asyncIndicatorプラグインを有効化できること', function() {
		var formCtrl = this.formController;
		var dfd = this.dfd;

		var pluginName = 'asyncIndicator';
		formCtrl.addOutput(pluginName);
		var asyncIndicatorPlugin = formCtrl.getOutput(pluginName);
		asyncIndicatorPlugin.readyPromise.done(function() {
			ok(asyncIndicatorPlugin
					&& asyncIndicatorPlugin.__name === 'h5.ui.validation.AsyncIndicator',
					'asyncIndicatorプラグインが有効化されていること');
			start();
		});
	});

	asyncTest('非同期バリデート中の項目にインジケータが表示されること', function() {
		var formCtrl = this.formController;
		var dfd = this.dfd;

		var pluginName = 'asyncIndicator';
		formCtrl.addOutput(pluginName);
		formCtrl.getOutput(pluginName).readyPromise.done(function() {
			// 同期バリデート
			formCtrl.validate();

			// インジケータを表示するため待つ
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 1,
						'非同期バリデート対象要素にインジケータが表示されること');
				start();
			}, 0);
		});
	});

	//=============================
	// Definition
	//=============================
	module('asyncIndicatorプラグイン 全体バリデートを行った場合', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			$('#qunit-fixture').append(html);

			var dfd = this.dfd = h5.async.deferred();
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'asyncIndicator';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							customFunc: function(v) {
								return dfd.promise();
							}
						}
					});

					// 全体バリデートを行う
					formCtrl.validate();

					// インジケータを表示するため待つ
					setTimeout(function() {
						start();
					}, 0);
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
	asyncTest('バリデートを行った場合はインジケータの表示が変更されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 1,
				'全体バリデートによって非同期バリデート対象要素にインジケータが表示されること');

		// インジケータ表示中にvalidateを実行
		formCtrl.validate();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 1,
					'validateによってインジケータの表示・非表示が変更されないこと');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('focus時にインジケータの表示が変更されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 1,
				'全体バリデートによって非同期バリデート対象要素にインジケータが表示されること');

		// インジケータ表示中にfocusを実行
		$('.inputA').focus();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 1,
					'focusによってインジケータの表示・非表示が変更されないこと');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('blur時にインジケータの表示が変更されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 1,
				'全体バリデートによって非同期バリデート対象要素にインジケータが表示されること');

		// インジケータ表示中にblurを実行
		$('.inputA').blur();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 1,
					'blurによってインジケータの表示・非表示が変更されないこと');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('keyup時にインジケータの表示が変更されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 1,
				'全体バリデートによって非同期バリデート対象要素にインジケータが表示されること');

		// インジケータ表示中にkeyupを実行
		$('.inputA').keyup();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 1,
					'keyupによってインジケータの表示・非表示が変更されないこと');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('change時にインジケータの表示が変更されないこと', function() {
		var formCtrl = this.formController;
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 1,
				'全体バリデートによって非同期バリデート対象要素にインジケータが表示されること');

		// インジケータ表示中にchangeを実行
		$('.inputA').change();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 1,
					'changeによってインジケータの表示・非表示が変更されないこと');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('click時にインジケータの表示が変更されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 1,
				'全体バリデートによって非同期バリデート対象要素にインジケータが表示されること');

		// インジケータ表示中にclickを実行
		$('.inputA').click();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 1,
					'clickによってインジケータの表示・非表示が変更されないこと');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	//=============================
	// Definition
	//=============================
	module('asyncIndicatorプラグイン 全体バリデートを行っていない場合', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			$('#qunit-fixture').append(html);

			var dfd = this.dfd = h5.async.deferred();
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'asyncIndicator';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							customFunc: function(v) {
								return dfd.promise();
							}
						}
					});

					// 全体バリデートを行わない
					// インジケータを表示しないので待たない
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
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 0,
				'全体バリデートを行っていないので非同期バリデート対象要素にインジケータが表示されないこと');

		// validateを実行
		formCtrl.validate();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 1,
					'validateによって非同期バリデート対象要素にインジケータが表示されること');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('focus時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 0,
				'全体バリデートを行っていないので非同期バリデート対象要素にインジケータが表示されないこと');

		// focusを実行
		$('.inputA').focus();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 0,
					'focusによって非同期バリデート対象要素にインジケータが表示されないこと');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('blur時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 0,
				'全体バリデートを行っていないので非同期バリデート対象要素にインジケータが表示されないこと');

		// blurを実行
		$('.inputA').blur();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 0,
					'blurによって非同期バリデート対象要素にインジケータが表示されないこと');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('keyup時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 0,
				'全体バリデートを行っていないので非同期バリデート対象要素にインジケータが表示されないこと');

		// keyupを実行
		$('.inputA').keyup();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 0,
					'keyupによって非同期バリデート対象要素にインジケータが表示されないこと');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('change時に表示されること', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 0,
				'全体バリデートを行っていないので非同期バリデート対象要素にインジケータが表示されないこと');

		// インジケータ表示中にchangeを実行
		$('.inputA').change();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 1,
					'changeによって非同期バリデート対象要素にインジケータが表示されること');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	asyncTest('click時に表示されないこと', function() {
		// FIXME input要素にインジケータが表示されようとするのは仕様なのか?
		var formCtrl = this.formController;
		var dfd = this.dfd;

		strictEqual($('form> .inputA >.h5-indicator').length, 0,
				'全体バリデートを行っていないので非同期バリデート対象要素にインジケータが表示されないこと');

		// インジケータ表示中にclickを実行
		$('.inputA').click();

		// インジケータを表示するため待つ
		setTimeout(function() {
			strictEqual($('form> .inputA >.h5-indicator').length, 0,
					'clickによって非同期バリデート対象要素にインジケータが表示されないこと');

			// 非同期のバリデーション
			dfd.resolve({
				valid: true
			});

			// 非同期のバリデーションの後に実行するために処理を遅らせる
			setTimeout(function() {
				strictEqual($('form> .inputA >.h5-indicator').length, 0,
						'非同期バリデートが実行されたことによりインジケータが非表示になること');
				start();
			}, 0);
		}, 0);
	});

	//=============================
	// Definition
	//=============================
	module('asyncIndicatorプラグイン abort', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a" value="v"></form>';
			$('#qunit-fixture').append(html);

			var dfd = this.dfd = h5.async.deferred();
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'asyncIndicator';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							customFunc: function(v) {
								return dfd.promise();
							}
						}
					});
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
	module(
			'バリデート結果出力プラグイン composition',
			{
				setup: function() {
					stop();
					var html = '<form class="testForm"><input class="inputA" name="a"><input class="inputB" name="b"></form>';
					html += '<div class="errorContainer"></div>';
					$('#qunit-fixture').append(html);
					var formCtrl = this.formController = h5.core.controller('.testForm',
							h5.ui.FormController);
					formCtrl.readyPromise.done(function() {
						var pluginName = 'composition';
						formCtrl.addOutput(pluginName);
						formCtrl.getOutput(pluginName).readyPromise.done(function() {
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
	test('compositionプラグインを有効化できること',
			function() {
				var formCtrl = this.formController;
				// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					wrapper: 'li'
				}
			}
		});

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
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					output: {
						composition: {
							container: $('.errorContainer'),
							wrapper: '<span class="errorMessage">'
						}
					}
				});

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
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
				}
			}
		});

		formCtrl.validate();
		strictEqual($('.errorContainer').text(), 'aは必須項目です。', 'リセット前にバリデート結果が表示されていること');
		formCtrl.resetValidation();
		strictEqual($('.errorContainer').text(), '', 'バリデート結果表示をリセットできること');
	});

	test('showAllErrors:trueを設定する場合はこれまでに検出された全ての項目のエラーを出力すること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			},
			b: {
				max: 1
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					showAllErrors: true
				}
			},
			property: {
				a: {
					composition: {
						message: errorMessage
					}
				},
				b: {
					composition: {
						message: errorMessage
					}
				}
			}
		});

		formCtrl.validate('a');
		$('.inputB').val('ok');
		formCtrl.validate('b');

		strictEqual($('.errorContainer').text(), errorMessage + errorMessage,
				'バリデートエラーが有った場合にすべてのエラーメッセージが表示されること');
	});

	test('showAllErrors:falseを設定する場合は最後のエラーのみを出力すること',
			function() {
				var formCtrl = this.formController;
				var errorMessage = 'バリデートに失敗しました';
				formCtrl.addRule({
					a: {
						required: true
					},
					b: {
						max: 1
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					output: {
						composition: {
							container: $('.errorContainer'),
							showAllErrors: false
						}
					},
					property: {
						a: {
							composition: {
								message: errorMessage
							}
						},
						b: {
							composition: {
								message: errorMessage
							}
						}
					}
				});

				formCtrl.validate('a');
				$('.inputB').val('ok');
				formCtrl.validate('b');

				strictEqual($('.errorContainer').text(), errorMessage,
						'バリデートエラーが有った場合に最後のエラーメッセージが表示されること');
			});

	test('showAllErrors:未定義を設定する場合はこれまでに検出された全ての項目のエラーを出力すること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			},
			b: {
				max: 1
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer')
				// showAllErrors未定義
				}
			},
			property: {
				a: {
					composition: {
						message: errorMessage
					}
				},
				b: {
					composition: {
						message: errorMessage
					}
				}
			}
		});

		formCtrl.validate('a');
		$('.inputB').val('ok');
		formCtrl.validate('b');

		strictEqual($('.errorContainer').text(), errorMessage + errorMessage,
				'バリデートエラーが有った場合にすべてのエラーメッセージが表示されること');
	});

	test('hideWhenEmpty:true、エラーが0件ならcontainerで指定された要素を非表示にすること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					hideWhenEmpty: true
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

		var $input = $('.inputA');
		$input.val('ok');
		formCtrl.validate();

		ok($('.errorContainer').is(':hidden'), '非表示になること');
	});

	test('hideWhenEmpty:true、エラーが1件ならcontainerで指定された要素を表示すること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					hideWhenEmpty: true
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

		formCtrl.validate();

		ok($('.errorContainer').is(':visible'), '表示になること');
	});

	test('hideWhenEmpty:false、エラーが0件ならcontainerで指定された要素を表示すること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					hideWhenEmpty: false
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

		var $input = $('.inputA');
		$input.val('ok');
		formCtrl.validate();

		ok($('.errorContainer').is(':visible'), '表示になること');
	});

	test('hideWhenEmpty:false、エラーが1件ならcontainerで指定された要素を表示すること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					hideWhenEmpty: false
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

		formCtrl.validate();

		ok($('.errorContainer').is(':visible'), '表示になること');
	});

	test('hideWhenEmpty:未定義、エラーが0件ならcontainerで指定された要素を非表示にすること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer')
				// hideWhenEmpty未定義
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

		var $input = $('.inputA');
		$input.val('ok');
		formCtrl.validate();

		ok($('.errorContainer').is(':visible'), '表示になること');
	});

	test('hideWhenEmpty:未定義、エラーが1件ならcontainerで指定された要素を表示すること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer')
				// hideWhenEmpty未定義
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

		formCtrl.validate();

		ok($('.errorContainer').is(':visible'), '表示になること');
	});

	test(
			'showAllErrors:false、hideWhenEmpty:trueの場合、1回目のvalidateでエラー1件、2回目のvalidateでエラー0件ならエラーが非表示になること',
			function() {
				var formCtrl = this.formController;
				var errorMessage = 'バリデートに失敗しました';
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					output: {
						composition: {
							container: $('.errorContainer'),
							showAllErrors: false,
							hideWhenEmpty: true
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

				var $input = $('.inputA');

				$input.val('');
				formCtrl.validate();
				ok($('.errorContainer').is(':visible'), '表示になること');
				strictEqual($('.errorContainer').text(), errorMessage,
						'バリデートエラーが有った場合にすべてのエラーメッセージが表示されること');

				$input.val('ok');
				formCtrl.validate();
				ok($('.errorContainer').is(':hidden'), '非表示になること');
			});

	test(
			'showAllErrors:false、hideWhenEmpty:trueの場合、1回目のvalidateでエラー0件、2回目のvalidateでエラー1件ならエラーが表示されていること',
			function() {
				var formCtrl = this.formController;
				var errorMessage = 'バリデートに失敗しました';
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					output: {
						composition: {
							container: $('.errorContainer'),
							showAllErrors: false,
							hideWhenEmpty: true
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

				var $input = $('.inputA');

				$input.val('ok');
				formCtrl.validate();
				ok($('.errorContainer').is(':hidden'), '非表示になること');

				$input.val('');
				formCtrl.validate();
				ok($('.errorContainer').is(':visible'), '表示になること');
				strictEqual($('.errorContainer').text(), errorMessage,
						'バリデートエラーが有った場合にすべてのエラーメッセージが表示されること');
			});

	test('出力プラグインの更新タイミングをupdateOn:blurで指定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					updateOn: 'blur'
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

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// blurの場合
		$errorContainer.text('');
		$input.blur();
		strictEqual($errorContainer.text(), errorMessage, 'blurでバリデートエラーが有った場合にエラーメッセージが表示されること');

		// blur以外の場合
		$errorContainer.text('');
		formCtrl.validate('a');
		strictEqual($errorContainer.text(), '', 'validateでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.change();
		strictEqual($errorContainer.text(), '', 'changeでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.focus();
		strictEqual($errorContainer.text(), '', 'focusでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.keyup();
		strictEqual($errorContainer.text(), '', 'keyupでエラーメッセージが表示されないこと');
	});

	test('出力プラグインの更新タイミングをupdateOn:validateで指定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					updateOn: 'validate'
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

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// validateの場合
		$errorContainer.text('');
		formCtrl.validate('a');
		strictEqual($errorContainer.text(), errorMessage,
				'validateでバリデートエラーが有った場合にエラーメッセージが表示されること');

		// validate以外の場合
		$errorContainer.text('');
		$input.blur();
		strictEqual($errorContainer.text(), '', 'blurでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.change();
		strictEqual($errorContainer.text(), '', 'changeでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.focus();
		strictEqual($errorContainer.text(), '', 'focusでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.keyup();
		strictEqual($errorContainer.text(), '', 'keyupでエラーメッセージが表示されないこと');
	});

	test('出力プラグインの更新タイミングをupdateOn:changeで指定できること',
			function() {
				var formCtrl = this.formController;
				var errorMessage = 'バリデートに失敗しました';
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					output: {
						composition: {
							container: $('.errorContainer'),
							updateOn: 'change'
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

				var $errorContainer = $('.errorContainer');
				var $input = $('.inputA');

				// changeの場合
				$errorContainer.text('');
				$input.change();
				strictEqual($errorContainer.text(), errorMessage,
						'changeでバリデートエラーが有った場合にエラーメッセージが表示されること');

				// change以外の場合
				$errorContainer.text('');
				$input.blur();
				strictEqual($errorContainer.text(), '', 'blurでエラーメッセージが表示されないこと');

				$errorContainer.text('');
				formCtrl.validate('a');
				strictEqual($errorContainer.text(), '', 'validateでエラーメッセージが表示されないこと');

				$errorContainer.text('');
				$input.focus();
				strictEqual($errorContainer.text(), '', 'focusでエラーメッセージが表示されないこと');

				$errorContainer.text('');
				$input.keyup();
				strictEqual($errorContainer.text(), '', 'keyupでエラーメッセージが表示されないこと');
			});

	test('出力プラグインの更新タイミングをupdateOn:focusで指定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					updateOn: 'focus'
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

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// focusの場合
		$errorContainer.text('');
		$input.focus();
		strictEqual($errorContainer.text(), errorMessage, 'focusでバリデートエラーが有った場合にエラーメッセージが表示されること');

		// focus以外の場合
		$errorContainer.text('');
		$input.blur();
		strictEqual($errorContainer.text(), '', 'blurでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		formCtrl.validate('a');
		strictEqual($errorContainer.text(), '', 'validateでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.change();
		strictEqual($errorContainer.text(), '', 'changeでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.keyup();
		strictEqual($errorContainer.text(), '', 'keyupでエラーメッセージが表示されないこと');
	});

	test('出力プラグインの更新タイミングをupdateOn:keyupで指定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					updateOn: 'keyup'
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

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// keyupの場合
		$errorContainer.text('');
		$input.keyup();
		strictEqual($errorContainer.text(), errorMessage, 'keyupでバリデートエラーが有った場合にエラーメッセージが表示されること');

		// keyup以外の場合
		$errorContainer.text('');
		$input.blur();
		strictEqual($errorContainer.text(), '', 'blurでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		formCtrl.validate('a');
		strictEqual($errorContainer.text(), '', 'validateでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.change();
		strictEqual($errorContainer.text(), '', 'changeでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.focus();
		strictEqual($errorContainer.text(), '', 'focusでエラーメッセージが表示されないこと');
	});

	test('出力プラグインの更新タイミングをupdateOn:未定義で指定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer')
				// updateOn未定義
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

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// validateの場合
		$errorContainer.text('');
		formCtrl.validate('a');
		strictEqual($errorContainer.text(), errorMessage,
				'validateでバリデートエラーが有った場合にエラーメッセージが表示されること');

		// validate以外の場合
		$errorContainer.text('');
		$input.blur();
		strictEqual($errorContainer.text(), '', 'blurでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.change();
		strictEqual($errorContainer.text(), '', 'changeでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.focus();
		strictEqual($errorContainer.text(), '', 'focusでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.keyup();
		strictEqual($errorContainer.text(), '', 'keyupでエラーメッセージが表示されないこと');
	});

	test('出力プラグインの更新タイミングをupdateOn:長さ0配列で指定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					updateOn: []
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

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		$errorContainer.text('');
		$input.blur();
		strictEqual($errorContainer.text(), '', 'blurでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		formCtrl.validate('a');
		strictEqual($errorContainer.text(), '', 'validateでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.change();
		strictEqual($errorContainer.text(), '', 'changeでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.focus();
		strictEqual($errorContainer.text(), '', 'focusでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.keyup();
		strictEqual($errorContainer.text(), '', 'keyupでエラーメッセージが表示されないこと');
	});

	test('出力プラグインの更新タイミングをupdateOn:長さ1配列で指定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					updateOn: ['blur']
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

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// blurの場合
		$errorContainer.text('');
		$input.blur();
		strictEqual($errorContainer.text(), errorMessage, 'blurバリデートエラーが有った場合にエラーメッセージが表示されること');

		// blur以外の場合
		$errorContainer.text('');
		formCtrl.validate('a');
		strictEqual($errorContainer.text(), '', 'validateでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.change();
		strictEqual($errorContainer.text(), '', 'changeでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.focus();
		strictEqual($errorContainer.text(), '', 'focusでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.keyup();
		strictEqual($errorContainer.text(), '', 'keyupでエラーメッセージが表示されないこと');
	});

	test('出力プラグインの更新タイミングをupdateOn:長さ2配列で指定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					updateOn: ['blur', 'validate']
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

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// blur、validateの場合
		$errorContainer.text('');
		$input.blur();
		strictEqual($errorContainer.text(), errorMessage, 'blurでバリデートエラーが有った場合にエラーメッセージが表示されること');

		$errorContainer.text('');
		formCtrl.validate('a');
		strictEqual($errorContainer.text(), errorMessage,
				'validateでバリデートエラーが有った場合にエラーメッセージが表示されること');

		// blur、validate以外の場合
		$errorContainer.text('');
		$input.change();
		strictEqual($errorContainer.text(), '', 'changeでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.focus();
		strictEqual($errorContainer.text(), '', 'focusでエラーメッセージが表示されないこと');

		$errorContainer.text('');
		$input.keyup();
		strictEqual($errorContainer.text(), '', 'keyupでエラーメッセージが表示されないこと');
	});

	asyncTest('同期・非同期のバリデーションが混在する場合、validateの直後に同期のメッセージが、validateComplete発火時に非同期のメッセージが表示されること',
			function() {
				var formCtrl = this.formController;
				var errorMessage = '同期バリデートに失敗しました';
				var asyncErrorMessage = '非同期バリデートに失敗しました';
				var dfd = h5.async.deferred();
				formCtrl.addRule({
					a: {
						required: true
					},
					b: {
						customFunc: function(value) {
							return dfd.promise();
						}
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					output: {
						composition: {
							container: $('.errorContainer'),
							updateOn: ['validate']
						}
					},
					property: {
						a: {
							composition: {
								message: errorMessage
							}
						},
						b: {
							composition: {
								message: asyncErrorMessage
							}
						}
					}
				});

				var $errorContainer = $('.errorContainer');
				var $input = $('.inputA');

				// 同期のバリデーション
				var result = formCtrl.validate();

				// 同期メッセージ確認
				strictEqual($errorContainer.text(), errorMessage, '同期時に同期のメッセージが表示されること');

				// 非同期のバリデーション
				dfd.reject({
					valid: false
				});

				// 非同期のバリデーションの後に実行するために処理を遅らせる
				setTimeout(function() {
					// 非同期のメッセージ確認
					strictEqual($errorContainer.text(), errorMessage + asyncErrorMessage,
							'非同期時に非同期のメッセージが表示されること');
					start();
				}, 0);
			});

	test('resetValidationでコンポジションメッセージを空にした場合、hideWhenEmptyがtrueでもコンテナ要素が非表示になること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					hideWhenEmpty: true
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

		formCtrl.validate();
		ok($('.errorContainer').is(':visible'), 'リセット前は表示になること');
		formCtrl.resetValidation();
		ok($('.errorContainer').is(':hidden'), 'リセット後は非表示になること');
	});

	test('エラーを表示した状態で要素をバリデーション対象から外して再バリデートするとエラー表示がなくなること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer')
				}
			},
		});

		formCtrl.validate();
		strictEqual($('.errorContainer').text(), 'aは必須項目です。', '事前にエラーメッセージが表示されること');

		// name="a" の要素をバリデーション対象から除外
		formCtrl.disableRule('a');
		strictEqual($('.errorContainer').text(), 'aは必須項目です。', 'disbaleRule後にエラーメッセージが表示されること');

		var result = formCtrl.validate();
		strictEqual($('.errorContainer').text(), '', '再バリデート後にエラーメッセージが表示されないこと');

		strictEqual(result.properties.length, 0, 'propertiesの長さが0であること');
		strictEqual(result.invalidProperties.length, 0, 'invalidPropertiesの長さが0であること');
		ok(!result.invalidReason.hasOwnProperty('a'), 'invalidReasonnにaというプロパティが存在しないこと');
	});

	test('メッセージがHTMLとして解釈されて<span></span>がタグとして解釈されること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'errorMessage';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					message: '<span>' + errorMessage + '</span>'
				}
			}
		});

		formCtrl.validate();

		var $errorContainer = $('.errorContainer');
		var $span = $errorContainer.children('span');
		strictEqual($span.length, 1, '<span>がタグとして解釈されること');
		strictEqual($span.text(), errorMessage, 'span要素にエラーメッセージが表示されること');
	});

	test('メッセージをエスケープして<span></span>が文字列として解釈されること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'errorMessage';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					message: '&lt;span&gt;' + errorMessage + '&lt;/span&gt;'
				}
			}
		});

		formCtrl.validate();

		var $errorContainer = $('.errorContainer');
		var $span = $errorContainer.children('span');
		strictEqual($span.length, 0, '<span>がタグとして解釈されないこと');
		strictEqual($errorContainer.text(), '<span>' + errorMessage + '</span>',
				'<span>が文字列として表示されること');
	});

	test('hideWhenEmptyをfalse->true->falseと変更していった場合、それぞれの状態で正しく挙動すること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			a: {
				required: true
			}
		});

		var $inputA = $('.inputA');
		var validationResult;
		var $errorContainer = $('.errorContainer');

		// 最初にhideWhenEmptyがfalseの場合
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					hideWhenEmpty: false
				}
			}
		});

		// バリデーションエラーがある状態
		$inputA.val('');
		validationResult = formCtrl.validate();
		strictEqual(validationResult.invalidCount, 1, 'バリデートエラーが出ていること');
		ok($errorContainer.is(':visible'), 'バリデートエラーが出ていて、hideWhenEmptyがfalseの場合コンテナ要素が表示されること');
		ok($errorContainer.hasClass('h5-composition-has-error'),
				'バリデートエラーが出ている場合、hideWhenEmptyに関係なくCSSのエラークラスが付与されていること');

		// バリデーションエラーがない状態
		$inputA.val('hoge');
		validationResult = formCtrl.validate();
		strictEqual(validationResult.invalidCount, 0, 'バリデートエラーが出ていないこと');
		ok($errorContainer.is(':visible'), 'バリデートエラーが出ていなくて、hideWhenEmptyがfalseの場合コンテナ要素が表示されること');
		ok(!$errorContainer.hasClass('h5-composition-has-error'),
				'バリデートエラーが出ていない場合、hideWhenEmptyに関係なくCSSのエラークラスが取り除かれていること');

		// hideWhenEmptyをtrueに変更した場合
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					hideWhenEmpty: true
				}
			}
		});

		// バリデーションエラーがある状態
		$inputA.val('');
		validationResult = formCtrl.validate();
		strictEqual(validationResult.invalidCount, 1, 'バリデートエラーが出ていること');
		ok($errorContainer.is(':visible'), 'バリデートエラーが出ていて、hideWhenEmptyがtrueの場合コンテナ要素が表示されること');
		ok($errorContainer.hasClass('h5-composition-has-error'),
				'バリデートエラーが出ている場合、hideWhenEmptyに関係なくCSSのエラークラスが付与されていること');

		// バリデーションエラーがない状態
		$inputA.val('hoge');
		validationResult = formCtrl.validate();
		strictEqual(validationResult.invalidCount, 0, 'バリデートエラーが出ていないこと');
		ok($errorContainer.is(':hidden'), 'バリデートエラーが出ていなくて、hideWhenEmptyがtrueの場合コンテナ要素が非表示になること');
		ok(!$errorContainer.hasClass('h5-composition-has-error'),
				'バリデートエラーが出ていない場合、hideWhenEmptyに関係なくCSSのエラークラスが取り除かれていること');

		// hideWhenEmptyをfalseに変更した場合
		formCtrl.setSetting({
			output: {
				composition: {
					container: $('.errorContainer'),
					hideWhenEmpty: false
				}
			}
		});

		// バリデーションエラーがある状態
		$inputA.val('');
		validationResult = formCtrl.validate();
		strictEqual(validationResult.invalidCount, 1, 'バリデートエラーが出ていること');
		ok($errorContainer.is(':visible'), 'バリデートエラーが出ていて、hideWhenEmptyがfalseの場合コンテナ要素が表示されること');
		ok($errorContainer.hasClass('h5-composition-has-error'),
				'バリデートエラーが出ている場合、hideWhenEmptyに関係なくCSSのエラークラスが付与されていること');

		// バリデーションエラーがない状態
		$inputA.val('hoge');
		validationResult = formCtrl.validate();
		strictEqual(validationResult.invalidCount, 0, 'バリデートエラーが出ていないこと');
		ok($errorContainer.is(':visible'), 'バリデートエラーが出ていなくて、hideWhenEmptyがfalseの場合コンテナ要素が表示されること');
		ok(!$errorContainer.hasClass('h5-composition-has-error'),
				'バリデートエラーが出ていない場合、hideWhenEmptyに関係なくCSSのエラークラスが取り除かれていること');
	});

	//=============================
	// Definition
	//=============================
	module('compositionプラグイン 全体バリデートを行った場合', {
		setup: function() {
			stop();
			var that = this;
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><input class="inputA" name="a" value="a"></form>';
			html += '<div class="errorContainer"></div>';
			$('#qunit-fixture').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'composition';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							size: [5, 10]
						}
					});

					formCtrl.setSetting({
						output: {
							composition: {
								container: $('.errorContainer'),
								message: that.errorMessage,
								wrapper: 'li'
							}
						}
					});

					// 全体バリデートを行う
					formCtrl.validate();
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
	module(
			'compositionプラグイン 全体バリデートを行っていない場合',
			{
				setup: function() {
					stop();
					var that = this;
					this.errorMessage = 'errorMessage';
					var html = '<form class="testForm"><input class="inputA" name="a" value="hoge"></form>';
					html += '<div class="errorContainer"></div>';
					$('#qunit-fixture').append(html);
					var formCtrl = this.formController = h5.core.controller('.testForm',
							h5.ui.FormController);
					formCtrl.readyPromise.done(function() {
						var pluginName = 'composition';
						formCtrl.addOutput(pluginName);
						formCtrl.getOutput(pluginName).readyPromise.done(function() {
							formCtrl.addRule({
								a: {
									size: [5, 10]
								}
							});

							formCtrl.setSetting({
								output: {
									composition: {
										container: $('.errorContainer'),
										message: that.errorMessage,
										wrapper: 'li'
									}
								}
							});

							// 全体バリデートを行わない
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
	module(
			'バリデート結果出力プラグイン message',
			{
				setup: function() {
					stop();
					this.errorMessage = 'errorMessage';
					var html = '<form class="testForm"><input class="inputA" name="a"><input class="inputB" name="b"></form>';
					$('#qunit-fixture').append(html);
					var formCtrl = this.formController = h5.core.controller('.testForm',
							h5.ui.FormController);
					formCtrl.readyPromise.done(function() {
						var pluginName = 'message';
						formCtrl.addOutput(pluginName);
						formCtrl.getOutput(pluginName).readyPromise.done(function() {
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
	test('messageプラグインを有効化できること', function() {
		var formCtrl = this.formController;
		// moduleのsetupでaddOutputを行っている
		var pluginCtrl = formCtrl.getOutput('message');
		strictEqual(pluginCtrl.__name, 'h5.ui.validation.Message', 'messageプラグインを有効化できること');
	});

	test('バリデートエラーが有った場合にエラーメッセージが表示されること', function() {
		var formCtrl = this.formController;
		var errorMessage = this.errorMessage;
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
		// #529
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		formCtrl.setSetting({
			output: {
				message: {
					appendMessage: function(messageElem, target, propName) {
						$(target).after(
								'<span class="errorMessageWrapper">' + messageElem.textContent
										+ '</span>');
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
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
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
		strictEqual($('.errorMessageWrapper').text(), errorMessage, 'リセット前にバリデート結果が表示されていること');
		formCtrl.resetValidation();
		// FIXME #530 setSetting()で各プロパティ毎のプラグイン設定でメッセージを指定しない場合、
		// プラグイン設定のmessageではなくバリデーションルールのデフォルトメッセージが表示される。
		strictEqual($('.errorMessageWrapper').text(), '', 'バリデート結果表示をリセットできること');
	});

	asyncTest('同期・非同期のバリデーションが混在する場合、validateの直後に同期のメッセージが、validateComplete発火時に非同期のメッセージが表示されること',
			function() {
				var formCtrl = this.formController;
				var errorMessage = '同期バリデートに失敗しました';
				var asyncErrorMessage = '非同期バリデートに失敗しました';
				var dfd = h5.async.deferred();
				formCtrl.addRule({
					a: {
						required: true
					},
					b: {
						customFunc: function(value) {
							return dfd.promise();
						}
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					output: {
						message: {
							updateOn: ['validate']
						}
					},
					property: {
						a: {
							message: {
								message: errorMessage
							}
						},
						b: {
							message: {
								message: asyncErrorMessage
							}
						}
					}
				});

				var $inputA = $('.inputA');
				var $inputB = $('.inputB');

				// 同期のバリデーション
				var result = formCtrl.validate();

				// 同期メッセージ確認
				strictEqual($inputA.next().text(), errorMessage, '同期時に同期のメッセージが表示されること');

				// 非同期のバリデーション
				dfd.reject({
					valid: false
				});

				// 非同期のバリデーションの後に実行するために処理を遅らせる
				setTimeout(
						function() {
							strictEqual($inputB.next().text(), asyncErrorMessage,
									'非同期時に非同期のメッセージが表示されること');
							start();
						}, 0);
			});

	test('メッセージがHTMLとして解釈されて<span></span>がタグとして解釈されること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'errorMessage';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				message: {
					message: '<span>' + errorMessage + '</span>'
				}
			}
		});

		formCtrl.validate();

		var $message = $('.inputA').next();
		var $span = $message.children('span');
		strictEqual($span.length, 1, '<span>がタグとして解釈されること');
		strictEqual($span.text(), errorMessage, 'span要素にエラーメッセージが表示されること');
	});

	test('メッセージをエスケープして<span></span>が文字列として解釈されること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'errorMessage';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				message: {
					message: '&lt;span&gt;' + errorMessage + '&lt;/span&gt;'
				}
			}
		});

		formCtrl.validate();

		var $message = $('.inputA').next();
		var $span = $message.children('span');
		strictEqual($span.length, 0, '<span>がタグとして解釈されないこと');
		strictEqual($message.text(), '<span>' + errorMessage + '</span>', '<span>が文字列として表示されること');
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
				var pluginName = 'message';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});

					formCtrl.setSetting({
						output: {
							message: {
								message: that.errorMessage,
								wrapper: '<span class="errorMessageWrapper">'
							}
						}
					});

					// 全体バリデートを行う
					formCtrl.validate();
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
	asyncTest('updateOnがデフォルトの場合、blur()してもエラーが表示され続けること', function() {
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
				return $container.length === 1;
			},
			maxWait: 1000
		}).done(function() {
			strictEqual($container.text(), errorMessage, 'エラーメッセージが表示されること');
		}).always(start);
	});

	asyncTest('updateOnがデフォルトの場合、blur()し再びfocus()しても一貫してエラーが表示され続けること', function() {
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
				return $container.length === 1;
			},
			maxWait: 1000
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

	asyncTest(
			'updateOnがデフォルトの場合、最初に空文字の場合にrequiredのエラーが出力されており、その後値を入力してchangeイベントが起きるとエラーメッセージが非表示になること',
			function() {
				var $container = $('.errorMessageWrapper');
				if ($container.length === 0) {
					ok(false, '全体バリデート時にエラーメッセージが表示されていない');
					start();
					return;
				}
				$('.inputA').blur();
				gate({
					func: function() {
						return $container.length === 1;
					},
					maxWait: 1000
				}).done(function() {
					$('.inputA').focus();
					$('.inputA').val('dummy');
					$('.inputA').change();

					var $containerAfterInput = $('.errorMessageWrapper');

					gate({
						func: function() {
							return $containerAfterInput.length === 0;
						},
						maxWait: 1000
					}).done(function() {
						strictEqual($containerAfterInput.length, 0, 'エラーメッセージが表示されていない');
					}).fail(function() {
						ok(false, 'エラーメッセージが表示されたままになっている');
					}).always(start);
				}).fail(start);
			});

	asyncTest('updateOnがデフォルトの場合、blur→clickと操作したときエラーが表示し続けていること', function() {
		var $container = $('.errorMessageWrapper');
		if ($container.length === 0) {
			ok(false, '全体バリデート時にエラーメッセージが表示されていない');
			start();
			return;
		}
		$('.inputA').blur();
		gate({
			func: function() {
				return $container.length === 1;
			},
			maxWait: 1000
		}).done(function() {
			$('.inputA').click();
			gate({
				func: function() {
					return $container.length === 1;
				},
				maxWait: 1000
			}).done(function() {
				strictEqual($container.length, 1, 'エラーメッセージが表示され続けている');
			}).fail(function() {
				ok(false, 'エラーメッセージが表示されていない');
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
				var pluginName = 'message';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});

					formCtrl.setSetting({
						output: {
							message: {
								message: that.errorMessage,
								wrapper: '<span class="errorMessageWrapper">'
							}
						}
					});

					// 全体バリデートを行わない
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

	asyncTest('updateOnがデフォルトの場合、validate()を呼んでなくても、changeのタイミングでエラーが表示されること', function() {
		$('.inputA').change();
		gate({
			func: function() {
				return $('.errorMessageWrapper').length === 1;
			},
			maxWait: 1000
		}).done(function() {
			strictEqual($('.errorMessageWrapper').length, 1, 'エラーメッセージが表示されていること');
		}).fail(function() {
			ok(false, 'エラーメッセージが表示されていない');
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
			html += '<input class="inputA" name="a"><input class="inputB" name="b"></div></form>';
			$('body').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'balloon';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					start();
				});
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
		// moduleのsetupでaddOutputを行っている
		var pluginCtrl = formCtrl.getOutput('balloon');
		strictEqual(pluginCtrl.__name, 'h5.ui.validation.ErrorBalloon', 'balloonプラグインを有効化できること');
	});

	asyncTest('バリデートエラーがあってもバルーンが表示されないこと', function() {
		var formCtrl = this.formController;
		// moduleのsetupでaddOutputを行っている
		formCtrl.addRule({
			a: {
				required: true
			}
		});
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

	asyncTest('バルーンを表示する位置を文字列で指定できること', function() {
		var formCtrl = this.formController;
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
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
			strictEqual($('.validation-balloon').length, 1, 'リセット前にバリデート結果が表示されていること');
			formCtrl.resetValidation();
			// TODO 要再考。Balloonプラグインのバリデート結果のリセットはどういう意味を考える
			strictEqual($('.validation-balloon').length, 0, 'バリデート結果表示をリセットできること');
		}).always(start);
	});

	asyncTest('同期・非同期のバリデーションが混在する場合、focusの直後に同期のメッセージが、validateComplete発火時に非同期のメッセージが表示されること',
			function() {
				var formCtrl = this.formController;
				var errorMessage = '同期バリデートに失敗しました';
				var asyncErrorMessage = '非同期バリデートに失敗しました';
				var dfd = h5.async.deferred();
				formCtrl.addRule({
					a: {
						required: true
					},
					b: {
						customFunc: function(value) {
							return dfd.promise();
						}
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					output: {
						balloon: {
							placement: 'right',
							updateOn: ['focus', 'blur']
						}
					},
					property: {
						a: {
							balloon: {
								message: errorMessage
							}
						},
						b: {
							balloon: {
								message: asyncErrorMessage
							}
						}
					}
				});

				var $inputA = $('.inputA');

				// 同期のバリデーション
				$inputA.focus();

				gate({
					func: function() {
						return $('.validation-balloon').length === 1;
					},
					maxWait: 1000
				}).done(
						function() {
							// 同期のメッセージ確認
							strictEqual($('.validation-balloon').text(), errorMessage,
									'同期時に同期のメッセージが表示されること');

							//フォーカスを変えて、インプットBにバルーンが出るようにする
							$inputA.blur();
							$('.inputB').focus();

							// 非同期のバリデーションを完了する
							dfd.reject({
								valid: false
							});

							gate({
								func: function() {
									return $('.validation-balloon').length === 1;
								},
								maxWait: 1000
							}).done(
									function() {
										// 非同期のメッセージ確認
										strictEqual($('.validation-balloon').text(),
												asyncErrorMessage, '非同期時に非同期のメッセージが表示されること');
									}).fail(function() {
								ok(false, '非同期時にballoonが表示されない');
							}).always(start);
						}).fail(function() {
					ok(false, '同期時にballoonが表示されない');
					start();
				});
			});

	asyncTest('メッセージがHTMLとして解釈されて<span></span>がタグとして解釈されること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'errorMessage';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				balloon: {
					message: '<span>' + errorMessage + '</span>'
				}
			}
		});

		$('.inputA').focus();

		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(function() {
			var $balloon = $('.validation-balloon');
			var $span = $balloon.children('span');
			strictEqual($span.length, 1, '<span>がタグとして解釈されること');
			strictEqual($span.text(), errorMessage, 'span要素にエラーメッセージが表示されること');
		}).always(start);
	});

	asyncTest('メッセージをエスケープして<span></span>が文字列として解釈されること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'errorMessage';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				balloon: {
					message: '&lt;span&gt;' + errorMessage + '&lt;/span&gt;'
				}
			}
		});

		$('.inputA').focus();

		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(
				function() {
					var $balloon = $('.validation-balloon');
					var $span = $balloon.children('span');
					strictEqual($span.length, 0, '<span>がタグとして解釈されないこと');
					strictEqual($balloon.text(), '<span>' + errorMessage + '</span>',
							'<span>が文字列として表示されること');
				}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('balloonプラグイン updateOnを指定せず全体バリデートを行った場合 ', {
		setup: function() {
			stop();
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><div class="testBalloonContainer">';
			html += '<input class="inputA" name="a"></div></form>';
			$('body').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'balloon';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});

					// 全体バリデートを行う
					formCtrl.validate();
					start();
				});
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
			failMsg: 'バルーンが表示されない',
			maxWait: 1000
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
			maxWait: 1000
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
			maxWait: 1000
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
	module('balloonプラグイン updateOnを指定せず全体バリデートを行っていない場合', {
		setup: function() {
			stop();
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			$('body').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'balloon';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});

					// 全体バリデートを行わない
					start();
				});
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

	asyncTest('focus時に表示されること', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			failMsg: 'バルーンが表示されない'
		}).fail(function() {
			maxWait: 1000
		}).done(function() {
			strictEqual($('.validation-balloon').length, 1, 'バルーンが表示されること');
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
	module('balloonプラグイン updateOnを指定せずバルーンを表示する位置を指定', {
		setup: function() {
			stop();
			this.errorMessage = 'errorMessage';
			var html = '<form class="testForm"><div style="text-align: center">';
			html += '<input class="inputA" name="a"></div></form>';
			$('body').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'balloon';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});
					start();
				});
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
					placement: 'right'
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
	module(
			'バリデート結果出力プラグイン bsBalloon',
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
										var html = '<form class="testForm"><div class="testBalloonContainer">';
										html += '<input class="inputA" name="a"><input class="inputB" name="b"></div></form>';
										$('body').append(html);
										var formCtrl = that.formController = h5.core.controller(
												'.testForm', h5.ui.FormController);
										formCtrl.readyPromise.done(function() {
											var pluginName = 'bsBalloon';
											formCtrl.addOutput(pluginName);
											formCtrl.getOutput(pluginName).readyPromise
													.done(function() {
														start();
													});
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
		// moduleのsetupでaddOutputを行っている
		var pluginCtrl = formCtrl.getOutput('bsBalloon');
		strictEqual(pluginCtrl.__name, 'h5.ui.validation.BootstrapErrorBalloon',
				'bsBalloonプラグインを有効化できること');
	});

	asyncTest('バリデートエラーがあってもBootstrapのバルーンが表示されないこと', function() {
		var formCtrl = this.formController;
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
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
		// moduleのsetupでaddOutputを行っている
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
			strictEqual($('.tooltip').length, 1, 'リセット前にバリデート結果が表示されていること');
			//リセットしたので、バルーンは非表示になるはず
			formCtrl.resetValidation();

			gate({
				func: function() {
					return $('.tooltip').length === 0;
				},
				maxWait: 1000
			}).done(function() {
				ok(true, 'バルーンが正しく非表示になった');
			}).fail(function() {
				ok(false, 'バルーンが表示されたままになっている');
			}).always(start);
		}).fail(function() {
			ok(false, 'フォーカスを当てた段階でバルーンが表示されていない');
			start();
		});
	});

	asyncTest('同期・非同期のバリデーションが混在する場合、focusの直後に同期のメッセージが、validateComplete発火時に非同期のメッセージが表示されること',
			function() {
				var formCtrl = this.formController;
				var errorMessage = '同期バリデートに失敗しました';
				var asyncErrorMessage = '非同期バリデートに失敗しました';
				var dfd = h5.async.deferred();
				formCtrl.addRule({
					a: {
						required: true
					},
					b: {
						customFunc: function(value) {
							return dfd.promise();
						}
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					output: {
						bsBalloon: {
							placement: 'right',
							updateOn: ['focus', 'blur']
						}
					},
					property: {
						a: {
							bsBalloon: {
								message: errorMessage
							}
						},
						b: {
							bsBalloon: {
								message: asyncErrorMessage
							}
						}
					}
				});

				var $inputA = $('.inputA');

				// 同期のバリデーション
				$inputA.focus();

				gate({
					func: function() {
						return $('.tooltip').length === 1;
					},
					maxWait: 1000
				}).done(
						function() {
							// 同期のメッセージ確認
							strictEqual($('.tooltip>.tooltip-inner').text(), errorMessage,
									'同期時に同期のメッセージが表示されること');

							//Bにフォーカスを当てる
							$inputA.blur();
							$('.inputB').focus();

							// 非同期のバリデーションを完了させる
							dfd.reject({
								valid: false
							});

							gate({
								func: function() {
									return $('.tooltip').length === 1;
								},
								maxWait: 1000
							}).done(
									function() {
										// 非同期のメッセージ確認
										strictEqual($('.tooltip>.tooltip-inner').text(),
												asyncErrorMessage, '非同期時に非同期のメッセージが表示されること');
									}).fail(function() {
								ok(false, '非同期時にballoonが表示されない');
							}).always(start);
						}).fail(function() {
					ok(false, '同期時にballoonが表示されない');
					start();
				});
			});

	asyncTest('メッセージがHTMLとして解釈されて<span></span>がタグとして解釈されること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'errorMessage';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				bsBalloon: {
					message: '<span>' + errorMessage + '</span>'
				}
			}
		});

		$('.inputA').focus();

		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(function() {
			var $balloon = $('.tooltip>.tooltip-inner');
			var $span = $balloon.children('span');
			strictEqual($span.length, 1, '<span>がタグとして解釈されること');
			strictEqual($span.text(), errorMessage, 'span要素にエラーメッセージが表示されること');
		}).always(start);
	});

	asyncTest('メッセージをエスケープして<span></span>が文字列として解釈されること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'errorMessage';
		formCtrl.addRule({
			a: {
				required: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			output: {
				bsBalloon: {
					message: '&lt;span&gt;' + errorMessage + '&lt;/span&gt;'
				}
			}
		});

		$('.inputA').focus();

		gate({
			func: function() {
				return $('.tooltip').length === 1;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(
				function() {
					var $balloon = $('.tooltip>.tooltip-inner');
					var $span = $balloon.children('span');
					strictEqual($span.length, 0, '<span>がタグとして解釈されないこと');
					strictEqual($balloon.text(), '<span>' + errorMessage + '</span>',
							'<span>が文字列として表示されること');
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
							var pluginName = 'bsBalloon';
							formCtrl.addOutput(pluginName);
							formCtrl.getOutput(pluginName).readyPromise.done(function() {
								formCtrl.addRule({
									a: {
										required: true
									}
								});

								// 全体バリデートを行う
								formCtrl.validate();
								start();
							});
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
			failMsg: 'バルーンが表示されない',
			maxWait: 1000
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
			maxWait: 1000
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
			maxWait: 1000
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
			failMsg: 'バルーンが表示されない',
			maxWait: 1000
		}).done(function() {
			strictEqual($('.tooltip-inner').text(), 'aは必須項目です。', 'title属性を指定しても正しくメッセージが表示されること');
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
											var pluginName = 'bsBalloon';
											formCtrl.addOutput(pluginName);
											formCtrl.getOutput(pluginName).readyPromise
													.done(function() {
														formCtrl.addRule({
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
														formCtrl.validate();
														start();
													});
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
	asyncTest('focus時にバルーンが表示になること', function() {
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.tooltip').length === 2;// inputA,グループの2つのバルーンが表示される
			},
			failMsg: 'バルーンが表示されない',
			maxWait: 1000
		}).done(function() {
			ok(true, 'focusしたinput要素のバルーンが表示になること');
		}).always(start);
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
							var pluginName = 'bsBalloon';
							formCtrl.addOutput(pluginName);
							formCtrl.getOutput(pluginName).readyPromise.done(function() {
								formCtrl.addRule({
									a: {
										required: true
									}
								});

								// 全体バリデートを行わない
								start();
							});
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
			failMsg: 'バルーンが表示されない',
			maxWait: 1000
		}).done(function() {
			strictEqual($('.tooltip').length, 1, 'バルーンが表示されること');
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
	module(
			'バリデート結果出力プラグイン style',
			{
				setup: function() {
					stop();
					this.errorMessage = 'errorMessage';
					var html = '<form class="testForm"><div class="testBalloonContainer">';
					html += '<input class="inputA" name="a"><input class="inputB" name="b"><input class="inputC" name="c"><input class="inputD" name="d"></div></form>';
					$('#qunit-fixture').append(html);
					var formCtrl = this.formController = h5.core.controller('.testForm',
							h5.ui.FormController);
					formCtrl.readyPromise.done(function() {
						var pluginName = 'style';
						formCtrl.addOutput(pluginName);
						formCtrl.getOutput(pluginName).readyPromise.done(function() {
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
	test('styleプラグインを有効化できること', function() {
		var formCtrl = this.formController;
		// moduleのsetupでaddOutputを行っている
		var pluginCtrl = formCtrl.getOutput('style');
		strictEqual(pluginCtrl.__name, 'h5.ui.validation.Style', 'styleプラグインを有効化できること');
	});

	asyncTest('バリデート時に適用するクラス名を設定できること', function() {
		var $inputA = $('.inputA');
		var $inputB = $('.inputB');
		var $inputC = $('.inputC');
		var $inputD = $('.inputD');

		var successClassName = 'successValidate';
		var errorClassName = 'failValidate';
		var validatingClassName = 'validating';

		var dfdC = h5.async.deferred();
		var dfdD = h5.async.deferred();

		var formCtrl = this.formController;
		// moduleのsetupでaddOutputを行っている
		formCtrl.addRule({
			a: {
				required: true
			},
			b: {
				required: true
			},
			c: {
				customFunc: function() {
					return dfdC.promise();
				}
			},
			d: {
				customFunc: function() {
					return dfdD.promise();
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

		// inputA,inputCだけsuccessになる
		$inputA.val('aaa');
		$inputC.val('aaa');

		// 同期のバリデーション
		var result = formCtrl.validate();

		// 同期のバリデーション結果でクラスが適用されているか確認
		ok($inputA.hasClass(successClassName), 'バリデート成功した要素にバリデート成功クラスが適用されること');
		ok($inputB.hasClass(errorClassName), 'バリデート失敗した要素にバリデート失敗クラスが適用されること');
		ok($inputC.hasClass(validatingClassName), '非同期バリデートの結果待機中の要素に非同期バリデート結果待機のクラスが適用されること');

		// 非同期のバリデーション
		// inputCはsuccess
		dfdC.resolve({
			valid: true
		});
		// inputDはerror
		dfdD.reject({
			valid: false
		});

		// 非同期のバリデーションの後に実行するために処理を遅らせる
		setTimeout(function() {
			ok($inputC.hasClass(successClassName), '非同期バリデートの結果が成功であればバリデート成功クラスが適用されること');
			ok($inputD.hasClass(errorClassName), '非同期バリデートの結果が失敗であればバリデート失敗クラスが適用されること');
			start();
		}, 0);
	});

	test('バリデート結果表示をリセットできること)', function() {
		var $inputA = $('.inputA');
		var $inputB = $('.inputB');
		var $inputC = $('.inputC');

		var successClassName = 'successValidate';
		var errorClassName = 'failValidate';
		var validatingClassName = 'validating';

		var dfd = h5.async.deferred();

		var formCtrl = this.formController;
		// moduleのsetupでaddOutputを行っている
		formCtrl.addRule({
			a: {
				required: true
			},
			b: {
				required: true
			},
			c: {
				customFunc: function() {
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

		// inputAだけsuccessになる
		$inputA.val('aaa');

		// 同期のバリデーション
		formCtrl.validate();

		// validatingクラスが適用されているか確認したいので非同期のバリデーションは行わない

		// 同期のバリデーション結果でクラスが適用されているか確認
		ok($inputA.hasClass(successClassName), 'successを適用したクラスが設定されていること');
		ok($inputB.hasClass(errorClassName), 'errorを適用したクラスが設定されていること');
		ok($inputC.hasClass(validatingClassName), 'validatingを適用したクラスが設定されていること');

		// 適用したクラスがリセットされていることを確認
		formCtrl.resetValidation();
		ok(!$inputA.hasClass(successClassName), 'successを適用したクラスがリセットされていること');
		ok(!$inputB.hasClass(errorClassName), 'errorを適用したクラスがリセットされていること');
		ok(!$inputC.hasClass(validatingClassName), 'validatingを適用したクラスがリセットされていること');
	});

	asyncTest('同期・非同期のバリデーションが混在する場合、validateの直後に同期のメッセージが、validateComplete発火時に非同期のメッセージが表示されること',
			function() {
				var formCtrl = this.formController;
				var errorClassName = 'error';
				var asyncErrorClassName = 'asyncError';
				var dfd = h5.async.deferred();
				formCtrl.addRule({
					a: {
						required: true
					},
					b: {
						customFunc: function(value) {
							return dfd.promise();
						}
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					output: {
						style: {
							container: $('.errorContainer'),
							updateOn: ['validate']
						}
					},
					property: {
						a: {
							style: {
								errorClassName: errorClassName
							}
						},
						b: {
							style: {
								errorClassName: asyncErrorClassName
							}
						}
					}
				});

				var $inputA = $('.inputA');
				var $inputB = $('.inputB');

				// 同期のバリデーション
				var result = formCtrl.validate();

				// 同期メッセージ確認
				ok($inputA.hasClass(errorClassName), '同期時に適用した同期クラスが追加されていること');
				ok(!$inputB.hasClass(asyncErrorClassName), '同期時に適用した非同期クラスが追加されていないこと');

				// 非同期のバリデーション
				dfd.reject({
					valid: false
				});

				// 非同期のバリデーションの後に実行するために処理を遅らせる
				setTimeout(function() {
					ok($inputA.hasClass(errorClassName), '非同期時に適用した同期クラスが追加されていること');
					ok($inputB.hasClass(asyncErrorClassName), '非同期時に適用したクラスが追加されていること');
					start();
				}, 0);
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

			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'style';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});
					formCtrl.setSetting({
						output: {
							style: {
								successClassName: that.successClassName,
								errorClassName: that.errorClassName,
								validatingClassName: that.validatingClassName
							}
						}
					});

					// 全体バリデートを行う
					formCtrl.validate();
					start();
				});
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

	asyncTest('focus時に設定されないこと', function() {
		var $inputA = $('.inputA');
		// 全体バリデート時にあてられたクラスを除去し
		// イベントが起きてもクラスが設定されないことを確認する
		$inputA.removeClass(this.errorClassName);
		$inputA.focus();
		var that = this;
		gate({
			func: function() {
				return $inputA.hasClass(that.errorClassName);
			},
			maxWait: 1000,
		}).done(function() {
			ok(false, 'クラスが設定される');
		}).fail(function() {
			ok(!$inputA.hasClass(that.errorClassName), 'クラスが設定されないこと');
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

	asyncTest('keyup時に設定されないこと', function() {
		var $inputA = $('.inputA');
		// 全体バリデート時にあてられたクラスを除去し
		// イベントが起きてもクラスが設定されないことを確認する
		$inputA.removeClass(this.errorClassName);
		$inputA.keyup();
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

	asyncTest('change時に設定されること', function() {
		var $inputA = $('.inputA');
		$inputA.change();
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

			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'style';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});
					formCtrl.setSetting({
						output: {
							style: {
								successClassName: that.successClassName,
								errorClassName: that.errorClassName,
								validatingClassName: that.validatingClassName
							}
						}
					});

					// 全体バリデートを行わない
					start();
				});
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

	asyncTest('focus時に設定されないこと', function() {
		var $inputA = $('.inputA');
		$inputA.focus();
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

	asyncTest('keyup時に設定されないこと', function() {
		var $inputA = $('.inputA');
		$inputA.keyup();
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

	asyncTest('cahnge時に設定されること', function() {
		var $inputA = $('.inputA');
		$inputA.change();
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

			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginNames = ['asyncIndicator', 'composition', 'message', 'balloon',
						'bsBalloon', 'style'];
				formCtrl.addOutput(pluginNames);
				h5.async.when(pluginNames.map(function(pluginName) {
					return formCtrl.getOutput(pluginName).readyPromise;
				})).done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});
					formCtrl.setSetting({
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
		var dfd = h5.async.deferred();
		formCtrl.addRule({
			a: {
				customFunc: function() {
					return dfd.promise();
				}
			}
		});
		// 同期のバリデーション
		formCtrl.validate();

		// 非同期のバリデーション
		dfd.resolve({
			valid: true
		});

		// 非同期のバリデーションの後に実行するために処理を遅らせる
		setTimeout(function() {
			var $indicator = $('.h5-indicator');
			strictEqual($indicator.length, 0, 'asyncIndicatorプラグインが無効になること');
			start();
		}, 0);
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

			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'composition';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});
					start();
				});
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
			property: {
				a: {
					displayName: 'composition displayName'
				}
			},
			output: {
				composition: {
					container: '.testContainer'
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.testContainer').text(), 'composition displayNameは必須項目です。',
				'バリデーション対象のプロパティに対応する表示名 displayName を設定できること');
	});

	test('バリデートエラー時に表示するメッセージ文字列 message を設定できること', function() {
		var errorMessage = 'errorMessage';
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				a: {
					message: errorMessage
				}
			},
			output: {
				composition: {
					container: '.testContainer'
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
			property: {
				a: {
					message: function(param) {
						return errorMessage;
					}
				}
			},
			output: {
				composition: {
					container: '.testContainer'
				}
			}
		});
		formCtrl.validate();
		strictEqual($('.testContainer').text(), errorMessage,
				'バリデートエラー時に表示するメッセージ生成関数 message を設定できること');
	});

	test('バリデートエラー時に表示するメッセージ生成関数に与えられる引数がtargetViolationプロパティを持つこと', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		var isCalled = false;
		var targetViolation = null;
		formCtrl.setSetting({
			output: {
				composition: {
					container: '.testContainer'
				}
			},
			property: {
				a: {
					composition: {
						message: function(param) {
							isCalled = true;
							targetViolation = param.targetViolation;
							return errorMessage;
						}
					}
				}
			}
		});

		formCtrl.validate();
		ok(isCalled, '関数が呼び出されたこと');
		ok(targetViolation, 'targetViolationプロパティを持つこと');
	});

	//=============================
	// Definition
	//=============================
	module('メッセージを表示するプラグインで共通の設定 messageプラグイン', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			html += '<div class="errorContainer"></div>';
			$('#qunit-fixture').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'message';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});
					start();
				});
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
		strictEqual($('.messageWrapper').text(), 'message displayNameは必須項目です。',
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

	test('バリデートエラー時に表示するメッセージ生成関数に与えられる引数がtargetViolationプロパティを持つこと', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		var isCalled = false;
		var targetViolation = null;
		formCtrl.setSetting({
			output: {
				message: {
					container: $('.errorContainer')
				}
			},
			property: {
				a: {
					message: {
						message: function(param) {
							isCalled = true;
							targetViolation = param.targetViolation;
							return errorMessage;
						}
					}
				}
			}
		});

		formCtrl.validate();
		ok(isCalled, '関数が呼び出されたこと');
		ok(targetViolation, 'targetViolationプロパティを持つこと');
	});

	//=============================
	// Definition
	//=============================
	module('メッセージを表示するプラグインで共通の設定 balloonプラグイン', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			$('#qunit-fixture').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'balloon';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});
					start();
				});
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
	asyncTest('バリデーション対象のプロパティに対応する表示名 displayName を設定できること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				a: {
					displayName: 'balloon displayName'
				}
			}
		});
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length !== 0;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(
				function() {
					strictEqual($('.validation-balloon').text(), 'balloon displayNameは必須項目です。',
							'バリデーション対象のプロパティに対応する表示名 displayName を設定できること');
				}).always(start);
	});

	asyncTest('バリデートエラー時に表示するメッセージ文字列 message を設定できること', function() {
		var errorMessage = 'errorMessage';
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				a: {
					message: errorMessage
				}
			}
		});
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length !== 0;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(
				function() {
					strictEqual($('.validation-balloon').text(), errorMessage,
							'バリデートエラー時に表示するメッセージ文字列 message を設定できること');
				}).always(start);
	});

	asyncTest('バリデートエラー時に表示するメッセージ生成関数 message を設定できること', function() {
		var errorMessage = 'errorMessage';
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				a: {
					message: function(param) {
						return errorMessage;
					}
				}
			}
		});
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length !== 0;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(
				function() {
					strictEqual($('.validation-balloon').text(), errorMessage,
							'バリデートエラー時に表示するメッセージ生成関数 message を設定できること');
				}).always(start);
	});

	asyncTest('バリデートエラー時に表示するメッセージ生成関数に与えられる引数がtargetViolationプロパティを持つこと', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		var isCalled = false;
		formCtrl.setSetting({
			property: {
				a: {
					message: function(param) {
						ok(param.targetViolation, 'targetViolationプロパティを持つこと');
						isCalled = true;
						return errorMessage;
					}
				}
			}
		});
		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length !== 0;
			},
			maxWait: 1000,
			failMsg: 'バルーンが表示されない'
		}).done(function() {
			ok(isCalled, 'メッセージ生成関数が呼び出されたこと');
		}).always(start);
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

			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'style';
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});
					start();
				});
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
		$('.inputA').val('ok');
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
		$('.inputA').val('ok');
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
		$('.inputA').val('ok');
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
		$('.inputA').val('ok');
		formCtrl.validate();
		ok($('.replaceContainer').hasClass('successValidate'),
				'クラス適用対象要素 replaceElement を関数で設定できること');
	});

	test('クラス適用対象要素 replaceElement を定義しないこと', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				style: {
					successClassName: 'successValidate',
					// replaceElementを定義しない
					replaceElement: null
				}
			}
		});
		var $inputA = $('.inputA');
		$inputA.val('ok');
		formCtrl.validate();
		ok(!$('.replaceContainer').hasClass('successValidate'), 'replaceElement にクラスが追加されていないこと');
		ok($inputA.hasClass('successValidate'), 'バリデート対象の要素にクラスが追加されていること');
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

			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
				var pluginName = 'message';
				formCtrl.addOutput('message');
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					formCtrl.addRule({
						a: {
							required: true
						}
					});
					start();
				});
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
		strictEqual($('.replaceContainer').next().text(), 'aは必須項目です。',
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
		strictEqual($('.replaceContainer').next().text(), 'aは必須項目です。',
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
		strictEqual($('.replaceContainer').next().text(), 'aは必須項目です。',
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
		strictEqual($('.replaceContainer').next().text(), 'aは必須項目です。',
				'クラス適用対象要素 replaceElement を関数で設定できること');
	});

	test('クラス適用対象要素 replaceElement を定義しないこと', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				message: {
					// replaceElementを定義しない
					replaceElement: null
				}
			}
		});
		formCtrl.validate();
		ok(!$('.replaceContainer').next().hasClass('message'),
				'replaceElementの後ろの要素にメッセージが表示されてないこと');
		strictEqual($('.inputA').next().text(), 'aは必須項目です。', 'バリデート対象の要素の後ろの要素にメッセージが表示されること');
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
					html += '<input class="inputA" name="a"></form>';
					html += '<div class="replaceContainer" style="height:10px; width: 100px; border: solid 1px;"></div>';
					$('#qunit-fixture').append(html);

					var formCtrl = this.formController = h5.core.controller('.testForm',
							h5.ui.FormController);
					formCtrl.readyPromise.done(function() {
						var pluginName = 'balloon';
						formCtrl.addOutput(pluginName);
						formCtrl.getOutput(pluginName).readyPromise.done(function() {
							formCtrl.addRule({
								a: {
									required: true
								}
							});
							start();
						});
					});
				},
				teardown: function() {
					clearController();
					$('.testForm').remove();
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

		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
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

		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
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

		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
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

		$('.inputA').focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			failMsg: 'バルーンが表示されない',
			maxWait: 1000
		}).done(
				function() {
					strictEqual($('.replaceContainer').next('.validation-balloon').length, 1,
							'クラス適用対象要素 replaceElement を関数で設定できること');
				}).always(start);

	});

	asyncTest('クラス適用対象要素 replaceElement を定義しないこと', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			output: {
				balloon: {
					// replaceElementを定義しない
					replaceElement: null
				}
			}
		});

		var $inputA = $('.inputA');
		$inputA.focus();
		gate({
			func: function() {
				return $('.validation-balloon').length === 1;
			},
			failMsg: 'バルーンが表示されない',
			maxWait: 1000
		}).done(
				function() {
					strictEqual($('.replaceContainer').next('.validation-balloon').length, 0,
							'replaceElmentの後ろにballoon要素が存在しないこと');
					strictEqual($inputA.next('.validation-balloon').length, 1,
							'バリデート対象の要素の後ろにballoon要素が存在すること');
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

					var formCtrl = this.formController = h5.core.controller('.testForm',
							h5.ui.FormController);
					formCtrl.readyPromise.done(function() {
						var pluginName = 'asyncIndicator';
						formCtrl.addOutput(pluginName);
						formCtrl.getOutput(pluginName).readyPromise.done(function() {
							start();
						});
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
		var dfd = h5.async.deferred();
		formCtrl.addRule({
			a: {
				customFunc: function() {
					return dfd.promise();
				}
			}
		});
		formCtrl.setSetting({
			output: {
				asyncIndicator: {
					replaceElement: document.getElementsByClassName('replaceContainer')[0]
				}
			}
		});

		// 同期のバリデーション
		formCtrl.validate();

		strictEqual($('.replaceContainer > .h5-indicator').length, 1,
				'replaceElementの子要素にインジケータが表示されること');

		// 非同期のバリデーション
		dfd.resolve({
			valid: true
		});

		// 非同期のバリデーションの後に実行するために処理を遅らせる
		setTimeout(function() {
			start();
		}, 0);
	});

	asyncTest('クラス適用対象要素 replaceElement をjQueryで設定できること', function() {
		var formCtrl = this.formController;
		var dfd = h5.async.deferred();
		formCtrl.addRule({
			a: {
				customFunc: function() {
					return dfd.promise();
				}
			}
		});
		formCtrl.setSetting({
			output: {
				asyncIndicator: {
					replaceElement: $('.replaceContainer')
				}
			}
		});

		// 同期のバリデーション
		formCtrl.validate();

		strictEqual($('.replaceContainer > .h5-indicator').length, 1,
				'replaceElementの子要素にインジケータが表示されること');

		// 非同期のバリデーション
		dfd.resolve({
			valid: true
		});

		// 非同期のバリデーションの後に実行するために処理を遅らせる
		setTimeout(function() {
			start();
		}, 0);
	});

	asyncTest('クラス適用対象要素 replaceElement をセレクタ文字列で設定できること', function() {
		var formCtrl = this.formController;
		var dfd = h5.async.deferred();
		formCtrl.addRule({
			a: {
				customFunc: function() {
					return dfd.promise();
				}
			}
		});
		formCtrl.setSetting({
			output: {
				asyncIndicator: {
					replaceElement: '.replaceContainer'
				}
			}
		});

		// 同期のバリデーション
		formCtrl.validate();

		strictEqual($('.replaceContainer > .h5-indicator').length, 1,
				'replaceElementの子要素にインジケータが表示されること');

		// 非同期のバリデーション
		dfd.resolve({
			valid: true
		});

		// 非同期のバリデーションの後に実行するために処理を遅らせる
		setTimeout(function() {
			start();
		}, 0);
	});

	asyncTest('クラス適用対象要素 replaceElement を関数で設定できること', function() {
		var formCtrl = this.formController;
		var dfd = h5.async.deferred();
		formCtrl.addRule({
			a: {
				customFunc: function() {
					return dfd.promise();
				}
			}
		});
		formCtrl.setSetting({
			output: {
				asyncIndicator: {
					replaceElement: function() {
						return $('.replaceContainer');
					}
				}
			}
		});

		// 同期のバリデーション
		formCtrl.validate();

		strictEqual($('.replaceContainer > .h5-indicator').length, 1,
				'replaceElementの子要素にインジケータが表示されること');

		// 非同期のバリデーション
		dfd.resolve({
			valid: true
		});

		// 非同期のバリデーションの後に実行するために処理を遅らせる
		setTimeout(function() {
			start();
		}, 0);
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
		strictEqual($.inArray('a', result.validProperties), -1, '個別にバリデートルールを削除できること');
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
			html += '<input type="checkbox" class="checkC" name="c" checked>';
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
	test('isArrayのデフォルトはfalseなので1つしかないname属性では結果が配列以外で返ってくる', function() {
		var formCtrl = this.formController;
		var value = formCtrl.getValue();
		strictEqual(typeof value['c'], 'string', '結果が配列以外で返ってくること');
	});

	test('isArrayをtrueにすると1つしかないname属性では結果が配列で返ってくる', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				c: {
					isArray: true
				}
			}
		});
		var value = formCtrl.getValue();
		ok($.isArray(value['c']), '結果が配列で返ってくること');
	});

	test('isArrayをtrueにすると1つしかないname属性では結果が配列以外で返ってくる', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				c: {
					isArray: false
				}
			}
		});
		var value = formCtrl.getValue();
		strictEqual(typeof value['c'], 'string', '結果が配列以外で返ってくること');
	});

	test('isArrayのデフォルトはfalseなので同じname属性が複数ある場合では結果が配列で返ってくる', function() {
		var formCtrl = this.formController;
		var value = formCtrl.getValue();
		ok($.isArray(value['a']), '結果が配列で返ってくること');
	});

	test('isArrayをtrueにすると同じname属性が複数ある場合では結果が配列で返ってくる', function() {
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

	test('isArrayをfalseにすると同じname属性が複数ある場合では結果が配列で返ってくる', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			property: {
				a: {
					isArray: false
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

	asyncTest('バリデートエラーが有った場合は有効になっているプラグインの出力がされること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		var isChangeCalled = false;
		var isBlurCalled = false;
		var isFocusCalled = false;
		var isKeyupCalled = false;
		var isValidateCalled = false;
		var isAsyncValidateCalled = false;
		// ダミーのプラグインを作成
		var pluginName = 'testPlugin';
		var controller = {
			__name: 'testPluginController',
			_setDefaultMessage: function(validatorName, message) {},
			_onChange: function(element, name, validationResult) {
				isChangeCalled = true;
			},
			_onBlur: function(element, name, validationResult) {
				isBlurCalled = true;
			},
			_onFocus: function(element, name, validationResult) {
				isFocusCalled = true;
			},
			_onKeyup: function(element, name, validationResult) {
				isKeyupCalled = true;
			},
			_onValidate: function(validationResult) {
				isValidateCalled = true;
			},
			_onAsyncValidate: function() {
				isAsyncValidateCalled = true;
			}
		};
		formCtrl._addOutputPlugin(pluginName, controller);
		formCtrl.addOutput(pluginName);
		formCtrl.getOutput(pluginName).readyPromise.done(function() {
			formCtrl.addRule({
				a: {
					required: true
				}
			});

			$('.testForm').submit();
			// _onValidateが呼び出されればそこで各プラグインの出力処理が行われるので出力されることの確認になる
			ok(!isChangeCalled, '_onChangeが呼び出されていないこと');
			ok(!isBlurCalled, '_onBlurが呼び出されていないこと');
			ok(!isFocusCalled, '_onFocusが呼び出されていないこと');
			ok(!isKeyupCalled, '_onKeyupが呼び出されていないこと');
			ok(isValidateCalled, '_onValidateが呼び出されたこと');
			ok(!isAsyncValidateCalled, '_onAsyncValidateが呼び出されていないこと');
			start();
		});
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
		var dfd = h5.async.deferred();
		logic.addRule({
			a: {
				customFunc: function() {
					return dfd.promise();
				}
			}
		});

		// 同期のバリデーション
		var result = logic.validate({
			a: ''
		});

		// 非同期のバリデーション
		dfd.reject({
			valid: false
		});

		setTimeout(function() {
			// 非同期のバリデーション結果をメッセージに追加
			msgOutputCtrl.appendMessageByValidationResult(result, 'a');
			strictEqual($container.text(), '入力要素Aが違反しています',
					'ValidationResultが非同期バリデート待ちの場合は結果が返ってきたときにメッセージを表示すること');
			start();
		}, 0);
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

	test('全てのプロパティがエラーではない場合はnullを返すこと', function() {
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
			a: 'valueA',
			b: 'valueB'
		});
		var message = msgOutputCtrl.getMessageByValidationResult(result, 'b');
		strictEqual(message, null, '全てのプロパティがエラーではない場合はnullを返すこと');
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
		strictEqual(this.$container.text(), 'aは必須項目です。', 'displayName は必須項目です');
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
		var expectMsg = 'aは条件を満たしません。';
		strictEqual(this.$container.text(), expectMsg, 'displayName は条件を満たしません');
	});

	//=============================
	// Definition
	//=============================
	module(
			'validationUpdateイベント発生',
			{
				setup: function() {
					stop();
					var html = '<div class="target"><form class="testForm"><input class="inputA" name="a"></form></div>';
					html += '<div class="errorContainer"></div>';
					$('#qunit-fixture').append(html);

					var formCtrl = this.formController = h5.core.controller('.testForm',
							h5.ui.FormController);
					formCtrl.readyPromise.done(function() {
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
	test('入力項目を変更した場合はvalidationUpdateイベントが発生すること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			ruleDefault: {
				required: {
					validateOn: 'change'
				}
			}
		});
		formCtrl.addRule({
			a: {
				required: true
			}
		});

		var isCalled = false;
		$('.target').on('validationUpdate', function() {
			isCalled = true;
		});

		$('.inputA').change();
		var result = formCtrl.getLastValidationResult();

		ok(isCalled, 'validationUpdateイベントが発生すること');
		strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
	});

	test('validate()が呼ばれた場合はvalidationUpdateイベントが発生すること', function() {
		var formCtrl = this.formController;
		formCtrl.setSetting({
			ruleDefault: {
				required: {
					validateOn: 'validate'
				}
			}
		});

		formCtrl.addRule({
			a: {
				required: true
			}
		});

		var isCalled = false;
		$('.target').on('validationUpdate', function() {
			isCalled = true;
		});

		var result = formCtrl.validate();

		ok(isCalled, 'validationUpdateイベントが発生すること');
		strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
	});

	//=============================
	// Definition
	//=============================
	module('FormControllerのパラメータ設定', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			html += '<div class="errorContainer"></div>';
			$('#qunit-fixture').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
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
	test('isAllRulesEnabledWhenEmpty:true、ルール側のisForceEnabledWhenEmpty:trueを設定した場合検出チェックすること',
			function() {
				var formCtrl = this.formController;
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				formCtrl.setSetting({
					isAllRulesEnabledWhenEmpty: true,
					ruleDefault: {
						required: {
							isForceEnabledWhenEmpty: true
						}
					}
				});

				var result = formCtrl.validate();

				strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
			});

	test('isAllRulesEnabledWhenEmpty:false、ルール側のisForceEnabledWhenEmpty:trueを設定した場合検出チェックすること',
			function() {
				var formCtrl = this.formController;
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				formCtrl.setSetting({
					isAllRulesEnabledWhenEmpty: false,
					ruleDefault: {
						required: {
							isForceEnabledWhenEmpty: true
						}
					}
				});

				var result = formCtrl.validate();

				strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
			});

	test('isAllRulesEnabledWhenEmpty:未定義、ルール側のisForceEnabledWhenEmpty:trueを設定した場合検出チェックすること',
			function() {
				var formCtrl = this.formController;
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				formCtrl.setSetting({
					// isAllRulesEnabledWhenEmpty未定義
					isAllRulesEnabledWhenEmpty: undefined,

					ruleDefault: {
						required: {
							isForceEnabledWhenEmpty: true
						}
					}
				});

				var result = formCtrl.validate();

				strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
			});

	test('isAllRulesEnabledWhenEmpty:true、ルール側のisForceEnabledWhenEmpty:falseを設定した場合検出チェックしないこと',
			function() {
				var formCtrl = this.formController;
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				formCtrl.setSetting({
					isAllRulesEnabledWhenEmpty: true,
					ruleDefault: {
						required: {
							isForceEnabledWhenEmpty: false
						}
					}
				});

				var result = formCtrl.validate();

				strictEqual(result.invalidCount, 0, 'バリデートエラーがないこと');
			});

	test('isAllRulesEnabledWhenEmpty:false、ルール側のisForceEnabledWhenEmpty:falseを設定した場合検出チェックしないこと',
			function() {
				var formCtrl = this.formController;
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				formCtrl.setSetting({
					isAllRulesEnabledWhenEmpty: false,
					ruleDefault: {
						required: {
							isForceEnabledWhenEmpty: false
						}
					}
				});

				var result = formCtrl.validate();

				strictEqual(result.invalidCount, 0, 'バリデートエラーがないこと');
			});

	test('isAllRulesEnabledWhenEmpty:未定義、ルール側のisForceEnabledWhenEmpty:falseを設定した場合検出チェックしないこと',
			function() {
				var formCtrl = this.formController;
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				formCtrl.setSetting({
					// isAllRulesEnabledWhenEmpty未定義
					isAllRulesEnabledWhenEmpty: undefined,

					ruleDefault: {
						required: {
							isForceEnabledWhenEmpty: false
						}
					}
				});

				var result = formCtrl.validate();

				strictEqual(result.invalidCount, 0, 'バリデートエラーがないこと');
			});

	test('isAllRulesEnabledWhenEmpty:true、ルール側のisForceEnabledWhenEmpty:nullを設定した場合検出チェックすること',
			function() {
				var formCtrl = this.formController;
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				formCtrl.setSetting({
					isAllRulesEnabledWhenEmpty: true,

					// ruleDefault.required.isForceEnabledWhenEmptyを未定義にする（true扱いになるはず）
					ruleDefault: {
						required: {
							isForceEnabledWhenEmpty: null
						}
					}
				});

				var result = formCtrl.validate();

				strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
			});

	test('isAllRulesEnabledWhenEmpty:false、ルール側のisForceEnabledWhenEmpty:nullを設定した場合検出チェックすること',
			function() {
				var formCtrl = this.formController;
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				formCtrl.setSetting({
					isAllRulesEnabledWhenEmpty: false,

					// ruleDefault.required.isForceEnabledWhenEmptyを未定義にする（true扱いになるはず）
					ruleDefault: {
						required: {
							isForceEnabledWhenEmpty: null
						}
					}
				});

				var result = formCtrl.validate();

				strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
			});

	test('isAllRulesEnabledWhenEmpty:未定義、ルール側のisForceEnabledWhenEmpty:未定義を設定した場合検出チェックすること',
			function() {
				var formCtrl = this.formController;
				formCtrl.addRule({
					a: {
						required: true
					}
				});
				formCtrl.setSetting({
				// isAllRulesEnabledWhenEmpty未定義
				// ruleDefault.required.isForceEnabledWhenEmpty未定義の場合true
				});

				var result = formCtrl.validate();

				strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
			});

	//=============================
	// Definition
	//=============================
	module('バリデーションの実行タイミングの制御 setPreValidationHook', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			html += '<div class="errorContainer"></div>';
			$('#qunit-fixture').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
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
	test('設定した関数がバリデーション時に呼び出されること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			a: {
				required: true
			}
		});

		var isCalled = false;
		formCtrl.setPreValidationHook(function(validationContext) {
			isCalled = true;
		});

		var result = formCtrl.validate();

		ok(isCalled, '設定した関数がバリデーション時に呼び出されること');
		strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
	});

	test('設定した関数に与えられる引数がvalidationContextオブジェクトであること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			a: {
				required: true
			}
		});

		var isCalled = false;
		formCtrl.setPreValidationHook(function(validationContext) {
			strictEqual(typeof validationContext, 'object', 'validationContextオブジェクトがオブジェクトであること');
			strictEqual(validationContext.name, 'a', 'nameを持つこと');
			strictEqual(validationContext.value, '', 'valueを持つこと');
			strictEqual(validationContext.rule.name, 'required', 'ruleオブジェクトを持つこと');
			strictEqual(validationContext.timing, 'validate', 'timingを持つこと');
			isCalled = true;
		});

		var result = formCtrl.validate();

		ok(isCalled, '設定した関数がバリデーション時に呼び出されること');
		strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
	});

	test('validationContextオブジェクトのskip()を呼び出す場合はその項目のバリデーションをスキップすること', function() {
		var formCtrl = this.formController;
		formCtrl.addRule({
			a: {
				required: true
			}
		});

		var isCalled = false;
		formCtrl.setPreValidationHook(function(validationContext) {
			if (validationContext.name === 'a') {
				validationContext.skip();
			}

			isCalled = true;
		});

		var result = formCtrl.validate();

		ok(isCalled, '設定した関数がバリデーション時に呼び出されること');
		strictEqual(result.invalidCount, 0, 'バリデートエラーがないこと');
	});

	//=============================
	// Definition
	//=============================
	module('バリデータのルール', {
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest(
			'HTML要素にdata-h5-v-*を指定する場合は*のバリデータが指定した要素に対して実行されること',
			function() {
				var html = '<form class="testForm"><input class="inputA" name="a" data-h5-v-max="1"></form>';
				html += '<div class="errorContainer"></div>';
				$('#qunit-fixture').append(html);
				var formCtrl = h5.core.controller('.testForm', h5.ui.FormController);
				formCtrl.readyPromise.done(function() {
					$('.inputA').val('1234');
					var result = formCtrl.validate();
					strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
					start();
				});
			});

	asyncTest('HTML要素にdata-h5-v-*以外を指定する場合は実行されないこと', function() {
		var html = '<form class="testForm"><input class="inputA" name="a" data-hoge="1"></form>';
		html += '<div class="errorContainer"></div>';
		$('#qunit-fixture').append(html);
		var formCtrl = h5.core.controller('.testForm', h5.ui.FormController);
		formCtrl.readyPromise.done(function() {
			$('.inputA').val('1234');
			var result = formCtrl.validate();
			strictEqual(result.invalidCount, 0, 'バリデートエラーがないこと');
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('フォームコントローラの設定 setSetting customRule', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			html += '<div class="errorContainer"></div>';
			$('#qunit-fixture').append(html);
			var formCtrl = this.formController = h5.core.controller('.testForm',
					h5.ui.FormController);
			formCtrl.readyPromise.done(function() {
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
	asyncTest('funcのチェック関数がtrueを返す場合エラーメッセージを表示しないこと', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		// ダミーのプラグインを作成
		var pluginName = 'testPlugin';
		var controller = {
			__name: 'testPluginController',
			_setDefaultMessage: function(validatorName, message) {}
		};
		formCtrl._addOutputPlugin(pluginName, controller);
		formCtrl.addOutput(pluginName);
		formCtrl.getOutput(pluginName).readyPromise.done(function() {
			formCtrl.addRule({
				a: {
					validator: true
				}
			});
			formCtrl.setSetting({
				customRule: {
					validator: {
						// trueを返すチェック関数
						func: function(value) {
							return true;
						},
						message: errorMessage
					}
				}
			});

			// 入力がないとバリデートされない
			$('.inputA').val('hoge');
			var result = formCtrl.validate();
			// invalidCountが0件ならば各プラグインでエラー表示がされないのでエラーメッセージを表示しないことの確認になる
			strictEqual(result.validCount, 1, 'チェック関数がtrueを返すのでvalidが1件であること');
			strictEqual(result.invalidCount, 0, 'チェック関数がtrueを返すのでinvalidCountが0件であること');
			start();
		});
	});

	asyncTest('funcのチェック関数がfalseを返す場合エラーメッセージを表示すること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		// ダミーのプラグインを作成
		var pluginName = 'testPlugin';
		var controller = {
			__name: 'testPluginController',
			_setDefaultMessage: function(validatorName, message) {}
		};
		formCtrl._addOutputPlugin(pluginName, controller);
		formCtrl.addOutput(pluginName);
		formCtrl.getOutput(pluginName).readyPromise.done(function() {
			formCtrl.addRule({
				a: {
					validator: true
				}
			});
			formCtrl.setSetting({
				customRule: {
					validator: {
						// falseを返すチェック関数
						func: function(value) {
							return false;
						},
						message: errorMessage
					}
				}
			});

			// 入力がないとバリデートされない
			$('.inputA').val('hoge');
			var result = formCtrl.validate();
			// invalidCountが1件以上ならば各プラグインでエラー表示がされるのでエラーメッセージを表示することの確認になる
			strictEqual(result.validCount, 0, 'チェック関数がfalseを返すのでvalidが0件であること');
			strictEqual(result.invalidCount, 1, 'チェック関数がfalseを返すのでinvalidCountが1件であること');
			start();
		});
	});

	asyncTest('funcのチェック関数を設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		var isCalled = false;
		// ダミーのプラグインを作成
		var pluginName = 'testPlugin';
		var controller = {
			__name: 'testPluginController',
			_setDefaultMessage: function(validatorName, message) {}
		};
		formCtrl._addOutputPlugin(pluginName, controller);
		formCtrl.addOutput(pluginName);
		formCtrl.getOutput(pluginName).readyPromise.done(function() {
			formCtrl.addRule({
				a: {
					validator: true
				}
			});
			formCtrl.setSetting({
				customRule: {
					validator: {
						// falseを返すチェック関数
						func: function(value) {
							strictEqual(value, 'hoge', 'チェック関数が引数を持つこと');
							isCalled = true;
							return false;
						},
						message: errorMessage
					}
				}
			});

			// 入力がないとバリデートされない
			$('.inputA').val('hoge');
			formCtrl.validate();
			ok(isCalled, 'チェック関数が呼び出されたこと');
			start();
		});
	});

	asyncTest('messageにデフォルトのエラー文字列を設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		var isCalled = false;
		// ダミーのプラグインを作成
		var pluginName = 'testPlugin';
		var controller = {
			__name: 'testPluginController',
			_setDefaultMessage: function(validatorName, message) {
				isCalled = true;
				// 各プラグインに_setDefaultMessageでデフォルトのエラー文字列を設定する処理があるので、
				// 引数に設定したエラー文字列があればデフォルトのエラー文字列を設定できることの確認になる
				strictEqual(validatorName, 'validator', 'カスタムルール名が設定できること');
				strictEqual(message, errorMessage, 'メッセージが設定できること');
			}
		};
		formCtrl._addOutputPlugin(pluginName, controller);
		formCtrl.addOutput(pluginName);
		formCtrl.getOutput(pluginName).readyPromise.done(function() {
			formCtrl.addRule({
				a: {
					validator: true
				}
			});
			formCtrl.setSetting({
				customRule: {
					validator: {
						func: function(value) {
							return false;
						},
						// デフォルトのエラー文字列
						message: errorMessage
					}
				}
			});

			// 入力がないとバリデートされない
			$('.inputA').val('hoge');
			formCtrl.validate();
			ok(isCalled, 'デフォルトメッセージを設定する関数が呼び出されたこと');
			start();
		});
	});

	asyncTest('messageにデフォルトのエラー文字列を返す関数を設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		var errorMessageFunc = function(param) {
			return errorMessage;
		};
		var isCalled = false;
		// ダミーのプラグインを作成
		var pluginName = 'testPlugin';
		var controller = {
			__name: 'testPluginController',
			_setDefaultMessage: function(validatorName, message) {
				isCalled = true;
				// 各プラグインに_setDefaultMessageでデフォルトのエラー文字列を返す関数を設定する処理があるので、
				// 引数に設定したエラー文字列を返す関数があればデフォルトのエラー文字列を返す関数を設定できることの確認になる
				strictEqual(validatorName, 'validator', 'カスタムルール名が設定できること');
				strictEqual(message, errorMessageFunc, 'メッセージを返す関数が設定できること');
			}
		};
		formCtrl._addOutputPlugin(pluginName, controller);
		formCtrl.addOutput(pluginName);
		formCtrl.getOutput(pluginName).readyPromise.done(function() {
			formCtrl.addRule({
				a: {
					validator: true
				}
			});
			formCtrl.setSetting({
				customRule: {
					validator: {
						func: function(value) {
							return false;
						},
						// デフォルトのエラー文字列を返す関数
						message: errorMessageFunc
					}
				}
			});

			// 入力がないとバリデートされない
			$('.inputA').val('hoge');
			formCtrl.validate();
			ok(isCalled, 'デフォルトメッセージを設定する関数が呼び出されたこと');
			start();
		});
	});

	asyncTest('messageにデフォルトのエラー文字列を返す関数を設定するとエラーメッセージに反映されること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		var errorMessageFunc = function(param) {
			return errorMessage;
		};
		var isCalled = false;
		// ダミーのプラグインを作成
		var pluginName = 'testPlugin';
		var controller = {
			__name: 'testPluginController',
			_setDefaultMessage: function(validatorName, message) {
				isCalled = true;
				strictEqual(validatorName, 'validator', 'カスタムルール名が設定できること');
				strictEqual(message, errorMessageFunc, 'メッセージを返す関数が設定できること');
				// 各プラグインに_setDefaultMessageでデフォルトのエラー文字列を返す関数を設定する処理があるので
				// 関数が設定したエラーメッセージを返せることで表示するエラーメッセージに反映されることの確認になる
				strictEqual(message(), errorMessage, 'メッセージを返す関数が設定したエラーメッセージを返すこと');
			}
		};
		formCtrl._addOutputPlugin(pluginName, controller);
		formCtrl.addOutput(pluginName);
		formCtrl.getOutput(pluginName).readyPromise.done(function() {
			formCtrl.addRule({
				a: {
					validator: true
				}
			});
			formCtrl.setSetting({
				customRule: {
					validator: {
						func: function(value) {
							return false;
						},
						// デフォルトのエラー文字列を返す関数
						message: errorMessageFunc
					}
				}
			});

			// 入力がないとバリデートされない
			$('.inputA').val('hoge');
			formCtrl.validate();
			ok(isCalled, 'デフォルトメッセージを設定する関数が呼び出されたこと');
			start();
		});
	});

	test('isForceEnabledWhenEmpty:trueの場合は値が空でもルールを適用すること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				validator: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return false;
					},
					message: errorMessage,
					isForceEnabledWhenEmpty: true
				}
			}
		});

		var result = formCtrl.validate();
		strictEqual(result.invalidCount, 1, 'バリデートエラーがあること');
	});

	test('isForceEnabledWhenEmpty:falseの場合は値が空だとルールを適用しないこと', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				validator: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return false;
					},
					message: errorMessage,
					isForceEnabledWhenEmpty: false
				}
			}
		});

		var result = formCtrl.validate();
		strictEqual(result.invalidCount, 0, 'バリデートエラーがないこと');
	});

	test('isForceEnabledWhenEmpty:未定義の場合は値が空だとルールを適用しないこと', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				validator: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return false;
					},
					message: errorMessage,
				// isForceEnabledWhenEmpty未定義
				}
			}
		});

		var result = formCtrl.validate();
		strictEqual(result.invalidCount, 0, 'バリデートエラーがないこと');
	});

	test('validateOnにエラー検出のタイミングを長さ0の配列で設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				validator: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return value === 'ok';
					},
					message: errorMessage,
					validateOn: []
				}
			},
			output: {
				composition: {
					container: $('.errorContainer'),
					// updateOnを指定してエラーメッセージを出力するタイミングを指定する
					// 未指定ではvalidateのみなので明示的に全てのタイミングを指定する
					updateOn: ['blur', 'validate', 'change', 'focus', 'keyup']
				}
			}
		});

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');
		$input.val('ng');

		var validationResult;

		// すべての場合、バリデート検証は行われないのでエラーがでることはないはず
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'blurでバリデートエラーがないこと');

		formCtrl.validate('a');
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'validateでバリデートエラーがないこと');

		$input.change();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'changeでバリデートエラーがないこと');

		$input.focus();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'focusでバリデートエラーがないこと');

		$input.keyup();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'keyupでバリデートエラーがないこと');
	});

	test('validateOnにエラー検出のタイミングを長さ1の配列で設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return value === 'ok';
					},
					message: errorMessage,
					validateOn: ['blur']
				}
			}
		});
		formCtrl.addRule({
			a: {
				validator: true
			}
		});

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');
		$input.val('ng');

		var validationResult;

		// blur以外の場合、バリデート検証は行われないのでエラーがでることはないはず
		formCtrl.validate('a');
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'validateでバリデートエラーがないこと');

		$input.change();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'changeでバリデートエラーがないこと');

		$input.focus();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'focusでバリデートエラーがないこと');

		$input.keyup();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'keyupでバリデートエラーがないこと');

		// blurの場合
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'blurでバリデートエラーがあること');
	});

	test('validateOnにエラー検出のタイミングを長さ2の配列で設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				validator: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return value === 'ok';
					},
					message: errorMessage,
					validateOn: ['blur', 'validate']
				}
			}
		});

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');
		$input.val('ng');

		var validationResult;

		// blur、validate以外の場合
		$input.change();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'changeでバリデートエラーがないこと');

		$input.focus();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'focusでバリデートエラーがないこと');

		$input.keyup();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'keyupでバリデートエラーがないこと');

		// blur、validateの場合
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'blurでバリデートエラーがあること');

		formCtrl.validate('a');
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'validateでバリデートエラーがあること');
	});

	test('validateOn:未定義で出力プラグインが未設定の場合、validateのタイミングのみでバリデーションを実行する（それ以外のタイミングではしない）こと',
			function() {
				var formCtrl = this.formController;
				var errorMessage = 'バリデートに失敗しました';
				formCtrl.addRule({
					a: {
						validator: true
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					customRule: {
						validator: {
							func: function(value) {
								return value === 'ok';
							},
							message: errorMessage
						// validateOn未定義
						}
					}
				});

				var $errorContainer = $('.errorContainer');
				var $input = $('.inputA');
				$input.val('ng');

				var validationResult;

				$input.blur();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 0, 'blurでバリデートエラーがないこと');

				$input.change();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 0, 'changeでバリデートエラーがないこと');

				$input.focus();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 0, 'focusでバリデートエラーがないこと');

				$input.keyup();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 0, 'keyupでバリデートエラーがないこと');

				formCtrl.validate('a');
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 1, 'validateではバリデートエラーがあること');
			});

	test('validateOn:nullで出力プラグインが未設定の場合、validateのタイミングのみでバリデーションを実行する（それ以外のタイミングではしない）こと',
			function() {
				var formCtrl = this.formController;
				var errorMessage = 'バリデートに失敗しました';
				formCtrl.addRule({
					a: {
						validator: true
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					customRule: {
						validator: {
							func: function(value) {
								return value === 'ok';
							},
							message: errorMessage,
							validateOn: null
						}
					}
				});

				var $errorContainer = $('.errorContainer');
				var $input = $('.inputA');
				$input.val('ng');

				var validationResult;

				$input.blur();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 0, 'blurでバリデートエラーがないこと');

				$input.change();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 0, 'changeでバリデートエラーがないこと');

				$input.focus();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 0, 'focusでバリデートエラーがないこと');

				$input.keyup();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 0, 'keyupでバリデートエラーがないこと');

				formCtrl.validate('a');
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 1, 'validateでバリデートエラーがあること');
			});


	asyncTest('validateOn:nullの場合、出力プラグインのupdateOnで設定されたタイミング、またはvalidateのタイミングでバリデーションが実行されること',
			function() {
				var formCtrl = this.formController;
				var errorMessage = 'バリデートに失敗しました';
				formCtrl.addRule({
					a: {
						validator: true
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					customRule: {
						validator: {
							func: function(value) {
								return value === 'ok';
							},
							message: errorMessage,
							validateOn: null
						}
					},

					output: {
						composition: {
							updateOn: ['change']
						}
					}
				});
				formCtrl.addOutput('composition');

				formCtrl.getOutput('composition').readyPromise.done(function() {
					var $errorContainer = $('.errorContainer');
					var $input = $('.inputA');
					$input.val('ng');

					var validationResult;

					$input.focus();
					validationResult = formCtrl.getLastValidationResult();
					strictEqual(validationResult.invalidCount, 0, 'focusでバリデートエラーがないこと');

					$input.blur();
					validationResult = formCtrl.getLastValidationResult();
					strictEqual(validationResult.invalidCount, 0, 'blurでバリデートエラーがないこと');

					$input.keyup();
					validationResult = formCtrl.getLastValidationResult();
					strictEqual(validationResult.invalidCount, 0, 'keyupでバリデートエラーがないこと');

					$input.change();
					validationResult = formCtrl.getLastValidationResult();
					strictEqual(validationResult.invalidCount, 1, 'changeでバリデートエラーがあること');

					$input.val('ok');

					$input.keyup();
					validationResult = formCtrl.getLastValidationResult();
					strictEqual(validationResult.invalidCount, 1,
							'keyupはupdateOnに含まれていないのでバリデートエラーが残っていること');

					formCtrl.validate('a');
					validationResult = formCtrl.getLastValidationResult();
					strictEqual(validationResult.invalidCount, 0, 'validateでバリデートエラーがなくなっていること');
					start();
				})
			});

	test('resolveOnにエラー解消のタイミングを長さ0の配列で設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				validator: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return value === 'ok';
					},
					message: errorMessage,
					validateOn: ['focus', 'blur', 'change', 'keyup', 'validate'],
					resolveOn: []
				}
			}
		});

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// エラーが出ていることを確認
		$input.val('ng');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'blurの前にバリデートエラーが出ていること');

		// エラーが出ていないことを確認
		$input.val('ok');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'blurでバリデートエラーが解消されること');

		$input.val('ng');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'validateの前にバリデートエラーが出ていること');

		$input.val('ok');
		formCtrl.validate('a');
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'validateでバリデートエラーが解消されること');

		$input.val('ng');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'changeの前にバリデートエラーが出ていること');

		$input.val('ok');
		$input.change();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'changeでバリデートエラーが解消されること');

		$input.val('ng');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'focusの前にバリデートエラーが出ていること');

		$input.val('ok');
		$input.focus();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'focusでバリデートエラーが解消されること');

		$input.val('ng');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'keyupの前にバリデートエラーが出ていること');

		$input.val('ok');
		$input.keyup();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'keyupでバリデートエラーが解消されること');
	});

	test('resolveOnにエラー解消のタイミングを長さ1の配列で設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				validator: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return value === 'ok';
					},
					message: errorMessage,
					// validateOnが未定義だとresolveOnの指定が無視されて全てのタイミングでエラー解消するため明示的にvalidateOnを指定
					validateOn: ['blur'],
					resolveOn: ['blur']
				}
			}
		});

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// blurの場合
		// エラーが出ていることを確認
		$input.val('ng');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'blurの前にバリデートエラーが出ていること');

		// エラーが解消されていることを確認
		$input.val('ok');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'blurでバリデートエラーが解消されること');

		// blur以外の場合
		// エラーが出ていることを確認
		$input.val('ng');
		$input.blur();

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'validateの前にバリデートエラーが出ていること');
		$input.val('ok');
		formCtrl.validate('a');
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'validateでバリデートエラーが解消されないこと');

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'changeの前にバリデートエラーが出ていること');
		$input.val('ok');
		$input.change();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'changeでバリデートエラーが解消されないこと');

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'focusの前にバリデートエラーが出ていること');
		$input.val('ok');
		$input.focus();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'focusでバリデートエラーが解消されないこと');

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'validateの前にバリデートエラーが出ていること');
		$input.val('ok');
		$input.keyup();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'keyupでバリデートエラーが解消されないこと');
	});

	test('resolveOnにエラー解消のタイミングを長さ2の配列で設定できること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				validator: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return value === 'ok';
					},
					message: errorMessage,
					validateOn: ['blur', 'validate'],
					resolveOn: ['blur', 'validate']
				}
			}
		});

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// blurの場合
		// エラーが出ていることを確認
		$input.val('ng');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'blurの前にバリデートエラーが出ていること');

		// エラーが解消されていることを確認
		$input.val('ok');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'blurでバリデートエラーが解消されること');

		// validateの場合
		$input.val('ng');
		formCtrl.validate('a');
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'validateの前にバリデートエラーが出ていること');

		$input.val('ok');
		formCtrl.validate('a');
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'validateでバリデートエラーが解消されること');

		// blur、validate以外の場合
		$input.val('ng');
		$input.blur();

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'changeの前にバリデートエラーが出ていること');
		$input.val('ok');
		$input.change();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'changeでバリデートエラーが解消されないこと');

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'focusの前にバリデートエラーが出ていること');
		$input.val('ok');
		$input.focus();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'focusでバリデートエラーが解消されないこと');

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'keyupの前にバリデートエラーが出ていること');
		$input.val('ok');
		$input.keyup();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'keyupでバリデートエラーが解消されないこと');
	});

	test('resolveOn:未定義の場合、validateOnの設定と同じタイミングでエラー解消すること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				validator: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return value === 'ok';
					},
					message: errorMessage,
					validateOn: ['blur']
				// resolveOn未定義
				}
			}
		});

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// blurの場合
		// エラーが出ていることを確認
		$input.val('ng');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'blurの前にバリデートエラーが出ていること');

		// エラーが解消されていることを確認
		$input.val('ok');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'blurでバリデートエラーが解消されること');

		// blur以外の場合
		$input.val('ng');
		$input.blur();

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'validateの前にバリデートエラーが出ていること');
		formCtrl.validate('a');
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'validateでバリデートエラーが解消されないこと');

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'changeの前にバリデートエラーが出ていること');
		$input.change();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'changeでバリデートエラーが解消されないこと');

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'focusの前にバリデートエラーが出ていること');
		$input.focus();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'focusでバリデートエラーが解消されないこと');

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'keyupの前にバリデートエラーが出ていること');
		$input.keyup();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'keyupでバリデートエラーが解消されないこと');
	});

	test('resolveOn:未定義、validateOn:未定義、かつ出力プラグインのタイミングが未定義の場合、validateタイミングでのみエラー解消すること',
			function() {
				var formCtrl = this.formController;
				var errorMessage = 'バリデートに失敗しました';
				formCtrl.addRule({
					a: {
						validator: true
					}
				});
				// moduleのsetupでaddOutputを行っている
				formCtrl.setSetting({
					customRule: {
						validator: {
							func: function(value) {
								return value === 'ok';
							},
							message: errorMessage
						// validateOn未定義
						// resolveOn未定義
						}
					}
				});

				var $errorContainer = $('.errorContainer');
				var $input = $('.inputA');

				// エラーが出ていることを確認
				$input.val('ng');
				formCtrl.validate('a');

				$input.blur();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 1, 'blurの前にバリデートエラーが出ていること');

				// エラーが解消されていることを確認
				$input.val('ok');
				$input.blur();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 1, 'blurでバリデートエラーが解消されないこと');

				$input.val('ng');
				$input.change();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 1, 'changeでバリデートエラーが出ていること');

				$input.val('ok');
				$input.change();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 1, 'changeでバリデートエラーが解消されないこと');

				$input.val('ng');
				$input.focus();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 1, 'focusでバリデートエラーが出ていること');

				$input.val('ok');
				$input.focus();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 1, 'focusでバリデートエラーが解消されないこと');

				$input.val('ng');
				$input.keyup();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 1, 'keyupでバリデートエラーが出ていること');

				$input.val('ok');
				$input.keyup();
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 1, 'keyupでバリデートエラーが解消されないこと');

				$input.val('ng');
				formCtrl.validate('a');
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 1, 'validateの前にバリデートエラーが出ていること');

				$input.val('ok');
				formCtrl.validate('a');
				validationResult = formCtrl.getLastValidationResult();
				strictEqual(validationResult.invalidCount, 0, 'validateでバリデートエラーが解消されること');
			});

	test('resolveOn:nullの場合、validateOnの設定と同じタイミングでエラー解消すること', function() {
		var formCtrl = this.formController;
		var errorMessage = 'バリデートに失敗しました';
		formCtrl.addRule({
			a: {
				validator: true
			}
		});
		// moduleのsetupでaddOutputを行っている
		formCtrl.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return value === 'ok';
					},
					message: errorMessage,
					validateOn: ['blur'],
					resolveOn: null
				}
			}
		});

		var $errorContainer = $('.errorContainer');
		var $input = $('.inputA');

		// blurの場合
		// エラーが出ていることを確認
		$input.val('ng');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'blurの前にバリデートエラーが出ていること');

		// エラーが解消されていることを確認
		$input.val('ok');
		$input.blur();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 0, 'blurでバリデートエラーが解消されること');

		// blur以外の場合
		$input.val('ng');
		$input.blur();

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'validateの前にバリデートエラーが出ていること');
		formCtrl.validate('a');
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'validateでバリデートエラーが解消されないこと');

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'changeの前にバリデートエラーが出ていること');
		$input.change();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'changeでバリデートエラーが解消されないこと');

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'focusの前にバリデートエラーが出ていること');
		$input.focus();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'focusでバリデートエラーが解消されないこと');

		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'keyupの前にバリデートエラーが出ていること');
		$input.keyup();
		validationResult = formCtrl.getLastValidationResult();
		strictEqual(validationResult.invalidCount, 1, 'keyupでバリデートエラーが解消されないこと');
	});

	asyncTest('compositionにエラーメッセージが表示されること', function() {
		var formCtrl = this.formController;
		var pluginName = 'composition';
		formCtrl.addOutput(pluginName);
		formCtrl.getOutput(pluginName).readyPromise.done(function() {
			var errorMessage = 'test';
			formCtrl.addRule({
				a: {
					validator: true
				}
			});
			// moduleのsetupでaddOutputを行っている
			formCtrl.setSetting({
				isAllRulesEnabledWhenEmpty: false,
				customRule: {
					validator: {
						func: function(value) {
							if (value === '1') {
								return true;
							}
							return false;
						},
						message: function() {
							return errorMessage;
						},
						isForceEnabledWhenEmpty: true,
						validateOn: ['blur'],
						resolveOn: ['blur']
					}
				},
				output: {
					composition: {
						container: '.errorContainer',
						wrapper: '<li></li>',
						updateOn: ['blur'],
						showAllErrors: true,
						hideWhenEmpty: true
					}
				},
			});

			var $errorContainer = $('.errorContainer');
			var $input = $('.inputA');
			$input.val('2').focus().blur();
			strictEqual($errorContainer.text(), 'test', 'バリデートエラーが有った場合にエラーメッセージが表示されること');
			start();
		});
	});

	module('addOutputPlugin', {
		isChangeCalled: false,
		isBlurCalled: false,
		isFocusCalled: false,
		isKeyupCalled: false,
		isValidateCalled: false,
		isAsyncValidateCalled: false,
		formController: null,
		setup: function() {
			stop();
			var html = '<form class="testForm"><input class="inputA" name="a"></form>';
			html += '<div class="errorContainer"></div>';
			$('#qunit-fixture').append(html);
			var that = this;
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				var pluginName = 'testPlugin';
				var errorMessage = 'バリデートに失敗しました';
				var controller = {
					__name: 'testPluginController',
					_onChange: function(element, name, validationResult) {
						that.isChangeCalled = true;
					},
					_onBlur: function(element, name, validationResult) {
						that.isBlurCalled = true;
					},
					_onFocus: function(element, name, validationResult) {
						that.isFocusCalled = true;
					},
					_onKeyup: function(element, name, validationResult) {
						that.isKeyupCalled = true;
					},
					_onValidate: function(validationResult) {
						that.isValidateCalled = true;
					},
					_onAsyncValidate: function() {
						that.isAsyncValidateCalled = true;
					}
				};
				var formCtrl = this.formController;
				formCtrl._addOutputPlugin(pluginName, controller);
				formCtrl.addOutput(pluginName);
				formCtrl.getOutput(pluginName).readyPromise.done(function() {
					start();
				});
			}.bind(this));
		}
	});

	test('changeのタイミングで関数が呼び出されること', function() {
		this.formController.addRule({
			a: {
				required: true
			}
		});
		var $input = $('.inputA');
		$input.change();
		ok(this.isChangeCalled, 'changeの場合_onChangeが呼び出されたこと');
		ok(!this.isBlurCalled, 'changeの場合_onBlurが呼び出されていないこと');
		ok(!this.isFocusCalled, 'changeの場合_onFocusが呼び出されていないこと');
		ok(!this.isKeyupCalled, 'changeの場合_onKeyupが呼び出されていないこと');
		ok(!this.isValidateCalled, 'changeの場合_onValidateが呼び出されていないこと');
		ok(!this.isAsyncValidateCalled, 'changeの場合_onAsyncValidateが呼び出されていないこと');
	});
	test('blurのタイミングで関数が呼び出されること', function() {
		this.formController.addRule({
			a: {
				required: true
			}
		});
		var $input = $('.inputA');
		$input.blur();
		ok(!this.isChangeCalled, 'blurの場合_onChangeが呼び出されていないこと');
		ok(this.isBlurCalled, 'blurの場合_onBlurが呼び出されたこと');
		ok(!this.isFocusCalled, 'blurの場合_onFocusが呼び出されていないこと');
		ok(!this.isKeyupCalled, 'blurの場合_onKeyupが呼び出されていないこと');
		ok(!this.isValidateCalled, 'blurの場合_onValidateが呼び出されていないこと');
		ok(!this.isAsyncValidateCalled, 'blurの場合_onAsyncValidateが呼び出されていないこと');
	});
	test('focusのタイミングで関数が呼び出されること', function() {
		this.formController.addRule({
			a: {
				required: true
			}
		});
		var $input = $('.inputA');
		$input.focus();
		ok(!this.isChangeCalled, 'focusの場合_onChangeが呼び出されていないこと');
		ok(!this.isBlurCalled, 'focusの場合_onBlurが呼び出されていないこと');
		ok(this.isFocusCalled, 'focusの場合_onFocusが呼び出されたこと');
		ok(!this.isKeyupCalled, 'focusの場合_onKeyupが呼び出されていないこと');
		ok(!this.isValidateCalled, 'focusの場合_onValidateが呼び出されていないこと');
		ok(!this.isAsyncValidateCalled, 'focusの場合_onAsyncValidateが呼び出されていないこと');
	});
	test('keyupのタイミングで関数が呼び出されること', function() {
		this.formController.addRule({
			a: {
				required: true
			}
		});
		var $input = $('.inputA');
		$input.keyup();
		ok(!this.isChangeCalled, 'keyupの場合_onChangeが呼び出されていないこと');
		ok(!this.isBlurCalled, 'keyupの場合_onBlurが呼び出されていないこと');
		ok(!this.isFocusCalled, 'keyupの場合_onFocusが呼び出されていないこと');
		ok(this.isKeyupCalled, 'keyupの場合_onKeyupが呼び出されたこと');
		ok(!this.isValidateCalled, 'keyupの場合_onValidateが呼び出されていないこと');
		ok(!this.isAsyncValidateCalled, 'keyupの場合_onAsyncValidateが呼び出されていないこと');
	});
	test('validateのタイミングで関数が呼び出されること', function() {
		this.formController.addRule({
			a: {
				required: true
			}
		});
		this.formController.validate('a');
		ok(!this.isChangeCalled, 'validateの場合_onChangeが呼び出されていないこと');
		ok(!this.isBlurCalled, 'validateの場合_onBlurが呼び出されていないこと');
		ok(!this.isFocusCalled, 'validateの場合_onFocusが呼び出されていないこと');
		ok(!this.isKeyupCalled, 'validateの場合_onKeyupが呼び出されていないこと');
		ok(this.isValidateCalled, 'validateの場合_onValidateが呼び出されたこと');
		ok(!this.isAsyncValidateCalled, 'validateの場合_onAsyncValidateが呼び出されていないこと');
	});
	asyncTest('非同期バリデーションの場合、非同期バリデーションが完了したタイミングで関数が呼び出されること', function() {
		var dfd = h5.async.deferred();
		this.formController.addRule({
			a: {
				customFunc: function(value) {
					return dfd.promise();
				}
			}
		})

		// 同期のバリデーション
		this.formController.validate('a');

		// 同期のバリデーション時に各関数が呼び出されるか確認
		ok(!this.isChangeCalled, 'validateの場合_onChangeが呼び出されていないこと');
		ok(!this.isBlurCalled, 'validateの場合_onBlurが呼び出されていないこと');
		ok(!this.isFocusCalled, 'validateの場合_onFocusが呼び出されていないこと');
		ok(!this.isKeyupCalled, 'validateの場合_onKeyupが呼び出されていないこと');
		ok(this.isValidateCalled, 'validateの場合_onValidateが呼び出されたこと');
		ok(!this.isAsyncValidateCalled, 'validateの場合_onAsyncValidateが呼び出されていないこと');

		// 呼び出されたかのチェックをクリア
		this.isChangeCalled = false;
		this.isBlurCalled = false;
		this.isFocusCalled = false;
		this.isKeyupCalled = false;
		this.isValidateCalled = false;
		this.isAsyncValidateCalled = false;

		// 非同期のバリデーション
		dfd.reject({
			valid: false
		});

		var that = this;
		// 非同期のバリデーションの後に実行するために処理を遅らせる
		setTimeout(function() {
			// 非同期のバリデーション時に各関数が呼び出されるか確認
			ok(!that.isChangeCalled, 'validateの場合_onChangeが呼び出されていないこと');
			ok(!that.isBlurCalled, 'validateの場合_onBlurが呼び出されていないこと');
			ok(!that.isFocusCalled, 'validateの場合_onFocusが呼び出されていないこと');
			ok(!that.isKeyupCalled, 'validateの場合_onKeyupが呼び出されていないこと');
			ok(!that.isValidateCalled, 'validateの場合_onValidateが呼び出されていないこと');
			ok(that.isAsyncValidateCalled, 'validateの場合_onAsyncValidateが呼び出されたこと');
			start();
		}, 0);
	});

	//=============================
	// Definition
	//=============================
	module(
			'エラー表示・非表示の切り替え',
			{
				setup: function() {
					stop();
					var html = '';
					html += '<form class="testForm">';
					html += '<ul id="compositionErrors"></ul>';
					html += '<textarea class="textarea1" name="textarea1" data-size="[1, 10]">fuga</textarea><div class="errorContainer"></div>';
					html += '</form>';
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
	asyncTest('textareaについてのエラー表示', function() {
		var formCtrl = this.formController;
		var errorMessage = 'test';
		formCtrl.addOutput('composition');
		formCtrl.setSetting({
			ruleDefault: {
				size: {}
			},
			customRule: {},
			property: {},
			output: {
				balloon: {
					placement: 'right'
				},
				style: {},
				asyncIndicator: {},
				composition: {
					container: '#compositionErrors',
					wrapper: '<li></li>',
					updateOn: ['blur', 'validate'],
					showAllErrors: true,
					hideWhenEmpty: true
				}
			}
		});
		formCtrl.addRule({
			textarea1: {
				required: true
			}
		});

		formCtrl.getOutput('composition').readyPromise.done(function() {
			var $compositionErrors = $('#compositionErrors');
			var $textarea = $('.textarea1');

			formCtrl.validate('textarea1');

			// 初期状態はバリデートエラーなし
			ok($compositionErrors.is(':hidden'), '初期状態はcompositionが非表示になっていること');

			$textarea.text('');
			formCtrl.validate('textarea1');

			// requiredなのに入力がないのでバリデートエラー発生
			ok($compositionErrors.is(':visible'), 'バリデートエラー発生時はcompositionが表示されていること');

			$textarea.text('fuga');
			formCtrl.validate('textarea1');

			// requiredなので入力を入れるとバリデートエラーなし
			ok($compositionErrors.is(':hidden'), 'バリデートエラー解消時はcompositionが非表示になっていること');
			start();
		});
	});

	module('同一プロパティに非同期のバリデーションが2つある場合のValidationResult.isAsyncの評価', {
		setup: function() {
			stop();
			var html = '<form class="testForm"><input name="a"></form>';
			$('#qunit-fixture').append(html);
			this.formController = h5.core.controller('.testForm', h5.ui.FormController);
			this.formController.readyPromise.done(function() {
				start();
			});
		},
	});

	test('結果待ちの非同期バリデーションが残っている間はisAsyncがtrueで、すべての非同期バリデーションの結果が判明したらfalseになること', function() {
		var dfd = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		this.formController.addRule({
			a: {
				customFunc: function(value) {
					return dfd.promise();
				},
				validator: true
			}
		});

		this.formController.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return dfd2.promise();
					},
					isForceEnabledWhenEmpty: true,
					message: 'errorMessage'
				}
			}
		});

		dfd.resolve({
			valid: true
		});
		var result = this.formController.validate('a');
		strictEqual(result.isAsync, true, '結果待ちの非同期バリデートが存在するため、isAsyncはtrue');
		ok($.inArray('a', result.validatingProperties) !== -1,
				'結果待ちの非同期バリデートが存在するため、validatingPropertiesにプロパティが格納されている');

		dfd2.resolve({
			valid: true
		});

		strictEqual(result.isAsync, false, '全ての非同期バリデートが完了したため、isAsyncはfalse');
		ok($.inArray('a', result.validatingProperties) == -1,
				'全ての非同期バリデートが完了したため、validatingPropertiesにプロパティが格納されていない');
		ok($.inArray('a', result.validProperties) == !-1,
				'全ての非同期バリデートが成功したため、validPropertiesにプロパティが格納されている');
	});

	module('同期、非同期のバリデーションが混在している場合のviolationの中身を確認する',
			{
				setup: function() {
					stop();
					var html = '<form class="testForm"><input name="a"><input name="b"></form>';
					$('#qunit-fixture').append(html);
					this.formController = h5.core.controller('.testForm', h5.ui.FormController);
					this.formController.readyPromise.done(function() {
						start();
					});
				},
				assertInvalid: function(result, property, invalidReason) {
					strictEqual(result.isValid, false, 'バリデートに失敗するのでisValid=false');
					strictEqual(result.isAllValid, false, 'バリデートに失敗するのでisAllValid=false');
					strictEqual(result.violationCount, 1, 'バリデートに失敗するのでviolationCount=1');
					strictEqual(result.invalidCount, 1, 'バリデートに失敗するのでinvalidCount=1');
					ok($.inArray(property, result.validProperties) == -1,
							'validPropertiesにプロパティが格納されていない');
					ok($.inArray(property, result.invalidProperties) !== -1,
							'invalidPropertiesにプロパティが格納されている');
					ok($.inArray(property, result.validatingProperties) == -1,
							'validatingPropertiesにプロパティが格納されていない');
					strictEqual(Object.keys(invalidReason).length, 1,
							'invalidReasonが持つオブジェクトは1つであること');
					strictEqual(property in invalidReason, true, 'invalidReasonが持つキーはaであること');
				}
			});

	test('入力値が変化していく場合のviolationの中身を確認する',
			function() {
				var dfd1 = h5.async.deferred();
				var dfd2 = h5.async.deferred();
				this.formController.addRule({
					a: {
						required: true,
						size: [4, 10],
						validator1: true,
						validator2: true
					}
				});
				this.formController.setSetting({
					customRule: {
						validator1: {
							func: function(value) {
								return dfd1.promise();
							},
							isForceEnabledWhenEmpty: false,
							message: 'errorMessage'
						},
						validator2: {
							func: function(value) {
								return dfd2.promise();
							},
							isForceEnabledWhenEmpty: false,
							message: 'errorMessage'
						},
					}
				});

				// 空文字を入力
				$('input[name="a"]').val("");
				var result = this.formController.validate('a');
				var invalidReason = result.invalidReason;
				var invalidRules = invalidReason.a.violation;
				var property = 'a';
				this.assertInvalid(result, property, invalidReason);

				strictEqual(invalidRules.length, 1, 'エラーのルール数は１つである');
				strictEqual(invalidRules[0].ruleName, 'required', 'requiredのエラーのみが格納されている');

				// abを入力
				$('input[name="a"]').val("ab");
				this.formController.validate('a');

				var lastResultAb = this.formController.getLastValidationResult();
				var lastInvalidReasonAb = lastResultAb.invalidReason;
				var lastInvalidRulesAb = lastInvalidReasonAb.a.violation;
				this.assertInvalid(lastResultAb, property, lastInvalidReasonAb);

				strictEqual(lastInvalidRulesAb.length, 1, 'エラーのルール数は1つである');
				strictEqual(lastInvalidRulesAb[0].ruleName, 'size', 'sizeのエラーのみが格納されている');

				dfd1.resolve({
					valid: true
				});
				dfd2.resolve({
					valid: true
				});

				var lastResultAb2 = this.formController.getLastValidationResult();
				var lastInvalidReasonAb2 = lastResultAb2.invalidReason;
				var lastInvalidRulesAb2 = lastInvalidReasonAb2.a.violation;
				this.assertInvalid(lastResultAb2, property, lastInvalidReasonAb2);

				strictEqual(lastInvalidRulesAb2.length, 1, 'エラーのルール数は1つである');
				strictEqual(lastInvalidRulesAb2[0].ruleName, 'size', 'sizeのエラーのみが格納されている');

				//次のバリデーションのためにdeferredを入れ替える(validatorの中で参照している)
				dfd1 = h5.async.deferred();
				dfd2 = h5.async.deferred();

				// abcdeを入力
				$('input[name="a"]').val("abcde");
				this.formController.validate('a');

				var lastResultAbcde = this.formController.getLastValidationResult();
				var lastInvalidReasonAbcde = lastResultAbcde.invalidReason;

				strictEqual(lastResultAbcde.isValid, true, 'バリデートに成功するのでisValid=true');
				strictEqual(lastResultAbcde.isAllValid, null, 'バリデートが完了していないのでisAllValidはnull');
				strictEqual(lastResultAbcde.violationCount, 0, 'バリデートに成功するのでviolationCount=0');
				strictEqual(lastResultAbcde.invalidCount, 0, 'バリデートに成功するのでinvalidCount=0');
				strictEqual(Object.keys(lastInvalidReasonAbcde).length, 0,
						'invalidReasonが持つオブジェクトは0であること');
				ok($.inArray('a', lastResultAbcde.validProperties) === -1,
						'非同期バリデータの結果待ちなので、validPropertiesにプロパティが格納されていないこと');
				ok($.inArray('a', lastResultAbcde.invalidProperties) == -1,
						'invalidPropertiesにプロパティが格納されていない');
				ok($.inArray('a', lastResultAbcde.validatingProperties) !== -1,
						'validatingPropertiesにプロパティが格納されている');

				dfd1.reject({
					valid: false
				});
				dfd2.reject({
					valid: false
				});

				var lastResultAbcde2 = this.formController.getLastValidationResult();
				var lastInvalidReasonAbcde2 = lastResultAbcde2.invalidReason;
				var lastInvalidRulesAbcde2 = lastInvalidReasonAbcde2.a.violation;

				strictEqual(lastResultAbcde2.isValid, false, 'バリデートに失敗するのでisValid=false');
				strictEqual(lastResultAbcde2.isAllValid, false, 'バリデートに失敗するのでisAllValid=false');
				strictEqual(lastResultAbcde2.invalidCount, 1, 'バリデートに失敗したプロパティの数は1');
				strictEqual(lastResultAbcde2.violationCount, 2,
						'2つの非同期バリデートに失敗するのでviolationCount=2');
				ok($.inArray('a', lastResultAbcde2.validProperties) === -1,
						'validPropertiesにプロパティが格納されていない');
				ok($.inArray('a', lastResultAbcde2.invalidProperties) !== -1,
						'invalidPropertiesにプロパティが格納されている');
				ok($.inArray('a', lastResultAbcde2.validatingProperties) === -1,
						'validatingPropertiesにプロパティが格納されていない');
				strictEqual(Object.keys(lastInvalidReasonAbcde2).length, 1,
						'invalidReasonが持つオブジェクトは1つであること');
				strictEqual('a' in lastInvalidReasonAbcde2, true, 'invalidReasonが持つキーはaであること');

				strictEqual(lastInvalidRulesAbcde2.length, 2, 'エラーのルール数は2つである');
				strictEqual(lastInvalidRulesAbcde2[0].ruleName, 'validator1',
						'validator1のエラーが格納されている');
				strictEqual(lastInvalidRulesAbcde2[1].ruleName, 'validator2',
						'validator2のエラーが格納されている');

			});

	test('複数要素に同期・非同期ルールが混在している場合、invalidReasonに失敗したプロパティのものだけが含まれていること', function() {
		var dfd1a = h5.async.deferred();
		var dfd2a = h5.async.deferred();
		var dfd1b = h5.async.deferred();
		var dfd2b = h5.async.deferred();
		this.formController.addRule({
			a: {
				size: [1, 10],
				validator1a: true,
				validator2a: true
			},
			b: {
				size: [1, 10],
				validator1b: true,
				validator2b: true
			}
		});
		this.formController.setSetting({
			customRule: {
				validator1a: {
					func: function(value) {
						return dfd1a.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				},
				validator2a: {
					func: function(value) {
						return dfd2a.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				},
				validator1b: {
					func: function(value) {
						return dfd1b.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				},
				validator2b: {
					func: function(value) {
						return dfd2b.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				},
			}
		});

		$('input[name="a"]').val("ab");
		$('input[name="b"]').val("ab");
		var result = this.formController.validate();

		dfd1a.resolve({
			valid: true
		});
		dfd2a.resolve({
			valid: true
		});
		dfd1b.reject({
			valid: false
		});
		dfd2b.reject({
			valid: false
		});

		strictEqual(result.isValid, false, 'バリデートに失敗するのでisValid=false');
		strictEqual(result.isAllValid, false, 'バリデートに失敗するのでisAllValid=false');
		strictEqual(result.violationCount, 2, '2つのプロパティがバリデートに失敗するのでviolationCount=2');
		strictEqual(result.invalidCount, 1, 'プロパティbがバリデートに失敗するのでinvalidCount=1');
		ok($.inArray('a', result.validProperties) !== -1, 'validPropertiesにプロパティaが格納されている');
		ok($.inArray('b', result.validProperties) == -1, 'validPropertiesにプロパティbが格納されていない');
		ok($.inArray('a', result.invalidProperties) == -1, 'invalidPropertiesにプロパティaが格納されていない');
		ok($.inArray('b', result.invalidProperties) !== -1, 'invalidPropertiesにプロパティbが格納されている');
		ok($.inArray('a', result.validatingProperties) == -1,
				'validatingPropertiesにプロパティaが格納されていない');
		ok($.inArray('b', result.validatingProperties) == -1,
				'validatingPropertiesにプロパティbが格納されていない');

		var invalidReason = result.invalidReason;
		strictEqual(Object.keys(invalidReason).length, 1, 'invalidReasonが持つ値は1つである');
		strictEqual('b' in invalidReason, true, 'invalidReasonが持つキーはbである');

		var invalidRules = invalidReason.b.violation;
		strictEqual(invalidRules.length, 2, 'エラーのルール数は2つである');
		strictEqual(invalidRules[0].ruleName, 'validator1b', 'validator1bのエラーが格納されている');
		strictEqual(invalidRules[1].ruleName, 'validator2b', 'validator2bのエラーが格納されている');
	});

	module(
			'validationResultのasyncWaitingProperties',
			{
				setup: function() {
					stop();
					var html = '<form class="testForm"><input name="a"><input name="b"></form>';
					$('#qunit-fixture').append(html);
					this.formController = h5.core.controller('.testForm', h5.ui.FormController);
					this.formController.readyPromise.done(function() {
						start();
					});
				},
				assertValid: function(result) {
					strictEqual(result.isValid, true, 'バリデートに成功するのでisValid=true');
					strictEqual(result.isAllValid, true, 'バリデートに成功するのでisAllValidはtrue');
					strictEqual(result.violationCount, 0, 'バリデートに成功するのでviolationCount=0');
					strictEqual(result.invalidCount, 0, 'バリデートに成功するのでinvalidCount=0');
					strictEqual(Object.keys(result.invalidReason).length, 0,
							'invalidReasonが持つオブジェクトは0であること');
					strictEqual(result.asyncWaitingProperties.length, 0,
							'非同期ルールのバリデートが完了したのでasyncWaitingProperties=0');
					var invalidReason = result.invalidReason;
					strictEqual(Object.keys(invalidReason).length, 0, 'invalidReasonが持つオブジェクトは0である');
				},
				assertValidProp: function(result, prop) {
					ok($.inArray(prop, result.validProperties) !== -1,
							'validPropertiesにプロパティが格納されている');
					ok($.inArray(prop, result.invalidProperties) == -1,
							'invalidPropertiesにプロパティが格納されていない');
					ok($.inArray(prop, result.validatingProperties) == -1,
							'validatingPropertiesにプロパティが格納されていない');
				},
				assertValidWaiting: function(result) {
					strictEqual(result.isValid, true, 'バリデートが完了していないのでisValid=true');
					strictEqual(result.isAllValid, null, 'バリデートが完了していないのでisAllValidはnull');
					strictEqual(result.violationCount, 0, 'バリデートが完了していないのでviolationCount=0');
					strictEqual(result.invalidCount, 0, 'バリデートが完了していないのでinvalidCount=0');
					strictEqual(Object.keys(result.invalidReason).length, 0,
							'invalidReasonが持つオブジェクトは0であること');
					var invalidReason = result.invalidReason;
					strictEqual(Object.keys(invalidReason).length, 0, 'invalidReasonが持つオブジェクトは0である');
				},
				assertValidWaitingProp: function(result, prop) {
					ok($.inArray(prop, result.validProperties) == -1,
							'validPropertiesにプロパティが格納されていない');
					ok($.inArray(prop, result.invalidProperties) == -1,
							'invalidPropertiesにプロパティが格納されていない');
					ok($.inArray(prop, result.validatingProperties) !== -1,
							'validatingPropertiesにプロパティが格納されている');
				},
				assertInvalid: function(result) {
					strictEqual(result.isValid, false, 'バリデートに失敗するのでisValid=false');
					strictEqual(result.isAllValid, false, 'バリデートに失敗するのでisAllValidはfalse');
					strictEqual(result.violationCount, 1, 'バリデートに失敗するのでviolationCount=1');
					strictEqual(result.invalidCount, 1, 'バリデートに失敗するのでinvalidCount=1');
					strictEqual(Object.keys(result.invalidReason).length, 1,
							'invalidReasonが持つオブジェクトは1であること');
				},
				assertInvalidProp: function(result, prop) {
					ok($.inArray(prop, result.validProperties) == -1,
							'validPropertiesにプロパティが格納されていない');
					ok($.inArray(prop, result.invalidProperties) !== -1,
							'invalidPropertiesにプロパティが格納されている');
				}
			});

	test('同期ルールのみ設定している場合', function() {
		this.formController.addRule({
			a: {
				required: true,
			}
		});

		$('input[name="a"]').val("a");
		var result = this.formController.validate('a');

		var prop = 'a';
		this.assertValid(result);
		this.assertValidProp(result, prop);
		var invalidReason = result.invalidReason;
		strictEqual(Object.keys(invalidReason).length, 0, 'invalidReasonが持つオブジェクトは0である');
	});

	test('非同期ルールのみ設定(バリデート成功)', function() {
		var dfd = h5.async.deferred();
		this.formController.addRule({
			a: {
				validator: true
			}
		});
		this.formController.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return dfd.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val("a");
		var result = this.formController.validate('a');
		var prop = 'a';

		this.assertValidWaiting(result, prop);
		this.assertValidWaitingProp(result, prop);
		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していない非同期ルールがあるのでasyncWaitingProperties=1');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティが格納されていること');

		dfd.resolve({
			valid: true
		});

		this.assertValid(result);
		this.assertValidProp(result, prop);
	});

	test('非同期ルールのみ設定(バリデート失敗)', function() {
		var dfd = h5.async.deferred();
		this.formController.addRule({
			a: {
				validator: true
			}
		});
		this.formController.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return dfd.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val("a");
		var result = this.formController.validate('a');
		var prop = 'a';

		this.assertValidWaiting(result);
		this.assertValidWaitingProp(result, prop);
		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していない非同期ルールがあるのでasyncWaitingProperties=1');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティが格納されていること');

		dfd.reject({
			valid: false
		});

		this.assertInvalid(result);
		this.assertInvalidProp(result, prop);
		var invalidReason = result.invalidReason;
		strictEqual(Object.keys(invalidReason).length, 1, 'invalidReasonが持つオブジェクトは1つである');
		strictEqual('a' in invalidReason, true, 'invalidReasonが持つキーはaである');

		var invalidRules = invalidReason.a.violation;
		strictEqual(invalidRules.length, 1, 'エラーのルール数は1つである');
		strictEqual(invalidRules[0].ruleName, 'validator', 'validatorのエラーが格納されている');
		strictEqual(result.asyncWaitingProperties.length, 0,
				'非同期ルールのバリデートが完了したのでasyncWaitingProperties=0');

	});

	test('2つの要素の内1つに同期ルール、1つに非同期ルールを設定(バリデート成功)する場合', function() {
		var dfd = h5.async.deferred();
		this.formController.addRule({
			a: {
				required: true
			},
			b: {
				validator: true
			}
		});
		this.formController.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return dfd.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val('a');
		$('input[name="b"]').val('b');
		var result = this.formController.validate();
		var propA = 'a';
		var propB = 'b';

		this.assertValidWaiting(result);
		this.assertValidProp(result, propA);
		this.assertValidWaitingProp(result, propB);
		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していないプロパティbの非同期ルールがあるのでasyncWaitingProperties=1');
		notStrictEqual(result.asyncWaitingProperties.indexOf('b'), -1,
				'asyncWaitingPropertiesにプロパティbが格納されていること');

		dfd.resolve({
			valid: true
		});

		this.assertValid(result);
		this.assertValidProp(result, propA);
		this.assertValidProp(result, propB);
	});

	test('2つの要素の内1つに同期ルール、1つに非同期ルールを設定(バリデート失敗)する場合', function() {
		var dfd = h5.async.deferred();
		this.formController.addRule({
			a: {
				required: true
			},
			b: {
				validator: true
			}
		});
		this.formController.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return dfd.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val('a');
		$('input[name="b"]').val('b');
		var result = this.formController.validate();
		var propA = 'a';
		var propB = 'b';

		this.assertValidWaiting(result);
		this.assertValidProp(result, propA);
		this.assertValidWaitingProp(result, propB);
		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していないプロパティbの非同期ルールがあるのでasyncWaitingProperties=1');
		notStrictEqual(result.asyncWaitingProperties.indexOf('b'), -1,
				'asyncWaitingPropertiesにプロパティbが格納されていること');

		dfd.reject({
			valid: false
		});

		this.assertInvalid(result);
		this.assertValidProp(result, propA);
		this.assertInvalidProp(result, propB);
		var invalidReason = result.invalidReason;
		strictEqual(Object.keys(invalidReason).length, 1, 'invalidReasonが持つオブジェクトは1つである');
		strictEqual('b' in invalidReason, true, 'invalidReasonが持つキーはbである');

		var invalidRules = invalidReason.b.violation;
		strictEqual(invalidRules.length, 1, 'エラーのルール数は1つである');
		strictEqual(invalidRules[0].ruleName, 'validator', 'validatorのエラーが格納されている');
		strictEqual(result.asyncWaitingProperties.length, 0,
				'非同期ルールのバリデートが完了したのでasyncWaitingProperties=0');
	});

	test('2つの要素に非同期ルールを設定(両方バリデート成功)する場合', function() {
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		this.formController.addRule({
			a: {
				validator1: true
			},
			b: {
				validator2: true
			}
		});
		this.formController.setSetting({
			customRule: {
				validator1: {
					func: function(value) {
						return dfd1.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				},
				validator2: {
					func: function(value) {
						return dfd2.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val('a');
		$('input[name="b"]').val('b');
		var result = this.formController.validate();
		var propA = 'a';
		var propB = 'b';

		this.assertValidWaiting(result);
		this.assertValidWaitingProp(result, propA);
		this.assertValidWaitingProp(result, propB);
		strictEqual(result.asyncWaitingProperties.length, 2,
				'バリデートが完了していないプロパティa,bの非同期ルールがあるのでasyncWaitingProperties=2');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティaが格納されていること');
		notStrictEqual(result.asyncWaitingProperties.indexOf('b'), -1,
				'asyncWaitingPropertiesにプロパティbが格納されていること');

		dfd1.resolve({
			valid: true
		});

		this.assertValidWaiting(result);
		this.assertValidProp(result, propA);
		this.assertValidWaitingProp(result, propB);
		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していないプロパティbの非同期ルールがあるのでasyncWaitingProperties=1');
		notStrictEqual(result.asyncWaitingProperties.indexOf('b'), -1,
				'asyncWaitingPropertiesにプロパティbが格納されていること');

		dfd2.resolve({
			valid: true
		});

		this.assertValid(result);
		this.assertValidProp(result, propA);
		this.assertValidProp(result, propB);
	});

	test('2つの要素に非同期ルールを設定(両方バリデート失敗)する場合', function() {
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		this.formController.addRule({
			a: {
				validator1: true
			},
			b: {
				validator2: true
			}
		});
		this.formController.setSetting({
			customRule: {
				validator1: {
					func: function(value) {
						return dfd1.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				},
				validator2: {
					func: function(value) {
						return dfd2.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val('a');
		$('input[name="b"]').val('b');
		var result = this.formController.validate();
		var propA = 'a';
		var propB = 'b';

		this.assertValidWaiting(result);
		this.assertValidWaitingProp(result, propA);
		this.assertValidWaitingProp(result, propB);
		strictEqual(result.asyncWaitingProperties.length, 2,
				'バリデートが完了していないプロパティa,bの非同期ルールがあるのでasyncWaitingProperties=2');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティaが格納されていること');
		notStrictEqual(result.asyncWaitingProperties.indexOf('b'), -1,
				'asyncWaitingPropertiesにプロパティbが格納されていること');

		dfd1.reject({
			valid: false
		});

		strictEqual(result.isValid, false, 'バリデートに失敗するのでisValid=false');
		strictEqual(result.isAllValid, false, 'バリデートに失敗するのでisAllValidはfalse');
		strictEqual(result.violationCount, 1, 'バリデートに失敗するのでviolationCount=1');
		strictEqual(result.invalidCount, 1, 'バリデートに失敗するのでinvalidCount=1');
		strictEqual(Object.keys(result.invalidReason).length, 1, 'invalidReasonが持つオブジェクトは1であること');

		this.assertInvalidProp(result, propA);
		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していないプロパティbの非同期ルールがあるのでasyncWaitingProperties=1');
		strictEqual(result.asyncWaitingProperties[0], 'b',
				'asyncWaitingPropertiesにプロパティbが格納されていること');
		var invalidReason = result.invalidReason;
		strictEqual(Object.keys(invalidReason).length, 1, 'invalidReasonが持つオブジェクトは1つである');
		strictEqual('a' in invalidReason, true, 'invalidReasonが持つキーはaである');

		var invalidRulesA = invalidReason.a.violation;
		strictEqual(invalidRulesA.length, 1, 'エラーのルール数は1つである');
		strictEqual(invalidRulesA[0].ruleName, 'validator1', 'validator1のエラーが格納されている');

		dfd2.reject({
			valid: false
		});

		strictEqual(result.isValid, false, 'バリデートに失敗するのでisValid=false');
		strictEqual(result.isAllValid, false, 'バリデートに失敗するのでisAllValidはfalse');
		strictEqual(result.violationCount, 2, 'バリデートに失敗するのでviolationCount=2');
		strictEqual(result.invalidCount, 2, 'バリデートに失敗するのでinvalidCount=2');

		this.assertInvalidProp(result, propA);
		this.assertInvalidProp(result, propB);
		strictEqual(result.asyncWaitingProperties.length, 0,
				'非同期ルールのバリデートが完了したのでasyncWaitingProperties=0');
		var invalidReason = result.invalidReason;
		strictEqual(Object.keys(invalidReason).length, 2, 'invalidReasonが持つオブジェクトは2つである');
		strictEqual('a' in invalidReason, true, 'invalidReasonが持つキーはaである');
		strictEqual('b' in invalidReason, true, 'invalidReasonが持つキーはbである');

		var invalidRulesB = invalidReason.b.violation;
		strictEqual(invalidRulesA.length, 1, 'プロパティaのエラーのルール数は1つである');
		strictEqual(invalidRulesB.length, 1, 'プロパティbのエラーのルール数は1つである');
		strictEqual(invalidRulesA[0].ruleName, 'validator1', 'validator1のエラーが格納されている');
		strictEqual(invalidRulesB[0].ruleName, 'validator2', 'validator1のエラーが格納されている');
	});

	test('2つの要素に非同期ルールを設定(1つ目のバリデート成功、2つ目のバリデート失敗)する場合', function() {
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		this.formController.addRule({
			a: {
				validator1: true
			},
			b: {
				validator2: true
			}
		});
		this.formController.setSetting({
			customRule: {
				validator1: {
					func: function(value) {
						return dfd1.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				},
				validator2: {
					func: function(value) {
						return dfd2.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val('a');
		$('input[name="b"]').val('b');

		var result = this.formController.validate();
		var propA = 'a';
		var propB = 'b';

		this.assertValidWaiting(result);
		this.assertValidWaitingProp(result, propA);
		this.assertValidWaitingProp(result, propB);

		strictEqual(result.asyncWaitingProperties.length, 2,
				'バリデートが完了していないプロパティa,bの非同期ルールがあるのでasyncWaitingProperties=2');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティaが格納されていること');
		notStrictEqual(result.asyncWaitingProperties.indexOf('b'), -1,
				'asyncWaitingPropertiesにプロパティbが格納されていること');

		dfd1.resolve({
			valid: true
		});

		this.assertValidWaiting(result);
		this.assertValidProp(result, propA);
		this.assertValidWaitingProp(result, propB);
		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していないプロパティbの非同期ルールがあるのでasyncWaitingProperties=1');
		notStrictEqual(result.asyncWaitingProperties.indexOf('b'), -1,
				'asyncWaitingPropertiesにプロパティbが格納されていること');

		dfd2.reject({
			valid: false
		});

		this.assertInvalid(result);
		this.assertValidProp(result, propA);
		this.assertInvalidProp(result, propB);
		var invalidReason = result.invalidReason;
		strictEqual(Object.keys(invalidReason).length, 1, 'invalidReasonが持つオブジェクトは1つである');
		strictEqual('b' in invalidReason, true, 'invalidReasonが持つキーはbである');

		var invalidRules = invalidReason.b.violation;
		strictEqual(invalidRules.length, 1, 'プロパティbのエラーのルール数は1つである');
		strictEqual(invalidRules[0].ruleName, 'validator2', 'validator2のエラーが格納されている');
		strictEqual(result.asyncWaitingProperties.length, 0,
				'非同期ルールのバリデートが完了したのでasyncWaitingProperties=0');
	});

	test('2つの要素に非同期ルールを設定(1つ目のバリデート失敗、2つ目のバリデート成功)する場合', function() {
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		this.formController.addRule({
			a: {
				validator1: true
			},
			b: {
				validator2: true
			}
		});
		this.formController.setSetting({
			customRule: {
				validator1: {
					func: function(value) {
						return dfd1.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				},
				validator2: {
					func: function(value) {
						return dfd2.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val('a');
		$('input[name="b"]').val('b');

		var result = this.formController.validate();
		var propA = 'a';
		var propB = 'b';

		this.assertValidWaiting(result);
		this.assertValidWaitingProp(result, propA);
		this.assertValidWaitingProp(result, propB);

		strictEqual(result.asyncWaitingProperties.length, 2,
				'バリデートが完了していないプロパティa,bの非同期ルールがあるのでasyncWaitingProperties=2');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティaが格納されていること');
		notStrictEqual(result.asyncWaitingProperties.indexOf('b'), -1,
				'asyncWaitingPropertiesにプロパティbが格納されていること');

		dfd1.reject({
			valid: false
		});

		strictEqual(result.isValid, false, 'バリデートに失敗するのでisValid=false');
		strictEqual(result.isAllValid, false, 'バリデートに失敗するのでisAllValidはfalse');
		strictEqual(result.violationCount, 1, 'バリデートに失敗するのでviolationCount=1');
		strictEqual(result.invalidCount, 1, 'バリデートに失敗するのでinvalidCount=1');
		strictEqual(Object.keys(result.invalidReason).length, 1, 'invalidReasonが持つオブジェクトは1であること');

		this.assertInvalidProp(result, propA);
		this.assertValidWaitingProp(result, propB);

		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していないプロパティbの非同期ルールがあるのでasyncWaitingProperties=1');
		strictEqual(result.asyncWaitingProperties[0], 'b',
				'asyncWaitingPropertiesにプロパティbが格納されていること');
		var invalidReason = result.invalidReason;
		strictEqual(Object.keys(invalidReason).length, 1, 'invalidReasonが持つオブジェクトは1つである');
		strictEqual('a' in invalidReason, true, 'invalidReasonが持つキーはaである');

		var invalidRulesA = invalidReason.a.violation;
		strictEqual(invalidRulesA.length, 1, 'プロパティaのエラーのルール数は1つである');
		strictEqual(invalidRulesA[0].ruleName, 'validator1', 'validator1のエラーが格納されている');

		dfd2.resolve({
			valid: true
		});

		this.assertInvalid(result);
		this.assertInvalidProp(result, propA);
		this.assertValidProp(result, propB);
		strictEqual(Object.keys(invalidReason).length, 1, 'invalidReasonが持つオブジェクトは1つである');
		strictEqual('a' in invalidReason, true, 'invalidReasonが持つキーはaである');

		strictEqual(invalidRulesA.length, 1, 'プロパティaのエラーのルール数は1つである');
		strictEqual(invalidRulesA[0].ruleName, 'validator1', 'validator1のエラーが格納されている');
		strictEqual(result.asyncWaitingProperties.length, 0,
				'非同期ルールのバリデートが完了したのでasyncWaitingProperties=0');
	});

	test('1つの要素に同期・非同期ルール(バリデート成功)が混在している場合', function() {
		var dfd = h5.async.deferred();
		this.formController.addRule({
			a: {
				required: true,
				validator: true
			},
		});
		this.formController.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return dfd.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val("a");
		var result = this.formController.validate();
		var propA = 'a';

		this.assertValidWaiting(result);
		this.assertValidWaitingProp(result, propA);

		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していない非同期ルールがあるのでasyncWaitingProperties=1');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティaが格納されていること');

		dfd.resolve({
			valid: true
		});

		this.assertValid(result);
		this.assertValidProp(result, propA);
	});

	test('1つの要素に同期・非同期ルール(バリデート失敗)が混在している場合', function() {
		var dfd = h5.async.deferred();
		this.formController.addRule({
			a: {
				required: true,
				validator: true
			},
		});
		this.formController.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return dfd.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val("a");
		var result = this.formController.validate();
		var propA = 'a';

		this.assertValidWaiting(result);
		this.assertValidWaitingProp(result, propA);

		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していない非同期ルールがあるのでasyncWaitingProperties=1');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティaが格納されていること');

		dfd.reject({
			valid: false
		});

		this.assertInvalid(result);
		this.assertInvalidProp(result, propA);

		strictEqual(result.asyncWaitingProperties.length, 0,
				'非同期ルールのバリデートが完了したのでasyncWaitingProperties=0');
		var invalidReason = result.invalidReason;
		strictEqual(Object.keys(invalidReason).length, 1, 'invalidReasonが持つオブジェクトは1つである');
		strictEqual('a' in invalidReason, true, 'invalidReasonが持つキーはaである');

		var invalidRules = invalidReason.a.violation;
		strictEqual(invalidRules.length, 1, 'エラーのルール数は1つである');
		strictEqual(invalidRules[0].ruleName, 'validator', 'validatorのエラーが格納されている');
	});

	module(
			'validationResultのasyncWaitingProperties(abortした場合)',
			{
				setup: function() {
					stop();
					var html = '<form class="testForm"><input name="a"></form>';
					$('#qunit-fixture').append(html);
					this.formController = h5.core.controller('.testForm', h5.ui.FormController);
					this.formController.readyPromise.done(function() {
						start();
					});
				},
				assertValidWaiting: function(result) {
					strictEqual(result.isValid, true, 'バリデートが完了していないのでisValid=true');
					strictEqual(result.isAllValid, null, 'バリデートが完了していないのでisAllValidはnull');
					strictEqual(result.violationCount, 0, 'バリデートが完了していないのでviolationCount=0');
					strictEqual(result.invalidCount, 0, 'バリデートが完了していないのでinvalidCount=0');
					strictEqual(Object.keys(result.invalidReason).length, 0,
							'invalidReasonが持つオブジェクトは0であること');
					var invalidReason = result.invalidReason;
					strictEqual(Object.keys(invalidReason).length, 0, 'invalidReasonが持つオブジェクトは0である');
				},
				assertValidWaitingProp: function(result, prop) {
					ok($.inArray(prop, result.validProperties) == -1,
							'validPropertiesにプロパティが格納されていない');
					ok($.inArray(prop, result.invalidProperties) == -1,
							'invalidPropertiesにプロパティが格納されていない');
					ok($.inArray(prop, result.validatingProperties) !== -1,
							'validatingPropertiesにプロパティが格納されている');
				},
				assertValidAborted: function(result) {
					strictEqual(result.isValid, true, 'バリデートが中断したのでisValid=true');
					strictEqual(result.isAllValid, null, 'バリデートが中断したのでisAllValidはnull');
					strictEqual(result.violationCount, 0, 'バリデートが中断したのでviolationCount=0');
					strictEqual(result.invalidCount, 0, 'バリデートが中断したのでinvalidCount=0');
					strictEqual(Object.keys(result.invalidReason).length, 0,
							'invalidReasonが持つオブジェクトは0であること');
					strictEqual(result.asyncWaitingProperties.length, 0,
							'バリデートが中断したのでasyncWaitingProperties=0');
					var invalidReason = result.invalidReason;
					strictEqual(Object.keys(invalidReason).length, 0, 'invalidReasonが持つオブジェクトは0である');
				},
				assertValidAbortedProp: function(result, prop) {
					ok($.inArray(prop, result.validProperties) == -1,
							'validPropertiesにプロパティが格納されていない');
					ok($.inArray(prop, result.invalidProperties) == -1,
							'invalidPropertiesにプロパティが格納されていない');
					ok($.inArray(prop, result.validatingProperties) !== -1,
							'validatingPropertiesにプロパティが格納されている');
				}
			});

	test('1つの要素に非同期ルール(バリデート成功)を1つ設定する場合', function() {
		var dfd = h5.async.deferred();
		this.formController.addRule({
			a: {
				validator: true
			},
		});
		this.formController.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return dfd.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val("a");
		var result = this.formController.validate();
		var propA = 'a';

		this.assertValidWaiting(result);
		this.assertValidWaitingProp(result, propA);

		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していない非同期ルールがあるのでasyncWaitingProperties=1');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティaが格納されていること');

		var eventsAbort = [];
		result.addEventListener('abort', function(ev) {
			eventsAbort.push(ev);
		});

		var eventsValidate = [];
		result.addEventListener('validate', function(ev) {
			eventsValidate.push(ev);
		});
		result.addEventListener('validateComplete', function(ev) {
			eventsValidate.push(ev);
		});

		result.abort();
		strictEqual(eventsAbort.length, 1, 'validateを中断するとabortイベントが発生すること');
		strictEqual(result.isAborted, true, 'abort()を呼んだのでisAborted=trueであること');
		strictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティが格納されていないこと');

		dfd.resolve({
			valid: true
		});

		strictEqual(eventsValidate.length, 0,
				'abort()を呼ぶとvalidateイベントもvalidateCompleteイベントも発生しないこと');

		this.assertValidAborted(result);
		this.assertValidAbortedProp(result, propA);
	});

	test('1つの要素に非同期ルール(バリデート失敗)を1つ設定する場合', function() {
		var dfd = h5.async.deferred();
		this.formController.addRule({
			a: {
				validator: true
			},
		});
		this.formController.setSetting({
			customRule: {
				validator: {
					func: function(value) {
						return dfd.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				}
			}
		});

		$('input[name="a"]').val("a");
		var result = this.formController.validate();
		var propA = 'a';

		this.assertValidWaiting(result);
		this.assertValidWaitingProp(result, propA);

		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していない非同期ルールがあるのでasyncWaitingProperties=1');
		strictEqual(result.asyncWaitingProperties.length, 1,
				'asyncWaitingPropertiesにプロパティが1つ格納されていること');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティaが格納されていること');

		var eventsAbort = [];
		result.addEventListener('abort', function(ev) {
			eventsAbort.push(ev);
		});

		var eventsValidate = [];
		result.addEventListener('validate', function(ev) {
			eventsValidate.push(ev);
		});
		result.addEventListener('validateComplete', function(ev) {
			eventsValidate.push(ev);
		});

		result.abort();
		strictEqual(eventsAbort.length, 1, 'validateを中断するとabortイベントが発生すること');
		strictEqual(result.isAborted, true, 'abort()を呼んだのでisAborted=trueであること');
		strictEqual(result.asyncWaitingProperties.length, 0,
				'asyncWaitingPropertiesにプロパティが1つも格納されていないこと');

		dfd.reject({
			valid: false
		});

		strictEqual(eventsValidate.length, 0,
				'abort()を呼ぶとvalidateイベントもvalidateCompleteイベントも発生しないこと');

		this.assertValidAborted(result);
		this.assertValidAbortedProp(result, propA);
	});

	test('1つの要素に非同期ルール(バリデート成功)を2つ設定する場合', function() {
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		this.formController.addRule({
			a: {
				validator1: true,
				validator2: true
			},
		});
		this.formController.setSetting({
			customRule: {
				validator1: {
					func: function(value) {
						return dfd1.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				},
				validator2: {
					func: function(value) {
						return dfd2.promise();
					},
					isForceEnabledWhenEmpty: false,
					message: 'errorMessage',
				},
			}
		});

		$('input[name="a"]').val("a");
		var result = this.formController.validate();
		var propA = 'a';

		this.assertValidWaiting(result);
		this.assertValidWaitingProp(result, propA);

		strictEqual(result.asyncWaitingProperties.length, 1,
				'バリデートが完了していない非同期ルールがあるのでasyncWaitingProperties=1');
		strictEqual(result.asyncWaitingProperties.length, 1,
				'asyncWaitingPropertiesにプロパティが1つ格納されていること');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティaが格納されていること');

		var eventsAbort = [];
		result.addEventListener('abort', function(ev) {
			eventsAbort.push(ev);
		});

		var eventsValidate = [];
		result.addEventListener('validate', function(ev) {
			eventsValidate.push(ev);
		});

		var eventsValidateComplete = [];
		result.addEventListener('validateComplete', function(ev) {
			eventsValidateComplete.push(ev);
		});

		dfd1.resolve({
			valid: true
		});

		strictEqual(eventsValidate.length, 0, 'validateイベントイベントは発生しないこと');
		strictEqual(result.asyncWaitingProperties.length, 1,
				'asyncWaitingPropertiesにプロパティが1つ格納されていること');
		notStrictEqual(result.asyncWaitingProperties.indexOf('a'), -1,
				'asyncWaitingPropertiesにプロパティaが格納されていること');

		result.abort();
		strictEqual(eventsAbort.length, 1, 'validateを中断するとabortイベントが発生すること');
		strictEqual(result.isAborted, true, 'abort()を呼んだのでisAborted=trueであること');
		strictEqual(result.asyncWaitingProperties.length, 0,
				'asyncWaitingPropertiesにプロパティが格納されていないこと');

		dfd2.resolve({
			valid: true
		});

		strictEqual(eventsValidate.length, 0, 'abort()を呼ぶとvalidateイベントは発生しないこと');
		strictEqual(eventsValidateComplete.length, 0, 'abort()を呼ぶとvalidateCompleteイベントは発生しないこと');

		this.assertValidAborted(result);
		this.assertValidAbortedProp(result, propA);
	});
});
