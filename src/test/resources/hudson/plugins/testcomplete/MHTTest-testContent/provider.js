var m_objProviderXml = null;
var m_objProviderSchema = null;

function ProviderLoad(element, flag)
{
	if (element.m_rootElement != null)
	{
	if (!flag && isIE5) { window.setTimeout("ProviderLoad(document.getElementById('" + element.id + "'), true)", 100); return; }
	provider_clear(element);
	}

	element.m_rootElement = window.document.createElement("TABLE");
	element.m_rootElement.className = "singleFrame";
	element.m_rootElement.cellSpacing = 0;
	element.m_rootElement.cellPadding = 0;
	element.m_rootElement.border = 0;
	element.m_rootElement.style.width = element.style.width;
	element.m_rootElement.style.height = element.style.height;
	
	var oBody = window.document.createElement("TBODY");
	element.m_rootElement.appendChild(oBody);
	
	var oTR = window.document.createElement("TR");
	oBody.appendChild(oTR);
	
	var oTD = window.document.createElement("TD");
	oTD.vAlign = "top";
	oTR.appendChild(oTD);
	
	var oDiv = window.document.createElement("DIV");
	oDiv.style.padding = 3;
	oTD.appendChild(oDiv);
	
	var oI = window.document.createElement("I");
	oI.innerText = "Loading...";
	oDiv.appendChild(oI);

	element.appendChild(element.m_rootElement);

	m_objProviderXml = _load_XML(element.src);
	if (m_objProviderXml != null)
	{
		var xmlns = changeFileExt(element.src, "xsd");
		m_objProviderSchema = _load_XML(xmlns);

		if (m_objProviderSchema != null)
			ProviderSchemaLoaded(element);
	}

	if (element.realSchemaType == "aqds:text")
		element.schemas = new Array("aqds:text");
	else
		element.schemas = new Array("aqds:tree", "aqds:table");
}

function provider_clear(element)
{
	if (element.m_rootElement == null)
		return;

	table_clear(element.m_rootElement);
	graph_clear(element.m_rootElement);
	text_clear(element.m_rootElement);

	element.removeChild(element.m_rootElement);
	element.m_rootElement = null;
}

function provider_GetInnerObjectClass(element, obj)
{
	if (element.realSchemaType == "aqds:table" || element.realSchemaType == "aqds:tree") 
	{
		obj.showCaption = true;
		table_setActive(obj);
		return "aqds_table";
	} 
	else if (element.realSchemaType == "aqds:graph") 
	{
		obj.showCaption = false;
		graph_setActive(obj);
		return "aqds_graph";
	} 
	else if (element.realSchemaType == "aqds:diagram") 
	{
		obj.showCaption = false;
		diagram_setActive(obj);
		return "aqds_diagram";
	} 
	else if (element.realSchemaType == "aqds:text") 
	{
		text_load(obj);
		return "aqds_text";
	} 
	else if (element.realSchemaType == "aqds:filescompare") 
	{
		text_files_compare(obj);
		return "aqds_files_compare";
	} 
	else 
	{
		return "";
	}
}

function ProviderSchemaLoaded(element)
{
	provider_clear(element);

	if (m_objProviderSchema.documentElement == null) 
		return;

	var rootElements = m_objProviderSchema.documentElement.selectNodes("xs:element");
	if (rootElements.length > 0)
	{
		var objRoot = rootElements[0];
		element.m_rootElement = window.document.createElement("DIV");
		element.appendChild(element.m_rootElement);

		element.m_rootElement.location = element.src;
		element.m_rootElement.id = "provider_div2_" + element.m_rootElement.uniqueID;

		element.m_rootElement.style.width = element.style.width;
		element.m_rootElement.style.height = element.style.height;

		if (element.realSchemaType == "aqds:text")
		{
			element.m_rootElement.textObject = new TextObject(m_objProviderXml, null, objRoot);
		}
		else if (element.realSchemaType == "aqds:filescompare")
		{
			element.m_rootElement.filesCompare = new FilesCompareObject(m_objProviderXml, null, objRoot);
		}
		else
		{
			var tableObj = new TableObject(m_objProviderXml, null, objRoot);
			if (element.childProviders.length)
			{
				var childSrc = element.childProviders[0].href;
				var childXml = _load_XML(childSrc);
				if (childXml != null)
				{
					var xmlns = changeFileExt(childSrc, "xsd");
					var childSchema = _load_XML(xmlns);
					if (childSchema != null)
					{
						var childElements = childSchema.documentElement.selectNodes("xs:element");
						if (childElements.length > 0)
						{
							tableObj.addColumn(element.childProviders[0].schemaType, childXml, childElements[0]);
							tableObj.columns[tableObj.columns.length-1].parent = null;
							tableObj.columns[tableObj.columns.length-1].syncRecords = true;
						}
					}
				}
			}
			element.m_rootElement.table = tableObj;
		}

		provider_GetInnerObjectClass(element, element.m_rootElement);
	}
}

var provider_js = true;