var m_providers = [];
var m_providerTabsDiv = null;
var m_treecell = null;
var m_providercell = null;
var m_RootLogData = null;
var m_rootnode = null;
var m_treediv = null;
var m_activenode = null;
var m_selectednode = null;
var m_treehead = null;
var m_treehead2 = null;
var m_treehidden = false;
var m_treetoolbar = null;
var treeHeadHeight = 20;
var treeHeadWidth = 21;
var treeToolbarHeight = 28;
var treeToolbarAtTop = false;
var treeToolbarCaptions = true;

function logtree_loadComponent(element, src)
{
	var cWidth = document.body.clientWidth - c_InnerPadding * 2;
	var cHeight = document.body.clientHeight - c_InnerPadding * 2;
	var cTreeWidth = Math.round(cWidth * 0.25) - 1;

	if (cHeight < 300) cHeight = 300;

	element.style.width = cWidth;
	element.style.height = cHeight;

	var oTable = document.createElement("TABLE");
	element.appendChild(oTable);
	element.rootTable = oTable;

	oTable.cellPadding = 0;
	oTable.cellSpacing = 0;
	oTable.border = 0;
	oTable.style.width = cWidth;
	oTable.style.height = cHeight;

	var oBody = document.createElement("TBODY");
	oTable.appendChild(oBody);
	
	var oTR = document.createElement("TR");
	oBody.appendChild(oTR);

	m_treecell = document.createElement("TD");
	m_treecell.style.width = cTreeWidth;
	m_treecell.vAlign = "top";
	m_treecell.noWrap = true;
	m_treecell.className = "noprint";
	oTR.appendChild(m_treecell);
	
	m_treehead = document.createElement("DIV");
	m_treehead.className = "singleFrame";
	m_treehead.style.width = cTreeWidth;
	m_treehead.style.height = (treeHeadHeight + (isIE ? -2 : 0)) + "px";
	m_treehead.style.borderBottom = "0px";
	m_treehead.id = "treehead";
	m_treecell.appendChild(m_treehead);
	
	m_treehead.innerHTML = "<div class='cellCaption'><div style='float:left'>Log Tree</div>" +
	  "<img src='hide.gif' onmousemove='this.src=\"hide1.gif\"' onmouseout='this.src=\"hide.gif\"' " +
	  "style='float:right; margin:1px 3px 3px 1px; cursor:pointer;' " +
	  "onclick='treeHeadBtnClick()' alt='Hide'></div>";
	
	m_treehead2 = document.createElement("DIV");
	m_treehead2.className = "singleFrame";
	m_treehead2.style.display = "none";
	m_treehead2.style.width = treeHeadWidth;
	m_treehead2.style.height = element.offsetHeight;
	m_treehead2.id = "treehead2";
	m_treecell.appendChild(m_treehead2);
	
	m_treehead2.innerHTML = "<img src='show.gif' onmousemove='this.src=\"show1.gif\"' " +
	  "onmouseout='this.src=\"show.gif\"' style='margin:3px; cursor:pointer;' " +
	  "onclick='treeHeadBtnClick()' alt='Show'>" +
	  "<br><img src='logtree.gif' style='margin:3px;'>";
	
	m_treediv = document.createElement("DIV");
	m_treediv.className = "singleFrame";
	m_treediv.style.width = cTreeWidth;
	m_treediv.style.height = element.offsetHeight - treeHeadHeight - treeToolbarHeight + (treeToolbarAtTop ? 0 : 1);
	m_treediv.style.borderTop = "0px";
	m_treediv.style.position = "absolute";
	m_treediv.style.left = "5px";
	m_treediv.style.top = (5 + treeHeadHeight + (treeToolbarAtTop ? treeToolbarHeight : 0)) + "px";
	m_treediv.id = "logtree";

	m_treediv.style.padding = 3;
	m_treediv.style.overflow = "auto";
	m_treecell.appendChild(m_treediv);

	m_treetoolbar = document.createElement("DIV");
	m_treetoolbar.className = "singleFrame";
	m_treetoolbar.style.width = cTreeWidth;
	m_treetoolbar.style.height = treeToolbarHeight;
	m_treetoolbar.style.position = "absolute";
	m_treetoolbar.style.left = "5px";
	m_treetoolbar.style.overflow = "hidden";
	m_treetoolbar.style.top = (treeToolbarAtTop ? treeHeadHeight : (element.offsetHeight - treeToolbarHeight)) + 5 + "px";
	m_treetoolbar.id = "logtree_toolbar";
	m_treecell.appendChild(m_treetoolbar);

	var btn_td = "<td style='border:1px solid #ACA899; cursor:pointer; white-space: nowrap;' onmouseover='this.style.backgroundColor=\"#C0D0F0\"' onmouseout='this.style.backgroundColor=\"white\"' onmousedown='return false' ";
	m_treetoolbar.innerHTML = "<table cellpadding=0 cellspacing=2 border=0><tr>" +
		btn_td + "onclick='logtree_ExpandAll(true)'> <img src='expand.gif' style='vertical-align:middle'" + (treeToolbarCaptions ? "> " : " title='") +"Expand All" + (treeToolbarCaptions ? "&nbsp;&nbsp;" : "'>") + "</td>" +
		btn_td + "onclick='logtree_ExpandAll(false)'> <img src='collapse.gif' style='vertical-align:middle'" + (treeToolbarCaptions ? "> " : " title='") +"Collapse All" + (treeToolbarCaptions ? "&nbsp;&nbsp;" : "'>") + "</td>" +
		btn_td + "onclick='logtree_GoToError(); if (window.event) window.event.cancelBubble = true;'> <img src='error.gif' style='margin:2px; vertical-align:middle'" + (treeToolbarCaptions ? "> " : " title='") +"Go to Next Error" + (treeToolbarCaptions ? "&nbsp;&nbsp;" : "'>") + "</td>" +
		"</tr></table>";

	var oTD = document.createElement("TD");
	oTD.style.width = 5;
	oTD.noWrap = true;
	oTD.className = "noprint";
	oTR.appendChild(oTD);
	
	m_providercell = document.createElement("TD");
	m_providercell.vAlign = "top";
	m_providercell.style.width = cWidth - cTreeWidth - 5;
	m_providercell.id = m_providercell.uniqueID;
	oTR.appendChild(m_providercell);

	element.doResize = function()
	{
		var cWidth = document.body.clientWidth - c_InnerPadding * 2;
		var cHeight = document.body.clientHeight - c_InnerPadding * 2;
		var cTreeWidth = Math.round(cWidth * 0.25) - 1;

		if (cHeight < 300) cHeight = 300;
		if (cWidth < 500) cWidth = 500;

		var tree_Width = m_treehidden ? treeHeadWidth : cTreeWidth;
		var prov_Width = cWidth - tree_Width - 5;
		var prov_Height = cHeight - (m_providerTabsDiv ? (m_providerTabsDiv.offsetHeight - 1) : 0);
		
		for (var i = 0; i < m_providers.length; i++)
		{
			if (m_providers[i].m_rootElement.doResize)
				m_providers[i].m_rootElement.doResize(prov_Width, prov_Height);
		}

		m_providercell.style.width = prov_Width;

		m_treecell.style.width = tree_Width;

		if (!m_treehidden)
		{
			m_treehead.style.width = tree_Width;
			m_treediv.style.width = tree_Width;
			m_treediv.style.height = cHeight - treeHeadHeight - (m_treetoolbar ? treeToolbarHeight - (treeToolbarAtTop ? 0 : 1) : 0);
			if (m_treetoolbar)
			{
				m_treetoolbar.style.width = tree_Width;
				if (!treeToolbarAtTop) m_treetoolbar.style.top = (cHeight - treeToolbarHeight + 5) + "px";
			}
		}
		else
			m_treehead2.style.height = cHeight;

		this.style.width = cWidth;
		this.style.height = cHeight;

		this.rootTable.style.width = cWidth;
		this.rootTable.style.height = cHeight;

		var m_provider = null;
		for (var i = 0; i < m_providers.length; i++)
		{
			if (m_providers[i].style.display == "none")
				continue;
				
			m_provider = m_providers[i];
			break;
		}

		var _obj = m_provider ? m_provider.m_rootElement : null;
		while (_obj != null)
		{
			if (_obj.m_dataTable) // Graph
				_obj = _obj.m_dataTable;

			if (_obj.rootDiv)
				table_UpdateColumnsPosition(_obj);

			_obj = _obj.m_NestedObject;
		}

	}

	logtree_TreeLoad(src);

	logtree_CheckToolbar(element);
	
	if (m_RootLogData.status == 2) // has error
		logtree_GoToError(true);

	if (isIE5 || isFF) // For IE5 & Firefox: resize to ensure correct log view
	{
		var pointer = element;
		window.setTimeout(function () { pointer.doResize(); }, 100);
	}
}

