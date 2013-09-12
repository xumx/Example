var GET_FORMSAVE = '../../../api/formsave/',
	DELETE_FORMSAVE = '../../../api/formsave/delete/',

	GET_FORMSAVE_COMPLETE_DAY = '../../../api/formsave/getdaystats/complete/',
	GET_FORMSAVE_COMPLETE_WEEK = '../../../api/formsave/getweekstats/complete/',
	GET_FORMSAVE_COMPLETE_MONTH = '../../../api/formsave/getmonthstats/complete/',
	GET_FORMSAVE_INCOMPLETE_DAY = '../../../api/formsave/getdaystats/incomplete/',
	GET_FORMSAVE_INCOMPLETE_WEEK = '../../../api/formsave/getweekstats/incomplete/',
	GET_FORMSAVE_INCOMPLETE_MONTH = '../../../api/formsave/getmonthstats/incomplete/';

var scope;

function controller($scope) {
	scope = $scope;
	scope.formsavelist;

	scope.viewformsave = function(reference) {
		console.log(reference);
		$('#anchor-iframe iframe').attr('src', '../?id=reference');
	};

	scope.deleteformsave = function(reference) {
		console.log('delete', reference);
		$.post(DELETE_FORMSAVE + reference, function (response) {
			// $('.datatable').empty();
			$.get(GET_FORMSAVE, function(data) {

				scope.formsavelist = data;
				scope.$apply();
				var oTable = $('.datatable').dataTable();
				oTable.fnDraw();
				// $('.datatable').dataTable({
				// 	"sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span12'i><'span12 center'p>>",
				// 	"sPaginationType": "bootstrap",
				// 	"oLanguage": {
				// 		"sLengthMenu": "_MENU_ records per page"
				// 	}
				// });
			})

			console.log(response);
		});
	}

	switch (location.pathname.match('.+/(.+html)')[1]) {
		case "rocket-formsave.html":
			$.get(GET_FORMSAVE, function(data) {

				scope.formsavelist = data;
				scope.$apply();

				$('.datatable').dataTable({
					"sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span12'i><'span12 center'p>>",
					"sPaginationType": "bootstrap",
					"oLanguage": {
						"sLengthMenu": "_MENU_ records per page"
					}
				});
			})
			break;


		case "rocket-feedback.html":
			$.get(GET_FEEDBACK, function(data) {
				scope.feedbacklist = data;
				scope.$apply();
			});
			break;


		case "rocket-document.html":
			$('.file-manager').elfinder({
				url: '../../../api/connector',
				loadTmbs: 0,
				//sync: 5000,
				commands: ['open', 'reload', 'home', 'up',
					'back', 'forward', 'getfile', 'quicklook',
					'download', 'rm', 'duplicate', 'rename',
					'mkdir', 'mkfile', 'copy', 'cut', 'paste',
					'edit', 'extract', 'archive', 'search',
					'info', 'view', 'help', 'resize', 'sort'
				],
				// handlers: {
				// 	preview: function(event, elfinderInstance) {
				// 		console.log(event.data);
				// 		console.log(event.data.selected);
				// 	}
				// },
				dragUploadAllow: false
			});

			break;

		case "rocket-form-builder.html":
			break;

		case "rocket-custom-document.html":
			break;
	}
}