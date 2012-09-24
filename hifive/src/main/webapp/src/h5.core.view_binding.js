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

	var DATA_H5_CONTEXT = 'data-h5-context';

	var DATA_H5_LOOP_CONTEXT = 'data-h5-loop-context';

	var DATA_H5_DYN_CTX = 'data-h5-dyn-ctx';


	//var DATA_ATTR_UI = 'data-h5-ui'; //TODO 名前空間

	//TODO 規約化：動的に付加する属性には -dyn- をつける
	var DATA_ATTR_UID = 'data-h5-dyn-uid'; //TODO 名前空間

	//var DATA_ATTR_TEMPLATE_ID = 'data-h5-template-id';

	//var DATA_ATTR_BIND = 'data-h5-bind';

	//var SELECTOR_H5_TEMPLATE = 'script[type="text/x-h5-tmpl"][' + DATA_ATTR_TEMPLATE_ID + ']';


	var COMMENT_BINDING_TARGET_MARKER = '{h5bind';

	var BIND_BEGIN_MARKER = '{h5bindmarker id="{0}"}';

	var BIND_END_MARKER = '{/h5bindmarker}';

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

	var markerUid = 0;

	var contextUid = 0;


	//var compMap = {};

	var uid = 0;


	//バインドUID（現在表示されているDOM）にひもづけているリスナー。キー：uid, 値：リスナー関数
	//TODO もっと良い方法考える
	var listeners = {};


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
		//TODO 厳密に判定
		if (obj.addEventListener && !$.isArray(obj) && !h5.u.obj.isObservableArray(obj)) {
			return true;
		}
		return false;
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
	function applyBinding(binding, rootElement, context, isLoopContext) {
		if (!context) {
			return;
		}

		var isItem = isDataItem(context);

		//context単位にsrc/viewの対応を保存。
		//可能ならイベントハンドラを設定して、変更伝搬させる
		var uid = getUid();
		$(rootElement).attr('data-h5-dyn-bind', uid);
		addBindingEntry(context, rootElement, uid);

		//TODO 高速化
		if (h5.u.obj.isObservableArray(context)) {
			var observeListener = function(event) {
				binding._observableArray_observeListener(event);
			};
			listeners[uid] = observeListener;

			context.addEventListener('observe', observeListener);
		} else if (isItem) {
			var changeListener = function(event) {
				binding._dataItem_changeListener(event);
			};
			listeners[uid] = changeListener;

			context.addEventListener('change', changeListener);
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
						applyBinding(binding, clonedInnerNode, context[i]);
					}
					fragment.appendChild(clonedInnerNode);
				}

			}

			rootElement.appendChild(fragment);

			return;
		}

		//以下はloop-contextでない場合

		//TODO 一番最初に来たとき、rootElementにdata-contextが書いてあると正しく動作しない。

		//自分のコンテキストに属しているバインディング対象要素を探す。
		var $bindElements = $getBindElementInContext(rootElement);

		//rootElement自体もバインド対象になり得る
		if ($(rootElement).attr('data-h5-bind') != null) {
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
		applyChildBinding(binding, rootElement, context, false);
		applyChildBinding(binding, rootElement, context, true);
	}

	function applyChildBinding(binding, rootElement, context, isLoopContext) {
		var dataContextAttr = isLoopContext ? 'data-h5-loop-context' : 'data-h5-context';

		//自分のコンテキストに属するdata-contextを探す
		var $childContexts = $getChildContexts(rootElement, dataContextAttr);

		//内部コンテキストについてapplyBindingを再帰的に行う
		$childContexts.each(function() {
			var $this = $(this);
			var childContextProp = $this.attr(dataContextAttr);
			var childContext = context[childContextProp];

			applyBinding(binding, $this[0], childContext, isLoopContext);
		});
	}


	function clearContents(markerBegin, markerEnd) {
		for ( var node = markerBegin.nextSibling; node; node = node.nextSibling) {
			if (node.nodeType !== Node.COMMENT_NODE || node !== markerEnd) {
				node.parentNode.removeChild(node);
			}

			if (node === markerEnd) {
				break;
			}
		}
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	function Binding(target, dataContext) {

		this._parent = target.parentNode;

		this._marker = document.createComment(h5.u.str.format(BIND_BEGIN_MARKER, markerUid++));

		//Endマーカーをターゲットの後ろに入れる
		this._markerEnd = document.createComment(BIND_END_MARKER);
		this._parent.insertBefore(this._markerEnd, target.nextSibling);

		if (target.nodeType !== undefined) {
			if (target.nodeType === Node.ELEMENT_NODE) {
				//エレメントノード

				//ターゲットの前にマーカーコメントノードを追加する。
				//これにより、バインディングの結果ターゲットノード自体がなくなってしまうような場合でも
				//どこにノードを追加すればよいか追跡し続けることができる
				this._parent.insertBefore(this._marker, target);
				this._src = [target.cloneNode(true)];
				$(target).remove();
			} else {
				//コメントノード
				var tempParent = document.createElement('div');
				tempParent.innerHTML = target;

				//TODO

				this._marker = target;
				this._src = target;
			}
		} else {
			//複数のノード
			var srcList = [];
			for ( var i = 0, len = target.length; i < len; i++) {
				srcList.push(target[i].cloneNode(true));
			}
			this._parent.insertBefore(this._marker, target[0]);
			this._src = srcList;
		}

		this._bindingId = contextUid++;

		//this._srcは常に配列
		//初期状態のノードに、コンテキストごとに固有のIDを振っておく
		for ( var i = 0, len = this._src.length; i < len; i++) {
			var $src = $(this._src[i]);

			if ($src.attr('data-h5-context') || $src.attr('data-h5-loop-context')) {
				$src.attr(DATA_H5_DYN_CTX, contextUid++);
			}

			$src.find('[data-h5-context],[data-h5-loop-context]').each(function() {
				$(this).attr(DATA_H5_DYN_CTX, contextUid++);
			});
		}

		this._context = dataContext;
	}
	$.extend(Binding.prototype, {
		refresh: function() {
			clearContents(this._marker, this._markerEnd);

			var fragment = document.createDocumentFragment();

			for ( var i = 0, len = this._src.length; i < len; i++) {
				var src = this._src[i].cloneNode(true);
				fragment.appendChild(src);
				if (src.nodeType === Node.ELEMENT_NODE) {
					applyBinding(this, src, this._context);
				}
			}
			this._parent.insertBefore(fragment, this._markerEnd);
		},

		_observableArray_observeListener: function(event) {
//			if (!event.isDestructive) {
//				return;
//			}

			var orgViews = getViewsFromSrc(event.target);
			if (!orgViews) {
				return;
			}

			var views = orgViews.slice(0);

			for ( var i = 0, len = views.length; i < len; i++) {
				$view = $(views[i]);
				var contextId = $view.attr(DATA_H5_DYN_CTX);
				var contextSrc;

				if (contextId == null) {
					contextSrc = this._src;
				} else {
					for ( var j = 0, srcLen = this._src.length; j < srcLen; j++) {
						contextSrc = $('[' + DATA_H5_DYN_CTX + '="' + contextId + '"]',
								this._src[i])[0];
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
					event.target.removeEventListener('change', listeners[oldUid]);
					removeBindingEntry(event.target, $view[0], oldUid);

					$view.remove();

					applyBinding(this, newView, event.target, true);
				}
			}
		},

		_dataItem_changeListener: function(event) {
			var views = getViewsFromSrc(event.target);
			if (!views) {
				return;
			}

			for ( var i = 0, len = views.length; i < len; i++) {
				var rootElement = views[i];

				//自分のコンテキストに属しているバインディング対象要素を探す。
				var $bindElements = $getBindElementInContext(rootElement);

				//rootElement自体もバインド対象になり得る
				if ($(rootElement).attr('data-h5-bind') != null) {
					//add()は元のjQueryオブジェクトを変更せず、新しいセットを返す
					$bindElements = $bindElements.add(rootElement);
				}

				//各要素についてバインドする
				$bindElements.each(function() {
					var $this = $(this);
					var prop = $this.attr('data-h5-bind');

					if (prop in event.props) {
						//TODO 各種特別バインディング
						var value = event.props[prop].newValue;
						$this.text(value);
						//TODO newValueがobj/arrayでnot observableの場合はつぶしてapply
					}

				});
			}
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
