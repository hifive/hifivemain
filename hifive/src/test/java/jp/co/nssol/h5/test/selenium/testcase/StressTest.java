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
 package jp.co.nssol.h5.test.selenium.testcase;

import jp.co.nssol.h5.test.selenium.base.H5TestCase;

import org.junit.Test;
import org.openqa.selenium.Point;
import org.openqa.selenium.WebDriver;

public class StressTest extends H5TestCase {
	public StressTest(WebDriver driver) {
		super(driver);
		show("tutorial/step3/step3.html");
	}

	@Test
	public void transitionTest() throws InterruptedException {
		for (int i = 0; i < 100; i++) {
			getDriver().navigate().back();
			getDriver().navigate().forward();
		}
	}

	@Test
	public void transitionTest2() throws InterruptedException {
		for (int i = 0; i < 100; i++) {
			getDriver().navigate().back();
			click(getElementsByLinkText("step3").get(0));
			Thread.sleep(50);
		}
	}

	@Test
	public void scrollTest() throws InterruptedException {
		getDriver().manage().window().setPosition(new Point(0, 1000));
		// TODO 画面スクロールをテストする
	}
}
