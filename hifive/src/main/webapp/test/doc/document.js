/*
 * Copyright (C) 2012-2013 NS Solutions Corporation
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
$(function() {

	/**
	 * TestLogicクラス
	 *
	 * @class
	 * @name TestLogic
	 */
	function TestLogic() {
	//
	}

	/**
	 * 通常のメソッド
	 *
	 * @memberOf TestLogic
	 */
	TestLogic.prototype.method1 = function() {
	//
	};

	/**
	 * プライベートメソッド
	 *
	 * @memberOf TestLogic
	 */
	TestLogic.prototype._privateMethod1 = function() {
	//
	};

	/**
	 * staticなプロパティ
	 */
	TestLogic.prop1 = 1;


	/**
	 * コントローラのドキュメントが正常に出力されるか
	 *
	 * @name com.htmlhifive.XxxController
	 * @namespace
	 */
	var controller = {

		/**
		 * コントローラ名
		 *
		 * @memberOf com.htmlhifive.XxxController
		 */
		__name: 'com.htmlhifive.XxxController',

		/**
		 * テンプレート
		 *
		 * @memberOf com.htmlhifive.XxxController
		 */
		__template: ['t1.ejs,', 't2.ejs'],

		/**
		 * inheritHandler
		 *
		 * @memberOf com.htmlhifive.XxxController
		 */
		__inheritHandlers: [{}, {}],

		/**
		 * プロパティ1
		 *
		 * @memberOf com.htmlhifive.XxxController
		 */
		prop1: 1,

		/**
		 * 通常のメソッド
		 *
		 * @memberOf com.htmlhifive.XxxController
		 */
		hoge: function() {
		//
		},

		/**
		 * 通常のメソッド(パス間違い)
		 *
		 * @memberOf jp.nssol.XxxController
		 */
		fuga: function() {
		//
		},

		/**
		 * イベントハンドラ(クラスセレクタ)
		 *
		 * @memberOf com.htmlhifive.XxxController
		 */
		"div.fuga click": function() {
		//
		},

		/**
		 * イベントハンドラ(id指定)
		 *
		 * @memberOf com.htmlhifive.XxxController
		 */
		"#foo click": function() {
		//
		},

		/**
		 * シングルクォーテーションでドキュメントが出力されるか
		 *
		 * @memberOf com.htmlhifive.XxxController
		 */
		'#bar click': function() {
		//
		},

		/**
		 * イベントハンドラ(コントローラ外の要素 ＋ bind)
		 *
		 * @memberOf com.htmlhifive.XxxController
		 */
		"{document} [scroll]": function() {
		//
		}

	};

	/**
	 * コントローラのドキュメントが正常に出力されるか(パッケージ違いの同名コントローラ)
	 *
	 * @name XxxController
	 * @namespace
	 * @memberOf com.htmlhifive.piyo
	 */
	var controller2 = {

		/**
		 * コントローラ名
		 *
		 * @memberOf com.htmlhifive.piyo.XxxController
		 */
		__name: 'com.htmlhifive.piyo.XxxController',

		/**
		 * 通常のメソッド(com.htmlhifive.piyo.XxxController)
		 *
		 * @memberOf com.htmlhifive.piyo.XxxController
		 */
		hoge: function() {
		//
		},

		/**
		 * 他のパスのコントローラをmemberOfに書くとどうなるか
		 *
		 * @memberOf com.htmlhifive.XxxController
		 */
		piyo: function() {
		//
		}

	};
});