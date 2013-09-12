var dev = (location.hash === '#dev');

var FORM_JSON_PATH = '',
	FORM_SAVE_PATH = '../../api/form/save/',
	FORM_RESUME_PATH = '../../api/form/resume/',
	FORM_SUBMIT_PATH = '../../api/form/submit/',
	GENERATE_NEW_ID = '../../api/id/create/',
	FILE_UPLOAD_PATH = '../../api/upload/',
	GET_POSTAL_PATH = '../../api/postal/',
	TEMPLATE_SAVE_PATH = '../../api/template/create/',
	GET_TEMPLATE_PATH = '../../api/template/';

var scope;
var SINGAPORE;
var autocomplete;

var formJson = {};

var customizer = {
	createNewTemplate: function() {
		var result = JSON.stringify(formJson);

		$.post(TEMPLATE_SAVE_PATH, {
			data: result
		}, function(response) {
			console.log(response);
		});
	},

	getForm: function(id) {
		$.get(GET_TEMPLATE_PATH + id + '/', function(data) {
			formJson = data; //TODO
		});
	},

	getNewID: function(callback) {
		$.get(GENERATE_NEW_ID, callback);
	}
}

var helpers = {
	attachLogic: function(data, element, rowElement) {
		var error;

		if (data.checked) {
			scope.form[data.field_id] = true;
		}

		if (data.tooltip) {
			element.tooltip(data.tooltip);
		}

		if (data.typeahead) {
			element.typeahead(data.typeahead);
		}

		if (data.validate) {
			element.attr('pattern', data.validate.pattern);
			error = data.validate.message;

			element[0].oninput = function(e) {
				e.target.setCustomValidity('');
				if (!e.target.validity.valid) {
					e.target.setCustomValidity(error);
				}
			};
		}

		if (data.upload) {
			// element.dropzone(data.upload);
		}

		if (data.field_type == "SINGAPORE_POSTAL") {
			smartPostal(data.field_id, element);
		}

		if (data.field_type == "STREET") {
			element.typeahead({
				source: smartStreet,
				minLength: 2,
				ajaxdelay: 400
			});
		}

		if (data.field_type == "OVERSEAS_ADDRESS") {
			element.typeahead({
				source: smartAddress,
				minLength: 3,
				ajaxdelay: 500
			});
		}

		if (data.field_type == "COMPANY") {
			element.change(smartCompanyAddress);
			element.typeahead({
				source: smartCompany,
				minLength: 2,
				ajaxdelay: 400,
			});
		}

		if (data.field_type == "EMAIL") {
			//help reduce typos in email addresses
			element.on('blur', function() {
				$(this).mailcheck({
					suggested: function(element, suggestion) {
						element.tooltip({
							animation: false,
							placement: 'bottom',
							title: 'Do you mean ' + suggestion.full + ' ?'
						}).tooltip('show');

						setTimeout(function() {
							element.tooltip('destroy');
						}, 5000);
					},
					empty: function(element) {
						// callback code
					}
				});
			});
		}

		if (data.text && data.field_type != "LABEL_TEXT_TITLE" && data.type != "checkbox") {

			var width, label;

			if (data.text.length > 45) {
				width = 'span8'
			} else if (data.text.length > 45) {
				width = 'span6'
			} else {
				width = 'span4'
			}

			label = $('<div>', {
				'class': width,
				'text': data.text
			});

			if (data.required) {
				label.append('<span class="superscript">*</span>');
			}

			label.appendTo(rowElement);
		}

		if (data.dependency) {
			//Default Hide
			element.hide();
			if (label) label.hide();

			_.each(data.dependency, function(dep) {
				scope.$watch('form.' + dep['if'], function(newValue, oldValue) {

					var allTrue = _.every(data.dependency, function(d) {
						return (scope.form[d['if']] === d['is']);
					});

					if (allTrue) {
						element.show();
						if (label) label.show();

						if (data.checked) {
							scope.form[data.field_id] = true;
						}
					} else {
						element.hide();
						if (label) label.hide();

						scope.form[data.field_id] = undefined;
					}
				});
			});
		}
	},
	construct: function(data) {
		var width;

		if (_.has(data, 'field_id')) {
			data['ng-model'] = 'form.' + data['field_id'];
		}

		switch (data.type) {
			case 'checkbox':
				return $('<label class="checkbox">')
					.append($('<input>', data))
					.append($('<label class="checkbox-label">' + data.text + '</label>'));

			case 'file':
				element = $('<div class="btn btn-success span4 fileinput-button" style="margin:5px;"><i class="glyphicon glyphicon-plus"></i><span>Select files...</span><input type="file" name="file"></div>');

				element.find('input').fileupload({
					url: FILE_UPLOAD_PATH,
					dataType: 'json',
					done: function(e, response) {

						_.each(response.result.results, function(value, key) {
							var element = $('#' + key)
							console.log(key);
							if (scope.form[key] === undefined) {
								scope.form[key] = value;
								element.addClass('green');
							}
						});

						scope.$apply();
					},
					formData: [{
						name: 'form_id',
						value: scope.form_id
					}, {
						name: 'section_id',
						value: data.upload.section_id
					}, {
						name: 'document_id',
						value: data.upload.document_id
					}]
				}).prop('disabled', !$.support.fileInput)
					.parent().addClass($.support.fileInput ? undefined : 'disabled');

				window.develement = element;
				return element;

			case 'text':
				return $('<input>', data).addClass("span7 input-underline");

			case 'email':
				return $('<input>', data).addClass("span7 input-underline");

			case 'tel':
				return $('<input>', data).addClass("span7 input-underline");

			case 'textarea':
				return $('<textarea>', data).addClass("input-block-level");

			case 'radio':
				element = $('<div>');

				_.each(data.choices, function(choice) {
					$('<label class="radio inline">')
						.append($('<input>', _.omit(_.extend(data, {
							'value': choice
						}), 'class', 'choices')))
						.append($('<label class="checkbox-label">' + choice + '</label>'))
						.appendTo(element);
				});

				return element;

				// case 'label':
				// 	if (data.text.length > 45) {
				// 		width = 'span6'
				// 	} else {
				// 		width = 'span4'
				// 	}

				// 	return $('<div>', {
				// 		'class': width,
				// 		'text': data.text
				// 	});

			case 'label-header':
				return $('<h3>', {
					'text': data.text
				});
			case 'date':
				return $('<input>', data);

			case 'html':
				return $(data.html);

			case 'linkedin':
				return $('<div class="linkedin-login"><b>Have a LinkedIn profile?</b> <script type="IN/Login"></script> to fill up the form</div>');
		}
	},
	compile: function(json) {
		var section = $('<section class="hide">');

		var header = $('<div class="section-header">')
			.append($('<div class="section-number"><i class="icon-chevron-right icon-white"></i></div>'))
			.append($('<div class="section-title">' + json.title + '</div>'));

		var body = $('<div class="section-body single-column">');

		_.each(json.fields, function(row) {
			var rowElement = $('<div class="row-fluid">');

			//If row is a lone element, put in Array
			if ($.isPlainObject(row)) {
				row = [row];
			}

			_.each(row, function(data) {
				var element;

				if (_.has(field_type, data.field_type)) {
					data = _.defaults(data, field_type[data.field_type])
				}

				element = helpers.construct(data);

				//Dev code
				if (element === undefined) console.log(data);

				helpers.attachLogic(data, element, rowElement);
				element.appendTo(rowElement);

			});

			rowElement.appendTo(body);
		});

		// header.click(function() {
		// 	body.slideToggle();
		// });

		section
			.append(header)
			.append(body);

		if (json.dependency) {
			//Default Skip
			section.addClass('skip');

			_.each(json.dependency, function(dep) {
				scope.$watch('form.' + dep['if'], function(newValue, oldValue) {

					var allTrue = _.every(json.dependency, function(d) {
						return (scope.form[d['if']] === d['is']);
					});

					if (allTrue) {
						section.removeClass('skip');
					} else {
						section.addClass('skip');
					}
				});
			});
		}
		return section;
	}
};

