$(function() {
	$.escapeHTML = function(val) {
		return $("<div/>").text(val).html();
	};

	$summary = $('<div id="summary"></div>');
	$containerOverview = $('.container-overview');
	$containerOverview.after($summary);


	// メソッドやメンバの概要を追加
	$('article>h3.subsection-title').each(
			function() {
				// テーブルの追加
				if ($(this).text() == "Namespaces") {
					// Namespacesは概要の前に表示する
					$containerOverview.after($(this), $(this).next());
					return;
				}
				var tableTitle = $(this).text() + ': 概要';
				$constructaTable = $('<table class="summaryTable constructa"></table>');
				$constructaTable.append('<thead><tr><th colspan=3>' + tableTitle
						+ '</th><tr></thead>');

				// テーブルの中身を追加
				$(this).next().children('dt').each(
						function() {
							var name = $.trim($.escapeHTML($(this).text().replace(/<.*> /, '')));
							var type = $.trim($(this).html()).match(" :.*$");
							if (!type) {
								type = ' ';
							} else {
								type = type[0].replace(/ :/, '');
								name = name.split(' :')[0];
							}
							var link = name.replace(/ /g, '');
							var desc = $(this).next().find('.description:first').text();
							if (!tableTitle.match('Members')) {
								$constructaTable.append('<tbody><tr><td colspan=2><a href="#'
										+ link + '">' + name + '</td><td>' + desc
										+ '</td><tr></thead>');
							} else {
								$constructaTable.append('<tbody><tr><td><a href="#' + link + '">'
										+ name + '</td><td>' + type + '</td><td>' + desc
										+ '</td><tr></thead>');
							}
							$summary.append($constructaTable);

							// リンクの追加
							$(this).find('h4').prepend('<a name="' + link + '"/>');
						});
			});

	// 水平線の追加
	if ($summary.html()) {
		$summary.after("<hr>");
		$summary.before("<hr>");
	}

	// Returns: の中のTypeを見やすくする
	$('.param-desc')
			.each(
					function() {
						var type = $(this).next().find('.param-type').html();
						var desc = $(this).html();
						$returnsTable = $('<table class="returnsTable"><thead><tr><th>Type</th><th class="last">Description</th></tr></thead></table>');
						$returnsTable.append('<tbody><tr><td>' + type + '</td><td>' + desc
								+ '</td></tr></tbody>');
						$(this).html('');
						$(this).next().remove();
						$(this).append($returnsTable);
					})
});