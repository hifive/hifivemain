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

// skipCurrentModuleが呼ばれたときに、スキップするモジュールを覚えておく
var skipModules = {};

// resolve済みかどうかをチェックする関数
function isResolved(dfd) {
	return dfd.isResolved ? dfd.isResolved() : dfd.state() === 'resolved';
}

// reject済みかどうかをチェックする関数
function isRejected(dfd) {
	return dfd.isRejected ? dfd.isRejected() : dfd.state() === 'rejected';
}

// rgb(0,0,0) -> #00000 に変換しかつ、#001122を#012のようにショートハンドにする
function rgbToHex(rgbStr) {
	if (/^#\d{3,6}$/.test(rgbStr)) {
		return rgbStr;
	}

	var hexStr = '#';
	var patterns = rgbStr.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

	if (!patterns) {
		return rgbStr;
	}

	var hexs = [];

	for (var i = 1; i < patterns.length; i++) {
		hexs.push(("0" + parseInt(patterns[i]).toString(16)).slice(-2));
	}

	// #9922ff->#92fのようにショートハンドに変換する
	if (hexs[0][0] === hexs[0][1] && hexs[1][0] === hexs[1][1] && hexs[2][0] === hexs[2][1]) {
		hexStr += (hexs[0][0] + hexs[1][0] + hexs[2][0]);
	} else {
		hexStr += hexs.join('');
	}

	return hexStr;
}

/**
 * 読み込んでいるhifiveがdev版かどうか
 *
 * @memberOf
 * @returns
 */
function isDevMode() {
	return !!h5.dev;
}

/**
 * コントローラがdisposeされているかどうかチェックします
 *
 * @param controller
 * @returns {Boolean}
 */
function isDisposed(controller) {
	var ret = true;
	for ( var p in controller) {
		if (controller.hasOwnProperty(p) && controller[p] !== null) {
			ret = false;
		}
	}
	return ret;
}

/**
 * iframeを作成 IE11でjQuery1.10.1,2.0.2の場合、iframe内の要素をjQueryで操作するとき、
 * jQuery内部のsetDocumentでattachEventが呼ばれてエラーになる(IE11にはattachEventがないため)
 * ので、IE11&&(jQuery1.10.1||2.0.2)の場合は、この関数を使ったテスト=iframeを使ったテストは行わない。
 *
 * @memberOf
 * @returns
 */
function createIFrameElement() {
	var dfd = h5.async.deferred();
	var iframe = document.createElement('iframe');
	$('#qunit-fixture').append(iframe);
	// chrome,safari,operaの場合、iframeをappendした瞬間にreadystatechange='complete'になっている
	// ie,firefoxの場合はuninitializedなので、readyStateが'complete'になるのを待つ必要があるので、
	// 共通で待機できるようsetTimeout()でチェックして完了するまで待っている。
	// # onreadystatechangeはfirefoxの場合だと使えない。
	// # firefoxでは、iframeの準備ができたらcontentDocumentが指し替わる。
	// # 指し替わる前のdocumentのreadystateはずっとuninitializedのままなので、ハンドラを引っかけても発火しない
	function check() {
		// iframe.contentDocumentはIE7-で使えないので、contentWindowからdocumentを取得
		var win = iframe.contentWindow;
		var doc = win.document;
		if (doc.readyState !== 'complete') {
			setTimeout(check, 10);
			return;
		}
		dfd.resolve(iframe, doc, win);
	}
	setTimeout(check, 10);
	return dfd.promise();
}

/**
 * ポップアップウィンドウを開く
 * <p>
 * IE8でjQuery1.10.1,2.0.2の場合、ポップアップ内の要素をjQueryで操作するとき、
 * </p>
 *
 * @returns {Promise} ポップアップウィンドウが開くまで待機するプロミスオブジェクト。<br>
 *          doneハンドラにはポップアップウィンドウのwindowオブジェクトが第1引数で渡される。
 */
function openPopupWindow() {
	var dfd = h5.async.deferred();
	var w = window.open();
	if (w == null) {
		// ポップアップブロックされていた場合はrejectして終了
		return dfd.reject().promise();
	}
	function load() {
		dfd.resolve(w);
	}

	// Firefoxの場合は、window.openで新しいwindowが同期で開き、readyStateが取得できないので、completeでなくても同期でload()を呼ぶ
	if (w.document && w.document.readyState === 'complete' || h5.env.ua.isFirefox) {
		load();
		return dfd.promise();
	}
	// openしたウィンドウの状態は、こちらのスクリプト実行中に変わる可能性があるので、
	// loadイベントを拾うのではなく、setIntervalで監視する
	var timer = setInterval(function() {
		if (w.document && w.document.readyState === 'complete') {
			clearInterval(timer);
			load();
		}
	}, 100);
	return dfd.promise();
}

