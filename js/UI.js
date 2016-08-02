/**
 * @author hujiulong / http://hujiulong.com/
 */
var UI = function () {

	var eventsBox  = $('.ui-datatable-events');
	var sourceBox  = $('.ui-datatable-source');
	var targetBox  = $('.ui-datatable-target');
	var serviceBox = $('.ui-datatable-service');

	var eventsTable  = eventsBox.find('.attack-table tbody');
	var sourceTable  = sourceBox.find('.attack-table tbody');
	var targetTable  = targetBox.find('.attack-table tbody');
	var serviceTable = serviceBox.find('.attack-table tbody');
	var roundBoard = $('.ui-round h3');

	function initSourceTable(){

		for(var i=0;i<teamsOption.teamNum;i++){
			var rowHtml = '<tr class="row" data-number="'+teamsOption.teamData[i].number+'">'+
				            '<td class="cell number"><img src="'+'img/logo/'+teamsOption.teamData[i].logo+'" class="team-logo"></td>'+
				            '<td class="cell">'+teamsOption.teamData[i].name+'</td>'+
				            '<td class="cell count">0</td>'+
				            '<td class="cell flag">0</td>'+
				            '<td class="cell score">0</td>'+
				          '</tr>';
			sourceTable.append($(rowHtml));
		}
		sourceBox.height( sourceTable.find('tr').height()*teamsOption.teamNum + 74);
	}
	function initTargetTable(){

		for(var i=0;i<teamsOption.teamNum;i++){
			var rowHtml = '<tr class="row" data-number="'+teamsOption.teamData[i].number+'">'+
				            '<td class="cell number"><img src="'+'img/logo/'+teamsOption.teamData[i].logo+'" class="team-logo"></td>'+
				            '<td class="cell">'+teamsOption.teamData[i].name+'</td>'+
				            '<td class="cell count">0</td>'+
				            '<td class="cell flag">0</td>'+
				            '<td class="cell score">0</td>'+
				          '</tr>';
			targetTable.append($(rowHtml));
		}

		targetBox.height( targetTable.find('tr').height()*teamsOption.teamNum + 74);
	}
	function initServiceTable(){

		var colors = [
			'rgb(255, 165, 101)',
			'rgb(101, 255, 109)',
			'rgb(101, 196, 255)',
			'rgb(101, 255, 135)',
			'rgb(101, 255, 147)'
		];
		for(var i=0;i<teamsOption.serviceNum;i++){
			var rowHtml = '<tr link-hover="source" class="row" data-number="'+(i+1)+'">'+
				            '<td class="cell"><span style="color: '+colors.pop()+';" >◯</span>'+teamsOption.serviceData[i]+'</td>'+
				            '<td class="cell count">0</td>'+
				            '<td class="cell num1">0</td>'+
				            '<td class="cell num2">0</td>'+
				            '<td class="cell num3">0</td>'+
				          '</tr>';
			serviceTable.append($(rowHtml));
		}
	}

	function getTime() {

		var myDate = new Date();
		var hours = myDate.getHours();
		var minutes = myDate.getMinutes();
		var second = myDate.getSeconds();
		return (hours<10?'0'+hours:hours) + ':' + (minutes<10?'0'+minutes:minutes) + ':' + (second<10?'0'+second:second);
	}

	function sortCompare( a, b ){
		var va = parseInt($(a).find('.score').text());
		var vb = parseInt($(b).find('.score').text());
		if( va < vb )
			return 1;
		if( va > vb )
			return -1;
		return 0;		
	}

	function createEventRow ( attacker, defender, serviceNum, status ){

		var rowHtml = '<tr class="row">'+
			            '<td class="cell number">'+getTime()+'</td>'+
			            '<td class="cell">'+teamsOption.teamData[attacker-1].name+'</td>'+
			            '<td class="cell">'+teamsOption.teamData[defender-1].name+'</td>'+
			            '<td class="cell">'+teamsOption.serviceData[serviceNum-1]+'</td>'+
			            '<td class="cell">'+
			           	(status?'<span class="success">进攻成功</span>':'<span class="failed">防御成功</span>')+
			            '</td>'+
			          '</tr>';
          
		return $(rowHtml);
	}

	function updateTeamData ( data ){

		for( var name in data ){
			var number = getNumberByTeamName(name);
			var sourceRow = sourceTable.find('tr[data-number="'+number+'"]');
			var sourceFlagCell = sourceRow.find('.flag');
			var sourceScoreCell = sourceRow.find('.score');

			sourceFlagCell.text( data[name].gain_flag );
			sourceScoreCell.text( data[name].gain_score );

			var targetRow = targetTable.find('tr[data-number="'+number+'"]');
			var targetFlagCell = targetRow.find('.flag');
			var targetScoreCell = targetRow.find('.score');

			targetFlagCell.text( data[name].loss_flag );
			targetScoreCell.text( data[name].loss_score );
		}

		var sourceAllRows = $('.ui-datatable-source .attack-table tbody tr');
		var targetAllRows = $('.ui-datatable-target .attack-table tbody tr');

		sourceAllRows.sort( sortCompare );
		sourceTable.empty().append( sourceAllRows );

		targetAllRows.sort( sortCompare );
		targetTable.empty().append( targetAllRows );

	}

	function updateTeamCount( attacker, defender ){

		var sourceRow = sourceTable.find('tr[data-number="'+attacker+'"]');
		var sourceCountCell = sourceRow.find('.count');
		sourceCountCell.text( parseInt(sourceCountCell.text()) +  1 );

		var targetRow = targetTable.find('tr[data-number="'+defender+'"]');
		var targetCountCell = targetRow.find('.count');
		targetCountCell.text( parseInt(targetCountCell.text()) +  1 );
	}

	function updateServiceData ( data ){
		for( var name in data ){
			var number = getNumberByServiceName( name );
			var serviceRow = serviceTable.find('tr[data-number="'+number+'"]');

			serviceRow.find('.num1').text( data[name].loss_flag );
			serviceRow.find('.num2').text( data[name].loss_flag_team );
			serviceRow.find('.num3').text( data[name].gain_flag_team );
		}
	}

	function updateServiceCount( number ){
		var serviceRow = serviceTable.find('tr[data-number="'+number+'"]');
		serviceRow.find('.count').text( parseInt(serviceRow.find('.count').text()) + 1 );
	}

	function updateRoundData( data ){

		var currentTime = new Data().getTime();
		if( data.start_time == 0 || currentTime < data.start_time ){
			roundBoard.text("尚未开始");
		} else if ( currentTime > data.start_time ){
			roundBoard.text("已经结束");
		} else {
			roundBoard.text("第 "+data.round+" 轮");
		}

	}

	function attack ( attacker, defender, serviceNum, status ) {

		eventsTable.append(createEventRow( attacker, defender, serviceNum, status ));

		updateServiceCount( serviceNum );
		if( !status ){
			updateTeamCount( attacker, defender )
		}

		if( eventsTable.find('tr').length > 9 ){
			eventsTable.find('tr:first').remove();
		}

	}

	return {
		init : function(){
			initSourceTable();
			initTargetTable();
			initServiceTable();
		},
		updateTeamData : function( data ){
			updateTeamData ( data );
		},
		updateServiceData : function( data ){
			updateServiceData ( data );
		},
		attack : function( time, attacker, defender, serviceNum, status ){
			attack( time, attacker, defender, serviceNum, status );
		}
	}
}();