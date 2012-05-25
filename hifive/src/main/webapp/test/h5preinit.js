$(document).bind('h5preinit', function() {
	var aspect = {
		target : 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		interceptors : h5.core.interceptor.lap,
		pointCut : '#btn click'
	};

	h5.settings.aspects = [ aspect ];
});