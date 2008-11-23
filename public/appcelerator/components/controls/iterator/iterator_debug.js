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

(function($)
{
	var iterator = AppC.create(
	{
		getAttributes:function()
		{
			var T = AppC.Types;
			return [
						{name: 'model', optional: true, type: T.object, description: "Set model for iterator"},
						{name: 'template', optional: true, type: T.string, description: "Set the template for each row"},
						{name: 'items', optional: true, type: T.json, description: "reference to array within row"},
						{name: 'property', optional: true, type: T.string, description: "Property for implicit model"}
					];
		},
		render:function(el,options)
		{
			if (!this.htmlTemplate)
			{
				// save it off for re-rendering
				this.htmlTemplate = $(el).html();
			}
			
			var template = $.unescapeXML(options.template || this.htmlTemplate || '');
			var compiledTemplate = AppC.compileTemplate(template);
			
			var model = options.model || options.items || [];
			
			if (options.property)
			{
				model = $.getNestedProperty(model,options.property);
			}
			
			var html = '';
			
			if (typeof(model) == 'object' && typeof(model.push)!='function')
			{
				model = [model];
			}
			
			var count = 0;
			var length = model.length;
			
			while ( count < length )
			{
				var row = model[count];
				if (typeof(row)!='object')
				{
					row = {'iterator_value': row};
				}
	
				row.iterator_row_index = count++;
				row.iterator_row_length = length;
				row.iterator_odd_even = (row.iterator_row_index%2==0) ? 'even' : 'odd';

				html+= compiledTemplate(row);
			}
			
			$(el).html(html).trigger('rendered',this);
		}
	});


	AppC.register('control','iterator',
	{
		create:function()
		{
			return new iterator;
		}
	});
	
})(jQuery);

