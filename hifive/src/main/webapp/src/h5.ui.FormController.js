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
 */
/* h5.ui.FormController */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

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
	var formatStr = h5.u.str.format;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	/**
	 * デフォルトエラーメッセージ
	 */
	var defaultInvalidMessage = {
		required: '{displayName}は必須項目です。',
		min: function(param) {
			return formatStr('{displayName}は{targetViolation.ruleValue.min}{1}数値を入力してください。', param,
					(param.targetViolation.ruleValue.inclusive ? "以上の" : "より大きい"));
		},
		max: function(param) {
			return formatStr('{displayName}は{targetViolation.ruleValue.max}{1}数値を入力してください。', param,
					(param.targetViolation.ruleValue.inclusive ? "以下の" : "未満の"));
		},
		pattern: '{displayName}は正規表現{targetViolation.ruleValue.regexp}を満たす文字列を入力してください。',
		digits: '{displayName}は整数部分{targetViolation.ruleValue.integer}桁、小数部分{targetViolation.ruleValue.fraction}桁以下の数値を入力してください。',
		size: function(param) {
			var upperLimitMsg = '';
			var lowerLimitMsg = '';
			var min = param.targetViolation.ruleValue.min;
			var max = param.targetViolation.ruleValue.max;
			if (min != null) {
				lowerLimitMsg = formatStr('{0}以上', min);
			}
			if (max != null) {
				upperLimitMsg = formatStr('{0}以下', max);
			}
			return formatStr('{displayName}は{1}{2}の長さでなければいけません。', param, lowerLimitMsg,
					upperLimitMsg);
		},
		future: '{displayName}は現在時刻より未来の時刻を入力してください。',
		past: '{displayName}は現在時刻より過去の時刻を入力してください。',
		assertNull: '{displayName}はnullでなければなりません。',
		assertNotNull: '{displayName}はnullでない値を設定してください。',
		assertFalse: '{displayName}はfalseとなる値を入力してください。',
		assertTrue: '{displayName}はtrueとなる値を入力してください。',
		customFunc: '{displayName}は条件を満たしません。'
	};

	// =============================
	// Functions
	// =============================
	/**
	 * メッセージ生成関数
	 *
	 * @memberOf h5internal.validation
	 * @private
	 * @param {string} name
	 * @param {Object} reason
	 * @param {Object} setting
	 * @param {Array} rules
	 * @returns {string} メッセージ
	 */
	function createValidateErrorMessage(name, reason, setting, violationIndex, defaultMessageMap,
			rules, outputPluginDefaultMessage, outputPluginDefaultDisplayName) {
		var displayName = (setting && setting.displayName) || outputPluginDefaultDisplayName
				|| name;
		var msg = setting && setting.message;

		if (msg == null && outputPluginDefaultMessage != null) {
			//プロパティごとのメッセージが未定義の場合、
			//出力プラグイン共通のメッセージがセットされていればそれを使用する
			msg = outputPluginDefaultMessage;
		}

		// 違反のインデックスが指定されていない場合は一番最初の違反から作成する
		if (violationIndex == null) {
			violationIndex = 0;
		}

		var param = $.extend({}, reason, {
			displayName: displayName,
			rules: rules
		});
		param.targetViolation = reason.violation[violationIndex];

		if (isString(msg)) {
			// messageが指定されていればh5.u.str.formatでメッセージを作成
			return h5.u.str.format(msg, param);
		} else if (isFunction(msg)) {
			return msg(param);
		}

		var ruleName = reason.violation[violationIndex].ruleName;

		//バリデータでデフォルトメッセージをオーバーライドしている場合はそちらを優先する
		var defaultMsg = defaultMessageMap[ruleName];
		if (defaultMsg == null) {
			//オーバーライドされていない場合はルールのデフォルトメッセージを使用
			defaultMsg = defaultInvalidMessage[ruleName];
		}

		if (defaultMsg != null) {
			if (isFunction(defaultMsg)) {
				return defaultMsg(param);
			}
			return h5.u.str.format(defaultMsg, param);
		}

		// デフォルトにないルールの場合
		return h5.u.str.format(MSG_DEFAULT_INVALIDATE, name, reason.value, ruleName);
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	// =============================
	// Expose to window
	// =============================
	if (!h5internal.validation) {
		h5internal.validation = {};
	}
	h5internal.validation.createValidateErrorMessage = createValidateErrorMessage;

	/**
	 * メッセージ及びvalidate結果から作成したメッセージを出力するコントローラ
	 *
	 * @class
	 * @name h5.ui.validation.MessageOutputController
	 */
	var controller = {
		__name: 'h5.ui.validation.MessageOutputController',
		_container: null,
		_wrapper: null,
		// validationResultからメッセージを作るための設定
		_setting: {},

		_validatorDefaultMessageMap: {},

		_outputPluginDefaultMessage: null,

		_outputPluginDefaultDisplayName: null,

		/**
		 * @private
		 * @param message
		 */
		_setOutputDefaultMessage: function(message) {
			this._outputPluginDefaultMessage = message;
		},

		_setOutputDefaultDisplayName: function(displayName) {
			this._outputPluginDefaultDisplayName = displayName;
		},

		/**
		 * @private
		 * @param validatorName
		 * @param message
		 */
		_setDefaultMessage: function(validatorName, message) {
			this._validatorDefaultMessageMap[validatorName] = message;
		},

		/**
		 * メッセージ出力先要素をコンテナとして設定する
		 *
		 * @memberOf h5.ui.validation.MessageOutputController
		 * @param {DOM|jQuery|string} container デフォルト出力先(コンテナ)要素をDOM要素、jQueryオブジェクト、セレクタ文字列の何れかで指定
		 */
		setContainer: function(container) {
			this._container = container;
		},

		/**
		 * メッセージ出力時にメッセージをラップする要素の設定
		 * <p>
		 * タグまたはタグ生成文字列をラッパーとして設定します。
		 * </p>
		 * <p>
		 * タグ名を指定した場合、指定されたタグで生成した要素でメッセージをラップします。
		 * </p>
		 * <p>
		 * '&lt;span class=&quot;hoge&quot;&gt;'のようなタグ生成文字列も設定でき、指定された文字列から作成した要素でメッセージをラップします。
		 * </p>
		 * <p>
		 * ラッパーの指定がない場合は、このコントローラはメッセージをテキストノードとして出力します。
		 * </p>
		 *
		 * @memberOf h5.ui.validation.MessageOutputController
		 * @param {string} wrapper メッセージをラップするタグまたはタグ生成文字列
		 */
		setWrapper: function(wrapper) {
			this._wrapper = wrapper;
		},

		/**
		 * メッセージ出力先の設定を適用する
		 * <p>
		 * メッセージを{@link ValidationResult}から出力する([appendMessageByValidationResult]{@link h5.ui.validation.appendMessageByValidationResult}を使用する)場合の設定を行うメソッド。
		 * </p>
		 * <p>
		 * プロパティ毎の設定を以下のようなオブジェクトで指定します。既に設定済みのプロパティがある場合、設定は上書かれます。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * addMessageSetting({
		 * 	// プロパティ名をキーにして、プロパティ毎のメッセージ定義を記述
		 * 	userid: {
		 * 		displayName: 'ユーザID', // 表示名
		 * 		message: '{displayName}がルール{rule}に違反しています。', // メッセージ。プレースホルダを記述可能(後述)。
		 * 	},
		 * 	address: {
		 * 		message: 'アドレスが不正です'
		 * 	}
		 * });
		 * </code></pre>
		 *
		 * <p>
		 * message,displayName設定プロパティについては{@link h5.ui.FormController.setSetting}をご覧ください。
		 * </p>
		 *
		 * @memberOf h5.ui.validation.MessageOutputController
		 * @param {Object} messageSetting プロパティ毎のメッセージ定義。{プロパティ名: {message:..., displayName:...}}
		 *            のようなオブジェクト
		 */
		addMessageSetting: function(messageSetting) {
			if (!this._setting) {
				this._setting = messageSetting;
				return;
			}
			for ( var prop in messageSetting) {
				// 既にメッセージ定義が設定されているプロパティについては上書き
				this._setting[prop] = messageSetting[prop];
			}
		},

		/**
		 * コンテナからメッセージを削除
		 * <p>
		 * {@link h5.ui.validation.MessageOutputController.setContainer|setContainer}で設定した出力先からメッセージを削除します。出力先未設定の場合は何もしません。
		 * </p>
		 *
		 * @memberOf h5.ui.validation.MessageOutputController
		 */
		clearMessage: function() {
			if (this._container) {
				$(this._container).empty();
			}
		},

		/**
		 * メッセージの追加表示
		 * <p>
		 * {@link h5.ui.validation.MessageOutputController.setContainer|setContainer}で設定済みコンテナにメッセージを出力します。コンテナ未設定の場合は何もしません。
		 * </p>
		 * <p>
		 * メッセージは{@link h5.ui.validation.MessageOutputController.setWrapper|setWrapper}で設定したラッパーで包んで出力します。ラッパー未設定の場合はテキストノードとしてしゅつりょくします。
		 * </p>
		 *
		 * @param {string} message メッセージ
		 */
		appendMessage: function(message) {
			// 未指定ならsettingに設定されたコンテナ
			var container = this._container;
			var $container = $(container);
			if (!$container.length) {
				return;
			}

			var wrapper = this._wrapper;
			var msgElement = null;
			if (wrapper) {
				if (h5.u.str.startsWith($.trim(wrapper), '<')) {
					// '<span class="hoge">'のような指定ならその文字列でDOM生成
					msgElement = $(wrapper);
					msgElement.html(message);
				} else {
					// 'span'のような指定ならcreateElementでエレメント生成
					msgElement = $(document.createElement(wrapper)).html(message);
				}
			} else {
				// wrapper未設定ならテキストノード
				msgElement = $.parseHTML(message);
			}
			$container.append(msgElement);
		},

		/**
		 * {@link ValidationResult}からエラーメッセージを作成して返す
		 * <p>
		 * 第1引数に指定されたプロパティ名についてのエラーメッセージを作成して返します
		 * </p>
		 * <p>
		 * 指定されたプロパティがエラーでない場合はnullを返します。
		 * </p>
		 *
		 * @memberOf h5.ui.validation.MessageOutputController
		 * @param {ValidationResult} validationResult
		 * @param {string} name 対象のプロパティ名
		 * @param {boolean} [violationIndex] 違反結果のインデックス（省略時は先頭の違反を対象にする）
		 * @returns {string} エラーメッセージ
		 */
		getMessageByValidationResult: function(validationResult, name, violationIndex) {
			var invalidReason = validationResult.invalidReason[name];
			if (!invalidReason) {
				return null;
			}

			var appliedRules = this._getAppliedRules(validationResult, name);

			return h5internal.validation.createValidateErrorMessage(name, invalidReason,
					this._setting[name], violationIndex, this._validatorDefaultMessageMap,
					appliedRules, this._outputPluginDefaultMessage,
					this._outputPluginDefaultDisplayName);
		},

		/**
		 * @private
		 * @param validationResult
		 * @param name
		 * @returns
		 */
		_getAppliedRules: function(validationResult, name) {
			var appliedRuleSet = validationResult._nameToRuleSetMap[name];

			var appliedRules = appliedRuleSet.getAll();
			for (var i = 0, len = appliedRules.length; i < len; i++) {
				var rule = appliedRules[i];
				rule.message = this._validatorDefaultMessageMap[rule.name]
						|| defaultInvalidMessage[rule.name];
			}

			return appliedRules;
		},

		getAllMessagesByValidationResult: function(validationResult, name) {
			var invalidReason = validationResult.invalidReason[name];
			return this._getAllMessagesForName(validationResult, invalidReason, name);
		},

		/**
		 * @private
		 * @param invalidReason
		 * @param name
		 * @returns {Array}
		 */
		_getAllMessagesForName: function(validationResult, invalidReason, name) {
			if (!invalidReason) {
				return [];
			}

			var appliedRules = this._getAppliedRules(validationResult, name);

			var ret = [];

			var violations = invalidReason.violation;
			for (var i = 0, len = violations.length; i < len; i++) {
				var message = h5internal.validation.createValidateErrorMessage(name, invalidReason,
						this._setting[name], i, this._validatorDefaultMessageMap, appliedRules,
						this._outputPluginDefaultMessage, this._outputPluginDefaultDisplayName);
				ret.push(message);
			}

			return ret;
		},

		/**
		 * {@link ValidationResult}からメッセージを作成してコンテナに追加表示する
		 * <p>
		 * {@link ValidationResult}が非同期バリデート待ちの場合は、結果が返ってきたタイミングでメッセージを表示します。
		 * </p>
		 * <p>
		 * {@link h5.ui.validation.MessageOutputController.setContainer|setContainer}で設定済みコンテナにメッセージを出力します。コンテナ未設定の場合は何もしません。
		 * </p>
		 * <p>
		 * メッセージは{@link h5.ui.validation.MessageOutputController.setWrapper|setWrapper}で設定したラッパーで包んで出力します。ラッパー未設定の場合はテキストノードとしてしゅつりょくします。
		 * </p>
		 *
		 * @memberOf h5.ui.validation.MessageOutputController
		 * @param {ValidationResult} validationResult
		 * @param {string|string[]} [names] 出力対象のプロパティ名。指定しない場合は全てが対象
		 * @param {boolean} [showAllErrors] すべてのエラーを出力するかどうか。省略時はfalse（先頭のエラーのみ出力）。
		 */
		appendMessageByValidationResult: function(validationResult, names, showAllErrors) {
			//違反があったプロパティのプロパティ名辞書順でソートし、出力順を安定させる
			var invalidProperties = validationResult.invalidProperties.sort();
			names = isString(names) ? [names] : names;
			for (var i = 0, l = invalidProperties.length; i < l; i++) {
				var name = invalidProperties[i];
				if (names && $.inArray(name, names) === -1) {
					continue;
				}

				if (showAllErrors === true) {
					var allMessages = this.getAllMessagesByValidationResult(validationResult, name);
					for (var msgIdx = 0, msgLen = allMessages.length; msgIdx < msgLen; msgIdx++) {
						this.appendMessage(allMessages[msgIdx]);
					}
				} else {
					var message = this.getMessageByValidationResult(validationResult, name);
					this.appendMessage(message);
				}
			}
		}
	};
	h5.core.expose(controller);
})();

