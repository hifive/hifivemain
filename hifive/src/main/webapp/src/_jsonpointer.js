/**
 * 与えられたJSON Pointerのパスの値を返します
 *
 * @param {JSON} obj
 * @param {String} pointer
 * @returns {Object} 値
 */
function getJSONPointerValue(obj, pointer) {
	// objの構文チェック
	// objがnull,undefinedのときはundefined
	if (obj == null) {
		return undefined;
	}

	// pointerの構文チェック
	// pointerが
	if (pointer[0] !== '/') {
		return undefined;
	}

	// 分割
	// 配列の0番目が空文字なので削除
	var tokens = pointer.split('/').slice(1);
	var len = tokens.length;

	// 先に'~1'を'/'に変換してから、'~0'を'~'に変換
	for (var i = 0; i < len; i++) {
		tokens[i] = tokens[i].replace(/~1/g, '/').replace(/~0/g, '~');
	}

	// 与えられたJSON Pointerのパスをたどる
	var result = (function evalJsonPointerValue(ref, n) {
		var token = tokens[n];
		if (ref && typeof ref === 'object') {
			// 参照がオブジェクトまたは配列の場合
			if (token in ref) {
				// 次の参照を再帰呼び出し
				return evalJsonPointerValue(ref[token], n + 1);
			}
			// 探索が終了
			return undefined;
		} else if (len > n) {
			// 探索が途中終了
			return undefined;
		} else {
			// 探索が終了
			return ref;
		}
	})(JSON.parse(obj), 0);

	return result;
}