function smartPostal(id, element) {
	scope.$watch('form.' + id, function(newValue, oldValue) {
		if (newValue === undefined) {
			return;
		} else if (newValue.length === 6) {
			$.get(GET_POSTAL_PATH + newValue, function(address) {
				if (address.error) {


				} else {
					var nearestSmartBlock = $(element).parent().closestNext(":has(input[smartfill=block])").find("input[smartfill=block]");
					var nearestSmartstreet = $(element).parent().closestNext(":has(input[smartfill=street])").find("input[smartfill=street]");

					//TODO
					nearestSmartBlock.val(address.streetnumber).addClass('green');
					nearestSmartstreet.val(address.streetname).addClass('green');
				}
			});
		}
	});
}

function smartStreet(query, callback) {
	var result;

	autocomplete.getPlacePredictions({
		input: query,
		componentRestrictions: {
			country: 'sg'
		},
		types: ['geocode']
	}, function(predictions, status) {
		if (status != google.maps.places.PlacesServiceStatus.OK) {
			console.log(status);
		} else {
			console.log(predictions);
			result = _.map(predictions, function(row) {
				if (_.contains(row.types, 'route'))
					return row.terms[0].value;
				return;
			});

			result = _.without(result, undefined);
			callback(result);
		}
	});
}

function smartAddress(query, callback) {
	var result;

	autocomplete.getPlacePredictions({
		input: query
	}, function(predictions, status) {
		if (status != google.maps.places.PlacesServiceStatus.OK) {
			console.log(status);
		} else {
			console.log(predictions);
			result = _.map(predictions, function(row) {
				return row.terms[0].value;
			});

			result = _.without(result, undefined);
			callback(result);
		}
	});
}

