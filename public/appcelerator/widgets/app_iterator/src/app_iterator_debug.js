
/*
 * Copyright 2006-2008 Appcelerator, Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. 
 */



Appcelerator.Widget.Iterator =
{
	getName: function()
	{
		return 'appcelerator iterator';
	},
	getDescription: function()
	{
		return 'iterator widget';
	},
	getVersion: function()
	{
		return '__VERSION__';
	},
	getSpecVersion: function()
	{
		return 1.0;
	},
	getAuthor: function()
	{
		return 'Jeff Haynie';
	},
	getModuleURL: function ()
	{
		return 'http://www.appcelerator.org';
	},
	isWidget: function ()
	{
		return true;
	},
	getWidgetName: function()
	{
		return 'app:iterator';
	},
	getAttributes: function()
    {
		var T = Appcelerator.Types;
        return [{name: 'on', optional: true, type: T.onExpr,
		         description: "Used to execute the iterator"},
                {name: 'items', optional: true, type: T.json,
				 description: "Literal (or template-replaced) JSON array to iterate over"},
                {name: 'property', optional: true, type: T.identifier},

                {name: 'rowEvenClassName', optional: true, type: T.cssClass},
                {name: 'rowOddClassName', optional: true, type: T.cssClass},
                {name: 'table', optional: true, defaultValue: 'false', type: T.bool},
                {name: 'width', optional: true, defaultValue: '100%', type: T.cssDimension},
                {name: 'headers', optional: true, defaultValue: ',', type: T.commaSeparated},
				{name: 'headerids', optional: true, defaultValue: ',', type: T.commaSeparated},
				{name: 'headerstyles', optional: true, defaultValue: ',', type: T.commaSeparated},
				{name: 'rowOn', optional: true, defaultValue: '', type: T.identifier},
                {name: 'cellspacing', optional: true, defaultValue: '0', type: T.cssDimension},
                {name: 'selectable', optional: true, type: T.bool}];
    },

	getActions: function()
	{
		return ['execute'];
	},	
	execute: function(id,parameterMap,data,scope)
	{
		var compiled = parameterMap['compiled'];
		var propertyName = parameterMap['property'];
		var items = parameterMap['items'];

		var table = parameterMap['table'];
		var width = parameterMap['width'];
		var headers = parameterMap['headers'];
		var headerids = parameterMap['headerids'];
		if (headerids && headerids!='')
			headerids = headerids.split(',');
		var headerstyles = parameterMap['headerstyles'];
		if (headerstyles && headerstyles!='')
			headerstyles = headerstyles.split(',');
		var selectable = parameterMap['selectable'];
		var array = null;

		if (!compiled)
		{
			compiled = eval(parameterMap['template'] + '; init_'+id);
			parameterMap['compiled'] = compiled;
		}

		if (items) 
		{
			data = items.evalJSON() || [];
		}

		if (propertyName)
		{
			array = Object.getNestedProperty(data,propertyName) || [];
		}
		else
		{
			array = data;
		}

		var html = '';

		if (!array)
		{
			html = compiled(data);
		}
		else
		{
			if (table)
			{				
				var i=0;
				html+='<table width="'+width+'" cellspacing="'+parameterMap['cellspacing']+'"><tr>';
				headers.each(function(h)
				{
					var id='';
					var style=''
					if (headerids)
						id=' id="'+headerids[i]+'"';
					if (headerstyles)
						style=' style="'+headerstyles[i]+'"';
					html+='<th'+style+id+'>'+h+'</th>';
					i++;
				});
				html+='</tr>';
			}
         	// this is in the case we pass in an object instead of 
			// an array, make it an array of length one so we can iterate
			// !Object.isArray(array) fails in some cases so we don't use it (it's poorly implemented)
			if (array.length != 0 && array[0] == undefined)
			{
				array = [array];
			}
			for (var c = 0, len = array.length; c < len; c++)
			{
				var o = array[c];
				if(typeof o != "object")
				{
					o = {'iterator_value': o};
				}
				o['iterator_index']=c;
				o['iterator_length']=len;
				o['iterator_odd_even']=(c%2==0)?'even':'odd';
				if (table)
				{
					if (o['iterator_odd_even'] == 'odd')
						o['iterator_row_class'] = parameterMap['rowOddClassName'];
					else
						o['iterator_row_class'] = parameterMap['rowEvenClassName'];
				}
				/* escape out the "'" so that works in IE */
				for (var idx in o)
				{
					if (typeof o[idx] == 'string')
					{
						o[idx] = o[idx].replace(/'/,'\u2019');
					}
				}
				html += compiled(o);
			}
			if (table)
			{
				html+='</table>';
			}
		}
		var element = $(id);
		if (selectable)
		{
			element.setAttribute('selectable',selectable);
		}

        Appcelerator.Compiler.destroyContent(element);
		element.innerHTML = Appcelerator.Compiler.addIENameSpace(html);
		Appcelerator.Compiler.dynamicCompile(element);
	},
	compileWidget: function(params) 
	{
		// no message payload to pass for data,
		// maybe we should plumb the triggering message of a dynamic compile through?
        this.execute(params['id'], params, null, '');
	},
	buildWidget: function(element, parameters)
	{
		parameters['table'] = parameters['table'] == 'true';
		if (parameters['table'])
		{
			parameters['headers'] = parameters['headers'].split(',');
		}

		var html = Appcelerator.Compiler.getHtml(element);
		if (parameters['rowOn'] !='')
			parameters['rowOn'] = 'on="'+parameters['rowOn']+'"';
		if (parameters['table'])
		{
			html = '<tr '+parameters['rowOn']+' class="#{iterator_row_class}">'+html+'</tr>';
		}
		parameters['template'] = Appcelerator.Compiler.compileTemplate(html,true,'init_'+element.id);

		var compile = !!(!parameters['on'] && parameters['items']);

		return {
			'presentation' : '',
			'position' : Appcelerator.Compiler.POSITION_REPLACE,
			'parameters': parameters,
			'wire' : true,
			'compile' : compile
		};
	}
};


Appcelerator.Widget.register('app:iterator',Appcelerator.Widget.Iterator);
