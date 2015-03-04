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
package hudson.plugins.testcomplete.mht;

import java.io.BufferedReader;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipInputStream;

import javax.xml.bind.DatatypeConverter;

/**
 * Utility class to read <a href="http://en.wikipedia.org/wiki/MHTML">MHT</a>
 * files produced by <a
 * href="http://en.wikipedia.org/wiki/TestComplete">TestComplete</a> and
 * inspired by inspired by {@link ZipInputStream}. This class could also process
 * (though not tested) MHT files produced by other programs.
 * 
 * @author Fernando Miguélez Palomo
 *
 */
public class MHTInputStream extends FilterInputStream {
	private static final int ENTRY_HDR_FIELD_CONTENT_TYPE = 0;
	private static final int ENTRY_HDR_FIELD_CONTENT_TRANSFER_ENCODING = 1;
	private static final int ENTRY_HDR_FIELD_CONTENT_LOCATION = 2;
	private static final String ENTRY_HDR_FIELDS[] = { "Content-Type: ",
			"Content-Transfer-Encoding: ", "Content-Location: " };

	BufferedReader br;
	MHTHeader hdr;
	MHTEntry curEntry;
	boolean endOfEntryReached;

	byte curDataBuffer[];
	int curDataPos;

	/**
	 * Creates a new MHT input stream and reads the header of the MHT so
	 * {@link #getBaseUrl()} can be called immediately.
	 * 
	 * @param in
	 *            the actual input stream
	 * @throws MHTException
	 *             if a MHT error has occurred
	 */
	public MHTInputStream(InputStream in) throws MHTException {
		super(in);
		br = new BufferedReader(new InputStreamReader(in));
		hdr = new MHTHeader(br);
	}

	/**
	 * Returns the URL all MHT entries are referenced to. This URL is available
	 * right after instantiating the stream.
	 * 
	 * @return the URL all MHT entries are referenced to
	 * 
	 */
	public String getBaseUrl() {
		return hdr.url;
	}

	/**
	 * Reads the next MHT entry with the name given and positions the stream at
	 * the beginning of the entry data. If no entry with such name is found then
	 * <code>null</code> is returned and the stream is positioned at EOF.<br/>
	 * <br/>
	 * The name of an entry is considered to be the relative part of the URL
	 * stripping out the base URL (as returned by {@link #getBaseUrl()}). E.g.
	 * If an entry has an internal URL <i> http://localhost/index.html </i> and
	 * base URL of the stream is <i>http://localhost/</i> then <i>index.html</i>
	 * is the name of the entry. <br/>
	 * <br/>
	 * If the name provided is <code>null</code> next entry in stream is read.
	 * 
	 * 
	 * @param name
	 *            the name of the entry to read or <code>null</code> following
	 *            entry is desired
	 * @return the entry or <code>null</code> if no entry is found with the name
	 *         provided
	 * @throws IOException
	 *             if an I/O error has occurred
	 * @throws MHTException
	 *             if a MHT error has occurred
	 */
	public MHTEntry getNextEntry(String name) throws IOException {

		String line = null;
		boolean boundaryFound = false;
		int entryHdrIdx = 0;
		String entryHdrValues[] = new String[ENTRY_HDR_FIELDS.length];

		curEntry = null;
		endOfEntryReached = false;

		while ((line = br.readLine()) != null) {
			if (!boundaryFound) {
				/* Look for next boundary first */
				if (line.equals(hdr.boundary)) {
					boundaryFound = true;
				}
			} else {
				/* Boundary found. Process entry header fields */
				if (line.startsWith(ENTRY_HDR_FIELDS[entryHdrIdx])) {
					entryHdrValues[entryHdrIdx] = line
							.substring(ENTRY_HDR_FIELDS[entryHdrIdx].length());
				} else {
					throw new MHTException("Entry header '"
							+ ENTRY_HDR_FIELDS[entryHdrIdx]
							+ "' not found at line " + entryHdrIdx
							+ " of MHT entry header. Found: '" + line + "'");
				}

				entryHdrIdx++;

				if (entryHdrIdx == ENTRY_HDR_FIELDS.length) {
					// Expect empty line after header fields
					line = br.readLine();
					if (line == null) {
						throw new MHTException(
								"EOF found while processing entry header");
					} else if (line.length() != 0) {
						throw new MHTException(
								"Malformed entry header. It should finish with an empty line. Found: '"
										+ line + "'");
					}

					String contentLocation = entryHdrValues[ENTRY_HDR_FIELD_CONTENT_LOCATION];
					if (!contentLocation.startsWith(hdr.url)) {
						throw new MHTException(
								"Invalid entry header. Content location is not relative to base URL ("
										+ hdr.url + "): " + contentLocation);
					}

					String entryName = contentLocation.substring(hdr.url
							.length());
					if (name == null || name.equals(entryName)) {
						// Entry found. InputStream is now positioned at start
						// of Base64 entry data
						String encoding = entryHdrValues[ENTRY_HDR_FIELD_CONTENT_TRANSFER_ENCODING];
						String contentType = entryHdrValues[ENTRY_HDR_FIELD_CONTENT_TYPE];

						if (!"base64".equalsIgnoreCase(encoding)) {
							throw new MHTException(
									"Unsupported encoding for entry '"
											+ entryName
											+ "' found (only 'base64' is supported): "
											+ encoding);
						}

						// Entry found
						curEntry = new MHTEntry(entryName, contentType);
						break;
					} else {
						// Entry does not match. Reset search by looking for
						// next boundary
						entryHdrIdx = 0;
						boundaryFound = false;
					}
				}
			}
		}

		// Return entry found (null if none)
		return curEntry;
	}

