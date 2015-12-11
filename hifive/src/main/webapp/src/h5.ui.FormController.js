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
	var defaultIntvalidMessage = {
		require: '{label}は必須項目です',
		min: '{label}は{param.min}{param.inclusive?"以上の":"より大きい"}数値を入力してください。',
		max: '{label}は{param.max}{param.inclusive?"以下":"未満"}の数値を入力してください。',
		pattern: '{label}は正規表現{param.regexp}を満たす文字列を入力してください。',
		digits: '{label}は整数部分{param.integer}桁、小数部分{fruction}桁以下の数値を入力してください。',
		size: '{label}は{param.min}以上{param.max}以下の長さでなければいけません。',
		future: '{label}は現在時刻より未来の時刻を入力してください。',
		past: '{label}は現在時刻より過去の時刻を入力してください。',
		nul: '{label}はnullでなければなりません。',
		notNull: '{label}はnullでない値を設定してください。',
		assertFalse: '{label}はfalseとなる値を入力してください。',
		assertTrue: '{label}はtrueとなる値を入力してください。',
		customFunc: '{label}は条件を満たしません'
	};

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
	 * @param {Object} setting
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
			rejectReason: reason.rejectReason,
			name: name,
			label: label
		};
		if (isString(msg)) {
			// messageが指定されていればh5.u.str.formatでメッセージを作成
			msg = h5.u.str.format(msg, param);
			return msg;
		} else if (isFunction(formatter)) {
			// formatterが設定されている場合はパラメータを渡して関数呼び出しして生成
			return formatter(param);
		}

		// 何も設定されていない場合はデフォルトメッセージ
		if (defaultIntvalidMessage[reason.rule]) {
			return h5.u.str.format(defaultIntvalidMessage[reason.rule], param);
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

	/**
	 * メッセージ及びvalidate結果から作成したメッセージを出力するコントローラ
	 *
	 * @class
	 * @name h5.ui.validation.MessageOutput
	 */
	var controlelr = {
		__name: 'h5.ui.validation.MessageOutput',
		// container,tagNameの設定
		_containerSetting: {},
		// validationResultからメッセージを作るための設定
		_setting: {},
		// 追加設定
		_addedSetting: null,

		/**
		 * メッセージ出力先の設定を適用する
		 *
		 * @memberOf h5.ui.validation.MessageOutput
		 * @param {Object} containerSetting 出力先設定
		 * @param {Object} containerSetting.container デフォルト出力先(コンテナ)要素
		 * @param {Object} containerSetting.wrapper デフォルト出力タグ名。指定しない場合はメッセージはテキストノードとして生成されます
		 */
		setContainerSetting: function(containerSetting) {
			this._containerSetting = containerSetting;
		},

		/**
		 * メッセージ出力先の設定を適用する
		 * <p>
		 * メッセージを{@link ValidationResult}から出力する([appendMessageByValidationResult]{@link h5.ui.validation.appendMessageByValidationResult}を使用する)場合の設定を行うメソッド。
		 * </p>
		 * <p>
		 * 以下のようなオブジェクトで指定します。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * setMessageSetting({
		 * 	// プロパティ名をキーにして、プロパティ毎のメッセージ定義を記述
		 * 	userid: {
		 * 		label: 'ユーザID', // ラベル名
		 * 		message: '{label}がルール{rule}に違反しています。', // メッセージ。プレースホルダを記述可能(後述)。
		 * 	},
		 * 	address: {
		 * 		label: 'アドレス',
		 * 		formatter: function(param) {
		 * 			// フォーマッタは関数で記述。メッセージを生成して返すような関数を作成
		 * 		switch (param.rule) {
		 * 		case 'require':
		 * 			return '必須です';
		 * 		case 'pattern':
		 * 			return param.value + 'は' + param.label + 'の値として不正です'
		 * 		}
		 * 	}
		 * 	}
		 * });
		 * </code></pre>
		 *
		 * <p>
		 * messageとformatterが両方記述されている場合は、messageに記述されたメッセージが優先して使用されます。
		 * </p>
		 * <p>
		 * messageにはプレースホルダを記述できます。適用されるパラメータはformatterの引数に渡されるパラメータと同じで、以下のようなオブジェクトです。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * {
		 * 	value: value, // バリデート対象の値
		 * 	param: param, // バリデート時に渡された引数リスト
		 * 	rule: rule, // バリデートルール名
		 * 	rejectReason: rejectReason, // 非同期バリデートだった場合、failハンドラに渡された引数リスト
		 * 	name: name, // バリデート対象のプロパティ名
		 * 	label: label
		 * // メッセージ定義に指定されたラベル名
		 * }
		 * </code></pre>
		 *
		 * @memberOf h5.ui.validation.MessageOutput
		 * @param {Object} messageSetting プロパティ毎のメッセージ定義。{プロパティ名: {message:..., formatter:..,
		 *            label:...}} のようなオブジェクト
		 */
		setMessageSetting: function(messageSetting) {
			this._setting = messageSetting;
		},

		/**
		 * メッセージ設定へ追加設定を行う
		 * <p>
		 * [setMessageSetting]{@link h5.ui.validation.MessageOutput.setMessageSetting}で設定したメッセージ設定に、追加で設定を行う。
		 * </p>
		 *
		 * @memberOf h5.ui.validation.MessageOutput
		 * @param {string} name 追加設定を行うプロパティ名
		 * @param {Object} messageObj メッセージ設定オブジェクト。{message:..., formatter:...,
		 *            label:...}のようなオブジェクト
		 */
		addMessageSetting: function(name, messageObj) {
			this._addedSetting = this._addedSetting || {};
			this._addedSetting[name] = messageObj;
		},

		/**
		 * コンテナからメッセージを削除
		 * <p>
		 * 第1引数を省略した場合は設定済みのデフォルト出力先からメッセージを削除します
		 * </p>
		 *
		 * @memberOf h5.ui.validation.MessageOutput
		 * @param {Object} messageSetting {プロパティ名: {message:..., formatter:..}}のようなオブジェクト
		 */
		clearMessage: function(container) {
			var container = container || this._containerSetting.container;
			$(container).empty();
		},

		/**
		 * メッセージの追加表示
		 *
		 * @param {string} message メッセージ
		 * @param {DOM|jQuery|string} [container] 表示先要素。指定しない場合はデフォルト出力先に出力します
		 * @param {string} [wrapper] メッセージをラップするタグ名または要素生成文字列。指定しない場合はデフォルトタグ名を使用します
		 */
		appendMessage: function(message, container, wrapper) {
			// 未指定ならsettingに設定されたコンテナ
			var container = container || this._containerSetting.container;
			var $container = $(container);
			if (!$container.length) {
				return;
			}

			wrapper = wrapper || this._containerSetting.wrapper;
			if (wrapper) {
				if (h5.u.str.startsWith($.trim(wrapper), '<')) {
					// '<span class="hoge">'のような指定ならその文字列でDOM生成
					msgElement = $(wrapper);
					msgElement.text(message);
				} else {
					// 'span'のような指定ならcreateElementでエレメント生成
					msgElement = $(document.createElement(wrapper)).html(message);
				}
			} else {
				// wrapper未設定ならテキストノード
				msgElement = document.createTextNode(message);
			}
			$container.append(msgElement);
		},

		/**
		 * {@link ValidationResult}からエラーメッセージを作成して返す
		 * <p>
		 * 第1引数に指定されたプロパティ名についてのエラーメッセージを作成して返します
		 * </p>
		 * <p>
		 * 指定されたプロパティがエラーでないばあいはnullを返します。
		 * </p>
		 *
		 * @memberOf h5.ui.validation.MessageOutput
		 * @param {ValidationResult} validationResult
		 * @param {string} name 対象のプロパティ名
		 * @returns {string} エラーメッセージ
		 */
		getMessageByValidationResult: function(validationResult, name) {
			var failureReason = validationResult.failureReason[name];
			if (!failureReason) {
				return null;
			}
			return h5internal.validation.createValidateErrorMessage(name, failureReason, this
					._getMessageSettingByName(name));
		},

		/**
		 * {@link ValidationResult}からメッセージを作成して追加表示する
		 * <p>
		 * {@link ValidationResult}が非同期バリデート待ちの場合は、結果が返ってきたタイミングでメッセージを表示します。
		 * </p>
		 *
		 * @memberOf h5.ui.validation.MessageOutput
		 * @param {ValidationResult} validationResult
		 * @param {string|string[]} [names] 出力対象のプロパティ名。指定しない場合は全てが対象
		 * @param {DOM|jQuery|string} [container] 表示先要素。指定しない場合はデフォルト出力先に出力します
		 * @param {string} [wrapper] メッセージをラップするタグ名またはタグ生成文字列。指定しない場合はデフォルトタグ名を使用します
		 */
		appendMessageByValidationResult: function(validationResult, names, container, wrapper) {
			var invalidProperties = validationResult.invalidProperties;
			names = isString(names) ? [names] : names;
			for (var i = 0, l = invalidProperties.length; i < l; i++) {
				var name = invalidProperties[i];
				if (names && $.inArray(name, names) === -1) {
					continue;
				}
				var failureReason = validationResult.failureReason[name];
				var message = this.getMessageByValidationResult(validationResult, name);
				this.appendMessage(message, container, wrapper);
			}
			if (validationResult.isAllValid === null) {
				// 非同期でまだ結果が返ってきていないものがある場合
				validationResult.addEventListener('validate', this.own(function(ev) {
					if (!ev.isValid && !names || $.inArray(ev.property, names) !== -1) {
						var failureReason = ev.target.failureReason[ev.property];
						var message = h5internal.validation.createValidateErrorMessage(ev.property,
								failureReason, this._getMessageSettingByName(ev.property));
						this.appendMessage(message, container, wrapper);
					}
				}));
				return;
			}
		},

		/**
		 * コンテナからメッセージをすべて削除
		 *
		 * @memberOf h5.ui.validation.MessageOutput
		 * @param {DOM|jQuery|string} [container] 中身を削除するコンテナ。指定しない場合はデフォルト出力先。
		 */
		clearAll: function(container) {
			// 未指定ならsettingに設定されたコンテナ
			var container = container || this._containerSetting.container;
			if (container) {
				$(container).empty();
			}
		},

		/**
		 * あるプロパティ名に対応するメッセージ設定の取得
		 *
		 * @private
		 * @memberOf h5.ui.validation.MessageOutput
		 * @param {string} name
		 */
		_getMessageSettingByName: function(name) {
			// message,formatterについては必ず追加設定(addMessageSettingで追加された設定)を優先
			// 元の設定でmessageが指定されていて、追加設定でformatterが設定されている場合、
			// 元の設定のmessageは使わずに追加設定のformatterが使われるようにする
			var added = this._addedSetting && this._addedSetting[name];
			var messageSetting = $.extend({}, this._setting[name], added);
			if (added && (added.message != null || added.formatter != null)) {
				messageSetting.message = added.message;
				messageSetting.formatter = added.formatter;
			}
			return messageSetting;
		}
	};
	h5.core.expose(controlelr);
})();

