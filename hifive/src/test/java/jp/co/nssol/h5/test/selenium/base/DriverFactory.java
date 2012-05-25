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

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.junit.runners.Parameterized;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.android.AndroidDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.ie.InternetExplorerDriver;
import org.openqa.selenium.iphone.IPhoneDriver;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.safari.SafariDriver;

import com.opera.core.systems.OperaDriver;

class DriverFactory {
	private final static String PKEY_ANDROID_SDK_PATH = "androidSdkPath";
	private final static String PKEY_IPHONE_SERVER_PATH = "iPhoneServerPath";
	private final static String PKEY_CHROMIUM_PATH = "chromiumPath";
	private final static String PKEY_FIREBUG_PATH = "firebugPath";

	/**
	 * 指定されたドライバクラスを生成します。
	 * {@link Parameterized.Parameters}で利用されます。
	 *
	 * @param classes
	 * @return
	 */
	protected static Collection<WebDriver[]> createDriver(Class<? extends WebDriver>... classes) {
		List<WebDriver[]> d = new ArrayList<WebDriver[]>();

		for (Class<? extends WebDriver> clazz : classes) {
			if (clazz == InternetExplorerDriver.class) {
				d.add(new WebDriver[] {setupInternetExplorerDriver()});
			} else if (clazz == FirefoxDriver.class) {
				d.add(new WebDriver[] {setupFireFoxDriver()});
			} else if (clazz == ChromeDriver.class) {
				d.add(new WebDriver[] {setupChromeDriver()});
			} else if (clazz == IPhoneDriver.class) {
				d.add(new WebDriver[] {setupIPhoneDriver()});
			} else if (clazz == AndroidDriver.class) {
				d.add(new WebDriver[] {setupAndroidDriver()});
			} else if (clazz == OperaDriver.class) {
				d.add(new WebDriver[] {setupOperaDriver()});
			} else if (clazz == SafariDriver.class) {
				d.add(new WebDriver[] { setupSafariDriver() });
			}
		}

		return d;
	}

	/**
	 * FireFoxドライバをセットアップします。
	 *
	 * @return
	 */
	private static WebDriver setupFireFoxDriver() {
		FirefoxProfile profile = null;

		try {
			File file = new File(SettingsReader.getProperty(PKEY_FIREBUG_PATH));
			profile = new FirefoxProfile();
			profile.addExtension(file);
			profile.setAcceptUntrustedCertificates(true);
			profile.setAssumeUntrustedCertificateIssuer(false);
			profile.setPreference("extensions.firebug.currentVersion", "1.9.1");
		} catch (IOException e) {
			e.printStackTrace();
		}

		return new FirefoxDriver(profile) {
			@Override
			public String toString() {
				return "FireFox";
			}
		};
	}

	/**
	 * InternetExplorerDriverをセットアップします。
	 *
	 * @return InternetExplorerDriver
	 */
	private static WebDriver setupInternetExplorerDriver() {
		DesiredCapabilities ieCapabilities = DesiredCapabilities
				.internetExplorer();
		ieCapabilities
		.setCapability(
				InternetExplorerDriver.INTRODUCE_FLAKINESS_BY_IGNORING_SECURITY_DOMAINS,
				true);
		ieCapabilities.setCapability(CapabilityType.ACCEPT_SSL_CERTS, true); // 動作しない
		// driver.findElement(By.id("overridelink")).click();  // work around
		return new InternetExplorerDriver(ieCapabilities) {
			@Override
			public String toString() {
				return "InternetExproler";
			}
		};
	}

	/**
	 * ChromeDriverをセットアップします。
	 *
	 * @return ChromeDriver
	 */
	private static WebDriver setupChromeDriver() {
		System.setProperty("webdriver.chrome.driver",
				SettingsReader.getProperty(PKEY_CHROMIUM_PATH));
		ChromeOptions options = new ChromeOptions();
		options.addArguments("--ignore-certificate-errors");
		return new ChromeDriver(options) {
			@Override
			public String toString() {
				return "Chrome";
			}
		};
	}

	/**
	 * AndroidDriverをセットアップします。
	 *
	 * @return AndroidDriver
	 */
	private static WebDriver setupAndroidDriver() {
		String sdkPath = SettingsReader.getProperty(PKEY_ANDROID_SDK_PATH);
		try {
			Process p = new ProcessBuilder("cmd", "/C", sdkPath
					+ "\\platform-tools\\adb.exe forward tcp:8080 tcp:8080")
			.start();
			BufferedReader br = new BufferedReader(new InputStreamReader(
					p.getErrorStream()));
			try {
				for (;;) {
					String line = br.readLine();
					if (line == null) {
						break;
					}

					throw new RuntimeException(line);
				}
			} finally {
				br.close();
			}

		} catch (IOException e) {
			e.printStackTrace();
		}

		DesiredCapabilities caps = DesiredCapabilities.android();
		caps.setCapability(CapabilityType.ACCEPT_SSL_CERTS, true);

		return new AndroidDriver(caps) {
			@Override
			public String toString() {
				return "Android";
			}
		};
	}

	/**
	 * IPhoneDriverをセットアップします。
	 *
	 * @return IPhoneDriver
	 */
	private static WebDriver setupIPhoneDriver() {
		String serverPath = SettingsReader.getProperty(PKEY_IPHONE_SERVER_PATH);
		WebDriver driver = null;

		try {
			driver = new IPhoneDriver(serverPath) {
				/**
				 * IPhoneDriver#getScreenshotAs()はバグがあるためオーバーライドしてスクリーンショットが撮れるよう修正。
				 */
				@Override
				public <X> X getScreenshotAs(OutputType<X> target) {
					String base64 = (String)execute("screenshot").getValue();
					return target.convertFromBase64Png(base64);
				}

				@Override
				public String toString() {
					return "iPhone";
				}
			};
		} catch (Exception e) {
			e.printStackTrace();
		}

		return driver;
	}

	/**
	 * OperaDriverをセットアップします。
	 *
	 * @return OperaDriver
	 */
	private static WebDriver setupOperaDriver() {
		return new OperaDriver() {
			@Override
			public String toString() {
				return "Opera";
			}
		};
	}

	/**
	 * SafariDriverをセットアップします。
	 * 
	 * @return SafariDriver
	 */
	private static WebDriver setupSafariDriver() {
		return new SafariDriver() {
			@Override
			public String toString() {
				return "Safari";
			}
		};
	}
}
