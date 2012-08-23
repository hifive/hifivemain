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
 package com.htmlhifive.test.selenium.testcase.coverage.marge;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.AfterClass;
import org.junit.Test;
import org.openqa.selenium.WebDriver;

public class CoverageMarge extends H5TestCaseMarge {

	/**
	 * ブラウザ名をキーにして、各ブラウザ毎のカバレッジ情報を格納するマップ
	 */
	private static HashMap<String, HashMap<String, List<Integer>>> totalCoverageMap =
			new HashMap<String, HashMap<String, List<Integer>>>();

	public CoverageMarge(WebDriver driver) throws InterruptedException {

		super(driver);
	}

	@Test
	public void forCheckCoverageWait() throws InterruptedException {

		String browser =
				(String) execJavaScript(";var ua = navigator.userAgent;" + "if(ua.indexOf('Chrome') > 0)"
						+ "	return 'Chrome';" + "if(navigator.appName.indexOf('Internet Explorer') > 0)"
						+ "	return 'InternetExplorer';" + "if(ua.indexOf('Firefox') > 0)" + "	return 'Firefox';"
						+ "if(ua.indexOf('Safari') > 0)" + "	return 'Safari';" + "return ua;");

		System.out.println(browser);
		HashMap<String, List<Integer>> coverageObj = new HashMap<String, List<Integer>>();

		String jscoverageStr =
				(String) execJavaScript("return (function(obj){"
						+ "var ret='{';"
						+ "for(var k in obj)"
						+
						// ↓IE対策。
						// 　フレームを行き来してjsを実行した後に、obj[k].toString()を呼ぶと、"解放されたスクリプトからコードを実行できません。"というエラーが出るため、
						// 　コピーした配列のtoString()の結果を取得している。
						"	ret += '\"' + k + '\":[' + (function(){var ary = [];"
						+ "for(var i = 0; i < obj[k].length;i++)ary.push(obj[k][i]);return ary.toString()})() + '],';"
						// TODO safariだと、文字数が多いと返ってこない？調べる。
						+ "return ret.replace(/,$/,'')+'}';})(_$jscoverage);");
		System.out.println(jscoverageStr);
		Matcher keyMatcher = Pattern.compile("\"(.*?)\"").matcher(jscoverageStr);

		// jsファイルのリスト
		List<String> jsFiles = new ArrayList<String>();
		while (keyMatcher.find()) {
			jsFiles.add(keyMatcher.group(0).replaceAll("\"", ""));
		}

		Matcher aryMatcher = Pattern.compile("\\[(.*?)\\]").matcher(jscoverageStr);
		List<List<Integer>> coverageArrayList = new ArrayList<List<Integer>>();
		while (aryMatcher.find()) {
			String aryStr = (aryMatcher.group(0).replaceAll("\\[|\\]", ""));
			Matcher valMatcher = Pattern.compile("(.*?)(,|$)").matcher(aryStr);
			List<Integer> coverageArray = new ArrayList<Integer>();
			while (valMatcher.find()) {
				String s = valMatcher.group(0).replaceAll(",", "");
				coverageArray.add(s.length() == 0 ? -1 : Integer.parseInt(s));
			}
			coverageArrayList.add(coverageArray);
		}
		for (int i = 0, l = jsFiles.size(); i < l; i++) {
			coverageObj.put(jsFiles.get(i), coverageArrayList.get(i));
		}

		totalCoverageMap.put(browser, coverageObj);

		if (totalCoverageMap.size() == getDriversSize()) {
			HashMap<String, List<Integer>> retMap = new HashMap<String, List<Integer>>();
			for (String browserName : totalCoverageMap.keySet()) {
				for (String fileName : totalCoverageMap.get(browserName).keySet()) {
					List<Integer> list = new ArrayList<Integer>();
					for (int i = 0, l = totalCoverageMap.get(browserName).get(fileName).size(); i < l; i++) {
						int val = totalCoverageMap.get(browserName).get(fileName).get(i);
						if (retMap.get(fileName) != null) {
							if (retMap.get(fileName).size() > i && val != -1) {
								val += retMap.get(fileName).get(i);
							}
						}
						list.add(val);
					}
					retMap.put(fileName, list);
				}
			}
			ret = "{";
			for (String fileName : retMap.keySet()) {
				ret += "\"" + fileName + "\":[";
				for (int i = 0, l = retMap.get(fileName).size(); i < l; i++) {
					ret += retMap.get(fileName).get(i) + ",";
				}
				ret = ret.replaceAll(",$", "") + "],";
			}
			ret = ret.replaceAll(",$", "") + "}";
		}
	}

	@AfterClass
	public static void sleep() throws InterruptedException {

		// 結果を表示する時間
		Thread.sleep(1000);
	}
}