	/**
	 * Returns the next {@link MHTEntry} in the stream and positions the stream
	 * at the beginning of the entry data. This is equivalent to calling
	 * {@link #getNextEntry(String)} with <code>null</code> name.
	 * 
	 * @return the entry or <code>null</code> if no more entries are available.
	 * @throws IOException
	 *             if an I/O error has occurred
	 * @throws MHTException
	 *             if a MHT error has occurred
	 */
	public MHTEntry getNextEntry() throws IOException {
		return getNextEntry(null);
	}

	/**
	 * Returns 0 after EOF has reached for the current entry data, otherwise
	 * always return 1. <br/>
	 * <br/>
	 * Programs should not count on this method to return the actual number of
	 * bytes that could be read without blocking.
	 * 
	 * @return 1 before EOF and 0 after EOF has reached for current entry.
	 * 
	 * @throws IOException
	 *             if an I/O error has occurred
	 */
	@Override
	public int available() throws IOException {
		return curEntry != null && !endOfEntryReached ? 1 : 0;
	}

	/**
	 * This operation is not supported with this input stream and
	 * {@link UnsupportedOperationException} will be thrown if this method is
	 * called.
	 * 
	 * @throws UnsupportedOperationException
	 *             if called
	 */
	@Override
	public long skip(long n) throws IOException {
		throw new UnsupportedOperationException("Skip not supported");
	}

	@Override
	public boolean markSupported() {
		return false;
	}

	/**
	 * This operation is not supported with this input stream and
	 * {@link UnsupportedOperationException} will be thrown if this method is
	 * called.
	 * 
	 * @throws UnsupportedOperationException
	 *             if called
	 */
	@Override
	public synchronized void mark(int readlimit) {
		throw new UnsupportedOperationException("Mark not supported");
	}

	/**
	 * This operation is not supported with this input stream and
	 * {@link UnsupportedOperationException} will be thrown if this method is
	 * called.
	 * 
	 * @throws UnsupportedOperationException
	 *             if called
	 */
	@Override
	public synchronized void reset() throws IOException {
		throw new UnsupportedOperationException("Reset not supported");
	}

	@Override
	/**
	 * Closes this input stream and releases any system resources associated with the stream.
	 */
	public void close() throws IOException {
		br.close();
		curEntry = null;
		curDataBuffer = null;
		curDataPos = 0;
	}

