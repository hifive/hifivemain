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
	var DATA_H5_CONTAINER = 'data-h5-container';

	/**
	 * メインシーンコンテナ指定用データ属性名
	 */
	var DATA_H5_MAIN_CONTAINER = 'data-h5-main-container';

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
	/** エラーコード: 指定された遷移効果が存在しない */
	var ERR_CODE_TRANSITION_NOT_FOUND = 100007;
	/** エラーコード: シーンコンテナ生成済みの要素でシーンコンテナを作成しようとした */
	var ERR_CODE_CONTAINER_ALREADY_CREATED = 100008;
	/** エラーコード: シーン遷移先HTMLのロードに失敗した */
	var ERR_CODE_HTML_LOAD_FAILED = 100009;
	/** コンテナ生成済みマークがあるにも関わらず所定のコントローラーがバインドされていない */
	var ERR_CODE_CONTAINER_CONTROLLER_NOT_FOUND = 100010;

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.scene');

	/* del begin */
	//	var FW_LOG_H5_WHEN_INVALID_PARAMETER = 'h5.scene.when: 引数にpromiseオブジェクトでないものが含まれています。';
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
	errMsgMap[ERR_CODE_TRANSITION_NOT_FOUND] = '指定された遷移効果は存在しません。transition:{0}';
	errMsgMap[ERR_CODE_CONTAINER_ALREADY_CREATED] = '対象要素ですでにシーンコンテナが生成されているため、生成できません。';
	errMsgMap[ERR_CODE_HTML_LOAD_FAILED] = 'シーン遷移先HTMLのロードに失敗しました。to:{0}';
	errMsgMap[ERR_CODE_CONTAINER_CONTROLLER_NOT_FOUND] = '要素にコンテナ生成済みマークがあるにも関わらず所定のコントローラーがバインドされていません。';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);
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
	 * シーン機能初回適用判定フラグ
	 */
	var isInited = false;

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
			if(!h5internal.core.isDisposing(controllers[i])) {
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
	 * メインシーンコンテナが未生成で、h5.settings.scene.autoCreateMainContainerにtrueが設定されている場合、
	 * 所定の条件で対象要素および配下を走査し、最初の該当の要素でメインシーンコンテナを生成します。 条件の詳細については上述のリンクを参照してください
	 * </p>
	 * <p>
	 * シーンコンテナ要素配下は、デフォルトで表示されるシーン配下のみを対象とします。(現版ではシーンコンテナの複数シーンは未対応)
	 * このため、シーンコンテナ直下でないシーン要素は、シーンコンテナに所属していないとみなされ、その配下は処理対象とならないので注意が必要です。
	 * </p>
	 * <p>
	 * シーンコンテナ生成済み要素配下は走査対象となりません。追加要素を対象としたい場合ははその部分を指定するようにしてください。
	 * </p>
	 *
	 * @memberOf h5.scene
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
		// この時点でメインシーンコンテナにはdata-h5-main-container属性があるようにする。
		if (!mainContainer && h5.settings.scene.autoCreateMainContainer) {
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
						} else {
							console.debug('同一コントローラーバインド回避:' + attrControllerName);
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
	 * カレントシーンとなる要素の探索と、そのコントローラー指定なしの場合のダミーコントローラーバインドを行います。
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

		// TODO(鈴木) 処理対象がシーンコンテナである場合、スキップする実装が必要。

		// TODO(鈴木)
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
		if (dfd.state() !== 'resolved') {
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

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	// 子ウィンドウの場合
	if (window.opener) {
		new RMIReceiver();
	}

	function InvocationProxy() {

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
			console.info('シーンコンテナ直下先頭にシーン要素が見つからないため、シーン要素でラップします。');
			$children.wrapAll($('<div ' + DATA_H5_DEFAULT_SCENE + '></div>'));
			var name = $parent.attr(DATA_H5_CONTROLLER);
			if (name) {
				console.info('シーンコンテナのコントローラー指定をラップに使用したシーン要素に移動します。');
				// TODO(鈴木) childrenは↑のwrapAllで作成した要素
				$parent.removeAttr(DATA_H5_CONTROLLER).children().attr(DATA_H5_CONTROLLER, name);
			}
		}
	}

	/**
	 * HTML要素取得(通信)
	 * <p>
	 * 第二引数にコンテナ指定を追加。これが指定された場合、第一引数により取得したHTML内で、 data-h5-container属性の値がこれに一致する要素を対象とする。
	 * </p>
	 *
	 * @private
	 * @param source
	 * @param container
	 * @returns {Promise}
	 */
	function loadContentsFromUrl(source, container) {
		var dfd = h5.async.deferred();

		// TODO htmlだとスクリプトが実行されてしまうのでフルHTMLが返されるとよくない
		// 部分HTML取得の場合のことを考慮。
		var xhr = h5.ajax({
			url: source,
			dataType: 'html'
		});

		xhr.done(
				function(data) {

					// TODO(鈴木) ここでdataからbody部分のみ抜く。
					data = extractBody(data);

					var $dom = $($.parseHTML(data));

					if (container) {
						var $container = findWithSelf($dom, '[' + DATA_H5_CONTAINER + '="'
								+ container + '"]');
						if ($container.length === 0) {
							// ロードしたHTML内に指定のコンテナが存在しない場合はエラー
							throwFwError(ERR_CODE_TARGET_CONTAINER_NOT_FOUND, [source, container]);
						}
						$dom = $container.eq(0);
					} else {
						//TODO(鈴木) mainタグかdata-main-container属性要素があればその内容を対象とする。
						// 通常のシーンコンテナ内にmainとdata-main-containerはない前提。
						var main = findWithSelf($dom, '[' + DATA_H5_MAIN_CONTAINER + ']');
						// TODO(鈴木) 現状のフラグに基づいて遷移先のHTMLからメインシーンコンテナに該当する部分を抽出。
						// さすがに遷移先HTMLでのフラグ状態までは見られない。。
						if (h5.settings.scene.autoCreateMainContainer) {
							if (main.length === 0)
								main = findWithSelf($dom, 'main');
						}
						if (main.length > 0) {
							$dom = main.eq(0);
						}
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
	 * @param container
	 * @returns {Promise}
	 */
	function loadContents(source, container) {
		var dfd;

		if (isString(source)) {
			dfd = loadContentsFromUrl(source, container);
		} else {
			dfd = h5.async.deferred();

			var contentsRoot;
			if (source == null) {
				// 新しくdiv要素を生成
				contentsRoot = $.parseHTML(NEW_SCENE_HTML);
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
	 * シーン遷移効果登録
	 *
	 * @private
	 * @param type
	 * @param constructor
	 */
	function registerSceneTransition(type, constructor) {
		if (transitionTypeMap[type]) {
			//
		}
		transitionTypeMap[type] = constructor;
	}

	var DEFAULT_SCENE_TRANSITION_TYPE = 'default';

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

	registerSceneTransition(DEFAULT_SCENE_TRANSITION_TYPE, defaultTransitionController);

	/**
	 * pushState関数
	 *
	 * @private
	 * @param state
	 * @param title
	 * @param url
	 */
	function pushState(state, title, url) {
		history.pushState(state, title, url);
	}

	/**
	 * メインシーンコンテナインスタンス保持用
	 */
	var mainContainer = null;

	/**
	 * changeSceneの遷移先指定コントローラーか否かを判断する正規表現
	 */
	var controllerRegexp = /Controller$/;

	/**
	 * シーンコンテナクラス
	 * <p>
	 * 実体はコントローラーです。
	 * シーンコンテナを生成する場合はh5.scene.createSceneContainer()を使用してください。
	 * </p>
	 *
	 * @class
	 * @name SceneContainerController
	 */
	var SceneContainerController = {

		__name : 'h5.scene.SceneContainerController',

		/**
		 * メインシーンコンテナであるか否か
		 *
		 * @readOnly
		 * @type Boolean
		 * @memberOf SceneContainerController
		 */
		isMain : false,

		/**
		 * 画面遷移効果
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_transition : null,

		/**
		 * 現在表示しているシーンのコントローラー
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_currentController : null,

		/**
		 * リンククリックジャックによるシーン遷移の可否
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_isClickjackEnabled : false,

		/**
		 * シーン遷移時に使用するDeferredオブジェクト
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_dfd : null,

		/**
		 * changeScene経由で_changeSceneを実行したか否か
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		_isNavigated : false,

		/**
		 * __init
		 *
		 * @private
		 * @memberOf SceneContainerController
		 */
		__init : function(context) {

			var args = context.args || {};

			var element  = this.rootElement;
			var isMain = args.isMain;

			var that = this;

			this.isMain = !!isMain;

			if (this.isMain) {
				if (mainContainer) {
					// すでにメインシーンコンテナが生成されている場合にエラー
					throwFwError(ERR_CODE_MAIN_CONTAINER_ALREADY_CREATED);
				}
			}

			// TODO(鈴木) とりあえずデフォルトのtransitionを使用。
			this._transition = this._createTransition();
			this._transition.onChangeStart(element);

			this._containerName = $(element).attr(DATA_H5_MAIN_CONTAINER) || $(element).attr(DATA_H5_CONTAINER);

			// TODO(鈴木) シーンコンテナ下はコントローラーを管理
			this._currentController = null;

			// TODO(鈴木) コンテナ内にシーン要素がなければ追加する
			wrapScene(element);

			this.on('{rootElement}', EVENT_SCENE_CHANGE_REQUEST, this.own(this._onSceneChangeRequest));

			if (this.isMain) {

				mainContainer = this;

				this.on('{window}', 'popstate', this.own(this._onWindowPopstate));

				//_isClickjackEnabledがtrueの場合のみ有効。
				//TODO:フラグのセット方法
				if(this._isClickjackEnabled){
					this.on('{a}', 'click', this.own(this._onAClick));
				}

				// TODO(鈴木) メインシーンコンテナの場合、URLパラメータを取得して使用。
				// onPopStateを呼んでしまうと余計にHTMLを取りに行くことになるので、直接_changeSceneをto=elementで呼び出す。
				// URLからのパラメーター取得は現状では無効とする。
				// var params = toQueryParams((location.search ||
				// '').substring(1));
				var params = {};
				scanForContainer(element, null, params.args).done(
						function(toController) {
							that._currentController = toController;
							that._transition.onChangeEnd(that.rootElement,
									null, element);
							that._transition = null;
						});

			} else {

				// TODO(鈴木) カレントとなるシーンを探索してscan
				scanForContainer(element).done(
						function(controller) {
							that._currentController = controller;
							that._transition.onChangeEnd(that.rootElement,
									null, element);
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
		__dispose : function(){

			if(!h5internal.core.isDisposing(this._currentController)) {
				this._currentController.dispose();
			}

			this._currentController = null;
			$(this.rootElement).empty();
		},

		/**
		 * クリックジャックによる遷移
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param context
		 */
		_onAClick : function(context) {
			context.event.preventDefault();
			var href = context.event.originalEvent.target.href;
			this.changeScene(href);
		},

		/**
		 * 画面遷移時のpopState時のコールバック
		 *
		 * <p>
		 * メインシーンコンテナの場合のみ有効。
		 * </p>
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param context
		 */
		_onWindowPopstate : function(context) {
			// TODO(鈴木) 現状はURLでパラメーター渡しはしない
			// var params = toQueryParams((location.search || '').substring(1));
			// this._changeScene(location.href, params);
			this._changeScene(location.href);
			// TODO(鈴木) hrefからparamsに該当する部分を削除して使用したほうがよいか？
		},

		/**
		 * シーン遷移イベント発生時処理
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param context
		 */
		_onSceneChangeRequest : function(context) {
			context.event.stopPropagation();
			setTimeout(this.own(function() {
				this.changeScene(context.evArg);
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
		 * @param {String|Object} params
		 *            遷移先文字列、または遷移用オプション。
		 *            <p>
		 *            遷移先文字列の場合は、HTMLを返却するURLか、コントローラーの__name属性を指定します。<br>
		 *            遷移用オプションの場合は、以下のプロパティを持ちます。
		 *            </p>
		 * @param {String} params.to
		 *            遷移先指定。HTMLを返却するURLか、コントローラーの__name属性を指定します。指定必須です。
		 * @param {String}[params.transition='default']
		 *            遷移効果指定。指定しない場合は'default'が使用されます。(現在、'default'以外は指定できません)
		 * @param {String}[params.container]
		 *            toで指定される要素内の部分を表示する場合、その要素のdata-h5-container属性の値を指定します。
		 * @param {Any}[params.args]
		 *            デフォルトシーンに対応するコントローラー生成時に渡されるパラメータを指定します。
		 * @returns {Promise} Promiseオブジェクト。遷移完了時にresolveを実行します。
		 * @memberOf SceneContainerController
		 */
		changeScene : function(params) {

			// TODO(鈴木) paramが文字列の場合は遷移先と見なして再帰呼び出しする
			if (isString(params)) {
				return this.changeScene({
					to : params
				});
			}

			params = $.extend(true, {}, params);

			var to = params.to;

			this._transition = this._createTransition(params.transition);

			// TODO(鈴木) シーンコンテナ下はコントローラーを管理
			var fromElm = (this._currentController || {}).rootElement;

			// TODO(鈴木) インジケーターは遷移処理発動直後に表示する必要がある(余計な操作をさせないため)
			// fromは設定しているが使っていない。toはここでは指定できない。
			this._transition.onChangeStart(this.rootElement, fromElm);

			var dfd = this._dfd = h5.async.deferred();

			// TODO(鈴木) changeScene経由で_changeSceneを実行したか否か
			this._isNavigated = true;

			if (this.isMain) {

				// TODO(鈴木) メインシーンコンテナで遷移先がHTML(コントローラーでない)の場合は
				// paramsからtoを削除(URLに余計な情報を残さないため)
				if (!controllerRegexp.test(to)) {
					delete params.to;
				}

				if (!isString(to)) {
					// シーン遷移先に文字列以外を指定されたらエラー
					throwFwError(ERR_CODE_CHANGE_SCENE_TO_IS_NOT_STRING, [ to ]);
				}
				if (to.indexOf('#') !== -1) {
					// シーン遷移先にハッシュを指定されたらエラー
					throwFwError(ERR_CODE_CHANGE_SCENE_HASH_IN_TO, [ to ]);
				}
				if (controllerRegexp.test(to)) {
					// メインシーンコンテナで遷移先にコントローラーを指定されたらエラー(暫定)
					throwFwError(ERR_CODE_MAIN_CHANGE_SCENE_TO_IS_CONTROLLER,
							[ to ]);
				}

				// TODO(鈴木) パラメータをエンコードしてURLに付加
				// ※現在シリアライズ方式検討中のため、パラメータの付加はしない
				// to += ((to.indexOf('?') === -1) ? '?' : '&') +
				// $.param(params);

				pushState(null, null, toAbsoluteUrl(to));

				// TODO(鈴木) URLから遷移したいが、↑のためパラメータが付加されていないので、
				// 直接_changeSceneを呼ぶ。
				// onPopState();
				this._changeScene(to, h5.u.obj.deserialize(h5.u.obj
						.serialize(params)));

			} else {
				this._changeScene(to, h5.u.obj.deserialize(h5.u.obj
						.serialize(params)));
			}

			return dfd.promise();
		},

		/**
		 * シーン遷移内部処理
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param to
		 * @param params
		 */
		_changeScene : function(to, params) {

			params = params || {};

			// TODO(鈴木) シーンコンテナ下はコントローラーを管理
			var fromElm = (this._currentController || {}).rootElement;

			// changeSceneメソッド経由でない場合
			if (!this._isNavigated) {
				this._transition = this._createTransition(params.transition);
				this._transition.onChangeStart(this.rootElement, fromElm);
			}

			// 現在のページの全てのコントローラを削除
			if (fromElm) {
				disposeAllControllers(fromElm);
			}

			var that = this;

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

					// TODO(鈴木)
					loadController(to, $('<div></div>'), params.args).done(
							function(toController) {
								that._onLoadController(toController, fromElm);
							});

				} else {
					// TODO(鈴木) HTMLの対象部分抽出はloadContentsFromUrlに実装。
					// 1.2.0では、URLにパラメーターを保存しないため、メインシーンコンテナの場合はcontainer指定は無効とする
					var loadPromise = loadContents(to,
							(!this.isMain) ? params.container : null);

					loadPromise.done(
							function(toElm) {

								// TODO(鈴木) DATA属性に基づいてコントローラーバインド・コンテナ生成
								// TODO(鈴木) scan用にダミーのDIVにappend
								scanForContainer(
										$('<div></div>').append(toElm), null,
										params.args).done(
										function(toController) {
											that._onLoadController(
													toController, fromElm);
										});

							}).fail(function(xhr) {

						// シーン遷移先HTMLのロードに失敗
						throwFwError(ERR_CODE_HTML_LOAD_FAILED, [ to ], xhr);

					});
				}
			}

		},

		/**
		 * 遷移効果登録
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param type
		 */
		_createTransition : function(type) {
			var Transition = transitionTypeMap[type != null ? type
					: DEFAULT_SCENE_TRANSITION_TYPE];

			if (!Transition) {
				// 指定された遷移効果が存在しない場合はエラー
				throwFwError(ERR_CODE_TRANSITION_NOT_FOUND, [ type ]);
			}

			return new Transition();
		},

		/**
		 * シーン遷移時コントローラーロード後処理
		 *
		 * @private
		 * @memberOf SceneContainerController
		 * @param toController
		 * @param fromElm
		 */
		_onLoadController : function(toController, fromElm) {

			var that = this;

			var toElm = toController.rootElement;

			this._transition.onChange(this.rootElement, toElm).done(function() {

				// TODO(鈴木) disposeのタイミングはどうすべきか・・

				if (this._dfd) {
					this._dfd.resolve({
						from : fromElm,
						to : toElm
					});
				}

				if (fromElm) {
					$(fromElm).remove();
				}

				that._currentController = toController;

				// TODO(鈴木) インジケータ非表示
				that._transition.onChangeEnd(that.rootElement, fromElm, toElm);

				that._isNavigated = false;
				that._dfd = null;
				that._transition = null;

			});
		}

	};

	/**
	 * シーンコンテナインスタンスを生成します.
	 *
	 * @memberOf h5.scene
	 * @param {Element} element シーンコンテナ生成対象要素。
	 * @param {Boolean} [isMain=false]
	 *            メインシーンコンテナとするか否か。
	 *            <dl>
	 *            <dt>メインシーンコンテナとする<dt><dd>true</dd>
	 *            <dt>メインシーンコンテナとしない</dt><dd>false(デフォルト)</dd>
	 *            </dl>
	 * @returns {SceneContainerController} 生成したシーンコンテナのインスタンス。
	 */
	function createSceneContainer(element, isMain) {

		// TODO(鈴木) 対象要素配下にコンテナ、またはコントローラーバインド済みの要素がある場合はエラーとすべき

		// TODO(鈴木) element指定なしの場合はdiv要素を作って設定
		if (element == null) {
			element = $('<div></div>').get(0);
		}

		// TODO(鈴木) コンテナ生成済みであればエラー。判定方法は見直しが必要か。
		if ($(element).is('[' + DATA_H5_DYN_CONTAINER_BOUND + ']')) {
			throwFwError(ERR_CODE_CONTAINER_ALREADY_CREATED);
		}

		if (isMain) {
			if ($(element).is(':not([' + DATA_H5_MAIN_CONTAINER + '])')) {
				$(element).attr(DATA_H5_MAIN_CONTAINER, DATA_H5_MAIN_CONTAINER);
			}
		} else {
			if ($(element).is(':not([' + DATA_H5_CONTAINER + '])')) {
				$(element).attr(DATA_H5_CONTAINER, DATA_H5_CONTAINER);
			}
		}

		var container = h5internal.core.controllerInternal(element,
				SceneContainerController, {
					isMain : isMain
				}, {
					async : false
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
	function getMainContainer() {
		return mainContainer;
	}

	/**
	 * 指定要素およびその配下のシーンコンテナを取得します
	 *
	 * @memberOf h5.scene
	 * @param {Element}
	 *            [rootElement=document.body]
	 *            走査先頭要素。指定しない場合はドキュメント全体を対象とします。
	 * @returns {SceneContainerController[]} シーンコンテナの配列。
	 */
	function getAllSceneContainers(rootElement) {

		var containers = h5.core.controllerManager.getControllers(rootElement || document.body, {
			name: SceneContainerController.__name,
			deep: true
		});

		return containers;

	}

	/**
	 * シーンコンテナを取得します。
	 *
	 * @memberOf h5.scene
	 * @param {String|Element}
	 *            nameOrElement 文字列、要素が指定できます。
	 *            <dl>
	 *            <dt>文字列の場合</dt>
	 *            <dd>取得対象とする要素のdata-h5-container属性まはたdata-h5-main-container属性の値とみなし、その要素に対応するシーンコンテナを返却します。</dd>
	 *            <dt>要素の場合</dt>
	 *            <dd>その要素に対応するシーンコンテをを返却します。</dd>
	 *            </dl>
	 *            <p>いずれの場合も、該当がない場合はnullを返却します。</p>
	 * @returns {SceneContainerController} シーンコンテナ
	 */
	function getSceneContainer(nameOrElement) {

		if (nameOrElement == null)
			return null;


		var name = null, element = null;

		if (isString(nameOrElement)) {
			name = nameOrElement;
		}else{
			element = nameOrElement;
		}

		var containers = getAllSceneContainers(element);

		if(containers.length === 0){
			return null;
		}

		if(name){
			for(var i = 0; i < containers.length; i++){
				if(containers[i]._containerName === name){
					return containers[i];
				}
			}
			return null;
		}

		return containers[0];

	}

	/**
	 * シーン遷移イベントを発行します。
	 *
	 * @param {String|Object}
	 *            data
	 * @memberOf Controller
	 */
	function triggerSceneChange(data) {
		this.trigger(EVENT_SCENE_CHANGE_REQUEST, data);
	}

	/**
	 * このコントローラを直接包含しているシーンコンテナを取得します。
	 *
	 * <p>
	 * シーンコンテナ要素が存在しない、またはシーンコンテナ未生成の場合はnullを返却します。
	 * </p>
	 *
	 * @returns {SceneContainerController} シーンコンテナ
	 * @memberOf Controller
	 */
	function getParentSceneContainer() {
		var element = getParentContainer(this.rootElement);
		if (!element) {
			return null;
		}
		return getSceneContainer(element);
	}

	// =============================
	// Code on boot
	// =============================

	if (h5internal.core.controllerConstructor) {
		// Controllerのコンストラクタがあれば、sceneモジュール用の関数を追加
		h5internal.core.controllerConstructor.prototype.triggerSceneChange = triggerSceneChange;
		h5internal.core.controllerConstructor.prototype.getParentSceneContainer = getParentSceneContainer;
	}

	// TODO autoInitがtrueの場合のみinit
	// TODO(鈴木) 暫定。とりあえず設定を有効化しました
	h5.settings.scene = h5.settings.scene || {};
	$(function() {
		// TODO(鈴木) autoInit=trueの場合に全体を探索し、DATA属性によりコントローラーバインドとシーンコンテナ生成を行う。
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
		openWindow : openWindow,
		createSceneContainer : createSceneContainer,
		init : init,
		getMainContainer : getMainContainer,
		scan : scan,
		getAllSceneContainers : getAllSceneContainers,
		getSceneContainer : getSceneContainer
	});

})();
