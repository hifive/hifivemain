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

import com.htmlhifive.test.selenium.base.H5TestCase;

import org.junit.Test;
import org.openqa.selenium.WebDriver;

/**
 * TODO テストケースの追加
 *
 * @author fukuda
 *
 */
public class WaitForQUnitTest extends H5TestCase {

	public WaitForQUnitTest(WebDriver driver) throws InterruptedException {

		super(driver);
	}

	@Test
	public void waitForTestEnd() throws InterruptedException {

		try {
			// フレーム内のロードが終わる前にここに入ることがある(Safari)なので、1秒待機
			Thread.sleep(1000);
			getDriver().switchTo().frame(querySelector("#browserIframe").get(0));

			while (querySelector("#qunit-testresult").get(0).getText().contains("Running:")) {
				Thread.sleep(1000);
			}
			System.out.println("QUnitテスト終了");
			getDriver().switchTo().defaultContent();
		} catch (Exception e) {
			System.out.println("waitForTestEnd error");
		}
	}
}