function logtree_CheckToolbar(element)
{
	var hasError = (m_RootLogData.status == 2);
	var isTree = false;
	for (var i = 0; i < m_RootLogData.children.length; i++)
		if (m_RootLogData.children[i].children.length > 0) { isTree = true; break }

	if (!hasError && !isTree)
	{
		m_treecell.removeChild(m_treetoolbar);
		m_treetoolbar = null;
		m_treediv.style.height = element.offsetHeight - treeHeadHeight;
		return;
	}

	var tbl = m_treetoolbar.getElementsByTagName("TABLE")[0];
	if (!hasError)
		tbl.rows[0].deleteCell(2);

	if (!isTree)
	{
		tbl.rows[0].deleteCell(1);
		tbl.rows[0].deleteCell(0);
	}
}

function logtree_ExpandNodeChildren(node, expand, level)
{
	var activate_root = false;
	for (var i = 0; i < node.children.length; i++)
	{
		var div = node.children[i].treeNode;

		if (!expand && level > 0 && (m_selectednode ? m_selectednode == div : m_activenode == div))
			activate_root = true;

		if (!div.childrenPrepared)
		{
			if (expand)
				logtree_expandNode(div, false);
			else
				continue;
		}

		if (div.expanded != expand)
			logtree_expandLogDataNode.apply(div.image);

		activate_root = activate_root || logtree_ExpandNodeChildren(node.children[i], expand, level + 1);
	}
	return activate_root;
}

