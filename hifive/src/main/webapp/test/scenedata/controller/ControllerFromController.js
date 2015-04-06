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

	var ControllerFromController = null;
	ControllerFromController = {
		__name :  'scenedata.controller.ControllerFromController',
		__templates: 'scenedata/view/ControllerFrom.ejs',
		__init : function(context){
			this.view.update('{rootElement}', 'default');
		}
	};
	h5.core.expose(ControllerFromController);
})();