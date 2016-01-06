/*
 * Copyright (C) 2012-2016 NS Solutions Corporation
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
// JsDocのための定義.実際には使用しない.
function Sequence() {
	var methods = {
		/**
		 * 現在の値を返します。
		 *
		 * @memberOf Sequence
		 * @returns {String|Number}
		 */
		current: function() {
		//
		},

		/**
		 * 現在の値を返し、番号をstep分だけ進めます。
		 *
		 * @memberOf Sequence
		 * @returns {String|Number}
		 */
		next: function() {
		//
		},

		/**
		 * このSequenceオブジェクトが返す番号の型です。値は以下のいずれかです。
		 * <ul>
		 * <li><a href="h5.core.data.html#SEQ_INT">h5.core.data.SEQ_INT</a>
		 * <li><a href="h5.core.data.html#SEQ_STRING">h5.core.data.SEQ_STRING</a>
		 * </ul>
		 *
		 * @memberOf Sequence
		 */
		returnType: function() {
		//
		}
	};
}