function smartCompany(query, callback) {
	var result;

	autocomplete.getPlacePredictions({
		input: query,
		componentRestrictions: {
			country: 'sg'
		},
		types: ['establishment']
	}, function(predictions, status) {
		if (status != google.maps.places.PlacesServiceStatus.OK) {
			console.log(status);
		} else {

			result = _.map(predictions, function(row) {
				return row.description;
			});

			callback(result);
		}
	});
}

function smartCompanyAddress(event) {
	var service = new google.maps.places.PlacesService($('#hidden')[0]);
	var element = $(event.target),
		query = scope.form[element.attr('field_id')],
		postalcode;

	service.textSearch({
		query: query,
		componentRestrictions: {
			country: 'sg'
		},
		types: ['establishment']
	}, function(results, status) {
		var targetElement;

		if (status == google.maps.places.PlacesServiceStatus.OK) {
			service.getDetails(results[0], function(place, status) {
				if (status == google.maps.places.PlacesServiceStatus.OK) {
					console.log(place);
					postalcode = _.last(place.address_components).long_name;

					if (postalcode.length == 6) {
						targetElement = element.parent().closestNext(':has(input[smartfill=postalcode])').find('input[smartfill=postalcode]');
						console.log(targetElement);
						console.log(postalcode);

						scope.form[targetElement.attr('field_id')] = postalcode;
						targetElement.addClass('green');
						scope.$apply();
					}
				}
			});
		}
	});
}

// Angular Controller

