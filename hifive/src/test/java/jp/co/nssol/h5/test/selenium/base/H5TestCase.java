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
 package jp.co.nssol.h5.test.selenium.base;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Collection;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized.Parameters;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.ScreenOrientation;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.android.AndroidDriver;
import org.openqa.selenium.ie.InternetExplorerDriver;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.WebDriverWait;

@RunWith(H5Parameterized.class)
public class H5TestCase {
	/**
	 * テスト終了後、全てのブラウザを閉じます。
	 */
	static class TearDown extends Thread {
		public TearDown() {
			super();
		}

		@Override
		public void run() {
			for (WebDriver[] driver : drivers) {
				for (WebDriver element : driver) {
					element.quit();
				}
			}
		}
	}

	static {
		Runtime.getRuntime().addShutdownHook(new H5TestCase.TearDown());
	}

	private final static String PKEY_TEST_PAGE_URL = "testPageUrl";
	private final static String PKEY_SCREEN_SHOT_PATH = "screenShotPath";
	private static final String TEST_PAGE_URL = SettingsReader.getProperty(PKEY_TEST_PAGE_URL);
	private static final String screenShotPath = SettingsReader.getProperty(PKEY_SCREEN_SHOT_PATH);
	private static Collection<WebDriver[]> drivers = null;
	private static WebDriver driver = null;

	public H5TestCase(WebDriver _driver) {
		driver = _driver;
	}

	@Parameters
	public static Collection<WebDriver[]> initParameter() throws Exception {
		return drivers;
	}

	/**
	 * ドライバを取得します。
	 *
	 * @return ドライバ
	 */
	protected static WebDriver getDriver() {
		return driver;
	}

	/**
	 * ドライバを取得します。
	 *
	 * @return ドライバ
	 */
	protected static int getDriversSize() {
		return drivers.size();
	}

	/**
	 * webdrier_config.xmlのtestPageUrlに指定されたページを基点に、指定された相対パスのページをテストブラウザ上に表示します。
	 *
	 * @param url
	 */
	protected static void show(String relativeUrl) {
		try {
			final URL url = new URL(new URL(TEST_PAGE_URL), relativeUrl);

			new WebDriverWait(driver, 10).until(new ExpectedCondition<Boolean>() {
				@Override
				public Boolean apply(WebDriver d) {
					d.get(url.toString());
					return d.getCurrentUrl().equals(url.toString());
				}

			});
		} catch (MalformedURLException e) {
			e.printStackTrace();
		}
	}

