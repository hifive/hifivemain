/*
 * Copyright (C) 2012-2014 NS Solutions Corporation
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

import com.htmlhifive.test.selenium.base.H5TestCase;

import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

/**
 * TODO テストケースの追加
 *
 * @author fukuda
 *
 */
public class RunnerJQuery1_6_4 extends H5TestCase {

	public static final String QUNIT_PAGE =
			"http://localhost:8080/hifive/coverage/inst/test/runner.jquery1.6.4.html";

	public RunnerJQuery1_6_4(WebDriver driver) throws InterruptedException {
		super(driver);
	}
	@Test
	public void openQUnit() throws InterruptedException{

		WebElement locationBox = querySelector("#location").get(0);
		locationBox.clear();
		locationBox.sendKeys(QUNIT_PAGE);
		WebElement openInWindow = querySelector("[title='open URL in the iframe below [Enter]']").get(0);
		openInWindow.click();
		Thread.sleep(1000);
	}
}
