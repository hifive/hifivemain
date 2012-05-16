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
 package jp.co.nssol.h5.test.selenium.testcase.coverage.marge;

import jp.co.nssol.h5.test.selenium.base.H5TestCase;

import org.openqa.selenium.WebDriver;

public class H5TestCaseMarge extends H5TestCase {

	/**
	 * マージ結果を格納する文字列
	 */
	public static String ret;

	public H5TestCaseMarge(WebDriver _driver) {
		super(_driver);
	}

}
