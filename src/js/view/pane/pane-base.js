//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

/**
 * @fileoverview This is the pane's base class
 * Property panes displayed in the property tool box.
 * Controls the params of the selected component.
 *
 */


goog.provide('silex.view.pane.PaneBase');

/**
 * base class for all UI panes of the view.pane package
 * @constructor
 *
 * @param {Element} element   container to render the UI
 * @param  {silex.types.View} view  view class which holds the other views
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 */
silex.view.pane.PaneBase = function (element, view, controller) {
  // store references
  this.element = element;
  this.view = view;
  this.controller = controller;
};


/**
 * base url for relative/absolute urls
 */
silex.view.pane.PaneBase.prototype.baseUrl;


/**
 * {bool} flag to prevent redraw while changing a value myself
 *        this is true when the user has used the toolbox to change a value,
 *        while the call to notify the controller is processed
 */
silex.view.pane.PaneBase.prototype.iAmSettingValue;


/**
 * {bool} flag to prevent notifying the controller while changing a value myself
 *        this is true during redraw
 *        it is useful because setting a value of an input element
 *        automatically triggers a change event
 */
silex.view.pane.PaneBase.prototype.iAmRedrawing;


/**
 * notify the controller that the style changed
 * @param   styleName   not css style but camel case
 */
silex.view.pane.PaneBase.prototype.styleChanged = function(styleName, opt_styleValue, opt_elements) {
//  if (this.iAmRedrawing) return;
  // notify the controller
  this.iAmSettingValue = true;
  try{
    this.controller.propertyToolController.styleChanged(styleName, opt_styleValue, opt_elements);
  }
  catch(err){
    // error which will not keep this.iAmSettingValue to true
    console.error('an error occured while editing the value', err);
  }
  this.iAmSettingValue = false;
  console.warn('styleChanged done');
};


/**
 * notify the controller that a property has changed
 * @param   propertyName   property name, e.g. 'src'
 */
silex.view.pane.PaneBase.prototype.propertyChanged = function(propertyName, opt_propertyValue, opt_elements, opt_applyToContent) {
  if (this.iAmRedrawing) return;
  // notify the controller
  this.iAmSettingValue = true;
  try{
    this.controller.propertyToolController.propertyChanged(propertyName, opt_propertyValue, opt_elements, opt_applyToContent);
  }
  catch(err){
    // error which will not keep this.iAmSettingValue to true
    console.error('an error occured while editing the value', err);
  }
  this.iAmSettingValue = false;
};


/**
 * refresh the displayed data
 * @param   {Array<element>} selectedElements the elements currently selected
 * @param   {HTMLDocument} document  the document to use
 * @param   {Array<string>} pageNames   the names of the pages which appear in the current HTML file
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.pane.PaneBase.prototype.redraw = function(selectedElements, document, pageNames, currentPageName) {
  if (!selectedElements){
    throw(new Error('selection array is undefined'));
  }
/*
  // to be placed in all redraw methods to avoid loops
  if (this.iAmSettingValue) return;
  this.iAmRedrawing = true;
  this.iAmRedrawing = false;
*/
};


/**
 * get the common property of a group of elements
 * @return  the value or null if the value is not the same for all elements
 */
silex.view.pane.PaneBase.prototype.getCommonProperty = function(elements, getPropertyFunction) {
  var value = null;
  var hasCommonValue = true;
  var isFirstValue = true;
  goog.array.forEach(elements, function (element) {
    var elementValue = getPropertyFunction(element);
    if (isFirstValue){
      isFirstValue = false;
      // init value
      value = elementValue;
    }
    else{
      // check if there is a common type
      if(elementValue !== value){
        hasCommonValue = false;
      }
    }
  }, this);
  if(hasCommonValue === false){
    value = null;
  }
  return value;
};
