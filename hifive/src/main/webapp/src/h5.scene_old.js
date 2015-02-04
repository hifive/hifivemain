/*
 * Copyright (C) 2012-2014 NS Solutions Corporation
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

/* ------ h5.scene ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================
	/** 吹き出し(三角の部分)の大きさ */
	var ARROW_SIZE = 34;

	/** オーバレイのクラス */
	var CLASS_OVERLAY = 'h5PopupOverlay';

	/** シーンの位置指定文字列 */
	var POSITION_CONSTRAINT = {
		top: 'top',
		middle: 'middle',
		bottom: 'bottom',
		left: 'left',
		center: 'center',
		right: 'right'
	};


	// =============================
	// Development Only
	// =============================

	//	var fwLogger = h5.log.createLogger('h5.scene');

	/* del begin */
	//	var FW_LOG_H5_WHEN_INVALID_PARAMETER = 'h5.scene.when: 引数にpromiseオブジェクトでないものが含まれています。';
	/**
	 * 各エラーコードに対応するメッセージ
	 */
	//	var errMsgMap = {};
	//	errMsgMap[ERR_CODE_NOT_ARRAY] = 'h5.scene.each() の第1引数は配列のみを扱います。';
	// メッセージの登録
	//	addFwErrorCodeMap(errMsgMap);
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
	var scenesMap = {};

	var sceneIdSeq = h5.core.data.createSequence(null, null, h5.core.data.SEQ_STRING);
	// =============================
	// Functions
	// =============================
	/**
	 * アニメーションしながら表示する
	 *
	 * @param {jQuery} $element アニメーションさせる要素
	 */
	function animateShow($element) {
		var height = $element.height();
		$element.css({
			height: 0,
			display: 'block'
		});
		$element.addClass('inAnimation');
		$element.animate({
			height: height,
			opacity: 1
		}, "slow");
		$element.promise().done(function() {
			$element.removeClass('inAnimation');
		});
	}

	/**
	 * アニメーションしながら非表示にする
	 *
	 * @param {jQuery} $element アニメーションさせる要素
	 */
	function animateHide($element) {
		$element.addClass('inAnimation');
		$element.animate({
			height: 0,
			opacity: 0
		}, "slow");
		$element.promise().done(function() {
			$element.removeClass('inAnimation');
			$element.css('display', 'none');
			$element.css('height', '');
			removeOverlay();
		});
	}

	function showOverlay($root) {
		// すでに表示済みなら何もしない
		if ($('.' + CLASS_OVERLAY).length) {
			return;
		}
		var overlay = $('<div>').addClass(CLASS_OVERLAY);
		// rootがwindowまたはdocumentならbodyに追加
		($root[0] === window || $root[0] === document ? $(document.body) : $root).append(overlay);
		function resizeOverlay() {
			overlay.css({
				width: $root.innerWidth(),
				height: $root.innerHeight()
			});
		}
		resizeOverlay();
		$(window).bind('resize.h5overlay', resizeOverlay);
		$(window).bind('orientationchange.h5overlay', resizeOverlay);
	}

	function removeOverlay() {
		$(window).unbind('resize.h5overlay');
		$(window).unbind('orientationchange.h5overlay');
		$('.' + CLASS_OVERLAY).remove();
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * Sceneクラス
	 *
	 * @param {String|DOM|jQuery} element
	 * @param {String} type
	 */
	function Scene(element, type) {
		var $element = $(element);

		switch (type) {
		case 'arrow':
			// h5arrowboxでラップする
			$element = $('<div class="h5arrowbox"></div>').append($element);
			break;
		}

		$element.addClass('h5scene');
		var sceneId = sceneIdSeq.next();
		$element.data('h5scene-id', sceneId);
		scenesMap[sceneId] = this;

		/**
		 * @memberOf Scene
		 */
		this.id = sceneId;

		/**
		 * @memberOf Scene
		 */
		this.$element = $element;

		/**
		 * @memberOf Scene
		 */
		this.$content = $element.find('.content');

		/**
		 * @memberOf Scene
		 */
		this.type = type;
	}
	$.extend(Scene.prototype, {
		show: function(param) {
			this._showParam = param;
			param = param || {};
			this.hide(false);

			// $rootは位置計算の起点となるエレメント。未指定の場合はwindow
			var $root = $(param.rootElement || window);
			var $element = this.$element;
			var styles = {
				position: 'absolute',
				display: 'block'
			};

			// rootElementがwindowまたはdocumentならbodyにappend
			var $appendTarget = $root[0] === window || $root[0] === document ? $(document.body)
					: $root;
			$appendTarget.append($element);

			// 表示
			$element.css(styles);

			// ------------- 位置計算 ------------- //
			// positionを見る
			var position = param.position;
			var topLeftStyle = {};
			if (position) {
				var top = position.top;
				var left = position.left;

				// topがキーワード指定('top','middle','bottom'の場合
				if (top === POSITION_CONSTRAINT.middle) {
					top = $root.scrollTop() + ($root.height() - $element.outerHeight()) / 2;
				} else if (top === POSITION_CONSTRAINT.top) {
					top = $root.scrollTop();
				} else if (top === POSITION_CONSTRAINT.bottom) {
					top = $root.scrollTop() + $root.height() - $element.outerHeight();
				} else {
					// キーワード指定じゃない場合は$rootからの相対位置
					top = $appendTarget.offset().top + parseFloat(top);
				}

				// leftがキーワード指定('left','center','right'の場合
				if (left === POSITION_CONSTRAINT.center) {
					left = $root.scrollLeft() + ($root.width() - $element.outerWidth()) / 2;
				} else if (left === POSITION_CONSTRAINT.left) {
					left = $root.scrollLeft();
				} else if (left === POSITION_CONSTRAINT.right) {
					left = $root.scrollLeft() + $root.width() - $element.outerWidth();
				} else {
					// キーワード指定じゃない場合はappendしたルートからの相対位置
					left = $appendTarget.offset().left + parseFloat(left);
				}
				topLeftStyle.top = top;
				topLeftStyle.left = left;
			}

			switch (this.type) {
			case 'arrow':
				// 吹き出しの向き設定
				var dir = param.direction || 'down';
				$element.removeClass('up down right left');
				$element.addClass(dir);
				// targetから表示位置を取得する
				// positionまたはtargetはどちらかの指定が必須。
				var $target = $(param.target);
				if (!$target.length) {
					// targetに何も指定されていないなら位置は計算しない
					break;
				}

				// targetから位置を計算する。targetが指定されている場合はpositionの設定は無視。
				var targetW = $target.outerWidth();
				var targetH = $target.outerHeight();
				topLeftStyle = $target.offset();
				// $targetと$arrowboxの左上の位置を合わせる
				if (dir === 'up' || dir === 'down') {
					// 吹き出しの位置が$targetの真ん中に来るように合わせる
					topLeftStyle.left += (targetW - $element.outerWidth()) / 2;
					if (dir === 'up') {
						// 吹き出し分だけ上に移動
						topLeftStyle.top -= $element.outerHeight() + ARROW_SIZE;
					} else {
						// $target分だけ下に移動
						topLeftStyle.top += targetH + ARROW_SIZE;
					}
				} else {
					// 吹き出しの位置が$targetの真ん中に来るように合わせる
					topLeftStyle.top += (targetH - $element.outerHeight()) / 2;
					if (dir === 'left') {
						// 吹き出し分だけ左に移動
						topLeftStyle.left -= $element.outerWidth() + ARROW_SIZE;
					} else {
						// $target分だけ下に移動
						topLeftStyle.left += targetW + ARROW_SIZE;
					}
				}
				break;
			default:
			}
			$element.css(topLeftStyle);
			$element.removeClass('hidden');

			if (param.animation !== false) {
				// animationはデフォルトでtrue
				animateShow($element);
			}

			if (param.modal) {
				$element.css('z-index', 10001);
				// オーバレイを表示
				showOverlay($root);
			}

			this._displaying = true;
			return $element.promise();
		},
		hide: function(isAnimation) {
			if (!this._displaying) {
				return;
			}
			// TODO アニメーションするかどうか引数にとる
			this.$element.stop(true, true);
			if (isAnimation === false) {
				this.$element.css('display', 'none');
			} else {
				animateHide(this.$element);
			}
			this.$element.addClass('hidden');
			this._displaying = false;
		},
		setContent: function(content) {
			this.$content.children().remove();
			this.$content.append(content);
		},
		remove: function() {
			this.hide();
			this.$element.remove();
			delete scenesMap[this.id];
			// nullifyする
			for ( var p in this) {
				this[p] = null;
			}
		},
		reflesh: function(param) {
			if (!this._displaying) {
				// 表示中じゃない場合は何もしない
				return;
			}
			// showの時に渡されたパラメータにrefleshに渡されたパラメータをマージしてshowを呼び出す
			this.show($.extend(this._showParam, param));
		},
		_animatePromise: null,
		_showParam: null,
		_displaying: false
	});

	/**
	 * Sceneを作成する
	 *
	 * @memberOf h5.scene
	 * @param {String|DOM|jQuery} element
	 * @param {String} type
	 * @returns {Scene}
	 */
	function createScene(element, type) {
		return new Scene(element, type);
	}

	/**
	 * SceneをIDから取得する
	 */
	function getSceneById(id) {
		return scenesMap[id];
	}

	var controller = {
		__name: 'my.project.ui.DividedBoxController',

		box: h5.res.require('selector@.listItem.mail|$'),

		dividedBox: h5.res.require('c::ui.DividedBox'),

		dividedBox: h5.res.require('c:ui.DividedBox'),

		test: 1
	};

	// =============================
	// Expose to window
	// =============================
	/**
	 * @namespace
	 * @name scene
	 * @memberOf h5
	 */
	h5.u.obj.expose('h5.scene', {
		createScene: createScene,
		getSceneById: getSceneById
	});
})();
