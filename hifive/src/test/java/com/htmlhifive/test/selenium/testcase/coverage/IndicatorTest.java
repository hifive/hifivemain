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
 package com.htmlhifive.test.selenium.testcase.coverage;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import java.util.List;

import com.htmlhifive.test.selenium.base.H5TestCase;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

/**
 * TODO テストケースの追加
 * 
 * @author fukuda
 * 
 */
public class IndicatorTest extends H5TestCase {

	public static final String BLOCK_SAMPLE_PAGE =
			"http://localhost:8080/htmlhifiveWeb/coverage/webdriver/sandbox/indicator/";

	public IndicatorTest(WebDriver driver) throws InterruptedException {
		super(driver);
		try{
			if (querySelector("#location").get(0).getText().equals(BLOCK_SAMPLE_PAGE)) {
				return;
			}
		} catch(Exception e){
			return;
		}
		// ページを開く処理をBeforeClassに記述すると、コンストラクタの前に実行されてしまうため、コンストラクタで実行している。
		WebElement locationBox = querySelector("#location").get(0);
		locationBox.clear();
		locationBox.sendKeys(BLOCK_SAMPLE_PAGE);
		WebElement openInWindow = querySelector("[title='open URL in the iframe below [Enter]']").get(0);
		openInWindow.click();
		Thread.sleep(1000);
	}

	@Before
	public void switchToIFrame(){
		getDriver().switchTo().frame(querySelector("#browserIframe").get(0));
	}

	@After
	public  void close() throws InterruptedException {
		getDriver().switchTo().defaultContent();
	}

	@Test
	public void showBlockPage() throws InterruptedException {
		assertThat("『画面ブロック』のタイトルが表示されているか。", getDriver().getTitle(),
				is("hifive Block Sample"));
	}

	@Test
	public void child1StartClick() throws InterruptedException {
		click(getElementById("child1Block"));
		assertThat("画面ブロックが表示されていること。(オーバーレイ)",
				querySelector("#child1 .blockUI.blockOverlay").size(), is(1));
		assertThat("画面ブロックが表示されていること。(インジケータ)",
				querySelector("#child1 .blockUI.a.blockElement").size(), is(1));

		List<WebElement> elems = querySelector("#ul li");
		assertThat("ログが画面に表示されていること。", elems.size(), is(1));
		assertThat("ログに 'child1 start' が表示されていること。", elems.get(0).getText(),
				is("child1 start"));

		Thread.sleep(1200);

		assertThat("画面ブロックが削除されていること。(オーバーレイ)",
				querySelector("#child1 .blockUI.blockOverlay").size(), is(0));
		assertThat("画面ブロックが削除されていること。(インジケータ)",
				querySelector("#child1 .blockUI.a.blockElement").size(),
				is(0));

		elems = querySelector("#ul li");
		assertThat("ログに 'child1 end' が表示されていること。", elems.get(1).getText(),
				is("child1 end"));
	}

	@Test
	public void parentBlock() throws InterruptedException {
		click(getElementById("parentBlock"));
		assertThat("画面ブロックが表示されていること。(オーバーレイ)",
				querySelector("#parent1 .blockUI.blockOverlay").size(), is(1));
		assertThat("画面ブロックが表示されていること。(インジケータ)",
				querySelector("#parent1 .blockUI.a.blockElement").size(),
				is(1));

		List<WebElement> elems = querySelector("#ul li");
		assertThat("ログが画面に表示されていること。", elems.size(), is(3));
		assertThat("ログに 'child2 start' が表示されていること。", elems.get(2).getText(),
				is("child2 start"));

		Thread.sleep(3000);

		assertThat("画面ブロックが削除されていること。(オーバーレイ)",
				querySelector("#parent1 .blockUI.blockOverlay").size(), is(0));
		assertThat("画面ブロックが削除されていること。(インジケータ)",
				querySelector("#parent1 .blockUI.a.blockElement").size(),
				is(0));

		elems = querySelector("#ul li");
		assertThat("ログに 'child2 end' が表示されていること。", elems.get(3).getText(),
				is("child2 end"));
	}

	@Test
	public void childrenBlock() throws InterruptedException {

		int beforeLogLength = querySelector("#ul li").size();

		click(getElementById("childrenBlock"));
		assertThat("画面ブロックが表示されていること。(オーバーレイ)",
				querySelector("#child3 .blockUI.blockOverlay").size(), is(1));
		assertThat("画面ブロックが表示されていること。(インジケータ)",
				querySelector("#child3 .blockUI.a.blockElement").size(),
				is(1));
		assertThat("画面ブロックが表示されていること。(オーバーレイ)",
				querySelector("#child4 .blockUI.blockOverlay").size(), is(1));
		assertThat("画面ブロックが表示されていること。(インジケータ)",
				querySelector("#child4 .blockUI.a.blockElement").size(),
				is(1));

		List<WebElement> elems = querySelector("#ul li");
		assertThat("ログが2件画面に出力されていること。", elems.size(), is(beforeLogLength + 2));

		Thread.sleep(3000);

		assertThat("画面ブロックが削除されていること。(オーバーレイ)",
				querySelector("#child3 .blockUI.blockOverlay").size(), is(0));
		assertThat("画面ブロックが削除されていること。(インジケータ)",
				querySelector("#child3 .blockUI.a.blockElement").size(), is(0));
		assertThat("画面ブロックが削除されていること。(オーバーレイ)",
				querySelector("#child4 .blockUI.blockOverlay").size(), is(0));
		assertThat("画面ブロックが削除されていること。(インジケータ)",
				querySelector("#child4 .blockUI.a.blockElement").size(),
				is(0));

		elems = querySelector("#ul li");
		assertThat("ログが2件画面に出力されていること。", elems.size(), is(beforeLogLength + 4));
	}
}
