$(function() {
	var inputController = {
		__name: 'inputController',

		__ready: function() {
			var f1Elements = document.getElementById('f1').elements;
			var f2Elements = document.getElementById('f2').elements;
			console.log('f1Elements');
			console.dir(f1Elements);
			console.log('f2Elements');
			console.dir(f2Elements);
		},
	};
	h5.core.controller(document.body, inputController);


});