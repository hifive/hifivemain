/*
 * Copyright (C) 2014-2015 NS Solutions Corporation
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

/* ------ h5.scene ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	/**
	 * コントローラーバインド用データ属性名
	 */
	var DATA_H5_CONTROLLER = 'data-h5-controller';

	/**
	 * バインド済みコントローラー設定用データ属性名
	 */
	var DATA_H5_DYN_CONTROLLER_BOUND = 'data-h5-dyn-controller-bound';

	/**
	 * デフォルトシーン指定用データ属性名
	 */
	var DATA_H5_DEFAULT_SCENE = 'data-h5-default-scene';

	/**
	 * シーン指定用データ属性名
	 */
	var DATA_H5_SCENE = 'data-h5-scene';

	/**
	 * シーンコンテナ指定用データ属性名
	 */
	var DATA_H5_CONTAINER = 'data-h5-scene-container';

	/**
	 * メインシーンコンテナ指定用データ属性名
	 */
	var DATA_H5_MAIN_CONTAINER = 'data-h5-main-scene-container';

	/**
	 * コンテナ生成済み識別用データ属性名
	 */
	var DATA_H5_DYN_CONTAINER_BOUND = 'data-h5-dyn-container-bound';

	/**
	 * BODY要素のダミーDIV識別用データー属性名
	 */
	var DATA_H5_DYN_DUMMY_BODY = 'data-h5-dyn-dummy-body';

	/**
	 * シーンコンテナに対するシーンの変更要求イベント名
	 */
	var EVENT_SCENE_CHANGE_REQUEST = 'sceneChangeRequest';

	/**
	 * シーン間パラメーター用デフォルトプレフィクス
	 */
	var DEFAULT_CLIENT_QUERY_STRING_PREFIX = '_c_';

	/**
	 * シーン間パラメーター用デフォルトプレフィクス(FW用)
	 */
	var DEFAULT_CLIENT_FW_QUERY_STRING_PREFIX = '_h5_';

	/**
	 * シリアライズプレフィクス
	 */
	var SERIALIZE_PREFIX = '2|';


	/** シーンコンテナのタイトルデータ属性 */
	var DATA_SCENE_TITLE = 'title';

	/** シーンコントローラのシーンタイトル定義プロパティ */
	var CONTROLLER_SCENE_TITLE = 'sceneTitle';

	/**
	 * シーン遷移タイプ
	 */
	var NAVIGATION_TYPE = {
		NORMAL: 'normal',
		ONCE: 'once',
		SILENT: 'silent'
	};

	/**
	 * Ajaxメソッド
	 */
	var METHOD = {
		GET: 'get',
		POST: 'post'
	};

	/**
	 * Router 遷移先URL最大長
	 * <p>
	 * URL全体がこの値を超えた場合、開発字はエラー、運用時は警告ログを出力。 IEで2084の場合があり、これ以下で、ある程度のバッファを取った。
	 * </p>
	 */
	var URL_MAX_LENGTH = 1800;

	/**
	 * 再表示不可画面用メッセージ
	 */
	var NOT_RESHOWABLE_MESSAGE = 'この画面は再表示できません。';

	/**
	 * メインシーンコンテナのURL履歴保持方法列挙体
	 * <p>
	 * メインシーンコンテナURL履歴保持方法です。何れかをh5.settings.scene.urlHistoryModeに指定します。
	 * </p>
	 * <dl>
	 * <dt>h5.scene.urlHistoryMode.HASH</dt>
	 * <dd>"hash" … シーン遷移パラメーターをハッシュに格納する。</dd>
	 * <dt>h5.scene.urlHistoryMode.NONE</dt>
	 * <dd>"none" … URLを変更しない。</dd>
	 * <dt>h5.scene.urlHistoryMode.FULLRELOAD</dt>
	 * <dd>"fullreload" … Ajaxを使用せず、ページ全体を再読み込みする(通常の遷移)。</dd>
	 * <dt>h5.scene.urlHistoryMode.HISTORY</dt>
	 * <dd>"history"(デフォルト) … HTML5 History APIを使用してURLを変更する。History APIが使用できない場合はハッシュを使用する。</dd>
	 * <dt>h5.scene.urlHistoryMode.HISTORY_OR_HASH</dt>
	 * <dd>"historyOrHash" … "history"と同義。</dd>
	 * <dt>h5.scene.urlHistoryMode.HISTORY_OR_ERROR</dt>
	 * <dd>"historyOrError" … HTML5 History APIを使用してURLを変更する。History APIが使用できない場合はエラーとする。</dd>
	 * <dt>h5.scene.urlHistoryMode.HISTORY_OR_NONE</dt>
	 * <dd>"historyOrNone" … HTML5 History APIを使用してURLを変更する。History APIが使用できない場合はURLを変更せずに遷移する。</dd>
	 * <dt>h5.scene.urlHistoryMode.HISTORY_OR_FULLRELOAD</dt>
	 * <dd>"historyOrFullreload" … HTML5 History APIを使用してURLを変更する。History
	 * APIが使用できない場合はAjaxを使用せずに遷移する(通常遷移)。</dd>
	 * </dl>
	 *
	 * @memberOf h5.scene
	 * @name urlHistoryMode
	 */
	var URL_HISTORY_MODE = {
		HASH: 'hash',
		HISTORY: 'history',
		NONE: 'none',
		FULLRELOAD: 'fullreload',
		HISTORY_OR_HASH: 'historyOrHash',
		HISTORY_OR_ERROR: 'historyOrError',
		HISTORY_OR_NONE: 'historyOrNone',
		HISTORY_OR_FULLRELOAD: 'historyOrFullreload'
	};

	/**
	 * Router URL履歴保持方法(判定後)
	 */
	var URL_HISTORY_ACTUAL_MODE = {
		HASH: 'hash',
		HISTORY: 'history',
		NONE: 'none',
		FULLRELOAD: 'fullreload'
	};

	/**
	 * Router navigate動作モード指定
	 */
	var URL_HISTORY_MODE_ON_NAVIGATE = {
		NONE: 'none',
		FULLRELOAD: 'fullreload',
		SILENT: 'silent'
	};

	// =============================
	// Production
	// =============================

	var REMOTE_METHOD_INVOCATION = '__h5__RMI';

	var REMOTE_METHOD_INVOCATION_RESULT = '__h5__RMI_Result';

	// エラーコード
	/** エラーコード: scan関数の対象要素が単一でない */
	var ERR_CODE_SCAN_MULTIPLE_ELEMENT = 100000;
	/** エラーコード: コンテナ生成時にカレントとなるシーン要素が見つからない */
	var ERR_CODE_CURRENT_SCENE_NOT_FOUND = 100001;
	/** エラーコード: ロードしたHTML内に指定のコンテナが存在しない */
	var ERR_CODE_TARGET_CONTAINER_NOT_FOUND = 100002;
	/** エラーコード: メインシーンコンテナを複数生成しようとした */
	var ERR_CODE_MAIN_CONTAINER_ALREADY_CREATED = 100003;
	/** エラーコード: シーン遷移先に文字列以外を指定した */
	var ERR_CODE_CHANGE_SCENE_TO_IS_NOT_STRING = 100004;
	/** エラーコード: シーン遷移先にハッシュを指定した */
	var ERR_CODE_CHANGE_SCENE_HASH_IN_TO = 100005;
	/** エラーコード: メインシーンコンテナの遷移先にコントローラーを指定した(暫定対応) */
	var ERR_CODE_MAIN_CHANGE_SCENE_TO_IS_CONTROLLER = 100006;
	/** エラーコード: シーンコンテナ生成済みの要素でシーンコンテナを作成しようとした */
	var ERR_CODE_CONTAINER_ALREADY_CREATED = 100007;
	/** エラーコード: シーン遷移先HTMLのロードに失敗した */
	var ERR_CODE_HTML_LOAD_FAILED = 100008;
	/** コンテナ生成済みマークがあるにも関わらず所定のコントローラーがバインドされていない */
	var ERR_CODE_CONTAINER_CONTROLLER_NOT_FOUND = 100009;
	/** 遷移先URLが設定された最大長を超過した */
	var ERR_CODE_URL_LENGTH_OVER = 100010;
	/** RouterでHistoryAPIが使えないためエラー */
	var ERR_CODE_HISTORY_API_NOT_AVAILABLE = 100011;
	/** RouterでURL履歴保持方法指定が不正 */
	var ERR_CODE_URL_HISTORY_MODE_INVALID = 100012;

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.scene');

	/* del begin */
	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_SCAN_MULTIPLE_ELEMENT] = 'h5.scene.scan() の第1引数に複数要素は指定できません。単一要素で指定してください。';
	errMsgMap[ERR_CODE_CURRENT_SCENE_NOT_FOUND] = 'カレントとなるシーン要素が見つかりません。';
	errMsgMap[ERR_CODE_TARGET_CONTAINER_NOT_FOUND] = 'ロードしたHTMLに、指定されたコンテナ要素が見つかりません。to:{0} container:{1}';
	errMsgMap[ERR_CODE_MAIN_CONTAINER_ALREADY_CREATED] = 'メインシーンコンテナはすでに生成されているため、生成できません。';
	errMsgMap[ERR_CODE_CHANGE_SCENE_TO_IS_NOT_STRING] = 'シーン遷移先は文字列で指定してください。to:{0}';
	errMsgMap[ERR_CODE_CHANGE_SCENE_HASH_IN_TO] = 'シーン遷移先にハッシュは指定できません。to:{0}';
	errMsgMap[ERR_CODE_MAIN_CHANGE_SCENE_TO_IS_CONTROLLER] = '現在、メインシーンコンテナのシーン遷移先にコントローラーは指定できません。to:{0}';
	errMsgMap[ERR_CODE_CONTAINER_ALREADY_CREATED] = '対象要素ですでにシーンコンテナが生成されているため、生成できません。';
	errMsgMap[ERR_CODE_HTML_LOAD_FAILED] = 'シーン遷移先HTMLのロードに失敗しました。to:{0}';
	errMsgMap[ERR_CODE_CONTAINER_CONTROLLER_NOT_FOUND] = '要素にコンテナ生成済みマークがあるにも関わらず所定のコントローラーがバインドされていません。';
	errMsgMap[ERR_CODE_URL_LENGTH_OVER] = '遷移先URLが設定された最大長を超過しました。長さ:{0} 最大長:{1}';
	errMsgMap[ERR_CODE_HISTORY_API_NOT_AVAILABLE] = 'HistoryAPIが使用できない環境では処理できない設定になっています。';
	errMsgMap[ERR_CODE_URL_HISTORY_MODE_INVALID] = 'RouterのURL履歴保持方法指定が不正です。urlHistoryMode:{0}';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);
	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	var isDisposing = h5internal.core.isDisposing;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	/**
	 * シーン機能初回適用判定フラグ
	 */
	var isInited = false;

	/**
	 * シーン間パラメーター用デフォルトプレフィクス
	 */
	var clientQueryStringPrefix = DEFAULT_CLIENT_QUERY_STRING_PREFIX;

	/**
	 * FW用シーン間パラメーター用デフォルトプレフィクス
	 */
	var clientFWQueryStringPrefix = DEFAULT_CLIENT_FW_QUERY_STRING_PREFIX;

	/**
	 * シーン間パラメーター用デフォルトプレフィクス正規表現用文字列
	 */
	var clientQueryStringPrefixForRegExp = null;

	/**
	 * FW用シーン間パラメーター用デフォルトプレフィクス正規表現用文字列
	 */
	var clientFWQueryStringPrefixForRegExp = null

	/**
	 * Router URL履歴保持方法指定
	 */
	var urlHistoryMode = URL_HISTORY_MODE.HISTORY;

	/**
	 * Router URL履歴保持方法(判定後)
	 */
	var urlHistoryActualMode = null;

	/**
	 * URL分割用正規表現
	 */
	var locationRegExp = /^(?:(\w+:)?\/\/(([^\/:]+)(?::(\d+))?))?((\/?.*?)([^\/]*?))(\?.*?)?(#.*)?$/;

	/**
	 * navigateの遷移先指定がコントローラーか否かを判断する正規表現
	 */
	var controllerRegexp = /Controller$/;

	/**
	 * メインシーンコンテナのシーン遷移先URLの最大長
	 */
	var urlMaxLength = null;

	/**
	 * 再表示不可画面URL/コントローラー
	 */
	var notReshowable = null;

	/**
	 * 再表示不可画面用メッセージ
	 */
	var notReshowableMessage = NOT_RESHOWABLE_MESSAGE;

	/**
	 * ベースURL
	 */
	var baseUrl = null;

	/**
	 * Routerインスタンス
	 */
	var router = null;

	// =============================
	// Functions
	// =============================
	/**
	 * デフォルトシーンのシーンコントローラを取得する。
	 *
	 * @private
	 * @returns controller
	 */
	function getDefaultSceneController() {
		var bodyController = h5.core.controllerManager.getControllers(document.body)[0];

		return bodyController;
	}

	/**
	 * 対象要素配下のすべての要素にバインドされているコントローラーをdispseします。
	 *
	 * @private
	 * @param element 対象要素
	 */
	function disposeAllControllers(element) {
		var controllers = h5.core.controllerManager.getControllers(element, {
			deep: true
		});
		for (var i = 0, len = controllers.length; i < len; i++) {
			if (!isDisposing(controllers[i])) {
				controllers[i].dispose();
			}
		}
	}

	/**
	 * ルート要素自身も対象として走査します。
	 *
	 * @private
	 * @param target
	 * @param expr
	 * @returns {jQuery}
	 */
	function findWithSelf(target, expr) {
		var self = $(target).filter(expr);
		var children = $(target).find(expr);
		if (self.length === 0) {
			return children;
		} else if (children.length === 0) {
			return self;
		}
		self = $.makeArray(self);
		children = $.makeArray(children);
		return $(self.concat(children));
	}

	/**
	 * data-h5-default-sceneでdata-h5-controller指定がない場合用のダミーコントローラー
	 */
	var DummyController = {
		__name: 'h5.scene.DummyController'
	};

	/**
	 * 要素がシーン属性を持っているかをチェックします
	 *
	 * @private
	 * @param target
	 * @returns {Boolean}
	 */
	function isScene(target) {
		return $(target).is('[' + DATA_H5_DEFAULT_SCENE + '],[' + DATA_H5_SCENE + ']');
	}

	/**
	 * 要素の上方直近のシーン要素を取得します
	 *
	 * @private
	 * @param target
	 * @returns {Element}
	 */
	function getParentScene(target) {
		var parentScene = $(target).closest(
				'[' + DATA_H5_DEFAULT_SCENE + '],[' + DATA_H5_SCENE + ']');
		return parentScene.length ? parentScene.get(0) : null;
	}

	/**
	 * 要素がコンテナ属性を持っているかをチェックします
	 * <p>
	 * body、mainタグがメインシーンコンテナの場合、事前にDATA_H5_MAIN_CONTAINERが付与されている前提
	 * </p>
	 *
	 * @private
	 * @param target
	 * @returns {Boolean}
	 */
	function isContainer(target) {
		return $(target).is('[' + DATA_H5_MAIN_CONTAINER + '],[' + DATA_H5_CONTAINER + ']');
	}

	/**
	 * 要素の上方直近のコンテナ要素を取得します
	 *
	 * @private
	 * @param target
	 * @returns {Element}
	 */
	function getParentContainer(target) {
		var parentContainer = $(target).closest(
				'[' + DATA_H5_MAIN_CONTAINER + '],[' + DATA_H5_CONTAINER + ']');
		return parentContainer.length ? parentContainer.get(0) : null;
	}

	/**
	 * 対象要素が指定シーン要素の直属であるかをチェックします
	 * <p>
	 * コンテナ化前の要素も存在するため、シーン属性のチェックのみでは判定できない
	 * </p>
	 *
	 * @private
	 * @param target
	 * @param scene
	 * @returns {Boolean}
	 */
	function checkScene(target, scene) {

		// TODO(鈴木) 同一ならtrue(両方nullは想定していない)
		if (target === scene)
			return true;

		// TODO(鈴木) 対象要素上方直近のコンテナ要素
		var targetContainer = getParentContainer(target);

		// TODO(鈴木) 指定シーン要素のコンテナ要素。指定シーン要素がない場合はnull。
		var container = scene ? getParentContainer(scene) : null;

		// TODO(鈴木) コンテナ要素が一致しない場合はfalse
		if (targetContainer !== container) {
			return false;
		}

		// TODO(鈴木) 対象要素上方直近のシーン要素が、指定シーン要素に一致すればtrue、そうでなければfalse
		return getParentScene(target) === scene;
	}

	/**
	 * 対象要素を配下を含めて走査し、DATA属性に基づいてコントローラーをバインド、およびシーンコンテナを生成します。
	 * <p>
	 * DATA属性については以下を参照してください。<br/>
	 * </p>
	 * <ul>
	 * <li><a href="/conts/web/view/reference/scene-spec">リファレンス（仕様詳細)&gt;&gt;画面遷移制御・履歴管理(シーン機能)仕様
	 * [ver.1.2]</a>
	 * <ul>
	 * <li><a
	 * href="/conts/web/view/reference/scene-spec#HHTML306E8A188FF0306B57FA30653044305F81EA52D5751F6210">HTMLの記述に基づいた自動生成</a></li>
	 * <li><a
	 * href="/conts/web/view/reference/scene-spec#HHTML89817D20306E8A188FF0306B57FA30653044305F30B330F330C830ED30FC30E9306E81EA52D530D030A430F330C9">
	 * HTML要素の記述に基づいたコントローラの自動バインド</a></li>
	 * </ul>
	 * </li>
	 * </ul>
	 * <p>
	 * 対象要素がシーンであり、かつコントローラーがバインドされていない場合にPromiseオブジェクトを返却します。
	 * その場合、コントローラーがロード・バインドされたタイミングでresolveが実行されます。 シーンに対応するコントローラーを取得したい場合に利用してください。
	 * </p>
	 * <p>
	 * シーンコンテナ要素配下は、デフォルトで表示されるシーン配下のみを対象とします。(現版ではシーンコンテナの複数シーンは未対応)
	 * このため、シーンコンテナ直下でないシーン要素は、シーンコンテナに所属していないとみなされ、その配下は処理対象とならないので注意が必要です。
	 * </p>
	 * <p>
	 * シーンコンテナ生成済み要素配下は走査対象となりません。追加要素を対象としたい場合ははその部分を指定するようにしてください。
	 * </p>
	 *
	 * @private
	 * @param {Element} [rootElement=document.body] 走査処理対象のルート要素。指定なしの場合はdocument.bodyをルート要素とします。
	 * @param {String} [controllerName]
	 *            バインド対象コントローラー名。指定なしの場合は'data-h5-controller'属性に指定されたすべてのコントローラーを対象とします。
	 * @param {Any} [args] 走査対象のルート要素がコンテナの場合、デフォルトで表示されるシーンコントローラー生成時に渡される引数を設定します。
	 * @returns {Promise} Promiseオブジェクト。詳細については当関数の説明を参照してください。
	 */
	function scan(rootElement, controllerName, args) {

		// TODO(鈴木) デフォルトをBODYにする実装を有効化
		var root = rootElement ? rootElement : document.body;

		var $root = $(root);

		if ($root.length === 0) {
			return;
		}

		// TODO(鈴木) 対象要素は一つに限定
		if ($root.length !== 1) {
			throwFwError(ERR_CODE_SCAN_MULTIPLE_ELEMENT);
		}

		// TODO(鈴木) メインシーンコンテナができていない場合のみ実行。
		// この時点でメインシーンコンテナにはdata-h5-main-scene-container属性があるようにする。
		if (!mainContainer) {
			var main = findWithSelf(root, '[' + DATA_H5_MAIN_CONTAINER + ']');
			if (main.length === 0) {
				main = findWithSelf(root, 'main');
				if (main.length === 0 && root === document.body) {
					main = $(root);
				}
				if (main.length > 0) {
					main.eq(0).attr(DATA_H5_MAIN_CONTAINER, DATA_H5_MAIN_CONTAINER);
				}
			}
		}

		// TODO(鈴木) rootElementがシーンコンテナの場合
		// この場合promiseは返さない
		// createSceneContainer→scanForContainer→scanとなり再帰になる
		if ($root.is('[' + DATA_H5_CONTAINER + ']')) {
			createSceneContainer(root);
			return;
		} else if ($root.is('[' + DATA_H5_MAIN_CONTAINER + ']')) {
			createSceneContainer(root, true);
			return;
		}

		// TODO(鈴木) 以下、rootElementがシーンコンテナでない場合

		// TODO(鈴木) シーンコントローラーをresolveで返却すべきか否か
		// scanがシーン要素を対象としており、コントローラーがバインドされていない場合に返却する
		var resolveSceneController = isScene(root) && !alreadyBound(root);

		var dfd = resolveSceneController ? h5.async.deferred() : null;

		// 処理対象となるシーン要素取得(自身か、上方直近のシーン要素)
		var currentScene = isScene(root) ? root : getParentScene(root);

		// TODO(鈴木) シーンコントローラーが見つかったか
		var isFound = false;

		// TODO(鈴木) コントローラーのバインド
		findWithSelf(root, '[' + DATA_H5_CONTROLLER + ']').each(
				function() {
					var attrControllers = this.getAttribute(DATA_H5_CONTROLLER);

					var attrControllerNameList = attrControllers.split(',');

					for (var i = 0, len = attrControllerNameList.length; i < len; i++) {

						// TODO(鈴木) getFullnameの仕様不明のため暫定回避
						//var attrControllerName = getFullname($.trim(attrControllerNameList[i]));
						var attrControllerName = $.trim(attrControllerNameList[i]);

						if (attrControllerName === '') {
							// trimした結果空文字になる場合は何もしない
							return true;
						}

						if (controllerName && attrControllerName !== controllerName) {
							// バインドしたいコントローラが指定されていて、その指定と異なっている場合は次を検索
							return true;
						}

						// 既に「同じ名前の」コントローラがバインドされていたら何もしない
						if (!alreadyBound(this, attrControllerName)) {

							// TODO(鈴木) 対象シーン要素直属でなければ処理しない
							if (!checkScene(this, currentScene)) {
								return true;
							}

							// TODO(鈴木) 対象シーンのシーンコントローラーであるか否か
							var isCurrent = false;

							//TODO(鈴木) シーンコントローラーを返却する必要がある場合で、また見つかっておらず、
							// 処理対象が対象シーン要素自体である場合。
							// isFoundフラグにより、同一要素複数コントローラーの場合は、先頭のコントローラーのみ対象となる
							if (resolveSceneController && !isFound && this === root) {
								isFound = true;
								isCurrent = true;
							}

							markBoundController(this, attrControllerName);

							// TODO(鈴木) デフォルトのシーンコントローラーである場合のみパラメータを渡す
							var loadControllerPromise = loadController(attrControllerName, this,
									isCurrent ? args : null);

							//TODO(鈴木) デフォルトのシーンコントローラーである場合のみ、コントローラーをresolveで返す
							if (isCurrent) {
								loadControllerPromise.done(function(controller) {
									dfd.resolve(controller);
								});
							}
						}
					}
				});

		// TODO(鈴木) シーンコンテナの探索と生成
		$root.find('[' + DATA_H5_MAIN_CONTAINER + '],[' + DATA_H5_CONTAINER + ']').each(function() {

			// TODO(鈴木) 対象シーン要素直属でなければ処理しない
			if (checkScene(this, currentScene)) {
				return true;
			}

			var $container = $(this);
			if ($container.is('[' + DATA_H5_MAIN_CONTAINER + ']')) {
				createSceneContainer(this, true);
			} else if ($container.is('[' + DATA_H5_CONTAINER + ']')) {
				createSceneContainer(this);
			}

		});

		if (resolveSceneController) {
			return dfd.promise();
		}
		return;
	}

	/**
	 * コントローラーがバインド済みであるかをチェックします
	 *
	 * @private
	 * @param element
	 * @param controllerName
	 * @returns {Boolean}
	 */
	function alreadyBound(element, controllerName) {
		// TODO
		// 一時しのぎ、getControllers()でバインド途中のコントローラも取得できるようにすべき
		// var controllers = h5.core.controllerManager.getControllers(element);

		var controllers = $(element).attr(DATA_H5_DYN_CONTROLLER_BOUND);

		if (!controllers)
			return false;

		controllers = controllers.split(',');

		// controllerNameが指定されない場合は、何らかのコントローラーがバインドされていればtrueを返す
		if (!controllerName && controllers.length > 0) {
			return true;
		}
		for (var i = 0; i < controllers.length; i++) {
			// if(controllers[i].__name === controllerName){
			if ($.trim(controllers[i]) === controllerName) {
				return true;
			}
		}
		return false;
	}

	/**
	 * コントローラーがバインドされたことをマークします(暫定)
	 *
	 * @private
	 * @param target
	 * @param name
	 */
	function markBoundController(target, name) {
		var attr = $(target).attr(DATA_H5_DYN_CONTROLLER_BOUND) || '';
		if (attr)
			attr += ',';
		attr += name;
		$(target).attr(DATA_H5_DYN_CONTROLLER_BOUND, attr);
	}

	/**
	 * scan関数分割。シーンコンテナを作成用です。
	 * <p>
	 * カレントシーンとなる要素の探索と、コントローラー指定なしの場合のダミーコントローラーバインドを行います。
	 * </p>
	 *
	 * @private
	 * @param rootElement
	 * @param controllerName
	 * @param args
	 * @returns {Promise}
	 */
	function scanForContainer(rootElement, controllerName, args) {

		var root = rootElement ? rootElement : document.body;
		var dfd = h5.async.deferred();
		var isFound = false;
		var dummyController = null;

		// TODO(鈴木) data-h5-default-scene属性を持つ要素が直下に存在するかの確認
		var defaultSceneElm = $(root).find('>[' + DATA_H5_DEFAULT_SCENE + ']');
		// TODO(鈴木) 先頭要素がdata-h5-controllerを属性持っていない場合、ダミーのコントローラーをバインドしてresolve
		if (defaultSceneElm.length > 0) {
			var elm = defaultSceneElm.eq(0);
			if (!alreadyBound(elm)) {
				isFound = true;
				if (!elm.is('[' + DATA_H5_CONTROLLER + ']')) {
					markBoundController(elm, DummyController.__name);
					dummyController = h5.core.controller(elm, DummyController, args);
					dfd.resolve(dummyController);
				}
			}
		}

		// TODO(鈴木) data-h5-default-scene属性を持つ該当要素が見つからなかった場合
		if (!isFound) {
			// TODO(鈴木) data-h5-scene属性を持つ要素が直下先頭に存在するかの確認
			var sceneElm = $(root).children().eq(0).filter('[' + DATA_H5_SCENE + ']');
			if (sceneElm.length > 0) {
				if (!alreadyBound(sceneElm)) {
					isFound = true;
					sceneElm.attr(DATA_H5_DEFAULT_SCENE, DATA_H5_DEFAULT_SCENE);
					defaultSceneElm = sceneElm;
					//TODO(鈴木) 先頭要素がdata-h5-controllerを属性持っていない場合、ダミーのコントローラーをバインドしてresolve
					if (!sceneElm.is('[' + DATA_H5_CONTROLLER + ']')) {
						markBoundController(sceneElm, DummyController.__name);
						dummyController = h5.core.controller(sceneElm, DummyController, args);
						dfd.resolve(dummyController);
					}
				}
			}
		}

		// TODO(鈴木) カレントとなるシーン要素が見つからない場合はエラー
		if (!isFound) {
			throwFwError(ERR_CODE_CURRENT_SCENE_NOT_FOUND);
		}

		// TODO(鈴木) カレントとなるシーン要素のみscan
		var promise = scan(defaultSceneElm.get(0), controllerName, args);

		// TODO(鈴木) デフォルトコントローラーがバインド・返却されていなければscanの結果を使用する
		if (!isResolved(dfd)) {
			promise.done(function(controller) {
				dfd.resolve(controller);
			});
		}

		return dfd.promise();
	}

	/**
	 * コントローラーファイルのロードとコントローラーの生成
	 *
	 * @private
	 * @param name
	 * @param rootElement
	 * @param args
	 * @returns {Promise}
	 */
	function loadController(name, rootElement, args) {
		var dfd = h5.async.deferred();
		h5.res.get(name).then(function(Controller) {
			var controller = h5.core.controller(rootElement, Controller, args);
			dfd.resolve(controller);
		});
		return dfd.promise();
	}

	function TypedMessage(type, data) {
		this.type = type;
		this.data = data;
	}

	function MessageChannel(type, targetWindow) {
		this.type = type;

		this._targetWindow = targetWindow;

		this._closed = false;

		this._subscribers = [];

		var that = this;

		this._recv = function(event) {
			that._receiveMessage(event.originalEvent);
		};

		$(window).on('message', this._recv);
	}
	h5.mixin.eventDispatcher.mix(MessageChannel.prototype);
	$.extend(MessageChannel.prototype, {
		send: function(data) {
			if (this._closed) {
				// TODO fwErrorを投げる
				alert('クローズ済みのチャネルです。送信できません。');
				return;
			}

			var msg = new TypedMessage(this.type, data);

			var msgSerialized = h5.u.obj.serialize(msg);

			// TODO originを指定できるようにする, IE8-にoriginがないので対応が必要
			this._targetWindow.postMessage(msgSerialized, location.origin);
		},

		subscribe: function(func, thisObj) {
			var s = {
				func: func,
				thisObj: thisObj ? thisObj : null
			};

			this._subscribers.push(s);
		},

		close: function() {
			this._closed = true;
			this.off(window, 'message', this._recv);
		},

		_receiveMessage: function(event) {
			var msg;

			try {
				msg = h5.u.obj.deserialize(event.data);

				if (msg.type !== this.type) {
					return;
				}
			} catch (e) {
				fwLogger.debug('メッセージをデシリアライズできませんでした。無視します。');
				return;
			}

			var subers = this._subscribers;
			for (var i = 0, len = subers.length; i < len; i++) {
				var s = subers[i];
				s.func.call(s.thisObj, msg.data);
			}

			var ev = {
				type: 'message',
				data: msg.data
			};

			this.dispatchEvent(ev);
		}

	});

	// type:String -> MessageChannelインスタンス
	var singletonMessageChannelMap = {};

	/**
	 * type毎に一意なMessageChannelインスタンスを取得する。
	 *
	 * @returns channel
	 */
	function getMessageChannel(type, win) {
		var channel = singletonMessageChannelMap[type];

		if (!channel) {
			channel = new MessageChannel(type, win);
			singletonMessageChannelMap[type] = channel;
		}

		return channel;
	}

	// =========================================================================
	//
	// Classes
	//
	// =========================================================================

	// =============================
	// RemoteInvocation
	// =============================

	var RMI_STATUS_SUCCESS = 0;
	var RMI_STATUS_EXCEPTION = 1;
	var RMI_STATUS_ASYNC_RESOLVED = 2;
	var RMI_STATUS_ASYNC_REJECTED = 3;
	var RMI_STATUS_METHOD_NOT_FOUND = 4;

	function RMIReceiver() {
		this._recvChannel = new MessageChannel(REMOTE_METHOD_INVOCATION, window.opener);
		this._recvChannel.subscribe(this._receive, this);

		this._sendChannel = new MessageChannel(REMOTE_METHOD_INVOCATION_RESULT, window.opener);
	}
	$.extend(RMIReceiver.prototype, {
		_receive: function(data) {
			var controller = getDefaultSceneController();

			var id = data.id;
			var method = data.method;
			var args = data.args;

			if (!controller[method] || isFunction(controller[method])) {
				this._callFunction(id, controller, method, args);
			} else {
				this._sendChannel.send({
					id: id,
					isAsync: false,
					status: RMI_STATUS_METHOD_NOT_FOUND,
					result: null
				});
			}
		},

		_callFunction: function(id, controller, method, args) {
			args = wrapInArray(args);

			var ret = undefined;
			try {
				ret = controller[method].apply(controller, args);
			} catch (e) {
				this._sendChannel.send({
					id: id,
					isAsync: false,
					status: RMI_STATUS_EXCEPTION,
					result: null
				});
				return;
			}

			var that = this;

			// TODO コード整理
			if (h5.async.isPromise(ret)) {
				ret.done(function(/* var_args */) {
					var value = h5.u.obj.argsToArray(arguments);

					that._sendChannel.send({
						id: id,
						isAsync: true,
						status: RMI_STATUS_ASYNC_RESOLVED,
						result: value
					});
				}).fail(function(/* var_args */) {
					var value = h5.u.obj.argsToArray(arguments);

					that._sendChannel.send({
						id: id,
						isAsync: true,
						status: RMI_STATUS_ASYNC_REJECTED,
						result: value
					});

				});
			} else {
				this._sendChannel.send({
					id: id,
					isAsync: false,
					status: RMI_STATUS_SUCCESS,
					result: ret
				});
			}

		}
	});

	// =============================
	// RemoteInvocation
	// =============================

	function RemoteMethodInvocation(targetWindow) {
		this.targetWindow = targetWindow;

		// TODO channel id は一意になるように生成する
		this.id = 'FIXME';

		// TODO channelはmessageイベントを1つだけonしてハンドラを共有する
		// id -> dfd
		this._invocationMap = {};

		// TODO createSequenceは別ファイルにしたい
		this._invocationSeq = h5.core.data.createSequence(1, 1, h5.core.data.SEQ_INT);

		// TODO MessageChannelは、同一ウィンドウ、かつ、同一チャネルにのみ伝わるようにすべき(channel idの導入)
		this._sendChannel = getMessageChannel(REMOTE_METHOD_INVOCATION, targetWindow);

		this._recvChannel = getMessageChannel(REMOTE_METHOD_INVOCATION_RESULT, targetWindow);
		this._recvChannel.subscribe(this._receive, this);
	}
	$.extend(RemoteMethodInvocation.prototype, {
		invoke: function(method, args) {
			var dfd = h5.async.deferred();

			var data = {
				id: this._invocationSeq.next(),
				method: method,
				args: args
			};

			this._invocationMap[data.id] = dfd;

			this._sendChannel.send(data);

			return dfd.promise();
		},

		_receive: function(data) {
			var id = data.id;
			var dfd = this._invocationMap[id];

			if (!dfd) {
				// TODO fwLogger
				return;
			}

			delete this._invocationMap[id];

			var ret = data.result;
			var isAsync = data.isAsync;
			var status = data.status;

			if (!isAsync) {
				if (status === RMI_STATUS_SUCCESS) {
					dfd.resolve(ret);
				} else {
					dfd.reject();
				}
			} else {
				if (status === RMI_STATUS_ASYNC_RESOLVED) {
					dfd.resolve.apply(dfd, ret);
				} else {
					dfd.reject.apply(dfd, ret);
				}
			}

		}
	});

	// =============================
	// Router
	// =============================

	/**
	 * Router
	 * <p>
	 * 暫定実装。
	 * </p>
	 * <p>
	 * URLのチェック対象となるのは、HirtoryAPI使用の場合はドメインルートより後、Hash使用の場合はHash(#より後)を対象とし、先頭からベースURLを除いたものです。
	 * (ただし、Hash使用の場合でもHash値がない場合はドメインルートより後を使用) (これをここでは「ルーターURL」と呼称します)
	 * </p>
	 * <p>
	 * ルーティングルールは引数optionのroutesプロパティに以下の形式の配列を指定します。
	 * </p>
	 *
	 * <pre>
	 * [{test:(文字列|正規表現|関数)}, func:(対応処理関数)}, ...]
	 * </pre>
	 *
	 * <p>
	 * testには、URLをチェックするためのルールを以下の様に指定します。
	 * </p>
	 * <dl>
	 * <dt>文字列の場合</dt>
	 * <dd>ルーターURLすべてを指定。(完全一致。パラメーター以下もすべて指定)</dd>
	 * <dt>正規表現の場合</dt>
	 * <dd>ルーターURLとマッチする正規表現を指定</dd>
	 * <dt>関数の場合</dt>
	 * <dd>ルーターURLを仮引数とし、対象の場合true、対象外の場合falseを返却する関数を指定</dd>
	 * </dl>
	 *
	 * @private
	 * @class
	 * @param {Object} [option]
	 * @param {Boolean} [option.urlHistoryMode] URL履歴保持方法指定
	 * @param {String} [option.baseUrl] ベースURL
	 * @param {Integer} [option.urlMaxLength=1800] 遷移先URL最大長
	 * @param {Array} [option.routes] ルーティングルール。詳細は上述。
	 * @returns {Router} Routerインスタンス
	 */
	function Router(option) {
		option = option || {};

		var self;

		// TODO(鈴木) Routerはシングルトン実装とする。
		if (!Router._instance) {
			self = Router._instance = this;
			var pushSate = !!(window.history.pushState);
			self.urlHistoryMode = option.urlHistoryMode || URL_HISTORY_MODE.HISTORY;

			// TODO(鈴木) URL履歴保持方法判定
			switch (self.urlHistoryMode) {
			case URL_HISTORY_MODE.HASH:
				self.urlHistoryActualMode = URL_HISTORY_ACTUAL_MODE.HASH;
				break;
			case URL_HISTORY_MODE.NONE:
				self.urlHistoryActualMode = URL_HISTORY_ACTUAL_MODE.NONE;
				break;
			case URL_HISTORY_MODE.FULLRELOAD:
				self.urlHistoryActualMode = URL_HISTORY_ACTUAL_MODE.FULLRELOAD;
				break;
			case URL_HISTORY_MODE.HISTORY:
			case URL_HISTORY_MODE.HISTORY_OR_HASH:
			case URL_HISTORY_MODE.HISTORY_OR_ERROR:
			case URL_HISTORY_MODE.HISTORY_OR_NONE:
			case URL_HISTORY_MODE.HISTORY_OR_FULLRELOAD:
				// TODO(鈴木) History APIが使用可能である場合
				if (pushSate) {
					self.urlHistoryActualMode = URL_HISTORY_ACTUAL_MODE.HISTORY;
				}
			}

			// TODO(鈴木) HISTORY*指定でHistory APIが使用不可である場合
			if (!self.urlHistoryActualMode && !pushSate) {
				// TODO(鈴木) URL履歴保持方法判定
				switch (self.urlHistoryMode) {
				case URL_HISTORY_MODE.HISTORY_OR_ERROR:
					// TODO(鈴木) HistoryAPIが使用できない環境では処理できない
					throwFwError(ERR_CODE_HISTORY_API_NOT_AVAILABLE);
					return;
				case URL_HISTORY_MODE.HISTORY:
				case URL_HISTORY_MODE.HISTORY_OR_HASH:
					self.urlHistoryActualMode = URL_HISTORY_ACTUAL_MODE.HASH;
					break;
				case URL_HISTORY_MODE.HISTORY_OR_NONE:
					self.urlHistoryActualMode = URL_HISTORY_ACTUAL_MODE.NONE;
					break;
				case URL_HISTORY_MODE.HISTORY_OR_FULLRELOAD:
					self.urlHistoryActualMode = URL_HISTORY_ACTUAL_MODE.FULLRELOAD;
					break;
				}
			}

			if (!self.urlHistoryActualMode) {
				// Router URL履歴保持方法指定が不正
				throwFwError(ERR_CODE_URL_HISTORY_MODE_INVALID, self.urlHistoryMode);
			}

			if (option.baseUrl) {
				var urlHelper = new UrlHelper(option.baseUrl);
				self._baseUrl = urlHelper.pathname.replace(/^\/?(.*?)\/?$/, '/$1/');
			}

			self._urlMaxLength = option.urlMaxLength || URL_MAX_LENGTH;

			// TODO(鈴木) on/off用にthisをバインド
			var _onChange = self._onChange;
			self._onChange = function() {
				return _onChange.apply(self, arguments);
			};

		} else {
			self = Router._instance;
		}

		// TODO(鈴木) 2回目以降のインスタンス生成時はroutesをマージするのみ、その他のパラメーターは無視
		if (option.routes) {
			self._routes = self._routes.concat(option.routes);
		}

		return self;
	}

	var RouterPrototype = {

		/**
		 * ルーティングルール
		 *
		 * @private
		 * @memberOf Router
		 */
		_routes: [],

		/**
		 * ベースURL
		 *
		 * @private
		 * @memberOf Router
		 */
		_baseUrl: null,

		/**
		 * URL監視フラグ
		 *
		 * @private
		 * @memberOf Router
		 */
		_started: false,

		/**
		 * URL最大長
		 *
		 * @private
		 * @memberOf Router
		 */
		_urlMaxLength: null,

		/**
		 * hashChange時コールバック抑制フラグ
		 *
		 * @private
		 * @memberOf Router
		 */
		_silentOnce: false,

		/**
		 * Router URL履歴保持方法指定
		 *
		 * @private
		 * @memberOf Router
		 */
		urlHistoryMode: null,

		/**
		 * Router URL履歴保持方法(判定後)
		 *
		 * @private
		 * @memberOf Router
		 */
		urlHistoryActualMode: null,

		/**
		 * URL変更なしでの対応関数実行 URL文字列保持用
		 *
		 * @private
		 * @memberOf Router
		 */
		_urlForSimulate: null,

		/**
		 * URL変化時コールバック
		 *
		 * @private
		 * @memberOf Router
		 */
		_onChange: function() {

			// TODO(鈴木) hash変更時にhashchangeを無視する場合
			if (this._silentOnce) {
				this._silentOnce = false;
				return;
			}

			var current;
			var contextualData = null;

			if (this._urlForSimulate) {
				// TODO(鈴木) URLを変更せずに対応処理を実行する場合(evaluate経由)
				current = this._urlForSimulate;
				// TODO(鈴木) contextualDataはこの場合でのみ使用可能
				contextualData = this._contextualData;
				this._urlForSimulate = this._contextualData = null;
			} else {
				// TODO(鈴木) 通常は現URLから情報を取得
				var routerLocation = this._getRouterLocation();
				current = routerLocation.pathname + routerLocation.search;
			}

			// TODO(鈴木) ルーティングルールとの突合用にベースURLを除去
			var forTest = this._removeBaseUrl(current);

			var result = null;
			// TODO(鈴木) ルーティングテーブル探査
			for (var i = 0; i < this._routes.length; i++) {
				var route = this._routes[i];
				if (isString(route.test)) {
					// ルールが文字列の場合
					if (forTest === route.test) {
						result = route.func(current, contextualData);
						break;
					}
				} else if (route.test instanceof RegExp) {
					// ルールが正規表現の場合
					if (route.test.test(forTest)) {
						result = route.func(current, contextualData);
						break;
					}
				} else if (typeof route.test === 'function') {
					// ルールが関数の場合
					if (route.test(forTest)) {
						result = route.func(current, contextualData);
						break;
					}
				}
			}

			// TODO(鈴木) 対応関数実行時に返却値がある場合
			if (result) {
				this.evaluate(result, contextualData);
			}
		},

		/**
		 * URL監視の開始
		 *
		 * @memberOf Router
		 * @param {Object} [option]
		 * @param {Boolean} [option.silent=false] 監視開始時にその時点のURLに対応した処理を実行しない場合にtrueを指定する。
		 */
		start: function(option) {
			option = option || {};

			if (this._started)
				return;

			this._checkUrlLength(location.href, {
				throwOnError: true
			});

			this._started = true;

			if (!option || !option.silent) {
				this._onChange();
			}

			switch (this.urlHistoryActualMode) {
			case URL_HISTORY_ACTUAL_MODE.HASH:
				$(window).on('hashchange', this._onChange);
				break;
			case URL_HISTORY_ACTUAL_MODE.HISTORY:
				$(window).on('popstate', this._onChange);
				break;
			}
		},

		/**
		 * URL変更
		 *
		 * @memberOf Router
		 * @param {String} to 遷移先指定
		 * @param {Object} [option]
		 * @param {Boolean} [option.replaceHistory=false] 前の画面の履歴を残さずに遷移する場合にtrueを指定する。
		 * @param {String} [option.mode] 動作モード指定
		 */
		navigate: function(to, option) {
			option = option || {};

			if (!this._started) {
				return;
			}

			this._checkUrlLength(to, {
				throwOnError: true
			});

			var silent = false, mode = this.urlHistoryActualMode;

			// TODO(鈴木) 動作モード判定
			switch (option.mode) {
			case URL_HISTORY_MODE_ON_NAVIGATE.SILENT:
				silent = true;
				break;
			case URL_HISTORY_MODE_ON_NAVIGATE.NONE:
				mode = URL_HISTORY_ACTUAL_MODE.NONE;
				break;
			case URL_HISTORY_MODE_ON_NAVIGATE.FULLRELOAD:
				mode = URL_HISTORY_ACTUAL_MODE.FULLRELOAD;
				break;
			}

			var result = this._toAbusolute(to);

			// TODO(鈴木) URL履歴保持方法指定に合わせた処理

			// 遷移先URLが現在と同一の場合、NONE以外のケースで、
			// 「現URLに対応した処理を実行、ブラウザ履歴は追加しない」
			// という動作にする。
			//
			// ・HistoryAPI pushStateは、同一URLでもブラウザ履歴が追加される。
			//   その後のブラウザバックでpopstateも発生する。
			// ・hash使用の場合は同一URLではブラウザ履歴は追加されず、hashchangeも発生しない。
			// ・href使用の場合は同一URLではブラウザ履歴は追加されないが、通常画面更新は発生する。
			//   が、URLにハッシュがついていると、画面更新は発生しない。(スクロールのみ)
			//
			// これらの差異を吸収するよう実装する。

			switch (mode) {
			case URL_HISTORY_ACTUAL_MODE.HASH:
				if (silent) {
					this._silentOnce = true;
				}
				//TODO #449 パラメーター順序違いを考慮した同一性の判定については要検討
				if (this.compareUrl(result)) {
					this._onChange();
				} else {
					if (option.replaceHistory) {
						location.replace('#' + result);
					} else {
						location.hash = result;
					}
				}
				break;
			case URL_HISTORY_ACTUAL_MODE.HISTORY:
				if (silent) {
					this._silentOnce = true;
				}
				//TODO #449 パラメーター順序違いを考慮した同一性の判定については要検討
				if (this.compareUrl(result)) {
					this._onChange();
				} else {
					if (option.replaceHistory) {
						history.replaceState(null, null, result);
					} else {
						history.pushState(null, null, result);
					}
					this._onChange();
				}
				break;
			case URL_HISTORY_ACTUAL_MODE.FULLRELOAD:
				//TODO #449 パラメーター順序違いを考慮した同一性の判定については要検討
				if (this.compareUrl(result)) {
					//TODO(鈴木) URLにHashが付いていても再表示する
					location.reload();
				} else if (option.replaceHistory) {
					location.replace(result);
				} else {
					location.href = result;
				}
				break;
			case URL_HISTORY_ACTUAL_MODE.NONE:
				this.evaluate(result);
				break;
			}

			return;
		},

		/**
		 * URL監視の停止
		 *
		 * @memberOf Router
		 */
		stop: function() {
			if (!this._started)
				return;
			this._started = false;
			switch (this.urlHistoryActualMode) {
			case URL_HISTORY_ACTUAL_MODE.HASH:
				$(window).off('hashchange', this._onChange);
				break;
			case URL_HISTORY_ACTUAL_MODE.HISTORY:
				$(window).off('popstate', this._onChange);
				break;
			}
		},

		/**
		 * URL長のチェック
		 * <p>
		 * 指定のURLに遷移した場合、URL全体で設定された最大長を超過しないかをチェックします。 HistroyAPI使用の場合とHash使用の場合で長さは異なるので注意してください。
		 * </p>
		 *
		 * @private
		 * @memberOf Router
		 * @param {String} url
		 * @param {Object} [option]
		 * @param {Boolean} [option.writeBack=false] チェック結果詳細を仮引数のオブジェクトに書き込む場合にtrue。
		 *            ※現時点では使用していない。将来的にメソッドを公開した場合での使用を想定。
		 * @param {Boolean} [option.throwOnError=false] チェックエラー時に例外をスローする場合にtrue。dev版のみ有効。min版では無効。
		 * @returns {Boolean} チェック結果
		 */
		_checkUrlLength: function(url, option) {
			option = option || {};
			if (this._urlMaxLength == null) {
				return true;
			}
			var urlHelper = new UrlHelper(url);
			if (urlHelper.protocol) {
				// プロトコル指定ありの場合はそのままチェック。
				return (url.length <= this._urlMaxLength);
			}
			var result = this._toAbusolute(url);
			if (this.urlHistoryActualMode === URL_HISTORY_ACTUAL_MODE.HASH) {
				var path = window.location.pathname;
				var search = window.location.search || '';
				result = path + search + '#' + result;
			}
			result = toAbsoluteUrl(result);

			if (option.writeBack) {
				option.url = result;
				option.urlLength = result.length;
				option.urlMaxLength = this._urlMaxLength;
			}

			if (result.length <= this._urlMaxLength) {
				return true;
				/* del begin */
			} else if (option.throwOnError) {
				// 遷移先URLが設定された最大長を超過した
				throwFwError(ERR_CODE_URL_LENGTH_OVER, [result.length, this._urlMaxLength]);
				return false;
				/* del end */
			} else {
				fwLogger.warn(ERR_CODE_URL_LENGTH_OVER, result.length, this._urlMaxLength);
				return false;
			}
		},

		/**
		 * ベースディレクトリの取得
		 *
		 * @memberOf Router
		 * @returns {String}
		 */
		_getBaseDir: function() {
			if (this._baseUrl) {
				return this._baseUrl;
			}
			var routerLocation = this._getRouterLocation();
			return routerLocation.dir;
		},

		/**
		 * 先頭のベースURLを取り除いたURLを返却
		 *
		 * @private
		 * @memberOf Router
		 * @param {String} url
		 * @returns {String}
		 */
		_removeBaseUrl: function(url) {
			var baseUrl = this._baseUrl;
			if (baseUrl && url.indexOf(baseUrl) === 0) {
				url = url.replace(baseUrl, '');
			}
			return url;
		},

		/**
		 * URL変更なしでの対応処理実行
		 *
		 * @memberOf Router
		 * @param {String} url
		 * @param {Any} contextualData
		 */
		evaluate: function(url, contextualData) {
			var result = this._toAbusolute(url);
			this._urlForSimulate = result;
			this._contextualData = contextualData;
			this._onChange();
		},

		/**
		 * 相対アドレスの絶対アドレスへの変換
		 *
		 * @private
		 * @memberOf Router
		 * @param {String} url
		 * @returns {String}
		 */
		_toAbusolute: function(url) {
			var wk = null;
			var urlHelper = new UrlHelper(url);
			var routerLocation = this._getRouterLocation();
			if (urlHelper.isSearch()) {
				wk = routerLocation.pathname + urlHelper.search + urlHelper.hash;
			} else if (urlHelper.isHash()) {
				wk = routerLocation.pathname + routerLocation.search + urlHelper.hash;
			} else {
				wk = urlHelper.pathname + urlHelper.search + urlHelper.hash;
				if (wk.indexOf('/') !== 0) {
					var base = this._getBaseDir();
					wk = base + wk;
				}
			}
			wk = toAbsoluteUrl(wk);
			urlHelper = new UrlHelper(wk);
			var result = urlHelper.pathname + urlHelper.search + urlHelper.hash;
			return result;
		},
		/**
		 * URLの比較
		 * <p>
		 * 第二引数を指定しない場合、現時点のURLと比較します。
		 * </p>
		 *
		 * @memberOf Router
		 * @param {String} sbj 比較するURL
		 * @param {String} [obj] 比較するURL。指定しない場合は、現時点のURLを対象とする。
		 * @returns {Boolean} 同一の場合はtrue、異なる場合はfalse
		 */
		compareUrl: function(sbj, obj) {
			if (obj == null) {
				var routerLocation = this._getRouterLocation();
				obj = routerLocation.pathname + routerLocation.search;
			}
			if (sbj.indexOf('/') !== 0) {
				sbj = this._toAbusolute(sbj);
			}
			if (obj.indexOf('/') !== 0) {
				obj = this._toAbusolute(obj);
			}
			return (sbj === obj);
		},
		/**
		 * 現時点のURLの取得
		 * <p>
		 * HirtoryAPI使用の場合はドメインルートより後、Hash使用の場合はHash(#より後)を使用し、UrlHelperで返却します。
		 * (ただし、Hash使用の場合でもHash値がない場合はドメインルートより後を使用します)
		 * </p>
		 *
		 * @private
		 * @memberOf Router
		 * @returns {UrlHelper}
		 */
		_getRouterLocation: function() {
			var urlHelper;
			if (this.urlHistoryActualMode === URL_HISTORY_ACTUAL_MODE.HASH && location.hash) {
				urlHelper = new UrlHelper(location.hash.substring(1));
			} else {
				urlHelper = new UrlHelper(location.href);
			}
			return urlHelper;
		}
	};
	$.extend(Router.prototype, RouterPrototype);

	// =============================
	// URL Helper
	// =============================
	/**
	 * UrlHelper
	 * <p>
	 * 暫定実装。
	 * </p>
	 *
	 * @private
	 * @class
	 * @param {String} url
	 * @returns {UrlHelper}
	 */
	function UrlHelper(url) {
		if (url == null) {
			return;
		}
		var match = url.match(UrlHelper.regExp);
		this.href = match[0] || '';
		this.protocol = match[1] || '';
		this.host = match[2] || '';
		this.hostname = match[3] || '';
		this.port = match[4] || '';
		this.pathname = match[5] || '';
		this.dir = match[6] || '';
		this.file = match[7] || '';
		this.search = match[8] || '';
		this.hash = match[9] || '';
	}
	$.extend(UrlHelper.prototype, {
		/**
		 * @memberOf UrlHelper
		 */
		href: undefined,
		/**
		 * @memberOf UrlHelper
		 */
		protocol: undefined,
		/**
		 * @memberOf UrlHelper
		 */
		host: undefined,
		/**
		 * @memberOf UrlHelper
		 */
		hostname: undefined,
		/**
		 * @memberOf UrlHelper
		 */
		port: undefined,
		/**
		 * @memberOf UrlHelper
		 */
		pathname: undefined,
		/**
		 * @memberOf UrlHelper
		 */
		dir: undefined,
		/**
		 * @memberOf UrlHelper
		 */
		file: undefined,
		/**
		 * @memberOf UrlHelper
		 */
		search: undefined,
		/**
		 * @memberOf UrlHelper
		 */
		hash: undefined,
		/**
		 * @memberOf UrlHelper
		 */
		isSearch: function() {
			return !this.protocol && !this.host && !this.pathname && this.search;
		},
		/**
		 * @memberOf UrlHelper
		 */
		isHash: function() {
			return !this.protocol && !this.host && !this.pathname && !this.search && this.hash;
		}
	});
	UrlHelper.regExp = locationRegExp;

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	// 子ウィンドウの場合
	if (window.opener) {
		new RMIReceiver();
	}

	/**
	 * シーンクラス
	 * <p>
	 * コントローラ化の際に、コントローラに"scene"プロパティが追加され、コントローラごとに生成されるこのクラスのインスタンスが格納されます
	 * </p>
	 *
	 * @class
	 */
	/**
	 * @private
	 * @param {Controller} controller
	 */
	function Scene(controller) {
		this.__controller = controller;
	}

	$.extend(Scene.prototype, {
		/**
		 * シーン遷移イベントを発行します。
		 *
		 * @param {String|Object} data
		 * @memberOf ControllerScene
		 */
		navigate: function(data) {
			if (isDisposing(this.__controller)) {
				// TODO エラー
				return;
			}
			this.__controller.trigger(EVENT_SCENE_CHANGE_REQUEST, data);
		},

		/**
		 * このコントローラを直接包含しているシーンコンテナを取得します。
		 * <p>
		 * シーンコンテナ要素が存在しない、またはシーンコンテナ未生成の場合はnullを返却します。
		 * </p>
		 *
		 * @returns {SceneContainerController} シーンコンテナ
		 * @memberOf ControllerScene
		 */
		getParentContainer: function() {
			if (isDisposing(this.__controller)) {
				return null;
			}
			var element = getParentContainer(this.__controller.rootElement);
			if (!element) {
				return null;
			}
			return getSceneContainers(element)[0];
		}
	});

	function InvocationProxy() {
	// 空コンストラクタ
	}

	function RemoteWindow(url, windowName, features, isModal) {
		var win = window.open(url, windowName, features);

		this.window = win;

		this._isModal = false;

		this._parentBlocker = null;

		this.setModal(isModal === true ? true : false);

		this._rmi = new RemoteMethodInvocation(win);

		this._watchChild();
	}
	$.extend(RemoteWindow.prototype, {
		invoke: function(method, args) {
			return this._rmi.invoke(method, args);
		},

		getControllerProxy: function(selector) {
			var proxy = new InvocationProxy();

			return proxy;
		},

		setModal: function(value) {
			if (this._isModal == value) {
				return;
			}

			// TODO 外部化
			// h5.messageBundle.scene.MODAL_NOTICE = '子ウィンドウを開いている間は操作できません';
			var message = '子ウィンドウを開いている間は操作できません。';

			if (this._isModal) {
				// true -> false なので親ウィンドウのブロックを外す
				this._parentBlocker.hide();
				this._parentBlocker = null;
			} else {
				// false -> trueなので親ウィンドウをブロックする
				this._parentBlocker = h5.ui.indicator({
					target: 'body',
					block: true,
					message: message,
					showThrobber: false
				}).show();
			}

			this._isModal = value;
		},

		close: function() {
			var dfd = h5.async.deferred();

			this.window.close();

			return dfd.promise();
		},

		_watchChild: function() {
			var that = this;

			// TODO setModal(false)のときは監視しないようにする
			function watch() {
				if (that.window.closed) {
					clearInterval(tid);
					that.setModal(false);
				}
			}

			var tid = setInterval(watch, 300);
		}
	});

	// TODO(鈴木) シーンクラス削除

	/**
	 * 別ウィンドウをオープンします。
	 *
	 * @param url
	 * @param name
	 * @param features
	 * @param isModal
	 * @param controllerName
	 * @param param
	 * @returns {Promise} プロミス。完了するとRemoteWindowオブジェクトを返します。
	 */
	function openWindow(url, name, features, isModal, controllerName, args) {
		var dfd = h5.async.deferred();

		var remote = new RemoteWindow(url, name, features, isModal);

		// FIXME window側のURLのロードが完了し、存在する場合にコントローラのreadyが完了したらresolve
		setTimeout(function() {
			dfd.resolve(remote);
		}, 100);

		return dfd.promise();
	}

	// TODO(鈴木) シーンタイプ関連実装削除

	/**
	 * HTMLコメント削除用正規表現
	 */
	var htmlCommentRegexp = /<!--(?:\s|\S)*?-->/g;

	/**
	 * BODYタグ内容抽出用正規表現
	 */
	var bodyTagRegExp = /<body\b([^>]*)>((?:\s|\S)*?)(?:<\/body\s*>|<\/html\s*>|$)/i;

	/**
	 * HTML文字列からBODYタグ内容部分抽出
	 * <p>
	 * BODYタグがある場合、戻り値はDIVタグで囲む。<br>
	 * BODYタグの属性をそのDIVに追加する。(既存BODYタグの属性を操作することはしない)<br>
	 * data-main-container属性を追加する。<br>
	 * </p>
	 * <p>
	 * BODYタグがない場合は文字列をそのまま返す。
	 * </p>
	 *
	 * @private
	 * @param html
	 * @returns {String}
	 */
	function extractBody(html) {
		// TODO(鈴木) この場合HTMLコメントは消える。HTMLコメント内にbodyタグがない前提であれば楽だが。。
		// HTMLコメントも保存するよう実装すべきか？
		var match = html.replace(htmlCommentRegexp, '').match(bodyTagRegExp);
		if (match) {
			return '<div ' + DATA_H5_DYN_DUMMY_BODY + ' ' + match[1] + '>' + match[2] + '</div>';
		}
		return html;
	}

	/**
	 * 直下先頭要素に'data-h5-default-scene'もしくは'data-h5-scene'属性がない場合は、'data-h5-default-scene'のDIV要素で囲む。
	 * <p>
	 * その際、親(シーンコンテナ)側にdata-h5-controller属性がある場合は、シーン要素に移動する。
	 * </p>
	 *
	 * @private
	 * @param parent
	 */
	function wrapScene(parent) {
		var $parent = $(parent);
		var $children = $parent.children();
		if ($children.eq(0).is('[' + DATA_H5_DEFAULT_SCENE + '],[' + DATA_H5_SCENE + ']') === false) {
			$parent.wrapInner($('<div ' + DATA_H5_DEFAULT_SCENE + '></div>'));
			var name = $parent.attr(DATA_H5_CONTROLLER);
			if (name) {
				// TODO(鈴木) childrenは↑のwrapAllで作成した要素
				$parent.removeAttr(DATA_H5_CONTROLLER).children().attr(DATA_H5_CONTROLLER, name);
			}
		}
	}

	/**
	 * 先頭に表示文字列テキストノードがあるかのチェック用正規表現
	 */
	var startByTextRegexp = /^\s*(?!\s|<)/;

	/**
	 * HTML要素取得(通信)
	 * <p>
	 * 第二引数にコンテナ指定を追加。これが指定された場合、第一引数により取得したHTML内で、 data-h5-scene-container属性の値がこれに一致する要素を対象とする。
	 * </p>
	 *
	 * @private
	 * @param source
	 * @param method
	 * @returns {Promise}
	 */
	function loadContentsFromUrl(source, method, serverArgs) {
		var dfd = h5.async.deferred();

		// TODO htmlだとスクリプトが実行されてしまうのでフルHTMLが返されるとよくない
		// 部分HTML取得の場合のことを考慮。
		var xhr = h5.ajax({
			url: source,
			dataType: 'html',
			method: method || 'get',
			data: serverArgs
		});

		xhr
				.done(
						function(data) {

							// TODO(鈴木) ここでdataからbody部分のみ抜く。
							data = extractBody(data);

							// 先頭が表示文字列テキストノードの場合はコンテナ要素で囲む
							if (startByTextRegexp.test(data)) {
								data = '<div ' + DATA_H5_CONTAINER + '>' + data + '</div>';
							}

							var $dom = $(data);

							// TODO(鈴木)
							// mainタグかdata-main-container属性要素があればその内容を対象とする。
							// 通常のシーンコンテナ内にmainとdata-main-containerはない前提。
							var main = findWithSelf($dom, '[' + DATA_H5_MAIN_CONTAINER + ']');
							// TODO(鈴木)
							// 遷移先のHTMLからメインシーンコンテナに該当する部分を抽出。
							if (main.length === 0) {
								main = findWithSelf($dom, 'main');
							}
							if (main.length > 0) {
								$dom = main.eq(0);
								$dom.attr(DATA_H5_MAIN_CONTAINER, DATA_H5_MAIN_CONTAINER);
							}

							// ルート要素が複数か、単一でもコンテナ要素、またはBODYのダミーでなければコンテナ要素で囲む
							if ($dom.length > 1
									|| (!isContainer($dom) && !$dom.is('[' + DATA_H5_DYN_DUMMY_BODY
											+ ']'))) {
								$dom = $('<div ' + DATA_H5_CONTAINER + '></div>').append($dom);
							}

							wrapScene($dom);

							dfd.resolve($dom.children());

						}).fail(function(error) {
					dfd.reject(error);
				});

		return dfd;
	}

	var NEW_SCENE_HTML = '<div class="h5-scene"></div>';

	/**
	 * HTML要素取得
	 *
	 * @private
	 * @param source
	 * @param method
	 * @returns {Promise}
	 */
	function loadContents(source, method, serverArgs) {
		var dfd;

		if (isString(source)) {
			dfd = loadContentsFromUrl(source, method, serverArgs);
		} else {
			dfd = h5.async.deferred();

			var contentsRoot;
			if (source == null) {
				// 新しくdiv要素を生成
				contentsRoot = $(NEW_SCENE_HTML).get(0);
			} else {
				// DOM要素が指定されたのでそれをそのまま使用
				contentsRoot = h5.u.obj.isJQueryObject(source) ? source[0] : source;
			}

			dfd.resolve(contentsRoot);
		}

		return dfd.promise();
	}

	// TODO(鈴木) シーンタイプ関連実装削除

	/**
	 * シーン遷移効果保持用オブジェクト
	 */
	var transitionTypeMap = {};

	/**
	 * デフォルトシーン遷移効果
	 *
	 * @private
	 * @class
	 */
	function defaultTransitionController() {
	//
	}
	$.extend(defaultTransitionController.prototype, {
		onChange: function(container, to) {
			var dfd = h5.async.deferred();
			$(container).empty();
			$(to).appendTo(container);
			dfd.resolve();
			return dfd.promise();
		},
		onChangeStart: function(container, from, to) {
			this._ind = h5.ui.indicator({
				target: container,
				block: true,
				message: '遷移中...'
			}).show();
		},
		onChangeEnd: function(container, from, to) {
			this._ind.hide();
		}
	});

	/**
	 * シーン遷移用パラメーターシリアライズ
	 *
	 * @private
	 * @param obj
	 * @param parent
	 * @return {String}
	 */
	function serialize(obj, parent) {
		var str = '';
		function callback(k, v) {
			if (str)
				str += '&';
			if (!parent && (k === 'args' || k === 'serverArgs')) {
				str += serialize(v, k);
			} else {
				if (parent === 'serverArgs') {
					var _k = encodeURIComponent(k);
					if (v instanceof Array) {
						var _str = '';
						for (var i = 0; i < v.length; i++) {
							if (_str)
								_str += '&';
							_str += _k + '[]';
							_str += '=';
							_str += encodeURIComponent(v[i]);
						}
						str += _str;
					} else {
						str += _k;
						str += '=';
						str += encodeURIComponent(v);
					}
				} else {
					if (parent === 'args') {
						str += encodeURIComponent(clientQueryStringPrefix + k);
					} else {
						str += encodeURIComponent(clientFWQueryStringPrefix + k);
					}
					str += '=';
					str += encodeURIComponent(h5.u.obj.serialize(v).substring(2));
				}
			}
		}
		$.each(obj, callback);
		return str;
	}

	/**
	 * シーン遷移用パラメーターデシリアライズ
	 *
	 * @private
	 * @param str
	 * @return {Object}
	 */
	function deserialize(str) {
		if (!deserialize._checkKeyRegExp) {
			deserialize._checkKeyRegExp = new RegExp('^(' + clientQueryStringPrefixForRegExp + '|'
					+ clientFWQueryStringPrefixForRegExp + ')?(.+)');
			deserialize._checkArrayRegExp = /^(.*)\[\]$/;
		}
		var obj = {};
		var checkKeyRegExp = deserialize._checkKeyRegExp;
		var checkArrayRegExp = deserialize._checkArrayRegExp;
		function callback(i, pair) {
			pair = pair.split('=');
			var k = decodeURIComponent(pair[0]);
			var v = decodeURIComponent(pair[1]);
			var match = k.match(checkKeyRegExp);
			if (!match)
				return;
			var prefix = match[1] || '';
			var name = match[2];
			if (prefix === clientQueryStringPrefix) {
				obj.args = obj.args || {};
				obj.args[name] = h5.u.obj.deserialize(SERIALIZE_PREFIX + v);
			} else if (prefix === clientFWQueryStringPrefix) {
				obj[name] = h5.u.obj.deserialize(SERIALIZE_PREFIX + v);
			} else {
				obj.serverArgs = obj.serverArgs || {};
				var _match = name.match(checkArrayRegExp);
				if (_match) {
					var _name = _match[1];
					if (_name in obj.serverArgs === false) {
						obj.serverArgs[_name] = [];
					}
					if (obj.serverArgs[_name] instanceof Array) {
						obj.serverArgs[_name].push(v);
					}
				} else {
					obj.serverArgs[name] = v;
				}
			}
		}
		$.each(str.split('&'), callback);
		return obj;
	}

	/**
	 * シーン遷移用パラメーター文字列削除
	 *
	 * @private
	 * @param str
	 * @return {String}
	 */
	function clearParam(str) {
		if (!str)
			return '';
		if (!clearParam._regExp) {
			clearParam._regExp = new RegExp('(^|&)(?:' + clientQueryStringPrefixForRegExp + '|'
					+ clientFWQueryStringPrefixForRegExp + ')[^=]*=.*?(?=&|$)', 'g');
		}
		var regExp = clearParam._regExp;
		var urlHelper = new UrlHelper(str);
		var path = urlHelper.pathname;
		var search = urlHelper.search || '';
		search = search.substring(1).replace(regExp, '');
		if (search)
			search = '?' + search;
		return path + search;
	}

	/**
	 * URLからシーン遷移パラメーターを取得
	 *
	 * @private
	 * @param url
	 * @return {Object}
	 */
	function getParamFromUrl(url) {
		var urlHelper = new UrlHelper(url);
		var path = urlHelper.pathname || '';
		var search = urlHelper.search || '';
		var param = deserialize(search.substring(1));
		if (!param.to) {
			param.to = path;
		}
		return param;
	}

	/**
	 * URL用にシーン遷移パラメーターを文字列に変換
	 *
	 * @private
	 * @param param
	 * @return {String}
	 */
	function convertParamToUrl(param) {
		// TODO(鈴木) 遷移先指定がない場合、現在のURLを使用
		param = $.extend(true, {}, param);
		var to = param.to;
		var path = '', search = '';
		var isController = controllerRegexp.test(to);
		if (isController) {
			to = '';
		} else {
			// TODO(鈴木) paramからtoを削除(URLに余計な情報を残さないため)
			delete param.to;
			to = clearParam(to);
			var urlHelper = new UrlHelper(to);
			path = urlHelper.pathname;
			search = urlHelper.search;
		}
		var paramStr = serialize(param);
		if (paramStr) {
			search += (search) ? '&' : '?';
			search += paramStr;
		}
		var result = path + search;
		return result;
	}

	/**
	 * メインシーンコンテナインスタンス保持用
	 */
	var mainContainer = null;

	/**
	 * 再表示不可画面用コントローラー
	 * <p>
	 * シーン遷移時シーン間パラメーターをURLに保持しない場合で、ブラウザ履歴等により再表示した場合に表示する画面。
	 * </p>
	 *
	 * @private
	 */
	var NotReshowableController = {
		__name: 'h5.scene.NotReshowableController',
		__init: function(context) {
			var _notReshowableMessage = context.args._notReshowableMessage;
			$(this.rootElement).html('<h1>' + _notReshowableMessage + '</h1>');
		}
	};

	/**
	 * シーンコンテナクラス
	 * <p>
	 * 実体はコントローラーです。 シーンコンテナを生成する場合はh5.scene.createSceneContainer()を使用してください。
	 * </p>
	 *
	 * @class
	 * @name SceneContainerController
	 */
	var SceneContainerController = {

		__name: 'h5.scene.SceneContainerController',

		/**
		 * メインシーンコンテナであるか否か
		 *
		 * @readOnly
		 * @type Boolean
		 * @memberOf SceneContainerController
		 */
		isMain: false,

		/**
		 * 画面遷移効果
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_transition: null,

		/**
		 * 現在表示しているシーンのコントローラー
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_currentController: null,

		/**
		 * リンククリックジャックによるシーン遷移の可否
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_isClickjackEnabled: false,

		/**
		 * シーン遷移時に使用するDeferredオブジェクト
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_dfd: null,

		/**
		 * navigate経由で_navigateを実行したか否か
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_isNavigated: false,

		/**
		 * メインシーンコンテナ シーン遷移時パラメーター迂回用
		 * <p>
		 * 遷移パラメーター(FW用以外)をURLに保持しない場合に、このプロパティを経由する。
		 * </p>
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_detour: {},

		/**
		 * Routerインスタンス
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_router: null,

		/**
		 * 初期表示フラグ
		 * <p>
		 * メインシーンコンテナで使用。
		 * </p>
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_first: true,

		/**
		 * このシーンコンテナが現在表示しているシーンのタイトル
		 * <p>
		 * getTitle()で取得できる
		 * </p>
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @type {string}
		 */
		_title: '',

		/**
		 * __init
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		__init: function(context) {

			var args = context.args || {};

			var element = this.rootElement;
			var isMain = args.isMain;
			/* var initialSceneInfo = args.initialSceneInfo; */

			var that = this;

			this.isMain = !!isMain;
			this.followTitle = isMain && args.followTitle;

			if (this.isMain) {
				if (mainContainer) {
					// すでにメインシーンコンテナが生成されている場合にエラー
					throwFwError(ERR_CODE_MAIN_CONTAINER_ALREADY_CREATED);
				}
			}

			this._containerName = $(element).attr(DATA_H5_MAIN_CONTAINER)
					|| $(element).attr(DATA_H5_CONTAINER);

			// TODO(鈴木) シーンコンテナ下はコントローラーを管理
			this._currentController = null;

			// TODO(鈴木) コンテナ内にシーン要素がなければ追加する
			wrapScene(element);

			// TODO(鈴木) とりあえずデフォルトのtransitionを使用。
			this._transition = new defaultTransitionController();
			this._transition.onChangeStart(element);

			this.on('{rootElement}', EVENT_SCENE_CHANGE_REQUEST, this
					.own(this._onSceneChangeRequest));

			this._router = router;

			if (this.isMain) {

				mainContainer = this;

				// _isClickjackEnabledがtrueの場合のみ有効。
				// TODO:フラグのセット方法
				if (this._isClickjackEnabled) {
					this.on('{a}', 'click', this.own(this._onAClick));
				}

				// TODO(鈴木) Routerでの判定結果を取得
				urlHistoryActualMode = this._router.urlHistoryActualMode;

				// TODO(鈴木) Router処理開始
				this._router.start();
			} else {
				// TODO(鈴木) カレントとなるシーンを探索してscan
				scanForContainer(element).done(function(controller) {
					that._currentController = controller;
					that._transition.onChangeEnd(that.rootElement, null, controller.rootElement);
					that._transition = null;
				});
			}
		},

		/**
		 * __dispose
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		__dispose: function() {

			if (!isDisposing(this._currentController)) {
				this._currentController.dispose();
			}

			this._currentController = null;

			if (this.isMain) {
				// TODO(鈴木) Router処理停止
				this._router.stop();
				this._router = null;
			}
		},

		/**
		 * クリックジャックによる遷移
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param context
		 */
		_onAClick: function(context) {
			context.event.preventDefault();
			var href = context.event.originalEvent.target.href;
			this.navigate(href);
		},

		/**
		 * シーン遷移イベント発生時処理
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param context
		 */
		_onSceneChangeRequest: function(context) {
			context.event.stopPropagation();
			setTimeout(this.own(function() {
				this.navigate(context.evArg);
			}), 0);
		},

		/**
		 * シーンコンテナ内のシーンを遷移します。
		 * <p>
		 * 機能の詳細については以下を参照してください。
		 * </p>
		 * <ul>
		 * <li><a
		 * href="/conts/web/view/reference/scene-spec">リファレンス（仕様詳細)&gt;&gt;画面遷移制御・履歴管理(シーン機能)仕様
		 * [ver.1.2]</a>
		 * <ul>
		 * <li><a
		 * href="/conts/web/view/reference/scene-spec#H30B730FC30F330B330F330C630CA5185306E907779FB2830B730FC30F3306E907779FB29">
		 * シーンコンテナ内の遷移(シーンの遷移)</a></li>
		 * </ul>
		 * </li>
		 * </ul>
		 *
		 * @param {String|Object} param 遷移先文字列、または遷移用オプション。
		 *            <p>
		 *            遷移先文字列の場合は、HTMLを返却するURLか、コントローラーの__name属性を指定します。<br>
		 *            遷移用オプションの場合は、以下のプロパティを持ちます。
		 *            </p>
		 * @param {String} param.to 遷移先指定。HTMLを返却するURLか、コントローラーの__name属性を指定します。指定必須です。
		 * @param {Any}[param.args] デフォルトシーンに対応するコントローラー生成時に渡されるパラメータを指定します。
		 * @param {string}[param.navigationType="normal"]
		 *            メインシーンコンテナのみで有効。遷移時のパターンを指定します。以下の値が設定できます。
		 *            <dl>
		 *            <dt>"normal"</dt>
		 *            <dd>URLに開発者指定のパラメーターを入れます(デフォルト)。ブラウザバック等でパラメーター含めて再表示可能です。h5.scene.navigationType.NORMALと同値なのでこれを指定してもよいです。</dd>
		 *            <dt>"once"</dt>
		 *            <dd>URLに開発者指定のパラメーターを入れません。フレームワーク用パラメーターのみとなります。ブラウザバック等で再表示はできなくなります(再表示不可のメッセージ画面(後述)を表示)。h5.scene.navigationType.ONCEと同値なのでこれを指定してもよいです。</dd>
		 *            <dt>"silent"</dt>
		 *            <dd>URLは変化させずに遷移します。h5.scene.navigationType.SILENTと同値なのでこれを指定してもよいです。</dd>
		 *            </dl>
		 * @param {boolean}[param.replaceHistory=false] URLを置換しつつ遷移するか否か。置換して遷移する場合はtrueを設定します。
		 *            デフォルトはfalseです。trueで遷移した場合、元の画面のURLは履歴から削除されるため、ブラウザバックでは戻れなくなります。
		 * @param {string} [param.method="get"]
		 *            toの設定値がHTMLページのURLである場合に有効。AjaxでのHTMLデータ取得時のHTTPメソッドを指定します。
		 *            <dl>
		 *            <dt>"get"</dt>
		 *            <dd>GETメソッドで取得します(デフォルト)。h5.scene.method.GETと同値なのでこれを指定してもよいです。</dd>
		 *            <dt>"post"</dt>
		 *            <dd>POSTメソッドで取得します。h5.scene.method.POSTと同値なのでこれを指定してもよいです。</dd>
		 *            <dd>ブラウザバック等で再表示はできなくなります。</dd>
		 *            </dl>
		 * @param {Object} [param.serverArgs]
		 *            toの設定値がHTMLページのURLである場合に有効。AjaxでのHTMLデータ取得時のパラメーターを指定します。jQuery.ajaxの引数のdataプロパティに相当します。ただし、直下メンバーの各値として配列以外のオブジェクトは設定できません。値の配列については、その要素にオブジェクトは設定できません。
		 * @returns {Promise} Promiseオブジェクト。遷移完了時にresolveを実行します。
		 * @memberOf SceneContainerController
		 */
		navigate: function(param) {

			// TODO(鈴木) paramが文字列の場合は遷移先と見なして再帰呼び出しする
			if (isString(param)) {
				return this.navigate({
					to: param
				});
			}

			// 渡されたパラメータを覚えておく
			// シーン遷移後のコールバックで使用し、_navigateEndが終わったら破棄する
			this._navigateParam = param;

			param = $.extend(true, {}, param);

			this._transition = new defaultTransitionController();

			// TODO(鈴木) シーンコンテナ下はコントローラーを管理
			var fromElm = (this._currentController || {}).rootElement;

			// TODO(鈴木) インジケーターは遷移処理発動直後に表示する必要がある(余計な操作をさせないため)
			// fromは設定しているが使っていない。toはここでは指定できない。
			this._transition.onChangeStart(this.rootElement, fromElm);

			var dfd = this._dfd = h5.async.deferred();

			// TODO(鈴木) navigate経由で_navigateを実行したか否か
			this._isNavigated = true;

			var to = param.to;

			if (this.isMain && param.navigationType !== NAVIGATION_TYPE.SILENT) {

				// TODO(鈴木) メインシーンコンテナで、URL変更を伴う場合

				if (!isString(to)) {
					// TODO(鈴木) シーン遷移先に文字列以外を指定されたらエラー
					throwFwError(ERR_CODE_CHANGE_SCENE_TO_IS_NOT_STRING, [to]);
				}

				if (to.indexOf('#') !== -1) {
					// TODO(鈴木) シーン遷移先にハッシュを指定されたらエラー
					throwFwError(ERR_CODE_CHANGE_SCENE_HASH_IN_TO, [to]);
				}

				if (param.method === METHOD.POST) {
					this._detour.serverArgs = param.serverArgs;
					delete param.serverArgs;
				}

				if (param.navigationType === NAVIGATION_TYPE.ONCE || param.method === METHOD.POST) {
					this._detour.args = h5.u.obj.deserialize(h5.u.obj.serialize(param.args));
					delete param.args;
				}

				var replaceHistory = param.replaceHistory;
				delete param.replaceHistory;

				var url = convertParamToUrl(param);

				// 現URLと次のURLが同一の場合は処理しないほうがよいか。。
				// 処理した場合、履歴は積まれないので、アニメーション的に遷移したとみなされるようなものはしないほうがいい。
				//				if (this._router.compareUrl(url)) {
				//					this._dfd.resolve({
				//						from : fromElm,
				//						to : null
				//					});
				//					// インジケーター消すだけ用のイベント作らないといけない。。
				//					this._transition.onChangeEnd(this.rootElement, fromElm);
				//					this._isNavigated = false;
				//					this._dfd = null;
				//					this._transition = null;
				//					return;
				//				}

				this._router.navigate(url, {
					replaceHistory: replaceHistory
				});

			} else {

				// TODO(鈴木) URL変更を伴わない場合

				var url = convertParamToUrl(param);
				this._router.evaluate(url, {
					container: this
				});
			}

			return dfd.promise();
		},

		/**
		 * 現在のシーンのタイトルの設定
		 *
		 * @memberOf SceneContainerController
		 * @param {string} title タイトル文字列
		 */
		setTitle: function(title) {
			this._title = title;
			if (this.followTitle) {
				document.title = title;
			}
		},

		/**
		 * 現在のシーンのタイトルの取得
		 *
		 * @memberOf SceneContainerController
		 * @returns {string} 現在のシーンのタイトル
		 */
		getTitle: function() {
			return this._title;
		},

		/**
		 * シーン遷移内部処理
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param to
		 * @param param
		 */
		_navigate: function(to, param) {

			if (!to) {
				return;
			}

			param = param || {};

			// TODO(鈴木) シーンコンテナ下はコントローラーを管理
			var fromElm = (this._currentController || {}).rootElement;

			// navigateメソッド経由でない場合
			if (!this._isNavigated) {
				this._transition = new defaultTransitionController();
				this._transition.onChangeStart(this.rootElement, fromElm);
			}

			// 現在のページの全てのコントローラを削除
			if (fromElm) {
				disposeAllControllers(fromElm);
			}

			var that = this;

			var args = null;
			if (param.navigationType === NAVIGATION_TYPE.ONCE || param.method === METHOD.POST) {
				if (!this._isNavigated) {
					this._onNotReshowable(param);
					return;
				}
				args = this._detour.args;
				delete this._detour.args;
			} else {
				args = param.args;
			}

			var serverArgs = null;
			if (param.method === METHOD.POST) {
				serverArgs = this._detour.serverArgs;
				delete this._detour.serverArgs;
			} else {
				serverArgs = param.serverArgs;
			}

			// TODO(鈴木) transitionをコントローラーからFunctionに変更

			// TODO(鈴木) TransitionController変更に伴う変更
			// 次のコンテンツのロードはこちらで行う。
			// 将来、コントローラー・DOMを保存して使用する場合に、それらのハンドリングはシーンコンテナで行うほうがよいと思われるため。
			// 更にその先で、これらの処理も外部指定が可能なようにする。

			// TODO(鈴木) 処理順を以下に変更
			// HTMLロード→(ツリーにはappendせず)DOM生成→属性に基づきコントローラーをロード・バインド
			// →シーンルートとなるコントローラーのDOMを既存と入れ替える
			// (現状はコンテナ以下をそのまま入れている。コンテナ内にDOM的にシーンが複数あるケースは未対応)

			if (isString(to)) {
				if (controllerRegexp.test(to)) {

					// TODO(鈴木) 遷移先指定がコントローラーの__name属性の場合
					loadController(to, $('<div></div>'), args).done(function(toController) {
						that._navigateEnd(toController, param);
					});

				} else {

					// TODO(鈴木) 遷移先指定がHTMLの場合

					var loadPromise = loadContents(to, param.method, serverArgs);

					function callback(toElm) {

						// TODO(鈴木)
						// DATA属性に基づいてコントローラーバインド・コンテナ生成
						// TODO(鈴木) scan用にダミーのDIVにappend
						scanForContainer($('<div></div>').append(toElm), null, args).done(
								function(toController) {
									that._navigateEnd(toController, param);
								});

					}

					loadPromise.done(callback).fail(function(xhr) {

						// シーン遷移先HTMLのロードに失敗
						throwFwError(ERR_CODE_HTML_LOAD_FAILED, [to], xhr);

					});
				}

			} else if (to.__name && controllerRegexp.test(to.__name)) {

				// TODO(鈴木) 遷移先指定がコントローラーの場合

				that._navigateEnd(to, param);

			}

		},

		/**
		 * シーン遷移時コントローラーロード後処理
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param toController
		 * @param param
		 */
		_navigateEnd: function(toController, param) {

			var that = this;

			var fromElm = (this._currentController || {}).rootElement;

			var toElm = toController.rootElement;

			that._currentController = toController;

			// タイトルを決定する
			var title = param && param.title;
			if (title == null) {
				// 指定無しの場合
				var isController = this._navigateParam
						&& controllerRegexp.test(this._navigateParam.to);
				if (isController && toController[CONTROLLER_SCENE_TITLE] != null) {
					// 遷移先指定がコントローラの場合、プロパティから取得
					this.setTitle(toController[CONTROLLER_SCENE_TITLE]);
				} else {
					// 遷移先指定がコントローラでない場合(=ページURLの場合)は表示されている要素から設定
					var title = this._getTitleFromCurrentScene();
					if (title != null) {
						this.setTitle(title);
					}
				}
			} else {
				this.setTitle(title);
			}

			this._navigateParam = null;

			this._transition.onChange(this.rootElement, toElm).done(this.own(function() {

				// TODO(鈴木) disposeのタイミングはどうすべきか・・

				if (this._dfd) {
					this._dfd.resolve({
						from: fromElm,
						to: toElm
					});
				}

				if (fromElm) {
					$(fromElm).remove();
				}

				// TODO(鈴木) インジケータ非表示
				that._transition.onChangeEnd(that.rootElement, fromElm, toElm);

				that._isNavigated = false;
				that._dfd = null;
				that._transition = null;

			}));
		},

		/**
		 * 現在表示されているシーン要素からタイトルを抽出して設定する
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @returns {string|undefined} シーン要素から取得したタイトル文字列(未定義の場合はundefined)
		 */
		_getTitleFromCurrentScene: function() {
			var elm = this._currentController.rootElement;
			var dataTitle = $(elm).find('[data-' + DATA_SCENE_TITLE + ']').data(DATA_SCENE_TITLE);
			if (dataTitle != null) {
				// data-title指定
				return dataTitle;
			}
			// titleタグ
			var $title = $(elm).find('title');
			if ($title.length) {
				return $title.text();
			}
		},

		/**
		 * シーン再表示不可時処理
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param {Object} param
		 */
		_onNotReshowable: function(param) {
			if (notReshowable.__name && controllerRegexp.test(notReshowable.__name)) {

				// TODO(鈴木) notReshowable指定がコントローラーの場合

				var notReshowableController = h5internal.core.controllerInternal($('<div></div>'),
						notReshowable, {
							_notReshowableMessage: notReshowableMessage
						});
				this._navigateEnd(notReshowableController, param);

			} else {

				// TODO(鈴木) notReshowable指定がコントローラー以外の場合

				var navigateParam = null;
				if (isString(notReshowable)) {
					navigateParam = {
						to: notReshowable
					};
				} else {
					navigateParam = $.extend(true, {}, notReshowable);
				}
				navigateParam.args = navigateParam.args || {};
				navigateParam.args._notReshowableMessage = notReshowableMessage;
				this._navigate(navigateParam.to, navigateParam);
			}
		},

		/**
		 * Router用デフォルトコールバック
		 * <p>
		 * </p>
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param {String} url
		 */
		_defaultFuncForRouter: function(url) {
			var that = this;
			var param = getParamFromUrl(url);
			var to = param.to;

			// TODO(鈴木) メインシーンコンテナかつ初回表示時
			if (this.isMain && this._first) {

				// TODO(鈴木) シーン遷移タイプが'once'(一回のみ)、またはAjaxメソッドタイプが'post'の場合、
				// 再表示不可エラー画面を表示する。
				if (param.navigationType === NAVIGATION_TYPE.ONCE || param.method === METHOD.POST) {
					this._onNotReshowable(param);
					this._first = false;
					return;
				}

				var isController = to && controllerRegexp.test(to);
				var useHash = urlHistoryActualMode === URL_HISTORY_ACTUAL_MODE.HASH
						&& location.hash.substring(1);
				var converted = !this._router.compareUrl(url);

				// TODO(鈴木) 初回読み込みでHTMLの場合でURLそのまま使用する場合は、
				// 単にscanForContainerする。
				if (!converted && !useHash && !isController) {
					function callback(controller) {
						that._currentController = controller;
						that._transition
								.onChangeEnd(that.rootElement, null, controller.rootElement);
						that._transition = null;

						// タイトルの設定
						var title = that._getTitleFromCurrentScene();
						if (title != null) {
							that.setTitle(title);
						}
					}
					scanForContainer(this.rootElement, null, param.args).done(callback);
					this._first = false;
					return;
				}

			}

			to = to || location.pathname + location.search;
			to = clearParam(to);
			if (this._first) {
				this._navigated = true;
			}
			this._navigate(to, param);
			this._first = false;
		}
	};

	/**
	 * シーンコンテナインスタンスを生成します.
	 *
	 * @memberOf h5.scene
	 * @param {Element} element シーンコンテナ生成対象要素。
	 * @param {Boolean} [isMain=false] メインシーンコンテナとするか否か。
	 *            <dl>
	 *            <dt>メインシーンコンテナとする
	 *            <dt>
	 *            <dd>true</dd>
	 *            <dt>メインシーンコンテナとしない</dt>
	 *            <dd>false(デフォルト)</dd>
	 *            </dl>
	 * @returns {SceneContainerController} 生成したシーンコンテナのインスタンス。
	 */
	function createSceneContainer(element, isMain) {

		// TODO(鈴木) element指定なしの場合はdiv要素を作って設定
		if (element == null) {
			element = $('<div></div>').get(0);
		}

		// TODO(鈴木) コンテナ生成済みであればエラー。判定方法は見直しが必要か。
		if ($(element).is('[' + DATA_H5_DYN_CONTAINER_BOUND + ']')) {
			throwFwError(ERR_CODE_CONTAINER_ALREADY_CREATED);
		}

		// タイトル追従するかどうか(メインシーンコンテナの場合はデフォルトtrue)
		// メインシーンコンテナでない場合は追従しない
		var followTitle = isMain;
		if (isMain) {
			if ($(element).is(':not([' + DATA_H5_MAIN_CONTAINER + '])')) {
				$(element).attr(DATA_H5_MAIN_CONTAINER, DATA_H5_MAIN_CONTAINER);
			}
		} else {
			if ($(element).is(':not([' + DATA_H5_CONTAINER + '])')) {
				$(element).attr(DATA_H5_CONTAINER, DATA_H5_CONTAINER);
			}
			followTitle = h5.settings.scene.followTitle;
		}

		var container = h5internal.core.controllerInternal(element, SceneContainerController, {
			isMain: isMain,
			followTitle: followTitle
		}, {
			async: false
		});

		$(element).attr(DATA_H5_DYN_CONTAINER_BOUND, DATA_H5_DYN_CONTAINER_BOUND);

		return container;
	}

	/**
	 * シーン機能の初回適用を行います。
	 * <p>
	 * ドキュメント全体に対し、DATA属性に基づいて、コントローラーのバインドとシーンコンテナの生成を行います。<br/> 2回目以降の実行は無視されます。
	 * </p>
	 *
	 * @memberOf h5.scene
	 */
	function init() {
		if (!isInited) {
			isInited = true;
			scan();
		}
	}

	/**
	 * メインシーンコンテナのインスタンスを取得します。
	 *
	 * @memberOf h5.scene
	 * @returns {SceneContainerController} メインシーンコンテナのインスタンス。未作成の場合はnull。
	 */
	function getMainSceneContainer() {
		return mainContainer;
	}

	/**
	 * 指定要素およびその配下のシーンコンテナを取得します
	 *
	 * @memberOf h5.scene
	 * @param {DOM|jQuery|stroing} [rootElement=document.body]
	 *            走査先頭要素。要素またはセレクタを指定します。指定しない場合はドキュメント全体を対象とします。
	 * @param {boolean} [option.deep=true] 子孫要素にバインドされているコントローラも含めるかどうか(デフォルトは含める)
	 * @returns {SceneContainerController[]} シーンコンテナの配列。
	 */
	function getSceneContainers(rootElement, option) {
		return h5.core.controllerManager.getControllers(rootElement || document.body, {
			name: SceneContainerController.__name,
			deep: option && option.deep === false ? false : true
		});
	}

	/**
	 * シーンコンテナを取得します
	 * <p>
	 * 第1引数に取得対象とする要素のdata-h5-scene-container属性まはたdata-h5-main-scene-container属性の値を文字列で指定します。該当する要素に対応するシーンコンテナを返します。
	 * </p>
	 *
	 * @memberOf h5.scene
	 * @param {String} name
	 *            取得対象とする要素のdata-h5-scene-container属性まはたdata-h5-main-scene-container属性の値を文字列で指定します。
	 * @returns {SceneContainerController} 該当するシーンコンテナ。ない場合はnullを返します。
	 */
	function getSceneContainerByName(name) {

		if (name == null) {
			return null;
		}

		var containers = getSceneContainers();

		if (containers.length === 0) {
			return null;
		}

		if (name) {
			for (var i = 0; i < containers.length; i++) {
				if (containers[i]._containerName === name) {
					return containers[i];
				}
			}
			return null;
		}

		return containers[0];

	}

	// =============================
	// Code on boot
	// =============================

	// フック
	h5internal.core.addControllerInstantiationHook(function(c) {
		// TODO controllerがすでにsceneプロパティを持っていたらエラーでよいか
		c.scene = new Scene(c);
	});

	// TODO autoInitがtrueの場合のみinit
	// TODO(鈴木) 暫定。とりあえず設定を有効化しました
	/**
	 * シーン機能の設定
	 * <p>
	 * 以下のプロパティの設定を行ってください。
	 * </p>
	 * <dl>
	 * <dt>followTitle</dt>
	 * <dd>type:boolean</dd>
	 * <dd>メインシーンコンテナでブラウザタイトルの追従を行うか(デフォルトtrue)</dd>
	 * <dt>clientQueryStringPrefix</dt>
	 * <dd>type:string</dd>
	 * <dd>シーン遷移パラメーター識別用プレフィクス。デフォルト空文字</dd>
	 * <dt>clientFWQueryStringPrefix</dt>
	 * <dd>type:string</dd>
	 * <dd>シーン遷移パラメーター識別用プレフィクス(FW用)。デフォルト"_h5_"</dd>
	 * <dt>urlHistoryMode</dt>
	 * <dd>type:string</dd>
	 * <dd>メインシーンコンテナURL履歴保持方法({@link h5.scene.urlHistoryMode}参照)。デフォルトは"'history"</dd>
	 * <dt>urlMaxLength</dt>
	 * <dd>type:integer</dd>
	 * <dd>シーン遷移先URL最大長。デフォルト1800</dd>
	 * <dt>baseUrl</dt>
	 * <dd>type:string|null</dd>
	 * <dd>ベースURL。デフォルトはnullで、hifiveを読み込んだページがカレントパスになります(空文字を指定した場合もnullと同じです)</dd>
	 * <dt>autoInit</dt>
	 * <dd>type:boolean</dd>
	 * <dd>ページロード時にドキュメント全体を探索して、DATA属性によるコントローラーバインドとシーンコンテナ生成を行うかどうか。デフォルトfalse</dd>
	 * </dl>
	 *
	 * @memberOf h5.settings
	 * @name scene
	 * @type {Object}
	 */
	h5.settings.scene = h5.settings.scene || {
		// デフォルト設定を記述
		followTitle: true,
		clientQueryStringPrefix: DEFAULT_CLIENT_QUERY_STRING_PREFIX,
		clientFWQueryStringPrefix: DEFAULT_CLIENT_FW_QUERY_STRING_PREFIX,
		urlHistoryMode: URL_HISTORY_MODE.HISTORY,
		urlMaxLength: URL_MAX_LENGTH,
		baseUrl: null,
		autoInit: false
	};
	$(function() {

		// シーン遷移パラメーター識別用プレフィクス
		clientQueryStringPrefix = h5.settings.scene.clientQueryStringPrefix;

		//  正規表現用文字列作成
		clientQueryStringPrefixForRegExp = clientQueryStringPrefix.replace(/\\/g, '\\\\');

		// シーン遷移パラメーター識別用プレフィクス(FW用)
		clientFWQueryStringPrefix = h5.settings.scene.clientFWQueryStringPrefix;

		// 正規表現用文字列作成
		clientFWQueryStringPrefixForRegExp = clientFWQueryStringPrefix.replace(/\\/g, '\\\\');

		// メインシーンコンテナURL履歴保持方法
		urlHistoryMode = h5.settings.scene.urlHistoryMode;

		// シーン遷移先URL最大長
		urlMaxLength = parseInt(h5.settings.scene.urlMaxLength);

		//  再表示不可画面
		notReshowable = NotReshowableController;

		// ベースURL
		baseUrl = h5.settings.scene.baseUrl;

		// TODO(鈴木) h5.settings.scene.routesからルーティングテーブルマージ
		var routes = [];
		if (h5.settings.scene.routes) {
			routes = routes.concat(h5.settings.scene.routes);
		}

		// TODO(鈴木) シーン用ルーティングテーブルをRouter用に変換。
		var routesForRouter = $.map(routes, function(route) {
			var test = route.test;
			if (isFunction(test)) {
				var _test = test;
				test = function(url) {
					var param = getParamFromUrl(url);
					return _test(url, param);
				};
			}
			return {
				test: test,
				func: function(url, contextualData) {
					contextualData = contextualData || {};
					var navigationInfo = route.navigationInfo;
					if (isFunction(navigationInfo)) {
						var param = getParamFromUrl(url);
						navigationInfo = navigationInfo(url, param);
					}
					if (navigationInfo == null) {
						var container = contextualData.container || mainContainer;
						container._defaultFuncForRouter(url);
						return null;
					}
					if (isString(navigationInfo)) {
						navigationInfo = {
							to: navigationInfo
						};
					}
					var result = convertParamToUrl(navigationInfo);
					return result;
				}
			};
		});

		// TODO(鈴木) デフォルト動作用定義追加。
		routesForRouter.push({
			test: /.*/,
			func: function(url, contextualData) {
				contextualData = contextualData || {};
				var container = contextualData.container || mainContainer;
				container._defaultFuncForRouter(url);
			}
		});

		// TODO(鈴木) Routerインスタンス生成
		router = new Router({
			routes: routesForRouter,
			urlHistoryMode: urlHistoryMode,
			baseUrl: baseUrl,
			urlMaxLength: urlMaxLength
		});


		// autoInit=trueの場合に全体を探索し、DATA属性によりコントローラーバインドとシーンコンテナ生成を行う。
		if (h5.settings.scene.autoInit) {
			init();
		}
	});

	// =============================
	// Expose to window
	// =============================
	/**
	 * @namespace
	 * @name scene
	 * @memberOf h5
	 */
	h5.u.obj.expose('h5.scene', {
		openWindow: openWindow,
		createSceneContainer: createSceneContainer,
		init: init,
		getMainSceneContainer: getMainSceneContainer,
		getSceneContainers: getSceneContainers,
		getSceneContainerByName: getSceneContainerByName,
		navigationType: NAVIGATION_TYPE,
		method: METHOD,
		urlHistoryMode: URL_HISTORY_MODE
	});

})();