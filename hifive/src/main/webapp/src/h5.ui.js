/*
 * Copyright (C) 2011-2012 NS Solutions Corporation.
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
/* ------ h5.ui ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	/**
	 * メッセージを表示する要素のクラス名
	 */
	var CLASS_INDICATOR_THROBBER = 'indicator-throbber';

	/**
	 * スロバーを表示する要素のクラス名
	 */
	var CLASS_INDICATOR_MESSAGE = 'indicator-message';

	/**
	 * スロバー内に進捗率(パーセント)を表示する要素のクラス名
	 */
	var CLASS_THROBBER_PERCENT = 'throbber-percent';

	/**
	 * 一番外側にあるVML要素のクラス名
	 */
	var CLASS_VML_ROOT = 'vml-root';

	/**
	 * BlockUIのメッセージ欄に表示する文字列のフォーマット
	 */
	var FORMAT_THROBBER_MESSAGE_AREA = '<span class="' + CLASS_INDICATOR_THROBBER
			+ '"></span><span class="' + CLASS_INDICATOR_MESSAGE + '" {0}>{1}</span>';

	// =============================
	// Production
	// =============================

	// =============================
	// Development Only
	// =============================

	/* del begin */
	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	var isPromise = h5.async.isPromise;
	var h5ua = h5.env.ua;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	// =============================
	// Variables
	// =============================
	// キーにスタイルクラス名、値に読み込む対象のプロパティを保持するマップ
	var throbberStyleMap = {
		throbber: ['width', 'height'],
		'throbber-line': ['width', 'color']
	};

	/**
	 * Canvasをサポートしているか
	 * <p>
	 * (true:サポート/false:未サポート)
	 */
	var isCanvasSupported = true;

	/**
	 * VMLをサポートしているか (true:サポート/false:未サポート)
	 */
	// 機能ベースでの判定方法が無いため、ブラウザの種類で判定する
	var isVMLSupported = h5ua.isIE;


	// =============================
	// Functions
	// =============================

	/**
	 * CSSファイルに書かれた、Canvasのスタイル定義を取得します。
	 */
	function readThrobberStyle(theme) {
		var readStyles = {};

		for ( var prop in throbberStyleMap) {
			var $elem = $('<div></div>').addClass(theme).addClass(prop).appendTo('body');
			var propCamel = $.camelCase(prop);

			readStyles[propCamel] = {};

			$.map(throbberStyleMap[prop], function(item, idx) {
				if (item === 'width' || item === 'height') {
					readStyles[propCamel][item] = parseInt($elem.css(item).replace(/\D/g, ''), 10);
				} else {
					readStyles[propCamel][item] = $elem.css(item);
				}
			});

			$elem.remove();
		}

		return readStyles;
	}

	/**
	 * VML要素を生成します。
	 */
	function createVMLElement(tagName, opt) {
		var elem = window.document.createElement('v:' + tagName);

		for ( var prop in opt) {
			elem.style[prop] = opt[prop];
		}

		return elem;
	}

	/**
	 * 要素のサイズから、スロバーの線を引く座標を計算します。
	 */
	function calculateLineCoords(size, line) {
		var positions = [];
		var centerPos = size / 2;
		var radius = size * 0.8 / 2;
		var eachRadian = 360 / line * Math.PI / 180;

		for ( var j = 1; j <= line; j++) {
			var rad = eachRadian * j;
			var cosRad = Math.cos(rad),sinRad = Math.sin(rad);
			positions.push({
				from: {
					x: centerPos + radius / 2 * cosRad,
					y: centerPos + radius / 2 * sinRad
				},
				to: {
					x: centerPos + radius * cosRad,
					y: centerPos + radius * sinRad
				}
			});
		}

		return positions;
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	// VMLとCanvasのサポート判定
	$(function() {
		// Cnavasがサポートされているかチェック
		isCanvasSupported = !!document.createElement("canvas").getContext;

		if (!isCanvasSupported && isVMLSupported) {
			document.namespaces.add('v', 'urn:schemas-microsoft-com:vml');
			document.createStyleSheet().cssText = ['v\\:stroke', 'v\\:line', 'v\\:textbox']
					.join(',')
					+ '{behavior\: url(#default#VML);}';
		}
	});

	/**
	 * VML版スロバー (IE 6,7,8)用
	 */
	function ThrobberVML(opt) {
		this.style = $.extend(true, {}, opt);

		var w = this.style.throbber.width;
		var h = this.style.throbber.height;

		this.group = createVMLElement('group', {
			width: w + 'px',
			height: h + 'px'
		});
		this.group.className = CLASS_VML_ROOT;

		var positions = calculateLineCoords(w, this.style.throbber.lines);
		var lineColor = this.style.throbberLine.color;
		var lineWidth = this.style.throbberLine.width;

		for ( var i = 0, len = positions.length; i < len; i++) {
			var pos = positions[i];
			var from = pos.from;
			var to = pos.to;
			var e = createVMLElement('line');
			e.strokeweight = lineWidth;
			e.strokecolor = lineColor;
			e.fillcolor = lineColor;
			e.from = from.x + ',' + from.y;
			e.to = to.x + ',' + to.y;
			var ce = createVMLElement('stroke');
			ce.opacity = 1;
			e.appendChild(ce);
			this.group.appendChild(e);
		}

		this._createPercentArea();
	}

	ThrobberVML.prototype = {
		show: function(root) {
			if (!root) {
				return;
			}

			this.root = root;
			this.highlightPos = 1;
			this.hide();
			this.root.appendChild(this.group);
			this._run();
		},
		hide: function() {
			if (!this.root) {
				return;
			}

			this.root.innerHTML = "";

			if (this._runId) {
				clearTimeout(this._runId);
				this._runId = null;
			}
		},
		_run: function() {
			var lineCount = this.style.throbber.lines;
			var roundTime = this.style.throbber.roundTime;
			var highlightPos = this.highlightPos;
			var lines = this.group.childNodes;

			for ( var i = 0, len = lines.length; i < len; i++) {
				var child = lines[i];

				if (child.nodeName === 'textbox') {
					continue;
				}

				var lineNum = i + 1;
				var line = child.firstChild;
				if (lineNum == highlightPos) {
					line.opacity = "1";
				} else if (lineNum == highlightPos + 1 || lineNum == highlightPos - 1) {
					line.opacity = "0.75";
				} else {
					line.opacity = "0.4";
				}
			}

			if (highlightPos == lineCount) {
				highlightPos = 0;
			} else {
				highlightPos++;
			}

			this.highlightPos = highlightPos;
			var perMills = Math.floor(roundTime / lineCount);

			if (perMills < 50) {
				perMills = 50;
			}
			var that = this;

			this._runId = setTimeout(function() {
				that._run.call(that);
			}, perMills);
		},
		_createPercentArea: function() {
			var textPath = createVMLElement('textbox');
			var $table = $('<table><tr><td></td></tr></table>');
			var $td = $table.find('td');
			$td.width(this.group.style.width);
			$td.height(this.group.style.height);
			$td.css('line-height', this.group.style.height);
			$td.addClass(CLASS_THROBBER_PERCENT);

			textPath.appendChild($table[0]);
			this.group.appendChild(textPath);
		},
		setPercent: function(percent) {
			$(this.group).find('.' + CLASS_THROBBER_PERCENT).html(percent);
		}
	};

	/**
	 * Canvas版スロバー
	 */
	var ThrobberCanvas = function(opt) {
		this.style = $.extend(true, {}, opt);
		this.canvas = document.createElement('canvas');
		this.baseDiv = document.createElement('div');
		this.percentDiv = document.createElement('div');

		var canvas = this.canvas;
		var baseDiv = this.baseDiv;
		var percentDiv = this.percentDiv;
		// CSSファイルから読み取ったスタイルをCanvasに適用する
		canvas.width = this.style.throbber.width;
		canvas.height = this.style.throbber.height;
		canvas.style.display = 'block';
		canvas.style.position = 'absolute';
		baseDiv.style.width = this.style.throbber.width + 'px';
		baseDiv.style.height = this.style.throbber.height + 'px';
		baseDiv.appendChild(canvas);
		// パーセント表示用DIV
		percentDiv.style.width = this.style.throbber.width + 'px';
		percentDiv.style.height = this.style.throbber.height + 'px';
		percentDiv.style.lineHeight = this.style.throbber.height + 'px';
		percentDiv.className = CLASS_THROBBER_PERCENT;
		baseDiv.appendChild(percentDiv);

		this.positions = calculateLineCoords(canvas.width, this.style.throbber.lines);
	};

	ThrobberCanvas.prototype = {
		show: function(root) {
			if (!root) {
				return;
			}

			this.root = root;
			this.highlightPos = 1;
			this.hide();
			root.appendChild(this.baseDiv);
			this._run();
		},
		hide: function() {
			if (!this.root) {
				return;
			}

			this.root.innerHTML = "";

			if (this._runId) {
				clearTimeout(this._runId);
				this._runId = null;
			}
		},
		_run: function() {
			var canvas = this.canvas;
			var ctx = canvas.getContext('2d');
			var highlightPos = this.highlightPos;
			var positions = this.positions;
			var lineColor = this.style.throbberLine.color;
			var lineWidth = this.style.throbberLine.width;
			var lineCount = this.style.throbber.lines;
			var roundTime = this.style.throbber.roundTime;

			canvas.width = canvas.width;

			for ( var i = 0, len = positions.length; i < len; i++) {
				ctx.beginPath();
				ctx.strokeStyle = lineColor;
				ctx.lineWidth = lineWidth;
				var lineNum = i + 1;
				if (lineNum == highlightPos) {
					ctx.globalAlpha = 1;
				} else if (lineNum == highlightPos + 1 || lineNum == highlightPos - 1) {
					ctx.globalAlpha = 0.75;
				} else {
					ctx.globalAlpha = 0.4;
				}
				var pos = positions[i];
				var from = pos.from;
				var to = pos.to;
				ctx.moveTo(from.x, from.y);
				ctx.lineTo(to.x, to.y);
				ctx.stroke();
			}
			if (highlightPos == lineCount) {
				highlightPos = 0;
			} else {
				highlightPos++;
			}
			this.highlightPos = highlightPos;
			var perMills = Math.floor(roundTime / lineCount);

			if (perMills < 50) {
				perMills = 50;
			}
			var that = this;

			this._runId = setTimeout(function() {
				that._run.call(that);
			}, perMills);
		},
		setPercent: function(percent) {
			this.percentDiv.innerHTML = percent;
		}
	};



	/**
	 * インジケータ(メッセージ・画面ブロック・進捗表示)の表示や非表示を行うクラス。
	 *
	 * @class
	 * @name Indicator
	 * @param {String|Object} target インジケータを表示する対象のDOMオブジェクトまたはセレクタ
	 * @param {Object} [option] オプション
	 * @param {String} [option.message] メッセージ
	 * @param {Number} [option.percent] 進捗を0～100の値で指定する。
	 * @param {Boolean} [option.block] 操作できないよう画面をブロックするか (true:する/false:しない)
	 * @param {Promise|Promise[]} [option.promises] Promiseオブジェクト (Promiseの状態に合わせて自動でインジケータの非表示を行う)
	 * @param {String} [option.theme] インジケータの基点となるクラス名 (CSSでテーマごとにスタイルを変更する場合に使用する)
	 */
	function Indicator(target, option) {
		$.blockUI.defaults.css = {};
		$.blockUI.defaults.overlayCSS = {};

		this.target = h5.u.obj.isJQueryObject(target) ? target.get(0) : target;

		var that = this;
		var $target = this._isGlobalBlockTarget() ? $('body') : $(this.target);
		var targetPositionStatic = $target.css('position');
		var targetZoom = $target.css('zoom');

		// optionのデフォルト値
		var opts = $.extend(true, {}, {
			message: '',
			percent: -1,
			block: true,
			promises: null,
			theme: 'a'
		}, option);
		// BlockUIのスタイル定義
		var blockUISetting = {
			message: h5.u.str.format(FORMAT_THROBBER_MESSAGE_AREA,
					(opts.message === '') ? 'style="display: none;"' : '', opts.message),
			css: {},
			overlayCSS: {},
			blockMsgClass: opts.theme,
			showOverlay: opts.block,
			centerX: false,
			centerY: false,
			onUnblock: function() { // blockUIが、画面ブロックの削除時に実行するコールバック関数
				// インジケータを表示する要素のpositionがstaticの場合、blockUIがroot要素のpositionをrelativeに書き換えるため、インジケータを表示する前の状態に戻す
				$target.css('position', targetPositionStatic);
				// IEの場合、blockUIがroot要素にzoom:1を設定するため、インジケータを表示する前の状態に戻す
				$target.css('zoom', targetZoom);
				that.throbber.hide();
			}
		};
		// スロバーのスタイル定義 (基本的にはCSSで記述する。ただし固定値はここで設定する)
		var throbberSetting = {
			throbber: {
				roundTime: 1000,
				lines: 12
			},
			throbberLine: {},
			percent: {}
		};

		var promises = opts.promises;
		var promiseCallback = $.proxy(function() {
			this.hide();
		}, this);

		if ($.isArray(promises)) {
			$.map(promises, function(item, idx) {
				return isPromise(item) ? item : null;
			});

			if (promises.length > 0) {
				$.when.apply(null, promises).pipe(promiseCallback, promiseCallback);
			}
		} else if (isPromise(promises)) {
			promises.pipe(promiseCallback, promiseCallback);
		}

		var canvasStyles = readThrobberStyle(opts.theme);
		throbberSetting = $.extend(true, throbberSetting, canvasStyles);

		this._style = $.extend(true, {}, blockUISetting, throbberSetting);

		if (isCanvasSupported) {
			this.throbber = new ThrobberCanvas(this._style);
		} else if (isVMLSupported) {
			this.throbber = new ThrobberVML(this._style);
		}

		if (this.throbber && opts.percent > -1) {
			this.throbber.setPercent(opts.percent);
		}
	}

	Indicator.prototype = {
		/**
		 * 画面上にインジケータ(メッセージ・画面ブロック・進捗表示)を表示します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @returns {Indicator} インジケータオブジェクト
		 */
		show: function() {
			var setting = this._style;
			var $blockElement = null;

			if (this._isGlobalBlockTarget()) {
				$.blockUI(setting);
				$blockElement = $('body').children(
						'.blockUI.' + setting.blockMsgClass + '.blockPage');
			} else {
				var $target = $(this.target);
				$target.block(setting);
				$blockElement = $target.children('.blockUI.' + setting.blockMsgClass
						+ '.blockElement');
			}

			this.throbber.show($blockElement.children('.' + CLASS_INDICATOR_THROBBER)[0]);
			this._setPositionAndResizeWidth();
			return this;
		},
		/**
		 * 内部のコンテンツ納まるようイジケータの幅を調整し、表示位置(topとleft)が中央になるよう設定します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @private
		 */
		_setPositionAndResizeWidth: function() {
			var setting = this._style;
			var $blockParent = null;
			var $blockElement = null;
			var width = 0;

			if (this._isGlobalBlockTarget()) {
				$blockParent = $('body');
				$blockElement = $blockParent.children('.blockUI.' + setting.blockMsgClass
						+ '.blockPage');
				// 画面全体をブロックするので、windowからheightを取得する
				$blockElement.css('top', (($(window).height() - $blockElement.outerHeight()) / 2)
						+ 'px');
			} else {
				$blockParent = $(this.target);
				$blockElement = $blockParent.children('.blockUI.' + setting.blockMsgClass
						+ '.blockElement');
				$blockElement.css('top',
						(($blockParent.height() - $blockElement.outerHeight()) / 2) + 'px');
			}

			var blockElementPadding = $blockElement.innerWidth() - $blockElement.width();

			$blockElement.children().each(function() {
				width += $(this).outerWidth(true);
			});

			$blockElement.width(width + blockElementPadding);
			$blockElement.css('left', (($blockParent.width() - $blockElement.outerWidth()) / 2)
					+ 'px');
		},
		/**
		 * 指定された要素がウィンドウ領域全体をブロックすべき要素か判定します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @private
		 * @returns {Boolean} 領域全体に対してブロックする要素か (true:対象要素 / false: 非対象要素)
		 */
		_isGlobalBlockTarget: function() {
			return this.target === document || this.target === window
					|| this.target === document.body;
		},
		/**
		 * 画面上に表示されているインジケータ(メッセージ・画面ブロック・進捗表示)を除去します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @returns {Indicator} インジケータオブジェクト
		 */
		hide: function() {
			if (this._isGlobalBlockTarget()) {
				$.unblockUI();
			} else {
				$(this.target).unblock();
			}

			return this;
		},
		/**
		 * 進捗のパーセント値を指定された値に更新します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @param {Number} percent 進捗率(0～100%)
		 * @returns {Indicator} インジケータオブジェクト
		 */
		percent: function(percent) {
			if (typeof percent === 'number' && percent >= 0 && percent <= 100) {
				this.throbber.setPercent(percent);
			}

			return this;
		},
		/**
		 * メッセージを指定された値に更新します。
		 *
		 * @memberOf Indicator
		 * @function
		 * @param {String} message メッセージ
		 * @returns {Indicator} インジケータオブジェクト
		 */
		message: function(message) {
			if (typeof message === 'string') {
				var setting = this._style;
				var $blockElement = null;

				if (this._isGlobalBlockTarget()) {
					$blockElement = $('body').children(
							'.blockUI.' + setting.blockMsgClass + '.blockPage');

				} else {
					$blockElement = $(this.target).children(
							'.blockUI.' + setting.blockMsgClass + '.blockElement');
				}

				$blockElement.children('.' + CLASS_INDICATOR_MESSAGE)
						.css('display', 'inline-block').text(message);

				this._setPositionAndResizeWidth();
			}

			return this;
		}
	};

	/**
	 * 指定された要素に対して、インジケータ(メッセージ・画面ブロック・進捗)の表示や非表示を行うためのオブジェクトを取得します。
	 * <h4>使用例</h4>
	 * <b>画面全体をブロックする場合</b><br>
	 * ・画面全体をブロックする場合、targetオプションに<b>document</b>、<b>window</b>または<b>body</b>を指定する。<br>
	 *
	 * <pre>
	 * var indicator = h5.ui.indicator({
	 * 	target: document,
	 * }).show();
	 * </pre>
	 *
	 * <b>li要素にスロバー(くるくる回るアイコン)を表示してブロックを表示しないる場合</b><br>
	 *
	 * <pre>
	 * var indicator = h5.ui.indicator('li', {
	 * 	block: false
	 * }).show();
	 * </pre>
	 *
	 * <b>パラメータにPromiseオブジェクトを指定して、done()/fail()の実行と同時にインジケータを除去する</b><br>
	 * resolve() または resolve() が実行されると、画面からインジケータを除去します。
	 *
	 * <pre>
	 * var df = $.Deferred();
	 * var indicator = h5.ui.indicator(document, {
	 * 	promises: df.promise()
	 * }).show();
	 *
	 * setTimeout(function() {
	 * 	df.resolve() // ここでイジケータが除去される
	 * }, 2000);
	 * </pre>
	 *
	 * <b>パラメータに複数のPromiseオブジェクトを指定して、done()/fail()の実行と同時にインジケータを除去する</b><br>
	 * Promiseオブジェクトを複数指定すると、全てのPromiseオブジェクトでresolve()が実行されるか、またはいずれかのPromiseオブジェクトでfail()が実行されるタイミングでインジケータを画面から除去します。
	 *
	 * <pre>
	 * var df = $.Deferred();
	 * var df2 = $.Deferred();
	 * var indicator = h5.ui.indicator(document, {
	 * 	promises: [df.promise(), df2.promise()]
	 * }).show();
	 *
	 * setTimeout(function() {
	 * 	df.resolve()
	 * }, 2000);
	 *
	 * setTimeout(function() {
	 * 	df.resolve() // ここでイジケータが除去される
	 * }, 4000);
	 * </pre>
	 *
	 * <p>
	 * コントローラのindicator()の仕様については、<a href="./Controller.html#indicator">Controller.indicator</a>のドキュメント
	 * を参照下さい。
	 *
	 * @memberOf h5.ui
	 * @name indicator
	 * @function
	 * @param {String|Object} target インジケータを表示する対象のDOMオブジェクトまたはセレクタ
	 * @param {String} [option.message] メッセージ
	 * @param {Number} [option.percent] 進捗を0～100の値で指定する。
	 * @param {Boolean} [option.block] 操作できないよう画面をブロックするか (true:する/false:しない)
	 * @param {Object} [option.style] スタイルオプション (詳細はIndicatorクラスのドキュメントを参照)
	 * @param {Promise|Promise[]} [option.promises] Promiseオブジェクト (Promiseの状態に合わせて自動でインジケータの非表示を行う)
	 * @param {String} [options.theme] インジケータの基点となるクラス名 (CSSでテーマごとにスタイルをする場合に使用する)
	 * @see Indicator
	 * @see Controller.indicator
	 */
	var indicator = function(target, option) {
		return new Indicator(target, option);
	};

	/**
	 * 要素が可視範囲内、または指定した親要素内にあるかどうかを返します。
	 * <p>
	 * 第2引数を省略した場合、要素がウィンドウ内に見えているかどうかを返します。 elementが他のDOM要素によって隠れていても、範囲内にあればtrueを返します。
	 * </p>
	 * <p>
	 * 第2引数を指定した場合、elementがcontaienrの表示範囲内で見えているかどうかを返します。 containerがウィンドウ内に見えているかどうかは関係ありません。
	 * elementがcontainerの子孫要素で無ければundefinedを返します。
	 * </p>
	 * <p>
	 * いずれの場合も、要素が非表示の場合の動作は保障されません。
	 * </p>
	 *
	 * @param {String|Element|jQuery} element 要素
	 * @param {Object} container コンテナ
	 * @returns {Boolean} 要素が可視範囲内にあるかどうか
	 * @name isInView
	 * @function
	 * @memberOf h5.ui
	 */
	var isInView = function(element, container) {
		var viewTop,viewBottom,viewLeft,viewRight;
		var $element = $(element);
		var height,width;
		var $container;
		// containerの位置を取得。borderの内側の位置で判定する。
		if (container === undefined) {
			// containerが指定されていないときは、画面表示範囲内にあるかどうか判定する
			height = h5.env.ua.isiOS ? window.innerHeight : $(window).height();
			width = h5.env.ua.isiOS ? window.innerWidth : $(window).width();
			viewTop = $(window).scrollTop();
			viewLeft = $(window).scrollLeft();
		} else {
			$container = $(container);
			if ($container.find($element).length === 0) {
				// elementとcontaienrが親子関係でなければundefinedを返す
				return undefined;
			}
			viewTop = $container.offset().top + parseInt($container.css('border-top-width'));
			viewLeft = $container.offset().left + parseInt($container.css('border-left-width'));
			height = $container.innerHeight();
			width = $container.innerWidth();
		}
		viewBottom = viewTop + height;
		viewRight = viewLeft + width;

		// elementの位置を取得。borderの外側の位置で判定する。
		var positionTop = $element.offset().top;
		var positionLeft = $element.offset().left;
		var positionBottom = positionTop + $element.outerHeight();
		var positionRight = positionLeft + $element.outerWidth();
		return ((viewTop <= positionTop && positionTop < viewBottom) || (viewTop < positionBottom && positionBottom <= viewBottom))
				&& ((viewLeft <= positionLeft && positionLeft < viewRight) || (viewLeft < positionRight && positionRight <= viewRight));
	};

	/**
	 * ブラウザのトップにスクロールします。
	 *
	 * @name scrollToTop
	 * @function
	 * @memberOf h5.ui
	 */
	var scrollToTop = function(wait) {
		var waitCount = 3;
		var waitMillis = 500;
		function fnScroll() {
			if (window.scrollY === 1) {
				waitCount = 0;
			}
			if (waitCount > 0) {
				window.scrollTo(0, 1);
				waitCount--;
				setTimeout(fnScroll, waitMillis);
			}
		}

		window.scrollTo(0, 1);
		if (window.scrollY !== 1) {
			setTimeout(fnScroll, waitMillis);
		}
	};

	// =============================
	// Expose to window
	// =============================

	h5.u.obj.expose('h5.ui', {
		indicator: indicator,
		isInView: isInView,
		scrollToTop: scrollToTop
	});
})();