function logtree_ExpandAll(expand)
{
	if (expand) logtree_expandNode(m_rootnode, false);
	if (logtree_ExpandNodeChildren(m_RootLogData, expand, 0))
		logtree_setActiveNode(m_rootnode);
}

function logtree_FindNextErrorLog(searchData)
{
	var node = searchData.logData;

	for (var i = 0; i < node.children.length; i++)
	{
		var child_node = node.children[i];
		var div = child_node.treeNode;

		searchData.logData = child_node;

		if (searchData.skip)
		{
			if (child_node == m_activenode.logData)
				searchData.skip = false;
			
			if (logtree_FindNextErrorLog(searchData))
				return true;
			
			continue;
		}

		searchData.skip = false;

		if (child_node.status == 2)
		{
			if (child_node.providers.length == 1)
			{
				var hasRedChildren = false;
				for (var j = 0; j < child_node.children.length; j++)
					if (child_node.children[j].status == 2) { hasRedChildren = true; break }

				if (!hasRedChildren)
				{
					logtree_setActiveNode(div);
					logtree_FindNextErrorMsg(true);
					return true;
				}
			}

			if (!div.childrenPrepared)
				logtree_expandNode(div, false);
		}

		if (logtree_FindNextErrorLog(searchData))
			return true;
	}

	return false;
}

function logtree_FindNextErrorMsg(fromTop)
{
	if (m_activenode && m_activenode.logData.providers.length == 1)
	{
		var table = m_providers[0].m_rootElement;
		if (table && table.findNextError && table.table && table.table.typeDescriptionColumnIndex)
			return table.findNextError(fromTop);
	}
	
	return false;
}

function logtree_GoToError(fromTop)
{
	text_clearSelection();
	if (!logtree_FindNextErrorMsg(fromTop))
	{
		var searchData = { logData: m_RootLogData, skip: m_activenode.logData != m_RootLogData };
		logtree_FindNextErrorLog(searchData);
	}
}

function treeHeadBtnClick()
{
	m_treehidden = !m_treehidden;
	m_treehead.style.display = m_treehidden ? "none" : "";
	m_treediv.style.display = m_treehidden ? "none" : "";
	m_treehead2.style.display = m_treehidden ? "" : "none";
	if (m_treetoolbar) m_treetoolbar.style.display = m_treehidden ? "none" : "";
	document.getElementById("logroot").doResize();
}