(function() {
	var STATE_ERROR = 'error';
	var STATE_SUCCESS = 'success';
	var STATE_VALIDATING = 'validating';

	/**
	 * バリデートエラー箇所の要素にクラスを追加するための[FormController]{@link h5.ui.validation.FormController}プラグイン
	 * <p>
	 * styleプラグインには以下の設定項目があります。
	 * </p>
	 * <table><thead>
	 * <tr>
	 * <th>設定項目</th>
	 * <th>型</th>
	 * <th>説明</th>
	 * <th>デフォルト値</th>
	 * </tr>
	 * </thead><tbody>
	 * <tr>
	 * <th>errorClassName</th>
	 * <td>string</td>
	 * <td>バリデートエラー時に適用するクラス名</td>
	 * <td>なし</td>
	 * </tr>
	 * <tr>
	 * <th>successClassName</th>
	 * <td>string</td>
	 * <td>バリデート成功時に適用するクラス名</td>
	 * <td>なし</td>
	 * </tr>
	 * <tr>
	 * <th>validatingClassName</th>
	 * <td>string</td>
	 * <td>非同期バリデートの結果待機時に適用するクラス名</td>
	 * <td>なし</td>
	 * </tr>
	 * </tbody></table>
	 * <p>
	 * プラグインの設定方法は、{@link h5.ui.FormController.setSetting}をご覧ください。
	 * </p>
	 *
	 * @class
	 * @name h5.ui.validation.Style
	 */
	var controller = {
		__name: 'h5.ui.validation.Style',
		/**
		 * プラグイン設定
		 *
		 * @private
		 * @memberOf h5.ui.validaiton.Style
		 */
		_setting: {},

		/**
		 * このプラグインがスタイルを適用した要素
		 * <p>
		 * キーにプロパティ名、値に要素を覚えておく
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.Style
		 */
		_styleAppliedElements: {},

		_updateOn: null,

		/**
		 * プラグイン設定を行う
		 *
		 * @private
		 * @memberOf h5.ui.validation.Style
		 * @param {Object} setting styleプラグイン設定オブジェクト
		 */
		_setSetting: function(setting) {
			this._setting = setting;

			if (setting.updateOn == null) {
				this._updateOn = ['validate', 'change'];
			} else {
				var updateOn = setting.updateOn;
				if (isArray(updateOn)) {
					this._updateOn = updateOn;
				} else {
					this._updateOn = [updateOn];
				}
			}
		},

		/**
		 * @private
		 * @param timing
		 * @returns {Boolean}
		 */
		_shouldUpdateOn: function(timing) {
			return $.inArray(timing, this._updateOn) !== -1;
		},

		/**
		 * バリデート時に呼ばれる
		 * <p>
		 * {@link ValidationResult}から、各要素にクラスを設定する
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.Style
		 * @param {ValidationResult} result
		 */
		_onValidate: function(validationResult) {
			if (!this._shouldUpdateOn('validate')) {
				return;
			}

			// validだったものにクラスを適用
			var properties = validationResult.properties;
			for (var i = 0, l = properties.length; i < l; i++) {
				var name = properties[i];
				this._setStyle(this.parentController._getElementByName(name), name,
						validationResult);
			}
		},

		/**
		 * フォーム部品フォーカス時に呼ばれる
		 * <p>
		 * イベントの発生したフォーム部品のバリデート結果を適用
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.Style
		 * @param {DOM} element イベント発生要素
		 * @param {string} name イベント発生要素の名前(グループの場合はグループ名)
		 * @param {ValidationResult} validationResult
		 */
		_onFocus: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('focus')) {
				return;
			}

			this._setStyle(element, name, validationResult);
		},

		/**
		 * フォーカスが外れたときに呼ばれる
		 *
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_onBlur: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('blur')) {
				return;
			}

			this._setStyle(element, name, validationResult);
		},

		/**
		 * 内容が変更されたときに呼ばれる
		 *
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_onChange: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('change')) {
				return;
			}

			this._setStyle(element, name, validationResult);
		},

		/**
		 * フォーム部品のkeyup時に呼ばれる
		 * <p>
		 * イベントの発生したフォーム部品のバリデート結果を適用
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.Style
		 * @param {DOM} element イベント発生要素
		 * @param {string} name イベント発生要素の名前(グループの場合はグループ名)
		 * @param {ValidationResult} validationResult
		 */
		_onKeyup: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('keyup')) {
				return;
			}

			this._setStyle(element, name, validationResult);
		},

		/**
		 * プラグインのリセット
		 * <p>
		 * 全てのフォームコントロール部品からプラグインが追加したクラスを全て削除します
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Style
		 */
		reset: function() {
			// このプラグインが触った要素全てからクラスを削除
			for ( var name in this._styleAppliedElements) {
				var element = this._styleAppliedElements[name];
				var propSetting = $.extend({}, this._setting, this._setting.property
						&& this._setting.property[name]);
				this._setValidateState(null, element, propSetting, name);
			}
		},

		/**
		 * バリデート結果からクラスをセットする
		 *
		 * @private
		 * @memberOf h5.ui.validation.Style
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_setStyle: function(element, name, validationResult) {
			// 共通設定とプロパティ毎の設定をマージ
			var propSetting = $.extend({}, this._setting, this._setting.property
					&& this._setting.property[name]);
			if (propSetting.off) {
				// off指定されていれば何もしない
				return;
			}
			var replaceElement = propSetting.replaceElement;
			element = isFunction(replaceElement) ? replaceElement(element)
					: (replaceElement || element);
			if (!element) {
				return;
			}
			if ($.inArray(name, validationResult.validatingProperties) !== -1) {
				// まだvalidate結果が返ってきていない場合
				this._setValidateState(STATE_VALIDATING, element, propSetting);
				validationResult.addEventListener('validate', this.own(function(ev) {
					if (ev.name === name) {
						this._setValidateState(ev.isValid ? STATE_SUCCESS : STATE_ERROR, element,
								propSetting, name);
					}
				}));
				return;
			}
			// invalidPropertiesに入っていればエラー扱い、そうでない場合は成功扱い
			// (そもそもルールの指定が無くvalidation対象じゃない(propertiesに入っていない)場合は成功扱い)
			this._setValidateState(
					$.inArray(name, validationResult.invalidProperties) === -1 ? STATE_SUCCESS
							: STATE_ERROR, element, propSetting, name);
		},

		/**
		 * バリデート結果からクラスをセットする
		 * <p>
		 * 第1引数にerror,success,valiatingの何れかを取り、該当する状態のクラス名を設定する
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.Style
		 * @param state
		 * @param element
		 * @param propSetting 適用する設定オブジェクト
		 * @param 対応するプロパティ名
		 */
		_setValidateState: function(state, element, propSetting, name) {
			var errorClassName = propSetting.errorClassName;
			var successClassName = propSetting.successClassName;
			var validatingClassName = propSetting.validatingClassName;
			$(element).removeClass(errorClassName).removeClass(successClassName).removeClass(
					validatingClassName);
			if (state == null) {
				if (this._styleAppliedElements[name]) {
					//マップから要素を削除（stateがnullになるのはver.1.3.2ではresetから呼ばれる場合のみ）
					delete this._styleAppliedElements[name];
				}
				return;
			}
			var className = propSetting[state + 'ClassName'];
			$(element).addClass(className);
			this._styleAppliedElements[name] = element;
		},

		/**
		 * @private
		 * @param validatorName
		 * @param message
		 */
		_setDefaultMessage: function(validatorName, message) {
		//このプラグインではメッセージは表示しないのでデフォルトメッセージのオーバーライドは意味がない
		}
	};
	h5.core.expose(controller);
})();

(function() {
	/**
	 * Compositionプラグインで、エラーがある場合にコンテナ要素に付与するCSSクラス名
	 */
	var CSS_H5_COMPOSITION_HAS_ERROR = 'h5-composition-has-error';

	/**
	 * validate時にエラーがあった時、エラーメッセージを表示するプラグイン
	 * <p>
	 * compositionプラグインには以下の設定項目があります。
	 * </p>
	 * <table><thead>
	 * <tr>
	 * <th>設定項目</th>
	 * <th>型</th>
	 * <th>説明</th>
	 * <th>デフォルト値</th>
	 * </tr>
	 * </thead><tbody>
	 * <tr>
	 * <th>container</th>
	 * <td>DOM|jQuery|string</td>
	 * <td>メッセージ表示先となるコンテナ要素。</td>
	 * <td>なし</td>
	 * </tr>
	 * <tr>
	 * <th>wrapper</th>
	 * <td>string</td>
	 * <td>メッセージを出力する要素のタグ名またはタグ生成文字列。'li'や、'&lt;span
	 * class="error-msg"&gt;'のような指定ができ、指定された文字列から生成した要素が各メッセージ要素になります。</td>
	 * <td>なし(テキストノードとして表示)</td>
	 * </tr>
	 * </tbody></table>
	 * <p>
	 * プラグインの設定方法は、{@link h5.ui.FormController.setSetting}をご覧ください。
	 * </p>
	 *
	 * @class
	 * @name h5.ui.validation.Composition
	 */
	var controller = {
		__name: 'h5.ui.validation.Composition',
		_messageOutputController: h5.ui.validation.MessageOutputController,

		_updateOn: null,

		_lastValidationResult: null,

		_hideWhenEmpty: null,

		_hideWhenEmptyChanged: false,

		_container: null,

		/**
		 * プラグイン設定
		 *
		 * @private
		 * @memberOf h5.ui.validation.Composition
		 */
		_setting: {},

		__construct: function() {
			this._hideWhenEmpty = false;
		},

		/**
		 * プラグイン設定を行う
		 *
		 * @private
		 * @memberOf h5.ui.validation.Composition
		 * @param {Object} setting compositionプラグイン設定オブジェクト
		 */
		_setSetting: function(setting) {
			this._setting = setting;

			if (setting.updateOn == null) {
				this._updateOn = ['validate'];
			} else {
				var updateOn = setting.updateOn;
				if (isArray(updateOn)) {
					this._updateOn = updateOn;
				} else {
					this._updateOn = [updateOn];
				}
			}

			if (this.isInit) {
				this._setChildSetting();
			} else {
				// 子コントローラの設定は子コントローラのコントローラ化が終わってから
				this.initPromise.done(this.own(this._setChildSetting));
			}
		},

		/**
		 * @private
		 * @param eventName
		 * @returns {Boolean}
		 */
		_shouldUpdateOn: function(eventName) {
			if (!this._updateOn) {
				return false;
			}

			if ($.inArray(eventName, this._updateOn) !== -1) {
				return true;
			}
			return false;
		},

		/**
		 * @private
		 * @param element onValidateから呼ばれる場合はnull
		 * @param name onValidateから呼ばれる場合はnull
		 * @param validationResult
		 */
		_update: function(element, name, validationResult) {
			if (this._setting.off === true) {
				//offが指定されていたら何もしない
				return;
			}

			var lastResult = validationResult;
			if (this._showAllErrors) {
				lastResult = this.parentController.getLastValidationResult();
			}

			this._lastValidationResult = lastResult;

			this._messageOutputController.clearMessage();
			this._messageOutputController.appendMessageByValidationResult(lastResult, null,
					this._showAllErrors);

			this._updateVisible();
		},

		/**
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_onChange: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('change')) {
				return;
			}
			this._update(element, name, validationResult);
		},

		/**
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_onBlur: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('blur')) {
				return;
			}
			this._update(element, name, validationResult);
		},

		/**
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_onFocus: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('focus')) {
				return;
			}
			this._update(element, name, validationResult);
		},

		/**
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_onKeyup: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('keyup')) {
				return;
			}
			this._update(element, name, validationResult);
		},

		/**
		 * @private
		 */
		_updateVisible: function() {
			var $container = $(this._container);

			if (this._hideWhenEmptyChanged) {
				//hideWhenEmptyが変更された場合、コンテナを一度表示状態にする。
				//（エラーがない場合下のコードで再び非表示状態になる）
				//なお、エラーがある場合のCSSクラスの制御はhideWhenEmptyの設定に関わらず常に行う
				this._hideWhenEmptyChanged = false;
				$container.show();
			}

			var hasError = this._lastValidationResult
					&& this._lastValidationResult.invalidCount > 0;

			//単純にdisplay属性をnone/空文字にする方法だと、
			//style属性でなくCSSクラスで非表示に設定されている場合などに正しく制御できない。
			//jQueryのshow/hideは、カスケーディングの状態や、要素の
			//デフォルトスタイル(block,inline-block等)を考慮して制御しているので、
			//ここではjQueryのshow/hideメソッドを使用する。

			if (hasError) {
				if (this._hideWhenEmpty === true) {
					//エラーがあるときはコンテナを表示する。
					//ただしこの制御はhideWhenEmptyが明示的にtrueの場合のみ
					$container.show();
				}
				$container.addClass(CSS_H5_COMPOSITION_HAS_ERROR);
			} else {
				if (this._hideWhenEmpty === true) {
					//エラーがないときにコンテナを非表示（display:none）にする。
					//ただしこの制御はhideWhenEmptyが明示的にtrueの場合のみ
					$container.hide();
				}
				$container.removeClass(CSS_H5_COMPOSITION_HAS_ERROR);
			}
		},

		/**
		 * バリデート時に呼ばれる
		 * <p>
		 * バリデート結果からメッセージを生成して表示
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.Composition
		 * @param {ValidationResult} validationResult
		 */
		_onValidate: function(validationResult) {
			if (!this._shouldUpdateOn('validate')) {
				return;
			}

			this._update(null, null, validationResult);
		},

		/**
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_onAsyncValidate: function(element, name, validationResult) {
			this._update(null, null, validationResult);
		},

		/**
		 * プラグインのリセット
		 * <p>
		 * メッセージを削除します
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Composition
		 */
		reset: function() {
			this._update(null, null, this.parentController.getLastValidationResult());
		},

		/**
		 * メッセージ出力コントローラの設定
		 *
		 * @private
		 * @memberOf h5.ui.validation.Composition
		 */
		_setChildSetting: function() {
			var setting = this._setting;

			//showAllErrorsはデフォルトでtrue（すべてのエラーを表示）。
			//明示的にfalseが指定された場合のみ、最初に検出されたエラーのみ出力する。
			this._showAllErrors = setting.showAllErrors !== false;

			// 出力先の設定
			this._container = setting.container;
			this._messageOutputController.setContainer(setting.container);
			this._messageOutputController.setWrapper(setting.wrapper);

			//hideWhenEmpty(エラーがない場合はコンテナ要素を非表示にする)の設定
			//hideWhenEmptyChangedプロパティは、「hideWhenEmptyプロパティが変更されたかどうか」を示すプロパティ。
			//updateVisible()内でfalseにクリアされる。
			if (('hideWhenEmpty' in setting) && (setting.hideWhenEmpty === true)) {
				//trueの場合、初期状態では（エラーがないので）非表示にする
				this._hideWhenEmpty = true;
				this._hideWhenEmptyChanged = true;
				this._updateVisible();
			} else {
				this._hideWhenEmpty = false;
				this._hideWhenEmptyChanged = true;
				this._updateVisible();
			}

			if ('message' in setting) {
				this._messageOutputController._setOutputDefaultMessage(setting.message);
			}

			if ('displayName' in setting) {
				this._messageOutputController._setOutputDefaultDisplayName(setting.displayName);
			}

			// 各プロパティ毎のメッセージ設定をする
			var property = setting.property;
			var messageSetting = {};
			for ( var p in property) {
				messageSetting[p] = {
					displayName: property[p].displayName,
					message: property[p].message
				};
			}
			this._messageOutputController.addMessageSetting(messageSetting);
		},

		/**
		 * @private
		 * @param validatorName
		 * @param message
		 */
		_setDefaultMessage: function(validatorName, message) {
			this._messageOutputController._setDefaultMessage(validatorName, message);
		}
	};
	h5.core.expose(controller);
})();