function controller($scope, $compile) {
	var sectionList;

	scope = $scope;
	scope.form = {};
	scope.data = {};
	scope.uploadedFiles = [];
	scope.requiredFiles = [];

	scope.dev = dev;

	//Initialize
	SINGAPORE = new google.maps.LatLng(1.3667, 103.82);
	autocomplete = new google.maps.places.AutocompleteService();

	scope.hasPrev = function() {
		var current = $('section:visible');
		return (!scope.isComplete && current.prev().length > 0);
	}

	scope.hasNext = function() {
		var current = $('section:visible');
		return (!scope.isPreview && !scope.isComplete && current.next().length > 0);
	}

	scope.next = function() {
		var current = $('section:visible, .step:visible'),
			next = current.next();

		while (next.hasClass('skip')) {
			next = next.next();
		}

		if (next.length > 0) {
			// has next step
			current.toggleClass('hide');
			next.toggleClass('hide');

			//If this is second last page
			if (current.is('section') && next.next().length == 0) {
				scope.isGoingPreview = true;
			}

		} else {
			// reached the end
			$('.modal').modal('hide');

			if (current.is('.step')) {
				$('section').first().removeClass("hide");
			}
		}
	}

	scope.back = function() {

		if (scope.isPreview) {
			scope.isPreview = false;
		} else {
			var current = $('section:visible, .step:visible'),
				prev = current.prev();

			while (prev.hasClass('skip')) {
				prev = prev.prev();
			}

			if (prev.length > 0) {
				// has prev step
				current.toggleClass('hide');
				prev.toggleClass('hide');
				console.log(prev);
			}

			if (current.is('section') && next.next().length == 0) {
				scope.isGoingPreview = true;
			}
		}

		$scope.$apply();
	}

	scope.preview = function() {

		scope.isGoingPreview = false;
		scope.isPreview = true;

		$('section:not(.skip)').removeClass("hide");

		// $('section:not(.skip)').slideToggle(500);
		$('input:visible')
			.addClass('preview')
			.tooltip('destroy');

		$('textarea:visible').addClass('preview');

		$('input.preview:invalid')
			.first()
			.focus();

		$('.section-number').remove();

		$('.section-header')
			.css('background-color', 'white')
			.css('margin-top', '20px');

		$('.section-title')
			.css('color', 'black')
			.css('font-size', '1.3em');


		// $('.multi-column')
		// 	.removeClass('multi-column')
		// 	.addClass('single-column');
	}

	scope.submit = function() {
		scope.isPreview = false;

		$('section:not(.skip)').slideToggle(500);

		var isValid = _.every($('input:visible'), function(e) {
			return e.validity.valid
		});

		if (isValid) {
			var payload = {
				uploaded_file: scope.uploadedFiles,
				form_id: scope.form_id,
				json: scope.form
			}

			if (scope.referenceNumber) {
				payload.referenceNumber = scope.referenceNumber;
			}

			$.post(FORM_SUBMIT_PATH, payload, function(response) {
				if (response.success) {

				} else {
					console.log(response);
					$('.alert .message').text(response.error);
					$('.alert').show().alert();
				}
			});

			window.onbeforeunload = undefined;

			$('.sections-container').empty();
			$('.sections-container').append('<div class="row-fluid" style="margin:50px auto;"><div class="text-center"><div class="lead"><span>Thank you for signing up with Standard Chartered Bank</span><div>Your application is currently under review</div><br><br><p>Reference Number #' + scope.referenceNumber + '</p></div><p>Should you require further assistance, you may contact us at our 24-hour Phone Banking Team<br>on 1800 747 7000 or +65 6747 7000 if you are calling us from overseas.</p></div></div>');

			$scope.$apply();

		} else {
			$('input.preview:invalid')
				.first()
				.focus();
		}
	}

	scope.set = function(id, value, $event) {
		scope.form[id] = value;

		_.defer(function() {
			scope.next($event);
		});
	}

	scope.save = function() {
		//Prep data
		var payload = {
			uploaded_file: scope.uploadedFiles,
			form_id: scope.form_id,
			json: scope.form
		}

		if (scope.referenceNumber) {
			payload.referenceNumber = scope.referenceNumber;
		}

		$.post(FORM_SAVE_PATH, payload, function(response) {
			if (response.error) {
				console.log(error);
			} else {
				console.log(response)
				scope.referenceNumber = response.referenceNumber;
			}
		});
	}

	scope.resume = function(key) {
		if (key === undefined) key = scope.referenceNumber;

		$.get(FORM_RESUME_PATH + key, function(response) {
			_.defaults(scope.form, response);
			scope.$apply();
		});
	}

	scope.adminResume = function(key) {
		if (key === undefined) key = scope.referenceNumber;

		$.get(FORM_RESUME_PATH + key, function(response) {
			_.defaults(scope.form, response);
			scope.preview();
			scope.$apply();
		});
	}

	scope.loadDefault = function() {
		_.defaults(scope.form, {
			"8Ig3JPi2ANU99BD7O1fe6M": true,
			"49CaSPzsAth99GhMASCvxb": true,
			"d25YZHBN4R8aSjQ675MB4r": "Father",
			"73ffYh6C42k97HKHPoPN20": "Huang Shen Zhi",
			"7w4nbdaaQdO8SYLPebIpkW": "Richard Huang",
			"dNIheqz5kQhbboZTFMvqgU": "G3456778T",
			"2qa9q6uqAWC8y9bn6B4urS": "Malaysian",
			"eJ6hDUzzABDbkpLtzUpQkW": "Singapore",
			"dmmycr4T4ETaDEDWcyuGHj": "Malaysia",
			"bMaix4La4DQ8faWaF8Swf3": "64004537",
			"5u2qhwRAQwe8ds9FwwXIyO": "64624537",
			"bkp1rkOlAabagaP9OxEZI4": "87564537",
			"1NvuuCGAQ3i8IpZB7rdiqH": "is480rockets@gmail.com",
			"9sHq3ujNAy88fTCwbha5lk": "NTU",
			"b3L8s3W4kn48W8iMV2hmFm": "Software Engineer",
			"blSIO9RNQo19tSHOwJHtj3": "20000",
			"d4I6FsZmA6Bbp1XnB2zBdf": "639798",
			"8jSqlqZNAngbulddnJdvr1": "86",
			"6BD4Wbulk1ibAGXDPixydU": "08-09",
			"fmolKtKgkZn8DXvu9JyNCr": "Ang Mo Kio Ave",
			"cz3JQZvN4NfbV9CQLFHQkU": "Sunshine Building",
			"coPtD1k7AYVbaGExdMKjQO": true,
			"brbK4AJqkSb9bIrTUmdjp9": true,
			"7PbUh9izQ1G8XNbX0fNwjs": true,
			"bVzhWsY6Qgi8afMwYbmKOG": true,
			"ewNQ13rGAcXbYpif3HhGDH": "Shen Zhi Huang",
			"6CKh3bRvkTSbiRrAasuGx4": "G3890267X",
			"fzJOQiRLAzQbrjwqvUaOd4": "Singaporean",
			"1xLu7gSRkWp8ccqvftD5gf": "Singapore",
			"fYJQTad5A11bjjE6bQ8zf0": "Singapore",
			"7BwzbXTR4rabgJ3nGLMTcR": "567000",
			"pHA2KVQAzw8EJZ9OPJevU": "20",
			"2GR53EvaAzFbVziMmVmYmK": "03-03",
			"e3wEtnIA4nj9iiNtVkva2i": "Ang Mo Kio Ave 1",
			"5AOzTM0HkVQ8Insa8tURVh": "Palm Lodge",
			"bHZyJytz4Z18lkH8NPzgOp": "90123845",
			"qd6TE8yQELar6gAOAcxVZ": "78103245",
			"c4sZgluj4fMbOPqISvLr6Q": "+65 6420 1800",
			"19b5WvJkAs6bzbWwPrQrCr": "exploredakota@gmail.com",
			"2H96dn9DQmnbeo2xOh32M9": "Creative Technology Ltd Singapore",
			"ehSS2Hgd4zLb9ya1kWNx5g": "178901",
			"3trNc1d4Qlz8xG0TUJTaNC": "Assistant Business Analyst",
			"3AJaFyxsQra8RdmyslJqTw": "30000",
			"4DtWtmAbkCHa4JRyHlC94m": "80",
			"1H7IIi6A4cfbE9tSBnrIHs": "#03-02",
			"2vxtEhDIko08dcp90YtJZV": "Stamford Road",
			"5C8APAqB469bvm93yvIBG0": "School of Information Systems",
			"3vabAHeak2m8CfO4LIaNbG": "Richard Huang",
			"1t41j5ly4a5bhfIACG363I": "Wong Jia Chen",
			"4kGrTqq6kFV8IgpPmLnzjy": "5",
			"3SWNUVb4kBG8lJQgZqCAeJ": "10",
			"eJqjiZkNkxIaZ1PEHwb0xF": "189-2-3048",
			"8Ijrtv2Uk599U4H9PcqHBF": "198-9-2013",
			"6SwsRG0lAOAbDpfcrNzdy0": "Tan Zhi Ying",
			"bosQuuTzArn8h98sjXeTIK": "Sister",
			"4VzdbsVt457abxYiqclaQz": "193802",
			"3kkAJQ9ZQ6b8zZRkLZsDdE": "8",
			"bQ8oYGgiA0DaVCDtlRU963": "1304",
			"9OEswbNdQdT9gO0cNToSUc": "Yio Chu Kang Road",
			"3NrCAHAkQ6ebmdLnF783CL": "Hillside Building",
			"fWKARU6IkIYbTfNW6uJF0v": "+65 8908 1756",
			"bdvi6eNV4bi8mvpcUM5IIc": "Kathay Chen"
		});
	}

	//Load as a whole form
	loadForm('template/form.json');

	function loadIntro(json) {
		var modal = $('<div class="modal">'),
			body = $('<div class="modal-body">');

		_.each(json, function(step) {
			var panel = $('<div>', {
				'class': 'hide step'
			});

			if (step.title) {
				$('<div class="lead text-center">').text(step.title).appendTo(panel);
			}

			if (step.field_id) {
				$('<button>', {
					'class': 'btn btn-large btn-block btn-primary yes',
					'text': 'Yes',
					'ng-click': 'set("' + step.field_id + '", true, $event)'
				}).appendTo(panel);

				$('<button>', {
					'class': 'btn btn-large btn-block no',
					'text': 'No',
					'ng-click': 'set("' + step.field_id + '", false, $event)'
				}).appendTo(panel);
			}

			if (step.html) {
				$(step.html).appendTo(panel);
			}

			if (step.document) {
				scope.requiredFiles.push(step.document);

				// element = $('<div>', {
				// 	'class': 'dropzone dz-square'
				// }).dropzone({
				// 	"url": FILE_UPLOAD_PATH,
				// 	"uploadMultiple": false,
				// 	"acceptedFiles": 'image/*',
				// 	"headers": {
				// 		"form_id": scope.form_id,
				// 		"section_id": step.document.owner,
				// 		"document_id": step.document.type
				// 	},
				// 	// "error": function (file, errorMessage, serverError) {
				// 	// 	console.log(errorMessage);
				// 	// 	console.log(serverError);
				// 	// },
				// 	"success": function(file, response) {
				// 		console.log(response);

				// 		_.each(response.results, function(value, key) {
				// 			var element = $('#' + key)

				// 			if (scope.form[key] === undefined) {
				// 				scope.form[key] = value;
				// 				element.addClass('green');
				// 			}
				// 		});

				// 		$('#alert-autofill').show();

				// 		//dev need to test
				// 		// scope.uploadedFiles.push(response.filepath);
				// 		// _.find(scope.requiredFiles, step.document).filepath = response.filepath;

				// 		scope.next();
				// 		scope.$apply();

				// 		return file.previewElement.classList.add("dz-success");
				// 	}
				// });

				// element.appendTo(panel);
			}

			if (step.field_id === undefined) {
				$('<button>', {
					'class': 'btn btn-large btn-primary btn-block',
					'text': 'Next',
					'ng-click': 'next($event)'
				}).appendTo(panel);
			}


			if (step.dependency) {
				//Default Skip
				panel.addClass('skip');

				_.each(step.dependency, function(dep) {
					scope.$watch('form.' + dep['if'], function(newValue, oldValue) {

						var allTrue = _.every(step.dependency, function(d) {
							return (scope.form[d['if']] === d['is']);
						});

						if (allTrue) {
							panel.removeClass('skip');
						} else {
							panel.addClass('skip');
						}
					});
				});
			}

			$compile(panel)($scope).appendTo(body);
		});

		body.find('.step').first().removeClass('hide');

		modal.append(body)
			.appendTo('body')
			.modal({
				backdrop: dev ? 'true' : 'static'
			});
	}

	function loadForm(path) {
		$.getJSON(path, function(data) {
			var intro = data.intro,
				sections = data.sections;

			if (dev) formJson = _.defaults(data);

			$scope.form_id = data.form_id;

			for (var i = 0; i < sections.length; i++) {
				$('.sections-container').append($compile(helpers.compile(sections[i]))($scope));
			}

			//If Resume Form
			if (location.search.search('id=') > 0) {
				scope.resume(location.search.match('id=([^&]+)')[1]);
				$('section')
					.first()
					.removeClass("hide");
			} else {
				loadIntro(intro);
			}

			$scope.$apply();


			initialize();
		});
	}

	function initialize() {
		if (dev) {
			$('.main').css('float', 'right');


			//Builder Code
			scope.componentList = _(field_type).map(function(obj, key) {
				var element = helpers.construct(obj);
				return {
					type: key,
					handle: _.string.titleize(key.toLowerCase().replace('_', ' ')),
					element: element[0]
				}
			});

			scope.$apply();

			$('.componentList > div').draggable({
				connectToSortable: ".section-body",
				helper: "clone",
				cursor: 'move',
				revert: "invalid",
				appendTo: 'body'
			});

			$('#components legend').click(function(event) {
				$(event.target).next().slideToggle();
			});

			$('.section-body').sortable({
				items: '.row-fluid',
				placeholder: "sortable-placeholder",
				cursor: 'move'
			}).bind('sortupdate', function(event, data) {

				var typeIndex, type, sectionIndex, rowIndex, payload, text;

				typeKey = data.item.attr('type');

				console.log(typeIndex);

				type = field_type[typeKey];

				text = "Sample Label";

				customizer.getNewID(function(id) {

					payload = [{
							"field_type": "LABEL_TEXT",
							"text": text
						},
						type
					]

					//get section's index 
					sectionIndex = data.item.parents('section').index();

					//get row index within section
					rowIndex = data.item.index();

					console.log(payload);

					//modify json to insert the dropped element into the right place
					formJson.sections[sectionIndex].fields.splice(rowIndex, 0, payload);
				});

				//Pluck out item
				// var item = formJson.sections[0].fields.splice(origin, 1);
			});
		}

		//Handle 'Enter' key press
		//Proceed to next visible input.
		//If there is no visible input, find the next Section and open it. Proceed to find next input.
		$('input,select').keypress(function(event) {
			if (event.keyCode === 13) {
				var nextVisibleInput, nextSection, self = $(event.target);

				nextVisibleInput = self.parent('.row-fluid').nextAll(':has(input:visible)').first().find('input:visible').first();

				if (nextVisibleInput.length) {
					nextVisibleInput.focus();
				} else {
					if (scope.hasNext()) {
						scope.next();
					}
				}

				return false;
			} else {
				return true;
			}
		});


		//Prevent BACKSPACE from navigating back
		$(document).on("keydown", function(e) {
			if (e.which === 8 && !$(e.target).is("input, textarea")) {
				e.preventDefault();
				scope.back();
				scope.$apply();
			}
		});

		$(document).on("keydown", function(e) {
			if (e.which === 13 && !$(e.target).is("input, textarea")) {
				e.preventDefault();
				scope.next();
				scope.$apply();
			}
		});

		//Auto save once every 2 minutes
		scope.save();
		setInterval(function() {
			console.log('autosaving');
			scope.save();
		}, 120000);
	}
}

