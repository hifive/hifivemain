/*
 * Copyright (C) 2012 NS Solutions Corporation
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
/* h5init */
(function() {

	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	var DATA_ATTR_UI = 'data-h5-ui'; //TODO 名前空間

	//TODO 規約化：動的に付加する属性には -dyn- をつける
	var DATA_ATTR_UID = 'data-h5-dyn-uid'; //TODO 名前空間

	var DATA_ATTR_TEMPLATE_ID = 'data-h5-template-id';

	var DATA_ATTR_BIND = 'data-h5-bind';

	var SELECTOR_H5_TEMPLATE = 'script[type="text/x-h5-tmpl"][' + DATA_ATTR_TEMPLATE_ID + ']';


	var TEMPLATE_MARKER = '{h5tmpl}';

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5init');

	/* del begin */
	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	var getByPath = h5.u.obj.getByPath;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	// =============================
	// Variables
	// =============================

	var compMap = {};

	var uiSerialNumber = 0;

	var uiMap = {};

	// =============================
	// Functions
	// =============================

	function getUid() {
		return uiSerialNumber++;
	}

	/**
	 * コメントノードからテンプレートを取得する
	 *
	 * @param コメントノードを子に持つノード。（domまたはjQueryオブジェクト）
	 */
	function getTemplateFromCommentNode(nodes) {
		nodes = $(nodes);
		for ( var i = 0, len = nodes.length; i < len; i++) {
			if (nodes[i].nodeType === Node.COMMENT_NODE
					&& nodes[i].nodeValue.indexOf(TEMPLATE_MARKER) === 0) {
				return nodes[i].nodeValue.slice(TEMPLATE_MARKER.length);
			}
		}
	}





	function applyBinding(view, rootElement, template, dataItem, parentItem) {
		if (!dataItem) {
			return;
		}

		//thisはDataBindingインスタンス
		var that = this;

		function applyToView($elem, content, isHtml) {
			function getTargetAttr($elem) {
				var bindTarget = $elem.data('h5Bind'); //TODO キープレフィクス対応

				var attrBracketFrom = bindTarget.indexOf('{');
				if (attrBracketFrom > -1) { //TODO 判定ロジックはもっときちんとする
					var attrBracketTo = bindTarget.indexOf('}');
					if (attrBracketTo == -1) { //TODO === だとダメ？
						throw new Error();// throwFwError();
					}
					return bindTarget.substring(attrBracketFrom + 1, attrBracketTo);
				} else {
					return null; //属性ではない
				}
			}

			var targetAttr = getTargetAttr($elem);

			if (!targetAttr) {
				//子要素としてバインド
				if (isHtml) {
					$elem.html(content);
				} else {
					$elem.text(content);
				}
			} else {
				//属性に対するバインド
				$elem.attr(targetAttr, content); //TODO ここはエスケープ考えなくてよいか？？
			}

		} // End of applyToView

		//var target = getTarget(element, this.__controller.rootElement, true); //TODO getTarget
		var $target = $(rootElement); //elementはターゲットとなる親要素

		var $html = $('<div>').append($(template)); //RAW, 文字列でHTMLが来ているのでcloneは不要.



		//要素数分使うのでクローンする
		var $clone = $html.clone(); //TODO ループしなくなったので不要？？
		var uuid = createSerialNumber();

		//TODO createLocalDataModelのときはmanagerがnullなので
		//DataModelのfullnameは単純にモデル名になってしまう
		// -> DataModelに適当な一意名を付けておく

		//TODO bindingMapはここで作るのではなくループの中で作らないとダメ
		//プロパティが配列の場合があるから.

		addBindMapEntry(this, uuid, $clone.children(), this.dataModel, dataItem, parentItem);

		$clone.children().attr("data-h5-bind-guid", uuid);

		//			$clone.attr(getH5DataKey('bind-key'), uuid);

		//TODO $().find()は自分自身を探せないので仕方なく。後で変更。
		//var $cloneWrapper = $('<div></div>');
		//$clone.wrapAll($cloneWrapper);
		var $dataBind = $clone.find('*[' + getH5DataKey('bind') + ']'); //TODO andSelf


		//TODO dataItemは最初は必ず単品だが、再帰した時に中のプロパティが配列の場合があるので
		//配列で扱わざるを得ない。

		//TODO Model-1 : View-many の場合
		//モデル中の各要素について
		for ( var p in dataItem) {
			//pがdataItemに属していない可能性を考慮(ネストしたモデルの中に同名プロパティがあるかもしれない)

			var $dom = $dataBind.filter(function() {
				//					return $(this).attr('data-bind') === bindObjectName + '.' + p;

				//fwLogger.debug('attr = {0}, p = {1}', $(this).attr(getH5DataKey('bind')), p);

				//TODO この判定で大丈夫か？ []がある場合。もう少しきちんと判定しておくべきか
				return $(this).attr(getH5DataKey('bind')).lastIndexOf(p, 0) == 0;

				//					return $(this).attr(getH5DataKey('bind')) === p;
				//TODO 子オブジェクトのバインドもできるように
			});

			//見つかった要素をバインド
			$dom.each(function() {
				var $this = $(this);

				//				if($this.closest('[data-h5-bind-template]').length > 0) {
				//					//この要素は別のテンプレートに含まれているので処理しない
				//					return;
				//				}

				if ($this.is('[data-h5-bind-template="inner"]')) {
					//TODO tempコード
					var clonedInner = $this.html();

					$this.empty(); //innerなのでempty()にする。これは本当はBinding生成時に行う必要がある。
					//TODO 事前にいくつか要素が入っていた場合を考えると、emptyではなく data-h5-bind-template="this" のような属性を付けて行うべきかも。

					var childBindProp = $this.attr(getH5DataKey('bind')); //TODO hoisting
					applyBinding.call(that, view, this, clonedInner, dataItem[childBindProp],
							dataItem);
				} else if ($this.is('[data-h5-bind-template]')) {
					//var template = $this.attr('data-h5-bind-template');
					//TODO templateをindexOfするコードは…なんで必要なんだっけ？？

					var childBindProp = $this.attr(getH5DataKey('bind'));
					//fwLogger.debug('child templateId = {0}',$this.attr(getH5DataKey('bind-template')));

					//ネストしてテンプレートを適用
					applyBinding.call(that, view, this, view.get($this
							.attr(getH5DataKey('bind-template'))), dataItem[childBindProp],
							dataItem);
				} else {
					if (that.formatter) {
						var cv = that.formatter(dataItem, dataItem, p, dataItem[p]);

						if (cv === undefined) {
							var defaultFormatter = null;
							//TODO getByPathなどでやった方がよいかも
							if (dataItem.__dataModel && dataItem.__dataModel.descriptor
									&& dataItem.__dataModel.descriptor.prop[p]) {
								defaultFormatter = dataItem.__dataModel.descriptor.prop[p].format;
							}

							var val;
							if (defaultFormatter) {
								val = defaultFormatter(dataItem[p]);
							} else {
								val = dataItem[p];
							}
							applyToView($this, val, false);
						} else if ($.isPlainObject(cv)) {
							//TODO cv.valueがない場合のチェック

							if (cv.isHtml) {
								applyToView($this, cv.value, true);
							} else {
								applyToView($this, cv.value, false);
							}
						} else {
							applyToView($this, cv, false);
							//$this.text(cv); //TODO オブジェクトが子要素の場合を考える。パス表記を渡すようにする？？
						}
					} else {
						//TODO コピーしているので後できれいに
						var defaultFormatter = null;
						//TODO getByPathなどでやった方がよいかも
						if (dataItem.__dataModel && dataItem.__dataModel.descriptor
								&& dataItem.__dataModel.descriptor.prop[p]) {
							defaultFormatter = dataItem.__dataModel.descriptor.prop[p].format;
						}

						//TODO defaultFormatterでもHTMLを返せるようにする

						var val;
						if (defaultFormatter) {
							val = defaultFormatter(dataItem[p]);
						} else {
							val = dataItem[p];
						}


						applyToView($this, val, false);
						//$this.html(dataItem[p]);
					}
				}
			});

			//TODO inTransitionをいれるのはこのタイミングなく
			//Renderer側に寄せるのがよいかも（Rendererに制御の機会を与える）
			if (!parentItem && that.inTransition) {
				//Transitionをかけるのは、ルート要素に対してのみ。
				that.inTransition($target.get(0), $clone); //TODO children()以外の方法
			} else {
				$target.append($clone.children());
			}
		}
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	// =============================
	// <form>のバリデーション
	// =============================







	// =============================
	// UI部品生成
	// =============================


	function parseUIAttr(value) {
		var ret = {};

		//TODO 属性内の値がHTMLエスケープされている場合、どういう値が取れるのだろうか

		var params = value.split(';'); //TODO パラメータに;が入っているとバグ
		for ( var i = 0, len = params.length; i < len; i++) {
			var decl = $.trim(params[i]);

			var uiName;
			var opt = null;
			if (decl.lastIndexOf('}') > -1) {
				var optIdx = decl.indexOf('{');
				if (optIdx === -1) {
					throwFwError(0); //TODO 正しいエラーコード
				}
				uiName = decl.substring(0, optIdx);
				opt = decl.substr(optIdx);
			} else {
				uiName = decl;
			}

			ret[uiName] = opt;
		}

		return ret;
	}

	function createUIController(elem, controller, initParam) {

		var c = h5.core.controller(elem, controller, initParam);

		c.__controllerContext.isUI = true;

		//要素直下に存在するテンプレートを登録
		//TODO controllerのテンプレートをオーバーライドしないとダメ
		//controller側で「すでにテンプレートが存在したら上書きしない」ようにするのもアリか
		//TODO srcで外部ファイルが指定されたいた場合を考慮

		//		$(elem).children(SELECTOR_H5_TEMPLATE).each(function() {
		//			$this = $(this);
		//			var templateId = $this.attr(DATA_ATTR_TEMPLATE_ID);
		//			c.view.register(templateId, this.text);
		//
		//			//取得したテンプレートはDOMツリーから削除
		//			$this.remove();
		//		});

		return c;
	}

	/**
	 * 指定された要素がどのUI部品に含まれるかを返します。 引数で渡された要素がUI部品のルートの場合、その要素が返ります。
	 *
	 * @returns UI部品に対応したルート要素、その部品にも属さない場合はnull
	 */
	function findParentUI(elem) {
		var currentNode = elem;
		while (currentNode) {
			var uiAttr = currentNode.getAttribute(DATA_ATTR_UI);
			if (uiAttr) {
				return currentNode;
			}

			currentNode = currentNode.parentNode;
		}
		return null;
	}

	function applyBinding(elem) {}

	function init(elem) {
		var uiAttr = $(elem).attr(DATA_ATTR_UI);
		var ui = parseUIAttr(uiAttr);
		fwLogger.debug(ui);
		for ( var uiName in ui) {

			(function(uiName, elem) {
				//TODO 指定されたコントローラがなかったときのリゾルバを設定できるようにする（h5.settings.componentResolver/Locator = function(name){} みたいな感じ）
				//Resolveに失敗したら何もしない
				var controller = createUIController(elem, getByPath(compMap[uiName].controller),
						compMap[uiName].param);

				controller.preinitPromise.done(function() {
					//UIとして指定されたテンプレートで上書きする
					if (compMap[uiName].templates) {
						for ( var t in compMap[uiName].templates) {
							controller.view.register(t, compMap[uiName].templates[t]);
						}
					}

					fwLogger.debug('id = ' + elem.id);

					//さらに、DOMで個別に設定されていたらそれで上書きする
					$(elem).children('script[type="text/x-h5-tmpl"]').each(function() {
						var templateName = $(this).attr('data-h5-name');
						var template = this.text;
						fwLogger.debug('tName = {0}, t = {1}', templateName, template);
						controller.view.register(templateName, template);
					});
				});

				//			applyBinding(elem);

			})(uiName, elem);
		}
	}

	function populateUI($uis) {
		//UI部品にする
		$uis.each(function() {
			//			fwLogger.debug('CREATING UI = {0}', $(this).attr(DATA_ATTR_UI));
			//			fwLogger.debug(this);

			init(this);

			//UI化した要素にマーカーとして属性を付加
			//（この属性がある要素は2重にUI化しない）
			$(this).attr('data-h5-dyn-ui', '');
		});

	}

	//UIコンポーネントを初期化
	$(function() {
		//root以下からdata-h5-uiがついた要素を集める（!rootなら root = body）
		//ただし、テンプレート以下からは取得しない
		var $uis = $('[data-h5-ui]:not([data-h5-template] [data-h5-ui]):not([data-h5-dyn-ui])',
				'body');


		fwLogger.debug('new ui count = {0}', $uis.length);

		populateUI($uis);

		// data-h5-bind指定されている要素にバインドを行う
		bindModelData();
	});

	/**
	 * data-h5-bind指定されている要素について、データモデルのイベントと紐づける
	 */
	function bindModelData() {
		var $binds = $('[data-h5-bind^="@"]');
		var modelBindMap = {};
		$binds.each(function() {
			// TODO 文字列からモデルを取得。関数にして外に出す。
			var modelStr = $(this).data() && $(this).data().h5Bind;
			if (!modelStr) {
				return;
			}
			try {
				var matched = modelStr.match('^@(.*)$');
				var modelPath = matched[1];
				var split = modelPath.split('.');
				var modelName = split.splice(split.length - 1, 1);
				var managerName = split.splice(split.length - 1, 1);
				var manager = (split.length ? h5.u.obj.ns(split.join('.')) : window)[managerName];
				model = manager.models[modelName];
			} catch (e) {
				// モデルが取得できない時
				return;
			}
			// テンプレートの取得
			var tmpl = getTemplateFromCommentNode(this.childNodes);
			var $dom = $(this);

			// テンプレートにid情報を付加したものを生成する関数
			function getTmpl(id) {
				return
			}

			// アイテムを引数にとって、DOMに追加する関数
			function appendItem(item) {
				$tmpl =  $(tmpl).attr('data-h5-dyn-id', item[model.idKey]);
				for ( var prop in model.itemPropDesc) {
					var $target = $tmpl.find('*[data-h5-bind^="$curr.' + prop + '"]');
					if ($target.length) {
						$target.text(item[prop]);
					}
				}
				$dom.append($tmpl);
			}

			// 現在データモデルにあるアイテムを表示させる
			for ( var id in model.items) {
				var item = model.items[id];
				appendItem(item);
			}

			// イベントリスナの作成
			function listener(e) {
				// 新規作成されたもの
				for ( var i = 0, l = e.created.length; i < l; i++) {
					appendItem(e.created[i]);
				}

				// 値が変更されたもの
				for(var i = 0, l = e.changed.length; i < l; i++){
					var changeEv = e.changed[i];
					var id = changeEv.target[model.idKey];
					var $target = $dom.find('*[data-h5-dyn-id="'+id+'"]');
					if($target.length){
						for(var prop in changeEv.props){
							$target.find('*[data-h5-bind="$curr.'+prop+'"]').text(changeEv.props[prop].newValue);
						}
					}
				}

				// 削除されたもの
				for(var i = 0, l = e.removed.length; i < l; i++){
					var id = e.removed[i][model.idKey];
					$dom.find('*[data-h5-dyn-id="'+id+'"]').remove();
				}
			}
			model.addEventListener('itemsChange', listener);
		});
	}

	// =============================
	// Expose to window
	// =============================

	function refreshViewBefore(invocation, data) {
		for ( var viewProp in this.__controllerContext.def.view) {
			data[viewProp] = this.view[viewProp];
		}
		return invocation.proceed();
	}

	function refreshViewAfter(invocation, data) {
		for ( var viewProp in data) {
			if ((this.view[viewProp] !== data[viewProp])) {
				this.$find('[data-h5-bind="' + viewProp + '"]').text(this.view[viewProp]);
				continue;
			}

			if ($.isArray(this.view[viewProp])) {
				if (this.__controllerContext.isUI === undefined) {
					//						var listItem = this.$find('[data-h5-bind="$controller.' + viewProp + '"]')
					//								.children()[0];

					var nodes = this.$find('[data-h5-bind="$controller.' + viewProp + '"]')[0].childNodes;

					var $cloneItem = getTemplateFromCommentNode(nodes);

					//var $cloneItem = $(listItem).clone();

					var lastData = this.view[viewProp][this.view[viewProp].length - 1];

					var $currents = $cloneItem.find('[data-h5-bind^="$curr."]');
					for ( var i = 0, len = $currents.length; i < len; i++) {
						var curr = $currents[i];

						var bindProp = $(curr).attr('data-h5-bind').slice(6);
						fwLogger.debug('current target prop = {0}', bindProp);

						//.attr('data-h5-bind', null)

						$cloneItem.find('[data-h5-bind="$curr.' + bindProp + '"]').text(
								lastData[bindProp]);
					}


					this.$find('[data-h5-bind="$controller.' + viewProp + '"]').append($cloneItem);

					//preventDefault対応する？？
					$cloneItem.trigger('h5added', {
						controller: this,
						$html: $cloneItem
					});

					var $uis = $cloneItem.find('[data-h5-ui]:not([data-h5-dyn-ui])');
					populateUI($uis);
				}
			}
		}

	}

	var refreshViewInterceptor = h5.u.createInterceptor(refreshViewBefore, refreshViewAfter);

	var aspect = {
		target: '*Controller',
		pointCut: '*',
		interceptors: refreshViewInterceptor
	};

	h5.core.__compileAspects([aspect]);


	//TODO 仮
	h5.core.registerUI = function(ui) {
		//ui = { name: (UI部品名), controller: 'コントローラ名' または コントローラ定義オブジェクト, templates: 'テンプレートURL' または テンプレートオブジェクト }

		compMap[ui.name] = ui;
	};


	//TODO 正式には h5.core.controller.jsに組み込む
	var orgController = h5.core.controller;
	h5.core.controller = function(target, controller, param) {

		var v = controller.view;

		delete controller.view;

		var instance = orgController.call(h5.core, target, controller, param);

		$.extend(true, instance.view, v);

		controller.view = v;

		instance.__controllerContext.def = controller;

		//view.append()実行時にtarget以下のUI部品をインスタンス化する
		var appendOrg = instance.view.append;
		instance.view.append = function(target, templateId, param) {
			var ret = appendOrg.call(instance.view, target, templateId, param);

			var $uis = $(target).andSelf().find('[data-h5-ui]:not([data-h5-dyn-ui])');
			populateUI($uis);

			return ret;
		};

		instance.view.appendRaw = function(element, html) {
			var $html = $(html);

			$(element).append($html);

			$html.trigger('h5added', {
				controller: instance,
				$html: $html
			});

			//				return ret;
		};

		return instance;
	};


	var controller = {
		__name: 'FormController',
		__ready: function(context) {
			var $form = this.$find('form');
			$form.each(function() {
				var modelStr = $(this).attr('data-h5-model');
				if (!modelStr) {
					return;
				}
				var matched = modelStr.match('^@(.*)$');
				if(!matched) {
					return;
				}

				var modelPath = matched[1];
				var split = modelPath.split('.');
				var modelName = split.splice(split.length - 1, 1);
				var managerName = split.splice(split.length - 1, 1);
				var manager = (split.length ? h5.u.obj.ns(split.join('.')) : window)[managerName];
				model = manager.models[modelName];

				var $input = $(this).children('input').add(
						$('input[form="' + $(this).attr('id') + '"]'));
				$input.each(function() {
					var propName = $(this).attr('name');
					if (!model.schema[propName]) {
						return;
					}
					if ($(this).attr('placeholder') == undefined) {
						$(this).attr('placeholder', model.schema[propName].title);
					}
					if (!$(this).val()) {
						$(this).val(model.schema[propName].defaultValue);
					}
				});
			});


		},
		'input[type=submit] click': function(context) {
			//TODO novalidate指定があれば何もしない

			context.event.preventDefault();

			var target = context.event.target;
			var form = $(target.form);
			if (form == null) {
				//TODO IEの場合form指定していても、form外にあるinputからformを取得できないので、ケアする
			}

			if (this.checkForm(form)) {
				// formを送信する
				//				form.submit();
			}
		},
		'input blur': function(context) {
			var target = context.event.target;
			var $target = $(target);

			if ($target.attr('novalidate') !== undefined) {
				return;
			}
			var conditions = '';
			var errObj = h5.core.data.validateInput(target);
			for ( var i = 0, l = errObj.reasons.length; i < l; i++) {
				for ( var condition in errObj.reasons[i]) {
					conditions += condition + ':' + errObj.reasons[i][condition] + ' ';
				}
			}
			//IEだと非同期にしないとレンダリングに反映されない
			setTimeout(
					function() {
						$target.next('span').remove();
						if (conditions) {
							$target.after(h5.u.str.format(
									'<span class="validateError">次の条件を満たす必要があります。 {0}</span>',
									conditions));
						}
					}, 0);
		},
		checkForm: function(form) {
			var $form = $(form);
			var errors = h5.core.data.validateForm($form, manager);
			console.log(errors);
			return !errors.length;
		}
	};

	$(function() {
		h5.core.controller('body', controller);
	});

})();