/**
 * ポップアップウィンドウを閉じる
 *
 * @param {Window} w ポップアップウィンドウのwindowオブジェクト
 */
function closePopupWindow(w) {
	var dfd = h5.async.deferred();
	function unloadFunc() {
		dfd.resolve(w);
	}
	// jQueryのbindでバインドすると、バインド対象に対してdeleteを使ってjQueryキャッシュを消す処理が非同期で走り、
	// close済みのwindowオブジェクトに対する操作IEでエラーになる。
	// そのため、jQueryを使わずにバインドしている
	if (w.addEventListener) {
		w.addEventListener('unload', unloadFunc);
	} else {
		w.attachEvent('onunload', unloadFunc);
	}
	w.close();
	return dfd.promise();
}

/**
 * 現在実行中のテストを中断して、成功扱いにする。 テストケース内(test,asyncTest)から呼んで使用する。
 */
function abortTest() {
	// test,asyncTest内から呼ばれた場合
	// テストが成功するようにする
	ok(true, 'テストをスキップしました');
	QUnit.config.current.expected = null;

	// テスト名の先頭に[テストをスキップしました]を付けて表示する
	var replace = '';
	$(QUnit.config.current.nameHtml).each(function() {
		if ($(this).hasClass('test-name')) {
			$(this).text('[テストをスキップしました]' + $(this).text());
		}
		replace += this.outerHTML || this.nodeValue;
	});
	QUnit.config.current.nameHtml = replace;
}

/**
 * 次に実行されるテストを実行せずにスキップする。 モジュールのsetup内で呼んで使用する。
 */
function skipTest() {
	// モジュールのsetupから呼ばれた場合
	QUnit.config.current.callback = function() {
		abortTest();
		if (QUnit.config.current.async) {
			start();
		}
	};
	return;
}

/**
 * バージョン文字列の大小を比較する関数(hifive[h5.ui.jqm.manager.js]から引用)
 * <p>
 * '1.11.0', '1.9.9'のような'.'区切りのバージョン文字列を比較して、第1引数の方が小さければ-1、同じなら0、第2引数の方が小さければ1 を返す。
 * </p>
 *
 * @param {String} a バージョン文字列
 * @param {String} b バージョン文字列
 * @returns {Integer} 比較結果。aがbより小さいなら-1、同じなら0、aがbより大きいなら1 を返す
 */
/**
 * バージョン文字列の大小を比較する関数
 * <p>
 * '1.11.0', '1.9.9'のような'.'区切りのバージョン文字列を比較して、第1引数の方が小さければ-1、同じなら0、第2引数の方が小さければ1 を返す。
 * </p>
 *
 * @param {String} a バージョン文字列
 * @param {String} b バージョン文字列
 * @returns {Integer} 比較結果。aがbより小さいなら-1、同じなら0、aがbより大きいなら1 を返す
 */
function compareVersion(a, b) {
	// '.0'が末尾にならない様にする
	a = a.replace(/(\.0+)+$/, '');
	b = b.replace(/(\.0+)+$/, '');

	if (a === b) {
		// aとbが同じならループで比較せずに0を返す
		return 0;
	}
	var aAry = a.split('.');
	var bAry = b.split('.');

	var aAryLen = aAry.length;
	for (var i = 0; i < aAryLen; i++) {
		if (bAry[i] == null) {
			// bAryが先にnullになった=aAryの方が桁数(バージョン文字列の.の数)が多い場合、
			// '.0'が末尾にならないようにしてあるので、桁数の多い方がバージョンが大きい
			return 1;
		}
		var aVal = parseInt(aAry[i], 10);
		var bVal = parseInt(bAry[i], 10);
		if (aVal === bVal) {
			// 同じなら次以降のindexで比較
			continue;
		}
		// 比較してaが小さいなら-1、bが小さいなら-1を返す
		return aVal < bVal ? -1 : 1;
	}
	if (bAry[aAryLen] != null) {
		// aAryよりbAryの方が桁数が多い場合はbの方が桁数が多いのでバージョンが大きい
		return -1;
	}
	// 最後まで比較して同じなら同じバージョンなので0を返す
	return 0;
}

/**
 * オブジェクトからプロパティを削除する
 *
 * @param {Object} obj
 * @param {string} prop
 */
function deleteProperty(obj, prop) {
	try {
		delete obj[prop];
	} catch (e) {
		// IE6の場合、windowオブジェクトからdeleteしようとするとエラーになるのでundefinedの代入を行う
		obj[prop] = undefined;
	}
}