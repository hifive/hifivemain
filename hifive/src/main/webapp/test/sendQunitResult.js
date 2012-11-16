/*
 * Copyright (C) 2012 NS Solutions Corporation
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

$(function() {
	// runner**.html の
	// 『<!-- 各モジュールのテストケースJSを読み込む -->』
	// の前で、このjsファイルを読み込んで使用する


	// 結果を送るURL
	var sendUrl = '/myserver/createxml';

	// テスト数が多いとajaxで送れない...？
	// Internet Explorer では URL に最大 2,083 文字らしい
	var results = [];

	//TODO runnerのjQueryのバージョンやieのモードなど、runnerの種類が分かるようにする
	var runnerName = QUnit.url;

	//	function createTestCaseTag(resultObj) {
	//		var ret = '<testcase classname="'++'" name="AFailingTest"';
	//		return ret;
	//	}

	QUnit.config.testDone.push(function(resultObj) {
		results.push(resultObj);
	});

	QUnit.config.done.push(function(total) {
		var sendObj = {
			time: +new Date() - QUnit.config.started,
			results: results,
			total: total,
			runnerName: runnerName
		};

		console.log(results);
		$.ajax({
			type: 'GET',
			url: sendUrl,
			data: sendObj
		}).done(function(data) {
			console.log(data);
		}).fail(function(e) {
			console.log(e);
		});

		// JUnit.xml は↓のようなフォーマット。サーバ側でやる

		//		<?xml version="1.0" encoding="UTF-8"?>
		//		<testsuite name="application" tests="7" failures="0" disabled="0" errors="0" time="8.953">
		//		    <testcase classname="foo" name="ASuccessfulTest"/>
		//		    <testcase classname="foo" name="AnotherSuccessfulTest"/>
		//		    <testcase classname="foo" name="AFailingTest">
		//		        <failure type="NotEnoughFoo"> details about failure </failure>
		//		    </testcase>
		//		</testsuite>

		// xmlファイルに保存してダブルクリックするとeclipseのJUnit結果表示ができる(フォーマットが正しいかどうか確認できる)





		//		var junitXml = '<?xml version="1.0" encoding="UTF-8"?>';
		//		junitXml += '<testsuite name="' + runnerName + '" tests="' + ev.total + '" failures="'
		//				+ ev.failed + '" time="' + time + '">';
		//		for ( var i = 0, l = results.length; i < l; i++) {
		//			createTestCaseTag(results[i]);
		//		}
		//		junitXml += '</testsuite>';
	});
});