(function() {
	//FormControllerからコピーになっているので要整理
	var DATA_INPUTGROUP_CONTAINER = 'h5-input-group-container';

	var DEFAULT_PLACEMENT = 'top';
	/**
	 * validate時にエラーがあった時、エラーバルーンを表示するプラグイン
	 * <p>
	 * balloonプラグインには以下の設定項目があります。
	 * </p>
	 * <table><thead>
	 * <tr>
	 * <th>設定項目</th>
	 * <th>型</th>
	 * <th>説明</th>
	 * <th>デフォルト値</th>
	 * </thead><tbody>
	 * <tr>
	 * <th>placement</th>
	 * <td>string</td>
	 * <td>バルーンを表示する位置。top,right,bottom,leftの何れかで指定。</td>
	 * <td>top</td>
	 * </tr>
	 * <tr>
	 * <th>container</th>
	 * <td>DOM|jQuery|string</td>
	 * <td>バルーン要素を配置するコンテナ。表示位置ではなくDOMツリー上で配置するときのバルーン要素の親要素となる要素を指定します。指定しない場合は対象要素の親要素。</td>
	 * <td>なし</td>
	 * </tr>
	 * </tbody></table>
	 * <p>
	 * プラグインの設定方法は、{@link h5.ui.FormController.setSetting}をご覧ください。
	 * </p>
	 *
	 * @class
	 * @name h5.ui.validation.ErrorBalloon
	 */
	var controller = {
		__name: 'h5.ui.validation.ErrorBalloon',
		_messageOutputController: h5.ui.validation.MessageOutputController,
		_setting: {},
		_balloonTargets: [],

		_nameToTargetMap: {},

		_updateOn: null,

		/**
		 * プラグイン設定を行う
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 * @param {Object} setting bsBalloonプラグイン設定オブジェクト
		 */
		_setSetting: function(setting) {
			this._setting = setting;

			if (setting.updateOn == null) {
				this._updateOn = ['focus', 'blur'];
			} else {
				var updateOn = setting.updateOn;
				if (isArray(updateOn)) {
					this._updateOn = updateOn;
				} else {
					this._updateOn = [updateOn];
				}
			}

			if (this.isInit) {
				this._setChildSetting();
			} else {
				// 子コントローラの設定は子コントローラのコントローラ化が終わってから
				this.initPromise.done(this.own(this._setChildSetting));
			}
		},

		/**
		 * バリデート時に呼ばれる
		 * <p>
		 * バリデート結果からバルーンの表示・非表示を行う
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 * @param {ValidationResult} result
		 */
		_onValidate: function(result) {
		//TODO バルーンは基本的にはfocus,blurのタイミングでOn/Offされるが、
		//項目にフォーカスが当たり、バルーンが表示された状態でコード的にvalidate()が呼ばれる可能性は
		//ないわけではないので、そのような場合に表示を更新するようにする。
		},

		/**
		 * 要素の内容が変更された時に呼ばれる
		 * <p>
		 * バリデート結果からバルーンの表示・非表示を行う
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		_onChange: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('change')) {
				return;
			}

			this._setErrorBalloon(element, name, validationResult, 'change');
		},

		/**
		 * 要素にフォーカスした時に呼ばれる
		 * <p>
		 * バリデート結果からバルーンの表示・非表示を行う
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		_onFocus: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('focus')) {
				return;
			}

			this._setErrorBalloon(element, name, validationResult, 'focus');
		},

		/**
		 * 要素からフォーカスが外れた時に呼ばれる
		 * <p>
		 * バリデート結果からバルーンの表示・非表示を行う
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		_onBlur: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('blur')) {
				return;
			}

			this._setErrorBalloon(element, name, validationResult, 'blur');
		},

		/**
		 * 要素のキーアップ時に呼ばれる
		 * <p>
		 * バリデート結果からバルーンの表示・非表示を行う
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		_onKeyup: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('keyup')) {
				return;
			}

			this._setErrorBalloon(element, name, validationResult, 'keyup');
		},

		/**
		 * プラグインのリセット
		 * <p>
		 * 表示されているバルーンを削除します
		 * </p>
		 *
		 * @memberOf h5.ui.validation.ErrorBalloon
		 */
		reset: function() {
			for (var i = 0, len = this._balloonTargets.length; i < len; i++) {
				var balloonTarget = this._balloonTargets[i];
				this._hideBalloon(balloonTarget);
			}
			this._balloonTargets = [];
			this._nameToTargetMap = {};
		},

		/**
		 * バルーンをセット
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 * @param {string} type 要素で発生したイベントタイプ
		 */
		_setErrorBalloon: function(element, name, validationResult, type) {
			// 共通設定とプロパティ毎の設定をマージ
			var propSetting = $.extend({}, this._setting, this._setting.property
					&& this._setting.property[name]);
			if (propSetting.off) {
				// off指定されていれば何もしない
				return;
			}

			var target = null;
			var groupContainerTarget = null;

			//バルーン表示対象がグループコンテナの場合、
			//activeな要素を表示対象とする。ただし、Activeな要素がない場合は最初のコンテナを対象とする。
			if (this.parentController._isGroupName(name)) {
				var $groupContainers = $(this.parentController._getInputGroupElements()).filter(
						'[data-' + DATA_INPUTGROUP_CONTAINER + '="' + name + '"]');
				var $activeGroupContainer = $groupContainers.has(document.activeElement);
				if ($activeGroupContainer.length > 0) {
					groupContainerTarget = $activeGroupContainer[0];
				} else {
					groupContainerTarget = $groupContainers[0];
				}
			}

			var replaceElement = propSetting.replaceElement;

			if (isFunction(replaceElement)) {
				var replacer = replaceElement(element);
				//jQueryオブジェクトが返された場合はDOM要素を取り出す
				target = h5.u.obj.isJQueryObject(replacer) ? replacer[0] : replacer;
			} else if (isString(replaceElement)) {
				target = document.querySelector(replaceElement);
			} else if (h5.u.obj.isJQueryObject(replaceElement)) {
				//BalloonControllerのoption.targetはDOM要素でなければならないので、jQueryオブジェクトから取り出す
				target = replaceElement[0];
			} else if (replaceElement != null) {
				//replaceElementが文字列でもjQueryオブジェクトでなく非nullの場合は生のDOM要素が指定されたとみなす
				target = replaceElement;
			} else if (groupContainerTarget) {
				target = groupContainerTarget;
			} else {
				target = element;
			}

			if (!target) {
				return;
			}

			//対象がグループコンテナの場合、elementが「最初のコンテナ」になっているので、
			//Hideの対象と異なる場合がある。そのため、削除対象はマップから取得する。
			var hideTargetElement = this._nameToTargetMap[name] ? this._nameToTargetMap[name]
					: target;

			if (type === 'blur'
					&& (hideTargetElement !== document.activeElement && $(document.activeElement)
							.closest(hideTargetElement).length === 0)) {
				// フォーカスが外れた時、該当要素または該当要素内の要素にフォーカスが当たっていない場合は非表示にする
				this._hideBalloon(hideTargetElement, name);
				return;
			}
			var placement = propSetting.placement || DEFAULT_PLACEMENT;
			var container = propSetting.container || null;

			if ($.inArray(name, validationResult.validatingProperties) !== -1) {
				// 非同期バリデートの結果待ちの場合
				validationResult.addEventListener('validate', this.own(function(ev) {
					if (target !== document.activeElement) {
						return;
						// 非同期バリデート終了時に既にフォーカスが外れていたら何もしない
					}
					if (ev.isValid) {
						// validならバルーンを隠す
						this._hideBalloon(hideTargetElement, name);
						return;
					}
					// invalidならバルーン表示
					this._showBalloon(target, placement, container, this._messageOutputController
							.getMessageByValidationResult(validationResult, ev.name));
				}));
				return;
			}

			var invalidReason = validationResult.invalidReason
					&& validationResult.invalidReason[name];
			if (!invalidReason) {
				// validateエラーがないときはhideして終了
				this._hideBalloon(hideTargetElement, name);
				return;
			}

			if (this.parentController._isGroupName(name)) {
				this._nameToTargetMap[name] = target;
			}

			// validateエラーがあるとき
			this._showBalloon(target, placement, container, this._messageOutputController
					.getMessageByValidationResult(validationResult, name), name);
		},

		/**
		 * バルーンを表示
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 * @param target
		 * @param placement
		 * @param message
		 */
		_showBalloon: function(target, placement, container, message, name) {
			this._hideBalloon(target, name);
			var balloonCtrl = this._balloonController;
			if (!balloonCtrl) {
				var c = h5.core.controller(this.rootElement, h5.ui.components.BalloonController);
				this.manageChild(c);
				c.readyPromise.done(this.own(function() {
					this._balloonController = c;
					this._showBalloon(target, placement, container, message);
				}));
				return;
			}
			var option = {
				target: target,
				container: container
			};
			var balloon = this._balloonController.create(message, option);
			// 吹き出しの表示
			balloon.show({
				target: target,
				direction: placement
			});
			this._currentBalloon = balloon;
			this._addBalloonTarget(target);
		},

		/**
		 * バルーンを非表示
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 * @param target
		 */
		_hideBalloon: function(target, name) {
			if (this._currentBalloon) {
				this._currentBalloon.dispose();
				this._currentBalloon = null;
			}
			this._removeBalloonTarget(target);

			if (name != null && this._nameToTargetMap[name]) {
				delete this._nameToTargetMap[name];
			}
		},

		/**
		 * メッセージ出力コントローラの設定
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 */
		_setChildSetting: function() {
			var setting = this._setting;

			if ('message' in setting) {
				this._messageOutputController._setOutputDefaultMessage(setting.message);
			}

			if ('displayName' in setting) {
				this._messageOutputController._setOutputDefaultDisplayName(setting.displayName);
			}

			// 各プロパティ毎のメッセージ設定をする
			var property = setting.property;
			var messageSetting = {};
			for ( var p in property) {
				messageSetting[p] = {
					displayName: property[p].displayName,
					message: property[p].message
				};
			}
			this._messageOutputController.addMessageSetting(messageSetting);
		},

		/**
		 * バルーンの表示先要素を管理対象に追加します
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 */
		_addBalloonTarget: function(target) {
			if ($.inArray(target, this._balloonTargets) > -1) {
				return;
			}

			this._balloonTargets.push(target);
		},

		/**
		 * バルーンの表示先要素を管理対象から除去します
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBalloon
		 */
		_removeBalloonTarget: function(target) {
			var index = $.inArray(target, this._balloonTargets);
			if (index !== -1) {
				this._balloonTargets.splice(index, 1);
			}
		},

		/**
		 * @private
		 * @param validatorName
		 * @param message
		 */
		_setDefaultMessage: function(validatorName, message) {
			this._messageOutputController._setDefaultMessage(validatorName, message);
		},

		/**
		 * @private
		 * @param eventName
		 * @returns {Boolean}
		 */
		_shouldUpdateOn: function(eventName) {
			if (!this._updateOn) {
				return false;
			}

			if ($.inArray(eventName, this._updateOn) !== -1) {
				return true;
			}
			return false;
		}
	};
	h5.core.expose(controller);
})();

