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

$(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	//=============================
	// Variables
	//=============================

	//=============================
	// Functions
	//=============================

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================

	module("h5scopedglobals.js");

	//=============================
	// Body
	//=============================

	test('[build#min]throwFwError()', function() {
		var func = window.com && window.com.htmlhifive ? window.com.htmlhifive.throwFwError : null;

		raises(function(enviroment) {
			func();
		}, function(actual) {
			return 'FwError: code = undefined' === actual.message;
		}, 'エラーコードを指定しない場合は「FwError: code = undefined」が表示されること。');

		raises(function(enviroment) {
			func(0);
		}, function(actual) {
			return 'FwError: code = 0' === actual.message;
		}, '存在しないエラーコードの場合は「FwError: code = x」表示されること。');

		raises(function(enviroment) {
			func(10000);
		}, function(actual) {
			return 'ログターゲットのtypeには、オブジェクト、もしくは"console"のみ指定可能です。(code=10000)' === actual.message;
		}, 'エラーコードに紐づくエラーメッセージがmesasgeプロパティに保持していること。');

		raises(function(enviroment) {
			func(7003, [1000, 'aaa']);
		}, function(actual) {
			return 'テンプレートファイルを取得できませんでした。ステータスコード:1000, URL:aaa(code=7003)' === actual.message;
		}, 'エラーコードに紐づくエラーメッセージがmesasgeプロパティに保持していること。');
	});
});
