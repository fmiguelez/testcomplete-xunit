// setCapture for Mozilla & Opera
if (window.HTMLElement)
{
	var element = HTMLElement.prototype;

	var custom_capture = false;
	if (typeof element.setCapture == "undefined")
	{
		custom_capture = true;

		var capture = ["click", "mousedown", "mouseup", "mousemove", "mouseover", "mouseout"];

		element.setCapture = function()
		{
			var self = this;
			var flag = false;
			this._capture = function(e)
			{
				if (flag) return;
				flag = true;

				var event = document.createEvent("MouseEvents");
				event.initMouseEvent(e.type, e.bubbles, e.cancelable, e.view, e.detail,
					e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey,
					e.shiftKey, e.metaKey, e.button, e.relatedTarget);
				self.dispatchEvent(event);
				flag = false;
			};
			for (var i = 0; i < capture.length; i++)
				window.addEventListener(capture[i], this._capture, true);
		};

		element.releaseCapture = function()
		{
			for (var i = 0; i < capture.length; i++) 
				window.removeEventListener(capture[i], this._capture, true);
			this._capture = null;
		};
	}

	element.click = function()
	{
		var event = document.createEvent("MouseEvents");
		event.initMouseEvent("click", false, true, document.defaultView, 
			1, 0, 0, 0, 0, false, false, false, false, 0, this);
		this.dispatchEvent(event);
	}

	if (element.__defineGetter__ && typeof(element.uniqueID) == "undefined")
	{
		element.__defineGetter__("uniqueID", function()
		{
			if (!arguments.callee.count) arguments.callee.count = 0;
			var _uniqueID = "moz_id" + arguments.callee.count++;
			this.__defineGetter__("uniqueID", function() { return _uniqueID } );
			return _uniqueID;
		} );
	}

	if (isFF && element.__defineGetter__ && typeof(element.innerText) == "undefined")
	{
		element.__defineGetter__("innerText", function() { return this.textContent; } );
		element.__defineSetter__("innerText", function(value) { this.textContent = value; } );
	}

}


function _do_select_nodes(node, xPath, list)
{
	var isComplex = true;
	var isParam = false;
	var attrName = null;
	var attrValue = null;

	var p0 = xPath.indexOf("/");
	if (p0 < 0)
	{
		isComplex = false;
		p0 = xPath.length;
	}
	else if (p0 == 0)
	{
		_do_select_nodes(node.parentNode, xPath.substring(1), list);
		return;
	}
	var name = xPath.substring(0, p0);

	var p = xPath.indexOf("[@");
	if (p > 0 && p < p0)
	{
		isParam = true;
		var p2 = p + 2;  var p3 = xPath.indexOf("=\"");
		attrName = xPath.substring(p2, p3);
		attrValue = xPath.substring(p3 + 2, xPath.indexOf("\"]"));
		name = name.substring(0, p);
	}

	var children = node.childNodes;
	var length = children.length;
	for (var i = 0; i < length; i++)
	{
		var child = children[i];
		if (child.nodeName != name)
			continue;

		var found = true;
		if (isParam)
		{
			found = false;
			if (child.getAttribute(attrName)) 
				if (attrValue == "*" || child.getAttribute(attrName) == attrValue)
					found = true;
		}
		if (!found) continue;

		if (isComplex)
			_do_select_nodes(child, xPath.substring(p0+1), list);
		else
			list.push(child);
	}
}

var _xpe = null;