function logtree_TreeLoad(src)
{
	m_RootLogData = new LogRootObject(src);
	m_rootnode = logtree_createLogDataNode(m_treediv, m_RootLogData);
	logtree_setActiveNode(m_rootnode);
	logtree_expandNode(m_rootnode, true);
}

function logtree_setSelectedNode(node)
{
	if (m_selectednode != null)
	{
		m_selectednode.caption.style.backgroundColor = "";
		m_selectednode.caption.style.borderColor = "white";
	}
	
	m_selectednode = node;
	if (m_selectednode != null)
	{
		m_selectednode.caption.style.backgroundColor = "";
		m_selectednode.caption.style.borderColor = "#999999";
	}
	
	if (m_activenode != null)
	{
		m_activenode.caption.style.borderColor = "#CCCCCC";
	}
	
}

function logtree_setActiveNode(node)
{
	if (m_activenode != null)
	{
		m_activenode.caption.style.backgroundColor = "";
		m_activenode.caption.style.borderColor = "white";
	}
	
	if (m_selectednode != null)
	{
		m_selectednode.caption.style.backgroundColor = "";
		m_selectednode.caption.style.borderColor = "white";
	}
	m_selectednode = null;
	
	m_activenode = node;
	if (m_activenode != null)
	{
		m_activenode.caption.style.backgroundColor = "#CCCCCC";
		m_activenode.caption.style.borderColor = "#999999";
		
		logtree_expandParent(node);
		m_activenode.doActivate();
		logtree_prepareChildren(node);
	}
}

function logtree_expandParent(node)
{
	if (!node || !node.parentNode)
		return;

	var parent = node.parentNode.parentNode;
	if (parent && parent.logData && !parent.expanded)
	{
		logtree_expandParent(parent);
		logtree_expandNode(parent);
	}
}

function logtree_expandNode(oDiv, recursive)
{
	if (!oDiv.expanded && oDiv.image)
		logtree_expandLogDataNode.apply(oDiv.image);
}

function logtree_prepareChildren(oDiv)
{
	if (oDiv.childDiv == null)
	{
		var oChildDiv = document.createElement("DIV");
		oChildDiv.style.marginLeft = getScreenX(oDiv.caption) - getScreenX(oDiv.statusImage);
		oChildDiv.style.display = "none";
		oDiv.appendChild(oChildDiv);
		oDiv.childDiv = oChildDiv;
	}

	if (oDiv.childrenPrepared == false)
	{
		if (!oDiv.logData.empty)
			logtree_createLogDataTree(oDiv.childDiv, oDiv.logData, false);
		oDiv.childrenPrepared = true;
	}
}

function logtree_expandLogDataNode()
{
	var oDiv = this.ownerDiv; // this - node expand image
	
	roloverTreeImage(oDiv.image);

	logtree_prepareChildren(oDiv);

	if (oDiv.expanded == false)
	{
		if (!oDiv.logData.empty) 
		{
			oDiv.childDiv.style.display = "";
			oDiv.childDiv.style.width = "100%";
		}
		else
		{
			hideTreeImage(oDiv.image);
			oDiv.image.onclick = null;
		}

	} else 
	{
		oDiv.childDiv.style.display = "none";
	}
	oDiv.expanded = !oDiv.expanded;
}

function logtree_activateLogDataNode()
{
	var oDiv = this.ownerDiv; // this - node caption span
	logtree_setActiveNode(oDiv);
}