	/**
	 * 画面キャプチャを取得します。
	 * <p>
	 * 保存先のフォルダが存在しない場合は、フォルダの作成を行います。
	 */
	protected void takeScreenShot() {
		if (!(driver instanceof TakesScreenshot)) {
			System.out.println("このブラウザでは画面をキャプチャできません。");
			return;
		}

		try {
			File dir = new File(screenShotPath);
			if (!dir.exists()) {
				dir.mkdirs();
			}

			File scrFile =  ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);

			FileUtils.copyFile(scrFile,
					new File(screenShotPath
							+ "\\"
							+ driver.toString() + "_"
							+ System.currentTimeMillis() + ".png"));
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	protected static void changeOrentation(ScreenOrientation param) {
		if (driver instanceof AndroidDriver) {
			((AndroidDriver) getDriver()).rotate(param);
			// } else if (driver instanceof IPhoneDriver) {
			//			WebDriver augmentDriver = new Augmenter().augment(driver);
			//			((Rotatable)augmentDriver).rotate(param);
		}
	}

	protected static Object execAsyncJavaScript(String code, Object... arguments) {
		if (!(driver instanceof JavascriptExecutor)) {
			return null;
		}

		return ((JavascriptExecutor) driver).executeAsyncScript(code,
				arguments);
	}

	protected static Object execJavaScript(String code, Object... arguments) {
		if (!(driver instanceof JavascriptExecutor)) {
			return null;
		}

		return ((JavascriptExecutor) driver)
				.executeScript(code, arguments);
	}

	protected static void click(WebElement elem) {
		if (driver instanceof InternetExplorerDriver) {
			elem.sendKeys(Keys.ENTER);
		} else {
			elem.click();
		}
	}

	protected static List<WebElement> getElementsByLinkText(String linkName) {
		return getElementsByLinkText(linkName, null);
	}

	protected static List<WebElement> getElementsByLinkText(String linkName,
			WebElement targetElement) {
		List<WebElement> findElement = null;

		if (targetElement instanceof WebElement) {
			findElement = targetElement.findElements(By.linkText(linkName));
		} else {
			findElement = driver.findElements(By.linkText(linkName));
		}

		return findElement;
	}

	protected static WebElement getElementById(String id) {
		return getElementById(id, null);
	}

	protected static WebElement getElementById(String id, WebElement targetElement) {
		WebElement findElement = null;

		if (targetElement instanceof WebElement) {
			findElement = targetElement.findElement(By.id(id));
		} else {
			findElement = driver.findElement(By.id(id));
		}

		return findElement;
	}

	protected static List<WebElement> getElementsByName(String name) {
		return getElementsByName(name, null);
	}

	protected static List<WebElement> getElementsByName(String name,
			WebElement targetElement) {
		List<WebElement> findElement = null;

		if (targetElement instanceof WebElement) {
			findElement = targetElement.findElements(By.name(name));
		} else {
			findElement = driver.findElements(By.name(name));
		}

		return findElement;
	}

	protected static List<WebElement> getElementsByTagName(String tagName) {
		return getElementsByTagName(tagName, null);
	}

	protected static List<WebElement> getElementsByTagName(String tagName,
			WebElement targetElement) {
		List<WebElement> findElement = null;

		if (targetElement instanceof WebElement) {
			findElement = targetElement.findElements(By.tagName(tagName));
		} else {
			findElement = driver.findElements(By.tagName(tagName));
		}

		return findElement;
	}

	protected static List<WebElement> getElementsByClassName(String className) {
		return getElementsByClassName(className, null);
	}

	protected static List<WebElement> getElementsByClassName(String className,
			WebElement targetElement) {
		List<WebElement> findElement = null;

		if (targetElement instanceof WebElement) {
			findElement = targetElement.findElements(By.className(className));
		} else {
			findElement = driver.findElements(By.className(className));
		}

		return findElement;
	}

	protected static List<WebElement> getElementsByXPath(String xpath) {
		return getElementsByXPath(xpath, null);
	}

	protected static List<WebElement> getElementsByXPath(String xpath,
			WebElement targetElement) {
		List<WebElement> findElement = null;

		if (targetElement instanceof WebElement) {
			findElement = targetElement.findElements(By.xpath(xpath));
		} else {
			findElement = driver.findElements(By.xpath(xpath));
		}

		return findElement;
	}

	protected static List<WebElement> getElementsByPartialLinkText(String linkText) {
		return getElementsByPartialLinkText(linkText, null);
	}

	protected static List<WebElement> getElementsByPartialLinkText(String linkText,
			WebElement targetElement) {
		List<WebElement> findElement = null;

		if (targetElement instanceof WebElement) {
			findElement = targetElement.findElements(By
					.partialLinkText(linkText));
		} else {
			findElement = driver
					.findElements(By.partialLinkText(linkText));
		}

		return findElement;
	}

	protected static List<WebElement> querySelector(String query) {
		return querySelector(query, null);
	}

	protected static List<WebElement> querySelector(String query,
			WebElement targetElement) {
		List<WebElement> findElement = null;

		if (targetElement instanceof WebElement) {
			findElement = targetElement.findElements(By.cssSelector(query));
		} else {
			findElement = driver.findElements(By.cssSelector(query));
		}

		return findElement;
	}
}
