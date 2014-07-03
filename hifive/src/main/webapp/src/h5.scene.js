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
	 * アニメーション関数
	 *
	 * @param {jQuery} $element アニメーションさせる要素
	 */
	function animate($element) {
		var height = $element.height();
		$element.css('height', 0);
		$element.addClass('inAnimation');
		$element.animate({
			height: height,
			opacity: 1
		}, "slow");
		$element.promise().done(function() {
			$element.removeClass('inAnimation');
		});
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
			param = param || {};
			this.hide();
			var $root = $(param.rootElement || document.body);
			var $element = this.$element;
			var position = param.position;
			var styles = {
				position: 'absolute',
				display: 'block'
			};
			$root.append($element);
			$element.css(styles);

			switch(this.type){
			case 'arrow':
				if(position){
					$element.css(position);
					break;
				}
				var dir = param.direction || 'down';
				$element.removeClass('up down right left');
				$element.addClass(dir);
				// targetから表示位置を取得する
				// positionまたはtargetはどちらかの指定が必須。
				var $target = $(param.target);
				var targetW = $target.outerWidth();
				var targetH = $target.outerHeight();
				var arrowboxPosition =  $target.offset();
				// $targetと$arrowboxの左上の位置を合わせる
				if (dir === 'up' || dir === 'down') {
					// 吹き出しの位置が$targetの真ん中に来るように合わせる
					arrowboxPosition.left += (targetW - $element.outerWidth()) / 2;
					if (dir === 'up') {
						// 吹き出し分だけ上に移動
						arrowboxPosition.top -= $element.outerHeight() + ARROW_SIZE;
					} else {
						// $target分だけ下に移動
						arrowboxPosition.top += targetH + ARROW_SIZE;
					}
				} else {
					// 吹き出しの位置が$targetの真ん中に来るように合わせる
					arrowboxPosition.top += (targetH - $element.outerHeight()) / 2;
					if (dir === 'left') {
						// 吹き出し分だけ左に移動
						arrowboxPosition.left -= $element.outerWidth() + ARROW_SIZE;
					} else {
						// $target分だけ下に移動
						arrowboxPosition.left += targetW + ARROW_SIZE;
					}
				}
				$element.css(arrowboxPosition);
				break;
			default:
				$element.css(position);
			}
			animate($element);
			return $element.promise();
		},
		hide: function() {
			// TODO アニメーションするかどうか引数にとる
			this.$element.stop(true, true);
			this.$element.css('display', 'none');
		},
		setContent: function(content) {
			this.$content.children().remove();
			this.$content.append(content);
		},
		remove: function(){
			this.hide();
			this.$element.remove();
			delete(scenesMap,this.id);
			for(var p in this){
				this[p] = null;
			}
		},
		_animatePromise: null
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