//LinkedIn Functions

function onLinkedInLoad() {
	IN.Event.on(IN, "auth", onLinkedInAuth);
}

function onLinkedInAuth() {
	//var result = [];
	//phoneNumber, recentPosition, companyName and email are the value for the four fields to fill in
	var phoneNumber;
	var recentEdu;
	var recentPosition;
	var companyName;
	var educationsCol;
	var positionsCol;
	var email;
	var phoneCol;

	$('.linkedin-login').hide();

	IN.API.Profile("me")
		.fields("formattedName,dateOfBirth,emailAddress,phoneNumbers,positions:(title,company:(name),endDate),educations:(schoolName,degree,endDate)")
		.result(function(me) {
			IN.User.logout();

			result = {};
			me = me.values[0];

			console.log(me);

			result.email = me.emailAddress;

			if (me.educations._total) {
				result.education = me.educations.values[0].degree;
			}

			if (me.dateOfBirth) {
				_.defaults(me.dateOfBirth, {
					year: 0
				})

				console.log('date of birth from linkedin ', me.dateOfBirth);
				result.dateOfBirth = _.template("{{year}}-{{month}}-{{day}}")(me.dateOfBirth);
			}

			if (me.formattedName) {
				result.fullname = me.formattedName;
			}

			//retrieve phoneNumber value from result returned by linkedin 
			if (me.phoneNumbers._total) {
				_.each(me.phoneNumbers.values, function(phone) {
					if (phone.phoneType == "mobile") {
						result.mobile = phone.phoneNumber;
					}
					if (phone.phoneType == "work") {
						result.work = phone.phoneNumber;
					}
					if (phone.phoneType == "home") {
						result.home = phone.phoneNumber;
					}
				});
			}

			//from linkedin position result returned
			//there are two fields need to fill: occupation and name of employer aka company name
			positionsCol = me.positions;
			if (positionsCol._total == 1) {
				recentPosition = positionsCol.values[0].title;
				companyName = positionsCol.values[0].company.name;
			} else if (positionsCol._total > 0) {
				var mostRecentYr = 0;
				var mostRecentMon = 0;
				var hasRecent = false;
				for (var i = 0; i < positionsCol._total; i++) {
					var tempObj = positionsCol.values[i];
					if (!tempObj.endDate || 0 === tempObj.endDate.length) {
						companyName = tempObj.company.name;
						recentPosition = tempObj.title;
						hasRecent = true;
					} else if ((tempObj.endDate.year > mostRecentYr && hasRecent == false) || (tempObj.endDate.year == mostRecentYr && tempObj.endDate.month > mostRecentMon && hasRecent == false)) {
						mostRecentYr = tempObj.endDate.year;
						mostRecentMon = tempObj.endDate.month;
						companyName = tempObj.company.name;
						recentPosition = tempObj.title;
					}
				}
			}

			//educations logic pending for further confirmation
			if (me.educations) {
				result.education = me.education;
			}


			console.log(result);


			smartfill('date-of-birth', result.dateOfBirth);

			smartfill('fullname', result.fullname);
			smartfill('email', result.email);
			smartfill('home-phone', result.home);
			smartfill('work-phone', result.work);
			smartfill('mobile-phone', result.mobile);
			smartfill('company', companyName);
			//smartfill('occupation', recentPosition);

			scope.$apply();

			function smartfill(type, data) {

				if (data !== undefined) {
					console.log(data);
					var smartField = $("input[smartfill=" + type + "]").first();

					var id = smartField.attr('field_id')
					scope.form[id] = data;

					smartField.addClass('green');

					if (type === 'company') {
						smartField.trigger('change');
						// smartField.trigger('input');
					}
				}
			}
		});
}

if (!dev) {
	window.onbeforeunload = function() {
		scope.save();
		return "Your form data will be lost.";
	};
}