(function() {
	var DEFAULT_PLACEMENT = 'top';
	/**
	 * validate時にエラーがあった時、Bootstrapのエラーバルーンを表示するプラグイン
	 * <p>
	 * このプラグインはBootstrapに依存します。Bootstrapのtooltipを使用して表示してています。
	 * </p>
	 * <p>
	 * API仕様は{@link h5.ui.validation.ErrorBalloon}と同じです。
	 * </p>
	 * <p>
	 * プラグインの設定方法は、{@link h5.ui.FormController.setSetting}をご覧ください。
	 * </p>
	 *
	 * @class
	 * @name h5.ui.validation.BootstrapErrorBalloon
	 */
	var controller = {
		__name: 'h5.ui.validation.BootstrapErrorBalloon',

		/**
		 * バルーンの削除
		 * <p>
		 * 表示されているバルーンを削除します
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.BootstrapErrorBalloon
		 */
		_hideBalloon: function(target, name) {
			$(target).tooltip('hide');
			this._removeBalloonTarget(target);

			if (name != null && this._nameToTargetMap[name]) {
				delete this._nameToTargetMap[name];
			}
		},

		/**
		 * bootstrapのtooltipを使ってバルーンを表示
		 *
		 * @private
		 * @memberOf h5.ui.validation.BootstrapErrorBalloon
		 * @param target
		 * @param placement
		 * @param container
		 * @param message
		 */
		_showBalloon: function(target, placement, container, message, name) {
			$(target).removeAttr('title').attr({
				'data-placement': placement,
				'data-container': container,
				'data-original-title': message,
				// FIXME animationをtrueにすると、show/hide/showを同期で繰り返した時に表示されない
				// (shown.bs.tooltipイベントとか拾って制御する必要あり)
				// 一旦animationをoffにしている
				'data-animation': false
			}).tooltip({
				trigger: 'manual',
				html: true
			//メッセージはHTMLとして出力する（他の出力プラグインと同じように）
			}).tooltip('show');

			this._addBalloonTarget(target);
		}
	};
	// 他のメソッドやプロパティはErrorBalloonから流用
	controller = $.extend({}, h5.ui.validation.ErrorBalloon, controller);
	h5.core.expose(controller);
})();

(function() {
	/**
	 * validate時にエラーがあった時、エラーメッセージを表示するプラグイン
	 * <p>
	 * messageプラグインには以下の設定項目があります。
	 * </p>
	 * <table><thead>
	 * <tr>
	 * <th>設定項目</th>
	 * <th>型</th>
	 * <th>説明</th>
	 * <th>デフォルト値</th>
	 * </tr>
	 * </thead><tbody>
	 * <tr>
	 * <th>appendMessage</th>
	 * <td>function</td>
	 * <td>メッセージ要素配置関数。メッセージ要素の配置を行う関数を指定します。第1引数にメッセージ要素(DOM)、第2引数にメッセージ追加対象要素、第3引数にプロパティ名が渡されます。指定しない場合は、メッセージ追加対象要素の後ろに追加します。</td>
	 * <td>なし</td>
	 * </tr>
	 * <tr>
	 * <th>wrapper</th>
	 * <td>string</td>
	 * <td>メッセージを出力する要素のタグ名またはタグ生成文字列。'li'や、'&lt;span
	 * class="error-msg"&gt;'のような指定ができ、指定された文字列から生成した要素が各メッセージ要素になります。</td>
	 * <td>&lt;span class=&quot;h5-message&quot;(ここにエラーメッセージがテキストとして出力される)&gt;&lt;/span&gt;</td>
	 * </tr>
	 * </tbody></table>
	 * <p>
	 * プラグインの設定方法は、{@link h5.ui.FormController.setSetting}をご覧ください。
	 * </p>
	 *
	 * @class
	 * @name h5.ui.validation.Message
	 */
	var controller = {
		__name: 'h5.ui.validation.Message',

		/**
		 * @private
		 */
		_messageElementMap: {},

		/**
		 * @private
		 */
		_messageOutputController: h5.ui.validation.MessageOutputController,

		/**
		 * @private
		 */
		_updateOn: null,

		/**
		 * メッセージ出力時のラッパータグ文字列
		 *
		 * @private
		 */
		_wrapper: null,

		/**
		 * プラグイン設定を行う
		 *
		 * @private
		 * @memberOf h5.ui.validation.Message
		 * @param {Object} setting messageプラグイン設定オブジェクト
		 */
		_setSetting: function(setting) {
			this._setting = setting;

			if (setting.updateOn == null) {
				this._updateOn = ['change', 'validate'];
			} else {
				var updateOn = setting.updateOn;
				if (isArray(updateOn)) {
					this._updateOn = updateOn;
				} else {
					this._updateOn = [updateOn];
				}
			}

			if (this.isInit) {
				this._setChildSetting();
			} else {
				// 子コントローラの設定は子コントローラのコントローラ化が終わってから
				this.initPromise.done(this.own(this._setChildSetting));
			}
		},

		/**
		 * バリデート時に呼ばれる
		 * <p>
		 * バリデート結果からメッセージの表示・非表示を行う
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.Message
		 * @param {ValidationResult} result
		 */
		_onValidate: function(result) {
			if (!this._shouldUpdateOn('validate')) {
				return;
			}

			var properties = result.properties;
			for (var i = 0, l = properties.length; i < l; i++) {
				var name = properties[i];
				this._setMessage(this.parentController._getElementByName(name), name, result,
						'validate');
			}
		},

		/**
		 * 要素にフォーカスされた時に呼ばれる
		 * <p>
		 * バリデート結果からメッセージの表示・非表示を行う
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.Message
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		_onFocus: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('focus')) {
				return;
			}

			this._setMessage(element, name, validationResult, 'focus');
		},

		/**
		 * 要素からフォーカスが外れた時に呼ばれる
		 * <p>
		 * バリデート結果からバルーンの表示・非表示を行う
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.Message
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		_onBlur: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('blur')) {
				return;
			}

			this._setMessage(element, name, validationResult, 'blur');
		},

		/**
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_onChange: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('change')) {
				return;
			}

			this._setMessage(element, name, validationResult, 'change');
		},

		/**
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_onKeyup: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('keyup')) {
				return;
			}

			this._setMessage(element, name, validationResult, 'keyup');
		},

		/**
		 * プラグインのリセット
		 * <p>
		 * 表示されているメッセージを削除します
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Message
		 */
		reset: function() {
			for ( var p in this._messageElementMap) {
				this._removeMessage(p);
			}
		},

		/**
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 * @param type
		 */
		_setMessage: function(element, name, validationResult, type) {
			// 共通設定とプロパティ毎の設定をマージ
			var propSetting = $.extend({}, this._setting, this._setting.property
					&& this._setting.property[name]);
			if (propSetting.off) {
				// off指定されていれば何もしない
				return;
			}
			if (type === 'blur') {
				// blurの時はメッセージを非表示にして、終了
				this._removeMessage(name);
				return;
			}
			if ($.inArray(name, validationResult.validatingProperties) !== -1) {
				// まだvalidate結果が返ってきていない場合
				// メッセージを削除
				this._removeMessage(name);
				validationResult.addEventListener('validate', this.own(function(ev) {
					if (ev.name === name && !ev.isValid
							&& (type !== 'focus' || document.activeElement === element)) {
						// nameの結果が返ってきた時にメッセージを表示
						// focus時のvalidateなら、まだfocusが当たっているときだけ表示
						this._setMessage(element, name, validationResult, type);
					}
				}));
				return;
			}

			// 既存のエラーメッセージを一旦削除
			this._removeMessage(name);

			if ($.inArray(name, validationResult.invalidProperties) === -1) {
				//このプロパティが今回invalidでない場合、エラー出力しないのでここで終了
				return;
			}

			var appendMessage = propSetting.appendMessage;
			var replaceElement = propSetting.replaceElement;
			var target = isFunction(replaceElement) ? replaceElement(element)
					: (replaceElement || element);

			var rawMsg = this._messageOutputController.getMessageByValidationResult(
					validationResult, name);

			var $errorMsg;
			if (this._wrapper != null) {
				if (h5.u.str.startsWith($.trim(this._wrapper), '<')) {
					// '<span class="hoge">'のような指定ならその文字列でDOM生成
					$errorMsg = $(this._wrapper);
				} else {
					// 'span'のような指定ならcreateElementでエレメント生成
					$errorMsg = $(document.createElement(this._wrapper));
				}
			} else {
				$errorMsg = $('<span class="h5-message"></span>');
			}

			$errorMsg.html(rawMsg);

			this._messageElementMap[name] = $errorMsg;

			if (appendMessage) {
				appendMessage($errorMsg[0], target, name);
			} else if (target) {
				// elementの後ろに追加するのがデフォルト動作
				// replaceElementで対象が変更されていればその後ろ
				$(target).after($errorMsg);
			}
		},

		/**
		 * @private
		 * @param name
		 */
		_removeMessage: function(name) {
			var $message = this._messageElementMap[name];
			//messageElementMapにはjQueryインスタンスが入っているので、
			//単に存在チェックをする以下のif文でよい($message[0]とはしない)
			if ($message) {
				$message.remove();
				delete this._messageElementMap[name];
			}
		},

		/**
		 * メッセージ出力コントローラの設定
		 *
		 * @private
		 * @memberOf h5.ui.validation.Message
		 */
		_setChildSetting: function() {
			var setting = this._setting;

			if ('wrapper' in setting) {
				this._wrapper = setting.wrapper;
			}

			if ('message' in setting) {
				this._messageOutputController._setOutputDefaultMessage(setting.message);
			}

			if ('displayName' in setting) {
				this._messageOutputController._setOutputDefaultDisplayName(setting.displayName);
			}

			// 各プロパティ毎のメッセージ設定をする
			var property = setting.property;
			var messageSetting = {};
			for ( var p in property) {
				messageSetting[p] = {
					displayName: property[p].displayName,
					message: property[p].message
				};
			}
			this._messageOutputController.addMessageSetting(messageSetting);
		},

		/**
		 * @private
		 * @param validatorName
		 * @param message
		 */
		_setDefaultMessage: function(validatorName, message) {
			this._messageOutputController._setDefaultMessage(validatorName, message);
		},

		/**
		 * @private
		 * @param timing
		 * @returns {Boolean}
		 */
		_shouldUpdateOn: function(timing) {
			return $.inArray(timing, this._updateOn) !== -1;
		},
	};
	h5.core.expose(controller);
})();

