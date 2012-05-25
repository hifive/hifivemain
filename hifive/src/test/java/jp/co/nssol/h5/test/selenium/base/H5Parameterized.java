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

import java.lang.annotation.Annotation;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

import org.junit.runner.Runner;
import org.junit.runner.notification.RunNotifier;
import org.junit.runners.BlockJUnit4ClassRunner;
import org.junit.runners.Parameterized.Parameters;
import org.junit.runners.Suite;
import org.junit.runners.model.FrameworkMethod;
import org.junit.runners.model.InitializationError;
import org.junit.runners.model.Statement;
import org.junit.runners.model.TestClass;

//Referenced classes of package org.junit.runners:
//         Suite, BlockJUnit4ClassRunner

public class H5Parameterized extends Suite {
	private class TestClassRunnerForParameters extends BlockJUnit4ClassRunner {
		private final int fParameterSetNumber;
		private final List<Object[]> fParameterList;
		private final String fDisplayName;

		TestClassRunnerForParameters(Class<?> type,
				List<Object[]> parameterList, int i) throws InitializationError {
			super(type);
			fParameterList = parameterList;
			fParameterSetNumber = i;
			fDisplayName = parameterList.get(i)[0].toString();
		}

		public Object createTest() throws Exception {
			return getTestClass().getOnlyConstructor().newInstance(
					computeParams());
		}

		private Object[] computeParams() throws Exception {
			try {
				return (Object[]) fParameterList.get(fParameterSetNumber);
			} catch (ClassCastException e) {
				throw new Exception(
						String.format(
								"%s.%s() must return a Collection of arrays.",
								new Object[] {
										getTestClass().getName(),
										getParametersMethod(getTestClass())
												.getName() }));
			}
		}

		@Override
		protected String getName() {
			return fParameterSetNumber +"_"+ fDisplayName;
		}

		@Override
		protected String testName(FrameworkMethod method) {
			return String.format("%s[%s]", new Object[] { method.getName(),
					Integer.valueOf(fParameterSetNumber) });
		}

		@Override
		protected void validateConstructor(List<Throwable> errors) {
			validateOnlyOneConstructor(errors);
		}

		@Override
		protected Statement classBlock(RunNotifier notifier) {
			return childrenInvoker(notifier);
		}

		@Override
		protected Annotation[] getRunnerAnnotations() {
			return new Annotation[0];
		}
	}

	private final ArrayList<TestClassRunnerForParameters> runners = new ArrayList<TestClassRunnerForParameters>();

	public H5Parameterized(Class<?> klass) throws Throwable {
		super(klass, Collections.<Runner> emptyList());
		List<Object[]> parametersList = getParametersList(getTestClass());
		for (int i = 0; i < parametersList.size(); i++)
			runners.add(new TestClassRunnerForParameters(getTestClass()
					.getJavaClass(), parametersList, i));

	}

	@Override
	protected List getChildren() {
		return runners;
	}

	private List<Object[]> getParametersList(TestClass klass) throws Throwable {
		return (List<Object[]>) getParametersMethod(klass).invokeExplosively(
				null, new Object[0]);
	}

	private FrameworkMethod getParametersMethod(TestClass testClass)
			throws Exception {
		List<FrameworkMethod> methods = testClass
				.getAnnotatedMethods(Parameters.class);
		for (Iterator<FrameworkMethod> i$ = methods.iterator(); i$.hasNext();) {
			FrameworkMethod each = (FrameworkMethod) i$.next();
			int modifiers = each.getMethod().getModifiers();
			if (Modifier.isStatic(modifiers) && Modifier.isPublic(modifiers))
				return each;
		}

		throw new Exception((new StringBuilder())
				.append("No public static parameters method on class ")
				.append(testClass.getName()).toString());
	}

}