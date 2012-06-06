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
 package jp.co.nssol.h5.test.selenium.suite;

import jp.co.nssol.h5.test.selenium.base.ConfigurationXmlPath;
import jp.co.nssol.h5.test.selenium.base.H5Suite;
import jp.co.nssol.h5.test.selenium.base.TargetDriver;
import jp.co.nssol.h5.test.selenium.testcase.coverage.ShowCoveragePage;
import jp.co.nssol.h5.test.selenium.testcase.coverage.marge.CoverageMarge;
import jp.co.nssol.h5.test.selenium.testcase.coverage.marge.CoverageMargeOut;
import jp.co.nssol.h5.test.selenium.testcase.coverage.marge.Runner;
import jp.co.nssol.h5.test.selenium.testcase.coverage.marge.RunnerJQuery1_6_4;
import jp.co.nssol.h5.test.selenium.testcase.coverage.marge.WaitForQUnitTest;

import org.junit.runner.RunWith;
import org.junit.runners.Suite.SuiteClasses;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.ie.InternetExplorerDriver;

@TargetDriver({ FirefoxDriver.class, ChromeDriver.class, InternetExplorerDriver.class })
@ConfigurationXmlPath("config/webdriver_config.xml")
@RunWith(H5Suite.class)
@SuiteClasses({
/* カバレッジページを開くためのクラス */
	ShowCoveragePage.class,

/* 実行したいテストクラスをここに記述 */
	Runner.class, WaitForQUnitTest.class,
 RunnerJQuery1_6_4.class, WaitForQUnitTest.class,

/* 以下はマージ結果を表示するためのクラス */
	CoverageMarge.class, CoverageMargeOut.class })
public class CoverageMargeTest {
}
