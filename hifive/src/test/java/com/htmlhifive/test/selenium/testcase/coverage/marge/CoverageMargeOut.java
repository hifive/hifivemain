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


import org.junit.AfterClass;
import org.junit.Test;
import org.openqa.selenium.WebDriver;

public class CoverageMargeOut extends H5TestCaseMarge {

	public CoverageMargeOut(WebDriver driver) throws InterruptedException {
		super(driver);
	}

	@Test
	public void showMargedCoverage() throws InterruptedException {
		Number existJSON = (Number)execJavaScript("if(!window.JSON)return -1;" +
				"var arg = JSON.parse(arguments[0]);" +
				"var obj = {};" +
				"for(var filename in arg){" +
				"	var ary = arg[filename];" +
				"	for(var i = 0, l = ary.length; i < l; i++)" +
				"		if(ary[i] < 0) delete ary[i];" +
				"	ary['source'] = _$jscoverage[filename].source;" +
				"	obj[filename] = ary;" +
				"}" +
				"_$jscoverage = obj;" +
				"return 1;", ret);
		querySelector("#summaryTab").get(0).click();
		if(existJSON.intValue() < 0){
			execJavaScript("alert('window.JSONがないため、マージ結果を表示できません。')");
		}
	}

	@AfterClass
	public static void sleep() throws InterruptedException {

		// 結果を表示する時間
		Thread.sleep(100000000);
	}
}
