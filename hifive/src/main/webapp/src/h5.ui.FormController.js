(function() {
	// TODO formのvalidatorで不要な項目は要らない
	var DATA_RULE_REQUIRED = 'require';
	var DATA_RULE_ASSERT_FALSE = 'assertFalse';
	var DATA_RULE_ASSERT_TRUE = 'assertTrue';
	var DATA_RULE_NULL = 'nul';
	var DATA_RULE_NOT_NULL = 'notNull';
	var DATA_RULE_MAX = 'max';
	var DATA_RULE_MIN = 'min';
	var DATA_RULE_FUTURE = 'future';
	var DATA_RULE_PAST = 'past';
	var DATA_RULE_PATTERN = 'pattern';
	var DATA_RULE_SIZE = 'size';

	// デフォルトで用意しているvalidateルール生成関数
	var defaultRuleCreators = {
		requireRuleCreator: function(inputElement) {
			if ($(inputElement).data(DATA_RULE_REQUIRED) != null) {
				return true;
			}
		},
		assertFalseRuleCreator: function(inputElement) {
			if ($(inputElement).data(DATA_RULE_ASSERT_FALSE) != null) {
				return true;
			}
		},
		assertTrueRuleCreator: function(inputElement) {
			if ($(inputElement).data(DATA_RULE_ASSERT_TRUE) != null) {
				return true;
			}
		},
		nulRuleCreator: function(inputElement) {
			if ($(inputElement).data(DATA_RULE_NULL) != null) {
				return true;
			}
		},
		notNullRuleCreator: function(inputElement) {
			if ($(inputElement).data(DATA_RULE_NOT_NULL) != null) {
				return true;
			}
		},
		maxRuleCreator: function(inputElement) {
			var data = $(inputElement).data(DATA_RULE_MAX);
			if (data != null) {
				if (typeof data === 'number') {
					return data;
				}
				if (isArray(data)) {
					return [parseFloat(data[0]), $.trim(data[1]) === 'true'];
				}
				return parseFloat(data);
			}
		},
		minRuleCreator: function(inputElement) {
			var data = $(inputElement).data(DATA_RULE_MIN);
			if (data != null) {
				if (typeof data === 'number') {
					return data;
				}
				if (isArray(data)) {
					return [parseFloat(data[0]), $.trim(data[1]) === 'true'];
				}
				return parseFloat(data);
			}
		},
		futureRuleCreator: function(inputElement) {
			var data = $(inputElement).data(DATA_RULE_FUTURE);
			if (data != null) {
				return new Date(data);
			}
		},
		pastRuleCreator: function(inputElement) {
			var data = $(inputElement).data(DATA_RULE_PAST);
			if (data != null) {
				return new Date(data);
			}
		},
		digitsRuleCreator: function(inputElement) {
			var data = $(inputElement).data(DATA_RULE_PAST);
			if (data != null) {
				if (isArray(data)) {
					for (var i = 0, l = data.length; i < l; i++) {
						data[i] = parseInt(data[i]);
					}
					return data;
				}
				return parseInt(data);
			}
		},
		patternRuleCreator: function(inputElement) {
			var data = $(inputElement).data(DATA_RULE_PATTERN);
			if (data != null) {
				return new RegExp(data);
			}
		},
		sizeRuleCreator: function(inputElement) {
			var data = $(inputElement).data(DATA_RULE_SIZE);
			if (data != null) {
				if (isArray(data)) {
					for (var i = 0, l = data.length; i < l; i++) {
						data[i] = parseInt(data[i]);
					}
					return data;
				}
				return parseInt(data);
			}
		}
	};

	// TODO formのvalidatorで不要な項目は要らない
	var defaultInvalidMessage = {
		require: '[%=label%]は必須項目です',
		min: '[%= label %]は[%=param.min%][%=param.include?"以上の":"より大きい"%]数値を入力してください。',
		max: '[%=label%]は[%=param.max%][%=param.include?"以下の":"未満"%]の数値を入力してください。',
		pattern: '[%=label%]は正規表現[%=param.regexp%]を満たす文字列を入力してください。',
		digits: '[%=label%]は整数部分[%=param.integer%]桁、小数部分[%=fruction%]桁以下の数値を入力してください。',
		size: '[%=label%]は[%=param.min%]以上[%=param.max%]以下の文字数でなければいけません。',
		future: '[%=label%]は現在時刻より未来の時刻を入力してください。',
		past: '[%=label%]は現在時刻より過去の時刻を入力してください。',
		nul: '[%=label%]はnullでなければなりません。',
		notNull: '[%=label%]はnullでない値を設定してください。',
		assertFalse: '[%=label%]はfalseとなる値を入力してください。',
		assertTrue: '[%=label%]はtrueとなる値を入力してください。'
	};

	var controller = {
		__name: 'h5.ui.FormController',
		_config: {},
		_bindedForm: null,
		_ruleCreators: [],
		invalidMessageView: null,
		defaultRuleCreators: defaultRuleCreators,

		__construct: function() {
			// デフォルトルールの追加
			// TODO formのvalidatorで不要な項目は要らない
			this.addRuleCreator(DATA_RULE_REQUIRED, defaultRuleCreators.requireRuleCreator);
			this.addRuleCreator(DATA_RULE_ASSERT_FALSE, defaultRuleCreators.assertFalseRuleCreator);
			this.addRuleCreator(DATA_RULE_ASSERT_TRUE, defaultRuleCreators.assertTrueRuleCreator);
			this.addRuleCreator(DATA_RULE_NULL, defaultRuleCreators.nulRuleCreator);
			this.addRuleCreator(DATA_RULE_NOT_NULL, defaultRuleCreators.notNullRuleCreator);
			this.addRuleCreator(DATA_RULE_MAX, defaultRuleCreators.maxRuleCreator);
			this.addRuleCreator(DATA_RULE_MIN, defaultRuleCreators.minRuleCreator);
			this.addRuleCreator(DATA_RULE_FUTURE, defaultRuleCreators.futureRuleCreator);
			this.addRuleCreator(DATA_RULE_PAST, defaultRuleCreators.pastRuleCreator);
			this.addRuleCreator(DATA_RULE_PATTERN, defaultRuleCreators.patternRuleCreator);
			this.addRuleCreator(DATA_RULE_SIZE, defaultRuleCreators.sizeRuleCreator);

			// デフォルトメッセージの追加
			this.invalidMessageView = h5.core.view.createView();
			for ( var p in defaultInvalidMessage) {
				this.invalidMessageView.register(p, defaultInvalidMessage[p]);
			}
		},
		__init: function() {
			// form要素にバインドされていればそのformに属しているform関連要素を見る
			// すなわち、ルートエレメント以下にあるinputでもform属性で別IDが指定されていたらそのinputは対象外
			// また、ルートエレメント外にあるinputでも、form属性がルートエレメントのformを指定していれば対象とする
			if (this.rootElement.tagName.toUpperCase() === 'FORM') {
				this._bindedForm = this.rootElement;
			}
		},
		__ready: function() {
			if (this._bindedForm) {
				this.on(this._bindedForm, 'submit', this._submitHandler);
			}
		},

		/**
		 * このコントローラが管理するフォーム内のフォーム部品の値を集約したオブジェクトを生成する
		 *
		 * @memberOf h5.ui.FormController
		 * @returns {Object}
		 */
		gather: function() {
			var $elements = this._getFormControls();
			var ret = {};
			$elements.each(function() {
				var name = this.name;
				if (this.type === 'file') {
					// ファイルオブジェクトを覚えておく
					var files = this.files;
					var filesLength = files.length;
					if (!filesLength) {
						return;
					}
					ret[name] = ret[name] || [];
					for (var i = 0; i < filesLength; i++) {
						ret[name].push(files[i]);
					}
					return;
				}
				if (!name || (this.type === 'radio' || this.type === 'checkbox')
						&& this.checked === false) {
					return;
				}
				var value = $(this).val();
				if (value == null) {
					return;
				}
				if (ret[name] !== undefined) {
					if (!$.isArray(ret[name])) {
						ret[name] = [ret[name]];
					}
					if ($.isArray(value)) {
						// select multipleの場合は値は配列
						Array.prototype.push.apply(ret[name], value);
					} else {
						ret[name].push(value);
					}
				} else {
					ret[name] = value;
				}
			});
			return ret;
		},

		/**
		 * このコントローラが管理するフォームに対して、値を集約したオブジェクトから値をセットする
		 *
		 * @memberOf h5.ui.FormController
		 * @param {Object} フォーム部品の値を集約したオブジェクト
		 */
		set: function(obj) {
			var $elements = this._getFormControls();
			var indexMap = {};
			$elements.each(function() {
				var name = this.name;
				if (!name) {
					return;
				}
				var value = obj[name];
				// radio, checkboxの場合
				if ((this.type === 'radio' || this.type === 'checkbox')) {
					if ($.isArray(value)) {
						indexMap[name] = indexMap[name] ? indexMap[name] + 1 : 0;
						value = value[indexMap[name]];
					}
					// 値が一致するならチェック
					$(this).prop('checked', $(this).val() === value);
					return;
				}
				// select multipleの場合
				if ($(this).is('select[multiple]')) {
					$(this).val([]);
					if ($.isArray(value)) {
						indexMap[name] = indexMap[name] || 0;
						value = value.slice(indexMap[name]);
					}
					if (value == null) {
						return;
					}
					var arrayValue = [];
					for (var i = 0, l = value.length; i < l; i++) {
						arrayValue.push(value[i]);
						$(this).val(arrayValue);
						indexMap[name]++;
						var after = $(this).val();
						after = $.isArray(after) ? after : [after];
						if (after.length < arrayValue.length) {
							indexMap[name]--;
							break;
						}
					}
					return;
				}
				// その他
				if ($.isArray(value)) {
					indexMap[name] = indexMap[name] || 0;
					value = value[indexMap[name]++];
				}
				$(this).val(value);
			});
		},

		/**
		 * フォーム部品の値をすべてクリアする
		 *
		 * @memberOf h5.ui.FormController
		 */
		clear: function() {
			this._getFormControls().each(function() {
				if (this.type === 'radio' || this.type === 'checkbox') {
					$(this).prop('checked', false);
					return;
				}
				$(this).val(null);
			});
		},

		/**
		 * validateルール生成関数の登録
		 *
		 * @param key
		 * @param func
		 */
		addRuleCreator: function(key, func) {
			this._ruleCreators.push({
				key: key,
				func: func
			});
		},

		validate: function() {
			var $formControls = this._getFormControls();
			$formControls.removeClass('hasError');
			var validateRule = {};
			$formControls.each(this.ownWithOrg(function(element) {
				var name = element.getAttribute('name');
				// 名前なしは何もしない
				if (name == null) {
					return;
				}
				var ruleOfProp = {};
				validateRule[name] = ruleOfProp;
				for (var i = 0, l = this._ruleCreators.length; i < l; i++) {
					var key = this._ruleCreators[i].key;
					var func = this._ruleCreators[i].func;
					var ret = func(element);
					if (ret !== undefined) {
						ruleOfProp[key] = ret;
					}
				}
			}));
			var validator = h5.validation.createValidator('form');
			validator.addRule(validateRule);
			var result = validator.validate(this.gather());
			if (!result.isValid) {
				// エラー表示
				var globalMsgs = [];
				for (var i = 0, l = result.invalidProperties.length; i < l; i++) {
					var name = result.invalidProperties[i];
					var outputConfig = this._config.output && this._config.output[name];
					var onError = outputConfig && outputConfig.onError;
					if (!onError) {
						continue;
					}
					var element = $formControls.filter('[name="' + name + '"]');
					var msg = this._createOnErrorMessage(result, name);
					onError(element, name, {
						message: msg
					});
					globalMsgs.push(msg);
				}
				// 全エラーメッセージを表示
				var globalOutput = this._config.globalOutput
				if (globalOutput) {
					var $container = $(globalOutput.container);
					var tagName = globalOutput.wrapper;
					$container.empty();
					for (var i = 0, l = globalMsgs.length; i < l; i++) {
						var msg = globalMsgs[i];
						var p = document.createElement(tagName);
						$(p).html(msg);
						$container.append(p);
					}
				}
			}
			return result;
		},
		setOutputConfig: function(outputConfig) {
			this._config.output = outputConfig;
		},
		setGlobalOutput: function(globalOutput) {
			this._config.globalOutput = globalOutput;
		},

		_submitHandler: function(ctx, $el) {
			ctx.event.preventDefault();
			var validateResult = this.validate();
			if (validateResult.isValid) {
				// 送信
				this._bindedForm.submit();
			}
		},

		/**
		 * このコントローラが管理するフォームに属するフォーム部品を取得
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 * @returns {jQuery}
		 */
		_getFormControls: function() {
			var $innerFormControls = this.$find('input,select,textarea').not(
					'[type="submit"],[type="reset"],[type="image"]');
			if (!this._bindedForm) {
				return $innerFormControls;
			}

			var formId = $(this._bindedForm).attr('id');
			// ブラウザがform属性に対応しているかどうかに関わらず、
			// HTML5の仕様に従ってformに属するフォームコントロール部品を列挙する
			var $formControls = $('input,select,textarea').not(
					'[type="submit"],[type="reset"],[type="image"]');
			return $formControls.filter(function() {
				var $this = $(this);
				var formAttr = $this.attr('form');
				// form属性がこのコントローラのフォームを指している
				// または、このコントローラのフォーム内の要素でかつform属性指定無し
				return (formAttr && formAttr === formId) || !formAttr
						&& $innerFormControls.index($this) !== -1;
			});
		},

		/**
		 * onErrorに渡すメッセージの作成
		 *
		 * @param result
		 * @param name
		 * @returns
		 */
		_createOnErrorMessage: function(result, name) {
			var reason = result.failureReason[name];
			var config = this._config.output[name];
			var label = (config && config.label) || name;
			if (!this.invalidMessageView.isAvailable(reason.rule)) {
				return '';
			}
			var msg = this.invalidMessageView.get(reason.rule, {
				value: reason.value,
				label: label,
				param: reason.param
			});

			return msg;
		}
	};
	h5.core.expose(controller);
})();