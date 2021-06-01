// This file is part of Pa11y Dashboard.
//
// Pa11y Dashboard is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Pa11y Dashboard is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Pa11y Dashboard.  If not, see <http://www.gnu.org/licenses/>.
'use strict';

const _ = require('underscore');
const moment = require('moment');
const presentTask = require('../view/presenter/task');
const presentResult = require('../view/presenter/result');
const presentResultList = require('../view/presenter/result-list');

module.exports = route;

// Route definition
function route(app) {
	app.express.get('/', (request, response, next) => {
		app.webservice.tasks.get({lastres: true}, (error, tasks) => {
			if (error) {
				return next(error);
			}
			// console.log(tasks);
			app.webservice.tasks.results({}, (error, results) => {
				if (error) {
					return next(error);
				}
				const presentedResults = presentResultList(results.map(presentResult));
				
				const resultsByDay = _.groupBy(presentedResults, result => {
					return moment(result.date).format('YYYY-MM-DD');
				});
				var tot_errors_daywise = 0;
				var tot_notices_daywise = 0;
				var tot_warnings_daywise = 0;
				var tot_total_daywise = 0;
				var tot_count ={};
				var totalpresentedResults = [];
				var overall_date = "";
				_.keys(resultsByDay).forEach(day => {
					resultsByDay[day].forEach(function(resultByDay){
						if(resultByDay.count){
							tot_errors_daywise+=resultByDay.count.error;
							tot_notices_daywise+=resultByDay.count.notice;
							tot_warnings_daywise+=resultByDay.count.warning;
							tot_total_daywise+=resultByDay.count.total;
						}
						overall_date = resultByDay.date; 
					});
					tot_count = { date:overall_date,total: tot_total_daywise, error: tot_errors_daywise, warning: tot_warnings_daywise, notice: tot_notices_daywise }
					totalpresentedResults.push(tot_count);
					tot_errors_daywise = 0;
					tot_notices_daywise = 0;
					tot_warnings_daywise = 0;
					tot_total_daywise = 0;
				});
				var tot_errors = 0;
				var tot_warnings = 0;
				var tot_notices = 0;
				var tot_date = "";
				var result = [];
				tasks.forEach(function(task) {
					if(task.last_result){
						if(task.last_result.count){
							tot_errors+=task.last_result.count.error;
							tot_warnings+=task.last_result.count.warning;
							tot_notices+=task.last_result.count.notice;
						}
						if(task.last_result.date > tot_date) {
							tot_date = task.last_result.date;
						}
						if(task.last_result.date){
							result[task.last_result.date] = task.last_result;


						}
					}
				});
				var total = {"date":tot_date,"errors":tot_errors, "warnings":tot_warnings, "notices":tot_notices};
				response.render('index', {
					results: totalpresentedResults,
					hasOneResult: (totalpresentedResults < 2),
					total: total,
					tasks: tasks.map(presentTask),
					deleted: (typeof request.query.deleted !== 'undefined'),
					isHomePage: true
				});
			});
		});
	});
}