(function() {
	var STATE_ERROR = 'error';
	var STATE_SUCCESS = 'success';
	var STATE_VALIDATING = 'validating';

	/**
	 * バリデートエラー箇所の要素にクラスを追加するための[FormController]{@link h5.ui.validation.FormController}プラグイン
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

		__construct: function(ctx) {
			var setting = ctx.args && ctx.args.setting;
			if (setting) {
				this.setSetting(setting);
			}
		},

		/**
		 * プラグイン設定を行う
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
		 * <th>off</th>
		 * <td>boolean</td>
		 * <td>プラグイン無効設定。無効にする場合はtrueを指定。</td>
		 * <td>false</td>
		 * </tr>
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
		 * <tr>
		 * <th>replaceElement</th>
		 * <td>DOM|jQuery|string|function</td>
		 * <td>クラス適用対象要素をDOM,jQuery,セレクタの何れかで指定。関数を設定した場合は第1引数にデフォルトは各プロパティのフォーム部品要素が渡され、その関数が返す要素が対象要素になります。</td>
		 * <td>各プロパティのフォーム部品要素</td>
		 * </tr>
		 * </tbody></table>
		 * <p>
		 * 各設定項目について、共通設定とプロパティ毎の設定を記述できます。以下、記述例です。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * {
		 * 	errorClassName: 'error', // バリデートエラー時に適用するクラス名
		 * 	successClassName: 'success', // バリデート成功時に適用するクラス名
		 * 	validatingClassName: 'validating', // 非同期バリデート待ちの場合に適用するクラス名
		 * 	property: { // 各プロパティ固有の設定
		 * 		userid: { // プルパティ名
		 * 			errorClassName: 'id-error',
		 * 			replaceElement: function(element) {
		 * 				// クラス設定対象要素は親要素にする
		 * 				return $(element).parent();
		 * 			}
		 * 		},
		 * 		name: {
		 * 			off: true
		 * 		// nameプロパティについてプラグインによるクラス設定を無効
		 * 		}
		 * 	}
		 * }
		 * </code></pre>
		 *
		 * @memberOf h5.ui.validation.Style
		 * @param {Object} setting styleプラグイン設定オブジェクト
		 */
		setSetting: function(setting) {
			this._setting = setting;
		},

		/**
		 * バリデート時に呼ばれる
		 * <p>
		 * {@link ValidationResult}から、各要素にクラスを設定する
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Style
		 * @param {ValidationResult} result
		 */
		onValidate: function(validationResult) {
			// validだったものにクラスを適用
			var allProperties = validationResult.allProperties;
			for (var i = 0, l = allProperties.length; i < l; i++) {
				var name = allProperties[i];
				this._setStyle(this.parentController.getElementByName(name), name,
						validationResult);
			}
		},

		/**
		 * フォーム部品フォーカス時に呼ばれる
		 * <p>
		 * イベントの発生したフォーム部品のバリデート結果を適用
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Style
		 * @param {DOM} element イベント発生要素
		 * @param {string} name イベント発生要素の名前(グループの場合はグループ名)
		 * @param {ValidationResult} validationResult
		 */
		onFocus: function(element, name, validationResult) {
			this._setStyle(element, name, validationResult);
		},

		/**
		 * フォーム部品のkeyup時に呼ばれる
		 * <p>
		 * イベントの発生したフォーム部品のバリデート結果を適用
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Style
		 * @memberOf h5.ui.validation.Style
		 * @param {DOM} element イベント発生要素
		 * @param {string} name イベント発生要素の名前(グループの場合はグループ名)
		 * @param {ValidationResult} validationResult
		 */
		onKeyup: function(element, name, validationResult) {
			this._setStyle(element, name, validationResult);
		},

		/**
		 * プラグインのリセット
		 * <p>
		 * 全てのフォームコントロール部品からプラグインが追加したクラスを全て削除します
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Style
		 * @param globalSetting
		 * @param setting
		 */
		reset: function() {
			// 全てのフォームコントロール部品からすべてのクラスを削除
			this._setValidateState(null, $formControls, pluginSetting);
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
			var element = isFunction(replaceElement) ? replaceElement(element)
					: (replaceElement || element);
			if (!element) {
				return;
			}
			if ($.inArray(name, validationResult.validatingProperties) !== -1) {
				// まだvalidate結果が返ってきていない場合
				this._setValidateState(STATE_VALIDATING, element, propSetting);
				validationResult.addEventListener('validate', this.own(function(ev) {
					if (ev.property === name) {
						this._setValidateState(ev.isValid ? STATE_SUCCESS : STATE_ERROR, element,
								propSetting);
					}
				}));
				return;
			}
			// invalidPropertiesに入っていればエラー扱い、そうでない場合は成功扱い
			// (そもそもルールの指定が無くvalidation対象じゃない(allPropertiesに入っていない)場合は成功扱い)
			this._setValidateState(
					$.inArray(name, validationResult.invalidProperties) === -1 ? STATE_SUCCESS
							: STATE_ERROR, element, propSetting);
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
		 */
		_setValidateState: function(state, element, propSetting) {
			var errorClassName = propSetting.errorClassName;
			var successClassName = propSetting.successClassName;
			var validatingClassName = propSetting.validatingClassName;
			$(element).removeClass(errorClassName).removeClass(successClassName).removeClass(
					validatingClassName);
			if (!state) {
				return;
			}
			$(element).addClass(propSetting[state + 'ClassName']);
		}
	};
	h5.core.expose(controller);
})();

