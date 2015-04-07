(function() {
	//依存無し
	var ary = [];
	function A() {
		this.a = 'a';
		this.ary = ary;
	}
	setTimeout(function() {
		h5.res.register('h5resdata.register.A_async', A);
		ary.push('ok');
	}, 0);
})();