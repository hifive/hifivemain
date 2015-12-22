(function() {
	//依存無し
	var ary = [];
	function A() {
		this.a = 'a';
		this.ary = ary;
	}
	h5.res.register('h5resdata.register.A', A);
	ary.push('ok');
})();