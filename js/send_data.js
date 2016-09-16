var settings = {       

    // Websocket settings
    // wsHost: "ws://172.16.0.11:32576/",
    teamws: "ws://202.112.51.211:32578/team/",
    //wsHost: "ws://10.254.254.105:32576/",
    psk: "18c989796c61724d4661b019f2779848dd69ae62",
    wsTimeout: 30000
 }


var pause = false;



function team_score_timer() {
    try {
        var teamws = new WebSocket("ws://202.112.51.211:32578/team/");
        teamws.onmessage = function(evt) {
            if(pause)
                return;
            if (!evt) {
                return;
            }
            console.log('incoming');

            var datum = $.parseJSON( evt.data );

            UI.updateTeamData( datum );
        }
        teamws.onclose = function(evt) {
            setTimeout(function(){
                console.log("websocket closed, reconnecting in " + 500 + "ms");
                team_score_timer();
            }, 500);
        }
    } catch(e) {
        setTimeout(team_score_timer, 1000);
    }
}

function team_attack() {
    try {
        var teamws = new WebSocket("ws://202.112.51.211:32576");
        teamws.onmessage = function(evt) {
            if(pause)
                return;
            if (!evt) {
                return;
            }
            console.log('incoming');
            var datum = $.parseJSON( evt.data );
            var startTeam = getNumberByTeamName( datum.attack );
            var endTeam   = getNumberByTeamName( datum.victim );
            var service   = getNumberByServiceName( datum.service );
            var type      = getNumberByTypeName( datum.type );
            var timestamp = Math.floor( datum.ctime );

            // console.log(datum.type);
            // console.log(type);
            XCTF.attack( startTeam,endTeam,service,type );
            UI.attack( startTeam, endTeam, service, type );
            

            // XCTF_ScoreBoard.team_score = translateTeamId(datum);
            // XCTF.statsManager.redraw();
        }
        teamws.onclose = function(evt) {
            setTimeout(function(){
                console.log("websocket closed, reconnecting in " + 500 + "ms");
                team_attack();
            }, 500);
        }
    } catch(e) {
        setTimeout(team_attack, 1000);
    }
}

function service_score_timer() {
    try {
        var teamws = new WebSocket("ws://202.112.51.211:32577/service");
        teamws.onmessage = function(evt) {
            if(pause)
                return;
            if (!evt) {
                return;
            }
            console.log('incoming');

            var datum = $.parseJSON( evt.data );
            // console.log(datum);
            UI.updateServiceData( datum );
        }
        teamws.onclose = function(evt) {
            setTimeout(function(){
                console.log("websocket closed, reconnecting in " + 500 + "ms");
                service_score_timer();
            }, 500);
        }
    } catch(e) {
        setTimeout(team_score_timer, 1000);
    }
}

function round_timer(){
        try {
        var roundws = new WebSocket("ws://202.112.51.211:32579/round");
        roundws.onmessage = function(evt) {
            if (!evt) {
                return;
            }
            console.log('incoming');

            var datum = $.parseJSON( evt.data );
            // console.log(datum);
            UI.updateRoundData( datum );
        }
        roundws.onclose = function(evt) {
            setTimeout(function(){
                console.log("websocket closed, reconnecting in " + 500 + "ms");
                round_timer();
            }, 500);
        }
    } catch(e) {
        setTimeout(round_timer, 1000);
    }
}

function start(){

    UI.init();

    XCTF.init( {
        callback: function(){

            service_score_timer();
            team_score_timer();
            team_attack();
            round_timer();

        },
        progress: {
            set: function( value ) {
                $( '.progressBar' ).width( value );
            },
            remove: function(){
                $( '.progressMask' ).hide();
            }
        }
    } );

}

$('.playBtn').click(function(event) {

    $(this).hide().siblings().show();
    pause = false;

});

$('.stopBtn').click(function(event) {

    $(this).hide().siblings().show();
    pause = true;

});


$(function() {

    start();

});
