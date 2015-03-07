<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format"
	xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:fn="http://www.w3.org/2005/xpath-functions"
	xmlns:xdt="http://www.w3.org/2005/xpath-datatypes">

	<xsl:param name="baseUrl" select="'http://localhost/'" />
	<xsl:param name="basePath" select="." />
	<xsl:param name="testPattern" select="'[^\]]+'" />

	<xsl:variable name="testLogNamePattern"
		select="concat(concat('[^ ]+ Test Log \[(',$testPattern), ')\]')" />
	<xsl:variable name="baseDir">
		<xsl:choose>
			<xsl:when test="ends-with($basePath,'/')">
				<xsl:value-of select="$basePath" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($basePath,'/')" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>


	<xsl:output method="xml" indent="yes" />
	<xsl:template match="/LogData">
		<xsl:variable name="testCount"
			select="count(//LogData[matches(@name,$testLogNamePattern) and Provider/@name='Test Log'])" />
		<xsl:variable name="failureCount"
			select="count(//LogData[matches(@name,$testLogNamePattern) and Provider/@name='Test Log' and @status=2])" />

		<xsl:variable name="testSuiteData"
			select="document(concat($baseDir,lower-case(substring-after(Provider[position() = 1]/@href,$baseUrl))))" />

		<testsuite>
			<xsl:attribute name="timestamp">
				<xsl:if
				test="$testSuiteData//*[ends-with(name(),'LogItem') and position()=1]/StartTime">
					<xsl:call-template name="convertTc2XsdDateTime">
	                            <xsl:with-param name="inputDateTime"
					select="string($testSuiteData//*[ends-with(name(),'LogItem') and position()=1]/StartTime)" />
								<xsl:with-param name="inputMillis"
					select="number($testSuiteData//*[ends-with(name(),'LogItem') and position()=1]/StartTime/@msec) mod 1000" />
					</xsl:call-template>
				</xsl:if>
            </xsl:attribute>
			<xsl:attribute name="time">
				<xsl:if test="$testSuiteData//*[ends-with(name(),'LogItem')]/RunTime">
	                <xsl:value-of
					select="sum($testSuiteData//*[ends-with(name(),'LogItem')]/RunTime/@msec) div 1000" />
				</xsl:if>
            </xsl:attribute>
			<xsl:attribute name="tests">
					        <xsl:value-of select="$testCount" />
                    </xsl:attribute>
			<xsl:attribute name="errors">
                            <xsl:text>0</xsl:text>
                        </xsl:attribute>
			<xsl:attribute name="failures">
                            <xsl:value-of select="$failureCount" />
                        </xsl:attribute>
			<xsl:attribute name="skipped">
                            <xsl:text>0</xsl:text>
                    </xsl:attribute>
			<xsl:attribute name="name">
                            <xsl:value-of select="@name" />
                    </xsl:attribute>
			<xsl:for-each
				select="//LogData[matches(@name,$testLogNamePattern) and Provider/@name='Test Log']">
				<testcase>
					<xsl:variable name="testLogData">
						<xsl:if test="../Provider[ends-with(@name,'Log') and position() = 1]">
							<xsl:copy-of
								select="document(concat($baseDir,lower-case(substring-after(../Provider[ends-with(@name,'Log') and position() = 1]/@href,$baseUrl))))" />
						</xsl:if>
					</xsl:variable>
					<xsl:variable name="testItemsLogData">
						<xsl:copy-of
							select="document(concat($baseDir,lower-case(substring-after(Provider[ends-with(@name,'Log') and position() = 1]/@href,$baseUrl))))" />
					</xsl:variable>

					<xsl:variable name="testLogPosition">
						<xsl:value-of
							select="count(preceding-sibling::LogData[Provider/@name = 'Test Log']) + 1" />
					</xsl:variable>

					<xsl:attribute name="time">
						<xsl:if test="$testLogData//*[ends-with(name(),'LogItem') and position()=$testLogPosition]/RunTime">
							<xsl:value-of
							select="number(string($testLogData//*[ends-with(name(),'LogItem') and position()=$testLogPosition]/RunTime/@msec)) div 1000" />
						</xsl:if>
                    </xsl:attribute>
					<xsl:attribute name="name">
						<xsl:value-of select="replace(@name, $testLogNamePattern,'$1')" />
                    </xsl:attribute>
					<xsl:attribute name="classname">
					    <xsl:value-of
						select="ancestor::LogData[Provider/@name='Project Log' and position() = last()-1]/@name" />
					</xsl:attribute>
					<xsl:if test="@status = '2'">
						<failure>
							<xsl:attribute name="message">
								<xsl:value-of
								select="normalize-space(string($testItemsLogData//TestLogItem[string(TypeDescription)  = 'Error' and position() = 1]/Message))" />
                            </xsl:attribute>
						</failure>
					</xsl:if>
					<system-out>
						<xsl:text disable-output-escaping="yes">&lt;![CDATA[</xsl:text>
						<xsl:call-template name="dumpTestLogMessages">
							<xsl:with-param name="testItemsLogData" select="$testItemsLogData" />
						</xsl:call-template>
						<xsl:text disable-output-escaping="yes">]]&gt;</xsl:text>
					</system-out>
				</testcase>
			</xsl:for-each>
		</testsuite>
	</xsl:template>

	<!-- Adaptation from from http://stackoverflow.com/a/17084608 -->
	<xsl:template name="convertTc2XsdDateTime">
		<xsl:param name="inputDateTime" />
		<xsl:param name="inputMillis" />
		
		<xsl:choose>
			<!-- Format: MMddyyyyhhmmssaa -->
			<xsl:when test="matches($inputDateTime, '[0-9]+/[0-9]+/[0-9]+ [0-9]+:[0-9]+:[0-9]+ PM|AM$')">
				<xsl:analyze-string select="$inputDateTime"
					regex="([0-9]+)/([0-9]+)/([0-9]+) ([0-9]+):([0-9]+):([0-9]+) (PM|AM)$">
					<xsl:matching-substring>
						<xsl:variable name="month" select="number(regex-group(1))" />
						<xsl:variable name="day" select="number(regex-group(2))" />
						<xsl:variable name="year" select="number(regex-group(3))" />
						<xsl:variable name="hours">
							<xsl:choose>
								<xsl:when test="regex-group(7) = 'PM'">
									<xsl:value-of select="12 + number(regex-group(4))" />
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="number(regex-group(4)) mod 12" />
								</xsl:otherwise>
							</xsl:choose>
						</xsl:variable>
						<xsl:variable name="minutes" select="number(regex-group(5))" />
						<xsl:variable name="seconds" select="number(regex-group(6))" />
						<xsl:variable name="dateTime"
							select="concat($year, '-', format-number($month, '00'), '-', format-number($day, '00'), ' ', format-number($hours, '00'), ':', format-number($minutes, '00'), ':', format-number($seconds, '00'), '.', format-number($inputMillis,'000'))" />
						<xsl:value-of select="$dateTime" />
					</xsl:matching-substring>
				</xsl:analyze-string>
			</xsl:when>
			<!-- Format: ddMMyyyyHHmmss -->
			<xsl:when test="matches($inputDateTime, '[0-9]+/[0-9]+/[0-9]+ [0-9]+:[0-9]+:[0-9]+$')">
				<xsl:analyze-string select="$inputDateTime"
					regex="([0-9]+)/([0-9]+)/([0-9]+) ([0-9]+):([0-9]+):([0-9]+)$">
					<xsl:matching-substring>
						<xsl:variable name="day" select="number(regex-group(1))" />
						<xsl:variable name="month" select="number(regex-group(2))" />
						<xsl:variable name="year" select="number(regex-group(3))" />
						<xsl:variable name="hours" select="number(regex-group(4))" />
						<xsl:variable name="minutes" select="number(regex-group(5))" />
						<xsl:variable name="seconds" select="number(regex-group(6))" />
						<xsl:variable name="dateTime"
							select="concat($year, '-', format-number($month, '00'), '-', format-number($day, '00'), ' ', format-number($hours, '00'), ':', format-number($minutes, '00'), ':', format-number($seconds, '00'), '.', format-number($inputMillis,'000'))" />
						<xsl:value-of select="$dateTime" />
					</xsl:matching-substring>
				</xsl:analyze-string>
			</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="dumpTestLogMessages">
		<xsl:param name="testItemsLogData" />
		<xsl:for-each select="$testItemsLogData//TestLogItem">
			<xsl:variable name="testEntryTimestamp">
				<xsl:call-template name="convertTc2XsdDateTime">
					<xsl:with-param name="inputDateTime" select="Time" />
					<xsl:with-param name="inputMillis" select="number(Time/@msec) mod 1000" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:value-of
				select="concat('[',$testEntryTimestamp, '] ** ', TypeDescription, ' ** : ', Message)" />
			<xsl:text>&#xa;</xsl:text>
			<xsl:if test="count(CallStack/CallStackItem) > 0">
				<xsl:text>  Call Stack:&#xa;</xsl:text>
				<xsl:for-each select="CallStack/CallStackItem">
					<xsl:text>    </xsl:text>
					<xsl:value-of select="concat(LineNo,': ')" />
					<xsl:if test="normalize-space(string(UnitName)) != ''">
						<xsl:value-of select="concat(UnitName,'.')" />
					</xsl:if>
					<xsl:value-of select="Test" />
					<xsl:text>&#xa;</xsl:text>
				</xsl:for-each>
			</xsl:if>
			<xsl:if test="normalize-space(string(AdditionalInfo)) != ''">
				<xsl:text>  Additional Info:&#xa;</xsl:text>
				<xsl:value-of select="replace(string(AdditionalInfo),'^','    ','m')"
					disable-output-escaping="yes" />
				<xsl:text>&#xa;</xsl:text>
			</xsl:if>
		</xsl:for-each>
	</xsl:template>
</xsl:stylesheet>