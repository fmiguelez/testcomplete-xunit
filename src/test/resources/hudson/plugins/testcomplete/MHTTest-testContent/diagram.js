var c_diagramFlashMovie = "Pie3D.swf";

var m_diagram_uniqueID = 0;

function diagram_setActive(element)
{
	element.innerHTML = "";

	diagram_CreateRootFrame(element);
	diagram_CreateGraph(element);
}

function diagram_CreateRootFrame(element)
{
	element.schemas = new Array("aqds:diagram");
	element.m_firstUpdate = true;

	var hasNestedData = getHasNestedData(element) && (getNestedDataIsPlain(element) == false);

	element.m_rootElement = document.createElement("TABLE");
	element.m_rootElement.className = "singleFrame";
	element.m_rootElement.cellSpacing = 0;
	element.m_rootElement.cellPadding = 0;
	element.m_rootElement.border = 0;

	element.m_rootElement.style.width = element.offsetWidth;
	element.m_rootElement.style.height = "100%";

	element.appendChild(element.m_rootElement);

	// Create a table caption
	var oHead = document.createElement("THEAD");
	element.m_rootElement.appendChild(oHead);
	
	var oTR = document.createElement("TR");
	oHead.appendChild(oTR);
	
	var oTD = document.createElement("TD");
	oTR.appendChild(oTD);

	oTD.className = "cellCaption"; 
	oTD.colSpan = 2;
	oTD.innerHTML = element.table.caption;

	// Create table body
	var oTBody = document.createElement("TBODY");
	element.m_rootElement.appendChild(oTBody);
	
	oTR = document.createElement("TR");

	var c = element.table.nestedDataCount;
	var percent = 100 / (c + 1) - 5;
	if (c == 0) percent = 100;
	element.m_rootElement.m_percent = percent;

	oTBody.appendChild(oTR);

	oTD = document.createElement("TD");
	oTR.appendChild(oTD);

	element.m_graphPanel = document.createElement("DIV");
	element.m_graphPanel.style.width = Math.round(element.offsetWidth / 4) - c_InnerPadding * 2 - 2;
	element.m_graphPanel.style.height = "100%";
	
	element.m_graphPanel.style.margin = 5;
	oTD.appendChild(element.m_graphPanel);

	var oTableTD = document.createElement("TD");
	oTR.appendChild(oTableTD);

	element.detailsDiv = null;

	if (hasNestedData == true)
	{
		// Create details placeholder
		oTR = document.createElement("TR");
		oTBody.appendChild(oTR);
		
		oTD = document.createElement("TD");
		oTD.className = "detailsBody";
		oTD.colSpan = 2;
		oTD.style.verticalAlign = "top";
		oTR.appendChild(oTD);
		
		var oDiv = document.createElement("DIV");
		oDiv.style.width = "100%";
		oDiv.style.height = element.offsetHeight * (100 - percent) / 100 - 21;
		oDiv.style.padding = 5;
		oDiv.style.overflow = "auto";
		oTD.appendChild(oDiv);

		element.detailsDiv = oDiv;
	}

	var oTable = document.createElement("DIV");

	oTable.location = element.location;
	oTable.showCaption = false;
	oTable.detailsDiv = element.detailsDiv;
	oTable.className = "aqds_table";
	oTableTD.appendChild(oTable);

	oTable.style.width = element.offsetWidth * 0.75;
	if (percent == 100) 
		oTable.style.height = element.offsetHeight - 21;
	else
		oTable.style.height = element.offsetHeight * percent / 100;

	oTable.table = element.table;

	element.m_dataTable = oTable;

	table_setActive(oTable);

	element.doResize = function(_Width, _Height)
	{
		var _percent = this.m_rootElement.m_percent;

		var details_Height = 0;
		if (_percent == 100)
			details_Height = _Height - 21;
		else
			details_Height = Math.round(_Height * (100 - _percent) / 100) - 21;
		var details_Width = _Width - 2;

		var dt_Width = Math.round(_Width * 0.75);
		var dt_Height = 0;
		if (_percent == 100)
		{
			dt_Height = _Height - 21;
			if (isIE) dt_Height -= 2;
		}
		else
			dt_Height = _Height - details_Height - 21;

		this.m_dataTable.doResize(dt_Width, dt_Height, details_Width, details_Height);

		var ChartWidth = _Width - dt_Width - c_InnerPadding * 2 - 2;
		var ChartHeight = dt_Height - 50;

		ChartHeight = Math.round(ChartWidth < ChartHeight ? ChartWidth: ChartHeight);
		if (ChartHeight < 0) ChartHeight = ChartWidth;

		if (isIE || this.m_graph.SetVariable)
		{
			this.m_graph.SetVariable("_root.chartWidth", ChartWidth.toString());
			this.m_graph.SetVariable("_root.chartHeight", (ChartHeight + 20).toString());
			this.m_graph.Rewind();
			this.m_graph.Play();
		}

		this.m_graph.width = ChartWidth;
		this.m_graph.height = ChartHeight;

		if (isOpera)
		{
			this.m_graph.style.width = ChartWidth;
			this.m_graph.style.height = ChartHeight;
		}

		this.m_graph_div.style.width = ChartWidth;
		this.m_graph_div.style.height = ChartHeight;

		this.abscissSelector.style.width = ChartWidth - 70;
		this.ordinateSelector.style.width = ChartWidth - 70;

		this.m_graphPanel.style.width = ChartWidth;
		this.m_graphPanel.style.height = dt_Height - c_InnerPadding * 2;

		this.m_rootElement.style.width = _Width;

		this.style.width = _Width;
		this.style.height = _Height;
	}
}

