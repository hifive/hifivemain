/*
 * Copyright (C) 2012-2013 NS Solutions Corporation
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
package com.htmlhifive.test.selenium.suite;

import org.junit.runner.RunWith;
import org.junit.runners.Suite.SuiteClasses;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.ie.InternetExplorerDriver;
import org.openqa.selenium.safari.SafariDriver;

import com.htmlhifive.test.selenium.base.ConfigurationXmlPath;
import com.htmlhifive.test.selenium.base.H5Suite;
import com.htmlhifive.test.selenium.base.TargetDriver;
import com.htmlhifive.test.selenium.testcase.coverage.ShowCoveragePage;
import com.htmlhifive.test.selenium.testcase.coverage.marge.CoverageMarge;
import com.htmlhifive.test.selenium.testcase.coverage.marge.CoverageMargeOut;
import com.htmlhifive.test.selenium.testcase.coverage.marge.Runner;
import com.htmlhifive.test.selenium.testcase.coverage.marge.RunnerJQuery1_6_4;
import com.htmlhifive.test.selenium.testcase.coverage.marge.WaitForQUnitTest;

@TargetDriver({ FirefoxDriver.class, ChromeDriver.class ,SafariDriver.class, InternetExplorerDriver.class})
@ConfigurationXmlPath("config/webdriver_config.xml")
@RunWith(H5Suite.class)
@SuiteClasses({
/* カバレッジページを開くためのクラス */
ShowCoveragePage.class,

/* 実行したいテストクラスをここに記述 */
Runner.class, WaitForQUnitTest.class,
 RunnerJQuery1_6_4.class, WaitForQUnitTest.class,

/* 以下はマージ結果を表示するためのクラス */
 CoverageMarge.class, CoverageMargeOut.class
})
public class CoverageMargeTest {
}
