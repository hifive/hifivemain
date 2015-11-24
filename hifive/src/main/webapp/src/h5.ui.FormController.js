(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================
	/**
	 * EJSにスクリプトレットの区切りとして認識させる文字
	 */
	var DELIMITER = '[';

	// =============================
	// Development Only
	// =============================
	var fwLogger = h5.log.createLogger('h5.ui.FormController');

	/** デフォルトのルールにないルールでのバリデートエラーの場合に出すメッセージ */
	var MSG_DEFAULT_INVALIDATE = '{0}:{1}はルール{2}を満たしません';

	/* del begin */
	// ログメッセージ
	var FW_LOG_ERROR_CREATE_VALIDATE_MESSAGE = 'バリデートエラーメッセージの生成に失敗しました。message:{0}';
	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	/**
	 * デフォルトエラーメッセージビュー
	 */
	var defaultIntvalidMessageView = (function() {
		var msgs = {
			require: '[%=label%]は必須項目です',
			min: '[%= label %]は[%=param.min%][%=param.inclusive?"以上の":"より大きい"%]数値を入力してください。',
			max: '[%=label%]は[%=param.max%][%=param.inclusive?"以下":"未満"%]の数値を入力してください。',
			pattern: '[%=label%]は正規表現[%=param.regexp%]を満たす文字列を入力してください。',
			digits: '[%=label%]は整数部分[%=param.integer%]桁、小数部分[%=fruction%]桁以下の数値を入力してください。',
			size: '[%=label%]は[%=param.min%]以上[%=param.max%]以下の長さでなければいけません。',
			future: '[%=label%]は現在時刻より未来の時刻を入力してください。',
			past: '[%=label%]は現在時刻より過去の時刻を入力してください。',
			nul: '[%=label%]はnullでなければなりません。',
			notNull: '[%=label%]はnullでない値を設定してください。',
			assertFalse: '[%=label%]はfalseとなる値を入力してください。',
			assertTrue: '[%=label%]はtrueとなる値を入力してください。',
			customFunc: '[%=label%]は条件を満たしません'
		};
		var view = h5.core.view.createView();
		for ( var p in msgs) {
			view.register(p, msgs[p]);
		}
		return view;
	})();

	// =============================
	// Functions
	// =============================
	/**
	 * メッセージ生成関数
	 *
	 * @memberOf h5internal.validation
	 * @private
	 * @param {Object} reason
	 * @param {string} name
	 * @param {object} setting
	 * @returns {string} メッセージ
	 */
	function createValidateErrorMessage(name, reason, setting) {
		var label = (setting && setting.label) || name;
		var msg = setting && setting.message;
		var formatter = setting && setting.formatter;
		var param = {
			value: reason.value,
			param: reason.param,
			rule: reason.rule,
			name: name,
			label: label
		};
		if (isString(msg)) {
			// messageが指定されていればテンプレート文字列として扱ってメッセージを作成する
			try {
				var compiledTemplate = new EJS.Compiler(msg, DELIMITER);
				compiledTemplate.compile();
				msg = compiledTemplate.process.call(param, param, new EJS.Helpers(param));
			} catch (e) {
				// パラメータ置換時にエラーがおきた場合
				fwLogger.error(FW_LOG_ERROR_CREATE_VALIDATE_MESSAGE, msg);
				return msg;
			}
			return msg;
		} else if (isFunction(formatter)) {
			// formatterが設定されている場合はパラメータを渡して関数呼び出しして生成
			return formatter(param);
		}

		// 何も設定されていない場合はデフォルトメッセージ
		if (defaultIntvalidMessageView.isAvailable(reason.rule)) {
			return defaultIntvalidMessageView.get(reason.rule, param);
		}
		// デフォルトにないルールの場合
		return h5.u.str.format(MSG_DEFAULT_INVALIDATE, name, reason.value, reason.rule);
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	// =============================
	// Expose to window
	// =============================
	h5internal.validation = {
		createValidateErrorMessage: createValidateErrorMessage
	};
})();