function logtree_createLogDataNode(parent, logData)
{
	var oDiv = document.createElement("DIV");
	parent.appendChild(oDiv);

	oDiv.childDiv = null;
	oDiv.logData = logData;
	oDiv.expanded = false;
	oDiv.childrenPrepared = false;
	if (logData.id) oDiv.id = logData.id;

	var oNoBr = document.createElement("NOBR");
	oDiv.appendChild(oNoBr);

	var oCaption = document.createElement("SPAN");
	oCaption.className = "treeNodeCaption";
	oCaption.innerText = logData.name;
	oCaption.ownerDiv = oDiv;
	oDiv.caption = oCaption;
	oDiv.caption.onclick = logtree_activateLogDataNode;
	
	oNoBr.appendChild(oCaption);

	//oCaption.style.width = oCaption.offsetWidth;

	if (!logData.empty)
	{
		oDiv.image = createTreeImage(false);
		oDiv.image.onclick = logtree_expandLogDataNode;
	} else {
		oDiv.image = createTreeImageDummy();
	}
	oDiv.image.ownerDiv = oDiv;
	oNoBr.insertBefore(oDiv.image, oDiv.caption);

	oDiv.statusImage = createTreeStateImage(logData.status);
	oNoBr.insertBefore(oDiv.statusImage, oDiv.caption);

	oDiv.doActivate = logtree_m_LogDataNode_Activate;
	
	return oDiv;
}

function logtree_m_LogDataNode_Activate()
{
	window.status = "Loading...";
	var logData = this.logData; // this - node div
	if (logData != null)
	{
		if ((logData.schemaType == null || logData.schemaType == "" || logData.schemaType == "aqds:none") && (logData.providers.length == 0))
		{
			logtree_expandNode(this, false);
			if (logData.children.length > 0) 
			{
				var nextDiv = logData.children[0].treeNode;
				if (nextDiv != null)
				{
					nextDiv.caption.click();
					logtree_setSelectedNode(this);
					return;
				}
			}
			
		}
		logtree_activateProvider(logData);
	}
	window.status = "Done";
}

function logtree_createLogDataTree(parentDiv, logData, createExpanded)
{
	for (var i = 0; i < logData.children.length; i++)
	{
		var oChildDiv = logtree_createLogDataNode(parentDiv, logData.children[i]);
		logData.children[i].treeNode = oChildDiv;
		
		if (createExpanded)
		{
			logtree_expandNode(oChildDiv, createExpanded);
		}
	}

}   

function logtree_loadProvider(node, update)
{
	var m_provider = m_providers[m_providers.length - 1];
	m_provider.realSchemaType = node.schemaType;
	m_provider.src = node.href;
	m_provider.childProviders = node.children;

	if (node.schemaType == "aqds:table" || node.schemaType == "aqds:tree"
	  || node.schemaType == "aqds:graph" || node.schemaType == "aqds:diagram"
	  || node.schemaType == "aqds:text" || node.schemaType == "aqds:filescompare")
	{
		m_provider.className = "aqds_provider";
		ProviderLoad(m_provider);
	}
	else if (node.schemaType == "aqds:picture")
	{
		m_provider.className = "aqds_picture";
	}
	else if (node.schemaType == "aqds:pictures")
	{
		m_provider.className = "aqds_pictures";
	}
	else {
		m_provider.className = "aqds_text";
                if (update)
			text_Load(m_provider);
		else
			text_load(m_provider);
	}
}

function logtree_activateProvider(node)
{
	var m_provider = null;
	if (node.providers.length == 1 && m_providers.length == 1)
		m_provider = m_providers[0];

	if (m_provider != null)
	{
		for (var i = 0; i < m_provider.schemas.length; i++)
		{
			if (node.schemaType == m_provider.schemas[i])
			{
				logtree_loadProvider(node, true);
				return;
			}
		}
	}

	if (m_providerTabsDiv)
	{
		m_providerTabsDiv.tabsObject.dispose();
		m_providerTabsDiv.tabsObject = null;
		m_providercell.removeChild(m_providerTabsDiv);
		m_providerTabsDiv = null;
	}
	
	for (var i = 0; i < m_providers.length; i++)
	{
		provider_clear(m_providers[i]);
		m_providercell.removeChild(m_providers[i]);
	}
	
	m_providers = [];

	var tabsId = "providerTabsDiv";
	if (node.providers.length > 1)
	{
		var oDiv = document.createElement("DIV");
		oDiv.id = tabsId;
		oDiv.innerText = _nbsp;
		oDiv.style.height = "21px";
		oDiv.style.marginTop = "-22px";
		oDiv.zIndex = 100;
		m_providercell.appendChild(oDiv);
		m_providerTabsDiv = oDiv;

		var tabs = new TabsObject(tabsId, logtree_onProviderTabSelect, node, node.activeProviderName, true, true);

		m_providerTabsDiv.tabsObject = tabs;
	}

	var firstItem = null;
	for (var i = 0; i < node.providers.length; i++)
	{
		if (firstItem)
			firstItem.style.display = "none";
	
		m_provider = document.createElement("DIV");
		m_provider.id = "provider_div_" + m_provider.uniqueID;

		m_provider.style.width = "100%";
		m_provider.style.height = "100%";

		m_providercell.insertBefore(m_provider, m_providerTabsDiv);

		m_providers[i] = m_provider;

		logtree_loadProvider(node.providers[i], false);

		if (firstItem)
			m_provider.style.display = "none";
		else
			firstItem = m_provider;

		if (tabs)
			tabs.addItem(node.providers[i].name, m_provider.id);
	}

	if (tabs)
		tabs.render();
}

