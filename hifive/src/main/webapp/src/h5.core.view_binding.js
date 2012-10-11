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
/* h5.core.view_binding */
(function() {

	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	/** Node.ELEMENT_NODE。IE8-ではNodeがないので自前で定数を作っている */
	var NODE_TYPE_ELEMENT = 1;

	/** Node.COMMENT_NODE */
	var NODE_TYPE_COMMENT = 8;

	var DATA_H5_BIND = 'data-h5-bind';

	var DATA_H5_CONTEXT = 'data-h5-context';

	var DATA_H5_LOOP_CONTEXT = 'data-h5-loop-context';

	var DATA_H5_DYN_CTX = 'data-h5-dyn-ctx';

	var DATA_H5_DYN_VID = 'data-h5-dyn-vid';

	/** インラインコメントテンプレートのコメントノードの開始文字列 */
	var COMMENT_BINDING_TARGET_MARKER = '{h5bind ';

	/** 1つのバインド指定のターゲットとソースのセパレータ（「text:prop」の「:」） */
	var BIND_DESC_TARGET_SEPARATOR = ':';

	/** 複数のバインド指定のセパレータ（「text:prop1; attr(href):prop2」の「;」） */
	var BIND_DESC_SEPARATOR = ';';

	/** バインドターゲットのカッコ内を取得するための正規表現（「attr(href)」の「href」を取得） */
	var BIND_TARGET_DETAIL_REGEXP = /\(\s*(\S+)\s*\)/;


	var ERR_CODE_REQUIRE_DETAIL = 16000;
	var ERR_CODE_UNKNOWN_BIND_DIRECTION = 16001;


	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.core.view_binding');

	/* del begin */
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
	var contextUid = 0;

	/** viewUidカウンタ */
	var viewUid = 0;


	//MEMO バインド関係のマップのたどり方
	//(1)ソース -> 特定のビュー： srcToViewMap[srcIndex][viewUid] がビュー。
	//　srcIndexはbinding._usingContexts配列のソースオブジェクトのインデックス位置
	//(2)特定のビュー -> ソース： viewUid経由でたどれる。viewToSrcMap[viewUid] がソースオブジェクト。
	//ビュー -> ソースはbindingインスタンス単位ではなく、グローバルに管理（ビュー自体が実質シングルトンなので）。
	//(3)loop-contextの各要素と対応する（要素ごとの）ビュー：
	//binding._loopElementsMap[viewUid] = loopElementsArray;
	//loopElementsArrayのi番目にはビューのノードの配列が入っていて、ソース配列のi番目と対応。


	/**
	 * ビュー（viewUid） -> ソースオブジェクト のマップ。many:1。キーはviewUid、値はソースオブジェクト。
	 */
	var viewToSrcMap = {};

	// =============================
	// Functions
	// =============================

	function toArray(pseudoArray) {
		var ret = [];
		for ( var i = 0, len = pseudoArray.length; i < len; i++) {
			ret.push(pseudoArray[i]);
		}
		return ret;
	}

	function getSrcFromView(viewUid) {
		return viewToSrcMap[viewUid];
	}

	/**
	 * viewUidを返す。返される値は、1回のFWの生存期間中一意。（リロードされるとリセット）
	 */
	function getViewUid() {
		return viewUid++;
	}


	/**
	 * インラインコメントテンプレートノードを探す
	 *
	 * @private
	 * @param {Node} node 探索を開始するルートノード
	 * @param {String} id テンプレートID
	 * @retruns {Node} 発見したノード、見つからなかった場合はnull
	 */
	function findCommentBindingTarget(rootNode, id) {
		var childNodes = rootNode.childNodes;
		for ( var i = 0, len = childNodes.length; i < len; i++) {
			var n = childNodes[i];
			if (n.nodeType === NODE_TYPE_ELEMENT) {
				var ret = findCommentBindingTarget(n, id);
				if (ret) {
					//深さ優先で探索して見つかったらそこでリターン
					return ret;
				}
			} else if (n.nodeType === NODE_TYPE_COMMENT) {
				var nodeValue = n.nodeValue;
				if (nodeValue.indexOf(COMMENT_BINDING_TARGET_MARKER) !== 0) {
					//コメントが開始マーカーで始まっていないので探索継続
					continue;
				}

				var beginTagCloseBracketIdx = nodeValue.indexOf('}');
				if (beginTagCloseBracketIdx === -1) {
					//マーカータグが正しく閉じられていない
					continue;
				}

				var beginTag = nodeValue.slice(0, beginTagCloseBracketIdx);

				var id = beginTag.match(/id="([A-Za-z][\w-:\.]*)"/);
				if (!id) {
					//idが正しく記述されていない
					continue;
				} else if (id[1] === id) {
					//探しているidを持つインラインコメントテンプレートノードが見つかったのでリターン
					return n;
				}
			}
		}
		return null;
	}

	/**
	 * 別のコンテキストに属していない（＝現在のコンテキストに属している）バインド対象要素を返します。ネストしたコンテキストの中の対象要素は含まれません。
	 *
	 * @param {Node|Node[]} rootNodes ルート要素、またはルート要素の配列
	 * @returns {jQuery} 別のコンテキストに属していないバインド対象要素
	 */
	function $getBindElementInContext(rootNodes) {
		rootNodes = wrapInArray(rootNodes);

		var $bindElements = $();

		for ( var i = 0, len = rootNodes.length; i < len; i++) {
			var rootNode = rootNodes[i];

			//ルート要素がエレメントでない場合は何もしない
			if (rootNode.nodeType !== NODE_TYPE_ELEMENT) {
				continue;
			}

			//ルート要素で別のコンテキストが指定されている場合はそれ以下のノードは絶対に含まれない
			if (rootNode.getAttribute(DATA_H5_CONTEXT) != null
					|| rootNode.getAttribute(DATA_H5_LOOP_CONTEXT) != null) {
				continue;
			}

			var $filtered = $('[data-h5-bind]', rootNode).filter(
					function() {
						for ( var node = this; node != null; node = node.parentNode) {
							if (node === rootNode) {
								return true;
							}

							if (node.getAttribute(DATA_H5_CONTEXT) != null
									|| node.getAttribute(DATA_H5_LOOP_CONTEXT) != null) {
								return false;
							}
						}
						return true;
					});
			$bindElements = $bindElements.add($filtered);

			if (rootNode.getAttribute(DATA_H5_BIND) != null) {
				//ルートノード自体にdata-bindが書かれていれば、それも対象となる
				$bindElements = $bindElements.add(rootNode);
			}
		}

		return $bindElements;
	}

	/**
	 * 自分のコンテキストの直接の子供であるdata-context（またはdata-loop-context）を返します。
	 */
	function $getChildContexts(rootNodes, dataContextAttr) {
		var $childContexts = $();

		for ( var i = 0, len = rootNodes.length; i < len; i++) {
			var rootNode = rootNodes[i];

			//ルート要素がエレメントでない場合は別のコンテキストである可能性はない
			if (rootNode.nodeType !== NODE_TYPE_ELEMENT) {
				continue;
			}

			//ルート要素でコンテキストが指定されている場合それは必ず直接の子供
			if (rootNode.getAttribute(dataContextAttr) != null) {
				$childContexts = $childContexts.add(rootNode);
				continue;
			}

			//各ルートノードの子孫ノードから、直接の子供であるコンテキストノードを探す
			var $filtered = $('[' + dataContextAttr + ']', rootNode).filter(function() {
				var $this = $(this);

				var contextParent = $this.parent('[data-h5-context],[data-h5-loop-context]')[0];

				if (contextParent === undefined) {
					//undefinedということは、data-contextを持つ親ノードがなかったということ
					//ルート要素がdata-contextを持っている場合は事前にチェック済みなので、
					//ここではundefinedの場合だけ考えればよい
					return true;
				}
				return false;
			});

			$childContexts = $childContexts.add($filtered);
		}

		return $childContexts;
	}


	function isObservableItem(obj) {
		//TODO 厳密に判定
		// 10/21 福田追記
		// ObservableItemの場合もtrueを返す
		if (obj.addEventListener && obj.getModel && !$.isArray(obj)
				&& !h5.u.obj.isObservableArray(obj) || h5.u.obj.isObservableItem(obj)) {
			return true;
		}
		return false;
	}

	function updateBinding(rootElement, context, values) {
		//values = { prop1: newValue1, prop2: newValue2, ... }

		//自分のコンテキストに属しているバインディング対象要素を探す。
		var $bindElements = $getBindElementInContext(rootElement);

		//自分のコンテキスト中のバインド値を更新
		$bindElements.each(function() {
			var $this = $(this);
			var prop = $this.attr(DATA_H5_BIND);

			if (!(prop in values)) {
				return;
			}

			//TODO 特殊バインディング
			$this.text(values[prop]);
		});
	}


	/**
	 * データバインドを行う。context単位にsrc/viewの対応を保存。可能ならイベントハンドラを設定して、変更伝搬させる
	 *
	 * @param {Binding} binding バインディングインスタンス
	 * @param {Node|Node[]} rootNodes
	 *            データコンテキストを持つルートノード、またはルートノードの配列（テキストノードやコメントノードなどELEMENT以外が含まれる場合も有る）
	 * @param {Object} context データコンテキスト
	 * @param {Boolean} isLoopContext ループコンテキストかどうか
	 */
	function applyBinding(binding, rootNodes, context, isLoopContext) {
		//配列化（要素が直接来た場合のため）
		rootNodes = wrapInArray(rootNodes);

		var viewUid = getViewUid();

		//エレメントについては、ビュー->ソースをすぐにひけるようdata属性でviewUidを付加しておく
		for ( var i = 0, len = rootNodes.length; i < len; i++) {
			var rootElem = rootNodes[i];
			if (rootElem.nodeType === NODE_TYPE_ELEMENT) {
				$(rootElem).attr(DATA_H5_DYN_VID, viewUid);
			}
		}

		//loop-contextの場合はループ処理して終わり
		if (isLoopContext) {
			//loop-contextの場合は、ループのルートノードは必ず単一のノード
			var loopRootElement = rootNodes[0];

			binding._addBindingEntry(context, loopRootElement, viewUid);

			if (h5.u.obj.isObservableArray(context) && !binding._isWatching(context)) {
				var observeListener = function(event) {
					binding._observableArray_observeListener(event);
				};
				binding._listeners[binding._getContextIndex(context)] = observeListener;

				context.addEventListener('observe', observeListener);
			}

			var fragment = document.createDocumentFragment();

			var rootChildNodes = toArray(loopRootElement.childNodes);

			//ループ前に一旦内部要素をすべて外す
			$(loopRootElement).empty();

			//このループコンテキストの各要素に対応するノード（配列）を格納する配列
			var loopElementsArray = [];
			binding._loopElementsMap[viewUid] = loopElementsArray;

			for ( var i = 0, len = context.length; i < len; i++) {
				var loopNodes = [];

				//1要素分の内部ノードのクローンを作成
				for ( var j = 0, childLen = rootChildNodes.length; j < childLen; j++) {
					var clonedInnerNode = rootChildNodes[j].cloneNode(true); //deep copy

					loopNodes.push(clonedInnerNode);

					fragment.appendChild(clonedInnerNode);
				}

				//配列1要素分のノードリストを保存
				loopElementsArray[i] = loopNodes;

				//配列1要素分のバインディングを実行
				applyBinding(binding, loopNodes, context[i]);
			}

			//最後に、全ループ分のノードをルートに追加
			loopRootElement.appendChild(fragment);

			return;
		}

		//以下はloop-contextでない場合

		binding._addBindingEntry(context, rootNodes, viewUid);

		var isItem = isObservableItem(context);

		if (isItem && !binding._isWatching(context)) {
			//まだこのバインディングが監視していないオブジェクトの場合は監視を始める。
			//ソースデータコンテキストから対応するすべてのビューを知ることができるので、
			//ハンドラは1アイテムにつき1つバインドすれば十分。
			var changeListener = function(event) {
				binding._observableItem_changeListener(event);
			};
			binding._listeners[binding._getContextIndex(context)] = changeListener;

			context.addEventListener('change', changeListener);
		}

		//自分のコンテキストに属しているバインディング対象要素を探す
		//（rootElement自体がバインド対象になっている場合もある）
		var $bindElements = $getBindElementInContext(rootNodes);

		//各要素についてバインドする
		$bindElements.each(function() {
			doBind(this, context, isItem);
		});

		//data-context, data-loop-contextそれぞれについて、バインディングを実行
		applyChildBinding(binding, rootNodes, context, false);
		applyChildBinding(binding, rootNodes, context, true);
	}

	function applyChildBinding(binding, rootNodes, context, isLoopContext) {
		var dataContextAttr = isLoopContext ? 'data-h5-loop-context' : 'data-h5-context';

		//自分のコンテキストに属するdata-contextを探す
		var $childContexts = $getChildContexts(rootNodes, dataContextAttr);

		//内部コンテキストについてapplyBindingを再帰的に行う
		$childContexts.each(function() {
			var $this = $(this);
			var childContextProp = $this.attr(dataContextAttr);
			//contextがisObservableItemならgetでchildContextを取得する
			//TODO getContextValue()などで統一するか
			var childContext = isObservableItem(context) ? context.get(childContextProp)
					: context[childContextProp];

			applyBinding(binding, this, childContext, isLoopContext);
		});
	}

	/**
	 * データバインドの指定（data-bind属性の値）をパースします。
	 *
	 * @param {String} bindDesc バインド指定（data-bind属性の値）
	 * @returns {Object} パース済みのバインド指定
	 */
	function parseBindDesc(bindDesc) {
		var splitDescs = bindDesc.split(BIND_DESC_SEPARATOR);
		var target = [];
		var targetDetail = [];
		var prop = [];

		for ( var i = 0, len = splitDescs.length; i < len; i++) {
			var desc = splitDescs[i];
			if (desc.indexOf(BIND_DESC_TARGET_SEPARATOR) === -1) {
				var trimmed = $.trim(desc);
				if (trimmed.length > 0) {
					//ターゲット指定がない＝自動バインドの場合
					target.push(null);
					targetDetail.push(null);
					prop.push($.trim(desc));
				}
			} else {
				var sd = desc.split(BIND_DESC_TARGET_SEPARATOR);
				var trimmedTarget = $.trim(sd[0]);
				var trimmedProp = $.trim(sd[1]);

				var trimmedDetail = null;
				var detail = BIND_TARGET_DETAIL_REGEXP.exec(trimmedTarget);
				if (detail) {
					//attr(color) -> attr, colorに分離してそれぞれ格納
					trimmedDetail = detail[1];
					trimmedTarget = /(\S+)[\s\(]/.exec(trimmedTarget)[1];
				}

				if (trimmedTarget.length > 0 && trimmedProp.length > 0) {
					target.push(trimmedTarget);
					targetDetail.push(trimmedDetail);
					prop.push(trimmedProp);
				}
			}

		}

		var ret = {
			t: target,
			d: targetDetail,
			p: prop
		};
		return ret;
	}


	/**
	 * 指定されたエレメントに対して、data-bindで指示された方法で値をセットします。
	 */
	function doBind(element, context, isItem) {
		var bindDesc = parseBindDesc($(element).attr(DATA_H5_BIND));
		var targets = bindDesc.t;
		var details = bindDesc.d;
		var props = bindDesc.p;

		var $element = $(element);

		//targetsとpropsのlengthは必ず同じ
		for ( var i = 0, len = targets.length; i < len; i++) {
			var target = targets[i];
			var detail = details[i];
			var prop = props[i];

			var value;
			if (isItem) {
				value = context.get(prop);
			} else {
				value = context[prop];
			}

			if (target == null) {
				//自動指定は、inputタグならvalue属性、それ以外ならテキストノードをターゲットとする
				if (element.tagName === 'input') {
					target = 'attr';
					detail = 'value';
				} else {
					target = 'text';
				}
			}

			switch (target) {
			case 'text':
				$element.text(value);
				break;
			case 'html':
				$element.html(value);
				break;
			case 'class':
				$element.addClass(value);
				break;
			case 'attr':
				if (!detail) {
					throwFwError(ERR_CODE_REQUIRE_DETAIL);
				}
				$element.attr(detail, value);
				break;
			case 'style':
				if (!detail) {
					throwFwError(ERR_CODE_REQUIRE_DETAIL);
				}
				$element.css(detail, value);
				break;
			default:
				throwFwError(ERR_CODE_UNKNOWN_BIND_DIRECTION);
			}
		}
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	/**
	 * バインディングを管理します。
	 *
	 * @private
	 * @name Binding
	 * @class
	 */
	function Binding(target, dataContext) {
		if (target.nodeType !== undefined) {
			if (target.nodeType === NODE_TYPE_ELEMENT) {
				//エレメントノード

				this._srces = [target.cloneNode(true)];
				this._targets = [target];

				//バインドターゲットの親要素
				this._parent = target.parentNode;
			} else {
				//インラインコメントテンプレート（前段でクローンしてしまう？）
				var tempParent = document.createElement('div');
				tempParent.innerHTML = target;

				//TODO

				//this._parent = parentNode;
				//				this._marker = target;
				//				this._srces = target;
				//				this._targets = [target];
			}
		} else {
			//複数のノード

			//バインドターゲットの親要素
			this._parent = target[0].parentNode;

			var srcList = [];
			for ( var i = 0, len = target.length; i < len; i++) {
				srcList.push(target[i].cloneNode(true));
			}
			this._srces = srcList;
			this._targets = toArray(target);
		}

		//this._srcesは常に配列
		//クローンした初期状態のビューに、コンテキストごとに固有のIDを振っておく
		for ( var i = 0, len = this._srces.length; i < len; i++) {
			var $src = $(this._srces[i]);

			if ($src.attr('data-h5-context') || $src.attr('data-h5-loop-context')) {
				$src.attr(DATA_H5_DYN_CTX, contextUid++);
			}

			$src.find('[data-h5-context],[data-h5-loop-context]').each(function() {
				$(this).attr(DATA_H5_DYN_CTX, contextUid++);
			});
		}

		/**
		 * loop-contextの各インデックスがもつ要素（配列）を保持。 キー：viewUid、値：配列の配列。
		 * 値は、「あるviewUidのloop-contextのi番目（＝ここが1段目）の要素の配列（＝2段目）」になっている。
		 */
		this._loopElementsMap = {};

		/**
		 * このバインディングのルートデータコンテキスト
		 */
		this._rootContext = dataContext;

		/**
		 * 現在適用中のデータコンテキストを入れる配列。同じインスタンスは1つしか入らない。 この配列のインデックスをキーにしてビューを探す<br>
		 * TODO インデックスをキーとして使うため、使用しなくなったオブジェクトの場所にはnullが入り、次第にスパースな配列になってしまう。<br>
		 * 二重ポインタのようにして管理すればよいが、パフォーマンスに重大な影響が出るほどスパースになることはまれと考え、Deferredする。
		 */
		this._usingContexts = [];

		/**
		 * ソースオブジェクト -> ビュー のマップ。1:many。 キーは_usingContextsのインデックス。 値はさらにマップで、キー：viewUid,
		 * 値：ビューインスタンス（配列）。
		 */
		this._srcToViewMap = {};

		/**
		 * バインドUID（現在表示されているDOM）にひもづけているリスナー。キー：uid, 値：リスナー関数
		 */
		this._listeners = {};

		//TODO ルートが配列（LoopContext）の場合を考える
		//バインディングの初期実行
		applyBinding(this, this._targets, this._rootContext);
	}
	$.extend(Binding.prototype, {
		/**
		 * バインディングを再実行します。既存のビューは一度すべて削除されます。
		 *
		 * @memberOf Binding
		 * @private
		 */
		refresh: function() {
			//保存しておいたビューをクローン
			var fragment = document.createDocumentFragment();
			for ( var i = 0, len = this._srces.length; i < len; i++) {
				fragment.appendChild(this._srces[i].cloneNode(true));
			}

			//fragmentをappendする前にノードリストをコピーしておく
			var newTargets = toArray(fragment.childNodes);

			//新しいターゲットに対してバインディングを実行
			//TODO ルートが配列（LoopContext）の場合を考える
			applyBinding(this, newTargets, this._rootContext);

			//生成したノードを今のターゲット（の最初のノード）の直前に追加して
			this._parent.insertBefore(fragment, this._targets[0]);

			//既存のターゲットを削除
			for ( var i = 0, len = this._targets.length; i < len; i++) {
				this._parent.removeChild(this._targets[i]);
			}

			//ターゲットのポインタを更新
			this._targets = newTargets;
		},

		/**
		 * ObservableArrayの変更に基づいて、自分が管理するビューを更新します。
		 *
		 * @memberOf Binding
		 * @private
		 * @param event
		 */
		_observableArray_observeListener: function(event) {
			if (!event.isDestructive) {
				return;
			}

			var orgViews = this._getViewsFromSrc(event.target);
			if (!orgViews) {
				return;
			}

			for ( var vid in orgViews) {
				var $view = $(orgViews[vid]);

				switch (event.method) {
				case 'shift':
					break;
				case 'pop':
					break;
				}

				var contextId = $view.attr(DATA_H5_DYN_CTX);
				var contextSrc;

				//contextIdがない＝特定の要素によるループではない＝ルート全体以外の場合はあり得ない
				if (contextId == null) {
					contextSrc = this._srces;
				} else {
					for ( var j = 0, srcLen = this._srces.length; j < srcLen; j++) {
						contextSrc = $('[' + DATA_H5_DYN_CTX + '="' + contextId + '"]',
								this._srces[i])[0];
						if (contextSrc) {
							break;
						}
					}
				}

				contextSrc = wrapInArray(contextSrc);
				for ( var j = 0, ctxSrcLen = contextSrc.length; j < ctxSrcLen; j++) {
					var newView = contextSrc[j].cloneNode(true);
					$view[0].parentNode.insertBefore(newView, $view[0]);

					var oldUid = $view.attr('data-h5-dyn-bind');
					event.target.removeEventListener('change', this._listeners[oldUid]);
					removeBindingEntry(event.target, $view[0], oldUid);

					$view.remove();

					applyBinding(this, newView, event.target, true);
				}
			}
		},

		/**
		 * データアイテムまたはObservableItemのchangeイベントハンドラ
		 */
		_observableItem_changeListener: function(event) {
			var views = this._getViewsFromSrc(event.target);
			if (!views) {
				return;
			}

			for ( var vuid in views) {
				if (!views.hasOwnProperty(vuid)) {
					continue;
				}

				var view = views[vuid];

				//自分のコンテキストに属しているバインディング対象要素を探す
				var $bindElements = $getBindElementInContext(view);

				//各要素についてバインドする
				$bindElements.each(function() {
					doBind(this, event.target, true);

					//TODO oldValueがObsArray/ObsItemでnewValueが別インスタンスの場合はremoveListenerが必要

					//TODO newValueがobj/arrayでnot observableの場合はつぶしてapply
				});
			}
		},

		_isWatching: function(ctx) {
			var idx = this._getContextIndex(ctx);
			if (idx === -1) {
				return false;
			}
			return this._listeners[idx] != null;
		},

		_getContextIndex: function(ctx) {
			return $.inArray(ctx, this._usingContexts);
		},

		/**
		 * ソースオブジェクト -> ビュー(配列) のマップエントリ、ビューUID -> ソースオブジェクト のマップエントリを追加。
		 * エントリが存在する場合は上書き（ただし、そもそも二重登録は想定外）。
		 */
		_addBindingEntry: function(src, view, viewUid) {
			var srcIndex = this._getContextIndex(src);
			if (srcIndex === -1) {
				//ソースエントリ追加
				this._usingContexts.push(src);
				srcIndex = this._usingContexts.length - 1;
			}

			viewToSrcMap[viewUid] = src;

			var srcViewMap = this._srcToViewMap[srcIndex];
			if (!srcViewMap) {
				//マップオブジェクトを新規作成し、エントリ追加
				var mapObj = {};
				mapObj[viewUid] = view;
				this._srcToViewMap[srcIndex] = mapObj;
				return;
			}
			//マップエントリ追加
			srcViewMap[viewUid] = view;
		},

		/**
		 * ソースオブジェクト -> ビュー のマップエントリを削除（特定のビューへのマップのみを削除）
		 */
		_removeBindingEntry: function(src, viewUid) {
			var srcIndex = this._getContextIndex(src);
			if (srcIndex === -1) {
				return;
			}

			if (viewToSrcMap[viewUid]) {
				//viewUid -> ソースオブジェクト のマップエントリを削除
				delete viewToSrcMap[viewUid];
			}

			var viewMap = this._srcToViewMap[srcIndex];
			//			if (!viewMap) {
			//				return;
			//			}

			if (viewMap[viewUid]) {
				//ソースオブジェクト -> ビュー（viewUid経由） のマップエントリを削除
				delete viewMap[viewUid];
			}
		},

		_getViewsFromSrc: function(src) {
			var srcIndex = this._getContextIndex(src);
			if (srcIndex === -1) {
				return null;
			}
			return this._srcToViewMap[srcIndex];
		}

	});

	function createBinding(elements, context) {
		return new Binding(elements, context);
	}


	// =============================
	// Expose to window
	// =============================

	h5internal.view = {};
	h5internal.view.createBinding = createBinding;

})();