function diagram_CreateGraph(element)
{
	var ChartWidth = element.m_graphPanel.offsetWidth;
	//ChartWidth -= (c_InnerPadding * 2);
	var ChartHeight = element.m_graphPanel.parentNode.offsetHeight - 50;

	ChartHeight = Math.round(ChartWidth < ChartHeight ? ChartWidth: ChartHeight);
	if (ChartHeight < 0)
		ChartHeight = ChartWidth;

	var oCenter = document.createElement("CENTER");
	element.m_graphPanel.appendChild(oCenter);

	element.m_graph_div = document.createElement("DIV");
	element.m_graph_div.style.width = ChartWidth;
	element.m_graph_div.style.height = ChartHeight;
	element.m_graph_div.style.margin = 0;
	element.m_graph_div.style.border = 0;

	oCenter.appendChild(element.m_graph_div);

	m_diagram_uniqueID ++;
	element.m_graph_id = "diagram_" + m_diagram_uniqueID;

	element.m_graph_obj = new FusionCharts(c_diagramFlashMovie, element.m_graph_id, ChartWidth, ChartHeight, false, false, "white");

	if (element.m_graph_obj == null) 
	  return;

	var oTable = document.createElement("TABLE");
	oTable.cellPadding = 0;
	oTable.cellSpacing = 0;
	oTable.border = 0;
	oTable.style.width = "100%";
	oCenter.appendChild(oTable);

	var oTBody = document.createElement("TBODY");
	oTable.appendChild(oTBody);
	var oTR = document.createElement("TR");
	oTBody.appendChild(oTR);
	var oTD = document.createElement("TD");
	oTR.appendChild(oTD);
	oTD.innerHTML = "Informational:&nbsp;";
	
	var oAbsciss = document.createElement("SELECT");
	oAbsciss.style.width = ChartWidth - 70;
	oAbsciss.onchange = diagram_abscissChanged;
	oAbsciss.topControl = element;
	
	oTD = document.createElement("TD");
	oTD.width = "100%";
	oTR.appendChild(oTD);
	oTD.appendChild(oAbsciss);
	
	oTR = document.createElement("TR");
	oTBody.appendChild(oTR);
	var oTD = document.createElement("TD");
	oTR.appendChild(oTD);
	oTD.innerHTML = "Value:&nbsp;";

	var oOrdinate = document.createElement("SELECT");
	oOrdinate.style.width = ChartWidth - 70;
	oOrdinate.onchange = diagram_ordinateChanged;
	oOrdinate.topControl = element;

	oTD = document.createElement("TD");
	oTR.appendChild(oTD);
	oTD.appendChild(oOrdinate);

	element.abscissSelector = oAbsciss;
	element.ordinateSelector = oOrdinate;

	for (var i = 0; i < element.table.columns.length; i++)
	{
		var oColumn = element.table.columns[i];
		if (oColumn.informational == true)
		{
			var oOption = document.createElement("OPTION");
			oOption.value = oColumn.name;
			oOption.columnObject = oColumn;
			oOption.innerText = oColumn.caption;
			oAbsciss.appendChild(oOption);
			if (oColumn.defaultInfo == true)
			{
				oAbsciss.selectedIndex = oAbsciss.options.length - 1;
			}
		}
	}

	if (isOpera && isOpera8)
	{
		element.abscissSelector.disabled = true;
		element.ordinateSelector.disabled = true;
	}

	diagram_synchronizeOrdinate(element);

	if (isOpera) diagram_updateAllTables(element);

	diagram_regenerateGraph(element);

}

