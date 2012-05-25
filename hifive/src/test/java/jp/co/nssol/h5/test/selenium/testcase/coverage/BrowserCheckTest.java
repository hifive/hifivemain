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
 package jp.co.nssol.h5.test.selenium.testcase.coverage;

import jp.co.nssol.h5.test.selenium.base.H5TestCase;

import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class BrowserCheckTest extends H5TestCase {
	public BrowserCheckTest(WebDriver driver) {
		super(driver);
	}

	@Test
	public void showBrowserCheckPage() throws InterruptedException {

		WebElement locationBox = querySelector("#location").get(0);
		locationBox.clear();
		locationBox
		.sendKeys("http://localhost:8080/htmlhifiveWeb/coverage/webdriver/sandboxInternal/coverage/");
		WebElement openInFrame = querySelector("[title='open URL in the iframe below [Enter]']").get(0);
		openInFrame.click();
		Thread.sleep(100);
		getDriver().switchTo().defaultContent();
		Thread.sleep(100);
	}
}