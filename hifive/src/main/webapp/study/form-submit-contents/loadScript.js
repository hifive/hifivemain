(function(){
	// 事前にtestenv.jsの読み込みが必要
	var srcList = [
		'src/h5scopedglobals.js',
		'src/h5.u.js',
		'src/h5.mixin.js',
		'src/h5.log.js',
		'src/h5.js',
		'src/h5.env.js',
		'src/h5.async.js',
		'src/h5.res.js',
		'src/h5.ui.js',
		'src/h5.ui.jqm.manager.js',
		'src/h5.ajax.js',
		'src/h5.core.data_query.js',
		'src/h5.core.data.js',
		'src/h5.core.view_binding.js',
		'src/h5.core.view.js',
		'src/h5.core.controller.js',
		'src/h5.scene.js',
		'src/h5.api.geo.js',
		'src/h5.api.sqldb.js',
		'src/h5.api.storage.js',
		'src/h5.validation.js',
		'src/h5.ui.components.BalloonController.js',
		'src/h5.ui.FormController.js',
		'src/h5.dev.api.geo.js'
	];
	document.write('<!-- loadScriptForTest.js write start -->');
	for(var i = 0; i < srcList.length; i++){
		document.write('<script src="' + H5_TEST_ENV.srcBaseUrl + srcList[i] + '"></script>');
	}
	document.write('<!-- loadScriptForTest.js write end -->');
})();