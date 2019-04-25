$(function() {
	var REGEXP_MAIL_ADRESS = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;

	//ロジックを定義
	sampleLogic = {
		__name: 'sample.sampleLogic',

		//ユーザIDの重複チェックを行う
		isExistUserid: function(userid) {
			var dfd = h5.async.deferred();
			var waitingTime = 100 + parseInt(Math.random() * 10) * 100;
			setTimeout(function() {
				// ユーザIDがhifiveだったらrejectする
				if (userid === 'hifive') {
					// rejectのパラメータはサーバが返すメッセージを想定
					dfd.reject({
						valid: false,
						value: userid,
						code: '1001',
						message: 'already exist'
					});
					return;
				}
				dfd.resolve({
					valid: true,
					value: userid
				});
			}, waitingTime);
			return dfd.promise();
		},

		//メールの重複チェックを行う
		isExistMail: function(mail) {
			var dfd = h5.async.deferred();
			var waitingTime = 100 + parseInt(Math.random() * 10) * 100;
			setTimeout(function() {
				// メールがhifive@hifive.comだったらrejectする
				if (mail === 'hifive@hifive.com') {
					// rejectのパラメータはサーバが返すメッセージを想定
					dfd.reject({
						valid: false,
						value: mail,
						code: '1001',
						message: 'already exist'
					});
					return;
				}
				dfd.resolve({
					valid: true,
					value: mail
				});
			}, waitingTime);
			return dfd.promise();
		},

		// メールアドレスの正規表現チェックを行う
		isCorrectMail: function(mail) {
			var dfd = h5.async.deferred();
			var waitingTime = 100 + parseInt(Math.random() * 10) * 100;
			setTimeout(function() {
				if (!REGEXP_MAIL_ADRESS.test(mail)) {
					// rejectのパラメータはサーバが返すメッセージを想定
					dfd.reject({
						valid: false,
						value: mail,
						code: '1002',
						message: 'incorrect mail'
					});
					return;
				}
				dfd.resolve({
					valid: true,
					value: mail
				});
			}, waitingTime);
			return dfd.promise();
		}
	};

	var pageController = {
		__name: 'sample.PageController',

		// ロジックの宣言
		sampleLogic: sampleLogic,
		_objIndex: 0,

		// バリデーションコントローラの設定
		_formController: h5.ui.FormController,
		__meta: {
			_formController: {
				rootElement: '#form1'
			}
		},

		__ready: function() {

			// 各プラグイン毎のエラー出力設定
			var output = {
				style: {
					errorClassName: 'has-error',
					successClassName: 'success',
					// 非同期validate用の設定。validate中に適用するクラス名
					validatingClassName: 'validating',
					replaceElement: function(element) {
						// エラークラス追加対象は、input等の親のform-group要素に変換する
						return $(element).closest('.form-group');
					}
				},
				composition: {
					container: $('.globalError'),
					wrapper: 'li'
				},
				asyncIndicator: {
					replaceElement: function(element) {
						// input要素の前に表示
						var $element = $(element);
						var $parent = $element.parent();
						var $indicatorWrapper = $parent.find('.validateIndicatorWrapper');
						if (!$indicatorWrapper.length) {
							$indicatorWrapper = $('<div class="validateIndicatorWrapper">');
							$element.before($indicatorWrapper);
						}
						return $indicatorWrapper;
					}
				}
			};
			//各プロパティ毎のエラー出力設定
			var property = {
				userid: {
					message: function(param) {
						switch (param.violation[0].ruleName) {
						case 'required':
							return '必須です';
						case 'size':
							var min = param.violation[0].ruleValue.min;
							var val = param.value;
							if (val.length < min) {
								return '短すぎます';
							}
							return '長すぎます';
						case 'customFunc':
							var serverMessage = param.violation[0].reason[0];
							switch (serverMessage.code) {
							case '1001':
								return h5.u.str
										.format(
												'{displayName}:"{value}"は既に登録されています。(code={1.code}) "{1.message}"',
												param, serverMessage);
							}
						}
					},
					composition: {
						message: '必須'
					}
				},
				mail: {
					message: function(param) {
						switch (param.violation[0].ruleName) {
						case 'required':
							return '必須です';
						case 'customFunc':
							var serverMessage = param.violation[0].reason[0];
							switch (serverMessage.code) {
							case '1001':
								return h5.u.str
										.format(
												'{displayName}:"{value}"は既に登録されています。(code={1.code}) "{1.message}"',
												param, serverMessage);
							}
						case 'isCorrectMail':
							var serverMessage = param.violation[0].reason[0];
							switch (serverMessage.code) {
							case '1002':
								return h5.u.str
										.format(
												'{displayName}:"{value}" 正しいメールアドレスではありません。(code={1.code}) "{1.message}"',
												param, serverMessage);
							}
						}
					}
				}
			};

			var formCtrl = this._formController;

			// プラグインの有効化
			formCtrl.addOutput(['composition', 'message', 'style', 'bsBalloon', 'balloon',
					'asyncIndicator']);

			// エラー出力設定
			var sampleSetting = {
				output: output,
				property: property
			};
			formCtrl.setSetting(sampleSetting);

			// validateルール設定
			h5.validation.defineRule('isCorrectMail', this.sampleLogic.isCorrectMail);

			formCtrl.addRule({
				userid: {
					required: true,
					size: [3, 10],
					customFunc: this.sampleLogic.isExistUserid
				},
				mail: {
					required: true,
					customFunc: this.sampleLogic.isExistMail,
					isCorrectMail: true,
				}
			});
		},

		'{.resetValidation} click': function() {
			this._formController.resetValidation();
		}
	};
	h5.core.controller(document.body, pageController);
});