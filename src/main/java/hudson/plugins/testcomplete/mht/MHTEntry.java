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

/**
 * Class to parse header of an MHT entry. Sample header of an entry produced by
 * TestComplete:
 * 
 * <pre>
 * 
 * Content-Type: image/gif
 * Content-Transfer-Encoding: base64
 * Content-Location: http://localhost/init_c4050f0f.gif
 * 
 * </pre>
 * 
 * @author Fernando Miguélez Palomo
 *
 */
public class MHTEntry {
	private String name;
	private String contentType;

	protected MHTEntry(String name, String contentType) {
		this.name = name;
		this.contentType = contentType;
	}

	/**
	 * Returns the name of this entry, considering it the part of the entry
	 * location without the base URL indicated in the header of the MHT file.
	 * 
	 * @return the name of the entry
	 */
	public String getName() {
		return name;
	}

	/**
	 * Returns the content type of this entry.
	 * 
	 * @return the content type of the entry.
	 */
	public String getContentType() {
		return contentType;
	}
}