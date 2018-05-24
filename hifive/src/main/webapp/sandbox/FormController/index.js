(function() {
	var pageController = {
		__name: 'sample.PageController',
		_objIndex: 0,
		__meta: {
			formController: {
				rootElement: '#form1'
			}
		},

		__init: function() {
			var setting = {
				ruleDefault: {
					size: {
					//明示的に指定しない場合、ルールごとのデフォルトが適用される
					//isForceEnabledWhenEmpty: true

					message: 'sizeのデフォルトメッセージを<span style="font-weight:bold; font-size: 20px">上書き</span>する',

					//validateOn: ['validate'],

					//resolveOn: ['change']

					}
				},

				//明示的にtrueを指定した場合のみtrue、それ以外または未指定の場合はfalse
				isAllRulesEnabledWhenEmpty: false,

				customRule: {
					validator1: {
						//valueにはinput要素の値（生文字列）が渡される。戻り値はboolean。
						//							func: function(value) {
						//								var dfd = h5.async.deferred();

						//								setTimeout(function() {

						//									if (value === '1') {
						//										dfd.resolve(true);
						//										return true;
						//									}
						//									else {
						//										dfd.reject(false);
						//										return false;
						//									}


						//								}, 1000);

						//								return dfd.promise();
						//							},

						func: function(value) {
							return false;
						},

						//エラーメッセージ。必須。「{displayName}」と書くと、表示名に置き換わる。
						message: '{displayName}はカスタムルール1に<span style="color:red">赤い色</span>&lt; 3違反しています。',

						//message: function(param) {
						//	return "test";
						//},

						//'{displayName}はカスタムルール1に違反しています。',

						//このバリデータを、値が空文字の場合でも実行するかどうか。デフォルト値：未指定。
						isForceEnabledWhenEmpty: true,

						//このバリデータを、どのタイミングで実行するかを指定する。
						//未指定またはnullの場合、プラグインのupdateOnで存在するタイミング。
						validateOn: ['change', 'validate'],

						//未指定またはnullの場合はvalidateOnと同じタイミング。
						//なお、明示的に指定した場合でも、validateOnのタイミングは必ず含まれる。
						resolveOn: ['validate', 'focus', 'blur']

					},
					novalid: {
						func: function(value) {
							return false;
						},
						message: 'とにかくNGです。',
					//isForceEnabledWhenEmpty: false  //デフォルトはfalse
					}
				},

				property: {
					user: {
					//							srcElement: '#userNameInput',
					//							replaceElement: '',
					//							valueFunc: function(rootElement, name) {

					//							}
					}
				//							message: function(param) {
				//								console.log(param);
				//							}
				},

				output: { // 各プラグイン毎の設定
					balloon: { // キー名にプラグイン名
						placement: 'right' // 設定プロパティと値を記述
					},

					bsBalloon: { // キー名にプラグイン名
						placement: 'right' // 設定プロパティと値を記述
					},

					style: {

					},

					asyncIndicator: {

					},

					message: {

					},

					composition: {
						container: '#compositionErrors',
						wrapper: '<li></li>',

						//message: 'COMPOSITION MESSAGE: {displayName}のエラー',

						//どのタイミングの表示を更新するか。"validate"はvalidate()メソッド呼び出し時、"blur"はフォーカスが外れたとき。
						//updateOn: ['blur'],

						//項目に対するすべてのエラーを出力するかどうか。デフォルト値：true。
						showAllErrors: true,

						hideWhenEmpty: true
					}
				},
			};

			this.formController.setSetting(setting);

			this.formController.addOutput('composition');
			//this.formController.addOutput('bsBalloon');
			this.formController.addOutput('balloon');

			this.formController.addOutput('message');
			//this.formController.addOutput('style');
			//this.formController.addOutput('asyncIndicator');

			var preValidationHookFunction = function(context) {
				console.log(context);
				if (context.timing === h5.validation.ValidationTiming.VALIDATE) {
					context.skip();
				}
				//context = {skip(), rule(nameとargを持つオブジェクト), name, value, timing }
			};

			//this.formController.setPreValidationHook(preValidationHookFunction);

			var rules = {
				textarea1: {
					required: true
				},

				user: {
					validator1: true,
					required: true,
					future: new Date(1523258866152)
				//digits: [3, 2],
				//size: [2, 5]
				},

				grp1: {
					//required: true
					validator1: true
				}
			};
			this.formController.addRule(rules);

			//var composition = this.formController.getOutput('composition');
		},

		formController: h5.ui.FormController,
		'.getValue click': function(ctx, $el) {
			var ret = this.formController.getValue("grp1");
			console.log(ret);
			var $set = $('<button class="set">setValue(obj' + ++this._objIndex + ')</button>');
			$el.after($set);
			$set.data('obj', ret);
		},
		'.set click': function(ctx, $el) {
			var obj = $el.data('obj');
			this.formController.setValue(obj);
		},
		'.validate click': function(ctx) {
			this._removeValidateError();
			var result = this.formController.validate();
			//				this.$find('.validateResult').text(QUnit.jsDump.parse(result));
		},
		'.clear click': function(ctx) {
			ctx.event.preventDefault();
			this.formController.clearAll();
		},
		'#form1 [submit]': function() {
			this._removeValidateError();
		},
		_removeValidateError: function() {
			this.$find('.hasError').removeClass('hasError');
			this.$find('.errorMsg').remove();
		},
		_onError: function(element, property, reason) {
			$(element).parent().addClass('hasError');
			var $msg = $('<span class="errorMsg"></span>');
			$msg.text(reason.message);
			$(element).after($msg);
		},

		'{rootElement} validate': function() {
			console.log(this.formController.getLastValidationResult().invalidProperties.length);
		},

		//_isDisabled: false,

		'.resetValidation click': function() {
			this.formController.resetValidation();

			/*
			if(this._isDisabled) {
				this.formController.enableRule('user');
			} else {
				this.formController.disableRule('user');
			}
			this._isDisabled = !this._isDisabled;
			*/
		}
	};

	$(function() {
		h5.core.controller(document.body, pageController);
	});
})();