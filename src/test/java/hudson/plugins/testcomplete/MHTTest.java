/**
 * The MIT License
 * Copyright (c) 2015 Fernando Miguélez Palomo and all contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
package hudson.plugins.testcomplete;

import hudson.plugins.testcomplete.mht.MHTEntry;
import hudson.plugins.testcomplete.mht.MHTException;
import hudson.plugins.testcomplete.mht.MHTInputStream;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URL;

import org.junit.Assert;
import org.junit.Test;

public class MHTTest {

	MHTInputStream getMHTInputStream(String file) throws Exception {
		return new MHTInputStream(getFileInputStream(file));
	}

	FileInputStream getFileInputStream(String file) throws Exception {
		URL resource = this.getClass().getResource(file);
		if (resource == null)
			throw new IOException("File not found: " + file);

		return new FileInputStream(new File(resource.toURI()));
	}

	@Test
	public void testContent() throws Exception {
		MHTInputStream is = null;
		byte readBuffer[] = new byte[1024];
		byte expectedBuffer[] = new byte[1024];

		try {
			is = getMHTInputStream("MHTTest-testContent.mht");

			Assert.assertEquals("http://localhost/", is.getBaseUrl());

			MHTEntry entry = null;

			while ((entry = is.getNextEntry()) != null) {
				FileInputStream fis = null;

				try {

					fis = getFileInputStream("MHTTest-testContent/"
							+ entry.getName());

					int readBytes = 0;
					while (is.available() > 0) {
						readBytes = is.read(readBuffer);

						fis.read(expectedBuffer, 0, readBytes);
						Assert.assertArrayEquals(
								"Extracted entry '" + entry.getName()
										+ "' does not have expected content.",
								expectedBuffer, readBuffer);

					}
				} finally {
					if (fis != null)
						fis.close();
				}
			}
		} finally {
			if (is != null)
				is.close();
		}
	}

	@Test
	public void testUninitializedRead() throws Exception {
		MHTInputStream is = getMHTInputStream("MHTTest-testContent.mht");
		byte buffer[] = new byte[256];

		try {
			Exception e = null;
			try {
				is.read(buffer);
			} catch (Exception ex) {
				e = ex;
			}

			Assert.assertNotNull("Read without entry seek should have failed",
					e);
			Assert.assertEquals("Bad error type", MHTException.class,
					e.getClass());
		} finally {
			is.close();
		}
	}

	private static final String UNSUPPORTED_METHODS[] = { "mark", "skip",
			"reset" };
	private static final Class<?> UNSUPPORTED_METHOD_ARG_TYPES[] = { int.class,
			long.class, null };
	private static final Object UNSUPPORTED_METHOD_ARGS[] = { 10, 5, null };

	@Test
	public void testUnsupportedOperations() throws Exception {
		MHTInputStream is = getMHTInputStream("MHTTest-testContent.mht");

		try {
			for (int i = 0; i < UNSUPPORTED_METHODS.length; i++) {
				Method m = UNSUPPORTED_METHOD_ARG_TYPES[i] != null ? MHTInputStream.class
						.getMethod(UNSUPPORTED_METHODS[i],
								UNSUPPORTED_METHOD_ARG_TYPES[i])
						: MHTInputStream.class
								.getMethod(UNSUPPORTED_METHODS[i]);
				Throwable e = null;
				try {
					if (UNSUPPORTED_METHOD_ARGS[i] != null)
						m.invoke(is, UNSUPPORTED_METHOD_ARGS[i]);
					else
						m.invoke(is);
				} catch (InvocationTargetException ex) {
					e = ex.getTargetException();
				}
				Assert.assertNotNull("Method '" + UNSUPPORTED_METHODS[i]
						+ "' should have failed", e);
				Assert.assertEquals("Method '" + UNSUPPORTED_METHODS[i]
						+ "' should not be supported",
						UnsupportedOperationException.class, e.getClass());
			}
		} finally {
			is.close();
		}
	}

	@Test
	public void testBadHeader() throws Exception {
		testFail("MHTTest-testBadHeaderBoundary.mht", null, MHTException.class,
				"Error parsing MHT header");
		testFail("MHTTest-testBadHeaderUrl.mht", null, MHTException.class,
				"Error parsing MHT header");
	}

	@Test
	public void testBadEntry() throws Exception {
		testFail(
				"MHTTest-testBadEntryUrl.mht",
				null,
				MHTException.class,
				"Invalid entry header. Content location is not relative to base URL (http://localhost/): http://my.own.corrupt.url/index.htm");
		testFail(
				"MHTTest-testBadEntryEncoding.mht",
				"mytext.txt",
				MHTException.class,
				"Unsupported encoding for entry 'mytext.txt' found (only 'base64' is supported): quoted-printable");

		/*
		 * Comment out if causes problems on other systems. Tested on MacOSX
		 * 10.6.8 with Java(TM) SE Runtime Environment (build
		 * 1.6.0_65-b14-462-10M4609). This is the exception obtained but seems
		 * quite an uncontrollable error (no sanity check on input is
		 * performed). I presume that on other systems with other JVM versions
		 * (and JAXB implementations) this error may not be the same.
		 */
		testFail("MHTTest-testBadEntryData.mht", "index.htm",
				ArrayIndexOutOfBoundsException.class, null);
	}

	private void testFail(String mhtFile, String entryName,
			Class<? extends Exception> expectedErrorType, String expectedMessage)
			throws Exception {
		MHTInputStream is = null;
		Exception e = null;

		try {
			is = getMHTInputStream(mhtFile);
			is.getNextEntry(entryName);
			byte data[] = new byte[256];
			while (is.read(data) > 0) {
				// Do nothing. Fail sometime here
			}
		} catch (Exception ex) {
			e = ex;
		} finally {
			if (is != null)
				is.close();
		}

		Assert.assertNotNull("No error raised", e);
		Assert.assertEquals("Invalid error type", expectedErrorType,
				e.getClass());
		if (expectedMessage != null) {
			Assert.assertEquals("Invalid error message", expectedMessage,
					e.getMessage());
		}
	}
}
