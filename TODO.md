# Future of translatron

 * remove GD dependencies (canny-cookieManager-lib)
 * write markdown editing support
 
## proposal markdown translation
Implement live markdown editor. Use contenteditable="true" flag.
#### how to provide the translation

###### translate complete page
The editor can write a complete document (with markdown) which will be live shown as HTML page.
The complete document will be exported as ones in one e.g.: key value pair.

**advantages**
 * semantic HTML can be different for each language
 * the creator and translator can live edit the HTML structure and see the result
 * easier to use in FE - the whole markdown export can be included
 
**disadvantages**
 * one key for whole document 
 * html needs to be added in one markdown block to FE (keys can't be separated anymore)
 * configure elements inside the doc is complex and needs special logic on the editor site
   * format currency
   * dynamic content logic
   * links
 * difficult to keep the overview in large documents which are already translated and which not
 
###### translate complete page with single tag exporter
The editor can write a complete document (with markdown) which will be live shown as HTML page.
The document is semantically splitted by tags and will be exported as key value pairs.

**advantages**
 * same semantic in each language - we have a one to one translation
 ** there could also be exception to leave a key out in another language
 * the creator and translator can live edit the HTML structure and see the result
 * the translator can translate each tag separately
 
**disadvantages**
 * semantic HTML can be different for each language
