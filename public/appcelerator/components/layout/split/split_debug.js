Appcelerator.UI.registerUIComponent('layout','split',
{
	path: null,
	
	setPath:function(p)
	{
		this.path = p;
	},
	/**
	 * The attributes supported by the layouts. This metadata is 
	 * important so that your layout can automatically be type checked, documented, 
	 * so the IDE can auto-sense the widgets metadata for autocomplete, etc.
	 */
	getAttributes: function()
	{
		var T = Appcelerator.Types;
		return [
			{
				name: 'mode', 
				optional: true, 
				description: 'orientation of split layout (horizontal or vertical)', 
				defaultValue: 'horizontal',
			 	type: T.enumeration('vertical', 'horizontal')
			},
			{
				name: 'initial', 
				optional: true, 
				description: 'initial width of left/top pane', 
				defaultValue: '200',
			 	type: T.integer
			},
			{
				name: 'splitterWidth', 
				optional: true, 
				description: 'width of splitter', 
				defaultValue: '8',
			 	type: T.integer
			},
			{
				name: 'gripper', 
				optional: true, 
				description: 'show the gripper on the splitter or not', 
				defaultValue: true,
			 	type: T.bool
			},
			{
				name: 'ghosting', 
				optional: true, 
				description: 'make the splitter ghost during dragging', 
				defaultValue: false,
			 	type: T.bool
			},
			{
				name: 'splitterBg', 
				optional: true, 
				description: 'background color of the splitter', 
				defaultValue: '#d1d1d1',
			 	type: T.string
			},
			{
				name: 'splitterDragBorder', 
				optional: true, 
				description: 'border of the splitter during drag', 
				defaultValue: '1px dotted #111',
			 	type: T.string
			},
			{
				name: 'splitterDragBg', 
				optional: true, 
				description: 'background color of the splitter during drag', 
				defaultValue: '#444',
			 	type: T.string
			},
			{
				name: 'gripperImage', 
				optional: true, 
				description: 'splitter gripper image', 
				defaultValue: null,
			 	type: T.string
			}
		];
	},
	/**
	 * The version of the layout. This will automatically be corrected when you
	 * publish the component.
	 */
	getVersion: function()
	{
		// leave this as-is and only configure from the build.yml file 
		// and this will automatically get replaced on build of your distro
		return '3.0.0';
	},
	/**
	 * The layout spec version.  This is used to maintain backwards compatability as the
	 * Widget API needs to change.
	 */
	getSpecVersion: function()
	{
		return 1.0;
	},
	getActions: function()
	{
		return ['open','close','toggle','resize'];
	},
	getConditions: function()
    {
        return ['opened','closed','resized'];
    },
	max:function(a,b)
	{
		return (a > b) ? a : b;
	},
	min:function(a,b)
	{
		return (a < b) ? a : b;
	},
	resize:function(id,options,data,scope,version,attrs,direction,action)
	{
		var container = $(id);
		var size = parseInt(data['size']);
		var splitter = $(id + '_splitter');
		var splitterWidth = parseInt(options['splitterWidth']);
		var left = splitter.previous('div.splitpane');
		var right = splitter.next('div.splitpane');
		var args = {duration:0.3};
		switch(options['mode'])
		{
			case 'horizontal':
			{
				var pos=parseInt(Element.getStyle(splitter,'left')||0);
				pos += size;
				pos = this.max(pos,0);
				pos = this.min(pos,Element.getWidth(container)-splitterWidth);
				new Effect.Parallel([
					new Effect.Morph(splitter,
					{
						style:'left:' + pos + 'px'
					}),
					new Effect.Morph(left,
					{
						style:'width:' + pos + 'px'
					}),
					new Effect.Morph(right,
					{
						style:'left:'+ (pos + splitterWidth)+'px'
					})
				],args);
				break;
			}
			case 'vertical':
			{
				var pos=parseInt(Element.getStyle(splitter,'top')||0);
				pos += size;
				pos = this.max(pos,0);
				pos = this.min(pos,Element.getHeight(container)-splitterWidth);
				new Effect.Parallel([
					new Effect.Morph(splitter,
					{
						style:'top:'+pos+'px'
					}),
					new Effect.Morph(left,
					{
						style:'height:' + pos + 'px'
					}),
					new Effect.Morph(right,
					{
						style:'top:'+(pos + splitterWidth)+'px'
					})
				],args);
				break;
			}
		}
		Appcelerator.Compiler.fireCustomCondition(id, 'resized', {
			'id': id
		});
	},
	toggle:function(id,options)
	{
		var splitter = $(id + '_splitter');
		switch(options['mode'])
		{
			case 'horizontal':
			{
				var pos=parseInt(Element.getStyle(splitter,'left')||0);
				if (pos > 0)
				{
					this.close(id,options);
				}
				else
				{
					this.open(id,options);
				}
				break;
			}
			case 'vertical':
			{
				var pos=parseInt(Element.getStyle(splitter,'top')||0);
				if (pos > 0)
				{
					this.close(id,options);
				}
				else
				{
					this.open(id,options);
				}
				break;
			}
		}
	},
	close:function(id,options)
	{
		var splitter = $(id + '_splitter');
		var splitterWidth = parseInt(options['splitterWidth']);
		var right = splitter.next('div.splitpane');
		var args = {duration:0.3};
		switch(options['mode'])
		{
			case 'horizontal':
			{
				var pos=parseInt(Element.getStyle(splitter,'left')||0);
				splitter.rememberedLeftPosition = pos;
				new Effect.Parallel([
					new Effect.Morph(splitter,
					{
						style:'left:0'
					}),
					new Effect.Morph(right,
					{
						style:'left:'+splitterWidth+'px'
					})
				],args);
				break;
			}
			case 'vertical':
			{
				var pos=parseInt(Element.getStyle(splitter,'top')||0);
				rememberedTopPosition = pos;
				new Effect.Parallel([
					new Effect.Morph(splitter,
					{
						style:'top:0'
					}),
					new Effect.Morph(right,
					{
						style:'top:'+splitterWidth+'px'
					})
				],args);
				break;
			}
		}		
		Appcelerator.Compiler.fireCustomCondition(id, 'closed', {
			'id': id
		});
	},
	open:function(id,options)
	{
		var splitter = $(id + '_splitter');
		var splitterWidth = parseInt(options['splitterWidth']);
		var right = splitter.next('div.splitpane');
		var args = {duration:0.3};
		switch(options['mode'])
		{
			case 'horizontal':
			{
				var rememberedLeftPosition = splitter.rememberedLeftPosition || parseInt(options['initial']);
				new Effect.Parallel([
					new Effect.Morph(splitter,
					{
						style:'left:'+rememberedLeftPosition+'px'
					}),
					new Effect.Morph(right,
					{
						style:'left:'+(rememberedLeftPosition+splitterWidth)+'px'
					})
				],args);
				break;
			}
			case 'vertical':
			{
				var rememberedTopPosition = splitter.rememberedTopPosition || parseInt(options['initial']);
				new Effect.Parallel([
					new Effect.Morph(splitter,
					{
						style:'top:'+rememberedTopPosition+'px'
					}),
					new Effect.Morph(right,
					{
						style:'top:'+(rememberedTopPosition+splitterWidth)+'px'
					})
				],args);
				break;
			}
		}
		Appcelerator.Compiler.fireCustomCondition(id, 'opened', {
			'id': id
		});
	},
	/**
	 * This is called when the layout is loaded and applied for a specific element that 
	 * references (or uses implicitly) the layout.
	 */
	build:  function(container,options)
	{
		var left = container.down('div');
		var right = left.next('div');
		
		var gripper = Boolean(options['gripper']);
		
		function calculateHeight()
		{
			if (container.parentNode == document.body)
			{
				return (window.innerHeight||document.body.clientHeight) + 'px';
			}
			return Element.getHeight(container.parentNode) + 'px';
		}
		
		container.style.position='relative';
		container.style.margin = '0';
		container.style.padding = '0';
		container.style.overflow = 'hidden';
		container.style.height = calculateHeight();

		
		Event.observe(window,'resize',function()
		{
			container.style.height = calculateHeight();
			if (gripper)
			{
				switch(options['mode'])
				{
					case 'horizontal':
					{
						splitterImage.style.top = (Element.getHeight(splitter) * .45)+ 'px';
						break;
					}
					case 'vertical':
					{
						var imageSize = Element.getWidth(splitterImage);
						var top = (splitterWidth - 10)*.5;
						splitterImage.style.left = (Element.getWidth(splitterContainer)*.5) - (imageSize*.5) + 'px';
						splitterImage.style.top = (Element.getHeight(splitterImage) * .5)  + top +'px';
						break;
					}
				}
			}
		});	

		var splitterWidth = parseInt(options['splitterWidth']);
		
		var splitter = document.createElement('div');
		splitter.id = container.id + '_splitter';
		
		var initial = parseInt(options['initial']);
		
		Element.setStyle(splitter,{
			'width':splitterWidth+'px',
			'backgroundColor':options['splitterBg'],
			'top':'0',
			'position':'absolute',
			'left': initial + 'px',
			'bottom':'0',
			'cursor':'col-resize',
			'height':'100%'
		});

		var gripperImage = null;
		
		if (gripper)
		{
			gripperImage = options['gripperImage'];
			if (!gripperImage)
			{
				switch(options['mode'])
				{
					case 'horizontal':
					{
						gripperImage = Appcelerator.URI.absolutizeURI('split/images/h_grabber.gif',this.path);
						break;
					}
					case 'vertical':
					{
						gripperImage = Appcelerator.URI.absolutizeURI('split/images/v_grabber.gif',this.path);
						break;
					}
				}
			}
			else
			{
				gripperImage = Appcelerator.URI.absolutizeURI(gripperImage, Appcelerator.ImagePath);
			}
		}
		
		splitter.innerHTML='<div>' + (gripper ? '<img src="' + gripperImage + '"/>' : '') + '</div>';
		
		new Insertion.After(left,splitter);
		var splitterContainer = splitter.down('div');

		splitterContainer.style.margin='0';
		splitterContainer.style.padding='0';
		splitterContainer.style.height=splitterWidth+'px';
		
		if (gripper)
		{
			var splitterImage = splitter.down('img');
			splitterImage.style.position = 'relative';
			if (options['mode']=='horizontal')
			{
				splitterImage.style.top = (Element.getHeight(splitter) * .45) + 'px';
				splitterImage.style.left = (splitterWidth * .3)  + 'px';
			}
			else
			{
				splitterImage.style.position='absolute';
				splitterImage.style.top = '2px';
				splitterImage.onload=function()
				{
					var imageSize = Element.getWidth(splitterImage);
					var top = (splitterWidth - 10)*.5;
					splitterImage.style.left = (Element.getWidth(splitterContainer)*.5) - (imageSize*.5) + 'px';
					splitterImage.style.top = (Element.getHeight(splitterImage) * .5)  + top +'px';
				};

				splitterContainer.style.textAlign='center';
				splitterContainer.style.position = 'relative';
				splitterContainer.style.margin = 'auto';
				splitterContainer.style.width = Element.getWidth(container) + 'px';
			}
		}
		
		Event.observe(splitter,'dblclick',function(){
			this.toggle(container.id,options);
		}.bind(this));
		
		
		left.style.position='absolute';
		left.style.overflow = 'auto';

		right.style.position='absolute';
		right.style.overflow = 'auto';
		// make the right panel able to cover the left one (or bottom/top)
		right.style.zIndex = parseInt(Element.getStyle(left,'z-index') || 0) + 1;

		var splitterBg = Element.getStyle(splitter,'background-color');
		
		var eventHandler = 
		{
			onStart: function(eventName, draggable, event) 
			{
				draggable.element.style.border = options['splitterDragBorder'];
				draggable.element.style.backgroundColor = options['splitterDragBg'];
			},
			onDrag: function(eventName, draggable, event) 
			{
				this.drop(draggable.element);
			},
			onEnd: function(eventName, draggable, event) 
			{
				this.drop(draggable.element);
				draggable.element.style.border = '';
				draggable.element.style.backgroundColor = splitterBg;
				Appcelerator.Compiler.fireCustomCondition(container.id, 'resized', {
					'id': container.id
				});
			},
			drop:function(element) 
			{
				position();
			},
			setHorizontal:function(firstDivWidth, secondDivWidth, secondDivLeft, splitterLeft) 
			{
				Element.setStyle(right,{width:secondDivWidth+'px',left:secondDivLeft+'px'});
				Element.setStyle(left,{width:firstDivWidth+'px'});
				Element.setStyle(splitter, {left:splitterLeft+'px'});
				Element.setStyle(splitterContainer, {left:0});	
			},
			setVertical:function(firstDivHeight, secondDivHeight, secondDivTop, splitterTop) 
			{
				Element.setStyle(right,{height:secondDivHeight+'px',top:secondDivTop+'px'});
				Element.setStyle(left,{height:firstDivHeight+'px'});
				Element.setStyle(splitter, {top:splitterTop+'px'});
				Element.setStyle(splitterContainer, {top:0});
			}
		};		

		function position()
		{
			var dimensions = Element.getDimensions(container);
			var basePosition = Position.positionedOffset(splitter);
			if (options['mode']=='horizontal')
			{
				var div2NewLeft = basePosition[0]+splitterWidth;	
				var padding = Element.getStyle(right,'padding') || 0 + Element.getStyle(right,'padding-right') || 0 + Element.getStyle(right,'padding-left') || 0;
				var div1Width = basePosition[0];
				var div2Width = dimensions.width-(div1Width+splitterWidth+padding);
				eventHandler.setHorizontal(div1Width, div2Width, div2NewLeft, div2NewLeft-splitterWidth);
			}
			else
			{
				var div1Height = basePosition[1];
				var padding = Element.getStyle(right,'padding') || 0 + Element.getStyle(right,'padding-top') || 0 + Element.getStyle(right,'padding-bottom') || 0;
				var div2NewTop = basePosition[1]+ splitterWidth;	
				var div2Height = dimensions.height-(div1Height+splitterWidth+padding);
				eventHandler.setVertical(div1Height, div2Height, div2NewTop, basePosition[1]);
			}
		};

		if (options['mode'] == 'horizontal')
		{
			left.style.top='0';
			left.style.bottom='0';
			left.style.left='0';
			left.style.width= initial + 'px';

			right.style.top='0';
			right.style.bottom='0';
			right.style.left= initial+splitterWidth+'px';
			right.style.right='0';
		}
		else
		{
			left.style.top='0';
			left.style.height=initial+'px';
			left.style.left= '0';
			left.style.right='0';

			right.style.top=initial+splitterWidth+'px';
			right.style.bottom='0';
			right.style.left= '0';
			right.style.right='0';
			
			Element.setStyle(splitter,{
				'height':splitterWidth+'px',
				'backgroundColor':options['splitterBg'],
				'position':'absolute',
				'top': initial +'px',
				'bottom':'0',
				'left':'0',
				'right':'0',
				'cursor':'row-resize',
				'width':'100%'
			});
		}
		Element.addClassName(left,'splitpane');
		Element.addClassName(right,'splitpane');
		
		var draggable = new Draggable(splitter,{
			ghosting: options['ghosting'],
			constraint: options['mode']
		});
		
		Droppables.add(left);
		Droppables.add(right);		
		
		Draggables.addObserver(eventHandler);
		position();
	}
});