function logtree_onProviderTabSelect(tab, prevTab)
{
	doWindowResize();

	tab.tabsObject.parent.activeProviderName = tab.tabsObject.names[tab.tabItemIndex];
	m_arrowKeysCapturedBy = (tab.tabItem.m_rootElement && tab.tabItem.m_rootElement.captureKeys ? tab.tabItem.m_rootElement : null);
}

function logtree_openNode(id)
{
	var node = document.getElementById(id);
	if (node == null)
		return false;

	logtree_setActiveNode(node);

	return false;
}

function logtree_openSibling(id)
{
	if (m_providerTabsDiv && m_providerTabsDiv.tabsObject)
		m_providerTabsDiv.tabsObject.activateTabByName(id);

	return false;
}

function logtree_openChild(index)
{
	if (!m_activenode || !m_activenode.logData || m_activenode.logData.empty) return;
	if (m_activenode.logData.children.length <= index) return;
	logtree_prepareChildren(m_activenode);
	logtree_setActiveNode(m_activenode.logData.children[index].treeNode);

	return false;
}

function onDocumentClick(e)
{
	if (e == null) e = window.event;

	var column = m_providercell.m_filteredColumn;
	if (column != null)
	{
		var target = e.target;
		if (target == null)
			target = e.srcElement;

		if (target == column.filterImage) return;

		var filter = column.realTD.m_dataTable.parentNode.m_filterDiv;
		var parent = target;
		while (parent != null)
		{
			if (parent == filter)
				return;
			parent = parent.offsetParent;
		}
		caption_hideFilter(column);
	}
	
	m_arrowKeysCapturedBy = null;
	
	var obj = e.target || e.srcElement;
	while (obj)
	{
		if (obj.captureKeys)
		{
			m_arrowKeysCapturedBy = obj;
			break;
		}
		obj = obj.parentElement || obj.parentNode;
	}
}

var m_arrowKeysCapturedBy = null;

function onDocumentKeyDown(e)
{
	if (!m_arrowKeysCapturedBy) return;

	if (!e) e = window.event;
	if (e.keyCode >= 33 && e.keyCode <= 40)
	{
		var element = m_arrowKeysCapturedBy;
		if (element && element.onCapturedKeys && element.onCapturedKeys(element, e.keyCode))
		{
			if (e.preventDefault) e.preventDefault();
			return false;
		}
	}
	
	return true;
}

if (document.addEventListener)
{
	document.addEventListener("click", onDocumentClick, true);
	document.addEventListener("keydown", onDocumentKeyDown, true);
}
else
{
	document.attachEvent("onclick", onDocumentClick);
	document.attachEvent("onkeydown", onDocumentKeyDown);
}

function showLog()
{
	var clientWidth = document.body.clientWidth;
	if (clientWidth > 0 && typeof(aqds_js) != 'undefined' && typeof(caption_js) != 'undefined' && typeof(graph_js) != 'undefined' && typeof(logdata_js) != 'undefined' &&
	  typeof(picture_js) != 'undefined' && typeof(provider_js) != 'undefined' && typeof(table_js) != 'undefined' && typeof(text_js) != 'undefined')
		logtree_loadComponent(document.getElementById("logroot"), "root.xml");
	else
		window.setTimeout(showLog, 50);
}

if (isSupported)
	window.setTimeout(showLog, 100);