if (window.Element && typeof(Element.prototype.selectNodes) == "undefined")
{
	if (typeof(XPathEvaluator) != "undefined")
	{
		_xpe = new XPathEvaluator();

		Element.prototype.selectNodes = function (xPath)
		{
			var nsResolver = _xpe.createNSResolver(this.ownerDocument == null ? this.documentElement : this.ownerDocument.documentElement);
			var result = _xpe.evaluate(xPath, this, nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

			var found = new Array();
			if (result != null)
			{
				var res;
				while (res = result.iterateNext())
					found.push(res);
			}
			return found;
		}
	}
	else
	{
		Element.prototype.selectNodes = function (xPath)
		{
			var list = new Array();
			_do_select_nodes(this, xPath, list);
			return list;
		}
	}
}


// For IE 5 & IE 5.5
m_PointerCursor = "pointer";

if (isIE5 || isIE55)
{
	m_PointerCursor = "hand";
	if (isIE5)
		Array.prototype.push = function(value) { this[this.length] = value; }
}

String.prototype.trim = function() 
{
	return this.replace(/(^\s*)|(\s*$)/g, "");
}

function _execute(link)
{
	var msg_unableToRun = "Unable to run the Diff utility:\n" + link;
	var msg_unsupported = msg_unableToRun + "\n\n" +
		"This action is only available from Internet Explorer that displays unpacked (non-MHT) log.\n" +
		"You may need to enable the \"Initialize and script ActiveX controls not marked as safe for scripting\" option.";

	if (typeof window.ActiveXObject == "undefined")
	{
		alert(msg_unsupported);
		return false;
	}

	cmd = link.replace(new RegExp("&quot;", "g"), "\"");

	var loc = isIE ? "probably.mht" : "";
	try { loc = window.document.location.href; } catch (e) { }
	var isMHT = (loc.indexOf(".mht") == loc.length - 4);
	loc = unescape(correctLocation(loc, "").replace("file:///", ""));
	if (loc.indexOf("file:") == 0) { loc = loc.substring(5).replace(new RegExp("/", "g"), "\\"); }

	var index = 0;
	var p1 = -1;
	var p2 = -1;
	while (index < 10)
	{
		p1 = cmd.indexOf("\"", p2 + 1); if (p1 < 0) break;
		p2 = cmd.indexOf("\"", p1 + 1); if (p2 < 0) break;
		var path = cmd.substring(p1 + 1, p2);

		var correctPath = (index > 0 && path.indexOf("\\") < 0);

		if (index == 0 || !isMHT)
		{
			try
			{
				var fso = new ActiveXObject("Scripting.FileSystemObject");
				var exists = fso.FileExists(correctPath ? loc + path : path);
				fso = null;
			}
			catch (ex)
			{
				alert(msg_unsupported);
				return false;
			}

			if (!exists)
			{
				alert(msg_unableToRun + "\n\nFile " + path + " does not exists.");
				return false;
			}
		}

		if (correctPath)
		{
			if (isMHT)
			{
				alert(msg_unsupported);
				return false;
			}

			cmd = cmd.substring(0, p1 + 1) + loc + cmd.substring(p1 + 1);
			p2 += loc.length;
		}
		
		index++;
	}

	var shell = new ActiveXObject("WScript.Shell");
	shell.Run(cmd);
	shell = null;
	return false;
}

function _load_XML(url)
{
	var oXml;

	if (window.ActiveXObject || isIE11) {
		oXml = new ActiveXObject("Microsoft.XMLDOM");
		oXml.async = false;
		oXml.load(url);
	}
	else if (window.XMLHttpRequest)
	{
		if (isOpera) url = url.toLowerCase();

		var loader = new XMLHttpRequest();
		try
		{
			loader.open("GET", url, false);
		}
		catch(e)
		{
		        try { netscape.security.PrivilegeManager.enablePrivilege ("UniversalBrowserRead")} catch (e) {}
			loader.open("GET", url, false);
		}
		if (url.substring(url.length - 3) == "xsd" && typeof(loader.overrideMimeType) != 'undefined')
			loader.overrideMimeType("text/xml");
		try
		{
			loader.send(null);
		}
		catch(e)
		{
			return null;
		}
		oXml = loader.responseXML;
	}

	if (oXml == null || oXml.documentElement == null)
		return null;

	return oXml;
}

function _load_Text(url)
{
	if (window.ActiveXObject || isIE11)
	{
		var loader = new ActiveXObject("MSXML2.XMLHTTP");
		loader.open("GET", url, false);
		loader.send(null);
		return loader.responseText;
	}
	else if (window.XMLHttpRequest)
	{
		if (isOpera) url = url.toLowerCase();

		var loader = new XMLHttpRequest();
		try
		{
			loader.open("GET", url, false);
		}
		catch(e)
		{
		        try { netscape.security.PrivilegeManager.enablePrivilege ("UniversalBrowserRead")} catch (e) {}
			loader.open("GET", url, false);
		}
		try
		{
			loader.send(null);
		}
		catch(e)
		{
			return null;
		}

		return loader.responseText;
	}
	else
		return "Cannot read file " + url;
}

function _get_Text(node) 
{
	var text = node.textContent;
	if (typeof text != "undefined")
		return text;
	
	switch (node.nodeType)
	{
		case 3:
		case 4:
			return node.nodeValue;
		case 1:
		case 11:
			var _innerText = "";
			var _childCount = node.childNodes.length;
			for (var i = 0; i < _childCount; i++) {
				var _value = node.childNodes[i].nodeValue || _get_Text(node.childNodes[i]);
				if (_value != null) _innerText += _value;
			}
			return _innerText;
	}
	return "";
}

function getScreenX(obj)
{
	if (obj.getBoundingClientRect)
		return obj.getBoundingClientRect().left;

    if (isIE)
    {
	if (obj != null)
	{
		var offset = obj.offsetLeft;
		var offsetParent = obj.offsetParent;
		var priorParent = null;
		while (offsetParent != null)
		{
			offset += offsetParent.offsetLeft;
			priorParent = offsetParent;
			offsetParent = offsetParent.offsetParent;
		}
		if (priorParent != null)
		{
			offset += priorParent.clientLeft;
		}

		return offset;
	} else {

		return 0;
	}
    }
    else
    {
	var left = 0;
	if (obj) do
	{
		if (isSafari && obj.nodeName == "TABLE") left ++;
		left += obj.offsetLeft;
		if (!obj.offsetParent) break;
		obj = obj.offsetParent;
	} while (true);
	if (isSafari) left--;
	return left;
    }
}

function getScreenY(obj)
{
	if (obj.getBoundingClientRect)
		return obj.getBoundingClientRect().top;

    if (isIE)
    {
	if (obj != null)
	{
		var offset = obj.offsetTop;
		var offsetParent = obj.offsetParent;
		var priorParent = null;
		while (offsetParent != null)
		{
			offset += offsetParent.offsetTop;
			priorParent = offsetParent;
			offsetParent = offsetParent.offsetParent;
		}
		if (priorParent != null)
		{
			offset += priorParent.clientTop;
		}

		return offset;
	} else {
	
		return 0;
	}
    }
    else
    {
	var top = 0;
	if (obj) do
	{
		if (isSafari && obj.nodeName == "TABLE") top ++;
		top += obj.offsetTop;
		if (!obj.offsetParent) break;
		obj = obj.offsetParent;
	} while (true);
	if (isSafari) top--;
	return top;
    }
}


function getIsComplexType(typeName)
{
	return (typeName == "aqds:table") || (typeName == "aqds:diagram") || (typeName == "aqds:text")
		|| (typeName == "aqds:graph") || (typeName == "aqds:picture") || (typeName == "aqds:pictures");
}

function getIsTableType(typeName)
{
	return (typeName == null || typeName == "aqds:table" || typeName == "aqds:graph" || typeName == "aqds:diagram" || typeName == "aqds:pictures");
}

function getColumnDataIsPlain(typeName)
{
	return (typeName != "aqds:table" && typeName != "aqds:graph" && typeName != "aqds:diagram");
}

function TableObject(xmlData, parent, element)
{
	this.parent = parent;
	this.element = element;
	this.xmlData = xmlData;
	this.getPath = TableObjectGetPath;
	this.topRecord = "-1";
	this.nestedDataCount = 0;

	this.caption = this.element.getAttribute("caption");
	this.name = this.element.getAttribute("name");
	this.typeName = (this.element.getAttribute("type") == null) ? "aqds:table": this.element.getAttribute("type");
	this.isPlainData = getColumnDataIsPlain(this.typeName);
	
	this.addColumn = function(typeName, xmlData, oColumnElement)
	{
			var i = this.columns.length;
			if (getIsTableType(typeName))
			{
				// Complex type
				if (typeName != "aqds:pictures") { var obj = this; while (obj) { obj.nestedDataCount ++; obj = obj.parent; } }

				this.columns[i] = new TableObject(xmlData, this, oColumnElement);
			} else {

				// Simple type
				this.columns[i] = new ColumnObject(this, oColumnElement);
				if (typeName == "aqds:text")
				{
					if (text_count > 1)
						this.columns[i] = new TableObject(xmlData, this, oColumnElement);
					this.columns[i].textObject = new TextObject(xmlData, this, oColumnElement);
				}
				if (this.columns[i].name == "TypeDescription")
					this.typeDescriptionColumnIndex = (i + 1);
			}
			this.columns[i].filterList = new Array();
			this.columns[i].filtered = false;
			this.columns[i].isComplex = getIsComplexType(typeName);
	}
	
	var recordElements = this.element.selectNodes("xs:complexType/xs:sequence/xs:element");
	if (recordElements.length > 0)
	{
		var oRecordElement = recordElements[0];
		this.recordName = oRecordElement.getAttribute("name");

		var columnElements = oRecordElement.selectNodes("xs:complexType/xs:sequence/xs:element");
		this.columns = new Array();

		var text_count = 0;
		for (var i = 0; i < columnElements.length; i++)
		{
			// treat several text columns as complex type
			var oColumnElement = columnElements[i];
			var typeName = oColumnElement.getAttribute("type");
			if (typeName == "aqds:text")
				text_count++;
		}

		if (text_count > 1) { var obj = this; while (obj) { obj.nestedDataCount ++; obj = obj.parent; } }

		for (var i = 0; i < columnElements.length; i++)
		{
			var oColumnElement = columnElements[i];
			var typeName = oColumnElement.getAttribute("type");
			this.addColumn(typeName, xmlData, oColumnElement);
		}
	}
}

function ColumnObject(parent, element)
{
	this.parent = parent;
	this.element = element;

	this.caption = this.element.getAttribute("caption");
	this.name = this.element.getAttribute("name");
	this.typeName = this.element.getAttribute("type");
	this.absciss = this.element.getAttribute("absciss") == "True";
	this.informational = this.element.getAttribute("informational") == "True";
	this.sort = this.element.getAttribute("sort") == "True";
	this.combinations = this.element.getAttribute("combinations");
	this.cmbDiagram = this.element.getAttribute("cmbDiagram");
	this.defaultOrdinate = this.element.getAttribute("defaultOrdinate") == "True";
	this.defaultAbsciss = this.element.getAttribute("defaultAbsciss") == "True";
	this.defaultValue = this.element.getAttribute("defaultValue") == "True";
	this.defaultInfo = this.element.getAttribute("defaultInfo") == "True";

	this.isImage = (this.typeName == "aqds:image");
	this.isNumeric = (this.typeName == "aqds:float" || this.typeName == "aqds:int");
	this.isDateTime = (this.typeName == "aqds:datetime");
	this.isPlainData = getColumnDataIsPlain(this.typeName);
}

function TableObjectGetPath()
{
	return getTablePath(this);
}

function getTablePath(table)
{
	if (table == null)
	{
		return "";
	}
	else
	{
		var parentTable = table.parent;
		if (parentTable != null)
			return getTablePath(parentTable) + "[@id=\"" + table.topRecord + "\"]/" + table.name + "/" + table.recordName
		else
			return "/" + table.name + "/" + table.recordName;
	}
}

function doWindowResize()
{
	var oLogRoot = document.getElementById("logroot");
	if (oLogRoot && oLogRoot.doResize) oLogRoot.doResize();
}

function correctLocation(basePath, name)
{
	for (var i = basePath.length - 1; i >= 0; i--)
	{
		var _char = basePath.charAt(i);
		if ((_char == "\\") || (_char == "/"))
		{
			name = basePath.substring(0, i + 1) + name;
			break;
		}
	}
	if (isOpera) name = name.toLowerCase();
	return name;
}

function changeFileExt(fileName, newExt)
{
	for (var i = fileName.length - 1; i >= 0; i--)
	{
		var _char = fileName.charAt(i);
		if (_char == ".") 
		{
			return fileName.substring(0, i + 1) + newExt;
		}
	}
	return fileName;
}


function createTreeImage(opened)
{
	var oImage = document.createElement("img");
	oImage.src = opened ? "minus.gif": "plus.gif";
	oImage.width = 9;
	oImage.height = 9;
	oImage.border = 0;
	oImage.style.marginRight = 3;
	oImage.style.marginLeft = 5; 
	oImage.style.marginBottom = 2; //1
	oImage.style.cursor = m_PointerCursor;
	oImage.opened = opened;
	oImage.active = true;
	return oImage;
}

function createTreeImageDummy()
{
	var oImage = document.createElement("img");
	oImage.src = "null.gif";
	oImage.width = 9;
	oImage.height = 9;
	oImage.border = 0;
	oImage.style.marginRight = 3;
	oImage.style.marginLeft = 5;
	oImage.style.marginBottom = 1;
	oImage.opened = false;
	oImage.active = false;
	return oImage;
}

function roloverTreeImage(img)
{
	img.opened = !img.opened;
	if (img.active == true)
		showTreeImage(img);
}

function hideTreeImage(img)
{
	img.active = false;
	img.src = "null.gif";
}

function showTreeImage(img)
{
	img.active = true;
	img.src = img.opened ? "minus.gif" : "plus.gif";
}

function hideTreeImageComplete(img)
{
	img.active = false;
	img.width = 0;
	img.height = 0;
	img.src = "null.gif";
}

function createTreeStateImage(state)
{
	var oImage = document.createElement("img");
	if (state == 1) {
		oImage.src = "warn.gif";
	} else if (state == 2) {
		oImage.src = "error.gif";
	} else {
		oImage.src = "ok.gif";
	}
	oImage.width = 16;
	oImage.height = 16;
	oImage.border = 0;
	oImage.style.position = "relative";
	oImage.style.top = 2;
	return oImage;
}

function getObjectWidth(obj)
{
	return (obj == null) ? 0: obj.offsetWidth;
}

function getColumnTypeIsSuppressed(typeName)
{
	return false;
}

function getHasNestedData(element)
{
	if (element.table != null)
	{
		for (var i = 0; i < element.table.columns.length; i++)
		{
			var oColumn = element.table.columns[i];
			//if (getColumnTypeIsSuppressed(oColumn.typeName))
			//  continue;
			  
			if (oColumn.isComplex)
				return true;
		}
	}
	return false;
}

function getNestedDataIsPlain(element)
{
	if (element.table != null)
	{
		var text_count = 0;
		for (var i = 0; i < element.table.columns.length; i++)
		{
			var oColumn = element.table.columns[i];
			//if (getColumnTypeIsSuppressed(oColumn.typeName))
			//  continue;

			if (!oColumn.isPlainData)
				return false;

			if (oColumn.typeName == "aqds:text")
			{
				text_count++;
				if (text_count > 1)
					return false;
			}
		}
	}
	return true;
}

FusionCharts = function(swf, id, w, h)
{
	if (!document.getElementById) return;
	
	this.params = new Object();
	this.variables = new Object();
	this.attributes = new Array();
	
	if (swf)
	{
		var loc = isIE ? "probably.mht" : "";
		try { loc = window.document.location.href; } catch (e) { }
		if (loc.indexOf(".mht") == loc.length - 4)
			swf = "http://localhost/" +  swf;
		this.setAttribute("swf", swf);
	}
	if (id) this.setAttribute("id", id);
	if (w) this.setAttribute("width", w);
	if (h) this.setAttribute("height", h);
	
	this.addParam("quality", "high");
	
	this.addVariable("chartWidth", w);
	this.addVariable("chartHeight", h);
}

FusionCharts.prototype = {
	setAttribute: function(name, value) {
		this.attributes[name] = value;
	},
	getAttribute: function(name) {
		return this.attributes[name];
	},
	addParam: function(name, value) {
		this.params[name] = value;
	},
	getParams: function() {
		return this.params;
	},
	addVariable: function(name, value) {
		this.variables[name] = value;
	},
	getVariable: function(name) {
		return this.variables[name];
	},
	getVariables: function() {
		return this.variables;
	},
	getVariablePairs: function() {
		var variablePairs = new Array();
		var key;
		var variables = this.getVariables();
		for (key in variables)
			variablePairs.push(key +"="+ variables[key]);
		return variablePairs;
	},
	getSWFHTML: function() {
		var swfNode = "";
		if (navigator.plugins && navigator.mimeTypes && navigator.mimeTypes.length) { 
			// netscape plugin architecture
			swfNode = '<embed type="application/x-shockwave-flash" src="'+ this.getAttribute('swf') +'" width="'+ this.getAttribute('width') +'" height="'+ this.getAttribute('height') +'"  ';
			swfNode += ' id="'+ this.getAttribute('id') +'" name="'+ this.getAttribute('id') +'" ';
			var params = this.getParams();
			 for(var key in params){ swfNode += [key] +'="'+ params[key] +'" '; }
			var pairs = this.getVariablePairs().join("&");
			 if (pairs.length > 0){ swfNode += 'flashvars="'+ pairs +'"'; }
			swfNode += '/>';
		} else { // PC IE
			swfNode = '<object id="'+ this.getAttribute('id') +'" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+ this.getAttribute('width') +'" height="'+ this.getAttribute('height') +'">';
			swfNode += '<param name="movie" value="'+ this.getAttribute('swf') +'" />';
			var params = this.getParams();
			for(var key in params) {
			 swfNode += '<param name="'+ key +'" value="'+ params[key] +'" />';
			}
			var pairs = this.getVariablePairs().join("&");
			if(pairs.length > 0) {swfNode += '<param name="flashvars" value="'+ pairs +'" />';}
			swfNode += "</object>";
		}
		return swfNode;
	},
	setDataXML: function(strDataXML) {
		var chartObj = getChartFromId(this.getAttribute("id"));
		chartObj.SetVariable("_root.isNewData", "1");
		chartObj.SetVariable("_root.newData", strDataXML);
		chartObj.TGotoLabel("/", "JavaScriptHandler");
	},
	render: function(elementId) {
		var n = (typeof elementId == "string") ? document.getElementById(elementId) : elementId;
		n.innerHTML = this.getSWFHTML();
		return true;
	}
}

function getChartFromId(id)
{
	if (window.document[id]) {
		return window.document[id];
	}
	if (!isIE) {
		if (document.embeds && document.embeds[id])
			return document.embeds[id];
	} else {
		return document.getElementById(id);
	}
}

function TextObject(xmlData, parent, element)
{
	this.parent = parent;
	this.element = element;
	this.xmlData = xmlData;
	this.nestedDataCount = 0;

	this.caption = this.element.getAttribute("caption");
	this.name = this.element.getAttribute("name");
	this.typeName = (this.element.getAttribute("type") == null) ? "aqds:text": this.element.getAttribute("type");

	var recordElements = this.element.selectNodes("xs:complexType");
	if (recordElements.length > 0)
	{
		var oRecordElement = recordElements[0];
		this.textFormat = oRecordElement.getAttribute("textformat");
		this.recordType = oRecordElement.getAttribute("type");
	}
}

function FilesCompareObject(xmlData, parent, element)
{
	this.parent = parent;
	this.element = element;
	this.xmlData = xmlData;
	this.nestedDataCount = 0;
	this.files = null;

	this.caption = this.element.getAttribute("caption");
	this.name = this.element.getAttribute("name");
	this.typeName = (this.element.getAttribute("type") == null) ? "aqds:text": this.element.getAttribute("type");

	var recordElements = this.element.selectNodes("xs:complexType/xs:sequence/xs:element");
	if (recordElements.length > 0)
	{
		var oRecordElement = recordElements[0];
		this.recordName = oRecordElement.getAttribute("name");

		if (xmlData)
			this.files = xmlData.documentElement.selectNodes("/" + this.name + "/" + this.recordName);
	}
}

function TabsObject(elementId, onselect, parent, initialActiveTabName, atBottom, showBorder)
{
	this.elementId = elementId;
	this.items = [];
	this.names = [];
	this.activeTab = null;
	this.parent = parent;
	this.onselect = onselect;
	this.initialActiveTabName = initialActiveTabName;
	this.atBottom = atBottom;
	this.showBorder = showBorder;
	
	this.dispose = function()
	{
		this.parent = null;
		this.activeTab = null;
		for (var i = 0; i < this.items.length; i++)
		{
			var tab = this.getTabByIndex(i);
			tab.tabsObject = null;
			tab.tabItem = null;
		}
	}

	this.addItem = function(name, itemId)
	{
		this.names.push(name);
		this.items.push(itemId);
	}

	this.render = function()
	{
		var element = document.getElementById(this.elementId);
		var itemCount = this.items.length;
		if (!element || itemCount == 0) return;

		var posMain = (this.atBottom ? "bottom" : "top");
		var posOther = (this.atBottom ? "top" : "bottom");

		var html = "<table cellpadding=0 cellspacing=0 border=0 " + (this.showBorder ? " class='singleFrame'" : "") + 
			" style='width:100%; background-color:#CCCCCC; padding-" + posMain + ":2px;" + (this.showBorder ? " border-" + posOther + ": 0px;" : "") + "'><tr>";

		for (var i = 0; i < itemCount; i++)
		{
			if (itemCount > 1)
				html += "<td style='width:4px; text-indent:0px;'><img src='null.gif' style='width:4px; height:1px;'></td>";

			html += "<td><div id='" + this.elementId + "_tab" + i + "' " +
				"style='text-indent:0px; padding-left:8px; padding-right:8px; padding-" + posMain + ":2px; padding-" + posOther + ":" + (itemCount > 1 ? "1" : "2") + "px; " +
				"white-space:nowrap; color:#444444; margin-" + posMain + ":1px; " +
				(itemCount > 1 ? " cursor:pointer; background-color:#DDDDDD; border-" + posMain + ":1px solid #CCCCCC;" : "") + "'";

			if (itemCount > 1)
			{
				html += " onmousemove=\"this.tabsObject.hoverTab(this, true)\" onmouseout=\"this.tabsObject.hoverTab(this, false)\"";
				html += " onclick=\"this.tabsObject.activateTab(this); if (window.event) window.event.cancelBubble = true;\"";
			}
			html += ">" + this.names[i] + "</div></td>";
		}
		html += "<td style='width:100%'></td></tr></table>";
		element.innerHTML = html;

		var tabToActivate = null;
		for (var i = 0; i < itemCount; i++)
		{
			var tab = this.getTabByIndex(i);
			if (!tab) continue;

			tab.tabsObject = this;
			tab.tabItem = document.getElementById(this.items[i]);
			tab.tabItemIndex = i;

			tab.remove = function()
			{
				this.tabItem.parentNode.removeChild(this.tabItem);
				this.tabsObject.items.splice(this.tabItemIndex, 1);
				this.tabsObject.names.splice(this.tabItemIndex, 1);
				this.tabsObject.render();
			}

			if (itemCount > 1 && i > 0)
				tab.tabItem.style.display = "none";

			if (i == 0 || this.names[i] == this.initialActiveTabName)
				tabToActivate = tab;
		}

		if (itemCount > 1 && tabToActivate)
			this.activateTab(tabToActivate);
	}

	this.getTabByIndex = function(index)
	{
		return document.getElementById(this.elementId + "_tab" + index);
	}

	this.hoverTab = function(tab, active)
	{
		if (tab.tabsObject.activeTab == tab) return;
		tab.style.color = (active ? "black" : "#444444");
	}

	this.activateTabByName = function(tabName)
	{
		if (!this || !this.items || !this.items.length) return;

		for (var i = 0; i < this.names.length; i++)
			if (this.names[i] == tabName)
				return this.activateTabByIndex(i);
	}

	this.activateTabByIndex = function(index)
	{
		if (!this || !this.items || !this.items.length || this.items.length <= index) return;

		var tab = this.getTabByIndex(index);
		return this.activateTab(tab);
	}

	this.activateTab = function(tab)
	{
		if (this.activeTab == tab) return;

		var prevTab = this.activeTab;
		if (prevTab)
		{
			prevTab.style.backgroundColor = "#DDDDDD";
			prevTab.style.color = "#444444";
			prevTab.style.cursor = "pointer";
			if (this.atBottom)
			{
				prevTab.style.paddingTop = "1px";
				prevTab.style.borderBottom = "1px solid #CCCCCC";
			}
			else
			{
				prevTab.style.paddingBottom = "1px";
				prevTab.style.borderTop = "1px solid #CCCCCC";
			}
			prevTab.tabItem.style.display = "none";
		}

		this.activeTab = tab;
		tab.style.backgroundColor = "white";
		tab.style.color = "black";
		tab.style.cursor = "default";
		if (this.atBottom)
		{
			tab.style.paddingTop = "2px";
			tab.style.borderBottom = "0px solid #CCCCCC";
		}
		else
		{
			tab.style.paddingBottom = "2px";
			tab.style.borderTop = "0px solid #CCCCCC";
		}
		tab.tabItem.style.display = "";

		if (this.onselect)
			this.onselect(tab, prevTab);
	}
}

var aqds_js = true;