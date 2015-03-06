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

import hudson.Extension;

import org.jenkinsci.lib.dtkit.descriptor.TestTypeDescriptor;
import org.jenkinsci.lib.dtkit.type.TestType;
import org.kohsuke.stapler.DataBoundConstructor;

/**
 * 
 * @author Fernando Miguélez Palomo
 *
 */
public class TestCompleteTestType extends TestType {

    /**
	 * 
	 */
    private static final long serialVersionUID = -8695240210666787247L;

    String testFilterPattern;

    @DataBoundConstructor
    public TestCompleteTestType(String pattern, boolean failedIfNotNew, boolean deleteOutputFiles,
            boolean stopProcessingIfError, String testFilterPattern) {
        super(pattern, failedIfNotNew, deleteOutputFiles, stopProcessingIfError);
        this.testFilterPattern = testFilterPattern;
    }

    @Override
    public TestTypeDescriptor<?> getDescriptor() {
        return new TestCompleteTestType.DescriptorImpl();
    }

    @Extension
    public static class DescriptorImpl extends TestTypeDescriptor<TestCompleteTestType> {

        public DescriptorImpl() {
            super(TestCompleteTestType.class, TestCompleteInputMetric.class);
        }
    }

}
