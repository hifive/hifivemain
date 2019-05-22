$(function() {
	var inputController = {
		__name: 'inputController',

		'#btn-test click': function(context, $el) {
			$('form').submit();
		},
	};
	h5.core.controller(document.body, inputController);


});