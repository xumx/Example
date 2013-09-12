// Avoid `console` errors in browsers that lack a console.
(function() {
	var method;
	var noop = function() {};
	var methods = [
		'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
		'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
		'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
		'timeStamp', 'trace', 'warn'
	];
	var length = methods.length;
	var console = (window.console = window.console || {});

	while (length--) {
		method = methods[length];

		// Only stub undefined methods.
		if (!console[method]) {
			console[method] = noop;
		}
	}
}());

// Place any jQuery/helper plugins in here.
jQuery.fn.closestNext = function(selector) {
	var current = $(this);
	var abort = false;
	while (!abort) {
		if (current.next().length == 0) {
			abort = true;
			current = $([]);
		} else {
			current = current.next();
			if (current.is(selector)) {
				abort = true;
			}
		}
	}
	return current;
};

function checkDifference() {
	$.get('https://202.161.46.10:83/api/field/', function(data) {

		var server = _(data).map(function(row) {
			return row.field_id
		});


		$.get('https://202.161.46.10:83/resources/Client/template/form.json', function(data) {
			var ids = [];

			_.each(data.intro, function(row) {
				if (row.field_id) {
					ids.push(row.field_id)
				}
			})

			_.each(data.sections, function(section) {
				_.each(section.fields, function(field) {
					if (_.isArray(field)) {
						_.each(field, function(row) {
							if (row.field_id) {
								ids.push(row.field_id)
							}
						})
					} else {
						if (field.field_id) {
							ids.push(field.field_id)
						}
					}
				});
			})

			var client = ids;
			console.log("server", server.length, "client", client.length);

			console.log(JSON.stringify(_.difference(client, server), null, '\t'));
			console.log(JSON.stringify(_.difference(server, client), null, '\t'));
		})
	})
}

function checkFieldTypeAccuracy() {
	$.get('https://202.161.46.10:83/api/field/', function(data) {

		var server = _(data).map(function(row) {
			return {
				field_id: row.field_id,
				fieldtypeid_fieldid: row.fieldtypeid_fieldid
			}
		});


		$.get('https://202.161.46.10:83/resources/Client/template/form.json', function(data) {
			var ids = [];

			_.each(data.intro, function(row) {
				if (row.field_id) {

					var payload = {
						field_id: row.field_id,
						fieldtypeid_fieldid: field_type['YES_NO'].fieldID
					}

					ids.push(payload)
				}
			})

			_.each(data.sections, function(section) {

				_.each(section.fields, function(field) {
					if (_.isArray(field)) {

						_.each(field, function(row) {
							if (row.field_id) {

								if (field_type[row.field_type] == undefined) {
									console.log(row.field_id)
								} else {

									var payload = {
										field_id: row.field_id,
										fieldtypeid_fieldid: field_type[row.field_type].fieldID
									}

									ids.push(payload)
								}
							}
						})

					} else {

						if (field.field_id) {

							if (field_type[field.field_type] == undefined) {
								console.log(field.field_id)
							} else {
								var payload = {
									field_id: field.field_id,
									fieldtypeid_fieldid: field_type[field.field_type].fieldID
								}

								ids.push(payload)
							}
						}
					}
				});
			})

			var client = ids;
			console.log("server", server.length, "client", client.length);


			console.log('Difference in Field Type ID')
			_.each(client, function(row) {

				var serverEle = _(server).findWhere({
					field_id: row.field_id
				})

				if (serverEle !== undefined) {
					if (row.fieldtypeid_fieldid !== serverEle.fieldtypeid_fieldid)
						console.log(row.field_id, 'client type:', row.fieldtypeid_fieldid, 'server type:', serverEle.fieldtypeid_fieldid);
				}
			})
		})
	})
}

function donowhat() {
	var count = 0;
	var filtered = [];
	_.each(formJson.sections, function(section, sindex, slist) {
		_.each(section.fields, function(field, index, list) {
			if (_.isArray(field)) {
				if (field.length == 3) {
					if (field[0]['field_type'] == "LABEL_TEXT") {
						field[1]['text'] = field[0]['text'];

						list[index] = [field[1], field[2]];
						console.log('update');
					}
				}
			}
		})
	});
}

window.log = console.log