(function() {
	function defaultReplaceElement(element) {
		return element;
	}

	var STATE_ERROR = 'error';
	var STATE_SUCCESS = 'success';
	var STATE_VALIDATING = 'validating';

	/**
	 * validateエラー箇所の要素にクラスを追加するためのFormControllerプラグイン
	 *
	 * @class
	 * @name h5.ui.validation.ErrorClassController
	 */
	var controller = {
		__name: 'h5.ui.validation.ErrorClass',
		onValidate: function(result, globalSetting, outputSetting) {

			var callSetErrorClass = this.own(function(name) {
				var element = this.parentController.getElementByName(name);
				if (!element) {
					return;
				}
				this._setErrorClass(element, name, globalSetting, outputSetting[name], result);
			});

			// validだったものにクラスを適用
			var allProperties = result.allProperties;
			for (var i = 0, l = allProperties.length; i < l; i++) {
				callSetErrorClass(allProperties[i]);
			}

			if (!result.isAsync) {
				return;
			}
			// 非同期validateの場合、結果が返ってきてからクラスの適用
			result.addEventListener('validate', this.own(function(ev) {
				callSetErrorClass(ev.property);
			}));
		},
		onFocus: function(element, name, globalSetting, setting, validationResult) {
			this._setErrorClass(element, name, globalSetting, setting, validationResult);
		},
		onBlur: function(element, name, globalSetting, setting, validationResult) {
			this._setErrorClass(element, name, globalSetting, setting, validationResult);
		},
		onChange: function(element, name, globalSetting, setting, validationResult) {
			this._setErrorClass(element, name, globalSetting, setting, validationResult);
		},
		onKeyup: function(element, name, globalSetting, setting, validationResult) {
			this._setErrorClass(element, name, globalSetting, setting, validationResult);
		},
		onClick: function(element, name, globalSetting, setting, validationResult) {
			this._setErrorClass(element, name, globalSetting, setting, validationResult);
		},
		reset: function(globalSetting, outputSetting) {
			var $formControls = this.parentController.getElements();
			// 全てのフォームコントロール部品からすべてのクラスを削除
			var pluginSetting = $.extend({}, globalSetting, outputSetting
					&& outputSetting.errorClass);
			this._setValidateState(null, $formControls, pluginSetting);
		},
		_setErrorClass: function(element, name, globalSetting, setting, validationResult) {
			var pluginSetting = $.extend({}, globalSetting, setting && setting.errorClass);
			if ($.inArray(name, validationResult.validatingProperties) !== -1) {
				// まだvalidate結果が返ってきていない場合
				this._setValidateState(STATE_VALIDATING, element, pluginSetting);
				validationResult.addEventListener('validate', this.own(function(ev) {
					if (ev.property === name) {
						this
								._setErrorClass(element, name, globalSetting, setting,
										validationResult);
					}
				}));
				return;
			}
			var failureReason = validationResult.failureReason
					&& validationResult.failureReason[name];
			if (failureReason) {
				this._setValidateState(STATE_ERROR, element, pluginSetting);
			} else {
				this._setValidateState(STATE_SUCCESS, element, pluginSetting);
			}
		},

		_setValidateState: function(state, element, pluginSetting) {
			var replaceElement = pluginSetting.replaceElement;
			var target = isFunction(replaceElement) ? replaceElement(element)
					: (replaceElement || element);
			if (!target) {
				return;
			}
			var errorClassName = pluginSetting.errorClassName;
			var successClassName = pluginSetting.successClassName;
			var validatingClassName = pluginSetting.validatingClassName;
			$(target).removeClass(errorClassName).removeClass(successClassName).removeClass(
					validatingClassName);
			if (!state) {
				return;
			}
			$(target).addClass(pluginSetting[state + 'ClassName']);
		}
	};
	h5.core.expose(controller);
})();


