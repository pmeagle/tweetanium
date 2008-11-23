Appcelerator.UI.registerUIComponent('control','slidetree',
{
	activeTrees: {},
	pageData:{},
	listeners:{},
	
	/**
	 * The attributes supported by the controls. This metadata is 
	 * important so that your control can automatically be type checked, documented, 
	 * so the IDE can auto-sense the widgets metadata for autocomplete, etc.
	 */
	getAttributes: function()
	{
		var T = Appcelerator.Types;
		
		return [
			{
				'name': 'theme',
				'optional': true,
				'description': 'name of theme to use for this control',
				'type': T.identifier,
				'defaultValue':'basic'
			},
			{
				'name': 'title',
				'optional': true,
				'description': 'title of tree',
				'type': T.identifier,
				'defaultValue':'No Title'
			},

			{
				'name': 'height',
				'optional': true,
				'description': 'height of tree container',
				'type': T.identifier,
				'defaultValue':'330px'
			},

			{
				'name': 'width',
				'optional': true,
				'description': 'width of tree container',
				'type': T.identifier,
				'defaultValue':'300px'
			},
			{
				'name': 'rowHeight',
				'optional': true,
				'description': 'heigt of tree rows',
				'type': T.identifier,
				'defaultValue':'40px'
			},
			{
				'name': 'fillEmpty',
				'optional': true,
				'description': 'fill empty rows with row class',
				'type': T.identifier,
				'defaultValue':true
			},
			
			{
				'name': 'data',
				'optional': true,
				'description': 'JSON data for initial population',
				'type': T.identifier,
				'defaultValue':null
			}
		];
	},
	/**
	 * The version of the control. This will automatically be corrected when you
	 * publish the component.
	 */
	getVersion: function()
	{
		// leave this as-is and only configure from the build.yml file 
		// and this will automatically get replaced on build of your distro
		return '3.0.0';
	},
	/**
	 * The control spec version.  This is used to maintain backwards compatability as the
	 * Widget API needs to change.
	 */
	getSpecVersion: function()
	{
		return 1.0;
	},
	click: function(id,parameters,data,scope,version)
    {
		// TODO: FIGURE OUT WHY FRAMEWORK IS REQUIRING THIS DEF
    },

	getConditions: function()
	{
		return ['click'];
	},
	
	/**
	 *	Populate using the data from value action
	 */
	value:function(id,params,data,scope,version,attrs,direction,action)
	{		
		var d = Appcelerator.Compiler.findParameter(attrs,'property');
		this._initialize(id,d);
	},

	/**
	 *	set node in existing model
	 */
	setNode:function(id,params,data,scope,version,attrs,direction,action)
	{		
		if (!attrs)	$E('required attributes missing in addNode action.  you must specify both a row and a page value');	
		
		// need to get node row and node page
		var row = Appcelerator.Compiler.findParameter(attrs,'row');
		var page = Appcelerator.Compiler.findParameter(attrs,'page');
		var d = Appcelerator.Compiler.findParameter(attrs,'property');

		if (page == null || row == null || d == null)
		{
			$E('required attributes missing in addNode action.  you must specify a row, a page, and a property value');
			return
		}
		
		// set cache
		this._cachePageData(id,d,page,row);
		
		// update page
		this._buildPage(id,d,0)
		
	},
	
	/**
	 *	remove node in existing model
	 */
	removeNode:function(id,params,data,scope,version,attrs,direction,action)
	{		
		if (!attrs)	$E('required attributes missing in addNode action.  you must specify both a row and a page value');	
		
		// need to get node row and node page
		var row = Appcelerator.Compiler.findParameter(attrs,'row');
		var page = Appcelerator.Compiler.findParameter(attrs,'page');

		if (page == null || row == null)
		{
			$E('required attributes missing in addNode action.  you must specify a row, a page, and a property value');
			return
		}
		this.pageData[id][page][row] = null;
	},

	getActions: function()
	{
		return ['value','removeNode','setNode']
	},
	/**
	 * This is called when the control is loaded and applied for a specific element that 
	 * references (or uses implicitly) the control.
	 */
	build: function(element,options)
	{
		var theme = options['theme'] || Appcelerator.UI.UIManager.getDefaultTheme('tree')
		var prefix = 'tree_' + theme;
		
		// container
		var container = document.createElement('div');
		container.id = element.id + '_tree';
		container.style.width = options['width'];
		container.style.overflowX = 'hidden';
		container.className = prefix + "_container";

		// how much to move left and right
		var moveX = parseInt(options['width']);
		
		// record tracking vars
		this.activeTrees[element.id] = {}
		this.activeTrees[element.id].width = moveX
		this.activeTrees[element.id].theme = prefix;
		this.activeTrees[element.id].options = options;
		this.activeTrees[element.id].currentPage = 0;
		this.activeTrees[element.id].totalPages = 0;
		this.pageData[element.id] =[];
		
		// the header - we stick stuff in here 
		var html = '<div id="'+element.id+'_header_container" class="'+prefix+'_header_container"  style="width:'+options['width']+'"></div>';
				
		container.innerHTML = html;
		element.appendChild(container);

		// if data has been passed in - then process
		if (options['data']!=null)
		{
			this._initialize(element.id,options['data']);
			
		}
		Appcelerator.Core.loadTheme('control','tree',theme,element,options);	
	},
	
	_initialize: function(id,d)
	{
		if (d)
		{				
			// see if we've been called before
			if (this.activeTrees[id].totalPages != 0)
			{
				new Effect.Move($(id + "_header_container"),
					{x:(this.activeTrees[id].width * this.activeTrees[id].currentPage),duration:0.5});

				// reset vars
				this.activeTrees[id].currentPage = 0;	
				this.activeTrees[id].totalPages = 0;
				this.pageData[id] =[];
				Appcelerator.Compiler.destroy($(id + "_header_container"),true);
				Appcelerator.Util.ServiceBroker.removeListener(this.listeners[id]);
			}
					
			// store data
			this._cachePageData(id,d,0);

			// build initial page
			this._buildPage(id,d,0);
			
			var self = this;
						
			// listen for page changes and rebuild pages 
			this.listeners[id] = $MQL(id + "_tree_shift",function(type,data,datatype,from)
			{
				var page = self.activeTrees[id].currentPage;
				if (data.dir == "left")
				{
					self.activeTrees[id].currentPage++
					self._buildPage(id,self.pageData[id][self.activeTrees[id].currentPage][data.row], self.activeTrees[id].currentPage);
				}
				else
				{
					self.activeTrees[id].currentPage--;
				}
				
				// move container
				var move = (data.dir=='left')?-(self.activeTrees[id].width):self.activeTrees[id].width;
				new Effect.Move($(id + "_header_container"),{x:move,duration:0.5});

				// fire condition
				Appcelerator.Compiler.fireCustomCondition(id, 'click', {'id': id, 'row':data.row,'dir':data.dir,'page':page,'targetPage':self.activeTrees[id].currentPage});
			});		
		}
		
		// adjust container width based on total # pages
		var parent = $(id + "_header_container");
		parent.style.width = (parseInt(this.activeTrees[id].options['width']) * this.activeTrees[id].totalPages) + "px";
		
	},

	/** 
	 *	Build an invidiual page
	 */
	_buildPage: function(id,data,pageNbr)
	{
		var parent = $(id + "_header_container");
		var prefix = this.activeTrees[id].theme;
		var options = this.activeTrees[id].options;
		var html ='';
		var rowCount = parseInt(options['height'])/(parseInt(options['rowHeight']));
		
		// if page doesn't exist - create
		var page = $(id + "_page_" + pageNbr);
		var addPage = false;
		if (!page)
		{
			page = document.createElement('div');
			page.id = id + "_page_" + pageNbr;
			page.style.width = options['width'];
			page.className = prefix + "_page";
			addPage = true;
		}
		
		//
		// if not first page, then add classes for detail
		//		
		if (pageNbr != 0)
		{
			html += '<div class="'+prefix+'_header '+prefix+'_header_detail" >';
			var title = (data[0].title)?data[0].title:options['title'];
			html += '<div class="'+prefix+'_title" id="'+id+'_'+pageNbr+'_title">' + title + '</div>';			
			html+='<div class="'+prefix+'_back_button" on="click then l:'+id+'_tree_shift[dir=right]"></div>';
		}
		else
		{
			html += '<div class="'+prefix+'_header" >';
			html += '<div class="'+prefix+'_title" id="'+id+'_'+pageNbr+'_title">' + options['title'] + '</div>';						
		}
		html += '</div>';
		
		// add content container
		html += '<div class="'+prefix+'_content_container" style="height:'+options['height']+';overflow:auto">';
		
		//
		// build data rows
		//
		for (var i=0;i<data.length;i++)
		{
			var row = data[i];
			
			if (row.children)
			{
				html += this._buildRow(id,true,row,pageNbr,i);
			}
			else
			{
				html += this._buildRow(id,false,row,pageNbr);
			}
		}

		//
		// add empty filler rows if applicable
		// 
		if (!row.template && options['fillEmpty']==true)
		{
			var fillerRows = Math.floor(rowCount - data.length);
			for (var i=1; i<fillerRows;i++)
			{
				html += this._buildRow(id,false,{},pageNbr);
			}			
		}
		
		html += '</div></div>';
		page.innerHTML = html
		Appcelerator.Compiler.dynamicCompile(page);
		if (addPage) parent.appendChild(page);
		
	},	
	
	/** 
	 *	Build data rows
	 */
	_buildRow: function(id,clickable,rowData,pageNbr,row)
	{
		var html ='';
		var prefix = this.activeTrees[id].theme;
		var options = this.activeTrees[id].options;
		
		//
		// if template just add HTML
		//
		if (rowData.template)
		{
			var myTemplate = new Template($(rowData.template).innerHTML);
			
			html += '<div>' + myTemplate.evaluate(rowData.data) + '</div>';
		}
		//
		// otherwise, it's a normal data row
		//
		else
		{
			// add detail class if not first page
			var detailClass = (pageNbr != 0)? prefix + "_item_detail":'';
			
			if (clickable == true)
			{
				html += '<div class="'+prefix+'_item '+detailClass+'" on="click then l:'+id+'_tree_shift[dir=left,row='+row+']" style="height:'+options['rowHeight']+';line-height:'+options['rowHeight']+'">';
			}
			else
			{
				html += '<div class="'+prefix+'_item '+detailClass+'"  style="height:'+options['rowHeight']+';line-height:'+options['rowHeight']+'">';			
			}
			html += '<div class="'+prefix+'_item_left">';

			// add icon if present
			if (rowData.icon)
			{
				html+= '<img class="'+prefix+'_item_icon" src="'+rowData.icon+'"/>';
			} 

			html += ((rowData.data)?rowData.data:'') + '</div>';
			html += '<div class="'+prefix+'_item_right">';

			// if children add child indicators
			if (rowData.children)
			{
				if (rowData.children.length == 1)
				{
					html += '<span class="'+prefix+'_item_more"></span>';
				}	
				else
				{
					html += '<span class="'+prefix+'_item_count">('+rowData.children.length+')</span>';					
				}			
			}

			html += '</div></div>';			
			
		}
		return html;
	},
	
	// store message data into big array
	_cachePageData: function(id,data,page,row)
	{
		// create page if not exist
		if (!this.pageData[id][page])
		{
			this.pageData[id][page] = new Array();			
		}
		
		// after first row, we need to track rows as well
		if (page !=0)
		{
			this.pageData[id][page][row] = new Array();
		}
		for (var i=0;i<data.length;i++)
		{
			var d = data[i]
			if (page == 0)
			{
				this.pageData[id][page][i] = d;				
			}
			else
			{
				this.pageData[id][page][row][i] = d;
			}
			if (d.children)
			{
				this._cachePageData(id,d.children,(page + 1), i)
			}
		}
		this.activeTrees[id].totalPages++;
		
	}
	
});
