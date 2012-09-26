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

	var DATA_H5_BIND = 'data-h5-bind';

	var DATA_H5_CONTEXT = 'data-h5-context';

	var DATA_H5_LOOP_CONTEXT = 'data-h5-loop-context';

	var DATA_H5_DYN_CTX = 'data-h5-dyn-ctx';

	//bid = Bind ID
	var DATA_H5_DYN_BID = 'data-h5-dyn-bid';


	//var DATA_ATTR_UI = 'data-h5-ui'; //TODO 名前空間

	//TODO 規約化：動的に付加する属性には -dyn- をつける

	//var DATA_ATTR_TEMPLATE_ID = 'data-h5-template-id';

	//var DATA_ATTR_BIND = 'data-h5-bind';

	//var SELECTOR_H5_TEMPLATE = 'script[type="text/x-h5-tmpl"][' + DATA_ATTR_TEMPLATE_ID + ']';


	var COMMENT_BINDING_TARGET_MARKER = '{h5bind';

	var BIND_BEGIN_MARKER = '{h5bindmarker id="{0}"}';

	var BIND_END_MARKER = '{/h5bindmarker}';


	var BIND_DESC_TARGET_SEPARATOR = ':';

	var BIND_DESC_SEPARATOR = ';';

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
	var markerUid = 0;

	var contextUid = 0;


	//var compMap = {};

	var bindId = 0;


	//バインドUID（現在表示されているDOM）にひもづけているリスナー。キー：bindId, 値：リスナー関数
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
	 * loop-contextが指定されたノード ⇒ その内部ノードリスト のマップ。キーはdyn-bid。値はノードリスト配列。
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


	function getUniqueBindId() {
		return bindId++;
	}

	function addBindDestination(node) {
		//TODO idを取得して正しく計算
		commentBindingTarget[getUniqueBindId()] = node;
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

						if (node.getAttribute(DATA_H5_CONTEXT) != null
								|| node.getAttribute(DATA_H5_LOOP_CONTEXT) != null) {
							return false;
						}
					}
				});
		return $bindElements;
	}

	/**
	 * 自分のコンテキストに属するdata-context（またはdata-loop-context）を返します。
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
		if (obj.addEventListener && obj.getModel && !$.isArray(obj)
				&& !h5.u.obj.isObservableArray(obj)) {
			return true;
		}
		return false;
	}

	function updateBinding(rootElement, context, values) {
		//values = { prop1: newValue1, prop2: newValue2, ... }

		//自分のコンテキストに属しているバインディング対象要素を探す。
		var $bindElements = $getBindElementInContext(rootElement);

		if ($(rootElement).attr(DATA_H5_BIND) != null) {
			//add()は元のjQueryオブジェクトを変更せず、新しいセットを返す
			$bindElements = $bindElements.add(rootElement);
		}

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
		var bid = getUniqueBindId();
		if ($.isArray(rootElement)) {
			//同じコンテキストに複数の要素が含まれる場合は、Elementについてだけbidを割り当てる。
			//エレメント⇒ソースオブジェクト でないと高速にたどることはできないが、
			//ほとんどの場合エレメントを対象に探せれば十分（イベントハンドラなどの登録もエレメントでしかしないので）
			for ( var i = 0, len = rootElement.length; i < len; i++) {
				var node = rootElement[i];
				if (node.nodeType === Node.ELEMENT_NODE) {
					$(node).attr(DATA_H5_DYN_BID, bid);
				}
			}
		} else {
			$(rootElement).attr(DATA_H5_DYN_BID, bid);
		}
		addBindingEntry(context, rootElement, bid);

		//TODO 高速化
		if (h5.u.obj.isObservableArray(context)) {
			var observeListener = function(event) {
				binding._observableArray_observeListener(event);
			};
			listeners[bid] = observeListener;

			context.addEventListener('observe', observeListener);
		} else if (isItem) {
			var changeListener = function(event) {
				binding._dataItem_changeListener(event);
			};
			listeners[bid] = changeListener;

			context.addEventListener('change', changeListener);
		}

		//loop-contextの場合はループ処理して終わり
		if (isLoopContext) {
			var fragment = document.createDocumentFragment();

			var rootChildNodes = Array.prototype.slice.call(rootElement.childNodes, 0);

			//ループ前に内部の要素はすべて外す
			$(rootElement).empty();

			for ( var i = 0, len = context.length; i < len; i++) {
				//子要素がエレメントだけとは限らないので、先頭にマーカー用のコメントノードを付与。
				//TODO コメントノードだとセレクタでクエリできないが、先頭からたどると遅いのでchildNodesを見て二分木で探すようにする
				var idxMarker = document.createComment(createLoopIndexComment(i));
				fragment.appendChild(idxMarker);

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
		if ($(rootElement).attr(DATA_H5_BIND) != null) {
			//add()は元のjQueryオブジェクトを変更せず、新しいセットを返す
			$bindElements = $bindElements.add(rootElement);
		}

		//各要素についてバインドする
		$bindElements.each(function() {
			doBind(this, context, isItem);
		});

		//data-context, data-loop-contextそれぞれについて、バインディングを実行
		applyChildBinding(binding, rootElement, context, false);
		applyChildBinding(binding, rootElement, context, true);
	}

	function applyChildBinding(binding, rootElement, context, isLoopContext) {
		var dataContextAttr = isLoopContext ? DATA_H5_LOOP_CONTEXT : DATA_H5_CONTEXT;

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

	function createLoopIndexComment(index) {
		return '{h5loopidx value="' + index + '"/}';
	}

	/**
	 * 指定されたインデックスを持つ、data-loop-contextで動的生成された子要素のインデックスマーカー（コメントノード）を返します。
	 *
	 * @params {Element} endElement 探索終了エレメント
	 * @returns {Element} インデックスマーカー、見つからない場合はnull
	 */
	function findLoopMarker(idx, parentElement, endElement) {
		var marker = createLoopIndexComment(idx);

		if (!endElement) {
			endElement = null;
		}

		//TODO 高速化。エレメントにはidxをdata属性で入れておき、現在位置を検出するのを高速化、その後二分木などで探索する、など
		for ( var elem = parentElement.firstChild; elem; elem = elem.nextSibling) {
			if (elem.nodeType === Node.COMMENT_NODE && elem.nodeValue === marker) {
				return elem;
			}

			if (elem === endElement) {
				return null;
			}
		}
		return null;
	}

	function isLoopMarker(node) {
		if (node.nodeType !== Node.COMMENT_NODE) {
			return false;
		}
		return node.nodeValue.indexOf('{h5loopidx ') === 0;
	}

	function getLoopMarkerIndex(node) {
		if (node.nodeType !== Node.COMMENT_NODE) {
			return -1;
		}

		var index = /{h5loopidx value="(\d+)"\/}/.exec(node.nodeValue);
		if (index == null) {
			return -1;
		}
		return index[1];
	}

	function removeLoopNodes(parentElement, start, count) {
		var startMarker = findLoopMarker(start, parentElement);
		var stopMarker = findLoopMarker(start + count, parentElement); //nullなら最後まで削除する

		//TODO 高速化を考える
		var nodeToRemove = startMarker;
		while (nodeToRemove !== stopMarker) {
			var nextNode = nodeToRemove.nextSibling;
			parentElement.removeChild(nextNode);
			nodeToRemove = nextNode;
		}
	}

	function updateLoopIndex(parentElement) {
		var newIndex = 0;

		for ( var elem = parentElement.firstChild; elem; elem = elem.nextSibling) {
			if (isLoopMarker(elem)) {
				elem.nodeValue = createLoopIndexComment(newIndex++);
			}
		}
	}


	function reverseLoopNodes(parentElement) {
		var fragment = document.createDocumentFragment();

		var children = parentElement.childNodes;
		var currChild;
		var insertionMarker = null;

		for ( var i = children.length - 1; i >= 0; i--) {
			currChild = children[i];

			parentElement.removeChild(currChild);

			if (isLoopMarker(currChild)) {
				//ループマーカーノードが来たら、挿入位置を「一番最後」にする
				parentElement.insertBefore(currChild, insertionMarker);
				insertionMarker = null;
			} else {
				parentElement.insertBefore(currChild, insertionMarker);
				insertionMarker = currChild;
			}
		}

		parentElement.appendChild(fragment);
	}


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
				//自動ターゲット
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


	function createLoopNodes(srcLoopParent) {
		var clone = srcLoopParent.cloneNode(true);
		return Array.prototype.slice.call(clone.childNodes, 0);
	}


	function getSrcLoopParentNode(bindSrc, contextId) {
		var contextSrc = null;

		if (contextId == null) {
			contextSrc = bindSrc;
		} else {
			for ( var j = 0, srcLen = bindSrc.length; j < srcLen; j++) {
				contextSrc = $('[' + DATA_H5_DYN_CTX + '="' + contextId + '"]', bindSrc[i])[0];
				if (contextSrc) {
					break;
				}
			}
		}
		return contextSrc;
	}



	function Binding(target, dataContext) {
		//ターゲットがない、空文字、または長さゼロの配列だったら何もしない
		if (!target || target === '' || target.length === 0) {
			return;
		}

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

		//this._srcは常に配列
		//初期状態のノードに、コンテキストごとに固有のIDを振っておく
		for ( var i = 0, len = this._src.length; i < len; i++) {
			var $src = $(this._src[i]);

			if ($src.attr(DATA_H5_CONTEXT) || $src.attr(DATA_H5_LOOP_CONTEXT)) {
				$src.attr(DATA_H5_DYN_CTX, contextUid++);
			}

			$src.find('[data-h5-context],[data-h5-loop-context]').each(function() {
				$(this).attr(DATA_H5_DYN_CTX, contextUid++);
			});
		}

		this._context = dataContext;
	}
	$.extend(Binding.prototype,
			{
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

					//TODO バインドのルートでループを回している場合、「ループの親」が存在しないので「仮想ループ親エレメント」がほしい

					if (!event.isDestructive) {
						return;
					}

					var srcArray = event.target;

					var orgViews = getViewsFromSrc(srcArray);
					if (!orgViews) {
						return;
					}

					var views = orgViews.slice(0);

					for ( var i = 0, len = views.length; i < len; i++) {
						$view = $(views[i]);

						var contextId = $view.attr(DATA_H5_DYN_CTX);

						switch (event.method) {
						case 'shift':
							removeLoopNodes($view[0], 0, 1);
							break;
						case 'pop':
							//lengthはpop後の値（＝pop前-1）になっている
							removeLoopNodes($view[0], srcArray.length, 1);
							break;
						case 'unshift':
							var clonedLoopNodes = createLoopNodes(getSrcLoopParentNode(this._src,
									contextId));

							break;
						case 'push':
							break;
						case 'splice':
							break;
						case 'sort':
							//TODO sortの場合元の値がどうソートされたかを追跡することが困難なので、全部入れ替える？？
							break;
						case 'reverse':
							reverseLoopNodes($view[0]);
							break;
						}

						updateLoopIndex($view[0]);


						contextSrc = wrapInArray(contextSrc);
						for ( var j = 0, ctxSrcLen = contextSrc.length; j < ctxSrcLen; j++) {
							var newView = contextSrc[j].cloneNode(true);
							$view[0].parentNode.insertBefore(newView, $view[0]);

							var oldUid = $view.attr(DATA_H5_DYN_BID);
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
						if ($(rootElement).attr(DATA_H5_BIND) != null) {
							//add()は元のjQueryオブジェクトを変更せず、新しいセットを返す
							$bindElements = $bindElements.add(rootElement);
						}

						//各要素についてバインドする
						$bindElements.each(function() {
							doBind(this, event.target, true);

							//TODO newValueがobj/arrayでnot observableの場合はつぶしてapply
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
