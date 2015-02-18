(function() {
	//Cは依存無し
	function C() {
		this.c = 'c';
	}

	h5.res.register('app.constructor.C', C);
	console.log('loaded C');
})();