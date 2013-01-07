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