(function() {
	/**
	 * validate時にエラーがあった時、エラーメッセージを表示するプラグイン
	 *
	 * @class
	 * @name h5.ui.validation.AllMessage
	 */
	var controller = {
		__name: 'h5.ui.validation.AllMessage',
		onValidate: function(result, globalSetting, outputSetting) {
			var container = globalSetting && globalSetting.container;
			if (!container) {
				return;
			}
			$(container).empty();
			var tagName = globalSetting.wrapper || 'p'; // デフォルトはpタグ
			var invalidProperties = result.invalidProperties;
			for (var i = 0, l = invalidProperties.length; i < l; i++) {
				var name = invalidProperties[i];
				var failureReason = result.failureReason[name];
				this._appendMessage(name, failureReason, outputSetting[name], container, tagName);
			}
			if (result.isAllValid === null) {
				// 非同期でまだ結果が返ってきていないものがある場合
				result.addEventListener('validate', this.own(function(ev) {
					if (!ev.isValid) {
						this._appendMessage(ev.property, ev.failureReason,
								outputSetting[ev.property], container, tagName);
					}
				}));
				return;
			}
		},
		reset: function(globalSetting, outputSetting) {
			var container = globalSetting && globalSetting.container;
			$(container).empty();
		},
		_appendMessage: function(name, failureReason, setting, container, tagName) {
			var msg = h5internal.validation
					.createValidateErrorMessage(name, failureReason, setting);
			var msgElement = document.createElement(tagName);
			$(msgElement).html(msg);
			$(container).append(msgElement);
		}
	};
	h5.core.expose(controller);
})();

(function() {
	var DEFAULT_PLACEMENT = 'top';
	/**
	 * validate時にエラーがあった時、エラーバルーンを表示するプラグイン
	 *
	 * @class
	 * @name h5.ui.validation.ErrorBaloon
	 */
	var controller = {
		__name: 'h5.ui.validation.ErrorBaloon',
		_executedOnValidate: false,
		onValidate: function(result, globalSetting, outputSetting) {
			this._executedOnValidate = true;
		},
		onFocus: function(element, name, globalSetting, setting, validationResult) {
			this._setErrorBaloon(element, name, globalSetting, setting, validationResult, 'focus');
		},
		onBlur: function(element, globalSetting, setting, validationResult) {
			this._setErrorBaloon(element, name, globalSetting, setting, validationResult, 'blur');
		},
		//		onChange: function(element,name, globalSetting, setting, errorReason) {
		//			this._setErrorBaloon(element, globalSetting, setting, errorReason);
		//		},
		//		onKeyup: function(element, name, globalSetting, setting, validationResult, errorReason) {
		//			this._setErrorBaloon(element, globalSetting, setting, errorReason);
		//		},
		//		onClick: function(element,name, globalSetting, setting, errorReason) {
		//			this._setErrorBaloon(element, globalSetting, setting, errorReason);
		//		},

		reset: function() {
			// 常にバルーンは一つのみ表示している実装のため、その1つのバルーンを非表示
			$(this._currentBaloonTarget).tooltip('hide');
			this._executedOnValidate = false;
		},

		_setErrorBaloon: function(element, name, globalSetting, setting, validationResult, type) {
			if (!this._executedOnValidate) {
				// onValidateが１度も呼ばれていなければ何もしない
				return;
			}
			var pluginSetting = $.extend({}, globalSetting, setting && setting.baloon);
			if (setting && setting.baloon && setting.baloon.off) {
				return;
			}

			var replaceElement = pluginSetting.replaceElement;
			var target = isFunction(replaceElement) ? replaceElement(element)
					: (replaceElement || element);
			if (!target) {
				return;
			}

			if (type === 'blur') {
				$(target).tooltip('hide');
				this._currentBaloonTarget = null;
				return;
			}
			var failureReason = validationResult.failureReason
					&& validationResult.failureReason[name];
			if (!failureReason) {
				// validateエラーがないときはhideして終了
				$(target).tooltip('hide');
				this._currentBaloonTarget = null;
				return;
			}

			// validateエラーがあるとき
			var msg = h5internal.validation
					.createValidateErrorMessage(name, failureReason, setting);
			var placement = DEFAULT_PLACEMENT;
			if (setting && setting.baloon && setting.baloon.placement) {
				placement = setting.baloon.placement;
			} else if (globalSetting && globalSetting.placement) {
				placement = globalSetting.placement;
			}
			$(target).attr({
				'data-placement': placement,
				'data-original-title': msg,
				// FIXME animationをtrueにすると、show/hide/showを同期で繰り返した時に表示されない
				// (shown.bs.tooltipイベントとか拾って制御する必要あり)
				// 一旦animationをoffにしている
				'data-animation': false
			}).tooltip({
				trigger: 'manual'
			});
			if (type === 'focus') {
				$(target).tooltip('show');
				this._currentBaloonTarget = target;
				return;
			}
		}
	};
	h5.core.expose(controller);
})();

