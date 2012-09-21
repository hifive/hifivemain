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

	//var DATA_ATTR_UI = 'data-h5-ui'; //TODO 名前空間

	//TODO 規約化：動的に付加する属性には -dyn- をつける
	var DATA_ATTR_UID = 'data-h5-dyn-uid'; //TODO 名前空間

	//var DATA_ATTR_TEMPLATE_ID = 'data-h5-template-id';

	//var DATA_ATTR_BIND = 'data-h5-bind';

	//var SELECTOR_H5_TEMPLATE = 'script[type="text/x-h5-tmpl"][' + DATA_ATTR_TEMPLATE_ID + ']';


	var COMMENT_BINDING_TARGET_MARKER = '{h5bind';

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
	var getByPath = h5.u.obj.getByPath;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	// =============================
	// Variables
	// =============================

	//var compMap = {};

	var uid = 0;

	//var uiMap = {};

	//var activeBindingMap = {};

	var commentBindingTarget = {};

	/**
	 * データバインドのソースオブジェクトを入れる配列。同じインスタンスは1つしか入らない。 この配列のインデックスをキーにしてビューを探す。
	 */
	var bindingSrc = [];

	/**
	 * ソースオブジェクト -> ビュー のマップ。1:many。 キーはbindingSrcのインデックス。値はビューインスタンスへの配列。
	 */
	var srcToViewMap = {};

	var viewToSrcMap = {};

	/**
	 * loop-contextが指定されたノード ⇒ その内部ノードリスト のマップ。キーはdyn-bindのid。値はノードリスト配列。
	 */
	var contextToOriginalNodesMap = {};

	// =============================
	// Functions
	// =============================

	/**
	 * ソースオブジェクト -> ビュー のマップエントリを追加。すでにエントリが存在する場合は何もしない。
	 */
	function addBindingEntry(src, view, viewUid) {
		var srcIndex = $.inArray(src, bindingSrc);
		if (srcIndex === -1) {
			//ソースエントリ追加
			bindingSrc.push(src);
			srcIndex = bindingSrc.length - 1;
		}

		var viewMap = srcToViewMap[srcIndex];
		if (!viewMap) {
			//配列作成。
			srcToViewMap[srcIndex] = [view];
			return;
		}

		if ($.inArray(view, viewMap) === -1) {
			viewMap.push(view);
		}

		if (!viewToSrcMap[viewUid]) {
			viewToSrcMap[viewUid] = src;
		}
	}

	/**
	 * ソースオブジェクト -> ビュー のマップエントリを削除（特定のビューへのマップのみを削除）
	 */
	function removeBindingEntry(src, view, viewUid) {
		var srcIndex = $.inArray(src, bindingSrc);
		if (srcIndex === -1) {
			return;
		}

		var viewMap = srcToViewMap[srcIndex];
		if (!viewMap) {
			return;
		}

		var viewIndex = $.inArray(view, viewMap);
		if (viewIndex !== -1) {
			viewMap.splice(viewIndex, 1);
		}

		if (viewToSrcMap[viewUid]) {
			delete viewToSrcMap[viewUid];
		}
	}

	function getSrcFromView(viewUid) {
		return viewToSrcMap[viewUid];
	}

	function getViewsFromSrc(src) {
		var srcIndex = $.inArray(src, bindingSrc);
		if (srcIndex === -1) {
			return null;
		}
		return srcToViewMap[srcIndex];
	}



	function addContextNodeEntry(dynContextId, nodeList) {
		contextToOriginalNodesMap[dynContextId] = wrapInArray(nodeList);
	}

	function removeContextNodeEntry(dynContextId) {
		if (dynContextId in contextToOriginalNodesMap) {
			delete contextToOriginalNodesMap[dynContextId];
		}
	}

	function getOriginalNodeFromContextId(dynContextId) {
		return contextToOriginalNodesMap[dynContextId];
	}


	function getUid() {
		return uid++;
	}

	function addBindDestination(node) {
		//TODO idを取得して正しく計算
		commentBindingTarget[getUid()] = node;
	}

	/**
	 * コメントノードからテンプレートを取得する
	 *
	 * @param {Node} node 探索を開始するルートノード
	 */
	function findCommentBindingTarget(node) {
		var childNodes = node.childNodes;
		for ( var i = 0, len = childNodes.length; i < len; i++) {
			var n = childNodes[i];
			if (n.nodeType === Node.ELEMENT_NODE) {
				findCommentBindingTarget(n);
			} else if (n.nodeType === Node.COMMENT_NODE
					&& n.nodeValue.indexOf(COMMENT_BINDING_TARGET_MARKER) === 0) {
				addBindDestination(n);
			}
		}
	}

	/**
	 * コンテキストに属しているバインド対象要素を返します。ネストしたコンテキストの中の対象要素は含まれません。
	 *
	 * @param {Element} rootElement ルート要素
	 * @returns 要素
	 */
	function $getBindElementInContext(rootElement) {
		var $bindElements = $('[data-h5-bind]', rootElement).filter(
				function() {
					for ( var node = this; node != null; node = node.parentNode) {
						if (node === rootElement) {
							return true;
						}

						if (node.getAttribute('data-h5-context') != null
								|| node.getAttribute('data-h5-loop-context') != null) {
							return false;
						}
					}
				});
		return $bindElements;
	}

	/**
	 * 自分のコンテキストに属するdata-contextを返します。
	 */
	function $getChildContexts(rootElement, dataContextAttr) {
		var $childContexts = $('[' + dataContextAttr + ']', rootElement).filter(function() {
			var $this = $(this);

			var contextParent = $this.parent('[data-h5-context],[data-h5-loop-context]')[0];

			if (contextParent === undefined || contextParent === rootElement) {
				return true;
			}
			return false;
		});
		return $childContexts;
	}


	function isDataItem(obj) {
		if (obj.addEventListener) {
			return true;
		}
		return false;
	}

	function observableArray_observeListener(event) {
		var views = getViewsFromSrc(event.target);
		if (!views) {
			return;
		}

		for ( var i = 0, len = views.length; i < len; i++) {

		}
	}

	function dataItem_changeListener(event) {

		var views = getViewsFromSrc(event.target);
		if (!views) {
			return;
		}

		var newValues = {};
		for ( var p in event.props) {
			newValues[p] = event.props[p].newValue;
		}

		for ( var i = 0, len = views.length; i < len; i++) {
			updateBinding(views[i], event.target, newValues);
		}
	}

	function updateBinding(rootElement, context, values) {
		//values = { prop1: newValue1, prop2: newValue2, ... }

		//自分のコンテキストに属しているバインディング対象要素を探す。
		var $bindElements = $getBindElementInContext(rootElement);

		if ($(rootElement).attr('data-h5-bind') != null) {
			//add()は元のjQueryオブジェクトを変更せず、新しいセットを返す
			$bindElements = $bindElements.add(rootElement);
		}

		//自分のコンテキスト中のバインド値を更新
		$bindElements.each(function() {
			var $this = $(this);
			var prop = $this.attr('data-h5-bind');

			if (!(prop in values)) {
				return;
			}

			//TODO 特殊バインディング
			$this.text(values[prop]);
		});
	}



	/**
	 * データバインドを行う。
	 *
	 * @param {Element} rootElement データコンテキストを持つルート要素。ただし、コメントターゲットのルートの場合はdocumentFragmentになっている
	 * @param {Object} context データコンテキスト
	 */
	function applyBinding(rootElement, context, isFragmentRoot, isLoopContext) {
		if (!context) {
			return;
		}

		var isItem = isDataItem(context);

		if (!isFragmentRoot) {
			//context単位にsrc/viewの対応を保存。
			//可能ならイベントハンドラを設定して、変更伝搬させる
			var uid = getUid();
			$(rootElement).attr('data-h5-dyn-bind', uid);
			addBindingEntry(context, rootElement, uid);

			if (h5.u.obj.isObservableArray(context)) {
				context.addEventListener('observe', observableArray_observeListener);
			} else if (isItem) {
				context.addEventListener('change', dataItem_changeListener);
			}
		}

		//loop-contextの場合はループ処理して終わり
		if (isLoopContext) {
			var fragment = document.createDocumentFragment();

			var rootChildNodes = Array.prototype.slice.call(rootElement.childNodes, 0);

			//ループ前に内部の要素はすべて外す
			$(rootElement).empty();

			for ( var i = 0, len = context.length; i < len; i++) {
				//TODO 高速化の余地がある（古いブラウザへの対応に気を付けなければいけないが）
				for ( var j = 0, childLen = rootChildNodes.length; j < childLen; j++) {
					var clonedInnerNode = rootChildNodes[j].cloneNode(true); //deep copy
					if (clonedInnerNode.nodeType === Node.ELEMENT_NODE) {
						applyBinding(clonedInnerNode, context[i]);
					}
					fragment.appendChild(clonedInnerNode);
				}

			}

			rootElement.appendChild(fragment);

			return;
		}

		//以下はloop-contextでない場合

		//自分のコンテキストに属しているバインディング対象要素を探す。
		var $bindElements = $getBindElementInContext(rootElement);


		//コメントバインディングでない場合は、rootElement自体もバインド対象になり得る
		if (!isFragmentRoot && $(rootElement).attr('data-h5-bind') != null) {
			//add()は元のjQueryオブジェクトを変更せず、新しいセットを返す
			$bindElements = $bindElements.add(rootElement);
		}

		//各要素についてバインドする
		$bindElements.each(function() {
			var $this = $(this);
			var prop = $this.attr('data-h5-bind');

			//TODO 各種特別バインディング
			var value;
			if (isItem) {
				value = context.get(prop);
			} else {
				value = context[prop];
			}
			$this.text(value);
		});

		//data-context, data-loop-contextそれぞれについて、バインディングを実行
		applyChildBinding(rootElement, context, false);
		applyChildBinding(rootElement, context, true);
	}

	function applyChildBinding(rootElement, context, isLoopContext) {
		var dataContextAttr = isLoopContext ? 'data-h5-loop-context' : 'data-h5-context';

		//自分のコンテキストに属するdata-contextを探す
		var $childContexts = $getChildContexts(rootElement, dataContextAttr);

		//内部コンテキストについてapplyBindingを再帰的に行う
		$childContexts.each(function() {
			var $this = $(this);
			var childContextProp = $this.attr(dataContextAttr);
			var childContext = context[childContextProp];

			applyBinding($this[0], childContext, false, isLoopContext);
		});
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	function Binding(target, dataContext) {
		if (target.nodeType !== undefined) {
			//エレメントまたはコメントノード
			if (target.nodeType === Node.ELEMENT_NODE) {
				this._src = target.cloneNode(true);
			}
			//TODO comment-binding
			//			else {
			//				var tempParent = document.createElement('div');
			//				tempParent.innerHTML = target
			//				this._src = target;
			// 			}
			//this._isCommentTarget = true;
		} else {
			//NodeList
			var srcList = [];
			for ( var i = 0, len = target.length; i < len; i++) {
				srcList.push(target[i].cloneNode(true));
			}
			this._src = srcList;
		}

		this._target = target;

		this._context = dataContext;
		this._contextId = 0;
	}
	$.extend(Binding.prototype, {
		refresh: function() {

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
	h5internal.view.applyBinding = applyBinding;

})();