(function() {
	/**
	 * 非同期validate中の項目にインジケータを出すプラグイン
	 * <p>
	 * プラグインの設定方法は、{@link h5.ui.FormController.setSetting}をご覧ください。
	 * </p>
	 *
	 * @class
	 * @name h5.ui.validation.AsyncIndicator
	 */
	var controller = {
		__name: 'h5.ui.validation.AsyncIndicator',
		_indicators: {},

		_updateOn: null,

		/**
		 * プラグイン設定を行う
		 *
		 * @private
		 * @memberOf h5.ui.validation.AsyncIndicator
		 * @param {Object} setting asyncIndicatorプラグイン設定オブジェクト
		 */
		_setSetting: function(setting) {
			this._setting = setting;

			if (setting.updateOn == null) {
				this._updateOn = ['validate', 'change'];
			} else {
				var updateOn = setting.updateOn;
				if (isArray(updateOn)) {
					this._updateOn = updateOn;
				} else {
					this._updateOn = [updateOn];
				}
			}
		},

		/**
		 * @private
		 * @param timing
		 * @returns {Boolean}
		 */
		_shouldUpdateOn: function(timing) {
			return $.inArray(timing, this._updateOn) !== -1;
		},

		/**
		 * バリデート時に呼ばれる
		 * <p>
		 * 非同期バリデートがある場合、該当要素に対してインジケータを表示する
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.AsyncIndicator
		 * @param {ValidationResult}
		 */
		_onValidate: function(result) {
			if (!this._shouldUpdateOn('validate')) {
				return;
			}

			var validatingProperties = result.validatingProperties;
			var properties = result.properties;
			for (var i = 0, l = properties.length; i < l; i++) {
				var name = properties[i];
				if ($.inArray(name, validatingProperties) !== -1) {
					var element = this.parentController._getElementByName(name);
					this._showIndicator(element, name, result);
				} else {
					this._hideIndicator(name);
				}
			}
		},

		/**
		 * 要素にフォーカスされた時に呼ばれる
		 * <p>
		 * 非同期バリデートがある場合、該当要素に対してインジケータを表示する
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.AsyncIndicator
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		_onFocus: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('focus')) {
				return;
			}

			var validatingProperties = validationResult.validatingProperties;
			if ($.inArray(name, validatingProperties) !== -1) {
				var element = this.parentController._getElementByName(name);
				this._showIndicator(element, name, validationResult);
			} else {
				this._hideIndicator(name);
			}
		},

		/**
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_onBlur: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('blur')) {
				return;
			}

			if ($.inArray(name, validationResult.validatingProperties) !== -1) {
				// バリデート中ならインジケータ表示
				this._showIndicator(element, name, validationResult);
			}
		},

		/**
		 * @private
		 * @param element
		 * @param name
		 * @param validationResult
		 */
		_onChange: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('change')) {
				return;
			}

			if ($.inArray(name, validationResult.validatingProperties) !== -1) {
				// バリデート中ならインジケータ表示
				this._showIndicator(element, name, validationResult);
			}
		},

		/**
		 * 要素でキーアップされた時に呼ばれる
		 * <p>
		 * 非同期バリデートがある場合、該当要素に対してインジケータを表示する
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.validation.AsyncIndicator
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		_onKeyup: function(element, name, validationResult) {
			if (!this._shouldUpdateOn('keyup')) {
				return;
			}

			if ($.inArray(name, validationResult.validatingProperties) !== -1) {
				// バリデート中ならインジケータ表示
				this._showIndicator(element, name, validationResult);
			}
		},

		/**
		 * プラグインのリセット
		 * <p>
		 * 表示されているインジケータを削除します
		 * </p>
		 *
		 * @memberOf h5.ui.validation.AsyncIndicator
		 */
		reset: function() {
			for ( var name in this._indicators) {
				this._hideIndicator(name);
			}
		},

		/**
		 * インジケータの表示
		 *
		 * @private
		 * @memberOf h5.ui.validation.AsyncIndicator
		 * @param {ValidationResult} validationResult
		 * @param name
		 */
		_showIndicator: function(element, name, validationResult) {
			// 共通設定とプロパティ毎の設定をマージ
			var propSetting = $.extend({}, this._setting, this._setting.property
					&& this._setting.property[name]);
			if (propSetting.off) {
				// off指定されていれば何もしない
				return;
			}
			var replaceElement = propSetting.replaceElement;
			var target = isFunction(replaceElement) ? replaceElement(element)
					: (replaceElement || element);
			if (!target) {
				return;
			}

			// 既にある場合は再利用
			this._indicators[name] = this._indicators[name] || h5.ui.indicator({
				target: target,
				block: false
			});
			this._indicators[name].show();
			validationResult.addEventListener('validate', this.own(function(ev) {
				if (name === ev.name) {
					this._hideIndicator(ev.name);
				}
			}));
			validationResult.addEventListener('abort', this.own(function(ev) {
				this._hideIndicator(name);
			}));
		},

		/**
		 * インジケータの非表示
		 *
		 * @private
		 * @memberOf h5.ui.validation.AsyncIndicator
		 * @param name
		 */
		_hideIndicator: function(name) {
			if (this._indicators[name]) {
				this._indicators[name].hide();
				delete this._indicators[name];
			}
		},

		/**
		 * @private
		 * @param validatorName
		 * @param message
		 */
		_setDefaultMessage: function(validatorName, message) {
		//このプラグインではメッセージは表示しないのでデフォルトメッセージのオーバーライドは意味がない
		}
	};
	h5.core.expose(controller);
})();