function diagram_updateAllTables(element)
{
	var dt = element.m_dataTable;
	if (!dt) return;

	if (dt.m_NestedObject)
		diagram_updateAllTables(dt.m_NestedObject);

	dt.rootDiv.style.height = dt.offsetHeight;
	dt.rootDiv.tablePane.style.height = dt.offsetHeight - c_InnerPadding * 2;
	table_UpdateColumnsPosition(dt);
}

function diagram_synchronizeOrdinate(element)
{
	var selectedColumn = element.abscissSelector.selectedIndex == -1 ? null: element.abscissSelector.options[element.abscissSelector.selectedIndex].columnObject;
	
	var oOrdinates = element.ordinateSelector;
	while (oOrdinates.firstChild != null) 
	  oOrdinates.removeChild(oOrdinates.firstChild);
	  
	if (selectedColumn == null)
	  return;
	  
	var combinations = selectedColumn.cmbDiagram == null ? "": selectedColumn.cmbDiagram;
	var columnNames = combinations.split(";");
	for(var i = 0; i < columnNames.length; i++)
	{
		var columnName = columnNames[i];
		for(var j = 0; j < element.table.columns.length; j++)
		{
			var oColumn = element.table.columns[j];
			if (oColumn.typeName == "aqds:int" || oColumn.typeName == "aqds:float")
			{
				if (oColumn.name == columnName)
				{
					var oOption = document.createElement("OPTION");
					oOption.value = oColumn.name;
					oOption.columnObject = oColumn;
					oOption.innerText = oColumn.caption;
					oOrdinates.appendChild(oOption);

					if (oColumn.defaultValue == true)
					{
						oOrdinates.selectedIndex = oOrdinates.options.length - 1;
					}
				}
			}
		}
	}
}

function replaceCommaWithDot(value)
{
	return value.replace(",", ".");
}

function diagram_regenerateGraph(element)
{
	var abscissColumn = element.abscissSelector.selectedIndex == -1 ? null: element.abscissSelector.options[element.abscissSelector.selectedIndex].columnObject;
	var ordinateColumn = element.ordinateSelector.selectedIndex == -1 ? null: element.ordinateSelector.options[element.ordinateSelector.selectedIndex].columnObject;

	if (abscissColumn != null && ordinateColumn != null)
	{
		var xmlValue = "<graph pieYScale='80' animation='0' pieRadius='" + Math.round(4 * element.m_graph_div.offsetWidth / 11) + "' xaxisname='" + abscissColumn.caption + "' yaxisname='" + ordinateColumn.caption + "' " +
			"lineColor='#FF0000' lineThickness='3' bgColor='#FFFFFF' showBorder='0'>\n";

		var rows = element.table.xmlData.documentElement.selectNodes(element.table.getPath() + "[@pid=\"-1\"]");
		var _skipCategories = Math.round(rows.length / 10);
		if (_skipCategories < 1) _skipCategories = 1;
		for (var i = 0; i < rows.length; i++)
		{
			var oRow = rows[i];
			var columns = oRow.selectNodes(abscissColumn.name);
			var nodeValue = (columns[0].firstChild != null) ? _get_Text(columns[0].firstChild): "";
			if (nodeValue == "")
				nodeValue = "No Value";

			columns = oRow.selectNodes(ordinateColumn.name);
			var nodeValue2 = replaceCommaWithDot((columns[0].firstChild != null) ? _get_Text(columns[0].firstChild): "");
			
			var setValue = "<set value='" + nodeValue2 + "' name='" + nodeValue + "'/>\n";
			xmlValue += setValue;
		}
		
		xmlValue += "</graph>\n";

		if (element.m_firstUpdate)
		{
			element.m_graph_obj.addVariable("dataXML", xmlValue);
			element.m_graph_obj.render(element.m_graph_div);

			element.m_graph = getChartFromId(element.m_graph_id);
			element.m_graph.m_parent = element;

			element.m_firstUpdate = false;
		} else {
			element.m_graph_obj.setDataXML(xmlValue);

		}

	} else {
	
		// Reset graph
	}
}

function diagram_abscissChanged()
{
	diagram_synchronizeOrdinate(this.topControl);
	diagram_regenerateGraph(this.topControl);
}

function diagram_ordinateChanged()
{
	diagram_regenerateGraph(this.topControl);
}
