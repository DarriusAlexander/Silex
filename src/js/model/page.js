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
 * @fileoverview
 *   This class represents a the page model of the html file being edited
 *   It has methods to manipulate the pages
 *
 *   All model classes are singletons
 *
 * FIXME: use jquery only to access the pageable-plugin, not when google closure could be used
 */


goog.provide('silex.model.Page');

goog.require('silex.types.Model');
goog.require('silex.Config');

/**
 * @constructor
 * @param  {silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.Page = function(model, view) {
  this.model = model;
  this.view = view;
  // retrieve the element which will hold the body of the opened file
  this.iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
};



/**
 * constant for the class name of the pages
 * @const
 * @type {string}
 */
silex.model.Page.PAGE_CLASS_NAME = 'page-element';


/**
 * constant for the class name of elements visible only on some pages
 * @const
 * @type {string}
 */
silex.model.Page.PAGED_CLASS_NAME = 'paged-element';


/**
 * constant for the class name of elements when it is in a visible page
 * this css class is set in pageable.js
 * @const
 * @type {string}
 */
silex.model.Page.PAGED_VISIBLE_CLASS_NAME = 'paged-element-visible';


/**
 * constant for the class name of links when it links to a visible page
 * this css class is set in pageable.js
 * @const
 * @type {string}
 */
silex.model.Page.PAGE_LINK_ACTIVE_CLASS_NAME = 'page-link-active';


/**
 * retrieve the first parent which is visible only on some pages
 * @return null or the element or one of its parents which has the css class silex.model.Page.PAGED_CLASS_NAME
 */
silex.model.Page.prototype.getParentPage = function(element) {
  var parent = element.parentNode;
  while (parent && !goog.dom.classes.has(parent, silex.model.Page.PAGED_CLASS_NAME)) {
    parent = parent.parentNode;
  }
  return parent;
};


/**
 * @return {Element} the body element of the iframe
 */
silex.model.Page.prototype.getWindow = function() {
  return goog.dom.getFrameContentWindow(this.iframeElement);
}


/**
 * get the pages from the dom
 * @return {Array<string>} an array of the page names I have found in the DOM
 */
silex.model.Page.prototype.getPages = function() {
  // retrieve all page names from the head section
  var pages = [];
  elements = this.getWindow().document.querySelectorAll('a[data-silex-type="page"]');
  goog.array.forEach(elements, function(element) {
    pages.push(element.getAttribute('id'));
  }, this);
  return pages;
};


/**
 * get the currently opened page from the dom
 * @return {string} name of the page currently opened
 */
silex.model.Page.prototype.getCurrentPage = function() {
  var bodyElement = this.getWindow().document.body;
  var pageName = this.getWindow().jQuery(bodyElement).pageable('option', 'currentPage');
  return pageName;
};


/**
 * open the page
 * this is a static method, a helper
 * @param {string} pageName   name of the page to open
 */
silex.model.Page.prototype.setCurrentPage = function(pageName) {
  var bodyElement = this.getWindow().document.body;
  this.getWindow().jQuery(bodyElement).pageable({currentPage: pageName});
  // refresh the view
  var pages = this.getPages();
  this.view.pageTool.redraw([], this.getWindow().document, pages, pageName);
  this.view.propertyTool.redraw([], this.getWindow().document, pages, pageName);
  this.view.stage.redraw([], this.getWindow().document, pages, pageName);
};


/**
 * get a page from the dom by its name
 * @param  {string} pageName  a page name
 * @return {silex.utils.Page} the page corresponding to the given page name
 */
silex.model.Page.prototype.getDisplayName = function(pageName) {
  var displayName = '';
  var pageElement = this.getWindow().document.getElementById(pageName);
  if (pageElement) {
    displayName = pageElement.innerHTML;
  }
  return displayName;
}


/**
 * remove a page from the dom
 * @return the {Element} elements which are only in this page (they probably should be deleted?)
 */