(function() {

	function pushIfNotExist(value, array) {
		if ($.inArray(value, array) === -1) {
			array.push(value);
			return true;
		}
		return false;
	}

	/**
	 * targetノードがcontainerノードの子孫要素かどうかを判定します。
	 *
	 * @private
	 */
	function containsNode(container, target) {
		//booleanで値を返すために !! で型変換する
		return !!(container.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_CONTAINED_BY);
	}

	//キャッシュ
	var ValidationResult = h5internal.validation.ValidationResult;
	var isIE = h5.env.ua.isIE;

	// ログメッセージ
	var FW_LOG_NOT_DEFINED_PLUGIN_NAME = 'プラグイン"{0}"は存在しません';
	var FW_LOG_ALREADY_ADDED = 'プラグイン"{0}"は登録済みです。';

	// TODO formのvalidatorで不要な項目は要らない
	var DATA_RULE_REQUIRED = 'required';
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
	var DATA_INPUTGROUP_CONTAINER = 'h5-input-group-container';

	// プラグインに通知するイベント
	var PLUGIN_EVENT_VALIDATE = '_onValidate';
	var PLUGIN_EVENT_FOCUS = '_onFocus';
	var PLUGIN_EVENT_BLUR = '_onBlur';
	var PLUGIN_EVENT_CHANGE = '_onChange';
	var PLUGIN_EVENT_KEYUP = '_onKeyup';

	// デフォルトで用意しているプラグイン名とプラグイン(コントローラ定義)のマップ
	var DEFAULT_PLUGINS = {
		style: h5.ui.validation.Style,
		composition: h5.ui.validation.Composition,
		balloon: h5.ui.validation.ErrorBalloon,
		bsBalloon: h5.ui.validation.BootstrapErrorBalloon,
		message: h5.ui.validation.Message,
		asyncIndicator: h5.ui.validation.AsyncIndicator
	};

	// プラグインの表示リセットメui.validation.BootstrapErrorBalloonソッド名
	var PLUGIN_METHOD_RESET = 'reset';

	// デフォルトで用意しているvalidateルール生成関数
	var defaultRuleCreators = {
		requiredRuleCreator: function(inputElement) {
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


	/**
	 * フォーム要素のバリデートを行うコントローラ
	 *
	 * @class
	 * @name h5.ui.FormController
	 */
	var controller = {
		__name: 'h5.ui.FormController',
		_config: {},
		_bindedForm: null,
		_ruleCreators: [],
		_plugins: {},

		/**
		 * フォームバリデーションロジック
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 */
		_validationLogic: h5.validation.FormValidationLogic,

		/**
		 * nameをキーに非同期バリデート結果を待つValidationResultを持つマップ
		 * <p>
		 * 待機中のバリデート結果を保持することで、同じプロパティに対して続けてバリデートが掛けられたときに待機中のものを中断して新しい結果を待つようにしている。
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @private
		 */
		_waitingValidationResultMap: {},

		/**
		 * 全体のvalidateを行ったときのvalidationResult
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 */
		_waitingAllValidationResult: null,

		/**
		 * フォームコントローラの設定
		 * <p>
		 * {@link h5.ui.FormController.setSetting}で設定した設定オブジェクト
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 */
		_setting: {},

		/**
		 * 各プラグインの設定
		 * <p>
		 * {@link h5.ui.FormController.setSetting}で設定した設定オブジェクトから、各プラグイン毎の設定を抜き出してプラグイン名でマップ化したもの
		 * </p>
		 * <p>
		 * プラグインを有効にする前に設定されたものも覚えて置き、有効化された時にそのプラグインの設定を使用する。
		 * </p>
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 */
		_pluginSetting: {},

		/**
		 * フォームコントローラの設定を行う
		 * <p>
		 * 第1引数にフォームコントローラの設定及び各プラグインの設定を行うオブジェクトを指定します。
		 * </p>
		 * <p>
		 * 各プラグインの機能及びプラグイン名については、{@link h5.ui.FormController.addOutput}をご覧ください。
		 * </p>
		 * <p>
		 * 指定する設定オブジェクトには各プラグイン毎の設定と、各プロパティ毎の設定を記述します。
		 * </p>
		 * <p>
		 *
		 * <pre class="sh_javascript"><code>
		 * {
		 * 	output: { // 各プラグイン毎の設定
		 * 		balloon: { // キー名にプラグイン名
		 * 			placement: 'top' // 設定プロパティと値を記述
		 * 		},
		 * 		message: {...},
		 * 		...
		 * 	},
		 * 	property: { // 各プロパティ毎の設定
		 * 		name: { // キー名にプロパティ名
		 * 			displayName: '名前', // 設定プロパティと値を記述
		 * 			message: '必須です', // 設定プロパティと値を記述
		 * 			output: { // 各プロパティについて各プラグイン固有の設定
		 * 				balloon: {
		 * 					placement: 'left' // 設定プロパティと値を記述
		 * 				},
		 * 				message: {
		 * 					message: '登録には{displayName}が必要です'  // 設定プロパティと値を記述
		 * 				}
		 * 			}
		 * 		}
		 * 	}
		 * }
		 * </code></pre>
		 *
		 * <p>
		 * 設定プロパティは
		 * <ul>
		 * <li>フォームコントローラで使用するもの
		 * <li>各プラグインで使用するもの
		 * <ul>
		 * <li>プラグイン共通のもの
		 * <li>プラグイン固有のもの
		 * </ul>
		 * </ul>
		 * があります。
		 * </p>
		 * <h4>フォームコントローラで使用するもの</h4>
		 * <table class="params"><thead>
		 * <tr>
		 * <th>設定プロパティ名</th>
		 * <th>型</th>
		 * <th>説明</th>
		 * <th>デフォルト値</th>
		 * </tr>
		 * </thead><tbody>
		 * <tr>
		 * <th>isArray</th>
		 * <td>boolean</td>
		 * <td>あるプロパティについて、値を必ず配列で取ってくる場合はtrueを設定します。isArrayを指定しない場合、name属性値が同じフォーム入力要素が複数あると値が配列になったりならなかったりする場合があります。
		 * 例えば、name属性が同じcheckboxが複数チェックされている場合配列になりますが、1つしかチェックされていない場合は文字列になります。
		 * どんな場合でも必ず配列で取得したい場合は、isArrayにtrueを設定してください。</td>
		 * <td>false</td>
		 * </tr>
		 * <tr>
		 * <th>srcElement</th>
		 * <td>DOM|jQuery|string</td>
		 * <td>あるプロパティについて対応する要素を指定します。この指定はフォーム部品ではなくただのdiv等を入力要素としてvalueFuncで値を取ってくるような場合に、エラー出力プラグインが対応する要素を取得するために指定します。</td>
		 * <td>あるプロパティについて対応するフォーム入力部品要素</td>
		 * </tr>
		 * <tr>
		 * <th>valueFunc</th>
		 * <td>function</td>
		 * <td>あるプロパティについて値を取得する関数を指定します。この指定はフォーム部品ではなくただのdiv等を入力要素としたような場合に、値を取得するための関数を設定します。第1引数にはFormControllerのルートエレメント、第1引数にはプロパティ名が渡されます。値を返す関数を設定してください。</td>
		 * <td>なし</td>
		 * </tr>
		 * </tbody></table>
		 * <h4>全プラグイン共通</h4>
		 * <table class="params"><thead>
		 * <tr>
		 * <th>設定プロパティ名</th>
		 * <th>型</th>
		 * <th>説明</th>
		 * <th>デフォルト値</th>
		 * </tr>
		 * </thead><tbody>
		 * <tr>
		 * <th>off</th>
		 * <td>boolean</td>
		 * <td>プラグイン無効設定。無効にする場合はtrueを指定。</td>
		 * <td>false</td>
		 * </tr>
		 * </tbody></table>
		 * <h4>メッセージを表示するプラグイン(message, composition, balloonで共通)</h4>
		 * <table class="params"><thead>
		 * <tr>
		 * <th>設定プロパティ名</th>
		 * <th>型</th>
		 * <th>説明</th>
		 * <th>デフォルト値</th>
		 * </tr>
		 * </thead><tbody>
		 * <tr>
		 * <th>displayName</th>
		 * <td>string</td>
		 * <td>バリデーション対象のプロパティに対応する表示名</td>
		 * <td>バリデーション対象のプロパティ名。メッセージ生成パラメータ(後述)で使用されます。</td>
		 * </tr>
		 * <tr>
		 * <th>message</th>
		 * <td>string|function</td>
		 * <td>
		 * <p>
		 * バリデートエラー時に表示するメッセージ文字列。またはメッセージ生成関数。
		 * </p>
		 * <p>
		 * 文字列で指定する場合はプレースホルダの記述ができます。プレースホルダの場合に適用されるオブジェクト、
		 * 及び関数指定の場合に第1引数に渡されるパラメータ(メッセージ生成パラメータ)は共通で、以下の通りです。
		 * </p>
		 *
		 * <pre class="javascript_sh"><code>
		 * {
		 *     name: 'userid', // プロパティ名
		 *     value: 'ab',     // 値
		 *     displayName: 'ユーザーID', // 設定した表示名。未設定の場合はプロパティ名が入ります。
		 *     violation: [{
		 *       ruleName: 'min',
		 *       ruleValue: {value: 4, inclusive:true},
		 *       reason: (object)  //そのルールが非同期の場合。同期の場合は常にnull
		 *     }, ... ]
		 * }
		 * </code></pre>
		 *
		 * </td>
		 * <td>デフォルトルール毎にデフォルトのメッセージが用意されており、それらが使用されます。</td>
		 * </tr>
		 * </tbody></table>
		 * <h4>フォーム入力要素基準でエラー表示を行うプラグイン(style,message,balloon,asyncIndicatorで共通)</h4>
		 * <table class="params"><thead>
		 * <tr>
		 * <th>設定プロパティ名</th>
		 * <th>型</th>
		 * <th>説明</th>
		 * <th>デフォルト値</th>
		 * </tr>
		 * </thead><tbody>
		 * <tr>
		 * <th>replaceElement</th>
		 * <td>DOM|jQuery|string|function</td>
		 * <td>クラス適用対象要素をDOM,jQuery,セレクタの何れかで指定。関数を設定した場合は第1引数にデフォルトは各プロパティのフォーム部品要素が渡され、その関数が返す要素が対象要素になります。</td>
		 * <td>各プロパティのフォーム入力部品要素</td>
		 * </tr>
		 * </tbody></table>
		 * <p>
		 * 各プラグイン固有の設定項目については、各プラグインのJSDocを参照してください。
		 * </p>
		 * <ul>
		 * <li>{@link h5.ui.validation.Style}
		 * <li>{@link h5.ui.validation.AsyncIndicator}
		 * <li>{@link h5.ui.validation.Composition}
		 * <li>{@link h5.ui.validation.Message}
		 * <li>{@link h5.ui.validation.BootstrapErrorBalloon}
		 * <li>{@link h5.ui.validation.ErrorBalloon}
		 * <ul>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {Object} setting 設定オブジェクト
		 */
		setSetting: function(setting) {
			this._setting = setting;

			if ('customRule' in setting) {
				this._addCustomRule(setting.customRule);
			}

			if ('isAllRulesEnabledWhenEmpty' in setting) {
				this._validationLogic
						.setAllRulesEnabledWhenEmpty(setting.isAllRulesEnabledWhenEmpty === true);
			}

			if ('ruleDefault' in setting) {
				for ( var ruleName in setting.ruleDefault) {
					var ruleDefaultSetting = setting.ruleDefault[ruleName];
					if ('isForceEnabledWhenEmpty' in ruleDefaultSetting) {
						this._validationLogic.setRuleForceEnabledWhenEmpty(ruleName,
								ruleDefaultSetting.isForceEnabledWhenEmpty);
					}
					if ('message' in ruleDefaultSetting) {
						//既存ルールのデフォルトメッセージを上書き
						this.setDefaultMessage(ruleName, ruleDefaultSetting.message);
					}

					if ('validateOn' in ruleDefaultSetting) {
						this._validationLogic._setRuleValidateTiming(ruleName,
								ruleDefaultSetting.validateOn);
					}

					if ('resolveOn' in ruleDefaultSetting) {
						//ルールのデフォルトのResolveタイミングを上書き
						this._validationLogic._setRuleResolveTiming(ruleName,
								ruleDefaultSetting.resolveOn);
					}
				}
			}

			if (('customRule' in setting)) {
				for ( var ruleName in setting.customRule) {
					var ruleDef = setting.customRule[ruleName];
					if ('message' in ruleDef) {
						//今回追加するカスタムルールのデフォルトメッセージを定義
						this.setDefaultMessage(ruleName, ruleDef.message);
					}
				}
			}

			// 現在有効なプラグインの設定を取り出して設定する
			var currentPlugins = this._plugins;
			for ( var pluginName in currentPlugins) {
				var plugin = currentPlugins[pluginName];
				plugin._setSetting && plugin._setSetting(this._margePluginSettings(pluginName));
				this._setDefaultMessages(plugin);
			}
			//updateOnのタイミングキャッシュを更新
			this._updateOutputTimingCache();

			if (this.isInit) {
				this._updateRuleByElement();
			}
		},

		/**
		 * @private
		 * @param customValidatorObj
		 */
		_addCustomRule: function(customRuleDefMap) {
			for ( var ruleName in customRuleDefMap) {
				var ruleDef = customRuleDefMap[ruleName];

				if (!('message' in ruleDef)) {
					throw new Error('カスタムバリデータの定義にはmessageの指定が必須です。定義しようとしたルール=' + ruleName);
				}

				h5.validation.defineRule(ruleName, ruleDef.func, null, 40, false,
						ruleDef.validateOn, ruleDef.resolveOn);

				if ('isForceEnabledWhenEmpty' in ruleDef) {
					this._validationLogic.setRuleForceEnabledWhenEmpty(ruleName,
							ruleDef.isForceEnabledWhenEmpty);
				}
			}
		},

		/**
		 * 設定オブジェクトから指定されたプラグインの設定だけ取り出す
		 *
		 * @private
		 * @param pluginName
		 */
		_margePluginSettings: function(pluginName) {
			this._pluginSetting;
			var setting = this._setting;
			var outputSetting = setting.output;
			var propertySetting = setting.property;
			var pluginSetting = $.extend({}, outputSetting && outputSetting[pluginName]);
			pluginSetting.property = {};
			for ( var prop in propertySetting) {
				var propSetting = $.extend({}, propertySetting[prop]);
				$.extend(propSetting, propSetting[pluginName]);
				var propertyPluginOutput = h5.u.obj.getByPath('output.' + pluginName, propSetting);
				delete propSetting['output'];
				pluginSetting.property[prop] = $.extend({}, propSetting, propertyPluginOutput);
			}
			return pluginSetting;
		},

		/**
		 * @memberOf h5.ui.FormController
		 * @private
		 */
		__construct: function() {
			// デフォルトルールの追加
			// TODO formのvalidatorで不要な項目は要らない
			this._addRuleCreator(DATA_RULE_REQUIRED, defaultRuleCreators.requiredRuleCreator);
			this
					._addRuleCreator(DATA_RULE_ASSERT_FALSE,
							defaultRuleCreators.assertFalseRuleCreator);
			this._addRuleCreator(DATA_RULE_ASSERT_TRUE, defaultRuleCreators.assertTrueRuleCreator);
			this._addRuleCreator(DATA_RULE_NULL, defaultRuleCreators.nulRuleCreator);
			this._addRuleCreator(DATA_RULE_NOT_NULL, defaultRuleCreators.notNullRuleCreator);
			this._addRuleCreator(DATA_RULE_MAX, defaultRuleCreators.maxRuleCreator);
			this._addRuleCreator(DATA_RULE_MIN, defaultRuleCreators.minRuleCreator);
			this._addRuleCreator(DATA_RULE_FUTURE, defaultRuleCreators.futureRuleCreator);
			this._addRuleCreator(DATA_RULE_PAST, defaultRuleCreators.pastRuleCreator);
			this._addRuleCreator(DATA_RULE_PATTERN, defaultRuleCreators.patternRuleCreator);
			this._addRuleCreator(DATA_RULE_SIZE, defaultRuleCreators.sizeRuleCreator);

			this._lastResult = this._createEmptyValidationResult();

			var that = this;

			/**
			 * @private
			 * @param event
			 */
			this._asyncValidateResultListenerWrapper = function(event) {
				switch (event.type) {
				case 'validate':
					that._asyncValidateListener(event);
					break;
				case 'asyncPropertyComplete':
					that._asyncPropertyCompleteListener(event);
					break;
				case 'abort':
					that._asyncAbortListener(event);
					break;
				case 'validateComplete':
					that._asyncValidateCompleteListener(event);
					break;
				}
			};
		},

		/**
		 * @private
		 */
		_asyncValidateResultListenerWrapper: null,

		/**
		 * @memberOf h5.ui.FormController
		 * @private
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

			this._updateRuleByElement();

			// submitイベントを拾ってvalidateが行われるようにする
			if (this._bindedForm) {
				this.on(this._bindedForm, 'submit', this._submitHandler);
			}
		},

		/**
		 * @private
		 */
		_updateRuleByElement: function() {
			// フォーム部品からルールを生成
			var $formControls = $(this._getElements());
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

				var attributes = element.attributes;
				for (var i = 0, len = attributes.length; i < len; i++) {
					var attributeName = attributes[i].name;
					if (!this._startsWith(attributeName, 'data-h5-v-')) {
						continue;
					}
					var validatorName = attributeName.substr(10);
					ruleOfProp[validatorName] = true;
				}

			}));
			this.addRule(validateRule);
		},

		/**
		 * @private
		 * @param str
		 * @param searchStr
		 * @returns {Boolean}
		 */
		_startsWith: function(str, searchStr) {
			return str.substr(0, searchStr.length) === searchStr;
		},

		/**
		 * プラグインの有効化
		 * <p>
		 * フォームのバリデート時にバリデート結果を出力するプラグインを有効にします。以下のようなプラグインが用意されています。
		 * </p>
		 * <table><thead>
		 * <tr>
		 * <th>プラグイン名</th>
		 * <th>説明</th>
		 * </tr>
		 * </thead><tbody>
		 * <tr>
		 * <td>composition</td>
		 * <td>フォーム全体バリデート時にバリデート失敗した項目全てについて指定した箇所にメッセージを出力する</td>
		 * </tr>
		 * <tr>
		 * <td>style</td>
		 * <td>バリデート時にバリデート結果によって要素にクラスを適用する</td>
		 * </tr>
		 * <tr>
		 * <td>message</td>
		 * <td>バリデート時にバリデート失敗した項目についてメッセージを表示する</td>
		 * </tr>
		 * <tr>
		 * <td>balloon</td>
		 * <td>バリデート時にバリデート失敗した項目についてバルーンメッセージを表示する</td>
		 * </tr>
		 * <tr>
		 * <td>bsBalloon</td>
		 * <td>バリデート時にバリデート失敗した項目についてブートストラップでバルーンメッセージを表示する(bootstrap依存)</td>
		 * </tr>
		 * <tr>
		 * <td>asyncIndicator</td>
		 * <td>非同期バリデート中の項目についてインジケータを表示する</td>
		 * </tr>
		 * </tbody></table>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string|string[]} pluginNames プラグイン名またはその配列
		 */
		addOutput: function(pluginNames) {
			// デフォルトの出力プラグイン追加
			// __init前(rootElement決定前)ならルートエレメント決定後に実行
			if (!this.isInit) {
				this.initPromise.done(this.own(function() {
					this.addOutput(pluginNames);
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

			//updateOnのタイミングキャッシュを更新
			this._updateOutputTimingCache();
		},

		/**
		 * @private
		 */
		_updateOutputTimingCache: function() {
			var aggrTimingMapObj = {};

			for ( var pluginName in this._plugins) {
				var plugin = this._plugins[pluginName];

				var updateOn = plugin._updateOn;
				if (!updateOn) {
					updateOn = ['focus', 'blur', 'change', 'keyup', 'validate'];
				}

				for (var i = 0, len = updateOn.length; i < len; i++) {
					var timing = updateOn[i];
					aggrTimingMapObj[timing] = true;
				}
			}

			this._outputTimingCache = aggrTimingMapObj;
		},

		/**
		 * 現在の全ての出力プラグインでセットされているupdateOnのタイミングの集合。アップデートするタイミングをオブジェクトのキーにする。
		 *
		 * @private
		 */
		_outputTimingCache: {},

		/**
		 * ルールの追加
		 * <p>
		 * バリデートルールを追加する。第1引数にはルールオブジェクトを指定します。ルールオブジェクトについては{@link h5.validation.FormValidationLogic.addRule}と同じ形式で指定してください。
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {Object} ruleObj ルールオブジェクト(オブジェクトの形式は{@link h5.validation.FormValidationLogic.addRule}参照)
		 */
		addRule: function(ruleObj) {
			if (ruleObj) {
				this._validationLogic.addRule(ruleObj);
			}
		},

		/**
		 * ルールの削除
		 * <p>
		 * 第1引数に指定されたプロパティについてのバリデートルールを削除します
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string|string[]} name プロパティ名またはその配列
		 */
		removeRule: function(name) {
			this._validationLogic.removeRule(name);
			this.validate(name);
		},

		/**
		 * ルールの有効化
		 * <p>
		 * 第1引数に指定されたプロパティについてのバリデートを無効化します
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string|string[]} names プロパティ名またはその配列
		 */
		enableRule: function(names) {
			this._validationLogic.enableRule(names);
		},

		/**
		 * ルールの無効化
		 * <p>
		 * 第1引数に指定されたプロパティについてのバリデートを無効化します
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string|string[]} names プロパティ名またはその配列
		 */
		disableRule: function(names) {
			this._validationLogic.disableRule(names);
		},

		/**
		 * このコントローラが管理するフォーム内のフォーム部品の値を集約したオブジェクトを生成する
		 * <p>
		 * フォーム部品を集約し、各部品の名前(name属性値)をキーに、その値を持つオブジェクトを返します。
		 * </p>
		 * <p>
		 * 第1引数を省略した場合、このコントローラのバインド対象のフォーム内全てのフォーム部品を集約対象とします。
		 * </p>
		 * <p>
		 * 第1引数にtargetNamesを指定した場合、指定した名前に当てはまるフォーム部品だけが集約対象になります。
		 * </p>
		 * <p>
		 * 例えばname属性が"userid"のinputがあり、その値が"0001"である場合は、{userid: "0001"}のようなオブジェクトを返します。
		 * </p>
		 * <p>
		 * また、グループ指定された要素の集約をすることができます。
		 * </p>
		 * <p>
		 * グループとは、以下のように指定することができます
		 * </p>
		 *
		 * <pre class="sh_html"><code>
		 * &lt;!-- data-h5-input-group-containerにグループ名を指定。子要素がそのグループになる。 --&gt;
		 * &lt;div data-h5-input-group-container=&quot;birthday&quot;&gt;
		 * 		&lt;displayName class=&quot;control-displayName&quot;&gt;生年月日&lt;/displayName&gt;
		 * 		&lt;input name=&quot;year&quot; type=&quot;text&quot; placeholder=&quot;年&quot;&gt;
		 * 		&lt;input name=&quot;month&quot; type=&quot;text&quot; placeholder=&quot;月&quot;&gt;
		 * 		&lt;input name=&quot;day&quot; type=&quot;text&quot; placeholder=&quot;日&quot;&gt;
		 * &lt;/div&gt;
		 * </code></pre>
		 *
		 * <p>
		 * 上記のような指定のされた要素は、グループ名をキーにグループに属する要素を集約したオブジェクトとして集約します。戻り値は以下のようになります。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * {
		 * 	birthday: {
		 * 		year: &quot;1999&quot;,
		 * 		month: &quot;1&quot;,
		 * 		month: &quot;2&quot;
		 * 	},
		 * 	zipcode: {
		 * 		zip1: &quot;220&quot;,
		 * 		zip2: &quot;0012&quot;
		 * 	}
		 * }
		 * </code></pre>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string|string[]} names 指定した場合、指定したnameのものだけを集約
		 * @returns {Object} フォーム部品集約オブジェクト
		 */
		getValue: function(names) {
			names = names && (!isArray(names) ? [names] : names);
			var $elements = $(this._getElements());
			var $groups = $(this._getInputGroupElements());
			var propertySetting = this._setting && this._setting.property || {};
			var ret = {};
			var elementNames = [];
			var rootElement = this.rootElement;
			$elements.each(function() {
				var name = this.name;
				elementNames.push(name);
				var currentGroup = ret;
				var groupName = null;
				// グループに属していればグループ名を取得
				if ($groups.find(this).length) {
					var $group = $(this).closest('[data-' + DATA_INPUTGROUP_CONTAINER + ']');
					groupName = $group.data(DATA_INPUTGROUP_CONTAINER);
				}
				if (groupName) {
					elementNames.push(groupName);
					// グループコンテナに属するエレメントの場合
					if (names && $.inArray(name, names) === -1
							&& $.inArray(groupName, names) === -1) {
						// nameもgroupNameもnamesに入っていなければ集約対象外
						return;
					}
					// グループ単位でオブジェクトを作る
					ret[groupName] = ret[groupName] || {};
					currentGroup = ret[groupName];
				} else if (names && $.inArray(name, names) === -1) {
					// グループに属さないエレメントの場合
					// namesに含まれないnameのエレメントは集約対象外
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

				if (this.type === 'radio' && this.checked === false) {
					//ラジオボックスは、同じグループの選択肢の中から1つだけを選ぶため
					//checkedでないものは含めない。なお、どの項目も選択されていない場合は
					//キー自体が含まれない、ということになる。
					return;
				}

				if (!name) {
					//名前がない（空文字）場合は含めない
					return;
				}

				var valueFunc = propertySetting[name] && propertySetting[name].valueFunc;
				var value = valueFunc ? valueFunc(rootElement, name) : $(this).val();

				if (valueFunc && value === undefined) {
					// valueFuncがundefinedを返した場合はそのプロパティは含めない
					//nullの場合は含める(ver.1.3.2以降。それ以前は、nullの場合も除外していた)
					return;
				}

				if (this.type === 'checkbox' && this.checked === false) {
					//チェックボックスの場合、チェックされていない場合は値を常にnullにする
					value = null;
				}

				if (propertySetting[name] && !!propertySetting[name].isArray) {
					// isArray:trueが指定されていたら必ず配列
					value = wrapInArray(value);
				}
				if (currentGroup[name] !== undefined) {
					if (!$.isArray(currentGroup[name])) {
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

			// セッティングに記述されているがinput要素の集約で集められないプロパティを追加
			for ( var p in propertySetting) {
				if ((!names || $.inArray(p, names) !== -1) && $.inArray(p, elementNames) === -1) {
					var valueFunc = propertySetting[p] && propertySetting[p].valueFunc;
					var val = valueFunc && valueFunc(rootElement, p);
					if (val !== undefined) {
						ret[p] = val;
					}
				}
			}

			return ret;
		},

		/**
		 * このコントローラが管理するフォームに対して、値を集約したオブジェクトから値をセットする
		 * <p>
		 * 各フォーム部品の名前と値を集約したオブジェクトを引数に取り、その値を各フォーム部品にセットします。
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {Object} obj フォーム部品の値を集約したオブジェクト
		 */
		setValue: function(obj) {
			var $elements = $(this._getElements());
			var indexMap = {};
			// グループ指定でプロパティが入れ子であるオブジェクトの場合、展開する
			var flatObj = {};
			for ( var p in obj) {
				if ($.isPlainObject(obj[p])) {
					for ( var prop in obj[p]) {
						flatObj[prop] = obj[p][prop];
					}
				} else {
					flatObj[p] = obj[p];
				}
			}
			obj = flatObj;
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
					$(this).prop('checked', value);
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
		clearValue: function() {
			$(this._getElements()).each(function() {
				if (this.type === 'radio' || this.type === 'checkbox') {
					$(this).prop('checked', false);
					return;
				}
				$(this).val(null);
			});
		},

		/**
		 * フォーム部品の値をすべてリセットする
		 *
		 * @memberOf h5.ui.FromController
		 */
		resetValue: function() {
			if (this._bindedForm) {
				this._bindedForm.reset();
			}
		},

		/**
		 * 各プラグインが出力しているバリデート結果表示をすべてリセットする
		 *
		 * @memberOf h5.ui.FormController
		 */
		resetValidation: function() {
			//			this._waitingAllValidationResult && this._waitingAllValidationResult.abort();
			//			for ( var p in this._waitingValidationResultMap) {
			//				this._waitingValidationResultMap[p].abort();
			//			}

			//空の（何もバリデーションしていない）ValidationResultをセットする
			this._lastResult = this._createEmptyValidationResult();

			this._waitingValidationResultMap = {};
			var plugins = this._plugins;
			for ( var pluginName in plugins) {
				this._resetPlugin(pluginName, plugins[pluginName]);
			}

			this._fireValidationUpdateEvent('reset');
		},

		/**
		 * フォームに入力された値のバリデートを行う
		 * <p>
		 * 第1引数にプロパティ名またはその配列を指定した場合、指定されたプロパティ名のみをバリデート対象にします。省略した場合は全てが対象になります。
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string|string[]} names バリデート対象のプロパティ名またはプロパティ名の配列
		 * @returns {ValidationResult}
		 */
		validate: function(names) {
			// バリデート実行
			var result = this._validate(names, 'validate');

			// _onValidateの呼び出し
			this._callPluginValidateEvent(PLUGIN_EVENT_VALIDATE, result);

			//出力プラグインの更新が終わってからイベントを上げる
			//例えばCompositionのCSSクラスの付与などが終わった状態にするため
			this._fireValidationUpdateEvent('validate');

			return result;
		},

		/**
		 * プラグイン名からプラグインインスタンスを取得
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string} pluginName プラグイン名
		 * @returns {Controller}
		 */
		getOutput: function(pluginName) {
			return this._plugins[pluginName];
		},

		/**
		 * 各項目のバリデーションを行う前に呼び出すフック関数をセットします。
		 *
		 * @param preValidationHookFunction フック関数
		 */
		setPreValidationHook: function(preValidationHookFunction) {
			this._validationLogic.setPreValidationHook(preValidationHookFunction);
		},

		/*
		 * フォーム部品でのイベント発生時にプラグインを呼び出すイベントハンドラ設定
		 */
		'{document} focusin': function(ctx) {
			this._pluginElementEventHandler(ctx, PLUGIN_EVENT_FOCUS);
		},

		'{document} focusout': function(ctx) {
			this._pluginElementEventHandler(ctx, PLUGIN_EVENT_BLUR);
		},

		'{document} keyup': function(ctx) {
			this._pluginElementEventHandler(ctx, PLUGIN_EVENT_KEYUP);
		},

		'{document} change': function(ctx) {
			this._pluginElementEventHandler(ctx, PLUGIN_EVENT_CHANGE);
		},

		/**
		 * このコントローラが管理するフォームに属するフォーム部品またはフォーム部品グループ要素の中で指定した名前に一致する要素を取得
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 * @param {string} name
		 * @returns {DOM}
		 */
		_getElementByName: function(name) {
			// このメソッドはプラグインがvalidate結果から対応するエレメントを探す時に呼び出される
			var srcElement = this._setting.property && this._setting.property[name]
					&& this._setting.property[name].srcElement;
			if (srcElement) {
				return srcElement;
			}
			var $formCtrls = $(this._getElements());
			var element = $formCtrls.filter('[name="' + name + '"]')[0];
			if (element) {
				return element;
			}
			var groupContainer = $(this._getInputGroupElements()).filter(
					'[data-' + DATA_INPUTGROUP_CONTAINER + '="' + name + '"]')[0];
			if (groupContainer) {
				return groupContainer;
			}
			return null;
		},

		/**
		 * このDOM要素がフォームの入力要素かどうかを返します。内部的には、タグ名がinput, select, textareaのいずれかの場合trueを返します。
		 *
		 * @private
		 * @param element
		 * @returns {Boolean}
		 */
		_isFormInputElement: function(element) {
			if (element && element.tagName) {
				var tagName = element.tagName.toLowerCase();
				if (tagName == 'input' || tagName == 'select' || tagName == 'textarea') {
					return true;
				}
			}
			return false;
		},

		/**
		 * このコントローラが管理するフォームに属するフォーム部品全てを取得
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 * @returns {DOM[]}
		 */
		_getElements: function() {
			if (this._bindedForm && !isIE) {
				//IE11以外の現行ブラウザ(2019/4現在)はHTML5仕様に基づくform属性に対応しているので
				//form.elementsを参照すればそのフォームに属する入力要素を取得可能。
				//TODO reset, buttonなど送信時に含むかどうかが動的に変わる要素のフィルタ
				return $(this._bindedForm.elements);
			}

			var $innerFormControls = this.$find('input,select,textarea').not(
					'[type="submit"],[type="reset"],[type="image"]');

			if (!this._bindedForm) {
				//コントローラのバインド要素がフォームでない場合は
				//バインド要素の子孫の入力要素
				//TODO notの除外タイプが上記でよいか検討。type=buttonをどうするか
				return $innerFormControls;
			}

			var cmap = new Map();

			for (var i = 0, len = $innerFormControls.length; i < len; i++) {
				var elem = $innerFormControls[i];
				cmap.set(elem, elem);
			}

			var formId = $(this._bindedForm).attr('id');
			// ブラウザがform属性に対応しているかどうかに関わらず、
			// HTML5の仕様に従ってformに属するフォームコントロール部品を列挙する
			var $formControls = $('input,select,textarea').not(
					'[type="submit"],[type="reset"],[type="image"]');
			return $formControls.filter(
					function() {
						var $this = $(this);
						var formAttr = $this.attr('form');
						// form属性がこのコントローラのフォームを指している
						// または、このコントローラのフォーム内の要素でかつform属性指定無し
						return (formAttr && formAttr === formId) || !formAttr
								&& cmap.get(this) !== undefined;
					}).toArray();
		},

		/**
		 * このコントローラが管理するフォームに属するグループコンテナ要素(data-group-containerが指定されている要素)を取得する。
		 * グループコンテナ要素は、このコントローラのバインド要素の子孫要素である必要がある。
		 * （入力要素と異なり、form属性には対応しない。すなわち、コントローラのバインド要素の子孫の外側にコンテナ要素を置いても機能しない）
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 * @returns {DOM[]}
		 */
		_getInputGroupElements: function() {
			var $allGroups = $('[data-' + DATA_INPUTGROUP_CONTAINER + ']');
			return this.$find('[data-' + DATA_INPUTGROUP_CONTAINER + ']').filter(
					function() {
						var $this = $(this);
						var formAttr = $this.attr('form');
						// form属性がこのコントローラのフォームを指している
						// または、このコントローラのフォーム内の要素でかつform属性指定無し
						return (formAttr && formAttr === formId) || !formAttr
								&& $allGroups.index($this) !== -1;
					}).toArray();
		},

		/**
		 * @private
		 * @param name
		 */
		_isGroupName: function(name) {
			//nameはnullの場合に加え空文字の場合もfalse扱いなのでこの判定でよい
			if (!name) {
				return false;
			}

			var groupContainers = this._getInputGroupElements();
			for (var i = 0, len = groupContainers.length; i < len; i++) {
				var container = groupContainers[i];
				var groupName = $(container).data(DATA_INPUTGROUP_CONTAINER);
				if (name === groupName) {
					return true;
				}
			}
			return false;
		},

		/**
		 * バリデートルール生成関数の登録
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 * @param key
		 * @param func
		 */
		_addRuleCreator: function(key, func) {
			this._ruleCreators.push({
				key: key,
				func: func
			});
		},

		/**
		 * プラグインのリセット
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 * @param {string} pluginName
		 * @param {Controller} plugins
		 */
		_resetPlugin: function(pluginName, plugin) {
			if (!plugin[PLUGIN_METHOD_RESET]) {
				return;
			}
			plugin[PLUGIN_METHOD_RESET].call(plugin);
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
			c._setSetting && c._setSetting(this._margePluginSettings(pluginName));

			this.manageChild(c);
			this._setDefaultMessages(c);
			this._plugins[pluginName] = c;
		},

		_ruleDefaultMessageMap: {},

		/**
		 * 出力プラグインコントローラにデフォルトメッセージを定義します。
		 *
		 * @private
		 * @param controller
		 */
		_setDefaultMessages: function(controller) {
			for ( var ruleName in this._ruleDefaultMessageMap) {
				controller._setDefaultMessage(ruleName, this._ruleDefaultMessageMap[ruleName]);
			}
		},

		/**
		 * このコントローラを介して適用するバリデーションルールについて、ルールに違反した場合のデフォルトのエラーメッセージを変更します。
		 *
		 * @param {string} ruleName ルール名
		 * @param {string|function} message デフォルトメッセージ、またはメッセージフォーマット関数
		 */
		setDefaultMessage: function(ruleName, message) {
			this._ruleDefaultMessageMap[ruleName] = message;
		},

		_lastResult: null,

		/**
		 * フォームのバリデートを行う
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 * @param names
		 * @param timing
		 * @returns {ValidationResult}
		 */
		_validate: function(names, timing) {
			var formData = this.getValue(names);

			// 待機中のValidationResultをabortする処理
			// 指定されたnamesに該当するValidationResultをabortで中断する
			//			if (names) {
			//				names = $.isArray(names) ? names : [names];
			//				for (var i = 0, l = names.length; i < l; i++) {
			//					// 現在のプロパティ毎の非同期バリデート待ちのValidationResultは全て中断
			//					var name = names[i];
			//					var r = this._waitingValidationResultMap[name];
			//					if (!r) {
			//						continue;
			//					}
			//					r.abort();
			//					delete this._waitingValidationResultMap[name];
			//				}
			//			} else {
			//				// namesが指定されていない場合は全てのプロパティが対象
			//				for ( var p in this._waitingValidationResultMap) {
			//					this._waitingValidationResultMap[p].abort();
			//				}
			//				this._waitingValidationResultMap = {};
			//			}

			var result = this._validationLogic.validate(formData, names, timing, this._lastResult,
					this._outputTimingCache);

			//this._lastResultは常に存在する
			//（construct時に初期状態のValidationResultインスタンスをセットし、その後は常にmergeし続ける）ので
			//nullチェックは不要
			this._lastResult._merge(result);

			if (result.isAsync) {
				//一番最後に行われたバリデーション結果のみを使用する。
				//waiting-mapに、このプロパティに対して実行した最新のValidationResultを保持しておき、
				//validateイベント時にそのValidationResultとこのマップに保存したResultが一致するかどうかをチェックして
				//反映させるかどうかを決定する。マップに保持したものととevent.targetのインスタンスが一致しないということは
				//そのtargetは古いバリデーションなので、画面に反映させない。
				var properties = result.asyncWaitingProperties;
				for (var i = 0, l = properties.length; i < l; i++) {
					var p = properties[i];
					this._waitingValidationResultMap[p] = result;
				}
				result.addEventListener('validate', this._asyncValidateResultListenerWrapper);
				result.addEventListener('asyncPropertyComplete',
						this._asyncValidateResultListenerWrapper);
				result.addEventListener('validateComplete',
						this._asyncValidateResultListenerWrapper);
				result.addEventListener('abort', this._asyncValidateResultListenerWrapper);
			}

			return result;
		},

		getLastValidationResult: function() {
			return this._lastResult;
		},

		/**
		 * @private
		 * @param event
		 */
		_asyncValidateListener: function(event) {
			var result = event.target;
			var name = event.name;

			if (this._waitingValidationResultMap[name] !== result) {
				//このnameのプロパティについての最新のバリデーション結果以外の結果の場合は反映させない
				return;
			}

			this._updateByAsyncResult(event);

			this._callPluginForAsyncValidation(name, result);

			this._fireValidationUpdateEvent('asyncResult');
		},

		/**
		 * @private
		 * @param event
		 */
		_asyncPropertyCompleteListener: function(event) {
			var result = event.target;
			var name = event.name;

			if (this._waitingValidationResultMap[name] !== result) {
				//このnameのプロパティについての最新のバリデーション結果以外の場合は何もしない
				return;
			}

			//このnameのプロパティの全ての非同期バリデーションが完了したのでマップからエントリを削除
			delete this._waitingValidationResultMap[name];

			//マージした方の最新のResultの非同期結果待ちプロパティリストから当該プロパティを削除する
			var idx = this._lastResult.asyncWaitingProperties.indexOf(name);
			if (idx !== -1) {
				this._lastResult.asyncWaitingProperties.splice(idx, 1);
			}
		},

		/**
		 * @private
		 * @param name
		 * @param validationResult
		 * @param violation
		 */
		_updateByAsyncResult: function(event) {
			var name = event.name;
			var violation = event.violation;
			var lastResult = this._lastResult;

			//あるプロパティについて、少なくとも1つのエラーが発生したか、もしくはすべての非同期バリデータが成功したので
			//validating状態から削除する
			var validatingPropIdx = lastResult.validatingProperties.indexOf(name);
			if (validatingPropIdx !== -1) {
				//ただし、同期ルールですでにエラーがあった場合はvalidatingでなくinvalidに既に入っているので、
				//validatingに入っていた時のみ削除
				lastResult.validatingProperties.splice(validatingPropIdx, 1);
			}

			if (!violation) {
				//violationがnull === このプロパティに対するすべての非同期ルールの結果がValidだった

				if (validatingPropIdx !== -1) {
					//validatingに入っていた＝同期ルールはすべてエラーなしだった場合のみ、validに含める
					pushIfNotExist(name, lastResult.validProperties);
					lastResult.validCount++;
				}
			} else {
				lastResult.isValid = false;
				var isAddedToInvalid = pushIfNotExist(name, lastResult.invalidProperties);
				if (isAddedToInvalid) {
					lastResult.invalidCount++;
				}

				if (!lastResult.invalidReason[name]) {
					lastResult.invalidReason[name] = {
						name: name,
						value: event.value,
						violation: []
					};
				}

				var isViolationReplaced = false;

				for (var i = 0, len = lastResult.invalidReason[name].violation.length; i < len; i++) {
					var lastViolation = lastResult.invalidReason[name].violation[i];
					if (violation.ruleName === lastViolation.ruleName) {
						//すでにこのルールのエラーが出力されている場合、新しいViolationで置換する
						lastResult.invalidReason[name].violation[i] = violation;
						isViolationReplaced = true;
						break;
					}
				}

				//今回新たにエラー出力する
				if (!isViolationReplaced) {
					lastResult.invalidReason[name].violation.push(violation);
					lastResult.violationCount++;
				}
			}


			if (!lastResult.isValid || !lastResult.validatingProperties.length) {
				lastResult.isAllValid = lastResult.isValid;
			}
		},

		/**
		 * @private
		 * @param event
		 */
		_asyncAbortListener: function(event) {
			var abortedValidationResult = event.target;

			for ( var propName in this._waitingValidationResultMap) {
				var waitingResult = this._waitingValidationResultMap[propName];
				if (waitingResult === abortedValidationResult) {
					delete this._waitingValidationResultMap[propName];
				}
			}

			this._removeAllValidationResultListenerWrapper(abortedValidationResult);
		},

		/**
		 * @private
		 * @param event
		 */
		_asyncValidateCompleteListener: function(event) {
			var result = event.target;
			this._removeAllValidationResultListenerWrapper(result);
		},

		/**
		 * @private
		 * @param validationResult
		 */
		_removeAllValidationResultListenerWrapper: function(validationResult) {
			validationResult.removeEventListener('validate',
					this._asyncValidateResultListenerWrapper);
			validationResult.removeEventListener('asyncPropertyComplete',
					this._asyncValidateResultListenerWrapper);
			validationResult.removeEventListener('validateComplete',
					this._asyncValidateResultListenerWrapper);
			validationResult.removeEventListener('abort', this._asyncValidateResultListenerWrapper);
		},

		/**
		 * @private
		 * @memberOf h5.ui.FormController
		 */
		_pluginElementEventHandler: function(ctx, eventType) {
			//TODO セットされているプラグイン・バリデートタイミングをチェックして、特にkeyupなど
			//バリデーションする必要がないタイミングがあればバリデーションしないようにする（高速化）
			var target = ctx.event.target;

			if (!this._isUnderControl(target)) {
				//このコントローラがバインドされているフォームに紐づいていない入力要素で起きたイベントの場合は無視
				return;
			}

			var name = target.name;
			if (!name) {
				// name無しの要素は対象外
				return;
			}

			// グループに属していればそのグループに対してvalidate
			// タグにグループの指定が無くグループコンテナに属している場合
			var groupName;
			var $groups = $(this._getInputGroupElements());
			if ($groups.find(target).length) {
				var $group = $(target).closest('[data-' + DATA_INPUTGROUP_CONTAINER + ']');
				groupName = $group.data(DATA_INPUTGROUP_CONTAINER);
			}
			var validateTargetName = groupName || name;

			var validationTiming = null;
			switch (eventType) {
			case PLUGIN_EVENT_VALIDATE:
				validationTiming = 'validate';
				break;
			case PLUGIN_EVENT_FOCUS:
				validationTiming = 'focus';
				break;
			case PLUGIN_EVENT_BLUR:
				validationTiming = 'blur';
				break;
			case PLUGIN_EVENT_CHANGE:
				validationTiming = 'change';
				break;
			case PLUGIN_EVENT_KEYUP:
				validationTiming = 'keyup';
				break;
			default:
				validationTiming = 'validate';
				break;
			}

			var validationResult = this._validate(validateTargetName, validationTiming);

			this._callPluginElementEvent(eventType, target, name, validationResult);
			if (groupName) {
				// グループがあればグループについてのバリデート結果も通知
				var groupTarget = this._getElementByName(groupName);
				this._callPluginElementEvent(eventType, groupTarget, groupName, validationResult);
			}

			this._fireValidationUpdateEvent(validationTiming);
		},

		/**
		 * @private
		 * @param timing
		 */
		_fireValidationUpdateEvent: function(timing) {
			var evArg = {
				timing: timing
			};
			this.trigger('validationUpdate', evArg);
		},

		/**
		 * プラグインのvalidateイベントの呼び出し
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 */
		_callPluginValidateEvent: function(type, result) {
			var plugins = this._plugins;
			for ( var pluginName in plugins) {
				var plugin = plugins[pluginName];
				if (plugin[type]) {
					plugin[type].call(plugin, result);
				}
			}
		},

		/**
		 * プラグインのフォームコントロール要素についてのイベント呼び出し
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 */
		_callPluginElementEvent: function(eventType, element, name, validationResult) {
			var plugins = this._plugins;
			for ( var pluginName in plugins) {
				var plugin = plugins[pluginName];
				if (plugin[eventType]) {
					plugin[eventType](element, name, validationResult);
				}
			}
		},

		/**
		 * @private
		 */
		_callPluginForAsyncValidation: function(name, validationResult) {
			var eventType = '_onAsyncValidate';

			var element = this._getElementByName(name);

			var plugins = this._plugins;
			for ( var pluginName in plugins) {
				var plugin = plugins[pluginName];
				if (plugin[eventType]) {
					plugin[eventType](element, name, validationResult);
				}
			}
		},

		/**
		 * @private
		 * @memberOf h5.ui.FormController
		 */
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

		/**
		 * このFormController（に対応するフォーム）に紐づいた入力要素かどうかを返します。
		 * 判定条件は、(1)要素がinput,select,textareaのいずれかであること, かつ<br>
		 * (2-1)form属性がない場合は、このコントローラのバインド要素の子孫要素であること<br>
		 * (2-2)form属性がある場合は、このコントローラのバインド要素がform要素かつそのフォームのidと属性値が同じであること。<br>
		 * なお、2-2において、このコントローラのバインド要素がフォームでない場合はfalseを返します。
		 *
		 * @private
		 */
		_isUnderControl: function(element) {
			if (!this._isFormInputElement(element)) {
				//入力要素でない場合はfalse
				return false;
			}

			var id = element.getAttribute('form');
			//ここでは、id属性がセットされていない(null)場合と空文字の場合('')で同じ分岐に入りたいのでこの判定式で良い
			if (!id) {
				//form属性がセットされていない場合はこのコントローラのバインド要素の子孫ならtrue
				var isContained = containsNode(this.rootElement, element);
				return isContained;
			}

			//以下は、引数の要素にform属性がセットされていた場合

			//このコントローラのバインド要素がformでない場合はfalse
			if (!this._bindedForm) {
				return false;
			}

			//form属性がセットされている場合はその値がバインドしているformのidと同じならtrue
			var formId = this._bindedForm.getAttribute('id');
			if (id === formId) {
				return true;
			}
			return false;
		},

		/**
		 * 初期状態(何のプロパティもチェックしておらず、Valid状態)のValidationResultを生成します。
		 *
		 * @private
		 * @returns {h5internal.validation.ValidationResult}
		 */
		_createEmptyValidationResult: function() {
			var ret = new ValidationResult({
				validProperties: [],
				invalidProperties: [],
				validatingProperties: [],
				properties: [],
				invalidReason: {},
				isAsync: false,
				isValid: true,
				isAllValid: true,
				violationCount: 0,
				validPropertyToRulesMap: {},
				nameToRuleSetMap: {},
				disabledProperties: [],
				asyncWaitingProperties: []
			});
			return ret;
		}
	};
	h5.core.expose(controller);
})();