(function() {
	/**
	 * validate時にエラーがあった時、エラーメッセージを表示するプラグイン
	 *
	 * @class
	 * @name h5.ui.validation.ErrorMessage
	 */
	var controller = {
		__name: 'h5.ui.validation.ErrorMessage',
		_executedOnValidate: false,
		_errorMessageElementMap: {},
		onValidate: function(result, globalSetting, outputSetting) {
			this._executedOnValidate = true;
			this._errorMessageElementMap[name] && this._errorMessageElementMap[name].remove();
			var $formControls = this.parentController.getElements();
			// validだったものからメッセージを削除
			var allProperties = result.allProperties;
			for (var i = 0, l = allProperties.length; i < l; i++) {
				var name = allProperties[i];
				var element = $formControls.filter('[name="' + name + '"]')[0];
				this._setErrorMessage(element, name, globalSetting, outputSetting[name], result);
			}
		},
		onFocus: function(element, name, globalSetting, setting, validationResult) {
			this._setErrorMessage(element, name, globalSetting, setting, validationResult, 'focus');
		},
		onBlur: function(element, name, globalSetting, setting, validationResult) {
			this._setErrorMessage(element, name, globalSetting, setting, validationResult, 'blur');
		},
		// FIXME どのタイミングで実行するかは設定で決める？
		//		onChange: function(element,name, globalSetting, setting, errorReason) {
		//			this._setErrorMessage(element,name, globalSetting, setting, errorReason);
		//		},
		//		onKeyup: function(element,name, globalSetting, setting, errorReason) {
		//			this._setErrorMessage(element,name, globalSetting, setting, errorReason);
		//		},
		//		onClick: function(element, name,globalSetting, setting, errorReason) {
		//			this._setErrorMessage(element, name,globalSetting, setting, errorReason);
		//		},

		reset: function() {
			for ( var p in this._errorMessageElementMap) {
				var $target = this._errorMessageElementMap[name];
				$target && $target.remove();
			}
			this._executedOnValidate = false;
		},

		_setErrorMessage: function(element, name, globalSetting, setting, validationResult, type) {
			if (!this._executedOnValidate) {
				// onValidateが１度も呼ばれていなければ何もしない
				return;
			}
			var pluginSetting = $.extend({}, globalSetting, setting && setting.errorMessage);
			if (setting && setting.errorMessage && setting.errorMessage.off) {
				return;
			}
			if (type === 'blur') {
				// blurの時はメッセージを非表示にして、終了
				this._errorMessageElementMap[name] && this._errorMessageElementMap[name].remove();
				return;
			}
			if ($.inArray(name, validationResult.validatingProperties) !== -1) {
				// まだvalidate結果が返ってきていない場合
				// メッセージを削除
				this._errorMessageElementMap[name] && this._errorMessageElementMap[name].remove();
				validationResult.addEventListener('validate', this.own(function(ev) {
					console.log(document.activeElement);
					if (ev.property === name
							&& (type !== 'focus' || document.activeElement === element)) {
						// nameの結果が返ってきた時にメッセージを表示
						// focus時のvalidateなら、まだfocusが当たっているときだけ表示
						this._setErrorMessage(element, name, globalSetting, setting,
								validationResult, type);
					}
				}));
				return;
			}
			var errorPlacement = pluginSetting.errorPlacement;
			var replaceElement = pluginSetting.replaceElement;
			var target = isFunction(replaceElement) ? replaceElement(element)
					: (replaceElement || element);
			if (!target) {
				return;
			}

			var failureReason = validationResult.failureReason
					&& validationResult.failureReason[name];
			if (!failureReason) {
				this._errorMessageElementMap[name] && this._errorMessageElementMap[name].remove();
				return;
			}
			var msg = h5internal.validation
					.createValidateErrorMessage(name, failureReason, setting);
			var $errorMsg = this._errorMessageElementMap[name];
			if (!$errorMsg) {
				// TODO タグやクラスを設定できるようにする
				$errorMsg = $('<span class="errorMessage">');
				this._errorMessageElementMap[name] = $errorMsg;
			}
			$errorMsg.html(msg);
			if (errorPlacement) {
				errorPlacement($errorMsg[0], target);
			} else {
				// elementの後ろに追加するのがデフォルト動作
				// replaceElementで対象が変更されていればその後ろ
				$(target).after($errorMsg);
			}
		}
	};
	h5.core.expose(controller);
})();

