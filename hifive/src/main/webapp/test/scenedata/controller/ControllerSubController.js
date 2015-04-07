/*
 * Copyright (C) 2014 NS Solutions Corporation
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
(function(){
	'use strict';

	h5.core.expose({
		__name : 'scenedata.controller.ControllerSubController',
		__init : function(context){
			var args = context.args || {};
			$(this.rootElement).html('<h2>CONTROLLER_SUB</h2>'
					+ '<dl><dt>前画面入力</dt><dd class="pg_sub_view"></dd></dl>'
					+ '<input type="text" name="sub_input" />'
					+ '<button type="button" class="pg_sub_test">TEST</button>');
			this.args = args;
			this.$find('.pg_sub_view').text(args.test || '');
		}
	});
})();
