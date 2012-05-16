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

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;
import jp.co.nssol.h5.test.selenium.base.H5TestCase;

import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class IndexTest extends H5TestCase {
	public IndexTest(WebDriver driver) {
		super(driver);
		show("");
	}

	@Test
	public void test1() {
		assertThat(getDriver().getTitle(), is("hifive - HTML5とスマートフォンのための開発プラットフォーム"));
	}

	@Test
	public void showStep7_2Page() throws InterruptedException {
		WebDriverWait wait = new WebDriverWait(getDriver(), 10);
		WebElement e = getDriver().findElement(By.linkText("recipe"));
		click(e);
		wait.until(ExpectedConditions.textToBePresentInElement(By.cssSelector("#contents > h2"), "レシピ"));

		assertThat("STEP7-2のページが表示されているか。", querySelector("#contents > p").get(0).getText(),
				is("hifiveを使ったサンプルを紹介します。"));
	}
}