(function() {
	/**
	 * validate時にエラーがあった時、エラーメッセージを表示するプラグイン
	 *
	 * @class
	 * @name h5.ui.validation.Composition
	 */
	var controller = {
		__name: 'h5.ui.validation.Composition',
		_messageOutputController: h5.ui.validation.MessageOutput,
		/**
		 * プラグイン設定
		 *
		 * @private
		 * @memberOf h5.ui.validation.Composition
		 */
		_setting: {},

		__construct: function(ctx) {
			var setting = ctx.args && ctx.args.setting;
			if (setting) {
				this.setSetting(setting);
			}
		},

		/**
		 * プラグイン設定を行う
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
		 * <th>off</th>
		 * <td>boolean</td>
		 * <td>プラグイン無効設定。無効にする場合はtrueを指定。</td>
		 * <td>false</td>
		 * </tr>
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
		 * <tr>
		 * <th>message</th>
		 * <td>string</td>
		 * <td>バリデートエラー時に表示するメッセージ。メッセージの記述形式は{@link h5.ui.validation.MessageOutput.setMessage}のmessageプロパティと同じ形式です。</td>
		 * <td>デフォルトルール毎にデフォルトのメッセージが用意されており、それらが使用されます。</td>
		 * </tr>
		 * <tr>
		 * <th>formatter</th>
		 * <td>function</td>
		 * <td>バリデートエラー時に表示するメッセージフォーマッタ。フォーマッタの記述形式は{@link h5.ui.validation.MessageOutput.setMessage}のformatterプロパティと同じ形式です。</td>
		 * <td>なし</td>
		 * </tr>
		 * <tr>
		 * <th>label</th>
		 * <td>string</td>
		 * <td>バリデーション対象のプロパティに対応するラベル名</td>
		 * <td>バリデーション対象のプロパティ名</td>
		 * </tr>
		 * </tbody></table>
		 * <p>
		 * 各設定項目について、共通設定とプロパティ毎の設定を記述できます。以下、記述例です。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * {
		 * 	container: 'ul.composition',
		 * 	wrapper: 'li',
		 * 	property: { // 各プロパティ固有の設定
		 * 		userid: { // プルパティ名
		 * 			label: 'ユーザ名',
		 * 			message: '{label}は必須です'
		 * 		}
		 * 	}
		 * }
		 * </code></pre>
		 *
		 * @memberOf h5.ui.validation.Composition
		 * @param {Object} setting compositionプラグイン設定オブジェクト
		 */
		setSetting: function(setting) {
			this._setting = setting;
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
		 * バリデート結果からメッセージを生成して表示
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Composition
		 * @param {ValidationResult} validationResult
		 * @param {Object} globalSetting
		 * @param {Object} outputSetting
		 */
		onValidate: function(validationResult) {
			this._messageOutputController.clearMessage();
			this._messageOutputController.appendMessageByValidationResult(validationResult);
		},

		/**
		 * このプラグインが出力するメッセージの追加設定
		 * <p>
		 * プロパティ毎の出力メッセージ設定オブジェクトを設定します。
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Composition
		 * @param {string} name
		 * @param {Object} messageObj message,formatterを持つオブジェクト
		 */
		setMessage: function(name, messageObj) {
			this._messageOutputController.addMessageSetting(name, messageObj);
		},

		/**
		 * プラグインのリセット
		 * <p>
		 * メッセージを削除します
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Composition
		 * @param globalSetting
		 * @param setting
		 */
		reset: function() {
			this._messageOutputController.clearAll();
		},

		/**
		 * メッセージ出力コントローラの設定
		 *
		 * @private
		 * @memberOf h5.ui.validation.Composition
		 */
		_setChildSetting: function() {
			var setting = this._setting;
			// 出力先の設定
			this._messageOutputController.setContainerSetting({
				container: setting.container,
				wrapper: setting.wrapper
			});

			// 各プロパティ毎のメッセージ設定をする
			var property = setting.property;
			var messageSetting = {};
			for ( var p in property) {
				messageSetting[p] = {
					label: property[p].label || setting.label,
					message: property[p].message || setting.message,
					formatter: property[p].formatter || setting.formatter,
				};
			}
			this._messageOutputController.setMessageSetting(messageSetting);
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
		_messageOutputController: h5.ui.validation.MessageOutput,
		_setting: {},

		/**
		 * プラグイン設定を行う
		 * <p>
		 * baloonプラグインには以下の設定項目があります。
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
		 * <th>off</th>
		 * <td>boolean</td>
		 * <td>プラグイン無効設定。無効にする場合はtrueを指定。</td>
		 * <td>false</td>
		 * </tr>
		 * <tr>
		 * <th>message</th>
		 * <td>string</td>
		 * <td>バリデートエラー時に表示するメッセージ。メッセージの記述形式は{@link h5.ui.validation.MessageOutput.setMessage}のmessageプロパティと同じ形式です。</td>
		 * <td>デフォルトルール毎にデフォルトのメッセージが用意されており、それらが使用されます。</td>
		 * </tr>
		 * <tr>
		 * <th>formatter</th>
		 * <td>function</td>
		 * <td>バリデートエラー時に表示するメッセージフォーマッタ。フォーマッタの記述形式は{@link h5.ui.validation.MessageOutput.setMessage}のformatterプロパティと同じ形式です。</td>
		 * <td>なし</td>
		 * </tr>
		 * <tr>
		 * <th>label</th>
		 * <td>string</td>
		 * <td>バリデーション対象のプロパティに対応するラベル名</td>
		 * <td>バリデーション対象のプロパティ名</td>
		 * </tr>
		 * <tr>
		 * <th>replaceElement</th>
		 * <td>DOM|jQuery|string|function</td>
		 * <td>バルーン表示対象要素をDOM,jQuery,セレクタの何れかで指定。関数を設定した場合は第1引数にデフォルトは各プロパティのフォーム部品要素が渡され、その関数が返す要素が対象要素になります。</td>
		 * <td>各プロパティのフォーム部品要素</td>
		 * </tr>
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
		 * 各設定項目について、共通設定とプロパティ毎の設定を記述できます。以下、記述例です。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * {
		 * 	placement: 'right',
		 * 	container: 'body',
		 * 	property: { // 各プロパティ固有の設定
		 * 		userid: { // プルパティ名
		 * 			label: 'ユーザ名',
		 * 			message: '{label}は必須です'
		 * 		}
		 * 	}
		 * }
		 * </code></pre>
		 *
		 * @memberOf h5.ui.validation.ErrorBaloon
		 * @param {Object} setting bsBaloonプラグイン設定オブジェクト
		 */
		setSetting: function(setting) {
			this._setting = setting;
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
		 * @memberOf h5.ui.validation.ErrorBaloon
		 * @param {ValidationResult} result
		 */
		onValidate: function(result) {
			this._executedOnValidate = true;
		},

		/**
		 * 要素にフォーカスした時に呼ばれる
		 * <p>
		 * バリデート結果からバルーンの表示・非表示を行う
		 * </p>
		 *
		 * @memberOf h5.ui.validation.ErrorBaloon
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		onFocus: function(element, name, validationResult) {
			this._setErrorBaloon(element, name, validationResult, 'focus');
		},

		/**
		 * 要素からフォーカスが外れた時に呼ばれる
		 * <p>
		 * バリデート結果からバルーンの表示・非表示を行う
		 * </p>
		 *
		 * @memberOf h5.ui.validation.ErrorBaloon
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		onBlur: function(element, name, validationResult) {
			this._setErrorBaloon(element, name, validationResult, 'blur');
		},

		/**
		 * 要素のキーアップ時に呼ばれる
		 * <p>
		 * バリデート結果からバルーンの表示・非表示を行う
		 * </p>
		 *
		 * @memberOf h5.ui.validation.ErrorBaloon
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		onKeyup: function(element, name, validationResult) {
			this._setErrorBaloon(element, name, validationResult, 'keyup');
		},

		/**
		 * プラグインのリセット
		 * <p>
		 * 表示されているバルーンを削除します
		 * </p>
		 *
		 * @memberOf h5.ui.validation.ErrorBaloon
		 */
		reset: function() {
			this._hideBaloon();
			this._executedOnValidate = false;
		},

		/**
		 * このプラグインが出力するメッセージの追加設定
		 * <p>
		 * プロパティ毎の出力メッセージ設定オブジェクトを設定します。
		 * </p>
		 *
		 * @memberOf h5.ui.validation.ErrorBaloon
		 * @param {string} name
		 * @param {Object} messageObj message,formatterを持つオブジェクト
		 */
		setMessage: function(name, messageObj) {
			this._messageOutputController.addMessageSetting(name, messageObj);
		},

		/**
		 * バルーンをセット
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBaloon
		 * @param element
		 * @param name
		 * @param globalSetting
		 * @param setting
		 * @param {ValidationResult} validationResult
		 * @param {string} type 要素で発生したイベントタイプ
		 */
		_setErrorBaloon: function(element, name, validationResult, type) {
			if (!this._executedOnValidate) {
				// onValidateが１度も呼ばれていなければ何もしない
				return;
			}
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

			if (type === 'blur' || element !== document.activeElement) {
				// フォーカスが外れた時、該当要素にフォーカスが当たっていない場合は非表示にする
				this._hideBaloon();
				return;
			}
			var placement = propSetting.placement || DEFAULT_PLACEMENT;
			var container = propSetting.container || null;

			if ($.inArray(name, validationResult.validatingProperties) !== -1) {
				// 非同期バリデートの結果待ちの場合
				validationResult.addEventListener('validate', this.own(function(ev) {
					if (element !== document.activeElement) {
						return;
						// 非同期バリデート終了時に既にフォーカスが外れていたら何もしない
					}
					if (ev.isValid) {
						// validならバルーンを隠す
						this._hideBaloon();
						return;
					}
					// invalidならバルーン表示
					this._showBaloon(target, placement, container, this._messageOutputController
							.getMessageByValidationResult(validationResult, ev.property));
				}));
				return;
			}
			var failureReason = validationResult.failureReason
					&& validationResult.failureReason[name];
			if (!failureReason) {
				// validateエラーがないときはhideして終了
				this._hideBaloon();
				return;
			}

			// validateエラーがあるとき
			this._showBaloon(target, placement, container, this._messageOutputController
					.getMessageByValidationResult(validationResult, name));
		},

		/**
		 * バルーンを表示
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBaloon
		 * @param target
		 * @param placement
		 * @param message
		 */
		_showBaloon: function(target, placement, container, message) {
			this._hideBaloon();
			var baloonCtrl = this._baloonController;
			if (!baloonCtrl) {
				var c = h5.core.controller(this.rootElement, h5.ui.components.BaloonController);
				this.manageChild(c);
				c.readyPromise.done(this.own(function() {
					this._baloonController = c;
					this._showBaloon(target, placement, container, message);
				}));
				return;
			}
			var baloon = this._baloonController.create(message);
			// 吹き出しの表示
			baloon.show({
				target: target,
				direction: placement
			});
			this._currentBaloon = baloon;
			this._currentBaloonTarget = target;
		},

		/**
		 * バルーンを非表示
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBaloon
		 * @param target
		 * @param placement
		 * @param message
		 */
		_hideBaloon: function(target, placement, container, message) {
			if (this._currentBaloon) {
				this._currentBaloon.dispose();
				this._currentBaloon = null;
			}
			this._currentBaloonTarget = null;
		},

		/**
		 * メッセージ出力コントローラの設定
		 *
		 * @private
		 * @memberOf h5.ui.validation.ErrorBaloon
		 */
		_setChildSetting: function() {
			var setting = this._setting;

			// 各プロパティ毎のメッセージ設定をする
			var property = setting.property;
			var messageSetting = {};
			for ( var p in property) {
				messageSetting[p] = {
					label: property[p].label || setting.label,
					message: property[p].message || setting.message,
					formatter: property[p].formatter || setting.formatter,
				};
			}
			this._messageOutputController.setMessageSetting(messageSetting);
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
	 * API仕様は{@link h5.ui.validation.ErrorBaloon}と同じです。
	 * </p>
	 *
	 * @class
	 * @name h5.ui.validation.BootstrapErrorBaloon
	 */
	var controller = {
		__name: 'h5.ui.validation.BootstrapErrorBaloon',

		/**
		 * バルーンの削除
		 * <p>
		 * 表示されているバルーンを削除します
		 * </p>
		 *
		 * @memberOf h5.ui.validation.BootstrapErrorBaloon
		 */
		_hideBaloon: function() {
			// 常にバルーンは一つのみ表示している実装のため、その1つのバルーンを非表示
			$(this._currentBaloonTarget).tooltip('hide');
		},

		/**
		 * bootstrapのtooltipを使ってバルーンを表示
		 *
		 * @private
		 * @memberOf h5.ui.validation.BootstrapErrorBaloon
		 * @param target
		 * @param placement
		 * @param container
		 * @param message
		 */
		_showBaloon: function(target, placement, container, message) {
			$(target).attr({
				'data-placement': placement,
				'data-container': container,
				'data-original-title': message,
				// FIXME animationをtrueにすると、show/hide/showを同期で繰り返した時に表示されない
				// (shown.bs.tooltipイベントとか拾って制御する必要あり)
				// 一旦animationをoffにしている
				'data-animation': false
			}).tooltip({
				trigger: 'manual'
			});
			$(target).tooltip('show');
			this._currentBaloonTarget = target;
		}
	};
	// 他のメソッドやプロパティはErrorBaloonから流用
	controller = $.extend({}, h5.ui.validation.ErrorBaloon, controller);
	h5.core.expose(controller);
})();

(function() {
	/**
	 * validate時にエラーがあった時、エラーメッセージを表示するプラグイン
	 *
	 * @class
	 * @name h5.ui.validation.Message
	 */
	var controller = {
		__name: 'h5.ui.validation.Message',
		_executedOnValidate: false,
		_messageElementMap: {},
		_messageOutputController: h5.ui.validation.MessageOutput,

		/**
		 * プラグイン設定を行う
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
		 * <th>off</th>
		 * <td>boolean</td>
		 * <td>プラグイン無効設定。無効にする場合はtrueを指定。</td>
		 * <td>false</td>
		 * </tr>
		 * <tr>
		 * <th>message</th>
		 * <td>string</td>
		 * <td>バリデートエラー時に表示するメッセージ。メッセージの記述形式は{@link h5.ui.validation.MessageOutput.setMessage}のmessageプロパティと同じ形式です。</td>
		 * <td>デフォルトルール毎にデフォルトのメッセージが用意されており、それらが使用されます。</td>
		 * </tr>
		 * <tr>
		 * <th>formatter</th>
		 * <td>function</td>
		 * <td>バリデートエラー時に表示するメッセージフォーマッタ。フォーマッタの記述形式は{@link h5.ui.validation.MessageOutput.setMessage}のformatterプロパティと同じ形式です。</td>
		 * <td>なし</td>
		 * </tr>
		 * <tr>
		 * <th>label</th>
		 * <td>string</td>
		 * <td>バリデーション対象のプロパティに対応するラベル名</td>
		 * <td>バリデーション対象のプロパティ名</td>
		 * </tr>
		 * <tr>
		 * <th>replaceElement</th>
		 * <td>DOM|jQuery|string|function</td>
		 * <td>メッセージ追加対象要素をDOM,jQuery,セレクタの何れかで指定。関数を設定した場合は第1引数にデフォルトは各プロパティのフォーム部品要素が渡され、その関数が返す要素がクラス適用要素になります。</td>
		 * <td>各プロパティのフォーム部品要素</td>
		 * </tr>
		 * <tr>
		 * <th>appendMessage</th>
		 * <td>function</td>
		 * <td>メッセージ要素配置関数。メッセージ要素の配置を行う関数を指定します。第1引数にメッセージ要素(DOM)、第2引数にプロパティ名、第3引数にメッセージ追加対象要素が渡されます。指定しない場合は、メッセージ追加対象要素の後ろに追加します。</td>
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
		 * 各設定項目について、共通設定とプロパティ毎の設定を記述できます。以下、記述例です。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * {
		 * 	wrapper: '&lt;span class=&quot;error-msg&quot;&gt;',
		 * 	appendMessage: function(element, name, target) {
		 * 		$(target).closest('.wrapper').append(element);
		 * 	},
		 * 	property: { // 各プロパティ固有の設定
		 * 		userid: { // プルパティ名
		 * 			label: 'ユーザ名',
		 * 			message: '{label}は必須です'
		 * 		}
		 * 	}
		 * }
		 * </code></pre>
		 *
		 * @memberOf h5.ui.validation.Message
		 * @param {Object} setting messageプラグイン設定オブジェクト
		 */
		setSetting: function(setting) {
			this._setting = setting;
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
		 * @memberOf h5.ui.validation.Message
		 * @param {ValidationResult} result
		 */
		onValidate: function(result) {
			this._executedOnValidate = true;
			var allProperties = result.validProperties;
			for (var i = 0, l = allProperties.length; i < l; i++) {
				var name = allProperties[i];
				this._setMessage(this.parentController.getElementByName(name), name, result);
			}
		},

		/**
		 * 要素にフォーカスされた時に呼ばれる
		 * <p>
		 * バリデート結果からメッセージの表示・非表示を行う
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Message
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		onFocus: function(element, name, validationResult) {
			this._setMessage(element, name, validationResult, 'focus');
		},

		/**
		 * 要素からフォーカスが外れた時に呼ばれる
		 * <p>
		 * バリデート結果からバルーンの表示・非表示を行う
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Message
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		onBlur: function(element, name, validationResult) {
			this._setMessage(element, name, validationResult, 'blur');
		},
		// FIXME どのタイミングで実行するかは設定で決める？
		//		onChange: function(element,name, globalSetting, setting, errorReason) {
		//			this._setMessage(element,name, globalSetting, setting, errorReason);
		//		},
		//		onKeyup: function(element,name, globalSetting, setting, errorReason) {
		//			this._setMessage(element,name, globalSetting, setting, errorReason);
		//		},
		//		onClick: function(element, name,globalSetting, setting, errorReason) {
		//			this._setMessage(element, name,globalSetting, setting, errorReason);
		//		},

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
				var $target = this._messageElementMap[name];
				$target && $target.remove();
			}
			this._executedOnValidate = false;
		},

		/**
		 * このプラグインが出力するメッセージを設定する
		 * <p>
		 * プロパティ毎の出力メッセージ設定オブジェクトを設定します。
		 * </p>
		 *
		 * @memberOf h5.ui.validation.Message
		 * @param {string} name
		 * @param {Object} messageObj message,formatterを持つオブジェクト
		 */
		setMessage: function(name, messageObj) {
			this._messageOutputController.addMessageSetting(name, messageObj);
		},

		_setMessage: function(element, name, validationResult, type) {
			if (!this._executedOnValidate) {
				// onValidateが１度も呼ばれていなければ何もしない
				return;
			}
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
					if (ev.property === name && !ev.isValid
							&& (type !== 'focus' || document.activeElement === element)) {
						// nameの結果が返ってきた時にメッセージを表示
						// focus時のvalidateなら、まだfocusが当たっているときだけ表示
						this._setMessage(element, name, validationResult, type);
					}
				}));
				return;
			}

			// 既存のエラーメッセージを削除
			this._removeMessage(name);
			var msg = this._messageOutputController.getMessageByValidationResult(validationResult,
					name);
			if (msg === null) {
				// エラーメッセージが無い場合はメッセージを非表示にして、終了
				this._removeMessage(name);
				return;
			}

			var appendMessage = propSetting.appendMessage;
			var replaceElement = propSetting.replaceElement;
			var target = isFunction(replaceElement) ? replaceElement(element)
					: (replaceElement || element);

			var $errorMsg = this._messageElementMap[name];
			if (!$errorMsg) {
				// TODO タグやクラスを設定できるようにする
				$errorMsg = $('<span class="message">');
				this._messageElementMap[name] = $errorMsg;
			}
			this._messageOutputController.clearMessage($errorMsg);
			this._messageOutputController.appendMessage(msg, $errorMsg);
			if (appendMessage) {
				appendMessage($errorMsg[0], target, name);
			} else if (target) {
				// elementの後ろに追加するのがデフォルト動作
				// replaceElementで対象が変更されていればその後ろ
				$(target).after($errorMsg);
			}
		},

		_removeMessage: function(name) {
			this._messageElementMap[name] && this._messageElementMap[name].remove();
		},

		/**
		 * メッセージ出力コントローラの設定
		 *
		 * @private
		 * @memberOf h5.ui.validation.Message
		 */
		_setChildSetting: function() {
			var setting = this._setting;

			// 各プロパティ毎のメッセージ設定をする
			var property = setting.property;
			var messageSetting = {};
			for ( var p in property) {
				messageSetting[p] = {
					label: property[p].label || setting.label,
					message: property[p].message || setting.message,
					formatter: property[p].formatter || setting.formatter,
				};
			}
			this._messageOutputController.setMessageSetting(messageSetting);
		}
	};
	h5.core.expose(controller);
})();

(function() {
	/**
	 * 非同期validate時にインジケータを出すプラグイン
	 *
	 * @class
	 * @name h5.ui.validation.AsyncIndicator
	 */
	var controller = {
		__name: 'h5.ui.validation.AsyncIndicator',
		_indicators: {},

		/**
		 * プラグイン設定を行う
		 * <p>
		 * asyncIndicatorプラグインには以下の設定項目があります。
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
		 * <th>off</th>
		 * <td>boolean</td>
		 * <td>プラグイン無効設定。無効にする場合はtrueを指定。</td>
		 * <td>false</td>
		 * </tr>
		 * <tr>
		 * <th>replaceElement</th>
		 * <td>DOM|jQuery|string|function</td>
		 * <td>インジケータ表示対象要素をDOM,jQuery,セレクタの何れかで指定。関数を設定した場合は第1引数にデフォルトは各プロパティのフォーム部品要素が渡され、その関数が返す要素が対象要素になります。</td>
		 * <td>各プロパティのフォーム部品要素</td>
		 * </tr>
		 * </tbody></table>
		 * <p>
		 * 各設定項目について、共通設定とプロパティ毎の設定を記述できます。以下、記述例です。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * {
		 * 	replaceElement: function(element) {
		 * 		return $(element).prev();
		 * 	},
		 * 	property: { // 各プロパティ固有の設定
		 * 		userid: { // プルパティ名
		 * 			replaceElement: function(element) {
		 * 				return $(element).next();
		 * 			}
		 * 		}
		 * 	}
		 * }
		 * </code></pre>
		 *
		 * @memberOf h5.ui.validation.AsyncIndicator
		 * @param {Object} setting asyncIndicatorプラグイン設定オブジェクト
		 */
		setSetting: function(setting) {
			this._setting = setting;
		},

		/**
		 * バリデート時に呼ばれる
		 * <p>
		 * 非同期バリデートがある場合、該当要素に対してインジケータを表示する
		 * </p>
		 *
		 * @memberOf h5.ui.validation.AsyncIndicator
		 * @param {ValidationResult}
		 * @param {Object} globalSetting
		 * @param {Object} outputSetting
		 */
		onValidate: function(result) {
			var validatingProperties = result.validatingProperties;
			var allProperties = result.allProperties;
			for (var i = 0, l = allProperties.length; i < l; i++) {
				var name = allProperties[i];
				if ($.inArray(name, valdatingProperties)) {
					var element = this.parentController.getElementByName(name);
					this._showIndicator(element, name, validatingProperties[i]);
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
		 * @memberOf h5.ui.validation.AsyncIndicator
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		onFocus: function(element, name, validationResult) {
			var validatingProperties = result.validatingProperties;
			if ($.inArray(name, validatingProperties)) {
				var element = this.parentController.getElementByName(name);
				this._showIndicator(element, name, validatingProperties[i]);
			} else {
				this._hideIndicator(name);
			}
		},
		//		onBlur: function(element, name, globalSetting, setting, validationResult) {
		//			this._showIndicator(validationResult, name, globalSetting, setting);
		//		},
		// FIXME どのタイミングで実行するかは設定で決める？
		//		onChange: function(element, name, globalSetting, setting, validationResult) {
		//			this._showIndicator(validationResult, name, globalSetting, setting);
		//		},

		/**
		 * 要素でキーアップされた時に呼ばれる
		 * <p>
		 * 非同期バリデートがある場合、該当要素に対してインジケータを表示する
		 * </p>
		 *
		 * @memberOf h5.ui.validation.AsyncIndicator
		 * @param element
		 * @param name
		 * @param {ValidationResult} validationResult
		 */
		onKeyup: function(element, name, validationResult) {
			if ($.inArray(name, validationResult.validatingProperties) !== -1) {
				// バリデート中ならインジケータ表示
				this._showIndicator(element, name, validationResult);
			}
		},
		//		onClick: function(element, name,globalSetting, setting, errorReason) {
		//			this._setMessage(element, name,globalSetting, setting, errorReason);
		//		},

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
			this._executedOnValidate = false;
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
				if (name === ev.property) {
					this._hideIndicator(ev.property);
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
	var DATA_INPUTGROUP_CONTAINER = 'h5-input-group-name-container';
	var DATA_INPUTGROUP = 'h5-input-group-name';

	// プラグインに通知するイベント
	var PLUGIN_EVENT_VALIDATE = 'onValidate';
	var PLUGIN_EVENT_FOCUS = 'onFocus';
	var PLUGIN_EVENT_BLUR = 'onBlur';
	var PLUGIN_EVENT_CHANGE = 'onChange';
	var PLUGIN_EVENT_KEYUP = 'onKeyup';
	var PLUGIN_EVENT_CLICK = 'onClick';

	// デフォルトで用意しているプラグイン名とプラグイン(コントローラ定義)のマップ
	var DEFAULT_PLUGINS = {
		style: h5.ui.validation.Style,
		composition: h5.ui.validation.Composition,
		baloon: h5.ui.validation.ErrorBaloon,
		bsBaloon: h5.ui.validation.BootstrapErrorBaloon,
		message: h5.ui.validation.Message,
		asyncIndicator: h5.ui.validation.AsyncIndicator
	};

	// プラグインの表示リセットメui.validation.BootstrapErrorBaloonソッド名
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
		_plugins: [],

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
		 * 第1引数には設定オブジェクトを指定します。設定オブジェクトは、以下のようなオブジェクトを指定してください
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * {
		 * 	output: { // 各プラグインの設定
		 * 		baloon: {
		 * 			placement: 'top'
		 * 		},
		 * 		message: {...},
		 * 		...
		 * 	},
		 * 	property: { // 各プロパティ毎の設定
		 * 		name: {
		 * 			label: '名前',
		 * 			message: '必須です', // nameのエラーメッセージ
		 * 			output: { // 各プロパティについて各プラグインの設定
		 * 				baloon: {
		 * 					message: '※{label}は必須です',
		 * 					placement: 'left' // nameのbaloonはleftに表示
		 * 				}
		 * 			}
		 * 		}
		 * 	}
		 * }
		 * </code></pre>
		 *
		 * <p>
		 * 各プラグインの設定については各プラグインのsetSettingのドキュメントを参照してください
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {Object} setting 設定オブジェクト
		 */
		setSetting: function(setting) {
			this._setting = setting;
			// 現在有効なプラグインの設定を取り出して設定する
			var currentPlugins = this._plugins;
			for ( var pluginName in currentPlugins) {
				var plugin = currentPlugins[pluginName];
				plugin.setSetting && plugin.setSetting(this._margePluginSettings(pluginName));
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
				pluginSetting.property[prop] = $.extend({}, propSetting, propertyPluginOutput)
			}
			return pluginSetting;
		},

		/**
		 * 出力設定
		 * <p>
		 * 各プロパティ毎、各プラグイン毎の出力設定。このプロパティに設定オブジェクトを指定してください。
		 * </p>
		 * <p>
		 * プロパティ名をキーにして設定を記述します。プラグインの設定は[globalSetting]{@link h5.ui.FormController.globalSetting}に適用された値が使用されますが、プロパティ毎に設定したい項目がある場合は、プロパティ毎の設定オブジェクトにプラグイン名をキーにプラグイン設定を記述してください。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * formController.outputSetting = {
		 * 	// プロパティ名をキーにして、プロパティ毎のメッセージ定義を記述
		 * 	userid: {
		 * 		label: 'ユーザID', // ラベル名
		 * 		message: '{label}がルール{rule}に違反しています。', // メッセージ
		 * 		baloon:{
		 * 			// プラグイン名をキーにしてプロパティ毎・プラグイン毎の設定を記述
		 * 			placement: 'left'
		 * 		}
		 * 	},
		 * 	address: {...}
		 * };
		 * </code></pre>
		 *
		 * @memberOf h5.ui.FormController
		 * @type {Object}
		 */
		outputSetting: {},

		/**
		 * @memberOf h5.ui.FormController
		 * @private
		 */
		__construct: function() {
			// デフォルトルールの追加
			// TODO formのvalidatorで不要な項目は要らない
			this._addRuleCreator(DATA_RULE_REQUIRED, defaultRuleCreators.requireRuleCreator);
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
		},

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
			// フォーム部品からルールを生成
			var $formControls = $(this.getElements());
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

		/**
		 * プラグインの有効化
		 * <p>
		 * フォームのバリデート時にバリデート結果を出力するプラグインを有効にします。以下のようなプラグインが用意されています。
		 * </p>
		 * <table><thead>
		 * <tr>
		 * <th>プラグイン名</tr>
		 * <th>説明</th>
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
		 * <td>baloon</td>
		 * <td>バリデート時にバリデート失敗した項目についてバルーンメッセージを表示する</td>
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
		enableOutput: function(pluginNames) {
			// デフォルトの出力プラグイン追加
			// __init前(rootElement決定前)ならルートエレメント決定後に実行
			if (!this.isInit) {
				this.initPromise.done(this.own(function() {
					this.enableOutput(pluginNames);
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
		 * <p>
		 * バリデートルールを追加する。第1引数にはルールオブジェクトを指定します。ルールオブジェクトについては{@link Validator.addRule}と同じ形式で指定してください。
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {Object} ruleObj ルールオブジェクト(オブジェクトの形式は{@link Validator.addRule}参照)
		 */
		addRule: function(ruleObj) {
			this._validationLogic.addRule(ruleObj);
		},

		/**
		 * ルールの削除
		 * <p>
		 * 第1引数に指定されたプロパティについてのバリデートルールを削除します
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string|string[]} properties プロパティ名またはその配列
		 * @param {boolean} shouldValidate ルール削除した後にvalidateを行うかどうか
		 * @param {boolean} [onlyRemovedRule=true]
		 *            shouldValidate=trueの場合に、追加されたルールのプロパティのみvalidateを行う場合はtrue
		 */
		removeRule: function(properties, shouldValidate, onlyRemovedRule) {
			this._validationLogic.removeRule();
			if (shouldValidate) {
				this.validate(onlyRemovedRule ? properties : null);
			}
		},

		/**
		 * ルールの有効化
		 * <p>
		 * 第1引数に指定されたプロパティについてのバリデートを無効化します
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string|string[]} name プロパティ名またはその配列
		 */
		enableRule: function(name) {
			this._validationLogic.enableRule(name);
		},

		/**
		 * ルールの無効化
		 * <p>
		 * 第1引数に指定されたプロパティについてのバリデートを無効化します
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string|string[]} name プロパティ名またはその配列
		 */
		disableRule: function(name) {
			this._validationLogic.disableRule(name);
		},

		/**
		 * このコントローラが管理するフォーム内のフォーム部品の値を集約したオブジェクトを生成する
		 * <p>
		 * フォーム部品を集約し、各部品の名前(name属性値)をキーに、その値を持つオブジェクトを返します。
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
		 * &lt;!-- data-h5-input-group-nameにグループ名を指定。子要素がそのグループになる。 --&gt;
		 * lt;div data-h5-input-group-name=&quot;birthday&quot;&gt;
		 * 		&lt;label class=&quot;control-label&quot;&gt;生年月日&lt;/label&gt;
		 * 		&lt;input name=&quot;year&quot; type=&quot;text&quot; placeholder=&quot;年&quot;&gt;
		 * 		&lt;input name=&quot;month&quot; type=&quot;text&quot; placeholder=&quot;月&quot;&gt;
		 * 		&lt;input name=&quot;day&quot; type=&quot;text&quot; placeholder=&quot;日&quot;&gt;
		 * 		&lt;/div&gt;
		 * </code></pre>
		 * <pre class="sh_html"><code>
		 * 		&lt;!-- data-h5-input-group-nameにグループ名を指定。同じグループ名の要素がそのグループになる --&gt;
		 * 		&lt;input name=&quot;zip1&quot; data-h5-input-group-name=&quot;zipcode&quot;/&gt;
		 * 		&lt;input name=&quot;zip2&quot; data-h5-input-group-name=&quot;zipcode&quot;/&gt;
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
		 * @param {string|string[]} targetNames 指定した場合、指定したnameのものだけを集約
		 * @returns {Object} フォーム部品集約オブジェクト
		 */
		gather: function(targetNames) {
			targetNames = targetNames && (!isArray(targetNames) ? [targetNames] : targetNames);
			var $elements = $(this.getElements());
			var $groups = $(this._getInputGroupElements());
			var propertySetting = this._setting && this._setting.property || {};
			var ret = {};
			var elementNames = [];
			$elements.each(function() {
				var name = this.name;
				elementNames.push(name);
				var currentGroup = ret;
				// タグに指定されているグループ名をグループコンテナより優先
				var groupName = $(this).data(DATA_INPUTGROUP);
				if (!groupName && $groups.find(this).length) {
					// タグにグループの指定が無くグループコンテナに属している場合
					var $group = $(this).closest('[data-' + DATA_INPUTGROUP_CONTAINER + ']');
					var groupName = $group.data(DATA_INPUTGROUP_CONTAINER);
				}
				if (groupName) {
					elementNames.push(groupName);
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
				var valueFunc = propertySetting[name] && propertySetting[name].valueFunc;
				var value = valueFunc ? valueFunc(this.rootElement, name) : $(this).val();
				if (valueFunc && value === undefined || value == null) {
					// valueFuncがundefinedを返した場合またはvalueがnullだった場合はそのプロパティは含めない
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

			// セッティングに記述されているがinput要素の集約で集められないプロパティを追加
			var otherProperties = [];
			for ( var p in propertySetting) {
				if ((!targetNames || $.inArray(p, targetNames) !== -1)
						&& $.inArray(p, elementNames) === -1) {
					var valueFunc = propertySetting[p] && propertySetting[p].valueFunc;
					var val = valueFunc && valueFunc(this.rootElement, p);
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
		set: function(obj) {
			var $elements = $(this.getElements());
			var indexMap = {};
			// グループ指定でプロパティが入れ子であるオブジェクトの場合、展開する
			var flatObj = {};
			for ( var p in obj) {
				if ($.isPlainObject(obj[p])) {
					for ( var prop in obj[p]) {
						flatObj[prop] = obj[p][prop];
					}
				} else {
					flatObj[prop] = obj[p];
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
		clearAll: function() {
			$(this.getElements()).each(function() {
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
			this._waitingValidationResultMap = {};
			var plugins = this._plugins;
			for ( var pluginName in plugins) {
				this._resetPlugin(pluginName, plugins[pluginName]);
			}
		},

		/**
		 * フォームに入力された値のバリデートを行う
		 * <p>
		 * 第1引数にプロパティ名またはその配列を指定した場合、指定されたプロパティ名のみをバリデート対象にします。省略した場合は全てが対象になります。
		 * </p>
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string|string[]} names バリデート対象のプロパティ名またはプロパティ名の配列
		 */
		validate: function(names) {
			// バリデート実行
			var result = this._validate(names);

			// onValidateの呼び出し
			this._callPluginValidateEvent(PLUGIN_EVENT_VALIDATE, result);
			return result;
		},

		/**
		 * このコントローラが管理するフォームに属するフォーム部品全てを取得
		 *
		 * @memberOf h5.ui.FormController
		 * @returns {DOM[]}
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
			return $formControls.filter(
					function() {
						var $this = $(this);
						var formAttr = $this.attr('form');
						// form属性がこのコントローラのフォームを指している
						// または、このコントローラのフォーム内の要素でかつform属性指定無し
						return (formAttr && formAttr === formId) || !formAttr
								&& $innerFormControls.index($this) !== -1;
					}).toArray();
		},

		/**
		 * このコントローラが管理するフォームに属するフォーム部品またはフォーム部品グループ要素の中で指定した名前に一致する要素を取得
		 *
		 * @memberOf h5.ui.FormController
		 * @param {string} name
		 * @returns {DOM}
		 */
		getElementByName: function(name) {
			// このメソッドはプラグインがvalidate結果から対応するエレメントを探す時に呼び出される
			var targetElement = this._setting.property && this._setting.property[name]
					&& this._setting.property[name].targetElement;
			if (targetElement) {
				return targetElement;
			}
			var $formCtrls = $(this.getElements());
			var element = $formCtrls.filter('[name="' + name + '"]')[0];
			if (element) {
				return element;
			}
			var groupContainer = $(this._getInputGroupElements()).filter(
					'[data-' + DATA_INPUTGROUP_CONTAINER + '="' + name + '"]')[0];
			if (groupContainer) {
				return groupContainer;
			}
			// data-h5-input-group-name指定で作成されたグループの場合は一意に決まらないため、nullを返している
			return null;

			//			var $groupElements = $formCtrls.filter(function() {
			//				var $this = $(this);
			//				return $this.data(DATA_INPUTGROUP) === name;
			//			});
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

		/*
		 * フォーム部品でのイベント発生時にプラグインを呼び出すイベントハンドラ設定
		 */
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
		 * このコントローラが管理するフォームに属するグループコンテナ要素(data-group-containerが指定されている要素)を取得
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
			plugin[PLUGIN_METHOD_RESET].call(plugin, this.globalSetting[pluginName],
					this.outputSetting);
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
			var c = h5.core.controller(this._bindedForm || this.rootElement, controller, {
				setting: this._margePluginSettings(pluginName)
			});
			this.manageChild(c);
			this._plugins[pluginName] = c;
		},

		/**
		 * フォームのバリデートを行う
		 *
		 * @private
		 * @memberOf h5.ui.FormController
		 * @param names
		 * @returns {ValidationResult}
		 */
		_validate: function(names) {
			var formData = this.gather(names);

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

			var result = this._validationLogic.validate(formData, names);

			// TODO 動作確認としてログ出力
			this.log.debug('-----------------------------------------');
			this.log.debug('・validateするデータ');
			this.log.debug(formData);
			this.log.debug('・validate対象のプロパティ:' + names);
			this.log.debug('・validate結果');
			this.log.debug(result);
			this.log.debug(result.isAsync ? '非同期' : '同期');
			this.log.debug('-----------------------------------------');

			if (result.isAsync) {
				var properties = result.validatingProperties;
				for (var i = 0, l = properties.length; i < l; i++) {
					var p = properties[i];
					this._waitingValidationResultMap[p] = result;
				}
				result.addEventListener('validate', this.own(function(ev) {
					delete this._waitingValidationResultMap[ev.property];
				}));
			}

			return result;
		},

		/**
		 * @private
		 * @memberOf h5.ui.FormController
		 */
		_createPluginElementEventArgs: function(element, validationResult) {
			var name = element.name;
		},

		/**
		 * @private
		 * @memberOf h5.ui.FormController
		 */
		_pluginElementEventHandler: function(ctx, eventType) {
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
				var $groups = $(this._getInputGroupElements());
				if ($groups.find(target).length) {
					var $group = $(target).closest('[data-' + DATA_INPUTGROUP_CONTAINER + ']');
					groupName = $group.data(DATA_INPUTGROUP_CONTAINER);
				}
			}
			var validateTargetName = groupName || name;
			var validationResult = this._validate(validateTargetName);
			this._callPluginElementEvent(eventType, target, name, validationResult);
			if (groupName) {
				// グループがあればグループについてのバリデート結果も通知
				// グループコンテナではなく各inputにdata-h5-input-group-nameが指定されているような場合は、
				// グループ名から特定の要素を指定できないのでプラグインに要素を渡すことができない
				// (要素が渡されなかった時にプラグインがどうするかはプラグインの実装次第)
				var groupTarget = this.getElementByName(groupName);
				this._callPluginElementEvent(eventType, groupTarget, groupName, validationResult);
			}
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
			var globalSetting = this.globalSetting;
			var outputSetting = this.outputSetting;
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
		 * @private
		 * @memberOf h5.ui.FormController
		 */
		_isFormControls: function(element) {
			var $formControls = $(this.getElements());
			return $formControls.index(element) !== -1;
		}
	};
	h5.core.expose(controller);
})();