silex.model.Page.prototype.removePage = function(pageName) {
  var bodyElement = this.getWindow().document.body;
  // remove the DOM element
  var elements = this.getWindow().document.querySelectorAll('a[data-silex-type="page"]');
  goog.array.forEach(elements, function(element) {
    if (element.getAttribute('id') === pageName) {
      goog.dom.removeNode(element);
    }
  }, this);
  // remove the links to this page
  var elements = this.getWindow().document.querySelectorAll('*[data-silex-href="#!' + pageName + '"]');
  goog.array.forEach(elements, function(element) {
    element.removeAttribute('data-silex-href');
  }, this);
  // check elements which were only visible on this page
  // and returns them in this case
  var elementsOnlyOnThisPage = [];
  var elements = goog.dom.getElementsByClass(pageName, this.getWindow().document.body);
  goog.array.forEach(elements, function(element) {
    goog.dom.classes.remove(element, pageName);
    var pagesOfElement = this.getPagesForElement(element);
    if (pagesOfElement.length <= 0){
      //this.getWindow().jQuery(this).removeClass(silex.model.Page.PAGED_CLASS_NAME);
      elementsOnlyOnThisPage.push(element);
    }
  }, this);
  // find default first page
  var pages = this.getPages(this.getWindow());
  // open default page
  this.setCurrentPage(pages[0]);

  return elementsOnlyOnThisPage;
};


/**
 * add a page to the dom
 * @param {string} name
 * @param {string} displayName
 */
silex.model.Page.prototype.createPage = function(name, displayName) {
  var bodyElement = this.getWindow().document.body;
  // create the DOM element
  var aTag = goog.dom.createElement('a');
  aTag.setAttribute('id', name);
  aTag.setAttribute('data-silex-type', 'page');
  aTag.innerHTML = displayName;
  goog.dom.appendChild(bodyElement, aTag);
  // for coherence with other silex elements
  goog.dom.classes.add(aTag, silex.model.Page.PAGE_CLASS_NAME);
  // select this page
  this.setCurrentPage(name);
};


/**
 * rename a page in the dom
 */
silex.model.Page.prototype.renamePage = function(oldName, newName, newDisplayName) {
  var bodyElement = this.getWindow().document.body;
  // update the DOM element
  var elements = this.getWindow().document.querySelectorAll('a[data-silex-type="page"]');
  goog.array.forEach(elements, function(element) {
    if (element.getAttribute('id') === oldName) {
      element.setAttribute('id', newName);
      element.innerHTML = newDisplayName;
    }
  }, this);
  // update the links to this page
  var elements = this.getWindow().document.querySelectorAll('*[data-silex-href="#!' + oldName + '"]');
  goog.array.forEach(elements, function(element) {
      element.setAttribute('data-silex-href', '#!' + newName);
  }, this);
  // update the visibility of the compoents
  var elements = goog.dom.getElementsByClass(oldName, this.getWindow().document.body);
  goog.array.forEach(elements, function(element) {
    goog.dom.classes.swap(element, oldName, newName);
  }, this);
  // select this page
  this.setCurrentPage(newName);
};


/**
 * set/get a the visibility of an element in the given page
 */
silex.model.Page.prototype.addToPage = function(element, pageName) {
  goog.dom.classes.add(element, pageName);
  goog.dom.classes.add(element, silex.model.Page.PAGED_CLASS_NAME);
};

/**
 * set/get a "silex style link" on an element
 */
silex.model.Page.prototype.removeFromPage = function(element, pageName) {
  goog.dom.classes.remove(element, pageName);
  if (!this.getPagesForElement(element).length>0){
    goog.dom.classes.remove(element, silex.model.Page.PAGED_CLASS_NAME);
  }
};


/**
 * set/get a "silex style link" on an element
 */
silex.model.Page.prototype.removeFromAllPages = function(element) {
  var pages = this.getPagesForElement(element);
  goog.array.forEach(pages, function (pageName) {
    goog.dom.classes.remove(element, pageName);
  }, this);
  // the element is not "paged" anymore
  goog.dom.classes.remove(element, silex.model.Page.PAGED_CLASS_NAME);
};


/**
 * set/get a "silex style link" on an element
 */
silex.model.Page.prototype.getPagesForElement = function(element) {
  var res = [];
  // get all the pages
  var pages = this.getPages();
  for (idx in pages) {
    var pageName = pages[idx];
    // remove the component from the page
    if (goog.dom.classes.has(element, pageName)){
      res.push(pageName);
    }
  }
  return res;
};

/**
 * check if an element is in the given page (current page by default)
 */
silex.model.Page.prototype.isInPage = function(element, opt_pageName) {
  var bodyElement = this.getWindow().document.body;
  if (!opt_pageName){
    opt_pageName = this.getCurrentPage(bodyElement);
  }
  return goog.dom.classes.has(element, opt_pageName);
}
