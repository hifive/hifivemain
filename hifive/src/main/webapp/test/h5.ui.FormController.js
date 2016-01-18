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


});
