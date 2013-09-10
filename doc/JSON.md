JSON representation of a web form



Form Responses - Section

A JSON response contains up to 2 root elements

 "section-header" contains information
 # "section-body" contains an array of form elements, with information about each.


Each element of the results array contains information for the browser to render the form in HTML.

Each element may contain the following fields:

**id** contains a unique stable identifier denoting this field. It will be used as the key when passing user inputs to the server.

**type** describes the input type this element represents

List of supported types

* label
* text
* file
* email
* radio
* checkbox
* textarea