(function() {
	// ログメッセージ
	var FW_LOG_NOT_DEFINED_PLUGIN_NAME = 'プラグイン"{0}"は存在しません';
	var FW_LOG_ALREADY_ADDED = 'プラグイン"{0}"は登録済みです。';

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

	// フォームコントロールグループコンテナの名前指定
	var DATA_INPUTGROUP_CONTAINER = 'inputgroup-container';
	var DATA_INPUTGROUP = 'inputgroup';

	// プラグインに通知するイベント
	var PLUGIN_EVENT_VALIDATE = 'onValidate';
	var PLUGIN_EVENT_FOCUS = 'onFocus';
	var PLUGIN_EVENT_BLUR = 'onBlur';
	var PLUGIN_EVENT_CHANGE = 'onChange';
	var PLUGIN_EVENT_KEYUP = 'onKeyup';
	var PLUGIN_EVENT_CLICK = 'onClick';

	// デフォルトで用意しているプラグイン名とプラグイン(コントローラ定義)のマップ
	var DEFAULT_PLUGINS = {
		errorClass: h5.ui.validation.ErrorClass,
		allMessage: h5.ui.validation.AllMessage,
		baloon: h5.ui.validation.ErrorBaloon,
		errorMessage: h5.ui.validation.ErrorMessage
	};

	// プラグインの表示リセットメソッド名
	var PLUGIN_METHOD_RESET = 'reset';

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

	var controller = {
		__name: 'h5.ui.FormController',
		_config: {},
		_bindedForm: null,
		_validator: null,
		_ruleCreators: [],
		_plugins: [],

		/**
		 * nameをキーにvalidationResultを持つマップ
		 *
		 * @memberOf h5.ui.FormController
		 * @private
		 */
		_validationResultMap: {},

		/**
		 * 全体のvalidateを行ったときのvalidationResult
		 *
		 * @memberOf h5.ui.FormController
		 * @private
		 */
		_allValidationResult: null,

		/**
		 * プラグイン設定
		 *
		 * @memberOf h5.ui.FormController
		 */
		globalSetting: {
			errorClass: {
				className: 'has-error',
				replaceElement: null
			},
			allMessage: {
				container: '.globalError',
				wrapper: 'li'
			}
		},

		/**
		 * 出力設定
		 *
		 * @memberOf h5.ui.FormController
		 */
		outputSetting: {},

		/**
		 * @memberOf h5.ui.FormController
		 */
		defaultRuleCreators: defaultRuleCreators,

		/**
		 * @memberOf h5.ui.FormController
		 */
		__construct: function() {
			this._validator = h5.validation.createValidator('form');
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
		},

		/**
		 * @memberOf h5.ui.FormController
		 */
		__init: function() {
			// form要素にバインドされていればそのformに属しているform関連要素を見る
			// すなわち、ルートエレメント以下にあるinputでもform属性で別IDが指定されていたらそのinputは対象外
			// また、ルートエレメント外にあるinputでも、form属性がルートエレメントのformを指定していれば対象とする
			if (this.rootElement.tagName.toUpperCase() === 'FORM') {
				this._bindedForm = this.rootElement;
				// HTML5のformによる標準のバリデーションは行わないようにする
				$(this._bindedForm).prop('novalidate', true);
			}
			// フォーム部品からルールを生成
			var $formControls = this.getElements();
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
			this.addRule(validateRule);

			// submitイベントを拾ってvalidateが行われるようにする
			if (this._bindedForm) {
				this.on(this._bindedForm, 'submit', this._submitHandler);
			}
		},

		enablePlugins: function(pluginNames) {
			// デフォルトの出力プラグイン追加
			// __init前(rootElement決定前)ならルートエレメント決定後に実行
			if (!this.isInit) {
				this.initPromise.done(this.own(function() {
					this.enablePlugins(pluginNames);
				}));
				return;
			}
			pluginNames = $.isArray(pluginNames) ? pluginNames : [pluginNames];
			for (var i = 0, l = pluginNames.length; i < l; i++) {
				var pluginName = pluginNames[i];
				var plugin = DEFAULT_PLUGINS[pluginName];
				if (!plugin) {
					this.log.warn(FW_LOG_NOT_DEFINED_PLUGIN_NAME, pluginName);
					continue;
				}
				this._addOutputPlugin(pluginName, plugin);
			}

		},

		/**
		 * ルールの追加
		 *
		 * @param {Object} ruleObj
		 * @param {boolean} [shouldValidate=false] ルール追加した後にvalidateを行うかどうか
		 * @param {boolean} [onlyAddedRule=true]
		 *            shouldValidate=trueの場合に、追加されたルールのプロパティのみvalidateを行う場合はtrue
		 */
		addRule: function(ruleObj, shouldValidate, onlyAddedRule) {
			this._validator.addRule(ruleObj);
			if (shouldValidate) {
				var names = null;
				if (onlyAddedRule) {
					names = [];
					for ( var p in ruleObj) {
						names.push(p);
					}
				}
				this._validate(names);
			}
		},

		/**
		 * ルールの削除
		 *
		 * @param {string|string[]} names プロパティ名またはその配列
		 * @param {boolean} shouldValidate ルール削除した後にvalidateを行うかどうか
		 * @param {boolean} [onlyRemovedRule=true]
		 *            shouldValidate=trueの場合に、追加されたルールのプロパティのみvalidateを行う場合はtrue
		 */
		removeRule: function(names, shouldValidate, onlyRemovedRule) {
			this._validator.removeRule();
			if (shouldValidate) {
				this.validate(onlyRemovedRule ? names : null);
			}
		},

		/**
		 * このコントローラが管理するフォーム内のフォーム部品の値を集約したオブジェクトを生成する
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string||string[]} targetNames 指定した場合、指定したnameのものだけを集約
		 * @returns {Object}
		 */
		gather: function(targetNames) {
			targetNames = targetNames && (!isArray(targetNames) ? [targetNames] : targetNames);
			var $elements = this.getElements();
			var $groups = this.getInputGroupElements();
			var ret = {};
			$elements.each(function() {
				var name = this.name;
				var currentGroup = ret;
				// タグに指定されているグループ名をグループコンテナより優先
				var groupName = $(this).data(DATA_INPUTGROUP);
				if (!groupName && $groups.find(this).length) {
					// タグにグループの指定が無くグループコンテナに属している場合
					var $group = $(this).closest('[data-' + DATA_INPUTGROUP_CONTAINER + ']');
					var groupName = $group.data(DATA_INPUTGROUP_CONTAINER);
				}
				if (groupName) {
					// グループコンテナに属するエレメントの場合
					if (targetNames && $.inArray(name, targetNames) === -1
							&& $.inArray(groupName, targetNames) === -1) {
						// nameもgroupNameもtargetNamesに入っていなければ集約対象外
						return;
					}
					// グループ単位でオブジェクトを作る
					ret[groupName] = ret[groupName] || {};
					currentGroup = ret[groupName];
				} else if (targetNames && $.inArray(name, targetNames) === -1) {
					// グループに属さないエレメントの場合
					// targetNamesに含まれないnameのエレメントは集約対象外
					return;
				}
				if (this.type === 'file') {
					// ファイルオブジェクトを覚えておく
					var files = this.files;
					var filesLength = files.length;
					if (!filesLength) {
						return;
					}
					currentGroup[name] = currentGroup[name] || [];
					for (var i = 0; i < filesLength; i++) {
						currentGroup[name].push(files[i]);
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
				if (currentGroup[name] !== undefined) {
					if (!$.isArray(ret[name])) {
						currentGroup[name] = [currentGroup[name]];
					}
					if ($.isArray(value)) {
						// select multipleの場合は値は配列
						Array.prototype.push.apply(currentGroup[name], value);
					} else {
						currentGroup[name].push(value);
					}
				} else {
					currentGroup[name] = value;
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
			var $elements = this.getElements();
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
			this.getElements().each(function() {
				if (this.type === 'radio' || this.type === 'checkbox') {
					$(this).prop('checked', false);
					return;
				}
				$(this).val(null);
			});
		},

		/**
		 * validation結果表示をすべてリセットする
		 *
		 * @memberOf h5.ui.FormController
		 */
		resetValidation: function() {
			this._allValidationResult && this._allValidationResult.abort();
			for ( var p in this._validationResultMap) {
				this._validationResultMap[p].abort();
			}
			for ( var p in this._validationResultMap) {
				delete this._validationResultMap[p];
			}

			var plugins = this._plugins;
			var globalSetting = this.globalSetting;
			for ( var pluginName in plugins) {
				var plugin = plugins[pluginName];
				if (plugin[PLUGIN_METHOD_RESET]) {
					plugin[PLUGIN_METHOD_RESET].call(plugin, globalSetting[pluginName],
							this.outputSetting);
				}
			}
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

		validate: function(names) {
			var result = this._validate(names);
			// onValidateの呼び出し
			this._callPluginValidateEvent(PLUGIN_EVENT_VALIDATE, result);
			return result;
		},

		/**
		 * このコントローラが管理するフォームに属するフォーム部品を取得
		 *
		 * @memberOf h5.ui.FormController
		 * @returns {jQuery}
		 */
		getElements: function() {
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
		 * このコントローラが管理するformに属するフォーム部品グループ要素を取得
		 *
		 * @returns {jQuery}
		 */
		getInputGroupElements: function() {
			var $allGroups = $('[data-' + DATA_INPUTGROUP_CONTAINER + ']');
			return this.$find('[data-' + DATA_INPUTGROUP_CONTAINER + ']').filter(
					function() {
						var $this = $(this);
						var formAttr = $this.attr('form');
						// form属性がこのコントローラのフォームを指している
						// または、このコントローラのフォーム内の要素でかつform属性指定無し
						return (formAttr && formAttr === formId) || !formAttr
								&& $allGroups.index($this) !== -1;
					});
		},

		/**
		 * このコントローラが管理するformに属するフォーム部品またはフォーム部品グループ要素の中で指定した名前に一致する要素を取得
		 *
		 * @param {string} name
		 * @returns {DOM}
		 */
		getElementByName: function(name) {
			// このメソッドはプラグインがvalidate結果から対応するエレメントを探す時に呼び出される
			var $formCtrls = this.getElements();
			var element = $formCtrls.filter('[name="' + name + '"]')[0];
			if (element) {
				return element;
			}
			var groupContainer = this.getInputGroupElements().filter(
					'[data-' + DATA_INPUTGROUP_CONTAINER + '="' + name + '"]')[0];
			if (groupContainer) {
				return groupContainer;
			}

			var $groupElements = $formCtrls.filter(function() {
				var $this = $(this);
				return $this.data(DATA_INPUTGROUP) === name;
			});
			// FIXME 複数ある場合は代表の一つを返しているが、どうするか
			// jQueryオブジェクトを受け取るようにしてjQueryオブジェクトで対応するべき？
			// ex.name='zipCode'で、
			// <input name="zip1" data-inputgroup="zipCode"/>
			// <input name="zip2" data-inputgroup="zipCode"/>
			// の2つがある場合は1つ目を返している。
			return $groupElements[0];
		},

		'{rootElement} focusin': function(ctx) {
			this._pluginElementEventHandler(ctx, PLUGIN_EVENT_FOCUS);
		},

		'{rootElement} focusout': function(ctx) {
			this._pluginElementEventHandler(ctx, PLUGIN_EVENT_BLUR);
		},

		'{rootElement} keyup': function(ctx) {
			this._pluginElementEventHandler(ctx, PLUGIN_EVENT_KEYUP);
		},

		'{rootElement} change': function(ctx) {
			this._pluginElementEventHandler(ctx, PLUGIN_EVENT_CHANGE);
		},

		'{rootElement} click': function(ctx) {
			this._pluginElementEventHandler(ctx, PLUGIN_EVENT_CLICK);
		},

		/**
		 * プラグインの追加(1.2.0では非公開)
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 * @param pluginName
		 * @param controller
		 */
		_addOutputPlugin: function(pluginName, controller) {
			if (this._plugins[pluginName]) {
				this.log.warn(FW_LOG_ALREADY_ADDED, pluginName);
				return;
			}
			var c = h5.core.controller(this._bindedForm || this.rootElement, controller);
			this.manageChild(c);
			this._plugins[pluginName] = c;
		},

		_validate: function(names) {
			var formData = this.gather(names);
			var ret = this._validator.validate(formData, names);

			// TODO 動作確認としてログ出力
			this.log.debug('-----------------------------------------');
			this.log.debug('・validateするデータ');
			this.log.debug(formData);
			this.log.debug('・validate対象のプロパティ:' + names);
			this.log.debug('・validate結果');
			this.log.debug(ret);
			this.log.debug(ret.isAsync ? '非同期' : '同期');
			this.log.debug('-----------------------------------------');
			return ret;
		},

		_createPluginElementEventArgs: function(element, validationResult) {
			var name = element.name;
		},

		_pluginElementEventHandler: function(ctx, type) {
			var target = ctx.event.target;
			if (!this._isFormControls(target)) {
				return;
			}
			var name = target.name;
			if (!name) {
				// name無しの要素は対象外
				return;
			}
			// グループに属していればそのグループに対してvalidate
			var groupName = $(target).data(DATA_INPUTGROUP);
			if (!groupName) {
				// タグにグループの指定が無くグループコンテナに属している場合
				var $groups = this.getInputGroupElements();
				if ($groups.find(target).length) {
					var $group = $(target).closest('[data-' + DATA_INPUTGROUP_CONTAINER + ']');
					groupName = $group.data(DATA_INPUTGROUP_CONTAINER);
				}
			}

			var validateTargetName = groupName || name;
			var validateTargetElement = groupName ? this.getElementByName(groupName) : target;

			var validationResult = this._validate(validateTargetName);

			var preValidationResult = this._validationResultMap[validateTargetName];
			if (preValidationResult) {
				preValidationResult.abort();
				delete this._validationResultMap[validateTargetName];
			}
			if (validationResult.isAsync) {
				this._validationResultMap[validateTargetName] = validationResult;
				validationResult.addEventListener('validateComplete', this.own(function() {
					delete this._validationResultMap[validateTargetName];
				}));
			}

			this._callPluginElementEvent(type, validateTargetElement, validateTargetName,
					validationResult);
		},

		/**
		 * プラグインのvalidateイベントの呼び出し
		 *
		 * @memberOf h5.ui.FormController
		 * @private
		 */
		_callPluginValidateEvent: function(type, result) {
			var plugins = this._plugins;
			var globalSetting = this.globalSetting;
			for ( var p in this._validationResultMap) {
				this._validationResultMap[p].abort();
			}
			this._validationResultMap = {};
			if (this._allValidationResult) {
				this._allValidationResult.abort();
				this._allValidationResult = null;
			}
			if (result.isAsync) {
				this._allValidationResult = result;
				result.addEventListener('validateComplete', this.own(function() {
					this._allValidationResult = null;
				}));
			}
			for ( var pluginName in plugins) {
				var plugin = plugins[pluginName];
				if (plugin[type]) {
					plugin[type]
							.call(plugin, result, globalSetting[pluginName], this.outputSetting);
				}
			}
		},

		/**
		 * プラグインのフォームコントロール要素についてのイベント呼び出し
		 *
		 * @memberOf h5.ui.FormController
		 * @private
		 */
		_callPluginElementEvent: function(type, element, name, validationResult) {
			var plugins = this._plugins;
			var globalSetting = this.globalSetting;
			var outputSetting = this.outputSetting;
			for ( var pluginName in plugins) {
				var plugin = plugins[pluginName];
				if (plugin[type]) {
					plugin[type](element, name, globalSetting[pluginName], outputSetting[name],
							validationResult);
				}
			}
		},

		_submitHandler: function(ctx, $el) {
			ctx.event.preventDefault();
			var validationResult = this.validate();
			if (validationResult.isAsync) {
				validationResult.addEventListener('validateComplete', function() {
					if (this.isAllValid) {
						// 送信
						$el[0].submit();
					}
				});
				return;
			}
			if (validationResult.isAllValid) {
				// 送信
				$el[0].submit();
			}
		},

		_isFormControls: function(element) {
			var $formControls = this.getElements();
			return $formControls.index(element) !== -1;
		}
	};
	h5.core.expose(controller);
})();