function LogRootObject(uri)
{
	var oXml = _load_XML(uri);
	if (oXml == null || oXml.documentElement == null)
	{
		var error_title = "Log data file cannot be loaded";
		var error_message = "Please make sure the file \"" + uri + "\" is in the log folder.";

		var color = "#BB0000";
		var deco = "padding:4px; border:1px solid " + color + ";";
		var font = "font-size:12px;";

		if (isOpera)
		{
			ver = parseInt(window.opera.version());
			if (ver >= 11 && m_providercell)
			{
				error_message = "You are unable to view log files, because your browser settings do not allow reading data from files.<br><br>" +
					"<b>To see the log, change the browser settings:</b><br>" +
					"1. Open the Opera configuration page: <a target='_blank' style='" + font + "' href='opera:config'>opera:config</a><br>" +
					"2. Type \"Allow File XMLHttpRequest\" in the Search box.<br>" +
					"3. Enable the \"Allow File XMLHttpRequest\" setting and click Save to apply the changes. (If Opera asks to restart, restart it).<br>" +
					"Now you can view the log file in Opera.";
			}
		}

		var p = navigator.userAgent.indexOf("Chrome");
		if (p > 0)
		{
			try { var loc = window.document.location.href; } catch (e) { }
			var isMHT = (loc.indexOf(".mht") == loc.length - 4);
			
			var ver = parseInt(navigator.userAgent.substring(p + 7));
			if (!isMHT && ver >= 5 && m_providercell)
			{
				error_message = "You are unable to view log files, because your browser settings do not allow reading data from files.<br><br>" +
					"<b>To see the log, change the browser settings:</b><br>" +
					"1. Open the properties of the Google Chrome shortcut. To do this, right-click the Chrome shortcut on the desktop or in the Windows menu and choose Properties from the context menu.<br>" +
					"2. Add the \" --allow-file-access-from-files\" command-line argument to the end of the Target text box.<br>" +
					"3. Click OK to close the Properties dialog and to save the changes.<br>" +
					"4. Restart Google Chrome and re-open the log file.";
			}
			else if (isMHT)
			{
				error_title = "Your web browser does not support the MHT (MHTML) format. The log file cannot be opened.";
				error_message = "To view the log, open the log file in a web browser that supports the MHT file format.";
			}
		}

		m_providercell.innerHTML =
			"<div style='" + font + deco + " background-color:" + color + "; color:white; font-weight:bold;'>" + error_title + "</div>" +
			"<div style='" + font + deco + " line-height:18px;'>" + error_message + "</div>"
		
		return;
	}

	fillLogNodeData(this, oXml.documentElement);
}

function LogDataObject(node)
{
	fillLogNodeData(this, node);
}

function ProviderObject(name, href, schemaType, status)
{
	this.name = name;
	this.href = href;
	this.schemaType = schemaType;
	this.status = status;
	this.children = new Array();
	this.empty = true;
}

function fillLogNodeData(obj, node)
{
	obj.name = (node.getAttribute("name") != null) ? node.getAttribute("name"): "";
	obj.status = (node.getAttribute("status") != null) ? parseInt(node.getAttribute("status")): 0;
	obj.href = "";
	obj.schemaType = "aqds:none";
	obj.children = new Array();
	obj.id = (node.getAttribute("id") != null) ? node.getAttribute("id"): "";
	obj.providers = [];
	obj.activeProviderName = "";

	var items = node.selectNodes("Provider");
	if (items != null)
	{
			for(var i = 0; i < items.length; i++)
			{
				var provider = (new ProviderObject(
				  (items[i].getAttribute("name") != null) ? items[i].getAttribute("name"): "",
				  (items[i].getAttribute("href") != null) ? items[i].getAttribute("href"): "", 
				  (items[i].getAttribute("schemaType") != null) ? items[i].getAttribute("schemaType"): "",
				  obj.status));

				if (obj.providers.unshift && provider.name.toLowerCase().indexOf("summary") >= 0)
					obj.providers.unshift(provider); // put summary first
				else if (obj.providers.length == 1 && obj.providers[0].schemaType == "aqds:tree" &&
					provider.schemaType == "aqds:table" && provider.name.toLowerCase().indexOf("performance counters") >= 0)
					obj.providers[0].children.push(provider);
				else
					obj.providers.push(provider);
			}
	}

	var items = node.selectNodes("LogData");
	if (items != null && items.length > 0)
	{
		for (var i = 0; i < items.length; i++)
		{
			obj.children.push(new LogDataObject(items[i]));
		}
	}

	obj.empty = obj.children.length == 0;
}

var logdata_js = true;