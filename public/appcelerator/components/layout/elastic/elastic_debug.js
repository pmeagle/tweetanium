Appcelerator.UI.registerUIComponent('layout','elastic',
{
	/**
	 * The attributes supported by the layouts. This metadata is 
	 * important so that your layout can automatically be type checked, documented, 
	 * so the IDE can auto-sense the widgets metadata for autocomplete, etc.
	 */
	getAttributes: function()
	{
		var T = Appcelerator.Types;
		return [];
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
	/**
	 * This is called when the layout is loaded and applied for a specific element that 
	 * references (or uses implicitly) the layout.
	 */
	build:  function(element,options)
	{
		function calculate()
		{
			if (element == document.body || element.parentNode == document.body)
			{
				element.style.height = (window.innerHeight||document.body.clientHeight) + 'px';
			}
			else
			{
				element.setStyle(element,{height:Element.getHeight(element.parentNode)+'px'});
			}
		}
		Event.observe(window,'resize',calculate);
		calculate();
	}
});