	/**
	 * Reads from the current MHT entry into an array of bytes. If len is not
	 * zero, the method blocks until some input is available; otherwise, no
	 * bytes are read and 0 is returned.
	 * 
	 * @param b
	 *            the buffer into which the data is read
	 * @param off
	 *            the start offset in the destination array b
	 * @param len
	 *            the maximum number of bytes read
	 */
	@Override
	public int read(byte[] b, int off, int len) throws IOException {
		if (curEntry == null) {
			throw new MHTException(
					"Stream not positioned at start of entry data. Call getNexEntry() first");
		}

		// Ready previously buffered data
		int pendingLen = len;
		int curOff = off;

		while (pendingLen > 0) {
			if (curDataBuffer != null && curDataPos < curDataBuffer.length) {
				int remBufferLen = curDataBuffer.length - curDataPos;
				int lenToCopy = pendingLen < remBufferLen ? pendingLen
						: remBufferLen;
				System.arraycopy(curDataBuffer, curDataPos, b, curOff,
						lenToCopy);
				curOff += lenToCopy;
				curDataPos += lenToCopy;
				pendingLen -= lenToCopy;
			} else {
				if (endOfEntryReached) {
					// We can not read more lines since end of entry (empty
					// line) was reached. getNextEntry() should be called.
					break;
				} else {
					String line = br.readLine();
					if (line.length() == 0) {
						endOfEntryReached = true;
					} else {
						// Line contains data
						curDataBuffer = DatatypeConverter
								.parseBase64Binary(line);
						curDataPos = 0;
					}
				}
			}
		}

		return len - pendingLen;
	}

	/**
	 * Class to parse MHT Header. Sample header produced by TestComplete:
	 * 
	 * <pre>
	 * <!-- saved from url=(0017)http://localhost/ -->
	 * From: <TestComplete>
	 * Subject: TestComplete Log Files
	 * MIME-Version: 1.0
	 * Content-Type: multipart/related;
	 * 	boundary="----=6DCFB6469EC24181952E90C3D5D2BC4";
	 * 	type="text/html"
	 * 
	 * This is a multi-part message in MIME format.
	 * </pre>
	 * 
	 * @author Fernando Miguélez Palomo
	 *
	 */
	private class MHTHeader {
		static final String FIRST_LINE_PATTERN = "<!-- saved from url=\\(0017\\)([^ ]+) --> *";
		static final String BOUNDARY_PATTERN = "[ \t]*boundary=\"([^\"]+)\";";
		static final int MAX_HEADER_SIZE = 10;

		String url;
		String boundary;

		private MHTHeader(BufferedReader reader) throws MHTException {
			try {
				Pattern firstLinePattern = Pattern.compile(FIRST_LINE_PATTERN);
				String line = reader.readLine();

				Matcher firstLineMatcher = firstLinePattern.matcher(line);
				if (!firstLineMatcher.matches()) {
					throw new MHTException(
							"First line does not specify origin URL: " + line);
				}

				url = firstLineMatcher.group(1);

				line = reader.readLine();
				int lineIdx = 1;
				while (line != null && lineIdx++ < MAX_HEADER_SIZE
						&& !Pattern.matches(BOUNDARY_PATTERN, line)) {
					line = reader.readLine();
				}

				Matcher boundaryMatcher = Pattern.compile(BOUNDARY_PATTERN)
						.matcher(line);
				if (!boundaryMatcher.matches()) {
					throw new MHTException(
							"Boundary marker not found in MHT header after "
									+ lineIdx + " lines.");
				}

				/*
				 * As of RFC1341: The Content-Type field for multipart entities
				 * requires one parameter, "boundary", which is used to specify
				 * the encapsulation boundary. The encapsulation boundary is
				 * defined as a line consisting entirely of two hyphen
				 * characters ("-", decimal code 45) followed by the boundary
				 * parameter value from the Content-Type header field.
				 */
				boundary = "--" + boundaryMatcher.group(1);

			} catch (IOException e) {
				throw new MHTException("Error parsing MHT header", e);
			}
		}
	}

}
