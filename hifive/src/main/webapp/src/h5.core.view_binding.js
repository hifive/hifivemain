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

	var DATA_H5_BIND = 'data-h5-bind';

	var DATA_H5_CONTEXT = 'data-h5-context';

	var DATA_H5_LOOP_CONTEXT = 'data-h5-loop-context';

	var DATA_H5_DYN_CTX = 'data-h5-dyn-ctx';

	var DATA_H5_DYN_VID = 'data-h5-dyn-vid';

	var DATA_H5_DYN_BIND_ROOT = 'data-h5-dyn-bind-root';

	/** 1つのバインド指定のターゲットとソースのセパレータ（「text:prop」の「:」） */
	var BIND_DESC_TARGET_SEPARATOR = ':';

	/** 複数のバインド指定のセパレータ（「text:prop1; attr(href):prop2」の「;」） */
	var BIND_DESC_SEPARATOR = ';';

	/** バインドターゲットのカッコ内を取得するための正規表現（「attr(href)」の「href」を取得） */
	var BIND_TARGET_DETAIL_REGEXP = /\(\s*(\S+)\s*\)/;

	/** data-h5-bindでattr, styleバインドを行う場合は、「style(color)」のように具体的なバインド先を指定する必要があります。 */
	var ERR_CODE_REQUIRE_DETAIL = 16000;

	/** 不明なバインド先が指定されました。html,style等決められたバインド先を指定してください。 */
	var ERR_CODE_UNKNOWN_BIND_DIRECTION = 16001;

	/** コンテキスト値が不正です。data-h5-contextの場合はオブジェクト、data-h5-loop-contextの場合は配列を指定してください。 */
	var ERR_CODE_INVALID_CONTEXT_SRC = 16002;


	var errMsgMap = {};
	errMsgMap[ERR_CODE_REQUIRE_DETAIL] = 'data-h5-bindでattr, styleバインドを行う場合は、「style(color)」のように具体的なバインド先を指定する必要があります。';
	errMsgMap[ERR_CODE_UNKNOWN_BIND_DIRECTION] = '不明なバインド先が指定されました。html,style等決められたバインド先を指定してください。';
	errMsgMap[ERR_CODE_INVALID_CONTEXT_SRC] = 'コンテキスト値が不正です。data-h5-contextの場合はオブジェクト、data-h5-loop-contextの場合は配列を指定してください。';
	addFwErrorCodeMap(errMsgMap);


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

	/** bindUidカウンタ */
	var bindRootId = 0;

	/** グローバルなbindRootIdからBindingインスタンスへのマップ */
	var bindRootIdToBindingMap = {};

	//MEMO バインド関係のマップのたどり方
	//(1)ソース -> 特定のビュー： srcToViewMap[srcIndex][viewUid] がビュー。
	//  srcIndexはbinding._usingContexts配列のソースオブジェクトのインデックス位置。
	//  srcToViewMap[i][j]の中身はノードの配列。
	//(2)特定のビュー -> ソース： viewUid経由でたどれる。viewToSrcMap[viewUid] がソースオブジェクト。
	//  ビュー -> ソースはbindingインスタンス単位ではなく、グローバルに管理（ビュー自体が実質シングルトンなので）。
	//(3)loop-contextの各要素と対応する（要素ごとの）ビュー：
	//  binding._loopElementsMap[viewUid] = loopElementsArray;
	//  loopElementsArrayのi番目にはビューのノードの配列が入っていて、ソース配列のi番目と対応。


	/**
	 * ビュー（viewUid） -> ソースオブジェクト のマップ。many:1。キーはviewUid、値はソースオブジェクト。
	 */
	var viewToSrcMap = {};

	// =============================
	// Functions
	// =============================

	function toArray(pseudoArray) {
		if (!pseudoArray) {
			return null;
		}

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
	 * 別のコンテキストに属していない（＝現在のコンテキストに属している）バインド対象要素を返します。ネストしたコンテキストの中の対象要素は含まれません。
	 *
	 * @param {Node|Node[]} rootNodes ルート要素、またはルート要素の配列
	 * @returns {jQuery} 別のコンテキストに属していないバインド対象要素
	 */
	function $getBindElementsInContext(rootNodes, isBindingRoot) {
		rootNodes = wrapInArray(rootNodes);

		var $bindElements = $();

		for ( var i = 0, len = rootNodes.length; i < len; i++) {
			var rootNode = rootNodes[i];

			//ルート要素がエレメントでない場合は何もしない
			if (rootNode.nodeType !== NODE_TYPE_ELEMENT) {
				continue;
			}

			//バインディングルートの場合は、
			//rootNodeは「仮想の親要素（バインドルート）」の子要素として考える必要がある。
			//ルート要素で別のコンテキストが指定されている場合はそれ以下のノードは絶対に含まれない
			if ((isBindingRoot === true)
					&& (rootNode.getAttribute(DATA_H5_CONTEXT) != null || rootNode
							.getAttribute(DATA_H5_LOOP_CONTEXT) != null)) {
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
	function $getChildContexts(rootNodes, dataContextAttr, isBindingRoot) {
		var $childContexts = $();

		for ( var i = 0, len = rootNodes.length; i < len; i++) {
			var rootNode = rootNodes[i];

			//ルート要素がエレメントでない場合は別のコンテキストである可能性はない
			if (rootNode.nodeType !== NODE_TYPE_ELEMENT) {
				continue;
			}

			if (isBindingRoot === true) {
				//このrootNodesがバインディングのルートノードの場合（＝仮想的なルートノードの子要素の場合）

				//指定されたコンテキストが設定されていれば必ず直接の子供
				if (rootNode.getAttribute(dataContextAttr) != null) {
					$childContexts = $childContexts.add(rootNode);
					continue;
				}

				//コンテキストが設定されていれば、その子孫のノードは必ず別のコンテキストに属していることになる
				if (rootNode.getAttribute(DATA_H5_CONTEXT) != null
						|| rootNode.getAttribute(DATA_H5_LOOP_CONTEXT) != null) {
					continue;
				}
			}

			//各ルートノードの子孫ノードから、直接の子供であるコンテキストノードを探す
			var $filtered = $('[' + dataContextAttr + ']', rootNode).filter(function() {
				var $this = $(this);

				var contextParent = $this.parent('[data-h5-context],[data-h5-loop-context]')[0];

				if (contextParent === undefined || contextParent === rootNode) {
					return true;
				}
				//直接の親が指定されたルートノードでない（＝別のコンテキストに入っている）場合は除外
				return false;
			});

			$childContexts = $childContexts.add($filtered);
		}

		return $childContexts;
	}


	function isObservableItem(obj) {
		//TODO 厳密に判定
		// ObservableItemの場合もtrueを返す
		if (obj && obj.addEventListener && obj.getModel && !$.isArray(obj)
				&& !h5.u.obj.isObservableArray(obj) || h5.u.obj.isObservableItem(obj)) {
			return true;
		}
		return false;
	}

	function addViewUid(rootNodes, viewUid) {
		for ( var i = 0, len = rootNodes.length; i < len; i++) {
			var n = rootNodes[i];
			if (n.nodeType === NODE_TYPE_ELEMENT) {
				$(n).attr(DATA_H5_DYN_VID, viewUid);
			}
		}
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
	function applyBinding(binding, rootNodes, context, isLoopContext, isBindingRoot) {
		//配列化（要素が直接来た場合のため）
		rootNodes = wrapInArray(rootNodes);

		//TODO isBindingRoot -> isVirtualRoot。配列のループ要素の場合、バインドルートの場合など
		//「ノード集合に対して」バインドする場合のケア。

		var viewUid = getViewUid();

		//loop-contextの場合はループ処理して終わり
		if (isLoopContext) {
			//loop-contextの場合は、ループのルートノードは必ず単一のノード
			var loopRootElement = rootNodes[0];

			//ループ前に一旦内部要素をすべて外す
			$(loopRootElement).empty();

			if (!context) {
				//contextがない場合はループを一切行わない（BindingEntryもつけない）
				return;
			}

			if (!($.isArray(context) || h5.u.obj.isObservableArray(context))) {
				//data-h5-loop-contextの場合contextは配列でなければならない
				throwFwError(ERR_CODE_INVALID_CONTEXT_SRC);
			}

			addViewUid(rootNodes, viewUid);

			binding._addBindingEntry(context, loopRootElement, viewUid);

			if (h5.u.obj.isObservableArray(context) && !binding._isWatching(context)) {
				var observeListener = function(event) {
					binding._observableArray_observeListener(event);
				};
				binding._listeners[binding._getContextIndex(context)] = observeListener;

				context.addEventListener('observe', observeListener);
			}

			//ループルートノードに対応する子ノードリストを保存しているビューソースから取り出す
			var loopDynCtxId = $(loopRootElement).attr(DATA_H5_DYN_CTX);
			var srcRootChildNodes = toArray(binding._getSrcCtxNode(loopDynCtxId).childNodes);

			//このループコンテキストの各要素に対応するノード（配列）を格納する配列
			var loopElementsArray = [];
			binding._loopElementsMap[viewUid] = loopElementsArray;

			//appendChildの呼び出し回数削減。
			//ループ単位ごとにappendChildしてdocumentにバインドする（＝Fragmentは都度空になる）ので、使いまわしている。
			var fragment = document.createDocumentFragment();

			for ( var i = 0, len = context.length; i < len; i++) {
				var loopNodes = [];

				//1要素分のノードのクローンを作成
				for ( var j = 0, childLen = srcRootChildNodes.length; j < childLen; j++) {
					var clonedInnerNode = srcRootChildNodes[j].cloneNode(true); //deep copy

					loopNodes.push(clonedInnerNode);

					fragment.appendChild(clonedInnerNode);
				}

				//配列1要素分のノードリストを保存
				loopElementsArray[i] = loopNodes;

				//IE6で、documentツリーにぶら下がっていない状態で属性操作を行うとそれが反映されない場合がある
				//（例えばinput-checkboxのcheckedを操作してもそれが反映されない）
				//そのため、先にツリーにappendしてからバインディングを行う
				loopRootElement.appendChild(fragment);

				//配列1要素分のバインディングを実行
				applyBinding(binding, loopNodes, context[i]);
			}

			return;
		}

		//以下はloop-contextでない場合

		if (context) {
			//TODO loop-contextにおいて個々のループ単位のコンテキスト自身をcontextやloop-contextにバインドする方法を追加した場合
			//ここのチェックルーチンは変更になる
			if (typeof context !== 'object' || $.isArray(context)
					|| h5.u.obj.isObservableArray(context)) {
				//data-h5-contextの場合contextはオブジェクトでなければならない（配列は不可）
				throwFwError(ERR_CODE_INVALID_CONTEXT_SRC);
			}

			//コンテキストが存在する場合
			//エレメントについては、ビュー->ソースをすぐにひけるようdata属性でviewUidを付加しておく
			addViewUid(rootNodes, viewUid);

			binding._addBindingEntry(context, rootNodes, viewUid);
		}
		//context===nullの場合に子要素のバインディングを解除する必要はない。
		//現状の実装では、初回はバインディングはまだ行われておらず、
		//2回目以降Itemのpropが変わった場合などで再バインドされるときは
		//バインドされていないオリジナルに対してバインドが再実行されるので、
		//「バインド済みのものに対して別のコンテキストを割り当てる」ことはない。

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
		var $bindElements = $getBindElementsInContext(rootNodes, isBindingRoot);

		//自コンテキストに属する各要素のデータバインドを実行
		$bindElements.each(function() {
			doBind(this, context, isItem);
		});

		//ネストした子data-context, data-loop-contextのデータバインドを実行
		applyChildBinding(binding, rootNodes, context, false, isBindingRoot);
		applyChildBinding(binding, rootNodes, context, true, isBindingRoot);
	}

	function applyChildBinding(binding, rootNodes, context, isLoopContext, isBindingRoot) {
		var dataContextAttr = isLoopContext ? 'data-h5-loop-context' : 'data-h5-context';

		//ループコンテキストまたはバインディングルートの場合は、rootNodesは仮想ルート
		var isVirtualRoot = isBindingRoot;

		//自分のコンテキストに属するdata-contextを探す
		var $childContexts = $getChildContexts(rootNodes, dataContextAttr, isVirtualRoot);

		//内部コンテキストについてapplyBindingを再帰的に行う
		$childContexts.each(function() {
			var $this = $(this);
			var childContextProp = $this.attr(dataContextAttr);
			//contextがisObservableItemならgetでchildContextを取得する
			//TODO getContextValue()などで統一するか
			var childContext = null;
			if (context) {
				childContext = isObservableItem(context) ? context.get(childContextProp)
						: context[childContextProp];
			}

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

			var value = null;
			if (context) {
				//contextが存在する場合は値を取得。（contextがnullの場合は初期化を行う）
				if (isItem) {
					value = context.get(prop);
				} else {
					value = context[prop];
				}
			}

			if (target == null) {
				//自動指定は、inputタグならvalue属性、それ以外ならテキストノードをターゲットとする
				if (element.tagName.toLowerCase() === 'input') {
					target = 'attr';
					detail = 'value';
				} else {
					target = 'text';
				}
			}

			switch (target) {
			case 'text':
				value == null ? $element.text('') : $element.text(value);
				break;
			case 'html':
				value == null ? $element.html('') : $element.html(value);
				break;
			case 'class':
				//TODO classの場合はoldValueが必要
				$element.addClass(value);
				break;
			case 'attr':
				if (!detail) {
					throwFwError(ERR_CODE_REQUIRE_DETAIL);
				}
				value == null ? $element.removeAttr(detail) : $element.attr(detail, value);
				break;
			case 'style':
				if (!detail) {
					throwFwError(ERR_CODE_REQUIRE_DETAIL);
				}
				//contextがnullの場合valueはnull。styleはcontext===nullの場合当該スタイルを削除するので
				//このコードでスタイルが削除される（よってcontextによる分岐は不要）。
				value == null ? $element.css(detail, '') : $element.css(detail, value);
				break;
			default:
				throwFwError(ERR_CODE_UNKNOWN_BIND_DIRECTION);
			}
		}
	}

	function removeNodes(binding, parent, nodesToRemove) {
		for ( var i = 0, len = nodesToRemove.length; i < len; i++) {
			var n = nodesToRemove[i];
			parent.removeChild(n);
			binding._removeBinding(n);
		}
	}

	function cloneChildNodes(parentNode) {
		var childNodes = parentNode.childNodes;
		var ret = [];

		for ( var i = 0, len = childNodes.length; i < len; i++) {
			ret.push(childNodes[i].cloneNode(true));
		}

		return ret;
	}

	function addLoopChildren(binding, loopElements, srcCtxRootNode, method, methodArgs) {
		//追加される全てのノードを持つフラグメント。
		//Element.insertBeforeでフラグメントを挿入対象にすると、フラグメントに入っているノードの順序を保って
		//指定した要素の前に挿入できる。従って、unshift()の際insertBeforeを一度呼ぶだけで済む。
		var fragment = document.createDocumentFragment();

		var newLoopNodes = [];
		for ( var i = 0, argsLen = methodArgs.length; i < argsLen; i++) {
			var newChildNodes = cloneChildNodes(srcCtxRootNode);
			newLoopNodes[i] = newChildNodes;

			for ( var j = 0, newChildNodesLen = newChildNodes.length; j < newChildNodesLen; j++) {
				fragment.appendChild(newChildNodes[j]);
			}

			applyBinding(binding, newChildNodes, methodArgs[i]);
		}
		Array.prototype[method].apply(loopElements, newLoopNodes);

		return fragment;
	}

	/**
	 * 配列のビューをリバースします。loopNodesはリバース前の配列であることを前提とします。<br>
	 */
	function reverseLoopNodes(parent, loopNodes) {
		//一旦すべてのノードをparentから外す
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}

		//配列要素をリバースしたのと同等になるようにノードを再挿入する
		for ( var i = 0, len = loopNodes.length; i < len; i++) {
			var nodesPerIndex = loopNodes[i];
			for ( var j = nodesPerIndex.length - 1; j >= 0; j--) {
				parent.insertBefore(nodesPerIndex[j], parent.firstChild);
			}
		}
	}

	function spliceLoopNodes(binding, parent, srcArray, methodArgs, loopNodes, srcCtxRootNode) {
		var methodArgsLen = methodArgs.length;

		if (methodArgsLen === 0) {
			return;
		}

		var startPos = methodArgs[0];

		var removePos = startPos;

		var removeEnd;
		if (methodArgsLen === 1) {
			//spliceの第2引数省略時は、start以降すべての要素を削除
			removeEnd = srcArray.length;
		} else {
			//spliceの第2引数は削除する個数
			removeEnd = removePos + methodArgs[1];
		}

		//指定されたインデックスに対応するDOMノードを削除
		for (; removePos < removeEnd; removePos++) {
			var nodesPerIndex = loopNodes[removePos];
			//配列がスパースである場合やsplice()で実際の要素数以上の個数を削除しようとしている場合、
			//ループノードがない場合が考えられるのでチェックする
			if (nodesPerIndex) {
				removeNodes(binding, parent, nodesPerIndex);
			}
		}

		//まず、削除のみを行う
		loopNodes.splice(startPos, methodArgs[1]);

		if (methodArgsLen <= 2) {
			//追加する要素がなければ削除だけ行って終了
			return;
		}

		var insertionMarkerNode;

		var loopNodesLen = loopNodes.length;
		if (loopNodesLen === 0 || startPos === 0) {
			//全ての要素が削除された場合、またはstartが0の場合は先頭に追加する
			//全要素が削除されている場合firstChildはnullになっているはず
			insertionMarkerNode = parent.firstChild;
		} else if (startPos >= loopNodesLen) {
			//startPosがloopNodesの長さより大きい場合はノードは末尾に挿入
			//insertBefore()は、挿入位置がnullの場合は末尾挿入
			insertionMarkerNode = null;
		} else {
			//要素が残っている場合は、startの前に追加する
			insertionMarkerNode = loopNodes[startPos][0];
		}

		//以下は要素の挿入がある場合
		//spliceの挙動(on Chrome22)：
		//・startがlengthを超えている場合：要素の削除は起こらない、要素は末尾に挿入される、lengthは挿入した分だけ（startで指定したインデックスに入るわけではない）
		//・countが省略された場合：start以降の全要素を削除
		//・countがlengthを超えている場合：start以降の全要素が削除される
		//・挿入要素がある場合：startの位置にinsertBefore（startがlengthを超えている場合は末尾に挿入）

		var fragment = document.createDocumentFragment();

		//loopNodesに対するspliceのパラメータ。要素の挿入を行うため、あらかじめstartPosと削除数0を入れておく
		var spliceArgs = [startPos, 0];

		//新たに挿入される要素に対応するノードを生成
		for ( var i = 2, len = methodArgsLen; i < len; i++) {
			var newChildNodes = cloneChildNodes(srcCtxRootNode);

			for ( var j = 0, newChildNodesLen = newChildNodes.length; j < newChildNodesLen; j++) {
				fragment.appendChild(newChildNodes[j]);
			}

			applyBinding(binding, newChildNodes, methodArgs[i]);
			spliceArgs.push(newChildNodes);
		}

		//DOMツリーの該当位置にノードを追加
		parent.insertBefore(fragment, insertionMarkerNode);

		//指定された位置に要素を挿入する
		Array.prototype.splice.apply(loopNodes, spliceArgs);
	}


	function refreshLoopContext(binding, srcArray, loopRootNode, loopNodes, srcCtxNode) {
		//現在のビューのすべての要素を外す
		for ( var i = 0, len = loopNodes.length; i < len; i++) {
			removeNodes(binding, loopRootNode, loopNodes[i]);
		}

		//TODO addLoopChildrenとコード共通化

		//追加される全てのノードを持つフラグメント。
		//Element.insertBeforeでフラグメントを挿入対象にすると、フラグメントに入っているノードの順序を保って
		//指定した要素の前に挿入できる。従って、unshift()の際insertBeforeを一度呼ぶだけで済む。
		var fragment = document.createDocumentFragment();

		var newLoopNodes = [];
		for ( var i = 0, srcLen = srcArray.length; i < srcLen; i++) {
			var newChildNodes = cloneChildNodes(srcCtxNode);
			newLoopNodes[i] = newChildNodes;

			for ( var j = 0, newChildNodesLen = newChildNodes.length; j < newChildNodesLen; j++) {
				fragment.appendChild(newChildNodes[j]);
			}

			applyBinding(binding, newChildNodes, srcArray[i]);
		}

		loopRootNode.appendChild(fragment);

		return newLoopNodes;
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	function Binding__observableArray_observeListener(event) {
		if (!event.isDestructive) {
			return;
		}

		var views = this._getViewsFromSrc(event.target);
		if (!views) {
			return;
		}

		//(3)loop-contextの各要素と対応する（要素ごとの）ビュー：
		//binding._loopElementsMap[viewUid] = loopElementsArray;
		//loopElementsArrayのi番目にはビューのノードの配列が入っていて、ソース配列のi番目と対応。


		for ( var viewUid in views) {
			if (!views.hasOwnProperty(viewUid)) {
				continue;
			}

			var loopRootNode = views[viewUid];
			var $loopRootNode = $(loopRootNode);

			var dynCtxId = $loopRootNode.attr(DATA_H5_DYN_CTX);

			var loopNodes = this._loopElementsMap[viewUid];

			switch (event.method) {
			case 'shift':
			case 'pop':
				var nodesToRemove = loopNodes[event.method]();
				if (nodesToRemove) {
					//要素数0の配列に対してshift,popすると戻り値はundefined
					removeNodes(this, loopRootNode, nodesToRemove);
				}
				break;
			case 'unshift':
				var fragment = addLoopChildren(this, loopNodes, this._getSrcCtxNode(dynCtxId),
						event.method, event.args);
				//新規追加ノードを先頭に追加
				loopRootNode.insertBefore(fragment, loopRootNode.firstChild);
				break;
			case 'push':
				var fragment = addLoopChildren(this, loopNodes, this._getSrcCtxNode(dynCtxId),
						event.method, event.args);
				//新規追加ノードを末尾に追加
				loopRootNode.appendChild(fragment);
				break;
			case 'splice':
				spliceLoopNodes(this, loopRootNode, event.target, event.args, loopNodes, this
						._getSrcCtxNode(dynCtxId));
				break;
			case 'reverse':
				//DOMツリー側をリバース
				reverseLoopNodes(loopRootNode, loopNodes);
				//保持している配列をリバース
				loopNodes.reverse();
				break;
			case 'sort':
			case 'copyFrom':
				//ループビューをすべて作り直す
				this._loopElementsMap[viewUid] = refreshLoopContext(this, event.target,
						loopRootNode, loopNodes, this._getSrcCtxNode(dynCtxId));
				break;
			}
		}
	}

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

				//バインドターゲットの親要素
				this._parent = target.parentNode;

				this._targets = [target];
			}
		} else {
			//複数のノード

			/**
			 * バインドターゲットの親要素
			 *
			 * @name _parent
			 * @private
			 */
			this._parent = target[0].parentNode;
			/**
			 * バインドターゲット
			 *
			 * @name _targets
			 * @private
			 */
			this._targets = toArray(target);
		}

		/**
		 * このバインディングのID
		 *
		 * @name _bindRootId
		 * @private
		 */
		this._bindRootId = bindRootId++;

		//マップにこのインスタンスを登録
		bindRootIdToBindingMap[this._bindRootId] = this;

		var clonedSrc = [];

		//this._targetsは常に配列
		//初期状態のビューに、コンテキストごとに固有のIDを振っておく
		for ( var i = 0, len = this._targets.length; i < len; i++) {
			var originalNode = this._targets[i];

			if (originalNode.nodeType === NODE_TYPE_ELEMENT) {
				var $original = $(originalNode);

				//ルートのエレメントノードにdata-dyn-bind-rootを付加して、このBindingインスタンスを探せるようにしておく
				$original.attr(DATA_H5_DYN_BIND_ROOT, this._bindRootId);

				if ($original.attr(DATA_H5_CONTEXT) || $original.attr(DATA_H5_LOOP_CONTEXT)) {
					$original.attr(DATA_H5_DYN_CTX, contextUid++);
				}

				$original.find('[data-h5-context],[data-h5-loop-context]').each(function() {
					$(this).attr(DATA_H5_DYN_CTX, contextUid++);
				});
			}

			//保存用にクローン
			clonedSrc.push(originalNode.cloneNode(true));
		}

		/**
		 * クローンした初期状態のテンプレート
		 *
		 * @name _srces
		 * @private
		 */
		this._srces = clonedSrc;

		/**
		 * loop-contextの各インデックスがもつ要素（配列）を保持。 キー：viewUid、値：配列の配列。
		 * 値は、「あるviewUidのloop-contextのi番目（＝ここが1段目）の要素の配列（＝2段目）」になっている。
		 *
		 * @name _loopElementsMap
		 * @private
		 */
		this._loopElementsMap = {};

		/**
		 * このバインディングのルートデータコンテキスト
		 *
		 * @name _rootContext
		 * @private
		 */
		this._rootContext = dataContext;

		/**
		 * 現在適用中のデータコンテキストを入れる配列。同じインスタンスは1つしか入らない。 この配列のインデックスをキーにしてビューを探す<br>
		 * TODO インデックスをキーとして使うため、使用しなくなったオブジェクトの場所にはnullが入り、次第にスパースな配列になってしまう。<br>
		 * 二重ポインタのようにして管理すればよいが、パフォーマンスに重大な影響が出るほどスパースになることはまれと考え、Deferredする。
		 *
		 * @name _usingContexts
		 * @private
		 */
		this._usingContexts = [];

		/**
		 * ソースオブジェクト -> ビュー のマップ。1:many。 キーは_usingContextsのインデックス。 値はさらにマップで、キー：viewUid,
		 * 値：ビューインスタンス（配列）。
		 *
		 * @name _srcToViewMap
		 * @private
		 */
		this._srcToViewMap = {};

		/**
		 * バインドUID（現在表示されているDOM）にひもづけているリスナー。キー：contextIndex, 値：リスナー関数
		 *
		 * @name _listeners
		 * @private
		 */
		this._listeners = {};

		//TODO ルートが配列（LoopContext）の場合を考える
		//バインディングの初期実行
		applyBinding(this, this._targets, this._rootContext, false, true);
	}
	$.extend(Binding.prototype, {
		/**
		 * このデータバインドを解除します。解除後は、ソースオブジェクトを変更してもビューには反映されません。<br>
		 * ビュー（HTML）の状態は、このメソッドを呼んだ時の状態のままです。
		 *
		 * @since 1.1.0
		 * @memberOf Binding
		 * @function
		 */
		unbind: function() {
			//全てのバインディングを解除
			for ( var i = 0, len = this._targets.length; i < len; i++) {
				this._removeBinding(this._targets[i]);
			}

			//ビューとこのBindingインスタンスのマップを削除
			delete bindRootIdToBindingMap[this._bindRootId];

			//TODO リソース解放
			//unbindしたら、ノードは元に戻す？？
		},

		/*
		 * バインディングを再実行します。既存のビューは一度すべて削除されます。
		 *
		 * @since 1.1.0
		 * @memberOf Binding
		 * @function
		 * @private
		 */
		//		refresh: function() {
		//			//保存しておいたビューをクローン
		//			var fragment = document.createDocumentFragment();
		//			for ( var i = 0, len = this._srces.length; i < len; i++) {
		//				fragment.appendChild(this._srces[i].cloneNode(true));
		//			}
		//
		//			//fragmentをappendする前にノードリストをコピーしておく
		//			var newTargets = toArray(fragment.childNodes);
		//
		//			//新しいターゲットに対してバインディングを実行
		//			//TODO ルートが配列（LoopContext）の場合を考える
		//			applyBinding(this, newTargets, this._rootContext, false, true);
		//
		//			//生成したノードを今のターゲット（の最初のノード）の直前に追加して
		//			this._parent.insertBefore(fragment, this._targets[0]);
		//
		//			//既存のターゲットを削除
		//			for ( var i = 0, len = this._targets.length; i < len; i++) {
		//				this._removeBinding(this._targets[i]);
		//				this._parent.removeChild(this._targets[i]);
		//			}
		//
		//			//ターゲットのポインタを更新
		//			this._targets = newTargets;
		//		},
		/**
		 * ObservableArrayの変更に基づいて、自分が管理するビューを更新します。<br>
		 * MEMO フォーマッタが過剰にインデントしてしまうので分離している
		 *
		 * @since 1.1.0
		 * @memberOf Binding
		 * @private
		 * @function
		 * @param event
		 */
		_observableArray_observeListener: Binding__observableArray_observeListener,

		/**
		 * データアイテムまたはObservableItemのchangeイベントハンドラ
		 *
		 * @since 1.1.0
		 * @memberOf Binding
		 * @private
		 * @function
		 * @param event
		 */
		_observableItem_changeListener: function(event) {
			var views = this._getViewsFromSrc(event.target);
			if (!views) {
				return;
			}

			//このオブジェクトがルートコンテキストかどうか。
			//ルートコンテキストの場合、$getBindElementsInContext()において
			//対応するビューは「仮想ルート要素の子要素」としてみる必要がある。
			var isRootContext = false;
			if (event.target === this._rootContext) {
				isRootContext = true;
			}

			var that = this;

			for ( var vuid in views) {
				if (!views.hasOwnProperty(vuid)) {
					continue;
				}

				//viewはこのObservableItemにバインドされているノード配列
				var view = views[vuid];

				//自分のコンテキストに属しているバインディング対象要素を探す
				var $bindElements = $getBindElementsInContext(view, isRootContext);

				//各要素についてバインドする
				$bindElements.each(function() {
					doBind(this, event.target, true);
				});

				//自分の直接の子供のコンテキスト要素を探す
				var $childContexts = $getChildContexts(view, DATA_H5_CONTEXT);
				$childContexts.each(function() {
					var $this = $(this);

					var contextProp = $this.attr(DATA_H5_CONTEXT);

					if (!(contextProp in event.props)) {
						//このコンテキスト要素に対応するソースオブジェクトは変更されていない
						return true;
					}

					//子供のコンテキストの場合、仕様上あるコンテキストのルート要素は必ず単一のエレメントである

					//現在のバインディングを解除
					that._removeBinding(this);

					//対応するビューを保存してあるビューからクローンする
					var dynCtxId = $this.attr(DATA_H5_DYN_CTX);
					var srcCtxRootNode = that._getSrcCtxNode(dynCtxId);
					var cloned = srcCtxRootNode.cloneNode(true);

					//新しくバインドした要素を追加し、古いビューを削除
					//(IE6は先に要素をdocumentツリーに追加しておかないと属性の変更が反映されないので先にツリーに追加)
					this.parentNode.insertBefore(cloned, this);
					this.parentNode.removeChild(this);

					//新しいコンテキストソースオブジェクトでバインディングを行う
					applyBinding(that, cloned, event.props[contextProp].newValue);
				});

				//自分の直接の子供のループルートコンテキスト要素を探す
				var $childLoopContexts = $getChildContexts(view, DATA_H5_LOOP_CONTEXT);
				$childLoopContexts.each(function() {
					var $this = $(this);

					var contextProp = $this.attr(DATA_H5_LOOP_CONTEXT);

					if (!(contextProp in event.props)) {
						//このループルートコンテキスト要素に対応するソースオブジェクトは変更されていない
						return true;
					}

					//子供のコンテキストの場合、仕様上あるコンテキストのルート要素は必ず単一のエレメントである

					//現在のバインディングを解除
					that._removeBinding(this);

					//新しいコンテキストソースオブジェクトでバインディングを行う
					//ループコンテキストなので、ルートノードはそのまま使いまわす
					applyBinding(that, this, event.props[contextProp].newValue, true);
				});
			}
		},

		/**
		 * @since 1.1.0
		 * @memberOf Binding
		 * @private
		 * @function
		 * @param ctxId
		 */
		_getSrcCtxNode: function(ctxId) {
			for ( var i = 0, len = this._srces.length; i < len; i++) {
				var $root = $(this._srces[i]);
				//ルート要素にdata-dyn-ctxがついているかチェック
				if ($root.attr(DATA_H5_DYN_CTX) === ctxId) {
					return $root[0];
				}

				//このルート要素の子要素に当該ctxIdを持つ要素がないかチェック
				var $child = $root.find('[' + DATA_H5_DYN_CTX + '="' + ctxId + '"]');
				if ($child.length > 0) {
					return $child[0];
				}
			}
			return null;
		},

		/**
		 * @since 1.1.0
		 * @memberOf Binding
		 * @private
		 * @function
		 * @param ctx
		 */
		_isWatching: function(ctx) {
			var idx = this._getContextIndex(ctx);
			if (idx === -1) {
				return false;
			}
			return this._listeners[idx] != null;
		},

		/**
		 * @since 1.1.0
		 * @memberOf Binding
		 * @private
		 * @function
		 * @param ctx
		 */
		_getContextIndex: function(ctx) {
			return $.inArray(ctx, this._usingContexts);
		},

		/**
		 * ソースオブジェクト -> ビュー(配列) のマップエントリ、ビューUID -> ソースオブジェクト のマップエントリを追加。
		 * エントリが存在する場合は上書き（ただし、そもそも二重登録は想定外）。
		 *
		 * @since 1.1.0
		 * @memberOf Binding
		 * @private
		 * @function
		 * @param ctx
		 * @param view
		 * @param viewUid
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
		 * @since 1.1.0
		 * @memberOf Binding
		 * @private
		 * @function
		 * @param srcToViewMap
		 */
		_hasBindingForSrc: function(srcToViewMap) {
			//srcToViewMapが自分でキーを持っているということは
			//ビューへのバインディングエントリがあるということ
			for ( var key in srcToViewMap) {
				if (srcToViewMap.hasOwnProperty(key)) {
					return true;
				}
			}
			return false;
		},

		/**
		 * 特定のビューへのバインディングエントリ（ソースオブジェクト -> ビュー のマップエントリ）を削除
		 *
		 * @since 1.1.0
		 * @memberOf Binding
		 * @private
		 * @function
		 * @param viewUid
		 */
		_removeBindingEntry: function(viewUid) {
			var src = viewToSrcMap[viewUid];

			if (!src) {
				//このviewUidが表すバインディングはすでに削除されている
				return;
			}

			var ctxIndex = this._getContextIndex(src);
			if (ctxIndex !== -1) {
				var svMap = this._srcToViewMap[ctxIndex];
				if (svMap && svMap[viewUid]) {
					//ソースオブジェクト -> ビュー（viewUid経由） のマップエントリを削除
					delete svMap[viewUid];

					if (!this._hasBindingForSrc(svMap)) {
						var removed = false;
						//このオブジェクトの監視が不要（他にバインドされているビューがない）になった場合、リスナーを削除
						if (isObservableItem(src)) {
							src.removeEventListener('change', this._listeners[ctxIndex]);
							removed = true;
						} else if (h5.u.obj.isObservableArray(src)) {
							src.removeEventListener('observe', this._listeners[ctxIndex]);
							removed = true;
						}

						if (removed) {
							delete this._listeners[ctxIndex];
						}

						//このソースを監視する必要がなくなったので、マップそのものを削除
						delete this._srcToViewMap[ctxIndex];
					}
				}
			}

			if (viewToSrcMap[viewUid]) {
				//viewUid -> ソースオブジェクト のマップエントリを削除
				delete viewToSrcMap[viewUid];
			}
		},

		/**
		 * 指定された要素以下のバインディングを全て解除
		 *
		 * @since 1.1.0
		 * @memberOf Binding
		 * @private
		 * @function
		 * @param rootElem
		 */
		_removeBinding: function(rootElem) {
			if (rootElem.nodeType !== NODE_TYPE_ELEMENT) {
				//バインド可能なのはエレメントのみなので、ルートがELEMENTノードでない場合はバインディングはない
				return;
			}

			var $rootElem = $(rootElem);

			//渡された要素自身がviewUidを持っていたら、まずその要素のバインディングエントリを削除
			var rootVid = $rootElem.attr(DATA_H5_DYN_VID);
			if (rootVid != null) {
				this._removeBindingEntry(rootVid);
				$rootElem.removeAttr(DATA_H5_DYN_VID);
			}

			//子要素でviewUidを持っている要素を列挙し、全てのバインディングエントリを削除
			var that = this;
			$rootElem.find('[' + DATA_H5_DYN_VID + ']').each(function() {
				var $this = $(this);
				that._removeBindingEntry($this.attr(DATA_H5_DYN_VID));
				$this.removeAttr(DATA_H5_DYN_VID);
			});
		},

		/**
		 * @since 1.1.0
		 * @memberOf Binding
		 * @private
		 * @function
		 * @param src
		 */
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

	function getBinding(bindRootId) {
		return;
	}

	/**
	 * rootNode、またはその子孫ノードで行われている全てのデータバインドを破棄する。ただし、データバインドはネストしていないことを前提とする。
	 */
	function disposeBindings(rootNode) {
		/**
		 * nodeをルートノードとするデータバインドが行われていれば、それを破棄する。
		 */
		function dispose(node) {
			var bindRootId = $(node).attr(DATA_H5_DYN_BIND_ROOT);
			if (bindRootId != null) {
				var binding = bindRootIdToBindingMap[bindRootId];
				if (binding) {
					binding.unbind();
				}
			}
		}

		dispose(rootNode);

		$('[' + DATA_H5_DYN_BIND_ROOT + ']', rootNode).each(function() {
			dispose(this);
		});
	}

	// =============================
	// Expose to window
	// =============================

	h5internal.view = {
		createBinding: createBinding,

		/**
		 * h5.core.view側でビューからBindingインスタンスを検索するために公開
		 */
		disposeBindings: disposeBindings
	};

})();
