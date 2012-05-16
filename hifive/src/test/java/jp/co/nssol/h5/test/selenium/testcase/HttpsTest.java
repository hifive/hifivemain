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

import java.util.List;

import jp.co.nssol.h5.test.selenium.base.H5TestCase;

import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class HttpsTest extends H5TestCase {

	public HttpsTest(WebDriver driver) {
		super(driver);
	}

	@Test
	public void accessVeriSingTestPage() {
		getDriver().get("https://ssltest2.verisign.co.jp/");
		List<WebElement> e = querySelector("body > p > b");
		assertThat("HTTPSのページが見えるか", e.size(), is(1));
		assertThat(e.get(0).getText(), is("Class 3 Public Primary Certification Authority"));
	}

}
