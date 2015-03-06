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
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.util.logging.Logger;

import javax.xml.transform.stream.StreamSource;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.filefilter.FileFilterUtils;
import org.jenkinsci.lib.dtkit.model.InputMetricXSL;
import org.jenkinsci.lib.dtkit.model.InputType;
import org.jenkinsci.lib.dtkit.model.OutputMetric;
import org.jenkinsci.lib.dtkit.util.converter.ConversionException;
import org.jenkinsci.lib.dtkit.util.converter.ConversionService;
import org.jenkinsci.plugins.xunit.types.model.JUnitModel;

import com.google.common.io.Files;

/**
 * 
 * @author Fernando Miguélez Palomo
 * 
 *
 */
public class TestCompleteInputMetric extends InputMetricXSL {

	private static final Logger logger = LogManager.getLogManager().getLogger(
			TestCompleteInputMetric.class.getName());

	private final static String CONTENT_TYPE_XML = "text/xml";
	/**
	 * Base URL links inside MHT and XML files refer to
	 */
	private final static String INTERNAL_PARAM_BASE_URL = "baseUrl";
	/**
	 * Path holding XML files
	 */
	private final static String INTERNAL_PARAM_BASE_PATH = "basePath";

	/**
	 * Parameter that defines the regular expression to apply to transformation
	 * so only those tests matching it will be included
	 */
	public final static String PARAM_TEST_PATTERN = "testPattern";

	/**
	 * 
	 */
	private static final long serialVersionUID = 6315183679905588379L;

	/**
	 * Pattern provided by the user to apply a filtering to the tests results
	 * (we may only want to filter out some tests from the results such as
	 * start-up or tear-down type tests).
	 */
	private String testFilterPattern = "";

	@Override
	public InputType getToolType() {
		return InputType.TEST;
	}

	@Override
	public String getToolName() {
		return Messages.testcomplete_toolName();
	}

	@Override
	public String getToolVersion() {
		return "10.x";
	}

	@Override
	public String getXslName() {
		return "testcomplete-10-to-junit-1.0.xsl";
	}

	protected void setTestFilterPattern(String testFilterPattern) {
		this.testFilterPattern = testFilterPattern != null ? testFilterPattern
				.trim() : "";
	}

	/**
	 * Gets the Class (namespace) of the xsl file resource
	 *
	 * @return the resource class (for loading)
	 */
	@Override
	public Class<?> getXslResourceClass() {
		return this.getClass();
	}

	@Override
	public String[] getInputXsdNameList() {
		return null;
	}

	@Override
	public OutputMetric getOutputFormatType() {
		return JUnitModel.LATEST;
	}

	/**
	 * This method extracts all XML files inside a MHT file produced by
	 * TestComplete/TestExecute into a temporary directory and returns a
	 * reference to such directory.
	 * 
	 * @param inputFile
	 *            MHT file to process
	 * @param params
	 *            map where parameter with key "baseUrl" and value returned by
	 *            {@link MHTInputStream#getBaseUrl()} is added
	 * @return temporary file that contains all the extracted XML files from
	 *         input MHT file
	 * @throws MHTException
	 *             if and MHT error occurs
	 * @throws IOException
	 *             if an I/O error ocurrs
	 */
	private File extractXMLFilesFromMHTFile(File inputFile,
			Map<String, Object> params) throws IOException {
		File tempDir = Files.createTempDir();
		MHTInputStream mis = null;

		try {
			mis = new MHTInputStream(new FileInputStream(inputFile));

			if (params != null) {
				params.put(INTERNAL_PARAM_BASE_URL, mis.getBaseUrl());
				// It seems that backslashes should be escaped in XSL references so we just convert to UNIX format 
				// that works also on Windows for Java.
				params.put(INTERNAL_PARAM_BASE_PATH, FilenameUtils.normalize(tempDir.getAbsolutePath(), true));
			}

			MHTEntry entry = null;
			byte buffer[] = new byte[1024];
			int readBytes = 0;

			while ((entry = mis.getNextEntry()) != null) {
				if (CONTENT_TYPE_XML.equals(entry.getContentType())) {
					File out = new File(tempDir, entry.getName());
					out.createNewFile();
					FileOutputStream fos = new FileOutputStream(out);
					try {
						while ((readBytes = mis.read(buffer)) > 0) {
							fos.write(buffer, 0, readBytes);
						}
					} finally {
						fos.close();
					}
				}
			}

			return tempDir;

		} catch (IOException e) {
			// Cleanup temporary directory here upon failure
			FileUtils.deleteDirectory(tempDir);
			throw e;
		} finally {
			if (mis != null) {
				mis.close();
			}
		}
	}

	@Override
	public void convert(File inputFile, File outFile, Map<String, Object> params)
			throws ConversionException {
		File inputTempDir = null;
		Map<String, Object> conversionParams = new HashMap<String, Object>();
		if (params != null) {
			conversionParams.putAll(params);
		}

		try {
			inputTempDir = extractXMLFilesFromMHTFile(inputFile,
					conversionParams);

			Collection<File> xmlFiles = FileUtils.listFiles(inputTempDir,
					FileFilterUtils.nameFileFilter("root.xml"), null);
			if (xmlFiles.isEmpty()) {
				throw new ConversionException("Invalid TestComplete MHT file '"
						+ inputFile.getName() + "'. No 'root.xml' found.");
			}

			File rootXml = xmlFiles.iterator().next();

			/*
			 * TODO We are unable to pass testFilterPattern as specified by user because 
			 * xUnit does not pass the TestType instance (TestCompleteTestType). Base plugin
			 * should be extended to pass customized parameters.
			 */
			if (testFilterPattern.length() > 0) {
				if (testFilterPattern.startsWith("^")
						|| testFilterPattern.endsWith("$")) {
					/*
					 * We do not allow these special symbols because they will
					 * make our pattern to fail, since provided pattern is only
					 * part of another pattern that matches test names.
					 */
					throw new ConversionException(
							"Invalid test filter pattern provided '"
									+ testFilterPattern
									+ "'. Start (^) and end ($) line pattern symbols are not allowed.");
				}

				if (logger.isLoggable(Level.INFO)) {
					logger.info("Applying test filter pattern '"
							+ testFilterPattern + "' to TestComplete test: "
							+ inputFile.getName());
				}
				conversionParams.put(PARAM_TEST_PATTERN, testFilterPattern);
			}

			ConversionService conversionService = new ConversionService();
			if (getXslFile() == null) {
				conversionService.convert(new StreamSource(this
						.getXslResourceClass()
						.getResourceAsStream(getXslName())), rootXml, outFile,
						conversionParams);
			} else {
				conversionService.convert(getXslFile(), rootXml, outFile,
						conversionParams);
			}
		} catch (IOException e) {
			throw new ConversionException("Errors parsing input MHT file '"
					+ inputFile.getName() + "'", e);
		} finally {
			if (inputTempDir != null) {
				try {
					FileUtils.deleteDirectory(inputTempDir);
				} catch (IOException e) {

				}
			}
		}
	}
}
