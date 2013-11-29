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

	for ( var i = 1; i < patterns.length; i++) {
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

function isDevMode() {
	return !!h5.dev;
}

function isDisposed(controller) {
	var ret = true;
	for ( var p in controller) {
		if (controller.hasOwnProperty(p) && controller[p] !== null) {
			ret = false;
		}
	}
	return ret;
}

// iframeを作成
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
		// ifrae.contentDocumentはIE7-で使えないので、contentWindowからdocumentを取得
		var doc = iframe.contentWindow.document;
		if (doc.readyState !== 'complete') {
			setTimeout(check, 10);
			return;
		}
		dfd.resolve(iframe, doc);
	}
	setTimeout(check, 10);
	return dfd.promise();
}

// ポップアップウィンドウを開く
function openPopupWindow() {
	var dfd = h5.async.deferred();
	var w = window.open();
	function load() {
		dfd.resolve(w);
	}
	if (w.document && w.document.readyState === 'complete') {
		load();
	} else {
		// openしたウィンドウの状態は、こちらのスクリプト実行中に変わる可能性があるので、
		// loadイベントを拾うのではなく、setIntervalで監視する
		console.log(w.document && w.document.readyState);
		var timer = setInterval(function() {
			console.log(w.document && w.document.readyState);
			if (w.document && w.document.readyState === 'complete') {
				clearInterval(timer);
				load();
			}
		}, 100);
	}
	return dfd.promise();
}

// ポップアップウィンドウを閉じる
function closePopupWindow(w) {
	var dfd = h5.async.deferred();
	$(w).bind('unload', function() {
		dfd.resolve(w);
	});
	w.close();
	return dfd.promise();
}